# 아이디어 인박스

> 작업 중 떠오른 아이디어 임시 저장소.
> 세션 종료 시 Claude.ai가 분류 후 progress.md / session.md / rules-detail.md 등에 반영.
> 반영 완료 항목은 자동 삭제.

---

- [2026-04-16 17:24] - Claude.ai 첨부 컨텍스트 주입 크기 제약 (발견: 세션 #32 첫 진입 시)
    · 증상: progress.md(21KB, 331줄)만 <documents>에 미주입, 나머지 6개(≤11KB) 정상 주입
    · 추정 임계치: 파일당 ~11KB 근방 (명시 문서 없음, 관측 기반)
    · 영향: 세션 시작 시 progress.md 내용 기반 판단(다음 TODO / 직전 세션 인계)이 Claude 측에서 누락됨
    · 우회: bash로 /mnt/user-data/uploads/progress.md 직접 읽기 (세션 #32에서 검증)
    · 권장 조치: 기존 "토큰 소비 최적화 — progress.md 분할" 항목 승격 + #24~#31 아카이브 분할(md/archive/progress-2026-04-C.md)
    · 연관: 기존 검토 후보 "토큰 소비 최적화" 항목과 병합 검토
- [2026-04-16 17:52] ?. session.md 3분할 — session-close.md + session-escalation.md 신설
    · 배경: session.md 10.8KB로 컨텍스트 주입 임계치 ~11KB 근접 (검토 후보 "Claude.ai 첨부 컨텍스트 주입 크기 제약" 근거)
    · 이관: [4] 세션 종료 + [4-1] 같은 방 → session-close.md / [5] 에스컬레이션 → session-escalation.md
    · 본문 1:1 cut-paste 원칙 (문구 수정 금지)
    · 참조 교체: CLAUDE.md / close-session.md / master-operator.md 3절
    · 수용 기준: session.md < 8KB, 이관 본문 일치, 참조 무결성
    · /operate 첫 실사용 후보 (MD 전용·안전 마진 높음)
- [2026-04-16 18:30] master-operator.md 3절 2단계 explorer 생략 조건 명확화 ("1파일/10줄 이내" AND/OR) [분류: session.md·rules]
- [2026-04-16 18:30] master-operator.md 3절 codex:review 생략 조건 신설 여부 (MD 문서 전용 변경에서 생략 가능한지) [분류: session.md·rules]
- [2026-04-16 18:30] session-harness.md 다이어그램 "[Claude - Sonnet] Planner" 표기 → 실제 운용 Opus 4.6으로 수정 [분류: session.md·rules]
