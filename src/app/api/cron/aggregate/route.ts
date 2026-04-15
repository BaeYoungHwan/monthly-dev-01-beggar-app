// Vercel Cron — 매일 자정 KST(15:00 UTC) 전날 지출 집계
// vercel.json: { "crons": [{ "path": "/api/cron/aggregate", "schedule": "0 15 * * *" }] }
// 환경변수 필요: CRON_SECRET (Vercel 대시보드에서 설정)
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 집계 대상: 어제 날짜 (KST 기준이지만 서버는 UTC → 호출 시점이 자정 KST이므로 어제가 전날)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]!

  try {
    // 어제 모든 유저의 지출 내역 조회 (RLS 우회)
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('user_id, amount, category')
      .eq('spent_at', yesterday)

    if (error) throw error

    if (!expenses || expenses.length === 0) {
      // 지출 없는 날 — 집계 0으로 기록
      await supabase.from('daily_aggregates').upsert(
        {
          aggregated_date: yesterday,
          total_users: 0,
          avg_daily_total: 0,
          median_daily_total: 0,
          top_category: null,
          no_spend_users: 0,
        },
        { onConflict: 'aggregated_date' }
      )
      return NextResponse.json({ ok: true, date: yesterday, total_users: 0 })
    }

    // 유저별 지출 합계
    const userTotals = new Map<string, number>()
    const categoryCount = new Map<string, number>()

    for (const e of expenses) {
      userTotals.set(e.user_id, (userTotals.get(e.user_id) ?? 0) + e.amount)
      categoryCount.set(e.category, (categoryCount.get(e.category) ?? 0) + 1)
    }

    const amounts = Array.from(userTotals.values())
    const totalUsers = amounts.length
    const avgDailyTotal = Math.round(amounts.reduce((s, v) => s + v, 0) / totalUsers)

    // 중앙값 계산
    const sorted = [...amounts].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const medianDailyTotal =
      sorted.length % 2 === 0
        ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
        : (sorted[mid] ?? 0)

    // 최다 카테고리
    const topCategory = [...categoryCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    // 체크인 중 무지출 유저 수 (no_spend 타입)
    const { count: noSpendUsers } = await supabase
      .from('daily_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('checkin_date', yesterday)
      .eq('checkin_type', 'no_spend')

    await supabase.from('daily_aggregates').upsert(
      {
        aggregated_date: yesterday,
        total_users: totalUsers,
        avg_daily_total: avgDailyTotal,
        median_daily_total: medianDailyTotal,
        top_category: topCategory,
        no_spend_users: noSpendUsers ?? 0,
      },
      { onConflict: 'aggregated_date' }
    )

    return NextResponse.json({
      ok: true,
      date: yesterday,
      total_users: totalUsers,
      avg_daily_total: avgDailyTotal,
    })
  } catch (err) {
    console.error('[cron/aggregate] 집계 실패:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
