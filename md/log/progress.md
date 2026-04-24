# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-24 세션 #68 진행 중 (C-2 principles #6 신규 + #5 보강)
- 작업 브랜치: master (로컬·원격 동기 · backup/flatten-2026-04-22 = 14ab3e7 보존)
- 프로덕션: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK · §6 홈 채팅 입력 A안 라이브 (시나리오 1~3 완전 · 시나리오 4 placeholder)
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW · 기존 설정 유지
- 거버넌스 변경 (세션 #66~#67 누적):
  · CLAUDE.md [7] MD 수정 이원화 — 거버넌스 4개(+ MEMORY 헤더)만 before/after 검수, 도메인 MD는 AI 자율 + 사후 보고
  · session.md §2 세션 종료 7단계 재설계 — Code 실측 선행 + 근거 매칭으로 정확도 담보, 오너 검수는 프리셋 1건
  · harness.md §2 에스컬레이션 경유 완화 — 설계·기획만 경유, 사실 질의는 직접
  · harness.md §1-6 배포 실패 AI 1차 분류 책임 (코드/환경) — 오너 핑계 문구 제거 (세션 #67)
  · MEMORY.md 박제 임계 2회 이상 + 6개월·30세션 미재발 소각. 세션 #67 첫 적용으로 32건 소각·유지 5건·통합 박제 1건
- 다음 세션 1순위: 방향 C-3 공장 6단계 트랙 분리 — 르호봇 착수 전 재점검
- 후순위 후보:
  - authStore.onAuthStateChanged reload 부작용 (master-debt #14) — E2E 우회 중, 프로덕션 admin 경로 잠재
  - 블록 ③-B: 3층 탭바 메뉴 "기록" 진입점 + RecordModal 활용 + flows.md FLOW 1 복구 cascade 정교화
  - 메인 UX 블록 ④(FAB + CreatePost 재배치) · 블록 ⑤(달력 피어 탭)
  - §6 B-1 확장: LLM 2단 본체 부착 (Anthropic Haiku) — ai-capture-hb.md §9.3
  - §6 수신자·기한·타입 unset 질의 UI 확장 — ai-capture-hb.md §4.2 우선순위 후속
  - 세션 #55 기준 1~6 · #56 기준 5 · #58 기준 7
- 선처리 큐: 기존 유지 (#5 tabbar-sticky.spec 간헐 timeout · #7 Vercel Preview env 불완전)
- 미해결:
  - 실 Chrome ⋯ handle 클릭 scroll jump 근본 원인 미규명 (능동 scroll + 5층 방어로 덮음 · master-debt #11)
  - DevTools Performance 녹화 워크플로우 미수립 (master-debt #12)
  - post-request cascade 실패 시 divergence 가능성 — master-debt #8
  - serviceAccount.json git history 잔존 — master-debt #10

---

## 작업로그 (날짜/세션 단위 append — 삭제 금지)

> 세션 #1~#12 아카이브: md/archive/progress-2026-04-A.md
> 세션 #13~#23 아카이브: md/archive/progress-2026-04-B.md
> 세션 #24~#32 아카이브: md/archive/progress-2026-04-C.md
> 세션 #33~#34 아카이브: md/archive/progress-2026-04-D.md
> 세션 #35~#42 아카이브: md/archive/progress-2026-04-E.md
> 세션 #43~#46 아카이브: md/archive/progress-2026-04-F.md 및 md/archive/progress-2026-04-G.md
> 세션 #47 아카이브: md/archive/progress-2026-04-H.md
> 세션 #48 아카이브: md/archive/progress-2026-04-I.md
> 세션 #49 아카이브: md/archive/progress-2026-04-J.md
> 세션 #50 아카이브: md/archive/progress-2026-04-K.md
> 세션 #51 아카이브: md/archive/progress-2026-04-L.md
> 세션 #52 아카이브: md/archive/progress-2026-04-M.md
> 세션 #53 아카이브: md/archive/progress-2026-04-N.md
> 세션 #54~#56 아카이브: md/archive/progress-2026-04-O.md
> 세션 #57~#58 아카이브: md/archive/progress-2026-04-P.md
> 세션 #59 아카이브: md/archive/progress-2026-04-Q.md
> 세션 #60~#61 아카이브: md/archive/progress-2026-04-R.md
> 세션 #62~#63 아카이브: md/archive/progress-2026-04-S.md
> 세션 #64~#65 아카이브: md/archive/progress-2026-04-T.md

### [2026-04-24] 세션 #66 — 방향 A·B 프로세스 다이어트 · 거버넌스 재편

Phase: 진단 / 오너 제약 vs AI 제약 분류 / 다이어트 방향 3개 좁히기 / 방향 A·B 순차 진입 / 방향 C 별도 세션 이관 결정
브랜치: master (로컬·원격 a9d463e 동기)
커밋: 40da798 (방향 A) · a9d463e (방향 B)

주요 진행:

1. 전수 스캔 + 분류 (기획 대화)
   · 7개 MD 전수 스캔 (CLAUDE · harness · rules · session · progress · MEMORY · master-debt)
   · 오너 제약 vs AI 제약 규칙 분류
   · 르호봇 글로벌 런칭 관점에서 "살림 vs 뺌" 구분선: 품질 게이트·drift 방어는 살림, 사람 개입 루틴·1회 박제는 뺌
   · 다이어트 방향 3개로 좁힘 (A 오너 발화 반사 제거 · B 세션 종료 압축 · C MEMORY 소각 + 원칙 상향)

2. 방향 A — 오너 제약 3건 완화 (커밋 40da798)
   · CLAUDE.md [7] 신규 요청 반사 튕김 제거 → Claude.ai 자체 판단 + 파일 지목 제안
   · harness.md §2 에스컬레이션 경유 완화 → 설계·기획만 경유, 사실 질의는 Code 직접 출력. 오너 헤더 감시 조항 제거
   · MEMORY.md 헤더 박제 임계 조항 신설 → 2회 이상 관측 시만 신규 박제, 6개월·30세션 미재발 소각

3. 방향 B — 세션 종료 7단계 재설계 + MD 수정 이원화 (커밋 a9d463e)
   · 저울질: 오너 검수 1회 vs 시스템 자체 정확도, 3층 보강(Code 실측 + 근거 매칭 + 프리셋 재실측) 중 층 1·층 2 채택, 층 3 보류(MEMORY #56 과보정 방지)
   · session.md §2 12단계 → 7단계. 단계 2 Code 저장소 실측 출력 신설. 단계 3·5 주장-근거 1:1 매칭 강제, 실패 시 오너 개입 없이 단계 2로 복귀. 오너 검수는 단계 6 프리셋만
   · CLAUDE.md [7] MD 수정 이원화: 거버넌스 층(CLAUDE·session·harness·principles + MEMORY 헤더) before/after 검수, 도메인 층(rules·flows·patterns·master·designs·archive 등) AI 자율 + 사후 보고
   · self-modification 회피: 이번 세션 종료는 구 12단계 적용, 신 7단계는 다음 세션부터

4. 방향 C 이관 결정
   · C-1 MEMORY 소각 작업 → 다음 세션 1순위
   · C-2 근본 원칙 상향 통합 → 별도 거버넌스 세션
   · C-3 공장 6단계 트랙 분리 → 르호봇 착수 전 재점검

산출물:
- 수정 MD (실제 반영 — Code git log 교차 검증 완료): md/core/CLAUDE.md §7 · md/core/session.md §2 · md/core/harness.md §2 · .harness/MEMORY.md 헤더 · md/log/progress.md
- 수정 코드: 없음 (거버넌스 MD-only)
- 계획 but 미반영: 방향 C 전체 (다음 세션 이관)

교훈:
- 6인 내부 도구 기준으로 쌓인 방어 장치 중 "오너 개입 루틴"은 르호봇 글로벌 기준에서 과잉, "품질 게이트·drift 방어"는 글로벌에서도 필수. 구분선이 명확해 다이어트 판단 비용 낮았음
- Claude.ai가 "검수 없애면 drift 발생 여지"로 조심스럽게 설계한 초안을 오너가 "내가 참여하지 않아도 시스템 자체 정확도 높일 방향"으로 되물어 재설계 촉발. 방어선을 오너 검수에서 Code 실측 + 근거 매칭으로 옮기자 오너 부담 동일·정확도 상승 양립 가능
- self-modification 회피 원칙(MEMORY #62-c)이 이번 세션에서 실전 작동. session.md 수정이 이번 세션 종료 절차 자체를 바꾸는 구조라 "구 포맷으로 이번 종료, 신 포맷은 다음부터" 명시 필요

다음 세션 1순위: 방향 C-1 MEMORY 소각 작업.

### [2026-04-24] 세션 #67 — 방향 C-1 MEMORY 소각 + harness §1-6 오너 핑계 제거

Phase: MEMORY 전수 스캔 / 소각·유지·통합 박제 분류 / harness 배포 단락 AI 책임 전환 / 1-6 append
브랜치: master (로컬·원격 54cb4e1 동기)
커밋: 54cb4e1

주요 진행:

1. MEMORY 소각 판단 (기획 대화)
   · 박제 임계 규칙(세션 #66 신설) 첫 적용 사이클
   · 소각 기준: 본체 조문화 완료분 · 1회 박제 · 오너 핑계 항목
   · 유지 5건 선별: Claude.ai context 텍스트 사실성 편향 (#54) · "완료 보고" 형식이 사실 대체 안 함 (#55) · #61-b Playwright click actionability scroll 우회 (#61·#65 재적용) · 문서 암묵 전제 구조는 실제 파일 확인 (#50·#52 통합) · #66-a 방어선 위치 전환 원칙 (#54·#66)
   · 통합 박제 1건 신규: MD 비대화 → context 주입 실패 패턴 (#51·#66 재현) — 세션 #66 진입 시 재현 관찰로 2회 임계 충족

2. MEMORY.md 전체 재작성 (커밋 54cb4e1)
   · 259줄 → 65줄 대폭 축소 (221 deletions / 16 insertions)
   · 헤더 박제 임계 조항 유지 · 5개 유지 섹션 + 1개 신규 섹션 구성
   · 섹션 본문은 원문 유지하면서 "오너"를 "검수" 등 주체 중립어로 교체 (시스템 규약 관점)

3. harness.md §1-6 배포 단락 수정 (커밋 54cb4e1)
   · old: "실패 시 멈추고 실패 원문 그대로 보고. 재시도나 복귀 없음 — 인프라 이슈는 오너 진단 영역"
   · new: 실패 시 에러 원문을 코드 문제(타입·빌드·테스트)와 환경 문제(인증·환경변수·웹훅)로 AI 1차 분류. 코드 문제면 공장 복귀, 환경 문제면 원인 후보 좁혀 한계 고지 + 원문 보고. 재시도·자의적 롤백 금지
   · 오너 핑계 문구 제거 → AI·Code 자체 책임 원칙

산출물:
- 수정 MD (실제 반영 — Code git log 교차 검증 완료): .harness/MEMORY.md · md/core/harness.md · md/log/progress.md
- 수정 코드: 없음 (거버넌스 MD-only)

교훈:
- 박제 임계 규칙 첫 적용에서 5건 유지 · 32건 소각 · 1건 통합 박제 구조로 수렴. 1회 박제 누적이 실제 검색 효율·해석 여지를 오염시키는 수준이었음을 축소 폭(83% 삭제)으로 실측
- "오너 핑계" 패턴 제거가 AI 책임 감각 강화로 이어짐 — 실패 분류·한계 고지가 에스컬레이션의 품질 차이를 만듦. harness.md §2 경유 완화(세션 #66)와 §1-6 배포 책임 전환(세션 #67)이 한 방향 정합

다음 세션 1순위: 방향 C-2 근본 원칙 CLAUDE.md·principles.md 상향 통합.

- [2026-04-24] C-2 principles #6 신규 + #5 보강 — MEMORY #54·#55·#66-a 상향 통합 (md/core/principles.md)
