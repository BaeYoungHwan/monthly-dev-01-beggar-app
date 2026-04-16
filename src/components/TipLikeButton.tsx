'use client'

import { useTransition } from 'react'
import { toggleLike } from '@/app/actions/tips'

interface Props {
  tipId: string
  likesCount: number
  likedByMe: boolean
}

export default function TipLikeButton({ tipId, likesCount, likedByMe }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await toggleLike(tipId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors disabled:opacity-60 ${
        likedByMe
          ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400'
          : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
      }`}
    >
      👍 가성비 인정{likesCount > 0 && ` ${likesCount}`}
    </button>
  )
}
