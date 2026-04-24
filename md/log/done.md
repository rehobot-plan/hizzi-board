# 히찌보드 — 완료 로그

> 공장 1-6에서 한 줄 append. 세션 단위 요약·교훈·서사 금지.
> 포맷: - [YYYY-MM-DD] 작업명 (커밋 해시) — 영향 파일
> 임계: 500줄 초과 시 Code 자동으로 md/archive/done-{N}.md로 분할 이관 
>       (프로토콜 단계 아닌 자동화).

---

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
