# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-15 세션 #23 (종료)
- 작업 브랜치: feat/fullcalendar-poc (c8de177 — 길 B-2 + 에러 색상 교체)
- 진행 중: 길 B-2 완료. master 머지 → 길 B-3 순서.
- 다음 TODO:
  1. feat/fullcalendar-poc → master 머지 (새 방 권장, git author 일괄 재작성 동반 판단)
  2. 수정 팝업 3종 재설계 — 길 B-3 (TodoItem 3모달 분리 + Radix 전환)
     · B-1: ✅ 완료 (commit bb21291)
     · B-2: ✅ 완료 (commit a82ed49)
     · B-3: TodoItem 3모달 분리 + Radix 전환 (최고 위험, 머지 선행 필수) ← 다음 진입
     · 별도 트랙: vaul 모바일 바텀시트는 모바일 우선 최적화 단계까지 보류
  3. 실작업 복귀: 첨부파일 다중 업로드 / 댓글 기능 / 완료 알림 토스트 (모바일 우선 축으로 재판정)
  4. 요청 댓글 질의응답 — 데이터 모델 변경 + 통합 댓글 스레드 (길 B 재설계와 병합 검토)
  5. close-session 인박스 강제 검증 게이트 추가 (인프라, 짬 작업)
- 미해결:
  - md/core/master.md 15~17행 인코딩 깨짐 잔존 (경미)
  - close-session.md ↔ session.md [4] 드리프트 3건 (인박스 등록)
  - src/components/ImageViewer.tsx 루트/common 중복 (경미, 별도 세션)
  - src/components/TodoItem.tsx 상세/편집 모달 내장 (유지)
  - Vercel Hobby 플랜 Preview 자동 SSO 정책 (Deployment Protection Disabled 필요)
  - git author dev@hizzi-board.local 구커밋 잔존 (master 머지 시 일괄 재작성 검토)
