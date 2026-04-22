# 히찌보드 — 작업 진행 기록 (세션 #48 아카이브)

### [2026-04-20] 세션 #48 — 프로필 시스템 P-3 완결 + 단위 테스트 레이어 신설

Phase: P-3 / P-3 보정 1·2 / P-3 확장 / CI 통합
브랜치: master
커밋 수: 약 8건

배경:
- 세션 #47에서 프로필 시스템 P-1/P-2까지 완료, P-3 패널 노출이 다음 순위로 남은 상태
- P-3 E2E 시나리오 2가 admin photoURL 업로드에 의존해 통과 — 6인 전원 업로드 시 무력화 위험 노출
- 오너 방침("작은 균열 누적 비용 > 러너 도입 1회 비용")에 따라 단위 테스트 러너 도입 결정
- P-3 완료 후 오너 요청으로 패널 소유자 명함(부서·직책) 확장

주요 변경:

1. Phase P-3 패널 제목 옆 프로필 사진 (7439cb7 + 375a72c)
   · Panel.tsx 제목 행 재구성 — flex items-center gap-3, Avatar 40px 좌측 배치
   · useUserStore 구독으로 ownerEmail → user 문서 연결
   · tests/smoke/panel-profile-p3.spec.ts 3 시나리오 신설
   · Avatar(P-2 산출물) 재사용 — 신규 컴포넌트 없이 size만 변경

2. P-3 보정 1: E2E 시나리오 2 시드 독립화 (86be3d2)
   · admin photoURL 업로드 의존 제거 — "최소 1개 data-empty=true"에서 "아바타 요소 렌더 존재"로 축소
   · 분기 검증은 단위 테스트 레이어로 이관 결정

3. P-3 보정 2: Vitest + @testing-library/react 도입
   · devDependencies: vitest 4.1.4 / @testing-library/react 16.3.2 / @testing-library/jest-dom 6.9.1 / @testing-library/dom 10.4.1 / jsdom 29.0.2 / @vitejs/plugin-react 6.0.1
   · vitest.config.ts 신설 (jsdom 환경 + @/ alias + setupFiles)
   · tests/unit/setup.ts, tests/unit/Avatar.test.tsx 3 케이스 (photoURL 빈값/URL/undefined)
   · playwright.config.ts testIgnore에 **/unit/** 추가 (러너 충돌 방지)
   · package.json test:unit / test:unit:watch 스크립트
   · R4.10 검증: 기댓값 'true'→'false' 변경 시 1 FAIL, 원복 시 3 PASS — 코드 매칭 아닌 실행 반응성 입증

4. CI 통합 옵션 A (cf26476)
   · .github/workflows/ci.yml build job에 Unit tests 스텝 직렬 추가
   · needs: build 구조상 unit FAIL → e2e job 자동 스킵
   · 실패 해석 순서: 빌드 → 단위 → 통합 단계별 국소화

5. P-3 확장: 패널 소유자 명함 (13cb619 + 596f35c)
   · Panel.tsx에 ownerMeta = [department, position].filter(Boolean).join(' · ') 로직
   · 제목 행 내부 flex-col 스택 (상 패널명 / 하 명함)
   · 명함 스타일 11px / weight 400 / #9E8880 (uxui.md §3 메타 토큰)
   · data-testid="panel-owner-meta"
   · tests/smoke/panel-profile-p3.spec.ts 시나리오 4 신설 — computed style + boundingBox 시드 독립 검증
   · 3분기 렌더: 둘 다 없음 → 비렌더 / 한쪽만 → 구분자 없이 값만 / 둘 다 → 가운뎃점 연결

산출물:
- 신규 컴포넌트: (없음 — Avatar 재사용)
- 신규 유틸: (없음)
- 신규 인프라: Vitest 단위 테스트 레이어 (vitest.config.ts / tests/unit/)
- 신규 테스트: Avatar 단위 3 케이스 / panel-profile-p3 시나리오 1·2·3·4 (4건)
- 수정 MD: progress.md

교훈:
- 테스트가 시드 데이터에 결합되면 "지금 통과"는 "내일 통과"를 보장하지 않음 — E2E 시나리오 2 건은 R4.10("단일 케이스 통과 아님")의 시드 독립성 차원 확장 사례
- 분기 로직은 컴포넌트 단위 테스트가 자연스러운 층위. E2E는 "존재"를 검증하고 단위는 "분기"를 검증하는 분업이 검증 공백을 메움
- 러너 도입 결정은 "한 컴포넌트를 위한 비용"이 아니라 "누적된 검증 공백 해소"의 관점으로 내려야 함 — 오너 방침이 그 전환점을 만듦
- 공장이 완화 제안(시나리오 2 "최소 1개")을 올렸을 때 Claude.ai가 잡지 못한 게 이번 보정의 출발점 — 공장의 PASS 판정을 Claude.ai가 한 번 더 거르는 레이어 필요성 체감

다음 세션 1순위: Phase R-3 오늘 탭 재편 (md/plan/designs/mydesk.md §11)
