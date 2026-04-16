# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-15 세션 #24 (종료)
- 작업 브랜치: master (13df313 — feat/fullcalendar-poc FF 머지 완료)
- 진행 중: master 머지 완료. 길 B-3 진입 대기.
- 다음 TODO:
  1. 수정 팝업 3종 재설계 — 길 B-3 (TodoItem 3모달 분리 + Radix 전환)
     · B-1: ✅ 완료 (commit bb21291 → 재작성 후 15a3caa)
     · B-2: ✅ 완료 (commit a82ed49 → 재작성 후 dc9fc37)
     · B-3: TodoItem 3모달 분리 + Radix 전환 (최고 위험) ← 다음 진입
     · 별도 트랙: vaul 모바일 바텀시트는 모바일 우선 최적화 단계까지 보류
  2. 실작업 복귀: 첨부파일 다중 업로드 / 댓글 기능 / 완료 알림 토스트 (모바일 우선 축으로 재판정)
  3. 요청 댓글 질의응답 — 데이터 모델 변경 + 통합 댓글 스레드 (길 B 재설계와 병합 검토)
  4. close-session 인박스 강제 검증 게이트 추가 (인프라, 짬 작업)
- 미해결:
  - md/core/master.md 15~17행 인코딩 깨짐 잔존 (경미)
  - close-session.md ↔ session.md [4] 드리프트 3건 (인박스 등록)
  - src/components/ImageViewer.tsx 루트/common 중복 (경미, 별도 세션)
  - src/components/TodoItem.tsx 상세/편집 모달 내장 (유지)
  - Vercel Hobby 플랜 Preview 자동 SSO 정책 (Deployment Protection Disabled 필요)
  - filter-branch refs/original/ + backup 브랜치 2개 로컬 잔존 (정리 대상)
