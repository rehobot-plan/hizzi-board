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
프로젝트 루트:     D:\Dropbox\Dropbox\hizzi-board
Firebase 프로젝트: hizzi-board
serviceAccount:    D:\Dropbox\Dropbox\serviceAccount.json
```

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
│   ├── Panel.tsx, TodoList.tsx, CompletedTodo.tsx, PostList.tsx
│   ├── PostItem.tsx, PostEditModal.tsx
│   ├── TodoItem.tsx, TodoEditModal.tsx, TodoOrderModal.tsx
│   ├── CreatePost.tsx (모달 컴포넌트), Calendar.tsx, NoticeArea.tsx
│   ├── LeaveManager.tsx, TodoRequestBadge.tsx, TodoRequestModal.tsx
│   ├── RecordModal.tsx           완료·휴지통 2탭 회수 모달
│   ├── ChatInput.tsx, ChatExpand.tsx, AiBadge.tsx   홈 상단 자연어 입력 (§6)
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
│   ├── chat-input-s6.spec.ts              §6 홈 채팅 입력 회귀 스위트 (세션 #65 · 23 시나리오)
│   └── helpers/chat-input.ts              admin 패널 seed · cleanup · 고정 시간 · programmatic click
└── smoke/                                 기존 smoke specs
```

---

## 5. MD 인벤토리 (거버넌스·도메인 문서)

실측 기준: 2026-04-24. 재실측은 세션 시작 시 필요 판단에 따라 Code에 요청.

### 5-1. 거버넌스 층 (CLAUDE.md [7])

| 경로 | 역할 |
|---|---|
| CLAUDE.md | 진입점·역할·소통 원칙·파일 지도 |
| md/core/session.md | 세션 경계 절차 (시작·종료·프리셋) |
| md/core/harness.md | 공장 6단계 실행·검증 매뉴얼 |
| md/core/principles.md | 근본 원칙 |
| .harness/MEMORY.md | 사례 박제 (헤더 규약·운영 조항만 거버넌스) |

### 5-2. 도메인 층 — 코어

| 경로 | 역할 |
|---|---|
| md/core/rules.md | 코딩 실행 전 체크리스트 |
| md/core/rules-detail.md | 코딩 규칙 상세 (S1~S9) |
| md/core/flows.md | 상태 전환 연쇄 요구사항 |
| md/core/flows-detail.md | flows 상세 |
| md/core/master.md | 구조 인덱스 (본 파일) |
| md/core/master-schema.md | Firestore 스키마 상세 |
| md/core/master-debt.md | 기술 부채 이력 |
| md/core/master-bugs.md | 버그 이력 |

### 5-3. 도메인 층 — UI

| 경로 | 역할 |
|---|---|
| md/ui/patterns.md | UI 패턴 |
| md/ui/patterns-modal.md | 모달 패턴 상세 |
| md/ui/uxui.md | UI 스타일·토큰 |
| md/ui/ux-principles.md | UX 설계 원칙 |

### 5-4. 도메인 층 — 계획·설계

| 경로 | 역할 |
|---|---|
| md/plan/roadmap.md | 로드맵 |
| md/plan/vote-system.md | hana-vote 설계 |
| md/plan/designs/main-ux.md | 메인 UX 블록 ①~⑤ 설계 |
| md/plan/designs/ai-capture-hb.md | §6 자연어 캡처 설계 |
| md/plan/designs/calendar-filter.md | 달력 필터 설계 |
| md/plan/designs/calendar-visual.md | 달력 비주얼 설계 |
| md/plan/designs/header.md | 헤더 설계 |
| md/plan/designs/mydesk.md | MY DESK 설계 |
| md/plan/designs/profile.md | 프로필 설계 |

### 5-5. 로그

| 경로 | 역할 |
|---|---|
| md/log/progress.md | 세션 진행 기록 (공장이 1-6마다 append) |
| md/archive/progress-2026-04-A.md ~ U.md | 과거 세션 아카이브 (21개) |

### 5-6. 실측 기준 유령 후보 (별도 세션에서 정리)

- md/core/inbox-additions-session7.md (2026-04-16 이후 미변경, 참조 없음)
- md/core/master-operator.md (2026-04-16 이후 미변경, 참조 없음)
- md/log/log.md (2026-04-15 이후 미변경, progress.md와 역할 중복 의심)

---

## 6. 파일 의존성 맵

```
ChatInput.tsx → ChatExpand.tsx → AiBadge.tsx / chatInputStore.ts → parseIntent.ts → parseLocal.ts
ChatInput.tsx → app/(main)/page.tsx 상단 배치 (§6, U14, P9)
chatInputStore.ts → chatMessages 컬렉션 + posts/calendarEvents 4필드 (sourceMessageId·parseStage·confidence·inputSource)
Panel.tsx → TodoList.tsx / PostList.tsx / Calendar.tsx / common/FAB.tsx / RecordModal.tsx
TodoList.tsx → TodoItem.tsx / CompletedTodo.tsx / postStore.ts
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

```powershell
npm run build                                          # 기본 빌드
Remove-Item -Recurse -Force .next; npm run build       # 클린 빌드
git add . && git commit -m "message" && npx vercel --prod  # 배포
npx firebase-tools deploy --only firestore:rules --project hizzi-board  # rules만
```

---

## 11. 로드맵

```
Phase 1 (현재): Hizzi Board 안정화
Phase 2:        AI 채팅 패널 연동
Phase 3:        Rehobot UI/UX 재구축 + 상용화
Phase 4:        개인/기업 듀얼 채널
```
