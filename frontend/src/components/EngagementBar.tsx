interface EngagementBarProps {
  rate: number
  maxRate: number
}

export function EngagementBar({ rate, maxRate }: EngagementBarProps) {
  const pct = maxRate > 0 ? Math.min((rate / maxRate) * 100, 100) : 0
  const color = rate >= 5 ? '#22c55e' : rate >= 2 ? '#eab308' : '#ef4444'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Engagement Rate</span>
        <span className="text-sm font-bold text-white">{rate.toFixed(4)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.8s ease-out' }}
        />
      </div>
    </div>
  )
}
