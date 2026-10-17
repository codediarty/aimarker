/* AIMarker 기술 페이지: 지문(dHash) 실제 계산 시연 · 차례 강조 */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- 지문 엔진 시연: 이 브라우저에서 dHash · SHA-256 계산 ---------- */
  var box = $('[data-fp]');
  if (box) {
    var load = function (img) { return new Promise(function (ok, no) { if (img.complete && img.naturalWidth) ok(img); else { img.addEventListener('load', function () { ok(img); }, { once: true }); img.addEventListener('error', no, { once: true }); } }); };
    /* 브라우저마다 축소 방식이 달라 값이 흔들리지 않게, 원래 크기 픽셀을 칸 면적만큼 직접 평균 냄 */
    var cover = function (n, m) {
      var out = [];
      for (var k = 0; k < m; k++) {
        var s = k * n / m, e = (k + 1) * n / m, ws = [];
        for (var i = Math.floor(s); i < e; i++) { var w = Math.min(e, i + 1) - Math.max(s, i); if (w > 0) ws.push([i, w]); }
        out.push(ws);
      }
      return out;
    };
    var dhash = function (img) {
      var W = img.naturalWidth, H = img.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
      var d = x.getImageData(0, 0, W, H).data, wx = cover(W, 9), wy = cover(H, 8), g = [], bits = [];
      for (var cy = 0; cy < 8; cy++) for (var cx = 0; cx < 9; cx++) {
        var t = 0, ws = 0;
        wy[cy].forEach(function (pj) { wx[cx].forEach(function (pi) { var o = (pj[0] * W + pi[0]) * 4, w = pj[1] * pi[1]; t += (.299 * d[o] + .587 * d[o + 1] + .114 * d[o + 2]) * w; ws += w; }); });
        g.push(t / ws);
      }
      for (var y = 0; y < 8; y++) for (var k = 0; k < 8; k++) bits.push(g[y * 9 + k] > g[y * 9 + k + 1] ? 1 : 0);
      return bits;
    };
    var draw = function (cv, bits, ref) {
      var x = cv.getContext('2d'), s = cv.width / 8;
      for (var i = 0; i < 64; i++) {
        var on = bits[i], diff = ref && ref[i] !== bits[i];
        x.fillStyle = diff ? '#E5484D' : on ? '#0E2A6B' : '#E3E8F2';
        x.fillRect((i % 8) * s + .5, Math.floor(i / 8) * s + .5, s - 1, s - 1);
      }
    };
    var ham = function (a, b) { var n = 0; for (var i = 0; i < 64; i++) if (a[i] !== b[i]) n++; return n; };
    var hex = function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); };
    var imgs = { a: $('[data-fpimg="a"]', box), b: $('[data-fpimg="b"]', box), c: $('[data-fpimg="c"]', box) };
    var go = function () {
      Promise.all([load(imgs.a), load(imgs.b), load(imgs.c)]).then(function () {
        var H = { a: dhash(imgs.a), b: dhash(imgs.b), c: dhash(imgs.c) };
        draw($('[data-fpg="a"]', box), H.a); draw($('[data-fpg="b"]', box), H.b, H.a); draw($('[data-fpg="c"]', box), H.c, H.a);
        [['ab', ham(H.a, H.b)], ['ac', ham(H.a, H.c)]].forEach(function (p) {
          $('[data-fpd="' + p[0] + '"]', box).textContent = '64비트 중 ' + p[1] + '비트 다름';
          var v = $('[data-fpv="' + p[0] + '"]', box), same = p[1] <= 10;
          v.textContent = same ? '같은 계보일 가능성 높음' : '다른 콘텐츠';
          v.className = same ? 'ok' : 'no';
        });
      }).catch(function () { $('[data-fpd="ab"]', box).textContent = '이미지를 불러오지 못했어요'; });
      if (window.crypto && crypto.subtle && window.fetch) {
        Promise.all([imgs.a.currentSrc || imgs.a.src, imgs.b.currentSrc || imgs.b.src].map(function (u) { return fetch(u).then(function (r) { return r.arrayBuffer(); }).then(function (b) { return crypto.subtle.digest('SHA-256', b); }); }))
          .then(function (hs) { $('[data-fpsha]', box).innerHTML = 'A <code>' + hex(hs[0]).slice(0, 12) + '…</code> · B <code>' + hex(hs[1]).slice(0, 12) + '…</code>'; })
          .catch(function () { $('[data-fpsha]', box).textContent = '계산하지 못했어요'; });
      }
    };
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '200px' }); io.observe(box); } else go();
  }

})();
