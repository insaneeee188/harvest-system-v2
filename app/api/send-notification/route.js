import { NextResponse } from 'next/server';
// Pastikan huruf besar/kecil pada nama file 'firebaseadmin' sesuai dengan yang ada di folder lib Kakak
import { adminMessaging } from '../../../lib/firebaseadmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, title, message, targetUrl } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'FCM Token wajib disertakan.' }, { status: 400 });
    }

    if (!adminMessaging) {
      return NextResponse.json({ success: false, error: 'Firebase Admin belum siap.' }, { status: 500 });
    }

    // Menggunakan FCM SDK dari lib/firebaseadmin.js
    const payload = {
      notification: {
        title: title || 'Harvest Agency',
        body: message || 'Pembaruan informasi penting.',
      },
      data: {
        targetUrl: targetUrl || '/',
      },
      token: token,
    };

    const response = await adminMessaging.send(payload);

    return NextResponse.json({
      success: true,
      message: 'Notifikasi berhasil dikirim!',
      messageId: response,
    });
  } catch (error) {
    console.error('Error FCM Backend:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}