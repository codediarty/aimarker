/* AIMarker 검수 작업 공간(/app/)
 * 소재 올리기 → 자동 점검(서버 KR-AdLaw 엔진) → 수정 문구 적용 → 내부 확인 → 광고주 승인 링크 → 게시 → 보고서 · 원장 도장
 * 데이터는 이 브라우저(localStorage)에만 저장합니다. 이미지는 서버로 보내지 않고 출처 판별 · 표시 넣기도 브라우저 안에서 합니다. */
(function () {
  'use strict';
  var U = window.AMUI, P = window.AMProv, AM = window.AM;
  var KEY = 'am_ws_v1', $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var view = $('#view'), esc = U.esc, ico = U.ico;
  var I = {
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>', send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>', gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>', copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', dl: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    check: U.I.check, wand: U.I.wand, spark: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
  };
  var ST = { draft: '작성 중', fix: '수정 필요', ready: '출고 준비', sent: '승인 요청함', approved: '승인 완료', changes: '수정 요청', published: '게시 완료' };   // 5.0 '확인 필요' 단계 없음: 자동 수정 뒤 출고 준비 아니면 반려(수정 필요)

  /* ---------- 저장 ---------- */
  function blank() { return { v: 1, name: '내 작업 공간', me: '', ind: 'auto', guide: { ban: [], must: [], note: '' }, items: [], reports: [], created: Date.now() }; }
  function load() { try { var s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1 && Array.isArray(s.items)) { s.guide = s.guide || { ban: [], must: [], note: '' }; s.reports = s.reports || []; return s; } } catch (e) { /* 새로 */ } return blank(); }
  var S = load(), MEM = {}, HQ = Promise.resolve(), saveT = 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { toast('저장 공간이 가득 찼어요. 설정에서 내보낸 뒤 오래된 소재를 지워 주세요.'); return false; } }
  function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function byId(id) { return S.items.filter(function (x) { return x.id === id; })[0]; }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, 3200); }

  /* ---------- 상태 · 기록 ---------- */
  function statusOf(it) {
    if (it.published) return 'published';
    if (it.share && it.share.st === '승인') return 'approved';
    if (it.share && it.share.st === '수정 요청') return 'changes';
    if (it.share && it.share.st === '대기') return 'sent';
    if (!it.check) return 'draft';
    var d = it.check.decision;
    if (d === 'fix' || d === 'expert') return 'fix';
    if (d === 'review' && !it.internal) return 'fix';   // 자동 수정 뒤에도 남은 '주의' 후보: 반려(내부 확인으로 넘길 수 있음)
    return 'ready';
  }
  function stChip(st) { return '<span class="st3 ' + st + '"><i></i>' + ST[st] + '</span>'; }
  function scChip(it) { if (!it.check) return '<span class="sc na">-</span>'; var s = it.check.score; return '<span class="sc ' + (s >= 50 ? 'hi' : s >= 20 ? 'mid' : 'ok') + '">' + s + '</span>'; }
  var EVN = { create: '소재 만듦', check: '자동 점검', fix: '수정 문구 적용', internal: '내부 확인', share: '승인 링크 보냄', approved: '광고주 승인', changes: '수정 요청 받음', publish: '게시 완료', image: '이미지 추가', label: 'AI 표시 넣음' };
  function addEvent(it, k, note, extra) {
    var ev = { at: Date.now(), k: k, by: S.me || '', note: note || '' };
    if (extra) for (var x in extra) ev[x] = extra[x];
    it.events = it.events || []; it.events.push(ev); it.updated = ev.at;
    HQ = HQ.then(function () {
      var prev = null; for (var i = it.events.indexOf(ev) - 1; i >= 0; i--) if (it.events[i].h) { prev = it.events[i]; break; }
      ev.ph = prev ? prev.h : '';
      return U.sha256(ev.ph + U.canon({ at: ev.at, k: ev.k, by: ev.by, note: ev.note, ch: ev.ch || '' })).then(function (h) { ev.h = h; saveSoon(); });
    });
    return ev;
  }
  function newItem(o) {
    o = o || {};
    var it = { id: uid('it'), title: o.title || '새 소재', brand: o.brand || '', channel: o.channel || '인스타그램', ind: o.ind || S.ind || 'auto', flags: o.flags || { sponsored: false, aiPerson: false, aiMedia: false }, fm: {}, fa: {},
      copy: o.copy || '', files: [], check: null, versions: [], events: [], share: null, internal: null, published: null, created: Date.now(), updated: Date.now() };
    S.items.unshift(it); addEvent(it, 'create'); save();
    return it;
  }

  /* ---------- 자동 깃발(사용자가 직접 바꾼 것은 그대로) ---------- */
  function autoFlags(it) {
    var t = it.copy || '', fa = it.fa = it.fa || {}, fm = it.fm = it.fm || {};
    var want = {
      sponsored: /협찬|광고|원고료|제공\s?받|지원\s?받|체험단|서포터즈|유료\s?광고|#ad\b|sponsored/i.test(t),
      aiPerson: /가상\s?인물|AI\s?(?:모델|휴먼|인플루언서|아바타|성우)|버추얼\s?(?:휴먼|모델|인플루언서)/i.test(t),
      aiMedia: (it.files || []).some(function (f) { return f.det && (f.det.level === 'confirmed' || f.det.level === 'likely'); }) || /AI로\s?(?:만든|생성한)\s?(?:이미지|영상)|AI\s?생성\s?(?:이미지|영상)/.test(t)
    };
    ['sponsored', 'aiPerson', 'aiMedia'].forEach(function (k) { if (fm[k]) return; if (want[k] && !it.flags[k]) { it.flags[k] = true; fa[k] = true; } else if (!want[k] && fa[k]) { it.flags[k] = false; fa[k] = false; } });
  }

  /* ---------- 점검 ---------- */
  var busy = {};
  /* 5.0 자동 수정: 점검 결과가 '출고 준비'가 아니면 서버(am.auto)가 고치기 · 다시 점검을 끝까지 하고, 그래도 남으면 반려(이유와 함께) */
  function runAuto(it, flags, guide) {
    var text = it.copy || '';
    return AM.call('am.auto', { text: text, ind: it.ind === 'auto' ? (it.indGuess || '') : it.ind, flags: flags, guide: guide, cid: U.cid() }, 30000).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.message) || '자동 수정하지 못했어요');
      it.autoRes = { at: Date.now(), outcome: r.outcome, outcomeKo: r.outcomeKo, n: (r.applied || []).length, left: (r.left || []).length, from: text };
      if (r.changed && r.text && r.text !== text) { setCopy(it, r.text); addEvent(it, 'fix', '자동 수정 ' + (r.applied || []).length + '곳 · ' + r.outcomeKo); it.autoRes.to = r.text; return true; }
      save(); return false;
    }).catch(function () { return false; });
  }
  function runCheck(it, force, noAuto) {
    var text = it.copy || '';
    if (text.replace(/\s+/g, '').length < 2) { it.check = null; save(); paintResult(it); return Promise.resolve(null); }
    autoFlags(it);
    var flags = { sponsored: !!it.flags.sponsored, aiPerson: !!it.flags.aiPerson, aiMedia: !!it.flags.aiMedia }, guide = { ban: S.guide.ban || [], must: S.guide.must || [] };
    return U.sha256(text + '|' + it.ind + '|' + JSON.stringify(flags) + '|' + JSON.stringify(guide)).then(function (key) {
      if (!force && it.check && it.check.key === key) return it.check;
      busy[it.id] = true; paintBusy(it);
      return AM.call('am.check', { text: text, ind: it.ind === 'auto' ? (it.indGuess || '') : it.ind, flags: flags, guide: guide, cid: U.cid() }, 25000).then(function (r) {
        if (!r || !r.ok) throw new Error((r && r.message) || '점검하지 못했어요');
        var prev = it.check;
        if (it.ind === 'auto' && r.auto && !it.indGuess) it.indGuess = r.ind;   // 고치다가 업종 단서가 빠져도 처음 알아본 업종 그대로
        it.check = { key: key, at: Date.now(), copy: text, score: r.score, decision: r.decision, counts: r.counts, findings: r.findings, ind: r.ind, indName: r.indName, auto: r.auto, labels: r.labels || [], pack: r.pack };
        return U.sha256(text).then(function (ch) {
          var last = it.versions[it.versions.length - 1];
          if (!last || last.h !== ch) it.versions.push({ v: it.versions.length + 1, at: Date.now(), h: ch, copy: text, score: r.score, decision: r.decision });
          else { last.score = r.score; last.decision = r.decision; }
          if (!prev || prev.score !== r.score || prev.decision !== r.decision || !last || last.h !== ch) addEvent(it, 'check', '점수 ' + r.score + ' · ' + U.DEC[r.decision].t, { ch: ch });
          save(); return it.check;
        });
      }).then(function (c) {
        // 출고 준비가 아니면 자동 수정까지(같은 문구는 한 번만)
        if (!c || noAuto || S.noAuto || c.decision === 'clear' || it.internal || (it.autoRes && it.autoRes.from === text)) return c;
        return runAuto(it, flags, guide).then(function (changed) { if (changed) { busy[it.id] = false; return runCheck(it, true, true); } return c; });
      }).catch(function (e) { toast(e && e.message ? e.message : '지금은 점검하지 못했어요. 잠시 뒤 다시 시도해 주세요.'); return null; })
        .then(function (x) { busy[it.id] = false; paintBusy(it); paintResult(it); paintSide(); return x; });
    });
  }

  /* ---------- 공통 화면 ---------- */
  function navOn(r) { $$('[data-r]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-r') === r); }); }
  function paintSide() {
    $('#wsName').textContent = S.name || '내 작업 공간';
    var fix = S.items.filter(function (it) { var s = statusOf(it); return s === 'fix' || s === 'changes'; }).length, sent = S.items.filter(function (it) { return statusOf(it) === 'sent'; }).length;
    var a = $('#nInbox'); a.textContent = fix || ''; a.className = fix ? 'hot' : '';
    $('#nAppr').textContent = sent || '';
  }
  function top(title, sub, right) { return '<div class="ap-mtop"><a class="brand" href="' + AM.root + '" aria-label="AIMarker 홈">' + $('.ap-brand').innerHTML + '</a></div><div class="ap-top"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right ? '<div class="row">' + right + '</div>' : '') + '</div>'; }

  /* ---------- 검수함 ---------- */
  var FIL = { st: 'all', q: '', ind: '' };
  function vInbox() {
    var items = S.items, n = items.length;
    var cnt = function (f) { return items.filter(f).length; };
    var k = { fix: cnt(function (x) { var s = statusOf(x); return s === 'fix' || s === 'changes'; }), sent: cnt(function (x) { return statusOf(x) === 'sent'; }),
      ok: cnt(function (x) { var s = statusOf(x); return s === 'approved' || s === 'published'; }), avg: Math.round(items.filter(function (x) { return x.check; }).reduce(function (a, x) { return a + x.check.score; }, 0) / Math.max(1, cnt(function (x) { return x.check; }))) };
    var html = top('검수함', '올린 소재를 자동으로 점검하고, 승인까지 한곳에서 관리합니다.', '<a class="btn btn-g btn-s" href="#/new">' + ico(I.plus) + '새 소재</a>');
    if (!n) html += '<div class="quick"><div class="qbox" id="qbox"><b>광고 문구를 붙여 넣거나 이미지를 끌어다 놓으세요</b><textarea id="qtext" placeholder="예: 부작용 없는 순한 크림, 바르자마자 주름이 사라져요!"></textarea>' +
      '<div class="row"><span class="hint">업종 · 협찬 · AI 사용 여부는 자동으로 알아봅니다</span><button class="btn btn-p btn-s" id="qgo" type="button">' + ico(I.check) + '바로 점검</button></div><input type="file" id="qfile" accept="image/*" multiple hidden></div>' +
      '<div class="qdemo"><b>처음이라면 예시로 둘러보세요</b><p>화장품 · 건강기능식품 · 인플루언서 협찬 · AI 이미지 광고 예시 4개를 실제 엔진으로 점검해 넣어 드립니다.</p><button class="btn btn-w btn-s" id="demo" type="button">예시 소재 넣기</button></div></div>' +
      /* 11.0: 처음 여는 검수함은 쓰는 순서를 함께 보여 줌(빈 화면 대신) */
      '<ol class="ap-how"><li><b>붙여 넣거나 끌어다 놓기</b><span>광고 문구, 상세페이지 글, 이미지. 업종과 협찬, AI 사용 여부는 자동으로 알아봅니다.</span></li>' +
      '<li><b>위험 후보와 고칠 문구</b><span>근거와 바꿀 말을 보고, 한 번에 고치거나 하나씩 적용합니다.</span></li>' +
      '<li><b>광고주 승인과 기록</b><span>로그인 없이 보는 승인 링크를 보내고, 보고서와 원장 기록으로 남깁니다.</span></li></ol>';
    else html += '<div class="quick1" id="qbox"><input type="text" id="qtext" placeholder="광고 문구를 붙여 넣고 Enter, 이미지는 여기로 끌어다 놓기" aria-label="새 소재 문구"><button class="btn btn-p btn-s" id="qgo" type="button">' + ico(I.check) + '바로 점검</button><label class="btn btn-g btn-s">' + ico(I.upload) + '이미지<input type="file" id="qfile" accept="image/*" multiple hidden></label></div>';
    if (n) {
      html += '<div class="kp5"><div><b>' + n + '</b><span>전체 소재</span></div><div class="hi"><b>' + k.fix + '</b><span>수정 필요</span></div><div class="bl"><b>' + k.sent + '</b><span>승인 대기</span></div><div class="ok"><b>' + k.ok + '</b><span>승인 · 게시 완료</span></div><div class="mid"><b>' + k.avg + '</b><span>평균 위험 점수</span></div></div>';
      html += '<div class="flt3"><div class="pills" id="stf">' + [['all', '전체'], ['fix', '수정 필요'], ['ready', '출고 준비'], ['sent', '승인 요청함'], ['approved', '승인 완료'], ['published', '게시 완료']].map(function (p) { return '<button type="button" data-st="' + p[0] + '" aria-pressed="' + (FIL.st === p[0]) + '">' + p[1] + '</button>'; }).join('') + '</div>' +
        '<input class="inp" id="q" placeholder="제목 · 브랜드 · 문구 검색" value="' + esc(FIL.q) + '"></div>';
      html += '<table class="itbl"><thead><tr><th>소재</th><th>업종</th><th>위험</th><th>상태</th><th>바뀐 때</th></tr></thead><tbody id="rows"></tbody></table>';
    }
    view.innerHTML = html;
    if (n) paintRows();
    bindQuick();
  }
  function paintRows() {
    var q = FIL.q.trim().toLowerCase();
    var list = S.items.filter(function (it) {
      var s = statusOf(it);
      if (FIL.st !== 'all' && !(FIL.st === s || (FIL.st === 'fix' && s === 'changes'))) return false;
      if (q && (it.title + ' ' + it.brand + ' ' + it.copy).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    $('#rows').innerHTML = list.length ? list.map(function (it) {
      var th = it.files && it.files[0] && it.files[0].thumb ? '<img src="' + it.files[0].thumb + '" alt="">' : '<span class="thph">' + ico(I.file) + '</span>';
      return '<tr data-id="' + it.id + '"><td><div class="tt">' + th + '<div style="min-width:0"><b>' + esc(it.title) + '</b><small>' + esc([it.brand, it.channel].filter(Boolean).join(' · ') + (it.copy ? ' · ' + it.copy.slice(0, 40) : '')) + '</small></div></div></td>' +
        '<td class="c-ind">' + esc(it.check ? it.check.indName : U.IND[it.ind] || '') + '</td><td class="c-sc">' + scChip(it) + '</td><td>' + stChip(statusOf(it)) + '</td><td class="c-upd">' + U.when(it.updated) + '</td></tr>';
    }).join('') : '<tr><td colspan="5"><div class="empty3">조건에 맞는 소재가 없어요.</div></td></tr>';
  }
  function bindQuick() {
    var box = $('#qbox'), ta = $('#qtext'), fi = $('#qfile');
    $('#qgo').addEventListener('click', function () {
      var t = ta.value.trim(); if (!t) { ta.focus(); toast('문구를 넣거나 이미지를 끌어다 놓으세요.'); return; }
      var it = newItem({ copy: t, title: t.replace(/\s+/g, ' ').slice(0, 24) + (t.length > 24 ? '…' : '') });
      location.hash = '#/item/' + it.id; runCheck(it);
    });
    ['dragenter', 'dragover'].forEach(function (e) { box.addEventListener(e, function (ev) { ev.preventDefault(); box.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (e) { box.addEventListener(e, function (ev) { ev.preventDefault(); box.classList.remove('over'); }); });
    box.addEventListener('drop', function (ev) { var fs = ev.dataTransfer && ev.dataTransfer.files; if (fs && fs.length) { var it = newItem({ copy: ta.value.trim(), title: '이미지 소재' }); location.hash = '#/item/' + it.id; addFiles(it, fs); } });
    box.addEventListener('dblclick', function (ev) { if (ev.target === box) fi.click(); });
    fi.addEventListener('change', function () { if (fi.files.length) { var it = newItem({ title: '이미지 소재' }); location.hash = '#/item/' + it.id; addFiles(it, fi.files); } });
    if ($('#demo')) $('#demo').addEventListener('click', loadDemo);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && ta.tagName === 'INPUT') { e.preventDefault(); $('#qgo').click(); } });
    var stf = $('#stf'); if (stf) stf.addEventListener('click', function (e) { var b = e.target.closest('[data-st]'); if (!b) return; FIL.st = b.getAttribute('data-st'); $$('#stf button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); paintRows(); });
    var q = $('#q'); if (q) q.addEventListener('input', function () { FIL.q = q.value; paintRows(); });
    var rows = $('#rows'); if (rows) rows.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-id]'); if (tr) location.hash = '#/item/' + tr.getAttribute('data-id'); });
  }
  var DEMO = [
    { title: '가을 수분크림 피드', brand: '숲결 뷰티', channel: '인스타그램', ind: 'cos', copy: '피부과 전문의가 직접 개발한 재생 크림! 부작용 없는 순한 성분으로 바르자마자 주름이 사라져요. 국내 최초 특허 성분, 지금 30% 할인.' },
    { title: '루테인 상세페이지 상단', brand: '든든 헬스', channel: '상세페이지', ind: 'hfood', copy: '의사들이 먼저 찾는 루테인! 눈 건강에 확실한 효과, 노안 예방까지 한 번에. 1일 1캡슐 섭취하세요.' },
    { title: '다이어트 젤리 인플루언서', brand: '모아 애드', channel: '인스타그램', ind: 'food', flags: { sponsored: true, aiPerson: true, aiMedia: false }, copy: '안녕하세요, 10년 차 영양사 지나예요. 제가 직접 먹어 보고 고른 다이어트 젤리, 한 달 만에 5kg 빠졌어요! #협찬' },
    { title: '가을 트렌치코트 배너', brand: '온결 리빙', channel: '배너 · 디스플레이', ind: 'gen', flags: { sponsored: false, aiPerson: false, aiMedia: true }, copy: '[광고] AI로 만든 이미지입니다. 고급 울 혼방 트렌치코트, 가을 시즌 신상품을 만나 보세요.' }
  ];
  function loadDemo() {
    var btn = $('#demo'); if (btn) { btn.disabled = true; btn.textContent = '예시 점검 중…'; }
    var made = DEMO.slice().reverse().map(function (d) { var it = newItem(d); it.fm = { sponsored: !!(d.flags), aiPerson: !!(d.flags), aiMedia: !!(d.flags) }; return it; });
    made.reduce(function (p, it) { return p.then(function () { return runCheck(it); }); }, Promise.resolve()).then(function () { toast('예시 소재 4개를 점검해 넣었어요.'); if (/inbox|^#?$|^#\/$/.test(location.hash) || !location.hash) vInbox(); paintSide(); });
  }

  /* ---------- 소재 편집 ---------- */
  var CUR = null, CAT = 0, chkT = 0;
  function vItem(id) {
    var it = byId(id); if (!it) { location.replace('#/inbox'); return; }
    CUR = it; CAT = 0;
    var chs = U.CH.map(function (c) { return '<option' + (c === it.channel ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    var inds = Object.keys(U.IND).map(function (k) { return '<option value="' + k + '"' + (k === it.ind ? ' selected' : '') + '>' + esc(U.IND[k]) + '</option>'; }).join('');
    var brands = {}; S.items.forEach(function (x) { if (x.brand) brands[x.brand] = 1; });
    view.innerHTML = '<div class="ap-mtop"><a class="brand" href="' + AM.root + '">' + $('.ap-brand').innerHTML + '</a></div>' +
      '<div class="crumb"><a href="#/inbox">검수함</a> / 소재</div>' +
      '<div class="ed-head"><input class="ed-title" id="title" value="' + esc(it.title) + '" maxlength="80" aria-label="소재 제목"><span id="stc">' + stChip(statusOf(it)) + '</span></div>' +
      '<div class="ed"><div>' +
        '<div class="ac"><div class="ed-meta"><div><label for="brand">브랜드</label><input class="inp" id="brand" list="brands" value="' + esc(it.brand) + '" maxlength="40" placeholder="예: 숲결 뷰티"><datalist id="brands">' + Object.keys(brands).map(function (b) { return '<option value="' + esc(b) + '">'; }).join('') + '</datalist></div>' +
        '<div><label for="channel">채널</label><select class="sel" id="channel">' + chs + '</select></div><div><label for="ind">업종 규칙 팩</label><select class="sel" id="ind">' + inds + '</select></div></div></div>' +
        '<div class="ac"><h2>' + ico(I.file) + '광고 문구<small id="autost" class="autost"><span class="dot"></span><span>자동 점검</span></small></h2>' +
        '<textarea class="copy mt12" id="copy" placeholder="광고 · 상세페이지 · SNS 문구를 붙여 넣으세요. 멈추면 자동으로 점검합니다.">' + esc(it.copy) + '</textarea>' +
        '<div class="cnt2"><span id="cc">' + (it.copy || '').length + ' / 5,000자</span><span>KR-AdLaw 규칙 팩 · 서버 점검(문구는 저장하지 않음)</span></div>' +
        '<div class="flags">' + flagRow('sponsored', '협찬 · 대가를 받은 콘텐츠', '제품 · 원고료 · 할인을 받았다면 켜세요') + flagRow('aiPerson', 'AI로 만든 인물 · 목소리', '가상 모델 · AI 성우 · 아바타가 나오면') + flagRow('aiMedia', 'AI로 만든 이미지 · 영상', '이미지 판별 결과로 자동으로 켜집니다') + '</div></div>' +
        '<div class="ac"><h2>' + ico(I.image) + '이미지 · 출처 판별<small>브라우저 안에서만 읽음</small></h2><label class="drop3 mt12" id="drop">' + ico(I.upload) + '이미지를 끌어다 놓거나 눌러서 고르세요<input type="file" id="files" accept="image/*" multiple hidden></label><div class="files" id="flist"></div></div>' +
        '<div class="ac"><h2>' + ico(I.shield) + '버전 · 승인 이력<small>해시로 이어진 기록</small></h2><ul class="tl3" id="tl"></ul></div>' +
      '</div><div id="rcol"><div class="ac" id="res"></div><div class="ac" id="flow"></div></div></div>';
    bindItem(it); paintFiles(it); paintResult(it); paintFlow(it); paintTl(it);
    if (!it.check && it.copy) runCheck(it);
  }
  function flagRow(k, t, s) {
    var it = CUR, on = !!(it.flags && it.flags[k]), auto = it.fa && it.fa[k] && !(it.fm && it.fm[k]);
    return '<label class="tg3"><input type="checkbox" data-flag="' + k + '"' + (on ? ' checked' : '') + '><span class="sw"></span><span><b>' + t + '</b><small>' + s + '</small></span>' + (auto ? '<span class="auto">자동</span>' : '') + '</label>';
  }
  function bindItem(it) {
    var ta = $('#copy');
    ta.addEventListener('input', function () {
      it.copy = ta.value.slice(0, 5000); $('#cc').textContent = it.copy.length + ' / 5,000자'; it.updated = Date.now(); saveSoon();
      clearTimeout(chkT); chkT = setTimeout(function () { runCheck(it); }, 1100);
    });
    $('#title').addEventListener('input', function (e) { it.title = e.target.value.slice(0, 80) || '새 소재'; saveSoon(); });
    $('#brand').addEventListener('input', function (e) { it.brand = e.target.value.slice(0, 40); saveSoon(); });
    $('#channel').addEventListener('change', function (e) { it.channel = e.target.value; save(); });
    $('#ind').addEventListener('change', function (e) { it.ind = e.target.value; it.indGuess = ''; save(); runCheck(it); });
    $$('[data-flag]').forEach(function (cb) { cb.addEventListener('change', function () { var k = cb.getAttribute('data-flag'); it.flags[k] = cb.checked; it.fm = it.fm || {}; it.fm[k] = true; save(); runCheck(it); var lab = cb.closest('.tg3'), a = lab.querySelector('.auto'); if (a) a.remove(); }); });
    var drop = $('#drop'), fi = $('#files');
    ['dragenter', 'dragover'].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (e) { drop.addEventListener(e, function (ev) { ev.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (ev) { if (ev.dataTransfer && ev.dataTransfer.files) addFiles(it, ev.dataTransfer.files); });
    fi.addEventListener('change', function () { addFiles(it, fi.files); fi.value = ''; });
  }
  function paintBusy(it) { var a = $('#autost'); if (!a || CUR !== it) return; a.classList.toggle('busy', !!busy[it.id]); a.lastChild.textContent = busy[it.id] ? '점검 중…' : it.check ? '점검 ' + U.when(it.check.at) : '자동 점검'; }
  function paintStatus(it) { var s = $('#stc'); if (s && CUR === it) s.innerHTML = stChip(statusOf(it)); }

  /* 결과 */
  function paintResult(it) {
    if (CUR !== it) return;
    var box = $('#res'); if (!box) return;
    paintStatus(it); paintFlow(it); paintTl(it); paintFlagsAuto(it);
    var r = it.check;
    if (!r) { box.innerHTML = '<div class="empty3">' + ico(I.shield) + '<b>문구를 넣으면 바로 점검합니다</b><p>6가지(AI 사용 근거 · 가상인물 · 업종 표현 · 추천 · 보증 · 저작권 단서 · 브랜드 가이드)를 한 번에 봅니다.</p></div>'; return; }
    var cc = U.catCounts(r.findings), fresh = r.copy === it.copy;
    var cats = '<div class="cats3" id="cats"><button type="button" data-cat="0" aria-pressed="' + (CAT === 0) + '">전체 <i>' + r.findings.length + '</i></button>' + [1, 2, 3, 4, 5, 6].map(function (k) {
      var c = cc[k], cls = c[3] ? 'hi' : c[2] ? 'mid' : '';
      return '<button type="button" data-cat="' + k + '" aria-pressed="' + (CAT === k) + '">' + U.CATS[k] + ' <i class="' + cls + '">' + c.n + '</i></button>';
    }).join('') + '</div>';
    var list = r.findings.map(function (f, i) { return { f: f, i: i }; }).filter(function (x) { return !CAT || x.f.cat === CAT; });
    var imgs = '';
    if ((!CAT || CAT === 1) && it.files && it.files.length) {
      imgs = it.files.map(function (f) { var L = P.LEVEL[f.det.level]; return '<div class="fd"><div class="fd-h"><span class="sv ' + (L.c === 'hi' ? 'high' : L.c === 'mid' ? 'mid' : 'info') + '">이미지</span><span class="cat">AI 사용 근거</span><q>' + esc(f.name) + '</q></div><p>' + esc(L.t) + (f.det.signals.length ? ' · ' + esc(f.det.signals.join(' · ')) : ' · 파일 속 기록이 없어 AI 사용 여부를 확인할 수 없습니다(올릴 때 지워졌을 수 있음)') + '</p></div>'; }).join('');
    }
    var labels = (r.labels || []).length ? '<div class="lbls3">' + r.labels.map(function (l) { return '<div><span><b>붙일 표시</b> <code>' + esc(l.text) + '</code> · ' + esc(l.where) + '</span><button class="btn btn-g btn-s" type="button" data-copytext="' + esc(l.long) + '">' + ico(I.copy) + '문장 복사</button></div>'; }).join('') + '</div>' : '';
    var ar = it.autoRes, auto = ar && (ar.to === r.copy || ar.from === r.copy) ? '<p class="note mt8"><b>자동 처리:</b> ' + esc(ar.outcomeKo || '') + (ar.n ? ' · ' + ar.n + '곳을 고쳤습니다' : '') + (ar.outcome === 'return' ? ' · 자동으로 고칠 수 없는 표현 ' + ar.left + '곳이 남아 반려했습니다. 아래 후보를 고치면 다시 자동으로 점검합니다.' : '') + '</p>' : '';
    box.innerHTML = '<h2>' + ico(U.I.scale) + '점검 결과<small>' + esc(r.pack ? r.pack.name + ' ' + r.pack.ver : '') + '</small></h2><div class="mt12">' + U.summary(r) + '</div>' + auto +
      (fresh ? '' : '<p class="note mt8">문구가 바뀌었어요. 멈추면 자동으로 다시 점검합니다.</p>') +
      cats + '<div class="prev3" id="prev">' + U.highlight(r.copy, r.findings) + '</div>' +
      '<div class="actbar"><button class="btn btn-p" type="button" id="fixall"' + (fresh ? '' : ' disabled') + '>' + ico(I.wand) + '한 번에 고치기</button><button class="btn btn-g" type="button" id="recheck">다시 점검</button></div>' +
      labels + '<div class="fdl" id="fdl">' + (list.length ? list.map(function (x) { return U.finding(x.f, x.i, { fb: true, fix: fresh }); }).join('') : '<div class="empty3" style="padding:18px">' + ico(I.check) + '<b>이 범주에는 후보가 없어요</b></div>') + imgs + '</div>' +
      '<p class="note mt12">위험 후보와 근거를 보여 주는 도구이며 법률 자문을 대신하지 않습니다. 최종 판단은 담당자가 합니다.</p>';
    bindResult(it);
  }
  function bindResult(it) {
    var r = it.check;
    $('#cats').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; CAT = +b.getAttribute('data-cat'); paintResult(it); });
    $('#recheck').addEventListener('click', function () { runCheck(it, true); });
    $('#fixall').addEventListener('click', function () {
      var out = U.applyAll(r.copy, r.findings);
      if (!out.n) { toast('자동으로 바꿀 수 있는 표현이 없어요. 남은 후보는 직접 확인해 주세요.'); return; }
      setCopy(it, out.text); addEvent(it, 'fix', out.n + '곳 자동 수정'); toast(out.n + '곳을 고쳤어요. 다시 점검합니다.'); runCheck(it);
    });
    $('#fdl').addEventListener('click', function (e) {
      var b = e.target.closest('[data-fix]');
      if (b) { var p = b.getAttribute('data-fix').split(':'), f = r.findings[+p[0]], rep = f.reps[+p[1]], t = U.applyFix(r.copy, f, rep); if (t === r.copy) { toast('이미 바뀐 문구예요.'); return; } setCopy(it, t); addEvent(it, 'fix', (f.t || '필수 표시') + ' → ' + (rep === '(삭제)' ? '삭제' : rep.trim())); runCheck(it); return; }
      var fb = e.target.closest('[data-fb]');
      if (fb) { var q = fb.getAttribute('data-fb').split(':'), ff = r.findings[+q[0]]; fb.classList.add('on'); AM.call('am.fb', { rule: ff.id, v: q[1], ind: r.ind, cid: U.cid() }).catch(function () {}); toast(q[1] === 'ok' ? '의견 고마워요. 판정 정확도를 높이는 데 씁니다.' : '틀린 판정으로 남겼어요. 규칙을 고칠 때 씁니다.'); }
    });
    $('#prev').addEventListener('click', function (e) { var m = e.target.closest('mark[data-i]'); if (!m) return; var el = $('[data-f="' + m.getAttribute('data-i') + '"]'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1400); } });
    $$('[data-copytext]').forEach(function (b) { b.addEventListener('click', function () { AM.copy(b.getAttribute('data-copytext'), null); toast('표시 문장을 복사했어요.'); }); });
  }
  function setCopy(it, t) { it.copy = t; var ta = $('#copy'); if (ta && CUR === it) { ta.value = t; $('#cc').textContent = t.length + ' / 5,000자'; } save(); }
  function paintFlagsAuto(it) { $$('[data-flag]').forEach(function (cb) { var k = cb.getAttribute('data-flag'); cb.checked = !!it.flags[k]; var lab = cb.closest('.tg3'), a = lab.querySelector('.auto'), want = it.fa && it.fa[k] && !(it.fm && it.fm[k]) && it.flags[k]; if (want && !a) lab.insertAdjacentHTML('beforeend', '<span class="auto">자동</span>'); if (!want && a) a.remove(); }); }

  /* 이미지 */
  function addFiles(it, files) {
    var arr = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type); }).slice(0, Math.max(0, 10 - it.files.length));
    if (!arr.length) { toast('이미지 파일(JPG · PNG · WEBP)을 올려 주세요. 소재 하나에 10장까지.'); return; }
    toast(arr.length + '장의 출처를 살피는 중이에요…');
    Promise.all(arr.map(function (file) {
      return P.inspect(file).then(function (info) {
        var f = { id: uid('f'), name: file.name.slice(0, 80), size: file.size, w: info.w || 0, h: info.h || 0, thumb: info.thumb ? shrink(info) : '', det: { level: info.det.level, label: info.det.label, signals: info.det.signals, tool: info.det.tool, c2pa: info.det.c2pa } };
        MEM[f.id] = { file: file, img: info._img }; it.files.push(f); return f;
      }).catch(function () { return null; });
    })).then(function (fs) {
      var ok = fs.filter(Boolean); if (!ok.length) { toast('이 파일은 열 수 없어요.'); return; }
      addEvent(it, 'image', ok.length + '장 · ' + ok.map(function (f) { return P.LEVEL[f.det.level].t; }).join(', '));
      if (/^이미지 소재$|^새 소재$/.test(it.title)) it.title = ok[0].name.replace(/\.[a-z0-9]+$/i, '').slice(0, 40);
      autoFlags(it); save(); if (CUR === it) { paintFiles(it); paintFlagsAuto(it); $('#title').value = it.title; }
      var ai = ok.filter(function (f) { return f.det.level === 'confirmed' || f.det.level === 'likely'; }).length;
      toast(ai ? 'AI로 만든 흔적이 있는 이미지 ' + ai + '장을 찾았어요. AI 표시를 넣어 내려받을 수 있어요.' : '이미지 ' + ok.length + '장을 살폈어요. 기록이 없는 이미지는 확인 불가로 둡니다.');
      if (it.copy) runCheck(it); else paintResult(it);
    });
  }
  function shrink(info) { return info.thumb && info.thumb.length > 60000 && info._img ? P.thumb(info._img, 300) : info.thumb; }
  function paintFiles(it) {
    var box = $('#flist'); if (!box) return;
    box.innerHTML = (it.files || []).map(function (f) {
      var L = P.LEVEL[f.det.level], can = !!MEM[f.id];
      return '<div class="fcard" data-fid="' + f.id + '">' + (f.thumb ? '<img src="' + f.thumb + '" alt="">' : '') + '<button class="x3" type="button" data-del="' + f.id + '" aria-label="빼기">×</button>' +
        '<div class="fb3"><b title="' + esc(f.name) + '">' + esc(f.name) + '</b><span class="pv ' + L.c + '">' + L.t + '</span></div>' +
        '<button class="lb" type="button" data-label="' + f.id + '"' + (can ? '' : ' title="원본을 다시 올리면 표시를 넣을 수 있어요"') + '>' + (can ? 'AI 표시 넣어 내려받기' : '원본 다시 올리기') + '</button></div>';
    }).join('');
    box.onclick = function (e) {
      var d = e.target.closest('[data-del]');
      if (d) { var id = d.getAttribute('data-del'); it.files = it.files.filter(function (x) { return x.id !== id; }); delete MEM[id]; autoFlags(it); save(); paintFiles(it); paintResult(it); return; }
      var l = e.target.closest('[data-label]');
      if (l) {
        var f = it.files.filter(function (x) { return x.id === l.getAttribute('data-label'); })[0], m = MEM[f.id];
        if (!m || !m.img) { $('#files').click(); return; }
        var text = it.flags.aiPerson ? '가상인물' : f.det.label || 'AI 생성';
        P.labelBlob(m.file, m.img, text, { pos: 'tl', theme: 'dark' }).then(function (r) { P.save(r.blob, r.name); addEvent(it, 'label', f.name + ' · ' + text); save(); paintTl(it); toast('\'' + text + '\' 표시와 파일 속 출처 기록(IPTC)을 넣어 내려받았어요.'); });
      }
    };
  }

  /* 흐름(승인) */
  function paintFlow(it) {
    var box = $('#flow'); if (!box || CUR !== it) return;
    var st = statusOf(it), sh = it.share, html = '<h2>' + ico(I.send) + '승인 · 출고</h2>';
    var last = it.versions[it.versions.length - 1];
    var changedAfter = sh && last && sh.h && sh.h !== last.h;
    html += '<ol class="steps-mini">' + [['점검', !!it.check], ['내부 확인', !!it.internal], ['광고주 승인', sh && sh.st === '승인'], ['게시', !!it.published]].map(function (s, i) { return '<li class="' + (s[1] ? 'done' : '') + '"><i>' + (s[1] ? '✓' : i + 1) + '</i>' + s[0] + '</li>'; }).join('') + '</ol>';
    if (sh) {
      html += '<div class="share3"><b>' + (sh.st === '대기' ? '광고주 승인을 기다리는 중' : sh.st === '승인' ? '광고주가 승인했어요' : '광고주가 수정을 요청했어요') + '</b>' +
        (sh.by ? '<p class="note">' + esc(sh.by) + (sh.done ? ' · ' + esc(sh.done) : '') + '</p>' : '') + (sh.memo ? '<p class="note">"' + esc(sh.memo) + '"</p>' : '') +
        (changedAfter ? '<p class="note" style="color:#B42328">승인 요청 뒤 문구가 바뀌었어요. 새 버전으로 다시 요청하세요.</p>' : '') +
        '<div class="row"><input class="inp" readonly value="' + esc(sh.url) + '" id="shurl"><button class="btn btn-g btn-s" type="button" id="shcopy">' + ico(I.copy) + '복사</button>' + (navigator.share ? '<button class="btn btn-g btn-s" type="button" id="shsend">보내기</button>' : '') + '</div></div>';
    }
    html += '<div class="actbar">' +
      (!it.internal ? '<button class="btn btn-g" type="button" id="internal"' + (it.check ? '' : ' disabled') + '>' + ico(I.check) + '내부 확인 완료</button>' : '') +
      ((!sh || sh.st !== '대기' || changedAfter) ? '<button class="btn btn-p" type="button" id="share"' + (it.check ? '' : ' disabled') + '>' + ico(I.link) + (sh ? '새 승인 링크 만들기' : '광고주 승인 링크 만들기') + '</button>' : '<button class="btn btn-g" type="button" id="poll">승인 상태 새로 보기</button>') +
      (!it.published ? '<button class="btn btn-g" type="button" id="publish"' + (it.check ? '' : ' disabled') + '>게시 완료로 표시</button>' : '') + '</div>' +
      '<p class="note mt8">승인 링크는 로그인 없이 열리고, 승인 결과와 시각이 원장에 남습니다. 문구 · 점검 요약은 90일 보관 뒤 지웁니다.</p>' +
      '<div class="row mt12"><button class="btn btn-t" type="button" id="del">' + ico(I.trash) + '이 소재 지우기</button></div>';
    box.innerHTML = html;
    var b;
    if ((b = $('#internal'))) b.addEventListener('click', function () { askName(function () { it.internal = { at: Date.now(), by: S.me }; addEvent(it, 'internal', S.me); save(); paintResult(it); paintSide(); }); });
    if ((b = $('#share'))) b.addEventListener('click', function () { askName(function () { makeShare(it); }); });
    if ((b = $('#poll'))) b.addEventListener('click', function () { poll(true); });
    if ((b = $('#publish'))) b.addEventListener('click', function () { it.published = { at: Date.now(), by: S.me }; addEvent(it, 'publish'); save(); paintResult(it); paintSide(); toast('게시 완료로 표시했어요.'); });
    if ((b = $('#shcopy'))) b.addEventListener('click', function () { AM.copy(sh.url, null); toast('승인 링크를 복사했어요. 카카오톡 · 메일로 보내 주세요.'); });
    if ((b = $('#shsend'))) b.addEventListener('click', function () { navigator.share({ title: '[승인 요청] ' + it.title, text: (it.brand ? it.brand + ' · ' : '') + it.title + ' 광고 문구 승인을 부탁드립니다.', url: sh.url }).catch(function () {}); });
    $('#del').addEventListener('click', function () {
      var d = $('#del'); if (!d.classList.contains('sure')) { d.classList.add('sure'); d.lastChild.textContent = '정말 지울까요? 한 번 더 누르세요'; return; }
      S.items = S.items.filter(function (x) { return x.id !== it.id; }); save(); toast('지웠어요.'); location.hash = '#/inbox';
    });
  }
  function paintTl(it) {
    var box = $('#tl'); if (!box || CUR !== it) return;
    var cls = { approved: 'ok', publish: 'ok', internal: 'ok', changes: 'bad', share: 'sent' };
    box.innerHTML = (it.events || []).slice().reverse().slice(0, 14).map(function (e) {
      return '<li class="' + (cls[e.k] || '') + '"><b>' + (EVN[e.k] || e.k) + '</b>' + (e.note ? ' · ' + esc(e.note) : '') + '<small>' + U.stamp(e.at) + (e.by ? ' · ' + esc(e.by) : '') + (e.h ? ' · <code>' + e.h.slice(0, 10) + '</code>' : '') + '</small></li>';
    }).join('') || '<li>기록이 없어요</li>';
  }
  function askName(cb) {
    if (S.me) { cb(); return; }
    sheet('승인 기록에 남길 이름', '내부 확인 · 승인 요청에 남길 이름이나 팀 이름을 적어 주세요. 이 브라우저에만 저장됩니다.', '<input class="inp" id="meName" maxlength="30" placeholder="예: 모아 애드 김지윤">', function () { var v = ($('#meName').value || '').trim(); if (!v) return false; S.me = v.slice(0, 30); save(); cb(); return true; });
  }
  function sheet(title, text, body, onOk, okText) {
    var s = $('#sheet'); s.innerHTML = '<div role="dialog" aria-modal="true"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="mt16">' + body + '</div><div class="row"><button class="btn btn-g" type="button" data-x>닫기</button><button class="btn btn-p" type="button" data-ok>' + esc(okText || '확인') + '</button></div></div>';
    s.classList.add('on'); var inp = s.querySelector('input,textarea'); if (inp) setTimeout(function () { inp.focus(); }, 50);
    s.onclick = function (e) { if (e.target === s || e.target.closest('[data-x]')) s.classList.remove('on'); if (e.target.closest('[data-ok]')) { if (onOk() !== false) s.classList.remove('on'); } };
  }
  function makeShare(it) {
    if (!it.check) { toast('먼저 점검해 주세요.'); return; }
    var r = it.check, last = it.versions[it.versions.length - 1] || {};
    var data = { title: it.title, brand: it.brand, channel: it.channel, ind: r.ind, copy: r.copy, score: r.score, dec: r.decision, from: S.me || S.name, ver: 'v' + (last.v || 1), h: last.h || '',
      fnd: r.findings.slice(0, 30).map(function (f) { return { lv: f.lv, cat: f.cat, why: f.why, t: f.t, law: f.law }; }), files: (it.files || []).map(function (f) { return { name: f.name, prov: P.LEVEL[f.det.level].t }; }), step: '광고주' };
    var b = $('#share'); if (b) { b.disabled = true; b.lastChild.textContent = '링크 만드는 중…'; }
    AM.call('am.share', { data: data, cid: U.cid() }).then(function (x) {
      if (!x || !x.ok) throw new Error(x && x.message || '링크를 만들지 못했어요');
      it.share = { id: x.id, url: x.url, at: Date.now(), st: '대기', h: data.h, ver: data.ver };
      addEvent(it, 'share', data.ver + ' · ' + x.id); save(); paintResult(it); paintSide();
      AM.copy(x.url, null); toast('승인 링크를 만들고 복사했어요. 광고주에게 보내 주세요.');
    }).catch(function (e) { toast(e.message || '지금은 링크를 만들지 못했어요.'); paintFlow(it); });
  }
  /* 승인 상태 받아 오기 */
  function poll(loud) {
    var wait = S.items.filter(function (it) { return it.share && it.share.st === '대기'; });
    if (!wait.length) { if (loud) toast('기다리는 승인 요청이 없어요.'); return; }
    AM.call('am.status', { ids: wait.map(function (it) { return it.share.id; }), cid: U.cid() }).then(function (r) {
      if (!r || !r.ok) return;
      var changed = 0;
      wait.forEach(function (it) {
        var s = r.items[it.share.id]; if (!s || s.st === '대기') return;
        it.share.st = s.st; it.share.by = s.by; it.share.done = s.done; it.share.memo = s.memo; changed++;
        addEvent(it, s.st === '승인' ? 'approved' : 'changes', (s.by || '광고주') + (s.memo ? ' · ' + s.memo.slice(0, 60) : ''));
        toast((s.st === '승인' ? '승인 완료: ' : '수정 요청: ') + it.title);
      });
      if (changed) { save(); paintSide(); route(); } else if (loud) toast('아직 답이 없어요.');
    }).catch(function () { if (loud) toast('지금은 상태를 받지 못했어요.'); });
  }

  /* ---------- 승인 현황 ---------- */
  function vApprovals() {
    var list = S.items.filter(function (it) { return it.share; }).sort(function (a, b) { return (b.share.at || 0) - (a.share.at || 0); });
    var html = top('승인 현황', '광고주에게 보낸 승인 요청과 답을 모아 봅니다. 답이 오면 자동으로 바뀝니다.', '<button class="btn btn-g btn-s" type="button" id="poll2">새로 보기</button>');
    html += list.length ? '<table class="itbl"><thead><tr><th>소재</th><th>버전</th><th>상태</th><th>답한 분 · 시각</th><th>요청한 때</th></tr></thead><tbody>' + list.map(function (it) {
      return '<tr data-id="' + it.id + '"><td><div class="tt"><div style="min-width:0"><b>' + esc(it.title) + '</b><small>' + esc((it.brand || '') + (it.share.memo ? ' · "' + it.share.memo.slice(0, 40) + '"' : '')) + '</small></div></div></td><td class="c-ind">' + esc(it.share.ver || '') + '</td><td>' + stChip(statusOf(it)) + '</td><td class="c-upd">' + esc((it.share.by || '-') + (it.share.done ? ' · ' + it.share.done.slice(5, 16) : '')) + '</td><td class="c-upd">' + U.when(it.share.at) + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="ac"><div class="empty3">' + ico(I.send) + '<b>아직 보낸 승인 요청이 없어요</b><p>소재를 점검한 뒤 \'광고주 승인 링크 만들기\'를 누르면 로그인 없이 승인받을 수 있어요.</p></div></div>';
    view.innerHTML = html;
    $('#poll2').addEventListener('click', function () { poll(true); });
    var t = $('.itbl tbody'); if (t) t.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-id]'); if (tr) location.hash = '#/item/' + tr.getAttribute('data-id'); });
  }

  /* ---------- 보고서 ---------- */
  var RP = { range: 'month', brand: '' }, RPD = null;
  function ymd(t) { var d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }   // 이 브라우저 시각 기준 날짜(UTC로 바꾸면 하루 밀림)
  function reportData() {
    var now = new Date(), from = 0;
    if (RP.range === 'month') from = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    else if (RP.range === '30') from = now.getTime() - 30 * 86400000;
    var items = S.items.filter(function (it) { return (it.updated || it.created) >= from && (!RP.brand || it.brand === RP.brand); });
    var catSum = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }, firstHi = 0, lastHi = 0, fixed = 0;
    var rows = items.map(function (it) {
      var v0 = it.versions[0], vl = it.versions[it.versions.length - 1];
      (it.check ? it.check.findings : []).forEach(function (f) { catSum[f.cat]++; });
      if (v0 && (v0.decision === 'fix' || v0.decision === 'expert')) firstHi++;
      if (it.check && (it.check.decision === 'fix' || it.check.decision === 'expert')) lastHi++;
      fixed += (it.events || []).filter(function (e) { return e.k === 'fix'; }).length;
      var lastEv = (it.events || []).slice().reverse().filter(function (e) { return e.h; })[0];
      return { title: it.title, brand: it.brand, channel: it.channel, ind: it.check ? it.check.indName : '', first: v0 ? v0.score : null, score: it.check ? it.check.score : null, dec: it.check ? U.DEC[it.check.decision].t : '미점검',
        versions: it.versions.length, status: ST[statusOf(it)], approvedBy: it.share && it.share.st === '승인' ? (it.share.by || '광고주') : '', approvedAt: it.share && it.share.done || '', images: (it.files || []).length,
        aiImages: (it.files || []).filter(function (f) { return f.det.level === 'confirmed' || f.det.level === 'likely'; }).length, chain: lastEv ? lastEv.h : '' };
    });
    return { kind: 'AIMarker 검수 · 승인 보고서', ws: S.name, brand: RP.brand || '전체 브랜드', range: RP.range === 'month' ? '이번 달' : RP.range === '30' ? '최근 30일' : '전체', from: from ? ymd(from) : '', to: ymd(Date.now()),
      made: new Date().toISOString(), pack: (S.items.filter(function (x) { return x.check; })[0] || { check: { pack: { name: 'KR-AdLaw', ver: '' } } }).check.pack,
      totals: { items: items.length, checked: items.filter(function (x) { return x.check; }).length, firstHigh: firstHi, lastHigh: lastHi, fixes: fixed, approved: items.filter(function (x) { return x.share && x.share.st === '승인'; }).length,
        published: items.filter(function (x) { return x.published; }).length, aiImages: rows.reduce(function (a, r) { return a + r.aiImages; }, 0) }, cats: catSum, items: rows };
  }
  function vReports() {
    var brands = {}; S.items.forEach(function (x) { if (x.brand) brands[x.brand] = 1; });
    var html = top('보고서', '광고주 · 감사 제출용 검수 · 승인 보고서. 해시를 원장에 남겨 위변조 여부를 누구나 확인할 수 있습니다.',
      '<select class="sel" id="rpr" style="height:38px;width:auto"><option value="month">이번 달</option><option value="30">최근 30일</option><option value="all">전체</option></select>' +
      '<select class="sel" id="rpb" style="height:38px;width:auto"><option value="">전체 브랜드</option>' + Object.keys(brands).map(function (b) { return '<option>' + esc(b) + '</option>'; }).join('') + '</select>');
    view.innerHTML = html + '<div id="rpv"></div>';
    $('#rpr').value = RP.range; $('#rpb').value = RP.brand;
    $('#rpr').addEventListener('change', function (e) { RP.range = e.target.value; paintReport(); });
    $('#rpb').addEventListener('change', function (e) { RP.brand = e.target.value; paintReport(); });
    paintReport();
  }
  function paintReport() {
    var d = RPD = reportData(), t = d.totals, box = $('#rpv');
    if (!t.items) { box.innerHTML = '<div class="ac"><div class="empty3">' + ico(I.file) + '<b>이 기간에 소재가 없어요</b><p>기간 · 브랜드를 바꾸거나 소재를 먼저 점검해 주세요.</p></div></div>'; return; }
    var maxC = Math.max(1, Math.max.apply(null, Object.keys(d.cats).map(function (k) { return d.cats[k]; })));
    var stamped = S.reports.filter(function (r) { return r.key === U.canon({ r: d.range, b: d.brand, n: t.items, f: d.from }); })[0];
    box.innerHTML = '<div class="rp" id="rp"><div class="rp-h"><div><h2>AI 콘텐츠 검수 · 승인 보고서</h2><p>' + esc(d.ws) + ' · ' + esc(d.brand) + ' · ' + esc(d.range) + (d.from ? ' (' + d.from + ' ~ ' + d.to + ')' : '') + '</p></div><div class="lg">만든 때 ' + U.stamp(d.made) + '<br>' + esc(d.pack.name + ' ' + d.pack.ver) + '</div></div>' +
      '<div class="rp-k"><div><b>' + t.items + '</b><span>검수한 소재</span></div><div><b>' + t.firstHigh + ' → ' + t.lastHigh + '</b><span>높음 후보가 있던 소재(처음 → 지금)</span></div><div><b>' + t.fixes + '</b><span>수정 문구 적용</span></div><div><b>' + t.approved + '</b><span>광고주 승인 완료</span></div></div>' +
      '<h3>범주별 위험 후보(지금 버전)</h3><div class="rp-bars">' + [1, 2, 3, 4, 5, 6].map(function (k) { return '<div><span>' + U.CATS[k] + '</span><i style="width:' + Math.max(2, d.cats[k] / maxC * 100) + '%"></i><b>' + d.cats[k] + '</b></div>'; }).join('') + '</div>' +
      '<h3>소재별 결과</h3><div style="overflow-x:auto"><table><thead><tr><th>소재</th><th>채널 · 업종</th><th>점수(처음 → 지금)</th><th>판정</th><th>버전</th><th>승인</th></tr></thead><tbody>' + d.items.map(function (r) {
        return '<tr><td><b>' + esc(r.title) + '</b><br><small>' + esc(r.brand || '') + '</small></td><td>' + esc(r.channel) + '<br><small>' + esc(r.ind) + '</small></td><td>' + (r.first == null ? '-' : r.first + ' → ' + r.score) + '</td><td>' + esc(r.dec) + '</td><td>' + r.versions + '</td><td>' + esc(r.approvedBy ? r.approvedBy + ' · ' + r.approvedAt.slice(0, 16) : r.status) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="rp-ft">이 보고서는 AIMarker 자동 점검(위험 후보와 근거)과 담당자 · 광고주의 확인 기록을 정리한 것이며, 법률 자문이나 적법성 보증이 아닙니다.<br>보고서 해시(SHA-256) <code id="rph">계산 중…</code></div>' +
      '<div class="ledger3" id="lg">' + ico(I.shield) + '<div><b id="lgt">' + (stamped ? '원장 번호 ' + esc(stamped.id) : '아직 원장에 남기지 않았어요') + '</b><small id="lgs">' + (stamped ? '서버 시각 ' + esc(stamped.at) + ' · aimarker.kr/verify/ 에서 확인' : '보고서 해시를 서버 시각과 함께 남기면, 나중에 내용이 바뀌지 않았음을 누구나 확인할 수 있어요.') + '</small></div>' +
      (stamped ? '' : '<button class="btn btn-w btn-s no-print" type="button" id="stamp">원장에 남기기</button>') + '</div></div>' +
      '<div class="row mt16 no-print"><button class="btn btn-p" type="button" id="print">' + ico(I.dl) + 'PDF로 저장(인쇄)</button><button class="btn btn-g" type="button" id="json">검증용 파일(JSON) 내려받기</button><a class="btn btn-t" href="' + AM.root + 'verify/" target="_blank" rel="noopener">검증 페이지</a></div>';
    U.sha256(U.canon(d)).then(function (h) {
      d._h = h; $('#rph').textContent = h;
      var b = $('#stamp'); if (b) b.addEventListener('click', function () {
        b.disabled = true; b.textContent = '남기는 중…';
        AM.call('am.stamp', { h: h, n: t.items, k: 'report', cid: U.cid() }).then(function (r) {
          if (!r || !r.ok) throw new Error(r && r.message || '원장에 남기지 못했어요');
          S.reports.unshift({ id: r.id, at: r.at, h: h, n: t.items, key: U.canon({ r: d.range, b: d.brand, n: t.items, f: d.from }) }); S.reports = S.reports.slice(0, 50); save();
          $('#lgt').textContent = '원장 번호 ' + r.id; $('#lgs').textContent = '서버 시각 ' + r.at + ' · aimarker.kr/verify/ 에서 이 번호나 검증용 파일로 확인'; b.remove();
          toast('보고서 해시를 원장에 남겼어요. 검증용 파일도 함께 보관하세요.');
        }).catch(function (e) { b.disabled = false; b.textContent = '원장에 남기기'; toast(e.message); });
      });
    });
    $('#print').addEventListener('click', function () { window.print(); });
    $('#json').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ report: d, sha256: d._h || '' }, null, 2)], { type: 'application/json' });
      P.save(blob, 'aimarker-report-' + d.to.replace(/-/g, '') + '.json');
    });
  }

  /* ---------- 브랜드 가이드 ---------- */
  function vGuide() {
    var g = S.guide;
    view.innerHTML = top('브랜드 가이드', '쓰지 않을 말과 꼭 넣을 문구를 정해 두면, 모든 소재 점검에 함께 적용됩니다(범주 6).') +
      '<div class="ac"><div class="grid g2"><div class="field"><label for="ban">쓰지 않을 말 <small>한 줄에 하나</small></label><textarea class="txt" id="ban" rows="8" placeholder="역대급\n완판\n대박">' + esc((g.ban || []).join('\n')) + '</textarea></div>' +
      '<div class="field"><label for="must">꼭 넣을 문구 <small>한 줄에 하나</small></label><textarea class="txt" id="must" rows="8" placeholder="#광고\n비건 인증 번호">' + esc((g.must || []).join('\n')) + '</textarea></div></div>' +
      '<div class="field mt16"><label for="note">톤 · 메모 <small>팀 공유용, 점검에는 쓰지 않음</small></label><textarea class="txt" id="note" rows="3">' + esc(g.note || '') + '</textarea></div>' +
      '<div class="row mt16"><button class="btn btn-p" type="button" id="gsave">저장하고 모든 소재 다시 점검</button></div></div>';
    $('#gsave').addEventListener('click', function () {
      var lines = function (id) { return $(id).value.split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 50); };
      S.guide = { ban: lines('#ban'), must: lines('#must').slice(0, 20), note: $('#note').value.slice(0, 1000) }; save();
      toast('저장했어요. 소재를 열면 새 가이드로 다시 점검합니다.');
      S.items.forEach(function (it) { if (it.check) it.check.key = ''; }); save();
    });
  }

  /* ---------- 설정 · 데이터 ---------- */
  function vSettings() {
    view.innerHTML = top('설정 · 데이터', '작업 공간 데이터는 이 브라우저에만 저장됩니다. 다른 기기로 옮기거나 보관하려면 내보내세요.') +
      '<div class="ac"><h2>작업 공간</h2><div class="grid g2 mt12"><div class="field"><label for="wsn">작업 공간 이름</label><input class="inp" id="wsn" maxlength="40" value="' + esc(S.name) + '"></div>' +
      '<div class="field"><label for="me">내 이름 · 팀 <small>승인 기록에 남음</small></label><input class="inp" id="me" maxlength="30" value="' + esc(S.me) + '"></div>' +
      '<div class="field"><label for="dind">기본 업종 규칙 팩</label><select class="sel" id="dind">' + Object.keys(U.IND).map(function (k) { return '<option value="' + k + '"' + (k === S.ind ? ' selected' : '') + '>' + esc(U.IND[k]) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="row mt16"><button class="btn btn-p" type="button" id="ssave">저장</button></div></div>' +
      '<div class="ac"><h2>데이터</h2><p class="note mt8">소재 ' + S.items.length + '개 · 원장 기록 ' + S.reports.length + '개</p><div class="row mt12"><button class="btn btn-g" type="button" id="exp">' + ico(I.dl) + '전체 내보내기(JSON)</button><label class="btn btn-g">' + ico(I.upload) + '가져오기<input type="file" id="imp" accept="application/json" hidden></label><button class="btn btn-t" type="button" id="wipe">' + ico(I.trash) + '모두 지우기</button></div></div>' +
      '<div class="ac"><h2>자동화 · 연동</h2><p class="note mt8">사내 시스템 · 콘텐츠 관리 도구 · 구글 시트 · n8n · Make에서 같은 엔진을 API로 부를 수 있습니다.</p><div class="row mt12"><a class="btn btn-g" href="' + AM.root + 'developers/">개발자 API · 무료 키 받기</a><a class="btn btn-t" href="' + AM.root + 'contact/">팀으로 쓰기(도입 상담)</a></div></div>';
    $('#ssave').addEventListener('click', function () { S.name = $('#wsn').value.trim().slice(0, 40) || '내 작업 공간'; S.me = $('#me').value.trim().slice(0, 30); S.ind = $('#dind').value; save(); paintSide(); toast('저장했어요.'); });
    $('#exp').addEventListener('click', function () { P.save(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), 'aimarker-workspace-' + ymd(Date.now()).replace(/-/g, '') + '.json'); });
    $('#imp').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      f.text().then(function (t) { var s = JSON.parse(t); if (!s || s.v !== 1 || !Array.isArray(s.items)) throw new Error('bad'); var ids = {}; S.items.forEach(function (x) { ids[x.id] = 1; }); var n = 0; s.items.forEach(function (x) { if (!ids[x.id]) { S.items.push(x); n++; } }); save(); paintSide(); toast(n + '개 소재를 가져왔어요.'); })
        .catch(function () { toast('AIMarker 작업 공간 파일이 아니에요.'); });
    });
    $('#wipe').addEventListener('click', function () { var b = $('#wipe'); if (!b.classList.contains('sure')) { b.classList.add('sure'); b.lastChild.textContent = '정말 모두 지울까요? 한 번 더 누르세요'; return; } S = blank(); save(); paintSide(); toast('모두 지웠어요.'); vSettings(); });
  }

  /* ---------- 길 찾기 ---------- */
  function route() {
    var h = location.hash.replace(/^#\/?/, '') || 'inbox', parts = h.split('/'), r = parts[0];
    CUR = null; navOn(r === 'item' ? 'inbox' : r);
    if (r === 'new') { var it = newItem(); location.replace('#/item/' + it.id); return; }
    if (r === 'item') vItem(parts[1]); else if (r === 'approvals') vApprovals(); else if (r === 'reports') vReports(); else if (r === 'guide') vGuide(); else if (r === 'settings') vSettings(); else vInbox();
    paintSide(); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  // 검사 페이지에서 넘겨받은 문구(/check/ → 작업 공간에서 계속)
  try {
    var hand = JSON.parse(sessionStorage.getItem('am_hand') || 'null');
    if (hand && hand.copy) { sessionStorage.removeItem('am_hand'); var it0 = newItem({ copy: hand.copy, ind: hand.ind || 'auto', flags: hand.flags, title: hand.copy.replace(/\s+/g, ' ').slice(0, 24) + (hand.copy.length > 24 ? '…' : '') }); it0.fm = { sponsored: true, aiPerson: true, aiMedia: true }; save(); location.replace('#/item/' + it0.id); }
  } catch (eH) { /* 무시 */ }
  route();
  setTimeout(function () { poll(false); }, 1500);
  setInterval(function () { if (!document.hidden) poll(false); }, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) poll(false); });
  // 앱으로 설치(PWA)
  var deferred = null, ib = $('#installBtn');
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; if (ib) ib.hidden = false; });
  if (ib) ib.addEventListener('click', function () { if (!deferred) return; deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; ib.hidden = true; }); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register(AM.root + 'app/sw.js', { scope: AM.root + 'app/' }).catch(function () { /* 무시 */ });
  window.AMApp = { state: function () { return S; }, runCheck: runCheck, newItem: newItem };   // 시험용
})();
