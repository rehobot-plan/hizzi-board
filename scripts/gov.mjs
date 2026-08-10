#!/usr/bin/env node
/**
 * gov.mjs — **층 도구로 가는 다리. 실물은 여기 없다.**
 *
 *     node scripts/gov.mjs <도구> [인자…]
 *     node scripts/gov.mjs --list
 *
 * ━━ 왜 있나 ━━
 * 앱 무관 도구는 층에 산다(`{층}/scripts/` · harness.md 1-7). 그런데 **부르는 자리가 층
 * 밖일 때가 흔하다** — 레인 워크트리는 `~/{앱}-wt/{id}` 라 `../scripts` 가 층이 아니고,
 * 앱 main 트리에서만 맞는 상대 경로를 규약에 적어 두면 레인에서 그대로 치는 순간 죽는다
 * (2026-08-10 에 실제로 그렇게 죽었다). 자리마다 다른 줄을 외우게 하는 대신 **한 줄로
 * 통일한다** — 앱 어디서 부르든 `node scripts/gov.mjs <도구>` 다.
 *
 * ━━ 이 파일은 앱마다 한 장씩 있고 전부 같은 글자다 ━━
 * 정본은 `{층}/scripts/gov.mjs` 이고 앱 것은 **글자 그대로의 사본**이다. 왜 사본이냐면
 * **층을 찾는 것이 이 파일의 일**이라, 층에 있는 무언가를 가져다 쓸 수가 없기 때문이다
 * (부트스트랩은 자립해야 한다). 갈라지는 것은 검사가 막는다 — `bridge_check`.
 *
 * ━━ 무엇을 하나 ━━
 * 층 자리를 판정해 `{층}/scripts/<도구>.mjs` 를 그대로 실행한다. 인자를 손대지 않고
 * 넘기고 종료값을 그대로 돌려준다. **판정도 출력도 층 것 그대로다.**
 *
 * ━━ 안 하는 것 ━━
 * 층 밖 파일을 부르지 않는다. 도구 이름은 글자 검사를 지나야 하고(소문자·숫자·붙임표만),
 * 실제로 층 목록에 있는 것만 연다 — 인자로 경로를 넣어 층 밖으로 나가는 길을 막는다.
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

/** 층이 실재하는지 가르는 표식. 둘 다 있어야 층으로 본다. */
const MARKERS = ['CLAUDE.md', 'md/core/projects.md']
const NAME = /^[a-z0-9-]+$/
const HERE = path.dirname(fileURLToPath(import.meta.url))

function hasMarkers(dir) {
  return dir && MARKERS.every((m) => fs.existsSync(path.join(dir, m)))
}

/**
 * 층 자리. 세 갈래로 찾고 **전부 표식으로 확인한다** — 자리를 짚는 것과 그 자리가 성한
 * 것은 다른 사실이라, 표식 없이 통과시키면 엉뚱한 폴더를 층으로 삼는다.
 *
 * (1) 환경변수 · (2) **내 부모** — 층 자신의 `scripts/` 에 있을 때 · (3) **main 트리의
 * 부모** — 앱 안에 있을 때. 레인 워크트리에서 물어도 git 은 main 자리를 낸다
 * (`--git-common-dir` 가 main 것을 가리킨다). 부모를 그냥 따라가면 워크트리 컨테이너
 * (`~/{앱}-wt`)를 보게 되어 못 찾는다.
 */
function governanceRoot() {
  const fromEnv = process.env.REHOBOT_GOVERNANCE_ROOT
  if (fromEnv && hasMarkers(path.resolve(fromEnv))) return path.resolve(fromEnv)

  const mine = path.dirname(HERE)
  if (hasMarkers(mine)) return mine

  const git = (args) => spawnSync('git', args, { encoding: 'utf8', cwd: HERE })
  let main = null
  const abs = git(['rev-parse', '--path-format=absolute', '--git-common-dir'])
  if (abs.status === 0 && abs.stdout.trim()) {
    main = path.dirname(abs.stdout.trim())
  } else {
    // --path-format 은 git 2.31+ 라 없는 환경을 위한 폴백.
    const rel = git(['rev-parse', '--git-common-dir'])
    const top = git(['rev-parse', '--show-toplevel'])
    if (rel.status === 0 && top.status === 0 && rel.stdout.trim() && top.stdout.trim()) {
      main = path.dirname(path.resolve(top.stdout.trim(), rel.stdout.trim()))
    }
  }
  const parent = main ? path.dirname(main) : null
  return hasMarkers(parent) ? parent : null
}

function fail(msg, code = 1) {
  console.error(`[gov] ${msg}`)
  process.exit(code)
}

const root = governanceRoot()
if (!root) {
  fail(
    '층을 못 찾았다 — 표식 둘(CLAUDE.md · md/core/projects.md)이 있는 자리를 못 짚었다.\n' +
      '  층 자리를 손으로 주려면 REHOBOT_GOVERNANCE_ROOT 를 쓴다.'
  )
}

// **부를 수 있는 것과 부품을 코드가 스스로 가른다** — 부품은 `export` 로 남에게 주고,
//   도구는 불리면 스스로 돈다. 목록을 손으로 적어 두면 도구가 늘 때 그 목록만 낡는다.
const dir = path.join(root, 'scripts')
const tools = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.mjs') && f !== 'gov.mjs')
  .filter((f) => !/^export /m.test(fs.readFileSync(path.join(dir, f), 'utf8')))
  .map((f) => f.replace(/\.mjs$/, ''))
  .sort()

const [tool, ...rest] = process.argv.slice(2)

if (!tool || tool === '--list' || tool === '-l') {
  console.log(`[gov] 층 ${root}`)
  console.log('[gov] 부를 수 있는 도구:')
  for (const t of tools) console.log(`  ${t}`)
  process.exit(tool ? 0 : 1)
}

if (!NAME.test(tool)) fail(`도구 이름이 아니다: ${tool}`)
if (!tools.includes(tool)) {
  fail(`층에 그런 도구가 없다: ${tool}\n  있는 것: ${tools.join(' · ')}`)
}

const child = spawn(process.execPath, [path.join(dir, `${tool}.mjs`), ...rest], {
  stdio: 'inherit',
})
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})
child.on('error', (e) => fail(`도구를 못 띄웠다 — ${e.message}`, 1))
