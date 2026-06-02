import os
from typing import Dict, List

import chromadb
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from models import VideoMetadata


class Embedder:
    def __init__(self) -> None:
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )
        self.chroma_client = chromadb.PersistentClient(
            path=os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
        )
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=80)
        self._stores: Dict[str, Chroma] = {}

    def chunk_and_embed(self, video_a: VideoMetadata, video_b: VideoMetadata, session_id: str) -> None:
        all_docs: List[Document] = []
        for video in (video_a, video_b):
            chunks = self.splitter.split_text(video.transcript or "")
            for index, chunk in enumerate(chunks, start=1):
                all_docs.append(
                    Document(
                        page_content=chunk,
                        metadata={
                            "video_id": video.video_id,
                            "session_id": session_id,
                            "creator": video.creator,
                            "platform": video.platform,
                            "engagement_rate": video.engagement_rate,
                            "views": video.views,
                            "likes": video.likes,
                            "comments": video.comments,
                            "follower_count": video.follower_count or 0,
                            "upload_date": video.upload_date,
                            "duration_seconds": video.duration_seconds,
                            "hashtags": ", ".join(video.hashtags),
                            "chunk_type": "transcript",
                            "source": f"Video {video.video_id} - transcript chunk {index}",
                        },
                    )
                )

            all_docs.append(
                Document(
                    page_content=self._metadata_summary(video),
                    metadata={
                        "video_id": video.video_id,
                        "session_id": session_id,
                        "creator": video.creator,
                        "platform": video.platform,
                        "engagement_rate": video.engagement_rate,
                        "views": video.views,
                        "likes": video.likes,
                        "comments": video.comments,
                        "follower_count": video.follower_count or 0,
                        "upload_date": video.upload_date,
                        "duration_seconds": video.duration_seconds,
                        "hashtags": ", ".join(video.hashtags),
                        "chunk_type": "metadata_summary",
                        "source": f"Video {video.video_id} - metadata summary",
                    },
                )
            )

        vectorstore = Chroma.from_documents(
            documents=all_docs,
            embedding=self.embeddings,
            collection_name=f"session_{session_id}",
            client=self.chroma_client,
        )
        self._stores[session_id] = vectorstore

    def get_retriever(self, session_id: str):
        if session_id not in self._stores:
            vectorstore = Chroma(
                collection_name=f"session_{session_id}",
                embedding_function=self.embeddings,
                client=self.chroma_client,
            )
            self._stores[session_id] = vectorstore
        return self._stores[session_id].as_retriever(
            search_type="mmr",
            search_kwargs={"k": 6, "fetch_k": 12},
        )

    def _metadata_summary(self, video: VideoMetadata) -> str:
        return f"""Video {video.video_id} Metadata Summary:
Title: {video.title}
Creator: {video.creator}
Platform: {video.platform}
Followers: {video.follower_count}
Follower Note: {video.follower_count_note or ''}
Views: {video.views}
Likes: {video.likes}
Comments: {video.comments}
Engagement Rate: {video.engagement_rate:.4f}%
Upload Date: {video.upload_date}
Duration: {video.duration_seconds} seconds
Hashtags: {', '.join(video.hashtags)}
URL: {video.url}
"""


embedder = Embedder()
