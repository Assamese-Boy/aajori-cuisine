// ============================================================================
// AAJORI CUISINE - Firebase Cloud Messaging (FCM) Service Worker
// Handles background web push notifications when the website is closed or inactive
// ============================================================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Parse Firebase configuration from query parameters if provided on registration
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
      console.log('[FCM SW] Received background message:', payload);
      const title = payload.notification?.title || payload.data?.title || 'Aajori Cuisine Order Alert';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || 'You have an update on your food order.',
        icon: payload.notification?.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.data?.orderId || 'aajori-order',
        vibrate: [200, 100, 200],
        data: payload.data || {},
        requireInteraction: true,
      };

      return self.registration.showNotification(title, notificationOptions);
    });
  } catch (err) {
    console.warn('[FCM SW] Firebase compat initialization note:', err);
  }
}

// Fallback native push listener (for standard W3C / VAPID payloads or direct FCM WebPush)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (_) {
    payload = {
      notification: {
        title: 'Aajori Cuisine',
        body: event.data.text(),
      },
    };
  }

  const notification = payload.notification || payload;
  const data = payload.data || {};

  const title = notification.title || data.title || 'Aajori Cuisine';
  const options = {
    body: notification.body || notification.message || data.message || 'You have a new update.',
    icon: notification.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.orderId || 'aajori-notification',
    vibrate: [200, 100, 200],
    data: data,
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click to focus tab or navigate to order tracking
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const targetUrl = orderId ? `/order/${orderId}` : '/orders';

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
