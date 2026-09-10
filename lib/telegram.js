// lib/telegram.js

export async function sendTelegramNotification(type, data) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN belum terpasang.");
    return;
  }

  // 1. Mapping Konfigurasi Grup & Topic Thread ID Terbaru
  const GROUP_CONFIG = {
    leader: {
      chatId: '-1002188778973',
      topics: {
        event: 4,
        training: 4,
        contest: 11,
        video: 22,       // Updated Topic ID untuk Leader
        file: 12,        // Topic ID File Training untuk Leader
        production: 647
      }
    },
    agent: {
      chatId: '-1002286746304',
      topics: {
        event: 2,
        training: 2,
        contest: 3,
        video: 190,      // Updated Topic ID untuk Agent
        file: 156,       // Topic ID File Training untuk Agent
        production: 539
      }
    }
  };

  // 2. Deteksi Jenis Kategori (Event, Training, Contest, Video, File, Production)
  const lowerType = (type || '').toLowerCase();
  let categoryKey = 'event'; 
  
  if (
    lowerType.includes('production') || 
    lowerType.includes('report') || 
    lowerType.includes('laporan') ||
    lowerType.includes('producer')
  ) {
    categoryKey = 'production';
  } else if (lowerType.includes('file') || lowerType.includes('dokumen') || lowerType.includes('pdf')) {
    categoryKey = 'file';
  } else if (lowerType.includes('video')) {
    categoryKey = 'video';
  } else if (lowerType.includes('training')) {
    categoryKey = 'training';
  } else if (lowerType.includes('contest')) {
    categoryKey = 'contest';
  }

  // 3. Tentukan Target Peserta
  const rawTarget = data.targetPeserta || data.target || data.target_peserta || 'semua';
  let targetStr = Array.isArray(rawTarget) ? rawTarget.join(',').toLowerCase() : String(rawTarget).toLowerCase();

  let targets = [];
  if (targetStr.includes('leader') && !targetStr.includes('agent') && !targetStr.includes('semua') && !targetStr.includes('all')) {
    targets.push(GROUP_CONFIG.leader);
  } else if (targetStr.includes('agent') && !targetStr.includes('leader') && !targetStr.includes('semua') && !targetStr.includes('all')) {
    targets.push(GROUP_CONFIG.agent);
  } else {
    targets.push(GROUP_CONFIG.leader);
    targets.push(GROUP_CONFIG.agent);
  }

  // Helper Sanitasi & Truncate
  const escapeHtml = (text) => {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const truncateText = (str, maxLength = 1000) => {
    if (!str) return "";
    return str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
  };

  // Ekstraksi Gambar
  let imageUrl = 
    data.imageUrl || 
    data.posterUrl || 
    data.image || 
    data.gambar || 
    data.poster || 
    data.flyer || 
    data.flyerUrl || 
    data.bannerUrl || 
    null;

  if (typeof imageUrl === 'object' && imageUrl !== null) {
    imageUrl = imageUrl.url || imageUrl.secure_url || imageUrl.src || null;
  }
  if (typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
    imageUrl = null; 
  }

  // 4. PENENTUAN JUDUL, PATH HALAMAN & CAPTION KHUSUS (DISESUAIKAN DENGAN PAGE_6.JS)
  const BASE_URL = 'https://harvest-system-v2.vercel.app';
  let categoryName = 'Event';
  let targetPath = '/events';

  if (categoryKey === 'contest') {
    categoryName = 'Contest';
    targetPath = '/contests'; // Diselaraskan dengan page_6.js (/contests)
  } else if (categoryKey === 'training') {
    categoryName = 'Training';
    targetPath = '/events';
  } else if (categoryKey === 'video') {
    categoryName = 'Video Training';
    targetPath = '/library'; // Diselaraskan dengan page_6.js (/library)
  } else if (categoryKey === 'file') {
    categoryName = 'File Training';
    targetPath = '/library'; // Diselaraskan dengan page_6.js (/library)
  } else if (categoryKey === 'production') {
    categoryName = 'Production Report';
    targetPath = '/production-report';
  }

  const judulContent = escapeHtml(data.title || data.judul || data.name || 'Informasi Terbaru');
  const fullLink = `${BASE_URL}${targetPath}`;

  // Format Caption Dinamis Sesuai Parameter dari Admin Panel
  let caption = `📢 <b>${categoryName} Telah Ditambahkan!</b>\n\n`;
  caption += `📌 <b>Judul:</b> ${judulContent}\n`;

  if (data.period || data.periode) {
    caption += `🗓️ <b>Periode:</b> ${escapeHtml(data.period || data.periode)}\n`;
  }
  if (data.date || data.tanggal) {
    caption += `📅 <b>Tanggal:</b> ${escapeHtml(data.date || data.tanggal)}\n`;
  }
  if (data.waktu) {
    caption += `⏰ <b>Waktu:</b> ${escapeHtml(data.waktu)}\n`;
  }
  if (data.lokasi) {
    caption += `🏢 <b>Lokasi:</b> ${escapeHtml(data.lokasi)}\n`;
  }
  if (data.kategori) {
    caption += `🏷️ <b>Kategori:</b> ${escapeHtml(data.kategori)}\n`;
  }

  caption += `\n👉 Klik link berikut untuk info lebih lanjut:\n`;
  caption += `<a href="${fullLink}">${fullLink}</a>`;

  // Helper Reopen Topic jika tertutup
  async function reopenTopicIfNeeded(chatId, threadId) {
    if (!threadId) return false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/reopenForumTopic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_thread_id: Number(threadId)
        })
      });
      const resJson = await res.json();
      return resJson.ok;
    } catch (e) {
      return false;
    }
  }

  // 5. Eksekusi Pengiriman Ke Telegram
  for (const group of targets) {
    const threadId = group.topics[categoryKey];
    const endpoint = imageUrl ? 'sendPhoto' : 'sendMessage';

    const buildPayload = (useThread = true, usePhoto = true) => {
      const payload = {
        chat_id: group.chatId,
        parse_mode: 'HTML',
        link_preview_options: {
          is_disabled: false,
          prefer_large_media: true
        },
        reply_markup: {
          inline_keyboard: [
            [{ text: `🚀 Buka ${categoryName}`, url: fullLink }]
          ]
        }
      };

      if (useThread && threadId) {
        payload.message_thread_id = Number(threadId);
      }

      if (usePhoto && imageUrl) {
        payload.photo = imageUrl;
        payload.caption = truncateText(caption, 1000);
      } else {
        payload.text = caption;
      }

      return payload;
    };

    try {
      if (threadId) {
        await reopenTopicIfNeeded(group.chatId, threadId);
      }

      let res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(true, true))
      });

      let resultJson = await res.json();

      if (!resultJson.ok && resultJson.description?.includes('TOPIC_CLOSED')) {
        await reopenTopicIfNeeded(group.chatId, threadId);

        res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(true, true))
        });
        resultJson = await res.json();
      }

      if (!resultJson.ok && imageUrl) {
        res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(true, false))
        });
        resultJson = await res.json();
      }

      if (!resultJson.ok) {
        console.error(`Telegram API Error (${group.chatId}):`, resultJson);
      }
    } catch (err) {
      console.error(`Error koneksi Telegram ke Chat ID ${group.chatId}:`, err);
    }
  }
}