# monthly-dev-01-freeze-beggar (동결거지) 아키텍처 v1

> 작성일: 2026-04-15 | 버전: v1 | 상태: Draft
> 참조 ARD: `docs/design-docs/ARD-v1.md`

---

## 1. 시스템 개요

사용자가 지출 내역을 입력하면 Gemini AI가 B급 감성의 독설 피드백을 즉시 생성하고,
절약 성적에 따라 '거지 등급'이 실시간으로 변화하는 모바일 우선 웹 앱.
모든 서비스는 무료 티어 내에서 운영되며, Next.js 15 App Router가 인증/데이터/AI 호출을 서버 사이드에서 처리한다.

---

## 2. 컴포넌트 다이어그램

```
[사용자 (모바일 브라우저)]
         |
         | HTTPS
         v
+-------------------+
|   Vercel (CDN)    |  ← Next.js 15 App Router
|                   |
|  ┌─────────────┐  |
|  │ React UI    │  |  app/ — 페이지 및 레이아웃
|  │ Components  │  |  components/ — 재사용 UI
|  └──────┬──────┘  |
|         │ Server Actions
|  ┌──────▼──────┐  |
|  │  lib/       │  |  API 라우트 없음; 모든 변이는 Server Action
|  │  - supabase │  |
|  │  - gemini   │  |
|  │  - grade    │  |
|  └──────┬──────┘  |
+---------|----------+
          |
    ┌─────┴──────────────┐
    │                    │
    v                    v
+----------+    +------------------+
| Supabase |    |  Google Gemini   |
|          |    |  API (Flash)     |
| - Auth   |    |                  |
| - DB     |    | 잔소리 생성      |
| - RLS    |    | (Server Action   |
+----------+    |  에서만 호출)    |
                +------------------+
```

---

## 3. 레이어 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx        # 매직링크 로그인
│   │   └── callback/route.ts     # Supabase Auth 콜백
│   ├── (app)/
│   │   ├── dashboard/page.tsx    # 지출 대시보드
│   │   ├── expense/
│   │   │   └── new/page.tsx      # 지출 입력 폼
│   │   └── grade/page.tsx        # 거지 등급 화면
│   ├── actions/                  # Server Actions
│   │   ├── expense.ts            # 지출 저장 + AI 잔소리 생성
│   │   └── grade.ts              # 등급 계산
│   └── layout.tsx
│
├── components/
│   ├── expense/
│   │   ├── ExpenseForm.tsx        # 지출 입력 폼
│   │   └── ExpenseList.tsx        # 지출 내역 리스트
│   ├── nag/
│   │   └── NagResult.tsx          # AI 잔소리 표시 (B급 애니메이션)
│   ├── grade/
│   │   ├── GradeBadge.tsx         # 거지 등급 배지
│   │   └── GradeProgress.tsx      # 등급 진행 바
│   └── persona/
│       └── PersonaCard.tsx        # 유료 페르소나 잠금 카드
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # 브라우저용 Supabase 클라이언트
│   │   └── server.ts              # 서버용 Supabase 클라이언트
│   ├── gemini/
│   │   ├── client.ts              # Gemini API 초기화
│   │   └── prompts.ts             # 페르소나별 시스템 프롬프트
│   └── grade/
│       └── calculator.ts          # 등급 계산 로직
│
└── types/
    ├── expense.ts                 # Expense, ExpenseCategory 타입
    ├── grade.ts                   # GradeLevel, GradeBadge 타입
    └── persona.ts                 # Persona, PersonaStatus 타입
```

---

## 4. 데이터 흐름

### 4-1. 지출 입력 → 잔소리 생성

```
사용자 입력 (금액, 카테고리, 메모)
    │
    ▼ ExpenseForm.tsx (클라이언트)
    │  form action → Server Action
    ▼
