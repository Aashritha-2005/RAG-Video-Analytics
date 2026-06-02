from typing import List, Optional

from pydantic import BaseModel, Field


class Citation(BaseModel):
    video_id: str
    chunk_preview: str
    source: str


class VideoMetadata(BaseModel):
    video_id: str
    url: str
    platform: str
    title: str
    creator: str
    follower_count: Optional[int]
    follower_count_note: Optional[str] = None
    views: int = Field(ge=0)
    likes: int = Field(ge=0)
    comments: int = Field(ge=0)
    hashtags: List[str]
    upload_date: str
    duration_seconds: int = Field(ge=0)
    engagement_rate: float
    transcript: str


class VideoInput(BaseModel):
    url_a: str
    url_b: str


class ProcessResponse(BaseModel):
    session_id: str
    video_a: VideoMetadata
    video_b: VideoMetadata


class ChatRequest(BaseModel):
    session_id: str
    message: str
