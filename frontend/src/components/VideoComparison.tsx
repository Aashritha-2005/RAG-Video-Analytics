import { ArrowRight } from 'lucide-react'
import { useAppStore } from '../store'
import { VideoCard } from './VideoCard'

export function VideoComparison() {
  const { videoA, videoB, setActiveTab } = useAppStore()

  if (!videoA || !videoB) return null

  const winner = videoA.engagement_rate >= videoB.engagement_rate ? 'A' : 'B'

  return (
    <section className="bg-[#F5F0E8]">
      <h1 className="mb-8 text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">PERFORMANCE COMPARISON</h1>

      <div className="mb-8 border border-[#D4C9B0] bg-white p-6 text-center">
        <p className="text-lg font-bold tracking-wide text-[#1C1208]">
          VIDEO A - {videoA.engagement_rate.toFixed(4)}% vs VIDEO B - {videoB.engagement_rate.toFixed(4)}%
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VideoCard video={videoA} isWinner={winner === 'A'} className="stagger-1" />
        <VideoCard video={videoB} isWinner={winner === 'B'} className="stagger-2" />
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={() => setActiveTab('chat')}
          className="inline-flex items-center gap-2 bg-[#1C1208] px-12 py-4 text-sm font-bold uppercase tracking-widest text-[#F5F0E8] transition-colors duration-300 hover:bg-[#8B3A1A]"
        >
          Start Chatting
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  )
}
