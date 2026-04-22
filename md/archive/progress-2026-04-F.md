# 히찌보드 — 작업 진행 기록 (세션 #43~#45 Phase H-1 일부 아카이브)

> md/log/progress.md에서 이관된 작업로그. 원본은 해당 세션 블록.
> 이관 시점: 2026-04-20 세션 #46 종료.

---

### [2026-04-18] 세션 #43 — 설계 세션: MY DESK 요청 통합 + 공통 Header

실행 (설계만, 코드 변경 없음)
1. MY DESK · 요청 · 연차의 정보 구조 재편 확정
   - 사이드바 요청 메뉴 제거, MY DESK 우측 3뱃지 (받은/보낸/진행)
   - MY DESK 4탭 → 5탭 (오늘/요청/할일/메모/달력, 시급도 순)
   - 오늘 탭 4카드 재편: 연차 카드 제거, overdue 카드 신설
   - 요청확장 카드 내부 구조: 메인 "받은 대기 K" + 보조 "보낸 대기 N · 진행 중 M"
2. 공통 Header 설계 확정 (선처리 큐 2번에서 정식 설계 문서로 격상)
   - 레이아웃 패턴 B (사이드바 전체 왼쪽, Header는 메인 영역 상단)
   - Header 내용: 좌측 페이지 제목(메인 메뉴명) + 우측 사용자명 + 로그아웃
   - 상단 고정 스택: Header 56px + TabBar 48px = 상단 104px 고정
   - /login·/signup 제외
3. /request 라우트 처리: URL 유지 + RequestView 공통 컴포넌트 추출 전략
4. 구현 Phase 재정렬: H-1~H-3 (Header) → R-1~R-4 (MY DESK 재편) → 4-A/B (달력)

산출물
- md/plan/designs/header.md — 공통 Header 설계 (9 섹션, 구현 Phase 3단계)
- md/plan/designs/mydesk.md — 세션 #37 베이스 + #43 재편 반영 (섹션 12에 폐기 결정 명시)
- progress.md 선처리 큐 재정렬 (구 1·2번 폐기, 현 1번은 구 3번 RequestDetailPopup 2단)

