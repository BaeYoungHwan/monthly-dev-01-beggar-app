'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateDailyBudget } from '@/app/actions/settings'

const PRESETS = [10000, 20000, 30000, 50000, 100000]

export default function SettingsPage() {
  const router = useRouter()
  const [budget, setBudget] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function handlePreset(value: number) {
    setBudget(value.toString())
    setDone(false)
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseInt(budget, 10)
    if (!num || num <= 0) {
      setError('예산을 입력해 주세요')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await updateDailyBudget(num)
        setDone(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장 실패')
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-8 gap-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 text-2xl leading-none"
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">일일 예산 설정</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 flex-1">
        {/* 금액 입력 */}
        <div className="flex flex-col gap-2">
          <label className="text-zinc-400 text-sm">하루에 얼마까지 쓸 수 있어?</label>
          <div className="flex items-end gap-2 border-b-2 border-zinc-700 focus-within:border-white pb-2 transition-colors">
            <input
              type="number"
              value={budget}
              onChange={e => { setBudget(e.target.value); setDone(false) }}
              placeholder="30000"
              min={1000}
              step={1000}
              inputMode="numeric"
              className="flex-1 text-5xl font-black bg-transparent outline-none text-right placeholder:text-zinc-700"
            />
            <span className="text-2xl font-bold text-zinc-400 mb-1">원</span>
          </div>
        </div>

        {/* 빠른 선택 프리셋 */}
        <div className="flex flex-col gap-3">
          <label className="text-zinc-400 text-sm">빠른 선택</label>
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => handlePreset(v)}
                className={`py-2 rounded-xl border text-xs font-bold transition-colors ${
                  budget === v.toString()
                    ? 'border-white bg-white text-zinc-950'
                    : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                {v >= 10000 ? `${v / 10000}만` : `${v / 1000}천`}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          이 금액 이내로 하루를 버티면 등급이 오릅니다.<br />
          꽉 조여야 진짜 거지 실력이 는다고요.
        </p>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {done && (
          <p className="text-green-400 text-sm font-bold">✅ 저장 완료! 대시보드에 반영됐어요.</p>
        )}

        <div className="flex-1" />

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-white text-zinc-950 font-black py-4 rounded-2xl text-lg disabled:opacity-50 transition-opacity"
        >
          {isPending ? '저장 중...' : '💾 예산 저장'}
        </button>
      </form>
    </div>
  )
}
