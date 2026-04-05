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
- 새 기능 전 반드시 아래 순서 준수

Claude 소통 원칙:
1. 결정 전 구조적 비교 제시
   선택지가 있을 때 → "A vs B — X:Y 비율로 B 추천, 이유: ..."
   형식으로 장단점 + 추천 근거 명시. 감정적 동조 금지.

2. 불확실하면 명시
   추측으로 답변 후 나중에 수정하는 패턴 금지.
   → "확실하지 않습니다. 확인 후 답변드릴게요"

3. 동의할 때도 근거 명시
   "맞아요" 단독 사용 금지.
   → "맞아요. 이유는 ..." 형식으로 근거 항상 포함.

4. 기술 결정은 trade-off로 표현
   "이게 더 좋아요" 단정 금지.
   → "이 방향은 X를 얻고 Y를 잃어요"로 표현.

5. 영향 범위 먼저 선언
   코드 수정 제안 시 코드 보여주기 전에 먼저:
   → "이 변경은 N개 파일에 영향을 줍니다: A, B, C"

6. 완료 기준 명시
   작업 시작 전 완료 기준을 먼저 정의.
   → "빌드 성공 + 배포 확인 + 기능 동작 확인 = 완료"

새 기능 요청 시 Claude 행동 순서:
1. 기능 의도 파악 후 객관식으로 필요한 정보 수집
   - 누가 / 어떤 조건에서 / 어떤 결과를 보는지
   - 기존 기능과 충돌 또는 연동 가능성
   - 상태 변경(status/completed 등)이 생기는지
   - 질문은 한 번에 하나씩, 객관식으로
2. 훅 추출 여부 판단 — 오너가 빠르게 결정할 수 있게 경우의 수를 먼저 제시
   예시 형식:
   "이 로직, 현재 A / B 2개 컴포넌트에 닿아요.
    앞으로 연결될 가능성:
      - C 추가 시 → 자동 적용 필요
      - D에도 동일 구조 사용 중
    훅으로 빼는 게 맞을 것 같아요. 진행할까요?"
   판단 기준: 2개 이상 컴포넌트에서 즉시 사용 or 확실히 늘어날 구조 → 훅 추출
3. flows.md 기준 cascade 영향 범위 선언
   - 새 흐름이면 flows.md에 먼저 추가 후 코드 작성
4. rules.md pre-flight checklist 확인
5. 관련 파일 📎 첨부 후 코드 작성

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
- Review Agent system prompt + template created (hizzi-review-agent.md)

### 2026.04.05 — Quality Session
- **Bug fix** ✅
  - Specific visibility shown as "me only" in PostItem/TodoItem: editVisibility init logic fixed (author identity check added)
  - CreatePost specific save: author included in visibleTo
  - PostItem/TodoItem edit modal: 'specific' option added
- **Error handling unification** ✅
  - TodoItem.tsx: catch → addToast
  - todoRequestStore.ts: all 6 catch blocks → addToast
  - toastStore.ts: extended to accept object `{ message, type }` in addition to string
- **any type removal** ✅
  - TodoItem.tsx: `updates: any` → `PostUpdates` interface
  - todoRequestStore.ts: `docData: any` → `NewTodoRequestDoc` interface
  - todoRequestStore.ts: `addPostFn: (postData: any)` → `AddPostData` interface
- **Review Agent** ✅
  - First real-world review run: PASS 6 / FAIL 0 / SKIP 2
  - Circular reference check: confirmed safe (toastStore does not import todoRequestStore)
- **Session prompt updated** ✅
  - New feature request flow: structured Q&A → cascade check → pre-flight → code

---

## 🔴 Remaining Work — Priority Order

### 2026.04.05 — Error / Type Session
- **Error handling unification** ✅
  - Calendar.tsx: 모든 catch → addToast (이미 적용돼 있었음)
  - CreatePost.tsx: handleSubmit / handleRequestSubmit catch → addToast
  - LeaveManager.tsx: handleSaveSetting / handleSaveLeave / handleDelete → try-catch + addToast
  - toastStore.ts: string 외 `{ message, type }` 객체 형태도 수용하도록 확장
- **any type removal** ✅
  - CreatePost.tsx: PostData / RequestData 인터페이스 추가
  - Calendar.tsx: deleteConfirm target `any` → `CalendarEvent | LeaveEvent` 유니온 + as 캐스팅
  - LeaveManager.tsx: 타입 변경 없음 (기존 유지)
- **useVisibilityTooltip 훅 신규** ✅
  - src/hooks/useVisibilityTooltip.ts 생성
  - PostItem.tsx / TodoItem.tsx 적용

---

## 🔴 Remaining Work — Priority Order

### Immediate (next session)
```
0. 버그: 메모 게시물 올린 후 빈 화면 표시
   - 증상: 메모 작성 후 빈 화면 → 새로고침 시 정상
   - 원인 추정: onClose(category) 후 Panel/PostList 카테고리 상태 처리 문제
   - 확인 필요 파일: Panel.tsx, PostList.tsx, CreatePost.tsx

1. 버그: 특정인 공개범위 hover tooltip 미작동
   - useVisibilityTooltip 훅은 생성됐으나 실제 동작 안 됨
   - 원인: title 속성이 2px 선 div에 적용돼 hover 영역이 너무 좁음
   - 개선 방향: 아이템 전체 영역에 tooltip 적용 검토 필요
   - 확인 필요 파일: PostItem.tsx, TodoItem.tsx
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
3. Download 5 MDs (master / rules / flows / uxui / session)
```

## Next Session — File Attachment Guide

```
Architect 탭 (이 탭, 매 세션):
  📎 hizzi-master.md
  📎 hizzi-rules.md
  📎 hizzi-flows.md
  📎 hizzi-uxui.md
  📎 hizzi-session.md
  → 세션 프롬프트 붙여넣기

Reviewer 탭 (리뷰 전용, 세션당 한 번만 세팅):
  📎 hizzi-rules.md
  📎 hizzi-review-agent.md
  → PART 1 프롬프트 붙여넣기
  → "이해했으면 '리뷰 준비 완료'라고만 답해" 전송
  → 이후 이 탭은 리뷰 요청만 받음 (다른 대화 금지)

hizzi-review-agent.md는 Architect 탭에 올리지 않는다.
Reviewer 탭이 이미 열려 있으면 세션 중 재세팅 불필요.
```

---

*Updated: 2026.04.05 (Quality Session)*
