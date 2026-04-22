import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import { calculateCandidateResults, calculatePartStats, getPartTotal } from '../src/lib/voteCalculator'
import type { Candidate, Ballot, VoteSession, VotePart } from '../src/types/vote'

const serviceAccountPath = 'D:\\Dropbox\\Dropbox\\serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'hizzi-board',
})

const db = getFirestore()

const PARTS: VotePart[] = ['장로', '시무권사', '안수집사']

async function main() {
  const sessionSnap = await db.collection('voteSessions').doc('current').get()
  if (!sessionSnap.exists) {
    console.error('[FAIL] voteSessions/current 없음')
    process.exit(1)
  }
  const session = { id: 'current', ...sessionSnap.data() } as VoteSession

  const candSnap = await db.collection('candidates').get()
  const candidates: Candidate[] = candSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Candidate))
    .sort((a, b) => a.order - b.order)

  const ballotSnap = await db.collection('ballots').get()
  const ballots: Ballot[] = ballotSnap.docs
    .filter((d) => d.data().createdAt != null)
    .map((d) => ({ id: d.id, ...d.data() } as Ballot))

  const snapshot: {
    capturedAt: string
    sessionId: string
    parts: Record<string, {
      totalParticipants: number
      threshold: number
      validCount: number
      invalidCount: number
      missingCount: number
      candidateCount: number
      electedCount: number
      rejectedCount: number
      candidates: Array<{
        name: string
        yes: number
        no: number
        invalid: number
        yesRate: number
        isElected: boolean
      }>
    }>
  } = {
    capturedAt: new Date().toISOString(),
    sessionId: 'current',
    parts: {},
  }

  for (const part of PARTS) {
    const partTotal = getPartTotal(session, part)
    const stats = calculatePartStats(ballots, candidates, part, partTotal)
    const results = calculateCandidateResults(candidates, ballots, partTotal, part)
    snapshot.parts[part] = {
      totalParticipants: stats.totalParticipants,
      threshold: stats.threshold,
      validCount: stats.validCount,
      invalidCount: stats.invalidCount,
      missingCount: stats.missingCount,
      candidateCount: stats.candidateCount,
      electedCount: stats.electedCount,
      rejectedCount: stats.rejectedCount,
      candidates: results.map((r) => ({
        name: r.name,
        yes: r.yes,
        no: r.no,
        invalid: r.invalid,
        yesRate: Number(r.yesRate.toFixed(6)),
        isElected: r.isElected,
      })),
    }
  }

  const outDir = path.join(__dirname, 'snapshots')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const fileTs = snapshot.capturedAt.replace(/[:.]/g, '-')
  const outPath = path.join(outDir, 'snapshot-' + fileTs + '.json')
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf-8')

  console.log('스냅샷 저장: ' + outPath)
  for (const part of PARTS) {
    const p = snapshot.parts[part]
    console.log('  ' + part + ': 전체 ' + p.totalParticipants + ' / 당선기준 ' + p.threshold + ' / 유효 ' + p.validCount + ' / 무효 ' + p.invalidCount + ' / 회수X ' + p.missingCount + ' / 당선 ' + p.electedCount + ' / 탈락 ' + p.rejectedCount)
  }
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
