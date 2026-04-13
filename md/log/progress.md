# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-13 세션 #8 (종료)
- 작업 브랜치: master + feat/fullcalendar-poc (f88194c, 부분 PASS)
- 진행 중: FullCalendar PoC 부분 PASS — 데이터 전처리 + eventOrder 커스텀 영역으로 문제 축소
- 다음 TODO:
  1. FullCalendar 잔여 문제 해결 — (a) 연차 1일×N → 멀티데이×1 데이터 전처리, (b) eventOrder 커스텀 함수로 멀티데이 우선 강제, (c) 4케이스 재검증
  2. 캘린더 정식 교체 (3-1) — 잔여 문제 해결 후, Firestore 매핑 정식화 + 카테고리 3종 필터
  3. 캘린더 디자인 통일 (3-2)
  4. Codex 검열 강화 (인박스 #1 격상)
  5. Playwright E2E 자동 트리거 정책
  6. Claude Code 안전 명령 화이트리스트 (인박스 #5 동일)
  7. 실작업 복귀
- 미해결:
  - git remote 미설정 (Dropbox 동기화 기반)
  - FullCalendar 옵션만으로 옵션 B 정렬 충족 불가 — 데이터 전처리 + 커스텀 함수 영역
  - Phase E 자동화 정책 미결정

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
