# HIZZI Board — 세션 운영

> 세션 경계 절차(시작·종료·프리셋)의 단일 출처.
> Claude.ai가 판단·제안을 주도하고 Claude Code가 기계적으로 실행한다.
> 세션 내 작업은 harness.md 참조. 수정: 오너 승인 필수.

## 0. 주체 분담

세션 경계에서 발생하는 운영 절차는 Claude.ai가 주도한다. 세션 내 코딩 작업(공장 안)과 달리, 세션 경계는 "무엇을 정리·이관할지" 판단이 핵심이라 기획자 역할이 먼저다.

- **Claude.ai** — 판단·제안. 오너와 합의된 결정을 Claude Code에 명령으로 전달.
- **Claude Code** — git 명령·파일 조작·`presets.json` 갱신 같은 기계적 실행.
- **오너** — 각 단계 제안에 "OK / 수정" 반응만.

이 파일은 Claude.ai가 자기 응답 구조에 참조하는 동시에 Claude Code가 세션 종료 실행에 참조하는 공통 레퍼런스다. 프리셋 상시 포함 파일이라 새 세션에서도 자동 로드된다.

## 1. 세션 시작

### 첨부 파일

새 대화방 시작 시 오너가 업로드하는 파일 (프리셋 시스템이 `md-presets/_staging/`에 미리 준비). **아래 번호 순서대로 읽는다** — 정체성과 구조가 먼저 세팅돼야 현황을 해석할 틀이 생긴다.

1. `CLAUDE.md` *(정체성·역할)*
2. `md/core/harness.md` *(프리셋 상시 포함, 공장 구조)*
3. `md/core/rules.md` *(공장 안 규칙)*
4. `md/core/session.md` *(프리셋 상시 포함, 세션 경계)*
5. `md/core/master.md` *(프리셋 상시 포함, 구조 인덱스·MD 인벤토리)*
6. `md/log/todo.md` *(프리셋 상시 포함, 할 일·현재상태)*

### 주입 확인 (첫 단계)

세션 시작 프롬프트를 받으면 Claude.ai는 먼저 여섯 파일이 실제 주입됐는지 내용으로 확인한다. 파일명만 보이고 내용이 비어있으면 로딩 실패다 — 과거 CLAUDE-detail.md가 크기 한계로 안 들어왔던 사례가 있음. 하나라도 빠지면 즉시 오너에게 보고하고 진행을 중단한다.

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
| 1 | Code 실측 — `git log --oneline -20` · 세션 중 str_replace된 파일 경로 + mtime · master-debt·MEMORY diff · `.harness/session-started.flag` · 1-4·1-5 아티팩트 실존 여부. Claude.ai는 이 출력**만을** 근거로 단계 2 초안 작성 | Code | 없음 |
| 2-a | todo.md 완료분 삭제 + 후보 큐 갱신 + 1순위 동기화 (후보 큐 top 복붙) + done.md append + (필요 시) master-debt·MEMORY 갱신 | Claude.ai 작성 → Code 실행 | 요약 스캔만 |
| 2-b | 다음 세션 프리셋 제안 (생략 포함 필수 검수 — 1순위가 동일 도메인이면 skip, 도메인 전환이면 갱신) → `presets.json` 갱신 → `_staging` 복사 → 트리거 실행 | Claude.ai 제안 → Code 실행 | **검수 (유일)** |

### 보고 포맷

Claude.ai는 단계 1 실측 + 단계 2-a 갱신 제안 + 단계 2-b 프리셋 제안을 한 응답으로 제시한다. 오너는 요약을 훑어 사실 오염 여부만 확인 — 문장 단위 검수가 아니라 "이게 맞게 누적됐는가" 스캔. 검수량은 2-b 프리셋 1회, 수 초 단위.

오너 승인 후 Code가 단계 2-b 프리셋 실행. 완료 시 Claude.ai가 "세션 종료 완료 ✅" 출력.

### 제약

