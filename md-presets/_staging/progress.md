# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-21 세션 #56 (블록 ② 구현 완료 · 배포 보류 · 로컬 git 저장소 손상 인지 박제)
- 작업 브랜치: master (로컬만 · 원격 미반영)
- 진행 중: 블록 ② 배포 (세션 #57 이연)
- 다음 세션 1순위: 인프라 복구 (단일 세션 목표)
  · 범위: 새 폴더 fresh clone → 워킹 트리 파일 복사 → 단일 누적 commit → push → Vercel 확인 → harness.md §3 배포 명령에 git push 편입 → 손상 저장소 격리 rename
  · 근거: 로컬 git missing blob aa5e27561e362c1db0b8b391ef1e7e22d133ec48 + GitHub 원격 d39f828 드리프트(세션 #33~#56 미반영)
  · 백업 위치: .harness/patches-session-56/ (head-only patch · working-tree-snapshot.tar.gz · SESSION-56-INFRA-REPORT.md)
  · Dropbox 복제본도 동일 내용 보존
  · 복구 후 블록 ② 배포 → 블록 ③ 진입
- 후순위 후보: 세션 #55 기준 1~6 유지 (인프라 복구 완료 후 재활성)
- 선처리 큐: 세션 #55 기준 #1~#4 유지 + #5 신규
  5. tabbar-sticky.spec 전체 smoke 직렬 실행 시 간헐 timeout (세션 #56 신규)
     · 격리 반복 30/30 PASS · git diff 영향 경로 0 · flaky 확정
     · 원인 후보: dev server warm-up / beforeAll 로그인 타임아웃 편차 / 순차 86 스펙 중간 resource pressure
- 미해결:
  - 로컬 git 저장소 missing blob (세션 #57 인프라 복구로 해소 예정)
  - GitHub 원격 드리프트 23세션 분량 (세션 #57 인프라 복구로 해소 예정)
  - post-request cascade 실패 시 divergence 가능성 — master-debt #8 등록 대기 (세션 #57 누적 commit 시 편입)

---

## 작업로그 (날짜/세션 단위 append — 삭제 금지)

> 세션 #1~#12 아카이브: md/archive/progress-2026-04-A.md
> 세션 #13~#23 아카이브: md/archive/progress-2026-04-B.md
> 세션 #24~#32 아카이브: md/archive/progress-2026-04-C.md
> 세션 #33~#34 아카이브: md/archive/progress-2026-04-D.md
> 세션 #35~#42 아카이브: md/archive/progress-2026-04-E.md
> 세션 #43~#46 아카이브: md/archive/progress-2026-04-F.md 및 md/archive/progress-2026-04-G.md
> 세션 #47 아카이브: md/archive/progress-2026-04-H.md
> 세션 #48 아카이브: md/archive/progress-2026-04-I.md
> 세션 #49 아카이브: md/archive/progress-2026-04-J.md
> 세션 #50 아카이브: md/archive/progress-2026-04-K.md
> 세션 #51 아카이브: md/archive/progress-2026-04-L.md
> 세션 #52 아카이브: md/archive/progress-2026-04-M.md
> 세션 #53 아카이브: md/archive/progress-2026-04-N.md

### [2026-04-21] 세션 #54 — 메인 UX §1 패널 높이 + §2 블록 ① 데이터 레이어 · 오염 인지 마감

Phase: 메인 UX §1 패널 높이 구현 / §2 블록 ① postSelectors 24h 창 데이터 레이어 / Claude.ai 허구 전제 생성 감지로 오염 인지 마감
브랜치: master
커밋 수: 4건 (3afd522·499b46b·c707498 + 프리셋 3bb3d19)

배경:
- 세션 #53 종료 시점 1순위 "메인 UX §1 패널 높이 구현" 진입
- 세션 #54 중 Claude.ai가 Code로부터 받은 완료 보고(커밋 해시·Vitest·회귀·배포 URL 포함)를 검증 없이 사실로 수용
- 허구 전제 위에 session-54-close.md 파일 + 12단계 통합 제안 생성. 파일은 실제 저장소에 반영되지 않음 (오너 저장소 find·Glob 0 hit 확인)
- 오너 저장소 확인으로 불일치 드러남 — session-54-close.md 부재, [5]·[11]·[12] 미실행, 작업로그 #54 블록 부재
- 본 세션 #54 마감은 다음 세션에서 Code 저장소 실측 보고 2회(1차 13항목 · 2차 5항목) 기반으로 수행

주요 변경:

1. §1 패널 높이 (3afd522)
   · Panel.tsx maxHeight: panelTokens.height.max (L147)
   · tokens.ts panel 섹션 (L103·L105) — height.max min(600px, 70vh), min 240px
   · globals.css .panel-scroll 5 규칙 (L75·L79·L83·L88·L91) — 기본/webkit/thumb/hover/track
   · 검증: 커밋 메시지상 "토큰 경로 일관 + 빌드 + 단위 31/31"
   · 1-4 Codex 리뷰 수행 기록 없음 (master-debt #7 영향권)
   · 1-5 E2E 아티팩트 저장 없음 (test-results/·playwright-report/ 내 §1 관련 콘텐츠 부재, 세션 대화 로그상 "3 passed (20.6s)" 출력만 확인)
   · tests/smoke/panel-height-s1.spec.ts 신규 포함

2. §1 progress 반영 (499b46b)
   · 공장 1-6이 progress.md 현재상태·작업로그 한 줄 갱신

3. §2 블록 ① 데이터 레이어 (c707498)
   · src/lib/postSelectors.ts — HOUR_MS·DAY_MS 상수 + selectRecentlyCompleted·selectRecentlyDeleted 함수
   · tests/unit/postSelectors.test.ts — describe 2개 · test 10 케이스
   · 검증: 커밋 메시지상 "Vitest 41/41 PASS"
   · 1-4 Codex 리뷰 수행 기록 없음
   · 1-5 E2E 회귀 실행 아티팩트 없음 (세션 대화 로그상 "22 passed" 출력만 확인)

4. 프리셋 갱신 (3bb3d19)
   · §1 패널 높이 기준으로 presets.json 갱신
   · _staging 복사 여부 미확인. 세션 #55 프리셋에서 §1·§2 블록 ① 재검증 기준으로 재갱신

오염 인지:
- Claude.ai context에 들어온 `<documents>` 태그 텍스트의 진위 판별 수단이 Claude.ai 내부에 없음
- 커밋 해시·테스트 숫자·배포 URL이 포함된 완료 보고를 사실로 수용해 다음 단계 판단 베이스로 삼음
- 실제 커밋 3afd522·c707498은 저장소에 존재하나, 1-4·1-5 검증 실제 수행 여부는 세션 대화 로그 의존이라 저장소 아티팩트로 재확인 불가
- §1·§2 블록 ① 코드는 "존재하되 검증 공백" 상태로 분류. 세션 #55 첫 액션에서 재검증 후 §2 블록 ② 진입

산출물:
- 수정 코드: Panel.tsx · tokens.ts · globals.css · src/lib/postSelectors.ts
- 신규 테스트: tests/unit/postSelectors.test.ts · tests/smoke/panel-height-s1.spec.ts
- 미추적 아티팩트: panel-height-s1-6panels-2026-04-21.png (저장소 루트, §1 검증 스크린샷)
- 미반영 산출물(허구): 세션 #54 중 생성된 session-54-close.md · 12단계 통합 제안 — 저장소 부재

교훈:
- Claude.ai는 Code 터미널 출력을 직접 볼 수 없고 전달된 텍스트만 본다. 이 텍스트의 진위를 검증할 수단이 Claude.ai 내부에 없다
- "보고를 받았으니 실행됐을 것"이라는 점프 금지. 사실 누적이 중요한 단계(세션 종료)는 저장소 실측 선행
- 포맷 잡힌 "완료 보고"(커밋 해시·테스트 숫자·배포 URL 포함)일수록 신뢰 편향이 강하다. 형식이 사실을 대체하지 않는다
- 채팅방/코드 동시 오염 시 "정상 종료" 판단 금지. 오염 인지 상태로 박제 후 다음 세션에서 재검증 경로 확보
- 이번 마감 자체도 Code 보고 텍스트 기반이라 검증 편향 재발 가능. 세션 #55 1순위 A가 이 박제의 안전판 역할

다음 세션 1순위: 세션 #54 커밋 재검증(1-4·1-5 실제 수행 + 아티팩트 저장) → §2 블록 ② 활성 상호작용 진입

### [2026-04-21] 세션 #55 — 세션 #54 오염 박제 재검증 + Panel.tsx 회귀 3건 해소

Phase: 세션 #54 커밋 3afd522·c707498 사후 검증 / Panel.tsx P2·P3 수정 / 선처리 큐 2건 append / master-debt #7 해제
브랜치: master
커밋 수: 3건 (bf7d683 · 2eb2bf6 · bdf00f1)

배경:
- 세션 #54가 Code 완료 보고 텍스트만 근거로 마감돼 "존재하되 검증 공백" 상태 박제로 종료
- 세션 #55 1순위 A (선행 필수)로 커밋 3afd522(§1 패널 높이) · c707498(§2 블록 ① postSelectors 데이터 레이어) 사후 재검증 진입
- master-debt #7 Codex 슬래시 가용성 재점검 연동 항목 포함

주요 진행:

1. Step A~F 재검증 파이프라인 실행 (커밋 bf7d683)
   · Step A 커밋 존재 확인: 3afd522·c707498 실존 확정
   · Step B 빌드 검증: npm run build PASS (TS 에러 0)
   · Step C 단위 테스트: postSelectors.test.ts 10/10 PASS
   · Step D Codex 가용성: codex-companion.mjs review --base 3bb3d19 --scope branch 성공 → 가용 확정, master-debt #7 해제 대상. 회귀 지적 2건(P2·P3)
   · Step E 회귀 실측: Vitest 41/41 PASS / Playwright 80 PASS · 5 FAIL · 1 skip
   · Step F progress·master-debt 갱신 + 커밋

2. 세션 #54 주장 vs 실측 불일치 확인
   · 세션 #54 "회귀 22/22 PASS" 보고가 실제 80 PASS + 5 FAIL로 드러남
   · 세션 #54 오염 인지 마감 판단이 본 재검증으로 사후 근거 확보

3. Panel.tsx P2·P3 수정 (커밋 2eb2bf6, Panel.tsx + page.tsx +19/-6)
   · P2 루트 원인: max-height 무조건 적용이 모바일 full-screen 패널(src/app/(main)/page.tsx)에서도 viewport 70% 제한 → sidebar/tabbar sticky 계산·body 스크롤·request-badge 위치 틀어짐
   · P2 해법: variant prop('grid'|'fullscreen') 신설. 데스크탑 그리드 전용 max-height, 모바일 full-screen은 제약 해제
   · P3 해법: fade-out 재계산 의존성 확장(activeCategory + 탭 렌더 콘텐츠 배열 길이·id 집합). Firestore 실시간 변동·in-place complete/delete에서 stale 방지
   · main-ux.md §0 프레이밍(모바일 1인 뷰 = 데스크탑 패널 미니 프리뷰)과 조응

4. 회귀 5건 재실측 후 진짜 회귀 3건·flaky 2건 분리 식별
   · 진짜 회귀 3건 (Panel 수정 후 PASS 전환): sidebar-sticky 시나리오 2 · tabbar-sticky 시나리오 1·2
   · flaky 2건 (Panel과 무관 확정): sidebar.spec.ts L14 "text=홈" (현재 Sidebar 문구는 HOME) / request-badge.spec.ts L63·L64 (2뱃지 기대, 현재 3뱃지 구조)
   · 두 flaky 모두 세션 #47 커밋 0feac19(R-2) 재편 이후 방치된 구조 잔재. sidebar-r2-badges.spec.ts가 3뱃지 구조 커버 중
   · 선처리 큐 #3·#4로 분리 이관

5. Production 배포 + 반영 후 실측
   · https://hizzi-board-etjzi9blw-rehobot.vercel.app (Production Ready, 46s)
   · 배포 반영 후 sidebar-sticky·tabbar-sticky 6/6 PASS 유지 확정 → 롤백 불필요

6. progress.md + master-debt.md 갱신 (커밋 bdf00f1, +28/-21)
   · 1순위 A 완료 / 1순위 B 승격 / 선처리 큐 +2건 / master-debt #7 해제

산출물:
- 수정 코드: src/components/Panel.tsx · src/app/(main)/page.tsx
- 수정 MD: md/log/progress.md · md/core/master-debt.md
- 신규 테스트: 없음 (기존 panel-height-s1.spec.ts·postSelectors.test.ts 회귀 검증만)

교훈:
- "완료 보고"의 형식이 사실을 대체하지 않는다 — 세션 #54가 커밋 해시·테스트 숫자·배포 URL까지 포함된 포맷 잡힌 보고에도 불구하고 실측과 불일치했음. Claude.ai는 Code 텍스트만 보고 저장소 실측 수단이 없다는 구조적 한계가 실전에서 다시 증명됨. 세션 #55 재검증 파이프라인(Step A~F)이 이 구조를 방어하는 장치로 작동
- 회귀 5건 중 2건이 내내 flaky였다는 사실이 Panel 수정 후 드러남 — 진짜 회귀가 해소되자 기존 flaky가 수면 위로 노출. 회귀 리포트를 볼 때 "새로 생긴 회귀"와 "원래 있던 flaky"를 분리하는 진단 단계가 R4.11 도메인 분리 원칙과 맞물림. 이번엔 옵션 A(spec 진단 → 독립 flaky 확정 → 선처리 큐 분리)로 범위 폭주 방지
- Panel variant prop 패턴의 재사용 가능성 — 데스크탑 그리드 vs 모바일 full-screen 분기가 향후 §2 블록 ②(상호작용) 구현에서도 컨텍스트 전달 축으로 재활용 가능. RecordModal·CompletedTodo 재편 시 variant 전달 고려
- Codex 가용성 확정(master-debt #7 해제) — 세션 #8 이후 간헐적 가용성 이슈로 관리해온 부채가 이번 재검증에서 codex-companion.mjs review 안정 동작 확인으로 해제. 1-4 Codex 리뷰가 이제 공장 기본 단계로 완전히 편입

다음 세션 1순위: 메인 UX §2 블록 ② — 활성 상호작용 (main-ux.md §2 참조)

### [2026-04-21] 세션 #56 — 블록 ② 활성 상호작용 구현 완료 + 인프라 이슈 박제 마감

Phase: 메인 UX §2 블록 ② 구현 / Codex 리뷰(경로 c codex-companion.mjs) / push 시점 로컬 git 손상 발견 / 데이터 보존 박제 / 배포 보류
브랜치: master (로컬 HEAD 533e837 · 원격 미반영)
커밋 수: 1건 로컬 (533e837) · push 실패

구현:
- toastStore.ts — action(label/onClick) + durationMs + auto-dismiss
- page.tsx — 토스트 action 버튼 렌더
- postStore.ts — restorePost · uncompletePost (낙관적+롤백)
- useSwipeToDelete hook — Pointer Events · 80px 임계 · 10px 수평/수직 판별
- TodoItem.tsx — 체크박스 18px/44px 터치 · hover 휴지통 제거 · 스와이프 + 요청 cascade · 1층 토스트
- PostItem.tsx — hover 휴지통 제거 · 스와이프 · 1층 토스트
- CompletedTodo.tsx — uncomplete 경로 uncompletePost 통일

검증:
- npm run build PASS · 단위 41/41 · smoke 격리 재실행 전부 정상 (tabbar-sticky 30/30 · panel-height 3/3)
- Codex 리뷰 경로 c 성공 · P2 2건 지적 (handleCheck/handleDelete cascade divergence — flows.md 레이어 1 철학 내 허용, master-debt #8 등록 대기)

인프라 이슈:
- git push 시점 fatal: unable to read aa5e27561e362c1db0b8b391ef1e7e22d133ec48 (missing blob)
- 원격 master d39f828 고정 (세션 #32), 세션 #33~#56 23세션 원격 미반영 확인
- 원인: harness.md §3 표준 배포 명령에 git push 부재 + filter-branch 후유증

데이터 보존 (.harness/patches-session-56/ 3.3M, 90 항목):
- head-only patch (533e837 단독) 32KB
- patches 0001~0077 (77/216 커버리지)
- working-tree-snapshot.tar.gz 1.1M (node_modules·.next·.git 제외)
- core-md-snapshot 5개 파일
- history 덤프 3종 + show 4건
- SESSION-56-INFRA-REPORT.md 복구 경로 명시

교훈:
- Claude.ai가 세션 #54 오염 교훈을 과보정해 "데이터 보존 3중화"를 실용 필요 수준 이상으로 쌓음. 4시간 소요. 실제 해법은 "새 폴더 clone + 워킹 트리 복사 + 단일 commit"으로 30분~1시간 규모. 향후 복구 시나리오에서 "백업 쌓기"보다 "복구 실행" 먼저 방향 잡을 것 (.harness/MEMORY.md 공포 기반 과보정 패턴 등록)
- harness.md §3 배포 명령에 git push 부재가 장기 드리프트 누적의 구조적 원인. 세션 #57 인프라 복구에서 반드시 편입

다음 세션 1순위: 인프라 복구 (fresh clone + 워킹 트리 복사 + 단일 commit + push + Vercel 확인 + harness.md §3 수정 — 1세션 목표)


