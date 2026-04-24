# 달력 필터 — 설계 문서

> Phase 4-A 진입 전 설계 합의 (세션 #50).
> 홈 달력과 MY DESK 달력 탭이 공유하는 필터 컴포넌트 설계.
> 수정: 오너 승인 필수.

---

## 0. 개요

현재 히찌보드 달력은 모든 이벤트(calendarEvents + leaveEvents + todoRequests)를
무조건 전부 표시한다. 6명 팀이 사용하는 환경에서 화면 밀도가 높아 "특정 멤버 일정만",
"업무만" 같은 시야 축소 수요가 누적된 상태. 4-A에서 필터 UI를 신규 도입하고, 4-B에서
MY DESK 달력 탭을 활성화하며 기본값을 분기한다.

"CalendarFilter 공통 추출"이라는 기존 표현은 이미 있던 필터를 공통화한다는 인상을 주나,
실제 작업은 **필터 기능 신규 도입**이다.

---

## 1. 진입점

| 경로 | 현재 상태 | 4-A/4-B 이후 |
|---|---|---|
| `/` (홈) | `<Calendar />` 직접 렌더, 필터 없음 | `<CalendarContainer defaultScope="team" />` 렌더, 필터 포함 |
| `/mydesk/calendar` | placeholder "달력 탭 준비 중입니다." | `<CalendarContainer defaultScope="me" />` 렌더 |
| `/calendar-poc` | 개발용 POC 페이지 (현행 유지) | 영향 없음. 필요 시 scope 미지정 기본 동작 |

두 페이지 모두 동일한 `<CalendarContainer />`를 소비하되 `defaultScope` prop으로
기본값 힌트만 달리 전달한다.

---

## 2. 필터 축

### 2.1 A. 담당자 (Members)

대상: 6명 + admin (총 7).
데이터 소스: `userStore.users` 전체.
선택 방식: 다중 체크박스. 기본값은 3에서 scope별로 분기.

매칭 규칙:
- `calendarEvents`: 이벤트의 `authorId`가 선택된 멤버 중 하나의 `uid`와 일치
- `leaveEvents`: 이벤트의 `userEmail`이 선택된 멤버 중 하나의 `email`과 일치
- `todoRequests`: 요청의 `toEmail`(수신자) 또는 `fromEmail`(요청자) 중 하나라도
  선택된 멤버의 이메일과 일치 (양방향 포함)

### 2.2 B. 카테고리 (Categories)

3분기: 업무 / 요청 / 개인. 기존 히찌보드 UI 언어(할일 탭 5.2, 좌측 띠 색상,
태그 색상)와 정렬.

매칭 규칙:
- **업무** — `calendarEvents` 중 `requestId` 없음 + (`taskType === 'work'` 또는
  taskType 필드 부재 시 색상이 업무 계열 #3B6D11 / #185FA5 / #854F0B)
- **요청** — `calendarEvents` 중 `requestId` 필드가 있는 이벤트. 요청 카테고리는
  업무·개인과 배타(requestId가 있으면 업무·개인 분류에서 제외).
- **개인** — `calendarEvents` 중 `requestId` 없음 + (`taskType === 'personal'` 또는
  taskType 필드 부재 시 색상이 개인 계열 #639922 / #378ADD / #BA7517) + 모든
  `leaveEvents`(연차는 개인 일정의 하위 개념으로 흡수)

### 2.3 제외 축

- C. 공개범위(전체/나만/특정) — 작성자 관점 메타이지 뷰어 관점 필터 아님. 제외.
- D. 이벤트 소스(calendarEvents/leaveEvents/todoRequests) 독립 필터 — B 카테고리가
  사실상 이 구분을 흡수. 별도 축 불필요.

---

## 3. 기본값 (scope별)

| scope | 담당자 기본 | 카테고리 기본 | 사용 상황 |
|---|---|---|---|
| `team` (홈) | 전원 체크 (6명 + admin) | 전체 체크 (업무/요청/개인) | 팀 전체 현황 공유 |
| `me` (MY DESK) | 로그인 사용자 본인만 체크 | 전체 체크 (업무/요청/개인) | 내 일정 관리 |

카테고리 기본은 두 scope 모두 "전체". 기본에서 좁혀 보여주면 사용자가 "내 업무 일정이
왜 안 보이지?" 혼란을 겪을 수 있음. 기본은 최대 시야, 좁히는 건 사용자 선택.

scope 값은 `CalendarContainer`의 prop. localStorage에 이전 값이 있으면 그것이 우선,
없을 때만 기본값 적용.

---

## 4. 지속성

localStorage에 필터 상태 저장. scope별 키 분리로 홈과 MY DESK가 독립 상태를 가짐.

**키 네이밍:**
- `hizzi.calendar.filter.team`
- `hizzi.calendar.filter.me`

**값 구조:**

    {
      "members": ["email1@...", "email2@..."],
      "categories": ["work", "request", "personal"]
    }

- `members`는 email 배열. uid 대신 email인 이유: leaveEvents는 email 기반 매칭이 자연스럽고,
  users 컬렉션 ID 체계 3종 공존(progress.md 미해결)을 우회.
- `categories`는 3원소 상수 배열 (`"work"`, `"request"`, `"personal"` 중 하나 이상).

**복원 규칙:**
- 마운트 시 localStorage 읽기 → 유효한 JSON이면 적용
- 파싱 실패 / 키 없음 → scope별 기본값 적용
- 저장된 `members`의 email이 현재 users에 없는 경우(퇴사 등) → 무시하되 다른 값은 유지
- 저장된 `categories`에 알 수 없는 값이 섞인 경우 → 해당 값만 무시

**쓰기 시점:** 사용자가 필터 조작 후 드롭다운 닫힐 때 1회 저장. 드롭다운 여는 중에는
React state로만 추적(저장 중 렉 방지).

---

## 5. UI 배치

### 5.1 토글 버튼

- 위치: 달력 헤더 우측 (기존 "+ 일정 추가" 버튼 옆)
- 라벨: "필터 ▾" (기본). 필터가 기본값에서 벗어난 상태에서는 "필터 • N" 형태로
  N = 적용된 제약 개수 (담당자 일부 해제 1 + 카테고리 일부 해제 1 = 최대 2)
- 색상: uxui.md 섹션 5 기본 버튼 스타일 준수

### 5.2 드롭다운 패널

토글 버튼 아래로 펼쳐짐. 폭 260px 내외.

**구성 (위→아래):**

    ┌─ 필터 ─────────────────────────┐
    │ 담당자          [전원] [전체 해제] │
    │ ☑ 유미정   ☑ 조향래              │
    │ ☑ 김진우   ☑ 우희훈              │
    │ ☑ 한다슬   ☑ 홍아현              │
    │ ☑ admin                         │
    │ ─────────────────────────       │
    │ 카테고리                        │
    │ ☑ 업무   ☑ 요청   ☑ 개인        │
    │ ─────────────────────────       │
    │              [기본값으로 초기화] │
    └─────────────────────────────────┘

**보조 액션:**
- "전원" — 담당자 7명 전체 체크
- "전체 해제" — 담당자 0명 체크 (의도적 전체 해제 허용, 7 참조)
- "기본값으로 초기화" — scope 기본값으로 복원 (담당자 + 카테고리 모두)

### 5.3 닫힘 동작

- 패널 외부 클릭 → 닫힘
- ESC → 닫힘 (기존 `useEscClose` 활용)
- 드롭다운 내부 체크박스 조작 → 닫히지 않음 (연속 조정 가능)

### 5.4 Z-index

Panel P5 계층 준수: 드롭다운 = 100. 달력 내부 모달(1000)보다 낮지만 패널 내부(10)보다
높음. 필터 드롭다운이 열린 상태에서 이벤트 클릭 → 먼저 드롭다운 닫히고 이후 모달 열림
(일반적 UX 기대값).

---

## 6. 컴포넌트 구조

    CalendarContainer (기존 — src/components/calendar/Calendar.tsx)
    ├─ CalendarFilter (신규 — src/components/calendar/CalendarFilter.tsx)
    │   ├─ 토글 버튼
    │   └─ 드롭다운 패널 (담당자 체크 + 카테고리 체크 + 보조 액션)
    ├─ CalendarGrid (기존, filteredEvents prop으로 필터링된 배열 받음)
    └─ 모달들 (기존 유지)

**CalendarContainer 변경:**
- `defaultScope?: 'team' | 'me'` prop 신설. 기본값 'team'.
- 필터 상태(`members`, `categories`)를 State로 보유.
- localStorage 읽기·쓰기 훅(`useCalendarFilter(scope)`) 내부에서 처리.
- `buildCalendarEventInputs` 호출 결과에 필터링 적용 후 `CalendarGrid`에 전달.

**CalendarFilter props:**
- `members: string[]` (현재 선택된 email 배열)
- `onMembersChange: (members: string[]) => void`
- `categories: ('work' | 'request' | 'personal')[]`
- `onCategoriesChange: (categories) => void`
- `allMembers: User[]` (users store에서 전달)
- `scope: 'team' | 'me'` (기본값 초기화용)
- `onResetDefaults: () => void`

**신규 훅: `useCalendarFilter(scope)`**
- localStorage read/write 캡슐화
- scope별 키 분리 처리
- 기본값 계산 (scope + 현재 사용자 email 결합)
- 반환: `{ members, setMembers, categories, setCategories, resetDefaults }`

**신규 유틸: `filterCalendarInputs`**
- `src/lib/calendar-helpers.ts`에 추가 또는 별도 파일
- 입력: 전체 eventInputs + members + categories
- 출력: 필터링된 eventInputs
- 카테고리 판별 로직(2.2 매칭 규칙) 여기에 수렴

---

## 7. 엣지케이스

### 7.1 담당자 전체 해제 허용

할일 탭 5.2는 "모두 해제 시 전체 자동 복원"이지만 달력 필터는 **전체 해제 허용**.
이유:
- 달력에서 "아무 이벤트도 안 보이는 상태"는 의도적 사용 케이스가 있음 (빈 날짜 파악,
  드래그로 날짜 범위 선택 후 추가 모달 띄우기 등)
- 자동 복원을 넣으면 사용자가 "전체 해제" 버튼을 눌렀는데 순간적으로 전체 선택으로
  돌아가는 혼란 발생

화면에 "선택된 담당자가 없어 표시할 이벤트가 없습니다" 같은 안내 문구는 넣지 않음
(달력 그리드는 그냥 빈 상태로 두면 충분).

### 7.2 카테고리 전체 해제

담당자와 동일하게 허용. 자동 복원 없음.

### 7.3 저장된 email이 현재 users에 없는 경우

localStorage에 저장된 members 중 현재 users에 없는 email은 그 email만 조용히 무시.
에러 표시·토스트 없음. 나머지 유효한 email은 정상 적용.

### 7.4 scope prop 미전달

`CalendarContainer`가 scope 없이 렌더되는 경우(`/calendar-poc` 등) 기본값은 'team'.
localStorage 키도 `hizzi.calendar.filter.team` 사용.

### 7.5 calendarEvents.taskType 부재 처리

Calendar UI의 일반·반복 추가 경로는 Firestore payload에 taskType을 저장하지 않음 —
탐색 결과(세션 #50) 현 시점 DB의 모든 "일반 달력 이벤트"가 taskType 필드 부재.
taskType이 저장되는 경로는 요청 수락 연쇄(`todoRequestStore` → `taskType: 'work'`)
뿐이며, 이 경로 이벤트는 2.2 배타 규칙에 따라 "요청"으로 분류되므로 taskType 필드가
업무·개인 분기에 실제로 쓰이는 케이스는 거의 없음.

taskType 부재 시 fallback은 **색상 계열로 분기**: 업무 계열(#3B6D11 / #185FA5 /
#854F0B) → 업무, 개인 계열(#639922 / #378ADD / #BA7517) → 개인. 판정은
`src/lib/calendar-helpers.ts`의 기존 `isPersonal(color)` 헬퍼를 재사용
(`filterCalendarInputs` 유틸 내부 호출). 원안의 "업무로 간주" 단일 fallback은
개인 색상으로 저장한 이벤트를 오분류해 폐기.

---

## 8. 반응형

mydesk.md 9 "달력 대상 체크박스: 전체/나만 2개로 간소화"는 현 설계와 불일치.
이 설계는 **모든 뷰포트에서 담당자 7명 + 카테고리 3을 유지**하되 모바일은 드롭다운
레이아웃만 조정:

- ≥768px: 드롭다운 폭 260px, 달력 상단 우측 위치
- <768px: 드롭다운 폭 calc(100vw - 32px), 토글 버튼 위치는 유지하되 펼쳐졌을 때
  화면 가로를 거의 꽉 채움. 담당자 체크박스는 2열 그리드(7명 → 4행)

mydesk.md 9의 해당 문구는 이 설계 확정 후 별도 수정 블록에서 정리. "전체/나만 2개"
안은 기능 축소라 채택하지 않음.

---

## 9. 구현 단계

mydesk.md 11의 4-A와 4-B를 아래처럼 구체화.

### Phase 4-A — 필터 컴포넌트 신규 + 홈 적용

- CalendarFilter 컴포넌트 신설
- useCalendarFilter 훅 신설
- filterCalendarInputs 유틸 신설
- CalendarContainer에 defaultScope prop 추가, 기본값 'team'
- 홈(`/`) 에서 `<Calendar />` 그대로 유지(현재 그 자체가 scope team 기본)
- MY DESK 달력 탭은 이번 Phase에서 건드리지 않음 (placeholder 유지)
- uxui.md 기준 버튼·드롭다운 스타일 준수

**완료 기준:**
1. 홈 달력 우상단에 "필터 ▾" 버튼 노출, 클릭 시 드롭다운 펼침
2. 담당자 7명 · 카테고리 3 체크박스 모두 기본 체크 상태
3. 체크 해제 시 해당 이벤트가 달력에서 제거됨 (2 매칭 규칙 준수)
4. "전원 / 전체 해제 / 기본값으로 초기화" 3개 보조 액션 동작
5. 드롭다운 닫힐 때 localStorage에 `hizzi.calendar.filter.team` 저장
6. 새로고침 후 저장된 상태 복원
7. 모바일 <768px에서 드롭다운이 세로 2열 레이아웃으로 펼침
8. 기존 이벤트 추가·수정·삭제·모달 동작 회귀 없음

### Phase 4-B — MY DESK 달력 탭 활성화

- `/mydesk/calendar/page.tsx` placeholder 제거
- `<Calendar />` 렌더 (defaultScope="me")
- TabBar 활성화 확인 (R-4 결과물 이미 존재)

**완료 기준:**
1. MY DESK 달력 탭 진입 시 홈과 동일한 달력 UI 노출
2. localStorage `hizzi.calendar.filter.me` 키에 저장·복원
3. 최초 진입 시 담당자 = 로그인 사용자 본인만 체크 상태
4. 카테고리는 전체 체크 상태
5. 홈에서 필터를 조정해도 MY DESK 필터에 영향 없음 (역도 동일)

각 Phase는 독립 세션. R4.10 3축 PASS 보고 필수. R4.11 단일 블록 범위 원칙 준수.

---

## 10. 테스트 시나리오 (신규 E2E 씨앗)

4-A:
1. 필터 버튼 존재 확인
2. 드롭다운 펼침 → 담당자 7 + 카테고리 3 체크박스 모두 체크 상태
3. 특정 담당자 1명 해제 → 해당 이벤트 달력에서 제거
4. "업무" 카테고리 해제 → 업무 이벤트 제거, 요청·개인 유지
5. "전체 해제"(담당자) → 모든 담당자 이벤트 제거, 화면에 이벤트 0
6. "기본값으로 초기화" → 전원 + 전체 복원
7. 드롭다운 닫기 후 새로고침 → 마지막 상태 복원
8. 저장된 email이 현재 users에 없는 경우 → 해당만 무시, 다른 값 유지

4-B:
1. MY DESK 달력 탭 진입 시 본인만 체크된 상태
2. 홈 ↔ MY DESK 전환 시 필터 상태 독립 유지

---

## 11. 주의 지점 (mydesk.md 10 스타일)

1. **담당자 필터와 공개범위 visibleTo의 상호작용** — 필터에서 "유미정"만 체크해도
   유미정이 visibleTo에 포함된 "나만"·"특정" 이벤트는 현재 로그인 사용자가 아니면
   원래 보이지 않는다. 필터는 visibleTo 통과 후 적용되므로 중복 필터링 문제는 없음.
   다만 "다른 사람의 '나만' 이벤트가 왜 안 보이지?"라는 혼란 가능성은 별도 안내 없이
   현 동작 유지.
2. **localStorage 동기화 경계** — 한 사용자가 여러 탭을 열면 탭 간 필터 상태 실시간
   동기화되지 않음. `storage` 이벤트 리스너를 넣을지는 Phase 4-A에서 선택적. 기본
   동작은 "탭마다 독립, 닫힐 때 덮어씀".

---

*Created: 2026-04-21 (세션 #49 설계 합의). 4-A 진입 직전.*
