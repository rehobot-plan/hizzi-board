const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('Missing FIREBASE config environment variables.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(async () => {
  try {
    const snapshot = await getDocs(collection(db, 'posts'));
    if (snapshot.empty) {
      console.log('posts collection is already empty.');
      return;
    }
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('posts collection cleared (client).');
  } catch (error) {
    console.error('Failed to clear posts collection:', error);
    process.exit(1);
  }
})();