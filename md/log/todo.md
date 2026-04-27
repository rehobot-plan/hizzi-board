# 히찌보드 — 할 일

> 진행 중·대기 중 할 일만. 완료되면 해당 줄 삭제. 세션 단위 요약·교훈 금지.
> 완료 로그: md/log/done.md
> 구조 규약: 1순위 → 후보 큐 → 현재상태 → 선처리 → 미해결 순서 고정.
> 1순위 필드는 후보 큐 top 항목과 복붙 수준 동기화 필수.

---

## 다음 1순위

- todoRequest cascade visibility 보존 (writer 정돈 후속) — todoRequestStore.acceptRequest가 원본 request의 requestVisibility를 보존하지 않고 visibility='all' 하드코드 + visibleTo 미저장. ⑤-3 visiting reader는 보안 우선 strict 적용했으나 writer가 의도(requestOnly/specific)를 손실 → reader가 양당사자 fallback으로만 작동. 본질 해소는 cascade writer 정돈 + visibleTo·visibility 명시 저장. P2 (2026-04-27 1-1 중단 — 재진입 전 명령 블록 재작성 필요: 필드명 정정·posts 제외·calendarEvents 단일 분기·S7 visibleTo→visibility 매핑 정책 확정)

## 후보 큐
- todoRequest cascade visibility 보존 (writer 정돈 후속) — todoRequestStore.acceptRequest가 원본 request의 requestVisibility를 보존하지 않고 visibility='all' 하드코드 + visibleTo 미저장. ⑤-3 visiting reader는 보안 우선 strict 적용했으나 writer가 의도(requestOnly/specific)를 손실 → reader가 양당사자 fallback으로만 작동. 본질 해소는 cascade writer 정돈 + visibleTo·visibility 명시 저장. P2 (2026-04-27 1-1 중단 — 재진입 전 명령 블록 재작성 필요: 필드명 정정·posts 제외·calendarEvents 단일 분기·S7 visibleTo→visibility 매핑 정책 확정)
- 메인·MY DESK 전체 UX 감사 세션 — mydesk.md·main-ux.md·profile.md 재독 기반. 기능 추가·모달 동선·결함 세 축 점검. 실사용 피드백(오너 + 6인 팀) 사전 수집 2~3일 선행. 산출물은 후보 큐 항목 + P1/P2/P3 우선순위 + 의존 관계. 기획 대화 세션
  - [수집 2026-04-25] 완료 회수 동선 재설계 — 체크박스 완료 시 활성 리스트에서 즉시 제거하지 않고 패널 하단 회색 영역으로 시각 이동(체크된 글씨 회색). 재체크 시 원위치 복귀. 24h 경과 시 자동으로 보관 이동. main-ux.md 2.5 "활성만 표시" 결정 **self-overruled 검수 필요**. 24h 자동 이동 메커니즘(클라이언트 표시 필터 vs Cloud Function 쓰기) 결정 동반
  - [수집 2026-04-25] RecordModal 2탭(완료/휴지통) → 3탭(당일완료/완료/삭제) 분기 검토 — 위 1번 채택 시 자연 정렬: 당일완료=패널 하단 회색 / 완료=24h 지난 보관 / 삭제=휴지통
  - [수집 2026-04-25] RecordModal 명칭 "기록" → "보관" 변경 검토 — 의도적 저장 의미 강조
  - [수집 2026-04-25] RecordModal 진입을 점세개 메뉴에서 별도 아이콘으로 승격 검토 — 탭바 우상단 ··· 안 "기록" 항목 → 헤더 아이콘 버튼 직접 진입
  - [수집 2026-04-25] 편지봉투 아이콘 평면화 — 현재 입체적/기울어진 톤 → 평면 봉투 자산 교체
  - [수집 2026-04-25] TodoRequestModal 내부 4분류 재편 (받은요청/보낸요청/진행중/완료) — 발신자·수신자 양쪽 입장 직관성 회복. 현재 섹션 4 "완료·반려·취소" 그릇 재편 필요
