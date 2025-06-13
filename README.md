# AI Powered Financial Document Q&A Assistant
A full-stack application that allows users to upload PDF financial documents and ask natural language questions about them using AI.

## 🏗️ Architecture
### Backend (Python/FastAPI):

- FastAPI for REST API endpoints
- LlamaIndex for document parsing and indexing
- LangChain for prompt orchestration
- OpenAI API for LLM processing

### Frontend (Next.js/TypeScript):

- Next.js 14 with App Router
- React components with TypeScript
- Tailwind CSS for styling
- Axios for API communication

### 📋 Prerequisites
Python 3.8+
Node.js 18+
OpenAI API key
## 🚀 Quick Start
### Backend Setup
- Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
- Install dependencies:
```bash
pip install -r requirements.txt
```
- Set environment variables:
```
# Create .env file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```
- Run the server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 3000
```
The API will be available at http://localhost:8000



