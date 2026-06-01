interface EngagementBarProps {
  rate: number
  maxRate: number
}

export function EngagementBar({ rate, maxRate }: EngagementBarProps) {
  const pct = maxRate > 0 ? Math.min((rate / maxRate) * 100, 100) : 0
  const colorClass = rate >= 5 ? 'bg-[#2D6A4F]' : rate >= 2 ? 'bg-[#D4A017]' : 'bg-[#8B3A1A]'

  return (
    <div>
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#8B3A1A]">Engagement Rate</span>
      <div className="h-3 w-full bg-[#E8E0D0]">
        <div
          className={`h-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="mt-1 block text-sm font-bold text-[#1C1208]">{rate.toFixed(4)}%</span>
    </div>
  )
}
