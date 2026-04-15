'use server'

import { createClient } from '@/lib/supabase/server'
import { getGeminiModel } from '@/lib/gemini/client'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/types/expense'

const VALID_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]

export interface OcrResult {
  amount: number | null
  category: ExpenseCategory | null
  confidence: 'high' | 'low'
}

export async function extractReceiptData(
  base64Image: string,
  mimeType: string
): Promise<OcrResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')

  // 지원 이미지 형식 제한
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new Error('지원하지 않는 이미지 형식입니다 (JPEG/PNG/WebP 가능)')
  }

  const model = getGeminiModel()

  const prompt = `이 영수증 이미지에서 정보를 추출해주세요.
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 금지):
{
  "amount": <숫자, 최종 결제 금액만, 없으면 null>,
  "category": <"food"|"transport"|"cafe"|"shopping"|"entertainment"|"health"|"other", 없으면 null>,
  "confidence": <"high"|"low">
}

카테고리 기준:
- food: 음식점, 식당, 마트, 편의점
- transport: 교통, 주유, 주차
- cafe: 카페, 커피, 음료
- shopping: 쇼핑, 의류, 전자제품
- entertainment: 오락, 게임, 영화
- health: 약국, 병원, 헬스
- other: 기타`

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType } },
  ])

  const text = result.response.text().trim()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { amount: null, category: null, confidence: 'low' }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      amount: typeof parsed.amount === 'number' && parsed.amount > 0 && parsed.amount <= 100_000_000
        ? Math.round(parsed.amount)
        : null,
      category: VALID_CATEGORIES.includes(parsed.category) ? (parsed.category as ExpenseCategory) : null,
      confidence: parsed.confidence === 'high' ? 'high' : 'low',
    }
  } catch {
    return { amount: null, category: null, confidence: 'low' }
  }
}
