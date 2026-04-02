const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const sa = require('../serviceAccount.json');

initializeApp({ credential: cert(sa) });
const db = getFirestore();

const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

db.collection('posts').add({
  panelId: 'panel-3',
  type: 'text',
  content: '2일전 완료된 업무 할일 샘플',
  author: 'admin@company.com',
  category: '할일',
  visibleTo: ['admin@company.com'],
  taskType: 'work',
  starred: false,
  completed: true,
  completedAt: Timestamp.fromDate(twoDaysAgo),
  createdAt: Timestamp.fromDate(threeDaysAgo),
  updatedAt: Timestamp.fromDate(twoDaysAgo),
}).then((r) => {
  console.log('추가 완료:', r.id);
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});

