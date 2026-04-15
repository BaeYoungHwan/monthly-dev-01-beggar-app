// 서버 전용 — service_role 키로 RLS를 우회하는 관리자 클라이언트
// 절대 클라이언트 컴포넌트에서 import하지 말 것
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) throw new Error('Supabase admin 환경변수 누락 (SUPABASE_SERVICE_ROLE_KEY)')

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
