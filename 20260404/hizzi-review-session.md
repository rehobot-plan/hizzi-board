# 히찌보드 — 리뷰 세션 기록

> 기간: 2026.04.08
> 리뷰어: Claude (Sonnet 4)
> 적용 규칙: hizzi-rules.md (한글화 재작성 버전 기준)

> ⚠️ 규칙 번호 변경 안내 (2026.04.08)
> hizzi-rules.md 전면 재작업으로 규칙 번호 체계가 변경됐습니다.
> 이전: R1~R9 → 이후: S1~S8 (섹션) 기반
> 아래 FAIL/CONDITIONAL PASS 항목의 규칙 번호는 구버전 기준이며, 신규 리뷰부터 새 번호 체계 적용.

---

## 세션 요약

| 제출 # | 파일 | 체크 그룹 | PASS | FAIL | SKIP |
|--------|------|-----------|------|------|------|
| 1 | CreatePost.tsx, Calendar.tsx, LeaveManager.tsx | D, F | 5 | 0 | 3 |
| 2 | postStore.ts | B, F | 3 | 0 | 3 |
| 3 | postStore.ts, Panel.tsx, PostList.tsx, PostItem.tsx | A, B, F | 7 | 0 | 5 |
| 4 | Panel.tsx, PostList.tsx | F | 1 | 1 | 0 |
| 5 | PostList.tsx (선택/전체삭제 try-catch) | F | 3 | 0 | 0 |
| 6 | CompletedTodo.tsx | F | 3 | 0 | 0 |
| 7 | Panel.tsx, PostList.tsx (useEscClose) | E | 5 | 0 | 0 |
| 8 | TodoItem.tsx, PostItem.tsx (태그 스타일) | E | 2 | 0 | 0 |
| 9 | Panel.tsx, TodoList.tsx (필터바) | B, E, D | 4 | 0 | 3 |
| 10 | TodoItem.tsx (날짜/별/태그) | A, E, F | 5 | 0 | 3 |
| 11 | PostItem.tsx (handleStar addToast) | F | 2 | 0 | 0 |
| 12 | Panel.tsx, TodoItem.tsx (헤더/태그) | A, E | 4 | 0 | 3 |
| 13 | TodoItem.tsx (handleCheck cascade, 체크박스, 팝업) | A, B, E, F | 6 | 0 | 4 |
| 14 | TodoItem.tsx (showDetailModal, handleDetailSave) | A, B, E, F | 7 | 1 | 4 |
| 15 | DeletedTodo.tsx, TodoList.tsx | D, F | 6 | 0 | 0 |
| 16 | CreatePost.tsx (전체) | ALL | 14 | 0 | 5 |
| 17 | CreatePost.tsx (기한 입력 UX) | C, D | 2 | 0 | 0 |
| 18 | postStore.ts, CreatePost.tsx, TodoItem.tsx 등 (title 필드) | A, C, D | 4 | 0 | 3 |
| 19 | CreatePost.tsx (title 필드 재제출) | A, C, D | 7 | 0 | 0 |
| 20 | TodoItem.tsx (showDetailModal 풀코드) | A, B, E, F | 6 | 0 | 4 |

**누적 집계: PASS 100 / FAIL 2 / SKIP 40**

---

## 체크 그룹 기준

```
A — visibleTo (공개범위)       → hizzi-rules.md S7
B — 상태 전환 & cascade        → hizzi-rules.md S1 + hizzi-flows.md
C — Firestore 저장 안전        → hizzi-rules.md S3
D — TypeScript 타입            → hizzi-rules.md S5
E — UI & 모달 패턴             → hizzi-rules.md S8
F — 에러 처리                  → hizzi-rules.md S2
```

---

## FAIL 목록

### FAIL 1 — Panel.tsx 헤더 삭제 버튼 (제출 #4)

- **파일:** `Panel.tsx`
- **위치:** `memoSelectMode` 삭제 버튼 `onClick`
- **위반:** S2 (구 R6.1) — try-catch 없음. `deletePost` 실패 시 에러 무음 처리.
- **상태:** ✅ 다음 제출에서 수정 확인됨

```typescript
onClick={async () => {
  try {
    for (const id of memoSelectedIds) {
      await usePostStore.getState().deletePost(id);
    }
    setMemoSelectedIds([]);
    setMemoSelectMode(false);
  } catch (e) {
    console.error(e);
    // deletePost 내부에 addToast가 있으므로 중복 toast 없음
    setMemoSelectedIds([]);
    setMemoSelectMode(false);
  }
}}
```

