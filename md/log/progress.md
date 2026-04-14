# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-14 세션 #17 (종료)
- 작업 브랜치: feat/fullcalendar-poc (76814ad — Phase 5-C 1차 pass 배포 완료)
- 진행 중: Phase 5-C 2차 pass(할일) 진입 대기
- 다음 TODO:
  1. Phase 5-C — 2차 pass 할일(TodoItem 105건) / 3차 pass 게시물(CreatePost 71건), 각 pass R4.10 3축 개별 검증
  2. feat/fullcalendar-poc → master 머지 (Phase 5 완료 후)
  3. 실작업 복귀: ESC 닫기 버그 / 첨부파일 다중 업로드 / 댓글 기능 / 완료 알림 토스트
- 미해결:
  - git remote 미설정
  - md/core/master.md 15~17행 인코딩 깨짐 잔존 (경미)
  - close-session.md ↔ session.md [4] 드리프트 3건 (인박스 등록)
  - src/components/ImageViewer.tsx 루트/common 중복 (경미, 별도 세션)
  - src/components/TodoItem.tsx 상세/편집 모달 내장 (Phase 5-C 2차 pass 시 판단)
- 참고: 프리셋 시스템 단일화 완료. `프리셋` 한 단어로 current 엔트리 실행.
- 검토 후보 (조건부 진입):
  - FullCalendar 미활용 기능 7건 (master 머지 + 디자인 통일 완료 후)
    · 추천 순서: iCal 공휴일 피드 → 드래그 → 리사이즈 → rrule → 주간 뷰 → 검색 → 타임존
    · 각 후보 R4.9+R4.10 순서, 단일 세션 1건씩
    · 3/4/5 는 스키마 변경 동반
  - R4.10 preflight 훅 구현 (N/M PASS 카운트 검증)
  - 토큰 소비 최적화 — progress.md 현재상태/작업로그 분할 (장기 누적 시 재검토)
    · R4.10-가/나 텍스트 반영 후 1~2세션 관찰 → 개선 불충분 시 훅으로 승격

---

## 작업로그 (날짜/세션 단위 append — 삭제 금지)

### [2026-04-09] 세션 #1
- 완료: 하네스 구조 설계 (v1→v2→v3), CLAUDE.md + progress.md + MEMORY.md 생성
- 메모: 기존 md/ 5개 문서 분석 완료. 부채 트래커 분리 트리거(10개 초과) 설정.

### [2026-04-10] 세션 #2 — MD 재구조화 + 하네스 인프라 완성

하네스 인프라
- preflight.ps1 stdin JSON 파싱 방식 전환 (환경변수 → stdin)
- /start-session 예외 처리 추가 (flag 없어도 통과)
- /메모 슬래시 명령 신설 (.harness/ideas-inbox.md + Claude.ai A+B 하이브리드 운영)
- /close-session 인박스 처리 단계 추가
- CLAUDE.md 협업 역할 정의 섹션 신설 (Claude.ai / Claude Code / 오너)
- md/core/session.md [2. 소통 규칙] 역할 동기화 ("해결 확률%" 제거, 장단점+추천 구조)

MD 폴더 재구조화 (19개 파일)
- 폴더 구조: md/core/ (10) + md/ui/ (4) + md/log/ (2) + md/archive/HV/ (1) + CLAUDE.md
- master.md 425 → master(148) + schema(85) + debt(102) + bugs(29)
- rules.md 274 → rules(65) + detail(208+R4.8)
- flows.md 265 → flows(54) + detail(205)
- session.md 250 → session(149) + harness(100)
- patterns.md 246 → patterns(119) + modal(127)
- uxui/ux-principles/log/progress 이동
- HV/ → archive/HV/ 이동
- review-session.md 삭제
- CLAUDE.md 114 → 68줄 압축
- rules-detail.md R4.8 신설 (명령 블록 실행 원칙)
- .harness/locked-files.txt 15개 신규 경로 반영
- .claude/commands/start-session.md, close-session.md 구 경로 6건 → 신규 경로 수정
- Phase 9 5개 카테고리 검증 전체 PASS
- master-debt.md 1행 인코딩 손상 수정

메모
- 검증 체크리스트 방식 확립 (매핑표 + 5개 카테고리)
- Claude.ai/Claude Code 역할 분리 실전 적용 (설계 vs 실행)
- 세션 중 /메모 누락 3건 발생 → 세션 종료 시 재확인 후 인박스 소급 반영 (교훈: 메모 저장 여부 반드시 확인)

### [2026-04-10] 세션 #3 — 하네스 빈 사이클 검증

