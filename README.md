# AI-Powered Financial Document Q&A Assistant

This is a full-stack web application that lets users upload financial documents (in CSV format) and ask questions about them.
<img width="1099" alt="Screenshot 2025-06-13 at 14 04 09" src="https://github.com/user-attachments/assets/4bc0a663-7513-4cb0-8b2e-9fa3b5d36e93" />

<img width="1039" alt="Screenshot 2025-06-13 at 14 06 54" src="https://github.com/user-attachments/assets/4ec0dbf5-c7a9-42ab-91f1-71469cc953cc" />



## Tech Stack

- **Backend**: Python, FastAPI, LangChain, LlamaIndex, OpenAI
- **Frontend**: Next.js, TypeScript, React, Tailwind CSS, Axios, React Dropzone

## Project Structure

```
.
├── backend
│   ├── data/              # Stores uploaded files
│   ├── main.py            # FastAPI application
│   └── requirements.txt   # Python dependencies
└── frontend
    ├── src/
    │   └── app/
    │       └── page.tsx   # Main application page
    ├── package.json
    └── ...
```

## Setup and Running the Application

### 1. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Create a `.env` file:**
    Create a file named `.env` in the `backend` directory and add your OpenAI API key:
    ```
    OPENAI_API_KEY="your_openai_api_key_here"
    ```

5.  **Run the backend server:**
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    The backend server will be running at `http://localhost:8000`.

### 2. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install the dependencies:**
    ```bash
    npm install
    ```

3.  **Run the frontend server:**
    ```bash
    npm run dev
    ```
    The frontend development server will be running at `http://localhost:3000`.

### 3. Usage

1.  Open your browser and go to `http://localhost:3000`.
2.  Drag and drop a CSV file into the designated area, or click to select a file.
3.  Once the file is uploaded and processed, you can ask questions about the document in the input field.
4.  Press Enter or click the "Ask" button to get a response from the AI.
5.  The conversation history will be displayed below the input field. 
