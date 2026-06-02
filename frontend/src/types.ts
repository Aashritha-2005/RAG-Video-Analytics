export interface VideoMetadata {
  video_id: string
  url: string
  platform: string
  title: string
  creator: string
  follower_count: number | null
  follower_count_note?: string | null
  views: number
  likes: number
  comments: number
  hashtags: string[]
  upload_date: string
  duration_seconds: number
  engagement_rate: number
  transcript: string
}

export interface ProcessResponse {
  session_id: string
  video_a: VideoMetadata
  video_b: VideoMetadata
}

export interface Citation {
  video_id: string
  chunk_preview: string
  source: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  isStreaming?: boolean
}
