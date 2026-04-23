# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-23 세션 #62 (드리프트 진단 · 설계 MD 4종 복구 · 세션 #61 사실 정정 · MEMORY 자기 위반 박제 · 산출물 규약 명문화 · Code 교차 검증 첫 사례)
- 작업 브랜치: master (로컬·원격 f43f572 동기 · backup/flatten-2026-04-22 = 14ab3e7 보존)
- 프로덕션: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK · 세션 #62 코드 변경 없음 · 배포 없음
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW · 기존 설정 유지
- 다음 세션 1순위: session.md 단계 5·11 보강 (세션 #61 drift 사고 재발 방지 구조 층 추가)
  · 범위: 단계 5 "수정 MD 목록은 실행 완료분만 포함" 조항 · 단계 11 "프리셋 복사 트리거 전 원본 md/ mtime·말미 확인" 조항 · §2 "제약" 섹션 연계 2줄
  · 영향 파일: md/core/session.md
  · 선행 문서: MEMORY #61-c · #61-f · #62-a · #62-d (세션 #62 박제 원칙)
- 후순위 후보:
  - 홈 상단 채팅 기반 입력 착수 (A안 인라인 확장 · main-ux.md §6 · P9 · U14 · uxui §4 홈 채팅 입력 토큰 · 세션 #62 선행 문서 복구 완료)
    · 범위: 시나리오 1~3 완전 구현 · 시나리오 4(복수 항목 B 승격) placeholder UI 골격
    · 영향 파일: ChatInput.tsx · ChatExpand.tsx · AiBadge.tsx 신규 · chatInputStore.ts 신규 · parseIntent.ts 신규 · src/app/(main)/page.tsx 상단 배치
  - 블록 ③-B: 3층 탭바 메뉴 "기록" 진입점 + RecordModal 활용 + flows.md FLOW 1 복구 cascade 정교화
  - 메인 UX 블록 ④(FAB + CreatePost 재배치) · 블록 ⑤(달력 피어 탭)
  - 세션 #55 기준 1~6 · #56 기준 5 · #58 기준 7
- 선처리 큐: 기존 유지 (#5 tabbar-sticky.spec 간헐 timeout · #7 Vercel Preview env 불완전)
- 미해결:
  - 실 Chrome ⋯ handle 클릭 scroll jump 근본 원인 미규명 (능동 scroll + 5층 방어로 덮음 · master-debt #11)
  - DevTools Performance 녹화 워크플로우 미수립 (master-debt #12)
  - post-request cascade 실패 시 divergence 가능성 — master-debt #8
  - serviceAccount.json git history 잔존 — master-debt #10

---

## 작업로그 (날짜/세션 단위 append — 삭제 금지)

> 세션 #1~#12 아카이브: md/archive/progress-2026-04-A.md
> 세션 #13~#23 아카이브: md/archive/progress-2026-04-B.md
> 세션 #24~#32 아카이브: md/archive/progress-2026-04-C.md
> 세션 #33~#34 아카이브: md/archive/progress-2026-04-D.md
> 세션 #35~#42 아카이브: md/archive/progress-2026-04-E.md
> 세션 #43~#46 아카이브: md/archive/progress-2026-04-F.md 및 md/archive/progress-2026-04-G.md
> 세션 #47 아카이브: md/archive/progress-2026-04-H.md
> 세션 #48 아카이브: md/archive/progress-2026-04-I.md
> 세션 #49 아카이브: md/archive/progress-2026-04-J.md
> 세션 #50 아카이브: md/archive/progress-2026-04-K.md
> 세션 #51 아카이브: md/archive/progress-2026-04-L.md
> 세션 #52 아카이브: md/archive/progress-2026-04-M.md
> 세션 #53 아카이브: md/archive/progress-2026-04-N.md
> 세션 #54~#56 아카이브: md/archive/progress-2026-04-O.md
> 세션 #57~#58 아카이브: md/archive/progress-2026-04-P.md
> 세션 #59 아카이브: md/archive/progress-2026-04-Q.md

### [2026-04-22] 세션 #60 — 연차 조사 필터 해소 · 블록 ③-A 배포 · 후속 핫픽스 4건 · ⋯ 펼쳐보기 디자인 회귀 박제

Phase: 연차 내역-달력 불일치 조사 (필터 문제) / 블록 ③-A §2.5 CompletedTodo 재편 + §2.3 2층 복구 링크 + RecordModal 2탭 신규 / 배포 후 발견 회귀 4건 핫픽스 / ⋯ 펼쳐보기 UI 디자인 Claude.ai 재설계 이관
브랜치: master (로컬·원격 ddc8ef3 동기)
커밋 수: 7건 (9dec086·9760bd0·0639f97·4ea5cd8·a51f252·bfb1ebc·ddc8ef3)

주요 진행:

1. 연차 내역-달력 불일치 조사 (코드 무변경 종결)
   · 재현 케이스: 우희훈(heehun96) 2026-04-08~09 2일 연차
   · Admin SDK 스크립트(scripts/diagnose-leave-heehun.js, 세션 마감 시 삭제)로 Firestore 실측: leaveSettings.manualUsedDays=13일 + leaveEvents 2건(2026-04-08·09, userEmail 완전 포함) 정상 저장 확인
   · 초기 가설 "manualUsedDays는 합계에만 반영, leaveEvents만 달력 렌더" 기각 → 실제 원인은 **달력 필터 상태**. 오너가 필터 재확인 → "이제 보여!"
   · MEMORY 연동: "버그 조사 전 Firestore payload 교차 대조 + 실제 UI 필터 상태 점검 선행"

2. 블록 ③-A 구현 + 배포 (커밋 9dec086)
   · 신규 RecordModal.tsx (할일 2탭 완료/휴지통 · 메모 단일 탭 · windowFilter prop · useEscClose + 외부 클릭 · Portal · M1 헤더 패턴)
   · TodoList.tsx — CompletedTodo·DeletedTodo import 제거 + 리스트 하단 inline "최근 완료/삭제 N개 →" 링크 + RecordModal 호출
   · PostList.tsx — inline 삭제 섹션(~80줄) 제거 + activeCategory='메모'일 때 하단 삭제 링크 + RecordModal 호출
   · postStore.ts — uncompletePost/restorePost 시그니처 Promise<boolean>로 변경(Codex P1 가드)
   · 삭제: CompletedTodo.tsx(216줄) · DeletedTodo.tsx(184줄)
   · 1-4 Codex 리뷰: 3축 중 가동 P3(as any, 범위 밖) · 기능 P1(복구 cascade 가드 필요) + P2(TodoList 소스 불일치) + P2(updatePost catch 범위 밖) · 디자인 PASS
   · P1/P2 가드 적용: (a) RecordModal restore에서 post 상태 변경 성공 확인 후에만 reactivateRequest (b) TodoList scopedPosts 단일 소스 파생
   · 1-5 E2E: panel-height-s1.spec 3/3 PASS
   · 1-6 배포: CLI `vercel --prod` · hizzi-board-67tjsl1jx Ready 56s · alias 교체 완료

3. 후속 핫픽스 4건 (배포 당일 오너 피드백)
   · **hover 휴지통 웹 한정 부활** (커밋 9760bd0) — 피드백 "웹에서 삭제 어떻게 해?" · 스와이프 발견성 부재 해소. TodoItem·PostItem 우상단 absolute 버튼 · isHovered 조건. main-ux.md §2.2 "완전 제거" 원칙 후퇴(다음 세션 before/after 검수 후 반영 예정)
   · **아이콘 크기 12→16** (커밋 0639f97) — 피드백 "너무 작아"
   · **Panel overflow hidden + minWidth 0** (커밋 4ea5cd8) — 피드백 "큰 게시물이 옆 패널 덮음" · 세션 #55 variant prop 도입 시 누락된 층 복구
   · **⋯ 펼쳐보기 토글** (커밋 a51f252 → bfb1ebc → ddc8ef3) — 피드백 "스크롤 대신 점 3개 펼치기 어때?" · 3단계 반복:
     (a) 하단 flex item 배치 + hasOverflow 감지 → 버튼 가려짐·감지 실패
     (b) 조건 없이 항상 노출 → 빈 패널에도 노출되어 이상
     (c) 탭바 우측 이동 + posts.some 조건 → **디자인 실패** · 오너 "디자인 1도 생각 안 하고 기능만 박았다 · AI 쪽에서 진행"

4. auto-deploy 파이프라인 실측 (master-debt #9 partial)
   · hover 휴지통 초기 배포 시 push 후 auto-deploy 관측 · `i42koin1y` 자동 빌드 Ready 51s · Deploy Hook + Git 재연결 정상 작동 확인
   · 오너 피드백 "왜 auto-deploy 기다려? CLI로 바로 하면 즉시 확인되잖아" → 이후 핫픽스는 CLI `vercel --prod` 기본

검증:
- npm run build PASS (각 변경 후 매번)
- Vercel Production CLI 배포 5회 모두 Ready
- 1-5 E2E panel-height smoke 3/3 PASS
- curl 200 OK · alias 교체 매번 확인
- 오너 실사용 검증: 연차 조사 ("필터 문제 확정") / 블록 ③-A ("기능 정상") / hover 휴지통 ("보여!") / overflow hidden ("덮어쓰기 해소") / ⋯ 펼쳐보기 ("디자인 실패 — AI 이관")

산출물:
- 수정 코드: Panel.tsx · TodoList.tsx · PostList.tsx · TodoItem.tsx · PostItem.tsx · postStore.ts
- 신규 코드: RecordModal.tsx
- 삭제 코드: CompletedTodo.tsx · DeletedTodo.tsx · scripts/diagnose-leave-heehun.js (일회성)
- 수정 MD: 본 progress 종료 단계에서 일괄 반영 + md/core/master-debt.md(#9 실측 업데이트) + .harness/MEMORY.md(세션 #60 3건) + md-presets/presets.json + md/archive/progress-2026-04-P.md(신규, #57·#58 이관)

교훈:
- 블록 ② 실사용 검증 1~2일 선행 조건을 무시하고 블록 ③-A 착수 → 배포 당일 오너 피드백 5건 누적 → 후속 핫픽스 4건 · 설계 MD 3개 수정 대기 · 디자인 회귀 1건 다음 세션 이관. 설계 문서의 선행 조건·검증 기간은 "여유 있으면 지키는 권고"가 아니라 "다음 블록 성공의 전제". 지금부터는 PR gate 수준으로 대우 (MEMORY #60)
- UI 배치·미감 판단은 Code 1-4 Codex 리뷰로 catch되지 않음. Codex 디자인 축은 "토큰·transition·z-index·공통 컴포넌트 준수" 같은 표준 위반만 감지 · "이 위치가 미감상 적절한가"는 Claude.ai 기획 검수 영역. 오너 판정 "AI 쪽에서 진행"이 역할 분담 자연 귀속 (MEMORY #60)
- CSS flex shrink + overflow hidden 근본 원인 디버깅은 코드 리뷰만으로 한계. Playwright MCP로 브라우저 computed styles 실측 워크플로우 필요했으나 로그인 크리덴셜 미확보로 blocked → 회피책(탭바 이동) 선택 후 디자인 회귀. 테스트 전용 panel 계정 셋업 + 실측 루틴 정형화가 다음 작업 항목 (MEMORY #60)
- 블록 ③-A의 "3층 탭바 메뉴 기록 진입점" 범위는 블록 ③-B로 온전히 남음. flows.md FLOW 1 복구 cascade 정교화도 마찬가지. 이번 세션이 설계 원본 계획의 2층까지만 다뤘고, 디자인 회귀로 진행이 깨졌으니 다음 세션 재정비

다음 세션 1순위: ⋯ 펼쳐보기 UI Claude.ai 설계 재검토 — 위치·아이콘·크기·색상 기획 레벨 재설계. 설계 확정 후 Code 구현. 이후 블록 ③-B(3층 탭바 메뉴 + flows.md FLOW 1 정교화) 진입

---

### [2026-04-23] 세션 #61 — ⋯ 펼쳐보기 handle C안 구현 + scroll 구조 버그 해소 + 능동 scroll 정렬 전환 + 채팅 입력 A안 설계 확정

> 자동 수행 결과 (세션 #62 회고 기록 — session.md §2 통합 제안 포맷 규약 준수):
> - 세션 번호 검증: #61 (직전 #60 + 1)
> - untracked 감사: 당시 기록 없음, 세션 #62 회고 시점 재현 불가
> - 아카이브 트리거: 완료 세션 3건(#59·#60·#61) 기준 session.md §2 단계 6 "최근 2건만 남기고 아카이브" 조건 충족. 세션 #61 종료 시 실행 누락으로 #59 아카이브 이관 미박제 상태로 세션 #62 진입. 세션 #62 종료 단계 6에서 재판정 처리.

Phase: 탭바 배치 확정(할일/메모/봉투) · ⋯ handle C안(하단 경계) 구현 · 스크롤·handle 비노출 구조 버그 실측 기반 해소 · scroll jump 다층 방어 5층 → 능동 scroll 정렬 전환 · 채팅 기반 입력 A안 목업 승인 / 설계 MD 4종 일괄 갱신
브랜치: master
커밋 수: 다수 (8655978 · 2f58f07 · e2706ce · 05c436b · 9d445f8 · 88027e3 · 9c091ce · 6d2666c · e6d6843 · 8d3aab8 · d2f63f5 · ef7451e · 0eeeed8 + 세션 종료 MD 일괄)

주요 진행:

1. 탭바 순서 확정 + ⋯ 펼쳐보기 handle C안 구현 (커밋 8655978 · 2f58f07)
   · Panel.tsx 2단 구조 재편 — 외부 relative wrapper(overflow visible) + 내부 overflow hidden card
   · 탭바 순서: 할일 / 메모 / 봉투(배지). ⋯ 완전 제거
   · handle: 44×18 pill · chevron 14px · #C4B8B0 → hover #9E8880 · bottom -9 · z-index 3
   · hasOverflow: ResizeObserver + MutationObserver(characterData 제외) + rAF 배치 + 이전값 guard
   · 카테고리 전환 시 isExpanded 리셋 + PostList key={activeCategory}
   · 회수 링크 TodoList/PostList 모두 justify-content flex-end + gap 14
   · E2E panel-height-s1.spec 3/3 PASS · Vercel 배포 Ready
   · Codex P3(transition 0.2s · handle z-index 토큰 정합) 박제 — master-debt 후순위

2. 패널 스크롤·handle 비노출 구조 버그 실측 기반 해소 (커밋 e2706ce · 05c436b)
   · 증상: 유미정 패널 아이템 7개임에도 스크롤바·handle 모두 안 보임
   · 실측 근본 원인: scroll div height 100%가 flex 부모 implicit height를 %로 해결 못해 content 크기(815px)로 폴백 → scrollHeight === clientHeight → hasOverflow 항상 false. 세션 #54부터 잠복
   · E2E 시나리오 2의 `sh >= ch` assertion이 자명 부등식이라 느슨 → PASS 위장 · 회귀 감지 실패
   · 수정: scroll wrapper div 제거 + scroll div를 card 직접 flex child로 승격(flex: 1 1 auto, minHeight: 0, overflow-y: auto) + fade-out card 기준 absolute
   · E2E 보강: 시나리오 4(handle 노출 ↔ overflow 1:1) + 시나리오 5(admin 실데이터 overflow 패널 ≥ 1) · 5/5 PASS

3. ⋯ handle 클릭 scroll jump 다층 방어 (커밋 9d445f8 · 88027e3 · 9c091ce · 6d2666c · e6d6843 · 8d3aab8)
   · 증상: handle 클릭 시 페이지 스크롤 위로 튐 · 튄 채 유지
   · Playwright mouse.move/down/up 분리로 production 실측 — A_BASELINE~F_AFTER_700ms 전 phase scrollY=776 유지. 가상 mouse 재현 실패 → 실 Chrome 특이 동작 가능성
   · 다층 방어 5층 누적:
     - (1) html/body + card 레벨 overflow-anchor: none
     - (2) handle onMouseDown preventDefault (focus 이동 차단, 키보드 Tab 유지)
     - (3) intentScrollYRef — hover/focus/touch 진입 시점 scrollY 선기록 후 click 복원 기준
     - (4) 400ms 감시 창 scroll event intercept + rAF 2회 직접 복원
     - (5) scrollTo({ behavior: 'instant' }) + globals.css scroll-behavior: auto 명시
   · 5층 방어 배포 후에도 오너 실 Chrome 재현 지속 → 원인 미규명 상태에서 접근 전환 결정

4. 능동 scroll 정렬 전환 (U13 신규 원칙 · 커밋 d2f63f5 · ef7451e · 0eeeed8)
   · 설계: "튐 억제"에서 "의도된 위치로 능동 정렬"로 접근 뒤집음. 펼침·접힘 시 패널 상단이 viewport scroll-margin-top 80px에 정렬
   · 설계 엣지케이스 10건 점검(이미 가시/viewport 초과/복수 펼침/접힘 재측정/중복 클릭/reduced-motion/모바일/margin 맥락 의존/키보드 접근/iframe) 후 Phase 1 스코프 확정
   · 구현: scrollIntoView({ block: 'start', behavior }) + rAF 2프레임 대기 + isScrollingRef 400ms lock + 데스크탑(≥768px) 한정 + 이미 가시(0~100px) 생략 + prefers-reduced-motion instant 폴백
   · Rollback 장치: localStorage 'hizzi:activeScrollDisabled' = 'true' 설정 시 능동 scroll 비활성
   · 기존 5층 방어 제거 없이 유지 — 능동 scroll 위에 얹힘
   · 오너 실측 판정: "아주 깔끔해 · 원하는대로 됐어"

5. 채팅 기반 입력 A안 설계 확정 (다음 세션 1순위 확정)
   · 설계 단계: 4가지 UI 시나리오 목업 + 엣지케이스 검토
   · 구조: 홈 상단 pill 입력 → AI 확장 영역 바로 아래 인라인 펼침 → 확정 시 접힘 · 모달 회피
   · 임계선: 3턴 이상 or 복수 항목 미확정 → B안 사이드 패널 승격
   · 목업에서 오너 승인: 위치·폭·AI 뱃지·파싱 프리뷰·승격 버튼 전부

6. 설계 MD 4종 — 기획 논의 완료 · Code 실행 누락 (세션 #62에서 복구)
   · 세션 #61 종료 단계 4·5 통합 제안에서 "설계 MD 4종 일괄 갱신" 항목을 "완료" 기록으로 처리했으나 실제로는 Claude.ai 기획 논의에 그치고 Code 실행 명령 전달 누락. 세션 #62 진입 시점 git log 감사로 4개 MD(main-ux·patterns·ux-principles·uxui) 모두 세션 #53 시점 그대로임을 확인.
   · 세션 #62 복구 4회차로 분할 실행 완료 (1/4 ux-principles U13·U14 / 2/4 patterns P8·P9 · 기존 P8·P9 → P10·P11 재번호 / 3/4 uxui §4 handle 토큰·능동 scroll 토큰·홈 채팅 입력 토큰 / 4/4 main-ux §1.2a·b·c · §1.3 확장 · §4.2 폼·채팅 분리 · §6 채팅 입력 · §7~§9 재편).
   · 본 사고는 MEMORY #61-c 원칙("재현 불가 시점의 선제 수정은 한계 고지 + rollback 장치 동반 필수. '확인된 척' 박제 금지")의 자기 위반. MEMORY #61-c 항목에 사례로 박제.
   · 계획 원문은 세션 #61 대화방 히스토리 및 세션 #62 대화방의 chillkim 님 추출 산출물에 보존.

검증:
- npm run build PASS (각 변경 후 매번)
- Vercel Production 배포 다회 Ready
- E2E panel-height-s1.spec 7/7 PASS (시나리오 1~7 · Phase 1 추가 시나리오 8/10/12 PASS · 9 skip)
- 오너 실사용 검증: handle 노출 · 스크롤 작동 · 탭바 순서 · 회수 링크 우측 정렬 · 능동 scroll 정렬 모두 OK
- ⚠️ MD 갱신 검증 누락: 주요 진행 6항 "설계 MD 4종 갱신"은 실 저장소 반영 검증 없이 완료 기록. 세션 #62 진입 시 git log 감사로 미반영 확인. 이후 검증 규약 강화는 MEMORY #61-c에 위반 사례 박제하고, 세션 경계 MD 갱신 후 mtime·말미 확인 절차 도입은 별도 검토(세션 #62 복구 마무리 시점).

산출물:
- 수정 코드: src/components/Panel.tsx · src/components/TodoList.tsx · src/components/PostList.tsx · src/app/globals.css · src/app/(main)/page.tsx · tests/smoke/panel-height-s1.spec.ts
- 수정 MD (실제 반영): md/log/progress.md · md/core/master-debt.md · .harness/MEMORY.md · md-presets/presets.json
- 수정 MD (계획 but 미반영 → 세션 #62 복구): md/plan/designs/main-ux.md · md/ui/uxui.md · md/ui/ux-principles.md · md/ui/patterns.md

교훈:
- assertion tightness: scrollHeight >= clientHeight 같은 자명 부등식은 검증이 아니다. 감지하려는 현상을 1:1로 좁히는 assertion 필수 (MEMORY #61-a)
- Playwright page.click()의 actionability scroll은 scroll position 검증 baseline을 오염. programmatic element.click() 또는 mouse.move/down/up 분리 시퀀스로 우회 (MEMORY #61-b)
- 재현 불가 시점의 선제 수정은 한계 고지 + rollback 장치 동반 필수. "확인된 척" 박제 금지 (MEMORY #61-c)
- 브라우저 레이아웃 엔진 싸움에서 덮어쓰기 전환 원칙. 원인 규명 비용 > 마스킹 구현 비용 + 덮어쓰기 UX 자연스러울 때 능동 제어. 방어와 덮어쓰기는 중첩 (MEMORY #61-d, U13 원칙화)
- 반복 엣지 버그 표준 접근: 설계 단계 엣지케이스 10건+ 선제 점검 + Phase 분할 배포 + rollback 장치 + 실측 검증 (MEMORY #61-e)

다음 세션 1순위: 홈 상단 채팅 기반 입력 구현 (A안 인라인 확장 · main-ux.md §6 · P9 패턴 · U14 원칙 · uxui.md §4 홈 채팅 입력 토큰). 시나리오 1~3 완전 구현 + 시나리오 4(B 승격)는 placeholder UI 골격.

### [2026-04-23] 세션 #62 — 세션 #61 드리프트 진단 + 설계 MD 4종 복구 + 사실 정정 + 산출물 규약 박제

Phase: 주입 확인 시 MD 5종 구버전 식별 / 세션 #61 대화방 원문 추출 (chillkim 님 실행) / MD 복구 4회차 순차 실행 / 세션 #61 사실 정정 A+B / 자동 수행 결과 회고 헤더 + 산출물 규약 C+D / 3/4 재실행 (Code 교차 검증으로 누락 발견)
브랜치: master
커밋 수: 복구 6건 (f543599 · a366436 · 4fd117d · 3bc4b0a · 8af4052 · b92494c) + 본 종료 블록 추가 N건

주요 진행:

1. 드리프트 진단 (세션 시작 주입 확인 단계)
   · 첨부 5개 MD 주입된 내용이 세션 #53 원본 수준임을 본문 말미 타임스탬프로 식별:
     main-ux.md "2026-04-21 세션 #53" / patterns.md P8(FAB)·P9(스와이프) / ux-principles.md U12까지만 / uxui.md "2026.04.21" / master.md CompletedTodo.tsx 잔존(세션 #60에서 삭제된 파일)
   · progress.md 세션 #61 산출물 기록과 실제 파일 상태 괴리 포착
   · Code git log 감사 결과: "세션 #61 종료 블록 6항 '설계 MD 4종 일괄 갱신'이 실제 저장소에 전혀 반영되지 않음. 작업 트리·git history 모두 세션 #60 말 상태"

2. 세션 #61 대화방 원문 추출 (chillkim 님 실행)
   · Claude.ai가 추출 명령 블록 작성 → chillkim 님이 세션 #61 대화방에서 실행 → 주제 1·2·3·4·5 + 추가 참고 항목으로 정리된 답변 회수
   · 4개 MD 갱신을 위한 decisions 원문(구체 수치·색상·문구·대안 탈락 이유) 복원
   · master.md는 세션 #61 스코프 밖으로 판정됨 (복구 범위 4종으로 좁힘)

3. MD 복구 4회차 실행 (한 개씩 순차 · before/after 검수 → Code str_replace)
   · 1/4 ux-principles.md (f543599) — U13 능동 scroll 정렬 원칙 · U14 인라인 대화 원칙 신규
   · 2/4 patterns.md (a366436) — P8 ⋯ 펼쳐보기 handle 패턴 · P9 인라인 확장 대화 패턴 신규 · 기존 P8(FAB)·P9(스와이프) → P10·P11 재번호
   · 3/4 uxui.md (4fd117d — 재실행 후) — §4 handle 토큰 · 능동 scroll 토큰 · 홈 채팅 입력 토큰(서브블록 7~10개) 신규
   · 4/4 main-ux.md (3bc4b0a) — §1.2a(handle 시각·2단 wrapper·hasOverflow) · §1.2b(능동 scroll 정렬) · §1.2c(다층 방어 5층) · §1.3 PASS 기준 확장 · §4.2 폼·채팅 분리 · §6 채팅 입력 · §7 실행 순서 갱신 · §8 설계 파급 토큰 리스트 확장 · §9 연동 MD 갱신

4. 세션 #61 사실 정정 + MEMORY #61-c 자기 위반 박제 A+B (8af4052)
   · progress #61 블록 주요 진행 6항 본문 교체 — "계획됨 but 미실행 → 세션 #62 복구"로 재기술
   · progress #61 블록 "수정 MD" 목록을 "실제 반영" / "계획 but 미반영" 분리 표기
   · progress #61 블록 "검증" 섹션에 MD 갱신 검증 누락 경고 추가
   · progress.md 현재상태 "선행 문서" 한 줄 정정
   · MEMORY #61-c 항목에 자기 위반 사례 블록 append

5. 자동 수행 결과 회고 헤더 + MEMORY #61-f 박제 C+D (b92494c)
   · progress #61 블록 "Phase:" 줄 위에 blockquote 형태 회고 헤더 삽입
   · MEMORY #61-f 신규 항목 — 세션 경계 산출물 규약

6. 3/4 uxui 재실행 — Code 교차 검증 첫 작동 사례 (4fd117d)
   · 세션 #62 복구 4회차 중 3/4 uxui.md 블록이 대화에 산출됐으나 Code 실행 누락 상태로 다음 회차(4/4) 진입
   · 세션 종료 통합 제안 작성 단계에서 Code가 커밋 해시 교차 검증으로 3/4 미반영 식별
   · MEMORY #61-c·#62-a 원칙의 즉시 위반 사례이자 동시에 "Code 교차 검증 층이 세션 종료 단계에서 실행 누락을 잡은 첫 실측 사례"
   · 세션 #63 session.md 보강의 정당성 실측 확보

7. 세션 #61 사고 재발 방지 구조 제안 도출
   · chillkim 님 질의 "짧은 세션으로도 막을 수 없는 부분 점검"
   · Claude.ai 분석: 사고는 "세션 길이"가 아니라 "기획 논의 = 완료로 기록" 구조 틈에서 발생
   · 제안: session.md 단계 5·11 두 줄 보강
   · 실행은 세션 #63 첫 작업으로 이관 (self-modification 회피)

검증:
- MD 복구 4회차 각 단계 Code str_replace 실행 완료 보고 수신 후 다음 회차 진행 (순차 검수)
- 3/4 uxui 재실행은 세션 종료 통합 제안 검수 단계에서 Code 교차 검증으로 catch · 재실행 후 보고 수신 (Code 4fd117d)
- A+B · C+D 각 Code 실행 완료 보고 수신
- 세션 #62 산출물 "수정 MD" 목록 작성 시 MEMORY #61-c "실행 완료분만 포함" 원칙 즉시 적용
- 배포 없음 · E2E 없음 · npm run build 없음 (MD만 변경)

산출물:
- 수정 MD (실제 반영): md/ui/ux-principles.md · md/ui/patterns.md · md/ui/uxui.md · md/plan/designs/main-ux.md · md/log/progress.md · .harness/MEMORY.md · md/core/master-debt.md · md-presets/presets.json · md/archive/progress-2026-04-Q.md (신규, #59 이관)
- 수정 MD (계획 but 세션 #63 이관): md/core/session.md (단계 5·11 보강)

교훈:
- 세션 #61 사고의 본질: 기획 논의 → Code 실행 명령 전달 → 실제 반영의 3단계 중 "Code 실행 명령 전달" 단계 자체를 Claude.ai가 건너뛰고 progress에 "완료" 기록. 세션 길이와 무관하게 발생 가능 구조. 세션 길이 제어는 발생 빈도를 낮추지만 구조 틈은 별도 층으로 방어해야 함 (MEMORY #62-a·#62-b 박제)
- "원본 편집 vs 주석 박스" 판단 — 오너 명시 승낙 시 원본 편집 가능. Claude.ai가 "삭제 금지" 원칙을 스스로 판정해 보수적으로 해석하면 원본이 지저분해지고 가독성 손실. 오너 판단을 먼저 묻는 것이 원칙 무너짐이 아닌 원칙 유지.
- MD 복구 세션은 한 개씩 순차 검수가 최선 경로. 다만 순차 검수 자체만으로는 실행 누락 catch 못 함 — 세션 #62에서도 3/4 누락 발생. 검수 순차 구조와 독립적인 "실제 반영 검증" 층이 필요 (세션 #63 session.md 보강 정당성)
- self-modification 회피 원칙: 세션 운영 절차 수정은 해당 절차가 돌고 있는 세션에 끼워 넣지 않는다. 별 세션에 단독 작업으로 처리. (MEMORY #62-c 박제)
- Code 교차 검증 층의 실증적 가치: 세션 #62에서 Code가 자발적으로 커밋 해시를 교차 대조해 3/4 uxui 누락을 세션 종료 직전에 발견. session.md 공식 조항이 없는 상태에서 작동한 이 검증이 세션 #63 보강 조항의 정당성을 실측으로 확보. Code 자체가 신뢰 층으로 작동한 첫 사례 (MEMORY #62-d 박제)

다음 세션 1순위: session.md 단계 5·11 보강. 후순위 최상단은 홈 상단 채팅 기반 입력 A안 구현.
