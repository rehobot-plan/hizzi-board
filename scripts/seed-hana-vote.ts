import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import path from 'path'
import readline from 'readline'

const serviceAccountPath = 'D:\\Dropbox\\Dropbox\\serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

initializeApp({
  credential: cert(serviceAccount),
  projectId: 'hizzi-board',
})

const db = getFirestore()

function askConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

async function deleteAll(col: string): Promise<number> {
  const snap = await db.collection(col).get()
  if (snap.empty) return 0
  const batch = db.batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  return snap.size
}

async function main() {
  console.log('Hana Vote 시드 스크립트')
  console.log('================================')

  const ok = await askConfirm('기존 voteSessions / candidates / teams / ballots 전량 삭제 후 재생성합니다. 계속? (y/n): ')
  if (!ok) {
    console.log('취소됨.')
    process.exit(0)
  }

  for (const col of ['voteSessions', 'candidates', 'teams', 'ballots']) {
    const n = await deleteAll(col)
    console.log('  [삭제] ' + col + ': ' + n + '건')
  }

  const sessionData = JSON.parse(readFileSync(path.join(__dirname, 'data', 'hana-vote-session.json'), 'utf-8'))
  await db.collection('voteSessions').doc('current').set({
    ...sessionData,
    isFinalized: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  console.log('  [생성] voteSessions: 1건')

  const candidatesCsv = readFileSync(path.join(__dirname, 'data', 'hana-vote-candidates.csv'), 'utf-8')
  const candidateRows = parse(candidatesCsv, { columns: true, skip_empty_lines: true, bom: true })
  let c = 0
  for (const row of candidateRows) {
    await db.collection('candidates').add({
      part: row.part,
      name: row.name,
      order: Number(row.order),
      isBlue: row.isBlue === 'true',
      createdAt: Timestamp.now(),
    })
    c++
  }
  console.log('  [생성] candidates: ' + c + '건')

  const teamsCsv = readFileSync(path.join(__dirname, 'data', 'hana-vote-teams.csv'), 'utf-8')
  const teamRows = parse(teamsCsv, { columns: true, skip_empty_lines: true, bom: true })
  let t = 0
  for (const row of teamRows) {
    await db.collection('teams').add({
      teamNumber: Number(row.teamNumber),
      part: row.part,
      counters: [row.counter1, row.counter2].filter(Boolean),
      supervisor: row.supervisor,
      createdAt: Timestamp.now(),
    })
    t++
  }
  console.log('  [생성] teams: ' + t + '건')

  console.log('================================')
  console.log('시드 완료.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
