/* AIMarker 원장 · 공개 앵커 확인(/verify/) 5.0 */
(function () {
  'use strict';
  var U = window.AMUI, AM = window.AM, esc = U.esc, out = document.getElementById('vout'), q = document.getElementById('vq'), list = document.getElementById('vlist');
  var CAL = { 'https://a.pool.opentimestamps.org': 'a.pool.opentimestamps.org', 'https://b.pool.opentimestamps.org': 'b.pool.opentimestamps.org', 'https://a.pool.eternitywall.com': 'a.pool.eternitywall.com' };
  function pill(cls, text) { return '<span class="mv-pill ' + cls + '">' + text + '</span>'; }
  function facts(rows) { return '<dl class="mv-facts">' + rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>'; }
  function wait(t) { out.innerHTML = '<div class="mv-card"><div class="wait" style="display:flex;gap:12px;align-items:center"><span class="spin"></span><span>' + esc(t) + '</span></div></div>'; }
  function fail(title, msg) { out.innerHTML = '<div class="mv-card"><div class="mv-state">' + pill('bad', esc(title)) + '</div><p class="mt12">' + msg + '</p></div>'; }
  function code(h) { return '<code class="vl-hash">' + esc(h) + '</code>'; }

  /* OpenTimestamps 증명 파일(.ots): 머리 + SHA-256 + 뿌리 해시 + 달력 증명 */
  function otsFile(rootHex, proofs) {
    var MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
    var parts = [new Uint8Array(MAGIC), new Uint8Array([0x01, 0x08])], root = new Uint8Array(32);
    for (var i = 0; i < 32; i++) root[i] = parseInt(rootHex.substr(i * 2, 2), 16);
    parts.push(root);
    var all = Object.keys(proofs || {}).map(function (k) { var b = atob(proofs[k]), u = new Uint8Array(b.length); for (var j = 0; j < b.length; j++) u[j] = b.charCodeAt(j); return u; }).filter(function (u) { return u.length; });
    var arr = all.filter(function (u) { return u[0] !== 0xff; }).concat(all.filter(function (u) { return u[0] === 0xff; }).slice(0, 1));
    arr.forEach(function (u, k) { if (k < arr.length - 1) parts.push(new Uint8Array([0xff])); parts.push(u); });
    var n = parts.reduce(function (s, p) { return s + p.length; }, 0), o = new Uint8Array(n), at = 0;
    parts.forEach(function (p) { o.set(p, at); at += p.length; });
    return o;
  }
  function save(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }

  /* 하루치 공개 앵커 */
  function day(param, head) {
    return AM.call('am.anchor', param, 30000).then(function (a) {
      if (!a || !a.ok) throw new Error(a && a.message || '확인하지 못했어요');
      if (a.pending) return (head || '') + '<div class="mv-card"><div class="mv-state">' + pill('warn', '공개 앵커 대기') + '</div><p class="mt12">' + esc(a.message || '') + '</p></div>';
      var html = (head || '') + '<div class="mv-card vl-day"><div class="mv-state">' + (a.status === 'anchored' ? pill('ok', U.ico(U.I.check) + 'OpenTimestamps에 올림') : pill('warn', '달력 서버에 다시 보내는 중')) +
        '<span class="mv-pill" id="vlRe">이 브라우저에서 다시 계산하는 중…</span></div>' +
        '<h3 class="mt16">' + esc(a.date) + ' 원장 · ' + a.count + '줄</h3>' +
        facts([['뿌리 해시', code(a.root)], ['전날 뿌리', code(a.prev)], ['처음 · 마지막', esc(a.first) + ' ~ ' + esc(a.last)], ['올린 시각', esc(a.anchoredAt || '')],
          ['달력 서버', Object.keys(a.proofs || {}).map(function (k) { return esc(CAL[k] || k); }).join(' · ') || '없음']].concat(a.id ? [['찾은 기록', esc(a.id) + (a.position >= 0 ? ' · 그날 ' + (a.position + 1) + '번째 줄' : ' · 그날 원장에 없음')]] : [])) +
        '<div class="row mt16">' + (a.text ? '<button class="btn btn-g btn-s" type="button" id="vlTxt"><span>원장 글(.txt)</span></button>' : '') +
        (a.proofs && Object.keys(a.proofs).length ? '<button class="btn btn-g btn-s" type="button" id="vlOts"><span>증명 파일(.ots)</span></button>' : '') + '</div>' +
        '<p class="dev-note">원장 글의 SHA-256이 뿌리 해시와 같으면 그날 기록이 그대로입니다. 증명 파일은 OpenTimestamps 클라이언트(ots verify)로 확인하며, 비트코인 블록에 들어가기까지 몇 시간 걸릴 수 있습니다.</p></div>';
      setTimeout(function () {
        var re = document.getElementById('vlRe');
        if (re && a.text) U.sha256(a.text).then(function (h) { re.className = 'mv-pill ' + (h === a.root ? 'ok' : 'bad'); re.textContent = h === a.root ? '다시 계산해도 같음' : '다시 계산한 해시가 다름'; });
        else if (re) re.textContent = '원장 글이 커서 내려받아 확인하세요';
        var t = document.getElementById('vlTxt'); if (t) t.addEventListener('click', function () { save(new Blob([a.text], { type: 'text/plain' }), 'aimarker-ledger-' + a.date + '.txt'); });
        var o = document.getElementById('vlOts'); if (o) o.addEventListener('click', function () { save(new Blob([otsFile(a.root, a.proofs)], { type: 'application/octet-stream' }), 'aimarker-ledger-' + a.date + '.txt.ots'); });
      }, 0);
      return html;
    });
  }

  /* 원장 번호 · 해시 · 승인 번호 */
  function ask(param, extra) {
    wait('원장에서 찾는 중…');
    return AM.call('am.verify', param, 20000).then(function (r) {
      if (!r || !r.ok) throw new Error(r && r.message || '확인하지 못했어요');
      if (!r.found) { out.innerHTML = '<div class="mv-card"><div class="mv-state">' + pill('bad', '원장에서 찾지 못했어요') + '</div><p class="mt12">이 번호 · 해시는 AIMarker 원장에 없습니다. 내용이 한 글자라도 바뀌었거나 원장에 남기기 전 파일일 수 있습니다.</p>' + (extra ? facts(extra) : '') + '</div>'; return; }
      var rows = (extra || []).concat([['종류', esc(r.kind || '')], ['번호', esc(r.id || '')], ['서버 시각', esc(r.at || '')]]);
      if (r.st) rows.push(['승인 상태', esc(r.st) + (r.done ? ' · ' + esc(r.done) : '')]);
      if (r.n) rows.push(['담긴 소재', r.n + '개']);
      if (r.h) rows.push(['해시', code(r.h)]);
      var head = '<div class="mv-card"><div class="mv-state">' + pill('ok', U.ico(U.I.check) + '원장에 남아 있는 기록') + '</div><div class="mt16">' + facts(rows) + '</div></div>';
      if (r.id && /^LG/.test(r.id)) return day({ id: r.id }, head + '<div class="mt16"></div>').then(function (h) { out.innerHTML = h; }).catch(function () { out.innerHTML = head; });
      out.innerHTML = head;
    }).catch(function (e) { fail('지금은 확인하지 못했어요', esc(e.message || '잠시 뒤 다시 시도해 주세요.')); });
  }
  function run(v) {
    v = String(v || '').trim();
    if (/^AM-[0-9A-Za-z]{10}$/.test(v)) { location.href = (document.body.getAttribute('data-root') || '/') + 'm/?id=' + encodeURIComponent(v.toUpperCase()); return; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { wait('그날 공개 앵커를 불러오는 중…'); return day({ date: v }).then(function (h) { out.innerHTML = h; }).catch(function (e) { fail('지금은 확인하지 못했어요', esc(e.message || '')); }); }
    if (/^[0-9a-fA-F]{64}$/.test(v)) return ask({ h: v.toLowerCase() });
    if (/^(LG|AP)\d{6}-[A-Za-z0-9]{8}$/i.test(v)) return ask({ id: v.toUpperCase() });
    fail('번호 · 해시 · 날짜를 확인해 주세요', '예: 원장 번호 LG261016-40F06928 · 승인 번호 AP261016-… · 마크 번호 AM-… · 해시 64자리 · 날짜 2026-10-16');
  }
  document.getElementById('vf').addEventListener('submit', function (e) { e.preventDefault(); run(q.value); });

  /* 보고서 검증용 파일 */
  var fi = document.getElementById('vfile'), dz = document.getElementById('vdrop');
  function file(f) {
    f.text().then(function (t) {
      var j = JSON.parse(t); if (!j || !j.report) throw new Error('bad');
      return U.sha256(U.canon(j.report)).then(function (h) {
        var same = !j.sha256 || j.sha256 === h;
        q.value = h; return ask({ h: h }, [['파일 해시', code(h)], ['파일 안 해시와 비교', same ? '같음' : '<b>다름: 파일 내용이 바뀌었습니다</b>']]);
      });
    }).catch(function () { fail('AIMarker 검증용 파일이 아니에요', '작업 공간 보고서 화면의 \'검증용 파일(JSON) 내려받기\'로 받은 파일을 올려 주세요.'); });
  }
  fi.addEventListener('change', function () { if (fi.files[0]) file(fi.files[0]); fi.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.remove('over'); }); });
  dz.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) file(e.dataTransfer.files[0]); });

  /* 최근 공개 앵커 목록 */
  AM.call('am.anchor', {}, 30000).then(function (r) {
    var items = (r && r.items) || [];
    if (!items.length) { list.innerHTML = '<p class="dev-note">아직 묶인 날이 없습니다. 하루치 원장은 다음 날 0시 10분 뒤 첫 시간 작업에서 묶여 올라갑니다.</p>'; return; }
    list.innerHTML = '<ul class="vl-days">' + items.map(function (x) {
      return '<li><button type="button" data-d="' + esc(x.date) + '"><b>' + esc(x.date) + '</b><span>' + x.count + '줄</span><code>' + esc(String(x.root || '').slice(0, 20)) + '…</code>' + (x.status === 'anchored' ? pill('ok', '올림') : pill('warn', '다시 보내는 중')) + '</button></li>';
    }).join('') + '</ul>';
    list.addEventListener('click', function (e) { var b = e.target.closest('button[data-d]'); if (!b) return; q.value = b.getAttribute('data-d'); run(q.value); out.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }).catch(function () { list.innerHTML = '<p class="dev-note">지금은 목록을 불러오지 못했어요. 날짜를 직접 넣어 확인해 보세요.</p>'; });

  var p = new URLSearchParams(location.search), v = p.get('id') || p.get('h') || p.get('date');
  if (v) { q.value = v; run(v); }
})();
