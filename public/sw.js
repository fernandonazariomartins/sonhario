// Service worker simples: guarda a casca do app para abrir rápido e funcionar sem internet.
const CACHE = 'sonhario-v3';
const SHELL = ['/', '/app', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/maskable-512.png', '/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Supabase, Google Fonts etc. vão direto para a rede
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/app').then((r) => r || caches.match('/'))));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});

// Lembrete da manhã: mostra a notificação e, ao tocar, abre o app no gravador.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Sonhou? Registre.', {
    body: d.body || 'Toque e fale antes que a imagem vá embora.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'sonhario-manha',
    data: { url: d.url || '/app' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/app';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abertas) => {
    for (const c of abertas) if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
