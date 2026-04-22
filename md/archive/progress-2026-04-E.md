# 히찌보드 — 작업 진행 아카이브 (2026-04-E)

> progress.md에서 경량화 이관된 세션 로그. 읽기 전용.

---

### [2026-04-17] 세션 #35 — 요청 UI 재설계(길 B) 전체 구현

실행 (12스텝)
1. master-schema.md + flows.md 갱신 (cancel_requested, seenAt, system comments)
2. TodoRequest + Comment 인터페이스 확장
3. /request 라우트 셸 + 사이드바 요청 메뉴
3.5. 공용 좌측 사이드바 레이아웃 컴포넌트 (전 페이지 적용)
4. 요청 목록 컴포넌트 (받은/보낸 탭 + 관리자 전체보기)
5. 요청 상세 팝업 보고서 뷰 + 2진입점
6. 상세 팝업 읽기↔편집 모드 전환
7. 스토어 액션 writeBatch + system comment 자동 삽입 + 신규 3액션
8. 타임라인 user+system 혼합 렌더
9. cancel_requested 요청자 측 UI (취소 요청/대기 배너/철회)
10. cancel_requested 담당자 측 UI (알림 배너/승인/거부)
11. seenAt 갱신 + 사이드바 N+M 뱃지
12. 상태 변화 실시간 토스트 알림

인프라 부수
- Playwright Firebase Auth 헬퍼 (storageState → 직접 로그인)
- 동적 포트 감지 (3000-3002)
- 시드 데이터 체계 (afterAll 자동 정리)
- .claude/settings.json 허가 범위 조정
- CLAUDE.md locked-files 오너 명시 허가 예외 정책

교훈
- MD 문서(스키마+플로우) 확정 후 코드 진입하면 12스텝 연속 에러 없이 진행 가능
- Playwright 인프라 초반 세팅 → 이후 매 스텝 자동 검증
- settings.json 허가 범위 조정으로 중간 멈춤 제거 → 체감 속도 2배

### [2026-04-17] 세션 #36 — 댓글 글로벌 리스너 + TodoItem 진입점 교체 + progress.md 재구성

실행 (3건)
1. 댓글 글로벌 리스너 도입 (commit c361b13 + 485119d)
   - src/store/commentStore.ts 신규 (initCommentListener, S9 패턴 복제)
   - Sidebar.tsx unseenCount에 댓글 축 추가 (resolvedAt > seen OR 댓글 createdAt > seen)
   - page.tsx / request/page.tsx / Sidebar.tsx useEffect에 initCommentListener 등록
   - 토스트: type === 'user' && authorEmail !== userEmail, prevCommentIds로 초기 스냅샷 제외
   - seenAt 갱신 로직 변경 없음 (기존 팝업 열람 시점이 댓글 포함 전체 확인 시점으로 재해석)
   - Playwright 1/1 PASS (comment toast visible)
2. TodoItem → RequestDetailPopup 교체 + RequestDetailModal 제거 (commit 6bcde2c)
   - TodoItem.tsx: matchedRequest 조회 + fallback 분기 + JSX 교체 (+16/-4)
   - RequestDetailModal.tsx 삭제 (-278, 사용처 0)
   - Fallback: matchedRequest === null 시 TodoDetailModal 자동 전환 (토스트 대신 UX 우선)
   - Playwright 24/24 PASS, 1 skip (2.4분)
3. 기획 세션 — 사이드바·뷰 구조 재설계안 + progress.md 그룹 A~J 통합
   - "측면 메뉴 중 요청·연차만 의미 있다" 문제의식 → 홈(팀) + 내 공간(개인) 이원화
   - 기존 "다음 TODO" + "검토 후보" + "요청 도메인" + "장기 방향성"을 세션 그룹 A~J로 재구성
   - 다음 세션 1순위: 그룹 A 설계 세션

교훈
- 탐색 → 설계 → 명령 블록 → 완료보고 사이클이 2조각 연속 에러 없이 돌아감. S9 패턴 복제 원칙이 신규 리스너 진입 장벽을 낮춤
- 구버전 컴포넌트 제거를 교체와 같은 세션에 묶으면 dead code 즉시 0. 분리 시 다음 세션 TODO 불필요 증가
- 구조적 TODO가 섞인 상태에서 "어느 작업 먼저?" 결정이 오래 걸림. 그룹 묶음이 진입 판단 단축

