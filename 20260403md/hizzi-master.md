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
│   ├── Panel.tsx              # 패널 뼈대 — 분리 예정 (기술부채)
│   ├── PostItem.tsx
│   ├── TodoItem.tsx           # 할일 아이템 + 업무 지시서 모달
│   ├── CreatePost.tsx
│   ├── Calendar.tsx           # 달력 + 색상 의미 시스템
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

## 5. todoRequest 상태 흐름도 ⭐

```
pending
  ├─→ accepted   (수락)
  │     └─ post 생성, calendar 자동 등록 (기한 있을 때)
  ├─→ rejected   (반려 + rejectReason 저장)
  └─→ cancelled  (요청자 취소)

accepted
  ├─→ completed  (담당자 완료처리 버튼)
  │     └─ 요청자 요청함 완료 탭에 완료 알림 + 시각 표시
  └─→ accepted   (완료 취소 → 복구, 알림도 함께 취소)
```

**연계 규칙 — 상태 변경 시 반드시 함께 처리:**
```
completed 처리 시: post.completed=true + completeRequest(requestId)
완료 복구 시:      post.completed=false + reactivateRequest(requestId)
수락 시:           post 생성 + calendarEvent 생성 (기한 있을 때)
```

---

## 6. Firestore 데이터 구조

### posts
```typescript
{
  id: string,
  panelId: string,
  content: string,
  attachment?: { type: 'image' | 'file' | 'link', url: string, name?: string },
  author: string,
  category: string,
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
  teamRequestId?: string,
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
  requestId?: string,
  requestFrom?: string,
  requestTitle?: string,
  teamRequestId?: string,
  taskType?: string,
  visibility?: string,
}
```

---

## 7. 색상 의미 시스템 ⭐

### 달력 이벤트
```
색상 = 공개범위 / 스타일 = 업무·개인 구분

업무 (진한 채움):
  전체공개 → #3B6D11 그린
  나만보기 → #185FA5 블루
  지정공개 → #854F0B 앰버

개인 (반투명 + 왼쪽 선):
  전체공개 → rgba(99,153,34,0.15) + #639922 선
  나만보기 → rgba(55,138,221,0.15) + #378ADD 선
  지정공개 → rgba(186,117,23,0.15) + #BA7517 선

연차 → rgba(83,74,183,0.15) + #534AB7 선
업무요청 → #993556 + 3px solid #72243E
```

### 할일 태그
```
업무 → #C17B6B 테라코타 / 개인 → #9E8880 모카 그레이
공개범위: 전체=그린 / 나만=블루 / 지정=앰버
FROM 태그(요청받은 할일): #FCEEE9 배경 + #A0503A + #C17B6B 테두리
```

---

## 8. 패널 구성

```
panel-1: 유미정 (alwjd7175@gmail.com)
panel-2: 조향래 (kkjspfox@naver.com)
panel-3: 김진우 (oilpig85@gmail.com)
panel-4: 우희훈 (heehun96@naver.com)
panel-5: 한다슬 (ektmf335@gmail.com)
panel-6: 홍아현 (we4458@naver.com)
관리자:  admin@company.com / admin1234!
```

---

## 9. Firestore Rules

```javascript
posts / panels / calendarEvents / leaveSettings / leaveEvents / todoRequests:
  read/create/update/delete — request.auth != null
users:
  read — request.auth != null / write — 본인 또는 admin
```

---

## 10. 핵심 개발 규칙

```
1.  패치 3회 실패 → 파일 완전 새로 작성
2.  Firestore 저장 안 될 때 → Console(F12) 먼저 확인
3.  undefined 값 Firestore 저장 불가 ⭐
    → Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) delete docData[key];
      });
4.  firebase.ts 수정 시 export 목록 확인
5.  타임존: toISOString() 금지, T00:00:00 로컬시간 사용
6.  빌드 메모리 부족: $env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build
7.  overflow 버그 → createPortal + position: fixed
8.  새 컬렉션 → firestore.rules 업데이트 후 배포
9.  관리자 요청 시 → fromEmail = 패널 오너 이메일
10. 새 모달 → useEscClose 훅 반드시 적용 ⭐
11. 파일 확인 → 📎 첨부 (알파벳 순, 2~3개씩)
12. any 타입 사용 금지 ⭐ — 불가피 시 오너 승인 필수
13. 상태 변경 시 연계 데이터 함께 업데이트 (섹션 5 흐름도 참고)
```

---

## 11. 공통 훅

```
위치: src/hooks/

현재 적용:
- useEscClose(onClose, isOpen) — 모든 모달 ESC 닫기

우선순위 높은 미적용 훅:
- useFileUpload(panelId)   — Storage 업로드 (TodoItem/CreatePost 중복)
- useIsMobile(breakpoint)  — 모바일 감지 (Calendar/Panel 중복)
- useCanEdit(ownerEmail)   — 편집 권한 체크
- useMultiSelect(items)    — 다중 선택 체크박스
- useDateInput()           — yyyymmdd ↔ yyyy-mm-dd 변환
```

---

## 12. 기술 부채 현황 ⭐

### 🔴 안정성 — 우선 처리
```
1. Panel.tsx 분리 (현재 615줄+)
   → TodoList.tsx / CompletedTodo.tsx / PostList.tsx 분리
   → 지금은 버그 찾기 어렵고 수정 시 사이드이펙트 위험 큼

2. 에러 처리 통일
   → catch(e) { console.error(e) } → 사용자 피드백 없음
   → toastStore 활용 에러 토스트로 통일

3. any 타입 제거
   → updates: any, docData: any 다수 → 런타임 오류 위험
```

### 🟡 성장 대비 — 나중에
```
4. Firestore 저장 공통 함수화 (undefined 제거 포함)
5. 실시간 리스너 정리 검증
6. 공통 훅 추가 적용
```

---

## 13. 유용한 명령어

```powershell
Remove-Item -Recurse -Force .next; npm run build
$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build
git add . && git commit -m "메시지" && npx vercel --prod
npx firebase-tools deploy --only firestore:rules --project hizzi-board
node scripts/cleanup-test-data.js
```

---

*업데이트: 2026.04.03 저녁*
