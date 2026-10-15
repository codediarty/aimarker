/* AIMarker 광고 문구 무료 검사(/check/): 서버 엔진(am.check)으로 점검하고 고칠 문구를 바로 적용 */
(function () {
  'use strict';
  var U = window.AMUI, AM = window.AM, $ = function (s) { return document.querySelector(s); };
  var ta = $('#ctext'), out = $('#cout'), ind = $('#cind'), go = $('#cgo'), last = null, t0 = 0, lastKey = '', keepInd = false;
  var SAMPLES = [
    { t: '피부과 전문의가 직접 개발한 재생 크림! 부작용 없는 순한 성분으로 바르자마자 주름이 사라져요. 국내 최초 특허 성분, 지금 30% 할인.', ind: '' },
    { t: '혈당 걱정 끝! 당뇨에 좋은 여주차. 하루 3잔이면 혈당이 쭉 내려갑니다. 약 대신 자연의 힘으로 관리하세요.', ind: '' },
    { t: '내돈내산 후기! 체험단으로 받아서 2주 써 봤는데 피부가 진짜 맑아졌어요. 강력 추천합니다.', ind: '', spon: true }
  ];
  function flags() { return { sponsored: $('#fspon').checked, aiPerson: $('#fperson').checked, aiMedia: $('#fmedia').checked }; }
  function busy(on) { go.disabled = on; go.querySelector('span').textContent = on ? '검사 중…' : '검사하기'; }
  function run(force) {
    var text = ta.value, key = text + '|' + ind.value + '|' + JSON.stringify(flags());
    if (!text.replace(/\s+/g, '')) { ta.focus(); return; }
    if (!force && key === lastKey) return;
    lastKey = key; busy(true);
    if (!last) out.innerHTML = '<div class="res2"><div style="padding:22px;display:flex;gap:12px;align-items:center;color:var(--mute)"><span class="spin"></span><span>업종 규칙 팩으로 점검하는 중…</span></div></div>';
    AM.call('am.check', { text: text, ind: ind.value || (keepInd && last && last.auto ? last.ind : ''), flags: flags(), cid: U.cid() }, 25000).then(function (r) {
      if (r && r.ok && keepInd && last && last.auto && !ind.value) r.auto = true;
      keepInd = false;
      if (!r || !r.ok) throw new Error(r && r.message || '');
      last = r; last.copy = text; paint();
      if (window.gtag) try { window.gtag('event', 'ad_check', { decision: r.decision, ind: r.ind }); } catch (eG) { /* 무시 */ }
    }).catch(function (e) { out.innerHTML = '<div class="res2"><div class="res2-h"><b>지금은 검사하지 못했어요</b></div><p class="why" style="padding-bottom:16px">' + U.esc(e.message || '잠시 뒤 다시 시도해 주세요.') + '</p></div>'; })
      .then(function () { busy(false); });
  }
  function paint() {
    var r = last, cc = U.catCounts(r.findings);
    var cats = [1, 2, 3, 4, 5, 6].filter(function (k) { return cc[k].n; }).map(function (k) { return '<span class="sv ' + (cc[k][3] ? 'high' : cc[k][2] ? 'mid' : 'info') + '">' + U.CATS[k] + ' ' + cc[k].n + '</span>'; }).join('');
    var labels = (r.labels || []).map(function (l) { return '<div><span><b>붙일 표시</b> <code>' + U.esc(l.text) + '</code> · ' + U.esc(l.where) + '</span></div>'; }).join('');
    out.innerHTML = '<div class="ac">' + U.summary(r) + (cats ? '<div class="cnt" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">' + cats + '</div>' : '') +
      '<div class="prev3" id="cprev">' + U.highlight(r.copy, r.findings) + '</div>' +
      '<div class="actbar"><button class="btn btn-p" type="button" id="cfix">' + U.ico(U.I.wand) + '한 번에 고치기</button><button class="btn btn-g" type="button" id="cnext">작업 공간에서 계속(승인 · 보고서)</button></div>' +
      (labels ? '<div class="lbls3">' + labels + '</div>' : '') +
      '<div class="fdl" id="cfd">' + (r.findings.length ? r.findings.map(function (f, i) { return U.finding(f, i, { fb: true }); }).join('') : '<div class="chk-empty">' + U.ico(U.I.check) + '<b style="display:block;color:var(--ink)">큰 위험 후보가 없어요</b>그래도 근거 자료 · 표시 위치는 한 번 더 확인하세요.</div>') + '</div>' +
      '<p class="note mt12">' + U.esc(r.pack.name + ' ' + r.pack.ver) + ' · 규칙 ' + r.pack.rules + '개 · ' + r.ms + 'ms · 문구는 저장하지 않습니다</p></div>';
  }
  out.addEventListener('click', function (e) {
    var r = last; if (!r) return;
    var b = e.target.closest('[data-fix]');
    if (b) { var p = b.getAttribute('data-fix').split(':'), f = r.findings[+p[0]], t = U.applyFix(r.copy, f, f.reps[+p[1]]); if (t !== r.copy) { ta.value = t; count(); keepInd = true; run(true); } return; }
    if (e.target.closest('#cfix')) { var o = U.applyAll(r.copy, r.findings); if (!o.n) { toastish('자동으로 바꿀 수 있는 표현이 없어요. 남은 후보는 직접 확인해 주세요.'); return; } ta.value = o.text; count(); keepInd = true; run(true); return; }
    if (e.target.closest('#cnext')) { try { sessionStorage.setItem('am_hand', JSON.stringify({ copy: ta.value, ind: ind.value || 'auto', flags: flags() })); } catch (eS) { /* 무시 */ } location.href = AM.root + 'app/'; return; }
    var fb = e.target.closest('[data-fb]');
    if (fb) { var q = fb.getAttribute('data-fb').split(':'); fb.classList.add('on'); AM.call('am.fb', { rule: r.findings[+q[0]].id, v: q[1], ind: r.ind, cid: U.cid() }).catch(function () {}); toastish('의견 고마워요. 판정 정확도를 높이는 데 씁니다.'); return; }
    var m = e.target.closest('mark[data-i]');
    if (m) { var el = out.querySelector('[data-f="' + m.getAttribute('data-i') + '"]'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1400); } }
  });
  function toastish(m) { var n = document.createElement('div'); n.className = 'callout m mt12'; n.textContent = m; out.prepend(n); setTimeout(function () { n.remove(); }, 3500); }
  function count() { $('#ccnt').textContent = ta.value.length.toLocaleString('ko-KR'); }
  ta.addEventListener('input', function () { count(); clearTimeout(t0); if (ta.value.trim().length >= 8) t0 = setTimeout(function () { run(false); }, 1300); });
  go.addEventListener('click', function () { run(true); });
  [ind, $('#fspon'), $('#fperson'), $('#fmedia')].forEach(function (el) { el.addEventListener('change', function () { if (ta.value.trim()) run(false); }); });
  $('#samples').addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); if (!b) return; var s = SAMPLES[+b.getAttribute('data-s')]; last = null; ta.value = s.t; $('#fspon').checked = !!s.spon; $('#fperson').checked = false; $('#fmedia').checked = false; ind.value = s.ind; count(); run(true); });
  var q = new URLSearchParams(location.search).get('t'); if (q) { ta.value = q.slice(0, 5000); count(); run(true); }
})();
