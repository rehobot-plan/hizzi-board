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
  TEAM hover  → tooltip with member chips (3열 grid, createPortal + position:fixed)

태그 순서:
  일반 할일: 업무/개인 → 공개범위 → dueDate시계 → 날짜
  요청 할일: 요청 → From {이름} → TEAM(팀일 때만) → dueDate시계 → 날짜
  메모:      업무/개인 → 공개범위 → 날짜

좌측 2px 띠 색상 (taskType 기준):
  요청   → #993556
  업무   → #C17B6B
  개인   → #7B5EA7

dueDate 시계 태그:
  dueDate 있을 때만 표시 (없으면 숨김)
  D-3 이내: color #993556  background #FBEAF0  border 1px solid #993556
  D-4 이상: color #C17B6B  background #FFF5F2  border 1px solid #C17B6B
  아이콘: SVG 시계 (circle + path)
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
  <div style={{
    position: 'absolute', inset: 0,
    background: isHovered ? '#FDF8F4' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none', zIndex: 0,
  }} />
  <div style={{
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: getLeftBorderColor(post),
    pointerEvents: 'none', zIndex: 1,
  }} />
  <div style={{ position: 'relative', zIndex: 2 }}>{content}</div>
</div>
```

**⚠️ NEVER use `margin: '0 -20px'` on hover layers. Use `inset: 0` only.**

---

## 6. Left Border Color Resolution

```typescript
function getLeftBorderColor(post: Post): string {
  if (post.requestFrom) return '#993556'
  if (post.starred)     return '#C17B6B'
  if (!post.visibleTo || post.visibleTo.length === 0) return '#639922'
  if (post.visibleTo.length === 1 && post.visibleTo[0] === post.author) return '#378ADD'
  return '#BA7517'
}
```

---

## 7. Work-Order Modal Pattern

```tsx
<div style={{ background: '#5C1F1F', padding: '18px 22px 14px' }}>
  <div style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4' }}>{title}</div>
</div>
<div style={{ background: '#FCEEE9', borderBottom: '1px solid #EDE5DC' }}>
  진행중 chip + 기한 chip
</div>
```

---

## 8. Calendar Click Guard Pattern

```typescript
<div data-event="true" ...>
const clickedEvent = (e.target as HTMLElement).closest('[data-event="true"]')
if (clickedEvent) return
{(isStart || isSingle) && <div style={{ borderLeft: '3px solid ...' }} />}
```

---

## 9. Modal Pattern

```tsx
// Overlay
position: fixed, inset: 0, zIndex: 1000, background: rgba(44,20,16,0.4)
// Card
background: #fff, border: 1px solid #EDE5DC, zIndex: 1001
// Footer
background: #FDF8F4, borderTop: '1px solid #EDE5DC'
// ESC close — REQUIRED
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
[왼쪽 2px 컬러 선] [체크박스] [즐겨찾기 별] [제목 + 휴지통(일반만)]
                                             [태그들] [dueDate시계] [날짜]

체크박스: 맨 왼쪽, 모든 할일 즉시 완료 (요청도 동일)
즐겨찾기: 체크박스 바로 오른쪽, opacity 0.25 → hover 0.6 → starred 1.0
휴지통: 일반 할일만, 제목 우측, opacity 0.2 → hover 1.0
        아이콘만 (border 없음, background 없음, box-shadow 없음)
클릭 진입: 아이템 전체 클릭 → 팝업
           체크박스/별/휴지통은 stopPropagation으로 팝업 차단
클릭 레이어: position absolute, left 66px (체크박스+별 영역 제외), zIndex 1
             체크박스/별: position relative, zIndex 2
```

### 13-4. 할일 데이터 구조 (Phase 3 — Firestore 반영 필요)

```typescript
{
  title: string          // 할일 제목 (기존 content → title로 분리 예정)
  content?: string       // 할일 상세 내용 (선택)
  dueDate?: string       // 기한 (선택, YYYY-MM-DD)
}
// 현재: content 필드가 제목 역할
// Phase 3에서 title/content 분리 + dueDate 전체 확장 예정
```

### 13-5. 정렬 기준

```
할일 목록:
  1. starred = true → 최상단
  2. dueDate 임박순
  3. createdAt 최신순

메모 목록:
  1. starred = true → 최상단
  2. createdAt 최신순
