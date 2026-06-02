import os
import re
import tempfile
from datetime import datetime
from typing import Any, Dict, List, Optional

import instaloader
import whisper
import yt_dlp
from instaloader import Post
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
        info = self._extract_ytdlp_info(url)

        title = str(info.get("title") or "Untitled YouTube video")
        description = str(info.get("description") or "")
        transcript_text = self._get_youtube_transcript_text(youtube_id, title, description)

        views = self._safe_int(info.get("view_count"))
        likes = self._safe_int(info.get("like_count"))
        comments = self._safe_int(info.get("comment_count"))
        follower_count = self._optional_int(
            info.get("channel_follower_count")
            or info.get("channel_follower_count_estimate")
            or info.get("uploader_follower_count")
        )

        return VideoMetadata(
            video_id=video_id,
            url=url,
            platform="youtube",
            title=title,
            creator=str(info.get("uploader") or info.get("channel") or "Unknown creator"),
            follower_count=follower_count,
            views=views,
            likes=likes,
            comments=comments,
            hashtags=self._normalize_hashtags(info.get("tags") or []),
            upload_date=self._format_youtube_date(info.get("upload_date")),
            duration_seconds=self._safe_int(info.get("duration")),
            engagement_rate=self._engagement_rate(likes, comments, views),
            transcript=transcript_text,
        )

    def extract_instagram(self, url: str, video_id: str) -> VideoMetadata:
        shortcode = self._parse_instagram_shortcode(url)
        try:
            return self._extract_instagram_instaloader(url, video_id, shortcode)
        except Exception as instaloader_exc:
            try:
                return self._extract_instagram_ytdlp(url, video_id)
            except Exception as ytdlp_exc:
                raise VideoProcessingError(
                    {
                        "video_id": video_id,
                        "url": url,
                        "platform": "instagram",
                        "errors": {
                            "instaloader": str(instaloader_exc),
                            "yt_dlp": str(ytdlp_exc),
                        },
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
                    "errors": {
                        "processing": str(exc),
                    },
                }
            ) from exc

    def _extract_instagram_instaloader(self, url: str, video_id: str, shortcode: str) -> VideoMetadata:
        loader = instaloader.Instaloader(
            quiet=True,
            download_videos=False,
            download_video_thumbnails=False,
            save_metadata=False,
        )
        post = Post.from_shortcode(loader.context, shortcode)

        caption = post.caption or ""
        username = post.owner_username or "Unknown creator"
        transcript = caption.strip()
        if len(transcript) < 20:
            transcript = self._transcribe_instagram_audio(url, fallback_text=caption)

        likes = self._safe_int(post.likes)
        comments = self._safe_int(post.comments)
        views = self._safe_int(getattr(post, "video_view_count", None))
        follower_count = None
        follower_count_note = None
        try:
            follower_count = self._optional_int(post.owner_profile.followers)
        except Exception:
            follower_count_note = "unavailable without auth"

        hashtags = re.findall(r"#\w+", caption)
        title = caption.strip()[:80] if caption.strip() else f"Instagram Reel by {username}"
        upload_date = post.date_utc.strftime("%Y-%m-%d") if post.date_utc else ""

        return VideoMetadata(
            video_id=video_id,
            url=url,
            platform="instagram",
            title=title,
            creator=username,
            follower_count=follower_count,
            follower_count_note=follower_count_note,
            views=views,
            likes=likes,
            comments=comments,
            hashtags=hashtags,
            upload_date=upload_date,
            duration_seconds=self._safe_int(getattr(post, "video_duration", None)),
            engagement_rate=self._engagement_rate(likes, comments, views),
            transcript=transcript or title,
        )

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
            or info.get("channel_follower_count_estimate")
        )
        follower_count_note = None if follower_count is not None else "unavailable without auth"
        transcript = description.strip()
        if len(transcript) < 20:
            transcript = self._transcribe_instagram_audio(url, fallback_text=description)

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

    def _extract_ytdlp_info(self, url: str) -> Dict[str, Any]:
        opts = {"quiet": True, "skip_download": True, "extract_flat": False}
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=False) or {}

    def _get_youtube_transcript_text(self, youtube_id: str, title: str, description: str) -> str:
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(youtube_id)
            transcript_text = " ".join(str(segment.get("text", "")) for segment in transcript_list)
            return transcript_text.strip() or f"{title} {description}".strip()
        except Exception:
            return f"{title} {description}".strip()

    def _transcribe_instagram_audio(self, url: str, fallback_text: str) -> str:
        temp_path = tempfile.mktemp(suffix=".mp3")
        try:
            opts = {
                "quiet": True,
                "skip_download": False,
                "format": "bestaudio/best",
                "outtmpl": temp_path,
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
            model = whisper.load_model("base")
            result = model.transcribe(temp_path)
            text = str(result.get("text", "")).strip()
            return text or fallback_text or "No transcript or caption available."
        except Exception:
            return fallback_text or "No transcript or caption available."
        finally:
            for candidate in {temp_path, f"{temp_path}.mp3"}:
                if os.path.exists(candidate):
                    os.remove(candidate)

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
