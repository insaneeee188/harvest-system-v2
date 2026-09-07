// lib/telegram.js

export async function sendTelegramNotification(type, data) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN belum terpasang.");
    return;
  }

  // 1. Mapping Konfigurasi Grup & Topic Thread ID
  const GROUP_CONFIG = {
    leader: {
      chatId: '-1002188778973',
      topics: {
        event: 4,
        training: 4,
        contest: 11,
        video: 1126
      }
    },
    agent: {
      chatId: '-1002286746304',
      topics: {
        event: 2,
        training: 2,
        contest: 3,
        video: 872
      }
    }
  };

  // 2. Tentukan Jenis Topic berdasarkan Jenis Notifikasi
  const lowerType = (type || '').toLowerCase();
  let categoryKey = 'event'; 
  
  if (lowerType.includes('training')) {
    categoryKey = 'training';
  } else if (lowerType.includes('contest')) {
    categoryKey = 'contest';
  } else if (lowerType.includes('video')) {
    categoryKey = 'video';
  } else if (lowerType.includes('event')) {
    categoryKey = 'event';
  }

  // 3. Tentukan Target Peserta
  const targetPeserta = (data.targetPeserta || data.target || 'Semua').toLowerCase();
  let targets = [];

  if (targetPeserta === 'leader') {
    targets.push(GROUP_CONFIG.leader);
  } else if (targetPeserta === 'agent') {
    targets.push(GROUP_CONFIG.agent);
  } else {
    targets.push(GROUP_CONFIG.leader);
    targets.push(GROUP_CONFIG.agent);
  }

  // 4. Helper Format Tanggal YYYY-MM-DD ke DD-MM-YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const formattedDate = formatDate(data.date || data.jadwal || data.tanggal);
  const imageUrl = data.imageUrl || data.posterUrl || data.image || data.gambar || data.poster;

  // 5. Format Isi Pesan
  let caption = `📢 <b>${type.toUpperCase()} BARU HARVEST</b>\n\n`;
  caption += `📌 <b>Judul:</b> ${data.title || data.judul || data.name || '-'}\n`;
  caption += `📝 <b>Keterangan:</b> ${data.keterangan || data.description || data.materi || '-'}\n`;
  caption += `📅 <b>Jadwal:</b> ${formattedDate}\n`;

  if (data.waktu || data.time || data.waktuPelaksanaan) {
    caption += `⏰ <b>Waktu:</b> ${data.waktu || data.time || data.waktuPelaksanaan}\n`;
  }
  if (data.durasi || data.duration) {
    caption += `⏳ <b>Durasi:</b> ${data.durasi || data.duration}\n`;
  }
  if (data.lokasi || data.location) {
    caption += `📍 <b>Lokasi:</b> ${data.lokasi || data.location}\n`;
  }

  caption += `\n👉 <a href="https://harvest-system-v2.vercel.app">Buka Aplikasi Harvest</a>`;

  // 6. Perulangan Pengiriman Pesan
  for (const group of targets) {
    try {
      const threadId = group.topics[categoryKey];
      const endpoint = imageUrl ? 'sendPhoto' : 'sendMessage';

      const payload = {
        chat_id: group.chatId,
        parse_mode: 'HTML',
        ...(threadId && { message_thread_id: threadId }),
        ...(imageUrl ? { photo: imageUrl, caption: caption } : { text: caption })
      };

      await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error(`Gagal mengirim ke Chat ID ${group.chatId}:`, err);
    }
  }
}