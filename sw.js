const CACHE='podsesi-v1';
const ASSETS=['./','index.html','style.css','app.js','episodios.js','firebase-config.js','assets/podsesi-card.jpeg','assets/sesi-escola.jpeg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
