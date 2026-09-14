// app/api/notify/route.js
import { sendTelegramNotification } from '../../../lib/telegram';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const rawData = body.data || body;

    // 1. Validasi awal jika payload kosong
    if (!rawData || Object.keys(rawData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data payload tidak ditemukan.' },
        { status: 400 }
      );
    }

    // 2. Deteksi otomatis tipe notifikasi
    let notificationType = body.type || rawData.type;
    if (!notificationType) {
      if (
        rawData.link || 
        rawData.youtubeUrl || 
        rawData.videoUrl || 
        (rawData.status && rawData.status.toLowerCase() === 'unlisted')
      ) {
        notificationType = 'video';
      } else if (
        rawData.agent_code || 
        rawData.agentCode || 
        rawData.kodeAgent || 
        rawData.unit
      ) {
        notificationType = 'approval'; // Deteksi otomatis pendaftaran user/agen baru
      } else {
        notificationType = 'event';
      }
    }

    // 3. Normalisasi Payload Data
    const payloadData = {
      ...rawData,
      title: rawData.title || rawData.judul || rawData.name || rawData.nama || 'Notifikasi Baru',
      imageUrl: rawData.imageUrl || rawData.posterUrl || rawData.poster || rawData.image || rawData.gambar || null,
      target: rawData.target || rawData.targetPeserta || 'Semua'
    };

    // 4. Kirim Notifikasi ke Telegram (Personal & Grup dikelola paralel di lib/telegram)
    await sendTelegramNotification(notificationType, payloadData);

    return NextResponse.json({
      success: true,
      message: `Notifikasi Telegram (${notificationType}) berhasil diproses.`
    });
  } catch (error) {
    console.error('Error pada API /api/notify:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengirim notifikasi.', error: error.message },
      { status: 500 }
    );
  }
}