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

## P8. FAB 패턴 ⭐

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

## P9. 스와이프 제스처 패턴 ⭐

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
