import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccountPath = 'D:\\Dropbox\\Dropbox\\serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
initializeApp({ credential: cert(serviceAccount), projectId: 'hizzi-board' })
const db = getFirestore()

type VotePart = '장로' | '시무권사' | '안수집사'
interface Candidate { id: string; part: VotePart; name: string; order: number }

const TOTAL = 180
const THRESHOLD = Math.ceil((TOTAL * 2) / 3) // 120

const TEAMS = [
  { num: 1, part: '장로' as VotePart, count: 90, counters: ['김민수', '이지은'], supervisor: '박철호' },
  { num: 2, part: '장로' as VotePart, count: 90, counters: ['정하늘', '송유진'], supervisor: '한도윤' },
  { num: 3, part: '시무권사' as VotePart, count: 90, counters: ['최서연', '윤정아'], supervisor: '강태현' },
  { num: 4, part: '안수집사' as VotePart, count: 180, counters: ['오지훈', '임소라'], supervisor: '서영호' },
  { num: 5, part: '시무권사' as VotePart, count: 90, counters: ['배수현', '문가영'], supervisor: '조민재' },
]

// Assign each candidate a "no rate" based on distribution tiers
function assignNoRate(): number {
  const r = Math.random()
  if (r < 0.40) return 0.05 + Math.random() * 0.10   // 85-95% yes → 5-15% no
  if (r < 0.70) return 0.22 + Math.random() * 0.10   // 68-78% yes → 22-32% no
  if (r < 0.90) return 0.35 + Math.random() * 0.10   // 55-65% yes → 35-45% no
  return 0.45 + Math.random() * 0.15                  // 40-55% yes → 45-60% no
}

