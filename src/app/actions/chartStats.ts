'use server'

import { createClient } from '@/lib/supabase/server'
import type { ExpenseCategory } from '@/types/expense'
import { EXPENSE_CATEGORY_LABELS } from '@/types/expense'

export interface DailyTrendPoint {
  date: string   // YYYY-MM-DD
  label: string  // M/D
  total: number
  overBudget: boolean
}

export interface DailyTrendResult {
  points: DailyTrendPoint[]
  dailyBudget: number
  maxTotal: number
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory
  label: string
  total: number
  percent: number
}

export async function getDailyTrend(days: 7 | 30): Promise<DailyTrendResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')

  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (days - 1))

  const startStr = startDate.toISOString().split('T')[0]!
  const endStr = today.toISOString().split('T')[0]!

  const [expensesResult, profileResult] = await Promise.all([
    supabase
      .from('expenses')
      .select('amount, spent_at')
      .eq('user_id', user.id)
      .gte('spent_at', startStr)
      .lte('spent_at', endStr),
    supabase
      .from('profiles')
      .select('daily_budget')
      .eq('id', user.id)
      .single(),
  ])

  const dailyBudget = profileResult.data?.daily_budget ?? 30000

  // 날짜별 합산
  const totalsMap = new Map<string, number>()
  for (const e of expensesResult.data ?? []) {
    totalsMap.set(e.spent_at, (totalsMap.get(e.spent_at) ?? 0) + e.amount)
  }

  // 빈 날짜 0으로 채움
  const points: DailyTrendPoint[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]!
    const [, m, day] = dateStr.split('-')
    const label = `${parseInt(m ?? '1')}/${parseInt(day ?? '1')}`
    const total = totalsMap.get(dateStr) ?? 0
    points.push({ date: dateStr, label, total, overBudget: total > dailyBudget })
  }

  const maxTotal = Math.max(...points.map(p => p.total), dailyBudget)

  return { points, dailyBudget, maxTotal }
}

export async function getCategoryBreakdown(days: 7 | 30): Promise<CategoryBreakdownItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1))
  const startStr = startDate.toISOString().split('T')[0]!
  const endStr = new Date().toISOString().split('T')[0]!

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount, category')
    .eq('user_id', user.id)
    .gte('spent_at', startStr)
    .lte('spent_at', endStr)

  const totalsMap = new Map<string, number>()
  for (const e of expenses ?? []) {
    totalsMap.set(e.category, (totalsMap.get(e.category) ?? 0) + e.amount)
  }

  const grandTotal = Array.from(totalsMap.values()).reduce((s, v) => s + v, 0)
  if (grandTotal === 0) return []

  return (Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[])
    .map(cat => ({
      category: cat,
      label: EXPENSE_CATEGORY_LABELS[cat],
      total: totalsMap.get(cat) ?? 0,
      percent: Math.round(((totalsMap.get(cat) ?? 0) / grandTotal) * 100),
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
}
