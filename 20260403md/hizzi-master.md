# Hizzi Board — 프로젝트 마스터 문서

> 새 세션 시작 시 이 파일 + hizzi-session.md + hizzi-uxui-design.md + 협업패턴_가이드.md 함께 첨부하세요.

---

## 1. 프로젝트 개요

**프로젝트명:** Hizzi Board
**URL:** https://hizzi-board.vercel.app
**목적:** 패션 브랜드 히찌 사내 협업 플랫폼 (게시판 + 달력 + 할일 + 연차 + 업무요청)
**브랜드 방향:** ZARA / COS 스타일 — 미니멀, 에디토리얼, 고급스러운 패션 브랜드 인트라넷
**팀:** 6명 실사용 중
**글로벌 목표:** 처음부터 단단하게 구조 설계 — 속도보다 정확성

---

## 2. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS + inline styles |
| 상태관리 | Zustand |
| 데이터베이스 | Firebase Firestore |
| 인증 | Firebase Auth |
| 파일 저장 | Firebase Storage |
| 배포 | Vercel |

---

## 3. 프로젝트 경로

```
작업 경로: D:\Dropbox\Dropbox\hizzi-board
Firebase 프로젝트: hizzi-board
serviceAccount.json: D:\Dropbox\Dropbox\serviceAccount.json (상위 폴더)
```

### 핵심 파일 구조

```
src/
├── app/
│   ├── page.tsx
│   ├── leave/page.tsx
│   ├── login/page.tsx
│   └── signup/page.tsx
├── components/
│   ├── Panel.tsx
│   ├── PostItem.tsx
│   ├── TodoItem.tsx
│   ├── CreatePost.tsx
│   ├── Calendar.tsx
│   ├── NoticeArea.tsx
│   ├── LeaveManager.tsx
│   ├── TodoRequestBadge.tsx
│   └── TodoRequestModal.tsx
├── hooks/
│   └── useEscClose.ts         # 공통훅 — 모든 모달 ESC 닫기
├── store/
│   ├── authStore.ts
│   ├── postStore.ts
│   ├── panelStore.ts
│   ├── userStore.ts
│   ├── leaveStore.ts
│   ├── toastStore.ts
│   └── todoRequestStore.ts
└── lib/
    └── firebase.ts
```

---

## 4. 파일 연관관계 (수정 시 반드시 함께 확인)

```
TodoItem.tsx 수정 시
  → todoRequestStore.ts (completeRequest, reactivateRequest)
  → Panel.tsx (완료 복구 버튼의 reactivateRequest 연동)

TodoRequestModal.tsx 수정 시
  → todoRequestStore.ts (status 필터링)
  → TodoRequestBadge.tsx (panelOwnerEmail 기준)

Calendar.tsx 수정 시
  → todoRequestStore.ts (acceptRequest의 calendarEvents 등록)
  → leaveStore.ts (연차 이벤트)

CreatePost.tsx 수정 시 (요청 탭)
  → todoRequestStore.ts (addRequest)
  → Calendar.tsx (기한 → 달력 자동 등록)

Panel.tsx 수정 시
  → TodoItem.tsx (canEdit props)
  → todoRequestStore.ts (reactivateRequest)
  → postStore.ts

새 모달/팝업 추가 시
  → useEscClose 훅 반드시 적용
  → import { useEscClose } from '@/hooks/useEscClose';
  → useEscClose(onClose, isOpen);
```

---

## 5. Firestore 데이터 구조

### posts
```typescript
{
  id: string,
  panelId: string,
  content: string,
  attachment?: { type: 'image' | 'file' | 'link', url: string, name?: string },
  author: string,
  category: string,          // '할일' | '메모' | '공지'
  visibleTo: string[],
  taskType?: 'work' | 'personal',
  starred?: boolean,
  starredAt?: Date | null,
  completed?: boolean,
  completedAt?: Date | null,
  pinned?: boolean,
  requestId?: string,
  requestFrom?: string,
  requestTitle?: string,
  requestContent?: string,
  requestDueDate?: string | null,
  createdAt: Date,
  updatedAt: Date,
}
```

### todoRequests
```typescript
{
  id: string,
  fromEmail: string,
  fromPanelId: string,
  toEmail: string,
  toPanelId: string,
  title: string,
  content: string,
  dueDate?: string,
  visibleTo: string[],
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed',
  rejectReason?: string,
  teamLabel?: string,
  teamRequestId?: string,    // 팀 요청 시 공유 ID (달력 중복 방지)
  createdAt: Date,
  resolvedAt?: Date | null,
}
```

### calendarEvents
```typescript
{
  id, title, startDate, endDate,
  authorId, authorName, color, createdAt,
  repeat?: { type, weeklyDay, excludeHolidays, endType, endDate, endCount },
  repeatGroupId?: string,
  requestId?: string,        // 요청으로 생성된 이벤트
  requestFrom?: string,
  requestTitle?: string,
  teamRequestId?: string,    // 팀 요청 달력 중복 방지용
}
```

