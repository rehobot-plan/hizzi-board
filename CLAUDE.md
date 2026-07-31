# 히찌 — CLAUDE.md (앱 진입점)

**한 줄** — 여성 의류 브랜드 히찌의 내부 협업 보드. 팀 6명이 실사용하고, 배포는 https://hizzi-board.vercel.app 다.

---

## 폴더 트리

| 자리 | 무엇 |
|---|---|
| `src/app/` | 화면과 서버 라우트 (Next.js) |
| `src/components/` · `src/hooks/` · `src/store/` | 화면 부품 · 훅 · 상태 (Zustand) |
| `src/lib/` · `src/types/` · `src/styles/` | 공용 로직 · 타입 · 스타일 |
| `md/core/` | 앱 정본 — `master.md`(구조 지도) · `session.md`(세션 시작) · `coding-rules.md` · `state-flows.md` · `board-principles.md` · `master-debt.md` |
| `md/ui/` | 화면 규격 — `component-patterns.md` · `ux-rules.md` · `uxui.md` |
| `md/log/` | `todo.md` · `done.md` |
| `md/plan/` · `md/archive/` | 설계 시안 · 지나간 기록 |
| `scripts/` · `tests/` | 손 도구(시드·검산) · 검사 |
| `20260404/` · `이전 md/` | 옛 문서 보관 — 그때 사실이라 손대지 않는다 |

**무엇을 고칠지 모르겠으면 `md/core/master.md` 를 연다** — 기능에서 파일로 가는 길이 거기 있다. 세션을 열 때 읽는 순서는 `md/core/session.md` 에 있다.

---

## 거버넌스 층

이 앱의 규칙은 이 폴더에 없다. 거버넌스는 앱과 별개이고 부모 폴더(`dev/`)의 저장소에 산다. 본체 여섯 — `CLAUDE.md` · `md/core/studio.md` · `md/core/harness.md` · `md/core/rules.md` · `md/core/session-close.md` · `md/ops/projects.md`(앱 목록·라우팅·방문 공정). 부속 하나가 딸린다 — `md/ops/lanes.md`(레인 원장).

**이름이 겹치지 않게 둔다** — 이 폴더의 `coding-rules`·`board-principles`·`state-flows`·`component-patterns`·`ux-rules` 는 거버넌스와 겹치던 이름을 내용을 가리키는 쪽으로 개명한 것이다(2026-07-31). 옛 이름으로 부르지 않는다.

---

## 이 앱 고유 제약

- **`locked-files.txt` 대상 파일은 제안만 한다.** 오너가 명시적으로 허가한 경우에만 고친다.
- 이 문서는 진입점이라 얇게 둔다. 새 규칙·원칙이 생기면 여기 넣지 말고 `md/core/master.md` 의 문서 목록이 가리키는 자리로 보낸다.

---

## 일하는 방식은 여기 없다

공정·소통·보고·판정·세션 종료는 전부 거버넌스 층이 단일 출처다. 이 문서는 **"여기가 무엇이고 무엇이 어디 있는지"만** 답한다.
