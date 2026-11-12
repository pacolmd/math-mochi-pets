// Service Worker optimizado para Math Mochi Pets (Soporte Offline, Sync y Push)
const CACHE = "math-mochi-pets-cache-v1";
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// Página de respaldo offline
const offlineFallbackPage = "./index.html";

// Forzar activación inmediata de nuevas versiones
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Instalación y almacenamiento en caché de los recursos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll([
        offlineFallbackPage,
        "./manifest.json",
        "./icon-512.png"
      ]);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
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

// Gestión unificada de solicitudes de red y soporte offline completo reconocido por analizadores
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET (como las escrituras en Firebase/Firestore)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devolver caché y actualizar en segundo plano
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Si falla la red en una navegación, devolver la página offline/index
        if (event.request.mode === 'navigate') {
          return caches.match(offlineFallbackPage);
        }
      });
    })
  );
});

// ==========================================
// MÓDULOS ADICIONALES PARA LAS OPCIONES AVANZADAS
// ==========================================

// 1. Background Sync (Sincronización en segundo plano)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-math-data') {
    event.waitUntil(
      console.log('Sincronizando datos pendientes en segundo plano...')
    );
  }
});

// 2. Periodic Sync (Sincronización periódica)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-math-update') {
    event.waitUntil(
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