- ask-knowledge.js Anthropic API 직통 자동화 — 공장 내부 Code↔Claude 왕복 자동화. 100% 자동 아님, 오너 개입 영역 축소 목적. 폭주 방지 제약(라운드 상한·토큰 예산·특정 판단 유형 수동 유지) 설계 필수. 거버넌스 층 수정 동반. Claude Desktop 설정 후 별 건 검토. P2
- 6 B-1 — LLM 2단 본체 부착 (Anthropic Haiku) · ai-capture-hb.md 9.3
- 6 수신자·기한·타입 unset 질의 UI 확장 · ai-capture-hb.md 4.2
- authStore.onAuthStateChanged reload 부작용 (master-debt #14)
- MD 다이어트 — master 계열 5분할 통합 · designs/ 완료분 아카이브 이관 · 유령 파일 정리 · archive/ 월간 집계
- (거버넌스 잔여) CLAUDE.md [6] 경계 사례 문구 보강
- (거버넌스 잔여) MEMORY 박제 임계 D안 정식화 (환원 불가능한 것만 박제)
- (거버넌스 잔여) MEMORY 잔존 5건 환원 재검토
- (거버넌스 잔여) done.md 자기참조 케이스 포맷 규약 — harness.md 1-6 한 줄 추가
- (거버넌스 잔여) session.md 세션 종료 2단계 제약에 "단계 2 갱신 제안 '없음' 3건은 drift 아닌 정상" 명시 조항 추가 — 2026-04-24 시운전 관찰
- (거버넌스 잔여) rules-detail.md dangling 참조 정리 — "CLAUDE.md [4-2]·[4-3]·[4-4]·[2]" 거버넌스 재설계 이전부터 부정확. 4번이 하위 항목 없는 단일 단락이라 [4-2]·[4-3]·[4-4]는 처음부터 유효 위치 없음, [2]는 [3] 잘못 가리킴 — 2026-04-25 비교표 3 검수 중 발견
- (거버넌스 잔여) harness.md 3 "현재 spec: playwright-login.spec.js" 문구 실측 반영 — 해당 파일 testDir 밖이라 표준 명령 실행 불가 (2026-04-24 블록 ④ 1-5 관찰)
- (거버넌스 잔여) session.md 2번 "종료 판단 기준" 한 줄 추가 — 개발 의도 전환 / 콘텍스트 포화 / 오너 명시적 지시 중 하나 발생 시 종료. 거버넌스 층 수정이라 별도 세션에서 before/after 비교표 검수 필요 — 2026-04-24 종료 시점 판단 기준 공백 관찰

## 현재상태

- 작업 브랜치: master (로컬·원격 e80055a 동기 · 거버넌스 재설계 1차 적용 완료 · ⑤-3 closed · #18 전체 closed · #19 silent widening 해소(UI 칩 복구만 open) · #16 closed · Claude Desktop + MCP filesystem 설정 완료 · calendarEvents 컬렉션 초기 상태)
- 프로덕션: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW
- Codex 플러그인 커맨드 7종 실재 확인(review/rescue/adversarial-review/cancel/result/setup/status) — `/codex:adversarial-review` 존재 확정, harness.md 3 목록과 일치
- `/codex:rescue` Skill tool 호출 2회 연속 reject 재현(2026-04-24) — 오너 side 1m+ hang 표시. `/codex:review`·`/codex:cancel`은 frontmatter `disable-model-invocation: true`로 assistant 자동 호출 차단, 오너 직접 입력만 허용

## 선처리 큐

- #5 tabbar-sticky.spec 간헐 timeout
- #7 Vercel Preview env 불완전
- #8 panel-record-menu 시나리오 3·4·5 프로덕션 실패 (2026-04-25 #18 2단계 회귀 스위트 관찰) — 팝오버 ESC 닫힘 / 바깥 클릭 닫힘 / "기록" 클릭 RecordModal 노출. 본 변경과 코드 경로 무관 (Panel.tsx · RecordModal 미수정). 원인 추적 필요

## 미해결

- 실 Chrome 스크롤 jump handle
- DevTools Performance 워크플로우
- post-request cascade divergence
- serviceAccount.json git history 잔존
