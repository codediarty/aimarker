/*! AIMarker 자동 표시 3.0 · https://aimarker.kr/label/
 * 코드 한 줄이면 사이트 속 AI 생성물(이미지 · 영상 · 배경 · 글)에 AIMarker 지문 마크가 자동으로 붙습니다.
 *
 *   <script src="https://aimarker.kr/m.js" data-name="회사 이름" async></script>
 *
 * 무엇을 찾나(모두 이 브라우저 안에서, 밖으로 보내는 것 없음 · 쿠키 없음 · 방문 기록 없음)
 *   1) 운영자 표시   <img data-ai="generated|edited|assisted|virtual|none">, 글 묶음 data-ai="text"
 *   2) 운영자 규칙   data-ai-gen=".ai-gallery, .hero img" · data-ai-edit · data-ai-virtual · data-ai-text · data-ai-path="/ai/, /event/*"
 *   3) 파일 속 기록  C2PA 출처 기록 · IPTC 디지털 출처 유형 · XMP 제작 도구 · PNG 생성 정보(같은 주소이거나 CORS 를 허용한 파일)
 *   4) 도구 흔적     파일 이름(DALL·E, ChatGPT Image, Gemini_Generated_Image …) · 대체 글 · 캡션('AI 생성', 'AI로 만든' …)
 *
 * 모양  data-tag="tag(기본)|mini|bar|none" · data-pos="tl|tr|bl|br" · data-tag-theme="dark|light"
 * 안내  data-style="badge(기본)|line|inline|none" · data-side · data-theme · data-use · data-level · data-review · data-privacy · data-contact · data-date (2.0 그대로)
 * 기타  data-auto="0"(자동 찾기 끔) · data-meta="0" · data-alt="0" · data-ld="0"(검색용 구조화 정보 끔) · data-min="96" · data-z · data-site(등록 번호) · data-lang="en"
 * 점검  주소 뒤에 ?aimarker=check 를 붙이면 운영자용 점검 모드(무엇을 왜 표시했는지, 못 읽은 파일은 무엇인지)가 열립니다.
 * 직접  AIMarker.tag(el, 'gen'|'edit'|'assist'|'virtual') · AIMarker.untag(el) · AIMarker.scan() · AIMarker.items() · AIMarker.check()
 *
 * 이 표시는 사이트 운영자가 설정한 것입니다. AIMarker 와 한국AI윤리위원회는 각 사이트를 심사 · 보증하지 않으며, 창에도 그렇게 적습니다. */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.AIMarker && W.AIMarker.v3) return;
  var VERSION = '3.0.0', HOME = 'https://aimarker.kr', NOW = Date.now();
  var FP = '@@FP_SMALL@@';
  var FP_VB = '0 0 87.49 100';
  var FONT = '"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
  var uid = 0;
  function fp(cls, mono) {
    uid++;
    var g = 'amfp' + uid;
    return '<svg class="' + (cls || 'fp') + '" viewBox="' + FP_VB + '" aria-hidden="true" focusable="false">' +
      (mono ? '' : '<defs><linearGradient id="' + g + '" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="87.49" y2="0"><stop offset="0" stop-color="#0030C4"/><stop offset=".45" stop-color="#0858F0"/><stop offset=".8" stop-color="#0E8BFB"/><stop offset="1" stop-color="#33C8FF"/></linearGradient></defs>') +
      '<path fill="' + (mono ? 'currentColor' : 'url(#' + g + ')') + '" d="' + FP + '"/></svg>';
  }

  /* ---------- 말 ---------- */
  var LANG = 'ko';
  var T = {
    ko: {
      gen: 'AI 생성', edit: 'AI 편집', assist: 'AI 보조', virtual: '가상인물', text: 'AI 도움 글',
      genL: '생성형 AI로 만든 콘텐츠입니다.', editL: '생성형 AI로 편집하거나 합성한 콘텐츠입니다.', assistL: '생성형 AI의 도움을 받아 만든 콘텐츠입니다.',
      virtualL: 'AI로 만든 가상인물이 나옵니다. 실제 사람이 아닙니다.', textL: '생성형 AI의 도움을 받아 쓴 글입니다.',
      img: '이미지', video: '영상', bg: '이미지', block: '글', frame: '영상',
      basis: '근거', tool: '도구', who: '표시', when: '확인',
      b_owner: '사이트 운영자가 표시', b_rule: '운영자가 정한 위치 규칙', b_c2pa: '파일 속 출처 기록(C2PA)', b_iptc: '파일 속 출처 기록(IPTC)', b_gen: '파일 속 생성 정보', b_name: '파일 이름, 설명의 AI 도구 흔적',
      g3: '기록', g2: '규칙', g1: '흔적',
      verify: 'AIMarker에서 확인', notice: '이 사이트의 AI 활용 안내',
      foot: '이 표시는 사이트 운영자가 AIMarker로 설정했습니다. 콘텐츠의 적법성을 보증하지 않습니다.',
      std: '표시 문구 기준 한국AI윤리위원회', nocert: '이 표시는 심사나 보증이 아닙니다',
      close: '닫기', open: '안내 보기', here: '이 페이지에서 표시한 것', go: '위치 보기',
      browser: '이 브라우저에서 확인'
    },
    en: {
      gen: 'AI generated', edit: 'AI edited', assist: 'AI assisted', virtual: 'Virtual human', text: 'AI-assisted text',
      genL: 'Created with generative AI.', editL: 'Edited or composited with generative AI.', assistL: 'Made with help from generative AI.',
      virtualL: 'Features an AI-generated virtual person, not a real one.', textL: 'Written with help from generative AI.',
      img: 'image', video: 'video', bg: 'image', block: 'text', frame: 'video',
      basis: 'Basis', tool: 'Tool', who: 'Label', when: 'Checked',
      b_owner: 'Labeled by the site owner', b_rule: 'Site owner rule', b_c2pa: 'Content Credentials (C2PA) in file', b_iptc: 'IPTC digital source type in file', b_gen: 'Generator data in file', b_name: 'AI tool traces in file name or caption',
      g3: 'record', g2: 'rule', g1: 'trace',
      verify: 'Check on AIMarker', notice: 'How this site uses AI',
      foot: 'This label was set up by the site owner with AIMarker. It does not certify the content.',
      std: 'Label wording: Korea AI Ethics Committee', nocert: 'This label is not a certification',
      close: 'Close', open: 'Details', here: 'Labeled on this page', go: 'Show',
      browser: 'checked in this browser'
    }
  };
  function t(k) { return (T[LANG] && T[LANG][k]) || T.ko[k] || k; }
  var GRADE = { owner: 2, rule: 2, c2pa: 3, iptc: 3, gen: 3, name: 1 };
  var DST = { gen: 'trainedAlgorithmicMedia', edit: 'compositeWithTrainedAlgorithmicMedia', assist: 'algorithmicallyEnhanced', virtual: 'trainedAlgorithmicMedia' };

  /* ---------- 2.0 안내 창(사이트 전체 AI 활용 안내) ---------- */
  var USE = {
    text: '글 · 상품 설명 · 공지를 쓸 때 AI의 도움을 받습니다',
    image: '일부 이미지를 AI로 만들거나 다듬습니다',
    video: '일부 영상 · 음성을 AI로 만들거나 편집합니다',
    chat: '고객 문의 일부에 AI 챗봇 · 자동 답변을 사용합니다',
    recommend: '상품 · 콘텐츠 추천에 AI를 사용합니다',
    translate: '번역 · 요약에 AI를 사용합니다',
    analysis: '데이터 분석 · 업무 자동화에 AI를 사용합니다',
    virtual: '광고 · 소개에 AI로 만든 가상인물이 나옵니다'
  };
  var REVIEW = { all: 'AI가 만든 결과물은 담당자가 확인한 뒤 게시합니다', important: '중요한 안내와 계약 관련 내용은 담당자가 직접 확인합니다' };
  var LEVELS = [['human', '사람 작성'], ['assist', 'AI 도움'], ['generated', 'AI 생성']];

  function clean(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n || 60); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function josa(w) { var c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? (c % 28 ? '은' : '는') : '는'; }
  function store(k, v) { try { if (v === undefined) return W.localStorage.getItem(k); W.localStorage.setItem(k, v); } catch (e) { /* 저장소를 못 쓰면 그냥 넘어감 */ } return null; }
  function abs(u) { try { return new URL(u, location.href).href; } catch (e) { return ''; } }
  function fileOf(u) { var n = String(u || '').split('#')[0].split('?')[0].split('/').pop() || ''; try { n = decodeURIComponent(n); } catch (e) { /* 그대로 */ } return n; }
  function cs(el) { try { return W.getComputedStyle(el); } catch (e) { return null; } }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2); }

  function normalize(raw) {
    var c = {};
    c.name = clean(raw.name, 30);
    c.uses = clean(raw.use, 160).split(/[,\s]+/).filter(function (k, i, a) { return USE[k] && a.indexOf(k) === i; });
    c.review = REVIEW[clean(raw.review, 12)] || '';
    c.privacy = clean(raw.privacy, 2) === '1';
    c.contact = clean(raw.contact, 80);
    if (c.contact && !/^[^\s@]{1,64}@[A-Za-z0-9.\-]{1,120}\.[A-Za-z]{2,}$/.test(c.contact) && !/^https?:\/\/[^\s"'<>]{3,80}$/.test(c.contact)) c.contact = '';
    var st = clean(raw.style, 8);
    c.style = ({ badge: 1, line: 1, inline: 1, none: 1 })[st] ? st : 'badge';
    c.side = clean(raw.side, 6) === 'right' ? 'right' : 'left';
    c.dark = clean(raw.theme, 6) === 'dark';
    c.date = /^\d{4}-\d{2}$/.test(clean(raw.date, 7)) ? clean(raw.date, 7) : '';
    var lv = clean(raw.level, 10);
    if (!({ human: 1, assist: 1, generated: 1 })[lv]) lv = c.uses.length ? 'assist' : 'human';
    c.level = lv;
    if (!c.uses.length && lv !== 'human') c.uses = ['text'];
    c.site = clean(raw.site, 40).replace(/[^\w\-.]/g, '');
    return c;
  }

  var NOTICE = null;   // { host, open(on), update() }
  function noticeCss(C, side) {
    return ':host{all:initial}*{box-sizing:border-box}' +
      '.k{font-family:' + FONT + ';color:' + C.fg + ';-webkit-font-smoothing:antialiased;letter-spacing:-.01em;line-height:1.5;word-break:keep-all}' +
      '.k svg{flex:0 0 auto}' +
      '.badge{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 8px 0 7px;border-radius:12px;border:1px solid ' + C.line + ';background:' + C.bg + ';color:' + C.fg + ';font-family:inherit;font-weight:760;font-size:13px;line-height:1;cursor:pointer;box-shadow:0 8px 24px rgba(9,20,47,.16);transition:transform .15s ease,box-shadow .15s ease}' +
      '.badge:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(9,20,47,.22)}' +
      '.badge .ic{width:26px;height:26px;border-radius:8px;background:' + C.chip + ';display:inline-flex;align-items:center;justify-content:center}.badge .ic svg{width:15px;height:17px}' +
      '.badge .n{min-width:22px;height:22px;padding:0 6px;border-radius:7px;background:' + C.acc + ';color:#fff;font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}.badge .n[hidden]{display:none}' +
      '.badge .lb{padding-right:4px}' +
      '.badge:focus-visible,.lnk:focus-visible,.line button:focus-visible,.it:focus-visible{outline:2px solid ' + C.acc + ';outline-offset:2px}' +
      '.line{display:flex;justify-content:center;padding:12px 16px;font-size:12.5px;color:' + C.sub + '}' +
      '.line button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:inherit;font:inherit;cursor:pointer;padding:4px 6px;border-radius:8px}.line button b{color:' + C.acc + '}.line svg{width:15px;height:17px}' +
      '.pop{position:absolute;bottom:48px;' + side + ':0;width:344px;max-width:calc(100vw - 24px);max-height:calc(100vh - 90px);overflow:auto;background:' + C.bg + ';border:1px solid ' + C.line + ';border-radius:18px;box-shadow:0 24px 60px rgba(9,20,47,.26);padding:16px 16px 12px;display:none;text-align:left}' +
      '.pop.on{display:block}.pop h4{display:flex;align-items:center;gap:8px;margin:0 0 2px;font-size:15.5px;font-weight:800;color:' + C.fg + '}.pop h4 svg{width:17px;height:19px}' +
      '.pop .who{margin:0;font-size:12.5px;color:' + C.sub + '}' +
      '.lv{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:12px 0 4px}.lv span{text-align:center;padding:6px 2px;border-radius:8px;background:' + C.chip + ';color:' + C.sub + ';font-weight:750;font-size:11.5px}' +
      '.lv span.on{color:#fff}.lv .human.on{background:#0E9A6A}.lv .assist.on{background:#0B63F6}.lv .generated.on{background:#0E1F47' + (C.dark ? ';box-shadow:inset 0 0 0 1px #3A4A70' : '') + '}' +
      '.lvt{margin:0 0 6px;font-size:11.5px;color:' + C.sub + '}' +
      '.pop ul{list-style:none;margin:0;padding:0}.pop li{display:flex;gap:8px;padding:7px 0;border-top:1px solid ' + C.line + ';font-size:13.5px;color:' + C.fg + '}.pop li:first-child{border-top:0}' +
      '.pop li i{flex:0 0 6px;height:6px;margin-top:8px;border-radius:50%;background:' + C.acc + '}.pop li.ok i{background:#0E9A6A}' +
      '.here{margin:12px 0 2px;padding:10px;border-radius:12px;background:' + C.chip + '}.here[hidden]{display:none}.here b{display:block;font-size:12px;font-weight:800;color:' + C.fg + ';margin-bottom:6px}' +
      '.it{display:flex;align-items:center;gap:9px;width:100%;padding:6px;border:0;border-radius:9px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.it:hover{background:' + C.bg + '}' +
      '.it .th{width:34px;height:34px;border-radius:7px;background:' + C.line + ' center/cover no-repeat;flex:0 0 34px;display:flex;align-items:center;justify-content:center;font-size:10px;color:' + C.sub + '}' +
      '.it span{display:block;font-size:12.5px;font-weight:750;line-height:1.35}.it small{display:block;font-size:11px;color:' + C.sub + ';line-height:1.35}' +
      '.it em{margin-left:auto;font-style:normal;font-size:11px;color:' + C.acc + ';font-weight:750;white-space:nowrap}' +
      '.pop .ct{margin:8px 0 0;font-size:12.5px;color:' + C.sub + ';word-break:break-all}.pop .ct a{color:' + C.acc + '}' +
      '.pop .ft{margin:12px -16px -12px;padding:10px 16px 11px;border-top:1px solid ' + C.line + ';background:' + C.foot + ';border-radius:0 0 18px 18px;font-size:11.5px;color:' + C.sub + '}' +
      '.lnk{display:flex;align-items:center;gap:8px;margin-top:7px;color:' + C.fg + ';text-decoration:none;font-size:12px;line-height:1.35}.lnk svg{width:20px;height:23px}' +
      '.lnk b{display:block;font-weight:850;letter-spacing:.01em}.lnk b .ai{color:' + C.acc + '}.lnk em{display:block;font-style:normal;font-weight:700;color:' + C.acc + '}.lnk:hover em{text-decoration:underline}' +
      '.std{display:block;margin-top:6px;font-size:10.5px;color:' + C.sub + ';opacity:.9}' +
      '.x{position:absolute;top:10px;right:10px;width:28px;height:28px;border:0;border-radius:8px;background:' + C.chip + ';color:' + C.sub + ';cursor:pointer;font:700 16px/28px sans-serif;padding:0}' +
      '.wrap{position:relative;display:inline-block}' +
      '@media (max-width:560px){.badge{height:34px;font-size:12px}.badge .ic{width:24px;height:24px}.pop{bottom:44px}}';
  }

  function build(raw, mountEl) {
    var c = normalize(raw || {});
    if (c.style === 'none' && !mountEl) return null;
    var C = c.dark ? { bg: '#0B1734', fg: '#E9EDF5', sub: '#9AA5BC', line: '#22325A', chip: '#17264D', acc: '#5B9BFF', foot: '#0A1530', dark: 1 }
      : { bg: '#FFFFFF', fg: '#0E1F47', sub: '#586179', line: '#E2E6EE', chip: '#F1F4F9', acc: '#0B63F6', foot: '#F6F8FB' };
    var items = c.uses.map(function (k) { return '<li><i></i><span>' + esc(USE[k]) + '</span></li>'; }).join('') +
      (c.review ? '<li class="ok"><i></i><span>' + esc(c.review) + '</span></li>' : '') +
      (c.privacy ? '<li class="ok"><i></i><span>AI 도구에 고객 개인정보를 넣지 않습니다</span></li>' : '');
    if (!items) items = '<li class="ok"><i></i><span>사람이 직접 만든 콘텐츠를 중심으로 운영합니다</span></li>';
    var ct = c.contact ? '<p class="ct">AI 활용 문의 ' + (c.contact.indexOf('@') > 0 ? '<a href="mailto:' + esc(c.contact) + '">' + esc(c.contact) + '</a>' : '<a href="' + esc(c.contact) + '" target="_blank" rel="noopener">' + esc(c.contact.replace(/^https?:\/\//, '')) + '</a>') + '</p>' : '';
    var lvName = LEVELS.filter(function (l) { return l[0] === c.level; })[0][1];
    var lv = '<div class="lv" role="img" aria-label="AI 성분표: ' + lvName + '">' +
      LEVELS.map(function (l) { return '<span class="' + l[0] + (l[0] === c.level ? ' on' : '') + '">' + l[1] + '</span>'; }).join('') + '</div><p class="lvt">AI 성분표 · 이 사이트의 콘텐츠는 주로 \'' + lvName + '\'입니다</p>';
    var who = (c.name ? esc(c.name) + josa(c.name) + ' 이렇게 AI를 사용합니다' : '이 사이트는 이렇게 AI를 사용합니다') + (c.date ? ' · ' + c.date.replace('-', '.') + ' 작성' : '');
    var reg = c.site ? '<a class="lnk" href="' + HOME + '/v/?s=' + encodeURIComponent(location.hostname) + '&id=' + encodeURIComponent(c.site) + '" target="_blank" rel="noopener" style="margin-top:4px"><span><em>AIMarker 등록 사이트인지 확인 →</em></span></a>' : '';
    var pop = '<div class="pop" role="dialog" aria-label="AI 활용 안내"><button class="x" type="button" aria-label="' + t('close') + '">×</button><h4>' + fp('h') + 'AI 활용 안내</h4><p class="who">' + who + '</p>' + lv + '<ul>' + items + '</ul>' +
      '<div class="here" hidden><b>' + t('here') + '</b><div class="list"></div></div>' + ct +
      '<div class="ft">이 안내는 사이트 운영자가 직접 작성했습니다.' + reg + '<a class="lnk" href="' + HOME + '/label/?utm_source=label&utm_medium=referral" target="_blank" rel="noopener">' + fp('l') + '<span><b><span class="ai">AI</span>Marker</b><em>AI 표시 자동화 · 무료로 시작하기 →</em></span></a><span class="std">' + t('std') + '. ' + t('nocert') + '</span></div></div>';
    var host = D.createElement('div');
    host.setAttribute('data-aimarker', '1');
    var style = c.style, box = null;
    if (mountEl) { host.style.cssText = style === 'badge' || style === 'none' ? 'all:initial;position:absolute;bottom:14px;' + c.side + ':14px;z-index:5' : 'all:initial;display:block;position:absolute;left:0;right:0;bottom:0'; if (style === 'none') style = 'badge'; }
    else {
      box = style === 'inline' ? D.getElementById('aimarker') : null;
      if (style === 'inline' && !box) style = 'line';
      host.style.cssText = style === 'badge' ? 'all:initial;position:fixed;bottom:16px;' + c.side + ':16px;z-index:2147482000' : 'all:initial;display:block';
    }
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var trigger = style === 'line'
      ? '<div class="line"><button type="button" aria-expanded="false">' + fp('m') + '<span>' + (c.name ? esc(c.name) + josa(c.name) : '이 사이트는') + ' 일부 콘텐츠에 AI를 활용합니다 · <b>' + t('open') + '</b></span></button></div>'
      : '<button class="badge" type="button" aria-expanded="false"><span class="ic">' + fp('b') + '</span><span class="lb">AI 활용 안내</span><span class="n" hidden></span></button>';
    root.innerHTML = '<style>' + noticeCss(C, c.side) + '</style><div class="k"><div class="wrap">' + pop + trigger + '</div></div>';
    var p = root.querySelector('.pop'), tr = root.querySelector('.badge, .line button');
    if (style === 'line') { var wr = root.querySelector('.wrap'); wr.style.display = 'block'; p.style.left = '50%'; p.style.right = 'auto'; p.style.transform = 'translateX(-50%)'; p.style.bottom = '48px'; }
    if (mountEl) { p.style.maxWidth = Math.max(240, (mountEl.clientWidth || 360) - 28) + 'px'; p.style.maxHeight = 'none'; }
    function setOpen(on) { p.classList.toggle('on', on); tr.setAttribute('aria-expanded', on ? 'true' : 'false'); if (on) fillHere(); }
    tr.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!p.classList.contains('on')); });
    root.querySelector('.x').addEventListener('click', function (e) { e.stopPropagation(); setOpen(false); });
    p.addEventListener('click', function (e) { e.stopPropagation(); });
    if (!mountEl) {
      D.addEventListener('click', function () { setOpen(false); });
      D.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    }
    var here = root.querySelector('.here'), list = root.querySelector('.here .list'), cnt = root.querySelector('.badge .n');
    function fillHere() {
      var its = ITEMS.filter(function (x) { return x.kind && x.el.isConnected; }).sort(docOrder);
      here.hidden = !its.length;
      if (!its.length) return;
      list.innerHTML = its.slice(0, 12).map(function (x, i) {
        var th = x.thumb ? '<span class="th" style="background-image:url(&quot;' + esc(x.thumb) + '&quot;)"></span>' : '<span class="th">' + esc(t(x.type === 'block' ? 'block' : 'img')) + '</span>';
        return '<button class="it" type="button" data-i="' + i + '">' + th + '<span><span>' + esc(labelOf(x)) + '</span><small>' + esc(t('b_' + x.basis)) + '</small></span><em>' + t('go') + '</em></button>';
      }).join('') + (its.length > 12 ? '<small style="display:block;padding:4px 6px 0;font-size:11px;color:' + C.sub + '">외 ' + (its.length - 12) + '건</small>' : '');
      Array.prototype.forEach.call(list.querySelectorAll('.it'), function (b) {
        b.addEventListener('click', function () { var x = its[+b.getAttribute('data-i')]; setOpen(false); reveal(x); });
      });
    }
    function update() {
      if (!cnt) return;
      var n = ITEMS.filter(function (x) { return x.kind; }).length;
      cnt.hidden = !n; cnt.textContent = n > 99 ? '99+' : String(n);
      tr.setAttribute('aria-label', 'AI 활용 안내' + (n ? ', 이 페이지 AI 표시 ' + n + '건' : ''));
      if (p.classList.contains('on')) fillHere();
    }
    host.__open = setOpen;
    if (mountEl) mountEl.appendChild(host);
    else if (box) box.appendChild(host);
    else (D.body || D.documentElement).appendChild(host);
    var api = { host: host, open: setOpen, update: update };
    if (!mountEl) NOTICE = api;
    return host;
  }

  /* ---------- 지문 마크 태그 ---------- */
  var CFG = { tag: 'tag', pos: 'tl', light: false, z: 3, min: 96, meta: true, alt: true, ld: true, auto: true, rules: {}, site: '', name: '' };
  var ITEMS = [];          // { el, type: img|video|bg|block|frame, kind, basis, tool, why, host, thumb, src, ... }
  var BY = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function itemOf(el) { if (BY) return BY.get(el); for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].el === el) return ITEMS[i]; return null; }
  function labelOf(x) { return x.type === 'block' ? t('text') : t(x.kind); }
  function docOrder(a, b) { if (a.el === b.el) return 0; return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1; }

  var TAG_CSS = ':host{all:initial}*{box-sizing:border-box}' +
    '.t{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px 0 3px;border-radius:9px;border:1px solid rgba(255,255,255,.24);background:rgba(8,20,47,.78);-webkit-backdrop-filter:blur(8px) saturate(150%);backdrop-filter:blur(8px) saturate(150%);color:#fff;font:760 12px/1 ' + FONT + ';letter-spacing:-.01em;white-space:nowrap;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.24);transition:background .15s ease,transform .15s ease,padding .2s ease;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}' +
    '.t:hover{background:rgba(8,20,47,.92)}.t:active{transform:scale(.97)}.t:focus-visible{outline:2px solid #33C8FF;outline-offset:2px}' +
    '.f{width:20px;height:20px;border-radius:6px;background:#fff;display:inline-flex;align-items:center;justify-content:center;flex:0 0 20px}.f svg{width:12.5px;height:14.3px}' +
    '.l{display:inline-block}' +
    '.t.light{background:rgba(255,255,255,.9);color:#0E1F47;border-color:rgba(14,31,71,.16);box-shadow:0 3px 12px rgba(9,20,47,.16)}.t.light:hover{background:#fff}.t.light .f{background:#EEF4FF}' +
    '.t.mini{padding:0 3px;gap:0}.t.mini .l{max-width:0;overflow:hidden;opacity:0;transition:max-width .22s ease,opacity .18s ease,margin .22s ease}' +
    '.t.mini:hover,.t.mini:focus-visible{padding:0 10px 0 3px}.t.mini:hover .l,.t.mini:focus-visible .l{max-width:120px;opacity:1;margin-left:6px}' +
    '.t.blk{height:24px;font-size:11.5px;border-radius:8px}.t.blk .f{width:18px;height:18px}' +
    '.bar{display:flex;align-items:center;gap:7px;width:100%;height:28px;padding:0 10px 0 4px;border:0;border-radius:0;background:linear-gradient(0deg,rgba(8,20,47,.86),rgba(8,20,47,.62));color:#fff;font:700 12px/1 ' + FONT + ';letter-spacing:-.01em;cursor:pointer;text-align:left;white-space:nowrap;overflow:hidden}' +
    '.bar .f{width:20px;height:20px}.bar .s{margin-left:auto;font-weight:650;font-size:11px;opacity:.78}.bar .s b{color:#7DB8FF;font-weight:800}' +
    '.flash{animation:fl 1.1s ease 2}@keyframes fl{0%,100%{box-shadow:0 3px 12px rgba(0,0,0,.24)}50%{box-shadow:0 0 0 6px rgba(51,200,255,.55)}}' +
    '.ck{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 8px;border-radius:7px;background:rgba(255,255,255,.92);color:#586179;border:1px dashed #9AA5BC;font:700 11px/1 ' + FONT + ';white-space:nowrap}' +
    '.ck.cors{color:#B54708;border-color:#F3B26B}.ck.no{color:#586179}.ck.skip{color:#858C9D}' +
    '@media (prefers-reduced-motion:reduce){.t,.t.mini .l{transition:none}.flash{animation:none}}';

  function hostFor(x) {
    var h = D.createElement('am-tag');
    h.setAttribute('data-aimarker-tag', x.kind || 'check');
    // 'all:initial' 은 쓰지 않음(뒤에 넣는 위치 값까지 덮어씀). 사이트 CSS 가 건드리기 쉬운 것만 되돌림
    h.style.cssText = 'position:absolute !important;z-index:' + CFG.z + ' !important;display:block !important;margin:0 !important;padding:0 !important;border:0 !important;' +
      'width:auto;height:auto;min-width:0 !important;min-height:0 !important;max-width:none !important;max-height:none !important;float:none !important;transform:none !important;' +
      'opacity:1 !important;filter:none !important;line-height:0 !important;font-size:0 !important;background:none !important;box-shadow:none !important;outline:0 !important;' +
      'pointer-events:auto !important;flex:none !important;grid-area:auto !important;inset:auto;left:0;top:0;visibility:hidden';
    var r = h.attachShadow ? h.attachShadow({ mode: 'open' }) : h;
    r.innerHTML = '<style>' + TAG_CSS + '</style>';
    h.__r = r;
    return h;
  }
  function render(x) {
    var r = x.host.__r, old = r.querySelector('.t,.bar,.ck');
    if (old) old.remove();
    var el;
    if (!x.kind) {   // 점검 모드: 표시하지 않은 것
      el = D.createElement('span');
      el.className = 'ck ' + (x.state || 'no');
      el.textContent = x.state === 'cors' ? '못 읽음(다른 서버)' : x.state === 'skip' ? '작아서 건너뜀' : x.state === 'none' ? '운영자: AI 아님' : x.state === 'wait' ? '확인 중' : '기록 없음';
      r.appendChild(el);
      return;
    }
    var lab = labelOf(x);
    var style = x.type === 'block' ? 'tag' : (x.small && CFG.tag === 'tag' ? 'mini' : CFG.tag);
    if (style === 'bar' && x.type !== 'block') {
      el = D.createElement('button'); el.type = 'button'; el.className = 'bar';
      el.innerHTML = '<span class="f">' + fp() + '</span><span>' + esc(lab) + '</span><span class="s"><b>AI</b>Marker</span>';
    } else {
      el = D.createElement('button'); el.type = 'button';
      el.className = 't' + (CFG.light ? ' light' : '') + (style === 'mini' ? ' mini' : '') + (x.type === 'block' ? ' blk' : '');
      el.innerHTML = '<span class="f">' + fp() + '</span><span class="l">' + esc(lab) + '</span>';
    }
    var tw = t(x.type === 'block' ? 'block' : x.type === 'video' || x.type === 'frame' ? 'video' : 'img');
    el.setAttribute('aria-label', (lab.slice(-tw.length) === tw ? lab : lab + ' ' + tw) + ', AIMarker 표시 근거 보기');
    el.title = lab + ' · ' + t('b_' + x.basis);
    el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openCard(x, el); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); });
    ['mousedown', 'pointerdown', 'touchstart'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    r.appendChild(el);
  }

  /* 태그를 미디어 바로 뒤(같은 칸)에 넣어 함께 움직이고 함께 가려지게 */
  function anchorOf(el) {
    var a = el, p = el.parentElement;
    if (p && p.tagName === 'PICTURE') { a = p; p = p.parentElement; }
    // 이미지 하나만 감싼 링크 · span 은 그 바깥에(눌러도 링크로 넘어가지 않게)
    if (p && /^(A|SPAN)$/.test(p.tagName) && p.children.length === 1 && !String(p.textContent || '').trim()) a = p;
    return a;
  }
  function attach(x) {
    if (x.host && x.host.isConnected) return;
    if (!x.host) x.host = hostFor(x);
    var a = x.type === 'block' ? x.el : anchorOf(x.el);
    if (!a.parentNode) return;
    if (a.nextSibling) a.parentNode.insertBefore(x.host, a.nextSibling); else a.parentNode.appendChild(x.host);
    x.cb = undefined;
    var r0 = x.el.getBoundingClientRect();
    x.small = x.type !== 'block' && (r0.width < 220 || r0.height < 140);
    render(x);
    watchSize(x);
    place(x);
  }
  function detach(x) { if (x.host && x.host.parentNode) x.host.parentNode.removeChild(x.host); }

  function cbOf(h) {   // 절대 위치의 기준 상자(가장 가까운 기준 조상). 없으면 문서
    for (var el = h.parentElement; el && el !== D.documentElement; el = el.parentElement) {
      var s = cs(el);
      if (!s) continue;
      if (el === D.body && s.position === 'static') continue;
      if (s.position !== 'static' || (s.transform && s.transform !== 'none') || (s.perspective && s.perspective !== 'none') || (s.filter && s.filter !== 'none') ||
        (s.backdropFilter && s.backdropFilter !== 'none') || /paint|layout|strict|content/.test(s.contain || '') || /transform|perspective|filter/.test(s.willChange || '') ||
        (s.containerType && s.containerType !== 'normal')) return el;
    }
    return null;
  }
  function place(x) {
    var h = x.host;
    if (!h || !h.isConnected) return;
    var r = x.el.getBoundingClientRect();
    var tooSmall = r.width < 24 || r.height < 18;
    if (tooSmall || (x.el.offsetParent === null && cs(x.el) && cs(x.el).position !== 'fixed')) { h.style.setProperty('visibility', 'hidden', 'important'); return; }
    if (x.cb === undefined) x.cb = cbOf(h);
    var cb = x.cb, ox, oy, sx = 1, sy = 1;
    if (cb) {
      var pr = cb.getBoundingClientRect();
      sx = cb.offsetWidth ? pr.width / cb.offsetWidth : 1; sy = cb.offsetHeight ? pr.height / cb.offsetHeight : 1;
      if (!sx || !isFinite(sx)) sx = 1; if (!sy || !isFinite(sy)) sy = 1;
      ox = pr.left + cb.clientLeft * sx - cb.scrollLeft * sx; oy = pr.top + cb.clientTop * sy - cb.scrollTop * sy;
    } else { ox = -W.pageXOffset; oy = -W.pageYOffset; }
    var small = x.type !== 'block' && (r.width < 220 || r.height < 140);
    if (small !== x.small && x.kind) { x.small = small; render(x); }
    var pad = x.type === 'block' ? 6 : (r.width < 160 ? 6 : 10), bar = CFG.tag === 'bar' && x.type !== 'block' && x.kind;
    var w = h.offsetWidth || 90, hh = h.offsetHeight || 26, left, top;
    if (bar) { h.style.setProperty('width', Math.round(r.width) + 'px', 'important'); left = r.left; top = r.bottom - 28; }
    else {
      var pos = x.type === 'block' ? 'tr' : CFG.pos;
      left = pos.charAt(1) === 'r' ? r.right - pad - w : r.left + pad;
      top = pos.charAt(0) === 'b' ? r.bottom - pad - hh : r.top + pad;
      if (x.type === 'block') top = r.top - Math.round(hh / 2);
    }
    h.style.setProperty('left', Math.round((left - ox) / sx) + 'px', 'important');
    h.style.setProperty('top', Math.round((top - oy) / sy) + 'px', 'important');
    h.style.setProperty('visibility', 'visible', 'important');
    x.at = [r.left, r.top, r.width, r.height];
  }
  var RO = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function (es) { es.forEach(function (e) { var x = itemOf(e.target); if (x) place(x); }); }) : null;
  function watchSize(x) { if (RO && !x.ro) { try { RO.observe(x.el); x.ro = 1; } catch (e) { /* 무시 */ } } }
  var placeAllT = 0;
  function placeAll() { if (placeAllT) return; placeAllT = setTimeout(function () { placeAllT = 0; ITEMS.forEach(function (x) { if (x.host) { x.cb = undefined; place(x); } }); }, 120); }

  /* ---------- 근거 창 ---------- */
  var CARD = null;
  var CARD_CSS = ':host{all:initial}*{box-sizing:border-box}' +
    '.bk{position:fixed;inset:0;z-index:2147483000}.bk.sheet{background:rgba(8,20,47,.36)}' +
    '.c{position:fixed;z-index:2147483001;width:332px;max-width:calc(100vw - 20px);background:#fff;color:#0E1F47;border-radius:18px;box-shadow:0 26px 64px rgba(8,20,47,.30),0 0 0 1px rgba(14,31,71,.08);font-family:' + FONT + ';letter-spacing:-.01em;line-height:1.5;-webkit-font-smoothing:antialiased;word-break:keep-all;overflow:hidden;animation:in .16s ease}' +
    '.c.sheet{left:0;right:0;bottom:0;top:auto!important;width:auto;max-width:none;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom)}' +
    '@keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
    '.hd{display:flex;gap:11px;align-items:center;padding:16px 46px 12px 16px}.ic{width:40px;height:40px;border-radius:12px;background:#F1F6FF;display:flex;align-items:center;justify-content:center;flex:0 0 40px}.ic svg{width:21px;height:24px}' +
    '.hd b{display:block;font-size:16px;font-weight:820;line-height:1.3}.hd small{display:block;font-size:12.5px;color:#586179;margin-top:2px}' +
    '.k{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:6px;background:#0E1F47;color:#fff;font-size:11.5px;font-weight:800;margin-right:6px;vertical-align:1px}.k.edit{background:#0A4FCB}.k.assist{background:#0B63F6}.k.virtual{background:#5B3BD6}' +
    '.rows{padding:0 16px 6px}.row{display:grid;grid-template-columns:44px 1fr;gap:10px;padding:8px 0;border-top:1px solid #EEF1F6;font-size:12.8px;align-items:start}.row>span{color:#858C9D;font-weight:650}.row b{font-weight:720}' +
    '.g{display:inline-flex;align-items:flex-end;gap:2px;height:12px;margin-left:6px;vertical-align:-1px}.g i{display:block;width:4px;border-radius:2px;background:#DCE3EE}.g i:nth-child(1){height:6px}.g i:nth-child(2){height:9px}.g i:nth-child(3){height:12px}.g.g1 i:nth-child(-n+1),.g.g2 i:nth-child(-n+2),.g.g3 i{background:#0B63F6}' +
    '.act{display:flex;gap:6px;padding:8px 16px 14px}.act a,.act button{flex:1;display:inline-flex;align-items:center;justify-content:center;height:38px;border-radius:10px;font:720 12.8px/1 ' + FONT + ';text-decoration:none;cursor:pointer;white-space:nowrap}' +
    '.act .p{background:#0E1F47;color:#fff;border:1px solid #0E1F47}.act .p:hover{background:#08142F}.act .s{background:#fff;color:#0E1F47;border:1px solid #D0D6E0}.act .s:hover{border-color:#0E1F47}' +
    '.ft{display:flex;align-items:center;gap:7px;padding:10px 16px;background:#F6F8FB;border-top:1px solid #EEF1F6;font-size:11px;color:#858C9D;line-height:1.45}.ft svg{width:13px;height:15px;flex:0 0 13px}.ft b{color:#0E1F47;font-weight:850}.ft b i{font-style:normal;color:#0B63F6}' +
    '.x{position:absolute;top:12px;right:12px;width:30px;height:30px;border:0;border-radius:9px;background:#F1F4F9;color:#586179;cursor:pointer;font:700 17px/30px sans-serif;padding:0}.x:hover{background:#E6EBF3}' +
    'a:focus-visible,button:focus-visible{outline:2px solid #0B63F6;outline-offset:2px}' +
    '@media (prefers-reduced-motion:reduce){.c{animation:none}}';
  function closeCard() { if (CARD) { CARD.host.remove(); if (CARD.from && CARD.from.focus) try { CARD.from.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } CARD = null; } }
  function openCard(x, from) {
    closeCard();
    var host = D.createElement('div'); host.setAttribute('data-aimarker-card', '1');
    host.style.cssText = 'all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000';
    var r = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var sheet = W.innerWidth < 560;
    var lab = labelOf(x), what = t(x.type === 'block' ? 'block' : x.type === 'video' || x.type === 'frame' ? 'video' : 'img');
    var g = GRADE[x.basis] || 1;
    var lead = x.type === 'block' ? t('textL') : t(x.kind + 'L');
    var site = CFG.name ? esc(CFG.name) : esc(location.hostname.replace(/^www\./, ''));
    var vq = '?u=' + encodeURIComponent(x.src || '') + '&k=' + x.kind + '&b=' + x.basis + (x.tool ? '&t=' + encodeURIComponent(x.tool) : '') + '&s=' + encodeURIComponent(location.hostname) + (CFG.site ? '&id=' + encodeURIComponent(CFG.site) : '');
    r.innerHTML = '<style>' + CARD_CSS + '</style><div class="bk' + (sheet ? ' sheet' : '') + '"></div>' +
      '<div class="c' + (sheet ? ' sheet' : '') + '" role="dialog" aria-modal="false" aria-label="' + esc(lab) + ' 표시 근거">' +
      '<button class="x" type="button" aria-label="' + t('close') + '">×</button>' +
      '<div class="hd"><span class="ic">' + fp() + '</span><span><b><span class="k ' + x.kind + '">' + esc(lab) + '</span>' + esc(what) + '</b><small>' + esc(lead) + '</small></span></div>' +
      '<div class="rows">' +
      '<div class="row"><span>' + t('basis') + '</span><span><b>' + esc(t('b_' + x.basis)) + '</b><span class="g g' + g + '" aria-hidden="true"><i></i><i></i><i></i></span>' + (x.why ? '<br><small style="color:#586179">' + esc(x.why) + '</small>' : '') + '</span></div>' +
      (x.tool ? '<div class="row"><span>' + t('tool') + '</span><span>' + esc(x.tool) + '</span></div>' : '') +
      '<div class="row"><span>' + t('who') + '</span><span>' + site + ' · AIMarker 자동 표시</span></div>' +
      '<div class="row"><span>' + t('when') + '</span><span>' + ymd() + ' · ' + t('browser') + '</span></div>' +
      '</div>' +
      '<div class="act"><a class="p" href="' + HOME + '/v/' + vq + '" target="_blank" rel="noopener">' + t('verify') + '</a>' + (NOTICE ? '<button class="s" type="button" data-n>' + t('notice') + '</button>' : '') + '</div>' +
      '<div class="ft">' + fp('', false) + '<span><b><i>AI</i>Marker</b> 지문 마크 · ' + t('foot') + '</span></div></div>';
    (D.body || D.documentElement).appendChild(host);
    var c = r.querySelector('.c');
    if (!sheet) {
      var b = from.getBoundingClientRect(), cw = c.offsetWidth, ch = c.offsetHeight;
      var left = Math.min(Math.max(10, b.left), W.innerWidth - cw - 10), top = b.bottom + 8;
      if (top + ch > W.innerHeight - 10) top = Math.max(10, b.top - ch - 8);
      c.style.left = left + 'px'; c.style.top = top + 'px';
    }
    r.querySelector('.bk').addEventListener('click', closeCard);
    r.querySelector('.x').addEventListener('click', closeCard);
    var nb = r.querySelector('[data-n]');
    if (nb) nb.addEventListener('click', function () { closeCard(); if (NOTICE) setTimeout(function () { NOTICE.open(true); }, 0); });
    c.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
    CARD = { host: host, from: from };
    try { r.querySelector('.x').focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
  }
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
  W.addEventListener('scroll', function () { if (CARD && W.innerWidth >= 560) closeCard(); }, { passive: true });

  function reveal(x) {
    if (!x || !x.el) return;
    try { x.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { x.el.scrollIntoView(); }
    setTimeout(function () { place(x); var b = x.host && x.host.__r && x.host.__r.querySelector('.t,.bar'); if (b) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); } }, 450);
  }

  /* ---------- 찾기: 운영자 표시 · 규칙 · 흔적 · 파일 속 기록 ---------- */
  var OWN = { generated: 'gen', gen: 'gen', ai: 'gen', 'true': 'gen', '1': 'gen', yes: 'gen', edited: 'edit', edit: 'edit', composite: 'edit', assisted: 'assist', assist: 'assist', help: 'assist', enhanced: 'assist', virtual: 'virtual', avatar: 'virtual', text: 'assist',
    none: 'none', human: 'none', no: 'none', 'false': 'none', '0': 'none' };
  var NAME_RE = /Gemini_Generated_Image|ChatGPT[\s_\-]?Image|DALL[·\-_\s]?E|^OIG\d?[._\-]|ComfyUI|midjourney|^mj[_\-]|firefly|leonardo[_\-]|ideogram|stable[\s_\-]?diffusion|^sdxl|novelai|flux[_\-]\d|imagen[_\-]\d|bing[\s_\-]?image|copilot[\s_\-]image|generated[\s_\-]image|ai[\s_\-]generated|AI\s?생성|dreamina|seedream|recraft|kling[_\-]|runway[_\-]gen|sora[_\-]|veo[_\-]?\d|^\d{5}-\d{6,12}\.png$/i;
  var ALT_GEN = /(?:생성형\s?AI|인공지능|AI)\s?(?:로|으로)?\s?(?:생성|제작|만든|그린|만들었|생성한|생성된)|AI\s?(?:생성|이미지|그림|일러스트|아트)\b|\bAI[-\s]?generated|generated\s+(?:by|with)\s+(?:an?\s+)?AI|made\s+with\s+AI|created\s+(?:by|with)\s+AI|[\(\[]\s?AI\s?(?:생성)?[\)\]]|#AI생성/i;
  var ALT_EDIT = /(?:AI|인공지능)\s?(?:로|으로)?\s?(?:편집|보정|합성|수정|리터칭)|\bAI[-\s]?(?:edited|enhanced|retouched)\b/i;
  var ALT_VIRT = /가상\s?인물|가상\s?인간|버추얼\s?휴먼|AI\s?모델|virtual\s+(?:human|model|influencer)/i;

  function ownerKind(el) {
    // 가장 가까운 data-ai 를 따름(그림을 감싼 figure · div 에 붙여도 됨). 글 묶음 표시(text · assist)는 그 안의 그림에 물려주지 않음
    var c = el.closest ? el.closest('[data-ai]') : null;
    if (!c) return '';
    var v = String(c.getAttribute('data-ai') || '').toLowerCase().trim();
    if (c !== el && /^(text|assist|assisted)$/.test(v) && !/^(IMG|VIDEO|IFRAME|PICTURE|FIGURE|A|SPAN)$/.test(c.tagName)) return '';
    return OWN[v] || 'gen';
  }
  function ruleKind(el) {
    var R = CFG.rules;
    try {
      if (R.virtual && el.closest(R.virtual)) return 'virtual';
      if (R.edit && el.closest(R.edit)) return 'edit';
      if (R.gen && el.closest(R.gen)) return 'gen';
    } catch (e) { /* 잘못된 선택자 */ }
    return '';
  }
  function pathKind(el) { return CFG.rules.pathOn && !el.closest('header,nav,footer,[role=banner],[role=navigation],[role=contentinfo]') ? 'gen' : ''; }
  function captionOf(el) {
    var s = [el.getAttribute('alt'), el.getAttribute('title'), el.getAttribute('aria-label')].filter(Boolean).join(' ');
    var f = el.closest && el.closest('figure');
    if (f) { var fc = f.querySelector('figcaption'); if (fc) s += ' ' + fc.textContent; }
    return s.slice(0, 400);
  }
  function hintKind(el, src) {
    if (!CFG.alt) return null;
    var cap = captionOf(el), n = fileOf(src);
    if (ALT_VIRT.test(cap)) return { k: 'virtual', why: '설명에 가상인물 표기가 있습니다' };
    if (ALT_EDIT.test(cap)) return { k: 'edit', why: '설명에 AI 편집 표기가 있습니다' };
    if (ALT_GEN.test(cap)) return { k: 'gen', why: '설명(대체 글 · 캡션)에 AI 생성 표기가 있습니다' };
    if (n && NAME_RE.test(n)) return { k: 'gen', why: '파일 이름에 AI 도구 흔적이 있습니다: ' + n.slice(0, 48), tool: toolFromName(n) };
    return null;
  }
  function toolFromName(n) {
    var m = [[/Gemini_Generated/i, 'Google Gemini'], [/ChatGPT/i, 'ChatGPT'], [/DALL/i, 'DALL·E'], [/^OIG/i, 'Microsoft Designer'], [/ComfyUI/i, 'ComfyUI'], [/midjourney|^mj[_\-]/i, 'Midjourney'], [/firefly/i, 'Adobe Firefly'], [/leonardo/i, 'Leonardo.Ai'], [/ideogram/i, 'Ideogram'], [/stable|sdxl/i, 'Stable Diffusion'], [/novelai/i, 'NovelAI'], [/flux/i, 'FLUX'], [/imagen/i, 'Google Imagen'], [/bing|copilot/i, 'Microsoft Copilot'], [/dreamina|seedream/i, 'Dreamina'], [/recraft/i, 'Recraft'], [/kling/i, 'Kling'], [/runway/i, 'Runway'], [/sora/i, 'Sora'], [/veo/i, 'Google Veo']];
    for (var i = 0; i < m.length; i++) if (m[i][0].test(n)) return m[i][1];
    return '';
  }

  /* 파일 속 기록 읽기: 앞 256KB(+ 필요하면 뒤 128KB). 같은 주소이거나 CORS 를 허용한 파일만. 결과는 이 브라우저에 7일 기억 */
  var TOOLS = [
    [/DALL[·Â·\-\s]*E|DALL-E/, 'DALL·E'], [/ChatGPT/, 'ChatGPT'], [/OpenAI/, 'OpenAI'], [/Adobe Firefly|Firefly/, 'Adobe Firefly'], [/Midjourney/i, 'Midjourney'],
    [/Stable Diffusion|stable-diffusion|StableDiffusion/i, 'Stable Diffusion'], [/ComfyUI/, 'ComfyUI'], [/NovelAI/, 'NovelAI'], [/InvokeAI|invokeai_metadata/, 'InvokeAI'], [/Fooocus/, 'Fooocus'],
    [/Leonardo\.?Ai/i, 'Leonardo.Ai'], [/Ideogram/, 'Ideogram'], [/Bing Image Creator|Image Creator from Microsoft|Microsoft Designer|Microsoft Copilot/, 'Microsoft Designer · Copilot'],
    [/Made with Google AI|Google AI/, 'Google AI'], [/Imagen/, 'Google Imagen'], [/Gemini/, 'Google Gemini'], [/Meta AI|Imagined with AI/, 'Meta AI'], [/Recraft/, 'Recraft'],
    [/Black Forest Labs|FLUX\.\d/, 'FLUX'], [/Kling/, 'Kling'], [/Runway/, 'Runway'], [/\bSora\b/, 'Sora'], [/\bVeo\b/, 'Google Veo'], [/Luma AI|Dream Machine/, 'Luma'], [/Hailuo|MiniMax/, 'Hailuo'],
    [/Dreamina|Seedream|Jimeng/, 'Dreamina'], [/Krea/, 'Krea'], [/Playground AI/, 'Playground'], [/Karlo/, 'Karlo'], [/Wrtn|뤼튼/, '뤼튼'],
    [/Claude \(Anthropic\)|CreatorTool="Claude/, 'Claude']
  ];
  var STRONG = /DALL|ChatGPT|OpenAI|Firefly|Midjourney|Stable Diffusion|stable-diffusion|ComfyUI|NovelAI|InvokeAI|invokeai|Fooocus|Leonardo|Ideogram|Image Creator|Microsoft Designer|Made with Google AI|Imagined with AI|Recraft|Black Forest Labs|Dreamina|Seedream|Hailuo|Dream Machine|Playground AI|Karlo/i;
  function dstKind(t) {
    if (!t) return '';
    if (/compositeWithTrainedAlgorithmicMedia/.test(t)) return 'edit';
    if (/trainedAlgorithmicMedia/.test(t)) return 'gen';
    if (/[^A-Za-z]algorithmicMedia/.test(t)) return 'gen';
    if (/algorithmicallyEnhanced/.test(t)) return 'assist';
    return '';
  }
  function scanBytes(s) {
    // 1) IPTC 디지털 출처 유형(XMP · C2PA 둘 다 같은 이름)
    var c2pa = /c2pa/.test(s) && /jumb|jumd|caBX|urn:c2pa|urn:uuid/.test(s), kind = '', basis = '', note = '';
    // 근거를 정확히: XMP 안의 IPTC 기록과 C2PA 매니페스트 안의 기록을 나눠 봄(C2PA 가 있어도 출처 유형이 XMP 에만 있으면 IPTC)
    var xi = s.indexOf('<x:xmpmeta'), xe = xi < 0 ? -1 : s.indexOf('</x:xmpmeta>', xi), xmp = xi < 0 ? '' : s.slice(xi, xe > xi ? xe : xi + 262144);
    var rest = xi < 0 ? s : s.slice(0, xi) + s.slice(xi + xmp.length);
    var kc = c2pa ? dstKind(rest) : '', kx = dstKind(xmp);
    if (kc) { kind = kc; basis = 'c2pa'; }
    else if (kx) { kind = kx; basis = 'iptc'; }
    else if ((kind = dstKind(s))) basis = c2pa ? 'c2pa' : 'iptc';
    // 2) 생성 도구 이름(기록 칸 가까이에 있을 때만)
    var tool = '';
    var ctx = /(?:CreatorTool|softwareAgent|claim_generator|Software|generator|parameters|Description|Comment|Credit|photoshop:Credit|tEXt|iTXt)[\s\S]{0,260}/g, m, near = '';
    while ((m = ctx.exec(s)) && near.length < 6000) near += m[0] + '\n';
    var pool = c2pa ? s : near;
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i][0].test(pool)) { tool = TOOLS[i][1]; break; }
    // PNG 생성 정보(Stable Diffusion · ComfyUI · NovelAI)
    if (!kind) {
      if (/parameters\u0000[\s\S]{0,4000}Steps: \d+[\s\S]{0,400}Sampler:/.test(s)) { kind = 'gen'; basis = 'gen'; tool = tool || 'Stable Diffusion'; }
      else if (/(?:prompt|workflow)\u0000\{[\s\S]{0,4000}"class_type"/.test(s)) { kind = 'gen'; basis = 'gen'; tool = tool || 'ComfyUI'; }
      else if (/Software\u0000NovelAI|"software":\s?"NovelAI"/.test(s)) { kind = 'gen'; basis = 'gen'; tool = 'NovelAI'; }
      else if (/invokeai_metadata|sd-metadata/.test(s)) { kind = 'gen'; basis = 'gen'; tool = tool || 'InvokeAI'; }
      else if (tool && (c2pa ? STRONG.test(s) : STRONG.test(near))) { kind = 'gen'; basis = c2pa ? 'c2pa' : 'gen'; }
    }
    if (!kind && c2pa && /com\.anthropic|Anthropic Files/.test(s)) note = 'Claude 출처 기록이 있지만 생성 여부(디지털 출처 유형)가 적혀 있지 않아 표시하지 않았습니다';
    return { kind: kind, basis: basis, tool: tool, note: note, c2pa: c2pa };
  }
  function latin1(u8) { var s = '', i, n = u8.length; for (i = 0; i < n; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(n, i + 8192))); return s; }
  var Q = [], RUN = 0, READS = 0, MAXREADS = 60;
  function cacheGet(u) { var v = store('amk3:' + u.slice(0, 300)); if (!v) return null; try { v = JSON.parse(v); } catch (e) { return null; } return v && NOW - v.ts < 7 * 864e5 ? v : null; }
  function cachePut(u, v) { v.ts = Date.now(); store('amk3:' + u.slice(0, 300), JSON.stringify(v)); }
  function readMeta(u, el) {
    return new Promise(function (res) {
      var hit = cacheGet(u);
      if (hit) return res(hit);
      Q.push({ u: u, res: res, el: el });
      pump();
    });
  }
  function pump() {
    while (RUN < 3 && Q.length) {
      var j = Q.shift(); RUN++;
      (function (j) {
        fetchHead(j.u, j.el).then(function (v) { if (v.state !== 'cors' && v.state !== 'err' && v.state !== 'skip') cachePut(j.u, v); j.res(v); }, function () { j.res({ state: 'err' }); })
          .then(function () { RUN--; pump(); });
      })(j);
    }
  }
  function readStream(resp, cap) {
    if (!resp.body || !resp.body.getReader) return resp.arrayBuffer().then(function (ab) { return new Uint8Array(ab.slice(0, cap)); });
    var rd = resp.body.getReader(), parts = [], got = 0;
    function step() {
      return rd.read().then(function (o) {
        if (o.done) return join();
        parts.push(o.value); got += o.value.length;
        if (got >= cap) { try { rd.cancel(); } catch (e) { /* 무시 */ } return join(); }
        return step();
      });
    }
    function join() { var out = new Uint8Array(Math.min(got, cap)), off = 0; parts.forEach(function (p) { var n = Math.min(p.length, out.length - off); if (n > 0) { out.set(p.subarray(0, n), off); off += n; } }); return out; }
    return step();
  }
  function fetchHead(u, el) {
    if (!W.fetch) return Promise.resolve({ state: 'err' });
    if (/^data:/.test(u)) {
      try { var b = atob(u.split(',')[1] || '').slice(0, 3 * 1048576); var v = scanBytes(b); v.state = 'ok'; return Promise.resolve(v); } catch (e) { return Promise.resolve({ state: 'err' }); }
    }
    READS++;
    if (READS > MAXREADS) return Promise.resolve({ state: 'skip' });
    var same = false; try { same = new URL(u).origin === location.origin; } catch (e) { /* 무시 */ }
    // 다른 서버(CDN) 파일은 CORS 를 허용할 때만 읽힘. 막히면 브라우저 콘솔에 오류가 남으므로 기본은 같은 주소만, data-meta="all" · 점검 모드 · crossorigin 이 있는 그림은 다른 서버도
    if (!same && CFG.meta !== 'all' && !CHECK && !(el && el.hasAttribute && el.hasAttribute('crossorigin'))) return Promise.resolve({ state: 'cors', skipped: 1 });
    var opt = { headers: { Range: 'bytes=0-262143' }, credentials: same ? 'same-origin' : 'omit', mode: 'cors', cache: 'force-cache' };
    return fetch(u, opt).then(function (r) {
      if (!r.ok && r.status !== 206) return { state: 'err' };
      var total = 0, cr = r.headers.get('Content-Range') || '';
      var mt = /\/(\d+)$/.exec(cr); if (mt) total = +mt[1];
      return readStream(r, r.status === 206 ? 262144 : 4 * 1048576).then(function (head) {
        var s = latin1(head), v = scanBytes(s);
        // WebP · PNG 는 기록이 끝에 있을 수 있어 뒤도 봄
        if (!v.kind && r.status === 206 && total > 262144 && /^RIFF|^\u0089PNG/.test(s.slice(0, 8))) {
          return fetch(u, { headers: { Range: 'bytes=-131072' }, credentials: opt.credentials, mode: 'cors', cache: 'force-cache' }).then(function (r2) {
            return r2.status === 206 ? readStream(r2, 131072).then(function (tail) { var v2 = scanBytes(latin1(tail)); v2.state = 'ok'; return v2.kind ? v2 : (v.state = 'ok', v); }) : (v.state = 'ok', v);
          }, function () { v.state = 'ok'; return v; });
        }
        v.state = 'ok';
        return v;
      });
    }, function () { return { state: same ? 'err' : 'cors' }; });
  }

  /* ---------- 훑기 ---------- */
  function srcOf(el) {
    var tg = el.tagName;
    if (tg === 'IMG') return el.currentSrc || el.src || '';
    if (tg === 'VIDEO') { if (el.currentSrc || el.src) return el.currentSrc || el.src; var so = el.querySelector('source[src]'); return so ? abs(so.getAttribute('src')) : ''; }
    if (tg === 'IFRAME') return el.src || '';
    var st = el.getAttribute('style') || '', m = /background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(st);
    return m ? abs(m[1]) : '';
  }
  function typeOf(el) { var tg = el.tagName; return tg === 'IMG' ? 'img' : tg === 'VIDEO' ? 'video' : tg === 'IFRAME' ? 'frame' : 'bg'; }
  function sizeOk(el) {
    var r = el.getBoundingClientRect(), mn = CFG.min;
    if (el.tagName === 'IMG' && el.naturalWidth && el.naturalWidth < 48 && el.naturalHeight < 48) return false;
    return (r.width >= mn && r.height >= mn * 0.6) || (r.width >= mn * 0.6 && r.height >= mn);
  }
  function mine(el) { return el.closest && el.closest('am-tag,[data-aimarker],[data-aimarker-card],[data-aimarker-panel]'); }
  function candidates() {
    var out = [], seen = typeof Set !== 'undefined' ? new Set() : null, seenA = [];
    function has(el) { return seen ? seen.has(el) : seenA.indexOf(el) >= 0; }
    function add(el) { if (!el || has(el) || mine(el)) return; if (seen) seen.add(el); else seenA.push(el); out.push(el); }
    function addMedia(root) { Array.prototype.forEach.call(root.querySelectorAll('img,video,iframe,[style*="url("]'), function (m) { if (m.tagName !== 'IFRAME' || m.closest('[data-ai]') || ruleKind(m)) add(m); }); }
    var list = D.querySelectorAll('img,video,[data-ai],[style*="url("]');
    for (var i = 0; i < list.length && out.length < 800; i++) {
      var el = list[i], tg = el.tagName;
      if (tg === 'IMG' || tg === 'VIDEO' || tg === 'IFRAME') { add(el); continue; }
      if (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'PICTURE' || tg === 'SOURCE') continue;
      var v = el.getAttribute('data-ai');
      if (v != null && /^(text|assist|assisted)$/i.test(v.trim()) && !/url\(/i.test(el.getAttribute('style') || '')) { add(el); continue; }
      if (/url\(/i.test(el.getAttribute('style') || '')) add(el);
      if (v != null) addMedia(el);   // 그림 묶음에 붙인 data-ai: 안의 그림 · 영상에
    }
    var R = CFG.rules;
    ['gen', 'edit', 'virtual'].forEach(function (k) {
      if (!R[k]) return;
      try { Array.prototype.forEach.call(D.querySelectorAll(R[k]), function (el) { if (/^(IMG|VIDEO|IFRAME)$/.test(el.tagName)) add(el); else { if (/url\(/i.test(el.getAttribute('style') || '')) add(el); addMedia(el); } }); } catch (e) { /* 잘못된 선택자 */ }
    });
    if (R.text) { try { Array.prototype.forEach.call(D.querySelectorAll(R.text), function (el) { el.__amText = 1; add(el); }); } catch (e) { /* 무시 */ } }
    return out;
  }
  function isBlock(el) { return !/^(IMG|VIDEO|IFRAME|PICTURE)$/.test(el.tagName) && (el.__amText || /^(text|assist|assisted)$/i.test(String(el.getAttribute('data-ai') || '').trim())) && !srcOf(el); }

  function judge(el) {
    var x = itemOf(el), src = srcOf(el), blk = isBlock(el);
    if (x && x.src === src && x.done) return;
    if (!x) { x = { el: el, type: blk ? 'block' : typeOf(el) }; ITEMS.push(x); if (BY) BY.set(el, x); }
    x.src = src; x.done = false;
    var own = ownerKind(el);
    if (own === 'none') return settle(x, '', '', 'none');
    if (blk) return settle(x, own && own !== 'none' ? own : 'assist', el.__amText && !own ? 'rule' : 'owner');
    if (own) return settle(x, own, 'owner');
    var rk = ruleKind(el);
    if (rk) return settle(x, rk, 'rule');
    if (x.type !== 'frame' && !sizeOk(el)) { x.done = true; x.state = 'skip'; x.kind = ''; detach(x); if (CHECK) checkTag(x); return; }
    var pk = pathKind(el);
    if (pk) return settle(x, pk, 'rule');
    if (!CFG.auto) return settle(x, '', '', 'off');
    var h = hintKind(el, src);
    if (h) { x.why = h.why; x.tool = h.tool || ''; return settle(x, h.k, 'name'); }
    if (!CFG.meta || !src || x.type === 'frame' || /^blob:/.test(src) || /\.svg(?:$|\?)/i.test(src)) return settle(x, '', '', 'no');
    if (x.type === 'video' && !/\.(mp4|m4v|mov|webm)(?:$|\?)/i.test(src)) return settle(x, '', '', 'no');
    x.state = 'wait'; if (CHECK) checkTag(x);
    readMeta(src, el).then(function (v) {
      if (x.src !== src) return;
      if (v && v.kind) { x.tool = v.tool || ''; x.why = v.kind === 'edit' ? 'IPTC 디지털 출처 유형: AI로 합성(compositeWithTrainedAlgorithmicMedia)' : v.basis === 'gen' ? '파일에 생성 프로그램의 설정 기록이 들어 있습니다' : '디지털 출처 유형이 생성형 AI(trainedAlgorithmicMedia)로 기록돼 있습니다'; settle(x, v.kind, v.basis); }
      else { x.why = v && v.note || ''; settle(x, '', '', v && v.state === 'cors' ? 'cors' : v && v.state === 'skip' ? 'skip' : 'no'); }
    });
  }
  function settle(x, kind, basis, state) {
    x.done = true; x.kind = kind || ''; x.basis = basis || ''; x.state = state || (kind ? 'on' : 'no');
    if (x.kind) {
      if (x.type === 'img' || x.type === 'bg') x.thumb = x.src && x.src.length < 2000 ? x.src : '';
      attach(x);
    } else if (CHECK) checkTag(x);
    else detach(x);
    changed();
  }
  var chT = 0;
  function changed() {
    if (chT) return;
    chT = setTimeout(function () { chT = 0; if (NOTICE) NOTICE.update(); if (CFG.ld) writeLd(); if (CHECK) drawPanel(); }, 300);
  }

  var IO = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { IO.unobserve(e.target); e.target.__amSeen = 1; judgeWhenReady(e.target); } });
  }, { rootMargin: '400px 0px' }) : null;
  function judgeWhenReady(el) {
    if (el.tagName === 'IMG' && !(el.complete && el.naturalWidth)) { el.addEventListener('load', function () { judge(el); }, { once: true }); return; }
    judge(el);
  }
  function scan() {
    candidates().forEach(function (el) {
      var x = itemOf(el);
      if (x && x.done && x.src === srcOf(el) && !(x.state === 'skip' && sizeOk(el))) { if (x.host && !x.host.isConnected && x.kind) attach(x); return; }
      if (x && x.state === 'skip') x.done = false;
      // 운영자 표시 · 규칙은 화면 밖이어도 바로(목록 · 검색 정보에 들어가게), 나머지는 가까워질 때
      if (ownerKind(el) || ruleKind(el) || isBlock(el) || !IO || el.__amSeen || (x && x.state === 'skip')) judgeWhenReady(el);
      else IO.observe(el);
    });
    // 사라진 것 정리
    ITEMS = ITEMS.filter(function (x) { if (!x.el.isConnected) { detach(x); return false; } return true; });
    changed();
  }

  /* ---------- 검색 · AI용 구조화 정보(schema.org digitalSourceType) ---------- */
  function writeLd() {
    var its = ITEMS.filter(function (x) { return x.kind && x.src && /^https?:/.test(x.src) && x.type !== 'block' && x.type !== 'frame'; }).slice(0, 40);
    var old = D.getElementById('aimarker-ld');
    if (!its.length) { if (old) old.remove(); return; }
    var g = its.map(function (x) {
      return { '@type': x.type === 'video' ? 'VideoObject' : 'ImageObject', contentUrl: x.src, digitalSourceType: 'https://cv.iptc.org/newscodes/digitalsourcetype/' + DST[x.kind],
        description: labelOf(x) + ' (' + t('b_' + x.basis) + ', AIMarker 자동 표시)' };
    });
    var s = old || D.createElement('script');
    s.type = 'application/ld+json'; s.id = 'aimarker-ld';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': g });
    if (!old) (D.head || D.documentElement).appendChild(s);
  }

  /* ---------- 점검 모드(운영자용) ---------- */
  var CHECK = false, PANEL = null;
  function checkTag(x) { if (!CHECK || x.kind) return; if (!x.host) x.host = hostFor(x); if (!x.host.isConnected) { var a = x.type === 'block' ? x.el : anchorOf(x.el); if (a.parentNode) a.parentNode.insertBefore(x.host, a.nextSibling); } render(x); place(x); }
  function startCheck() {
    if (CHECK) return; CHECK = true;
    var host = D.createElement('div'); host.setAttribute('data-aimarker-panel', '1');
    host.style.cssText = 'all:initial;position:fixed;top:12px;right:12px;bottom:12px;width:360px;max-width:calc(100vw - 24px);z-index:2147482500';
    var r = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    r.innerHTML = '<style>:host{all:initial}*{box-sizing:border-box}.p{display:flex;flex-direction:column;height:100%;background:#fff;border-radius:18px;box-shadow:0 24px 64px rgba(8,20,47,.3),0 0 0 1px rgba(14,31,71,.1);font-family:' + FONT + ';color:#0E1F47;letter-spacing:-.01em;-webkit-font-smoothing:antialiased;overflow:hidden}' +
      '.h{padding:14px 16px 12px;background:#0E1F47;color:#fff}.h b{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:820}.h b svg{width:16px;height:18px}.h small{display:block;margin-top:4px;font-size:12px;color:#B7C3DD;line-height:1.5}' +
      '.s{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:12px 14px;border-bottom:1px solid #EEF1F6}.s div{padding:8px 6px;border-radius:10px;background:#F4F6FA;text-align:center}.s b{display:block;font-size:18px;font-weight:820}.s span{font-size:11px;color:#586179}' +
      '.l{flex:1;overflow:auto;padding:6px 8px}.i{display:flex;gap:10px;align-items:center;padding:8px;border-radius:10px;cursor:pointer}.i:hover{background:#F4F6FA}.i .th{width:44px;height:44px;border-radius:8px;background:#E2E6EE center/cover no-repeat;flex:0 0 44px}' +
      '.i b{display:block;font-size:12.5px}.i small{display:block;font-size:11.5px;color:#586179;line-height:1.4;word-break:break-all}.i .st{display:inline-flex;height:20px;align-items:center;padding:0 7px;border-radius:6px;font-size:11px;font-weight:800;margin-right:4px}' +
      '.on{background:#E8F1FF;color:#0A4FCB}.cors{background:#FFF4E5;color:#B54708}.no{background:#F1F4F9;color:#586179}.skip,.off,.none,.wait{background:#F6F8FB;color:#858C9D}' +
      '.f{padding:12px 14px;border-top:1px solid #EEF1F6;font-size:12px;color:#586179;line-height:1.6}.f a{color:#0B63F6}.f button{margin-top:8px;width:100%;height:36px;border:1px solid #D0D6E0;border-radius:10px;background:#fff;color:#0E1F47;font:720 12.5px/1 ' + FONT + ';cursor:pointer}</style>' +
      '<div class="p" role="region" aria-label="AIMarker 점검 모드"><div class="h"><b>' + fp('', true) + 'AIMarker 점검 모드</b><small>운영자용 점검 화면입니다. 주소 뒤에 ?aimarker=check 를 붙였을 때만 열리고, 보통 방문자에게는 보이지 않습니다. 이 페이지의 이미지와 영상을 무엇으로 판단했는지 보여 줍니다.</small></div>' +
      '<div class="s"><div><b data-c="on">0</b><span>표시함</span></div><div><b data-c="no">0</b><span>기록 없음</span></div><div><b data-c="cors">0</b><span>못 읽음</span></div><div><b data-c="skip">0</b><span>건너뜀</span></div></div>' +
      '<div class="l"></div><div class="f">AI로 만든 이미지인데 \'기록 없음\'이면 이미지 설명(대체 글)에 \'AI 생성\'을 적거나, 설치 코드에 위치 규칙(data-ai-gen)을 더하세요. \'못 읽음\'은 다른 서버(CDN)에 있는 파일이라 기록을 읽지 못한 것입니다. <a href="' + HOME + '/site/#rules" target="_blank" rel="noopener">규칙 만들기</a><button type="button">점검 끝내기</button></div></div>';
    (D.body || D.documentElement).appendChild(host);
    r.querySelector('button').addEventListener('click', function () { var u = new URL(location.href); u.searchParams.delete('aimarker'); location.href = u.href.replace(/#aimarker=check$/, ''); });
    PANEL = r;
    ITEMS.forEach(function (x) { if (!x.kind) checkTag(x); });
    drawPanel();
  }
  var ST = { on: '표시함', no: '기록 없음', cors: '못 읽음', skip: '건너뜀', off: '자동 꺼짐', none: 'AI 아님(운영자)', wait: '확인 중' };
  function drawPanel() {
    if (!PANEL) return;
    var n = { on: 0, no: 0, cors: 0, skip: 0 };
    ITEMS.forEach(function (x) { var k = x.kind ? 'on' : x.state; if (k === 'off' || k === 'none' || k === 'wait') k = 'skip'; if (n[k] != null) n[k]++; });
    Object.keys(n).forEach(function (k) { PANEL.querySelector('[data-c="' + k + '"]').textContent = n[k]; });
    var l = PANEL.querySelector('.l');
    ITEMS.sort(docOrder);
    l.innerHTML = ITEMS.map(function (x, i) {
      var k = x.kind ? 'on' : x.state || 'no';
      var th = x.src && x.type !== 'block' && x.type !== 'frame' && x.type !== 'video' ? '<span class="th" style="background-image:url(&quot;' + esc(x.src) + '&quot;)"></span>' : '<span class="th"></span>';
      var why = x.kind ? t('b_' + x.basis) + (x.tool ? ' · ' + x.tool : '') + (x.why ? ' · ' + x.why : '') : (x.why || fileOf(x.src) || x.el.tagName.toLowerCase());
      return '<div class="i" data-i="' + i + '">' + th + '<span><b><span class="st ' + k + '">' + (x.kind ? esc(labelOf(x)) : ST[k] || k) + '</span></b><small>' + esc(why).slice(0, 160) + '</small></span></div>';
    }).join('') || '<p style="padding:12px;font-size:12.5px;color:#586179">이미지나 영상을 찾는 중입니다.</p>';
    Array.prototype.forEach.call(l.querySelectorAll('.i'), function (d) { d.addEventListener('click', function () { reveal(ITEMS[+d.getAttribute('data-i')]); }); });
  }

  /* ---------- 시작 ---------- */
  function readCfg(me) {
    function a(k) { return me.getAttribute('data-' + k) || ''; }
    var raw = {};
    ['name', 'use', 'level', 'review', 'privacy', 'contact', 'style', 'side', 'theme', 'date', 'site'].forEach(function (k) { raw[k] = a(k); });
    var tg = a('tag'); CFG.tag = ({ tag: 1, mini: 1, bar: 1, none: 1 })[tg] ? tg : 'tag';
    var ps = a('pos'); CFG.pos = ({ tl: 1, tr: 1, bl: 1, br: 1 })[ps] ? ps : 'tl';
    CFG.light = a('tag-theme') === 'light';
    CFG.z = Math.max(1, Math.min(2147480000, parseInt(a('z'), 10) || 3));
    CFG.min = Math.max(40, Math.min(600, parseInt(a('min'), 10) || 96));
    CFG.meta = a('meta') === '0' ? false : a('meta') === 'all' ? 'all' : 'same'; CFG.alt = a('alt') !== '0'; CFG.ld = a('ld') !== '0'; CFG.auto = a('auto') !== '0';
    CFG.name = clean(raw.name, 30); CFG.site = clean(raw.site, 40);
    LANG = a('lang') === 'en' ? 'en' : 'ko';
    var R = {};
    ['gen', 'edit', 'virtual', 'text'].forEach(function (k) { var v = a('ai-' + k).slice(0, 400); if (v) { try { D.querySelector(v); R[k] = v; } catch (e) { /* 잘못된 선택자는 버림 */ } } });
    var paths = a('ai-path').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    R.pathOn = paths.some(function (p) { var re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')); return re.test(location.pathname); });
    CFG.rules = R;
    return raw;
  }

  var API = W.AIMarker = W.AIMarker || {};
  API.v3 = true; API.version = VERSION;
  API.render = build;
  API.tag = function (el, kind, why) { if (!el) return; var x = itemOf(el); if (!x) { x = { el: el, type: isBlock(el) ? 'block' : typeOf(el) }; ITEMS.push(x); if (BY) BY.set(el, x); } x.src = srcOf(el); x.why = why || ''; settle(x, OWN[kind] && OWN[kind] !== 'none' ? OWN[kind] : 'gen', 'owner'); };
  API.untag = function (el) { var x = itemOf(el); if (x) { x.kind = ''; x.state = 'none'; detach(x); changed(); } };
  API.scan = function () { scan(); };
  API.items = function () { return ITEMS.filter(function (x) { return x.kind; }).map(function (x) { return { el: x.el, kind: x.kind, label: labelOf(x), basis: x.basis, tool: x.tool || '', src: x.src || '' }; }); };
  API.check = startCheck;

  var me = D.currentScript;
  if (!me) { var all = D.querySelectorAll('script[src*="aimarker.kr/m.js"],script[src*="/m.js"]'); me = all[all.length - 1]; }
  if (!me || me.__am) return;
  me.__am = 1;
  if (me.hasAttribute('data-preview')) return;   // 설치 마법사 미리보기는 render 만 씀
  var RAW = readCfg(me);
  var wantCheck = /[?&#]aimarker=check\b/.test(location.search + location.hash) || me.getAttribute('data-check') === '1';
  function boot() {
    if (!D.querySelector('[data-aimarker]')) build(RAW);
    if (CFG.tag !== 'none' || wantCheck) {
      scan();
      var mt = 0;
      if (W.MutationObserver) new MutationObserver(function (ms) {
        if (mt) return;
        for (var i = 0; i < ms.length; i++) {
          var m = ms[i], t0 = m.target;
          if (t0 && t0.nodeType === 1 && mine(t0)) continue;
          if (m.type === 'childList') {
            var ok = false, j;
            for (j = 0; !ok && j < m.addedNodes.length; j++) { var nd = m.addedNodes[j]; if (nd.nodeType === 1 && nd.tagName !== 'AM-TAG' && !(nd.hasAttribute && (nd.hasAttribute('data-aimarker') || nd.hasAttribute('data-aimarker-card') || nd.hasAttribute('data-aimarker-panel')))) ok = true; }
            for (j = 0; !ok && j < m.removedNodes.length; j++) if (m.removedNodes[j].nodeType === 1 && m.removedNodes[j].tagName !== 'AM-TAG') ok = true;
            if (!ok) continue;
          } else if (m.attributeName === 'style' && !/url\(/i.test(t0.getAttribute('style') || '') && !itemOf(t0)) continue;
          mt = setTimeout(function () { mt = 0; scan(); }, 400);
          return;
        }
      }).observe(D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'data-ai', 'style'] });
      W.addEventListener('resize', placeAll);
      W.addEventListener('load', function () { scan(); placeAll(); });
      if (D.fonts && D.fonts.ready) D.fonts.ready.then(placeAll);
      // 레이아웃이 밀린 경우(펼침 · 늦게 뜬 광고 등)를 위해 화면 가까이 있는 것만 가끔 다시 맞춤
      setInterval(function () {
        if (D.hidden) return;
        ITEMS.forEach(function (x) {
          if (!x.host || !x.host.isConnected) return;
          var r = x.el.getBoundingClientRect();
          if (r.bottom < -80 || r.top > W.innerHeight + 80) return;
          if (x.at && (Math.abs(r.width - x.at[2]) > 1 || Math.abs(r.height - x.at[3]) > 1)) x.cb = undefined;
          place(x);
        });
      }, 900);
    }
    if (wantCheck) startCheck();
  }
  if (D.body) boot(); else D.addEventListener('DOMContentLoaded', boot);
})();
