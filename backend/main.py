import os
import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain.agents import create_csv_agent
from langchain.llms import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",  # Allow Next.js frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for the index and file path
storage = {
    "index": None,
    "file_path": None
}

DATA_DIR = Path("data")
if not DATA_DIR.exists():
    DATA_DIR.mkdir()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads a file, saves it, and creates an index for querying.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    file_path = DATA_DIR / file.filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    storage["file_path"] = str(file_path)

    try:
        llm = OpenAI(temperature=0)
        agent = create_csv_agent(llm, storage["file_path"], verbose=True)
        storage["index"] = agent
        return {"message": f"File '{file.filename}' uploaded and indexed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create index: {e}")


@app.post("/query")
async def query_index(query: str = Form(...)):
    """
    Queries the indexed file with a user-provided question.
    """
    if storage.get("index") is None:
        raise HTTPException(status_code=400, detail="No file has been uploaded and indexed yet.")

    agent = storage["index"]
    try:
        response = agent.run(query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during query: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 