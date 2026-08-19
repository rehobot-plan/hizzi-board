# 히찌보드 — 마스터 문서 (인덱스)

> 상세 섹션은 분할 파일 참조.
> 상세: master-schema.md (Firestore 스키마), master-debt.md (기술 부채), master-bugs.md (버그 이력)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트** | Hizzi Board |
| **URL** | https://hizzi-board.vercel.app |
| **목적** | 히찌 패션 브랜드 사내 협업 플랫폼 (게시판·달력·할일·연차·업무요청) |
| **브랜드** | ZARA / COS — 미니멀, 에디토리얼, 프리미엄 패션 인트라넷 |
| **팀** | 6명 실사용 중 |
| **핵심 원칙** | 속도보다 정확성. 흐름 분석 없이 배포하지 않는다. |

---

## 2. 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS + inline styles |
| 상태관리 | Zustand |
| 데이터베이스 | Firebase Firestore |
| 인증 | Firebase Auth |
| 스토리지 | Firebase Storage |
| 배포 | Vercel |

---

## 3. 경로

```
프로젝트 루트:     {dev}\hizzi-board      (환경별 dev 주소는 거버넌스 CLAUDE.md 3-2-(2))
Firebase 프로젝트: hizzi-board
serviceAccount:    {dev} 바깥 · 오너 로컬
```

**절대경로를 못 박지 않는다** — 오너가 세 기계(D·C·맥)를 오가고 2026-07-31 에 폴더 층이 `dev/` 아래로 옮겨졌다. 환경별 주소의 단일 출처는 거버넌스 진입점이다.

---

## 4. 파일 구조

```
src/
├── app/
│   ├── layout.tsx                루트 (html/body)
│   ├── (main)/                   인증 필요 영역
│   │   ├── layout.tsx            AppShell 래핑
│   │   ├── page.tsx              홈 (CreatePost 상단 영역 제거 — FAB 대체)
│   │   ├── mydesk/               MY DESK (대시보드 용도, 달력 탭 제거)
│   │   ├── request/page.tsx      요청
│   │   └── leave/page.tsx        연차
│   ├── (auth)/                   로그인·가입
│   │   ├── layout.tsx            children만 반환
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── hana-vote/                독립 앱 (route group 밖)
├── components/
│   ├── common/
│   │   ├── AppShell.tsx          Sidebar + Header 래핑
│   │   ├── Header.tsx            공통 헤더 (56px sticky)
│   │   ├── Sidebar.tsx           좌측 네비게이션
│   │   ├── ImageViewer.tsx
│   │   └── FAB.tsx               패널 우하단 context-aware 진입점
│   ├── Panel.tsx, TodoList.tsx, PostList.tsx, CompletedRecentSection.tsx
│   ├── request/                  요청 4축 (P1-β · eeddb04)
│   │   ├── RequestView.tsx       4축 host
│   │   ├── RequestList.tsx       slim 리스트 렌더
│   │   ├── RequestSegment.tsx    4 평면 세그먼트 + admin 전체보기 토글
│   │   ├── RequestFilterBar.tsx  counterpart·done status 필터
│   │   ├── RequestSortDropdown.tsx  segment-aware sort
│   │   ├── RequestBulkBar.tsx    segment-aware 일괄 액션
│   │   └── RequestDetailPopup.tsx
│   ├── PostItem.tsx, PostEditModal.tsx
│   ├── TodoItem.tsx, TodoEditModal.tsx, TodoOrderModal.tsx
│   ├── CreatePost.tsx (모달 컴포넌트), Calendar.tsx, NoticeArea.tsx
│   ├── LeaveManager.tsx, TodoRequestBadge.tsx, TodoRequestModal.tsx
│   ├── RecordModal.tsx           완료·휴지통 2탭 회수 모달
│   ├── ChatInput.tsx, ChatExpand.tsx, AiBadge.tsx   홈 상단 자연어 입력 (6)
├── hooks/
│   ├── useEscClose.ts, useVisibilityTooltip.ts
├── store/
│   ├── authStore.ts, postStore.ts, panelStore.ts
│   ├── userStore.ts, leaveStore.ts, toastStore.ts, todoRequestStore.ts
│   ├── chatInputStore.ts                  홈 채팅 입력 상태·ChatMessage I/O
│   ├── voteStore.ts, adminVoteStore.ts
└── lib/
    ├── firebase.ts
    ├── parseIntent.ts                     AI 캡처 entry (LLM stub)
    ├── parseLocal.ts                      1단 규칙 파서 (4축)
    └── voteCalculator.ts

tests/
├── e2e/
│   ├── chat-input-s6.spec.ts              6 홈 채팅 입력 회귀 스위트 (세션 #65 · 23 시나리오)
│   └── helpers/chat-input.ts              admin 패널 seed · cleanup · 고정 시간 · programmatic click
└── smoke/                                 기존 smoke specs
```

