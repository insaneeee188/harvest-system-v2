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
        video: 1126,
        production: 647 // Topic ID Leader Production Report
      }
    },
    agent: {
      chatId: '-1002286746304',
      topics: {
        event: 2,
        training: 2,
        contest: 3,
        video: 872,
        production: 539 // Topic ID Agent Production Report
      }
    }
  };

  // 2. Tentukan Jenis Topic
  const lowerType = (type || '').toLowerCase();
  let categoryKey = 'event'; 
  
  if (
    lowerType.includes('production') || 
    lowerType.includes('report') || 
    lowerType.includes('laporan') ||
    lowerType.includes('producer')
  ) {
    categoryKey = 'production';
  } else if (lowerType.includes('training')) {
    categoryKey = 'training';
  } else if (lowerType.includes('contest')) {
    categoryKey = 'contest';
  } else if (lowerType.includes('video')) {
    categoryKey = 'video';
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

  // 4. Helper Format Tanggal, Sanitasi Text & Truncate
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
  };

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

  const formattedDate = formatDate(data.date || data.jadwal || data.tanggal || data.periode || new Date().toISOString().split('T')[0]);

  // --- EKSTRAKSI GAMBAR ---
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

  // --- EKSTRAKSI LINK ZOOM/MEETING ---
  let zoomUrl = 
    data.linkZoom || 
    data.zoomLink || 
    data.link_zoom || 
    data.zoom_url ||
    data.meetingLink || 
    data.linkMeeting || 
    data.onlineLink ||
    data.registrationLink || 
    data.zoomUrl || 
    null;

  if (!zoomUrl && (data.link || data.url)) {
    const rawUrl = data.link || data.url;
    if (typeof rawUrl === 'string' && !rawUrl.includes('vercel.app')) {
      zoomUrl = rawUrl;
    }
  }

  // Ekstraksi Lokasi Fisik
  let locationText = data.lokasi || data.location || data.lokasiFisik || data.lokasi_fisik || null;

  // Ekstraksi Deskripsi / Keterangan
  const descriptionText = data.keterangan || data.description || data.deskripsi || data.materi || data.content || data.details || null;

  // 5. Header & Label Kategori
  const BASE_URL = 'https://harvest-system-v2.vercel.app';
  let headerTitle = '📢 EVENT BARU HARVEST';
  let labelNama = '📌 Judul';
  let buttonLabel = '🔗 Lihat Halaman Events';
  let targetPath = '/events';

  if (categoryKey === 'contest') {
    headerTitle = '🏆 CONTEST BARU HARVEST';
    labelNama = '🏆 Nama Contest';
    buttonLabel = '📜 Cek Syarat & Ketentuan';
    targetPath = '/contest';
  } else if (categoryKey === 'training') {
    headerTitle = '🎓 TRAINING BARU HARVEST';
    labelNama = '🎓 Nama Training';
    buttonLabel = '📖 Lihat Jadwal Training';
    targetPath = '/events';
  } else if (categoryKey === 'video') {
    headerTitle = '🎬 VIDEO BARU HARVEST';
    labelNama = '🎬 Judul Video';
    buttonLabel = '▶️ Tonton Video di Academy';
    targetPath = '/academy';
  } else if (categoryKey === 'production') {
    headerTitle = '📊 PRODUCTION REPORT UPDATE';
    labelNama = '📋 Kategori';
    buttonLabel = '📈 Lihat Report Lengkap';
    targetPath = '/production-report';
  }

  // Format Teks Caption Pesan
  let caption = `<b>${headerTitle}</b>\n\n`;
  caption += `${labelNama}: <b>${escapeHtml(data.title || data.judul || data.name || 'Laporan Produksi')}</b>\n`;
  caption += categoryKey === 'contest' || categoryKey === 'production' 
    ? `📅 <b>Periode:</b> ${formattedDate}\n` 
    : `📅 <b>Tanggal:</b> ${formattedDate}\n`;

  // Format Khusus Production Report
  if (categoryKey === 'production') {
    if (data.totalCount || data.totalData) {
      caption += `👥 <b>Total Entri:</b> ${data.totalCount || data.totalData}\n`;
    }
    
    const rawApi = data.totalApi || data.totalAPI;
    if (rawApi) {
      const numericApi = typeof rawApi === 'number' ? rawApi : Number(String(rawApi).replace(/[^0-9]/g, ''));
      caption += `💰 <b>Total API:</b> Rp ${numericApi ? numericApi.toLocaleString('id-ID') : rawApi}\n`;
    }
  }

  if (data.waktu || data.time || data.waktuPelaksanaan) {
    caption += `⏰ <b>Waktu:</b> ${escapeHtml(data.waktu || data.time || data.waktuPelaksanaan)}\n`;
  }
  if (data.durasi || data.duration) {
    caption += `⏳ <b>Durasi:</b> ${escapeHtml(data.durasi || data.duration)}\n`;
  }
  if (locationText) {
    caption += `📍 <b>Lokasi:</b> ${escapeHtml(locationText)}\n`;
  }
  if (zoomUrl) {
    caption += `🔗 <b>Link Zoom:</b> ${escapeHtml(zoomUrl)}\n`;
  }

  if (descriptionText && descriptionText !== '-') {
    caption += `\n📝 <b>Keterangan:</b>\n${escapeHtml(descriptionText)}\n`;
  }

  // Helper Reopen Topic
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

  // 6. Pengiriman ke Telegram
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
            [{ text: buttonLabel, url: `${BASE_URL}${targetPath}` }]
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