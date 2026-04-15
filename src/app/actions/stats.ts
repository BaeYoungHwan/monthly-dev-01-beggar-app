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
    // amount만 조회 — user_id 등 개인 식별 정보 노출 방지
    const { data: realExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('spent_at', today)

    // 집계는 개인 지출 합산 없이 금액 목록만 사용 (익명 집계)
    const realData = (realExpenses ?? []).map(e => e.amount)
    const blended = blendDistribution(realData)
    const avgTotal = blended.length > 0
      ? Math.round(blended.reduce((s, v) => s + v, 0) / blended.length)
      : 0
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

  // avgTotal이 0인 경우 (무지출 일수) 가드
  if (avgTotal === 0) {
    return {
      myTotal,
      avgTotal: 0,
      percentile: myTotal === 0 ? 50 : 5,
      totalUsers: aggregate.total_users,
      isSimulated: false,
    }
  }

  // 평균 기반 백분위 추정 (개별 분포 없을 때)
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
