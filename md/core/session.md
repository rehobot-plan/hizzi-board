# HIZZI Board — 세션 운영

> 세션 경계 절차(시작·종료·프리셋)의 단일 출처.
> Claude.ai가 판단·제안을 주도하고 Claude Code가 기계적으로 실행한다.
> 세션 내 작업은 harness.md 참조. 수정: 오너 승인 필수.

## 0. 주체 분담

세션 경계에서 발생하는 운영 절차는 Claude.ai가 주도한다. 세션 내 코딩 작업(공장 안)과 달리, 세션 경계는 "무엇을 정리·이관할지" 판단이 핵심이라 기획자 역할이 먼저다.

- **Claude.ai** — 판단·제안. 오너와 합의된 결정을 Claude Code에 명령으로 전달.
- **Claude Code** — git 명령·파일 조작·`presets.json` 갱신 같은 기계적 실행.
- **오너** — 각 단계 제안에 "OK / 수정" 반응만.

이 파일은 Claude.ai가 자기 응답 구조에 참조하는 동시에 Claude Code가 세션 종료 실행에 참조하는 공통 레퍼런스다.

## 1. 세션 시작

### 진입 시 자동 read

진입 발동과 동시에 hizzi-board-fs MCP로 다음 6개 파일을 아래 번호 순서대로 자동 read하고 꼼꼼히 읽고 시작한다.

1. `CLAUDE.md`
2. `md/core/session.md`
3. `md/core/harness.md`
4. `md/core/rules.md`
5. `md/core/master.md`
6. `md/log/todo.md`

### 주입 확인 (첫 단계)

자동 read한 6개 파일이 비어있거나 손상됐는지 내용으로 확인한다. 하나라도 실패하면 즉시 오너에게 보고하고 진행을 중단한다.

### 최초 응답 구조

확인 후 단일 응답으로 회신한다:

1. **직전 세션 인계** — todo.md 현재상태 한 줄 + done.md 최근 append 2~3줄 요약
2. **다음 TODO** — todo.md "다음 1순위" 그대로 표시
3. **필요 MD 추가 로드** — CLAUDE.md 파일 지도 적용 결과
4. **오늘의 추천** — CLAUDE.md 제안 포맷 4줄
5. **오너 응답 대기**

오너가 "OK" 한 단어로 진입 가능해야 한다. "어느 게 좋을지 모르겠어서" 류 되묻기는 금지 — 판단은 Claude.ai가 하고 근거는 추천 이유에 쓴다. TODO가 비어있거나 항목 간 의존이 모호해 추천 자체가 불가능한 경우만 예외로 질의 허용.

## 2. 세션 종료 — 2단계

