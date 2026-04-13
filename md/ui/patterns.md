# 히찌보드 — UI 패턴

> 컴포넌트 구현 방법의 기준.
> 새 컴포넌트 작성 전 여기를 먼저 확인한다.
> 패턴 변경 시 오너 승인 필수.
> 모달 패턴 상세 (P8, P9, P10): patterns-modal.md 참조.

---

## P1. 레이어 기반 Hover 패턴 ⭐

```tsx
<div style={{ position: 'relative', padding: '12px 8px' }}>
  {/* 레이어 0: hover 배경 */}
  <div style={{
    position: 'absolute', inset: 0,
    background: isHovered ? '#FDF8F4' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none', zIndex: 0,
  }} />
  {/* 레이어 1: 왼쪽 2px 컬러 띠 */}
  <div style={{
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: getLeftBorderColor(post),
    pointerEvents: 'none', zIndex: 1,
  }} />
  {/* 레이어 2: 실제 콘텐츠 */}
  <div style={{ position: 'relative', zIndex: 2 }}>{content}</div>
</div>
```

⚠️ hover 레이어에 `margin: '0 -20px'` 절대 금지. `inset: 0`만 사용.

---

## P2. 좌측 띠 색상 결정 함수

좌측 띠는 카테고리 축(업무/개인/요청)만 표현한다.
visibility · starred 축은 본문 태그(VisibilityTag · 별 아이콘)가 담당한다.
한 정보를 두 곳에서 표현하지 않는다.

```typescript
// 메모 (2분기)
function postLeftBorderColor(post: Post): string {
  if (post.taskType === 'personal') return '#7B5EA7'  // 개인
  return '#C17B6B'                                     // 업무
}

// 할일 (3분기 — 요청 추가)
function todoLeftBorderColor(todo: Post): string {
  if (todo.requestFrom) return '#993556'              // 요청
  if (todo.taskType === 'personal') return '#7B5EA7'  // 개인
  return '#C17B6B'                                     // 업무
}
```

위치: src/lib/leftBorderColor.ts (Phase 5-B에서 추출)

---

## P3. 모달 패턴

```tsx
{/* 오버레이 */}
<div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(44,20,16,0.4)' }}
  onClick={() => setIsOpen(false)}>
  {/* 카드 */}
  <div style={{ background: '#fff', border: '1px solid #EDE5DC', zIndex: 1001 }}
    onClick={e => e.stopPropagation()}>
    {/* 푸터 */}
    <div style={{ background: '#FDF8F4', borderTop: '1px solid #EDE5DC' }} />
  </div>
</div>
// ESC 닫기 — 필수
useEscClose(() => setIsOpen(false), isOpen)
```

---

## P4. 입력 필드 패턴

```tsx
<input style={{
  border: 'none',
  borderBottom: '1px solid #EDE5DC',
  fontSize: 13,
  color: '#2C1810',
  background: 'transparent',
  outline: 'none',
}} />
```

---

## P5. z-index 계층 (이탈 금지)

```
패널 내부:       10
드롭다운:       100
모달 오버레이: 1000
모달 본체:     1001
캘린더 모달:     50
캘린더 더보기:   70
Toast · Portal: 9999
```

---

## P6. 애니메이션 규칙

```
모든 transition: 0.15s ease
금지: 0.3s 이상 / linear / padding·margin에 transition
```

---

## P7. 캘린더 클릭 가드 패턴

```typescript
// 이벤트 요소에 data-event="true" 부여
<div data-event="true" ...>

// 클릭 핸들러에서 이벤트 클릭 여부 확인
const clickedEvent = (e.target as HTMLElement).closest('[data-event="true"]')
if (clickedEvent) return

// 개인 이벤트 왼쪽 테두리: isStart || isSingle일 때만 렌더링
{(isStart || isSingle) && <div style={{ borderLeft: '3px solid ...' }} />}
```
