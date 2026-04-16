# 히찌보드 — 하네스 루프 구조

> session.md에서 분리. 하네스/검증 파이프라인 상세.
> 전체 흐름의 단일 출처. session.md는 이 파일을 참조한다.

---

## 하네스 루프 구조 (2026.04.09 설계 확정)

```
[오너] 방향 기획
  │
  ▼
[Claude - Sonnet] Planner
  → hizzi-progress.txt 업데이트
  → 기능 요구사항 failing 목록으로 분해
  → 명령 블록 생성 + 리뷰 여부 명시
  │
  ▼
[Codex /codex:adversarial-review] 1차 검열
  → rules.md / flows.md 기준 충족 여부
  → 설계 결정 + 실패 모드 도전적 검열
  → FAIL → Claude 재설계
  → PASS
  │
  ▼
[Claude Code - Opus 4.6] Executor
  → 코드 실행 + 빌드
  │
  ▼
[Codex /codex:review] 2차 검열
  → 빌드 결과 + 로직 검증
  → FAIL → /codex:rescue 투입 (Codex가 직접 수정)
  → PASS
  │
  ▼
[GitHub Actions] CI 자동화 ✅
  → 자동 빌드 확인 (.github/workflows/ci.yml)
  │
  ▼
[Playwright MCP] E2E 검증 (조건부 자동)
  → CI 자동 트리거: PR 라벨 `needs-e2e` OR
                   src/components/calendar/** ·
                   src/components/**Modal*.tsx 경로 변경
  → 수동 트리거: Claude Code 터미널에서 MCP 직접 호출
  → 현재 spec: playwright-login.spec.js (인증 불필요)
  → FAIL → Claude 재설계 루프
  → PASS
  │
  ▼
[오너] 보고 + 승인
```

---

## 모드별 화살표 주체

수동 모드 (기본):
  모든 단계 사이 화살표는 오너가 copy-paste로 구동.

/operate 모드:
  [오너 → Claude.ai → Codex adversarial] 구간: 오너 수동 유지
  [Codex adversarial PASS → Claude Code → codex:review → ask-claude → commit → 보고] 구간: 관리자 Code 파이프라인 자동 구동 (master-operator.md 3절)
  오너 개입 지점: 명령 투입(/operate 시점), 최종 보고 수신, 금지·상한 규칙 위반 시 중단 보고.

---

## 검증 기준 (Playwright 체크리스트)

> 코드 품질 체크는 rules.md 마스터 체크리스트를 단일 출처로 사용.
> 이 파일은 Playwright E2E 한정 항목만 관리한다.

```
기능 구동:
  ✅ 로그인 페이지 정상 노출 (playwright-login.spec.js)
  □ 로그인 → 패널 로드
  □ 할일 생성 → 목록 표시
  □ 체크박스 완료 → 완료 탭 이동
  □ ESC → 모달 닫힘
  □ 요청 수락 → 캘린더 자동 등록
  □ 이미지 클릭 → ImageViewer 열림

디자인 (Codex adversarial 기준):
  □ 색상 토큰 uxui.md 준수
  □ transition 0.15s ease 통일
  □ z-index 계층 이탈 없음
  □ 공통 컴포넌트 인라인 재구현 없음
```

---

## Codex 슬래시 커맨드 (Claude Code 터미널)

```
/codex:review             — 일반 코드 리뷰 (read-only)
/codex:adversarial-review — 설계 결정 + 실패 모드 도전적 검열
/codex:rescue             — Claude Code 막혔을 때 Codex에 완전 위임
/codex:status             — 백그라운드 작업 상태 확인
/codex:result             — 완료된 작업 결과 확인
/codex:cancel             — 진행 중 작업 취소
```

---

## 환경 설정

```
Claude Code: v2.1.97 (Opus 4.6, 1M context, Claude Max)
Codex 플러그인: openai/codex-plugin-cc (C:\Users\User\.claude\plugins\codex)
Playwright MCP: v0.0.70 (C:\Users\User\.claude.json 등록 완료)
GitHub Actions: .github/workflows/ci.yml 존재 확인
프로젝트: D:\Dropbox\Dropbox\hizzi-board
배포 URL: https://hizzi-board.vercel.app
```
