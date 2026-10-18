/* AIMarker 공통 화면 조각: 점검 결과 그리기 · 고치기 · 해시 (검사 · 작업 공간 · 승인 화면이 함께 씀) */
(function () {
  'use strict';
  var U = window.AMUI = {};
  U.CATS = { 1: 'AI 사용 근거 · 표시', 2: '가상인물 · 딥페이크', 3: '업종별 금지 · 과장', 4: '추천 · 보증(뒷광고)', 5: '저작권 · 초상권', 6: '브랜드 가이드' };
  U.LV = { 3: { k: 'high', t: '높음' }, 2: { k: 'mid', t: '주의' }, 1: { k: 'info', t: '참고' } };
  U.DEC = {
    fix: { t: '수정 후 출고', s: '높음 후보를 고친 뒤 내보내세요', c: 'hi' },
    expert: { t: '전문가 검토 권장', s: '규제가 엄한 표현이 있어 전문가 확인을 권합니다', c: 'hi' },
    review: { t: '확인 후 출고', s: '주의 후보를 확인하고 내보내세요', c: 'mid' },
    clear: { t: '큰 위험 후보 없음', s: '참고 사항만 확인하세요(안전을 보증하지는 않습니다)', c: 'ok' }
  };
  U.IND = { auto: '업종 자동', gen: '일반 상품 · 서비스', food: '일반식품', hfood: '건강기능식품', cos: '화장품', med: '의료 · 병원', fin: '금융 · 대출 · 투자' };
  U.CH = ['인스타그램', '유튜브', '네이버 블로그', '상세페이지', '배너 · 디스플레이', '검색 광고', '틱톡 · 쇼츠', '보도자료', '기타'];
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  U.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); };
  U.ico = function (p, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
  U.I = {
    check: '<path d="M20 6 9 17l-5-5"/>', alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>', up: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    down: '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
    wand: '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
    scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>'
  };
  U.num = function (n) { return Number(n || 0).toLocaleString('ko-KR'); };
  U.when = function (t) {
    if (!t) return '';
    var d = new Date(t), s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return '방금 전'; if (s < 3600) return Math.floor(s / 60) + '분 전'; if (s < 86400) return Math.floor(s / 3600) + '시간 전';
    return (d.getMonth() + 1) + '.' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  U.stamp = function (t) { var d = new Date(t); return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  /* 점수 고리 */
  U.ring = function (score, size) {
    var s = Math.max(0, Math.min(100, Math.round(score || 0))), r = 26, c = 2 * Math.PI * r, col = s >= 50 ? '#E5484D' : s >= 20 ? '#E59A1A' : '#12A56F';
    return '<span class="ring" style="--rc:' + col + '" title="출고 위험 점수 ' + s + '"><svg viewBox="0 0 64 64" width="' + (size || 64) + '" height="' + (size || 64) + '" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="7"/>' +
      '<circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (c * s / 100).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 32 32)"/></svg><b>' + s + '</b></span>';
  };

  /* 문구에 표시(겹치면 앞의 것만) */
  U.highlight = function (text, findings) {
    var spans = (findings || []).map(function (f, i) { return { s: f.s, e: f.e, lv: f.lv, i: i }; }).filter(function (x) { return x.s >= 0 && x.e > x.s; })
      .sort(function (a, b) { return a.s - b.s || b.lv - a.lv; });
    var out = '', at = 0;
    spans.forEach(function (x) {
      if (x.s < at) return;
      out += U.esc(text.slice(at, x.s)) + '<mark class="' + U.LV[x.lv].k + '" data-i="' + x.i + '" tabindex="0">' + U.esc(text.slice(x.s, x.e)) + '</mark>';
      at = x.e;
    });
    return out + U.esc(text.slice(at));
  };

  /* 후보 한 개 */
  U.finding = function (f, i, o) {
    o = o || {};
    var lv = U.LV[f.lv] || U.LV[1], reps = (f.reps || []).filter(function (r) { return r; });
    var fix = '';
    if (o.fix !== false && reps.length) {
      fix = '<div class="fix"><span>' + (f.s >= 0 ? '바꾸기' : '넣기') + '</span>' + reps.slice(0, 3).map(function (r, j) {
        var label = r === '(삭제)' ? '이 표현 빼기' : r.trim();
        return '<button type="button" data-fix="' + i + ':' + j + '">' + U.esc(label) + '</button>';
      }).join('') + '</div>';
    }
    var fb = o.fb ? '<span class="fbk"><button type="button" data-fb="' + i + ':ok" title="맞는 판정이에요" aria-label="맞는 판정">' + U.ico(U.I.up) + '</button><button type="button" data-fb="' + i + ':bad" title="틀린 판정이에요" aria-label="틀린 판정">' + U.ico(U.I.down) + '</button></span>' : '';
    return '<div class="fd" data-f="' + i + '"><div class="fd-h"><span class="sv ' + lv.k + '">' + lv.t + '</span><span class="cat">' + U.esc(U.CATS[f.cat] || '') + '</span>' +
      (f.t ? '<q>' + U.esc(f.t) + '</q>' : '<b>필수 표시</b>') + fb + '</div><p>' + U.esc(f.why) + '</p>' + (f.tip ? '<p class="tip">' + U.esc(f.tip) + '</p>' : '') +
      (f.law ? '<div class="law">' + U.ico(U.I.scale, 'ico-s') + U.esc(f.law) + '</div>' : '') + fix + '</div>';
  };

  /* 고치기: 자리 있는 것은 그 자리를, 필수 표시는 앞 · 뒤에 */
  U.applyFix = function (text, f, rep) {
    if (rep == null) return text;
    if (f.s >= 0) {
      var cur = text.slice(f.s, f.e), a = f.s, b = f.re && f.re >= f.e ? f.re : f.e;
      if (cur !== f.t) return text;   // 이미 바뀐 글
      if (rep === '(삭제)') {   // 빼기: 뒤(없으면 앞)의 빈칸도 함께
        var b0 = b; while (b < text.length && /[ \t]/.test(text.charAt(b))) b++;
        if (b === b0) while (a > 0 && /[ \t]/.test(text.charAt(a - 1))) a--;
        return text.slice(0, a) + text.slice(b);
      }
      return (text.slice(0, a) + rep + text.slice(b)).replace(/[ \t]{2,}/g, ' ').replace(/ ([,.!?])/g, '$1');
    }
    if (/^[\[(]/.test(rep)) { var m = /^\s*/.exec(text)[0]; if (text.indexOf(rep.trim()) >= 0) return text; return m + rep + text.slice(m.length); }
    if (text.indexOf(rep.trim()) >= 0) return text;
    return text.replace(/\s+$/, '') + rep;
  };
  /* 한 번에: 바꿀 말이 있는 것(빼기 제외)과 필수 표시만. 뒤에서부터 */
  U.applyAll = function (text, findings) {
    var span = findings.filter(function (f) { return f.s >= 0 && (f.reps || []).some(function (r) { return r && r !== '(삭제)'; }); }).sort(function (a, b) { return b.s - a.s; });
    var n = 0, at = Infinity;
    span.forEach(function (f) { if ((f.re || f.e) > at) return; var rep = f.reps.filter(function (r) { return r && r !== '(삭제)'; })[0]; var t2 = U.applyFix(text, f, rep); if (t2 !== text) { text = t2; n++; at = f.s; } });
    findings.filter(function (f) { return f.s < 0 && f.reps && f.reps[0]; }).forEach(function (f) { var t2 = U.applyFix(text, f, f.reps[0]); if (t2 !== text) { text = t2; n++; } });
    return { text: text, n: n };
  };

  /* 범주별 셈 */
  U.catCounts = function (findings) {
    var c = {}; for (var k = 1; k <= 6; k++) c[k] = { 3: 0, 2: 0, 1: 0, n: 0 };
    (findings || []).forEach(function (f) { var x = c[f.cat]; if (x) { x[f.lv]++; x.n++; } });
    return c;
  };

  /* 결과 머리(점수 · 결정 · 셈) */
  U.summary = function (r) {
    var d = U.DEC[r.decision] || U.DEC.clear, c = r.counts || { high: 0, mid: 0, info: 0 };
    return '<div class="sum3">' + U.ring(r.score) + '<div><b class="dec ' + d.c + '">' + d.t + '</b><small>' + d.s + '</small>' +
      '<div class="cnt"><span class="sv high">높음 ' + c.high + '</span><span class="sv mid">주의 ' + c.mid + '</span><span class="sv info">참고 ' + c.info + '</span>' +
      (r.indName ? '<span class="sv ind">' + U.esc(r.indName) + (r.auto ? ' · 자동' : '') + '</span>' : '') + '</div></div></div>';
  };

  /* SHA-256(16진수) */
  U.sha256 = function (str) {
    if (!(window.crypto && crypto.subtle)) return Promise.resolve('');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(str))).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  };
  /* 키 순서를 맞춘 JSON(같은 내용이면 같은 해시) */
  U.canon = function (o) {
    if (Array.isArray(o)) return '[' + o.map(U.canon).join(',') + ']';
    if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + U.canon(o[k]); }).join(',') + '}';
    return JSON.stringify(o === undefined ? null : o);
  };
  /* 이 브라우저의 구분 번호(남용 막기용, 사람 정보 아님) */
  U.cid = function () {
    var k = 'am_cid', v = '';
    try { v = localStorage.getItem(k) || ''; if (!v) { v = 'c' + Math.random().toString(36).slice(2, 12); localStorage.setItem(k, v); } } catch (e) { v = 'c-anon'; }
    return v;
  };
})();
