# 히찌보드 — UI 패턴 (모달 상세: M1, M2, M3)

> patterns.md에서 분리. 팝업/모달 구현 시 참조.

---

## M1. 팝업 통일 패턴 ⭐ (2026.04.07 확정)

> 할일/메모 팝업에 적용. 요청 할일은 M2 2단 레이아웃 유지.
> 새 팝업 설계 시 이 기준으로 작성.

### 구조
```
헤더 (background #5C1F1F):
  타입 레이블 (fontSize 9, letterSpacing 0.15em, uppercase)
  제목 (fontSize 15, fontWeight 700)
    + 연필아이콘 (opacity 0.25 → hover 0.85, transition 0.15s)
    + 제목 클릭 → 인라인 편집 (input 전환)
  등록일 (fontSize 10, 달력 아이콘)

상태바 (background #FDF8F4, borderBottom):
  타입뱃지 | border-right | 카테고리태그 + 공개범위태그 (+ 기한태그)

바디 — 키-값 테이블형:
  행: label(width 52px, color #C4B8B0) + value(flex:1)
  행 구분: borderBottom 1px solid #F5EFE9
  행 순서:
    1. 내용 (textarea)
    2. 기한 (yyyymmdd 타이핑 + 달력아이콘 / 할일만)
       기한 8자리 입력 시 캘린더 등록 체크박스 노출
    3. 첨부파일
    4. 구분 (업무/개인)
    5. 범위 (전체/나만/특정)
  메모: 기한 행 없음

푸터 (background #FDF8F4, borderTop):
  닫기 + 삭제(좌) / 저장(우)
  삭제: try/catch + addToast 필수
```

### 키-값 행 스타일 토큰
```typescript
const tableRow = (isAlt: boolean) => ({
  display: 'flex', alignItems: 'flex-start',
  padding: '10px 20px',
  background: isAlt ? '#F5EFE9' : '#fff',
  borderBottom: '1px solid #EDE5DC',
  gap: 12,
})
const labelStyle = {
  width: 52, flexShrink: 0,
  fontSize: 10, fontWeight: 700,
  letterSpacing: '0.06em', color: '#C4B8B0',
  textTransform: 'uppercase', paddingTop: 2,
}
```

### 아이콘 Hover 원칙
```
연필:    opacity 0.25 → 0.85  (transition 0.15s ease)
캘린더:  color #C4B8B0 → #C17B6B  (transition 0.15s ease)
휴지통:  opacity 0.2 → 1.0
별:      opacity 0.25 → 0.6 (starred: 1.0)
```

### 구분/범위 버튼 색상
```
⚠️ button 태그 금지 → div/span 태그 사용 (브라우저 기본 스타일 덮어씀)

[구분]
업무 활성:   border #C17B6B  color #C17B6B  background #FFF5F2
업무 비활성: border rgba(193,123,107,0.35)  color rgba(193,123,107,0.45)
개인 활성:   border #7B5EA7  color #7B5EA7  background #F0ECF5
개인 비활성: border rgba(123,94,167,0.35)   color rgba(123,94,167,0.45)

[범위] background: none 공통
전체 활성:   border #639922  color #3B6D11
전체 비활성: border rgba(99,153,34,0.35)    color rgba(59,109,17,0.45)
나만 활성:   border #378ADD  color #185FA5
나만 비활성: border rgba(55,138,221,0.35)   color rgba(24,95,165,0.45)
특정 활성:   border #BA7517  color #854F0B
특정 비활성: border rgba(186,117,23,0.35)   color rgba(133,79,11,0.45)

hover: 비활성 → 활성 색상 (transition 0.15s ease)
```

### 첨부파일 UI
```
파일 있을 때: [파일명(flex:1)] [교체] [삭제]
  삭제: 로컬 제거 → 저장 시 deleteField() 반영

파일 없을 때: "없음" + [+ 추가]

저장 시: Storage 업로드 → Firestore url 저장
삭제 후 저장: updateDoc 직접 호출 + deleteField()
  (updatePost() 우회 필요 — Partial<Post> 타입 충돌)
```

---

## M2. 업무상세 팝업 패턴 (2단 레이아웃) ⭐

```
헤더 (#5C1F1F):
  제목 (fontSize 20, fontWeight 700)
  메타: 요청자→나 / 등록일 / 기한 (#F4C0D1)

상태바 (#FCEEE9): 진행중 chip

바디 2단:
  좌측 260px: 상세내용 / 공개·구분 / 첨부파일
  우측 flex:1: 댓글 + 입력창 (준비 중)

푸터 (#FDF8F4): 닫기+삭제(좌) / 완료처리(우)
maxWidth: 860px
```

---

## M3. 요청 탭 보이는 범위

```
요청자+수신자 (기본값) → visibleTo = [fromEmail, ...toEmails]
전체공개               → visibleTo = []
특정                   → visibleTo = [fromEmail, ...toEmails, ...추가인원]
캘린더 체크박스 없음 — 수락 시 자동 등록 (flows.md FLOW 1)
```
