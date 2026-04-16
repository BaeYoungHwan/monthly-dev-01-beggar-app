import { getNeighborhoodMap } from '@/app/actions/map'

export default async function NeighborhoodMap() {
  const { items, myNeighborhood, isSimulated } = await getNeighborhoodMap()

  return (
    <div className="flex flex-col gap-3">
      {isSimulated && (
        <p className="text-xs text-zinc-600 text-center">
          * 실제 데이터 부족으로 가상 데이터가 혼합됐어요
        </p>
      )}

      {myNeighborhood && (
        <p className="text-xs text-zinc-500 text-center">
          내 동네:{' '}
          <span className="text-white font-semibold">{myNeighborhood}</span>
        </p>
      )}

      {!myNeighborhood && (
        <p className="text-xs text-zinc-600 text-center">
          설정에서 내 동네를 입력하면 내 위치가 표시돼요
        </p>
      )}

      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div
            key={item.name}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              item.isMyNeighborhood
                ? 'border-white bg-white/5'
                : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            {/* 순위 */}
            <span className={`text-lg font-black w-6 text-center ${
              item.rank === 1 ? 'text-yellow-400' :
              item.rank === 2 ? 'text-zinc-300' :
              item.rank === 3 ? 'text-amber-600' :
              'text-zinc-600'
            }`}>
              {item.rank}
            </span>

            {/* 동네 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold truncate ${
                  item.isMyNeighborhood ? 'text-white' : 'text-zinc-200'
                }`}>
                  {item.name}
                </span>
                {item.isMyNeighborhood && (
                  <span className="text-xs bg-white text-zinc-950 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    나
                  </span>
                )}
                {item.isSimulated && (
                  <span className="text-xs text-zinc-600 shrink-0">*</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                일 평균 {item.avgDailySpend.toLocaleString()}원
                {item.userCount > 0 && ` · ${item.userCount}명`}
              </p>
            </div>

            {/* 등급 */}
            <span className={`text-xs font-bold shrink-0 ${item.grade.color}`}>
              {item.grade.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
