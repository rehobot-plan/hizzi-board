import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { calculateCandidateResults, getWinThreshold, getPartTotal } from '../src/lib/voteCalculator'
import type { Candidate, Ballot, VoteSession } from '../src/types/vote'

const serviceAccountPath = 'D:\\Dropbox\\Dropbox\\serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'hizzi-board',
})

const db = getFirestore()

const MARKER = 'E2E_VERIFY'

async function cleanup() {
  const snap = await db.collection('ballots').where('counterName', '==', MARKER).get()
  for (const d of snap.docs) await d.ref.delete()
  return snap.size
}

async function main() {
  console.log('Hana Vote E2E 검증 (Phase 4)')
  console.log('========================================')

  const sessionSnap = await db.collection('voteSessions').doc('current').get()
  if (!sessionSnap.exists) {
    console.log('[FAIL] 세션이 없습니다. 시드를 먼저 실행하세요.')
    process.exit(1)
  }
  const session = { id: 'current', ...sessionSnap.data() } as VoteSession

  const candSnap = await db.collection('candidates').where('part', '==', '장로').get()
  const cands: Candidate[] = candSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Candidate))
    .sort((a, b) => a.order - b.order)

  if (cands.length < 3) {
    console.log('[FAIL] 장로 후보 3명 이상 필요')
    process.exit(1)
  }

  const teamSnap = await db.collection('teams').where('part', '==', '장로').limit(1).get()
  if (teamSnap.empty) {
    console.log('[FAIL] 장로 팀 없음')
    process.exit(1)
  }
  const teamId = teamSnap.docs[0].id

  const removed = await cleanup()
  console.log('  기존 E2E 데이터 삭제: ' + removed + '건')

  const [c1, c2, c3] = cands

  console.log('  시나리오: 10장 입력 (A: 찬성 7, B: 찬성 5, C: 찬성 9, 전체무효 1장 포함)')
  const sessionTotal = getPartTotal(session, '장로')
  console.log('  참여 인원 ' + sessionTotal + '명 가정, 당선 기준 ' + getWinThreshold(sessionTotal) + '표')
  console.log('  ----------------------------------------')

  const scenarios: Array<{ isAllInvalid: boolean; votes: Record<string, string> }> = [
    { isAllInvalid: false, votes: {} },
    { isAllInvalid: false, votes: {} },
    { isAllInvalid: false, votes: {} },
    { isAllInvalid: false, votes: {} },
    { isAllInvalid: false, votes: { [c2.id]: 'no' } },
    { isAllInvalid: false, votes: { [c2.id]: 'no' } },
    { isAllInvalid: false, votes: { [c2.id]: 'no' } },
    { isAllInvalid: false, votes: { [c1.id]: 'no', [c2.id]: 'invalid' } },
    { isAllInvalid: false, votes: { [c1.id]: 'invalid' } },
    { isAllInvalid: true, votes: {} },
  ]

  for (const s of scenarios) {
    await db.collection('ballots').add({
      teamId,
      counterName: MARKER,
      part: '장로',
      isAllInvalid: s.isAllInvalid,
      votes: s.votes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }

  const ballotsSnap = await db.collection('ballots').where('counterName', '==', MARKER).get()
  const ballots: Ballot[] = ballotsSnap.docs
    .filter((d) => d.data().createdAt != null)
    .map((d) => ({ id: d.id, ...d.data() } as Ballot))

  const fakeParticipants = 12
  const results = calculateCandidateResults(cands, ballots, fakeParticipants, '장로')

  let pass = 0, fail = 0
  function assertEq(label: string, a: unknown, e: unknown) {
    const ok = JSON.stringify(a) === JSON.stringify(e)
    if (ok) pass++
    else fail++
    console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' ' + label + (ok ? '' : '  actual=' + JSON.stringify(a) + ' expected=' + JSON.stringify(e)))
  }

  const A = results.find((r) => r.name === c1.name)!
  const B = results.find((r) => r.name === c2.name)!
  const C = results.find((r) => r.name === c3.name)!

  assertEq(c1.name + ' 찬성=7', A.yes, 7)
  assertEq(c1.name + ' 반대=1', A.no, 1)
  assertEq(c1.name + ' 무효=2', A.invalid, 2)

  assertEq(c2.name + ' 찬성=5', B.yes, 5)
  assertEq(c2.name + ' 반대=3', B.no, 3)
  assertEq(c2.name + ' 무효=2', B.invalid, 2)

  assertEq(c3.name + ' 찬성=9', C.yes, 9)
  assertEq(c3.name + ' 반대=0', C.no, 0)
  assertEq(c3.name + ' 무효=1', C.invalid, 1)

  const subjectIds = new Set([c1.id, c2.id, c3.id])
  const subjectsOrdered = results.filter((r) => subjectIds.has(r.candidateId)).map((r) => r.name)
  assertEq('정렬 순서 (찬성 내림차순)', subjectsOrdered, [c3.name, c1.name, c2.name])

  const threshold = getWinThreshold(fakeParticipants)
  assertEq('N=12 당선 기준 8', threshold, 8)
  assertEq(c3.name + ' 9표 → 당선', C.isElected, true)
  assertEq(c1.name + ' 7표 → 미달', A.isElected, false)
  assertEq(c2.name + ' 5표 → 미달', B.isElected, false)

  const cleanedUp = await cleanup()
  console.log('  ----------------------------------------')
  console.log('  검증 데이터 삭제: ' + cleanedUp + '건')
  console.log('  결과: ' + pass + '/' + (pass + fail) + ' PASS')

  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
