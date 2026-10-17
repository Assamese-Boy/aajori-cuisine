// Aajori Cuisine Admin Operations Web Push & Alert Service Worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_) {
      payload = { title: 'Aajori Operations Alert', message: event.data.text() };
    }
  }

  const title = payload.title || '🚨 New Order Received!';
  const options = {
    body: payload.message || 'New order waiting for operations review.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.orderId || 'admin-order',
    vibrate: [300, 100, 300, 100, 300],
    data: payload.data || {},
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = '/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.navigate) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
