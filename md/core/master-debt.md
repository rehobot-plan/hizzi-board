# 히찌보드 — 기술 부채 트래커

> master.md에서 분리. 세션 종료 시 갱신 대상.

---

### ✅ 해결됨
| 날짜 | ��목 |
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
| 2026.04.06 | CreatePost 3탭 재설계 (할��/메모/요청 고정) |
| 2026.04.06 | 할일 title/content 분리 (Phase 3 선행) + 하위호환 |
| 2026.04.06 | Post 타입 dueDate/title 필드 추가 |
| 2026.04.06 | CreatePost 헤더 실시간 제목 반영 |
| 2026.04.06 | 기한 yyyymmdd + 달력 아이�� (할일/요청) |
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
| 2026.04.07 | MD 전면 재작업 — 한글화 / 7파일 체계 확립 |
| 2026.04.08 | PostItem: P8 키-값 테이블형 팝업 교체 |
| 2026.04.08 | PostItem: editContent 저장 버그 수정 |
| 2026.04.08 | PostItem: ���부파일 deleteField 처리 + 신규 추가 분기 |
| 2026.04.08 | PostItem: 첨부파일 UI 열기/삭제 통일 (교체 제거) |
| 2026.04.08 | TodoItem: P8 일반 할일 팝업 키-값 테이블형 교체 |
| 2026.04.08 | TodoItem: dueDate YYYYMMDD → YYYY-MM-DD 변환 |
| 2026.04.08 | TodoItem: 이미지 할일 제목+이미지 함께 표시 |
| 2026.04.08 | TodoItem: 캘린더 등록 체크박스 항상 표시 + 중복 확인 |
| 2026.04.08 | TodoItem: 첨부파��� 열기/삭제 UI 통일 |
| 2026.04.08 | page.tsx: 한글 인코딩 전면 복원 |
| 2026.04.08 | users 컬렉션 6명 + 관리자 Firestore 재삽입 |
| 2026.04.08 | panelStore: initPanelListener 패턴 전환 |
| 2026.04.08 | userStore: initUserListener 패턴 전환 |
| 2026.04.08 | leaveStore: initLeaveListener 패턴 전환 |
| 2026.04.08 | 로그인 직후 stale 렌더 구조적 해결 |
| 2026.04.08 | 연차 페이지 새로고침 Loading 멈춤 해결 |
| 2026.04.08 | LeaveManager leaveLoading 게이트 추가 |
| 2026.04.08 | page.tsx: initLeaveListener 추가 |
| 2026.04.08 | PostItem.tsx → PostEditModal.tsx 분리 |
| 2026.04.08 | TodoItem.tsx → TodoEditModal.tsx + TodoOrderModal.tsx 분리 |
| 2026.04.08 | ImageViewer 공통 컴포넌트 생성 (src/components/common/ImageViewer.tsx) |
| 2026.04.08 | useEscClose 전역 스택 방식으로 재설계 (window.__escStack) |
| 2026.04.08 | postStore: attachments 배열 스키마 확장 + normalizeAttachments |
| 2026.04.08 | PostItem: attachments 다중 렌더링 적용 |
| 2026.04.08 | TodoItem: attachments 다중 렌더링 적용 |

### 🔴 진행 중 (다음 세션)
```
0. 새 세션 시작 워크플로우 구축
   - Claude.ai가 오늘 대화 주제를 듣고 "최초 로드 MD" 결정
   - 대화 진행하며 "추가로 필요한 MD" 자동 추천
   - 세팅 완료 후 본 대화 시작하는 흐름 설계
   - 다음 세션 최우선 작업
1. ESC 닫기 미작동
   - 원인 추적: window.__escStack 번들 반영 여부 확인 필요
   - 다음 세션 시작 시: console.log(window.__escStack, window.__escListenerRegistered) 먼저 확인
   - PostItem ImageViewer 교체 완료했으나 ESC 미작동 상태
2. 첨부파일 다중 업로드 — AttachmentManager 공통 컴포넌트 먼저 생��� 후 적용 (R8.6)
   - 영향 파일: PostEditModal / TodoEditModal / CreatePost
3. 캘린더 자동 등록 연동 검증
4. TodoRequestModal 섹션 구조 재편
5. 댓글 기능 (todoRequests/{id}/comments)
6. 완료 알림 토스트
```

### �� 성장 준비
```
- 공통 컴포넌트 분리 (R8.6 기준 — 신규 기능 개발 전 우선 적용)
  미구현 목록:
    🔲 AttachmentManager — 첨부파일 편집 UI (다중 업로드 전 필수)
    🔲 VisibilitySelector — 범위 선택
    🔲 TaskTypeSelector  — 구분 선택
    🔲 ModalShell        — P8 모달 껍데기
    🔲 DueTag            — 기한 뱃지
    🔲 TagBadge          — 카테고리·범위 뱃지
    🔲 UserChip          — 팀원 선택 칩
- 공통 Firestore save helper (stripUndefined 자동화)
- 언마운트 시 realtime listener 정리 확인
- 공통 훅 추가: useFileUpload / useIsMobile / useCanEdit
- Claude Code 안전 명령 화이트리스트 설정
  - 조사/읽기 전용(find/ls/wc/cat/Get-Content/git status/Test-Path)은 .claude/settings.json에 영구 등록
  - 빌드/커밋은 세션 허용
  - 삭제/배포/하네스 수정은 항상 수동 확인
  - 현재 매번 Yes 눌러야 해서 흐름 끊김
- 하네스 외부 Codex 검열 루프 실전 테스트
  - /codex:adversarial-review, /codex:review, /codex:rescue 설정만 있고 실제 검열 미적용
  - session-harness.md Phase 4 "전체 루프 첫 실행 테스트" 연계
```

### 🟢 장기 (Rehobot 전)
```
- 전체 색상 토큰 CSS custom properties로 전환
- TypeScript strict mode (any 제거 완료 후)
- Calendar "편집" → "수정" 텍스트
- 특정인 hover tooltip 미작동 버그
- 멀티데이 이벤트 수정/전체삭제
- 완료된 할일 / 삭제된 할일 / 삭제된 메모 관리 UX 개선
```
