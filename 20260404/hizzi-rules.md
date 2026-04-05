# Hizzi Board — Coding Rules & Pre-flight Checklist

> **Claude reads this file before writing any code.**
> These are not case-by-case tips. They are root-cause constraints that prevent entire classes of bugs.
> When adding a new rule: write WHY the mistake recurs, not just what to do.

---

## HOW TO USE THIS FILE

Before writing code, Claude must answer every question in the relevant section.
If any answer is "not sure" → stop and inspect the file first.

---

## SECTION 1 — `visibleTo` (Visibility Logic)

### Root cause of recurring bugs
`visibleTo` encodes three distinct states in one array, and the meaning of each state
must be consistent across creation, display, and editing.

```
[]                          → visible to all (전체)
[author]                    → visible to author only (나만)
[author, ...otherEmails]    → visible to specific people (특정인)
```

### Rules

**R1.1 — Always include author when saving 'specific'**
```typescript
// ❌ WRONG — author cannot see their own post
visibleTo = [...selectedUsers]

// ✅ CORRECT
visibleTo = [user.email!, ...selectedUsers.filter(e => e !== user.email)]
```

**R1.2 — Display logic must cover all three states**
```typescript
// ❌ WRONG — collapses 'specific' into 'me'
const label = visibleTo.length === 0 ? '전체' : '나만'

// ✅ CORRECT
const label =
  visibleTo.length === 0 ? '전체' :
  visibleTo.length === 1 && visibleTo[0] === author ? '나만' :
  '특정인'
```

**R1.3 — Edit modal must offer the same options as create modal**
If create has [전체 / 나만 / 특정인], the edit modal must also have all three.
Never reduce options in edit mode.

**R1.4 — Edit modal initial state must reverse-engineer the saved value**
```typescript
// ❌ WRONG
const init = visibleTo.length === 0 ? 'all' : 'me'

// ✅ CORRECT
const init =
  !visibleTo || visibleTo.length === 0 ? 'all' :
  visibleTo.length === 1 && visibleTo[0] === author ? 'me' :
  'specific'
```

### Pre-flight questions
```
□ Does every save path include the author in visibleTo when visibility !== 'all'?
□ Does every display path handle all three states ([], [author], [author, ...others])?
□ Does the edit modal offer the same visibility options as the create form?
□ Does the edit modal correctly initialize from the saved visibleTo array?
```

---

## SECTION 2 — State Transitions & Cascading Updates

### Root cause of recurring bugs
State changes in this app are never isolated. One status change always requires
updating 2–3 documents atomically. Partial updates cause UI/data inconsistency.

### Rules

**R2.1 — Never update a single document when a state transition is involved**
Always refer to `hizzi-flows.md` before writing any status change.

**R2.2 — Mandatory cascade table**
```
post.completed = true   → todoRequests.status = 'completed'  (if requestId exists)
post.completed = false  → todoRequests.status = 'accepted'   (if requestId exists)
todoRequest accepted    → post created + calendarEvent created (if dueDate exists)
todoRequest rejected    → rejectReason saved
```

**R2.3 — Team requests: deduplicate calendar entries**
```typescript
// ❌ WRONG — each recipient creates a calendar event
for (const toEmail of recipients) { await acceptRequest(...) }

// ✅ CORRECT — only first acceptor creates the event; use teamRequestId to deduplicate
if (!existingEvent with teamRequestId) { createCalendarEvent(...) }
```

### Pre-flight questions
```
□ Does this state change touch more than one collection? (check hizzi-flows.md)
□ Is every cascade update listed in R2.2 covered?
□ For team requests: is calendar deduplication handled?
```

---

## SECTION 3 — Firestore Save Safety

### Root cause of recurring bugs
Firestore rejects documents containing `undefined` values silently in some SDK versions,
causing partial saves that are very hard to debug.

### Rules

**R3.1 — Never save `undefined` to Firestore**
```typescript
// ❌ WRONG
const data = { title, dueDate: requestDueDate || undefined }
await setDoc(ref, data)

// ✅ CORRECT — strip undefined before saving
function stripUndefined<T extends object>(obj: T): Partial<T> {
  const cleaned = { ...obj }
  Object.keys(cleaned).forEach(k => {
    if ((cleaned as Record<string, unknown>)[k] === undefined)
      delete (cleaned as Record<string, unknown>)[k]
  })
  return cleaned
}
await setDoc(ref, stripUndefined(data))
```

**R3.2 — Timezone: never use `toISOString()`**
```typescript
// ❌ WRONG — shifts date in KST timezone
date.toISOString().split('T')[0]

// ✅ CORRECT — local time string
`${year}-${month}-${day}T00:00:00`
```

**R3.3 — New collections require Firestore rules update before deploy**

### Pre-flight questions
```
□ Are all optional fields stripped of undefined before Firestore save?
□ Are date strings using local time format (not toISOString)?
□ If adding a new collection: is firestore.rules updated?
```

---

## SECTION 4 — TypeScript Type Safety

