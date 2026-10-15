/*! AIMarker 표시 v1 · https://aimarker.kr · 무료
 * 붙이는 한 줄 예:
 *   <script src="https://aimarker.kr/m.js" data-name="회사 이름" data-use="text,image,chat" data-level="assist" data-review="all" data-privacy="1" async></script>
 * - 사이트 운영자가 스스로 쓰는 안내(자기 선언)입니다. AIMarker 와 한국AI윤리위원회는 그 사이트를 심사 · 보증하지 않으며 안내 창에도 그렇게 적습니다.
 * - 외부로 아무것도 보내지 않습니다(방문 기록 · 쿠키 없음). 모든 내용은 data- 값으로만 그립니다.
 * - data-use: text · image · video · chat · recommend · translate · analysis · virtual
 * - data-level(AI 성분표): human(사람 작성) · assist(AI 도움) · generated(AI 생성). 비우면 쓰는 곳이 있을 때 assist
 * - data-style: badge(화면 아래 작은 배지, 기본) · line(페이지 맨 아래 한 줄) · inline(id="aimarker" 칸 안), data-side: left · right, data-theme: light · dark
 * - Shadow DOM 안에 그려 사이트 스타일과 섞이지 않습니다. */
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
  var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0E2A6B"/><path d="M20 7.6l1.86 5.1a2.8 2.8 0 0 0 1.68 1.68l5.1 1.86-5.1 1.86a2.8 2.8 0 0 0-1.68 1.68L20 24.9l-1.86-5.12a2.8 2.8 0 0 0-1.68-1.68l-5.1-1.86 5.1-1.86a2.8 2.8 0 0 0 1.68-1.68z" fill="#fff"/><rect x="11" y="28.6" width="18" height="3.6" rx="1.8" fill="#3BD6BD"/></svg>';

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
      '.badge{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px 0 9px;border-radius:999px;border:1px solid ' + C.line + ';background:' + C.bg + ';color:' + C.fg + ';font-family:inherit;font-weight:750;font-size:13px;line-height:1;cursor:pointer;box-shadow:0 6px 18px rgba(14,42,107,.14);transition:transform .15s ease,box-shadow .15s ease}' +
      '.badge:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(14,42,107,.2)}.badge svg{width:20px;height:20px}' +
      '.badge:focus-visible,.lnk:focus-visible,.line button:focus-visible{outline:2px solid ' + C.acc + ';outline-offset:2px}' +
      '.line{display:flex;justify-content:center;padding:12px 16px;font-size:12.5px;color:' + C.sub + '}' +
      '.line button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:inherit;font:inherit;cursor:pointer;padding:4px 6px;border-radius:8px}.line button b{color:' + C.acc + '}.line svg{width:18px;height:18px}' +
      '.pop{position:absolute;bottom:46px;' + side + ':0;width:336px;max-width:calc(100vw - 24px);max-height:calc(100vh - 84px);overflow:auto;background:' + C.bg + ';border:1px solid ' + C.line + ';border-radius:16px;box-shadow:0 18px 48px rgba(10,22,40,.22);padding:16px 16px 12px;display:none;text-align:left}' +
      '.pop.on{display:block}.pop h4{display:flex;align-items:center;gap:7px;margin:0 0 2px;font-size:15.5px;font-weight:800;color:' + C.fg + '}.pop h4 svg{color:' + C.acc + ';width:17px;height:17px}' +
      '.pop .who{margin:0;font-size:12.5px;color:' + C.sub + '}' +
      '.lv{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:12px 0 4px}.lv span{text-align:center;padding:6px 2px;border-radius:8px;background:' + C.chip + ';color:' + C.sub + ';font-weight:750;font-size:11.5px}' +
      '.lv span.on{color:#fff}.lv .human.on{background:#0FA88F}.lv .assist.on{background:#1F55F5}.lv .generated.on{background:#0E2A6B' + (C.dark ? ';box-shadow:inset 0 0 0 1px #3D5BA8' : '') + '}' +
      '.lvt{margin:0 0 6px;font-size:11.5px;color:' + C.sub + '}' +
      '.pop ul{list-style:none;margin:0;padding:0}.pop li{display:flex;gap:8px;padding:7px 0;border-top:1px solid ' + C.line + ';font-size:13.5px;color:' + C.fg + '}.pop li:first-child{border-top:0}' +
      '.pop li i{flex:0 0 6px;height:6px;margin-top:8px;border-radius:50%;background:' + C.acc + '}.pop li.ok i{background:#0FA88F}' +
      '.pop .ct{margin:8px 0 0;font-size:12.5px;color:' + C.sub + ';word-break:break-all}.pop .ct a{color:' + C.acc + '}' +
      '.pop .ft{margin:12px -16px -12px;padding:10px 16px 11px;border-top:1px solid ' + C.line + ';background:' + C.foot + ';border-radius:0 0 16px 16px;font-size:11.5px;color:' + C.sub + '}' +
      '.lnk{display:flex;align-items:center;gap:8px;margin-top:7px;color:' + C.fg + ';text-decoration:none;font-size:12px;line-height:1.35}.lnk svg{width:24px;height:24px;flex:0 0 24px}' +
      '.lnk b{display:block;font-weight:850;letter-spacing:.02em}.lnk em{display:block;font-style:normal;font-weight:700;color:' + C.acc + '}.lnk:hover em{text-decoration:underline}' +
      '.std{display:block;margin-top:6px;font-size:10.5px;color:' + C.sub + ';opacity:.9}' +
      '.x{position:absolute;top:10px;right:10px;width:26px;height:26px;border:0;border-radius:8px;background:' + C.chip + ';color:' + C.sub + ';cursor:pointer;font:700 15px/26px sans-serif;padding:0}' +
      '.wrap{position:relative;display:inline-block}' +
      '@media (max-width:560px){.badge{height:32px;font-size:12px;padding:0 12px 0 8px}.badge svg{width:18px;height:18px}.pop{bottom:42px}}';
  }

  function build(raw, mountEl) {
    var c = normalize(raw || {});
    var C = c.dark ? { bg: '#0F172A', fg: '#E5ECF8', sub: '#9FB0CC', line: '#273449', chip: '#1E2A44', acc: '#7FA6FF', foot: '#0B1222', dark: 1 }
      : { bg: '#FFFFFF', fg: '#0B1324', sub: '#5B687D', line: '#E4E9F2', chip: '#EEF2F8', acc: '#1F55F5', foot: '#F6F8FC' };
    var items = c.uses.map(function (k) { return '<li><i></i><span>' + esc(USE[k]) + '</span></li>'; }).join('') +
      (c.review ? '<li class="ok"><i></i><span>' + esc(c.review) + '</span></li>' : '') +
      (c.privacy ? '<li class="ok"><i></i><span>AI 도구에 고객 개인정보를 넣지 않습니다</span></li>' : '');
    if (!items) items = '<li class="ok"><i></i><span>사람이 직접 만든 콘텐츠를 중심으로 운영합니다</span></li>';
    var ct = c.contact ? '<p class="ct">AI 활용 문의 ' + (c.contact.indexOf('@') > 0 ? '<a href="mailto:' + esc(c.contact) + '">' + esc(c.contact) + '</a>' : '<a href="' + esc(c.contact) + '" target="_blank" rel="noopener">' + esc(c.contact.replace(/^https?:\/\//, '')) + '</a>') + '</p>' : '';
    var lv = '<div class="lv" role="img" aria-label="AI 성분표: ' + LEVELS.filter(function (l) { return l[0] === c.level; })[0][1] + '">' +
      LEVELS.map(function (l) { return '<span class="' + l[0] + (l[0] === c.level ? ' on' : '') + '">' + l[1] + '</span>'; }).join('') + '</div><p class="lvt">AI 성분표 · 이 사이트의 콘텐츠는 주로 \'' + LEVELS.filter(function (l) { return l[0] === c.level; })[0][1] + '\'입니다</p>';
    var who = (c.name ? esc(c.name) + josa(c.name) + ' 이렇게 AI를 사용합니다' : '이 사이트는 이렇게 AI를 사용합니다') + (c.date ? ' · ' + c.date.replace('-', '.') + ' 작성' : '');
    var pop = '<div class="pop" role="dialog" aria-label="AI 활용 안내"><button class="x" type="button" aria-label="닫기">×</button><h4>' + SPARK + 'AI 활용 안내</h4><p class="who">' + who + '</p>' + lv + '<ul>' + items + '</ul>' + ct +
      '<div class="ft">이 안내는 사이트 운영자가 직접 작성했습니다.<a class="lnk" href="' + HOME + '" target="_blank" rel="noopener">' + LOGO + '<span><b>AIMarker</b><em>우리 사이트에도 무료로 달기 →</em></span></a><span class="std">표시 문구 기준 한국AI윤리위원회 · 심사 · 보증 표시가 아닙니다</span></div></div>';
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
      ? '<div class="line"><button type="button" aria-expanded="false">' + LOGO + '<span>' + (c.name ? esc(c.name) + josa(c.name) : '이 사이트는') + ' 일부 콘텐츠에 AI를 활용합니다 · <b>안내 보기</b></span></button></div>'
      : '<button class="badge" type="button" aria-expanded="false">' + LOGO + 'AI 활용 안내</button>';
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

  W.AIMarker = W.AIMarker || {};
  W.AIMarker.render = build;
  W.AIMarker.version = '1.0.0';

  var me = document.currentScript;
  if (!me) { var all = document.querySelectorAll('script[src*="aimarker.kr/m.js"],script[src*="/m.js"]'); me = all[all.length - 1]; }
  if (!me || me.__am || me.hasAttribute('data-preview')) return;
  me.__am = 1;
  var raw = {};
  ['name', 'use', 'level', 'review', 'privacy', 'contact', 'style', 'side', 'theme', 'date'].forEach(function (k) { raw[k] = me.getAttribute('data-' + k) || ''; });
  function mount() { if (!document.querySelector('[data-aimarker]')) build(raw); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
