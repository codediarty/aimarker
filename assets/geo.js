/* AIMarker GEO 진단 · AI 상품 피드 (2026.10) · 서버 am.geo 결과를 그림. 점수 기준은 서버에만 있음 */
(function () {
  'use strict';
  var AM = window.AM || {}, $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var root = document.body.getAttribute('data-root') || '/';
  function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = 'w' + Math.random().toString(36).slice(2, 12); } return c; }
  function save(text, name, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function copy(text, btn) { if (AM.copy) AM.copy(text, btn); else if (navigator.clipboard) navigator.clipboard.writeText(text); }
  function cleanUrl(v) { return String(v || '').trim().replace(/^\s+|\s+$/g, ''); }
  var ERR = { URL: '주소를 확인해 주세요. 공개된 사이트 주소(예: myshop.co.kr)만 진단합니다.', FETCH: '', BUSY: '' };

  /* ---------- 다른 쪽(첫 화면 등)의 주소 칸: /geo/?url= 로 보냄 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('form[data-goto-geo]'), function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = cleanUrl(f.elements.url.value); if (!v) { f.elements.url.focus(); return; }
      if ($('#gForm')) { $('#gUrl').value = v; run(v); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      location.href = root + 'geo/?url=' + encodeURIComponent(v) + '#result';
    });
  });

  /* ---------- 진단 ---------- */
  var form = $('#gForm'), out = $('#gOut'), sec = $('#result');
  if (form && out) {
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = cleanUrl($('#gUrl').value); if (!v) { $('#gUrl').focus(); return; } run(v); });
    out.addEventListener('click', function (e) { onOut(e); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ex]'), function (b) { b.addEventListener('click', function () { $('#gUrl').value = b.getAttribute('data-ex'); run(b.getAttribute('data-ex')); }); });
    var q = new URLSearchParams(location.search).get('url');
    if (q) { $('#gUrl').value = q.slice(0, 300); run(q.slice(0, 300)); }
  }
  var busy = false, last = null;
  function run(url) {
    if (busy) return; busy = true;
    sec.hidden = false;
    var steps = ['쪽을 읽는 중', 'robots.txt · llms.txt · 사이트맵 확인', '구조화 데이터 · 본문 점검', '고칠 거리 만드는 중'], i = 0;
    out.innerHTML = '<div class="gr6-load"><span class="spin6" aria-hidden="true"></span><ol>' + steps.map(function (s, k) { return '<li' + (k ? '' : ' class="on"') + '>' + esc(s) + '</li>'; }).join('') + '</ol></div>';
    var tick = setInterval(function () { var li = out.querySelectorAll('.gr6-load li'); if (!li.length) return; if (i < li.length - 1) { li[i].className = 'done'; i++; li[i].className = 'on'; } }, 1600);
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var btn = form.querySelector('button'); btn.disabled = true;
    AM.call('am.geo', { url: url, cid: cid() }, 70000).then(function (r) {
      if (!r || !r.ok) throw r || {};
      last = r; paint(r);
      try { history.replaceState(null, '', '?url=' + encodeURIComponent(url) + '#result'); } catch (eH) { /* 무시 */ }
      if (window.gtag) try { window.gtag('event', 'geo_diag', { score: r.score, kind: r.kind }); } catch (eG) { /* 무시 */ }
    }).catch(function (e) {
      var m = e && e.name === 'AbortError' ? '사이트 응답이 늦습니다. 잠시 뒤 다시 시도해 주세요.' : (e && (e.message || e.msg)) || '지금은 진단하지 못했어요. 잠시 뒤 다시 시도해 주세요.';
      out.innerHTML = '<div class="gr6-err"><b>진단하지 못했어요</b><p>' + esc(m) + '</p></div>';
    }).then(function () { clearInterval(tick); busy = false; btn.disabled = false; });
  }
  function color(g) { return g === 'A' ? '#0FA88F' : g === 'B' ? '#1F55F5' : g === 'C' ? '#F5B740' : '#E5484D'; }
  function ring(score, grade, lg) {
    var r = lg ? 52 : 36, c = 2 * Math.PI * r, s = lg ? 120 : 84, off = c * (1 - Math.max(0, Math.min(100, score)) / 100);
    return '<div class="ring6' + (lg ? ' lg' : '') + '"><svg viewBox="0 0 ' + s + ' ' + s + '"><circle class="bg" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '"/><circle class="fg" cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" stroke="' + color(grade) + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><b>' + score + '<small>/ 100</small></b></div>';
  }
  function partColor(p) { var x = p.got / p.max; return x >= 0.85 ? '#0FA88F' : x >= 0.5 ? '#1F55F5' : x > 0 ? '#F5B740' : '#E5484D'; }
  function paint(r) {
    var bad = 0; r.parts.forEach(function (p) { p.items.forEach(function (it) { if (it.ok !== 'ok') bad++; }); });
    var head = '<div class="gr6-top">' + ring(r.score, r.grade, true) +
      '<div><h2>AI 검색 준비 점수 ' + r.score + '점 · ' + esc(r.grade) + '</h2><p>' + esc(r.kindKo) + (r.site && r.site.name ? ' · ' + esc(r.site.name) : '') + ' · 고칠 거리 ' + bad + '개' + (r.blocked && r.blocked.search ? ' · AI 검색 크롤러 ' + r.blocked.search + '곳이 막혀 있음' : '') + '</p><p class="meta">' + esc(r.url) + (r.cached ? ' · 최근 결과(6시간 안)' : '') + '</p></div>' +
      '<div class="act"><a class="btn btn-p" href="' + root + 'contact/?plan=growth&site=' + encodeURIComponent(r.host) + '">자동으로 고치기 상담</a><button class="btn btn-g btn-s" type="button" id="gSave">결과 받기(JSON)</button></div></div>';
    var parts = '<div class="gr6-box"><h3>항목별 결과<small>점수는 준비 상태를 보는 지표입니다</small></h3>' + r.parts.map(function (p) {
      return '<div class="gr6-part"><div class="gr6-ph"><b>' + esc(p.name) + '</b><i style="--w:' + Math.round(100 * p.got / p.max) + '%;--c:' + partColor(p) + '"></i><em>' + p.got + '/' + p.max + '</em></div><ul class="gr6-it">' +
        p.items.map(function (it) { return '<li class="' + esc(it.ok) + '"><span>' + esc(it.text) + (it.fix && it.ok !== 'ok' ? '<small>' + esc(it.fix) + '</small>' : '') + '</span></li>'; }).join('') + '</ul></div>';
    }).join('') + '</div>';
    var role = { search: 'AI 검색 · 답변', user: '사용자 요청', train: 'AI 학습' };
    var bots = '<div class="gr6-box"><h3>AI 크롤러<small>robots.txt 기준</small></h3><table class="gr6-bots"><tbody>' + r.bots.map(function (b) {
      return '<tr><td>' + esc(b.label) + '<span class="role">' + esc(b.name) + ' · ' + role[b.role] + '</span></td><td class="' + (b.allowed ? 'y' : 'n') + '">' + (b.allowed ? '허용' : '막힘') + '</td></tr>';
    }).join('') + '</tbody></table>' + (r.noai ? '<p class="note">쪽에 noai 표시가 있습니다. AI 학습 거부 뜻으로 쓰입니다.</p>' : '') + '<p class="note">검색 · 답변에 나오려면 검색용과 사용자 요청 크롤러를 허용하세요. 학습용 허용은 따로 정하면 됩니다.</p></div>';
    var F = r.fixes || {}, tabs = [], panes = [];
    var codePane = function (id, text, file, note) { return '<div class="gr6-code" data-pane="' + id + '">' + (note ? '<p class="note" style="margin-bottom:8px">' + note + '</p>' : '') + '<pre>' + esc(text) + '</pre><div class="row"><button class="btn btn-p btn-s" type="button" data-copy-text="' + id + '"><span>복사</span></button>' + (file ? '<button class="btn btn-g btn-s" type="button" data-save="' + id + '" data-file="' + esc(file) + '">파일로 받기</button>' : '') + '</div></div>'; };
    var texts = {};
    if (F.jsonld && F.jsonld.length) { texts.ld = '<script type="application/ld+json">\n' + JSON.stringify(F.jsonld.length === 1 ? F.jsonld[0] : F.jsonld, null, 2) + '\n</script>'; tabs.push(['ld', '구조화 데이터']); panes.push(codePane('ld', texts.ld, '', '쪽의 &lt;head&gt; 나 본문 끝에 붙여 넣으세요.' + (F.todo && F.todo.length ? ' 채울 것: ' + esc(F.todo.join(', ')) : ''))); }
    if (F.faq && F.faq.length) { texts.faq = F.faq.map(function (q) { return 'Q. ' + q + '\nA. '; }).join('\n\n'); tabs.push(['faq', 'FAQ 질문 틀']); panes.push(codePane('faq', texts.faq, '', '고객이 AI에게 물을 만한 질문입니다. 답을 채워 쪽에 올리면 FAQ 구조화 데이터도 만들어 드립니다.')); }
    if (F.meta) { texts.meta = '<title>' + F.meta.title + '</title>\n<meta name="description" content="' + F.meta.desc.replace(/"/g, '&quot;') + '">'; tabs.push(['meta', '제목 · 설명']); panes.push(codePane('meta', texts.meta, '', '쪽 내용에서 뽑은 문장입니다. 브랜드 말투에 맞게 다듬어 쓰세요.')); }
    if (F.llms) { texts.llms = F.llms; tabs.push(['llms', 'llms.txt']); panes.push(codePane('llms', texts.llms, 'llms.txt', '사이트 맨 위 주소(/llms.txt)에 올리세요. AI가 사이트를 요약해 읽는 안내 파일입니다.')); }
    if (F.robots) { texts.robots = F.robots; tabs.push(['robots', 'robots.txt']); panes.push(codePane('robots', texts.robots, '', 'robots.txt 에 더하세요. 이미 같은 이름의 규칙이 있으면 그 규칙을 고치세요.')); }
    if (r.feed) { texts.feed = r.feed.csv; tabs.push(['feed', 'AI 상품 피드']); panes.push('<div class="gr6-code" data-pane="feed"><p class="note" style="margin-bottom:8px">AI 검색 · 쇼핑에 넘길 상품 정보입니다. 상품이 많으면 <a href="' + root + 'commerce/#feed">여러 주소로 한 번에</a> 만드세요.</p><pre>' + esc(JSON.stringify({ id: r.feed.id, title: r.feed.title, description: r.feed.description, link: r.feed.link, image_link: r.feed.image_link, price: r.feed.price, availability: r.feed.availability, brand: r.feed.brand }, null, 2)) + '</pre><div class="row"><button class="btn btn-p btn-s" type="button" data-save="feed" data-file="aimarker-feed.csv">CSV 받기</button><button class="btn btn-g btn-s" type="button" data-copy-text="feed"><span>CSV 복사</span></button></div></div>'); }
    var fx = '<div class="gr6-box gr6-fx"><h3>고칠 거리<small>그대로 붙여 넣을 수 있게 만들었습니다</small></h3>' + (tabs.length ? '<div class="gr6-tabs" role="tablist">' + tabs.map(function (t, k) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (k ? 'false' : 'true') + '">' + esc(t[1]) + '</button>'; }).join('') + '</div>' + panes.join('') : '<p>바로 고칠 거리가 없습니다. 사이트 전체 정기 진단과 AI 검색 노출 추적으로 이어 가세요.</p>') + '</div>';
    var next = '<div class="gr6-next"><div><h3>여기까지는 무료입니다. 다음은 자동으로</h3><p>기업 요금제는 사이트 전체를 매달 진단하고, 코드 한 줄로 고칠 거리를 게시하고, AI로 만든 이미지 · 글에는 표시를 자동으로 붙입니다. ' + esc((r.next || []).join(' ')) + '</p></div><div class="row"><a class="btn btn-p" href="' + root + 'pricing/">요금 보기</a><a class="btn btn-g" href="' + root + 'mark/">이미지 자동 마킹</a></div></div>';
    out.innerHTML = head + '<div class="gr6-cols">' + parts + '<div style="display:grid;gap:18px">' + fx + bots + '</div></div>' + next;
    out.querySelectorAll('[data-pane]').forEach(function (p, k) { p.hidden = k > 0; });
    out._texts = texts;
  }
  function onOut(e) {
    var t = e.target.closest('[data-tab]');
    if (t) { var id = t.getAttribute('data-tab'); out.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b === t ? 'true' : 'false'); }); out.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-pane') !== id; }); return; }
    var c = e.target.closest('[data-copy-text]'); if (c) { copy(out._texts[c.getAttribute('data-copy-text')] || '', c); return; }
    var s = e.target.closest('[data-save]'); if (s) { var k = s.getAttribute('data-save'); save(out._texts[k] || '', s.getAttribute('data-file') || (k + '.txt'), k === 'feed' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'); return; }
    if (e.target.closest('#gSave') && last) save(JSON.stringify(last, null, 2), 'aimarker-geo-' + last.host + '.json', 'application/json');
  }

  /* ---------- 여러 상품 주소 → AI 상품 피드 ---------- */
  var ff = $('#feedForm');
  if (ff) {
    var fo = $('#feedOut'), rows = [];
    ff.addEventListener('submit', function (e) {
      e.preventDefault();
      var urls = String($('#feedUrls').value || '').split(/[\s,]+/).map(cleanUrl).filter(Boolean).filter(function (u, k, a) { return a.indexOf(u) === k; }).slice(0, 20);
      if (!urls.length) { $('#feedUrls').focus(); return; }
      var btn = ff.querySelector('button[type="submit"]'); btn.disabled = true; rows = [];
      fo.hidden = false; fo.innerHTML = '<p class="note">상품 쪽 ' + urls.length + '개를 차례로 읽는 중…</p><table><thead><tr><th>주소</th><th>상품</th><th>가격</th><th>브랜드</th><th>점수</th></tr></thead><tbody></tbody></table>';
      var tb = fo.querySelector('tbody');
      urls.reduce(function (p, u) {
        return p.then(function () {
          var tr = document.createElement('tr'); tr.innerHTML = '<td class="n">' + esc(u) + '</td><td colspan="4"><span class="note">읽는 중…</span></td>'; tb.appendChild(tr);
          return AM.call('am.geo', { url: u, cid: cid() }, 70000).then(function (r) {
            if (!r || !r.ok) throw r || {};
            if (!r.feed) { tr.innerHTML = '<td class="n">' + esc(u) + '</td><td colspan="3" class="err">상품 쪽으로 보이지 않습니다(가격 · 구매 단추 · Product 정보 없음)</td><td>' + r.score + '</td>'; return; }
            rows.push(r.feed);
            tr.innerHTML = '<td class="n">' + esc(u) + '</td><td>' + esc(r.feed.title) + '</td><td>' + esc(r.feed.price || '없음') + '</td><td>' + esc(r.feed.brand || '없음') + '</td><td>' + r.score + '</td>';
          }).catch(function (e) { tr.innerHTML = '<td class="n">' + esc(u) + '</td><td colspan="4" class="err">' + esc((e && (e.message || e.msg)) || '읽지 못했습니다') + '</td>'; });
        });
      }, Promise.resolve()).then(function () {
        btn.disabled = false;
        var note = fo.querySelector('p'); note.innerHTML = rows.length ? '상품 ' + rows.length + '개로 AI 상품 피드를 만들었습니다. <button class="btn btn-p btn-s" type="button" id="feedCsv">CSV 받기</button> <button class="btn btn-g btn-s" type="button" id="feedJson">JSON 받기</button>' : '상품 쪽을 찾지 못했습니다. 상품 상세 쪽 주소를 넣어 주세요.';
        if (rows.length) {
          var cols = ['id', 'title', 'description', 'link', 'image_link', 'price', 'availability', 'brand'], q = function (v) { v = String(v == null ? '' : v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
          $('#feedCsv').addEventListener('click', function () { save('﻿' + [cols.join(',')].concat(rows.map(function (x) { return cols.map(function (c) { return q(x[c]); }).join(','); })).join('\r\n') + '\r\n', 'aimarker-product-feed.csv', 'text/csv;charset=utf-8'); });
          $('#feedJson').addEventListener('click', function () { save(JSON.stringify(rows.map(function (x) { var o = {}; cols.forEach(function (c) { o[c] = x[c]; }); return o; }), null, 2) + '\n', 'aimarker-product-feed.json', 'application/json'); });
        }
      });
    });
  }
})();
