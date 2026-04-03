const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanup() {
  // todoRequests 전체 삭제
  const reqSnap = await db.collection('todoRequests').get();
  for (const d of reqSnap.docs) await d.ref.delete();
  console.log(`todoRequests 삭제: ${reqSnap.size}건`);

  // posts 중 requestId 있는 것만 삭제
  const postSnap = await db.collection('posts').get();
  let postCount = 0;
  for (const d of postSnap.docs) {
    if (d.data().requestId) {
      await d.ref.delete();
      postCount++;
    }
  }
  console.log(`요청 할일 삭제: ${postCount}건`);

  // calendarEvents 중 requestId 있는 것만 삭제
  const calSnap = await db.collection('calendarEvents').get();
  let calCount = 0;
  for (const d of calSnap.docs) {
    if (d.data().requestId) {
      await d.ref.delete();
      calCount++;
    }
  }
  console.log(`요청 달력 삭제: ${calCount}건`);

  console.log('완료!');
  process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });
