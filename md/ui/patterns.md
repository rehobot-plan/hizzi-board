# 히찌보드 — UI 패턴

> 컴포넌트 구현 방법의 기준.
> 새 컴포넌트 작성 전 여기를 먼저 확인한다.
> 패턴 변경 시 오너 승인 필수.
> 모달 패턴 상세 (M1, M2, M3): patterns-modal.md 참조.

---

## P1. 레이어 기반 Hover 패턴 ⭐

```tsx
<div style={{ position: 'relative', padding: '12px 8px' }}>
  {/* 레이어 0: hover 배경 */}
  <div style={{
    position: 'absolute', inset: 0,
    background: isHovered ? '#FDF8F4' : 'transparent',
    transition: 'background 0.15s ease',
    pointerEvents: 'none', zIndex: 0,
  }} />
  {/* 레이어 1: 왼쪽 2px 컬러 띠 */}
  <div style={{
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
    background: getLeftBorderColor(post),
    pointerEvents: 'none', zIndex: 1,
  }} />
  {/* 레이어 2: 실제 콘텐츠 */}
  <div style={{ position: 'relative', zIndex: 2 }}>{content}</div>
</div>
```

⚠️ hover 레이어에 `margin: '0 -20px'` 절대 금지. `inset: 0`만 사용.

---

## P2. 좌측 띠 색상 결정 함수

좌측 띠는 카테고리 축(업무/개인/요청)만 표현한다.
visibility · starred 축은 본문 태그(VisibilityTag · 별 아이콘)가 담당한다.
한 정보를 두 곳에서 표현하지 않는다.

```typescript
// 메모 (2분기)
function postLeftBorderColor(post: Post): string {
  if (post.taskType === 'personal') return '#7B5EA7'  // 개인
  return '#C17B6B'                                     // 업무
}

// 할일 (3분기 — 요청 추가)
function todoLeftBorderColor(todo: Post): string {
  if (todo.requestFrom) return '#993556'              // 요청
  if (todo.taskType === 'personal') return '#7B5EA7'  // 개인
  return '#C17B6B'                                     // 업무
}
```

위치: src/lib/leftBorderColor.ts (Phase 5-B에서 추출)

---

## P3. 모달 패턴

```tsx
{/* 오버레이 */}
<div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(44,20,16,0.4)' }}
  onClick={() => setIsOpen(false)}>
  {/* 카드 */}
  <div style={{ background: '#fff', border: '1px solid #EDE5DC', zIndex: 1001 }}
    onClick={e => e.stopPropagation()}>
    {/* 푸터 */}
    <div style={{ background: '#FDF8F4', borderTop: '1px solid #EDE5DC' }} />
  </div>
</div>
// ESC 닫기 — 필수
useEscClose(() => setIsOpen(false), isOpen)
```

---

## P4. 입력 필드 패턴

```tsx
<input style={{
  border: 'none',
  borderBottom: '1px solid #EDE5DC',
  fontSize: 13,
  color: '#2C1810',
  background: 'transparent',
  outline: 'none',
}} />
```

---

## P5. z-index 계층 (이탈 금지)

```
패널 내부:       10
드롭다운:       100
모달 오버레이: 1000
모달 본체:     1001
캘린더 모달:     50
캘린더 더보기:   70
Toast · Portal: 9999
```

---

## P6. 애니메이션 규칙

```
모든 transition: 0.15s ease
금지: 0.3s 이상 / linear / padding·margin에 transition
```

---

## P7. 캘린더 클릭 가드 패턴

```typescript
// 이벤트 요소에 data-event="true" 부여
<div data-event="true" ...>

// 클릭 핸들러에서 이벤트 클릭 여부 확인
const clickedEvent = (e.target as HTMLElement).closest('[data-event="true"]')
if (clickedEvent) return

// 개인 이벤트 왼쪽 테두리: isStart || isSingle일 때만 렌더링
{(isStart || isSingle) && <div style={{ borderLeft: '3px solid ...' }} />}
```

---

## P8. ⋯ 펼쳐보기 handle 패턴 ⭐

적용 조건:
  컨테이너에 max-height 제약이 걸려 내부 스크롤이 발생하고
  사용자가 전체 내용을 한눈에 보고 싶은 요구가 있을 때

구조 — 필수 2단 wrapper:

