import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inisialisasi Firebase Admin yang kebal error saat build Vercel
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin init error:', error);
  }
}

const db = getApps().length > 0 ? getFirestore() : null;

// Biarkan fungsi GET, POST, atau logika leaderboard Kakak yang ada di bawahnya tetap seperti semula.
// Hanya pastikan mereka menggunakan variabel 'db' yang sudah diinisialisasi di atas.