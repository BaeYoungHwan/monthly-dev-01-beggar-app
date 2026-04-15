# TODO — monthly-dev-01-freeze-beggar (동결거지)

> 워크플로우: `[ ]` 대기 → `[🔄]` 진행 중 → `[x]` 완료
> 재시작 시: `docs/ref/session-state.md` 확인 후 `[🔄]` 항목부터 재개
> 자세한 워크플로우 → [`docs/ref/todo-workflow.md`](docs/ref/todo-workflow.md)

---

## 시작 전

- [x] `/init-project` 실행 완료
- [ ] `docs/design-docs/architecture-v1.md` 검토 및 방향 확정
- [ ] `docs/design-docs/ARD-v1.md` 품질 속성 목표 확정
- [ ] Phase 분할 후 `docs/exec-plans/active/`에 실행 계획 생성

---

## P0 — 기반 구축

- [x] Next.js 15 프로젝트 초기화 (`create-next-app`, App Router, TypeScript strict)
- [x] Tailwind CSS 설정 및 모바일 우선 기본 레이아웃 확인
- [x] Supabase 클라이언트 파일 생성 (`lib/supabase/client.ts`, `server.ts`)
- [x] Gemini 클라이언트 파일 생성 (`lib/gemini/client.ts`)
- [x] TypeScript 타입 정의 (`types/expense.ts`, `grade.ts`, `persona.ts`)
- [x] Supabase 프로젝트 생성 및 `.env.local` 연동
- [x] Supabase Auth 설정 (이메일 매직링크)
- [x] 초기 DB 스키마 SQL 적용 (`phase-0.md` Step 4 SQL)
- [x] Supabase RLS 정책 적용 (`phase-0.md` Step 5 SQL)
- [x] Auth 콜백 라우트 (`src/app/auth/callback/route.ts`)
- [x] 로그인 페이지 UI (`src/app/(auth)/login/page.tsx`)
- [x] 미들웨어 — 인증 보호 라우트 (`src/middleware.ts`)
- [x] 매직링크 로그인 실제 동작 확인
- [ ] Gemini API 키 발급 및 `.env.local` 추가
- [ ] Gemini 연동 확인 (응답 2초 이내)
- [x] Vercel 배포 파이프라인 (GitHub main/develop 브랜치 연동)
- [x] Hello World 확인 (https://monthly-dev-01-beggar-app.vercel.app)

---

## P1 — MVP 핵심 기능

### 인증
- [x] 매직링크 로그인 페이지 UI
- [x] 로그인 후 리다이렉트 및 세션 유지 처리

### AI 등짝 스매싱
- [x] 지출 입력 폼 UI (금액, 카테고리, 메모) — `src/app/(app)/expense/new/page.tsx`
- [x] Gemini API 잔소리 생성 서버 액션 (페르소나별 프롬프트) — `src/app/actions/expense.ts`
- [x] 잔소리 결과 표시 컴포넌트 (B급 감성 애니메이션 포함) — `src/components/NagResult.tsx`
- [x] 지출 데이터 Supabase 저장

### 지출 대시보드
- [x] 일간/주간 지출 합계 조회 — `src/app/actions/dashboard.ts`
- [x] 지출 내역 리스트 컴포넌트 — `src/components/ExpenseList.tsx`
- [x] 일일 예산 목표 설정 UI

### 거지 등급 시스템
- [x] 등급 계산 로직: `(일일 예산 - 실지출) × 연속 체크인 일수`
- [x] 등급 테이블 및 배지 데이터 정의 (Lv 0 파산핑 ~ Lv MAX 무소유의 화신)
- [x] 등급 표시 컴포넌트 (캐릭터 이미지 + 칭호) — `src/components/GradeCard.tsx`
- [x] 등급 변화 시 애니메이션/효과

### 어뷰징 방지 + 활동 신뢰 시스템
- [x] 생존 신고 버튼 UI (`CheckinBanner.tsx`) — 오늘 체크인 없을 때만 노출
- [x] `app/actions/checkin.ts` — 체크인 Server Action (no_spend / with_spend)
- [x] 지출 입력 시 자동 체크인 연동 (`with_spend` 타입)
- [x] AI 탐정 모드 — 오후 2시 이후 무체크인 접속 시 의심 잔소리 배너 — `src/components/DetectiveBanner.tsx`
- [x] "의심스러운 거지" 배지 (3일 이상 무체크인 접속 시)

### 비교 통계 모듈
- [x] `lib/grade/percentile.ts` — 백분위 계산 + 가상 데이터(30명 미만) 혼합 로직
- [x] `app/actions/stats.ts` — 오늘 평균/백분위 Server Action
- [x] 거지 백분위 표시 컴포넌트 ("상위 5% 청렴한 거지") — `src/components/PercentileCard.tsx`
- [x] 전체 유저 평균 비교 표시 (평균 대비 +/- % 및 금액)
- [x] AI 잔소리 프롬프트에 백분위 + 평균 데이터 주입
- [x] SNS 공유 카드 UI (백분위 + 등급 + 한 줄 잔소리) — `src/components/ShareCard.tsx`
- [x] 공유 카드 PNG 캡처 기능 (`html2canvas` — `ShareCard.tsx` 📸 PNG 저장 버튼 추가)

### 수익화 기초 (수요 검증)
- [x] 유료 페르소나 카드 UI (잠금 처리) — `src/components/PersonaLockedCard.tsx`
- [x] "다음 업데이트 예약" 버튼 및 관심 유저 데이터 저장 — `src/app/actions/waitlist.ts`

---

## P2 — 검증 및 배포

### 리더보드 (유저 100명+ 이후)
- [x] 명예의 전당 — 주간 체크인 × 절약율 상위 1~3위
- [x] 굴욕의 전당 — 주간 과소비 1~3위 (자동 랭킹; 투표 시스템은 P3)
- [x] `daily_aggregates` 자정 배치 자동화 (Vercel Cron `/api/cron/aggregate`, 매일 00:00 KST)

### 고급 신뢰 시스템 (P3)
- [x] 영수증 OCR (Gemini Vision API) — `src/app/actions/ocr.ts` + 지출 입력 폼 통합
- [ ] 0원 인증샷 커뮤니티 승인 — 유저 100명+ 이후
- [x] 정직도 점수 (체크인 일관성 40% + 예산 준수율 40% + 지출 안정성 20%) — `src/components/HonestyScore.tsx`

### 검증 및 배포
- [ ] 모바일 실기기 테스트 (iOS Safari, Android Chrome)
- [x] PWA 설정 (`manifest.json`, 서비스워커 기초)
- [x] Gemini API 응답 시간 2초 이내 검증 (gemini-2.5-flash, 브라우저 테스트 통과)
- [x] Supabase RLS 보안 검증 (security-guard 에이전트 + 코드 수정)
- [x] Vercel Production 배포 (https://monthly-dev-01-beggar-app.vercel.app)
- [x] KPI 측정 기준 설정 — waitlist 전환율·지출 입력 횟수·체크인 streak를 기존 테이블로 집계
- [x] SNS 공유 기능 추가 (NagResult 공유 버튼 — navigator.share / clipboard fallback)
