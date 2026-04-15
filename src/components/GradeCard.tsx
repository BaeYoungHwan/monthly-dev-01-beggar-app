'use client'

import { useEffect, useRef, useState } from 'react'
import { calcGradeScore, getGradeLevel } from '@/types/grade'

interface GradeCardProps {
  dailyBudget: number
  todayTotal: number
  checkinStreak: number
}

const STORAGE_KEY = 'beggar_last_grade_level'

export default function GradeCard({ dailyBudget, todayTotal, checkinStreak }: GradeCardProps) {
  const budget = dailyBudget > 0 ? dailyBudget : 30000 // 0 방어
  const score = calcGradeScore({ dailyBudget: budget, todayTotal, checkinStreak })
  const grade = getGradeLevel(score)

  const remaining = budget - todayTotal
  const budgetPercent = Math.min(Math.max((todayTotal / budget) * 100, 0), 100)

  const [levelUp, setLevelUp] = useState(false)
  const prevLevelRef = useRef<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const prevLevel = stored !== null ? parseInt(stored, 10) : null

    if (prevLevel !== null && grade.level > prevLevel) {
      setLevelUp(true)
      setTimeout(() => setLevelUp(false), 2000)
    }

    prevLevelRef.current = grade.level
    localStorage.setItem(STORAGE_KEY, grade.level.toString())
  }, [grade.level])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
      {/* 레벨업 축하 오버레이 */}
      {levelUp && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center animate-bounce">
            <p className="text-3xl">🎉</p>
            <p className="text-sm font-black text-yellow-400 mt-1">등급 상승!</p>
          </div>
        </div>
      )}

      {/* 등급 표시 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-4xl transition-transform ${levelUp ? 'scale-125' : 'scale-100'}`}>
            {grade.emoji}
          </span>
          <div>
            <p className="text-xs text-zinc-500">현재 등급</p>
            <p className={`text-lg font-black ${levelUp ? 'text-yellow-400' : 'text-white'}`}>
              {grade.title}
            </p>
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
            className={`h-full rounded-full transition-all duration-500 ${budgetPercent >= 100 ? 'bg-red-500' : budgetPercent >= 80 ? 'bg-yellow-500' : 'bg-white'}`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-600">
          <span>0</span>
          <span>일일 예산 {budget.toLocaleString()}원</span>
        </div>
      </div>
    </div>
  )
}
