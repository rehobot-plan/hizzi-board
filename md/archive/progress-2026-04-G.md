# 히찌보드 — 작업 진행 기록 (세션 #45 MD 재편 · #46 아카이브)

> md/log/progress.md에서 이관된 작업로그. 원본은 해당 세션 블록.
> 이관 시점: 2026-04-20 세션 #47 종료.

---

### [2026-04-20] 세션 #45 — MD 체계 전면 재편 + principles.md 신설

Phase: 인프라 (MD 체계 재편)
브랜치: master
커밋 수: 4건 (e29c28b + 6bba6b6 + 9b3f0e5 + a3094eb)

배경:
- CLAUDE-detail.md가 16KB로 세션 주입 한계 초과 → 구조적 재편 필요
- 하네스 역할 경계 모호 (Code·Codex 혼동) → 공장 비유로 명확화
- MD 수정 시 누락 사고 방지 필요 → before/after 검수 규약
- 뿌리 판단 원칙 보존 필요 → principles.md 신설

주요 변경:
- 파일 체계: CLAUDE-detail.md 해체, session-harness.md → harness.md 개명, session.md 신설, principles.md 신설
- CLAUDE.md: 시니어 솔루션 아키텍트 역할 정의, 한 기능 완결 단위 원칙, MD 수렴 원칙, before/after 검수 규약, progress.md 예외 조항
- harness.md: Code+Codex 공존 구조, 6단계 무조건 원칙, 1-4 3축 리뷰 (가동/기능/디자인 + R4.10 복원), 1-5 E2E 저장 경로·보존 정책, 1-6 배포+보고 통합 (progress.md 직접 업데이트), 오너 에스컬레이션 규약 (ask-claude.js 경유 강제)
- session.md (신설): 세션 시작 5개 파일 순서 로드, 12단계 세션 종료 통합 제안 방식, 프리셋 A/B 모드
- rules.md: R4.12 폐기, 명령 블록 섹션 재작성
- commands: start-session.md 5개 파일 로드, close-session.md 폐기
- principles.md (신설): 5개 뿌리 원칙 — 규칙 우선 / 개념보다 시스템 / 작은 것도 쌓이면 / 스페셜리스트 / 문서보다 자동화

산출물:
- 수정: md/core/CLAUDE.md, md/core/harness.md, md/core/rules.md, .claude/commands/start-session.md, md-presets/presets.json, md-presets/_staging/ 미러 일괄
- 추가: md/core/session.md, md/core/principles.md, md-presets/_staging/session.md, md-presets/_staging/principles.md
- 삭제: .claude/commands/close-session.md, md/core/CLAUDE-detail.md (세션 초반)
- 안전 태그: pre-md-reform (cd67248)

교훈:
- "효율을 넣으니까 일레귤러가 생긴다" — 예외 구멍은 관습 회귀의 입구
- "개념 말고 시스템으로" — 행동 단위까지 내려가야 해석 없이 돌아감
- 파일 도구로 긴 문서 작업 시 토큰 5~10배 절약 (블록 전체 재생성 vs str_replace 부분 수정)
- Pre-flight 단계가 실제로 작동함 — CLAUDE.md 경로 불일치(루트 vs md/core)를 사전 포착

다음 세션:
- Phase H-2 TabBar top-fixed positioning (Hizzi Board)
- 또는 hana-vote 장로 선거 `totalParticipantsByPart` 스키마 마이그레이션 (긴급도에 따라)

### [2026-04-20] 세션 #46 — H-1 재조정 + MD 경계 3차 + E2E 복구 + H-2 (밀도 높은 통합 세션)

Phase: H-1 재조정 / MD 체계 / 1-5 E2E 복구 / H-2
브랜치: master
커밋 수: 11건 내외

배경:
- 세션 #45 Phase H-1 완료 직후 스크린샷에서 공통 Header 신규 흰 바와 홈 페이지 내부 박스 중복 발견
- 오너 의도(기존 박스 sticky화)와 header.md 설계(신규 바 생성) 불일치 — 설계 간과 지점
- 세션 중 Claude.ai가 구현 구조(hook 호출 순서·store 구문)까지 지정하는 패턴 감지 → MD 경계 다층 정비
- Code의 1-5 독단 보류 + Claude.ai의 오너 작업 재전가 — 스페셜리스트 경계 역방향 위반
- H-1 재조정 후 H-2 이어 진행

주요 변경:

