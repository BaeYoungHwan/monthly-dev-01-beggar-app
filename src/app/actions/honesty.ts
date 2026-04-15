'use server'

import { createClient } from '@/lib/supabase/server'

export interface HonestyScore {
  score: number
  checkinRate: number
  budgetRate: number
  stabilityRate: number
  checkinCount: number
  isEnough: boolean
}

export async function getHonestyScore(): Promise<HonestyScore> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0]!
  const today = new Date().toISOString().split('T')[0]!

  const [profileResult, checkinsResult, expensesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('daily_budget')
      .eq('id', user.id)
      .single(),

    supabase
      .from('daily_checkins')
      .select('checkin_date')
      .eq('user_id', user.id)
      .gte('checkin_date', thirtyDaysAgo)
      .lte('checkin_date', today),

    supabase
      .from('expenses')
      .select('amount, spent_at')
      .eq('user_id', user.id)
      .gte('spent_at', thirtyDaysAgo)
      .lte('spent_at', today),
  ])

  const dailyBudget = profileResult.data?.daily_budget ?? 30000
  const checkins = checkinsResult.data ?? []
  const expenses = expensesResult.data ?? []

  const checkinDates = new Set(checkins.map(c => c.checkin_date))

  // 날짜별 지출 합산
  const dailyTotals: Record<string, number> = {}
  for (const e of expenses) {
    dailyTotals[e.spent_at] = (dailyTotals[e.spent_at] ?? 0) + e.amount
  }

  // 30일 날짜 배열
  const days: string[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().split('T')[0]!
    days.push(d)
  }

  // 1. 체크인 일관성 (30일 중 체크인한 날 비율) × 40점
  const checkinCount = days.filter(d => checkinDates.has(d)).length
  const checkinRate = checkinCount / 30

  // 2. 예산 준수율 (체크인한 날 중 예산 이하 지출 비율) × 40점
  const checkedDays = days.filter(d => checkinDates.has(d))
  const budgetCompliantDays = checkedDays.filter(d => (dailyTotals[d] ?? 0) <= dailyBudget)
  const budgetRate = checkedDays.length > 0 ? budgetCompliantDays.length / checkedDays.length : 0

  // 3. 지출 패턴 안정성 (변동계수 기반) × 20점
  const amounts = days
    .filter(d => dailyTotals[d] !== undefined)
    .map(d => dailyTotals[d]!)

  let stabilityRate = 1
  if (amounts.length > 1) {
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length
    if (avg > 0) {
      const variance = amounts.reduce((s, a) => s + (a - avg) ** 2, 0) / amounts.length
      const stdDev = Math.sqrt(variance)
      const cv = stdDev / avg
      stabilityRate = Math.max(0, 1 - Math.min(cv, 1))
    }
  }

  const score = Math.round(checkinRate * 40 + budgetRate * 40 + stabilityRate * 20)

  return {
    score,
    checkinRate,
    budgetRate,
    stabilityRate,
    checkinCount,
    isEnough: checkinCount >= 7,
  }
}
