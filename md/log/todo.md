# 히찌보드 — 할 일

> 진행 중·대기 중 할 일만. 완료되면 해당 줄 삭제. 세션 단위 요약·교훈 금지.
> 완료 로그: md/log/done.md
> 구조 규약: 1순위 → 후보 큐 → 현재상태 → 선처리 → 미해결 순서 고정.
> 1순위 필드는 후보 큐 top 항목과 복붙 수준 동기화 필수.

---

## 다음 1순위

- P1-β. MY DESK 요청 탭 4축 패턴 도입 (결정 1) — 신규 RequestSegment·RequestFilterBar·RequestSortDropdown·RequestBulkBar + RequestList 재편. 할일 탭 패턴(TodoSegment 4종) 재사용. md/plan/designs/mydesk.md 4 update 동반.

## 후보 큐

### [본 감사 P1 우선 실행]
- P1-β. MY DESK 요청 탭 4축 패턴 도입 (결정 1) — 신규 RequestSegment·RequestFilterBar·RequestSortDropdown·RequestBulkBar + RequestList 재편. 할일 탭 패턴(TodoSegment 4종) 재사용. md/plan/designs/mydesk.md 4 update 동반.
- P1-γ. RecordModal 2탭 유지 + 명칭 "기록"→"보관" (결정 3 + 기존 [수집 2026-04-25] 후보 3번). 헤더 RECORD→ARCHIVE, "기록"→"보관", 진입 메뉴 라벨 동기화. md/plan/designs/main-ux.md 2.3 명칭 update.
- P1-δ. MY DESK 요청 탭 "요청 보내기" 입구 추가 (기존 [수집 2026-04-27]). 받은요청·보낸요청 라인 우측 정렬 버튼 → RequestComposeModal 진입. 입력 방식(자연어 prefill vs 폼) 실행 단계 결정.
- P1-ε. 채팅 입력창 글로벌 노출 (기존 [수집 2026-04-27]). AppShell 또는 Header sticky 승격 + "어느 패널에 추가될지" 시각 단서 보강 (동선 ① P2 1번 통합).

### [본 감사 P2 후속]
- 메인 채팅 = 요청 보내기 주류 입구 명시 (결정 4) — md/plan/designs/main-ux.md 4.2·6.3 MD update + src/lib/parseLocal.ts 요청 trigger 단어 경계 점검.
- 채팅 입력 키보드 동선 보강 (기존 [수집 2026-04-27]) — Enter 확정·Tab 칩 이동·항목 카드 진입. md/ui/patterns.md P9 키보드 동선 추가.
- 채팅 파서 정확도 점검·향상 설계 (기존 [수집 2026-04-27]) — src/lib/parseLocal.ts 4축 분류 케이스 측정 + 향상 방향. md/plan/designs/ai-capture-hb.md 영역.
- RecordModal 진입을 점세개 → 별도 아이콘 (기존 [수집 2026-04-25] 후보 4번) — P1-α(회색 영역) 안정 후 모달 진입 빈도 재측정해 자연 기각 또는 승격 결정.

### [별 세션 트랙 — 본 감사 외, 본 정돈에서 명시 박제]
- viewer read-only 정책 정돈 — RecordModal 'all' 탭 viewer 노출 (canCreate 게이트 완화) 또는 alternative 검토. archivedAt(P1-α) silent disappear 회귀 해소 사이클. master-debt #21 정합. P2.
- 메모 검색·태그 도입 (결정 7). Phase 2 AI 채팅 패널 자연어 검색으로 흡수 가능.
- 사이드바·본인 패널 헤더 인지 정보 확장 (결정 6·8 통합). P1-α 회색 영역 안정 후 별 디자인.
- 풀스크린 달력 확대 모달 (결정 5 옵션). 본인 패널 달력 탭에 확대 진입 추가.
- 편지봉투 아이콘 평면화 (기존 [수집 2026-04-25] 후보 5번). 디자인 트랙.
- 타인 패널 액션(응원·댓글) 의도 확인 (결정 9). chillkim 님 의도 확인 후 결정.

