/* AIMarker · 이미지 표시 · 확인 (/image/)
 * - AI 생성 기록 판별: C2PA(JUMBF), IPTC DigitalSourceType(XMP), 생성 도구 흔적(EXIF · XMP · PNG 설명)
 * - 보이는 'AI 생성' 표시를 굽고, IPTC XMP(DigitalSourceType)를 넣어 내려받기
 * - 파일은 서버로 보내지 않음(모두 이 브라우저 안에서) */
(function () {
  'use strict';
  var MAX_FREE = 3, MAX_SIDE = 16000, MAX_AREA = 16000000;   // 휴대폰 브라우저 캔버스 한도(약 1,670만 화소) 안쪽
  var $ = function (s) { return document.querySelector(s); };
  var list = $('#list'), drop = $('#drop'), input = $('#files');
  var items = [], seq = 0;
  var SPARK = 'M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z';
  var FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  var DST = { gen: 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia', edit: 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia' };

  /* ---------- 판별 ---------- */
  function latin1(u8, s, e) {
    var out = '', CH = 8192;
    e = Math.min(e, u8.length);
    for (var i = s; i < e; i += CH) out += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + CH, e)));
    return out;
  }
  function u32(u8, i) { return ((u8[i] << 24) >>> 0) + (u8[i + 1] << 16) + (u8[i + 2] << 8) + u8[i + 3]; }
  function u32le(u8, i) { return u8[i] + (u8[i + 1] << 8) + (u8[i + 2] << 16) + ((u8[i + 3] << 24) >>> 0); }
  function collectMeta(u8) {
    var text = '', c2pa = false, kind = 'other', i;
    if (u8[0] === 0xFF && u8[1] === 0xD8) {
      kind = 'jpeg'; i = 2;
      while (i + 4 <= u8.length) {
        if (u8[i] !== 0xFF) break;
        var m = u8[i + 1];
        if (m === 0xD9 || m === 0xDA) break;
        if (m === 0x01 || (m >= 0xD0 && m <= 0xD7) || m === 0xFF) { i += (m === 0xFF ? 1 : 2); continue; }
        var len = (u8[i + 2] << 8) | u8[i + 3], st = i + 4, en = i + 2 + len;
        if (m === 0xE1 || m === 0xEB || m === 0xFE || m === 0xED) {
          var seg = latin1(u8, st, en);
          if (m === 0xEB && /jumb|c2pa/.test(seg)) c2pa = true;
          text += '\n' + seg;
        }
        i = en;
      }
    } else if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) {
      kind = 'png'; i = 8;
      while (i + 8 <= u8.length) {
        var ln = u32(u8, i), tp = latin1(u8, i + 4, i + 8), ds = i + 8, de = ds + ln;
        if (tp === 'tEXt' || tp === 'iTXt' || tp === 'eXIf' || tp === 'caBX') { text += '\n' + tp + ':' + latin1(u8, ds, Math.min(de, ds + 400000)); if (tp === 'caBX') c2pa = true; }
        else if (tp === 'zTXt') text += '\n' + tp + ':' + latin1(u8, ds, Math.min(de, ds + 80));
        if (tp === 'IEND') break;
        i = de + 4;
      }
    } else if (latin1(u8, 0, 4) === 'RIFF' && latin1(u8, 8, 12) === 'WEBP') {
      kind = 'webp'; i = 12;
      while (i + 8 <= u8.length) {
        var fc = latin1(u8, i, i + 4), sz = u32le(u8, i + 4), s2 = i + 8;
        if (fc === 'EXIF' || fc === 'XMP ' || fc === 'C2PA') { text += '\n' + fc + ':' + latin1(u8, s2, Math.min(s2 + sz, s2 + 400000)); if (fc === 'C2PA') c2pa = true; }
        i = s2 + sz + (sz % 2);
      }
    } else {
      text = latin1(u8, 0, Math.min(u8.length, 262144));
    }
    if (!c2pa && /c2pa\.(claim|actions|assertions|hash)|urn:c2pa|jumbf/i.test(text)) c2pa = true;
    return { text: text, c2pa: c2pa, kind: kind };
  }
  var TOOLS = [
    [/adobe[\s_]*firefly|\bfirefly\b/i, 'Adobe Firefly'], [/dall[\s·\-–_]?e/i, 'DALL·E'], [/gpt-?4o|gpt-image|chatgpt/i, 'ChatGPT'],
    [/midjourney/i, 'Midjourney'], [/stable[\s_]*diffusion|\bsdxl\b/i, 'Stable Diffusion'], [/comfyui/i, 'ComfyUI'], [/novelai/i, 'NovelAI'],
    [/\bimagen\b/i, 'Google Imagen'], [/\bgemini\b/i, 'Google Gemini'], [/made with google ai/i, 'Google AI'],
    [/bing image creator|microsoft designer|image creator from designer/i, 'Microsoft Designer'], [/ideogram/i, 'Ideogram'],
    [/leonardo[\s.]?ai/i, 'Leonardo.Ai'], [/\bflux(\.1)?\b/i, 'FLUX'], [/runwayml|\brunway\b/i, 'Runway'], [/\bkling\b/i, 'Kling'],
    [/\bsora\b/i, 'Sora'], [/krea\.ai/i, 'Krea'], [/playground\s?ai/i, 'Playground'], [/nightcafe/i, 'NightCafe'], [/dreamstudio/i, 'DreamStudio'],
    [/\bopenai\b/i, 'OpenAI']
  ];
  function analyze(meta) {
    var t = meta.text, r = { type: null, tool: '', c2pa: meta.c2pa, labeled: false, signals: [] };
    if (/AIMarker \(aimarker\.kr\)/.test(t)) r.labeled = true;
    if (/compositeWithTrainedAlgorithmicMedia/.test(t)) { r.type = 'edit'; r.signals.push('IPTC 기록: AI로 편집 · 합성'); }
    else if (/trainedAlgorithmicMedia/.test(t)) { r.type = 'gen'; r.signals.push('IPTC 기록: AI 생성'); }
    if (/parameters\u0000[\s\S]{0,6000}(Steps: \d|Sampler: |CFG scale)/.test(t)) { r.tool = 'Stable Diffusion'; r.signals.push('생성 설정(프롬프트) 기록'); }
    else if (/(prompt|workflow)\u0000\{/.test(t)) { r.tool = 'ComfyUI'; r.signals.push('생성 설정(워크플로) 기록'); }
    if (!r.tool) {
      var probe = t.replace(/AIMarker \(aimarker\.kr\)/g, '');
      for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i][0].test(probe)) { r.tool = TOOLS[i][1]; break; }
    }
    if (r.tool && !r.type) { r.type = /photoshop/i.test(t) && r.tool === 'Adobe Firefly' ? 'edit' : 'gen'; r.signals.push('생성 도구 기록: ' + r.tool); }
    if (r.c2pa) r.signals.push('C2PA 출처 정보');
    return r;
  }

  /* ---------- 그리기 ---------- */
  function opts() {
    var q = function (n) { var el = document.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ''; };
    return { text: q('text'), pos: q('pos'), theme: $('#optTheme').value, size: $('#optSize').value, meta: $('#optMeta').checked, credit: $('#optCredit').checked };
  }
  function labelFor(it, o) {
    if (it.det.labeled && !it.answer) return undefined;   // 이미 표시된 파일은 한 번 더 묻기
    var a = it.answer || (it.det.type === 'edit' ? 'edit' : it.det.type === 'gen' ? 'gen' : null);
    if (it.answer === 'human') return null;
    if (!a) return undefined;   // 아직 모름 → 묻기
    if (o.text !== 'auto') return o.text;
    return a === 'edit' ? 'AI 편집' : a === 'virtual' ? '가상인물' : 'AI 생성';
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawLabel(ctx, W, H, text, o) {
    var f = Math.round(Math.min(W, H) * ({ s: 0.026, m: 0.034, l: 0.045 })[o.size]); f = Math.max(12, Math.min(96, f));
    var padX = f * 0.62, padY = f * 0.42, gap = f * 0.32, icon = f * 0.92, rad = f * 0.5;
    ctx.save();
    ctx.font = '800 ' + f + 'px ' + FONT; var tw = ctx.measureText(text).width;
    var cf = f * 0.56, cw = 0, cg = 0;
    if (o.credit) { ctx.font = '750 ' + cf + 'px ' + FONT; cw = ctx.measureText('AIMarker').width; cg = f * 0.48; }
    var w = padX + icon + gap + tw + (o.credit ? cg * 2 + cw : 0) + padX, h = f + padY * 2, m = Math.max(10, f * 0.8);
    var x = o.pos === 'tr' || o.pos === 'br' ? W - m - w : m, y = o.pos === 'bl' || o.pos === 'br' ? H - m - h : m;
    var dark = o.theme === 'dark';
    ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = f * 0.5; ctx.shadowOffsetY = f * 0.08;
    rr(ctx, x, y, w, h, rad); ctx.fillStyle = dark ? 'rgba(10,18,36,.76)' : 'rgba(255,255,255,.92)'; ctx.fill();
    ctx.shadowColor = 'transparent';
    if (!dark) { ctx.lineWidth = Math.max(1, f * 0.05); ctx.strokeStyle = 'rgba(14,42,107,.18)'; ctx.stroke(); }
    ctx.save(); ctx.translate(x + padX, y + (h - icon) / 2); ctx.scale(icon / 24, icon / 24); ctx.fillStyle = dark ? '#FFFFFF' : '#1F55F5'; ctx.fill(new Path2D(SPARK)); ctx.restore();
    ctx.fillStyle = dark ? '#FFFFFF' : '#0B1324'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + f + 'px ' + FONT;
    var tx = x + padX + icon + gap; ctx.fillText(text, tx, y + h / 2 + f * 0.04);
    if (o.credit) {
      var dx = tx + tw + cg; ctx.globalAlpha = dark ? 0.35 : 0.25; ctx.fillStyle = dark ? '#FFFFFF' : '#0B1324';
      ctx.fillRect(dx, y + h * 0.3, Math.max(1, f * 0.05), h * 0.4); ctx.globalAlpha = dark ? 0.82 : 0.7;
      ctx.font = '750 ' + cf + 'px ' + FONT; ctx.fillText('AIMarker', dx + cg, y + h / 2 + f * 0.04);
    }
    ctx.restore();
  }
  function loadImg(file) {
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { ok(img); }; img.onerror = function () { URL.revokeObjectURL(url); bad(new Error('decode')); };
      img.src = url; img._url = url;
    });
  }
  function renderFull(it, o, text, flat) {
    var img = it.img, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, MAX_SIDE / Math.max(w, h), Math.sqrt(MAX_AREA / (w * h)));
    var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    var ctx = c.getContext('2d');
    if (flat) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height); }   // JPG 는 투명 부분을 흰색으로
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (text) drawLabel(ctx, c.width, c.height, text, o);
    return c;
  }
  function renderPreview(it) {
    var o = opts(), text = labelFor(it, o), full = renderFull(it, o, text || null);
    var pv = it.el.querySelector('canvas'), k = Math.min(1, 360 / full.width);
    pv.width = Math.round(full.width * k); pv.height = Math.round(full.height * k);
    pv.getContext('2d').drawImage(full, 0, 0, pv.width, pv.height);
    it.text = text; it.full = full;
    it.scaled = full.width < it.img.naturalWidth;
    paintState(it);
  }

  /* ---------- 메타데이터 넣기 ---------- */
  function xmp(text) {
    var dst = text === 'AI 편집' ? DST.edit : DST.gen;
    var desc = text === '가상인물' ? 'AI로 만든 가상인물이 포함된 이미지입니다' : text === 'AI 편집' ? 'AI로 편집 · 합성한 이미지입니다' : 'AI로 만든 이미지입니다';
    return '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
      '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"' +
      ' Iptc4xmpExt:DigitalSourceType="' + dst + '" xmp:CreatorTool="AIMarker (aimarker.kr)" photoshop:Credit="AIMarker 표시">' +
      '<dc:description><rdf:Alt><rdf:li xml:lang="x-default">' + desc + ' · ' + text + ' 표시</rdf:li></rdf:Alt></dc:description>' +
      '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
  }
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function concat(parts) { var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length; var o = new Uint8Array(n), p = 0; for (i = 0; i < parts.length; i++) { o.set(parts[i], p); p += parts[i].length; } return o; }
  var enc = new TextEncoder();
  function withXmpJpeg(u8, x) {
    var hdr = enc.encode('http://ns.adobe.com/xap/1.0/\u0000'), body = enc.encode(x), len = 2 + hdr.length + body.length;
    if (len > 65535) return u8;
    var seg = concat([new Uint8Array([0xFF, 0xE1, len >> 8, len & 0xFF]), hdr, body]);
    var at = 2;
    if (u8[2] === 0xFF && u8[3] === 0xE0) at = 4 + ((u8[4] << 8) | u8[5]);   // JFIF(APP0) 다음
    return concat([u8.subarray(0, at), seg, u8.subarray(at)]);
  }
  function withXmpPng(u8, x) {
    var kw = enc.encode('XML:com.adobe.xmp'), data = concat([kw, new Uint8Array([0, 0, 0, 0, 0]), enc.encode(x)]);
    var type = enc.encode('iTXt'), len = data.length;
    var crc = crc32(concat([type, data]));
    var chunk = concat([new Uint8Array([len >>> 24, (len >> 16) & 255, (len >> 8) & 255, len & 255]), type, data, new Uint8Array([crc >>> 24, (crc >> 16) & 255, (crc >> 8) & 255, crc & 255])]);
    return concat([u8.subarray(0, 33), chunk, u8.subarray(33)]);   // 서명(8) + IHDR(25) 다음
  }
  function exportBlob(it) {
    var o = opts(), png = it.file.type === 'image/png';
    var full = renderFull(it, o, it.text, !png);
    return new Promise(function (ok) { full.toBlob(ok, png ? 'image/png' : 'image/jpeg', 0.92); }).then(function (b) {
      if (!o.meta || !it.text) return b;
      return b.arrayBuffer().then(function (ab) {
        var u8 = new Uint8Array(ab), outU8 = png ? withXmpPng(u8, xmp(it.text)) : withXmpJpeg(u8, xmp(it.text));
        return new Blob([outU8], { type: png ? 'image/png' : 'image/jpeg' });
      });
    }).then(function (b) {
      var base = it.file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 60) || 'image';
      return { blob: b, name: base + '_ai-marker.' + (png ? 'png' : 'jpg') };
    });
  }
  function save(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ---------- 화면 ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sizeTxt(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB'; }
  function paintState(it) {
    var d = it.det, res = it.el.querySelector('.res'), ask = it.el.querySelector('.ask'), act = it.el.querySelector('.act');
    var html;
    if (d.labeled) html = '<span class="chip chip-m">이미 AIMarker 표시가 들어 있어요</span>';
    else if (d.type === 'gen') html = '<span class="chip chip-m">AI 생성 기록 찾음' + (d.tool ? ' · ' + esc(d.tool) : '') + '</span>';
    else if (d.type === 'edit') html = '<span class="chip chip-m">AI 편집 기록 찾음' + (d.tool ? ' · ' + esc(d.tool) : '') + '</span>';
    else if (d.c2pa) html = '<span class="chip chip-b">출처 정보(C2PA)는 있지만 AI 여부는 적혀 있지 않아요</span>';
    else html = '<span class="chip">AI 생성 기록이 없어요</span>';
    if (d.signals.length) html += '<div class="note mt8">' + d.signals.map(esc).join(' · ') + '</div>';
    if (it.scaled) html += '<div class="note mt8">' + it.img.naturalWidth + '×' + it.img.naturalHeight + ' → ' + it.full.width + '×' + it.full.height + '로 줄여 저장합니다(무료는 약 1,600만 화소까지).</div>';
    res.innerHTML = html;
    var undecided = it.text === undefined;
    ask.hidden = !undecided && !it.answer;
    if (undecided && d.labeled) ask.innerHTML = '<p>이미 표시가 들어 있는 파일이에요. 한 번 더 표시할까요?</p><div class="chips"><button class="btn btn-g btn-s" data-a="' + (d.type === 'edit' ? 'edit' : 'gen') + '">한 번 더 표시하기</button></div>';
    else if (undecided) ask.innerHTML = '<p>이 이미지, AI로 만들었나요?</p><div class="chips">' +
      '<button class="btn btn-g btn-s" data-a="gen">AI로 만들었어요</button><button class="btn btn-g btn-s" data-a="edit">AI로 일부 고쳤어요</button>' +
      '<button class="btn btn-g btn-s" data-a="virtual">AI 가상인물이에요</button><button class="btn btn-g btn-s" data-a="human">아니요, 사람이 만들었어요</button></div>';
    else if (it.answer) ask.innerHTML = '<p class="note">' + ({ gen: 'AI로 만들었다고 고르셨어요.', edit: 'AI로 일부 고쳤다고 고르셨어요.', virtual: 'AI 가상인물이라고 고르셨어요.', human: '사람이 만들었다고 고르셨어요. 표시가 필요 없어요.' })[it.answer] + ' <a href="#" data-a="reset">다시 고르기</a></p>';
    act.innerHTML = it.text ? '<button class="btn btn-p btn-s" data-dl>' + '<svg class="ico" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg><span>\'' + esc(it.text) + '\' 표시해서 내려받기</span></button>' : '';
    refreshBulk();
  }
  function refreshBulk() {
    var ready = items.filter(function (x) { return x.text; }).length;
    $('#dlAll').disabled = ready < 1; $('#clear').disabled = !items.length;
    $('#dlAll').querySelector('span').textContent = ready > 1 ? '모두 내려받기(' + ready + '장)' : '내려받기';
  }
  function addFiles(files) {
    var arr = Array.prototype.filter.call(files, function (f) { return /^image\/(jpeg|png|webp)$/.test(f.type); });
    var skipped = files.length - arr.length, room = MAX_FREE - items.length, over = 0;
    if (arr.length > room) { over = arr.length - Math.max(0, room); arr = arr.slice(0, Math.max(0, room)); }
    if (skipped || over) {
      var n = document.createElement('div'); n.className = 'callout a mt16';
      n.innerHTML = '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg><div>' +
        (skipped ? 'JPG · PNG · WebP 가 아닌 파일 ' + skipped + '개는 뺐어요(아이폰 HEIC 는 JPG 로 바꿔 올려 주세요). ' : '') +
        (over ? '무료는 한 번에 ' + MAX_FREE + '장까지예요. 나머지 ' + over + '장은 내려받은 뒤 비우고 다시 올려 주세요. <a href="' + (document.body.getAttribute('data-root') || '') + 'pricing/?plan=plus#pre" data-plan="플러스">플러스는 한 번에 50장</a>' : '') + '</div>';
      list.prepend(n); setTimeout(function () { n.remove(); }, 9000);
    }
    arr.forEach(function (file) {
      var it = { id: ++seq, file: file, answer: null, det: { type: null, tool: '', c2pa: false, labeled: false, signals: [] } };
      var el = document.createElement('div'); el.className = 'item'; el.setAttribute('data-id', it.id);
      el.innerHTML = '<canvas aria-label="표시 미리보기"></canvas><div><div class="fn">' + esc(file.name) + '</div><div class="meta">' + sizeTxt(file.size) + '</div><div class="res" aria-live="polite"><span class="chip">살펴보는 중…</span></div><div class="ask"></div><div class="act"></div></div>';
      it.el = el; list.appendChild(el); items.push(it);
      file.arrayBuffer().then(function (ab) {
        it.det = analyze(collectMeta(new Uint8Array(ab)));
        return loadImg(file);
      }).then(function (img) { it.img = img; return document.fonts && document.fonts.load ? document.fonts.load('800 32px ' + FONT).catch(function () {}) : null; })
        .then(function () { renderPreview(it); })
        .catch(function () { el.querySelector('.res').innerHTML = '<span class="chip chip-a">이 파일은 열 수 없어요</span>'; });
    });
    refreshBulk();
  }
  list.addEventListener('click', function (e) {
    var el = e.target.closest('.item'); if (!el) return;
    var it = items.filter(function (x) { return String(x.id) === el.getAttribute('data-id'); })[0]; if (!it) return;
    var a = e.target.closest('[data-a]');
    if (a) { e.preventDefault(); it.answer = a.getAttribute('data-a') === 'reset' ? null : a.getAttribute('data-a'); renderPreview(it); return; }
    if (e.target.closest('[data-dl]')) exportBlob(it).then(function (r) { save(r.blob, r.name); });
  });
  ['#optTheme', '#optSize', '#optMeta'].forEach(function (s) { $(s).addEventListener('change', function () { items.forEach(function (it) { if (it.img) renderPreview(it); }); }); });
  Array.prototype.forEach.call(document.querySelectorAll('#optText input, #optPos input'), function (r) { r.addEventListener('change', function () { items.forEach(function (it) { if (it.img) renderPreview(it); }); }); });
  $('#dlAll').addEventListener('click', function () {
    var ready = items.filter(function (x) { return x.text; });
    if (ready.length === 1 || !window.JSZip) { ready.forEach(function (it, i) { setTimeout(function () { exportBlob(it).then(function (r) { save(r.blob, r.name); }); }, i * 400); }); return; }
    var zip = new window.JSZip();
    Promise.all(ready.map(exportBlob)).then(function (rs) { rs.forEach(function (r) { zip.file(r.name, r.blob); }); return zip.generateAsync({ type: 'blob' }); })
      .then(function (b) { save(b, 'ai-marker-images.zip'); });
  });
  $('#clear').addEventListener('click', function () { items.forEach(function (it) { if (it.img && it.img._url) URL.revokeObjectURL(it.img._url); }); items = []; list.innerHTML = ''; refreshBulk(); });
  input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { if (!e.target.closest('#drop')) { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); } });
  window.AMImage = { analyze: analyze, collectMeta: collectMeta };   // 시험용
})();
