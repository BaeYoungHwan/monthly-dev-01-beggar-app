# 기능 스펙: 비교 통계 모듈 (Comparison Stats)

> 작성일: 2026-04-15 | 버전: v1 | 상태: Draft
> 참조 PRD: `docs/product-specs/PRD-v1.md`

---

## 1. 목적

경쟁 심리를 자극해 지출 억제 행동을 유도하고 SNS 공유를 이끌어낸다.
"나만 이러는 거 아니었어?" → "나 이 정도면 잘하는 편이잖아?" → 캡처 공유 → 바이럴

---

## 2. MVP 포함 기능 (P1)

### 2-1. 거지 백분위 (Percentile Ranking)

**정의**: 오늘 지출액 기준 전체 유저 중 내 위치를 상위 %로 표현

**표현 예시**:
- `상위 5%` → "당신은 오늘의 청렴한 거지입니다. 계속하십시오."
- `하위 10%` → "상위 90%의 과소비자. 대단한 부자 나셨습니다."

**100명 미만일 때 — 가상 데이터 전략**:
- 실제 유저 데이터가 30명 미만이면 `simulated_spending_distribution` 상수 배열과 혼합
- 가상 분포: 한국 20~30대 일평균 지출 연구 기반 (2~10만원 정규분포 가정)
- 유저에게는 표시하지 않음 — "전체 사용자 기준" 문구만 노출

**랭킹 참여 조건**: `daily_checkins`에 오늘 날짜 레코드가 있는 유저만 집계 대상
(무활동 0원 어뷰징 방지 — `feature-anti-abuse.md` 참조)

**계산 방식**:
```sql
-- daily_aggregates View를 기반으로 백분위 계산
-- (실제 구현은 lib/grade/percentile.ts 에서 서버 사이드 처리)
SELECT
  COUNT(*) FILTER (WHERE daily_total < :user_today_total)::float
  / NULLIF(COUNT(*), 0) * 100 AS percentile
FROM daily_aggregates
WHERE aggregated_date = current_date;
-- 단, 오늘 체크인한 유저만 모수에 포함
```

---

### 2-2. 전체 유저 평균 비교 (Peer Comparison)

**표시 데이터**:
- 오늘 전체 유저 평균 지출액
- 내 지출 vs 평균 차이 (금액 + %)
- 오늘 가장 많이 지출된 카테고리 (전체 유저 기준)

**표현 예시**:
```
오늘 다른 거지들 평균: 8,200원
당신의 지출: 23,500원 (+186%)
오늘의 1등 낭비 카테고리: ☕ 카페
```

**AI 잔소리 활용**:
- 백분위와 평균 비교 데이터를 Gemini 프롬프트에 주입
- `"오늘 상위 82% 과소비자입니다. 평균보다 186% 더 쓰셨네요. 카페를 사랑하시나 봐요?"` 수준의 잔소리 생성

---

### 2-3. SNS 공유 카드

**내용**: 백분위 + 오늘 지출액 + 거지 등급 + 한 줄 AI 잔소리를 담은 이미지 카드

**구현 방식**: CSS로 카드 레이아웃 렌더링 후 `html2canvas` 또는 `dom-to-image-more`로 PNG 캡처
> 라이브러리 추가 전 승인 필요

**공유 텍스트 예시**:
```
나 오늘 거지 랭킹 상위 3% 찍음 ㅋㅋㅋ
AI한테 "무소유의 화신" 칭찬받음
#동결거지 #거지챌린지
```

---

## 3. P2 이후 기능 (이번 MVP 제외)

| 기능 | 이유 |
|------|------|
| 명예의 전당 (주간 1~3위) | 유저 100명+ 이후 의미 있음 |
| 굴욕의 전당 (유저 투표) | 투표 시스템 별도 구현 필요 |
| 동네/연령대 필터 비교 | 개인정보 수집 항목 추가 필요 |

---

## 4. DB 설계

### daily_aggregates 테이블

매일 자정 집계 배치(또는 Supabase Cron)로 전일 데이터를 미리 계산해 저장.
실시간 `expenses` 풀스캔 없이 통계를 빠르게 제공하는 것이 목적.

```sql
create table public.daily_aggregates (
  aggregated_date   date primary key,
  total_users       integer not null default 0,   -- 해당 날짜 지출 기록 유저 수
  avg_daily_total   integer not null default 0,   -- 전체 유저 일평균 지출 (원)
  median_daily_total integer not null default 0,  -- 중앙값
  top_category      expense_category,             -- 가장 많이 지출된 카테고리
  no_spend_users    integer not null default 0,   -- 무지출 유저 수
  created_at        timestamptz not null default now()
);
```

### Supabase View: user_today_percentile

```sql
create or replace view public.user_today_stats as
select
  e.user_id,
  sum(e.amount) as today_total,
  (
    select avg_daily_total
    from public.daily_aggregates
    where aggregated_date = current_date - 1  -- 전일 집계 기준
  ) as avg_total,
  (
    select count(*)::float
    from (
      select user_id, sum(amount) as daily_total
      from public.expenses
      where spent_at = current_date
      group by user_id
    ) sub
    where sub.daily_total < sum(e.amount)
  ) / nullif(
    (select count(distinct user_id) from public.expenses where spent_at = current_date),
    0
  ) * 100 as percentile_rank
from public.expenses e
where e.spent_at = current_date
group by e.user_id;
```

> 이 View는 당일 실시간 계산용. 유저 수 증가 시 `daily_aggregates` 기반으로 전환.

---

## 5. 서버 사이드 구현 위치

```
src/lib/grade/
├── calculator.ts      # 등급 계산 (기존)
└── percentile.ts      # 백분위 계산 + 가상 데이터 혼합 로직

src/app/actions/
└── stats.ts           # 비교 통계 Server Action
```

**`percentile.ts` 핵심 로직**:
```ts
// 유저 수 30명 미만일 때 가상 분포와 혼합
const SIMULATED_DISTRIBUTION = [
  2000, 3000, 3500, 4000, 5000, 5500, 6000, 7000, 8000, 9000,
  10000, 12000, 15000, 18000, 20000, 25000, 30000, 35000, 50000, 80000
] // 한국 2030 일평균 지출 가상 분포 (원)

export function calcPercentile(userTotal: number, realTotals: number[]): number {
  const base = realTotals.length < 30
    ? [...realTotals, ...SIMULATED_DISTRIBUTION]
    : realTotals
  const below = base.filter(t => t < userTotal).length
  return Math.round((below / base.length) * 100)
}
```

---

## 6. AI 잔소리 프롬프트 주입 방식

지출 입력 Server Action에서 Gemini 호출 시 통계 컨텍스트 추가:

```
[시스템 프롬프트 + 페르소나]
...
[통계 컨텍스트]
- 오늘 지출: {amount}원
- 전체 유저 평균: {avg}원
- 사용자 백분위: 상위/하위 {percentile}%
- 오늘 지출 카테고리: {category}
```

백분위에 따라 잔소리 강도를 달리함:
- 상위 20% (절약): 칭찬 + 약한 도발 ("오늘은 봐드리겠습니다")
- 중간 40~60%: 평균 비교 중심 잔소리
- 하위 20% (과소비): 최대 강도 독설
