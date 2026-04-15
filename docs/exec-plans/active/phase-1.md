# Phase 1 실행 계획 — MVP 핵심 기능

> 상태: 진행 중 | 작성일: 2026-04-15
> 목표: 지출 입력 → AI 잔소리 → 등급 확인의 완전한 루프 구현
> 완료 기준: 실제 유저가 지출 입력 후 잔소리를 받고 대시보드에서 등급을 확인할 수 있음

---

## 구현 완료 항목

### 핵심 루프
- [x] `src/app/actions/expense.ts` — Gemini 잔소리 생성 + expenses INSERT + checkin 연동
- [x] `src/app/(app)/expense/new/page.tsx` — 지출 입력 폼 (금액/카테고리/메모/페르소나)
- [x] `src/components/NagResult.tsx` — 잔소리 결과 표시 (bounce 애니메이션)

### 대시보드
- [x] `src/app/actions/dashboard.ts` — 오늘/주간 지출 합계, 체크인 상태 조회
- [x] `src/app/(app)/dashboard/page.tsx` — 전체 재구성 (GradeCard + CheckinBanner + ExpenseList + FAB)
- [x] `src/components/GradeCard.tsx` — 등급 표시 (예산 진행바 포함)
- [x] `src/components/ExpenseList.tsx` — 오늘 지출 내역 리스트

### 체크인 시스템
- [x] `src/app/actions/checkin.ts` — no_spend / with_spend 체크인 Server Action
- [x] `src/components/CheckinBanner.tsx` — 미체크인 시 생존 신고 배너
- [x] `src/components/DetectiveBanner.tsx` — 오후 2시 이후 미체크인 의심 배너

### 비교 통계
- [x] `src/lib/grade/percentile.ts` — 백분위 계산 + 가상 분포 혼합 로직
- [x] `src/app/actions/stats.ts` — daily_aggregates 조회 + 백분위 계산
- [x] `src/components/PercentileCard.tsx` — "상위 N% 청렴한 거지" 표시
- [x] `src/components/ShareCard.tsx` — SNS 공유 카드 UI

### 수익화 기초
- [x] `src/app/actions/waitlist.ts` — waitlist INSERT + click event 로그
- [x] `src/components/PersonaLockedCard.tsx` — 잠금 페르소나 → 출시 알림 신청

---

## 미완료 항목

- [x] 일일 예산 목표 설정 UI (`src/app/(app)/settings/page.tsx` + `actions/settings.ts`)
- [x] 등급 변화 시 애니메이션/효과 (localStorage 기반 레벨업 감지 + 🎉 오버레이)
- [x] "의심스러운 거지" 배지 (`src/components/SuspiciousBadge.tsx`)
- [x] AI 잔소리 프롬프트에 백분위 + 평균 데이터 주입 (expense.ts buildNagPrompt)
- [ ] 공유 카드 PNG 캡처 기능 (html2canvas — 승인 필요)

## 보안 수정 (에이전트 리뷰 반영)
- [x] `waitlist.ts` — 이메일 regex 검증 + personaId 화이트리스트 + upsert 전환
- [x] `stats.ts` — user_id 제거 (amount만 집계), avgTotal 0 NaN 가드
- [x] `expense.ts` — 금액 범위 검증 (1~1억), 카테고리 화이트리스트, streak 유틸 추출
- [x] `checkin.ts` — checkin_type 런타임 검증, streak 유틸 추출
- [x] `lib/streak/updateStreak.ts` — 중복 streak 로직 공통 유틸화

---

## 완료 검증 결과

- [x] `/expense/new` 접속 → 지출 입력 → 잔소리 결과 표시 ✅
- [x] Supabase `expenses` 테이블 레코드 저장 확인 ✅
- [x] `daily_checkins`에 `with_spend` 자동 생성 확인 ✅
- [x] `/dashboard` 에서 오늘 합계, 등급, 지출 내역 표시 ✅
- [x] Gemini `gemini-2.5-flash` 모델 응답 확인 ✅ (잔소리 정상 생성)
- [ ] 체크인 없는 상태에서 오후 2시 이후 → 탐정 배너 노출 (브라우저 테스트 필요)

---

## 관련 커밋

- `e3a5600` — feat: P1 MVP 핵심 기능 전체 구현 (develop 브랜치)
