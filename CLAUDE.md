# monthly-dev-01-freeze-beggar (동결거지) — 지침 지도

> AI의 독설과 게이미피케이션을 통해 사용자의 지출을 억제하고 자산을 보호하는 '초절약' 보조 앱
> 이 파일은 ~100줄 지도입니다. 세부 규칙은 `docs/`에 있습니다.

---

## 핵심 규칙 (항상 적용)

- 코드·변수명: **영어** / 주석·커밋·소통: **한국어**
- 민감정보(API 키 등): `.env` 관리, 절대 커밋 금지
- CLAUDE.md는 핵심 규칙만 유지 — 특정 상황 규칙은 `docs/ref/`에 배치

---

## 모델 사용 규칙

| 작업 유형 | 모델 |
|-----------|------|
| 탐색 / grep / 파일 검색 | Haiku |
| 개발 (코딩, 디버깅, 리팩터링) | Sonnet |
| 설계 / 계획 (Plan 모드) | Opus |

자세한 기준 → [`docs/ref/agent-model-routing.md`](docs/ref/agent-model-routing.md)

---

## 보안 규칙

- `--no-verify`, `curl | sh`, 자격증명 직접 입력 금지 (훅이 차단)
- 모든 Bash 명령은 `logs/claude-audit.log`에 자동 기록됨
- 자세한 보안 정책 → [`docs/SECURITY.md`](docs/SECURITY.md)

---

## 에이전트 사용 규칙

- `agents/` 폴더 에이전트: **병렬 처리 서브태스크** 전용
- Plan 모드로 설계 후 독립적으로 분리 가능한 작업은 반드시 에이전트로 병렬 실행
- 에이전트 분류 기준 → [`agents/LANES.md`](agents/LANES.md)

---

## 작업 흐름

| 상황 | 참조 문서 |
|------|-----------|
| 새 프로젝트 시작 | [`docs/ref/project-setup.md`](docs/ref/project-setup.md) → `/init-project` |
| TODO 작업 진행 | [`docs/ref/todo-workflow.md`](docs/ref/todo-workflow.md) |
| 커밋 작성 | [`docs/ref/commit-convention.md`](docs/ref/commit-convention.md) |
| 테스트 전략 | [`docs/ref/testing-patterns.md`](docs/ref/testing-patterns.md) |
| 검증 전략 | [`docs/ref/verification-protocol.md`](docs/ref/verification-protocol.md) |
| PRD / 설계 문서 | [`docs/ref/PRD-template.md`](docs/ref/PRD-template.md) |
| Spec-driven 개발 | [`docs/ref/spec-driven-workflow.md`](docs/ref/spec-driven-workflow.md) |

---

## 컨텍스트 재시작 시 ("다음 작업 하자")

1. `docs/ref/session-state.md` 읽기 (git 상태)
2. `docs/exec-plans/active/` 읽기 (진행 중 작업 목록)
3. `[🔄]` 항목부터 이어서 진행

---

## 알림

- 1차: PC 토스트 알림 (`global-setup/` 설치 시 자동 동작)
- 세션 종료 시 git 상태 자동 저장 → `docs/ref/session-state.md`

---

## 프로젝트 구조

```
monthly-dev-01-freeze-beggar/
├── CLAUDE.md                  # 이 파일 (지침 지도)
├── TODO.md                    # 작업 목록
├── .claude/
│   ├── settings.json          # 권한 + 훅 등록
│   ├── hooks/                 # 보안·감사·세션 훅
│   └── commands/              # 슬래시 스킬
├── agents/                    # 병렬 에이전트
├── docs/
│   ├── ref/                   # 참조 문서 (필요할 때만 로드)
│   ├── design-docs/           # 설계 문서
│   ├── exec-plans/            # 실행 계획 (active/completed)
│   └── product-specs/         # PRD / 기획 문서
├── src/
│   ├── app/                   # Next.js App Router
│   ├── components/            # UI 컴포넌트
│   ├── lib/                   # 유틸 / Supabase 클라이언트 / Gemini 클라이언트
│   └── types/                 # TypeScript 타입 정의
├── tests/
├── logs/                      # gitignore 대상
└── .env.local                 # gitignore 대상
```

---

## 프로젝트 맞춤 규칙

> /init-project 에서 자동 생성됨. 이 프로젝트에만 적용됩니다.

### Claude 행동 지침

- 모든 코드는 TypeScript로 작성하고 타입 정의를 엄격히 할 것 (`strict: true`)
- DB 스키마(Supabase/PostgreSQL) 변경 전에는 반드시 SQL 문을 미리 보여주고 승인을 받을 것
- AI 페르소나 잔소리 프롬프트는 '기분 나쁜 비하'가 아닌 '재치 있고 킹받는 B급 감성'을 유지할 것

### MVP 범위 제한

> 아래 항목은 명시적 요청 없이 절대 구현하지 않습니다.

- 지도 기반 '거지맵' 기능 (다음 달 고도화)
- 소셜 로그인 (Google, GitHub 등)
- 상세 자산 분석 및 통계 그래프
- 실제 결제 연동 (Stripe, 토스페이먼츠 등) — 사업자 등록 전까지 구현 금지

### 수익화 전략 (MVP 단계)

> 실제 결제 대신 **구매 의향 데이터 수집**에 집중한다.

- **Fake Door Test**: 유료 기능 클릭 시 "출시 알림 신청" 팝업 + 이메일 수집 (Waitlist)
- **클릭 이벤트 로그**: 유료 기능 진입 횟수를 Supabase에 기록 → 전환율 근거 데이터
- **커피 후원 링크**: 카카오페이 송금 링크 삽입 가능 (사업자 불필요)
- 사업자 등록은 PG사 정산 요구 / 월 매출 유의미 / 비용 처리 필요 시점에 진행

### 기술 스택 고정

- **프레임워크**: Next.js 15 (App Router)
- **스타일링**: Tailwind CSS
- **백엔드/DB**: Supabase (PostgreSQL + RLS + Auth)
- **AI**: Gemini 2.5 Flash (모델 확정 전까지 사용; 실제 최신 모델명 확인 후 교체)
- **언어**: TypeScript (strict mode)
- **배포**: Vercel + Supabase Free Tier

다른 라이브러리/프레임워크 임의 도입 금지 — 추가 필요 시 반드시 먼저 물어볼 것
