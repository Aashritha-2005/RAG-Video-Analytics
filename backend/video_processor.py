import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

from models import VideoMetadata


class VideoProcessingError(Exception):
    def __init__(self, detail: Dict[str, Any]) -> None:
        self.detail = detail
        super().__init__(str(detail))


class VideoProcessor:
    def detect_platform(self, url: str) -> str:
        normalized_url = url.lower()
        if (
            "youtube.com/shorts" in normalized_url
            or "youtube.com" in normalized_url
            or "youtu.be" in normalized_url
        ):
            return "youtube"
        if "instagram.com/reel" in normalized_url or "instagram.com/p/" in normalized_url:
            return "instagram"
        raise ValueError("Unsupported video URL. Expected a YouTube URL or Instagram Reel/Post URL.")

    def extract_youtube(self, url: str, video_id: str) -> VideoMetadata:
        youtube_id = self._parse_youtube_video_id(url)
        info = self._fetch_youtube_api(youtube_id)
        transcript_text = self._get_youtube_transcript_text(youtube_id, info.get("description", ""))

        return VideoMetadata(
            video_id=video_id,
            url=url,
            platform="youtube",
            title=info["title"],
            creator=info["creator"],
            follower_count=info["follower_count"],
            views=info["views"],
            likes=info["likes"],
            comments=info["comments"],
            hashtags=info["hashtags"],
            upload_date=info["upload_date"],
            duration_seconds=info["duration_seconds"],
            engagement_rate=self._engagement_rate(info["likes"], info["comments"], info["views"]),
            transcript=transcript_text,
        )

    def extract_instagram(self, url: str, video_id: str) -> VideoMetadata:
        try:
            self._parse_instagram_shortcode(url)
            return self._extract_instagram_ytdlp(url, video_id)
        except Exception as ytdlp_exc:
            raise VideoProcessingError(
                {
                    "video_id": video_id,
                    "url": url,
                    "platform": "instagram",
                    "errors": {"yt_dlp": str(ytdlp_exc)},
                }
            ) from ytdlp_exc

    def process_video(self, url: str, video_id: str) -> VideoMetadata:
        try:
            platform = self.detect_platform(url)
            if platform == "youtube":
                return self.extract_youtube(url, video_id)
            return self.extract_instagram(url, video_id)
        except VideoProcessingError:
            raise
        except Exception as exc:
            raise VideoProcessingError(
                {
                    "video_id": video_id,
                    "url": url,
                    "platform": self._safe_platform(url),
                    "errors": {"processing": str(exc)},
                }
            ) from exc

    def _fetch_youtube_api(self, youtube_id: str) -> Dict[str, Any]:
        api_key = os.getenv("YOUTUBE_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("YOUTUBE_API_KEY not set")

        # Fetch video details
        video_url = (
            f"https://www.googleapis.com/youtube/v3/videos"
            f"?part=snippet,statistics,contentDetails&id={youtube_id}&key={api_key}"
        )
        resp = requests.get(video_url, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if not data.get("items"):
            raise ValueError(f"YouTube video {youtube_id} not found via API")

        item = data["items"][0]
        snippet = item.get("snippet", {})
        stats = item.get("statistics", {})
        content = item.get("contentDetails", {})

        channel_id = snippet.get("channelId", "")
        follower_count = None
        if channel_id:
            ch_url = (
                f"https://www.googleapis.com/youtube/v3/channels"
                f"?part=statistics&id={channel_id}&key={api_key}"
            )
            ch_resp = requests.get(ch_url, timeout=10)
            if ch_resp.ok:
                ch_data = ch_resp.json()
                if ch_data.get("items"):
                    follower_count = self._optional_int(
                        ch_data["items"][0].get("statistics", {}).get("subscriberCount")
                    )

        # Parse ISO 8601 duration
        duration_seconds = self._parse_iso_duration(content.get("duration", ""))

        return {
            "title": snippet.get("title", "Untitled"),
            "creator": snippet.get("channelTitle", "Unknown"),
            "follower_count": follower_count,
            "views": self._safe_int(stats.get("viewCount")),
            "likes": self._safe_int(stats.get("likeCount")),
            "comments": self._safe_int(stats.get("commentCount")),
            "hashtags": self._normalize_hashtags(snippet.get("tags") or []),
            "upload_date": snippet.get("publishedAt", "")[:10],
            "duration_seconds": duration_seconds,
        }

    def _parse_iso_duration(self, duration: str) -> int:
        match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration)
        if not match:
            return 0
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        return hours * 3600 + minutes * 60 + seconds

    def _extract_instagram_ytdlp(self, url: str, video_id: str) -> VideoMetadata:
        ydl_opts = {"quiet": True, "skip_download": True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False) or {}

        description = str(info.get("description") or "")
        title = str(info.get("title") or description[:80] or "Untitled Instagram Reel")
        uploader = str(info.get("uploader") or info.get("uploader_id") or "Unknown creator")
        likes = self._safe_int(info.get("like_count"))
        comments = self._safe_int(info.get("comment_count"))
        views = self._safe_int(info.get("view_count"))
        follower_count = self._optional_int(
            info.get("uploader_follower_count")
            or info.get("channel_follower_count")
        )
        follower_count_note = None if follower_count is not None else "unavailable without auth"
        transcript = description.strip()
        if len(transcript) < 20:
            raise ValueError("Instagram caption/transcript unavailable from yt-dlp.")

        return VideoMetadata(
            video_id=video_id,
            url=url,
            platform="instagram",
            title=title,
            creator=uploader,
            follower_count=follower_count,
            follower_count_note=follower_count_note,
            views=views,
            likes=likes,
            comments=comments,
            hashtags=self._normalize_hashtags(info.get("tags") or []),
            upload_date=self._format_youtube_date(info.get("upload_date")),
            duration_seconds=self._safe_int(info.get("duration")),
            engagement_rate=self._engagement_rate(likes, comments, views),
            transcript=transcript or title,
        )

    def _parse_youtube_video_id(self, url: str) -> str:
        patterns = [
            r"(?:youtube\.com/watch\?v=)([A-Za-z0-9_-]{11})",
            r"(?:youtu\.be/)([A-Za-z0-9_-]{11})",
            r"(?:youtube\.com/embed/)([A-Za-z0-9_-]{11})",
            r"(?:youtube\.com/shorts/)([A-Za-z0-9_-]{11})",
            r"(?:youtube\.com/v/)([A-Za-z0-9_-]{11})",
            r"(?:[?&]v=)([A-Za-z0-9_-]{11})",
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        raise ValueError("Could not parse YouTube video ID from URL.")

    def _parse_instagram_shortcode(self, url: str) -> str:
        match = re.search(r"instagram\.com/(?:reel|p)/([^/?#]+)/?", url)
        if not match:
            raise ValueError("Could not parse Instagram shortcode from URL.")
        return match.group(1)

    def _get_youtube_transcript_text(self, youtube_id: str, description: str = "") -> str:
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(youtube_id)
            transcript_text = " ".join(str(segment.get("text", "")) for segment in transcript_list)
            transcript_text = transcript_text.strip()
            if transcript_text:
                return transcript_text
        except Exception as exc:
            raise ValueError("YouTube transcript unavailable.") from exc
        raise ValueError("YouTube transcript is empty.")

    def _format_youtube_date(self, raw_date: Optional[str]) -> str:
        if not raw_date:
            return ""
        try:
            return datetime.strptime(str(raw_date), "%Y%m%d").strftime("%Y-%m-%d")
        except ValueError:
            return str(raw_date)

    def _normalize_hashtags(self, tags: List[Any]) -> List[str]:
        normalized = []
        for tag in tags:
            text = str(tag).strip()
            if text:
                normalized.append(text if text.startswith("#") else f"#{text}")
        return normalized

    def _safe_int(self, value: Any) -> int:
        try:
            return max(int(value or 0), 0)
        except (TypeError, ValueError):
            return 0

    def _optional_int(self, value: Any) -> Optional[int]:
        if value is None:
            return None
        return self._safe_int(value)

    def _engagement_rate(self, likes: int, comments: int, views: int) -> float:
        if views == 0:
            return 0.0
        return ((likes + comments) / views) * 100

    def _safe_platform(self, url: str) -> str:
        try:
            return self.detect_platform(url)
        except ValueError:
            return "unknown"


processor = VideoProcessor()
