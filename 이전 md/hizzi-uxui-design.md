# Hizzi Board — UX/UI 디자인 전문 문서

> 새 세션 시작 시 hizzi-master.md + hizzi-session.md 와 함께 첨부하세요.
> 디자인 작업 시 이 파일을 기준으로 진행합니다.

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

모든 UI 요소는 아래 6가지 상태를 미리 정의하고 디자인한다.

```
기본 (default)    → 정적 상태
hover             → background: #FDF8F4, color: #7A2828
선택 (selected)   → border: #2C1810, background: #FDF8F4
비활성 (disabled) → opacity: 0.4, cursor: not-allowed
로딩 (loading)    → 스켈레톤 또는 텍스트 표시
에러 (error)      → color: #C17B6B, border: #C17B6B
```

### 버튼 상태
```tsx
주요:    background: #2C1810 → hover: #7A2828
위험:    border: #C17B6B, color: #C17B6B → hover bg: #FFF5F2
취소:    color: #9E8880 → hover color: #2C1810
비활성: background: #9E8880, cursor: not-allowed
```

---

## 4. 레이어 기반 복합 효과 패턴 ⭐ 핵심

여러 디자인 효과가 충돌 없이 공존하는 구조.

```
원칙:
- 레이아웃 변경 금지 (padding, margin, width 변경 → 충돌 발생)
- 시각적 속성만 변경 (background, color, opacity, border-color)
- 각 효과는 독립된 레이어가 담당
- position: absolute + pointerEvents: none 으로 레이아웃 분리
```

```tsx
<div style={{ position: 'relative', padding: '12px 8px' }}>

  {/* 레이어 1: hover 배경 */}
  <div style={{
    position: 'absolute', inset: 0,
    background: isHovered ? '#FDF8F4' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none',   // ← 클릭 이벤트 통과
    zIndex: 0,
  }} />

  {/* 레이어 2: 별표/긴급 표시 선 */}
  <div style={{
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 2,
    background: isStarred ? '#C17B6B' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none',
    zIndex: 1,
  }} />

  {/* 레이어 3: 실제 내용 */}
  <div style={{ position: 'relative', zIndex: 2 }}>
    {content}
  </div>

</div>
```

### 레이어 확장 규칙
```
새 효과 추가 시:
1. 새 레이어 div 추가 (기존 레이어 건드리지 않음)
2. pointerEvents: 'none' 필수
3. zIndex는 내용 레이어보다 낮게
4. 레이아웃 변경 없이 시각적 속성만
```

### 왜 이 패턴이 중요한가
```
오늘 겪은 버그:
투명 오버레이 div (inset 0, fixed)
→ 삭제 버튼 클릭을 가로챔
→ 삭제가 안 되는 버그 발생

레이어 패턴 사용 시:
pointerEvents: none → 클릭이 내용 레이어까지 통과
→ 디자인이 기능을 절대 덮지 않음
→ 버그 구조적 예방
```

---

## 5. 애니메이션 원칙

```
전체 통일: transition: 0.15s ease

금지:
- 0.3s 이상 (느리고 답답함)
- linear (부자연스러움)
- padding, margin transition (레이아웃 밀림 발생)
```

---

## 6. Z-index 체계 (10단위)

```
패널 내부 요소:   10
드롭다운 메뉴:    100
모달 오버레이:    1000
모달 본체:        1001
토스트 알림:      9999
```

---

## 7. 터치 영역 최소 크기 (모바일)

```
원칙: 모든 클릭/탭 가능 요소는 최소 44x44px

작은 아이콘도 padding으로 클릭 영역 확보:
<button style={{ padding: '14px', margin: '-14px' }}>
  [아이콘]
</button>
```

---

## 8. 포커스 상태 (접근성)

```css
/* globals.css에 추가 예정 */
:focus-visible {
  outline: 2px solid #C17B6B;
  outline-offset: 2px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```

```
원칙: outline: none 단독 사용 금지
글로벌 서비스 가면 필수 요소
```

---

## 9. 스켈레톤 로딩 패턴

```tsx
const SkeletonLine = ({ width = '100%', height = 12 }) => (
  <div style={{
    width, height,
    background: 'linear-gradient(90deg, #EDE5DC 25%, #F5EDE6 50%, #EDE5DC 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton 1.5s infinite',
    borderRadius: 2,
    marginBottom: 8,
  }} />
);
```

```
사용 위치:
- 페이지 초기 로딩
- 데이터 fetch 중
- Rehobot AI 응답 대기 중
```

