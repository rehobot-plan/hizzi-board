# 히찌보드 — 코딩 규칙 & 실행 전 체크리스트

> **코드 작성 전 반드시 읽는다.**
> 이 규칙들은 개별 상황 대응이 아니라, 반복되는 버그의 근본 원인을 막는 제약이다.
> 새 규칙 추가 시: "왜 이 실수가 반복되는가"를 반드시 함께 기록한다.
> "잘 모르겠다"는 답이 나오면 → 즉시 멈추고 실제 파일을 먼저 확인한다.

---

## 마스터 실행 전 체크리스트

> 코드 작성 전 확인한다. 30초면 끝난다. 몇 시간을 아낀다.

```
상태 전환
□ hizzi-flows.md에서 연쇄 요구사항을 확인했는가?
□ S2 필수 연쇄 처리 목록이 모두 처리됐는가?

에러 처리
□ 모든 catch에 addToast가 있는가?
□ 삭제 액션에 낙관적 업데이트가 적용됐는가?
□ 루프 비동기가 try/catch/finally로 감싸졌는가?

Firestore
□ undefined가 저장 전 제거됐는가?
□ 날짜 문자열이 로컬 시간 형식인가?
□ onSnapshot에서 createdAt null 문서를 필터링하는가?
□ 필드 삭제 시 deleteField() + updateDoc() 직접 호출하는가?

명령 블록
□ 안전 규칙 맨 앞?
□ 진행 여부 맨 끝?
□ 파일 수정 + commit + deploy 한 블록?
□ 배포 후 확인 항목 포함?
□ 30% 기준 전체/부분 교체 선택?
□ 부분 교체 시 대상 문자열 1회 등장 확인?

타입
□ any 타입이 없는가?

설계 정확성
□ 조건에 사용된 값이 실제 파일에 존재하는가?
□ 리뷰 에이전트 경고를 실제 파일에서 확인했는가?

공개범위
□ 특정인 저장 시 author가 visibleTo에 포함되는가?
□ 표시 로직이 [], [author], [author, ...others] 세 가지를 처리하는가?
□ 수정 팝업이 생성 폼과 동일한 옵션을 제공하는가?

모달
□ useEscClose가 적용됐는가?
□ hover 레이어에 negative margin이 없는가?
□ overflow 안의 드롭다운에 Portal을 사용하는가?
```

---

## S1. 상태 전환 & 연쇄 업데이트

### 반복 버그의 근본 원인
이 앱의 상태 변경은 절대 단독으로 끝나지 않는다.
하나의 상태 변경은 항상 2~3개 문서를 함께 업데이트해야 한다.
일부만 업데이트하면 UI와 데이터 불일치가 발생한다.

**R1.1 — 상태 변경 코드 작성 전 반드시 `hizzi-flows.md`를 먼저 확인한다**

**R1.2 — 필수 연쇄 처리 목록**
```
post.completed = true  → todoRequests.status = 'completed'  (requestId 있을 때)
post.completed = false → todoRequests.status = 'accepted'   (requestId 있을 때)
요청 수락              → post 생성 + calendarEvent 생성 (dueDate 있을 때)
요청 반려              → rejectReason 저장
요청 할일 삭제         → post.deleted = true + todoRequests.status = 'cancelled'
```

**R1.3 — 팀 요청: teamRequestId로 캘린더 중복 생성 방지**
```typescript
// ❌ 수신자마다 캘린더 이벤트가 생성됨
for (const toEmail of recipients) { await acceptRequest(...) }

// ✅ 첫 번째 수락자만 생성, teamRequestId로 중복 방지
if (!existingEvent with teamRequestId) { createCalendarEvent(...) }
```

---

## S2. 에러 처리

### 반복 버그의 근본 원인
`console.error`만 있으면 사용자에게 피드백이 없다.
사용자는 재시도해서 중복 쓰기가 발생하거나, 실패했는데 성공했다고 착각한다.

**R2.1 — 모든 catch 블록에 addToast를 포함한다**
```typescript
} catch (e) {
  console.error(e)
  addToast({ message: '저장에 실패했습니다. 다시 시도해주세요.', type: 'error' })
}
```

**R2.2 — 삭제 등 파괴적 액션은 낙관적 업데이트 패턴 사용**
```typescript
// 1. 먼저 로컬 상태 업데이트 (ghost 재렌더 방지)
set(state => ({ posts: state.posts.filter(p => p.id !== postId) }))
// 2. 그 다음 Firestore에 반영
await deleteDoc(doc(db, 'posts', postId))
```

**R2.3 — 루프 안의 비동기 작업은 try/catch/finally로 감싼다**
```typescript
try {
  for (const id of ids) { await deletePost(id) }
} catch (e) {
  console.error(e)
  addToast({ message: '삭제에 실패했습니다. 다시 시도해주세요.', type: 'error' })
} finally {
  setSelectedIds([])
  setSelectMode(false)
}
```

