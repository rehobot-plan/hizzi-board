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

### Todo tags
```
Task type:    work → #C17B6B / #FFF5F2   |  personal → #9E8880 / #F5F0EE
Visibility:   all → green  |  me → blue  |  specific → amber
FROM tag (received request): #FCEEE9 bg + #A0503A text + 0.5px solid #C17B6B border
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
This causes layout breakage inside `overflow-y: auto` parents.
Use `inset: 0` only.

---

## 6. Left Border Color Resolution

```typescript
function getLeftBorderColor(post: Post): string {
  if (post.requestFrom) return '#993556'  // received request
  if (post.starred)     return '#C17B6B'  // starred
  if (!post.visibleTo || post.visibleTo.length === 0) return '#639922'   // all
  if (post.visibleTo.length === 1 && post.visibleTo[0] === post.author)  // me only
    return '#378ADD'
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
// Required on every calendar event element
<div data-event="true" ...>

// In the parent click/mouseUp handler:
const clickedEvent = (e.target as HTMLElement).closest('[data-event="true"]')
if (clickedEvent) return  // don't open add-event popup

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

## 13. Pre-flight Design Checklist

```
□ Is hover layer using inset:0 (not negative margin)?
□ Is z-index within the defined hierarchy?
□ Is transition set to 0.15s ease?
□ Is the new modal using useEscClose?
□ Is undefined never saved to Firestore (visibleTo, attachments)?
□ Is the color assignment following the color-meaning system?
□ Does edit modal match create form in options and layout?
```

---

## 14. Lessons Learned ⭐

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
```

---

*Updated: 2026.04.05*
