'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function checkin(type: 'no_spend' | 'with_spend'): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('인증이 필요합니다')

  const today = new Date().toISOString().split('T')[0]!
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]!

  // daily_checkins UPSERT
  await supabase
    .from('daily_checkins')
    .upsert(
      { user_id: user.id, checkin_date: today, checkin_type: type },
      { onConflict: 'user_id,checkin_date' }
    )

  // profiles.checkin_streak 업데이트
  const { data: profile } = await supabase
    .from('profiles')
    .select('checkin_streak, last_checkin_date')
    .eq('id', user.id)
    .single()

  if (profile) {
    let newStreak = 1
    if (profile.last_checkin_date === today) {
      newStreak = profile.checkin_streak // 오늘 이미 체크인
    } else if (profile.last_checkin_date === yesterday) {
      newStreak = profile.checkin_streak + 1 // 연속 체크인
    }

    await supabase
      .from('profiles')
      .update({ checkin_streak: newStreak, last_checkin_date: today })
      .eq('id', user.id)
  }

  revalidatePath('/dashboard')
}
