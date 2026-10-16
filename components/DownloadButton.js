'use client';

import { useState } from 'react';

export default function DownloadButton({ imageUrl, fileName }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e) => {
    // Mencegah agar jika tombol ditekan, tidak memicu klik pada area kartu lainnya
    e.stopPropagation(); 
    
    if (!imageUrl) return;
    setIsDownloading(true);

    try {
      // Mengambil data gambar dari URL
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Membuat URL sementara di browser perangkat
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Membuat elemen link tersembunyi untuk memicu proses download
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Membersihkan nama file dari karakter aneh jika ada, default '.jpg'
      const safeFileName = fileName ? fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'flyer-harvest';
      link.download = `${safeFileName}.jpg`;
      
      // Eksekusi download
      document.body.appendChild(link);
      link.click();
      
      // Pembersihan memori
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Gagal mendownload gambar:", error);
      // Jika terjadi error (misalnya diblokir browser), buka gambar di tab baru
      window.open(imageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button 
      type="button"
      onClick={handleDownload}
      disabled={isDownloading || !imageUrl}
      className={`font-bold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1 border ${
        isDownloading 
          ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed' 
          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
      }`}
      title="Download Flyer"
    >
      {isDownloading ? '⏳ Memproses...' : '📥 Unduh Flyer'}
    </button>
  );
}