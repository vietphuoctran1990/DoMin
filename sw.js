/* ============================================================
   CHIẾN SĨ DÒ MÌN - Service Worker
   Cho phép bé chơi được cả khi không có mạng (offline).
   Đổi CACHE_VERSION mỗi lần cập nhật game.
   ============================================================ */
const CACHE_VERSION = 'domin-v4';

const ASSETS = [
  './',
  './index.html',
  './css/fonts.css',
  './css/style.css',
  './js/content.js',
  './js/save.js',
  './js/questions.js',
  './js/audio.js',
  './js/sprites.js',
  './js/map.js',
  './js/collection.js',
  './js/game.js',
  './js/pwa.js',
  './fonts/baloo2-vietnamese.woff2',
  './fonts/baloo2-latin.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* Trang chính: ưu tiên mạng để nhận bản cập nhật, hỏng mạng thì lấy bản đã lưu */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  /* Tài nguyên tĩnh: trả bản đã lưu ngay cho nhanh, đồng thời làm mới ngầm */
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