### Root cause of recurring bugs
`any` types disable the compiler's ability to catch errors at build time,
pushing bugs to runtime where they are harder and more expensive to fix.

### Rules

**R4.1 — `any` type is forbidden**
```typescript
// ❌ FORBIDDEN
const updates: any = {}
const postData: any = {}

// ✅ REQUIRED — define an explicit interface
interface PostUpdates {
  content?: string
  taskType?: 'work' | 'personal'
  visibleTo?: string[]
  completed?: boolean
  completedAt?: Date | null
}
const updates: PostUpdates = {}
```

**R4.2 — Use `Partial<T>` for Firestore update objects**
```typescript
const updates: Partial<Post> = {}
```

**R4.3 — Exception process**
If `any` is genuinely unavoidable (e.g. external SDK type gap):
1. Claude explains why in a comment
2. Owner explicitly approves
3. A `// TODO: remove any — reason: ...` comment is added

### Pre-flight questions
```
□ Does any new code introduce an `any` type?
□ If yes: is there a proper interface that could replace it?
□ If any is unavoidable: is owner approval obtained?
```

---

## SECTION 5 — UI & Modal Patterns

### Root cause of recurring bugs
Inconsistent modal/overlay patterns cause z-index conflicts, ESC not working,
and layout breakage from overflow clipping.

### Rules

**R5.1 — Every modal must use useEscClose**
```typescript
import { useEscClose } from '@/hooks/useEscClose'
useEscClose(() => setIsOpen(false), isOpen)

// Multiple modals: priority order
useEscClose(() => {
  if (showDetail) { setShowDetail(null); return }
  if (showAdd) { setShowAdd(false); return }
}, showDetail || showAdd)
```

**R5.2 — Hover layer: never use negative margin**
```typescript
// ❌ WRONG — clips under overflow:auto parent
<div style={{ position:'absolute', inset:0, margin:'0 -20px' }} />

// ✅ CORRECT
<div style={{ position:'absolute', inset:0 }} />
```

**R5.3 — Dropdown/menu overflow: use createPortal + position:fixed**
Any dropdown that appears inside a scrollable container must be rendered via `createPortal`
to avoid overflow clipping.

**R5.4 — Z-index hierarchy (do not deviate)**
```
Panel internal:    10
Dropdown:         100
Modal overlay:   1000
Modal body:      1001
Calendar modal:    50
Calendar more:     70
Toast / Portal:  9999
```

**R5.5 — Transition: 0.15s ease only**
No transitions longer than 0.15s. No `linear`. No padding/margin transitions.

### Pre-flight questions
```
□ Does every new modal call useEscClose?
□ Does any hover layer use negative margin? (must not)
□ Does any dropdown live inside overflow:auto? (use Portal)
□ Are all z-index values within the defined hierarchy?
```

---

## SECTION 6 — Error Handling

### Root cause of recurring bugs
Silent `console.error` gives no user feedback on failure. Users retry, cause duplicate writes,
or think the action succeeded when it didn't.

### Rules

**R6.1 — Every catch block must call addToast**
```typescript
// ❌ WRONG
} catch (e) { console.error(e) }

// ✅ CORRECT
} catch (e) {
  console.error(e)
  addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' })
}
```

**R6.2 — Optimistic update pattern (deletePost model)**
For destructive actions, update Zustand state first, then call Firestore.
This prevents ghost re-renders from onSnapshot race conditions.
```typescript
// 1. Update local state immediately
set(state => ({ posts: state.posts.filter(p => p.id !== postId) }))
// 2. Then persist to Firestore
await deleteDoc(doc(db, 'posts', postId))
```

### Pre-flight questions
```
□ Does every try-catch block call addToast on error?
□ For delete actions: is optimistic update applied before Firestore call?
```

---

## SECTION 7 — Common Hooks

```
useEscClose(onClose, isOpen)   — REQUIRED for every modal
useFileUpload(panelId)         — planned: Storage upload (TodoItem / CreatePost)
useIsMobile(breakpoint)        — planned: mobile detection (Calendar / Panel)
useCanEdit(ownerEmail)         — planned: edit permission check
useMultiSelect(items)          — planned: checkbox multi-select
```

> Before writing upload or mobile-detection logic inline, check if the planned hook exists.
> If it doesn't exist yet, consider creating it rather than duplicating the logic.

---

## MASTER PRE-FLIGHT CHECKLIST
> Run through this before writing any code. Takes 30 seconds. Saves hours.

```
VISIBILITY
□ visibleTo saved with author included when not 'all'?
□ Display logic handles all three states?
□ Edit modal matches create form options?

STATE TRANSITIONS
□ Checked hizzi-flows.md for cascade requirements?
□ All cascade updates covered in one operation?

FIRESTORE
□ undefined stripped before save?
□ Date strings in local time format?

TYPES
□ No `any` types introduced?

MODALS
□ useEscClose applied?
□ No negative margin on hover layers?
□ Overflow dropdowns use Portal?

ERROR HANDLING
□ Every catch calls addToast?
□ Destructive actions use optimistic update?
```

---

*Updated: 2026.04.05*