### [2026-04-17] 세션 #37 — 그룹 A MY DESK 설계 세션 완료 + 로드맵 분리

실행 (설계만, 코드 변경 없음)
1. 홈(팀 보드)과 MY DESK(개인 관리)의 역할 분리 확정 — 오너 핵심 통찰 "히찌보드 = 한눈에 서로를 보는 보드"가 홈의 정체성
2. 사이드바 재구성: 홈 / MY DESK / 요청 / 기타(연차 서브). 기존 할일·달력 메뉴 흡수, 연차는 기타로 강등
3. MY DESK 4탭 구조: 오늘 / 할일 / 메모 / 달력 (연차는 기타로 이동)
4. 오늘 탭 — 4 요약 카드(할일/일정/요청/연차) + "지금 봐야 할 것" 시급 리스트 (패턴 2)
5. 할일 탭 — 세그먼트 컨트롤 방식(진행/완료/휴지통) + 필터(업무/요청/개인 다중선택, 기본 전체) + 세그먼트별 정렬 기본값 + 벌크 바 + 안전장치
6. 메모 탭 — 할일 패턴 재사용 (세그먼트 2개, 필터 2개, 체크박스·기한 제거)
7. 달력 탭 — 홈 달력과 공통 필터 컴포넌트, 대상+타입 2축 체크박스, 데스크톱/모바일 분기, OR 로직 (공동 이벤트 한 명 관련 시 표시)
8. 기타 > 연차 — 요약 카드 4개 + 예정/과거 세그먼트 + 상태 뱃지(신청/확정) + locked
9. 상태 트리 전체 시각화 (메모/할일/요청 도메인별 전환, 복원 경로 점선 강조)
10. 문서 구조 재편: md/plan/ 신설, roadmap.md 및 designs/mydesk.md 분리

산출물
- md/plan/designs/mydesk.md — MY DESK 설계 전체 (10 섹션, 구현 Phase 가드 포함)
- md/plan/roadmap.md — progress.md의 세션 그룹 A~J + 장기 방향성 이전
- progress.md (이 파일) — 실행 로그 중심으로 얇아짐

교훈
- 기능 설계 세션과 실행 로그는 성격이 완전히 달라. 한 파일에 섞이면 세션 진입 시 "로그인가 계획인가" 판단 비용 발생. 설계 결과물 별도 파일이 맞음.
- 시각화(와이어프레임·상태 트리·목업) 기반 합의가 텍스트 토론보다 결정 속도 빠름. 모호함 남는 지점이 즉시 드러남.
- 오너 판단으로 조정한 2개 지점(달력 필터 홈 공통화, 연차 기타 이동)이 설계 일관성을 크게 개선. 설계 세션은 오너 개입 시점이 잦을수록 결과물 나아짐.
- 설계 중 상태 트리 작성이 "각 탭에 어떤 섹션이 필요한지" 자동으로 도출시킴. 구조 설계 전 상태 트리부터 박는 순서가 효율적.

다음 세션
- MY DESK Phase 1 구현 — 셸 + 사이드바 개편 + 오늘 탭
- 첨부 파일: md/plan/designs/mydesk.md + CLAUDE.md + progress.md + rules.md
- 라우팅 추가 권고: "새 기능 구현 시 md/plan/designs/ 해당 파일 로드" (CLAUDE.md [4] 라우팅 표)
- Phase 2 진입 전 flows.md cancel_requested 문서 동기화 해소

### [2026-04-17] 세션 #38 — MY DESK Phase 1 구현 (단일 블록 12+2)

