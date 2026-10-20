/* AIMarker 결제 시트(10.0): [data-buy="상품"] 단추 → 금액 확인 → 공식 결제처 성균관컨설팅 결제 페이지로(상품 번호가 없으면 결제 링크 받기 요청)
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
    var hasY = !!it.y, monthly = it.per === '월';
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
      '<label><span>회사 · 이름<em>선택</em></span><input type="text" name="org" maxlength="60" autocomplete="organization" placeholder="세금계산서를 받을 곳"></label></div>' +
      '<div class="k-buy-pay" role="radiogroup" aria-label="결제 방법">' +
      '<label class="on"><input type="radio" name="pay" value="card" checked><span><b>카드 · 간편결제</b><small class="cardnote">성균관컨설팅 결제 페이지에서 회원가입 없이 결제합니다.</small></span></label>' +
      '<label><input type="radio" name="pay" value="bank"><span><b>계좌이체 · 세금계산서</b><small>견적서와 입금 안내를 메일로 보내 드립니다.</small></span></label></div>' +
      '<div class="k-buy-flow" aria-hidden="true"><b>AIMarker</b>' + '→' + '<b class="sk">성균관컨설팅</b><span>공식 결제처 · 카드 명세서에 성균관컨설팅으로 표시</span></div>' +
      '<label class="k-buy-ok"><input type="checkbox" name="agree"><span>주문 처리와 시작 안내를 위해 이메일, 사이트 주소, 회사 이름을 받는 데 동의합니다(<a href="' + root + 'privacy/" target="_blank" rel="noopener">개인정보처리방침</a>). 결제 정보는 이 사이트에서 받지 않습니다.</span></label>' +
      '<button class="k-btn k-btn-p k-buy-go" type="submit">결제 페이지로</button>' +
      '<div class="k-buy-msg" role="status"></div>' +
      '<p class="k-buy-note">결제 뒤 영업일 하루 안에 시작 안내 메일을 드립니다. ' + (monthly ? '월 요금제는 다음 달 결제를 하지 않으면 끝납니다. ' : '') + '환불은 <a href="' + root + 'terms/" target="_blank" rel="noopener">이용약관</a>을 따릅니다. 문의 contact@skkc.co.kr</p>' +
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
        (c.vat ? '<div><span>부가세</span><b>' + won(c.vat) + '</b></div>' : '') +
        '<div class="tot"><span>결제 금액</span><b>' + won(c.total) + '</b></div>';
      go.textContent = pay === 'bank' ? '견적서 받기' : c.idx ? '성균관컨설팅 결제 페이지로' : '결제 링크 받기';
      var cn = f.querySelector('.cardnote'); if (cn) cn.textContent = c.idx ? '성균관컨설팅 결제 페이지에서 회원가입 없이 바로 결제합니다.' : '성균관컨설팅 결제 링크를 메일로 보내 드립니다. 회원가입 없이 결제합니다.';
      Array.prototype.forEach.call(f.querySelectorAll('.k-buy-per label, .k-buy-pay label'), function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
    }
    f.addEventListener('change', paint);
    paint();
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.querySelector('.k-buy-x').addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    setTimeout(function () { var em = f.querySelector('input[name=email]'); if (em) em.focus(); }, 50);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = cur(), pay = (f.querySelector('input[name=pay]:checked') || {}).value, email = f.email.value.trim(), site = f.site.value.trim(), org = f.org.value.trim();
      function say(cls, html) { msg.className = 'k-buy-msg on ' + cls; msg.innerHTML = html; }
      if (!EMAIL_RE.test(email)) { say('err', '이메일을 확인해 주세요. 시작 안내와 영수증을 보내 드립니다.'); f.email.focus(); return; }
      if (!f.agree.checked) { say('err', '개인정보 수집 · 이용에 동의해 주세요.'); return; }
      go.disabled = true; var old = go.textContent; go.textContent = '처리하는 중…';
      var memo = '[주문] ' + c.label + ' · 결제 금액 ' + won(c.total) + (c.vat ? '(부가세 포함)' : '') + ' · ' + (pay === 'bank' ? '계좌이체 · 세금계산서' : c.idx ? '카드(성균관컨설팅 결제 페이지로 이동)' : '카드 결제 링크 요청') + ' · 상품 코드 ' + c.sku;
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
        say('ok', '주문 요청을 받았습니다' + (r.id ? '(접수번호 ' + esc(r.id) + ')' : '') + '. 영업일 하루 안에 <b>' + esc(email) + '</b>로 ' + (pay === 'bank' ? '견적서와 입금 안내를' : '성균관컨설팅 결제 링크(카드 · 간편결제)를') + ' 보내 드립니다.');
        go.textContent = '요청 완료';
        if (window.gtag) try { window.gtag('event', 'begin_checkout', { items: [{ item_id: c.sku, item_name: c.label, price: c.total }] }); } catch (eG) { /* 무시 */ }
      }).catch(function () {
        var body = ['상품: ' + c.label, '결제 금액: ' + won(c.total), '결제 방법: ' + (pay === 'bank' ? '계좌이체 · 세금계산서' : '카드 결제 링크'), '이메일: ' + email, '사이트: ' + site, '회사 · 이름: ' + org].join('\n');
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
