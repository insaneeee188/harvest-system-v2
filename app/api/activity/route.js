import { NextResponse } from 'next/server';
// Menggunakan import spesifik dari Firebase Admin terbaru
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

// Mengambil instance Firestore dengan cara yang aman
const db = getApps().length > 0 ? getFirestore() : null;

export async function POST(request) {
  try {
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database belum siap' }, { status: 500 });
    }
    const body = await request.json();
    const docRef = await db.collection('activities').add({
      ...body,
      createdAt: new Date().toISOString()
    });
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database belum siap' }, { status: 500 });
    }
    const snapshot = await db.collection('activities').orderBy('createdAt', 'desc').limit(50).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}