실행
1. 인프라 — src/lib/dateUtils.ts + src/store/calendarStore.ts 신설, Calendar.tsx 인라인 onSnapshot을 calendarStore 구독으로 전환 (S9 패턴)
2. MY DESK 셸 — src/app/mydesk/ 폴더 구조(layout/page/today/todo/memo/calendar), /mydesk → /today redirect, 4탭 placeholder
3. Sidebar 개편 — 5메뉴→4메뉴(홈/MY DESK/요청/기타>연차), "기타" 서브 토글 + localStorage 지속
4. 오늘 탭 — useTodaySummary 훅 + SummaryCard·UrgentList·TabBar, 요약 카드 4개 + "지금 봐야 할 것" 시급 리스트, 모바일 2×2
5. 시드 스크립트 — scripts/seed-mydesk-phase1.mjs (seed/clear, seedTag='mydesk-phase1')
6. flows.md cancel_requested 3건 동기화 (세션 #35 구현 반영)

검증
- 빌드·배포 PASS
- Playwright 25/25 PASS, 1 skip
- prod 오너 시각 검증 PASS (김진우 시드로 카드 수치·시급 리스트 정렬·모바일 2×2 확인)
- Calendar.tsx CRUD 회귀 없음

커밋
- 4b107e9 (기능 14파일 +571/-53) / 532f9a3 (테스트) / 4b25f8b (시드) / 5291b29 (flows.md)

교훈
- 설계 세션 7단계 순차 잠금 + 하네스(Codex/Playwright/ask-claude) 조합은 단일 블록 12+2도 안전하게 처리. 3블록 분할보다 속도·안전 모두 우수
- calendarStore S9 전환을 Phase 1에 묶은 결정이 총 비용을 낮춤. Phase 4로 미뤘다면 useTodaySummary 이중 구독 부채 고정되었을 것
- R4.10 기능 축 보고에 시드 기반 구체 수치를 명시해야 "Playwright PASS" 단독 의존을 피하고 검증 완결성 확보

다음 세션
- 인박스 선처리 후보: TabBar hover 상태 (소규모)
- MY DESK Phase 2 — 할일 탭 (세그먼트 3개 + 필터 + 정렬 + 벌크 + 안전장치). 참조: md/plan/designs/mydesk.md 섹션 4

### [2026-04-17] 세션 #39 — /메모 슬래시 커맨드 제거 + 선처리 큐 정비

실행
1. /메모 커맨드 전면 제거: 메모.md 삭제, ideas-inbox.md 삭제, CLAUDE.md·CLAUDE-detail.md·close-session.md에서 인박스 참조 제거 + 단계 재번호 (13→12단계)
2. 선처리 큐 5항목 등록: TabBar hover / UrgentList 요청 연결 / overdue 카드 / 공통 Header / RequestDetailPopup 2단 전환
3. presets.json 갱신 + 프리셋 실행

교훈
- 사문화된 파이프라인(/메모→인박스→Claude.ai 분류→반영)은 실사용 빈도가 0이면 즉시 제거가 유지 비용 최소화. 규약 문서 참조가 6곳에 분산돼 있어 제거 비용이 누적될수록 증가

4. R4.11 단일 블록 범위 원칙 신설: rules-detail.md R4.11 본문 + rules-detail:72 주석 보강 + rules.md 체크리스트 + CLAUDE.md [4-4] 동기화

교훈 (추가)
- 하네스 성능 실측(#35 12스텝, #38 14스텝)을 근거로 규칙 재설계 — 숫자 상한이 아니라 Phase·도메인 경계가 진짜 안전장치

다음 세션
- MY DESK Phase 2 — 할일 탭 (선처리 큐 1~2번 선행)

### [2026-04-17] 세션 #40 — MY DESK Phase 2 할일 탭 구현 + E2E (소급 복원)

실행 (Phase 2 본 구현 + E2E 한 세션)
1. 할일 탭 본 구현 (commit f4344c3, 7파일 +630/-4)
   - TodoSegment / TodoFilterBar / TodoSortDropdown / TodoItemRow / TodoBulkBar 신설
   - src/app/mydesk/todo/page.tsx placeholder 교체
   - src/lib/leftBorderColor.ts 추출
   - TabBar hover 선처리 포함
   - 세그먼트 3개 / 필터 3개 다중선택 (U2 엣지) / 세그먼트별 정렬 기본값 / 벌크 바 3분기 / confirm 2종 / 복원 시 completed·completedAt·deleted·deletedAt 동시 초기화 / requestId 연쇄
2. Phase 2 E2E 보강 (commit 87582b7, 4 spec 7 케이스 +390)
   - segments-filter-sort / bulk-safety / restore / cascade
   - restore: Firestore 직접 조회 4필드 동시 초기화 검증
   - cascade: todoRequests 연쇄 검증
   - 전체 32/32 PASS (신규 7 + 기존 25)
3. R4.9 판단: 자체 구현 채택 (세그먼트 3버튼 + 드롭다운 5옵션 규모상 외부 라이브러리 불필요)
4. R4.10 3축 PASS (가동/기능/디자인 — 디자인 축은 오너 prod 시각 검증 PASS)

교훈
- R4.11 첫 정식 적용 — 7파일 단일 블록 무에러. Phase·도메인 경계가 안전장치로 기능 확인
- 대용량 블록에서 검증 스텝 누락 1건 발생 → 보강 블록으로 해소. 다음 블록부터 검증 스텝을 앞쪽에 먼저 고정하기로 결정
- 선례 기록 갱신: 단일 블록 무에러 최대 분량 14스텝(#38) → 25+스텝. R4.11 범위 내에서 스텝 수 자체는 집중력 저하 요인 아님

비고
- 이 로그는 방 2개 병렬 진행 중 progress.md 덮어쓰기로 유실되었다가 git 히스토리 기준으로 복원된 항목

### [2026-04-17] 세션 #41 — MY DESK Phase 3 메모 탭 구현 (소급 복원)

실행
1. Phase 2 컴포넌트 prop 확장 (commit 262066c, 7파일 +378/-62)
   - segmentMode / filterMode / itemMode prop 추가로 할일/메모 분기
   - 신규 컴포넌트 0 (재사용 설계 적중)
   - src/app/mydesk/memo/page.tsx placeholder 교체
2. 메모 탭 기능
   - 세그먼트 2개 [표시 중 / 휴지통]
   - 필터 2개 [업무 / 개인] + U2 엣지
   - 체크박스·기한 제거, 별표·카테고리·공개범위만
   - 벌크 바 세그먼트별 분기 + confirm 2종
3. 시드 + E2E (tests/e2e/mydesk-phase3/memo-tab.spec.ts)
   - 초회 5/7 커버 → 보강 +2 (U2 필터 복원, safety confirm) = 7/7 PASS (commit 9623eaa)
   - restore: Firestore 직접 조회 deleted=false, deletedAt=null 확인 ✅
   - Phase 2 7/7 + smoke 25/25 = 전체 39/39 PASS (1 skip)
   - 재사용 지표: 신규 컴포넌트 0 / 확장 prop 4 / Phase 2 리그레션 0

커밋: 262066c (기능) + 9623eaa (보강) + 577c585 (로그) + 5f29809 (복원)

교훈
- 검증 틀 선구축 → 커버리지 실사에서 누락 2건 즉시 발견. 마감 블록 분리가 검증 정밀도 확보
- Phase 2 컴포넌트 재사용 설계 적중 — prop 분기만으로 Phase 3 수용, 신규 컴포넌트 0

비고
- 이 로그는 git 히스토리 기준으로 복원된 항목

### [2026-04-18] 세션 #42 — 선처리 큐 1번 UrgentList → RequestDetailPopup 연결

실행 (1건, 단일 파일)
1. src/components/mydesk/UrgentList.tsx (commit a71693d, +47/-28)
   - useState + useTodoRequestStore + RequestDetailPopup import 추가
   - selectedRequestId: string | null 단일 state
   - matched = requests.find(r => r.id === selectedRequestId) ?? null
   - onClick: type='request'일 때만 setSelectedRequestId(item.id) / 'todo'·'event'는 TODO 주석 유지
   - 말미 조건부 <RequestDetailPopup /> 렌더
   - TodoItem 패턴 재사용 (신규 컴포넌트 0)

검증 (R4.10 3축)
- 가동: npm run build PASS, 에러·경고 0
- 기능: 4 케이스 코드 경로 추적 전량 PASS (pending 클릭→open / close 재클릭 / todo·event 무반응 / matched=null 무반응)
- 디자인: RequestDetailPopup 공유로 /request 페이지와 시각 일관성 보장, 오너 prod 시각 확인 PASS

교훈
- 설계 제약 4줄(분기·매칭·상태·렌더)로 압축된 구현은 단일 파일 +47줄로 수렴. TodoItem 패턴 재사용이 설계 비용 제거
- 구현 중 별도 방(오프라인 큐 설계)의 commit 6e0e47d(Firestore persistentLocalCache)가 이 방 git log에 섞여 컨텍스트 확인 1회 발생. 방별 작업 경계 명시가 차기 세션 진입 비용 절감

다음 세션
- 선처리 큐 현 1번(구 2번): MY DESK 연차 카드 → overdue 카드 교체 (소, 설계 잠김)
- 또는 Phase 4-A 달력 탭 리팩터링 (CalendarFilter 공통 추출)

