const CACHE_NAME = 'glowdeals-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/css/style.css',
  './src/css/components.css',
  './src/css/responsive.css',
  './src/js/app.js',
  './src/js/dealsData.js',
  './src/js/storage.js',
  './src/js/tracker.js',
  './src/js/notifications.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/images/products/the-indian-recipe.jpg',
  './assets/images/products/braes-shimmer-oil.png',
  './assets/images/products/raw-african-routine.jpg',
  './assets/images/products/raw-african-shea.png',
  './assets/images/products/eva-peach-lotion.png',
  './assets/images/products/eva-cozy-dream.jpg',
  './assets/images/products/hathor-bath-salts.jpg',
  './assets/images/products/hathor-rose-water.jpg',
  './assets/images/products/maybelline-matte-ink.jpg',
  './assets/images/products/maybelline-sky-high.jpg',
  './assets/images/products/loreal-infallible.jpg',
  './assets/images/products/garnier-micellar.jpg',
  './assets/images/products/sally-hansen-nails.jpg'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching authentic assets & app shell');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Service Worker] Some assets skipped during pre-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Stale-while-revalidate strategy for seamless offline access
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notification Event (Deal of the Day & Hourly Flash Alerts)
self.addEventListener('push', (event) => {
  let data = {
    title: 'GlowDeals 💖 Deal of the Day in Egypt!',
    body: 'A special beauty discount is waiting for you! Tap to explore.',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    url: './index.html?view=deal-of-the-day',
    tag: 'deal-of-the-day'
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || './assets/icons/icon-192.png',
    badge: data.badge || './assets/icons/icon-192.png',
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: data.url || './index.html'
    },
    actions: [
      { action: 'explore', title: '💖 View Deal' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Event - Deep link to deal or launch app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
