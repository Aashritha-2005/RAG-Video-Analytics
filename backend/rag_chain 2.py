import asyncio
import json
import os
from typing import AsyncGenerator, Dict, List

from langchain_groq import ChatGroq
from langchain_core.documents import Document
from langchain_core.messages import AIMessage, HumanMessage

from embedder import Embedder
from models import Citation, VideoMetadata


class RAGChain:
    def __init__(self, embedder_instance: Embedder) -> None:
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
        )
        self.embedder = embedder_instance
        self._histories: Dict[str, List] = {}
        self._session_metadata: Dict[str, dict] = {}

    def register_session(self, session_id: str, video_a: VideoMetadata, video_b: VideoMetadata) -> None:
        self._session_metadata[session_id] = {"A": video_a, "B": video_b}
        self._histories[session_id] = []

    def _build_system_context(self, session_id: str) -> str:
        if session_id not in self._session_metadata:
            raise ValueError(f"Unknown session_id: {session_id}")
        video_a = self._session_metadata[session_id]["A"]
        video_b = self._session_metadata[session_id]["B"]
        return f"""You are a social media analytics expert. You help creators understand video performance.
SESSION CONTEXT:
Video A: "{video_a.title}" by {video_a.creator} on {video_a.platform}
- Views: {video_a.views}, Likes: {video_a.likes}, Comments: {video_a.comments}
- Engagement Rate: {video_a.engagement_rate:.4f}%
- Followers: {video_a.follower_count}
- Duration: {video_a.duration_seconds}s | Upload: {video_a.upload_date}
- Hashtags: {', '.join(video_a.hashtags)}
Video B: "{video_b.title}" by {video_b.creator} on {video_b.platform}
- Views: {video_b.views}, Likes: {video_b.likes}, Comments: {video_b.comments}
- Engagement Rate: {video_b.engagement_rate:.4f}%
- Followers: {video_b.follower_count}
- Duration: {video_b.duration_seconds}s | Upload: {video_b.upload_date}
- Hashtags: {', '.join(video_b.hashtags)}
Instructions:

Always cite sources as [Video A] or [Video B]
When comparing engagement, always state exact rates
When discussing hooks, quote the first 30 words of the relevant transcript
Be specific, data-driven, and actionable
Use retrieved transcript chunks to support your analysis"""

    async def stream_response(self, session_id: str, question: str) -> AsyncGenerator[str, None]:
        retriever = self.embedder.get_retriever(session_id)
        docs = await asyncio.get_event_loop().run_in_executor(
            None, self._retrieve_documents, retriever, question
        )

        context = "\n\n".join(
            [
                f"[Video {d.metadata.get('video_id', '?')} - {d.metadata.get('chunk_type', 'chunk')}]:\n{d.page_content}"
                for d in docs
            ]
        )

        history_messages = self._histories.get(session_id, [])
        history_str = "\n".join(
            [
                f"{'Human' if m.type == 'human' else 'Assistant'}: {m.content}"
                for m in history_messages[-6:]
            ]
        )

        system_context = self._build_system_context(session_id)
        full_prompt = f"""{system_context}

RETRIEVED CONTEXT:
{context}

CONVERSATION HISTORY:
{history_str}

USER QUESTION:
{question}

Answer in a concise but useful way. Include citations inline as [Video A] or [Video B]."""

        answer_parts: List[str] = []
        async for chunk in self.llm.astream([HumanMessage(content=full_prompt)]):
            token = getattr(chunk, "content", "")
            if token:
                answer_parts.append(token)
                yield token

        answer = "".join(answer_parts).strip()
        citations = self._build_citations(docs)

        self._histories.setdefault(session_id, [])
        self._histories[session_id].append(HumanMessage(content=question))
        self._histories[session_id].append(AIMessage(content=answer))
        self._histories[session_id] = self._histories[session_id][-20:]

        citation_payload = {
            "citations": [citation.model_dump() for citation in citations],
        }
        yield "\n\nCITATIONS_JSON: " + json.dumps(citation_payload, ensure_ascii=False)

    def _retrieve_documents(self, retriever, question: str) -> List[Document]:
        if hasattr(retriever, "get_relevant_documents"):
            return retriever.get_relevant_documents(question)
        return retriever.invoke(question)

    def _build_citations(self, docs: List[Document]) -> List[Citation]:
        citations: List[Citation] = []
        seen = set()
        for doc in docs:
            video_id = str(doc.metadata.get("video_id", "?"))
            source = str(doc.metadata.get("source", f"Video {video_id} - transcript"))
            key = (video_id, source, doc.page_content[:100])
            if key in seen:
                continue
            seen.add(key)
            citations.append(
                Citation(
                    video_id=video_id,
                    chunk_preview=doc.page_content[:100],
                    source=source,
                )
            )
        return citations
