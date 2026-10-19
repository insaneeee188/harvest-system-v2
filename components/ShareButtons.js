'use client';

import { useState } from 'react';

export default function ShareButtons({ item, modulePath = 'events' }) {
  const [isSharing, setIsSharing] = useState(false);

  if (!item) return null;

  const baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'https://harvestlms.vercel.app';

  const pageUrl = `${baseUrl}/${modulePath}`;

  // Pembersih karakter rusak & emoji yang tidak kompatibel
  const cleanText = (str) => {
    if (!str) return '';
    return str
      .replace(/\uFFFD/g, '') // Hapus karakter \uFFFD ()
      .replace(/[^\w\s\d\.\,\-\%\&\(\)\/\:\!\?]/gi, '') // Amankan karakter teks biasa
      .replace(/\s+/g, ' ')
      .trim();
  };

  const title = cleanText(item.judul) || 'Informasi Harvest Agency';
  const periode = cleanText(item.periode || item.tanggal);
  const target = cleanText(item.target);

  const moduleTitles = {
    events: 'AGENDA & EVENT TERBARU',
    'promo-nasabah': 'PROMO NASABAH SPESIAL',
    'extra-komisi': 'EXTRA KOMISI HARVEST',
    contest: 'KONTES & REWARD TERBARU'
  };

  const headerText = moduleTitles[modulePath] || 'INFORMASI TERBARU';

  // Format Teks WhatsApp yang Bersih, Rapi, & Bebas Pecah
  const buildWhatsAppText = () => {
    let text = `*${headerText}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `*${title}*\n\n`;

    if (periode) {
      text += `• *Periode:* ${periode}\n`;
    }
    if (target) {
      text += `• *Target:* ${target}\n`;
    }

    text += `\n_Lihat poster dan detail selengkapnya di sini:_\n`;
    text += `${pageUrl}`;

    return text;
  };

  const waMessage = buildWhatsAppText();

  // Native Share Handler (Mengirim Gambar Imgur + Teks Rapi ke HP)
  const handleNativeShare = async () => {
    setIsSharing(true);
    try {
      let filesArray = [];

      if (item.posterUrl) {
        const response = await fetch(item.posterUrl);
        const blob = await response.blob();
        const file = new File([blob], `${title.substring(0, 15) || 'poster'}.jpg`, { type: blob.type || 'image/jpeg' });
        filesArray = [file];
      }

      if (navigator.canShare && navigator.canShare({ files: filesArray })) {
        await navigator.share({
          files: filesArray,
          title: title,
          text: waMessage,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: title,
          text: waMessage,
          url: pageUrl,
        });
      }
    } catch (err) {
      console.log('Share dibatalkan atau tidak didukung');
    } finally {
      setIsSharing(false);
    }
  };

  const waLink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
  const tgLink = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(`${headerText}\n\n${title}`)}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
      <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider mr-1">Bagikan:</span>

      {/* Tombol Native Share Bawaan HP */}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          type="button"
          onClick={handleNativeShare}
          disabled={isSharing}
          className="flex items-center gap-1.5 bg-[#083344] hover:bg-[#0c4a60] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
          {isSharing ? '⌛ Memproses...' : '📲 Bagikan Foto & Teks'}
        </button>
      )}

      {/* Tombol WhatsApp Direct */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
      >
        WhatsApp
      </a>

      {/* Tombol Telegram Direct */}
      <a
        href={tgLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-[#229ED9] hover:bg-[#1d88bc] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
      >
        Telegram
      </a>
    </div>
  );
}