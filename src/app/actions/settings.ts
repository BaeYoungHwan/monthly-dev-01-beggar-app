'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MIN_BUDGET = 1000     // 최소 1,000원
const MAX_BUDGET = 10_000_000 // 최대 1,000만원

export async function updateDailyBudget(budget: number): Promise<void> {
  if (!budget || budget < MIN_BUDGET || budget > MAX_BUDGET) {
    throw new Error(`일일 예산은 ${MIN_BUDGET.toLocaleString()}원 이상 ${MAX_BUDGET.toLocaleString()}원 이하로 설정해 주세요`)
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('인증이 필요합니다')

  const { error } = await supabase
    .from('profiles')
    .update({ daily_budget: Math.round(budget) })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/settings')
}
