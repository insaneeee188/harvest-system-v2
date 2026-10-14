import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function GET() {
  try {
    // Mengambil data pengguna/agen untuk ditampilkan di leaderboard
    const snapshot = await db.collection('users').limit(20).get();
    const leaderboardData = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Agent',
      points: doc.data().points || 0,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, data: leaderboardData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}