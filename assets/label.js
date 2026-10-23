/* AIMarker AI 마킹(/label/ · 첫 화면): 예시 사이트 켜고 끄기 · 마크 모양 · 점검 모드 */
(function () {
  'use strict';
  var fr = document.getElementById('liveFrame'), on = document.getElementById('liveOn');
  if (!fr) return;
  var st = { am: true, tag: 'tag', check: false };
  var base = fr.getAttribute('src').split('?')[0], ver = (fr.getAttribute('src').match(/[?&]v=([\w.-]+)/) || [])[1] || '';
  function go() {
    var q = ['embed=1'];
    if (ver) q.push('v=' + ver);
    if (!st.am) q.push('am=0');
    else { if (st.tag !== 'tag') q.push('tag=' + st.tag); if (st.check) q.push('check=1'); }
    var y = 0;
    try { y = fr.contentWindow.scrollY || 0; } catch (e) { /* 다른 주소면 못 읽음 */ }
    fr.onload = function () { try { if (y) fr.contentWindow.scrollTo(0, y); } catch (e) { /* 무시 */ } };
    fr.src = base + '?' + q.join('&');
  }
  if (on) on.addEventListener('change', function () { st.am = on.checked; go(); });
  Array.prototype.forEach.call(document.querySelectorAll('#live [data-tag]'), function (b) {
    b.addEventListener('click', function () {
      st.tag = b.getAttribute('data-tag'); st.am = true; if (on) on.checked = true;
      Array.prototype.forEach.call(document.querySelectorAll('#live [data-tag]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      go();
    });
  });
  var ck = document.querySelector('#live [data-check]');
  if (ck) ck.addEventListener('click', function () {
    st.check = !st.check; st.am = true; if (on) on.checked = true;
    ck.setAttribute('aria-pressed', st.check ? 'true' : 'false');
    go();
  });
})();
