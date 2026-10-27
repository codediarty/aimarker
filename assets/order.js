/* AIMarker 결제 시트(10.0, 12.0 기업 토큰, 13.0 토큰 하나로): [data-buy="상품"] 단추 → 금액 확인 → 공식 결제처 성균관컨설팅 결제 페이지로(상품 번호가 없으면 결제 링크 받기 요청)
   13.0: 결제 방법 '토큰'(개인 · 기업 모든 토큰, 13.2 부터 1토큰 = 100원, 부가세 별도 상품 금액 기준). 이 브라우저에 저장된 코드가 있으면 먼저 고르고,
   남은 토큰은 am.pass(읽기만, 빼지 않음)로 바로 보여 줌. 주문 기록에는 코드 전체를 남기지 않고 끝 4자리만 남겨 담당자가 확인 뒤 뺌.
   저장된 코드가 토큰 코드가 아니면(예전 이용권 · 없는 코드) 조용히 카드로 돌아감. 기업 토큰 충전은 '이미 받은 코드에 더하기'(끝 4자리)를 받음.
   13.6: 카드 · 간편결제(결제 페이지가 있을 때)는 KAIEC 결제 창처럼 이메일 · 동의 없이 바로 성균관컨설팅 결제 페이지로(이름 · 이메일 · 동의는 그곳 주문서에서, 사이트 쪽 주문 기록 없음).
   이메일 · 사이트 · 회사 칸은 토큰 · 계좌이체 · 결제 링크 요청에만 보임.
   13.7: 시트를 간단하게(상품 · 기간 · 결제 금액 한 줄 · 성균관컨설팅 안내 두 문장 · 단추 하나). 토큰 · 계좌이체는 '다른 방법' 작은 단추로 펼침. 상품 · 요금은 assets/products.js(빌드에서 만듦). 카드 번호 같은 결제 정보는 이 사이트에서 받지 않습니다.
   13.11c: 결제 페이지(아임웹 상품)가 없는 상품은 원 가격 대신 토큰으로(tokFirst): '내는 토큰' → 이 상품을 낼 수 있는 기업 토큰 충전 둘(GEO 스타터 · 비즈니스 · 맥스, 아임웹 38~40) → 성균관컨설팅 결제 페이지.
   받은 토큰 코드로 내기 · 계좌이체 · 세금계산서로 충전은 '다른 방법'. 원으로 받는 '결제 링크 받기'는 이런 상품에 쓰지 않음. */