---

## 5. MD 인벤토리 (거버넌스·도메인 문서)

실측 기준: 2026-04-24. 재실측은 세션 시작 시 필요 판단에 따라 Code에 요청.

### 5-1. 오너 승인 후 고치는 문서

**거버넌스 층은 이 폴더에 없다** — 부모 폴더(`dev/`)의 저장소에 있고, 이 폴더의 MD는 전부 도메인 층이다(거버넌스 `rules.md` 4-2). 아래 셋만 앱의 규약을 담아 자율 수정 대상이 아니다.

| 경로 | 역할 |
|---|---|
| CLAUDE.md | 앱 진입점 — 한 줄 목적·폴더 트리·거버넌스 층 이름 |
| md/core/session.md | 세션 시작에 읽는 것 (종료 절차는 거버넌스가 단일 출처) |
| md/core/board-principles.md | 근본 원칙 |
| .harness/MEMORY.md | 사례 기록 (헤더 규약·운영 조항만 승인 대상) |

### 5-2. 도메인 층 — 코어

| 경로 | 역할 |
|---|---|
| md/core/coding-rules.md | 코딩 실행 전 체크리스트 |
| md/core/coding-rules-detail.md | 코딩 규칙 상세 (S1~S9) |
| md/core/state-flows.md | 상태 전환 연쇄 요구사항 |
| md/core/state-flows-detail.md | flows 상세 |
| md/core/master.md | 구조 인덱스 (본 파일) |
| md/core/master-schema.md | Firestore 스키마 상세 |
| md/core/master-debt.md | 기술 부채 이력 |
| md/core/master-bugs.md | 버그 이력 |

### 5-3. 도메인 층 — UI

| 경로 | 역할 |
|---|---|
| md/ui/component-patterns.md | UI 패턴 |
| md/ui/component-patterns-modal.md | 모달 패턴 상세 |
| md/ui/uxui.md | UI 스타일·토큰 |
| md/ui/ux-rules.md | UX 설계 원칙 |

### 5-4. 도메인 층 — 계획·설계

| 경로 | 역할 |
|---|---|
| md/plan/roadmap.md | 로드맵 |
| md/plan/vote-system.md | hana-vote 설계 |
| md/plan/designs/main-ux.md | 메인 UX 블록 ①~⑤ 설계 |
| md/plan/designs/ai-capture-hb.md | 6 자연어 캡처 설계 |
| md/plan/designs/calendar-filter.md | 달력 필터 설계 |
| md/plan/designs/calendar-visual.md | 달력 비주얼 설계 |
| md/plan/designs/header.md | 헤더 설계 |
| md/plan/designs/mydesk.md | MY DESK 설계 |
| md/plan/designs/profile.md | 프로필 설계 |

### 5-5. 로그

