// Aajori Cuisine Customer Web Push & Notification Service Worker
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
      payload = { title: 'Aajori Cuisine', message: event.data.text() };
    }
  }

  const title = payload.title || 'Aajori Cuisine Order Update';
  const options = {
    body: payload.message || 'You have a new update on your food order.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.orderId || 'aajori-order',
    vibrate: [150, 80, 150],
    data: payload.data || {},
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const urlToOpen = orderId ? `/order/${orderId}` : '/orders';

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