---

## S3. Firestore 저장 안전

### 반복 버그의 근본 원인
Firestore는 일부 SDK 버전에서 `undefined` 값이 포함된 문서를 조용히 거부하거나
부분 저장하는데, 이는 디버깅이 매우 어렵다.

**R3.1 — Firestore에 undefined를 절대 저장하지 않는다**
```typescript
function stripUndefined<T extends object>(obj: T): Partial<T> {
  const cleaned = { ...obj }
  Object.keys(cleaned).forEach(k => {
    if ((cleaned as Record<string, unknown>)[k] === undefined)
      delete (cleaned as Record<string, unknown>)[k]
  })
  return cleaned as Partial<T>
}
await setDoc(ref, stripUndefined(data))
```

**R3.2 — 날짜 문자열: toISOString() 사용 금지 (KST 환경에서 날짜 하루 밀림)**
```typescript
// ❌ date.toISOString().split('T')[0]
// ✅ `${year}-${month}-${day}T00:00:00`
```

**R3.3 — serverTimestamp() pending 문서 방어**
```typescript
// addDoc 직후 onSnapshot이 두 번 발화한다
// 1차: createdAt = null (pending) → store에 넣으면 UI 오염
// 2차: createdAt = 실제 서버 시간
if (!data.createdAt) return null  // pending 문서 제외
```

**R3.4 — 필드 삭제 시 deleteField() 사용**
```typescript
// ❌ undefined는 Firestore에서 필드를 삭제하지 않음
await updateDoc(ref, { attachment: undefined })

// ✅ 올바른 예
import { deleteField } from 'firebase/firestore'
await updateDoc(ref, { attachment: deleteField() })

// ⚠️ postStore의 updatePost()는 Partial<Post> 시그니처라 타입 충돌 발생
//    → updatePost()를 우회하고 updateDoc()을 직접 호출해야 한다
```

**R3.5 — 새 컬렉션 추가 시 배포 전에 Firestore rules 업데이트**

---

## S4. 명령 블록 작성 원칙

### 반복 버그의 근본 원인
파일 교체 방식 기준이 없으면 str_replace 방식을 임의 선택해서
블록이 여러 개로 쪼개지고 오너가 붙여넣기 어려워진다.

**R4.1 — 모든 명령 블록 맨 앞에 안전 규칙 명시**
```
규칙: 대상 코드를 찾지 못하면 즉시 중단하고 보고할 것. 임의 적용 금지.
```

**R4.2 — 모든 명령 블록 끝에 진행 여부 반드시 명시**
```
→ "바로 붙여도 됩니다" — 단일 파일 / 상태 변경 없음 / cascade 없음
→ "리뷰 후 진행하세요 — 이유: ..." — 다중 파일 / 상태 변경 / cascade 있음
```

**R4.3 — 파일 수정 + commit + vercel --prod 반드시 한 블록**
빌드 에러 발생 시만 중단 + 보고. 정상 빌드면 commit + deploy 자동 진행.

**R4.4 — 블록 끝에 "배포 후 확인 항목" 포함**

**R4.5 — 파일 수정 방식: 이 기준만 따른다 (다른 MD 언급 무시)**
```
변경이 파일 전체의 30% 이상이거나 다수 위치에 분산 → 전체 교체
변경이 파일 전체의 30% 미만이고 위치가 명확       → 부분 교체 (R4.6)

str_replace를 여러 블록으로 분할 제시 금지.
```

**R4.6 — 부분 교체 시 실수 방지**
```
1. 교체 대상 문자열이 파일 내 1회만 등장하는지 확인 (중복 시 전체 교체로 전환)
2. 교체 범위를 주석으로 명시
   예) # [TodoItem.tsx] showDetailModal 블록 교체 (line ~280)
3. 파일 경로 + 찾을 문자열(전후 2줄 포함) + 바꿀 문자열 → 단일 powershell 블록
```

---

## S5. TypeScript 타입 안전

### 반복 버그의 근본 원인
`any` 타입은 컴파일 타임에 에러를 잡는 능력을 비활성화해서
버그가 런타임까지 미뤄진다. 런타임 버그는 훨씬 찾기 어렵고 고비용이다.

**R5.1 — any 타입 사용 금지**
```typescript
// ❌ const updates: any = {}

// ✅ 명시적 인터페이스 정의
interface PostUpdates {
  content?: string
  taskType?: 'work' | 'personal'
  visibleTo?: string[]
  completed?: boolean
  completedAt?: Date | null
}
const updates: PostUpdates = {}
```

**R5.2 — Firestore 업데이트 객체는 `Partial<T>` 사용**

**R5.3 — any가 불가피한 경우 (외부 SDK 타입 부재 등)**
1. 코드 주석에 이유 설명
2. 오너 명시적 승인
3. `// TODO: any 제거 예정 — 이유: ...` 주석 추가

---

