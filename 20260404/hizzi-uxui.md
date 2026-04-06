# Hizzi Board — UX/UI Design System

> Single source of truth for all visual decisions.
> When in doubt about a color, spacing, or interaction pattern — check here first.

---

## 1. Brand Direction

```
Reference:  ZARA / COS
Tone:       Minimal · Editorial · Premium fashion intranet
Principles: Whitespace over decoration
            Typography over color
            Restraint over flourish
            Transition: 0.15s ease (universal — no exceptions)
```

---

## 2. Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `sidebar-bg` | `#5C1F1F` | Sidebar background |
| `main-bg` | `#FDF8F4` | Page background |
| `card-bg` | `#FFFFFF` | Card / panel background |
| `accent` | `#C17B6B` | Muted terracotta — primary accent |
| `active-text` | `#7A2828` | Hover / active text |
| `text-primary` | `#2C1810` | Main body text |
| `text-secondary` | `#9E8880` | Mocha gray — secondary |
| `text-hint` | `#C4B8B0` | Light mocha — hints |
| `border` | `#EDE5DC` | Warm beige — all borders |
| `todo-work-bg` | `#FFF5F2` | Todo work item background |
| `todo-personal-bg` | `#F5F0EE` | Todo personal item background |
| `request-bg` | `#FCEEE9` | Request item background |
| `overlay` | `rgba(44,20,16,0.4)` | Modal backdrop |

### Typography
| Role | Size | Weight | Letter-spacing |
|------|------|--------|----------------|
| Section label | 10–11px | 700 | 0.1em, uppercase |
| Body text | 13px | 400 | — |
| Meta info | 11px | 400 | — |
| Hint text | 10px | 400 | 0.06em |

---

## 3. Color Meaning System ⭐ (canonical)

### Calendar events
```
Rule: color = visibility scope / style = work vs personal

WORK (solid fill):
  all      → #3B6D11  green
  me only  → #185FA5  blue
  specific → #854F0B  amber

PERSONAL (translucent bg + left border — border only on isStart || isSingle):
  all      → rgba(99,153,34,0.15)   + #639922 border
  me only  → rgba(55,138,221,0.15)  + #378ADD border
  specific → rgba(186,117,23,0.15)  + #BA7517 border

Leave     → rgba(83,74,183,0.15)   + #534AB7 border
Request   → #993556 bg + 3px solid #72243E
```

### Todo / Memo tags (통일 기준 — 2026.04.06 확정)

```
태그 3분류 규칙:

[A] 카테고리 태그 (업무/개인/요청) — 바탕색 + 테두리 (동일 규격)
  업무   → background #FFF5F2  color #C17B6B  border 1px solid #C17B6B
  개인   → background #F0ECF5  color #7B5EA7  border 1px solid #7B5EA7
  요청   → background #FBEAF0  color #993556  border 1px solid #993556

[B] 공개범위 태그 (전체/나만/특정) — 테두리만, 배경 없음
  전체   → color #3B6D11  border 1px solid #639922
  나만   → color #185FA5  border 1px solid #378ADD
  특정   → color #854F0B  border 1px solid #BA7517
  ※ "특정인" 아닌 "특정"으로 표기

[C] From/TEAM 태그 — 배경만, 테두리 없음
  From {이름} → background #FCEEE9  color #A0503A
  TEAM        → background #F5F0EE  color #9E8880
  TEAM hover  → tooltip with member chips (background #F5F0EE, no border)
  팀원 칩: 3명까지 1행, 4명부터 줄바꿈 (maxWidth: 240px, flexWrap: wrap)

태그 순서:
  일반 할일: 업무/개인 → 공개범위 → 날짜
  요청 할일: 요청 → From {이름} → TEAM(팀일 때만) → 날짜
  메모:      업무/개인 → 공개범위 → 날짜

좌측 2px 띠 색상 (taskType 기준):
  요청   → #993556
  업무   → #C17B6B
  개인   → #7B5EA7
```

### Button colors
```
Accept:  bg #EAF3DE  text #3B6D11  border 1px solid #C0DD97  (pastel green)
Reject:  bg #FBEAF0  text #993556  border 1px solid #F4C0D1  (pastel pink)
Primary: bg #2C1810  text #FDF8F4
Danger:  text #C17B6B  border 1px solid #C17B6B
Cancel:  text #9E8880  no bg  no border
```

---

## 4. Component States

