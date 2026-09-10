// app/api/notify/route.js

import { sendTelegramNotification } from '../../../lib/telegram';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Ambil tipe notifikasi (contest, event, training, video, file, dll)
    const notificationType = body.type || 'event';

    // 2. Ekstrak data payload
    const rawData = body.data || body;

    // 3. Normalisasi parameter agar cocok dengan fungsi Telegram
    const payloadData = {
      ...rawData,
      // Fallback normalisasi URL gambar/poster
      imageUrl: rawData.imageUrl || rawData.posterUrl || rawData.poster || rawData.image || rawData.gambar || null,
      // Target spesifik penerima jika ada (Agent/Leader/Semua)
      target: rawData.target || 'Semua'
    };

    if (!payloadData || Object.keys(payloadData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Data payload notifikasi kosong.' },
        { status: 400 }
      );
    }

    // 4. Kirim notifikasi ke Telegram via helper lib/telegram
    await sendTelegramNotification(notificationType, payloadData);

    return NextResponse.json({
      success: true,
      message: `Notifikasi Telegram (${notificationType}) berhasil dikirim.`
    });
  } catch (error) {
    console.error('Error pada API /api/notify:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Gagal mengirim notifikasi Telegram.', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}