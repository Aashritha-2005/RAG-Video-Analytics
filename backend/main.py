import uuid
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from embedder import embedder
from models import ChatRequest, ProcessResponse, VideoInput
from rag_chain import RAGChain
from video_processor import processor


load_dotenv()

app = FastAPI(
    title="RAG Video Analytics Chatbot",
    description="FastAPI backend for comparing YouTube and Instagram videos with local RAG.",
    version="1.0.0",
)


@app.middleware("http")
async def add_ngrok_header(request, call_next):
    response = await call_next(request)
    response.headers["ngrok-skip-browser-warning"] = "true"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_chain = RAGChain(embedder)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/process", response_model=ProcessResponse)
async def process_videos(payload: VideoInput) -> ProcessResponse:
    session_id = str(uuid.uuid4())
    video_a = processor.process_video(payload.url_a, "A")
    video_b = processor.process_video(payload.url_b, "B")

    try:
        embedder.chunk_and_embed(video_a, video_b, session_id)
        rag_chain.register_session(session_id, video_a, video_b)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to embed video data: {exc}") from exc

    return ProcessResponse(session_id=session_id, video_a=video_a, video_b=video_b)


@app.post("/api/chat/stream")
@app.post("/chat/stream")
async def stream_chat(payload: ChatRequest) -> StreamingResponse:
    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            async for token in rag_chain.stream_response(payload.session_id, payload.message):
                yield f"data: {token}\n\n"
        except Exception as exc:
            yield f"data: [ERROR]{str(exc)}[/ERROR]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/chat")
async def chat(payload: ChatRequest) -> dict:
    answer_parts = []
    async for token in rag_chain.stream_response(payload.session_id, payload.message):
        answer_parts.append(token)
    return {"response": "".join(answer_parts)}
