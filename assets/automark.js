/* AIMarker 자동 마킹 6.0 (2026.10)
 * 넣기 → 확인(이 브라우저에서 기록 읽기 · 서버 일괄 판정) → 표시 정하기(근거가 있으면 자동, 없으면 한 번 묻기) → 마크 넣기(일괄 발급 · 보이는 마크 ·
 * 파일 속 정보 · 문서 속성 · 표시본 등록) → 받기(ZIP: 표시본 · 기록 파일 · 검색 · AI 검색 꾸러미 · 관리 키).
 * 원본 파일은 서버로 보내지 않음(특징값 · 해시 · 서명 묶음만). 광고 · 글은 점검할 때만 보내고 서버에 저장하지 않음. */
(function () {
  'use strict';
  var AIM = window.AIMExtract, MK = window.MK, SEO = window.AIMSeo, AM = window.AM || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var box = $('#au');
  if (!box || !AIM || !MK || !SEO) return;
  var MAX = 50, MAXB = 300 * 1048576, MAXT = 1024 * 1048576, BATCH = 20;
  var IMG = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  var OFFICE = { docx: 1, pptx: 1, xlsx: 1, odt: 1, ods: 1, odp: 1 };
  var MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', heic: 'image/heic', tiff: 'image/tiff', svg: 'image/svg+xml', mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', flac: 'audio/flac', pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', hwpx: 'application/hwp+zip', hwp: 'application/x-hwp', odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet', odp: 'application/vnd.oasis.opendocument.presentation', epub: 'application/epub+zip' };
  var LABELS = ['ai_generated', 'ai_edited', 'ai_assisted', 'no_ai'];
  var esc = MK.esc;
  var items = [], seq = 0, busy = false, runStats = null, prog = null, ans = '', zipSaved = false, adLabels = null;
  var list = $('#auList'), drop = $('#auDrop'), input = $('#auFiles'), askBox = $('#auAsk'), doneBox = $('#auDone'), goBtn = $('#auGo'), hint = $('#auHint'), bar = $('#auBar');
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } return ''; }
  function cid() { var c = store('am_cid'); if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); store('am_cid', c); } return c; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function baseName(n) { return String(n || '').replace(/\.[a-z0-9]{2,5}$/i, ''); }
  function errMsg(e, d) { if (e && e.name === 'AbortError') return '서버 응답이 늦습니다. 잠시 뒤 다시 시도해 주세요.'; if (e && (e.message || e.msg) && e.code) return e.message || e.msg; return d; }

  /* ---------- 설정(이 브라우저에만 기억) ---------- */
  var O = { vis: true, pos: 'bl', size: 'm', qr: false, ad: false, person: false, notice: 'end', brand: '', rights: '', desc: '', base: '', tools: '' };
  try { var sv = JSON.parse(store('am_auto_opts') || '{}'); Object.keys(O).forEach(function (k) { if (sv[k] != null && typeof sv[k] === typeof O[k]) O[k] = sv[k]; }); } catch (e) { /* 처음 */ }
  function saveOpts() { store('am_auto_opts', JSON.stringify(O)); }
  var F = { vis: $('#oVis'), qr: $('#oQr'), ad: $('#oAd'), person: $('#oPerson'), brand: $('#oBrand'), rights: $('#oRights'), desc: $('#oDesc'), base: $('#oBase'), tools: $('#oTools'), agree: $('#oAgree') };
  function fillOpts() {
    F.vis.checked = O.vis; F.qr.checked = O.qr; F.ad.checked = O.ad; F.person.checked = O.person;
    ['brand', 'rights', 'desc', 'base', 'tools'].forEach(function (k) { F[k].value = O[k]; });
    [['oPos', O.pos], ['oSize', O.size], ['oNotice', O.notice]].forEach(function (p) { var r = box.querySelector('input[name="' + p[0] + '"][value="' + p[1] + '"]'); if (r) r.checked = true; });
  }
  fillOpts();
  box.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'oPos') O.pos = t.value; else if (t.name === 'oSize') O.size = t.value; else if (t.name === 'oNotice') O.notice = t.value;
    else if (t === F.vis) O.vis = t.checked; else if (t === F.qr) O.qr = t.checked;
    else if (t === F.ad) { O.ad = t.checked; if (O.ad && O.pos === 'bl' && !store('am_auto_pos_set')) { O.pos = 'tl'; fillOpts(); } }
    else if (t === F.person) O.person = t.checked;
    else if (t === F.agree) { refresh(); return; }
    else return;
    if (t.name === 'oPos') store('am_auto_pos_set', '1');
    saveOpts(); preview(); refresh();
  });
  box.addEventListener('input', function (e) { var t = e.target; ['brand', 'rights', 'desc', 'base', 'tools'].forEach(function (k) { if (t === F[k]) { O[k] = t.value.trim(); saveOpts(); } }); });

  /* ---------- 탭 ---------- */
  var tabs = [$('#tabFile'), $('#tabText')];
  function selTab(i) {
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', i === j ? 'true' : 'false'); t.tabIndex = i === j ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = i !== j; });
    $('#auRail').hidden = i === 1; refresh();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selTab(i); });
    t.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = (i + 1) % 2; selTab(n); tabs[n].focus(); e.preventDefault(); } });
  });
  document.addEventListener('click', function (e) { var g = e.target.closest('[data-goto="text"]'); if (g) { selTab(1); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(function () { $('#tText').focus(); }, 400); } });

  /* ---------- 넣기 ---------- */
  function totalBytes() { return items.reduce(function (a, it) { return a + (it.size || 0); }, 0); }
  function room() { return MAX - items.length; }
  function addFiles(files) {
    var arr = Array.prototype.slice.call(files || []);
    if (!arr.length) return;
    if (busy) { toast('지금 마크를 넣는 중입니다. 끝난 뒤에 더 넣어 주세요.'); return; }
    if (runStats) { runStats = null; doneBox.hidden = true; }
    arr.reduce(function (p, f) {
      return p.then(function () {
        if (/\.zip$/i.test(f.name || '') || f.type === 'application/zip' || f.type === 'application/x-zip-compressed') return addZip(f);
        addOne(f, f.name, f.size);
      });
    }, Promise.resolve()).then(refresh);
  }
  function addOne(src, name, size) {
    if (room() <= 0) { toast('한 번에 ' + MAX + '개까지 넣습니다. 나머지는 이번 묶음이 끝난 뒤 넣어 주세요.'); return null; }
    if (size > MAXB) { toast(name + ': 300MB보다 큰 파일은 기업용 API로 처리해 주세요.'); return null; }
    if (totalBytes() + size > MAXT) { toast('한 번에 1GB까지 처리합니다. 나머지는 이번 묶음이 끝난 뒤 넣어 주세요.'); return null; }
    var it = { id: ++seq, name: name || '파일', size: size || 0, src: src, state: 'read' };
    items.push(it); mount(it); readQ.push(it); pumpRead();
    return it;
  }
  function addZip(f) {
    if (f.size > MAXT) { toast(f.name + ': ZIP이 너무 큽니다(1GB까지).'); return Promise.resolve(); }
    var tmp = { id: ++seq, name: f.name, size: f.size, state: 'unzip' }; items.push(tmp); mount(tmp);
    return AIM.fileBytes(f).then(function (u8) { return AIM.unzip(u8, { max: Math.max(0, room() + 1), limit: MAXT - totalBytes() }); }).then(function (z) {
      drop_(tmp);
      if (!z || !z.files.length) { toast(f.name + ': 안에서 파일을 찾지 못했습니다.'); return; }
      z.files.forEach(function (x) { var file = typeof File !== 'undefined' ? new File([x.bytes], x.name, { type: '' }) : new Blob([x.bytes]); addOne(file, x.name, x.bytes.length); });
      if (z.skipped) toast(f.name + ': ' + z.files.length + '개를 꺼냈고 ' + z.skipped + '개는 건너뛰었습니다(개수 · 크기 한도나 암호).');
    }).catch(function () { drop_(tmp); toast(f.name + ': ZIP을 열지 못했습니다.'); });
  }
  function drop_(it) { items = items.filter(function (x) { return x !== it; }); if (it.el) it.el.remove(); if (it.thumb) URL.revokeObjectURL(it.thumb); if (it.thumbOut) URL.revokeObjectURL(it.thumbOut); }
  function toast(msg) {
    var n = document.createElement('p'); n.className = 'au-toast'; n.setAttribute('role', 'status'); n.textContent = msg;
    list.parentNode.insertBefore(n, list); setTimeout(function () { n.remove(); }, 7000);
  }

  /* ---------- 이 브라우저에서 기록 읽기(두 개씩) ---------- */
  var readQ = [], reading = 0;
  function pumpRead() {
    while (reading < 2 && readQ.length) {
      (function (it) {
        reading++;
        AIM.inspectFile(it.src).then(function (r) {
          if (!itemAlive(it)) return;
          it.bytes = r.bytes; it.rep = r.report; it.features = r.features; it.pack = r.pack; it.fmt = it.rep.format; it.kind = it.rep.kind;
          if (it.kind === 'image' && /^(jpeg|png|webp|gif|avif)$/.test(it.fmt)) it.thumb = URL.createObjectURL(new Blob([it.bytes], { type: MIME[it.fmt] }));
          it.state = 'wait'; aq.push(it); paint(it); pumpA();
        }).catch(function () { fail(it, '이 파일을 읽지 못했습니다.'); })
          .then(function () { reading--; pumpRead(); refresh(); });
      })(readQ.shift());
    }
  }
  function itemAlive(it) { return items.indexOf(it) >= 0; }

  /* ---------- 서버 일괄 판정(20개씩, 읽는 동안은 모아서) ---------- */
  var aq = [], aBusy = false, aTimer = 0, batchOk = true;
  function pumpA() {
    if (aBusy || !aq.length) return;
    var stillReading = items.some(function (x) { return x.state === 'read'; });
    if (aq.length < BATCH && stillReading) { clearTimeout(aTimer); aTimer = setTimeout(pumpA, 500); return; }
    var chunk = aq.splice(0, BATCH).filter(itemAlive); if (!chunk.length) { pumpA(); return; }
    aBusy = true; chunk.forEach(function (it) { it.state = 'check'; paint(it); }); refresh();
    var job = batchOk ? AM.call('am.analyzebatch', { items: chunk.map(function (it) { var o = { ref: String(it.id), features: it.features }; if (it.pack) o.pack = it.pack; return o; }), cid: cid() }, 180000).then(function (r) {
      if (r && !r.ok && r.code === 'KEY') { batchOk = false; return one(chunk); }
      if (!r || !r.ok) throw r || {};
      return Promise.all(r.results.map(function (res) {
        var it = byId(res.ref); if (!it) return null;
        if (res.ok) { applyA(it, res); return null; }
        if (res.code === 'PACK_BUDGET' || res.code === 'TIME') return one([it]);
        fail(it, res.msg || '확인하지 못했습니다.', true); return null;
      }));
    }) : one(chunk);
    job.catch(function (e) { chunk.forEach(function (it) { if (it.state === 'check') fail(it, errMsg(e, '서버 확인이 늦어지고 있습니다. [다시 확인]을 눌러 주세요.'), true); }); })
      .then(function () { aBusy = false; refresh(); pumpA(); });
  }
  function one(arr) {
    return arr.reduce(function (p, it) {
      return p.then(function () {
        var b = { features: it.features, cid: cid() }; if (it.pack) b.pack = it.pack;
        return AM.call('am.analyze', b, 90000).then(function (r) { if (!r || !r.ok) throw r || {}; applyA(it, r); })
          .catch(function (e) { fail(it, errMsg(e, '서버 확인이 늦어지고 있습니다. [다시 확인]을 눌러 주세요.'), true); });
      });
    }, Promise.resolve());
  }
  function byId(ref) { var id = +ref; return items.filter(function (x) { return x.id === id; })[0] || null; }
  function applyA(it, A) {
    if (!itemAlive(it)) return;
    var v = A.verdict; it.A = A; it.err = '';
    if (v.ai === 'used') { it.allowed = v.allowed.slice(); it.auto = v.suggest; it.need = false; if (!it.label || it.allowed.indexOf(it.label) < 0) it.label = v.suggest; }
    else if (v.ai === 'not_used') { it.allowed = ['no_ai']; it.auto = 'no_ai'; it.need = false; it.label = 'no_ai'; }
    else { it.allowed = LABELS.slice(); it.auto = ''; it.need = true; it.label = it.mine || ans || ''; }
    it.state = 'ready'; paint(it);
  }
  function fail(it, msg, retry) { if (!itemAlive(it)) return; it.state = 'err'; it.err = msg; it.retry = !!retry; paint(it); refresh(); }

  /* ---------- 줄(파일 하나) ---------- */
  var ST = { unzip: ['ZIP 여는 중', 'wait'], read: ['기록 읽는 중', 'wait'], wait: ['확인 대기', 'wait'], check: ['서명 · 기록 확인 중', 'wait'], ready: ['준비됨', 'go'], ask: ['답 필요', 'ask'], issue: ['발급 중', 'wait'], stamp: ['넣는 중', 'wait'], done: ['완료', 'ok'], confirm: ['확인 필요', 'ask'], conflict: ['표시 다시 고르기', 'ask'], err: ['확인 못 함', 'err'] };
  function mount(it) {
    var el = document.createElement('article'); el.className = 'au-row'; el.setAttribute('data-id', it.id);
    it.el = el; list.appendChild(el); paint(it);
  }
  function why(it) {
    var A = it.A, r = it.rep;
    if (it.state === 'err') return it.err || '';
    if (it.state === 'confirm' || it.state === 'conflict') return it.msg || '';
    if (!A) return r ? (r.kind === 'doc' && r.doc && r.doc.name ? r.doc.name : '') : '';
    var v = A.verdict;
    if (v.ai !== 'unknown') return A.summary || '';
    if (r && r.kind === 'doc') return (r.parts && r.parts.length ? '문서 안 이미지 ' + r.parts.length + '개까지 확인했지만 AI 기록이 없습니다. ' : '') + '문서 파일은 원래 AI 기록을 담지 않습니다.';
    if (A.signals && A.signals.some(function (s) { return s.id === 'mark.embedded'; })) return '이미 들어 있는 AIMarker 마크가 있습니다(발급자 신고). 같은 답이면 그 마크로 이어집니다.';
    var cap = (A.signals || []).filter(function (s) { return s.dir === 'cap'; })[0];
    if (cap) return cap.text + ' 촬영 원본으로 확정하지 못해 한 번 묻습니다.';
    if (r && r.stripped) return '기록이 없습니다. 캡처 · 전송 · 업로드 중 지워졌을 수 있습니다.';
    return 'AI 사용을 판단할 기록이 없습니다.';
  }
  function labelCtl(it) {
    if (it.state === 'done' && it.R) return MK.badge({ id: it.R.id, label: it.R.label, basis: it.R.basis });
    if (!it.A || it.state === 'issue' || it.state === 'stamp') return it.label ? '<span class="au-lb">' + esc(MK.LABEL[it.label]) + '</span>' : '';
    var opts = (it.need ? ['<option value="">답 필요</option>'] : []).concat(it.allowed.map(function (l) { return '<option value="' + l + '"' + (it.label === l ? ' selected' : '') + '>' + esc(MK.LABEL[l]) + (l === it.auto ? ' · 근거' : '') + '</option>'; }));
    var g = it.need ? 1 : MK.GRADE[it.A.verdict.basis] || 1;
    return '<span class="au-sel' + (it.need && !it.label ? ' is-need' : '') + '" data-g="' + g + '">' + MK.bars(it.need ? 'declared' : it.A.verdict.basis) + '<select data-f="label" aria-label="' + esc(it.name) + ' 표시"' + (busy ? ' disabled' : '') + '>' + opts.join('') + '</select></span>';
  }
  function extra(it) {
    if (it.state === 'err') return it.retry ? '<div class="au-act"><button type="button" class="btn btn-g btn-s" data-act="retry">다시 확인</button></div>' : '';
    if (it.state === 'confirm') return '<div class="au-act"><button type="button" class="btn btn-p btn-s" data-act="confirm">' + (it.label === 'no_ai' ? 'AI 미사용이 맞아요' : '이 표시로 넣기') + '</button>' + (it.related ? '<a class="btn btn-g btn-s" href="' + esc(MK.markUrl(it.related)) + '" target="_blank" rel="noopener">관련 마크 보기</a>' : '') + (it.label === 'no_ai' ? '<button type="button" class="btn btn-g btn-s" data-act="toai">AI 마크로 바꾸기</button>' : '') + '</div>';
    if (it.state === 'conflict') return '<div class="au-act"><button type="button" class="btn btn-p btn-s" data-act="reissue">고른 표시로 다시 넣기</button></div>';
    if (it.state === 'done' && it.out) {
      var where = it.out.kind === 'embed' ? (IMG[it.fmt] ? (it.out.vis ? '화면 마크 · 파일 속 정보' : '파일 속 정보') : '문서 속성' + (it.out.notice ? ' · 표시 문장' : '')) : '기록 파일(.xmp) · 마크 카드';
      return '<div class="au-act au-got"><span>' + esc(where) + (it.R.again ? ' · 이미 있던 마크에 이어 넣음' : it.out.alt === false ? ' · 표시본 등록 못 함' : it.out.alt ? ' · 표시본 등록' : '') + (it.out.why ? ' · ' + esc(it.out.why) : '') + '</span><button type="button" class="btn btn-g btn-s" data-act="one">' + MK.esc(it.out.kind === 'embed' ? '이 파일 받기' : '기록 파일 받기') + '</button><a class="btn btn-t btn-s" href="' + esc(MK.markUrl(it.R.id)) + '" target="_blank" rel="noopener">마크 보기</a></div>';
    }
    return '';
  }
  function paint(it) {
    if (!it.el) return;
    var st = it.state === 'ready' && it.need && !it.label ? ST.ask : ST[it.state] || ['', ''];
    var meta = [it.kind ? MK.KIND[it.kind] || '파일' : '', it.fmt && it.fmt !== 'other' ? String(it.fmt).toUpperCase() : '', it.rep && it.rep.w ? it.rep.w + '×' + it.rep.h : '', MK.bytes(it.size)].filter(Boolean).join(' · ');
    var src = it.thumbOut || it.thumb, th = src ? '<img src="' + src + '" alt="" onerror="this.remove()">' : '<span class="au-th-ic">' + esc(String(it.fmt || (it.state === 'unzip' ? 'ZIP' : '…')).slice(0, 4).toUpperCase()) + '</span>';
    it.el.className = 'au-row is-' + it.state + (it.need && !it.label && it.state === 'ready' ? ' is-need' : '') + (it.thumbOut ? ' is-stamped' : '');
    it.el.innerHTML = '<div class="au-th">' + th + '</div>' +
      '<div class="au-fn"><b title="' + esc(it.name) + '">' + esc(it.name) + '</b><span>' + esc(meta) + '</span><small>' + esc(why(it)) + '</small></div>' +
      '<div class="au-lab">' + labelCtl(it) + '</div>' +
      '<span class="au-st is-' + st[1] + '">' + (st[1] === 'wait' ? '<i class="au-spin" aria-hidden="true"></i>' : '') + esc(st[0]) + '</span>' +
      '<button type="button" class="au-x" data-act="remove" aria-label="' + esc(it.name) + ' 빼기"' + (busy ? ' disabled' : '') + '>×</button>' + extra(it);
  }
  list.addEventListener('change', function (e) {
    var it = rowOf(e.target); if (!it || e.target.getAttribute('data-f') !== 'label') return;
    it.label = e.target.value; it.mine = it.need ? it.label : ''; if (it.state === 'conflict') it.msg = '';
    paint(it); refresh(); preview();
  });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var it = rowOf(b); if (!it) return;
    var act = b.getAttribute('data-act');
    if (act === 'remove') { if (busy) return; if (it.R && it.key && !zipSaved && !window.confirm('이 파일의 관리 키를 아직 받지 않았습니다. 빼면 다시 볼 수 없습니다. 뺄까요?')) return; aq = aq.filter(function (x) { return x !== it; }); readQ = readQ.filter(function (x) { return x !== it; }); drop_(it); refresh(); preview(); }
    else if (act === 'retry') { it.err = ''; if (it.features) { it.state = 'wait'; aq.push(it); paint(it); pumpA(); } else { it.state = 'read'; readQ.push(it); paint(it); pumpRead(); } }
    else if (act === 'confirm') afterRun(issueOne(it, true));
    else if (act === 'toai') { it.label = it.relatedLabel && it.relatedLabel !== 'no_ai' ? it.relatedLabel : 'ai_generated'; it.mine = it.label; afterRun(issueOne(it, false)); }
    else if (act === 'reissue') { if (!it.label || (it.allowed && it.allowed.indexOf(it.label) < 0)) { toast('표시를 다시 골라 주세요.'); return; } afterRun(issueOne(it, false)); }
    else if (act === 'one') saveOne(it);
  });
  function rowOf(el) { var r = el.closest('.au-row'); return r ? byId(r.getAttribute('data-id')) : null; }

  /* ---------- 한 번 묻기 ---------- */
  askBox.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ans]'); if (!b) return;
    ans = b.getAttribute('data-ans');
    items.forEach(function (it) { if (it.need && !it.mine && it.state === 'ready') { it.label = ans; paint(it); } });
    Array.prototype.forEach.call(askBox.querySelectorAll('[data-ans]'), function (x) { x.classList.toggle('on', x === b); });
    refresh(); preview();
  });

  /* ---------- 단계 · 버튼 ---------- */
  function counts() {
    var c = { all: items.length, reading: 0, ready: 0, need: 0, done: 0, todo: 0, err: 0, hold: 0 };
    items.forEach(function (it) {
      if (it.state === 'read' || it.state === 'wait' || it.state === 'check' || it.state === 'unzip') c.reading++;
      else if (it.state === 'ready') { c.ready++; if (it.need && !it.label) c.need++; else c.todo++; }
      else if (it.state === 'done') c.done++;
      else if (it.state === 'err') c.err++;
      else if (it.state === 'confirm' || it.state === 'conflict') c.hold++;
    });
    return c;
  }
  function rail(c) {
    var s = { add: c.all ? 'done' : 'on', check: !c.all ? '' : c.reading ? 'on' : 'done', decide: !c.all || c.reading ? '' : c.need ? 'on' : (c.ready || c.done || c.hold ? 'done' : ''), stamp: busy ? 'on' : c.done && !c.todo ? 'done' : '', get: runStats ? (zipSaved ? 'done' : 'on') : '' };
    Array.prototype.forEach.call(box.querySelectorAll('.au-rail li'), function (li) { li.className = s[li.getAttribute('data-s')] ? 'is-' + s[li.getAttribute('data-s')] : ''; });
  }
  function refresh() {
    var c = counts(), agree = F.agree.checked, needN = items.filter(function (it) { return it.state === 'ready' && it.need; }).length;
    drop.classList.toggle('is-compact', c.all > 0);
    askBox.hidden = !needN || busy;
    if (needN) $('#auAskT').textContent = '기록이 없는 파일 ' + needN + '개, AI를 사용했나요?';
    var msg = '', can = false;
    if (busy) msg = '넣는 중입니다' + (prog ? ' · ' + prog.n + ' / ' + prog.total : '') + ' · 창을 닫지 마세요.';
    else if (!c.all) msg = '파일을 넣으면 시작할 수 있습니다.';
    else if (c.reading) msg = '기록을 확인하는 중입니다 · ' + (c.all - c.reading) + ' / ' + c.all;
    else if (c.need) msg = '기록이 없는 파일 ' + c.need + '개에 답해 주세요.';
    else if (!c.todo) msg = c.done ? '모두 넣었습니다. 아래에서 받으세요.' : c.hold ? '확인이 필요한 파일을 처리해 주세요.' : '마크를 넣을 파일이 없습니다.';
    else if (!agree) msg = '표시 내용 확인란에 체크해 주세요.';
    else { msg = c.todo + '개 파일에 표시를 넣습니다. 파일은 서버로 가지 않습니다.'; can = true; }
    goBtn.disabled = !can; hint.textContent = msg;
    $('#auGoT').textContent = busy ? '넣는 중' : '자동 마킹 시작' + (c.todo && !c.reading ? ' · ' + c.todo + '개' : '');
    bar.hidden = !c.all || $('#paneFile').hidden;
    $('#auBarT').textContent = msg; $('#auGo2').disabled = busy || !c.todo || c.reading > 0 || c.need > 0;
    rail(c);
  }
  F.agree.addEventListener('change', refresh);
  goBtn.addEventListener('click', run);
  $('#auGo2').addEventListener('click', function () {
    if (!F.agree.checked) { F.agree.closest('label').scrollIntoView({ behavior: 'smooth', block: 'center' }); F.agree.focus(); F.agree.closest('label').classList.add('flash'); setTimeout(function () { F.agree.closest('label').classList.remove('flash'); }, 1500); return; }
    run();
  });

  /* ---------- 마크 넣기 ---------- */
  function tools() { return String(O.tools || '').split(/[,·\n]/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6); }
  function body(it, confirm) {
    var b = { ref: String(it.id), features: it.features, label: it.label, tools: tools(), title: baseName(it.name).slice(0, 80) };
    if (it.pack) b.pack = it.pack; if (confirm) b.confirm = true;
    return b;
  }
  function getAdLabels() {
    if (!(O.ad || O.person)) return Promise.resolve([]);
    if (adLabels) return Promise.resolve(adLabels);
    var kinds = (O.ad ? ['sponsor'] : []).concat(O.person ? ['person'] : []);
    return Promise.all(kinds.map(function (k) { return AM.call('am.label', { kind: k, cid: cid() }, 20000).then(function (r) { return r && r.ok ? { kind: k, text: r.text, long: r.long } : null; }).catch(function () { return null; }); }))
      .then(function (a) { var got = a.filter(Boolean); if (got.length === kinds.length) adLabels = got; return got.length ? got : kinds.map(function (k) { return { kind: k, text: k === 'sponsor' ? '광고' : '가상인물', long: '' }; }); });
  }
  function tags(labels) { return (labels || []).filter(function (l) { return (l.kind === 'sponsor' && O.ad) || (l.kind === 'person' && O.person); }).map(function (l) { return l.text; }); }
  function run() {
    if (busy) return;
    var todo = items.filter(function (it) { return it.state === 'ready' && it.label; });
    if (!todo.length || !F.agree.checked) { refresh(); return; }
    busy = true; zipSaved = false; runStats = null; prog = { total: todo.length, n: 0 }; doneBox.hidden = true;
    todo.forEach(function (it) { it.state = 'issue'; paint(it); }); refresh();
    var labelsP = getAdLabels();
    var chunks = []; for (var i = 0; i < todo.length; i += BATCH) chunks.push(todo.slice(i, i + BATCH));
    var p = chunks.reduce(function (q, ch) { return q.then(function () { return issueBatch(ch); }); }, Promise.resolve())
      .then(function () { return labelsP; })
      .then(function (labels) {
        var issued = todo.filter(function (it) { return it.state === 'stamp'; });
        return issued.reduce(function (q, it) { return q.then(function () { return stamp(it, labels).then(function () { if (prog) prog.n++; refresh(); }); }); }, Promise.resolve()).then(function () { return register(issued); });
      });
    afterRun(p);
  }
  function afterRun(p) {
    busy = true; refresh();
    return Promise.resolve(p).catch(function () { /* 줄마다 처리함 */ }).then(function () {
      busy = false; prog = null;
      var done = items.filter(function (it) { return it.state === 'done'; });
      runStats = done.length ? summary(done) : null;
      showDone(); refresh(); preview();
      items.forEach(paint);
    });
  }
  function issueBatch(ch) {
    var req = { items: ch.map(function (it) { return body(it, it.confirmed); }), issuer: O.brand, cid: cid() };
    return AM.call('am.markbatch', req, 240000).then(function (r) {
      if (r && !r.ok && r.code === 'KEY') return ch.reduce(function (q, it) { return q.then(function () { return issueOne(it, it.confirmed, true); }); }, Promise.resolve());
      if (!r || !r.ok) throw r || {};
      r.results.forEach(function (res) { var it = byId(res.ref); if (it) took(it, res); });
    }).catch(function (e) { ch.forEach(function (it) { if (it.state === 'issue') { it.state = 'err'; it.err = errMsg(e, '발급하지 못했습니다. 잠시 뒤 다시 시도해 주세요.'); it.retry = false; paint(it); } }); });
  }
  function issueOne(it, confirm, inRun) {
    it.state = 'issue'; it.confirmed = !!confirm; paint(it);
    var b = body(it, confirm); delete b.ref; b.issuer = O.brand; b.cid = cid();
    var p = AM.call('am.mark', b, 90000).then(function (r) { took(it, r || {}); })
      .catch(function (e) { it.state = 'err'; it.err = errMsg(e, '발급하지 못했습니다.'); paint(it); });
    if (inRun) return p;
    return p.then(function () { return getAdLabels(); }).then(function (labels) { if (it.state !== 'stamp') return null; return stamp(it, labels).then(function () { return register([it]); }); });
  }
  function took(it, res) {
    if (res.ok && res.id) { it.R = res; it.key = res.key || ''; it.state = 'stamp'; it.msg = ''; paint(it); return; }
    var msg = String(res.message || res.msg || '발급하지 못했습니다.').replace(/\s*\(confirm: true\)/g, '');
    if (res.code === 'CONFIRM') { it.state = 'confirm'; it.msg = msg; it.related = res.related || ''; it.relatedLabel = ''; var s = (it.A && it.A.signals || []).filter(function (x) { return x.mark === res.related; })[0]; if (s && s.ai) it.relatedLabel = s.ai; }
    else if (res.code === 'CONFLICT') { it.state = 'conflict'; it.msg = msg; if (res.allowed) { it.allowed = res.allowed; if (it.allowed.indexOf(it.label) < 0) it.label = res.suggest && it.allowed.indexOf(res.suggest) >= 0 ? res.suggest : it.allowed[0]; } }
    else { it.state = 'err'; it.err = msg; it.retry = false; }
    paint(it);
  }
  function seoItem(it) {
    var out = it.out || {}, R = it.R;
    return { id: R.id, label: R.label, basis: R.basis, kind: it.kind, name: it.name, file: it.zipName || it.name, mime: MIME[it.fmt] || '', w: it.rep && it.rep.w, h: it.rep && it.rep.h, title: baseName(it.name), tools: R.tools || [], out: out.kind };
  }
  /* 꾸러미 안 이름: 같은 이름이 둘이면 '이름 (2).jpg' (검색 꾸러미 · 관리 키 목록과 같은 이름) */
  function zipNames(done) {
    var used = {};
    done.forEach(function (it) {
      var n = it.name, k = n.toLowerCase(), i = 2, b = baseName(n), e = n.slice(b.length);
      while (used[k]) { n = b + ' (' + (i++) + ')' + e; k = n.toLowerCase(); }
      used[k] = 1; it.zipName = n;
    });
  }
  function stamp(it, labels) {
    var R = it.R, m = seoItem(it), fields = SEO.xmpFields(m, O);
    var xmp = AIM.buildXmp({ dst: fields.dst, aiSystem: fields.aiSystem, title: fields.title, desc: fields.desc, alt: fields.alt, creator: fields.creator, credit: fields.credit, rights: fields.rights, id: R.id, url: MK.markUrl(R.id), label: R.label, basis: R.basis, cred: R.cred || '' });
    var job;
    if (IMG[it.fmt]) {
      var vis = O.vis && R.label !== 'no_ai', mime = IMG[it.fmt];
      job = (vis ? MK.fontsReady().then(function () { return MK.loadImage(new Blob([it.bytes], { type: mime })); }).then(function (img) {
        var c = MK.stamp(img, { id: R.id, label: R.label, basis: R.basis }, { pos: O.pos, size: O.size, qr: O.qr, tags: tags(labels), flat: it.fmt === 'jpeg' });
        return MK.canvasBlob(c, mime, 0.92);
      }).then(function (b) { if (!b) throw new Error('encode'); return b.arrayBuffer(); }).then(function (ab) { return new Uint8Array(ab); }) : Promise.resolve(it.bytes))
        .then(function (u8) { var out = AIM.embedXmp(u8, xmp); it.out = { kind: 'embed', name: it.name, bytes: out, vis: vis, mime: mime }; if (vis) it.thumbOut = URL.createObjectURL(new Blob([out], { type: mime })); });
    } else if (OFFICE[it.fmt]) {
      job = AIM.embedOffice(it.bytes, { id: R.id, url: MK.markUrl(R.id), label: R.label, basis: R.basis, labelKo: MK.LABEL[R.label], basisKo: MK.BASIS[R.basis], notice: O.notice, text: SEO.notice(m) })
        .then(function (r) { it.out = { kind: 'embed', name: it.name, bytes: r.bytes, notice: r.notice, mime: MIME[it.fmt] }; })
        .catch(function (e) { it.out = { kind: 'sidecar', name: it.name, xmp: xmp, why: e && e.message === 'SIGNED' ? '전자서명된 문서라 고치지 않았습니다' : '' }; });
    } else job = Promise.resolve().then(function () { it.out = { kind: 'sidecar', name: it.name, xmp: xmp }; });
    return job.catch(function () { it.out = { kind: 'sidecar', name: it.name, xmp: xmp }; }).then(function () {
      it.state = 'done'; it.bytes = it.out.kind === 'embed' ? null : it.bytes;   // 원본은 표시본을 만든 뒤 놓아 줌(기록 파일만 남는 형식은 원본을 고치지 않음)
      return it.out.kind === 'embed' ? MK.sha256(it.out.bytes).then(function (h) { it.out.sha = h; }) : null;
    }).then(function () { paint(it); });
  }
  /* 표시를 넣은 파일(표시본) 해시를 마크에 한 번에 등록: 이 파일을 다시 확인하면 같은 마크로 이어짐 */
  function register(arr) {
    var todo = arr.filter(function (it) { return it.state === 'done' && it.key && it.out && it.out.sha; });
    var chunks = []; for (var i = 0; i < todo.length; i += BATCH) chunks.push(todo.slice(i, i + BATCH));
    return chunks.reduce(function (q, ch) {
      return q.then(function () {
        return AM.call('am.markalt', { items: ch.map(function (it) { return { ref: String(it.id), id: it.R.id, key: it.key, alt: [it.out.sha] }; }), cid: cid() }, 90000).then(function (r) {
          (r && r.results || []).forEach(function (x) { var it = byId(x.ref); if (it) { it.out.alt = !!x.ok; paint(it); } });
        }).catch(function () { ch.forEach(function (it) { it.out.alt = false; paint(it); }); });
      });
    }, Promise.resolve()).then(function () { arr.forEach(function (it) { if (it.state === 'done' && it.out && it.out.sha && it.out.alt == null && !it.key && !it.R.again) it.out.alt = false; paint(it); }); });
  }
  function summary(done) {
    var by = {}; done.forEach(function (it) { by[it.R.label] = (by[it.R.label] || 0) + 1; });
    return { total: done.length, by: by, embed: done.filter(function (it) { return it.out && it.out.kind === 'embed'; }).length, vis: done.filter(function (it) { return it.out && it.out.vis; }).length, docs: done.filter(function (it) { return it.out && it.out.kind === 'embed' && !IMG[it.fmt]; }).length };
  }
  function showDone() {
    if (!runStats) { doneBox.hidden = true; return; }
    var s = runStats, hold = items.filter(function (it) { return it.state === 'confirm' || it.state === 'conflict'; }).length;
    $('#auDoneT').textContent = s.total + '개 파일에 표시를 넣었습니다';
    $('#auDoneS').textContent = LABELS.filter(function (l) { return s.by[l]; }).map(function (l) { return MK.LABEL[l] + ' ' + s.by[l]; }).join(' · ') + (hold ? ' · 확인 필요 ' + hold : '');
    $('#auD1').textContent = s.vis ? '이미지 ' + s.vis + '개 위에 보이는 마크' + (O.ad || O.person ? '와 광고 표시' : '') : '보이는 마크 없음(설정에서 끔 또는 AI 미사용)';
    $('#auD2').textContent = '표시본 ' + s.embed + '개(이미지 정보 · 문서 속성' + (s.docs ? ' · 표시 문장' : '') + '), 나머지는 기록 파일';
    doneBox.hidden = false;
  }

  /* ---------- 받기 ---------- */
  function cardFile(it) { return MK.cardPng({ id: it.R.id, label: it.R.label, basis: it.R.basis, at: it.R.at }).then(function (b) { return b.arrayBuffer(); }).then(function (ab) { return new Uint8Array(ab); }); }
  function rows(done) {
    return [['파일', '종류', '표시', '근거', '마크 번호', '관리 키', '확인 주소', '넣은 곳']].concat(done.map(function (it) {
      var o = it.out || {};
      return [it.zipName || it.name, MK.KIND[it.kind] || '', MK.LABEL[it.R.label], MK.BASIS[it.R.basis], it.R.id, it.key || '(이미 있던 마크라 키 없음)', MK.markUrl(it.R.id), o.kind === 'embed' ? (IMG[it.fmt] ? (o.vis ? '화면 마크 · 파일 속 정보' : '파일 속 정보') : '문서 속성' + (o.notice ? ' · 표시 문장' : '')) : '기록 파일'];
    }));
  }
  function saveZip(btn) {
    var done = items.filter(function (it) { return it.state === 'done' && it.R; }); if (!done.length) return;
    var day = today(), root = 'AIMarker 자동 마킹 ' + day + '/', files = [];
    zipNames(done);
    btn.disabled = true; var lab = btn.querySelector('span'), old = lab.textContent; lab.textContent = '묶는 중…';
    getAdLabels().then(function (labels) {
      done.forEach(function (it) { if (it.out.kind === 'embed') files.push({ name: root + '표시본/' + it.zipName, data: it.out.bytes }); else files.push({ name: root + '기록 파일/' + it.zipName + '.xmp', data: it.out.xmp }); });
      return done.filter(function (it) { return it.out.kind !== 'embed'; }).reduce(function (q, it) { return q.then(function () { return cardFile(it).then(function (u8) { files.push({ name: root + '기록 파일/' + baseName(it.zipName) + ' 마크 카드.png', data: u8 }); }).catch(function () { /* 카드는 빼고 */ }); }); }, Promise.resolve()).then(function () {
        var M = done.map(seoItem);
        files.push({ name: root + '검색 · AI 검색/삽입 코드.html', data: SEO.snippets(M, O) });
        files.push({ name: root + '검색 · AI 검색/구조화 데이터.json', data: JSON.stringify(SEO.jsonld(M, O), null, 2) + '\n' });
        if (M.some(function (m) { return m.kind === 'image'; })) files.push({ name: root + '검색 · AI 검색/이미지 사이트맵.xml', data: SEO.sitemap(M, O) });
        files.push({ name: root + '검색 · AI 검색/llms 항목.md', data: SEO.llms(M, O) });
        files.push({ name: root + '검색 · AI 검색/AI 사용 안내.html', data: SEO.noticePage(M, { brand: O.brand, rights: O.rights, base: O.base, date: day }) });
        if (labels && labels.length) files.push({ name: root + '광고 표시.txt', data: SEO.adText(labels) });
        files.push({ name: root + '마크 목록 · 관리 키.csv', data: SEO.csv(rows(done)) });
        files.push({ name: root + '읽어 주세요.txt', data: SEO.readme({ date: day, ad: !!(labels && labels.length), counts: { embedded: done.filter(function (it) { return it.out.kind === 'embed'; }).length, sidecar: done.filter(function (it) { return it.out.kind !== 'embed'; }).length, marks: done.length } }) });
        return AIM.zipBuild(files);
      });
    }).then(function (parts) {
      MK.save(new Blob(parts, { type: 'application/zip' }), 'aimarker-automark-' + day + '.zip');
      zipSaved = true; refresh();
    }).catch(function () { toast('ZIP을 만들지 못했습니다. 파일을 하나씩 받아 주세요.'); })
      .then(function () { btn.disabled = false; lab.textContent = old; });
  }
  function saveOne(it) {
    if (!it.out) return;
    if (it.out.kind === 'embed') { MK.save(new Blob([it.out.bytes], { type: it.out.mime || 'application/octet-stream' }), it.out.name); return; }
    MK.save(new Blob([it.out.xmp], { type: 'application/rdf+xml' }), it.name + '.xmp');
  }
  $('#auZip').addEventListener('click', function () { saveZip(this); });
  $('#auCsv').addEventListener('click', function () {
    var done = items.filter(function (it) { return it.state === 'done' && it.R; }); if (!done.length) return;
    zipNames(done);
    MK.save(new Blob([SEO.csv(rows(done))], { type: 'text/csv;charset=utf-8' }), 'aimarker-marks-' + today() + '.csv'); zipSaved = true; refresh();
  });
  $('#auNew').addEventListener('click', function () {
    if (items.some(function (it) { return it.key; }) && !zipSaved && !window.confirm('아직 받지 않은 관리 키가 있습니다. 새로 하면 다시 볼 수 없습니다. 새로 할까요?')) return;
    items.slice().forEach(drop_); items = []; aq = []; readQ = []; runStats = null; ans = ''; zipSaved = false; doneBox.hidden = true;
    Array.prototype.forEach.call(askBox.querySelectorAll('[data-ans]'), function (x) { x.classList.remove('on'); });
    refresh(); preview(); box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  window.addEventListener('beforeunload', function (e) { if (busy || (items.some(function (it) { return it.key; }) && !zipSaved)) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- 미리보기 ---------- */
  var pv = $('#auPv'), pvImg = null, pvSrc = '', pvT = 0;
  function preview() {
    clearTimeout(pvT);
    pvT = setTimeout(function () {
      var it = items.filter(function (x) { return x.kind === 'image' && (x.thumbOut || x.thumb) && IMG[x.fmt]; })[0];
      var src = it ? it.thumb : '', lab = it && it.R ? it.R.label : it && it.label && it.label !== 'no_ai' ? it.label : 'ai_generated';
      var m = { id: it && it.R ? it.R.id : 'AM-7Q2K9MXR4T', label: lab, basis: it && it.R ? it.R.basis : it && it.A && !it.need ? it.A.verdict.basis : 'declared' };
      var draw = function () { MK.fontsReady().then(function () { MK.preview(pv, pvImg, m, { visible: O.vis, pos: O.pos, size: O.size, qr: O.qr, tags: tags(adLabels || [{ kind: 'sponsor', text: '광고' }, { kind: 'person', text: '가상인물' }]) }); }); };
      $('#auPvCap').textContent = (it ? it.name : '견본 이미지') + ' · 미리보기' + (O.vis ? '' : '(보이는 마크 끔)');
      if (src && src !== pvSrc) { pvSrc = src; var im = new Image(); im.onload = function () { pvImg = im; draw(); }; im.onerror = function () { pvImg = null; draw(); }; im.src = src; }
      else { if (!src) { pvImg = null; pvSrc = ''; } draw(); }
    }, 60);
  }
  window.addEventListener('resize', preview);
  preview();

  /* ---------- 넣기 이벤트 ---------- */
  input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { if (!e.target.closest || !e.target.closest('#auDrop')) { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { selTab(0); addFiles(e.dataTransfer.files); } } });

  /* ---------- 광고 · 글 ---------- */
  var tText = $('#tText'), tOut = $('#tOut'), tGo = $('#tGo'), tHint = $('#tHint'), tLast = null;
  tText.addEventListener('input', function () { $('#tCount').textContent = tText.value.length.toLocaleString('ko-KR'); });
  function tAns() { var r = box.querySelector('input[name="tAns"]:checked'); return r ? r.value : ''; }
  function tBusy(on) { tGo.disabled = on; tGo.querySelector('span').textContent = on ? '고치고 표시 붙이는 중…' : '자동으로 고치고 표시 붙이기'; }
  tGo.addEventListener('click', function () { textRun(false); });
  function textRun(confirm) {
    var text = tText.value, label = tAns();
    if (!text.replace(/\s+/g, '')) { tText.focus(); tHint.textContent = '올릴 글을 넣어 주세요.'; return; }
    if (!label) { tHint.textContent = '이 글에 AI를 사용했는지 골라 주세요. 글은 기술로 단정할 수 없어 고른 답으로 표시합니다.'; box.querySelector('input[name="tAns"]').focus(); return; }
    var flags = { sponsored: $('#tAd').checked, aiPerson: $('#tPerson').checked, aiMedia: $('#tMedia').checked };
    tBusy(true); tHint.textContent = '한국 광고 규칙 팩으로 점검하고 고치는 중입니다.';
    var fixed = '', auto = null;
    var step1 = confirm && tLast ? Promise.resolve(tLast.auto) : AM.call('am.auto', { text: text, flags: flags, strict: true, cid: cid() }, 40000).then(function (r) { if (!r || !r.ok) throw r || {}; return r; });
    step1.then(function (r) {
      auto = r; fixed = String(r.text || text).replace(/\s+$/, '');
      return AIM.textFeatures(fixed).then(function (f) { var b = { features: f, label: label, issuer: O.brand, cid: cid() }; if (confirm) b.confirm = true; return AM.call('am.mark', b, 60000); });
    }).then(function (m) {
      tLast = { auto: auto, fixed: fixed, label: label };
      if (m && m.code === 'CONFIRM') { paintText(null, String(m.message || m.msg || '').replace(/\s*\(confirm: true\)/g, '')); return; }
      if (!m || !m.ok) throw m || {};
      paintText(m);
    }).catch(function (e) { tOut.hidden = false; tOut.innerHTML = '<div class="au-tx-err"><b>지금은 처리하지 못했어요</b><p>' + esc(errMsg(e, '잠시 뒤 다시 시도해 주세요.')) + '</p></div>'; })
      .then(function () { tBusy(false); tHint.textContent = '글은 기술로 AI 사용을 단정할 수 없어, 고른 답을 \'발급자 신고\'로 표시합니다.'; });
  }
  function paintText(m, confirmMsg) {
    var a = tLast.auto, fixed = tLast.fixed;
    tOut.hidden = false;
    if (confirmMsg) {
      tOut.innerHTML = '<div class="au-tx-err is-ask"><b>한 번 확인해 주세요</b><p>' + esc(confirmMsg) + '</p><div class="row"><button type="button" class="btn btn-p btn-s" id="tYes">AI 미사용이 맞아요</button><button type="button" class="btn btn-g btn-s" id="tNo">답 다시 고르기</button></div></div>';
      $('#tYes').addEventListener('click', function () { textRun(true); });
      $('#tNo').addEventListener('click', function () { tOut.hidden = true; box.querySelector('input[name="tAns"]').focus(); });
      return;
    }
    var line = SEO.sentence(m.label, 'text') + ' (AIMarker 마크 ' + m.id + ' · aimarker.kr/m/?id=' + m.id + ')';
    var final = fixed + '\n\n' + line;
    var applied = (a.applied || []).filter(function (x) { return x.from || x.to; });
    var left = a.left || [];
    var outTxt = { pass: '고칠 표현이 없었습니다', fixed: '위험한 표현을 자동으로 고쳤습니다', 'return': '자동으로 고치지 못한 표현이 남았습니다' }[a.outcome] || '';
    tOut.innerHTML = '<div class="au-tx-res">' +
      '<div class="au-tx-h"><div><b>올릴 글이 준비됐습니다</b><span>' + esc(outTxt) + ' · 표시와 마크를 붙였습니다</span></div>' + MK.badge({ id: m.id, label: m.label, basis: m.basis }) + '</div>' +
      '<pre class="au-final" id="tFinal">' + esc(final) + '</pre>' +
      '<div class="row"><button type="button" class="btn btn-p btn-s" id="tCopy">' + '<span>글 전체 복사</span></button><a class="btn btn-g btn-s" href="' + esc(MK.markUrl(m.id)) + '" target="_blank" rel="noopener">마크 확인 페이지</a></div>' +
      (applied.length ? '<h4>자동으로 바꾼 곳 ' + applied.length + '</h4><ul class="au-chg">' + applied.map(function (x) { return '<li>' + (x.from ? '<s>' + esc(x.from) + '</s> ' : '') + (x.to ? '<em>' + esc(x.to) + '</em>' : '<em class="del">(문장 뺌)</em>') + '</li>'; }).join('') + '</ul>' : '') +
      (left.length ? '<h4>직접 확인할 곳 ' + left.length + '</h4><ul class="au-left">' + left.map(function (f) { return '<li><b>' + esc(f.t || '필수 표시') + '</b><span>' + esc(f.why || '') + '</span>' + (f.tip ? '<small>' + esc(f.tip) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="note">점검 결과는 위험 후보와 근거이며 법률 자문이 아닙니다. 글은 서버에 저장하지 않았고, 마크에는 글의 지문(해시)만 남습니다. 마지막 줄의 표시 문장은 지문에서 빼고 계산하므로 붙인 채로 올려도 같은 마크로 이어집니다.</p></div>';
    $('#tCopy').addEventListener('click', function () { AM.copy ? AM.copy(final, this) : navigator.clipboard.writeText(final); });
    tOut.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (/[?&]tab=text\b/.test(location.search)) selTab(1);
  refresh();
})();
