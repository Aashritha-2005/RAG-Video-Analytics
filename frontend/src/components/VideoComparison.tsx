import { ArrowRight } from 'lucide-react'
import { useAppStore } from '../store'
import { VideoCard } from './VideoCard'

export function VideoComparison() {
  const { videoA, videoB, setActiveTab } = useAppStore()

  if (!videoA || !videoB) return null

  const winner = videoA.engagement_rate >= videoB.engagement_rate ? 'A' : 'B'

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-gray-800 bg-gray-900 px-5 py-4 text-center">
        <span className="text-sm font-semibold text-gray-400">Engagement Comparison</span>
        <p className="mt-1 text-lg font-bold text-white">
          Video A: {videoA.engagement_rate.toFixed(4)}% vs Video B: {videoB.engagement_rate.toFixed(4)}%
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <VideoCard video={videoA} isWinner={winner === 'A'} />
        <VideoCard video={videoB} isWinner={winner === 'B'} />
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setActiveTab('chat')}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-500"
        >
          Start Chatting
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  )
}
