# 히찌보드 — 작업 진행 기록 (세션 #49 아카이브)

### [2026-04-21] 세션 #49 — Phase R 시리즈 완결 + 달력 필터 설계 문서 신설

Phase: R-3 / R-4 / useSidebarBadges 훅 추출 / mydesk §1.1 / calendar-filter 설계 / mydesk §9·§11 정리 / 후순위 후보 추가
브랜치: master
커밋 수: 약 13건

배경:
- 세션 #48 완료 상태에서 Phase R-3 진입 (다음 세션 1순위)
- R-3 완료 후 오너 요청으로 R-4 연이어 진행, Phase R 시리즈 완결
- R-3 공장 보고에서 "useSidebarBadges 훅 추출 후속 부채" 자진 등록 → 부채 누적 방지를 위해 같은 세션에서 해소
- 훅 추출 완료 후 "보낸" 뱃지 기준 불일치 발견 (훅 명세 pending만 vs mydesk.md §1.1 원문 pending 또는 accepted) → §1.1 수정으로 3뱃지 배타성 확정
- 다음 Phase 4-A 진입 전 탐색 결과 "CalendarFilter 공통 추출"이 실질 "필터 신규 도입"임이 드러나 설계 대화 전환, 독립 설계 문서 신설
- 오너가 달력 시각 이슈(토큰 불일치 + 텍스트 대비) 제기 → 후순위 후보로 등록

주요 변경:

1. Phase R-3 오늘 탭 4카드 재편 (bc31ebd + e30b827 + 36112da)
   · useTodaySummary counts 재편 (unseenRequests·leaveRemaining 제거 → receivedPending·sentPending·inProgress·overdue 추가)
   · /mydesk/today page.tsx 4카드 [할일/일정/요청확장/overdue]
   · 요청 카드 메인 K + 보조 "보낸 대기 N · 진행 중 M"
   · overdue #A32D2D (uxui c-red 600), 카드 클릭 점프 /mydesk/todo
   · mydesk-today-r3 E2E 8 시나리오

2. Phase R-4 TabBar 5탭 반영 (cb6ccd6 + baaabfd)
   · TabBar 4→5탭 (오늘/요청/할일/메모/달력 시급도 순)
   · overflowX auto + scrollIntoView({inline:'center'}) 활성 탭 자동 뷰포트 진입
   · /mydesk/request page.tsx 무변경 (R-1 RequestView 렌더 상태 유지)
   · Header는 H-1 재조정 이후 고정문구 두 경로 동일 노출 — 명세 "Header 제목 MY DESK"는 당시 시점 기준
   · mydesk-tabbar-r4 E2E 6 시나리오 + H-2 회귀 3/3 유지

3. useSidebarBadges 훅 추출 (d7ab9c8 + a68197f)
   · src/lib/sidebarBadges.ts 순수 함수 computeBadges + RequestForBadges 구조적 타입 (firebase/zustand 의존 분리)
   · src/hooks/useSidebarBadges.ts zustand 구독 훅 래핑
   · Sidebar.tsx inline 3 filter 제거 → 훅 사용
   · useTodaySummary.ts inline 3 filter 제거 → 훅 구독
   · Vitest 단위 5 케이스 (receivedPending / sentPending / accepted 제외 검증 / inProgress / email 빈값)
   · E2E 회귀: R-3 8/8 + R-2 4/4

4. mydesk.md §1.1 "보낸" 뱃지 정의 수정 (f2713a5)
   · 훅 추출 과정에서 공장이 sentPending = pending만으로 통일(기존 Sidebar R-2는 pending OR accepted 합산)
   · §1.1 원문 "pending 또는 accepted"를 "pending"으로 수정해 3뱃지 배타성 확정
   · 훅 구현 · 테스트 · 명세 세 축 정합

5. calendar-filter.md 설계 문서 신설
   · §0~§11 12섹션, Phase 4-A 진입 전 설계 합의 기록
   · 필터 축: A 담당자(6+admin 다중) + B 카테고리(업무/요청/개인, 연차는 개인 흡수)
   · 기본값: team=전원+전체, me=나만+전체
   · 지속성: localStorage scope별 키 분리 (hizzi.calendar.filter.{team|me})
   · UI: 토글 버튼 + 드롭다운 패널 (외부 클릭·ESC 닫힘, 체크박스 조작 중 유지)
   · 컴포넌트: CalendarContainer 내부 CalendarFilter 신규 + useCalendarFilter 훅 + filterCalendarInputs 유틸
   · 엣지: 전체 해제 허용 (할일 탭과 다른 정책), 저장 email 무효 시 조용히 무시
   · "CalendarFilter 공통 추출" 기존 표현은 실질 "신규 도입"임을 §0에 명시

6. mydesk.md §9·§11 4-A/4-B 가드 정리
   · §9 "달력 대상 체크박스 전체/나만 2개 간소화" 폐기 → "담당자 체크박스 2열 그리드"로 기능 유지 방향 전환
   · §11 4-A/4-B 행을 calendar-filter.md 참조로 수렴, 주요 파일 구체화
   · §11 Phase 가드에 4-A/4-B 완료 기준 2행 추가 (상세는 calendar-filter.md 참조)

7. progress.md 후순위 후보 #4 추가
   · 달력 시각 체계 정비 (중) — 토큰 불일치 + 텍스트 대비
   · 스크린샷 근거: 이벤트 블록이 uxui.md §4 범례 8종과 매치 안 되고 모두 보라 계열로 뭉쳐 보임
   · 전제: Phase 4-A/4-B 완료 후 착수

산출물:
- 신규 유틸: sidebarBadges (순수 함수)
- 신규 훅: useSidebarBadges
- 신규 설계 문서: calendar-filter.md
- 신규 E2E: mydesk-today-r3 (8), mydesk-tabbar-r4 (6)
- 신규 단위 테스트: useSidebarBadges 5 케이스
- 수정 MD: progress.md / mydesk.md (2회) / calendar-filter.md (신규)

교훈:
- 공장 보고의 "후속 부채" 자진 기재는 부채 누적이 아니라 즉시 처리 신호로 활용 가능 — 같은 세션에서 해소하면 MEMORY·master-debt 증발 위험 제거
- 훅 시그니처를 설계 블록에 적을 때 기존 명세 문서 원문 확인 필수 — sentPending 정의 불일치는 Claude.ai가 §1.1 원문을 옮기지 않은 결과
- "리팩터링" 같은 기존 용어가 실질과 다를 수 있음 — 4-A "CalendarFilter 공통 추출"은 신규 도입의 실체였고, 탐색 보고 없이 블록 썼다면 공장이 "기존 필터가 뭐냐" 질의로 정체됐을 것. 탐색 선행이 설계 단계의 1차 점검 역할
- 시각 이슈(달력 범례 매치)는 사용자 관찰이 코드 리뷰로는 발견 불가능한 유형 — 오너 스크린샷이 입력 경로가 됐음. 이런 이슈의 등록 경로(후순위 후보)가 별도로 필요함을 재확인

다음 세션 1순위: Phase 4-A 달력 필터 신규 도입 + 홈 적용 (md/plan/designs/calendar-filter.md §9)
