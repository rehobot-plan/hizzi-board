# Hizzi Board — Master Document

> **How to start a new session:**
> Attach these 4 files together: `hizzi-master.md` + `hizzi-rules.md` + `hizzi-flows.md` + `hizzi-uxui.md` + `hizzi-session.md`
> Then state today's task. Claude reads all 5 before responding.

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| **Project** | Hizzi Board |
| **URL** | https://hizzi-board.vercel.app |
| **Purpose** | 히찌 패션 브랜드 사내 협업 플랫폼 (게시판 · 달력 · 할일 · 연차 · 업무요청) |
| **Brand direction** | ZARA / COS — minimal, editorial, premium fashion intranet |
| **Team** | 6명 실사용 중 |
| **Core principle** | Accuracy over speed. Never ship without flow analysis. |

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + inline styles |
| State | Zustand |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| Storage | Firebase Storage |
| Deploy | Vercel |

---

## 3. Paths

```
Project root:     D:\Dropbox\Dropbox\hizzi-board
Firebase project: hizzi-board
serviceAccount:   D:\Dropbox\Dropbox\serviceAccount.json
```

---

## 4. File Structure

```
src/
├── app/
│   ├── page.tsx
│   ├── leave/page.tsx
│   ├── login/page.tsx
│   └── signup/page.tsx
├── components/
│   ├── Panel.tsx              # Panel skeleton (tabs / layout) ✅ refactored
│   ├── TodoList.tsx           # Active todos + sort ✅ new
│   ├── CompletedTodo.tsx      # Completed todos + bulk delete + date grouping ✅ new
│   ├── PostList.tsx           # Memo/post list + load more ✅ new
│   ├── PostItem.tsx           # Memo item (now supports 'specific' visibility)
│   ├── TodoItem.tsx           # Todo item + work-order modal
│   ├── CreatePost.tsx         # Post/todo/request creation modal
│   ├── Calendar.tsx           # Calendar + color-meaning system
│   ├── NoticeArea.tsx
│   ├── LeaveManager.tsx
│   ├── TodoRequestBadge.tsx
│   └── TodoRequestModal.tsx
├── hooks/
│   └── useEscClose.ts         # Global hook — ESC to close any modal
├── store/
│   ├── authStore.ts
│   ├── postStore.ts           # deletePost uses optimistic update
│   ├── panelStore.ts
│   ├── userStore.ts
│   ├── leaveStore.ts
│   ├── toastStore.ts
│   └── todoRequestStore.ts
└── lib/
    └── firebase.ts
```

---

## 5. File Dependency Map
> Always check this before editing. A change in one file ripples to others.

```
Panel.tsx
  → TodoList.tsx (canEdit prop)
  → PostList.tsx (filteredPosts, activeCategory props)

TodoList.tsx
  → TodoItem.tsx (post, canEdit props)
  → CompletedTodo.tsx (completedTodos, canEdit props)
  → postStore.ts (posts filtering)

CompletedTodo.tsx
  → todoRequestStore.ts (reactivateRequest)
  → postStore.ts (updatePost, deletePost)

PostList.tsx → PostItem.tsx

TodoItem.tsx → todoRequestStore.ts (completeRequest, reactivateRequest)

TodoRequestModal.tsx
  → todoRequestStore.ts (status filtering)
  → TodoRequestBadge.tsx (panelOwnerEmail)

Calendar.tsx
  → todoRequestStore.ts (acceptRequest → calendarEvents)
  → leaveStore.ts (leave events)

CreatePost.tsx (request tab)
  → todoRequestStore.ts (addRequest)
  → Calendar.tsx (dueDate → auto calendar entry)

Any new modal → useEscClose hook required
```

---

## 6. Firestore Data Schema

### `posts`
```typescript
{
  id: string
  panelId: string
  content: string
  attachment?: { type: 'image' | 'file' | 'link'; url: string; name?: string }
  author: string
  category: string
  visibleTo: string[]          // [] = all | [author] = me only | [author, ...others] = specific
  taskType?: 'work' | 'personal'
  starred?: boolean
  starredAt?: Date | null
  completed?: boolean
  completedAt?: Date | null
  pinned?: boolean
  requestId?: string
  requestFrom?: string
  requestTitle?: string
  requestContent?: string
  requestDueDate?: string | null
  createdAt: Date
  updatedAt: Date
}
```

### `todoRequests`
```typescript
{
  id: string
  fromEmail: string
  fromPanelId: string
  toEmail: string
  toPanelId: string
  title: string
  content: string
  dueDate?: string
  visibleTo: string[]
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
  rejectReason?: string
  teamLabel?: string
  teamRequestId?: string
  createdAt: Date
  resolvedAt?: Date | null
}
```

