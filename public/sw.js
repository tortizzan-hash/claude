// VML Portal service worker — handles push notifications.
// Installed by the PWA registration in app/layout.js.

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { return; }

  const { title, body, icon, badge, data, tag, renotify } = payload;
  event.waitUntil(
    self.registration.showNotification(title || 'Vector Mode Legal', {
      body,
      icon: icon || '/icon-192.png',
      badge: badge || '/icon-192.png',
      data,
      tag,
      renotify,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
