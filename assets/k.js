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
      var id = { '#site': 'bp-geo', '#geo': 'bp-geo', '#file': 'bp-label', '#label': 'bp-label', '#mark': 'bp-mark', '#commerce': 'bp-commerce', '#compliance': 'bp-compliance' }[location.hash];
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

  /* ---------- 12.1 예시 재생(AI 초안 → AI 검출 문장 → 문장마다 다듬기 → AI 작성률 전 · 뒤) ----------
     입력과 검사는 humanize.js(첫 화면과 /humanize/ 가 같은 도구). 여기서는 아래 '이렇게 찾고 다듬습니다' 예시만 돌림.
     화면에 들어오면 한 번. 무대 크기는 끝 모양으로 미리 잡아 아래 내용이 밀리지 않게. 움직임 줄이기면 결과만 */
  (function () {
    var stage = $('#huStage');
    if (!stage) return;
    var st = $('#huSt'), paper = $('#huPaper'), meter = $('#huMeter'), why = $('#huWhy'), foot = $('#huFoot'), live = $('#huLive'), replay = $('#huReplay');
    var MF = $('.hu-m.from', meter), MT = $('.hu-m.to', meter), FOOT0 = foot.innerHTML;
    var played = false, T = [];
    function stop() { T.forEach(clearTimeout); T = []; }
    function say(k, t) { st.innerHTML = (k === 'spin' ? '<span class="ds-spin" aria-hidden="true"></span>' : '<span class="dot' + (k ? ' ' + k : '') + '"></span>') + '<span>' + esc(t) + '</span>'; }
    function later(fn, ms) { var id = setTimeout(function () { T = T.filter(function (x) { return x !== id; }); fn(); }, ms); T.push(id); }
    function focusTool() {   // '내 글로 해 보기': 위 검사 칸으로(결과가 나와 칸이 접혀 있으면 펼침)
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
    /* 12.1: 문장 단위로 다시 써지는 모습만 보여 줌. 어느 말을 왜 바꿨는지(규칙과 이유)는 크레딧으로 여는 결과 화면에서만
       (사용자 2026.10.21: '조금조금씩 수정하는 걸 보여 주면 팁으로 여기고 직접 고쳐서 결제를 안 할 것 같다') */
    var CAT = { 0: '말투', 1: '번역투', 2: '상투적 연결어', 3: '빈말 · 과장 수식', 4: '틀에 박힌 도입 · 마무리', 5: '대화창 복사 흔적', 6: '문장 리듬', 7: '딱딱한 어휘' };
    var ICO_LOCK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    function sents(t) { return String(t || '').replace(/([.!?])\s+/g, '$1\u0001').split('\u0001').map(function (x) { return x.trim(); }).filter(Boolean); }   // 뒤쪽 보기(?<=)는 옛 사파리에서 파일 전체가 멈춰 쓰지 않음
    function pairs(a, b) { var A = sents(a), B = sents(b); if (A.length && A.length === B.length) return A.map(function (x, i) { return [x, B[i]]; }); return [[String(a || '').trim(), String(b || '').trim()]]; }
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
    function shold(P) { paper.style.minHeight = ''; sfinish(P); var h1 = paper.offsetHeight; P.S.forEach(function (x) { x.el.className = 'hu-s'; x.el.textContent = x.a; }); paper.style.minHeight = Math.max(h1, paper.offsetHeight) + 'px'; }   // 원문과 끝 모양 가운데 큰 높이를 미리 잡아 둠(도는 동안 아래 내용이 움직이지 않게)
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
    function setM(box, rate, label, from) {
      var v = $('.v', box), pc = $('b i', box), bn = $('.bn', box), bar = $('.tr i', box), side = box === MF ? 'from' : 'to';
      if (rate == null) { box.className = 'hu-m ' + side; v.textContent = '-'; pc.hidden = true; bn.textContent = ''; bar.style.transition = 'none'; bar.style.width = '0'; return; }
      var a = from == null ? 0 : from;
      pc.hidden = false; bn.textContent = '';
      box.className = 'hu-m ' + side + ' ' + band(RM ? rate : a);
      bar.style.transition = 'none'; bar.style.width = (RM ? Math.max(2, rate) : Math.max(a ? 2 : 0, a)) + '%'; void bar.offsetWidth; bar.style.transition = '';
      if (RM) { v.textContent = rate; bn.textContent = label || ''; return; }
      bar.style.width = Math.max(2, rate) + '%';
      num(v, a, rate, 700);
      later(function () { box.className = 'hu-m ' + side + ' ' + band(rate); bn.textContent = label || ''; }, 420);
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
    function demoEnd(P) {
      say('ok', '휴머나이징 완료 · 바꾼 곳 ' + DEMO.n + '곳');
      setM(MT, DEMO.after.rate, DEMO.after.band, DEMO.before.rate);
      why.innerHTML = catsHtml(DEMO.n, DEMO.cats);
      replay.hidden = false;   // 높이는 잡아 둔 채로(끝나는 순간 아래 내용이 올라붙지 않게). 화면 크기가 바뀌면 풂
      P.S.forEach(function (x) { x.el.classList.remove('now', 'in'); });
      live.textContent = '예시: ' + DEMO.label.replace(/^예시 · /, '') + '. 문장 ' + P.S.length + '개를 다듬어 ' + DEMO.n + '곳을 바꿨습니다. AI 작성률(추정)은 ' + DEMO.before.rate + '%에서 ' + DEMO.after.rate + '%가 되었습니다.';
    }
    function demoBase() {
      stop(); played = true;
      replay.hidden = true; meter.hidden = false; why.innerHTML = ''; foot.innerHTML = FOOT0;
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
      say('', 'AI 초안 · ' + DEMO.label.replace(/^예시 · /, ''));
      stype(P, function () {
        later(function () {
          setM(MF, DEMO.before.rate, DEMO.before.band, 0);
          say('warn', 'AI 검출 문장 ' + ai.length + '개 · 판정 ' + DEMO.before.band);
          sflag(P, ai, 140, function () {
            later(function () {
              srewrite(P, 760, function (n, all) { say('run', '사람 말투로 다듬는 중 · 문장 ' + n + '/' + all); }, function () { later(function () { demoEnd(P); }, 260); });
            }, 650);
          });
        }, 420);
      });
    }
    replay.addEventListener('click', function () { demo(); });
    window.addEventListener('resize', function () { if (!T.length) paper.style.minHeight = ''; });
    if (DEMO) {
      if (!('IntersectionObserver' in window)) demo();
      else {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); later(function () { if (!played) demo(); }, 400); } }); }, { threshold: 0.35 });
        io.observe(stage);
      }
    }

    foot.addEventListener('click', function (e) { if (e.target.closest('[data-hu]')) focusTool(); });
    window.addEventListener('am:hz-out', function () { stop(); });   // 검사 결과가 나오면 예시는 멈춤
  })();
})();
/* 휴대폰 공유하기로 이미지 받기(웹 앱 공유 대상): 공유받은 요청만 맡는 작은 서비스 워커를 둡니다 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  var root = document.body.getAttribute('data-root') || '';
  window.addEventListener('load', function () { setTimeout(function () { navigator.serviceWorker.register(root + 'aimarker-sw.js', { scope: root || './' }).catch(function () { /* 무시 */ }); }, 1200); });
})();
