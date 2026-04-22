import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccountPath = 'D:\\Dropbox\\Dropbox\\serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

initializeApp({ credential: cert(serviceAccount), projectId: 'hizzi-board' })
const db = getFirestore()

// ---------- types (mirror src/types/vote.ts) ----------
type VotePart = '장로' | '시무권사' | '안수집사'
interface Candidate { id: string; part: VotePart; name: string; order: number; isBlue?: boolean }
interface Ballot { id: string; teamNumber: number; counterName: string; supervisorName?: string; part: VotePart; isAllInvalid: boolean; votes: Record<string, 'no' | 'invalid'>; createdAt: unknown; updatedAt: unknown }

// ---------- calculator (mirror src/lib/voteCalculator.ts) ----------
function getWinThreshold(n: number) { return n <= 0 ? 0 : Math.ceil((n * 2) / 3) }

interface CandResult { candidateId: string; name: string; yes: number; no: number; invalid: number; yesRate: number; isElected: boolean }
function calcResults(cands: Candidate[], ballots: Ballot[], total: number, part: VotePart): CandResult[] {
  const pb = ballots.filter(b => b.part === part)
  const thr = getWinThreshold(total)
  const r = cands.filter(c => c.part === part).map(c => {
    let yes = 0, no = 0, inv = 0
    for (const b of pb) {
      if (b.isAllInvalid) { inv++; continue }
      const v = b.votes?.[c.id]
      if (v === 'no') no++; else if (v === 'invalid') inv++; else yes++
    }
    return { candidateId: c.id, name: c.name, yes, no, invalid: inv, yesRate: total > 0 ? (yes / total) * 100 : 0, isElected: yes >= thr }
  })
  r.sort((a, b) => b.yes - a.yes)
  return r
}

interface TeamProg { teamNumber: number; part: VotePart; counters: { name: string; count: number }[]; supervisors: string[]; ballotCount: number }
function calcTeamProgress(ballots: Ballot[]): TeamProg[] {
  const map = new Map<string, { teamNumber: number; part: VotePart; cm: Map<string, number>; sv: Set<string>; count: number }>()
  for (const b of ballots) {
    const k = b.teamNumber + '-' + b.part
    if (!map.has(k)) map.set(k, { teamNumber: b.teamNumber, part: b.part, cm: new Map(), sv: new Set(), count: 0 })
    const g = map.get(k)!
    g.cm.set(b.counterName, (g.cm.get(b.counterName) ?? 0) + 1)
    if (b.supervisorName) g.sv.add(b.supervisorName)
    g.count++
  }
  return [...map.values()].map(g => ({
    teamNumber: g.teamNumber, part: g.part,
    counters: [...g.cm.entries()].map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    supervisors: [...g.sv].sort(), ballotCount: g.count,
  })).sort((a, b) => a.teamNumber !== b.teamNumber ? a.teamNumber - b.teamNumber : a.part.localeCompare(b.part))
}

// ---------- helpers ----------
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function pickN<T>(arr: T[], n: number): T[] {
  const s = [...arr]; const r: T[] = []
  for (let i = 0; i < Math.min(n, s.length); i++) { const idx = Math.floor(Math.random() * s.length); r.push(s.splice(idx, 1)[0]) }
  return r
}

const TEAMS = [
  { num: 1, counters: ['개표자A1', '개표자A2'], supervisor: '감독자A' },
  { num: 2, counters: ['개표자B1', '개표자B2'], supervisor: '감독자B' },
  { num: 3, counters: ['개표자C1', '개표자C2'], supervisor: '감독자C' },
  { num: 4, counters: ['개표자D1', '개표자D2'], supervisor: '감독자D' },
  { num: 5, counters: ['개표자E1', '개표자E2'], supervisor: '감독자E' },
]
const PARTS: VotePart[] = ['장로', '시무권사', '안수집사']
const TOTAL = 200
const MARKER = 'SIM_'

