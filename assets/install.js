/* AIMarker 설치 마법사(/site/) 10.0: 고른 대로 예시 사이트 미리보기와 코드 한 줄 */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var root = document.body.getAttribute('data-root') || '';
  var USES = [['text', '글 · 상품 설명'], ['image', '이미지'], ['video', '영상 · 음성'], ['chat', '상담 챗봇'], ['recommend', '추천'], ['translate', '번역 · 요약'], ['analysis', '분석 · 자동화'], ['virtual', '가상인물(광고 모델)']];
  var BIZ = [
    ['shop', '쇼핑몰 · 브랜드', ['text', 'image', 'chat'], 'all'], ['clinic', '병원 · 의원 · 약국', ['text', 'chat'], 'all'], ['edu', '학원 · 교육', ['text', 'image'], 'all'],
    ['food', '음식점 · 카페', ['image', 'text'], 'all'], ['pro', '법률 · 세무 · 부동산', ['text', 'analysis'], 'important'], ['public', '기관 · 학교 · 공공', ['text', 'translate'], 'important'],
    ['media', '미디어 · 블로그 · 크리에이터', ['text', 'image', 'video'], 'all'], ['it', 'IT · AI 서비스', ['text', 'chat', 'recommend', 'analysis'], 'all'], ['etc', '기타', ['text'], 'all']
  ];
  var PLAT = [
    ['imweb', '아임웹', ['관리자 화면 <b>환경 설정 → SEO 및 고급 설정 → 코드 삽입</b>으로 갑니다.', '<b>바디(Body) 코드</b> 칸 맨 아래에 붙여 넣고 저장합니다.', '사이트를 새로 고침해 화면 아래 \'AI 활용 안내\' 배지가 보이면 끝입니다.']],
    ['cafe24', '카페24', ['쇼핑몰 관리자 <b>디자인 → 디자인 편집</b>에서 공통 레이아웃(layout.html)을 엽니다.', '<code>&lt;/body&gt;</code> 바로 위에 붙여 넣고 저장합니다.', '모바일 디자인을 따로 쓰면 모바일 레이아웃에도 한 번 더 넣습니다.']],
    ['wordpress', '워드프레스', ['코드 삽입 플러그인(예: WPCode)의 <b>Footer</b> 칸에 붙여 넣는 방법이 가장 안전합니다.', '테마를 직접 고친다면 footer.php의 <code>&lt;/body&gt;</code> 바로 위에 넣습니다.']],
    ['godo', '고도몰', ['<b>디자인 → 디자인 편집</b>에서 하단 공통 영역(footer)을 엽니다.', '맨 아래에 붙여 넣고 저장합니다. 모바일 스킨에도 한 번 더 넣습니다.']],
    ['sixshop', '식스샵', ['관리자 화면에서 <b>스크립트(코드) 삽입</b> 메뉴를 찾아 모든 페이지 하단(바디 끝)에 붙여 넣습니다.', '메뉴 이름은 버전에 따라 조금 다를 수 있습니다. 막히면 설치 대행을 맡겨 주세요.']],
    ['makeshop', '메이크샵', ['<b>디자인 관리</b>에서 공통 하단(바닥) 영역 편집을 엽니다.', '맨 아래에 붙여 넣고 저장합니다. 모바일 디자인에도 한 번 더 넣습니다.']],
    ['gtm', '구글 태그 매니저', ['<b>태그 → 새로 만들기 → 맞춤 HTML</b>을 고르고 코드 한 줄을 붙여 넣습니다.', '트리거는 <b>All Pages(모든 페이지)</b>로 정하고 저장한 뒤 <b>제출(게시)</b>합니다.']],
    ['gnuboard', '그누보드', ['<b>관리자 → 환경설정 → 기본환경설정</b>의 <b>추가 스크립트</b> 칸에 붙여 넣고 저장합니다.']],
    ['shopify', '쇼피파이', ['<b>온라인 스토어 → 테마 → 코드 편집</b>에서 theme.liquid를 엽니다.', '<code>&lt;/body&gt;</code> 바로 위에 붙여 넣고 저장합니다.']],
    ['wix', '윅스', ['<b>설정 → 사용자 지정 코드 → 코드 추가</b>를 누릅니다.', '적용 범위는 모든 페이지, 위치는 Body 끝(end)으로 정하고 붙여 넣습니다.']],
    ['other', '직접 만든 사이트', ['모든 페이지에 공통으로 들어가는 HTML의 <code>&lt;/body&gt;</code> 바로 위에 붙여 넣으세요.', 'React, Vue 같은 앱도 index.html에 한 번 넣으면 화면이 바뀔 때마다 알아서 다시 찾습니다.']],
    ['nocode', '스마트스토어 · 블로그', ['코드를 넣을 수 없는 곳은 이미지 파일에 직접 AI 마크를 넣어 올리세요: <a href="' + root + 'mark/">파일 AI 마킹</a>.', '상세 설명 첫머리에는 아래 문구를 붙이세요.<div class="k-scan-out" id="plainTxt" style="margin-top:8px"></div>']]
  ];
  var PLATFORM_TAB = { imweb: 'imweb', cafe24: 'cafe24', wordpress: 'wordpress', godo: 'godo', shopify: 'shopify', wix: 'wix', smartstore: 'nocode', naverblog: 'nocode', tistory: 'other', makeshop: 'makeshop', sixshop: 'sixshop', squarespace: 'other', webflow: 'other', framer: 'other', oopy: 'other', gnuboard: 'gnuboard' };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  /* 고르기 칸 만들기 */
  var useBox = $('#useChips'), bizBox = $('#bizChips');
  USES.forEach(function (u) { var l = document.createElement('label'); l.innerHTML = '<input type="checkbox" value="' + u[0] + '"><span>' + u[1] + '</span>'; useBox.appendChild(l); });
  BIZ.forEach(function (b, i) { var l = document.createElement('label'); l.innerHTML = '<input type="radio" name="biz" value="' + b[0] + '"' + (i === 0 ? ' checked' : '') + '><span>' + b[1] + '</span>'; bizBox.appendChild(l); });
  var tabs = $('#ptabs'), panes = $('#ppanes');
  PLAT.forEach(function (p, i) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === 0 ? 'true' : 'false'); b.setAttribute('data-k', p[0]); b.textContent = p[1]; tabs.appendChild(b);
    var d = document.createElement('div'); d.className = 'k-ppane' + (i === 0 ? ' on' : ''); d.setAttribute('data-k', p[0]); d.setAttribute('role', 'tabpanel');
    d.innerHTML = '<ol>' + p[2].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>'; panes.appendChild(d);
  });
  function selTab(k) {
    Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute('aria-selected', b.getAttribute('data-k') === k ? 'true' : 'false'); });
    Array.prototype.forEach.call(panes.children, function (d) { d.classList.toggle('on', d.getAttribute('data-k') === k); });
  }
  tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) selTab(b.getAttribute('data-k')); });
  function syncOn(box) { Array.prototype.forEach.call(box.querySelectorAll('label'), function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); }); }
  function setUses(list) { Array.prototype.forEach.call(useBox.querySelectorAll('input'), function (c) { c.checked = list.indexOf(c.value) >= 0; }); syncOn(useBox); }
  function applyBiz(key) { var b = BIZ.filter(function (x) { return x[0] === key; })[0] || BIZ[0]; setUses(b[2]); $('#review').value = b[3]; syncOn(bizBox); update(); }
  bizBox.addEventListener('change', function (e) { if (e.target.name === 'biz') applyBiz(e.target.value); });

  function val(id) { var el = $(id); return el ? String(el.value || '').trim() : ''; }
  function radio(name) { var el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function cfg() {
    var d = new Date();
    return {
      name: val('#name'), use: Array.prototype.filter.call(useBox.querySelectorAll('input'), function (c) { return c.checked; }).map(function (c) { return c.value; }).join(','),
      level: val('#level'), review: $('#review').value, privacy: $('#privacy').checked, contact: val('#contact'), style: $('#style').value, side: $('#side').value, theme: $('#theme').value,
      date: d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2), tag: radio('tag') || 'tag', pos: radio('pos') || 'tl', tt: $('#tagTheme').value, motion: $('#tagMotion') ? $('#tagMotion').value : '',
      meta: $('#optMeta').checked ? ($('#optCdn').checked ? 'all' : '') : '0', alt: $('#optAlt').checked, ld: $('#optLd').checked,
      gen: val('#ruleGen'), edit: val('#ruleEdit'), text: val('#ruleText'), path: val('#rulePath'), site: val('#siteId').toUpperCase().replace(/[^A-Z0-9\-]/g, '')
    };
  }
  function code(c) {
    var a = [];
    if (c.name) a.push('data-name="' + attr(c.name) + '"');
    if (c.use && c.use !== 'text') a.push('data-use="' + c.use + '"');
    if (c.level) a.push('data-level="' + c.level + '"');
    if (c.review) a.push('data-review="' + c.review + '"');
    if (c.privacy) a.push('data-privacy="1"');
    if (c.contact) a.push('data-contact="' + attr(c.contact) + '"');
    if (c.style !== 'badge') a.push('data-style="' + c.style + '"');
    if (c.side === 'right') a.push('data-side="right"');
    if (c.theme === 'dark') a.push('data-theme="dark"');
    if (c.tag !== 'tag') a.push('data-tag="' + c.tag + '"');
    if (c.pos !== 'tl') a.push('data-pos="' + c.pos + '"');
    if (c.tt === 'light') a.push('data-tag-theme="light"');
    if (c.motion === '0') a.push('data-motion="0"');
    if (c.meta) a.push('data-meta="' + c.meta + '"');
    if (!c.alt) a.push('data-alt="0"');
    if (!c.ld) a.push('data-ld="0"');
    if (c.gen) a.push('data-ai-gen="' + attr(c.gen) + '"');
    if (c.edit) a.push('data-ai-edit="' + attr(c.edit) + '"');
    if (c.text) a.push('data-ai-text="' + attr(c.text) + '"');
    if (c.path) a.push('data-ai-path="' + attr(c.path) + '"');
    if (c.site) a.push('data-site="' + attr(c.site) + '"');
    a.push('data-date="' + c.date + '"');
    return '<script src="https://aimarker.kr/m.js" ' + a.join(' ') + ' async></script>';
  }
  var USE_TXT = { text: '글과 상품 설명을 쓸 때 AI의 도움을 받습니다.', image: '일부 이미지는 AI로 만들거나 다듬습니다.', video: '일부 영상과 음성은 AI로 만들거나 편집합니다.', chat: '문의 답변의 일부는 AI가 작성합니다.', recommend: '상품 추천에 AI를 사용합니다.', translate: '번역과 요약에 AI를 사용합니다.', analysis: '분석과 업무 자동화에 AI를 사용합니다.', virtual: 'AI로 만든 가상인물이 나옵니다.' };
  function plainText(c) {
    var parts = (c.use || 'text').split(',').map(function (k) { return USE_TXT[k]; }).filter(Boolean);
    var rv = c.review === 'all' ? ' AI 결과물은 담당자가 확인한 뒤 게시합니다.' : c.review === 'important' ? ' 중요한 안내는 담당자가 직접 확인합니다.' : '';
    return '[' + (c.name ? c.name + '의 ' : '') + 'AI 활용 안내] ' + parts.join(' ') + rv + ' (AIMarker 표시 기준)';
  }
  var fr = $('#prevFrame'), frBase = fr.getAttribute('src').split('?')[0], frVer = (fr.getAttribute('src').match(/[?&]v=([\w.-]+)/) || [])[1] || '', frT = 0, lastQ = '';
  function frameQ(c) {
    var q = ['embed=1'];
    if (frVer) q.push('v=' + frVer);
    if (c.tag !== 'tag') q.push('tag=' + c.tag); if (c.pos !== 'tl') q.push('pos=' + c.pos); if (c.tt === 'light') q.push('tt=light'); if (c.motion === '0') q.push('motion=0');
    if (c.style !== 'badge') q.push('style=' + c.style); q.push('side=' + (c.side === 'right' ? 'right' : 'left')); if (c.theme === 'dark') q.push('theme=dark');
    return q.join('&');
  }
  function update() {
    var c = cfg();
    $('#codeOut').textContent = code(c);
    var pt = $('#plainTxt'); if (pt) pt.textContent = plainText(c);
    var q = frameQ(c);
    if (q !== lastQ) { lastQ = q; clearTimeout(frT); frT = setTimeout(function () { fr.src = frBase + '?' + q; }, 250); }
    var u = val('#siteUrl'), cl = $('#checkLink');
    if (u && /^(https?:\/\/)?[^\s\/?#:@]+\.[^\s\/?#:@]{2,}/i.test(u)) { cl.hidden = false; cl.href = (/^https?:/i.test(u) ? u : 'https://' + u).replace(/#.*$/, '') + (u.indexOf('?') > 0 ? '&' : '?') + 'aimarker=check'; }
    else cl.hidden = true;
    ['#tagOpts', '#posOpts'].forEach(function (s) { syncOn($(s)); });
    syncOn(useBox);
  }
  document.getElementById('wz').addEventListener('input', function (e) { if (e.target.id !== 'siteUrl') update(); else update(); });
  document.getElementById('wz').addEventListener('change', update);

  /* 미리보기 크기 */
  Array.prototype.forEach.call(document.querySelectorAll('#prev [data-w]'), function (b) {
    b.addEventListener('click', function () {
      var mo = b.getAttribute('data-w') === 'mo';
      Array.prototype.forEach.call(document.querySelectorAll('#prev [data-w]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      fr.style.width = mo ? 'min(390px, 100%)' : '100%'; fr.style.margin = mo ? '0 auto' : '0'; $('#prevBody').style.background = mo ? '#EEF1F6' : '';
    });
  });

  /* 복사 · 메일 */
  /* 11.0: 휴대폰 아래 고정 줄의 '코드 복사'는 위의 복사 단추와 같은 일 */
  document.addEventListener('click', function (e) { var px = e.target.closest && e.target.closest('[data-copyproxy]'); if (px) { e.preventDefault(); $('#copyBtn').click(); var sp = px.querySelector('span'); if (sp) { sp.textContent = '복사했어요'; setTimeout(function () { sp.textContent = '코드 복사'; }, 1600); } } });
  $('#copyBtn').addEventListener('click', function () {
    var b = this, t = $('#codeOut').textContent;
    function done() { b.classList.add('done'); b.querySelector('span').textContent = '복사했어요'; setTimeout(function () { b.classList.remove('done'); b.querySelector('span').textContent = '복사'; }, 1600); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, function () { if (window.AM && window.AM.copy) window.AM.copy(t); done(); });
    else { if (window.AM && window.AM.copy) window.AM.copy(t); done(); }
  });
  $('#mailCode').addEventListener('click', function () {
    var tab = tabs.querySelector('[aria-selected="true"]'), pane = panes.querySelector('.k-ppane.on');
    var body = '안녕하세요. 우리 사이트에 AIMarker AI 마크를 붙이려고 합니다.\n모든 페이지에 공통으로 들어가는 곳(</body> 바로 위)에 아래 한 줄을 넣어 주세요.\n\n' + $('#codeOut').textContent +
      '\n\n[' + (tab ? tab.textContent : '설치') + ' 기준 넣는 곳]\n' + (pane ? pane.innerText.trim() : '') + '\n\n넣은 뒤 주소 뒤에 ?aimarker=check 를 붙여 열면 무엇이 표시됐는지 확인할 수 있습니다.\n설치 마법사: https://aimarker.kr/site/';
    location.href = 'mailto:?subject=' + encodeURIComponent('[요청] 사이트에 AIMarker AI 마킹 코드 넣기') + '&body=' + encodeURIComponent(body);
  });

  /* 주소로 자동 채우기(서버가 공개된 첫 화면만 읽음, 저장하지 않음) */
  var out = $('#scanOut');
  function showScan(html, cls) { out.hidden = false; out.className = 'k-scan-out' + (cls ? ' ' + cls : ''); out.innerHTML = html; }
  $('#scanForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var url = val('#siteUrl');
    if (!/^(https?:\/\/)?[^\s\/?#:@]+\.[^\s\/?#:@]{2,}(\/\S*)?$/i.test(url)) { showScan('사이트 주소를 확인해 주세요. 예: myshop.co.kr', 'err'); return; }
    var btn = $('#scanBtn'); btn.disabled = true; btn.querySelector('span').textContent = '찾는 중…';
    showScan('첫 화면을 읽고 있어요. 10초 정도 걸립니다.');
    if (!window.AM || !window.AM.call) { showScan('지금은 자동 채우기를 쓸 수 없어요. 업종만 골라도 됩니다.', 'err'); btn.disabled = false; return; }
    window.AM.call('am.scan', { url: url }, 45000).then(function (r) {
      if (!r || !r.ok) { showScan(esc((r && r.message) || '읽지 못했어요. 업종만 골라도 바로 만들 수 있어요.'), 'err'); return; }
      var lines = [];
      if (r.platform && r.platform.name) lines.push('<b>' + esc(r.platform.name) + '</b>(으)로 만든 사이트로 보여요. 설치 방법을 맞춰 두었습니다.');
      if (r.labeled) lines.push('이미 AI 마크가 붙어 있어요. 새 코드로 바꿔 붙이면 됩니다.');
      if (r.chat && r.chat.length) lines.push(r.chatAi ? 'AI 상담 창(' + r.chat.map(esc).join(', ') + ')이 보여 \'상담 챗봇\'을 켜 두었어요.' : '상담 창(' + r.chat.map(esc).join(', ') + ')이 있어요. AI가 답한다면 \'상담 챗봇\'도 켜 주세요.');
      if (r.images && r.images.checked) lines.push('이미지 ' + r.images.checked + '장을 확인했고 ' + (r.images.ai ? '<b>' + r.images.ai + '장에서 AI 생성 기록</b>을 찾았어요. 설치하면 자동으로 표시됩니다.' : 'AI 생성 기록은 없었어요(올릴 때 기록이 지워지는 경우가 많아요). 필요하면 위치 규칙을 더하세요.'));
      if (r.cues && r.cues.length) lines.push('페이지에서 \'' + r.cues.slice(0, 3).map(esc).join('\', \'') + '\' 같은 말을 찾았어요.');
      if (!lines.length) lines.push('특별한 AI 흔적은 찾지 못했어요. 업종에 맞춘 기본값으로 채웠습니다.');
      if (r.suggest && r.suggest.uses && r.suggest.uses.length) { var cur = cfg().use.split(',').filter(Boolean); r.suggest.uses.forEach(function (k) { if (cur.indexOf(k) < 0) cur.push(k); }); setUses(cur); }
      if (r.siteName && !val('#name')) $('#name').value = String(r.siteName).slice(0, 30);
      if (r.platform && PLATFORM_TAB[r.platform.key]) selTab(PLATFORM_TAB[r.platform.key]);
      update();
      showScan(lines.map(function (l) { return '<div>· ' + l + '</div>'; }).join(''), 'ok');
    }).catch(function () { showScan('지금은 자동 채우기가 어려워요. 업종만 골라도 바로 만들 수 있어요.', 'err'); })
      .finally(function () { btn.disabled = false; btn.querySelector('span').textContent = '자동으로 채우기'; });
  });

  applyBiz('shop');
  var u = new URLSearchParams(location.search).get('url');
  if (u && /^(https?:\/\/)?[^\s\/?#:@]+\.[^\s\/?#:@]{2,}(\/\S*)?$/i.test(u.trim())) {
    $('#siteUrl').value = u.trim().slice(0, 200);
    var f = $('#scanForm'); if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true }));
  }
})();
