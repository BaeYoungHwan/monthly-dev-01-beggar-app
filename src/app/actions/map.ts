'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { blendNeighborhoodData, getNeighborhoodGrade } from '@/lib/grade/neighborhoodBlend'
import type { NeighborhoodData } from '@/lib/grade/neighborhoodBlend'

export interface NeighborhoodMapItem extends NeighborhoodData {
  rank: number
  isMyNeighborhood: boolean
  grade: { label: string; color: string }
}

export interface NeighborhoodMapResult {
  items: NeighborhoodMapItem[]
  myNeighborhood: string | null
  isSimulated: boolean
}

export async function getNeighborhoodMap(): Promise<NeighborhoodMapResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('인증이 필요합니다')

  // 내 동네 조회
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('neighborhood')
    .eq('id', user.id)
    .single()
  const myNeighborhood = myProfile?.neighborhood ?? null

  const admin = createAdminClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]!
  const today = new Date().toISOString().split('T')[0]!

  // 동네 설정된 user_id 목록 조회 (neighborhood만, 개인정보 최소화)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, neighborhood')
    .not('neighborhood', 'is', null)

  if (!profiles || profiles.length === 0) {
    const blended = blendNeighborhoodData([])
    const items = blended
      .sort((a, b) => a.avgDailySpend - b.avgDailySpend)
      .map((d, i) => ({
        ...d,
        rank: i + 1,
        isMyNeighborhood: d.name === myNeighborhood,
        grade: getNeighborhoodGrade(d.avgDailySpend),
      }))
    return { items, myNeighborhood, isSimulated: true }
  }

  // 동네별 user_id 맵 구성
  const neighborhoodUsers = new Map<string, string[]>()
  for (const p of profiles) {
    if (!p.neighborhood) continue
    const list = neighborhoodUsers.get(p.neighborhood) ?? []
    list.push(p.id)
    neighborhoodUsers.set(p.neighborhood, list)
  }

  // 최근 7일 지출 조회 (amount + user_id, 개인 식별 최소화)
  const { data: expenses } = await admin
    .from('expenses')
    .select('user_id, amount, spent_at')
    .gte('spent_at', sevenDaysAgo)
    .lte('spent_at', today)
    .in('user_id', profiles.map(p => p.id))

  // 동네별 평균 일일 지출 계산
  const realData: NeighborhoodData[] = []

  for (const [neighborhood, userIds] of neighborhoodUsers.entries()) {
    const userTotals = new Map<string, number>()
    for (const uid of userIds) userTotals.set(uid, 0)

    for (const e of expenses ?? []) {
      if (userTotals.has(e.user_id)) {
        userTotals.set(e.user_id, (userTotals.get(e.user_id) ?? 0) + e.amount)
      }
    }

    const totals = Array.from(userTotals.values())
    const avgDailySpend = totals.length > 0
      ? Math.round(totals.reduce((s, v) => s + v, 0) / totals.length / 7)
      : 0

    realData.push({
      name: neighborhood,
      avgDailySpend,
      userCount: userIds.length,
      isSimulated: false,
    })
  }

  const blended = blendNeighborhoodData(realData)
  const isSimulated = blended.some(d => d.isSimulated)

  const items = blended
    .sort((a, b) => a.avgDailySpend - b.avgDailySpend)
    .map((d, i) => ({
      ...d,
      rank: i + 1,
      isMyNeighborhood: d.name === myNeighborhood,
      grade: getNeighborhoodGrade(d.avgDailySpend),
    }))

  return { items, myNeighborhood, isSimulated }
}
