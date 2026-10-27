/* AIMarker 작업 공간 서비스 워커: 네트워크 먼저, 안 되면 저장해 둔 화면(오프라인에서도 열림). 다른 주소(점검 서버)는 건드리지 않음 */
var V = 'am-app-20261027d';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('am-app-') === 0 && k !== V; }).map(function (k) { return caches.delete(k); }));   /* 13.10 작업 공간 캐시만 정리(사이트 서비스 워커의 저장본 · 공유 받은 이미지는 건드리지 않음) */ }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(V).then(function (c) {
    return fetch(e.request).then(function (r) { if (r && r.ok && r.type === 'basic') c.put(e.request, r.clone()); return r; })
      .catch(function () { return c.match(e.request, { ignoreSearch: false }).then(function (m) { return m || c.match('./'); }); });
  }));
});
