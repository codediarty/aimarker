/* AIMarker 가게 AI 검색 등록 화면(13.9, 2026.10.27)
   입력하는 대로 바로 계산합니다(assets/local-core.js): AI 검색 준비도 · 손님이 AI에게 묻는 질문 · AI 가게 페이지 · 구조화 데이터 · llms.txt.
   계산은 이 브라우저 안에서만 하고 서버로 보내지 않습니다. 서버에 보내는 것은 '광고 표현 점검'을 누를 때 점검할 문장(소개 · 질문의 답 · 메뉴와 가격 · 참고,
   전화번호와 링크는 빼고)뿐이며 저장하지 않습니다(am.check).
   작성 중인 내용은 사장님이 입력을 시작한 뒤에만, 업종마다 이 브라우저에 임시로 남깁니다(다른 사람과 공유되지 않음). */
(function () {
  'use strict';
  var L = window.AMLocal, AM = window.AM || {};
  if (!L) return;
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  var esc = L.esc, root = document.body.getAttribute('data-root') || '';
  var KEY = 'am_local_draft_v1';
  function has(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }
  /* { last: 업종, d: { 업종: 초안 } }. 예전 꼴(초안 하나)도 읽음 */
  function sall() { var v = null; try { v = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { v = null; } if (v && v.ind && !v.d) { var d = {}; d[v.ind] = v; v = { last: v.ind, d: d }; } return v && v.d ? v : { last: '', d: {} }; }
  function sget(k) { var a = sall(); k = k || a.last; return has(a.d, k) ? a.d[k] : null; }
  function sset(v) { if (!v || !v.ind) return; var a = sall(); a.d[v.ind] = v; a.last = v.ind; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { /* 저장 없이 */ } }
  function sdel() { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function save(text, name, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function copy(text, btn) { if (AM.copy) AM.copy(text, btn); else if (navigator.clipboard) navigator.clipboard.writeText(text); }
  function cid() { var c = ''; try { c = localStorage.getItem('am_cid') || ''; if (!c) { c = 'w' + Math.random().toString(36).slice(2, 12); localStorage.setItem('am_cid', c); } } catch (e) { c = 'w' + Math.random().toString(36).slice(2, 12); } return c; }
  var ICO = {
    check: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    x: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    minus: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    plus: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>'
  };

  /* ---------- 첫 화면 · 다른 페이지의 '빠른 시작' 양식: 업종 · 이름 · 지역 → 진단 칸으로 ---------- */
  $$('form[data-lc-start]').forEach(function (f) {
    var sel = f.querySelector('select[name=ind]');
    if (sel && !sel.options.length) L.ORDER.forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = L.IND[k].t; sel.appendChild(o); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var fe = function (n) { var el = f.elements.namedItem(n); return el && el.value ? String(el.value).trim() : ''; };
      var d = { ind: fe('ind') || f.getAttribute('data-ind') || '', name: fe('name'), area: fe('area') };
      if (window.AMLocalTool) { window.AMLocalTool.start(d); return; }
      var q = [];
      Object.keys(d).forEach(function (k) { if (d[k]) q.push(k + '=' + encodeURIComponent(d[k])); });
      location.href = root + 'local/' + (q.length ? '?' + q.join('&') : '') + '#tool';
    });
  });

  /* ---------- AI 답변 예시 창: 업종 예시를 돌려 보여 줌(움직임 줄이기면 첫 예시만) ---------- */
  (function () {
    var box = $('.lc-ai[data-rot]'), src = $('#lcEx');
    if (!box || !src) return;
    var EX = []; try { EX = JSON.parse(src.textContent); } catch (e) { return; }
    if (EX.length < 2) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, i = 0, hold = false, tm = 0;
    box.addEventListener('mouseenter', function () { hold = true; });
    box.addEventListener('mouseleave', function () { hold = false; });
    function paint(x) {
      box.classList.add('sw');
      setTimeout(function () {
        $('.lc-q b', box).textContent = x.q;
        $('.lc-a-t span', box).textContent = x.a;
        $('.lc-card .ch b', box).textContent = x.name;
        $('.lc-card .ch span', box).textContent = x.meta;
        $('.lc-card ul', box).innerHTML = x.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');
        $('.lc-ai-ft .k', box).textContent = x.ind;
        box.classList.remove('sw');
      }, 260);
    }
    if (reduce) return;
    function next() { tm = setTimeout(function () { if (!hold && !document.hidden) { i = (i + 1) % EX.length; paint(EX[i]); } next(); }, 5200); }
    next();
  })();

  /* ---------- 진단 도구 ---------- */
  var tool = $('#lcTool');
  if (!tool) return;
  var form = $('#lcForm', tool), side = $('#lcSide'), out = $('#lcOut'), pill = $('#lcPill');
  var preset = tool.getAttribute('data-ind') || '';
  var selInd = form.elements.ind, selSub = form.elements.sub;
  L.ORDER.forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = L.IND[k].t; selInd.appendChild(o); });

  /* 요일 줄 */
  var DAYS = L.DAYS.concat(['hol']);
  $('#lcHours').innerHTML = DAYS.map(function (d) {
    var lab = d === 'hol' ? '공휴일' : L.DKO[d] + '요일';
    return '<div class="lc-day" data-d="' + d + '"><span class="dn">' + lab + '</span>' +
      '<label class="k-sr" for="h-' + d + '">' + lab + ' 여는 시간</label><input class="inp" type="time" id="h-' + d + '" name="ho-' + d + '" step="600">' +
      '<span class="sep" aria-hidden="true">~</span><label class="k-sr" for="hc-' + d + '">' + lab + ' 닫는 시간</label><input class="inp" type="time" id="hc-' + d + '" name="hc-' + d + '" step="600">' +
      '<label class="lc-off"><input type="checkbox" name="hx-' + d + '" aria-label="' + lab + ' 쉼"><span aria-hidden="true">쉼</span></label></div>';
  }).join('');
  $('#lcHours').insertAdjacentHTML('beforeend', '<p class="lc-hbtn"><button type="button" class="k-btn k-btn-q k-btn-s" data-copyday="wk">월요일 시간을 화~금에</button><button type="button" class="k-btn k-btn-q k-btn-s" data-copyday="all">월요일 시간을 매일</button></p>' +
    '<p class="lc-hnote">24시간이면 여는 시간과 닫는 시간을 모두 00:00으로 넣으세요. 자정을 넘기면 닫는 시간을 다음 날 시각(예: 02:00)으로 넣으면 됩니다.</p>');

  /* 대표 서비스 줄 */
  var MAXI = 8;
  function itemRow(i) {
    return '<div class="lc-it" data-i="' + i + '"><label class="k-sr" for="it-n' + i + '">' + (i + 1) + '번째 이름</label><input class="inp" id="it-n' + i + '" name="itn-' + i + '" maxlength="40">' +
      '<label class="k-sr" for="it-p' + i + '">' + (i + 1) + '번째 가격</label><input class="inp" id="it-p' + i + '" name="itp-' + i + '" maxlength="30" placeholder="가격(예: 45,000원 · 4만 원부터)">' +
      '<button type="button" class="lc-rm" data-rm="' + i + '" aria-label="' + (i + 1) + '번째 줄 지우기">' + ICO.x + '</button></div>';
  }
  var nItems = 3;
  function drawItems(keep) {
    var vals = keep || readItems(true);
    $('#lcItems').innerHTML = Array.apply(null, { length: nItems }).map(function (_, i) { return itemRow(i); }).join('') +
      (nItems < MAXI ? '<button type="button" class="lc-add" data-additem>' + ICO.plus + '하나 더</button>' : '');
    vals.forEach(function (v, i) { if (i < nItems) { form.elements['itn-' + i].value = v.n || ''; form.elements['itp-' + i].value = v.p || ''; } });
    phItems();
  }
  function readItems(all) {
    var a = [];
    for (var i = 0; i < nItems; i++) { var n = form.elements['itn-' + i], p = form.elements['itp-' + i]; if (!n) continue; if (all || n.value.trim()) a.push({ n: n.value.trim(), p: p.value.trim() }); }
    return a;
  }
  function phItems() { var I = indOf(selInd.value) || L.IND.shop; for (var i = 0; i < nItems; i++) { var n = form.elements['itn-' + i]; if (n) n.placeholder = I.items[i] ? '예: ' + I.items[i] : '이름'; } }

  /* 업종이 바뀌면: 세부 업종 · 편의 고르기 · 이름표 · 업종별 칸 */
  function indOf(k) { return has(L.IND, k) ? L.IND[k] : null; }
  function setInd(k, keepFeat) {
    var I = indOf(k) || L.IND.shop, had = keepFeat || readFeat();
    selInd.value = I.k;
    var subs = I.subs || [];
    $('#f-subw').hidden = !subs.length;
    selSub.innerHTML = '<option value="">' + (I.subReq ? '고르세요(꼭)' : '고르세요') + '</option>' + subs.map(function (x) { return '<option value="' + esc(x[0]) + '">' + esc(x[0]) + '</option>'; }).join('');
    selSub.required = !!I.subReq;
    var sl = $('label[for=f-sub]'); if (sl) sl.innerHTML = '세부 업종' + (I.subReq ? ' <em>필수</em>' : '');
    $$('[data-t]', tool).forEach(function (el) { el.textContent = I[el.getAttribute('data-t')] || el.textContent; });
    $('#lcFeat').innerHTML = I.feat.map(function (fk) { return '<label class="pick"><input type="checkbox" name="ft" value="' + fk + '" id="f-' + fk + '"' + (had.indexOf(fk) >= 0 ? ' checked' : '') + '><span>' + esc(L.FEAT[fk].t) + '</span></label>'; }).join('');
    $$('[data-for]', tool).forEach(function (el) { var on = el.getAttribute('data-for').split(' ').some(function (f) { return f === 'all' || !!I[f]; }); el.hidden = !on; });
    $('#lcWarn').hidden = !I.warn; $('#lcWarn p').textContent = I.warn || '';
    var lb = $('label[for=b-owner]'); if (lb) lb.firstChild.textContent = I.reg ? '개업공인중개사 이름 ' : '대표자 이름 ';
    phItems();
  }
  function readFeat() { return $$('input[name=ft]:checked', form).map(function (x) { return x.value; }); }

  /* 화면 → 가게 정보 */
  function read() {
    var E = form.elements, h = {};
    DAYS.forEach(function (d) {
      var o = E['ho-' + d].value, c = E['hc-' + d].value, x = E['hx-' + d].checked;
      h[d] = x ? 'off' : (o && c ? o + '-' + c : '');
    });
    var g = function (n) { return E[n] ? E[n].value.trim() : ''; };
    return { ind: selInd.value, sub: $('#f-subw').hidden ? '' : selSub.value, name: g('name'), area: g('area'), addr: g('addr'), addr2: g('addr2'), tel: g('tel'), hours: h, brk: g('brk'), off: g('off'),
      items: readItems(false), feat: readFeat(), note: g('note'), about: g('about'), cuisine: g('cuisine'), fee: g('fee'), area2: g('area2'), checkin: g('checkin'), checkout: g('checkout'),
      links: { place: g('l-place'), kakao: g('l-kakao'), google: g('l-google'), home: g('l-home'), insta: g('l-insta'), book: g('l-book') },
      biz: { owner: g('b-owner'), no: g('b-no'), reg: g('b-reg') }, updated: today() };
  }
  /* 가게 정보 → 화면(불러오기 · 주소로 시작) */
  function fill(d) {
    if (!d) return;
    var E = form.elements;
    setInd(d.ind || preset || 'nail', d.feat || []);
    if (d.sub && !$('#f-subw').hidden) selSub.value = d.sub;
    ['name', 'area', 'addr', 'addr2', 'tel', 'brk', 'off', 'note', 'about', 'cuisine', 'fee', 'area2', 'checkin', 'checkout'].forEach(function (k) { if (E[k] && d[k] != null) E[k].value = d[k]; });
    var h = d.hours || {};
    DAYS.forEach(function (d2) {
      var v = h[d2] || '', m = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(v);
      E['hx-' + d2].checked = v === 'off';
      E['ho-' + d2].value = m ? m[1] : ''; E['hc-' + d2].value = m ? m[2] : '';
    });
    var it = (d.items || []).slice(0, MAXI);
    nItems = Math.max(3, it.length); drawItems(it);
    var Lk = d.links || {}; ['place', 'kakao', 'google', 'home', 'insta', 'book'].forEach(function (k) { if (E['l-' + k]) E['l-' + k].value = Lk[k] || ''; });
    var B = d.biz || {}; ['owner', 'no', 'reg'].forEach(function (k) { if (E['b-' + k]) E['b-' + k].value = B[k] || ''; });
    dayState();
  }
  function dayState() { $$('.lc-day', tool).forEach(function (row) { var off = row.querySelector('input[type=checkbox]').checked; row.classList.toggle('off', off); $$('input[type=time]', row).forEach(function (t) { t.disabled = off; }); }); }

  /* ---------- 계산하고 그리기 ---------- */
  var S = null, SC = null, QS = null, FQ = null, tabNow = 'page', t0 = 0, tSave = 0, tLive = 0, lastHtml = '', lastSide = '', lastLive = '', dirty = false, CK = null;
  var live = $('#lcLive');
  function pageUrl(s) { return L.SITE + 'p/' + (s.slug || L.slug(s.name, s.area)) + '/'; }
  /* 광고 표현 점검에 보내는 문장(전화번호 · 링크는 뺌). 점검 뒤 문장이 바뀌면 점검 기록은 지움 */
  function checkText(s) {
    var fq = L.faq(s).list.slice(1).filter(function (x) { return !/어디에 있나요|예약은 어떻게|중개사무소 정보/.test(x.q); });
    return [L.intro(s)].concat(fq.map(function (x) { return x.a; }), s.items.map(function (x) { return x.n + (x.p ? ' ' + x.p : ''); }), [s.note]).filter(Boolean).join('\n')
      .replace(/https?:\/\/\S+/g, '').replace(/\(?\+?\d{2,4}[-\s]\d{3,4}[-\s]\d{4}\)?/g, '').slice(0, 5000);
  }
  function sig() { if (!S) return ''; var t = checkText(S), h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return S.ind + ':' + h; }
  function run() {
    S = L.normalize(read()); S.slug = L.slug(S.name, S.area);
    if (CK && CK.sig === sig()) S.check = { at: CK.at, hi: CK.hi, n: CK.n };   // 점검한 문장 그대로일 때만 기록이 따라감(가게 정보 파일 · 올리기 확인)
    SC = L.score(S); QS = L.questions(S); FQ = L.faq(S);
    paintSide(); paintSteps();
    if (!out.hidden) paintOut();
    if (dirty) { clearTimeout(tSave); tSave = setTimeout(function () { var d = read(); if (CK) d.check = CK; sset(d); }, 400); }
  }
  function gradeCls(t) { return t >= 90 ? 'a' : t >= 70 ? 'b' : t >= 40 ? 'c' : 'd'; }
  function paintSide() {
    var t = SC.total, okN = QS.filter(function (q) { return q.ok; }).length, tips = [];
    SC.parts.forEach(function (p) { p.tips.forEach(function (k) { if (tips.length < 6 && tips.indexOf(k) < 0) tips.push(k); }); });
    side.className = 'lc-side g-' + gradeCls(t);
    var html = '<div class="lc-sc"><div class="lc-ring" style="--p:' + t + '"><b>' + t + '</b><small>/ 100</small></div>' +
      '<div><p class="lc-k">AI 검색 준비도</p><p class="lc-grade">' + esc(SC.grade.t) + '</p><p class="lc-qn">손님이 AI에게 묻는 질문 <b>' + QS.length + '개 중 ' + okN + '개</b>에 답할 수 있어요</p></div></div>' +
      '<ul class="lc-parts">' + SC.parts.map(function (p) { return '<li><span>' + esc(p.name) + '</span><i style="--w:' + Math.round(100 * p.got / p.max) + '%"></i><b>' + p.got + '/' + p.max + '</b></li>'; }).join('') + '</ul>' +
      (tips.length ? '<div class="lc-fill"><p>이 칸을 채우면 점수가 오릅니다</p><div>' + tips.map(function (k) { return '<button type="button" class="lc-tip" data-go="' + esc(L.tipField(k)) + '">' + ICO.plus + esc(L.tipName(k)) + '</button>'; }).join('') + '</div></div>' : '<div class="lc-fill done"><p>' + ICO.check + '빈칸이 거의 없습니다. 이제 AI가 읽는 곳에 올릴 차례예요.</p></div>') +
      '<div class="lc-qs"><p class="lc-qh">손님이 AI에게 이렇게 묻습니다</p><ul>' + QS.map(function (q) {
        return '<li class="' + q.st + '"><span class="m" aria-hidden="true">' + (q.st === 'miss' ? ICO.x : q.st === 'no' ? ICO.minus : ICO.check) + '</span><span class="t"><b>' + esc(q.q) + '</b>' +
          (q.st === 'miss' ? '<small>빠진 정보: ' + q.miss.map(function (k) { return '<button type="button" class="lc-lk" data-go="' + esc(L.needField(k)) + '">' + esc(L.needName(k)) + '</button>'; }).join(', ') + '</small>' : q.st === 'no' ? '<small>정보가 있어 \'아니요\'로 정확히 답합니다</small>' : '<small>지금 정보로 답할 수 있음</small>') + '</span></li>';
      }).join('') + '</ul></div>' +
      '<div class="lc-cta"><a class="k-btn k-btn-p" href="#packages">' + (t >= 70 ? '이대로 AI 검색에 등록하기' : 'AI 검색 등록 맡기기') + ICO.arrow + '</a><button type="button" class="k-btn k-btn-l" data-show-out>만들어진 결과 보기</button></div>' +
      '<p class="lc-note">점수는 입력한 정보로 계산한 준비 상태이며, AI 답변에 나오는 것을 약속하지 않습니다. 입력한 내용은 이 브라우저 안에서만 계산합니다.</p>';
    /* 같은 내용이면 다시 그리지 않음: 칸을 떠날 때(change) 다시 그리면 누르려던 단추가 사라져 눌리지 않음 */
    if (html !== lastSide) { side.innerHTML = html; lastSide = html; }
    if (pill) { pill.hidden = false; pill.className = 'lc-pill g-' + gradeCls(t); pill.innerHTML = '<span>AI 검색 준비도</span><b>' + t + '점</b><span class="q">질문 ' + okN + '/' + QS.length + '</span>'; }
    /* 화면 낭독기에는 바뀐 점수만 짧게(패널 전체를 다시 읽지 않게) */
    var msg = 'AI 검색 준비도 ' + t + '점, 질문 ' + QS.length + '개 중 ' + okN + '개에 답할 수 있음';
    if (live && dirty && msg !== lastLive) { clearTimeout(tLive); tLive = setTimeout(function () { live.textContent = msg; lastLive = msg; }, 900); }
  }
  /* 단계마다 받은 점수(접힌 칸 머리에) */
  var STEP_PART = { s1: 'base', s2: 'hours', s3: 'items', s4: 'ask', s5: 'where', s6: 'trust' };
  function paintSteps() {
    Object.keys(STEP_PART).forEach(function (id) {
      var p = SC.parts.filter(function (x) { return x.k === STEP_PART[id]; })[0], el = $('#' + id + ' .lc-gain');
      if (!p || !el) return;
      var full = p.got >= p.max;
      el.className = 'lc-gain' + (full ? ' full' : p.got ? ' part' : '');
      el.innerHTML = full ? ICO.check + p.got + '/' + p.max : p.got ? p.got + '/' + p.max + '점' : '최대 +' + p.max + '점';
    });
  }

  /* ---------- 결과물 ---------- */
  var TABS = [['page', 'AI 가게 페이지'], ['faq', '손님 질문 · 답'], ['ld', '구조화 데이터'], ['llms', 'llms.txt'], ['robots', 'robots.txt'], ['same', '정보 맞춤 목록'], ['chk', '광고 표현 점검']];
  out.innerHTML = '<div class="lc-out-h"><div><p class="lc-k">자동으로 만든 결과</p><h3 class="k-h3">입력한 정보로 지금 바로 만들었습니다</h3></div>' +
    '<div class="lc-out-a"><button type="button" class="k-btn k-btn-l k-btn-s" data-file>가게 정보 파일 받기</button><button type="button" class="k-btn k-btn-q k-btn-s" data-reset>처음부터</button></div></div>' +
    '<div class="lc-tabs" role="tablist" aria-label="결과물">' + TABS.map(function (t, i) { return '<button type="button" role="tab" id="lt-' + t[0] + '" aria-controls="lp-' + t[0] + '" aria-selected="' + (i ? 'false' : 'true') + '"' + (i ? ' tabindex="-1"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>' +
    TABS.map(function (t, i) { return '<div class="lc-pane" role="tabpanel" id="lp-' + t[0] + '" aria-labelledby="lt-' + t[0] + '"' + (i ? ' hidden' : '') + '></div>'; }).join('');
  out.hidden = true;
  function code(id, text, file, note) {
    return (note ? '<p class="lc-pn">' + note + '</p>' : '') + '<pre class="lc-code" id="lc-' + id + '">' + esc(text) + '</pre><div class="lc-row-b"><button type="button" class="k-btn k-btn-p k-btn-s" data-cp="' + id + '"><span>복사</span></button>' +
      (file ? '<button type="button" class="k-btn k-btn-l k-btn-s" data-dl="' + id + '" data-name="' + esc(file) + '">파일로 받기</button>' : '') + '</div>';
  }
  var TX = {};
  function setPane(pane, html) { if (pane._h !== html) { pane._h = html; pane.innerHTML = html; } }   // 같은 내용이면 다시 그리지 않음(누르려던 단추 · 펼친 질문 유지)
  function paintOut() {
    var s = S, u = pageUrl(s), pane = $('#lp-' + tabNow);
    if (!pane) return;
    if (tabNow === 'page') {
      var html = L.page(s, { url: u, hosted: true, noindex: true });
      TX.page = L.page(s, { url: u, hosted: true });
      if (!pane.firstChild) pane.innerHTML = '<p class="lc-pn">이 화면 그대로 <b>' + esc(u.replace('https://', '')) + '</b> 같은 주소에 올리고, 구글 · 네이버 · 빙에 등록합니다. 홈페이지가 있으면 그곳에 올려도 됩니다.</p>' +
        '<div class="lc-frame"><div class="k-screen-bar"><i></i><i></i><i></i><span class="u"></span><em class="k-ex">미리보기</em></div><iframe title="AI 가게 페이지 미리보기" sandbox="allow-popups" loading="lazy"></iframe></div>' +
        '<div class="lc-row-b"><button type="button" class="k-btn k-btn-l k-btn-s" data-dl="page" data-name="ai-store-page.html">HTML 파일 받기</button><a class="k-btn k-btn-p k-btn-s" href="#packages">이 페이지로 등록 맡기기</a></div>';
      $('.u', pane).textContent = u.replace('https://', '');
      if (html !== lastHtml) { lastHtml = html; $('iframe', pane).srcdoc = html; }
    } else if (tabNow === 'faq') {
      TX.faq = FQ.list.map(function (x) { return 'Q. ' + x.q + '\nA. ' + x.a; }).join('\n\n');
      setPane(pane, '<p class="lc-pn">AI가 그대로 옮겨 쓰기 좋은 질문과 답입니다. 답은 입력한 사실로만 만들고, 정보가 없는 질문은 아래에 따로 모았습니다.</p>' +
        '<div class="lc-faq">' + FQ.list.map(function (x) { return '<details><summary>' + esc(x.q) + '</summary><p>' + esc(x.a) + '</p></details>'; }).join('') + '</div>' +
        (FQ.miss.length ? '<div class="lc-miss"><p><b>아직 답할 수 없는 질문 ' + FQ.miss.length + '개</b></p><ul>' + FQ.miss.map(function (m) { return '<li>' + esc(m.q) + ' <button type="button" class="lc-lk" data-go="' + esc(L.needField(m.need)) + '">' + esc(L.needName(m.need)) + ' 넣기</button></li>'; }).join('') + '</ul></div>' : '') +
        '<div class="lc-row-b"><button type="button" class="k-btn k-btn-p k-btn-s" data-cp="faq"><span>질문과 답 복사</span></button></div>');
    } else if (tabNow === 'ld') {
      TX.ld = '<script type="application/ld+json">\n' + JSON.stringify(L.jsonld(s, { url: s.links.home || u, hosted: !s.links.home }), null, 2) + '\n</script>';
      setPane(pane, code('ld', TX.ld, '', '업종에 맞는 schema.org 형식(' + esc([].concat(L.typeOf(s)).join(' · ')) + ')으로 이름 · 주소 · 영업시간 · 가격 · 편의 · 자주 묻는 질문을 담았습니다. 홈페이지가 있으면 &lt;head&gt; 안에 붙여 넣으세요.'));
    } else if (tabNow === 'llms') {
      TX.llms = L.llms(s, { url: s.links.home || u });
      setPane(pane, code('llms', TX.llms, 'llms.txt', 'AI에게 우리 가게를 한 번에 소개하는 안내 파일입니다. 홈페이지가 있으면 맨 위 주소(/llms.txt)에 올리세요.'));
    } else if (tabNow === 'robots') {
      TX.robots = L.robots();
      setPane(pane, code('robots', TX.robots, '', 'ChatGPT · Claude · Perplexity · 구글 · 빙 · 네이버의 검색용 크롤러가 들어올 수 있게 하는 규칙입니다. 이미 robots.txt가 있으면 이 줄들을 더하세요.'));
    } else if (tabNow === 'same') {
      setPane(pane, '<p class="lc-pn">AI는 여러 곳의 정보를 맞춰 봅니다. 아래 곳들의 이름 · 주소 · 전화 · 시간이 같아야 믿고 답합니다.</p><ol class="lc-same">' + L.checklist(s).map(function (c) {
        return '<li class="' + (c.done ? 'done' : '') + '"><div><b>' + esc(c.t) + '</b>' + (c.done ? '<span class="ok">' + ICO.check + '연결함</span>' : '') + '</div><p>' + esc(c.d) + '</p>' +
          (c.same.length ? '<ul>' + c.same.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + (c.href ? '<a class="k-a" href="' + esc(c.href) + '" target="_blank" rel="noopener">열기' + ICO.arrow + '</a>' : '') + '</li>';
      }).join('') + '</ol>');
    } else if (tabNow === 'chk') {
      if (!pane.firstChild) pane.innerHTML = '<p class="lc-pn">소개 문장과 질문의 답, 사장님이 적은 말에 업종 광고 규칙(' + esc(L.IND[s.ind].med ? '의료' : L.IND[s.ind].chk === 'food' ? '식품' : L.IND[s.ind].chk === 'cos' ? '뷰티' : '일반') + ')에 걸릴 만한 표현이 있는지 AIMarker 검수 엔진으로 봅니다. 문구는 점검할 때만 보내고 저장하지 않습니다.</p>' +
        '<div class="lc-row-b"><button type="button" class="k-btn k-btn-p k-btn-s" data-chk>광고 표현 점검하기</button></div><div class="lc-chk" aria-live="polite"></div>';
    }
  }
  function showOut(tab) {
    out.hidden = false;
    if (tab) selTab(tab);
    paintOut();
  }
  function selTab(id) {
    tabNow = id;
    $$('[role=tab]', out).forEach(function (b) { var on = b.id === 'lt-' + id; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    $$('.lc-pane', out).forEach(function (p) { p.hidden = p.id !== 'lp-' + id; });
    paintOut();
  }

  /* 광고 표현 점검(서버 am.check). 사장님이 적은 말에서 나온 후보는 그 칸에서 바로 바꿈 */
  function runCheck(btn) {
    var s = S, I = L.IND[s.ind], box = $('#lp-chk .lc-chk'), text = checkText(s), mySig = sig();
    if (!AM.call) { box.innerHTML = '<p class="lc-pn">지금은 점검할 수 없어요.</p>'; return; }
    btn.disabled = true; btn.textContent = '점검하는 중…';
    box.innerHTML = '<p class="lc-pn"><span class="spin" aria-hidden="true"></span> 업종 규칙으로 점검하는 중…</p>';
    AM.call('am.check', { text: text, ind: I.chk, flags: {}, cid: cid() }, 25000).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.message) || '');
      var fs = (r.findings || []).filter(function (f) { return f.lv >= 2 && f.t; });
      CK = { sig: mySig, at: today(), hi: fs.filter(function (f) { return f.lv >= 3; }).length, n: fs.length }; dirty = true; run();
      if (!fs.length) { box.innerHTML = '<div class="lc-chk-ok">' + ICO.check + '<div><b>큰 위험 후보가 없어요</b><p>그래도 의료 · 가격 · 효과 표현은 한 번 더 확인하세요. 법률 자문은 아닙니다.</p></div></div>'; return; }
      box.innerHTML = '<p class="lc-pn"><b>살펴볼 표현 ' + fs.length + '개</b> · 위험 후보와 근거입니다(법률 자문은 아닙니다).</p><ul class="lc-fd">' + fs.slice(0, 8).map(function (f, i) {
        var rep = (f.reps || []).filter(function (x) { return x && x !== '(삭제)'; })[0], where = locate(f.t);
        return '<li class="lv' + f.lv + '"><div><span class="sv">' + (f.lv >= 3 ? '높음' : '주의') + '</span><q>' + esc(f.t) + '</q></div><p>' + esc(f.why || '') + '</p>' +
          (where ? '<p class="fx">' + esc(where.label) + '에 있는 표현입니다. ' + (rep ? '<button type="button" class="lc-lk" data-rep="' + i + '">\'' + esc(rep.trim()) + '\'로 바꾸기</button>' : '<button type="button" class="lc-lk" data-go="' + esc(where.id) + '">그 칸으로 가기</button>') + '</p>' : '') + '</li>';
      }).join('') + '</ul>';
      box._fs = fs;
    }).catch(function () {
      box.innerHTML = '<p class="lc-pn">지금은 점검하지 못했어요. 인터넷 연결을 확인하고 잠시 뒤 다시 눌러 주세요.</p>';
    }).then(function () { btn.disabled = false; btn.textContent = '다시 점검하기'; });
  }
  function locate(t) {
    var E = form.elements, cand = [['about', '사장님 한 줄 소개'], ['note', '참고 · 안 되는 것'], ['addr2', '찾아오는 길'], ['off', '쉬는 날 안내'], ['fee', '교습비']];
    for (var i = 0; i < nItems; i++) cand.push(['itn-' + i, (i + 1) + '번째 서비스 이름'], ['itp-' + i, (i + 1) + '번째 가격']);
    for (var j = 0; j < cand.length; j++) { var el = E[cand[j][0]]; if (el && el.value && el.value.indexOf(t) >= 0) return { id: el.id, el: el, label: cand[j][1] }; }
    return null;
  }

  /* ---------- 칸으로 가기(접힌 단계는 펼침) ---------- */
  function go(id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (/^h-/.test(id) && (el.disabled || el.value)) {
      var empty = DAYS.filter(function (d) { var E = form.elements; return !E['hx-' + d].checked && !(E['ho-' + d].value && E['hc-' + d].value); })[0];
      el = document.getElementById('h-' + (empty || 'mon'));
      if (el.disabled) el = el.closest('.lc-day').querySelector('input[type=checkbox]');
    }
    var st = el.closest('details'); if (st && !st.open) st.open = true;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { el.scrollIntoView(); }
    setTimeout(function () { try { el.focus({ preventScroll: true }); } catch (e2) { el.focus(); } }, 350);
  }

  /* ---------- 이벤트 ---------- */
  form.addEventListener('input', function () { dirty = true; clearTimeout(t0); t0 = setTimeout(run, 160); });
  form.addEventListener('change', function (e) {
    dirty = true;
    if (e.target === selInd) setInd(selInd.value);
    if (e.target.name && /^hx-/.test(e.target.name)) dayState();
    run();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); run(); showOut('page'); out.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  tool.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-copyday]'))) {
      var E = form.elements, o = E['ho-mon'].value, c = E['hc-mon'].value, off = E['hx-mon'].checked, ds = b.getAttribute('data-copyday') === 'all' ? ['tue', 'wed', 'thu', 'fri', 'sat', 'sun'] : ['tue', 'wed', 'thu', 'fri'];
      if (!o && !off) { go('h-mon'); return; }
      ds.forEach(function (d) { E['ho-' + d].value = o; E['hc-' + d].value = c; E['hx-' + d].checked = off; });
      dayState(); run(); return;
    }
    if ((b = e.target.closest('[data-additem]'))) { var keep = readItems(true); nItems = Math.min(MAXI, nItems + 1); drawItems(keep); go('it-n' + (nItems - 1)); run(); return; }
    if ((b = e.target.closest('[data-rm]'))) { var k2 = readItems(true); k2.splice(+b.getAttribute('data-rm'), 1); nItems = Math.max(3, nItems - 1); drawItems(k2); run(); return; }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (b && (tool.contains(b) || side.contains(b) || out.contains(b))) { e.preventDefault(); go(b.getAttribute('data-go')); return; }
    if (e.target.closest('[data-show-out]')) { showOut(); out.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (!out.contains(e.target)) return;
    if ((b = e.target.closest('[role=tab]'))) { selTab(b.id.slice(3)); return; }
    if ((b = e.target.closest('[data-cp]'))) { copy(TX[b.getAttribute('data-cp')] || '', b); return; }
    if ((b = e.target.closest('[data-dl]'))) { var k = b.getAttribute('data-dl'); if (k === 'page') TX.page = L.page(S, { url: '', hosted: false }); save(TX[k] || '', b.getAttribute('data-name'), k === 'page' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8'); return; }
    if (e.target.closest('[data-file]')) { save(L.fileOf(S), 'aimarker-store-' + (S.slug || 'store') + '.json', 'application/json'); return; }
    if (e.target.closest('[data-reset]')) { if (window.confirm && !window.confirm('입력한 내용을 모두 지울까요?')) return; sdel(); dirty = false; CK = null; form.reset(); nItems = 3; drawItems([]); setInd(preset || 'nail', []); dayState(); run(); go('f-name'); return; }
    if ((b = e.target.closest('[data-chk]'))) { runCheck(b); return; }
    if ((b = e.target.closest('[data-rep]'))) {
      var box = $('#lp-chk .lc-chk'), f = box && box._fs && box._fs[+b.getAttribute('data-rep')];
      if (!f) return;
      var w = locate(f.t), rep = (f.reps || []).filter(function (x) { return x && x !== '(삭제)'; })[0];
      if (w && rep) { w.el.value = w.el.value.split(f.t).join(rep.trim()); dirty = true; run(); b.closest('li').classList.add('fixed'); b.outerHTML = '<span class="ok">' + ICO.check + '바꿨어요</span>'; }
    }
  });
  out.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('[role=tab]');
    if (!t || ['ArrowRight', 'ArrowLeft', 'Home', 'End'].indexOf(e.key) < 0) return;
    var all = $$('[role=tab]', out), i = all.indexOf(t), n = e.key === 'Home' ? all[0] : e.key === 'End' ? all[all.length - 1] : all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
    e.preventDefault(); n.focus(); selTab(n.id.slice(3));
  });

  /* ---------- 시작: 주소 → 저장해 둔 것 → 업종 기본 ---------- */
  function start(d) {
    dirty = true;
    var cur = read();
    fill({ ind: d.ind || cur.ind || preset, name: d.name || cur.name, area: d.area || cur.area, addr: cur.addr, addr2: cur.addr2, tel: cur.tel, hours: cur.hours, items: cur.items, feat: cur.feat, links: cur.links, biz: cur.biz, about: cur.about, note: cur.note });
    run();
    var target = document.getElementById('tool') || tool;
    try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { target.scrollIntoView(); }
    setTimeout(function () { go(form.elements.namedItem('name').value ? 'f-addr' : 'f-name'); }, 500);
  }
  window.AMLocalTool = { start: start };
  var q = new URLSearchParams(location.search), qd = { ind: q.get('ind') || '', name: (q.get('name') || '').slice(0, 60), area: (q.get('area') || '').slice(0, 30) };
  if (qd.ind && !indOf(qd.ind)) qd.ind = '';
  if (preset && !indOf(preset)) preset = '';
  var saved = sget(preset || qd.ind || '');
  nItems = 3; drawItems([]);
  if (saved) { fill(saved); if (saved.check && saved.check.sig) CK = saved.check; } else setInd(preset || qd.ind || 'nail', []);
  if (qd.ind || qd.name || qd.area) { dirty = true; fill(Object.assign({}, saved || {}, { ind: qd.ind || (saved && saved.ind) || preset || 'nail' }, qd.name ? { name: qd.name } : {}, qd.area ? { area: qd.area } : {})); }
  dayState(); run();
  if (qd.name) setTimeout(function () { go('f-addr'); }, 600);
})();
