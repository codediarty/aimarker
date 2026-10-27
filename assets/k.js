/* AIMarker 9.0 공통 동작: 제품 펼침 메뉴 · 아래 탭 메뉴 · 첫 화면 작업창 · 형광펜 표시 (2026.10.18) */
(function () {
  'use strict';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var ROOT = document.body.getAttribute('data-root') || '';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* 제품 펼침 메뉴: 누르면 열고, 밖을 누르거나 Esc 면 닫기 */
  $$('.k-dd').forEach(function (dd) {
    var b = dd.querySelector('button');
    function set(on) { dd.classList.toggle('open', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    b.addEventListener('click', function (e) { e.stopPropagation(); set(!dd.classList.contains('open')); });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dd.classList.contains('open')) { set(false); b.focus(); } });
    dd.addEventListener('focusout', function (e) { if (!e.relatedTarget || !dd.contains(e.relatedTarget)) set(false); });
  });

  /* 아래 탭의 '메뉴' → 머리글 메뉴 단추 */
  $$('[data-open-menu]').forEach(function (b) {
    b.addEventListener('click', function () { var m = document.getElementById('menuBtn'); if (m) { window.scrollTo({ top: Math.min(window.scrollY, window.scrollY), behavior: 'auto' }); m.click(); } });
  });

  /* 형광펜이 차례로 칠해지는 예시(화면에 들어오면 한 번) */
  var draws = $$('.k-draw');
  if (draws.length) {
    if (RM || !('IntersectionObserver' in window)) draws.forEach(function (d) { d.classList.add('on'); });
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { setTimeout(function () { e.target.classList.add('on'); }, 250); io.unobserve(e.target); } }); }, { threshold: 0.35 });
      draws.forEach(function (d) { io.observe(d); });
    }
  }

  /* 페이지 안 차례: 지금 읽는 곳 */
  var toc = $('.k-toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = $$('a[href^="#"]', toc), map = {};
    links.forEach(function (a) { var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) map[el.id] = a; });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!(e.isIntersecting && map[e.target.id])) return;
        var a = map[e.target.id];
        links.forEach(function (x) { x.classList.remove('on'); x.removeAttribute('aria-current'); });
        a.classList.add('on'); a.setAttribute('aria-current', 'location');
        /* 휴대폰처럼 차례가 옆으로 넘칠 때: 지금 읽는 칸이 보이도록 가운데로 */
        var sc = a.parentNode;
        if (sc && sc.scrollWidth > sc.clientWidth + 2) {
          var r = a.getBoundingClientRect(), R = sc.getBoundingClientRect();
          sc.scrollLeft += (r.left - R.left) - (R.width - r.width) / 2;
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { io2.observe(document.getElementById(id)); });
  }

  /* 문서(가이드 · 약관 · 개인정보): 목차를 장 제목으로 만들고, 넓은 화면에서는 오른쪽에 고정 */
  $$('article.prose').forEach(function (art) {
    var hs = $$(':scope > h2', art);
    if (hs.length >= 4) {
      art.classList.add('ds-doc');
      var nav = $(':scope > nav.toc', art);
      if (!nav) {
        nav = document.createElement('nav'); nav.className = 'toc'; nav.setAttribute('aria-label', '목차');
        var ol = document.createElement('ol');
        hs.forEach(function (h, i) {
          if (!h.id) h.id = 's' + (i + 1);
          var li = document.createElement('li'), a = document.createElement('a');
          a.href = '#' + h.id; a.textContent = h.textContent; li.appendChild(a); ol.appendChild(li);
        });
        var b = document.createElement('b'); b.textContent = '목차';
        nav.appendChild(b); nav.appendChild(ol);
        art.insertBefore(nav, art.firstChild);
      }
      nav.classList.add('ds-doc-toc');
      /* 지금 읽는 장: 화면 위쪽(120px)을 지난 마지막 장 제목. 위로 올려도, 빨리 넘겨도 맞게 */
      var la = $$('a[href^="#"]', nav), lm = {}, cur = null, tick = false;
      la.forEach(function (a) { lm[a.getAttribute('href').slice(1)] = a; });
      function spy() {
        tick = false;
        var on = null;
        for (var i = 0; i < hs.length; i++) { if (hs[i].getBoundingClientRect().top <= 120) on = hs[i]; else break; }
        if (!on && hs.length && (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 2) on = hs[hs.length - 1];
        var a = on && lm[on.id];
        if (a === cur) return;
        if (cur) { cur.classList.remove('on'); cur.removeAttribute('aria-current'); }
        cur = a || null;
        if (cur) { cur.classList.add('on'); cur.setAttribute('aria-current', 'location'); }
      }
      window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(spy); } }, { passive: true });
      window.addEventListener('resize', spy);
      spy();
    }
    /* 표: 휴대폰에서 칸마다 머리 이름을 붙여 카드처럼 읽게 */
    $$('table', art).forEach(function (t) {
      var head = t.tHead ? t.tHead.rows[0] : null;
      if (!head) { var fr = t.rows[0]; if (fr && fr.cells.length && $$('th', fr).length === fr.cells.length) { head = fr; fr.classList.add('ds-head'); } }
      if (!head || head.cells.length < 3) return;
      var names = [].map.call(head.cells, function (c) { return c.textContent.trim(); });
      t.classList.add('ds-stack');
      [].forEach.call(t.rows, function (r) { if (r === head) return; [].forEach.call(r.cells, function (c, i) { if (names[i] && !c.hasAttribute('data-l')) c.setAttribute('data-l', names[i]); }); });
    });
  });

  /* 옆으로 넘치는 코드 상자는 키보드로도 넘겨 볼 수 있게(포커스 받기) */
  $$('pre, .k-code, .code-b, .h5-code').forEach(function (el) { if (!el.hasAttribute('tabindex') && !el.closest('[aria-hidden="true"]') && el.scrollWidth > el.clientWidth + 1) { el.setAttribute('tabindex', '0'); if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', '코드'); } });

  /* 주소의 #칸이 접힌 상자(details) 안에 있으면 펼쳐서 보여 줌 */
  function openHash() {
    var id = decodeURIComponent((location.hash || '').slice(1)); if (!id) return;
    var el = document.getElementById(id); if (!el) return;
    var d = el.closest ? el.closest('details') : null, opened = false;
    while (d) { if (!d.open) { d.open = true; opened = true; } d = d.parentElement && d.parentElement.closest ? d.parentElement.closest('details') : null; }
    if (opened) el.scrollIntoView();
  }
  window.addEventListener('hashchange', openHash); openHash();

  /* ---------- 12.0 첫 화면: 기업용 제품 탭 ---------- */
  (function () {
    var box = $('.bz');
    if (!box) return;
    var tabs = $$('[role="tab"]', box);
    function show(id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('aria-controls') === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
        var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, j = (k === 'ArrowRight' || k === 'ArrowDown') ? i + 1 : (k === 'ArrowLeft' || k === 'ArrowUp') ? i - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : -2;
        if (j === -2) return; e.preventDefault(); j = (j + tabs.length) % tabs.length; show(tabs[j].getAttribute('aria-controls'), true);
      });
    });
    function fromHash() {
      // 13.0: AI 마킹(사이트 · 파일)은 위 'AI 마킹' 구획으로
      if (/^#(file|label|mark)$/.test(location.hash)) { var mk = document.getElementById('marking'); if (mk) mk.scrollIntoView(); return; }
      var id = { '#site': 'bp-geo', '#geo': 'bp-geo', '#commerce': 'bp-commerce', '#compliance': 'bp-compliance' }[location.hash];
      if (id) { show(id); var bz = document.getElementById('biz'); if (bz) bz.scrollIntoView(); }
    }
    fromHash(); window.addEventListener('hashchange', fromHash);
  })();

  /* 12.1 [data-focus="칸 id"]: 그 칸으로 내려가 바로 입력(첫 화면 끝 권유 등) */
  $$('[data-focus]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.getElementById(a.getAttribute('data-focus')); if (!t) return;
      e.preventDefault(); if (t.offsetParent === null) { var ed = document.querySelector('#hzSum [data-act="edit"]'); if (ed) ed.click(); }
      t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (x) { t.focus(); } }, RM ? 0 : 450);
    });
  });

  /* ---------- 13.4 첫 화면 예시 창(AI 초안 → 검사 → 필터링 대상 → 의미는 그대로 다듬기 → 전 · 뒤) ----------
     입력과 검사는 humanize.js(첫 화면과 /humanize/ 가 같은 도구). 여기서는 오른쪽 예시 창(#huStage)만 돌림.
     값은 huDemo JSON(예시 문단을 라이브 서버 판정 기준 · 인간화 엔진으로 잰 실제 값, 13.4: 64% → 12%). 움직임 줄이기면 끝 모양만.
     검사 결과가 나오면(am:hz-out) 예시는 멈추고 첫 화면은 한 단으로(#hzHero.has-out) */
  (function () {
    var stage = $('#huStage');
    if (!stage) return;
    var st = $('#huSt'), paper = $('#huPaper'), meter = $('#huMeter'), why = $('#huWhy'), foot = $('#huFoot'), live = $('#huLive'), replay = $('#huReplay'), badge = $('#huStamp'), hero = $('#hzHero');
    var plays = 0, LOOPS = 3;   // 끝나면 잠시 뒤 다시(세 번까지), 그다음은 '다시 보기'
    function badgeShow(kind, a, b) { if (!badge) return; badge.className = 'hz15-badge ' + kind; badge.querySelector('b').textContent = a; badge.querySelector('span').textContent = b; badge.hidden = false; void badge.offsetWidth; badge.classList.add('on'); }
    function badgeHide() { if (!badge) return; badge.classList.remove('on'); badge.hidden = true; }
    function scene(k) { stage.setAttribute('data-scene', k); }
    var MF = $('.hu-m.from', meter), MT = $('.hu-m.to', meter), FOOT0 = foot ? foot.innerHTML : '';
    var played = false, T = [];
    function stop() { T.forEach(clearTimeout); T = []; }
    function say(k, t) { st.innerHTML = (k === 'spin' ? '<span class="ds-spin" aria-hidden="true"></span>' : '<span class="dot' + (k ? ' ' + k : '') + '"></span>') + '<span>' + esc(t) + '</span>'; }
    function later(fn, ms) { var id = setTimeout(function () { T = T.filter(function (x) { return x !== id; }); fn(); }, ms); T.push(id); }
    function focusTool() {   // '내 글로 해 보기': 검사 칸으로(결과가 나와 칸이 접혀 있으면 펼침)
      var t = document.getElementById('hzText'); if (!t) { location.href = ROOT + 'humanize/'; return; }
      var inp = document.getElementById('hzIn'), ed = document.querySelector('#hzSum [data-act="edit"]');
      if (inp && inp.hidden && ed) ed.click();
      t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }, RM ? 0 : 420);
    }
    /* 낱말 단위로 바뀐 곳(뺀 말 · 넣은 말) */
    function diffOps(a, b) {
      var tk = function (x) { return x.match(/\s+|[^\s]+/g) || []; }, A = tk(a), B = tk(b), n = A.length, m = B.length, ops = [], i, j;
      if (n * m > 4000000) return [['-', a], ['+', b]];
      var W = m + 1, dp = new Uint16Array((n + 1) * W);
      for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i * W + j] = A[i] === B[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
      var push = function (k, t) { var l = ops[ops.length - 1]; if (l && l[0] === k) l[1] += t; else ops.push([k, t]); };
      i = 0; j = 0;
      while (i < n && j < m) { if (A[i] === B[j]) { push('=', A[i]); i++; j++; } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { push('-', A[i]); i++; } else { push('+', B[j]); j++; } }
      while (i < n) push('-', A[i++]); while (j < m) push('+', B[j++]);
      var R = [], del = '', ins = '', open = false, flush = function () { if (del) R.push(['-', del]); if (ins) R.push(['+', ins]); del = ins = ''; open = false; };
      ops.forEach(function (o, k) {
        if (o[0] === '=') { var nx = ops[k + 1]; if (open && !o[1].trim() && nx && nx[0] !== '=') { del += o[1]; ins += o[1]; return; } flush(); R.push(o); return; }
        open = true; if (o[0] === '-') del += o[1]; else ins += o[1];
      });
      flush(); return R;
    }
    /* 문장 단위로 다시 써지는 모습만 보여 줌. 어느 말을 왜 바꿨는지(규칙과 이유)는 토큰으로 여는 결과 화면에서만
       (사용자 2026.10.21 · 10.24: 바꾼 말을 보여 주면 팁으로 여기고 직접 고쳐서 결제를 안 함) */
    var ICO_LOCK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    function sentHtml(a, b) {   // 바뀐 문장: 새로 들어간 말에만 밑줄(지운 말은 보여 주지 않음). 쉼표만 빠진 말은 밑줄 없이, 끝 문장 부호는 밑줄 밖으로
      if (a === b) return esc(b);
      var ops = diffOps(a, b), bare = function (x) { return String(x || '').replace(/[\s,.!?·]+/g, ''); };
      return ops.map(function (o, i) {
        if (o[0] === '=') return esc(o[1]);
        if (o[0] === '-') return '';
        var pv = ops[i - 1];
        if (pv && pv[0] === '-' && bare(pv[1]) === bare(o[1])) return esc(o[1]);
        var m = /^(\s*)([\s\S]*?)([\s.,!?]*)$/.exec(o[1]);
        return m[2] ? esc(m[1]) + '<mark class="hu-c">' + esc(m[2]) + '</mark>' + esc(m[3]) : esc(o[1]);
      }).join('');
    }
    function sbuild(list) {   // 종이에 원문 문장을 그림
      paper.innerHTML = '';
      var p = document.createElement('p'); p.className = 'hu-doc'; paper.appendChild(p);
      var S = list.map(function (pr, i) {
        if (i) p.appendChild(document.createTextNode(' '));
        var el = document.createElement('span'); el.className = 'hu-s'; el.textContent = pr[0]; p.appendChild(el);
        return { el: el, a: pr[0], b: pr[1] };
      });
      return { p: p, S: S };
    }
    function sshow(x) { x.el.className = 'hu-s ok' + (x.a === x.b ? ' same' : ''); x.el.innerHTML = sentHtml(x.a, x.b); }
    function sfinish(P) { P.S.forEach(sshow); }
    function shold(P) {   // 원문 · 검출 표시(칩) · 끝 모양 가운데 가장 큰 높이를 미리 잡아 둠(도는 동안 창 높이가 변하지 않게)
      paper.style.minHeight = ''; sfinish(P); var h1 = paper.offsetHeight;
      P.S.forEach(function (x) { x.el.className = 'hu-s'; x.el.textContent = x.a; }); var h2 = paper.offsetHeight;
      (DEMO && DEMO.ai || []).forEach(function (i) { if (P.S[i]) P.S[i].el.classList.add('ai'); }); var h3 = paper.offsetHeight;
      P.S.forEach(function (x) { x.el.className = 'hu-s'; });
      paper.style.minHeight = Math.max(h1, h2, h3) + 'px';
    }
    function stype(P, done) {
      var all = P.S.map(function (x) { return x.a; }), total = all.join('').length, k = 0;
      P.S.forEach(function (x) { x.el.textContent = ''; });
      P.p.classList.add('typing');
      var step = Math.max(3, Math.ceil(total / 64));   // 약 1.4초에 다 씀
      (function tick() {
        var left = step;
        while (left > 0 && k < P.S.length) {
          var full = all[k], cur = P.S[k].el.textContent.length, take = Math.min(left, full.length - cur);
          P.S[k].el.textContent = full.slice(0, cur + take); left -= take;
          if (P.S[k].el.textContent.length >= full.length) k++;
        }
        if (k < P.S.length) later(tick, 22); else { P.p.classList.remove('typing'); done(); }
      })();
    }
    function sflag(P, idx, gap, done) {   // 판정 기준으로 AI 검출 문장 표시
      var i = 0;
      (function next() { if (i >= idx.length) return done(); var x = P.S[idx[i++]]; if (x) x.el.classList.add('ai'); later(next, gap); })();
    }
    function srewrite(P, gap, each, done) {   // 한 문장씩: 살짝 흐려졌다가 다듬은 문장으로
      var i = 0;
      (function next() {
        if (i >= P.S.length) return done();
        var x = P.S[i++], n = i;
        if (each) each(n, P.S.length);
        x.el.classList.add('now');
        later(function () {
          x.el.classList.add('out');
          later(function () { sshow(x); x.el.classList.add('in'); later(next, Math.round(gap * 0.45)); }, 170);
        }, Math.round(gap * 0.4));
      })();
    }
    function band(r) { return r >= 40 ? 'bad' : r >= 20 ? 'mid' : 'ok'; }
    /* AI 작성률 칸: 숫자가 올라가거나 내려가며 막대가 따라 움직임 */
    function num(el, a, b, ms) {
      if (RM || a === b) { el.textContent = b; return; }
      var t0 = null;
      function f(t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(a + (b - a) * e); if (k < 1) requestAnimationFrame(f); }
      requestAnimationFrame(f);
    }
    function setM(box, rate, label, from, cls) {
      var v = $('.v', box), pc = $('b i', box), bn = $('.bn', box), bar = $('.tr i', box), side = box === MF ? 'from' : 'to';
      if (rate == null) { box.className = 'hu-m ' + side; v.textContent = '-'; pc.hidden = true; bn.textContent = ''; bar.style.transition = 'none'; bar.style.width = '0'; return; }
      var a = from == null ? 0 : from, end = cls || band(rate);
      pc.hidden = false; bn.textContent = '';
      box.className = 'hu-m ' + side + ' ' + (RM ? end : band(a));
      bar.style.transition = 'none'; bar.style.width = (RM ? Math.max(2, rate) : Math.max(a ? 2 : 0, a)) + '%'; void bar.offsetWidth; bar.style.transition = '';
      if (RM) { v.textContent = rate; bn.textContent = label || ''; return; }
      bar.style.width = Math.max(2, rate) + '%';
      num(v, a, rate, 700);
      later(function () { box.className = 'hu-m ' + side + ' ' + end; bn.textContent = label || ''; }, 420);
    }
    function catsHtml(n, cats, note) {   // 바꾼 곳 수와 갈래만(무엇을 무엇으로 바꿨는지는 결과 화면에서). 갈래는 셋까지, 나머지는 '그 밖'
      var top = cats.slice(0, 3), more = cats.slice(3).reduce(function (a, c) { return a + (c[1] || 1); }, 0);
      return '<div class="hu-cats"><b>바꾼 곳 ' + n + '곳</b>' + top.map(function (c) { return '<span>' + esc(c[0]) + (c[1] ? ' <em>' + c[1] + '</em>' : '') + '</span>'; }).join('') + (more ? '<span>그 밖 <em>' + more + '</em></span>' : '') + '</div>' +
        '<p class="hu-lockn">' + ICO_LOCK + '<span>' + esc(note || '바꾼 이유와 다른 버전은 글 전체 휴머나이징 결과에서 보여 드려요.') + '</span></p>';
    }

    /* 자동 예시 */
    var DEMO = null;
    try { DEMO = JSON.parse(($('#huDemo') || {}).textContent || 'null'); } catch (e) { DEMO = null; }
    if (DEMO && !DEMO.sents) DEMO = null;   // 예전 모양의 예시 데이터는 쓰지 않음
    function afterCls() { return DEMO.after.rate >= 40 ? 'bad' : DEMO.after.n > 0 || DEMO.after.rate >= 20 ? 'mid' : 'ok'; }   // 남은 AI 문장이 있으면 판정 기준대로 '일부 검출'(호박색)
    function leftNote() { var k = (DEMO.aiAfter || []).length; return k ? '남은 AI 패턴 문장 ' + k + '개는 다른 버전으로 다시 다듬거나 직접 고칩니다. 바꾼 이유는 토큰 결과에서 보여 드려요.' : '바꾼 이유와 다른 버전은 글 전체 휴머나이징 결과에서 보여 드려요.'; }
    function demoEnd(P) {
      var left = DEMO.aiAfter || [];
      say('ok', '휴머나이징 완료 · ' + DEMO.after.band + ' · 바꾼 곳 ' + DEMO.n + '곳');
      setM(MT, DEMO.after.rate, DEMO.after.band, DEMO.before.rate, afterCls());
      why.innerHTML = '';   // 13.4b 갈래 칩 · 잠금 안내는 예시 창에 넣지 않음(사용자 10.24 11:53: 글이 많아 가독성이 떨어짐). 바꾼 곳 · 갈래는 결과 화면에서
      left.forEach(function (i) { if (P.S[i]) P.S[i].el.classList.add('ai2'); });
      badgeShow(left.length ? 'mid' : 'ok', DEMO.after.band, 'AI 작성률 ' + DEMO.before.rate + '% → ' + DEMO.after.rate + '% · 의미와 문맥은 그대로');
      replay.hidden = false;
      stage.classList.remove('scanning'); stage.classList.add('done'); scene('done');
      if (!RM && plays < LOOPS) later(function () { if (plays < LOOPS) demo(); }, 6000);
      P.S.forEach(function (x) { x.el.classList.remove('now', 'in'); });
      live.textContent = '예시: ' + DEMO.label.replace(/^예시 · /, '') + '. AI 패턴 문장 ' + (DEMO.ai || []).length + '개 가운데 ' + ((DEMO.ai || []).length - left.length) + '개를 의미는 그대로 두고 다듬어 ' + DEMO.n + '곳을 바꿨습니다. AI 작성률(추정)은 ' + DEMO.before.rate + '%에서 ' + DEMO.after.rate + '%가 되었습니다.';
    }
    function demoBase() {
      stop(); played = true; plays++;
      badgeHide(); stage.classList.remove('done', 'scanning'); scene('type');
      replay.hidden = true; meter.hidden = false; why.innerHTML = ''; if (foot) foot.innerHTML = FOOT0;
      stage.classList.remove('is-user'); stage.classList.add('is-demo');
      setM(MF, null); setM(MT, null);
      var P = sbuild(DEMO.sents);
      shold(P); return P;
    }
    function still() {   // 움직이지 않는 예시(끝 모양)
      if (!DEMO) return;
      var P = demoBase(); sfinish(P);
      st.innerHTML = '';
      var keep = RM; RM = true; setM(MF, DEMO.before.rate, DEMO.before.band); demoEnd(P); RM = keep;
    }
    function demo() {
      if (!DEMO) return;
      if (RM) { still(); return; }
      var P = demoBase(), ai = DEMO.ai || P.S.map(function (x, i) { return i; });
      say('', 'AI가 작성한 ' + DEMO.label.replace(/^예시 · /, '') + ' · 붙여 넣는 중');
      stype(P, function () {
        later(function () {
          stage.classList.add('scanning'); scene('scan'); say('run', 'AI 패턴 검사 중');
          later(function () {
            scene('flag');
            setM(MF, DEMO.before.rate, DEMO.before.band, 0);
            say('warn', DEMO.before.band + ' · AI 패턴 문장 ' + ai.length + '/' + P.S.length);
            sflag(P, ai, 240, function () {
              stage.classList.remove('scanning');
              badgeShow('bad', DEMO.before.band, 'AI 작성률 ' + DEMO.before.rate + '% · 검사기 필터링 대상');
              later(function () {
                badgeHide(); scene('rewrite'); say('run', '의미와 문맥은 그대로, AI 패턴만 다듬는 중');
                srewrite(P, 700, function (n, all) { say('run', '의미는 그대로, AI 패턴만 다듬는 중 · 문장 ' + n + '/' + all); }, function () { later(function () { demoEnd(P); }, 260); });
              }, 1700);
            });
          }, 950);
        }, 380);
      });
    }
    replay.addEventListener('click', function () { plays = 0; demo(); });
    stage.addEventListener('pointerenter', function () { plays = LOOPS; }, { passive: true });   // 들여다보면 되풀이를 멈춤(끝 모양에서)
    window.addEventListener('resize', function () { if (!T.length) paper.style.minHeight = ''; });
    if (DEMO) {
      if (!('IntersectionObserver' in window)) demo();
      else {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); later(function () { if (!played) demo(); }, 400); } }); }, { threshold: 0.35 });
        io.observe(stage);
      }
    }

    if (foot) foot.addEventListener('click', function (e) { if (e.target.closest('[data-hu]')) focusTool(); });
    /* 검사 결과가 나오면 예시는 멈추고, 첫 화면 두 단(도구 | 예시)은 한 단으로(결과 화면이 넓게). '새 글'로 비우면 다시 두 단 */
    var hz = document.getElementById('hz');
    function syncHero() { if (!hero || !hz) return; var on = hz.classList.contains('has-out'); hero.classList.toggle('has-out', on); if (on) stop(); }
    window.addEventListener('am:hz-out', function () { stop(); syncHero(); });
    if (hz && hero && 'MutationObserver' in window) { new MutationObserver(syncHero).observe(hz, { attributes: true, attributeFilter: ['class'] }); syncHero(); }
  })();

  /* 13.0 움직임 멈추기: 방문자가 AI 마크 근거 창 · 안내 창에서 멈추면(m.js, 이 브라우저에 기억) 이 사이트의 떠 있는 그림도 함께 멈춤 */
  (function () {
    function apply(on) { document.documentElement.classList.toggle('am-still', !on); }
    try { apply(localStorage.getItem('aimarker-motion') !== 'off'); } catch (e) { /* 저장소를 못 쓰면 그대로 */ }
    window.addEventListener('aimarker:motion', function (e) { apply(!!(e.detail && e.detail.on)); });
  })();

  /* 13.0 주소의 #위치: 글꼴이 늦게 들어와 줄이 바뀌면 다시 맞춤(그사이 방문자가 움직이지 않았을 때만) */
  (function () {
    var h = location.hash;
    if (!h || h.length < 2 || !document.fonts || !document.fonts.ready) return;
    var el = null;
    try { el = document.getElementById(decodeURIComponent(h.slice(1))); } catch (e) { return; }
    if (!el) return;
    var moved = false;
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, function () { moved = true; }, { passive: true, once: true }); });
    document.fonts.ready.then(function () { setTimeout(function () { if (!moved && location.hash === h) el.scrollIntoView(); }, 60); });
  })();
})();
/* 13.10 앱 설치(설치형 웹 앱, PWA): 크롬 · 엣지 · 삼성 인터넷은 설치 창, 아이폰 · 아이패드 사파리와 그 밖의 브라우저는 '홈 화면에 추가' 안내.
   이미 앱으로 열었으면(standalone) 설치 단추를 숨기고 html.is-app. 설치 창은 사용자가 단추를 누를 때만 엽니다. */
