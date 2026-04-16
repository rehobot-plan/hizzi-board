# 아이디어 인박스

> 작업 중 떠오른 아이디어 임시 저장소.
> 세션 종료 시 Claude.ai가 분류 후 progress.md / CLAUDE.md / rules-detail.md 등에 반영.
> 반영 완료 항목은 자동 삭제.

---

- [2026-04-16 17:24] - Claude.ai 첨부 컨텍스트 주입 크기 제약 (발견: 세션 #32 첫 진입 시)
    · 증상: progress.md(21KB, 331줄)만 <documents>에 미주입, 나머지 6개(≤11KB) 정상 주입
    · 추정 임계치: 파일당 ~11KB 근방 (명시 문서 없음, 관측 기반)
    · 영향: 세션 시작 시 progress.md 내용 기반 판단(다음 TODO / 직전 세션 인계)이 Claude 측에서 누락됨
    · 우회: bash로 /mnt/user-data/uploads/progress.md 직접 읽기 (세션 #32에서 검증)
    · 권장 조치: 기존 "토큰 소비 최적화 — progress.md 분할" 항목 승격 + #24~#31 아카이브 분할(md/archive/progress-2026-04-C.md)
    · 연관: 기존 검토 후보 "토큰 소비 최적화" 항목과 병합 검토
- [2026-04-16 17:52] ✅ session.md 분할 → 세션 #33에서 CLAUDE.md 통합 + CLAUDE-detail.md 신설로 대체 완료
- [2026-04-16 18:30] master-operator.md 3절 2단계 explorer 생략 조건 명확화 ("1파일/10줄 이내" AND/OR) [분류: CLAUDE.md·rules]
- [2026-04-16 18:30] master-operator.md 3절 codex:review 생략 조건 신설 여부 (MD 문서 전용 변경에서 생략 가능한지) [분류: CLAUDE.md·rules]
- [2026-04-16 18:30] session-harness.md 다이어그램 "[Claude - Sonnet] Planner" 표기 → 실제 운용 Opus 4.6으로 수정 [분류: CLAUDE.md·rules]
- [2026-04-16 18:56] locked-files.txt 등 보호 대상 파일 변경은 명령 블록 안에 포함 금지. 오너가 블록 실행 전 별도 터미널에서 수동 해제 후 Claude Code에 "해제 완료" 통지하는 방식으로 분리. Claude.ai 명령 블록 작성 규약에 반영 필요 (session #33 실사례: blocked by safety rule at step 1 두 번 반복됨).