- 참고: 프리셋 시스템 단일화 완료. `프리셋` 한 단어로 current 엔트리 실행.
- 검토 후보 (조건부 진입):
  - FullCalendar 미활용 기능 7건 (master 머지 + 디자인 통일 완료 후)
    · 추천 순서: iCal 공휴일 피드 → 드래그 → 리사이즈 → rrule → 주간 뷰 → 검색 → 타임존
    · 각 후보 R4.9+R4.10 순서, 단일 세션 1건씩
    · 3/4/5 는 스키마 변경 동반
  - R4.10 preflight 훅 구현 (N/M PASS 카운트 검증)
  - 토큰 소비 최적화 — progress.md 현재상태/작업로그 분할 (장기 누적 시 재검토)
    · R4.10-가/나 텍스트 반영 후 1~2세션 관찰 → 개선 불충분 시 훅으로 승격
    · 세션 #18에서 1차 분할 실행 (#1~#12 → archive). 추가 분할 또는 훅 승격 판단 보류 중
  - 요청 UI 재설계 (길 B) — Phase 5-C 완료 후 새 방
    · 진입 버튼 카운트 분리(받은 N + 변동 M) / 토스트 다리 / cancel_requested + 통합 댓글 스레드
    · 데이터 모델 변경 동반 → flows + master-schema + todoRequestStore 첨부 필요
    · 병합 메모: 요청자 ↔ 수락자 상호작용 플로우 전반 재검토 포함. 수정·보완 범위 초과 시 재설계로 승격.
  - 일반 메모/할일 완료·삭제 UX 점검 (조건부)
    · 진입 조건: 요청 UI 재설계 후 + 사용자 구체 사례 1~2건 확보
  - Phase 5-C 잔존 정리 (3-pass 완료 후 일괄 안건)
    · tokens.ts 미존재 hex 일괄 신규 토큰 승격 (#17 작업로그 23건 + #16 후속 8종)
    · CalendarEventBadge 프리미티브 추출 (AddEventModal 미리보기 ↔ CalendarGrid renderEventContent 로직 중복)
    · AddEventModal 구분 버튼 색 P2 정합성 확인 (현재 카테고리 태그 아닌 캘린더 이벤트 색 사용)
  - Phase 6 잔여 파일 토큰화 (14파일, 약 465행)
    · 대상: LeaveManager / page.tsx / leave/page.tsx / PostEditModal(잔여) / TodoRequestModal / NoticeArea / PostList / Panel / DeletedTodo / CompletedTodo / login / signup / PostItem / TodoRequestBadge
    · 진입 조건: 머지 완료 후
    · 모바일 리팩터링과 겹치는 파일은 그쪽 세션에 흡수 검토
  - 기능별 색상 일치화 (설계 세션 필요)
    · 목적: 같은 기능은 같은 색으로 통일 → 색만 보고 기능 즉시 인지
    · 대상: patterns.md P2 좌측 띠 + uxui.md 4번 색상 의미 시스템 +
      게시물 모달 / 달력 모달 / 달력 이벤트 / 할일 / 요청 전반
    · 성격: 기계적 치환 아님. 설계 세션 필요
    · 진입 조건: 길 B 시리즈 완료 + 머지 완료 후
    · 선행 작업: Claude가 "어느 기능이 어디서 어떤 색으로 나오는지"
      현황 스캔표 작성 → 오너가 통일 기준 결정 → 토큰 조정

---

## 장기 방향성

> 모든 세션의 작업이 이 축 위에서 움직인다. 단일 세션 작업이 아닌 지속 발전 대상.

- **AI 챗봇 인터페이스 전환** — 할일/달력 세팅 마무리 후, 각 기능을 AI 챗봇으로 구동하는 구조로 전환. 하이브리드 로직(기본 규칙 로직 + AI 판단 로직 병행)으로 토큰 최소화. 입력은 단순하게, 구동은 최적·최고로.
- **모바일 우선 최적화** — 히찌보드·Rehobot 공통 전제. 기본 사용 환경이 모바일, 데스크톱은 보조. 할일/달력/AI 챗봇 다음으로 이어지는 작업 축.

---

## 작업로그 (날짜/세션 단위 append — 삭제 금지)

> 세션 #1~#12 아카이브: md/archive/progress-2026-04-A.md

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

### [2026-04-14] 세션 #18 — session.md 톤 조정 + progress.md archive 분할 + 인박스 정리

- 완료: md/core/session.md 세션 시작 프롬프트 인사말 교체
  · 기존: "수석 개발자 / 글로벌 상용화 / 정확성 우선" 명령형
  · 신규: 진정성 기반 관계성 + "나는 초보야. 너의 전문성으로 나를 이끌어줘" 롤 명시
  · 의도: 톤 자체가 응답 품질에 영향. 관계성 문장 = 토큰 낭비가 아닌 투자
- 완료: md/log/progress.md → md/archive/progress-2026-04-A.md 분할 (commit 71c836b)
  · 세션 #1~#12 (12개) archive 이동, #13~#17만 progress.md 잔존
  · progress.md 310→139줄 (-55%)
  · 컷 지점: #13(FullCalendar 정식 교체)이 현재 Phase 5 시리즈 직전 맥락
- 완료: 인박스 3건 정리
  · 요청 UI 재설계(길 B) → progress 검토 후보
  · 메모/할일 완료·삭제 UX → progress 검토 후보 (조건부)
  · Phase 5-C 잔존 + 중복 로직 → progress 검토 후보 (3-pass 완료 후 일괄)
  · 신규 인박스 1건 등록: close-session 인박스 강제 검증 누락
- 메모: 세션 #17 종료 시 인박스 3건 미정리 누적 → close-session 인박스 0건 강제 검증 부재가 근본 원인
- 교훈
  · Claude.ai 해석 오류: "13까지만 남기고"를 "#13만 남기고"로 잘못 정리 후 자기 보정
  · 인박스 누적은 close-session 강제 게이트 부재가 근본 원인. 다음 세션 구조 개선 필요

### [2026-04-14] 세션 #19 — Phase 5-C 2차/3차 pass + 인프라 정비

Phase 5-C 2차 pass (commit 287c740)
- TodoItem.tsx 토큰화 약 90건 (colors.* 9 + tagColors.* 16 + leftBorderColor 1 = 26종)
- R4.10 3축 PASS — 로컬 5/5 + Preview 5/5 이중 검증

Phase 5-C 3차 pass (commit e23e1a4)
- CreatePost.tsx 토큰화 약 75건 (colors.* 9 + tagColors.* 12 + calendarEvent 1 = 22종)
- R4.10 3축 PASS — 로컬 빌드 + Preview 3/3 검증

Phase 5-C 3-pass 총괄
- 1차 달력(108) + 2차 할일(90) + 3차 게시물(75) = 총 약 273건 토큰화
- 최종 잔존 42건 (SVG 12 + rgba off-state 38 + 기타 6) → 신규 토큰 승격 안건

인프라 정비
- GitHub remote 연결: origin → rehobot-plan/hizzi-Board.git
- Vercel Git 연동 배포 전환 (CLI → GitHub push 자동 트리거)
- Firebase env var Preview 환경 추가 + Deployment Protection Disabled
- git author 재작성: dev@hizzi-board.local → oilpig85@gmail.com / rehobot (--local)
- Preview URL 확보: hizzi-board-git-feat-fullcalendar-poc-rehobot.vercel.app

교훈
- 인프라 블로커 연쇄 시 증상별 분리 진단 (author / env / protection 3단)
- CLI 배포와 Git 연동 배포 혼용 금지. 택 1
- Hobby 플랜 제약 사전 파악 필요 (Preview SSO 강제)

### [2026-04-15] 세션 #20 — Phase 5 좁게 닫기 + 단일 출처 정비

Phase 5 좁게 닫기 (commit e8a90e5)
- tokens.ts 9색 신규 승격 (그룹1 달력UI 3 + 그룹2 완료상태 2 + 그룹3 레이어보조 3 + 그룹4 요청보조 1)
- uxui.md 단일 출처 갱신 — "보조 UI (2026.04.15 추가)" 하위 섹션 신설
- common/ 프리미티브 4파일(CategoryTag/VisibilityTag/RequestTag/leftBorderColor) tokens.ts 연결
- 9색 치환 4파일(CalendarGrid/CalendarModals/CreatePost/TodoItem) 총 15건
- PostEditModal 외과 수술 2건 (divider/altRowBg)

R4.10 3축
- 가동: 빌드 PASS, 317kB 직전 대비 ±0, 에러·경고 0
- 기능: 9색 + 프리미티브 4파일 매핑표 전건 일치
- 디자인: 5/5 PASS, 로컬 + Preview 이중 확인

잔존 현황
- Phase 5 범위 내 치환 불가: SVG stroke 13 + rgba off-state 22 + rgba 모달헤더 6 + #fff 이벤트텍스트 1 = 42건
- Phase 6 대상: 미토큰화 14파일 약 465행 → 검토 후보 이월

Phase 5 시리즈 완료 판정
- 5-A 인프라 → 5-B 프리미티브 → 5-C 3-pass → 5-D 좁게 닫기 전체 PASS

교훈
- 좁게 닫기가 정답이었음. 15파일 욕심 내지 않고 주요 3파일 + 프리미티브 + 신규 토큰만 처리해 단일 세션 마무리
- 스캔 단계에서 "잔존 42건" 기록이 실측과 차이 → progress.md 숫자 관리는 실측 기준 의무
- 프리미티브 4파일이 tokens.ts를 import하지 않던 구조적 이슈는 Phase 5-B의 미완성분이었음. 5-D에서 해소

프리셋 동기화 이슈 조치
- 증상: _staging 구버전 잔존 → 세션 진입 시 구 progress.md 첨부
- 원인: close-session 단계 8이 presets.json 갱신만 하고 프리셋.ps1 실행 누락
- 조치: close-session.md + session.md [4] 문구 보강 (프리셋 실행 체크리스트)
- 스크립트 자체 결함 없음 (_staging 비우기 + 복사 + 에러 핸들링 정상)
- 교훈: 증상 3종(잔존/구버전/빈파일) 공통 뿌리 = 절차 누락. 스크립트 결함 아님

### [2026-04-15] 세션 #21 — 수정 팝업 3종 재설계 1단계 + 모달 인프라 R4.9 조사

현황 매트릭스
- 메모/할일/요청 3종 매트릭스 작성 (progress.md "게시물" 표기 오류 → 3종으로 정리)
- 발견: 메모(PostEditModal) ↔ 할일(TodoItem.showDetailModal) P8 코드 90% 중복
- 발견: TodoItem.tsx 580+ 라인, 2모달 내장 상태
- 발견: 모달 인프라 직접구현 — focus trap·body scroll lock 없음, ESC 처리 3가지 패턴 파편화
- 발견: PostEditModal 토큰화 미완 (Phase 5-C 3차 pass 대상에서 누락)

R4.9 라이브러리 조사 (Claude Code 수행)
- 후보: @radix-ui/react-dialog 1.1.15 + vaul 1.1.2
- 8개 필수 항목 매핑: 자동 5 (ESC/오버레이/Portal/focus trap/scroll lock/autoFocus)
  + 옵션 1 (다중 모달 중첩) + 직접 2 (z-index/우선순위)
- 디자인 토큰 호환성 6/6 PASS (Headless 특성)
- 마이그레이션 비용: PostEditModal ~40라인 / TodoItem ~120라인 / 공통 추출 ~200라인
- 미확인 2건: 번들 사이즈 실측 (bundlephobia 502) / 최신 배포일 정확치
- 결론: (A) Radix 도입 권장. vaul은 모바일 전환 시점까지 보류

길 B 로드맵 확정 (3세션 분할)
- B-1: PostEditModal POC (단일 파일, 다음 세션 진입 예정)
- B-2: CreatePost 전환 + useEscClose 의존 일괄 정리
- B-3: TodoItem 3모달 분리 + Radix 전환 (최고 위험)
- 별도 트랙: 요청 UI 재설계 (flows + master-schema) / vaul 모바일

R4.10 3축 (조사 세션)
- 가동: 코드 변경 0, 검증 대상 없음
- 기능: 8개 필수 항목 매핑 전건 채움
- 디자인: 토큰 호환성 6/6 PASS

교훈
- progress.md "게시물" 표기 오류 → 메모/할일/요청 3종으로 단일화
- Claude Code 보고서가 사전 계획보다 안전한 진입 순서 제시 → 수용 (TodoItem 분리는 별도 세션)
- 길 B 단일 세션 욕심 → 3세션 분할이 정답 (#20 "좁게 닫기" 교훈 적용)
- 미확인 플래그 2건 정직 표기 → R4.9/R4.10 정신 작동 확인

### [2026-04-15] 세션 #22 — PostEditModal Radix Dialog 전환 + 토큰화 잔존 정리 (길 B-1)

길 B-1 POC (commit bb21291)
- @radix-ui/react-dialog 1.1.15 + @radix-ui/react-visually-hidden 도입
- PostEditModal.tsx 직접 작성 ESC useEffect 제거
- 모달 껍데기 Dialog.Root / Portal / Overlay / Content 교체
- VisuallyHidden Dialog.Title / Dialog.Description 추가 (Radix 접근성)
- 토큰화 잔존 정리: colors 9종 + tagColors 6종 + zIndex 2종 (~70줄)
- 호출부 PostItem.tsx:186 1곳, props 변경 없음

R4.10 3축
- 가동: 빌드 PASS, 328kB (+11kB Radix 번들)
- 기능: 3/3 PASS (오픈/ESC/오버레이) + 3건 코드 무변경
- 디자인: diff 0 — 시각 변화 없음 (POC 목표 달성)

오너 검증
- Vercel Preview 자동 배포 PASS
- 메모 카드 진입 → 모달 동작 이상 없음 확인

잔존
- hex 19건 (rgba off-state + SVG — 기존 패턴과 동일, 신규 토큰 승격 안건으로 묶음)
- 길 B-2: CreatePost 전환 + useEscClose 의존 일괄 정리 (다음 세션)
- 길 B-3: TodoItem 3모달 분리 + Radix 전환 (단일 세션 전체)

교훈
- "최소 범위" 추천이 정답이었음. ModalShell 추출은 메모/할일 양쪽 본 후 B-3 시점에 하는 게 정확
- Radix 도입으로 ESC·focus trap·scroll lock·Portal 자동 처리 — 직접구현 코드 영구 제거 시작점

### [2026-04-15] 세션 #23 — 길 B-2 CreatePost Radix 전환 + 에러 페이지 색상 교체

길 B-2 (commit a82ed49)
- CreatePost.tsx Radix Dialog 전환 (15 ins / 8 del)
- useEscClose CreatePost에서 제거 (잔존 4파일: Calendar/ImageViewer/LeaveManager/Panel — B-3 이후)
- 번들 328kB ±0 (Radix B-1과 공유)
- R4.10 3축 PASS, Preview 검증 PASS

에러 페이지 색상 교체 (commit c8de177)
- error.tsx + Panel.tsx 2파일 2건 일괄 교체
- #81D8D0 → #C17B6B (accent), #6BC4BB → #A86855 (accent hover)
- Panel 버튼 정체: 카테고리 추가 모달 "추가" 버튼 (정찰로 추가 발견)
- 빌드 328kB ±0, R4.10 3축 PASS

교훈
- 정찰 단계 분리가 정답. progress.md "error.tsx만"으로 적혀있던 항목에서 Panel.tsx 동일 색 1건 추가 발견
- 같은 색·같은 의도면 일괄 처리. progress.md 표기 좁게 적혀 있어도 정찰 결과 우선
- hover 톤 #A86855는 추측값. uxui.md hover 톤 정의 부재 — 향후 토큰 승격 안건 후보
