# 히찌보드 — 로그북

> 작업 이력 · 기술 부채 · 버그 이력 보관소.
> 필요할 때만 세션에 첨부한다.

---

## 작업 이력

### 2026.03.25 – 04.05
Initial commit ~ MD 구조 확립 / Panel 리팩터 / 메모 UX / any 제거 / error handling 통일

### 2026.04.06 오전 — UX 설계 + 구현
Panel 필터 바 / 패널명 / 태그 3분류 / 별 opacity / 좌측 띠 / 할일 아이템 구조 전면 개편
일반 할일 상세/수정 팝업 / 요청 할일 업무상세 팝업 / 팝업 UX 통일 설계 확정

### 2026.04.06 오후 — CreatePost/PostItem/TodoList 개편
CreatePost 3탭 재설계 / 할일 title/content 분리 / dueDate 필드 추가
기한 yyyymmdd + 달력 아이콘 / 캘린더 등록 체크박스 / 요청 범위 3종
TodoList 필터링·정렬 수정 / 삭제된 메모 복구 버튼

### 2026.04.07 — TodoItem / CreatePost / MD 정비
TodoItem: 일반 할일 팝업 기한+캘린더 / 요청 할일 삭제 버튼 (cascade) / any 타입 제거
MD 전면 재작업 / 3파일 분리 / 단일 책임 구조 확립

### 2026.04.08 — 팝업 통일 + 버그 수정 + 인코딩 복원
PostItem: P8 키-값 테이블형 팝업 완성 / editContent 버그 / 첨부파일 전체 정비
TodoItem: P8 키-값 테이블형 팝업 완성 / dueDate 형식 / 이미지 제목 / 캘린더 중복 확인
page.tsx: 한글 인코딩 전면 복원
users: Firestore 6명 + 관리자 재삽입

### 2026.04.08 — MD 전면 개편
세션 프롬프트 조직도 구조 재편 / 프롬프트 경량화
hizzi-log.md 신규 생성 / 이력·부채·버그 이관
page.tsx: initPostListener + initRequestListener auth 확정 후 실행으로 수정

---

## 기술 부채 트래커

### ✅ 해결됨
| 날짜 | 항목 |
|------|------|
| 2026.04.03 | useEscClose — 전체 모달 ESC 핸들러 |
| 2026.04.05 | Panel.tsx 분리 → TodoList / CompletedTodo / PostList |
| 2026.04.05 | deletePost 낙관적 업데이트 (ghost 재렌더 수정) |
| 2026.04.05 | PostItem / TodoItem editVisibility: author 확인 + specific 옵션 |
| 2026.04.05 | CreatePost: specific visibleTo에 author 포함 |
| 2026.04.05 | 에러 처리: 모든 catch → addToast 통일 |
| 2026.04.05 | any 제거: PostUpdates / NewTodoRequestDoc 등 전체 |
| 2026.04.05 | toastStore: { message, type } 객체 수신 확장 |
| 2026.04.05 | useVisibilityTooltip 훅: PostItem / TodoItem |
| 2026.04.05 | postStore addPost 낙관적 업데이트 + pending 문서 방어 |
| 2026.04.05 | 메모 soft delete + 삭제된 메모 섹션 |
| 2026.04.05 | PostItem 태그 표시 (업무/개인, 전체/나만/특정인) |
| 2026.04.06 | CreatePost 3탭 재설계 (할일/메모/요청 고정) |
| 2026.04.06 | 할일 title/content 분리 (Phase 3 선행) + 하위호환 |
| 2026.04.06 | Post 타입 dueDate/title 필드 추가 |
| 2026.04.06 | CreatePost 헤더 실시간 제목 반영 |
| 2026.04.06 | 기한 yyyymmdd + 달력 아이콘 (할일/요청) |
| 2026.04.06 | 캘린더 등록 체크박스 (할일 탭) |
| 2026.04.06 | 요청 범위 3종 (요청자+수신자/전체공개/특정) |
| 2026.04.06 | TodoList activeFilter 필터링 수정 |
| 2026.04.06 | 할일 정렬 기준 적용 |
| 2026.04.06 | PostItem 메모 아이템 할일 패턴 통일 |
| 2026.04.06 | 삭제된 메모 복구 버튼 (PostList) |
| 2026.04.07 | TodoItem 일반 할일 팝업 기한 + 캘린더 등록 추가 |
| 2026.04.07 | TodoItem 요청 할일 팝업 삭제 버튼 (cascade) |
| 2026.04.07 | (post as any).dueDate → post.dueDate 타입 정리 |
| 2026.04.07 | CreatePost 캘린더 아이콘 hover 색상 활성화 |
| 2026.04.08 | PostItem: P8 키-값 테이블형 팝업 교체 |
| 2026.04.08 | PostItem: editContent 저장 버그 수정 |
| 2026.04.08 | PostItem: 첨부파일 deleteField 처리 + 신규 추가 분기 |
| 2026.04.08 | PostItem: 첨부파일 UI 열기/삭제 통일 |
| 2026.04.08 | TodoItem: P8 일반 할일 팝업 키-값 테이블형 교체 |
| 2026.04.08 | TodoItem: dueDate YYYYMMDD → YYYY-MM-DD 변환 |
| 2026.04.08 | TodoItem: 이미지 할일 제목+이미지 함께 표시 |
| 2026.04.08 | TodoItem: 캘린더 등록 체크박스 항상 표시 + 중복 확인 |
| 2026.04.08 | TodoItem: 첨부파일 열기/삭제 UI 통일 |
| 2026.04.08 | page.tsx: 한글 인코딩 전면 복원 |
| 2026.04.08 | users 컬렉션 6명 + 관리자 Firestore 재삽입 |
| 2026.04.08 | page.tsx: initPostListener + initRequestListener auth 확정 후 실행 |