### [본 감사 무관 — 그대로 유지]
- ask-knowledge.js Anthropic API 직통 자동화 — 공장 내부 Code↔Claude 왕복 자동화. 100% 자동 아님, 오너 개입 영역 축소 목적. 폭주 방지 제약(라운드 상한·토큰 예산·특정 판단 유형 수동 유지) 설계 필수. 거버넌스 층 수정 동반. Claude Desktop 설정 후 별 건 검토. P2
- 6 B-1 — LLM 2단 본체 부착 (Anthropic Haiku) · ai-capture-hb.md 9.3
- 6 수신자·기한·타입 unset 질의 UI 확장 · ai-capture-hb.md 4.2
- authStore.onAuthStateChanged reload 부작용 (master-debt #14)
- MD 다이어트 — master 계열 5분할 통합 · designs/ 완료분 아카이브 이관 · 유령 파일 정리 · archive/ 월간 집계
- (거버넌스 잔여) CLAUDE.md [6] 경계 사례 문구 보강
- (거버넌스 잔여) MEMORY 박제 임계 D안 정식화 (환원 불가능한 것만 박제)
- (거버넌스 잔여) MEMORY 잔존 5건 환원 재검토
- (거버넌스 잔여) done.md 자기참조 케이스 포맷 규약 — harness.md 1-6 한 줄 추가
- (거버넌스 잔여) session.md 세션 종료 2단계 제약에 "단계 2 갱신 제안 '없음' 3건은 drift 아닌 정상" 명시 조항 추가 — 2026-04-24 시운전 관찰
- (거버넌스 잔여) rules-detail.md dangling 참조 정리 — "CLAUDE.md [4-2]·[4-3]·[4-4]·[2]" 거버넌스 재설계 이전부터 부정확. 4번이 하위 항목 없는 단일 단락이라 [4-2]·[4-3]·[4-4]는 처음부터 유효 위치 없음, [2]는 [3] 잘못 가리킴 — 2026-04-25 비교표 3 검수 중 발견
- (거버넌스 잔여) harness.md 3 "현재 spec: playwright-login.spec.js" 문구 실측 반영 — 해당 파일 testDir 밖이라 표준 명령 실행 불가 (2026-04-24 블록 ④ 1-5 관찰)
- (거버넌스 잔여) session.md 2번 "종료 판단 기준" 한 줄 추가 — 개발 의도 전환 / 콘텍스트 포화 / 오너 명시적 지시 중 하나 발생 시 종료. 거버넌스 층 수정이라 별도 세션에서 before/after 비교표 검수 필요 — 2026-04-24 종료 시점 판단 기준 공백 관찰

## 현재상태

- 작업 브랜치: master (cascade visibility 보존 1-6 완료 — calendarEvents writer 정돈 · 거버넌스 재설계 1차 적용 완료 · ⑤-3 closed · #18 전체 closed · #19 silent widening 해소(UI 칩 복구만 open) · #16 closed · Claude Desktop + MCP filesystem 설정 완료 · calendarEvents 컬렉션 초기 상태)
- 프로덕션: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW
- Codex 플러그인 커맨드 7종 실재 확인(review/rescue/adversarial-review/cancel/result/setup/status) — `/codex:adversarial-review` 존재 확정, harness.md 3 목록과 일치
- Codex 슬래시 커맨드 자동 호출 — 2026-04-27 진단으로 `/codex:status`·`/codex:review` 자동 호출 통과 확인(frontmatter `disable-model-invocation: true`에도 불구하고 Skill tool 호출 PASS). 직전 관찰(2026-04-24 `/codex:rescue` 1m+ hang · 2회 reject)은 환경적이며 구조적 아님. `/codex:rescue`는 본 세션 미시도(직전 관찰 인용). 플러그인 v1.0.3 정상 작동
- 본 감사 완료 (2026-04-27) — P1 4건·P2 4건·별 세션 5건 분류, 1순위 P1-α 회색 영역으로 갱신, MD drift 3건 master-debt 박제, cancel_requested 누락 master-bugs 박제
- harness.md 3 명령 권한 정책 sub-section 추가 (3축 + 두 파일 분담 규약). settings.local.json 무력화 2줄 삭제(공용 ask 실효 발동, .gitignore 대상이라 commit 외)
- P1-α 1-6 완료 (2026-04-27) — CompletedRecentSection 부착 + archivedAt 도입 + selectRecentCompletedTop5. Codex review 4 라운드 PASS (P2×3 + P1×1 해소). 4차 P2(viewer silent disappear)는 master-debt #21 박제 + 별 사이클(viewer 정책 정돈) 분리. 1순위 → P1-β MY DESK 요청 탭 4축 패턴 승격.

## 선처리 큐

- #5 tabbar-sticky.spec 간헐 timeout
- #7 Vercel Preview env 불완전
- #8 panel-record-menu 시나리오 3·4·5 프로덕션 실패 (2026-04-25 #18 2단계 회귀 스위트 관찰) — 팝오버 ESC 닫힘 / 바깥 클릭 닫힘 / "기록" 클릭 RecordModal 노출. 본 변경과 코드 경로 무관 (Panel.tsx · RecordModal 미수정). 원인 추적 필요

## 미해결

- 실 Chrome 스크롤 jump handle
- DevTools Performance 워크플로우
- post-request cascade divergence
- serviceAccount.json git history 잔존
