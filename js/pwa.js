/* ============================================================
   CHIẾN SĨ DÒ MÌN - Phần "web app"
   - Đăng ký service worker để chơi offline
   - Nút cài game vào màn hình chính
   - Toàn màn hình + giữ màn hình luôn sáng khi bé đang chơi
   ============================================================ */
(function (global) {
  'use strict';

  const online = location.protocol === 'http:' || location.protocol === 'https:';
  const PWA = { installEvent: null, standalone: false };

  PWA.standalone = global.matchMedia('(display-mode: standalone)').matches ||
                   global.matchMedia('(display-mode: fullscreen)').matches ||
                   global.navigator.standalone === true;

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator && online) {
    global.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });
    });
  }

  /* ---------- Cài vào màn hình chính ---------- */
  global.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    PWA.installEvent = e;
    document.body.classList.add('can-install');
  });

  global.addEventListener('appinstalled', () => {
    PWA.installEvent = null;
    document.body.classList.remove('can-install');
  });

  PWA.install = async function () {
    if (!PWA.installEvent) return false;
    PWA.installEvent.prompt();
    const res = await PWA.installEvent.userChoice.catch(() => null);
    PWA.installEvent = null;
    document.body.classList.remove('can-install');
    return !!res && res.outcome === 'accepted';
  };

  /* iOS không hỗ trợ beforeinstallprompt -> hướng dẫn thủ công */
  PWA.isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  /* ---------- Toàn màn hình ---------- */
  PWA.toggleFullscreen = function () {
    const d = document;
    const el = d.documentElement;
    const isFs = d.fullscreenElement || d.webkitFullscreenElement;
    const fn = isFs
      ? (d.exitFullscreen || d.webkitExitFullscreen)
      : (el.requestFullscreen || el.webkitRequestFullscreen);
    if (!fn) return;
    try {
      const p = fn.call(isFs ? d : el);
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* trình duyệt từ chối - bỏ qua */ }
  };

  PWA.fullscreenSupported = !!(document.documentElement.requestFullscreen ||
                               document.documentElement.webkitRequestFullscreen);

  /* ---------- Giữ màn hình luôn sáng ---------- */
  let wakeLock = null;

  PWA.keepAwake = async function (on) {
    try {
      if (on) {
        if (!('wakeLock' in navigator) || wakeLock) return;
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch (e) { wakeLock = null; }
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && document.body.dataset.playing === '1') PWA.keepAwake(true);
  });

  /* ---------- Rung nhẹ (Android) ---------- */
  PWA.buzz = function (pattern) {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  };

  global.PWA = PWA;
})(window);
