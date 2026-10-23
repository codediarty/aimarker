/* AIMarker 결제 시트(10.0, 12.0 기업 크레딧, 13.0 크레딧 하나로): [data-buy="상품"] 단추 → 금액 확인 → 공식 결제처 성균관컨설팅 결제 페이지로(상품 번호가 없으면 결제 링크 받기 요청)
   13.0: 결제 방법 '크레딧'(개인 · 기업 모든 크레딧, 1크레딧 = 10원, 부가세 별도 상품 금액 기준). 이 브라우저에 저장된 코드가 있으면 먼저 고르고,
   남은 크레딧은 am.pass(읽기만, 빼지 않음)로 바로 보여 줌. 주문 기록에는 코드 전체를 남기지 않고 끝 4자리만 남겨 담당자가 확인 뒤 뺌.
   저장된 코드가 크레딧 코드가 아니면(예전 이용권 · 없는 코드) 조용히 카드로 돌아감. 기업 크레딧 충전은 '이미 받은 코드에 더하기'(끝 4자리)를 받음.
   상품 · 요금은 assets/products.js(빌드에서 만듦). 카드 번호 같은 결제 정보는 이 사이트에서 받지 않습니다. */
(function () {
  'use strict';
  var AMP = window.AMP, AM = window.AM || {};
  if (!AMP) return;
  var EMAIL_RE = /^[^\s@]{1,64}@[A-Za-z0-9.\-]{1,120}\.[A-Za-z]{2,}$/;
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var root = document.body.getAttribute('data-root') || '';
  var box = null, last = null;
  function sget(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 없이 */ } }
  function normCode(c) { return String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); }
  function fmtCode(c) { return normCode(c).replace(/(.{4})(?=.)/g, '$1-'); }

  function onKey(e) {
    if (!box) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var fs = Array.prototype.filter.call(box.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'), function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!fs.length) return;
    var first = fs[0], lastEl = fs[fs.length - 1];
    if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  }
  function close() { if (box) { box.remove(); box = null; document.body.style.overflow = ''; document.removeEventListener('keydown', onKey, true); if (last && last.focus) last.focus(); } }
  function open(id, per, from) {
    var it = AMP.items[id];
    if (!it) return false;
    last = from || null;
    var hasY = !!it.y, monthly = it.per === '월', isCredit = /^credit-/.test(id), saved = isCredit ? '' : fmtCode(sget('am_pass')), auto = !!saved;
    per = hasY && per === 'y' ? 'y' : 'm';
    var t0 = Date.now();
    box = document.createElement('div');
    box.className = 'k-buy';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'kbuyT');
    box.innerHTML = '<div class="k-buy-in"><button class="k-buy-x" type="button" aria-label="닫기">×</button>' +
      '<div class="k-buy-h"><small>' + esc(it.group) + '</small><h2 id="kbuyT">' + esc(it.name) + '</h2><p>추천 대상: ' + esc(it.who) + '</p><ul class="k-buy-feat">' + it.feat.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<form class="k-buy-b" novalidate>' +
      (hasY ? '<div class="k-buy-per" role="radiogroup" aria-label="결제 기간"><label class="' + (per === 'm' ? 'on' : '') + '"><input type="radio" name="per" value="m"' + (per === 'm' ? ' checked' : '') + '><b>1개월</b><span>' + won(it.m) + ' / 월</span></label>' +
        '<label class="' + (per === 'y' ? 'on' : '') + '"><input type="radio" name="per" value="y"' + (per === 'y' ? ' checked' : '') + '><b>12개월 한 번에</b><span>' + won(it.y) + ' · 10개월 요금</span></label></div>' : '') +
      '<div class="k-buy-sum" aria-live="polite"></div>' +
      '<div class="k-buy-f"><label><span>받을 이메일<em>필수</em></span><input type="email" name="email" autocomplete="email" maxlength="80" placeholder="name@company.co.kr" required></label>' +
      '<label><span>사이트 주소<em>선택</em></span><input type="text" name="site" inputmode="url" maxlength="120" placeholder="예: myshop.co.kr" spellcheck="false"></label>' +
      '<label><span>회사 · 이름<em>선택</em></span><input type="text" name="org" maxlength="60" autocomplete="organization" placeholder="세금계산서를 받을 곳"></label>' +
      (isCredit ? '<label><span>이미 받은 코드에 더하기<em>선택</em></span><input type="text" name="topup" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="코드 끝 4자리(예: 8PLW)"></label>' : '') + '</div>' +
      '<fieldset class="k-buy-pay"><legend class="k-buy-lg">결제 방법</legend>' +
      (isCredit ? '' : '<label' + (saved ? ' class="on"' : '') + '><input type="radio" name="pay" value="credit"' + (saved ? ' checked' : '') + '><span><b>크레딧</b><small class="crnote">충전해 둔 크레딧에서 뺍니다.</small></span></label>' +
        '<div class="k-buy-f k-buy-cr" hidden><label><span>크레딧 코드<em>필수</em></span><input type="text" name="crcode" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="XXXX-XXXX-XXXX-XXXX" value="' + esc(saved) + '"></label>' +
        '<div class="k-buy-crb" aria-live="polite" hidden></div><p class="k-buy-crn">크레딧이 없다면 <a href="' + root + 'pricing/#credits" target="_blank" rel="noopener">먼저 충전</a>하세요. 3,000원부터, 같은 코드로 모든 기능에 씁니다.</p></div>') +
      '<label' + (saved ? '' : ' class="on"') + '><input type="radio" name="pay" value="card"' + (saved ? '' : ' checked') + '><span><b>카드 · 간편결제</b><small class="cardnote">성균관컨설팅 결제 페이지에서 회원가입 없이 결제합니다.</small></span></label>' +
      '<label><input type="radio" name="pay" value="bank"><span><b>계좌이체 · 세금계산서</b><small>견적서와 입금 안내를 메일로 보내 드립니다.</small></span></label></fieldset>' +
      '<div class="k-buy-flow" aria-hidden="true"><b>AIMarker</b>' + '→' + '<b class="sk">성균관컨설팅</b><span>공식 결제처 · 카드 명세서에 성균관컨설팅으로 표시</span></div>' +
      '<label class="k-buy-ok"><input type="checkbox" name="agree"><span>주문 처리와 시작 안내를 위해 이메일, 사이트 주소, 회사 이름을 받는 데 동의합니다(<a href="' + root + 'privacy/" target="_blank" rel="noopener">개인정보처리방침</a>). 결제 정보는 이 사이트에서 받지 않습니다.</span></label>' +
      '<button class="k-btn k-btn-p k-buy-go" type="submit">결제 페이지로</button>' +
      '<div class="k-buy-msg" role="status"></div>' +
      '<p class="k-buy-note"><span class="nt">결제 뒤 영업일 하루 안에 시작 안내 메일을 드립니다.</span> ' + (monthly ? '월 요금제는 다음 달 결제를 하지 않으면 끝납니다. ' : '') + '환불은 <a href="' + root + 'terms/" target="_blank" rel="noopener">이용약관</a>을 따릅니다. 문의 contact@skkc.co.kr</p>' +
      '</form></div>';
    document.body.appendChild(box);
    document.body.style.overflow = 'hidden';
    var f = box.querySelector('form'), sum = box.querySelector('.k-buy-sum'), go = box.querySelector('.k-buy-go'), msg = box.querySelector('.k-buy-msg');
    function cur() {
      var p = hasY ? (f.querySelector('input[name=per]:checked') || {}).value : 'm';
      var base = p === 'y' ? it.y : it.m, vatSep = /별도/.test(it.vat), vat = vatSep ? Math.round(base * 0.1) : 0;
      var sku = monthly ? id + (p === 'y' ? '-y' : '-m') : id;
      return { p: p, base: base, vat: vat, total: base + vat, sku: sku, idx: (AMP.idx || {})[sku] || '', label: it.name + (monthly ? (p === 'y' ? ' · 12개월' : ' · 1개월') : '') };
    }
    function paint() {
      var c = cur(), pay = (f.querySelector('input[name=pay]:checked') || {}).value;
      sum.innerHTML = '<div><span>상품 금액' + (/별도/.test(it.vat) ? '(부가세 별도)' : '') + '</span><b>' + won(c.base) + '</b></div>' +
        (pay === 'credit' ? '<div class="tot"><span>빠지는 크레딧</span><b>' + Math.round(c.base / 10).toLocaleString('ko-KR') + '크레딧</b></div>' :
        (c.vat ? '<div><span>부가세</span><b>' + won(c.vat) + '</b></div>' : '') +
        '<div class="tot"><span>결제 금액</span><b>' + won(c.total) + '</b></div>');
      go.textContent = pay === 'credit' ? Math.round(c.base / 10).toLocaleString('ko-KR') + '크레딧으로 주문하기' : pay === 'bank' ? '견적서 받기' : c.idx ? '성균관컨설팅 결제 페이지로' : '결제 링크 받기';
      var crw = f.querySelector('.k-buy-cr'); if (crw) crw.hidden = pay !== 'credit';
      var crn = f.querySelector('.crnote'); if (crn) crn.textContent = '충전해 둔 크레딧에서 ' + Math.round(c.base / 10).toLocaleString('ko-KR') + '크레딧(상품 금액 ' + won(c.base) + ', 1크레딧 10원)을 뺍니다. 개인 · 기업 크레딧 모두 됩니다.';
      if (pay === 'credit') crShow();
      var flow = f.querySelector('.k-buy-flow'); if (flow) flow.hidden = pay === 'credit';
      var nt = f.querySelector('.k-buy-note .nt'); if (nt) nt.textContent = pay === 'credit' ? '주문 뒤 영업일 하루 안에 크레딧을 빼고 시작 안내 메일을 드립니다.' : pay === 'bank' ? '입금이 확인되면 영업일 하루 안에 시작 안내 메일을 드립니다.' : '결제 뒤 영업일 하루 안에 시작 안내 메일을 드립니다.';
      var cn = f.querySelector('.cardnote'); if (cn) cn.textContent = c.idx ? '성균관컨설팅 결제 페이지에서 회원가입 없이 바로 결제합니다.' : '성균관컨설팅 결제 링크를 메일로 보내 드립니다. 회원가입 없이 결제합니다.';
      Array.prototype.forEach.call(f.querySelectorAll('.k-buy-per label, .k-buy-pay label'), function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
    }
    var cr = { code: '', st: '', left: null, t: 0 };   // st: '' | wait | ok | bad | off
    function crShow() {
      var b = f.querySelector('.k-buy-crb'); if (!b) return;
      var need = Math.round(cur().base / 10), n = function (x) { return Math.round(x).toLocaleString('ko-KR'); };
      b.hidden = !cr.st; b.className = 'k-buy-crb';
      if (cr.st === 'wait') b.innerHTML = '남은 크레딧을 확인하는 중…';
      else if (cr.st === 'ok' && cr.left >= need) b.innerHTML = '<span>남은 크레딧 <b>' + n(cr.left) + '</b>. 주문하면 영업일 하루 안에 ' + n(need) + '크레딧을 빼서 <b>' + n(cr.left - need) + '</b>크레딧이 남습니다.</span>';
      else if (cr.st === 'ok') { b.className += ' low'; b.innerHTML = '<span>남은 크레딧 <b>' + n(cr.left) + '</b>로는 <b>' + n(need - cr.left) + '</b>크레딧이 모자라요. <a href="' + root + 'pricing/#credits" target="_blank" rel="noopener">같은 코드에 충전</a>한 뒤 주문하세요.</span>'; }
      else if (cr.st === 'bad') { b.className += ' bad'; b.innerHTML = esc(cr.msg || '크레딧 코드를 확인해 주세요.'); }
      else if (cr.st === 'off') b.innerHTML = '지금은 남은 크레딧을 확인하지 못했어요. 주문을 받으면 담당자가 확인합니다.';
    }
    function crCheck() {
      var inp = f.querySelector('input[name=crcode]'); if (!inp) return;
      var code = normCode(inp.value);
      if (code.length > 16) { cr = { code: code, st: 'bad', left: null, msg: '크레딧 코드는 16자리입니다. 다시 확인해 주세요.' }; crShow(); return; }
      if (code.length !== 16) { cr = { code: '', st: '', left: null }; crShow(); return; }
      if (code === cr.code && cr.st) return;
      cr = { code: code, st: 'wait', left: null }; crShow();
      if (!AM.call) { cr.st = 'off'; crShow(); return; }
      var cid = sget('am_cid');
      AM.call('am.pass', cid ? { pass: fmtCode(code), cid: cid } : { pass: fmtCode(code) }, 20000).then(function (r) {
        if (cr.code !== code) return;
        if (r && r.ok && r.pass && r.pass.credit) { cr.st = 'ok'; cr.left = Math.max(0, +r.pass.cr || 0); sset('am_pass', fmtCode(code)); }
        else if (auto) { fallback(); return; }   // 저장돼 있던 예전 이용권 · 없는 코드: 알림 없이 카드로
        else if (r && r.ok && r.pass) { cr.st = 'bad'; cr.msg = '예전 이용권 코드는 결제에 쓸 수 없어요. 크레딧 코드를 넣어 주세요.'; }
        else { cr.st = 'bad'; cr.msg = (r && r.message) || '크레딧 코드를 확인해 주세요.'; }
        crShow();
      }).catch(function () { if (cr.code === code) { cr.st = 'off'; crShow(); } });
    }
    var ci = f.querySelector('input[name=crcode]');
    function fallback() { auto = false; var cd = f.querySelector('input[name=pay][value=card]'); if (cd) cd.checked = true; if (ci) ci.value = ''; cr = { code: '', st: '', left: null }; paint(); }
    if (ci) ci.addEventListener('input', function () { auto = false; var v = fmtCode(ci.value); if (v !== ci.value) ci.value = v; clearTimeout(cr.t); cr.t = setTimeout(crCheck, 350); });
    f.addEventListener('change', function (e) { if (e.target && e.target.name === 'pay') auto = false; paint(); });
    paint();
    if (saved) crCheck();
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.querySelector('.k-buy-x').addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    setTimeout(function () { var em = f.querySelector('input[name=email]'); if (em) em.focus(); }, 50);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = cur(), pay = (f.querySelector('input[name=pay]:checked') || {}).value, email = f.email.value.trim(), site = f.site.value.trim(), org = f.org.value.trim();
      function say(cls, html) { msg.className = 'k-buy-msg on ' + cls; msg.innerHTML = html; }
      if (!EMAIL_RE.test(email)) { say('err', '이메일을 확인해 주세요. 시작 안내와 영수증을 보내 드립니다.'); f.email.focus(); return; }
      var full = f.crcode ? normCode(f.crcode.value) : '', tail = full.slice(-4);
      if (pay === 'credit' && full.length !== 16) { say('err', '크레딧 코드 16자리를 넣어 주세요. 결제 메일에서 받은 코드입니다.'); if (f.crcode) f.crcode.focus(); return; }
      if (pay === 'credit' && cr.st === 'bad') { say('err', esc(cr.msg || '크레딧 코드를 확인해 주세요.')); return; }
      if (pay === 'credit' && cr.st === 'ok' && cr.left < Math.round(c.base / 10)) { say('err', '크레딧이 모자라요. 같은 코드에 충전한 뒤 주문하거나 다른 결제 방법을 고르세요.'); return; }
      var top = f.topup ? normCode(f.topup.value) : '';
      if (top && top.length < 4) { say('err', '더할 코드는 끝 4자리를 넣어 주세요. 비워 두면 새 코드를 보내 드립니다.'); f.topup.focus(); return; }
      top = top.slice(-4);
      if (!f.agree.checked) { say('err', '개인정보 수집 · 이용에 동의해 주세요.'); return; }
      go.disabled = true; var old = go.textContent; go.textContent = '처리하는 중…';
      var crN = Math.round(c.base / 10);
      var memo = '[주문] ' + c.label + ' · ' + (pay === 'credit' ? '크레딧 ' + crN.toLocaleString('ko-KR') + '크레딧(상품 금액 ' + won(c.base) + ', 코드 끝 ' + tail + (cr.st === 'ok' ? ', 확인한 남은 크레딧 ' + cr.left.toLocaleString('ko-KR') : '') + ')' : '결제 금액 ' + won(c.total) + (c.vat ? '(부가세 포함)' : '') + ' · ' + (pay === 'bank' ? '계좌이체 · 세금계산서' : c.idx ? '카드(성균관컨설팅 결제 페이지로 이동)' : '카드 결제 링크 요청')) + (top ? ' · 이미 받은 코드에 더하기(코드 끝 ' + top + ')' : '') + ' · 상품 코드 ' + c.sku;
      var lead = AM.call ? AM.call('am.lead', { kind: 'biz', plan: c.label, name: '', org: org || site || (email.split('@')[1] || '') || '개인 주문', contact: email, site: site, memo: memo, hp: '', ms: Date.now() - t0, src: (location.pathname + location.search).slice(0, 80) + ' 결제 시트' }, 15000) : Promise.reject(new Error('no AM'));
      if (pay === 'card' && c.idx) {
        var moved = false, url = String(AMP.shop).replace('%s', encodeURIComponent(c.idx));
        var t = setTimeout(function () { moved = true; location.href = url; }, 1800);
        lead.then(function () { if (!moved) { clearTimeout(t); location.href = url; } }, function () { if (!moved) { clearTimeout(t); location.href = url; } });
        say('ok', '성균관컨설팅 결제 페이지로 이동합니다. 회원가입 없이 비회원 주문서에서 결제하세요.');
        return;
      }
      lead.then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.message) || 'fail');
        say('ok', pay === 'credit' ? '주문을 받았습니다' + (r.id ? '(접수번호 ' + esc(r.id) + ')' : '') + '. 영업일 하루 안에 ' + crN.toLocaleString('ko-KR') + '크레딧을 빼고 <b>' + esc(email) + '</b>로 시작 안내를 보내 드립니다. 크레딧이 모자라면 먼저 알려 드립니다.' : '주문 요청을 받았습니다' + (r.id ? '(접수번호 ' + esc(r.id) + ')' : '') + '. 영업일 하루 안에 <b>' + esc(email) + '</b>로 ' + (pay === 'bank' ? '견적서와 입금 안내를' : '성균관컨설팅 결제 링크(카드 · 간편결제)를') + ' 보내 드립니다.');
        go.textContent = '요청 완료';
        if (window.gtag) try { window.gtag('event', 'begin_checkout', { items: [{ item_id: c.sku, item_name: c.label, price: c.total }] }); } catch (eG) { /* 무시 */ }
      }).catch(function () {
        var body = ['상품: ' + c.label, pay === 'credit' ? '크레딧: ' + crN.toLocaleString('ko-KR') + '크레딧(코드 끝 ' + tail + ')' : '결제 금액: ' + won(c.total), '결제 방법: ' + (pay === 'credit' ? '크레딧' : pay === 'bank' ? '계좌이체 · 세금계산서' : '카드 결제 링크'), top ? '더할 코드 끝: ' + top : '', '이메일: ' + email, '사이트: ' + site, '회사 · 이름: ' + org].filter(Boolean).join('\n');
        say('err', '지금 연결이 원활하지 않아요. <a href="mailto:contact@skkc.co.kr?subject=' + encodeURIComponent('[AIMarker 주문] ' + c.label) + '&body=' + encodeURIComponent(body) + '">메일로 주문하기</a>를 누르면 같은 내용이 전달됩니다.');
        go.disabled = false; go.textContent = old;
      });
    });
    return true;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-buy]');
    if (!b) return;
    if (open(b.getAttribute('data-buy'), b.getAttribute('data-per'), b)) e.preventDefault();
  });
  // 주소로 바로 열기: ?buy=label-standard&per=y
  try {
    var q = new URLSearchParams(location.search), id = q.get('buy');
    if (id && AMP.items[id]) setTimeout(function () { open(id, q.get('per')); }, 300);
  } catch (e) { /* 무시 */ }
  window.AMBuy = { open: open, close: close };
})();
