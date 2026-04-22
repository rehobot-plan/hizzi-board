# 히찌보드 — 작업 진행 기록 아카이브 (2026-04 D)

### [2026-04-16] 세션 #33 — session.md → CLAUDE.md 통합 + CLAUDE-detail.md 신설

실행 (3건)
1. session.md → CLAUDE.md 통합 (commit d39f828)
   - CLAUDE.md 11섹션 단일 진입점 전체 교체 (4주체 역할 정의 [1]에 관리자 Code 정식 등록)
   - md/core/CLAUDE-detail.md 신규 (세션 시작 프롬프트 / 최초 응답 / 종료 규약 / 인박스 이관)
   - md/core/session.md 삭제, 참조 치환 10파일
   - codex:review 3건 발견 → 전량 해소 (presets.json 경로 / _staging 동기화 / 세션 마무리 규칙 포괄 확인)
2. 드리프트 탐색 5축 (read-only)
   - 역할 정의 / 자연어 경로 / 섹션 번호 / 라우팅 표 / close-session 정합성
   - 결과: 높음 1건(단계 번호 불일치) / 중간 1건(Planner 표기) / 낮음 1건(MEMORY.md 미언급)
3. CLAUDE-detail.md 단계 번호 정정 (commit f8d964b)
   - close-session.md 단계 8 → 단계 11

교훈
- session.md 삭제 시 _staging 스냅샷과 presets.json도 동시 갱신 필수. codex:review가 발견하지 않았으면 다음 세션 프리셋이 깨짐
- locked-files.txt에 대상 파일이 포함된 경우 안전 규칙이 작동하여 즉시 중단됨. 오너가 사전에 수동 해제하는 절차가 필요 (인박스 → CLAUDE.md [1] 금지사항 반영 완료)

다음 세션
- 드리프트 잔존 처리 (session-harness.md Planner 표기 등) + /operate 실사용 2호

### [2026-04-16] 세션 #34 — 드리프트 해소 + 경량화 규약 + 요청 도메인 정리 + /operate 휴면

실행 (5건)
1. [/operate] 실사용 2호 — 드리프트 잔존 2건 해소 (session-harness.md Planner 표기 / CLAUDE-detail.md MEMORY.md 항목), commit bcbfb4c
2. progress.md 경량화 규약 확정 — 완료 세션 최근 2건 유지, 초과분 월 아카이브. MEMORY.md 탐색 결과 사문화 확인
3. [/operate] 실사용 3호 — 규약 코드화 + #24~#32 아카이브. close-session.md 13단계 재번호, progress.md 384→119줄, progress-2026-04-C.md 신규, commit 05da066
4. 요청 도메인 TODO 섹션 신설 — 분산돼 있던 요청 관련 4항목 통합. 다음 세션 1순위를 요청 UI 재설계(길 B)로 교체
5. /operate 모드 휴면 처리 — 메타 규칙 정비가 기능 개발 시간 잠식. master-operator.md + operate.md 휴면 배너로 자산 보존. CLAUDE.md 8곳, session-harness.md, CLAUDE-detail.md 수동 단일 복원. commit 3e42bad
6. locked-files.txt 재구축 — 핵심 진입점·규약 파일 19건 복구 (세션 중 비워진 상태 해소)

교훈
- 규약 확정과 코드화 사이 간격을 같은 세션에서 닫으면 드리프트 없음
- 연관 도메인 TODO는 별도 섹션화가 설계 진입 판단에 효율적
- 메타 규칙이 실기능 개발 시간을 잠식하면 즉시 휴면이 옳은 판단. 자산 보존 + 사용 빈도 0이 해답
- 보안·자동화 정책은 기능 완성 후 실사용 패턴 데이터로 재설계가 정확. 선제 설계 → 실사용 → 재설계 사이클은 비용이 큼
- locked-files.txt 자체도 잠금 대상에 포함. 실수 비움 재발 방지

현재상태 갱신
- 다음 TODO 1순위: 요청 UI 재설계(길 B) 기획 세션
- 프리셋 _staging: 8개 파일 반영 완료

다음 세션
- 요청 UI 재설계(길 B) 기획
