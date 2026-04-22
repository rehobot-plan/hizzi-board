/**
 * MY DESK Phase 2 시드 — E2E 테스트용
 * node scripts/seed-mydesk-phase2.mjs seed
 * node scripts/seed-mydesk-phase2.mjs clear
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SA_PATH = resolve('D:/Dropbox/Dropbox/serviceAccount.json');
const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const TAG = 'mydesk-phase2';
const ME = 'admin@company.com';
const ME_PANEL = 'admin';
const U1 = 'oilpig85@gmail.com';

function todayKey() {
  const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(n) {
  const d = new Date(); d.setDate(d.getDate()+n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function seed() {
  const today = todayKey();
  const ids = { posts: [], todoRequests: [] };
  const ts = admin.firestore.FieldValue.serverTimestamp;

  // 진행 중 — 업무 4건
  const activePosts = [
    { content: '__p2_오늘기한업무', dueDate: today, taskType: 'work', starred: true },
    { content: '__p2_D2업무', dueDate: addDays(2), taskType: 'work', starred: false },
    { content: '__p2_D7업무', dueDate: addDays(7), taskType: 'work', starred: false },
    { content: '__p2_기한없는업무', taskType: 'work', starred: false },
  ];
  // 진행 중 — 개인 1건
  const personalPost = { content: '__p2_개인할일', dueDate: addDays(1), taskType: 'personal', starred: false };
  // 진행 중 — 요청 1건 (requestId 연결)
  const reqRef = await db.collection('todoRequests').add({
    fromEmail: U1, fromPanelId: 'panel-3', toEmail: ME, toPanelId: ME_PANEL,
    title: '__p2_요청할일', content: '테스트 요청', visibleTo: [], status: 'accepted',
    createdAt: ts(), resolvedAt: ts(), seedTag: TAG,
  });
  ids.todoRequests.push(reqRef.id);
  const requestPost = {
    content: '__p2_요청할일', dueDate: today, taskType: 'work', starred: false,
    requestId: reqRef.id, requestFrom: U1, requestTitle: '__p2_요청할일', requestContent: '테스트',
  };

  // 완료 2건
  const completedPosts = [
    { content: '__p2_완료업무', taskType: 'work', completed: true, completedAt: new Date(Date.now() - 86400000) },
    { content: '__p2_완료개인', taskType: 'personal', completed: true, completedAt: new Date(Date.now() - 172800000) },
  ];

  // 휴지통 2건
  const trashPosts = [
    { content: '__p2_삭제업무', taskType: 'work', deleted: true, deletedAt: new Date(Date.now() - 86400000) },
    { content: '__p2_삭제개인', taskType: 'personal', deleted: true, deletedAt: new Date(Date.now() - 259200000) },
  ];

  const allPosts = [
    ...activePosts.map(p => ({ ...p, completed: false, deleted: false })),
    { ...personalPost, completed: false, deleted: false, visibleTo: [ME] },
    { ...requestPost, completed: false, deleted: false },
    ...completedPosts.map(p => ({ ...p, deleted: false })),
    ...trashPosts.map(p => ({ ...p, completed: false })),
  ];

  for (const p of allPosts) {
    const ref = await db.collection('posts').add({
      panelId: ME_PANEL, author: ME, category: '할일',
      visibleTo: p.visibleTo || [], createdAt: ts(), updatedAt: ts(),
      seedTag: TAG, ...p,
    });
    ids.posts.push(ref.id);
  }

  console.log(`[seed] posts ${ids.posts.length} / todoRequests ${ids.todoRequests.length}`);
  console.log(`[seed] 진행 6 (업무4+개인1+요청1) / 완료 2 / 휴지통 2 = 총 10`);
}

async function clear() {
  let total = 0;
  for (const col of ['posts', 'todoRequests']) {
    const snap = await db.collection(col).where('seedTag', '==', TAG).get();
    for (const d of snap.docs) { await d.ref.delete(); total++; }
    console.log(`[clear] ${col}: ${snap.size}`);
  }
  console.log(`[clear] 총 ${total}건`);
}

const cmd = process.argv[2];
if (cmd === 'seed') seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
else if (cmd === 'clear') clear().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
else { console.log('사용: node scripts/seed-mydesk-phase2.mjs [seed|clear]'); process.exit(1); }
