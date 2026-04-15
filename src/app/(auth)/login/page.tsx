'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signupDone, setSignupDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError(error.message)
      } else {
        setSignupDone(true)
      }
    }

    setLoading(false)
  }

  async function handleSocialLogin(provider: 'google') {
    setSocialLoading(provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setSocialLoading(null)
    }
  }

  if (signupDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
        <div className="text-6xl">📬</div>
        <h2 className="text-xl font-bold text-center">이메일을 확인하세요</h2>
        <p className="text-zinc-400 text-center text-sm">
          <span className="text-white font-medium">{email}</span>으로<br />
          인증 링크를 보냈습니다.<br />
          메일함을 확인한 뒤 로그인해 주세요.
        </p>
        <button
          onClick={() => { setSignupDone(false); setMode('login') }}
          className="text-zinc-500 text-sm underline"
        >
          로그인 화면으로
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

      {/* 소셜 로그인 */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() => handleSocialLogin('google')}
          disabled={socialLoading !== null}
          className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {socialLoading === 'google' ? (
            <span>로그인 중...</span>
          ) : (
            <>
              <GoogleIcon />
              <span>Google로 로그인</span>
            </>
          )}
        </button>
      </div>

      {/* 구분선 */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-zinc-600 text-xs">또는 이메일로</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* 로그인 / 회원가입 탭 */}
      <div className="w-full flex bg-zinc-900 rounded-xl p-1 -mt-4">
        <button
          onClick={() => { setMode('login'); setError(null) }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
            mode === 'login' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
          }`}
        >
          로그인
        </button>
        <button
          onClick={() => { setMode('signup'); setError(null) }}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
            mode === 'signup' ? 'bg-zinc-700 text-white' : 'text-zinc-500'
          }`}
        >
          회원가입
        </button>
      </div>

      {/* 이메일 + 비밀번호 폼 */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 -mt-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소"
          required
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
          minLength={6}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
        />
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || socialLoading !== null}
          className="w-full bg-zinc-800 border border-zinc-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}
