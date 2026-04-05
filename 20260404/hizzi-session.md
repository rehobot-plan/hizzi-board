# Hizzi Board — Session Log

> **New session prompt:**
> Attach all 5 MDs: `hizzi-master.md` + `hizzi-rules.md` + `hizzi-flows.md` + `hizzi-uxui.md` + `hizzi-session.md`
> Then paste this opener:

```
너는 내 시니어 파트너 개발자야.
히찌 패션 브랜드 사내 툴(히찌보드)을 함께 개발 중이고, 상용화 앱(Rehobot)도 준비 중이야.
글로벌로 갈 기업이라 처음부터 단단하게 구조를 잡아가고 있어. 속도보다 정확성이 우선.

첨부한 5개 MD가 전체 맥락이야. 코드 짜기 전에 반드시:
1. hizzi-rules.md의 Pre-flight Checklist 확인
2. hizzi-flows.md에서 영향받는 상태 흐름 확인
3. 관련 파일 📎 첨부 후 분석

핵심 규칙:
- any 타입 사용 금지 (불가피 시 이유 설명 + 승인)
- 상태 변경 시 cascade 효과 반드시 함께 처리
- 에러 catch는 반드시 addToast 포함
- 세션 마무리는 내가 제안
- 새 기능 전 상태 흐름도 먼저 정의

오늘 할 작업: [여기에 입력]
```

---

## Agent Workflow

```
Owner (direction)
  ↓
Claude.ai — Architect Agent
  reads all 5 MDs
  runs Pre-flight Checklist (hizzi-rules.md)
  maps cascade effects (hizzi-flows.md)
  writes Claude Code commands
  ↓
Claude Code — Executor
  runs commands, builds, deploys
  reports result
  ↓
Owner confirms → session continues or wraps
```

---

## ✅ Completed Work Log

### 2026.03.25 – 04.02
- Initial commit, design system setup, Panel / Calendar / 연차 full build

### 2026.04.03 AM
- Todo tab new development, UX improvements, critical bug fixes

### 2026.04.03 PM
- Todo request feature complete (todoRequests collection)
- Firestore Rules deployed, Cache-Control headers added

### 2026.04.03 Evening 1
- Request completion sync: check → todoRequest status 'completed'
- Undo completion sync: restore → status 'accepted'
- FROM tag design (terracotta left line + FROM name tag)
- Received todo: disable edit/delete
- Calendar: block add-event popup on event click
- Calendar: show 3 events + +n overflow popup
- Calendar: event detail shows request info
- Team request: calendar dedup + show all assignees
- useEscClose hook created + applied to all modals

### 2026.04.03 Evening 2
- Color meaning system applied (calendar / todo / buttons)
- Todo edit modal: specific visibility option added
- Work-order modal (click request todo → show brief)
- Accept/reject buttons: pastel green/pink (B variant)
- Calendar event block rendering
- Add-event: taskType + visibility selector UI
- Technical debt analysis complete, 8 MDs drafted
- `any` type ban rule established

### 2026.04.05 — Technical Debt Session
- **Panel.tsx refactor** ✅
  - CompletedTodo.tsx (completed todos + bulk delete + date grouping)
  - TodoList.tsx (active todos + sort + CompletedTodo composition)
  - PostList.tsx (memo/post list + load more)
  - Panel.tsx: skeleton only, unused imports/state/functions removed
  - Build success, deployed
- **Bug fixes** ✅
  - Ghost re-render after delete: deletePost optimistic update
  - Memo tab layout broken: PostItem hover layer margin removed
  - Specific visibility shown as "me only": PostItem editVisibility logic fixed + 'specific' option added to edit modal
  - CreatePost specific save: author now included in visibleTo

### 2026.04.05 — MD Restructure Session
- Restructured 7 MDs → 5 MDs
- New file: hizzi-rules.md (root-cause constraints + pre-flight checklist)
- hizzi-flows.md: enhanced with cascade tables
- hizzi-master.md: absorbed 협업패턴_가이드.md + 앞으로의방향_정리.md + 기술부채.md
- Removed: 협업패턴_가이드.md, 앞으로의방향_정리.md, 기술_부채.md (all absorbed)
- Agent architecture designed (Architect → parallel: Code / Review / Test)

---

## 🔴 Remaining Work — Priority Order

### Immediate (next session)
```
1. Error handling unification
   - All catch(e){console.error(e)} → addToast
   - Files: TodoItem, CreatePost, Calendar, LeaveManager, todoRequestStore

2. Remove `any` types
   - TodoItem.tsx    → updates: any
   - CreatePost.tsx  → postData: any, requestData: any
   - Calendar.tsx    → deleteConfirm target: any, ev: any
   - todoRequestStore.ts → docData: any
```

### Next sessions
```
3. Calendar "편집" → "수정" label change

4. Multi-day event edit/delete-all
   - Date range editable in detail modal
   - "전체 삭제" button

5. Leave edit: start/end date selector

6. Request archive (completed/rejected/cancelled → searchable)

7. Team leader confirmation flow (2-step)
```

### Leave
```
- Self-apply leave + approval flow
- Leave request A4 print form
```

### Separate sessions
```
- Mobile full unification
- Common hooks: useFileUpload, useIsMobile, useCanEdit
```

---

## 🟡 Later

```
- Notice board authoring
- AI chat panel sidebar integration
- Multi-company setup
```

---

## Session Wrap-up Checklist

```
1. Add completed work → ✅ Completed Work Log
2. Add new items → Remaining Work
3. Download all 5 MDs
4. Attach all 5 at next session start
```

---

*Updated: 2026.04.05*
