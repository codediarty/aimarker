/* AIMarker 개발자 페이지 5.0: 엔진 불러 보기(파일 확인 · 마크 확인 · 문구 검수) · API 키 받기 */
(function () {
  'use strict';
  var U = window.AMUI, AM = window.AM, X = window.AIMExtract, $ = function (s) { return document.querySelector(s); };
  function kb(n) { return n < 1024 ? n + 'B' : n < 1048576 ? (n / 1024).toFixed(1) + 'KB' : (n / 1048576).toFixed(1) + 'MB'; }
  function pretty(o) { return JSON.stringify(o, null, 2); }

  /* 1) 파일 확인: 이 브라우저에서 판독 → am.analyze */
  var tfile = $('#tfile'), trun = $('#trun'), cur = null;
  if (tfile && X) {
    var tdrop = $('#tdrop');
    ['dragenter', 'dragover'].forEach(function (t) { tdrop.addEventListener(t, function (e) { e.preventDefault(); tdrop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { tdrop.addEventListener(t, function (e) { e.preventDefault(); tdrop.classList.remove('over'); }); });
    tdrop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
    tfile.addEventListener('change', function () { if (tfile.files && tfile.files[0]) pick(tfile.files[0]); });
    function pick(f) {
      $('#tname').textContent = f.name;
      cur = null; trun.disabled = true; $('#tfeat').textContent = '이 브라우저에서 읽는 중…'; $('#tfsz').textContent = '';
      X.inspectFile(f).then(function (x) {
        cur = x;
        var fj = pretty(x.features), pj = x.pack ? JSON.stringify(x.pack) : '';
        $('#tfeat').textContent = fj;
        $('#tfsz').textContent = 'features ' + kb(JSON.stringify(x.features).length) + ' · pack ' + (pj ? kb(pj.length) : '없음') + ' · 원본 ' + kb(f.size) + '(보내지 않음)';
        trun.disabled = false;
      }).catch(function () { $('#tfeat').textContent = '이 파일은 읽지 못했어요. 다른 파일로 해 보세요.'; });
    }
    trun.addEventListener('click', function () {
      if (!cur) return;
      trun.disabled = true; $('#tout').textContent = '호출 중…'; var t0 = Date.now();
      AM.call('am.analyze', { features: cur.features, pack: cur.pack || undefined, cid: U.cid() }, 70000).then(function (r) {
        $('#tout').textContent = pretty(r); $('#tms').textContent = (Date.now() - t0) + 'ms';
      }).catch(function () { $('#tout').textContent = '{ "ok": false, "message": "지금은 부르지 못했어요" }'; }).then(function () { trun.disabled = false; });
    });
  }

  /* 2) 마크 확인: am.markinfo + 공개키로 서명 확인(서버에 묻지 않음) */
  var mrun = $('#mrun');
  if (mrun) {
    var keys = null;
    function getKeys() {
      if (keys) return Promise.resolve(keys);
      return fetch(new URL('../.well-known/aimarker-keys.json', location.href), { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (j) { keys = j.keys || []; return keys; })
        .catch(function () { return AM.call('am.pubkey', {}).then(function (p) { keys = p.keys || []; return keys; }); });
    }
    var mid = $('#mid');
    mid.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); mrun.click(); } });
    mrun.addEventListener('click', function () {
      var id = (mid.value || '').trim().toUpperCase();
      if (!/^AM-[0-9A-Z]{10}$/.test(id)) { $('#msig').textContent = '마크 번호는 AM- 로 시작하는 13자리입니다.'; return; }
      mrun.disabled = true; $('#mout').textContent = '호출 중…'; $('#msig').textContent = ''; var t0 = Date.now();
      AM.call('am.markinfo', { id: id, cid: U.cid() }).then(function (r) {
        $('#mout').textContent = pretty(r); $('#mms').textContent = (Date.now() - t0) + 'ms';
        if (!r || !r.ok) return;
        if (!r.cred) { $('#msig').textContent = '이 마크에는 서명이 없습니다(서명 도입 전 발급).'; return; }
        return getKeys().then(function (ks) { return X.verifyMark(r.cred, ks); }).then(function (v) {
          if (v.ok || v.reason !== 'unknown_key') return v;   // 새 키: 서버 공개키로 한 번 더
          return AM.call('am.pubkey', {}).then(function (pk) { return X.verifyMark(r.cred, (pk && pk.keys) || []); }).catch(function () { return v; });
        }).then(function (v) {
          var p = v.payload || {}, same = p.sub === r.id && p.label === r.label && p.basis === r.basis && p.sha256 === r.sha256;
          $('#msig').textContent = v.ok && same ? '서명 확인됨(' + v.kid + '): 마크 번호 · 표시 · 근거 · 원본 해시가 서명과 같습니다.' + (r.status === 'revoked' ? ' 다만 이 마크는 철회됐습니다.' : '')
            : v.ok ? '서명은 맞지만 마크 정보와 내용이 다릅니다.' : '서명을 확인하지 못했습니다(' + (v.reason || '알 수 없음') + ').';
        });
      }).catch(function () { $('#mout').textContent = '{ "ok": false, "message": "지금은 부르지 못했어요" }'; }).then(function () { mrun.disabled = false; });
    });
  }

  /* 3) 부가: 문구 검수 */
  var pout = $('#pout'), prun = $('#prun');
  if (prun) prun.addEventListener('click', function () {
    var body = { text: $('#ptext').value, ind: $('#pind').value, flags: { sponsored: $('#pspon').checked, aiPerson: $('#pperson').checked, aiMedia: false }, cid: U.cid() };
    prun.disabled = true; pout.textContent = '호출 중…'; var t0 = Date.now();
    AM.call('am.check', body, 25000).then(function (r) {
      if (r && r.findings) r.findings = r.findings.map(function (f) { var o = {}; ['id', 'cat', 'lv', 's', 'e', 't', 'why', 'law', 'reps'].forEach(function (k) { o[k] = f[k]; }); return o; });
      pout.textContent = pretty(r); $('#pms').textContent = (Date.now() - t0) + 'ms';
    }).catch(function () { pout.textContent = '{ "ok": false, "message": "지금은 부르지 못했어요" }'; }).then(function () { prun.disabled = false; });
  });

  /* API 키 받기 */
  var f = $('#keyForm'), t0 = Date.now();
  if (!f) return;
  function show(cls, html) { var m = f.querySelector('.msg'); m.className = 'msg on ' + cls; m.innerHTML = html; }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.agree.checked) { show('err', '수집 · 이용과 이용약관에 동의해 주세요.'); return; }
    var btn = f.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = '발급 중…';
    AM.call('am.key', { org: f.org.value, contact: f.contact.value, use: f.use.value, hp: f.hp.value, ms: Date.now() - t0, cid: U.cid() }).then(function (r) {
      if (!r || !r.ok) throw new Error(r && r.message || '발급하지 못했어요');
      if (!r.key) { show('ok', '접수되었습니다.'); return; }
      show('ok', '<b>API 키가 나왔어요. 지금 복사해 안전한 곳(서버 환경 변수)에 보관하세요. 다시 보여 드리지 않습니다.</b><div class="code mt12"><div class="code-h"><span>하루 ' + r.quota + '회 · ' + U.esc(r.id) + '</span><button class="btn btn-g btn-s" type="button" data-copy="#newKey"><span>복사</span></button></div><div class="code-b" id="newKey">' + U.esc(r.key) + '</div></div>');
      f.querySelectorAll('input,textarea').forEach(function (x) { x.disabled = true; });
      if (window.gtag) try { window.gtag('event', 'api_key'); } catch (eG) { /* 무시 */ }
    }).catch(function (e2) { show('err', U.esc(e2.message || '지금은 발급하지 못했어요. contact@skkc.co.kr로 문의해 주세요.')); btn.disabled = false; btn.textContent = 'API 키 받기'; });
  });
})();
