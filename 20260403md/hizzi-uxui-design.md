# Hizzi Board — UX/UI 디자인 전문 문서

---

## 1. 브랜드 디자인 방향성

```
레퍼런스: ZARA / COS
톤앤매너: 미니멀, 에디토리얼, 고급스러운 패션 브랜드 인트라넷
원칙: 장식보다 여백 / 색상보다 타이포그래피 / 화려함보다 절제
빠른 반응성 (0.15s) / 속도보다 정확성
```

---

## 2. 색상 팔레트

```
사이드바 배경:    #5C1F1F  딥 로즈브라운
메인 배경:        #FDF8F4  크림 베이지
카드 배경:        #FFFFFF
포인트:           #C17B6B  뮤트 테라코타
활성/hover텍스트: #7A2828  미디엄 브라운
주 텍스트:        #2C1810  다크 브라운
보조 텍스트:      #9E8880  모카 그레이
힌트 텍스트:      #C4B8B0  라이트 모카
테두리:           #EDE5DC  웜 베이지
할일-업무 배경:   #FFF5F2
할일-개인 배경:   #F5F0EE
요청 배경:        #FCEEE9
모달 오버레이:    rgba(44,20,16,0.4)
```

### 타이포그래피
```
섹션 제목: 10-11px, font-weight 700, letter-spacing 0.1em, uppercase
본문:      13px, line-height 1.6, color #2C1810
메타:      11px, color #9E8880
힌트:      10px, color #C4B8B0, letter-spacing 0.06em
```

---

## 3. 색상 의미 시스템 ⭐ (확정)

### 달력 이벤트
```
규칙: 색상 = 공개범위 / 스타일 = 업무·개인

업무 (진한 채움):
  전체공개 → #3B6D11 그린
  나만보기 → #185FA5 블루
  지정공개 → #854F0B 앰버

개인 (반투명 배경 + 왼쪽 선):
  전체공개 → rgba(99,153,34,0.15) + #639922 선
  나만보기 → rgba(55,138,221,0.15) + #378ADD 선
  지정공개 → rgba(186,117,23,0.15) + #BA7517 선

연차 → rgba(83,74,183,0.15) + #534AB7 선
업무 요청 → #993556 + 3px solid #72243E
```

### 할일 태그
```
업무/개인: 업무 → #C17B6B/#FFF5F2 / 개인 → #9E8880/#F5F0EE
공개범위: 전체=그린 / 나만=블루 / 지정=앰버
FROM 태그: #FCEEE9 배경 + #A0503A + 0.5px solid #C17B6B
```

### 버튼 색상 의미
```
수락: #EAF3DE + #3B6D11 + 1px solid #C0DD97 (파스텔 그린 B안)
반려: #FBEAF0 + #993556 + 1px solid #F4C0D1 (파스텔 핑크 B안)
완료처리: #2C1810 + #FDF8F4 (확정적 액션)
```

---

## 4. 컴포넌트 상태 정의 (6가지)

```
기본 (default)    → 정적 상태
hover             → background: #FDF8F4, color: #7A2828
선택 (selected)   → border: #2C1810, background: #FDF8F4
비활성 (disabled) → opacity: 0.4, cursor: not-allowed
로딩 (loading)    → 텍스트 표시 (저장 중... / 처리 중...)
에러 (error)      → color: #C17B6B, border: #C17B6B
```

---

## 5. 레이어 기반 복합 효과 패턴 ⭐

```tsx
<div style={{ position: 'relative', padding: '12px 8px' }}>
  {/* 레이어 1: hover 배경 — margin 없이 inset만 */}
  <div style={{
    position: 'absolute', inset: 0,
    background: isHovered ? '#FDF8F4' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none', zIndex: 0,
  }} />
  {/* 레이어 2: 공개범위/요청 표시 선 */}
  <div style={{
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: (() => {
      if (post.requestFrom) return '#993556';
      if (post.starred) return '#C17B6B';
      if (!post.visibleTo || post.visibleTo.length === 0) return '#639922';
      if (post.visibleTo.length > 1) return '#BA7517';
      return '#378ADD';
    })(),
    transition: 'background 0.15s ease',
    pointerEvents: 'none', zIndex: 1,
  }} />
  {/* 레이어 3: 실제 내용 */}
  <div style={{ position: 'relative', zIndex: 2 }}>{content}</div>
</div>
```

