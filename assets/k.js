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

  /* ---------- 첫 화면 작업창 ---------- */
  var desk = $('#desk');
  if (!desk) return;
  var tabs = $$('[role="tab"]', desk);
  function show(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
      var o = document.getElementById(t.getAttribute('data-out')); if (o) o.hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.getAttribute('aria-controls')); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, j = (k === 'ArrowRight' || k === 'ArrowDown') ? i + 1 : (k === 'ArrowLeft' || k === 'ArrowUp') ? i - 1 : k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : -2;   // 11.0 넓은 화면은 세로 메뉴라 위아래 화살표도
      if (j === -2) return; e.preventDefault(); j = (j + tabs.length) % tabs.length; tabs[j].focus(); show(tabs[j].getAttribute('aria-controls'));
    });
  });
  var hashTab = { '#site': 'dk-site', '#file': 'dk-file' }[location.hash];
  if (hashTab) show(hashTab);

  var ta = $('#dkText'), cnt = $('#dkCnt'), outT = $('#do-text'), tone = $('#dkTone');
  if (!ta) return;
  var EX = {
    report: '현대 사회에서 소셜 미디어는 청소년의 정체성 형성에 중요한 역할을 하고 있다. 또한, 다양한 플랫폼을 통해 청소년들은 자신을 표현하고 타인과 소통하는 새로운 방식을 경험하고 있다. 이러한 변화는 긍정적인 측면과 부정적인 측면을 동시에 가지고 있다.\n\n첫째, 소셜 미디어는 청소년에게 다양한 정보와 관점을 접할 수 있는 기회를 제공한다. 둘째, 또래와의 관계를 유지하고 확장하는 데 있어서 효과적인 도구로 작용한다. 그러나 과도한 사용은 비교 심리와 불안감을 유발할 수 있다는 점에서 주의가 필요하다.\n\n결론적으로, 소셜 미디어의 영향은 사용 방식에 따라 크게 달라진다고 할 수 있다. 따라서 청소년의 건강한 미디어 이용 습관을 형성하기 위한 교육적 노력이 무엇보다 중요하다.',
    thesis: '본 연구는 대학생의 생성형 AI 활용 수준이 학업 자기효능감과 학업 성취에 미치는 영향을 분석하는 것을 목적으로 한다. 이를 위해 수도권 소재 4년제 대학 재학생 312명을 대상으로 설문 조사를 실시하였으며, 수집된 자료는 구조방정식 모형을 통해 분석하였다.\n\n연구 결과, 생성형 AI 활용 수준은 학업 자기효능감에 유의미한 정적 영향을 미치는 것으로 나타났다. 또한, 학업 자기효능감은 생성형 AI 활용과 학업 성취 간의 관계를 부분 매개하는 것으로 확인되었다. 이러한 결과는 생성형 AI가 학습 과정에 있어서 중요한 역할을 할 수 있음을 시사한다.\n\n본 연구는 생성형 AI 활용에 관한 실증적 근거를 제공하였다는 점에서 의의가 있다. 향후 연구에서는 다양한 전공과 학년을 고려한 추가적인 분석이 필요할 것으로 판단된다.',
    essay: '저는 대학 시절 봉사 동아리 활동을 통해 협업의 중요성을 배웠습니다. 동아리 활동에 있어서 저는 기획을 맡았습니다. 기획 과정에서 다양한 의견이 충돌하였습니다. 저는 팀원들과 대화를 통해 갈등을 해결하였고, 이를 통해 소통 능력을 기를 수 있었습니다. 이러한 경험은 귀사에서도 큰 도움이 될 것입니다.',
    blog: '물론입니다! 아래는 성수동 카페 방문 후기입니다.\n\n**분위기**: 카페는 다양한 좌석을 제공하고 있습니다. 또한, 조용한 분위기를 가지고 있습니다. 결론적으로, 공부하기에 좋은 장소라고 할 수 있습니다.'
  };
  function count() { if (cnt) cnt.textContent = ta.value.length.toLocaleString('ko-KR') + ' / 6,000자'; }
  ta.addEventListener('input', count); count();
  $$('[data-ex]', desk).forEach(function (b) { b.addEventListener('click', function () { ta.value = EX[b.getAttribute('data-ex')] || ''; count(); ta.focus(); }); });
  function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = 'w' + Math.random().toString(36).slice(2, 12); } return c; }
  function need() {
    var t = ta.value.trim();
    if (t.replace(/\s+/g, '').length < 20) { outT.innerHTML = '<div class="k-err">검사할 글을 20자 이상 넣어 주세요. 위의 예시 단추를 눌러 바로 볼 수도 있습니다.</div>'; ta.focus(); return ''; }
    return t;
  }
  function handoff(act) {
    var t = need(); if (!t) return;
    try { sessionStorage.setItem('am_hz_in', JSON.stringify({ text: t.slice(0, 50000), act: act, tone: tone ? tone.value : 'auto' })); } catch (e) { /* 저장 없이 */ }
    location.href = ROOT + 'humanize/#hz';
  }
  function diffOps(a, b) {   // 낱말 단위로 바뀐 곳(뺀 말 · 넣은 말)
    var tk = function (x) { return x.match(/\s+|[^\s]+/g) || []; }, A = tk(a), B = tk(b), n = A.length, m = B.length, ops = [], i, j;
    if (n * m > 4000000) return [['-', a], ['+', b]];
    var W = m + 1, dp = new Uint16Array((n + 1) * W);
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i * W + j] = A[i] === B[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    var push = function (k, t) { var l = ops[ops.length - 1]; if (l && l[0] === k) l[1] += t; else ops.push([k, t]); };
    i = 0; j = 0;
    while (i < n && j < m) { if (A[i] === B[j]) { push('=', A[i]); i++; j++; } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { push('-', A[i]); i++; } else { push('+', B[j]); j++; } }
    while (i < n) push('-', A[i++]); while (j < m) push('+', B[j++]);
    var R = [], del = '', ins = '', open = false, flush = function () { if (del) R.push(['-', del]); if (ins) R.push(['+', ins]); del = ins = ''; open = false; };
    ops.forEach(function (o, k) {   // 빈칸만 사이에 둔 바뀜은 한 덩어리로
      if (o[0] === '=') { var nx = ops[k + 1]; if (open && !o[1].trim() && nx && nx[0] !== '=') { del += o[1]; ins += o[1]; return; } flush(); R.push(o); return; }
      open = true; if (o[0] === '-') del += o[1]; else ins += o[1];
    });
    flush(); return R;
  }
  var bC = $('#dkCheck'), bP = $('#dkPro');
  if (bC) bC.addEventListener('click', function () { handoff('check'); });
  if (bP) bP.addEventListener('click', function () {
    var t = need(); if (!t || !window.AM || !AM.call) return;
    bP.disabled = true;
    outT.innerHTML = '<div class="k-busy"><i></i>첫 문단을 사람 말투로 바꾸는 중입니다</div>';
    var hq = { text: t.slice(0, 6000), tone: tone ? tone.value : 'auto', cid: cid() };   // 무료 맛보기라 응답이 없으면 한 번 더 보냄(AM.callRetry)
    (AM.callRetry ? AM.callRetry('am.humanize', hq, 60000, function () { var b = outT.querySelector('.k-busy'); if (b) b.lastChild.textContent = '서버 응답이 늦어 한 번 더 보냈습니다. 조금만 더 기다려 주세요'; }) : AM.call('am.humanize', hq, 60000)).then(function (r) {
      if (!r || !r.ok) throw r || {};
      var same = String(r.text || '').trim() === String(r.src || '').trim(), ops = diffOps(String(r.src || ''), String(r.text || ''));
      var left = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '-' ? '<del>' + esc(o[1]) + '</del>' : ''; }).join('');
      var right = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '+' ? '<ins>' + esc(o[1]) + '</ins>' : ''; }).join('');
      outT.innerHTML = '<div class="k-out-h"><small>휴머나이징 첫 문단, 무료 맛보기</small><span class="k-tag ok">바꾼 곳 ' + (r.changes || 0) + '곳</span></div>' +
        '<div class="k-cmp"><div><small>원문</small><p>' + left + '</p></div><div class="after"><small>사람 말투로</small><p>' + right + '</p></div></div>' +
        (r.toneNote ? '<p class="k-note-line">' + esc(r.toneNote) + '</p>' : '') +
        (same && !r.toneNote ? '<p class="k-note-line">이 문단은 이미 사람 말투에 가까워 바꿀 곳이 거의 없었습니다.</p>' : '') +
        '<div class="k-out-f"><p class="k-small">숫자, 이름, 인용은 그대로 지킵니다. 글 전체와 다른 버전은 이용권으로 열립니다.</p>' +
        '<span><button class="k-btn k-btn-p k-btn-s" type="button" data-go="pro">글 전체 휴머나이징</button> <button class="k-btn k-btn-l k-btn-s" type="button" data-go="check">AI 작성률 보기</button></span></div>';
    }).catch(function (e) {
      var slow = e && (e.name === 'AbortError' || e.name === 'TypeError');
      outT.innerHTML = '<div class="k-err">' + esc(slow ? (e.name === 'TypeError' ? '서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.' : '서버 응답이 늦어 결과를 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.') : (e && e.message) || '지금은 휴머나이징을 할 수 없습니다. 잠시 뒤 다시 시도해 주세요.') + '</div>';
    }).then(function () { bP.disabled = false; });
  });
  outT.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) handoff(b.getAttribute('data-go')); });
})();
/* 휴대폰 공유하기로 이미지 받기(웹 앱 공유 대상): 공유받은 요청만 맡는 작은 서비스 워커를 둡니다 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  var root = document.body.getAttribute('data-root') || '';
  window.addEventListener('load', function () { setTimeout(function () { navigator.serviceWorker.register(root + 'aimarker-sw.js', { scope: root || './' }).catch(function () { /* 무시 */ }); }, 1200); });
})();
