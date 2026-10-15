/* AIMarker 원장 검증(/verify/) */
(function () {
  'use strict';
  var U = window.AMUI, AM = window.AM, esc = U.esc, out = document.getElementById('vout'), q = document.getElementById('vq');
  function card(ok, title, rows) {
    return '<div class="res2"><div class="res2-h"><div><b>' + esc(title) + '</b></div><span class="lvl2 ' + (ok ? 'low' : 'confirmed') + '"><i></i>' + (ok ? '확인됨' : '확인 안 됨') + '</span></div><ul>' +
      rows.map(function (r) { return '<li class="' + (r[2] || '') + '">' + U.ico(r[2] === 'hi' ? U.I.alert : U.I.check) + '<span><b>' + esc(r[0]) + '</b> ' + r[1] + '</span></li>'; }).join('') + '</ul><div style="height:14px"></div></div>';
  }
  function ask(param, extra) {
    out.innerHTML = '<div class="res2"><div class="wait" style="padding:18px;display:flex;gap:12px;align-items:center"><span class="spin"></span><span>원장에서 찾는 중…</span></div></div>';
    return AM.call('am.verify', param, 20000).then(function (r) {
      if (!r || !r.ok) throw new Error(r && r.message || '확인하지 못했어요');
      if (!r.found) { out.innerHTML = card(false, '원장에서 찾지 못했어요', [['결과', '이 번호 · 해시는 AIMarker 원장에 없습니다. 내용이 바뀌었거나 원장에 남기기 전 파일일 수 있습니다.', 'hi']].concat(extra || [])); return; }
      var rows = [['종류', esc(r.kind || '')], ['번호', esc(r.id || '')], ['서버 시각', esc(r.at || '')]];
      if (r.st) rows.push(['승인 상태', esc(r.st) + (r.done ? ' · ' + esc(r.done) : '')]);
      if (r.n) rows.push(['담긴 소재', r.n + '개']);
      if (r.h) rows.push(['해시', '<code style="word-break:break-all">' + esc(r.h) + '</code>']);
      out.innerHTML = card(true, '원장에 남아 있는 기록입니다', (extra || []).concat(rows));
    }).catch(function (e) { out.innerHTML = card(false, '지금은 확인하지 못했어요', [['안내', esc(e.message || '잠시 뒤 다시 시도해 주세요.'), 'hi']]); });
  }
  function run(v) {
    v = String(v || '').trim();
    if (/^[0-9a-fA-F]{64}$/.test(v)) return ask({ h: v.toLowerCase() });
    if (/^(LG|AP)\d{6}-[A-Za-z0-9]{8}$/.test(v)) return ask({ id: v.toUpperCase() });
    out.innerHTML = card(false, '번호나 해시를 확인해 주세요', [['예', '원장 번호 LG261015-3F9A2C1B · 승인 번호 AP261015-… · 해시 64자리', 'hi']]);
  }
  document.getElementById('vf').addEventListener('submit', function (e) { e.preventDefault(); run(q.value); });
  var fi = document.getElementById('vfile'), dz = document.getElementById('vdrop');
  function file(f) {
    f.text().then(function (t) {
      var j = JSON.parse(t); if (!j || !j.report) throw new Error('bad');
      return U.sha256(U.canon(j.report)).then(function (h) {
        var same = !j.sha256 || j.sha256 === h;
        var extra = [['파일 해시', '<code style="word-break:break-all">' + h + '</code>', same ? '' : 'hi'], ['파일 안 해시와 비교', same ? '같음' : '다름: 파일 내용이 바뀌었습니다', same ? '' : 'hi']];
        q.value = h; return ask({ h: h }, extra);
      });
    }).catch(function () { out.innerHTML = card(false, 'AIMarker 검증용 파일이 아니에요', [['안내', '작업 공간 보고서 화면의 \'검증용 파일(JSON) 내려받기\'로 받은 파일을 올려 주세요.', 'hi']]); });
  }
  fi.addEventListener('change', function () { if (fi.files[0]) file(fi.files[0]); fi.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { dz.addEventListener(t, function (e) { e.preventDefault(); dz.classList.remove('over'); }); });
  dz.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) file(e.dataTransfer.files[0]); });
  var p = new URLSearchParams(location.search), v = p.get('id') || p.get('h');
  if (v) { q.value = v; run(v); }
})();
