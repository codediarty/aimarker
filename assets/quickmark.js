/* AIMarker 빠른 지문 마크(/mark/ #auto): 붙여넣기 · 이미지 고르기 · 폴더 연결(새 파일 자동) · 휴대폰 공유하기로 받기.
   모두 이 브라우저 안에서만 처리하고 서버로 보내지 않습니다. */
(function () {
  'use strict';
  var S = window.AIMarkerStamp, box = document.getElementById('qm');
  if (!box || !S) return;
  var $ = function (s) { return document.querySelector(s); };
  var gal = $('#qmOut'), drop = $('#qmDrop'), inp = $('#qmFiles'), log = $('#qmLog'), res = $('#qmRes'), allBtn = $('#qmAll');
  var results = [];   // { src: File, name, blob, url, el, folder }
  var IMG = /\.(jpe?g|png|webp)$/i, LIVE_MAX = 40;
  var touch = window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches;

  function opts() {
    var v = function (n) { var el = box.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ''; };
    return { kind: v('qk') || 'gen', pos: v('qp') || 'br', size: v('qs') || 'm', theme: v('qt') || 'dark', by: ($('#qmBy').value || '').trim().slice(0, 40), meta: $('#qmMeta').checked, brand: true };
  }
  function syncOn() { Array.prototype.forEach.call(box.querySelectorAll('.k-chipset label, .k-corners label'), function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); }); }
  var restampT = 0;
  function changed() { syncOn(); paintPreview(); clearTimeout(restampT); restampT = setTimeout(restampAll, 350); }
  box.addEventListener('change', changed);
  box.addEventListener('input', function (e) { if (e.target.id === 'qmBy') { paintPreview(); clearTimeout(restampT); restampT = setTimeout(restampAll, 700); } });

  /* 예시 칸: 예시 그림(가득 채워 자름) 위에 지금 설정의 마크 */
  var pv = $('#qmPrev'), pimg = new Image();
  pimg.src = (document.body.getAttribute('data-root') || '') + 'demo/img/bomgyeol-vase.jpg';
  function paintPreview() {
    if (!pv || !pimg.complete || !pimg.naturalWidth) return;
    var W = pv.width, H = pv.height, ctx = pv.getContext('2d'), iw = pimg.naturalWidth, ih = pimg.naturalHeight;
    var sc = Math.max(W / iw, H / ih), sw = W / sc, sh = H / sc;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(pimg, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, W, H);
    S.draw(ctx, W, H, opts());
  }
  pimg.onload = paintPreview;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintPreview);

  function say(t) { if (log) log.textContent = t || ''; }
  function showRes() { var has = results.length > 0 || !!(log && log.textContent); box.classList.toggle('has', has); res.hidden = !has; allBtn.hidden = results.length < 2; }
  function setItem(it, r) {
    if (it.url) URL.revokeObjectURL(it.url);
    it.blob = r.blob; it.name = r.name; it.url = URL.createObjectURL(r.blob);
    var el = it.el;
    el.querySelector('img').src = it.url;
    el.querySelector('b').textContent = r.name;
    el.querySelector('.meta').textContent = r.width + '×' + r.height + ' · ' + (r.blob.size >= 1048576 ? (r.blob.size / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(r.blob.size / 1024)) + 'KB') + (it.folder ? ' · 폴더에 저장함' : '');
    var a = el.querySelector('a[download]'); a.href = it.url; a.download = r.name;
  }
  function addResult(r, src, folder) {
    var it = { src: src, folder: !!folder, el: document.createElement('figure') };
    var d = it.el;
    d.className = 'k-qm-item';
    d.innerHTML = '<img alt="지문 마크를 넣은 이미지"><figcaption><b></b><span class="meta"></span><span class="acts"><a class="k-btn k-btn-p k-btn-s" download>내려받기</a>' +
      (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write && !touch ? '<button class="k-btn k-btn-l k-btn-s" type="button" data-cp>복사</button>' : '') +
      (navigator.canShare ? '<button class="k-btn k-btn-l k-btn-s" type="button" data-sh>공유</button>' : '') + '</span></figcaption>';
    setItem(it, r);
    var cp = d.querySelector('[data-cp]');
    if (cp) cp.addEventListener('click', function () {
      toPng(it.blob).then(function (png) { return navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]); })
        .then(function () { cp.textContent = '복사했어요'; setTimeout(function () { cp.textContent = '복사'; }, 1500); }, function () { cp.textContent = '복사 안 됨'; });
    });
    var sh = d.querySelector('[data-sh]');
    if (sh) sh.addEventListener('click', function () {
      var f = new File([it.blob], it.name, { type: it.blob.type });
      if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: it.name }).catch(function () { /* 취소 */ });
      else sh.textContent = '공유 안 됨';
    });
    results.push(it);
    gal.insertBefore(d, gal.firstChild);
    showRes();
    return it;
  }
  function toPng(blob) {
    if (blob.type === 'image/png') return Promise.resolve(blob);
    return createImageBitmap(blob).then(function (b) { var c = document.createElement('canvas'); c.width = b.width; c.height = b.height; c.getContext('2d').drawImage(b, 0, 0); return new Promise(function (r) { c.toBlob(r, 'image/png'); }); });
  }

  var queue = Promise.resolve();
  function take(files, src) {
    var list = Array.prototype.filter.call(files || [], function (f) { return f && (/^image\/(jpeg|png|webp)$/.test(f.type) || IMG.test(f.name || '')); });
    if (!list.length) { say('이미지(JPG, PNG, WebP)만 넣을 수 있어요. 영상과 문서는 아래 자동 마킹에서 넣으세요.'); showRes(); return Promise.resolve(0); }
    var n = 0, firstIt = null;
    list.forEach(function (f) {
      queue = queue.then(function () {
        say((src || '') + f.name + ' 에 마크를 넣는 중…'); showRes();
        return S.stamp(f, opts()).then(function (r) { n++; var it = addResult(r, f, false); if (!firstIt) firstIt = it; }, function () { say(f.name + ' 은(는) 열지 못했어요.'); });
      });
    });
    return queue.then(function () {
      if (n) say(n + '개에 지문 마크를 넣었어요. 위에서 모양을 바꾸면 결과도 바로 바뀝니다. 파일은 이 브라우저 밖으로 나가지 않았습니다.');
      if (n && window.innerWidth <= 920 && firstIt) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return n;
    });
  }
  /* 모양을 바꾸면 이미 만든 결과도 다시 그림(폴더에 저장한 것은 그대로) */
  function restampAll() {
    var todo = results.filter(function (it) { return !it.folder; }).slice(-LIVE_MAX);
    if (!todo.length) return;
    var o = opts();
    todo.forEach(function (it) {
      it.el.classList.add('busy');
      queue = queue.then(function () { return S.stamp(it.src, o).then(function (r) { setItem(it, r); }, function () { /* 그대로 둠 */ }).then(function () { it.el.classList.remove('busy'); }); });
    });
  }

  inp.addEventListener('change', function () { take(inp.files); inp.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('on'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('on'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer) take(e.dataTransfer.files); });
  drop.addEventListener('click', function (e) { if (!e.target.closest('button,a,input,label')) inp.click(); });
  drop.addEventListener('keydown', function (e) { if (e.target === drop && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); inp.click(); } });

  function stampName(prefix, type) {
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return prefix + '_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '.' + ((type || 'image/png').split('/')[1] || 'png').replace('jpeg', 'jpg');
  }
  /* 붙여넣기: 글 칸에 쓰는 중이 아니면 페이지 어디서든 */
  document.addEventListener('paste', function (e) {
    var t = e.target; if (t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type !== 'file') || t.isContentEditable)) return;
    var items = (e.clipboardData && e.clipboardData.items) || [], files = [];
    for (var i = 0; i < items.length; i++) if (items[i].kind === 'file') { var f = items[i].getAsFile(); if (f) files.push(new File([f], f.name && !/^image\.(png|jpe?g)$/i.test(f.name) ? f.name : stampName('붙여넣은이미지' + (files.length ? '_' + (files.length + 1) : ''), f.type), { type: f.type })); }
    if (files.length) { e.preventDefault(); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); take(files, '붙여넣은 이미지 '); }
  });

  /* 모두 내려받기(ZIP, aim-extract 의 zipBuild 사용) */
  function dl(href, name) { var a = document.createElement('a'); a.href = href; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 0); }
  allBtn.addEventListener('click', function () {
    var X = window.AIMExtract;
    if (!X || !X.zipBuild) { results.forEach(function (r) { dl(r.url, r.name); }); return; }
    var used = {};
    Promise.all(results.map(function (r) {
      var nm = r.name, k = 2; while (used[nm]) nm = r.name.replace(/(\.[a-z]+)$/i, '_' + (k++) + '$1'); used[nm] = 1;
      return r.blob.arrayBuffer().then(function (ab) { return { name: nm, data: new Uint8Array(ab) }; });
    }))
      .then(function (ents) { return X.zipBuild(ents); })
      .then(function (parts) { var u = URL.createObjectURL(new Blob(parts, { type: 'application/zip' })); dl(u, 'AIMarker_지문마크_' + results.length + '개.zip'); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); });
  });

  /* 폴더 연결: 새 이미지가 들어오면 'AIMarker 표시본' 폴더에 마크를 넣은 사본을 자동으로(PC 크롬 · 엣지) */
  var fbtn = $('#qmFolder'), fst = $('#qmFolderState'), dirH = null, outH = null, seen = {}, timer = 0, busy = false;
  if (!window.showDirectoryPicker) {
    fbtn.hidden = true;
    if (!touch) { fst.className = 'k-qm-state mute'; fst.textContent = '폴더 연결(새 이미지 자동 마크)은 PC의 크롬, 엣지에서 쓸 수 있습니다.'; fst.hidden = false; }
  }
  fbtn.addEventListener('click', function () {
    if (!window.showDirectoryPicker) return;
    if (timer) { clearInterval(timer); timer = 0; dirH = null; fbtn.lastChild.textContent = '폴더 연결(자동)'; fst.textContent = '폴더 연결을 끊었습니다.'; return; }
    window.showDirectoryPicker({ mode: 'readwrite', id: 'aimarker-watch' }).then(function (h) {
      dirH = h;
      return h.getDirectoryHandle('AIMarker 표시본', { create: true }).then(function (o) { outH = o; });
    }).then(function () {
      seen = {};
      return scanDir(true);
    }).then(function (n) {
      fbtn.lastChild.textContent = '연결 끊기';
      fst.className = 'k-qm-state'; fst.hidden = false;
      fst.textContent = '\'' + dirH.name + '\' 폴더를 지켜보는 중입니다. 지금 있던 이미지 ' + n + '개에 마크를 넣었고, 새 이미지가 들어오면 몇 초 안에 \'AIMarker 표시본\' 폴더에 사본을 만듭니다. 이 창을 열어 두세요.';
      timer = setInterval(function () { scanDir(false); }, 4000);
    }).catch(function (e) { if (e && e.name !== 'AbortError') { fst.className = 'k-qm-state'; fst.hidden = false; fst.textContent = '폴더를 열지 못했습니다. 권한을 허용했는지 확인해 주세요.'; } });
  });
  function scanDir(first) {
    if (!dirH || busy) return Promise.resolve(0);
    busy = true;
    var todo = [], it = dirH.values ? dirH.values() : dirH.entries();
    function next() {
      return it.next().then(function (r) {
        if (r.done) return;
        var h = r.value && r.value.kind ? r.value : r.value[1];
        if (h.kind === 'file' && IMG.test(h.name) && !/_AIMarker\.(jpe?g|png|webp)$/i.test(h.name)) todo.push(h);
        return next();
      });
    }
    return next().then(function () {
      return todo.reduce(function (p, h) {
        return p.then(function (cnt) {
          return h.getFile().then(function (f) {
            var key = h.name + ':' + f.size + ':' + f.lastModified;
            if (seen[key]) return cnt;
            seen[key] = 1;
            if (Date.now() - f.lastModified < 1500 && !first) { delete seen[key]; return cnt; }   // 아직 저장 중일 수 있어 다음 차례에
            return S.stamp(f, opts()).then(function (r) {
              return outH.getFileHandle(r.name, { create: true }).then(function (wh) { return wh.createWritable(); })
                .then(function (w) { return w.write(r.blob).then(function () { return w.close(); }); })
                .then(function () { addResult(r, f, true); if (!first) say('새 파일 ' + h.name + ' 에 마크를 넣어 \'AIMarker 표시본\' 폴더에 저장했습니다.'); return cnt + 1; });
            }, function () { return cnt; });
          });
        });
      }, Promise.resolve(0));
    }).then(function (n) { busy = false; return n; }, function () { busy = false; return 0; });
  }

  /* 휴대폰 공유하기로 받은 이미지(웹 앱 공유 대상, /aimarker-sw.js 가 잠시 맡아 둔 것) */
  if (/Android/i.test(navigator.userAgent)) { var hm = $('#qmHintM'); if (hm) hm.textContent = '사진첩에서 고르면 바로 마크가 들어갑니다. AIMarker를 홈 화면에 추가하면 AI 앱의 공유하기에서 AIMarker를 골라 바로 넣을 수도 있습니다.'; }
  var q = new URLSearchParams(location.search);
  if (q.has('share') && window.caches) {
    caches.open('aimarker-share').then(function (c) {
      return c.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return c.match(k).then(function (r) { return r.blob().then(function (b) { var nm = decodeURIComponent(r.headers.get('x-name') || '') || stampName('공유받은이미지', b.type); return new File([b], nm, { type: b.type }); }); });
        })).then(function (files) { return Promise.all(keys.map(function (k) { return c.delete(k); })).then(function () { return files; }); });
      });
    }).then(function (files) {
      history.replaceState(null, '', location.pathname + '#auto');
      if (files.length) take(files, '공유받은 이미지 ');
      else { say('공유받은 이미지를 찾지 못했어요. 이미지 고르기로 넣어 주세요.'); showRes(); }
    }).catch(function () { /* 무시 */ });
  }
  syncOn();
})();