- Phase A(세션 진입): PASS — preflight stdin JSON, /start-session 예외 처리 정상
- Phase C(Claude Code 위임): PASS — 더미 주석 추가, 빌드 성공, commit 완료
- Phase D(Codex 검열): N/A — 주석 한 줄은 검열 대상 아님. CLI/플러그인 존재 확인.
- Phase E(Playwright E2E): N/A — CI에 Playwright step 미포함(수동 MCP). 빌드만 자동.
- Phase F(세션 종료): PASS — close-session 경로 정상 작동
- session.md/session-harness.md 오너 외부 편집 반영
- 더미 commit revert 완료

### [2026-04-10] 세션 #8 — 캘린더 정렬 + 정책 수립 (R4.9, R4.10)

Codex 검열 실전 테스트
- 결함 주입 #1: R2.1+R5.1 → 2건 탐지 PASS
- 결함 주입 #2: 로직 반전+null 안전성 → 로직 결함 탐지 PASS, null은 가드 내부로 정확 판단

캘린더 정렬 (4차 사이클 + revert)
- 정렬 기준 반전 (commit 0329502) + persistedRows (commit c3184fc)
- 가설 C(연차 가상 멀티데이) 구현 (commit 81c7059)
- 오너 검증: 4가지 결함 패턴 발견 → 81c7059 revert (commit ba82a7b)
- 가설 C 폐기 원인: 합성 이벤트와 렌더링 파이프라인 구조적 불일치
- 가설 E 채택: 2-pass 할당 (합성 없이 그룹 row 강제)
- 옵션 B 요구사항 확정: 긴 연속 > 짧은 연속 > 단일

정책 수립
- R4.9 코드 스터디 원칙 신설 (5개 파일, commit 3fa67e2)
- R4.10 검증 방법론 신설 (4개 파일, commit 353e65b)
- codex-review-policy.md 래퍼 파일 신설 (플러그인 내부 수정 회피)

교훈
- 코드 라인 매칭 PASS 금지 — 실 데이터 E2E만 유효
- 합성 이벤트 접근은 렌더링 파이프라인과 구조적 충돌 (evById 조회)
- 범용 도메인 문제는 외부 솔루션 조사 선행 필수

### [2026-04-13] 세션 #9

- 세션 시작 + 종료만 (실작업 없음)
- session.md 오너 편집 반영: 제안 규칙 형식 제한 (장점/단점/추천/추천이유 4개만)
- rules-detail.md 오너 편집 반영: R4.10 검열 3축 (가동/기능/디자인) 재설계

### [2026-04-13] 세션 #8 — 코드 스터디 정책 반영 + FullCalendar PoC 부분 PASS

정책 반영 (R4.9/R4.10) — commit 323586d
- session.md [2-2] PASS 판정 3축 신설
- rules-detail.md R4.9(외부 라이브러리 우선 조사) + R4.10(PASS 3축 검증) 신설
- CLAUDE.md Claude.ai 역할에 R4.9 1줄 추가
- push 실패: git remote 미설정

캘린더 라이브러리 비교 조사 (R4.9 1차 적용)
- 후보 3개: FullCalendar / react-big-calendar / Toast UI Calendar
- 추천: FullCalendar (eventOrder 옵션 + 활발한 유지보수 + locale 내장)

FullCalendar PoC (R4.10 1차 적용) — commit f88194c
- 브랜치: feat/fullcalendar-poc
- /calendar-poc 신설, 4시드 케이스 + Playwright E2E 검증
- 결과: 부분 PASS
  - 가동: PASS (빌드 70.5kB, FullCalendar 에러 0건)
  - 기능: 케이스 A PASS, B/C/D FAIL
  - 디자인: 스크린샷 2장
- FAIL 원인:
  - B, D: eventOrder는 같은 날 시작 이벤트 간 정렬만 제어. 진행 중 멀티데이 vs 새 단일 우선순위는 내부 엔진 결정
  - C: 연차 1일×3은 독립 이벤트. 연속 블록 합치려면 데이터 전처리 필요

R4.10 정책 작동 사례
- Opus 스크린샷 1차 시각 검토에서 자평 → expected vs actual 표 작성 단계에서 자체 정화, FAIL 보고로 정정
- Claude.ai도 캡처 1차 검수에서 PASS 오판 → 텍스트 보고에서 정정
- R4.10이 정책 첫 적용에서 2회 작동

총평
- 인프라(렌더링/한국어/+more/드래그)는 자체 구현 대비 절약 분명
- 남은 문제 범위: 5사이클 row 충돌 알고리즘 전체 → 데이터 전처리 + 정렬 함수 2건으로 축소 (R4.9 가치)
- 다음 세션에서 잔여 문제 해결 시도

