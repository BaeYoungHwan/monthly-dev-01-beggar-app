'use client'

import { PERSONAS } from '@/types/persona'
import { getGradeLevel, calcGradeScore } from '@/types/grade'

interface ShareCardProps {
  todayTotal: number
  dailyBudget: number
  checkinStreak: number
  percentile: number
  nagResult?: string
  personaId?: string
}

export default function ShareCard({
  todayTotal,
  dailyBudget,
  checkinStreak,
  percentile,
  nagResult,
  personaId,
}: ShareCardProps) {
  const score = calcGradeScore({ dailyBudget, todayTotal, checkinStreak })
  const grade = getGradeLevel(score)
  const persona = PERSONAS.find(p => p.id === personaId) ?? PERSONAS[0]!

  async function handleShare() {
    const text = `동결거지 ${grade.emoji} ${grade.title}\n상위 ${percentile}% 청렴한 거지\n오늘 ${todayTotal.toLocaleString()}원 지출\n\n${nagResult ?? ''}\n\nhttps://monthly-dev-01-beggar-app.vercel.app`

    if (navigator.share) {
      await navigator.share({ text })
    } else {
      await navigator.clipboard.writeText(text)
      alert('클립보드에 복사됐습니다!')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 공유 카드 미리보기 */}
      <div
        id="share-card"
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 flex flex-col items-center gap-4"
      >
        <div className="flex items-center gap-3 w-full">
          <span className="text-5xl">{grade.emoji}</span>
          <div>
            <p className="text-xs text-zinc-400">동결거지</p>
            <p className="text-xl font-black">{grade.title}</p>
            <p className="text-sm text-zinc-400">상위 {percentile}%</p>
          </div>
        </div>

        {nagResult && (
          <div className="bg-zinc-800 rounded-xl p-4 w-full">
            <div className="flex items-start gap-2">
              <span className="text-lg">{persona.emoji}</span>
              <p className="text-sm text-zinc-200 leading-relaxed">{nagResult}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-600">monthly-dev-01-beggar-app.vercel.app</p>
      </div>

      {/* 공유 버튼 */}
      <button
        onClick={handleShare}
        className="w-full bg-zinc-800 border border-zinc-700 text-white font-bold py-3 rounded-xl text-sm"
      >
        📤 공유하기
      </button>
    </div>
  )
}
