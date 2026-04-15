import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/app/actions/leaderboard'
import LeaderboardCard from '@/components/LeaderboardCard'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getLeaderboard()

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-8 gap-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-zinc-400 text-2xl leading-none" aria-label="뒤로">
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold">리더보드</h1>
          <p className="text-xs text-zinc-500">최근 7일 순위</p>
        </div>
      </div>

      <LeaderboardCard
        honorRoll={data.honorRoll}
        shameRoll={data.shameRoll}
        totalUsers={data.totalUsers}
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
        <p className="text-xs text-zinc-500 leading-relaxed">
          모든 순위는 익명으로 표시됩니다.<br />
          체크인 1회 이상 시 명예의 전당 참여 자격이 주어집니다.
        </p>
      </div>
    </div>
  )
}

export function generateMetadata() {
  return { title: '리더보드 — 동결거지' }
}
