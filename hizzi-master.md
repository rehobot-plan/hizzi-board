# Hizzi Board — 프로젝트 마스터 문서

> 새 세션 시작 시 이 파일 + hizzi-session.md + hizzi-uxui-design.md 함께 첨부하세요.

---

## 1. 프로젝트 개요

**프로젝트명:** Hizzi Board
**URL:** https://hizzi-board.vercel.app
**목적:** 패션 브랜드 히찌 사내 협업 플랫폼 (게시판 + 달력 + 할일 + 연차)
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
│   ├── Panel.tsx         # 게시판 패널 (탭: 할일/메모)
│   ├── PostItem.tsx      # 게시물 아이템 (레이어 패턴)
│   ├── TodoItem.tsx      # 할일 아이템 (레이어 패턴)
│   ├── CreatePost.tsx    # 게시물 작성 (텍스트+첨부파일 구조)
│   ├── Calendar.tsx      # 공유 달력
│   ├── NoticeArea.tsx    # 공지사항 (핀고정/최신순)
│   └── LeaveManager.tsx  # 연차 관리
├── store/
│   ├── authStore.ts
│   ├── postStore.ts
│   ├── panelStore.ts
│   ├── userStore.ts
│   ├── leaveStore.ts
│   └── toastStore.ts
└── lib/
    └── firebase.ts       # db, auth, storage 모두 export 필수!
```

---

## 4. Firestore 데이터 구조

### posts (2026.04.03 구조 개편)
```typescript
{
  id: string,
  panelId: string,
  content: string,           // 텍스트 (항상 필수)
  attachment?: {             // 첨부파일 (선택사항)
    type: 'image' | 'file' | 'link',
    url: string,
    name?: string,
  },
  author: string,
  category: string,          // '할일' | '메모' | '공지'
  visibleTo: string[],       // [] = 전체공개
  taskType?: 'work' | 'personal',
  starred?: boolean,
  starredAt?: Date | null,
  completed?: boolean,
  completedAt?: Date | null,
  pinned?: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### panels
```typescript
{
  id, name, ownerEmail?, position?,
  categories: ['할일', '메모']
}
```

### calendarEvents
```typescript
{
  id, title, startDate, endDate,
  authorId, authorName, color, createdAt,
  repeat?: { type, weeklyDay, excludeHolidays, endType, endDate, endCount },
  repeatGroupId?: string
}
```

---

## 5. 패널 구성

```
panel-1: 유미정 패널 (alwjd7175@gmail.com)
panel-2: 조향래 패널 (kkjspfox@naver.com)
panel-3: 김진우 패널 (oilpig85@gmail.com)
panel-4: 우희훈 패널 (heehun96@naver.com)
panel-5: 한다슬 패널 (ektmf335@gmail.com)
panel-6: 홍아현 패널 (we4458@naver.com)
```

---

## 6. 관리자 계정

```
이메일: admin@company.com
비밀번호: admin1234!
```

---

## 7. Firestore Rules (현재 적용)

```javascript
posts:   read/create/update/delete — request.auth != null
panels:  read/write — request.auth != null
users:   read — request.auth != null
         write — 본인(auth.uid == userId) 또는 admin
```

---

## 8. 핵심 개발 규칙

```
1. 패치 3회 실패 → 파일 완전 새로 작성
2. Firestore 저장 안 될 때 → 브라우저 Console(F12) 먼저 확인
3. undefined 값은 Firestore에 저장 불가
   → 선택적 필드는 조건부로 추가:
   if (category === '할일') postData.taskType = taskType;
4. firebase.ts 수정 시 export 목록 반드시 확인
   export const storage = getStorage(app); 누락 주의
5. 타임존: toISOString() 금지, T00:00:00 로컬시간 사용
6. 빌드 메모리 부족 시:
   $env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build
7. 파일 인코딩 깨졌을 때:
   git checkout src/components/[파일명].tsx
8. 협업 방식: Claude.ai 설계 → Claude Code 실행
   Claude Code /clear 후 메모리 확보 필요시 VS Code 터미널 직접 사용
```

---

## 9. 발생했던 주요 버그 & 해결책

| 버그 | 원인 | 해결책 |
|------|------|--------|
| 게시물 새로고침 시 사라짐 | taskType: undefined → Firestore 저장 실패 | 선택적 필드 조건부 추가 |
| 게시물 저장 안 됨 | firebase.ts storage export 누락 | export const storage = getStorage(app) |
| 삭제 버튼 클릭 안 됨 | 투명 오버레이 div가 클릭 가로챔 | onMouseLeave로 메뉴 닫기 |
| hover 시 레이아웃 밀림 | padding/border 변경으로 레이아웃 변경 | 레이어 패턴 + border-color만 변경 |
| Firestore Rules 거부 | update 규칙 누락 + 관리자 panelId 불일치 | Rules 수정 + 조건 완화 |
| 카테고리 기본값 오류 | allCategories[0]='할일'이 기본값으로 저장 | getInitialCategory 로직 수정 |
| 빌드 메모리 부족 | JS heap out of memory | NODE_OPTIONS 메모리 증가 |
| 파일 인코딩 깨짐 | PowerShell Ctrl+V 붙여넣기 오류 | git checkout으로 복구 |
| 날짜 하루 밀림 | toISOString() UTC 변환 | T00:00:00 로컬시간 사용 |

---

## 10. 유용한 명령어

```powershell
# 캐시 삭제 후 재빌드
Remove-Item -Recurse -Force .next; npm run build

# 메모리 늘려서 빌드
$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build

# 배포
git add . && git commit -m "메시지" && npx vercel --prod

# git 파일 복구
git checkout src/components/[파일명].tsx

# Firestore 데이터 확인 (node scripts 활용)
node scripts/[스크립트명].js
```

---

*업데이트: 2026.04.03*
