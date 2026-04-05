# Hizzi Board — State Flow Map (Circuit Diagram)

> **Claude reads this before designing any feature that changes state.**
> When a new state transition is added, document it here first — then code.
> If you discover an undocumented cascade effect: report to owner before implementing.

---

## HOW TO USE THIS FILE

1. Identify which state changes your feature touches
2. Find the relevant flow below
3. List every cascade effect (other documents that must also update)
4. Only then write code

---

## FLOW 1 — todoRequest Status Machine

```
                    ┌─────────────────────────┐
                    │         pending          │
                    └──┬──────────┬────────────┘
                       │          │
              [accept] │          │ [reject]       [cancel]
                       ▼          ▼                    ▼
                  accepted     rejected            cancelled
                  │    ▲
    [mark done]   │    │ [undo done]
                  ▼    │
               completed
```

### Transition: pending → accepted
```
Trigger: recipient clicks "수락"

Must update ALL of the following:
  1. todoRequests.status = 'accepted'
  2. Create new post in posts collection (the todo item)
  3. IF dueDate exists → create calendarEvent
     - IF team request (teamRequestId exists) → create only once
       (check: no existing calendarEvent with same teamRequestId)

Files: todoRequestStore.ts > acceptRequest()
       Calendar.tsx (receives the calendar entry)
```

### Transition: accepted → completed
```
Trigger: assignee clicks "완료처리" in work-order modal

Must update ALL of the following:
  1. posts.completed = true
  2. posts.completedAt = new Date()
  3. todoRequests.status = 'completed'
  4. todoRequests.resolvedAt = serverTimestamp()

Files: TodoItem.tsx > handleComplete()
       todoRequestStore.ts > completeRequest()
```

### Transition: completed → accepted (undo)
```
Trigger: assignee clicks undo/restore in CompletedTodo

Must update ALL of the following:
  1. posts.completed = false
  2. posts.completedAt = null
  3. todoRequests.status = 'accepted'
  4. todoRequests.resolvedAt = null

Files: CompletedTodo.tsx > restore button
       todoRequestStore.ts > reactivateRequest()
```

### Transition: pending → rejected
```
Trigger: recipient clicks "반려"

Must update:
  1. todoRequests.status = 'rejected'
  2. todoRequests.rejectReason = <reason string>

Files: TodoRequestModal.tsx > handleReject()
```

### Transition: pending → cancelled
```
Trigger: requester clicks "취소"

Must update:
  1. todoRequests.status = 'cancelled'

Files: TodoRequestModal.tsx > cancelRequest()
```

---

## FLOW 2 — Post (Todo) Completion State

```
[active] ──(check)──→ [completed]
   └──────────────────────(uncheck)──┘
```

### Case A: Regular todo (no requestId)
```
Check:   posts.completed = true,  completedAt = new Date()
Uncheck: posts.completed = false, completedAt = null
Cascade: none
```

### Case B: Request-linked todo (requestId exists)
```
Check:   posts.completed = true  + todoRequests.status = 'completed'  ← MANDATORY
Uncheck: posts.completed = false + todoRequests.status = 'accepted'   ← MANDATORY

Never update post.completed without also updating todoRequests.status when requestId exists.
```

---

## FLOW 3 — Calendar Event Color Resolution

```
On event creation:
  taskType ('work' | 'personal')  ╗
  visibility ('all'|'me'|'specific') ╝ → getEventColor() → hex color

On request accept:
  color = '#993556' (fixed — request type)
  taskType = 'work', visibility = 'all' (defaults)
```

### Color mapping (source of truth — also in hizzi-uxui.md)
```
work   + all      → #3B6D11  (green, solid fill)
work   + me       → #185FA5  (blue,  solid fill)
work   + specific → #854F0B  (amber, solid fill)
personal + all    → rgba(99,153,34,0.15)  + #639922 left border
personal + me     → rgba(55,138,221,0.15) + #378ADD left border
personal + specific → rgba(186,117,23,0.15) + #BA7517 left border
leave             → rgba(83,74,183,0.15)  + #534AB7 left border
request           → #993556 + 3px solid #72243E
```

---

## FLOW 4 — Leave (연차) State

```
[registered] → confirmed: false ──(confirm)──→ confirmed: true
                    │
                    └── isPastOrToday = true → locked (no edit/delete, except admin)
```

---

## FLOW 5 — visibleTo Resolution (display logic)

```
Input: post.visibleTo array

[]                          → label: '전체'   / left-border color: #639922 (green)
[author]                    → label: '나만'   / left-border color: #378ADD (blue)
[author, ...others]         → label: '특정인' / left-border color: #BA7517 (amber)
```

This resolution must be applied consistently in:
- PostItem.tsx (display label + left border color)
- TodoItem.tsx (tag display)
- PostItem.tsx editVisibility initial state
- CreatePost.tsx (save path)

---

## FLOW 6 — Planned: Leave Request & Approval (not yet implemented)

```
[신청] → [pending] ──(approve)──→ [approved] → leaveEvent created
                  └──(reject)──→  [rejected]
```

---

## Rules for Adding New Flows

```
1. Define state names (what values change and how)
2. Define transition triggers (what user action causes the change)
3. List all cascade effects (other collections/stores that must also update)
4. Identify the files responsible for each step
5. Add the flow here BEFORE writing code
```

---

*Updated: 2026.04.05*