---

## 10. 다크모드 대응 원칙

```css
/* 추후 적용 예정 */
:root {
  --color-bg-primary:   #FDF8F4;
  --color-text-primary: #2C1810;
  --color-border:       #EDE5DC;
  --color-accent:       #C17B6B;
}
[data-theme="dark"] {
  --color-bg-primary:   #1A1210;
  --color-text-primary: #FDF8F4;
  --color-border:       #3A2820;
  --color-accent:       #C17B6B;
}
```

```
현재: 하드코딩 유지 (히찌보드)
적용: Rehobot 개발 시 CSS 변수로 전환
```

---

## 11. SVG 아이콘 원칙

```
이모티콘(★ ✓ ▲▼) → SVG 아이콘으로 교체

스타일 원칙:
- stroke 방식 (fill 아닌 선으로)
- strokeWidth: 1.2~1.5
- 색상은 팔레트 따름
- 크기: 12~16px

예시:
<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
  <path d="M7 1l1.8 3.6..." stroke="#C17B6B" strokeWidth="1.2" fill="none"/>
</svg>
```

---

## 12. 실수로 배운 것들 ⭐

### hover 레이아웃 충돌
```
❌ 잘못된 방식:
hover 시 paddingLeft 변경 → 콘텐츠가 오른쪽으로 밀림
hover 시 borderLeft 추가 → 공간 차지로 레이아웃 변경

✅ 올바른 방식:
borderLeft: 2px solid transparent (항상 공간 미리 확보)
hover 시 border-color만 변경
paddingLeft 고정값 유지
```

### 투명 오버레이 이벤트 충돌
```
❌ 잘못된 방식:
fixed inset-0 투명 div → 모달 버튼 클릭을 가로챔

✅ 올바른 방식:
onMouseLeave로 메뉴 닫기
pointerEvents: none 레이어 활용
```

### Firestore 저장 실패 디버깅 ⭐
```
증상: 게시물 화면에 보이다가 새로고침하면 사라짐
원인: undefined 값이 Firestore에 저장 불가
      addDoc() called with invalid data. Unsupported field value: undefined

교훈:
1. 브라우저 Console(F12) 먼저 확인
2. undefined 필드는 조건부로 추가:
   if (category === '할일') postData.taskType = taskType;
   (undefined 할당 절대 금지)
3. addDoc() invalid data 에러 = undefined 필드 의심
```

### firebase.ts export 누락
```
증상: 파일 업로드 안 됨, addPost Fallback 실행
원인: storage export 한 줄 빠짐

필수 체크:
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);  ← 항상 확인
```

### GlobalMenu 전역 패턴 실패
```
GlobalMenu (Zustand store) 방식 시도 → 실패
원인: closeMenu() 실행 후 리렌더링으로
      로컬 state(setIsDeleteOpen) 초기화됨

✅ 올바른 방식:
각 컴포넌트가 자체 메뉴 state 관리
onMouseLeave로 닫기
모달은 로컬 state로 독립 관리
```

### PowerShell 파일 수정 주의
```
❌ PowerShell Ctrl+V 붙여넣기 → 인코딩 깨짐
✅ git checkout으로 복구 후 VS Code에서 직접 수정
```

---

## 13. 사전 고민 체크리스트

새 기능 개발 전 체크:
```
□ 이 컴포넌트의 6가지 상태가 모두 정의됐는가?
□ hover 효과가 레이아웃을 변경하지 않는가?
□ 여러 효과 충돌 시 레이어 패턴을 쓰는가?
□ Z-index가 체계에 맞게 설정됐는가?
□ transition이 0.15s ease로 통일됐는가?
□ 터치 영역이 최소 44x44px인가? (모바일)
□ firebase.ts에 필요한 export가 모두 있는가?
□ Firestore Rules에 create/update/delete 모두 있는가?
□ undefined 값을 Firestore에 저장하지 않는가?
□ Console(F12)에서 에러 먼저 확인했는가?
```

---

## 14. UI 컴포넌트 패턴

### 모달
```tsx
오버레이: position fixed, inset 0, zIndex 1000, background rgba(44,20,16,0.4)
카드:     background #fff, border 1px solid #EDE5DC, zIndex 1001
헤더:     10px uppercase letter-spacing 0.15em #2C1810
푸터:     background #FDF8F4, border-top 1px solid #EDE5DC
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

*업데이트: 2026.04.03*
*히찌보드 개발 경험 + 오늘 세션 전체 반영*
