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
          show(f, 'ok', (kind === 'biz' ? '문의가 접수되었습니다. 담당자가 영업일 하루 안에 연락드립니다.' : '베타 신청이 접수되었습니다. 2026년 12월 베타가 열리면 신청한 순서대로 연결 안내를 보내 드립니다.') + (r.id ? ' <small>(접수번호 ' + r.id + ')</small>' : ''));
          f.reset(); t0 = Date.now();
          if (window.gtag) try { window.gtag('event', 'generate_lead', { method: kind }); } catch (eG) { /* 무시 */ }
        } else if (r && r.message && /^(CONTACT|ORG|NAME|SLOW|BUSY|MEMO)$/.test(r.code || '')) {
          show(f, 'err', r.message);
        } else { throw new Error(r && r.message || 'fail'); }
      }).catch(function () {
        var subj = '[AIMarker] ' + (kind === 'biz' ? '도입 문의' : '베타 신청') + (d.plan ? ' · ' + d.plan : '');
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

  /* 주소로 넘어온 요금제 · 문의 종류 채우기: ?plan=pro · ?type=install */
  (function () {
    var q = new URLSearchParams(location.search);
    var plan = { pro: '프로 베타', biz: '비즈니스 베타', free: '무료' }[q.get('plan') || ''];
    var type = { install: '설치 도움', api: '플랫폼 · API', agency: '광고 · 대행사', univ: '대학 · 학회', org: '기업 · 기관', edu: '교육 · 컨설팅', ad: '제휴 · 광고' }[q.get('type') || ''];
    if (plan) { var ps = document.querySelector('form[data-lead] select[name="plan"]'); if (ps) ps.value = plan; }
    var site = (q.get('site') || '').replace(/[^\w.\-:/가-힣]/g, '').slice(0, 120);
    if (site) { var si = document.querySelector('form[data-lead] input[name="site"]'); if (si && !si.value) si.value = site; }
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

  /* 홈 무료 진단(am.scan) */
  if (homeScan) {
    var out = document.getElementById('scanOut');
    var I = {
      ok: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
      warn: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
      info: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    };
    var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var root = AM.root || '';
    var card = function (head, items, foot, why) {
      return '<div class="res">' + head + (items.length ? '<ul>' + items.map(function (it) { return '<li class="' + it[0] + '">' + I[it[0]] + '<span>' + it[1] + '</span></li>'; }).join('') + '</ul>' : '') + (why ? '<p class="why">' + why + '</p>' : '') + (foot ? '<div class="res-f">' + foot + '</div>' : '') + '</div>';
    };
    var show = function (html) { out.hidden = false; out.innerHTML = html; };
    var btn = homeScan.querySelector('button[type="submit"]');
    var hostOf = function (u) { return u.replace(/^https?:\/\//i, '').replace(/[\/?#].*$/, '').toLowerCase(); };
    homeScan.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = String(homeScan.elements.url.value || '').trim();
      if (!/^(https?:\/\/)?[^\s\/?#:@]+\.[^\s\/?#:@]{2,}(\/\S*)?$/i.test(url)) {
        show(card('<div class="res-h"><b>사이트 주소를 확인해 주세요</b></div>', [['info', '예: <b>myshop.co.kr</b> 처럼 주소만 넣으면 됩니다.']]));
        homeScan.elements.url.focus();
        return;
      }
      var host = hostOf(url);
      btn.disabled = true; btn.querySelector('span').textContent = '진단 중…';
      show('<div class="res"><div class="wait"><span class="spin"></span><span><b>' + esc(host) + '</b> 첫 화면을 읽고 있어요. 10초쯤 걸립니다.</span></div></div>');
      AM.call('am.scan', { url: url }, 45000).then(function (r) {
        if (!r || !r.ok) {
          show(card('<div class="res-h"><b>지금은 진단하지 못했어요</b></div>', [['warn', esc((r && r.message) || '사이트가 응답하지 않거나 외부 접속을 막고 있어요.')]],
            '<a class="btn btn-p" href="' + root + 'site/">표시 바로 만들기</a><a class="btn btn-g" href="' + root + 'beta/?site=' + encodeURIComponent(host) + '">베타 신청</a>'));
          return;
        }
        var items = [], need = 0;
        if (r.platform && r.platform.name) items.push(['info', '<b>' + esc(r.platform.name) + '</b>(으)로 만든 사이트예요. ' + (r.platform.key === 'imweb' ? '아임웹 앱이나 코드 한 줄로 붙일 수 있어요.' : '코드 한 줄로 붙일 수 있어요.')]);
        if (r.labeled) items.push(['ok', '이미 AI 표시가 붙어 있어요. 자동 탐지를 켜면 앞으로 올라올 콘텐츠도 빠짐없이 표시됩니다.']);
        else { items.push(['warn', '아직 사이트에서 AI 표시를 찾지 못했어요.']); need++; }
        if (r.chat && r.chat.length) {
          var names = r.chat.slice(0, 3).map(esc).join(', ');
          items.push(r.chatAi ? ['warn', 'AI 상담 창(' + names + ')이 있어요. 대화 전에 \'AI가 답변합니다\'를 알려야 할 수 있어요.'] : ['info', '상담 창(' + names + ')이 있어요. AI가 답한다면 대화 전 안내가 필요해요.']);
          if (r.chatAi) need++;
        }
        if (r.images && r.images.checked) {
          if (r.images.ai) { items.push(['warn', '이미지 ' + r.images.checked + '장 중 <b>' + r.images.ai + '장에서 AI 생성 기록</b>을 찾았어요.' + (r.images.c2pa ? ' 출처 정보(C2PA)가 든 이미지도 ' + r.images.c2pa + '장 있어요.' : '')]); need++; }
          else items.push(['info', '이미지 ' + r.images.checked + '장에서는 AI 생성 기록을 찾지 못했어요. 올릴 때 기록이 지워지는 경우가 많아, 여러 신호로 찾는 자동 탐지가 필요한 이유예요.']);
        }
        if (r.cues && r.cues.length) items.push(['info', '페이지에서 \'' + r.cues.slice(0, 3).map(esc).join('\', \'') + '\' 같은 AI 관련 문구를 찾았어요.']);
        var name = r.siteName ? esc(String(r.siteName).slice(0, 40)) : esc(host);
        var gauge = need ? '<span class="gauge g-warn">확인할 것 ' + need + '개</span>' : '<span class="gauge g-ok">좋아요</span>';
        var head = '<div class="res-h"><div class="who"><b>' + name + '</b></div>' + gauge + '</div>';
        var foot = '<a class="btn btn-p" href="' + root + 'beta/?site=' + encodeURIComponent(host) + '">이 사이트로 베타 신청</a><a class="btn btn-g" href="' + root + 'site/?url=' + encodeURIComponent(url) + '">무료 표시 바로 만들기</a>';
        show(card(head, items, foot, '공개된 첫 화면만 읽은 결과입니다. 자동 탐지는 새로 올라오는 콘텐츠를 계속 살핍니다.'));
        if (window.gtag) try { window.gtag('event', 'scan', { result: need ? 'needs' : 'ok' }); } catch (eG) { /* 무시 */ }
      }).catch(function () {
        show(card('<div class="res-h"><b>지금은 진단이 어려워요</b></div>', [['info', '잠시 뒤 다시 시도하거나, 업종만 골라 바로 표시를 만들 수 있어요.']],
          '<a class="btn btn-p" href="' + root + 'site/">표시 바로 만들기</a><a class="btn btn-g" href="' + root + 'beta/?site=' + encodeURIComponent(host) + '">베타 신청</a>'));
      }).finally(function () { btn.disabled = false; btn.querySelector('span').textContent = '무료 진단'; });
    });
  }
})();
