# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-22 세션 #60 (연차 조사 필터 해소 · 블록 ③-A 배포 · 후속 핫픽스 4건 · ⋯ 펼쳐보기 디자인 회귀 박제)
- 작업 브랜치: master (로컬·원격 e2706ce 동기 · backup/flatten-2026-04-22 = 14ab3e7 보존)
- 프로덕션: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK · 블록 ③-A(RecordModal 2탭 · 2층 복구 링크 · CompletedTodo 재편) 반영 · hover 휴지통 웹 한정 부활 · Panel overflow hidden · ⋯ handle 하단 경계(44×18 pill · chevron) · 탭바 할일/메모/봉투 · 회수 링크 우측 정렬 · **패널 내부 스크롤·handle 감지 복구** (scroll div를 card 직접 flex child로 · #61 후속 핫픽스)
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW · Production env 6개 정상 · Deploy Hook tB2B4PASNi 정상 (세션 #60 auto-deploy 실측 사례 1건: i42koin1y · master-debt #9 partial 해소)
- 다음 세션 1순위: 블록 ③-B — 3층 탭바 메뉴 "기록" 진입점 + RecordModal 활용 + flows.md FLOW 1 복구 cascade 정교화(pending/accepted 직전 상태 복귀)
- 후순위 후보:
  - 메인 UX 블록 ④(FAB) · 블록 ⑤(달력 피어 탭) · 세션 #55 기준 1~6
  - 기존 Panel.tsx 비과업 transition 정합 (0.2s → 0.15s ease 통일, ease 키워드 누락 보완) · 세션 #61 Codex P3 박제
  - handle z-index 토큰 정합 (현 3 하드코딩 · tokens.ts zIndex 계층 정렬) · 세션 #61 Codex P3 박제
- 선처리 큐: #1~#4 (세션 #55 기준) + #5 (세션 #56) + #7 (세션 #58)
  5. tabbar-sticky.spec 전체 smoke 직렬 실행 시 간헐 timeout (세션 #56 · 유지)
  7. Vercel 새 프로젝트 env 환경별 불완전 (세션 #58 · 유지)
     · Production 6개 완비 · Preview 0개 · Development 5개 (API_KEY 누락)
     · Production 배포엔 영향 없음. Preview 배포 트리거 시 Firebase 초기화 실패 가능
- 미해결:
  - Panel CSS flex shrink + overflow hidden 내부 스크롤 근본 원인 미규명 (회피책으로 ⋯ handle 토글 · 세션 #61 디자인 완결 · Playwright 실측 워크플로우 부재로 blocked · MEMORY #60)
  - post-request cascade 실패 시 divergence 가능성 — master-debt #8
  - serviceAccount.json git history 잔존 — master-debt #10
  - auto-deploy 트리거 검증 공정 편입 — master-debt #9 (partial · #60에서 실측 사례 1건 확보)

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

### [2026-04-22] 세션 #59 — 인프라 장기 과제 완결 (4세션 연속 시달리던 배포 파이프라인 정상화)

Phase: 세션 #58이 박제한 6레이어 순차 해소 / serviceAccount.json 키 회전 + Secret Scanning bypass / Git 재연결 + Deploy Hook 생성 / Deployment Protection 해제 / Framework Preset = Next.js / API_KEY 오타 정정 / hana-vote alias 재연결
브랜치: master (로컬·원격 2f65002 · backup/flatten-2026-04-22 14ab3e7 보존)
커밋 수: 1건 (2f65002 보안 fix) — 세션 #58 마감 커밋 284cc5a와 함께 push 성공

주요 진행:

1. serviceAccount.json 보안 처리 (세션 #58 push rejection의 실제 원인 규명)
   · Secret Scanning 원문 확인: `path: serviceAccount.json:1 · Google Cloud Service Account Credentials`
   · 저장소 현황 조사: `git ls-files`로 tracked 확인 · 최초 커밋 cceeaba · `.gitignore` 미포함 · Admin SDK 참조 경로 7개 (4개는 상위 D:\Dropbox\Dropbox\serviceAccount.json 참조 · 2개만 프로젝트 루트 참조 · 1개 applicationDefault)
   · 운영 영향 분석: 웹앱(src/app/)은 Admin SDK 미사용 · scripts·tests 오프라인 도구만 사용 · 키 삭제해도 프로덕션 무영향 확정
   · 오너 Google Cloud Console 작업: firebase-adminsdk-fbsvc@hizzi-board.iam.gserviceaccount.com 의 구 키(e69f1646f974d3736e246483900c644b160d3c4c) 삭제 · 새 키 발급 · D:\Dropbox\Dropbox\serviceAccount.json (프로젝트 외부) 에 배치
   · Code 후속: `.gitignore`에 serviceAccount.json 추가 · `git rm --cached serviceAccount.json` tracked 해제 · 커밋 2f65002

2. GitHub Secret Scanning bypass + push 성공
   · 오너가 bypass URL 클릭 (구 키는 이미 무효화 상태라 안전)
   · `git push origin master` 실행 → 284cc5a + 2f65002 원격 반영 성공 (세션 #58 종료 커밋이 드디어 올라감)

3. Vercel 배포 파이프라인 다단 점검 → 4레이어 발견
   · push 후 30~60초 대기해도 auto-deploy Row 생성 안 됨 → webhook 단절 가능성 포착
   · CLI `vercel --prod` 시도 → 과거와 다르게 빌드 자체는 Ready (1m Duration) 성공 · 그런데 hizzi-board.vercel.app 접속 시 404
   · Direct deploy URL 401 + `_vercel_sso_nonce` 쿠키 → Deployment Protection 활성 상태 발견
   · 오너 가설 전환: "문제 찾아 수정"에서 "처음 설정하듯 대시보드 훑기"로 접근 방식 재구성

4. "차근하게 감사" 접근으로 남은 4레이어 순차 해소
   · Deploy Hooks 공란 → 오너가 "hizzi" hook 생성 · master 지정 (URL: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW/tB2B4PASNi)
   · Git 연결 실제 끊김 상태 → 오너 재연결 (vercel git connect CLI는 연결됐다고 응답했으나 대시보드 실상은 미연결이었음 · 이전 세션에서 놓친 층)
   · Deployment Protection → Disabled 저장
   · Framework Preset 미설정 → Next.js 지정 + Save ← **결정적 열쇠**. 저장 후 Deploy Hook 재트리거로 새 빌드 생성 → alias 자동 교체 → 200 OK 확인

5. Firebase 데이터 로드 실패 (서비스 재개 직후 표면화)
   · 오너 "접속은 되는데 패널 데이터·사용자 데이터 안 뜸" 보고
   · 빌드 chunk 실측: `/_next/static/chunks/10-*.js`에서 `AIzaSy...9CK00fOfGDeDE` 추출
   · 로컬 .env.local 원본과 대조: `.env.local`은 `...9CK0OfOfGDeDE` (0 + 대문자 O) · Vercel은 `...9CK00fOfGDeDE` (0 두 개)
   · 6개 env 전수 diff: API_KEY만 단일 글자 오타 · 나머지 5개 완벽 일치
   · `vercel env rm` + `vercel env add` (BOM 제거 로컬값 전송) → Deploy Hook 재트리거 → 새 빌드 chunk 검증에서 정확한 키 `9CK0OfOfGDeDE` 확인

6. hana-vote.vercel.app 404 보고 → alias 재연결
   · 원인: 세션 #58에서 기존 프로젝트 삭제 시 hana-vote alias 함께 소실 · 새 프로젝트에 미등록
   · 페이지 빌드 자체는 정상 (`/hana-vote` 경로는 200) · alias만 문제
   · `npx vercel alias set hizzi-board-gte3uvuz7-rehobot.vercel.app hana-vote.vercel.app` → propagation 30초 후 200 OK

검증:
- `curl -sI https://hizzi-board.vercel.app` → 200 OK
- `curl -sI https://hana-vote.vercel.app` → 200 OK
- 빌드 chunk API_KEY 정확한 값 주입 확인
- 오너 브라우저 실사용 검증: 로그인 · 패널 데이터 · 사용자 데이터 정상 로드 확인 ("전체 다 오케이")
- origin/master = 로컬 = 2f65002 동기

산출물:
- 수정 코드: 없음
- 수정 MD: .gitignore · md/log/progress.md · md/core/master-debt.md (#9 부분 해소 + #10 신규) · .harness/MEMORY.md (세션 #59 4건) · md-presets/presets.json
- 삭제: serviceAccount.json (tracked 해제 · 로컬 파일은 오너 판단 대기)
- Vercel 설정 변경: Framework Preset = Next.js · Deployment Protection = Disabled · Git 재연결 · Deploy Hook 신규
- alias 재등록: hana-vote.vercel.app → hizzi-board-gte3uvuz7-rehobot
- Firebase: 구 Admin SDK 키 revoke + 새 키 발급 (외부 경로 배치)

교훈:
- "꼬인 걸 풀기" 접근이 다단 복구에서 시야 좁히는 함정으로 작용. 오너 제안 "처음 설정한다는 마음으로 하나씩"으로 전환한 순간 Framework Preset·Git 연결 등 4레이어 즉시 발견. 수정 접근 아닌 감사 접근이 경로 최단 (MEMORY.md 신규 항목)
- Vercel 프로젝트 신규 생성 시 UI 기본값 함정 4건 (Deployment Protection Standard · Git 연결 불안정 · Deploy Hook 공란 · Framework Preset 미지정). "생성됐다 = 작동한다" 가정 금지. Settings 전체 페이지 한 번 훑는 체크리스트 표준화 필요 (MEMORY.md 신규 항목)
- 환경변수 오타는 Vercel 대시보드만으로 감지 불가 (Encrypted 마스킹). 빌드 chunk에서 직접 값 추출 + .env.local 원본 diff가 확실한 검증. BOM 제거 후 비교 필수 (MEMORY.md 신규 항목)
- 세션 #58의 "미완결 박제" 선택이 세션 #59 진입 비용 감소. 어설픈 완결보다 명확한 미완 보고가 다음 세션 효율 제공. 다단 복구 상황에서 의도적 박제형 마감 허용 (MEMORY.md 신규 항목)
- 4세션 장기 과제(#56~#59)의 레이어별 분포: #56 드리프트 발견 · #57 원격 push 복구 · #58 구조 정비 + 보안 블로커 박제 · #59 6레이어 순차 해소. "한 세션 = 한 레이어" 원칙이 사후적으로 맞아떨어짐

다음 세션 1순위: 연차 내역-달력 표시 불일치 조사 (기존 케이스 1건 시작점) — 이후 블록 ③ 회수 동선 진입

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

- [2026-04-22] 세션 #61 / 메인 패널 UI 재편 — 탭바 순서 확정(할일/메모/봉투) · ⋯ handle 하단 경계 이동(44×18 pill · chevron · wrapper 분리) · 회수 링크 우측 정렬 (8655978) — Panel.tsx · TodoList.tsx · PostList.tsx
- [2026-04-22] 세션 #61 / 패널 내부 스크롤·handle 감지 복구 — scroll div를 card 직접 flex child로 (height:100% → flex:1 1 auto + minHeight:0) · 세션 #54부터 잠복하던 height:100% 미해결 버그 확정 · E2E 시나리오 4/5 보강(handle ↔ overflow 1:1 일치 + admin 화면 overflow 패널 ≥1) (e2706ce) — Panel.tsx · page.tsx · panel-height-s1.spec.ts
