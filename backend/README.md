# RAG Video Analytics Chatbot Backend

FastAPI backend for comparing one YouTube video and one Instagram Reel/Post with local RAG. It extracts transcript and metadata, computes engagement rate, stores transcript chunks in ChromaDB, and streams chat responses from Ollama with citations.

## Features

- Accepts two video URLs: Video A and Video B
- Detects YouTube and Instagram URLs
- Extracts transcripts, captions, and platform metadata
- Falls back to title/description for YouTube when transcripts are unavailable
- Falls back to Whisper transcription for Instagram when captions are missing or too short
- Computes engagement rate as `(likes + comments) / views * 100`
- Chunks transcripts and metadata summaries into local persistent ChromaDB
- Uses Ollama locally for `llama3` chat and `nomic-embed-text` embeddings
- Maintains conversation memory per processed session
- Streams responses over Server-Sent Events and returns citations for retrieved chunks

## Requirements

- Python 3.11+
- Ollama installed and running
- FFmpeg installed for Whisper and audio extraction

Pull the local Ollama models:

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Start the API:

```bash
uvicorn main:app --reload
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

Each SSE event contains a JSON object. Token events look like:

```json
{"token":"..."}
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

Instagram metadata access may depend on public availability and rate limits. Whisper fallback requires downloading audio through `yt-dlp`, so FFmpeg must be available on your system. All LLM and embedding calls are local through Ollama, and no API keys are required.
