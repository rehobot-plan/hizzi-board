# 달력 시각 체계 정비 — 설계 문서

> 후순위 후보 #4 구현 직전 설계 합의 (세션 #51).
> 메인(`/`)과 MY DESK(`/mydesk/calendar`) 달력이 공유하는 이벤트 렌더링 체계 정비.
> 3블록 순차 진행 — 세션 분리 가능.
> 수정: 오너 승인 필수.

---

## 0. 개요

Phase 4-B 완료로 달력 양쪽 진입점이 완비됐으나, 이벤트 렌더링 체계에서 2종 문제가
관측됨.

**문제 1 — 의미/표현 혼재.** 현재 `CalendarGrid.renderEventContent`는 이벤트의
카테고리를 `color` hex 값으로 역추적한다 (`isPersonal(color)` 등 exact hex 매칭).
저장된 color 값이 6종 외(과거 팔레트, 대문자, 미세 오차)면 전부 else→업무 solid로
떨어져 "보라 뭉침"과 색상 오분류를 유발. `tokens.ts`의 calendarEvent 토큰은 이미
semantic grouping(work/personal/leave/request)으로 정비돼 있으나 렌더 분기에서
활용되지 않음.

**문제 2 — 시각 체감 저하.** WCAG AA 수치는 통과하나 fontSize 10px · padding 1px ·
반투명 alpha 0.15 조합이 "작고 흐릿하다"는 체감을 만듦.

**문제 3 — 토큰 단일 출처 부재.** `CalendarGrid` 외에 3군데 보조 표면
(`CalendarModals.tsx` 색상 칩 / `useTodaySummary.ts` 좌측 띠·우측 뱃지 /
`CalendarGrid.tsx` 범례 블록)이 hex를 하드코딩하고 있어 값 한 곳 변경이 전체에
반영되지 못함.

이 문서는 세 문제를 3블록에 분해 해결한다.

---

## 1. 범위 — 3블록

| 블록 | 제목 | 규모 | 의존 |
|---|---|---|---|
| 1 | semantic 분기 교체 | 중 | 없음 |
| 2 | tokens.ts 단일 출처 통합 | 중 | 블록 1 완료 |
| 3 | 시각 튜닝 (font · padding · alpha) | 소 | 블록 2 완료 |

각 블록은 독립 세션. R4.10 3축 PASS 보고 필수. R4.11 단일 블록 범위 원칙 준수.
세션 분리 권장 — 블록 1이 렌더 분기를 건드리고 블록 2가 토큰 구조를 건드리기
때문에 섞으면 회귀 판정이 엉킴.

---

## 2. 블록 1 — semantic 분기 교체

### 2.1 변경의 본질

이벤트 카테고리 판정을 "color hex 매칭"에서 "의미 필드 참조"로 전환한다. color는
이후 presentation-only 역할로 축소.

### 2.2 카테고리 우선순위

동일 이벤트가 여러 속성을 동시 보유할 수 있음 (예: 요청 연쇄로 생성된 calendarEvent는
`taskType='work'` + `requestId` + color `#993556`). 아래 순서로 판정.

1. `source === 'leave'` (leaveEvents 출처) → **연차**
2. `requestId` 존재 → **요청**
3. `taskType === 'personal'` → **개인**
4. 그 외 → **업무** (기본값)

배타 판정 — 요청 이벤트는 taskType이 work이어도 "요청"으로만 분류. calendar-filter.md
2.2의 배타 규칙과 정합.

### 2.3 visibility 축 (업무·개인 내부 3분)

업무·개인 카테고리 내부의 전체/나만/특정 분기는 기존 `visibility` 필드 그대로 사용.
세션 #50 이전과 동일.

### 2.4 사용할 의미 필드

- `event.extendedProps.source` — FullCalendar 어댑터가 붙이는 출처 태그
  ('calendar' / 'leave' / 'request')
- `rawCalendar.requestId` — 요청 연쇄 여부 판정
- `rawCalendar.taskType` — 'work' | 'personal' | 부재
- `rawCalendar.visibility` — 'all' | 'meOnly' | 'specific'

### 2.5 제거 대상

- `isPersonal(color)` / `isLeave(color)` / `isRequest(color)` 헬퍼의 분기 용도 사용
  제거. 하위 호환을 위해 함수 자체는 유지하되 `renderEventContent`에서 참조하지
  않음. 이후 블록 2에서 토큰 기반 helper로 대체 가능.

### 2.6 완료 기준

1. 모든 이벤트 타입(업무 3 · 개인 3 · 연차 · 요청 = 8종)이 의미 필드 기반으로
   정확 분류
2. color 필드가 6종 외 값이어도(legacy · 대소문자 · 미세 오차) 분류 결과 변동 없음
3. 시각적 렌더 결과는 블록 1 단독으로는 현재와 동일 (토큰·값 변경 없음)
4. 단위 테스트 — 의미 필드 조합별 분류 결과 검증 (8 케이스 이상)
5. E2E 회귀 — 기존 4-A/4-B 시나리오 PASS 유지

