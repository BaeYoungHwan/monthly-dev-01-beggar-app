'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
        <div className="text-6xl">📬</div>
        <h2 className="text-xl font-bold text-center">링크를 확인하세요</h2>
        <p className="text-zinc-400 text-center text-sm">
          <span className="text-white font-medium">{email}</span>으로<br />
          로그인 링크를 보냈습니다.<br />
          메일함을 확인해 주세요.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-zinc-500 text-sm underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
      <div className="text-center gap-3 flex flex-col">
        <div className="text-5xl">🧎</div>
        <h1 className="text-2xl font-black tracking-tight">동결거지</h1>
        <p className="text-zinc-400 text-sm">AI에게 혼나며 절약하는 앱</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          required
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
        />
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-zinc-950 font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? '전송 중...' : '매직링크로 로그인'}
        </button>
      </form>

      <p className="text-zinc-600 text-xs text-center">
        비밀번호 없이 이메일 링크 하나로 로그인됩니다
      </p>
    </div>
  )
}
