'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calcGradeScore, getGradeLevel } from '@/types/grade'
import { VALID_TIP_CATEGORIES } from '@/types/tips'
import type { Tip, SubmitTipInput } from '@/types/tips'

export type { Tip, SubmitTipInput }

export async function getTips(limit = 50): Promise<Tip[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tips } = await supabase
    .from('neighborhood_tips')
    .select('*')
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!tips || tips.length === 0) return []

  if (user) {
    const { data: likes } = await supabase
      .from('neighborhood_tip_likes')
      .select('tip_id')
      .eq('user_id', user.id)
      .in('tip_id', tips.map(t => t.id))

    const likedSet = new Set((likes ?? []).map(l => l.tip_id))
    return tips.map(t => ({ ...t, liked_by_me: likedSet.has(t.id) }))
  }

  return tips.map(t => ({ ...t, liked_by_me: false }))
}

export async function submitTip(input: SubmitTipInput): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('인증이 필요합니다')

  if (!input.neighborhood?.trim()) throw new Error('동네를 입력해 주세요')
  if (!VALID_TIP_CATEGORIES.includes(input.category)) throw new Error('카테고리를 선택해 주세요')
  if (!input.place_name?.trim()) throw new Error('장소명을 입력해 주세요')
  if (!input.description?.trim()) throw new Error('한 줄 꿀팁을 입력해 주세요')
  if (input.description.length > 60) throw new Error('꿀팁은 60자 이내로 입력해 주세요')
  if (!input.price || input.price < 0) throw new Error('가격을 입력해 주세요')

  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_budget, checkin_streak')
    .eq('id', user.id)
    .single()

  const score = calcGradeScore({
    dailyBudget: profile?.daily_budget ?? 30000,
    todayTotal: 0,
    checkinStreak: profile?.checkin_streak ?? 0,
  })
  const grade = getGradeLevel(score)
  const nickname = (user.email ?? 'anonymous').split('@')[0] ?? 'anonymous'

  const { error } = await supabase.from('neighborhood_tips').insert({
    user_id:            user.id,
    submitter_nickname: nickname,
    grade_label:        grade.title,
    grade_emoji:        grade.emoji,
    neighborhood:       input.neighborhood.trim(),
    category:           input.category,
    place_name:         input.place_name.trim(),
    description:        input.description.trim(),
    price:              input.price,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/leaderboard')
}

export async function toggleLike(tipId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('인증이 필요합니다')

  const { data: existing } = await supabase
    .from('neighborhood_tip_likes')
    .select('tip_id')
    .eq('user_id', user.id)
    .eq('tip_id', tipId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('neighborhood_tip_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('tip_id', tipId)
  } else {
    await supabase
      .from('neighborhood_tip_likes')
      .insert({ user_id: user.id, tip_id: tipId })
  }

  revalidatePath('/leaderboard')
}
