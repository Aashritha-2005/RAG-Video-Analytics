import React from 'react'
import { CalendarDays, Clock, UserRound } from 'lucide-react'
import { VideoMetadata } from '../types'
import { useAppStore } from '../store'
import { EngagementBar } from './EngagementBar'

interface VideoCardProps {
  video: VideoMetadata
  isWinner: boolean
  className?: string
}

const formatNumber = (n: number | null) => {
  if (n === null) return 'Unknown'
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

const formatFollowers = (n: number | null) => {
  if (n === null) return 'Unknown followers'
  return `${formatNumber(n)} followers`
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function VideoCardComponent({ video, isWinner, className = '' }: VideoCardProps) {
  const { videoA, videoB } = useAppStore()
  const maxRate = Math.max(videoA?.engagement_rate ?? 0, videoB?.engagement_rate ?? 0, 0.0001)
  const transcriptPreview =
    video.transcript.length > 150 ? `${video.transcript.slice(0, 150)}...` : video.transcript

  return (
    <article className={`animate-fade-in-up flex min-h-full flex-col border border-[#D4C9B0] bg-white p-8 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-[#1C1208] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1C1208]">
            Video {video.video_id}
          </span>
          <span className="border border-[#8B3A1A] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">
            {video.platform}
          </span>
        </div>
        {isWinner && (
          <span className="bg-[#1C1208] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#F5F0E8]">
            Higher Engagement
          </span>
        )}
      </div>

      <div>
        <h2 className="line-clamp-2 mb-3 mt-4 text-xl font-bold leading-snug text-[#1C1208]">{video.title}</h2>
        <div className="mb-3 flex items-center gap-2 border-b border-[#D4C9B0] pb-3 text-sm text-[#5C4A35]">
          <UserRound className="h-4 w-4 shrink-0 text-[#8B3A1A]" />
          <span className="truncate font-medium">{video.creator}</span>
          <span className="text-[#D4C9B0]">|</span>
          <span className="shrink-0">{formatFollowers(video.follower_count)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold text-[#1C1208]">{formatNumber(video.views)}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">Views</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#1C1208]">{formatNumber(video.likes)}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">Likes</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#1C1208]">{formatNumber(video.comments)}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">Comments</div>
        </div>
      </div>

      <div className="my-4 border-t border-[#D4C9B0]" />

      <EngagementBar rate={video.engagement_rate} maxRate={maxRate} />

      <div className="my-4 border-t border-[#D4C9B0]" />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#5C4A35]">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#8B3A1A]" />
          {video.upload_date || 'Unknown date'}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#8B3A1A]" />
          {formatDuration(video.duration_seconds)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {video.hashtags.slice(0, 5).map((tag) => (
          <span key={tag} className="border border-[#D4C9B0] px-2 py-0.5 text-xs text-[#5C4A35]">
            {tag}
          </span>
        ))}
        {video.hashtags.length === 0 && <span className="text-xs text-[#7A6A55]">No hashtags detected</span>}
      </div>

      <p className="mt-4 border-l-2 border-[#D4C9B0] pl-4 text-sm italic leading-6 text-[#7A6A55]">
        {transcriptPreview || 'No transcript preview available.'}
      </p>
    </article>
  )
}

export const VideoCard = React.memo(VideoCardComponent)
