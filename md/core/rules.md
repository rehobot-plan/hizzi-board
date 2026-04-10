# 히찌보드 — 코딩 규칙 & 실행 전 체크리스트

> **코드 작성 전 반드시 읽는다.**
> 상세 규칙(S1~S9): rules-detail.md 참조.

---

## 마스터 실행 전 체크리스트

> 코드 작성 전 확인한다. 30초면 끝난다. 몇 시간을 아낀다.

```
세션 게이트
□ /start-session을 실행하고 Preflight PASS를 확인했는가?

상태 전환
□ hizzi-flows.md에서 연쇄 요구사항을 확인했는가?
□ S2 필수 연쇄 처리 목록이 모두 처리됐는가?

에러 처리
□ 모든 catch에 addToast가 있는가?
□ 삭제 액션에 낙관적 업데이트가 적용됐는가?
□ 루프 비동기가 try/catch/finally로 감싸졌는가?

Firestore
□ undefined가 저장 전 제거됐는가?
□ 날짜 문자열이 로컬 시간 형식인가?
□ onSnapshot에서 createdAt null 문서를 필터링하는가?
□ 필드 삭제 시 deleteField() + updateDoc() 직접 호출하는가?

Store Listener (S9)
□ 새 store 추가 시 initXxxListener() 패턴으로 작성했는가?
□ 새 페이지 추가 시 필요한 listener를 useEffect([user?.email])에 등록했는가?

공통 컴포넌트 (R8.6)
□ 이미지 표시 시 ImageViewer 컴포넌트를 사용하는가?
□ 새 기능이 공통 컴포넌트 목록에 해당하는가?
□ 인라인 재구현 없이 공통 컴포넌트를 import했는가?

명령 블록
□ 안전 규칙 맨 앞?
□ 진행 여부 맨 끝?
□ 파일 수정 + commit + deploy 한 블록?
□ 배포 후 확인 항목 포함?
□ 30% 기준 전체/부분 교체 선택?
□ 부분 교체 시 대상 문자열 1회 등장 확인?
□ 전체 교체 시 @"..."@ here-string 사용?

타입
□ any 타입이 없는가?

설계 정확성
□ 조건에 사용된 값이 실제 파일에 존재하는가?
□ 리뷰 에이전트 경고를 실제 파일에서 확인했는가?
□ 새 기능 / 범용 도메인 버그에 외부 라이브러리 조사를 마쳤는가? (R4.9)

공개범위
□ 특정인 저장 시 author가 visibleTo에 포함되는가?
□ 표시 로직이 [], [author], [author, ...others] 세 가지를 처리하는가?
□ 수정 팝업이 생성 폼과 동일한 옵션을 제공하는가?

모달
□ useEscClose가 적용됐는가?
□ hover 레이어에 negative margin이 없는가?
□ overflow 안의 드롭다운에 Portal을 사용하는가?
```
