import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-4">
      <div className="text-5xl">🧎</div>
      <h1 className="text-xl font-bold">로그인 성공!</h1>
      <p className="text-zinc-400 text-sm">{user.email}</p>
      <p className="text-zinc-600 text-xs">대시보드 구현 중...</p>
    </div>
  )
}
