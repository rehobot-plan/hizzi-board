# 히찌보드 — 마스터 문서

> **새 세션 시작 방법:**
> hizzi-session.md의 "새 세션 시작 방법" 섹션 참조.
> 7개 MD 첨부 후 세션 프롬프트 붙여넣기.

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

## 2. 협업 워크플로우

```
오너 (방향 결정) → Claude.ai (설계·제안·실행) → Claude Code (코드 적용) → 오너 (확인)

Claude.ai 작업 순서:
  1. hizzi-rules.md 마스터 체크리스트 확인
  2. hizzi-flows.md 영향 범위 파악
  3. UI 관련 시 hizzi-patterns.md + hizzi-ux-principles.md 확인
  4. 설계 → 명령 블록 작성
  5. Claude Code 실행 → 결과 보고

명령 블록 실행:
  빌드 에러 시만 중단 + 보고
  정상 빌드 → commit + deploy 자동 진행
```

---

## 3. 기술 부채 트래커

### ✅ 해결됨
| 날짜 | 항목 |
|------|------|
| 2026.04.03 | useEscClose — 전체 모달 ESC 핸들러 |
| 2026.04.05 | Panel.tsx 분리 → TodoList / CompletedTodo / PostList |
| 2026.04.05 | deletePost 낙관적 업데이트 (ghost 재렌더 수정) |
| 2026.04.05 | PostItem / TodoItem editVisibility: author 확인 + specific 옵션 |
| 2026.04.05 | CreatePost: specific visibleTo에 author 포함 |
| 2026.04.05 | 에러 처리: 모든 catch → addToast 통일 |
| 2026.04.05 | any 제거: PostUpdates / NewTodoRequestDoc 등 전체 |
| 2026.04.05 | toastStore: { message, type } 객체 수신 확장 |
| 2026.04.05 | useVisibilityTooltip 훅: PostItem / TodoItem |
| 2026.04.05 | postStore addPost 낙관적 업데이트 + pending 문서 방어 |
| 2026.04.05 | 메모 soft delete + 삭제된 메모 섹션 |
| 2026.04.05 | PostItem 태그 표시 (업무/개인, 전체/나만/특정인) |
| 2026.04.06 | CreatePost 3탭 재설계 (할일/메모/요청 고정) |
| 2026.04.06 | 할일 title/content 분리 (Phase 3 선행) + 하위호환 |
| 2026.04.06 | Post 타입 dueDate/title 필드 추가 |
| 2026.04.06 | CreatePost 헤더 실시간 제목 반영 |
| 2026.04.06 | 기한 yyyymmdd + 달력 아이콘 (할일/요청) |
| 2026.04.06 | 캘린더 등록 체크박스 (할일 탭) |
| 2026.04.06 | 요청 범위 3종 (요청자+수신자/전체공개/특정) |
| 2026.04.06 | TodoList activeFilter 필터링 수정 |
| 2026.04.06 | 할일 정렬 기준 적용 |
| 2026.04.06 | PostItem 메모 아이템 할일 패턴 통일 |
| 2026.04.06 | 삭제된 메모 복구 버튼 (PostList) |
| 2026.04.07 | TodoItem 일반 할일 팝업 기한 + 캘린더 등록 추가 |
| 2026.04.07 | TodoItem 요청 할일 팝업 삭제 버튼 (cascade) |
| 2026.04.07 | (post as any).dueDate → post.dueDate 타입 정리 |
| 2026.04.07 | CreatePost 캘린더 아이콘 hover 색상 활성화 |
| 2026.04.07 | MD 전면 재작업 — 한글화 / 7파일 체계 확립 |
| 2026.04.08 | PostItem: P8 키-값 테이블형 팝업 교체 |
| 2026.04.08 | PostItem: editContent 저장 버그 수정 |
| 2026.04.08 | PostItem: 첨부파일 deleteField 처리 + 신규 추가 분기 |
| 2026.04.08 | PostItem: 첨부파일 UI 열기/삭제 통일 (교체 제거) |
| 2026.04.08 | TodoItem: P8 일반 할일 팝업 키-값 테이블형 교체 |
| 2026.04.08 | TodoItem: dueDate YYYYMMDD → YYYY-MM-DD 변환 |
| 2026.04.08 | TodoItem: 이미지 할일 제목+이미지 함께 표시 |
| 2026.04.08 | TodoItem: 캘린더 등록 체크박스 항상 표시 + 중복 확인 |
| 2026.04.08 | TodoItem: 첨부파일 열기/삭제 UI 통일 |
| 2026.04.08 | page.tsx: 한글 인코딩 전면 복원 |
| 2026.04.08 | users 컬렉션 6명 + 관리자 Firestore 재삽입 |
| 2026.04.08 | panelStore: initPanelListener 패턴 전환 + addToast 통일 + swapPanels 낙관적 업데이트/롤백 |
| 2026.04.08 | userStore: initUserListener 패턴 전환 + addToast 통일 + deleteUser 낙관적 업데이트/롤백 |
| 2026.04.08 | leaveStore: initLeaveListener 패턴 전환 + addToast 통일 + stripUndefined 적용 |
| 2026.04.08 | 로그인 직후 stale 렌더 구조적 해결 (Panel 1/2/3 / From admin 표시 버그) |
| 2026.04.08 | 연차 페이지 새로고침 Loading 멈춤 해결 |
| 2026.04.08 | LeaveManager leaveLoading 게이트 추가 (입사일 공란 / 설정저장 무반응 버그) |
| 2026.04.08 | page.tsx: initLeaveListener 추가 — 관리자 모드 연차 관리 탭 연동 |

