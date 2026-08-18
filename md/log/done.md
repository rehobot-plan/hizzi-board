# 히찌보드 — 완료 로그

> 공장 1-6에서 한 줄 append. 세션 단위 요약·교훈·서사 금지.
> 포맷: - [YYYY-MM-DD] 작업명 (커밋 해시) — 영향 파일
> 임계: 500줄 초과 시 Code 자동으로 md/archive/done-{N}.md로 분할 이관 
>       (프로토콜 단계 아닌 자동화).

---

- [2026-08-18] 층 장 재배치가 이 저장소에 닿은 자리 (tokenapp·expand·inboxset · d357f57 외 · 오너 결정) — 층 `harness.md` 의 장 순서가 바뀌어(공정이 3장 → 1장 · 환경·명령이 1장 → 3장) 이 저장소가 든 좌표를 옮겼다(표식 1건 → 새 번호 3건 · 원장 2건 · **잔존 0**). **우편함 자리를 `md/log/inbox/` 에 세웠다** — 이 저장소는 원장이 `md/log/` 에 살아 조각도 그 옆이 맞다. README 에 **최신이 맨 위**라는 이 저장소 관례를 함께 적었다(층 것을 안 베꼈다 — 층 README 는 '층에는 md/log 가 없다'를 사유로 드는데 앱에는 그 사유가 없다). **거짓 적중을 갈랐다** — 이 저장소는 목업 HTML 의 SVG 좌표(`01-2-2V` 꼴)가 지목 무늬에 걸려, 세는 자마다 그것을 먼저 걷어야 값이 선다. **못 잰 것** — 이 저장소 게이트(`npm run lint`·`build`)가 재는 대상이 이번 변경에 없어 안 돌렸다(문서만 바뀌었다 · 통과가 아니라 비해당이다).
- [2026-05-11] 하나보트 엑셀 시트 컬럼 너비 보정 (3997aae) — src/app/hana-vote/admin/report/page.tsx. 요약 시트 [14, 22, 12, 12], 파트 시트 [6, 14, 10, 10, 10, 12, 10] !cols wch 지정. 한글 라벨·세션명·후보명 잘림(####) 해소. 89b5da7 follow-up이라 1-4는 본 사이클 1라운드 PASS의 연장으로 처리(cosmetic 2줄 추가, 기능·가동 영향 없음).
- [2026-05-11] 하나보트 admin 비번 fallback '2026' 교체 (0c3eb9e) — src/app/hana-vote/admin/page.tsx. NEXT_PUBLIC_VOTE_ADMIN_PW Vercel env 미설정 상태 실측 확인 후 코드 fallback 단일 라인 'admin2026' → '2026' 교체. session.accessPassword(개표자용)는 무관, ADMIN_PW(관리자 인증 + 데이터 초기화 모달)만 영향. 보안 약화 인지: NEXT_PUBLIC_* 변수라 클라이언트 번들에 평문 노출되는 기존 구조 유지.
- [2026-05-11] 하나보트 admin 보고서 엑셀 다운로드 (89b5da7) — src/app/hana-vote/admin/report/page.tsx · package.json · package-lock.json. sticky 바 인쇄 좌측 형제로 "엑셀 다운로드" 버튼 + 핸들러 추가. 4시트(요약·장로·시무권사·안수집사) .xlsx 클라이언트 사이드 생성, voteCalculator/calculatePartStats 결과 그대로 사용(신규 계산 없음). 파일명 `{sessionName}_개표결과.xlsx` + OS 금지 문자(`\ / : * ? " < > |`) 언더스코어 sanitize. 마감 전(isFinalized=false)도 인쇄와 동일 정책으로 허용. xlsx@0.18.5 의존성. Codex review 3축 1라운드 PASS (P2 transition opacity 0.15s ease 새 버튼만 반영, 인쇄 버튼은 out-of-scope). E2E는 hana-vote/admin/report 전용 spec 부재 + session 데이터 의존으로 production 수동 검증 구간으로 분리.
- [2026-04-27] P1-β MY DESK 요청 탭 4축 패턴 도입 (eeddb04) — src/components/request/RequestSegment.tsx · RequestFilterBar.tsx · RequestSortDropdown.tsx · RequestBulkBar.tsx (신규 4) · RequestList.tsx (slim 재편) · RequestView.tsx (4축 host) · src/store/todoRequestStore.ts (admin 분기 + 토스트 가드). 4 평면 세그먼트(받은·보낸·진행·완료) + 필터(counterpart·done status) + 세그먼트 sort + 일괄 액션 4종. cancel_requested는 진행 자연 흡수(master-bugs 누락 동시 해소). admin 전용 "전체보기" 토글로 monitoring 전용(selectable 차단·토스트 본인 가드) 정식 흡수. mydesk.md 4.1 + master.md 4·5 동반. Codex review 9 라운드 PASS — P1×3·P2×7 해소.
- [2026-04-27] P1-α 메인 패널 완료 회수 회색 영역 도입 (417dc30) — src/components/CompletedRecentSection.tsx · src/components/Panel.tsx · src/lib/postSelectors.ts · src/store/postStore.ts. main-ux.md 2.5 self-overrule 반영. archivedAt 신규 필드 + selectRecentCompletedTop5 + archivePost 액션 + 회색 영역 collapsible UI. requestId cascade 정합(reactivateRequest 동반 호출). Codex 4 라운드 PASS — P2×3 해소 + P1 cascade 누락 해소 + 4차 P2 viewer silent disappear는 master-debt #21 박제 + 별 사이클.
- [2026-04-27] P1-α 동반 MD 정정 (d8c52e9) — md/core/master-schema.md · md/core/master-debt.md · md/core/master.md · md/core/flows-detail.md · md/plan/designs/main-ux.md · md/ui/ux-principles.md · md/ui/uxui.md. posts.archivedAt schema 정의 + master-debt #20·#21 박제 + master 4·5 CompletedRecentSection 반영 + main-ux 2.6·2.7 + ux-principles U7 + flows-detail completed→accepted 담당 + uxui 4 회색 영역 토큰 서브블록.
- [2026-04-27] 메인·MY DESK UX 감사 산출 정돈 (a49b3b2) — md/log/todo.md · md/core/master-bugs.md · md/core/master-debt.md · md/core/master.md · md/plan/designs/main-ux.md · md/plan/designs/mydesk.md. todo 후보 큐 4군집(P1·P2·별 세션·기존) + master-bugs cancel_requested 박제 + master-debt D-1·D-2·D-3(해소) + main-ux 2.5·2.6 self-overrule·4.2·6.3 채팅=요청 주류 입구 명시 + mydesk 2·4·5.4·12 + 5탭 잔여 3곳 정리 + master CompletedTodo 라인 정리.
- [2026-04-27] harness.md 3 명령 권한 정책 sub-section + settings.local.json 무력화 2줄 삭제 (e289111) — md/core/harness.md · .claude/settings.local.json(.gitignore 동반). 3축 분류(자동 통과·명시 허가·금지) + 두 파일 분담 규약 명문화. 공용 ask 무력화 통로(npx vercel:* · git push *) 두 줄 삭제로 규약·현실 정합 회복.
- [2026-04-27] CLAUDE.md + session.md 거버넌스 직접 수정 (오너 IDE) (d7daa81) — CLAUDE.md · md/core/session.md. Claude.ai 역할 재정의(작업지시서 제작) + 오너 정의 재정의(절대 권력자, 방향 선택·재수정만) + 영향 범위 의미 변경(미수정 영역 명시) + 추천 의무화 + Code용 명령서 표현 + 진입 단어 'ㅇㅇ' 명문화
- [2026-04-27] todoRequest cascade visibility 보존 — calendarEvents writer 정돈 + mapRequestVisibilityToCalendarEvent 헬퍼 (90115d1) — src/lib/calendar-helpers.ts · src/store/todoRequestStore.ts. visibility='all' 하드코드 + visibleTo 미저장 해소. 양당사자(요청자·담당자) visibleTo 보존. 'me' 분기 cascade 미사용. 기존 레코드 마이그레이션은 별도 사이클. Codex review PASS.
- [2026-04-27] CLAUDE.md 1번 4구성 단어 보정 — "어느 파일" → "어느 영역(파일·함수명 지정 금지)" + "검수 포인트" → "오너 결정 사항(기획 판단·코드 정합 점검 아님)". 단어 미끄러짐 회귀 통로 차단(2026.04.20 H-1 + 2026-04-27 cascade 1·2차) (598a9d0) — CLAUDE.md
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
- [2026-04-24] MEMORY 소각 + harness 3-6 오너 핑계 제거 (54cb4e1) — .harness/MEMORY.md · md/core/harness.md

> 이전 로그 (세션 #1~#66 누적): md/archive/progress-2026-04-A.md ~ U.md
> 세션 #67~#68 상세: md/archive/progress-final-2026-04-24.md
