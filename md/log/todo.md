# 히찌보드 — 할 일

> 진행 중·대기 중 할 일만. 완료되면 해당 줄 삭제. 세션 단위 요약·교훈 금지.
> 완료 로그: md/log/done.md
> 구조 규약: 1순위 → 후보 큐 → 현재상태 → 선처리 → 미해결 순서 고정.
> 1순위 필드는 후보 큐 top 항목과 복붙 수준 동기화 필수.

---

## 다음 1순위

- Claude Desktop + MCP filesystem 설정 — 복붙 마찰 제거, 다음 세션 작업 환경 구축 (환경 건 · 후보 큐 개발 항목과 별도 트랙)

## 후보 큐

- calendarEvents 필드 체계 분열 통합 (master-debt #18) — reader identity 규약 통일 + specific visibility reader 대응. 독립 세션 2~3 사이클. ⑤-3 선결 조건
- 블록 ⑤-3 — 타인 패널 달력 scope/privacy 정제 (visibleTo 기반 필터 + viewer/owner/admin 권한 매트릭스). 기획 대화 선행 후 착수
- ask-claude.js Anthropic API 직통 자동화 — 공장 내부 Code↔Claude 왕복 자동화. 100% 자동 아님, 오너 개입 영역 축소 목적. 폭주 방지 제약(라운드 상한·토큰 예산·특정 판단 유형 수동 유지) 설계 필수. 거버넌스 층 수정 동반. Claude Desktop 설정 후 별 건 검토. P2
- 메인·MY DESK 전체 UX 감사 세션 — mydesk.md·main-ux.md·profile.md 재독 기반. 기능 추가·모달 동선·결함 세 축 점검. 실사용 피드백(오너 + 6인 팀) 사전 수집 2~3일 선행. 산출물은 후보 큐 항목 + P1/P2/P3 우선순위 + 의존 관계. 기획 대화 세션
- 6 B-1 — LLM 2단 본체 부착 (Anthropic Haiku) · ai-capture-hb.md 9.3
- 6 수신자·기한·타입 unset 질의 UI 확장 · ai-capture-hb.md 4.2
- authStore.onAuthStateChanged reload 부작용 (master-debt #14)
- MD 다이어트 — master 계열 5분할 통합 · designs/ 완료분 아카이브 이관 · 유령 파일 정리 · archive/ 월간 집계
- (거버넌스 잔여) CLAUDE.md [7] 경계 사례 문구 보강
- (거버넌스 잔여) MEMORY 박제 임계 D안 정식화 (환원 불가능한 것만 박제)
- (거버넌스 잔여) MEMORY 잔존 5건 환원 재검토
- (거버넌스 잔여) done.md 자기참조 케이스 포맷 규약 — harness.md 1-6 한 줄 추가
- (거버넌스 잔여) session.md 세션 종료 2단계 제약에 "2-a 갱신 제안 '없음' 3건은 drift 아닌 정상" 명시 조항 추가 — 2026-04-24 시운전 관찰
- (거버넌스 잔여) old_str 작성 원칙 — Claude.ai 기억 재구성 금지, Code 실측 라인 보고 선행 후 작성 — CLAUDE.md 또는 rules.md 계열 한 줄 추가 — 2026-04-24 3회 연속 불일치 관찰
- (거버넌스 잔여) harness.md 3 "현재 spec: playwright-login.spec.js" 문구 실측 반영 — 해당 파일 testDir 밖이라 표준 명령 실행 불가 (2026-04-24 블록 ④ 1-5 관찰)
- (거버넌스 잔여) session.md 2번 "종료 판단 기준" 한 줄 추가 — 개발 의도 전환 / 콘텍스트 포화 / 오너 명시적 지시 중 하나 발생 시 종료. 거버넌스 층 수정이라 별도 세션에서 before/after 비교표 검수 필요 — 2026-04-24 종료 시점 판단 기준 공백 관찰
- (거버넌스 재설계) MCP filesystem 도입 후속 — 운영 프로토콜 4층 재검토. 1~2 세션 관찰 선행 후 거버넌스 수정 세션으로 진행. 검토 대상: 1층 session.md 1(세션 시작 주입 확인) + 2(Code 실측 + Claude.ai 직접 확인 이중 검증 구조) · 2층 session.md 4 프리셋 시스템 폐기 + md-presets/·presets.json·_staging/ 폴더 제거 · 3층 CLAUDE.md 5 파일 지도 의미 재정의(주입 목록→참조 목록) · 4층 harness.md 1-6 공장 산출물 경로 파일 저장 전환(선택). 거버넌스 층 수정이라 before/after 비교표 검수 필요. 2026-04-24 MCP filesystem 도입 완료 시점 기록

## 현재상태

- 작업 브랜치: master (로컬·원격 4e904bf 동기 · master-debt #16 closed · #18·#19 후속 · 다음 세션 환경 구축 건 선행)
- 프로덕션: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW
- Codex 플러그인 커맨드 7종 실재 확인(review/rescue/adversarial-review/cancel/result/setup/status) — `/codex:adversarial-review` 존재 확정, harness.md 3 목록과 일치
- `/codex:rescue` Skill tool 호출 2회 연속 reject 재현(2026-04-24) — 오너 side 1m+ hang 표시. `/codex:review`·`/codex:cancel`은 frontmatter `disable-model-invocation: true`로 assistant 자동 호출 차단, 오너 직접 입력만 허용

## 선처리 큐

- #5 tabbar-sticky.spec 간헐 timeout
- #7 Vercel Preview env 불완전

## 미해결

- 실 Chrome 스크롤 jump handle
- DevTools Performance 워크플로우
- post-request cascade divergence
- serviceAccount.json git history 잔존
