importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBupajx6eWGfbkG8-zSAgdfbGHVmOir9XI",
  authDomain: "harvest-nation-abb3f.firebaseapp.com",
  projectId: "harvest-nation-abb3f",
  storageBucket: "harvest-nation-abb3f.firebasestorage.app",
  messagingSenderId: "49671436845",
  appId: "1:49671436845:web:d4edf43324da06ef0416a4"
});

const messaging = firebase.messaging();

// Menangani notifikasi saat aplikasi berjalan di background/ditutup
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Notifikasi Baru';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/harvest-logo.png',
    data: {
      url: payload.data?.targetUrl || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Menangani klik pada notifikasi pop-up HP
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});