```tsx
<div style={{ position: 'relative' }}>              {/* wrapper: overflow visible */}
  <div style={{                                       /* card: overflow hidden */
    position: 'relative',
    overflow: 'hidden',
    overflowAnchor: 'none',                           /* 다층 방어 층1·2 */
    maxHeight: 'min(600px, 70vh)',
  }}>
    <div style={{                                     /* scroll: card의 flex child 직접 */
      flex: '1 1 auto',
      minHeight: 0,                                   /* ⚠ 핵심 — content 이하 축소 허용 */
      overflowY: 'auto',
    }}>
      {content}
    </div>
  </div>
  <button                                             /* handle: card 경계 걸침 */
    onMouseDown={e => e.preventDefault()}             /* 다층 방어 층3 */
    style={{
      position: 'absolute',
      bottom: -9,                                     /* 50% 걸침 */
      left: '50%',
      transform: 'translateX(-50%)',
      width: 44, height: 18, borderRadius: 9,
      background: '#FFFFFF',
      border: '1px solid #C4B8B0',
      color: '#C4B8B0',
      boxShadow: '0 1px 3px rgba(44,20,16,0.04)',
      transition: 'color 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
      zIndex: 3,
    }}
    aria-expanded={isExpanded}
    aria-label="펼쳐보기"
  >
    <ChevronIcon size={14} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
  </button>
</div>
```

