import Link from 'next/link'
import { getTodayStats, getGroupStats } from '@/app/actions/stats'
import type { AgeGroup } from '@/types/profile'
import { AGE_GROUP_LABELS } from '@/types/profile'

interface PercentileCardProps {
  todayTotal: number
  neighborhood?: string | null
  ageGroup?: string | null
}

export default async function PercentileCard({ todayTotal, neighborhood, ageGroup }: PercentileCardProps) {
  const [stats, groupStats] = await Promise.all([
    getTodayStats(todayTotal),
    getGroupStats(todayTotal, neighborhood ?? null, (ageGroup as AgeGroup | null) ?? null),
  ])

  const diff = stats.avgTotal - stats.myTotal
  const diffText =
    diff > 0
      ? `평균보다 ${diff.toLocaleString()}원 적게 씀`
      : diff < 0
      ? `평균보다 ${Math.abs(diff).toLocaleString()}원 많이 씀`
      : '평균과 동일'

  const isGood = diff >= 0

  const hasGroup = !!groupStats.neighborhood || !!groupStats.ageGroup

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
      {/* 전체 비교 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">오늘의 청렴도</p>
          <p className="text-2xl font-black mt-0.5">
            상위{' '}
            <span className={isGood ? 'text-white' : 'text-red-400'}>
              {stats.percentile}%
            </span>
          </p>
        </div>
        <span className="text-4xl">{isGood ? '🏆' : '😬'}</span>
      </div>

      <div className={`text-sm font-medium ${isGood ? 'text-green-400' : 'text-red-400'}`}>
        {diffText}
      </div>

      <div className="text-xs text-zinc-600">
        오늘 전체 평균 지출 {stats.avgTotal.toLocaleString()}원
        {stats.isSimulated && ' (초기 데이터 기반 추정)'}
      </div>

      {/* 그룹 비교 */}
      {hasGroup ? (
        <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
          {groupStats.neighborhood && (
            <GroupCompareRow
              label={`${neighborhood} 평균`}
              groupAvg={groupStats.neighborhood.groupAvg}
              myTotal={todayTotal}
              percentile={groupStats.neighborhood.percentile}
              isSimulated={groupStats.neighborhood.isSimulated}
            />
          )}
          {groupStats.ageGroup && (
            <GroupCompareRow
              label={`${AGE_GROUP_LABELS[ageGroup as AgeGroup]} 평균`}
              groupAvg={groupStats.ageGroup.groupAvg}
              myTotal={todayTotal}
              percentile={groupStats.ageGroup.percentile}
              isSimulated={groupStats.ageGroup.isSimulated}
            />
          )}
        </div>
      ) : (
        <div className="border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-600">
            동네·연령대를{' '}
            <Link href="/settings" className="text-zinc-400 underline underline-offset-2">
              설정
            </Link>
            하면 그룹 비교를 볼 수 있어요.
          </p>
        </div>
      )}
    </div>
  )
}

function GroupCompareRow({
  label,
  groupAvg,
  myTotal,
  percentile,
  isSimulated,
}: {
  label: string
  groupAvg: number
  myTotal: number
  percentile: number
  isSimulated: boolean
}) {
  const diff = groupAvg - myTotal
  const isGood = diff >= 0
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-zinc-500">
        {label}{isSimulated ? ' *' : ''}
      </span>
      <span className={isGood ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
        {isGood
          ? `${diff.toLocaleString()}원 절약`
          : `${Math.abs(diff).toLocaleString()}원 초과`}
        {' '}(상위 {percentile}%)
      </span>
    </div>
  )
}
