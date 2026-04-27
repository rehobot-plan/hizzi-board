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

### 스와이프 삭제 토큰 (2026.04.21 추가)
```
라벨 배경:      #FBEAF0   (요청 태그 배경과 동일 계열)
라벨 전경:      #993556   (요청 태그 테두리와 동일 계열)
드래그 임계:    80px
수평/수직 판별: 10px 수평 우위 시에만 스와이프로 해석
복귀 애니메이션: 0.15s ease
```

### FAB 토큰 (2026.04.21 추가)
```
기본 배경:  #2C1810
기본 전경:  #FDF8F4
hover 배경: #1A0E08
hover 변환: scale(1.04)
shadow:    0 2px 8px rgba(44,20,16,0.15)
크기:      44x44
위치:      패널 우하단 bottom 14 · right 14
z-index:   10 (패널 내부)
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

### handle 토큰 (2026.04.23 추가)
```
크기:          44 × 18 pill
border-radius: 9
아이콘:        chevron 14px · 펼침 시 rotate(180deg)
배경:          #FFFFFF (card-bg · border 가림)
테두리·전경:   #C4B8B0 → hover #9E8880
그림자:        0 1px 3px rgba(44,20,16,0.04)
위치:          패널 border-bottom 중앙 · bottom -9px (50% 걸침)
애니메이션:    0.15s ease — color · border · transform 통일
z-index:       3 (list 위, badge 아래)
터치 영역:     시각 18 · hit area 36+ (세로 여유 확장)
표시 조건:     scrollHeight > clientHeight · ResizeObserver 감시
접힘 복귀:     scrollTop 0 재설정
접근성:        aria-expanded · aria-label="펼쳐보기"
```

### 능동 scroll 토큰 (2026.04.23 추가)
```
scroll-margin-top: 80px
rAF 대기:          2프레임
lock:              400ms
데스크탑 기준:     window.innerWidth >= 768
이미 가시 생략:    0 <= 패널top <= 100 (100px 임계)
실행 방식:         scrollIntoView({ block: 'start', behavior })
reduced-motion:    prefers-reduced-motion: reduce 매칭 시 'instant' · 그 외 'smooth'
Rollback:          localStorage 'hizzi:activeScrollDisabled' = 'true' 설정 시 비활성
```

### 홈 채팅 입력 토큰 (2026.04.23 추가)

입력 pill:
```
높이:          52
border-radius: 26
형태:          한 줄 pill
placeholder:   "무엇을 추가할까요?"
서브라벨:      "· 말하듯 편하게 쓰시면 AI가 분류해드립니다"
```

확장 영역:
```
배경:       #FFFFFF (card-bg)
상단 꺾쇠:  10×10 · 회전 45deg · 입력창과 시각 연결
margin-top: 12px (입력 pill과 간격)
padding:    20 · 24
```

AI 뱃지:
```
위치:     확장 영역 좌측
padding:  2px 6px
폰트:     9px 700 · letter-spacing 0.12em
배경:     #5C1F1F (sidebar-bg)
전경:     #FDF8F4
라벨:     "AI"
```

파싱 프리뷰 카드:
```
배경:          #FDFAF8
border-left:   2px · 색상은 4 할일/메모 좌측 2px 띠 재사용
                 (요청 #993556 · 업무 #C17B6B · 개인 #7B5EA7)
padding:       12px 14px
border-radius: 3
태그:          4 할일/메모 태그 토큰 재사용 · 인라인 배치
```

unset 태그 (AI 파싱 미완):
```
배경:   #FFFFFF
border: 1px dashed #C4B8B0
전경:   #9E8880
용도:   "범위 미정" 등 AI가 확정 못한 조각
```

항목 카드 (시나리오 4 복수 항목):
```
배경:          #FDFAF8
border-left:   2px solid — 항목별 카테고리 색상
                 업무 #C17B6B · 요청 #993556 · 개인 #7B5EA7
padding:       14px 16px
border-radius: 3
```

항목 카드 번호 원:
```
크기:   22 × 22
배경:   #FFFFFF
border: 1px solid #C4B8B0
폰트:   11px 700
색상:   #6B5B52
```

푸터 버튼 — 3종:
```
취소 (ghost):
  padding:     7px 14px
  색상:        #9E8880
  배경·테두리: 없음

자세한 대화로 (secondary — B 승격 트리거):
  padding: 7px 14px
  색상:    #5C1F1F
  배경:    #FFFFFF
  border:  1px solid #EDE5DC → hover #5C1F1F

확정 (primary): 4 "버튼 색상 — 주요" 재사용 (bg #2C1810 · text #FDF8F4)
```

토스트: 전역 토스트 컴포넌트 재사용 — "{이름} 패널 · {탭명} 탭에 추가됨" 문구 + 실행 취소 링크 (5초)

### 회색 영역 — 메인 패널 최근 완료 회수 (P1-α · main-ux.md 2.5)

활성 할일 리스트 하단 collapsible 회색 영역. 기본 접힘, 최근 5개 한도. "방금 완료한 N개 ▾" 토글.

```
배경        F7F2EC (활성 리스트와 분리되는 옅은 베이지)
글자색      9E8880 (완료 항목 시각 잔류, 활성 대비 약함)
호버색      6E6E6E (토글 버튼 hover)
액션 버튼   6E6E6E → 5C1F1F (hover)
구분선      EDE5DC (활성 리스트와의 borderTop)
시각 잔류   text-decoration: line-through (완료 항목 제목)
한도        5건 (selectRecentCompletedTop5)
토글 라벨   "방금 완료한 N개" + ▸/▾
액션        복원 / 영구 완료 (canEdit 한정)
```

기존 톤(text-hint 류) 안 자연 도출. 새 베이스 색 도입 안 함.

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

## 6. 패널 스크롤 (2026.04.21 추가)

### 스크롤바
```
폭:           4px
트랙:         transparent
thumb:        #C4B8B0 (text-hint)
thumb hover:  #9E8880 (text-secondary)
border-radius: 2px
```

### 하단 fade-out
```
높이:        8~12px
그라데이션:  #FDF8F4 → transparent (main-bg에서 투명으로)
조건:        스크롤 끝 도달 시 사라짐
```

### 패널 컨테이너 높이
```
max-height: min(600px, 70vh)
min-height: 240px  (탭바 44 + 필터/월네비 바 36 + 최소 콘텐츠 영역 160)
```

---

*Updated: 2026.04.23 (4 handle 토큰 · 능동 scroll 토큰 · 홈 채팅 입력 토큰 신규 — 세션 #61 설계, 세션 #62 복구)*