1. MD 경계 1차 — 소통 관행 규약화
   · CLAUDE.md [3] "Code 전달 명령 블록은 코드 펜스로 감싼다"
   · CLAUDE.md [3] "협의 확정된 명령 블록 앞뒤로는 설명을 덧붙이지 않는다"

2. Phase H-1 재조정 (커밋 6152dc7 + 후속 배경 보완)
   · Header 56 → 72px, 배경 흰 → #FDF8F4
   · 좌측 "Hizzi is happy, and you?" 고정 문구 (경로별 동적 매핑 폐기)
   · 우측 관리자 모드(홈+admin) + 로그아웃, 사용자명 제거
   · adminModeStore.ts 신설 (Zustand 전역)
   · page.tsx 내부 <header> 블록 제거, handleLogout 제거
   · header.md v2 전면 갱신, playwright-header-title.spec.js 폐기

3. MD 경계 2차 — 무엇·왜 vs 어떻게 경계 명시
   · CLAUDE.md [1] "시니어 솔루션 아키텍트" → "설계 리드", 명령 블록 4요소(기능 의도·판단 근거·영향 범위·검수 포인트) 구조화, "내 제약은 표현 능력이 아니다" 삭제
   · rules.md 명령 블록 체크리스트에 "구현 구조·변수·함수 시그니처·API 호출 패턴 지정 금지" 추가
   · principles.md 4번 스페셜리스트 작동 방식·근거 사례 보강
   · harness.md 0번 경계에 구현 구조 지정 금지 문단 추가

4. 1-5 E2E 인프라 복구 + MD 경계 3차 (커밋 a9ea4a7)
   · principles.md 4번에 "Claude.ai는 오너에게 작업 지시하지 않는다" 경계 + 근거 사례 추가
   · tests/utils/testUsers.ts 신설 (firebase-admin 일반 계정 upsert)
   · tests/utils/auth.ts loginAs 파라미터화
   · tests/smoke/header-h1-rework.spec.ts 5 시나리오 PASS
   · 프로세스 검증: ask-claude.js 경유 실제 작동 확인 (공장 복귀 루트)

5. Header sticky 배경 보완
   · transparent → #FDF8F4 불투명 처리 (sticky 시 콘텐츠 비침 해결)

6. Phase H-2 (커밋 87157da + dd4b454)
   · TabBar wrapper sticky top:72 zIndex:40, 배경 #FDF8F4, 좌우 패딩 내부화
   · mydesk layout flex 구조 전환 + px-8 pb-8 재분배
   · tests/smoke/tabbar-sticky.spec.ts 3 시나리오
   · 전체 E2E 9/9 PASS (H-1 rework 6 + H-2 3)

산출물:
- 수정 MD: CLAUDE.md / rules.md / principles.md / harness.md / md/plan/designs/header.md
- 수정 코드: Header.tsx / page.tsx / mydesk/layout.tsx / TabBar.tsx
- 신규 코드: src/store/adminModeStore.ts
- 신규 테스트: tests/utils/testUsers.ts / tests/utils/auth.ts / tests/smoke/header-h1-rework.spec.ts / tests/smoke/tabbar-sticky.spec.ts
- 삭제: tests/playwright-header-title.spec.js

교훈:
- "설계 기획"의 "설계"를 Claude.ai가 "구현 구조 설계"로 해석하며 공장 영역을 외부에서 미리 박는 미끄러짐. 경계 문서 4개 층 동시 수정으로 고정
- Code의 1-5 독단 보류는 하네스 규정 위반, 복구 주체는 공장. Claude.ai가 오너 수동 확인으로 떠넘긴 것도 스페셜리스트 경계 역방향 위반
- 공장 이탈 방지 안전장치를 Claude.ai 쪽 명령 블록 프리앰블로 쌓으려 한 패턴 — 공장 이탈은 공장 내부 하네스 점검으로 푸는 게 맞음. 이 구분 자체가 Claude.ai의 반복 취약점
- 한 패턴의 미끄러짐은 CLAUDE·rules·principles·harness 네 층 동시 수정이 효과적. 단일 수정은 해석 여지 남김
- "책임지려 하지 마" 피드백 직후 구현 명세 제거 → 응답 속도·오너 검토 부담 체감 개선

다음 세션:
- Phase H-3 Sidebar 전체 고정 적용 (또는 hana-vote 장로 선거 스키마 마이그레이션 긴급도 판단)
