'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export interface LeaderboardEntry {
  anonymousId: string   // 거지 #XXXX
  score: number
  weekTotal: number
  checkinCount: number
}

export interface LeaderboardData {
  honorRoll: LeaderboardEntry[]   // 명예의 전당: 절약 점수 상위 3
  shameRoll: LeaderboardEntry[]   // 굴욕의 전당: 주간 과소비 상위 3
  totalUsers: number
}

// 최근 7일 기준 리더보드 데이터 조회
export async function getLeaderboard(): Promise<LeaderboardData> {
  const supabase = createAdminClient()

  const today = new Date().toISOString().split('T')[0]!
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]!

  // 이번 주 지출 (user_id별 합계)
  const { data: weekExpenses } = await supabase
    .from('expenses')
    .select('user_id, amount')
    .gte('spent_at', weekAgo)
    .lte('spent_at', today)

  // 이번 주 체크인 횟수
  const { data: weekCheckins } = await supabase
    .from('daily_checkins')
    .select('user_id')
    .gte('checkin_date', weekAgo)
    .lte('checkin_date', today)

  // 프로필 (일일 예산)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, daily_budget')

  if (!profiles) return { honorRoll: [], shameRoll: [], totalUsers: 0 }

  // 유저별 주간 지출 합계
  const userWeekTotal = new Map<string, number>()
  for (const e of weekExpenses ?? []) {
    userWeekTotal.set(e.user_id, (userWeekTotal.get(e.user_id) ?? 0) + e.amount)
  }

  // 유저별 체크인 횟수
  const userCheckinCount = new Map<string, number>()
  for (const c of weekCheckins ?? []) {
    userCheckinCount.set(c.user_id, (userCheckinCount.get(c.user_id) ?? 0) + 1)
  }

  // 익명 ID 생성: user_id 마지막 4자리 대문자
  function toAnonymousId(userId: string): string {
    return `거지 #${userId.slice(-4).toUpperCase()}`
  }

  // 명예의 전당: 절약 점수 = 체크인 수 × 절약률
  // 절약률 = max(0, (weekly_budget - week_total) / weekly_budget) * 100
  const honorEntries = profiles
    .map(p => {
      const weekTotal = userWeekTotal.get(p.id) ?? 0
      const weekBudget = p.daily_budget * 7
      const savingsRate = weekBudget > 0
        ? Math.max(0, (weekBudget - weekTotal) / weekBudget)
        : 0
      const checkinCount = userCheckinCount.get(p.id) ?? 0
      const score = Math.round(checkinCount * savingsRate * 100)
      return {
        anonymousId: toAnonymousId(p.id),
        score,
        weekTotal,
        checkinCount,
      }
    })
    .filter(e => e.checkinCount > 0) // 체크인 1회 이상만 포함
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  // 굴욕의 전당: 주간 최다 지출 TOP 3
  const shameEntries = profiles
    .map(p => ({
      anonymousId: toAnonymousId(p.id),
      score: userWeekTotal.get(p.id) ?? 0,
      weekTotal: userWeekTotal.get(p.id) ?? 0,
      checkinCount: userCheckinCount.get(p.id) ?? 0,
    }))
    .filter(e => e.weekTotal > 0)
    .sort((a, b) => b.weekTotal - a.weekTotal)
    .slice(0, 3)

  return {
    honorRoll: honorEntries,
    shameRoll: shameEntries,
    totalUsers: profiles.length,
  }
}
