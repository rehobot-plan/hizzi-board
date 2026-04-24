# 히찌보드 — 할 일

> 진행 중·대기 중 할 일만. 완료되면 해당 줄 삭제. 세션 단위 요약·교훈 금지.
> 완료 로그: md/log/done.md
> 구조 규약: 1순위 → 후보 큐 → 현재상태 → 선처리 → 미해결 순서 고정.
> 1순위 필드는 후보 큐 top 항목과 복붙 수준 동기화 필수.

---

## 다음 1순위

- 블록 ③-B — 3층 탭바 "기록" 진입점 + RecordModal 활용

## 후보 큐

- 블록 ③-B — 3층 탭바 "기록" 진입점 + RecordModal 활용
- 블록 ⑤ — 달력 피어 탭
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

## 현재상태

- 작업 브랜치: master (로컬·원격 2833ccb 동기 · chat-input schedule 단어 경계 fix + 프로덕션 E2E 24/24 PASS · 블록 ③-B 진입 가능)
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
