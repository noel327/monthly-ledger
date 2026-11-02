// 月結簿 service worker: cache the app shell so it opens offline.
const CACHE = "monthly-ledger-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never touch Firebase/Google API traffic; Firestore handles its own offline cache.
  if (url.hostname.endsWith("googleapis.com") || url.hostname.endsWith("firebaseapp.com") || url.pathname.startsWith("/__/")) return;
  const isPage = req.mode === "navigate";
  if (isPage || url.origin === location.origin) {
    // network first for our own files, so updates show up; fall back to cache offline
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(m => m || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(m => m || fetch(req)));
});
