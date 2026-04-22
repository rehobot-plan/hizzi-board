# 히찌보드 — 작업 진행 기록

---

## 현재상태 (세션 종료 시 replace)

- 마지막 세션: 2026-04-22 세션 #58 (Vercel 프로젝트 재생성 · git master 평탄화 · 배포 파이프라인 미복구)
- 작업 브랜치: master (로컬·원격 a63f2ea · 백업 backup/flatten-2026-04-22 = 14ab3e7)
- Vercel 프로젝트: 재생성 완료 (prj_2P0Hyj5FR99NUdSgyFEhzpi6AXVW · 기존 prj_ZpjdBu... 삭제) · Production env 6개 등록 · CLI 배포 0/3 PASS · GitHub auto-deploy 미검증
- 다음 세션 1순위: Vercel 배포 파이프라인 복구 — (a) GitHub Repository Rules 상태 확인 + normal push 회복 / (b) Vercel 대시보드에서 67cv9o11r (11m 전 Duration 1m 빌드 에러) 로그 상세 원인 확보 / (c) 위 둘 결합해 Ready 1건 확정 + alias 교체 → 블록 ② 프로덕션 반영
  · 영향 범위: 대시보드 확인·CLI 조작 중심 (코드 변경 원칙적으로 없음). 빌드 에러 원인이 코드일 경우 .vercelignore / next.config.js / src/lib/firebase.ts 점검
  · 선행 조건: 오너 대시보드 접근 필수 (Code 대행 불가 구간)
- 후순위 후보: 메인 UX §2 블록 ③ 회수 동선 (배포 파이프라인 복구 완료 후 진입) · 세션 #55 기준 1~6
- 선처리 큐: 세션 #55 기준 #1~#4 유지 + #5 (세션 #56) + #6 업데이트 + #7 신규 + #8 신규
  5. tabbar-sticky.spec 전체 smoke 직렬 실행 시 간헐 timeout (세션 #56 · 유지)
     · 격리 반복 30/30 PASS · git diff 영향 경로 0 · flaky 확정
     · 원인 후보: dev server warm-up / beforeAll 로그인 타임아웃 편차 / 순차 86 스펙 중간 resource pressure
  6. Vercel CLI 배포 3초 deploy_failed 빈 메시지 flaky (세션 #57 신규 · 세션 #58 업데이트)
     · 세션 #57: hizzi-board-new/ 폴더에서만 재현 (원본 hizzi-board/ CLI 정상)
     · 세션 #58: 폴더 rename 후에도 재현 + 완전 새 Vercel 프로젝트(prj_2P0Hyj5FR99N...) 재생성 후에도 재현 → 원인 폴더명·프로젝트 캐시 아님 확정
     · 새 가설: Vercel 계정 또는 플랫폼 레벨 flaky. vercel inspect --logs도 빈 반환
     · 격리 관측: 같은 프로젝트에서 11m 전 1회는 "Export encountered errors" 실제 빌드 에러 원문까지 진입 (Duration 1m) · 이후 2회는 3초 빈 메시지로 회귀 → 빌드 전 중단
  7. Vercel 새 프로젝트 env 환경별 불완전 (세션 #58 신규)
     · Production 6개 완비 (Firebase)
     · Preview 0개 (vercel env add preview가 git branch 프롬프트 요구, stdin pipe 자동화 실패)
     · Development 5개 (API_KEY 누락 — BOM 초기 이슈 잔존)
     · 영향: Preview/Development 환경 배포 시도 시 Firebase 초기화 실패 가능. Production 배포엔 영향 없음
  8. GitHub Repository Rules normal push rejection (세션 #58 신규)
     · empty commit push 거부: "push declined due to repository rule violations"
     · --force-with-lease는 통과 (비대칭)
     · 원인 미확인: GitHub Settings → Rules / Branches 오너 확인 필요
     · 영향: auto-deploy 파이프라인 실측 불가, 수동 CLI 배포로만 시도 가능
- 미해결:
  - Vercel CLI 배포 flaky (계정/플랫폼 레벨 의심 · 선처리 큐 #6)
  - GitHub push rejection (Rules 추정 · 선처리 큐 #8)
  - post-request cascade 실패 시 divergence 가능성 — master-debt #8 (일괄 전환 시점 미정)

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
