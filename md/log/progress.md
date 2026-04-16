# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-16 세션 #29 (종료)
- 작업 브랜치: master (06fcdf4)
- 진행 중: B-3 완료. Radix Dialog 전환 + 읽기/편집 모드 분리 + 댓글 기능 프로덕션 라이브.
- 다음 TODO:
  1. 세션 MD 정비 — master-operator.md 단일 출처 기준으로 기존 문서 충돌 제거
     · 대상: md/core/session.md / md/core/session-harness.md / CLAUDE.md
     · 수정 지점 4개:
       - session.md [1] 역할 정의 ("오너가 중개자" → "/operate 사용 시 관리자 Code가 중개")
       - session.md [5] 에스컬레이션 ("Claude Code 직접 호출" → "관리자 Code 자동 호출 구간 추가")
       - session-harness.md 하네스 루프 다이어그램 (화살표 주체 명시)
       - CLAUDE.md 서브에이전트 워크플로우 (관리자 Code 오케스트레이션 층 추가)
     · 진입 조건: 없음 (바로 진입 가능)
  2. 관리자 Code 구현 진입 (세션 MD 정비 후)
     · master-operator.md 기준 실제 구현
     · .claude/commands/operate.md 또는 operate.js 생성
     · 파이프라인 로직 + 금지·상한·보호 규칙 적용
     · 퍼블리싱 전 10절 보안 체크리스트 6개 항목 전부 PASS
  3. 실작업 복귀: 첨부파일 다중 업로드 / 완료 알림 토스트 (모바일 우선 축으로 재판정)
  4. close-session 인박스 강제 검증 게이트 추가 (인프라, 짬 작업)
