import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // Sesuaikan lokasi penyiapan Firebase kamu
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    // 1. Verifikasi Authorization Token
    const authHeader = request.headers.get('authorization');
    const SECRET_TOKEN = process.env.HARVEST_CRON_SECRET || "HarvestSecret123!";
    
    if (!authHeader || authHeader !== `Bearer ${SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 2. Ambil data payload dari Apps Script
    const body = await request.json();
    const { fileName, data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Data laporan tidak valid' }, { status: 400 });
    }

    // 3. Simpan data laporan Excel ke koleksi Firestore
    const docRef = await addDoc(collection(db, 'laporan_produksi'), {
      fileName: fileName,
      records: data,
      createdAt: serverTimestamp(),
    });

    // TODO: Di sini nanti dipanggil fungsi untuk notifikasi Telegram Bot / WhatsApp Blast

    return NextResponse.json({ 
      success: true, 
      message: 'Laporan berhasil diproses', 
      id: docRef.id 
    });

  } catch (error) {
    console.error("Error processing report:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}