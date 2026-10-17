/* AIMarker · AI 활용 증빙서 (/proof/) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var TOOLS = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity', '뤼튼', '클로바X', 'DeepL', '기타'];
  var PURPOSES = [
    ['idea', '아이디어 · 주제 탐색', 'brainstorming ideas and topics'], ['research', '자료 조사 · 요약', 'literature search support and summarization'],
    ['draft', '개요 · 초안', 'outlining and drafting'], ['edit', '문장 다듬기 · 맞춤법', 'language editing and proofreading'],
    ['translate', '번역', 'translation'], ['code', '코드 · 데이터 분석', 'coding and data analysis support'],
    ['figure', '그림 · 도표', 'creating figures and diagrams'], ['slides', '발표 자료', 'preparing presentation materials']
  ];
  var CHECKS = [['source', '출처를 직접 찾아 확인'], ['fact', '사실 · 숫자 검증'], ['rewrite', '문장을 직접 고쳐 씀'], ['claim', '결론 · 주장은 직접 작성'], ['mark', '본문에 AI 활용 표기']];
  var LINKS = [
    [/chatgpt\.com\/share|chat\.openai\.com\/share/i, 'ChatGPT'], [/claude\.ai\/share/i, 'Claude'], [/g\.co\/gemini\/share|gemini\.google\.com\/share/i, 'Gemini'],
    [/perplexity\.ai\//i, 'Perplexity'], [/copilot\.microsoft\.com/i, 'Copilot'], [/wrtn\.ai/i, '뤼튼'], [/clova-x\.naver\.com/i, '클로바X']
  ];
  var KIND = {
    assign: { title: '생성형 AI 활용 서면 증빙서', obj: '과제', objT: '과제는', en: 'assignment' },
    thesis: { title: '학위논문 생성형 AI 활용 내역서', obj: '논문', objT: '논문은', en: 'thesis' },
    journal: { title: '생성형 AI 활용 확인서', obj: '원고', objT: '원고는', en: 'manuscript' },
    work: { title: '생성형 AI 활용 내역', obj: '보고서', objT: '보고서는', en: 'report' }
  };
  function chips(box, arr, type, name) {
    arr.forEach(function (x) {
      var v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x;
      var l = document.createElement('label'); l.className = 'pick';
      l.innerHTML = '<input type="' + type + '" name="' + name + '" value="' + v + '"><span>' + t + '</span>';
      $(box).appendChild(l);
    });
  }
  chips('#tools', TOOLS, 'checkbox', 'tool');
  chips('#purposes', PURPOSES, 'checkbox', 'purpose');
  chips('#checks', CHECKS, 'checkbox', 'check');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function checked(name) { return Array.prototype.filter.call(document.querySelectorAll('input[name="' + name + '"]:checked'), function () { return true; }).map(function (i) { return i.value; }); }
  function kdate(s) { if (!s) return ''; var p = s.split('-'); return p[0] + '. ' + Number(p[1]) + '. ' + Number(p[2]) + '.'; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  $('#d1').value = today();

  /* 링크로 도구 고르기 */
  $('#links').addEventListener('input', function () {
    var lines = this.value.split(/\s+/).filter(Boolean);
    lines.forEach(function (u) {
      LINKS.forEach(function (L) { if (L[0].test(u)) { var c = document.querySelector('input[name="tool"][value="' + L[1] + '"]'); if (c) c.checked = true; } });
    });
    render();
  });

  function data() {
    var k = (document.querySelector('input[name="kind"]:checked') || {}).value || 'assign';
    var links = $('#links').value.split(/\s+/).filter(function (u) { return /^https?:\/\/\S{6,}/.test(u); }).slice(0, 8);
    var tools = checked('tool'), ver = $('#ver').value.trim();
    var ps = checked('purpose').map(function (v) { return PURPOSES.filter(function (p) { return p[0] === v; })[0]; });
    var cs = checked('check').map(function (v) { return CHECKS.filter(function (p) { return p[0] === v; })[0][1]; });
    var d1 = $('#d1').value, d2 = $('#d2').value;
    return {
      k: KIND[k], kind: k, links: links, tools: tools, ver: ver, ps: ps, cs: cs,
      when: d1 ? (d2 && d2 !== d1 ? kdate(d1) + ' ~ ' + kdate(d2) : kdate(d1)) : '',
      scope: $('#scope').value.trim(), who: $('#who').value.trim(), org: $('#org').value.trim(), course: $('#course').value.trim(), title: $('#title').value.trim()
    };
  }
  function toolTxt(d) { return (d.tools.length ? d.tools.join(', ') : '(도구를 골라 주세요)') + (d.ver ? ' · 버전 ' + d.ver : ''); }
  function render() {
    var d = data(), dash = '<span class="ph">적지 않음</span>';
    var pTxt = d.ps.length ? d.ps.map(function (p) { return p[1]; }).join(', ') : '';
    var rows = [
      ['제출자', d.who || d.org ? esc([d.who, d.org].filter(Boolean).join(' · ')) : dash],
      ['제출처', d.course ? esc(d.course) : dash], ['제출물', d.title ? esc(d.title) : dash],
      ['사용 도구', esc(toolTxt(d))], ['사용 일시', esc(d.when) || dash],
      ['활용 목적', pTxt ? esc(pTxt) : dash], ['활용 범위', d.scope ? esc(d.scope) : dash],
      ['대화 기록', d.links.length ? d.links.map(function (u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u) + '</a>'; }).join('<br>') : dash],
      ['직접 확인 · 수정', d.cs.length ? esc(d.cs.join(', ')) : dash]
    ];
    $('#docOut').innerHTML = '<h3>' + d.k.title + '</h3><table>' + rows.map(function (r) { return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</table>' +
      '<p class="mt12">위 내용은 사실과 같으며, 생성형 AI가 만든 결과를 그대로 제출하지 않고 직접 검증 · 수정했음을 확인합니다.</p>' +
      '<p class="sign">' + kdate(today()) + '<br>작성자 ' + (d.who ? esc(d.who) : '__________') + ' (서명)</p>';
    var pKo = pTxt || '자료 정리';
    var pEn = d.ps.length ? d.ps.map(function (p) { return p[2]; }).join(', ') : 'supporting the writing process';
    var tEn = (d.tools.length ? d.tools.map(function (t) { return t === '뤼튼' ? 'Wrtn' : t === '클로바X' ? 'CLOVA X' : t === '기타' ? 'other AI tools' : t; }).join(', ') : '[AI tool]') + (d.ver ? ' (version: ' + d.ver + ')' : '');
    $('#declOut').innerHTML = '<p><b>생성형 AI 활용 선언</b></p><p>본 ' + d.k.obj + '의 작성 과정에서 저자는 ' + esc(pKo) + '에 생성형 AI(사용 도구: ' + esc(toolTxt(d)) + ')를 활용하였다. 활용 뒤 저자는 그 내용을 직접 검토 · 검증 · 수정하였으며, 최종 내용에 대한 모든 책임은 저자에게 있다.</p>' +
      '<p class="en mt16"><b>Declaration of generative AI use</b></p><p class="en">In preparing this ' + d.k.en + ', the author(s) used ' + esc(tEn) + ' for ' + esc(pEn) + '. The author(s) reviewed, verified and revised all AI-assisted output and take full responsibility for the final content.</p>' +
      (d.kind === 'journal' || d.kind === 'thesis' ? '<p class="note mt12">학술지는 보통 이 선언을 참고문헌 바로 위에 따로 두라고 안내합니다. 투고 규정을 확인하세요.</p>' : '<p class="note mt12">제출물 끝이나 첫 페이지 아래에 붙이세요. 제출처가 정한 형식이 있으면 그 형식을 따르세요.</p>');
    $('#noteOut').innerHTML = '<p>본 ' + d.k.objT + ' ' + esc(pKo) + '에 생성형 AI(사용 도구: ' + esc(toolTxt(d)) + ')를 활용하였으며' + (d.when ? '(' + esc(d.when) + ')' : '') + ', 결과는 작성자가 직접 검증 · 수정하였다.' + (d.links.length ? ' 대화 기록: ' + d.links.map(esc).join(', ') : '') + '</p>';
    save();
  }
  /* 이 브라우저에만 잠시 저장(새로고침해도 이어 쓰기) */
  var KEY = 'aimarker.proof.v1';
  function save() {
    try {
      var s = { links: $('#links').value, ver: $('#ver').value, scope: $('#scope').value, who: $('#who').value, org: $('#org').value, course: $('#course').value, title: $('#title').value,
        tool: checked('tool'), purpose: checked('purpose'), check: checked('check'), kind: (document.querySelector('input[name="kind"]:checked') || {}).value };
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) { /* 무시 */ }
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!s) return;
      ['links', 'ver', 'scope', 'who', 'org', 'course', 'title'].forEach(function (k) { if (s[k]) $('#' + k).value = s[k]; });
      if (!s.tool && s.tools) s.tool = s.tools;
      ['tool', 'purpose', 'check'].forEach(function (n) { (s[n] || []).forEach(function (v) { var c = document.querySelector('input[name="' + n + '"][value="' + v + '"]'); if (c) c.checked = true; }); });
      if (s.kind) { var r = document.querySelector('input[name="kind"][value="' + s.kind + '"]'); if (r) r.checked = true; }
    } catch (e) { /* 무시 */ }
  }
  load();
  document.querySelector('.tool-wrap').addEventListener('input', render);
  document.querySelector('.tool-wrap').addEventListener('change', render);
  $('#copyBtn').addEventListener('click', function () {
    var pane = document.querySelector('#outTabs .tabpane.on .doc').cloneNode(true);
    Array.prototype.forEach.call(pane.querySelectorAll('.ph'), function (x) { x.textContent = ''; });
    Array.prototype.forEach.call(pane.querySelectorAll('.note'), function (x) { x.remove(); });
    pane.style.cssText = 'position:fixed;left:-9999px;top:0;max-height:none'; document.body.appendChild(pane);
    var txt = pane.innerText.replace(/\n{3,}/g, '\n\n').trim(); pane.remove();
    window.AM.copy(txt, this);
  });
  $('#printBtn').addEventListener('click', function () { window.print(); });
  if ($('#mCopy')) $('#mCopy').addEventListener('click', function () { $('#copyBtn').click(); var b = this, sp = b.querySelector('span'); sp.textContent = '복사했어요'; setTimeout(function () { sp.textContent = '복사'; }, 1600); });
  render();
})();
