#!/usr/bin/env node
/**
 * Vercel `ignoreCommand` — 이 배포를 세울지 판정한다.
 *
 * **종료값이 뒤집혀 있다** — Vercel 규격이 `0` = 빌드 **스킵** · `1 이상` = 빌드 **진행** 이다.
 * 오류로 죽어도 0 이 아니므로 규격 자체가 fail-open 이고, 이 파일도 그 방향을 지킨다.
 *
 * 판정 — **마지막 성공 배포 이후 누적이 전부 MD 일 때만 스킵한다.**
 *  - 담기는 것은 둘뿐이다: `md/` 아래 `.md` 와 저장소 뿌리에 바로 놓인 `.md`.
 *    `docs/x.md` 는 MD 라도 빌드를 세운다.
 *  - 기준은 `VERCEL_GIT_PREVIOUS_SHA` 이고 그 값은 **그 프로젝트·그 가지의 마지막 성공 배포**다
 *    (부모 커밋이 아니다 · 다른 가지의 성공 배포는 기준이 안 된다).
 *  - 그래서 가르는 물음은 "이 커밋이 MD 만인가"가 아니라
 *    **"마지막 성공 배포 이후 누적이 전부 MD 인가"** 다. 코드 커밋과 MD 커밋이 한 번에 밀리면
 *    누적에 코드가 섞여 빌드가 선다.
 *  - **가지 이름은 안 본다.** 옛 줄이 가지로 갈라 미리보기를 24일간 통째로 막은 자리다.
 *
 * 모르면 빌드한다 — 기준 값이 비었을 때 · 그 커밋이 얕은 클론(depth 10) 밖일 때 ·
 * diff 가 실패할 때 · 바뀐 것이 0일 때. **여기서 "모르면 스킵"은 사고다.**
 *
 * **왜 셸 한 줄이 아니라 파일인가** — `ignoreCommand` 는 **256자 상한**이 있고 그 판정을 한 줄로
 * 적으면 262자가 되어 **Vercel 이 스키마 단계에서 배포를 통째로 거부한다**(2026-08-19 실측 —
 * 그 상태로 르호봇·히찌보드 배포가 전건 ERROR 였고 빌드는 시작도 못 했다). 파일로 옮기면
 * 길이에서 자유롭고 되살림을 걸 자리도 생긴다.
 */

import { execFileSync } from 'node:child_process'

const SKIP = 0
const BUILD = 1

function main() {
  const base = process.env.VERCEL_GIT_PREVIOUS_SHA
  if (!base) return BUILD

  const git = (args) => execFileSync('git', args, { encoding: 'utf8' })

  try {
    git(['cat-file', '-e', `${base}^{commit}`])
  } catch {
    return BUILD // 얕은 클론 밖 — 못 가르면 세운다
  }

  let out
  try {
    out = git(['diff', '--name-only', base, 'HEAD'])
  } catch {
    return BUILD
  }

  const files = out.split('\n').map((s) => s.trim()).filter(Boolean)
  if (files.length === 0) return BUILD

  const isMd = (f) => /^md\/.+\.md$/.test(f) || /^[^/]+\.md$/.test(f)
  return files.every(isMd) ? SKIP : BUILD
}

let code
try {
  code = main()
} catch {
  code = BUILD // 예상 못 한 오류도 세우는 쪽으로
}
process.exit(code)
