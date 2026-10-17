/* AIMarker 마크 확인(/m/): 마크 정보 · 전자서명 확인(이 기기에서) · 변경 이력 · 공개 원장 · 파일 대조 (2026.10) */
(function () {
  'use strict';
  var AIM = window.AIMExtract, MK = window.MK, AM = window.AM || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = MK.esc, out = $('#mvOut'), home = $('#mvHome');
  var EV = { issued: '발급', label: '표시 변경', alt: '표시본 등록', title: '콘텐츠 이름 변경', issuer: '발급자 이름 변경', revoked: '철회' };
  function qid() {
    var m = /[?&]id=([A-Za-z0-9\-]+)/.exec(location.search) || /#(AM-[A-Za-z0-9]+)/i.exec(location.hash) || /[?&](AM-[A-Za-z0-9]+)/i.exec(location.search);
    return m ? norm(m[1]) : '';
  }
  function norm(s) { s = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (s.indexOf('AM') === 0) s = s.slice(2); return s.length === 10 ? 'AM-' + s : ''; }
  function ico(path) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  var I_OK = ico('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'), I_X = ico('<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>'), I_I = ico('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>');

  /* ---------- 찾기 ---------- */
  $('#mvFind').addEventListener('submit', function (e) {
    e.preventDefault(); var id = norm($('#mvId').value);
    if (!id) { $('#mvId').setCustomValidity('AM- 로 시작하는 13자리 번호를 넣어 주세요(예: AM-B18SYQ8NCY).'); $('#mvId').reportValidity(); return; }
    $('#mvId').setCustomValidity(''); location.search = '?id=' + id;
  });
  $('#mvId').addEventListener('input', function () { this.setCustomValidity(''); });

  /* ---------- 마크 보기 ---------- */
  var id = qid(), M = null;
  if (id) {
    $('#mvId').value = id; home.hidden = true;
    out.innerHTML = '<div class="mv-card"><p class="note"><i class="mk-spin" aria-hidden="true"></i> 마크 ' + esc(id) + ' 정보를 불러오는 중입니다.</p></div>';
    AM.call('am.markinfo', { id: id }, 45000).then(function (r) {
      if (!r || !r.ok) { out.innerHTML = '<div class="mv-card"><p class="mk-err">' + esc((r && r.message) || '마크를 찾지 못했습니다. 번호를 확인해 주세요.') + '</p></div>'; home.hidden = false; return; }
      M = r; render(r);
    }).catch(function () { out.innerHTML = '<div class="mv-card"><p class="mk-err">서버 응답이 늦습니다. 잠시 뒤 새로 고침해 주세요.</p></div>'; });
  }
  function group(title, n, items, none) { return '<section class="ev ev-' + n + '"><h4><span>' + n + '</span>' + esc(title) + '</h4><ul>' + (items.length ? items.join('') : '<li class="ev-none">' + esc(none) + '</li>') + '</ul></section>'; }
  function li(c, t) { return '<li class="ev-' + c + '">' + esc(t) + '</li>'; }
  function render(r) {
    document.title = (MK.LABEL[r.label] || '마크') + ' · ' + r.id + ' | AIMarker 마크 확인';
    $('#mvTitle').textContent = '마크 ' + r.id;
    $('#mvLead').textContent = (MK.DESC[r.label] || '') + ' ' + (MK.BASIS_DESC[r.basis] || '');
    var g1 = [], g2 = [], g3 = [];
    (r.evidence || []).forEach(function (e) { (e.lv === 'verified' ? g1 : g2).push(li(e.lv === 'verified' ? (e.dir === 'cap' ? 'ok' : 'ai') : e.dir === 'ai' ? 'ai' : e.dir === 'cap' ? 'cap' : 'info', e.t)); });
    if (r.signer) g1.unshift(li('ok', 'C2PA 출처 기록 서명자: ' + r.signer + '(서버에서 서명 · 신뢰 목록 확인)'));
    if (r.basis === 'declared') g3.push(li('info', "발급자가 '" + (MK.LABEL[r.label] || r.label) + "'(으)로 밝혔습니다. AIMarker가 기술로 확인한 내용이 아닙니다."));
    if (r.tools) g3.push(li('info', '사용한 AI 도구: ' + r.tools));
    if (r.issuer) g3.push(li('info', '발급자: ' + r.issuer));
    var facts = [['마크 번호', r.id], ['발급 시각', r.at], ['콘텐츠', (MK.KIND[r.kind] || r.kind) + (r.size ? ' · ' + r.size : '')], ['콘텐츠 이름', r.title || '밝히지 않음'], ['발급자', r.issuer || '밝히지 않음'], ['근거', MK.BASIS[r.basis] || r.basis]];
    var hist = (r.history || []).map(function (h) { return '<li class="' + (h.ev === 'revoked' ? 'rev' : '') + '"><span><b>' + esc(EV[h.ev] || h.ev) + '</b>' + (h.note ? ' · ' + esc(h.note) : '') + '<small>' + esc(h.at) + '</small></span></li>'; }).join('');
    var fp = [['SHA-256(원본)', r.sha256], ['지각 해시(dHash)', r.dhash || '없음'], ['결합 해시(C2PA)', r.bind || '없음'], ['표시본 해시', (r.alts || []).join('\n') || '없음']];
    out.innerHTML = '<div class="mv-wrap"><div class="mv-main">' +
      '<div class="mv-card mv-top"><div>' + MK.badge({ id: r.id, label: r.label, basis: r.basis, status: r.status }, { lg: true }) + '</div>' +
      '<div class="mv-state" id="mvState">' + (r.status === 'revoked' ? '<span class="mv-pill bad">' + I_X + '철회된 마크</span>' : '<span class="mv-pill ok">' + I_OK + '유효한 마크</span>') +
      '<span class="mv-pill" id="mvSig"><i class="mk-spin" aria-hidden="true"></i>전자서명 확인 중</span></div>' +
      '<p class="mv-desc">' + esc(MK.DESC[r.label] || '') + '</p>' +
      '<dl class="mv-facts">' + facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl></div>' +
      '<div class="mk-ev">' + group('기술적으로 검증된 출처 정보', 1, g1, '서명으로 검증된 출처 기록이 없습니다.') + group('자동 분석 결과', 2, g2, '파일 안 AI 생성 · 편집 기록이 없었습니다.') + group('제작자 신고 정보', 3, g3, '발급자가 따로 밝힌 내용이 없습니다.') + '</div>' +
      '<div class="mv-card"><h2 class="mv-h">공개 원장</h2><div id="mvAnchor"><p class="note">원장 ' + esc(r.ledger) + ' 기록을 확인하는 중입니다.</p></div></div>' +
      '<details class="mv-card"><summary class="mv-h" style="cursor:pointer;margin:0">지문 · 서명 자세히</summary><dl class="mv-facts" style="margin-top:14px">' + fp.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd class="mv-mono" style="white-space:pre-line">' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>' +
      (r.cred ? '<p class="note" style="margin-top:12px">AIMarker 전자서명(JWS · Ed25519, 키 ' + esc(r.kid) + ')</p><code class="mv-mono" style="display:block;margin-top:6px;word-break:break-all;font-size:12px">' + esc(r.cred) + '</code><div class="row" style="margin-top:10px"><button class="btn btn-g btn-s" type="button" id="mvCopyCred">서명 복사</button><a class="btn btn-g btn-s" href="' + (document.body.getAttribute('data-root') || '/') + '.well-known/aimarker-keys.json" target="_blank" rel="noopener">공개키 보기</a></div>' : '<p class="note" style="margin-top:12px">이 마크는 전자서명 도입(2026.10.16) 전에 발급되어 서명이 없습니다.</p>') + '</details>' +
      '</div><aside class="mv-side">' +
      '<div class="mv-card mv-check"><h2 class="mv-h">가지고 있는 파일이 이 마크의 파일인가요?</h2><label class="mk-drop" id="mvDrop2" for="mvFile2"><input type="file" id="mvFile2" hidden><span class="mk-drop-ic">' + ico('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>') + '</span><b>파일을 놓아 대조하기</b><span>이 기기에서만 계산합니다</span></label><div id="mvCmp"></div></div>' +
      '<div class="mv-card"><h2 class="mv-h">변경 이력</h2><ul class="mv-hist">' + hist + '</ul></div>' +
      '<div class="mv-card" style="text-align:center">' + MK.qrSvg(MK.markUrl(r.id), 150).replace('class="mk-qr"', 'class="mk-qr" style="margin:0 auto"') + '<p class="note" style="margin-top:8px">이 페이지 주소 QR</p></div>' +
      '</aside></div>';
    bindDrop($('#mvDrop2'), $('#mvFile2'), compare);
    var cc = $('#mvCopyCred'); if (cc) cc.addEventListener('click', function () { AM.copy ? AM.copy(r.cred, cc) : navigator.clipboard.writeText(r.cred); });
    verifySig(r); anchor(r);
  }
  function verifySig(r) {
    var el = $('#mvSig');
    if (!r.cred) { el.className = 'mv-pill'; el.innerHTML = I_I + '서명 도입 전 마크'; return; }
    MK.verify(r.cred).then(function (v) {
      var p = v.payload || {}, same = v.ok && p.sub === r.id && p.label === r.label && p.basis === r.basis && p.sha256 === r.sha256;
      if (same) { el.className = 'mv-pill ok'; el.innerHTML = I_OK + 'AIMarker 전자서명 확인'; el.title = '키 ' + v.kid + ' · 이 기기에서 확인'; }
      else if (v.ok) { el.className = 'mv-pill bad'; el.innerHTML = I_X + '서명 내용과 표시가 다릅니다'; }
      else { el.className = 'mv-pill bad'; el.innerHTML = I_X + (v.reason === 'unknown_key' ? '알 수 없는 서명 키' : '전자서명이 맞지 않습니다'); }
    }).catch(function () { el.className = 'mv-pill warn'; el.innerHTML = I_I + '이 브라우저에서 서명을 확인하지 못했습니다'; });
  }

  /* ---------- 공개 원장 · 타임스탬프 ---------- */
  function anchor(r) {
    var box = $('#mvAnchor'), root = document.body.getAttribute('data-root') || '/';
    if (!r.ledger) { box.innerHTML = '<p class="note">원장 번호가 없습니다.</p>'; return; }
    AM.call('am.anchor', { id: r.ledger }, 45000).then(function (a) {
      var link = '<a href="' + root + 'verify/?id=' + encodeURIComponent(r.ledger) + '">원장 ' + esc(r.ledger) + ' 확인</a>';
      if (!a || !a.ok) { box.innerHTML = '<p class="note">' + link + ' · 공개 타임스탬프 정보를 불러오지 못했습니다.</p>'; return; }
      if (a.pending) { box.innerHTML = '<p>발급 기록이 원장 ' + link + ' 에 남았습니다.</p><p class="note" style="margin-top:6px">' + esc(a.message || '') + '</p>'; return; }
      box.innerHTML = '<p>발급 기록이 원장 ' + link + ' 에 남았고, ' + esc(a.date) + ' 하루치 원장(' + a.count + '건)이 공개 타임스탬프(OpenTimestamps)에 묶였습니다.</p>' +
        '<dl class="mv-facts" style="margin-top:12px"><div><dt>그날 원장 뿌리 해시</dt><dd class="mv-mono">' + esc(a.root) + '</dd></div><div><dt>다시 계산한 값</dt><dd>' + (a.match ? '같음' : '<b style="color:var(--red)">다름</b>') + '</dd></div></dl>' +
        '<div class="row" style="margin-top:12px"><button class="btn btn-g btn-s" type="button" id="mvDay">그날 원장 글 받기</button><button class="btn btn-g btn-s" type="button" id="mvOts"' + (Object.keys(a.proofs || {}).length ? '' : ' disabled') + '>타임스탬프 증명(.ots) 받기</button></div>' +
        '<p class="note" style="margin-top:8px">두 파일을 같은 폴더에 두고 OpenTimestamps 도구(ots verify)나 opentimestamps.org에서 확인할 수 있습니다.</p>';
      var name = 'aimarker-ledger-' + a.date + '.txt';
      $('#mvDay').addEventListener('click', function () { MK.save(new Blob([a.text], { type: 'text/plain;charset=utf-8' }), name); });
      $('#mvOts').addEventListener('click', function () { MK.save(new Blob([otsFile(a.root, a.proofs)], { type: 'application/octet-stream' }), name + '.ots'); });
    }).catch(function () { box.innerHTML = '<p class="note">공개 타임스탬프 정보를 불러오지 못했습니다.</p>'; });
  }
  /* OpenTimestamps 파일: 머리 · 판 · sha256 · 뿌리 해시 · 달력 서버 증명들(ff로 갈래) */
  function otsFile(rootHex, proofs) {
    var MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
    var parts = [new Uint8Array(MAGIC), new Uint8Array([0x01, 0x08])], root = new Uint8Array(32);
    for (var i = 0; i < 32; i++) root[i] = parseInt(rootHex.substr(i * 2, 2), 16);
    parts.push(root);
    var list = Object.keys(proofs || {}).map(function (k) { var b = atob(proofs[k]), u = new Uint8Array(b.length); for (var j = 0; j < b.length; j++) u[j] = b.charCodeAt(j); return u; }).filter(function (u) { return u.length; });
    var multi = list.filter(function (u) { return u[0] === 0xff; }), single = list.filter(function (u) { return u[0] !== 0xff; });
    list = single.concat(multi.slice(0, 1));
    list.forEach(function (u, k) { if (k < list.length - 1) parts.push(new Uint8Array([0xff])); parts.push(u); });
    var n = parts.reduce(function (s, p) { return s + p.length; }, 0), o = new Uint8Array(n), at = 0;
    parts.forEach(function (p) { o.set(p, at); at += p.length; });
    return o;
  }

  /* ---------- 파일 대조 · 찾기 ---------- */
  function bindDrop(dropEl, inputEl, fn) {
    if (!dropEl) return;
    inputEl.addEventListener('change', function () { if (inputEl.files[0]) fn(inputEl.files[0]); inputEl.value = ''; });
    ['dragenter', 'dragover'].forEach(function (t) { dropEl.addEventListener(t, function (e) { e.preventDefault(); dropEl.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { dropEl.addEventListener(t, function (e) { e.preventDefault(); dropEl.classList.remove('over'); }); });
    dropEl.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files[0]) fn(e.dataTransfer.files[0]); });
  }
  function compare(file) {
    var box = $('#mvCmp'); box.innerHTML = '<p class="note" style="margin-top:10px"><i class="mk-spin" aria-hidden="true"></i> 대조하는 중</p>';
    AIM.inspectFile(file).then(function (x) {
      var rep = x.report, h = rep.sha256, dh = rep.dhash, mk = rep.xmp && rep.xmp.aimarker, msg = [], cls = 'bad';
      if (h === M.sha256) { cls = 'ok'; msg.push('이 마크가 발급된 원본 파일과 같습니다.'); }
      else if ((M.alts || []).indexOf(h) >= 0) { cls = 'ok'; msg.push('발급자가 등록한 이 마크의 표시본(마크를 넣은 파일)입니다.'); }
      else if (dh && M.dhash && AIM.hamming(dh, M.dhash) <= 6) { cls = 'warn'; msg.push('원본과 아주 비슷한 이미지입니다(지문 차이 ' + AIM.hamming(dh, M.dhash) + '/64). 크기 · 화질을 바꾼 사본일 수 있습니다.'); }
      else msg.push('이 마크가 발급된 파일과 다릅니다.');
      if (mk && mk.id === M.id) msg.push('파일 속에도 이 마크 번호가 들어 있습니다.');
      else if (mk && mk.id) msg.push('파일 속에는 다른 마크 번호(' + mk.id + ')가 들어 있습니다.');
      box.innerHTML = '<div class="mv-res ' + cls + '">' + msg.map(esc).join('<br>') + (mk && mk.id && mk.id !== M.id ? '<br><a href="?id=' + encodeURIComponent(mk.id) + '">' + esc(mk.id) + ' 확인하기</a>' : '') + '</div>';
    }).catch(function () { box.innerHTML = '<div class="mv-res bad">이 파일을 읽지 못했습니다.</div>'; });
  }
  function lookup(file) {
    var box = $('#mvFileOut'); box.innerHTML = '<p class="note" style="margin-top:12px"><i class="mk-spin" aria-hidden="true"></i> 파일 속 마크와 등록 기록을 찾는 중</p>';
    AIM.inspectFile(file).then(function (x) {
      var rep = x.report, mk = rep.xmp && rep.xmp.aimarker;
      if (mk && mk.id) { location.search = '?id=' + mk.id; return; }
      return AM.call('am.lookup', { sha256: rep.sha256, dhash: rep.dhash || '' }, 45000).then(function (r) {
        var items = (r && r.items) || [];
        if (!items.length) { box.innerHTML = '<div class="mv-res warn" style="margin-top:12px">이 파일에 등록된 마크를 찾지 못했습니다. 파일 속 출처 기록은 <a href="' + (document.body.getAttribute('data-root') || '/') + 'mark/">AI 사용 확인</a>에서 볼 수 있습니다.</div>'; return; }
        box.innerHTML = '<div class="mv-found">' + items.map(function (it) {
          var how = it.exact ? '같은 파일' : it.alt ? '표시본으로 등록된 파일' : '비슷한 이미지(지문 차이 ' + it.dist + '/64)';
          return '<a href="?id=' + encodeURIComponent(it.id) + '">' + MK.badge({ id: it.id, label: it.label, basis: it.basis, status: it.status }) + '<span class="note">' + esc(how) + '</span></a>';
        }).join('') + '</div>';
      });
    }).catch(function () { box.innerHTML = '<div class="mv-res bad" style="margin-top:12px">이 파일을 읽지 못했습니다.</div>'; });
  }
  bindDrop($('#mvDrop'), $('#mvFile'), lookup);
})();
