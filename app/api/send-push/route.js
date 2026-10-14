import { NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '../../../lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { title, body, targetUrl } = await request.json();

    // Ambil semua token perangkat dari koleksi 'users' di Firestore
    const usersSnapshot = await adminDb.collection('users').get();
    const tokens = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fcmToken) {
        tokens.push(data.fcmToken);
      }
    });

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada token perangkat terdaftar.' });
    }

    const message = {
      notification: {
        title: title || 'Pembaruan Baru Harvest Agency',
        body: body || 'Ada informasi atau event penting baru.',
      },
      data: {
        targetUrl: targetUrl || '/',
      },
      tokens: tokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    return NextResponse.json({
      success: true,
      message: `Notifikasi terkirim ke ${response.successCount} perangkat.`,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error('Error mengirim push notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}