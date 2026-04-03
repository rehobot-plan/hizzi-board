# Hizzi Board — 프로젝트 문서 (최신)

> 새로운 앱 개발 또는 새 세션 시작 시 이 파일을 Claude에게 먼저 읽혀주세요.

---

## 1. 프로젝트 개요

**프로젝트명:** Hizzi Board  
**URL:** https://hizzi-board.vercel.app  
**목적:** 패션 쇼핑몰 사내 온라인 게시판 + 공유 달력 + 팀 협업 플랫폼  
**브랜드 방향:** ZARA / COS 스타일 — 미니멀, 에디토리얼, 고급스러운 패션 브랜드 인트라넷

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
│   ├── page.tsx          # 메인 페이지
│   ├── login/page.tsx    # 로그인 (리뉴얼 완료)
│   ├── signup/page.tsx   # 회원가입 (리뉴얼 완료)
│   └── globals.css       # Inter 폰트, 색상 변수
├── components/
│   ├── Panel.tsx         # 게시판 패널
│   ├── PostItem.tsx      # 게시물 아이템 (완전 리라이트)
│   ├── CreatePost.tsx    # 게시물 작성 모달 (리디자인)
│   ├── Calendar.tsx      # 공유 달력 (완전 리라이트)
│   └── NoticeArea.tsx    # 공지사항 영역
├── store/
│   ├── authStore.ts
│   ├── postStore.ts
│   ├── panelStore.ts     # categories 마이그레이션 포함
│   ├── userStore.ts
│   └── toastStore.ts
└── lib/
    └── firebase.ts       # db, auth, storage 모두 export
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

## 5. 구현된 기능 전체 목록

### 게시판
- [x] 6분할 3×2 그리드
- [x] 1인 1패널 자동 배정 (관리자 제외)
- [x] 패널 이름 클릭 인라인 편집
- [x] 패널 드래그 앤 드롭 위치 교환
- [x] 바인더 탭: 전체 / 공지 / 메모 / 첨부파일
- [x] 커스텀 탭 추가/삭제/이름변경
- [x] 실시간 토스트 알림 (X버튼 수동 닫기)

### 게시물
- [x] 타입: 텍스트 / 이미지 / 파일 / 링크
- [x] Firebase Storage 업로드
- [x] 공개범위: 전체/나만보기/특정인
- [x] 특정인 목록에서 관리자 제외
- [x] 우클릭/길게누르기 컨텍스트 메뉴
- [x] 탭 이동 (구버전 탭 필터링 완료)
- [x] 이미지 확대 모달 (스크롤 줌, 드래그)
- [x] 작성자 이름 표시 (email → name)

### CreatePost 모달
- [x] 타입 선택: 아이콘 카드 4개
- [x] 카테고리: 탭 형태
- [x] 공개범위: 토글 칩
- [x] 글자수 카운터

### 공지사항 (NoticeArea)
- [x] 게시판 아래 전체 너비
- [x] 기본 3개, 더보기/접기
- [x] [패널명] 표시 → 실제 패널 이름으로
- [x] 작성자 이름 표시 (이메일 제거)
- [x] 날짜 + 시간 표시

### 공유 달력 (Calendar) ← 완전 리라이트
- [x] 이번달 + 다음달 동시 표시
- [x] 네비: ‹ 2026년 03월 › (심플, 화살표 2개)
- [x] 년도/월 클릭 직접입력
- [x] 타임존 버그 수정 (T00:00:00 로컬시간)
- [x] 공휴일 빨간색
- [x] 날짜 클릭/드래그 기간 선택
- [x] 기간 블락 표시
- [x] 반복 일정: 매일/매주/매월/매년
- [x] 매주 선택 시 클릭 요일 자동 설정
- [x] 공휴일 제외 토글
- [x] 종료: 날짜/횟수/무기한
- [x] 반복 삭제: 이 일정만 / 이후 모두
- [x] 모바일: 한 달만 표시

### 로그인/인증
- [x] 로그인/회원가입 페이지 리뉴얼
- [x] HIZZI BOARD 로고타입 스타일

### 관리자
- [x] 전체 게시물 열람/수정/삭제
- [x] 사용자 관리 (목록, 삭제)
- [x] 관리자는 패널 배정 없음

### 모바일
- [x] 3열 미니카드 → 탭하면 전체화면 오버레이
- [x] 사이드바 숨김

