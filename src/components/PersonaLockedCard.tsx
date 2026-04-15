'use client'

import { useState, useTransition } from 'react'
import { joinWaitlist } from '@/app/actions/waitlist'
import type { Persona } from '@/types/persona'

interface PersonaLockedCardProps {
  persona: Persona
}

export default function PersonaLockedCard({ persona }: PersonaLockedCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    startTransition(async () => {
      await joinWaitlist(persona.id, email)
      setDone(true)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 잠금 카드 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="relative flex flex-col items-start gap-1 p-3 rounded-xl border border-zinc-800 opacity-60 text-left"
      >
        <span className="text-2xl">{persona.emoji}</span>
        <span className="text-sm font-bold text-white">{persona.name}</span>
        <span className="text-xs text-zinc-400 leading-snug">{persona.description}</span>
        <span className="absolute top-2 right-2 text-xs">🔒</span>
        <span className="text-xs text-zinc-600 mt-1">출시 예정 → 탭해서 알림 신청</span>
      </button>

      {/* 알림 신청 펼침 */}
      {isOpen && !done && (
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex flex-col gap-3"
        >
          <p className="text-sm font-bold text-white">출시 알림 신청</p>
          <p className="text-xs text-zinc-400">{persona.name} 출시 시 이메일로 알려드립니다.</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="이메일 주소"
            required
            className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-white text-zinc-950 text-sm font-bold py-2 rounded-lg disabled:opacity-50"
          >
            {isPending ? '등록 중...' : '알림 받기'}
          </button>
        </form>
      )}

      {isOpen && done && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
          <p className="text-sm font-bold text-green-400">✅ 등록 완료!</p>
          <p className="text-xs text-zinc-400 mt-1">출시되면 알려드릴게요.</p>
        </div>
      )}
    </div>
  )
}
