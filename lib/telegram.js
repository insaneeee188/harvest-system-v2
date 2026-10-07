export async function sendTelegramNotification(type, data) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN belum terpasang di .env.");
    return;
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

  const lowerType = (type || '').toLowerCase();

  // ==========================================
  // 1. PENANGANAN KHUSUS TYPE: APPROVAL (PENDAFTARAN USER BARU)
  // ==========================================
  if (lowerType === 'approval' || lowerType.includes('approval') || lowerType.includes('konfirmasi')) {
    
    // Ambil daftar Chat ID dari .env (Personal & Grup)
    const approvalTargets = [
      process.env.TELEGRAM_CHAT_ID,        // Admin Personal
      process.env.TELEGRAM_GROUP_NOTIF_ID  // Grup Notifikasi
    ].filter(Boolean); // Menghapus jika ada nilai kosong/undefined

    const approvalMessage = `⚠️ <b>BUTUH PERSETUJUAN PENDAFTARAN</b>\n\n` +
      `📌 <b>Judul:</b> ${escapeHtml(data.title || 'Pengguna Baru Terdaftar')}\n` +
      `💬 <b>Pesan:</b> ${escapeHtml(data.message || 'Ada agen/user baru yang mendaftar dan menunggu approval Anda.')}\n\n` +
      `👤 <b>Nama:</b> ${escapeHtml(data.name || data.nama || '-')}\n` +
      `📧 <b>Email:</b> ${escapeHtml(data.email || '-')}\n` +
      `🏢 <b>Unit:</b> ${escapeHtml(data.unit || '-')}\n` +
      `🆔 <b>Kode Agent:</b> ${escapeHtml(data.agent_code || data.agentCode || data.kodeAgent || '-')}\n` +
      `📌 <b>Role:</b> ${escapeHtml(data.role || 'Agent')}\n\n` +
      `👉 <a href="https://harvestlms.vercel.app/admin">Buka dashboard admin untuk melakukan konfirmasi.</a>`;

    // Helper fungsi kirim approval ke 1 chatId
    const sendApprovalToChat = async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: approvalMessage,
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true }
          })
        });
        const resultJson = await res.json();
        if (!resultJson.ok) {
          console.error(`Telegram API Error Approval (${chatId}):`, resultJson);
        }
      } catch (err) {
        console.error(`Error pengiriman approval ke ID ${chatId}:`, err);
      }
    };

    // Kirim ke Personal Admin & Grup Notifikasi secara bersamaan
    await Promise.all(approvalTargets.map((id) => sendApprovalToChat(id)));
    
    return; // Selesai untuk tipe approval
  }

  // ==========================================
  // 2. MAPPING KATEGORI & TOPIC THREAD LAINNYA
  // ==========================================
  const GROUP_CONFIG = {
    leader: {
      chatId: '-1002188778973',
      topics: {
        event: 4,
        training: 4,
        contest: 11,
        extra_komisi: 28,
        video: 22,
        file: 12,
        production: 647,
        promo: 27
      }
    },
    agent: {
      chatId: '-1002286746304',
      topics: {
        event: 2,
        training: 2,
        contest: 3,
        extra_komisi: 5,
        video: 190,
        file: 156,
        production: 539,
        promo: 4
      }
    }
  };

  let categoryKey = 'event'; 
  if (
    lowerType.includes('production') || 
    lowerType.includes('report') || 
    lowerType.includes('laporan') ||
    lowerType.includes('producer')
  ) {
    categoryKey = 'production';
  } else if (lowerType.includes('extra') || lowerType.includes('komisi') || lowerType.includes('extra_komisi')) {
    categoryKey = 'extra_komisi';
  } else if (lowerType.includes('promo') || lowerType.includes('nasabah')) {
    categoryKey = 'promo';
  } else if (lowerType.includes('file') || lowerType.includes('dokumen') || lowerType.includes('pdf')) {
    categoryKey = 'file';
  } else if (lowerType.includes('video')) {
    categoryKey = 'video';
  } else if (lowerType.includes('training')) {
    categoryKey = 'training';
  } else if (lowerType.includes('contest')) {
    categoryKey = 'contest';
  }

  // Tentukan Target Peserta
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

  const BASE_URL = 'https://harvestlms.vercel.app';
  let categoryName = 'Event';
  let targetPath = '/events';

  if (categoryKey === 'extra_komisi') {
    categoryName = 'Extra Komisi';
    targetPath = '/extra-komisi';
  } else if (categoryKey === 'promo') {
    categoryName = 'Promo Nasabah';
    targetPath = '/promo-nasabah';
  } else if (categoryKey === 'contest') {
    categoryName = 'Contest';
    targetPath = '/contest';
  } else if (categoryKey === 'training') {
    categoryName = 'Training';
    targetPath = '/events';
  } else if (categoryKey === 'video') {
    categoryName = 'Video Training';
    targetPath = '/library';
  } else if (categoryKey === 'file') {
    categoryName = 'File Training';
    targetPath = '/library';
  } else if (categoryKey === 'production') {
    categoryName = 'Production Report';
    targetPath = '/production-report';
  }

  const judulContent = escapeHtml(data.title || data.judul || data.name || 'Informasi Terbaru');
  const fullLink = `${BASE_URL}${targetPath}`;

  // Sanitasi & sinkronisasi Tautan
  let rawLink = data.youtubeUrl || data.link || data.url || fullLink;
  const videoOrFileLink = rawLink;

  // Format Caption Berdasarkan Kategori
  let caption = '';
  if (categoryKey === 'video') {
    caption = `🎬 <b>Video Training Baru Diunggah!</b>\n\n` +
      `<b>Judul:</b> ${judulContent}\n` +
      `<b>Status:</b> ${escapeHtml(data.status || 'Tersedia')}\n` +
      `<b>Link:</b> ${escapeHtml(videoOrFileLink)}`;
  } else if (categoryKey === 'extra_komisi') {
    caption = `💰 <b>Promo Extra Komisi Baru!</b>\n\n` +
      `<b>Judul:</b> ${judulContent}\n`;
    if (data.periode || data.period) {
      caption += `<b>Periode:</b> ${escapeHtml(data.periode || data.period)}\n`;
    }
    if (data.deskripsi || data.description) {
      caption += `<b>Ketentuan:</b> ${escapeHtml(data.deskripsi || data.description)}\n`;
    }
    caption += `\nKlik link berikut untuk detail promo extra komisi:\n${fullLink}`;
  } else if (categoryKey === 'promo') {
    caption = `🎁 <b>${categoryName} Baru!</b>\n\n` +
      `<b>Judul:</b> ${judulContent}\n`;
    if (data.kategori || data.category) {
      caption += `<b>Kategori:</b> ${escapeHtml(data.kategori || data.category)}\n`;
    }
    if (data.deskripsi || data.description) {
      caption += `<b>Keterangan:</b> ${escapeHtml(data.deskripsi || data.description)}\n`;
    }
    caption += `\nKlik link berikut untuk detail promo:\n${fullLink}`;
  } else {
    caption = `📢 <b>${categoryName} Telah Ditambahkan!</b>\n\n` +
      `<b>Judul:</b> ${judulContent}\n`;
    if (data.kategori) {
      caption += `<b>Kategori:</b> ${escapeHtml(data.kategori)}\n`;
    }
    if (data.deskripsi || data.description) {
      caption += `<b>Keterangan:</b> ${escapeHtml(data.deskripsi || data.description)}\n`;
    }
    caption += `\nKlik link berikut untuk info lebih lanjut:\n${fullLink}`;
  }

  // Tentukan tautan mana yang dimasukkan ke tombol bawah pesan
  const actionButtonUrl = categoryKey === 'video' ? videoOrFileLink : fullLink;

  // Eksekusi Pengiriman Ke Telegram Group / Topic
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
            [{ text: `🚀 Buka ${categoryName}`, url: actionButtonUrl }]
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