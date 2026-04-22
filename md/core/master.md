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
├── hooks/
│   ├── useEscClose.ts, useVisibilityTooltip.ts
├── store/
│   ├── authStore.ts, postStore.ts, panelStore.ts
│   ├── userStore.ts, leaveStore.ts, toastStore.ts, todoRequestStore.ts
│   ├── voteStore.ts, adminVoteStore.ts
└── lib/
    ├── firebase.ts
    └── voteCalculator.ts
```

---

## 5. 파일 의존성 맵

```
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

## 6. 패널 설정

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

## 7. Firestore Rules 요약

```
posts / panels / calendarEvents / leaveSettings / leaveEvents / todoRequests:
  읽기/생성/수정/삭제 → request.auth != null
users:
  읽기 → request.auth != null
  쓰기 → 본인 또는 admin만
```

---

## 8. 컴포넌트 파일 분리 기준

```
아래 중 하나에 해당하면 분리 검토:
  □ 300줄 초과
  □ 역할이 2개 이상
  □ 같은 로직이 2개 컴포넌트에 중복 등장
분리 전 오너에게 경우의 수 제시 후 승인 받아 진행
```

---

## 9. CLI 명령어

```powershell
npm run build                                          # 기본 빌드
Remove-Item -Recurse -Force .next; npm run build       # 클린 빌드
git add . && git commit -m "message" && npx vercel --prod  # 배포
npx firebase-tools deploy --only firestore:rules --project hizzi-board  # rules만
```

---

## 10. 로드맵

```
Phase 1 (현재): Hizzi Board 안정화
Phase 2:        AI 채팅 패널 연동
Phase 3:        Rehobot UI/UX 재구축 + 상용화
Phase 4:        개인/기업 듀얼 채널
```