세션 종료 = 코드 종료가 아니라 대화방 이관. 핵심: todo.md·done.md·(필요 시) 프리셋 갱신. 정확도는 오너 검수가 아니라 Code 실측 선행 + Claude.ai 근거 매칭으로 담보한다 (principles.md #6).

**발동 방식:** 오너 자연어 "세션 종료하자" / "정리하고 넘어가자" 류 발화. Claude.ai가 단계 1~2 자동 수행 결과를 한 응답으로 보고. 오너는 요약 스캔 후 "ㅇㅇ" 또는 "X번 수정: (내용)"으로 반응. 개입은 시작점 1회 + 요약 스캔 1회로 끝난다.

### 2단계

| 단계 | 내용 | 실행 주체 | 오너 검수 |
|:---:|---|---|:---:|
| 1 | Code 실측 — `git log --oneline -20` · 세션 중 str_replace된 파일 경로 + mtime · master-debt·MEMORY diff · `.harness/session-started.flag` · 1-4·1-5 아티팩트 실존 여부. Claude.ai는 이 출력 + hizzi-board-fs MCP 직접 확인(파일 내용·mtime·존재 영역에 한함, git 영역 제외)으로 교차검증한 결과를 근거로 단계 2 초안 작성. 두 출처 불일치 시 초안 작성 중단 + "사실 불일치: (항목)" 보고 후 단계 1로 복귀 | Code + Claude.ai | 없음 |
| 2 | todo.md 완료분 삭제 + 후보 큐 갱신 + 1순위 동기화 (후보 큐 top 복붙) + done.md append + (필요 시) master-debt·MEMORY 갱신 | Claude.ai 작성 → Code 실행 | 요약 스캔만 |

### 보고 포맷

Claude.ai는 단계 1 실측 + 단계 2 갱신 제안을 한 응답으로 제시한다. 오너는 요약을 훑어 사실 오염 여부만 확인 — 문장 단위 검수가 아니라 "이게 맞게 누적됐는가" 스캔.

오너 승인 후 Claude.ai가 "세션 종료 완료 ✅" 출력.

### 제약

- 단계 1 Code 실측 출력은 해석·판단 없이 사실만. Claude.ai는 이 출력과 hizzi-board-fs MCP 직접 확인 결과를 교차검증해 단계 2 초안을 작성한다. 두 출처 불일치 시 초안 작성 중단 + 보고 후 단계 1로 복귀. 대화 콘텍스트의 "완료했다" 텍스트는 초안 근거 사용 금지 (MEMORY #54·#55).
- 단계 2 todo.md 완료 삭제·done.md append 항목은 단계 1 git log·str_replace 경로와 1:1 매칭. 매칭 실패 시 초안 작성 중단 + "사실 불일치: (항목)" 보고 후 단계 1로 복귀 (오너 개입 없이). 기획 논의·계획만 된 항목은 "계획 but 미반영 → 후보 큐 이관"으로 분리 표기 (MEMORY #61-c·#62-a).
- 단계 2 master-debt·MEMORY 추가·해소 항목도 동일하게 단계 1 출력 근거 매칭 필수.
- 세션 단위 요약·교훈 서사는 작성하지 않는다. 박제 필요한 교훈은 principles.md / MEMORY.md로 올리는 기존 경로 활용. 박제 필터 통과 못 한 중간 층 판단은 git commit message로 대신 담을 수 있음.

## 3. MD 수정 — 두 층 구분

MD 파일 수정 요청이 들어오면 먼저 해당 파일이 거버넌스 층인지 도메인 층인지 판단한다. 두 층은 검수 절차가 다르다.

**거버넌스 층 (검수 필수)** — CLAUDE.md · session.md · harness.md · principles.md · .harness/MEMORY.md 헤더의 운영 조항. 시스템 운영 규약·역할 분담·세션 절차를 담는 파일.

Claude.ai는 변경 항목별 before/after 비교표를 먼저 제시해 오너 검수를 받은 뒤에만 실행 명령 블록을 만든다. 포맷: Before(기존 문장 원문) / After(수정될 문장) / 이유(한 줄). 신규 파일 생성은 before가 없으므로 초안 전체를 통으로 검수받는다.

**도메인 층 (AI 자율)** — rules.md · rules-detail.md · flows.md · flows-detail.md · patterns.md · patterns-modal.md · uxui.md · ux-principles.md · master.md · master-schema.md · master-debt.md · master-bugs.md · todo.md · done.md · .harness/MEMORY.md 사례 기록 · md/plan/designs/\* · md/archive/\*.

코딩 규칙·UI 패턴·상태 전환·관측된 패턴 같은 도메인 지식. 세션 중 오너와 협의된 내용이거나 공정에서 도출된 사실이면 Claude.ai가 자율 수정하고 한 줄 사후 보고. 오너가 이상 있으면 그 자리에서 지시.

**예외 — todo.md·done.md는 공장이 매 1-6에서 직접 업데이트한다.** 완료된 TODO는 todo.md 해당 줄 삭제, 신규 TODO는 후보 큐 추가, 완료 작업은 done.md에 한 줄 append. 도메인 층 자율 원칙과 정합하며, 세션 종료 단계 2-a에서 정돈된다. 세션 단위 서사·교훈은 쓰지 않는다 (박제 필요분은 principles.md / MEMORY.md 기존 경로).

**경계 사례** — MEMORY.md 헤더 규약 수정·운영 조항 추가는 거버넌스. MEMORY.md 사례 박제 추가·해소 기록은 도메인. 판단이 애매하면 거버넌스로 보수적 포함.

**중복 기술 금지** — 같은 내용을 두 파일에 중복 기술하지 않는다. 두 파일에 걸치는 내용이 발견되면 한쪽으로 수렴시킨다.

