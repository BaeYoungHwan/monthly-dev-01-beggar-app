# Phase 0 실행 계획 — 기반 구축

> 상태: 대기 | 작성일: 2026-04-15
> 목표: Next.js 프로젝트 초기화부터 Vercel 첫 배포까지
> 완료 기준: Vercel Production URL에서 로그인 화면이 뜨고, Supabase DB 연동이 확인됨

---

## 작업 순서 개요

```
Step 1. Next.js 15 초기화
Step 2. Tailwind CSS 모바일 기본 레이아웃
Step 3. Supabase 프로젝트 생성 + 환경변수 연동
Step 4. DB 스키마 SQL 승인 → 적용
Step 5. Supabase RLS 정책 적용
Step 6. Supabase Auth (매직링크) 설정
Step 7. Gemini API 연동 확인
Step 8. GitHub + Vercel 배포 파이프라인
Step 9. 완료 검증
```

---

## Step 1. Next.js 15 초기화

**명령어** (프로젝트 루트 외부 적당한 위치에서 실행):
```bash
npx create-next-app@latest freeze-beggar \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
```

**tsconfig.json 확인 항목** (`strict: true` 포함 여부):
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**설치할 추가 패키지**:
```bash
npm install @supabase/supabase-js @supabase/ssr @google/generative-ai
npm install -D @types/node
```

**완료 기준**: `npm run dev` 실행 후 `localhost:3000` 접속 가능

---

## Step 2. Tailwind CSS 모바일 기본 레이아웃

**원칙**: `sm:` 브레이크포인트 사용 금지 — 모바일 기본 설계 후 `md:` 이상으로만 확장

**`src/app/layout.tsx` 기본 설정**:
```tsx
// 모바일 최대 너비 고정 + 세로 스크롤 레이아웃
<body className="bg-zinc-950 text-white min-h-screen">
  <main className="max-w-md mx-auto min-h-screen">
    {children}
  </main>
</body>
```

**완료 기준**: 모바일 viewport(375px)에서 레이아웃이 정상 렌더링됨

---

## Step 3. Supabase 프로젝트 생성 + 환경변수 연동

**수동 작업** (Supabase 대시보드):
1. https://supabase.com → 새 프로젝트 생성
2. 프로젝트명: `freeze-beggar`
3. 리전: `Northeast Asia (Seoul)` 또는 `ap-northeast-2`
4. 아래 값을 `.env.local`에 저장

**`.env.local` 구조**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

> `.env.local`은 `.gitignore`에 반드시 포함되어야 합니다.

**`src/lib/supabase/client.ts`** (브라우저용):
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** (서버용):
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## Step 4. DB 스키마 SQL — 승인 필요 ✋

> 아래 SQL을 Supabase SQL Editor에서 실행합니다.
> **실행 전 반드시 검토 후 승인해 주세요.**

```sql
-- =============================================
-- 1. profiles 테이블 (auth.users 확장)
-- =============================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  daily_budget    integer not null default 30000,  -- 원 단위, 기본 3만원
  checkin_streak  integer not null default 0,       -- 연속 체크인 일수 (지출 입력 OR 생존 신고)
  last_checkin_date date,                           -- 마지막 체크인 날짜 (streak 계산용)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- =============================================
-- 2. expenses 테이블 (지출 내역)
-- =============================================
create type expense_category as enum (
  'food',        -- 음식/식비
  'transport',   -- 교통
  'coffee',      -- 카페/음료
  'shopping',    -- 쇼핑
  'entertainment', -- 오락/취미
  'health',      -- 의료/운동
  'etc'          -- 기타
);

create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      integer not null check (amount > 0),  -- 원 단위
  category    expense_category not null default 'etc',
  memo        text,
  nag_result  text,   -- AI 잔소리 캐시 (재조회 없이 표시용)
  spent_at    date not null default current_date,
  created_at  timestamptz not null default now()
);

-- =============================================
-- 3. waitlist 테이블 (Fake Door Test — 수요 검증)
-- =============================================
create table public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  persona_id  text not null,  -- 클릭한 유료 페르소나 ID
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique(email, persona_id)
);

-- =============================================
-- 4. persona_click_events 테이블 (전환율 근거)
-- =============================================
create table public.persona_click_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  persona_id  text not null,
  created_at  timestamptz not null default now()
);

-- =============================================
-- 5. daily_aggregates 테이블 (비교 통계용 일별 집계)
-- 매일 자정 배치로 전일 데이터를 미리 계산해 저장
-- 실시간 expenses 풀스캔 없이 평균/중앙값 제공
-- =============================================
create table public.daily_aggregates (
  aggregated_date    date primary key,
  total_users        integer not null default 0,  -- 해당 날짜 지출 기록 유저 수
  avg_daily_total    integer not null default 0,  -- 전체 유저 일평균 지출 (원)
  median_daily_total integer not null default 0,  -- 중앙값
  top_category       expense_category,            -- 가장 많이 지출된 카테고리
  no_spend_users     integer not null default 0,  -- 무지출 유저 수
  created_at         timestamptz not null default now()
);

-- =============================================
-- 6. daily_checkins 테이블 (생존 신고 / 어뷰징 방지)
-- 하루 1회 체크인으로 랭킹 참여 자격 부여
-- 무활동(앱 미접속) = 랭킹 제외, streak 초기화
-- =============================================
create table public.daily_checkins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  checkin_type text not null check (checkin_type in ('no_spend', 'with_spend')),
  created_at   timestamptz not null default now(),
  unique(user_id, checkin_date)  -- 하루 1회만 허용
);

-- =============================================
-- 7. updated_at 자동 갱신 트리거
-- =============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- =============================================
-- 7. 신규 유저 가입 시 profiles 자동 생성
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## Step 5. Supabase RLS 정책

> 위 스키마 승인 후 이어서 실행합니다.

```sql
-- =============================================
-- profiles RLS
-- =============================================
alter table public.profiles enable row level security;