### panels / leaveSettings / leaveEvents
기존과 동일

---

## 6. 패널 구성

```
panel-1: 유미정 패널 (alwjd7175@gmail.com)
panel-2: 조향래 패널 (kkjspfox@naver.com)
panel-3: 김진우 패널 (oilpig85@gmail.com)
panel-4: 우희훈 패널 (heehun96@naver.com)
panel-5: 한다슬 패널 (ektmf335@gmail.com)
panel-6: 홍아현 패널 (we4458@naver.com)
```

---

## 7. 관리자 계정

```
이메일: admin@company.com
비밀번호: admin1234!
```

---

## 8. Firestore Rules

```javascript
posts:          read/create/update/delete — request.auth != null
panels:         read/write — request.auth != null
users:          read — request.auth != null / write — 본인 또는 admin
calendarEvents: read/write — request.auth != null
leaveSettings:  read/write — request.auth != null
leaveEvents:    read/write — request.auth != null
todoRequests:   read/create/update/delete — request.auth != null
```

---

## 9. 핵심 개발 규칙

```
1. 패치 3회 실패 → 파일 완전 새로 작성
2. Firestore 저장 안 될 때 → 브라우저 Console(F12) 먼저 확인
3. undefined 값은 Firestore에 저장 불가 ⭐
   → addDoc 전에 undefined 필드 일괄 제거:
   Object.keys(docData).forEach(key => {
     if (docData[key] === undefined) delete docData[key];
   });
4. firebase.ts 수정 시 export 목록 반드시 확인
5. 타임존: toISOString() 금지, T00:00:00 로컬시간 사용
6. 빌드 메모리 부족 시:
   $env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build
7. overflow 체인 버그 → position: fixed + Portal(createPortal) 사용
8. 새 컬렉션 추가 시 → firestore.rules 반드시 업데이트 후 배포
9. 관리자가 패널에서 요청 보낼 때 → fromEmail = 패널 오너 이메일
10. 새 모달/팝업 추가 시 → useEscClose 훅 반드시 적용 ⭐
11. 파일 확인 시 → 텍스트 복붙 대신 📎 첨부 버튼으로 파일 직접 올리기
    (2~3개씩 나눠서 올리면 용량 문제 없음)
```

---

## 10. 공통 훅 (Custom Hook)

```
위치: src/hooks/

현재 적용된 훅:
- useEscClose(onClose, isOpen) — 모든 모달 ESC 닫기
  적용: Calendar, LeaveManager, TodoItem, CreatePost, TodoRequestModal

새 모달 만들 때 필수 패턴:
  import { useEscClose } from '@/hooks/useEscClose';
  useEscClose(() => setIsOpen(false), isOpen);

우선순위 높은 미적용 훅 (나중에):
- useFileUpload(panelId) — Firebase Storage 업로드 (TodoItem/CreatePost 중복)
- useIsMobile(breakpoint) — 모바일 감지 (Calendar/Panel 중복)
- useOutsideClick(ref, onClose) — 영역 밖 클릭 닫기
- useCanEdit(ownerEmail) — 편집 권한 체크
- useMultiSelect(items) — 다중 선택 (완료 할일 선택 삭제)
- useDateInput() — yyyymmdd ↔ yyyy-mm-dd 변환 (CreatePost)
```

---

## 11. 발생했던 주요 버그 & 해결책

| 버그 | 원인 | 해결책 |
|------|------|--------|
| 게시물 새로고침 시 사라짐 | taskType: undefined → Firestore 저장 실패 | 선택적 필드 조건부 추가 |
| 할일 완료 체크 후 요청탭 미반영 | todoRequests status 미업데이트 | completeRequest 함수 추가 |
| 미완료 복구 시 요청탭 미반영 | reactivateRequest 없음 | reactivateRequest 함수 추가 |
| 달력 이벤트 클릭 시 추가창 같이 뜸 | onMouseUp이 stopPropagation 무시 | data-event="true" + onMouseUp에서 체크 |
| 팀 요청 달력 중복 등록 | 수신자마다 acceptRequest 호출 | teamRequestId로 중복 체크 |
| todoRequests 저장 실패 | dueDate: undefined Firestore 저장 불가 | Object.keys로 undefined 필드 제거 |
| 새로고침 시 구버전 | Vercel 캐시 | next.config.js Cache-Control 추가 |

---

## 12. 유용한 명령어

```powershell
# 캐시 삭제 후 재빌드
Remove-Item -Recurse -Force .next; npm run build

# 메모리 늘려서 빌드
$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build

# 배포
git add . && git commit -m "메시지" && npx vercel --prod

# Firestore Rules만 배포
npx firebase-tools deploy --only firestore:rules --project hizzi-board

# 테스트 데이터 정리
node scripts/cleanup-test-data.js
```

---

*업데이트: 2026.04.03 저녁*
