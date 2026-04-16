export type TipCategory = 'food' | 'daily' | 'free' | 'etc'

export const TIP_CATEGORY_LABELS: Record<TipCategory, string> = {
  food:  '🍚 식비',
  daily: '🧴 생필품',
  free:  '🎉 무료 혜택',
  etc:   '💡 기타',
}

export const VALID_TIP_CATEGORIES: TipCategory[] = ['food', 'daily', 'free', 'etc']

export interface Tip {
  id: string
  user_id: string | null
  submitter_nickname: string
  grade_label: string
  grade_emoji: string
  neighborhood: string
  category: TipCategory
  place_name: string
  description: string
  price: number
  likes_count: number
  created_at: string
  liked_by_me?: boolean
}

export interface SubmitTipInput {
  neighborhood: string
  category: TipCategory
  place_name: string
  description: string
  price: number
}
