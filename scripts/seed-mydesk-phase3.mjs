import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SA_PATH = resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const TAG = 'mydesk-phase3';
const ME = 'admin@company.com';
const ts = admin.firestore.FieldValue.serverTimestamp;

async function seed() {
  const ids = [];
  const memos = [
    { content: '__p3_업무메모A', taskType: 'work', starred: true, deleted: false },
    { content: '__p3_업무메모B', taskType: 'work', starred: false, deleted: false },
    { content: '__p3_개인메모', taskType: 'personal', starred: false, deleted: false, visibleTo: [ME] },
    { content: '__p3_삭제업무', taskType: 'work', deleted: true, deletedAt: new Date(Date.now() - 86400000) },
    { content: '__p3_삭제개인', taskType: 'personal', deleted: true, deletedAt: new Date(Date.now() - 172800000) },
  ];
  for (const m of memos) {
    const ref = await db.collection('posts').add({
      panelId: 'admin', author: ME, category: '메모',
      visibleTo: m.visibleTo || [], completed: false,
      createdAt: ts(), updatedAt: ts(), seedTag: TAG, ...m,
    });
    ids.push(ref.id);
  }
  console.log(`[seed] 메모 ${ids.length}건 (표시 3 / 휴지통 2)`);
}

async function clear() {
  const snap = await db.collection('posts').where('seedTag', '==', TAG).get();
  for (const d of snap.docs) await d.ref.delete();
  console.log(`[clear] ${snap.size}건 삭제`);
}

const cmd = process.argv[2];
if (cmd === 'seed') seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
else if (cmd === 'clear') clear().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
else { console.log('사용: node scripts/seed-mydesk-phase3.mjs [seed|clear]'); process.exit(1); }
