/* AIMarker 가게 AI 검색 등록 화면(13.9, 2026.10.27 · 13.9b 30초 진단 창)
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

  /* 자세한 진단(AI 가게 페이지 만들기)으로: 같은 페이지에 도구가 있으면 그 자리에서, 없으면 /local/ 로 */
  function toTool(d) {
    if (window.AMLocalTool) { window.AMLocalTool.start(d); return; }
    var q = [];
    Object.keys(d).forEach(function (k) { if (d[k] && /^(ind|name|area)$/.test(k)) q.push(k + '=' + encodeURIComponent(d[k])); });
    location.href = root + 'local/' + (q.length ? '?' + q.join('&') : '') + '#tool';
  }

  /* ---------- 30초 AI 검색 진단(13.9b) ----------
     질문 5~7개를 누르면, 지금 AI가 우리 가게를 소개할 근거가 있는지 바로 보여 줍니다(빈틈은 빨갛게, 크게).
     결과는 사장님이 답한 내용으로만 계산합니다. 실제 AI 답변을 조회하거나 꾸며 내지 않고, 이 브라우저 밖으로 보내지 않습니다. */
  var LQ = (function () {
    var box = null, lastFocus = null, D = null, A = {}, path = [], busy = 0;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var NQ = { restaurant: '식당' };
    function I() { return has(L.IND, D.ind) ? L.IND[D.ind] : L.IND.shop; }
    function n() { return NQ[D.ind] || I().n; }
    function we() { return '우리 ' + n(); }
    function nm() { return D.name || we(); }
    /* 업종마다 손님이 꼭 묻는 것(질문 문구 · 빈틈 · 예시 답변에 씀) */
    function word(k) {
      var I0 = I(), med = !!I0.med, it = String(I0.itemsT || '대표 서비스').split(' · ')[0].replace(/와 가격$/, '');
      var M = { sun: med ? '일요일 진료' : '일요일 영업', sat: med ? '토요일 진료' : '토요일 영업', night: med ? '야간 진료' : '늦은 시간 영업', early: '아침 일찍 여는지', items: it, price: '가격', fee: '교습비',
        hours: I0.hw, book: '예약 방법', reserve: '예약', addr: '위치', base: '기본 정보', name: '기본 정보', reg: '등록번호', area2: '일하는 지역', checkin: '체크인 시간', tel: '연락처',
        consult: '상담 방법', estimate: '견적', warranty: 'A/S', bbq: '바비큐', wifi: '콘센트 · 와이파이', pet: '반려동물 동반', group: '단체석', solo: '1인샵', auto: '자동차보험 진료', emergency: '응급 진료', shuttle: '차량 운행', trial: '체험 수업', online: '비대면 상담', parking: '주차' };
      return M[k] || (L.FEAT[k] ? L.FEAT[k].t.split(' · ')[0] : '필요한 정보');
    }
    function keyFacts() {
      var out = [];
      (I().key || []).forEach(function (k) { var w = word(k); if (k !== 'hours' && out.indexOf(w) < 0 && out.length < 3) out.push(w); });
      return out.join(' · ');
    }
    /* 질문(홈페이지가 없으면 홈페이지 질문 둘은 건너뜀) */
    function QS() {
      var q = [{ k: 'web', t: L.jo(we(), '은', '는') + ' 홈페이지가 있나요?', h: '네이버 플레이스 · 인스타그램 · 블로그는 빼고 생각해 주세요.', o: [['yes', '있어요'], ['none', '없어요(플레이스 · SNS만)']] }];
      if (A.web === 'yes') {
        q.push({ k: 'text', t: "홈페이지에 " + I().hw + " · 가격이 '글자로' 적혀 있나요?", h: '사진 속 글자는 AI가 잘 읽지 못합니다.', o: [['text', '글자로 적혀 있어요'], ['img', '사진 · 이미지로만 있어요'], ['unk', '잘 모르겠어요']] });
        q.push({ k: 'sd', t: '홈페이지에 AI가 읽는 구조화 데이터(schema.org)가 들어 있나요?', h: '검색 엔진과 AI가 이름 · 주소 · 영업시간 · 가격을 기계로 정확히 읽는 형식입니다.', o: [['yes', '들어 있어요'], ['no', '없어요'], ['unk', '그게 뭔지 모르겠어요']] });
      }
      q.push({ k: 'gbp', t: '구글 지도(구글 비즈니스 프로필)에 ' + L.jo(we(), '을', '를') + ' 직접 등록했나요?', h: 'ChatGPT · 제미나이는 주로 구글 · 빙에 올라온 정보를 읽습니다.', o: [['yes', '등록했어요'], ['no', '안 했어요'], ['unk', '모르겠어요']] });
      q.push({ k: 'nap', t: '네이버 · 카카오 · 구글에 적힌 ' + I().hw + '과 전화번호가 모두 같나요?', h: '서로 다르면 AI가 옛 시간이나 틀린 번호를 말할 수 있습니다.', o: [['same', '모두 같아요'], ['diff', '다른 곳이 있어요'], ['unk', '확인해 본 적 없어요']] });
      q.push({ k: 'facts', t: '손님이 자주 묻는 것(' + keyFacts() + ')이 인터넷에 글로 정리돼 있나요?', h: "손님은 AI에게 '" + (I().med ? '일요일에 진료해?' : '주차 돼?') + "'처럼 아주 구체적으로 묻습니다.", o: [['all', '다 있어요'], ['some', '일부만 있어요'], ['few', '거의 없어요']] });
      q.push({ k: 'ai', t: '최근에 ChatGPT나 네이버 AI에 ' + L.jo(we(), '을', '를') + ' 물어본 적 있나요?', h: '손님은 이미 묻고 있습니다. 마지막으로 확인한 때를 떠올려 보세요.', o: [['ok', '물어봤고 정확했어요'], ['bad', '틀리거나 안 나왔어요'], ['never', '물어본 적 없어요']] });
      return q;
    }
    /* 점수: 답한 내용마다 정해진 점수(합 100). 모르는 것은 '확인되지 않음'으로 셈 */
    var W = { text: { text: 20, img: 8, unk: 6 }, sd: { yes: 20, no: 0, unk: 0 }, gbp: { yes: 15, no: 0, unk: 4 }, nap: { same: 15, diff: 3, unk: 3 }, facts: { all: 15, some: 6, few: 0 }, ai: { ok: 15, bad: 0, never: 0 } };
    function score() { var t = 0; Object.keys(W).forEach(function (k) { if (A.web === 'none' && (k === 'text' || k === 'sd')) return; if (has(W[k], A[k])) t += W[k][A[k]]; }); return Math.max(0, Math.min(100, t)); }
    function web() { return A.web === 'yes' ? (A.text || 'unk') : 'none'; }
    /* 손님 질문마다 AI가 답할 근거: 2 있음 · 1 틀리거나 빠질 수 있음 · 0 없음 */
    function lvl(k) {
      var w = web(), sd = A.web === 'yes' && A.sd === 'yes', g = A.gbp, f = A.facts;
      if (/^(base|name|addr)$/.test(k)) return (g === 'yes' || w === 'text' || sd) ? 2 : (g === 'unk' || w === 'img' || w === 'unk') ? 1 : 0;
      if (/^(hours|sun|sat|night|early)$/.test(k)) return ((g === 'yes' && A.nap === 'same') || sd || (w === 'text' && f !== 'few')) ? 2 : (g === 'yes' || w === 'text' || w === 'img') ? 1 : 0;
      if (/^(items|price|fee|checkin|area2|reg)$/.test(k)) return ((w === 'text' && f === 'all') || (sd && f !== 'few')) ? 2 : (w === 'text' || w === 'img' || f === 'all') ? 1 : 0;
      return (f === 'all' && (w === 'text' || sd || g === 'yes')) ? 2 : f !== 'few' ? 1 : 0;
    }
    function cover() {
      return L.questions(L.normalize({ ind: D.ind, name: D.name, area: D.area })).map(function (q) { return { q: q.q, need: q.need, v: Math.min.apply(null, q.need.map(lvl)) }; });
    }
    /* 빈틈: [2 큰 빈틈 · 1 확인 필요, 제목, 무슨 일이 생기는지] */
    function gaps() {
      var G = [], w = web(), nn = n();
      if (w === 'none') G.push([2, L.jo(we(), '을', '를') + ' 소개하는 공식 페이지가 없습니다', 'ChatGPT · 제미나이는 주로 구글 · 빙에 올라온 페이지를 읽습니다. 플레이스 · 인스타그램만으로는 ' + I().hw + ' · 가격 같은 사실이 AI에게 잘 전달되지 않습니다.']);
      else if (w === 'img') G.push([2, I().hw + ' · 가격이 사진 속에만 있습니다', "사진 속 글자는 AI가 잘 읽지 못합니다. AI가 '얼마야?'에 답하지 못하는 가장 흔한 까닭입니다."]);
      else if (w === 'unk') G.push([1, '홈페이지에 무엇이 글로 적혀 있는지 확인되지 않습니다', '사진만 있고 글이 없으면 AI가 읽을 것이 없습니다.']);
      if (!(A.web === 'yes' && A.sd === 'yes')) G.push([2, 'AI가 읽는 형식(구조화 데이터)이 ' + (A.web === 'yes' && A.sd === 'unk' ? '확인되지 않습니다' : '없습니다'), '사람이 보는 글과 따로, 기계가 이름 · 주소 · ' + I().hw + ' · 가격을 정확히 읽는 schema.org 형식이 있어야 AI가 헷갈리지 않습니다.']);
      if (A.gbp === 'no') G.push([2, '구글 지도에 ' + L.jo(we(), '이', '가') + ' 없습니다', '제미나이와 구글 AI 답변은 구글 지도 정보를 많이 씁니다. 여기에 없으면 답에서 빠지기 쉽습니다.']);
      else if (A.gbp === 'unk') G.push([1, '구글 지도 등록이 확인되지 않습니다', '구글이 자동으로 만든 옛 정보가 그대로 남아 있을 수 있습니다.']);
      if (A.nap === 'diff') G.push([2, '곳마다 ' + I().hw + ' · 전화번호가 다릅니다', 'AI는 여러 곳의 정보를 맞춰 봅니다. 서로 다르면 옛 시간이나 틀린 번호를 그대로 말할 수 있습니다.']);
      else if (A.nap === 'unk') G.push([1, '정보가 서로 같은지 확인한 적이 없습니다', '한 곳만 고치고 다른 곳은 그대로인 경우가 가장 흔합니다.']);
      if (A.facts === 'few') G.push([2, '손님이 묻는 것(' + keyFacts() + ')에 답할 글이 없습니다', '답할 근거가 없으면 AI는 그 질문에 답할 수 있는 다른 ' + L.jo(nn, '을', '를') + ' 권할 수 있습니다.']);
      else if (A.facts === 'some') G.push([1, '손님이 묻는 것이 일부만 정리돼 있습니다', '빠진 질문에서는 답할 수 있는 다른 ' + L.jo(nn, '이', '가') + ' 먼저 나올 수 있습니다.']);
      if (A.ai === 'bad') G.push([2, 'AI가 ' + L.jo(we(), '을', '를') + ' 틀리게 말하거나 빠뜨리고 있습니다', '사장님이 직접 확인한 신호입니다. 근거가 되는 페이지를 올리고 곳곳의 정보를 맞춰야 바뀝니다.']);
      else if (A.ai === 'never') G.push([1, 'AI가 ' + L.jo(we(), '을', '를') + ' 어떻게 소개하는지 아무도 확인하지 않았습니다', '손님은 이미 묻고 있습니다. 1년 관리에서는 같은 질문을 매달 AI에게 물어 기록해 드립니다.']);
      return G.sort(function (a, b) { return b[0] - a[0]; });
    }
    /* 정보가 비어 있을 때 AI 답변 예시(실제 답변이 아님을 함께 밝힘) */
    function chat(C) {
      var pick = null, nn = n();
      C.forEach(function (c) { if (!pick && c.v < 2 && c.need[0] === 'base' && c.need[1] && c.need[1] !== 'items') pick = c; });
      if (!pick) C.forEach(function (c) { if (!pick && c.v < 2 && c.need[0] === 'base') pick = c; });
      if (!pick) return '';
      var w = word(pick.need[1] || 'base'), q = pick.q + (/[?줘]$/.test(pick.q) ? '' : ' 있어?');
      return '<div class="lq-chat"><p class="lq-chat-h"><b>정보가 비어 있으면, AI 답은 이렇게 됩니다</b><em>예시 화면 · 실제 AI 답변이 아님</em></p>' +
        '<p class="lc-q"><span>손님</span><b>' + esc(q) + '</b></p>' +
        '<div class="lc-a"><p class="lc-a-t"><b>AI</b><span>' + esc(L.jo(w, '을', '를')) + ' 확인할 수 있는 곳으로 이런 곳이 있어요.</span></p>' +
        '<div class="lq-cs"><div class="lq-c ok"><b>A ' + esc(nn) + '</b><span>' + esc(w) + ' 정보 있음 · 출처 가게 페이지</span></div>' +
        '<div class="lq-c ok"><b>B ' + esc(nn) + '</b><span>' + esc(w) + ' 정보 있음 · 출처 구글 지도</span></div>' +
        '<div class="lq-c no"><b>' + esc(nm()) + '</b><span>' + esc(w) + ' 정보를 찾지 못해 답에서 빠짐</span></div></div></div>' +
        '<p class="lq-chat-f">1년 관리에서는 이런 질문을 매달 실제 AI에게 물어, 우리 가게가 나오는지 기록해 드립니다.</p></div>';
    }
    function track(ev, p) { try { if (window.gtag) window.gtag('event', ev, p || {}); } catch (e) { /* 무시 */ } }

    function frame() {
      box = document.createElement('div');
      box.className = 'lq';
      box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'lqT');
      box.innerHTML = '<div class="lq-in"><div class="lq-top"><p class="lq-k"><span class="dot" aria-hidden="true"></span>30초 AI 검색 진단<span class="lq-ind"></span></p><button type="button" class="lq-x" aria-label="진단 닫기">' + ICO.x + '</button>' +
        '<div class="lq-bar" role="progressbar" aria-label="진행" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div><div class="lq-body" tabindex="-1"></div>' +
        '<div class="lq-foot" hidden><button type="button" class="k-btn k-btn-p" data-buy="local-year"><span>빈틈 메우기 · 등록 + 1년 관리</span><b>2,900토큰</b></button></div></div>';
      document.body.appendChild(box);
      box.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey, true);
    }
    function body() { return box.querySelector('.lq-body'); }
    function bar(p) { var b = box.querySelector('.lq-bar'); b.setAttribute('aria-valuenow', String(Math.round(p))); b.firstChild.style.width = p + '%'; }
    function step() {
      var Q = QS(), i = 0;
      while (i < Q.length && has(A, Q[i].k)) i++;
      if (i >= Q.length) { calc(); return; }
      var q = Q[i];
      foot(false);
      bar(100 * i / (Q.length + 1));
      body().innerHTML = '<p class="lq-n">질문 ' + (i + 1) + '</p><h2 class="lq-q" id="lqT">' + esc(q.t) + '</h2><p class="lq-h">' + esc(q.h) + '</p>' +
        '<div class="lq-o">' + q.o.map(function (o, j) { return '<button type="button" data-a="' + esc(q.k) + '" data-v="' + esc(o[0]) + '"><span class="no" aria-hidden="true">' + (j + 1) + '</span>' + esc(o[1]) + ICO.arrow + '</button>'; }).join('') + '</div>' +
        (path.length ? '<button type="button" class="lq-back" data-back>이전 질문</button>' : '');
      var first = body().querySelector('.lq-o button'); if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 30);
    }
    /* 결과 화면 아래 고정 단추: 본문의 결제 칸이 보이면 숨김 */
    var io = null;
    function foot(on) {
      var f = box && box.querySelector('.lq-foot');
      if (io) { io.disconnect(); io = null; }
      if (!f) return;
      f.hidden = !on; f.classList.remove('off');
      if (!on) return;
      var cta = box.querySelector('.lq-cta');
      if (cta && window.IntersectionObserver) { io = new IntersectionObserver(function (es) { es.forEach(function (x) { f.classList.toggle('off', x.isIntersecting); }); }, { root: body(), threshold: .15 }); io.observe(cta); }
    }
    function calc() {
      foot(false);
      bar(96);
      body().innerHTML = '<div class="lq-wait"><span class="spin" aria-hidden="true"></span><p id="lqT">답한 내용으로 계산하는 중…</p><small>손님이 AI에게 묻는 질문마다 답할 근거가 있는지 맞춰 봅니다</small></div>';
      clearTimeout(busy); busy = setTimeout(result, reduce ? 50 : 900);
    }
    function result() {
      var t = score(), C = cover(), G = gaps(), okN = C.filter(function (c) { return c.v === 2; }).length, big = G.filter(function (g) { return g[0] === 2; }).length, nn = n();
      var gk = t >= 90 ? 'a' : t >= 70 ? 'b' : t >= 40 ? 'c' : 'd', lab = { a: '양호', b: '보통', c: '주의', d: '위험' }[gk];
      var head = gk === 'd' ? L.jo(nm(), '은', '는') + ' 지금 AI가 소개할 근거가 거의 없습니다' :
        gk === 'c' ? L.jo(nm(), '이', '가') + ' AI 답에서 빠지거나 틀리게 나올 빈틈이 ' + G.length + '개 있습니다' :
        gk === 'b' ? '빈틈 ' + G.length + '개만 메우면 AI가 읽을 준비가 끝납니다' : '잘 갖춰져 있습니다. 이제 지키는 일이 남았습니다';
      var sub = gk === 'a' ? '정보는 계속 바뀝니다. 매달 AI 답변을 확인해 틀린 곳이 생기기 전에 고치세요.' :
        '손님이 AI에게 묻는 질문 ' + C.length + '개 가운데, AI가 확실히 답할 근거가 있는 질문은 <b>' + okN + '개</b>입니다. 나머지 질문에서는 답할 수 있는 다른 ' + esc(L.jo(nn, '이', '가')) + ' 먼저 나올 수 있습니다.';
      bar(100);
      track('local_quick_result', { score: t, grade: gk, ind: D.ind });
      var cnt = function (v) { return C.filter(function (c) { return c.v === v; }).length; };
      body().innerHTML =
        '<section class="lq-r g-' + gk + '"><div class="lq-rh"><div class="lq-ring" style="--p:' + t + '"><b data-n="' + t + '">' + (reduce ? t : 0) + '</b><small>/ 100</small></div>' +
        '<div><p class="lq-lv"><span>' + lab + '</span>지금 AI 검색 준비 상태</p><h2 class="lq-t" id="lqT">' + esc(head) + '</h2></div></div>' +
        '<p class="lq-s">' + sub + '</p>' +
        '<div class="lq-cells" aria-hidden="true">' + C.map(function (c) { return '<i class="v' + c.v + '"></i>'; }).join('') + '</div>' +
        '<p class="lq-leg"><span class="v2">답할 근거 있음 ' + okN + '</span><span class="v1">틀리거나 빠질 수 있음 ' + cnt(1) + '</span><span class="v0">근거 없음 ' + cnt(0) + '</span></p>' +
        '<p class="lq-why">10~50대의 54.5%가 최근 3개월 안에 ChatGPT를 사용했습니다. 손님은 지금도 AI에게 묻고 있습니다.<cite>오픈서베이 조사 · 2025.12</cite></p></section>' +
        chat(C) +
        (G.length ? '<section class="lq-g"><h3>지금 AI가 확인하지 못하는 것 <b>' + G.length + '개</b>' + (big ? '<em>큰 빈틈 ' + big + '</em>' : '') + '</h3><ol>' +
          G.map(function (g) { return '<li class="lv' + g[0] + '"><span class="m" aria-hidden="true">' + (g[0] === 2 ? ICO.x : '!') + '</span><div><b>' + esc(g[1]) + '</b><p>' + esc(g[2]) + '</p></div></li>'; }).join('') + '</ol></section>' : '') +
        '<section class="lq-cta"><h3>' + (gk === 'a' ? '1년 관리로 지키세요' : '이 빈틈, 영업일 하루 안에 메워 드립니다') + '</h3>' +
        '<p>AI가 읽는 가게 페이지와 구조화 데이터를 만들어 구글 · 네이버 · 빙에 등록하고, 지도 정보를 같게 맞춥니다. 홈페이지가 없어도 되고, 사장님은 가게 정보만 한 번 보내 주시면 됩니다.</p>' +
        '<div class="lq-btns"><button type="button" class="k-btn k-btn-p k-btn-lg" data-buy="local-year">등록 + 1년 관리 · 2,900토큰<em>추천</em></button>' +
        '<button type="button" class="k-btn k-btn-l k-btn-lg" data-buy="local-basic">등록만 · 990토큰</button></div>' +
        '<p class="lq-fine">1토큰 100원 · 부가세 별도 · 가게 페이지를 올리기 전에는 결제일부터 7일 안에 전액 환불</p>' +
        '<p class="lq-twa twa-only">앱에서는 신청과 결제를 받지 않습니다. 먼저 무료로 AI 가게 페이지를 만들어 보세요.</p>' +
        '<p class="lq-more"><button type="button" class="k-a" data-detail>먼저 무료로 AI 가게 페이지 만들어 보기' + ICO.arrow + '</button><button type="button" class="k-a" data-again>다시 진단하기</button></p></section>' +
        '<section class="lq-qs"><h3>손님이 AI에게 묻는 질문 ' + C.length + '개</h3><ul>' + C.map(function (c) {
          return '<li class="v' + c.v + '"><span class="m" aria-hidden="true">' + (c.v === 2 ? ICO.check : c.v === 1 ? '!' : ICO.x) + '</span><span>' + esc(c.q) + '<small>' + (c.v === 2 ? '답할 근거 있음' : c.v === 1 ? '틀리거나 빠질 수 있음' : '근거 없음 · ' + esc(word(c.need[c.need.length - 1]))) + '</small></span></li>';
        }).join('') + '</ul></section>' +
        '<p class="lq-note">사장님이 답한 내용으로 계산한 결과이며, 실제 AI 답변을 조회한 것이 아닙니다. AI 답변에 나오는지와 순위는 약속하지 않습니다. 답한 내용은 서버로 보내지 않습니다.</p>';
      var b = body(); b.scrollTop = 0;
      foot(true);
      try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); }
      var el = b.querySelector('.lq-ring b');
      if (!reduce && el) { var t0 = performance.now(); (function tick(now) { var p = Math.min(1, (now - t0) / 700); el.textContent = String(Math.round(t * (1 - Math.pow(1 - p, 3)))); if (p < 1 && box) requestAnimationFrame(tick); })(t0); }
    }
    function onClick(e) {
      var b;
      if (e.target === box || e.target.closest('.lq-x')) { close(); return; }
      if ((b = e.target.closest('[data-a]'))) { A[b.getAttribute('data-a')] = b.getAttribute('data-v'); path.push(b.getAttribute('data-a')); if (A.web === 'none') { delete A.text; delete A.sd; } step(); return; }
      if (e.target.closest('[data-back]')) { var k = path.pop(); if (k) delete A[k]; step(); return; }
      if (e.target.closest('[data-again]')) { A = {}; path = []; track('local_quick_again'); step(); return; }
      if (e.target.closest('[data-detail]')) { var d = { ind: D.ind, name: D.name, area: D.area }; close(); toTool(d); return; }
      /* [data-buy] 는 결제 시트(order.js)가 받아 이 창 위에 엽니다 */
    }
    function onKey(e) {
      if (!box) return;
      if (e.key === 'Escape') { if (document.querySelector('.k-buy')) return; e.preventDefault(); close(); return; }
      if (/^[1-3]$/.test(e.key) && !document.querySelector('.k-buy')) { var o = box.querySelectorAll('.lq-o button')[+e.key - 1]; if (o) { e.preventDefault(); o.click(); } return; }
      if (e.key !== 'Tab' || document.querySelector('.k-buy')) return;
      var fs = Array.prototype.filter.call(box.querySelectorAll('button, a[href]'), function (x) { return x.offsetParent !== null; });
      if (!fs.length) return;
      var first = fs[0], last = fs[fs.length - 1];
      if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    function open(d) {
      d = d || {};
      D = { ind: has(L.IND, d.ind) ? d.ind : (has(L.IND, d.def) ? d.def : 'shop'), name: String(d.name || '').trim().slice(0, 60), area: String(d.area || '').trim().slice(0, 30) };
      A = {}; path = [];
      lastFocus = document.activeElement;
      if (!box) frame();
      box.querySelector('.lq-ind').textContent = ' · ' + I().t;
      document.documentElement.classList.add('lq-on');
      track('local_quick_start', { ind: D.ind });
      step();
    }
    function close() {
      if (!box) return;
      clearTimeout(busy);
      if (io) { io.disconnect(); io = null; }
      document.removeEventListener('keydown', onKey, true);
      box.remove(); box = null;
      document.documentElement.classList.remove('lq-on');
      if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }
    return { open: open, close: close };
  })();
  window.AMLocalQuick = LQ;

  /* ---------- 첫 화면 · 다른 페이지의 '빠른 시작' 양식: 업종 · 이름 · 지역 → 30초 진단 ---------- */
  $$('form[data-lc-start]').forEach(function (f) {
    var sel = f.querySelector('select[name=ind]');
    if (sel && !sel.options.length) L.ORDER.forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = L.IND[k].t; sel.appendChild(o); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var fe = function (n) { var el = f.elements.namedItem(n); return el && el.value ? String(el.value).trim() : ''; };
      LQ.open({ ind: fe('ind') || f.getAttribute('data-ind') || '', name: fe('name'), area: fe('area') });
    });
  });
  /* 다른 단추(업종 페이지 · 요금 칸 등): [data-lq] 또는 [data-lq="업종"] */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lq]');
    if (!b) return;
    e.preventDefault();
    var t = $('#lcTool'), nameEl = $('#f-name'), areaEl = $('#f-area');
    LQ.open({ ind: b.getAttribute('data-lq') || (t && t.getAttribute('data-ind')) || ($('#f-ind') && $('#f-ind').value) || '', name: nameEl ? nameEl.value : '', area: areaEl ? areaEl.value : '' });
  });
  /* 주소로 바로 열기: …/local/#quick, …/local/nail/?quick=1 */
  try {
    var qq = new URLSearchParams(location.search);
    if (location.hash === '#quick' || qq.get('quick') === '1') setTimeout(function () { var t = $('#lcTool'); LQ.open({ ind: qq.get('ind') || (t && t.getAttribute('data-ind')) || '', name: (qq.get('name') || ''), area: (qq.get('area') || '') }); }, 250);
  } catch (e) { /* 무시 */ }

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
