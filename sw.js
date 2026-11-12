// Service Worker optimizado para Math Mochi Pets (Soporte Offline y Push)
const CACHE_NAME = "math-mochi-pets-cache-v2";
const ASSETS_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-512.png"
];

// Instalación: Guardar recursos esenciales en caché
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación: Limpiar cachés antiguas y tomar control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Forzar activación inmediata si se solicita
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Soporte Offline Real (Detectado por PWABuilder)
self.addEventListener("fetch", (event) => {
  // Solo procesar peticiones GET (ignorar escrituras de Firebase/Firestore)
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si está en caché, lo devuelve y actualiza en segundo plano
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Si no está en caché, intenta buscarlo en la red
      return fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(() => {
          // Si falla la red (offline), devuelve el index.html como respaldo universal
          return caches.match("./index.html");
        });
    })
  );
});

// ==========================================
// MÓDULOS ADICIONALES (Sync y Push)
// ==========================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-math-data') {
    event.waitUntil(console.log('Sincronizando datos pendientes...'));
  }
});

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
