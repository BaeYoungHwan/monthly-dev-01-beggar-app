import type { CategoryBreakdownItem } from '@/app/actions/chartStats'

interface Props {
  items: CategoryBreakdownItem[]
}

const BAR_COLORS = [
  'bg-white',
  'bg-zinc-300',
  'bg-zinc-400',
  'bg-zinc-500',
  'bg-zinc-600',
  'bg-zinc-700',
  'bg-zinc-800',
]

export default function CategoryBarChart({ items }: Props) {
  if (items.length === 0) return (
    <div className="flex items-center justify-center h-24 text-zinc-600 text-sm">
      카테고리 데이터가 없어요
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={item.category} className="flex items-center gap-3">
          {/* 라벨 */}
          <span className="text-xs text-zinc-400 w-16 shrink-0 truncate">{item.label}</span>

          {/* 바 */}
          <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${BAR_COLORS[i] ?? 'bg-zinc-600'}`}
              style={{ width: `${item.percent}%` }}
            />
          </div>

          {/* 퍼센트 + 금액 */}
          <div className="text-xs text-zinc-400 w-20 shrink-0 text-right">
            <span className="text-white font-semibold">{item.percent}%</span>
            <span className="text-zinc-600 ml-1">{(item.total / 1000).toFixed(0)}k</span>
          </div>
        </div>
      ))}
    </div>
  )
}
