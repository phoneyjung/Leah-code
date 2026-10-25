/* ตัวช่วยให้เกมเปิดได้แม้ไม่มีเน็ต — เปลี่ยนเลข v ทุกครั้งที่แก้ไฟล์นี้ */
const CACHE = 'leah-code-v3';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;

  // หน้าเกม: ดึงของใหม่ก่อน (อัปเดตทันทีเมื่อแก้ไฟล์) ถ้าไม่มีเน็ตใช้ของในเครื่อง
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      const url = new URL(req.url);
      const isGame = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
      if (r.ok && isGame) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
      }
      return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // ภาพ เสียง ฟอนต์: ใช้ของในเครื่องก่อน แล้วอัปเดตเบื้องหลัง
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return r;
    }).catch(() => hit || Response.error());
    return hit || net;
  }));
});
