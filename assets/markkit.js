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
  /* 10.0 지문 심볼(작은 크기용, viewBox 0 0 87.49 100) */
  var FP = 'M41.64 99.89C32.27 99.14 23.13 94.86 15.91 87.85C13.26 85.28 12.55 84.31 12.3 82.87C12.14 81.99 12.29 80.82 12.65 80.1L12.87 79.63L11.9 79.63C10.44 79.63 9.16 79.11 8.24 78.13C7.53 77.39 5.77 74.09 4.47 71.05C2.27 65.91 0.82 60.14 0.18 54.05C0.01 52.33 0 45.3 0.18 43.64C0.64 39.41 1.27 36.16 2.33 32.67C2.79 31.12 3.73 28.49 4.15 27.54C4.28 27.26 4.55 26.64 4.77 26.15C6.33 22.64 8.29 19.43 11.09 15.79C11.82 14.84 13.79 12.69 14.93 11.6C15.75 10.82 16.21 10.47 16.8 10.18C17.58 9.79 17.58 9.79 18.87 9.79C20.17 9.79 20.17 9.79 20.93 10.18C22.19 10.82 22.97 11.66 23.46 12.89C23.68 13.48 23.72 13.75 23.72 14.62C23.72 16.27 23.22 17.32 21.76 18.67C17.61 22.53 13.82 28.85 11.87 35.18C11.01 37.97 10.36 41.07 10.03 44.05C9.85 45.72 9.85 52.06 10.03 53.59C10.87 60.52 12.54 65.85 15.69 71.59C16.1 72.33 16.49 73.18 16.57 73.47C16.85 74.51 16.7 76.23 16.27 76.83C16.17 76.96 16.1 77.1 16.1 77.13C16.1 77.16 16.55 77.18 17.1 77.18C18.94 77.18 19.71 77.61 21.81 79.78C25.54 83.67 29.84 86.53 34.59 88.31C37.13 89.25 39.54 89.76 43.18 90.14C43.98 90.24 44.41 90.34 44.89 90.55C45.64 90.91 46.64 91.63 46.72 91.9C46.75 91.99 46.86 92.15 46.96 92.25C47.15 92.41 47.17 92.39 47.47 91.87C47.83 91.23 48.81 90.3 49.47 89.97C49.71 89.85 50.48 89.6 51.17 89.44C57.11 87.97 62 85.13 66.41 80.61C70.06 76.86 72.45 73.04 74.88 67.09C75.98 64.39 79.12 63.16 81.63 64.43C83.56 65.42 84.69 67.59 84.32 69.61C84.14 70.56 83.15 73.01 81.95 75.44C78.33 82.77 73.13 88.84 66.77 93.15C62.94 95.75 58.66 97.68 54.19 98.83C51.9 99.42 50.76 99.39 49.47 98.75C48.94 98.48 47.94 97.61 47.68 97.2C47.51 96.89 47.51 96.89 47.29 97.29C46.74 98.34 46.11 98.93 45.07 99.43C44.05 99.91 43.25 100.01 41.64 99.89ZM44.05 68.98C41.65 68.58 39.64 67.78 37.68 66.48C34.04 64.04 31.45 60.08 30.54 55.57C30.24 54.02 30.21 50.9 30.49 49.49C31.37 45.16 33.82 41.74 37.18 40.14C38.5 39.52 39.5 39.27 41.04 39.21C42.51 39.15 43.54 39.3 44.82 39.81C47.34 40.78 49.29 42.84 50.13 45.44C50.95 47.95 50.39 50.1 48.54 51.5C46.85 52.78 44.36 52.81 42.75 51.56C42.07 51.04 41.67 50.57 41.29 49.93C41.13 49.65 40.98 49.44 40.96 49.44C40.93 49.44 40.78 49.72 40.62 50.08C39.87 51.67 39.94 53.57 40.82 55.44C42.44 58.9 46.01 60.24 49.22 58.56C51.68 57.28 53.51 54.64 54.33 51.18C54.65 49.84 54.76 47.17 54.57 45.71C53.98 41.23 51.68 37.17 48.31 34.68C47.19 33.85 45.24 32.89 44 32.57C38.39 31.11 32.64 33.69 28.94 39.33C27.44 41.64 26.3 44.65 25.73 47.85C25.46 49.41 25.35 52.96 25.53 54.69C25.73 56.65 26.22 58.78 26.92 60.87C27.28 61.95 27.61 63.08 27.65 63.39C27.85 65.08 26.93 66.99 25.49 67.95C22.93 69.65 19.64 68.68 18.28 65.85C17.39 64 16.37 60.25 15.9 57.08C15.61 55.23 15.5 50.79 15.69 48.84C16.44 40.94 19.55 34.11 24.65 29.14C25.88 27.94 26.72 27.26 28.41 26.14C31.09 24.35 33.86 23.22 36.92 22.67C45.84 21.07 54.68 24.96 60.03 32.88C62.37 36.35 63.94 40.72 64.41 45.1C64.59 46.77 64.49 50.28 64.22 51.85C63.76 54.43 63.18 56.3 62.16 58.41C59.52 63.9 55.02 67.64 49.62 68.83C48.38 69.11 45.28 69.19 44.05 68.98ZM81.26 63.99C79.04 63.62 77.45 61.99 77.14 59.75C77.08 59.3 77.1 58.73 77.23 57.69C77.59 54.95 77.67 53.32 77.61 50.16C77.55 47.24 77.44 45.78 77.07 43.59C75.57 34.52 71.57 26.3 65.68 20.18C64.01 18.44 61.12 16.01 59.74 15.18C59.52 15.05 58.96 14.7 58.51 14.41C57.04 13.46 54.82 12.39 52.8 11.65C49.14 10.33 45.63 9.75 41.85 9.88C39.57 9.95 37.75 10.21 35.54 10.78C33.13 11.39 32.11 11.34 30.69 10.54C28.98 9.59 27.98 7.49 28.31 5.57C28.43 4.8 28.87 3.74 29.16 3.5C29.26 3.43 29.33 3.3 29.33 3.23C29.33 3.04 30.4 2.19 31.01 1.91C32.03 1.43 34.74 0.77 37.17 0.41C41.49-0.23 46.09-0.09 50.41 0.77C55.92 1.89 61.25 4.21 66.09 7.6C68.28 9.14 69.78 10.41 71.93 12.51C78.66 19.11 83.73 28.31 85.99 38C87.15 43.02 87.55 46.89 87.46 52.29C87.38 56.39 87.06 59.55 86.55 60.92C86.13 62.09 84.98 63.26 83.84 63.69C83.34 63.88 82.15 64.12 81.9 64.09C81.85 64.08 81.56 64.04 81.26 63.99Z';
  MK.FP = FP;
  MK.fpSvg = function (px, mono) { var id = 'mkfp' + Math.random().toString(36).slice(2, 7); return '<svg viewBox="0 0 87.49 100" width="' + px + '" height="' + Math.round(px * 1.143) + '" aria-hidden="true">' + (mono ? '' : '<defs><linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="87.49" y2="0"><stop offset="0" stop-color="#0030C4"/><stop offset=".45" stop-color="#0858F0"/><stop offset=".8" stop-color="#0E8BFB"/><stop offset="1" stop-color="#33C8FF"/></linearGradient></defs>') + '<path fill="' + (mono ? 'currentColor' : 'url(#' + id + ')') + '" d="' + FP + '"/></svg>'; };
  /* 캔버스에 흰 칩 + 지문(그라데이션). (x, y) 칩 왼쪽 위, s 칩 한 변 */
  MK.fpChip = function (ctx, x, y, s, chip) {
    ctx.save();
    if (chip !== false) { rr(ctx, x, y, s, s, s * 0.27); ctx.fillStyle = chip || '#FFFFFF'; ctx.fill(); }
    var fh = s * 0.66, fw = fh * 0.8749;
    ctx.translate(x + (s - fw) / 2, y + (s - fh) / 2); ctx.scale(fw / 87.49, fh / 100);
    var g = ctx.createLinearGradient(0, 100, 87.49, 0); g.addColorStop(0, '#0030C4'); g.addColorStop(0.45, '#0858F0'); g.addColorStop(0.8, '#0E8BFB'); g.addColorStop(1, '#33C8FF');
    ctx.fillStyle = g; ctx.fill(new Path2D(FP)); ctx.restore();
  };

  /* ---------- 화면용 배지(HTML) ---------- */
  MK.badge = function (m, opt) {
    opt = opt || {};
    var g = MK.GRADE[m.basis] || 1, rev = m.status === 'revoked';
    return '<span class="mkb' + (rev ? ' is-rev' : '') + (opt.lg ? ' mkb-lg' : '') + '" data-g="' + g + '" title="' + MK.esc((MK.LABEL[m.label] || '') + ' · 근거 ' + (MK.BASIS[m.basis] || '')) + '">' +
      '<i class="mkb-ic mkb-fp" aria-hidden="true">' + MK.fpSvg(13) + '</i>' +
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
    if (opt.shadow !== false) { ctx.shadowColor = 'rgba(14, 31, 71,.28)'; ctx.shadowBlur = h * 0.35; ctx.shadowOffsetY = h * 0.06; }
    rr(ctx, x, y, w, h, h * 0.24); ctx.fillStyle = 'rgba(14, 31, 71,.93)'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, h * 0.03); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.stroke();
    // 반짝이 표
    MK.fpChip(ctx, x + pad, y + (h - ic) / 2, ic);   // 10.0 AI 마크
    var cx = x + pad + ic + gap;
    ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + f + 'px ' + FONT; ctx.fillText(text, cx, y + h / 2 + h * 0.015);
    cx += ctx.measureText(text).width + gap;
    // 근거 막대 세 칸
    for (var i = 0; i < 3; i++) {
      var bh = barH * (0.62 + 0.19 * i), by = y + (h + barH) / 2 - bh;
      rr(ctx, cx + i * (barW + barG), by, barW, bh, barW / 2); ctx.fillStyle = i < g ? '#4DB5FF' : 'rgba(255,255,255,.24)'; ctx.fill();
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
    return '<svg class="mk-qr" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 132) + '" height="' + (px || 132) + '" role="img" aria-label="마크 확인 QR 코드" shape-rendering="crispEdges"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#0E1F47"/></svg>';
  };
  MK.qrDraw = function (ctx, text, x, y, size) {
    var q = MK.qr(text), n = q.getModuleCount(), cell = size / n;
    ctx.save(); ctx.fillStyle = '#0E1F47';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(Math.floor(x + c * cell), Math.floor(y + r * cell), Math.ceil(cell), Math.ceil(cell));
    ctx.restore();
  };

  /* ---------- 마크 카드 그림(PNG): 배지 · 근거 · QR · 주소 ---------- */
  MK.cardPng = function (m) {
    return MK.fontsReady().then(function () {
      var W = 1200, H = 480, c = document.createElement('canvas'); c.width = W; c.height = H;
      var x = c.getContext('2d');
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#F6F7F9'; x.fillRect(0, 0, W, 6);
      rr(x, 1, 1, W - 2, H - 2, 28); x.lineWidth = 2; x.strokeStyle = '#E8E9EB'; x.stroke();
      MK.draw(x, 56, 64, 92, m, { shadow: false });
      x.fillStyle = '#0E1F47'; x.font = '800 40px ' + FONT; x.textBaseline = 'alphabetic';
      x.fillText(MK.DESC[m.label] || '', 56, 236);
      x.fillStyle = '#65676A'; x.font = '600 26px ' + FONT;
      x.fillText('근거: ' + (MK.BASIS[m.basis] || '') + (m.at ? ' · 발급 ' + String(m.at).slice(0, 10) : ''), 56, 290);
      x.fillText('이 마크가 맞는지 QR이나 아래 주소에서 확인하세요', 56, 334);
      x.fillStyle = '#0E1F47'; x.font = '700 26px ' + FONT; x.fillText(MK.markUrl(m.id).replace('https://', ''), 56, 404);
      MK.qrDraw(x, MK.markUrl(m.id), W - 56 - 300, 90, 300);
      x.fillStyle = '#919396'; x.font = '600 20px ' + FONT; x.fillText('AIMarker 전자서명 마크', W - 56 - 300, 430);
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
    ctx.save(); ctx.shadowColor = 'rgba(14, 31, 71,.24)'; ctx.shadowBlur = h * 0.3; ctx.shadowOffsetY = h * 0.05;
    rr(ctx, x, y, w, h, h * 0.24); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, h * 0.04); ctx.strokeStyle = 'rgba(14, 31, 71,.9)'; ctx.stroke();
    ctx.fillStyle = '#13224A'; ctx.font = '850 ' + (h * 0.42) + 'px ' + FONT; ctx.textBaseline = 'middle'; ctx.fillText(text, x + h * 0.31, y + h / 2 + h * 0.02);
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
  /* pos: tl · tr · bl · br, size: s · m · l, qr: true면 배지 옆에 QR, tags: 광고 · 가상인물 꼬리표 */
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
      var g = x.createLinearGradient(0, 0, cw, vh); g.addColorStop(0, '#E5E6E8'); g.addColorStop(1, '#E7F7F1'); x.fillStyle = g; x.fillRect(0, 0, cw, vh);
      x.fillStyle = 'rgba(14, 31, 71,.10)'; for (var i = 0; i < 7; i++) { x.beginPath(); x.arc(cw * (0.15 + i * 0.13), vh * (0.35 + 0.18 * Math.sin(i)), vh * (0.08 + 0.03 * (i % 3)), 0, Math.PI * 2); x.fill(); }
      x.fillStyle = 'rgba(14, 31, 71,.45)'; x.font = '700 ' + Math.round(cw * 0.04) + 'px ' + FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('견본 이미지', cw / 2, vh / 2);
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