create policy "본인 프로필만 조회 가능"
  on public.profiles for select
  using (auth.uid() = id);

create policy "본인 프로필만 수정 가능"
  on public.profiles for update
  using (auth.uid() = id);

-- =============================================
-- expenses RLS
-- =============================================
alter table public.expenses enable row level security;

create policy "본인 지출만 조회 가능"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "본인 지출만 생성 가능"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "본인 지출만 삭제 가능"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- =============================================
-- waitlist RLS (비인증 사용자도 삽입 가능)
-- =============================================
alter table public.waitlist enable row level security;

create policy "누구나 waitlist 신청 가능"
  on public.waitlist for insert
  with check (true);

-- =============================================
-- persona_click_events RLS
-- =============================================
alter table public.persona_click_events enable row level security;

create policy "누구나 클릭 이벤트 기록 가능"
  on public.persona_click_events for insert
  with check (true);

-- =============================================
-- daily_aggregates RLS (집계 데이터 — 인증 유저 전체 공개)
-- =============================================
alter table public.daily_aggregates enable row level security;

create policy "인증된 유저는 집계 데이터 조회 가능"
  on public.daily_aggregates for select
  using (auth.role() = 'authenticated');

-- =============================================
-- daily_checkins RLS
-- =============================================
alter table public.daily_checkins enable row level security;

create policy "본인 체크인만 조회 가능"
  on public.daily_checkins for select
  using (auth.uid() = user_id);

create policy "본인 체크인만 생성 가능"
  on public.daily_checkins for insert
  with check (auth.uid() = user_id);
```

---

## Step 6. Supabase Auth (매직링크) 설정

**수동 작업** (Supabase 대시보드 → Authentication → Providers):
- Email 활성화, "Confirm email" 활성화
- "Enable email OTP (Magic Link)" 활성화
- Site URL: `http://localhost:3000` (개발) / Vercel URL (배포 후 추가)
- Redirect URLs: `http://localhost:3000/auth/callback`

**`src/app/auth/callback/route.ts`**:
```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

---

## Step 7. Gemini API 연동 확인

> `GEMINI_API_KEY` 확보: https://aistudio.google.com/apikey

**`src/lib/gemini/client.ts`**:
```ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_NAME = 'gemini-2.5-flash'  // 실제 모델명 확인 후 교체

export function getGeminiModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  return genAI.getGenerativeModel({ model: MODEL_NAME })
}
```

**연동 확인용 Server Action** (`src/app/actions/test-gemini.ts`):
```ts
'use server'
import { getGeminiModel } from '@/lib/gemini/client'

export async function testGemini() {
  const model = getGeminiModel()
  const result = await model.generateContent('안녕하세요, 짧게 한 줄만 대답해줘')
  return result.response.text()
}
```

**완료 기준**: `testGemini()` 호출 시 응답이 2초 이내 반환됨

---

## Step 8. GitHub + Vercel 배포 파이프라인

**순서**:
1. GitHub에 `freeze-beggar` 레포 생성 (private)
2. 로컬 프로젝트 `git remote add origin` 연결 후 첫 push
3. Vercel → "Add New Project" → GitHub 레포 연결
4. Vercel 환경변수 설정 (`.env.local`의 4개 변수 동일하게 입력)
5. `vercel.json` 불필요 — Next.js는 자동 감지

**`.gitignore` 필수 항목 확인**:
```
.env.local
.env*.local
node_modules/
.next/
```

**완료 기준**: `git push origin main` 후 Vercel 대시보드에서 배포 성공 표시

---

## Step 9. 완료 검증 체크리스트

- [ ] `npm run build` 오류 없음 (`tsc --noEmit` 포함)
- [ ] `localhost:3000` 로그인 페이지 접속 가능
- [ ] 매직링크 이메일 전송 및 로그인 성공
- [ ] 로그인 후 Supabase `profiles` 테이블에 레코드 자동 생성 확인
- [ ] RLS 검증: 다른 `user_id`로 `expenses` 조회 시 결과 없음
- [ ] Gemini API 응답 시간 2초 이내 확인
- [ ] Vercel Production URL 접속 가능
- [ ] Vercel 대시보드에서 월 사용량 Free Tier 이내 확인

---

## 예상 소요 시간

| 단계 | 예상 시간 |
|------|-----------|
| Step 1–2 (Next.js 초기화) | 30분 |
| Step 3 (Supabase 연동) | 30분 |
| Step 4–5 (DB 스키마 + RLS) | 20분 |
| Step 6 (Auth 설정) | 20분 |
| Step 7 (Gemini 연동) | 20분 |
| Step 8 (Vercel 배포) | 20분 |
| Step 9 (검증) | 20분 |
| **합계** | **약 2.5시간** |
