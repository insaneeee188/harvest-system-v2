// lib/telegram.js

// Ambil token dari environment variable, atau gunakan token Anda jika belum di-set di .env.local
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8558494977:AAFIx5y_mRDM9JZwdRvG7A4LoTLPcRWt8uY';

// Pemetaan Chat ID & Message Thread ID per Topik
const TARGET_CONFIG = {
  Leader: {
    chatId: '-1002188778973',
    topics: {
      event: 4,
      training: 4,
      contest: 11,
      video: 1126
    }
  },
  Agent: {
    chatId: '-1002286746304',
    topics: {
      event: 2,
      training: 2,
      contest: 3,
      video: 872
    }
  }
};

export async function sendTelegramNotification(type, data) {
  // Menyiapkan isi pesan berdasarkan tipe konten
  let message = '';
  if (type === 'event') {
    message = `📅 *EVENT BARU HARVEST*\n\n*Judul:* ${data.title}\n*Tanggal:* ${data.date}\n*Lokasi:* ${data.location}\n\n[Lihat Detail Event](${data.link})`;
  } else if (type === 'contest') {
    message = `🏆 *CONTEST BARU HARVEST*\n\n*Nama Contest:* ${data.title}\n*Periode:* ${data.period}\n\n[Cek Syarat & Ketentuan](${data.link})`;
  } else if (type === 'training') {
    message = `🎓 *TRAINING BARU HARVEST*\n\n*Materi:* ${data.title}\n*Jadwal:* ${data.date}\n\n[Ikuti Training](${data.link})`;
  } else if (type === 'video') {
    message = `📽️ *VIDEO BARU HARVEST*\n\n*Judul:* ${data.title}\n\n[Tonton Video](${data.link})`;
  } else {
    return;
  }

  // Menentukan daftar target grup pengiriman (Leader, Agent, atau Semua)
  const targetGroup = data.target ? data.target.toLowerCase() : 'semua';
  const destinations = [];

  if (targetGroup === 'leader' || targetGroup === 'semua') {
    destinations.push(TARGET_CONFIG.Leader);
  }
  if (targetGroup === 'agent' || targetGroup === 'semua') {
    destinations.push(TARGET_CONFIG.Agent);
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  // Mengirim notifikasi ke setiap grup target
  try {
    const requests = destinations.map((dest) => {
      const topicId = dest.topics[type];
      if (!topicId) return null;

      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: dest.chatId,
          message_thread_id: topicId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    });

    await Promise.all(requests.filter(Boolean));
  } catch (error) {
    console.error('Gagal kirim notifikasi Telegram:', error);
  }
}