### 🟡 성장 준비
```
- 공통 Firestore save helper (stripUndefined 자동화)
- 언마운트 시 realtime listener 정리 확인
- 공통 훅 추가: useFileUpload / useIsMobile / useCanEdit
```

### 🟢 장기 (Rehobot 전)
```
- 전체 색상 토큰 CSS custom properties로 전환
- TypeScript strict mode (any 제거 완료 후)
- 멀티데이 이벤트 수정/전체삭제
```

---

## 버그 이력

| 버그 | 근본 원인 | 수정 방법 | 상태 |
|------|-----------|-----------|------|
| 할일 완료가 요청 탭에 미반영 | todoRequests status 미업데이트 | completeRequest() 추가 | ✅ |
| 완료 취소 미반영 | reactivateRequest 누락 | reactivateRequest() 추가 | ✅ |
| 캘린더 클릭 시 추가 팝업 열림 | stopPropagation 무시 | data-event="true" + closest() | ✅ |
| 팀 요청 캘린더 중복 생성 | 수신자마다 acceptRequest 호출 | teamRequestId 중복 방지 | ✅ |
| undefined Firestore 저장 | 선택 필드 그대로 저장 | stripUndefined 처리 | ✅ |
| 드롭다운 overflow 클리핑 | overflow:auto 부모 체인 | createPortal + position:fixed | ✅ |
| 삭제된 post 재표시 | onSnapshot 경쟁 조건 | deletePost 낙관적 업데이트 | ✅ |
| 메모 탭 레이아웃 깨짐 | PostItem hover margin:0 -20px | margin 제거, inset:0 사용 | ✅ |
| 특정인이 나만으로 표시 | length===1 조건 오류 | length===1 && [0]===author → 나만 | ✅ |
| editContent 저장 안 됨 | handleEditSave에서 editTitle만 저장 | content: editContent로 수정 | ✅ |
| 첨부파일 신규 추가 저장 안 됨 | !post.attachment 분기 누락 | 신규 추가 분기 추가 | ✅ |
| dueDate Invalid Date | YYYYMMDD 형식 그대로 파싱 | YYYY-MM-DD 변환 후 파싱 | ✅ |
| 이미지 할일 제목 안 보임 | renderContent가 img만 반환 | 제목+이미지 함께 반환 | ✅ |
| page.tsx 한글 깨짐 | PowerShell Set-Content 인코딩 오류 | 전체 교체 + UTF8 명시 | ✅ |
| 로그인 직후 첫 화면 stale 데이터 | initPostListener auth 전 실행 | useEffect 의존성 user?.email로 수정 | 🔲 검증 필요 |
| Calendar "편집" → "수정" 텍스트 | — | — | 🔲 |
| 특정인 hover tooltip 미작동 | — | — | 🔲 |
| leaveViewPermission users 재삽입으로 초기화 | — | — | 🔲 |

---

*Updated: 2026.04.08 (신규 생성 — 작업 이력·기술 부채·버그 이력 master.md에서 이관)*
