/*! AIMarker 표시 v2 · https://aimarker.kr · 무료
 * 붙이는 한 줄 예:
 *   <script src="https://aimarker.kr/m.js" data-name="회사 이름" data-use="text,image,chat" data-level="assist" data-review="all" data-privacy="1" async></script>
 * - 사이트 운영자가 스스로 쓰는 안내(자기 선언)입니다. AIMarker 와 한국AI윤리위원회는 그 사이트를 심사 · 보증하지 않으며 안내 창에도 그렇게 적습니다.
 * - 외부로 아무것도 보내지 않습니다(방문 기록 · 쿠키 없음). 모든 내용은 data- 값으로만 그립니다.
 * - data-use: text · image · video · chat · recommend · translate · analysis · virtual
 * - data-level(AI 성분표): human(사람 작성) · assist(AI 도움) · generated(AI 생성). 비우면 쓰는 곳이 있을 때 assist
 * - data-style: badge(화면 아래 작은 배지, 기본) · line(페이지 맨 아래 한 줄) · inline(id="aimarker" 칸 안), data-side: left · right, data-theme: light · dark
 * - Shadow DOM 안에 그려 사이트 스타일과 섞이지 않습니다.
 * - 2.0 AI 이미지 자동 태그(data-auto="0" 이면 끔): <img data-ai="generated|edit|virtual"> 로 표시한 이미지, 파일 이름 · 대체 글에 AI 도구 흔적이 있는 이미지,
 *   같은 사이트 주소의 이미지 중 파일 속 출처 기록(IPTC · C2PA)이 AI 생성인 이미지에 'AI 생성' · 'AI 편집' · '가상인물' 태그를 자동으로 붙입니다.
 *   이미지 앞부분만 이 사이트에서 읽고, 밖으로 보내는 것은 없습니다. 직접 붙이기: AIMarker.tag(img, 'AI 생성'), 다시 찾기: AIMarker.scan() */
