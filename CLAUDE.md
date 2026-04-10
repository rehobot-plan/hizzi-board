# HIZZI Board — Claude Code 하네스

> 세션 시작 시 자동 로드. 포인터 전용 파일.
> 수정: 오너 승인 필수.

## 프로젝트

- 이름: Hizzi Board
- 경로: D:\Dropbox\Dropbox\hizzi-board
- 스택: Next.js 14 / TypeScript / Tailwind / Zustand / Firebase
- 배포: https://hizzi-board.vercel.app
- 팀: 6명 실사용

## 세션 시작 읽기 순서

| 순서 | 파일 | 조건 |
|:---:|------|------|
| 0 | 이 파일 (CLAUDE.md) | 자동 |
| 1 | md/log/progress.md | **필수** — 현재 상태 |
| 2 | md/core/rules.md | **필수** — 체크리스트 |
| 3 | md/core/flows.md | **필수** — 상태 전환 |
| 4 | md/core/master.md | **필수** — 구조 인덱스 |
| 5 | md/ui/patterns.md | UI 작업 시 |
| 6 | md/ui/uxui.md | UI 작업 시 |
| 7 | md/ui/ux-principles.md | UX 설계 시 |

상세 규칙이 필요하면 인덱스에서 가리키는 상세 파일(rules-detail, flows-detail, master-schema 등) 참조.

## 세션 훅 & 래퍼

- Preflight: `scripts/preflight.ps1` (매 프롬프트 제출 시 자동)
- 명령: `/start-session` · `/메모` · `/close-session` · `/handoff`(예정)
- 🔒 SSOT: `.harness/locked-files.txt`

## 협업 역할 정의

### Claude.ai (설계자)
- 문제 정의, 맥락 파악, 제약조건 명시
- Claude Code에게 프롬프트 작성, 직접 코드 금지
- 작업 순서: rules.md 체크 → flows.md 영향 범위 → UI 작업 시 patterns.md/ux-principles.md → 설계 → 프롬프트 작성
- 새 기능 / 범용 도메인 버그는 명령 블록 1단계로 외부 솔루션 조사를 강제한다 (R4.9)

### Claude Code (실행자)
- Claude.ai 지시 기반 추론·조사·설계·구현
- 결과 + 근거 보고, 막히면 /codex:rescue

### 오너 (방향 결정)
- Claude.ai ↔ Claude Code 중개 + 최종 승인

### 금지
- Claude.ai가 완성 코드 블록 작성
- Claude Code가 독단 설계 변경
- 오너가 중간 단계 스킵

## 핵심 제약

1. 상태 변경 전 → md/core/flows.md 확인
2. 코드 작성 전 → md/core/rules.md 체크리스트
3. any 금지 / Firestore undefined 금지 / catch에 addToast 필수
4. locked-files.txt 대상 → 제안만, 실행 금지
5. Preflight PASS 전 작업 금지

## 빌드 명령

```powershell
npm run build                                              # 기본
Remove-Item -Recurse -Force .next; npm run build           # 클린
git add . && git commit -m "..." && npx vercel --prod      # 배포
```
