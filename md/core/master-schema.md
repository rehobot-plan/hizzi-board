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

### `chatMessages` (2026-04-23 신규 · 세션 #64)

```typescript
{
  id: string
  userId: string                  // 작성자 email (author)
  rawText: string                 // 원본 입력 보존 (헌법 제1조 · 수정 불가)
  createdAt: Date

  // 파이프라인 상태 (ai-capture-hb.md §5.1)
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

### `posts` · `calendarEvents` 4필드 추가 (세션 #64 · 신규 레코드만)

```typescript
{
  // ... 기존 필드
  sourceMessageId?: string | null   // chatMessages.id · manual 경로면 null
  parseStage?: 'local' | 'user_confirmed'  // 'llm'은 2단 본체 부착 시 추가
  confidence?: number               // 0~1
  inputSource?: 'chat' | 'manual'   // chat=ChatInput · manual=FAB·기존 경로
}
```

기존 레코드 소급 할당 없음 (ai-capture-hb.md §5.4). 4필드 부재 = `inputSource: 'manual'` 상당.

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
