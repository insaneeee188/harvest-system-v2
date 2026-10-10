import admin from 'firebase-admin';

function getFirebaseAdmin() {
  const firebaseAdmin = admin.default || admin;
  
  if (!firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return firebaseAdmin;
}

// Lazy getters agar aman saat build-time Next.js
export const adminDb = {
  collection: (path) => getFirebaseAdmin().firestore().collection(path),
};

export const adminMessaging = {
  sendEachForMulticast: (message) => getFirebaseAdmin().messaging().sendEachForMulticast(message),
};