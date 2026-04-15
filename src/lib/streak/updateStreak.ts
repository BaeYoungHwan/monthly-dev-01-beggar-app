import type { SupabaseClient } from '@supabase/supabase-js'

// profiles.checkin_streak + last_checkin_date 업데이트
// 오늘 체크인 이미 완료 → streak 유지
// 어제 체크인 → streak +1
// 그 외 → streak 1로 리셋
export async function updateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]!
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]!

  const { data: profile } = await supabase
    .from('profiles')
    .select('checkin_streak, last_checkin_date')
    .eq('id', userId)
    .single()

  if (!profile) return

  let newStreak = 1
  if (profile.last_checkin_date === today) {
    newStreak = profile.checkin_streak
  } else if (profile.last_checkin_date === yesterday) {
    newStreak = profile.checkin_streak + 1
  }

  const { error } = await supabase
    .from('profiles')
    .update({ checkin_streak: newStreak, last_checkin_date: today })
    .eq('id', userId)

  if (error) console.error('[updateStreak] profiles 업데이트 실패:', error.message)
}