| State | Style |
|-------|-------|
| Default | Static |
| Hover | `background: #FDF8F4`, `color: #7A2828` |
| Selected | `border: #2C1810`, `background: #FDF8F4` |
| Disabled | `opacity: 0.4`, `cursor: not-allowed` |
| Loading | Text label: "저장 중..." / "처리 중..." |
| Error | `color: #C17B6B`, `border: #C17B6B` |

---

## 5. Layer-based Hover Pattern ⭐

```tsx
<div style={{ position: 'relative', padding: '12px 8px' }}>
  {/* Layer 0: hover background — inset only, no margin */}
  <div style={{
    position: 'absolute', inset: 0,
    background: isHovered ? '#FDF8F4' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none', zIndex: 0,
  }} />
  {/* Layer 1: visibility / request indicator line */}
  <div style={{
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: getLeftBorderColor(post),
    pointerEvents: 'none', zIndex: 1,
  }} />
  {/* Layer 2: actual content */}
  <div style={{ position: 'relative', zIndex: 2 }}>{content}</div>
</div>
```

**⚠️ NEVER use `margin: '0 -20px'` on hover layers.**
Use `inset: 0` only.

---

## 6. Left Border Color Resolution

```typescript
function getLeftBorderColor(post: Post): string {
  if (post.requestFrom) return '#993556'  // received request
  if (post.starred)     return '#C17B6B'  // starred
  if (!post.visibleTo || post.visibleTo.length === 0) return '#639922'   // all
  if (post.visibleTo.length === 1 && post.visibleTo[0] === post.author)
    return '#378ADD'  // me only
  return '#BA7517'  // specific
}
```

---

## 7. Work-Order Modal Pattern

```tsx
// Header: sidebar color
<div style={{ background: '#5C1F1F', padding: '18px 22px 14px' }}>
  <div style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4' }}>{title}</div>
</div>
// Status bar: soft pink
<div style={{ background: '#FCEEE9', borderBottom: '1px solid #EDE5DC' }}>
  진행중 chip + 기한 chip
</div>
// Body: content / visibility / taskType
// Footer: 닫기 + 완료처리
```

---

## 8. Calendar Click Guard Pattern

```typescript
<div data-event="true" ...>

const clickedEvent = (e.target as HTMLElement).closest('[data-event="true"]')
if (clickedEvent) return

// Left border: only render when isStart || isSingle
{(isStart || isSingle) && <div style={{ borderLeft: '3px solid ...' }} />}
```

---

## 9. Modal Pattern

```tsx
// Overlay
position: fixed, inset: 0, zIndex: 1000, background: rgba(44,20,16,0.4)

// Card
background: #fff, border: 1px solid #EDE5DC, zIndex: 1001

// Header label style
fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C1810'

// Footer
background: #FDF8F4, borderTop: '1px solid #EDE5DC'

// ESC close — REQUIRED
import { useEscClose } from '@/hooks/useEscClose'
useEscClose(() => setIsOpen(false), isOpen)
```

---

## 10. Input Field Pattern

```tsx
border: 'none'
borderBottom: '1px solid #EDE5DC'
fontSize: 13
color: '#2C1810'
background: 'transparent'
outline: 'none'
```

---

## 11. Z-index Hierarchy

```
Panel internal:   10
Dropdown:        100
Modal overlay:  1000
Modal body:     1001
Calendar modal:   50
Calendar more:    70
Toast / Portal: 9999
```

---

## 12. Animation Rules

```
All transitions: 0.15s ease
Never: 0.3s or longer / linear / transitions on padding or margin
```

---

## 13. UX Principles ⭐ (2026.04.06 확정)

> 이 섹션은 새 기능 설계 전 반드시 확인. 결정된 원칙이며 임의 변경 금지.
> 변경 필요 시 오너 승인 후 업데이트.

### 13-1. 정보 계층 구조

```
패널 (Panel)
  └─ 탭바 인라인에 패널명 표시 (좌측) + 탭 (우측)
      └─ 할일 탭: 필터 바 (업무 / 요청 / 개인) + 우측 + 게시물
      └─ 메모 탭: 필터 바 숨김, + 게시물만 표시
          └─ 아이템 (제목 + 내용 2줄 미리보기 + 태그)
```

### 13-2. 필터 원칙

```
할일 탭 필터 버튼: 업무 / 요청 / 개인  (전체 버튼 없음)
기본 선택: 업무 + 요청 동시 활성 (중복 선택 허용)
동작: 선택된 필터에 해당하는 아이템만 표시
      아무것도 선택 안 된 상태 → 전체 표시 (엣지케이스 방어)
메모 탭: 필터 바 완전 숨김
```

