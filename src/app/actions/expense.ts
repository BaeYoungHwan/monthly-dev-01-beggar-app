'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getGeminiModel } from '@/lib/gemini/client'
import { EXPENSE_CATEGORY_LABELS, type CreateExpenseInput, type ExpenseCategory } from '@/types/expense'
import { PERSONAS } from '@/types/persona'

function buildNagPrompt(
  personaId: string,
  amount: number,
  category: ExpenseCategory,
  memo: string | undefined
): string {
  const categoryLabel = EXPENSE_CATEGORY_LABELS[category]
  const context = `사용자가 오늘 ${categoryLabel}에 ${amount.toLocaleString()}원을 지출했다.${memo ? ` 메모: "${memo}"` : ''}`

  const personaPrompts: Record<string, string> = {
    drill_sergeant: `당신은 지옥의 조교다. 반말로, 군대식으로 짧고 거칠게 혼내라. 재치 있고 B급 감성을 유지하되 진짜 비하는 하지 말 것. 2~3문장.`,
    disappointed_parent: `당신은 실망한 부모님이다. 한숨 쉬며 포기한 듯하지만 애정이 느껴지게 혼내라. 긴 설교 금지, 짧게 찌르는 한마디. 2~3문장.`,
    rich_friend: `당신은 이미 경제적 자유를 이룬 부자 친구다. 가볍게 비웃으며 "그 돈이면 X를 살 수 있었는데" 식으로 혼내라. 2~3문장.`,
    ai_accountant: `당신은 냉정한 AI 회계사다. 수치와 통계로만 말하라. 감정 없이 사실만 전달. 2~3문장.`,
  }

  const instruction = personaPrompts[personaId] ?? personaPrompts['drill_sergeant']!

  return `${instruction}\n\n상황: ${context}\n\n잔소리 (한국어로, 따옴표 없이):`
}

export async function createExpense(
  input: CreateExpenseInput & { personaId: string }
): Promise<{ nagResult: string; personaId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('인증이 필요합니다')

  // 잠금 페르소나 사용 방지
  const persona = PERSONAS.find(p => p.id === input.personaId)
  if (!persona || persona.status === 'locked') {
    throw new Error('사용할 수 없는 페르소나입니다')
  }

  // 1. Gemini 잔소리 생성
  const model = getGeminiModel()
  const prompt = buildNagPrompt(input.personaId, input.amount, input.category, input.memo)
  const geminiResult = await model.generateContent(prompt)
  const nagResult = geminiResult.response.text().trim()

  // 2. expenses INSERT
  const today = new Date().toISOString().split('T')[0]!

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
  await supabase
    .from('daily_checkins')
    .upsert(
      { user_id: user.id, checkin_date: today, checkin_type: 'with_spend' },
      { onConflict: 'user_id,checkin_date' }
    )

  // 4. profiles.checkin_streak 업데이트
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]!

  const { data: profile } = await supabase
    .from('profiles')
    .select('checkin_streak, last_checkin_date')
    .eq('id', user.id)
    .single()

  if (profile) {
    let newStreak = 1
    if (profile.last_checkin_date === today) {
      newStreak = profile.checkin_streak // 오늘 이미 체크인 → streak 유지
    } else if (profile.last_checkin_date === yesterday) {
      newStreak = profile.checkin_streak + 1 // 연속 체크인
    }

    await supabase
      .from('profiles')
      .update({ checkin_streak: newStreak, last_checkin_date: today })
      .eq('id', user.id)
  }

  revalidatePath('/dashboard')

  return { nagResult, personaId: input.personaId }
}
