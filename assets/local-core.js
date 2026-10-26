/* AIMarker 가게 AI 검색 등록(13.9, 2026.10.27) 핵심 엔진
   가게 정보 한 번 → AI 검색 준비도(100점) · 손님이 AI에게 묻는 질문과 답할 수 있는지 · AI가 읽는 소개 문장 · 자주 묻는 질문 ·
   구조화 데이터(schema.org JSON-LD, 업종별 형식) · llms.txt · robots.txt · 정보 맞춤 목록 · AI 가게 페이지(HTML 한 장).
   브라우저(assets/local.js)와 빌드(Node, _src/tools/store_render.js)가 같은 파일을 씁니다. 화면(DOM)에 손대지 않고, 밖으로 아무것도 보내지 않습니다. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AMLocal = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VER = '1.1.0';
  var SITE = 'https://aimarker.kr/';

  /* ---------- 작은 도구 ---------- */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function clean(s, max) { s = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim(); return max ? s.slice(0, max) : s; }
  function uniq(a) { var o = [], seen = {}; (a || []).forEach(function (x) { if (x && !seen[x]) { seen[x] = 1; o.push(x); } }); return o; }
  function url(u) {
    u = clean(u, 400);
    if (!u) return '';
    if (/^(javascript|data|vbscript):/i.test(u)) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
    return /^https?:\/\/[^\s/]+\.[^\s/]+/.test(u) ? u : '';
  }

  /* 받침이 있는지(조사 고르기). 한글은 글자로, 숫자는 읽는 소리로, 영문은 읽는 소리에 가깝게.
     끝의 괄호 말은 건너뜀(맞춤법: '독채(6인)가', '봄결 네일(예시)은') */
  function lastCh(w) {
    w = String(w == null ? '' : w).replace(/[\s\]}"'’”.,!?·]+$/, '');
    for (var i = 0; i < 3 && /\)$/.test(w) && w.indexOf('(') > 0; i++) w = w.replace(/\s*\([^()]*\)$/, '').replace(/[\s\]}"'’”.,!?·]+$/, '');
    return w.replace(/[)\]]+$/, '');
  }
  var LETTER = { l: 8, m: 16, n: 4, r: 8 };   // 영문 머리글자(LG · BBQ 등)를 이름으로 읽을 때 받침: 엘 · 엠 · 엔 · 알
  function jongEn(w) {
    var tail = (w.match(/[A-Za-z]+$/) || [''])[0];
    if (/^[A-Z]{1,4}$/.test(tail)) return LETTER[tail.slice(-1).toLowerCase()] || 0;
    var t = tail.toLowerCase();
    if (/ng$/.test(t)) return 21;
    if (/(m|me)$/.test(t)) return 16;   // Home · Time → 홈 · 타임
    if (/(n|ne)$/.test(t)) return 4;    // Line · Zone → 라인 · 존
    if (/(l|le|ll)$/.test(t)) return 8; // Style · Nail → 스타일 · 네일
    if (/(b|p)$/.test(t)) return 17;    // Lab · Shop → 랩 · 샵
    if (/(ck|k|g|c)$/.test(t)) return 1; // Book · Bag · Magic → 북 · 백 · 매직
    if (/[^aeiou][aeiou]t$/.test(t)) return 19;   // Fit · Hot → 핏 · 핫
    return 0;
  }
  function jong(w) {
    w = lastCh(w); if (!w) return 0;
    var c = w.charCodeAt(w.length - 1);
    if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28;
    var ch = w.charAt(w.length - 1).toLowerCase();
    if (/[0-9]/.test(ch)) return { 0: 21, 1: 8, 3: 16, 6: 1, 7: 8, 8: 8 }[ch] || 0;   // 영 · 일 · 삼 · 육 · 칠 · 팔
    if (/[a-z]/.test(ch)) return jongEn(w);
    return 0;
  }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  /* jo('봄결 네일', '은', '는') → '봄결 네일은'. '으로/로' 는 ㄹ 받침이면 '로' */
  function jo(w, a, b) {
    var j = jong(w);
    if (a === '으로') return w + (j && j !== 8 ? '으로' : '로');
    return w + (j ? a : b);
  }

  /* 주소: '서울 강남구 테헤란로 123, 4층' → 시 · 도 / 시 · 군 · 구 / 나머지 */
  var SIDO = { '서울': '서울특별시', '서울시': '서울특별시', '서울특별시': '서울특별시', '부산': '부산광역시', '부산시': '부산광역시', '부산광역시': '부산광역시',
    '대구': '대구광역시', '대구시': '대구광역시', '대구광역시': '대구광역시', '인천': '인천광역시', '인천시': '인천광역시', '인천광역시': '인천광역시',
    '광주': '광주광역시', '광주시': '광주광역시', '광주광역시': '광주광역시', '대전': '대전광역시', '대전시': '대전광역시', '대전광역시': '대전광역시',
    '울산': '울산광역시', '울산시': '울산광역시', '울산광역시': '울산광역시', '세종': '세종특별자치시', '세종시': '세종특별자치시', '세종특별자치시': '세종특별자치시',
    '경기': '경기도', '경기도': '경기도', '강원': '강원특별자치도', '강원도': '강원특별자치도', '강원특별자치도': '강원특별자치도',
    '충북': '충청북도', '충청북도': '충청북도', '충남': '충청남도', '충청남도': '충청남도', '전북': '전북특별자치도', '전라북도': '전북특별자치도', '전북특별자치도': '전북특별자치도',
    '전남': '전라남도', '전라남도': '전라남도', '경북': '경상북도', '경상북도': '경상북도', '경남': '경상남도', '경상남도': '경상남도',
    '제주': '제주특별자치도', '제주도': '제주특별자치도', '제주특별자치도': '제주특별자치도' };
  function parseAddr(a) {
    var full = clean(a, 160), t = full.replace(/,/g, ' ').split(' ').filter(Boolean), region = '', loc = [];
    if (t.length && SIDO[t[0]]) region = SIDO[t.shift()];
    while (t.length && loc.length < 2 && /^[가-힣]{1,8}(시|군|구)$/.test(t[0])) loc.push(t.shift());
    return { full: full, region: region, locality: loc.join(' '), street: t.join(' '), short: loc[loc.length - 1] || (region ? region.replace(/(특별자치시|특별자치도|특별시|광역시|도)$/, '') : '') };
  }

  /* 한글 → 로마자(국어의 로마자 표기법 기본 규칙, 주소용 짧은 이름 만들기) */
  var RI = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  var RM = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  var RF = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
  function roman(s) {
    var out = '', prevF = -1;
    String(s || '').split('').forEach(function (ch) {
      var c = ch.charCodeAt(0);
      if (c >= 0xAC00 && c <= 0xD7A3) {
        var x = c - 0xAC00, i = Math.floor(x / 588), m = Math.floor((x % 588) / 28), f = x % 28;
        var ini = RI[i];
        if (i === 5 && prevF === 8) ini = 'l';   // ㄹㄹ → ll
        out += ini + RM[m] + RF[f]; prevF = f;
      } else { out += /[A-Za-z0-9]/.test(ch) ? ch.toLowerCase() : ' '; prevF = -1; }
    });
    return out;
  }
  function slug(name, area) {
    var s = roman(clean(name, 40)).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (s.length < 3 && area) s = (s ? s + '-' : '') + roman(clean(area, 20)).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s.slice(0, 48).replace(/-+$/, '') || 'store';
  }

  /* 값: '45,000원' · '4.5만 원' · '4만 5천원' · '4만 5000원' · '3~5만 원' · '45,000원부터' · '1박 25만 원부터' · '60분 70,000원' · '(1인) 30,000원'
     → { v | min · max, from }. '무료' 는 0원, '문의' 처럼 숫자가 없으면 값 없음 */
  function num1(x, unit) {
    var v = parseFloat(String(x).replace(/,/g, ''));
    if (isNaN(v)) return null;
    if (unit === '만') v *= 10000; else if (unit === '천') v *= 1000;
    return Math.round(v);
  }
  function parsePrice(p) {
    var raw = clean(p, 60);
    if (/^무료/.test(raw)) return { v: 0, free: true };
    var s = raw.replace(/\([^)]*\)/g, '').replace(/\s/g, '').replace(/₩/g, '');
    if (!s || !/\d/.test(s)) return null;
    var from = /부터|이상|최저|~$|-$|\+$/.test(s);
    var MAN = '([\\d.,]+)만([\\d.,]+)(천)?원?', ONE = '([\\d.,]+)(만|천)?원?';
    function one(t) { var a = t.match(new RegExp('^' + MAN + '$')); if (a) { var b = num1(a[2], a[3] ? '천' : ''); return b != null && b < 10000 ? num1(a[1], '만') + b : null; } a = t.match(new RegExp('^' + ONE + '$')); return a ? num1(a[1], a[2]) : null; }
    /* 범위: 3~5만 원 · 30,000-50,000원 */
    var r = s.match(/([\d.,]+(?:만[\d.,]+천?)?(?:만|천)?원?)(?:~|-|–)([\d.,]+(?:만[\d.,]+천?)?(?:만|천)?원?)/);
    if (r) {
      var hiU = (r[2].match(/(만|천)원?$/) || [])[1], lo = one(/(만|천)/.test(r[1]) ? r[1] : r[1].replace(/원$/, '') + (hiU || '')), hi = one(r[2]);
      if (lo && hi && hi >= lo && lo >= 100) return { min: lo, max: hi };
    }
    /* '원' 이 붙은 첫 값(앞의 '1박 · 60분 · 월 · 1회' 같은 말은 건너뜀) */
    var w = s.match(new RegExp(MAN.replace('원?', '원'))) || null, v;
    if (w) { v = one(w[0]); if (v && v >= 100) return { v: v, from: from }; }
    w = s.match(/([\d.,]+)(만|천)?원/);
    if (w) { v = num1(w[1], w[2]); if (v && v >= 100) return { v: v, from: from }; }
    /* '원' 없이 숫자만: '45,000' · '4.5만' */
    var m = s.match(/^([\d.,]+)(만|천)?/);
    if (m) { v = num1(m[1], m[2]); if (v && v >= 100) return { v: v, from: from }; }
    return null;
  }
  function hasPrice(p) { return !!parsePrice(p); }
  /* 전화번호를 국제 형식으로(구조화 데이터): 02-555-1234 → +82-2-555-1234, 010-… → +82-10-…. 1588 같은 대표번호는 그대로 */
  function intlTel(t) { t = clean(t, 30); if (!t) return ''; if (/^\+/.test(t)) return t; var d = t.replace(/[^\d-]/g, ''); return /^0\d/.test(d) ? '+82-' + d.replace(/^0/, '') : d; }
  function wonText(n) { return n.toLocaleString ? n.toLocaleString('ko-KR') + '원' : n + '원'; }

  /* ---------- 영업시간 ---------- */
  var DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  var DKO = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일', hol: '공휴일' };
  var DEN = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday', hol: 'PublicHolidays' };
  /* 하루 값: '10:00-21:00' · 'off'(쉼) · ''(모름). 24시간: '00:00-00:00'(시간 칸에는 24:00 을 넣을 수 없음) · '00:00-24:00' · '00:00-23:59'
     · 여는 시각과 닫는 시각이 같은 값 → 00:00~23:59(schema.org 24시간 표기) */
  function dayVal(v) {
    v = clean(v, 20);
    if (!v) return { k: '' };
    if (/^(off|휴무|쉼|x)$/i.test(v)) return { k: 'off' };
    if (/^24\s*시간$|^24h$/i.test(v)) return { k: 'open', o: '00:00', c: '23:59', s: '24시간', all: true };
    var m = v.match(/^(\d{1,2}):?(\d{2})\s*[-~]\s*(\d{1,2}):?(\d{2})$/);
    if (!m) return { k: '' };
    var o = ('0' + m[1]).slice(-2) + ':' + m[2], c = ('0' + m[3]).slice(-2) + ':' + m[4];
    if (c === '24:00') c = '23:59';
    if (o === c || (o === '00:00' && c === '23:59')) return { k: 'open', o: '00:00', c: '23:59', s: '24시간', all: true };
    return { k: 'open', o: o, c: c, s: o + '~' + c };
  }
  /* '10:00~21:00에 엽니다' · '24시간 엽니다' */
  function openAt(x, verb) { return (x.all ? '24시간 ' : x.s + '에 ') + verb; }
  function hoursOf(s) { var h = (s && s.hours) || {}, o = {}; DAYS.concat(['hol']).forEach(function (d) { o[d] = dayVal(h[d]); }); return o; }
  function mins(t) { var p = String(t || '').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function hoursFacts(s) {
    var h = hoursOf(s), f = { any: false, known: 0, sun: false, sat: false, night: false, early: false, hol: h.hol.k === 'open', holOff: h.hol.k === 'off', allDay: false, offDays: [] };
    DAYS.forEach(function (d) {
      var x = h[d];
      if (x.k) f.known++;
      if (x.k === 'off') f.offDays.push(DKO[d]);
      if (x.k !== 'open') return;
      f.any = true;
      if (d === 'sun') f.sun = true;
      if (d === 'sat') f.sat = true;
      var o = mins(x.o), c = mins(x.c);
      if (c <= o || c >= 21 * 60) f.night = true;
      if (o <= 7 * 60) f.early = true;
      if (x.all) f.allDay = true;
    });
    return f;
  }
  /* 같은 시간인 요일을 묶음: 월~금 10:00~21:00 */
  function hoursRuns(s) {
    var h = hoursOf(s), runs = [], cur = null;
    DAYS.forEach(function (d) {
      var x = h[d], key = x.k === 'open' ? x.s : x.k;
      if (cur && cur.key === key) cur.to = d; else { cur = { key: key, from: d, to: d, x: x }; runs.push(cur); }
    });
    return runs.filter(function (r) { return r.key; }).map(function (r) {
      var one = r.from === r.to, lab = one ? DKO[r.from] : DKO[r.from] + '~' + DKO[r.to];
      if (r.from === 'mon' && r.to === 'sun') lab = '매일';
      return { lab: lab, lab2: one ? DKO[r.from] + '요일' : lab, off: r.key === 'off', all: !!r.x.all, s: r.x.s || '' };
    });
  }
  /* 점심 · 쉬는 시간. '없음' 처럼 적으면 '없이' 문장으로 */
  function brkNone(s) { return /^(없음|없어요|없습니다|없이|x|-)$/i.test(clean(s && s.brk, 40)); }
  function brkText(s) { var b = clean(s && s.brk, 40); return b && !brkNone(s) ? b.replace(/\s*-\s*/, '~') : ''; }
  /* 목록 · 표용: '월~금 10:00~21:00, 토 10:00~18:00, 일 쉼, 공휴일 쉼, 점심시간 13:00~14:00' */
  function hoursText(s) {
    var h = hoursOf(s), parts = hoursRuns(s).map(function (r) { return r.lab + ' ' + (r.off ? '쉼' : r.s); });
    if (h.hol.k === 'open') parts.push('공휴일 ' + h.hol.s); else if (h.hol.k === 'off') parts.push('공휴일 쉼');
    if (brkText(s) && parts.length) parts.push((ind(s).brkWord || '쉬는 시간') + ' ' + brkText(s));
    else if (brkNone(s) && parts.length) parts.push((ind(s).brkWord || '쉬는 시간') + ' 없음');
    return parts.join(', ');
  }
  /* 문장용: '월~금 10:00~21:00, 토요일 10:00~18:00에 엽니다. 일요일은 쉽니다. 점심시간은 13:00~14:00입니다.' */
  function hoursSentence(s) {
    var I = ind(s), h = hoursOf(s), runs = hoursRuns(s), on = runs.filter(function (r) { return !r.off && !r.all; }), all = runs.filter(function (r) { return r.all; }), off = runs.filter(function (r) { return r.off; }), out = [];
    /* 매일 같은 시간이고 공휴일도 같으면 한 문장으로: '공휴일을 포함해 매일 24시간 진료합니다.' */
    var same = runs.length === 1 && runs[0].lab === '매일' && !runs[0].off && h.hol.k === 'open' && h.hol.s === runs[0].s;
    if (same) out.push('공휴일을 포함해 매일 ' + openAt(h.hol, I.openA) + '.');
    else {
      if (on.length) out.push(on.map(function (r) { return r.lab2 + ' ' + r.s; }).join(', ') + '에 ' + I.openA + '.');
      if (all.length) out.push(all.map(function (r) { return r.lab2; }).join(', ') + ' 24시간 ' + I.openA + '.');
    }
    var offs = off.map(function (r) { return r.lab2; });
    if (offs.length === 1 && offs[0] === '매일') out.push('지금은 쉬고 있습니다.');
    else {
      if (h.hol.k === 'off') offs.push('공휴일');
      if (offs.length) out.push(jo(offs.join(', '), '은', '는') + ' 쉽니다.');
    }
    if (h.hol.k === 'open' && !same) out.push('공휴일에는 ' + openAt(h.hol, I.openA) + '.');
    if ((on.length || all.length) && brkText(s)) out.push(jo(I.brkWord || '쉬는 시간', '은', '는') + ' ' + brkText(s) + '입니다.');
    else if ((on.length || all.length) && brkNone(s)) out.push((I.brkWord || '쉬는 시간') + ' 없이 ' + (I.open === '여는' ? '운영합니다' : I.openA) + '.');
    return out.join(' ');
  }
  function hoursSpec(s) {
    var h = hoursOf(s), groups = {};
    DAYS.forEach(function (d) { var x = h[d]; if (x.k === 'open') { (groups[x.s] = groups[x.s] || { o: x.o, c: x.c, days: [] }).days.push(DEN[d]); } });
    var out = Object.keys(groups).map(function (k) { var g = groups[k]; return { '@type': 'OpeningHoursSpecification', dayOfWeek: g.days, opens: g.o, closes: g.c }; });
    if (h.hol.k === 'open') out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/PublicHolidays', opens: h.hol.o, closes: h.hol.c });
    if (h.hol.k === 'off') out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/PublicHolidays', opens: '00:00', closes: '00:00' });
    return out;
  }

  /* ---------- 편의 · 특징(업종마다 고르는 것이 다름) ---------- */
  /* t: 고르는 이름, a: 답에 쓰는 문장(이름 없이), q: 손님이 묻는 말에 들어가는 말 */
  var FEAT = {
    reserve: { t: '예약 받음', a: '예약을 받습니다', c: '예약을 받고', q: '예약 되는' },
    walkin: { t: '예약 없이 방문 가능', a: '예약 없이 바로 방문해도 됩니다', c: '예약 없이 바로 방문해도 되고', q: '예약 없이 가도 되는' },
    parking: { t: '주차 가능', a: '주차할 수 있습니다', c: '주차할 수 있고', q: '주차 되는' },
    card: { t: '카드 · 간편결제', a: '카드와 간편결제로 낼 수 있습니다', c: '카드와 간편결제로 낼 수 있고', q: '카드 되는' },
    kids: { t: '아이와 함께 오기 좋음', a: '아이와 함께 오기 좋습니다', c: '아이와 함께 오기 좋고', q: '아이랑 가기 좋은' },
    pet: { t: '반려동물 동반', a: '반려동물과 함께 올 수 있습니다', c: '반려동물과 함께 올 수 있고', q: '반려동물 동반 되는' },
    wheel: { t: '휠체어 · 엘리베이터', a: '휠체어로 이용할 수 있습니다(엘리베이터 있음)', c: '휠체어로 이용할 수 있고', q: '휠체어로 갈 수 있는' },
    foreign: { t: '외국어 응대', a: '외국어로 안내할 수 있습니다', c: '외국어로 안내할 수 있고', q: '외국어 되는' },
    insurance: { t: '실손 보험 서류 발급', a: '실손 보험 청구 서류를 바로 발급합니다', c: '실손 보험 청구 서류를 바로 발급하고', q: '실손 서류 바로 떼 주는' },
    auto: { t: '교통사고 진료(자동차보험)', a: '교통사고 환자를 자동차보험으로 진료합니다', c: '교통사고 환자를 자동차보험으로 진료하고', q: '교통사고 치료 되는' },
    emergency: { t: '응급 진료', a: '응급 진료를 합니다', c: '응급 진료를 하고', q: '응급 진료 되는' },   // 24시간인지는 진료 시간 칸(00:00~00:00)으로
    cat: { t: '고양이 진료 공간 따로', a: '고양이 대기 · 진료 공간이 따로 있습니다', c: '고양이 대기 · 진료 공간이 따로 있고', q: '고양이 친화적인' },
    hotel: { t: '호텔링 · 맡기기', a: '호텔링으로 맡길 수 있습니다', c: '호텔링으로 맡길 수 있고', q: '호텔링 되는' },
    solo: { t: '1인샵 · 프라이빗', a: '1인샵이라 조용하게 받을 수 있습니다', c: '1인샵이라 조용하게 받을 수 있고', q: '1인샵인' },
    male: { t: '남성 손님 환영', a: '남성 손님도 받습니다', c: '남성 손님도 받고', q: '남자도 가기 편한' },
    designer: { t: '디자이너 지정 가능', a: '디자이너를 지정해 예약할 수 있습니다', c: '디자이너를 지정해 예약할 수 있고', q: '디자이너 지정 되는' },
    wifi: { t: '와이파이 · 콘센트', a: '와이파이와 콘센트가 있습니다', c: '와이파이와 콘센트가 있고', q: '노트북 하기 좋은' },
    group: { t: '단체 · 모임 가능', a: '단체 손님과 모임을 받습니다', c: '단체 손님과 모임을 받고', q: '단체로 가기 좋은' },
    room: { t: '룸 · 개별 공간', a: '룸(개별 공간)이 있습니다', c: '룸(개별 공간)이 있고', q: '룸 있는' },
    takeout: { t: '포장', a: '포장할 수 있습니다', c: '포장할 수 있고', q: '포장 되는' },
    delivery: { t: '배달', a: '배달합니다', c: '배달하고', q: '배달 되는' },
    solofood: { t: '혼밥 · 혼자 오기 좋음', a: '혼자 오기 좋습니다', c: '혼자 오기 좋고', q: '혼밥하기 좋은' },
    terrace: { t: '테라스 · 루프탑', a: '테라스(루프탑) 자리가 있습니다', c: '테라스(루프탑) 자리가 있고', q: '테라스 있는' },
    study: { t: '공부 · 작업 가능', a: '오래 앉아 공부하거나 작업하기 좋습니다', c: '오래 앉아 공부하거나 작업하기 좋고', q: '공부하기 좋은' },
    shuttle: { t: '차량 운행', a: '학생 차량을 운행합니다', c: '학생 차량을 운행하고', q: '차량 운행하는' },
    trial: { t: '체험 · 상담 수업', a: '체험 수업(상담)을 받을 수 있습니다', c: '체험 수업(상담)을 받을 수 있고', q: '체험 수업 있는' },
    small: { t: '소수 · 1:1 수업', a: '소수 정원 또는 1:1로 수업합니다', c: '소수 정원 또는 1:1로 수업하고', q: '소수 정원인' },
    online: { t: '온라인 · 비대면', a: '온라인(비대면)으로도 할 수 있습니다', c: '온라인(비대면)으로도 할 수 있고', q: '비대면 되는' },
    shower: { t: '샤워실 · 탈의실', a: '샤워실과 탈의실이 있습니다', c: '샤워실과 탈의실이 있고', q: '샤워실 있는' },
    wear: { t: '운동복 · 수건 제공', a: '운동복과 수건을 줍니다', c: '운동복과 수건을 주고', q: '운동복 주는' },
    female: { t: '여성 전용', a: '여성 전용입니다', c: '여성 전용이고', q: '여성 전용' },
    consult: { t: '상담 예약', a: '상담 예약을 받습니다', c: '상담 예약을 받고', q: '상담 예약 되는' },
    estimate: { t: '방문 실측 · 견적', a: '방문해 실측하고 견적을 드립니다', c: '방문해 실측하고 견적을 드리고', q: '실측 견적 되는' },
    warranty: { t: 'A/S 보증', a: '시공 뒤 A/S를 보증합니다', c: '시공 뒤 A/S를 보증하고', q: 'A/S 되는' },
    license: { t: '공사업 등록 · 면허', a: '공사업 등록(면허)이 있습니다', c: '공사업 등록(면허)이 있고', q: '면허 있는' },
    bbq: { t: '바비큐', a: '바비큐를 할 수 있습니다', c: '바비큐를 할 수 있고', q: '바비큐 되는' },
    pool: { t: '수영장 · 스파', a: '수영장(스파)이 있습니다', c: '수영장(스파)이 있고', q: '수영장 있는' },
    breakfast: { t: '조식', a: '조식이 나옵니다', c: '조식이 나오고', q: '조식 주는' },
    pickup: { t: '픽업', a: '픽업해 드립니다', c: '픽업해 드리고', q: '픽업 되는' },
    gift: { t: '포장 · 선물용', a: '선물용으로 포장해 드립니다', c: '선물용으로 포장해 드리고', q: '선물 포장 되는' }
  };


  /* ---------- 업종 ----------
     t: 고르는 이름 · n: 손님이 부르는 말 · type: schema.org 형식 · open: '여는' 대신 쓰는 말 · hw: 영업시간을 부르는 말
     items: 대표 서비스 칸 예시 · feat: 고르는 편의 · key: AI 질문에 자주 나오는 것(준비도 셈)
     subs: [이름, 손님이 부르는 말, 형식] · chk: 광고 표현 점검 규칙 팩(서버 am.check) · warn: 업종 주의(사실만) · ex: 예시 가게 */
  var IND = {
    clinic: { t: '병원 · 의원', n: '병원', type: 'MedicalClinic', open: '진료하는', hw: '진료 시간', brkWord: '점심시간', itemsT: '진료 과목 · 주요 진료', itemV: '합니다',
      items: ['소아청소년과 진료', '내과 진료', '영유아 검진', '예방접종', '건강검진'], feat: ['reserve', 'walkin', 'parking', 'insurance', 'kids', 'wheel', 'foreign', 'card'],
      key: ['hours', 'sun', 'night', 'parking', 'reserve', 'items'], chk: 'med', med: 1,
      ex: { name: '봄빛 소아청소년과의원', area: '분당 정자역', q: '정자역 근처 일요일에 진료하는 소아과 있어?' },
      warn: '의료법은 치료 효과를 보장하거나, 다른 병원과 비교하거나, 환자 치료 경험담처럼 보이는 광고를 금지합니다(제56조). AI 가게 페이지에는 진료 과목, 진료 시간, 위치, 접수 방법처럼 확인할 수 있는 사실만 적고 \'최고 · 완치 · 100%\' 같은 말은 쓰지 않습니다.' },
    dental: { t: '치과', n: '치과', type: 'Dentist', open: '진료하는', hw: '진료 시간', brkWord: '점심시간', itemsT: '주요 진료', itemV: '합니다',
      items: ['스케일링', '충치 치료', '신경 치료', '임플란트', '치아 교정'], feat: ['reserve', 'parking', 'kids', 'insurance', 'wheel', 'foreign', 'card'],
      key: ['hours', 'night', 'sat', 'parking', 'reserve', 'price'], chk: 'med', med: 1,
      ex: { name: '바른결치과의원', area: '잠실역', q: '잠실역 근처 야간 진료하는 치과 알려 줘' },
      warn: '치과도 의료법의 의료광고 규정(제56조)을 따릅니다. 진료 과목과 시간, 장비처럼 확인할 수 있는 사실만 적고, 가격은 할인 · 이벤트 표현 없이 정해진 값만 적습니다.' },
    kmed: { t: '한의원', n: '한의원', type: 'MedicalClinic', open: '진료하는', hw: '진료 시간', brkWord: '점심시간', itemsT: '주요 진료', itemV: '합니다',
      items: ['침 치료', '추나요법', '약침', '한약 처방', '교통사고 치료'], feat: ['reserve', 'walkin', 'parking', 'auto', 'insurance', 'wheel', 'card'],
      key: ['hours', 'night', 'auto', 'parking', 'reserve', 'items'], chk: 'med', med: 1,
      ex: { name: '온결한의원', area: '노원역', q: '노원역 근처 교통사고 치료 되는 한의원 어디야?' },
      warn: '한의원도 의료법의 의료광고 규정(제56조)을 따릅니다. 진료 과목, 진료 시간, 자동차보험 진료 여부처럼 확인할 수 있는 사실만 적고 효과를 장담하는 말은 쓰지 않습니다.' },
    derma: { t: '피부과', n: '피부과', type: 'MedicalClinic', spec: 'Dermatology', open: '진료하는', hw: '진료 시간', brkWord: '점심시간', itemsT: '주요 진료 · 시술', itemV: '합니다',
      items: ['여드름 진료', '레이저 토닝', '점 · 사마귀 제거', '리프팅', '보톡스'], feat: ['reserve', 'parking', 'insurance', 'foreign', 'wheel', 'card'],
      key: ['hours', 'night', 'sat', 'parking', 'reserve', 'price'], chk: 'med', med: 1,
      ex: { name: '맑은결피부과의원', area: '신논현역', q: '신논현역 근처 토요일에 하는 피부과 추천해 줘' },
      warn: '피부과도 의료법의 의료광고 규정(제56조)을 따릅니다. 치료 효과로 오인될 수 있는 전후 사진 · 후기, \'부작용 없음\' 같은 말은 쓰지 않고, 시술 이름과 진료 시간처럼 확인할 수 있는 사실만 적습니다.' },
    vet: { t: '동물병원', n: '동물병원', type: ['VeterinaryCare', 'LocalBusiness'], open: '진료하는', hw: '진료 시간', brkWord: '점심시간', itemsT: '주요 진료', itemV: '합니다',
      items: ['예방접종', '중성화 수술', '건강검진', '스케일링', '피부 진료'], feat: ['reserve', 'walkin', 'parking', 'emergency', 'cat', 'hotel', 'card'],
      key: ['hours', 'night', 'sun', 'emergency', 'parking', 'items'], chk: 'gen',
      ex: { name: '포근동물병원', area: '마포구청역', q: '마포 근처 밤늦게 진료하는 동물병원 있어?' },
      warn: '치료 효과를 장담하는 말 대신, 진료 과목과 시간, 응급 진료와 고양이 진료 공간처럼 보호자가 확인할 사실을 먼저 적습니다.' },
    nail: { t: '네일샵', n: '네일샵', type: 'NailSalon', open: '여는', hw: '영업시간', itemsT: '대표 서비스와 가격', itemV: '합니다',
      items: ['젤네일', '젤 패디큐어', '손톱 케어', '네일 연장', '젤 제거'], feat: ['reserve', 'walkin', 'parking', 'solo', 'male', 'card'],
      key: ['hours', 'sun', 'night', 'price', 'reserve', 'parking'], chk: 'gen',
      ex: { name: '봄결 네일', area: '강남역', q: '강남역 근처 일요일에도 하는 네일샵 추천해 줘' } },
    hair: { t: '미용실 · 헤어샵', n: '미용실', type: 'HairSalon', open: '여는', hw: '영업시간', itemsT: '대표 서비스와 가격', itemV: '합니다',
      items: ['커트', '펌', '염색', '클리닉', '매직 스트레이트'], feat: ['reserve', 'walkin', 'parking', 'designer', 'male', 'kids', 'card'],
      key: ['hours', 'sun', 'night', 'price', 'reserve', 'parking'], chk: 'gen',
      ex: { name: '결헤어', area: '홍대입구역', q: '홍대입구역 근처 남자 커트 잘하는 미용실 어디야?' } },
    beauty: { t: '피부관리 · 왁싱 · 속눈썹', n: '뷰티샵', type: 'BeautySalon', open: '여는', hw: '영업시간', itemsT: '대표 관리와 가격', itemV: '합니다',
      subs: [['피부관리', '피부관리실'], ['왁싱', '왁싱샵'], ['속눈썹 · 눈썹', '속눈썹샵'], ['두피 · 헤드스파', '헤드스파']],
      items: ['수분 관리', '여드름 관리', '브라질리언 왁싱', '속눈썹 펌', '눈썹 정리'], feat: ['reserve', 'solo', 'parking', 'female', 'male', 'card'],
      key: ['hours', 'night', 'price', 'reserve', 'solo', 'parking'], chk: 'cos',
      ex: { name: '결 에스테틱', area: '목동역', q: '목동역 근처 1인 피부관리실 추천해 줘' },
      warn: '피부관리실 · 왁싱샵은 의료기관이 아니므로 \'치료 · 시술 효과\' 같은 의료 표현을 쓰지 않고, 관리 내용과 시간, 가격을 사실대로 적습니다.' },
    cafe: { t: '카페 · 베이커리', n: '카페', type: 'CafeOrCoffeeShop', open: '여는', hw: '영업시간', itemsT: '대표 메뉴와 가격', itemV: '팝니다', menu: 1,
      subs: [['카페', '카페', 'CafeOrCoffeeShop'], ['베이커리', '빵집', 'Bakery'], ['디저트 카페', '디저트 카페', 'CafeOrCoffeeShop']],
      items: ['아메리카노', '카페라떼', '시그니처 음료', '케이크', '소금빵'], feat: ['parking', 'wifi', 'study', 'pet', 'kids', 'group', 'terrace', 'takeout'],
      key: ['hours', 'parking', 'wifi', 'pet', 'price', 'sun'], chk: 'food',
      ex: { name: '봄결 커피', area: '성수역', q: '성수역 근처 노트북 하기 좋은 카페 알려 줘' } },
    restaurant: { t: '음식점 · 맛집', n: '맛집', type: 'Restaurant', open: '여는', hw: '영업시간', brkWord: '브레이크 타임', itemsT: '대표 메뉴와 가격', itemV: '팝니다', menu: 1, cuisine: 1,
      items: ['김치찌개', '제육볶음', '된장찌개', '계란말이'], feat: ['reserve', 'parking', 'group', 'room', 'kids', 'solofood', 'takeout', 'delivery', 'pet'],
      key: ['hours', 'reserve', 'parking', 'group', 'price', 'sun'], chk: 'food',
      ni: '식당', ex: { name: '봄결식당', area: '을지로3가역', q: '을지로 회식하기 좋은 한식집 추천해 줘' },
      warn: '메뉴에 원산지를 적는다면 가게 안 원산지 표시와 같게 적습니다(농수산물 원산지 표시법). \'몸에 좋은 · 면역력\' 같은 효능 표현은 광고 표현 점검으로 한 번 더 거릅니다.' },
    academy: { t: '학원 · 교습소', n: '학원', type: ['LocalBusiness', 'EducationalOrganization'], open: '수업하는', hw: '수업 시간', itemsT: '과목 · 과정', itemV: '가르칩니다', itemsS: '가르치는 과목 · 과정은', fee: 1,
      items: ['초등 영어', '중등 수학', '고등 국어', '내신 대비', '방학 특강'], feat: ['shuttle', 'trial', 'small', 'online', 'parking'],
      key: ['hours', 'fee', 'items', 'shuttle', 'trial', 'sat'], chk: 'gen',
      ex: { name: '봄결수학학원', area: '대치동', q: '대치동 소수 정원 중등 수학 학원 알려 줘' },
      warn: '학원법은 교습비를 학습자가 보기 쉽게 알리고, 교육청에 신고한 금액과 다르게 표시하지 않도록 정하고 있습니다(제15조, 시 · 도 교육청 기준). 교습비 칸에 신고한 금액을 그대로 적으면 AI 가게 페이지에 함께 올리고, \'합격률 · 1등\' 같은 말은 근거가 있을 때만 씁니다.' },
    fitness: { t: '필라테스 · 요가 · 헬스', n: '운동 센터', type: 'ExerciseGym', open: '여는', hw: '운영 시간', itemsT: '수업 · 회원권과 가격', itemV: '합니다', itemsS: '수업 · 회원권은',
      subs: [['필라테스', '필라테스', 'ExerciseGym', '필라테스 센터'], ['요가', '요가원', 'ExerciseGym', '요가원'], ['헬스 · PT', '헬스장', 'ExerciseGym', '헬스장'], ['크로스핏 · 그룹 운동', '운동 센터', 'ExerciseGym', '운동 센터']], ni: '운동 센터',
      items: ['1:1 개인 레슨', '그룹 레슨', '체험 수업', '회원권 3개월'], feat: ['trial', 'small', 'parking', 'shower', 'wear', 'female'],
      key: ['hours', 'early', 'night', 'trial', 'price', 'parking'], chk: 'gen',
      ex: { name: '결 필라테스', area: '광교중앙역', q: '광교 새벽에 하는 필라테스 있어?' },
      warn: '\'한 달 10kg\' 같은 효과 장담은 과장 광고로 문제될 수 있어 쓰지 않고, 수업 방식과 정원, 가격, 운영 시간을 사실대로 적습니다.' },
    realty: { t: '부동산 중개', n: '부동산', type: 'RealEstateAgent', open: '여는', hw: '영업시간', itemsT: '중개 분야', itemV: '중개합니다', reg: 1, areaServed: 1, ni: '공인중개사사무소', q2: '다른 동네 매물도 중개해?',
      items: ['아파트 매매', '전월세', '상가 · 사무실', '원룸 · 오피스텔'], feat: ['consult', 'parking', 'foreign', 'online'],
      key: ['hours', 'reg', 'items', 'tel', 'sat', 'consult'], chk: 'gen',
      ex: { name: '봄결공인중개사사무소', area: '위례', q: '위례 신혼부부 전세 잘 보는 부동산 알려 줘' },
      warn: '중개대상물(매물)을 인터넷에 표시 · 광고할 때는 중개사무소 이름 · 소재지 · 연락처 · 등록번호와 개업공인중개사 이름을 밝혀야 합니다(공인중개사법 제18조의2). 매물을 소개하지 않더라도 AI 가게 페이지에는 이 정보를 함께 적습니다.' },
    office: { t: '법률 · 세무 · 노무 사무소', n: '사무소', type: 'LocalBusiness', open: '여는', hw: '상담 시간', itemsT: '상담 분야', itemV: '상담합니다', areaServed: 1, subReq: 1, q2: '우리 지역 일도 맡아?',
      subs: [['변호사', '법률사무소', 'LegalService'], ['법무사', '법무사 사무소', 'LegalService'], ['세무사', '세무사 사무소', 'AccountingService'], ['회계사', '회계사무소', 'AccountingService'], ['노무사', '노무사 사무소', 'LocalBusiness'], ['행정사', '행정사 사무소', 'LocalBusiness']],
      items: ['상속 · 증여', '세금 신고 · 기장', '임금 · 해고 상담', '등기 · 소송 서류'], feat: ['consult', 'online', 'parking', 'foreign'], noEx: 1,
      key: ['hours', 'items', 'consult', 'tel', 'online', 'night'], chk: 'gen',
      ex: { name: '바른결 법률사무소', area: '서초동', q: '서초동 상속 상담 잘하는 변호사 사무실 알려 줘' },
      warn: '변호사 · 세무사 같은 전문직은 직역 단체의 광고 규정이 있습니다. 예를 들어 변호사는 전문 분야를 등록해야 \'전문\'을 쓸 수 있습니다(대한변호사협회 규정). 상담 분야와 자격, 등록 사실처럼 확인할 수 있는 정보만 적습니다.' },
    interior: { t: '인테리어 · 시공 · 수리', n: '시공 업체', type: 'HomeAndConstructionBusiness', q2: '우리 동네까지 와 줘?', open: '여는', hw: '상담 시간', itemsT: '시공 분야와 가격', itemV: '시공합니다', areaServed: 1,
      subs: [['인테리어 · 리모델링', '인테리어 업체', 'GeneralContractor'], ['도배 · 장판', '도배 업체', 'HomeAndConstructionBusiness'], ['욕실 · 타일', '욕실 리모델링 업체', 'HomeAndConstructionBusiness'], ['누수 · 설비', '설비 업체', 'Plumber'], ['전기 · 조명', '전기 업체', 'Electrician'], ['이사 · 청소', '이사 업체', 'MovingCompany']],
      items: ['아파트 전체 리모델링', '욕실 리모델링', '도배 · 장판', '샷시 교체'], feat: ['estimate', 'warranty', 'license', 'online'],
      key: ['items', 'area2', 'estimate', 'warranty', 'price', 'tel'], chk: 'gen',
      ex: { name: '봄결인테리어', area: '송도', q: '송도 30평 아파트 리모델링 잘하는 곳 알려 줘' } },
    stay: { t: '숙박 · 펜션 · 캠핑', n: '숙소', type: 'LodgingBusiness', open: '여는', hw: '운영 시간', itemsT: '객실 · 요금', itemV: '있습니다', stay: 1,
      subs: [['펜션', '펜션', 'LodgingBusiness'], ['게스트하우스', '게스트하우스', 'Hostel'], ['호텔', '호텔', 'Hotel'], ['캠핑 · 글램핑', '캠핑장', 'Campground']],
      items: ['커플룸(2인)', '가족룸(4인)', '독채(6인)', '바비큐 세트'], feat: ['parking', 'pet', 'bbq', 'pool', 'kids', 'breakfast', 'pickup'],
      key: ['checkin', 'price', 'parking', 'pet', 'bbq', 'items'], chk: 'gen',
      ex: { name: '봄결스테이', area: '가평', q: '가평 반려견 동반 되는 독채 펜션 추천해 줘' } },
    shop: { t: '그 밖의 가게', n: '가게', type: 'Store', open: '여는', hw: '영업시간', itemsT: '대표 상품 · 서비스와 가격', itemV: '합니다', itemsS: '대표 상품 · 서비스는', noEx: 1,
      subs: [['꽃집', '꽃집', 'Florist'], ['공방 · 클래스', '공방', 'LocalBusiness'], ['사진관 · 스튜디오', '사진관', 'LocalBusiness'], ['안경원', '안경원', 'Optician'], ['세탁소', '세탁소', 'DryCleaningOrLaundry'], ['애견 미용 · 용품', '애견미용', 'PetStore'], ['그 밖의 가게', '가게', 'Store']],
      items: ['대표 상품', '대표 서비스'], feat: ['reserve', 'walkin', 'parking', 'card', 'delivery', 'gift', 'kids'],
      key: ['hours', 'items', 'price', 'parking', 'reserve', 'sun'], chk: 'gen',
      ex: { name: '봄결꽃집', area: '합정역', q: '합정역 근처 당일 꽃다발 되는 꽃집 있어?' } }
  };
  var ORDER = ['clinic', 'dental', 'kmed', 'derma', 'vet', 'nail', 'hair', 'beauty', 'cafe', 'restaurant', 'academy', 'fitness', 'realty', 'office', 'interior', 'stay', 'shop'];
  /* '여는' · '진료하는' · '수업하는' → 끝맺는 말과 묻는 말 */
  var OPENV = { '여는': ['엽니다', '여나요'], '진료하는': ['진료합니다', '진료하나요'], '수업하는': ['수업합니다', '수업하나요'] };
  ORDER.forEach(function (k) { var I = IND[k], v = OPENV[I.open] || OPENV['여는']; I.openA = v[0]; I.openQ = v[1]; I.k = k; });
  /* 진료 과목 → schema.org 진료 분야 */
  var SPEC = [[/피부/, 'Dermatology'], [/소아/, 'Pediatric'], [/이비인후/, 'Otolaryngologic'], [/정형|재활|통증/, 'Musculoskeletal'], [/산부인|여성/, 'Gynecologic'], [/비뇨/, 'Urologic'], [/정신|심리/, 'Psychiatric'], [/성형/, 'PlasticSurgery'], [/안과/, 'Optometric'], [/내과|가정의학/, 'PrimaryCare']];

  function ind(s) { return s && has(IND, s.ind) ? IND[s.ind] : IND.shop; }
  function sub(s) { var I = ind(s), k = clean(s && s.sub, 30); return (I.subs || []).filter(function (x) { return x[0] === k; })[0] || null; }
  function noun(s) { var x = sub(s); return x ? x[1] : ind(s).n; }
  function typeOf(s) { var x = sub(s); return (x && x[2]) || ind(s).type; }
  /* 소개 문장에 쓰는 이름(손님이 부르는 말보다 곳을 가리키는 말: '필라테스' → '필라테스 센터') */
  function placeNoun(s) { var x = sub(s); return (x && x[3]) || ind(s).ni || noun(s); }

  /* ---------- 들어온 가게 정보를 한 모양으로 ---------- */
  function normalize(raw) {
    raw = raw || {};
    var s = { v: 1, ind: has(IND, raw.ind) ? raw.ind : 'shop', sub: clean(raw.sub, 30), name: clean(raw.name, 60), branch: clean(raw.branch, 30), area: clean(raw.area, 30),
      addr: clean(raw.addr, 160), addr2: clean(raw.addr2, 160), tel: clean(raw.tel, 30).replace(/[^\d\-+() ]/g, ''), hours: {}, brk: clean(raw.brk, 40), off: clean(raw.off, 80),
      items: [], feat: [], note: clean(raw.note, 200), about: clean(raw.about, 300), cuisine: clean(raw.cuisine, 40), fee: clean(raw.fee, 200), area2: clean(raw.area2, 120),
      checkin: clean(raw.checkin, 10), checkout: clean(raw.checkout, 10), links: {}, biz: {}, updated: clean(raw.updated, 10), slug: clean(raw.slug, 48).toLowerCase().replace(/[^a-z0-9-]/g, '') };
    var h = raw.hours || {};
    DAYS.concat(['hol']).forEach(function (d) { var x = dayVal(h[d]); s.hours[d] = x.k === 'open' ? x.o + '-' + x.c : x.k; });
    (Array.isArray(raw.items) ? raw.items : []).slice(0, 12).forEach(function (it) { var n = clean(it && it.n, 40); if (n) s.items.push({ n: n, p: clean(it.p, 30), d: clean(it.d, 80) }); });
    var I = IND[s.ind];
    s.feat = uniq((Array.isArray(raw.feat) ? raw.feat : []).filter(function (k) { return has(FEAT, k) && I.feat.indexOf(k) >= 0; }));
    ['home', 'place', 'kakao', 'google', 'insta', 'blog', 'book', 'kakaoch', 'youtube'].forEach(function (k) { var u = url(raw.links && raw.links[k]); if (u) s.links[k] = u; });
    ['owner', 'no', 'reg'].forEach(function (k) { var v = clean(raw.biz && raw.biz[k], 40); if (v) s.biz[k] = v; });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.updated)) s.updated = '';
    if (I.subs && !sub(s)) s.sub = '';
    /* 업종에 없는 칸은 비움(업종을 바꾸기 전에 적은 값이 결과에 섞이지 않게) */
    if (!I.cuisine) s.cuisine = '';
    if (!I.fee) s.fee = '';
    if (!I.areaServed) s.area2 = '';
    if (!I.stay) { s.checkin = ''; s.checkout = ''; }
    if (!I.reg) delete s.biz.reg;
    /* 광고 표현 점검 기록(화면에서 점검한 날 · 남은 높은 위험 후보 수). 의료 업종은 올리기 전에 필요 */
    var ck = raw.check;
    if (ck && /^\d{4}-\d{2}-\d{2}$/.test(String(ck.at || '')) && isFinite(+ck.hi)) s.check = { at: String(ck.at), hi: Math.max(0, +ck.hi | 0), n: Math.max(0, +ck.n | 0) };
    return s;
  }

  /* ---------- 사실(질문에 답할 수 있는지) ---------- */
  function facts(s) {
    var hf = hoursFacts(s), pr = s.items.filter(function (it) { return hasPrice(it.p); }).length, F = {};
    F.base = !!(s.name && (s.addr || s.area));
    F.name = !!s.name; F.addr = s.addr.length >= 6; F.area = !!(s.area || s.addr); F.tel = s.tel.replace(/\D/g, '').length >= 8;
    F.hours = hf.any; F.sun = hf.sun; F.sat = hf.sat; F.night = hf.night; F.early = hf.early; F.hol = hf.hol || hf.holOff;
    F.items = s.items.length > 0; F.price = pr > 0; F.addr2 = !!s.addr2;
    F.book = !!(s.links.book || s.feat.indexOf('reserve') >= 0 || F.tel);
    F.fee = !!s.fee; F.reg = !!s.biz.reg; F.area2 = !!s.area2; F.checkin = !!(s.checkin || s.checkout); F.cuisine = !!s.cuisine;
    s.feat.forEach(function (k) { F[k] = true; });
    if (s.feat.indexOf('reserve') >= 0 || s.links.book) F.reserve = true;
    /* 정보가 있어 '아니요'로 정확히 답하는 것(쉬는 요일 · 늦게까지 하지 않음) */
    var hh = hoursOf(s);
    F._neg = { sun: hh.sun.k === 'off', sat: hh.sat.k === 'off', night: hf.any && hf.known === 7 && !hf.night, early: hf.any && hf.known === 7 && !hf.early };
    F._hf = hf; F._pr = pr;
    return F;
  }
  /* 빠진 정보 이름(누르면 그 칸으로) */
  var NEED = { base: ['가게 이름 · 주소', 'f-name'], name: ['가게 이름', 'f-name'], addr: ['도로명 주소', 'f-addr'], area: ['동네 · 가까운 역', 'f-area'], tel: ['전화번호', 'f-tel'],
    hours: ['요일별 영업시간', 'h-mon'], week: ['쉬는 요일까지 모든 요일', 'h-mon'], sun: ['일요일 영업시간', 'h-sun'], sat: ['토요일 영업시간', 'h-sat'], night: ['저녁 늦게까지 여는지', 'h-mon'], early: ['아침 일찍 여는지', 'h-mon'], hol: ['공휴일 · 쉬는 날', 'h-hol'],
    items: ['대표 서비스 · 메뉴', 'it-n0'], price: ['가격', 'it-p0'], addr2: ['찾아오는 길', 'f-addr2'], book: ['예약 방법', 'l-book'], fee: ['교습비', 'f-fee'], reg: ['중개사무소 등록번호', 'b-reg'],
    area2: ['일하는 지역', 'f-area2'], checkin: ['체크인 · 체크아웃 시간', 'f-checkin'], cuisine: ['음식 종류', 'f-cuisine'], sub: ['세부 업종', 'f-sub'] };
  function needName(k) { return NEED[k] ? NEED[k][0] : (FEAT[k] ? FEAT[k].t : k); }
  function needField(k) { return NEED[k] ? NEED[k][1] : 'f-' + k; }

  /* ---------- 손님이 AI에게 묻는 질문 ---------- */
  function questions(s) {
    var I = ind(s), F = facts(s), n = noun(s), a = s.area || parseAddr(s.addr).short || '우리 동네', nm = s.name || '이 ' + n, it0 = (s.items[0] && s.items[0].n) || (I.noEx ? '' : I.items[0]);
    var Q = [];
    function add(q, need) {
      var miss = need.filter(function (k) { return !F[k]; }), no = miss.length && miss.every(function (k) { return F._neg[k]; });
      Q.push({ q: q, need: need, st: !miss.length ? 'ok' : no ? 'no' : 'miss', ok: !miss.length || !!no, miss: no ? [] : miss });
    }
    var cu = s.cuisine && I.cuisine ? s.cuisine.split(/[,\s·]+/)[0] + ' ' : '';
    add(a + ' ' + cu + n + ' 추천해 줘', ['base', 'items']);
    var itq = String(it0).replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*진료$/, '');
    if (itq) add(a + ' 근처 ' + itq + (I.stay ? ' 있는 ' : ' 잘하는 ') + n, ['base', 'items']);
    if (I.key.indexOf('sun') >= 0 || I.key.indexOf('sat') >= 0) add(a + ' ' + (I.key.indexOf('sun') >= 0 ? '일요일에 ' : '토요일에 ') + I.open + ' ' + n, ['base', I.key.indexOf('sun') >= 0 ? 'sun' : 'sat']);
    if (I.key.indexOf('night') >= 0) add(a + ' ' + (I.med ? '야간 진료하는 ' : '늦게까지 하는 ') + n, ['base', 'night']);
    if (I.key.indexOf('early') >= 0) add(a + ' 아침 일찍 하는 ' + n, ['base', 'early']);
    I.key.forEach(function (k) { if (FEAT[k] && k !== 'reserve') add(a + ' ' + FEAT[k].q + ' ' + n, ['base', k]); });
    if (I.key.indexOf('price') >= 0) add(nm + ' ' + (itq ? itq + ' ' : '') + (I.stay ? '요금' : '가격') + ' 얼마야?', ['name', 'price']);
    if (I.fee) add(nm + ' 교습비 얼마야?', ['name', 'fee']);
    if (I.reg) add(nm + ' 등록된 중개사무소 맞아?', ['name', 'reg']);
    if (I.areaServed) add(nm + ' ' + (I.q2 || '우리 동네까지 와 줘?'), ['name', 'area2']);
    if (I.stay) add(nm + ' 체크인 몇 시야?', ['name', 'checkin']);
    add(nm + ' ' + I.hw + ' 알려 줘', ['name', 'hours']);
    add(nm + ' 예약 어떻게 해?', ['name', 'book']);
    add(nm + ' 주소랑 가는 길 알려 줘', ['name', 'addr']);
    var seen = {}; return Q.filter(function (x) { if (seen[x.q]) return false; seen[x.q] = 1; return true; }).slice(0, 12);
  }

  /* ---------- AI가 읽는 소개 문장(사실만, 입력한 것으로만) ---------- */
  /* 사장님이 적은 짧은 말을 문장으로: '걸어서 4분' → '걸어서 4분입니다.', '올라오세요' → 그대로 */
  function sent(x, tail) { x = clean(x).replace(/[.。]+$/, ''); if (!x) return ''; return /(다|요|음|함|됨|임|\))$/.test(x) ? x + '.' : x + (tail || '입니다') + '.'; }
  /* 쉬는 날 안내: '설 · 추석 당일' → '설 · 추석 당일에도 쉽니다.'(매주 쉬는 요일이 있을 때) · '…에 쉽니다.'(없을 때) */
  function offSent(x, also) { x = clean(x).replace(/[.。]+$/, ''); if (!x) return ''; return /(다|요)$/.test(x) ? x + '.' : x + (/(휴무|쉼|휴진|휴관|휴업)$/.test(x) ? '입니다' : also ? '에도 쉽니다' : '에 쉽니다') + '.'; }
  function itemsList(s, k) { return s.items.slice(0, k || 3).map(function (it) { return it.n; }); }
  function listKo(arr) { return arr.join(', '); }
  /* 편의 문장: 앞의 것은 이어 주는 꼴(…있고), 마지막은 끝맺는 꼴(…있습니다) */
  function featSentence(keys) {
    keys = keys.slice(0, 3);
    if (!keys.length) return '';
    return keys.map(function (k, i) { return i < keys.length - 1 ? FEAT[k].c : FEAT[k].a; }).join(', ') + '.';
  }
  function placeOf(s) {
    var ad = parseAddr(s.addr), region = ad.region ? ad.region.replace(/(특별자치시|특별자치도|특별시|광역시|도)$/, '') : '';
    var where = ad.locality ? (region && ad.locality.indexOf(region) !== 0 ? region + ' ' : '') + ad.locality : (ad.short || '');
    var near = s.area && where.indexOf(s.area) < 0 ? s.area + (/(역|입구|사거리|교차로)$/.test(s.area) ? ' 근처' : '') : '';
    return [where, near].filter(Boolean).join(' ');
  }
  /* AI가 읽는 소개(입력한 사실만으로, 꾸미는 말 없이). 사장님 한 줄 소개는 끝에 그대로 */
  function intro(s) {
    var I = ind(s), F = facts(s), n = noun(s), nm = (s.name || '우리 가게') + (s.branch ? ' ' + s.branch : ''), out = [], place = placeOf(s);
    out.push(jo(nm, '은', '는') + ' ' + (place ? place + '에 있는 ' : '') + (s.cuisine && I.cuisine ? s.cuisine + ' ' : '') + placeNoun(s) + '입니다.');
    var il = itemsList(s, 4);
    if (il.length) {
      var lastI = il[il.length - 1];
      if (I.menu) out.push('대표 메뉴는 ' + listKo(il) + '입니다.');
      else if (I.itemsS) out.push(I.itemsS + ' ' + listKo(il) + '입니다.');
      else if (I.stay) out.push(listKo(il.slice(0, -1).concat([jo(lastI, '이', '가')])) + ' 있습니다.');
      else out.push(listKo(il.slice(0, -1).concat([jo(lastI, '을', '를')])) + ' ' + I.itemV + '.');
    }
    var hs = hoursSentence(s);
    if (hs) out.push(hs);
    var fs = featSentence(s.feat.filter(function (k) { return k !== 'card' && k !== 'reserve'; }));
    if (fs) out.push(fs);
    if (s.links.book) out.push('예약은 온라인 예약으로 받습니다.');
    else if (F.tel && F.reserve) out.push('예약은 전화(' + s.tel + ')로 받습니다.');
    if (s.about) out.push(/[.!?]$/.test(s.about) ? s.about : s.about + '.');
    return out.join(' ');
  }

  /* ---------- 자주 묻는 질문(답은 입력한 사실로만. 답할 수 없는 질문은 '빈 질문'으로 따로) ---------- */
  var FQ = { insurance: '실손 보험 서류를 발급하나요?', auto: '교통사고 치료(자동차보험)를 하나요?', emergency: '응급 진료를 하나요?', solo: '1인샵인가요?',
    wifi: '노트북 작업하기 좋나요?', pet: '반려동물과 함께 갈 수 있나요?', group: '단체 예약이 되나요?', shuttle: '차량 운행을 하나요?', trial: '체험 수업이 있나요?', consult: '상담 예약이 되나요?',
    estimate: '방문 실측 · 견적을 받을 수 있나요?', warranty: '시공 뒤 A/S를 보증하나요?', bbq: '바비큐를 할 수 있나요?', online: '비대면으로도 되나요?', designer: '디자이너를 지정할 수 있나요?', small: '소수 정원으로 수업하나요?' };
  function faq(s) {
    var I = ind(s), F = facts(s), nm = (s.name || '우리 가게') + (s.branch ? ' ' + s.branch : ''), A = [], miss = [];
    function add(q, a, need) { if (a) A.push({ q: q, a: a }); else miss.push({ q: q, need: need }); }
    add(jo(nm, '은', '는') + ' 어떤 곳인가요?', s.name ? intro(s) : '', 'name');
    var hs = hoursSentence(s);
    add(jo(I.hw, '이', '가') + ' 어떻게 되나요?', hs ? hs + (s.off ? ' ' + offSent(s.off, F._hf.offDays.length > 0 || F._hf.holOff) : '') : '', 'hours');
    if (I.key.indexOf('sun') >= 0 || I.key.indexOf('sat') >= 0) {
      var h = hoursOf(s), w = [];
      if (h.sat.k) w.push('토요일은 ' + (h.sat.k === 'open' ? openAt(h.sat, I.openA) : '쉽니다'));
      if (h.sun.k) w.push('일요일은 ' + (h.sun.k === 'open' ? openAt(h.sun, I.openA) : '쉽니다'));
      add('주말에도 ' + I.openQ + '?', w.length ? w.join('. ') + '.' : '', h.sun.k ? 'sat' : 'sun');
    }
    var offDays = F._hf.offDays.map(function (d) { return d + '요일'; });
    if (F._hf.holOff) offDays.push('공휴일');
    if (offDays.length || s.off) add('쉬는 날은 언제인가요?', (offDays.length ? jo(offDays.join(', '), '은', '는') + ' 쉽니다.' : '') + (s.off ? (offDays.length ? ' ' : '') + offSent(s.off, offDays.length > 0) : ''), 'hours');
    add('어디에 있나요? 찾아가는 길은요?', s.addr ? '주소는 ' + s.addr + '입니다.' + (s.addr2 ? ' ' + sent(s.addr2) : '') : '', 'addr');
    var pnote = s.note && /주차/.test(s.note) ? ' ' + sent(s.note) : '';
    if (I.feat.indexOf('parking') >= 0) add('주차할 수 있나요?', F.parking ? '네, 주차할 수 있습니다.' + pnote : pnote.trim(), 'parking');
    var book = '';
    if (s.links.book) book = '예약은 온라인 예약(' + s.links.book + ')으로 받습니다.';
    else if (F.reserve && F.tel) book = '예약은 전화(' + s.tel + ')로 받습니다.';
    else if (F.reserve) book = '예약을 받습니다.';
    if (F.walkin) book = (book ? book + ' ' : '') + '예약 없이 바로 방문해도 됩니다.';
    add('예약은 어떻게 하나요?', book, 'book');
    var priced = s.items.filter(function (it) { return hasPrice(it.p); }).slice(0, 6);
    if (!I.fee && (I.key.indexOf('price') >= 0 || priced.length)) add((I.med ? '비용은 얼마인가요?' : I.stay ? '요금은 얼마인가요?' : '가격은 얼마인가요?'),
      priced.length ? priced.map(function (it) { return it.n + ' ' + it.p; }).join(', ') + '입니다.' + (I.med ? ' 진료 내용에 따라 달라질 수 있어 자세한 비용은 방문 전에 확인해 주세요.' : '') : '', 'price');
    if (I.fee) add('교습비는 얼마인가요?', s.fee ? (/(다|요)[.]?$/.test(s.fee) ? s.fee.replace(/[.]$/, '') + '.' : '교습비는 ' + s.fee.replace(/[.]$/, '') + '입니다.') : '', 'fee');
    if (I.reg) add('중개사무소 정보를 알려 주세요.', s.biz.reg ? '중개사무소 이름은 ' + (s.name || '') + ', 등록번호는 ' + s.biz.reg + (s.biz.owner ? ', 개업공인중개사는 ' + s.biz.owner : '') + '입니다.' + (s.addr ? ' 소재지는 ' + s.addr + '입니다.' : '') + (s.tel ? ' 연락처는 ' + s.tel + '입니다.' : '') : '', 'reg');
    if (I.areaServed) add('어느 지역까지 가나요?', s.area2 ? s.area2.replace(/[.]$/, '') + '에서 일합니다.' : '', 'area2');
    if (I.stay) add('체크인 · 체크아웃 시간은요?', (s.checkin ? '체크인은 ' + s.checkin + '부터' : '') + (s.checkout ? (s.checkin ? ', ' : '') + '체크아웃은 ' + s.checkout + '까지' : '') + (s.checkin || s.checkout ? '입니다.' : ''), 'checkin');
    I.key.forEach(function (k) { if (FQ[k]) add(FQ[k], F[k] ? '네, ' + FEAT[k].a + '.' : '', k); });
    I.feat.forEach(function (k) { if (FQ[k] && I.key.indexOf(k) < 0 && F[k]) add(FQ[k], '네, ' + FEAT[k].a + '.', k); });
    if (F.card) add('카드로 낼 수 있나요?', '네, ' + FEAT.card.a + '.', 'card');
    return { list: A.slice(0, 15), miss: miss };
  }

  /* ---------- AI 검색 준비도(100점, 입력한 정보로 계산하는 준비 상태. 노출을 약속하지 않음) ---------- */
  function score(s) {
    var I = ind(s), F = facts(s), hf = F._hf, parts = [];
    function part(k, name, max, got, tips) { parts.push({ k: k, name: name, max: max, got: Math.max(0, Math.min(max, Math.round(got))), tips: tips.filter(Boolean) }); }
    part('base', '기본 정보', 25, (s.name ? 5 : 0) + (F.addr ? 10 : (s.addr ? 4 : 0)) + (F.tel ? 5 : 0) + (s.area ? 5 : 0) - (I.subReq && !s.sub ? 5 : 0),
      [I.subs && !s.sub && 'sub', !s.name && 'name', !F.addr && 'addr', !F.tel && 'tel', !s.area && 'area']);
    part('hours', I.hw, 15, (hf.any ? 8 : 0) + (hf.known === 7 ? 4 : hf.known >= 5 ? 2 : 0) + ((F.hol || s.off || s.brk) ? 3 : 0),
      [!hf.any && 'hours', hf.any && hf.known < 7 && 'week', !(F.hol || s.off || s.brk) && 'hol']);
    var pr = F._pr, ni = s.items.length;
    part('items', I.itemsT, 15, (ni >= 3 ? 7 : ni ? 4 : 0) + (I.fee ? (s.fee ? 8 : 0) : (pr ? 5 : 0) + (pr >= 3 ? 3 : 0)), [!ni && 'items', !pr && !I.fee && 'price', I.fee && !s.fee && 'fee']);
    var keys = I.key.filter(function (k) { return FEAT[k] || NEED[k]; }), okn = keys.filter(function (k) { return F[k] || F._neg[k]; }).length;
    part('ask', '손님 질문에 답할 정보', 20, keys.length ? 20 * okn / keys.length + (s.note ? 2 : 0) : 20, keys.filter(function (k) { return !F[k] && !F._neg[k]; }));
    var L = s.links;
    part('where', '찾을 수 있는 곳', 15, (L.place ? 5 : 0) + ((L.kakao || L.google) ? 4 : 0) + ((L.home || L.insta || L.blog) ? 3 : 0) + (L.book ? 3 : (F.tel ? 1 : 0)),
      [!L.place && 'l-place', !(L.kakao || L.google) && 'l-kakao', !(L.home || L.insta || L.blog) && 'l-insta', !L.book && 'l-book']);
    part('trust', '소개와 신뢰', 10, (s.about ? 4 : 0) + ((s.biz.owner || s.biz.no) ? 3 : 0) + (I.reg ? (s.biz.reg ? 3 : 0) : (s.addr2 ? 3 : 0)),
      [!s.about && 'about', !(s.biz.owner || s.biz.no) && 'b-owner', I.reg ? (!s.biz.reg && 'reg') : (!s.addr2 && 'addr2')]);
    var total = parts.reduce(function (t, p) { return t + p.got; }, 0);
    var grade = total >= 90 ? { k: 'a', t: 'AI가 답할 준비가 되었습니다' } : total >= 70 ? { k: 'b', t: 'AI가 대부분 답할 수 있습니다' } : total >= 40 ? { k: 'c', t: 'AI가 일부만 답할 수 있습니다' } : { k: 'd', t: 'AI가 우리 가게를 잘 모릅니다' };
    return { total: total, grade: grade, parts: parts };
  }
  var TIP = { 'l-place': ['네이버 플레이스 주소', 'l-place'], 'l-kakao': ['카카오맵 · 구글 지도 주소', 'l-kakao'], 'l-insta': ['홈페이지 · 인스타그램 · 블로그', 'l-insta'], 'l-book': ['예약 링크', 'l-book'], about: ['사장님 한 줄 소개', 'f-about'], 'b-owner': ['대표자 · 사업자 정보', 'b-owner'] };
  function tipName(k) { return TIP[k] ? TIP[k][0] : needName(k); }
  function tipField(k) { return TIP[k] ? TIP[k][1] : needField(k); }

  /* ---------- 구조화 데이터(JSON-LD) ---------- */
  function offers(s) {
    return s.items.map(function (it) {
      var o = { '@type': 'Offer', itemOffered: { '@type': 'Service', name: it.n } }, p = parsePrice(it.p);
      if (it.d) o.itemOffered.description = it.d;
      if (p && p.free) { o.price = '0'; o.priceCurrency = 'KRW'; }
      else if (p && p.v && !p.from) { o.price = String(p.v); o.priceCurrency = 'KRW'; }
      else if (p && (p.min || p.v)) o.priceSpecification = { '@type': 'PriceSpecification', minPrice: p.min || p.v, maxPrice: p.max || undefined, priceCurrency: 'KRW' };
      return o;
    });
  }
  function prune(o) {
    if (Array.isArray(o)) return o.map(prune).filter(function (x) { return x !== undefined && x !== '' && !(Array.isArray(x) && !x.length); });
    if (o && typeof o === 'object') { var r = {}; Object.keys(o).forEach(function (k) { var v = prune(o[k]); if (v !== undefined && v !== '' && v !== null && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) r[k] = v; }); return r; }
    return o;
  }
  function jsonld(s, o) {
    o = o || {};
    var I = ind(s), ad = parseAddr(s.addr), pageUrl = o.url || '', id = pageUrl + '#store', F = facts(s);
    var biz = { '@type': typeOf(s), '@id': id, name: s.name + (s.branch ? ' ' + s.branch : ''), description: intro(s), url: s.links.home || pageUrl || undefined,
      telephone: intlTel(s.tel) || undefined, address: s.addr ? { '@type': 'PostalAddress', streetAddress: ad.street || ad.full, addressLocality: ad.locality || undefined, addressRegion: ad.region || undefined, addressCountry: 'KR' } : undefined,
      areaServed: s.area2 ? s.area2.split(/[,·]/).map(function (x) { return clean(x); }).filter(Boolean) : undefined,
      openingHoursSpecification: hoursSpec(s), hasMap: s.links.place || s.links.kakao || s.links.google || undefined,
      sameAs: uniq([s.links.place, s.links.kakao, s.links.google, s.links.insta, s.links.blog, s.links.youtube, s.links.kakaoch, s.links.home && pageUrl && s.links.home !== pageUrl ? s.links.home : '']),
      amenityFeature: s.feat.map(function (k) { return { '@type': 'LocationFeatureSpecification', name: FEAT[k].t, value: true }; }) };
    if (I.menu) {
      biz.hasMenu = s.items.length ? { '@type': 'Menu', hasMenuSection: [{ '@type': 'MenuSection', name: '대표 메뉴', hasMenuItem: s.items.map(function (it) { var p = parsePrice(it.p), mi = { '@type': 'MenuItem', name: it.n, description: it.d || undefined }; if (p && p.v) mi.offers = { '@type': 'Offer', price: String(p.v), priceCurrency: 'KRW' }; return mi; }) }] } : undefined;
      biz.acceptsReservations = F.reserve ? true : undefined;
      if (I.cuisine && s.cuisine) biz.servesCuisine = s.cuisine.split(/[,·]/).map(function (x) { return clean(x); }).filter(Boolean);
    } else if (s.items.length) biz.hasOfferCatalog = { '@type': 'OfferCatalog', name: I.itemsT, itemListElement: offers(s) };
    if (I.med) { var sp = []; s.items.concat([{ n: s.name }]).forEach(function (it) { SPEC.forEach(function (x) { if (x[0].test(it.n)) sp.push('https://schema.org/' + x[1]); }); }); if (I.spec) sp.unshift('https://schema.org/' + I.spec); if (s.ind === 'dental') sp.unshift('https://schema.org/Dentistry'); biz.medicalSpecialty = uniq(sp); }
    if (I.stay) { biz.checkinTime = s.checkin || undefined; biz.checkoutTime = s.checkout || undefined; biz.petsAllowed = F.pet ? true : undefined; }
    if (I.reg && s.biz.reg) biz.identifier = { '@type': 'PropertyValue', name: '중개사무소 등록번호', value: s.biz.reg };
    if (s.biz.owner) biz.employee = { '@type': 'Person', name: s.biz.owner, jobTitle: I.reg ? '개업공인중개사' : '대표' };
    if (s.biz.no) biz.taxID = s.biz.no;
    if (s.links.book) biz.potentialAction = { '@type': 'ReserveAction', target: { '@type': 'EntryPoint', urlTemplate: s.links.book, inLanguage: 'ko-KR' }, name: '예약하기' };
    var priced = s.items.map(function (it) { return parsePrice(it.p); }).filter(function (p) { return p && !p.free; }), lo = Infinity, hi = 0;
    priced.forEach(function (p) { lo = Math.min(lo, p.min || p.v); hi = Math.max(hi, p.max || p.v); });
    if (priced.length && isFinite(lo)) biz.priceRange = lo === hi ? '₩' + lo.toLocaleString('en-US') : '₩' + lo.toLocaleString('en-US') + '~₩' + hi.toLocaleString('en-US');
    var graph = [biz], fq = faq(s).list;
    if (fq.length >= 2) graph.push({ '@type': 'FAQPage', '@id': pageUrl + '#faq', mainEntity: fq.map(function (x) { return { '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } }; }) });
    if (pageUrl) graph.push({ '@type': 'WebPage', '@id': pageUrl + '#page', url: pageUrl, name: title(s), inLanguage: 'ko-KR', about: { '@id': id }, dateModified: s.updated || undefined,
      isPartOf: o.hosted ? { '@type': 'WebSite', '@id': SITE + '#site', name: 'AIMarker', url: SITE } : undefined });
    return prune({ '@context': 'https://schema.org', '@graph': graph });
  }
  function title(s) { var a = s.area || parseAddr(s.addr).short; return (s.name || '우리 가게') + (s.branch ? ' ' + s.branch : '') + ' · ' + (a ? a + ' ' : '') + noun(s) + ' | ' + ind(s).hw + ' · 위치 · ' + (ind(s).med ? '진료 안내' : '예약'); }

  /* ---------- llms.txt · robots.txt ---------- */
  function llms(s, o) {
    o = o || {};
    var I = ind(s), q = faq(s).list, L = s.links, lines = ['# ' + (s.name || '우리 가게') + (s.branch ? ' ' + s.branch : ''), '', '> ' + intro(s), '', '## 기본 정보', '- 업종: ' + noun(s) + (s.cuisine ? ' (' + s.cuisine + ')' : '')];
    if (s.addr) lines.push('- 주소: ' + s.addr + (s.addr2 ? ' (' + s.addr2 + ')' : ''));
    if (s.tel) lines.push('- 전화: ' + s.tel);
    var ht = hoursText(s); if (ht) lines.push('- ' + I.hw + ': ' + ht);
    if (s.off) lines.push('- 쉬는 날: ' + s.off);
    if (s.feat.length) lines.push('- 편의: ' + s.feat.map(function (k) { return FEAT[k].t; }).join(', '));
    if (s.biz.reg) lines.push('- 중개사무소 등록번호: ' + s.biz.reg + (s.biz.owner ? ' (개업공인중개사 ' + s.biz.owner + ')' : ''));
    if (s.fee) lines.push('- 교습비: ' + s.fee);
    if (s.area2) lines.push('- 일하는 지역: ' + s.area2);
    if (s.items.length) { lines.push('', '## ' + I.itemsT); s.items.forEach(function (it) { lines.push('- ' + it.n + (it.p ? ': ' + it.p : '') + (it.d ? ' (' + it.d + ')' : '')); }); }
    if (q.length) { lines.push('', '## 자주 묻는 질문'); q.slice(1).forEach(function (x) { lines.push('- Q: ' + x.q + ' A: ' + x.a); }); }
    var lk = [['예약', L.book], ['네이버 플레이스', L.place], ['카카오맵', L.kakao], ['구글 지도', L.google], ['홈페이지', L.home], ['인스타그램', L.insta], ['블로그', L.blog]].filter(function (x) { return x[1]; });
    if (lk.length || o.url) { lines.push('', '## 링크'); if (o.url) lines.push('- [가게 정보 페이지](' + o.url + ')'); lk.forEach(function (x) { lines.push('- [' + x[0] + '](' + x[1] + ')'); }); }
    lines.push('', '정보 확인: ' + (s.updated || '입력한 날') + ', 가게가 직접 확인한 정보입니다.');
    return lines.join('\n') + '\n';
  }
  var BOTS = [['OAI-SearchBot', 'ChatGPT 검색'], ['ChatGPT-User', 'ChatGPT 사용자 요청'], ['PerplexityBot', 'Perplexity 검색'], ['Perplexity-User', 'Perplexity 사용자 요청'], ['Claude-SearchBot', 'Claude 검색'], ['Claude-User', 'Claude 사용자 요청'], ['Googlebot', '구글 검색 · AI 개요'], ['Bingbot', '빙 검색 · Copilot'], ['Yeti', '네이버 검색 · AI 브리핑'], ['Daumoa', '다음 검색']];
  function robots() { return '# AI 검색 · 답변 크롤러 허용(AIMarker 가게 AI 검색 등록)\n# 이미 robots.txt 가 있으면 이 줄들을 더하세요. 학습용 크롤러(GPTBot · Google-Extended 등) 허용은 따로 정하면 됩니다.\n' + BOTS.map(function (b) { return '\n# ' + b[1] + '\nUser-agent: ' + b[0] + '\nAllow: /'; }).join('\n') + '\n'; }

  /* ---------- 정보 맞춤 목록(어디서나 같은 사실) ---------- */
  function checklist(s) {
    var ht = hoursText(s), same = ['이름 ' + (s.name || '(가게 이름)'), '주소 ' + (s.addr || '(도로명 주소)'), '전화 ' + (s.tel || '(전화번호)'), ind(s).hw + ' ' + (ht || '(요일별 시간)')];
    var L = s.links;
    return [
      { k: 'place', t: '네이버 플레이스(스마트플레이스)', done: !!L.place, href: 'https://new.smartplace.naver.com/', d: '네이버 AI 브리핑은 플레이스 정보와 리뷰를 요약합니다. 아래 값과 똑같이 맞추고, 대표 메뉴 · 가격 · 편의 정보 칸을 빠짐없이 채우세요.', same: same },
      { k: 'kakao', t: '카카오맵', done: !!L.kakao, href: 'https://map.kakao.com/', d: '카카오맵 장소 정보에서 사장님 인증을 하고 같은 값으로 맞춥니다.', same: same },
      { k: 'google', t: '구글 비즈니스 프로필', done: !!L.google, href: 'https://business.google.com/', d: '구글 지도와 AI 개요, 제미나이가 참고합니다. 영업시간과 카테고리, 웹사이트 칸을 채우세요.', same: same },
      { k: 'insta', t: '인스타그램 · 블로그 프로필', done: !!(L.insta || L.blog), href: '', d: '프로필 소개에 주소 · 영업시간 · 예약 방법을 같은 말로 한 줄 적습니다.', same: same.slice(0, 2) },
      { k: 'home', t: '홈페이지가 있다면', done: !!L.home, href: 'https://searchadvisor.naver.com/', d: '구조화 데이터와 자주 묻는 질문을 붙이고 llms.txt 를 올린 뒤 네이버 서치어드바이저 · 구글 서치 콘솔 · 빙 웹마스터에 등록합니다.', same: [] },
      { k: 'review', t: '최근 리뷰에 답글', done: false, href: '', d: 'AI는 리뷰를 요약해 답합니다. 답글에 주차 · 예약 · 영업시간 같은 사실을 짧게 보태면 답이 정확해집니다.', same: [] }
    ];
  }

  /* ---------- AI 가게 페이지(HTML 한 장, 스크립트 없음) ---------- */
  var PCSS = 'body{margin:0;background:#F6F8FB;color:#0B1733;font:16px/1.65 "Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;word-break:keep-all}' +
    'a{color:#0B63F6}.w{max-width:760px;margin:0 auto;padding:24px 16px 40px}.hd{background:#fff;border:1px solid #E3E7EE;border-radius:16px;padding:24px}' +
    '.k{display:inline-flex;gap:6px;align-items:center;margin:0 0 10px;padding:3px 10px;border-radius:999px;background:#F3F7FF;color:#0952D6;font-size:12.5px;font-weight:700}' +
    'h1{margin:0;font-size:28px;line-height:1.25;letter-spacing:-.02em}.sub{margin:6px 0 0;color:#4B566F;font-size:15px}.lead{margin:14px 0 0;font-size:16px;color:#273250}' +
    '.acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.acts a{display:inline-flex;align-items:center;height:42px;padding:0 16px;border-radius:10px;border:1px solid #D0D6E1;background:#fff;color:#0B1733;font-weight:600;text-decoration:none;font-size:15px}.acts a.p{background:#0B63F6;border-color:#0B63F6;color:#fff}' +
    'section{margin-top:14px;background:#fff;border:1px solid #E3E7EE;border-radius:16px;padding:20px 22px}h2{margin:0 0 12px;font-size:18px;letter-spacing:-.01em}' +
    'table{width:100%;border-collapse:collapse;font-size:15px}th,td{padding:9px 6px;border-bottom:1px solid #EEF1F5;text-align:left;vertical-align:top}th{width:34%;color:#4B566F;font-weight:600}tr:last-child th,tr:last-child td{border-bottom:0}' +
    '.tags{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}.tags li{padding:4px 10px;border-radius:999px;background:#E8F6EF;color:#07734E;font-size:13.5px;font-weight:600}' +
    'details{border-bottom:1px solid #EEF1F5}details:last-child{border-bottom:0}summary{cursor:pointer;padding:12px 0;font-weight:600}details p{margin:0 0 12px;color:#273250}' +
    '.links{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin:0;padding:0;list-style:none}.links a{display:block;padding:10px 12px;border:1px solid #E3E7EE;border-radius:10px;text-decoration:none;font-weight:600;font-size:14.5px;color:#0B1733}' +
    '.warn{margin:12px 0 0;font-size:13px;color:#66718A}.ft{margin-top:18px;font-size:12.5px;color:#66718A;text-align:center}.ft a{color:#4B566F}' +
    '@media(max-width:560px){h1{font-size:24px}.hd,section{padding:18px 16px}th{width:38%}}';
  function page(s, o) {
    o = o || {};
    var I = ind(s), ad = parseAddr(s.addr), ttl = title(s), it = intro(s), L = s.links, fq = faq(s).list, ld = jsonld(s, o), up = s.updated || '';
    var tel = s.tel ? '<a class="p" href="tel:' + esc(s.tel.replace(/[^\d+]/g, '')) + '">전화하기 ' + esc(s.tel) + '</a>' : '';
    var mapU = L.place || L.kakao || L.google || (s.addr ? 'https://map.naver.com/p/search/' + encodeURIComponent(s.addr) : '');
    var acts = [L.book ? '<a class="p" href="' + esc(L.book) + '" rel="noopener">예약하기</a>' : '', tel.replace(L.book ? ' class="p"' : '', ''), mapU ? '<a href="' + esc(mapU) + '" rel="noopener">지도 · 길찾기</a>' : ''].filter(Boolean).join('');
    var h = hoursOf(s), rows = DAYS.concat(['hol']).filter(function (d) { return h[d].k; }).map(function (d) { return '<tr><th scope="row">' + (d === 'hol' ? '공휴일' : DKO[d] + '요일') + '</th><td>' + (h[d].k === 'off' ? '쉼' : esc(h[d].s)) + '</td></tr>'; }).join('');
    if (s.brk) rows += '<tr><th scope="row">' + esc(I.brkWord || '쉬는 시간') + '</th><td>' + esc(s.brk.replace(/\s*-\s*/, '~')) + '</td></tr>';
    if (s.off) rows += '<tr><th scope="row">쉬는 날</th><td>' + esc(s.off) + '</td></tr>';
    var items = s.items.map(function (x) { return '<tr><th scope="row">' + esc(x.n) + '</th><td>' + (x.p ? esc(x.p) : '문의') + (x.d ? '<br><small>' + esc(x.d) + '</small>' : '') + '</td></tr>'; }).join('');
    var feats = s.feat.map(function (k) { return '<li>' + esc(FEAT[k].t) + '</li>'; }).join('');
    var info = [['주소', s.addr], ['찾아오는 길', s.addr2], ['전화', s.tel], [I.stay ? '체크인 · 체크아웃' : '', I.stay && (s.checkin || s.checkout) ? (s.checkin || '-') + ' / ' + (s.checkout || '-') : ''], ['음식 종류', I.cuisine ? s.cuisine : ''], ['교습비', s.fee], ['일하는 지역', s.area2],
      ['중개사무소 등록번호', s.biz.reg], [I.reg ? '개업공인중개사' : '대표', s.biz.owner], ['사업자등록번호', s.biz.no]].filter(function (x) { return x[0] && x[1]; }).map(function (x) { return '<tr><th scope="row">' + esc(x[0]) + '</th><td>' + esc(x[1]) + '</td></tr>'; }).join('');
    var links = [['예약', L.book], ['네이버 플레이스', L.place], ['카카오맵', L.kakao], ['구글 지도', L.google], ['홈페이지', L.home], ['인스타그램', L.insta], ['블로그', L.blog], ['카카오톡 채널', L.kakaoch], ['유튜브', L.youtube]].filter(function (x) { return x[1]; }).map(function (x) { return '<li><a href="' + esc(x[1]) + '" rel="noopener">' + esc(x[0]) + '</a></li>'; }).join('');
    var faqH = fq.slice(1).map(function (x) { return '<details><summary>' + esc(x.q) + '</summary><p>' + esc(x.a) + '</p></details>'; }).join('');
    var canon = o.url ? '<link rel="canonical" href="' + esc(o.url) + '">' : '';
    var robotsMeta = o.noindex ? '<meta name="robots" content="noindex">' : '';
    var desc = it.length > 150 ? it.slice(0, 148) + '…' : it;
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>' + esc(ttl) + '</title><meta name="description" content="' + esc(desc) + '">' + canon + robotsMeta +
      '<meta property="og:type" content="website"><meta property="og:title" content="' + esc(ttl) + '"><meta property="og:description" content="' + esc(desc) + '">' + (o.url ? '<meta property="og:url" content="' + esc(o.url) + '">' : '') + '<meta property="og:locale" content="ko_KR">' +
      '<meta name="generator" content="AIMarker 가게 AI 검색 등록 ' + VER + '">' +
      '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script><style>' + PCSS + '</style></head><body><main class="w">' +
      '<header class="hd"><p class="k">' + (up ? '가게가 확인한 정보 · ' + esc(up.replace(/-/g, '.')) + ' 기준' : '가게가 확인한 정보') + '</p><h1>' + esc((s.name || '우리 가게') + (s.branch ? ' ' + s.branch : '')) + '</h1>' +
      '<p class="sub">' + esc([ad.locality || ad.short, s.area, (s.cuisine && I.cuisine ? s.cuisine + ' ' : '') + noun(s)].filter(Boolean).join(' · ')) + '</p><p class="lead">' + esc(it) + '</p>' + (acts ? '<div class="acts">' + acts + '</div>' : '') + '</header>' +
      (rows ? '<section aria-labelledby="t-h"><h2 id="t-h">' + esc(I.hw) + '</h2><table><tbody>' + rows + '</tbody></table></section>' : '') +
      (items ? '<section aria-labelledby="t-i"><h2 id="t-i">' + esc(I.itemsT) + '</h2><table><tbody>' + items + '</tbody></table>' + (I.med ? '<p class="warn">진료 내용에 따라 비용이 달라질 수 있습니다. 자세한 비용은 내원 전에 확인해 주세요.</p>' : '') + '</section>' : '') +
      (feats ? '<section aria-labelledby="t-f"><h2 id="t-f">편의 · 안내</h2><ul class="tags">' + feats + '</ul>' + (s.note ? '<p class="warn">' + esc(s.note) + '</p>' : '') + '</section>' : '') +
      (faqH ? '<section aria-labelledby="t-q"><h2 id="t-q">자주 묻는 질문</h2>' + faqH + '</section>' : '') +
      (info ? '<section aria-labelledby="t-a"><h2 id="t-a">위치와 정보</h2><table><tbody>' + info + '</tbody></table></section>' : '') +
      (links ? '<section aria-labelledby="t-l"><h2 id="t-l">바로 가기</h2><ul class="links">' + links + '</ul></section>' : '') +
      '<p class="ft">이 페이지의 정보는 ' + esc(jo(s.name || '가게', '이', '가')) + ' ' + (up ? esc(up.replace(/-/g, '.')) + '에 직접 확인했습니다' : '직접 확인했습니다') + '. 바뀐 정보가 있으면 가게로 알려 주세요.' +
      (o.hosted ? '<br>만든 곳 <a href="' + SITE + 'local/">AIMarker 가게 AI 검색 등록</a>' : '') + '</p></main></body></html>\n';
  }

  /* 가게 정보 파일(내려받기 · 주문할 때 회신) */
  function fileOf(s) { var o = JSON.parse(JSON.stringify(s)); o.kind = 'aimarker-store'; o.engine = VER; return JSON.stringify(o, null, 2) + '\n'; }

  return { VER: VER, SITE: SITE, IND: IND, ORDER: ORDER, FEAT: FEAT, DAYS: DAYS, DKO: DKO, esc: esc, jo: jo, roman: roman, slug: slug, parseAddr: parseAddr, parsePrice: parsePrice,
    normalize: normalize, facts: facts, questions: questions, intro: intro, faq: faq, score: score, jsonld: jsonld, title: title, llms: llms, robots: robots, checklist: checklist,
    page: page, fileOf: fileOf, hoursText: hoursText, noun: noun, typeOf: typeOf, hasPrice: hasPrice, intlTel: intlTel, tipName: tipName, tipField: tipField, needName: needName, needField: needField, BOTS: BOTS };
});
