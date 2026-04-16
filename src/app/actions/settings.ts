'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ProfileSettings, AgeGroup } from '@/types/profile'

const MIN_BUDGET = 1000
const MAX_BUDGET = 10_000_000

const VALID_AGE_GROUPS: AgeGroup[] = ['10s', '20s', '30s', '40s', '50s_plus']

export async function getProfileSettings(): Promise<ProfileSettings> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')

  const { data } = await supabase
    .from('profiles')
    .select('daily_budget, neighborhood, age_group')
    .eq('id', user.id)
    .single()

  return {
    daily_budget: data?.daily_budget ?? 30000,
    neighborhood: data?.neighborhood ?? null,
    age_group: (data?.age_group as AgeGroup | null) ?? null,
  }
}

export async function updateProfile(input: Partial<ProfileSettings>): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('인증이 필요합니다')

  const updates: Record<string, unknown> = {}

  if (input.daily_budget !== undefined) {
    const budget = Math.round(input.daily_budget)
    if (budget < MIN_BUDGET || budget > MAX_BUDGET) {
      throw new Error(`일일 예산은 ${MIN_BUDGET.toLocaleString()}원 이상 ${MAX_BUDGET.toLocaleString()}원 이하로 설정해 주세요`)
    }
    updates.daily_budget = budget
  }

  if ('neighborhood' in input) {
    updates.neighborhood = input.neighborhood ?? null
  }

  if ('age_group' in input) {
    if (input.age_group !== null && input.age_group !== undefined) {
      if (!VALID_AGE_GROUPS.includes(input.age_group)) {
        throw new Error('올바르지 않은 연령대입니다')
      }
    }
    updates.age_group = input.age_group ?? null
  }

  if (Object.keys(updates).length === 0) return

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/settings')
}

// 기존 함수 유지 (하위 호환)
export async function updateDailyBudget(budget: number): Promise<void> {
  return updateProfile({ daily_budget: budget })
}
