/* AIMarker 13.2 요금 페이지: '내 글은 얼마?' 계산기 · 토큰 충전 탭(개인 · 학생 | 회사 · 기관 · 학교)
   1토큰 = 100원. 셈은 글 검사 화면(assets/humanize.js)과 같은 식: 글자 수(공백 포함)를 6,000자씩 나눠 조각마다
   100자 단위로 검사 0.2토큰(최소 1, 600자 이하는 0) · 휴머나이징 0.4토큰(최소 2). 값은 서버 PASS 단가 ÷ 10 */
(function () {
  'use strict';
  var root = document.body.getAttribute('data-root') || '';
  var TW = 100, CHUNK = 6000, HELP = 600, MAXC = 50000;
  var U = { per: 100, cr: 0.2, min: 1 }, H = { per: 100, cr: 0.4, min: 2 };
  var PK = [{ id: 'c3', price: 3000, cr: 30 }, { id: 'c10', price: 10000, cr: 110 }, { id: 'c30', price: 30000, cr: 350, best: 1 }, { id: 'c50', price: 50000, cr: 600 }];
  function $(s, r) { return (r || document).querySelector(s); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function n2(x) { return Math.round(x).toLocaleString('ko-KR'); }
  function tk(x) { return r1(x).toLocaleString('ko-KR', { maximumFractionDigits: 1 }); }
  function won(x) { return n2(r1(x) * TW) + '원'; }
  function parts(n) { var L = [], rest = n; while (rest > 0) { var k = Math.min(CHUNK, rest); L.push(k); rest -= k; } return L; }
  function cost(c, n, chk) { return r1(parts(n).reduce(function (a, len) { return a + (chk && len <= HELP ? 0 : Math.max(c.min, Math.ceil(len / c.per) * c.cr)); }, 0)); }

  /* ---------- 계산기 ---------- */
  var form = $('#tkCalc'), inp = $('#tkLen');
  if (form && inp) {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    var calc = function () {
      var n = Math.max(0, Math.min(MAXC, Math.round(+inp.value || 0)));
      var lad = $('#tkLadder');
      if (!n) {   // 빈 칸: 숫자를 비우고 안내만(사다리는 그대로)
        ['tkC1', 'tkC2', 'tkC3'].forEach(function (id) { set(id, '0토큰'); }); ['tkW1', 'tkW2', 'tkW3'].forEach(function (id) { set(id, ''); });
        set('tkLadH', '글자 수를 넣어 주세요'); set('tkGoN', '글 종류를 고르거나 글자 수를 넣으면 셉니다');
        return;
      }
      var c1 = cost(U, n, true), c2 = cost(H, n, false), c3 = r1(c1 + c2), many = n > CHUNK;
      set('tkC1', (many ? '약 ' : '') + tk(c1) + '토큰'); set('tkW1', c1 ? won(c1) : '600자 이하는 0원');
      set('tkC2', (many ? '약 ' : '') + tk(c2) + '토큰'); set('tkW2', won(c2));
      set('tkC3', (many ? '약 ' : '') + tk(c3) + '토큰'); set('tkW3', won(c3));
      var pick = null;
      PK.forEach(function (p) { var k = c3 > 0 ? Math.floor(r1(p.cr / c3) + 1e-9) : 0; if (!pick && k >= 1) pick = p; });
      pick = pick || PK[PK.length - 1];
      if (lad) lad.innerHTML = PK.map(function (p) {   // 고른 칸(단추와 같은 칸)을 강조, 칸마다 충전 창으로
        var k = c3 > 0 ? Math.floor(r1(p.cr / c3) + 1e-9) : 0;
        return '<li' + (p === pick ? ' class="pick"' : '') + '><a href="' + root + 'humanize/#buy-' + p.id + '"' + (p === pick ? ' aria-current="true"' : '') + '><span>' + n2(p.price) + '원<small>' + tk(p.cr) + '토큰</small></span><b>' + (k ? (k >= 1000 ? '1,000번 넘게' : n2(k) + '번') : '모자라요') + '</b></a></li>';
      }).join('');
      var k1 = c3 > 0 ? Math.floor(r1(pick.cr / c3) + 1e-9) : 0;
      var go = $('#tkGo'); if (go) { go.href = root + 'humanize/#buy-' + pick.id; go.textContent = n2(pick.price) + '원 충전하기'; }
      set('tkGoN', k1 ? '이 글 검사와 휴머나이징 ' + n2(k1) + '번' : '이 글은 큰 충전이나 나눠서');
      set('tkLadH', n ? '충전하면 이 글(' + n2(n) + '자) 검사와 휴머나이징을' : '충전하면 이런 글을');
    };
    form.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'kind') { inp.value = e.target.value; calc(); }
    });
    inp.addEventListener('input', function () {
      var v = String(Math.round(+inp.value || 0));
      Array.prototype.forEach.call(form.querySelectorAll('input[name="kind"]'), function (r) { r.checked = r.value === v; });
      calc();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    calc();
  }

  /* ---------- 충전 탭 ---------- */
  var seg = $('.tk-seg');
  if (seg) {
    var tabs = Array.prototype.slice.call(seg.querySelectorAll('[role="tab"]'));
    var show = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('aria-controls') === id, p = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
        if (p) p.hidden = !on;
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, j = (k === 'ArrowRight' || k === 'ArrowDown') ? i + 1 : (k === 'ArrowLeft' || k === 'ArrowUp') ? i - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : -2;
        if (j === -2) return; e.preventDefault(); j = (j + tabs.length) % tabs.length; show(tabs[j].getAttribute('aria-controls'), true);
      });
    });
    var fromHash = function () {   // #credit · #biz · #pk-credit-… 은 회사 탭, #personal · #pk-c… 는 개인 탭
      var h = location.hash || '';
      var biz = /^#(credit|biz|pk-credit-[a-z0-9]+|pk-ent)$/.test(h);
      show(biz ? 'tkPanBiz' : 'tkPanMe');
      if (/^#(credit|biz|personal|pk-[a-z0-9-]+)$/.test(h)) { var el = document.getElementById(h.slice(1)); if (el) el.scrollIntoView(); }
    };
    fromHash(); window.addEventListener('hashchange', fromHash);
  }
})();
