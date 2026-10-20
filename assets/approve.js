/* AIMarker 승인 요청 화면(/app/approve/?id=AP…): 로그인 없이 보고 승인 · 수정 요청. 결과는 원장에 남음 */
(function () {
  'use strict';
  var U = window.AMUI, AM = window.AM, esc = U.esc, box = document.getElementById('apv');
  var id = (new URLSearchParams(location.search).get('id') || '').toUpperCase().replace(/[^A-Z0-9\-]/g, '');
  function toast(m) { var t = document.getElementById('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, 3200); }
  function msg(title, text, retry) { box.innerHTML = '<div class="ac"><div class="empty3">' + U.ico(U.I.alert) + '<h1 class="apv-err">' + esc(title) + '</h1><p>' + esc(text) + '</p><div class="row">' + (retry ? '<button class="btn btn-p btn-s" type="button" data-reload>다시 열기</button>' : '') + '<a class="btn btn-g btn-s" href="' + AM.root + '">AIMarker 홈</a></div></div></div>'; var rb = box.querySelector('[data-reload]'); if (rb) rb.addEventListener('click', function () { location.reload(); }); }
  if (!/^AP\d{6}-[A-Z0-9]{8}$/.test(id)) { msg('승인 요청 주소가 올바르지 않아요', '받은 링크 전체를 다시 열어 주세요.'); return; }
  AM.call('am.view', { id: id }, 20000).then(function (r) { if (!r || !r.ok) throw new Error(r && r.message || ''); render(r); })
    .catch(function (e) { var m = e && e.message && !/fetch|network|abort|load failed/i.test(e.message) ? e.message : '연결이 고르지 않아요. 잠시 뒤 다시 열어 주세요.'; msg('승인 요청을 열지 못했어요', m, true); });
  function done(st, by, at, ledger) {
    var ok = st === '승인';
    return '<div class="ac apv-done' + (ok ? '' : ' bad') + '">' + U.ico(ok ? U.I.check : U.I.alert) + '<b>' + (ok ? '승인했어요' : '수정을 요청했어요') + '</b><p class="note mt8">' + esc((by ? by + ' · ' : '') + (at || '')) + '</p>' +
      (ledger ? '<p class="note mt12">원장 번호<br><span class="lgno">' + esc(ledger) + '</span><br><a href="' + AM.root + 'verify/?id=' + encodeURIComponent(ledger) + '" target="_blank" rel="noopener">이 번호로 검증하기</a></p>' : '') + '<p class="note mt8">요청한 분의 작업 공간에 자동으로 전달됩니다.</p></div>';
  }
  function render(r) {
    var d = r.data || {}, copy = d.copy || '', cnt = { high: 0, mid: 0, info: 0 };
    var fnd = (d.fnd || []).map(function (f) { var s = f.t ? copy.indexOf(f.t) : -1; if (f.lv === 3) cnt.high++; else if (f.lv === 2) cnt.mid++; else cnt.info++; return { lv: f.lv, cat: f.cat, why: f.why, t: f.t, law: f.law || '', s: s, e: s >= 0 ? s + f.t.length : -1, reps: [] }; });
    var head = '<div class="ac"><span class="eyebrow">' + esc(d.brand || '승인 요청') + '</span><h1 class="h2" style="font-size:24px;margin-top:6px">' + esc(d.title || '') + '</h1>' +
      '<div class="apv-meta"><span>채널 ' + esc(d.channel || '-') + '</span><span>업종 ' + esc(U.IND[d.ind] || '-') + '</span><span>버전 ' + esc(d.ver || '') + '</span><span>요청 ' + esc(d.from || '') + ' · ' + esc(r.at || '') + '</span></div>' +
      '<div class="mt16">' + U.summary({ score: d.score, decision: d.dec || 'clear', counts: cnt, indName: U.IND[d.ind] }) + '</div></div>';
    var body = '<div class="ac"><h2>' + U.ico(U.I.scale) + '승인할 문구</h2><div class="prev3" style="max-height:none">' + U.highlight(copy, fnd) + '</div>' +
      ((d.files || []).length ? '<p class="note mt12">이미지 ' + d.files.length + '장: ' + d.files.map(function (f) { return esc(f.name) + '(' + esc(f.prov) + ')'; }).join(', ') + '</p>' : '') + '</div>' +
      (fnd.length ? '<div class="ac"><h2>' + U.ico(U.I.alert) + '자동 점검에서 남은 후보 ' + fnd.length + '개</h2><div class="fdl">' + fnd.map(function (f, i) { return U.finding(f, i, { fix: false }); }).join('') + '</div></div>' : '');
    var form = r.st !== '대기' ? done(r.st, r.by, r.done, '') :
      '<div class="ac" id="decbox"><h2>' + U.ico(U.I.check) + '승인하기</h2><div class="field mt12"><label for="by">이름 · 회사 <small>선택, 승인 기록에 남음</small></label><input class="inp" id="by" maxlength="30" autocomplete="organization"></div>' +
      '<div class="field mt12"><label for="memo">메모 <small>수정 요청이면 꼭 적어 주세요</small></label><textarea class="txt" id="memo" maxlength="300" rows="3"></textarea></div>' +
      '<div class="row mt16"><button class="btn btn-p btn-l" type="button" data-d="ok">' + U.ico(U.I.check) + '승인</button><button class="btn btn-g btn-l" type="button" data-d="fix">수정 요청</button></div></div>';
    box.innerHTML = head + body + form;
    var db = document.getElementById('decbox');
    if (db) db.addEventListener('click', function (e) {
      var b = e.target.closest('[data-d]'); if (!b) return;
      var dd = b.getAttribute('data-d'), by = document.getElementById('by').value.trim(), memo = document.getElementById('memo').value.trim();
      if (dd === 'fix' && !memo) { toast('무엇을 고치면 되는지 메모에 적어 주세요.'); document.getElementById('memo').focus(); return; }
      Array.prototype.forEach.call(db.querySelectorAll('button'), function (x) { x.disabled = true; });
      AM.call('am.approve', { id: id, d: dd, by: by, memo: memo, cid: U.cid() }).then(function (x) {
        if (!x || !x.ok) throw new Error(x && x.message || '처리하지 못했어요');
        db.outerHTML = done(x.st, x.by || by, x.done, x.ledger || '');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }).catch(function (e2) { toast(e2.message || '지금은 처리하지 못했어요. 잠시 뒤 다시 눌러 주세요.'); Array.prototype.forEach.call(db.querySelectorAll('button'), function (x) { x.disabled = false; }); });
    });
  }
})();
