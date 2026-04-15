'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createExpense } from '@/app/actions/expense'
import { extractReceiptData } from '@/app/actions/ocr'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/types/expense'
import { PERSONAS } from '@/types/persona'
import NagResult from '@/components/NagResult'
import PersonaLockedCard from '@/components/PersonaLockedCard'

const CATEGORIES = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]

export default function NewExpensePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isOcrPending, startOcrTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | null>(null)
  const [memo, setMemo] = useState('')
  const [personaId, setPersonaId] = useState('drill_sergeant')
  const [error, setError] = useState<string | null>(null)
  const [ocrMessage, setOcrMessage] = useState<string | null>(null)
  const [result, setResult] = useState<{ nagResult: string; personaId: string } | null>(null)

  function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [header, base64] = dataUrl.split(',')
      const mimeType = header?.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
      if (!base64) return

      setOcrMessage('영수증 분석 중...')
      startOcrTransition(async () => {
        try {
          const ocr = await extractReceiptData(base64, mimeType)
          if (ocr.amount) setAmount(String(ocr.amount))
          if (ocr.category) setCategory(ocr.category)
          setOcrMessage(
            ocr.amount
              ? `✅ ${ocr.amount.toLocaleString()}원 인식됨 (${ocr.confidence === 'high' ? '높음' : '낮음'})`
              : '❌ 금액을 인식하지 못했어요. 직접 입력해 주세요.'
          )
        } catch (err) {
          setOcrMessage(err instanceof Error ? `❌ ${err.message}` : '❌ OCR 오류가 발생했습니다')
        }
      })
    }
    reader.readAsDataURL(file)
    // 같은 파일 재선택 허용
    e.target.value = ''
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) {
      setError('카테고리를 선택해 주세요')
      return
    }
    const amountNum = parseInt(amount, 10)
    if (!amountNum || amountNum <= 0) {
      setError('금액을 입력해 주세요')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const res = await createExpense({
          amount: amountNum,
          category,
          memo: memo.trim() || undefined,
          personaId,
        })
        setResult(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      }
    })
  }

  // 잔소리 결과 화면
  if (result) {
    return (
      <NagResult
        nagResult={result.nagResult}
        personaId={result.personaId}
        onReset={() => setResult(null)}
      />
    )
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
        <h1 className="text-xl font-bold">지출 입력</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 flex-1">
        {/* 영수증 OCR */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleReceiptUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isOcrPending}
            className="flex items-center justify-center gap-2 w-full border border-dashed border-zinc-600 rounded-xl py-3 text-sm text-zinc-400 hover:border-zinc-400 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            {isOcrPending ? '⏳ 분석 중...' : '📷 영수증 인식으로 자동 입력'}
          </button>
          {ocrMessage && (
            <p className="text-xs text-zinc-400 text-center">{ocrMessage}</p>
          )}
        </div>

        {/* 금액 입력 */}
        <div className="flex flex-col gap-2">
          <label className="text-zinc-400 text-sm">얼마 썼어?</label>
          <div className="flex items-end gap-2 border-b-2 border-zinc-700 focus-within:border-white pb-2 transition-colors">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min={1}
              inputMode="numeric"
              className="flex-1 text-5xl font-black bg-transparent outline-none text-right placeholder:text-zinc-700"
            />
            <span className="text-2xl font-bold text-zinc-400 mb-1">원</span>
          </div>
        </div>

        {/* 카테고리 선택 */}
        <div className="flex flex-col gap-3">
          <label className="text-zinc-400 text-sm">카테고리</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(([key, label]) => {
              const [emoji, name] = label.split(' ')
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-colors ${
                    category === key
                      ? 'border-white bg-white text-zinc-950'
                      : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span>{name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 메모 입력 */}
        <div className="flex flex-col gap-2">
          <label className="text-zinc-400 text-sm">메모 <span className="text-zinc-600">(선택)</span></label>
          <input
            type="text"
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="무엇에 썼나요?"
            maxLength={100}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
          />
        </div>

        {/* 페르소나 선택 */}
        <div className="flex flex-col gap-3">
          <label className="text-zinc-400 text-sm">누구한테 혼날까?</label>
          <div className="grid grid-cols-2 gap-2">
            {PERSONAS.filter(p => p.status === 'free').map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersonaId(p.id)}
                className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors ${
                  personaId === p.id
                    ? 'border-white bg-zinc-800'
                    : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-sm font-bold text-white">{p.name}</span>
                <span className="text-xs text-zinc-400 leading-snug">{p.description}</span>
              </button>
            ))}
          </div>

          {/* 잠금 페르소나 — Waitlist */}
          <div className="grid grid-cols-2 gap-2">
            {PERSONAS.filter(p => p.status === 'locked').map(p => (
              <PersonaLockedCard key={p.id} persona={p} />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <div className="flex-1" />

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-white text-zinc-950 font-black py-4 rounded-2xl text-lg disabled:opacity-50 transition-opacity"
        >
          {isPending ? '잔소리 준비 중...' : '🪖 등짝 맞으러 가기'}
        </button>
      </form>
    </div>
  )
}
