import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '동결거지 — 절약이 게임이 되는 순간',
  description: 'AI의 독설과 게이미피케이션으로 지출을 억제하는 초절약 보조 앱',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${geist.variable} font-sans antialiased bg-zinc-950 text-white`}>
        {/* 모바일 우선: 최대 너비 고정, 세로 스크롤 */}
        <main className="max-w-md mx-auto min-h-screen">
          {children}
        </main>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
