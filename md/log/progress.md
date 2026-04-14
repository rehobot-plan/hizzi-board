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

### [2026-04-14] 세션 #18 — session.md 톤 조정 + progress.md archive 분할

- 완료: md/core/session.md 세션 시작 프롬프트 인사말 교체 — 진정성 기반 관계성 + 초보 롤 명시
- 완료: md/log/progress.md → md/archive/progress-2026-04-A.md 분할 — #1~#12 archive, #13~#17 잔존, 310→139줄 (-55%)
- 메모: 검토 후보 "토큰 소비 최적화" 1차 실행
- 교훈: Claude.ai 해석 오류 — 모호한 지시는 명령 블록 직전 한 줄 재확인이 안전