---

## 3. 블록 2 — tokens.ts 단일 출처 통합

### 3.1 변경의 본질

`tokens.ts`의 calendarEvent 토큰을 모든 달력 관련 시각 표현의 단일 출처로 확장.
3군데 보조 표면의 하드코딩 hex를 토큰 참조로 교체.

### 3.2 토큰 확장 방향

기존 semantic 구조 유지 + 렌더 값 확장. 구체 토큰 키 구조는 공장의 1-1 탐색에서
결정.

포함 항목 (개념 수준):
- 카테고리별 색상 세트 (bg / border / text) — 현행 유지
- 렌더 공통값: fontSize · padding · lineHeight · borderLeftWidth · alpha
- 범례 표기용 라벨 문자열도 토큰화 검토 (i18n 여지)

### 3.3 3 보조 표면 — 토큰 참조 전환 대상

| 표면 | 파일 | 현 하드코딩 | 전환 후 |
|---|---|---|---|
| 이벤트 추가 모달 칩 | CalendarModals.tsx:174-213 | 6종 hex 직접 | 토큰 참조 |
| 오늘 탭 "지금 봐야 할 것" 좌측 띠·우측 뱃지 | useTodaySummary.ts | hex 4건 | 토큰 참조 |
| 달력 하단 범례 블록 | CalendarGrid.tsx:209-218 | 8종 hex 직접 | 토큰 참조 |

### 3.4 완료 기준

1. 위 3 표면 + CalendarGrid.renderEventContent 모두 tokens.ts calendarEvent 참조
2. 하드코딩 hex(#로 시작하는 리터럴)가 Calendar 관련 파일에서 0건 (legacy color
   판정 함수 내부 제외)
3. 블록 2 단독으로는 시각적 변경 없음 — 값은 현행 유지 (alpha 0.15 · fontSize 10 ·
   padding 1px 등)
4. 모달 칩 hover / 범례 블록 / 오늘 탭 띠 등 비주얼 회귀 없음 (스크린샷 대조)
5. 단위 테스트 — 토큰 조회 헬퍼 1~2 케이스

### 3.5 migration 주의

useTodaySummary의 hex 4건은 카테고리별 색상이라 각각 어느 토큰 경로에 매핑되는지
블록 2 실행 시 Code가 탐색 단계에서 정리 필요. 현재 4건 중 overdue 뱃지 색상
(`#A32D2D` = uxui.md c-red 600)은 calendarEvent 토큰과 분리된 경로라 토큰화 대상
여부 판단 필요 — calendarEvent는 이벤트 타입, overdue는 상태 뱃지라 별개 토큰.

---

## 4. 블록 3 — 시각 튜닝

### 4.1 변경의 본질

tokens.ts 값만 조정해 전 달력 표면에 동시 반영. 분기 로직·토큰 구조는 건드리지
않음.

### 4.2 튜닝 값

| 속성 | 현재 | 정비 후 | 적용 대상 |
|---|---|---|---|
| fontSize | 10 | 11 | 이벤트 블록 본문 |
| padding | 1px 4px | 2px 4px | 이벤트 블록 |
| borderLeft width | 2px | 3px | 개인·연차 (반투명 계열만) |
| alpha (반투명 계열) | 0.15 | 0.25 | 개인 3종 + 연차 |
| lineHeight | 기본 | 1.3 (명시) | 이벤트 블록 |

업무 solid 3종 · 요청 solid의 색상 hex와 textColor는 변경 없음. alpha 조정은
개인 3종 + 연차만 적용 (solid 계열은 해당 없음).

### 4.3 모달 칩 · 범례 블록 동기화

블록 2 이후 토큰 참조가 완결돼 있으므로, 블록 3에서 tokens.ts 값 변경만 해도
모달 칩과 범례가 자동 동기화. "모달에선 연한데 실제 블록은 진하네" 불일치 원천
차단.

### 4.4 완료 기준

1. 달력 이벤트 블록 · 모달 칩 · 오늘 탭 "지금 봐야 할 것" · 범례 블록에서 튜닝 값
   4종(fontSize · padding · borderLeft · alpha)이 동일하게 반영
2. 스크린샷 대조 — 메인 홈 달력 · MY DESK 달력 · 오늘 탭 각각 before/after 캡처
3. WCAG AA 재검증 — 튜닝된 alpha 0.25 합성 배경 vs 텍스트 대비 3~5건 샘플 계산
4. 기존 E2E 회귀 PASS (calendar-filter-4a 8 · calendar-filter-4b 3 · mydesk-today-r3
   8 = 19 시나리오)

---

## 5. Firestore legacy color 처리

### 5.1 방침

