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

### #13 session.md 단계 5·11 보강 — 해소 (세션 #62 식별 · 세션 #63 첫 작업 · 커밋 4d73f4d)

범위 (해소):
- 단계 5 테이블 셀: "산출물 '수정 MD' 목록은 실행 완료분(커밋된 것)만 포함 — 기획 논의·계획만 된 항목은 '계획 but 미반영' 라인으로 분리 표기" 조항 신규
- 단계 11 테이블 셀: "프리셋 트리거 실행 전 대상 MD 각각의 mtime·파일 말미 타임스탬프를 Code가 확인해 세션 말 기대 상태와 괴리 없음을 보고 → 트리거 실행" 조항 신규
- 2 "제약" 섹션 2줄 append:
  · 단계 5 교차 검증 규칙 (MEMORY #61-c·#62-a)
  · 단계 11 복사 직전 검증 + 괴리 시 복사 중단·오너 보고 (MEMORY #62-d)

근거:
- 세션 #61 drift 사고 (progress 산출물 "수정 MD" 기록 ≠ 실제 저장소 반영 · MEMORY #61-c 자기 위반)
- 세션 #62 3/4 uxui 누락 사고 (복구 세션 중에도 동일 패턴 재연 · MEMORY #62-d Code 교차 검증 첫 사례)
- 두 사고 모두 "기획 논의 = 완료 기록" 구조 틈에서 발생 · 세션 길이와 무관

이관 사유 (완료):
- 세션 #62에서 사고 복구 완료 후 구조 보강은 self-modification 회피 원칙(MEMORY #62-c)으로 세션 #63 이관
- 세션 #63 첫 작업으로 처리 완료

영향 범위: md/core/session.md
연동 MD: session.md · MEMORY #61-c · #61-f · #62-a · #62-d
상태: 해소 (2026-04-23 · 세션 #63 · 커밋 4d73f4d)

### #12 DevTools Performance 녹화 워크플로우 미수립

근거: 세션 #61 실 Chrome ⋯ handle 클릭 scroll jump 재현 지속 상태에서 Playwright 가상 mouse로는 재현 실패. 실 브라우저 특이 동작 원인 규명이 필요할 때 오너 수동 녹화 외 경로가 공정에 없음.

현재 처리: 능동 scroll 정렬(Phase 1)로 사용자 체감 해소 · 근본 원인은 #11로 박제.

해소 방향: 표준 녹화 절차 문서화 (Chrome DevTools Performance 탭 · Record · 재현 · Stop · Scripting/Layout/Network 캡처 범위). harness.md 막힘 탈출구 섹션 또는 신규 md/ops/ 하위 문서로 편입 검토. Playwright trace view와 비교 기준도 함께 정리.

영향 범위: md/core/harness.md · 신규 ops 문서
연동 MD: harness.md
상태: open · #11 해소의 선결

### #11 실 Chrome ⋯ handle 클릭 scroll jump 근본 원인 미규명

근거: 세션 #61에서 handle 클릭 시 페이지 스크롤이 위로 튐 · 튄 채 유지되는 현상 오너 실 Chrome 재현. 5층 방어(overflow-anchor:none · onMouseDown preventDefault · intentScrollYRef · 400ms scroll event intercept · scrollTo instant + scroll-behavior:auto) 배포 후에도 재현 지속. Playwright mouse.move/down/up 분리 실측에서 모든 phase scrollY 변화 0 → 가상 mouse로는 재현 실패.

현재 처리: 접근 전환으로 사용자 체감 해소 — scrollIntoView({block:'start'}) + scroll-margin-top:80px 능동 scroll 정렬(main-ux.md 1.2b). 오너 실측 "아주 깔끔해 · 원하는대로 됐어" 확인. 기존 5층 방어는 능동 scroll 비활성 경로에서 유지(제거 없음).

위험: 원인 미규명 상태 · 능동 scroll은 마스킹일 수 있음. Chrome 버전·환경 변화 시 재발 가능. 능동 scroll이 새 jump 유발 가능성 있으며, 악화 시 localStorage 'hizzi:activeScrollDisabled'='true'로 즉시 롤백 경로 확보.

해소 방향: #12 DevTools Performance 녹화 워크플로우 수립 후 클릭 순간 호출 스택 포착 · 원인 특정. 원인 격리 이후 능동 scroll 단순화 또는 방어 계층 축소 판단.

영향 범위: src/components/Panel.tsx toggleExpand · main-ux.md 1.2b / 1.2c
연동 MD: main-ux.md · ux-principles.md U13 · patterns.md P8
상태: open · #12 선결 필요

### #10 serviceAccount.json git history 잔존

근거: 세션 #58 push 시점 GitHub Secret Scanning이 `serviceAccount.json:1`을 감지. 최초 커밋 cceeaba(세션 초기) 이후 master에 평문 tracked 상태로 수개월 존재. 세션 #59에서 키 회전(revoke + 재발급) + `.gitignore` 추가 + `git rm --cached`로 위험 중립화 완료. 그러나 과거 커밋에 구 키는 여전히 평문으로 남음.

현재 처리: 키 회전으로 유출된 구 키는 GCP에서 사용 불가 상태. GitHub Secret Scanning은 오너가 bypass URL 허용 처리 완료. public repo에 과거 이력 남아있어도 실효적 악용 불가.

해소 방향: git-filter-repo 또는 BFG Repo-Cleaner로 과거 커밋에서 파일 완전 제거. 단, rewrite 시 모든 커밋 해시 변경되어 force push 필요 · backup 브랜치들도 재작성 · Vercel 배포 이력 연속성 영향 가능. 위험 중립화된 상태라 당장 급하지 않음. 깔끔함 우선시 시점에만 진행.

영향 범위: 전체 git history · backup/flatten-2026-04-22 브랜치
연동 MD: 없음
상태: open (우선순위 낮음)

### #9 harness.md 3 배포 게이트에 auto-deploy 트리거 검증 누락

근거: 세션 #58 실측. push 이후 Vercel이 webhook 수신·배포 트리거에 성공했는지 공정에서 검증하지 않음. 세션 #33~#56 장기 드리프트도 같은 구조적 공백에서 누적됐고, 세션 #58에서도 empty commit push가 GitHub Rules로 거부된 상태에서 auto-deploy 경로 자체를 실측할 수단이 없었음.

현재 처리: 3이 git push + vercel --prod 개별 성공만 체크. GitHub → Vercel webhook 파이프라인 상태는 공정 밖. 세션 #59에서 Deploy Hook 생성 및 수동 트리거 경로 확보 → **부분 해소**. 세션 #60에서 push → auto-deploy 실측 사례 1건 확인(`i42koin1y` 자동 빌드 정상, Git 재연결 + Deploy Hook 조합 정상 작동). 그러나 push 기반 자동 트리거의 실측 절차를 공정에 명시 단계로 편입하는 작업은 여전히 미완.

해소 방향: 1-6에 "push 후 30~60초 내 `vercel ls --yes`로 신규 배포 Row 생성 확인" 단계 추가. 생성 없으면 webhook 단절로 간주하고 오너 보고. 수동 CLI 배포로 폴백해도 불일치 기록.

영향 범위: md/core/harness.md 3 / md/core/session.md
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
- [2026-04-23 #61] Panel.tsx 기존 transition 토큰 정합 — `transition: "background 0.2s, border 0.2s"` 등 0.2s + ease 키워드 누락 복수 존재. uxui.md 통일 규칙 0.15s ease로 정돈 필요. Codex #61 P3 박제.
- [2026-04-23 #61] ⋯ handle z-index 매직넘버(3) 토큰화 필요. tokens.ts zIndex 계층(panel:10 등)과 정렬. Codex #61 P3 박제.
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

### #14 authStore reload 부작용 — admin 잠재 버그

근거: [2026-04-23 세션 #65] E2E 셋업 중 반복 page.goto가 재현 조건 제공. authStore.onAuthStateChanged가 page reload마다 clearAdminPanelOwnership을 재호출.

현상: admin 로그인 상태에서 새로고침·새 탭 오픈 시 패널 ownership(seed)이 null로 리셋될 여지.

영향 범위: src/store/authStore.ts · onAuthStateChanged 콜백 · clearAdminPanelOwnership 호출 조건

감지 경로: 세션 #65 E2E 셋업 중 `loginAsAdmin → page.goto('/')` 반복 호출이 매번 onAuthStateChanged를 재발동시키면서 seed 패널의 ownerEmail이 반복 null로 리셋. 수동 사용에서는 드물게 재현되는 조건이라 미발견.

회피: E2E는 loginAsAdmin 후 추가 page.goto 금지 + ensureAdminPanel 타이밍 조정으로 우회.

해소 방향: onAuthStateChanged 콜백 조건 재검토 — 첫 인증 이벤트와 reload 시 재발 이벤트 구분. `clearAdminPanelOwnership`을 signIn 직접 경로에서만 호출하고 onAuthStateChanged 콜백에서는 제거하거나, admin 패널 리셋이 이미 완료된 상태면 skip하는 가드 추가.

연동 MD: 세션 #66 1순위 진입 시 session.md 프리셋에 src/store/authStore.ts 포함
상태: open (세션 #66 1순위 · E2E 우회로 회귀 감지만 차단)

### #15 Next 14.2.35 로컬 dev OpenTelemetry clientModules TypeError

근거: [2026-04-24 세션 #70] 블록 ③-B chat-input fix E2E 1-5 로컬 실행 중 dev server(npm run dev) 응답 전 route가 OpenTelemetry clientModules TypeError로 서버 에러 페이지 반환. chat-input-s6 24 케이스 전부 Pouncing 상태 고착 관측.

회피: 프로덕션 배포(vercel --prod) 후 BASE_URL=hizzi-board.vercel.app으로 E2E 실행 → 24/24 PASS (커밋 2833ccb 배포본 기준).

해소 방향 후보: (a) next 14.2.x 버전 bump로 OpenTelemetry 관련 패치 수용 (b) .next 캐시 전량 삭제 + reinstall 재현 여부 확인 (c) experimental/instrumentation 설정 검토.

상태: open (관측만 · 프로덕션 배포 영향 없음 · 로컬 E2E 경로 차단)
