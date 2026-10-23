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
  /* 지문 심볼(13.1 부터 로고와 같은 전체 심볼, viewBox 0 0 84.97 100) */
  var FP = 'M37.71 99.99C37.6 99.96 36.62 99.9 36.01 99.87C34.52 99.82 33.88 99.76 32.93 99.61C27.82 98.77 22.85 96.67 18.84 93.67C17.85 92.93 17.13 92.34 16.28 91.55C14.69 90.08 13.47 88.65 11.87 86.35C10.77 84.77 10.41 84.27 10.19 83.97C9.63 83.21 9.46 82.82 9.41 82.15C9.34 81.28 9.59 80.54 10.2 79.84C10.44 79.56 10.97 79.21 11.4 79.05C12.14 78.77 13.11 78.84 13.82 79.24C14.48 79.6 14.68 79.84 16.19 81.98C16.29 82.11 16.5 82.42 16.68 82.67C18 84.55 18.69 85.39 19.83 86.52C23.58 90.23 28.62 92.73 34.11 93.61C34.67 93.7 35 93.73 36.24 93.78C38.35 93.87 38.85 93.96 39.5 94.36C41.11 95.35 41.43 97.56 40.18 98.97C39.67 99.53 38.99 99.88 38.23 99.97C38.01 100 37.79 100 37.71 99.99ZM46.12 99.88C44.53 99.74 43.33 98.44 43.33 96.84C43.33 95.68 43.96 94.65 44.99 94.13C45.37 93.93 45.73 93.84 46.33 93.79C47.29 93.7 49.34 93.17 51.19 92.53C57.04 90.5 61.64 87.03 65.33 81.86C67.28 79.13 69.05 75.83 70.64 71.96C71.06 70.94 71.17 70.75 71.57 70.36C71.85 70.09 72.04 69.95 72.36 69.8C73.17 69.42 74.09 69.42 74.89 69.79C75.98 70.31 76.63 71.41 76.58 72.62C76.56 73.03 76.48 73.31 76.19 74.04C75.47 75.83 74.78 77.35 73.95 79.02C73.47 79.97 73.31 80.29 72.89 81.04C70.4 85.57 67.36 89.37 63.98 92.19C63.84 92.31 63.69 92.43 63.66 92.46C63.42 92.66 62.76 93.17 62.41 93.43C60.76 94.65 59.14 95.64 57.27 96.56C56.75 96.82 56.61 96.89 56.11 97.12C55.4 97.44 54.2 97.92 53.43 98.19C50.54 99.2 47.99 99.83 46.54 99.88C46.37 99.89 46.19 99.89 46.12 99.88ZM39.37 91.76C33.47 91.49 28.24 89.59 23.62 86.04C22.04 84.82 20.33 83.19 18.95 81.58C16.12 78.25 13.78 74.23 12.01 69.62C10.93 66.82 9.79 62.82 9.38 60.41C9.22 59.52 9.19 59.2 9.19 58.62C9.19 58.1 9.19 58.06 9.26 57.82C9.41 57.28 9.66 56.84 10.04 56.47C10.41 56.11 10.82 55.88 11.35 55.73C11.57 55.67 11.63 55.66 12.04 55.66C12.52 55.66 12.67 55.69 13.05 55.83C13.62 56.03 14.12 56.44 14.46 56.96C14.75 57.4 14.88 57.8 14.94 58.48C15.03 59.45 15.29 60.66 15.78 62.46C16.34 64.52 16.9 66.22 17.58 67.93C18.9 71.27 20.72 74.46 22.69 76.9C22.86 77.11 23.03 77.31 23.06 77.35C23.09 77.4 23.31 77.65 23.54 77.91C27.56 82.51 32.58 85.19 38.22 85.76C39.19 85.85 39.58 85.87 40.69 85.87C43.41 85.87 45.87 85.5 48.04 84.76C52.14 83.36 55.87 80.66 58.43 77.24C58.87 76.64 59.12 76.27 59.52 75.65C60.2 74.55 60.94 73.09 61.44 71.82C62.86 68.24 63.62 64.31 63.81 59.5C63.84 58.7 63.84 56.27 63.81 55.37C63.66 51.06 63.12 47.05 62.22 43.38C60.6 36.83 58.18 31.98 54.78 28.49C52.17 25.81 48.78 24.15 45.19 23.8C42.14 23.49 39.27 23.96 36.5 25.22C32.49 27.03 28.89 30.52 26.27 35.11C24.16 38.84 22.8 43.2 22.34 47.76C22.2 49.13 22.19 49.47 22.19 51.23C22.19 52.91 22.2 53.18 22.3 54.38C22.82 60.27 24.88 65.97 27.97 70.07C29.19 71.68 30.66 73.17 32.05 74.21C34.27 75.88 36.83 76.94 39.41 77.25C40.43 77.38 41.68 77.4 42.61 77.3C47.32 76.8 51.28 74.14 53.71 69.86C55.66 66.41 56.41 62.08 55.88 57.31C55.38 52.89 53.68 48.52 51.22 45.38C50.61 44.59 49.58 43.51 49.02 43.07C47.85 42.14 46.57 41.58 45.21 41.39C44.84 41.34 44.04 41.34 43.72 41.38C41.71 41.67 40.25 42.88 39.36 44.98C38.39 47.26 38.23 50.28 38.91 53.47C39.05 54.1 39.35 55.2 39.51 55.64C39.81 56.46 39.89 56.69 40.07 57.09C40.68 58.49 41.43 59.43 41.94 59.43L42.05 59.43L42.04 59.05C42.02 58.58 41.95 58.23 41.67 57.09C41.56 56.61 41.45 56.13 41.43 56.02C41.35 55.43 41.52 54.72 41.88 54.22C42.01 54.04 42.39 53.66 42.55 53.56C43.64 52.85 45.03 53.02 45.89 53.98C46.28 54.42 46.34 54.57 46.66 55.78C46.99 56.99 47.09 57.46 47.19 58.15C47.27 58.69 47.28 59.81 47.21 60.26C47.04 61.33 46.66 62.24 46.1 62.95C45.71 63.44 45.17 63.86 44.55 64.15C43.38 64.71 41.89 64.86 40.58 64.55C38.78 64.11 37.24 62.84 36.06 60.78C34.8 58.59 33.72 54.98 33.42 51.91C33.32 50.97 33.31 50.78 33.31 49.57C33.31 48.31 33.32 48.05 33.43 47.17C33.74 44.55 34.6 42.18 35.91 40.36C36.56 39.46 37.46 38.55 38.33 37.92C42.22 35.13 47.63 35.38 51.95 38.55C53.89 39.98 55.97 42.45 57.52 45.17C60.75 50.85 62.13 57.91 61.26 64.34C60.71 68.41 59.29 72 56.99 75.08C53.5 79.76 48.34 82.6 42.57 83.02C42.01 83.07 40.36 83.07 39.81 83.03C36.26 82.76 32.93 81.63 29.9 79.66C27.54 78.12 25.29 75.95 23.36 73.34C20.3 69.2 18.11 63.81 17.15 58.04C16.76 55.74 16.59 53.65 16.59 51.25C16.59 49.12 16.71 47.39 17.01 45.35C18.13 37.57 21.48 30.53 26.47 25.45C31.3 20.53 37.14 17.94 43.41 17.94C47.19 17.94 50.58 18.8 53.76 20.55C56.4 22.01 58.77 24.07 60.82 26.74C63.83 30.62 66.04 35.5 67.57 41.65C68.51 45.42 69.07 49.21 69.35 53.71C69.49 55.96 69.5 59.06 69.37 61.23C68.95 68.57 67.13 74.67 63.89 79.56C61.28 83.51 57.65 86.71 53.34 88.9C49.99 90.59 46.67 91.46 42.55 91.73C41.81 91.77 40.05 91.79 39.37 91.76ZM7.61 77.15C7.21 77.09 6.75 76.92 6.42 76.71C6.23 76.59 5.89 76.28 5.73 76.09C5.29 75.55 4.5 74.03 3.83 72.43C2.24 68.63 0.92 63.17 0.34 57.93C-0.06 54.29-0.11 50.33 0.19 46.63C0.77 39.55 2.62 32.71 5.6 26.55C5.76 26.2 5.94 25.84 5.99 25.75C6.04 25.66 6.18 25.38 6.31 25.13C8.05 21.75 10.35 18.33 12.76 15.52C14.43 13.57 16.34 11.66 18.19 10.08C19.2 9.22 19.5 8.99 19.82 8.81C20.78 8.29 21.99 8.33 22.88 8.9C24.47 9.91 24.8 12.04 23.6 13.46C23.45 13.65 23.19 13.88 22.79 14.19C22.59 14.36 21.85 14.98 21.69 15.12C21.64 15.16 21.48 15.31 21.32 15.45C21.17 15.58 20.91 15.82 20.74 15.97C20.42 16.26 18.85 17.83 18.54 18.17C12.09 25.09 7.88 34.16 6.46 44.18C5.93 47.95 5.82 52.01 6.13 55.83C6.66 62.19 8.41 68.85 10.49 72.41C10.83 73.01 10.94 73.3 11.01 73.79C11.23 75.32 10.19 76.8 8.68 77.12C8.35 77.18 7.91 77.2 7.61 77.15ZM41.27 73.82C39.46 73.7 37.7 73.23 36.19 72.46C33.09 70.88 30.46 67.99 28.37 63.88C25.82 58.85 24.67 52.77 25.17 46.94C25.54 42.58 26.85 38.61 29.02 35.31C29.3 34.9 29.36 34.8 29.76 34.28C31.31 32.21 33.3 30.44 35.46 29.19C37.63 27.94 39.92 27.21 42.44 26.97C42.99 26.92 44.4 26.91 44.97 26.96C47.82 27.19 50.46 28.08 52.71 29.56C54.33 30.63 55.73 31.99 56.83 33.56C57.25 34.16 57.43 34.68 57.43 35.29C57.43 35.89 57.29 36.36 56.97 36.84C56.73 37.2 56.54 37.38 56.16 37.64C55.4 38.14 54.33 38.21 53.51 37.81C53.01 37.57 52.68 37.28 52.31 36.76C51.64 35.82 50.82 35 49.91 34.37C48.52 33.4 46.84 32.78 44.98 32.55C44.55 32.49 43.09 32.48 42.66 32.53C39.68 32.88 36.98 34.35 34.79 36.81C31.38 40.64 29.86 46.55 30.64 52.97C31.06 56.43 32.2 59.83 33.88 62.64C34.64 63.93 35.36 64.86 36.27 65.78C37.99 67.48 39.56 68.21 41.79 68.35C42.87 68.41 43.95 68.22 44.76 67.81C46.58 66.9 47.83 64.79 48.25 61.92C48.44 60.61 48.44 59.11 48.24 57.7C48.04 56.33 47.71 55.16 47.13 53.8C46.44 52.19 45.83 51.12 45.34 50.65C44.75 50.09 44.54 49.79 44.39 49.25C43.98 47.83 44.87 46.34 46.33 46.02C46.6 45.96 47.06 45.95 47.31 45.99C48.02 46.12 48.65 46.55 49.37 47.36C50.29 48.41 51.18 50 52.14 52.27C53.43 55.33 53.95 58.84 53.61 62.16C53.3 65.16 52.3 67.84 50.74 69.81C50.49 70.12 50.44 70.17 50.06 70.59C49.65 71.04 48.86 71.71 48.29 72.09C46.32 73.4 43.92 73.99 41.27 73.82ZM80.75 67.89C80.05 67.81 79.47 67.53 78.96 67.02C78.63 66.69 78.41 66.34 78.26 65.9C78.13 65.51 78.1 65.31 78.1 64.86C78.1 64.26 78.17 63.76 78.45 62.46C78.78 60.85 79.02 57.85 78.98 55.63C78.92 51.83 78.42 46.96 77.66 42.84C76.43 36.21 74.56 30.39 71.98 25.22C69.31 19.87 66.11 15.69 62.23 12.48C59.5 10.23 56.31 8.49 52.98 7.44C50.76 6.74 48.98 6.42 46.12 6.23C45.5 6.19 43.05 6.19 42.42 6.23C39.46 6.43 37.44 6.88 35.84 7.69C35.59 7.82 35.3 7.96 35.2 8C34.08 8.4 32.84 8.13 31.99 7.29C31.59 6.9 31.25 6.28 31.13 5.7C31.07 5.44 31.07 4.81 31.12 4.57C31.3 3.74 31.71 3.07 32.34 2.62C32.83 2.27 33.93 1.74 34.9 1.39C36.7 0.75 38.98 0.29 41.33 0.12C42.44 0.03 42.91 0.01 44.25 0.01C47.49 0.01 50.21 0.32 52.83 0.97C57.94 2.25 62.58 4.67 66.65 8.17C68.81 10.03 70.97 12.37 72.72 14.76C72.91 15.03 73.1 15.28 73.14 15.33C73.37 15.64 74.23 16.93 74.73 17.71C79.54 25.37 82.88 35.51 84.29 46.77C84.58 49.15 84.78 51.41 84.9 53.88C85.03 56.69 84.93 59.16 84.58 62.02C84.48 62.78 84.45 62.99 84.27 63.86C84.18 64.33 84.1 64.79 84.08 64.96C84.01 65.86 83.74 66.48 83.2 67.03C82.71 67.52 82.07 67.82 81.37 67.89C81.1 67.92 81.03 67.92 80.75 67.89ZM73.11 66.38C72.63 66.29 72.36 66.2 72.01 65.99C71.34 65.6 70.8 64.87 70.64 64.11C70.58 63.83 70.56 63.27 70.58 62.79C70.6 62.33 70.63 62.1 70.77 61.15C70.93 60.02 71 58.6 71 55.94C71 53.89 70.98 53.45 70.89 52.07C70.72 49.46 70.33 46.56 69.89 44.64C69.54 43.1 69.45 42.55 69.45 41.87C69.45 41.4 69.46 41.35 69.52 41.12C69.6 40.81 69.82 40.37 69.99 40.14C70.39 39.62 70.97 39.23 71.59 39.06C71.81 39 71.88 38.99 72.31 38.99C72.76 38.99 72.81 38.99 73.05 39.06C74.23 39.39 75.05 40.37 75.19 41.6C75.23 42.01 75.31 42.41 75.51 43.3C75.84 44.82 76.03 45.95 76.29 47.95C76.78 51.74 76.91 55.65 76.7 59.98C76.65 60.99 76.64 61.09 76.44 62.47C76.42 62.61 76.39 63 76.38 63.33C76.36 63.97 76.33 64.17 76.2 64.49C75.85 65.41 75.12 66.06 74.18 66.31C73.98 66.36 73.86 66.38 73.56 66.38C73.35 66.39 73.15 66.39 73.11 66.38ZM11.44 48.19C10.24 47.96 9.32 47.04 9.11 45.85C8.93 44.81 9.46 41.73 10.47 38.08C11.32 34.96 12.38 32.2 13.78 29.4C15.91 25.13 18.51 21.47 21.66 18.31C27.31 12.62 34.19 9.32 41.51 8.78C46.65 8.41 51.41 9.3 55.64 11.43C57.26 12.25 58.66 13.13 60.14 14.29C63.51 16.9 66.53 20.4 68.97 24.53C69.78 25.91 70.18 26.71 71.15 28.97C71.82 30.52 72 30.92 72.38 31.69C72.82 32.58 72.91 32.89 72.88 33.54C72.86 33.95 72.78 34.28 72.61 34.63C72.43 34.99 72.31 35.15 72.04 35.43C71.53 35.95 70.87 36.25 70.13 36.28C69.58 36.31 69.2 36.23 68.69 35.98C68.22 35.76 67.77 35.35 67.5 34.9C67.18 34.38 66.54 33.02 65.75 31.21C64.97 29.39 64.62 28.69 63.93 27.55C60.97 22.59 56.99 18.71 52.83 16.7C52.04 16.32 51.47 16.08 50.72 15.82C47.45 14.66 43.59 14.38 39.8 15C36.29 15.59 32.97 16.97 29.79 19.16C27.43 20.79 25.04 23.07 23.05 25.61C20.22 29.2 17.9 33.63 16.5 38.1C15.63 40.88 14.99 43.67 14.84 45.4C14.8 45.85 14.78 45.96 14.7 46.22C14.42 47.13 13.62 47.89 12.68 48.14C12.37 48.22 11.74 48.25 11.44 48.19Z';
  MK.FP = FP;
  MK.fpSvg = function (px, mono) { var id = 'mkfp' + Math.random().toString(36).slice(2, 7); return '<svg viewBox="0 0 84.97 100" width="' + px + '" height="' + Math.round(px * 1.177) + '" aria-hidden="true">' + (mono ? '' : '<defs><linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="84.97" y2="0"><stop offset="0" stop-color="#0030C4"/><stop offset=".45" stop-color="#0858F0"/><stop offset=".8" stop-color="#0E8BFB"/><stop offset="1" stop-color="#33C8FF"/></linearGradient></defs>') + '<path fill="' + (mono ? 'currentColor' : 'url(#' + id + ')') + '" d="' + FP + '"/></svg>'; };
  /* 캔버스에 흰 칩 + 지문(그라데이션). (x, y) 칩 왼쪽 위, s 칩 한 변 */
  MK.fpChip = function (ctx, x, y, s, chip) {
    ctx.save();
    if (chip !== false) { rr(ctx, x, y, s, s, s * 0.27); ctx.fillStyle = chip || '#FFFFFF'; ctx.fill(); }
    var fh = s * 0.66, fw = fh * 0.8497;
    ctx.translate(x + (s - fw) / 2, y + (s - fh) / 2); ctx.scale(fw / 84.97, fh / 100);
    var g = ctx.createLinearGradient(0, 100, 84.97, 0); g.addColorStop(0, '#0030C4'); g.addColorStop(0.45, '#0858F0'); g.addColorStop(0.8, '#0E8BFB'); g.addColorStop(1, '#33C8FF');
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
