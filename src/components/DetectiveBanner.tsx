'use client'

// 오후 2시 이후 + 오늘 체크인 없을 때 노출
interface DetectiveBannerProps {
  hasCheckinToday: boolean
}

export default function DetectiveBanner({ hasCheckinToday }: DetectiveBannerProps) {
  if (hasCheckinToday) return null

  const hour = new Date().getHours()
  if (hour < 14) return null // 오후 2시 이전은 노출 안 함

  return (
    <div className="bg-zinc-900 border border-red-600/40 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔍</span>
        <div>
          <p className="text-sm font-bold text-red-400">수상한데요…</p>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            오후 2시가 넘었는데 아직 아무 기록이 없네요.
            진짜 한 푼도 안 썼어요? 의심스럽습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
