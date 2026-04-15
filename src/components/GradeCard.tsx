import { calcGradeScore, getGradeLevel } from '@/types/grade'

interface GradeCardProps {
  dailyBudget: number
  todayTotal: number
  checkinStreak: number
}

export default function GradeCard({ dailyBudget, todayTotal, checkinStreak }: GradeCardProps) {
  const score = calcGradeScore({ dailyBudget, todayTotal, checkinStreak })
  const grade = getGradeLevel(score)

  const remaining = dailyBudget - todayTotal
  const budgetPercent = Math.min(Math.max((todayTotal / dailyBudget) * 100, 0), 100)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
      {/* 등급 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{grade.emoji}</span>
          <div>
            <p className="text-xs text-zinc-500">현재 등급</p>
            <p className="text-lg font-black">{grade.title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">연속 체크인</p>
          <p className="text-2xl font-black">{checkinStreak}<span className="text-sm text-zinc-400 font-normal">일</span></p>
        </div>
      </div>

      {/* 등급 설명 */}
      <p className="text-xs text-zinc-400">{grade.description}</p>

      {/* 예산 게이지 */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>오늘 지출</span>
          <span className={remaining < 0 ? 'text-red-400' : 'text-zinc-300'}>
            {remaining < 0
              ? `${Math.abs(remaining).toLocaleString()}원 초과`
              : `${remaining.toLocaleString()}원 남음`}
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${budgetPercent >= 100 ? 'bg-red-500' : budgetPercent >= 80 ? 'bg-yellow-500' : 'bg-white'}`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-600">
          <span>0</span>
          <span>일일 예산 {dailyBudget.toLocaleString()}원</span>
        </div>
      </div>
    </div>
  )
}
