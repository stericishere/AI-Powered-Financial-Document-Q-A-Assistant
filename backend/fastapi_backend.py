from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import tempfile
import logging
from typing import Optional, List, Dict
import uuid
from datetime import datetime

# AI/ML imports
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Document
from llama_index.core.node_parser import SimpleNodeParser
from llama_index.core.storage.storage_context import StorageContext
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
import openai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Financial Document Q&A API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class QueryRequest(BaseModel):
    question: str
    document_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[str]
    document_context: Optional[str] = None

class DocumentInfo(BaseModel):
    id: str
    filename: str
    upload_time: datetime
    status: str
    page_count: Optional[int] = None

# Global storage for documents and indices
documents_storage: Dict[str, Dict] = {}
indices_storage: Dict[str, VectorStoreIndex] = {}

# Initialize LLM settings
def initialize_llm():
    """Initialize the LLM with OpenAI API key"""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logger.warning("OPENAI_API_KEY not found in environment variables")
        return None
    
    # Configure LlamaIndex settings
    Settings.llm = OpenAI(
        model="gpt-3.5-turbo",
        api_key=openai_api_key,
        temperature=0.1
    )
    
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        api_key=openai_api_key,
        temperature=0.1
    )

# Initialize LangChain prompt template for financial documents
FINANCIAL_PROMPT_TEMPLATE = """
You are a financial document analysis assistant. You have access to financial documents and should provide accurate, specific answers based on the document content.

Context from financial documents:
{context}

User Question: {question}

Instructions:
1. Analyze the provided context carefully
2. Provide specific, accurate answers based on the financial data
3. If exact figures are mentioned, include them in your response
4. If the information is not available in the context, clearly state that
5. For financial terms, provide brief explanations when helpful
6. Format numerical values clearly (e.g., currency, percentages)

Answer:
"""

financial_prompt = PromptTemplate(
    input_variables=["context", "question"],
    template=FINANCIAL_PROMPT_TEMPLATE
)

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    global llm_chain
    try:
        llm = initialize_llm()
        if llm:
            llm_chain = LLMChain(llm=llm, prompt=financial_prompt)
            logger.info("LLM initialized successfully")
        else:
            logger.error("Failed to initialize LLM - check OpenAI API key")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Financial Document Q&A API is running"}

@app.post("/upload", response_model=Dict[str, str])
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload and process a financial document"""
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Generate unique document ID
        doc_id = str(uuid.uuid4())
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Store document info
        documents_storage[doc_id] = {
            "id": doc_id,
            "filename": file.filename,
            "upload_time": datetime.now(),
            "status": "processing",
            "file_path": tmp_file_path,
            "page_count": None
        }
        
        # Process document in background
        background_tasks.add_task(process_document, doc_id, tmp_file_path)
        
        return {
            "document_id": doc_id,
            "filename": file.filename,
            "status": "uploaded",
            "message": "Document uploaded successfully and is being processed"
        }
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

async def process_document(doc_id: str, file_path: str):
    """Background task to process the uploaded document"""
    try:
        logger.info(f"Processing document {doc_id}")
        
        # Create temporary directory for the document
        temp_dir = tempfile.mkdtemp()
        
        # Copy file to temp directory with original name
        import shutil
        doc_info = documents_storage[doc_id]
        dest_path = os.path.join(temp_dir, doc_info["filename"])
        shutil.copy2(file_path, dest_path)
        
        # Load and parse document with LlamaIndex
        reader = SimpleDirectoryReader(input_dir=temp_dir)
        documents = reader.load_data()
        
        # Create vector index
        index = VectorStoreIndex.from_documents(documents)
        
        # Store the index
        indices_storage[doc_id] = index
        
        # Update document status
        documents_storage[doc_id].update({
            "status": "ready",
            "page_count": len(documents)
        })
        
        # Clean up temporary files
        os.unlink(file_path)
        shutil.rmtree(temp_dir)
        
        logger.info(f"Document {doc_id} processed successfully")
        
    except Exception as e:
        logger.error(f"Processing error for {doc_id}: {str(e)}")
        documents_storage[doc_id]["status"] = "error"

@app.post("/query", response_model=QueryResponse)
async def query_document(request: QueryRequest):
    """Query a processed document"""
    try:
        # If no document_id provided, try to use the most recent document
        doc_id = request.document_id
        if not doc_id:
            if not documents_storage:
                raise HTTPException(status_code=400, detail="No documents available")
            doc_id = max(documents_storage.keys(), key=lambda k: documents_storage[k]["upload_time"])
        
        # Check if document exists and is ready
        if doc_id not in documents_storage:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc_info = documents_storage[doc_id]
        if doc_info["status"] != "ready":
            raise HTTPException(status_code=400, detail=f"Document status: {doc_info['status']}")
        
        # Get the index for this document
        if doc_id not in indices_storage:
            raise HTTPException(status_code=500, detail="Document index not found")
        
        index = indices_storage[doc_id]
        
        # Create query engine
        query_engine = index.as_query_engine(
            response_mode="compact",
            similarity_top_k=3
        )
        
        # Query the document
        response = query_engine.query(request.question)
        
        # Extract source information
        sources = []
        if hasattr(response, 'source_nodes'):
            sources = [node.node.text[:100] + "..." for node in response.source_nodes[:2]]
        
        # Get document context
        context = str(response.response)
        
        # Use LangChain for enhanced response if available
        try:
            if 'llm_chain' in globals():
                enhanced_response = await llm_chain.arun(
                    context=context,
                    question=request.question
                )
                answer = enhanced_response
            else:
                answer = str(response.response)
        except Exception as e:
            logger.warning(f"LangChain processing failed: {str(e)}")
            answer = str(response.response)
        
        return QueryResponse(
            answer=answer,
            confidence=0.85,  # Placeholder confidence score
            sources=sources,
            document_context=doc_info["filename"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.get("/documents", response_model=List[DocumentInfo])
async def list_documents():
    """List all uploaded documents"""
    return [
        DocumentInfo(
            id=doc_id,
            filename=info["filename"],
            upload_time=info["upload_time"],
            status=info["status"],
            page_count=info.get("page_count")
        )
        for doc_id, info in documents_storage.items()
    ]

@app.get("/documents/{document_id}", response_model=DocumentInfo)
async def get_document_info(document_id: str):
    """Get information about a specific document"""
    if document_id not in documents_storage:
        raise HTTPException(status_code=404, detail="Document not found")
    
    info = documents_storage[document_id]
    return DocumentInfo(
        id=document_id,
        filename=info["filename"],
        upload_time=info["upload_time"],
        status=info["status"],
        page_count=info.get("page_count")
    )

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its index"""
    if document_id not in documents_storage:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove from storage
    del documents_storage[document_id]
    if document_id in indices_storage:
        del indices_storage[document_id]
    
    return {"message": "Document deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)