# MY DESK — 설계 문서

> 그룹 A 설계 세션 (#37) 결과 + 세션 #43 재편. 구현 시 이 문서를 라우팅 표에 포함.
> 수정: 오너 승인 필수.

---

## 0. 개요

MY DESK는 개인 데이터 관리 공간. 홈과 역할 분리.

- 홈 = 팀 전체 현황 공유 (6패널 + 공용 달력). "한눈에 서로를 본다"
- MY DESK = 내 데이터 편집·정리 + 내 요청 관리 허브. "내 것을 꼼꼼히 관리한다"

세션 #43 재편 요지: 요청 도메인을 MY DESK로 통합, 연차는 사이드바 기타 단일 진입.

---

## 1. 사이드바 구조

```
┌────────────┐
│ HIZZI      │
│ BOARD      │
│            │
│ 홈         │
│ MY DESK    [3] [2] [5]
│            │
│            │  ← flex-grow 영역
│            │
│ 기타 ▼     │  ← 하단 고정
│   연차     │
└────────────┘
```

- 상단: 브랜드 블록 + 홈 / MY DESK
- 하단: 기타 ▼ (펼침/접힘, localStorage 세션 간 기억, 기본 펼쳐짐). 연차는 기타 서브
- 중간 flex-grow 영역이 빈 공간 흡수 → 기타가 항상 하단 고정
- 전체 높이: `position: sticky; top: 0; height: 100vh`. 메뉴가 많아지면 사이드바 내부 스크롤
- 기존 "할일", "달력" 메뉴는 MY DESK로 흡수 (세션 #37)
- 기존 "요청" 메뉴는 MY DESK로 흡수 (세션 #43) — `/request` URL은 유지되지만 사이드바 항목 제거
- 연차는 사용 빈도 낮음 + 보조 기능이라 "기타" 서브에 유지

### 1.1 MY DESK 3뱃지 (세션 #43 신규)

MY DESK 우측에 숫자 뱃지 3개 나란히:

| 뱃지 | 색상 | 의미 |
|---|---|---|
| 받은 | #993556 | toEmail=나 + status=pending 건수 |
| 보낸 | #C17B6B | fromEmail=나 + status=pending 건수 |
| 진행 | #9E8880 | toEmail=나 + status=accepted 건수 |

- 각 뱃지 크기: 20px × 14px, 폰트 10px weight 500, 흰색 텍스트, border-radius 10px
- 뱃지 간 간격: 4px
- 0일 때는 해당 뱃지만 숨김 (전체 없으면 전 영역 숨김)
- 모바일 <768px: 합산 단일 뱃지로 전환 (공간 부족 대응)

---

## 2. MY DESK 탭 구조

5탭: 오늘 / 요청 / 할일 / 메모 / 달력 (시급도 순)

- 기본 진입 탭: 오늘
- URL: `/mydesk?tab=today` (또는 `/mydesk/today`)
- 탭 전환 시 URL 유지, 새로고침해도 탭 상태 보존
- TabBar 위치: Header 바로 아래 상단 고정 (`position: sticky; top: 56px`). header.md 섹션 4 참조

---

## 3. 오늘 탭

### 3.1 요약 카드 4개

| 카드 | 주 수치 | 보조 라벨 |
|---|---|---|
| 할일 | 오늘 기한 수 | "오늘 기한" |
| 일정 | 오늘 수 | "이번 주 N" |
| 요청 | 받은 대기 K | "보낸 대기 N · 진행 중 M" |
| overdue | 기한 지난 미완료 수 | "미완료" |

- 각 카드 좌측 3px 컬러 띠
  - 할일 #C17B6B / 일정 #3B6D11 / 요청 #993556 / overdue #A32D2D (uxui.md c-red 600)
- 카드 클릭 점프
  - 할일 → 할일 탭 / 일정 → 달력 탭 / 요청 → 요청 탭 / overdue → 할일 탭 (필터: 업무+요청+개인, 정렬 기한 지난순)
- 연차 카드 제거 (세션 #43). 연차 확인은 기타>연차 메뉴 단일 경로

### 3.2 요청 카드 내부 레이아웃

- 상단 11px 라벨: "요청 · 받은 대기" color text-secondary
- 메인 30px weight 500: K (받은 대기 건수)
- 하단 11px 보조: "보낸 대기 N · 진행 중 M" color text-secondary
- 다른 3카드(할일·일정·overdue)와 동일 타이포 구조 유지

### 3.3 "지금 봐야 할 것" 리스트

- 기준: 오늘 기한 할일 + 오늘 일정 + 미확인 요청 + D-3 이내 할일 + 기한 지난 미완료
- 정렬: 기한 임박순 (overdue는 최상단)
- 아이템: 좌측 3px 컬러 띠 + 제목 + 우측 뱃지
- 우측 뱃지 종류: "오늘"(빨강 배경) / "D-N"(업무 색) / "HH:MM"(녹색 배경, 일정만) / "overdue"(빨강 배경, overdue 전용)

---

## 4. 요청 탭 (세션 #43 신규)

### 4.1 내용

- 기존 `/request` 페이지 UI 본체를 `src/components/request/RequestView.tsx`로 추출
- `/mydesk?tab=request` 진입 시 `<RequestView />` 렌더
- `/request` 라우트도 `<RequestView />` 렌더 (북마크·딥링크 호환)
- 내부 탭: 받은 요청 / 보낸 요청 / (관리자) 전체보기
- RequestDetailPopup 기존 동작 유지

### 4.2 진입점 호환

| URL | 렌더 | 용도 |
|---|---|---|
| `/mydesk/request` | AppShell + TabBar(요청 활성) + RequestView | MY DESK 5탭 내부 |
| `/request` | AppShell + RequestView (TabBar 없음) | 북마크·알림 링크 |

- 두 진입점에서 RequestView는 동일 데이터·동일 액션
- Header 제목은 두 경로 모두 "MY DESK" (header.md 섹션 3 참조)

### 4.3 RequestDetailPopup 2단 전환 (선처리 큐)

선처리 큐 현 1번은 Phase R-1(RequestView 추출) 완료 후 별도 세션에서 진행.

---

## 5. 할일 탭 (세션 #37 유지)

### 5.1 세그먼트 컨트롤

상단 [진행 중 N] [완료 M] [휴지통 K] 3개 세그먼트. 카운트 상시 노출.

- 활성 세그먼트: 흰 배경 + 컬러 테두리 (진행 #C17B6B / 완료 #3B6D11 / 휴지통 #9E8880)
- 휴지통 세그먼트 활성 시 상단 우측에 [휴지통 비우기] 추가 버튼

### 5.2 필터 바

[업무] [요청] [개인] 3개 체크박스.

- 다중 선택 허용
- 기본값: 전체 활성
- 모두 해제 시 전체 자동 복원 (U2 엣지케이스)
- 세그먼트 간 유지, 탭 이동 시 리셋

### 5.3 정렬 드롭다운

세그먼트별 기본값:

| 세그먼트 | 기본 | 옵션 |
|---|---|---|
| 진행 중 | 기한 임박순 | + 최신 등록순, 오래된 등록순, 이름순, 카테고리순 |
| 완료 | 최근 완료순 | + 오래된 완료순, 이름순, 카테고리순 |
| 휴지통 | 최근 삭제순 | + 오래된 삭제순, 이름순, 카테고리순 |

- 별표 아이템은 진행 중 세그먼트에서만 정렬과 무관하게 최상단 고정
- 카테고리순 우선순위: 업무 → 요청 → 개인

### 5.4 아이템 구조 / 벌크 바 / 안전장치 / 새 할일 버튼

세션 #37 설계 유지 (섹션 내용 동일, 중복 서술 생략).

---

## 6. 메모 탭 (세션 #37 유지)

할일 탭 컴포넌트 재사용. 세션 #41 Phase 3에서 prop 분기(segmentMode / filterMode / itemMode)로 구현 완료. 세션 #43 변경 없음.

---

## 7. 달력 탭 (세션 #37 유지)

Phase 4-A에서 CalendarFilter 공통 추출 예정. 세션 #43 변경 없음.

---

## 8. 기타 > 연차 (세션 #37 유지 + 세션 #43 강화)

- 오늘 탭 연차 카드 제거(세션 #43)로 연차 접근 경로는 기타 메뉴 단일화
- 나머지 구성 (요약 카드 4개 / 예정·과거 세그먼트 / 상태 뱃지 / locked)은 세션 #37 설계 유지

---

## 9. 반응형

Tailwind md breakpoint (768px) 기준.

- 데스크톱 (≥768px): 기본 레이아웃
- 모바일 (<768px):
  - 사이드바 3뱃지 → 합산 단일 뱃지
  - 달력 필터 드롭다운: 담당자 체크박스 2열 그리드, 폭 calc(100vw - 32px)로 확장 (calendar-filter.md 8)
  - 오늘 탭 요약 카드 4개 → 2×2 그리드
  - 요청 탭 RequestView 내부 2탭(받은/보낸)은 그대로 가로 배치 유지
  - TabBar: 가로 스크롤 허용 (5탭 폭 부족 시)
  - 벌크 바는 하단 floating 유지

---

## 10. 상태 트리 — 핵심 주의 지점

세션 #37 경고 유지:

1. posts 복원 시 completed 강제 초기화 — rules.md S2 연쇄
2. 요청 수락 3단 연쇄 — todoRequests.status='accepted' → posts 생성 + (dueDate 있으면) calendarEvents 생성
3. flows.md cancel_requested 3건은 세션 #38에서 동기화 완료

세션 #43 신규 주의:
4. 요청확장 카드 메인 숫자와 사이드바 "받은" 뱃지 숫자 정합성 — 둘 다 toEmail=나 + status=pending 기준. 동일 쿼리 재사용 권고 (useTodaySummary 훅 내부 + useSidebarBadges 훅 공유).
5. /request ↔ /mydesk/request 진입점 2개가 동일 RequestView를 렌더 — store 구독·스크롤 위치 등 컴포넌트 내부 상태는 라우트 전환 시 초기화되므로 부작용 없음. URL 쿼리 파라미터(필터·탭)는 검증 필요.

---

## 11. 구현 단계 (세션 #43 재편)

세션 #43 이후 Phase는 Header 선행 후 시작.

| Phase | 범위 | 주요 파일 |
|---|---|---|
| H-1~H-3 | 공통 Header + 사이드바 고정 + TabBar 상단 고정 (header.md 참조) | src/components/common/* |
| R-1 | RequestView 공통 컴포넌트 추출 + /mydesk/request 진입점 | src/components/request/RequestView.tsx, src/app/request/page.tsx, src/app/mydesk/request/page.tsx |
| R-2 | 사이드바 요청 메뉴 제거 + MY DESK 3뱃지 | src/components/common/Sidebar.tsx, useSidebarBadges 훅 |
| R-3 | 오늘 탭 카드 재편 (연차 제거 + overdue 추가 + 요청확장) | src/hooks/useTodaySummary.ts, src/components/mydesk/SummaryCard.tsx |
| R-4 | MY DESK 5탭 반영 (요청 탭 추가) | src/components/mydesk/TabBar.tsx, src/app/mydesk/request/page.tsx |
| 4-A | 달력 필터 신규 도입 + 홈 적용 (calendar-filter.md 9) | src/components/calendar/CalendarFilter.tsx, src/hooks/useCalendarFilter.ts, src/lib/calendar-helpers.ts (확장), src/components/calendar/Calendar.tsx |
| 4-B | MY DESK 달력 탭 활성화 + scope="me" 기본값 (calendar-filter.md 9) | src/app/(main)/mydesk/calendar/page.tsx |

### Phase 가드

- H-1~H-3: header.md 섹션 8 참조
- R-1 완료 기준: /request 회귀 0, /mydesk/request 진입 시 동일 UI 렌더
- R-2 완료 기준: 사이드바 요청 메뉴 없음, MY DESK 3뱃지 정상, 기존 useTodoRequestStore.unseenCount 로직 호환
- R-3 완료 기준: 오늘 탭 4카드가 [할일/일정/요청확장/overdue]로 표시, 카드 클릭 점프 동작, 연차 카드 자리에 overdue
- R-4 완료 기준: TabBar에 요청 탭 추가, 5탭 전환 정상
- 4-A 완료 기준: calendar-filter.md 9 Phase 4-A "완료 기준" 8항 참조
- 4-B 완료 기준: calendar-filter.md 9 Phase 4-B "완료 기준" 5항 참조

각 Phase는 독립 세션. R4.10 3축 PASS 보고 필수. R4.11 단일 블록 범위 원칙 준수.

---

## 12. 폐기된 이전 결정

- (세션 #37) 사이드바 4메뉴 [홈/MY DESK/요청/기타] → (세션 #43) 3메뉴 [홈/MY DESK/기타]
- (세션 #37) 오늘 탭 연차 카드 → (세션 #43) overdue 카드로 교체 + 연차 제거
- (선처리 큐 구 1번) 연차 카드 → overdue 카드 단일 교체: 세션 #43 Phase R-3으로 통합 흡수, 선처리 큐에서 폐기

---

*Updated: 2026-04-18 (세션 #43 재편 확정). 세션 #37 베이스 유지.*
