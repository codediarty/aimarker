/* AIMarker AI 작성률 검사 · 휴머나이징 8.0 (2026.10.17 밤)
   - 판정 기준 AMJ-1.0: AI 작성률 · 판정(안전 · 고위험 · 부적합)과 판정 근거 · 구간(문단)별 검출 · AI 문체 특성 · 종합 분석 의견
   - 무료 맛보기(앞 6,000자, 이용권 첫 조각과 같은 범위 · 같은 값): 작성률 · 판정 · 근거 · 글자 수 · 구간 수 · 특성 이름 · 의견과 가장 뚜렷한 문장 2개.
     위치(문장별 색 · 구간) · 특성 예시 · 먼저 고칠 문장 · 결과상세내역서는 결제 뒤에 열림
   - 결제: 토스페이먼츠 바로 결제(서버가 키를 켰을 때) → 돌아오면 서버 승인 → 이용권 코드 → 같은 글을 바로 다시 검사 → 결과상세내역서.
     키가 없으면 주문 메일 방식. 글은 결제창으로 가는 동안 이 브라우저(세션 저장소)에만 잠시 둠
   - 서버 am.style · am.humanize · am.pass · am.passinfo · am.buy · am.payok. 판별 규칙 · 가중치는 서버에만 */
(function () {
  'use strict';
  var AM = window.AM || {}, $ = function (s, el) { return (el || document).querySelector(s); };
  var box = $('#hz'); if (!box || !AM.call) return;
  var ta = $('#hzText'), out = $('#hzOut'), btnC = $('#hzCheck'), btnF = $('#hzFix'), btnP = $('#hzPro'), passEl = $('#hzPass');
  var FREE_MAX = 6000, PAID_MAX = 50000, CHUNK = 6000, HUM_MAX = 3500, HELP_MAX = 600;
  var S = { pass: '', ps: null, passMsg: '', proReady: false, info: null, busy: false, res: null, fx: null, edits: {}, sel: -1, side: 'ai', cache: {}, first: true, paid: null };
  var LV = ['', '낮음', '중간', '높음'], ROOT = document.body.getAttribute('data-root') || '/';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* 판정 기준 AMJ-1.0(서버 detect.js 와 같은 숫자 · 같은 문장 틀). 여러 조각(6,000자씩)을 합칠 때만 사이트에서 다시 계산 */
  var J = { HI: 85, MID: 65, SHORT: 60, SEG_AI: 20, UNFIT_RATE: 40, RISK_RATE: 20, UNFIT_SEG: 50,
    B: { unfit: ['부적합', '부적합 · 개선 필요'], risk: ['고위험', '고위험 · 수정 권고'], safe: ['안전', '안전 · AI 패턴 적음'], short: ['판단 보류', '판단 보류 · 글이 짧음'] } };
  var PRODS = [
    { id: 's1', name: '1건 이용권', price: 1900, desc: '글 한 편 · 검사 · 다듬기 3회(6,000자마다 1회) · 결과상세내역서 · 24시간' },
    { id: 'd1', name: '24시간 이용권', price: 2900, best: 1, desc: '처음 쓴 때부터 24시간 · 검사 · 다듬기 40회 · 고급 휴머나이징 3회' },
    { id: 'm1', name: '30일 이용권', price: 9900, days: 30, desc: '처음 쓴 날부터 30일 · 하루 검사 · 다듬기 40회 · 고급 휴머나이징 하루 5회' },
    { id: 'q1', name: '90일 이용권', price: 19900, days: 90, desc: '처음 쓴 날부터 90일 · 하루 검사 · 다듬기 40회 · 고급 휴머나이징 하루 5회' }
  ];

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var n2 = function (n) { return Number(n || 0).toLocaleString('ko-KR'); };
  var pad3 = function (n) { return ('00' + n).slice(-3); };
  function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = c || 'w' + Math.random().toString(36).slice(2, 12); } return c; }
  function sget(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function sset(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* 저장 없이 */ } }
  function ssget(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function ssset(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 없이 */ } }
  function tone() { return ($('#hzTone') || {}).value || 'keep'; }
  function prod(id) { var L = (S.info && S.info.products && S.info.products.length) ? S.info.products : PRODS; for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function prods() { return (S.info && S.info.products && S.info.products.length) ? S.info.products : PRODS; }
  function call(action, data, ms) {
    return AM.call(action, Object.assign({ cid: cid() }, data || {}), ms || 60000).then(function (r) { if (!r || !r.ok) throw r || { message: '응답이 없습니다. 잠시 뒤 다시 시도해 주세요.' }; if (r.pass) { S.ps = r.pass; renderPass(); } return r; });
  }
  function ico(name) {
    var P = { lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', check: '<path d="M20 6 9 17l-5-5"/>', alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>', back: '<path d="M15 18l-6-6 6-6"/>', file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' };
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }

  /* ---------- 예시 · 글자 수 · 파일 ---------- */
  var HU = '지난 토요일에 동생이랑 망원동 시장에 갔다. 원래는 칼국수만 먹고 오려고 했는데 입구에서 파는 꽈배기 냄새를 못 참고 두 개나 사 먹었다. 설탕을 너무 많이 묻혀서 옷에 다 떨어졌음 ㅋㅋ\n\n칼국수집은 줄이 생각보다 길어서 20분쯤 기다렸다. 국물은 멸치 맛이 진하고 면이 좀 두꺼운 편인데 나는 이게 좋았다. 동생은 김치가 너무 시다고 투덜거렸지만 결국 한 그릇 다 비움. 다음엔 평일에 가 봐야겠다.';
  var EX = {
    report: '인공지능 기술은 현대 사회에서 중요한 역할을 하고 있습니다. 또한, 다양한 산업 분야에 있어서 혁신적인 변화를 이끌고 있습니다. 이를 통해 기업은 업무를 효과적으로 처리할 수 있습니다. 또한, 고객 경험을 극대화할 수 있습니다.\n\n그러나 인공지능의 활용에 있어서 개인정보 보호 문제가 발생할 수 있습니다. 따라서, 기업은 데이터를 체계적으로 관리할 필요가 있습니다. 결론적으로, 인공지능은 미래 사회의 핵심이라고 할 수 있습니다.',
    essay: '저는 대학 시절 봉사 동아리 활동을 통해 협업의 중요성을 배웠습니다. 동아리 활동에 있어서 저는 기획을 맡았습니다. 기획 과정에서 다양한 의견이 충돌하였습니다. 저는 팀원들과 대화를 진행함으로써 갈등을 해결하였습니다. 이처럼, 저는 소통 능력을 가지고 있습니다. 따라서, 귀사에서도 이러한 역량을 발휘할 수 있다고 볼 수 있습니다.',
    blog: '물론입니다! 아래는 성수동 카페 방문 후기입니다.\n\n## 분위기\n**넓은 공간**: 카페는 다양한 좌석을 제공하고 있습니다. 또한, 조용한 분위기를 가지고 있습니다. 결론적으로, 공부하기에 매우 좋은 장소라고 할 수 있습니다.\n\n도움이 되셨으면 좋겠습니다. 궁금한 점이 있으면 언제든지 물어보세요!',
    mixed: HU + '\n\n시장 방문은 지역 경제 활성화에 있어서 중요한 역할을 합니다. 또한, 전통시장은 다양한 먹거리와 문화를 경험할 수 있는 공간으로서 그 가치가 높습니다. 따라서, 앞으로도 많은 사람들이 전통시장을 방문하는 것이 바람직하다고 할 수 있습니다.',
    human: HU
  };
  function count() {
    var n = ta.value.length, extra = '';
    if (S.pass && n > CHUNK) extra = ' · 이번 검사는 이용권 ' + chunk(ta.value).parts.length + '회로 셉니다';
    else if (!S.pass && n > FREE_MAX) extra = ' · 무료 맛보기는 앞 6,000자 안쪽만 검사합니다';
    $('#hzCount').textContent = n2(n);
    $('#hzLimit').textContent = (S.pass ? '이용권 한 번에 5만 자' : '무료 맛보기 6,000자 · 이용권 5만 자') + extra;
  }
  ta.addEventListener('input', count);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ex]');
    if (b && EX[b.getAttribute('data-ex')]) { e.preventDefault(); ta.value = EX[b.getAttribute('data-ex')]; count(); box.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); ta.focus({ preventScroll: true }); return; }
    var y = e.target.closest('[data-buy]'); if (y) { e.preventDefault(); openBuy(y.getAttribute('data-buy')); return; }
    var c = e.target.closest('[data-code]'); if (c) { e.preventDefault(); openCode(); return; }
  });
  function jszip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = ROOT + 'assets/vendor/jszip.min.js'; s.onload = function () { ok(window.JSZip); }; s.onerror = function () { no(new Error('파일을 여는 도구를 불러오지 못했습니다.')); }; document.head.appendChild(s); });
  }
  function xmlDec(s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); }).replace(/&amp;/g, '&'); }
  function paras(xml, endTag, tRe) {
    return xml.split(endTag).map(function (p) { var t = ''; p.replace(tRe, function (m, x) { t += x != null ? x.replace(/<[^>]+>/g, '') : ' '; return m; }); return xmlDec(t).replace(/[ \t]+/g, ' ').trim(); }).filter(function (x) { return x; }).join('\n\n');
  }
  function readFile(f) {
    var nm = String(f.name || '').toLowerCase();
    if (f.size > 30 * 1024 * 1024) return Promise.reject(new Error('30MB보다 큰 파일은 열지 않습니다. 글을 복사해 붙여 넣어 주세요.'));
    if (/\.(txt|md)$/.test(nm) || f.type === 'text/plain') return f.text();
    if (/\.docx$/.test(nm)) return jszip().then(function (Z) { return Z.loadAsync(f); }).then(function (z) { var e = z.file('word/document.xml'); if (!e) throw new Error('Word 문서에서 본문을 찾지 못했습니다.'); return e.async('string'); }).then(function (x) { return paras(x, /<\/w:p>/, /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g); });
    if (/\.hwpx$/.test(nm)) return jszip().then(function (Z) { return Z.loadAsync(f); }).then(function (z) { var fs = z.file(/^Contents\/section\d+\.xml$/i).sort(function (a, b) { return a.name.localeCompare(b.name, 'en', { numeric: true }); }); if (!fs.length) throw new Error('한글 문서에서 본문을 찾지 못했습니다.'); return Promise.all(fs.map(function (x) { return x.async('string'); })); }).then(function (xs) { return xs.map(function (x) { return paras(x, /<\/hp:p>/, /<hp:t(?:\s[^>]*)?>([\s\S]*?)<\/hp:t>/g); }).join('\n\n'); });
    if (/\.(hwp|pdf|doc)$/.test(nm)) return Promise.reject(new Error('.hwp · .pdf · .doc 는 아직 바로 열지 못합니다. 글을 복사해 붙여 넣거나 .docx · .hwpx 로 저장해 넣어 주세요.'));
    return Promise.reject(new Error('Word(.docx) · 한글(.hwpx) · 텍스트(.txt) 파일을 넣어 주세요.'));
  }
  function takeFile(f) {
    if (!f) return;
    readFile(f).then(function (t) { t = String(t || '').replace(/\r\n?/g, '\n').trim(); if (!t) throw new Error('파일에서 글을 찾지 못했습니다.'); ta.value = t.slice(0, PAID_MAX); S.docName = String(f.name || '').slice(0, 80); count(); note('“' + f.name + '”에서 글 ' + n2(t.length) + '자를 꺼내 왔습니다' + (t.length > PAID_MAX ? '(5만 자까지만 넣었습니다)' : '') + '. 이제 검사하세요.'); })
      .catch(function (e) { fail(e); });
  }
  $('#hzFile').addEventListener('change', function (e) { takeFile(e.target.files && e.target.files[0]); e.target.value = ''; });
  var drop = $('#hzDrop');
  ['dragenter', 'dragover'].forEach(function (k) { drop.addEventListener(k, function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { e.preventDefault(); drop.classList.add('over'); } }); });
  ['dragleave', 'drop'].forEach(function (k) { drop.addEventListener(k, function () { drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { e.preventDefault(); takeFile(e.dataTransfer.files[0]); } });

  /* ---------- 이용권 ---------- */
  function norm(c) { return String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); }
  function fmtCode(c) { return norm(c).replace(/(.{4})(?=.)/g, '$1-'); }
  function setPass(c) { S.pass = fmtCode(c); sset('am_pass', S.pass); }
  function clearPass() { S.pass = ''; S.ps = null; sset('am_pass', null); }
  function md(s) { var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(s || ''); return m ? (+m[2]) + '월 ' + (+m[3]) + '일 ' + m[4] + ':' + m[5] : s; }
  function renderPass() {
    var h;
    if (S.pass && S.ps) {
      var p = S.ps, when = p.started ? (p.daily ? md(p.end).replace(/ \d\d:\d\d$/, '') + '까지 · 오늘 ' : md(p.end) + '까지 · ') : (p.daily ? '처음 쓴 날부터 · 하루 ' : '처음 검사한 때부터 24시간 · ');
      h = '<span class="chip on">' + ico('check') + esc(p.name) + '</span><span>' + when + '남은 검사 · 다듬기 <b>' + n2(p.left) + '</b>회' + (S.proReady && p.pro ? ' · 고급 ' + n2(p.proLeft) + '회' : '') + '</span><span class="sp"></span><button type="button" class="hz7-link" data-code>코드 바꾸기</button>';
    } else if (S.pass) h = '<span class="chip">이용권 확인 중</span><span>' + esc(S.pass) + '</span>';
    else h = '<span class="chip off">무료 맛보기</span><span>' + (S.passMsg ? esc(S.passMsg) : '앞 6,000자 · AI 작성률 · 판정과 근거 · 가장 뚜렷한 문장 2개까지') + '</span><span class="sp"></span><button type="button" class="hz7-link" data-code>이용권 코드 넣기</button><button type="button" class="hz7-link" data-buy="d1">이용권 사기</button>';
    passEl.innerHTML = h; count();
  }
  function peek() {
    if (!S.pass) return renderPass();
    call('am.pass', { pass: S.pass }, 20000).then(function (r) { S.ps = r.pass; S.passMsg = ''; renderPass(); })
      .catch(function (e) { if (e && e.code === 'PASS') { S.passMsg = e.message; clearPass(); } renderPass(); });
  }
  var Q = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { Q[k] = v; }); } catch (eQ) { Q = {}; }
  (function () {
    if (Q.pass) { setPass(Q.pass); try { history.replaceState(null, '', location.pathname + location.hash); } catch (e2) { /* 주소 그대로 */ } }
    else if (sget('am_pass')) S.pass = sget('am_pass');
    renderPass(); if (!(Q.pay === 'ok' && Q.paymentKey)) peek();
  })();
  var infoP = call('am.passinfo', {}, 20000).then(function (r) { S.info = r; S.proReady = !!r.proReady; proBtn(); renderPass(); return r; }).catch(function () { proBtn(); return null; });
  function proBtn() { btnP.disabled = !S.proReady; $('#hzProTag').textContent = S.proReady ? '이용권' : '준비 중'; btnP.title = S.proReady ? '생성 AI가 문장을 새로 써 줍니다(이용권 고급 횟수)' : '고급 휴머나이징은 준비 중입니다'; }
  function payReady() { return !!(S.info && S.info.pay && S.info.pay.ready && S.info.pay.clientKey); }

  /* ---------- 글 나누기(같은 글은 언제나 같게) ---------- */
  function chunk(text) {
    var t = String(text).replace(/\r\n?/g, '\n'), parts = [], seps = [];
    if (t.length <= CHUNK) return { parts: [t], seps: [] };
    var ps = t.split(/\n{2,}/), cur = '';
    var push = function (s, sep) { if (!s.trim()) return; if (parts.length) seps.push(sep); parts.push(s); };
    var pend = '\n\n';
    ps.forEach(function (p) {
      if (p.length > CHUNK) {
        if (cur) { push(cur, pend); cur = ''; }
        var bits = p.match(/[^.!?。！？…\n]+[.!?。！？…]+["'”’)\]]*\s*|[^.!?。！？…\n]*\n|[^.!?。！？…\n]+$/g) || [p], c = '', first = true;
        bits.forEach(function (b) {
          if ((c + b).length > CHUNK && c) { push(c, first ? '\n\n' : ''); first = false; c = ''; }
          if (b.length > CHUNK) { for (var i = 0; i < b.length; i += CHUNK) { push(b.slice(i, i + CHUNK), first ? '\n\n' : ''); first = false; } } else c += b;
        });
        if (c) { push(c, first ? '\n\n' : ''); }
        pend = '\n\n';
        return;
      }
      var add = cur ? cur + '\n\n' + p : p;
      if (add.length > CHUNK && cur) { push(cur, pend); pend = '\n\n'; cur = p; } else cur = add;
    });
    if (cur) push(cur, pend);
    return { parts: parts, seps: seps };
  }
  function seq(list, fn) { var res = []; return list.reduce(function (p, x, i) { return p.then(function () { return fn(x, i).then(function (r) { res.push(r); }); }); }, Promise.resolve()).then(function () { return res; }); }
  function sha(s) {
    try { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); } catch (e) { return Promise.resolve(''); }
  }

  /* ---------- 판정(여러 조각을 합칠 때) ---------- */
  function judge(s) {
    var why = [], mk = function (k, w) { return { key: k, ko: J.B[k][0], label: J.B[k][1], why: w }; };
    if (s.chars < J.SHORT) return mk('short', ['글자 수 ' + s.chars + '자(' + J.SHORT + '자 미만은 판단하지 않음)']);
    if (s.rate >= J.UNFIT_RATE) why.push('AI 작성률 ' + s.rate + '%(부적합 기준 ' + J.UNFIT_RATE + '% 이상)');
    if (s.segN >= 2 && s.segAi * 100 >= s.segN * J.UNFIT_SEG) why.push('AI 검출 구간 ' + s.segAi + '/' + s.segN + '구간(부적합 기준 전체 구간의 절반 이상)');
    if (s.chat >= 1) why.push('AI 대화창 흔적 ' + s.chat + '곳(부적합 기준 1곳 이상)');
    if (why.length) return mk('unfit', why);
    if (s.rate >= J.RISK_RATE) why.push('AI 작성률 ' + s.rate + '%(고위험 기준 ' + J.RISK_RATE + '% 이상)');
    if (s.segAi >= 1) why.push('AI 검출 구간 ' + s.segAi + '/' + s.segN + '구간(고위험 기준 1구간 이상)');
    if (s.hi + s.mid >= 1) why.push('AI 가능성 중간 이상 문장 ' + (s.hi + s.mid) + '개(고위험 기준 1개 이상)');
    if (why.length) return mk('risk', why);
    return mk('safe', ['AI 작성률 ' + s.rate + '%(' + J.RISK_RATE + '% 미만)', 'AI 검출 구간 없음', 'AI 가능성 중간 이상 문장 없음']);
  }
  function josa(w, a, b) { var c = String(w || '').replace(/['"’”)\]\s]+$/, '').slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; }
  function opinion(o) {
    var L = [], b = o.band.key, f = o.feat || [];
    if (b === 'short') return ['글이 ' + o.chars + '자로 짧아 판단하지 않았습니다. ' + J.SHORT + '자 이상, 가능하면 세 문장 이상을 넣어 주세요.'];
    L.push(o.aiChars ? '검사한 글 ' + n2(o.chars) + '자 가운데 ' + n2(o.aiChars) + '자(' + o.rate + '%)가 AI 작성 패턴과 비슷한 문장으로 검출되었습니다.' : '검사한 글 ' + n2(o.chars) + '자에서 AI 작성 패턴과 비슷한 문장은 검출되지 않았습니다.');
    L.push(o.segAi ? o.segN + '개 구간 가운데 ' + o.segAi + '개 구간(' + Math.round(o.segAi / o.segN * 100) + '%)에서 AI 작성 패턴이 뚜렷합니다.' : o.segN + '개 구간 모두 AI 검출 구간 기준(구간 글자의 ' + J.SEG_AI + '% 이상)에 미치지 않았습니다.');
    if (f.length >= 2) L.push("가장 많이 나온 AI 문체 특성은 '" + f[0].name + "'" + josa(f[0].name, '과', '와') + " '" + f[1].name + "'입니다.");
    else if (f.length === 1) L.push("가장 많이 나온 AI 문체 특성은 '" + f[0].name + "'입니다.");
    else L.push('검출 구간이 없어 AI 문체 특성을 따로 꼽지 않았습니다.');
    var nAi = o.lv.hi + o.lv.mid + o.lv.low;
    L.push(nAi ? 'AI 검출 문장은 ' + nAi + '개(높음 ' + o.lv.hi + ' · 중간 ' + o.lv.mid + ' · 낮음 ' + o.lv.low + ')입니다.' + (o.lv.hi + o.lv.mid ? ' 높음 · 중간 문장부터 고쳐 쓰면 작성률이 가장 크게 내려갑니다.' : '') : 'AI 검출 문장이 없습니다.');
    if (b === 'unfit') L.push('현재 상태로 제출 · 게시하는 것은 권장하지 않습니다. 검출 문장을 직접 고쳐 쓰거나 휴머나이징으로 다듬은 뒤 다시 검사해 보세요.');
    else if (b === 'risk') L.push('제출 · 게시 전에 검출 구간을 한 번 더 다듬는 것을 권합니다. 고친 뒤 다시 검사하면 같은 기준으로 비교할 수 있습니다.');
    else L.push('눈에 띄는 AI 작성 패턴이 적습니다. 다만 추정값이므로 제출처의 AI 사용 규정을 함께 확인하세요.');
    return L;
  }
  function opDetail(M) {
    var L = [], idx = [];
    M.sentences.forEach(function (s, i) { if (s.g) idx.push(i); });
    idx.sort(function (a, b) { return M.sentences[b].p - M.sentences[a].p || a - b; });
    if (idx.length) L.push('먼저 고칠 문장: ' + idx.slice(0, 3).map(function (k) { return (k + 1) + '번째'; }).join(' · ') + ' 문장(AI 가능성이 높은 순서)');
    var ai = M.segs.filter(function (s) { return s.ai; });
    if (ai.length) {
      var top = ai.slice().sort(function (a, b) { return b.share - a.share || b.a - a.a || a.no - b.no; })[0];
      L.push('AI 검출이 가장 많은 구간: ' + top.no + '번째 구간(' + n2(top.c) + '자 가운데 ' + n2(top.a) + '자, ' + top.share + '%)');
      L.push('AI 검출 구간 위치: ' + ai.map(function (s) { return s.no; }).join(' · ') + '번째 구간(전체 ' + M.segs.length + '구간)');
    }
    return L;
  }

  /* ---------- 결과 합치기 ---------- */
  function lvOf(s) { if (!s || s.lock) return -1; if (s.g != null) return s.g; if (s.ai) return s.p >= 85 ? 3 : 2; return 0; }
  function merge(rs, full, src) {
    var M = { full: full, sentences: [], chars: 0, aiChars: 0, aiN: 0, n: 0, lv: { hi: 0, mid: 0, low: 0 }, segs: [], segN: 0, segAi: 0, segLock: 0, chat: 0, chatList: [], cns: [], cats: {}, sigs: [], samples: [], sigN: 0, cut: false, total: src.length, verse: false, model: '', crit: '', critName: '', note: '', trunc: false, at: new Date(), opDetailN: 0 };
    var poff = 0, soff = 0, fagg = {}, chatM = {}, one = null;
    rs.forEach(function (r, k) {
      var d = r.ai || r.aiAfter || {}, maxp = -1, ss = d.sentences || [];
      if (rs.length === 1) one = d;
      ss.forEach(function (s) { M.sentences.push({ t: s.t, p: s.p, g: s.g, ai: s.ai, nl: s.nl, para: s.para + poff, lock: s.lock, k: k, sig: [] }); if (s.para > maxp) maxp = s.para; });
      (d.segs || []).forEach(function (g) { M.segs.push({ no: M.segs.length + 1, s: g.s + soff, e: Math.min(g.e, Math.max(0, ss.length - 1)) + soff, c: g.c, a: g.a, share: g.share, ai: g.ai, hi: g.hi, mid: g.mid, low: g.low, feat: g.feat || [] }); });
      poff += maxp + 1; soff += ss.length;
      if ((d.n || 0) > ss.length) M.trunc = true;
      M.chars += d.chars || 0; M.aiChars += d.aiChars || 0; M.aiN += d.aiN || 0; M.n += d.n || 0;
      if (d.lv) { M.lv.hi += d.lv.hi || 0; M.lv.mid += d.lv.mid || 0; M.lv.low += d.lv.low || 0; }
      M.segN += d.segN || 0; M.segAi += d.segAi || 0; M.segLock += d.segLock || 0; M.chat += d.chat || 0; M.opDetailN += d.opDetailN || 0;
      (d.chatList || []).forEach(function (c) { var o = chatM[c.name] = chatM[c.name] || { name: c.name, n: 0, t: c.t }; o.n += c.n; });
      (d.feat || []).forEach(function (f) { var o = fagg[f.cat] = fagg[f.cat] || { cat: f.cat, name: f.name, segs: 0, n: 0, tags: [], why: f.why, lock: 0 }; o.segs += f.segs; o.n += f.n; if (f.lock) o.lock = 1; (f.tags || []).forEach(function (t) { if (o.tags.indexOf(t) < 0 && o.tags.length < 3) o.tags.push(t); }); });
      if (d.cn) M.cns.push(d.cn);
      M.model = d.model || M.model; M.crit = d.crit || M.crit; M.critName = d.critName || M.critName; M.note = d.note || M.note; M.verse = M.verse || !!d.verse;
      ((r.before && r.before.cats) || d.cats || []).forEach(function (c) { var o = M.cats[c.cat] = M.cats[c.cat] || { name: c.name, n: 0, ex: [] }; o.n += c.n; });
      (r.paragraphs || []).forEach(function (p) { (p.signals || []).forEach(function (g) { if (g.t) M.sigs.push({ k: k, t: g.t, why: g.why, catKo: g.catKo, cat: g.cat }); }); });
      (r.left || []).forEach(function (g) { if (g.t) M.sigs.push({ k: k, t: g.t, why: g.why, catKo: g.catKo }); });
      if (r.samples) M.samples = M.samples.concat(r.samples);
      M.sigN += r.sigN || 0;
      if (r.cut) M.cut = true;
    });
    M.rate = M.chars ? Math.round(M.aiChars / M.chars * 100) : 0;
    M.chatList = Object.keys(chatM).map(function (k) { return chatM[k]; });
    if (one && one.band) { M.band = one.band; M.opinion = one.opinion || []; M.opDetail = one.opDetail || []; M.feat = one.feat || []; }
    else {
      M.feat = Object.keys(fagg).map(function (k) { var o = fagg[k]; o.share = M.segAi ? Math.round(o.segs / M.segAi * 100) : 0; return o; }).sort(function (x, y) { return (y.segs - x.segs) || (y.n - x.n) || (x.cat - y.cat); });
      M.band = judge({ chars: M.chars, rate: M.rate, segN: M.segN, segAi: M.segAi, hi: M.lv.hi, mid: M.lv.mid, chat: M.chat });
      M.opinion = opinion(M); M.opDetail = full ? opDetail(M) : [];
    }
    M.level = M.band.key; M.levelKo = M.band.label; M.short = M.chars < 150;
    M.locked = !full; M.shown = M.sentences.filter(function (s) { return !s.lock && (s.g || s.ai); }).length;
    // 문체 신호를 문장에 잇기(같은 조각 안에서 앞에서부터)
    var byK = {}, ptr = {};
    M.sentences.forEach(function (s, i) { (byK[s.k] = byK[s.k] || []).push(i); });
    M.sigs.forEach(function (g) {
      var ids = byK[g.k] || [], from = ptr[g.k] || 0, hit = -1, j;
      for (j = from; j < ids.length; j++) if (M.sentences[ids[j]].t.indexOf(g.t) >= 0) { hit = j; break; }
      if (hit < 0) for (j = 0; j < from; j++) if (M.sentences[ids[j]].t.indexOf(g.t) >= 0) { hit = j; break; }
      if (hit >= 0) { ptr[g.k] = hit; M.sentences[ids[hit]].sig.push(g); }
      var c = g.cat != null && M.cats[g.cat]; if (c && c.ex.length < 3) c.ex.push(g.t);
    });
    return (M.cns.length > 1 ? sha(M.cns.join('|')).then(function (h) { M.cn = h ? 'D-' + h.slice(0, 5).toUpperCase() + '-' + h.slice(5, 10).toUpperCase() : M.cns[0]; return M; }) : Promise.resolve((M.cn = M.cns[0] || '', M)));
  }

  /* ---------- 진행 · 오류 ---------- */
  function setBusy(on) { S.busy = on; [btnC, btnF].forEach(function (b) { b.disabled = on; }); btnP.disabled = on || !S.proReady; }
  function prog(label, i, n) {
    var pct = n ? Math.round(i / n * 100) : 30;
    var el = $('.hz7-prog', out);
    if (!el) { out.innerHTML = '<div class="hz7-prog"><b></b><i><em></em></i><p>문장마다 앞뒤 문장과 함께 AI 글 패턴을 살피고, 정해진 판정 기준(판정 기준 1.0)으로 판정합니다. 같은 글은 언제나 같은 결과가 나옵니다.</p></div>'; el = $('.hz7-prog', out); }
    $('b', el).textContent = label + (n > 1 ? ' ' + i + ' / ' + n : ''); $('em', el).style.width = Math.max(6, pct) + '%';
  }
  function note(msg) { out.innerHTML = '<div class="hz7-prog"><b>' + esc(msg) + '</b></div>'; }
  function fail(e, retry) {
    var code = e && e.code, m = e && e.name === 'AbortError' ? '응답이 늦습니다. 잠시 뒤 다시 시도해 주세요.' : (e && (e.message || e.msg)) || '지금은 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
    var acts = '';
    var again = retry ? '<button class="btn btn-g btn-s" type="button" data-again>무료 맛보기로 보기</button>' : '';
    if (code === 'PASS') { clearPass(); S.passMsg = m; renderPass(); acts = '<button class="btn btn-g btn-s" type="button" data-code>코드 다시 넣기</button>' + again; }
    else if (code === 'PASS_END' || code === 'PASS_USED') acts = '<button class="btn btn-p btn-s" type="button" data-buy="d1">새 이용권 사기</button>' + again;
    else if (code === 'PASS_NEED') acts = '<button class="btn btn-p btn-s" type="button" data-buy="d1">24시간 이용권 2,900원</button><button class="btn btn-g btn-s" type="button" data-code>이용권 코드 넣기</button>';
    else if (code === 'FREE_DAY') acts = '<button class="btn btn-p btn-s" type="button" data-buy="s1">1건 이용권 1,900원</button><button class="btn btn-g btn-s" type="button" data-buy="d1">24시간 이용권 2,900원</button>';
    out.innerHTML = '<div class="hz7-err"><b>' + (code === 'PASS_NEED' ? '이용권이 필요해요' : '처리하지 못했어요') + '</b><span>' + esc(m) + '</span>' + (acts ? '<div class="row">' + acts + '</div>' : '') + '</div>';
    S.retry = retry || null;
  }
  function need(t) { if (!String(t).replace(/\s+/g, '')) { ta.focus(); out.innerHTML = '<div class="hz7-err">검사할 글을 먼저 넣어 주세요. 위의 예시 단추로 바로 해 볼 수도 있습니다.</div>'; return false; } return true; }
  function toOut() { if (S.first) { S.first = false; } try { var r = out.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight * .6) out.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); } catch (e) { /* 그대로 */ } }

  /* ---------- 검사 ---------- */
  function check(text, opt) {
    opt = opt || {};
    var t = String(text != null ? text : ta.value).replace(/\r\n?/g, '\n');
    if (!need(t) || S.busy) return Promise.resolve(null);
    var full = !!S.pass && !opt.free;
    if (full && t.length > PAID_MAX) { out.innerHTML = '<div class="hz7-err">이용권은 한 번에 5만 자까지 검사합니다. 나눠서 넣어 주세요.</div>'; return Promise.resolve(null); }
    var C0 = chunk(t), C = full ? C0 : { parts: [C0.parts[0]], seps: [] };
    if (full && S.ps) {   // 남은 횟수보다 많이 필요하면 미리 알림(중간에 멈춰 횟수만 쓰지 않게)
      var needN = C.parts.filter(function (p) { return !S.cache['c|' + p]; }).length;
      if (needN > S.ps.left) { out.innerHTML = '<div class="hz7-err"><b>남은 횟수가 모자라요</b><span>이 글은 6,000자씩 ' + C.parts.length + '번으로 나눠 검사해 이용권 ' + needN + '회가 필요합니다. 지금 남은 횟수는 ' + S.ps.left + '회입니다.</span><div class="row"><button class="btn btn-p btn-s" type="button" data-buy="d1">24시간 이용권 2,900원</button><button class="btn btn-g btn-s" type="button" data-again>앞 6,000자만 무료로 보기</button></div></div>'; S.retry = function () { check(t, { free: true }); }; return Promise.resolve(null); }
    }
    setBusy(true); prog('AI 작성률 검사 중', 0, C.parts.length);
    return seq(C.parts, function (part, i) {
      var key = 'c|' + part;
      if (full && S.cache[key]) { prog('AI 작성률 검사 중', i + 1, C.parts.length); return Promise.resolve(S.cache[key]); }
      return call('am.style', { text: part, mode: 'check', tone: tone(), pass: full ? S.pass : '' }, 90000).then(function (r) { if (full && r.full) S.cache[key] = r; prog('AI 작성률 검사 중', i + 1, C.parts.length); return r; });
    }).then(function (rs) {
      var isFull = rs.every(function (r) { return r.full; });
      return merge(rs, isFull, t);
    }).then(function (M) {
      M.src = t; M.C = C; if (!M.full && C0.parts.length > 1) { M.cut = true; M.cutAt = C.parts[0].length; }
      S.res = M; S.edits = {}; S.sel = -1; S.side = 'ai'; S.fx = null; renderRes(); toOut(); return M;
    }).catch(function (e) { fail(e, function (free) { check(t, { free: free }); }); return null; })
      .then(function (M) { setBusy(false); return M; });
  }
  btnC.addEventListener('click', function () { check(); });

  /* ---------- 결과 그리기: 머리(게이지 · 판정 · 근거) ---------- */
  function bandCls(k) { return { unfit: 'u', risk: 'r', safe: 's', short: 'n' }[k] || 'n'; }
  function gauge(rate, band, small) {
    var R = 78, cx = 100, cy = 98, v = Math.max(0, Math.min(100, rate || 0)), k = bandCls(band && band.key);
    var pt = function (x) { var a = Math.PI * (1 - x / 100); return [cx + R * Math.cos(a), cy - R * Math.sin(a)]; };
    var arc = function (a, b, cls) { var p = pt(a), q = pt(b); return '<path class="' + cls + '" d="M' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + ' A' + R + ' ' + R + ' 0 0 1 ' + q[0].toFixed(2) + ' ' + q[1].toFixed(2) + '"/>'; };
    var tick = function (x) { if (x === 0 || x === 100) return '<text x="' + (x ? cx + R : cx - R) + '" y="' + (cy + 19) + '">' + x + '</text>'; var a = Math.PI * (1 - x / 100), o = [cx + (R + 15) * Math.cos(a), cy - (R + 15) * Math.sin(a)]; return '<text x="' + o[0].toFixed(1) + '" y="' + (o[1] + 3).toFixed(1) + '">' + x + '</text>'; };
    var m = pt(v);
    return '<div class="hz8-g ' + k + (small ? ' sm' : '') + '" role="img" aria-label="AI 작성률 ' + v + '퍼센트, ' + esc(band ? band.ko : '') + '"><svg viewBox="0 0 200 ' + (small ? 112 : 122) + '" aria-hidden="true">' +
      arc(0, 20, 'z zs') + arc(20, 40, 'z zr') + arc(40, 100, 'z zu') + (v > 0.5 ? arc(0, v, 'val') : '') + '<circle class="dot" cx="' + m[0].toFixed(2) + '" cy="' + m[1].toFixed(2) + '" r="7"/>' +
      (small ? '' : tick(0) + tick(20) + tick(40) + tick(100)) + '</svg><b>' + v + '<small>%</small></b><span>AI 작성률</span></div>';
  }
  function verdict(band) { var p = String(band.label || '').split(' · '); return '<div class="hz8-v ' + bandCls(band.key) + '"><b>' + esc(p[0] || band.ko) + '</b>' + (p[1] ? '<span>' + esc(p[1]) + '</span>' : '') + '</div>'; }
  function scaleHtml(key) {
    var on = function (k) { return key === k ? ' on' : ''; };
    return '<div class="hz8-scale" aria-label="판정 기준"><span class="s' + on('safe') + '"><i></i>안전 0~19%</span><span class="r' + on('risk') + '"><i></i>고위험 20~39%</span><span class="u' + on('unfit') + '"><i></i>부적합 40~100%</span></div>';
  }
  function headHtml(M) {
    var b = M.band || judge(M);
    return '<div class="hz8-head">' + gauge(M.rate, b) +
      '<div class="hz8-jd"><small>종합 판정' + (M.full ? '' : ' · 무료 맛보기') + '</small>' + verdict(b) +
      '<ul class="hz8-why" aria-label="판정 근거">' + (b.why || []).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' + scaleHtml(b.key) + '</div>' +
      '<dl class="hz8-meta"><div><dt>검사 번호</dt><dd>' + esc(M.cn || '-') + '</dd></div><div><dt>검사 시각</dt><dd>' + esc(stamp(M.at)) + '</dd></div><div><dt>판정 기준</dt><dd>' + esc(M.critName ? M.critName.replace('AIMarker ', '') : '판정 기준 1.0') + '</dd></div></dl></div>';
  }
  function statsHtml(M) {
    var pct = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
    var segN = M.segN || 0, nAi = M.lv.hi + M.lv.mid + M.lv.low;
    return '<div class="hz8-stats">' +
      '<div><small>AI 검출 글자 수</small><p><b>' + n2(M.aiChars) + '</b><span>/ ' + n2(M.chars) + '자</span></p><em>본문의 ' + M.rate + '%</em><i style="--p:' + M.rate + '%"></i></div>' +
      '<div><small>AI 검출 구간 수</small><p><b>' + n2(M.segAi) + '</b><span>/ ' + n2(segN) + '구간</span></p><em>' + pct(M.segAi, segN) + '%</em><i style="--p:' + pct(M.segAi, segN) + '%"></i></div>' +
      '<div><small>AI 검출 문장 수</small><p><b>' + n2(nAi) + '</b><span>/ ' + n2(M.n) + '문장</span></p><em class="lvs"><span class="l3">높음 ' + M.lv.hi + '</span><span class="l2">중간 ' + M.lv.mid + '</span><span class="l1">낮음 ' + M.lv.low + '</span></em><i style="--p:' + pct(nAi, M.n) + '%"></i></div></div>';
  }
  function opinionHtml(M) {
    var L = M.opinion || [], lk = !M.full && M.opDetailN > 0;
    var det = M.full && M.opDetail && M.opDetail.length ? '<div class="hz8-fixfirst"><b>고칠 곳</b><ul>' + M.opDetail.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '';
    var lock = lk ? '<div class="hz8-fixfirst lk">' + ico('lock') + '<div><b>먼저 고칠 문장 · 가장 많이 검출된 구간 · 검출 구간 위치</b><span>결과상세내역서에서 열립니다</span></div></div>' : '';
    return '<section class="hz8-card hz8-op"><h3>종합 분석 의견</h3><ol>' + L.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' + det + lock + '</section>';
  }
  function featHtml(M) {
    var F = M.feat || [];
    if (!F.length) return '<section class="hz8-card hz8-ft"><h3>주요 AI 문체 특성</h3><p class="hz8-mute">' + (M.segAi ? '검출 구간에서 두드러진 특성이 없습니다.' : 'AI 검출 구간이 없어 특성을 꼽지 않았습니다.') + '</p></section>';
    return '<section class="hz8-card hz8-ft"><h3>주요 AI 문체 특성 <small>검출 구간 ' + M.segAi + '곳 기준</small></h3><div class="hz8-fl">' + F.slice(0, 6).map(function (f) {
      var tags = f.lock || !f.tags || !f.tags.length ? (f.lock ? '<span class="tg lk">' + ico('lock') + '예시 표현은 결제 뒤에</span>' : '') : f.tags.map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; }).join('');
      return '<div class="hz8-f"><div class="t"><b>' + esc(f.name) + '</b><em>' + f.segs + '구간 · ' + f.share + '%</em></div><i style="--p:' + Math.max(4, f.share) + '%"></i>' + (tags ? '<p>' + tags + '</p>' : '') + (f.why ? '<small>' + esc(f.why) + '</small>' : '') + '</div>';
    }).join('') + '</div></section>';
  }
  function segCls(sh, ai) { return !ai ? 'a0' : sh >= 80 ? 'a3' : sh >= 50 ? 'a2' : 'a1'; }
  function tilesHtml(M) {
    if (M.full && M.segs.length) {
      return '<section class="hz8-card hz8-tiles"><h3>구간별 검출 현황 <small>구간 글자의 20% 이상이 AI 검출 문장이면 검출 구간</small></h3><div class="hz8-tl">' + M.segs.map(function (g) {
        return '<button type="button" class="hz8-t ' + segCls(g.share, g.ai) + '" data-seg="' + g.no + '" aria-label="구간 ' + g.no + ' · AI ' + g.share + '%로 가기"><b>구간 ' + pad3(g.no) + '</b><em>' + g.share + '%</em><i style="--p:' + Math.max(2, g.share) + '%"></i><small>' + (g.ai ? '검출 ' + n2(g.a) + '자' : 'AI 패턴 적음') + '</small></button>';
      }).join('') + '</div></section>';
    }
    var n = M.segLock || M.segN || 0; if (!n) return '';
    var ph = ''; for (var i = 0; i < Math.min(n, 12); i++) ph += '<span class="hz8-t ph ' + (i % 3 === 1 ? 'a2' : i % 3 === 2 ? 'a0' : 'a3') + '"><b>구간 ' + pad3(i + 1) + '</b><em>00%</em><i style="--p:60%"></i><small>검출 000자</small></span>';
    return '<section class="hz8-card hz8-tiles lk"><h3>구간별 검출 현황 <small>' + n + '구간 가운데 ' + M.segAi + '구간 검출</small></h3><div class="hz8-tl" aria-hidden="true">' + ph + '</div><div class="hz8-tlock">' + ico('lock') + '<span>어느 구간이 몇 % 검출됐는지는 결과상세내역서에서 보여 드립니다</span><button class="btn btn-p btn-s" type="button" data-buy="d1">전체 보기</button></div></section>';
  }
  function ctaHtml(M) {
    if (M.full) return '';
    var rest = Math.max(0, (M.lv.hi + M.lv.mid + M.lv.low) - M.shown), b = M.band || {}, s1 = prod('s1') || PRODS[0], d1 = prod('d1') || PRODS[1];
    var hot = b.key === 'unfit' || b.key === 'risk';
    return '<section class="hz8-cta ' + bandCls(b.key) + '"><div class="l"><small>결과상세내역서 · 결제하면 바로 열립니다</small><h3>' + (hot ? esc(b.ko) + ' 판정의 근거가 된 문장 ' + n2(rest + M.shown) + '개 가운데 ' + M.shown + '개만 보여 드렸어요' : 'AI 검출 문장 ' + n2(rest + M.shown) + '개 가운데 ' + M.shown + '개만 보여 드렸어요') + '</h3><ul>' +
      '<li>' + ico('lock') + '나머지 문장 ' + n2(rest) + '개의 위치 · 색 · 이유</li>' +
      '<li>' + ico('lock') + '구간 ' + n2(M.segLock || M.segN) + '곳의 위치와 구간별 검출 비중</li>' +
      '<li>' + ico('lock') + 'AI 문체 특성마다 걸린 표현과 고칠 방향</li>' +
      '<li>' + ico('lock') + '먼저 고칠 문장 3개 · 문장 고쳐 쓰기 도우미 · 표현 다듬기 전체</li>' +
      '<li>' + ico('lock') + '결과상세내역서 PDF(검사 번호 · 판정 기준 · 구간별 분석 · 원문 전문 분석)</li></ul></div>' +
      '<div class="r"><div class="hz8-mini" aria-hidden="true"><div class="mh"><b>AI 작성률 검사 결과서</b><span>' + esc(M.cn || '') + '</span></div><div class="mg">' + gauge(M.rate, b, true) + verdict(b) + '</div><div class="ml"><i></i><i></i><i class="s"></i><i></i><i class="s"></i><i></i></div><div class="mlock">' + ico('lock') + '</div></div>' +
      '<button class="btn btn-p btn-l" type="button" data-buy="d1">' + esc(d1.name) + ' ' + n2(d1.price) + '원으로 전체 보기</button>' +
      '<button class="btn btn-g" type="button" data-buy="s1">이 글 1건만 · ' + n2(s1.price) + '원</button>' +
      '<p class="hz8-mute">' + (payReady() ? '카드 · 간편결제로 바로 결제하면 코드 입력 없이 이 화면에서 바로 열립니다.' : '결제가 확인되면 이용권 코드를 메일로 보내 드립니다.') + ' <button type="button" class="hz7-link" data-code>코드가 있어요</button></p></div></section>';
  }

  /* ---------- 결과 그리기: 본문(문장 색 · 구간) · 옆 목록 ---------- */
  function paraGroups(M) {
    var G = [], cur = null;
    M.sentences.forEach(function (s, i) { if (!cur || cur.para !== s.para) { cur = { para: s.para, ids: [], chars: 0, ai: 0, lock: false }; G.push(cur); } cur.ids.push(i); var len = (S.edits[i] != null ? S.edits[i] : s.t).replace(/\s+/g, '').length; cur.chars += len; if (s.g || (s.g == null && s.ai)) cur.ai += len; if (s.lock) cur.lock = true; });
    return G;
  }
  function sentHtml(M, i) {
    var s = M.sentences[i], ed = S.edits[i] != null, lv = ed ? 0 : lvOf(s), lk = s.lock && M.aiN > M.shown, cls = 'hz-s' + (lv > 0 ? ' l' + lv : '') + (lk ? ' lk' : '') + (ed ? ' ed' : '') + (S.sel === i ? ' sel' : '');
    var tip = s.lock ? '' : ed ? ' title="고친 문장 · 다시 검사하면 새 색이 매겨집니다"' : lv > 0 ? ' title="AI 작성 가능성 ' + LV[lv] + ' · ' + s.p + '%"' : '';
    return '<span class="' + cls + '" data-i="' + i + '"' + tip + (M.full ? ' tabindex="0" role="button"' : '') + '>' + esc(ed ? S.edits[i] : s.t) + '</span>';
  }
  function runHtml(M, a, b) {   // 문장 a~b 를 문단 · 줄 바꿈을 살려 그림
    var h = '', para = null;
    for (var i = a; i <= b && i < M.sentences.length; i++) {
      var s = M.sentences[i];
      if (para === null) { h += '<p data-para="' + s.para + '">'; para = s.para; }
      else if (s.para !== para) { h += '</p><p data-para="' + s.para + '">'; para = s.para; }
      else h += s.nl ? '<br>' : ' ';
      h += sentHtml(M, i);
    }
    return h ? h + '</p>' : '';
  }
  function segHead(g) { return '<div class="hz8-sh ' + segCls(g.share, g.ai) + '"><b>검출 구간 ' + pad3(g.no) + '</b><span>AI 패턴 검출 · ' + (g.share >= 50 ? '수정 권고' : '확인 권고') + '</span><em>검출 ' + n2(g.a) + '자 / ' + n2(g.c) + '자 · ' + g.share + '%</em></div>'; }
  function docHtml(M) {
    var h = '';
    if (M.full && M.segs.length) {
      var last = -1;
      M.segs.forEach(function (g) { var a = Math.max(g.s, last + 1); if (a > g.e) return; h += '<div class="hz8-seg' + (g.ai ? ' ai ' + segCls(g.share, 1) : '') + '" data-seg="' + g.no + '">' + (g.ai ? segHead(g) : '') + runHtml(M, a, g.e) + '</div>'; last = g.e; });
      if (last < M.sentences.length - 1) h += runHtml(M, last + 1, M.sentences.length - 1);
    } else h = runHtml(M, 0, M.sentences.length - 1);
    if (M.trunc) h += '<p class="hz7-fineprint">문장이 아주 많은 부분은 앞쪽 문장까지만 색으로 보여 드립니다. 작성률은 전체로 계산했습니다.</p>';
    return h;
  }
  function sideList(M) {
    var items = [], ghosts = 0;
    M.sentences.forEach(function (s, i) {
      var lv = lvOf(s);
      if (S.edits[i] != null || lv < 1) return;
      var cats = []; s.sig.forEach(function (g) { if (g.catKo && cats.indexOf(g.catKo) < 0) cats.push(g.catKo); });
      items.push('<button type="button" class="hz7-item l' + lv + '" data-i="' + i + '"><span class="t">' + esc(s.t) + '</span><span class="m"><em>' + s.p + '%</em>' + LV[lv] + (cats.length ? cats.slice(0, 2).map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') : '') + '</span></button>');
    });
    var tot = M.lv.hi + M.lv.mid + M.lv.low;
    if (!M.full) { ghosts = Math.max(0, Math.min(6, tot - M.shown)); for (var g = 0; g < ghosts; g++) items.push('<div class="hz7-item ghost l2" aria-hidden="true"><span class="t">결제하면 볼 수 있는 검출 문장입니다 결제하면 볼 수 있는 검출 문장입니다</span><span class="m"><em>00%</em>중간</span></div>'); }
    if (!items.length) return '<p class="hz7-sideh">' + (M.full ? 'AI 글 패턴이 보이는 문장이 없습니다.' : 'AI 검출 문장이 없습니다.') + '</p>';
    return (M.full ? '<p class="hz7-sideh">눌러서 고쳐 쓰기</p>' : '<p class="hz7-sideh">미리 보기 ' + M.shown + '개 · 나머지 ' + Math.max(0, tot - M.shown) + '개는 결제 뒤에</p>') + items.join('');
  }
  function sidePat(M) {
    var cats = Object.keys(M.cats).map(function (k) { return M.cats[k]; }).filter(function (c) { return c.n; }).sort(function (a, b) { return b.n - a.n; });
    var h = cats.length ? '<div class="hz7-cats">' + cats.map(function (c) { return '<div class="hz7-cat"><b>' + esc(c.name) + '</b><em>' + c.n + '곳</em>' + (M.full && c.ex.length ? '<small>' + c.ex.map(function (x) { return '“' + esc(x) + '”'; }).join(' · ') + '</small>' : '') + '</div>'; }).join('') + '</div>' : '<p class="hz7-sideh">눈에 띄는 AI식 표현 패턴이 없습니다. 작성률은 문장 짜임 · 말투 전체를 보고 계산합니다.</p>';
    if (!M.full && M.samples.length) h += '<p class="hz7-sideh">예시</p>' + M.samples.map(function (g) { return '<div class="hz7-cat"><b>' + esc(g.catKo) + '</b><em></em><small>“' + esc(g.t) + '” · ' + esc(g.why) + '</small></div>'; }).join('');
    return h;
  }
  function sideHtml(M) {
    if (M.full && S.sel >= 0) return spHtml(M, S.sel);
    var nPat = Object.keys(M.cats).reduce(function (a, k) { return a + M.cats[k].n; }, 0), tot = M.lv.hi + M.lv.mid + M.lv.low;
    return '<div class="hz7-tabs" role="tablist"><button type="button" role="tab" data-side="ai" aria-selected="' + (S.side === 'ai') + '">검출 문장 ' + tot + '</button><button type="button" role="tab" data-side="pat" aria-selected="' + (S.side === 'pat') + '">AI 표현 ' + nPat + '</button></div>' +
      '<div class="hz7-pane">' + (S.side === 'pat' ? sidePat(M) : sideList(M)) + '</div>';
  }
  function editsBar() {
    var n = Object.keys(S.edits).length;
    if (!n) return '';
    return '<div class="hz7-edits"><span>고친 문장 <b>' + n + '</b>개 · 다시 검사하면 색이 새로 매겨집니다</span><span class="sp"></span><button class="btn btn-p btn-s" type="button" data-act="recheck">고친 글 다시 검사</button><button class="btn btn-g btn-s" type="button" data-act="undoall">모두 되돌리기</button></div>';
  }
  function paidBar() {
    var P = S.paid; if (!P) return '';
    return '<div class="hz8-paid">' + ico('check') + '<div><b>결제가 완료되었습니다 · ' + esc(P.name) + '</b><span>이용권 코드 <code>' + esc(P.code) + '</code>' + (P.mailed ? ' · ' + esc(P.to || '메일') + '로도 보냈습니다' : '') + (P.receipt ? ' · <a href="' + esc(P.receipt) + '" target="_blank" rel="noopener">영수증</a>' : '') + '</span></div></div>';
  }
  function renderRes() {
    var M = S.res; if (!M) return;
    var tot = M.lv.hi + M.lv.mid + M.lv.low, lockDoc = !M.full && tot > M.shown;
    var h = '<div class="hz7-res hz8' + (M.full ? ' hz7-full' : '') + '">' + paidBar() + headHtml(M);
    if (M.cut) h += '<div class="hz7-warn cut">무료 맛보기는 앞부분만 검사했습니다(전체 ' + n2(M.total) + '자 가운데 앞 ' + n2(M.cutAt || FREE_MAX) + '자, 첫 6,000자 안쪽). 이용권은 5만 자까지 한 번에 검사합니다.</div>';
    if (M.chat) h += '<div class="hz7-warn">AI 대화창에서 복사한 흔적이 있습니다(' + M.chatList.map(function (c) { return esc(c.name) + ' ' + c.n + '곳'; }).join(' · ') + '). 제출 전에 꼭 지우세요.</div>';
    if (M.verse) h += '<div class="hz7-warn">시 · 노랫말처럼 줄이 짧은 글은 판별이 불안정합니다. 참고로만 보세요.</div>';
    else if (M.short && M.band.key !== 'short') h += '<div class="hz7-warn">150자보다 짧은 글은 판별이 불안정합니다. 참고로만 보세요.</div>';
    h += statsHtml(M) + '<div class="hz8-two">' + opinionHtml(M) + featHtml(M) + '</div>' + ctaHtml(M) + tilesHtml(M) + editsBar() +
      '<div class="hz7-body"><div class="hz7-docw' + (lockDoc ? ' lkd' : '') + '"><div class="hz7-doc" id="hzDoc">' + docHtml(M) + '</div>' + (lockDoc ? lockHtml(M) : '') + '</div>' +
      '<aside class="hz7-side" id="hzSide" aria-label="검출 문장 · AI 표현">' + sideHtml(M) + '</aside></div>' +
      '<div class="hz7-legend"><span><i class="l3"></i>높음(85 이상)</span><span><i class="l2"></i>중간(65 이상)</span><span><i class="l1"></i>낮음(앞뒤 문맥으로 AI 구간)</span><span><i class="l0"></i>표시 없음</span></div>' + actsHtml(M) +
      '<p class="hz7-fineprint">' + esc(M.note || 'AI 작성률은 판별 모델의 추정값입니다. 판정이나 증명으로 쓰지 않습니다.') + ' 결과만으로 다른 사람을 판단하지 마세요.</p></div>';
    out.innerHTML = h;
  }
  function lockHtml(M) {
    var tot = M.lv.hi + M.lv.mid + M.lv.low, rest = Math.max(0, tot - M.shown);
    return '<div class="hz7-lock">' + ico('lock') + '<h3>검출 문장 ' + tot + '개 가운데 ' + M.shown + '개만 보여 드렸어요</h3><p>나머지 ' + rest + '개 문장의 위치와 이유, 구간별 분석, 문장 고쳐 쓰기 도우미, 결과상세내역서는 결제하면 바로 열립니다.</p>' +
      '<button class="btn btn-p" type="button" data-buy="d1">24시간 이용권 2,900원으로 전체 보기</button><button type="button" class="hz7-link" data-code>이용권 코드가 있어요</button></div>';
  }
  function actsHtml(M) {
    if (!M.full) return '<div class="hz7-acts"><button class="btn btn-p" type="button" data-buy="d1">결과상세내역서 받기 · 2,900원</button><button class="btn btn-g" type="button" data-act="fix">표현 다듬기 미리 보기</button><button class="btn btn-g" type="button" data-code>이용권 코드 넣기</button></div>';
    return '<div class="hz7-acts"><button class="btn btn-n" type="button" data-act="report">' + ico('file') + '<span>결과상세내역서 저장(PDF)</span></button><button class="btn btn-g" type="button" data-act="fix">표현 다듬기</button>' + (S.proReady && S.ps && S.ps.pro ? '<button class="btn btn-g" type="button" data-act="pro">고급 휴머나이징</button>' : '') + '<button class="btn btn-g" type="button" data-act="recheck">다시 검사</button></div>';
  }
  function stamp(d) { d = d || new Date(); var p = function (x) { return ('0' + x).slice(-2); }; return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }

  /* ---------- 문장 고쳐 쓰기 ---------- */
  function spHtml(M, i) {
    var s = M.sentences[i], cur = S.edits[i] != null ? S.edits[i] : s.t, lv = lvOf(s), why = s.sig.length ? s.sig.slice(0, 5).map(function (g) { return '<li><b>' + esc(g.catKo || 'AI 패턴') + '</b>“' + esc(g.t) + '” · ' + esc(g.why) + '</li>'; }).join('') : '<li>' + (lv >= 2 ? '눈에 띄는 표현보다 문장 짜임 · 말투 · 앞뒤 흐름이 AI 글과 비슷합니다. 내 경험이나 구체적인 예를 더하면 달라집니다.' : lv === 1 ? '이 문장만 보면 기준보다 낮지만, 앞뒤 문장과 함께 AI 구간으로 판정되었습니다. 앞뒤 문장부터 고치면 같이 내려갈 수 있습니다.' : 'AI 글 패턴이 거의 보이지 않는 문장입니다.') + '</li>';
    return '<div class="hz7-sp" id="hzSp"><div class="hz7-sp-top"><button type="button" class="hz7-link" data-act="back">목록으로</button><span class="lv l' + Math.max(0, lv) + '">' + (lv > 0 ? LV[lv] + ' · ' : '') + s.p + '%</span></div>' +
      '<blockquote>' + esc(cur) + '</blockquote><h4>왜 이렇게 봤나요</h4><ul>' + why + '</ul>' +
      '<h4>고쳐 쓰기</h4><div class="row"><button class="btn btn-g btn-s" type="button" data-act="help">도우미 제안 받기</button>' + (S.proReady && S.ps && S.ps.pro ? '<button class="btn btn-g btn-s" type="button" data-act="alts">AI로 다시 쓴 후보(고급 1회)</button>' : '') + '</div><div id="hzSug"></div>' +
      '<textarea id="hzSent" aria-label="고쳐 쓸 문장">' + esc(cur) + '</textarea>' +
      '<div class="hz7-tips"><button type="button" data-tip="[직접 겪은 일 한 줄]">+ 내 경험</button><button type="button" data-tip="[숫자 · 장소 · 날짜]">+ 구체적인 사실</button><button type="button" data-tip="[내 생각과 그 이유]">+ 내 생각</button></div>' +
      '<div class="row"><button class="btn btn-p btn-s" type="button" data-act="apply">이 문장 바꾸기</button>' + (S.edits[i] != null ? '<button class="btn btn-g btn-s" type="button" data-act="undo">원래대로</button>' : '') + '</div>' +
      '<p class="hz7-fineprint">대괄호 [ ] 는 내 말로 채워 넣으세요. 없는 경험이나 사실은 지어내지 마세요. 바꾼 문장은 다시 검사하면 새 색이 매겨집니다.</p></div>';
  }
  function pick(i) {
    var M = S.res; if (!M || !M.full) return;
    S.sel = i; renderRes();
    var sp = $('#hzSp'); if (sp && window.innerWidth <= 1000) sp.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    var span = $('#hzDoc [data-i="' + i + '"]'); if (span && window.innerWidth > 1000) { var d = $('#hzDoc'), top = span.offsetTop - d.offsetTop; if (top < d.scrollTop || top > d.scrollTop + d.clientHeight - 40) d.scrollTop = Math.max(0, top - 80); }
  }
  function buildText() {
    var M = S.res, s0 = '', para = -1;
    M.sentences.forEach(function (s, i) { var t = S.edits[i] != null ? S.edits[i] : s.t; if (i) s0 += s.para !== para ? '\n\n' : (s.nl ? '\n' : ' '); para = s.para; s0 += t; });
    return s0;
  }
  out.addEventListener('click', function (e) {
    var M = S.res;
    var sp = e.target.closest('.hz-s[data-i]'); if (sp && M && M.full) { pick(+sp.getAttribute('data-i')); return; }
    var it = e.target.closest('.hz7-item[data-i]'); if (it) { pick(+it.getAttribute('data-i')); return; }
    var sd = e.target.closest('[data-side]'); if (sd) { S.side = sd.getAttribute('data-side'); $('#hzSide').innerHTML = sideHtml(M); return; }
    var tl = e.target.closest('.hz8-t[data-seg]'); if (tl) { var g = $('#hzDoc [data-seg="' + tl.getAttribute('data-seg') + '"]'), dd = $('#hzDoc'); if (g && dd) { dd.scrollTop = g.offsetTop - dd.offsetTop - 8; g.classList.add('flash'); setTimeout(function () { g.classList.remove('flash'); }, 900); try { dd.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' }); } catch (eS) { /* 그대로 */ } } return; }
    var tp = e.target.closest('[data-tip]'); if (tp) { var x = $('#hzSent'); if (x) { var a = x.selectionStart || x.value.length; x.value = x.value.slice(0, a) + ' ' + tp.getAttribute('data-tip') + ' ' + x.value.slice(a); x.focus(); } return; }
    var ag = e.target.closest('[data-again]'); if (ag) { if (S.retry) S.retry(true); return; }
    var cb = e.target.closest('[data-cand]'); if (cb) { var y = $('#hzSent'); if (y) { y.value = cb.getAttribute('data-cand'); y.focus(); } return; }
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'back') { S.sel = -1; renderRes(); return; }
    if (act === 'apply') { var v = ($('#hzSent').value || '').replace(/\s+/g, ' ').trim(); if (!v) return; if (/\[[^\]]*\]/.test(v)) { sugMsg('대괄호 [ ] 안을 내 말로 채운 뒤 바꿔 주세요.'); return; } if (v === M.sentences[S.sel].t) delete S.edits[S.sel]; else S.edits[S.sel] = v; ta.value = buildText(); count(); renderRes(); return; }
    if (act === 'undo') { delete S.edits[S.sel]; ta.value = buildText(); count(); renderRes(); return; }
    if (act === 'undoall') { S.edits = {}; S.sel = -1; ta.value = M.src; count(); renderRes(); return; }
    if (act === 'recheck') { check(Object.keys(S.edits).length ? buildText() : ta.value); return; }
    if (act === 'help') { helper(); return; }
    if (act === 'alts') { alts(); return; }
    if (act === 'report') { report(); return; }
    if (act === 'fix') { fix(); return; }
    if (act === 'pro') { pro(); return; }
    if (act === 'usefix' && S.fx) { useFix(); return; }
    if (act === 'copyfix' && S.fx) { if (AM.copy) AM.copy(S.fx.text, b); else if (navigator.clipboard) navigator.clipboard.writeText(S.fx.text); return; }
    if (act === 'backres' && S.res) { S.fx = null; renderRes(); return; }
  });
  out.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.hz-s[data-i]')) { e.preventDefault(); pick(+e.target.getAttribute('data-i')); } });
  function sugMsg(m) { var g = $('#hzSug'); if (g) g.innerHTML = '<p class="wait">' + esc(m) + '</p>'; }
  function helper() {
    var cur = ($('#hzSent').value || '').trim(); if (!cur) return;
    if (cur.length > HELP_MAX) return sugMsg('도우미는 ' + HELP_MAX + '자까지의 문장에 씁니다.');
    sugMsg('바꿀 표현을 찾는 중…');
    call('am.style', { text: cur, mode: 'fix', tone: tone(), pass: S.pass }, 40000).then(function (r) {
      if (!r.text || r.text === cur) return sugMsg('이 문장에서 자동으로 바꿀 표현을 찾지 못했습니다. 아래 단추로 내 경험 · 사실 · 생각을 더해 직접 고쳐 보세요.');
      var g = $('#hzSug'); if (!g) return;
      g.innerHTML = '<div class="hz7-cand"><button type="button" data-cand="' + esc(r.text) + '">' + esc(r.text) + '<small>도우미 제안 · 눌러서 넣기</small></button></div>' + ((r.applied || []).length ? '<ul>' + r.applied.slice(0, 4).map(function (a) { return '<li><b>' + esc(a.why || '다듬기') + '</b>' + (a.from ? '<s>' + esc(a.from) + '</s> → ' : '') + esc(a.to || '(뺌)') + '</li>'; }).join('') + '</ul>' : '');
    }).catch(function (e) { sugMsg((e && e.message) || '도우미가 답하지 않았습니다. 잠시 뒤 다시 시도해 주세요.'); });
  }
  function alts() {
    var cur = ($('#hzSent').value || '').trim(); if (!cur) return;
    if (cur.length > HELP_MAX) return sugMsg('AI 후보는 ' + HELP_MAX + '자까지의 문장에 씁니다.');
    sugMsg('생성 AI가 다시 쓰는 중…');
    call('am.humanize', { text: cur, alts: 1, tone: tone(), pass: S.pass }, 90000).then(function (r) {
      var g = $('#hzSug'); if (!g) return;
      g.innerHTML = '<div class="hz7-cand">' + (r.alts || []).map(function (a) { return '<button type="button" data-cand="' + esc(a.text) + '">' + esc(a.text) + '<small>' + (a.missing && a.missing.length ? '원문의 ' + esc(a.missing.join(', ')) + ' 이(가) 빠졌습니다. 대조하세요' : 'AI 후보 · 눌러서 넣은 뒤 내 말로 고치세요') + '</small></button>'; }).join('') + '</div>';
    }).catch(function (e) { sugMsg((e && e.message) || '후보를 받지 못했습니다.'); });
  }

  /* ---------- 표현 다듬기 · 고급 ---------- */
  function ringCls(r) { return r >= 40 ? 'hi' : r >= 20 ? 'mid' : 'lo'; }
  function ring(rate, cls, size) {
    var C = 314.16, off = C * (1 - Math.max(0, Math.min(100, rate)) / 100);
    return '<div class="ring6 ' + (size || 'lg') + ' ' + cls + '" role="img" aria-label="AI 작성률 ' + rate + '퍼센트"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50" stroke-dasharray="' + C + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><b>' + rate + '<small>%</small></b></div>';
  }
  function fix() {
    var t = (Object.keys(S.edits).length && S.res ? buildText() : ta.value).replace(/\r\n?/g, '\n');
    if (!need(t) || S.busy) return;
    var full = !!S.pass;
    if (full && t.length > PAID_MAX) { out.innerHTML = '<div class="hz7-err">이용권은 한 번에 5만 자까지 다듬습니다.</div>'; return; }
    var C0 = chunk(t), C = full ? C0 : { parts: [C0.parts[0]], seps: [] };
    if (full && S.ps && C.parts.length > S.ps.left) { out.innerHTML = '<div class="hz7-err"><b>남은 횟수가 모자라요</b><span>이 글은 6,000자씩 ' + C.parts.length + '번으로 나눠 다듬어 이용권 ' + C.parts.length + '회가 필요합니다. 지금 남은 횟수는 ' + S.ps.left + '회입니다.</span><div class="row"><button class="btn btn-p btn-s" type="button" data-buy="d1">24시간 이용권 2,900원</button></div></div>'; return; }
    setBusy(true); prog('표현 다듬는 중', 0, C.parts.length);
    seq(C.parts, function (part, i) { return call('am.style', { text: part, mode: 'fix', tone: tone(), pass: full ? S.pass : '' }, 90000).then(function (r) { prog('표현 다듬는 중', i + 1, C.parts.length); return r; }); })
      .then(function (rs) {
        if (!rs.every(function (r) { return r.full; })) { S.fx = { free: true, changes: rs[0].changes || 0, samples: rs[0].fixSamples || [], cut: C0.parts.length > 1, total: t.length }; renderFixFree(); toOut(); return; }
        var text = rs.map(function (r, i) { return (i ? C.seps[i - 1] : '') + r.text; }).join(''), applied = [], left = [], miss = [], tot = 0;
        rs.forEach(function (r) { applied = applied.concat(r.applied || []); left = left.concat(r.left || []); if (r.facts) { tot += r.facts.total || 0; (r.facts.missing || []).forEach(function (x) { if (miss.indexOf(x) < 0) miss.push(x); }); } });
        var before = { chars: 0, ai: 0 }; rs.forEach(function (r) { if (r.ai) { before.chars += r.ai.chars || 0; before.ai += r.ai.aiChars || 0; } });
        return merge(rs.map(function (r) { return { aiAfter: r.aiAfter, left: r.left }; }), true, text).then(function (A) {
          A.src = text; S.fx = { kind: 'fix', src: t, text: text, applied: applied, left: left, facts: { total: tot, missing: miss }, beforeRate: before.chars ? Math.round(before.ai / before.chars * 100) : 0, after: A };
          renderFix(); toOut();
        });
      }).catch(function (e) { fail(e); }).then(function () { setBusy(false); });
  }
  btnF.addEventListener('click', fix);
  function pro() {
    if (!S.proReady) return;
    if (!S.pass) { openBuy('d1', '고급 휴머나이징은 24시간 이용권부터 씁니다.'); return; }
    var t = (Object.keys(S.edits).length && S.res ? buildText() : ta.value).replace(/\r\n?/g, '\n');
    if (!need(t) || S.busy) return;
    if (t.length > HUM_MAX) { out.innerHTML = '<div class="hz7-err">고급 휴머나이징은 한 번에 ' + n2(HUM_MAX) + '자까지입니다. 고칠 문단만 넣어 주세요. 긴 글은 색이 칠해진 문장을 눌러 “AI로 다시 쓴 후보”를 쓰세요.</div>'; return; }
    setBusy(true); prog('생성 AI가 다시 쓰는 중', 0, 1);
    call('am.humanize', { text: t, tone: tone(), pass: S.pass }, 120000).then(function (r) {
      return merge([{ aiAfter: r.aiAfter }], true, r.text).then(function (A) { A.src = r.text; S.fx = { kind: 'pro', src: t, text: r.text, applied: [], left: [], facts: r.facts || { total: 0, missing: [] }, beforeRate: r.ai ? r.ai.rate : 0, after: A }; renderFix(); toOut(); });
    }).catch(function (e) { fail(e); }).then(function () { setBusy(false); });
  }
  btnP.addEventListener('click', pro);
  function tokens(s) { return String(s).match(/\s+|[^\s]+/g) || []; }
  function diff(a, b) {
    var A = tokens(a), B = tokens(b), n = A.length, m = B.length, ops = [];
    if (n * m > 6000000) return [['-', a], ['+', b]];
    var W = m + 1, dp = new Uint16Array((n + 1) * W), i, j;
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i * W + j] = A[i] === B[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    var push = function (k, t) { var l = ops[ops.length - 1]; if (l && l[0] === k) l[1] += t; else ops.push([k, t]); };
    i = 0; j = 0;
    while (i < n && j < m) { if (A[i] === B[j]) { push('=', A[i]); i++; j++; } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { push('-', A[i]); i++; } else { push('+', B[j]); j++; } }
    while (i < n) push('-', A[i++]); while (j < m) push('+', B[j++]);
    return ops;
  }
  function renderFixFree() {
    var F = S.fx;
    out.innerHTML = '<div class="hz7-res"><div class="hz7-head" style="grid-template-columns:minmax(0,1fr)"><div class="hz7-sum"><small>표현 다듬기 · 무료 미리 보기</small><h2>다듬을 표현 ' + n2(F.changes) + '곳을 찾았습니다</h2><p>번역투 · 상투적 연결어 · 빈말 수식 · 대화창 흔적을 바꿉니다. 숫자 · 인용 · 고유명사는 그대로 지킵니다.</p></div></div>' +
      (F.samples.length ? '<div class="hz7-peek"><h3>미리 보기 ' + F.samples.length + '곳</h3>' + F.samples.map(function (a) { return '<div class="q"><p>' + (a.from ? '<del>' + esc(a.from) + '</del> → ' : '') + '<ins>' + esc(a.to || '(뺌)') + '</ins></p><small>' + esc(a.why || '') + '</small></div>'; }).join('') + '</div>' : '<div class="hz7-warn">자동으로 바꿀 표현을 찾지 못했습니다. AI 작성률 검사로 어느 문장이 AI처럼 읽히는지 먼저 확인해 보세요.</div>') +
      (F.changes > F.samples.length ? '<div class="hz7-docw" style="min-height:220px"><div class="hz7-lock" style="position:relative;left:auto;top:auto;transform:none;margin:0 auto">' + ico('lock') + '<h3>나머지 ' + n2(F.changes - F.samples.length) + '곳과 다듬은 글 전체는 이용권으로</h3><p>바꾼 곳마다 이유, 직접 손볼 곳, 숫자 · 인용을 지켰는지 확인까지 보여 드립니다.</p><button class="btn btn-p" type="button" data-buy="d1">24시간 이용권 2,900원</button><button type="button" class="hz7-link" data-code>이용권 코드가 있어요</button></div></div>' : '') + '</div>';
  }
  function renderFix() {
    var F = S.fx, A = F.after, ops = diff(F.src, F.text), changes = ops.filter(function (o) { return o[0] !== '=' && o[1].trim(); }).length;
    var clean = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '+' ? (o[1].trim() ? '<mark>' + esc(o[1]) + '</mark>' : esc(o[1])) : ''; }).join('');
    var dv = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '+' ? '<ins>' + esc(o[1]) + '</ins>' : '<del>' + esc(o[1]) + '</del>'; }).join('');
    var tabs = [['text', '다듬은 글'], ['diff', '바뀐 곳 ' + changes]];
    if (F.kind === 'fix') { tabs.push(['why', '바꾼 이유 ' + F.applied.length]); if (F.left.length) tabs.push(['left', '직접 손볼 곳 ' + F.left.length]); }
    var f = F.facts, facts = '<div class="hz7-facts2' + (f.missing.length ? ' bad' : '') + '">' + ico(f.missing.length ? 'alert' : 'check') + '<span>' + (f.missing.length ? '원문의 숫자 · 인용 가운데 다듬은 글에서 찾지 못한 것: ' + esc(f.missing.join(', ')) + '. 꼭 대조해 주세요.' : f.total ? '원문의 숫자 · 인용 · 고유명사 ' + f.total + '개를 그대로 지켰습니다.' : '바꾸면 안 되는 숫자 · 인용이 없는 글입니다.') + '</span></div>';
    var warn = A.band && A.band.key === 'unfit' ? '<div class="hz7-warn">' + (F.kind === 'fix' ? '표현 다듬기는 AI가 자주 쓰는 표현을 바꿉니다. 글의 짜임과 흐름에 AI 패턴이 남아 있으면 판정이 바로 바뀌지 않습니다. “다듬은 글로 바꾸고 색 보기”를 누른 뒤, 색이 칠해진 문장을 눌러 내 경험 · 생각 · 구체적인 예를 더해 고쳐 쓰세요.' : '아직 AI 패턴이 남아 있습니다. 색이 칠해진 문장을 눌러 내 말로 고쳐 쓰세요.') + '</div>' : '';
    out.innerHTML = '<div class="hz7-res"><div class="hz7-ba"><div>' + ring(F.beforeRate, ringCls(F.beforeRate), '') + '<div><small>다듬기 전</small><b>AI 작성률</b></div></div><span class="arr" aria-hidden="true">→</span><div>' + ring(A.rate, ringCls(A.rate), '') + '<div><small>' + (F.kind === 'pro' ? '고급 휴머나이징 뒤' : '표현 다듬기 뒤') + '</small><b>' + esc(A.band ? A.band.label : A.levelKo) + '</b></div></div></div>' + warn +
      '<div class="hz7-vt" role="tablist">' + tabs.map(function (t, k) { return '<button type="button" role="tab" data-fv="' + t[0] + '" aria-selected="' + (k ? 'false' : 'true') + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>' +
      '<div data-fp="text"><div class="hz7-text">' + clean + '</div></div><div data-fp="diff" hidden><div class="hz7-text">' + dv + '</div></div>' +
      (F.kind === 'fix' ? '<div data-fp="why" hidden><ul class="hz7-list">' + F.applied.map(function (a) { return '<li><span class="cat">' + esc(({ 1: '번역투', 2: '상투적 연결어', 3: '빈말 · 과장 수식', 4: '틀에 박힌 도입 · 마무리', 5: '대화창 복사 흔적' })[a.cat] || '말투') + '</span><b>' + (a.from ? '<s>' + esc(a.from) + '</s> ' : '') + (a.to ? '<ins>' + esc(a.to) + '</ins>' : '(뺌)') + '</b><small>' + esc(a.why) + '</small></li>'; }).join('') + '</ul></div><div data-fp="left" hidden><ul class="hz7-list">' + F.left.map(function (a) { return '<li><span class="cat">' + esc(a.catKo) + '</span>' + (a.t ? '<b>' + esc(a.t) + '</b>' : '') + '<small>' + esc(a.why) + '</small></li>'; }).join('') + '</ul></div>' : '') +
      facts + '<div class="hz7-acts"><button class="btn btn-p" type="button" data-act="usefix">다듬은 글로 바꾸고 색 보기</button><button class="btn btn-g" type="button" data-act="copyfix">다듬은 글 복사</button>' + (S.res ? '<button class="btn btn-g" type="button" data-act="backres">검사 결과로 돌아가기</button>' : '') + '</div>' +
      '<p class="hz7-fineprint">“다듬은 글로 바꾸고 색 보기”는 다듬은 글의 판정 결과를 그대로 보여 주므로 이용권 횟수를 더 쓰지 않습니다.</p></div>';
  }
  out.addEventListener('click', function (e) {
    var t = e.target.closest('[data-fv]'); if (!t) return;
    var v = t.getAttribute('data-fv');
    out.querySelectorAll('[data-fv]').forEach(function (b) { b.setAttribute('aria-selected', b === t ? 'true' : 'false'); });
    out.querySelectorAll('[data-fp]').forEach(function (p) { p.hidden = p.getAttribute('data-fp') !== v; });
  });
  function useFix() { var F = S.fx; ta.value = F.text; count(); S.res = F.after; S.res.at = new Date(); S.edits = {}; S.sel = -1; S.fx = null; renderRes(); toOut(); }

  /* ---------- 결과상세내역서(인쇄 · PDF 저장, 결제 뒤에만) ---------- */
  function report() {
    var M = S.res; if (!M || !M.full) return;
    var el = document.getElementById('hzReport');
    if (!el) { el = document.createElement('section'); el.id = 'hzReport'; document.body.appendChild(el); }
    var b = M.band, nAi = M.lv.hi + M.lv.mid + M.lv.low, segN = M.segs.length || M.segN;
    var rows = M.segs.filter(function (g) { return g.ai; }).map(function (g) { return '<tr><td>' + pad3(g.no) + '</td><td>' + n2(g.c) + '자</td><td>' + n2(g.a) + '자</td><td><b>' + g.share + '%</b></td><td>' + g.hi + ' · ' + g.mid + ' · ' + g.low + '</td><td>' + esc((g.feat || []).map(function (c) { var f = (M.feat || []).filter(function (x) { return x.cat === c; })[0]; return f ? f.name : ''; }).filter(Boolean).join(', ') || '문장 짜임 · 말투') + '</td><td>' + (g.share >= 50 ? '수정 권고' : '확인 권고') + '</td></tr>'; }).join('');
    var featRows = (M.feat || []).map(function (f) { return '<tr><td><b>' + esc(f.name) + '</b><small>' + esc(f.why || '') + '</small></td><td>' + f.segs + '구간</td><td>' + f.share + '%</td><td>' + f.n + '건</td><td>' + esc((f.tags || []).join(', ')) + '</td></tr>'; }).join('');
    var bars = (M.feat || []).map(function (f) { return '<div class="rb"><span>' + esc(f.name) + '</span><i><em style="width:' + Math.max(2, f.share) + '%"></em></i><b>' + f.share + '%</b></div>'; }).join('');
    var dist = [['l3', '높음(85 이상)', M.lv.hi], ['l2', '중간(65~84)', M.lv.mid], ['l1', '낮음(구간 판정)', M.lv.low], ['l0', '표시 없음', Math.max(0, M.n - nAi)]];
    var tiles = M.segs.map(function (g) { return '<span class="rt ' + segCls(g.share, g.ai) + '"><b>' + pad3(g.no) + '</b>' + g.share + '%</span>'; }).join('');
    var docName = S.docName ? esc(S.docName) : '붙여 넣은 글';
    el.innerHTML = '<div class="rp8"><header class="rp8-top"><div><small>AIMarker · aimarker.kr</small><h1>AI 작성률 검사 결과서</h1></div><dl><div><dt>검사 번호</dt><dd>' + esc(M.cn) + '</dd></div><div><dt>발행일</dt><dd>' + esc(stamp(new Date())) + '</dd></div><div><dt>판정 기준</dt><dd>' + esc(M.critName || 'AIMarker 판정 기준 1.0') + '</dd></div><div><dt>판별 모델</dt><dd>' + esc(M.model || 'det') + '</dd></div></dl></header>' +
      '<section class="rp8-sum"><div class="g">' + gauge(M.rate, b) + '</div><div class="j"><small>종합 판정</small>' + verdict(b) + '<ul>' + b.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' + scaleHtml(b.key) + '</div></section>' +
      '<table class="rp8-kv"><tr><th>검사한 글</th><td>' + docName + ' · ' + n2(M.chars) + '자(빈칸 뺌) · ' + n2(M.n) + '문장</td><th>이용권</th><td>' + esc(S.ps ? S.ps.name : '이용권') + '</td></tr><tr><th>AI 검출 글자 수</th><td>' + n2(M.aiChars) + ' / ' + n2(M.chars) + '자(본문의 ' + M.rate + '%)</td><th>AI 검출 구간 수</th><td>' + M.segAi + ' / ' + segN + '구간(' + (segN ? Math.round(M.segAi / segN * 100) : 0) + '%)</td></tr><tr><th>AI 검출 문장 수</th><td>' + nAi + ' / ' + n2(M.n) + '문장(높음 ' + M.lv.hi + ' · 중간 ' + M.lv.mid + ' · 낮음 ' + M.lv.low + ')</td><th>AI 대화창 흔적</th><td>' + (M.chat ? M.chatList.map(function (c) { return esc(c.name) + ' ' + c.n + '곳'; }).join(', ') : '없음') + '</td></tr></table>' +
      '<h2>종합 분석 의견</h2><ol class="rp8-op">' + M.opinion.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' + (M.opDetail.length ? '<ul class="rp8-fix">' + M.opDetail.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      (tiles ? '<h2>구간별 검출 현황</h2><div class="rp8-tiles">' + tiles + '</div>' : '') +
      (featRows ? '<h2>01 · AI 문체 특성 프로파일</h2><div class="rp8-bars">' + bars + '</div><table class="rp8-t"><tr><th>특성</th><th>구간 수</th><th>비중</th><th>건수</th><th>예시 표현</th></tr>' + featRows + '</table>' : '') +
      '<h2>02 · 통합 원문 전문 분석</h2><div class="hz7-legend"><span><i class="l3"></i>높음</span><span><i class="l2"></i>중간</span><span><i class="l1"></i>낮음</span><span><i class="l0"></i>표시 없음</span></div><div class="rp8-doc">' + docHtml(M).replace(/ sel"/g, '"').replace(/ tabindex="0" role="button"/g, '') + '</div>' +
      (rows ? '<h2>03 · AI 검출 구간 요약</h2><table class="rp8-t"><tr><th>구간</th><th>글자 수</th><th>AI 글자</th><th>비중</th><th>높음 · 중간 · 낮음</th><th>주요 특성</th><th>권고</th></tr>' + rows + '</table>' : '') +
      '<h2>04 · 문장 등급 분포</h2><div class="rp8-dist">' + dist.map(function (x) { return '<div><i class="' + x[0] + '"></i><span>' + x[1] + '</span><b>' + x[2] + '문장</b></div>'; }).join('') + '</div>' +
      '<h2>05 · 판정 기준(' + esc(M.critName || 'AIMarker 판정 기준 1.0') + ')</h2><ul class="rp8-crit"><li><b>문장 등급</b> 판별 확률 85 이상 높음 · 65 이상 중간 · 65 미만이지만 앞뒤 문맥까지 본 구간 판정에서 AI로 든 문장은 낮음</li><li><b>AI 작성률</b> AI 검출 문장의 글자 수 ÷ 전체 글자 수(빈칸 뺌)</li><li><b>구간</b> 문단 단위(30자 미만은 다음 문단과 합치고 1,000자를 넘으면 문장 경계에서 나눔). 구간 글자의 20% 이상이 AI 검출 문장이면 검출 구간</li><li><b>부적합</b> 작성률 40% 이상, 또는 검출 구간이 전체의 절반 이상(2구간 이상일 때), 또는 AI 대화창 흔적 1곳 이상</li><li><b>고위험</b> 작성률 20% 이상, 또는 검출 구간 1곳 이상, 또는 중간 이상 문장 1개 이상</li><li><b>안전</b> 위에 해당하지 않음 · 60자 미만은 판단 보류</li></ul>' +
      '<footer class="rp8-note">본 결과서는 참고용 분석 자료이며, 최종 판단은 제출처의 기준과 심사자의 판단에 따릅니다. AI 작성률은 판별 모델과 정해진 판정 기준으로 계산한 추정값으로 판정이나 증명이 아니고, 법률 자문이 아닙니다. 사람이 쓴 글도 높게, AI가 쓴 글도 낮게 나올 수 있으며 다른 검사기와 결과가 다를 수 있습니다. 같은 글을 다시 넣으면 같은 검사 번호와 같은 결과가 나옵니다. 결과만으로 다른 사람을 판단하지 마세요. 글은 저장하지 않으며 이 결과서는 이용자의 브라우저에서 만들어졌습니다. AIMarker(aimarker.kr) · 운영 성균관컨설팅</footer></div>';
    var done = function () { document.body.classList.remove('hz7-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    document.body.classList.add('hz7-printing');
    setTimeout(function () { try { window.print(); } catch (e) { done(); } }, 60);
  }

  /* ---------- 구매 · 결제 · 코드 창 ---------- */
  function say(el, text, kind) { if (!el) return; el.textContent = text || ''; el.className = 'msg' + (text ? ' on ' + (kind || 'err') : ''); }
  function dlgOpen(d) { if (!d) return; if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
  function dlgClose(d) { if (d && d.open) { try { d.close(); } catch (e) { d.removeAttribute('open'); } } }
  var buyDlg = $('#hzBuy'), buyBody = $('#hzBuyBody'), buyTpl = buyBody ? buyBody.innerHTML : '', t0 = 0;
  function prodsHtml(sel) {
    return prods().map(function (p) {
      var per = p.days ? ' · 하루 약 ' + n2(Math.round(p.price / p.days / 10) * 10) + '원' : '';
      return '<label' + (p.best ? ' class="best"' : '') + '><input type="radio" name="product" value="' + esc(p.id) + '"' + (p.id === sel ? ' checked' : '') + '><span><b>' + esc(p.name) + (p.best ? '<i>추천</i>' : '') + '</b><em>' + n2(p.price) + '원</em><small>' + esc(p.desc) + per + '</small></span></label>';
    }).join('');
  }
  function buyBtnLabel() { var f = $('#hzBuyForm'); if (!f) return; var id = (f.querySelector('input[name="product"]:checked') || {}).value || 'd1', p = prod(id) || PRODS[1], b = f.querySelector('button[type="submit"]'); if (b) b.innerHTML = payReady() ? ico('card') + '<span>' + n2(p.price) + '원 결제하기</span>' : '<span>' + n2(p.price) + '원 주문하기</span>'; var n = $('#hzBuyNote'); if (n) n.textContent = payReady() ? '카드 · 간편결제로 바로 결제합니다. 결제가 승인되면 이 화면에서 바로 전체 결과가 열리고, 코드는 메일로도 보내 드립니다.' : '주문하면 결제 안내를 메일로 드리고, 결제가 확인되면 이용권 코드를 보내 드립니다.'; }
  function openBuy(pid, why) {
    if (!buyDlg) return;
    buyBody.innerHTML = buyTpl;
    var fs = buyBody.querySelector('.hz7-prod'); if (fs) fs.innerHTML = '<legend class="sr">이용권 고르기</legend>' + prodsHtml(prod(pid) ? pid : 'd1');
    var m = sget('am_buy_mail'); if (m) { var mi = $('#hzBuyMail'); if (mi) mi.value = m; }
    buyBtnLabel();
    if (why) say(buyBody.querySelector('.msg'), why, 'ok');
    t0 = Date.now(); dlgOpen(buyDlg);
    infoP.then(buyBtnLabel);
    setTimeout(function () { var i = $('#hzBuyMail'); if (i && !i.value) i.focus(); }, 60);
  }
  document.addEventListener('change', function (e) { if (e.target && e.target.name === 'product' && e.target.closest('#hzBuyForm')) buyBtnLabel(); });
  function tossSdk() {
    if (window.TossPayments) return Promise.resolve(window.TossPayments);
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'https://js.tosspayments.com/v2/standard'; s.onload = function () { window.TossPayments ? ok(window.TossPayments) : no(new Error('결제 창을 불러오지 못했습니다.')); }; s.onerror = function () { no(new Error('결제 창을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.')); }; document.head.appendChild(s); });
  }
  function payUrls() { var base = location.origin + location.pathname; return { successUrl: base + '?pay=ok', failUrl: base + '?pay=fail' }; }
  function startPay(r, mail, msg, btn) {
    var p = r.pay, mode = S.info.pay.mode, U = payUrls();
    ssset('am_hz_pay', { text: String(ta.value || '').slice(0, PAID_MAX), tone: tone(), doc: S.docName || '', oid: p.payOrderId, id: r.id, prod: r.product, at: Date.now() });
    sset('am_buy_mail', mail);
    say(msg, '결제 창을 여는 중…', 'ok');
    return tossSdk().then(function (TP) {
      var tp = TP(S.info.pay.clientKey);
      var req = { orderId: p.payOrderId, orderName: p.orderName, successUrl: U.successUrl, failUrl: U.failUrl, customerEmail: mail };
      if (mode === 'widget') {
        var w = tp.widgets({ customerKey: TP.ANONYMOUS });
        buyBody.innerHTML = '<h2>결제 수단 고르기</h2><p class="hz7-dlg-n">' + esc(r.name) + ' · ' + n2(p.amount) + '원(부가세 포함) · 주문 번호 ' + esc(r.id) + '</p><div id="hzPayMethods"></div><div id="hzPayAgree"></div><button class="btn btn-p btn-l" type="button" id="hzPayGo">' + ico('card') + '<span>' + n2(p.amount) + '원 결제하기</span></button><p class="msg" role="status"></p><p class="hz7-dlg-n">결제는 토스페이먼츠 결제 화면에서 이루어지며, AIMarker는 카드 번호 등 결제 수단 정보를 받지 않습니다.</p>';
        return w.setAmount({ currency: 'KRW', value: p.amount }).then(function () { return Promise.all([w.renderPaymentMethods({ selector: '#hzPayMethods', variantKey: 'DEFAULT' }), w.renderAgreement({ selector: '#hzPayAgree', variantKey: 'AGREEMENT' })]); }).then(function () {
          var go = $('#hzPayGo'), m2 = buyBody.querySelector('.msg');
          go.addEventListener('click', function () { go.disabled = true; say(m2, '결제 창으로 이동합니다…', 'ok'); Promise.resolve(w.requestPayment(req)).catch(function (e) { go.disabled = false; say(m2, payErr(e)); }); });
        });
      }
      var pm = tp.payment({ customerKey: 'am_' + cid().replace(/[^A-Za-z0-9]/g, '').slice(0, 30) });
      return Promise.resolve(pm.requestPayment(Object.assign({ method: 'CARD', amount: { currency: 'KRW', value: p.amount }, card: { useEscrow: false, flowMode: 'DEFAULT', useCardPoint: false, useAppCardOnly: false } }, req)));
    }).catch(function (e) { if (btn) btn.disabled = false; say(msg, payErr(e)); });
  }
  function payErr(e) { var c = e && e.code; if (c === 'USER_CANCEL' || c === 'PAY_PROCESS_CANCELED') return '결제를 취소했습니다. 결제는 되지 않았습니다.'; return (e && e.message) || '결제 창을 열지 못했습니다. 잠시 뒤 다시 시도해 주세요.'; }
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'hzBuyForm') {
      e.preventDefault();
      var msg = f.querySelector('.msg'), mail = f.querySelector('[name="contact"]').value.trim(), pid = (f.querySelector('input[name="product"]:checked') || {}).value || 'd1', btn = f.querySelector('button[type="submit"]');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { say(msg, '이용권 코드 · 영수증을 받을 이메일 주소를 확인해 주세요.'); return; }
      if (!f.querySelector('[name="agree"]').checked) { say(msg, '구매 · 환불 안내와 이메일 수집에 동의해 주세요.'); return; }
      btn.disabled = true; say(msg, payReady() ? '결제를 준비하는 중…' : '주문을 보내는 중…', 'ok');
      var hold = Math.max(0, 2700 - (Date.now() - t0));   // 너무 빨리 낸 주문은 서버가 사람이 아닌 것으로 보므로, 그만큼만 기다렸다 보냄
      new Promise(function (ok) { setTimeout(ok, hold); }).then(function () { return AM.call('am.buy', { product: pid, contact: mail, agree: 1, pay: payReady() ? 1 : 0, hp: f.querySelector('[name="hp"]').value, ms: Date.now() - t0, src: location.pathname, cid: cid() }, 30000); }).then(function (r) {
        if (!r || !r.ok) throw r || {};
        if (r.pay && payReady()) return startPay(r, mail, msg, btn);
        sset('am_buy_mail', mail);
        var guide = r.payGuide || '담당자가 주문을 확인하고 남겨 주신 이메일로 결제 방법을 안내해 드립니다. 결제가 확인되면 같은 메일로 이용권 코드를 보내 드립니다. 메일이 오지 않으면 스팸함을 확인하거나 contact@skkc.co.kr 로 주문 번호를 보내 주세요.';
        buyBody.innerHTML = '<h2>주문이 접수되었습니다</h2><div class="hz7-done"><p class="no">주문 번호<b>' + esc(r.id) + '</b></p><p>' + esc(r.name) + ' · ' + n2(r.price) + '원(부가세 포함)</p><div class="guide">' + esc(guide) + '</div>' +
          (r.link ? '<a class="btn btn-p btn-l" href="' + esc(r.link) + '" target="_blank" rel="noopener">결제하러 가기</a>' : '') +
          '<p class="hz7-dlg-n">코드는 ' + esc(mail) + ' 로 보내 드립니다. 메일의 단추를 누르면 코드가 들어간 채로 이 쪽이 열립니다.</p><button class="btn btn-g" type="button" data-code>코드를 받았어요 · 코드 넣기</button></div>';
      }).catch(function (e2) { btn.disabled = false; say(msg, (e2 && e2.message) || '주문을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.'); });
      return;
    }
    if (f.id === 'hzCodeForm') {
      e.preventDefault();
      var m2 = f.querySelector('.msg'), c = norm(f.querySelector('[name="code"]').value), b2 = f.querySelector('button[type="submit"]');
      if (!/^[2-9A-HJ-NP-Z]{16}$/.test(c)) { say(m2, '메일로 받은 16자리 코드를 확인해 주세요(예: K7Q4-F9XD-2MTA-8PLW).'); return; }
      b2.disabled = true; say(m2, '확인하는 중…', 'ok');
      call('am.pass', { pass: fmtCode(c) }, 20000).then(function (r) {
        setPass(c); S.ps = r.pass; S.passMsg = ''; renderPass(); S.cache = {};
        say(m2, '이용권을 넣었습니다.', 'ok'); setTimeout(function () { dlgClose($('#hzCode')); }, 500);
        if (S.res && !S.res.full) check(S.res.src);
      }).catch(function (e3) { say(m2, (e3 && e3.message) || '코드를 확인하지 못했습니다.'); }).then(function () { b2.disabled = false; });
    }
  });
  function openCode() { var d = $('#hzCode'); if (!d) return; dlgClose(buyDlg); var f = $('#hzCodeForm'); if (f) { f.reset(); say(f.querySelector('.msg'), ''); } dlgOpen(d); setTimeout(function () { var i = $('#hzCodeIn'); if (i) i.focus(); }, 60); }
  var ci = $('#hzCodeIn'); if (ci) ci.addEventListener('input', function () { var p = ci.selectionStart === ci.value.length, v = fmtCode(ci.value).slice(0, 19); if (v !== ci.value) { ci.value = v; if (p) ci.setSelectionRange(v.length, v.length); } });

  /* ---------- 결제에서 돌아왔을 때 ---------- */
  function cleanUrl() { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* 주소 그대로 */ } }
  function restoreDraft() { var d = ssget('am_hz_pay'); if (d && d.text && !ta.value) { ta.value = d.text; if (d.doc) S.docName = d.doc; var tn = $('#hzTone'); if (tn && d.tone) tn.value = d.tone; count(); } return d; }
  function payReturn() {
    var d = restoreDraft();
    box.scrollIntoView({ behavior: 'auto', block: 'start' });
    out.innerHTML = '<div class="hz7-prog"><b>결제를 확인하는 중입니다</b><i><em style="width:40%"></em></i><p>토스페이먼츠 승인 결과를 서버에서 확인한 뒤 이용권을 바로 열어 드립니다. 이 화면을 닫지 마세요.</p></div>';
    call('am.payok', { paymentKey: Q.paymentKey, orderId: Q.orderId, amount: Q.amount }, 60000).then(function (r) {
      cleanUrl();
      if (r.waiting) { ssset('am_hz_pay', null); out.innerHTML = '<div class="hz8-paid wait">' + ico('clock') + '<div><b>입금을 기다리고 있습니다</b><span>' + esc(r.name) + ' · ' + n2(r.price) + '원 · 계좌 ' + esc(r.account || '') + (r.due ? ' · ' + esc(r.due) + '까지' : '') + '. 입금이 확인되면 이용권 코드를 메일로 보내 드립니다.</span></div></div>'; return; }
      if (!r.code) { out.innerHTML = '<div class="hz8-paid">' + ico('check') + '<div><b>이미 결제가 끝난 주문입니다</b><span>' + esc(r.message || '이용권 코드는 주문할 때 적은 이메일로 보냈습니다.') + ' <button type="button" class="hz7-link" data-code>코드 넣기</button></span></div></div>'; return; }
      setPass(r.code); S.paid = { name: r.name, code: r.code, mailed: r.mailed, to: r.to, receipt: r.receipt }; S.cache = {};
      ssset('am_hz_pay', null);
      return call('am.pass', { pass: S.pass }, 20000).then(function (p) { S.ps = p.pass; renderPass(); }).catch(function () { renderPass(); }).then(function () {
        if (String(ta.value || '').replace(/\s+/g, '')) return check(ta.value);
        out.innerHTML = paidBar() + '<div class="hz7-prog"><b>이용권이 준비되었습니다</b><p>검사할 글을 넣고 AI 작성률 검사를 누르면 전체 결과와 결과상세내역서가 열립니다.</p></div>';
      });
    }).catch(function (e) {
      cleanUrl();
      out.innerHTML = '<div class="hz7-err"><b>결제를 확인하지 못했어요</b><span>' + esc((e && e.message) || '잠시 뒤 다시 시도해 주세요.') + ' 결제가 되었는데 이용권이 열리지 않으면 주문 번호(' + esc(String(Q.orderId || '').slice(0, 11)) + ')와 함께 contact@skkc.co.kr 로 알려 주세요.</span><div class="row"><button class="btn btn-p btn-s" type="button" data-buy="' + esc((d && d.prod) || 'd1') + '">다시 결제하기</button><button class="btn btn-g btn-s" type="button" data-code>코드가 있어요</button></div></div>';
    });
  }
  function payFail() {
    var d = restoreDraft(); cleanUrl();
    var m = Q.code === 'PAY_PROCESS_CANCELED' || Q.code === 'USER_CANCEL' ? '결제를 취소했습니다. 결제는 되지 않았습니다.' : (Q.message || '결제를 마치지 못했습니다. 결제는 되지 않았습니다.');
    out.innerHTML = '<div class="hz7-err"><b>결제가 끝나지 않았어요</b><span>' + esc(m) + ' 넣어 둔 글은 그대로 두었습니다.</span><div class="row"><button class="btn btn-p btn-s" type="button" data-buy="' + esc((d && d.prod) || 'd1') + '">다시 결제하기</button><button class="btn btn-g btn-s" type="button" data-again>무료 맛보기로 보기</button></div></div>';
    S.retry = function () { check(ta.value, { free: true }); };
  }
  if (Q.pay === 'ok' && Q.paymentKey && Q.orderId) payReturn();
  else if (Q.pay === 'fail') payFail();

  /* 다른 쪽에서 바로 여는 주소: #buy-s1 · #buy-d1 · #buy-m1 · #buy-q1 · #code */
  function hashGo() {
    var h = (location.hash || '').slice(1), m = /^buy-(s1|d1|m1|q1)$/.exec(h);
    if (m) openBuy(m[1]); else if (h === 'code') openCode(); else return;
    try { history.replaceState(null, '', location.pathname + location.search + '#price'); } catch (e) { /* 주소 그대로 */ }
  }
  window.addEventListener('hashchange', hashGo); hashGo();

  count();
})();
