import React from 'react'
import { CalendarDays, Clock, UserRound } from 'lucide-react'
import { VideoMetadata } from '../types'
import { useAppStore } from '../store'
import { EngagementBar } from './EngagementBar'

interface VideoCardProps {
  video: VideoMetadata
  isWinner: boolean
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

const platformClasses = (platform: string) => {
  const normalized = platform.toLowerCase()
  if (normalized === 'youtube') return 'bg-red-500/15 text-red-300 ring-red-500/30'
  if (normalized === 'instagram') return 'bg-purple-500/15 text-purple-300 ring-purple-500/30'
  return 'bg-gray-500/15 text-gray-300 ring-gray-500/30'
}

function VideoCardComponent({ video, isWinner }: VideoCardProps) {
  const { videoA, videoB } = useAppStore()
  const maxRate = Math.max(videoA?.engagement_rate ?? 0, videoB?.engagement_rate ?? 0, 0.0001)
  const transcriptPreview =
    video.transcript.length > 150 ? `${video.transcript.slice(0, 150)}...` : video.transcript

  return (
    <article className="flex min-h-full flex-col gap-5 rounded-lg border border-gray-800 bg-gray-900 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
            Video {video.video_id}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${platformClasses(video.platform)}`}>
            {video.platform}
          </span>
        </div>
        {isWinner && (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30">
            <span aria-hidden="true">👑</span> Higher Engagement
          </span>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="line-clamp-2 text-xl font-bold leading-snug text-white">{video.title}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <UserRound className="h-4 w-4 shrink-0 text-gray-500" />
          <span className="truncate font-medium">{video.creator}</span>
          <span className="text-gray-600">|</span>
          <span className="shrink-0 text-gray-400">{formatFollowers(video.follower_count)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md bg-gray-950 p-3">
          <div className="text-xs text-gray-500">👁 Views</div>
          <div className="mt-1 text-lg font-bold">{formatNumber(video.views)}</div>
        </div>
        <div className="rounded-md bg-gray-950 p-3">
          <div className="text-xs text-gray-500">👍 Likes</div>
          <div className="mt-1 text-lg font-bold">{formatNumber(video.likes)}</div>
        </div>
        <div className="rounded-md bg-gray-950 p-3">
          <div className="text-xs text-gray-500">💬 Comments</div>
          <div className="mt-1 text-lg font-bold">{formatNumber(video.comments)}</div>
        </div>
      </div>

      <EngagementBar rate={video.engagement_rate} maxRate={maxRate} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {video.upload_date || 'Unknown date'}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {formatDuration(video.duration_seconds)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {video.hashtags.slice(0, 5).map((tag) => (
          <span key={tag} className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">
            {tag}
          </span>
        ))}
        {video.hashtags.length === 0 && <span className="text-xs text-gray-500">No hashtags detected</span>}
      </div>

      <p className="mt-auto rounded-md border border-gray-800 bg-gray-950 p-3 text-sm leading-6 text-gray-400">
        {transcriptPreview || 'No transcript preview available.'}
      </p>
    </article>
  )
}

export const VideoCard = React.memo(VideoCardComponent)
