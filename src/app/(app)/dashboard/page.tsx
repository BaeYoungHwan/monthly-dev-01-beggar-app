import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/app/actions/dashboard'
import GradeCard from '@/components/GradeCard'
import ExpenseList from '@/components/ExpenseList'
import CheckinBanner from '@/components/CheckinBanner'
import DetectiveBanner from '@/components/DetectiveBanner'
import PercentileCard from '@/components/PercentileCard'
import SuspiciousBadge from '@/components/SuspiciousBadge'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getDashboardData()

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-28 gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">동결거지</h1>
          <p className="text-zinc-500 text-xs mt-0.5">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/leaderboard" className="text-zinc-400 hover:text-white transition-colors" aria-label="리더보드">
            🏆
          </Link>
          <Link href="/settings" className="text-zinc-400 hover:text-white transition-colors" aria-label="설정">
            ⚙️
          </Link>
        </div>
      </div>

      {/* 의심스러운 거지 배지 (3일 이상 미체크인) */}
      <SuspiciousBadge lastCheckinDate={data.profile.last_checkin_date} />

      {/* AI 탐정 배너 (오후 2시 이후 + 미체크인) */}
      <DetectiveBanner hasCheckinToday={data.hasCheckinToday} />

      {/* 생존 신고 배너 */}
      <CheckinBanner hasCheckinToday={data.hasCheckinToday} />

      {/* 등급 카드 */}
      <GradeCard
        dailyBudget={data.profile.daily_budget}
        todayTotal={data.todayTotal}
        checkinStreak={data.profile.checkin_streak}
      />

      {/* 비교 통계 */}
      <PercentileCard todayTotal={data.todayTotal} />

      {/* 지출 내역 */}
      <ExpenseList
        expenses={data.todayExpenses}
        todayTotal={data.todayTotal}
        weekTotal={data.weekTotal}
      />

      {/* FAB — 지출 입력 */}
      <Link
        href="/expense/new"
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-white text-zinc-950 font-black py-4 rounded-2xl text-center text-lg shadow-lg"
      >
        🪖 지출 입력
      </Link>
    </div>
  )
}

export function generateMetadata() {
  return { title: '동결거지 대시보드' }
}
