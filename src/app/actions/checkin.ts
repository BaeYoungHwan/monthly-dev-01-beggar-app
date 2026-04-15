'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { updateStreak } from '@/lib/streak/updateStreak'

const VALID_CHECKIN_TYPES = ['no_spend', 'with_spend'] as const
type CheckinType = typeof VALID_CHECKIN_TYPES[number]

export async function checkin(type: CheckinType): Promise<void> {
  if (!VALID_CHECKIN_TYPES.includes(type)) {
    throw new Error('유효하지 않은 체크인 타입입니다')
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) throw new Error('인증이 필요합니다')

  const today = new Date().toISOString().split('T')[0]!

  const { error: checkinError } = await supabase
    .from('daily_checkins')
    .upsert(
      { user_id: user.id, checkin_date: today, checkin_type: type },
      { onConflict: 'user_id,checkin_date' }
    )

  if (checkinError) console.error('[checkin] daily_checkins 업데이트 실패:', checkinError.message)

  await updateStreak(supabase, user.id)

  revalidatePath('/dashboard')
}