(function () {
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (standalone) { document.documentElement.classList.add('is-app'); return; }
  var ua = navigator.userAgent || '', ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var inApp = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(ua), deferred = null, last = null, dlg = null;
  function btns() { return Array.prototype.slice.call(document.querySelectorAll('[data-install]')); }
  function show(on) { btns().forEach(function (b) { b.hidden = !on; }); }
  function track(ev) { try { if (window.gtag) window.gtag('event', ev); } catch (e) { /* 무시 */ } }
  window.addEventListener('beforeinstallprompt', function (e) { deferred = e; show(true); });
  window.addEventListener('appinstalled', function () { deferred = null; show(false); track('app_installed'); close(); });
  if (ios || inApp) show(true);
  function steps() {
    if (inApp) return ['오른쪽 위(또는 아래) 메뉴에서 <b>다른 브라우저로 열기</b>를 누르세요.', '크롬이나 사파리에서 열린 aimarker.kr 에서 다시 <b>앱 설치</b>를 누르세요.'];
    if (ios) return ['사파리 아래(아이패드는 위)의 <b>공유</b> 단추(네모에 위 화살표)를 누르세요.', '목록을 내려 <b>홈 화면에 추가</b>를 누르세요.', '오른쪽 위 <b>추가</b>를 누르면 홈 화면에 AIMarker 앱이 생깁니다.'];
    return ['브라우저 주소창 오른쪽의 <b>설치</b> 아이콘이나 메뉴(⋮)의 <b>앱 설치</b> · <b>홈 화면에 추가</b>를 누르세요.', '설치하면 홈 화면 · 시작 메뉴에서 AIMarker 를 앱처럼 바로 엽니다.'];
  }
  function close() { if (!dlg) return; dlg.remove(); dlg = null; document.removeEventListener('keydown', onKey, true); if (last && last.focus) last.focus(); }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
  function guide(from) {
    last = from; close(); last = from;
    dlg = document.createElement('div');
    dlg.className = 'k-inst'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'kInstT');
    dlg.innerHTML = '<div class="k-inst-in"><button type="button" class="k-inst-x" aria-label="닫기">×</button>' +
      '<img src="' + (document.body.getAttribute('data-root') || '') + 'assets/icon-192.png" width="56" height="56" alt="">' +
      '<h2 id="kInstT">AIMarker 앱 설치</h2><p class="k-inst-l">홈 화면에서 바로 열고, 전체 화면으로 씁니다. 따로 내려받을 파일은 없고 용량도 거의 차지하지 않습니다.</p>' +
      '<ol>' + steps().map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>' +
      '<button type="button" class="k-btn k-btn-p k-inst-ok">알겠어요</button></div>';
    document.body.appendChild(dlg);
    document.addEventListener('keydown', onKey, true);
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('.k-inst-x, .k-inst-ok')) close(); });
    var ok = dlg.querySelector('.k-inst-ok'); if (ok) ok.focus();
    track('app_install_guide');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-install]');
    if (!b) return;
    e.preventDefault();
    if (deferred) {
      var d = deferred; deferred = null;
      d.prompt();
      if (d.userChoice) d.userChoice.then(function (c) { track(c && c.outcome === 'accepted' ? 'app_install_ok' : 'app_install_no'); if (!c || c.outcome !== 'accepted') show(false); }).catch(function () { /* 무시 */ });
      return;
    }
    guide(b);
  });
})();

/* 휴대폰 공유하기로 이미지 받기(웹 앱 공유 대상) · 13.10 앱 화면(오프라인 화면 · 자주 쓰는 파일 저장): 서비스 워커 aimarker-sw.js */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  var root = document.body.getAttribute('data-root') || '';
  window.addEventListener('load', function () { setTimeout(function () { navigator.serviceWorker.register(root + 'aimarker-sw.js', { scope: root || './' }).catch(function () { /* 무시 */ }); }, 1200); });
})();

/* 13.8 검색 수요 안내 칩: 지금 페이지 칩은 어둡게 */
(function () {
  var cur = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.lp-chips a').forEach(function (a) {
    if (a.pathname.replace(/index\.html$/, '') === cur) a.setAttribute('aria-current', 'page');
  });
})();
