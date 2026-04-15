import { getTodayStats } from '@/app/actions/stats'

interface PercentileCardProps {
  todayTotal: number
}

export default async function PercentileCard({ todayTotal }: PercentileCardProps) {
  const stats = await getTodayStats(todayTotal)

  const diff = stats.avgTotal - stats.myTotal
  const diffText =
    diff > 0
      ? `평균보다 ${diff.toLocaleString()}원 적게 씀`
      : diff < 0
      ? `평균보다 ${Math.abs(diff).toLocaleString()}원 많이 씀`
      : '평균과 동일'

  const isGood = diff >= 0

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
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
        오늘 평균 지출 {stats.avgTotal.toLocaleString()}원
        {stats.isSimulated && ' (초기 데이터 기반 추정)'}
      </div>
    </div>
  )
}