- 미해결:
  - md/core/master.md 15~17행 인코딩 깨짐 잔존 (경미)
  - close-session.md ↔ session.md [4] 드리프트 3건 (인박스 등록)
  - src/components/ImageViewer.tsx 루트/common 중복 (경미, 별도 세션)
  - Vercel Hobby 플랜 Preview 자동 SSO 정책 (Deployment Protection Disabled 필요)
  - filter-branch refs/original/ + backup 브랜치 2개 로컬 잔존 (정리 대상)
  - Vercel Production Branch 설정 확인 이력 (세션 #24 "자동 인식" 보고 오류) — 재발 방지용 체크리스트 필요
- 참고: 프리셋 시스템 단일화 완료. `프리셋` 한 단어로 current 엔트리 실행.
- 검토 후보 (조건부 진입):
  - 디자이너 오퍼레이터 도입 (조건부 진입)
    · 진입 조건: 디자인 작업 비중이 코드 작업을 넘어서거나, /operate가 디자인 명령을 처리하기에 부적절해지는 시점
    · 설계 방향: /designer 슬래시 커맨드로 분리. /operate와 독립된 파이프라인.
    · 관리자 Code 아키텍처는 이 확장을 염두에 두고 설계됨 (master-operator.md 구조 재사용 가능)
  - FullCalendar 미활용 기능 7건 (master 머지 + 디자인 통일 완료 후)
    · 추천 순서: iCal 공휴일 피드 → 드래그 → 리사이즈 → rrule → 주간 뷰 → 검색 → 타임존
    · 각 후보 R4.9+R4.10 순서, 단일 세션 1건씩
    · 3/4/5 는 스키마 변경 동반
  - R4.10 preflight 훅 구현 (N/M PASS 카운트 검증)
  - 토큰 소비 최적화 — progress.md 현재상태/작업로그 분할 (장기 누적 시 재검토)
    · R4.10-가/나 텍스트 반영 후 1~2세션 관찰 → 개선 불충분 시 훅으로 승격
    · 세션 #18에서 1차 분할 실행 (#1~#12 → archive). 추가 분할 또는 훅 승격 판단 보류 중
  - 요청 UI 재설계 (길 B) — Phase 5-C 완료 후 새 방
    · 진입 버튼 카운트 분리(받은 N + 변동 M) / 토스트 다리 / cancel_requested + 통합 댓글 스레드
    · 데이터 모델 변경 동반 → flows + master-schema + todoRequestStore 첨부 필요
    · 병합 메모: 요청자 ↔ 수락자 상호작용 플로우 전반 재검토 포함. 수정·보완 범위 초과 시 재설계로 승격.
  - 일반 메모/할일 완료·삭제 UX 점검 (조건부)
    · 진입 조건: 요청 UI 재설계 후 + 사용자 구체 사례 1~2건 확보
  - Phase 5-C 잔존 정리 (3-pass 완료 후 일괄 안건)
    · tokens.ts 미존재 hex 일괄 신규 토큰 승격 (#17 작업로그 23건 + #16 후속 8종)
    · CalendarEventBadge 프리미티브 추출 (AddEventModal 미리보기 ↔ CalendarGrid renderEventContent 로직 중복)
    · AddEventModal 구분 버튼 색 P2 정합성 확인 (현재 카테고리 태그 아닌 캘린더 이벤트 색 사용)
  - Phase 6 잔여 파일 토큰화 (14파일, 약 465행)
    · 대상: LeaveManager / page.tsx / leave/page.tsx / PostEditModal(잔여) / TodoRequestModal / NoticeArea / PostList / Panel / DeletedTodo / CompletedTodo / login / signup / PostItem / TodoRequestBadge
    · 진입 조건: 머지 완료 후
    · 모바일 리팩터링과 겹치는 파일은 그쪽 세션에 흡수 검토
  - 기능별 색상 일치화 (설계 세션 필요)
    · 목적: 같은 기능은 같은 색으로 통일 → 색만 보고 기능 즉시 인지
    · 대상: patterns.md P2 좌측 띠 + uxui.md 4번 색상 의미 시스템 +
      게시물 모달 / 달력 모달 / 달력 이벤트 / 할일 / 요청 전반
    · 성격: 기계적 치환 아님. 설계 세션 필요
    · 진입 조건: 길 B 시리즈 완료 + 머지 완료 후
    · 선행 작업: Claude가 "어느 기능이 어디서 어떤 색으로 나오는지"
      현황 스캔표 작성 → 오너가 통일 기준 결정 → 토큰 조정
  - 백업 브랜치 + refs/original/ 정리 (2026-04-22 이후)
    · backup/before-author-rewrite-20260415 + -master (2개)
    · refs/original/ 6개 ref (filter-branch 백업)
    · 일주일 경과 후 문제 없으면 삭제
  - 데이터 정리 작업 — Production Firestore (별도 세션 필수)
    · 달력: 연차 자료만 남기고 나머지 calendarEvents 삭제
    · 게시물: posts 컬렉션 전체 삭제
    · 사용자 정보(users): 절대 건드리지 않음
    · 진입 조건: Firestore 백업 절차 설계 + 팀원 공지 합의 + dry-run 검증
    · 영향 범위: Calendar / PostList / 관련 store
  - 프리셋 운용 팁 — Dropbox 동기화 지연 대응
    · 프리셋.ps1 실행 후 Dropbox 트레이 동기화 완료 확인 후 새 방 시작
    · _staging\progress.md 크기 사전 확인 권장
    · session.md [4] 종료 규약에 한 줄 추가 검토
  - untracked md 파일 정리 (10건 누적, 별도 세션)
    · 진입 조건: 어느 파일이 의도된 신규 / 의도되지 않은 잔재인지 분류
    · 영향 범위: md/ 하위 전체
  - 모달 Playwright spec 설계 (Phase 5-C 정리 때 일괄)
    · TodoDetailModal 읽기/편집 전환 + 저장 플로우
    · RequestDetailModal 댓글 작성·삭제 + 완료 처리
    · 3 방법 닫기 (ESC / 백드롭 / 닫기 버튼)
    · 진입 조건: Phase 5-C 시작 시점

---

## 장기 방향성

> 모든 세션의 작업이 이 축 위에서 움직인다. 단일 세션 작업이 아닌 지속 발전 대상.

- **AI 챗봇 인터페이스 전환** — 할일/달력 세팅 마무리 후, 각 기능을 AI 챗봇으로 구동하는 구조로 전환. 하이브리드 로직(기본 규칙 로직 + AI 판단 로직 병행)으로 토큰 최소화. 입력은 단순하게, 구동은 최적·최고로.
- **모바일 우선 최적화** — 히찌보드·Rehobot 공통 전제. 기본 사용 환경이 모바일, 데스크톱은 보조. 할일/달력/AI 챗봇 다음으로 이어지는 작업 축.

---

## 작업로그 (날짜/세션 단위 append — 삭제 금지)

> 세션 #1~#12 아카이브: md/archive/progress-2026-04-A.md
> 세션 #13~#23 아카이브: md/archive/progress-2026-04-B.md

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