async function main() {
  console.log('=== Hana Vote 쇼케이스 시뮬레이션 ===')
  console.log('참여 인원: ' + TOTAL + '명, 당선 기준: ' + THRESHOLD + '표')
  console.log('')

  // Clean existing ballots
  console.log('[1] 기존 ballot 정리...')
  const existSnap = await db.collection('ballots').get()
  const chunkSize = 500
  for (let i = 0; i < existSnap.docs.length; i += chunkSize) {
    const batch = db.batch()
    existSnap.docs.slice(i, i + chunkSize).forEach(d => batch.delete(d.ref))
    await batch.commit()
  }
  console.log('  삭제: ' + existSnap.size + '건')

  // Set totalParticipants
  const sessSnap = await db.collection('voteSessions').doc('current').get()
  const origTotal = sessSnap.data()?.totalParticipants
  await db.collection('voteSessions').doc('current').update({
    totalParticipants: TOTAL,
    totalParticipantsByPart: { '장로': TOTAL, '시무권사': TOTAL, '안수집사': TOTAL },
    isFinalized: false,
    updatedAt: Timestamp.now(),
  })
  console.log('  세션 totalParticipants: ' + origTotal + ' → ' + TOTAL)

  // Load candidates
  const candSnap = await db.collection('candidates').get()
  const candidates: Candidate[] = candSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as Candidate))
    .sort((a, b) => a.order - b.order)

  const candsByPart: Record<VotePart, Candidate[]> = { '장로': [], '시무권사': [], '안수집사': [] }
  for (const c of candidates) candsByPart[c.part].push(c)
  console.log('  후보: 장로 ' + candsByPart['장로'].length + ' / 시무권사 ' + candsByPart['시무권사'].length + ' / 안수집사 ' + candsByPart['안수집사'].length)

  // Pre-assign no-rates per candidate (stable across all ballots)
  const candNoRate = new Map<string, number>()
  for (const c of candidates) candNoRate.set(c.id, assignNoRate())

  // Generate ballots
  console.log('\n[2] Ballot 생성...')
  let totalCreated = 0

  for (const team of TEAMS) {
    const partCands = candsByPart[team.part]
    for (let i = 0; i < team.count; i++) {
      // ~2% all invalid
      const isAllInvalid = Math.random() < 0.02
      const votes: Record<string, string> = {}

      if (!isAllInvalid) {
        for (const c of partCands) {
          const noRate = candNoRate.get(c.id)!
          const roll = Math.random()
          if (roll < noRate * 0.85) votes[c.id] = 'no'        // most opposition is 'no'
          else if (roll < noRate) votes[c.id] = 'invalid'       // small fraction is 'invalid'
          // else: yes (no entry)
        }
      }

      // Split between 2 counters — first gets slightly more
      const counter = i < Math.ceil(team.count * 0.55)
        ? team.counters[0]
        : team.counters[1]

      await db.collection('ballots').add({
        teamNumber: team.num,
        counterName: counter,
        supervisorName: team.supervisor,
        part: team.part,
        isAllInvalid,
        votes,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      totalCreated++
    }
    console.log('  ' + team.num + '조 ' + team.part + ': ' + team.count + '장 (' + team.counters.join(', ') + ' / 감독 ' + team.supervisor + ')')
  }

  console.log('  합계: ' + totalCreated + '장')

  // ===== Verification =====
  console.log('\n========================================')
  console.log('결과 요약')
  console.log('========================================')

  const allSnap = await db.collection('ballots').get()
  const allBallots = allSnap.docs
    .filter(d => d.data().createdAt != null)
    .map(d => ({ id: d.id, ...d.data() }))

  const parts: VotePart[] = ['장로', '시무권사', '안수집사']

  for (const part of parts) {
    const pb = allBallots.filter((b: any) => b.part === part)
    const partCands = candsByPart[part]

    console.log('\n--- ' + part + ' (' + pb.length + '장) ---')

    const results = partCands.map(c => {
      let yes = 0, no = 0, inv = 0
      for (const b of pb) {
        const bd = b as any
        if (bd.isAllInvalid) { inv++; continue }
        const v = bd.votes?.[c.id]
        if (v === 'no') no++
        else if (v === 'invalid') inv++
        else yes++
      }
      return { name: c.name, yes, no, invalid: inv, rate: TOTAL > 0 ? (yes / TOTAL * 100) : 0, elected: yes >= THRESHOLD }
    }).sort((a, b) => b.yes - a.yes)

    const elected = results.filter(r => r.elected).length
    const notElected = results.length - elected

    for (const r of results.slice(0, 5)) {
      console.log('  ' + r.name + ': 찬성 ' + r.yes + ' (' + r.rate.toFixed(1) + '%) ' + (r.elected ? '당선' : '미달'))
    }
    if (results.length > 5) console.log('  ... 외 ' + (results.length - 5) + '명')
    console.log('  당선 ' + elected + '명 / 미달 ' + notElected + '명')
  }

  // Team progress
  console.log('\n--- 조별 진행 현황 ---')
  const teamMap = new Map<string, { num: number; part: string; cm: Map<string, number>; sv: string; count: number }>()
  for (const b of allBallots) {
    const bd = b as any
    const k = bd.teamNumber + '-' + bd.part
    if (!teamMap.has(k)) teamMap.set(k, { num: bd.teamNumber, part: bd.part, cm: new Map(), sv: bd.supervisorName || '', count: 0 })
    const g = teamMap.get(k)!
    g.cm.set(bd.counterName, (g.cm.get(bd.counterName) ?? 0) + 1)
    g.count++
  }
  const sorted = [...teamMap.values()].sort((a, b) => a.num !== b.num ? a.num - b.num : a.part.localeCompare(b.part))
  for (const t of sorted) {
    const cStr = [...t.cm.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => n + ' (' + c + ')').join(', ')
    console.log('  ' + t.num + '조 ' + t.part + ': ' + cStr + ' · 감독 ' + t.sv + ' · 합계 ' + t.count + '장')
  }

  console.log('\n총 ballot: ' + totalCreated + '장')
  console.log('대시보드: /hana-vote/admin')
  console.log('보고서: /hana-vote/admin/report')
  console.log('정리: 대시보드 하단 [투표 데이터 초기화]')

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
