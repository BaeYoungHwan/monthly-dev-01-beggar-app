'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calcPercentile, blendDistribution } from '@/lib/grade/percentile'
import type { AgeGroup } from '@/types/profile'

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

export interface GroupStats {
  groupAvg: number
  percentile: number
  groupSize: number
  isSimulated: boolean
}

export async function getGroupStats(
  myTotal: number,
  neighborhood: string | null,
  ageGroup: AgeGroup | null,
): Promise<{ neighborhood: GroupStats | null; ageGroup: GroupStats | null }> {
  if (!neighborhood && !ageGroup) return { neighborhood: null, ageGroup: null }

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]!

  async function fetchGroupStats(
    filterField: 'neighborhood' | 'age_group',
    filterValue: string,
  ): Promise<GroupStats> {
    // 해당 그룹 user_id 목록 (amount만 조회, 개인정보 최소화)
    const { data: groupProfiles } = await admin
      .from('profiles')
      .select('id')
      .eq(filterField, filterValue)

    if (!groupProfiles || groupProfiles.length === 0) {
      const blended = blendDistribution([])
      return {
        groupAvg: Math.round(blended.reduce((s, v) => s + v, 0) / blended.length),
        percentile: calcPercentile(myTotal, blended),
        groupSize: 0,
        isSimulated: true,
      }
    }

    const userIds = groupProfiles.map(p => p.id)

    const { data: expenses } = await admin
      .from('expenses')
      .select('user_id, amount')
      .eq('spent_at', today)
      .in('user_id', userIds)

    // 유저별 합산
    const userTotals = new Map<string, number>()
    for (const uid of userIds) userTotals.set(uid, 0)
    for (const e of expenses ?? []) {
      userTotals.set(e.user_id, (userTotals.get(e.user_id) ?? 0) + e.amount)
    }

    const amounts = Array.from(userTotals.values())
    const blended = blendDistribution(amounts)
    const groupAvg = Math.round(blended.reduce((s, v) => s + v, 0) / blended.length)

    return {
      groupAvg,
      percentile: calcPercentile(myTotal, blended),
      groupSize: amounts.length,
      isSimulated: amounts.length < 30,
    }
  }

  const [neighborhoodStats, ageGroupStats] = await Promise.all([
    neighborhood ? fetchGroupStats('neighborhood', neighborhood) : Promise.resolve(null),
    ageGroup ? fetchGroupStats('age_group', ageGroup) : Promise.resolve(null),
  ])

  return { neighborhood: neighborhoodStats, ageGroup: ageGroupStats }
}