### [2026-04-13] 세션 #9 — FullCalendar v2 완전 PASS

변경 (commit fd2c3c9)
- eventOrder: 'duration,-title' → '-duration,start,title' (부호 반전으로 B/D 해결)
- mergeConsecutiveLeave() 40줄 전처리 함수 신설 (동일 author + 연속 날짜 + 동일 카테고리 그룹화)

검증 (R4.10 3축)
- 가동: 빌드 70.9kB, FullCalendar 에러 0건
- 기능: 4케이스 전부 PASS (expected vs actual 표 대조)
- 디자인: 시드만 / 시드+Firestore 두 모드 스크린샷

총평
- PoC v1 FAIL 원인은 옵션 문자열 부호 하나 (duration → -duration)
- 연차 연속은 데이터 전처리 40줄로 자체 구현 5사이클의 합성 이벤트 복잡도 전체 대체
- R4.9 정책 수치: 자체 구현 5+ 사이클 미완 → 라이브러리 도입 2세션 완결
- R4.10 Claude.ai 적용 (인박스 #8) 첫 실천: 캡처 시각 훑기 대신 expected 좌표 표 대조

메모
- 같은 방 연속 세션 2회째 (세션 #8 → #9). 인박스 #7 규칙 한도 도달
- 정식 교체(TODO 1)는 새 방에서 master.md / flows.md 첨부 후 진입 권장

### [2026-04-13] 세션 #12 — Playwright E2E 조건부 자동 트리거 정책

- 완료: .github/workflows/ci.yml에 e2e job 추가. 트리거 = PR 라벨 `needs-e2e` OR `src/components/calendar/**` · `src/components/**Modal*.tsx` 경로 변경. dorny/paths-filter@v3 사용. 현재 범위는 playwright-login.spec.js 1건.
- 완료: md/core/session-harness.md 하네스 루프 Phase E 설명을 "조건부 자동"으로 갱신.
- 완료: TODO 4(E2E 정책), TODO 5(사례 리스트) 제거. 미해결 "Phase E 자동화 정책 미결정" 해소.
- 메모: 인증 기반 spec 확대는 Firebase 테스트 환경 구성 후 별도 세션. 현재는 진입점만 열어둔 최소 가동 상태.
- 교훈: 정책 결정 TODO는 "최소 가동 구조 + 확장 여지" 형태로 닫는 게 현재 방 성격(MD/정책)에 맞음.

### [2026-04-13] 세션 #11 — 제안 규칙 통일

- 완료: md/core/session.md [3] 최초 응답 규약 2번 항목을 [1] 제안 규칙(장점/단점/추천/추천이유 4개) 참조로 통일
- 완료: md/core/rules-detail.md R4.9에 "제안 규칙과의 관계" 섹션 추가 — 라이브러리 조사 보고는 제안 규칙 예외 명시
- 메모: 오너 요청 "제안 시 설명 과다, 4개 항목만으로 판단 가능하게". session.md [1]은 이미 일치 상태였고 충돌 1건([3]) + 경계 모호 1건(R4.9)만 수정.
- 교훈: 동일 규칙을 2곳 이상에서 참조할 때 한쪽을 단일 출처로 두고 나머지는 포인터로 유지해야 드리프트 방지.

### [2026-04-13] 세션 #10 — 화이트리스트 + 동기화 감사

- 완료: .claude/settings.json permissions.allow 20개 항목 추가 (읽기+빌드/테스트 범위). commit e60cf79.
- 완료: progress.md "다음 TODO" 실제 파일 상태 대조 감사. TODO 3(Codex 검열 강화), 5(화이트리스트)가 이미 완료 상태로 잔존 발견 → 제거.
- 메모: 세션 #7 시점 progress.md 기준으로 세션 진입 후 MD 코드 스터디 정책 반영(TODO 1)·라이브러리 조사(TODO 2) 작업 진입 시도 → 이미 세션 #8·#9에서 완료된 항목임을 파일 첨부 확인으로 발견. 구조적 원인: close-session이 완료 TODO 자동 제거 미수행. 개선안 별도 인박스 등록 예정.
- 교훈: 세션 시작 시 "progress.md 다음 TODO ↔ 실제 파일 상태" 사전 검증 단계 필요.

### [2026-04-13] 세션 #11 — 프리셋 시스템 + 인박스 메모

- 완료: md-presets/ 프리셋 시스템 구축 (presets.json + 프리셋.ps1 + _staging/ + PS 프로필 별칭)
- 완료: 프리셋.ps1 UTF-8 BOM 수정, hizzi-session-start 3종 복사 검증 PASS
- 완료: md/core/progress.md stale 복사본 삭제 확인
- 인박스 메모 4건: close-session 완료 TODO 자동 제거, start-session TODO 실재성 검증, R4.8 cd+git 체인 금지, 인박스 ✅ 자동 삭제 통합

### [2026-04-13] 세션 #12 — 캘린더 교체 설계 + 인박스 루프 진단 + MD 정책 정비

- 완료: Calendar.tsx 전수 조사 (5개 store, CRUD 5진입점, 교체 연쇄 영향 10건)
- 완료: close-session 인박스 이관 단절 원인 조사 — 4단계 수동 루프 미완주가 근본 원인
- 완료: 인박스 15건 분류 + 이관 (무효 4, session.md 5, rules-detail.md 2, progress.md TODO 1, 병합 1)
- 완료: md/core/session.md 5건 반영 (첨부 경로 명시 / 제안 규칙 4항목 강화 / TODO 실재성 검증 / close-session 통합 단계 / 연속 세션 정책)
- 완료: md/core/rules-detail.md 2건 반영 (R4.8 cd 체인 금지 / R4.10 Claude.ai 캡처 검수)
- 메모: 인박스 루프 구조 개선(옵션 C) 적용 — Claude.ai 분류 → Claude Code 반영 2단계

프리셋 시스템 확장
- D:\Dropbox\Dropbox\md-presets\presets.json 에 "프리셋1" 엔트리 추가
- 등록 파일 10개: session/progress/rules + flows/master/master-schema + CalendarV2.tsx + calendar-helpers.ts + Calendar.tsx + leaveStore.ts
- 용도: 캘린더 V2 Phase 2+ 작업용 세션 진입 프리셋
- 드라이런 검증 PASS (10/10 파일 존재, _staging 복사 10개)
- 백업: presets.json.bak
- md-presets 폴더는 hizzi-board 리포 밖이므로 git 대상 아님

### [2026-04-13] 세션 #13 — FullCalendar 정식 교체 Phase 1~4 완료

Phase 0 (commit 4660aa4)
- calendar-helpers.ts 253줄 — 순수 함수/상수 모듈 추출

Phase 1 (commit 04d5622 → 88614cc)
- CalendarGrid.tsx 285줄 — FullCalendar 2개월 래퍼
- Calendar.tsx 컨테이너 — Firestore onSnapshot + 어댑터
- buildCalendarEventInputs 어댑터 — calendarEvents + leaveEvents → EventInput[]
- 4케이스 시드 PASS (멀티단독/멀티+단일/연차연속/멀티겹침)

Phase 2 (commit 5fa7b37 + f0f4887)
- CalendarModals.tsx AddEventModal — 추가 모달 이식
- dateClick/select 콜백 배선
- initUserListener/initLeaveListener 컨테이너 초기화 추가
- 6/6 PASS (단일클릭/드래그/반복/구분범위/연차단일/연차범위)

Phase 3 (commit 07d6971)
- DetailModal + LeaveDetailModal + DeleteConfirmModal 이식
- eventClick 콜백 배선
- handleUpdate/handleDeleteSingle/handleDeleteRepeat/handleLeaveUpdate/handleLeaveDelete
- 8/8 PASS (상세/수정/단일삭제/반복삭제/연차상세/연차수정/연차삭제/업무요청뱃지)

Phase 4 (commit 3a4b4bc)
- page.tsx import 스왑
- CreatePost.tsx dynamic→static import 전환 (getEventColor)
- 구 Calendar.tsx/CalendarV2.tsx/calendar-v2/ 삭제 (-1,776줄)
- 7/7 PASS (메인렌더/실데이터/추가모달/상세모달/PoC회귀/404/CreatePost)

교훈
- R4.10 위반: Phase 2 commit 시 1/6 PASS 보고 후 강행 → 추가 검증으로 보강 (인박스 등록)
- R4.10 능동 보강: Phase 3 케이스 8 데이터 부재 → 오너 지시로 임시 문서 생성 검증 (인박스 등록)
- listener 중복 초기화: 재정리 패턴으로 안전 (런타임 확인)

### [2026-04-13] 세션 #14 — 프리셋 단일화 + Phase 5 기획 + close-session 확장

Phase 5 기획 (R4.9/R4.10 사전)
- FullCalendar 테마 API 4방식 비교 → 추천: 하이브리드 C (CSS Variables + .fc-* + TS 토큰)
- Phase 5 3단계 확정: 5-A(tokens.ts+globals.css) → 5-B(프리미티브 3종) → 5-C(3-pass 도메인)
- 할일/게시물 hex 카운트 전수 조사 (TodoItem 105 / CalendarModals 97 / CreatePost 71)
- TodoItem 상세/편집 모달 내장 발견, ImageViewer 루트/common 중복 발견

프리셋 시스템 단일화
- presets.json: 3엔트리 → 단일 current. 프리셋.ps1: 파라미터 제거, current 고정.
- 드라이런 PASS (_staging 6파일)

close-session 확장 (commit 942f320)
- 신규 단계 8 "다음 세션 프리셋 업데이트" + session.md [4] 프리셋 라인 추가

인박스 이관
- R4.10-가·나 rules-detail.md, session.md [4] 검증 단계, progress.md 검토 후보
- 인박스 메모 4건: 토큰 최적화(progress 분할), 규칙 단일출처, 프리셋 최소 구성, 인계 요약

교훈
- R6.1/R6.2 — 인프라 문제 진단 시 실제 파일 먼저 확인. 추측 금지.
- Phase 5-A는 새 방 권장 (tokens.ts 신설 = 컨텍스트 새로 잡는 게 유리)

### [2026-04-13] 세션 #15 — Phase 5-A 디자인 토큰 인프라

- 완료: src/styles/tokens.ts 신설 (colors/calendarEvent/tagColors/zIndex/typography)
- 완료: globals.css :root 재작성 (uxui 14토큰 + shadcn 호환 + FC CSS vars 7개)
- 완료: md/ui/uxui.md today-bg #F5E6E0 추가
- 완료: --foreground #2B2323 → #2C1810 교정 (uxui.md 단일 출처)
- 완료: Vercel production 배포 + CSS var 실측 PASS
- R4.10 3축: 가동 PASS / 기능 5/5 (CSS var 실측) / 디자인 3장 스크린샷

### [2026-04-13] 세션 #16 — Phase 5-B 공통 프리미티브 + 요청 UI 재설계 길 B 설계

Phase 5-B (commit 390a77d)
- common/ 4종: LeftBorderBar / CategoryTag / RequestTag / VisibilityTag
- leftBorderColor.ts: postLeftBorderColor(2분기) + todoLeftBorderColor(3분기)
- patterns.md P2 교정: 5분기→메모2/할일3 (좌측 띠=카테고리축, visibility·starred는 태그)
- 12변형 검증 PASS, Vercel 배포 완료

요청 UI 재설계 길 B 설계 (인박스 등록)
- 진입 버튼 카운트 분리 + 토스트 다리 + cancel_requested + 통합 댓글 스레드
- 데이터 모델 변경 동반 → 새 방 권장

교훈
- P2 캐논과 실 코드 불일치 발견 → 선행 조사가 검증 트리거 역할
- (b) 채택: 코드를 정답으로 두고 문서 교정. Phase 5 시각 변경 없는 인프라 원칙 보존

### [2026-04-14] 세션 #17 — Phase 5-C 1차 pass 달력 토큰화

변경 (commit 76814ad)
- Calendar.tsx / CalendarGrid.tsx / CalendarModals.tsx 3파일 토큰화
- 치환 108건 (calendarEvent.* 14종 + colors.* 9종 매핑)
- 잔존 23건: #6B8BC1 토요일 / #fff 이벤트 텍스트 / #FFF5F2 반복 active /
  #EAF3DE 구분 업무 / #F0F5F0·#5C7A5C 완료 뱃지 / #FFF9F7 요청 박스 /
  rgba(55,138,221,0.1) 개인 active — tokens.ts 미존재 (인박스 등록됨)

R4.10 3축
- 가동: 빌드 287kB 직전 대비 ±0 / 에러·경고 0
- 기능: 매핑표 A(14)+B(9) 1열==3열 전건 일치
- 디자인: 스크린샷 5/5 + 직전 390a77d 대비 diff 0 / production 재확인 PASS

R4.10 정책 작동 사례
- Claude Code 1차 보고 3/5 스크린샷 후 "조건부 승인" 제안
- Claude.ai 반려: 세션 #13 교훈 적용, 2장 추가 촬영 지시
- 논리 추론만으로 건너뛰기 금지 원칙 보존

교훈
- (b) colors.* + calendarEvent.* 동시 치환이 정답. 비교 로직과 style 값 영역이 실제로 겹치지 않음
- 잔존 23건은 3차 pass 완료 후 일괄 "신규 토큰 승격" 안건으로 묶어서 오너 결정
