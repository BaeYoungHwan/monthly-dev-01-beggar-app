'use client'

import { useTransition } from 'react'
import { checkin } from '@/app/actions/checkin'

interface CheckinBannerProps {
  hasCheckinToday: boolean
}

export default function CheckinBanner({ hasCheckinToday }: CheckinBannerProps) {
  const [isPending, startTransition] = useTransition()

  if (hasCheckinToday) return null

  function handleCheckin() {
    startTransition(async () => {
      await checkin('no_spend')
    })
  }

  return (
    <div className="bg-zinc-900 border border-yellow-600/40 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-yellow-400">오늘 아직 신고 안 했잖아요</p>
        <p className="text-xs text-zinc-500 mt-0.5">지출 없으면 생존 신고라도 해주세요</p>
      </div>
      <button
        onClick={handleCheckin}
        disabled={isPending}
        className="shrink-0 bg-yellow-400 text-zinc-950 text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50"
      >
        {isPending ? '...' : '생존 신고'}
      </button>
    </div>
  )
}
