# 히찌보드 — Firestore 데이터 스키마

> master.md에서 분리. 스키마 변경 시 이 파일 갱신.

---

### `posts`
```typescript
{
  id: string
  panelId: string
  content: string
  title?: string
  dueDate?: string           // YYYY-MM-DD 형식
  attachment?: PostAttachment  // 하위호환 (읽기 전용)
  attachments?: PostAttachment[] // 신규 다중 첨부
  author: string
  category: string
  visibleTo: string[]
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
  deleted?: boolean
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

interface PostAttachment {
  type: 'image' | 'file' | 'link'
  url: string
  name?: string
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
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'cancel_requested'
  rejectReason?: string
  cancelRequestedAt?: Date | null
  cancelRequestedBy?: string
  seenAt?: { [userEmail: string]: Date }
  teamLabel?: string
  teamRequestId?: string
  createdAt: Date
  resolvedAt?: Date | null
}
```

### `calendarEvents` (세션 #71 재정의 · master-debt #18 1단계)
```typescript
{
  id: string
  title: string
  startDate: string                  // 'YYYY-MM-DD'
  endDate: string                    // 'YYYY-MM-DD'
  createdAt: Date
  updatedAt?: Date

  // identity 3축 병기 — 세션 #71 · #18 1단계.
  // 분열 실상(master-debt #18): Calendar.tsx 편집 권한·team scope 필터는 uid 대조,
  // useTodaySummary·filterCalendarInputs 담당자 매칭은 email 대조. 양자 병기로 각 reader 용도 분리.
  authorId: string                   // Firebase UID — 편집 권한·team scope 필터 대조
  authorEmail: string                // 작성자 email — 필터·카운트·visibility reader 대조
  authorName: string                 // 표시 이름

  // 시각·분류
  color: string
  taskType?: 'work' | 'personal'

  // 공개범위 (세션 #71 삼분 확정 · reader 보강은 다음 사이클)
  visibility?: 'all' | 'me' | 'specific'
  visibleTo?: string[]               // specific일 때 노출 대상 email 리스트. 현재 reader 부재(filterCalendarInputs 미체크) — 보강은 #18 다음 사이클

  // 반복 (내부 필드 전부 선택 · writer별로 일부만 세팅 가능)
  repeat?: { type?: string; weeklyDay?: string; excludeHolidays?: boolean; endType?: string; endDate?: string; endCount?: number }
  repeatGroupId?: string

  // 요청 cascade 파생 (todoRequests로부터 생성된 이벤트)
  requestId?: string
  requestFrom?: string
  requestTitle?: string
  teamRequestId?: string

  // panel 소유 (chat 경로 · 피어 탭 달력, 블록 ⑤-1 이후)
  panelId?: string

  // ai-capture 캡처 4필드 흡수 (세션 #64 · 신규 레코드만 · ai-capture-hb.md 5.2)
  sourceMessageId?: string | null    // chatMessages.id · manual 경로면 null
  parseStage?: 'local' | 'user_confirmed'
  confidence?: number                // 0~1
  inputSource?: 'chat' | 'manual'
}
```

### `chatMessages` (2026-04-23 신규 · 세션 #64)

```typescript
{
  id: string
  userId: string                  // 작성자 email (author)
  rawText: string                 // 원본 입력 보존 (헌법 제1조 · 수정 불가)
  createdAt: Date

  // 파이프라인 상태 (ai-capture-hb.md 5.1)
  processingState: 'local_parsed' | 'awaiting_user' | 'finalized'
  parsedAt_local: Date | null
  finalizedAt: Date | null

  // 파생 추적 — cascade 실행 취소용
  derivedIds: Array<{
    type: 'post' | 'calendarEvent'
    id: string
    status: 'active' | 'cancelled'
  }>

  // 가시성 (posts와 독립 soft delete)
  deleted: boolean
  deletedAt: Date | null
}
```

### `posts` 4필드 추가 (세션 #64 · 신규 레코드만 · ai-capture-hb.md 5.2)

```typescript
{
  // ... 기존 필드
  sourceMessageId?: string | null   // chatMessages.id · manual 경로면 null
  parseStage?: 'local' | 'user_confirmed'  // 'llm'은 2단 본체 부착 시 추가
  confidence?: number               // 0~1
  inputSource?: 'chat' | 'manual'   // chat=ChatInput · manual=FAB·기존 경로
}
```

기존 레코드 소급 할당 없음 (ai-capture-hb.md 5.4). 4필드 부재 = `inputSource: 'manual'` 상당.

`calendarEvents`의 동일 4필드는 세션 #71 재정의에서 본체 스키마로 흡수됨(위 `calendarEvents` 블록 참조).

### `comments`
```typescript
{
  id: string
  requestId: string        // todoRequests.id 참조
  author: string           // 작성자 이메일
  authorName: string       // 표시 이름
  content: string          // 댓글 내용
  createdAt: Date
  type: 'user' | 'system'
  event?: 'accepted' | 'rejected' | 'completed' | 'reactivated' | 'cancel_requested' | 'cancel_approved' | 'cancel_denied'
  eventMeta?: { reason?: string }
}
```
