const CACHE_NAME = 'xpdevs-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/home'
];

self.addEventListener('install', event => {
  console.log('📦 Service Worker installing and caching files...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE).then(() => {
        console.log('✅ Caching complete.');
      }).catch(err => {
        console.warn('⚠️ Caching failed:', err);
      });
    }).catch(err => {
      console.warn('⚠️ Failed to open cache:', err);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('🔄 Activating new service worker...');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🧹 Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(err => {
      console.warn('⚠️ Fetch failed:', err);
      return fetch(event.request);
    })
  );
});
