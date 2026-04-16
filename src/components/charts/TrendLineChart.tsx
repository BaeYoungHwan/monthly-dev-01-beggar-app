import { buildPolylinePoints, buildAreaPoints } from '@/lib/chart/utils'
import type { DailyTrendPoint } from '@/app/actions/chartStats'

interface Props {
  points: DailyTrendPoint[]
  dailyBudget: number
  maxTotal: number
}

const SVG_W = 320
const SVG_H = 120
const PAD = 12

export default function TrendLineChart({ points, dailyBudget, maxTotal }: Props) {
  if (points.length === 0) return (
    <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
      지출 데이터가 없어요
    </div>
  )

  const values = points.map(p => p.total)
  const areaPoints = buildAreaPoints(values, SVG_W, SVG_H, PAD)
  const linePoints = buildPolylinePoints(values, SVG_W, SVG_H, PAD)

  // 예산선 Y 좌표
  const budgetY = PAD + (1 - dailyBudget / maxTotal) * (SVG_H - PAD * 2)

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
      >
        {/* 면적 채우기 */}
        <polygon
          points={areaPoints}
          fill="rgba(255,255,255,0.04)"
        />

        {/* 예산 기준선 */}
        <line
          x1={PAD}
          y1={budgetY}
          x2={SVG_W - PAD}
          y2={budgetY}
          stroke="rgba(234,179,8,0.4)"
          strokeWidth="1"
          strokeDasharray="4,3"
        />

        {/* 트렌드 라인 */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 데이터 포인트 */}
        {points.map((p, i) => {
          const x = PAD + (i / Math.max(points.length - 1, 1)) * (SVG_W - PAD * 2)
          const y = PAD + (1 - p.total / maxTotal) * (SVG_H - PAD * 2)
          return (
            <circle
              key={p.date}
              cx={x}
              cy={y}
              r={3}
              fill={p.overBudget ? '#f87171' : '#ffffff'}
              opacity={p.total === 0 ? 0.2 : 1}
            />
          )
        })}
      </svg>

      {/* X축 라벨 */}
      <div className="flex justify-between px-1">
        {points
          .filter((_, i) => i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1)
          .map(p => (
            <span key={p.date} className="text-xs text-zinc-600">{p.label}</span>
          ))
        }
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-600">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
          예산 초과
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 border-t border-dashed border-yellow-500/60" />
          일일 예산 {dailyBudget.toLocaleString()}원
        </span>
      </div>
    </div>
  )
}