actions/expense.ts (서버)
    ├── 1. Supabase에 지출 저장 (expenses 테이블)
    ├── 2. Gemini API 호출 (lib/gemini/client.ts)
    │       시스템 프롬프트: 선택된 페르소나 (lib/gemini/prompts.ts)
    │       사용자 입력: "오늘 스타벅스에 6500원 씀"
    │       → 응답: "야 이 돈으로 편의점 삼각김밥 두 개 먹을 수 있었거든?"
    └── 3. 등급 재계산 (lib/grade/calculator.ts)
            공식: (일일_예산 - 실지출) × 연속_무지출_일수
    │
    ▼ NagResult.tsx (클라이언트)
    잔소리 텍스트 + B급 이모지 애니메이션 표시
```

### 4-2. 등급 시스템

```
등급 계산 입력:
  - 사용자 설정 일일 예산 (users.daily_budget)
  - 오늘 지출 합계 (expenses aggregate)
  - 연속 무지출 일수 (users.no_spend_streak)

점수 = (일일_예산 - 실지출) × 연속_무지출_일수

등급 테이블:
  Lv 0.  파산 핑        — 예산 초과
  Lv 1.  월급쟁이 좀비  — 예산 0~10% 절약
  Lv 3.  편의점 헌터    — 예산 11~30% 절약 + 1일 이상 무지출
  Lv 5.  도시락 장인    — 예산 31~50% 절약 + 3일 이상 무지출
  Lv 7.  지하철 유목민  — 예산 51~70% 절약 + 5일 이상 무지출
  Lv MAX 무소유의 화신  — 3일 연속 지출 0 + AI 잔소리 10회 견딤
```

---

## 5. 주요 설계 결정

| 결정 | 선택 | 이유 | ADR |
|------|------|------|-----|
| AI 호출 위치 | Server Action | API 키 노출 방지, Rate Limit 서버 제어 | ADR-001 예정 |
| 상태 관리 | 없음 (서버 상태 직접 fetch) | 1인 개발 복잡도 감소, Next.js 캐시 활용 | - |
| 실시간 업데이트 | 없음 (제출 후 페이지 리로드) | Supabase Realtime은 Free Tier 제약 있음 | - |
| 이미지/에셋 | 없음 (CSS/이모지로 대체) | 배포 용량 최소화, 빠른 MVP | - |

---

## 6. 비기능 요건 달성 전략

| 속성 | 전략 |
|------|------|
| AI 2초 이내 응답 | Gemini Flash 모델 사용, 프롬프트 길이 최소화, 스트리밍 응답 고려 |
| 비용 $0 | Server Action으로 Gemini 호출 횟수 제어 (사용자당 일 20회 제한) |
| 보안 (RLS) | Supabase RLS: `auth.uid() = user_id` 조건 모든 테이블에 적용 |
| 모바일 UX | Tailwind `sm:` 브레이크포인트 사용 금지, 모바일 기본 설계 후 데스크탑 확장 |

---

## 7. 보안 고려사항

- **Gemini API 키**: 서버 환경변수에만 저장 (`.env.local`), 클라이언트 번들에 절대 포함 금지
- **Supabase Anon Key**: 공개 가능하나 RLS로 데이터 접근 제어
- **Supabase Service Role Key**: 서버 사이드에서만 사용, 클라이언트 노출 금지
- **RLS 정책**: `expenses`, `grades`, `users` 모든 테이블에 `auth.uid() = user_id` 조건
- **입력 검증**: Server Action 진입점에서 Zod로 타입 및 범위 검증

---

## 8. 배포 구성

```
GitHub (main 브랜치)
    │
    │ push → 자동 트리거
    ▼
Vercel
    ├── Production: main 브랜치 → freeze-beggar.vercel.app
    ├── Preview: PR/브랜치마다 자동 미리보기 URL 생성
    └── 환경변수:
        NEXT_PUBLIC_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY
        SUPABASE_SERVICE_ROLE_KEY   ← 서버 전용
        GEMINI_API_KEY              ← 서버 전용

Supabase (Free Tier)
    ├── Auth: 이메일 매직링크
    ├── DB: PostgreSQL (500MB 한도)
    └── RLS: 전 테이블 활성화
```
