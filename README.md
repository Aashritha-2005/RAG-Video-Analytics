# RAG Video Analytics Chatbot

RAG Video Analytics Chatbot is a full-stack app for comparing a YouTube video and an Instagram Reel with transcript-aware analytics. It extracts video metadata and transcripts, computes engagement rates, embeds transcript chunks in ChromaDB with HuggingFace BGE embeddings, and lets you chat with the videos using a Groq-powered RAG pipeline.

The backend handles video processing, ChromaDB indexing, and streaming chat responses with citations. The frontend provides a React interface for submitting URLs, comparing performance, and asking follow-up questions.

## Tech Stack

- Python 3.11+
- FastAPI
- LangChain
- ChromaDB
- Groq
- HuggingFace BGE embeddings
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

### Backend
1. Get a free Groq API key: https://console.groq.com
2. cd backend && python -m venv .venv && source .venv/bin/activate
3. pip install -r requirements.txt
4. cp .env.example .env -> fill in GROQ_API_KEY
5. uvicorn main:app --host 127.0.0.1 --port 8000

### Frontend
1. cd frontend && npm install
2. cp .env.example .env -> set VITE_API_BASE to your backend URL
3. npm run dev

### Production
- Backend: deployed on Render (render.yaml included)
- Frontend: deployed on Vercel (connect GitHub repo, set VITE_API_BASE to your Render backend URL in Vercel environment variables)

Render free tier uses ephemeral storage for ChromaDB at `/tmp/chroma_db`, so the vector database resets on each deploy or restart. That is acceptable for a live demo because each processed video pair rebuilds its session index.