### `calendarEvents`
```typescript
{
  id: string
  title: string
  startDate: string
  endDate: string
  authorId: string
  authorName: string
  color: string
  createdAt: Date
  repeat?: { type: string; weeklyDay: string; excludeHolidays: boolean; endType: string; endDate: string; endCount: number }
  repeatGroupId?: string
  requestId?: string
  requestFrom?: string
  requestTitle?: string
  teamRequestId?: string
  taskType?: string
  visibility?: string
}
```

---

## 7. Panel Configuration

```
panel-1: 유미정  alwjd7175@gmail.com
panel-2: 조향래  kkjspfox@naver.com
panel-3: 김진우  oilpig85@gmail.com
panel-4: 우희훈  heehun96@naver.com
panel-5: 한다슬  ektmf335@gmail.com
panel-6: 홍아현  we4458@naver.com
admin:   admin@company.com / admin1234!
```

---

## 8. Firestore Rules (summary)

```
posts / panels / calendarEvents / leaveSettings / leaveEvents / todoRequests:
  read/create/update/delete → request.auth != null
users:
  read → request.auth != null
  write → self or admin only
```

---

## 9. Technical Debt Tracker

### ✅ Resolved
| Date | Item |
|------|------|
| 2026.04.03 | useEscClose — global ESC handler for all modals |
| 2026.04.05 | Panel.tsx split → TodoList / CompletedTodo / PostList |
| 2026.04.05 | deletePost optimistic update (fixes ghost re-render) |
| 2026.04.05 | PostItem visibility: added 'specific' option to edit modal |
| 2026.04.05 | CreatePost: specific visibleTo now includes author |

### 🔴 Active (this session or next)
```
1. Error handling unification
   catch(e){ console.error(e) } → addToast(error message)
   Files: TodoItem, CreatePost, Calendar, LeaveManager, todoRequestStore

2. Remove `any` types
   TodoItem.tsx       → updates: any
   CreatePost.tsx     → postData: any, requestData: any
   Calendar.tsx       → deleteConfirm target: any, ev: any
   todoRequestStore.ts → docData: any
```

### 🟡 Growth prep
```
3. Shared Firestore save helper (strip undefined automatically)
4. Verify realtime listener cleanup on unmount
5. Add common hooks: useFileUpload / useIsMobile / useCanEdit
```

### 🟢 Long-term (before Rehobot)
```
6. CSS custom properties for all color tokens
7. TypeScript strict mode (after any removal complete)
```

---

## 10. CLI Commands

```powershell
# Clean build
Remove-Item -Recurse -Force .next; npm run build

# Build with extended memory
$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run build

# Deploy
git add . && git commit -m "message" && npx vercel --prod

# Deploy Firestore rules only
npx firebase-tools deploy --only firestore:rules --project hizzi-board
```

---

## 11. Known Bug History

| Bug | Root cause | Fix |
|-----|-----------|-----|
| Todo complete not reflected in request tab | todoRequests status not updated | Added completeRequest() |
| Undo complete not reflected | reactivateRequest missing | Added reactivateRequest() |
| Calendar click opened add-event popup | onMouseUp stopPropagation ignored | data-event="true" + closest() check |
| Team request duplicated on calendar | Each recipient called acceptRequest | teamRequestId dedup check |
| undefined saved to Firestore | Optional fields stored as-is | Strip undefined via Object.keys |
| Dropdown clipped by overflow | overflow:auto parent chain | createPortal + position:fixed |
| Deleted post reappeared | onSnapshot timing race | Optimistic update in deletePost |
| Memo tab layout broken | PostItem hover margin:0 -20px | Removed margin, use inset:0 only |
| Specific visibility shown as "me only" | PostItem editVisibility used length===1 for all non-empty arrays | Fixed: length===1 && [0]===author → me; else → specific |

---

## 12. Collaboration Workflow

```
Owner (direction)  →  Claude.ai (Architect Agent)  →  Claude Code (Executor)
                         ↓
                    Reads all 5 MDs before any response
                    1. Check hizzi-rules.md (constraints)
                    2. Map flow in hizzi-flows.md (impact scope)
                    3. Design → write commands
                    4. Claude Code executes → reports result
```

### Session rules
- Error-check tasks (build / deploy / Firestore) → one at a time, confirm result before next
- File read / analysis / code write → batch together
- Claude Code commands → always bundled into one executable block
- File review → attach via 📎 (alphabetical, 2–3 at a time)
- Patch fails 3× → rewrite the file from scratch
- Session wrap-up → owner proposes (Claude never initiates)
- Claude always drives work forward, never waits passively

---

## 13. Roadmap

```
Phase 1 (now)   : Hizzi Board stabilization
Phase 2         : AI chat panel integration
Phase 3         : Rehobot UI/UX rebuild + commercialization
Phase 4         : Personal / company dual-channel

Rehobot pricing:
  Free    ₩0      30 uses/month
  Pro     ₩9,900/month
  Premium ₩19,900/month
```

---

*Updated: 2026.04.05*
