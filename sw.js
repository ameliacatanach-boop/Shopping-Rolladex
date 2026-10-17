// Shopping Rolladex offline helper.
// Keeps a copy of the app page (and its fonts) on the phone so it opens with no signal.
// Your Sheet data is never stored here; the app keeps its own saved copy.
var CACHE = 'rolladex-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['rolladex.html']); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('rolladex-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // The app page: always try the network first so updates arrive; fall back to the saved copy offline.
  if (url.origin === location.origin && /\/rolladex\.html$/.test(url.pathname)) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('rolladex.html', copy); });
      return res;
    }).catch(function () { return caches.match('rolladex.html'); }));
    return;
  }
  // Fonts: use the saved copy if there is one. Your other apps' pages on the same site are left alone.
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); return res; });
    }));
  }
  // Everything else (Google sign-in, Sheets, logos) goes straight to the network.
});
