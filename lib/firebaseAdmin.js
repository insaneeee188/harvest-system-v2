import admin from 'firebase-admin';

const getFirebaseAdmin = () => {
  const firebaseAdmin = admin.default || admin;

  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  return {
    adminDb: firebaseAdmin.firestore(),
    adminMessaging: firebaseAdmin.messaging(),
  };
};

const { adminDb, adminMessaging } = getFirebaseAdmin();
export { adminDb, adminMessaging };