# Hizzi Board — UX/UI 디자인 전문 문서

> 새 세션 시작 시 hizzi-master.md + hizzi-session.md 와 함께 첨부하세요.

---

## 1. 브랜드 디자인 방향성

```
레퍼런스: ZARA / COS
톤앤매너: 미니멀, 에디토리얼, 고급스러운 패션 브랜드 인트라넷
원칙:
- 장식보다 여백
- 색상보다 타이포그래피
- 화려함보다 절제
- 빠른 반응성 (0.15s)
- 속도보다 정확성 (구조를 먼저 단단하게)
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
배지 배경:        #F5E6E0
할일-업무 배경:   #FFF5F2
할일-개인 배경:   #F5F0EE
요청받은 할일:    #FCEEE9  (FROM 태그 배경)
요청 태그 텍스트: #A0503A
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

## 3. 컴포넌트 상태 정의 (6가지)

```
기본 (default)    → 정적 상태
hover             → background: #FDF8F4, color: #7A2828
선택 (selected)   → border: #2C1810, background: #FDF8F4
비활성 (disabled) → opacity: 0.4, cursor: not-allowed
로딩 (loading)    → 스켈레톤 또는 텍스트 표시
에러 (error)      → color: #C17B6B, border: #C17B6B
```

---

## 4. 레이어 기반 복합 효과 패턴 ⭐ 핵심

```tsx
<div style={{ position: 'relative', padding: '12px 8px' }}>
  {/* 레이어 1: hover 배경 */}
  <div style={{
    position: 'absolute', inset: 0,
    background: isHovered ? '#FDF8F4' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none', zIndex: 0,
  }} />
  {/* 레이어 2: 별표/요청 표시 선 */}
  <div style={{
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 2,
    background: post.starred ? '#C17B6B' : post.requestFrom ? '#C17B6B' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none', zIndex: 1,
  }} />
  {/* 레이어 3: 실제 내용 */}
  <div style={{ position: 'relative', zIndex: 2 }}>{content}</div>
</div>
```

---

## 5. 요청받은 할일 디자인 패턴 (A안 — 확정)

```tsx
{post.requestFrom && (
  <>
    {/* 왼쪽 테라코타 라인 */}
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0,
      width: 2, background: '#C17B6B',
      pointerEvents: 'none', zIndex: 1,
    }} />
    {/* FROM 태그 */}
    <span style={{
      fontSize: 9, padding: '1px 6px',
      background: '#FCEEE9', color: '#A0503A',
      border: '0.5px solid #C17B6B',
      letterSpacing: '0.06em',
    }}>
      FROM {post.requestFrom.split('@')[0]}
    </span>
  </>
)}
```

---

## 6. 달력 이벤트 클릭 패턴 ⭐

```
이벤트 바에 data-event="true" 속성 필수
onMouseUp / onClick에서 target.closest('[data-event="true"]') 체크
→ 이벤트 클릭 시 일정추가 팝업 열리지 않음
→ 빈 셀 클릭 시만 일정추가 창 열림
```

---

## 7. 애니메이션 원칙

```
전체 통일: transition: 0.15s ease
금지: 0.3s 이상 / linear / padding-margin transition
```

---

## 8. Z-index 체계 (10단위)

```
패널 내부 요소:   10
드롭다운 메뉴:    100
모달 오버레이:    1000
모달 본체:        1001
달력 모달:        50 (Calendar 내부)
달력 더보기팝업:  70
토스트 알림:      9999
Portal 메뉴:      9999
```

---

## 9. 모달 ESC 닫기 패턴 ⭐ (공통훅)

```tsx
// 새 모달 만들 때 필수
import { useEscClose } from '@/hooks/useEscClose';

// 단일 모달
useEscClose(() => setIsOpen(false), isOpen);

// 여러 모달이 있는 컴포넌트 (Calendar 패턴)
const anyModalOpen = showAdd || !!showDetail || !!showMoreDate;
useEscClose(() => {
  if (showMoreDate) { setShowMoreDate(null); return; }
  if (showDetail) { setShowDetail(null); return; }
  if (showAdd) { setShowAdd(false); return; }
}, anyModalOpen);
```

---

## 10. UI 컴포넌트 패턴

### 모달
```tsx
오버레이: position fixed, inset 0, zIndex 1000, background rgba(44,20,16,0.4)
카드:     background #fff, border 1px solid #EDE5DC, zIndex 1001
헤더:     10px uppercase letter-spacing 0.15em #2C1810
푸터:     background #FDF8F4, border-top 1px solid #EDE5DC
ESC 닫기: useEscClose 훅 필수 적용
```

### 버튼
```tsx
주요:  background #2C1810, color #FDF8F4, 10px uppercase
취소:  color #9E8880, background none, border none
위험:  color #C17B6B, border 1px solid #C17B6B
```

### 토글 칩
```tsx
기본:   border #EDE5DC, color #9E8880
선택:   border #2C1810, color #2C1810, background #FDF8F4
포인트: border #C17B6B, color #C17B6B, background #FFF5F2
```

### 입력 필드
```tsx
border: none
borderBottom: 1px solid #EDE5DC
fontSize: 13, color #2C1810
background: transparent, outline: none
```

---

## 11. 실수로 배운 것들 ⭐

### 달력 이벤트 클릭 충돌
```
❌ 잘못된 방식:
이벤트 바에 e.stopPropagation()만 → onMouseUp은 막지 못함

✅ 올바른 방식:
이벤트 바에 data-event="true" 추가
onMouseUp / onClick에서:
const clickedEvent = target.closest('[data-event="true"]');
if (clickedEvent) return;
```

### 팀 요청 달력 중복
```
❌ 잘못된 방식:
수신자마다 acceptRequest → 각자 달력 등록

✅ 올바른 방식:
teamRequestId 공유 → 첫 수락자만 달력 등록
이후 수락자는 기존 이벤트에 authorName 업데이트
```

### Firestore 저장 실패 디버깅
```
증상: 화면에 보이다가 새로고침하면 사라짐
원인: undefined 값 Firestore 저장 불가
해결:
Object.keys(docData).forEach(key => {
  if (docData[key] === undefined) delete docData[key];
});
```

### 공통 훅 도입 원칙
```
같은 useEffect 패턴이 2곳 이상 → 훅으로 분리
훅 위치: src/hooks/
새 모달 만들 때 useEscClose 반드시 체크
```

---

## 12. 사전 고민 체크리스트

새 기능 개발 전 체크:
```
□ 이 컴포넌트의 6가지 상태가 모두 정의됐는가?
□ hover 효과가 레이아웃을 변경하지 않는가?
□ 여러 효과 충돌 시 레이어 패턴을 쓰는가?
□ Z-index가 체계에 맞게 설정됐는가?
□ transition이 0.15s ease로 통일됐는가?
□ firebase.ts에 필요한 export가 모두 있는가?
□ Firestore Rules에 create/update/delete 모두 있는가?
□ undefined 값을 Firestore에 저장하지 않는가?
□ 새 모달/팝업에 useEscClose 훅을 적용했는가? ⭐
□ 파일 연관관계 확인했는가? (hizzi-master.md 참고) ⭐
□ 같은 로직이 반복되면 공통 훅 제안했는가? ⭐
```

---

*업데이트: 2026.04.03 저녁*
*요청 할일 디자인 패턴 + 달력 이벤트 클릭 패턴 + useEscClose 공통훅 패턴 추가*
