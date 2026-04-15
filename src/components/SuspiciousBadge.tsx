// 3일 이상 미체크인 접속 시 "의심스러운 거지" 배지 노출
interface SuspiciousBadgeProps {
  lastCheckinDate: string | null
}

export default function SuspiciousBadge({ lastCheckinDate }: SuspiciousBadgeProps) {
  const today = new Date().toISOString().split('T')[0]!
  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString().split('T')[0]!

  // 체크인 기록 없거나 3일 이상 무체크인
  const isSuspicious = !lastCheckinDate || lastCheckinDate < threeDaysAgo

  if (!isSuspicious) return null

  const daysSince = lastCheckinDate
    ? Math.floor((new Date(today).getTime() - new Date(lastCheckinDate).getTime()) / 86_400_000)
    : null

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-yellow-800 rounded-xl">
      <span className="text-lg">🕵️</span>
      <div>
        <p className="text-xs font-bold text-yellow-400">의심스러운 거지</p>
        <p className="text-xs text-zinc-400">
          {daysSince !== null
            ? `${daysSince}일째 잠수 중... 진짜 거지인지 의심됩니다`
            : '체크인 기록이 없습니다. 진짜 거지 맞나요?'}
        </p>
      </div>
    </div>
  )
}
