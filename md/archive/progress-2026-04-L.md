# 히찌보드 — 작업 진행 기록 (세션 #51 아카이브)

### [2026-04-21] 세션 #51 — Phase 4-B + progress 구조 정리 + 달력 시각 설계

Phase: 4-B MY DESK 달력 / progress 이관·축약 / 미해결 7→2 / ImageViewer 잔존 삭제 / calendar-visual 설계 신설
브랜치: master
커밋 수: 약 6건 (53ffa9a → d05d5b1 → a04f714 → [A+B cleanup] → 4668267 → 7c11a1b)

배경:
- 세션 #50 완료 상태에서 Phase 4-B 진입 (다음 세션 1순위)
- 4-B 완료 후 오너가 progress.md 비대화 관찰 제기 → 세션 시작 시 context 주입 실패 원인으로 판명
- 정리·설계까지 세션 내 연쇄 처리, #4 달력 시각 체계 정비 착수 준비 상태로 마감

주요 변경:

1. Phase 4-B MY DESK 달력 탭 활성화 (53ffa9a + d05d5b1 + a04f714)
   · /mydesk/calendar placeholder 제거 + Calendar 렌더 defaultScope='me'
   · calendar-filter.md §9 Phase 4-B 완료 기준 5항 전부 PASS
   · TabBar 5탭 이미 반영(R-4) + 4-A scope 인프라 완비라 단일 파일 교체 단위 완결

2. progress.md 정리 A+B — 세션 #48 아카이브 + 후순위 후보 #4~#7 축약
   · md/archive/progress-2026-04-I.md 신설 (세션 #48 원문 보존)
   · 후순위 후보 #4~#7 상세 서술 골자만 남김 — #5·#6·#7은 "설계 문서 착수 직전 신설" 원칙이 상세 위임의 근거
   · 259줄 → 194줄 (−65줄)

3. 미해결 섹션 재점검 — 7건 → 2건 (4668267)
   · Code 조사 6건 + Claude.ai 텍스트 대조 1건 종합 판단
   · 유지: Q1 users ID 체계 · Q6 filter-branch refs (그룹 E 일정)
   · 제거: Q2 Panel 단위 테스트(후순위 #3 중복) · Q3 master.md 인코딩(현재 깨짐 없음) · Q5 Vercel Production Branch(해결 상태) · Q7 Preview SSO(Preview 실사용 없음)
   · 해결: Q4 src/components/ImageViewer.tsx 잔존 파일 삭제 (import 0건)
   · Q6 문구에 예정 시점(2026-04-22 이후 그룹 E) 추가해 정확화

4. calendar-visual.md 설계 문서 신설 (7c11a1b)
   · 후순위 후보 #4 구현 직전 설계 합의 기록 (272줄, 11.8KB)
   · 3블록 분해: semantic 분기 교체(#1) → tokens.ts 단일 출처 통합(#2) → 시각 튜닝(#3)
   · 카테고리 우선순위 확정: source='leave' → requestId → taskType → 업무 (배타)
   · 튜닝 값: font 11px · padding 2px 4px · alpha 0.25 · borderLeft 3px · lineHeight 1.3
   · 3 보조 표면(CalendarModals 칩 · useTodaySummary 띠·뱃지 · CalendarGrid 범례) 토큰 참조 통일
   · Firestore legacy color 마이그레이션 불필요 명시 (의미 필드 기반 전환 후 color는 presentation-only)
   · overdue 뱃지는 calendarEvent 토큰과 분리 경로 (상태 뱃지 vs 이벤트 타입)

5. 후순위 후보 #4 문구 갱신 (7c11a1b)
   · 전제 충족 표시 + 설계 문서 경로 참조

산출물:
- 신규 설계 문서: md/plan/designs/calendar-visual.md
- 신규 아카이브: md/archive/progress-2026-04-I.md (세션 #48)
- 삭제 파일: src/components/ImageViewer.tsx
- 수정 MD: progress.md (3회 — A+B 축약 / 미해결 정리 / 후순위 후보 #4 갱신)
- 수정 코드: src/app/(main)/mydesk/calendar/page.tsx (Phase 4-B)
- E2E: 신규 없음 (4-B가 scope prop만 교체라 기존 필터 회귀로 커버)

교훈:
- progress.md 비대화가 세션 시작 context 주입 실패로 이어지는 사례 관찰. "설계 문서는 착수 직전 신설" 원칙이 progress.md 슬림을 간접 보장하는 구조적 장치 — 원칙이 흔들리면 상위 문서 비대화로 주입 실패가 재발할 수 있음
- 오너 "이미지로 보여주면 결정에 도움" 요청이 설계 단계 품질 상승을 유도. 수치·토큰만 나열된 설계와 비교해 시각 mockup이 "보라 뭉침은 정비로 완전 해소되지 않는다"는 사실을 오너·Claude.ai 동시 각인 — 시각 관련 정비는 mockup 선행 권고
- 오너 질문 한 번("마이데스크도 이 색상으로 바뀌나?")이 설계 범위를 확장시킨 사례 — 단일 표면 정비 제안이 3 보조 표면 통합으로 확장. Claude.ai 초기 제안에서 보조 표면 맵핑 누락 패턴 주의
- 미해결 섹션은 "장기 부채"와 "과거 사건 기록"이 섞이면 실효성 저하 — 주기적 재점검이 필요한 섹션

다음 세션 1순위: 달력 시각 체계 정비 블록 1 — semantic 분기 교체 (md/plan/designs/calendar-visual.md §2)
