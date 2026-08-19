const CACHE_NAME = 'game-offline-v1';

// เมื่อติดตั้ง Service Worker ให้เปิด Cache
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ดักจับการดึงข้อมูล: ถ้ามีเน็ตให้โหลดปกติและแอบเก็บลง Cache / ถ้าไม่มีเน็ตให้ดึงจาก Cache มาเล่น
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. ถ้ามีไฟล์ใน Cache อยู่แล้ว ให้ดึงมาใช้ทันที (ทำให้เล่นออฟไลน์ได้)
      if (cachedResponse) {
        // แอบอัปเดต Cache จาก Network ใน background (Stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* ออฟไลน์อยู่ ไม่เป็นไร */});

        return cachedResponse;
      }

      // 2. ถ้ายังไม่มีใน Cache ให้โหลดจากเน็ต แล้วเซฟเก็บไว้ใช้ครั้งหน้า
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