(function () {
  'use strict';
  var W = window;
  var USE = {
    text: '글 · 상품 설명 · 공지를 쓸 때 AI의 도움을 받습니다',
    image: '일부 이미지를 AI로 만들거나 다듬습니다',
    video: '일부 영상 · 음성을 AI로 만들거나 편집합니다',
    chat: '고객 문의 일부에 AI 챗봇 · 자동 답변을 씁니다',
    recommend: '상품 · 콘텐츠 추천에 AI를 사용합니다',
    translate: '번역 · 요약에 AI를 사용합니다',
    analysis: '데이터 분석 · 업무 자동화에 AI를 사용합니다',
    virtual: '광고 · 소개에 AI로 만든 가상인물이 나옵니다'
  };
  var REVIEW = { all: 'AI가 만든 결과물은 담당자가 확인한 뒤 게시합니다', important: '중요한 안내와 계약 관련 내용은 담당자가 직접 확인합니다' };
  var LEVELS = [['human', '사람 작성'], ['assist', 'AI 도움'], ['generated', 'AI 생성']];
  var HOME = 'https://aimarker.kr/?utm_source=label&utm_medium=referral';
  var SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z" fill="currentColor"/></svg>';
  var LOGO_SVG = '<svg viewBox="0 0 84.97 100" aria-hidden="true"><defs><linearGradient id="aimkfp" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="84.97" y2="0"><stop offset="0" stop-color="#0030C4"/><stop offset="0.45" stop-color="#0858F0"/><stop offset="0.8" stop-color="#0E8BFB"/><stop offset="1" stop-color="#33C8FF"/></linearGradient></defs><path fill="url(#aimkfp)" d="M38 100C38 100 37 100 36 100C35 100 34 100 33 100C28 99 23 97 19 94C18 93 17 92 16 92C15 90 13 89 12 86C11 85 10 84 10 84C10 83 9 83 9 82C9 81 10 81 10 80C10 80 11 79 11 79C12 79 13 79 14 79C14 80 15 80 16 82C16 82 17 82 17 83C18 85 19 85 20 87C24 90 29 93 34 94C35 94 35 94 36 94C38 94 39 94 39 94C41 95 41 98 40 99C40 100 39 100 38 100C38 100 38 100 38 100ZM46 100C45 100 43 98 43 97C43 96 44 95 45 94C45 94 46 94 46 94C47 94 49 93 51 93C57 90 62 87 65 82C67 79 69 76 71 72C71 71 71 71 72 70C72 70 72 70 72 70C73 69 74 69 75 70C76 70 77 71 77 73C77 73 76 73 76 74C75 76 75 77 74 79C73 80 73 80 73 81C70 86 67 89 64 92C64 92 64 92 64 92C63 93 63 93 62 93C61 95 59 96 57 97C57 97 57 97 56 97C55 97 54 98 53 98C51 99 48 100 47 100C46 100 46 100 46 100ZM39 92C33 91 28 90 24 86C22 85 20 83 19 82C16 78 14 74 12 70C11 67 10 63 9 60C9 60 9 59 9 59C9 58 9 58 9 58C9 57 10 57 10 56C10 56 11 56 11 56C12 56 12 56 12 56C13 56 13 56 13 56C14 56 14 56 14 57C15 57 15 58 15 58C15 59 15 61 16 62C16 65 17 66 18 68C19 71 21 74 23 77C23 77 23 77 23 77C23 77 23 78 24 78C28 83 33 85 38 86C39 86 40 86 41 86C43 86 46 85 48 85C52 83 56 81 58 77C59 77 59 76 60 76C60 75 61 73 61 72C63 68 64 64 64 60C64 59 64 56 64 55C64 51 63 47 62 43C61 37 58 32 55 28C52 26 49 24 45 24C42 23 39 24 37 25C32 27 29 31 26 35C24 39 23 43 22 48C22 49 22 49 22 51C22 53 22 53 22 54C23 60 25 66 28 70C29 72 31 73 32 74C34 76 37 77 39 77C40 77 42 77 43 77C47 77 51 74 54 70C56 66 56 62 56 57C55 53 54 49 51 45C51 45 50 44 49 43C48 42 47 42 45 41C45 41 44 41 44 41C42 42 40 43 39 45C38 47 38 50 39 53C39 54 39 55 40 56C40 56 40 57 40 57C41 58 41 59 42 59L42 59L42 59C42 59 42 58 42 57C42 57 41 56 41 56C41 55 42 55 42 54C42 54 42 54 43 54C44 53 45 53 46 54C46 54 46 55 47 56C47 57 47 57 47 58C47 59 47 60 47 60C47 61 47 62 46 63C46 63 45 64 45 64C43 65 42 65 41 65C39 64 37 63 36 61C35 59 34 55 33 52C33 51 33 51 33 50C33 48 33 48 33 47C34 45 35 42 36 40C37 39 37 39 38 38C42 35 48 35 52 39C54 40 56 42 58 45C61 51 62 58 61 64C61 68 59 72 57 75C54 80 48 83 43 83C42 83 40 83 40 83C36 83 33 82 30 80C28 78 25 76 23 73C20 69 18 64 17 58C17 56 17 54 17 51C17 49 17 47 17 45C18 38 21 31 26 25C31 21 37 18 43 18C47 18 51 19 54 21C56 22 59 24 61 27C64 31 66 36 68 42C69 45 69 49 69 54C69 56 69 59 69 61C69 69 67 75 64 80C61 84 58 87 53 89C50 91 47 91 43 92C42 92 40 92 39 92ZM8 77C7 77 7 77 6 77C6 77 6 76 6 76C5 76 4 74 4 72C2 69 1 63 0 58C0 54 0 50 0 47C1 40 3 33 6 27C6 26 6 26 6 26C6 26 6 25 6 25C8 22 10 18 13 16C14 14 16 12 18 10C19 9 20 9 20 9C21 8 22 8 23 9C24 10 25 12 24 13C23 14 23 14 23 14C23 14 22 15 22 15C22 15 21 15 21 15C21 16 21 16 21 16C20 16 19 18 19 18C12 25 8 34 6 44C6 48 6 52 6 56C7 62 8 69 10 72C11 73 11 73 11 74C11 75 10 77 9 77C8 77 8 77 8 77ZM41 74C39 74 38 73 36 72C33 71 30 68 28 64C26 59 25 53 25 47C26 43 27 39 29 35C29 35 29 35 30 34C31 32 33 30 35 29C38 28 40 27 42 27C43 27 44 27 45 27C48 27 50 28 53 30C54 31 56 32 57 34C57 34 57 35 57 35C57 36 57 36 57 37C57 37 57 37 56 38C55 38 54 38 54 38C53 38 53 37 52 37C52 36 51 35 50 34C49 33 47 33 45 33C45 32 43 32 43 33C40 33 37 34 35 37C31 41 30 47 31 53C31 56 32 60 34 63C35 64 35 65 36 66C38 67 40 68 42 68C43 68 44 68 45 68C47 67 48 65 48 62C48 61 48 59 48 58C48 56 48 55 47 54C46 52 46 51 45 51C45 50 45 50 44 49C44 48 45 46 46 46C47 46 47 46 47 46C48 46 49 47 49 47C50 48 51 50 52 52C53 55 54 59 54 62C53 65 52 68 51 70C50 70 50 70 50 71C50 71 49 72 48 72C46 73 44 74 41 74ZM81 68C80 68 79 68 79 67C79 67 78 66 78 66C78 66 78 65 78 65C78 64 78 64 78 62C79 61 79 58 79 56C79 52 78 47 78 43C76 36 75 30 72 25C69 20 66 16 62 12C60 10 56 8 53 7C51 7 49 6 46 6C45 6 43 6 42 6C39 6 37 7 36 8C36 8 35 8 35 8C34 8 33 8 32 7C32 7 31 6 31 6C31 5 31 5 31 5C31 4 32 3 32 3C33 2 34 2 35 1C37 1 39 0 41 0C42 0 43 0 44 0C47 0 50 0 53 1C58 2 63 5 67 8C69 10 71 12 73 15C73 15 73 15 73 15C73 16 74 17 75 18C80 25 83 36 84 47C85 49 85 51 85 54C85 57 85 59 85 62C84 63 84 63 84 64C84 64 84 65 84 65C84 66 84 66 83 67C83 68 82 68 81 68C81 68 81 68 81 68ZM73 66C73 66 72 66 72 66C71 66 71 65 71 64C71 64 71 63 71 63C71 62 71 62 71 61C71 60 71 59 71 56C71 54 71 53 71 52C71 49 70 47 70 45C70 43 69 43 69 42C69 41 69 41 70 41C70 41 70 40 70 40C70 40 71 39 72 39C72 39 72 39 72 39C73 39 73 39 73 39C74 39 75 40 75 42C75 42 75 42 76 43C76 45 76 46 76 48C77 52 77 56 77 60C77 61 77 61 76 62C76 63 76 63 76 63C76 64 76 64 76 64C76 65 75 66 74 66C74 66 74 66 74 66C73 66 73 66 73 66ZM11 48C10 48 9 47 9 46C9 45 9 42 10 38C11 35 12 32 14 29C16 25 19 21 22 18C27 13 34 9 42 9C47 8 51 9 56 11C57 12 59 13 60 14C64 17 67 20 69 25C70 26 70 27 71 29C72 31 72 31 72 32C73 33 73 33 73 34C73 34 73 34 73 35C72 35 72 35 72 35C72 36 71 36 70 36C70 36 69 36 69 36C68 36 68 35 67 35C67 34 67 33 66 31C65 29 65 29 64 28C61 23 57 19 53 17C52 16 51 16 51 16C47 15 44 14 40 15C36 16 33 17 30 19C27 21 25 23 23 26C20 29 18 34 16 38C16 41 15 44 15 45C15 46 15 46 15 46C14 47 14 48 13 48C12 48 12 48 11 48Z"/></svg>';
  function LOGO(k) { return LOGO_SVG.replace(/aimkfp/g, 'aimkfp' + k); }

  function clean(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n || 60); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function josa(w) { var c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? (c % 28 ? '은' : '는') : '는'; }

  function normalize(raw) {
    var c = {};
    c.name = clean(raw.name, 30);
    c.uses = clean(raw.use, 160).split(/[,\s]+/).filter(function (k, i, a) { return USE[k] && a.indexOf(k) === i; });
    c.review = REVIEW[clean(raw.review, 12)] || '';
    c.privacy = clean(raw.privacy, 2) === '1';
    c.contact = clean(raw.contact, 80);
    if (c.contact && !/^[^\s@]{1,64}@[A-Za-z0-9.\-]{1,120}\.[A-Za-z]{2,}$/.test(c.contact) && !/^https?:\/\/[^\s"'<>]{3,80}$/.test(c.contact)) c.contact = '';
    c.style = ({ badge: 1, line: 1, inline: 1 })[clean(raw.style, 8)] ? clean(raw.style, 8) : 'badge';
    c.side = clean(raw.side, 6) === 'right' ? 'right' : 'left';
    c.dark = clean(raw.theme, 6) === 'dark';
    c.date = /^\d{4}-\d{2}$/.test(clean(raw.date, 7)) ? clean(raw.date, 7) : '';
    var lv = clean(raw.level, 10);
    if (!({ human: 1, assist: 1, generated: 1 })[lv]) {
      lv = c.uses.length ? 'assist' : 'human';
    }
    c.level = lv;
    if (!c.uses.length && lv !== 'human') c.uses = ['text'];
    return c;
  }

  function css(C, side) {
    return ':host{all:initial}*{box-sizing:border-box}' +
      '.k{font-family:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:' + C.fg + ';-webkit-font-smoothing:antialiased;letter-spacing:-.01em;line-height:1.5;word-break:keep-all}' +
      '.k svg{width:1em;height:1em;flex:0 0 auto}' +
      '.badge{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px 0 9px;border-radius:999px;border:1px solid ' + C.line + ';background:' + C.bg + ';color:' + C.fg + ';font-family:inherit;font-weight:750;font-size:13px;line-height:1;cursor:pointer;box-shadow:0 6px 18px rgba(14, 31, 71,.14);transition:transform .15s ease,box-shadow .15s ease}' +
      '.badge:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(14, 31, 71,.2)}.badge svg{width:20px;height:20px}' +
      '.badge:focus-visible,.lnk:focus-visible,.line button:focus-visible{outline:2px solid ' + C.acc + ';outline-offset:2px}' +
      '.line{display:flex;justify-content:center;padding:12px 16px;font-size:12.5px;color:' + C.sub + '}' +
      '.line button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:inherit;font:inherit;cursor:pointer;padding:4px 6px;border-radius:8px}.line button b{color:' + C.acc + '}.line svg{width:18px;height:18px}' +
      '.pop{position:absolute;bottom:46px;' + side + ':0;width:336px;max-width:calc(100vw - 24px);max-height:calc(100vh - 84px);overflow:auto;background:' + C.bg + ';border:1px solid ' + C.line + ';border-radius:16px;box-shadow:0 18px 48px rgba(14, 31, 71,.22);padding:16px 16px 12px;display:none;text-align:left}' +
      '.pop.on{display:block}.pop h4{display:flex;align-items:center;gap:7px;margin:0 0 2px;font-size:15.5px;font-weight:800;color:' + C.fg + '}.pop h4 svg{color:' + C.acc + ';width:17px;height:17px}' +
      '.pop .who{margin:0;font-size:12.5px;color:' + C.sub + '}' +
      '.lv{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:12px 0 4px}.lv span{text-align:center;padding:6px 2px;border-radius:8px;background:' + C.chip + ';color:' + C.sub + ';font-weight:750;font-size:11.5px}' +
      '.lv span.on{color:#fff}.lv .human.on{background:#0E9A6A}.lv .assist.on{background:#0B63F6;color:#fff}.lv .generated.on{background:#0E1F47' + (C.dark ? ';box-shadow:inset 0 0 0 1px #3A4A70' : '') + '}' +
      '.lvt{margin:0 0 6px;font-size:11.5px;color:' + C.sub + '}' +
      '.pop ul{list-style:none;margin:0;padding:0}.pop li{display:flex;gap:8px;padding:7px 0;border-top:1px solid ' + C.line + ';font-size:13.5px;color:' + C.fg + '}.pop li:first-child{border-top:0}' +
      '.pop li i{flex:0 0 6px;height:6px;margin-top:8px;border-radius:50%;background:' + C.acc + '}.pop li.ok i{background:#0E9A6A}' +
      '.pop .ct{margin:8px 0 0;font-size:12.5px;color:' + C.sub + ';word-break:break-all}.pop .ct a{color:' + C.acc + '}' +
      '.pop .ft{margin:12px -16px -12px;padding:10px 16px 11px;border-top:1px solid ' + C.line + ';background:' + C.foot + ';border-radius:0 0 16px 16px;font-size:11.5px;color:' + C.sub + '}' +
      '.lnk{display:flex;align-items:center;gap:8px;margin-top:7px;color:' + C.fg + ';text-decoration:none;font-size:12px;line-height:1.35}.lnk svg{width:24px;height:24px;flex:0 0 24px}' +
      '.lnk b{display:block;font-weight:850;letter-spacing:.02em}.lnk b .ai{color:' + C.acc + '}.lnk em{display:block;font-style:normal;font-weight:700;color:' + C.acc + '}.lnk:hover em{text-decoration:underline}' +
      '.std{display:block;margin-top:6px;font-size:10.5px;color:' + C.sub + ';opacity:.9}' +
      '.x{position:absolute;top:10px;right:10px;width:26px;height:26px;border:0;border-radius:8px;background:' + C.chip + ';color:' + C.sub + ';cursor:pointer;font:700 15px/26px sans-serif;padding:0}' +
      '.wrap{position:relative;display:inline-block}' +
      '@media (max-width:560px){.badge{height:32px;font-size:12px;padding:0 12px 0 8px}.badge svg{width:18px;height:18px}.pop{bottom:42px}}';
  }

  function build(raw, mountEl) {
    var c = normalize(raw || {});
    var C = c.dark ? { bg: '#0B1734', fg: '#E9EDF5', sub: '#9AA5BC', line: '#22325A', chip: '#17264D', acc: '#5B9BFF', foot: '#0A1530', dark: 1 }
      : { bg: '#FFFFFF', fg: '#0E1F47', sub: '#586179', line: '#E2E6EE', chip: '#F0F3F8', acc: '#0B63F6', foot: '#F6F8FB' };
    var items = c.uses.map(function (k) { return '<li><i></i><span>' + esc(USE[k]) + '</span></li>'; }).join('') +
      (c.review ? '<li class="ok"><i></i><span>' + esc(c.review) + '</span></li>' : '') +
      (c.privacy ? '<li class="ok"><i></i><span>AI 도구에 고객 개인정보를 넣지 않습니다</span></li>' : '');
    if (!items) items = '<li class="ok"><i></i><span>사람이 직접 만든 콘텐츠를 중심으로 운영합니다</span></li>';
    var ct = c.contact ? '<p class="ct">AI 활용 문의 ' + (c.contact.indexOf('@') > 0 ? '<a href="mailto:' + esc(c.contact) + '">' + esc(c.contact) + '</a>' : '<a href="' + esc(c.contact) + '" target="_blank" rel="noopener">' + esc(c.contact.replace(/^https?:\/\//, '')) + '</a>') + '</p>' : '';
    var lv = '<div class="lv" role="img" aria-label="AI 성분표: ' + LEVELS.filter(function (l) { return l[0] === c.level; })[0][1] + '">' +
      LEVELS.map(function (l) { return '<span class="' + l[0] + (l[0] === c.level ? ' on' : '') + '">' + l[1] + '</span>'; }).join('') + '</div><p class="lvt">AI 성분표 · 이 사이트의 콘텐츠는 주로 \'' + LEVELS.filter(function (l) { return l[0] === c.level; })[0][1] + '\'입니다</p>';
    var who = (c.name ? esc(c.name) + josa(c.name) + ' 이렇게 AI를 사용합니다' : '이 사이트는 이렇게 AI를 사용합니다') + (c.date ? ' · ' + c.date.replace('-', '.') + ' 작성' : '');
    var pop = '<div class="pop" role="dialog" aria-label="AI 활용 안내"><button class="x" type="button" aria-label="닫기">×</button><h4>' + SPARK + 'AI 활용 안내</h4><p class="who">' + who + '</p>' + lv + '<ul>' + items + '</ul>' + ct +
      '<div class="ft">이 안내는 사이트 운영자가 직접 작성했습니다.<a class="lnk" href="' + HOME + '" target="_blank" rel="noopener">' + LOGO('l') + '<span><b><span class="ai">AI</span>Marker</b><em>우리 사이트에도 무료로 달기 →</em></span></a><span class="std">표시 문구 기준 한국AI윤리위원회 · 심사 · 보증 표시가 아닙니다</span></div></div>';
    var host = document.createElement('div');
    host.setAttribute('data-aimarker', '1');
    var style = c.style, box = null;
    if (mountEl) { host.style.cssText = style === 'badge' ? 'all:initial;position:absolute;bottom:14px;' + c.side + ':14px;z-index:5' : 'all:initial;display:block;position:absolute;left:0;right:0;bottom:0'; }
    else {
      box = style === 'inline' ? document.getElementById('aimarker') : null;
      if (style === 'inline' && !box) style = 'line';
      host.style.cssText = style === 'badge' ? 'all:initial;position:fixed;bottom:16px;' + c.side + ':16px;z-index:2147482000' : 'all:initial;display:block';
    }
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var trigger = style === 'line'
      ? '<div class="line"><button type="button" aria-expanded="false">' + LOGO('n') + '<span>' + (c.name ? esc(c.name) + josa(c.name) : '이 사이트는') + ' 일부 콘텐츠에 AI를 활용합니다 · <b>안내 보기</b></span></button></div>'
      : '<button class="badge" type="button" aria-expanded="false">' + LOGO('b') + 'AI 활용 안내</button>';
    root.innerHTML = '<style>' + css(C, c.side) + '</style><div class="k"><div class="wrap">' + pop + trigger + '</div></div>';
    var p = root.querySelector('.pop'), t = root.querySelector('.badge, .line button');
    if (style === 'line') { var w = root.querySelector('.wrap'); w.style.display = 'block'; p.style.left = '50%'; p.style.right = 'auto'; p.style.transform = 'translateX(-50%)'; p.style.bottom = '48px'; }
    if (mountEl) { p.style.maxWidth = Math.max(240, (mountEl.clientWidth || 360) - 28) + 'px'; p.style.maxHeight = 'none'; }
    function setOpen(on) { p.classList.toggle('on', on); t.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    t.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!p.classList.contains('on')); });
    root.querySelector('.x').addEventListener('click', function (e) { e.stopPropagation(); setOpen(false); });
    p.addEventListener('click', function (e) { e.stopPropagation(); });
    if (!mountEl) {
      document.addEventListener('click', function () { setOpen(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    }
    host.__open = setOpen;
    if (mountEl) mountEl.appendChild(host);
    else if (box) box.appendChild(host);
    else (document.body || document.documentElement).appendChild(host);
    return host;
  }

  /* ---------- 2.0 AI 이미지 자동 태그 ---------- */
  var NAME_RE = /Gemini_Generated_Image|ChatGPT[\s_\-]?Image|DALL[·\-_]?E|OIG\d?[._\-]|ComfyUI|midjourney|firefly|leonardo[_\-]|ideogram|stable[\s_\-]?diffusion|sdxl|novelai|flux[_\-]\d|imagen[_\-]|bing[\s_\-]?image|copilot[\s_\-]image|generated[\s_\-]image|ai[\s_\-]generated|AI\s?생성|dreamina|seedream|recraft|^\d{5}-\d{6,12}\.png$/i;
  var AUTO = { tags: [], root: null, reads: 0, last: typeof WeakMap !== 'undefined' ? new WeakMap() : null };
  function tagText(v) { return v === 'virtual' ? '가상인물' : v === 'edit' ? 'AI 편집' : 'AI 생성'; }
  function layer() {
    if (AUTO.root) return AUTO.root;
    var h = document.createElement('div'); h.setAttribute('data-aimarker-tags', '1');
    h.style.cssText = 'all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147481999';
    var r = h.attachShadow ? h.attachShadow({ mode: 'open' }) : h;
    r.innerHTML = '<style>.t{position:fixed;display:none;align-items:center;gap:4px;padding:3px 9px 3px 6px;border-radius:999px;background:rgba(14, 31, 71,.8);color:#fff;font:800 11px/1.45 "Pretendard Variable",Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;letter-spacing:-.01em;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);white-space:nowrap;border:0}.t svg{width:12px;height:12px;flex:0 0 auto}.t.on{display:inline-flex}</style>';
    (document.body || document.documentElement).appendChild(h); AUTO.root = r; return r;
  }
  var raf = 0;
  function place() {
    if (raf || !AUTO.tags.length) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      AUTO.tags.forEach(function (x) {
        var b = x.img.getBoundingClientRect(), vis = x.img.isConnected && b.width >= 60 && b.height >= 40 && b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth;
        x.el.classList.toggle('on', vis);
        if (vis) { x.el.style.left = Math.round(Math.max(4, b.left + 8)) + 'px'; x.el.style.top = Math.round(Math.max(4, b.top + 8)) + 'px'; }
      });
    });
  }
  function tag(img, text, why) {
    if (!img || img.__amTag) return;
    var r = layer(), t = document.createElement('button'); t.type = 'button'; t.className = 't'; t.title = why || 'AI로 만든 이미지입니다';
    t.setAttribute('aria-label', (text || 'AI 생성') + ' 이미지 · AI 활용 안내 보기');
    t.innerHTML = SPARK + '<span>' + esc(text || 'AI 생성') + '</span>';
    t.addEventListener('click', function (e) { e.stopPropagation(); var b = document.querySelector('[data-aimarker]'); if (b && b.__open) b.__open(true); });
    r.appendChild(t); img.__amTag = t; AUTO.tags.push({ img: img, el: t }); place();
  }
  function judge(img) {
    var src = img.currentSrc || img.src || '';
    if (AUTO.last) { if (AUTO.last.get(img) === src) return; AUTO.last.set(img, src); }
    var v = (img.getAttribute('data-ai') || '').toLowerCase();
    if (v) { if (v !== 'none' && v !== 'human') tag(img, tagText(v), '사이트 운영자가 AI로 만든 이미지로 표시했습니다'); return; }
    var name = ''; try { name = decodeURIComponent(src.split('?')[0].split('/').pop() || ''); } catch (e) { name = src; }
    if (NAME_RE.test(name) || /AI\s?(?:로\s?)?(?:생성|만든)/.test(img.alt || '')) { tag(img, 'AI 생성', '파일 이름 · 설명에 AI 도구 흔적이 있습니다'); return; }
    var u; try { u = new URL(src, location.href); } catch (e2) { return; }
    if (u.origin !== location.origin || !/\.(jpe?g|png|webp)$/i.test(u.pathname) || AUTO.reads >= 24 || !W.fetch) return;
    AUTO.reads++;
    fetch(u.href, { headers: { Range: 'bytes=0-262143' }, credentials: 'same-origin' }).then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (ab) {
      if (!ab) return;
      var u8 = new Uint8Array(ab.slice(0, 262144)), s = '';
      for (var i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
      if (/compositeWithTrainedAlgorithmicMedia/.test(s)) tag(img, 'AI 편집', '파일 속 출처 기록(IPTC): AI로 편집 · 합성');
      else if (/trainedAlgorithmicMedia/.test(s) || (/c2pa|jumb/.test(s) && /DALL|OpenAI|Firefly|Midjourney|Imagen|Gemini|Stable Diffusion|ChatGPT/i.test(s))) tag(img, 'AI 생성', '파일 속 출처 기록(IPTC · C2PA): AI 생성');
    }).catch(function () { /* 읽지 못하면 그대로 */ });
  }
  function scan() {
    var imgs = document.images;
    for (var i = 0; i < imgs.length && i < 400; i++) (function (img) { if (img.complete && img.naturalWidth) judge(img); else img.addEventListener('load', function () { judge(img); }, { once: true }); })(imgs[i]);
    place();
  }
  function autoStart() {
    scan();
    addEventListener('scroll', place, { passive: true, capture: true }); addEventListener('resize', place); addEventListener('load', scan);
    if (W.MutationObserver) { var mt = 0; new MutationObserver(function () { clearTimeout(mt); mt = setTimeout(scan, 500); }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'data-ai'] }); }
  }

  W.AIMarker = W.AIMarker || {};
  W.AIMarker.render = build;
  W.AIMarker.tag = function (img, text) { tag(img, text || 'AI 생성', '사이트 운영자가 표시했습니다'); };
  W.AIMarker.scan = scan;
  W.AIMarker.version = '2.0.0';

  var me = document.currentScript;
  if (!me) { var all = document.querySelectorAll('script[src*="aimarker.kr/m.js"],script[src*="/m.js"]'); me = all[all.length - 1]; }
  if (!me || me.__am || me.hasAttribute('data-preview')) return;
  me.__am = 1;
  var raw = {};
  ['name', 'use', 'level', 'review', 'privacy', 'contact', 'style', 'side', 'theme', 'date', 'auto'].forEach(function (k) { raw[k] = me.getAttribute('data-' + k) || ''; });
  function mount() { if (!document.querySelector('[data-aimarker]')) build(raw); if (raw.auto !== '0') autoStart(); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
