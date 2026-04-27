# 히찌보드 — 상태 흐름 맵 (레이어 3 전환별 상세)

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
담당: CompletedRecentSection.tsx > 복원 버튼 / RecordModal restore / todoRequestStore.ts > reactivateRequest()
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

**cancelled → 직전 상태 (스와이프 삭제 1층 복구 — 토스트 5초)**
```
1. posts.deleted = false / deletedAt = null
2. todoRequests.status = 직전 상태 (pending 또는 accepted — 삭제 전 snapshot 참조)
3. 낙관적 업데이트 + 단일 트랜잭션 (batch write)
에러: try/catch + addToast (복구 실패 시 "복구에 실패했습니다" 토스트)
담당: toastStore.ts > undoToast 핸들러 / postStore.ts > restorePost()
      todoRequestStore.ts > reactivateRequest(previousStatus)
주의: 토스트 콜백은 컴포넌트 언마운트 후에도 실행될 수 있음 → store 레벨 구현
```

**cancelled → 직전 상태 (2층 복구 — 리스트 하단 "최근 삭제 N개 →" 링크)**
```
1. RecordModal [휴지통] 탭 내 개별 복원 버튼 클릭
2. 동일 cascade (1층과 동일)
3. 24시간 창 내 항목만 이 경로로 진입 (deletedAt 기준 쿼리)
담당: RecordModal.tsx > handleRestore() / postStore.ts > restorePost()
```

**cancelled → 직전 상태 (3층 복구 — 탭바 메뉴 "기록" → 휴지통 탭)**
```
1. 24시간 경과 항목 대상
2. 동일 cascade
3. 30일 경과 후 hard delete 예정 문서만 접근 가능
담당: RecordModal.tsx > handleRestore() (2층과 동일 핸들러, 진입점만 다름)
```

**completed → 직전 상태 (체크 완료 1층 복구 — 토스트 5초)**
```
1. posts.completed = false / completedAt = null
2. requestId 있으면 todoRequests.status = 'accepted' (cascade, FLOW 2 참조)
3. 낙관적 업데이트
에러: try/catch + addToast
담당: toastStore.ts > undoToast 핸들러 / postStore.ts > uncompletePost()
```

**completed → 활성 (2층·3층 복구 — 지난 완료 탭)**
```
1. 활성 완료 항목(24h 지남)을 활성 상태로 복귀시키는 경로
2. posts.completed = false / completedAt = null
3. requestId 있으면 cascade (FLOW 2)
4. 영구 보관 완료 문서 대상
담당: RecordModal.tsx > handleReactivate() / postStore.ts > uncompletePost()
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
삭제 진입점:
  좌←우 스와이프 (P9 패턴, 드래그 80px 이상)
  기존 hover 휴지통 아이콘 제거

삭제: posts.deleted = true / deletedAt = serverTimestamp()
      낙관적 업데이트 필수 (ghost 재렌더 방지)

복구 3층:
  1층 (토스트 5초): posts.deleted = false / deletedAt = null / completed = false
  2층 (리스트 하단 "최근 삭제 N개 →"): deletedAt < 24h 쿼리 → RecordModal 휴지통 탭
  3층 (탭바 메뉴 "기록"): 24h < deletedAt < 30일 쿼리 → RecordModal 휴지통 탭

hard delete:
  deletedAt > 30일 경과 시 hard delete 예정 (구현 시점: 2 구현 중 판단)
  Cloud Function 스케줄러 또는 클라이언트 배치

담당: postStore.ts > deletePost() / restorePost() / hardDeleteExpired()
      toastStore.ts > undoToast (1층 핸들러)
      RecordModal.tsx (2·3층 진입점)
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

### FLOW 11. 완료 알림 (봉투 배지 + 미확인 강조)

```
트리거: 수신자가 요청 할일 완료 처리 시 (pending|accepted → completed 어느 경로든)
      — 체크박스 즉시 완료 포함
      — 팝업 내 완료 버튼 포함

요청자 측 (fromEmail === 나 조건):
  봉투 배지 카운트 증가 (pending 건수 + 미확인 완료 알림 건수 합산)
  TodoRequestModal 섹션 4 "완료·반려·취소" 내 해당 항목 시각 강조

미확인 해제:
  모달 오픈 시 해당 항목의 todoRequests.seenAt = serverTimestamp() 업데이트
  seenAt 이후 재진입 시 강조 제거

구현: onSnapshot에서 * → completed 변경 감지, fromEmail === 나 조건
담당: todoRequestStore.ts > initListener() / TodoRequestBadge.tsx > unseenCount()
      TodoRequestModal.tsx > 모달 오픈 시 seenAt 업데이트
```

---

### FLOW 12. 실시간 동기화 (onSnapshot)

```
원칙: createdAt = null인 pending 문서는 반드시 필터링 (rules.md S3 참조)
원칙: 낙관적 업데이트 후 Firestore 반영 순서 유지
담당: postStore.ts / todoRequestStore.ts > initListener()
```
