// Service Worker optimizado para Math Mochi Pets (Soporte Offline, Sync y Push)
const CACHE = "math-mochi-pets-cache-v1";
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// Página de respaldo offline (apunta a tu index o tu página offline)
const offlineFallbackPage = "./index.html";

// Forzar activación inmediata de nuevas versiones
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Instalación y almacenamiento en caché de la página de respaldo
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(offlineFallbackPage))
  );
});

// Activar navegación prediseñada si el navegador la soporta
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Estrategia de caché general con Workbox
workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: CACHE })
);

// Gestión de solicitudes de red y modo offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) {
          return preloadResp;
        }
        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});

// ==========================================
// MÓDULOS ADICIONALES PARA LAS OPCIONES AVANZADAS
// ==========================================

// 1. Background Sync (Sincronización en segundo plano)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-math-data') {
    event.waitUntil(
      // Aquí puedes añadir la lógica para sincronizar datos pendientes cuando recupere internet
      console.log('Sincronizando datos pendientes en segundo plano...')
    );
  }
});

// 2. Periodic Sync (Sincronización periódica)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-math-update') {
    event.waitUntil(
      // Lógica de actualización periódica si procede
      console.log('Ejecutando sincronización periódica...')
    );
  }
});

// 3. Push Notifications (Notificaciones Push)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Math Mochi Pets";
  const options = {
    body: data.body || "¡Tienes nuevos retos matemáticos esperándote!",
    icon: "./icon-512.png",
    badge: "./icon-512.png"
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
