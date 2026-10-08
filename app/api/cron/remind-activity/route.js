import { NextResponse } from 'next/server';

export async function GET(request) {
  // 1. Cek keamanan agar API ini hanya bisa dipanggil oleh Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // 2. Logika cek laporan user & kirim notifikasi
  // TODO: Tarik data user dari database yang belum isi laporan hari ini
  console.log('Cron Job berjalan: Memeriksa laporan harian user...');

  return NextResponse.json({ success: true, message: 'Pengingat berhasil dikirim!' });
}