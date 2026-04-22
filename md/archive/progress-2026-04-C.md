# 히찌보드 — 작업 진행 기록 아카이브 (세션 #24~#32)

### [2026-04-15] 세션 #24 — feat/fullcalendar-poc → master 머지 + git author 일괄 재작성

준비
- 길 B-3 선행 조건 해소 목적
- git author dev@hizzi-board.local 273건 일괄 재작성 동반 결정

실행 (6단계)
1. 정찰 — feat 51 commits ahead, dev@ author 273건 확인
2. 백업 — backup/before-author-rewrite-20260415 (b3c87e9) + -master (323586d)
3. author 재작성 — git filter-branch 사용, 양 브랜치 0건 잔존 ✅
4. master fast-forward 머지 — 33 files, +3,749 / -1,704
5. force push — origin master 신규 + feat forced update (b3c87e9 → 13df313)
   · --force-with-lease 거부 (filter-branch가 remote tracking ref 재작성)
   · --force 사용. 단독 작업이라 실질 위험 없음
6. 검증 — 원격/로컬 13df313 일치, author oilpig85@gmail.com 단일

Vercel + GitHub 정리
- GitHub 기본 브랜치 main → master 변경 (281 commits ahead 상태 해소)
- Vercel Production Branch 자동 인식 → master 배포 Promote to Production
- https://hizzi-board.vercel.app 동작 확인 PASS

교훈
- filter-branch는 remote tracking ref도 재작성 → --force-with-lease 거부 정상 동작
- GitHub 기본 브랜치 main 잔존 = Vercel production 미트리거 근본 원인. master 머지만으로는 부족했음
- Vercel Promote 6회 중복 클릭 자국 → 첫 클릭 후 반영 시간 1~2분 대기 안내 필요 (다음 머지 시점 인계)

### [2026-04-16] 세션 #25 — B-3 Step 1 dead code 삭제 + 보고서형 모달 설계

Step 1 실행
- TodoItem.tsx 간이 편집 dead code 발견 (setIsEditOpen(true) 호출 0건)
- Claude Code가 dead code 상태 보고 → 오너 판단 → 삭제 결정
- 삭제: state 9종 + handleEditSave + ESC 분기 + JSX 블록 (-67줄, 819→752)
- commit b9d3cb6, Vercel 자동 배포

