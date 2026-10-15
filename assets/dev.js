/* AIMarker 개발자 페이지: 엔진 불러 보기 · API 키 받기 */
(function () {
  'use strict';
  var U = window.AMUI, AM = window.AM, $ = function (s) { return document.querySelector(s); };
  var pout = $('#pout'), prun = $('#prun');
  prun.addEventListener('click', function () {
    var body = { text: $('#ptext').value, ind: $('#pind').value, flags: { sponsored: $('#pspon').checked, aiPerson: $('#pperson').checked, aiMedia: false }, cid: U.cid() };
    prun.disabled = true; pout.textContent = '부르는 중…'; var t0 = Date.now();
    AM.call('am.check', body, 25000).then(function (r) {
      if (r && r.findings) r.findings = r.findings.map(function (f) { var o = {}; ['id', 'cat', 'lv', 's', 'e', 't', 'why', 'law', 'reps'].forEach(function (k) { o[k] = f[k]; }); return o; });
      pout.textContent = JSON.stringify(r, null, 2); $('#pms').textContent = (Date.now() - t0) + 'ms';
    }).catch(function () { pout.textContent = '{ "ok": false, "message": "지금은 부르지 못했어요" }'; }).then(function () { prun.disabled = false; });
  });
  var f = $('#keyForm'), t0 = Date.now();
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
    }).catch(function (e2) { show('err', U.esc(e2.message || '지금은 발급하지 못했어요. contact@skkc.co.kr 로 문의해 주세요.')); btn.disabled = false; btn.textContent = 'API 키 받기'; });
  });
})();
