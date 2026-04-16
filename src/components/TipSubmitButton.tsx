'use client'

import { useState } from 'react'
import TipSubmitForm from '@/components/TipSubmitForm'

interface Props {
  defaultNeighborhood?: string | null
}

export default function TipSubmitButton({ defaultNeighborhood }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        📍 거지 꿀팁 제보하기
      </button>

      {open && (
        <TipSubmitForm
          defaultNeighborhood={defaultNeighborhood}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
