/* AIMarker 마크 도구 모음: 표시 이름 · 근거 등급 · 마크 배지(화면 · 그림) · QR · 내려받기 (2026.10) */
(function () {
  'use strict';
  var MK = window.MK = window.MK || {};
  MK.LABEL = { ai_generated: 'AI 생성', ai_edited: 'AI 편집 · 합성', ai_assisted: 'AI 보조', no_ai: 'AI 미사용' };
  MK.SHORT = { ai_generated: 'AI 생성', ai_edited: 'AI 편집', ai_assisted: 'AI 보조', no_ai: 'AI 미사용' };
  MK.BASIS = { verified: '서명 검증', record: '파일 기록', declared: '발급자 신고' };
  MK.GRADE = { verified: 3, record: 2, declared: 1 };
  MK.SCOPE = { generated: 'AI로 생성', edited: 'AI로 편집 · 합성', enhanced: 'AI로 보정', '': '' };
  MK.KIND = { image: '이미지', video: '영상', audio: '오디오', doc: '문서', text: '글', other: '파일' };
  MK.DESC = {
    ai_generated: 'AI로 만든 콘텐츠입니다.',
    ai_edited: 'AI로 편집하거나 합성한 콘텐츠입니다.',
    ai_assisted: 'AI가 보정 · 보조한 콘텐츠입니다.',
    no_ai: 'AI를 사용하지 않은 콘텐츠입니다.'
  };
  MK.BASIS_DESC = {
    verified: '파일 안 출처 기록의 전자서명을 AIMarker 서버가 다시 확인했고, 서명자가 신뢰 목록에 있습니다.',
    record: '파일 안에 남은 생성 · 편집 기록으로 확인했습니다(서명은 없거나 신뢰 목록 밖).',
    declared: '파일에 판단할 기록이 없어, 발급자가 밝힌 내용으로 표시했습니다.'
  };
  MK.SITE = 'https://aimarker.kr';
  MK.markUrl = function (id) { return MK.SITE + '/m/?id=' + encodeURIComponent(id); };
  MK.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  MK.bytes = function (n) { n = +n || 0; return n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : n >= 1024 ? Math.round(n / 1024) + 'KB' : n + 'B'; };
  MK.hex = function (u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16); return s; };
  MK.sha256 = function (u8) { return crypto.subtle.digest('SHA-256', u8).then(function (b) { return MK.hex(new Uint8Array(b)); }); };
  MK.save = function (blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  };
  var SPARK = 'M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z';
  MK.SPARK = SPARK;

  /* ---------- 화면용 배지(HTML) ---------- */
  MK.badge = function (m, opt) {
    opt = opt || {};
    var g = MK.GRADE[m.basis] || 1, rev = m.status === 'revoked';
    return '<span class="mkb' + (rev ? ' is-rev' : '') + (opt.lg ? ' mkb-lg' : '') + '" data-g="' + g + '" title="' + MK.esc((MK.LABEL[m.label] || '') + ' · 근거 ' + (MK.BASIS[m.basis] || '')) + '">' +
      '<i class="mkb-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="' + SPARK + '" fill="currentColor"/></svg></i>' +
      '<b>' + MK.esc(MK.LABEL[m.label] || '표시') + '</b>' +
      '<span class="mkb-bars" role="img" aria-label="근거 ' + MK.esc(MK.BASIS[m.basis] || '') + '"><i></i><i></i><i></i></span>' +
      (m.id ? '<em>' + MK.esc(m.id) + '</em>' : '') + (rev ? '<s>철회됨</s>' : '') + '</span>';
  };
  MK.bars = function (basis) { return '<span class="mk-bars-s" data-g="' + (MK.GRADE[basis] || 1) + '" aria-hidden="true"><i></i><i></i><i></i></span>'; };

  /* ---------- 그림용 배지(캔버스) ---------- */
  var FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  MK.FONT = FONT;
  MK.fontsReady = function () { return document.fonts && document.fonts.load ? Promise.all([document.fonts.load('800 32px ' + FONT), document.fonts.load('600 32px ' + FONT)]).catch(function () {}) : Promise.resolve(); };
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  MK.rr = rr;
  /* h: 배지 높이(px). 돌려줌: 너비 */
  MK.measure = function (ctx, h, m, opt) {
    opt = opt || {};
    var f = h * 0.4, small = h * 0.27, pad = h * 0.34, ic = h * 0.56, gap = h * 0.24, barW = h * 0.085, barG = h * 0.06;
    ctx.save(); ctx.font = '800 ' + f + 'px ' + FONT; var tw = ctx.measureText(opt.short ? MK.SHORT[m.label] : MK.LABEL[m.label]).width;
    ctx.font = '650 ' + small + 'px ' + FONT; var sw = Math.max(ctx.measureText('AIMarker').width, m.id ? ctx.measureText(m.id).width : 0); ctx.restore();
    return pad + ic + gap + tw + gap + (barW * 3 + barG * 2) + gap + sw + pad;
  };
  MK.draw = function (ctx, x, y, h, m, opt) {
    opt = opt || {};
    var g = MK.GRADE[m.basis] || 1, f = h * 0.4, small = h * 0.27, pad = h * 0.34, ic = h * 0.56, gap = h * 0.24, barW = h * 0.085, barG = h * 0.06, barH = h * 0.44;
    var w = MK.measure(ctx, h, m, opt), text = opt.short ? MK.SHORT[m.label] : MK.LABEL[m.label];
    ctx.save();
    if (opt.shadow !== false) { ctx.shadowColor = 'rgba(6,16,42,.28)'; ctx.shadowBlur = h * 0.35; ctx.shadowOffsetY = h * 0.06; }
    rr(ctx, x, y, w, h, h * 0.24); ctx.fillStyle = 'rgba(10,31,82,.93)'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, h * 0.03); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.stroke();
    // 반짝이 표
    ctx.save(); ctx.translate(x + pad, y + (h - ic) / 2); ctx.scale(ic / 24, ic / 24); ctx.fillStyle = '#FFFFFF'; ctx.fill(new Path2D(SPARK)); ctx.restore();
    var cx = x + pad + ic + gap;
    ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + f + 'px ' + FONT; ctx.fillText(text, cx, y + h / 2 + h * 0.015);
    cx += ctx.measureText(text).width + gap;
    // 근거 막대 세 칸
    for (var i = 0; i < 3; i++) {
      var bh = barH * (0.62 + 0.19 * i), by = y + (h + barH) / 2 - bh;
      rr(ctx, cx + i * (barW + barG), by, barW, bh, barW / 2); ctx.fillStyle = i < g ? '#3BD6BD' : 'rgba(255,255,255,.24)'; ctx.fill();
    }
    cx += barW * 3 + barG * 2 + gap;
    ctx.font = '650 ' + small + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.textBaseline = 'alphabetic';
    if (m.id) { ctx.fillText('AIMarker', cx, y + h * 0.45); ctx.fillStyle = 'rgba(255,255,255,.66)'; ctx.fillText(m.id, cx, y + h * 0.79); }
    else { ctx.textBaseline = 'middle'; ctx.fillText('AIMarker', cx, y + h / 2); }
    ctx.restore();
    return w;
  };

  /* ---------- QR ---------- */
  MK.qr = function (text) { var q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q; };
  MK.qrSvg = function (text, px) {
    var q = MK.qr(text), n = q.getModuleCount(), m = 2, s = n + m * 2, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    return '<svg class="mk-qr" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 132) + '" height="' + (px || 132) + '" role="img" aria-label="마크 확인 QR 코드" shape-rendering="crispEdges"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#0B1324"/></svg>';
  };
  MK.qrDraw = function (ctx, text, x, y, size) {
    var q = MK.qr(text), n = q.getModuleCount(), cell = size / n;
    ctx.save(); ctx.fillStyle = '#0B1324';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(Math.floor(x + c * cell), Math.floor(y + r * cell), Math.ceil(cell), Math.ceil(cell));
    ctx.restore();
  };

  /* ---------- 마크 카드 그림(PNG): 배지 · 근거 · QR · 주소 ---------- */
  MK.cardPng = function (m) {
    return MK.fontsReady().then(function () {
      var W = 1200, H = 480, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#F5F7FB'; x.fillRect(0, 0, W, 6);
      rr(x, 1, 1, W - 2, H - 2, 28); x.lineWidth = 2; x.strokeStyle = '#E4E9F2'; x.stroke();
      MK.draw(x, 56, 64, 92, m, { shadow: false });
      x.fillStyle = '#0B1324'; x.font = '800 40px ' + FONT; x.textBaseline = 'alphabetic';
      x.fillText(MK.DESC[m.label] || '', 56, 236);
      x.fillStyle = '#5B687D'; x.font = '600 26px ' + FONT;
      x.fillText('근거: ' + (MK.BASIS[m.basis] || '') + (m.at ? ' · 발급 ' + String(m.at).slice(0, 10) : ''), 56, 290);
      x.fillText('이 마크가 맞는지 QR이나 아래 주소에서 확인하세요', 56, 334);
      x.fillStyle = '#1F55F5'; x.font = '700 26px ' + FONT; x.fillText(MK.markUrl(m.id).replace('https://', ''), 56, 404);
      MK.qrDraw(x, MK.markUrl(m.id), W - 56 - 300, 90, 300);
      x.fillStyle = '#8794A7'; x.font = '600 20px ' + FONT; x.fillText('AIMarker 전자서명 마크', W - 56 - 300, 430);
      return new Promise(function (ok) { c.toBlob(ok, 'image/png'); });
    });
  };

  /* ---------- 그림에 마크 넣기 ---------- */
  MK.loadImage = function (blob) {
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function () { ok(img); }; img.onerror = function () { URL.revokeObjectURL(url); bad(new Error('decode')); };
      img.src = url;
    });
  };
  /* 광고 · 가상인물 꼬리표(흰 바탕 · 진한 글자). 돌려줌: 너비 */
  MK.tagWidth = function (ctx, h, text) { ctx.save(); ctx.font = '850 ' + (h * 0.42) + 'px ' + FONT; var w = ctx.measureText(text).width + h * 0.62; ctx.restore(); return w; };
  MK.drawTag = function (ctx, x, y, h, text) {
    var w = MK.tagWidth(ctx, h, text);
    ctx.save(); ctx.shadowColor = 'rgba(6,16,42,.24)'; ctx.shadowBlur = h * 0.3; ctx.shadowOffsetY = h * 0.05;
    rr(ctx, x, y, w, h, h * 0.24); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, h * 0.04); ctx.strokeStyle = 'rgba(10,31,82,.9)'; ctx.stroke();
    ctx.fillStyle = '#0A1F52'; ctx.font = '850 ' + (h * 0.42) + 'px ' + FONT; ctx.textBaseline = 'middle'; ctx.fillText(text, x + h * 0.31, y + h / 2 + h * 0.02);
    ctx.restore(); return w;
  };
  /* 이미 그림이 그려진 캔버스에 마크를 얹음. o: { pos: tl · tr · bl · br, size: s · m · l, qr, tags: ['광고', '가상인물'] } */
  MK.stampCanvas = function (c, m, o) {
    o = o || {};
    var x = c.getContext('2d'), tags = (o.tags || []).filter(Boolean);
    var h = Math.round(Math.min(c.width, c.height) * ({ s: 0.06, m: 0.08, l: 0.105 })[o.size || 'm']); h = Math.max(18, Math.min(180, h));
    var lay = function () {
      var w = MK.measure(x, h, m, { short: true }), q = o.qr ? h * 1.6 : 0, gap = h * 0.2, tw = tags.reduce(function (a, t) { return a + MK.tagWidth(x, h, t) + gap; }, 0);
      return { w: w, q: q, gap: gap, tw: tw, tot: tw + w + (q ? q + gap : 0) };
    };
    var mg = Math.max(8, Math.round(h * 0.3)), L = lay();
    if (L.tot > c.width - mg * 2) { h = Math.max(14, Math.floor(h * (c.width - mg * 2) / L.tot)); mg = Math.max(6, Math.round(h * 0.3)); L = lay(); }
    var pos = o.pos || 'bl', bx = /r$/.test(pos) ? c.width - mg - L.tot : mg, top = /^b/.test(pos) ? c.height - mg - Math.max(h, L.q) : mg;
    var by = top + (L.q > h && /^b/.test(pos) ? L.q - h : 0), cx = bx;
    tags.forEach(function (t) { cx += MK.drawTag(x, cx, by, h, t) + L.gap; });
    MK.draw(x, cx, by, h, m, { short: true }); cx += L.w;
    if (L.q) { var qx = cx + L.gap, qy = top; x.save(); rr(x, qx, qy, L.q, L.q, h * 0.12); x.fillStyle = '#FFFFFF'; x.fill(); x.restore(); MK.qrDraw(x, MK.markUrl(m.id || 'AM-0000000000'), qx + L.q * 0.06, qy + L.q * 0.06, L.q * 0.88); }
    return c;
  };
  /* pos: tl · tr · bl · br, size: s · m · l, qr: true 면 배지 옆에 QR, tags: 광고 · 가상인물 꼬리표 */
  MK.stamp = function (img, m, o) {
    o = o || {};
    var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height, k = Math.min(1, 8000 / Math.max(W, H), Math.sqrt(40000000 / (W * H)));
    var c = document.createElement('canvas'); c.width = Math.round(W * k); c.height = Math.round(H * k);
    var x = c.getContext('2d');
    if (o.flat) { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height); }
    x.drawImage(img, 0, 0, c.width, c.height);
    if (o.visible !== false) MK.stampCanvas(c, m, o);
    return c;
  };
  /* 미리보기: 주어진 캔버스(가로 px)에 그림(없으면 견본 바탕)과 마크를 그림 */
  MK.preview = function (c, img, m, o) {
    var W = img ? (img.naturalWidth || img.width) : 1200, H = img ? (img.naturalHeight || img.height) : 900, cw = Math.max(200, Math.round(c.clientWidth || 360)), dpr = Math.min(2, window.devicePixelRatio || 1);
    var k = cw / W; c.width = Math.round(cw * dpr); c.height = Math.round(Math.min(H * k, cw * 1.25) * dpr);
    var x = c.getContext('2d'); x.save(); x.scale(dpr, dpr);
    var vh = c.height / dpr;
    if (img) { var s = Math.max(cw / W, vh / H); x.drawImage(img, (cw - W * s) / 2, (vh - H * s) / 2, W * s, H * s); }
    else {
      var g = x.createLinearGradient(0, 0, cw, vh); g.addColorStop(0, '#DCE6FF'); g.addColorStop(1, '#E7F7F3'); x.fillStyle = g; x.fillRect(0, 0, cw, vh);
      x.fillStyle = 'rgba(14,42,107,.10)'; for (var i = 0; i < 7; i++) { x.beginPath(); x.arc(cw * (0.15 + i * 0.13), vh * (0.35 + 0.18 * Math.sin(i)), vh * (0.08 + 0.03 * (i % 3)), 0, Math.PI * 2); x.fill(); }
      x.fillStyle = 'rgba(11,19,36,.45)'; x.font = '700 ' + Math.round(cw * 0.04) + 'px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('견본 이미지', cw / 2, vh / 2);
    }
    x.restore();
    // 마크 크기는 실제 그림 비율 그대로(짧은 변 기준) 보이도록 같은 캔버스에 그림
    if (o && o.visible !== false) MK.stampCanvas(c, m, o);
    return c;
  };
  MK.canvasBlob = function (c, type, q) { return new Promise(function (ok) { c.toBlob(ok, type, q); }); };

  /* ---------- 관리 키 파일 ---------- */
  MK.keyText = function (list) {
    var lines = ['AIMarker 마크 관리 키', '이 파일의 관리 키(mk_…)는 표시를 바꾸거나 철회할 때 필요합니다. 다시 발급되지 않으니 안전한 곳에 보관하세요.', ''];
    list.forEach(function (r) {
      lines.push('마크 번호: ' + r.id); lines.push('표시: ' + (MK.LABEL[r.label] || r.label) + ' · 근거 ' + (MK.BASIS[r.basis] || r.basis));
      if (r.name) lines.push('파일: ' + r.name);
      lines.push('관리 키: ' + r.key); lines.push('확인 주소: ' + MK.markUrl(r.id)); lines.push('');
    });
    return lines.join('\r\n');
  };
  MK.keyCsv = function (list) {
    var q = function (s) { s = String(s == null ? '' : s); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + ['파일,마크 번호,표시,근거,관리 키,확인 주소'].concat(list.map(function (r) { return [r.name || '', r.id, MK.LABEL[r.label] || r.label, MK.BASIS[r.basis] || r.basis, r.key, MK.markUrl(r.id)].map(q).join(','); })).join('\r\n');
  };

  /* ---------- 공개키(정적 파일, 서버에 묻지 않음) ---------- */
  var KEYS = null;
  MK.keys = function () {
    if (KEYS) return KEYS;
    var root = (document.body && document.body.getAttribute('data-root')) || '/';
    KEYS = fetch(root + '.well-known/aimarker-keys.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('keys'); return r.json(); })
      .then(function (j) { return j.keys || []; })
      .catch(function () { KEYS = null; return window.AM && AM.call ? AM.call('am.pubkey', {}, 30000).then(function (r) { return (r && r.keys) || []; }) : []; });
    return KEYS;
  };
  /* 서명 확인: 공개키 파일에 없는 새 키면 서버 공개키로 한 번 더 */
  MK.verify = function (cred) {
    var A = window.AIMExtract;
    return MK.keys().then(function (keys) { return A.verifyMark(cred, keys); }).then(function (v) {
      if (v.ok || v.reason !== 'unknown_key' || !(window.AM && AM.call)) return v;
      return AM.call('am.pubkey', {}, 30000).then(function (r) { return A.verifyMark(cred, (r && r.keys) || []); }).catch(function () { return v; });
    });
  };
})();