(function () {
  'use strict';
  var AMP = window.AMP, AM = window.AM || {};
  if (!AMP) return;
  var EMAIL_RE = /^[^\s@]{1,64}@[A-Za-z0-9.\-]{1,120}\.[A-Za-z]{2,}$/;
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  var TW = 100;   // 13.2 1토큰 = 100원(상품 금액 ÷ 100)
  function tokN(base) { return Math.round(base / TW); }
  function tn(x) { return (Math.round((+x || 0) * 10) / 10).toLocaleString('ko-KR', { maximumFractionDigits: 1 }); }
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
    if (document.documentElement.classList.contains('is-twa')) { if (window.AMTwaNote) window.AMTwaNote(); return true; }   // 13.11 플레이 스토어 앱: 결제 시트를 열지 않음
    var it = AMP.items[id];
    if (!it) return false;
    last = from || null;
    var hasY = !!it.y, monthly = it.per === '월', isCredit = /^credit-/.test(id), isLabel = /^label-/.test(id), isLocal = /^local-/.test(id), isGeo = /^geo(care)?-/.test(id), saved = isCredit ? '' : fmtCode(sget('am_pass')), auto = false;   // 13.7 저장된 코드가 있어도 카드가 기본(토큰은 '다른 방법'에서, 코드는 미리 채움)
    per = hasY ? (per === 'm' ? 'm' : 'y') : 'm';   // 13.8c 12개월이 있으면 12개월이 기본(정기구독 없이 선결제로 전환을 올림). 1개월은 '먼저 써 보기'
    // 13.11c 결제 페이지(아임웹 상품)가 없는 기업 상품(AI 검색 노출 최적화 세팅 · 월 관리 · AI 서비스 마킹 · 추가 옵션 · 묶음)은 원 가격 대신 토큰으로:
    // 기업 토큰(GEO 스타터 · 비즈니스 · 맥스, 아임웹 38~40)을 충전하거나(기본) 받은 토큰 코드로 주문. 원으로 받는 '결제 링크 받기'는 쓰지 않음
    var IDX = AMP.idx || {}, tokFirst = !isCredit && !(IDX[id] || IDX[id + '-m'] || IDX[id + '-y']), need0 = tokN(it.m), packs = [];
    if (tokFirst) {
      packs = ['credit-b10', 'credit-b30', 'credit-b100'].map(function (k) { var p = AMP.items[k]; return p && p.cr && IDX[k] ? { id: k, nm: String(p.name).replace(/\s*\(.*$/, ''), cr: p.cr, m: p.m, vat: /별도/.test(p.vat || '') } : null; }).filter(Boolean);
      var fit = packs.filter(function (p) { return p.cr >= need0; });
      packs = fit.length ? fit.slice(0, 2) : packs.slice(-1);   // 이 상품을 낼 수 있는 가장 작은 충전 + 그다음 하나
      if (!packs.length) tokFirst = false;
      else if (saved) auto = true;   // 이 브라우저에 토큰 코드가 있으면 그 코드로 먼저(토큰 코드가 아니면 조용히 충전으로 돌아감)
    }
    function pv(x) { return tokFirst ? tn(tokN(x)) + '토큰' : won(x); }   // 기간 칸 값(토큰으로 내는 상품은 토큰)
    function leftTxt(p) { var l = p.cr - need0; return l < 0 ? tn(-l) + '토큰이 모자라 한 번 더 충전합니다' : monthly ? Math.floor(p.cr / need0) + '개월 내고 ' + tn(p.cr % need0) + '토큰이 남습니다' : '주문하고도 ' + tn(l) + '토큰이 남습니다'; }
    var t0 = Date.now();
    box = document.createElement('div');
    box.className = 'k-buy';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'kbuyT');
    // 13.7 간단하게: 상품 · 기간 · 결제 금액 한 줄 · 성균관컨설팅 안내 두 문장 · 단추 하나. 토큰 · 계좌이체는 아래 작은 글자 단추로 펼침
    box.innerHTML = '<div class="k-buy-in"><button class="k-buy-x" type="button" aria-label="닫기">×</button>' +
      '<div class="k-buy-h"><small>' + esc(it.group) + '</small><h2 id="kbuyT">' + esc(it.name) + '</h2><p>' + esc(it.who) + '</p></div>' +
      '<form class="k-buy-b k-buy-s" novalidate>' +
      (hasY ? '<div class="k-buy-per" role="radiogroup" aria-label="결제 기간"><label class="' + (per === 'y' ? 'on' : '') + '"><input type="radio" name="per" value="y"' + (per === 'y' ? ' checked' : '') + '><b>12개월 한 번에 <em class="k-buy-rec">추천</em></b><span>' + pv(it.y) + ' · 10개월 값, 2개월 값 절약</span></label>' +
        '<label class="' + (per === 'm' ? 'on' : '') + '"><input type="radio" name="per" value="m"' + (per === 'm' ? ' checked' : '') + '><b>1개월 먼저 써 보기</b><span>' + pv(it.m) + ' · 언제든 12개월로</span></label></div>' : '') +
      '<div class="k-buy-sum k-buy-sum1" aria-live="polite"></div>' +
      (tokFirst ? '<div class="k-buy-per k-buy-pk' + (packs.length < 2 ? ' one' : '') + '" role="radiogroup" aria-label="충전할 기업 토큰">' + packs.map(function (p, i) {
        return '<label class="' + (i ? '' : 'on') + '"><input type="radio" name="pk" value="' + p.id + '"' + (i ? '' : ' checked') + '><b>' + esc(p.nm) + ' ' + tn(p.cr) + '토큰' + (i ? '' : ' <em class="k-buy-rec">추천</em>') + '</b><span>' + leftTxt(p) + '</span></label>';
      }).join('') + '</div>' : '') +
      '<span class="k-buy-payin" hidden><input type="radio" name="pay" value="card"' + (auto ? '' : ' checked') + '>' + (isCredit ? '' : '<input type="radio" name="pay" value="credit"' + (auto ? ' checked' : '') + '>') + '<input type="radio" name="pay" value="bank"></span>' +
      '<div class="k-buy-why" aria-live="polite"></div>' +
      '<div class="k-buy-alt" hidden><p class="k-buy-alth"><b class="t"></b><button type="button" class="k-buy-back" data-pay="card">' + (tokFirst ? '토큰 충전으로 돌아가기' : '토스페이 · 카드로 돌아가기') + '</button></p>' +
      (isCredit ? '' : '<div class="k-buy-f k-buy-cr" hidden><label><span>토큰 코드<em>필수</em></span><input type="text" name="crcode" maxlength="40" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" placeholder="XXXX-XXXX-XXXX-XXXX" value="' + esc(saved) + '"></label>' +
        '<div class="k-buy-crb" aria-live="polite" hidden></div><p class="k-buy-crn">' + (tokFirst ? '토큰이 없거나 모자라면 위의 <b>토큰 충전으로 돌아가기</b>를 눌러 먼저 충전하세요.' : '토큰이 없다면 <a href="' + root + 'pricing/#credits" target="_blank" rel="noopener">먼저 충전</a>하세요.') + '</p></div>') + '</div>' +
      '<div class="k-buy-info"><div class="k-buy-f"><label><span>받을 이메일<em>필수</em></span><input type="email" name="email" autocomplete="email" maxlength="80" placeholder="name@company.co.kr"></label>' +
      '<label><span>사이트 주소<em>선택</em></span><input type="text" name="site" inputmode="url" maxlength="120" placeholder="예: myshop.co.kr" spellcheck="false"></label>' +
      '<label><span>회사 · 이름<em>선택</em></span><input type="text" name="org" maxlength="60" autocomplete="organization" placeholder="세금계산서를 받을 곳"></label>' +
      (isCredit ? '<label><span>이미 받은 코드에 더하기<em>선택</em></span><input type="text" name="topup" maxlength="24" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="코드 끝 4자리(예: 8PLW)"></label>' : '') + '</div>' +
      '<p class="k-buy-priv">이메일은 주문 처리와 시작 안내에만 씁니다(<a href="' + root + 'privacy/" target="_blank" rel="noopener">개인정보처리방침</a>).</p></div>' +
      '<button class="k-btn k-btn-p k-buy-go" type="submit">결제하기</button>' +
      '<p class="k-buy-more"><span>다른 방법</span>' + (isCredit ? '' : '<button type="button" data-pay="credit">' + (tokFirst ? '받은 토큰 코드로 내기' : '토큰으로 내기') + (saved ? '<small>저장된 코드 ' + esc(saved.slice(-4)) + '</small>' : '') + '</button>') + '<button type="button" data-pay="bank">' + (tokFirst ? '계좌이체 · 세금계산서로 충전' : '계좌이체 · 세금계산서') + '</button></p>' +
      '<div class="k-buy-msg" role="status"></div>' +
      '<p class="k-buy-note"><span class="nt">결제 뒤 영업일 하루 안에 시작 안내 메일을 드립니다.</span> <a href="' + root + 'terms/" target="_blank" rel="noopener">이용약관 · 환불</a> · contact@skkc.co.kr</p>' +
      '</form></div>';
    document.body.appendChild(box);
    document.body.style.overflow = 'hidden';
    var f = box.querySelector('form'), sum = box.querySelector('.k-buy-sum'), go = box.querySelector('.k-buy-go'), msg = box.querySelector('.k-buy-msg');
    function cur() {
      var p = hasY ? (f.querySelector('input[name=per]:checked') || {}).value : 'm';
      var base = p === 'y' ? it.y : it.m, vatSep = /별도/.test(it.vat), vat = vatSep ? Math.round(base * 0.1) : 0;
      var sku = monthly ? id + (p === 'y' ? '-y' : '-m') : id;
      var r = { p: p, base: base, vat: vat, total: base + vat, sku: sku, idx: (AMP.idx || {})[sku] || '', label: it.name + (monthly ? (p === 'y' ? ' · 12개월' : ' · 1개월') : '') };
      if (tokFirst) {   // 13.11c 고른 기업 토큰 충전(아임웹 상품)
        var pv = (f.querySelector('input[name=pk]:checked') || {}).value, P = packs[0];
        packs.forEach(function (x) { if (x.id === pv) P = x; });
        r.pk = P; r.pkTotal = P.m + (P.vat ? Math.round(P.m * 0.1) : 0); r.pkIdx = IDX[P.id] || '';
      }
      return r;
    }
    function shopUrl(c) { return c.idx ? (/^https?:\/\//.test(String(c.idx)) ? String(c.idx) : String(AMP.shop).replace('%s', encodeURIComponent(c.idx))) : ''; }
    var ARROW = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
    function whyHtml(direct) {   // 13.7 성균관컨설팅으로 넘어가는 까닭을 두 문장으로(이해하기 쉽고 거부감 없게)
      return '<span class="k-buy-flow2" aria-hidden="true"><b>AIMarker</b>' + ARROW + '<b class="s">성균관컨설팅</b></span>' +
        '<p>' + (direct ? '결제는 AIMarker 운영사 <b>성균관컨설팅</b> 결제 페이지에서 합니다. 회원가입 없이 토스페이 · 카드 · 계좌이체로 결제할 수 있고, 영수증과 카드 명세서에는 성균관컨설팅으로 표시됩니다.'
          : 'AIMarker 운영사 <b>성균관컨설팅</b>의 결제 링크(토스페이 · 카드 · 계좌이체, 회원가입 없음)를 영업일 하루 안에 메일로 보내 드립니다. 영수증과 카드 명세서에는 성균관컨설팅으로 표시됩니다.') +
        (isLabel && direct ? ' 결제 뒤 시작 안내 메일에 사이트 주소와 관리자 초대만 회신하면 설치는 저희가 합니다.' : '') +
        (isLocal ? ' 결제 뒤 시작 안내 메일에 무료 진단에서 받은 가게 정보 파일만 회신하면, 영업일 하루 안에 AI 가게 페이지를 올리고 등록합니다.' : '') +
        (isGeo && direct ? ' 결제 뒤 시작 안내 메일에 사이트 주소만 회신하면, 영업일 하루 안에 ' + (/^geocare-/.test(id) ? '관리를' : '세팅을') + ' 시작합니다.' : '') + '</p>';   // 13.11d
    }
    function whyTok(c) {   // 13.11c 토큰으로 내는 기업 상품: 기업 토큰 충전 → 메일로 토큰 코드 → 회신하면 토큰을 빼고 시작(두 문장)
      return '<span class="k-buy-flow2" aria-hidden="true"><b>AIMarker</b>' + ARROW + '<b class="s">성균관컨설팅</b></span>' +
        '<p>충전은 운영사 <b>성균관컨설팅</b> 결제 페이지에서 회원가입 없이 하고, 영업일 하루 안에 토큰 코드를 메일로 보내 드립니다. ' +
        '그 메일에 사이트 주소와 고른 상품 이름(' + esc(it.name) + ')만 회신하면 토큰을 빼고 바로 시작합니다.</p>';
    }
    function paint() {
      var c = cur(), pay = (f.querySelector('input[name=pay]:checked') || {}).value, direct = pay === 'card' && !!(tokFirst ? c.pkIdx : c.idx), need = tokN(c.base);
      if (tokFirst) {   // 13.11c 상품 값은 토큰만. 원은 충전 결제 단추(충전할 때 내는 값)에만
        sum.innerHTML = '<div class="tot"><span>' + (monthly ? '매달 내는 토큰' : '내는 토큰') + '</span><b>' + tn(need) + '토큰</b></div>' +
          '<small>기업 토큰으로 내고, 남는 토큰은 다른 기능에 그대로 씁니다(1토큰 100원 기준, 부가세는 충전할 때).</small>';
        go.innerHTML = pay === 'credit' ? tn(need) + '토큰으로 주문하기' : pay === 'bank' ? '견적서 받기' : '<span>성균관컨설팅에서 ' + won(c.pkTotal) + ' 결제하기</span>' + ARROW;
      } else {
        sum.innerHTML = '<div class="tot"><span>' + (pay === 'credit' ? '빠지는 토큰' : '결제 금액') + '</span><b>' + (pay === 'credit' ? tn(need) + '토큰' : won(c.total)) + '</b></div>' +
          '<small>' + (pay === 'credit' ? '1토큰 100원 기준 · 부가세는 충전할 때 이미 냈습니다' : (isCredit ? '' : tn(need) + '토큰 · ') + (c.vat ? '부가세 포함 · 상품 금액 ' + won(c.base) + ' + 부가세 ' + won(c.vat) : '부가세 포함')) +   // 13.11d 사이트에 보이는 토큰과 결제 금액을 한 줄에
          (hasY && c.p === 'y' && pay !== 'credit' && it.m * 12 > it.y ? '<br>1개월씩 12번 내는 것보다 ' + won(it.m * 12 - it.y) + '(부가세 별도) 적게 냅니다' : '') + '</small>';   // 13.8c 12개월 절약액을 숫자로
        go.innerHTML = pay === 'credit' ? tn(need) + '토큰으로 주문하기' : pay === 'bank' ? '견적서 받기' : direct ? '<span>성균관컨설팅에서 ' + won(c.total) + ' 결제하기</span>' + ARROW : '결제 링크 받기';
      }
      var why = f.querySelector('.k-buy-why'); if (why) { why.hidden = pay !== 'card'; why.innerHTML = pay === 'card' ? (tokFirst ? whyTok(c) : whyHtml(direct)) : ''; }
      var alt = f.querySelector('.k-buy-alt'); if (alt) { alt.hidden = pay === 'card'; var t = alt.querySelector('.t'); if (t) t.textContent = pay === 'credit' ? (tokFirst ? '받은 토큰 코드로 내기' : '토큰으로 내기') : (tokFirst ? '계좌이체 · 세금계산서로 충전' : '계좌이체 · 세금계산서'); }
      var pkw = f.querySelector('.k-buy-pk'); if (pkw) pkw.hidden = pay === 'credit';
      var crw = f.querySelector('.k-buy-cr'); if (crw) crw.hidden = pay !== 'credit';
      if (pay === 'credit') crShow();
      var info = f.querySelector('.k-buy-info'); if (info) info.hidden = direct;
      var more = f.querySelector('.k-buy-more'); if (more) more.hidden = pay !== 'card';
      var nt = f.querySelector('.k-buy-note .nt'); if (nt) nt.textContent = pay === 'credit' ? '주문 뒤 영업일 하루 안에 토큰을 빼고 시작 안내 메일을 드립니다.' : pay === 'bank' ? (tokFirst ? '입금이 확인되면 영업일 하루 안에 토큰 코드와 시작 안내 메일을 드립니다.' : '입금이 확인되면 영업일 하루 안에 시작 안내 메일을 드립니다.') : tokFirst ? '충전 결제 뒤 영업일 하루 안에 결제할 때 적은 이메일로 토큰 코드를 보내 드립니다.' : monthly ? '결제 뒤 영업일 하루 안에 시작 안내 메일을 드립니다. 선결제라 자동으로 다시 결제되지 않고, 끝나기 7일 전에 안내 메일을 드립니다.' : '결제 뒤 영업일 하루 안에 결제할 때 적은 이메일로 시작 안내 메일을 드립니다.';
      Array.prototype.forEach.call(f.querySelectorAll('.k-buy-per label'), function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
    }
    var cr = { code: '', st: '', left: null, t: 0 };   // st: '' | wait | ok | bad | off
    function crShow() {
      var b = f.querySelector('.k-buy-crb'); if (!b) return;
      var need = tokN(cur().base), n = tn;
      b.hidden = !cr.st; b.className = 'k-buy-crb';
      if (cr.st === 'wait') b.innerHTML = '남은 토큰을 확인하는 중…';
      else if (cr.st === 'ok' && cr.left >= need) b.innerHTML = '<span>남은 토큰 <b>' + n(cr.left) + '</b>. 주문하면 영업일 하루 안에 ' + n(need) + '토큰을 빼서 <b>' + n(cr.left - need) + '</b>토큰이 남습니다.</span>';
      else if (cr.st === 'ok') { b.className += ' low'; b.innerHTML = '<span>남은 토큰 <b>' + n(cr.left) + '</b>로는 <b>' + n(need - cr.left) + '</b>토큰이 모자라요. <a href="' + root + 'pricing/#credits" target="_blank" rel="noopener">같은 코드에 충전</a>한 뒤 주문하세요.</span>'; }
      else if (cr.st === 'bad') { b.className += ' bad'; b.innerHTML = esc(cr.msg || '토큰 코드를 확인해 주세요.'); }
      else if (cr.st === 'off') b.innerHTML = '지금은 남은 토큰을 확인하지 못했어요. 주문을 받으면 담당자가 확인합니다.';
    }
    function crCheck() {
      var inp = f.querySelector('input[name=crcode]'); if (!inp) return;
      var code = normCode(inp.value);
      if (code.length > 16) { cr = { code: code, st: 'bad', left: null, msg: '토큰 코드는 16자리입니다. 다시 확인해 주세요.' }; crShow(); return; }
      if (code.length !== 16) { cr = { code: '', st: '', left: null }; crShow(); return; }
      if (code === cr.code && cr.st) return;
      cr = { code: code, st: 'wait', left: null }; crShow();
      if (!AM.call) { cr.st = 'off'; crShow(); return; }
      var cid = sget('am_cid');
      AM.call('am.pass', cid ? { pass: fmtCode(code), cid: cid } : { pass: fmtCode(code) }, 20000).then(function (r) {
        if (cr.code !== code) return;
        if (r && r.ok && r.pass && r.pass.credit) { cr.st = 'ok'; cr.left = Math.max(0, +r.pass.cr || 0); sset('am_pass', fmtCode(code)); }
        else if (auto) { fallback(); return; }   // 저장돼 있던 예전 이용권 · 없는 코드: 알림 없이 카드로
        else if (r && r.ok && r.pass) { cr.st = 'bad'; cr.msg = '예전 이용권 코드는 결제에 쓸 수 없어요. 토큰 코드를 넣어 주세요.'; }
        else { cr.st = 'bad'; cr.msg = (r && r.message) || '토큰 코드를 확인해 주세요.'; }
        crShow();
      }).catch(function () { if (cr.code === code) { cr.st = 'off'; crShow(); } });
    }
    var ci = f.querySelector('input[name=crcode]');
    function fallback() { auto = false; var cd = f.querySelector('input[name=pay][value=card]'); if (cd) cd.checked = true; if (ci) ci.value = ''; cr = { code: '', st: '', left: null }; paint(); }
    if (ci) ci.addEventListener('input', function () { auto = false; var v = fmtCode(ci.value); if (v !== ci.value) ci.value = v; clearTimeout(cr.t); cr.t = setTimeout(crCheck, 350); });
    f.addEventListener('change', function (e) { if (e.target && e.target.name === 'pay') auto = false; paint(); });
    f.addEventListener('click', function (e) { var pb = e.target.closest && e.target.closest('[data-pay]'); if (!pb) return; e.preventDefault(); var r = f.querySelector('input[name=pay][value=' + pb.getAttribute('data-pay') + ']'); if (r) { r.checked = true; auto = false; paint(); if (r.value === 'credit') { if (ci && normCode(ci.value).length === 16) crCheck(); if (ci && !ci.value) { ci.focus(); return; } } var em = f.querySelector('input[name=email]'); if (r.value !== 'card' && em) em.focus(); } });
    paint();
    if (auto && ci && normCode(ci.value).length === 16) crCheck();   // 13.11c 저장된 토큰 코드로 먼저 연 경우 남은 토큰을 바로 보여 줌
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.querySelector('.k-buy-x').addEventListener('click', close);
    var lt = f.querySelector('.k-buy-later'); if (lt) lt.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    setTimeout(function () { if (!box) return; var info = f.querySelector('.k-buy-info'), em = f.querySelector('input[name=email]'), inn = box.querySelector('.k-buy-in'); if (info && info.hidden) { if (inn) { inn.setAttribute('tabindex', '-1'); try { inn.focus({ preventScroll: true }); } catch (eF) { /* 그대로 */ } } } else if (em) em.focus(); }, 50);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = cur(), pay = (f.querySelector('input[name=pay]:checked') || {}).value, email = f.email.value.trim(), site = f.site.value.trim(), org = f.org.value.trim();
      function say(cls, html) { msg.className = 'k-buy-msg on ' + cls; msg.innerHTML = html; }
      if (pay === 'card' && (tokFirst ? c.pkIdx : c.idx)) {   // 13.6 KAIEC 처럼 바로: 묻는 것 없이 성균관컨설팅 결제 페이지로(이름 · 이메일 · 동의는 그곳 주문서에서). 사이트 쪽 주문 기록은 남기지 않음(결제 내역이 기준). 13.11c 토큰으로 내는 상품은 고른 기업 토큰 충전 페이지로
        go.disabled = true; say('ok', '운영사 성균관컨설팅 결제 페이지로 이동합니다. 회원가입 없이 비회원 주문서에서 결제하면 되고, 영수증과 카드 명세서에는 성균관컨설팅으로 표시됩니다.');
        if (window.gtag) try { window.gtag('event', 'begin_checkout', { items: [tokFirst ? { item_id: c.pk.id, item_name: c.pk.nm + ' · ' + c.label, price: c.pkTotal } : { item_id: c.sku, item_name: c.label, price: c.total }] }); } catch (eG0) { /* 무시 */ }
        location.href = tokFirst ? shopUrl({ idx: c.pkIdx }) : shopUrl(c);
        return;
      }
      if (!EMAIL_RE.test(email)) { say('err', '이메일을 확인해 주세요. 시작 안내와 영수증을 보내 드립니다.'); f.email.focus(); return; }
      var full = f.crcode ? normCode(f.crcode.value) : '', tail = full.slice(-4);
      if (pay === 'credit' && full.length !== 16) { say('err', '토큰 코드 16자리를 넣어 주세요. 결제 메일에서 받은 코드입니다.'); if (f.crcode) f.crcode.focus(); return; }
      if (pay === 'credit' && cr.st === 'bad') { say('err', esc(cr.msg || '토큰 코드를 확인해 주세요.')); return; }
      if (pay === 'credit' && cr.st === 'ok' && cr.left < tokN(c.base)) { say('err', '토큰이 모자라요. 같은 코드에 충전한 뒤 주문하거나 다른 결제 방법을 고르세요.'); return; }
      var top = f.topup ? normCode(f.topup.value) : '';
      if (top && top.length < 4) { say('err', '더할 코드는 끝 4자리를 넣어 주세요. 비워 두면 새 코드를 보내 드립니다.'); f.topup.focus(); return; }
      top = top.slice(-4);
      go.disabled = true; var old = go.innerHTML; go.textContent = '처리하는 중…';
      var crN = tokN(c.base);
      var tb = tokFirst && pay === 'bank';   // 13.11c 토큰으로 내는 상품의 계좌이체는 기업 토큰 충전 견적(쓸 곳을 함께 적음)
      var memo = tb ? '[주문] ' + c.pk.nm + ' ' + tn(c.pk.cr) + '토큰 충전 · 계좌이체 · 세금계산서 · 결제 금액 ' + won(c.pkTotal) + '(부가세 포함) · 쓸 곳 ' + c.label + ' ' + crN.toLocaleString('ko-KR') + '토큰 · 상품 코드 ' + c.pk.id + ' → ' + c.sku : '[주문] ' + c.label + ' · ' + (pay === 'credit' ? '토큰 ' + crN.toLocaleString('ko-KR') + '토큰(상품 금액 ' + won(c.base) + ', 코드 끝 ' + tail + (cr.st === 'ok' ? ', 확인한 남은 토큰 ' + tn(cr.left) : '') + ')' : '결제 금액 ' + won(c.total) + (c.vat ? '(부가세 포함)' : '') + ' · ' + (pay === 'bank' ? '계좌이체 · 세금계산서' : '카드 결제 링크 요청')) + (top ? ' · 이미 받은 코드에 더하기(코드 끝 ' + top + ')' : '') + ' · 상품 코드 ' + c.sku;
      var lead = AM.call ? AM.call('am.lead', { kind: 'biz', plan: tb ? c.pk.nm + ' 충전(' + c.label + ')' : c.label, name: '', org: org || site || (email.split('@')[1] || '') || '개인 주문', contact: email, site: site, memo: memo, hp: '', ms: Date.now() - t0, src: (location.pathname + location.search).slice(0, 80) + ' 결제 시트' }, 15000) : Promise.reject(new Error('no AM'));
      lead.then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.message) || 'fail');
        say('ok', pay === 'credit' ? '주문을 받았습니다' + (r.id ? '(접수번호 ' + esc(r.id) + ')' : '') + '. 영업일 하루 안에 ' + crN.toLocaleString('ko-KR') + '토큰을 빼고 <b>' + esc(email) + '</b>로 시작 안내를 보내 드립니다. 토큰이 모자라면 먼저 알려 드립니다.' : '주문 요청을 받았습니다' + (r.id ? '(접수번호 ' + esc(r.id) + ')' : '') + '. 영업일 하루 안에 <b>' + esc(email) + '</b>로 ' + (pay === 'bank' ? '견적서와 입금 안내를' : '성균관컨설팅 결제 링크(토스페이 · 카드)를') + ' 보내 드립니다.');
        go.textContent = '요청 완료';
        if (window.gtag) try { window.gtag('event', 'begin_checkout', { items: [{ item_id: c.sku, item_name: c.label, price: c.total }] }); } catch (eG) { /* 무시 */ }
      }).catch(function () {
        var body = ['상품: ' + c.label, pay === 'credit' ? '토큰: ' + crN.toLocaleString('ko-KR') + '토큰(코드 끝 ' + tail + ')' : tb ? '충전: ' + c.pk.nm + ' ' + tn(c.pk.cr) + '토큰 · 결제 금액 ' + won(c.pkTotal) + '(부가세 포함)' : '결제 금액: ' + won(c.total), '결제 방법: ' + (pay === 'credit' ? '토큰' : pay === 'bank' ? '계좌이체 · 세금계산서' : '카드 결제 링크'), top ? '더할 코드 끝: ' + top : '', '이메일: ' + email, '사이트: ' + site, '회사 · 이름: ' + org].filter(Boolean).join('\n');
        say('err', '지금 연결이 원활하지 않아요. <a href="mailto:contact@skkc.co.kr?subject=' + encodeURIComponent('[AIMarker 주문] ' + c.label) + '&body=' + encodeURIComponent(body) + '">메일로 주문하기</a>를 누르면 같은 내용이 전달됩니다.');
        go.disabled = false; go.innerHTML = old;
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