### 🔴 진행 중 (다음 세션)
```
1. PostItem.tsx — 분리 (PostEditModal.tsx)
2. TodoItem.tsx — 분리 (TodoEditModal.tsx)
3. 첨부파일 다중 업로드 + UI 재편
   - post.attachment → post.attachments 배열로 스키마 확장
   - 하위 호환: 기존 단일 attachment 처리 유지
   - 버튼: 저장(download) / 추가 / 삭제
   - 링크 타입: 저장 버튼 → 새탭 열기
   - 영향 파일: postStore.ts / Post 타입 / TodoItem / PostItem / CreatePost
   - 세션 시작 전 postStore.ts + Post 타입 파일 첨부 필요
4. 캘린더 자동 등록 연동 검증
5. TodoRequestModal 섹션 구조 재편
6. 댓글 기능 (todoRequests/{id}/comments)
7. 완료 알림 토스트
```

### 🟡 성장 준비
```
- 공통 Firestore save helper (stripUndefined 자동화)
- 언마운트 시 realtime listener 정리 확인
- 공통 훅 추가: useFileUpload / useIsMobile / useCanEdit
```

### 🟢 장기 (Rehobot 전)
```
- 전체 색상 토큰 CSS custom properties로 전환
- TypeScript strict mode (any 제거 완료 후)
- Calendar "편집" → "수정" 텍스트
- 특정인 hover tooltip 미작동 버그
- 멀티데이 이벤트 수정/전체삭제
```

---

## 4. 기술 스택

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

## 5. 경로

```
프로젝트 루트:     D:\Dropbox\Dropbox\hizzi-board
Firebase 프로젝트: hizzi-board
serviceAccount:    D:\Dropbox\Dropbox\serviceAccount.json
```

---

## 6. 파일 구조

```
src/
├── app/
│   ├── page.tsx                ✅ initLeaveListener 추가
│   ├── leave/page.tsx          ✅ initUserListener + initLeaveListener
│   ├── login/page.tsx
│   └── signup/page.tsx
├── components/
│   ├── Panel.tsx
│   ├── TodoList.tsx
│   ├── CompletedTodo.tsx
│   ├── PostList.tsx
│   ├── PostItem.tsx            ✅ P8 팝업 완료 — 분리 예정 (PostEditModal)
│   ├── TodoItem.tsx            ✅ P8 팝업 완료 — 분리 예정 (TodoEditModal)
│   ├── CreatePost.tsx
│   ├── Calendar.tsx
│   ├── NoticeArea.tsx
│   ├── LeaveManager.tsx
│   ├── TodoRequestBadge.tsx
│   └── TodoRequestModal.tsx
├── hooks/
│   ├── useEscClose.ts
│   └── useVisibilityTooltip.ts
├── store/
│   ├── authStore.ts
│   ├── postStore.ts            ✅ initPostListener 패턴
│   ├── panelStore.ts           ✅ initPanelListener 패턴
│   ├── userStore.ts            ✅ initUserListener 패턴
│   ├── leaveStore.ts           ✅ initLeaveListener 패턴
│   ├── toastStore.ts
│   └── todoRequestStore.ts
└── lib/
    └── firebase.ts
```

---

## 7. 파일 의존성 맵

```
Panel.tsx
  → TodoList.tsx
  → PostList.tsx

TodoList.tsx
  → TodoItem.tsx
  → CompletedTodo.tsx
  → postStore.ts

PostList.tsx
  → PostItem.tsx
  → postStore.ts

TodoItem.tsx → todoRequestStore.ts
TodoRequestModal.tsx → todoRequestStore.ts / TodoRequestBadge.tsx
Calendar.tsx → todoRequestStore.ts / leaveStore.ts
CreatePost.tsx → todoRequestStore.ts / Calendar.tsx

새 모달 → useEscClose 훅 필수

page.tsx listener 목록:
  initPostListener / initRequestListener / initPanelListener
  initUserListener / initLeaveListener

leave/page.tsx listener 목록:
  initUserListener / initLeaveListener
```

---

## 8. Firestore 데이터 스키마

### `posts`
```typescript
{
  id: string
  panelId: string
  content: string
  title?: string
  dueDate?: string           // YYYY-MM-DD 형식 (저장 시 반드시 변환)
  attachment?: { type: 'image' | 'file' | 'link'; url: string; name?: string }
  author: string
  category: string
  visibleTo: string[]
  taskType?: 'work' | 'personal'
  starred?: boolean
  starredAt?: Date | null
  completed?: boolean
  completedAt?: Date | null
  pinned?: boolean
  requestId?: string
  requestFrom?: string
  requestTitle?: string
  requestContent?: string
  requestDueDate?: string | null
  deleted?: boolean
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}
```

