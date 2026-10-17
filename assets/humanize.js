/* AIMarker AI 작성률 검사 · 휴머나이징 (2026.10.17) · 서버 am.style(AI 작성 추정 · 점검 · 기본 다듬기 · 말투) · am.humanize(고급, 파일럿). 규칙 · 가중치는 서버에만 있음 */
(function () {
  'use strict';
  var AM = window.AM || {}, $ = function (s, el) { return (el || document).querySelector(s); };
  var box = $('#hz'); if (!box) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ta = $('#hzText'), out = $('#hzOut'), btnC = $('#hzCheck'), btnF = $('#hzFix'), btnP = $('#hzPro'), last = null, busy = false, proReady = false;
  var AIM = window.AIMExtract, SEO = window.AIMSeo, MK = window.MK;
  function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = 'w' + Math.random().toString(36).slice(2, 12); } return c; }
  function tone() { var r = box.querySelector('input[name="hzTone"]:checked'); return r ? r.value : 'keep'; }
  var EX = {
    report: '인공지능 기술은 현대 사회에서 중요한 역할을 하고 있습니다. 또한, 다양한 산업 분야에 있어서 혁신적인 변화를 이끌고 있습니다. 이를 통해 기업은 업무를 효과적으로 처리할 수 있습니다. 또한, 고객 경험을 극대화할 수 있습니다.\n\n그러나 인공지능의 활용에 있어서 개인정보 보호 문제가 발생할 수 있습니다. 따라서, 기업은 데이터를 체계적으로 관리할 필요가 있습니다. 결론적으로, 인공지능은 미래 사회의 핵심이라고 할 수 있습니다.',
    essay: '저는 대학 시절 봉사 동아리 활동을 통해 협업의 중요성을 배웠습니다. 동아리 활동에 있어서 저는 기획을 맡았습니다. 기획 과정에서 다양한 의견이 충돌하였습니다. 저는 팀원들과 대화를 진행함으로써 갈등을 해결하였습니다. 이처럼, 저는 소통 능력을 가지고 있습니다. 따라서, 귀사에서도 이러한 역량을 발휘할 수 있다고 볼 수 있습니다.',
    blog: '물론입니다! 아래는 성수동 카페 방문 후기입니다.\n\n## 분위기\n**넓은 공간**: 카페는 다양한 좌석을 제공하고 있습니다. 또한, 조용한 분위기를 가지고 있습니다. 결론적으로, 공부하기에 매우 좋은 장소라고 할 수 있습니다.\n\n도움이 되셨으면 좋겠습니다. 궁금한 점이 있으면 언제든지 물어보세요!',
    shop: '본 제품은 혁신적인 기술을 통해 피부 보습을 효과적으로 도와줍니다. 또한, 다양한 성분이 피부 장벽 강화에 있어서 중요한 역할을 합니다. 지속적으로 사용함으로써 촉촉한 피부를 경험할 수 있습니다. 용량은 50ml, 가격은 29,000원입니다.',
    human: '지난 토요일에 동생이랑 망원동 시장에 갔다. 원래는 칼국수만 먹고 오려고 했는데 입구에서 파는 꽈배기 냄새를 못 참고 두 개나 사 먹었다. 설탕을 너무 많이 묻혀서 옷에 다 떨어졌음 ㅋㅋ\n\n칼국수집은 줄이 생각보다 길어서 20분쯤 기다렸다. 국물은 멸치 맛이 진하고 면이 좀 두꺼운 편인데 나는 이게 좋았다. 동생은 김치가 너무 시다고 투덜거렸지만 결국 한 그릇 다 비움. 다음엔 평일에 가 봐야겠다.'
  };
  function count() { $('#hzCount').textContent = ta.value.length.toLocaleString('ko-KR'); }
  ta.addEventListener('input', count);
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ex]'); if (!b || !EX[b.getAttribute('data-ex')]) return;
    e.preventDefault(); ta.value = EX[b.getAttribute('data-ex')]; count();
    box.scrollIntoView({ behavior: 'smooth', block: 'start' }); ta.focus({ preventScroll: true });
  });

  /* 고급(파일럿) 켜졌는지 */
  AM.call && AM.call('am.humanize', { probe: true, cid: cid() }, 15000).then(function (r) {
    if (r && r.ok && r.ready) { proReady = true; btnP.disabled = false; btnP.title = '생성 AI로 문장을 다시 씁니다(파일럿)'; $('#hzProTag').textContent = '파일럿'; }
  }).catch(function () { /* 준비 중 그대로 */ });

  function setBusy(on, which) {
    busy = on; [btnC, btnF].forEach(function (b) { b.disabled = on; }); if (proReady) btnP.disabled = on;
    if (on) out.innerHTML = '<div class="hz-empty"><div class="hz-meter"><span>' + (which === 'pro' ? '생성 AI가 다시 쓰는 중' : which === 'fix' ? '다듬는 중' : 'AI 작성률 검사 중') + '</span><i><b style="width:40%"></b></i><em>…</em></div><p>문장마다 앞뒤 문장과 함께 AI 글 패턴을 살핍니다. 같은 글은 언제나 같은 결과가 나옵니다.</p></div>';
  }
  function err(e) {
    var m = e && e.name === 'AbortError' ? '응답이 늦습니다. 잠시 뒤 다시 시도해 주세요.' : (e && (e.message || e.msg)) || '지금은 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
    out.innerHTML = '<div class="hz-err"><b>처리하지 못했어요</b><p>' + esc(m) + '</p></div>';
  }
  function need() { var t = ta.value; if (!t.replace(/\s+/g, '')) { ta.focus(); out.innerHTML = '<div class="hz-err">검사할 글을 먼저 넣어 주세요. 위의 예시 단추로 바로 해 볼 수도 있습니다.</div>'; return ''; } return t; }
  btnC.addEventListener('click', function () { var t = need(); if (!t || busy) return; setBusy(true, 'check'); AM.call('am.style', { text: t, mode: 'check', tone: tone(), cid: cid() }, 40000).then(function (r) { if (!r || !r.ok) throw r || {}; last = { kind: 'check', src: t, r: r }; paintCheck(r); }).catch(err).then(function () { setBusy(false); }); });
  btnF.addEventListener('click', function () { var t = need(); if (!t || busy) return; setBusy(true, 'fix'); AM.call('am.style', { text: t, mode: 'fix', tone: tone(), cid: cid() }, 40000).then(function (r) { if (!r || !r.ok) throw r || {}; last = { kind: 'fix', src: t, r: r, text: r.text }; paintFix(); }).catch(err).then(function () { setBusy(false); }); });
  btnP.addEventListener('click', function () { var t = need(); if (!t || busy) return; setBusy(true, 'pro'); AM.call('am.humanize', { text: t, tone: tone(), cid: cid() }, 90000).then(function (r) { if (!r || !r.ok) throw r || {}; last = { kind: 'pro', src: t, r: r, text: r.text }; paintFix(); }).catch(err).then(function () { setBusy(false); }); });

  /* ---------- 그리기 ---------- */
  function meter(label, score, levelKo) { return '<div class="hz-meter"><span>' + esc(label) + '</span><i><b class="' + (score < 30 ? 'low' : '') + '" style="width:' + Math.max(3, score) + '%"></b></i><em>' + esc(levelKo || '') + ' ' + score + '</em></div>'; }
  function paras(list) {
    return list.map(function (p) {
      return '<div class="hz-para">' + meter('문단 ' + (p.i + 1), p.score, p.score >= 60 ? '높음' : p.score >= 30 ? '보통' : '낮음') + '<p>' + esc(p.text) + '</p>' +
        (p.signals.length ? '<ul class="hz-list">' + p.signals.slice(0, 8).map(function (s) { return '<li><span class="cat">' + esc(s.catKo) + '</span>' + (s.t ? '<b>' + esc(s.t) + '</b>' : '') + '<small>' + esc(s.why) + '</small></li>'; }).join('') + '</ul>' : '') + '</div>';
    }).join('');
  }
  /* ---------- AI 작성 추정률 ---------- */
  function ring(rate, cls, big) {
    var C = 314.16, off = C * (1 - Math.max(0, Math.min(100, rate)) / 100);
    return '<div class="ring6 ' + (big ? 'lg ' : '') + cls + '" role="img" aria-label="AI 작성 추정률 ' + rate + '퍼센트"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="50"/><circle class="fg" cx="60" cy="60" r="50" stroke-dasharray="' + C + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><b>' + rate + '<small>%</small></b></div>';
  }
  function lvCls(ai) { return !ai ? 'na' : ai.level === 'short' ? 'na' : ai.rate >= 70 ? 'hi' : ai.rate >= 30 ? 'mid' : 'lo'; }
  function aiCount(ai) { var n = 0; (ai.sentences || []).forEach(function (x) { if (x.ai) n++; }); return n; }
  function aiHead(ai) {
    if (!ai) return '';
    var n = (ai.sentences || []).length, k = aiCount(ai);
    var line = ai.level === 'short' ? '글이 너무 짧아 추정하기 어렵습니다. 150자 이상 넣어 주세요.' : k ? '문장 ' + n + '개 가운데 ' + k + '개에 AI 글 패턴이 보입니다.' : '문장 ' + n + '개 가운데 AI 글 패턴이 몰린 문장이 없습니다.';
    return '<div class="hz-ai">' + ring(ai.rate, lvCls(ai), true) + '<div><small>AI 작성 추정률</small><h2>' + esc(ai.levelKo) + '</h2><p>' + esc(line) + '</p></div></div>' +
      ((ai.short || ai.verse) ? '<div class="hz-warn"><span>' + (ai.verse ? '시 · 노랫말처럼 줄이 짧은 글은 추정이 불안정합니다. 참고로만 보세요.' : '150자보다 짧은 글은 추정이 불안정합니다. 참고로만 보세요.') + '</span></div>' : '');
  }
  function aiText(ai) {
    var out = '', para = -1;
    (ai.sentences || []).forEach(function (x, i) {
      if (i) out += x.para !== para ? '\n\n' : x.nl ? '\n' : ' ';
      para = x.para;
      var t = esc(x.t);
      if (x.ai) out += '<mark class="ai" style="--p:' + (Math.max(0, Math.min(100, x.p)) / 100).toFixed(2) + '" title="AI 패턴 ' + x.p + '%">' + t + '</mark>';
      else if (x.p >= 50) out += '<mark class="ai soft" title="AI 패턴 ' + x.p + '%">' + t + '</mark>';
      else out += t;
    });
    return '<div class="hz-text hz-hl">' + out + '</div><div class="hz-legend"><span><i class="l1"></i>AI 작성 추정 구간</span><span><i class="l2"></i>AI 패턴이 조금 보이는 문장</span><span><i class="l3"></i>사람이 쓴 글에 가까운 문장</span></div>';
  }
  function paintCheck(r) {
    var ai = r.ai, cats = (r.before.cats || []).slice().sort(function (a, b) { return b.n - a.n; });
    if (!ai) return paintStyle(r);
    var nPat = cats.reduce(function (a, c) { return a + c.n; }, 0);
    out.innerHTML = aiHead(ai) +
      '<div class="hz-tabs" role="tablist"><button type="button" role="tab" data-v="hl" aria-selected="true">문장별 보기</button><button type="button" role="tab" data-v="pat" aria-selected="false">AI 패턴 ' + nPat + '</button></div>' +
      '<div data-pane="hl">' + aiText(ai) + '</div>' +
      '<div data-pane="pat" hidden><div class="hz-sc"><div><small>AI식 문체 신호</small>' + meter('전체', r.before.score, r.before.levelKo) + '</div><div><small>많이 나온 패턴</small><b>' + esc(cats.slice(0, 2).map(function (c) { return c.name + ' ' + c.n; }).join(' · ') || '없음') + '</b></div></div>' + paras(r.paragraphs) + '</div>' +
      '<div class="hz-row"><button class="btn btn-p" type="button" data-go="fix">이 글 자연스럽게 다듬기</button>' + (proReady ? '<button class="btn btn-g" type="button" data-go="pro">고급 휴머나이징</button>' : '') + '</div>' +
      '<p class="hz-note">' + esc(ai.note) + '</p>';
  }
  function paintStyle(r) {
    out.innerHTML = '<div class="hz-sc"><div><small>AI식 문체 신호</small>' + meter('전체', r.before.score, r.before.levelKo) + '</div><div><small>많이 나온 것</small><b>' + esc((r.before.cats || []).sort(function (a, b) { return b.n - a.n; }).slice(0, 2).map(function (c) { return c.name + ' ' + c.n; }).join(' · ') || '없음') + '</b></div></div>' +
      '<p class="hz-note">' + esc(r.note) + '</p>' + paras(r.paragraphs) +
      '<div class="hz-row"><button class="btn btn-p" type="button" data-go="fix">이대로 자연스럽게 다듬기</button></div>';
  }
  function tokens(s) { return String(s).match(/\s+|[^\s]+/g) || []; }
  function diff(a, b) {
    var A = tokens(a), B = tokens(b), n = A.length, m = B.length, ops = [];
    if (n * m > 4000000) return [['-', a], ['+', b]];
    var W = m + 1, dp = new Uint16Array((n + 1) * W), i, j;
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i * W + j] = A[i] === B[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
    var push = function (k, t) { var l = ops[ops.length - 1]; if (l && l[0] === k) l[1] += t; else ops.push([k, t]); };
    i = 0; j = 0;
    while (i < n && j < m) { if (A[i] === B[j]) { push('=', A[i]); i++; j++; } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { push('-', A[i]); i++; } else { push('+', B[j]); j++; } }
    while (i < n) push('-', A[i++]); while (j < m) push('+', B[j++]);
    return ops;
  }
  var view = 'clean';
  function finalText() { return last.text + (last.markLine ? '\n\n' + last.markLine : ''); }
  function paintFix() {
    var r = last.r, ops = diff(last.src, last.text), changes = ops.filter(function (o) { return o[0] !== '=' && o[1].trim(); }).length;
    var clean = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '+' ? (o[1].trim() ? '<mark>' + esc(o[1]) + '</mark>' : esc(o[1])) : ''; }).join('');
    var dv = ops.map(function (o) { return o[0] === '=' ? esc(o[1]) : o[0] === '+' ? '<ins>' + esc(o[1]) + '</ins>' : '<del>' + esc(o[1]) + '</del>'; }).join('');
    var f = r.facts || { total: 0, missing: [] }, factsHtml = '<div class="hz-facts' + (f.missing.length ? ' bad' : '') + '"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (f.missing.length ? '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>' : '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>') + '</svg><span>' +
      (f.missing.length ? '원문의 숫자 · 인용 가운데 다듬은 글에서 찾지 못한 것: ' + esc(f.missing.join(', ')) + '. 꼭 대조해 주세요.' : f.total ? '원문의 숫자 · 인용 · 고유명사 ' + f.total + '개를 그대로 지켰습니다.' : '바꾸면 안 되는 숫자 · 인용이 없는 글입니다.') + '</span></div>';
    var tabs = [['text', '다듬은 글'], ['diff', '바뀐 곳 ' + changes]];
    if (r.aiAfter && r.aiAfter.sentences) tabs.push(['hl', 'AI 패턴 남은 곳 ' + aiCount(r.aiAfter)]);
    if (last.kind === 'fix') { tabs.push(['why', '바꾼 이유 ' + (r.applied || []).length]); if ((r.left || []).length) tabs.push(['left', '직접 손볼 곳 ' + r.left.length]); }
    var head = (r.ai && r.aiAfter) ? '<div class="hz-ba"><div>' + ring(r.ai.rate, lvCls(r.ai)) + '<div><small>다듬기 전</small><b>AI 작성 추정률</b></div></div><span aria-hidden="true">→</span><div>' + ring(r.aiAfter.rate, lvCls(r.aiAfter)) + '<div><small>다듬은 뒤' + (last.kind === 'pro' ? ' · 고급' : '') + '</small><b>' + esc(r.aiAfter.levelKo) + '</b></div></div></div>' :
      '<div class="hz-sc"><div><small>다듬기 전</small>' + meter('AI식 문체', r.before.score, r.before.levelKo) + '</div><div><small>다듬은 뒤' + (last.kind === 'pro' ? ' · 고급' : '') + '</small>' + meter('AI식 문체', r.after.score, r.after.levelKo) + '</div></div>';
    if (r.aiAfter && r.aiAfter.rate >= 50 && !r.aiAfter.short) head += '<div class="hz-warn"><span>' + (last.kind === 'fix' ? '기본 다듬기는 AI가 자주 쓰는 표현을 바꿉니다. 글의 짜임과 흐름에 AI 패턴이 남아 있으면 추정률이 크게 내려가지 않습니다. 내 경험 · 생각 · 구체적인 예를 더해 직접 고쳐 쓰면 내 글에 가까워집니다.' + (proReady ? ' 고급 휴머나이징은 문장을 새로 써 줍니다.' : '') : '아직 AI 패턴이 남아 있습니다. 내 경험 · 생각 · 구체적인 예를 더해 직접 고쳐 써 보세요.') + '</span></div>';
    out.innerHTML = head +
      '<div class="hz-tabs" role="tablist">' + tabs.map(function (t, k) { return '<button type="button" role="tab" data-v="' + t[0] + '" aria-selected="' + (k ? 'false' : 'true') + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>' +
      '<div data-pane="text"><div class="hz-text" id="hzResult">' + clean + (last.markLine ? '\n\n<ins>' + esc(last.markLine) + '</ins>' : '') + '</div></div>' +
      '<div data-pane="diff" hidden><div class="hz-text hz-diff">' + dv + '</div></div>' +
      (r.aiAfter && r.aiAfter.sentences ? '<div data-pane="hl" hidden>' + aiText(r.aiAfter) + '</div>' : '') +
      (last.kind === 'fix' ? '<div data-pane="why" hidden><ul class="hz-list">' + (r.applied || []).map(function (a) { return '<li><span class="cat">' + (a.cat ? esc({ 1: '번역투', 2: '상투적 연결어', 3: '빈말 · 과장 수식', 4: '틀에 박힌 도입 · 마무리', 5: '대화창 복사 흔적' }[a.cat]) : '말투') + '</span><b>' + (a.from ? '<s>' + esc(a.from) + '</s> ' : '') + (a.to ? '<ins>' + esc(a.to) + '</ins>' : '<span class="note">(뺌)</span>') + '</b><small>' + esc(a.why) + '</small></li>'; }).join('') + '</ul></div>' +
        '<div data-pane="left" hidden><ul class="hz-list">' + (r.left || []).map(function (a) { return '<li><span class="cat">' + esc(a.catKo) + ' · 문단 ' + (a.i + 1) + '</span>' + (a.t ? '<b>' + esc(a.t) + '</b>' : '') + '<small>' + esc(a.why) + '</small></li>'; }).join('') + '</ul></div>' : '') +
      factsHtml +
      '<div class="hz-row"><button class="btn btn-p" type="button" id="hzCopy"><span>다듬은 글 복사</span></button><button class="btn btn-g" type="button" data-go="again">이 글로 한 번 더 다듬기</button><button class="btn btn-g" type="button" data-go="recheck">다듬은 글 다시 검사</button></div>' +
      (last.markLine ? '<p class="hz-note">AIMarker 마크를 붙였습니다. 마지막 줄은 글의 지문에서 빼고 계산하므로 붙인 채로 올려도 같은 마크로 이어집니다.</p>' :
        '<div class="hz-mark"><label><input type="checkbox" id="hzMarkOn"> 이 글에 AIMarker 표시 붙이기</label><div class="hz-row"><select id="hzMarkLabel" aria-label="AI 사용 정도"><option value="ai_assisted">AI가 도왔어요(AI 보조)</option><option value="ai_edited">AI로 다듬었어요(AI 편집)</option><option value="ai_generated">AI로 썼어요(AI 생성)</option></select><button class="btn btn-g btn-s" type="button" id="hzMarkGo" disabled>표시 붙이기</button></div><p class="hz-note">글은 서버에 남지 않고 지문(해시)과 마크 정보만 남습니다. 확인 주소가 든 한 줄이 글 끝에 붙습니다.</p></div>');
  }
  out.addEventListener('click', function (e) {
    var t = e.target.closest('[data-v]');
    if (t) { var v = t.getAttribute('data-v'); out.querySelectorAll('[data-v]').forEach(function (b) { b.setAttribute('aria-selected', b === t ? 'true' : 'false'); }); out.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== v; }); return; }
    var g = e.target.closest('[data-go]');
    if (g) { var go = g.getAttribute('data-go'); if (go === 'fix') btnF.click(); else if (go === 'pro') btnP.click(); else if (go === 'recheck' && last && last.text) { ta.value = finalText(); count(); btnC.click(); } else if (last && last.text) { ta.value = finalText(); count(); btnF.click(); } return; }
    if (e.target.closest('#hzCopy') && last) { var txt = finalText(); if (AM.copy) AM.copy(txt, e.target.closest('#hzCopy')); else if (navigator.clipboard) navigator.clipboard.writeText(txt); return; }
    if (e.target.closest('#hzMarkGo') && last) markIt(e.target.closest('#hzMarkGo'));
  });
  out.addEventListener('change', function (e) { if (e.target.id === 'hzMarkOn') $('#hzMarkGo').disabled = !e.target.checked; });
  function markIt(btn) {
    if (!AIM || !SEO) return;
    var label = $('#hzMarkLabel').value; btn.disabled = true; btn.textContent = '붙이는 중…';
    AIM.textFeatures(last.text).then(function (f) { return AM.call('am.mark', { features: f, label: label, cid: cid() }, 60000); }).then(function (m) {
      if (!m || !m.ok) throw m || {};
      last.markLine = SEO.sentence(m.label, 'text') + ' (AIMarker 마크 ' + m.id + ' · aimarker.kr/m/?id=' + m.id + ')';
      last.mark = m; paintFix();
    }).catch(function (e2) { btn.disabled = false; btn.textContent = '표시 붙이기'; var p = document.createElement('p'); p.className = 'hz-note'; p.textContent = (e2 && (e2.message || e2.msg)) || '표시를 붙이지 못했어요. 잠시 뒤 다시 시도해 주세요.'; btn.parentNode.parentNode.appendChild(p); });
  }

  /* 출시 알림 */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-hz-notify]'); if (!b) return;
    var f = $('#hzNotify'); if (!f) return;
    f.hidden = false; f.querySelector('[name="plan"]').value = b.getAttribute('data-hz-notify');
    f.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { f.querySelector('[name="contact"]').focus(); }, 350);
  });
  count();
})();
