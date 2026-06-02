import os
import asyncio
from typing import Dict, AsyncGenerator
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser


class RAGChain:
    def __init__(self, embedder):
        self.embedder = embedder
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
        )
        self._histories: Dict[str, list] = {}
        self._session_metadata: Dict[str, dict] = {}

    def register_session(self, session_id: str, video_a, video_b):
        self._session_metadata[session_id] = {"video_a": video_a, "video_b": video_b}
        self._histories[session_id] = []

    def _build_system_prompt(self, session_id: str) -> str:
        video_a = self._session_metadata[session_id]["video_a"]
        video_b = self._session_metadata[session_id]["video_b"]
        return f"""You are a social media analytics expert helping creators understand video performance.

VIDEO A: {video_a.title} by {video_a.creator} on {video_a.platform}
- Views: {video_a.views} | Likes: {video_a.likes} | Comments: {video_a.comments}
- Engagement Rate: {video_a.engagement_rate:.4f}%
- Followers: {video_a.follower_count} | Duration: {video_a.duration_seconds}s
- Hashtags: {', '.join(video_a.hashtags)}

VIDEO B: {video_b.title} by {video_b.creator} on {video_b.platform}
- Views: {video_b.views} | Likes: {video_b.likes} | Comments: {video_b.comments}
- Engagement Rate: {video_b.engagement_rate:.4f}%
- Followers: {video_b.follower_count} | Duration: {video_b.duration_seconds}s
- Hashtags: {', '.join(video_b.hashtags)}

Always cite sources as [Video A] or [Video B]. Be specific and data-driven.
Use the retrieved transcript chunks to support your analysis.
When comparing engagement, always state the exact engagement rates."""

    async def stream_response(self, session_id: str, question: str) -> AsyncGenerator[str, None]:
        retriever = self.embedder.get_retriever(session_id)
        docs = await asyncio.get_event_loop().run_in_executor(None, retriever.invoke, question)

        context_parts = []
        for i, doc in enumerate(docs):
            vid_id = doc.metadata.get("video_id", "?")
            chunk_type = doc.metadata.get("chunk_type", "chunk")
            context_parts.append(f"[Video {vid_id} - {chunk_type} {i+1}]:\n{doc.page_content}")
        context = "\n\n".join(context_parts)

        history = self._histories.get(session_id, [])
        system_prompt = self._build_system_prompt(session_id)

        messages = [SystemMessage(content=system_prompt + f"\n\nRELEVANT CONTEXT:\n{context}")]
        messages.extend(history[-10:])
        messages.append(HumanMessage(content=question))

        full_response = ""
        async for chunk in self.llm.astream(messages):
            token = chunk.content
            if token:
                full_response += token
                yield token

        self._histories[session_id].append(HumanMessage(content=question))
        self._histories[session_id].append(AIMessage(content=full_response))
        self._histories[session_id] = self._histories[session_id][-20:]

        citations = []
        for i, doc in enumerate(docs):
            vid_id = doc.metadata.get("video_id", "?")
            chunk_type = doc.metadata.get("chunk_type", "chunk")
            citations.append(
                {
                    "video_id": vid_id,
                    "chunk_preview": doc.page_content[:100],
                    "source": f"Video {vid_id} - {chunk_type} {i+1}",
                }
            )
        import json

        yield f"[CITATIONS]{json.dumps(citations)}[/CITATIONS]"
