'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getGeminiModel } from '@/lib/gemini/client'
import { EXPENSE_CATEGORY_LABELS, type CreateExpenseInput, type ExpenseCategory } from '@/types/expense'
import { PERSONAS } from '@/types/persona'
import { updateStreak } from '@/lib/streak/updateStreak'
import { getTodayStats } from '@/app/actions/stats'

const VALID_CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]
const MAX_AMOUNT = 100_000_000 // 1억원 상한

function buildNagPrompt(
  personaId: string,
  amount: number,
  category: ExpenseCategory,
  memo: string | undefined,
  stats?: { percentile: number; avgTotal: number; myNewTotal: number }
): string {
  const categoryLabel = EXPENSE_CATEGORY_LABELS[category]
  const context = `사용자가 오늘 ${categoryLabel}에 ${amount.toLocaleString()}원을 지출했다.${memo ? ` 메모: "${memo}"` : ''}`

  // 백분위/평균 데이터가 있으면 맥락으로 추가
  const statsContext = stats
    ? ` 오늘 총 지출은 ${stats.myNewTotal.toLocaleString()}원으로, 전체 유저 중 상위 ${stats.percentile}% (평균 ${stats.avgTotal.toLocaleString()}원 대비 ${stats.myNewTotal > stats.avgTotal ? `${(stats.myNewTotal - stats.avgTotal).toLocaleString()}원 초과` : `${(stats.avgTotal - stats.myNewTotal).toLocaleString()}원 절약`})다.`
    : ''

  const personaPrompts: Record<string, string> = {
    drill_sergeant: `당신은 지옥의 조교다. 반말로, 군대식으로 짧고 거칠게 혼내라. 재치 있고 B급 감성을 유지하되 진짜 비하는 하지 말 것. 2~3문장.`,
    disappointed_parent: `당신은 실망한 부모님이다. 한숨 쉬며 포기한 듯하지만 애정이 느껴지게 혼내라. 긴 설교 금지, 짧게 찌르는 한마디. 2~3문장.`,
    rich_friend: `당신은 이미 경제적 자유를 이룬 부자 친구다. 가볍게 비웃으며 "그 돈이면 X를 살 수 있었는데" 식으로 혼내라. 2~3문장.`,
    ai_accountant: `당신은 냉정한 AI 회계사다. 수치와 통계로만 말하라. 감정 없이 사실만 전달. 제공된 백분위와 평균 데이터를 활용하라. 2~3문장.`,
  }

  const instruction = personaPrompts[personaId] ?? personaPrompts['drill_sergeant']!

  return `${instruction}\n\n상황: ${context}${statsContext}\n\n잔소리 (한국어로, 따옴표 없이):`
}

export async function createExpense(
  input: CreateExpenseInput & { personaId: string }
): Promise<{ nagResult: string; personaId: string }> {
  // 서버 측 입력 검증
  if (!input.amount || input.amount <= 0 || input.amount > MAX_AMOUNT) {
    throw new Error('유효하지 않은 금액입니다')
  }
  if (!VALID_CATEGORIES.includes(input.category)) {
    throw new Error('유효하지 않은 카테고리입니다')
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('인증이 필요합니다')

  // 잠금 페르소나 사용 방지
  const persona = PERSONAS.find(p => p.id === input.personaId)
  if (!persona || persona.status === 'locked') {
    throw new Error('사용할 수 없는 페르소나입니다')
  }

  const today = new Date().toISOString().split('T')[0]!

  // 오늘 기존 지출 합계 조회 (잔소리 프롬프트에 총액 컨텍스트 제공용)
  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', user.id)
    .eq('spent_at', today)

  const prevTotal = (prevExpenses ?? []).reduce((sum, e) => sum + e.amount, 0)
  const myNewTotal = prevTotal + input.amount

  // 백분위 + 평균 데이터 조회 (잔소리 강화용)
  let stats: { percentile: number; avgTotal: number; myNewTotal: number } | undefined
  try {
    const todayStats = await getTodayStats(myNewTotal)
    stats = { percentile: todayStats.percentile, avgTotal: todayStats.avgTotal, myNewTotal }
  } catch {
    // 통계 조회 실패 시 잔소리는 통계 없이 생성
  }

  // 1. Gemini 잔소리 생성
  const model = getGeminiModel()
  const prompt = buildNagPrompt(input.personaId, input.amount, input.category, input.memo, stats)
  const geminiResult = await model.generateContent(prompt)
  const nagResult = geminiResult.response.text().trim()

  // 2. expenses INSERT
  const { error: expenseError } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      amount: input.amount,
      category: input.category,
      memo: input.memo ?? null,
      nag_result: nagResult,
      spent_at: today,
    })

  if (expenseError) throw new Error(expenseError.message)

  // 3. daily_checkins UPSERT (with_spend)
  const { error: checkinError } = await supabase
    .from('daily_checkins')
    .upsert(
      { user_id: user.id, checkin_date: today, checkin_type: 'with_spend' },
      { onConflict: 'user_id,checkin_date' }
    )

  if (checkinError) console.error('[createExpense] daily_checkins 업데이트 실패:', checkinError.message)

  // 4. streak 업데이트 (공통 유틸)
  await updateStreak(supabase, user.id)

  revalidatePath('/dashboard')

  return { nagResult, personaId: input.personaId }
}