블록 1 이후 카테고리 판정이 의미 필드 기반으로 전환되면, legacy color 값
(6종 외 hex · 대소문자 · 미세 오차)은 판정에 영향 없음. 저장된 color 필드는
presentation 용도로 유지하거나, 블록 2에서 토큰 참조로 완전 전환하면 무시 가능.

### 5.2 마이그레이션 불필요

Firestore 쓰기 경로에서 color를 "semantic key"로 저장하던 암묵적 의존이 블록 1·2
완료 후 끊긴다. 기존 레코드는 건드리지 않음. 신규 저장 시 color 값을 토큰에서
조회해 저장하는 경로로 자연스럽게 정돈됨 (블록 2 구현 시 함께 정리).

### 5.3 실측 스크립트 생략

4-A 탐색에서 필드 분포는 파악됨. color는 블록 2 이후 순수 표현이라 legacy 분포
실측 가치 낮음. 생략.

---

## 6. 엣지케이스

### 6.1 세 필드 모두 부재인 레거시 이벤트

`source` 없음 + `requestId` 없음 + `taskType` 없음 = 업무 카테고리로 폴백.
기존 동작과 동일 (else→work). visibility 필드마저 없으면 'all' 폴백.

### 6.2 taskType='personal'인데 requestId도 있는 경우

2.2 우선순위에 따라 "요청"으로 분류. taskType이 개인이어도 요청 연쇄 이벤트는
요청 카테고리.

### 6.3 사용자 정의 색상

현재 없음 (모달 칩은 6종 고정). 정비 후에도 유지. 향후 커스텀 색상이 추가된다면
별도 설계 필요 (본 문서 범위 밖).

### 6.4 leave source 판정

leaveEvents는 별도 컬렉션 → FullCalendar 어댑터(`buildCalendarEventInputs`)에서
`extendedProps.source = 'leave'` 부여. 이 태깅이 블록 1 분기의 1순위 조건이
되므로 어댑터 측 구현 확인 필수 (블록 1 탐색 단계에서).

---

## 7. E2E 시나리오 씨앗

**블록 1** (semantic 분기):
1. 각 타입 이벤트 1건씩 시드 → 올바른 카테고리 분류 확인
2. color 필드에 6종 외 값을 가진 이벤트 시뮬레이션 → else→work 폴백 제거됐는지
3. requestId + taskType=personal 조합 이벤트 → 요청으로 분류되는지

**블록 2** (토큰 통합):
1. 모달 칩 6종 렌더 색상 = 토큰 값 일치
2. 범례 블록 8종 렌더 색상 = 토큰 값 일치
3. 오늘 탭 좌측 띠 색상 = 토큰 값 일치

**블록 3** (시각 튜닝):
1. 달력 이벤트 블록 computed style fontSize = 11px
2. 모달 칩 padding 2px 4px
3. 개인·연차 블록 배경 alpha 합성값 = 0.25 ± 오차 허용

---

## 8. 주의 지점

1. **블록 1 단독으로는 시각 변화 0** — 이게 중요. 블록 1 PASS 판정 시 "화면이
   그대로인가"가 기준. 변화가 보이면 색상 경로가 잘못 건드려진 것.
2. **블록 2 단독으로도 시각 변화 0** — 토큰 참조 교체일 뿐. 변화 보이면 토큰
   매핑이 잘못된 것.
3. **오직 블록 3에서만 시각 변화** — 이 시점에 스크린샷 before/after 비교 유효.
4. **"보라 뭉침"은 정비로 완전 해소되지 않음** — 연차 2건 + 요청 1건이 인접
   스택되면 색상 자체의 시각 귀결. 이 이슈는 본 문서 범위 밖 (데이터 분포 문제).
5. **useTodaySummary overdue 뱃지 색상은 calendarEvent 토큰과 분리** — 이벤트
   타입이 아닌 상태 뱃지라 별개 토큰 경로. 블록 2에서 혼입되지 않도록 주의.
6. **모달 칩 hover 상태** — 현 구현에 hover 시 색상 변화가 있다면 토큰화 시
   hover 토큰도 함께 정리.

---

## 9. 구현 순서 권고

1. 블록 1 세션 — 탐색 → 설계 보정(필요 시) → 구현 → 1-3 빌드 → 1-4 리뷰 →
   1-5 E2E → 1-6 배포+보고
2. 블록 2 세션 — 동일 공정. 단위 테스트 특히 토큰 조회 헬퍼 검증
3. 블록 3 세션 — 동일 공정. 스크린샷 검수가 1-4 디자인 축의 핵심 증거

각 세션 진입 시 `md/plan/designs/calendar-visual.md` 참조 필수 (CLAUDE.md 파일
지도 5의 "기능 구현 (설계 문서 있음)" 경로).

---

*Created: 2026-04-21 (세션 #51 설계 합의). 블록 1 진입 직전.*
