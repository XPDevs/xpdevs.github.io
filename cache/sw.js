const CACHE_NAME = 'xpdevs-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/indexb.html',
  '/home.html',
  '/1.html',
  '/Doors.html',
  '/ExamOS.html',
  '/Games.html',
  '/NexCOM.html',
  '/NexIDE.html',
  '/Server.html',
  '/Software.html',
  '/Trans.html',
  '/beta.html',
  '/devs.html',
  '/exe2msi.html',
  '/feedback.html',
  '/prodcut.html',
  '/rules.html',
  '/favicon.ico',
  '/rss.xml',
  '/cache/',
  '/download/',
  '/images/',
  '/news/',
  // Add any other folders or files you want to cache
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