### `todoRequests`
```typescript
{
  id: string
  fromEmail: string
  fromPanelId: string
  toEmail: string
  toPanelId: string
  title: string
  content: string
  dueDate?: string
  visibleTo: string[]
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
  rejectReason?: string
  teamLabel?: string
  teamRequestId?: string
  createdAt: Date
  resolvedAt?: Date | null
}
```

### `calendarEvents`
```typescript
{
  id: string
  title: string
  startDate: string          // YYYY-MM-DD 형식
  endDate: string
  authorId: string
  authorName: string
  color: string
  createdAt: Date
  repeat?: { type: string; weeklyDay: string; excludeHolidays: boolean; endType: string; endDate: string; endCount: number }
  repeatGroupId?: string
  requestId?: string
  requestFrom?: string
  requestTitle?: string
  teamRequestId?: string
  taskType?: string
  visibility?: string
}
```

---

## 9. 패널 설정

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

## 10. Firestore Rules 요약

```
posts / panels / calendarEvents / leaveSettings / leaveEvents / todoRequests:
  읽기/생성/수정/삭제 → request.auth != null
users:
  읽기 → request.auth != null
  쓰기 → 본인 또는 admin만
```

---

## 11. 컴포넌트 파일 분리 기준

```
아래 중 하나에 해당하면 분리 검토:
  □ 300줄 초과
  □ 역할이 2개 이상
  □ 같은 로직이 2개 컴포넌트에 중복 등장

분리 전 오너에게 경우의 수 제시 후 승인 받아 진행
```

---

## 12. CLI 명령어

```powershell
# 빌드 (.next 삭제 없이 — 컴포넌트 변경 시 기본)
npm run build

# 클린 빌드 (타입/환경변수/store 구조 변경 시만)
Remove-Item -Recurse -Force .next; npm run build

# 배포
git add . && git commit -m "message" && npx vercel --prod

# Firestore rules만 배포
npx firebase-tools deploy --only firestore:rules --project hizzi-board
```

---

## 13. 알려진 버그 이력

| 버그 | 근본 원인 | 수정 방법 |
|------|-----------|-----------|
| 할일 완료가 요청 탭에 미반영 | todoRequests status 미업데이트 | completeRequest() 추가 |
| 완료 취소 미반영 | reactivateRequest 누락 | reactivateRequest() 추가 |
| 캘린더 클릭 시 추가 팝업 열림 | stopPropagation 무시 | data-event="true" + closest() |
| 팀 요청 캘린더 중복 생성 | 수신자마다 acceptRequest 호출 | teamRequestId 중복 방지 |
| undefined Firestore 저장 | 선택 필드 그대로 저장 | stripUndefined 처리 |
| 드롭다운 overflow 클리핑 | overflow:auto 부모 체인 | createPortal + position:fixed |
| 삭제된 post 재표시 | onSnapshot 경쟁 조건 | deletePost 낙관적 업데이트 |
| 메모 탭 레이아웃 깨짐 | PostItem hover margin:0 -20px | margin 제거, inset:0 사용 |
| 특정인이 나만으로 표시 | length===1 조건 오류 | length===1 && [0]===author → 나만 |
| editContent 저장 안 됨 | handleEditSave에서 editTitle만 저장 | content: editContent로 수정 |
| 첨부파일 신규 추가 저장 안 됨 | !post.attachment 분기 누락 | 신규 추가 분기 추가 |
| dueDate Invalid Date | YYYYMMDD 형식 그대로 파싱 | YYYY-MM-DD 변환 후 파싱 |
| 이미지 할일 제목 안 보임 | renderContent가 img만 반환 | 제목+이미지 함께 반환 |
| page.tsx 한글 깨짐 | PowerShell Set-Content 인코딩 오류 | 전체 교체 + UTF8 명시 |
| 로그인 직후 Panel 1/2/3 표시 | panelStore 모듈 최상위 즉시실행 → auth 전 fallback | initPanelListener 패턴 전환 |
| 로그인 직후 From admin 표시 | userStore 동일 원인 | initUserListener 패턴 전환 |
| 연차 페이지 새로고침 Loading 멈춤 | leaveStore 동일 원인 + leaveLoading 전체 게이트 | initLeaveListener + 컴포넌트 게이트로 전환 |
| 연차 입사일 공란 / 설정저장 무반응 | page.tsx에 initLeaveListener 누락 | page.tsx useEffect에 cleanup5 추가 |

---

## 14. 로드맵

```
Phase 1 (현재): Hizzi Board 안정화
Phase 2:        AI 채팅 패널 연동
Phase 3:        Rehobot UI/UX 재구축 + 상용화
Phase 4:        개인/기업 듀얼 채널

Rehobot 요금제:
  Free    ₩0        30회/월
  Pro     ₩9,900/월
  Premium ₩19,900/월
```

---

*Updated: 2026.04.08 (initListener 패턴 전환 완료 / stale 렌더 구조적 해결 / 연차 버그 수정)*