### 13-3. 할일 아이템 구조

```
[왼쪽 2px 컬러 선] [체크박스] [즐겨찾기 별] [제목]          [쓰레기통]
                                             [내용 2줄 미리보기]
                                             [태그들] [날짜]

왼쪽 2px 선 컬러 규칙: getLeftBorderColor() 함수 기준 (Section 6)
체크박스: 완료 처리 (요청 할일은 체크 시 업무상세 팝업)
즐겨찾기: 별 아이콘, 클릭 시 starred 토글 → 상단 정렬
쓰레기통: hover 시 표시, 클릭 시 0.3s 딜레이 후 soft delete
```

### 13-4. 할일 데이터 구조 (확정 — Firestore 반영 필요)

```typescript
// posts 컬렉션 추가 필드
{
  title: string          // 할일 제목 (기존 content → title로 분리)
  content?: string       // 할일 상세 내용 (선택사항, 2줄 미리보기)
  dueDate?: string       // 기한 (선택사항, 모든 할일에 적용 가능)
                         // 기한 있으면 캘린더 자동 등록 연동 가능
}

// 마이그레이션 필요:
// 기존 content → title (기존 데이터 content를 title로 읽음)
// content 필드 신규 추가
```

### 13-5. 정렬 기준

```
할일 목록 정렬 우선순위:
  1. starred = true → 최상단
  2. dueDate 임박순 (오늘 기준 D-day 계산, dueDate 없으면 하위)
  3. createdAt 최신순

메모 목록 정렬 우선순위:
  1. starred = true → 최상단
  2. createdAt 최신순
```

### 13-6. 삭제 원칙

```
단건 삭제:
  - 쓰레기통 클릭 → 0.3s 딜레이 후 soft delete
  - confirm 없음 (빠른 삭제 우선)
  - 삭제된 항목 → "삭제된 할일" 섹션에서 복구 가능

bulk 삭제 (완료된 할일 / 삭제된 메모):
  - 선택 모드 → 선택 삭제 / 전체 삭제
  - try/catch/finally 필수 (rules.md R6.3)
```

### 13-7. 완료 처리 원칙

```
체크박스 클릭:
  → 0.6s 체크 애니메이션
  → 완료된 할일 섹션으로 이동
  → undo 없음 (완료 섹션에서 복구 가능)

요청 할일 체크:
  → 업무상세 팝업 열림 (직접 완료처리 버튼)
  → todoRequests.status = 'completed' cascade 필수
  → 완료 시 요청자에게 토스트 알림 발송 (Section 13-9 참고)
```

### 13-8. 수정 원칙

```
할일 수정: ··· 메뉴 → 모달 (제목 + 내용 + 구분 + 공개범위 + 기한)
메모 수정: ··· 메뉴 → 모달 (내용 + 공개범위)
요청 할일: 수정 불가 (받은 요청은 읽기 전용)
```

### 13-9. 요청함 (TodoRequestModal) UX ⭐

```
위치: 패널 탭바 우측 우편함 아이콘 (현행 유지)
배지: 처리 필요 건수 표시 (수락 대기 중인 것만 카운트)

구조: 탭 없음 — 단일 스크롤, 행동 기준 섹션 4개로 그룹핑

섹션 1 — 내가 수락해야 함 (최상단, 가장 강조)
  - 조건: toEmail = 나, status = 'pending'
  - 색상: #993556 (핑크 강조)
  - 액션: 수락 / 반려 버튼 인라인 표시

섹션 2 — 내가 진행 중
  - 조건: toEmail = 나, status = 'accepted'
  - 색상: #C17B6B (terracotta)
  - 액션: 업무상세 보기 (클릭 시 work-order 팝업)

섹션 3 — 상대방 처리 대기 중
  - 조건: fromEmail = 나, status = 'pending' | 'accepted'
  - 색상: #9E8880 (gray)
  - pending: 요청 취소 버튼 표시
  - accepted: 진행중 상태 표시만

섹션 4 — 완료 · 반려 · 취소 (기본 접힘)
  - 조건: status = 'completed' | 'rejected' | 'cancelled'
  - 기본값: 접혀있음 (▼ 펼치기)
  - 색상: #3B6D11 (green, 완료 느낌)

방향 태그:
  FROM {이름} → 받은 것  (background #FCEEE9, color #A0503A, border #C17B6B)
  TO {이름}   → 보낸 것  (background #F5F0EE, color #9E8880)
```