## S6. 설계 정확성

### 반복 버그의 근본 원인
실제 파일을 확인하지 않고 설계하면 존재하지 않는 상태/탭/값을 가정한
방어 코드가 생기고, 이후 코드를 읽는 사람이 혼란을 겪는다.

**R6.1 — 실제 파일에 없는 값을 조건에 추가하지 않는다**
```typescript
// ❌ '전체' 탭이 실제로 없는데 방어 조건 추가
activeCategory !== '할일' && activeCategory !== '전체'
// ✅ 실제 파일에서 확인 후 작성
activeCategory !== '할일'
```

**R6.2 — Claude Code 리뷰 에이전트 경고는 실제 파일을 직접 열어 확인한다**
리뷰 에이전트는 명령 블록 텍스트만 정적 분석한다.
실제로 존재하지 않는 값을 잘못 지적할 수 있다. 추측으로 넘어가지 않는다.

**R6.3 — 미래 확장을 위한 방어 코드는 오너 승인 후 추가한다**
"나중에 생길 수 있으니"라는 이유로 임의 추가 금지.

---

## S7. 공개범위 (visibleTo)

### 반복 버그의 근본 원인
`visibleTo` 하나의 배열에 세 가지 다른 상태가 인코딩되어 있다.
생성·표시·수정 전 과정에서 이 의미가 일관되게 유지되어야 한다.

```
[]                        → 전체 공개
[author]                  → 나만
[author, ...otherEmails]  → 특정인
```

**R7.1 — 특정인 저장 시 author를 반드시 포함한다**
```typescript
// ❌ 작성자 본인이 자신의 게시물을 볼 수 없게 됨
visibleTo = [...selectedUsers]
// ✅
visibleTo = [user.email!, ...selectedUsers.filter(e => e !== user.email)]
```

**R7.2 — 표시 로직은 세 가지 상태를 모두 처리해야 한다**
```typescript
// ❌ '특정인'이 '나만'으로 합쳐짐
const label = visibleTo.length === 0 ? '전체' : '나만'
// ✅
const label =
  visibleTo.length === 0 ? '전체' :
  visibleTo.length === 1 && visibleTo[0] === author ? '나만' : '특정인'
```

**R7.3 — 수정 팝업은 생성 폼과 동일한 옵션을 제공한다 (축소 금지)**

**R7.4 — 수정 팝업 초기값은 저장된 visibleTo를 역산해서 세팅한다**
```typescript
// ❌ const init = visibleTo.length === 0 ? 'all' : 'me'
// ✅
const init =
  !visibleTo || visibleTo.length === 0 ? 'all' :
  visibleTo.length === 1 && visibleTo[0] === author ? 'me' : 'specific'
```

---

## S8. UI & 모달 패턴

### 반복 버그의 근본 원인
일관성 없는 모달/오버레이 패턴은 z-index 충돌, ESC 미작동,
overflow 클리핑으로 인한 레이아웃 깨짐을 유발한다.

**R8.1 — 모든 모달에 useEscClose를 사용한다**
```typescript
useEscClose(() => setIsOpen(false), isOpen)

// 모달 여러 개일 때: 우선순위 순서로
useEscClose(() => {
  if (showDetail) { setShowDetail(null); return }
  if (showAdd) { setShowAdd(false); return }
}, showDetail || showAdd)
```

**R8.2 — hover 레이어에 negative margin 금지 → `inset: 0` 사용**
```typescript
// ❌ <div style={{ position:'absolute', inset:0, margin:'0 -20px' }} />
// ✅ <div style={{ position:'absolute', inset:0 }} />
```

**R8.3 — overflow:auto 안의 드롭다운은 createPortal + position:fixed 사용**

**R8.4 — z-index 계층 (이탈 금지)**
```
패널 내부: 10 / 드롭다운: 100 / 모달 오버레이: 1000
모달 본체: 1001 / 캘린더 모달: 50 / 캘린더 더보기: 70 / Toast·Portal: 9999
```

**R8.5 — transition은 0.15s ease만 사용. 0.15s 초과·linear·padding/margin transition 금지**

---

## 별첨. 공통 훅 목록

```
useEscClose(onClose, isOpen)            — 모든 모달 필수
useVisibilityTooltip(visibleTo, users)  — PostItem / TodoItem 특정인 tooltip
useFileUpload(panelId)                  — 예정: Storage 업로드
useIsMobile(breakpoint)                 — 예정: 모바일 감지
useCanEdit(ownerEmail)                  — 예정: 수정 권한 확인
useMultiSelect(items)                   — 예정: 체크박스 다중 선택
```

> 업로드·모바일 감지 로직을 인라인으로 작성하기 전에 예정된 훅이 존재하는지 먼저 확인한다.

---

*Updated: 2026.04.07 (전체 한글화 / 중요도 순 재배열 / 마스터 체크리스트 최상단 / 단일 책임 구조)*
