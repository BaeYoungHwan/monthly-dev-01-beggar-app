'use server'

import { createClient } from '@/lib/supabase/server'

export async function joinWaitlist(personaId: string, email: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 클릭 이벤트 기록 (로그인한 경우만)
  if (user?.id) {
    await supabase
      .from('persona_click_events')
      .insert({ user_id: user.id, persona_id: personaId })
  }

  // waitlist 등록 (중복 삽입 무시)
  await supabase
    .from('waitlist')
    .insert({ email, persona_id: personaId, user_id: user?.id ?? null })
}
