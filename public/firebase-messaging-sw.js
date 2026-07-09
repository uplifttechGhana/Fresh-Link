/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDMowvnM79jLpR3UnhES7UWbWdGsr3FzfI',
  authDomain: 'fresh-link-717f4.firebaseapp.com',
  projectId: 'fresh-link-717f4',
  storageBucket: 'fresh-link-717f4.firebasestorage.app',
  messagingSenderId: '744235606067',
  appId: '1:744235606067:web:496bae7a3d42cbf0be0346',
});

const messaging = firebase.messaging();

const BASE = self.location.origin;

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'FreshLink';
  const body  = payload.notification?.body  ?? '';
  const image = payload.notification?.image ?? `${BASE}/notification-bg.png`;

  const options = {
    body,
    icon:               `${BASE}/app-icon-192.png`,
    badge:              `${BASE}/app-icon-192.png`,
    image,
    vibrate:            [200, 100, 200],
    requireInteraction: false,
    data:               { ...(payload.data ?? {}), url: BASE },
  };

  self.registration.showNotification(title, options);
});

// Open / focus the app when the notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? BASE;
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.startsWith(BASE) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      }),
  );
});
