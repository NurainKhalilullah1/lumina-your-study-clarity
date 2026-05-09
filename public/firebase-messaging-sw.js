// Firebase Messaging Service Worker
// Handles background push notifications when the app tab is closed or backgrounded.
// This file MUST stay in /public so it is served from the root URL.
//
// NOTE: Service workers cannot access Vite's import.meta.env, so Firebase
// config values are hardcoded here. These are public identifiers (not secrets).

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCMiRw4rXwfs6QT9UHewTFJ8NTQ1HQoND8",
  authDomain: "studyflow-8b49d.firebaseapp.com",
  projectId: "studyflow-8b49d",
  storageBucket: "studyflow-8b49d.firebasestorage.app",
  messagingSenderId: "845420711121",
  appId: "1:845420711121:web:9c1db4801da894dae3c9f0",
});

const messaging = firebase.messaging();

// Handle messages arriving when the app is in the background or closed
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'StudyFlow';
  const body = payload.notification?.body || payload.data?.body || 'You have a new tip!';
  const icon = payload.notification?.icon || '/favicon.png';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/favicon.png',
    data: payload.data,
    tag: 'studyflow-tip', // replaces previous unread notification (no stacking)
  });
});

// When user clicks the notification, open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
