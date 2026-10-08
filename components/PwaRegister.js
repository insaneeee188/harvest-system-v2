'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Minta izin kirim notifikasi
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Izin notifikasi diberikan!');
          }
        });
      });
    }
  }, []);

  return null;
}