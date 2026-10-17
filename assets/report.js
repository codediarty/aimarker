/* AIMarker 일괄 확인 리포트(2026.10 · 5.1)
 * 1) 파일 · 폴더 · ZIP 을 이 브라우저에서 읽기(aim-extract) → 2) 20건씩 서버 확인(am.analyzebatch)
 * → 3) 리포트 정리(aim-report) · HTML · PDF · CSV. 원본 파일 · CSV 는 서버로 보내지 않음(특징값 · 해시 · 서명 조각만). */
(function () {
  'use strict';
  var AIM = window.AIMExtract, REP = window.AIMReport, MK = window.MK, AM = window.AM, JSZip = window.JSZip;
  var $ = function (s) { return document.querySelector(s); };
  var drop = $('#rpDrop'); if (!drop || !AIM || !REP || !MK || !AM) return;
  var MAX = 200, MAXB = 300 * 1048576, BATCH = 20, PACK_BUDGET = 900000, PACK_ALONE = 300000, READERS = 2, SENDERS = 3;
  var EXT = /\.(jpe?g|png|webp|gif|avif|heic|heif|tiff?|bmp|svg|mp4|m4v|mov|m4a|mp3|wav|flac|aac|ogg|webm|pdf)$/i;
  var SKIP = /(^|\/)(\.|__MACOSX\/|Thumbs\.db$|desktop\.ini$)/i;
  var THUMB = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;
  var picked = [], skipped = { type: 0, big: 0, over: 0, zip: 0 }, decl = null, running = false, last = null;

  function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = c || 'w' + Math.random().toString(36).slice(2, 12); } return c; }
  function esc(s) { return MK.esc(s); }

  /* ---------- 넣기: 파일 · 폴더 · ZIP ---------- */
  function addSource(src) {
    if (picked.length >= MAX) { skipped.over++; return; }
    if (SKIP.test(src.path)) return;
    if (!EXT.test(src.name)) { skipped.type++; return; }
    if (src.size > MAXB) { skipped.big++; return; }
    if (picked.some(function (p) { return p.path === src.path && p.size === src.size; })) return;
    picked.push(src);
  }
  function fromFile(f, path) {
    var p = path || f.webkitRelativePath || f.name;
    if (/\.zip$/i.test(f.name)) return fromZip(f, p);
    addSource({ name: f.name, path: p, size: f.size, load: function () { return Promise.resolve(f); } });
    return Promise.resolve();
  }
  function fromZip(f, zpath) {
    if (!JSZip) { skipped.zip++; return Promise.resolve(); }
    return JSZip.loadAsync(f).then(function (z) {
      Object.keys(z.files).forEach(function (k) {
        var e = z.files[k]; if (e.dir) return;
        var nm = k.split('/').pop(), size = e._data && e._data.uncompressedSize || 0;
        addSource({ name: nm, path: zpath + '/' + k, size: size, load: function () { return e.async('blob').then(function (b) { return new File([b], nm, { type: mime(nm) }); }); } });
      });
    }).catch(function () { skipped.zip++; });
  }
  function mime(n) { var m = /\.([a-z0-9]+)$/i.exec(n); var x = m ? m[1].toLowerCase() : ''; return { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', bmp: 'image/bmp', svg: 'image/svg+xml', tif: 'image/tiff', tiff: 'image/tiff', heic: 'image/heic', heif: 'image/heif', mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', m4a: 'audio/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', aac: 'audio/aac', ogg: 'audio/ogg', pdf: 'application/pdf' }[x] || ''; }
  function walk(entry, base) {   // 끌어다 놓은 폴더 안까지
    return new Promise(function (ok) {
      if (!entry) return ok();
      if (entry.isFile) { entry.file(function (f) { fromFile(f, (base ? base + '/' : '') + f.name).then(ok, ok); }, function () { ok(); }); return; }
      if (!entry.isDirectory) return ok();
      var rd = entry.createReader(), all = [];
      (function more() { rd.readEntries(function (list) { if (!list.length) return Promise.all(all.map(function (x) { return walk(x, (base ? base + '/' : '') + entry.name); })).then(function () { ok(); }); all = all.concat(Array.prototype.slice.call(list)); more(); }, function () { ok(); }); })();
    });
  }
  function addFiles(list, viaDir) { var ps = []; Array.prototype.forEach.call(list || [], function (f) { ps.push(fromFile(f, viaDir ? f.webkitRelativePath : '')); }); return Promise.all(ps).then(refresh); }
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); if (!running) drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) {
    if (running) return;
    var dt = e.dataTransfer; if (!dt) return;
    var items = dt.items && dt.items.length && dt.items[0].webkitGetAsEntry ? Array.prototype.slice.call(dt.items) : null;
    if (items) Promise.all(items.map(function (it) { return walk(it.webkitGetAsEntry(), ''); })).then(refresh);
    else addFiles(dt.files);
  });
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#rpFiles').click(); } });
  drop.addEventListener('click', function (e) { if (e.target === drop || e.target.closest('.mk-drop-ic') || e.target.tagName === 'B') $('#rpFiles').click(); });
  $('#rpFiles').addEventListener('change', function () { addFiles(this.files).then(function () { $('#rpFiles').value = ''; }); });
  $('#rpDir').addEventListener('change', function () { addFiles(this.files, true).then(function () { $('#rpDir').value = ''; }); });
  $('#rpClear').addEventListener('click', function () { if (running) return; picked = []; skipped = { type: 0, big: 0, over: 0, zip: 0 }; refresh(); });

  function refresh() {
    var n = picked.length, total = picked.reduce(function (a, p) { return a + (p.size || 0); }, 0);
    $('#rpPicked').hidden = !n && !skipped.type && !skipped.big && !skipped.over && !skipped.zip;
    $('#rpCount').textContent = n + '개';
    $('#rpSize').textContent = n ? '모두 ' + MK.bytes(total) : '';
    var names = picked.slice(0, 6).map(function (p) { return p.path; });
    $('#rpNames').textContent = names.join(' · ') + (n > 6 ? ' 외 ' + (n - 6) + '개' : '');
    var sk = [];
    if (skipped.type) sk.push('지원하지 않는 형식 ' + skipped.type + '개');
    if (skipped.big) sk.push('300MB 넘는 파일 ' + skipped.big + '개');
    if (skipped.over) sk.push('200개를 넘는 ' + skipped.over + '개');
    if (skipped.zip) sk.push('열지 못한 ZIP ' + skipped.zip + '개');
    $('#rpSkip').hidden = !sk.length; $('#rpSkip').textContent = sk.length ? '건너뜀: ' + sk.join(' · ') : '';
    $('#rpRun').disabled = !n || running;
    $('#rpGoNote').textContent = running ? '확인하는 동안 이 창을 닫지 마세요.' : n ? n + '개를 확인합니다. 보통 100건에 1~2분 걸립니다.' : '콘텐츠를 넣으면 시작할 수 있습니다.';
  }

  /* ---------- 지금 표시 목록(CSV) ---------- */
  $('#rpCsv').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return;
    f.text().then(function (t) {
      decl = REP.parseDeclared(t);
      $('#rpCsvName').textContent = f.name;
      $('#rpCsvNote').textContent = decl.count ? '표시 ' + decl.count + '줄을 읽었습니다' + (decl.bad ? '(표시 이름을 알 수 없는 ' + decl.bad + '줄은 뺌)' : '') + '. 파일 이름으로 맞춰 비교합니다.' : '읽을 수 있는 줄이 없습니다. 첫 칸 파일 이름, 둘째 칸 지금 표시로 적어 주세요.';
      $('#rpCsvNote').classList.toggle('bad', !decl.count);
    }).catch(function () { $('#rpCsvNote').textContent = 'CSV 를 읽지 못했습니다.'; });
  });
  $('#rpTpl').addEventListener('click', function () {
    MK.save(new Blob([REP.declaredTemplate(picked.map(function (p) { return p.name; }))], { type: 'text/csv;charset=utf-8' }), 'aimarker-지금표시-양식.csv');
  });

  /* ---------- 실행 ---------- */
  var entries, readQ, sendQ, nRead, nChecked, nFail, readers, senders, t0, pauseUntil, batchMs, busyN;
  $('#rpRun').addEventListener('click', start);
  function start() {
    if (running || !picked.length) return;
    running = true; refresh(); $('#rpOut').hidden = true; $('#rpProg').hidden = false;
    entries = picked.map(function (p, i) { return { i: i, src: p, name: p.name, path: p.path, size: p.size, kind: 'other', state: 'wait' }; });
    if (decl && decl.count) entries.forEach(function (e) { var d = decl.map[e.name.toLowerCase()]; if (d) e.declared = d; });
    readQ = entries.slice(); sendQ = []; nRead = 0; nChecked = 0; nFail = 0; readers = 0; senders = 0; t0 = Date.now(); pauseUntil = 0; batchMs = []; busyN = 0;
    drop.setAttribute('aria-disabled', 'true');
    progress(); pumpRead();
  }
  function progress(msg) {
    var N = entries.length;
    $('#rpReadN').textContent = nRead + '/' + N; $('#rpReadBar').style.width = (N ? nRead * 100 / N : 0) + '%';
    $('#rpCheckN').textContent = nChecked + '/' + N; $('#rpCheckBar').style.width = (N ? nChecked * 100 / N : 0) + '%';
    if (msg !== undefined) { $('#rpStatus').textContent = msg; return; }
    var left = N - nChecked, avg = batchMs.length ? batchMs.reduce(function (a, b) { return a + b; }, 0) / batchMs.length : 0;
    var eta = avg ? Math.ceil(Math.ceil(left / BATCH) * avg / SENDERS / 1000) : 0;
    $('#rpStatus').textContent = nChecked < N ? '확인 중 · ' + (eta ? '남은 시간 약 ' + (eta >= 90 ? Math.round(eta / 60) + '분' : eta + '초') : '시간을 재는 중') + (nFail ? ' · 확인 못함 ' + nFail + '건' : '') : '정리 중';
  }

  /* 읽기(동시에 2개) */
  function pumpRead() {
    while (readers < READERS && readQ.length) (function (e) {
      readers++; e.state = 'reading';
      e.src.load().then(function (file) {
        return AIM.inspectFile(file).then(function (x) {
          e.kind = x.report.kind || 'other'; e.sha256 = x.features.sha256; e.dhash = x.features.dhash || ''; e.features = x.features; e.pack = x.pack || null;
          e.packLen = e.pack ? JSON.stringify(e.pack).length : 0; e.state = 'local';
          return THUMB.test(e.name) && e.kind === 'image' ? thumb(file).then(function (t) { e.thumb = t; }) : null;
        });
      }).catch(function () { e.state = 'fail'; e.error = '이 파일을 읽지 못했습니다.'; nFail++; nChecked++; })
        .then(function () { readers--; nRead++; if (e.state === 'local') sendQ.push(e); progress(); pumpRead(); pumpSend(); });
    })(readQ.shift());
    if (!readQ.length && !readers) pumpSend();
  }
  function thumb(file) {
    if (typeof createImageBitmap === 'undefined') return Promise.resolve('');
    return createImageBitmap(file).then(function (bm) {
      var S = 88, c = document.createElement('canvas'); c.width = S; c.height = S;
      var k = Math.max(S / bm.width, S / bm.height), w = bm.width * k, h = bm.height * k, x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, S, S); x.drawImage(bm, (S - w) / 2, (S - h) / 2, w, h); if (bm.close) bm.close();
      return c.toDataURL('image/jpeg', 0.72);
    }).catch(function () { return ''; });
  }

  /* 서버 확인(20건씩, 동시에 3묶음) */
  function takeBatch() {
    var out = [], budget = PACK_BUDGET;
    for (var i = 0; i < sendQ.length && out.length < BATCH;) {
      var e = sendQ[i];
      if (e.packLen > PACK_ALONE) { if (!out.length) { out.push(e); sendQ.splice(i, 1); } break; }
      if (e.packLen > budget) { i++; continue; }
      budget -= e.packLen; out.push(e); sendQ.splice(i, 1);
    }
    return out;
  }
  function pumpSend() {
    if (Date.now() < pauseUntil) return;
    var readingDone = !readQ.length && !readers;
    while (senders < SENDERS && sendQ.length && (sendQ.length >= BATCH || readingDone)) {
      var b = takeBatch(); if (!b.length) break;
      send(b);
    }
    if (readingDone && !sendQ.length && !senders) finish();
  }
  function send(batch) {
    senders++;
    var started = Date.now();
    batch.forEach(function (e) { e.state = 'checking'; });
    var body = { cid: cid(), items: batch.map(function (e) { var it = { ref: String(e.i), features: e.features }; if (e.pack) it.pack = e.pack; return it; }) };
    AM.call('am.analyzebatch', body, 180000).then(function (r) {
      if (!r || !r.ok) throw r || {};
      batchMs.push(Date.now() - started); busyN = 0;
      r.results.forEach(function (x) {
        var e = entries[+x.ref]; if (!e) return;
        if (x.ok) { e.result = x; e.state = 'done'; e.pack = null; e.features = null; nChecked++; }
        else if ((x.code === 'TIME' || x.code === 'PACK_BUDGET') && !e.alone) { e.alone = true; e.packLen = PACK_ALONE + 1; e.state = 'local'; sendQ.unshift(e); }   // 따로 한 건씩
        else { e.state = 'fail'; e.error = x.msg || '확인하지 못했습니다.'; nFail++; nChecked++; }
      });
    }).catch(function (err) {
      var code = err && (err.code || err.error), msg = (err && err.message) || '';
      if (code === 'BUSY' && busyN < 3) {   // 몰리면 쉬었다가 이어서(세 번까지)
        busyN++; batch.forEach(function (e) { e.state = 'local'; sendQ.unshift(e); });
        pauseUntil = Date.now() + 65000 * busyN; waitBusy(); return;
      }
      var retry = code !== 'BUSY' && code !== 'ORIGIN' && code !== 'KEY' && code !== 'TOO_MANY' && code !== 'EMPTY';
      batch.forEach(function (e) {
        e.tries = (e.tries || 0) + 1;
        if (retry && e.tries <= 2) { e.state = 'local'; sendQ.unshift(e); }
        else { e.state = 'fail'; e.error = code === 'BUSY' ? '확인 한도(브라우저 하나에 시간당 300건)에 닿아 확인하지 못했습니다. 한 시간 뒤 이 파일만 다시 확인하세요.' : msg || '서버 확인이 끝나지 않았습니다. 잠시 뒤 다시 해 주세요.'; nFail++; nChecked++; }
      });
      if (retry) { pauseUntil = Date.now() + 3000; setTimeout(pumpSend, 3100); }
      else if (code === 'BUSY') { sendQ.splice(0).forEach(function (e) { e.state = 'fail'; e.error = '확인 한도(브라우저 하나에 시간당 300건)에 닿아 확인하지 못했습니다. 한 시간 뒤 이 파일만 다시 확인하세요.'; nFail++; nChecked++; }); }
    }).then(function () { senders--; progress(); pumpSend(); });
  }
  function waitBusy() {
    (function tick() {
      var s = Math.ceil((pauseUntil - Date.now()) / 1000);
      if (s > 0) { progress('서버에 요청이 몰려 ' + s + '초 쉬었다가 이어서 확인합니다.'); setTimeout(tick, 1000); }
      else { progress(); pumpSend(); }
    })();
  }

  /* ---------- 리포트 ---------- */
  function finish() {
    if (!running) return;
    running = false; drop.removeAttribute('aria-disabled');
    var list = entries.map(function (e) { return { name: e.name, path: e.path !== e.name ? e.path : '', size: e.size, kind: e.kind, sha256: e.sha256 || '', dhash: e.dhash || '', result: e.result || null, error: e.error || '', declared: e.declared || '', thumb: e.thumb || '' }; });
    var R = REP.build(list, { org: $('#rpOrg').value, source: 'aimarker.kr/report', at: new Date() });
    last = { R: R, html: REP.html(R), csv: REP.csv(R) };
    progress('끝났습니다 · ' + Math.round((Date.now() - t0) / 1000) + '초');
    $('#rpOneLine').textContent = REP.summaryText(R);
    var fr = $('#rpFrame'); fr.srcdoc = last.html;
    fr.onload = function () { try { fr.style.height = (fr.contentDocument.documentElement.scrollHeight + 8) + 'px'; } catch (e) { fr.style.height = '2400px'; } };
    $('#rpOut').hidden = false; refresh();
    $('#rpOut').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.gtag) try { window.gtag('event', 'report_done', { value: R.n }); } catch (eG) { /* 무시 */ }
  }
  function fname(ext) { var org = ($('#rpOrg').value || '').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 30); return 'aimarker-AI사용확인리포트' + (org ? '-' + org : '') + '-' + new Date().toISOString().slice(0, 10) + '.' + ext; }
  $('#rpSave').addEventListener('click', function () { if (last) MK.save(new Blob([last.html], { type: 'text/html;charset=utf-8' }), fname('html')); });
  $('#rpCsvOut').addEventListener('click', function () { if (last) MK.save(new Blob([last.csv], { type: 'text/csv;charset=utf-8' }), fname('csv')); });
  $('#rpPrint').addEventListener('click', function () { var fr = $('#rpFrame'); try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { var w = window.open('', '_blank'); if (w) { w.document.write(last.html); w.document.close(); w.focus(); w.print(); } } });
  $('#rpAsk').addEventListener('click', function () { if (!last) return; try { sessionStorage.setItem('am_report_memo', '[일괄 확인 리포트] ' + REP.summaryText(last.R)); } catch (e) { /* 무시 */ } });
  $('#rpAgain').addEventListener('click', function () { if (running) return; picked = []; skipped = { type: 0, big: 0, over: 0, zip: 0 }; last = null; $('#rpOut').hidden = true; $('#rpProg').hidden = true; refresh(); drop.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  window.addEventListener('beforeunload', function (e) { if (running) { e.preventDefault(); e.returnValue = ''; } });
  refresh();
})();
