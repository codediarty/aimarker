/* AIMarker AI 사용 확인 · 마크 발급 (2026.10)
 * 1) 이 브라우저에서 출처 기록 읽기(aim-extract) → 2) 서버가 서명 다시 확인 · 판정(am.analyze) → 3) 근거와 맞는 표시만 발급(am.mark)
 * → 4) 마크를 넣은 파일 · 마크 카드 · 삽입 코드 · 관리 키. 원본 파일 · 글은 서버로 보내지 않음(특징값 · 해시 · 서명 묶음만). */
(function () {
  'use strict';
  var AIM = window.AIMExtract, MK = window.MK, AM = window.AM || {};
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var list = $('#mkList'), drop = $('#mkDrop'), input = $('#mkFiles');
  if (!list || !AIM || !MK) return;
  var items = [], seq = 0, MAX = 20, MAXB = 300 * 1048576, waiting = [], running = 0;
  var EMBED = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  var TRUST = { c2pa: 'C2PA 신뢰 목록', itl: 'C2PA 임시 신뢰 목록', allowed: '확인된 개별 인증서' };
  var TOOLS = ['ChatGPT', 'Midjourney', 'Adobe Firefly', 'Gemini', 'Stable Diffusion', 'Claude', '뤼튼'];
  var esc = MK.esc;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } return ''; }

  /* ---------- 탭 ---------- */
  var tabs = [$('#tabFile'), $('#tabText')];
  function selTab(i) {
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', i === j ? 'true' : 'false'); t.tabIndex = i === j ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = i !== j; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selTab(i); });
    t.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = (i + 1) % 2; selTab(n); tabs[n].focus(); e.preventDefault(); } });
  });

  /* ---------- 항목 추가 ---------- */
  function addFiles(files) {
    var arr = Array.prototype.slice.call(files || []);
    if (!arr.length) return;
    var room = MAX - items.filter(function (x) { return x.kind === 'file'; }).length;
    if (arr.length > room) { notice('한 번에 ' + MAX + '개까지 확인합니다. ' + (arr.length - Math.max(0, room)) + '개는 빼고 확인합니다.'); arr = arr.slice(0, Math.max(0, room)); }
    arr.forEach(function (file) {
      var it = { id: ++seq, kind: 'file', name: file.name || '파일', size: file.size, file: file, state: 'reading' };
      items.unshift(it); mount(it);
      if (file.size > MAXB) { fail(it, '300MB보다 큰 파일은 이 화면에서 확인하지 않습니다. 기업용 API를 쓰세요.'); return; }
      AIM.inspectFile(file).then(function (r) {
        it.bytes = r.bytes; it.rep = r.report; it.features = r.features; it.pack = r.pack;
        it.fmt = it.rep.format; it.kindName = MK.KIND[it.rep.kind] || '파일';
        if (it.rep.kind === 'image' && /^image\//.test(file.type || '') ) it.thumb = URL.createObjectURL(file);
        it.state = 'local'; paint(it); enqueue(it);
      }).catch(function () { fail(it, '이 파일을 읽지 못했습니다. 다른 파일로 시도해 주세요.'); });
    });
    refreshBatch();
  }
  function addText(text) {
    text = String(text || '');
    if (!text.replace(/\s+/g, '')) { notice('확인할 글을 넣어 주세요.'); return; }
    var it = { id: ++seq, kind: 'text', name: '글 ' + text.replace(/\s+/g, ' ').trim().slice(0, 28) + (text.length > 28 ? '…' : ''), size: text.length, text: text, state: 'reading', fmt: 'text', kindName: '글' };
    items.unshift(it); mount(it);
    AIM.textFeatures(text).then(function (f) { it.features = f; it.state = 'local'; paint(it); enqueue(it); })
      .catch(function () { fail(it, '이 브라우저에서 글 지문을 만들지 못했습니다(보안 연결 https 필요).'); });
    refreshBatch();
  }
  function notice(msg) {
    var n = document.createElement('p'); n.className = 'mk-notice'; n.textContent = msg; list.parentNode.insertBefore(n, list);
    setTimeout(function () { n.remove(); }, 7000);
  }

  /* ---------- 서버 판정(한 번에 두 건) ---------- */
  function enqueue(it) { waiting.push(it); pump(); }
  function pump() {
    while (running < 2 && waiting.length) {
      (function (it) {
        running++; it.state = 'checking'; paint(it);
        var body = { features: it.features, cid: cid() }; if (it.pack) body.pack = it.pack;
        AM.call('am.analyze', body, 70000).then(function (r) {
          if (!r || !r.ok) throw r || {};
          it.A = r; it.state = 'ready';
          it.label = r.verdict.suggest && r.verdict.allowed.indexOf(r.verdict.suggest) >= 0 ? r.verdict.suggest : (r.verdict.allowed.length === 1 ? r.verdict.allowed[0] : '');
          paint(it);
        }).catch(function (e) { fail(it, errMsg(e, '서버 확인이 늦어지고 있습니다. 잠시 뒤 [다시 확인]을 눌러 주세요.'), true); })
          .then(function () { running--; pump(); refreshBatch(); });
      })(waiting.shift());
    }
  }
  function cid() { var c = store('am_cid'); if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); store('am_cid', c); } return c; }
  function errMsg(e, dflt) {
    if (e && e.name === 'AbortError') return '서버 응답이 늦습니다. 잠시 뒤 다시 시도해 주세요.';
    if (e && e.message && e.code) return e.message;
    return dflt;
  }
  function fail(it, msg, retry) { it.state = 'error'; it.err = msg; it.retry = !!retry; paint(it); refreshBatch(); }

  /* ---------- 카드 ---------- */
  function mount(it) {
    var el = document.createElement('article'); el.className = 'mk-card'; el.setAttribute('data-id', it.id);
    it.el = el; list.insertBefore(el, list.firstChild); paint(it);
  }
  function head(it) {
    var meta = [it.kindName || '', it.fmt && it.fmt !== 'text' ? String(it.fmt).toUpperCase() : '', it.rep && it.rep.w ? it.rep.w + '×' + it.rep.h : '', it.kind === 'text' ? it.size + '자' : MK.bytes(it.size)].filter(Boolean).join(' · ');
    var th = it.thumb ? '<img src="' + it.thumb + '" alt="" onerror="this.remove()">' : '<span class="mk-th-ic">' + (it.kind === 'text' ? 'T' : esc(String(it.fmt || '?').slice(0, 4).toUpperCase())) + '</span>';
    var st = { reading: ['이 브라우저에서 읽는 중', 'wait'], local: ['서버 확인 대기열', 'wait'], checking: ['서명 · 기록 확인 중', 'wait'], ready: ['표시를 고르면 발급', 'go'], issuing: ['마크 발급 중', 'wait'], done: ['발급 완료', 'ok'], error: ['확인 못 함', 'err'] }[it.state] || ['', ''];
    return '<header class="mk-head"><div class="mk-th">' + th + '</div><div class="mk-fn"><b>' + esc(it.name) + '</b><span>' + esc(meta) + '</span></div>' +
      '<span class="mk-st is-' + st[1] + '">' + (st[1] === 'wait' ? '<i class="mk-spin" aria-hidden="true"></i>' : '') + esc(st[0]) + '</span>' +
      '<button type="button" class="mk-x" data-act="remove" aria-label="' + esc(it.name) + ' 빼기">×</button></header>';
  }
  function localLines(it) {
    var r = it.rep, out = [];
    if (it.kind === 'text') { out.push(['info', '글 지문(SHA-256)을 만들었습니다. 글 자체는 이 브라우저 밖으로 나가지 않습니다.']); if (it.features && it.features.disclosure) out.push(['hint', "글 안에 'AI로 작성' 같은 표현이 있습니다."]); return out; }
    if (!r) return out;
    if (r.c2pa) {
      var c = r.c2pa, sg = c.signer ? c.signer.org || c.signer.cn : '';
      out.push(['info', 'C2PA 출처 기록이 있습니다' + (sg ? '(서명자 ' + sg + ')' : '') + '.']);
      if (c.state === 'tampered' || c.state === 'changed' || c.state === 'signature_bad') out.push(['warn', '출처 기록과 파일 내용이 서로 맞지 않습니다.']);
    }
    if (r.xmp && r.xmp.dst && r.xmp.dst.length) out.push(['info', '디지털 출처 유형 기록: ' + r.xmp.dst.slice(0, 3).join(', ')]);
    if (r.xmp && r.xmp.aimarker) out.push(['info', '이미 AIMarker 마크(' + r.xmp.aimarker.id + ')가 들어 있습니다.']);
    if (r.gen) out.push(['info', '생성 도구가 남긴 설정값이 있습니다' + (r.gen.tools && r.gen.tools.length ? '(' + r.gen.tools.slice(0, 2).join(', ') + ')' : '') + '.']);
    if (r.exif && (r.exif.make || r.exif.model)) out.push(['info', '촬영 정보: ' + [r.exif.make, r.exif.model].filter(Boolean).join(' ')]);
    if (r.stripped) out.push(['hint', '출처 · 메타데이터 기록이 없습니다(저장 · 캡처 과정에서 지워졌을 수 있음).']);
    if (!out.length) out.push(['info', '읽을 수 있는 출처 기록을 찾는 중입니다.']);
    return out;
  }
  function li(kind, text) { return '<li class="ev-' + kind + '">' + esc(text) + '</li>'; }
  function verdictBlock(it) {
    var A = it.A, v = A.verdict, basis = v.ai === 'unknown' ? 'declared' : v.basis || 'declared';
    var title = v.ai === 'used' ? 'AI 사용 확인' + (MK.SCOPE[v.scope] ? ' · ' + MK.SCOPE[v.scope] : '') : v.ai === 'not_used' ? 'AI 미사용 확인(촬영 원본 서명)' : '판단할 기록 없음';
    var sub = v.ai === 'unknown' ? (it.kind === 'text' ? '글은 기술로 AI 사용을 단정하지 않습니다. 발급자가 밝힌 내용으로 표시합니다.' : '파일에 AI 사용을 판단할 기록이 없습니다. 발급자가 밝힌 내용으로 표시하고, 마크에도 그렇게 적습니다.') : (A.summary || '');
    return '<div class="mk-verdict is-' + esc(v.ai) + '"><div class="mk-vt"><span class="mk-bars-s" data-g="' + (v.ai === 'unknown' ? 1 : MK.GRADE[basis] || 1) + '" aria-hidden="true"><i></i><i></i><i></i></span><div><b>' + esc(title) + '</b><span>근거 등급: ' + esc(v.ai === 'unknown' ? '발급자 신고' : MK.BASIS[basis] || '') + '</span></div></div><p>' + esc(sub) + '</p></div>';
  }
  function evidence(it) {
    var A = it.A, g1 = [], g2 = [];
    if (A && A.signer) {
      var s = A.signer, org = s.org || '서명자';
      if (s.valid === true && TRUST[s.trust]) g1.push(li('ok', '전자서명 확인 · ' + org + ' · ' + TRUST[s.trust]));
      else if (s.valid === true) g1.push(li('warn', '서명은 맞지만 서명자(' + org + ')가 신뢰 목록에 없습니다.'));
      else if (s.valid === false) g1.push(li('bad', '서명이 맞지 않습니다. 기록이 바뀌었을 수 있습니다.'));
      if (s.binding === 'ok') g1.push(li('ok', '파일 내용이 서명한 그대로입니다.'));
      else if (s.binding === 'mismatch') g1.push(li('bad', '서명 뒤에 파일 내용이 바뀌었습니다.'));
      else if (s.binding === 'loose') g1.push(li('warn', '서명이 파일 일부만 묶고 있습니다.'));
    }
    if (A) A.signals.forEach(function (x) {
      if (x.level === 'verified') g1.push(li(x.dir === 'ai' ? 'ai' : x.dir === 'cap' ? 'ok' : 'info', x.text));
      else g2.push(li(x.level === 'hint' ? 'hint' : x.dir === 'ai' ? 'ai' : x.dir === 'cap' ? 'cap' : 'info', x.text));
    });
    if (A) (A.notes || []).forEach(function (n) { if (A.signer && /서명/.test(n)) return; if (g2.join('').indexOf(esc(n)) < 0) g2.push(li('hint', n)); });
    if (!A) localLines(it).forEach(function (l) { g2.push(li(l[0], l[1])); });
    else if (it.rep && it.rep.stripped && !A.signals.length) g2.push(li('hint', '출처 · 메타데이터 기록이 없습니다(저장 · 캡처 과정에서 지워졌을 수 있음).'));
    if (!g1.length) g1.push(li('none', A ? '서명으로 검증된 출처 기록이 없습니다.' : '확인 중입니다.'));
    if (!g2.length) g2.push(li('none', '파일 안에서 AI 생성 · 편집 기록을 찾지 못했습니다.'));
    var done = it.state === 'done' && it.R;
    var g3 = done ? declaredView(it) : declaredForm(it);
    return '<div class="mk-ev">' +
      '<section class="ev ev-1"><h4><span>1</span>기술적으로 검증된 출처 정보</h4><ul>' + g1.join('') + '</ul></section>' +
      '<section class="ev ev-2"><h4><span>2</span>자동 분석 결과</h4><ul>' + g2.join('') + '</ul></section>' +
      '<section class="ev ev-3"><h4><span>3</span>제작자 신고 정보</h4>' + g3 + '</section></div>';
  }
  function declaredForm(it) {
    var dis = it.state !== 'ready' ? ' disabled' : '';
    var chips = TOOLS.map(function (t) { return '<button type="button" class="mk-chip" data-tool="' + esc(t) + '"' + dis + '>' + esc(t) + '</button>'; }).join('');
    return '<div class="mk-df"><label><span>사용한 AI 도구(있으면)</span><input type="text" data-f="tools" value="' + esc(it.tools || '') + '" placeholder="예: Midjourney, ChatGPT" maxlength="120"' + dis + '></label>' +
      '<div class="mk-chips">' + chips + '</div>' +
      '<label><span>콘텐츠 이름</span><input type="text" data-f="title" value="' + esc(it.title != null ? it.title : (it.kind === 'file' ? it.name.replace(/\.[a-z0-9]{2,5}$/i, '') : '')) + '" maxlength="80"' + dis + '></label>' +
      '<label><span>발급자(브랜드 · 이름)</span><input type="text" data-f="issuer" value="' + esc(it.issuer != null ? it.issuer : store('am_issuer')) + '" maxlength="40" placeholder="마크 확인 페이지에 보이는 이름"' + dis + '></label></div>';
  }
  function declaredView(it) {
    var R = it.R, rows = [['표시', MK.LABEL[R.label]], ['근거', MK.BASIS[R.basis]], ['도구', (R.tools || []).join(', ') || '없음'], ['콘텐츠 이름', it.title || '없음'], ['발급자', it.issuer || '밝히지 않음']];
    return '<dl class="mk-dl">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>';
  }
  function chooser(it) {
    var A = it.A, allowed = A.verdict.allowed, sel = it.label;
    var opts = ['ai_generated', 'ai_edited', 'ai_assisted', 'no_ai'].map(function (l) {
      var ok = allowed.indexOf(l) >= 0;
      return '<label class="mk-opt' + (ok ? '' : ' is-off') + '"><input type="radio" name="lab' + it.id + '" value="' + l + '"' + (sel === l ? ' checked' : '') + (ok ? '' : ' disabled') + '><span><b>' + esc(MK.LABEL[l]) + '</b><small>' + (ok ? (l === A.verdict.suggest ? '추천' : '고를 수 있음') : '근거와 맞지 않음') + '</small></span></label>';
    }).join('');
    var basis = previewBasis(it), prev = sel ? MK.badge({ label: sel, basis: basis }) + '<span class="mk-pv-t">' + esc(MK.BASIS_DESC[basis] || '') + '</span>' : '<span class="mk-pv-t">표시를 고르세요.</span>';
    var conf = it.confirmMsg ? '<div class="mk-confirm" role="alert"><p>' + esc(it.confirmMsg) + (it.related ? ' <a href="' + esc(MK.markUrl(it.related)) + '" target="_blank" rel="noopener">관련 마크 보기</a>' : '') + '</p><div class="row"><button type="button" class="btn btn-p btn-s" data-act="confirm">확인했고 그대로 발급</button><button type="button" class="btn btn-g btn-s" data-act="cancelconfirm">표시 다시 고르기</button></div></div>' : '';
    var err = it.issueErr ? '<p class="mk-err" role="alert">' + esc(it.issueErr) + '</p>' : '';
    return '<div class="mk-choose"><h4>마크로 발급할 표시</h4><div class="mk-opts" role="radiogroup" aria-label="표시">' + opts + '</div>' +
      '<div class="mk-pv">' + prev + '</div>' + conf + err +
      '<label class="mk-agree"><input type="checkbox" data-f="agree"' + (it.agree ? ' checked' : '') + '><span>표시 내용이 사실과 같음을 확인합니다. 사실과 다르면 마크가 철회될 수 있고, 표시 책임은 발급자에게 있습니다.</span></label>' +
      '<div class="row"><button type="button" class="btn btn-p" data-act="issue"' + (sel && it.agree && it.state === 'ready' ? '' : ' disabled') + '>' + (it.state === 'issuing' ? '<i class="mk-spin" aria-hidden="true"></i><span>발급 중</span>' : '<span>마크 발급</span>') + '</button>' +
      '<span class="note">발급하면 마크 번호 · 관리 키 · QR이 나옵니다.</span></div></div>';
  }
  function previewBasis(it) {
    var v = it.A && it.A.verdict; if (!v || !it.label) return 'declared';
    if (it.label === 'no_ai') return v.ai === 'not_used' ? v.basis || 'verified' : 'declared';
    return v.ai === 'used' && v.basis && v.basis !== 'declared' ? v.basis : 'declared';
  }
  function doneBlock(it) {
    var R = it.R, m = { id: R.id, label: R.label, basis: R.basis, at: R.at }, url = MK.markUrl(R.id);
    var keyBox = it.key ? '<div class="mk-key"><div><b>관리 키</b><span>표시를 바꾸거나 철회할 때 필요합니다. 다시 보여 드리지 않으니 지금 보관하세요.</span></div><code>' + esc(it.key) + '</code>' +
      '<div class="row"><button type="button" class="btn btn-g btn-s" data-act="copykey">키 복사</button><button type="button" class="btn btn-g btn-s" data-act="keyfile">' + '키 파일 받기</button></div></div>' : '<p class="note">이 파일에는 같은 표시의 마크가 이미 있어 그 마크를 보여 드립니다(관리 키는 처음 발급할 때만 나옵니다).</p>';
    var canEmbed = it.kind === 'file' && EMBED[it.fmt];
    var embedUi = canEmbed ? '<div class="mk-dlrow"><div><b>마크를 넣은 ' + (it.rep.kind === 'image' ? '이미지' : '파일') + '</b><span>파일 속에 마크 번호 · 서명(XMP)을 넣고, 보이는 마크도 붙일 수 있습니다.</span>' +
        '<div class="mk-dlopt"><label><input type="checkbox" data-f="vis"' + (it.vis !== false ? ' checked' : '') + '> 보이는 마크</label><label>위치 <select data-f="pos"><option value="bl">왼쪽 아래</option><option value="br">오른쪽 아래</option><option value="tl">왼쪽 위</option><option value="tr">오른쪽 위</option></select></label><label><input type="checkbox" data-f="qr"' + (it.qr ? ' checked' : '') + '> QR 함께</label></div></div>' +
        '<button type="button" class="btn btn-p btn-s" data-act="marked">' + (it.altOk ? '다시 받기' : '받기') + '</button></div>' + (it.altMsg ? '<p class="note mk-alt">' + esc(it.altMsg) + '</p>' : '') : '';
    var textUi = it.kind === 'text' ? '<div class="mk-dlrow"><div><b>글에 붙일 표시 문장</b><span class="mk-sent">' + esc(sentence(R)) + '</span></div><button type="button" class="btn btn-p btn-s" data-act="copysent">복사</button></div>' : '';
    var other = it.kind === 'file' && !canEmbed ? '<p class="note">이 형식은 파일 안에 마크를 넣지 않습니다. 마크 카드 · 삽입 코드 · QR을 콘텐츠와 함께 쓰세요.</p>' : '';
    return '<div class="mk-done"><div class="mk-done-top"><div class="mk-done-b">' + MK.badge(m, { lg: true }) +
      '<p>마크 <b>' + esc(R.id) + '</b> 를 발급했습니다. 이 마크에는 AIMarker 전자서명이 들어 있고, 발급 기록은 원장 ' + esc(R.ledger && R.ledger.id || '') + ' 에 남았습니다.</p>' +
      '<a class="btn btn-g btn-s" href="' + url + '" target="_blank" rel="noopener">마크 확인 페이지 열기</a></div>' +
      '<div class="mk-done-q">' + MK.qrSvg(url, 120) + '<span>QR로 확인</span></div></div>' + keyBox +
      '<div class="mk-dls">' + embedUi + textUi +
      '<div class="mk-dlrow"><div><b>마크 카드(PNG)</b><span>배지 · 근거 · QR이 들어간 그림. 상세 페이지 · 보도자료 끝에 붙이세요.</span></div><button type="button" class="btn btn-g btn-s" data-act="card">받기</button></div>' +
      '<div class="mk-dlrow"><div><b>웹사이트 삽입 코드</b><span>누르면 마크 확인 페이지가 열리는 배지입니다.</span></div><button type="button" class="btn btn-g btn-s" data-act="copyembed">복사</button></div>' +
      other + '</div></div>';
  }
  function sentence(R) {
    var s = { ai_generated: '이 글은 AI로 작성했습니다.', ai_edited: '이 글은 AI로 다듬고 고쳤습니다.', ai_assisted: '이 글은 AI의 도움을 받아 작성했습니다.', no_ai: '이 글은 AI를 사용하지 않고 작성했습니다.' }[R.label] || '';
    return s + ' (AIMarker 마크 ' + R.id + ' · ' + MK.markUrl(R.id).replace('https://', '') + ')';
  }
  function embedCode(R) {
    return '<a class="aimarker-mark" href="' + MK.markUrl(R.id) + '" data-id="' + R.id + '" data-label="' + R.label + '" data-basis="' + R.basis + '" target="_blank" rel="noopener">' + MK.LABEL[R.label] + ' · AIMarker 마크 ' + R.id + '</a>\n<script src="' + MK.SITE + '/m/embed.js" async></script>';
  }
  function paint(it) {
    if (!it.el) return;
    var body = '';
    if (it.state === 'error') body = '<div class="mk-errbox"><p>' + esc(it.err || '') + '</p>' + (it.retry ? '<button type="button" class="btn btn-g btn-s" data-act="retry">다시 확인</button>' : '') + '</div>';
    else if (!it.A) body = evidence(it);
    else body = verdictBlock(it) + evidence(it) + (it.state === 'done' ? doneBlock(it) : chooser(it));
    it.el.className = 'mk-card is-' + it.state;
    it.el.innerHTML = head(it) + '<div class="mk-body">' + body + '</div>';
    if (it.state === 'done' && it.pos) { var ps = it.el.querySelector('[data-f="pos"]'); if (ps) ps.value = it.pos; }
  }

  /* ---------- 발급 ---------- */
  function issue(it, confirm) {
    if (it.state !== 'ready' || !it.label || !it.agree) return Promise.resolve();
    readForm(it);
    it.state = 'issuing'; it.issueErr = ''; it.confirmMsg = ''; it.related = ''; paint(it); refreshBatch();
    var tools = String(it.tools || '').split(/[,·\n]/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6);
    var body = { features: it.features, label: it.label, tools: tools, title: it.title || '', issuer: it.issuer || '', cid: cid() };
    if (it.pack) body.pack = it.pack; if (confirm) body.confirm = true;
    if (it.issuer) store('am_issuer', it.issuer);
    return AM.call('am.mark', body, 90000).then(function (r) {
      if (r && r.ok && r.id) { it.R = r; it.key = r.key || ''; it.state = 'done'; it.vis = r.label !== 'no_ai'; paint(it); return; }
      it.state = 'ready';
      if (r && r.code === 'CONFIRM') { it.confirmMsg = String(r.message || r.msg || '글 안에 AI 관련 표현이 있습니다. 그래도 발급할까요?').replace(/\s*\(confirm: true\)/g, ''); it.related = r.related || ''; }
      else { it.issueErr = (r && (r.message || r.msg)) || '발급하지 못했습니다.'; if (r && r.allowed && it.A) { it.A.verdict.allowed = r.allowed; if (r.allowed.indexOf(it.label) < 0) it.label = ''; } }
      paint(it);
    }).catch(function (e) { it.state = 'ready'; it.issueErr = errMsg(e, '서버 응답이 늦습니다. 잠시 뒤 다시 눌러 주세요(같은 파일은 마크가 두 번 만들어지지 않습니다).'); paint(it); })
      .then(refreshBatch);
  }
  function readForm(it) {
    if (!it.el) return;
    ['tools', 'title', 'issuer'].forEach(function (f) { var x = it.el.querySelector('[data-f="' + f + '"]'); if (x) it[f] = x.value.trim(); });
  }

  /* ---------- 마크를 넣은 파일 ---------- */
  function markedFile(it) {
    var R = it.R, opt = { vis: it.vis !== false, pos: it.pos || 'bl', qr: !!it.qr }, mime = EMBED[it.fmt];
    var xmp = AIM.buildXmp({ id: R.id, url: MK.markUrl(R.id), dst: R.xmp && R.xmp.dst, aiSystem: R.xmp && R.xmp.aiSystem, label: R.label, basis: R.basis, cred: R.cred, note: (MK.DESC[R.label] || '') + ' AIMarker 마크 ' + R.id });
    var base = it.name.replace(/\.[a-z0-9]{2,5}$/i, '').slice(0, 60) || 'content', ext = { jpeg: 'jpg', png: 'png', webp: 'webp' }[it.fmt];
    var make = opt.vis ? MK.fontsReady().then(function () { return MK.loadImage(it.file); }).then(function (img) {
      var c = MK.stamp(img, { id: R.id, label: R.label, basis: R.basis }, { pos: opt.pos, qr: opt.qr, flat: it.fmt === 'jpeg' });
      return MK.canvasBlob(c, mime, 0.93);
    }).then(function (b) { if (!b) throw new Error('encode'); return b.arrayBuffer(); }).then(function (ab) { return new Uint8Array(ab); }) : Promise.resolve(it.bytes);
    return make.then(function (u8) {
      var out = AIM.embedXmp(u8, xmp), blob = new Blob([out], { type: mime });
      MK.save(blob, base + '_' + R.id + '.' + ext);
      return MK.sha256(out);
    }).then(function (h) {
      if (!it.key) { it.altMsg = '받은 파일은 마크 번호와 서명을 담고 있습니다. 관리 키가 없어 표시본 해시는 등록하지 않았습니다.'; paint(it); return; }
      it.altMsg = '표시본을 마크에 연결하는 중…'; paint(it);
      return AM.call('am.markedit', { id: R.id, key: it.key, alt: [h], cid: cid() }, 60000).then(function (r) {
        it.altOk = !!(r && r.ok); it.altMsg = it.altOk ? '받은 파일을 이 마크의 표시본으로 등록했습니다. 이 파일로도 마크를 찾을 수 있습니다.' : '표시본 등록을 못 했습니다(' + ((r && r.message) || '서버 응답 없음') + '). 파일 속 마크 번호로는 확인할 수 있습니다.'; paint(it);
      });
    }).catch(function () { it.altMsg = '이 파일에 마크를 넣지 못했습니다. 마크 카드 · 삽입 코드를 쓰세요.'; paint(it); });
  }

  /* ---------- 일괄 ---------- */
  var bar = $('#mkBatch');
  function refreshBatch() {
    var n = items.length, ready = items.filter(function (x) { return x.state === 'ready' && x.label && x.agree; }).length, done = items.filter(function (x) { return x.state === 'done' && x.key; }).length;
    bar.hidden = n < 2 && !done;
    $('#mkBatchCount').textContent = n + '개';
    $('#mkBatchNote').textContent = done ? '발급 ' + done + '개 · 발급 준비 ' + ready + '개' : '표시를 고르고 확인란에 표시한 항목 ' + ready + '개를 한 번에 발급합니다';
    $('#mkIssueAll').disabled = !ready; $('#mkKeys').hidden = !done;
  }
  $('#mkIssueAll').addEventListener('click', function () {
    var todo = items.filter(function (x) { return x.state === 'ready' && x.label && x.agree; }).reverse();
    todo.reduce(function (p, it) { return p.then(function () { return issue(it); }); }, Promise.resolve());
  });
  $('#mkKeys').addEventListener('click', function () {
    var rows = items.filter(function (x) { return x.state === 'done' && x.key; }).map(function (x) { return { id: x.R.id, label: x.R.label, basis: x.R.basis, key: x.key, name: x.name }; });
    MK.save(new Blob([MK.keyCsv(rows)], { type: 'text/csv;charset=utf-8' }), 'aimarker-marks-' + new Date().toISOString().slice(0, 10) + '.csv');
  });
  $('#mkClear').addEventListener('click', function () {
    if (items.some(function (x) { return x.state === 'done' && x.key && !x.keySaved; }) && !window.confirm('아직 보관하지 않은 관리 키가 있습니다. 비우면 다시 볼 수 없습니다. 비울까요?')) return;
    items.forEach(function (x) { if (x.thumb) URL.revokeObjectURL(x.thumb); }); items = []; waiting = []; list.innerHTML = ''; refreshBatch();
  });

  /* ---------- 카드 안 동작 ---------- */
  function find(el) { var c = el.closest('.mk-card'); if (!c) return null; var id = +c.getAttribute('data-id'); return items.filter(function (x) { return x.id === id; })[0] || null; }
  list.addEventListener('change', function (e) {
    var it = find(e.target); if (!it) return;
    if (e.target.type === 'radio') { readForm(it); it.label = e.target.value; it.issueErr = ''; it.confirmMsg = ''; paint(it); refreshBatch(); return; }
    var f = e.target.getAttribute('data-f');
    if (f === 'agree') { readForm(it); it.agree = e.target.checked; paint(it); refreshBatch(); }
    else if (f === 'vis') it.vis = e.target.checked;
    else if (f === 'qr') it.qr = e.target.checked;
    else if (f === 'pos') it.pos = e.target.value;
  });
  list.addEventListener('input', function (e) { var it = find(e.target); if (it && e.target.getAttribute('data-f')) it[e.target.getAttribute('data-f')] = e.target.value; });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act],[data-tool]'); if (!b) return;
    var it = find(b); if (!it) return;
    if (b.hasAttribute('data-tool')) { readForm(it); var t = b.getAttribute('data-tool'), cur = String(it.tools || '').split(/\s*,\s*/).filter(Boolean); if (cur.indexOf(t) < 0) cur.push(t); it.tools = cur.join(', '); paint(it); return; }
    var act = b.getAttribute('data-act');
    if (act === 'remove') {
      if (it.state === 'done' && it.key && !it.keySaved && !window.confirm('관리 키를 보관하셨나요? 빼면 다시 볼 수 없습니다.')) return;
      items = items.filter(function (x) { return x !== it; }); waiting = waiting.filter(function (x) { return x !== it; }); if (it.thumb) URL.revokeObjectURL(it.thumb); it.el.remove(); refreshBatch();
    } else if (act === 'retry') { it.err = ''; it.state = 'local'; paint(it); enqueue(it); }
    else if (act === 'issue') issue(it, false);
    else if (act === 'confirm') { it.state = 'ready'; issue(it, true); }
    else if (act === 'cancelconfirm') { it.confirmMsg = ''; it.label = ''; paint(it); }
    else if (act === 'copykey') { AM.copy ? AM.copy(it.key, b) : navigator.clipboard.writeText(it.key); it.keySaved = true; }
    else if (act === 'keyfile') { MK.save(new Blob([MK.keyText([{ id: it.R.id, label: it.R.label, basis: it.R.basis, key: it.key, name: it.name }])], { type: 'text/plain;charset=utf-8' }), 'aimarker-key-' + it.R.id + '.txt'); it.keySaved = true; }
    else if (act === 'marked') { b.disabled = true; markedFile(it).then(function () { b.disabled = false; }); }
    else if (act === 'card') MK.cardPng({ id: it.R.id, label: it.R.label, basis: it.R.basis, at: it.R.at }).then(function (bl) { MK.save(bl, 'aimarker-mark-' + it.R.id + '.png'); });
    else if (act === 'copyembed') { var code = embedCode(it.R); AM.copy ? AM.copy(code, b) : navigator.clipboard.writeText(code); }
    else if (act === 'copysent') { var s = sentence(it.R); AM.copy ? AM.copy(s, b) : navigator.clipboard.writeText(s); }
  });

  /* ---------- 넣기 ---------- */
  input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { if (!e.target.closest || !e.target.closest('#mkDrop')) { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) { selTab(0); addFiles(e.dataTransfer.files); } } });
  $('#mkTextGo').addEventListener('click', function () { var t = $('#mkText'); addText(t.value); });
  window.addEventListener('beforeunload', function (e) { if (items.some(function (x) { return x.state === 'done' && x.key && !x.keySaved; })) { e.preventDefault(); e.returnValue = ''; } });
  if (/[?&]tab=text\b/.test(location.search)) selTab(1);
})();