**⚠️ PostItem hover 레이어에 margin: '0 -20px' 사용 금지**
→ overflow-y: auto 부모에서 클리핑되어 스타일 무너짐 발생

---

## 6. 업무 지시서 모달 패턴 ⭐

```tsx
// 헤더: 사이드바 색상
<div style={{ background: '#5C1F1F', padding: '18px 22px 14px' }}>
  <div style={{ fontSize: 15, fontWeight: 700, color: '#FDF8F4' }}>{title}</div>
</div>
// 상태바: 연한 핑크
<div style={{ background: '#FCEEE9', borderBottom: '1px solid #EDE5DC' }}>
  진행중 + 기한 칩
</div>
// 본문: 상세내용 / 공개범위 / 구분
// 푸터: 닫기 + 완료처리
```

---

## 7. 달력 이벤트 클릭 패턴 ⭐

```
data-event="true" 속성 필수
onMouseUp/onClick에서 target.closest('[data-event="true"]') 체크
borderLeft는 isStart || isSingle 일 때만 표시
```

---

## 8. 모달 ESC 닫기 패턴 ⭐

```tsx
import { useEscClose } from '@/hooks/useEscClose';
useEscClose(() => setIsOpen(false), isOpen);

// 여러 모달 우선순위
const anyModalOpen = showAdd || !!showDetail || !!showMoreDate;
useEscClose(() => {
  if (showMoreDate) { setShowMoreDate(null); return; }
  if (showDetail) { setShowDetail(null); return; }
  if (showAdd) { setShowAdd(false); return; }
}, anyModalOpen);
```

---

## 9. 애니메이션 원칙

```
전체 통일: transition: 0.15s ease
금지: 0.3s 이상 / linear / padding-margin transition
```

---

## 10. Z-index 체계

```
패널 내부:   10 / 드롭다운: 100
모달 오버레이: 1000 / 모달 본체: 1001
달력 모달: 50 / 달력 더보기: 70
토스트/Portal: 9999
```

---

## 11. UI 컴포넌트 패턴

```tsx
// 모달
오버레이: position fixed, inset 0, zIndex 1000, rgba(44,20,16,0.4)
카드: background #fff, border 1px solid #EDE5DC, zIndex 1001
헤더: 10px uppercase letter-spacing 0.15em #2C1810
푸터: background #FDF8F4, border-top 1px solid #EDE5DC
ESC: useEscClose 훅 필수

// 버튼
주요: background #2C1810, color #FDF8F4
수락: background #EAF3DE, color #3B6D11, border 1px solid #C0DD97
반려: background #FBEAF0, color #993556, border 1px solid #F4C0D1
위험: color #C17B6B, border 1px solid #C17B6B
취소: color #9E8880, background none, border none

// 입력 필드
border: none / borderBottom: 1px solid #EDE5DC
fontSize: 13, color #2C1810, background: transparent, outline: none
```

---

## 12. 사전 고민 체크리스트

```
□ 상태 흐름도 먼저 정의했는가?
□ 공통 훅으로 뺄 부분이 있는가?
□ any 타입 없이 정확한 타입 정의했는가?
□ 새 모달에 useEscClose 적용했는가?
□ 파일 연관관계 확인했는가?
□ hover 레이어에 margin 음수값 없는가? ⭐
□ Z-index 체계에 맞는가?
□ transition 0.15s ease로 통일됐는가?
□ undefined 값을 Firestore에 저장하지 않는가?
```

---

## 13. 실수로 배운 것들 ⭐

```
달력 이벤트 클릭 충돌:
  ❌ stopPropagation만 → ✅ data-event="true" + closest

팀 요청 달력 중복:
  ❌ 수신자마다 등록 → ✅ teamRequestId 첫 수락자만

개인 이벤트 왼쪽 선:
  ❌ 항상 표시 → ✅ isStart || isSingle 때만

PostItem hover 레이아웃 무너짐:
  ❌ margin: '0 -20px' → ✅ margin 없이 inset: 0 만

삭제 게시물 재표시:
  ❌ Firestore만 삭제 → ✅ 낙관적 업데이트 먼저

any 타입:
  ❌ updates: any → ✅ interface PostUpdates 정의
```

---

*업데이트: 2026.04.05*
