# 히찌보드 — 상태 흐름 맵

> **상태를 변경하는 기능을 설계하기 전에 반드시 읽는다.**
> 새 흐름 추가 순서: 레이어 1 → 레이어 2 → 레이어 3 → 코드 (역순 금지)
> 문서화되지 않은 연쇄 효과를 발견하면: 구현 전에 오너에게 보고한다.

---

## 이 파일 사용법

1. 내 기능이 어떤 상태 변경에 영향을 주는지 파악한다
2. 레이어 1에서 연쇄 규칙을 확인한다
3. 레이어 2에서 허용된 전환인지 검증한다
4. 레이어 3에서 구현 상세를 참조한다
5. 레이어 2와 레이어 3은 항상 동기화한다 (둘 중 하나만 수정 금지)

---

## 레이어 1. 컬렉션 연쇄 규칙

> 어떤 컬렉션이 바뀌면 무엇이 따라 바뀌는가. 모든 상태 변경 전 이 테이블을 먼저 확인한다.
> 연쇄 실패 시 기본 원칙: 각각 독립 try/catch + addToast. 롤백 불가 케이스는 레이어 3에 개별 기술.

| 변경 대상 | 조건 | 연쇄 업데이트 |
|-----------|------|--------------|
| `posts.completed = true` | requestId 있을 때 | `todoRequests.status = 'completed'` |
| `posts.completed = false` | requestId 있을 때 | `todoRequests.status = 'accepted'` |
| `posts.deleted = true` | requestId 있을 때 | `todoRequests.status = 'cancelled'` |
| `todoRequests.status = 'accepted'` | 항상 | `posts` 생성 |
| `todoRequests.status = 'accepted'` | dueDate 있을 때 | `calendarEvents` 생성 |
| `todoRequests.status = 'accepted'` | teamRequestId 있을 때 | `calendarEvents` 중복 생성 방지 |
| `posts.visibleTo` 변경 | 항상 | 연쇄 없음 (단독 업데이트) |
| `posts.starred` 변경 | 항상 | 연쇄 없음 (단독 업데이트) |
| `leaveEvents.confirmed` 변경 | 항상 | 연쇄 없음 (단독 업데이트) |

---

## 레이어 2. 유효 상태 전환 테이블

> 허용된 전환만 구현한다. 이 테이블에 없는 전환은 오너 승인 후 추가한다.

| 컬렉션 | 현재 상태 | 전환 가능 상태 | 트리거 | 구현 상태 |
|--------|-----------|---------------|--------|-----------|
| todoRequests | pending | accepted | 수신자 수락 | ✅ |
| todoRequests | pending | rejected | 수신자 반려 | ✅ |
| todoRequests | pending | cancelled | 요청자 취소 | ✅ |
| todoRequests | accepted | completed | 담당자 완료처리 | ✅ |
| todoRequests | accepted | cancelled | 담당자 요청 할일 삭제 | ✅ |
| todoRequests | completed | accepted | 담당자 완료 취소 | ✅ |
| posts | active | completed | 체크박스 클릭 | ✅ |
| posts | completed | active | 체크 해제 | ✅ |
| posts | active | deleted | soft delete | ✅ |
| posts | deleted | active | 복구 | ✅ |
| posts | any | visibleTo 변경 | 수정 팝업 저장 | ✅ |
| posts | any | starred 변경 | 별 클릭 | ✅ |
| leaveEvents | registered | confirmed | 관리자 확정 | ✅ |
| leaveEvents | registered | locked | isPastOrToday = true | ✅ |
| leaveRequests | — | pending | 신청 | 🔲 미구현 |
| leaveRequests | pending | approved | 관리자 승인 | 🔲 미구현 |
| leaveRequests | pending | rejected | 관리자 반려 | 🔲 미구현 |
| comments | — | created | 댓글 작성 | 🔲 미구현 |
| comments | created | deleted | 댓글 삭제 | 🔲 미구현 |

---

## 레이어 3. 전환별 상세

> 레이어 2에서 전환을 확인한 후, 여기서 구체적인 구현 방법을 참조한다.
> 각 전환은 실행 순서 + 에러 처리 + 담당 파일 세 가지를 반드시 포함한다.

---

### FLOW 1. 업무요청(todoRequest) 상태 머신

```
대기중 →[수락]→ 수락됨 →[완료처리]→ 완료됨
                  ↑            │
                  └──[완료취소]─┘

대기중 →[반려]→ 반려됨
대기중 →[취소]→ 취소됨
수락됨 →[요청 할일 삭제]→ 취소됨  (post soft delete + request cancelled)
```

**pending → accepted**
```
1. todoRequests.status = 'accepted'
2. posts 생성
3. calendarEvent 생성 (dueDate 있을 때, teamRequestId 중복 확인)
에러: try/catch + addToast
담당: todoRequestStore.ts > acceptRequest() / Calendar.tsx
```

**accepted → completed**
```
1. posts.completed = true / completedAt = new Date()
2. todoRequests.status = 'completed' / resolvedAt = serverTimestamp()
에러: try/catch + addToast
담당: TodoItem.tsx > handleComplete() / todoRequestStore.ts > completeRequest()
```

**completed → accepted (완료 취소)**
```
1. posts.completed = false / completedAt = null
2. todoRequests.status = 'accepted' / resolvedAt = null
에러: try/catch + addToast
담당: CompletedTodo.tsx > 복구 버튼 / todoRequestStore.ts > reactivateRequest()
```

