'use client'

import { useState, useTransition } from 'react'
import { submitTip } from '@/app/actions/tips'
import { TIP_CATEGORY_LABELS } from '@/types/tips'
import type { TipCategory } from '@/types/tips'

interface Props {
  defaultNeighborhood?: string | null
  onClose: () => void
}

const CATEGORIES = Object.entries(TIP_CATEGORY_LABELS) as [TipCategory, string][]

export default function TipSubmitForm({ defaultNeighborhood, onClose }: Props) {
  const [neighborhood, setNeighborhood] = useState(defaultNeighborhood ?? '')
  const [category, setCategory] = useState<TipCategory | ''>('')
  const [placeName, setPlaceName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) { setError('카테고리를 선택해 주세요'); return }
    const priceNum = parseInt(price, 10)
    if (!priceNum || priceNum <= 0) { setError('가격을 입력해 주세요'); return }

    setError(null)
    startTransition(async () => {
      try {
        await submitTip({
          neighborhood,
          category: category as TipCategory,
          place_name: placeName,
          description,
          price: priceNum,
        })
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : '제보 실패')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black">💡 거지 꿀팁 제보</h2>
          <button onClick={onClose} className="text-zinc-500 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* 동네 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">동네</label>
            <input
              type="text"
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
              placeholder="예) 서울 마포구, 수원시"
              required
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">카테고리</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    category === key
                      ? 'border-white bg-white text-zinc-950'
                      : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {label.split(' ')[0]}<br />
                  <span className="font-normal">{label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 장소명 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">장소명</label>
            <input
              type="text"
              value={placeName}
              onChange={e => setPlaceName(e.target.value)}
              placeholder="예) 망원시장 분식 골목"
              required
              maxLength={40}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
          </div>

          {/* 한 줄 꿀팁 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">한 줄 꿀팁 <span className="text-zinc-600">({description.length}/60)</span></label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="예) 떡볶이+순대+튀김 세트 4천원. 양 많음"
              required
              maxLength={60}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-zinc-500 placeholder:text-zinc-600"
            />
          </div>

          {/* 가격 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-400">가격 <span className="text-zinc-600">(무료면 0)</span></label>
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 focus-within:border-zinc-500">
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="4000"
                required
                min={0}
                step={100}
                inputMode="numeric"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
              />
              <span className="text-zinc-500 text-sm">원</span>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-white text-zinc-950 font-black py-3 rounded-xl text-sm disabled:opacity-50 transition-opacity mt-1"
          >
            {isPending ? '제보 중...' : '📍 제보하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
