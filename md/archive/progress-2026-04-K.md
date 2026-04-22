# 히찌보드 — 작업 진행 기록 (세션 #50 아카이브)

### [2026-04-21] 세션 #50 — Phase 4-A 달력 필터 완결 + 후순위 후보 3건 추가

Phase: 4-A 탐색 · 설계 보정 · 구현 · 검증 · 배포 / 후순위 후보 #5~#7 신설
브랜치: master
커밋 수: 약 6건 (c7a9db7 → 909d46d → c024faa → db40a95 → 4305764 → ad9bc1e)

배경:
- 세션 #49 완료 상태에서 Phase 4-A 진입 (다음 세션 1순위)
- 구현 전 탐색 단계에서 calendar-filter.md §2.2·§7.5·§11 원안이 실데이터와 어긋나는 지점 2건 발견 — taskType 필드는 Calendar UI 저장 경로에 아예 저장되지 않고 요청 연쇄 경로만 저장, 요청 이벤트는 taskType='work' + requestId + color #993556 3종을 동시 보유해 "업무" 카테고리와 중복 매칭 가능
- 설계 문서 보정(6건 str_replace) → 구현 순으로 진행, 한 세션에 설계·구현 모두 완결
- 구현 종료 후 오너가 "이것까지 되네?" 감각 확장 방향 제시 → 자연어 빠른 추가 · 알림 센터 · 요청 타임라인 3건 합의, 후순위 후보에 등록

주요 변경:

1. calendar-filter.md §2.2·§7.5·§11 보정 (탐색 결과 반영, c7a9db7)
   · §2.2 3 카테고리 모두 requestId 배타 규칙 + taskType 부재 시 색상 계열 fallback 구조로 재정의
   · §2.2 말미 "확인 필요" 단락 제거 (탐색으로 수렴)
   · §7.5 제목 "2026.04.08 이전 calendarEvents의 taskType 누락" → "calendarEvents.taskType 부재 처리"로 교체, 본문이 Calendar UI 저장 경로 누락 / 요청 경로만 저장 / isPersonal 재사용 명시
   · §11.1 "동일 이벤트 중복 렌더 가능성" 경고 삭제 (물리 중복 없음 + A안 배타 규칙으로 해소), §11.2·§11.3 번호 당김

2. Phase 4-A 구현 — 3경계 신설 + 홈 통합 (909d46d)
   · src/lib/calendar-helpers.ts에 filterCalendarInputs 순수 유틸 추가 — isPersonal 재사용, 외부 의존 없음
   · src/hooks/useCalendarFilter.ts 신설 — localStorage read/write 캡슐화, scope별 키 분리, 기본값 계산
   · src/components/calendar/CalendarFilter.tsx 신설 — 토글 버튼 "필터 ▾"/"필터 • N", 드롭다운 (담당자 7 체크 + 카테고리 3 체크 + 전원/전체 해제/초기화 보조 3액션), 외부 클릭·ESC 닫힘, z-index 100, 모바일 2열 그리드
   · Calendar.tsx에 defaultScope prop 추가, 필터 상태 보유, filteredEvents 전달 — 홈 /는 defaultScope='team' 고정

3. 필터 액션 버튼 UX 보정 (db40a95)
   · 전원/전체 해제/초기화 3 버튼 padding 확대 — 클릭 안정성·모바일 접근성

4. E2E 시나리오 보강 (4305764 + 일부 후속)
   · beforeEach users 로드 대기 강화
   · 시나리오 8 (기존 동작 회귀)은 구체 클릭 플로우 대신 렌더 회귀 중심으로 축소
   · neighbor specs (R-2 · R-3) 12/12 회귀 통과 — §9 완료 기준 8항 충족

5. progress.md 후순위 후보 #5·#6·#7 추가 (ad9bc1e)
   · #5 자연어 빠른 추가 — chrono-node 검토 선행, 멘션 파싱 포함, quick-add.md 신설 예정
   · #6 알림 센터 — 종 아이콘 드롭다운, seenAt 읽음 관리, 외부 채널(카톡 등) 제외, notification-center.md 신설 예정
   · #7 요청 타임라인 — RequestDetailPopup 내부 세로 타임라인, 신규 필드 없음, request-timeline.md 신설 예정
   · 구현 순서: 5 → 6 → 7 (5는 원래 계획 · 6은 5의 출력 쌍 · 7은 6의 이벤트 모델 재활용)
   · 설계 문서는 착수 직전 세션에 신설 (선행 작성 시 생각 변경 재작업 리스크 회피)

산출물:
- 신규 컴포넌트: CalendarFilter
- 신규 훅: useCalendarFilter
- 신규 유틸: filterCalendarInputs (calendar-helpers.ts 확장)
- 신규 E2E: calendar-filter-4a (8 시나리오)
- 신규 단위 테스트: filterCalendarInputs 관련 8 케이스 (§2.2 배타 + authorName fallback + 요청 양방향)
- 수정 MD: calendar-filter.md (§2.2·§7.5·§11 보정) / progress.md (후순위 후보 3건 추가)

교훈:
- 설계 문서 원안이 실데이터와 어긋나는 사례 — calendar-filter.md §2.2의 "taskType 필드 부재 시 색상 업무 계열"은 taskType이 보통 있을 것을 암묵 전제했는데 실제 Calendar UI 저장 경로는 taskType을 아예 저장하지 않음. 탐색 단계에서 Firestore 실제 저장 필드를 대조하는 절차가 설계 문서 품질을 보장함. 세션 #49가 탐색을 4-A 진입 전으로 미뤘던 것이 결과적으로 옳았음
- 1-4 코드 리뷰가 Codex slash command 부재로 "자체 구조 검증(타입 체크 + 빌드 + 단위 16 PASS)"으로 대체됨. 3축 PASS(가동·기능·디자인) 중 디자인 축이 단위 테스트로는 완전히 커버되지 않음 — 다음 세션 1순위 시작 전 Codex 가용성 확인 필요(또는 /codex:rescue read-only 모드 사용 가능 여부 재점검)
- "이것까지 되네?" 방향 대화가 구현 세션 말미에 나와도, 진행 중 작업을 끊지 않고 후순위 후보에 한 블록으로 적재하는 방식이 흐름을 끊지 않음 — 기획 대화와 실행 공정의 분리가 유지됨
- 알림을 "기능"이 아니라 "채널"로 구분한 판단이 방향 설정 정확도를 올림 — 카톡/텔레그램 같은 외부 채널을 결정하기 전에 인앱 알림 센터(#6)로 seenAt 모델을 먼저 정리하는 순서가 확정됨

다음 세션 1순위: Phase 4-B MY DESK 달력 탭 활성화 + scope="me" 기본값 (md/plan/designs/calendar-filter.md §9)
