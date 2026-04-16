export interface NeighborhoodData {
  name: string
  avgDailySpend: number
  userCount: number
  isSimulated: boolean
}

// 가상 동네 데이터 — 실 데이터 부족 시 혼합 (서울/수도권/지방 다양하게)
export const SIMULATED_NEIGHBORHOODS: NeighborhoodData[] = [
  { name: '서울 강남구', avgDailySpend: 68000, userCount: 0, isSimulated: true },
  { name: '서울 서초구', avgDailySpend: 61000, userCount: 0, isSimulated: true },
  { name: '서울 마포구', avgDailySpend: 45000, userCount: 0, isSimulated: true },
  { name: '서울 종로구', avgDailySpend: 52000, userCount: 0, isSimulated: true },
  { name: '서울 송파구', avgDailySpend: 57000, userCount: 0, isSimulated: true },
  { name: '서울 관악구', avgDailySpend: 28000, userCount: 0, isSimulated: true },
  { name: '서울 노원구', avgDailySpend: 31000, userCount: 0, isSimulated: true },
  { name: '서울 은평구', avgDailySpend: 33000, userCount: 0, isSimulated: true },
  { name: '서울 강서구', avgDailySpend: 36000, userCount: 0, isSimulated: true },
  { name: '부산 해운대구', avgDailySpend: 42000, userCount: 0, isSimulated: true },
  { name: '부산 사하구', avgDailySpend: 27000, userCount: 0, isSimulated: true },
  { name: '대구 수성구', avgDailySpend: 38000, userCount: 0, isSimulated: true },
  { name: '인천 연수구', avgDailySpend: 35000, userCount: 0, isSimulated: true },
  { name: '대전 유성구', avgDailySpend: 32000, userCount: 0, isSimulated: true },
  { name: '수원시', avgDailySpend: 30000, userCount: 0, isSimulated: true },
]

const GRADE_THRESHOLDS = [
  { max: 20000, label: '절약왕 🏆', color: 'text-green-400' },
  { max: 35000, label: '알뜰살뜰 👍', color: 'text-emerald-400' },
  { max: 50000, label: '평균 😐', color: 'text-zinc-300' },
  { max: 70000, label: '씀씀이 큼 😬', color: 'text-yellow-400' },
  { max: Infinity, label: '과소비 🔥', color: 'text-red-400' },
]

export function getNeighborhoodGrade(avgSpend: number): { label: string; color: string } {
  return GRADE_THRESHOLDS.find(t => avgSpend <= t.max) ?? GRADE_THRESHOLDS[4]!
}

export function blendNeighborhoodData(realData: NeighborhoodData[]): NeighborhoodData[] {
  if (realData.length >= 5) return realData

  // 실 데이터에 없는 가상 동네만 보충
  const realNames = new Set(realData.map(d => d.name))
  const needed = SIMULATED_NEIGHBORHOODS.filter(d => !realNames.has(d.name))
  return [...realData, ...needed]
}