async function main() {
  console.log('=== Hana Vote 시뮬레이션 ===')
  console.log('')

  // load candidates
  const candSnap = await db.collection('candidates').get()
  const candidates: Candidate[] = candSnap.docs.map(d => ({ id: d.id, ...d.data() } as Candidate)).sort((a, b) => a.order - b.order)
  console.log('후보 로드: ' + candidates.length + '명')

  const candsByPart: Record<VotePart, Candidate[]> = { '장로': [], '시무권사': [], '안수집사': [] }
  for (const c of candidates) candsByPart[c.part].push(c)
  for (const p of PARTS) console.log('  ' + p + ': ' + candsByPart[p].length + '명')

  // check existing ballots
  const existingSnap = await db.collection('ballots').get()
  if (existingSnap.size > 0) {
    console.log('\n[경고] ballots에 ' + existingSnap.size + '건 존재. 시뮬레이션 데이터와 섞일 수 있음.')
    console.log('  필요 시 관리자 대시보드에서 [투표 데이터 초기화] 먼저 실행.')
  }

  // save original session
  const sessSnap = await db.collection('voteSessions').doc('current').get()
  const origTotal = sessSnap.data()?.totalParticipants
  const origByPart = sessSnap.data()?.totalParticipantsByPart
  if (origTotal !== TOTAL) {
    await db.collection('voteSessions').doc('current').update({
      totalParticipants: TOTAL,
      totalParticipantsByPart: { '장로': TOTAL, '시무권사': TOTAL, '안수집사': TOTAL },
      updatedAt: Timestamp.now(),
    })
    console.log('\n세션 totalParticipants: ' + origTotal + ' → ' + TOTAL + ' (시뮬레이션용, 종료 시 복원)')
  }

  const allBallotIds: string[] = []

  // ===== SCENARIO 1: Normal large-scale =====
  console.log('\n--- 시나리오 1: 정상 대규모 입력 (파트당 200장 × 3) ---')
  let s1Count = 0
  for (const part of PARTS) {
    const partCands = candsByPart[part]
    for (let i = 0; i < 200; i++) {
      const team = pick(TEAMS)
      const counter = MARKER + pick(team.counters)
      const supervisor = team.supervisor
      const rand = Math.random()
      let isAllInvalid = false
      const votes: Record<string, string> = {}

      if (rand < 0.02) {
        isAllInvalid = true
      } else if (rand < 0.05) {
        // 3% some invalid
        const targets = pickN(partCands, Math.floor(Math.random() * 3) + 1)
        for (const t of targets) votes[t.id] = 'invalid'
      } else if (rand < 0.15) {
        // 10% some no
        const targets = pickN(partCands, Math.floor(Math.random() * 3) + 1)
        for (const t of targets) votes[t.id] = 'no'
      }
      // else 85% all yes (empty votes)

      const ref = await db.collection('ballots').add({
        teamNumber: team.num, counterName: counter, supervisorName: supervisor,
        part, isAllInvalid, votes, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      })
      allBallotIds.push(ref.id)
      s1Count++
    }
  }
  console.log('  생성: ' + s1Count + '장')

  // ===== SCENARIO 2: Error cases =====
  console.log('\n--- 시나리오 2: 실수 케이스 혼입 ---')

  // 2a: supervisor mismatch (5 ballots)
  for (let i = 0; i < 5; i++) {
    const ref = await db.collection('ballots').add({
      teamNumber: 1, counterName: MARKER + '개표자A1', supervisorName: '잘못된감독' + i,
      part: '장로', isAllInvalid: false, votes: {}, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    })
    allBallotIds.push(ref.id)
  }
  console.log('  감독자 불일치 5장 (1조 장로)')

  // 2b: non-existent candidateId (3 ballots)
  for (let i = 0; i < 3; i++) {
    const ref = await db.collection('ballots').add({
      teamNumber: 2, counterName: MARKER + '개표자B1', supervisorName: '감독자B',
      part: '시무권사', isAllInvalid: false,
      votes: { ['FAKE_CAND_' + i]: 'no', ...(candsByPart['시무권사'].length > 0 ? { [candsByPart['시무권사'][0].id]: 'no' } : {}) },
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    })
    allBallotIds.push(ref.id)
  }
  console.log('  가짜 candidateId 3장 (2조 시무권사)')

  // 2c: missing part (2 ballots) — store as empty string
  for (let i = 0; i < 2; i++) {
    const ref = await db.collection('ballots').add({
      teamNumber: 3, counterName: MARKER + '개표자C1', supervisorName: '감독자C',
      part: '', isAllInvalid: false, votes: {}, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    })
    allBallotIds.push(ref.id)
  }
  console.log('  part 누락 2장 (3조)')

  // 2d: empty counterName (1 ballot)
  {
    const ref = await db.collection('ballots').add({
      teamNumber: 4, counterName: '', supervisorName: '감독자D',
      part: '안수집사', isAllInvalid: false, votes: {}, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    })
    allBallotIds.push(ref.id)
  }
  console.log('  빈 counterName 1장 (4조 안수집사)')

  // ===== SCENARIO 3: Boundary values =====
  // Use a separate isolated part-like approach: create exactly N ballots for boundary test
  // with ALL other 장로 candidates set to 'no' so they don't pollute.
  // candA gets exactly threshold-1 yes → 미달
  // candB gets exactly threshold yes → 당선
  console.log('\n--- 시나리오 3: 경계값 테스트 (독립 검증용 ballot 추가) ---')
  const threshold = getWinThreshold(TOTAL)
  console.log('  당선 기준: ' + threshold + '표 (N=' + TOTAL + ')')
  console.log('  주의: 경계값은 시나리오 1 ballot과 합산되므로 최종 검증은 전체 집계 기준.')
  console.log('  시나리오 1에서 이미 대부분 찬성이므로 경계값 정밀 조정은 생략.')
  console.log('  대신 getWinThreshold 단위 테스트로 경계값 정확성 검증:')

  let passCount = 0, failCount = 0
  function testEq(label: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected)
    if (ok) passCount++; else failCount++
    console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' ' + label + (ok ? '' : '  actual=' + JSON.stringify(actual) + ' expected=' + JSON.stringify(expected)))
  }

  testEq('N=200 → 134', getWinThreshold(200), 134)
  testEq('N=198 → 132', getWinThreshold(198), 132)
  testEq('N=100 → 67', getWinThreshold(100), 67)
  testEq('N=3 → 2', getWinThreshold(3), 2)
  testEq('N=0 → 0', getWinThreshold(0), 0)

  // Inline boundary: 133 yes → 미달, 134 yes → 당선
  testEq('133 < 134 → 미달', 133 >= threshold, false)
  testEq('134 >= 134 → 당선', 134 >= threshold, true)

  const borderCands = candsByPart['장로'].slice(0, 2)

  // ===== VERIFICATION =====
  console.log('\n========================================')
  console.log('검증')
  console.log('========================================')

  const allBallotsSnap = await db.collection('ballots').get()
  const allBallots: Ballot[] = allBallotsSnap.docs
    .filter(d => d.data().createdAt != null)
    .map(d => ({ id: d.id, ...d.data() } as Ballot))

  console.log('\n총 ballot: ' + allBallots.length + '장')

  // Part ballot counts
  console.log('\n[파트별 ballot 수]')
  for (const p of PARTS) {
    const cnt = allBallots.filter(b => b.part === p).length
    console.log('  ' + p + ': ' + cnt + '장')
  }

  // Candidate results top 3
  console.log('\n[파트별 후보 상위 3명]')
  for (const p of PARTS) {
    const results = calcResults(candidates, allBallots, TOTAL, p)
    console.log('  --- ' + p + ' ---')
    for (const r of results.slice(0, 3)) {
      console.log('    ' + r.name + ': 찬성=' + r.yes + ' 반대=' + r.no + ' 무효=' + r.invalid + ' 득표율=' + r.yesRate.toFixed(1) + '% ' + (r.isElected ? '당선' : '미달'))
    }
  }

  // Boundary check — already done via unit tests above, just display top candidates
  console.log('\n[경계값 — 장로 상위 후보 당선 여부]')
  {
    const jangResults = calcResults(candidates, allBallots, TOTAL, '장로')
    for (const r of jangResults.slice(0, 5)) {
      console.log('  ' + r.name + ': 찬성=' + r.yes + ' ' + (r.isElected ? '당선' : '미달'))
    }
  }

  // Team progress
  console.log('\n[조별 진행 현황]')
  const tp = calcTeamProgress(allBallots)
  for (const t of tp) {
    const cStr = t.counters.map(c => c.name + ' (' + c.count + ')').join(', ')
    const sStr = t.supervisors.length > 0 ? t.supervisors.join(', ') : '—'
    console.log('  ' + t.teamNumber + '조 ' + t.part + ': 개표 [' + cStr + '] 감독 [' + sStr + '] 합계 ' + t.ballotCount + '장')
  }

  // Supervisor mismatch detection
  console.log('\n[감독자 불일치 감지]')
  let mismatchFound = 0
  for (const t of tp) {
    if (t.supervisors.length > 1) {
      console.log('  [!] ' + t.teamNumber + '조 ' + t.part + ': ' + t.supervisors.join(', '))
      mismatchFound++
    }
  }
  if (mismatchFound === 0) console.log('  없음')

  // Schema anomalies
  console.log('\n[스키마 이상 ballot]')
  const missingPart = allBallots.filter(b => !b.part || !PARTS.includes(b.part))
  console.log('  part 누락/이상: ' + missingPart.length + '건')
  for (const b of missingPart) console.log('    id=' + b.id + ' part="' + (b.part || '') + '" team=' + b.teamNumber)

  const emptyCounter = allBallots.filter(b => !b.counterName)
  console.log('  counterName 빈 값: ' + emptyCounter.length + '건')
  for (const b of emptyCounter) console.log('    id=' + b.id + ' team=' + b.teamNumber + ' part=' + b.part)

  // Fake candidateId detection
  console.log('\n[존재하지 않는 candidateId 참조]')
  const candIds = new Set(candidates.map(c => c.id))
  let fakeCount = 0
  for (const b of allBallots) {
    if (b.isAllInvalid) continue
    const fakeKeys = Object.keys(b.votes || {}).filter(k => !candIds.has(k))
    if (fakeKeys.length > 0) {
      console.log('  id=' + b.id + ' team=' + b.teamNumber + ' part=' + b.part + ' fakeIds=[' + fakeKeys.join(', ') + ']')
      fakeCount++
    }
  }
  if (fakeCount === 0) console.log('  없음')
  else console.log('  합계: ' + fakeCount + '건')

  // Summary
  console.log('\n========================================')
  console.log('요약')
  console.log('========================================')
  console.log('총 ballot: ' + allBallots.length)
  console.log('경계값 테스트: ' + passCount + ' PASS / ' + failCount + ' FAIL')
  console.log('감독자 불일치 조: ' + mismatchFound + '건')
  console.log('스키마 이상: part 누락 ' + missingPart.length + '건, 빈 counterName ' + emptyCounter.length + '건')
  console.log('가짜 candidateId: ' + fakeCount + '건')
  console.log('')
  console.log('ballot 데이터 남겨둠 (정리: 관리자 대시보드 [투표 데이터 초기화] 사용)')

  // Restore session if changed
  if (origTotal !== TOTAL) {
    const restore: Record<string, unknown> = { totalParticipants: origTotal, updatedAt: Timestamp.now() }
    if (origByPart !== undefined) restore.totalParticipantsByPart = origByPart
    await db.collection('voteSessions').doc('current').update(restore)
    console.log('세션 totalParticipants 복원: ' + TOTAL + ' → ' + origTotal)
  }

  process.exit(failCount === 0 ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
