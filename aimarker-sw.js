/* AIMarker 앱 서비스 워커 2.0(13.10, 판 20261031a). 원본은 _src/app/sw.src.js, 빌드가 판 번호를 넣어 /aimarker-sw.js 로 씁니다(그 파일을 직접 고치지 마세요).
   ① 공유 받기: 휴대폰 공유하기 → AIMarker 로 받은 이미지를 잠시 맡아 두었다가 파일 AI 마킹 화면(/mark/)으로 넘깁니다(이 기기 안에만, 서버로 보내지 않음).
   ② 페이지는 늘 네트워크에서 먼저 받습니다(최신). 인터넷이 끊겼을 때만 이 기기에 남은 사본이나 오프라인 화면을 보여 줍니다.
   ③ 판 번호(?v=)가 붙은 CSS · JS 와 글꼴은 한 번 받으면 이 기기에서 바로 엽니다. 다른 주소(점검 서버 · 결제 · 분석)는 건드리지 않습니다. */
var V = '20261031a';
var PRE = 'am-pre-' + V, ASSET = 'am-asset-' + V, PAGE = 'am-page', IMG = 'am-img', FONT = 'am-font-1';
var BASE = self.registration.scope;
var OFFLINE = new URL('offline/', BASE).href;
self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(PRE).then(function (c) {
    return Promise.all([OFFLINE, new URL('assets/icon-192.png', BASE).href].map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () { /* 다음에 */ }); }));
  }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    var old = [];
    ['am-pre-', 'am-asset-'].forEach(function (pfx) {
      var mine = ks.filter(function (k) { return k.indexOf(pfx) === 0; }).sort();
      old = old.concat(mine.slice(0, Math.max(0, mine.length - 2)));   // 바로 앞 판까지 남김(끊겼을 때 예전 사본도 모양이 맞게)
    });
    return Promise.all(old.map(function (k) { return caches.delete(k); }));
  }).then(function () {
    if (self.registration.navigationPreload) return self.registration.navigationPreload.enable().catch(function () { /* 지원 안 함 */ });
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u;
  try { u = new URL(r.url); } catch (x) { return; }
  if (r.method === 'POST') {
    if (u.origin === self.location.origin && /\/mark\/share\/?$/.test(u.pathname)) e.respondWith(take(r, u.pathname.replace(/share\/?$/, '')));
    return;
  }
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') { e.respondWith(page(e)); return; }
  var p = u.pathname;
  if (p.indexOf('/assets/fonts/') >= 0) { e.respondWith(first(r, FONT)); return; }
  if (/\.(css|js)$/.test(p) && u.searchParams.has('v')) { e.respondWith(first(r, ASSET)); return; }
  if (/\.(png|jpe?g|webp|svg|gif|ico)$/.test(p)) { e.respondWith(swr(r, IMG)); return; }
});
function first(r, name) {
  return caches.open(name).then(function (c) {
    return c.match(r).then(function (m) {
      return m || fetch(r).then(function (res) { if (res && res.ok) c.put(r, res.clone()); return res; });
    });
  });
}
function swr(r, name) {
  return caches.open(name).then(function (c) {
    return c.match(r).then(function (m) {
      var net = fetch(r).then(function (res) { if (res && res.ok) { c.put(r, res.clone()).then(function () { trim(c, 80); }); } return res; });
      if (m) { net.catch(function () { /* 끊겨도 저장본으로 */ }); return m; }
      return net;
    });
  });
}
function page(e) {
  var r = e.request;
  return Promise.resolve(e.preloadResponse).then(function (pre) { return pre || fetch(r); }).then(function (res) {
    if (res && res.ok && res.type === 'basic') {
      var cp = res.clone();
      e.waitUntil(caches.open(PAGE).then(function (c) { return c.put(r, cp).then(function () { trim(c, 40); }); }).catch(function () { /* 저장 실패는 무시 */ }));
    }
    return res;
  }).catch(function () {
    return caches.open(PAGE).then(function (c) { return c.match(r, { ignoreSearch: true }); }).then(function (m) {
      return m || caches.match(OFFLINE, { ignoreSearch: true }).then(function (o) {
        return o || new Response('<!doctype html><meta charset="utf-8"><title>AIMarker</title><p>인터넷 연결이 끊겼어요. 연결되면 다시 열어 주세요.</p>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
      });
    });
  });
}
function trim(c, max) { c.keys().then(function (ks) { if (ks.length > max) c.delete(ks[0]).then(function () { trim(c, max); }); }); }
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
