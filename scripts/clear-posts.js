const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

try {
  initializeApp({
    credential: applicationDefault(),
  });
} catch (e) {
  // already initialized
}

const db = getFirestore();

(async () => {
  try {
    const snapshot = await db.collection('posts').get();
    if (snapshot.empty) {
      console.log('posts collection is already empty.');
      return;
    }
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('posts collection cleared.');
  } catch (error) {
    console.error('Failed to clear posts collection:', error);
    process.exit(1);
  }
})();