const CACHE_NAME = 'risk-spiral-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/css/game.css',
  '/src/main.js',
  '/src/EventsCenter.js',
  '/src/GameManager.js',
  '/src/RiskEngine.js',
  '/src/ProbabilitySystem.js',
  '/src/UpgradeSystem.js',
  '/src/AudioManager.js',
  '/src/data/upgrades.js',
  '/src/data/floorConfig.js',
  '/src/scenes/BootScene.js',
  '/src/scenes/MenuScene.js',
  '/src/scenes/GameScene.js',
  '/src/scenes/GameOverScene.js',
  '/src/scenes/UpgradeScene.js',
  'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