**pending → rejected**
```
1. todoRequests.status = 'rejected'
2. todoRequests.rejectReason = <사유 문자열>
에러: try/catch + addToast
담당: TodoRequestModal.tsx > handleReject()
```

**pending → cancelled**
```
1. todoRequests.status = 'cancelled'
에러: try/catch + addToast
담당: TodoRequestModal.tsx > cancelRequest()
```

**accepted → cancelled (요청 할일 삭제)**
```
1. deletePost(post.id) — soft delete, 낙관적 업데이트
2. cancelRequest(post.requestId)
에러: 각각 독립 try/catch + addToast
      1번 실패 시 2번 실행 중단
      1번 성공 후 2번 실패 시 롤백 불가 (이미 soft delete됨) → addToast만
담당: TodoItem.tsx > handleDeleteRequest()
      postStore.ts > deletePost() / todoRequestStore.ts > cancelRequest()
```

---

### FLOW 2. 할일 완료 상태

```
[활성] ──(체크)──→ [완료됨]
   └────────────────(체크해제)──┘
```

**일반 할일 (requestId 없음)**
```
체크:     posts.completed = true / completedAt = new Date()
체크해제: posts.completed = false / completedAt = null
연쇄: 없음
```

**요청 연결 할일 (requestId 있음)**
```
체크:     posts.completed = true + todoRequests.status = 'completed' ← 필수
체크해제: posts.completed = false + todoRequests.status = 'accepted' ← 필수
requestId가 있을 때 todoRequests.status 없이 posts.completed만 업데이트 금지
```

---

### FLOW 3. 캘린더 이벤트 색상 결정

```
요청 수락 시: color = '#993556' (고정)
할일 캘린더 등록 시: getEventColor({ taskType, visibleTo })
```

**색상 매핑**
```
업무 + 전체    → #3B6D11 (녹색, 단색)
업무 + 나만    → #185FA5 (파랑, 단색)
업무 + 특정    → #854F0B (앰버, 단색)
개인 + 전체    → rgba(99,153,34,0.15)   + #639922 왼쪽 테두리
개인 + 나만    → rgba(55,138,221,0.15)  + #378ADD 왼쪽 테두리
개인 + 특정    → rgba(186,117,23,0.15)  + #BA7517 왼쪽 테두리
연차           → rgba(83,74,183,0.15)   + #534AB7 왼쪽 테두리
요청           → #993556 + 3px solid #72243E
```

---

### FLOW 4. 연차 상태

```
등록됨(confirmed: false) →[확정]→ confirmed: true
등록됨 → isPastOrToday = true → 잠금 (수정/삭제 불가, 관리자 제외)
```

---

### FLOW 5. visibleTo 표시 로직

```
[]                  → 레이블: '전체'   / 왼쪽 띠: #639922
[author]            → 레이블: '나만'   / 왼쪽 띠: #378ADD
[author, ...others] → 레이블: '특정인' / 왼쪽 띠: #BA7517
```

적용 대상: PostItem.tsx / TodoItem.tsx / CreatePost.tsx (일관성 필수)

---

### FLOW 6. 가시성 변경 (visibleTo 수정)

```
트리거: 수정 팝업에서 범위 변경 후 저장
연쇄: 없음 (단독 업데이트)
주의: 저장 시 author 포함 여부 반드시 확인 (rules.md S7 참조)
담당: PostItem.tsx / TodoItem.tsx > handleEditSave()
```

---

### FLOW 7. 별표(starred) 상태

```
트리거: 별 아이콘 클릭
연쇄: 없음 (단독 업데이트)
정렬: starred = true → 목록 최상단 (rules.md S1 정렬 기준 참조)
담당: PostItem.tsx / TodoItem.tsx > handleStar()
```

---

### FLOW 8. Soft delete & 복구

```
삭제: posts.deleted = true / deletedAt = serverTimestamp()
      낙관적 업데이트 필수 (ghost 재렌더 방지)
복구: posts.deleted = false / deletedAt = null / completed = false
담당: postStore.ts > deletePost() / restorePost()
```

---

### FLOW 9. 연차 신청 & 승인 (🔲 미구현)

```
[신청] → [대기중] →[승인]→ [승인됨] → leaveEvent 생성
                  →[반려]→ [반려됨]
```

---

### FLOW 10. 댓글 (🔲 미구현)

```
컬렉션: todoRequests/{id}/comments
생성 / 삭제 흐름 — 설계 시 여기에 추가
```

---

### FLOW 11. 완료 알림 토스트 (🔲 미구현)

```
트리거: 수신자가 요청 할일 완료처리 시
대상: 요청자에게 토스트 + 배지 증가
구현: onSnapshot에서 accepted → completed 변경 감지, fromEmail === 나
```

---

### FLOW 12. 실시간 동기화 (onSnapshot)

```
원칙: createdAt = null인 pending 문서는 반드시 필터링 (rules.md S3 참조)
원칙: 낙관적 업데이트 후 Firestore 반영 순서 유지
담당: postStore.ts / todoRequestStore.ts > initListener()
```

---

*Updated: 2026.04.07 (전체 한글화 / 3레이어 구조 재편 / FLOW 6~12 추가)*
