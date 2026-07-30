세션을 시작합니다. 아래 순서대로 실행해줘. 
(정체성·구조가 먼저 세팅돼야 현황을 해석할 틀이 생긴다)

1. CLAUDE.md 읽기
2. md/core/coding-rules.md 읽기
3. md/core/session.md 읽기
4. md/log/progress.md 읽기
5. 읽기 완료 후 현재 TODO 요약 출력

(공정은 이 목록에 없다 — 거버넌스 하네스가 단일 출처다.)
7. New-Item -Force -Path .harness/session-started.flag -ItemType File

완료되면 "세션 시작 완료 ✅" 출력.

작업·주제에 따라 추가 MD 로드가 필요하면 CLAUDE.md 파일 지도(§5) 적용.
state-flows.md / master.md / component-patterns.md / board-principles.md 등은 이 단계에선 로드하지 않음.
