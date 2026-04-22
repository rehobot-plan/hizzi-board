# 히찌보드 — 작업 진행 기록 아카이브 (2026-04 세션 #47)

이 문서는 md/log/progress.md 작업로그에서 이관된 세션 #47 블록을 보관한다.

---

### [2026-04-20] 세션 #47 — 레이아웃 스택 완결 + 요청 도메인 정리 + 프로필 시스템 P-1/P-2

Phase: H-3 / R-1 / 선처리 큐 1번 / R-2 / profile.md 설계 / P-1 / P-2 / rules 확장
브랜치: master
커밋 수: 약 20건

배경:
- 세션 #46 완료 상태에서 레이아웃 패턴 B 스택의 마지막 조각(H-3 Sidebar 고정) 잔존
- 요청 도메인 MY DESK 수렴(R-1·R-2)이 Phase 재정렬상 다음 차례
- R-1 완료 시점에 선처리 큐 1번(RequestDetailPopup 2단) 전제 해소 → 즉시 진행
- R-2 후 오너 요청으로 프로필 시스템 도입 — 설계 문서 신설 후 P-1/P-2 순차 진행
- P-2 배포 후 permission denied 발견 → rules 우회 1건

주요 변경:

1. Phase H-3 Sidebar 전체 고정 (26016d0)
   · sticky top:0 height:100vh, overflowY:auto, 3분할 구조 (주요 / 기타 mt-auto / 아바타)
   · header.md §7 H-3 완료 기준 충족
   · 레이아웃 패턴 B 스택 완성 (Header 72px + TabBar 48px + Sidebar 180px × 100vh)

2. Phase R-1 RequestView 공통 컴포넌트 (d6ab5af)
   · src/components/request/RequestView.tsx 신설
   · /request·/mydesk/request 두 경로 동일 렌더
   · 동일 번들 크기 227kB로 컴포넌트 재사용 검증

3. 선처리 큐 1번 RequestDetailPopup 2단 3:7 (046b0a9)
   · Dialog.Content maxWidth 520→860, flex basis '0 1 30%' / '0 1 70%' 명시
   · 모바일 <768px column 전환
   · flex shorthand '3 1 0' 해석 이슈를 basis 명시로 회피 (2회 실패 후 구조 전환)

4. Phase R-2 사이드바 정리 + MY DESK 3뱃지 (0feac19)
   · Sidebar menuItems에서 /request 제거, isActive에 /request/* 흡수
   · 받은/보낸/진행 3뱃지 (mydesk.md §1.1 명세)
   · commentStore 의존성 완전 제거 (Sidebar 유일 consumer 확인)

5. profile.md 설계 문서 신설 (2278dce)
   · §1~§12 12섹션, 145줄
   · 스키마 확장(photoURL·department·position) + Storage 경로 + 크롭 UI + 모달 + Header 재수정 + Sidebar 아바타 제거 + 패널 노출 명세
   · P-1/P-2/P-3 Phase 분할 명시

6. Phase P-1 프로필 시스템 기반 (15c4e83)
   · AppUser 타입 3필드 추가 (optional string)
   · scripts/migrate-users-profile.ts — 8건 전수 업데이트
   · storage.rules profiles/{uid} 경로 + firebase.json 연결
   · react-easy-crop 5.5.7 설치

7. Phase P-2 프로필 UI 통합 (6afd97b + 138c424)
   · Avatar.tsx 공통 컴포넌트 (photoURL / 기본 "?" 분기, size 가변)
   · ProfileEditModal.tsx — useEscClose, 500x500 JPEG, 4필드 편집
   · cropImage.ts canvas 유틸
   · Header 우측 [아바타+이름] 진입점 추가
   · Sidebar sidebar-avatar 제거 (3분할 → 2분할)
   · sidebar-sticky 시나리오 3 회귀 수정을 별도 커밋으로 분리
   · header.md §2.2 동기화

8. firestore.rules users email 기반 허용 확장
   · 배경: 배포 후 permission denied 발생
   · 원인: users 문서 ID 3종 공존(uid 3건 + auto-ID 3건 + orphan_ 2건), rules의 auth.uid == userId 단일 조건 불충족
   · 수정: request.auth.token.email == resource.data.email 조건 추가
   · 부채 등록: users ID 통일 마이그레이션 별도 세션 필요

산출물:
- 신규 컴포넌트: Avatar / ProfileEditModal / RequestView
- 신규 유틸: cropImage / migrate-users-profile
- 신규 설계 문서: profile.md
- 신규 E2E: sidebar-sticky / request-r1-routes / request-popup-two-column / sidebar-r2-badges / profile-p2 (합계 약 20 시나리오)
- 수정 MD: progress.md / header.md / profile.md (신규)
- Rules 배포: storage.rules / firestore.rules 2회

교훈:
- 설계 문서 선행(mydesk.md·header.md·profile.md)이 구현 블록 정합성에 결정적 — 탐색 공회전 없이 진행
- flex shorthand 해석 브라우저 의존 → basis 명시로 회피 (CLAUDE.md [3] "2회 실패 시 구조적 원인" 실제 작동 사례)
- rules "누가 본인인가" 판정은 ID 체계와 직결. 마이그레이션 부채가 rules 복잡화로 표면화
- 오너의 "되돌아가기" 유연성(뱃지 레이블화 논의 자발 롤백)이 플랜 MD의 "기준선" 가치를 살림
- 플랜 MD의 진짜 가치는 "계획대로 간다"가 아니라 "변경 시 영향 범위 계산"
- 긴 세션에서 Claude.ai 되묻기를 줄이고 제안+이유로 결론내는 모드가 효율적 (닫힌 범위 프로젝트 한정)

다음 세션 1순위: Phase P-3 패널 프로필 노출 (profile.md §9)
