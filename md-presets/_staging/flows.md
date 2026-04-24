# 히찌보드 — 상태 흐름 맵

> **상태를 변경하는 기능을 설계하기 전에 반드시 읽는다.**
> 새 흐름 추가 순서: 레이어 1 → 레이어 2 → 레이어 3 → 코드 (역순 금지)
> 문서화되지 않은 연쇄 효과를 발견하면: 구현 전에 오너에게 보고한다.
> 레이어 2와 레이어 3은 항상 동기화한다 (둘 중 하나만 수정 금지)
> 전환별 상세 (레이어 3): flows-detail.md 참조.

---

## 레이어 1. 컬렉션 연쇄 규칙

> 어떤 컬렉션이 바뀌면 무엇이 따라 바뀌는가. 모든 상태 변경 전 이 테이블을 먼저 확인한다.
> 연쇄 실패 시 기본 원칙: 각각 독립 try/catch + addToast. 롤백 불가 케이스는 레이어 3에 개별 기술.

| 변경 대상 | 조건 | 연쇄 업데이트 |
|-----------|------|--------------|
| `posts.completed = true` | requestId 있을 때 | `todoRequests.status = 'completed'` |
| `posts.completed = false` | requestId 있을 때 | `todoRequests.status = 'accepted'` |
| `posts.deleted = true` | requestId 있을 때 | `todoRequests.status = 'cancelled'` |
| `todoRequests.status = 'accepted'` | 항상 | `posts` 생성 |
| `todoRequests.status = 'accepted'` | dueDate 있을 때 | `calendarEvents` 생성 |
| `todoRequests.status = 'accepted'` | teamRequestId 있을 때 | `calendarEvents` 중복 생성 방지 |
| `posts.visibleTo` 변경 | 항상 | 연쇄 없음 (단독 업데이트) |
| `posts.starred` 변경 | 항상 | 연쇄 없음 (단독 업데이트) |
| `leaveEvents.confirmed` 변경 | 항상 | 연쇄 없음 (단독 업데이트) |
| `todoRequests.status` 전환 (모든 전환) | 항상 | `comments` system 문서 자동 생성 |
| `todoRequests.status = 'cancel_requested'` | 항상 | 연쇄 없음 (단독 업데이트) |
| `todoRequests.status = 'cancelled'` (from cancel_requested) | 관련 posts 존재 시 | `posts.deleted = true` |
| `comments` 생성 | 항상 | 관계자 seenAt 비교 기준 M 증가 |
| `comments` 삭제 | requestId 있을 때 | 연쇄 없음 (hard delete) |
| `posts.deleted = false` (복구) | requestId 있고 직전 상태 있을 때 | `todoRequests.status = 직전 상태 (pending/accepted)` |
| `posts.completed = false` (완료 복구) | requestId 있을 때 | `todoRequests.status = 'accepted'` |

---

## 레이어 2. 유효 상태 전환 테이블

> 허용된 전환만 구현한다. 이 테이블에 없는 전환은 오너 승인 후 추가한다.

| 컬렉션 | 현재 상태 | 전환 가능 상태 | 트리거 | 구현 상태 |
|--------|-----------|---------------|--------|-----------|
| todoRequests | pending | accepted | 수신자 수락 | ✅ |
| todoRequests | pending | rejected | 수신자 반려 | ✅ |
| todoRequests | pending | cancelled | 요청자 취소 | ✅ |
| todoRequests | accepted | completed | 담당자 완료처리 | ✅ |
| todoRequests | accepted | cancel_requested | 요청자 취소 요청 | ✅ |
| todoRequests | cancel_requested | cancelled | 담당자 취소 승인 | ✅ |
| todoRequests | cancel_requested | accepted | 담당자 취소 거부 | ✅ |
| todoRequests | completed | accepted | 담당자 완료 취소 | ✅ |
| posts | active | completed | 체크박스 클릭 | ✅ |
| posts | completed | active | 체크 해제 / 1층 토스트 복구 / 2·3층 지난 완료 복원 | ✅ |
| posts | active | deleted | 좌←우 스와이프 삭제 (구: 휴지통 아이콘) | ✅ |
| posts | deleted | active | 1층 토스트 복구 (5초) / 2층 최근 삭제 링크 / 3층 휴지통 탭 | ✅ |
| posts | any | visibleTo 변경 | 수정 팝업 저장 | ✅ |
| posts | any | starred 변경 | 별 클릭 | ✅ |
| leaveEvents | registered | confirmed | 관리자 확정 | ✅ |
| leaveEvents | registered | locked | isPastOrToday = true | ✅ |
| leaveRequests | — | pending | 신청 | 🔲 미구현 |
| leaveRequests | pending | approved | 관리자 승인 | 🔲 미구현 |
| leaveRequests | pending | rejected | 관리자 반려 | 🔲 미구현 |
| comments | — | created | 댓글 작성 | ✅ |
| comments | created | deleted | 댓글 삭제 (user만) | ✅ |
