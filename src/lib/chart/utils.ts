/**
 * 값 배열 → SVG polyline용 points 문자열 생성
 * 값이 클수록 아래 (SVG 좌표계)
 */
export function buildPolylinePoints(
  data: number[],
  svgWidth: number,
  svgHeight: number,
  padding = 10,
): string {
  if (data.length === 0) return ''
  const max = Math.max(...data, 1)
  const w = svgWidth - padding * 2
  const h = svgHeight - padding * 2
  return data
    .map((v, i) => {
      const x = padding + (i / Math.max(data.length - 1, 1)) * w
      const y = padding + (1 - v / max) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

/** 값 배열 → 최소/최대 정규화 (0~1) */
export function normalize(values: number[]): number[] {
  const max = Math.max(...values, 1)
  return values.map(v => v / max)
}

/** SVG area fill용 polygon points (polyline 아래를 바닥까지 채움) */
export function buildAreaPoints(
  data: number[],
  svgWidth: number,
  svgHeight: number,
  padding = 10,
): string {
  if (data.length === 0) return ''
  const linePoints = buildPolylinePoints(data, svgWidth, svgHeight, padding)
  const lastX = (svgWidth - padding).toFixed(1)
  const firstX = padding.toFixed(1)
  const bottom = svgHeight.toFixed(1)
  return `${linePoints} ${lastX},${bottom} ${firstX},${bottom}`
}

/** YYYY-MM-DD → M/D */
export function formatDateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m ?? '1')}/${parseInt(d ?? '1')}`
}