```

### 13-6. 삭제 원칙

```
단건 삭제:
  - 휴지통 클릭 → soft delete (deleted: true)
  - confirm 없음
  - 복구: 삭제된 할일 섹션에서 가능
  - 복구 시 completed: false 함께 초기화

팝업 내 삭제:
  - 삭제 버튼 → try/catch + addToast

bulk 삭제:
  - 선택/전체 삭제
  - try/catch/finally 필수 (R6.3)
```

### 13-7. 완료 처리 원칙

```
체크박스 클릭 (모든 할일 공통):
  → 0.6s 애니메이션 후 완료
  → 요청 할일도 즉시 완료 (팝업 없음)
  → cascade: posts.completed = true + todoRequests.status = 'completed'

팝업 내 완료처리 버튼 (요청 할일):
  → 동일 cascade
  → 완료 후 팝업 닫힘
```

### 13-8. 수정 원칙

```
모든 할일/메모:
  - 아이템 클릭 → 팝업에서 수정
  - 제목: 헤더 연필 아이콘 클릭 → 인라인 편집
  - 내용/기한/첨부/구분/범위: 팝업 바디에서 수정
  - ··· 메뉴 없음 (완전 제거)

요청 할일: 팝업에서 수정 가능 (저장 버튼)
```

### 13-9. 요청함 (TodoRequestModal) UX ⭐

```
위치: 패널 탭바 우측 우편함 아이콘
배지: 수락 대기 건수만 카운트

