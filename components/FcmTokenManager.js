'use client';

import { useState, useEffect } from 'react';
import { db, auth, app } from '../firebase';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function FcmTokenManager() {
  const [notifStatus, setNotifStatus] = useState('loading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState(null);

  // Fungsi utama untuk mengambil token FCM dan menyimpannya ke Firestore
  const fetchAndSaveToken = async (currentUser) => {
    try {
      const { getMessaging, getToken } = await import('firebase/messaging');
      const messaging = getMessaging(app);

      const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

      if (currentToken && currentUser) {
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            fcmTokens: arrayUnion(currentToken),
            fcmTokenUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log('FCM Token berhasil disimpan ke Firestore:', currentToken);
      }
    } catch (err) {
      console.error('Gagal mengambil/menyimpan FCM token:', err);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    setNotifStatus(Notification.permission);

    // Cek status user yang sedang login, lalu ambil token otomatis jika sudah diizinkan
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && Notification.permission === 'granted') {
        await fetchAndSaveToken(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEnableNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser Anda tidak mendukung fitur Notifikasi Push.');
      return;
    }

    setIsProcessing(true);

    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission);

      if (permission === 'granted') {
        if (user) {
          await fetchAndSaveToken(user);
          alert('Notifikasi berhasil diaktifkan! Perangkat Anda telah terhubung.');
        } else {
          alert('Izin diberikan, tetapi Anda perlu masuk/login terlebih dahulu.');
        }
      } else if (permission === 'denied') {
        alert('Izin notifikasi ditolak. Silakan izinkan melalui Pengaturan Browser Anda.');
      }
    } catch (error) {
      console.error('Gagal meminta izin notifikasi:', error);
      alert('Gagal mengaktifkan notifikasi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Jika izin sudah diberikan, sembunyikan banner agar tampilan tetap bersih
  if (notifStatus === 'granted') {
    return null;
  }

  return (
    <div className="bg-[#072c38] border-b border-white/10 px-4 py-2.5 shadow-sm text-white">
      <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="text-base">🔔</span>
          <p className="text-gray-200">
            Aktifkan notifikasi browser untuk mendapatkan pembaruan info event &amp; laporan penting.
          </p>
        </div>

        <button
          onClick={handleEnableNotification}
          disabled={isProcessing}
          className="bg-[#A8C338] hover:bg-[#96af31] text-[#072c38] font-bold px-4 py-1.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-xs whitespace-nowrap"
        >
          {isProcessing ? 'Memproses...' : 'Aktifkan Notifikasi'}
        </button>
      </div>
    </div>
  );
}