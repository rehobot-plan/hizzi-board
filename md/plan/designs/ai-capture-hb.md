# 히찌보드 — 채팅 기반 AI 캡처 설계

> 홈 상단 자연어 입력(md/plan/designs/main-ux.md §6)의 파싱 엔진·스키마·상태 단일 출처.
> 르호봇 product.md §7 D3 3단 AI 캡처 구조를 히찌보드 도메인으로 이식.
> 수정 시 오너 승인 필수. md/plan/designs/main-ux.md §6 변경 시 본 문서 재검토.

---

## 1. 목적·범위

### 1.1 목적

md/plan/designs/main-ux.md §6 홈 채팅 입력에서 자연어 한 줄을 받아 posts/calendarEvents로 분류·저장하는 과정의 원칙·스키마·상태·파싱 규칙을 정의한다. `parseIntent.ts` 구현의 단일 출처.

### 1.2 범위

**다루는 것**

- D3 3단 캡처 구조의 히찌보드 이식
- 1단 로컬 파싱 규칙 (4축: 날짜·타입·수신자·공개범위)
- 3단 사용자 질의 (확장 영역 UI 연결)
- 신규 컬렉션 `chatMessages` + 기존 `posts` 필드 4개 추가
- 파이프라인 상태 전이 (시나리오 2·3·4)
- 2단 LLM stub 인터페이스 계약

**다루지 않는 것**

- UI 시각 토큰 — md/ui/uxui.md §4 홈 채팅 입력 토큰
- 상호작용 패턴 — md/ui/patterns.md P9
- B 승격 사이드 패널 본체 — main-ux.md §6.7 "첫 구현 제외" 항목
- LLM 엔진 본체 구현 — 2단 부착은 별도 트랙
- 학습·자율 개인화 — 르호봇 D5 영역, 히찌보드 v1 밖

### 1.3 의사결정 원칙

다음 3개 원칙 아래 모든 설계 결정이 위치한다. 충돌 시 위가 우선.

**1층 — 정확도 타협 불가** (르호봇 product.md 헌법 제1조 이식)
LLM 불확실성을 3단 사용자 질의로 덮되, 정확도를 포기하지 않는다. 확실하지 않으면 묻는다.

**2층 — 인라인 대화 원칙** (md/plan/ux-principles.md U14)
자연어 입력 AI 응답은 같은 스레드 바로 아래 확장. 모달 회피.

**3층 — 파싱 프리뷰 원칙** (md/ui/patterns.md P9)
AI가 추론한 결과는 태그로 먼저 시각화. 텍스트 응답만으로 "뭐가 맞고 뭐가 틀렸나"를 스캔 비용 크게 만들지 않는다.

---

## 2. D3 3단 구조의 히찌보드 이식

### 2.1 3단 구조 개괄

르호봇 product.md §7 D3 그대로 이식 + 히찌보드 제약 반영.

```
사용자 입력 (ChatInput)
  ↓
ChatMessage 생성 (rawText 원본 보존)
  ↓
[1단] 로컬 파싱 (즉시, <100ms) — 첫 구현 활성
  - 날짜 정규식 + 규칙 기반 키워드 + 패널 사용자명 매칭
  - 결과 상태: processingState = "local_parsed"
  ↓
[2단] LLM 정제 (백그라운드, 1~3s) — 첫 구현 stub
  - 인터페이스만 존재. 호출부는 1단 결과 즉시 반환
  - 향후 Haiku급 저가 모델 기본, 애매할 때 상위 승급
  - 붙일 때 상태: processingState = "llm_parsed"
  ↓
[3단] 사용자 질의 (unset 조각 존재 시) — 첫 구현 활성
  - 확장 영역 칩 UI로 노출
  - 사용자 응답 → processingState = "finalized"
```

### 2.2 시나리오 ↔ processingState 매핑

| 시나리오 | 경로 | 최종 상태 |
|---|---|---|
| 1 빈 입력 | ChatMessage 미생성 | — |
| 2 명확 즉시 저장 | local_parsed → (2·3 skip) → finalized | posts 생성 · 토스트 5초 |
| 3 AI 확인 | local_parsed → awaiting_user → (응답) → finalized | posts 생성 · 토스트 5초 |
| 4 복수 항목 B 승격 | local_parsed(derivedIds[]≥2) → awaiting_user + 승격 버튼 | 본 범위에선 "준비 중" 토스트 |

### 2.3 첫 구현 활성 단계

