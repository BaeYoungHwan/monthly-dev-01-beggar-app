export interface GradeLevel {
  level: number
  title: string
  emoji: string
  description: string
  minScore: number
}

export const GRADE_LEVELS: GradeLevel[] = [
  {
    level: 0,
    title: '파산 핑',
    emoji: '💸',
    description: '예산 초과. 지금 당장 지갑을 닫으세요.',
    minScore: -Infinity,
  },
  {
    level: 1,
    title: '월급쟁이 좀비',
    emoji: '🧟',
    description: '겨우 살아있는 수준. 조금만 더 버텨보세요.',
    minScore: 0,
  },
  {
    level: 3,
    title: '편의점 헌터',
    emoji: '🏪',
    description: '폐기 삼각김밥으로 연명 중.',
    minScore: 10000,
  },
  {
    level: 5,
    title: '도시락 장인',
    emoji: '🍱',
    description: '자취생의 귀감. 냉장고를 파먹는 중.',
    minScore: 50000,
  },
  {
    level: 7,
    title: '지하철 유목민',
    emoji: '🚇',
    description: '지출 최소화의 달인. 두 발이 전부.',
    minScore: 150000,
  },
  {
    level: 9,
    title: '무소유의 화신',
    emoji: '🧘',
    description: '3일 연속 지출 0. AI 잔소리 10회 견딤. 경지에 올랐습니다.',
    minScore: 500000,
  },
]

export function calcGradeScore(params: {
  dailyBudget: number
  todayTotal: number
  checkinStreak: number
}): number {
  const { dailyBudget, todayTotal, checkinStreak } = params
  return (dailyBudget - todayTotal) * Math.max(checkinStreak, 1)
}

export function getGradeLevel(score: number): GradeLevel {
  const sorted = [...GRADE_LEVELS].sort((a, b) => b.minScore - a.minScore)
  return sorted.find((g) => score >= g.minScore) ?? GRADE_LEVELS[0]!
}