섹션 1 — 내가 수락해야 함: toEmail=나, status=pending, color #993556
섹션 2 — 내가 진행 중:    toEmail=나, status=accepted, color #C17B6B
섹션 3 — 상대방 대기 중:  fromEmail=나, status=pending|accepted, color #9E8880
섹션 4 — 완료·반려·취소:  기본 접힘, color #3B6D11
```

### 13-10. 완료 알림 원칙

```
트리거: 수신자가 요청 할일 완료 처리 시
요청자: 토스트("{이름}님이 완료했습니다") + 배지 증가
구현: onSnapshot에서 accepted→completed 변경 감지, fromEmail===나 조건
```

### 13-11. 모바일 대응 원칙

```
터치 타겟: 최소 44px
hover 전용 UI (휴지통): 롱프레스로 대체
tooltip: tap → 표시 유지
```

---

## 13-12. 업무상세 팝업 레이아웃 (2단 구조) ⭐

```
헤더: background #5C1F1F / 제목+메타(요청자→나/등록일/기한#F4C0D1)
좌측 220px: 상세내용 / 공개·구분 / 첨부파일
우측 flex:1: 댓글 + 입력창
푸터: 닫기(좌) / 완료처리+저장(우)
maxWidth: 860px
```

---

## 13-13. 팝업 통일 패턴 ⭐ (2026.04.06 확정)

> 할일 / 요청 할일 / 메모 모든 팝업에 적용. 새 팝업 설계 시 이 기준으로 작성.

### 공통 구조

```
헤더 (background #5C1F1F):
  제목 + 연필아이콘(바로 옆, opacity 0.3→hover 0.9) + 등록일
  기한 있으면: 시계아이콘 + 날짜 (color #F4C0D1, fontWeight 600)

상태바 (background #FDF8F4):
  [타입뱃지 | 카테고리태그 + 공개범위태그]
  타입뱃지: "할일" 또는 "메모" — 요청 할일도 "할일" 표시
  border-right로 태그들과 구분

필드 순서:
  1. 내용 (선택)
  2. 기한 — 항상 표시
     있음: 날짜 + 캘린더등록버튼 + × 클리어
     없음: "+ 기한 추가" (border-bottom dashed, hover 시 색 강조)
     메모: 기한 없음
  3. 첨부파일
  4. ── 구분선 ──
  5. 구분 (업무/개인)
  6. 보이는 범위 (전체/나만/특정)
     특정 선택 시 멤버 칩 목록

푸터:
  일반 할일 / 메모: 닫기 + 삭제(좌) / 저장(우)
  요청 할일:        닫기 + 삭제(좌) / 완료처리 + 저장(우)
  삭제: try/catch + addToast 필수
```

### 구분/보이는범위 버튼 색상 ⭐

```
⚠️ button 태그 사용 시 브라우저 기본 스타일이 CSS를 덮어씀
   → div 또는 span 태그 사용할 것

[구분]
업무 활성:   border #C17B6B   color #C17B6B   background #FFF5F2
업무 비활성: border rgba(193,123,107,0.35)  color rgba(193,123,107,0.45)  background rgba(255,245,242,0.5)
개인 활성:   border #7B5EA7   color #7B5EA7   background #F0ECF5
개인 비활성: border rgba(123,94,167,0.35)   color rgba(123,94,167,0.45)   background rgba(240,236,245,0.5)

[보이는 범위] background: none 공통
전체 활성:   border #639922  color #3B6D11
전체 비활성: border rgba(99,153,34,0.35)   color rgba(59,109,17,0.45)
나만 활성:   border #378ADD  color #185FA5
나만 비활성: border rgba(55,138,221,0.35)  color rgba(24,95,165,0.45)
특정 활성:   border #BA7517  color #854F0B
특정 비활성: border rgba(186,117,23,0.35)  color rgba(133,79,11,0.45)

hover: 비활성 → 활성 색상 (transition 0.15s ease)
```

### 요청 할일 추가 규칙

```
레이아웃: 좌측 220px + 우측 flex:1 채팅
좌측: 일반 할일과 동일 구성 (내용→기한→첨부→구분→범위)
우측: 채팅 영역
maxWidth: 860px
```

### 첨부파일 UI

```
파일 있을 때: [아이콘] [파일명] [열기] [×]
  border: 0.5px solid #EDE5DC, background: #FDFAF8, padding: 6px 10px

파일 추가 버튼:
  border: 0.5px dashed #C17B6B, color: #C17B6B
  padding: 6px 10px, width: 100%
  hover: background #FFF5F2
```

### 캘린더 등록 버튼

```
기한 있을 때만 표시
border: 1px solid #639922, color: #3B6D11, background: none
padding: 3px 9px, fontSize: 9px
hover: background #EAF3DE
```

---

## 14. Pre-flight Design Checklist

```
□ Is hover layer using inset:0 (not negative margin)?
□ Is z-index within the defined hierarchy?
□ Is transition set to 0.15s ease?
□ Is the new modal using useEscClose?
□ Is undefined never saved to Firestore?
□ Is the color assignment following the color-meaning system?
□ Does edit modal match create form options?
□ Is visibility tag border-only (no background)?
□ Is filter bar hidden on memo tab?
□ Does TodoRequestModal use section-based layout?
□ Does completion trigger cascade + toast?
□ Does new popup follow Section 13-13 unified pattern?
□ Are 구분/범위 buttons using div/span (not button tag)?
□ Are 구분/범위 buttons using correct on/off color (not white box)?
□ Is 휴지통 icon-only (no border, no background, no box-shadow)?
□ Is 클릭 레이어 left:66px covering item area excluding 체크박스/별?
```

---

## 15. Lessons Learned ⭐

```
Calendar event click conflict:
  ❌ stopPropagation only → ✅ data-event="true" + closest()

Team request calendar duplicate:
  ❌ each recipient registers → ✅ teamRequestId dedup

Personal event left border:
  ❌ always shown → ✅ only on isStart || isSingle

Deleted post ghost reappear:
  ❌ Firestore delete only → ✅ optimistic update first

any type:
  ❌ updates: any → ✅ interface PostUpdates { ... }

Specific visibility shown as "me only":
  ❌ length > 0 → 'me' → ✅ length===1 && [0]===author → 'me'; else → 'specific'

Tag style inconsistency:
  ❌ 각 컴포넌트 별도 정의 → ✅ Section 3 기준 통일

버튼 시안 색상 반영 안 됨:
  ❌ button 태그 → 브라우저 기본 스타일이 CSS 덮어씀
  ✅ div/span 태그 사용

구분/범위 비활성 버튼:
  ❌ 흰 박스 (#fff, border #EDE5DC)
  ✅ 각 색상 흐리게 (rgba opacity 0.35~0.45)
  비활성도 해당 색 유지 → hover 시 색 변화 자연스러움

TodoList 삭제 후 목록 미반영:
  ❌ !p.deleted 필터 없음 → ✅ todoAll 필터에 && !p.deleted 추가
```

---

*Updated: 2026.04.06 (Section 13-13 팝업 통일 패턴 추가 / 13-3·7·8 업데이트 / Lessons Learned 추가)*