---

## 6. Firestore 데이터 구조

### posts
```typescript
{
  id, panelId, type: 'text'|'image'|'link'|'file',
  content, author: string (email),
  category?: string,
  visibleTo?: string[],  // [] = 전체공개
  createdAt, updatedAt,
  attachments?: { name, url, size, type }[]
}
```

### panels
```typescript
{
  id, name, ownerEmail?, position?,
  categories?: string[]  // 기본: ['공지','메모','첨부파일']
}
```

### calendarEvents
```typescript
{
  id, title, startDate, endDate,  // 'YYYY-MM-DD'
  authorId, authorName, color, createdAt,
  repeat?: { type, weeklyDay, excludeHolidays, endType, endDate, endCount },
  repeatGroupId?: string
}
```

---

## 7. 관리자 계정

```
이메일: admin@company.com
비밀번호: admin1234!
```

---

## 8. 발생했던 주요 버그 & 해결책

| 버그 | 원인 | 해결책 |
|------|------|--------|
| 빌드 에러 반복 | 패치 누적으로 코드 꼬임 | 파일 완전 삭제 후 새로 작성 |
| EBUSY 오류 | Dropbox 파일 잠금 | `.next` 삭제 후 재빌드 |
| 파일 교체 안 됨 | Dropbox 동기화 복원 | 파일 탐색기에서 직접 삭제 후 붙여넣기 |
| 날짜 하루 밀림 | toISOString() UTC 변환 | `new Date(str + 'T00:00:00')` 사용 |
| 일반 사용자 게시물 안 보임 | visibleTo 필터링 오류 | `(!visibleTo\|\|length===0)\|\|includes(email)` |
| 알림 중복 | initPostListener 이중 실행 | postStore 즉시실행 제거 |
| 탭 이동에 구버전 탭 표시 | Firestore 구버전 categories | REMOVED_TABS 필터링 + 마이그레이션 |
| 반복 일정 미동작 | getRepeatDates 로직 버그 | buildRepeatDates 완전 재작성 |
| node_modules 깨짐 | Windows Firebase Storage 충돌 | 삭제 후 npm install |

---

## 9. 개발 규칙

```
1. 세션 1개 = 작업 1개, 완료 후 /clear
2. 패치 3회 실패 시 → 파일 완전 새로 작성
3. 파일 교체: Claude.ai에서 완성본 생성 → Copy-Item 또는 탐색기로 교체
4. 빌드 순서: 검수 → npm run build → commit → vercel --prod
5. 타임존: toISOString() 금지, T00:00:00 로컬시간 사용
6. Firestore 리스너: useEffect 반환값으로 unsubscribe
7. Dropbox 교체 안 될 때: 파일 탐색기에서 직접 삭제 후 붙여넣기
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

## 10. 유용한 명령어

```powershell
# 캐시 삭제 후 재빌드
Remove-Item -Recurse -Force .next && npm run build

# node_modules 재설치
Remove-Item -Recurse -Force node_modules && npm install

# 파일 교체
Copy-Item "C:\Users\User\Downloads\파일명.tsx" `
  "D:\Dropbox\Dropbox\hizzi-board\src\components\파일명.tsx" -Force

# 배포
cd D:\Dropbox\Dropbox\hizzi-board
git add . && git commit -m "메시지" && npx vercel --prod

# 에이전트 팀 활성화
$env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1"
claude
```

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

### 토글 칩
```tsx
기본: border #EDE5DC, color #9E8880, 10px uppercase
선택: border #2C1810, color #2C1810, background #FDF8F4
포인트: border #C17B6B, color #C17B6B, background #FFF5F2
```

### 입력 필드
```tsx
border: none
borderBottom: 1px solid #EDE5DC
fontSize: 13, color #2C1810
background: transparent, outline: none
```

---

## 12. 다음 앱 개발 시 체크리스트

- [ ] 색상 팔레트 확정
- [ ] Firebase 프로젝트 생성 + .env.local
- [ ] TypeScript 타입 먼저 정의
- [ ] AGENTS.md 작성
- [ ] tailwind.config.ts 커스텀 색상 등록
- [ ] firebase.ts에서 db, auth, storage 모두 export
- [ ] .gitignore 확인

---

*업데이트: 2026.03.31*
