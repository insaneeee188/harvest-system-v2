import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inisialisasi Firebase Admin yang aman untuk Vercel build
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

export async function POST(request) {
  try {
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database belum siap' }, { status: 500 });
    }

    const { userId, level, answers } = await request.json(); 

    if (!userId || !answers) {
      return NextResponse.json({ success: false, error: 'Data pengiriman kuis tidak lengkap' }, { status: 400 });
    }

    // Mengambil soal kuis berdasarkan level dari Firestore
    const quizzesSnap = await db.collection('academy_quizzes').where('level', '==', parseInt(level, 10) || 1).get();
    
    let correctCount = 0;
    let totalQuestions = quizzesSnap.docs.length;

    quizzesSnap.docs.forEach(docSnap => {
      const quizData = docSnap.data();
      const userAns = answers[docSnap.id];
      if (userAns && userAns === quizData.jawabanBenar) {
        correctCount++;
      }
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= 70; // Standar kelulusan 70

    // Menyimpan riwayat hasil kuis ke Firestore
    await db.collection('quiz_results').add({
      userId,
      level: parseInt(level, 10) || 1,
      score,
      passed,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      score, 
      passed, 
      correctCount, 
      totalQuestions 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}