const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const sa = require('../serviceAccount.json');
initializeApp({ credential: cert(sa) });
const db = getFirestore();

(async () => {
  const snap = await db.collection('posts').get();
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync('scripts/posts_backup.json', JSON.stringify(data, null, 2));
  console.log('백업 완료:', data.length, '개');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

