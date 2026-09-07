import { sendTelegramNotification } from '../../../lib/telegram';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Ambil tipe notifikasi
    const notificationType = body.type || 'event';

    // 2. Ekstrak objek data (apakah dibungkus 'data' atau dikirim langsung)
    const rawData = body.data || body;

    // 3. Pastikan image/poster URL terekstrak dengan benar
    const payloadData = {
      ...rawData,
      // Memastikan field gambar dari frontend (imageUrl / posterUrl / poster / image) terbaca
      imageUrl: rawData.imageUrl || rawData.posterUrl || rawData.poster || rawData.image || rawData.gambar || null
    };

    if (!payloadData || Object.keys(payloadData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data notifikasi tidak ditemukan.' },
        { status: 400 }
      );
    }

    // 4. Kirim notifikasi ke Telegram
    await sendTelegramNotification(notificationType, payloadData);

    return NextResponse.json({
      success: true,
      message: 'Notifikasi Telegram berhasil dikirim.'
    });
  } catch (error) {
    console.error('Error pada API /api/notify:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengirim notifikasi.', error: error.message },
      { status: 500 }
    );
  }
}