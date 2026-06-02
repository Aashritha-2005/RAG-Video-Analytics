# RAG Video Analytics Chatbot Backend

FastAPI backend for comparing one YouTube video and one Instagram Reel/Post with RAG. It extracts transcript and metadata, computes engagement rate, stores transcript chunks in ChromaDB, and streams Groq chat responses with citations.

## Features

- Accepts two video URLs: Video A and Video B
- Detects YouTube and Instagram URLs
- Extracts transcripts, captions, and platform metadata
- Falls back to title/description for YouTube when transcripts are unavailable
- Falls back to yt-dlp metadata and Whisper transcription for Instagram when direct metadata access is blocked
- Computes engagement rate as `(likes + comments) / views * 100`
- Chunks transcripts and metadata summaries into ChromaDB
- Uses Groq `llama-3.3-70b-versatile` for chat
- Uses HuggingFace `BAAI/bge-small-en-v1.5` embeddings in-process
- Maintains conversation memory per processed session
- Streams responses over Server-Sent Events and returns citations for retrieved chunks

## Requirements

- Python 3.11+
- Free Groq API key
- FFmpeg installed for Whisper and audio extraction

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `GROQ_API_KEY` in `.env`, then start the API:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

The service runs at `http://127.0.0.1:8000`.

## API

### Health

```bash
curl http://127.0.0.1:8000/health
```

### Process Videos

```bash
curl -X POST http://127.0.0.1:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "url_a": "https://www.youtube.com/watch?v=VIDEO_ID",
    "url_b": "https://www.instagram.com/reel/SHORTCODE/"
  }'
```

Response includes a `session_id`, `video_a`, and `video_b`.

### Stream Chat

```bash
curl -N -X POST http://127.0.0.1:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID_FROM_PROCESS",
    "message": "Which video had the better hook and why?"
  }'
```

The final streamed content includes a `[CITATIONS]...[/CITATIONS]` payload with `video_id`, `chunk_preview`, and `source` entries.

### Non-Streaming Chat

```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID_FROM_PROCESS",
    "message": "Compare engagement rates."
  }'
```

## Notes

Instagram metadata access may depend on public availability and rate limits. Whisper fallback requires downloading audio through `yt-dlp`, so FFmpeg must be available on your system.

On Render free tier, ChromaDB is configured to use `/tmp/chroma_db`, which is ephemeral. The vector database resets on each deploy or restart, so each demo session should process its videos before chat.
