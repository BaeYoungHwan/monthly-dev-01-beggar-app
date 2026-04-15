import { getHonestyScore } from '@/app/actions/honesty'

export default async function HonestyScore() {
  let data
  try {
    data = await getHonestyScore()
  } catch {
    return null
  }

  if (!data.isEnough) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <p className="text-sm font-bold text-zinc-300">정직도 점수</p>
        </div>
        <p className="text-xs text-zinc-500">7일 이상 체크인하면 분석할 수 있어요</p>
        <p className="text-xs text-zinc-600">현재 {data.checkinCount}일 데이터</p>
      </div>
    )
  }

  const scoreColor =
    data.score >= 80 ? 'text-green-400' : data.score >= 50 ? 'text-yellow-400' : 'text-red-400'
  const scoreLabel =
    data.score >= 80 ? '청렴한 거지 🏆' : data.score >= 50 ? '의심스러운 거지 🤔' : '수상한 거지 🚨'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <p className="text-sm font-bold text-zinc-300">정직도 점수</p>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-black ${scoreColor}`}>{data.score}</span>
          <span className="text-zinc-500 text-sm ml-1">/ 100</span>
        </div>
      </div>

      <p className={`text-xs font-bold ${scoreColor}`}>{scoreLabel}</p>

      <div className="flex flex-col gap-2">
        <ScoreBar label="체크인 일관성" value={data.checkinRate} />
        <ScoreBar label="예산 준수율" value={data.budgetRate} />
        <ScoreBar label="지출 안정성" value={data.stabilityRate} />
      </div>

      <p className="text-xs text-zinc-600">최근 30일 기준 • {data.checkinCount}일 체크인</p>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100)
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs text-zinc-400">{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
