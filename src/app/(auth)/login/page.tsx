'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'kakao' | null>(null)
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

  async function handleSocialLogin(provider: 'google' | 'kakao') {
    setSocialLoading(provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...(provider === 'kakao' && { scopes: 'profile_nickname profile_image' }),
      },
    })
    if (error) {
      setError(error.message)
      setSocialLoading(null)
    }
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

        <button
          onClick={() => handleSocialLogin('kakao')}
          disabled={socialLoading !== null}
          className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {socialLoading === 'kakao' ? (
            <span>로그인 중...</span>
          ) : (
            <>
              <KakaoIcon />
              <span>카카오로 로그인</span>
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

      {/* 이메일 로그인 */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 -mt-4">
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
          disabled={loading || socialLoading !== null}
          className="w-full bg-zinc-800 border border-zinc-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? '전송 중...' : '매직링크로 로그인'}
        </button>
      </form>

      <p className="text-zinc-600 text-xs text-center -mt-4">
        비밀번호 없이 이메일 링크 하나로 로그인됩니다
      </p>
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

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.806 1 7.273c0 2.195 1.417 4.125 3.563 5.234l-.907 3.384c-.08.298.27.534.524.356l4.07-2.72c.247.018.497.027.75.027 4.418 0 8-2.806 8-6.281C17 3.806 13.418 1 9 1Z" fill="#191919"/>
    </svg>
  )
}
