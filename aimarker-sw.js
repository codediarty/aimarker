/* AIMarker 공유 받기(웹 앱 공유 대상) 1.0
   휴대폰 공유하기 → AIMarker 로 받은 이미지를 잠시 맡아 두었다가 지문 마크 화면(/mark/)으로 넘깁니다.
   그 밖의 요청은 건드리지 않습니다. 이미지는 이 기기 안에만 있고 서버로 보내지 않습니다. */
self.addEventListener('install', function (e) {
  self.skipWaiting();
  try { if (e.addRoutes) e.waitUntil(e.addRoutes([{ condition: { requestMethod: 'GET' }, source: 'network' }]).catch(function () { /* 지원 안 함 */ })); } catch (x) { /* 지원 안 함 */ }
});
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'POST') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin || !/\/mark\/share\/?$/.test(u.pathname)) return;
  e.respondWith(take(r, u.pathname.replace(/share\/?$/, '')));
});
function take(r, base) {
  return r.formData().then(function (fd) {
    var files = fd.getAll('img').filter(function (f) { return f && typeof f !== 'string' && f.size; }).slice(0, 30);
    return caches.open('aimarker-share').then(function (c) {
      return c.keys()
        .then(function (ks) { return Promise.all(ks.map(function (k) { return c.delete(k); })); })
        .then(function () { return Promise.all(files.map(function (f, i) { return c.put(new Request(base + '__share/' + i), new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-name': encodeURIComponent(f.name || '') } })); })); })
        .then(function () { return Response.redirect(base + '?share=' + files.length + '#auto', 303); });
    });
  }).catch(function () { return Response.redirect(base + '?share=0#auto', 303); });
}