- 참고: 프리셋 시스템 단일화 완료. `프리셋` 한 단어로 current 엔트리 실행.
- 검토 후보 (조건부 진입):
  - FullCalendar 미활용 기능 7건 (master 머지 + 디자인 통일 완료 후)
    · 추천 순서: iCal 공휴일 피드 → 드래그 → 리사이즈 → rrule → 주간 뷰 → 검색 → 타임존
    · 각 후보 R4.9+R4.10 순서, 단일 세션 1건씩
    · 3/4/5 는 스키마 변경 동반
  - R4.10 preflight 훅 구현 (N/M PASS 카운트 검증)
  - 토큰 소비 최적화 — progress.md 현재상태/작업로그 분할 (장기 누적 시 재검토)
    · R4.10-가/나 텍스트 반영 후 1~2세션 관찰 → 개선 불충분 시 훅으로 승격
    · 세션 #18에서 1차 분할 실행 (#1~#12 → archive). 추가 분할 또는 훅 승격 판단 보류 중
  - 요청 UI 재설계 (길 B) — Phase 5-C 완료 후 새 방
    · 진입 버튼 카운트 분리(받은 N + 변동 M) / 토스트 다리 / cancel_requested + 통합 댓글 스레드
    · 데이터 모델 변경 동반 → flows + master-schema + todoRequestStore 첨부 필요
    · 병합 메모: 요청자 ↔ 수락자 상호작용 플로우 전반 재검토 포함. 수정·보완 범위 초과 시 재설계로 승격.
  - 일반 메모/할일 완료·삭제 UX 점검 (조건부)
    · 진입 조건: 요청 UI 재설계 후 + 사용자 구체 사례 1~2건 확보
  - Phase 5-C 잔존 정리 (3-pass 완료 후 일괄 안건)
    · tokens.ts 미존재 hex 일괄 신규 토큰 승격 (#17 작업로그 23건 + #16 후속 8종)
    · CalendarEventBadge 프리미티브 추출 (AddEventModal 미리보기 ↔ CalendarGrid renderEventContent 로직 중복)
    · AddEventModal 구분 버튼 색 P2 정합성 확인 (현재 카테고리 태그 아닌 캘린더 이벤트 색 사용)
  - Phase 6 잔여 파일 토큰화 (14파일, 약 465행)
    · 대상: LeaveManager / page.tsx / leave/page.tsx / PostEditModal(잔여) / TodoRequestModal / NoticeArea / PostList / Panel / DeletedTodo / CompletedTodo / login / signup / PostItem / TodoRequestBadge
    · 진입 조건: 머지 완료 후
    · 모바일 리팩터링과 겹치는 파일은 그쪽 세션에 흡수 검토
  - 기능별 색상 일치화 (설계 세션 필요)
    · 목적: 같은 기능은 같은 색으로 통일 → 색만 보고 기능 즉시 인지
    · 대상: patterns.md P2 좌측 띠 + uxui.md 4번 색상 의미 시스템 +
      게시물 모달 / 달력 모달 / 달력 이벤트 / 할일 / 요청 전반
    · 성격: 기계적 치환 아님. 설계 세션 필요
    · 진입 조건: 길 B 시리즈 완료 + 머지 완료 후
    · 선행 작업: Claude가 "어느 기능이 어디서 어떤 색으로 나오는지"
      현황 스캔표 작성 → 오너가 통일 기준 결정 → 토큰 조정
  - 백업 브랜치 + refs/original/ 정리 (2026-04-22 이후)
    · backup/before-author-rewrite-20260415 + -master (2개)
    · refs/original/ 6개 ref (filter-branch 백업)
    · 일주일 경과 후 문제 없으면 삭제
  - 데이터 정리 작업 — Production Firestore (별도 세션 필수)
    · 달력: 연차 자료만 남기고 나머지 calendarEvents 삭제
    · 게시물: posts 컬렉션 전체 삭제
    · 사용자 정보(users): 절대 건드리지 않음
    · 진입 조건: Firestore 백업 절차 설계 + 팀원 공지 합의 + dry-run 검증
    · 영향 범위: Calendar / PostList / 관련 store
  - 프리셋 운용 팁 — Dropbox 동기화 지연 대응
    · 프리셋.ps1 실행 후 Dropbox 트레이 동기화 완료 확인 후 새 방 시작
    · _staging\progress.md 크기 사전 확인 권장
    · session.md [4] 종료 규약에 한 줄 추가 검토
  - untracked md 파일 정리 (10건 누적, 별도 세션)
    · 진입 조건: 어느 파일이 의도된 신규 / 의도되지 않은 잔재인지 분류
    · 영향 범위: md/ 하위 전체

---

## 장기 방향성

> 모든 세션의 작업이 이 축 위에서 움직인다. 단일 세션 작업이 아닌 지속 발전 대상.

- **AI 챗봇 인터페이스 전환** — 할일/달력 세팅 마무리 후, 각 기능을 AI 챗봇으로 구동하는 구조로 전환. 하이브리드 로직(기본 규칙 로직 + AI 판단 로직 병행)으로 토큰 최소화. 입력은 단순하게, 구동은 최적·최고로.
- **모바일 우선 최적화** — 히찌보드·Rehobot 공통 전제. 기본 사용 환경이 모바일, 데스크톱은 보조. 할일/달력/AI 챗봇 다음으로 이어지는 작업 축.

---

## 작업로그 (날짜/세션 단위 append — 삭제 금지)

> 세션 #1~#12 아카이브: md/archive/progress-2026-04-A.md
> 세션 #13~#23 아카이브: md/archive/progress-2026-04-B.md

### [2026-04-15] 세션 #24 — feat/fullcalendar-poc → master 머지 + git author 일괄 재작성

준비
- 길 B-3 선행 조건 해소 목적
- git author dev@hizzi-board.local 273건 일괄 재작성 동반 결정

실행 (6단계)
1. 정찰 — feat 51 commits ahead, dev@ author 273건 확인
2. 백업 — backup/before-author-rewrite-20260415 (b3c87e9) + -master (323586d)
3. author 재작성 — git filter-branch 사용, 양 브랜치 0건 잔존 ✅
4. master fast-forward 머지 — 33 files, +3,749 / -1,704
5. force push — origin master 신규 + feat forced update (b3c87e9 → 13df313)
   · --force-with-lease 거부 (filter-branch가 remote tracking ref 재작성)
   · --force 사용. 단독 작업이라 실질 위험 없음
6. 검증 — 원격/로컬 13df313 일치, author oilpig85@gmail.com 단일

Vercel + GitHub 정리
- GitHub 기본 브랜치 main → master 변경 (281 commits ahead 상태 해소)
- Vercel Production Branch 자동 인식 → master 배포 Promote to Production
- https://hizzi-board.vercel.app 동작 확인 PASS

교훈
- filter-branch는 remote tracking ref도 재작성 → --force-with-lease 거부 정상 동작
- GitHub 기본 브랜치 main 잔존 = Vercel production 미트리거 근본 원인. master 머지만으로는 부족했음
- Vercel Promote 6회 중복 클릭 자국 → 첫 클릭 후 반영 시간 1~2분 대기 안내 필요 (다음 머지 시점 인계)
