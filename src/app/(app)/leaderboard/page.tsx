import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getLeaderboard } from '@/app/actions/leaderboard'
import LeaderboardCard from '@/components/LeaderboardCard'
import NeighborhoodTips from '@/components/NeighborhoodTips'
import TipSubmitButton from '@/components/TipSubmitButton'

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

  // 내 동네 (제보 폼 기본값 용도)
  let myNeighborhood: string | null = null
  if (activeTab === 'map') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('neighborhood')
      .eq('id', user.id)
      .single()
    myNeighborhood = profile?.neighborhood ?? null
  }

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
            {activeTab === 'map' ? '거지들이 직접 발굴한 가성비 꿀팁' : '최근 7일 순위'}
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

      {/* 리더보드 탭 */}
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

      {/* 거지맵 탭 */}
      {activeTab === 'map' && (
        <>
          {/* 제보 버튼 */}
          <TipSubmitButton defaultNeighborhood={myNeighborhood} />

          {/* 팁 리스트 */}
          <Suspense fallback={
            <div className="flex justify-center py-8 text-zinc-600 text-sm">불러오는 중...</div>
          }>
            <NeighborhoodTips />
          </Suspense>
        </>
      )}
    </div>
  )
}

export function generateMetadata() {
  return { title: '리더보드 — 동결거지' }
}
