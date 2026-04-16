import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDailyTrend, getCategoryBreakdown } from '@/app/actions/chartStats'
import TrendLineChart from '@/components/charts/TrendLineChart'
import CategoryBarChart from '@/components/charts/CategoryBarChart'

interface Props {
  searchParams: Promise<{ period?: string }>
}

export default async function StatsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { period } = await searchParams
  const days: 7 | 30 = period === '30' ? 30 : 7

  const [trend, breakdown] = await Promise.all([
    getDailyTrend(days),
    getCategoryBreakdown(days),
  ])

  const totalSpend = trend.points.reduce((s, p) => s + p.total, 0)
  const avgDaily = Math.round(totalSpend / days)
  const overBudgetDays = trend.points.filter(p => p.overBudget).length

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-8 gap-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-zinc-400 text-2xl leading-none" aria-label="뒤로">
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold">통계</h1>
          <p className="text-xs text-zinc-500">내 지출 패턴 분석</p>
        </div>
      </div>

      {/* 기간 탭 */}
      <div className="flex gap-2">
        <Link
          href="/stats?period=7"
          className={`flex-1 py-2 rounded-xl text-sm font-bold text-center transition-colors ${
            days === 7
              ? 'bg-white text-zinc-950'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          최근 7일
        </Link>
        <Link
          href="/stats?period=30"
          className={`flex-1 py-2 rounded-xl text-sm font-bold text-center transition-colors ${
            days === 30
              ? 'bg-white text-zinc-950'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          최근 30일
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
          <p className="text-xs text-zinc-500">총 지출</p>
          <p className="text-lg font-black">{(totalSpend / 10000).toFixed(1)}만</p>
          <p className="text-xs text-zinc-600">원</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col gap-1">
          <p className="text-xs text-zinc-500">일 평균</p>
          <p className="text-lg font-black">{(avgDaily / 1000).toFixed(1)}k</p>
          <p className="text-xs text-zinc-600">원</p>
        </div>
        <div className={`border rounded-xl p-3 flex flex-col gap-1 ${
          overBudgetDays > 0
            ? 'bg-red-950/20 border-red-900/40'
            : 'bg-zinc-900 border-zinc-800'
        }`}>
          <p className="text-xs text-zinc-500">예산 초과</p>
          <p className={`text-lg font-black ${overBudgetDays > 0 ? 'text-red-400' : 'text-white'}`}>
            {overBudgetDays}일
          </p>
          <p className="text-xs text-zinc-600">{days}일 중</p>
        </div>
      </div>

      {/* 트렌드 차트 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-zinc-300">일별 지출 트렌드</h2>
        <TrendLineChart
          points={trend.points}
          dailyBudget={trend.dailyBudget}
          maxTotal={trend.maxTotal}
        />
      </div>

      {/* 카테고리 차트 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-zinc-300">카테고리별 지출</h2>
        <CategoryBarChart items={breakdown} />
      </div>
    </div>
  )
}

export function generateMetadata() {
  return { title: '통계 — 동결거지' }
}
