# 히찌보드 — 알려진 버그 이력

> master.md에서 분리. 버그 해결 시 이력 추가.

---

| 버그 | 근본 원인 | 수정 방법 |
|------|-----------|-----------|
| 할일 완료가 요청 탭에 미반영 | todoRequests status 미업데이트 | completeRequest() 추가 |
| 완료 취소 미반영 | reactivateRequest 누락 | reactivateRequest() 추가 |
| 캘린더 클릭 시 추가 팝업 열림 | stopPropagation 무시 | data-event="true" + closest() |
| 팀 요청 캘린더 중복 생성 | 수신자마다 acceptRequest 호출 | teamRequestId 중복 방지 |
| undefined Firestore 저장 | 선택 필드 그대로 저장 | stripUndefined 처리 |
| 드롭다운 overflow 클리핑 | overflow:auto 부모 체인 | createPortal + position:fixed |
| 삭제된 post 재표시 | onSnapshot 경쟁 조건 | deletePost 낙관적 업데이트 |
| 메모 탭 레이아웃 깨짐 | PostItem hover margin:0 -20px | margin 제거, inset:0 사용 |
| 특정인이 나만으로 표시 | length===1 조건 오류 | length===1 && [0]===author → 나만 |
| editContent 저장 안 됨 | handleEditSave에서 editTitle만 저장 | content: editContent로 수정 |
| 첨부파일 신규 추가 저장 안 됨 | !post.attachment 분기 누락 | 신규 추가 분기 추가 |
| dueDate Invalid Date | YYYYMMDD 형식 그대로 파싱 | YYYY-MM-DD 변환 후 파싱 |
| 이미지 할일 제목 안 보임 | renderContent가 img만 반환 | 제목+이미지 함께 반환 |
| page.tsx 한글 깨짐 | PowerShell Set-Content 인코딩 오류 | 전체 교체 + UTF8 명시 |
| 로그인 직후 Panel 1/2/3 표시 | panelStore 모듈 최상위 즉시실행 | initPanelListener 패턴 전환 |
| 로그인 직후 From admin 표시 | userStore 동일 원인 | initUserListener 패턴 전환 |
| 연차 페이지 새로고침 Loading 멈춤 | leaveStore 동일 원인 | initLeaveListener + 컴포넌트 게이트 |
| 연차 입사일 공란 / 설정저장 무반응 | page.tsx에 initLeaveListener 누락 | page.tsx useEffect에 cleanup5 추가 |
| 메모 이미지 클릭 시 팝업 열림 | 클릭 레이어 zIndex 충돌 | 루트 div onClick으로 전환 |
| 할일 이미지 클릭 시 팝업 열림 | 동일 원인 | 동일 해결 |
| ESC 미작동 | window.__escStack 번들 미반영 추정 | 다음 세션 확인 필요 |

---

### TodoRequestModal cancel_requested 상태 누락 (P3 · 별 세션 처리)

- 봉투 4탭 분류: 받은=pending only · 보낸=pending only · 진행 중=accepted only · 완료=rejected+cancelled+completed → cancel_requested 어느 탭에도 미포함, 사용자 시야에서 사라짐
- src/components/request/RequestList.tsx STATUS_CONFIG에는 정의되어 MY DESK 요청 탭에선 표시 (받은/보낸 리스트 안에 한 줄)
- 영향: cancel_requested 단계의 요청이 봉투 모달에서 추적 불가
- 우선순위: cancel_requested 발생 빈도가 낮아 P3 — 별 세션 처리
