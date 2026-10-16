/* AIMarker 마크 배지(웹사이트 삽입용) · https://aimarker.kr/m/embed.js
 * <a class="aimarker-mark" href="https://aimarker.kr/m/?id=AM-…" data-id="AM-…" data-label="ai_generated" data-basis="record">…</a> 를
 * 근거 막대가 있는 배지로 바꿉니다. 서버를 부르지 않고(쪽 열 때마다 요청 없음), 누르면 마크 확인 쪽이 열립니다. data-theme="light" 로 밝은 배지. */
(function () {
  'use strict';
  var L = { ai_generated: 'AI 생성', ai_edited: 'AI 편집 · 합성', ai_assisted: 'AI 보조', no_ai: 'AI 미사용' };
  var B = { verified: '서명 검증', record: '파일 기록', declared: '발급자 신고' }, G = { verified: 3, record: 2, declared: 1 };
  var SPARK = 'M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z';
  var CSS = ':host{all:initial;display:inline-block;vertical-align:middle}' +
    'a{display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 11px 0 5px;border-radius:9px;background:#0A1F52;color:#fff;text-decoration:none;font:600 13px/1 "Pretendard Variable",Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;letter-spacing:-.01em;box-shadow:0 4px 12px rgba(10,31,82,.18);white-space:nowrap}' +
    'a:focus-visible{outline:2px solid #1F55F5;outline-offset:2px}' +
    'i.ic{width:21px;height:21px;border-radius:6px;background:rgba(255,255,255,.12);display:inline-flex;align-items:center;justify-content:center}i.ic svg{width:13px;height:13px;fill:currentColor}' +
    'b{font-weight:800}.bars{display:inline-flex;align-items:flex-end;gap:2px;height:13px}.bars i{display:block;width:3.5px;border-radius:2px;background:rgba(255,255,255,.26)}' +
    '.bars i:nth-child(1){height:8px}.bars i:nth-child(2){height:10.5px}.bars i:nth-child(3){height:13px}' +
    '.g1 i:nth-child(-n+1),.g2 i:nth-child(-n+2),.g3 i{background:#3BD6BD}em{font-style:normal;font-size:11.5px;color:rgba(255,255,255,.7);font-weight:650}' +
    ':host([data-theme=light]) a{background:#fff;color:#0B1324;border:1px solid #D3DBE7;box-shadow:none}:host([data-theme=light]) i.ic{background:#EEF3FF;color:#1F55F5}' +
    ':host([data-theme=light]) .bars i{background:#D3DBE7}:host([data-theme=light]) .g1 i:nth-child(-n+1),:host([data-theme=light]) .g2 i:nth-child(-n+2),:host([data-theme=light]) .g3 i{background:#0FA88F}:host([data-theme=light]) em{color:#5B687D}';
  function up(a) {
    if (a.__aimk) return; a.__aimk = 1;
    var id = String(a.getAttribute('data-id') || '').toUpperCase(), lab = a.getAttribute('data-label'), bas = a.getAttribute('data-basis') || 'declared';
    if (!/^AM-[0-9A-Z]{10}$/.test(id) || !L[lab] || !G[bas]) return;
    var host = document.createElement('span'); host.setAttribute('data-aimarker', id);
    if (a.getAttribute('data-theme') === 'light') host.setAttribute('data-theme', 'light');
    var url = 'https://aimarker.kr/m/?id=' + id, tip = L[lab] + ' · 근거 ' + B[bas] + ' · AIMarker 마크 ' + id + ' 확인';
    var html = '<style>' + CSS + '</style><a href="' + url + '" target="_blank" rel="noopener" title="' + tip + '" aria-label="' + tip + '">' +
      '<i class="ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + SPARK + '"/></svg></i><b>' + L[lab] + '</b>' +
      '<span class="bars g' + G[bas] + '" aria-hidden="true"><i></i><i></i><i></i></span><em>AIMarker</em></a>';
    if (host.attachShadow) host.attachShadow({ mode: 'open' }).innerHTML = html; else host.innerHTML = html;
    a.parentNode.replaceChild(host, a);
  }
  function run() { Array.prototype.forEach.call(document.querySelectorAll('a.aimarker-mark'), up); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  var t = 0;
  if (window.MutationObserver) new MutationObserver(function () { if (!t) t = setTimeout(function () { t = 0; run(); }, 200); }).observe(document.documentElement, { childList: true, subtree: true });
})();
