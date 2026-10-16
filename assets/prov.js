/* AIMarker 이미지 출처 판별 · 표시 넣기(작업 공간용). 파일은 서버로 보내지 않고 이 브라우저 안에서만 읽습니다.
 * 근거: C2PA(JUMBF) · IPTC DigitalSourceType(XMP) · 생성 도구 기록(EXIF · XMP · PNG 설명) · 파일 이름 · AI 생성물에 흔한 크기 · 카메라 원본 기록
 * 판정(보수적): confirmed(파일 속 AI 기록) · likely(이름 단서) · check(크기 단서 · 편집 도구) · camera(카메라 원본) · unknown(기록이 지워짐 · 확인 불가) */
(function () {
  'use strict';
  var P = window.AMProv = {};
  var FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  var SPARK = 'M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z';
  var DST = { gen: 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia', edit: 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia' };
  var NAME_RE = /Gemini_Generated_Image|ChatGPT[\s_\-]?Image|DALL[·\-_]?E|OIG\d?[._\-]|ComfyUI|midjourney|(?:^|[\s_\-])mj[_\-]|firefly|leonardo[_\-]|ideogram|stable[\s_\-]?diffusion|sdxl|novelai|flux[_\-]\d|imagen[_\-]|bing[\s_\-]?image|copilot[\s_\-]image|generated[\s_\-]image|ai[\s_\-]generated|AI\s?생성|dreamina|seedream|recraft|^\d{5}-\d{6,12}\.png$/i;
  var SIZES = { '1024x1024': 1, '1792x1024': 1, '1024x1792': 1, '1536x1024': 1, '1024x1536': 1, '2048x2048': 1, '512x512': 1, '768x768': 1, '512x768': 1, '768x512': 1, '1152x896': 1, '896x1152': 1, '1216x832': 1, '832x1216': 1, '1344x768': 1, '768x1344': 1, '1536x640': 1, '640x1536': 1, '1456x816': 1, '816x1456': 1, '1232x928': 1, '928x1232': 1, '1184x864': 1, '864x1184': 1, '1248x832': 1, '832x1248': 1, '2048x1152': 1, '1152x2048': 1, '1408x768': 1, '768x1408': 1 };
  var TOOLS = [
    [/adobe[\s_]*firefly|\bfirefly\b/i, 'Adobe Firefly'], [/dall[\s·\-–_]?e/i, 'DALL·E'], [/gpt-?4o|gpt-image|chatgpt/i, 'ChatGPT'], [/midjourney/i, 'Midjourney'],
    [/stable[\s_]*diffusion|\bsdxl\b/i, 'Stable Diffusion'], [/comfyui/i, 'ComfyUI'], [/novelai/i, 'NovelAI'], [/\bimagen\b/i, 'Google Imagen'], [/\bgemini\b/i, 'Google Gemini'],
    [/made with google ai|synthid/i, 'Google AI'], [/bing image creator|microsoft designer|image creator from/i, 'Microsoft Designer'], [/ideogram/i, 'Ideogram'], [/leonardo[\s.]?ai/i, 'Leonardo.Ai'],
    [/\bflux(\.1)?\b/i, 'FLUX'], [/runwayml|\brunway\b/i, 'Runway'], [/\bkling\b/i, 'Kling'], [/\bsora\b/i, 'Sora'], [/krea\.ai/i, 'Krea'], [/\bopenai\b/i, 'OpenAI'], [/generative (fill|expand)/i, 'Adobe 생성형 채우기']
  ];
  var CAMERA = /iPhone\s?\d|Canon EOS|Canon PowerShot|NIKON (?:D|Z)\s?\d|ILCE-\d|ILCA-|DSC-[A-Z]{1,3}\d|SM-[A-Z]\d{3}|Galaxy S\d|Pixel \d|FUJIFILM|X-T\d|X-S\d|OLYMPUS|OM Digital|LEICA|Panasonic DC-|LUMIX|RICOH GR|PENTAX|Hasselblad|DJI FC\d|GoPro|HERO\d/;
  var EDITORS = /Adobe Photoshop|Photoshop|Lightroom|Adobe Illustrator|Adobe Express|Canva|Figma|GIMP|Pixelmator|Affinity|Snapseed|PicsArt|Meitu|Fotor|Photopea/;

  function latin1(u8, s, e) { var out = '', CH = 8192; e = Math.min(e, u8.length); for (var i = s; i < e; i += CH) out += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + CH, e))); return out; }
  function u32(u8, i) { return ((u8[i] << 24) >>> 0) + (u8[i + 1] << 16) + (u8[i + 2] << 8) + u8[i + 3]; }
  function u32le(u8, i) { return u8[i] + (u8[i + 1] << 8) + (u8[i + 2] << 16) + ((u8[i + 3] << 24) >>> 0); }
  function meta(u8) {
    var text = '', c2pa = false, kind = 'other', exif = false, i;
    if (u8[0] === 0xFF && u8[1] === 0xD8) {
      kind = 'jpeg'; i = 2;
      while (i + 4 <= u8.length) {
        if (u8[i] !== 0xFF) break;
        var m = u8[i + 1];
        if (m === 0xD9 || m === 0xDA) break;
        if (m === 0x01 || (m >= 0xD0 && m <= 0xD7) || m === 0xFF) { i += (m === 0xFF ? 1 : 2); continue; }
        var len = (u8[i + 2] << 8) | u8[i + 3], st = i + 4, en = i + 2 + len;
        if (m === 0xE1 || m === 0xEB || m === 0xFE || m === 0xED) { var seg = latin1(u8, st, en); if (m === 0xEB && /jumb|c2pa/.test(seg)) c2pa = true; if (m === 0xE1 && seg.indexOf('Exif') === 0) exif = true; text += '\n' + seg; }
        i = en;
      }
    } else if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) {
      kind = 'png'; i = 8;
      while (i + 8 <= u8.length) {
        var ln = u32(u8, i), tp = latin1(u8, i + 4, i + 8), ds = i + 8, de = ds + ln;
        if (tp === 'tEXt' || tp === 'iTXt' || tp === 'eXIf' || tp === 'caBX') { text += '\n' + tp + ':' + latin1(u8, ds, Math.min(de, ds + 400000)); if (tp === 'caBX') c2pa = true; if (tp === 'eXIf') exif = true; }
        else if (tp === 'zTXt') text += '\n' + tp + ':' + latin1(u8, ds, Math.min(de, ds + 80));
        if (tp === 'IEND') break;
        i = de + 4;
      }
    } else if (latin1(u8, 0, 4) === 'RIFF' && latin1(u8, 8, 12) === 'WEBP') {
      kind = 'webp'; i = 12;
      while (i + 8 <= u8.length) {
        var fc = latin1(u8, i, i + 4), sz = u32le(u8, i + 4), s2 = i + 8;
        if (fc === 'EXIF' || fc === 'XMP ' || fc === 'C2PA') { text += '\n' + fc + ':' + latin1(u8, s2, Math.min(s2 + sz, s2 + 400000)); if (fc === 'C2PA') c2pa = true; if (fc === 'EXIF') exif = true; }
        i = s2 + sz + (sz % 2);
      }
    } else { text = latin1(u8, 0, Math.min(u8.length, 262144)); }
    if (!c2pa && /c2pa\.(claim|actions|assertions|hash)|urn:c2pa|jumbf/i.test(text)) c2pa = true;
    return { text: text, c2pa: c2pa, kind: kind, exif: exif };
  }
  function judge(m, name, w, h) {
    var t = m.text, r = { type: null, tool: '', c2pa: m.c2pa, labeled: /AIMarker \(aimarker\.kr\)/.test(t), signals: [], camera: false, edited: false, stripped: false, nameHint: false, sizeHint: false };
    if (/compositeWithTrainedAlgorithmicMedia/.test(t)) { r.type = 'edit'; r.signals.push('IPTC 기록: AI로 편집 · 합성'); }
    else if (/trainedAlgorithmicMedia/.test(t)) { r.type = 'gen'; r.signals.push('IPTC 기록: AI 생성'); }
    if (/parameters\u0000[\s\S]{0,6000}(Steps: \d|Sampler: |CFG scale)/.test(t)) { r.tool = 'Stable Diffusion'; r.signals.push('생성 설정(프롬프트) 기록'); }
    else if (/(prompt|workflow)\u0000\{/.test(t)) { r.tool = 'ComfyUI'; r.signals.push('생성 설정(워크플로) 기록'); }
    if (!r.tool) { var probe = t.replace(/AIMarker \(aimarker\.kr\)/g, ''); for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i][0].test(probe)) { r.tool = TOOLS[i][1]; break; } }
    if (r.tool && !r.type) { r.type = 'gen'; r.signals.push('생성 도구 기록: ' + r.tool); }
    if (r.c2pa) r.signals.push('C2PA 출처 정보');
    if (!r.type && m.exif && CAMERA.test(t)) { r.camera = true; r.signals.push('카메라 원본 기록'); }
    if (!r.type && EDITORS.test(t)) { r.edited = true; r.signals.push('편집 도구 기록'); }
    if (!r.type && NAME_RE.test(name || '')) { r.nameHint = true; r.signals.push('파일 이름에 AI 도구 흔적'); }
    if (!r.type && w && h && SIZES[w + 'x' + h]) { r.sizeHint = true; r.signals.push('AI 생성물에 흔한 크기(' + w + '×' + h + ')'); }
    if (!t.replace(/\s+/g, '') || (!m.exif && !m.c2pa && !/x:xmpmeta|ns\.adobe\.com\/xap|tEXt|iTXt/.test(t))) r.stripped = true;
    r.level = r.type ? 'confirmed' : r.nameHint ? 'likely' : (r.sizeHint || r.edited) ? 'check' : r.camera ? 'camera' : 'unknown';
    r.label = r.type === 'edit' ? 'AI 편집' : (r.type || r.nameHint) ? 'AI 생성' : '';
    return r;
  }
  P.LEVEL = { confirmed: { t: 'AI 기록 있음', c: 'hi' }, likely: { t: 'AI 흔적(이름)', c: 'mid' }, check: { t: '참고 단서만 있음', c: 'blue' }, camera: { t: '카메라 원본', c: 'ok' }, unknown: { t: '기록 없음 · 확인 불가', c: 'grey' } };

  function loadImg(file) {
    return new Promise(function (ok, bad) { var url = URL.createObjectURL(file), img = new Image(); img.onload = function () { ok(img); }; img.onerror = function () { URL.revokeObjectURL(url); bad(new Error('decode')); }; img.src = url; img._url = url; });
  }
  P.thumb = function (img, max) {
    var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, (max || 480) / Math.max(w, h)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.78);
  };
  /* 파일 하나 살피기 → { name, size, type, w, h, thumb, det } */
  P.inspect = function (file) {
    var out = { name: file.name, size: file.size, type: file.type };
    return file.slice(0, 4 * 1024 * 1024).arrayBuffer().then(function (ab) {
      out._meta = meta(new Uint8Array(ab));
      return /^image\/(jpeg|png|webp|gif)$/.test(file.type) ? loadImg(file) : null;
    }).then(function (img) {
      if (img) { out.w = img.naturalWidth; out.h = img.naturalHeight; out.thumb = P.thumb(img, 480); out._img = img; }
      out.det = judge(out._meta, file.name, out.w, out.h); delete out._meta;
      return out;
    });
  };
  /* 보이는 표시 + 파일 속 IPTC 기록을 넣은 새 파일 */
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawLabel(ctx, W, H, text, o) {
    var f = Math.round(Math.min(W, H) * 0.034); f = Math.max(12, Math.min(96, f));
    var padX = f * 0.62, padY = f * 0.42, gap = f * 0.32, icon = f * 0.92, rad = f * 0.5;
    ctx.save(); ctx.font = '800 ' + f + 'px ' + FONT; var tw = ctx.measureText(text).width;
    var w = padX + icon + gap + tw + padX, h = f + padY * 2, m = Math.max(10, f * 0.8);
    var x = o.pos === 'tr' || o.pos === 'br' ? W - m - w : m, y = o.pos === 'bl' || o.pos === 'br' ? H - m - h : m, dark = o.theme !== 'light';
    ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = f * 0.5; ctx.shadowOffsetY = f * 0.08;
    rr(ctx, x, y, w, h, rad); ctx.fillStyle = dark ? 'rgba(10,18,36,.78)' : 'rgba(255,255,255,.92)'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); ctx.translate(x + padX, y + (h - icon) / 2); ctx.scale(icon / 24, icon / 24); ctx.fillStyle = dark ? '#FFFFFF' : '#1F55F5'; ctx.fill(new Path2D(SPARK)); ctx.restore();
    ctx.fillStyle = dark ? '#FFFFFF' : '#0B1324'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + f + 'px ' + FONT; ctx.fillText(text, x + padX + icon + gap, y + h / 2 + f * 0.04);
    ctx.restore();
  }
  function xmp(text) {
    var dst = text === 'AI 편집' ? DST.edit : DST.gen, desc = text === '가상인물' ? 'AI로 만든 가상인물이 포함된 이미지입니다' : text === 'AI 편집' ? 'AI로 편집 · 합성한 이미지입니다' : 'AI로 만든 이미지입니다';
    return '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
      '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"' +
      ' Iptc4xmpExt:DigitalSourceType="' + dst + '" xmp:CreatorTool="AIMarker (aimarker.kr)" photoshop:Credit="AIMarker 표시"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">' + desc + ' · ' + text + ' 표시</rdf:li></rdf:Alt></dc:description>' +
      '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
  }
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function concat(parts) { var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length; var o = new Uint8Array(n), p = 0; for (i = 0; i < parts.length; i++) { o.set(parts[i], p); p += parts[i].length; } return o; }
  var enc = new TextEncoder();
  function withXmpJpeg(u8, x) {
    var hdr = enc.encode('http://ns.adobe.com/xap/1.0/\u0000'), body = enc.encode(x), len = 2 + hdr.length + body.length; if (len > 65535) return u8;
    var seg = concat([new Uint8Array([0xFF, 0xE1, len >> 8, len & 0xFF]), hdr, body]), at = 2;
    if (u8[2] === 0xFF && u8[3] === 0xE0) at = 4 + ((u8[4] << 8) | u8[5]);
    return concat([u8.subarray(0, at), seg, u8.subarray(at)]);
  }
  function withXmpPng(u8, x) {
    var data = concat([enc.encode('XML:com.adobe.xmp'), new Uint8Array([0, 0, 0, 0, 0]), enc.encode(x)]), type = enc.encode('iTXt'), len = data.length, crc = crc32(concat([type, data]));
    var chunk = concat([new Uint8Array([len >>> 24, (len >> 16) & 255, (len >> 8) & 255, len & 255]), type, data, new Uint8Array([crc >>> 24, (crc >> 16) & 255, (crc >> 8) & 255, crc & 255])]);
    return concat([u8.subarray(0, 33), chunk, u8.subarray(33)]);
  }
  P.labelBlob = function (file, img, text, o) {
    o = o || {};
    var png = file.type === 'image/png', w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, 16000 / Math.max(w, h), Math.sqrt(16000000 / (w * h)));
    var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    var ctx = c.getContext('2d');
    return (document.fonts && document.fonts.load ? document.fonts.load('800 32px ' + FONT).catch(function () {}) : Promise.resolve()).then(function () {
      if (!png) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0, c.width, c.height); drawLabel(ctx, c.width, c.height, text, o);
      return new Promise(function (ok) { c.toBlob(ok, png ? 'image/png' : 'image/jpeg', 0.92); });
    }).then(function (b) { return b.arrayBuffer(); }).then(function (ab) {
      var u8 = new Uint8Array(ab), out = png ? withXmpPng(u8, xmp(text)) : withXmpJpeg(u8, xmp(text));
      var base = file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 60) || 'image';
      return { blob: new Blob([out], { type: png ? 'image/png' : 'image/jpeg' }), name: base + '_ai-marker.' + (png ? 'png' : 'jpg') };
    });
  };
  P.save = function (blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); };
})();
