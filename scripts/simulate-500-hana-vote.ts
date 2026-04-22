import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccountPath = 'D:\\Dropbox\\Dropbox\\serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

initializeApp({ credential: cert(serviceAccount), projectId: 'hizzi-board' })
const db = getFirestore()

type VotePart = '장로' | '시무권사' | '안수집사'
interface Candidate { id: string; part: VotePart; name: string; order: number; isBlue?: boolean }
interface Ballot { id: string; teamNumber: number; counterName: string; supervisorName?: string; part: VotePart; isAllInvalid: boolean; votes: Record<string, 'no' | 'invalid'>; createdAt: unknown; updatedAt: unknown }

function getWinThreshold(n: number) { return n <= 0 ? 0 : Math.ceil((n * 2) / 3) }

interface CandResult { candidateId: string; name: string; yes: number; no: number; invalid: number; yesRate: number; isElected: boolean }
function calcResults(cands: Candidate[], ballots: Ballot[], total: number, part: VotePart): CandResult[] {
  const pb = ballots.filter((b) => b.part === part)
  const thr = getWinThreshold(total)
  const r = cands.filter((c) => c.part === part).map((c) => {
    let yes = 0, no = 0, inv = 0
    for (const b of pb) {
      if (b.isAllInvalid) { inv++; continue }
      const v = b.votes?.[c.id]
      if (v === 'no') no++
      else if (v === 'invalid') inv++
      else yes++
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
  return [...map.values()].map((g) => ({
    teamNumber: g.teamNumber, part: g.part,
    counters: [...g.cm.entries()].map(([n, c]) => ({ name: n, count: c })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    supervisors: [...g.sv].sort(), ballotCount: g.count,
  })).sort((a, b) => a.teamNumber !== b.teamNumber ? a.teamNumber - b.teamNumber : a.part.localeCompare(b.part))
}

function rand(min: number, max: number): number { return Math.random() * (max - min) + min }
function randInt(min: number, max: number): number { return Math.floor(rand(min, max + 1)) }
function pickN<T>(arr: T[], n: number): T[] {
  const s = [...arr]; const r: T[] = []
  for (let i = 0; i < Math.min(n, s.length); i++) { const idx = Math.floor(Math.random() * s.length); r.push(s.splice(idx, 1)[0]) }
  return r
}

interface TeamSpec { num: number; part: VotePart; counters: [string, string]; supervisor: string; ballots: number }
const TEAMS: TeamSpec[] = [
  { num: 1, part: '장로',     counters: ['김민호', '박지훈'],   supervisor: '정태영', ballots: 250 },
  { num: 2, part: '장로',     counters: ['이성민', '장현우'],   supervisor: '윤재석', ballots: 250 },
  { num: 3, part: '시무권사', counters: ['최은지', '한소라'],   supervisor: '송미경', ballots: 170 },
  { num: 4, part: '시무권사', counters: ['조유진', '서연아'],   supervisor: '황혜정', ballots: 170 },
  { num: 5, part: '시무권사', counters: ['문지원', '배수빈'],   supervisor: '고은영', ballots: 160 },
  { num: 6, part: '안수집사', counters: ['강도윤', '임주원'],   supervisor: '오세훈', ballots: 250 },
  { num: 7, part: '안수집사', counters: ['허준서', '남경필'],   supervisor: '류인하', ballots: 250 },
]

const TOTAL = 500
const PARTS: VotePart[] = ['장로', '시무권사', '안수집사']

async function wipeBallots(): Promise<number> {
  const snap = await db.collection('ballots').get()
  if (snap.empty) return 0
  let deleted = 0
  const chunk = 400
  for (let i = 0; i < snap.docs.length; i += chunk) {
    const batch = db.batch()
    for (const d of snap.docs.slice(i, i + chunk)) batch.delete(d.ref)
    await batch.commit()
    deleted += Math.min(chunk, snap.docs.length - i)
  }
  return deleted
}

type Tier = 'safe' | 'borderline' | 'miss' | 'clearMiss'
function assignTiers(candidates: Candidate[]): Map<string, { tier: Tier; targetRate: number }> {
  const map = new Map<string, { tier: Tier; targetRate: number }>()
  for (const c of candidates) {
    const r = Math.random()
    let tier: Tier, targetRate: number
    if (r < 0.40)      { tier = 'safe';       targetRate = rand(0.85, 0.95) }
    else if (r < 0.70) { tier = 'borderline'; targetRate = rand(0.68, 0.78) }
    else if (r < 0.90) { tier = 'miss';       targetRate = rand(0.55, 0.65) }
    else               { tier = 'clearMiss';  targetRate = rand(0.40, 0.55) }
    map.set(c.id, { tier, targetRate })
  }
  return map
}

async function main() {
  console.log('========================================')
  console.log('Hana Vote 500명 부하 시뮬레이션')
  console.log('========================================\n')

  const candSnap = await db.collection('candidates').get()
  const candidates: Candidate[] = candSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Candidate)).sort((a, b) => a.order - b.order)
  console.log('후보 로드: ' + candidates.length + '명')
  const candsByPart: Record<VotePart, Candidate[]> = { '장로': [], '시무권사': [], '안수집사': [] }
  for (const c of candidates) candsByPart[c.part].push(c)
  for (const p of PARTS) console.log('  ' + p + ': ' + candsByPart[p].length + '명')

  console.log('\n[사전정리] 기존 ballots 전량 삭제')
  const wiped = await wipeBallots()
  console.log('  삭제: ' + wiped + '건')

  const sessRef = db.collection('voteSessions').doc('current')
  const sessSnap = await sessRef.get()
  const origTotal = sessSnap.data()?.totalParticipants
  await sessRef.update({
    totalParticipants: TOTAL,
    totalParticipantsByPart: { '장로': TOTAL, '시무권사': TOTAL, '안수집사': TOTAL },
    updatedAt: Timestamp.now(),
  })
  console.log('\n세션 totalParticipants: ' + origTotal + ' → ' + TOTAL + ' (시뮬레이션 종료 후 ' + TOTAL + ' 유지, 오너 수동 복원)')

  console.log('\n[팀 구성 · 파트별 500장 목표]')
  for (const t of TEAMS) {
    console.log('  ' + t.num + '팀 ' + t.part + ' — 개표 [' + t.counters[0] + ', ' + t.counters[1] + '] 감독 [' + t.supervisor + '] 할당 ' + t.ballots + '장')
  }

  const tierByCandidate: Record<VotePart, Map<string, { tier: Tier; targetRate: number }>> = {
    '장로': assignTiers(candsByPart['장로']),
    '시무권사': assignTiers(candsByPart['시무권사']),
    '안수집사': assignTiers(candsByPart['안수집사']),
  }

  console.log('\n[tier 분포]')
  for (const p of PARTS) {
    const counts: Record<Tier, number> = { safe: 0, borderline: 0, miss: 0, clearMiss: 0 }
    for (const v of tierByCandidate[p].values()) counts[v.tier]++
    console.log('  ' + p + ': safe=' + counts.safe + ' borderline=' + counts.borderline + ' miss=' + counts.miss + ' clearMiss=' + counts.clearMiss)
  }

  console.log('\n[ballot 투입]')
  const invalidRate = 0.02
  let totalInserted = 0, totalAllInvalid = 0
  const t0 = Date.now()

  for (const team of TEAMS) {
    const partCands = candsByPart[team.part]
    const rates = tierByCandidate[team.part]
    const splitA = Math.floor(team.ballots / 2) + (Math.random() < 0.5 ? 0 : 1)
    const counterAssign: string[] = []
    for (let i = 0; i < team.ballots; i++) counterAssign.push(i < splitA ? team.counters[0] : team.counters[1])

    let inserted = 0
    const chunk = 400
    for (let offset = 0; offset < team.ballots; offset += chunk) {
      const batch = db.batch()
      const end = Math.min(offset + chunk, team.ballots)
      for (let i = offset; i < end; i++) {
        const counter = counterAssign[i]
        let isAllInvalid = false
        const votes: Record<string, 'no' | 'invalid'> = {}

        if (Math.random() < invalidRate) {
          isAllInvalid = true
          totalAllInvalid++
        } else {
          for (const c of partCands) {
            const meta = rates.get(c.id)!
            const r = Math.random()
            if (r > meta.targetRate) {
              const pickInv = Math.random() < 0.15
              votes[c.id] = pickInv ? 'invalid' : 'no'
            }
          }
        }

        const ref = db.collection('ballots').doc()
        batch.set(ref, {
          teamNumber: team.num,
          counterName: counter,
          supervisorName: team.supervisor,
          part: team.part,
          isAllInvalid,
          votes: isAllInvalid ? {} : votes,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        inserted++
      }
      await batch.commit()
    }
    totalInserted += inserted
    console.log('  ' + team.num + '팀 ' + team.part + ': ' + inserted + '장')
  }
  const tInsertMs = Date.now() - t0
  console.log('  ----------------------------------------')
  console.log('  총 투입: ' + totalInserted + '장 (전체무효 ' + totalAllInvalid + '장)')
  console.log('  투입 소요: ' + tInsertMs + ' ms')

  console.log('\n[집계 검증]')
  const tAggStart = Date.now()
  const ballotsSnap = await db.collection('ballots').get()
  const ballots: Ballot[] = ballotsSnap.docs
    .filter((d) => d.data().createdAt != null)
    .map((d) => ({ id: d.id, ...d.data() } as Ballot))
  const tFetchMs = Date.now() - tAggStart

  const tCalcStart = Date.now()
  const resultsByPart: Record<VotePart, CandResult[]> = {
    '장로': calcResults(candidates, ballots, TOTAL, '장로'),
    '시무권사': calcResults(candidates, ballots, TOTAL, '시무권사'),
    '안수집사': calcResults(candidates, ballots, TOTAL, '안수집사'),
  }
  const progress = calcTeamProgress(ballots)
  const tCalcMs = Date.now() - tCalcStart

  console.log('  ballot fetch: ' + tFetchMs + ' ms (' + ballots.length + '장)')
  console.log('  집계 계산:    ' + tCalcMs + ' ms (후보 ' + candidates.length + '명 × 3 파트)')
  console.log('  총 검증 소요: ' + (tFetchMs + tCalcMs) + ' ms')

  console.log('\n[파트별 ballot 수]')
  for (const p of PARTS) {
    const cnt = ballots.filter((b) => b.part === p).length
    console.log('  ' + p + ': ' + cnt + '장')
  }

  const threshold = getWinThreshold(TOTAL)
  console.log('\n[당선 기준]  N=' + TOTAL + ' → ' + threshold + '표 이상 (2/3 올림)')

  console.log('\n[파트별 상위 5명]')
  for (const p of PARTS) {
    console.log('  --- ' + p + ' ---')
    for (const r of resultsByPart[p].slice(0, 5)) {
      const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - s.length))
      console.log('    ' + pad(r.name, 8) + ' 찬성=' + pad(String(r.yes), 4) + ' 반대=' + pad(String(r.no), 4) + ' 무효=' + pad(String(r.invalid), 4) + ' 득표율=' + r.yesRate.toFixed(1).padStart(5, ' ') + '%  ' + (r.isElected ? '당선' : '미달'))
    }
  }

  console.log('\n[경계값 검증]')
  let passCount = 0, failCount = 0
  const test = (label: string, actual: unknown, expected: unknown) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected)
    if (ok) passCount++; else failCount++
    console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' ' + label + (ok ? '' : '  actual=' + JSON.stringify(actual) + ' expected=' + JSON.stringify(expected)))
  }
  test('N=500 threshold = 334', getWinThreshold(500), 334)
  test('333 < 334 → 미달', 333 >= threshold, false)
  test('334 >= 334 → 당선', 334 >= threshold, true)
  test('335 >= 334 → 당선', 335 >= threshold, true)

  console.log('\n[팀별 진행 현황]')
  for (const t of progress) {
    const cStr = t.counters.map((c) => c.name + ' (' + c.count + ')').join(', ')
    const sStr = t.supervisors.length > 0 ? t.supervisors.join(', ') : '—'
    console.log('  ' + t.teamNumber + '팀 ' + t.part + ': 개표 [' + cStr + '] 감독 [' + sStr + '] 합계 ' + t.ballotCount + '장')
  }

  console.log('\n========================================')
  console.log('요약')
  console.log('========================================')
  console.log('총 ballot: ' + ballots.length + '장')
  console.log('전체무효: ' + totalAllInvalid + '장 (' + (totalAllInvalid / ballots.length * 100).toFixed(1) + '%)')
  console.log('당선자 수: ' + PARTS.map((p) => p + ' ' + resultsByPart[p].filter((r) => r.isElected).length + '명').join(' · '))
  console.log('경계값 테스트: ' + passCount + ' PASS / ' + failCount + ' FAIL')
  console.log('성능: 투입 ' + tInsertMs + 'ms / 집계 ' + (tFetchMs + tCalcMs) + 'ms (목표 <3000ms)')
  console.log('')
  console.log('ballot 데이터는 남겨둠. 관리자 대시보드·보고서에서 확인 가능.')
  console.log('정리 시 관리자 대시보드 [투표 데이터 초기화] 사용.')
  console.log('totalParticipants: ' + TOTAL + ' 유지 (복원하려면 관리자 화면에서 수동 변경)')

  process.exit(failCount === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
