import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccountPath = 'D:\\Dropbox\\Dropbox\\serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'hizzi-board',
})

const db = getFirestore()

interface Cand {
  id: string
  name: string
  order: number
}

async function main() {
  console.log('Hana Vote Phase 2 집계 검증')
  console.log('========================================')

  const candSnap = await db.collection('candidates').where('part', '==', '장로').get()
  if (candSnap.empty) {
    console.log('[FAIL] 장로 파트 후보가 없습니다. 시드를 먼저 실행하세요.')
    process.exit(1)
  }
  const cands: Cand[] = candSnap.docs
    .map((d) => ({ id: d.id, name: d.data().name as string, order: d.data().order as number }))
    .sort((a, b) => a.order - b.order)

  console.log('  후보 로드: ' + cands.length + '명 (' + cands.map((c) => c.name).join(', ') + ')')

  if (cands.length < 3) {
    console.log('[FAIL] 장로 파트 후보가 3명 이상 필요합니다.')
    process.exit(1)
  }

  const teamSnap = await db.collection('teams').where('part', '==', '장로').limit(1).get()
  if (teamSnap.empty) {
    console.log('[FAIL] 장로 파트 팀이 없습니다.')
    process.exit(1)
  }
  const teamId = teamSnap.docs[0].id

  const existingSnap = await db.collection('ballots').where('counterName', '==', 'VERIFY_SCRIPT').get()
  for (const d of existingSnap.docs) await d.ref.delete()
  console.log('  기존 검증 데이터 삭제: ' + existingSnap.size + '건')

  const [c1, c2, c3] = cands

  const scenarios: Array<{ isAllInvalid: boolean; votes: Record<string, string> }> = [
    { isAllInvalid: false, votes: {} },
    { isAllInvalid: false, votes: { [c1.id]: 'no' } },
    { isAllInvalid: false, votes: { [c2.id]: 'invalid' } },
    { isAllInvalid: false, votes: { [c1.id]: 'no', [c2.id]: 'no', [c3.id]: 'invalid' } },
    { isAllInvalid: true, votes: {} },
  ]

  for (const s of scenarios) {
    await db.collection('ballots').add({
      teamId,
      counterName: 'VERIFY_SCRIPT',
      part: '장로',
      isAllInvalid: s.isAllInvalid,
      votes: s.votes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }
  console.log('  테스트 ballot 5장 생성')
  console.log('  ----------------------------------------')

  const ballotsSnap = await db.collection('ballots').where('counterName', '==', 'VERIFY_SCRIPT').get()

  const tally: Record<string, { yes: number; no: number; invalid: number }> = {}
  for (const c of cands) tally[c.id] = { yes: 0, no: 0, invalid: 0 }

  for (const d of ballotsSnap.docs) {
    const b = d.data()
    if (b.isAllInvalid) {
      for (const c of cands) tally[c.id].invalid++
    } else {
      for (const c of cands) {
        const v = b.votes?.[c.id]
        if (v === 'no') tally[c.id].no++
        else if (v === 'invalid') tally[c.id].invalid++
        else tally[c.id].yes++
      }
    }
  }

  const expected: Record<string, { yes: number; no: number; invalid: number }> = {
    [c1.id]: { yes: 2, no: 2, invalid: 1 },
    [c2.id]: { yes: 2, no: 1, invalid: 2 },
    [c3.id]: { yes: 3, no: 0, invalid: 2 },
  }

  let pass = 0, fail = 0
  console.log('  집계 결과:')
  for (const c of [c1, c2, c3]) {
    const a = tally[c.id]
    const e = expected[c.id]
    const ok = a.yes === e.yes && a.no === e.no && a.invalid === e.invalid
    if (ok) pass++
    else fail++
    const mark = ok ? 'PASS' : 'FAIL'
    console.log('    ' + c.name + ': 찬성=' + a.yes + ', 반대=' + a.no + ', 무효=' + a.invalid + '  [예상: ' + e.yes + ',' + e.no + ',' + e.invalid + ']  ' + mark)
  }

  console.log('  ----------------------------------------')
  console.log('  전체: ' + pass + '/' + (pass + fail) + ' PASS')

  const cleanupSnap = await db.collection('ballots').where('counterName', '==', 'VERIFY_SCRIPT').get()
  for (const d of cleanupSnap.docs) await d.ref.delete()
  console.log('  검증 데이터 정리 완료: ' + cleanupSnap.size + '건 삭제')

  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
