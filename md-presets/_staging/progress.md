# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-22 세션 #59 (인프라 장기 과제 완결 · 4세션 연속 시달리던 배포 파이프라인 정상화)
- 작업 브랜치: master (로컬·원격 2f65002 동기 · backup/flatten-2026-04-22 = 14ab3e7 보존)
- 프로덕션 서비스: hizzi-board.vercel.app + hana-vote.vercel.app 200 OK · 블록 ② 활성 상호작용 반영 완료 · Firebase 데이터 로드 정상
- Vercel 프로젝트: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW (세션 #58 재생성) · Production env 6개 정상 (API_KEY 오타 정정 완료) · 최신 배포 hizzi-board-gte3uvuz7-rehobot · Deploy Hook `tB2B4PASNi` 확보 · Framework Preset = Next.js
- 다음 세션 1순위: 연차 내역-달력 표시 불일치 조사 (기존 케이스 1건 시작점)
  · 증상: 연차 내역에 사용 기록은 반영됐는데 달력에 해당 이벤트가 표시되지 않는 특정 항목 존재
  · 범위: LeaveManager · 연차 사용 저장 경로 + 달력 이벤트 저장 경로 상태 전환 체인 · Firestore 실제 payload 확인
  · 영향 파일: src/app/(main)/leave/page.tsx · src/store/leaveStore.ts · calendarStore 상호작용 · 연차 사용 cascade 경로
  · 연동 문서: flows.md 상태 전환 요구사항 / master.md 구조 인덱스
  · 선행 조건: 오너 재현 케이스 1건 공유 (연차 내역엔 있고 달력엔 없는 특정 항목 식별 · 사용자·날짜·종류)
- 후순위 후보: 메인 UX §2 블록 ③ 회수 동선 (main-ux.md §2.3·§2.5) · 세션 #55 기준 1~6
- 선처리 큐: 세션 #55 기준 #1~#4 유지 + #5 (세션 #56) + #7 (세션 #58) · #6·#8 해소
  5. tabbar-sticky.spec 전체 smoke 직렬 실행 시 간헐 timeout (세션 #56 · 유지)
     · 격리 반복 30/30 PASS · git diff 영향 경로 0 · flaky 확정
     · 원인 후보: dev server warm-up / beforeAll 로그인 타임아웃 편차 / 순차 86 스펙 중간 resource pressure
  6. [해소 · 세션 #59] Vercel CLI 배포 3초 deploy_failed 빈 메시지 flaky
     · 세션 #58 새 프로젝트 재생성 후에도 재현 → 플랫폼 레벨 의심으로 박제
     · 세션 #59 실제 원인: 새 프로젝트 기본값 함정(Framework Preset 미설정 · Deployment Protection · Git 연결 불안정 · Deploy Hook 공란) 복합. Framework Preset = Next.js 지정이 결정타. 이후 CLI · Deploy Hook · GitHub auto-deploy 모두 정상 동작 확인
  7. Vercel 새 프로젝트 env 환경별 불완전 (세션 #58 신규 · 유지)
     · Production 6개 완비 (세션 #59에서 API_KEY 오타 정정 완료)
     · Preview 0개 (vercel env add preview가 git branch 프롬프트 요구, stdin pipe 자동화 실패)
     · Development 5개 (API_KEY 누락 — BOM 초기 이슈 잔존)
     · 영향: Preview/Development 환경 배포 시도 시 Firebase 초기화 실패 가능. Production 배포엔 영향 없음
  8. [해소 · 세션 #59] GitHub Repository Rules normal push rejection
     · 세션 #58에서 "Repository Rules 추정"으로 박제
     · 세션 #59 실제 원인: GitHub Secret Scanning이 serviceAccount.json의 Firebase Admin SDK 키 감지. 오너가 키 회전(GCP Console 구 키 삭제 + 새 키 발급) + bypass URL 클릭으로 해소. .gitignore + git rm --cached 후속 처리 완료
- 미해결:
  - post-request cascade 실패 시 divergence 가능성 — master-debt #8 (일괄 전환 시점 미정)
  - serviceAccount.json git history 잔존 — master-debt #10 (키 회전으로 위험 중립화, 깔끔 제거는 우선순위 낮음)
  - auto-deploy 트리거 검증 절차 harness.md §3 편입 — master-debt #9 (부분 해소, 실측 단계 명시화 남음)

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

- [2026-04-22] 세션 #57 인프라 복구 (ecadf91 원격 push + 원본 폴더 경유 Vercel prod READY) — fresh clone + 워킹 트리 tar 복사 + flat commit + harness.md §3 git push 게이트 + 선처리 큐 #6(hizzi-board-new CLI 배포 실패)

### [2026-04-22] 세션 #58 — 인프라 대정리 · git 평탄화 + Vercel 프로젝트 재생성 · 배포 파이프라인 미복구

Phase: 폴더 rename 후 종합 점검 / master git 이력 평탄화 / Vercel 프로젝트 완전 재생성 / Env Vars 재등록 / GitHub Rules·CLI flaky 2축 블로커 표면화
브랜치: master (로컬·원격 a63f2ea · backup/flatten-2026-04-22 14ab3e7 박제)
커밋 수: 2건 (14ab3e7 · a63f2ea) → 최종 a63f2ea만 원격 반영 (force push)

주요 진행:

1. 폴더 rename 후 종합 점검
   · CWD D:\Dropbox\Dropbox\hizzi-board · git remote 정상 · HEAD = origin/master · fsck 클린 · node_modules·.next 존재
   · .vercelignore untracked 감지 → 커밋·push 진행 (14ab3e7)

2. Vercel CLI 배포 재현 실패 → 가설 전환
   · npx vercel --prod 실행 · 3초 deploy_failed 빈 메시지 (세션 #57 선처리 큐 #6 증상 그대로)
   · 배포 이력 조회: ecadf91 이후 12h 사이 Ready 2건 / Error 8건 실패율 급증 관측
   · 오너 가설 "master 과거 문제 연관" 부분 검증 → 옵션 B (master 평탄화) 합의

3. master 평탄화 force push (a63f2ea)
   · backup/flatten-2026-04-22 14ab3e7 박제 후 원격 push (되돌림 경로 확보)
   · git reset --soft d39f828 → 워킹트리 그대로 단일 commit (216 files · 23476 insertions · 1937 deletions)
   · npm run build PASS 재검증
   · .claude/settings.json deny 규칙 때문에 --force-with-lease도 차단 → 오너 직접 터미널 실행 (! 프롬프트 입력)
   · 재배포 시도 → 동일 flaky 재현 → git 이력 원인 가설 기각

4. Vercel 프로젝트 완전 재생성 (옵션 ②)
   · Phase A (오너 대시보드): 기존 hizzi-board 삭제 → 동일 이름 신규 생성 → GitHub 연결 → Deploy
   · 환경변수 전수 파악 보고: .env.local 8변수 · .env.vercel.local Vercel pull 백업 · 코드 참조 12변수 중 필수 6개 식별
   · Phase B (Code 재링크): .vercel/ 삭제 → vercel link --yes --project hizzi-board → 새 projectId prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW 확인

5. Env Vars CLI 일괄 등록
   · 첫 시도: loop로 6×3 env 추가 → Production 5개만 등록 (API_KEY 누락) · Preview 0개 · Development 5개
   · 누락 원인: .env.local UTF-8 BOM (\xEF\xBB\xBF)으로 첫 변수 grep 매치 실패 + Vercel env add가 빈 값 action_required 응답
   · 복구: .env.vercel.local (Vercel CLI 생성 BOM 없음) 에서 sed 추출 · API_KEY 단건 재시도 성공 · Production 6개 완비
   · Preview·Development 불완전은 선처리 큐 #7로 이관

6. 재배포 CLI 실패 반복 → GitHub push rejection 표면화
   · 새 프로젝트에서 --prod 3회 시도: 1회는 Export encountered errors 빌드 에러 원문 (Duration 1m) · 2회는 3초 빈 메시지 flaky 회귀
   · 같은 코드·같은 env 조합에서 배포 단계 실패 양상이 달라 "플랫폼 레벨 flaky" 가설 강화
   · GitHub 연결 idempotent 체크 (vercel git connect) → 기존 연결 유지 확인
   · empty commit push 테스트 → push declined due to repository rule violations 거부
   · force push 통과 / normal push 거부 비대칭 → GitHub Repository Rulesets 추정 (선처리 큐 #8)

검증:
- npm run build PASS (master 평탄화 후 재검증)
- Vercel Production CLI 배포 0/3 PASS · inspect --logs 빈 반환
- vercel env ls production 6개 확정 확인
- GitHub auto-deploy 트리거 실측 불가 (push rejection으로)

산출물:
- 수정 코드: .vercelignore 신규 (14ab3e7에 포함 → 이후 a63f2ea에 병합)
- 수정 MD: md/log/progress.md · md/core/master-debt.md · .harness/MEMORY.md · md-presets/presets.json · md/archive/progress-2026-04-O.md (세션 #58 종료 단계)
- 신규 보존: .env.vercel.local (gitignored · Firebase 키 평문 백업) · backup/flatten-2026-04-22 원격 브랜치
- Vercel 프로젝트 교체: prj_ZpjdBuRFjNBkborR2uktf2UW9ZUM → prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW

교훈:
- "커밋 원활" 목표가 세션 내 다단 레이어로 계속 이동 — git 이력(기각) → Vercel 프로젝트(재생성 완료) → Env Vars(BOM 해소) → 빌드 에러 1회 표면화 → flaky 회귀 → GitHub Rules. 한 세션 내 완결 불가. 각 레이어 해소가 다음 레이어를 노출하는 구조라 "한 세션 = 한 레이어" 분리 계획 필요 (MEMORY.md 신규 항목)
- .env.local 첫 줄 UTF-8 BOM이 grep/sed 매칭을 은밀히 실패시킴. Windows 환경 env 자동화 시 `od -c | head -1`로 BOM 사전 체크 표준화. Vercel CLI 생성 파일(.env.vercel.local)은 BOM 없어 대체 소스로 안전 (MEMORY.md 신규 항목)
- Vercel CLI env add가 Preview 환경에 대해 git branch 프롬프트를 요구. stdin pipe 자동화 실패. --gitbranch 지정 또는 대시보드 Paste .env 우회 필요
- .claude/settings.json deny 규칙(git push --force*)이 --force-with-lease까지 차단. 오너 명시 승인으로 대체 진입점(! git push ...) 활용. 규칙 유지는 안전장치 기조와 정합 (MEMORY.md 신규 항목)
- Vercel 프로젝트 재생성 후 CLI flaky 계속 재현 → 프로젝트 캐시 이슈 가설 기각. 계정 또는 플랫폼 레벨 이슈로 재분류. 대시보드 직접 열람이 다음 세션 1순위 안건

다음 세션 1순위: Vercel 배포 파이프라인 복구 — (a) GitHub Repository Rules 상태 확인 + normal push 회복 / (b) Vercel 대시보드 67cv9o11r 빌드 로그 상세 원인 확보 / (c) Ready 1건 확정 + alias 교체

### [2026-04-22] 세션 #59 — 인프라 장기 과제 완결 (4세션 연속 시달리던 배포 파이프라인 정상화)

Phase: 세션 #58이 박제한 6레이어 순차 해소 / serviceAccount.json 키 회전 + Secret Scanning bypass / Git 재연결 + Deploy Hook 생성 / Deployment Protection 해제 / Framework Preset = Next.js / API_KEY 오타 정정 / hana-vote alias 재연결
브랜치: master (로컬·원격 2f65002 · backup/flatten-2026-04-22 14ab3e7 보존)
커밋 수: 1건 (2f65002 보안 fix) — 세션 #58 마감 커밋 284cc5a와 함께 push 성공

주요 진행:

1. serviceAccount.json 보안 처리 (세션 #58 push rejection의 실제 원인 규명)
   · Secret Scanning 원문 확인: `path: serviceAccount.json:1 · Google Cloud Service Account Credentials`
   · 저장소 현황 조사: `git ls-files`로 tracked 확인 · 최초 커밋 cceeaba · `.gitignore` 미포함 · Admin SDK 참조 경로 7개 (4개는 상위 D:\Dropbox\Dropbox\serviceAccount.json 참조 · 2개만 프로젝트 루트 참조 · 1개 applicationDefault)
   · 운영 영향 분석: 웹앱(src/app/)은 Admin SDK 미사용 · scripts·tests 오프라인 도구만 사용 · 키 삭제해도 프로덕션 무영향 확정
   · 오너 Google Cloud Console 작업: firebase-adminsdk-fbsvc@hizzi-board.iam.gserviceaccount.com 의 구 키(e69f1646f974d3736e246483900c644b160d3c4c) 삭제 · 새 키 발급 · D:\Dropbox\Dropbox\serviceAccount.json (프로젝트 외부) 에 배치
   · Code 후속: `.gitignore`에 serviceAccount.json 추가 · `git rm --cached serviceAccount.json` tracked 해제 · 커밋 2f65002

2. GitHub Secret Scanning bypass + push 성공
   · 오너가 bypass URL 클릭 (구 키는 이미 무효화 상태라 안전)
   · `git push origin master` 실행 → 284cc5a + 2f65002 원격 반영 성공 (세션 #58 종료 커밋이 드디어 올라감)

3. Vercel 배포 파이프라인 다단 점검 → 4레이어 발견
   · push 후 30~60초 대기해도 auto-deploy Row 생성 안 됨 → webhook 단절 가능성 포착
   · CLI `vercel --prod` 시도 → 과거와 다르게 빌드 자체는 Ready (1m Duration) 성공 · 그런데 hizzi-board.vercel.app 접속 시 404
   · Direct deploy URL 401 + `_vercel_sso_nonce` 쿠키 → Deployment Protection 활성 상태 발견
   · 오너 가설 전환: "문제 찾아 수정"에서 "처음 설정하듯 대시보드 훑기"로 접근 방식 재구성

4. "차근하게 감사" 접근으로 남은 4레이어 순차 해소
   · Deploy Hooks 공란 → 오너가 "hizzi" hook 생성 · master 지정 (URL: prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW/tB2B4PASNi)
   · Git 연결 실제 끊김 상태 → 오너 재연결 (vercel git connect CLI는 연결됐다고 응답했으나 대시보드 실상은 미연결이었음 · 이전 세션에서 놓친 층)
   · Deployment Protection → Disabled 저장
   · Framework Preset 미설정 → Next.js 지정 + Save ← **결정적 열쇠**. 저장 후 Deploy Hook 재트리거로 새 빌드 생성 → alias 자동 교체 → 200 OK 확인

5. Firebase 데이터 로드 실패 (서비스 재개 직후 표면화)
   · 오너 "접속은 되는데 패널 데이터·사용자 데이터 안 뜸" 보고
   · 빌드 chunk 실측: `/_next/static/chunks/10-*.js`에서 `AIzaSy...9CK00fOfGDeDE` 추출
   · 로컬 .env.local 원본과 대조: `.env.local`은 `...9CK0OfOfGDeDE` (0 + 대문자 O) · Vercel은 `...9CK00fOfGDeDE` (0 두 개)
   · 6개 env 전수 diff: API_KEY만 단일 글자 오타 · 나머지 5개 완벽 일치
   · `vercel env rm` + `vercel env add` (BOM 제거 로컬값 전송) → Deploy Hook 재트리거 → 새 빌드 chunk 검증에서 정확한 키 `9CK0OfOfGDeDE` 확인

6. hana-vote.vercel.app 404 보고 → alias 재연결
   · 원인: 세션 #58에서 기존 프로젝트 삭제 시 hana-vote alias 함께 소실 · 새 프로젝트에 미등록
   · 페이지 빌드 자체는 정상 (`/hana-vote` 경로는 200) · alias만 문제
   · `npx vercel alias set hizzi-board-gte3uvuz7-rehobot.vercel.app hana-vote.vercel.app` → propagation 30초 후 200 OK

검증:
- `curl -sI https://hizzi-board.vercel.app` → 200 OK
- `curl -sI https://hana-vote.vercel.app` → 200 OK
- 빌드 chunk API_KEY 정확한 값 주입 확인
- 오너 브라우저 실사용 검증: 로그인 · 패널 데이터 · 사용자 데이터 정상 로드 확인 ("전체 다 오케이")
- origin/master = 로컬 = 2f65002 동기

산출물:
- 수정 코드: 없음
- 수정 MD: .gitignore · md/log/progress.md · md/core/master-debt.md (#9 부분 해소 + #10 신규) · .harness/MEMORY.md (세션 #59 4건) · md-presets/presets.json
- 삭제: serviceAccount.json (tracked 해제 · 로컬 파일은 오너 판단 대기)
- Vercel 설정 변경: Framework Preset = Next.js · Deployment Protection = Disabled · Git 재연결 · Deploy Hook 신규
- alias 재등록: hana-vote.vercel.app → hizzi-board-gte3uvuz7-rehobot
- Firebase: 구 Admin SDK 키 revoke + 새 키 발급 (외부 경로 배치)

교훈:
- "꼬인 걸 풀기" 접근이 다단 복구에서 시야 좁히는 함정으로 작용. 오너 제안 "처음 설정한다는 마음으로 하나씩"으로 전환한 순간 Framework Preset·Git 연결 등 4레이어 즉시 발견. 수정 접근 아닌 감사 접근이 경로 최단 (MEMORY.md 신규 항목)
- Vercel 프로젝트 신규 생성 시 UI 기본값 함정 4건 (Deployment Protection Standard · Git 연결 불안정 · Deploy Hook 공란 · Framework Preset 미지정). "생성됐다 = 작동한다" 가정 금지. Settings 전체 페이지 한 번 훑는 체크리스트 표준화 필요 (MEMORY.md 신규 항목)
- 환경변수 오타는 Vercel 대시보드만으로 감지 불가 (Encrypted 마스킹). 빌드 chunk에서 직접 값 추출 + .env.local 원본 diff가 확실한 검증. BOM 제거 후 비교 필수 (MEMORY.md 신규 항목)
- 세션 #58의 "미완결 박제" 선택이 세션 #59 진입 비용 감소. 어설픈 완결보다 명확한 미완 보고가 다음 세션 효율 제공. 다단 복구 상황에서 의도적 박제형 마감 허용 (MEMORY.md 신규 항목)
- 4세션 장기 과제(#56~#59)의 레이어별 분포: #56 드리프트 발견 · #57 원격 push 복구 · #58 구조 정비 + 보안 블로커 박제 · #59 6레이어 순차 해소. "한 세션 = 한 레이어" 원칙이 사후적으로 맞아떨어짐

다음 세션 1순위: 연차 내역-달력 표시 불일치 조사 (기존 케이스 1건 시작점) — 연차 내역 사용 기록은 반영됐는데 달력에 해당 이벤트 표시 안 되는 특정 항목 추적. LeaveManager · 연차 사용 저장 경로 + 달력 이벤트 저장 경로 상태 전환 체인 · Firestore 실제 payload 확인. 이후 블록 ③ 회수 동선 진입