---

### FAIL 2 — TodoItem.tsx showDetailModal 푸터 삭제 버튼 (제출 #14)

- **파일:** `TodoItem.tsx`
- **위치:** `showDetailModal` 푸터 삭제 버튼 `onClick`
- **위반:** S2 (구 R6.1) — `handleDelete()` 직접 호출, try-catch 없음.
- **상태:** ✅ 이후 제출(#20)에서 수정 확인됨

```typescript
onClick={async () => {
  try {
    await handleDelete();
    setShowDetailModal(false);
  } catch (e) {
    console.error(e);
    addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' });
  }
}}
```

---

## 주요 CONDITIONAL PASS / 확인 요청 사항

### 1. Calendar.tsx deleteConfirm 호출부 (제출 #1)
- `target: CalendarEvent | LeaveEvent` 유니온 타입 자체는 올바르나 `executeDelete*` 호출부에서 `type` 필드로 분기 여부 미확인.
- **권고:** `type === 'leave'` 분기 후 `as LeaveEvent` 캐스팅 확인.

### 2. completeRequest 내부 cascade (제출 #13)
- `handleCheck`에서 `completeRequest(post.requestId)` 호출 확인됨.
- 단, `completeRequest` 내부에서 `todoRequests.status='completed'` + `resolvedAt` 처리 여부 코드 미첨부.
- **S1 (구 R2.2) 조건부 PASS** — `completeRequest` 내부 확인 필요.

### 3. TodoList.tsx requestFrom 필드 (제출 #9)
- `const isRequest = !!p.requestId || !!p.requestFrom` — `Post` 타입에 `requestFrom` 필드 정의 여부 확인 필요.
- 없으면 TypeScript 컴파일 에러.

### 4. PostList.tsx allPosts 직접 구독 (제출 #3)
- deleted 메모 표시를 위해 `usePostStore()`에서 `allPosts` 직접 구독.
- Firestore 쿼리에 `where('deleted', '==', false)` 필터가 없어야 deleted 문서가 수신됨 — 확인 필요.

### 5. TodoItem.tsx margin: '0 -20px' (제출 #10)
- S8 (구 R5.2) 위반 (음수 margin) 지적됨.
- 기존부터 존재하던 패턴으로 **별도 티켓 권고** 처리. 미수정.

### 6. showOrderModal useEscClose (제출 #13)
- 기존 모달 교체이므로 이번 리뷰 범위 외로 처리.
- **단, 별도 티켓으로 추가 권고.**

---

## 규칙별 누적 패턴

### 자주 발생한 위반 유형

| 규칙 | 설명 | 이번 세션 발생 |
|------|------|---------------|
| S2 (구 R6.1) | catch에 addToast 누락 | 2건 (FAIL) |
| S8 (구 R5.2) | 음수 margin | 1건 (기존 코드, 미수정) |
| S5 (구 R4.1) | any 타입 | 0건 (모두 사전 제거됨) |
| S7 (구 R1.1) | visibleTo author 누락 | 0건 |
| S7 (구 R1.4) | edit 초기값 역산 오류 | 0건 |

### 잘 지켜진 패턴

- `stripUndefined()` — CreatePost.tsx 저장 경로 전체 적용 ✅
- `getVisibleTo()` — author 포함 일관성 유지 ✅
- `useEscClose` — 신규 모달 전체 적용 ✅
- `hardDeletePost` vs `deletePost` 구분 — CompletedTodo/DeletedTodo 정확히 사용 ✅
- 낙관적 업데이트 순서 (`set` → Firestore) — postStore 전체 준수 ✅

---

## 미해결 / 다음 세션 필요 항목

1. **PostList.tsx 복구 버튼 추가** — `DeletedRow` 컴포넌트에 복구 버튼 삽입 (PostList.tsx 파일 미첨부로 진행 불가)
2. **CompletedTodo.tsx / DeletedTodo.tsx** — `post.content → post.title || post.content` 교체 범위 검증 (파일 미첨부)
3. **TodoItem.tsx margin: '0 -20px'** — S8 위반 해소
4. **completeRequest 내부 cascade** — S1 최종 확인 (todoRequestStore.ts 첨부 필요)
5. **showOrderModal useEscClose** — S8 추가
6. **Calendar.tsx deleteConfirm 분기** — type 필드 분기 확인

---

*Updated: 2026.04.08 (규칙 번호 체계 신버전 반영 / 체크 그룹 기준 추가 / CONDITIONAL PASS 항목 6번 추가)*
