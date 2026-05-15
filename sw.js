// ─── APEX CITY SERVICE WORKER ─────────────────────────────────────────────
const CACHE_NAME = 'apex-city-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/manifest.json',
  '/src/main.js',
  '/src/core/camera.js',
  '/src/core/config.js',
  '/src/core/eventBus.js',
  '/src/core/gameLoop.js',
  '/src/core/renderer.js',
  '/src/core/scene.js',
  '/src/effects/audioSystem.js',
  '/src/effects/particles.js',
  '/src/effects/skidmarks.js',
  '/src/gameplay/missionSystem.js',
  '/src/input/inputManager.js',
  '/src/ui/hud.js',
  '/src/ui/menus.js',
  '/src/ui/minimap.js',
  '/src/ui/notifications.js',
  '/src/utils/debug.js',
  '/src/utils/math.js',
  '/src/utils/objectPool.js',
  '/src/utils/textureFactory.js',
  '/src/vehicles/playerCar.js',
  '/src/vehicles/trafficManager.js',
  '/src/vehicles/vehicleFactory.js',
  '/src/vehicles/vehiclePhysics.js',
  '/src/world/cityGenerator.js',
  '/src/world/lightingSystem.js',
  '/src/world/roads.js',
  '/src/world/weatherSystem.js',
];

const CDN_CACHE = 'apex-cdn-v1';

// Install: pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== CDN_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Local files: cache-first
// - CDN (three.js etc): stale-while-revalidate
// - Everything else: network-first
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // CDN resources: cache aggressively
  if (url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('cdn.jsdelivr.net') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CDN_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Local game files: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