핵심 원칙:
  scroll div에 flex: 1 1 auto + min-height: 0 필수
  — flex 아이템이 content 이하로 축소되도록 허용.
  누락 시 scrollHeight === clientHeight 폴백 → hasOverflow 항상 false.
  (세션 #54~#61 잠복 버그 실측 근본 원인)

hasOverflow 감지:
  ResizeObserver + MutationObserver(characterData 제외) + rAF 배치 + 이전값 guard
  scrollHeight > clientHeight 조건으로 표시 · 빈 패널엔 비노출

능동 scroll 정렬 (U13 · main-ux.md 1.2b):
  펼침·접힘 시 패널 상단 scroll-margin-top 80px로 능동 정렬
  scrollIntoView({ block: 'start', behavior }) + rAF 2프레임 대기
  데스크탑(≥768px) 한정 · 이미 가시(0~100px) 생략
  prefers-reduced-motion 폴백 · localStorage rollback

다층 방어 5층 (원인 미규명 scroll jump 대응 · main-ux.md 1.2c):
  1. html/body + card 레벨 overflow-anchor: none
  2. handle onMouseDown preventDefault (focus 이동 차단 · 키보드 Tab 유지)
  3. intentScrollYRef — 진입 시점 scrollY 선기록 후 click 복원 기준
  4. 400ms 감시 창 scroll event intercept + rAF 2회 직접 복원
  5. scrollTo({ behavior: 'instant' }) + globals.css scroll-behavior: auto

접근성:
  aria-expanded 상태 반영
  aria-label="펼쳐보기"
  키보드 Tab 접근 유지 (focus 이동 차단은 mousedown만 · click·키보드는 정상)

E2E assertion 원칙:
  handle 노출 ↔ scroll overflow 1:1 일치 (sh > ch 엄격)
  scrollHeight >= clientHeight 같은 자명 부등식 금지 (회귀 감지 실패)
  Playwright page.click()의 actionability scroll은 baseline 오염
  → element.click() programmatic 또는 mouse.move/down/up 분리 시퀀스 사용

접힘 복귀:
  scrollTop 0 재설정

---

## P9. 인라인 확장 대화 패턴 ⭐

적용 조건:
  · 사용자 입력 → AI 응답 → 확인/수정/확정 흐름
  · 짧은 확인(1~2턴) 중심 케이스
  · 확정 후 입력창이 원상 복귀되어야 하는 경우
  · 모달을 띄우기엔 과하고, 같은 줄에 응답 다는 건 공간 부족할 때

구조:

```
  [입력 pill]  ← 한 줄 52px · border-radius 26
       │
       ▼  (확정 시 margin-top 12px + 상단 꺾쇠로 연결)
  ┌───────────────────────────────┐
  │ [AI] 응답 텍스트               │   ← 확장 영역 (card-bg)
  │                                │       padding 20·24
  │  [파싱 프리뷰 카드]             │
  │                                │
  │  [칩 버튼들]                    │
  │                                │
  │  [취소] [자세한 대화로] [확정]  │   ← 푸터
  └───────────────────────────────┘
```

시나리오 분기 (시나리오 1은 빈 입력 placeholder 상태 — main-ux.md 6 참조):

  시나리오 2 (명확 입력 · 즉시 저장, 50%+):
    내용·구분·범위 모두 명확 추론 시 확장 영역 미노출
    즉시 저장 + 하단 토스트 5초 (3층 복구 동선 1층과 동일)

  시나리오 3 (애매 입력 · AI 확인, 30%):
    파싱 결과 태그로 먼저 시각화 + 빠진 조각만 칩 버튼으로 질의
    한 번 탭 + "추가"로 종료 (전체 2초 목표)

  시나리오 4 (복수 항목 · B 승격, 20%):
    각 항목을 카드로 분리 표시
    "자세한 대화로" 승격 버튼으로 사이드 패널(B안) 전환

B 승격 임계 (U14 재명시):
  · 3턴 이상 필요 (명확화 질문 2회째) or
  · 복수 항목 + 각각 미확정 조각

파싱 프리뷰 원칙:
  AI가 추론한 결과는 태그로 먼저 시각화.
  텍스트 응답만으로 "뭐가 맞고 뭐가 틀렸나"를 스캔 비용 크게 만들지 말 것.

접근성:
  · 확장 영역 열릴 때 첫 focusable 요소로 focus 이동
  · Esc 키로 확장 영역 닫기 (취소와 동일 동작)
  · "자세한 대화로" 승격 버튼은 독립 Tab 도달 가능
  · 애니메이션 0.2s ease-out · prefers-reduced-motion 즉시 펼침 폴백

---

## P10. FAB 패턴 ⭐

위치: 패널 우하단 44px
  엄지 홈 포지션 (오른손 엄지 최적)
  모바일·데스크탑 동일 위치

context-aware 동작:
  현재 탭에 따라 호출 대상 변경
  할일 탭 → 빠른 추가 모달 (후순위 #4 자연어 빠른 추가 진입점)
  메모 탭 → 빠른 메모 모달
  달력 탭 → 일정 생성 모달 (선택 날짜 또는 오늘 prefill)

```tsx
<div
  style={{
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    background: '#2C1810',
    color: '#FDF8F4',
    fontSize: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(44,20,16,0.15)',
    transition: 'transform 0.15s ease, background 0.15s ease',
  }}
  onClick={() => openModalForCurrentTab(activeTab)}
>
  +
</div>
```

z-index: 10 (P5 계층 — 패널 내부)
hover: transform scale(1.04) + background #1A0E08

---

## P11. 스와이프 제스처 패턴 ⭐

적용 대상: 할일·메모 아이템 삭제
  좌←우 드래그 → 삭제 영역 노출 → 놓으면 실행
  기존 hover 휴지통 아이콘은 완전 제거

터치·마우스·트랙패드 통합 처리:
  모바일 터치 — touchstart/touchmove/touchend
  데스크탑 트랙패드·마우스 — pointerdown/pointermove/pointerup
  Pointer Events API 사용 (브라우저 일관성)

임계값:
  드래그 거리 80px 이상 → 삭제 확정
  80px 미만 → 원위치 복귀 (0.15s ease)

시각:
  드래그 중 아이템 우측에 "삭제" 라벨 분홍 배경 노출
    background: #FBEAF0  color: #993556
  아이템 본체는 드래그 거리만큼 좌로 translateX
  놓는 순간 아이템 페이드아웃 후 리스트에서 제거

방향 할당:
  좌←우 = 삭제 (분홍 궤적, 확정)
  우→좌 = 본 범위에선 미할당 (향후 완료 제스처 확장 여지)

세로 스크롤과의 충돌 방지:
  수평 이동량이 수직 이동량보다 먼저 임계(10px) 초과 시에만 스와이프로 해석
  그 전엔 리스트 세로 스크롤 우선

요청 할일 cascade:
  스와이프 삭제 시 post soft delete + todoRequest.status = 'cancelled'
  1층 토스트 실행 취소 시 양쪽 동시 복구 (flows.md FLOW 1, flows-detail.md)

---

*Updated: 2026.04.23 (P8·P9 신규 — ⋯ handle · 인라인 확장 · 기존 P8·P9 → P10·P11 재번호 · 세션 #61 설계, 세션 #62 복구)*
