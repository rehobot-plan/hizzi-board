import { calculateCandidateResults, getWinThreshold } from '../src/lib/voteCalculator'
import type { Candidate, Ballot } from '../src/types/vote'

function makeBallot(id: string, part: '장로' | '시무권사' | '안수집사', isAllInvalid: boolean, votes: Record<string, 'no' | 'invalid'>): Ballot {
  return {
    id, teamId: 'team1', counterName: 'test', part,
    isAllInvalid, votes,
    createdAt: null, updatedAt: null,
  }
}

let pass = 0, fail = 0
function test(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) pass++
  else fail++
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' ' + name + (ok ? '' : '  actual=' + JSON.stringify(actual) + ' expected=' + JSON.stringify(expected)))
}

console.log('Phase 3 voteCalculator 단위 테스트')
console.log('========================================')

console.log('[getWinThreshold — 당선 기준 N × 2/3 올림]')
test('N=198 → 132', getWinThreshold(198), 132)
test('N=200 → 134', getWinThreshold(200), 134)
test('N=100 → 67', getWinThreshold(100), 67)
test('N=99 → 66', getWinThreshold(99), 66)
test('N=3 → 2', getWinThreshold(3), 2)
test('N=0 → 0', getWinThreshold(0), 0)

console.log('[calculateCandidateResults]')
const cands: Candidate[] = [
  { id: 'c1', part: '장로', name: 'A', order: 1, createdAt: null },
  { id: 'c2', part: '장로', name: 'B', order: 2, createdAt: null },
  { id: 'c3', part: '장로', name: 'C', order: 3, createdAt: null },
  { id: 'c4', part: '안수집사', name: 'D', order: 1, createdAt: null },
]

{
  const ballots = [
    makeBallot('b1', '장로', false, {}),
    makeBallot('b2', '장로', false, {}),
    makeBallot('b3', '장로', false, {}),
  ]
  const r = calculateCandidateResults(cands, ballots, 10, '장로')
  test('빈 ballot 3장 → A 찬성 3', r.find((x) => x.name === 'A')?.yes, 3)
  test('빈 ballot 3장 → A 반대 0', r.find((x) => x.name === 'A')?.no, 0)
  test('빈 ballot 3장 → A 무효 0', r.find((x) => x.name === 'A')?.invalid, 0)
}

{
  const ballots = [
    makeBallot('b1', '장로', false, { c1: 'no' }),
    makeBallot('b2', '장로', false, { c2: 'invalid' }),
    makeBallot('b3', '장로', false, { c1: 'no', c2: 'no', c3: 'invalid' }),
    makeBallot('b4', '장로', true, {}),
  ]
  const r = calculateCandidateResults(cands, ballots, 10, '장로')
  const A = r.find((x) => x.name === 'A')
  const B = r.find((x) => x.name === 'B')
  const C = r.find((x) => x.name === 'C')
  test('섞인 ballot — A', [A?.yes, A?.no, A?.invalid], [1, 2, 1])
  test('섞인 ballot — B', [B?.yes, B?.no, B?.invalid], [1, 1, 2])
  test('섞인 ballot — C', [C?.yes, C?.no, C?.invalid], [2, 0, 2])
}

{
  const ballots: Ballot[] = []
  for (let i = 0; i < 66; i++) ballots.push(makeBallot('b' + i, '장로', false, {}))
  const r = calculateCandidateResults(cands, ballots, 100, '장로')
  test('N=100 찬성 66 → 미달', r.find((x) => x.name === 'A')?.isElected, false)
}
{
  const ballots: Ballot[] = []
  for (let i = 0; i < 67; i++) ballots.push(makeBallot('b' + i, '장로', false, {}))
  const r = calculateCandidateResults(cands, ballots, 100, '장로')
  test('N=100 찬성 67 → 당선', r.find((x) => x.name === 'A')?.isElected, true)
}
{
  const ballots: Ballot[] = []
  for (let i = 0; i < 131; i++) ballots.push(makeBallot('b' + i, '장로', false, {}))
  const r = calculateCandidateResults(cands, ballots, 198, '장로')
  test('N=198 찬성 131 → 미달', r.find((x) => x.name === 'A')?.isElected, false)
}
{
  const ballots: Ballot[] = []
  for (let i = 0; i < 132; i++) ballots.push(makeBallot('b' + i, '장로', false, {}))
  const r = calculateCandidateResults(cands, ballots, 198, '장로')
  test('N=198 찬성 132 → 당선', r.find((x) => x.name === 'A')?.isElected, true)
}

{
  const ballots = [
    makeBallot('b1', '장로', false, {}),
    makeBallot('b2', '안수집사', false, {}),
  ]
  const r = calculateCandidateResults(cands, ballots, 10, '장로')
  test('파트 필터 — 장로만 집계', r.find((x) => x.name === 'A')?.yes, 1)
}

{
  const ballots = [
    makeBallot('b1', '장로', false, { c1: 'no', c3: 'no' }),
    makeBallot('b2', '장로', false, { c1: 'no' }),
  ]
  const r = calculateCandidateResults(cands, ballots, 10, '장로')
  test('정렬 — 찬성 내림차순', r.map((x) => x.name), ['B', 'C', 'A'])
}

console.log('========================================')
console.log('결과: ' + pass + '/' + (pass + fail) + ' PASS')
process.exit(fail === 0 ? 0 : 1)
