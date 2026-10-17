// ============================================================================
// AAJORI CUISINE - Admin Portal Firebase Cloud Messaging (FCM) Service Worker
// Alerts operations staff on incoming live orders even when the admin tab is closed
// ============================================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const swUrl = new URL(self.location.href);
const apiKey = swUrl.searchParams.get('apiKey');
const projectId = swUrl.searchParams.get('projectId');
const messagingSenderId = swUrl.searchParams.get('messagingSenderId');
const appId = swUrl.searchParams.get('appId');

if (apiKey && projectId && messagingSenderId && appId) {
  try {
    firebase.initializeApp({
      apiKey,
      projectId,
      messagingSenderId,
      appId,
    });
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[Admin FCM SW] Received background message:', payload);
      const title = payload.notification?.title || payload.data?.title || '🚨 Incoming Order Alert';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || 'New order received on Aajori Operations Center.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: payload.data?.orderId || 'admin-live-order',
        vibrate: [300, 150, 300, 150, 300],
        data: payload.data || {},
        requireInteraction: true,
      };

      return self.registration.showNotification(title, notificationOptions);
    });
  } catch (err) {
    console.warn('[Admin FCM SW] Firebase compat initialization note:', err);
  }
}

// Fallback native push listener
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (_) {
    payload = {
      notification: {
        title: 'Aajori Operations',
        body: event.data.text(),
      },
    };
  }

  const notification = payload.notification || payload;
  const data = payload.data || {};

  const title = notification.title || data.title || '🚨 Live Operations Alert';
  const options = {
    body: notification.body || notification.message || data.message || 'New activity in Aajori Operations.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.orderId || 'admin-operations-alert',
    vibrate: [300, 150, 300],
    data: data,
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click notification to focus admin panel orders tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const targetUrl = '/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
