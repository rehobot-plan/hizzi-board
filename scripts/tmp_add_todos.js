const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const sa = require('../serviceAccount.json');
initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(14, 30, 0, 0);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  threeDaysAgo.setHours(9, 0, 0, 0);

  await db.collection('posts').add({
    panelId: 'panel-3',
    type: 'text',
    content: '2일전 완료된 업무 할일 샘플 1',
    author: 'oilpig85@gmail.com',
    category: '할일',
    visibleTo: ['oilpig85@gmail.com'],
    taskType: 'work',
    starred: false,
    completed: true,
    completedAt: Timestamp.fromDate(twoDaysAgo),
    createdAt: Timestamp.fromDate(threeDaysAgo),
    updatedAt: Timestamp.fromDate(twoDaysAgo),
  });

  await db.collection('posts').add({
    panelId: 'panel-3',
    type: 'text',
    content: '2일전 완료된 개인 할일 샘플 2',
    author: 'oilpig85@gmail.com',
    category: '할일',
    visibleTo: ['oilpig85@gmail.com'],
    taskType: 'personal',
    starred: false,
    completed: true,
    completedAt: Timestamp.fromDate(twoDaysAgo),
    createdAt: Timestamp.fromDate(threeDaysAgo),
    updatedAt: Timestamp.fromDate(twoDaysAgo),
  });

  console.log('샘플 2개 추가 완료');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