1단 활성 · 2단 stub · 3단 활성. LLM 본체 부착은 후속 트랙. 2단 인터페이스가 지금 자리 잡혀 있어야 나중에 붙일 때 구조 변경 없음.

---

## 3. 1단 로컬 파싱 규칙

### 3.1 파싱 목표

`ChatMessage.rawText`에서 4축을 추출해 posts/calendarEvents 필드로 매핑.

| 축 | posts 필드 | 대응 시나리오 |
|---|---|---|
| 타입 | `taskType` + 컬렉션 분기 (posts vs calendarEvents) | 전 시나리오 |
| 기한 | `dueDate` | 할일·일정 |
| 수신자 | `requestFrom` | 요청 |
| 공개범위 | `visibility` + `visibleTo` | 전 시나리오 |

### 3.2 입력 규칙 4축

**날짜 파싱**

- "오늘" → 오늘 날짜
- "내일" → +1일
- "모레" → +2일
- "다음주 X요일" → 다음주 해당 요일 (월~일)
  > 구현 주의 (세션 #65 파싱 버그 교훈): `nextWeekdayThisWeek` 헬퍼가 이미 "다음 발생" 처리를 포함한다면 "다음주 X요일"을 위해 추가 `+7`을 더하지 않는다. 중복 시 다다음주로 밀려나는 버그 발생.
- "D-N" / "D+N" → 상대 날짜 표기 (예: "D-3")
- "MM.DD" / "MM/DD" / "M월 D일" → 절대 날짜 (올해 기준, 지난 날짜면 내년)
- "월/화/수/목/금/토/일" 단독 → 이번 주 해당 요일 (이미 지난 요일이면 다음 주)
- "오전/오후 N시" / "N시" → 시각 (일정 판정 신호, dueDate는 날짜만)
- 매칭 없음 → `dueDate = null`

**타입 판정**

매칭 순서: 요청 → 일정 → 할일 → 메모.

- "요청/부탁/맡기/시키/해주세요" + 수신자명 감지 → `type = request` (posts.requestFrom 채움)
- "N시/오후/오전/미팅/약속" 시각 키워드 감지 → `type = schedule` (calendarEvents로)
- "할일/처리/확인/정리/해야" → `type = todo` (posts)
- 위 전부 비매칭 → `type = memo` (posts)

`taskType`은 별도 축:

- "개인적으로/사적으로" → `taskType = personal`
- 나머지 → `taskType = work` (기본값)

**수신자 매칭**

6인 패널 사용자 이름·별칭·직함 조합 매칭 (md/core/master.md §6 패널 설정 + 조직 직함):

| 매칭 토큰 | 이메일 | 직함 |
|---|---|---|
| 홍아현 · 아현 · 홍대표 · 대표 | we4458@naver.com | 대표 |
| 김진우 · 진우 · 김이사 · 이사 | oilpig85@gmail.com | 이사 |
| 조향래 · 향래 · 조팀장 | kkjspfox@naver.com | 팀장 |
| 우희훈 · 희훈 · 우팀장 | heehun96@naver.com | 팀장 |
| 한다슬 · 다슬 · 한팀장 | ektmf335@gmail.com | 팀장 |
| 유미정 · 미정 · 유사원 · 사원 | alwjd7175@gmail.com | 사원 |

접미사 "~님/~씨/~한테/~에게/~에게는/~보고" 허용 (예: "홍대표님", "김이사한테"). 성씨+직함 결합 공백 허용 (예: "조 팀장").

**직함 단독 모호성 처리**

- "대표" · "이사" · "사원" 단독 — 각 1명만 해당해 직함만으로 단독 매칭 성립
- "팀장" 단독 — 3명(조향래·우희훈·한다슬) 공유. 성씨 없이 "팀장"만 들어오면 unset (수신자 칩 질의 트리거 후보 — 첫 구현은 공개범위 질의만 활성이라 이 경우 `requestFrom=null` 처리 또는 사용자 재입력)
- 매칭 없음 → `requestFrom = null`

**공개범위 매칭**

- "다 같이 / 모두에게 / 전체 공개 / 팀 전체 / 공지" → `visibility = public`, `visibleTo = []`
- "나만 / 비공개 / 혼자" → `visibility = private`, `visibleTo = [author]`
- "X님한테만 / 특정인 / X씨만" → `visibility = specific`, `visibleTo = [author, ...matched]`
- 매칭 없음 → **unset** (3단 질의 진입)

### 3.3 confidence 계산

각 축의 매칭 확실도를 평균. 5단계 스냅샷:

- 1.0 — 전 축 직접 매칭
- 0.8 — 1축 추정 (예: 기본값 적용)
- 0.6 — 1축 unset
- 0.4 — 2축 unset
- ≤ 0.3 — 타입 자체 unset (드묾)

임계치 `0.7` 이상 = 명확 = 시나리오 2. 미만 = 시나리오 3.

### 3.4 "명확 vs 애매 vs 복수" 판정

- **명확 (시나리오 2)** — 전 축 매칭 + confidence ≥ 0.7
- **애매 (시나리오 3)** — unset 축 1개 이상 또는 confidence < 0.7 + 단일 항목
- **복수 (시나리오 4)** — 접속사 감지 (" 그리고 ", " 또 ", "하고 ", " 뒤에 ") + 각 구간 독립 서술 구조 + 2개 이상

복수 판정은 접속사 기준이 과감하면 오탐이 늘고 보수적이면 누락이 늘어 튜닝 영역. 첫 구현은 **보수적 판정** (연결어가 강하게 감지된 경우만 복수로) — 오탐 감지되면 시나리오 2/3로 자연스럽게 fallback.

---

## 4. 3단 사용자 질의

### 4.1 질의 노출 트리거

1단이 unset 축 반환 시 해당 축만 확장 영역에 칩 버튼으로 노출. 다른 축은 파싱 프리뷰 태그로만 표시(질의 대상 아님).

### 4.2 질의 축별 처리

| unset 축 | 칩 옵션 |
|---|---|
| 공개범위 | 전체 · 나만 · 특정 (3개) |
| 수신자 (type=request일 때만) | 6인 패널 사용자 (6개) |
| 기한 (type=todo일 때 선택) | 오늘 · 내일 · 이번 주 · 지정 안 함 (4개) |
| 타입 (드묾) | 할일 · 메모 · 일정 (3개) |

**첫 구현 우선순위**: 공개범위 질의 우선 구현 (시나리오 3 예시가 "범위만 골라달라"). 수신자·기한·타입 질의는 확장 포인트로만 두고 UI 코드는 동일 패턴으로 확장 가능하게.

### 4.3 확장 영역 ↔ 질의 매핑

확장 영역은 즉시 해소형이라 Question 엔티티를 DB에 저장하지 않는다. 클라이언트 `chatInputStore` 상태로만 관리. 사용자 응답 도착 시점에 posts 생성 + ChatMessage finalized.

---

## 5. 스키마 이식

### 5.1 신규 컬렉션 `chatMessages` (축소본)

```typescript
{
  id: string
  userId: string                  // 작성자 (author)
  rawText: string                 // 원본 입력 보존 (헌법 제1조)
  createdAt: Timestamp

  // 파이프라인 상태
  processingState: "local_parsed" | "awaiting_user" | "finalized"
  parsedAt_local: Timestamp | null
  finalizedAt: Timestamp | null

  // 파생 추적
  derivedIds: Array<{
    type: "post" | "calendarEvent"
    id: string
    status: "active" | "cancelled"
  }>

  // 가시성 (posts와 독립 삭제 — 대화 기록만 지우기 가능)
  deleted: boolean
  deletedAt: Timestamp | null
}
```

**르호봇 3.2 대비 제외 필드 및 사유**

| 필드 | 제외 사유 |
|---|---|
| `sourceChannel` | 히찌보드는 "app" 단일 채널 |
| `parsedAt_llm` · `llmRetryCount` · `lastLlmAttemptAt` | 2단 본체 붙일 때 추가 |
| `detectedContextId` · `detectedContextConfidence` | D5 학습 영역, 본 범위 밖 |
| `loopClosedAt` | 큐브 봇 연동용, 히찌보드 없음 |
| `visibility: "archived"` · `scheduledPhysicalDeletionAt` | 히찌보드 기존 policy는 단순 soft delete |

### 5.2 posts 필드 추가

기존 posts 스키마 + 4개:

```typescript
{
  // ... 기존 필드 (content, taskType, visibility, visibleTo, requestFrom, dueDate, ...)

  sourceMessageId: string | null    // chatMessages.id. manual 경로면 null
  parseStage: "local" | "user_confirmed"
                                    // 첫 구현은 "llm" 제외
  confidence: number                // 0~1
  inputSource: "chat" | "manual"    // chat=ChatInput / manual=FAB·기존 경로
}
```

calendarEvents 컬렉션도 동일 4필드 추가 (일정 파생 대응).

### 5.3 첫 구현 제외 컬렉션·필드

- **Question 컬렉션** — 확장 영역 즉시 해소형, DB 저장 불필요
- **LearnedPattern · ObservationEvent · UtteranceLog** — 학습 트랙, v1 밖
- **UserPreference 학습 필드** — 없음
- **userEdited 필드** — 첫 구현은 2단 stub이라 편집 충돌 없음. 2단 본체 붙일 때 추가
- **origin 필드** — 히찌보드엔 `requestFrom` + todoRequests가 이미 동일 역할. 중복 설계 회피

### 5.4 마이그레이션 방침

기존 posts 레코드는 **소급 sourceMessageId 할당 안 함**. 신규 4필드는 신규 레코드에만 채움. 기존 레코드 조회 시 4필드 부재는 `inputSource = "manual"` 상당으로 해석.

Firestore Rules는 필드 추가만이라 기존 rules 그대로 통과 (md/plan/designs/main-ux.md §8.3 패턴).

---

## 6. 파이프라인 상태 전이

### 6.1 시나리오 2 — 명확 즉시 저장

```
입력 확정
  → ChatMessage 생성 (processingState = "local_parsed", parsedAt_local = now)
  → parseLocal() 실행
  → confidence ≥ 0.7 + 전 축 매칭 확인
  → posts 생성 (sourceMessageId = chatMessage.id,
                 parseStage = "user_confirmed",
                 inputSource = "chat",
                 confidence = <계산값>)
  → ChatMessage.derivedIds에 추가 + processingState = "finalized", finalizedAt = now
  → 하단 토스트 5초 "{이름} 패널 · {탭명} 탭에 추가됨" + 실행 취소

실행 취소 탭 시:
  → posts 생성분 soft delete (cascade)
  → ChatMessage.derivedIds[].status = "cancelled"
  → ChatMessage 자체는 유지 (원본 보존)
```

### 6.2 시나리오 3 — AI 확인

```
입력 확정
  → ChatMessage 생성 (processingState = "local_parsed")
  → parseLocal() 실행
  → unset 축 감지 (예: visibility unset)
  → ChatMessage.processingState = "awaiting_user"
  → 확장 영역 펼침, 파싱 프리뷰 + unset 태그 + 공개범위 칩
  → 사용자 칩 탭 + "추가" 클릭
  → posts 생성 (parseStage = "user_confirmed", visibility = 선택값)
  → ChatMessage.processingState = "finalized"
  → 토스트

취소·Esc 시:
  → posts 생성 없음
  → ChatMessage.processingState = "finalized" (user_cancelled 표기는 v1 밖)
  → ChatMessage 자체는 유지
```

### 6.3 시나리오 4 — 복수 항목 B 승격 (placeholder)

```
입력 확정
  → ChatMessage 생성
  → parseLocal() 실행
  → 복수 항목 감지 (derivedIds 후보 ≥ 2)
  → ChatMessage.processingState = "awaiting_user"
  → 확장 영역 펼침, 항목 카드 N개 + 푸터 "자세한 대화로" 버튼 노출
  → 사용자가 "자세한 대화로" 클릭:
     → 본 범위에선 placeholder 토스트 "준비 중 — 인라인에서 각 항목 확정해주세요"
     → 확장 영역 유지
  → 사용자가 "2개 모두 추가" 클릭 (모든 항목 전 축 매칭인 경우만 활성):
     → 각 항목별로 posts 생성
  → 확장 영역 접힘

취소 시 시나리오 3 취소 경로와 동일
```

### 6.4 편집 충돌 처리

첫 구현은 2단 stub이라 "1단 결과 → LLM이 덮어씀" 충돌 없음. `userEdited` 필드 도입 시점은 2단 본체 붙일 때.

---

## 7. 2단 LLM stub 인터페이스

### 7.1 parseIntent.ts 계약

```typescript
// src/lib/parseIntent.ts (신규)

export interface ParseIntentInput {
  rawText: string
  userEmail: string       // 작성자 — 공개범위 "나만" 판정용
}

export interface ParsedItem {
  type: "todo" | "memo" | "schedule"
  content: string
  taskType: "work" | "personal" | null
  dueDate: string | null                // YYYY-MM-DD
  requestFrom: string | null            // 이메일
  visibility: "public" | "private" | "specific" | null
  visibleTo: string[] | null
}

export type UnsetField =
  | "visibility"
  | "requestFrom"
  | "dueDate"
  | "type"

export interface ParseIntentResult {
  items: ParsedItem[]                    // 복수 항목 지원
  confidence: number                     // 0~1
  unset: UnsetField[]
  multipleItemsDetected: boolean         // 시나리오 4 판정
}

export async function parseIntent(
  input: ParseIntentInput
): Promise<ParseIntentResult> {
  const localResult = parseLocal(input)
  // 2단 stub — 향후 LLM 호출 지점
  // const llmResult = await parseLLM(input, localResult)
  // return merge(localResult, llmResult)
  return localResult
}
```

### 7.2 stub 동작

2단 호출 없음. 1단 결과만 즉시 반환. 지연 0ms 체감.

### 7.3 향후 LLM 본체 붙일 때 변경 지점

- `parseLLM()` 본체 구현 (Anthropic Haiku 또는 유사)
- `ChatMessage.processingState`에 `"llm_parsed"` 단계 추가
- posts에 `userEdited` 필드 추가 (1단 결과를 사용자가 확장 영역에서 수정한 경우 true)
- 실패·오프라인 시 `processingState = "pending_llm"` 대기 + 복구 재시도 경로 추가
- `parseStage`에 `"llm"` enum 추가

---

## 8. 연동 MD 갱신

본 문서 승인 후 갱신 대상.

- **md/plan/designs/main-ux.md §6.9 영향 파일** — `src/lib/parseLocal.ts` 신규, `chatMessages` 컬렉션 추가 명시, posts 4필드 추가 명시
- **md/plan/designs/main-ux.md §8.2 Firestore 스키마 영향** — chatMessages 컬렉션 생성 + posts 4필드
- **md/core/master.md §4 파일 구조** — `src/lib/parseLocal.ts` · `src/lib/parseIntent.ts` 추가
- **md/core/master.md §5 파일 의존성 맵** — `ChatInput.tsx → chatInputStore.ts → parseIntent.ts → parseLocal.ts` 체인 추가
- **md/core/master.md §7 Firestore Rules 요약** — chatMessages 줄 추가 (`읽기/쓰기 → request.auth != null`)
- **md/core/master-schema.md** — chatMessages 풀 스키마 기록 (본 문서 §5.1 재기술)
- **md/ui/uxui.md §4 unset 태그 토큰** — 이미 존재 (재명시 불필요)
- **md/ui/patterns.md P9** — 파싱 프리뷰 원칙 이미 존재 (재명시 불필요)

---

## 9. 첫 구현 범위·제외 명세

### 9.1 포함

- `ChatInput.tsx` — 입력 pill (시나리오 1 placeholder)
- `ChatExpand.tsx` — 확장 영역 (AI 응답·파싱 프리뷰·칩·푸터)
- `AiBadge.tsx` — AI 뱃지 조각
- `chatInputStore.ts` — zustand, 확장 영역·ChatMessage 상태 관리
- `parseIntent.ts` + `parseLocal.ts` — 규칙 기반 1단 + stub 2단
- `chatMessages` Firestore 컬렉션 생성 + 기본 저장·조회
- `posts` · `calendarEvents` 컬렉션에 4필드 추가 (신규 레코드만)
- 시나리오 1·2·3 완전 구현
- 시나리오 4 항목 카드 UI 분리 + "자세한 대화로" 승격 버튼 (클릭 시 placeholder 토스트)
- 공개범위 unset 질의 (시나리오 3 주 케이스)
- 전역 토스트 컴포넌트 재사용, 실행 취소 링크 cascade 복구

### 9.2 제외

- 2단 LLM 엔진 본체
- Question 엔티티 (Firestore 컬렉션)
- LearnedPattern · ObservationEvent · UtteranceLog
- B 승격 사이드 패널 본체
- 대화 승계 로직
- 수신자·기한·타입 unset 질의 (확장 포인트로만, 첫 구현은 공개범위만)
- 기존 posts 레코드 소급 마이그레이션
- `userEdited` 필드

### 9.3 향후 확장 경로

| 단계 | 추가 내용 |
|---|---|
| B-1 | LLM 2단 본체 부착 (Anthropic Haiku 호출) |
| B-2 | Question 엔티티 도입 (snooze 지원) |
| B-3 | 학습 트랙 (ObservationEvent → LearnedPattern) |
| B-4 | B 승격 사이드 패널 본체 + 대화 승계 |

---

*Created: 2026.04.23 (세션 #64 설계) — 르호봇 product.md §7 D3 · data-model.md 이식. 첫 구현은 1단 활성 · 2단 stub · 3단 활성.*
