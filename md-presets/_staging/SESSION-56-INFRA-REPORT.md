# 세션 #56 인프라 보고 — 저장소 손상 박제

생성: 2026-04-22 (세션 #56 마감 데이터 보존 3차)
경로: `.harness/patches-session-56/SESSION-56-INFRA-REPORT.md`

---

## 상황

로컬 git 저장소 손상 + 원격 드리프트 23세션 분량 동시 박제.

- missing blob: `aa5e27561e362c1db0b8b391ef1e7e22d133ec48` — 0078번째 커밋(`a71693d`) 또는 직후 커밋 트리에서 참조하나 객체 물리적 부재
- `git fsck --full`: missing blob 1건 + dangling blob 9건 + dangling tree 3건 (dangling은 amend 폐기물로 정상)
- `git cat-file -t aa5e27...`: `fatal: could not get object info` — 복구 불가 확정
- `git push` 실패 경로: 원격 전송용 pack 구성 시점 blob 필수 접근 → 즉시 중단

## 커밋 포지션

| 위치 | 해시 | 내용 |
|------|------|------|
| 원격 HEAD (origin/master) | `d39f828` | "refactor: session.md → CLAUDE.md 통합 + CLAUDE-detail.md 신설" (세션 #32 시점) |
| 로컬 HEAD (master) | `533e837` | "feat(main-ux): §2 블록 ② 활성 상호작용" (세션 #56 단일 커밋) |
| 손상 진입점 (0078) | `a71693d` | "feat(mydesk): UrgentList 요청 클릭 → RequestDetailPopup 연결 (선처리 큐 1번)" |
| 손상 직전 (0077) | `3ba1624` | "feat(hana-vote): finalizedAt — 집계 완료 시각 마감 시점 고정" |
| 손상 직후 (0079) | `6e0e47d` | "feat: Firestore persistentLocalCache + multipleTabManager 활성화" |

## patch 커버리지

- `d39f828..533e837` 총 **216 커밋**
- `git format-patch` (기본/--no-renames 동일 지점 실패): **0001 ~ 0077 (77건)** 정상 생성. 0078 이후 **139건** 미생성
- `.harness/patches-session-56/` 기본 77건 + `no-renames-attempt/` 77건 (중복, 동일 커버리지) + `head-only/` 1건 (블록 ② 단독)

## 확보된 백업 산출물

```
.harness/patches-session-56/
├── 0001-*.patch ~ 0077-*.patch            # 0001~0077 (77/216, 905K 총합)
├── no-renames-attempt/
│   └── 0001-*.patch ~ 0077-*.patch        # --no-renames 재시도 결과 (동일 커버리지)
├── head-only/
│   └── 0001-feat-main-ux-2-44px-P9-1-cascade.patch   # 533e837 단독 (32,504B)
├── commit-range.txt                       # 216 커밋 전체 oneline 목록
├── history-0078-0216-oneline.txt          # 139 커밋 oneline (139 lines)
├── history-0078-0216-stat.txt             # 손상 지점까지 partial stat dump (108K, 2232 lines, EXIT 128)
├── history-0078-0216-full.txt             # fuller + stat partial dump (120K, 2494 lines, EXIT 128)
├── show-2eb2bf6-panel-variant.txt         # 세션 #55 Panel variant 수정 (4,771B)
├── show-bdf00f1-progress.txt              # 세션 #55 progress 갱신 (9,995B)
├── show-c707498-postSelectors.txt         # 세션 #54 postSelectors (11,381B)
├── show-3afd522-panel-height.txt          # 세션 #54 패널 높이 (8,472B)
├── core-md-snapshot/
│   ├── CLAUDE.md · harness.md · session.md · rules.md · rules-detail.md
│   └── (md/core/CLAUDE.md 부재 — 저장소 루트 CLAUDE.md 사용)
├── working-tree-snapshot.tar.gz           # node_modules·.next·.git 제외 전체 (1.1M)
└── SESSION-56-INFRA-REPORT.md             # 본 문서
```

## 블록 ② 안전도

- 코드 자체는 `working-tree-snapshot.tar.gz` + `head-only/0001-*.patch` 이중 백업
- 클린 저장소 clone 후 `git am head-only/0001-*.patch` 재적용 가능
- Dropbox 복제본과 로컬 `.harness/` 둘 다 보존 → 3중화

## 다음 세션 1순위: 인프라 복구

저장소 정상화 전까지 블록 ② 배포 불가. 복구 경로 (오너 판단):

1. **새 저장소 fresh clone + 패치 재적용**
   - `git clone https://github.com/rehobot-plan/hizzi-Board.git` 클린 복제
   - 원격 `d39f828`에서 시작
   - `git am` 으로 0001~0077 순차 재적용 (성공 보장)
   - 0078~0216 구간은 `history-0078-*.txt` + `show-*.txt` 참고해 수동 재구성 또는 working-tree-snapshot.tar.gz에서 결과 상태 복원
   - 블록 ② `head-only/0001-feat-main-ux-2-44px-P9-1-cascade.patch` 마지막 적용

2. **filter-branch 잔존 정리**
   - `backup/before-author-rewrite-20260415` · `backup/before-author-rewrite-20260415-master` 브랜치 + `refs/original/*` 6건
   - 정상화 후 별도 세션에서 해제 판단

3. **harness.md 배포 명령에 `git push` 편입**
   - 현재 배포는 Vercel prod 명령만 수행, push 누락 시에도 통과하는 구조 결함
   - 최소 `git status` · `git log @{u}..HEAD` 체크 단계 추가 검토

## 금지 사항 (복구 세션 전까지)

- `git gc` · `git prune` · `git repack` — dangling object 소실 위험
- `git push --force` — 원격 23세션 분량 삭제 위험
- `git reset --hard` · `git rebase -i` — 로컬 커밋 체인 붕괴 위험
- missing blob `aa5e27...` 복구 시도 — loose objects·reflog 소생 불가 확정
- 블록 ② 커밋 `533e837` amend / reset / rebase

## 교훈 (세션 단위 요약에 흡수 대상)

- Vercel 배포 경로가 `git push` 성공 전제임에도 harness 파이프라인이 push 단계를 명시 실패 게이트로 처리하지 않음. 세션 #33~#55 대부분 배포 성공 보고가 있었으나 **원격 master는 세션 #32 상태 고정**. 공장 보고가 사실을 대체하지 않는다는 세션 #54 교훈이 인프라 축에서도 재현.
- 원격 드리프트 확인 명령(`git log @{u}..HEAD`)을 harness 1-6에 편입 필요.
