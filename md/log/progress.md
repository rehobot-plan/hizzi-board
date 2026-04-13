# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-13 세션 #13 (종료)
- 작업 브랜치: feat/fullcalendar-poc (3a4b4bc — Phase 4 완료)
- 진행 중: 캘린더 디자인 통일 (Phase 5) + master 머지 대기
- 다음 TODO:
  1. 캘린더 디자인 통일 (3-2) — 구 Calendar.tsx 시각 토큰과 차이 정리 + 통일
  2. feat/fullcalendar-poc → master 머지
  3. 실작업 복귀: ESC 닫기 버그 / 첨부파일 다중 업로드 / TodoRequestModal 섹션 재편 / 댓글 기능 / 완료 알림 토스트
- 미해결:
  - git remote 미설정
  - master.md 15~17행 인코딩 깨짐 잔존 (경미)
- 참고: 프리셋1 (md-presets/presets.json) — 새 방 진입 시 `프리셋 프리셋1` 실행 후 _staging/ 드래그

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
