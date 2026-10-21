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

  /* ---------- 12.0 첫 화면: AI 휴머나이징(입력창 · 자동 예시 · 바뀐 곳 보여 주기) ----------
     예시: 화면에 들어오면 한 번. AI 초안이 써지고 → AI 말버릇에 물결 밑줄 → 한 곳씩 지운 말 · 넣은 말로 바뀌며 이유를 한 줄로 → AI 작성률(추정) 전 · 뒤.
     무대 크기는 처음부터 끝 모양으로 잡아 두어 아래 내용이 밀리지 않게. 움직임 줄이기면 결과만 */
  (function () {
    var ta = $('#huText');
    if (!ta) return;
    var cnt = $('#huCnt'), tone = $('#huTone'), stage = $('#huStage'), st = $('#huSt'), paper = $('#huPaper'), meter = $('#huMeter'), why = $('#huWhy'), foot = $('#huFoot'), live = $('#huLive'), replay = $('#huReplay');
    var bRun = $('#huRun'), bChk = $('#huCheck');
    var MF = $('.hu-m.from', meter), MT = $('.hu-m.to', meter), FOOT0 = foot.innerHTML;
    var EX = {
      report: '현대 사회에서 소셜 미디어는 청소년의 정체성 형성에 중요한 역할을 하고 있다. 또한, 다양한 플랫폼을 통해 청소년들은 자신을 표현하고 타인과 소통하는 새로운 방식을 경험하고 있다. 이러한 변화는 긍정적인 측면과 부정적인 측면을 동시에 가지고 있다.\n\n첫째, 소셜 미디어는 청소년에게 다양한 정보와 관점을 접할 수 있는 기회를 제공한다. 둘째, 또래와의 관계를 유지하고 확장하는 데 있어서 효과적인 도구로 작용한다. 그러나 과도한 사용은 비교 심리와 불안감을 유발할 수 있다는 점에서 주의가 필요하다.\n\n결론적으로, 소셜 미디어의 영향은 사용 방식에 따라 크게 달라진다고 할 수 있다. 따라서 청소년의 건강한 미디어 이용 습관을 형성하기 위한 교육적 노력이 무엇보다 중요하다.',
      thesis: '본 연구는 대학생의 생성형 AI 활용 수준이 학업 자기효능감과 학업 성취에 미치는 영향을 분석하는 것을 목적으로 한다. 이를 위해 수도권 소재 4년제 대학 재학생 312명을 대상으로 설문 조사를 실시하였으며, 수집된 자료는 구조방정식 모형을 통해 분석하였다.\n\n연구 결과, 생성형 AI 활용 수준은 학업 자기효능감에 유의미한 정적 영향을 미치는 것으로 나타났다. 또한, 학업 자기효능감은 생성형 AI 활용과 학업 성취 간의 관계를 부분 매개하는 것으로 확인되었다. 이러한 결과는 생성형 AI가 학습 과정에 있어서 중요한 역할을 할 수 있음을 시사한다.\n\n본 연구는 생성형 AI 활용에 관한 실증적 근거를 제공하였다는 점에서 의의가 있다. 향후 연구에서는 다양한 전공과 학년을 고려한 추가적인 분석이 필요할 것으로 판단된다.',
      essay: '저는 대학 시절 봉사 동아리 활동을 통해 협업의 중요성을 배웠습니다. 동아리 활동에 있어서 저는 기획을 맡았습니다. 기획 과정에서 다양한 의견이 충돌하였습니다. 저는 팀원들과 대화를 통해 갈등을 해결하였고, 이를 통해 소통 능력을 기를 수 있었습니다. 이러한 경험은 귀사에서도 큰 도움이 될 것입니다.',
      blog: '물론입니다! 아래는 성수동 카페 방문 후기입니다.\n\n**분위기**: 카페는 다양한 좌석을 제공하고 있습니다. 또한, 조용한 분위기를 가지고 있습니다. 결론적으로, 공부하기에 좋은 장소라고 할 수 있습니다.'
    };
    var touched = false, played = false, T = [];   // T: 진행 중인 예시 타이머(내 글을 돌리거나 다시 보기면 멈춤)
    function stop() { T.forEach(clearTimeout); T = []; }
    function say(k, t) { st.innerHTML = (k === 'spin' ? '<span class="ds-spin" aria-hidden="true"></span>' : '<span class="dot' + (k ? ' ' + k : '') + '"></span>') + '<span>' + esc(t) + '</span>'; }
    function later(fn, ms) { T.push(setTimeout(fn, ms)); }
    var pick = $('#huPick'), clr = $('#huClr');
    function count() { if (cnt) cnt.textContent = ta.value.length.toLocaleString('ko-KR') + ' / 6,000자'; var has = ta.value.length > 0; if (pick) pick.hidden = has; if (clr) clr.hidden = !has; }
    if (clr) clr.addEventListener('click', function () { ta.value = ''; count(); try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); } });
    function focusTa(scroll) {
      if (scroll && window.innerWidth < 900) ta.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); } }, scroll && !RM ? 320 : 0);
    }
    function use(k, scroll) {
      ta.value = EX[k] || ''; count(); touched = true; if (!played) still();
      if (scroll) ta.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); } }, scroll && !RM ? 420 : 0);
    }
    ta.addEventListener('input', function () { count(); touched = true; if (!played) still(); });
    count();
    $$('[data-ex]').forEach(function (b) { b.addEventListener('click', function () { use(b.getAttribute('data-ex')); }); });
    $$('[data-use]').forEach(function (b) { b.addEventListener('click', function () { use(b.getAttribute('data-use'), true); }); });
    $$('[data-focus]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var t = document.getElementById(a.getAttribute('data-focus')); if (!t) return;
        e.preventDefault(); t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
        setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (x) { t.focus(); } }, RM ? 0 : 450);
      });
    });
    function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = 'w' + Math.random().toString(36).slice(2, 12); } return c; }
    function handoff(act) {
      var t = ta.value.trim();
      if (t.replace(/\s+/g, '').length < 20) { hint(); return; }
      try { sessionStorage.setItem('am_hz_in', JSON.stringify({ text: t.slice(0, 50000), act: act, tone: tone ? tone.value : 'auto' })); } catch (e) { /* 저장 없이 */ }
      location.href = ROOT + 'humanize/#hz';
    }
    function hint() {
      stop(); touched = true; played = true;
      paper.style.minHeight = '';
      say('warn', '글을 20자 이상 넣어 주세요');
      paper.innerHTML = '<p class="hu-empty">입력창에 글을 붙여 넣거나 <b>예시</b> 단추를 눌러 보세요. 넣은 글은 처리할 때만 보내고 저장하지 않습니다.</p>';
      meter.hidden = true; why.innerHTML = ''; foot.innerHTML = ''; replay.hidden = !DEMO;
      if (window.innerWidth < 900) focusTa(true); else { try { ta.focus({ preventScroll: true }); } catch (e) { ta.focus(); } }
      ta.classList.add('hu-need'); setTimeout(function () { ta.classList.remove('hu-need'); }, 1200);
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
    /* 예시는 바꾼 곳 목록(원래 말 → 바꾼 말)대로 정확히 나눔 */
    function pairOps(src, list) {
      var ops = [], at = 0;
      list.forEach(function (w) { var i = src.indexOf(w[0], at); if (i < 0) return; if (i > at) ops.push(['=', src.slice(at, i)]); ops.push(['-', w[0], w]); ops.push(['+', w[1]]); at = i + w[0].length; });
      if (at < src.length) ops.push(['=', src.slice(at)]);
      return ops;
    }
    /* 종이 위에 원문을 그리고(바꾼 말은 숨겨 둠), 바뀌는 곳 목록을 돌려줌 */
    function build(ops) {
      var nodes = [], changes = [];
      paper.innerHTML = '';
      var p = document.createElement('p'); p.className = 'hu-doc'; paper.appendChild(p);
      ops.forEach(function (o) {
        var el, last = changes[changes.length - 1];
        if (o[0] === '+') { el = document.createElement('ins'); el.textContent = o[1]; el.hidden = true; if (last && !last.ins && last.pos === nodes.length - 1) last.ins = el; else changes.push({ del: null, ins: el, pos: nodes.length }); }
        else if (o[0] === '-') { el = document.createElement('span'); el.className = 'hu-d'; el.setAttribute('data-t', o[1]); changes.push({ del: el, ins: null, pos: nodes.length, w: o[2] || null }); }
        else { el = document.createElement('span'); el.setAttribute('data-t', o[1]); }
        p.appendChild(el); nodes.push(el);
      });
      return { p: p, orig: nodes.filter(function (n) { return n.tagName !== 'INS'; }), changes: changes };
    }
    function fill(P) { P.orig.forEach(function (n) { n.textContent = n.getAttribute('data-t'); }); }
    function finish(P) { fill(P); P.changes.forEach(function (c) { if (c.del) { c.del.classList.remove('f'); c.del.classList.add('x'); } if (c.ins) { c.ins.hidden = false; c.ins.classList.add('in'); c.ins.classList.remove('now'); } }); }
    function reset(P) { P.changes.forEach(function (c) { if (c.del) c.del.classList.remove('f', 'x'); if (c.ins) { c.ins.hidden = true; c.ins.classList.remove('in', 'now'); } }); }
    function hold(P) { finish(P); paper.style.minHeight = paper.offsetHeight + 'px'; reset(P); }   // 끝 모양의 높이를 미리 잡아 둠
    function typeIn(P, done) {
      var all = P.orig.map(function (n) { return n.getAttribute('data-t'); }), total = all.join('').length, k = 0;
      P.orig.forEach(function (n) { n.textContent = ''; });
      P.p.classList.add('typing');
      var step = Math.max(3, Math.ceil(total / 64));   // 약 1.4초에 다 씀
      (function tick() {
        var left = step;
        while (left > 0 && k < P.orig.length) {
          var full = all[k], cur = P.orig[k].textContent.length, take = Math.min(left, full.length - cur);
          P.orig[k].textContent = full.slice(0, cur + take); left -= take;
          if (P.orig[k].textContent.length >= full.length) k++;
        }
        if (k < P.orig.length) later(tick, 22); else { P.p.classList.remove('typing'); done(); }
      })();
    }
    function mark(P, gap, done) {
      var i = 0;
      (function next() { if (i >= P.changes.length) return done(); var c = P.changes[i++]; if (c.del) c.del.classList.add('f'); later(next, gap); })();
    }
    function swap(P, gap, each, done) {
      var i = 0;
      (function next() {
        if (i >= P.changes.length) return done();
        var c = P.changes[i++], prev = P.changes[i - 2];
        if (prev && prev.ins) prev.ins.classList.remove('now');
        if (c.del) { c.del.classList.remove('f'); c.del.classList.add('x'); }
        if (c.ins) later(function () { c.ins.hidden = false; c.ins.classList.add('in'); if (each) c.ins.classList.add('now'); }, Math.round(gap * 0.4));
        if (each) each(c);
        later(next, gap);
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
    function tickHtml(w) { return '<p class="hu-tick"><span class="hu-fx"><del>' + esc(w[0]) + '</del><ins>' + esc(w[1]) + '</ins></span><span class="wy">' + esc(w[2] || '') + '</span></p>'; }
    function whyHtml(list, more, open) {
      return '<details class="hu-whyd"' + (open ? ' open' : '') + '><summary>바꾼 곳과 이유 <b>' + list.length + '</b></summary><ol>' + list.map(function (w) { return '<li><span class="hu-fx"><del>' + esc(w[0]) + '</del><ins>' + esc(w[1]) + '</ins></span><span class="wy">' + esc(w[2] || '') + '</span></li>'; }).join('') + '</ol>' + (more ? '<p class="k-small">' + esc(more) + '</p>' : '') + '</details>';
    }

    /* 자동 예시 */
    var DEMO = null;
    try { DEMO = JSON.parse(($('#huDemo') || {}).textContent || 'null'); } catch (e) { DEMO = null; }
    function demoEnd(P) {
      say('ok', '휴머나이징 완료 · 바꾼 곳 ' + DEMO.why.length + '곳');
      setM(MT, DEMO.after.rate, DEMO.after.band, DEMO.before.rate);
      why.innerHTML = whyHtml(DEMO.why);
      replay.hidden = false; paper.style.minHeight = '';
      if (P) P.changes.forEach(function (c) { if (c.ins) c.ins.classList.remove('now'); });
      live.textContent = '예시: ' + DEMO.label.replace(/^예시 · /, '') + '. ' + DEMO.why.map(function (w) { return w[0] + '을 ' + w[1] + '로'; }).join(', ') + ' 바꿨습니다. AI 작성률(추정)은 ' + DEMO.before.rate + '%에서 ' + DEMO.after.rate + '%가 되었습니다.';
    }
    function demoBase() {
      stop(); played = true;
      replay.hidden = true; meter.hidden = false; why.innerHTML = ''; foot.innerHTML = FOOT0;
      stage.classList.remove('is-user'); stage.classList.add('is-demo');
      setM(MF, null); setM(MT, null);
      var P = build(pairOps(DEMO.src, DEMO.why));
      hold(P); return P;
    }
    function still() {   // 움직이지 않는 예시(끝 모양)
      if (!DEMO) return;
      var P = demoBase(); finish(P);
      st.innerHTML = '';
      var keep = RM; RM = true; setM(MF, DEMO.before.rate, DEMO.before.band); demoEnd(P); RM = keep;
    }
    function demo() {
      if (!DEMO) return;
      if (RM) { still(); return; }
      var P = demoBase();
      say('', 'AI 초안 · ' + DEMO.label.replace(/^예시 · /, ''));
      typeIn(P, function () {
        later(function () {
          say('warn', 'AI 말버릇 ' + DEMO.why.length + '곳을 찾았어요');
          setM(MF, DEMO.before.rate, DEMO.before.band, 0);
          mark(P, 150, function () {
            later(function () {
              say('run', '사람 말투로 바꾸는 중');
              swap(P, 860, function (c) { if (c.w) why.innerHTML = tickHtml(c.w); }, function () { later(function () { demoEnd(P); }, 300); });
            }, 700);
          });
        }, 420);
      });
    }
    replay.addEventListener('click', function () { demo(); });
    foot.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hu]'); if (!b) return;
      var k = b.getAttribute('data-hu');
      if (k === 'mine') focusTa(true); else handoff(k);
    });
    if (DEMO) {
      if (!('IntersectionObserver' in window)) demo();
      else {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); if (touched) { if (!played) still(); } else later(function () { if (!played) demo(); }, 400); } }); }, { threshold: 0.35 });
        io.observe(stage);
      }
    }

    /* 내 글: 첫 문단 무료 맛보기(같은 방식으로 바뀐 곳을 보여 줌) */
    bChk.addEventListener('click', function () { handoff('check'); });
    bRun.addEventListener('click', function () {
      var t = ta.value.trim();
      if (t.replace(/\s+/g, '').length < 20) { hint(); return; }
      if (!window.AM || !AM.call) return;
      stop(); touched = true; played = true;
      bRun.disabled = true; replay.hidden = true; meter.hidden = true; why.innerHTML = ''; foot.innerHTML = ''; paper.style.minHeight = '';
      stage.classList.remove('is-demo'); stage.classList.add('is-user');
      say('spin', '첫 문단을 사람 말투로 바꾸는 중');
      paper.innerHTML = '<p class="hu-doc wait">' + esc(t.split(/\n\s*\n/)[0].slice(0, 520)) + '</p>';
      if (window.innerWidth < 900) stage.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      var hq = { text: t.slice(0, 6000), tone: tone ? tone.value : 'auto', cid: cid() };
      (AM.callRetry ? AM.callRetry('am.humanize', hq, 60000, function () { say('spin', '서버 응답이 늦어 한 번 더 보냈어요. 조금만 기다려 주세요'); }) : AM.call('am.humanize', hq, 60000)).then(function (r) {
        if (!r || !r.ok) throw r || {};
        var src = String(r.src || ''), out = String(r.text || ''), same = out.trim() === src.trim();
        var P = build(diffOps(src, out)), n = r.changes || P.changes.length;
        var end = function () {
          say('ok', same ? '바꿀 곳이 거의 없었어요' : '첫 문단 휴머나이징 · 바꾼 곳 ' + n + '곳');
          var list = (r.samples || []).map(function (x) { return [x.from || '', x.to || '', x.why || '']; }).filter(function (x) { return x[0] || x[1]; });
          var more = (n > list.length ? '바꾼 곳 ' + n + '곳 가운데 ' + list.length + '곳의 이유입니다. ' : '') + (r.toneNote ? r.toneNote : '');
          if (list.length) why.innerHTML = whyHtml(list, more, true);
          else if (same) why.innerHTML = '<p class="k-small">이 문단은 이미 사람 말투에 가까워요. AI 작성률 검사로 문장마다 확인해 보세요.</p>';
          paper.style.minHeight = '';
          var rest = Math.max(0, (r.total || t.length) - (r.shown || src.length));
          foot.innerHTML = '<button class="k-btn k-btn-p k-btn-s" type="button" data-hu="pro">글 전체 휴머나이징</button><button class="k-btn k-btn-l k-btn-s" type="button" data-hu="check">AI 작성률 보기</button>' +
            '<span class="k-small">' + (rest > 0 ? '나머지 ' + rest.toLocaleString('ko-KR') + '자와 다른 버전은 글 전체 휴머나이징에서' : '숫자, 이름, 인용은 그대로 두었어요') + '</span>';
          live.textContent = same ? '이 문단은 바꿀 곳이 거의 없었습니다.' : '첫 문단에서 ' + n + '곳을 바꿨습니다.';
        };
        if (RM) { finish(P); end(); return; }
        hold(P); fill(P);
        say('warn', 'AI 말버릇 ' + P.changes.length + '곳');
        mark(P, 90, function () { later(function () { swap(P, 300, null, function () { later(end, 200); }); }, 300); });
      }).catch(function (e) {
        var slow = e && (e.name === 'AbortError' || e.name === 'TypeError');
        say('bad', '지금은 바꾸지 못했어요');
        paper.style.minHeight = '';
        paper.innerHTML = '<div class="ds-alert err">' + ICO_ALERT + '<div>' + esc(slow ? (e.name === 'TypeError' ? '서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요. 넣은 글은 그대로 있습니다.' : '서버 응답이 늦어 결과를 받지 못했어요. 잠시 뒤 다시 시도해 주세요. 넣은 글은 그대로 있습니다.') : (e && e.message) || '지금은 휴머나이징을 할 수 없어요. 잠시 뒤 다시 시도해 주세요.') + '</div></div>';
        foot.innerHTML = '<button class="k-btn k-btn-l k-btn-s" type="button" id="huRetry">다시 시도</button>';
        var rb = $('#huRetry'); if (rb) rb.addEventListener('click', function () { bRun.click(); });
      }).then(function () { bRun.disabled = false; });
    });
    var ICO_ALERT = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';
  })();
})();
/* 휴대폰 공유하기로 이미지 받기(웹 앱 공유 대상): 공유받은 요청만 맡는 작은 서비스 워커를 둡니다 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  var root = document.body.getAttribute('data-root') || '';
  window.addEventListener('load', function () { setTimeout(function () { navigator.serviceWorker.register(root + 'aimarker-sw.js', { scope: root || './' }).catch(function () { /* 무시 */ }); }, 1200); });
})();
