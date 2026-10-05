// NQD LMS - Progressive Web App Service Worker
const CACHE_NAME = 'nqd-lms-v1';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim control of all open clients immediately
  event.waitUntil(self.clients.claim());
});

// --- PUSH NOTIFICATION HANDLER ---
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'NQD LMS Thông báo', body: event.data.text() };
    }
  }

  const title = data.title || 'NQD LMS Thông báo';
  const options = {
    body: data.body || 'Bạn có thông báo mới từ hệ thống học tập NQD LMS.',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'nqd-lms-notification',
    renotify: true,
    data: {
      url: data.linkUrl || data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Xem ngay' },
      { action: 'close', title: 'Đóng' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// --- NOTIFICATION CLICK HANDLER ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open with the same target or app, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if ('navigate' in client && targetUrl !== '/') {
              client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
