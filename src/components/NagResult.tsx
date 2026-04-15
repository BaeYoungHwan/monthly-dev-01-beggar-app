'use client'

import { useRouter } from 'next/navigation'
import { PERSONAS } from '@/types/persona'

interface NagResultProps {
  nagResult: string
  personaId: string
  onReset: () => void
}

export default function NagResult({ nagResult, personaId, onReset }: NagResultProps) {
  const router = useRouter()
  const persona = PERSONAS.find(p => p.id === personaId) ?? PERSONAS[0]!

  async function handleShare() {
    const text = `${persona.emoji} 동결거지한테 혼났다\n\n"${nagResult}"\n\n나도 해볼래? → https://monthly-dev-01-beggar-app.vercel.app`
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
      alert('클립보드에 복사됐습니다!')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      {/* 페르소나 이모지 */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-8xl animate-bounce block">{persona.emoji}</span>
        <span className="text-sm font-bold text-zinc-400">{persona.name}</span>
      </div>

      {/* 잔소리 텍스트 */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full">
        <p className="text-white text-lg font-medium leading-relaxed text-center whitespace-pre-wrap">
          {nagResult}
        </p>
      </div>

      {/* 버튼 */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={handleShare}
          className="w-full bg-zinc-800 border border-zinc-700 text-white font-bold py-3 rounded-xl text-sm"
        >
          📤 이 잔소리 공유하기
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-white text-zinc-950 font-bold py-3 rounded-xl"
        >
          대시보드로
        </button>
        <button
          onClick={onReset}
          className="w-full text-zinc-500 text-sm py-2 underline"
        >
          또 쓸 거야?
        </button>
      </div>
    </div>
  )
}
