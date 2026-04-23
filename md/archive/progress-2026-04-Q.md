# 히찌보드 — 작업 진행 기록 (아카이브 · 2026-04 Q권 · 세션 #59)

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

다음 세션 1순위: 연차 내역-달력 표시 불일치 조사 (기존 케이스 1건 시작점) — 이후 블록 ③ 회수 동선 진입
