/* AIMarker 일괄 확인 리포트(aim-report) 1.0 · 브라우저 · Node 공용 · 의존성 없음
 * 판정 결과(am.analyze · am.analyzebatch)를 모아 '콘텐츠 n건 AI 사용 확인 리포트'를 만든다.
 * 하는 일: 근거 등급별로 나누기 · 바로 표시할 수 있는 비율 · 도구 · 서명자 분포 · 확인할 점
 *  (지금 표시와 근거가 다른 것, 같은 · 비슷한 이미지인데 근거가 다른 것, 출처 기록이 파일과 맞지 않는 것) · CSV · 혼자 열리는 HTML.
 * 판정은 서버가 하고, 이 파일은 정리만 한다(새 판정을 만들지 않음). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AIMReport = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0';
  var LABEL = { ai_generated: 'AI 생성', ai_edited: 'AI 편집 · 합성', ai_assisted: 'AI 보조', no_ai: 'AI 미사용', none: '표시 없음' };
  var BASIS = { verified: '서명 검증', record: '파일 기록', declared: '발급자 신고', none: '근거 없음' };
  var SCOPE = { generated: 'AI로 생성', edited: 'AI로 편집 · 합성', enhanced: 'AI로 보정' };
  var KIND = { image: '이미지', video: '영상', audio: '오디오', doc: '문서', text: '글', other: '기타' };
  var CAT = {
    ai_verified: { t: 'AI 사용 · 서명 검증', s: 'AI 사용', b: '서명 검증', c: '#0E2A6B', d: 'C2PA 출처 기록의 전자서명을 서버가 다시 확인했고, AI 생성 · 편집 기록이 있습니다.' },
    ai_record: { t: 'AI 사용 · 파일 기록', s: 'AI 사용', b: '파일 기록', c: '#1F55F5', d: '서명은 없지만 파일 안에 AI 생성 · 편집 기록(IPTC · 생성 도구 설정값 등)이 있습니다.' },
    cap: { t: 'AI 미사용 · 촬영 원본 서명', s: 'AI 미사용', b: '촬영 원본 서명', c: '#0FA88F', d: '신뢰 목록의 촬영 기기 서명으로 원본이 확인됐고 AI 기록이 없습니다.' },
    none: { t: '근거 없음 · 확인 필요', s: '근거 없음', b: '확인 필요', c: '#B7C2D3', d: '파일에 판단할 기록이 없습니다. 제작자 · 판매자에게 AI 사용 여부를 확인해 발급자 신고로 표시합니다.' },
    error: { t: '확인 못함', s: '확인 못함', b: '', c: '#E0A33A', d: '파일을 읽지 못했거나 서버 확인이 끝나지 않았습니다.' }
  };
  var CAT_ORDER = ['ai_verified', 'ai_record', 'cap', 'none', 'error'];
  var NEAR = 6;

  function str(v) { return v === null || v === undefined ? '' : String(v); }
  function esc(s) { return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function base(name) { var s = str(name).replace(/\\/g, '/'); return s.slice(s.lastIndexOf('/') + 1); }
  function ham(a, b) { if (!a || !b || a.length !== b.length) return 64; var n = 0; for (var i = 0; i < a.length; i++) { var x = parseInt(a.charAt(i), 16) ^ parseInt(b.charAt(i), 16); while (x) { n += x & 1; x >>= 1; } } return n; }
  function pct(a, b) { return b ? Math.round(a * 1000 / b) / 10 : 0; }
  function bytes(n) { n = +n || 0; return n < 1024 ? n + 'B' : n < 1048576 ? (n / 1024).toFixed(1) + 'KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + 'MB' : (n / 1073741824).toFixed(2) + 'GB'; }
  function two(n) { return ('0' + n).slice(-2); }
  function stamp(d) { d = d || new Date(); return d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate()) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes()); }

  /* ---------- 지금 표시 목록(CSV) 읽기: 파일 이름, 지금 표시 ---------- */
  var DECL_WORDS = [
    [/^(ai[ _-]?generated|ai\s*생성|생성)$/i, 'ai_generated'],
    [/^(ai[ _-]?edited|ai\s*편집.*|ai\s*합성|편집|합성)$/i, 'ai_edited'],
    [/^(ai[ _-]?assisted|ai\s*보조|ai\s*보정|보조|보정)$/i, 'ai_assisted'],
    [/^(no[ _-]?ai|ai\s*미사용|미사용|사람\s*제작|사람이\s*만듦|human)$/i, 'no_ai'],
    [/^(none|표시\s*없음|없음|미표시|-|)$/i, 'none']
  ];
  function declWord(v) { var s = str(v).trim().replace(/^"|"$/g, ''); for (var i = 0; i < DECL_WORDS.length; i++) if (DECL_WORDS[i][0].test(s)) return DECL_WORDS[i][1]; return ''; }
  function csvRows(text) {   // 따옴표 · 쉼표 · 줄바꿈을 지키는 작은 CSV 읽기
    var rows = [], row = [], cell = '', q = false, s = str(text).replace(/^﻿/, '');
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (q) { if (ch === '"') { if (s.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
      if (ch === '"') q = true; else if (ch === ',' || ch === '\t' || ch === ';') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s.charAt(i + 1) === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return str(c).trim(); }); });
  }
  /** CSV 글 → { 파일 이름(소문자): 표시 값 } · 첫 줄이 머리글이면 건너뜀 · 못 읽은 줄 수도 돌려줌 */
  function parseDeclared(text) {
    var map = {}, bad = 0, n = 0;
    csvRows(text).forEach(function (r, i) {
      var name = base(str(r[0]).trim()), lab = declWord(r[1]);
      if (i === 0 && !lab && /파일|file|name|이름/i.test(str(r[0]))) return;
      if (!name) return;
      if (!lab && str(r[1]).trim()) { bad++; return; }
      map[name.toLowerCase()] = lab || 'none'; n++;
    });
    return { map: map, count: n, bad: bad };
  }
  function declaredTemplate(names) {
    var lines = ['파일 이름,지금 표시'];
    (names && names.length ? names : ['상품컷_001.jpg', '모델컷_002.png', '배너_003.webp']).forEach(function (nm, i) { lines.push('"' + base(nm).replace(/"/g, '""') + '",' + (names && names.length ? '' : ['AI 생성', 'AI 미사용', '표시 없음'][i % 3])); });
    return '﻿' + lines.join('\r\n') + '\r\n';
  }

  /* ---------- 한 건 정리 ---------- */
  function info(e) {
    var r = e.result, o = { cat: 'error', basis: 'none', scope: '', tools: [], signer: '', signerTrust: '', allowed: [], suggest: '', marks: [], near: [], checks: [], summary: '' };
    if (!r || r.ok === false || !r.verdict) { o.err = e.error || (r && (r.msg || r.message)) || '확인하지 못했습니다'; return o; }
    var v = r.verdict;
    o.cat = v.ai === 'used' ? (v.basis === 'verified' ? 'ai_verified' : 'ai_record') : v.ai === 'not_used' ? 'cap' : 'none';
    o.basis = v.ai === 'unknown' ? 'none' : (v.basis || 'none');
    o.scope = v.ai === 'used' ? v.scope || '' : '';
    o.allowed = (v.allowed || []).slice(); o.suggest = v.suggest || '';
    o.summary = r.summary || '';
    (r.signals || []).forEach(function (s) { if (s.dir === 'ai' && s.tool) str(s.tool).split(/\s*·\s*|\s*,\s*/).forEach(function (t) { t = t.trim(); if (t && o.tools.indexOf(t) < 0) o.tools.push(t); }); });
    if (r.signer) {
      o.signer = str(r.signer.org); o.signerTrust = str(r.signer.trust);
      if (r.signer.valid === false) o.checks.push(['tamper', '출처 기록의 서명이 맞지 않습니다. 기록이 바뀌었을 수 있습니다.']);
      else if (r.signer.binding === 'mismatch') o.checks.push(['tamper', '서명 뒤에 파일 내용이 바뀌었습니다(편집 뒤 다시 저장 등). 지금 파일의 출처 기록으로는 확인할 수 없습니다.']);
    }
    (r.registry || []).forEach(function (h) {
      if (h.exact && h.status !== 'revoked') o.marks.push({ id: h.id, label: h.label, basis: h.basis });
      else if (!h.exact && h.status !== 'revoked' && h.label && h.label !== 'no_ai') o.near.push({ id: h.id, label: h.label, how: h.alt ? 'alt' : 'near' });
    });
    if (o.cat === 'none' && o.near.length) o.checks.push(['near', (o.near[0].how === 'alt' ? '표시본으로 등록된' : '비슷한') + " 이미지가 '" + LABEL[o.near[0].label] + "' 마크(" + o.near[0].id + ')로 등록돼 있습니다. AI 사용 여부를 다시 확인하세요.']);
    return o;
  }
  function compare(e, o) {   // 지금 표시 ↔ 근거
    var d = e.declared; if (!d || o.cat === 'error') return null;
    var ai = d !== 'none' && d !== 'no_ai';
    if (o.cat === 'ai_verified' || o.cat === 'ai_record') {
      if (d === 'none') return ['missing', 'AI 생성 · 편집 기록이 있는데 AI 사용 표시가 없습니다.'];
      if (d === 'no_ai') return ['conflict', "AI 생성 · 편집 기록이 있는데 'AI 미사용'으로 표시돼 있습니다."];
      if (o.allowed.length && o.allowed.indexOf(d) < 0) return ['weaker', "파일 기록은 '" + (SCOPE[o.scope] || 'AI 사용') + "'인데 '" + LABEL[d] + "'로 표시돼 있습니다. 고를 수 있는 표시: " + o.allowed.map(function (x) { return LABEL[x]; }).join(', ')];
      return null;
    }
    if (o.cat === 'cap' && ai) return ['conflict', "촬영 원본 서명이 확인된 파일인데 '" + LABEL[d] + "'로 표시돼 있습니다. AI로 고친 파일이 따로 있다면 그 파일로 확인하세요."];
    return null;
  }

  /* ---------- 같은 · 비슷한 이미지 묶음 ---------- */
  function groups(entries, infos) {
    /* 같은 파일(SHA-256)은 한 묶음. 비슷한 이미지는 묶음 안 모든 이미지와 dHash 거리가 NEAR 이하일 때만 넣음(사슬처럼 번지지 않게) */
    var gl = [], bySha = {};
    entries.forEach(function (e, i) {
      var s = str(e.sha256), d = e.kind === 'image' && /^[0-9a-f]{16}$/.test(str(e.dhash)) ? e.dhash : '';
      if (s && bySha[s] !== undefined) { gl[bySha[s]].push(i); return; }
      var gi = -1;
      if (d) for (var g = 0; g < gl.length && gi < 0; g++) {
        if (gl[g].every(function (j) { var dj = entries[j].kind === 'image' ? str(entries[j].dhash) : ''; return /^[0-9a-f]{16}$/.test(dj) && ham(dj, d) <= NEAR; })) gi = g;
      }
      if (gi < 0) { gl.push([i]); gi = gl.length - 1; } else gl[gi].push(i);
      if (s) bySha[s] = gi;
    });
    var out = [];
    gl.forEach(function (m) {
      if (m.length < 2) return;
      var cats = {}, decl = {}, same = true;
      m.forEach(function (i) { var c = infos[i].cat; if (c !== 'error') cats[c === 'ai_verified' || c === 'ai_record' ? 'ai' : c] = 1; if (entries[i].declared) decl[entries[i].declared] = 1; if (entries[i].sha256 !== entries[m[0]].sha256) same = false; });
      var ck = Object.keys(cats), dk = Object.keys(decl), flag = '';
      if (ck.length > 1 && cats.ai) flag = '같은 · 비슷한 이미지인데 한쪽에만 AI 기록이 있습니다. 기록이 지워진 사본일 수 있으니, 같은 콘텐츠라면 표시를 맞추세요.';
      else if (ck.length > 1) flag = '같은 · 비슷한 이미지인데 근거가 서로 다릅니다.';
      else if (dk.length > 1) flag = '같은 · 비슷한 이미지인데 지금 표시가 서로 다릅니다.';
      out.push({ members: m, exact: same, flag: flag });
    });
    out.sort(function (x, y) { return (y.flag ? 1 : 0) - (x.flag ? 1 : 0) || y.members.length - x.members.length; });
    return out;
  }

  /* ---------- 리포트 만들기 ---------- */
  /** entries: [{ name, path?, size, kind, sha256, dhash, result | error, declared?, thumb? }] · opts: { org, title, at(Date), source } */
  function build(entries, opts) {
    opts = opts || {};
    var infos = entries.map(info), R = { v: VERSION, org: str(opts.org).trim().slice(0, 60), title: str(opts.title).trim() || 'AI 사용 확인 리포트', at: opts.at || new Date(), source: str(opts.source) || 'aimarker.kr/report',
      n: entries.length, ok: 0, kinds: {}, cats: {}, tools: {}, signers: {}, marks: 0, size: 0, rows: [], issues: [], groups: [], declared: 0, decl: { missing: 0, conflict: 0, weaker: 0 } };
    CAT_ORDER.forEach(function (c) { R.cats[c] = 0; });
    entries.forEach(function (e, i) {
      var o = infos[i], kind = e.kind || 'other';
      R.kinds[kind] = (R.kinds[kind] || 0) + 1; R.cats[o.cat]++; R.size += +e.size || 0;
      if (o.cat !== 'error') R.ok++;
      o.tools.forEach(function (t) { R.tools[t] = (R.tools[t] || 0) + 1; });
      if (o.signer) R.signers[o.signer] = (R.signers[o.signer] || 0) + 1;
      if (o.marks.length) R.marks++;
      if (e.declared) R.declared++;
      var cmp = compare(e, o); if (cmp) R.decl[cmp[0]]++;
      var row = { i: i + 1, name: e.name, path: e.path || '', size: e.size || 0, kind: kind, cat: o.cat, basis: o.basis, scope: o.scope, tools: o.tools, signer: o.signer, allowed: o.allowed, suggest: o.suggest,
        marks: o.marks, declared: e.declared || '', cmp: cmp, checks: o.checks, err: o.err || '', sha256: e.sha256 || '', thumb: e.thumb || '' };
      R.rows.push(row);
      if (cmp) R.issues.push({ type: cmp[0], row: row, text: cmp[1] });
      o.checks.forEach(function (c) { R.issues.push({ type: c[0], row: row, text: c[1] }); });
    });
    R.groups = groups(entries, infos);
    R.groups.forEach(function (g, gi) { if (g.flag) R.issues.push({ type: 'group', group: gi, rows: g.members.map(function (i) { return R.rows[i]; }), text: g.flag }); });
    var order = { conflict: 0, missing: 1, group: 2, tamper: 3, weaker: 4, near: 5 };
    R.issues.sort(function (a, b) { return order[a.type] - order[b.type]; });
    R.ready = R.cats.ai_verified + R.cats.ai_record + R.cats.cap;
    R.readyPct = pct(R.ready, R.ok); R.nonePct = pct(R.cats.none, R.ok);
    R.aiPct = pct(R.cats.ai_verified + R.cats.ai_record, R.ok);
    return R;
  }
  function top(obj, k) { return Object.keys(obj).map(function (x) { return [x, obj[x]]; }).sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); }).slice(0, k || 8); }

  /** 한 줄 요약(상담 신청 · 알림용) */
  function summaryText(R) {
    var s = '콘텐츠 ' + R.n + '건 AI 사용 확인: AI 사용 근거 ' + (R.cats.ai_verified + R.cats.ai_record) + '건(서명 검증 ' + R.cats.ai_verified + ' · 파일 기록 ' + R.cats.ai_record + '), 촬영 원본 서명 ' + R.cats.cap + '건, 근거 없음 ' + R.cats.none + '건' + (R.cats.error ? ', 확인 못함 ' + R.cats.error + '건' : '') + '. 바로 표시 가능 ' + R.readyPct + '%.';
    var iss = R.issues.filter(function (x) { return x.type !== 'near'; }).length; if (iss) s += ' 확인할 점 ' + iss + '건.';
    var t = top(R.tools, 3); if (t.length) s += ' 주요 도구: ' + t.map(function (x) { return x[0] + ' ' + x[1]; }).join(', ') + '.';
    return s;
  }

  /* ---------- CSV ---------- */
  function csv(R) {
    var head = ['번호', '파일', '경로', '종류', '크기(바이트)', '판정', '근거 등급', '범위', '도구', '서명자', '고를 수 있는 표시', '지금 표시', '지금 표시와 비교', '확인할 점', '이미 있는 AIMarker 마크', 'SHA-256'];
    var q = function (v) { v = str(v); return /[",\r\n]/.test(v) || /^[=+\-@]/.test(v) ? '"' + (/^[=+\-@]/.test(v) ? "'" : '') + v.replace(/"/g, '""') + '"' : v; };
    var lines = [head.join(',')];
    R.rows.forEach(function (r) {
      lines.push([r.i, r.name, r.path, KIND[r.kind] || r.kind, r.size, CAT[r.cat].t, BASIS[r.basis] || '', SCOPE[r.scope] || '', r.tools.join(' · '), r.signer, r.allowed.map(function (x) { return LABEL[x]; }).join(' · '),
        r.declared ? LABEL[r.declared] : '', r.cmp ? r.cmp[1] : '', (r.checks.map(function (c) { return c[1]; }).concat(r.err ? [r.err] : [])).join(' / '), r.marks.map(function (m) { return m.id + '(' + (LABEL[m.label] || m.label) + ')'; }).join(' · '), r.sha256].map(q).join(','));
    });
    return '﻿' + lines.join('\r\n') + '\r\n';
  }

  /* ---------- 혼자 열리는 HTML(인쇄 · PDF 저장 가능) ---------- */
  var CSS = [
    ':root{--ink:#0B1324;--ink2:#4A566B;--ink3:#7A869A;--line:#E4E9F2;--soft:#F5F7FB;--navy:#0E2A6B;--blue:#1F55F5;--mint:#0FA88F;--warn:#B4600A;--bad:#C2333A}',
    '*{box-sizing:border-box}html,body{margin:0;background:#fff;color:var(--ink);font:15px/1.6 "Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;word-break:keep-all;overflow-wrap:anywhere}',
    '.rp{max-width:1040px;margin:0 auto;padding:40px 32px 56px}',
    '.rp-top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid var(--navy);padding-bottom:20px}',
    '.rp-brand{font-weight:800;color:var(--navy);letter-spacing:-.01em}.rp-brand b{color:var(--blue)}',
    '.rp h1{font-size:28px;line-height:1.3;margin:6px 0 4px;letter-spacing:-.02em}.rp-sub{color:var(--ink2);margin:0}',
    '.rp-meta{text-align:right;color:var(--ink3);font-size:13px;white-space:nowrap}',
    '.rp h2{font-size:19px;margin:36px 0 12px;letter-spacing:-.01em}.rp h2 small{font-weight:500;color:var(--ink3);font-size:13px;margin-left:8px}',
    '.rp-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:22px}',
    '.rp-kpi div{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:#fff}.rp-kpi b{display:block;font-size:28px;line-height:1.15;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.rp-kpi span{color:var(--ink2);font-size:13px}',
    '.rp-kpi .hi{background:var(--navy);border-color:var(--navy);color:#fff}.rp-kpi .hi span{color:#C9D6F5}',
    '.rp-bar{display:flex;height:18px;border-radius:9px;overflow:hidden;background:var(--soft);margin:6px 0 10px}.rp-bar i{display:block;height:100%}',
    '.rp-leg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px 18px;margin:0;padding:0;list-style:none}.rp-leg li{display:flex;gap:10px;align-items:flex-start;font-size:14px}',
    '.rp-leg i{flex:none;width:12px;height:12px;border-radius:3px;margin-top:5px}.rp-leg b{font-variant-numeric:tabular-nums}.rp-leg small{display:block;color:var(--ink3);font-size:12.5px}',
    '.rp-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}',
    '.rp-hb{margin:0;padding:0;list-style:none}.rp-hb li{display:grid;grid-template-columns:150px 1fr 40px;gap:10px;align-items:center;font-size:14px;margin:6px 0}.rp-hb span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.rp-hb em{display:block;height:10px;border-radius:5px;background:var(--blue)}.rp-hb b{text-align:right;font-variant-numeric:tabular-nums}',
    '.rp-empty{color:var(--ink3);font-size:14px;margin:4px 0}',
    '.rp-iss{margin:0;padding:0;list-style:none;border:1px solid var(--line);border-radius:12px;overflow:hidden}.rp-iss li{display:grid;grid-template-columns:110px 1fr;gap:14px;padding:12px 16px;border-top:1px solid var(--line);font-size:14px}.rp-iss li:first-child{border-top:0}',
    '.rp-tag{display:inline-block;font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--soft);color:var(--ink2);height:max-content}',
    '.t-conflict,.t-tamper{background:#FDECEC;color:var(--bad)}.t-missing,.t-group{background:#FFF3E2;color:var(--warn)}.t-weaker,.t-near{background:#EEF3FF;color:var(--blue)}',
    '.rp-iss .fn{font-weight:600;word-break:break-all}.rp-iss p{margin:2px 0 0;color:var(--ink2)}',
    '.rp-next{margin:0;padding-left:20px}.rp-next li{margin:6px 0}',
    'table.rp-t{width:100%;border-collapse:collapse;font-size:13px}.rp-t th{position:sticky;top:0;background:var(--navy);color:#fff;text-align:left;font-weight:600;padding:8px 8px}',
    '.rp-t td{border-bottom:1px solid var(--line);padding:7px 8px;vertical-align:top}.rp-t tr:nth-child(even) td{background:#FAFBFD}',
    '.rp-t td:first-child{white-space:nowrap;font-variant-numeric:tabular-nums}.rp-t .fc{min-width:160px}.rp-t .tl{min-width:130px}.rp-t .nt{min-width:170px}.rp-t .fn{word-break:break-all;font-weight:600}.rp-t .sub{display:block;color:var(--ink3);font-weight:400;font-size:12px}.rp-t img{width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--line);display:block}',
    '.rp-c{display:inline-flex;align-items:flex-start;gap:6px;font-weight:600;white-space:nowrap}.rp-c i{width:9px;height:9px;border-radius:50%;flex:none;margin-top:5px}',
    '.rp-t .lb{display:inline-block;white-space:nowrap;margin:0 4px 3px 0;padding:0 6px;border-radius:6px;background:#EEF3FF;color:#1F55F5;font-size:12px;font-weight:600}.rp-t .nw{white-space:nowrap}',
    '.rp-note{margin-top:36px;padding:16px 18px;background:var(--soft);border-radius:12px;color:var(--ink2);font-size:13px}.rp-note ul{margin:6px 0 0;padding-left:18px}',
    '.rp-foot{margin-top:18px;color:var(--ink3);font-size:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '@media screen and (max-width:720px){.rp{padding:24px 16px 40px}.rp-top{flex-direction:column}.rp-meta{text-align:left}.rp-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.rp-2{grid-template-columns:1fr}.rp-iss li{grid-template-columns:1fr;gap:6px}.rp-hb li{grid-template-columns:110px 1fr 34px}',
    '.rp-t thead{display:none}.rp-t,.rp-t tbody{display:block}.rp-t tr{display:grid;grid-template-columns:48px minmax(0,1fr);column-gap:12px;position:relative;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:10px}',
    '.rp-t tr:nth-child(even) td{background:none}.rp-t td{display:block;border:0;padding:0;grid-column:1/-1;min-width:0}.rp-t td.no{position:absolute;top:10px;right:12px;color:var(--ink3);font-size:12px}',
    '.rp-t td.th{grid-column:1;grid-row:1/span 2}.rp-t td.fc,.rp-t td.vd{grid-column:2;padding-right:26px}.rp-t td.vd{margin-top:4px}.rp-t.nothumb tr{grid-template-columns:minmax(0,1fr)}.rp-t.nothumb td.fc,.rp-t.nothumb td.vd{grid-column:1}',
    '.rp-t td[data-l]{margin-top:8px}.rp-t td[data-l]::before{content:attr(data-l);display:block;color:var(--ink3);font-size:11.5px;font-weight:600}.rp-t td[data-l]:empty{display:none}}',
    '@media print{@page{size:A4;margin:14mm}.rp{max-width:none;padding:0}.rp h2{break-after:avoid}.rp-iss li,.rp-t tr{break-inside:avoid}.rp-full{break-before:page}.rp-t th{position:static}.rp-t{font-size:11.5px}.rp-t img{width:36px;height:36px}.rp-t .fc{min-width:110px}.rp-t .tl{min-width:100px}.rp-t .nt{min-width:130px}.rp-kpi b{font-size:24px}}'
  ].join('\n');

  function catChip(c, short) { return '<span class="rp-c"><i style="background:' + CAT[c].c + '"></i>' + esc(short ? CAT[c].s : CAT[c].t) + '</span>'; }
  function rowName(r) { return '<span class="fn">' + esc(r.name) + '</span>' + (r.path && r.path !== r.name ? '<span class="sub">' + esc(r.path) + '</span>' : ''); }
  function nextSteps(R) {
    var out = [], ai = R.cats.ai_verified + R.cats.ai_record;
    if (ai) out.push('<b>AI 사용 근거가 있는 ' + ai + '건</b>은 근거 그대로 마크를 발급할 수 있습니다. 기업 API · MCP 로 올리는 순간 자동 발급(label: auto)하면 사람이 고를 일이 없습니다.');
    if (R.cats.cap) out.push('<b>촬영 원본 서명이 확인된 ' + R.cats.cap + '건</b>은 \'AI 미사용 · 서명 검증\' 마크로 원본임을 밝힐 수 있습니다.');
    if (R.cats.none) out.push('<b>근거 없는 ' + R.cats.none + '건</b>은 기술로 AI 사용 여부를 정할 수 없습니다. 제작자 · 판매자에게 확인해 \'발급자 신고\'로 표시하고, 앞으로는 생성 도구의 출처 기록(C2PA)을 지우지 않고 올리도록 안내하세요.');
    var c = R.decl.conflict + R.decl.missing; if (c) out.push('<b>지금 표시와 근거가 다른 ' + c + '건</b>을 먼저 고치세요. 근거와 다른 표시는 AIMarker 에서 발급되지 않습니다.');
    if (R.issues.some(function (x) { return x.type === 'group'; })) out.push('<b>같은 · 비슷한 이미지인데 근거가 다른 묶음</b>은 한쪽의 출처 기록이 지워진 사본일 수 있습니다. 같은 콘텐츠라면 같은 표시로 맞추세요.');
    if (R.issues.some(function (x) { return x.type === 'tamper'; })) out.push('<b>출처 기록과 파일이 맞지 않는 파일</b>은 편집 뒤 다시 저장되며 기록이 깨졌을 수 있습니다. 원본 파일로 다시 확인하세요.');
    out.push('대량 처리 · 정기 리포트 · 쇼핑몰 연동은 <b>contact@skkc.co.kr</b> 또는 aimarker.kr/contact 로 상담하세요.');
    return out;
  }
  /** opts: { thumbs: true(행에 썸네일), full: true(전체 목록 넣기, 기본 true) } */
  function html(R, opts) {
    opts = opts || {};
    var full = opts.full !== false, thumbs = opts.thumbs !== false && R.rows.some(function (r) { return r.thumb; });
    var kinds = top(R.kinds, 6).map(function (x) { return (KIND[x[0]] || x[0]) + ' ' + x[1]; }).join(' · ');
    var bar = CAT_ORDER.filter(function (c) { return R.cats[c]; }).map(function (c) { return '<i title="' + esc(CAT[c].t + ' ' + R.cats[c]) + '" style="width:' + pct(R.cats[c], R.n) + '%;background:' + CAT[c].c + '"></i>'; }).join('');
    var leg = CAT_ORDER.filter(function (c) { return c !== 'error' || R.cats.error; }).map(function (c) { return '<li><i style="background:' + CAT[c].c + '"></i><div><b>' + esc(CAT[c].t) + ' ' + R.cats[c] + '건</b> (' + pct(R.cats[c], R.n) + '%)<small>' + esc(CAT[c].d) + '</small></div></li>'; }).join('');
    var tl = top(R.tools, 8), sl = top(R.signers, 8), tmax = tl.length ? tl[0][1] : 1, smax = sl.length ? sl[0][1] : 1;
    var hb = function (list, max, empty) { return list.length ? '<ul class="rp-hb">' + list.map(function (x) { return '<li><span title="' + esc(x[0]) + '">' + esc(x[0]) + '</span><em style="width:' + Math.max(4, Math.round(x[1] * 100 / max)) + '%"></em><b>' + x[1] + '</b></li>'; }).join('') + '</ul>' : '<p class="rp-empty">' + esc(empty) + '</p>'; };
    var TAG = { conflict: '근거와 다름', missing: '표시 빠짐', group: '사본 불일치', tamper: '기록 손상', weaker: '표시 약함', near: '등록 이미지' };
    var iss = R.issues.slice(0, 60).map(function (x) {
      var who = x.type === 'group' ? x.rows.map(function (r) { return '<span class="fn">' + r.i + '. ' + esc(r.name) + '</span> ' + catChip(r.cat); }).join('<br>') : '<span class="fn">' + x.row.i + '. ' + esc(x.row.name) + '</span>';
      return '<li><span class="rp-tag t-' + x.type + '">' + TAG[x.type] + '</span><div>' + who + '<p>' + esc(x.text) + '</p></div></li>';
    }).join('');
    var more = R.issues.length > 60 ? '<p class="rp-empty">외 ' + (R.issues.length - 60) + '건은 CSV 에 있습니다.</p>' : '';
    var declNote = R.declared ? '지금 표시 목록과 맞춘 콘텐츠 ' + R.declared + '건: 근거와 다름 ' + R.decl.conflict + ' · 표시 빠짐 ' + R.decl.missing + ' · 표시 약함 ' + R.decl.weaker : '지금 표시 목록(CSV)을 함께 넣으면, 지금 붙어 있는 표시가 근거와 맞는지도 비교합니다.';
    var rows = R.rows.map(function (r) {
      var lab = r.err ? '<span class="sub">' + esc(r.err) + '</span>' : (r.allowed.length ? r.allowed.map(function (x) { return '<span class="lb">' + esc(LABEL[x]) + '</span>'; }).join('') : '');
      var note = [].concat(r.cmp ? [r.cmp[1]] : [], r.checks.map(function (c) { return c[1]; }), r.marks.length ? ['AIMarker 마크 ' + r.marks.map(function (m) { return m.id; }).join(', ')] : []);
      return '<tr>' + '<td class="no">' + r.i + '</td>' + (thumbs ? '<td class="th">' + (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="">' : '') + '</td>' : '') +
        '<td class="fc">' + rowName(r) + '<span class="sub">' + esc((KIND[r.kind] || r.kind) + ' · ' + bytes(r.size)) + '</span></td>' +
        '<td class="vd">' + catChip(r.cat, true) + '<span class="sub">' + esc([CAT[r.cat].b, SCOPE[r.scope] || ''].filter(Boolean).join(' · ')) + '</span></td>' +
        '<td class="tl" data-l="도구 · 서명자">' + esc([r.tools.join(', '), r.signer ? '서명 ' + r.signer : ''].filter(Boolean).join(' · ')) + '</td>' +
        '<td data-l="고를 수 있는 표시">' + lab + '</td>' + (R.declared ? '<td class="nw" data-l="지금 표시">' + esc(r.declared ? LABEL[r.declared] : '') + '</td>' : '') +
        '<td class="nt" data-l="확인할 점">' + esc(note.join(' / ')) + '</td></tr>';
    }).join('');
    var ttl = (R.org ? R.org + ' · ' : '') + R.title;
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(ttl) + '</title><meta name="robots" content="noindex"><style>' + CSS + '</style></head><body><main class="rp">' +
      '<header class="rp-top"><div><div class="rp-brand"><b>AI</b>Marker</div><h1>' + esc(ttl) + '</h1><p class="rp-sub">콘텐츠 ' + R.n + '건 · ' + esc(kinds) + ' · ' + bytes(R.size) + '</p></div>' +
      '<div class="rp-meta">' + esc(stamp(R.at)) + '<br>판정: AIMarker 출처 판정 엔진<br>' + esc(R.source) + '</div></header>' +
      '<section class="rp-kpi"><div class="hi"><b>' + R.readyPct + '%</b><span>근거로 바로 표시할 수 있는 콘텐츠</span></div>' +
      '<div><b>' + (R.cats.ai_verified + R.cats.ai_record) + '건</b><span>AI 사용 근거(서명 검증 ' + R.cats.ai_verified + ' · 파일 기록 ' + R.cats.ai_record + ')</span></div>' +
      '<div><b>' + R.cats.none + '건</b><span>근거 없음 · 제작자 확인 필요</span></div>' +
      '<div><b>' + R.issues.filter(function (x) { return x.type !== 'near'; }).length + '건</b><span>먼저 확인할 점</span></div></section>' +
      '<h2>근거 등급별 분포<small>판정은 파일 안 출처 기록과 전자서명으로만 합니다</small></h2><div class="rp-bar">' + bar + '</div><ul class="rp-leg">' + leg + '</ul>' +
      '<h2>먼저 확인할 점<small>' + esc(declNote) + '</small></h2>' + (iss ? '<ul class="rp-iss">' + iss + '</ul>' + more : '<p class="rp-empty">근거와 다른 표시 · 사본 불일치 · 손상된 출처 기록이 없습니다.</p>') +
      '<div class="rp-2"><div><h2>사용된 생성 · 편집 도구</h2>' + hb(tl, tmax, '파일 기록에서 찾은 AI 도구가 없습니다.') + '</div><div><h2>출처 기록 서명자</h2>' + hb(sl, smax, 'C2PA 전자서명이 있는 파일이 없습니다.') + '</div></div>' +
      (R.marks ? '<p class="rp-empty">이미 AIMarker 마크가 있는 콘텐츠 ' + R.marks + '건</p>' : '') +
      '<h2>다음 단계</h2><ol class="rp-next">' + nextSteps(R).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
      (full ? '<section class="rp-full"><h2>전체 목록<small>' + R.n + '건</small></h2><div class="rp-t-wrap"><table class="rp-t' + (thumbs ? '' : ' nothumb') + '"><thead><tr><th>#</th>' + (thumbs ? '<th></th>' : '') + '<th>파일</th><th>판정</th><th>도구 · 서명자</th><th>고를 수 있는 표시</th>' + (R.declared ? '<th>지금 표시</th>' : '') + '<th>확인할 점</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' : '') +
      '<div class="rp-note"><b>알아 두실 점</b><ul><li>이 리포트는 파일 안 출처 기록(C2PA · IPTC · XMP · 생성 도구 설정값)과 전자서명으로 판정한 결과입니다. 기록이 없는 파일의 AI 사용 여부는 추측하지 않고 \'근거 없음\'으로 둡니다.</li>' +
      '<li>원본 파일 · 픽셀은 AIMarker 서버로 보내지 않았습니다. 서버에는 특징값 · 해시 · 서명 검증에 필요한 기록 조각만 보냈고, 이 리포트는 확인을 실행한 사람의 브라우저에서 만들어졌습니다.</li>' +
      '<li>법률 자문이 아니며, 콘텐츠의 적법성을 보증하지 않습니다. 표시의 최종 책임은 게시자에게 있습니다.</li></ul></div>' +
      '<footer class="rp-foot"><span>AIMarker · AI 콘텐츠 투명성 기술 플랫폼 · aimarker.kr</span><span>리포트 ' + VERSION + '</span></footer>' +
      '</main></body></html>';
  }

  return { VERSION: VERSION, LABEL: LABEL, BASIS: BASIS, SCOPE: SCOPE, KIND: KIND, CAT: CAT, CAT_ORDER: CAT_ORDER, build: build, csv: csv, html: html, summaryText: summaryText, parseDeclared: parseDeclared, declaredTemplate: declaredTemplate, declWord: declWord, _info: info, _groups: groups, _ham: ham };
});