### 13-10. 완료 알림 원칙 (C안 — 토스트 + 배지 혼합)

```
트리거: 수신자가 요청 할일 완료 처리 시

요청자 화면:
  1. 토스트 팝업 (즉시)
     - 메시지: "{이름}님이 완료했습니다"
     - 서브: "{할일 제목} · 방금"
     - 자동 닫힘: 4초
  2. 요청함 배지 숫자 증가 (새 완료 알림)
  3. 요청함 섹션 4(완료)에 기록

구현 방식:
  - todoRequests 컬렉션 onSnapshot 리스너에서
    status가 'accepted' → 'completed'로 변경된 경우 감지
  - fromEmail === 현재 유저 → 토스트 발송
  - 이미 본 완료 알림은 중복 발송 안 함 (notifiedAt 필드 활용)
```

### 13-11. 모바일 대응 원칙 (향후 구현 시 기준)

```
터치 타겟: 최소 44px 높이
필터 버튼: 가로 스크롤 허용 (overflow-x: auto)
hover 전용 UI (쓰레기통, ···): 롱프레스로 대체
tooltip: hover 대신 tap → 표시 유지
패널 탐색: 스와이프로 전환
```

---


## 13-12. 업무상세 팝업 레이아웃 (2단 구조) ⭐

```
구조: 좌/우 2단

헤더 (전체 너비, background #5C1F1F):
  - 제목: 17px, fontWeight 700, color #FDF8F4
  - 메타: 요청자→나 / 등록일 / 기한 — fontSize 11px
  - 기한 색상: #F4C0D1 (강조)

좌측 (width 230px, border-right):
  - 상세 내용 / 공개·구분 태그 / 첨부파일(추가·삭제)

우측 (flex 1):
  - 댓글 목록: height 220px, overflow-y auto
  - 내 댓글 우측 background #FFF5F2 / 상대 댓글 좌측 background #F5F0EE
  - 입력창 + 전송 버튼

푸터: 닫기(좌) + 완료 처리 블락버튼(우, #2C1810)

완료처리 이중 진입:
  - 패널 체크박스 → 즉시 완료 (팝업 없음)
  - 팝업 내 완료 처리 버튼

Firestore 댓글: todoRequests/{id}/comments
  - 필드: content, author, authorEmail, createdAt
```

---

## 14. Pre-flight Design Checklist

```
□ Is hover layer using inset:0 (not negative margin)?
□ Is z-index within the defined hierarchy?
□ Is transition set to 0.15s ease?
□ Is the new modal using useEscClose?
□ Is undefined never saved to Firestore (visibleTo, attachments)?
□ Is the color assignment following the color-meaning system?
□ Does edit modal match create form in options and layout?
□ Is tag style using border-only (no background) pattern?
□ Is filter bar hidden on memo tab?
□ Does todo item show title + 2-line body preview?
□ Does TodoRequestModal use section-based layout (not tabs)?
□ Does completion trigger toast + badge for requester?
```

---

## 15. Lessons Learned ⭐

```
Calendar event click conflict:
  ❌ stopPropagation only → ✅ data-event="true" + closest()

Team request calendar duplicate:
  ❌ each recipient registers → ✅ teamRequestId, first acceptor only

Personal event left border:
  ❌ always shown → ✅ only on isStart || isSingle

PostItem hover layout broken:
  ❌ margin: '0 -20px' → ✅ inset: 0 only

Deleted post ghost reappear:
  ❌ Firestore delete only → ✅ optimistic update first

any type:
  ❌ updates: any → ✅ interface PostUpdates { ... }

Specific visibility shown as "me only":
  ❌ length > 0 → 'me' → ✅ length===1 && [0]===author → 'me'; else → 'specific'

Tag style inconsistency (PostItem vs TodoItem):
  ❌ 각 컴포넌트 별도 정의 → ✅ Section 3 color meaning system 기준 통일
  Rule: 배경 없음 + 테두리만 (border-only pattern)

TodoRequestModal tab UX confusion:
  ❌ 받은/보낸/진행중/완료 탭 → ✅ 행동 기준 섹션 그룹 (탭 없음)
  Rule: "내가 수락해야 함" 최상단, 완료는 기본 접힘
```

---

*Updated: 2026.04.06 (UX 원칙 / 요청함 UX / 완료 알림 패턴 추가)*
