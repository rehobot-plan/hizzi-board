const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccount.json');

// Initialize Firebase Admin with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function initData() {
  try {
    // Create admin user
    let user;
    try {
      user = await auth.createUser({
        email: 'admin@company.com',
        password: 'admin1234!',
        displayName: 'Admin'
      });
      console.log('User created:', user.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('User already exists, fetching UID...');
        const userRecord = await auth.getUserByEmail('admin@company.com');
        user = { uid: userRecord.uid };
      } else {
        throw error;
      }
    }

    // Add user to Firestore
    await db.collection('users').doc(user.uid).set({
      email: 'admin@company.com',
      role: 'admin'
    }, { merge: true }); // Merge to update if exists

    // Add panels
    for (let i = 1; i <= 6; i++) {
      await db.collection('panels').doc(`panel-${i}`).set({
        name: `Panel ${i}`,
        id: `panel-${i}`
      }, { merge: true });
    }

    console.log('Initial data created successfully');
  } catch (error) {
    console.error('Error creating initial data:', error);
  }
}

initData();