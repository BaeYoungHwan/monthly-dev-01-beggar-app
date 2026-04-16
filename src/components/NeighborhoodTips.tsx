import { getTips } from '@/app/actions/tips'
import { TIP_CATEGORY_LABELS } from '@/types/tips'
import TipLikeButton from '@/components/TipLikeButton'

export default async function NeighborhoodTips() {
  const tips = await getTips(50)

  if (tips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
        <p className="text-3xl">🗺️</p>
        <p className="text-zinc-400 text-sm font-bold">아직 제보된 꿀팁이 없어요</p>
        <p className="text-zinc-600 text-xs">첫 번째 거지 꿀팁을 제보해 보세요!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {tips.map(tip => (
        <div
          key={tip.id}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3"
        >
          {/* 상단: 카테고리 + 동네 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-400">
                {TIP_CATEGORY_LABELS[tip.category]}
              </span>
              <span className="text-xs text-zinc-500">{tip.neighborhood}</span>
            </div>
          </div>

          {/* 장소명 + 가격 */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-white leading-snug">{tip.place_name}</p>
            <span className={`text-sm font-black shrink-0 ${tip.price === 0 ? 'text-green-400' : 'text-white'}`}>
              {tip.price === 0 ? '무료' : `${tip.price.toLocaleString()}원`}
            </span>
          </div>

          {/* 한 줄 꿀팁 */}
          <p className="text-xs text-zinc-400 leading-relaxed">{tip.description}</p>

          {/* 하단: 제보자 + 좋아요 */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{tip.grade_emoji}</span>
              <span className="text-xs text-zinc-500">
                <span className="text-zinc-400">{tip.submitter_nickname}</span>
                {' · '}
                <span className="text-zinc-600">{tip.grade_label}</span>
              </span>
            </div>
            <TipLikeButton
              tipId={tip.id}
              likesCount={tip.likes_count}
              likedByMe={tip.liked_by_me ?? false}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
