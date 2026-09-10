// app/api/notify/route.js
import { sendTelegramNotification } from '../../../lib/telegram';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const rawData = body.data || body;

    // 1. Deteksi otomatis tipe notifikasi (YouTube webhook / Manual)
    let notificationType = body.type;
    if (!notificationType) {
      if (rawData.link || rawData.youtubeUrl || rawData.videoUrl || (rawData.status && rawData.status.toLowerCase() === 'unlisted')) {
        notificationType = 'video';
      } else {
        notificationType = 'event';
      }
    }

    // 2. Normalisasi Payload Data
    const payloadData = {
      ...rawData,
      title: rawData.title || rawData.judul || rawData.name || 'Video Baru',
      imageUrl: rawData.imageUrl || rawData.posterUrl || rawData.poster || rawData.image || rawData.gambar || null,
      target: rawData.target || rawData.targetPeserta || 'Semua'
    };

    if (!payloadData || Object.keys(payloadData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data payload tidak ditemukan.' },
        { status: 400 }
      );
    }

    // 3. Kirim Notifikasi ke Telegram
    await sendTelegramNotification(notificationType, payloadData);

    return NextResponse.json({
      success: true,
      message: `Notifikasi Telegram (${notificationType}) berhasil dikirim.`
    });
  } catch (error) {
    console.error('Error pada API /api/notify:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengirim notifikasi.', error: error.message },
      { status: 500 }
    );
  }
}