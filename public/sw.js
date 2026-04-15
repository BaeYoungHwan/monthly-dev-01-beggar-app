const CACHE_NAME = 'beggar-v1'
const STATIC_SHELL = ['/dashboard', '/expense/new', '/settings']

// 설치 시 쉘 페이지 사전 캐시
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_SHELL).catch(() => {}))
  )
})

// 이전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// 네트워크 우선 전략 (오프라인 시 캐시 fallback)
self.addEventListener('fetch', event => {
  const { request } = event
  // API 라우트 + 인증 경로는 캐시 제외
  if (
    request.url.includes('/api/') ||
    request.url.includes('/auth/') ||
    request.method !== 'GET'
  ) return

  event.respondWith(
    fetch(request)
      .then(res => {
        // 성공 응답은 캐시에 저장
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return res
      })
      .catch(() => caches.match(request))
  )
})
