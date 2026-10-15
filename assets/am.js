/* AIMarker 공통 스크립트: 머리글 · 메뉴 · 복사 · 신청 양식 (2026.10) */
(function () {
  'use strict';
  var AM = window.AM = window.AM || {};
  AM.API = 'https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec';
  AM.MAIL = 'contact@skkc.co.kr';
  AM.root = document.body.getAttribute('data-root') || '';

  /* 서버 요청(text/plain 이라 사전 확인 요청 없이 바로) */
  AM.call = function (action, data, timeoutMs) {
    var body = Object.assign({ action: action, _o: location.hostname }, data || {});
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, timeoutMs || 20000) : 0;
    return fetch(AM.API, { method: 'POST', body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined, redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .finally(function () { if (t) clearTimeout(t); });
  };

  /* 머리글 그림자 */
  var hd = document.getElementById('hd');
  function onScroll() { if (hd) hd.classList.toggle('on', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* 모바일 메뉴 */
  var mb = document.getElementById('menuBtn'), mn = document.getElementById('mnav');
  if (mb && mn) {
    mb.addEventListener('click', function () {
      var on = !mn.classList.contains('on');
      mn.classList.toggle('on', on); mb.setAttribute('aria-expanded', on ? 'true' : 'false');
      document.body.style.overflow = on ? 'hidden' : '';
    });
    mn.addEventListener('click', function (e) { if (e.target.closest('a')) { mn.classList.remove('on'); document.body.style.overflow = ''; mb.setAttribute('aria-expanded', 'false'); } });
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
      if (kind === 'biz' && d.org.length < 2) { show(f, 'err', '회사 · 기관 이름을 적어 주세요.'); f.elements.org && f.elements.org.focus(); return; }
      var agree = f.querySelector('input[name="agree"]');
      if (agree && !agree.checked) { show(f, 'err', '개인정보 수집 · 이용에 동의해 주세요.'); return; }
      var btn = f.querySelector('button[type="submit"]'); if (btn) { btn.disabled = true; btn.setAttribute('data-t', btn.innerHTML); btn.innerHTML = '보내는 중…'; }
      AM.call('am.lead', d).then(function (r) {
        if (r && r.ok) {
          show(f, 'ok', (kind === 'biz' ? '문의가 접수되었습니다. 담당자가 영업일 하루 안에 연락드립니다.' : '신청되었습니다. 열리는 날 가장 먼저 알려 드릴게요.') + (r.id ? ' <small>(접수번호 ' + r.id + ')</small>' : ''));
          f.reset(); t0 = Date.now();
          if (window.gtag) try { window.gtag('event', 'generate_lead', { method: kind }); } catch (eG) { /* 무시 */ }
        } else if (r && r.message && /^(CONTACT|ORG|NAME|SLOW|BUSY|MEMO)$/.test(r.code || '')) {
          show(f, 'err', r.message);
        } else { throw new Error(r && r.message || 'fail'); }
      }).catch(function () {
        var subj = '[AIMarker] ' + (kind === 'biz' ? '도입 문의' : '사전 신청') + (d.plan ? ' · ' + d.plan : '');
        var bodyTxt = ['이름: ' + d.name, '회사 · 기관: ' + d.org, '연락처: ' + d.contact, '사이트: ' + d.site, '요금제: ' + d.plan, '내용: ' + d.memo].join('\n');
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

  /* 주소로 넘어온 요금제 · 문의 종류 채우기: ?plan=pro · ?type=install */
  (function () {
    var q = new URLSearchParams(location.search);
    var plan = { plus: '플러스', pro: '프로', biz: '비즈니스', api: '플랫폼 · 기관' }[q.get('plan') || ''];
    var type = { install: '설치 도움', api: '플랫폼 · API', agency: '광고 · 대행사', univ: '대학 · 학회', org: '기업 · 기관', ad: '제휴 · 광고' }[q.get('type') || ''];
    if (plan) { var ps = document.querySelector('form[data-lead] select[name="plan"]'); if (ps) ps.value = plan; }
    if (type) {
      var r = document.querySelector('form[data-lead] input[name="type"][value="' + type + '"]');
      if (r) r.checked = true;
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
})();
