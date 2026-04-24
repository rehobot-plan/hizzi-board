# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-23 세션 #65 (§6 E2E 회귀 스위트 신규 · 23/23 PASS · 프로덕션 배포 · authStore reload 잠재 버그 감지)
- 작업 브랜치: master (로컬·원격 c927ff1 동기 · backup/flatten-2026-04-22 = 14ab3e7 보존)
- 프로덕션: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK · §6 홈 채팅 입력 A안 라이브 (시나리오 1~3 완전 · 시나리오 4 placeholder)
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW · 기존 설정 유지
- 다음 세션 1순위: authStore.onAuthStateChanged reload 부작용 진단 + 수정 (master-debt #14)
  · 범위: admin 로그인 상태에서 page reload·새 탭 오픈 시 clearAdminPanelOwnership 재호출로 패널 ownership 리셋되는 잠재 버그. E2E 우회했을 뿐 프로덕션 admin 사용 경로에 잠복
  · 진단 시작점: src/store/authStore.ts · onAuthStateChanged 콜백 · clearAdminPanelOwnership 호출 조건
- 후순위 후보:
  - 블록 ③-B: 3층 탭바 메뉴 "기록" 진입점 + RecordModal 활용 + flows.md FLOW 1 복구 cascade 정교화
  - 메인 UX 블록 ④(FAB + CreatePost 재배치, §6 구현 중 CreatePost 상단 영역 제거 보류분 포함) · 블록 ⑤(달력 피어 탭)
  - §6 B-1 확장: LLM 2단 본체 부착 (Anthropic Haiku) — ai-capture-hb.md §9.3
  - §6 수신자·기한·타입 unset 질의 UI 확장 — ai-capture-hb.md §4.2 우선순위 후속
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
> 세션 #60~#61 아카이브: md/archive/progress-2026-04-R.md
> 세션 #62~#63 아카이브: md/archive/progress-2026-04-S.md

### [2026-04-23] 세션 #64 — §6 홈 채팅 입력 A안 구현 · ai-capture-hb.md 설계 · 시나리오 1~4 프로덕션 배포

Phase: 주입 확인(main-ux.md 디스크 존재 실측 확인) / 목업 HTML 검수 / 르호봇 product.md §7 D3 + data-model.md 이식 판단 / ai-capture-hb.md 초안 검수(직함 매칭 규칙 확정: 대표·이사·사원 단독 매칭, 팀장 단독 unset) / 일반어 명령 블록 작성 / Code 공정 1-1~1-6
브랜치: master (로컬·원격 3b178d2 동기)
커밋: fe98878 · 15a6ad5 · 3b178d2

주요 진행:

1. 설계 판단 (기획 대화)
   · chillkim 님이 르호봇 product.md + data-model.md를 참고 자료로 업로드
   · parseIntent 판정 엔진 구조 확정: 1단 로컬 활성 + 2단 LLM stub + 3단 확장 영역 질의 활성 (르호봇 D3 그대로 이식)
   · 스키마 이식 범위 확정: chatMessages 신규 + posts 4필드(sourceMessageId·parseStage·confidence·inputSource) 추가. Question 엔티티·학습 트랙 엔티티 전부 v1 밖
   · 문서 수납처: md/plan/designs/ai-capture-hb.md 단일 파일
   · 수신자 매칭 직함 확정(chillkim 님 확정): 홍아현 대표·김진우 이사·조향래/우희훈/한다슬 팀장·유미정 사원. 단독 매칭은 대표·이사·사원만, "팀장"은 3명 공유라 unset

2. ai-capture-hb.md 신규 (커밋 fe98878)
   · 르호봇 product.md §7 D3 + data-model.md 핵심 이식
   · §3.2 수신자 매칭 표에 직함·별칭·접미사 규칙 명시
   · §5 스키마 이식: chatMessages 축소본 + posts 4필드
   · §7 parseIntent.ts 계약 명세
   · §9 첫 구현 포함·제외 명세

3. 공장 공정 1-1~1-6 (커밋 15a6ad5·3b178d2)
   · 1-1 탐색: page.tsx / postStore / toastStore / firebase / master.md · uxui §4 확인
   · 1-2 구현: 신규 6 파일 (parseLocal·parseIntent·chatInputStore·ChatInput·ChatExpand·AiBadge) + page.tsx·firestore.rules 수정
   · 1-3 빌드: npm run build PASS (Codex 수정 후 재빌드 포함 2회)
   · 1-4 Codex 리뷰: 6건 반영
     - P1 schedule → calendarEvents 컬렉션 분기
     - P1 복수 "N개 모두 추가" 엄격 판정 (전 축 매칭 + unset 0)
     - P2 모바일 ChatInput 노출 (hidden md:block 제거)
     - P2 chatMessages delete: if false (hard delete 차단)
     - P2 confidence 0.8 tier 구현 (taskType inferred 추적)
     - P3 role="dialog" → "region" (P9 · U14 모달 회피 정합)
   · 1-5 E2E 회귀: panel-height-s1.spec 10/11 PASS (세션 #61 기존 skip 9 유지)
   · 1-6 배포: Vercel READY + Firebase rules 배포 · MD 갱신

검증:
- 프로덕션 https://hizzi-board.vercel.app 200 OK
- 시나리오 1(빈 placeholder)·2(명확 즉시 저장)·3(공개범위 질의)·4(복수 항목 B placeholder) 라이브
- Firestore chatMessages 컬렉션 쓰기·읽기·soft delete 동작, hard delete 차단

산출물:
- 수정 MD (실제 반영): md/plan/designs/ai-capture-hb.md 신규 · md/plan/designs/main-ux.md §6.9 · md/core/master.md §4·§5·§7 · md/core/master-schema.md · md/log/progress.md
- 수정 코드: src/lib/parseLocal.ts · src/lib/parseIntent.ts · src/store/chatInputStore.ts · src/components/ChatInput.tsx · src/components/ChatExpand.tsx · src/components/AiBadge.tsx (신규) · src/app/(main)/page.tsx · firestore.rules (수정)

교훈:
- 르호봇 product.md + data-model.md가 히찌보드 §6 parseIntent 엔진 구조 결정의 결정적 참고 자료. "이미 정리된 타 프로젝트 설계 문서를 참고 자료로 투입"이 기획 품질·속도 모두 상승시키는 경로. 두 프로젝트가 같은 오너 생각의 연속선이라 구조 이식이 자연스러움
- 직함 매칭 규칙은 오너만 답할 수 있는 팀 고유 정보. "대표·이사·사원 단독 매칭 vs 팀장 단독 unset" 같은 디테일은 Claude.ai가 추측할 수 없어 파이프라인 안에서 질의하는 지점을 확보해야 함

다음 세션 1순위: §6 E2E 회귀 스위트 작성 (후속 세션 #65로 연속 수행).

### [2026-04-23] 세션 #65 — §6 E2E 회귀 스위트 신규 · 23/23 PASS · authStore reload 잠재 버그 감지

Phase: E2E 스위트 명령 블록 작성 / Code 1-1~1-6 / 안정화 중 구조 이슈 4건 진단·해소
브랜치: master (로컬·원격 c927ff1 동기)
커밋: 933d759 · 8f9cdd8 · c927ff1

주요 진행:

1. E2E 명령 블록 작성 (기획 대화)
   · 세션 #64 완료 후 오너 수동 체크 포인트 30+건 규모 → 자동 회귀 스위트로 대체 판단
   · 범위: 시나리오 1~4 핵심 플로우 + 수신자 직함 매칭 주요 케이스 + 날짜 파싱 + 모바일 pill + 핵심 회귀
   · 분할 판단 조항 명시(인증 storage state·Firestore emulator 셋업 규모 따라)

2. 공장 공정 1-1~1-6
   · 1-1 탐색: admin 계정 + Admin SDK seed + storageState 패턴 확인. 팀원 크리덴셜 없음 확정
   · 1-2 구현: tests/e2e/chat-input-s6.spec.ts(23 테스트) + helpers/chat-input.ts + ChatExpand data-testid 3건 + parseLocal 버그 fix
   · 1-3 빌드: PASS
   · 1-4 Codex: 생략(테스트 전용 블록, parseLocal 버그 fix 1건만 기능 변경)
   · 1-5 실행: 프로덕션 23/23 PASS
   · 1-6 배포: Vercel 배포 · master.md §4 tests 추가 · progress append

3. 안정화 중 구조 이슈 4건
   · [잠재 버그] authStore.onAuthStateChanged가 page reload마다 clearAdminPanelOwnership 재호출. admin 로그인 상태에서 page.goto('/') trigger. E2E 우회(loginAsAdmin 후 추가 page.goto 금지 + ensureAdminPanel 타이밍 조정)로 회피했으나 프로덕션 admin 사용 경로(새로고침·새 탭)에 잠복. → master-debt #14 신규
   · [Playwright × React 함정] page.clock.install()이 timers freeze로 React rerender hang 유발. setFixedTime(Date만 고정)로 대체. → MEMORY #65-a 박제
   · [기존 규약 재확인] Playwright page.click() actionability scroll — MEMORY #61-b 기존 규약 재적용. element.click() programmatic 사용
   · [parseLocal 버그] nextWeekWeekday +7 중복 — "다음주 화요일"이 다다음주 반환. nextWeekdayThisWeek가 이미 "다음 발생" 처리라 중복 제거. → ai-capture-hb.md §3.2 주석 추가

커밋 구성:
- 933d759 spec + helper 초안
- 8f9cdd8 race/helper 정비 + parseLocal fix
- c927ff1 모바일 분기 + MD 1-6

검증:
- 프로덕션 23/23 PASS (시나리오 1·2·3·4 + 직함 매칭 + 날짜 파싱 + 모바일 + 회귀 전체)
- npm run build PASS
- Vercel 배포 완료

보고 규약 확립:
  npx playwright test tests/e2e/chat-input-s6.spec.ts --reporter=line
  실패 테스트명 + tests/screenshots/<name>/error-context.md + 스크린샷 자동 수집
  → Claude.ai 진단 사이클로 표준화 완료. 이후 §6 변경·후속 블록에서 오너 수동 체크 대체

산출물:
- 수정 MD (실제 반영): md/core/master.md §4 · md/log/progress.md · (본 종료 단계) .harness/MEMORY.md · md/core/master-debt.md · md/plan/designs/ai-capture-hb.md §3.2 주석 · md/archive/progress-2026-04-S.md 신규
- 수정 코드: tests/e2e/chat-input-s6.spec.ts (신규) · tests/e2e/helpers/chat-input.ts (신규) · src/components/ChatExpand.tsx (data-testid 3건) · src/lib/parseLocal.ts (nextWeekWeekday 중복 제거)

교훈:
- 자동화 ROI 임계 — 체크 포인트 30+건 규모면 1회 spec 작성 비용 << 매 세션 수동 체크 + 구두 왕복 비용. §6 본체 배포 직후 E2E 착수가 적기였음
- E2E가 프로덕션 잠재 버그를 간접 감지 — authStore reload 부작용은 수동 사용에선 드물게 재현되는 조건이라 발견이 어려웠을 지점. 테스트 셋업 과정에서 반복 page.goto가 재현 조건을 제공해 드러남. E2E의 부가 가치가 "회귀 감지"뿐 아니라 "기존 미발견 버그 노출"까지 확장됨을 실측
- Playwright × React 조합에서 시간 고정은 setFixedTime 안전, clock.install 위험. 규칙 기반 파싱에서 동적 날짜 assertion은 반드시 시간 고정 필요

다음 세션 1순위: authStore.onAuthStateChanged reload 부작용 진단 + 수정 (master-debt #14).
