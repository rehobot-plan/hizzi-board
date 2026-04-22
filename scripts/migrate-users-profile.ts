/**
 * Phase P-1 마이그레이션: users 컬렉션에 photoURL / department / position 3필드 기본값("") 추가
 * 실행: npx tsx scripts/migrate-users-profile.ts
 * 근거: md/plan/designs/profile.md §2
 */
import * as admin from 'firebase-admin';
import * as path from 'path';

const SERVICE_ACCOUNT_PATH = path.resolve('D:/Dropbox/Dropbox/serviceAccount.json');

const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const NEW_FIELDS = ['photoURL', 'department', 'position'] as const;

async function migrate() {
  const snap = await db.collection('users').get();
  let total = 0;
  let updated = 0;
  let skipped = 0;

  for (const docSnap of snap.docs) {
    total++;
    const data = docSnap.data();
    const patch: Record<string, string> = {};
    for (const key of NEW_FIELDS) {
      if (data[key] === undefined) {
        patch[key] = '';
      }
    }
    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }
    await docSnap.ref.update(patch);
    updated++;
    console.log(`[updated] ${docSnap.id} ${data.email || ''} — 추가 필드 ${Object.keys(patch).join(',')}`);
  }

  console.log('');
  console.log(`총 ${total}건 / 업데이트 ${updated}건 / 스킵(이미 있음) ${skipped}건`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('마이그레이션 실패:', err);
    process.exit(1);
  });
