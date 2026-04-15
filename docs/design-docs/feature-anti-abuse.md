# 기능 스펙: 어뷰징 방지 + 활동 기반 신뢰 시스템

> 작성일: 2026-04-15 | 버전: v1 | 상태: Draft
> 참조: `docs/design-docs/feature-comparison-stats.md`

---

## 1. 문제 정의

**"무활동 0원 = 1등"** 문제.
지출을 입력하지 않으면 합계가 0원이 되어 자동으로 상위 랭킹을 차지하는 어뷰징이 발생한다.
단순히 금액이 낮은 것을 기준으로 삼으면 앱을 켜지 않는 것이 최선의 전략이 되어버린다.

**해결 원칙**: 랭킹 기준을 "가장 적게 쓴 사람"이 아닌 **"가장 활발하게 절약을 실천(하고 고통받)는 사람"** 으로 전환.

---

## 2. MVP P1 포함 기능

### 2-1. 생존 신고 버튼 (일일 체크인)

**개념**: 하루에 한 번, 지출 입력 또는 "오늘의 생존 신고" 버튼 클릭으로 당일 활동을 기록한다.

**체크인 타입**:
- `with_spend`: 지출 입력 시 자동 체크인 (별도 버튼 불필요)
- `no_spend`: "오늘 한 푼도 안 씀" 버튼을 직접 클릭

**랭킹 참여 조건**: 당일 체크인이 존재해야만 랭킹에 집계됨. 무활동 = 랭킹 제외.

**UI**: 대시보드 상단에 "오늘의 생존 신고" CTA 버튼 노출. 체크인 완료 시 숨김 처리.

```
┌─────────────────────────────────┐
│  🚨 오늘 아직 생존 신고 안 함   │
│  [ 무지출 인증하기 ]             │
└─────────────────────────────────┘
```

---

### 2-2. 등급 공식 개정

**기존**: `점수 = (일일_예산 - 실지출) × 연속_무지출_일수`
**개정**: `점수 = (일일_예산 - 실지출) × 연속_체크인_일수`

**변경 이유**:
- 무지출 연속보다 **활동 연속**이 더 공정한 지표
- 매일 500원 쓰면서 매일 신고한 사람 vs 3일 동안 앱 안 켠 사람 → 전자가 더 높은 점수

**streak 초기화 조건**:
- 자정까지 체크인 없음 → `no_spend_streak` 0으로 리셋
- 지출 입력 = 자동 체크인이므로 streak 유지

**`profiles` 테이블 컬럼명 변경**:
- `no_spend_streak` → `checkin_streak` (의미 확장)
- `last_spent_date` → `last_checkin_date`

> ⚠️ phase-0.md의 DB 스키마 SQL에서 해당 컬럼명도 수정 필요

---

### 2-3. AI 탐정 모드 (The Interrogator)

**트리거**: 마지막 체크인으로부터 N시간 경과 시 AI가 의심의 눈초리를 보냄

**구현 방식**:
- 대시보드 진입 시 서버에서 마지막 체크인 시간 확인
- 오늘 체크인 없음 + 오후 2시 이후 접속 → 탐정 모드 잔소리 배너 표시

**잔소리 예시 (Gemini 프롬프트로 생성)**:
```
"오늘 오후인데 지출 기록이 없네요?
혹시 법인카드로 몰래 드신 건 아니죠?
아니면 점심을 굶으셨나요? 그것도 나름 절약이긴 한데..."
```

**배지**: 3일 이상 체크인 없이 접속 시 "의심스러운 거지" 배지 임시 부여

**AI 프롬프트 컨텍스트 주입**:
```
[탐정 모드 컨텍스트]
- 마지막 체크인: {N}일 전
- 오늘 활동: 없음
- 평소 소비 패턴: 일평균 {avg}원
→ 위 정보를 바탕으로 의심스럽고 킹받는 탐문 잔소리 1개 생성
```

---

## 3. P2 이후 기능 (MVP 제외)

| 기능 | 이유 | 구현 복잡도 |
|------|------|------------|
| 영수증 OCR | Gemini Vision API 별도 연동, 이미지 저장 인프라 필요 | High |
| 0원 인증샷 커뮤니티 승인 | 커뮤니티/투표 시스템 = 별도 테이블 + UI | High |
| 정직도 점수 (패턴 분석) | 충분한 데이터 누적 후 의미 있음 (최소 30일 데이터) | Medium |

---

## 4. DB 설계 — `daily_checkins` 테이블

```sql
create table public.daily_checkins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  checkin_type text not null check (checkin_type in ('no_spend', 'with_spend')),
  created_at   timestamptz not null default now(),
  unique(user_id, checkin_date)  -- 하루 1회만 허용
);
```

**RLS**:
```sql
alter table public.daily_checkins enable row level security;

create policy "본인 체크인만 조회 가능"
  on public.daily_checkins for select
  using (auth.uid() = user_id);

create policy "본인 체크인만 생성 가능"
  on public.daily_checkins for insert
  with check (auth.uid() = user_id);
```

---

## 5. 서버 사이드 구현 위치

```
src/app/actions/
└── checkin.ts        # 생존 신고 Server Action

src/lib/grade/
└── calculator.ts     # 등급 공식: checkin_streak 기반으로 수정

src/components/
└── checkin/
    └── CheckinBanner.tsx   # 생존 신고 버튼 + AI 탐정 배너
```

**`checkin.ts` 핵심 로직**:
```ts
'use server'
export async function submitCheckin(type: 'no_spend' | 'with_spend') {
  // 1. daily_checkins에 오늘 날짜로 upsert (이미 있으면 무시)
  // 2. profiles.checkin_streak +1
  // 3. profiles.last_checkin_date = today
  // 4. 무지출(no_spend)인 경우 AI 칭찬 잔소리 생성 후 반환
}
```

---

## 6. 핵심 설계 철학

> "거짓말로 1등 해서 얻는 명예보다,
>  정직하게 소비를 고백하고 AI에게 혼나는 재미가 더 크도록 설계한다."

어뷰징 방어막이 아니라 **참여 동기** 설계가 핵심.
생존 신고 버튼 자체가 "앱을 매일 열게 만드는" 리텐션 훅이다.
