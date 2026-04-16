'use server'

import { createClient } from '@/lib/supabase/server'
import type { Expense } from '@/types/expense'

export interface DashboardData {
  profile: {
    daily_budget: number
    checkin_streak: number
    last_checkin_date: string | null
    neighborhood: string | null
    age_group: string | null
  }
  todayTotal: number
  weekTotal: number
  todayExpenses: Expense[]
  hasCheckinToday: boolean
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('인증이 필요합니다')

  const today = new Date().toISOString().split('T')[0]!
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]!

  // 병렬 조회
  const [profileResult, todayExpensesResult, weekExpensesResult, checkinResult] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('daily_budget, checkin_streak, last_checkin_date, neighborhood, age_group')
        .eq('id', user.id)
        .single(),

      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('spent_at', today)
        .order('created_at', { ascending: false }),

      supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('spent_at', weekAgo)
        .lte('spent_at', today),

      supabase
        .from('daily_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle(),
    ])

  const profile = profileResult.data ?? {
    daily_budget: 30000,
    checkin_streak: 0,
    last_checkin_date: null,
    neighborhood: null,
    age_group: null,
  }

  const todayExpenses = (todayExpensesResult.data ?? []) as Expense[]
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0)
  const weekTotal = (weekExpensesResult.data ?? []).reduce((sum, e) => sum + e.amount, 0)
  const hasCheckinToday = !!checkinResult.data

  return {
    profile,
    todayTotal,
    weekTotal,
    todayExpenses,
    hasCheckinToday,
  }
}
