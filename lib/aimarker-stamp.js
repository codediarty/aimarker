/*! AIMarker 지문 마크 넣기(브라우저) 1.0 · https://aimarker.kr/lib/aimarker-stamp.js
 * 이미지에 보이는 지문 마크와 파일 속 출처 기록(IPTC 디지털 출처 유형, XMP)을 넣은 새 파일을 이 브라우저 안에서 만듭니다.
 * 파일을 밖으로 보내지 않습니다. 파일 속 기록을 넣으려면 https://aimarker.kr/lib/aim-extract.js 를 먼저 불러오세요.
 *
 *   const r = await AIMarkerStamp.stamp(file, { kind: 'gen', pos: 'br', size: 'm', theme: 'dark', by: '우리 회사', tool: 'Midjourney' });
 *   // r.blob · r.name · r.width · r.height · r.type
 *   kind: gen(AI 생성) · edit(AI 편집) · assist(AI 보조) · virtual(가상인물)
 *
 * 표시 문구는 한국AI윤리위원회 기준을 따릅니다. 마크는 표시이며 법적 인증이 아닙니다. 서명된 마크(마크 번호 · 확인 페이지)는 AIMarker API(am.mark)로 받습니다. */
(function (root) {
  'use strict';
  var FP = 'M41.64 99.89C32.27 99.14 23.13 94.86 15.91 87.85C13.26 85.28 12.55 84.31 12.3 82.87C12.14 81.99 12.29 80.82 12.65 80.1L12.87 79.63L11.9 79.63C10.44 79.63 9.16 79.11 8.24 78.13C7.53 77.39 5.77 74.09 4.47 71.05C2.27 65.91 0.82 60.14 0.18 54.05C0.01 52.33 0 45.3 0.18 43.64C0.64 39.41 1.27 36.16 2.33 32.67C2.79 31.12 3.73 28.49 4.15 27.54C4.28 27.26 4.55 26.64 4.77 26.15C6.33 22.64 8.29 19.43 11.09 15.79C11.82 14.84 13.79 12.69 14.93 11.6C15.75 10.82 16.21 10.47 16.8 10.18C17.58 9.79 17.58 9.79 18.87 9.79C20.17 9.79 20.17 9.79 20.93 10.18C22.19 10.82 22.97 11.66 23.46 12.89C23.68 13.48 23.72 13.75 23.72 14.62C23.72 16.27 23.22 17.32 21.76 18.67C17.61 22.53 13.82 28.85 11.87 35.18C11.01 37.97 10.36 41.07 10.03 44.05C9.85 45.72 9.85 52.06 10.03 53.59C10.87 60.52 12.54 65.85 15.69 71.59C16.1 72.33 16.49 73.18 16.57 73.47C16.85 74.51 16.7 76.23 16.27 76.83C16.17 76.96 16.1 77.1 16.1 77.13C16.1 77.16 16.55 77.18 17.1 77.18C18.94 77.18 19.71 77.61 21.81 79.78C25.54 83.67 29.84 86.53 34.59 88.31C37.13 89.25 39.54 89.76 43.18 90.14C43.98 90.24 44.41 90.34 44.89 90.55C45.64 90.91 46.64 91.63 46.72 91.9C46.75 91.99 46.86 92.15 46.96 92.25C47.15 92.41 47.17 92.39 47.47 91.87C47.83 91.23 48.81 90.3 49.47 89.97C49.71 89.85 50.48 89.6 51.17 89.44C57.11 87.97 62 85.13 66.41 80.61C70.06 76.86 72.45 73.04 74.88 67.09C75.98 64.39 79.12 63.16 81.63 64.43C83.56 65.42 84.69 67.59 84.32 69.61C84.14 70.56 83.15 73.01 81.95 75.44C78.33 82.77 73.13 88.84 66.77 93.15C62.94 95.75 58.66 97.68 54.19 98.83C51.9 99.42 50.76 99.39 49.47 98.75C48.94 98.48 47.94 97.61 47.68 97.2C47.51 96.89 47.51 96.89 47.29 97.29C46.74 98.34 46.11 98.93 45.07 99.43C44.05 99.91 43.25 100.01 41.64 99.89ZM44.05 68.98C41.65 68.58 39.64 67.78 37.68 66.48C34.04 64.04 31.45 60.08 30.54 55.57C30.24 54.02 30.21 50.9 30.49 49.49C31.37 45.16 33.82 41.74 37.18 40.14C38.5 39.52 39.5 39.27 41.04 39.21C42.51 39.15 43.54 39.3 44.82 39.81C47.34 40.78 49.29 42.84 50.13 45.44C50.95 47.95 50.39 50.1 48.54 51.5C46.85 52.78 44.36 52.81 42.75 51.56C42.07 51.04 41.67 50.57 41.29 49.93C41.13 49.65 40.98 49.44 40.96 49.44C40.93 49.44 40.78 49.72 40.62 50.08C39.87 51.67 39.94 53.57 40.82 55.44C42.44 58.9 46.01 60.24 49.22 58.56C51.68 57.28 53.51 54.64 54.33 51.18C54.65 49.84 54.76 47.17 54.57 45.71C53.98 41.23 51.68 37.17 48.31 34.68C47.19 33.85 45.24 32.89 44 32.57C38.39 31.11 32.64 33.69 28.94 39.33C27.44 41.64 26.3 44.65 25.73 47.85C25.46 49.41 25.35 52.96 25.53 54.69C25.73 56.65 26.22 58.78 26.92 60.87C27.28 61.95 27.61 63.08 27.65 63.39C27.85 65.08 26.93 66.99 25.49 67.95C22.93 69.65 19.64 68.68 18.28 65.85C17.39 64 16.37 60.25 15.9 57.08C15.61 55.23 15.5 50.79 15.69 48.84C16.44 40.94 19.55 34.11 24.65 29.14C25.88 27.94 26.72 27.26 28.41 26.14C31.09 24.35 33.86 23.22 36.92 22.67C45.84 21.07 54.68 24.96 60.03 32.88C62.37 36.35 63.94 40.72 64.41 45.1C64.59 46.77 64.49 50.28 64.22 51.85C63.76 54.43 63.18 56.3 62.16 58.41C59.52 63.9 55.02 67.64 49.62 68.83C48.38 69.11 45.28 69.19 44.05 68.98ZM81.26 63.99C79.04 63.62 77.45 61.99 77.14 59.75C77.08 59.3 77.1 58.73 77.23 57.69C77.59 54.95 77.67 53.32 77.61 50.16C77.55 47.24 77.44 45.78 77.07 43.59C75.57 34.52 71.57 26.3 65.68 20.18C64.01 18.44 61.12 16.01 59.74 15.18C59.52 15.05 58.96 14.7 58.51 14.41C57.04 13.46 54.82 12.39 52.8 11.65C49.14 10.33 45.63 9.75 41.85 9.88C39.57 9.95 37.75 10.21 35.54 10.78C33.13 11.39 32.11 11.34 30.69 10.54C28.98 9.59 27.98 7.49 28.31 5.57C28.43 4.8 28.87 3.74 29.16 3.5C29.26 3.43 29.33 3.3 29.33 3.23C29.33 3.04 30.4 2.19 31.01 1.91C32.03 1.43 34.74 0.77 37.17 0.41C41.49-0.23 46.09-0.09 50.41 0.77C55.92 1.89 61.25 4.21 66.09 7.6C68.28 9.14 69.78 10.41 71.93 12.51C78.66 19.11 83.73 28.31 85.99 38C87.15 43.02 87.55 46.89 87.46 52.29C87.38 56.39 87.06 59.55 86.55 60.92C86.13 62.09 84.98 63.26 83.84 63.69C83.34 63.88 82.15 64.12 81.9 64.09C81.85 64.08 81.56 64.04 81.26 63.99Z';
  var LABEL = { gen: 'AI 생성', edit: 'AI 편집', assist: 'AI 보조', virtual: '가상인물' };
  var DST = { gen: 'trainedAlgorithmicMedia', edit: 'compositeWithTrainedAlgorithmicMedia', assist: 'algorithmicallyEnhanced', virtual: 'trainedAlgorithmicMedia' };
  var DESC = { gen: '생성형 AI로 만든 이미지입니다', edit: '생성형 AI로 편집하거나 합성한 이미지입니다', assist: '생성형 AI의 도움을 받아 만든 이미지입니다', virtual: 'AI로 만든 가상인물이 나오는 이미지입니다' };
  var FONT = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  var MAXPX = 8192;

  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function chip(ctx, x, y, s, bg) {
    ctx.save();
    rr(ctx, x, y, s, s, s * 0.27); ctx.fillStyle = bg || '#FFFFFF'; ctx.fill();
    var fh = s * 0.66, fw = fh * 0.8749;
    ctx.translate(x + (s - fw) / 2, y + (s - fh) / 2); ctx.scale(fw / 87.49, fh / 100);
    var g = ctx.createLinearGradient(0, 100, 87.49, 0);
    g.addColorStop(0, '#0030C4'); g.addColorStop(0.45, '#0858F0'); g.addColorStop(0.8, '#0E8BFB'); g.addColorStop(1, '#33C8FF');
    ctx.fillStyle = g; ctx.fill(new Path2D(FP)); ctx.restore();
  }
  /* 캔버스(W×H)에 지문 마크를 그림. 돌려줌: 그린 상자 { x, y, w, h } */
  function draw(ctx, W, H, o) {
    o = o || {};
    var kind = LABEL[o.kind] ? o.kind : 'gen', label = o.text || LABEL[kind];
    var k = o.size === 's' ? 0.042 : o.size === 'l' ? 0.078 : 0.056;
    var h = Math.round(Math.max(24, Math.min(180, Math.min(W, H) * k)));
    var m = Math.round(h * 0.42), cs = h * 0.74, pad = h * 0.13, gap = h * 0.24, end = h * 0.36;
    ctx.save();
    ctx.font = '800 ' + Math.round(h * 0.42) + 'px ' + FONT; var tw = ctx.measureText(label).width;
    ctx.font = '750 ' + Math.round(h * 0.29) + 'px ' + FONT; var aw = ctx.measureText('AI').width, bw = aw + ctx.measureText('Marker').width;
    var w = pad + cs + gap + tw + gap * 1.15 + bw + end;
    if (o.brand === false || w > W - m * 2) { bw = 0; w = pad + cs + gap + tw + end; }
    if (w > W - m * 2) { w = pad + cs + pad; tw = 0; }
    var pos = /^(tl|tr|bl|br)$/.test(o.pos) ? o.pos : 'br';
    var x = pos.charAt(1) === 'r' ? W - m - w : m, y = pos.charAt(0) === 'b' ? H - m - h : m;
    var dark = o.theme !== 'light';
    ctx.shadowColor = 'rgba(0,0,0,.30)'; ctx.shadowBlur = h * 0.38; ctx.shadowOffsetY = h * 0.06;
    rr(ctx, x, y, w, h, h * 0.3); ctx.fillStyle = dark ? 'rgba(8,20,47,.84)' : 'rgba(255,255,255,.94)'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(1, h * 0.03); ctx.strokeStyle = dark ? 'rgba(255,255,255,.22)' : 'rgba(14,31,71,.16)'; ctx.stroke();
    chip(ctx, x + pad, y + (h - cs) / 2, cs, dark ? '#FFFFFF' : '#EEF4FF');
    if (tw) {
      ctx.textBaseline = 'middle'; ctx.fillStyle = dark ? '#FFFFFF' : '#0E1F47';
      ctx.font = '800 ' + Math.round(h * 0.42) + 'px ' + FONT; ctx.fillText(label, x + pad + cs + gap, y + h / 2 + h * 0.02);
      if (bw) {
        var bx = x + pad + cs + gap + tw + gap * 1.15, by = y + h / 2 + h * 0.03;
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
                u = X.embedXmp(u, X.buildXmp({ dst: DST[kind], aiSystem: o.tool || '', title: o.title || '', desc: DESC[kind] + ' (AIMarker 지문 마크)', credit: (o.by ? o.by + ' · ' : '') + 'AIMarker', label: { gen: 'ai_generated', edit: 'ai_edited', assist: 'ai_assisted', virtual: 'ai_generated' }[kind], basis: 'declared', url: 'https://aimarker.kr/v/' }));
              } catch (e) { /* 기록을 못 넣어도 보이는 마크는 그대로 */ }
            }
            return { blob: new Blob([u], { type: mime }), name: outName(file.name, mime), width: W, height: H, type: mime };
          });
        });
      });
    });
  }
  root.AIMarkerStamp = { version: '1.0.0', stamp: stamp, draw: draw, chip: chip, LABEL: LABEL };
})(typeof window !== 'undefined' ? window : this);
