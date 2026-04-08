# 히찌보드 — UX 원칙

> 새 기능 설계 전 반드시 읽는다.
> 확정된 원칙이며 임의 변경 금지.
> 변경 필요 시 오너 승인 후 이 파일을 먼저 업데이트한다.

---

## U1. 정보 계층 구조

```
패널 (Panel)
  └─ 탭바: 패널명(좌측) + 탭(우측)
      └─ 할일 탭: 필터 바 (업무/요청/개인) + 게시물
      └─ 메모 탭: 필터 바 숨김 + 게시물만
```

---

## U2. 필터 원칙

```
버튼: 업무 / 요청 / 개인 (전체 버튼 없음)
기본: 업무 + 요청 동시 활성 (중복 선택 허용)
아무것도 선택 안 된 상태 → 전체 표시 (엣지케이스 방어)
메모 탭: 필터 바 완전 숨김
```

---

## U3. 할일 아이템 구조

```
[왼쪽 2px 컬러선] [체크박스] [별] [제목 + 휴지통(일반만)]
                                   [태그들] [dueDate시계] [날짜]

체크박스: 맨 왼쪽, 모든 할일 즉시 완료 (요청도 동일)
별:       opacity 0.25 → hover 0.6 → starred 1.0
휴지통:   일반 할일만, 아이콘만 (border/background/shadow 없음)

클릭 레이어: position absolute, left 66px (체크박스+별 영역 제외), zIndex 1
체크박스·별: position relative, zIndex 2
→ 체크박스/별/휴지통 클릭 시 stopPropagation으로 팝업 차단
```

---

## U4. 할일 데이터 구조

```typescript
// 현재: content 필드가 제목 역할
// Phase 3 예정: title/content 분리 + dueDate 전체 확장
{
  title?: string     // 할일 제목 (Phase 3 이후)
  content: string    // 현재 제목 역할 / Phase 3 이후 상세 내용
  dueDate?: string   // 기한 (YYYY-MM-DD)
}
```

---

## U5. 정렬 기준

```
할일 목록:
  1. starred = true → 최상단
  2. dueDate 임박순
  3. createdAt 최신순

메모 목록:
  1. starred = true → 최상단
  2. createdAt 최신순
```

---

## U6. 삭제 원칙

```
단건 삭제:
  휴지통 클릭 → soft delete (deleted: true)
  confirm 없음 / 복구 가능
  복구 시 completed: false 함께 초기화

팝업 내 삭제:
  삭제 버튼 → try/catch + addToast

요청 할일 팝업 내 삭제:
  post soft delete + todoRequest.status = 'cancelled' (cascade 필수)
  flows.md FLOW 1 참조

bulk 삭제:
  try/catch/finally 필수 (rules.md S2 참조)
```

---

## U7. 완료 처리 원칙

```
체크박스 클릭 (모든 할일 공통):
  → 0.6s 애니메이션 후 완료
  → 요청 할일도 즉시 완료 (팝업 없음)
  → cascade: posts.completed = true + todoRequests.status = 'completed'

팝업 내 완료처리 버튼 (요청 할일):
  → 동일 cascade
  → 완료 후 팝업 닫힘
```

---

## U8. 수정 원칙

```
모든 할일/메모:
  아이템 클릭 → 팝업에서 수정
  제목: 헤더 클릭 → 연필 아이콘 활성 → 인라인 편집
  내용/기한/첨부/구분/범위: 팝업 바디에서 수정
  ··· 메뉴 없음 (완전 제거)

요청 할일: 팝업에서 수정 가능 (저장 버튼)
```

---

## U9. 요청함 (TodoRequestModal) UX ⭐

```
위치: 패널 탭바 우측 우편함 아이콘
배지: 수락 대기 건수만 카운트

섹션 1 — 내가 수락해야 함: toEmail=나, status=pending,   color #993556
섹션 2 — 내가 진행 중:    toEmail=나, status=accepted,  color #C17B6B
섹션 3 — 상대방 대기 중:  fromEmail=나, pending|accepted, color #9E8880
섹션 4 — 완료·반려·취소:  기본 접힘,                    color #3B6D11
```

---

## U10. 완료 알림 원칙 (🔲 미구현)

```
트리거: 수신자가 요청 할일 완료 처리 시
요청자: 토스트("{이름}님이 완료했습니다") + 배지 증가
구현: onSnapshot에서 accepted→completed 변경 감지, fromEmail===나 조건
```

---

## U11. 모바일 대응 원칙

```
터치 타겟: 최소 44px
hover 전용 UI (휴지통): 롱프레스로 대체
tooltip: tap → 표시 유지
```

---

*Updated: 2026.04.07 (신규 파일 — UX 원칙 분리)*
