import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const _needsCleanup =
  typeof window !== 'undefined' &&
  !localStorage.getItem('firestore-cleanup-v2');

if (_needsCleanup && typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
  indexedDB.databases().then((dbs) => {
    const targets = dbs.filter((d) => d.name?.startsWith('firestore/'));
    localStorage.setItem('firestore-cleanup-v2', 'done');
    if (targets.length > 0) {
      targets.forEach((d) => { if (d.name) indexedDB.deleteDatabase(d.name); });
      window.location.reload();
    }
  }).catch(() => {
    localStorage.setItem('firestore-cleanup-v2', 'done');
  });
} else if (_needsCleanup) {
  localStorage.setItem('firestore-cleanup-v2', 'done');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
