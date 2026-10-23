/*! AIMarker AI 마크 넣기(브라우저) 1.1 · https://aimarker.kr/lib/aimarker-stamp.js
 * 이미지에 보이는 AI 마크와 파일 속 출처 기록(IPTC 디지털 출처 유형, XMP)을 넣은 새 파일을 이 브라우저 안에서 만듭니다.
 * 파일을 밖으로 보내지 않습니다. 파일 속 기록을 넣으려면 https://aimarker.kr/lib/aim-extract.js 를 먼저 불러오세요.
 *
 *   const r = await AIMarkerStamp.stamp(file, { kind: 'gen', pos: 'br', size: 'm', theme: 'dark', by: '우리 회사', tool: 'Midjourney' });
 *   // r.blob · r.name · r.width · r.height · r.type
 *   kind: gen(AI 생성) · edit(AI 편집) · assist(AI 보조) · virtual(가상인물)
 *
 * 표시 문구는 한국AI윤리위원회 기준을 따릅니다. 마크는 표시이며 법적 인증이 아닙니다. 서명된 마크(마크 번호 · 확인 페이지)는 AIMarker API(am.mark)로 받습니다. */
(function (root) {
  'use strict';
  var FP = '@@FP@@';   // 13.1 로고와 같은 지문(전체 심볼, viewBox 0 0 84.97 100)
  var LABEL = { gen: 'AI 생성', edit: 'AI 편집', assist: 'AI 보조', virtual: '가상인물' };
  var KW = { gen: '생성', edit: '편집', assist: '보조', virtual: '가상인물' };   // 13.1 마크 글자 'AI 마킹 | 종류'
  var DST = { gen: 'trainedAlgorithmicMedia', edit: 'compositeWithTrainedAlgorithmicMedia', assist: 'algorithmicallyEnhanced', virtual: 'trainedAlgorithmicMedia' };
  var DESC = { gen: '생성형 AI로 만든 이미지입니다', edit: '생성형 AI로 편집하거나 합성한 이미지입니다', assist: '생성형 AI의 도움을 받아 만든 이미지입니다', virtual: 'AI로 만든 가상인물이 나오는 이미지입니다' };
  var FONT = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  var MAXPX = 8192;

  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function chip(ctx, x, y, s, bg, ring) {   // 13.0 AI 마크: 흰 원 안의 지문(사이트에 붙는 마크와 같은 모양), 13.1 로고 지문
    ctx.save();
    rr(ctx, x, y, s, s, s / 2); ctx.fillStyle = bg || '#FFFFFF'; ctx.fill();
    if (ring) { ctx.lineWidth = Math.max(1, s * 0.08); ctx.strokeStyle = ring; rr(ctx, x - s * 0.04, y - s * 0.04, s * 1.08, s * 1.08, s * 0.54); ctx.stroke(); }
    var fh = s * 0.7, fw = fh * 0.8497;
    ctx.translate(x + (s - fw) / 2, y + (s - fh) / 2); ctx.scale(fw / 84.97, fh / 100);
    var g = ctx.createLinearGradient(0, 100, 84.97, 0);
    g.addColorStop(0, '#0030C4'); g.addColorStop(0.45, '#0858F0'); g.addColorStop(0.8, '#0E8BFB'); g.addColorStop(1, '#33C8FF');
    ctx.fillStyle = g; ctx.fill(new Path2D(FP)); ctx.restore();
  }
  /* 캔버스(W×H)에 AI 마크를 그림. 돌려줌: 그린 상자 { x, y, w, h } */
  function draw(ctx, W, H, o) {
    o = o || {};
    var kind = LABEL[o.kind] ? o.kind : 'gen', main = o.text || 'AI 마킹', sub = o.text ? '' : KW[kind];
    var k = o.size === 's' ? 0.042 : o.size === 'l' ? 0.078 : 0.056;
    var h = Math.round(Math.max(24, Math.min(180, Math.min(W, H) * k)));
    var m = Math.round(h * 0.42), cs = h * 0.76, pad = h * 0.12, gap = h * 0.24, end = h * 0.46, dv = h * 0.22;
    ctx.save();
    ctx.font = '800 ' + Math.round(h * 0.42) + 'px ' + FONT; var mw = ctx.measureText(main).width;
    ctx.font = '600 ' + Math.round(h * 0.4) + 'px ' + FONT; var sw = sub ? ctx.measureText(sub).width : 0;
    ctx.font = '750 ' + Math.round(h * 0.29) + 'px ' + FONT; var aw = ctx.measureText('AI').width, bw = aw + ctx.measureText('Marker').width;
    function width() { return pad + cs + gap + mw + (sw ? dv * 2 + sw : 0) + (bw ? gap * 1.15 + bw : 0) + end; }
    var w = width();
    if (o.brand === false || w > W - m * 2) { bw = 0; w = width(); }
    if (w > W - m * 2) { sw = 0; w = width(); }
    if (w > W - m * 2) { mw = 0; sw = 0; w = pad + cs + pad; }
    var pos = /^(tl|tr|bl|br)$/.test(o.pos) ? o.pos : 'br';
    var x = pos.charAt(1) === 'r' ? W - m - w : m, y = pos.charAt(0) === 'b' ? H - m - h : m;
    var dark = o.theme !== 'light';
    ctx.shadowColor = 'rgba(0,0,0,.30)'; ctx.shadowBlur = h * 0.38; ctx.shadowOffsetY = h * 0.06;
    var bgG = ctx.createLinearGradient(0, y, 0, y + h);
    if (dark) { bgG.addColorStop(0, 'rgba(26,48,104,.9)'); bgG.addColorStop(1, 'rgba(8,20,47,.92)'); } else { bgG.addColorStop(0, 'rgba(255,255,255,.96)'); bgG.addColorStop(1, 'rgba(242,246,252,.94)'); }
    rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = bgG; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, h * 0.03); ctx.strokeStyle = dark ? 'rgba(255,255,255,.22)' : 'rgba(14,31,71,.16)'; ctx.stroke();
    chip(ctx, x + pad, y + (h - cs) / 2, cs, dark ? '#FFFFFF' : '#EEF4FF', dark ? 'rgba(125,184,255,.35)' : 'rgba(11,99,246,.16)');
    if (mw) {
      var tx = x + pad + cs + gap;
      ctx.textBaseline = 'middle'; ctx.fillStyle = dark ? '#FFFFFF' : '#0E1F47';
      ctx.font = '800 ' + Math.round(h * 0.42) + 'px ' + FONT; ctx.fillText(main, tx, y + h / 2 + h * 0.02);
      tx += mw;
      if (sw) {
        ctx.fillStyle = dark ? 'rgba(255,255,255,.32)' : 'rgba(14,31,71,.22)';
        ctx.fillRect(tx + dv - Math.max(1, h * 0.03) / 2, y + h * 0.3, Math.max(1, h * 0.03), h * 0.4);
        ctx.fillStyle = dark ? 'rgba(255,255,255,.84)' : 'rgba(14,31,71,.8)';
        ctx.font = '600 ' + Math.round(h * 0.4) + 'px ' + FONT; ctx.fillText(sub, tx + dv * 2, y + h / 2 + h * 0.02);
        tx += dv * 2 + sw;
      }
      if (bw) {
        var bx = tx + gap * 1.15, by = y + h / 2 + h * 0.03;
        ctx.font = '750 ' + Math.round(h * 0.29) + 'px ' + FONT;
        ctx.fillStyle = dark ? '#7DB8FF' : '#0B63F6'; ctx.fillText('AI', bx, by);
        ctx.fillStyle = dark ? 'rgba(255,255,255,.86)' : '#0E1F47'; ctx.fillText('Marker', bx + aw, by);
      }
    }
    ctx.restore();
    return { x: x, y: y, w: w, h: h };
  }
  function sniff(u8) {
    if (u8[0] === 0xFF && u8[1] === 0xD8) return 'jpeg';
    if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) return 'png';
    if (u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46 && u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50) return 'webp';
    if (u8[4] === 0x66 && u8[5] === 0x74 && u8[6] === 0x79 && u8[7] === 0x70) return 'heic';
    if (u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46) return 'gif';
    return '';
  }
  function decode(file) {
    if (root.createImageBitmap) return root.createImageBitmap(file).catch(function () { return viaImg(file); });
    return viaImg(file);
  }
  function viaImg(file) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { res(im); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); };
      im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('DECODE')); };
      im.src = u;
    });
  }
  function outName(name, mime) {
    var base = String(name || 'image').replace(/\.[a-z0-9]{2,5}$/i, '');
    return base + '_AIMarker.' + (mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png');
  }
  function stamp(file, o) {
    o = o || {};
    var kind = LABEL[o.kind] ? o.kind : 'gen';
    return file.arrayBuffer().then(function (ab) {
      var fmt = sniff(new Uint8Array(ab, 0, Math.min(16, ab.byteLength)));
      if (!fmt) throw new Error('NOT_IMAGE');
      return decode(file).then(function (bmp) {
        var W = bmp.width, H = bmp.height, sc = Math.min(1, MAXPX / Math.max(W, H));
        W = Math.round(W * sc); H = Math.round(H * sc);
        var c = document.createElement('canvas'); c.width = W; c.height = H;
        var ctx = c.getContext('2d');
        ctx.drawImage(bmp, 0, 0, W, H);
        if (bmp.close) try { bmp.close(); } catch (e) { /* 무시 */ }
        draw(ctx, W, H, o);
        var mime = fmt === 'jpeg' || fmt === 'heic' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png';
        return new Promise(function (res) { c.toBlob(res, mime, 0.92); }).then(function (blob) {
          if (!blob) throw new Error('ENCODE');
          if (blob.type !== mime) mime = blob.type;
          return blob.arrayBuffer().then(function (out) {
            var u = new Uint8Array(out), X = root.AIMExtract;
            if (o.meta !== false && X && X.buildXmp && X.embedXmp) {
              try {
                u = X.embedXmp(u, X.buildXmp({ dst: DST[kind], aiSystem: o.tool || '', title: o.title || '', desc: DESC[kind] + ' (AIMarker AI 마크)', credit: (o.by ? o.by + ' · ' : '') + 'AIMarker', label: { gen: 'ai_generated', edit: 'ai_edited', assist: 'ai_assisted', virtual: 'ai_generated' }[kind], basis: 'declared', url: 'https://aimarker.kr/v/' }));
              } catch (e) { /* 기록을 못 넣어도 보이는 마크는 그대로 */ }
            }
            return { blob: new Blob([u], { type: mime }), name: outName(file.name, mime), width: W, height: H, type: mime };
          });
        });
      });
    });
  }
  root.AIMarkerStamp = { version: '1.1.0', stamp: stamp, draw: draw, chip: chip, LABEL: LABEL };
})(typeof window !== 'undefined' ? window : this);
