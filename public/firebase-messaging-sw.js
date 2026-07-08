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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'FreshLink';
  const options = {
    body: payload.notification?.body ?? '',
    icon: '/favicon.png',
    data: payload.data ?? {},
  };

  self.registration.showNotification(title, options);
});
