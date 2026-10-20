/* AIMarker AI 작성률 검사 · 휴머나이징 9.0 (2026.10.20)
   - 9.0 결과 화면: 판정을 한눈에(AI 검출됨 · AI 일부 검출 · AI 검출 안 됨 · 판단 보류)와 정식 판정(부적합 · 고위험 · 안전),
     문장 표시는 한 가지(AI 검출, 빨간 형광펜). 높음 · 중간 · 낮음 3단계 표시는 쓰지 않음(판정 기준 숫자는 그대로)
   - 8.1: 인간화 엔진 HUM(서버 1.27.0, 생성 AI 없이). 고급 휴머나이징 무료 맛보기(첫 문단) · 이용권은 6,000자씩 나눠 전체 · 다른 버전 ·
     말투 자동(보고서 · 과제는 한다체) · 한다체 · 해요체 · 습니다체 · 다시 쓴 문장 후보 2개(도우미)
   - 판정 기준 AMJ-1.0: AI 작성률 · 판정(안전 · 고위험 · 부적합)과 판정 근거 · 구간(문단)별 검출 · AI 문체 특성 · 종합 분석 의견
   - 무료 맛보기(앞 6,000자, 이용권 첫 조각과 같은 범위 · 같은 값): 작성률 · 판정 · 근거 · 글자 수 · 구간 수 · 특성 이름 · 의견과 가장 뚜렷한 문장 2개.
     위치(AI 검출 문장 · 구간) · 특성 예시 · 먼저 고칠 문장 · 결과상세내역서는 결제 뒤에 열림
   - 결제: 토스페이먼츠 바로 결제(서버가 키를 켰을 때) → 돌아오면 서버 승인 → 이용권 코드 → 같은 글을 바로 다시 검사 → 결과상세내역서.
     키가 없으면 주문 메일 방식. 글은 결제창으로 가는 동안 이 브라우저(세션 저장소)에만 잠시 둠
   - 서버 am.style · am.humanize · am.pass · am.passinfo · am.buy · am.payok. 판별 규칙 · 가중치는 서버에만 */
