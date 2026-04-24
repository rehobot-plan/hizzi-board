# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-24 세션 #68 (방향 C-2 principles 상향 통합 완료)
- 작업 브랜치: master (로컬·원격 baaf68a 동기)
- 프로덕션: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK · §6 홈 채팅 입력 A안 라이브 (시나리오 1~3 완전 · 시나리오 4 placeholder) — MD-only 세션이라 배포 skip
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW · 기존 설정 유지
- 거버넌스 변경 (세션 #68):
  · principles.md #5 "자동화" 원칙에 MEMORY #66-a 방어선 위치 전환 흡수 — 본문 + 작동방식·예외·근거 사례 확장
  · principles.md #6 "형식은 사실을 대체하지 않는다" 신규 — MEMORY #54·#55 통합 박제
  · 원칙 총 5개 → 6개 (10개 미만 유지)
  · MEMORY 소각 연동: #54·#55·#66-a 3개 섹션 제거 (원칙 상향 후속 정리, 도메인 자율). 신규 박제 0건
- 다음 세션 1순위: 메인 UX 블록 ④ — FAB + CreatePost 재배치
- 후순위 후보:
  · 블록 ③-B — 3층 탭바 "기록" 진입점 + RecordModal 활용
  · 블록 ⑤ — 달력 피어 탭
  · §6 B-1 — LLM 2단 본체 부착 (Anthropic Haiku) · ai-capture-hb.md §9.3
  · §6 수신자·기한·타입 unset 질의 UI 확장 · ai-capture-hb.md §4.2
  · authStore.onAuthStateChanged reload 부작용 (master-debt #14)
  · 거버넌스 잔여 (우선순위 낮음, 필요 시 승격):
    - C-3 공장 6단계 트랙 분리 — 르호봇 착수 전 재점검
    - CLAUDE.md [7] 경계 사례 문구 보강 — 원칙 상향·박제 임계 규칙 적용 결과 후속 정리는 도메인
    - MEMORY 박제 임계 규칙 강화 (D안) — 환원 불가능한 것만 박제
    - MEMORY 잔존 3건 환원 재검토
- 선처리 큐: 기존 유지 (#5 tabbar-sticky.spec 간헐 timeout · #7 Vercel Preview env 불완전)
- 미해결: 기존 유지 (실 Chrome ⋯ handle scroll jump · DevTools Performance 워크플로우 · post-request cascade divergence · serviceAccount.json git history 잔존)

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
> 세션 #66 아카이브: md/archive/progress-2026-04-U.md

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

### [2026-04-24] 세션 #68 — 방향 C-2 principles 상향 통합

Phase: MEMORY 상향 후보 식별 / principles #5 흡수 + #6 신규 설계 / before/after 검수 / str_replace 실행 / MEMORY 소각
브랜치: master (로컬·원격 baaf68a 동기)
커밋: baaf68a

주요 진행:

1. 상향 추출 판정 (기획 대화)
   · MEMORY 6건 전수 판정: #54·#55 → #6 신규 (통합), #66-a → #5 흡수, #50·#52·#51·#66·#61-b → MEMORY 유지
   · 판정 근거: "뿌리 원칙 판단 축이 되는가" + "기존 원칙과 중첩도"
   · #66-a 독립 원칙 세우면 #5와 60%+ 중첩이라 흡수 정합
   · #54·#55는 같은 구조적 한계(Claude.ai Code 터미널 비가시성)의 양면이라 통합 박제

2. principles.md #5 보강 + #6 신규 (커밋 baaf68a)
   · #5: "drift 방어를 사람 개입 루틴에 의존하지 않는다" 선언 + 작동방식·예외·근거 사례 각 1문단 확장
   · #6: 한 줄 선언문 + 작동방식·예외·근거 사례 구조. 실측 선행 필요 지점 기준 명시 ("파일·커밋·세션 기록에 박혀 다음 세션 이후까지 영향")
   · 근거 사례 축적: #5에 세션 #66 7단계 재설계 추가, #6에 세션 #54·#55 사고

3. 경계 사례 발견 — MEMORY 수정이 거버넌스 vs 도메인
   · CLAUDE.md [7] 현재 정의("헤더 규약·운영 조항=거버넌스, 사례 박제·해소=도메인")가 이번 케이스(원칙 상향 결과 소각)에 명확하지 않음
   · 이번 세션 처리: 소각 판단의 근거 규칙(박제 임계)은 헤더에서 이미 거버넌스 검수 완료, 소각 실행은 규칙의 기계적 적용이라 도메인 자율로 진행
   · CLAUDE.md [7] 문구 보강은 거버넌스 수정이라 별도 세션 이관

4. MEMORY 박제 임계 강화 방향 논의
   · 현 "2회 이상 관측" 규칙이 보수적 방향으로 작동해야 할 지점에서 오히려 진입 장벽 낮음 (이번 사이클 3건 상향·3건 유지에서 드러남)
   · D안 제시: 임계 수치 조정 대신 "원칙·규칙 층으로 환원 불가능한 것만 MEMORY에 박제" 원칙 전환
   · 이번 세션 당장 적용: 단계 5 판정에 환원 가능성 점검. MEMORY 잔존 3건 재판정 → 각 항목 환원 가능 층 존재 확인됐으나 환원 작업 자체가 거버넌스 수정이라 이번 세션 범위 밖. 성급한 소각 대신 유지 + 다음 세션 이관
   · 정식 규칙 수정은 방향 C-4로 명명, 다음 거버넌스 세션 이관

산출물:
- 수정 MD (실제 반영 — Code git log + str_replace 경로 교차 검증 완료): md/core/principles.md · .harness/MEMORY.md · md/log/progress.md
- 수정 코드: 없음 (거버넌스 MD-only)

교훈:
- principles 상향 통합에서 "독립 원칙 vs 기존 흡수" 판정이 60%+ 중첩도 기준으로 수렴. 세션 #66~#67의 다이어트 원칙("쌓기 아니라 다듬기")과 정합
- 경계 사례 발견 시 "이번 세션에 붙이지 말고 잔여로 빼기"가 세션 scope 유지에 기여. 방향 C-2 범위에 CLAUDE.md [7] 문구 보강·MEMORY 임계 규칙 강화까지 포함시켰으면 세션 길이 증가·self-modification 비용 발생
- 단계 2 Code 실측 + 단계 3 근거 매칭 첫 실전 적용. principles.md #6 사례로 박제된 구조가 같은 세션에서 검증 장치로 작동 — 구조적 정합
- "신중하게 박제"의 뜻은 "환원 가능성 먼저 묻기"로 수렴. 임계 수치 조정이 아니라 층 소속 명시가 진짜 방어선

다음 세션 1순위: 방향 C-3 공장 6단계 트랙 분리.