- 단계 1 Code 실측 출력은 해석·판단 없이 사실만. Claude.ai는 이 출력만을 근거로 단계 2 초안을 작성한다. 대화 콘텍스트의 "완료했다" 텍스트는 초안 근거 사용 금지 (MEMORY #54·#55).
- 단계 2-a todo.md 완료 삭제·done.md append 항목은 단계 1 git log·str_replace 경로와 1:1 매칭. 매칭 실패 시 초안 작성 중단 + "사실 불일치: (항목)" 보고 후 단계 1로 복귀 (오너 개입 없이). 기획 논의·계획만 된 항목은 "계획 but 미반영 → 후보 큐 이관"으로 분리 표기 (MEMORY #61-c·#62-a).
- 단계 2-a master-debt·MEMORY 추가·해소 항목도 동일하게 단계 1 출력 근거 매칭 필수.
- 세션 단위 요약·교훈 서사는 작성하지 않는다. 박제 필요한 교훈은 principles.md / MEMORY.md로 올리는 기존 경로 활용. 박제 필터 통과 못 한 중간 층 판단은 git commit message로 대신 담을 수 있음.
- 단계 2-b 프리셋 복사 직전, Code는 대상 MD 각각의 mtime·파일 말미 타임스탬프를 확인해 세션 말 기대 상태와 괴리 없음을 보고한다. 괴리 감지 시 복사 중단·오너 보고 (MEMORY #62-d · #61 drift 사고 재발 방지).
- 단계 2-b 프리셋 생략 판단 근거는 보고에 명시. 다음 세션 1순위가 이번 세션과 동일 도메인이면 skip 가능, 도메인 전환(예: 블록 ④ → 거버넌스)이면 갱신 필수.
- 거버넌스 MD(CLAUDE · session · harness · principles · MEMORY 헤더 운영 조항) 수정이 필요한 경우, 단계 2-a에 포함하지 않고 별도 세션으로 이관한다 (self-modification 회피 원칙 MEMORY #62-c).

## 3. MD 수정 — 두 층 구분

MD 파일 수정 요청이 들어오면 먼저 해당 파일이 거버넌스 층인지 도메인 층인지 판단한다. 두 층은 검수 절차가 다르다.

**거버넌스 층 (검수 필수)** — CLAUDE.md · session.md · harness.md · principles.md · .harness/MEMORY.md 헤더의 운영 조항. 시스템 운영 규약·역할 분담·세션 절차를 담는 파일.

Claude.ai는 변경 항목별 before/after 비교표를 먼저 제시해 오너 검수를 받은 뒤에만 실행 명령 블록을 만든다. 포맷: Before(기존 문장 원문) / After(수정될 문장) / 이유(한 줄). 신규 파일 생성은 before가 없으므로 초안 전체를 통으로 검수받는다.

**도메인 층 (AI 자율)** — rules.md · rules-detail.md · flows.md · flows-detail.md · patterns.md · patterns-modal.md · uxui.md · ux-principles.md · master.md · master-schema.md · master-debt.md · master-bugs.md · todo.md · done.md · .harness/MEMORY.md 사례 기록 · md/plan/designs/\* · md/archive/\*.

코딩 규칙·UI 패턴·상태 전환·관측된 패턴 같은 도메인 지식. 세션 중 오너와 협의된 내용이거나 공정에서 도출된 사실이면 Claude.ai가 자율 수정하고 한 줄 사후 보고. 오너가 이상 있으면 그 자리에서 지시.

**예외 — todo.md·done.md는 공장이 매 1-6에서 직접 업데이트한다.** 완료된 TODO는 todo.md 해당 줄 삭제, 신규 TODO는 후보 큐 추가, 완료 작업은 done.md에 한 줄 append. 도메인 층 자율 원칙과 정합하며, 세션 종료 단계 2-a에서 정돈된다. 세션 단위 서사·교훈은 쓰지 않는다 (박제 필요분은 principles.md / MEMORY.md 기존 경로).

**경계 사례** — MEMORY.md 헤더 규약 수정·운영 조항 추가는 거버넌스. MEMORY.md 사례 박제 추가·해소 기록은 도메인. 판단이 애매하면 거버넌스로 보수적 포함.

**중복 기술 금지** — 같은 내용을 두 파일에 중복 기술하지 않는다. 두 파일에 걸치는 내용이 발견되면 한쪽으로 수렴시킨다.

## 4. 프리셋 — 다음 세션 파일 준비

`프리셋` 자연어 트리거는 두 모드.

### 모드 A — 복사

**조건:** "프리셋" + "만들어" 계열 동사 없음.

`presets.json`의 `current.files` 배열을 읽어 `md-presets/_staging/`에 복사.

- 대상: `D:\Dropbox\Dropbox\hizzi-board\md-presets\presets.json`
- 복사처: `D:\Dropbox\Dropbox\hizzi-board\md-presets\_staging\`
- `_staging` 없으면 생성, 기존 파일 전량 삭제 후 신규 복사
- 완료 후 파일 목록 + 크기·타임스탬프 보고

예시: "프리셋", "프리셋 실행", "프리셋 복사"

### 모드 B — 생성+복사

**조건:** "프리셋" + "만들어" 계열 동사 포함.

직전 Claude.ai가 지정한 파일 세트로 `presets.json`을 갱신하고 같은 실행에서 `_staging` 복사까지 완료.

**파일 세트 출처 우선순위:**
1. 같은 프롬프트 안에 파일 목록 명시 → 그것 사용
2. 명시 없음 → 직전 Claude.ai 출력에서 추출
3. 둘 다 없음 → 오너 확인 질의 (예외)

**부가:**
- `name` / `description` / `updated` 필드 있으면 함께 갱신
- 커밋: `chore(presets): {name} 프리셋 갱신`

예시: "프리셋 만들어줘", "프리셋 갱신해줘"

### 공통

- **실행 주체:** Claude Code (PowerShell 프로필 의존 없음)
- **상시 포함 파일:** `md/core/harness.md` + `md/core/session.md` + `md/core/master.md` + `md/log/todo.md` (라우팅·주제 무관 무조건 포함)
- **실패 처리:** `presets.json` 파싱 실패 / 지정 파일 미존재 시 중단 + 원인 보고, `_staging`은 건드리지 않음
