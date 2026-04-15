'use server'

import { createClient } from '@/lib/supabase/server'
import { PERSONAS } from '@/types/persona'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LOCKED_PERSONA_IDS = PERSONAS.filter(p => p.status === 'locked').map(p => p.id)

export async function joinWaitlist(personaId: string, email: string): Promise<void> {
  // 서버 측 입력 검증
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('유효하지 않은 이메일 형식입니다')
  }
  if (!LOCKED_PERSONA_IDS.includes(personaId)) {
    throw new Error('유효하지 않은 페르소나입니다')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 클릭 이벤트 기록 (로그인한 경우만)
  if (user?.id) {
    await supabase
      .from('persona_click_events')
      .insert({ user_id: user.id, persona_id: personaId })
  }

  // waitlist 등록 (중복 무시 — email + persona_id unique constraint)
  await supabase
    .from('waitlist')
    .upsert(
      { email, persona_id: personaId, user_id: user?.id ?? null },
      { onConflict: 'email,persona_id', ignoreDuplicates: true }
    )
}
