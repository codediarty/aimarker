/* AIMarker · 사이트 표시 만들기 (/site/) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var USES = [
    ['text', '글 · 상품 설명'], ['image', '이미지'], ['video', '영상 · 음성'], ['chat', '상담 챗봇'],
    ['recommend', '추천'], ['translate', '번역 · 요약'], ['analysis', '분석 · 자동화'], ['virtual', '가상인물(광고 모델)']
  ];
  var BIZ = [
    ['shop', '쇼핑몰 · 브랜드', ['text', 'image', 'chat'], 'all'],
    ['clinic', '병원 · 의원 · 약국', ['text', 'chat'], 'all'],
    ['edu', '학원 · 교육', ['text', 'image'], 'all'],
    ['food', '음식점 · 카페', ['image', 'text'], 'all'],
    ['pro', '법률 · 세무 · 부동산', ['text', 'analysis'], 'important'],
    ['public', '기관 · 학교 · 공공', ['text', 'translate'], 'important'],
    ['media', '미디어 · 블로그 · 크리에이터', ['text', 'image', 'video'], 'all'],
    ['it', 'IT · 스타트업', ['text', 'chat', 'recommend', 'analysis'], 'all'],
    ['etc', '기타', ['text'], 'all']
  ];
  var PLATFORM_TAB = { imweb: 'imweb', cafe24: 'cafe24', wordpress: 'wordpress', godo: 'godo', shopify: 'shopify', wix: 'wix', smartstore: 'nocode', naverblog: 'nocode', tistory: 'other',
    makeshop: 'other', sixshop: 'other', squarespace: 'other', webflow: 'other', framer: 'other', oopy: 'other' };
  var useBox = $('#useChips'), bizBox = $('#bizChips');

  USES.forEach(function (u) {
    var l = document.createElement('label'); l.className = 'pick';
    l.innerHTML = '<input type="checkbox" value="' + u[0] + '"><span>' + u[1] + '</span>';
    useBox.appendChild(l);
  });
  BIZ.forEach(function (b, i) {
    var l = document.createElement('label'); l.className = 'pick';
    l.innerHTML = '<input type="radio" name="biz" value="' + b[0] + '"' + (i === 0 ? ' checked' : '') + '><span>' + b[1] + '</span>';
    bizBox.appendChild(l);
  });

  function setUses(list) {
    Array.prototype.forEach.call(useBox.querySelectorAll('input'), function (c) { c.checked = list.indexOf(c.value) >= 0; });
  }
  function applyBiz(key) {
    var b = BIZ.filter(function (x) { return x[0] === key; })[0] || BIZ[0];
    setUses(b[2]); $('#review').value = b[3];
    update();
  }
  bizBox.addEventListener('change', function (e) { if (e.target.name === 'biz') applyBiz(e.target.value); });

  function cfg() {
    var uses = Array.prototype.filter.call(useBox.querySelectorAll('input'), function (c) { return c.checked; }).map(function (c) { return c.value; });
    var d = new Date(), ym = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    return {
      name: $('#name').value.trim(), use: uses.join(','), level: $('#level').value, review: $('#review').value,
      privacy: $('#privacy').checked ? '1' : '', contact: $('#contact').value.trim(), style: $('#style').value,
      side: $('#side').value, theme: $('#theme').value, date: ym, auto: $('#autotag') ? $('#autotag').checked : true
    };
  }
  function attrEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function code(c) {
    var a = [];
    if (c.name) a.push('data-name="' + attrEsc(c.name) + '"');
    a.push('data-use="' + (c.use || 'text') + '"');
    if (c.level) a.push('data-level="' + c.level + '"');
    if (c.review) a.push('data-review="' + c.review + '"');
    if (c.privacy) a.push('data-privacy="1"');
    if (c.contact) a.push('data-contact="' + attrEsc(c.contact) + '"');
    if (c.style !== 'badge') a.push('data-style="' + c.style + '"');
    if (c.side === 'right') a.push('data-side="right"');
    if (c.theme === 'dark') a.push('data-theme="dark"');
    if (c.auto === false) a.push('data-auto="0"');
    a.push('data-date="' + c.date + '"');
    return '<script src="https://aimarker.kr/m.js" ' + a.join(' ') + ' async></script>';
  }
  var USE_TXT = {
    text: '글 · 상품 설명을 쓸 때 AI의 도움을 받았습니다', image: '일부 이미지는 AI로 만들거나 다듬었습니다', video: '일부 영상 · 음성은 AI로 만들거나 편집했습니다',
    chat: '문의 답변 일부는 AI가 씁니다', recommend: '추천에 AI를 사용합니다', translate: '번역 · 요약에 AI를 사용했습니다', analysis: '분석 · 업무 자동화에 AI를 사용합니다', virtual: 'AI로 만든 가상인물이 나옵니다'
  };
  function plainText(c) {
    var parts = (c.use || 'text').split(',').map(function (k) { return USE_TXT[k]; }).filter(Boolean);
    var rv = c.review === 'all' ? ' AI 결과물은 담당자가 확인한 뒤 게시합니다.' : c.review === 'important' ? ' 중요한 안내는 담당자가 직접 확인합니다.' : '';
    return '[AI 활용 안내] ' + (c.name ? c.name + ': ' : '') + parts.join(', ') + '.' + rv + ' (AIMarker 표시 기준)';
  }

  var prev = $('#preview'), host = null;
  function update() {
    var c = cfg();
    $('#codeOut').textContent = code(c);
    $('#textOut').textContent = plainText(c);
    if (host && host.parentNode) host.parentNode.removeChild(host);
    if (window.AIMarker && window.AIMarker.render) {
      host = window.AIMarker.render(c, prev);
      if (host.__open) host.__open(true);
      fitPreview();
    }
  }
  /* 안내 창 높이에 맞춰 미리보기 틀 높이 맞추기 */
  function fitPreview() {
    var pop = host && host.shadowRoot && host.shadowRoot.querySelector('.pop');
    var h = pop ? pop.offsetHeight : 0;
    prev.style.height = Math.max(400, h + (cfg().style === 'line' ? 112 : 92)) + 'px';
  }
  window.addEventListener('resize', function () { clearTimeout(fitPreview.t); fitPreview.t = setTimeout(update, 200); });

  /* 담당자에게 메일로 보내기 */
  $('#mailCode').addEventListener('click', function (e) {
    e.preventDefault();
    var tab = document.querySelector('#install .tabs button[aria-selected="true"]');
    var pane = document.querySelector('#install .tabpane.on');
    var body = '안녕하세요. 우리 사이트에 \'AI 활용 안내\' 표시를 붙이려고 합니다.\n모든 페이지에 공통으로 들어가는 곳(</body> 바로 위)에 아래 한 줄을 넣어 주세요.\n\n' + $('#codeOut').textContent +
      '\n\n[' + (tab ? tab.textContent : '설치') + ' 기준 넣는 곳]\n' + (pane ? pane.innerText.replace(/\n{2,}/g, '\n').trim() : '') + '\n\n표시 만들기: https://aimarker.kr/site/';
    location.href = 'mailto:?subject=' + encodeURIComponent('[요청] 사이트에 AI 활용 안내 코드 넣기') + '&body=' + encodeURIComponent(body);
  });

  ['#name', '#contact'].forEach(function (s) { $(s).addEventListener('input', update); });
  ['#review', '#level', '#style', '#side', '#theme', '#privacy', '#autotag'].forEach(function (s) { $(s).addEventListener('change', update); });
  useBox.addEventListener('change', update);

  /* 자동 진단 */
  var out = $('#scanOut');
  function escH(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function showScan(html, cls) { out.hidden = false; out.innerHTML = '<div class="callout' + (cls ? ' ' + cls : '') + '">' + html + '</div>'; }
  $('#scanForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var url = $('#scanUrl').value.trim();
    if (!/^(https?:\/\/)?[^\s\/?#:@]+\.[^\s\/?#:@]{2,}(\/\S*)?$/i.test(url)) { showScan('<span>사이트 주소를 확인해 주세요. 예: myshop.co.kr</span>', 'a'); return; }
    var btn = $('#scanBtn'); btn.disabled = true; btn.querySelector('span').textContent = '찾는 중…';
    showScan('<span>첫 화면을 읽고 있어요. 10초 정도 걸립니다.</span>');
    window.AM.call('am.scan', { url: url }, 45000).then(function (r) {
      if (!r || !r.ok) { showScan('<span>' + ((r && r.message) || '진단하지 못했어요. 업종을 고르면 바로 만들 수 있어요.') + '</span>', 'a'); return; }
      var lines = [];
      if (r.platform && r.platform.name) lines.push('<b>' + escH(r.platform.name) + '</b>(으)로 만든 사이트로 보여요. 설치 방법을 맞춰 두었습니다.');
      if (r.labeled) lines.push('이미 AI 마크가 붙어 있어요. 새 코드로 바꿔 붙이면 됩니다.');
      if (r.chat && r.chat.length) lines.push(r.chatAi ? 'AI 상담 창(' + r.chat.map(escH).join(', ') + ')이 보여 \'상담 챗봇\'을 켜 두었어요.' : '상담 창(' + r.chat.map(escH).join(', ') + ')이 있어요. AI가 답한다면 \'상담 챗봇\'도 켜 주세요.');
      if (r.images && r.images.checked) lines.push('이미지 ' + r.images.checked + '장을 확인했고 ' + (r.images.ai ? '<b>' + r.images.ai + '장에서 AI 생성 기록</b>을 찾았어요.' : 'AI 생성 기록은 없었어요(올릴 때 기록이 지워지는 경우가 많아요).') + (r.images.c2pa ? ' 출처 정보(C2PA)가 든 이미지도 ' + r.images.c2pa + '장 있어요.' : ''));
      if (r.cues && r.cues.length) lines.push('페이지에서 \'' + r.cues.slice(0, 3).map(escH).join('\', \'') + '\' 같은 말을 찾았어요.');
      if (!lines.length) lines.push('특별한 AI 흔적은 찾지 못했어요. 업종에 맞춘 기본값으로 채웠습니다.');
      if (r.suggest && r.suggest.uses && r.suggest.uses.length) {
        var cur = cfg().use.split(',').filter(Boolean);
        r.suggest.uses.forEach(function (k) { if (cur.indexOf(k) < 0) cur.push(k); });
        setUses(cur);
      }
      if (r.siteName && !$('#name').value) $('#name').value = r.siteName.slice(0, 30);
      if (r.platform && PLATFORM_TAB[r.platform.key]) window.AM.selectTab($('#install'), PLATFORM_TAB[r.platform.key]);
      update();
      showScan('<div>' + lines.map(function (l) { return '<div style="margin:2px 0">· ' + l + '</div>'; }).join('') + '<div class="note mt8">맞지 않는 항목은 아래에서 끄면 됩니다.</div></div>', 'm');
    }).catch(function () {
      showScan('<span>지금은 자동 진단이 어려워요. 업종을 고르면 바로 만들 수 있어요.</span>', 'a');
    }).finally(function () { btn.disabled = false; btn.querySelector('span').textContent = '자동으로 채우기'; });
  });

  function start() {
    applyBiz('shop');
    /* 홈 무료 진단에서 넘어온 주소: ?url=myshop.co.kr → 바로 자동 채우기 */
    var u = new URLSearchParams(location.search).get('url');
    if (u && /^(https?:\/\/)?[^\s\/?#:@]+\.[^\s\/?#:@]{2,}(\/\S*)?$/i.test(u.trim())) {
      $('#scanUrl').value = u.trim().slice(0, 200);
      var f = $('#scanForm');
      if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }
  if (window.AIMarker) start(); else window.addEventListener('load', start);
})();
