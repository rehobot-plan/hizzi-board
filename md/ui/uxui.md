# 히찌보드 — 디자인 토큰

> 모든 시각적 결정의 단일 기준.
> 색상·타이포·간격이 불확실할 때 여기를 먼저 확인한다.
> 수치 변경 시 오너 승인 필수. 임의 변경 금지.

---

## 1. 브랜드 방향성

```
참조: ZARA / COS
톤:   미니멀 · 에디토리얼 · 프리미엄 패션 인트라넷
원칙: 장식보다 여백 / 색상보다 타이포 / 과함보다 절제
      Transition: 0.15s ease (전체 통일 — 예외 없음)
```

---

## 2. 컬러 팔레트

| 토큰 | Hex | 용도 |
|------|-----|------|
| sidebar-bg | #5C1F1F | 사이드바 배경 |
| main-bg | #FDF8F4 | 페이지 배경 |
| card-bg | #FFFFFF | 카드/패널 배경 |
| accent | #C17B6B | 주요 강조색 (테라코타) |
| active-text | #7A2828 | hover/active 텍스트 |
| text-primary | #2C1810 | 본문 텍스트 |
| text-secondary | #9E8880 | 보조 텍스트 (모카 그레이) |
| text-hint | #C4B8B0 | 힌트 텍스트 |
| border | #EDE5DC | 전체 테두리 (웜 베이지) |
| todo-work-bg | #FFF5F2 | 업무 할일 배경 |
| todo-personal-bg | #F5F0EE | 개인 할일 배경 |
| request-bg | #FCEEE9 | 요청 아이템 배경 |
| overlay | rgba(44,20,16,0.4) | 모달 백드롭 |
| today-bg | #F5E6E0 | 캘린더 오늘 날짜 배경 |

---

## 3. 타이포그래피

| 역할 | 크기 | 굵기 | 자간 |
|------|------|------|------|
| 섹션 레이블 | 10–11px | 700 | 0.1em, uppercase |
| 본문 | 13px | 400 | — |
| 메타 정보 | 11px | 400 | — |
| 힌트 | 10px | 400 | 0.06em |

---

## 4. 색상 의미 시스템 ⭐

### 캘린더 이벤트
```
규칙: 색상 = 공개범위 / 스타일 = 업무 vs 개인

업무 (단색):
  전체   → #3B6D11  녹색
  나만   → #185FA5  파랑
  특정   → #854F0B  앰버

개인 (반투명 배경 + 왼쪽 테두리 — isStart || isSingle일 때만):
  전체   → rgba(99,153,34,0.15)   + #639922 테두리
  나만   → rgba(55,138,221,0.15)  + #378ADD 테두리
  특정   → rgba(186,117,23,0.15)  + #BA7517 테두리

연차   → rgba(83,74,183,0.15)   + #534AB7 테두리
요청   → #993556 배경 + 3px solid #72243E
```

### 할일/메모 태그 (2026.04.06 확정)
```
[A] 카테고리 태그 (업무/개인/요청) — 바탕색 + 테두리
  업무 → background #FFF5F2  color #C17B6B  border 1px solid #C17B6B
  개인 → background #F0ECF5  color #7B5EA7  border 1px solid #7B5EA7
  요청 → background #FBEAF0  color #993556  border 1px solid #993556

[B] 공개범위 태그 (전체/나만/특정) — 테두리만, 배경 없음
  전체 → color #3B6D11  border 1px solid #639922
  나만 → color #185FA5  border 1px solid #378ADD
  특정 → color #854F0B  border 1px solid #BA7517
  ※ "특정인" 아닌 "특정"으로 표기

[C] From/TEAM 태그 — 배경만, 테두리 없음
  From {이름} → background #FCEEE9  color #A0503A
  TEAM        → background #F5F0EE  color #9E8880
  TEAM hover  → tooltip (3열 grid, createPortal + position:fixed)

태그 순서:
  일반 할일: 업무/개인 → 공개범위 → dueDate시계 → 날짜
  요청 할일: 요청 → From {이름} → TEAM → dueDate시계 → 날짜
  메모:      업무/개인 → 공개범위 → 날짜

좌측 2px 띠: 요청 #993556 / 업무 #C17B6B / 개인 #7B5EA7

dueDate 시계 태그:
  D-3 이내: color #993556  background #FBEAF0  border 1px solid #993556
  D-4 이상: color #C17B6B  background #FFF5F2  border 1px solid #C17B6B
```

### 버튼 색상
```
수락: bg #EAF3DE  text #3B6D11  border 1px solid #C0DD97
반려: bg #FBEAF0  text #993556  border 1px solid #F4C0D1
주요: bg #2C1810  text #FDF8F4
위험: text #C17B6B  border 1px solid #C17B6B
취소: text #9E8880  배경/테두리 없음
```

### 보조 UI (2026.04.15 추가)
```
달력 보조:
  토요일 텍스트        → #6B8BC1
  구분 업무 배경(연함) → #EAF3DE
  요청 박스 배경(연함) → #FFF9F7

완료 상태:
  완료 뱃지 배경 → #F0F5F0
  완료 뱃지 전경 → #5C7A5C (테두리도 동일)

레이어 보조:
  2단계 구분선(외곽 #EDE5DC 대비 강) → #D5C9C0
  서브카드 배경(카드 위 카드)        → #FDFAF8
  alt row 배경(zebra stripe)          → #F5EFE9

요청 보조:
  요청 마감일 라이트 → #F4C0D1
```

---

## 5. 컴포넌트 상태

| 상태 | 스타일 |
|------|--------|
| 기본 | 정적 |
| Hover | background #FDF8F4, color #7A2828 |
| 선택됨 | border #2C1810, background #FDF8F4 |
| 비활성 | opacity 0.4, cursor not-allowed |
| 로딩 | "저장 중..." / "처리 중..." |
| 오류 | color #C17B6B, border #C17B6B |

---

*Updated: 2026.04.15 (9색 보조 UI 토큰 추가)*
