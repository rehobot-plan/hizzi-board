# 히찌보드 — 작업 진행 기록 (세션 #53 아카이브)

### [2026-04-21] 세션 #53 — 메인 페이지 UX 정비 설계 문서 + §8 연동 MD 갱신

Phase: 설계 문서 main-ux.md §0~§8 작성 · 배치 / §8 연동 MD 5건 갱신 / patterns P8·P9 번호 충돌 해소
브랜치: master
커밋 수: 7건 (283ef4f → e885695 → 7905cdb → 120a48c → f6cd02b → ee4d681 → 1ead88d)

배경:
- 세션 #52 마감 시점 "다음 세션 1순위: 메인 페이지 UX 정비 설계 문서 초안" 지시 수용
- 설계 단계에서 범위가 확장 — 3건(§1 패널 높이 + §2 완료·삭제 + §3 요청 봉투) 추가로 §4 FAB + §5 달력 아키텍처 2건 흡수해 5섹션 통합 설계로 귀결
- "이미지로 보여주면 결정에 도움" 요청으로 시각 mockup 적극 활용 — 현재 상태 · 모바일 레이어 배치 · 패널/달력 피어 탭 · 대칭 회수 동선 총 4건
- 세션 중반 오너 "모바일 1인 뷰 = 데스크탑 패널 미니 프리뷰" 프레이밍 제시 → 설계 방향 근본 재정의 → §0 프레이밍으로 박음

주요 변경:

1. md/plan/designs/main-ux.md §0~§8 신규 배치 (283ef4f)
   · §0 모바일 1인 뷰 = 데스크탑 패널 미니 프리뷰 프레이밍
   · §1 패널 높이 max-height: min(600px, 70vh), min-height: 240px
   · §2 완료·삭제 대칭 설계 — 체크/스와이프 + 토스트 5초 / 24h 창 / 기록 메뉴 3층
   · §3 요청 봉투 per-panel 유지 + 완료 알림(U10) 이 범위 편승 (알림 센터 후순위 #5 이관 철회)
   · §4 FAB 패널 내부 context-aware + CreatePost 모달화 재배치
   · §5 달력 피어 탭 통합 (할일/메모/달력) + 나만/전체 이진 토글 + /mydesk/calendar 폐지
   · §6 실행 순서 §1→§5
   · §7 Firestore 스키마 신필드 3종(deletedAt·completedAt·seenAt) 정리
   · §8 연동 MD 갱신 5건 계획

2. §8 연동 MD 5건 갱신 (5 커밋)
   · ux-principles U6·U7·U10·U11 개정 + U12 대칭 설계 원칙 신규 (e885695, +71/-11)
   · patterns P8 FAB + P9 스와이프 신규 (7905cdb, +78)
   · patterns-modal P8·P9·P10 → M1·M2·M3 재배정 + 타 MD 참조 갱신 (120a48c, +8/-8, 4 files)
   · uxui §4 스와이프·FAB 토큰 + §6 패널 스크롤 신설 (f6cd02b, +48/-1)
   · master §4 파일 구조 + §5 의존성 맵 — FAB·RecordModal·스와이프·seenAt 반영 (ee4d681, +13/-7)
   · flows / flows-detail — 3층 복구 cascade 반영 + FLOW 11 완료 알림 🔲 해제 (1ead88d)

3. patterns 네임스페이스 분리 확정
   · P = 상호작용·레이아웃 패턴 (P1~P9 연속)
   · M = 모달 도메인 상세 (M1~M3)
   · 충돌 발견 → 옵션 A로 해소 (모달 M으로 재배정)

산출물:
- 신규 설계 문서: md/plan/designs/main-ux.md (344줄)
- 수정 MD 6건: ux-principles / patterns / patterns-modal / uxui / master / flows(+flows-detail)
- 수정 코드: 없음 (본 세션은 기획·설계 단계)

교훈:
- Code recap이 #52 종료 시점 progress.md 기반이라 세션 #53 중 합의된 내용을 모름 → "통합 vs 분리 판단" 같이 이미 해결된 질문을 recap이 반복 제시. 대응 — Claude.ai가 recap을 참고 정보로만 사용하고 실제 다음 액션은 세션 흐름 기반으로 판단. 세션 종료 후 progress.md 갱신이 이 격차를 해소하는 구조적 장치임을 재확인
- 블록 2 실행 직전 patterns-modal.md P8·P9·P10 존재를 Claude.ai가 놓친 사례. Code가 편집 실행 후 L6 선언부 읽고 충돌 보고 → 정정. 교훈 — str_replace 명령 설계 시 대상 파일뿐 아니라 파일 간 네임스페이스 중복 선행 체크 필수. Code의 현장 grep 탐색이 Claude.ai 설계 공백을 잡아주는 구조가 실제로 작동함을 확인
- 설계 문서 섹션 = 명령 블록 1:1 단순 매핑이 과할 수 있음. §2 같이 범위 넓은 섹션은 실제 구현 시 하위 분해 판단 필요. §1 완료 후 §2 실제 코드 탐색 결과 기반으로 분해 여부 결정하는 C안 확정 — 선행 분해 설계가 실제 코드와 불일치할 위험 방어
- 블록 5 명령 발행 시 Code가 이미 직전 턴에 커밋 1ead88d로 반영한 상태였는데 Claude.ai가 커밋 알림 미확인으로 중복 명령 송출. Code가 "직전 처리 확인, 스킵" 판단으로 noise 방어 — Claude.ai 측 교훈은 "명령 블록 발행 전 직전 Code 보고 재확인" 관습화

다음 세션 1순위: 메인 UX §1 패널 높이 구현 (Panel.tsx · TodoList.tsx · PostList.tsx · tokens.ts)
