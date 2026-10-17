/* AIMarker AI 작성률 검사 · 휴머나이징 7.0 (2026.10.17 저녁)
   - 문장별 형광펜 색(높음 · 중간 · 낮음), 문단별 막대, 의심 문장 목록, 문장 고쳐 쓰기 도우미, 결과 리포트(인쇄 · PDF)
   - 무료 맛보기: 서버가 앞 3,000자 · 의심 문장 2개만 돌려줌(추정률은 실제 값). 이용권 코드가 있으면 5만 자까지 나눠 검사
   - 서버 am.style(검사 · 다듬기 · 문장 도우미) · am.humanize(고급) · am.pass · am.passinfo · am.buy. 규칙 · 가중치는 서버에만 */
(function () {
  'use strict';
  var AM = window.AM || {}, $ = function (s, el) { return (el || document).querySelector(s); };
  var box = $('#hz'); if (!box || !AM.call) return;
  var ta = $('#hzText'), out = $('#hzOut'), btnC = $('#hzCheck'), btnF = $('#hzFix'), btnP = $('#hzPro'), passEl = $('#hzPass');
  var FREE_MAX = 3000, PAID_MAX = 50000, CHUNK = 6000, HUM_MAX = 3500, HELP_MAX = 600;
  var S = { pass: '', ps: null, passMsg: '', proReady: false, info: null, busy: false, res: null, fx: null, edits: {}, sel: -1, side: 'ai', cache: {}, first: true };
  var LV = ['', '낮음', '중간', '높음'], ROOT = document.body.getAttribute('data-root') || '/';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var n2 = function (n) { return Number(n || 0).toLocaleString('ko-KR'); };
  function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = c || 'w' + Math.random().toString(36).slice(2, 12); } return c; }
  function sget(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function sset(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* 저장 없이 */ } }
  function tone() { return ($('#hzTone') || {}).value || 'keep'; }
  function call(action, data, ms) {
    return AM.call(action, Object.assign({ cid: cid() }, data || {}), ms || 60000).then(function (r) { if (!r || !r.ok) throw r || { message: '응답이 없습니다. 잠시 뒤 다시 시도해 주세요.' }; if (r.pass) { S.ps = r.pass; renderPass(); } return r; });
  }
  function ico(name) {
    var P = { lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', check: '<path d="M20 6 9 17l-5-5"/>', alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>', back: '<path d="M15 18l-6-6 6-6"/>' };
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
    var n = ta.value.length, t = n2(n), extra = '';
    if (S.pass && n > CHUNK) extra = ' · 이번 검사는 이용권 ' + chunk(ta.value).parts.length + '회로 셉니다';
    else if (!S.pass && n > FREE_MAX) extra = ' · 무료 맛보기는 앞 3,000자만 검사합니다';
    $('#hzCount').textContent = t;
    $('#hzLimit').textContent = (S.pass ? '이용권 한 번에 5만 자' : '무료 맛보기 3,000자 · 이용권 5만 자') + extra;
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
    readFile(f).then(function (t) { t = String(t || '').replace(/\r\n?/g, '\n').trim(); if (!t) throw new Error('파일에서 글을 찾지 못했습니다.'); ta.value = t.slice(0, PAID_MAX); count(); note('“' + f.name + '”에서 글 ' + n2(t.length) + '자를 꺼내 왔습니다' + (t.length > PAID_MAX ? '(5만 자까지만 넣었습니다)' : '') + '. 이제 검사하세요.'); })
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
      var p = S.ps, when = p.started ? (p.daily ? md(p.end).replace(/ \d\d:\d\d$/, '') + '까지 · 오늘 ' : md(p.end) + '까지 · ') : (p.daily ? '처음 쓴 날부터 30일 · 하루 ' : '처음 검사한 때부터 24시간 · ');
      h = '<span class="chip on">' + ico('check') + esc(p.name) + '</span><span>' + when + '남은 검사 · 다듬기 <b>' + n2(p.left) + '</b>회' + (S.proReady ? ' · 고급 ' + n2(p.proLeft) + '회' : '') + '</span><span class="sp"></span><button type="button" class="hz7-link" data-code>코드 바꾸기</button>';
    } else if (S.pass) h = '<span class="chip">이용권 확인 중</span><span>' + esc(S.pass) + '</span>';
    else h = '<span class="chip off">무료 맛보기</span><span>' + (S.passMsg ? esc(S.passMsg) : '앞 3,000자 · 전체 추정률 · 의심 문장 2개까지 보여 드립니다') + '</span><span class="sp"></span><button type="button" class="hz7-link" data-code>이용권 코드 넣기</button><button type="button" class="hz7-link" data-buy="d1">이용권 사기</button>';
    passEl.innerHTML = h; count();
  }
  function peek() {
    if (!S.pass) return renderPass();
    call('am.pass', { pass: S.pass }, 20000).then(function (r) { S.ps = r.pass; S.passMsg = ''; renderPass(); })
      .catch(function (e) { if (e && e.code === 'PASS') { S.passMsg = e.message; clearPass(); } renderPass(); });
  }
  (function () {
    var q = ''; try { q = new URLSearchParams(location.search).get('pass') || ''; } catch (e) { q = ''; }
    if (q) { setPass(q); try { history.replaceState(null, '', location.pathname + location.hash); } catch (e2) { /* 주소 그대로 */ } }
    else if (sget('am_pass')) S.pass = sget('am_pass');
    renderPass(); peek();
  })();
  call('am.passinfo', {}, 20000).then(function (r) { S.info = r; S.proReady = !!r.proReady; proBtn(); renderPass(); }).catch(function () { proBtn(); });
  function proBtn() { btnP.disabled = !S.proReady; $('#hzProTag').textContent = S.proReady ? '이용권' : '준비 중'; btnP.title = S.proReady ? '생성 AI가 문장을 새로 써 줍니다(이용권 고급 횟수)' : '고급 휴머나이징은 준비 중입니다'; }

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

  /* ---------- 단계 · 색 ---------- */
  function level(rate, chars) { if (chars < 60) return ['short', '글이 너무 짧아 추정하기 어려움']; if (rate >= 70) return ['high', 'AI 작성 가능성 높음']; if (rate >= 30) return ['mid', 'AI 작성 부분이 섞인 것으로 추정']; if (rate >= 10) return ['low', '대부분 사람이 쓴 글로 추정']; return ['none', '사람이 쓴 글에 가까움']; }
  function lvOf(s) { if (!s || s.lock) return -1; if (s.ai) return s.p >= 85 ? 3 : 2; return s.p >= 50 ? 1 : 0; }
  function ringCls(M) { return M.level === 'short' ? 'na' : M.rate >= 70 ? 'hi' : M.rate >= 30 ? 'mid' : 'lo'; }
  function ring(rate, cls, size) {
    var C = 314.16, off = C * (1 - Math.max(0, Math.min(100, rate)) / 100);
    return '<div class="ring6 ' + (size || 'lg') + ' ' + cls + '" role="img" aria-label="AI 작성 추정률 ' + rate + '퍼센트"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50" stroke-dasharray="' + C + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><b>' + rate + '<small>%</small></b></div>';
  }

  /* ---------- 결과 합치기 ---------- */
  function merge(rs, full, src) {
    var M = { full: full, sentences: [], chars: 0, aiChars: 0, aiN: 0, n: 0, cns: [], cats: {}, sigs: [], samples: [], sigN: 0, cut: false, total: src.length, verse: false, model: '', note: '', trunc: false, at: new Date() };
    var poff = 0;
    rs.forEach(function (r, k) {
      var d = r.ai || r.aiAfter || {}, maxp = -1, ss = d.sentences || [];
      ss.forEach(function (s) { M.sentences.push({ t: s.t, p: s.p, ai: s.ai, nl: s.nl, para: s.para + poff, lock: s.lock, k: k, sig: [] }); if (s.para > maxp) maxp = s.para; });
      poff += maxp + 1;
      if ((d.n || 0) > ss.length) M.trunc = true;
      M.chars += d.chars || 0; M.aiChars += d.aiChars != null ? d.aiChars : Math.round((d.rate || 0) * (d.chars || 0) / 100); M.aiN += d.aiN || 0; M.n += d.n || 0;
      if (d.cn) M.cns.push(d.cn);
      M.model = d.model || M.model; M.note = d.note || M.note; M.verse = M.verse || !!d.verse;
      ((r.before && r.before.cats) || []).forEach(function (c) { var o = M.cats[c.cat] = M.cats[c.cat] || { name: c.name, n: 0, ex: [] }; o.n += c.n; });
      (r.paragraphs || []).forEach(function (p) { (p.signals || []).forEach(function (g) { if (g.t) M.sigs.push({ k: k, t: g.t, why: g.why, catKo: g.catKo, cat: g.cat }); }); });
      (r.left || []).forEach(function (g) { if (g.t) M.sigs.push({ k: k, t: g.t, why: g.why, catKo: g.catKo }); });
      if (r.samples) M.samples = M.samples.concat(r.samples);
      M.sigN += r.sigN || 0;
      if (r.cut) M.cut = true;
    });
    M.rate = M.chars ? Math.round(M.aiChars / M.chars * 100) : 0;
    var L = level(M.rate, M.chars); M.level = L[0]; M.levelKo = L[1]; M.short = M.chars < 150;
    M.locked = !full; M.shown = M.sentences.filter(function (s) { return !s.lock && s.ai; }).length;
    // 신호를 문장에 잇기(같은 조각 안에서 앞에서부터)
    var byK = {};
    M.sentences.forEach(function (s, i) { (byK[s.k] = byK[s.k] || []).push(i); });
    var ptr = {};
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
    if (!el) { out.innerHTML = '<div class="hz7-prog"><b></b><i><em></em></i><p>문장마다 앞뒤 문장과 함께 AI 글 패턴을 살핍니다. 같은 글은 언제나 같은 결과가 나옵니다.</p></div>'; el = $('.hz7-prog', out); }
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
    else if (code === 'FREE_DAY') acts = '<button class="btn btn-p btn-s" type="button" data-buy="d1">24시간 이용권 2,900원</button>';
    out.innerHTML = '<div class="hz7-err"><b>' + (code === 'PASS_NEED' ? '이용권이 필요해요' : '처리하지 못했어요') + '</b><span>' + esc(m) + '</span>' + (acts ? '<div class="row">' + acts + '</div>' : '') + '</div>';
    S.retry = retry || null;
  }
  function need(t) { if (!String(t).replace(/\s+/g, '')) { ta.focus(); out.innerHTML = '<div class="hz7-err">검사할 글을 먼저 넣어 주세요. 위의 예시 단추로 바로 해 볼 수도 있습니다.</div>'; return false; } return true; }
  function toOut() { if (S.first) { S.first = false; } try { var r = out.getBoundingClientRect(); if (r.top < 0 || r.top > window.innerHeight * .6) out.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); } catch (e) { /* 그대로 */ } }

  /* ---------- 검사 ---------- */
  function check(text, opt) {
    opt = opt || {};
    var t = String(text != null ? text : ta.value).replace(/\r\n?/g, '\n');
    if (!need(t) || S.busy) return;
    var full = !!S.pass && !opt.free;
    if (full && t.length > PAID_MAX) { out.innerHTML = '<div class="hz7-err">이용권은 한 번에 5만 자까지 검사합니다. 나눠서 넣어 주세요.</div>'; return; }
    var C = full ? chunk(t) : { parts: [t.slice(0, CHUNK)], seps: [] };
    setBusy(true); prog('AI 작성률 검사 중', 0, C.parts.length);
    seq(C.parts, function (part, i) {
      var key = 'c|' + part;
      if (full && S.cache[key]) { prog('AI 작성률 검사 중', i + 1, C.parts.length); return Promise.resolve(S.cache[key]); }
      return call('am.style', { text: part, mode: 'check', tone: tone(), pass: full ? S.pass : '' }, 90000).then(function (r) { if (full && r.full) S.cache[key] = r; prog('AI 작성률 검사 중', i + 1, C.parts.length); return r; });
    }).then(function (rs) {
      var isFull = rs.every(function (r) { return r.full; });
      return merge(rs, isFull, t);
    }).then(function (M) { M.src = t; M.C = C; S.res = M; S.edits = {}; S.sel = -1; S.side = 'ai'; S.fx = null; renderRes(); toOut(); })
      .catch(function (e) { fail(e, function (free) { check(t, { free: free }); }); })
      .then(function () { setBusy(false); });
  }
  btnC.addEventListener('click', function () { check(); });

  /* ---------- 결과 그리기 ---------- */
  function paraGroups(M) {
    var G = [], cur = null;
    M.sentences.forEach(function (s, i) { if (!cur || cur.para !== s.para) { cur = { para: s.para, ids: [], chars: 0, ai: 0, lock: false }; G.push(cur); } cur.ids.push(i); var len = (S.edits[i] != null ? S.edits[i] : s.t).replace(/\s+/g, '').length; cur.chars += len; if (s.ai) cur.ai += len; if (s.lock) cur.lock = true; });
    return G;
  }
  function sentHtml(M, i) {
    var s = M.sentences[i], ed = S.edits[i] != null, lv = ed ? 0 : lvOf(s), lk = s.lock && M.aiN > M.shown, cls = 'hz-s' + (lv > 0 ? ' l' + lv : '') + (lk ? ' lk' : '') + (ed ? ' ed' : '') + (S.sel === i ? ' sel' : '');
    var tip = s.lock ? '' : ed ? ' title="고친 문장 · 다시 검사하면 새 색이 매겨집니다"' : lv > 0 ? ' title="AI 작성 가능성 ' + LV[lv] + ' · ' + s.p + '%"' : '';
    return '<span class="' + cls + '" data-i="' + i + '"' + tip + (M.full ? ' tabindex="0" role="button"' : '') + '>' + esc(ed ? S.edits[i] : s.t) + '</span>';
  }
  function docHtml(M) {
    var out = '', para = -1, open = false;
    M.sentences.forEach(function (s, i) {
      if (s.para !== para) { if (open) out += '</p>'; out += '<p data-para="' + s.para + '">'; open = true; para = s.para; }
      else out += s.nl ? '<br>' : ' ';
      out += sentHtml(M, i);
    });
    if (open) out += '</p>';
    if (M.trunc) out += '<p class="hz7-fineprint">문장이 아주 많은 부분은 앞쪽 문장까지만 색으로 보여 드립니다. 추정률은 전체로 계산했습니다.</p>';
    return out;
  }
  function stripHtml(M) {
    var G = paraGroups(M), tot = G.reduce(function (a, g) { return a + g.chars; }, 0) || 1;
    var segs = G.map(function (g, k) { var sh = g.chars ? g.ai / g.chars : 0, lv = M.full ? (sh >= .7 ? 3 : sh >= .3 ? 2 : sh >= .1 ? 1 : 0) : 0; return '<button type="button" class="' + (lv ? 'l' + lv : '') + '" style="--w:' + Math.max(1, Math.round(g.chars / tot * 1000)) + '" data-para="' + g.para + '" title="문단 ' + (k + 1) + (M.full ? ' · AI 작성 추정 ' + Math.round(sh * 100) + '%' : '') + '" aria-label="문단 ' + (k + 1) + '로 가기"></button>'; }).join('');
    return '<div class="hz7-strip' + (M.full ? '' : ' lk') + '"><div class="hz7-strip-t"><span>문단별 AI 작성 추정</span><span>' + G.length + '개 문단</span></div><div class="hz7-strip-b">' + segs + '</div></div>';
  }
  function sideList(M) {
    var items = [], ghosts = 0;
    M.sentences.forEach(function (s, i) {
      var lv = lvOf(s);
      if (S.edits[i] != null || lv < 1) return;
      var cats = []; s.sig.forEach(function (g) { if (g.catKo && cats.indexOf(g.catKo) < 0) cats.push(g.catKo); });
      items.push('<button type="button" class="hz7-item l' + lv + '" data-i="' + i + '"><span class="t">' + esc(s.t) + '</span><span class="m"><em>' + s.p + '%</em>' + LV[lv] + (cats.length ? cats.slice(0, 2).map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') : '') + '</span></button>');
    });
    if (!M.full) { ghosts = Math.max(0, Math.min(6, M.aiN - M.shown)); for (var g = 0; g < ghosts; g++) items.push('<div class="hz7-item ghost l2" aria-hidden="true"><span class="t">이용권으로 볼 수 있는 의심 문장입니다 이용권으로 볼 수 있는 의심 문장입니다</span><span class="m"><em>00%</em>중간</span></div>'); }
    if (!items.length) return '<p class="hz7-sideh">' + (M.full ? 'AI 글 패턴이 보이는 문장이 없습니다.' : 'AI 작성 추정 문장이 없습니다. 패턴이 조금 보이는 문장(낮음)까지 보려면 이용권으로 확인하세요.') + '</p>';
    return (M.full ? '<p class="hz7-sideh">눌러서 고쳐 쓰기</p>' : '<p class="hz7-sideh">미리 보기 ' + M.shown + '개 · 나머지 ' + Math.max(0, M.aiN - M.shown) + '개는 이용권으로</p>') + items.join('');
  }
  function sidePat(M) {
    var cats = Object.keys(M.cats).map(function (k) { return M.cats[k]; }).filter(function (c) { return c.n; }).sort(function (a, b) { return b.n - a.n; });
    var h = cats.length ? '<div class="hz7-cats">' + cats.map(function (c) { return '<div class="hz7-cat"><b>' + esc(c.name) + '</b><em>' + c.n + '곳</em>' + (M.full && c.ex.length ? '<small>' + c.ex.map(function (x) { return '“' + esc(x) + '”'; }).join(' · ') + '</small>' : '') + '</div>'; }).join('') + '</div>' : '<p class="hz7-sideh">눈에 띄는 AI식 표현 패턴이 없습니다. 추정률은 문장 짜임 · 말투 전체를 보고 계산합니다.</p>';
    if (!M.full && M.samples.length) h += '<p class="hz7-sideh">예시</p>' + M.samples.map(function (g) { return '<div class="hz7-cat"><b>' + esc(g.catKo) + '</b><em></em><small>“' + esc(g.t) + '” · ' + esc(g.why) + '</small></div>'; }).join('');
    return h;
  }
  function sideHtml(M) {
    if (M.full && S.sel >= 0) return spHtml(M, S.sel);
    var nPat = Object.keys(M.cats).reduce(function (a, k) { return a + M.cats[k].n; }, 0);
    return '<div class="hz7-tabs" role="tablist"><button type="button" role="tab" data-side="ai" aria-selected="' + (S.side === 'ai') + '">의심 문장 ' + M.aiN + '</button><button type="button" role="tab" data-side="pat" aria-selected="' + (S.side === 'pat') + '">AI 패턴 ' + nPat + '</button></div>' +
      '<div class="hz7-pane">' + (S.side === 'pat' ? sidePat(M) : sideList(M)) + '</div>';
  }
  function editsBar() {
    var n = Object.keys(S.edits).length;
    if (!n) return '';
    return '<div class="hz7-edits"><span>고친 문장 <b>' + n + '</b>개 · 다시 검사하면 색이 새로 매겨집니다</span><span class="sp"></span><button class="btn btn-p btn-s" type="button" data-act="recheck">고친 글 다시 검사</button><button class="btn btn-g btn-s" type="button" data-act="undoall">모두 되돌리기</button></div>';
  }
  function renderRes() {
    var M = S.res; if (!M) return;
    var who = M.level === 'short' ? '글이 너무 짧아 추정하기 어렵습니다. 150자 이상 넣어 주세요.' : '문장 <b>' + n2(M.n) + '</b>개 가운데 <b>' + n2(M.aiN) + '</b>개가 AI 글과 비슷합니다 · 글자 <b>' + n2(M.chars) + '</b>자(공백 제외)';
    var h = '<div class="hz7-res' + (M.full ? ' hz7-full' : '') + '">' +
      '<div class="hz7-head">' + ring(M.rate, ringCls(M)) + '<div class="hz7-sum"><small>AI 작성 추정률' + (M.full ? '' : ' · 무료 맛보기') + '</small><h2>' + esc(M.levelKo) + '</h2><p>' + who + '</p></div>' +
      '<div class="hz7-meta"><span>검사 번호</span><b>' + esc(M.cn || '-') + '</b><span>' + esc(stamp(M.at)) + '</span></div></div>';
    if (M.cut) h += '<div class="hz7-warn cut">무료 맛보기는 앞부분만 검사합니다(전체 ' + n2(M.total) + '자 가운데 앞 ' + n2(FREE_MAX) + '자 안쪽). 이용권으로 5만 자까지 한 번에 검사하세요.</div>';
    if (M.verse) h += '<div class="hz7-warn">시 · 노랫말처럼 줄이 짧은 글은 추정이 불안정합니다. 참고로만 보세요.</div>';
    else if (M.short && M.level !== 'short') h += '<div class="hz7-warn">150자보다 짧은 글은 추정이 불안정합니다. 참고로만 보세요.</div>';
    h += stripHtml(M) + editsBar() +
      '<div class="hz7-body"><div class="hz7-docw' + (M.full || !M.aiN || M.aiN <= M.shown ? '' : ' lkd') + '"><div class="hz7-doc" id="hzDoc">' + docHtml(M) + '</div>' + (M.full || !M.aiN || M.aiN <= M.shown ? '' : lockHtml(M)) + '</div>' +
      '<aside class="hz7-side" id="hzSide" aria-label="의심 문장 · AI 패턴">' + sideHtml(M) + '</aside></div>' +
      '<div class="hz7-legend"><span><i class="l3"></i>높음</span><span><i class="l2"></i>중간</span><span><i class="l1"></i>낮음</span><span><i class="l0"></i>사람 글에 가까움</span></div>' + actsHtml(M) +
      '<p class="hz7-fineprint">' + esc(M.note || 'AI 작성 추정률은 판별 모델의 추정값입니다. 판정이나 증명으로 쓰지 않습니다.') + ' 결과만으로 다른 사람을 판단하지 마세요.</p></div>';
    out.innerHTML = h;
  }
  function lockHtml(M) {
    var rest = Math.max(0, M.aiN - M.shown);
    return '<div class="hz7-lock">' + ico('lock') + '<h3>AI 의심 문장 ' + M.aiN + '개 가운데 ' + M.shown + '개만 보여 드렸어요</h3><p>나머지 ' + rest + '개 문장의 위치와 이유, 문장 고쳐 쓰기 도우미, 검사 번호가 찍힌 결과 리포트는 이용권으로 열립니다.</p>' +
      '<button class="btn btn-p" type="button" data-buy="d1">24시간 이용권 2,900원으로 전체 보기</button><button type="button" class="hz7-link" data-code>이용권 코드가 있어요</button></div>';
  }
  function actsHtml(M) {
    if (!M.full) return '<div class="hz7-acts"><button class="btn btn-p" type="button" data-buy="d1">전체 결과 보기 · 2,900원</button><button class="btn btn-g" type="button" data-act="fix">표현 다듬기 미리 보기</button><button class="btn btn-g" type="button" data-code>이용권 코드 넣기</button></div>';
    return '<div class="hz7-acts"><button class="btn btn-n" type="button" data-act="report">결과 리포트 저장(PDF)</button><button class="btn btn-g" type="button" data-act="fix">표현 다듬기</button>' + (S.proReady ? '<button class="btn btn-g" type="button" data-act="pro">고급 휴머나이징</button>' : '') + '<button class="btn btn-g" type="button" data-act="recheck">다시 검사</button></div>';
  }
  function stamp(d) { d = d || new Date(); var p = function (x) { return ('0' + x).slice(-2); }; return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ' · 모델 ' + (S.res && S.res.model || 'det'); }

  /* ---------- 문장 고쳐 쓰기 ---------- */
  function spHtml(M, i) {
    var s = M.sentences[i], cur = S.edits[i] != null ? S.edits[i] : s.t, lv = lvOf(s), why = s.sig.length ? s.sig.slice(0, 5).map(function (g) { return '<li><b>' + esc(g.catKo || 'AI 패턴') + '</b>“' + esc(g.t) + '” · ' + esc(g.why) + '</li>'; }).join('') : '<li>' + (lv >= 2 ? '눈에 띄는 표현보다 문장 짜임 · 말투 · 앞뒤 흐름이 AI 글과 비슷합니다. 내 경험이나 구체적인 예를 더하면 달라집니다.' : lv === 1 ? 'AI 글 패턴이 조금 보입니다. 꼭 고치지 않아도 됩니다.' : 'AI 글 패턴이 거의 보이지 않는 문장입니다.') + '</li>';
    return '<div class="hz7-sp" id="hzSp"><div class="hz7-sp-top"><button type="button" class="hz7-link" data-act="back">' + '목록으로' + '</button><span class="lv l' + Math.max(0, lv) + '">' + (lv > 0 ? LV[lv] + ' · ' : '') + s.p + '%</span></div>' +
      '<blockquote>' + esc(cur) + '</blockquote><h4>왜 이렇게 봤나요</h4><ul>' + why + '</ul>' +
      '<h4>고쳐 쓰기</h4><div class="row"><button class="btn btn-g btn-s" type="button" data-act="help">도우미 제안 받기</button>' + (S.proReady ? '<button class="btn btn-g btn-s" type="button" data-act="alts">AI로 다시 쓴 후보(고급 1회)</button>' : '') + '</div><div id="hzSug"></div>' +
      '<textarea id="hzSent" aria-label="고쳐 쓸 문장">' + esc(cur) + '</textarea>' +
      '<div class="hz7-tips"><button type="button" data-tip="[직접 겪은 일 한 줄]">+ 내 경험</button><button type="button" data-tip="[숫자 · 장소 · 날짜]">+ 구체적인 사실</button><button type="button" data-tip="[내 생각과 그 이유]">+ 내 생각</button></div>' +
      '<div class="row"><button class="btn btn-p btn-s" type="button" data-act="apply">이 문장 바꾸기</button>' + (S.edits[i] != null ? '<button class="btn btn-g btn-s" type="button" data-act="undo">원래대로</button>' : '') + '</div>' +
      '<p class="hz7-fineprint">대괄호 [ ] 는 내 말로 채워 넣으세요. 없는 경험이나 사실은 지어내지 마세요. 바꾼 문장은 다시 검사하면 새 색이 매겨집니다.</p></div>';
  }
  function pick(i) {
    var M = S.res; if (!M || !M.full) return;
    if (M.trunc && i < 0) return;
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
    var pg = e.target.closest('.hz7-strip-b [data-para]'); if (pg) { var p = $('#hzDoc p[data-para="' + pg.getAttribute('data-para') + '"]'), d = $('#hzDoc'); if (p && d) d.scrollTop = p.offsetTop - d.offsetTop - 12; return; }
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
  function fix() {
    var t = (Object.keys(S.edits).length && S.res ? buildText() : ta.value).replace(/\r\n?/g, '\n');
    if (!need(t) || S.busy) return;
    var full = !!S.pass;
    if (full && t.length > PAID_MAX) { out.innerHTML = '<div class="hz7-err">이용권은 한 번에 5만 자까지 다듬습니다.</div>'; return; }
    var C = full ? chunk(t) : { parts: [t.slice(0, CHUNK)], seps: [] };
    setBusy(true); prog('표현 다듬는 중', 0, C.parts.length);
    seq(C.parts, function (part, i) { return call('am.style', { text: part, mode: 'fix', tone: tone(), pass: full ? S.pass : '' }, 90000).then(function (r) { prog('표현 다듬는 중', i + 1, C.parts.length); return r; }); })
      .then(function (rs) {
        if (!rs.every(function (r) { return r.full; })) { S.fx = { free: true, changes: rs[0].changes || 0, samples: rs[0].fixSamples || [], cut: rs[0].cut, total: t.length }; renderFixFree(); toOut(); return; }
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
    if (!S.pass) { openBuy('d1', '고급 휴머나이징은 이용권으로 씁니다.'); return; }
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
    var bcls = F.beforeRate >= 70 ? 'hi' : F.beforeRate >= 30 ? 'mid' : 'lo';
    var tabs = [['text', '다듬은 글'], ['diff', '바뀐 곳 ' + changes]];
    if (F.kind === 'fix') { tabs.push(['why', '바꾼 이유 ' + F.applied.length]); if (F.left.length) tabs.push(['left', '직접 손볼 곳 ' + F.left.length]); }
    var f = F.facts, facts = '<div class="hz7-facts2' + (f.missing.length ? ' bad' : '') + '">' + ico(f.missing.length ? 'alert' : 'check') + '<span>' + (f.missing.length ? '원문의 숫자 · 인용 가운데 다듬은 글에서 찾지 못한 것: ' + esc(f.missing.join(', ')) + '. 꼭 대조해 주세요.' : f.total ? '원문의 숫자 · 인용 · 고유명사 ' + f.total + '개를 그대로 지켰습니다.' : '바꾸면 안 되는 숫자 · 인용이 없는 글입니다.') + '</span></div>';
    var warn = A.rate >= 50 && !A.short ? '<div class="hz7-warn">' + (F.kind === 'fix' ? '표현 다듬기는 AI가 자주 쓰는 표현을 바꿉니다. 글의 짜임과 흐름에 AI 패턴이 남아 있으면 추정률이 크게 내려가지 않습니다. “다듬은 글로 바꾸고 색 보기”를 누른 뒤, 색이 칠해진 문장을 눌러 내 경험 · 생각 · 구체적인 예를 더해 고쳐 쓰세요.' : '아직 AI 패턴이 남아 있습니다. 색이 칠해진 문장을 눌러 내 말로 고쳐 쓰세요.') + '</div>' : '';
    out.innerHTML = '<div class="hz7-res"><div class="hz7-ba"><div>' + ring(F.beforeRate, bcls, '') + '<div><small>다듬기 전</small><b>AI 작성 추정률</b></div></div><span class="arr" aria-hidden="true">→</span><div>' + ring(A.rate, ringCls(A), '') + '<div><small>' + (F.kind === 'pro' ? '고급 휴머나이징 뒤' : '표현 다듬기 뒤') + '</small><b>' + esc(A.levelKo) + '</b></div></div></div>' + warn +
      '<div class="hz7-vt" role="tablist">' + tabs.map(function (t, k) { return '<button type="button" role="tab" data-fv="' + t[0] + '" aria-selected="' + (k ? 'false' : 'true') + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>' +
      '<div data-fp="text"><div class="hz7-text">' + clean + '</div></div><div data-fp="diff" hidden><div class="hz7-text">' + dv + '</div></div>' +
      (F.kind === 'fix' ? '<div data-fp="why" hidden><ul class="hz7-list">' + F.applied.map(function (a) { return '<li><span class="cat">' + esc(({ 1: '번역투', 2: '상투적 연결어', 3: '빈말 · 과장 수식', 4: '틀에 박힌 도입 · 마무리', 5: '대화창 복사 흔적' })[a.cat] || '말투') + '</span><b>' + (a.from ? '<s>' + esc(a.from) + '</s> ' : '') + (a.to ? '<ins>' + esc(a.to) + '</ins>' : '(뺌)') + '</b><small>' + esc(a.why) + '</small></li>'; }).join('') + '</ul></div><div data-fp="left" hidden><ul class="hz7-list">' + F.left.map(function (a) { return '<li><span class="cat">' + esc(a.catKo) + '</span>' + (a.t ? '<b>' + esc(a.t) + '</b>' : '') + '<small>' + esc(a.why) + '</small></li>'; }).join('') + '</ul></div>' : '') +
      facts + '<div class="hz7-acts"><button class="btn btn-p" type="button" data-act="usefix">다듬은 글로 바꾸고 색 보기</button><button class="btn btn-g" type="button" data-act="copyfix">다듬은 글 복사</button>' + (S.res ? '<button class="btn btn-g" type="button" data-act="backres">검사 결과로 돌아가기</button>' : '') + '</div>' +
      '<p class="hz7-fineprint">“다듬은 글로 바꾸고 색 보기”는 다듬은 글의 추정 결과를 그대로 보여 주므로 이용권 횟수를 더 쓰지 않습니다.</p></div>';
  }
  out.addEventListener('click', function (e) {
    var t = e.target.closest('[data-fv]'); if (!t) return;
    var v = t.getAttribute('data-fv');
    out.querySelectorAll('[data-fv]').forEach(function (b) { b.setAttribute('aria-selected', b === t ? 'true' : 'false'); });
    out.querySelectorAll('[data-fp]').forEach(function (p) { p.hidden = p.getAttribute('data-fp') !== v; });
  });
  function useFix() { var F = S.fx; ta.value = F.text; count(); S.res = F.after; S.res.at = new Date(); S.edits = {}; S.sel = -1; S.fx = null; renderRes(); toOut(); }

  /* ---------- 리포트(인쇄 · PDF 저장) ---------- */
  function report() {
    var M = S.res; if (!M || !M.full) return;
    var el = document.getElementById('hzReport');
    if (!el) { el = document.createElement('section'); el.id = 'hzReport'; document.body.appendChild(el); }
    var G = paraGroups(M), tot = G.reduce(function (a, g) { return a + g.chars; }, 0) || 1;
    var list = [], k = 0;
    M.sentences.forEach(function (s, i) { var lv = lvOf(s); if (lv < 2 || k >= 40) return; k++; var cats = []; s.sig.forEach(function (g) { if (g.catKo && cats.indexOf(g.catKo) < 0) cats.push(g.catKo); }); list.push('<tr><td>' + k + '</td><td>' + esc(S.edits[i] != null ? S.edits[i] + ' (고친 문장, 다시 검사 전)' : s.t) + '</td><td>' + LV[lv] + ' · ' + s.p + '%</td><td>' + esc(cats.join(', ') || '문장 짜임 · 말투') + '</td></tr>'); });
    el.innerHTML = '<div class="rp7"><div class="rp7-top"><h1>AI 작성 추정 결과 리포트</h1><small>AIMarker · aimarker.kr</small></div>' +
      '<table class="rp7-meta"><tr><th>검사 번호</th><td>' + esc(M.cn) + '</td><th>검사 시각</th><td>' + esc(stamp(M.at).split(' · ')[0]) + '</td></tr><tr><th>글자 수</th><td>' + n2(M.chars) + '자(공백 제외)</td><th>문장 수</th><td>' + n2(M.n) + '개 · AI 의심 ' + n2(M.aiN) + '개</td></tr><tr><th>판별 모델</th><td>' + esc(M.model || 'det') + '</td><th>이용권</th><td>' + esc(S.ps ? S.ps.name : '이용권') + '</td></tr></table>' +
      '<div class="rp7-big"><b>' + M.rate + '%</b><span>' + esc(M.levelKo) + '</span></div>' +
      '<div class="rp7-strip">' + G.map(function (g) { var sh = g.chars ? g.ai / g.chars : 0, lv = sh >= .7 ? 3 : sh >= .3 ? 2 : sh >= .1 ? 1 : 0; return '<i class="' + (lv ? 'l' + lv : '') + '" style="flex:' + Math.max(1, Math.round(g.chars / tot * 1000)) + ' 1 0"></i>'; }).join('') + '</div>' +
      '<h2>문장별 색 표시</h2><div class="hz7-legend"><span><i class="l3"></i>높음</span><span><i class="l2"></i>중간</span><span><i class="l1"></i>낮음</span><span><i class="l0"></i>사람 글에 가까움</span></div>' +
      '<div class="rp7-doc">' + docHtml(M).replace(/ sel"/g, '"').replace(/ tabindex="0" role="button"/g, '') + '</div>' +
      (list.length ? '<h2>AI 작성 추정 문장(앞에서부터 40개까지)</h2><table class="rp7-list"><tr><th>#</th><th>문장</th><th>정도</th><th>보인 패턴</th></tr>' + list.join('') + '</table>' : '') +
      '<p class="rp7-note">이 리포트는 AIMarker AI 작성 추정 모델(판별 모델)의 추정값이며 판정이나 증명이 아닙니다. 사람이 쓴 글도 높게, AI가 쓴 글도 낮게 나올 수 있고, 다른 검사기와 결과가 다를 수 있습니다. 같은 글을 다시 넣으면 같은 검사 번호와 같은 결과가 나옵니다. 결과만으로 다른 사람을 판단하지 마세요. 글은 저장하지 않으며 이 리포트는 이용자의 브라우저에서 만들어졌습니다. AIMarker(aimarker.kr) · 운영 성균관컨설팅</p></div>';
    var done = function () { document.body.classList.remove('hz7-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    document.body.classList.add('hz7-printing');
    setTimeout(function () { try { window.print(); } catch (e) { done(); } }, 60);
  }

  /* ---------- 구매 · 코드 창 ---------- */
  function say(el, text, kind) { if (!el) return; el.textContent = text || ''; el.className = 'msg' + (text ? ' on ' + (kind || 'err') : ''); }
  function dlgOpen(d) { if (!d) return; if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
  var buyDlg = $('#hzBuy'), buyBody = $('#hzBuyBody'), buyTpl = buyBody ? buyBody.innerHTML : '', t0 = 0;
  function openBuy(prod, why) {
    if (!buyDlg) return;
    buyBody.innerHTML = buyTpl;
    var r = buyBody.querySelector('input[name="product"][value="' + (prod === 'm1' ? 'm1' : 'd1') + '"]'); if (r) r.checked = true;
    if (S.info && S.info.products) S.info.products.forEach(function (p) { var em = buyBody.querySelector('input[value="' + p.id + '"] + span em'); if (em) em.textContent = n2(p.price) + '원'; });
    if (why) say(buyBody.querySelector('.msg'), why, 'ok');
    t0 = Date.now(); dlgOpen(buyDlg);
    setTimeout(function () { var i = $('#hzBuyMail'); if (i) i.focus(); }, 60);
  }
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'hzBuyForm') {
      e.preventDefault();
      var msg = f.querySelector('.msg'), mail = f.querySelector('[name="contact"]').value.trim(), prod = (f.querySelector('input[name="product"]:checked') || {}).value || 'd1', btn = f.querySelector('button[type="submit"]');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { say(msg, '이용권 코드를 받을 이메일 주소를 확인해 주세요.'); return; }
      if (!f.querySelector('[name="agree"]').checked) { say(msg, '구매 · 환불 안내와 이메일 수집에 동의해 주세요.'); return; }
      btn.disabled = true; say(msg, '주문을 보내는 중…', 'ok');
      AM.call('am.buy', { product: prod, contact: mail, agree: 1, hp: f.querySelector('[name="hp"]').value, ms: Date.now() - t0, src: location.pathname, cid: cid() }, 30000).then(function (r) {
        if (!r || !r.ok) throw r || {};
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
        say(m2, '이용권을 넣었습니다.', 'ok'); setTimeout(function () { var d = $('#hzCode'); if (d && d.open) d.close(); }, 500);
        if (S.res && !S.res.full) check(S.res.src);
      }).catch(function (e3) { say(m2, (e3 && e3.message) || '코드를 확인하지 못했습니다.'); }).then(function () { b2.disabled = false; });
    }
  });
  function openCode() { var d = $('#hzCode'); if (!d) return; if (buyDlg && buyDlg.open) buyDlg.close(); var f = $('#hzCodeForm'); if (f) { f.reset(); say(f.querySelector('.msg'), ''); } dlgOpen(d); setTimeout(function () { var i = $('#hzCodeIn'); if (i) i.focus(); }, 60); }
  var ci = $('#hzCodeIn'); if (ci) ci.addEventListener('input', function () { var p = ci.selectionStart === ci.value.length, v = fmtCode(ci.value).slice(0, 19); if (v !== ci.value) { ci.value = v; if (p) ci.setSelectionRange(v.length, v.length); } });
  /* 다른 쪽에서 바로 여는 주소: #buy-d1 · #buy-m1 · #code */
  function hashGo() {
    var h = (location.hash || '').slice(1);
    if (h === 'buy-d1' || h === 'buy-m1') openBuy(h.slice(4)); else if (h === 'code') openCode(); else return;
    try { history.replaceState(null, '', location.pathname + location.search + '#price'); } catch (e) { /* 주소 그대로 */ }
  }
  window.addEventListener('hashchange', hashGo); hashGo();

  count();
})();
