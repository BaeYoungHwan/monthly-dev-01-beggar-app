# monthly-dev-01-freeze-beggar (동결거지) ARD v1

> 버전: v1 | 작성일: 2026-04-15 | 상태: Draft
> 참조 PRD: `docs/product-specs/PRD-v1.md`

---

## 1. 품질 속성 목표 (Quality Attributes)

| 속성 | 목표 | 측정 방법 | 우선순위 |
|------|------|-----------|----------|
| 성능 | AI 응답 시간 2초 이내 | Gemini API 호출 시간 측정 (서버 액션 로그) | High |
| 비용 | 월 유지비 $0 | Supabase/Vercel/Gemini 무료 할당량 모니터링 | High |
| 보안 | 사용자 데이터 격리 | Supabase RLS 정책 적용 및 침투 테스트 | High |
| 모바일 UX | 모바일 웹 최우선 | iPhone/Android 실기기 테스트, Lighthouse 모바일 점수 90+ | High |
| 확장성 | 초기 100명 수용 | Supabase Free Tier 한계 내 (500MB DB, 2GB 파일) | Medium |
| 유지보수성 | 1인 개발 지속 가능 | TypeScript strict, 컴포넌트 단순성 유지 | Medium |

---

## 2. 아키텍처 제약사항

### 기술적 제약
- 모든 외부 서비스는 Free Tier 내 운영 (Vercel Hobby, Supabase Free, Gemini Free Quota)
- TypeScript strict mode 필수 — 런타임 오류 방지
- Supabase RLS 필수 — 서버 사이드 인증 우회 불가
- 클라이언트에 API 키 노출 금지 — Gemini 호출은 Next.js Server Action으로만

### 조직적 제약
- 1인 개발이므로 운영 복잡도 최소화
- 외부 의존 라이브러리 최소화 — 유지보수 부담 감소

### 예산/인프라 제약
- Vercel Hobby Plan: 무료, 서버리스 함수 10초 타임아웃
- Supabase Free: DB 500MB, 파일 1GB, MAU 50,000
- Gemini Free Tier: 분당 15회 요청, 일 1,500회 (모델별 상이)

---

## 3. 주요 아키텍처 결정 (초안)

| 결정 영역 | 선택 | 근거 |
|-----------|------|------|
| 렌더링 전략 | App Router + Server Actions | 클라이언트에 API 키 노출 없이 Gemini 호출 가능 |
| 인증 방식 | Supabase Magic Link (이메일) | 소셜 로그인 없이 빠른 MVP, 비밀번호 관리 불필요 |
| AI 호출 위치 | Server Action (서버 사이드) | Gemini API 키 보호, Rate Limit 서버에서 제어 |
| 데이터 저장 | Supabase PostgreSQL + RLS | 인증과 DB를 단일 서비스로 관리, Free Tier 충분 |
| 배포 전략 | Vercel + GitHub 자동 배포 | Next.js 공식 지원, 프리뷰 배포로 빠른 검증 |

> 상세 결정 기록 → `docs/design-docs/adr/` 에 ADR로 작성 예정

---

## 4. 리스크

| 리스크 | 영향도 | 발생 가능성 | 완화 전략 |
|--------|--------|-------------|-----------|
| Gemini Free Tier 할당량 초과 (일 1,500회) | High | Medium | 사용자당 일일 잔소리 횟수 제한 (예: 20회/일), 응답 캐싱 고려 |
| Supabase Free DB 500MB 초과 | Medium | Low | 지출 내역 90일 보관 후 자동 삭제 정책 적용 |
| Vercel 서버리스 10초 타임아웃 | Medium | Low | Gemini 응답 스트리밍 적용 또는 타임아웃 전 응답 처리 |
| 1인 개발 번아웃으로 MVP 마감 지연 | High | Medium | Phase별 최소 기능 정의, P1에서 UI 완성도보다 동작 우선 |
| AI 잔소리 톤 과도하게 불쾌할 경우 이탈 | High | Low | 프롬프트 가이드라인 문서화, 출시 전 5인 이상 베타 테스트 |

---

## 5. 검증 기준

아키텍처가 이 ARD를 만족하는지 확인하는 방법:

- [ ] Gemini API 응답 시간 2초 이내 — 실제 지출 입력 후 잔소리 표시까지 측정
- [ ] 타 유저 데이터 접근 불가 — Supabase RLS 정책 직접 SQL 조회 테스트
- [ ] Vercel 배포 비용 $0 확인 — Hobby 플랜 대시보드 모니터링
- [ ] 모바일 Lighthouse 점수 90+ — Performance, Accessibility 항목
- [ ] TypeScript 컴파일 오류 0개 — `tsc --noEmit` 통과
