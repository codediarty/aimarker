/* AIMarker 공통 스크립트: 머리글 · 메뉴 · 복사 · 신청 양식 (2026.10) */
(function () {
  'use strict';
  var AM = window.AM = window.AM || {};
  AM.API = 'https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec';
  AM.MAIL = 'contact@skkc.co.kr';
  AM.root = document.body.getAttribute('data-root') || '';

  /* 서버 요청(text/plain이라 사전 확인 요청 없이 바로) */
  AM.call = function (action, data, timeoutMs) {
    var body = Object.assign({ action: action, _o: location.hostname }, data || {});
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 20000) : 0;
    return fetch(AM.API, { method: 'POST', body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined, redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (j) { return tokOf(action, j, data); })
      .finally(function () { if (t) clearTimeout(t); });
  };
  /* 13.1 이름 '크레딧' → '토큰', 13.2 단위 1토큰 = 100원.
     서버(PASS 1.2)는 아직 '크레딧'(1크레딧 = 10원)이라, 화면에 보이기 전에 이름과 숫자를 토큰으로 바꿈(10크레딧 = 1토큰).
     숫자: 충전 상품(cr · base), 단가(credit.cost), 토큰 코드(pass: cr · left · total · used · log), 충전 결과, 관리 화면 충전 · 차감 결과.
     글: 결제 · 충전 · 코드 응답은 전체를, 그 밖의 응답은 오류 문구와 pass 정보만(이용자가 넣은 글은 건드리지 않음).
     오류 응답의 left(남은 크레딧)는 토큰 코드인지 알 수 있는 곳(humanize.js)에서 AM.toTok 으로 바꿈 */
  var TOK_ALL = { 'am.pass': 1, 'am.passinfo': 1, 'am.buy': 1, 'am.payok': 1, 'am.adm': 1, 'am.lead': 1 };
  AM.TOK_WON = 100; AM.CR_WON = 10;   // 사이트 1토큰 = 100원, 서버 1크레딧 = 10원(am.passinfo credit.won 이 오면 그 값)
  function toTok(cr) { return typeof cr === 'number' && isFinite(cr) ? Math.round(cr * AM.CR_WON / AM.TOK_WON * 10) / 10 : cr; }
  function toCr(tk) { return Math.round((+tk || 0) * AM.TOK_WON / AM.CR_WON); }
  function fmtTok(x) { return (Math.round((+x || 0) * 10) / 10).toLocaleString('ko-KR', { maximumFractionDigits: 1 }); }
  AM.toTok = toTok; AM.toCr = toCr; AM.fmtTok = fmtTok;
  function numOf(s) { return +String(s).replace(/,/g, ''); }
  function tokS(v) {
    if (typeof v !== 'string' || v.indexOf('크레딧') < 0) return v;
    var N = '(\\d{1,3}(?:,\\d{3})+|\\d+)';   // 1,100 · 120 (뒤의 쉼표는 숫자가 아님)
    return v.replace(new RegExp(N + '\\s?크레딧', 'g'), function (m, n) { return fmtTok(toTok(numOf(n))) + '토큰'; })
      .replace(new RegExp('크레딧(\\s?)' + N, 'g'), function (m, sp, n) { return '토큰' + sp + fmtTok(toTok(numOf(n))); })
      .replace(/크레딧/g, '토큰');
  }
  function tokDeep(o, d) {
    if (o == null || d > 8) return o;
    if (typeof o === 'string') return tokS(o);
    if (Array.isArray(o)) return o.map(function (x) { return tokDeep(x, d + 1); });
    if (typeof o === 'object') { var r = {}; for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) r[k] = tokDeep(o[k], d + 1); return r; }
    return o;
  }
  function numTok(o, keys) { keys.forEach(function (k) { if (typeof o[k] === 'number') o[k] = toTok(o[k]); }); }
  function convPass(p) {   // 토큰 코드(예전 이용권은 횟수라 그대로)
    if (!p || typeof p !== 'object' || !p.credit) return;
    numTok(p, ['cr', 'left', 'total', 'used', 'added', 'taken', 'spent']);
    if (Array.isArray(p.log)) p.log.forEach(function (g) { if (g && typeof g === 'object') numTok(g, ['cr']); });
  }
  function tokOf(action, j, data) {
    if (!j || typeof j !== 'object') return j;
    if (action === 'am.passinfo' && j.credit && typeof j.credit === 'object' && !j.credit.tok) {
      if (+j.credit.won > 0) AM.CR_WON = +j.credit.won;
      var C = j.credit.cost || {};
      Object.keys(C).forEach(function (k) { if (C[k] && typeof C[k] === 'object') numTok(C[k], ['cr', 'min']); });
      j.credit.crWon = AM.CR_WON; j.credit.won = AM.TOK_WON; j.credit.tok = 1;
    }
    if (TOK_ALL[action]) {
      ['products', 'biz'].forEach(function (k) { if (Array.isArray(j[k])) j[k].forEach(function (p) { if (p && typeof p === 'object') numTok(p, ['cr', 'base']); }); });
      if (Array.isArray(j.passes)) j.passes.forEach(convPass);
      if (action === 'am.payok' && j.topup) numTok(j, ['added', 'left']);
      if (action === 'am.adm' && data && (data.op === 'topup' || data.op === 'deduct')) numTok(j, ['added', 'taken', 'left', 'total']);
    }
    if (j.pass && typeof j.pass === 'object') convPass(j.pass);
    if (TOK_ALL[action]) return tokDeep(j, 0);
    if (typeof j.message === 'string') j.message = tokS(j.message);
    if (j.pass && typeof j.pass === 'object') j.pass = tokDeep(j.pass, 0);
    return j;
  }
  AM.tok = tokS;
  /* 응답이 없을 때 한 번 더 보내기(2026.10.20): 서버가 요청을 받고도 시작하지 못해 응답 없이 멈추는 일이 있어
     앞부분 시간 안에 답이 없으면 같은 요청을 한 번만 다시 보냄. 결제 · 토큰 차감 요청에는 쓰지 않음(두 번 처리될 수 있어서) */
  AM.callRetry = function (action, data, timeoutMs, onRetry) {
    var total = timeoutMs || 60000, first = Math.min(30000, Math.round(total / 2));
    return AM.call(action, data, first).catch(function (e) {
      if (!e || (e.name !== 'AbortError' && e.name !== 'TypeError')) throw e;   // 시간 초과 · 연결 끊김만
      if (onRetry) { try { onRetry(); } catch (x) { /* 표시만 */ } }
      return AM.call(action, data, Math.max(20000, total - first));
    });
  };

  /* 머리글 그림자 */
  var hd = document.getElementById('hd');
  function onScroll() { if (hd) hd.classList.toggle('on', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* 모바일 메뉴 */
  var mb = document.getElementById('menuBtn'), mn = document.getElementById('mnav');
  if (mb && mn) {
    /* 11.0: 열면 단추가 닫기(X)로 바뀌고, Esc 로도 닫힘 */
    var ICO_MENU = '<path d="M4 6h16M4 12h16M4 18h16"/>', ICO_X = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';
    function setMenu(on) {
      if (on && hd) mn.style.top = Math.max(0, Math.round(hd.getBoundingClientRect().bottom)) + 'px';
      mn.classList.toggle('on', on); mb.setAttribute('aria-expanded', on ? 'true' : 'false');
      mb.setAttribute('aria-label', on ? '메뉴 닫기' : '메뉴 열기');
      var sv = mb.querySelector('svg'); if (sv) sv.innerHTML = on ? ICO_X : ICO_MENU;
      document.body.style.overflow = on ? 'hidden' : '';
    }
    mb.addEventListener('click', function () { setMenu(!mn.classList.contains('on')); });
    mn.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mn.classList.contains('on')) { setMenu(false); mb.focus(); } });
  }

  /* 복사 */
  AM.copy = function (text, btn) {
    function done() {
      if (!btn) return;
      var old = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', old);
      btn.classList.add('done');
      var span = btn.querySelector('span');
      if (span) { span.textContent = '복사했어요'; setTimeout(function () { span.textContent = old.trim(); btn.classList.remove('done'); }, 1600); }
    }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { /* 무시 */ } ta.remove();
    }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var el = document.querySelector(b.getAttribute('data-copy'));
    if (el) AM.copy(el.value !== undefined && el.tagName !== 'DIV' && el.tagName !== 'PRE' ? el.value : el.innerText, b);
  });

  /* 신청 · 문의 양식: <form data-lead="pre|biz|ext|partner"> */
  var EMAIL_RE = /^[^\s@]{1,64}@[A-Za-z0-9.\-]{1,120}\.[A-Za-z]{2,}$/;
  var TEL_RE = /(?:\+?82[\s.-]*|0)(1[016789]|2|[3-6]\d|70|50\d?)[\s.)-]*(\d{3,4})[\s.-]*(\d{4})/;
  function val(f, n) { var el = f.elements[n]; if (!el) return ''; if (el.length && el[0] && el[0].type === 'radio') { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return ''; } return String(el.value || '').trim(); }
  function show(f, cls, html) { var m = f.querySelector('.msg'); if (!m) return; m.className = 'msg on ' + cls; m.innerHTML = html; }
  Array.prototype.forEach.call(document.querySelectorAll('form[data-lead]'), function (f) {
    var t0 = Date.now();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var kind = f.getAttribute('data-lead');
      var d = { kind: kind, plan: val(f, 'plan'), name: val(f, 'name'), org: val(f, 'org'), contact: val(f, 'contact'), site: val(f, 'site'), memo: val(f, 'memo'), type: val(f, 'type'), hp: val(f, 'hp'), ms: Date.now() - t0, src: (location.pathname + location.search).slice(0, 80) + (document.referrer ? ' < ' + document.referrer.replace(/^https?:\/\//, '').slice(0, 60) : '') };
      if (!EMAIL_RE.test(d.contact) && !TEL_RE.test(d.contact)) { show(f, 'err', '이메일이나 휴대전화 번호를 적어 주세요.'); f.elements.contact && f.elements.contact.focus(); return; }
      if ((kind === 'biz' || kind === 'pilot') && d.org.length < 2) { show(f, 'err', '회사 · 기관 이름을 적어 주세요.'); f.elements.org && f.elements.org.focus(); return; }
      // 파일럿: 업종 · 월 소재 수 같은 추가 칸은 내용(memo) 앞에 붙여 보냄
      var extra = Array.prototype.filter.call(f.querySelectorAll('[data-extra]'), function (el) { return (el.type !== 'radio' || el.checked) && String(el.value || '').trim(); })
        .map(function (el) { return '[' + el.getAttribute('data-extra') + '] ' + String(el.value).trim(); });
      if (extra.length) d.memo = (extra.join(' · ') + (d.memo ? '\n' + d.memo : '')).slice(0, 1000);
      var agree = f.querySelector('input[name="agree"]');
      if (agree && !agree.checked) { show(f, 'err', '개인정보 수집 · 이용에 동의해 주세요.'); return; }
      var btn = f.querySelector('button[type="submit"]'); if (btn) { btn.disabled = true; btn.setAttribute('data-t', btn.innerHTML); btn.innerHTML = '보내는 중…'; }
      AM.call('am.lead', d).then(function (r) {
        if (r && r.ok) {
          show(f, 'ok', (kind === 'pilot' ? '문의가 접수되었습니다. 영업일 하루 안에 답하고, 원하시면 30분 통화와 무료 AI 검색 노출 진단 · 콘텐츠 100건 AI 사용 확인 리포트 일정을 잡겠습니다.' : kind === 'biz' ? '문의가 접수되었습니다. 담당자가 영업일 하루 안에 연락드립니다.' : kind === 'creator' ? '크리에이터 사전 등록이 접수되었습니다. 첫 의뢰 연결을 열 때 분야에 맞는 의뢰를 먼저 안내해 드립니다.' : '신청이 접수되었습니다. 열리면 먼저 알려 드립니다.') + (r.id ? ' <small>(접수번호 ' + r.id + ')</small>' : ''));
          f.reset(); t0 = Date.now();
          if (window.gtag) try { window.gtag('event', 'generate_lead', { method: kind }); } catch (eG) { /* 무시 */ }
        } else if (r && r.message && /^(CONTACT|ORG|NAME|SLOW|BUSY|MEMO)$/.test(r.code || '')) {
          show(f, 'err', r.message);
        } else { throw new Error(r && r.message || 'fail'); }
      }).catch(function () {
        var subj = '[AIMarker] ' + (kind === 'pilot' ? '문의 · 맞춤 견적' : kind === 'biz' ? '도입 문의' : kind === 'creator' ? '크리에이터 사전 등록' : '신청') + (d.plan ? ' · ' + d.plan : '');
        var bodyTxt = ['이름: ' + d.name, '회사 · 기관: ' + d.org, '연락처: ' + d.contact, '사이트: ' + d.site, '요금제: ' + d.plan, '구분: ' + d.type, '내용: ' + d.memo].join('\n');
        show(f, 'err', '지금 연결이 원활하지 않아요. <a href="mailto:' + AM.MAIL + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(bodyTxt) + '">메일로 보내기</a>를 눌러 주시면 같은 내용이 전달됩니다.');
      }).finally(function () { if (btn) { btn.disabled = false; btn.innerHTML = btn.getAttribute('data-t'); } });
    });
  });

  /* 요금제 단추 → 신청 양식에 요금제 채우기 */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-plan]');
    if (!a) return;
    var sel = document.querySelector('form[data-lead] [name="plan"]');
    if (sel) { sel.value = a.getAttribute('data-plan'); }
  });

  /* 예전 문의 주소(솔루션 페이지 #ask)는 문의 페이지로, 주소 뒤 조건은 그대로 */
  if (document.body.getAttribute('data-page') === 'business' && location.hash === '#ask') {
    location.replace((document.body.getAttribute('data-root') || '../') + 'contact/' + location.search);
  }

  /* 주소로 넘어온 요금제 · 문의 종류 채우기: ?plan=pro · ?type=install */
  (function () {
    var q = new URLSearchParams(location.search);
    var pq = String(q.get('plan') || '').toLowerCase(), plan = { 'label-standard': 'AI 마킹 스탠다드', 'label-business': 'AI 마킹 비즈니스', 'label-enterprise': 'AI 마킹 엔터프라이즈', 'geo-lite': 'AI 검색 라이트', 'geo-standard': 'AI 검색 스탠다드', 'geo-pro': 'AI 검색 프로', 'geo-enterprise': 'AI 검색 엔터프라이즈', 'geocare-care': 'AI 검색 관리', 'geocare-grow': 'AI 검색 관리', 'bundle-trust': 'AI 신뢰 올인원', 'service-starter': 'AI 서비스 마킹', 'service-growth': 'AI 서비스 마킹', 'service-enterprise': 'AI 서비스 마킹', install: '설치 대행', '기본 세팅': '기본 세팅', '쇼핑몰 세팅': '쇼핑몰 세팅', '브랜드 세팅': '브랜드 세팅', '자동 관리': '자동 관리', '성장 관리': '성장 관리', basic: 'AI 검색 스탠다드', setup: 'AI 검색 스탠다드', shop: 'AI 검색 프로', brand: 'AI 검색 엔터프라이즈', care: 'AI 검색 관리', grow: 'AI 검색 관리', starter: 'AI 마킹 스탠다드', growth: 'AI 검색 프로', business: 'AI 마킹 비즈니스', scale: 'AI 마킹 엔터프라이즈', agency: 'AI 마킹 엔터프라이즈', enterprise: 'AI 마킹 엔터프라이즈', license: 'AI 마킹 엔터프라이즈', private: 'AI 마킹 엔터프라이즈', expert: 'AI 마킹 엔터프라이즈', api: 'API', bulk: '대량 처리', ad: '광고 검수', addon: '광고 검수', pilot: '파일럿', free: '파일럿', pro: 'AI 검색 프로', biz: 'AI 마킹 비즈니스', geo: 'AI 검색 스탠다드', commerce: 'AI 검색 프로', compliance: 'AI 마킹 비즈니스', performance: '성과형' }[pq];
    var type = { commerce: '쇼핑몰, 이커머스', shop: '쇼핑몰, 이커머스', media: '언론, 미디어', news: '언론, 미디어', agency: '광고대행사, 브랜드', brand: '광고대행사, 브랜드', api: '플랫폼, AI 서비스', platform: '플랫폼, AI 서비스', ai: '플랫폼, AI 서비스', enterprise: '공공, 교육, 기관', public: '공공, 교육, 기관', univ: '공공, 교육, 기관', org: '공공, 교육, 기관', edu: '공공, 교육, 기관', invest: '투자, 제휴', partner: '투자, 제휴', ad: '투자, 제휴', install: '기타', creator: '기타' }[q.get('type') || ''];
    if (plan) { var ps = document.querySelector('form[data-lead] [name="plan"]'); if (ps) { if (ps.tagName === 'SELECT') ps.value = plan; else { var pr = document.querySelector('form[data-lead] input[name="plan"][value="' + plan + '"]'); if (pr) pr.checked = true; else ps.value = plan; } } }
    try {   // 일괄 확인 리포트에서 '이 결과로 상담 신청'을 누르면 요약을 내용 칸에(같은 창에서만, 서버로는 신청할 때만 감)
      var rm = sessionStorage.getItem('am_report_memo'), mf = document.querySelector('form[data-lead] [name="memo"]');
      if (rm && mf && !mf.value) { mf.value = rm.slice(0, 880); sessionStorage.removeItem('am_report_memo'); }
    } catch (eR) { /* 무시 */ }
    var site = (q.get('site') || '').replace(/[^\w.\-:/가-힣]/g, '').slice(0, 120);
    if (site) { var si = document.querySelector('form[data-lead] input[name="site"]'); if (si && !si.value) si.value = site; }
    var opt = (q.get('opt') || '').replace(/[<>"]/g, '').slice(0, 60);   // 8.0 추가 옵션 · 경쟁사 비교에서 넘어오면 내용 칸에
    if (opt) { var mo = document.querySelector('form[data-lead] [name="memo"]'); if (mo && !mo.value) mo.value = '관심 있는 것: ' + opt + '\n'; }
    if (type) {
      var r = document.querySelector('form[data-lead] input[name="type"][value="' + type + '"]');
      if (r) r.checked = true;
      else { var mm = document.querySelector('form[data-lead] [name="memo"]'); if (mm && !mm.value) mm.value = '[' + type + '] '; }
    }
  })();

  /* 휴대폰 아래 고정 줄: <div class="mbar" data-watch="#결과">, 결과 칸이 보이면 숨김 */
  Array.prototype.forEach.call(document.querySelectorAll('.mbar[data-watch]'), function (bar) {
    var target = document.querySelector(bar.getAttribute('data-watch'));
    if (!target || !('IntersectionObserver' in window)) return;
    var seen = false, past = false;
    function sync() { var on = past && !seen; bar.classList.toggle('on', on); bar.setAttribute('aria-hidden', on ? 'false' : 'true'); }
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; sync(); }).observe(target);
    window.addEventListener('scroll', function () { var p = window.scrollY > 520; if (p !== past) { past = p; sync(); } }, { passive: true });
  });

  /* 하위 페이지 차례: 지금 읽는 곳 강조 */
  var toc = document.querySelector('.toc4');
  if (toc && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var map = {};
    links.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) map[t.id] = a; });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('on'); });
        var a = map[e.target.id]; if (a) { a.classList.add('on'); var w = a.parentNode; if (w.scrollWidth > w.clientWidth) w.scrollTo({ left: a.offsetLeft - w.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' }); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io2.observe(document.getElementById(id)); });
  }
  /* 좁은 화면에서 표를 카드처럼 쌓을 때 쓸 칸 이름(머리글 글자)을 붙임 */
  Array.prototype.forEach.call(document.querySelectorAll('.kvt-wrap table'), function (t) {
    var hs = Array.prototype.map.call(t.querySelectorAll('thead th'), function (h) { return h.textContent.trim(); });
    if (!hs.length) return;
    Array.prototype.forEach.call(t.querySelectorAll('tbody tr'), function (tr) {
      Array.prototype.forEach.call(tr.children, function (c, i) { if (i && hs[i] && !c.hasAttribute('data-l')) c.setAttribute('data-l', hs[i]); });
    });
  });

  /* 탭 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-tabs]'), function (box) {
    var btns = box.querySelectorAll('.tabs button'), panes = box.querySelectorAll('.tabpane');
    Array.prototype.forEach.call(btns, function (b, i) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(btns, function (x, j) { x.setAttribute('aria-selected', i === j ? 'true' : 'false'); });
        Array.prototype.forEach.call(panes, function (p, j) { p.classList.toggle('on', i === j); });
      });
    });
  });
  AM.selectTab = function (box, key) {
    var b = box && box.querySelector('.tabs button[data-k="' + key + '"]');
    if (b) b.click();
  };

  /* 머리글 펼침 메뉴(무료 도구): 누르면 열고, 밖을 누르거나 Esc면 닫기 */
  Array.prototype.forEach.call(document.querySelectorAll('.nav .dd'), function (dd) {
    var b = dd.querySelector('button');
    function set(on) { dd.classList.toggle('open', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    b.addEventListener('click', function (e) { e.stopPropagation(); set(!dd.classList.contains('open')); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dd.classList.contains('open')) { set(false); b.focus(); } });
    dd.addEventListener('focusout', function (e) { if (!e.relatedTarget || !dd.contains(e.relatedTarget)) set(false); });
  });

  /* '무료로 시작' · '무료 진단' 단추: 홈에서는 진단 칸으로 내려가 바로 입력 */
  var homeScan = document.querySelector('[data-home-scan]');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href$="#scan"]');
    if (!a || !homeScan) return;
    e.preventDefault();
    homeScan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var inp = homeScan.querySelector('input'); if (inp) setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (eF) { inp.focus(); } }, 450);
    if (history.replaceState) history.replaceState(null, '', '#scan');
  });

  /* 홈 무료 진단(am.scan 2판 · 보수적 판정) */
  if (homeScan) {
    var out = document.getElementById('scanOut');
    var I = {
      ok: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
      warn: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
      info: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    };
    var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var root = AM.root || '';
    var LV = { confirmed: ['AI 사용 확인됨', 4], high: ['AI 사용 가능성 높음', 3], check: ['단서 있음', 2], low: ['단서 적음', 1] };
    var show = function (html) { out.hidden = false; out.innerHTML = html; };
    var btn = homeScan.querySelector('button[type="submit"]');
    var hostOf = function (u) { return u.replace(/^https?:\/\//i, '').replace(/[\/?#].*$/, '').toLowerCase(); };
    var simple = function (title, msg, foot) { return '<div class="res2"><div class="res2-h"><b>' + title + '</b></div><ul><li class="warn">' + I.warn + '<span>' + msg + '</span></li></ul>' + (foot ? '<div class="res2-f">' + foot + '</div>' : '<div style="height:12px"></div>') + '</div>'; };
    homeScan.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = String(homeScan.elements.url.value || '').trim();
      if (!/^(https?:\/\/)?[^\s\/?#:@]+\.[^\s\/?#:@]{2,}(\/\S*)?$/i.test(url)) { show(simple('사이트 주소를 확인해 주세요', '예: <b>myshop.co.kr</b>처럼 주소만 넣으면 됩니다.')); homeScan.elements.url.focus(); return; }
      var host = hostOf(url);
      btn.disabled = true; btn.querySelector('span').textContent = '진단 중…';
      show('<div class="res2"><div style="padding:18px;display:flex;gap:12px;align-items:center;color:var(--mute)"><span class="spin"></span><span><b>' + esc(host) + '</b> 첫 화면과 이미지 12장까지 살피는 중이에요. 10~20초 걸립니다.</span></div></div>');
      AM.call('am.scan', { url: url }, 60000).then(function (r) {
        if (!r || !r.ok) { show(simple('지금은 진단하지 못했어요', esc((r && r.message) || '사이트가 응답하지 않거나 외부 접속을 막고 있어요.'), '<a class="btn btn-p" href="' + root + 'check/">광고 문구 검사</a><a class="btn btn-g" href="' + root + 'app/">작업 공간 열기</a>')); return; }
        var im = r.images || {}, lv = r.level || (im.ai ? 'confirmed' : 'check'), L = LV[lv] || LV.check, items = [];
        // 이미지 막대: AI 기록 · 이름 · 주소 단서 · 크기 단서 · 편집 도구 · 확인 불가 · 카메라
        var seg = [['c-ai', im.ai || 0, 'AI 기록'], ['c-cue', (im.aiName || 0) + (im.aiHost || 0), 'AI 흔적(이름 · 주소)'], ['c-ed', (im.aiSize || 0) + (im.edited || 0), '크기 · 편집 도구 단서'], ['c-unk', (im.stripped || 0) + (im.failed || 0), '기록 없음 · 확인 불가'], ['c-cam', im.camera || 0, '카메라 원본']];
        var tot = Math.max(1, seg.reduce(function (a, x) { return a + x[1]; }, 0));
        var bar = (im.checked || im.failed) ? '<div class="imgbar"><div class="t"><span>이미지 ' + (im.checked + (im.failed || 0)) + '장 살핌</span><small>찾은 이미지 ' + (im.found || im.checked) + '장 중</small></div><div class="bar2">' + seg.filter(function (x) { return x[1]; }).map(function (x) { return '<i class="' + x[0] + '" style="width:' + (x[1] / tot * 100) + '%"></i>'; }).join('') + '</div>' +
          '<div class="lg">' + seg.filter(function (x) { return x[1]; }).map(function (x) { return '<span><i class="' + x[0] + '"></i>' + x[2] + ' ' + x[1] + '</span>'; }).join('') + '</div></div>' : '';
        if (r.platform && r.platform.name) items.push(['info', '<b>' + esc(r.platform.name) + '</b>(으)로 만든 사이트예요.' + (r.platform.key === 'imweb' ? ' 아임웹은 올린 이미지의 파일 기록을 지우는 경우가 많아, 기록이 없어도 AI를 사용하지 않았다는 뜻은 아니에요.' : '')]);
        (r.signals || []).forEach(function (sg) { items.push([/확인 불가|읽지 못함/.test(sg) ? 'info' : /카메라/.test(sg) ? 'ok' : 'warn', esc(sg)]); });
        if (r.chat && r.chat.length && !r.chatAi) items.push(['info', '상담 창(' + r.chat.slice(0, 3).map(esc).join(', ') + ')이 있어요. AI가 답한다면 대화 전에 알려야 할 수 있어요.']);
        if (r.labeled || r.disclosed) items.push(['ok', '사이트에서 AI 사용을 밝히는 표시 · 문구를 찾았어요.']);
        else if (lv === 'confirmed' || lv === 'high') items.push(['warn', 'AI 사용 단서가 있는데 사이트에서 밝히는 표시를 찾지 못했어요.']);
        if (r.ad && r.ad.items && r.ad.items.length) items.push([r.ad.high ? 'warn' : 'info', '광고 표현 확인 후보 ' + r.ad.n + '곳<div class="adl">' + r.ad.items.slice(0, 6).map(function (a) { return '<span class="' + (a.lv === 'high' ? 'hi' : '') + '" title="' + esc(a.why) + '">' + esc(a.t) + '</span>'; }).join('') + '</div>']);
        var name = r.siteName ? esc(String(r.siteName).slice(0, 40)) : esc(host);
        var meter = '<div class="res2-meter ' + lv + '">' + [1, 2, 3, 4].map(function (k) { return '<span class="' + (k <= L[1] ? 'on' : '') + '"></span>'; }).join('') + '</div><div class="lbls"><span>단서 적음</span><span>단서 있음</span><span>가능성 높음</span><span>확인됨</span></div>';
        var head = '<div class="res2-h"><div style="min-width:0"><b>' + name + '</b><small>' + esc(host) + '</small></div><span class="lvl2 ' + lv + '"><i></i>' + L[0] + '</span></div>';
        var foot = '<a class="btn btn-p" href="' + root + 'app/">소재째로 점검하기(무료)</a><a class="btn btn-g" href="' + root + 'site/?url=' + encodeURIComponent(url) + '">AI 마킹 · 자동 태그 붙이기</a>';
        show('<div class="res2">' + head + meter + bar + '<ul>' + items.map(function (it) { return '<li class="' + it[0] + '">' + I[it[0] === 'warn' ? 'warn' : it[0] === 'ok' ? 'ok' : 'info'] + '<span>' + it[1] + '</span></li>'; }).join('') + '</ul>' +
          '<p class="why">보수적으로 판단해요. 파일 기록이 지워진 이미지는 \'없음\'이 아니라 \'확인 불가\'로 세고, 광고 표현은 위험 후보일 뿐 위반 판단이 아니에요. 공개된 첫 화면만 읽었습니다.</p><div class="res2-f">' + foot + '</div></div>');
        if (window.gtag) try { window.gtag('event', 'scan', { result: lv }); } catch (eG) { /* 무시 */ }
      }).catch(function () {
        show(simple('지금은 진단이 어려워요', '잠시 뒤 다시 시도해 주세요. 광고 문구 검사는 바로 쓸 수 있어요.', '<a class="btn btn-p" href="' + root + 'check/">광고 문구 검사</a>'));
      }).finally(function () { btn.disabled = false; btn.querySelector('span').textContent = '무료 진단'; });
    });
  }

  /* 화면에 들어오면 막대 · 숫자 움직이기 */
  var counters = document.querySelectorAll('[data-count]'), inv = document.querySelectorAll('[data-inview]');
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-dec') || 0), suf = el.getAttribute('data-suffix') || '', t0 = 0, D = 1100;
    function fmt(v) { return (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ko-KR')) + suf; }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / D), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to); }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting) return; var el = en.target; io.unobserve(el); if (el.hasAttribute('data-count')) countUp(el); else el.classList.add('inview'); }); }, { threshold: 0.35 });
    Array.prototype.forEach.call(counters, function (el) { io.observe(el); });
    Array.prototype.forEach.call(inv, function (el) { io.observe(el); });
  } else { Array.prototype.forEach.call(inv, function (el) { el.classList.add('inview'); }); }

  /* ROI 계산기 */
  Array.prototype.forEach.call(document.querySelectorAll('[data-roi]'), function (box) {
    var $r = function (id) { return box.querySelector('#' + id); }, cut = 0.5;
    var PLANS = [[100, 'Starter', 99000], [1000, 'Business', 290000], [Infinity, 'Enterprise', 990000]];
    function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
    function calc() {
      var cnt = +$r('rCnt').value, min = +$r('rMin').value, wage = +$r('rWage').value;
      var hours = cnt * min / 60, cost = hours * wage, save = cost * cut, plan = PLANS.filter(function (p) { return cnt <= p[0]; })[0];
      var after = cost - save + plan[2], x = save / plan[2];
      $r('oCnt').textContent = cnt.toLocaleString('ko-KR') + '개'; $r('oMin').textContent = min + '분'; $r('oWage').textContent = won(wage);
      $r('oSave').textContent = won(save);
      $r('oX').textContent = '추천 요금제 ' + plan[1] + ' · ' + (x >= 1 ? '투자 대비 ' + x.toFixed(1) + '배' : '소재가 늘면 효과가 커져요');
      $r('vNow').textContent = won(cost); $r('vAfter').textContent = won(after);
      var mx = Math.max(cost, after, 1); $r('bNow').style.width = (cost / mx * 100) + '%'; $r('bAfter').style.width = (after / mx * 100) + '%';
      $r('oHours').textContent = (Math.round(hours * 10) / 10) + '시간 → ' + (Math.round(hours * (1 - cut) * 10) / 10) + '시간';
      $r('oPlan').textContent = plan[1] + ' 월 ' + won(plan[2]) + (plan[1] === 'Enterprise' ? '부터' : '');
    }
    ['rCnt', 'rMin', 'rWage'].forEach(function (id) { $r(id).addEventListener('input', calc); });
    $r('rCut').addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (!b) return; cut = +b.getAttribute('data-v'); Array.prototype.forEach.call($r('rCut').querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); calc(); });
    calc();
  });
})();