(function () {
  'use strict';
  var AM = window.AM || {}, $ = function (s, el) { return (el || document).querySelector(s); };
  var box = $('#hz'); if (!box || !AM.call) return;
  var ta = $('#hzText'), out = $('#hzOut'), btnC = $('#hzCheck'), btnF = $('#hzFix'), btnP = $('#hzPro'), passEl = $('#hzPass');
  var FREE_MAX = 6000, PAID_MAX = 50000, CHUNK = 6000, HUM_MAX = 6000, HELP_MAX = 600;
  var S = { pass: '', ps: null, passMsg: '', proReady: true, info: null, busy: false, res: null, fx: null, edits: {}, sel: -1, side: 'ai', cache: {}, first: true, paid: null, variant: 0, toneUsed: '' };
  var CAT = { 0: '말투', 1: '번역투', 2: '상투적 연결어', 3: '빈말 · 과장 수식', 4: '틀에 박힌 도입 · 마무리', 5: '대화창 복사 흔적', 6: '문장 리듬', 7: '딱딱한 어휘' };
  var ROOT = document.body.getAttribute('data-root') || '/';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* 판정 기준 AMJ-1.0(서버 detect.js와 같은 숫자 · 같은 문장 틀). 여러 조각(6,000자씩)을 합칠 때만 사이트에서 다시 계산 */
  var J = { HI: 85, MID: 65, SHORT: 60, SEG_AI: 20, UNFIT_RATE: 40, RISK_RATE: 20, UNFIT_SEG: 50,
    B: { unfit: ['부적합', '부적합 · 개선 필요'], risk: ['고위험', '고위험 · 수정 권고'], safe: ['안전', '안전 · AI 패턴 적음'], short: ['판단 보류', '판단 보류 · 글이 짧음'] } };
  var PRODS = [
    { id: 's1', name: '1건 이용권', price: 1900, desc: '글 한 편 · 검사 · 다듬기 3회(6,000자마다 1회) · 고급 휴머나이징 1회 · 결과상세내역서 · 24시간' },
    { id: 'd1', name: '24시간 이용권', price: 2900, best: 1, desc: '처음 사용한 때부터 24시간 · 검사 · 다듬기 40회 · 고급 휴머나이징 10회' },
    { id: 'm1', name: '30일 이용권', price: 9900, days: 30, desc: '처음 사용한 날부터 30일 · 하루 검사 · 다듬기 40회 · 고급 휴머나이징 하루 20회' },
    { id: 'q1', name: '90일 이용권', price: 19900, days: 90, desc: '처음 사용한 날부터 90일 · 하루 검사 · 다듬기 40회 · 고급 휴머나이징 하루 20회' }
  ];

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var n2 = function (n) { return Number(n || 0).toLocaleString('ko-KR'); };
  var pad3 = function (n) { return ('00' + n).slice(-3); };
  function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = c || 'w' + Math.random().toString(36).slice(2, 12); } return c; }
  function sget(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function sset(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* 저장 없이 */ } }
  function ssget(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function ssset(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 없이 */ } }
  function tone() { return ($('#hzTone') || {}).value || 'auto'; }
  function toneFor() { var t = tone(); return t === 'auto' && S.toneUsed ? S.toneUsed : t; }   // 문장 도우미는 글 전체에서 정한 말투로
  function prod(id) { var L = (S.info && S.info.products && S.info.products.length) ? S.info.products : PRODS; for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function prods() { return (S.info && S.info.products && S.info.products.length) ? S.info.products : PRODS; }
  var RETRY = { 'am.style': 1, 'am.humanize': 1, 'am.passinfo': 1 };   // 응답이 없으면 한 번 더(무료 요청만. 이용권 요청은 늦게 끝나면 횟수가 두 번 빠질 수 있어 다시 보내지 않음)
  function call(action, data, ms) {
    var d = Object.assign({ cid: cid() }, data || {}), t = ms || 60000;
    var p = RETRY[action] && !d.pass && AM.callRetry ? AM.callRetry(action, d, t, action === 'am.passinfo' ? null : slowNote) : AM.call(action, d, t);
    return p.then(function (r) { if (!r || !r.ok) throw r || { message: '응답이 없습니다. 잠시 뒤 다시 시도해 주세요.' }; if (r.pass) { S.ps = r.pass; renderPass(); } return r; });
  }
  function slowNote() {   // 다시 보낼 때 진행 표시에 알림
    var el = $('.hz7-prog', out), p = el && $('p', el);
    if (p) p.textContent = '서버 응답이 늦어 한 번 더 보냈습니다. 조금만 더 기다려 주세요.';
    stat('서버 응답이 늦어 한 번 더 보냈습니다');
  }
  function ico(name) {
    var P = { lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', check: '<path d="M20 6 9 17l-5-5"/>', alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>', back: '<path d="M15 18l-6-6 6-6"/>', file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>' };
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
    if (/\.(hwp|pdf|doc)$/.test(nm)) return Promise.reject(new Error('.hwp, .pdf, .doc 파일은 아직 바로 열지 못합니다. 글을 복사해 붙여 넣거나 .docx나 .hwpx로 저장해 넣어 주세요.'));
    return Promise.reject(new Error('Word(.docx), 한글(.hwpx), 텍스트(.txt) 파일을 넣어 주세요.'));
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
      var p = S.ps, when = p.started ? (p.daily ? md(p.end).replace(/ \d\d:\d\d$/, '') + '까지 · 오늘 ' : md(p.end) + '까지 · ') : (p.daily ? '처음 사용한 날부터 · 하루 ' : '처음 검사한 때부터 24시간 · ');
      h = '<span class="chip on">' + ico('check') + esc(p.name) + '</span><span>' + when + '남은 검사 · 다듬기 <b>' + n2(p.left) + '</b>회' + (p.pro ? ' · 고급 휴머나이징 ' + n2(p.proLeft) + '회' : '') + '</span><span class="sp"></span><button type="button" class="hz7-link" data-code>코드 바꾸기</button>';
    } else if (S.pass) h = '<span class="chip">이용권 확인 중</span><span>' + esc(S.pass) + '</span>';
    else h = '<span class="chip off">무료 맛보기</span><span>' + (S.passMsg ? esc(S.passMsg) : '앞 6,000자 · AI 작성률 · 판정과 근거 · 가장 뚜렷한 문장 2개까지') + '</span><span class="sp"></span><button type="button" class="hz7-link" data-code>이용권 코드 넣기</button><button type="button" class="hz7-link" data-buy="d1">이용권 구매</button>';
    passEl.innerHTML = h; count(); if (typeof proBtn === 'function') proBtn();
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
  var infoP = call('am.passinfo', {}, 20000).then(function (r) { S.info = r; S.proReady = r.proReady !== false; proBtn(); renderPass(); return r; }).catch(function () { proBtn(); return null; });
  function proBtn() { btnP.disabled = !S.proReady || S.busy; var tg = $('#hzProTag'); if (tg) tg.textContent = S.pass ? '이용권' : '첫 문단 무료'; btnP.title = 'AI 문체를 사람 말투로 바꿉니다. AIMarker 인간화 엔진(생성 AI 없이 우리 서버에서)'; }
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

  /* ---------- 판정(여러 조각을 합칠 때) · 한눈에 읽는 판정 문구 ---------- */
  var HEAD = { unfit: 'AI 검출됨', risk: 'AI 일부 검출', safe: 'AI 검출 안 됨', short: '판단 보류' };
  var ADV = {
    unfit: '현재 상태로 제출하거나 게시하는 것은 권장하지 않습니다. 검출 문장을 내 말로 고쳐 쓰거나 휴머나이징으로 다듬은 뒤 다시 검사해 보세요.',
    risk: '제출하거나 게시하기 전에 검출 문장을 한 번 더 다듬는 것을 권합니다. 고친 뒤 다시 검사하면 같은 기준으로 비교할 수 있습니다.',
    safe: '눈에 띄는 AI 작성 패턴이 적습니다. 다만 추정값이므로 제출처의 AI 사용 규정을 함께 확인하세요.',
    short: J.SHORT + '자 이상, 가능하면 세 문장 이상을 넣어 다시 검사해 주세요.'
  };
  function judge(s) {
    var why = [], mk = function (k, w) { return { key: k, ko: J.B[k][0], label: J.B[k][1], why: w }; };
    if (s.chars < J.SHORT) return mk('short', ['글자 수 ' + s.chars + '자(' + J.SHORT + '자 미만은 판단하지 않음)']);
    if (s.rate >= J.UNFIT_RATE) why.push('AI 작성률 ' + s.rate + '%(부적합 기준 ' + J.UNFIT_RATE + '% 이상)');
    if (s.segN >= 2 && s.segAi * 100 >= s.segN * J.UNFIT_SEG) why.push('AI 검출 구간 ' + s.segAi + '/' + s.segN + '구간(부적합 기준 전체 구간의 절반 이상)');
    if (s.chat >= 1) why.push('AI 대화창 흔적 ' + s.chat + '곳(부적합 기준 1곳 이상)');
    if (why.length) return mk('unfit', why);
    if (s.rate >= J.RISK_RATE) why.push('AI 작성률 ' + s.rate + '%(고위험 기준 ' + J.RISK_RATE + '% 이상)');
    if (s.segAi >= 1) why.push('AI 검출 구간 ' + s.segAi + '/' + s.segN + '구간(고위험 기준 1구간 이상)');
    if (s.hi + s.mid >= 1) why.push('AI 점수 ' + J.MID + ' 이상 문장 ' + (s.hi + s.mid) + '개(고위험 기준 1개 이상)');
    if (why.length) return mk('risk', why);
    return mk('safe', ['AI 작성률 ' + s.rate + '%(안전 기준 ' + J.RISK_RATE + '% 미만)', 'AI 검출 구간 없음', 'AI 점수 ' + J.MID + ' 이상 문장 없음']);
  }
  // 서버가 보낸 판정 근거도 같은 말로(문장 등급 대신 AI 점수)
  function whyFix(w) { return String(w || '').replace(/AI 가능성 중간 이상 문장/g, 'AI 점수 ' + J.MID + ' 이상 문장').replace(/^(AI 작성률 \d+%)\((\d+)% 미만\)$/, '$1(안전 기준 $2% 미만)'); }
  function q2(t) { return String(t == null ? '' : t).replace(/'([^'\n]{1,40})'/g, '‘$1’'); }   // 서버 글의 곧은 따옴표를 굽은 따옴표로
  function whyMain(w) { return String(w || '').replace(/\(.*\)$/, ''); }
  function josa(w, a, b) { var c = String(w || '').replace(/['"’”)\]\s]+$/, '').slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; }
  function nAi(M) { var l = (M && M.lv) || {}; return (l.hi || 0) + (l.mid || 0) + (l.low || 0); }
  function headOf(b) { return HEAD[b && b.key] || (b && b.ko) || '판단 보류'; }
  function subLine(M) {
    var k = M.band.key, n = nAi(M);
    if (k === 'short') return '글이 ' + n2(M.chars) + '자로 짧아 판단하지 않았습니다. ' + J.SHORT + '자 이상 넣어 주세요.';
    if (!M.aiChars) return M.chat ? 'AI 작성 패턴이 검출된 문장은 없지만, AI 대화창에서 복사한 흔적이 ' + M.chat + '곳 있습니다.' : n2(M.n) + '문장에서 AI 작성 패턴이 검출되지 않았습니다.';
    return n2(M.n) + '문장 가운데 ' + n2(n) + '문장에서 AI 작성 패턴이 검출되었습니다.';
  }
  function opinion(o) {
    var L = [], b = o.band.key, f = o.feat || [], n = nAi(o);
    if (b === 'short') return ['글이 ' + n2(o.chars) + '자로 짧아 판단하지 않았습니다.'];
    L.push(o.aiChars ? '검사한 글 ' + n2(o.chars) + '자 가운데 ' + n2(o.aiChars) + '자(' + o.rate + '%)가 AI가 쓴 글과 비슷한 문장으로 검출되었습니다.' : '검사한 글 ' + n2(o.chars) + '자, ' + n2(o.n) + '문장에서 AI가 쓴 글과 비슷한 문장은 검출되지 않았습니다.');
    if (o.segAi) L.push(o.segN === 1 ? '글 전체(1구간)에서 AI 작성 패턴이 뚜렷합니다.' : o.segN + '개 구간 가운데 ' + o.segAi + '개 구간(' + Math.round(o.segAi / o.segN * 100) + '%)에서 AI 작성 패턴이 뚜렷합니다.');
    else if (o.segN) L.push((o.segN > 1 ? o.segN + '개 구간 모두' : '글 전체(1구간)가') + ' AI 검출 구간 기준(구간 글자의 ' + J.SEG_AI + '% 이상)에 미치지 않았습니다.');
    if (f.length >= 2) L.push('가장 많이 나온 AI 문체 특성은 ‘' + f[0].name + '’' + josa(f[0].name, '과', '와') + ' ‘' + f[1].name + '’입니다.');
    else if (f.length === 1) L.push('가장 많이 나온 AI 문체 특성은 ‘' + f[0].name + '’입니다.');
    else if (o.segAi) L.push('검출 구간에서는 눈에 띄는 표현보다 문장 짜임과 말투가 AI 글과 비슷합니다.');
    if (n) L.push(n2(o.n) + '문장 가운데 ' + n + '문장이 AI 검출 문장입니다. 검출 문장부터 고쳐 쓰면 작성률이 가장 크게 내려갑니다.');
    return L;
  }
  function fixFirst(M) {   // 먼저 고칠 문장(AI 점수 높은 순) · 가장 많이 검출된 구간
    var idx = [];
    M.sentences.forEach(function (s, i) { if (lvOf(s) > 0) idx.push(i); });
    idx.sort(function (a, b) { return (M.sentences[b].p || 0) - (M.sentences[a].p || 0) || a - b; });
    var ai = M.segs.filter(function (g) { return g.ai; });
    var top = ai.slice().sort(function (a, b) { return b.share - a.share || b.a - a.a || a.no - b.no; })[0] || null;
    return { sent: idx.slice(0, 3), top: top, ai: ai };
  }
  function opDetail(M) {   // 결과상세내역서에 적는 고칠 곳
    var F = fixFirst(M), L = [];
    if (F.sent.length) L.push('먼저 고칠 문장: ' + F.sent.map(function (k) { return (k + 1) + '번째'; }).join(' · ') + ' 문장(AI 점수가 높은 순서)');
    if (F.top) {
      L.push('AI 검출이 가장 많은 구간: 구간 ' + pad3(F.top.no) + '(' + n2(F.top.c) + '자 가운데 ' + n2(F.top.a) + '자, ' + F.top.share + '%)');
      L.push('AI 검출 구간 위치: 구간 ' + F.ai.map(function (s) { return pad3(s.no); }).join(' · ') + '(전체 ' + M.segs.length + '구간)');
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
    if (one && one.band) { M.band = { key: one.band.key, ko: one.band.ko, label: one.band.label, why: (one.band.why || []).map(whyFix) }; M.feat = one.feat || []; }
    else {
      M.feat = Object.keys(fagg).map(function (k) { var o = fagg[k]; o.share = M.segAi ? Math.round(o.segs / M.segAi * 100) : 0; return o; }).sort(function (x, y) { return (y.segs - x.segs) || (y.n - x.n) || (x.cat - y.cat); });
      M.band = judge({ chars: M.chars, rate: M.rate, segN: M.segN, segAi: M.segAi, hi: M.lv.hi, mid: M.lv.mid, chat: M.chat });
    }
    if (!HEAD[M.band.key]) M.band = { key: 'short', ko: J.B.short[0], label: J.B.short[1], why: M.band.why || [] };   // 모르는 판정은 보류로
    M.opinion = opinion(M); M.opDetail = full ? opDetail(M) : [];   // 의견은 늘 이 화면의 말(한 가지 표시)로
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
    if (!el) { out.innerHTML = '<div class="hz7-prog"><b></b><i><em></em></i><p>문장마다 앞뒤 문장과 함께 AI 글 패턴을 살피고, AIMarker 판정 기준 1.0으로 판정합니다. 같은 글은 언제나 같은 결과가 나옵니다.</p></div>'; el = $('.hz7-prog', out); stat(label); }
    $('b', el).textContent = label + (n > 1 ? ' ' + i + ' / ' + n : ''); $('em', el).style.width = Math.max(6, pct) + '%';
    el.classList.toggle('ind', n <= 1 && i < n);   // 한 번에 끝나는 검사는 흐르는 막대로
  }
  function note(msg) { out.innerHTML = '<div class="hz7-prog"><b>' + esc(msg) + '</b></div>'; stat(msg); }
  function stat(t) { var st = document.getElementById('hzStat'); if (st) st.textContent = t || ''; }   // 화면 읽기 프로그램에는 한 줄만 알림
  function fail(e, retry, redo) {
    var code = e && e.code, slow = !!e && (e.name === 'AbortError' || e.name === 'TypeError');   // 시간 초과 · 연결 끊김
    var m = slow ? (e.name === 'TypeError' ? '서버에 연결하지 못했습니다. 넣은 글은 그대로 있으니 잠시 뒤 다시 시도해 주세요.' : '서버 응답이 늦어 결과를 받지 못했습니다. 넣은 글은 그대로 있으니 다시 시도해 주세요.') : (e && (e.message || e.msg)) || '지금은 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
    var acts = slow && redo ? '<button class="btn btn-p btn-s" type="button" data-redo>다시 시도</button>' : '';
    var again = retry ? '<button class="btn btn-g btn-s" type="button" data-again>무료 맛보기로 보기</button>' : '';
    if (code === 'PASS') { clearPass(); S.passMsg = m; renderPass(); acts = '<button class="btn btn-g btn-s" type="button" data-code>코드 다시 넣기</button>' + again; }
    else if (code === 'PASS_END' || code === 'PASS_USED') acts = '<button class="btn btn-p btn-s" type="button" data-buy="d1">새 이용권 구매</button>' + again;
    else if (code === 'PASS_NEED') acts = '<button class="btn btn-p btn-s" type="button" data-buy="d1">24시간 이용권 2,900원</button><button class="btn btn-g btn-s" type="button" data-code>이용권 코드 넣기</button>';
    else if (code === 'FREE_DAY') acts = '<button class="btn btn-p btn-s" type="button" data-buy="s1">1건 이용권 1,900원</button><button class="btn btn-g btn-s" type="button" data-buy="d1">24시간 이용권 2,900원</button>';
    out.innerHTML = '<div class="hz7-err"><b>' + (code === 'PASS_NEED' ? '이용권이 필요해요' : slow ? (e.name === 'TypeError' ? '연결하지 못했어요' : '응답이 늦어요') : '처리하지 못했어요') + '</b><span>' + esc(m) + '</span>' + (acts ? '<div class="row">' + acts + '</div>' : '') + '</div>'; stat(m);
    S.retry = retry || null; S.redo = redo || null;
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
    }).catch(function (e) { fail(e, function (free) { check(t, { free: free }); }, function () { check(t, opt); }); return null; })
      .then(function (M) { setBusy(false); return M; });
  }
  btnC.addEventListener('click', function () { check(); });

  /* ---------- 결과 그리기 9.0: 한눈에 읽는 판정(머리 · 수치) ---------- */
  function bk(k) { return { unfit: 'u', risk: 'r', safe: 's', short: 'n' }[k] || 'n'; }
  function bandCls(k) { return 'is-' + bk(k); }   // 판정 색 묶음(is-u 부적합 · is-r 고위험 · is-s 안전 · is-n 보류)
  function stIco(k) {   // 판정 표시: 부적합 원 · 고위험 세모 · 안전 체크 · 보류 줄(색 말고 모양으로도 구분)
    var c = bk(k), P = {
      u: '<circle class="bg" cx="12" cy="12" r="11"/><path class="fg" d="M12 6.9v6.2M12 16.9v.2"/>',
      r: '<path class="bg" d="M10.27 2.95a2 2 0 0 1 3.46 0l9.02 15.6A2 2 0 0 1 21.02 21.5H2.98a2 2 0 0 1-1.73-2.95z"/><path class="fg" d="M12 8.7v5.1M12 17.2v.2"/>',
      s: '<circle class="bg" cx="12" cy="12" r="11"/><path class="fg" d="m7.3 12.3 3.1 3.1 6.3-6.5"/>',
      n: '<circle class="bg" cx="12" cy="12" r="11"/><path class="fg" d="M7.6 12h8.8"/>' };
    return '<i class="hz9-st ' + bandCls(k) + '" aria-hidden="true"><svg viewBox="0 0 24 24">' + P[c] + '</svg></i>';
  }
  function gauge(rate, band, opt) {
    opt = opt || {};
    var sm = !!opt.sm, R = 88, cx = 120, cy = 112, v = Math.max(0, Math.min(100, Math.round(rate || 0))), k = bandCls(band && band.key);
    var pt = function (x, r) { var a = Math.PI * (1 - x / 100); r = r == null ? R : r; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
    var f = function (n) { return n.toFixed(2); };
    var arc = function (a, b, cls, ex) { var p = pt(a), q = pt(b); return '<path class="' + cls + '"' + (ex || '') + ' d="M' + f(p[0]) + ' ' + f(p[1]) + ' A' + R + ' ' + R + ' 0 0 1 ' + f(q[0]) + ' ' + f(q[1]) + '"/>'; };
    var lab = function (x, t) { var o = pt(x, R + 18); return '<text x="' + o[0].toFixed(1) + '" y="' + (o[1] + 4).toFixed(1) + '">' + t + '</text>'; };
    var m = pt(v);
    if (band && band.key === 'short' && opt.chars != null) {   // 판단 보류: 작성률 대신 판단까지 남은 글자(60자)
      var c = Math.max(0, opt.chars), q = Math.min(100, Math.round(c / J.SHORT * 100)), mq = pt(q);
      return '<div class="hz9-g ' + k + (sm ? ' sm' : '') + '" role="img" aria-label="글자 수 ' + c + '자, ' + J.SHORT + '자부터 판단">' +
        '<svg viewBox="0 0 240 ' + (sm ? 122 : 136) + '" aria-hidden="true">' + arc(0, 100, 'z zn') + (q > 0 ? arc(0, 100, 'val', ' pathLength="100" style="stroke-dasharray:' + q + ' 100"') : '') + '<circle class="dot" cx="' + f(mq[0]) + '" cy="' + f(mq[1]) + '" r="8.5"/>' +
        (sm ? '' : '<text x="' + (cx - R) + '" y="' + (cy + 22) + '">0</text><text x="' + (cx + R) + '" y="' + (cy + 22) + '">' + J.SHORT + '자</text>') + '</svg><b data-n="' + c + '">' + c + '<small>자</small></b>' + (sm ? '' : '<span>' + J.SHORT + '자부터 판단</span>') + '</div>';
    }
    return '<div class="hz9-g ' + k + (sm ? ' sm' : '') + (v >= 100 ? ' w3' : '') + '" role="img" aria-label="AI 작성률 ' + v + '퍼센트' + (band ? ', ' + esc(headOf(band)) : '') + '">' +
      '<svg viewBox="0 0 240 ' + (sm ? 122 : 136) + '" aria-hidden="true">' + arc(0, 19.4, 'z zs') + arc(20.6, 39.4, 'z zr') + arc(40.6, 100, 'z zu') +
      (v > 0 ? arc(0, 100, 'val', ' pathLength="100" style="stroke-dasharray:' + v + ' 100"') : '') +
      '<circle class="dot" cx="' + f(m[0]) + '" cy="' + f(m[1]) + '" r="8.5"/>' +
      (sm ? '' : lab(20, '20') + lab(40, '40') + '<text x="' + (cx - R) + '" y="' + (cy + 22) + '">0</text><text x="' + (cx + R) + '" y="' + (cy + 22) + '">100</text>') +
      '</svg><b data-n="' + v + '">' + v + '<small>%</small></b>' + (sm ? '' : '<span>AI 작성률</span>') + '</div>';
  }
  function chip(band) { var p = String(band.label || '').split(' · '); return '<span class="hz9-v ' + bandCls(band.key) + '"><b>' + esc(p[0] || band.ko) + '</b>' + (p[1] ? '<span>' + esc(p[1]) + '</span>' : '') + '</span>'; }
  function zoneOf(rate) { return rate >= J.UNFIT_RATE ? 'unfit' : rate >= J.RISK_RATE ? 'risk' : 'safe'; }
  function scaleHtml(key) {   // 작성률 구간 알약(지금 작성률이 든 구간만 진하게)
    var Z = [['s', 'safe', '안전', '0~19%'], ['r', 'risk', '고위험', '20~39%'], ['u', 'unfit', '부적합', '40% 이상']];
    return '<ul class="hz9-scale" aria-label="AI 작성률 구간">' + Z.map(function (z) { var on = key === z[1]; return '<li class="' + z[0] + (on ? ' on' : '') + '"' + (on ? ' aria-current="true"' : '') + '><i></i>' + z[2] + '<small>' + z[3] + '</small></li>'; }).join('') + '</ul>';
  }
  function scaleFor(M) {   // 판정이 작성률 말고 다른 기준(검출 구간 · 대화창 흔적)으로 정해졌으면 한 줄로 알림
    var b = M.band; if (b.key === 'short') return '';
    var z = zoneOf(M.rate), h = scaleHtml(z);
    if (b.key === z) return h;
    var rs = (b.why || []).filter(function (w) { return !/^AI 작성률/.test(w); }).map(whyMain);
    return h + '<p class="hz9-znote">작성률은 ' + { safe: '안전', risk: '고위험', unfit: '부적합' }[z] + ' 구간이지만 ' + (rs.length ? esc(rs.join(', ')) + '에 해당해' : '다른 판정 기준에 해당해') + ' ' + esc(b.ko) + '으로 판정했습니다.</p>';
  }
  function whyHtml(b) {
    var W = b.why || []; if (!W.length) return '';
    return '<div class="hz9-why"><p>판정 근거</p><ul>' + W.map(function (w) { var m = /^(.*?)\((.*)\)$/.exec(w); return '<li>' + (m ? '<b>' + esc(m[1]) + '</b><span>' + esc(m[2]) + '</span>' : '<b>' + esc(w) + '</b>') + '</li>'; }).join('') + '</ul></div>';
  }
  function metaHtml(M) {
    return '<dl class="hz9-meta">' + (M.full ? '' : '<div class="free"><dt class="k-sr">보기 범위</dt><dd>무료 맛보기</dd></div>') +
      '<div><dt>검사 번호</dt><dd>' + esc(M.cn || '-') + '</dd></div><div><dt>검사 시각</dt><dd>' + esc(stamp(M.at)) + '</dd></div><div><dt>판정 기준</dt><dd>' + esc(M.crit || 'AMJ-1.0') + '</dd></div></dl>';
  }
  function statsHtml(M) {
    var pct = function (a, b) { return b ? Math.round(a / b * 100) : 0; }, n = nAi(M), segN = M.segN || 0;
    var cell = function (lb, a, b, unit, p) { return '<div' + (a ? ' class="on"' : '') + '><dt>' + lb + '</dt><dd><b>' + n2(a) + '</b><span>/ ' + n2(b) + unit + '</span><em>' + p + '%</em></dd><dd class="hz9-bar" aria-hidden="true"><i style="width:' + p + '%"></i></dd></div>'; };
    return '<dl class="hz9-stats">' + cell('AI 검출 글자', M.aiChars, M.chars, '자', M.rate) + cell('AI 검출 문장', n, M.n, '문장', pct(n, M.n)) + cell('AI 검출 구간', M.segAi, segN, '구간', pct(M.segAi, segN)) + '</dl>';
  }
  function headHtml(M, anim) {
    var b = M.band;
    return '<section class="hz9-sum ' + bandCls(b.key) + (anim ? ' anim' : '') + '" aria-label="종합 판정">' +
      '<div class="hz9-top">' + gauge(M.rate, b, { chars: M.chars }) +
        '<div class="hz9-jd"><h2 class="hz9-hl">' + stIco(b.key) + '<span>' + esc(headOf(b)) + '</span></h2>' +
          '<p class="hz9-sub">' + esc(subLine(M)) + '</p>' +
          '<div class="hz9-row"><span class="hz9-lbl">판정</span>' + chip(b) + '</div>' + scaleFor(M) + whyHtml(b) +
        '</div>' + metaHtml(M) +
      '</div>' + (b.key === 'short' ? '' : statsHtml(M)) + '<p class="hz9-est">' + ico('info') + '<span>AI 작성률과 판정은 판별 모델로 계산한 추정값입니다. 증명으로 쓰지 말고, 결과만으로 글쓴이를 단정하지 마세요.</span></p></section>';
  }
  function countUp() {   // 처음 그릴 때 한 번만: 작성률 숫자를 0부터
    var b = out.querySelector('.hz9-sum.anim .hz9-g b[data-n]'); if (!b) return;
    var n = +b.getAttribute('data-n'), t0 = null; if (!n) return;
    var sm = (b.querySelector('small') || {}).textContent || '%';
    var step = function (t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / 950), e = 1 - Math.pow(1 - k, 3); b.innerHTML = Math.round(n * e) + '<small>' + sm + '</small>'; if (k < 1) requestAnimationFrame(step); };
    b.innerHTML = '0<small>' + sm + '</small>'; requestAnimationFrame(step);
  }
  function warn(c, t) { return '<div class="hz7-warn' + (c ? ' ' + c : '') + '">' + ico(c === 'cut' ? 'info' : 'alert') + '<span>' + esc(t) + '</span></div>'; }
  function notesHtml(M) {
    var h = '';
    if (M.cut) h += warn('cut', '무료 맛보기는 앞부분만 검사했습니다(전체 ' + n2(M.total) + '자 가운데 앞 ' + n2(M.cutAt || FREE_MAX) + '자). 이용권은 5만 자까지 한 번에 검사합니다.');
    if (M.chat) h += warn('bad', 'AI 대화창에서 복사한 흔적이 있습니다(' + M.chatList.map(function (c) { return c.name + ' ' + c.n + '곳'; }).join(' · ') + '). 제출 전에 꼭 지우세요.');
    if (M.verse) h += warn('', '시나 노랫말처럼 줄이 짧은 글은 판별이 불안정합니다. 참고로만 보세요.');
    else if (M.short && M.band.key !== 'short') h += warn('', '150자보다 짧은 글은 판별이 불안정합니다. 참고로만 보세요.');
    return h;
  }

  /* ---------- 결과 그리기: 의견 · 특성 · 결제 안내 · 구간 ---------- */
  function opinionHtml(M) {
    var L = M.opinion || [], k = M.band.key, fx = '';
    if (M.full) {
      var F = fixFirst(M);
      if (F.sent.length || F.top) fx = '<div class="hz9-fx"><p>먼저 고칠 곳</p>' +
        (F.sent.length ? '<div><span>문장</span><p class="go">' + F.sent.map(function (i) { return '<button type="button" class="hz9-go" data-i="' + i + '">' + (i + 1) + '번째 문장</button>'; }).join('') + '</p></div>' : '') +
        (F.top ? '<div><span>구간</span><p class="go"><button type="button" class="hz9-go" data-seg="' + F.top.no + '">구간 ' + pad3(F.top.no) + ' · ' + F.top.share + '%</button>' + (F.ai.length > 1 ? '<small>검출 구간 ' + F.ai.length + '곳 가운데 가장 많음</small>' : '') + '</p></div>' : '') + '</div>';
    } else if (M.opDetailN > 0) fx = '<div class="hz9-fx lk">' + ico('lock') + '<p><b>먼저 고칠 문장과 가장 많이 검출된 구간</b><span>이용권으로 열면 눌러서 바로 찾아갑니다</span></p></div>';
    return '<section class="hz9-op"><h3>종합 분석 의견</h3><ul>' + L.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="hz9-adv ' + bandCls(k) + '"><b>' + ({ unfit: '개선 필요', risk: '수정 권고' }[k] || '참고') + '</b><p>' + esc(ADV[k] || ADV.short) + '</p></div>' + fx + '</section>';
  }
  function featHtml(M) {
    var F = M.feat || [];
    if (!F.length && !M.segAi) return '';
    var h = '<section class="hz9-ft"><h3>주요 AI 문체 특성' + (M.segAi ? '<small>검출 구간 ' + M.segAi + '곳 기준</small>' : '') + '</h3>';
    if (!F.length) return h + '<p class="hz9-mute">검출 구간에서 눈에 띄는 표현은 없고, 문장 짜임과 말투가 AI 글과 비슷합니다.</p></section>';
    var more = F.slice(4).map(function (f) { return f.name; });
    return h + '<ol class="hz9-fl">' + F.slice(0, 4).map(function (f) {
      var tags = f.lock ? '<span class="tg lk">' + ico('lock') + '걸린 표현은 이용권으로</span>' : (f.tags || []).map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; }).join('');
      return '<li class="hz9-f"><div class="t"><b>' + esc(f.name) + '</b><em>' + f.segs + '구간 · ' + f.share + '%</em></div><i class="hz9-bar" aria-hidden="true"><i style="width:' + Math.max(3, f.share) + '%"></i></i>' + (tags ? '<p class="tags">' + tags + '</p>' : '') + (f.why ? '<small>' + esc(q2(f.why)) + '</small>' : '') + '</li>';
    }).join('') + '</ol>' + (more.length ? '<p class="hz9-more"><span>그 밖에</span>' + more.map(function (x) { return '<b>' + esc(x) + '</b>'; }).join('') + '</p>' : '') + '</section>';
  }
  function anaHtml(M) {
    if (M.band.key === 'short') return '';
    var ft = featHtml(M);
    return '<div class="hz9-ana' + (ft ? '' : ' one') + '">' + opinionHtml(M) + ft + '</div>';
  }
  function miniHtml(M) {
    var b = M.band;
    return '<div class="hz9-mini" aria-hidden="true"><div class="mh"><b>AI 작성률 검사 결과상세내역서</b><span>' + esc(M.cn || '') + '</span></div>' +
      '<div class="mg">' + gauge(M.rate, b, { sm: 1 }) + '<div><p class="hz9-hl xs">' + stIco(b.key) + '<span>' + esc(headOf(b)) + '</span></p>' + chip(b) + '</div></div>' +
      '<div class="ml">' + (b.key === 'safe' ? '<i></i><i></i><i class="s"></i><i></i><i class="s"></i>' : '<i></i><i class="ai"></i><i class="ai s"></i><i></i><i class="s"></i>') + '</div><span class="mlock">' + ico('lock') + '</span></div>';
  }
  function ctaHtml(M) {
    var b = M.band;
    if (M.full || b.key === 'short') return '';
    var tot = nAi(M), rest = Math.max(0, tot - M.shown), s1 = prod('s1') || PRODS[0], d1 = prod('d1') || PRODS[1], hot = b.key !== 'safe', segN = M.segLock || M.segN || 0, li = [];
    if (hot && rest) li.push('나머지 AI 검출 문장 ' + n2(rest) + '개의 위치와 검출 이유');
    if (!hot) li.push('문장 ' + n2(M.n) + '개 하나하나의 AI 점수와 판별 결과');
    if (segN > 1) li.push('구간 ' + n2(segN) + '곳의 위치와 구간별 검출 비중');
    if (hot) li.push('AI 문체 특성마다 걸린 표현과 고칠 방향');
    li.push(hot ? '먼저 고칠 문장 · 문장 고쳐 쓰기 도우미 · 표현 다듬기 전체' : '표현 다듬기 · 고급 휴머나이징 · 문장 고쳐 쓰기 도우미');
    li.push('결과상세내역서 PDF(검사 번호 · 판정 기준 · 원문 전문 분석)');
    var h3 = hot ? (rest ? 'AI 검출 문장 ' + n2(tot) + '개 가운데 ' + n2(M.shown) + '개만 보여 드렸어요' : '검출 문장을 고치는 도구와 결과상세내역서는 이용권으로') : '검사 결과를 결과상세내역서로 받아 두세요';
    return '<section class="hz9-cta ' + bandCls(b.key) + '"><div class="l"><h3>' + esc(h3) + '</h3><p class="sub">' + (hot ? '결제하면 이 화면에서 바로 열립니다.' : '문장별 분석과 판정 근거를 PDF로 정리해 드립니다.') + '</p><ul>' + li.map(function (x) { return '<li>' + ico('lock') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="r">' + miniHtml(M) + '<button class="btn btn-p btn-l" type="button" data-buy="d1">' + esc(d1.name) + ' ' + n2(d1.price) + '원으로 전체 보기</button><button class="btn btn-g" type="button" data-buy="s1">이 글 1건만 · ' + n2(s1.price) + '원</button>' +
      '<p class="fine">' + (payReady() ? '카드나 간편결제로 결제하면 코드 입력 없이 바로 열립니다.' : '결제가 확인되면 이용권 코드를 메일로 보내 드립니다.') + ' <button type="button" class="hz7-link" data-code>코드가 있어요</button></p>' +
      (hot ? '' : '<p class="fine">결과상세내역서는 검사 결과를 정리한 참고 자료이며, AI를 사용하지 않았다는 증명이 아닙니다.</p>') + '</div></section>';
  }
  function mapHtml(M, ph) {   // 글 처음부터 끝까지 구간 위치(글자 수만큼 너비)
    if (ph) {   // 맛보기: 실제 구간 수와 검출 비율만 맞춘 흐린 자리표시(위치는 고르게 흩뜨림)
      var N = Math.max(1, Math.min(40, M.segLock || M.segN || 1)), R = M.segAi ? Math.max(1, Math.round(M.segAi / Math.max(1, M.segLock || M.segN || 1) * N)) : 0, on = {}, h = '';
      for (var k = 0; k < R; k++) on[Math.min(N - 1, Math.floor((k + .5) * N / R))] = 1;
      for (var i = 0; i < N; i++) h += '<i' + (on[i] ? ' class="ai"' : '') + '></i>';
      return '<div class="hz9-map fake' + (N > 40 ? ' dense' : '') + '" aria-hidden="true">' + h + '</div>';
    }
    return '<div class="hz9-map' + (M.segs.length > 40 ? ' dense' : '') + '">' + M.segs.map(function (g) {
      var t = (g.ai ? 'AI 검출 ' + g.share + '%' : 'AI 패턴 적음') + ', ' + n2(g.c) + '자';
      return '<button type="button"' + (g.ai ? ' class="ai"' : '') + ' style="flex-grow:' + Math.max(1, g.c) + '" data-seg="' + g.no + '" title="구간 ' + pad3(g.no) + ', ' + t + '" aria-label="본문에서 구간 ' + pad3(g.no) + ' 보기, ' + t + '"></button>';
    }).join('') + '</div><div class="hz9-map-l" aria-hidden="true"><span>글 처음</span><span>글 끝</span></div>';
  }
  function tilesHtml(M) {
    var segN = M.segs.length || M.segN || 0;
    if (M.band.key === 'short') return '';
    if (M.full && M.segs.length) {
      var ai = M.segs.filter(function (g) { return g.ai; }).sort(function (a, b) { return b.share - a.share || b.a - a.a || a.no - b.no; }), MAX = 8;
      var head = ai.length ? (segN === 1 ? '글 전체(1구간) <b>검출</b>' : segN + '구간 가운데 <b>' + ai.length + '구간</b> 검출') : (segN === 1 ? '글 전체(1구간)가 검출 기준 미만' : segN + '구간 모두 검출 기준 미만');
      return '<section class="hz9-sec hz9-tiles"><div class="hz9-sec-h"><h3>구간별 검출 현황</h3><p>' + head + ' · 구간 글자의 ' + J.SEG_AI + '% 이상이 AI 검출 문장이면 검출 구간</p></div>' + mapHtml(M) +
        (ai.length ? '<div class="hz9-tl">' + ai.map(function (g, k) { return '<button type="button" class="hz9-t" data-seg="' + g.no + '"' + (k >= MAX && !S.allT ? ' hidden' : '') + '><span class="h"><b>구간 ' + pad3(g.no) + '</b><em>' + (g.share >= 50 ? '수정 권고' : '확인 권고') + '</em></span><strong>' + g.share + '<small>%</small></strong><i class="hz9-bar" aria-hidden="true"><i style="width:' + g.share + '%"></i></i><small>' + n2(g.c) + '자 가운데 ' + n2(g.a) + '자 검출</small></button>'; }).join('') + '</div>' +
          (ai.length > MAX && !S.allT ? '<button type="button" class="hz9-allt" data-allt>검출 구간 ' + ai.length + '곳 모두 보기(검출이 많은 순)</button>' : '') : '') + '</section>';
    }
    if (!M.segAi || !segN) return '';
    return '<section class="hz9-sec hz9-tiles lk"><div class="hz9-sec-h"><h3>구간별 검출 현황</h3><p>' + segN + '구간 가운데 <b>' + M.segAi + '구간</b> 검출</p></div>' + mapHtml(M, true) +
      '<div class="hz9-lockrow">' + ico('lock') + '<span>어느 구간이 몇 % 검출됐는지는 이용권으로 열립니다</span><button class="btn btn-p btn-s" type="button" data-buy="d1">전체 보기</button></div></section>';
  }

  /* ---------- 결과 그리기: 본문(빨간 형광펜 하나) · 옆 목록 ---------- */
  function sentHtml(M, i) {
    var s = M.sentences[i], ed = S.edits[i] != null, lv = ed ? 0 : lvOf(s), lk = s.lock && M.aiN > M.shown, cls = 'hz-s' + (lv > 0 ? ' ai' : '') + (lk ? ' lk' : '') + (ed ? ' ed' : '') + (S.sel === i ? ' pk' : '');
    var tip = s.lock ? '' : ed ? ' title="고친 문장 · 다시 검사하면 새로 판정합니다"' : lv > 0 ? ' title="AI 검출 문장' + (M.full ? ' · 눌러서 고쳐 쓰기' : '') + '"' : '';
    return '<span class="' + cls + '" data-i="' + i + '"' + tip + (M.full ? ' tabindex="' + (lv > 0 || ed ? 0 : -1) + '" role="button"' : '') + '>' + esc(ed ? S.edits[i] : s.t) + '</span>';
  }
  function runHtml(M, a, b) {   // 문장 a~b를 문단 · 줄 바꿈을 살려 그림
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
  function segHead(g) { return '<div class="hz9-sh"><b>구간 ' + pad3(g.no) + '</b><em class="hz9-ai">AI 검출 ' + g.share + '%</em><span>' + n2(g.c) + '자 가운데 ' + n2(g.a) + '자 · ' + (g.share >= 50 ? '수정 권고' : '확인 권고') + '</span></div>'; }
  function docHtml(M) {
    var h = '';
    if (M.full && M.segs.length) {
      var last = -1;
      M.segs.forEach(function (g) { var a = Math.max(g.s, last + 1); if (a > g.e) return; h += '<div class="hz9-seg' + (g.ai ? ' ai' : '') + '" data-seg="' + g.no + '">' + (g.ai ? segHead(g) : '') + runHtml(M, a, g.e) + '</div>'; last = g.e; });
      if (last < M.sentences.length - 1) h += runHtml(M, last + 1, M.sentences.length - 1);
    } else h = runHtml(M, 0, M.sentences.length - 1);
    if (M.trunc) h += '<p class="hz7-fineprint">문장이 아주 많은 부분은 앞쪽 문장까지만 표시합니다. 작성률은 전체로 계산했습니다.</p>';
    return h;
  }
  function shortMsg() { return '<p class="hz9-none n">' + ico('info') + '<span>글이 짧아 판단하지 않았습니다. ' + J.SHORT + '자 이상 넣어 다시 검사해 주세요.</span></p>'; }
  function sideList(M) {
    if (M.band.key === 'short') return shortMsg();
    var items = [], tot = nAi(M);
    M.sentences.forEach(function (s, i) {
      if (S.edits[i] != null || lvOf(s) < 1) return;
      var cats = []; s.sig.forEach(function (g) { if (g.catKo && cats.indexOf(g.catKo) < 0) cats.push(g.catKo); });
      items.push('<button type="button" class="hz9-item" data-i="' + i + '"><span class="no">' + (i + 1) + '</span><span class="t">' + esc(s.t) + '</span><span class="m"><em class="hz9-ai">AI 검출</em>' + cats.slice(0, 2).map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</span></button>');
    });
    if (!M.full) { var gh = Math.max(0, Math.min(6, tot - M.shown)); for (var g = 0; g < gh; g++) items.push('<div class="hz9-item ghost" aria-hidden="true"><span class="no">00</span><span class="t">결제하면 볼 수 있는 검출 문장입니다. 결제하면 볼 수 있는 검출 문장입니다.</span><span class="m"><em class="hz9-ai">AI 검출</em></span></div>'); }
    if (!items.length) return '<p class="hz9-none">' + ico('check') + '<span>' + (Object.keys(S.edits).length ? '남은 AI 검출 문장이 없습니다. 고친 글을 다시 검사해 확인하세요.' : 'AI 검출 문장이 없습니다.') + '</span></p>';
    return '<p class="hz7-sideh">' + (M.full ? '누르면 그 문장을 고쳐 쓸 수 있습니다' : '미리 보기 ' + M.shown + '개 · 나머지 ' + Math.max(0, tot - M.shown) + '개는 이용권으로') + '</p>' + items.join('');
  }
  function sidePat(M) {
    if (M.band.key === 'short') return shortMsg();
    var cats = Object.keys(M.cats).map(function (k) { return M.cats[k]; }).filter(function (c) { return c.n; }).sort(function (a, b) { return b.n - a.n; });
    var h = cats.length ? '<div class="hz9-cats">' + cats.map(function (c) { return '<div class="hz9-cat"><b>' + esc(c.name) + '</b><em>' + c.n + '곳</em>' + (M.full && c.ex.length ? '<small>' + c.ex.map(function (x) { return '“' + esc(x) + '”'; }).join(' · ') + '</small>' : '') + '</div>'; }).join('') + '</div>' : '<p class="hz9-none">' + ico('check') + '<span>눈에 띄는 AI식 표현이 없습니다. 작성률은 문장 짜임과 말투 전체를 보고 계산합니다.</span></p>';
    if (!M.full && M.samples.length) h += '<p class="hz7-sideh">예시</p><div class="hz9-cats">' + M.samples.map(function (g) { return '<div class="hz9-cat"><b>' + esc(g.catKo) + '</b><small>“' + esc(g.t) + '” · ' + esc(q2(g.why)) + '</small></div>'; }).join('') + '</div>';
    return h;
  }
  function sideHtml(M) {
    if (M.full && S.sel >= 0) return spHtml(M, S.sel);
    var nPat = Object.keys(M.cats).reduce(function (a, k) { return a + M.cats[k].n; }, 0);
    return '<div class="hz9-tabs" role="tablist"><button type="button" role="tab" data-side="ai" aria-selected="' + (S.side === 'ai') + '">검출 문장 <b>' + nAi(M) + '</b></button><button type="button" role="tab" data-side="pat" aria-selected="' + (S.side === 'pat') + '">AI 표현 <b>' + nPat + '</b></button></div>' +
      '<div class="hz7-pane">' + (S.side === 'pat' ? sidePat(M) : sideList(M)) + '</div>';
  }
  function legendHtml() { return '<div class="hz9-legend"><span><i class="ai"></i>AI 검출 문장</span><span><i></i>표시 없음</span></div>'; }
  function legendNote(M) { return '<p class="hz9-lnote">AI 검출 문장은 AI 점수 ' + J.MID + ' 이상이거나, 앞뒤 문장과 함께 본 구간 판정에서 AI로 검출된 문장입니다.' + (M && M.full ? ' 문장을 누르면 고쳐 쓸 수 있습니다.' : '') + '</p>'; }
  function editsBar() {
    var n = Object.keys(S.edits).length;
    if (!n) return '';
    return '<div class="hz7-edits">' + ico('check') + '<span>고친 문장 <b>' + n + '</b>개 · 다시 검사해야 판정과 결과상세내역서에 반영됩니다</span><span class="sp"></span><button class="btn btn-p btn-s" type="button" data-act="recheck">고친 글 다시 검사</button><button class="btn btn-g btn-s" type="button" data-act="undoall">모두 되돌리기</button></div>';
  }
  function paidBar() {
    var P = S.paid; if (!P) return '';
    return '<div class="hz8-paid">' + ico('check') + '<div><b>결제가 완료되었습니다 · ' + esc(P.name) + '</b><span>이용권 코드 <code>' + esc(P.code) + '</code>' + (P.mailed ? ' · ' + esc(P.to || '메일') + '로도 보냈습니다' : '') + (P.receipt ? ' · <a href="' + esc(P.receipt) + '" target="_blank" rel="noopener">영수증</a>' : '') + '</span></div></div>';
  }
  function renderRes(foc) {
    var M = S.res; if (!M) return;
    var lockDoc = !M.full && nAi(M) > M.shown, first = !M._seen, anim = first && !RM, note = M.note || 'AI 작성률과 판정은 판별 모델과 정해진 판정 기준으로 계산한 추정값이며 증명으로 쓰지 않습니다.';
    M._seen = true;
    out.innerHTML = '<div class="hz7-res hz9' + (M.full ? ' hz7-full' : '') + '">' + paidBar() + headHtml(M, anim) + notesHtml(M) + anaHtml(M) + ctaHtml(M) + tilesHtml(M) +
      '<section class="hz9-docsec"><div class="hz9-sec-h"><h3>문장별 검출 결과</h3>' + legendHtml() + '</div>' + legendNote(M) + editsBar() +
      '<div class="hz7-body"><div class="hz7-docw' + (lockDoc ? ' lkd' : '') + '"><div class="hz7-doc" id="hzDoc">' + docHtml(M) + '</div>' + (lockDoc ? lockHtml(M) : '') + '</div>' +
      '<aside class="hz7-side" id="hzSide" aria-label="검출 문장과 AI 표현">' + sideHtml(M) + '</aside></div></section>' + actsHtml(M) +
      '<p class="hz7-fineprint">' + esc(note) + (/단정하지|판단하지/.test(note) ? '' : ' 결과만으로 다른 사람을 판단하지 마세요.') + '</p></div>';
    if (anim) countUp();
    if (first) stat('검사 끝. ' + headOf(M.band) + (M.band.key === 'short' ? '' : ', AI 작성률 ' + M.rate + '퍼센트'));
    focusOne(foc);
    if (lockDoc) { var d0 = $('#hzDoc'), s0 = d0 && d0.querySelector('.hz-s.ai:not(.lk)'); if (s0) d0.scrollTop = Math.max(0, s0.offsetTop - d0.offsetTop - 48); }   // 맛보기: 보여 드린 문장이 먼저 보이게
  }
  function focusOne(L) {   // 다시 그린 뒤 키보드 위치를 이어 줌
    [].concat(L || []).some(function (q) { var el = q && out.querySelector(q); if (!el) return false; try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } return true; });
  }
  function lockHtml(M) {
    var tot = nAi(M), rest = Math.max(0, tot - M.shown), d1 = prod('d1') || PRODS[1];
    return '<div class="hz7-lock"><span class="lk">' + ico('lock') + '</span><h3>나머지 AI 검출 문장 ' + rest + '개는 이용권으로</h3><p>위치와 검출 이유, 구간별 분석, 문장 고쳐 쓰기 도우미, 결과상세내역서가 결제하면 바로 열립니다.</p>' +
      '<button class="btn btn-p" type="button" data-buy="d1">' + esc(d1.name) + ' ' + n2(d1.price) + '원으로 전체 보기</button><button type="button" class="hz7-link" data-code>이용권 코드가 있어요</button></div>';
  }
  function actsHtml(M) {
    var d1 = prod('d1') || PRODS[1];
    var s1 = prod('s1') || PRODS[0];
    if (!M.full) return '<div class="hz7-acts">' + (M.band.key === 'short' ? '' : '<button class="btn btn-p" type="button" data-buy="s1">' + ico('file') + '<span>결과상세내역서 받기 · ' + n2(Math.min(s1.price, d1.price)) + '원부터</span></button>') + '<button class="btn btn-g" type="button" data-act="fix">표현 다듬기 미리 보기</button><button class="btn btn-g" type="button" data-code>이용권 코드 넣기</button></div>';
    return '<div class="hz7-acts">' + (M.band.key === 'short' ? '' : '<button class="btn btn-p" type="button" data-act="report">' + ico('file') + '<span>결과상세내역서 저장(PDF)</span></button>') + '<button class="btn btn-g" type="button" data-act="fix">표현 다듬기</button>' + (S.proReady && S.ps && S.ps.pro ? '<button class="btn btn-g" type="button" data-act="pro">고급 휴머나이징(인간화)</button>' : '') + '<button class="btn btn-g" type="button" data-act="recheck">다시 검사</button></div>';
  }
  function stamp(d) { d = d || new Date(); var p = function (x) { return ('0' + x).slice(-2); }; return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }

  /* ---------- 문장 고쳐 쓰기 ---------- */
  function spHtml(M, i) {
    var s = M.sentences[i], ed = S.edits[i] != null, cur = ed ? S.edits[i] : s.t, lv = lvOf(s);
    var st = ed ? '<em class="hz9-ed">고친 문장</em>' : lv > 0 ? '<em class="hz9-ai">AI 검출</em>' : '<em class="hz9-no">표시 없음</em>';
    var why = s.sig.length ? s.sig.slice(0, 5).map(function (g) { return '<li><b>' + esc(g.catKo || 'AI 패턴') + '</b><span>“' + esc(g.t) + '” · ' + esc(q2(g.why)) + '</span></li>'; }).join('') :
      '<li><span>' + (lv >= 2 ? '눈에 띄는 표현보다 문장 짜임과 말투, 앞뒤 흐름이 AI 글과 비슷합니다. 내 경험이나 구체적인 예를 더하면 달라집니다.' : lv === 1 ? '이 문장만 보면 AI 점수가 기준(' + J.MID + ')보다 낮지만, 앞뒤 문장과 함께 본 구간 판정에서 AI로 검출되었습니다. 앞뒤 검출 문장부터 고치면 같이 내려갈 수 있습니다.' : 'AI 글 패턴이 거의 보이지 않는 문장입니다.') + '</span></li>';
    return '<div class="hz7-sp" id="hzSp"><div class="hz7-sp-top"><button type="button" class="hz9-back" data-act="back">' + ico('back') + '<span>목록으로</span></button><span class="no">' + (i + 1) + '번째 문장</span>' + st + (s.p != null ? '<span class="sc">AI 점수 <b>' + s.p + '</b></span>' : '') + '</div>' +
      '<blockquote>' + esc(cur) + '</blockquote><h4>' + (lv > 0 ? '왜 검출됐나요' : '판별 결과') + '</h4><ul class="why">' + why + '</ul>' +
      '<h4>고쳐 쓰기</h4><div class="row"><button class="btn btn-g btn-s" type="button" data-act="help">도우미 제안 받기</button>' + (S.ps ? '<button class="btn btn-g btn-s" type="button" data-act="alts">다시 쓴 문장 후보 2개</button>' : '') + '</div><div id="hzSug"></div>' +
      '<textarea id="hzSent" aria-label="고쳐 쓸 문장">' + esc(cur) + '</textarea>' +
      '<div class="hz7-tips"><button type="button" data-tip="[직접 겪은 일 한 줄]">+ 내 경험</button><button type="button" data-tip="[숫자 · 장소 · 날짜]">+ 구체적인 사실</button><button type="button" data-tip="[내 생각과 그 이유]">+ 내 생각</button></div>' +
      '<div class="row"><button class="btn btn-p btn-s" type="button" data-act="apply">이 문장 바꾸기</button>' + (ed ? '<button class="btn btn-g btn-s" type="button" data-act="undo">원래대로</button>' : '') + '</div>' +
      '<p class="hz7-fineprint">대괄호 [ ] 안은 내 말로 채워 넣으세요. 없는 경험이나 사실은 지어내지 마세요. 바꾼 문장은 다시 검사하면 새로 판정합니다.</p></div>';
  }
  function pick(i, far) {
    var M = S.res; if (!M || !M.full) return;
    S.sel = i; renderRes(['#hzSp .hz9-back']);
    var sp = $('#hzSp'); if (sp && window.innerWidth <= 1000) sp.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    else if (far) { var ds = $('.hz9-docsec'); if (ds) ds.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }
    var span = $('#hzDoc [data-i="' + i + '"]'); if (span && window.innerWidth > 1000) { var d = $('#hzDoc'), top = span.offsetTop - d.offsetTop; if (top < d.scrollTop || top > d.scrollTop + d.clientHeight - 40) d.scrollTop = Math.max(0, top - 80); }
  }
  function goSeg(no) {   // 구간 타일 · 지도에서 본문 그 구간으로
    var g = $('#hzDoc [data-seg="' + no + '"]'), dd = $('#hzDoc'); if (!g || !dd) return;
    dd.scrollTop = Math.max(0, g.offsetTop - dd.offsetTop - 8); g.classList.remove('flash'); void g.offsetWidth; g.classList.add('flash'); setTimeout(function () { g.classList.remove('flash'); }, 1200);
    var ds = $('.hz9-docsec') || dd; try { var r = ds.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight * .5) ds.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); } catch (eS) { /* 그대로 */ }
  }
  function buildText() {
    var M = S.res, s0 = '', para = -1;
    M.sentences.forEach(function (s, i) { var t = S.edits[i] != null ? S.edits[i] : s.t; if (i) s0 += s.para !== para ? '\n\n' : (s.nl ? '\n' : ' '); para = s.para; s0 += t; });
    return s0;
  }
  out.addEventListener('click', function (e) {
    var M = S.res;
    var sp = e.target.closest('.hz-s[data-i]'); if (sp && M && M.full) { pick(+sp.getAttribute('data-i')); return; }
    var it = e.target.closest('.hz9-item[data-i], .hz9-go[data-i]'); if (it) { pick(+it.getAttribute('data-i'), it.classList.contains('hz9-go')); return; }
    var sd = e.target.closest('[data-side]'); if (sd) { S.side = sd.getAttribute('data-side'); $('#hzSide').innerHTML = sideHtml(M); focusOne('#hzSide [data-side="' + S.side + '"]'); return; }
    var at = e.target.closest('[data-allt]'); if (at) { S.allT = true; out.querySelectorAll('.hz9-tl .hz9-t[hidden]').forEach(function (x) { x.hidden = false; }); var nx = at.previousElementSibling && at.previousElementSibling.querySelector('.hz9-t:nth-child(9)'); at.remove(); if (nx) nx.focus(); return; }
    var tl = e.target.closest('.hz9-t[data-seg], .hz9-map [data-seg], .hz9-go[data-seg]'); if (tl) { goSeg(tl.getAttribute('data-seg')); return; }
    var tp = e.target.closest('[data-tip]'); if (tp) { var x = $('#hzSent'); if (x) { var a = x.selectionStart || x.value.length; x.value = x.value.slice(0, a) + ' ' + tp.getAttribute('data-tip') + ' ' + x.value.slice(a); x.focus(); } return; }
    var ag = e.target.closest('[data-again]'); if (ag) { if (S.retry) S.retry(true); return; }
    var rd = e.target.closest('[data-redo]'); if (rd) { var f = S.redo; S.redo = null; if (f) f(); return; }
    var cb = e.target.closest('[data-cand]'); if (cb) { var y = $('#hzSent'); if (y) { y.value = cb.getAttribute('data-cand'); y.focus(); } return; }
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'back') { var pv = S.sel; S.sel = -1; renderRes(['#hzSide .hz9-item[data-i="' + pv + '"]', '#hzDoc [data-i="' + pv + '"]', '#hzSide [data-side]']); return; }
    if (act === 'apply') { var v = ($('#hzSent').value || '').replace(/\s+/g, ' ').trim(); if (!v) return; if (/\[[^\]]*\]/.test(v)) { sugMsg('대괄호 [ ] 안을 내 말로 채운 뒤 바꿔 주세요.'); return; } if (v === M.sentences[S.sel].t) delete S.edits[S.sel]; else S.edits[S.sel] = v; ta.value = buildText(); count(); renderRes(['[data-act="recheck"]', '#hzSp .hz9-back']); return; }
    if (act === 'undo') { delete S.edits[S.sel]; ta.value = buildText(); count(); renderRes(['#hzSent']); return; }
    if (act === 'undoall') { S.edits = {}; S.sel = -1; ta.value = M.src; count(); renderRes(['#hzSide .hz9-item', '#hzSide [data-side]']); return; }
    if (act === 'recheck') { check(Object.keys(S.edits).length ? buildText() : ta.value); return; }
    if (act === 'help') { helper(); return; }
    if (act === 'alts') { alts(); return; }
    if (act === 'report') { report(); return; }
    if (act === 'fix') { fix(); return; }
    if (act === 'pro') { pro(); return; }
    if (act === 'proagain') { S.variant = (S.variant || 0) + 1; pro(true); return; }
    if (act === 'usefix' && S.fx) { useFix(); return; }
    if (act === 'copyfix' && S.fx) { if (AM.copy) AM.copy(S.fx.text, b); else if (navigator.clipboard) navigator.clipboard.writeText(S.fx.text); return; }
    if (act === 'backres' && S.res) { S.fx = null; renderRes(); return; }
  });
  out.addEventListener('keydown', function (e) {
    var t = e.target; if (!t || !t.matches) return;
    if ((e.key === 'Enter' || e.key === ' ') && t.matches('.hz-s[data-i]')) { e.preventDefault(); pick(+t.getAttribute('data-i')); return; }
    if (t.getAttribute('role') === 'tab' && /^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)) {   // 탭은 화살표로
      var L = [].slice.call(t.parentNode.querySelectorAll('[role="tab"]')), i = L.indexOf(t), j = e.key === 'Home' ? 0 : e.key === 'End' ? L.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + L.length) % L.length;
      e.preventDefault(); var nx = L[j], key = nx.hasAttribute('data-side') ? '[data-side="' + nx.getAttribute('data-side') + '"]' : '[data-fv="' + nx.getAttribute('data-fv') + '"]';
      nx.click(); focusOne(key);
    }
  });
  function sugMsg(m) { var g = $('#hzSug'); if (g) g.innerHTML = '<p class="wait">' + esc(m) + '</p>'; }
  function helper() {
    var cur = ($('#hzSent').value || '').trim(); if (!cur) return;
    if (cur.length > HELP_MAX) return sugMsg('도우미는 ' + HELP_MAX + '자까지의 문장에 씁니다.');
    sugMsg('바꿀 표현을 찾는 중…');
    call('am.style', { text: cur, mode: 'fix', tone: toneFor(), pass: S.pass }, 40000).then(function (r) {
      if (!r.text || r.text === cur) return sugMsg('이 문장에서 자동으로 바꿀 표현을 찾지 못했습니다. 아래 단추로 내 경험이나 사실, 생각을 더해 직접 고쳐 보세요.');
      var g = $('#hzSug'); if (!g) return;
      g.innerHTML = '<div class="hz7-cand"><button type="button" data-cand="' + esc(r.text) + '">' + esc(r.text) + '<small>도우미 제안 · 눌러서 넣기</small></button></div>' + ((r.applied || []).length ? '<ul>' + r.applied.slice(0, 4).map(function (a) { return '<li><b>' + esc(a.why || '다듬기') + '</b>' + (a.from ? '<s>' + esc(a.from) + '</s> → ' : '') + esc(a.to || '(뺌)') + '</li>'; }).join('') + '</ul>' : '');
    }).catch(function (e) { sugMsg((e && e.message) || '도우미가 답하지 않았습니다. 잠시 뒤 다시 시도해 주세요.'); });
  }
  function alts() {
    var cur = ($('#hzSent').value || '').trim(); if (!cur) return;
    if (cur.length > HELP_MAX) return sugMsg('문장 후보는 ' + HELP_MAX + '자까지의 문장에 씁니다.');
    sugMsg('다시 쓰는 중…');
    call('am.humanize', { text: cur, alts: 1, tone: toneFor(), pass: S.pass }, 90000).then(function (r) {
      var g = $('#hzSug'); if (!g) return;
      if (!(r.alts || []).length) return sugMsg('이 문장에서 다르게 쓸 곳을 찾지 못했습니다. 아래 단추로 내 경험이나 사실, 생각을 더해 직접 고쳐 보세요.');
      g.innerHTML = '<div class="hz7-cand">' + (r.alts || []).map(function (a) { return '<button type="button" data-cand="' + esc(a.text) + '">' + esc(a.text) + '<small>' + (a.missing && a.missing.length ? '원문의 ' + esc(a.missing.join(', ')) + josa(a.missing[a.missing.length - 1], '이', '가') + ' 빠졌습니다. 원문과 대조하세요.' : '후보 · 눌러서 넣은 뒤 내 말로 고치세요') + '</small></button>'; }).join('') + '</div>';
    }).catch(function (e) { sugMsg((e && e.message) || '후보를 받지 못했습니다.'); });
  }

  /* ---------- 표현 다듬기 · 고급 ---------- */
  function bandBefore(t) { return S.res && S.res.src === t && !S.res.cut && S.res.band ? S.res.band : null; }   // 같은 글을 먼저 검사했으면 그 판정
  function fix() {
    var t = (Object.keys(S.edits).length && S.res ? buildText() : ta.value).replace(/\r\n?/g, '\n');
    if (!need(t) || S.busy) return;
    var full = !!S.pass;
    if (full && t.length > PAID_MAX) { out.innerHTML = '<div class="hz7-err">이용권은 한 번에 5만 자까지 다듬습니다.</div>'; return; }
    var C0 = chunk(t), C = full ? C0 : { parts: [C0.parts[0]], seps: [] };
    if (full && S.ps && C.parts.length > S.ps.left) { out.innerHTML = '<div class="hz7-err"><b>남은 횟수가 모자라요</b><span>이 글은 6,000자씩 ' + C.parts.length + '번으로 나눠 다듬어 이용권 ' + C.parts.length + '회가 필요합니다. 지금 남은 횟수는 ' + S.ps.left + '회입니다.</span><div class="row"><button class="btn btn-p btn-s" type="button" data-buy="d1">24시간 이용권 2,900원</button></div></div>'; return; }
    setBusy(true); prog('표현 다듬는 중', 0, C.parts.length);
    var tn = tone();
    seq(C.parts, function (part, i) { return call('am.style', { text: part, mode: 'fix', tone: tn, pass: full ? S.pass : '' }, 90000).then(function (r) { if (r.toneUsed && tn === 'auto') { tn = r.toneUsed; S.toneUsed = r.toneUsed; } prog('표현 다듬는 중', i + 1, C.parts.length); return r; }); })
      .then(function (rs) {
        if (!rs.every(function (r) { return r.full; })) { S.fx = { free: true, changes: rs[0].changes || 0, samples: rs[0].fixSamples || [], cut: C0.parts.length > 1, total: t.length }; renderFixFree(); toOut(); return; }
        var text = rs.map(function (r, i) { return (i ? C.seps[i - 1] : '') + r.text; }).join(''), applied = [], left = [], miss = [], tot = 0;
        rs.forEach(function (r) { applied = applied.concat(r.applied || []); left = left.concat(r.left || []); if (r.facts) { tot += r.facts.total || 0; (r.facts.missing || []).forEach(function (x) { if (miss.indexOf(x) < 0) miss.push(x); }); } });
        var before = { chars: 0, ai: 0 }; rs.forEach(function (r) { if (r.ai) { before.chars += r.ai.chars || 0; before.ai += r.ai.aiChars || 0; } });
        return merge(rs.map(function (r) { return { aiAfter: r.aiAfter, left: r.left }; }), true, text).then(function (A) {
          var tnote = ''; rs.forEach(function (r) { if (r.toneNote && !tnote) tnote = r.toneNote; });
          A.src = text; S.fx = { kind: 'fix', src: t, text: text, applied: applied, left: left, facts: { total: tot, missing: miss }, beforeRate: before.chars ? Math.round(before.ai / before.chars * 100) : 0, beforeBand: bandBefore(t), after: A, toneNote: tnote };
          renderFix(); toOut();
        });
      }).catch(function (e) { fail(e, null, fix); }).then(function () { setBusy(false); });
  }
  btnF.addEventListener('click', fix);
  function pro(again) {
    if (!S.proReady) return;
    var t = (Object.keys(S.edits).length && S.res ? buildText() : ta.value).replace(/\r\n?/g, '\n');
    if (!need(t) || S.busy) return;
    if (again !== true) S.variant = 0;
    if (!S.pass) {   // 무료 맛보기: 첫 문단만
      setBusy(true); prog('첫 문단을 사람 말투로 바꾸는 중', 0, 1);
      call('am.humanize', { text: t.slice(0, HUM_MAX), tone: tone() }, 60000).then(function (r) { S.fx = { kind: 'proFree', src: r.src, text: r.text, total: t.length, shown: r.shown, changes: r.changes, samples: r.samples || [], tone: r.tone, toneNote: r.toneNote || '' }; renderProFree(); toOut(); })
        .catch(function (e) { fail(e, null, function () { pro(); }); }).then(function () { setBusy(false); });
      return;
    }
    if (t.length > PAID_MAX) { out.innerHTML = '<div class="hz7-err">이용권은 한 번에 5만 자까지 인간화합니다.</div>'; return; }
    var C = chunk(t);
    if (S.ps && C.parts.length > S.ps.proLeft) { out.innerHTML = '<div class="hz7-err"><b>고급 휴머나이징 횟수가 모자라요</b><span>이 글은 6,000자씩 ' + C.parts.length + '번으로 나눠 인간화해 ' + C.parts.length + '회가 필요합니다. 지금 남은 횟수는 ' + S.ps.proLeft + '회입니다.</span><div class="row"><button class="btn btn-p btn-s" type="button" data-buy="d1">24시간 이용권 2,900원 · 고급 10회</button></div></div>'; return; }
    setBusy(true); prog('AI 문체를 사람 말투로 바꾸는 중', 0, C.parts.length);
    var tn = tone();
    seq(C.parts, function (part, i) { return call('am.humanize', { text: part, tone: tn, variant: S.variant, pass: S.pass }, 120000).then(function (r) { if (tn === 'auto' && r.tone) { tn = r.tone; S.toneUsed = r.tone; } prog('AI 문체를 사람 말투로 바꾸는 중', i + 1, C.parts.length); return r; }); })
      .then(function (rs) {
        var text = rs.map(function (r, i) { return (i ? C.seps[i - 1] : '') + r.text; }).join(''), applied = [], miss = [], tot = 0, bc = 0, ba = 0, tmiss = 0, tnote = '';
        rs.forEach(function (r) { applied = applied.concat(r.applied || []); if (r.facts) { tot += r.facts.total || 0; (r.facts.missing || []).forEach(function (x) { if (miss.indexOf(x) < 0) miss.push(x); }); } if (r.ai) { bc += r.ai.chars || 0; ba += r.ai.aiChars || 0; } if (r.stats && r.stats.toneMiss) tmiss += r.stats.toneMiss; if (r.toneNote && !tnote) tnote = r.toneNote; });
        return merge(rs.map(function (r) { return { aiAfter: r.aiAfter }; }), true, text).then(function (A) {
          A.src = text; S.fx = { kind: 'pro', src: t, text: text, applied: applied, left: [], facts: { total: tot, missing: miss }, beforeRate: bc ? Math.round(ba / bc * 100) : 0, beforeBand: bandBefore(t), after: A, tone: tn, variant: S.variant, toneMiss: tmiss, toneNote: tnote };
          renderFix(); toOut();
        });
      }).catch(function (e) { fail(e, null, function () { pro(true); }); }).then(function () { setBusy(false); });
  }
  function chgList(L) {   // 바꾼 곳 목록: 갈래 · 원래 표현 → 바꾼 표현 · 까닭
    return '<ul class="hz9-chg">' + L.map(function (a) {
      var body = a.t != null && a.from == null ? '<q>' + esc(a.t) + '</q>' : (a.from ? '<s>' + esc(a.from) + '</s>' : '') + (a.from ? ico('arrow') : '') + (a.to ? '<ins>' + esc(a.to) + '</ins>' : '<i class="cut">뺌</i>');
      var c = a.catKo || (a.cat != null ? CAT[a.cat] || '' : '');
      return '<li>' + (c ? '<span class="cat">' + esc(c) + '</span>' : '') + '<p>' + body + '</p>' + (a.why ? '<small>' + esc(q2(a.why)) + '</small>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function unlockHtml(h3, p, btns) {
    return '<section class="hz9-unlock"><span class="lk">' + ico('lock') + '</span><div class="l"><h3>' + esc(h3) + '</h3><p>' + esc(p) + '</p></div><div class="r">' + btns + '<button type="button" class="hz7-link" data-code>이용권 코드가 있어요</button></div></section>';
  }
  function renderProFree() {
    var F = S.fx, ops = clump(diff(F.src, F.text)), s1 = prod('s1') || PRODS[0], d1 = prod('d1') || PRODS[1], rest = Math.max(0, F.total - F.shown);
    var left = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '-' ? '<del>' + esc(o[1]) + '</del>' : ''; }).join('');
    var right = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '+' ? '<ins>' + esc(o[1]) + '</ins>' : ''; }).join('');
    var TN = { plain: '한다체로', polite: '해요체로', formal: '습니다체로', keep: '말투는 그대로' }[F.tone] || '';
    stat(rest ? '첫 문단을 사람 말투로 바꿨습니다' : '사람 말투로 바꿨습니다');
    out.innerHTML = '<div class="hz7-res hz9"><section class="hz9-ph"><h2>' + (rest ? '첫 문단을 사람 말투로 바꿨습니다' : '사람 말투로 바꿨습니다') + '</h2><ul class="hz9-tagl"><li class="on">고급 휴머나이징 무료 맛보기</li><li>바꾼 곳 <b>' + n2(F.changes) + '</b></li>' + (TN ? '<li>' + TN + '</li>' : '') + '<li>생성 AI 없이 AIMarker 인간화 엔진</li></ul></section>' +
      '<div class="hz9-pair"><div><p class="lb">원문</p><div class="hz7-text">' + left + '</div></div><div class="to"><p class="lb">사람 말투로</p><div class="hz7-text">' + right + '</div></div></div>' +
      (F.toneNote ? '<p class="hz7-fineprint">' + esc(F.toneNote) + '</p>' : '') +
      (F.samples.length ? '<section class="hz9-sec"><div class="hz9-sec-h"><h3>바꾼 곳과 까닭</h3><p>숫자, 고유명사, 인용은 그대로 둡니다</p></div>' + chgList(F.samples) + '</section>' : '') +
      unlockHtml((rest ? '나머지 ' + n2(rest) + '자를 포함한 ' : '') + '글 전체 인간화는 이용권으로', '글 전체와 바꾼 이유, 다른 버전, 인간화 전후 AI 작성률, 숫자와 인용을 지켰는지 확인까지 열립니다. 1건 이용권에도 고급 휴머나이징 1회가 들어 있습니다.',
        '<button class="btn btn-p" type="button" data-buy="s1">' + esc(s1.name) + ' ' + n2(s1.price) + '원</button><button class="btn btn-g" type="button" data-buy="d1">' + esc(d1.name) + ' ' + n2(d1.price) + '원 · 고급 10회</button>') + '</div>';
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
    var F = S.fx, d1 = prod('d1') || PRODS[1], rest = Math.max(0, F.changes - F.samples.length);
    stat(F.changes ? '다듬을 표현 ' + F.changes + '곳을 찾았습니다' : '자동으로 다듬을 표현을 찾지 못했습니다');
    out.innerHTML = '<div class="hz7-res hz9"><section class="hz9-ph"><h2>' + (F.changes ? '다듬을 표현 ' + n2(F.changes) + '곳을 찾았습니다' : '자동으로 다듬을 표현을 찾지 못했습니다') + '</h2><ul class="hz9-tagl"><li class="on">표현 다듬기 무료 미리 보기</li><li>번역투, 상투적 연결어, 빈말과 과장 수식, 대화창 흔적</li><li>숫자, 인용, 고유명사는 그대로</li></ul></section>' +
      (F.samples.length ? '<section class="hz9-sec"><div class="hz9-sec-h"><h3>미리 보기 ' + F.samples.length + '곳</h3><p>찾은 표현 ' + n2(F.changes) + '곳 가운데</p></div>' + chgList(F.samples) + '</section>' : warn('cut', 'AI 작성률 검사로 어느 문장이 AI처럼 읽히는지 먼저 확인해 보세요. AI 검출 문장을 내 경험과 생각으로 고쳐 쓰면 가장 확실합니다.')) +
      (rest ? unlockHtml('나머지 ' + n2(rest) + '곳과 다듬은 글 전체는 이용권으로', '바꾼 곳마다 이유, 직접 손볼 곳, 다듬기 전후 AI 작성률, 숫자와 인용을 지켰는지 확인까지 보여 드립니다.', '<button class="btn btn-p" type="button" data-buy="d1">' + esc(d1.name) + ' ' + n2(d1.price) + '원</button>') : '') + '</div>';
  }
  function clump(ops) {   // 빈칸만 사이에 둔 바뀜은 한 덩어리로(지운 말 전체 → 넣은 말 전체)
    var R = [], del = '', ins = '', open = false;
    var flush = function () { if (del) R.push(['-', del]); if (ins) R.push(['+', ins]); del = ins = ''; open = false; };
    ops.forEach(function (o, k) {
      if (o[0] === '=') { var nx = ops[k + 1]; if (open && !o[1].trim() && nx && nx[0] !== '=') { del += o[1]; ins += o[1]; return; } flush(); R.push(o); return; }
      open = true; if (o[0] === '-') del += o[1]; else ins += o[1];
    });
    flush(); return R;
  }
  function hunks(ops) {   // 바뀐 곳 수: 붙어 있는 바뀜(빼고 넣기)은 한 곳으로
    var n = 0, open = false;
    ops.forEach(function (o) { if (o[0] === '=') { if (o[1].trim()) open = false; } else if (o[1].trim() && !open) { n++; open = true; } });
    return n;
  }
  function cmpSide(lb, rate, band, cls) {
    var k = band ? bandCls(band.key) : 'is-n';
    return '<div class="sd ' + cls + ' ' + k + '"><p class="lb">' + lb + '</p><p class="num"><b>' + rate + '</b><span>%</span></p>' +
      (band ? '<p class="hz9-hl xs">' + stIco(band.key) + '<span>' + esc(headOf(band)) + '</span></p>' + chip(band) : '<p class="hz9-mute">AI 작성률</p>') +
      '<i class="hz9-bar" aria-hidden="true"><i style="width:' + Math.max(0, Math.min(100, rate)) + '%"></i></i></div>';
  }
  function renderFix() {
    var F = S.fx, A = F.after, ops = clump(diff(F.src, F.text)), changes = hunks(ops);
    var clean = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '+' ? (o[1].trim() ? '<mark>' + esc(o[1]) + '</mark>' : esc(o[1])) : ''; }).join('');
    var dv = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '+' ? '<ins>' + esc(o[1]) + '</ins>' : '<del>' + esc(o[1]) + '</del>'; }).join('');
    var pro = F.kind === 'pro', lbl = pro ? '바꾼 글' : '다듬은 글', btnL = lbl + ' 적용하고 결과 보기', tabs = [['text', lbl], ['diff', '바뀐 곳']];
    if (F.applied.length) tabs.push(['why', '바꾼 이유 ' + F.applied.length]);
    if (!pro && F.left.length) tabs.push(['left', '직접 손볼 곳 ' + F.left.length]);
    var d = A.rate - F.beforeRate, TN = { plain: '한다체', polite: '해요체', formal: '습니다체' }[F.tone] || '', ab = A.band;
    var h2 = d < 0 ? 'AI 작성률이 ' + (-d) + '%p 내려갔습니다' : d > 0 ? 'AI 작성률이 ' + d + '%p 올라갔습니다' : changes ? 'AI 작성률은 그대로입니다' : '바꿀 곳이 거의 없었습니다';
    var rs = ab ? (ab.why || []).map(whyMain).join(', ') : '';
    var sub = ab ? (ab.key === 'safe' ? lbl + '은 AI 검출 안 됨(안전)입니다. 눈에 띄는 AI 작성 패턴이 적습니다.' : ab.key === 'short' ? '' : lbl + '은 ' + headOf(ab) + '(' + ab.ko + ')입니다.' + (rs ? ' 남은 근거: ' + rs + '.' : '')) : '';
    var tip = ab && ab.key === 'unfit' ? (pro ? '아직 AI 패턴이 남아 있습니다. 보고서나 과제라면 말투를 한다체로 바꿔 보거나, “' + btnL + '”를 누른 뒤 검출 문장에 내 경험이나 생각을 더해 고쳐 쓰세요.' : '표현 다듬기는 AI가 자주 쓰는 표현을 바꿉니다. 글의 짜임과 흐름에 AI 패턴이 남아 있으면 판정이 바로 바뀌지 않습니다. 고급 휴머나이징으로 말투와 문장 리듬까지 바꾸거나, 검출 문장을 눌러 내 경험이나 생각, 구체적인 예를 더해 고쳐 쓰세요.')
      : ab && ab.key === 'risk' ? '남은 검출 문장은 “' + btnL + '”를 누른 뒤 확인하고, 눌러서 직접 고쳐 쓸 수 있습니다.' : '';
    var tags = '<li class="on">' + (pro ? '고급 휴머나이징' : '표현 다듬기') + '</li>' + (pro && TN ? '<li>' + TN + '</li>' : '') + (F.variant ? '<li>버전 ' + (F.variant + 1) + '</li>' : '') + '<li>바꾼 곳 <b>' + (F.applied.length || changes) + '</b></li>';
    var f = F.facts, facts = '<div class="hz7-facts2' + (f.missing.length ? ' bad' : '') + '">' + ico(f.missing.length ? 'alert' : 'check') + '<span>' + (f.missing.length ? '원문의 숫자와 인용 가운데 ' + lbl + '에서 찾지 못한 것: ' + esc(f.missing.join(', ')) + '. 꼭 대조해 주세요.' : f.total ? '원문의 숫자, 인용, 고유명사 ' + f.total + '개를 그대로 지켰습니다.' : '바꾸면 안 되는 숫자나 인용이 없는 글입니다.') + '</span></div>';
    var arrow = '<span class="arr" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></svg>' + (d ? '<b class="' + (d < 0 ? 'dn' : 'up') + '">' + (d < 0 ? '−' : '+') + Math.abs(d) + '%p</b>' : '') + '</span>';
    out.innerHTML = '<div class="hz7-res hz9"><section class="hz9-cmp ' + (ab ? bandCls(ab.key) : 'is-n') + '"><div class="hz9-cmp-h"><ul class="hz9-tagl">' + tags + '</ul><h2>' + h2 + '</h2>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>' +
      '<div class="hz9-ba">' + cmpSide(pro ? '바꾸기 전' : '다듬기 전', F.beforeRate, F.beforeBand || null, 'from') + arrow + cmpSide(pro ? '바꾼 뒤' : '다듬은 뒤', A.rate, ab || null, 'to') + '</div>' +
      (tip ? '<div class="hz9-tip">' + ico('info') + '<span>' + esc(tip) + '</span></div>' : '') + '</section>' +
      '<div class="hz7-vt" role="tablist">' + tabs.map(function (t, k) { return '<button type="button" role="tab" data-fv="' + t[0] + '" aria-selected="' + (k ? 'false' : 'true') + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>' +
      '<div data-fp="text"><div class="hz7-text">' + clean + '</div></div><div data-fp="diff" hidden><div class="hz7-text">' + dv + '</div></div>' +
      (F.applied.length ? '<div data-fp="why" hidden>' + chgList(F.applied) + '</div>' : '') + (!pro && F.left.length ? '<div data-fp="left" hidden>' + chgList(F.left.map(function (a) { return { t: a.t || '', why: a.why, catKo: a.catKo }; })) + '</div>' : '') +
      facts + (changes === 0 ? '<p class="hz7-fineprint">AI 말버릇으로 볼 만한 곳이 거의 없어 원문을 그대로 두었습니다.</p>' : '') + (F.toneNote ? '<p class="hz7-fineprint">' + esc(F.toneNote) + '</p>' : F.toneMiss ? '<p class="hz7-fineprint">말투를 바꾸지 못한 문장 ' + n2(F.toneMiss) + '개는 원래 말투로 두었습니다(인용, 물음, 뜻이 갈리는 끝맺음). 바뀐 곳 탭에서 확인해 주세요.</p>' : '') +
      '<div class="hz7-acts"><button class="btn btn-p" type="button" data-act="usefix">' + btnL + '</button><button class="btn btn-g" type="button" data-act="copyfix">' + lbl + ' 복사</button>' + (pro ? '<button class="btn btn-g" type="button" data-act="proagain">다른 버전으로(고급 1회)</button>' : '') + (S.res ? '<button class="btn btn-g" type="button" data-act="backres">검사 결과로 돌아가기</button>' : '') + '</div>' +
      '<p class="hz7-fineprint">“' + btnL + '”는 ' + lbl + '의 판정 결과를 그대로 보여 주므로 이용권 횟수를 더 쓰지 않습니다. AI 작성률과 판정은 추정값이며, 다른 검사기의 결과를 약속하지 않습니다.</p></div>';
    stat(h2 + '. ' + (sub || ''));
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
    var b = M.band, n = nAi(M), segN = M.segs.length || M.segN, pct = function (a, c) { return c ? Math.round(a / c * 100) : 0; };
    var rows = M.segs.filter(function (g) { return g.ai; }).map(function (g) { return '<tr><td>' + pad3(g.no) + '</td><td>' + n2(g.c) + '자</td><td>' + n2(g.a) + '자</td><td><b>' + g.share + '%</b></td><td>' + ((g.hi || 0) + (g.mid || 0) + (g.low || 0)) + '문장</td><td>' + esc((g.feat || []).map(function (c) { var f = (M.feat || []).filter(function (x) { return x.cat === c; })[0]; return f ? f.name : ''; }).filter(Boolean).join(', ') || '문장 짜임 · 말투') + '</td><td>' + (g.share >= 50 ? '수정 권고' : '확인 권고') + '</td></tr>'; }).join('');
    var featRows = (M.feat || []).map(function (f) { return '<tr><td><b>' + esc(f.name) + '</b><small>' + esc(q2(f.why || '')) + '</small></td><td>' + f.segs + '구간</td><td>' + f.share + '%</td><td>' + f.n + '건</td><td>' + (f.tags || []).map(function (t) { return '“' + esc(t) + '”'; }).join(' · ') + '</td></tr>'; }).join('');
    var keepE = S.edits, keepS = S.sel; S.edits = {}; S.sel = -1;   // 결과서는 검사한 그 글로(다시 검사하지 않은 고친 문장은 넣지 않음)
    var docH = docHtml(M).replace(/ tabindex="-?\d" role="button"/g, ''); S.edits = keepE; S.sel = keepS;
    var bars = (M.feat || []).map(function (f) { return '<div class="rb"><span>' + esc(f.name) + '</span><i><em style="width:' + Math.max(2, f.share) + '%"></em></i><b>' + f.share + '%</b></div>'; }).join('');
    var tiles = M.segs.map(function (g) { return '<span class="rt' + (g.ai ? ' ai' : '') + '"><b>' + pad3(g.no) + '</b>' + g.share + '%</span>'; }).join('');
    var docName = S.docName ? esc(S.docName) : '붙여 넣은 글';
    el.innerHTML = '<div class="rp8"><header class="rp8-top"><div><small>AIMarker · aimarker.kr</small><h1>AI 작성률 검사 결과상세내역서</h1></div><dl><div><dt>검사 번호</dt><dd>' + esc(M.cn) + '</dd></div><div><dt>발행일</dt><dd>' + esc(stamp(new Date())) + '</dd></div><div><dt>판정 기준</dt><dd>' + esc(M.critName || 'AIMarker 판정 기준 1.0') + '</dd></div><div><dt>판별 모델</dt><dd>' + esc(M.model || 'det') + '</dd></div></dl></header>' +
      '<section class="rp8-sum ' + bandCls(b.key) + '"><div class="g">' + gauge(M.rate, b, { chars: M.chars }) + '</div><div class="j"><p class="hz9-hl">' + stIco(b.key) + '<span>' + esc(headOf(b)) + '</span></p><p class="sub">' + esc(subLine(M)) + '</p><div class="hz9-row"><span class="hz9-lbl">판정</span>' + chip(b) + '</div>' + scaleFor(M) + whyHtml(b) + '</div></section>' +
      '<table class="rp8-kv"><tr><th>검사한 글</th><td>' + docName + ' · ' + n2(M.chars) + '자(공백 제외) · ' + n2(M.n) + '문장</td><th>이용권</th><td>' + esc(S.ps ? S.ps.name : '이용권') + '</td></tr><tr><th>AI 검출 글자 수</th><td>' + n2(M.aiChars) + ' / ' + n2(M.chars) + '자(본문의 ' + M.rate + '%)</td><th>AI 검출 구간 수</th><td>' + M.segAi + ' / ' + segN + '구간(' + pct(M.segAi, segN) + '%)</td></tr><tr><th>AI 검출 문장 수</th><td>' + n + ' / ' + n2(M.n) + '문장(' + pct(n, M.n) + '%)</td><th>AI 대화창 흔적</th><td>' + (M.chat ? M.chatList.map(function (c) { return esc(c.name) + ' ' + c.n + '곳'; }).join(', ') : '없음') + '</td></tr></table>' +
      '<h2>종합 분석 의견</h2><ul class="rp8-op">' + M.opinion.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="rp8-adv ' + bandCls(b.key) + '"><b>' + ({ unfit: '개선 필요', risk: '수정 권고' }[b.key] || '참고') + '</b>' + esc(ADV[b.key] || ADV.short) + '</p>' + (M.opDetail.length ? '<ul class="rp8-fix">' + M.opDetail.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      (tiles ? '<h2>구간별 검출 현황</h2><div class="rp8-tiles">' + tiles + '</div>' : '') +
      (featRows ? '<h2>01 · AI 문체 특성 프로파일</h2><div class="rp8-bars">' + bars + '</div><table class="rp8-t"><thead><tr><th>특성</th><th>구간 수</th><th>비중</th><th>건수</th><th>예시 표현</th></tr></thead><tbody>' + featRows + '</tbody></table>' : '') +
      '<h2>02 · 통합 원문 전문 분석</h2>' + legendHtml() + legendNote() + '<div class="rp8-doc">' + docH + '</div>' +
      (rows ? '<h2>03 · AI 검출 구간 요약</h2><table class="rp8-t"><thead><tr><th>구간</th><th>글자 수</th><th>AI 글자</th><th>비중</th><th>AI 검출 문장</th><th>주요 특성</th><th>권고</th></tr></thead><tbody>' + rows + '</tbody></table>' : '') +
      '<h2>04 · 문장 판정 분포</h2><div class="rp8-dist"><div class="rd"><i class="ai" style="width:' + pct(n, M.n) + '%"></i></div><p><span><i class="ai"></i>AI 검출 문장 <b>' + n + '문장</b>(' + pct(n, M.n) + '%)</span><span><i></i>표시 없음 <b>' + Math.max(0, M.n - n) + '문장</b></span></p></div>' +
      '<h2>05 · 판정 기준(' + esc(M.critName || 'AIMarker 판정 기준 1.0') + ')</h2><ul class="rp8-crit"><li><b>AI 검출 문장</b> 판별 모델이 앞뒤 문장과 함께 보고 매긴 AI 점수가 ' + J.MID + ' 이상인 문장, 또는 ' + J.MID + ' 미만이어도 앞뒤 문맥까지 본 구간 판정에서 AI로 검출된 문장. 결과에는 한 가지 표시(AI 검출)로 나타냄</li><li><b>AI 작성률</b> AI 검출 문장의 글자 수 ÷ 전체 글자 수(공백 제외)</li><li><b>구간</b> 문단 단위(30자 미만은 다음 문단과 합치고 1,000자를 넘으면 문장 경계에서 나눔). 구간 글자의 ' + J.SEG_AI + '% 이상이 AI 검출 문장이면 검출 구간</li><li><b>부적합(AI 검출됨)</b> 작성률 ' + J.UNFIT_RATE + '% 이상, 또는 검출 구간이 전체의 절반 이상(2구간 이상일 때), 또는 AI 대화창 흔적 1곳 이상</li><li><b>고위험(AI 일부 검출)</b> 작성률 ' + J.RISK_RATE + '% 이상, 또는 검출 구간 1곳 이상, 또는 AI 점수 ' + J.MID + ' 이상 문장 1개 이상</li><li><b>안전(AI 검출 안 됨)</b> 위에 해당하지 않음 · ' + J.SHORT + '자 미만은 판단 보류</li></ul>' +
      '<footer class="rp8-note">본 결과상세내역서는 참고용 분석 자료이며, 최종 판단은 제출처의 기준과 심사자의 판단에 따릅니다. AI 작성률과 판정은 판별 모델과 정해진 판정 기준으로 계산한 추정값이며 증명이 아니고, 법률 자문이 아닙니다. AI를 사용하지 않았다는 증명서가 아닙니다. 사람이 쓴 글도 높게, AI가 쓴 글도 낮게 나올 수 있으며 다른 검사기와 결과가 다를 수 있습니다. 같은 글을 다시 넣으면 같은 검사 번호와 같은 결과가 나옵니다. 결과만으로 다른 사람을 판단하지 마세요. 글은 저장하지 않으며 이 결과상세내역서는 이용자의 브라우저에서 만들어졌습니다. AIMarker(aimarker.kr) · 운영 성균관컨설팅</footer></div>';
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
  function buyBtnLabel() { var f = $('#hzBuyForm'); if (!f) return; var id = (f.querySelector('input[name="product"]:checked') || {}).value || 'd1', p = prod(id) || PRODS[1], b = f.querySelector('button[type="submit"]'); if (b) b.innerHTML = payReady() ? ico('card') + '<span>' + n2(p.price) + '원 결제하기</span>' : '<span>' + n2(p.price) + '원 주문하기</span>'; var n = $('#hzBuyNote'); if (n) n.textContent = payReady() ? '카드나 간편결제로 바로 결제합니다. 결제가 승인되면 이 화면에서 바로 전체 결과가 열리고, 코드는 메일로도 보내 드립니다.' : '주문하면 결제 안내를 메일로 드리고, 결제가 확인되면 이용권 코드를 보내 드립니다.'; }
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
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { say(msg, '이용권 코드와 영수증을 받을 이메일 주소를 확인해 주세요.'); return; }
      if (!f.querySelector('[name="agree"]').checked) { say(msg, '구매와 환불 안내, 이메일 수집에 동의해 주세요.'); return; }
      btn.disabled = true; say(msg, payReady() ? '결제를 준비하는 중…' : '주문을 보내는 중…', 'ok');
      var hold = Math.max(0, 2700 - (Date.now() - t0));   // 너무 빨리 낸 주문은 서버가 사람이 아닌 것으로 보므로, 그만큼만 기다렸다 보냄
      new Promise(function (ok) { setTimeout(ok, hold); }).then(function () { return AM.call('am.buy', { product: pid, contact: mail, agree: 1, pay: payReady() ? 1 : 0, hp: f.querySelector('[name="hp"]').value, ms: Date.now() - t0, src: location.pathname, cid: cid() }, 30000); }).then(function (r) {
        if (!r || !r.ok) throw r || {};
        if (r.pay && payReady()) return startPay(r, mail, msg, btn);
        sset('am_buy_mail', mail);
        var guide = r.payGuide || '담당자가 주문을 확인하고 남겨 주신 이메일로 결제 방법을 안내해 드립니다. 결제가 확인되면 같은 메일로 이용권 코드를 보내 드립니다. 메일이 오지 않으면 스팸함을 확인하거나 contact@skkc.co.kr로 주문 번호를 보내 주세요.';
        buyBody.innerHTML = '<h2>주문이 접수되었습니다</h2><div class="hz7-done"><p class="no">주문 번호<b>' + esc(r.id) + '</b></p><p>' + esc(r.name) + ' · ' + n2(r.price) + '원(부가세 포함)</p><div class="guide">' + esc(guide) + '</div>' +
          (r.link ? '<a class="btn btn-p btn-l" href="' + esc(r.link) + '" target="_blank" rel="noopener">결제하러 가기</a>' : '') +
          '<p class="hz7-dlg-n">코드는 ' + esc(mail) + ' 로 보내 드립니다. 메일의 단추를 누르면 코드가 들어간 채로 이 페이지가 열립니다.</p><button class="btn btn-g" type="button" data-code>코드를 받았어요 · 코드 넣기</button></div>';
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
      out.innerHTML = '<div class="hz7-err"><b>결제를 확인하지 못했어요</b><span>' + esc((e && e.message) || '잠시 뒤 다시 시도해 주세요.') + ' 결제가 되었는데 이용권이 열리지 않으면 주문 번호(' + esc(String(Q.orderId || '').slice(0, 11)) + ')와 함께 contact@skkc.co.kr로 알려 주세요.</span><div class="row"><button class="btn btn-p btn-s" type="button" data-buy="' + esc((d && d.prod) || 'd1') + '">다시 결제하기</button><button class="btn btn-g btn-s" type="button" data-code>코드가 있어요</button></div></div>';
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

  /* 다른 페이지에서 바로 여는 주소: #buy-s1 · #buy-d1 · #buy-m1 · #buy-q1 · #code */
  function hashGo() {
    var h = (location.hash || '').slice(1), m = /^buy-(s1|d1|m1|q1)$/.exec(h);
    if (m) openBuy(m[1]); else if (h === 'code') openCode(); else return;
    try { history.replaceState(null, '', location.pathname + location.search + '#price'); } catch (e) { /* 주소 그대로 */ }
  }
  window.addEventListener('hashchange', hashGo); hashGo();

  /* 9.0: 첫 화면 작업창에서 넘어온 글(이 브라우저 세션 저장소에만 잠깐 둠) → 바로 검사 또는 다듬기 */
  (function () {
    if (Q.pay) return;
    var h = ssget('am_hz_in'); if (!h || !h.text) return;
    ssset('am_hz_in', null);
    if (!String(ta.value || '').trim()) ta.value = String(h.text).slice(0, PAID_MAX);
    var tn = $('#hzTone'); if (tn && h.tone && tn.querySelector('option[value="' + h.tone + '"]')) tn.value = h.tone;
    count();
    setTimeout(function () { if (h.act === 'pro') { if (!btnP.disabled) pro(); else infoP.then(function () { pro(); }); } else check(); }, 120);
  })();

  count();
})();