교훈
- 설계 세션 중간에 "사이드바 고정 + 로그인 상단 고정" 요구사항 추가로 스코프 폭주 발생. 공통 Header를 선처리 큐에서 독립 설계 문서로 격상하고 구현 순서를 Header 선행으로 재정렬하여 흡수. 설계 세션에서 스코프 확장 시 즉시 격상 판단이 필요
- 3방 분할 (설계 #43 / Header 구현 / MY DESK 재편 구현) 결정이 결정 피로 감소에 직접 기여. 설계·구현 분리 + Header·재편 분리의 2중 분할
- 이미지 기반 의사결정이 텍스트 옵션 나열보다 결정 속도 빠름. 카드 구조·뱃지 해석·Header 레이아웃 3개 지점에서 시각 비교로 즉시 합의

다음 세션
- Phase H-1 공통 Header + AppShell 기본 구조
- 첨부: md/plan/designs/header.md + CLAUDE.md + progress.md + rules.md + md/ui/patterns.md + md/ui/uxui.md
- Phase H-1 완료 후 H-2 → H-3 순차 진행

### [2026-04-18] 세션 #44 — MD 책임 재분배 + 역할 규범화

**Phase**: MD 정리 (전 영역)
**브랜치**: master
**커밋 수**: 7건

**배경**:
- CLAUDE.md가 ~250줄로 비대화, 원칙·운영·실행 상세가 혼재
- 하네스 파이프라인이 관습으로만 작동, 문서 강제력 부재
- Claude.ai가 실행 번역기 역할에 머물러 기획 밀도 낮음
- 세션 종료 절차가 Claude Code(.claude/commands/close-session.md)와 Claude.ai(CLAUDE-detail [3])에 이원화

**주요 변경**:

1. **MD 책임 재분배** (커밋 1) — 단일 책임 원칙 적용
   - CLAUDE.md 슬림화 250→160줄 (36%↓), 원칙/역할/라우팅만 유지
   - CLAUDE-detail.md — 세션 운영 절차 ([3] close-session 재정의, [5] 프리셋 A/B 신설)
   - session-harness.md — 하네스/실행 인프라 확장 (에스컬레이션/서브에이전트/빌드 흡수)
   - 검증 5/5 PASS

2. **파이프라인 테스트 + 후속 정비** (커밋 2~3)
   - 하네스 파이프라인 end-to-end 구동 테스트 (src/lib/noop.ts 더미 작업)
   - 발견: @implementor trust-but-verify 이슈 / Codex /codex:review 대체 관행
   - CLAUDE.md 파이프라인 명시 한 줄 추가 / session-harness 보강 2곳
   - CLAUDE.md [11] MD 책임 분배 원칙 신설 / rules-detail R4.9~R4.11 역참조
   - 검증 WARN 3건 정리 완료

3. **파이프라인 누락 방어** (커밋 4) — R4.12 신설
   - rules-detail.md R4.12 "파이프라인 적용 표기 의무" 신설
   - rules.md 마스터 체크리스트 항목 추가
   - CLAUDE-detail.md [6] 오너 단축어 섹션 신설 + "파이" 단축어 정의
   - CLAUDE.md [2] 포인터 한 줄
   - 효과: 명령 블록 최상단 "파이프라인:" 표기 의무화, 오너 "파이" 한 마디로 점검 호출

4. **기획자 역할 규범화** (커밋 5~6)
   - CLAUDE.md Claude.ai 역할 정의에 기획자 조항 추가
   - CLAUDE-detail.md [7] 기획자 행동 원칙 P1~P7 신설
     · P1 시나리오 구체화 / P2 기능적 UX 체크 / P3 능동 제안 / P4 유사 사례 / P5 되물음 / P6 MVP 분리 / P7 삭제·단순화
   - P2는 UI 디자인 제외, 기능 흐름만 책임
   - [6] "기획" 단축어 추가 — P1~P7 전체 체크 호출
   - 세션 시작 프롬프트 재작성 — 기획 파트너 트리거 포함

5. **세션 종료 주체 재정의** (커밋 7)
   - .claude/commands/close-session.md 전체 축약 → Claude.ai 주도 선언만
   - CLAUDE-detail.md [3] 12단계 전면 매핑 — 각 단계별 Claude.ai 역할 / 실행 주체 명시
   - 판단·제안은 Claude.ai, 기계적 실행은 Claude Code, 오너는 "OK / 수정" 반응

**산출물**:
- 수정 파일: CLAUDE.md / CLAUDE-detail.md / session-harness.md / rules-detail.md / rules.md / close-session.md (6개)
- 신규 단축어: "파이" (파이프라인 표기 점검) / "기획" (P1~P7 전체 체크)
- 신규 규칙: R4.12 파이프라인 적용 표기 의무
- 신규 원칙: P1~P7 기획자 행동 원칙

**교훈**:
- 관습으로 돌아가던 것(파이프라인 준수)은 반드시 문서화·단축어·표기 의무 3중으로 고정해야 재현됨
- Claude.ai 역할은 "실행 안전망이 확보된 만큼 입력 쪽 기획 밀도로 이동"이 자연스러운 진화 방향
- 기획자 역할 P2에서 UI 디자인은 명시적으로 범위 밖 선언 — 내 한계를 솔직히 문서화한 게 오히려 도움

다음 세션
- Phase H-1 공통 Header + AppShell 기본 구조 (md/plan/designs/header.md 섹션 8)

### [2026-04-18] 세션 #45 — Phase H-1 공통 Header 페이지 제목 매핑 + 본문 H1 제거

Phase: H-1 (공통 Header)
브랜치: master

배경:
- 세션 #43 설계 확정된 공통 Header의 페이지 제목 매핑이 미구현 상태
- 기존 Header.tsx는 "Hizzi is happy, and you?" 고정 문구 사용 중
- mydesk/layout.tsx에 Header와 중복되는 <h1>MY DESK</h1> 존재

주요 변경:
1. src/components/common/Header.tsx — usePathname + getPageTitle 매핑 추가, 좌측 고정 문구를 동적 제목으로 교체, data-testid="header-title" 추가, paddingLeft 중복 제거
2. src/app/(main)/mydesk/layout.tsx — <h1>MY DESK</h1> 제거
3. tests/playwright-header-title.spec.js 신설 — 5경로 검증

검증:
- npm run build PASS (18/18 페이지)
- Playwright E2E 5/5 PASS (/login 미렌더, / → 홈, /mydesk/today → MY DESK, /request → MY DESK, /leave → 연차)
- R4.10 3축 (가동·기능·디자인) 충족

보류 (선처리 큐 이관):
- leave/page.tsx:105 <h1>내 연차</h1> — self 뷰 구분자
- leave/page.tsx:148 <h1>전체 직원 연차 현황</h1> — admin 뷰 구분자
- request/page.tsx:39 <h1>요청 관리</h1> — /request 매핑 때문에 본문이 유일한 식별자

교훈:
- Claude.ai가 파이프라인 이탈(main 직접 Edit / 수동 브라우저 확인 떠넘김)을 세션 내 2회 유도함. 하네스 세팅은 환각·이탈 유혹 상황에서도 고수하는 것이 전제.
- 서브에이전트 환각 @explorer 1회 + @implementor 1회 관측. 원인 규명은 별도 진단 세션 예정.
- 응답 포맷 섹션 2 "구조 블록 금지" 조항은 Claude Code 명령 블록 본문에도 동일 적용됨을 세션 내 2회 위반 후 확정.

다음 세션:
- Phase H-2 TabBar 상단 고정 전환 (header.md 섹션 8 H-2)