| 경로 | 역할 |
|---|---|
| md/log/todo.md | 할 일 + 현재상태 (공장 1-6마다 갱신, 완료분 삭제, 구조 규약 5구간 순서) |
| md/log/done.md | 완료 로그 (공장 1-6마다 append, 500줄 임계 자동 분할) |
| md/archive/progress-2026-04-A.md ~ U.md | 과거 세션 아카이브 (21개, 세션 #1~#66) |
| md/archive/progress-final-2026-04-24.md | 세션 #67~#68 상세 (progress.md 폐기 시점 이관본) |

### 5-6. 실측 기준 유령 후보 (별도 세션에서 정리)

- md/core/inbox-additions-session7.md (2026-04-16 이후 미변경, 참조 없음)
- md/core/master-operator.md (2026-04-16 이후 미변경, 참조 없음)
- md/log/log.md (2026-04-15 이후 미변경, 과거 progress.md와 역할 중복 의심 — progress.md는 2026-04-24 archive 이관됨)

---

## 6. 파일 의존성 맵

```
ChatInput.tsx → ChatExpand.tsx → AiBadge.tsx / chatInputStore.ts → parseIntent.ts → parseLocal.ts
ChatInput.tsx → app/(main)/page.tsx 상단 배치 (6, U14, P9)
chatInputStore.ts → chatMessages 컬렉션 + posts/calendarEvents 4필드 (sourceMessageId·parseStage·confidence·inputSource)
Panel.tsx → TodoList.tsx / PostList.tsx / Calendar.tsx / common/FAB.tsx / RecordModal.tsx / CompletedRecentSection.tsx
TodoList.tsx → TodoItem.tsx / postStore.ts
CompletedRecentSection.tsx → postStore.ts (archivePost·uncompletePost) / todoRequestStore.ts (reactivateRequest cascade) / postSelectors.ts (selectRecentCompletedTop5)
request/RequestView.tsx → todoRequestStore.ts (acceptRequest/rejectRequest/cancelRequest/completeRequest) / postStore.ts (addPost cascade) / RequestSegment·RequestFilterBar·RequestSortDropdown·RequestBulkBar·RequestList·RequestDetailPopup
PostList.tsx → PostItem.tsx / postStore.ts
PostItem.tsx → PostEditModal.tsx → common/ImageViewer.tsx
TodoItem.tsx → TodoEditModal.tsx → common/ImageViewer.tsx
TodoItem.tsx → TodoOrderModal.tsx
TodoItem.tsx / PostItem.tsx → 스와이프 제스처 (Pointer Events, P9) → postStore.ts
common/FAB.tsx → CreatePost.tsx (모달) / Calendar.tsx 일정 생성 모달 (context-aware)
RecordModal.tsx → postStore.ts (24h 창 쿼리 + 복원)
TodoRequestModal.tsx → todoRequestStore.ts / TodoRequestBadge.tsx
TodoRequestBadge.tsx → todoRequestStore.ts (seenAt 기반 배지 카운트)
Calendar.tsx → todoRequestStore.ts / leaveStore.ts / panel scope 토글
CreatePost.tsx → todoRequestStore.ts / Calendar.tsx (모달 컴포넌트로 리팩터링)
새 모달 → useEscClose 훅 필수
이미지 표시 → common/ImageViewer 필수 (R8.6)
```

---

## 7. 패널 설정

```
panel-1: 유미정  alwjd7175@gmail.com
panel-2: 조향래  kkjspfox@naver.com
panel-3: 김진우  oilpig85@gmail.com
panel-4: 우희훈  heehun96@naver.com
panel-5: 한다슬  ektmf335@gmail.com
panel-6: 홍아현  we4458@naver.com
admin:   admin@company.com / admin1234!
```

---

## 8. Firestore Rules 요약

```
posts / panels / calendarEvents / leaveSettings / leaveEvents / todoRequests:
  읽기/생성/수정/삭제 → request.auth != null
chatMessages:
  읽기/생성/수정 → request.auth != null
  삭제 → 금지 (soft delete — deleted=true / deletedAt 세팅)
users:
  읽기 → request.auth != null
  쓰기 → 본인 또는 admin만
```

---

## 9. 컴포넌트 파일 분리 기준

```
아래 중 하나에 해당하면 분리 검토:
  □ 300줄 초과
  □ 역할이 2개 이상
  □ 같은 로직이 2개 컴포넌트에 중복 등장
분리 전 오너에게 경우의 수 제시 후 승인 받아 진행
```

---

## 10. CLI 명령어

```bash
npm run build       # 빌드 — prebuild 가 public/version.txt 를 먼저 찍는다
npm run lint        # 정적 검사
npm run test:unit   # 단위 검사 (vitest)
npx firebase-tools deploy --only firestore:rules --project hizzi-board   # rules 만
```

**위 셋이 공정 1-3 이고 하나씩 단독으로 부른다** — 파이프에 물리면 종료값이 뒤엣것 것으로 바뀌어 붉음이 조용히 삼켜진다.

**여기 배포 줄을 두지 않는다.** 배포는 두 걸음이고 사이에 오너 승인이 서므로 아래 두 절이 자리다 — 한 줄로 묶으면 그 승인 자리가 없어진다.

**옛 줄 둘을 걷었다 (2026-08-19 hizzifix).** `git add . && git commit && npx vercel --prod` 과 `Remove-Item -Recurse -Force .next` 다. 걷은 사유는 낡아서가 아니라 **공장이 원리상 못 치는 줄이어서**다:

- `git add .` 은 층 floor 밴드(`harness.md` 2-5)가 막는다 — 커밋은 pathspec 으로 한다(`git commit <경로>`). 남의 미커밋까지 섞인 커밋이 그렇게 났다.
- `Remove-Item -Recurse -Force` 는 층 3-5 가 이름으로 막는다(정션을 따라가 링크 **원본**을 지운다). bash 로 옮겨 적은 `rm -rf .next` 도 deny floor라 같은 자리다.
- `npx vercel --prod` 는 아래 고객 배포 절이 받는다.

**그래서 클린 빌드는 이 문서가 명령으로 주지 않는다.** 공장이 칠 수 있는 대체 경로를 아직 안 쟀다 — **오너 손이거나 도구를 세울 자리**이고, 세우기 전에는 "없다"가 아니라 **"아직 통로가 없다"**다.

### 미리보기 — 주소를 어떻게 받나 (2026-08-18)

공정 1-6 은 미리보기까지이고, 고객 배포는 그 뒤 오너가 승인하는 자리다.

**방아쇠는 세울 것이 없다 — 가지를 push 하면 Vercel 이 Preview 를 스스로 건다.** Git 연동이 살아 있다(2026-08-18 실측).

**다만 막는 줄이 하나 생겼다 (2026-08-19).** `vercel.json` 이 그날 서면서 MD 만 바뀐 push 는 빌드가 취소된다 — 이 절 아래 "MD 만 바뀐 push" 절이 그 잣대를 든다. **옛 문장은 그 파일이 없다고 적고 있었고 그것은 이제 사실이 아니다.**

**그런데 지금 그 빌드는 안 선다** — 걸리는 자리가 방아쇠가 아니라 환경변수이고, 아래 buildfail 문단이 그 값을 든다. **이 절은 통로를 적어 두는 자리이지 지금 된다는 뜻이 아니다.** 통로부터 적는다.

```bash
SHA=$(git rev-parse HEAD)   # 방금 push 한 그 커밋
gh api "repos/rehobot-plan/hizzi-board/deployments?environment=Preview&sha=$SHA&per_page=1" --jq '.[0].statuses_url'
gh api "{위에서 받은 statuses_url}" --jq '.[0] | {state, environment_url}'
```

뒤 줄이 내는 `environment_url` 이 미리보기 주소다(실측 왕복 확인 · 형태는 `https://hizzi-board-{빌드id}-rehobot.vercel.app`).

**`sha` 를 반드시 건다.** 안 걸면 저장소에서 **가장 최근** Preview 가 오는데, 레인 병렬이 기본이라 그것이 남의 가지 배포일 수 있다 — 자기 것으로 읽으면 안 바뀐 화면을 보고 통과로 적는다(Vercel 이 배포의 `ref` 에 가지 이름이 아니라 커밋 해시를 넣으므로 `sha` 로 건다).

**`state` 를 먼저 본다.** `success` 가 아니면 그 배포에는 볼 것이 없다. **그런데 그 주소는 열린다 — 이것이 이 절에서 가장 무는 자리다.**

**실패한 배포도 200 을 낸다 (2026-08-19 hizzifix 실측).** 지금까지 선 Preview 넷(아래 buildfail 문단이 그 넷을 든다) 중 가장 최근 것(`https://hizzi-board-65qpsr8u4-rehobot.vercel.app`)에서 `/` **200** · `/version.txt` **200** 이고, 둘 다 이 앱 화면이 아니라 **Vercel 이 세우는 자리표 HTML** 이다(본문이 `instant-preview-site.vercel.app` 의 자산을 부른다). 열리지 않는 것이 아니라 **다른 것이 열린다.**

**그래서 상태 코드로는 못 가른다.** `curl -o /dev/null -w '%{http_code}'` 만 보면 실패한 배포가 성한 배포와 같은 값을 낸다. `state` 를 먼저 보라는 위 줄이 지금 이 자리를 막는 **유일한 것**이다.

**판번호도 같은 자리에서 거짓으로 통과한다.** 아래 `curl {주소}/version.txt` 는 그 자리에서 200 과 함께 HTML 을 돌려준다 — **부르는 쪽이 "응답이 왔다"로 읽으면 통과가 된다.** 그러므로 **받은 것이 판번호인지 본문으로 묻는다**: `{해시 12자}-{숫자}` 나 `dev-{숫자}` 꼴 한 줄인가. `<` 로 시작하면 그것은 판번호가 아니라 화면이다.

**같은 모양이 르호봇에서 이미 났다** — `check-deploy.mjs` 가 **로그인 화면(200·본문 있음)을 판번호로 세고** 있었다. 그때 고친 자리는 "인증벽 무늬를 늘리기"가 아니라 **"본문이 판번호인지 먼저 묻기"** 였다. **이 앱은 그 검사를 기계가 안 지고 손으로 `curl` 을 치는 통로라, 묻는 몫이 사람에게 있다** — 그래서 이 문단이 그 몫을 대신 진다.

**그 자리를 실제로 밟았다 (buildfail 2026-08-18 실측).** 지금까지 선 Preview **넷이 전부 `failure`** 이고 같은 날 Production **셋은 전부 `success`** 다. 코드가 아니라 환경이 갈랐다 — Preview 빌드 로그 넷이 다 `FirebaseError: auth/invalid-api-key` 로 프리렌더에서 죽었고(전수 확인), 그 프로젝트의 환경변수가 **Production 여섯 · Development 다섯 · Preview 0** 이다. **Preview 에 변수가 하나도 없어 그 대상 빌드는 원리상 안 선다.**

**그 자리는 닫혔다 (2026-08-19 · 오너가 대시보드에서 채웠다).** 여섯 전부 `Production, Preview` 로 섰다(`npx vercel env ls --scope rehobot --project hizzi-board` 실측). 곁들여 `NEXT_PUBLIC_FIREBASE_API_KEY` 는 여전히 `Development` 행이 없다 — 이 실패와 무관하나 남은 자리다.

**빌드 로그는 GitHub 에 안 실린다** — 배포 상태의 `log_url` 이 배포 주소 자체이고, 사유는 그 응답의 `description` 이 부르는 줄로 읽는다.

```bash
gh api "{statuses_url}" --jq '.[0].description'   # dpl_… 를 얻는다
npx vercel inspect {dpl_id} --logs --scope rehobot
```

**`--scope` 만 주면 이어 두지 않아도 읽힌다** — 이 저장소에는 `.vercel/` 이 없다(무시 대상이라 기계마다 따로 선다). 환경변수를 볼 때만 `--project hizzi-board` 를 함께 준다.

**그 주소가 어느 커밋인지는 판번호로 묻는다.**

```bash
curl {미리보기주소}/version.txt      # {커밋해시 앞 12자}-{빌드 시각}
```

`prebuild`(`scripts/stamp-version.js`)가 빌드마다 찍고, 그 파일은 git 추적 밖이다(`.gitignore`). 시각을 섞는 것은 **같은 커밋을 다시 배포하거나 되돌린 자리를 해시만으로는 못 가르기** 때문이다.

**`dev-…` 로 오면 git 커밋이 부른 배포가 아니다** — Vercel 은 그 자리에서 `VERCEL_GIT_COMMIT_SHA` 를 빈 문자열로 준다(CLI 로 손수 올린 배포·로컬 빌드가 그렇다).

### 고객 배포 — 언제, 무엇으로 (2026-08-19)

**오너 승인 뒤에만 돈다.** 미리보기 주소를 들고 "이대로 고객 배포할까요"를 묻고 멈춘다. 묻지 않고 넘어가지 않는다(층 `harness.md` 1-6).

**이 앱의 기본 가지는 `master` 다.** `main` 이라는 가지는 이 저장소에 로컬에도 원격에도 없다(2026-08-19 실측 — `git rev-parse --verify main` 종료값 128 · `git ls-remote --heads origin` 이 `refs/heads/master` 한 줄).

```bash
git push origin master     # 이 push 가 곧 고객 배포다 (Vercel Git 연동)
```

**Vercel CLI 를 부르지 않는다.** `npx vercel --prod` 는 같은 것을 손으로 한 번 더 하는 것이고, 그 자리는 Git 연동이 이미 진다 — 실측으로 2026-08-18 Production 배포 여섯의 `ref` 가 전부 `master` 커밋 해시였다. **CLI 는 연동이 끊겼을 때의 비상 통로로만 남긴다.**

**나간 것이 무엇인지는 판번호로 묻는다** — `curl https://hizzi-board.vercel.app/version.txt` 의 앞 12자가 그 커밋인지 본다(2026-08-19 실측 — `362bfd4741db-1787048347649` 이고 앞 12자가 그때 `HEAD` 와 같았다). **여기서도 받은 것이 판번호인지 본문으로 먼저 묻는다**(위 미리보기 절).

**MD 만 바뀐 회차는 배포 걸음을 안 밟는다** (오너 결정 2026-08-19). 공정 6단계는 그대로 다 밟되 이 절이 비해당이다. **완료 보고에는 "비해당 — MD 전용"으로 적고 빈칸으로 두지 않는다.**

### MD 만 바뀐 push 는 빌드가 안 선다 (2026-08-19)

**push 했는데 새 배포가 안 뜨거나 `Canceled` 로 뜨는 것이 정상일 수 있다.** 이 절을 먼저 읽고 고장으로 읽지 않는다.

**무엇이 그러나** — 저장소 뿌리의 `vercel.json` 이 `ignoreCommand` 를 든다. 판정은 그 파일이 정본이고 여기 옮겨 적지 않는다. 담기는 무늬만 값으로 적는다.

- `md/` 아래의 `.md` 파일 — 예로 `md/core/master.md`.
- 뿌리에 바로 놓인 `.md` 파일 — 예로 `CLAUDE.md`.
- **그 둘 밖은 안 담긴다.** 다른 최상위 폴더 아래의 `.md`(예로 `docs/x.md`)는 MD 라도 빌드를 세운다.

**종료값 뜻은 Vercel 이 정한다** — 원문 그대로 "If the command exits with code `1`, the build continues as normal" · "If the command exits with code `0`, the build is immediately aborted, and the deployment state is set to `CANCELED`". 그래서 **화면에 배포가 아예 안 뜨는 것이 아니라 `Canceled` 로 뜬다.**

**취소된 빌드도 셈에는 들어간다** — 같은 문서가 "Canceled builds are counted as full deployments" 라 적는다. 이 스킵이 아끼는 것은 배포 건수가 아니라 **고객에게 나가는 것**이다.

**왜 세웠나** — MD 만 바뀐 push 가 고객 배포를 만들던 자리를 막는다(오너 결정 2026-08-19). 위 고객 배포 절이 적는 "MD 만 바뀐 회차는 배포 걸음을 안 밟는다"를 사람 기억이 아니라 기계가 지게 한 것이다.

**잣대를 틀리게 읽기 쉽다. 가르는 물음이 이것이다.**

- 아니다 — "내가 지금 미는 그 커밋이 MD 만인가."
- 맞다 — **"마지막 성공 배포 이후 누적이 전부 MD 인가."**

기준점은 `VERCEL_GIT_PREVIOUS_SHA` 이고 Vercel 원문이 "The git SHA of the last successful deployment for the project and branch" 라 적는다. **부모 커밋이 아니다.** 그리고 **가지마다 따로다** — 다른 가지의 성공 배포는 기준이 안 된다.

**실제로 그 자리에 물린 회차가 있다 (2026-08-19).** 원장만 담긴 커밋을 밀었는데 배포가 났다. 그 앞 머지 커밋에 코드가 있어 **누적에 코드가 섞였기** 때문이다. 그 사람은 "MD 만 밀었는데 왜 나갔나"에서 헛돌았다.

**손으로 재는 법** — 그 배포가 물었을 기준을 잡고 누적을 직접 본다.

```bash
git diff --name-only {마지막 성공 배포 SHA} HEAD
```

**빌드를 세우는 쪽으로 떨어지는 갈래가 넷 있다.** 판정이 안 서면 스킵하지 않고 짓는다.

- `VERCEL_GIT_PREVIOUS_SHA` 가 비었다. 그 가지에 성공 배포가 아직 없으면 그렇다.
- 그 커밋이 빌드 클론에 없다.
- 누적 diff 가 실패한다.
- 변경 파일 목록이 비었다.

**모르면 짓는 쪽이 안전측이다** — 반대로 두면 안 나가야 할 것이 조용히 안 나간다.

**이 스킵이 닫는 것과 안 닫는 것을 가른다.**

- 닫는 것 — 원장만 올리는 push. 그 회차는 고객에게 아무것도 안 나간다.
- **안 닫는 것 — 통합 push.** 코드가 섞이면 누적에 걸려 그대로 나간다.

**그러므로 고객 배포 승인 자리는 그대로 열려 있다.** 이 스킵이 있으니 승인이 필요 없다고 읽지 않는다 — 위 고객 배포 절이 그 자리를 진다.

**안 나가는 갈래와 못 나가는 갈래는 다른 것이다.** 이 앱에는 미리보기 빌드가 **실패하는** 별건이 따로 열려 있다(`md/log/todo.md` 미해결 — Preview 환경변수 0개 · 대시보드 자리라 저장소에서 못 닫는다). 가르는 법은 상태다.

- 이 스킵 — 배포 상태가 `CANCELED` 다. 빌드가 서지 않았다.
- 그 별건 — 배포 상태가 `failure` 이고 빌드 로그에 `auth/invalid-api-key` 가 남는다. 빌드가 서다가 죽었다.

### 1-5 E2E — 자산은 있고 부르는 줄이 없다 (2026-08-19)

**층 `harness.md` 3-7 표가 이 앱의 1-5 를 "없음"으로 적는다. 그 "없음"은 부르는 줄이 없다는 뜻이지 자산이 없다는 뜻이 아니다** — 읽는 쪽이 자산으로 읽으면 이 폴더를 안 열고 지나간다(2026-08-19 에 실제로 그렇게 읽혔다).

**이 저장소에 있는 것 (2026-08-19 실측 · 값)**

| 무엇 | 자리 | 수 |
|---|---|---|
| Playwright 설정 | `playwright.config.ts` | 1 |
| E2E spec | `tests/e2e/` (`chat-input-s6` · `h1-route-group` · `mydesk-phase2/` 4 · `mydesk-phase3/` 1) | 7 |
| smoke spec | `tests/smoke/` | 25 |
| 단위 검사 | `tests/unit/` (vitest — 1-3 이 부른다) | 7 |

**없는 것은 부르는 줄 하나다.** `package.json` 의 `scripts` 아홉(`dev`·`prebuild`·`build`·`start`·`lint`·`copy-time-pad`·`clear-posts`·`test:unit`·`test:unit:watch`)에 playwright 항목이 없고, 르호봇 `run-e2e.mjs`·하나교회 `tests/e2e_check.py` 에 해당하는 러너도 이 저장소에 없다.

**여기 그 줄을 지어 적지 않는다.** 러너를 세울지는 오너 자리이고, 세우기 전에 문서가 명령을 먼저 적으면 **다음 사람이 그것을 있는 통로로 읽는다**(이 문서가 방금 걷어 낸 옛 배포 줄이 정확히 그 모양이었다).

**설정 하나를 함께 적어 둔다** — `playwright.config.ts` 의 `baseURL` 기본값이 **프로덕션 라이브 주소**(`https://hizzi-board.vercel.app`)다. 층 `harness.md` 1-5 는 *"대상은 로컬호스트 프로덕션 빌드 서버 … dev 서버·라이브 URL 대상 금지"* 라고 적는다. **둘이 어긋나 보이지만 지금은 부딪히지 않는다** — 이 앱의 1-5 가 공정에 안 서 있어서다. **러너를 세우는 회차가 그 자리를 먼저 갈라야 한다.**

**`playwright-login.spec.js` 는 저장소 루트에 있고 `testDir: './tests'` 밖이라 어느 줄로도 안 돌아간다**(2026-08-19 실측). 이 사실은 살아 있고, 그것을 지목하던 원장 항목의 **지목 대상**만 사라졌다(`md/log/todo.md` 그 줄이 이 회차에 고쳐졌다).

---

## 11. 로드맵

```
Phase 1 (현재): Hizzi Board 안정화
Phase 2:        AI 채팅 패널 연동
Phase 3:        Rehobot UI/UX 재구축 + 상용화
Phase 4:        개인/기업 듀얼 채널
```