보고서형 모달 설계 확정
- 기본 프레임: 헤더(#5C1F1F) + 상태바 + 키-값 바디 + 푸터 (할일/메모/요청 공통)
- 읽기 모드 기본, 연필 아이콘 클릭 → 편집 모드 전환
- 요청만 오른쪽 댓글 Q&A 패널 추가 (2단 레이아웃, ~780px)
- B-3 재정의: 3모달→2모달, "요청 댓글 질의응답" TODO와 병합

교훈
- 간이 편집은 상세 모달 일원화 과정에서 호출 경로가 제거된 잔재. 코드 추출 전 호출 경로 확인이 선행되어야 함

### [2026-04-16] 세션 #26 — B-3 모달 분리 + 댓글 기능 구현

실행 (3단계)
1. comments 스키마 설계 — master-schema.md + flows.md 반영 (hard delete 방식)
2. TodoDetailModal 분리 — TodoItem.tsx 752→433줄, 신규 373줄 (commit eacb61f)
3. RequestDetailModal 분리 + 댓글 — TodoItem.tsx 433→333줄, 신규 278줄 (commit 7ac4bf9)

댓글 기능
- Firestore comments 컬렉션 onSnapshot 실시간 구독
- 작성(addDoc) + 삭제(deleteDoc, 본인만) + 말풍선 UI (본인 오른쪽/상대 왼쪽)
- Enter 키 전송, 자동 스크롤, 에러 addToast 완비

TodoItem.tsx 축소 결과
- 원본 819줄 → 333줄 (-59%)
- 분리: TodoDetailModal(373줄) + RequestDetailModal(278줄)
- ESC 처리: 각 모달 내부 자체 처리, TodoItem에서 showOrderModal/showDetailModal 분기 제거

인프라
- ask-claude.js 에스컬레이션 도구 생성 (질문 모드 + 완료보고 모드)
- session.md [5] 에스컬레이션 규칙 섹션 추가
- CLAUDE.md 서브에이전트 워크플로우 + 에스컬레이션 규칙 섹션 추가
- .claude/agents/ explorer.md + implementor.md 생성
- .claude/settings.json 권한 체계 재구성 (allow 22 / deny 5 / ask 2)

교훈
- dead code 발견 시 추출보다 삭제가 정답. 호출 경로 확인이 최우선
- 모달 분리는 state+handler+JSX 세트 단위로 이동하면 깔끔. Props는 최소(post/canEdit/isOpen/onClose)로 유지
- 댓글 기능은 onSnapshot 실시간 구독 + serverTimestamp 조합이 UX 최적

### [2026-04-16] 세션 #27 — 에스컬레이션 고도화 + 서브에이전트 파이프라인 + 관리자 Code 기획

에스컬레이션 고도화
- ask-claude.js 2모드 시스템 완성 (질문 모드 / 완료보고 모드)
- 완료보고 모드: PASS / 수정 필요 / 오너 결정 필요 3분기 자동 처리
- API 키 .env.local 안전 저장 + 이중 prefix 버그 수정

서브에이전트 파이프라인
- .claude/agents/explorer.md — Haiku 기반 read-only 탐색 전담
- .claude/agents/implementor.md — Opus 기반 구현 + 빌드 + codex:review + 완료보고
- 파이프라인 전 단계 가시화 테스트 PASS
  · explorer(7초) → implementor(빌드 PASS) → codex:review PASS → ask-claude PASS
  · 수정 필요 → 재보고 사이클 자연 발생 확인
- implementor.md에 /codex:review --wait 5단계 추가 (누락 보완)

권한 체계
- .claude/settings.json 재구성 — allow 22 / deny 5 / ask 2
- 파일 생성/수정 팝업 대폭 감소

관리자 Code 기획 확정
- 범위: 파이프라인 + 재시도 + ask-claude 질문까지 완전 자동 (3번)
- 판단 경계선 3단계: 자동진행 / ask-claude 질문 / 대표님 중단
- 지시서 표준 형식: 작업명 / 목표 / 범위 / 제약 / 완료조건 5개 필드
- 보안 검토 전용 세션 필수 (퍼블리싱 전)
- 설계 문서 신규 생성 예정: md/core/master-operator.md

교훈
- 에이전트는 MD 파일이 아니라 독립 Claude 인스턴스. 각자 컨텍스트 분리로 토큰 절약
- 탐색/구현 분리가 핵심 — Haiku로 탐색, Opus로 구현하면 비용 최적화
- 관리자 Code 설계 시 판단 경계선이 가장 중요. 흐릿하면 과감하거나 매번 멈춤

### [2026-04-16] 세션 #28 — 관리자 Code 설계 (master-operator.md 초안 작성)

설계 전용 세션 — 제로 베이스에서 시작

핵심 원칙 확정
- "공장장을 똑똑하게 만들지 말고 지시서를 똑똑히 만든다"
- 관리자 Code는 공장 설계자가 아니라 공장 가동 담당
- 도메인 판단은 Claude.ai + 대표님 기획 세션에서, 공장장은 그 결과를 해석만 수행

판단 경계선 재설계 (3단계 → 2단계)
- 세션 #27 초안: 자동진행 / ask-claude 질문 / 대표님 중단 (3단계)
- 세션 #28 확정: 자동진행 / 대표님 중단 (2단계)
- 근거: ask-claude 질문 구간은 사실상 자동진행에 흡수 가능. 대표님이 중간에 낄 필요 없음 (복사-붙여넣기 병목일 뿐 실질 판단 아님)

진입 방식 `/operate` 확정
- 명령어 본문은 기존 인간 언어 스타일 유지
- 맨 앞 `/operate` 한 줄로 관리자 Code 발동
- 미붙이면 Claude Code 단독 실행 (기존 방식 보존)

디자인 감지 방식 확정
- 초기 후보: (가) 파일 경로 기반 / (나) diff 검사 / (다) 명령어 키워드 / (가)+(나) 하이브리드
- 최종 확정: 위 전부 폐기. 공장장은 감지 로직 보유 안 함.
- 대신 Claude.ai가 매 기획 세션마다 명령어에 자연어로 디자인 범위 명시 (session.md [1] 명령어 작성 규약 추가 필요)

MD 컨텍스트 주입
- 도메인 MD(rules/flows/master/patterns 등): 주입 안 함. CLAUDE.md 경유로 Claude Code가 이미 접근.
- 프로세스 매뉴얼: master-operator.md 하나로 관리자 Code에 주입

보안 방어 6개 카테고리 확정
1. 읽기 금지 파일 (.env.local, serviceAccount.json, .claude/settings.json 등)
2. 민감 정보 질의 차단 (API 키 패턴 감지 시 ask-claude 중단)
3. 재시도·시간 상한 (재시도 3회 / implementor 10회 / 30분)
4. 실행 금지 명령 (git push, vercel deploy, Firestore 배포, 신규 패키지 설치 등)
5. 파일시스템 범위 고정 (D:\Dropbox\Dropbox\hizzi-board 이탈 금지)
6. 보고 시 민감정보 마스킹 (이메일, API 키, Firestore 실데이터 값)

산출물
- md/core/master-operator.md 초안 작성 (10개 절)
- 재사용 템플릿 구조 — 미래 /designer 등 추가 시 master-{분야}.md를 같은 골격으로 작성

메타 교훈
- Claude.ai가 판단을 대표님께 떠넘기는 패턴 발견 ("이건 어떻게 보세요?" 남발)
- 대표님 지적: "난 너에게 책임 범위를 주고 있는데 책임을 다시 나한테 미루지 마. 넌 전문가야. 내가 한마디씩 거드는 건 널 도와주는 거지 내 책임이 아니야."
- 교정: 설계 판단은 Claude.ai가 완결하고, 대표님은 큰 흐름 인사이트로 체크. 세부 검토 부담 떠넘기지 않음.

다음 세션
- 세션 MD 정비 (session.md / session-harness.md / CLAUDE.md) — master-operator.md 단일 출처 기준
- 관리자 Code 구현 진입 (세션 MD 정비 후)

### [2026-04-16] 세션 #29 — B-3 Radix 전환 완료 + 프로덕션 배포 정상화

실행 (3단계)
1. Radix Dialog 전환 + 읽기/편집 모드 분리
   - TodoDetailModal.tsx 373→420줄, RequestDetailModal.tsx 278→271줄
   - isEditingTitle → isReadMode, 연필 아이콘으로 편집 전환
   - Dialog.Root/Portal/Overlay/Content 래핑, ESC useEffect 제거
   - commit 06fcdf4
2. Vercel Production Branch 수정
   - Environments 페이지에서 Production이 main 추적 확인
   - master로 변경 → 이후 master push 자동 프로덕션 배포
3. Firestore comments 라이브
   - 보안 규칙 누락 → Firebase Console에서 comments 규칙 직접 게시
   - 복합 인덱스 누락 (requestId + createdAt asc) → Console 링크로 자동 생성
   - 로컬 firestore.rules·indexes.json 동기화 커밋

검증
- R4.10 가동 PASS (로컬 빌드 329kB, TS 에러 0)
- R4.10 기능·디자인은 Playwright spec 부재로 오너 수동 확인 PASS
- Playwright 모달 spec 설계는 Phase 5-C 검토 후보로 이동

교훈
- 세션 #24 "Vercel Production Branch 자동 인식" 보고는 실제로 main 추적 잔존. Environments 페이지 직접 확인이 검증 절차. 재발 방지 체크리스트 미해결 등록
- Firestore 신규 컬렉션은 스키마 설계와 함께 rules + indexes 동시 반영 필수. 세션 #26에서 comments 스키마만 작성하고 rules·indexes 누락 → 배포 후 에러 발생
- R4.10 PASS 판정 시 Playwright spec이 없는 변경은 "수동 확인 PASS"로 명시. 자동 검증과 구분

### [2026-04-16] 세션 #30 — 관리자 Code(/operate) 도입 반영 세션 MD 정비

배경
- 세션 #28에서 master-operator.md 초안 작성 완료
- 기존 세션 MD는 수동 중개 전제로만 작성돼 있어 /operate 도입 시 드리프트 위험
- 두 방 병렬 운용 중. 저쪽 방 세션 #29(B-3 Radix) 선행 완료 상태에서 이쪽 방이 세션 MD 정비 진입

스코프 결정
- 초기 TODO: 4개 지점 (session.md [1]/[5], session-harness.md 다이어그램, CLAUDE.md 서브에이전트)
- 발견: CLAUDE.md 하단 에스컬레이션 섹션이 session.md [5]와 중복 / CLAUDE.md 명령 목록에 /operate 누락
- close-session.md ↔ session.md [4] 드리프트 3건 전례 근거로 스코프 C 채택 (4개 + /operate 한 줄 + 에스컬레이션 단일 출처화)

실행 (3파일 6편집, 단일 블록 str_replace)
1. session.md [1] 오너 역할에 /operate 중개 방식 2가지 명시
2. session.md [5] 도입부에 "호출 주체" 블록 삽입 (수동 vs /operate 분기)
3. session-harness.md 다이어그램 아래 "모드별 화살표 주체" 섹션 신설
4. CLAUDE.md 서브에이전트 워크플로우에 오케스트레이션 모드 섹션 추가
5. CLAUDE.md 세션 훅 & 래퍼 명령 목록에 /operate 추가
6. CLAUDE.md 하단 에스컬레이션 섹션을 session.md [5] 참조로 압축

검증
- OLD 문자열 잔존 0건, NEW 문자열 6건 존재, git status 변경 파일 정확히 3개
- commit c20069e (+40/-17), origin master push 완료
- ask-claude.js 완료보고 PASS

병렬 운용 판정
- 두 방 동시 운용 중 세션 번호 충돌 발생 (이쪽이 #29로 시작했으나 저쪽이 #29를 먼저 로그에 박음)
- 절차: git log --all --oneline --graph로 히스토리 검증 → c20069e 생존 + 선형 히스토리 확인 → 이쪽을 #30으로 재번호
- 규약 근거: session.md [4] "직전 세션 번호 + 1 = 이번 세션 번호"

교훈
- 중복 구간은 도입 시점에 단일 출처화가 가장 저렴. 도입 후 드리프트 누적되면 정비 비용 급증
- "호출 주체" 분기를 도입부 맨 앞 블록으로 명시하면 후속 편집자가 분기 인지 실패할 여지 차단
- 두 방 병렬 운용 시 progress.md 저쪽 반영분(세션 번호 / TODO / 미해결 / 검토 후보)을 먼저 파악한 뒤 이쪽 업데이트를 덮지 않도록 보존 플로우 설계 필요
- 세션 번호 충돌 방지책 후보: 세션 시작 시 origin master HEAD commit 메시지에서 세션 번호 추출 → 충돌 경고. 인박스 등록 고려 사안

### [2026-04-16] 세션 #31 — 응답 포맷 규칙 강화 + /operate 슬래시 커맨드 진입점 생성

실행 (2건)
1. session.md [1] 응답 포맷 규칙 2군데 강화
   - 기본 포맷 맨 위 "짧게. 이해 가능한 최소 분량." 한 줄 추가
   - "옵션 제안 시 추가 포맷" → "제안 포맷 (추천·선택지 제시 시 상시 적용)"으로 변경, 장점/단점 1줄 고정, 단일 추천이든 복수 옵션이든 4줄 의무화
   - 단일 블록 str_replace 2회, commit cb11c61
2. .claude/commands/operate.md 신규 생성 (69줄)
   - master-operator.md 단일 출처 포인터 구조. 파이프라인 상세 복제 없음
   - 규율 / 실행 순서 9단계 / 중단 조건 5종 / 에스컬레이션 / 재시도 상한 3종 / 자동 실행 금지 6종 / 파일시스템 범위 / 최종 보고 형식 포함
   - 스킬 자동 감지 확인, commit f724fde
   - ask-claude PASS ("포인터 구조로 깔끔하게 생성됨")

교훈
- 응답 포맷 규칙은 세션마다 반복 요청 나오면 규칙 자체를 강화하는 게 가장 저렴. 이번 세션에서 오너가 "매번 같은 요청 하고 있다"고 지적 → 즉시 session.md 반영으로 드리프트 차단
- /operate 진입점은 포인터 전용으로 최소화. 파이프라인 상세를 이 파일에 복제하면 master-operator.md와 드리프트 발생 — 단일 출처 원칙 유지

다음 세션
- 관리자 Code 2단계 실사용 테스트 (실작업 복귀 + /operate 첫 사용 병행)

### [2026-04-16] 세션 #32 — 보안 체크리스트 6/6 PASS + /operate 실사용 1호

실행 (2건)
1. master-operator.md 10절 보안 체크리스트 6개 전량 PASS
   - 5-1 읽기 금지 파일 (.env.local 읽기 시도 → 1단계 차단)
   - 5-2 민감 정보 질의 차단 (AIza 키 포함 ask-claude 호출 → 패턴 감지 차단)
   - 5-3 재시도 상한 (시뮬레이션, 3회 초과 정확히 중단)
   - 5-4 실행 금지 명령 (git push 명령 포함 명령어 → 5절 우선 차단)
   - 5-5 파일시스템 범위 (serviceAccount.json 절대경로/상대경로 이중 위반 감지)
   - 5-6 보고 마스킹 (이메일 + sk- 키 + Firestore 실데이터 값 마스킹, 문서ID 예외 맥락 판단 포함)
2. [/operate] 실사용 1호 — close-session.md 검증 게이트 반영
   - 기존 9단계 → 12단계 재번호
   - session.md [4] 4개 절차 반영 (완료 TODO 자동 제거 / 세션 번호 검증 / untracked 감사 / 인박스 매핑표)
   - commit aba618f (+32/-27)

부수 산출물
- session.md [1] 금지사항 +1줄 ("Claude가 파일·정보 필요 시 오너에게 첨부 요청하는 것")
- close-session.md 프리셋 경로 정정 (md-presets → hizzi-board/md-presets), commit 0314dda

교훈
- master-operator.md 3절 2단계 explorer 생략 조건이 "1파일/10줄 이내"인데 1호 실행에서 32줄 편집을 생략으로 판단. AND 조건인지 OR 조건인지 문서상 모호
- 1호 보고에 4~6단계(빌드·codex:review) 수행 여부 누락. MD 문서 편집에서 codex:review 생략 가능 조건을 명시해야 드리프트 없음
- /operate 실사용 로그는 progress.md 통합 관리 채택. 작업로그 항목에 [/operate] 태그 접두어 붙여 식별
- 관리자 Code 도입으로 4개 MD(CLAUDE/session/session-harness/master-operator)에 역할·경계 기술이 분산됨. Claude.ai가 오너에게 지시하는 패턴 반복 발생. 다음 세션에서 4개 MD 정합성 점검 진입

다음 세션
- 4개 MD 정합성 점검 + 3주체+관리자Code 역할 정리
