// 30명 미만일 때 혼합하는 가상 분포 데이터 (한국 2030 하루 평균 지출 기준)
export const SIMULATED_DISTRIBUTION: number[] = [
  0, 0, 3500, 4800, 6000, 7200, 8500, 9000, 10000, 12000,
  13500, 15000, 16800, 18000, 20000, 22000, 23500, 25000, 27000, 30000,
  32000, 35000, 38000, 42000, 47000, 52000, 58000, 65000, 75000, 90000,
]

/**
 * 내 지출이 분포에서 상위 몇 %인지 계산 (낮을수록 좋음)
 * 반환값: 상위 N% (ex. 5 → "상위 5%")
 */
export function calcPercentile(myTotal: number, distribution: number[]): number {
  if (distribution.length === 0) return 50

  const sorted = [...distribution].sort((a, b) => a - b)
  const countBelow = sorted.filter(v => v > myTotal).length
  const percentile = Math.round((countBelow / sorted.length) * 100)

  return Math.max(1, percentile)
}

/**
 * 실제 유저 데이터와 가상 데이터를 혼합
 * 실제 유저 수가 30명 미만이면 가상 데이터를 채워서 분포 안정화
 */
export function blendDistribution(realData: number[]): number[] {
  if (realData.length >= 30) return realData

  const needed = 30 - realData.length
  const simulated = SIMULATED_DISTRIBUTION.slice(0, needed)
  return [...realData, ...simulated]
}
