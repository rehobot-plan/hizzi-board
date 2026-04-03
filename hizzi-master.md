# Hizzi Board — 마스터 문서

> 이 파일은 프로젝트 전체 기술 정보 + 미래 방향을 담고 있습니다.
> hizzi-session.md 와 함께 새 세션에 첨부하세요.

---

## 1. 프로젝트 개요

**프로젝트명:** Hizzi Board  
**URL:** https://hizzi-board.vercel.app  
**목적:** 패션 쇼핑몰 사내 온라인 게시판 + 공유 달력 + 팀 협업 플랫폼  
**브랜드 방향:** ZARA / COS 스타일 — 미니멀, 에디토리얼, 고급스러운 패션 브랜드 인트라넷  
**현재 상태:** 팀원 6명 실사용 중, 안정적 운영 중

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
GitHub: rehobot-plan/hizzi-Board
Firebase 프로젝트: hizzi-board
```

### 핵심 파일 구조

```
src/
├── app/
│   ├── page.tsx               # 메인 페이지
│   ├── login/page.tsx         # 로그인
│   ├── signup/page.tsx        # 회원가입
│   ├── leave/page.tsx         # 연차 열람 페이지 (별도 라우트)
│   └── globals.css
├── components/
│   ├── Panel.tsx
│   ├── PostItem.tsx
│   ├── CreatePost.tsx
│   ├── Calendar.tsx
│   ├── NoticeArea.tsx
│   └── LeaveManager.tsx       # 관리자 연차 관리
├── store/
│   ├── authStore.ts
│   ├── postStore.ts
│   ├── panelStore.ts
│   ├── userStore.ts
│   ├── leaveStore.ts          # calcAnnualLeave, calcConfirmedLeave 등
│   └── toastStore.ts
└── lib/
    └── firebase.ts
```

---

## 4. 색상 팔레트 (디자인 시스템)

```
사이드바 배경:    #5C1F1F  딥 로즈브라운
메인 배경:        #FDF8F4  크림 베이지
카드 배경:        #FFFFFF
포인트:           #C17B6B  뮤트 테라코타
활성 상태:        #7A2828  미디엄 브라운
주 텍스트:        #2C1810  다크 브라운
보조 텍스트:      #9E8880  모카 그레이
테두리:           #EDE5DC  웜 베이지
배지 배경:        #F5E6E0
모달 오버레이:    rgba(44,20,16,0.4)
```

### 타이포그래피
```
섹션 제목: 10-11px, font-weight 700, letter-spacing 0.1em, uppercase
본문: 13px, line-height 1.6, color #2C1810
메타: 11px, color #9E8880
```

---

## 5. Firestore 데이터 구조

### users
```typescript
{
  id, name, email, role?, panelId?,
  leaveViewPermission?: 'none' | 'me' | 'all'
}
```

### panels
```typescript
{
  id, name, ownerEmail?, position?,
  categories?: string[]
}
```

### posts
```typescript
{
  id, panelId, type: 'text'|'image'|'link'|'file',
  content, author: string,
  category?: string,
  visibleTo?: string[],
  createdAt, updatedAt,
  attachments?: { name, url, size, type }[]
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

### leaveSettings
```typescript
{
  id, userId, userName, joinDate,
  manualUsedDays, createdAt, updatedAt
}
```

### leaveEvents
```typescript
{
  id, userId, userName, userEmail,
  date, type: 'full'|'half_am'|'half_pm',
  days: 1|0.5, memo?, confirmed,
  createdAt, createdBy
}
```

---

## 6. 연차 계산 정책

```
1년 미만: 매월 1일 × 근속월수 (최대 11일)
1년 이상: 15일 + floor((근속년수-1)/2) (최대 25일)
합산 최대: 26일 (유리 해석)
이월: 누적 가능 (소멸 없음)
예정: 오늘 이후 날짜 연차
확정: 오늘 포함 이전 날짜 연차
총사용: 수동입력 + 예정 + 확정
잔여: 발생 - 총사용 (마이너스 허용, 빨간색)
```

---

## 7. 권한 구조

```
관리자
├── 전체 기능
├── 연차 등록/수정/삭제 (확정 포함)
└── 모든 직원 연차 대장 관리

leaveViewPermission === 'all'
├── 전체 직원 연차 표 열람 (수정 불가)
└── /leave 페이지에서 예정 컬럼 포함 전체 표 열람

leaveViewPermission === 'me'
└── 본인 연차만 조회

leaveViewPermission === 'none' 또는 없음
└── 연차 메뉴 숨김
```

---

## 8. 관리자 계정

```
이메일: admin@company.com
비밀번호: admin1234!
```

---

## 9. 개발 규칙

```
1. 패치 3회 실패 시 → 파일 완전 새로 작성
2. 타임존: toISOString() 금지, T00:00:00 로컬시간 사용
3. Firestore 리스너: useEffect 반환값으로 unsubscribe
4. 빌드 순서: 검수 → npm run build → commit → vercel --prod
5. 파일 교체 안 될 때: 파일 탐색기에서 직접 삭제 후 붙여넣기
```

### 필수 검수 스크립트
```python
import sys
c = open(sys.argv[1]).read()
assert c.count('{') == c.count('}'), '중괄호 불균형'
assert c.count('export default') == 1, 'export default 중복'
assert 'toISOString' not in c, '타임존 버그 위험'
print('검수 통과')
```

---

## 10. 알려진 버그 & 해결책

| 버그 | 해결책 |
|------|--------|
| 파일 교체 안 됨 | 파일 탐색기에서 직접 삭제 후 붙여넣기 |
| 빌드 에러 반복 | 파일 완전 새로 작성 |
| 날짜 하루 밀림 | T00:00:00 로컬시간 사용 |
| EBUSY 오류 | .next 삭제 후 재빌드 |
| git 커밋 실패 | git config core.safecrlf false |
| 파일 인코딩 깨짐 | Get-Content -Encoding UTF8 |
| 복구 계정 패널 사용 불가 | email 기반 권한 체크로 통일 |

---

## 11. UI 컴포넌트 패턴

### 모달
```tsx
// 오버레이: rgba(44,20,16,0.4)
// 카드: background #fff, border 1px solid #EDE5DC, rounded 없음
// 헤더: 10px uppercase letter-spacing-widest #2C1810
// 푸터: background #FDF8F4
```

### 버튼
```tsx
주요: background #2C1810, color #FDF8F4, 10px uppercase
취소: color #9E8880, background none, border none
위험: color #C17B6B, border 1px solid #C17B6B
```

---

## 12. 미래 방향 — Rehobot Plan

### 히찌보드 → Rehobot 전략
```
히찌보드 = 팀 협업 내부 툴 (MVP 테스트베드)
Rehobot  = 개인 스케줄러 상용화 앱

히찌보드에서 검증한 구조를 그대로 재사용
UI/UX만 Rehobot 버전으로 재구성
```

### Rehobot 개발 순서
```
1단계: 히찌보드 완전 안정화
2단계: 히찌보드에 AI 채팅 통합 (실전 테스트)
3단계: Rehobot — UI/UX 재구성 + 상용화 플랜
4단계: 구독 모델 (Free / Pro ₩9,900 / Premium ₩19,900)
```

### Rehobot 기술 스택 (예정)
```
Next.js 14 + TypeScript + Tailwind
Firebase (Auth + Firestore)
Anthropic Claude API
배포: Vercel
```

---

*최종 업데이트: 2026.04.01*
