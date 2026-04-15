'use server'

import { createClient } from '@/lib/supabase/server'
import { calcPercentile, blendDistribution } from '@/lib/grade/percentile'

export interface TodayStats {
  myTotal: number
  avgTotal: number
  percentile: number       // 상위 N%
  totalUsers: number
  isSimulated: boolean     // 가상 데이터 혼합 여부
}

export async function getTodayStats(myTotal: number): Promise<TodayStats> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]!

  // daily_aggregates에서 오늘 집계 조회
  const { data: aggregate } = await supabase
    .from('daily_aggregates')
    .select('total_users, avg_daily_total')
    .eq('aggregated_date', today)
    .maybeSingle()

  // 집계 데이터 없거나 유저 수 30명 미만이면 가상 데이터 혼합
  if (!aggregate || aggregate.total_users < 30) {
    const { data: realExpenses } = await supabase
      .from('expenses')
      .select('user_id, amount')
      .eq('spent_at', today)

    // 유저별 오늘 지출 합계
    const userTotals = new Map<string, number>()
    for (const e of realExpenses ?? []) {
      userTotals.set(e.user_id, (userTotals.get(e.user_id) ?? 0) + e.amount)
    }

    const realData = Array.from(userTotals.values())
    const blended = blendDistribution(realData)
    const avgTotal = Math.round(blended.reduce((s, v) => s + v, 0) / blended.length)
    const percentile = calcPercentile(myTotal, blended)

    return {
      myTotal,
      avgTotal,
      percentile,
      totalUsers: realData.length,
      isSimulated: realData.length < 30,
    }
  }

  // 충분한 집계 데이터가 있을 때
  const avgTotal = Math.round(aggregate.avg_daily_total)
  // daily_aggregates에 개별 분포가 없으므로 평균 기반 추정
  const percentile = myTotal <= avgTotal
    ? Math.round(50 + ((avgTotal - myTotal) / avgTotal) * 40)
    : Math.max(5, Math.round(50 - ((myTotal - avgTotal) / avgTotal) * 40))

  return {
    myTotal,
    avgTotal,
    percentile: Math.min(95, Math.max(1, percentile)),
    totalUsers: aggregate.total_users,
    isSimulated: false,
  }
}
