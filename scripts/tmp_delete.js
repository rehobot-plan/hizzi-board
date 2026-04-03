const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sa = require('../serviceAccount.json');
initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  const snap = await db.collection('posts').get();
  let count = 0;
  for (const doc of snap.docs) {
    if (doc.data().category !== '할일') {
      await doc.ref.delete();
      count++;
    }
  }
  console.log('삭제 완료:', count, '개');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
