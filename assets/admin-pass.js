/* AIMarker 이용권 관리(/admin/pass/?t=…): 운영자 메일로 받은 서명 링크로만 열림. 주문 확인 · 이용권 보내기 · 직접 만들기 · 중지 */
(function () {
  'use strict';
  var AM = window.AM || {}, $ = function (s) { return document.querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n2(n) { return Number(n || 0).toLocaleString('ko-KR'); }
  function sget(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function sset(k, v) { try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch (e) { /* 이 창에서만 */ } }
  function say(el, text, kind) { if (!el) return; el.textContent = text || ''; el.className = 'msg' + (text ? ' on ' + (kind || 'err') : ''); }
  function toast(m) { var t = $('#admToast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, 3600); }
  function call(op, data) {
    return AM.call('am.adm', Object.assign({ op: op, t: T }, data || {}), 45000).then(function (r) { if (!r || !r.ok) throw r || {}; return r; });
  }

  /* 관리 링크: 주소의 t 는 이 창에만 기억하고 주소에서 지움(화면 공유 · 방문 기록에 남지 않게) */
  var q = new URLSearchParams(location.search), T = q.get('t') || sget('am_adm_t'), ORDER = (q.get('order') || '').toUpperCase().replace(/[^A-Z0-9\-]/g, '');
  if (q.get('t')) { sset('am_adm_t', q.get('t')); try { history.replaceState(null, '', location.pathname + (ORDER ? '?order=' + encodeURIComponent(ORDER) : '')); } catch (e) { /* 주소 그대로 */ } }
  var D = null, PROD = {};

  function gate(why) {
    T = ''; sset('am_adm_t', '');
    $('#admMain').hidden = true; $('#admGate').hidden = false; $('#admExp').textContent = '';
    say($('#admGateMsg'), why || '', 'err');
  }
  $('#admLink').addEventListener('click', function () {
    var b = this; b.disabled = true; say($('#admGateMsg'), '보내는 중…', 'ok');
    AM.call('am.adm', { op: 'link' }, 30000).then(function (r) {
      if (!r || !r.ok) throw r || {};
      say($('#admGateMsg'), '운영자 메일로 관리 링크를 보냈습니다. 메일의 단추를 눌러 들어오세요(스팸함도 확인해 주세요).', 'ok');
    }).catch(function (e) { say($('#admGateMsg'), (e && e.message) || '보내지 못했습니다. 잠시 뒤 다시 눌러 주세요.'); })
      .then(function () { setTimeout(function () { b.disabled = false; }, 4000); });
  });

  /* 두 번 눌러 확인(브라우저 확인 창 대신) */
  function twice(btn, label) {
    if (btn.getAttribute('data-arm') === '1') { clearTimeout(btn._t); btn.removeAttribute('data-arm'); btn.classList.remove('arm'); btn.textContent = btn._old || btn.textContent; return true; }
    btn._old = btn.textContent; btn.setAttribute('data-arm', '1'); btn.classList.add('arm'); btn.textContent = label || '한 번 더 누르면 실행';
    clearTimeout(btn._t); btn._t = setTimeout(function () { btn.removeAttribute('data-arm'); btn.classList.remove('arm'); btn.textContent = btn._old; }, 4000);
    return false;
  }

  function load() {
    if (!T) return gate('');
    $('#admGate').hidden = true; $('#admMain').hidden = false;
    var m = /^(\d{4})-(\d{2})-(\d{2})\./.exec(T); $('#admExp').textContent = m ? '관리 링크 ' + m[1] + '.' + m[2] + '.' + m[3] + '까지' : '';
    return call('list').then(function (r) { D = r; PROD = {}; (r.products || []).forEach(function (p) { PROD[p.name] = p; PROD[p.id] = p; }); render(); })
      .catch(function (e) { if (e && e.code === 'ADMIN') gate(e.message); else toast((e && e.message) || '목록을 불러오지 못했습니다. 새로 고침을 눌러 주세요.'); });
  }

  function badge(st) {
    var k = /보냄|사용/.test(st) ? 'ok' : /대기|만듦/.test(st) ? 'wait' : /중지|취소|환불/.test(st) ? 'off' : '';
    return '<span class="adm-b ' + k + '">' + esc(st === '사용' ? '쓸 수 있음' : (st || '-')) + '</span>';
  }
  function render() {
    var ords = D.orders || [], ps = D.passes || [];
    $('#ordN').textContent = ords.length ? n2(ords.length) + '건' : '';
    $('#ordList').innerHTML = ords.length ? ords.map(function (o) {
      var sent = /보냄/.test(o.st), p = PROD[o.plan];
      return '<div class="adm-it' + (o.id === ORDER ? ' hit' : '') + '" id="o-' + esc(o.id) + '"><div class="adm-m"><b>' + esc(o.id) + '</b>' + badge(o.st) + '<span>' + esc(o.plan) + (p ? ' · ' + n2(p.price) + '원' : '') + '</span></div>' +
        '<div class="adm-s"><span>' + esc(o.at) + '</span><span>' + esc(o.contact) + '</span>' + (o.memo ? '<span>' + esc(o.memo) + '</span>' : '') + '</div>' +
        '<div class="adm-a">' + (p ? '<button class="btn ' + (sent ? 'btn-g' : 'btn-p') + ' btn-s" type="button" data-send="' + esc(o.id) + '" data-prod="' + esc(p.id) + '">' + (sent ? '다시 보내기' : '이용권 보내기') + '</button>' : '') + '</div></div>';
    }).join('') : '<p class="adm-empty">아직 주문이 없습니다.</p>';
    var sel = $('#isProd'); if (!sel.options.length) sel.innerHTML = (D.products || []).map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' · ' + n2(p.price) + '원</option>'; }).join('');
    $('#psN').textContent = ps.length ? n2(ps.length) + '개' : '';
    passes();
    var links = D.links || {}, lk = (D.products || []).map(function (p) { return '<dt>' + esc(p.name) + ' 결제 링크</dt><dd>' + (links[p.id] ? '<a href="' + esc(links[p.id]) + '" target="_blank" rel="noopener">' + esc(links[p.id]) + '</a>' : '<span class="adm-mute">없음(주문 뒤 메일로 결제 안내)</span>') + '</dd>'; }).join('');
    $('#payBox').innerHTML = '<dt>결제 안내 글</dt><dd>' + (D.payGuide ? esc(D.payGuide) : '<span class="adm-mute">비어 있음: 기본 안내(담당자가 메일로 결제 방법을 알려 드림)가 나갑니다.</span>') + '</dd>' + lk;
    if (ORDER) { var h = document.getElementById('o-' + ORDER); if (h) { h.scrollIntoView({ block: 'center' }); ORDER = ''; } }
  }
  function passes() {
    var w = ($('#psQ').value || '').trim().toLowerCase(), ps = (D.passes || []).filter(function (p) { return !w || [p.id, p.order, p.to, p.memo, p.name].join(' ').toLowerCase().indexOf(w) >= 0; });
    $('#psList').innerHTML = ps.length ? ps.slice(0, 200).map(function (p) {
      var on = p.st === '사용';
      return '<div class="adm-it"><div class="adm-m"><b>' + esc(p.id) + '</b>' + badge(p.st) + '<span>' + esc(p.name) + '</span></div>' +
        '<div class="adm-s"><span>만든 ' + esc(p.at) + '</span>' + (p.order ? '<span>주문 ' + esc(p.order) + '</span>' : '') + (p.to ? '<span>' + esc(p.to) + '</span>' : '') +
        '<span>' + (p.start ? '시작 ' + esc(p.start.slice(0, 16)) + ' · 끝 ' + esc(p.end.slice(0, 16)) : '아직 안 씀') + '</span><span>쓴 횟수 ' + n2(p.used) + (p.pro ? ' · 고급 ' + n2(p.pro) : '') + ' · 남은 ' + n2(p.left) + '</span>' + (p.memo ? '<span>' + esc(p.memo) + '</span>' : '') + '</div>' +
        '<div class="adm-a">' + (on ? '<button class="btn btn-g btn-s" type="button" data-stop="' + esc(p.id) + '">중지</button>' : '') + '</div></div>';
    }).join('') : '<p class="adm-empty">' + (w ? '찾는 이용권이 없습니다.' : '아직 만든 이용권이 없습니다.') + '</p>';
  }
  $('#psQ').addEventListener('input', function () { if (D) passes(); });

  function codesHtml(r, note) {
    return '<div class="adm-codes"><p><b>' + esc(r.name) + ' ' + n2((r.items || []).length) + '개</b> · ' + esc(note) + '</p>' + (r.items || []).map(function (x) {
      return '<div class="adm-code"><code>' + esc(x.code) + '</code><span>' + esc(x.id) + '</span><button class="btn btn-g btn-s" type="button" data-copy="' + esc(x.code) + '">복사</button></div>';
    }).join('') + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.hasAttribute('data-reload')) { load(); return; }
    if (b.hasAttribute('data-copy')) {
      var v = b.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast('복사했습니다: ' + v); }).catch(function () { toast('복사하지 못했습니다. 코드를 직접 골라 복사해 주세요.'); });
      return;
    }
    if (b.hasAttribute('data-send')) {
      if (!twice(b, '한 번 더 누르면 보냄')) return;
      b.disabled = true; b.textContent = '보내는 중…';
      call('issue', { order: b.getAttribute('data-send'), product: b.getAttribute('data-prod') }).then(function (r) {
        if (r.mailed) toast('이용권을 보냈습니다(' + (r.to || '주문 메일') + ').');
        else { $('#issueOut').innerHTML = codesHtml(r, r.mailErr || '메일을 보내지 못했습니다. 코드를 직접 전해 주세요.'); location.hash = 'issue'; }
        return load();
      }).catch(function (e2) { toast((e2 && e2.message) || '보내지 못했습니다.'); if (e2 && e2.code === 'ADMIN') gate(e2.message); b.disabled = false; b.textContent = b._old || '이용권 보내기'; });
      return;
    }
    if (b.hasAttribute('data-stop')) {
      if (!twice(b, '한 번 더 누르면 중지')) return;
      b.disabled = true;
      call('stop', { id: b.getAttribute('data-stop') }).then(function (r) { toast(r.id + ' 이용권을 멈췄습니다.'); return load(); })
        .catch(function (e3) { toast((e3 && e3.message) || '멈추지 못했습니다.'); if (e3 && e3.code === 'ADMIN') gate(e3.message); b.disabled = false; });
      return;
    }
    if (b.id === 'admRotate') {
      if (!twice(b, '한 번 더 누르면 모두 끊음')) return;
      b.disabled = true;
      call('rotate').then(function () { gate(''); say($('#admGateMsg'), '모든 관리 링크를 끊었습니다. 새 관리 링크를 운영자 메일로 보냈습니다.', 'ok'); })
        .catch(function (e4) { say($('#rotMsg'), (e4 && e4.message) || '처리하지 못했습니다.'); b.disabled = false; });
    }
  });
  $('#issueForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = f.querySelector('.msg'), btn = f.querySelector('button[type="submit"]'), to = f.to.value.trim();
    if (to && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) { say(msg, '받는 메일 주소를 확인해 주세요.'); return; }
    btn.disabled = true; say(msg, '만드는 중…', 'ok');
    call('issue', { product: f.product.value, to: to, n: to ? 1 : Math.max(1, Math.min(20, +f.n.value || 1)), memo: f.memo.value.trim() }).then(function (r) {
      if (r.mailed) { say(msg, '이용권을 만들어 ' + (r.to || to) + ' 로 보냈습니다.', 'ok'); $('#issueOut').innerHTML = ''; }
      else { say(msg, r.mailErr || '이용권을 만들었습니다. 아래 코드는 다시 볼 수 없으니 지금 복사해 두세요.', r.mailErr ? 'err' : 'ok'); $('#issueOut').innerHTML = codesHtml(r, '이 화면을 닫으면 다시 볼 수 없습니다'); }
      f.reset(); return load();
    }).catch(function (e2) { say(msg, (e2 && e2.message) || '만들지 못했습니다.'); if (e2 && e2.code === 'ADMIN') gate(e2.message); }).then(function () { btn.disabled = false; });
  });

  load();
})();
