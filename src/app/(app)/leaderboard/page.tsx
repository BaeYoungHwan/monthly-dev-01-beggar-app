import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/app/actions/leaderboard'
import LeaderboardCard from '@/components/LeaderboardCard'
import NeighborhoodMap from '@/components/NeighborhoodMap'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { tab } = await searchParams
  const activeTab = tab === 'map' ? 'map' : 'leaderboard'

  const data = activeTab === 'leaderboard' ? await getLeaderboard() : null

  return (
    <div className="flex flex-col min-h-screen px-6 pt-12 pb-8 gap-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-zinc-400 text-2xl leading-none" aria-label="뒤로">
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {activeTab === 'map' ? '거지맵' : '리더보드'}
          </h1>
          <p className="text-xs text-zinc-500">
            {activeTab === 'map' ? '동네별 절약 랭킹' : '최근 7일 순위'}
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2">
        <Link
          href="/leaderboard?tab=leaderboard"
          className={`flex-1 py-2 rounded-xl text-sm font-bold text-center transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-white text-zinc-950'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          🏆 리더보드
        </Link>
        <Link
          href="/leaderboard?tab=map"
          className={`flex-1 py-2 rounded-xl text-sm font-bold text-center transition-colors ${
            activeTab === 'map'
              ? 'bg-white text-zinc-950'
              : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          🗺️ 거지맵
        </Link>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'leaderboard' && data && (
        <>
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
        </>
      )}

      {activeTab === 'map' && <NeighborhoodMap />}
    </div>
  )
}

export function generateMetadata() {
  return { title: '리더보드 — 동결거지' }
}
