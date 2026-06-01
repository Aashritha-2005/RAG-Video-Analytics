# RAG Video Analytics Chatbot

RAG Video Analytics Chatbot is a full-stack app for comparing a YouTube video and an Instagram Reel with transcript-aware analytics. It extracts video metadata and transcripts, computes engagement rates, embeds transcript chunks locally, and lets you chat with the videos using a local Ollama-powered RAG pipeline.

The backend handles video processing, ChromaDB indexing, and streaming chat responses with citations. The frontend provides a React interface for submitting URLs, comparing performance, and asking follow-up questions.

## Tech Stack

- Python 3.11+
- FastAPI
- LangChain
- ChromaDB
- Ollama
- youtube-transcript-api
- yt-dlp
- instaloader
- openai-whisper
- React 18
- Vite
- TypeScript
- TailwindCSS
- Zustand
- Lucide React

## Setup

1. Install Ollama, then pull the local chat and embedding models:

```bash
ollama pull llama3 && ollama pull nomic-embed-text
```

2. Set up the backend:

```bash
cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
```

3. Start the backend API:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

4. Start the frontend:

```bash
cd frontend && npm install && npm run dev
```

## Environment

Backend `.env.example` values:

```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3
CHROMA_PERSIST_DIR=./chroma_db
```

Frontend `.env.example` values:

```env
VITE_API_BASE=http://127.0.0.1:8000
```
