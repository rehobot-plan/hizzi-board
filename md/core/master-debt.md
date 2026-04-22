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
7. (해제됨 · 세션 #55) 1-4 Codex 리뷰 대체 처리 — Codex 가용성 확정
   - 세션 #55 1순위 A에서 codex-companion.mjs review 서브커맨드 실측 — `/codex:review` 실행 성공, review-mo8myyuk-xguw9o(세션 #54 커밋 대상) + review-mo8npxmv-1k7fx2(세션 #55 Panel 수정 대상) 2회 완료
   - Panel.tsx P2·P3 지적 → 2eb2bf6 커밋으로 해소 확인. 이후 공장 1-4는 자체 구조 검증 대체 없이 정식 수행
   - 관찰 (블로커 아님, 이후 세션 확인 대상): Codex sandbox에서 PowerShell command 일부 declined (git grep·Select-String 등 보조 탐색 제한). 기능적 리뷰는 수행됨
   - Panel.tsx 회귀는 세션 #55 2eb2bf6으로 해소, flaky 2건(sidebar.spec.ts·request-badge.spec.ts)은 progress 선처리 큐 #3·#4로 이관
```

### #10 serviceAccount.json git history 잔존

근거: 세션 #58 push 시점 GitHub Secret Scanning이 `serviceAccount.json:1`을 감지. 최초 커밋 cceeaba(세션 초기) 이후 master에 평문 tracked 상태로 수개월 존재. 세션 #59에서 키 회전(revoke + 재발급) + `.gitignore` 추가 + `git rm --cached`로 위험 중립화 완료. 그러나 과거 커밋에 구 키는 여전히 평문으로 남음.

현재 처리: 키 회전으로 유출된 구 키는 GCP에서 사용 불가 상태. GitHub Secret Scanning은 오너가 bypass URL 허용 처리 완료. public repo에 과거 이력 남아있어도 실효적 악용 불가.

해소 방향: git-filter-repo 또는 BFG Repo-Cleaner로 과거 커밋에서 파일 완전 제거. 단, rewrite 시 모든 커밋 해시 변경되어 force push 필요 · backup 브랜치들도 재작성 · Vercel 배포 이력 연속성 영향 가능. 위험 중립화된 상태라 당장 급하지 않음. 깔끔함 우선시 시점에만 진행.

영향 범위: 전체 git history · backup/flatten-2026-04-22 브랜치
연동 MD: 없음
상태: open (우선순위 낮음)

### #9 harness.md §3 배포 게이트에 auto-deploy 트리거 검증 누락

근거: 세션 #58 실측. push 이후 Vercel이 webhook 수신·배포 트리거에 성공했는지 공정에서 검증하지 않음. 세션 #33~#56 장기 드리프트도 같은 구조적 공백에서 누적됐고, 세션 #58에서도 empty commit push가 GitHub Rules로 거부된 상태에서 auto-deploy 경로 자체를 실측할 수단이 없었음.

현재 처리: §3이 git push + vercel --prod 개별 성공만 체크. GitHub → Vercel webhook 파이프라인 상태는 공정 밖. 세션 #59에서 Deploy Hook 생성 및 수동 트리거 경로 확보 → **부분 해소**. 그러나 push 기반 자동 트리거의 실측 절차는 여전히 공정에 없음.

해소 방향: 1-6에 "push 후 30~60초 내 `vercel ls --yes`로 신규 배포 Row 생성 확인" 단계 추가. 생성 없으면 webhook 단절로 간주하고 오너 보고. 수동 CLI 배포로 폴백해도 불일치 기록.

영향 범위: md/core/harness.md §3 / md/core/session.md
연동 MD: harness.md · session.md
상태: open

### #8 post-request cascade 실패 시 divergence 가능성

근거: 세션 #56 Codex 리뷰 P2 2건.
  - TodoItem handleCheck — updatePost(completed=true) 성공 후 completeRequest 실패 시 post=완료 / request=accepted 분기 (pre-existing)
  - TodoItem handleDelete — deletePost 성공 후 cancelRequest 실패 시 post=deleted / request=accepted 분기 (블록 ② 신규)

현재 처리: flows.md 레이어 1 "각각 독립 try/catch + addToast" 원칙 하에 postStore·todoRequestStore 각 함수 내부 catch에서 addToast로 사용자 인지. 1층 토스트 실행 취소 탭 시에만 양쪽 복구 동기화.

위험: cascade 실패 + 사용자가 5초 내 실행 취소 미탭 시 불일치 상태 유지. 6명 팀 규모에선 빈도 낮으나 상대방이 대기 중인 요청 케이스는 체감 가능.

해소 방향: cascade 전면 재설계 시 writeBatch · runTransaction 도입 일괄 전환. 개별 handleCheck/handleDelete 수정은 설계 일관성 훼손으로 지양. flows.md 레이어 1 "연쇄 실패 기본 원칙" 자체의 개정 필요 여부 포함 재검토.

영향 범위: src/components/TodoItem.tsx handleCheck / handleDelete
연동 MD: flows.md 레이어 1
상태: open

### �� 성장 준비
```
- 공통 컴포넌트 분리 (R8.6 기준 — 신규 기능 개발 전 우선 적용)
  미구현 목록:
    🔲 AttachmentManager — 첨부파일 편집 UI (다중 업로드 전 필수)
    🔲 VisibilitySelector — 범위 선택
    🔲 TaskTypeSelector  — 구분 선택
    🔲 ModalShell        — M1 모달 껍데기
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
  - harness.md Phase 4 "전체 루프 첫 실행 테스트" 연계
- users 컬렉션 문서 ID 체계 통일 마이그레이션
  - 현재 8건 중 5건이 auth.uid와 불일치 (Firestore auto-ID 3건 + orphan_ 2건)
  - 2026.04.20 rules에 email 기반 허용(옵션 B) 임시 보완, 근본 해결은 ID 재생성 마이그레이션
  - 영향 범위: users doc 재작성 + page.tsx handleAssignPanel 참조 점검, signUp 경로는 이미 auth.uid 기반이라 신규 가입자는 안전
- [2026-04-20 #48 재확인] users 컬렉션 문서 ID 체계 3종 공존 (uid 3건 + auto-ID 3건 + orphan_ 2건). email 기반 rules 우회로 동작. 유사 표면화 2건 이상 누적 시 해결 트리거 발동.
- [2026-04-20 #48] Panel 명함 3분기 분기(둘 다 없음/한쪽만/둘 다) 단위 테스트 미도입. 현재 E2E 시나리오 4는 시드 독립 렌더 존재만 검증. 3분기 로직 검증은 Panel 단위 테스트 신설 세션으로 분리.
- [2026-04-20 #48] Vitest 러너 도입 시 npm install에서 24 vulnerabilities 감지 (critical 1 / high 5 / moderate 10 / low 8). devDependencies 범위라 프로덕션 번들 영향 없음. critical 1건 내역 확인 미완 — 확인 후 본 항목 갱신 또는 해소.
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
