/* AIMarker 표시 확인(/v/): 사이트가 알려 준 근거 · 이 브라우저에서 다시 읽은 출처 기록 · 등록 사이트 목록(/r/sites.json) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var root = document.body.getAttribute('data-root') || '';
  var out = $('#vOut'), AIM = window.AIMExtract;
  var KIND = { gen: 'AI 생성', edit: 'AI 편집', assist: 'AI 보조', virtual: '가상인물' };
  var KIND_L = { gen: '생성형 AI로 만든 콘텐츠로 표시됐습니다.', edit: '생성형 AI로 편집하거나 합성한 콘텐츠로 표시됐습니다.', assist: '생성형 AI의 도움을 받은 콘텐츠로 표시됐습니다.', virtual: 'AI로 만든 가상인물이 나오는 콘텐츠로 표시됐습니다.' };
  var BASIS = { owner: ['사이트 운영자가 표시', 2], rule: ['운영자가 정한 위치 규칙', 2], c2pa: ['파일 속 출처 기록(C2PA)', 3], iptc: ['파일 속 출처 기록(IPTC)', 3], gen: ['파일 속 생성 정보', 3], name: ['파일 이름, 설명의 AI 도구 흔적', 1] };
  var DSTK = { trainedAlgorithmicMedia: 'AI 생성', compositeWithTrainedAlgorithmicMedia: 'AI로 합성', algorithmicMedia: '알고리즘 생성', algorithmicallyEnhanced: 'AI 보정', compositeSynthetic: '합성', digitalCapture: '촬영 원본', digitalCreation: '디지털 제작' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function host(u) { try { return new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } }
  var REG = null;
  function registry() {
    if (REG) return REG;
    REG = fetch(root + 'r/sites.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).catch(function () { return { sites: {} }; });
    return REG;
  }
  function regBox(h, id) {
    return registry().then(function (R) {
      var s = (R.sites || {})[h] || (R.sites || {})['www.' + h];
      if (s) {
        var mism = id && s.id && String(id).toUpperCase() !== String(s.id).toUpperCase();
        return '<div><span>사이트</span><span><span class="k-vstate ' + (mism ? 'warn' : 'ok') + '">' + (mism ? '등록 번호가 다릅니다' : 'AIMarker 등록 사이트') + '</span><br><b>' + esc(h) + '</b> · ' + esc(s.org || '') + (s.id ? ' · ' + esc(s.id) : '') + '<br><small class="k-small">' + esc(s.plan || '') + (s.since ? ' · ' + esc(s.since) + '부터' : '') + (s.policy ? ' · <a href="' + esc(s.policy) + '" target="_blank" rel="noopener">AI 활용 정책</a>' : '') + '</small></span></div>';
      }
      return '<div><span>사이트</span><span><span class="k-vstate no">등록되지 않은 사이트</span><br><b>' + esc(h || '알 수 없음') + '</b><br><small class="k-small">사이트 운영자가 AIMarker AI 마킹을 스스로 설정한 것입니다(자기 선언). 등록 사이트는 AIMarker가 운영 책임자를 확인한 곳입니다.</small></span></div>';
    });
  }
  function bars(g) { return '<span class="k-gbar g' + g + '" aria-hidden="true"><i></i><i></i><i></i></span>'; }
  function recheck(u, slot) {
    if (!u || !/^https?:/i.test(u) || !AIM) { slot.remove(); return; }
    slot.innerHTML = '<span>다시 확인</span><span>파일을 읽는 중입니다…</span>';
    fetch(u, { mode: 'cors', credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); })
      .then(function (ab) { return AIM.inspect(new Uint8Array(ab.slice(0, 40 * 1048576)), { name: u.split('/').pop() }); })
      .then(function (rep) {
        var lines = [];
        if (rep.c2pa) {
          var acts = (rep.c2pa.actions || []).map(function (a) { return a.dst ? (DSTK[a.dst] || a.dst) : ''; }).filter(Boolean);
          lines.push('C2PA 출처 기록: ' + (rep.c2pa.ok ? '서명 확인됨' : '서명 확인 안 됨(' + esc(rep.c2pa.state) + ')') + (rep.c2pa.signer && rep.c2pa.signer.org ? ', 서명 ' + esc(rep.c2pa.signer.org) : '') + (rep.c2pa.generator ? ', 도구 ' + esc(rep.c2pa.generator) : '') + (acts.length ? ', 기록된 출처 ' + esc(acts.join(', ')) : ''));
        }
        if (rep.xmp && rep.xmp.dst && rep.xmp.dst.length) lines.push('IPTC 디지털 출처 유형: ' + esc(rep.xmp.dst.map(function (d) { var k = String(d).split('/').pop(); return DSTK[k] || k; }).join(', ')) + (rep.xmp.creatorTool ? ', 제작 도구 ' + esc(rep.xmp.creatorTool) : ''));
        if (rep.gen) lines.push('생성 프로그램 기록: ' + esc([rep.gen.sdParams ? 'Stable Diffusion 설정' : '', rep.gen.comfy ? 'ComfyUI 작업 흐름' : '', rep.gen.novelai ? 'NovelAI' : '', rep.gen.invoke ? 'InvokeAI' : '', rep.gen.mjJob ? 'Midjourney 작업 번호' : ''].concat(rep.gen.tools || []).filter(Boolean).join(', ') || '있음'));
        if (!lines.length) lines.push(rep.stripped ? '파일 속 출처 기록이 없습니다(올리는 과정에서 지워졌을 수 있습니다). 사이트 운영자의 표시나 규칙으로 붙은 마크입니다.' : '이 파일에서 AI 생성 기록은 찾지 못했습니다.');
        slot.innerHTML = '<span>다시 확인</span><span>' + lines.join('<br>') + '<br><small class="k-small">이 브라우저에서 방금 읽었습니다 · ' + esc(rep.format) + (rep.w ? ' · ' + rep.w + '×' + rep.h : '') + '</small></span>';
      })
      .catch(function () { slot.innerHTML = '<span>다시 확인</span><span>이 파일은 다른 서버에 있어 브라우저에서 다시 읽을 수 없습니다. 사이트가 알려 준 근거를 보여 드립니다.</span>'; });
  }
  function report(q) {
    var u = q.get('u') || '', k = q.get('k') || '', b = q.get('b') || '', t = q.get('t') || '', s = q.get('s') || host(u), id = q.get('id') || '';
    if (!KIND[k]) k = '';
    var B = BASIS[b] || null;
    var img = /^https?:\/\//i.test(u) ? '<img src="' + esc(u) + '" alt="표시된 이미지" referrerpolicy="no-referrer" onerror="this.outerHTML=\'<p class=none>이미지를 불러오지 못했습니다</p>\'">' : '<p class="none">이미지 주소가 없습니다</p>';
    var fb = 'mailto:contact@skkc.co.kr?subject=' + encodeURIComponent('[AIMarker] 표시 확인 요청') + '&body=' + encodeURIComponent('표시가 잘못된 것 같습니다.\n\n이미지: ' + u + '\n사이트: ' + s + '\n표시: ' + (KIND[k] || '') + '\n근거: ' + (B ? B[0] : '') + '\n\n내용: ');
    out.innerHTML = '<div class="k-vcard"><div class="k-vph">' + img + '</div><div class="bd">' +
      '<div class="ttl"><span class="f"><img src="' + root + 'assets/brand/aimarker-symbol.svg" alt="" width="22" height="25"></span><span><b>' + (k ? esc(KIND[k]) : 'AIMarker 표시') + '</b><small>' + (k ? esc(KIND_L[k]) : '사이트에서 본 AI 마크의 근거입니다.') + '</small></span></div>' +
      '<div class="k-vrows">' +
      (B ? '<div><span>근거</span><span><b>' + esc(B[0]) + '</b> ' + bars(B[1]) + '</span></div>' : '') +
      (t ? '<div><span>도구</span><span>' + esc(t) + '</span></div>' : '') +
      '<div class="rc"></div><div class="rg"></div>' +
      (u ? '<div><span>파일</span><span>' + (/^https?:\/\//i.test(u) ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(u.length > 90 ? u.slice(0, 90) + '…' : u) + '</a>' : esc(u.length > 90 ? u.slice(0, 90) + '…' : u)) + '</span></div>' : '') +
      '</div>' +
      '<p class="k-small">표시가 사실과 다르면 <a href="' + fb + '">AIMarker에 알려 주세요</a>. 사이트 운영자에게 전달해 고치도록 돕습니다.</p></div></div>';
    var rows = out.querySelector('.k-vrows');
    var rc = rows.querySelector('.rc'), rg = rows.querySelector('.rg');
    recheck(u, rc);
    regBox(s, id).then(function (h) { rg.outerHTML = h; });
  }
  function siteOnly(h) {
    out.innerHTML = '<div class="k-vcard" style="grid-template-columns:1fr"><div class="bd"><div class="ttl"><span class="f"><img src="' + root + 'assets/brand/aimarker-symbol.svg" alt="" width="22" height="25"></span><span><b>' + esc(h) + '</b><small>AIMarker 등록 사이트 확인</small></span></div><div class="k-vrows"><div class="rg"></div></div></div></div>';
    regBox(h, '').then(function (x) { out.querySelector('.rg').outerHTML = x; });
  }
  var q = new URLSearchParams(location.search);
  if (q.get('u') || q.get('k')) report(q);
  else if (q.get('s')) siteOnly(host(q.get('s')));
  $('#vForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('#vUrl').value.trim();
    if (!v) return;
    if (/\.(jpe?g|png|webp|gif|avif|heic|mp4|mov)(\?|#|$)/i.test(v) && /^https?:/i.test(v)) { var p = new URLSearchParams(); p.set('u', v); history.replaceState(null, '', '?' + p.toString()); report(p); }
    else { var h = host(v); if (!h) return; history.replaceState(null, '', '?s=' + encodeURIComponent(h)); siteOnly(h); }
  });
})();
