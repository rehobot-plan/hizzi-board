import { readFileSync, existsSync } from 'fs'

function diff(a: unknown, b: unknown, pathStr: string, out: string[]) {
  if (a === b) return
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    out.push(pathStr + ': before=' + JSON.stringify(a) + ' after=' + JSON.stringify(b))
    return
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      out.push(pathStr + ': before=' + JSON.stringify(a) + ' after=' + JSON.stringify(b))
      return
    }
    for (let i = 0; i < a.length; i++) diff(a[i], b[i], pathStr + '[' + i + ']', out)
    return
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const keys = new Set([...Object.keys(ao), ...Object.keys(bo)])
  for (const k of keys) {
    if (k === 'capturedAt') continue
    diff(ao[k], bo[k], pathStr ? pathStr + '.' + k : k, out)
  }
}

function main() {
  const [, , pathA, pathB] = process.argv
  if (!pathA || !pathB) {
    console.error('사용법: npx tsx scripts/diff-hana-vote-snapshots.ts <snapshot-before.json> <snapshot-after.json>')
    process.exit(2)
  }
  if (!existsSync(pathA)) {
    console.error('[FAIL] 파일 없음: ' + pathA)
    process.exit(2)
  }
  if (!existsSync(pathB)) {
    console.error('[FAIL] 파일 없음: ' + pathB)
    process.exit(2)
  }
  const a = JSON.parse(readFileSync(pathA, 'utf-8'))
  const b = JSON.parse(readFileSync(pathB, 'utf-8'))
  const out: string[] = []
  diff(a, b, '', out)
  if (out.length === 0) {
    console.log('PASS: 스냅샷 동일')
    console.log('  before: ' + pathA)
    console.log('  after:  ' + pathB)
    process.exit(0)
  }
  console.log('FAIL: 차이 ' + out.length + '건')
  for (const line of out) console.log('  ' + line)
  process.exit(1)
}

main()
