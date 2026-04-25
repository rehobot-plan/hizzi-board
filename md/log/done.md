# 히찌보드 — 완료 로그

> 공장 1-6에서 한 줄 append. 세션 단위 요약·교훈·서사 금지.
> 포맷: - [YYYY-MM-DD] 작업명 (커밋 해시) — 영향 파일
> 임계: 500줄 초과 시 Code 자동으로 md/archive/done-{N}.md로 분할 이관 
>       (프로토콜 단계 아닌 자동화).

---

- [2026-04-25] 거버넌스 재설계 1차 누락 1건 정리 — session.md 3번 단계 라벨 (e80055a) — md/core/session.md
- [2026-04-25] 의도 외 추적 8건 untrack (686ed81) — .harness/session-started.flag · .playwright-mcp/ · .claude/settings.local.json
- [2026-04-25] .gitignore 정비 — 세션 플래그·Playwright 로그·로컬 설정 추적 차단 (b78c683) — .gitignore
- [2026-04-25] 거버넌스 재설계 1차 부수 정리 (49dc657) — md/core/session.md (A·C·1-2층) · md/core/master.md · md/core/master-debt.md · md/core/rules.md · md/log/todo.md · md-presets/ 삭제
- [2026-04-25] 거버넌스 재설계 1차 — CLAUDE.md (B·A·E 적용) (947e8af) — CLAUDE.md
- [2026-04-25] 블록 ⑤-3 타인 패널 달력 scope/privacy 정제 (6ca2454) — src/lib/calendar-helpers.ts · src/components/calendar/Calendar.tsx · src/components/Panel.tsx · tests/smoke/panel-calendar-5.spec.ts. 타인 패널 placeholder 제거 + read-only 월 그리드 · panelVisitingViewer 필터(visibility 삼분 strict + requestId 양당사자/visibleTo + leave panelOwner 매칭) · 쓰기 진입점 전면 차단. Codex 4 라운드(P1×3 R3·R4 strict 보안 정책 PASS 응대). 프로덕션 E2E 시나리오 7 보강 후 PASS.
- [2026-04-25] master-debt #18 3단계 closed — 프로덕션 calendarEvents 레거시 G1 3건(09u1Os··· · CaPqkC··· · YKmrTd···) 일괄 삭제, 컬렉션 초기 상태. 마이그레이션 스크립트 불필요(유령 삭제). #18 전체 closed. (Firestore 데이터 조작 · 코드 수정 없음 · 커밋 해시 없음)
- [2026-04-25] master-debt #18 2단계 writer/reader identity 정돈 (eae34f3) — src/components/calendar/Calendar.tsx · src/components/CreatePost.tsx · src/store/todoRequestStore.ts · src/components/todo/TodoDetailModal.tsx · src/store/chatInputStore.ts · src/lib/calendar-helpers.ts · src/hooks/useTodaySummary.ts · md/core/master-schema.md. #19 silent widening 해소 동시. 프로덕션 E2E 47p/5f/1s
- [2026-04-25] master-schema calendarEvents 재정의 · #18 1단계 (54c2d6b) — md/core/master-schema.md
- [2026-04-24] Claude Desktop + MCP filesystem 설정 완료 — claude_desktop_config.json에 hizzi-board-fs 서버 등록, 허용 경로 D:\Dropbox\Dropbox\hizzi-board. MSIX 샌드박스 경로 %LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\. 검증 질의 "CLAUDE.md 상단 5줄 읽기" 정상 응답 확인. (커밋·해시 없음 — Desktop 앱 설정 파일은 프로젝트 git 관리 밖)
- [2026-04-24] master-debt #16 chat schedule 표준 필드 정렬 + β visibility 칩 숨김 (6ddcc9a) — src/store/chatInputStore.ts · src/components/ChatExpand.tsx · tests/e2e/helpers/chat-input.ts · tests/e2e/chat-input-s6.spec.ts
- [2026-04-24] 블록 ⑤-1 달력 피어 탭 본인 패널 + 타인 placeholder (0d09023) — src/components/Panel.tsx · src/components/calendar/Calendar.tsx · src/hooks/useCalendarFilter.ts · src/app/(main)/mydesk/today/page.tsx · src/app/(main)/mydesk/calendar/page.tsx · src/components/mydesk/TabBar.tsx · tests/smoke/panel-calendar-5.spec.ts · tests/smoke/calendar-filter-4b.spec.ts · tests/smoke/mydesk-tabbar-r4.spec.ts
- [2026-04-24] 블록 ③-B 3층 RecordModal 진입점 + visibleTo 공유 필터 (1·2층 기존 누락 동시 해소) (61f6088) — src/components/Panel.tsx · src/components/RecordModal.tsx · src/components/TodoList.tsx · src/components/PostList.tsx · src/lib/postSelectors.ts · tests/unit/postSelectors.test.ts · tests/smoke/panel-record-menu.spec.ts
- [2026-04-24] chat-input schedule 단어 경계 + 토스트 정직화 (2833ccb) — src/lib/parseLocal.ts · src/store/chatInputStore.ts · tests/e2e/chat-input-s6.spec.ts · md/plan/designs/ai-capture-hb.md · md/core/master-debt.md
- [2026-04-24] 블록 ④ FAB + CreatePost 재배치 (0f75328) — src/components/Panel.tsx · src/components/common/FAB.tsx · src/components/CreatePost.tsx · md/log/todo.md
- [2026-04-24] progress.md 이원화 거버넌스 수정 (자기참조 — git log 본체 참조) — md/log/todo.md · md/log/done.md · md/core/session.md · md/core/harness.md · md/core/master.md · CLAUDE.md
- [2026-04-24] master.md 5 MD 인벤토리 신설 (1398cf1) — md/core/master.md
- [2026-04-24] principles 상향 통합 #5 보강 + #6 신규 (baaf68a) — md/core/principles.md · .harness/MEMORY.md
- [2026-04-24] MEMORY 소각 + harness 1-6 오너 핑계 제거 (54cb4e1) — .harness/MEMORY.md · md/core/harness.md

> 이전 로그 (세션 #1~#66 누적): md/archive/progress-2026-04-A.md ~ U.md
> 세션 #67~#68 상세: md/archive/progress-final-2026-04-24.md
