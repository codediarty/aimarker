/*! AIMarker AI 마킹 3.2 · https://aimarker.kr/label/
 * 코드 한 줄이면 사이트 속 AI 생성물(이미지 · 영상 · 배경 · 글)에 AIMarker AI 마크가 자동으로 붙습니다.
 *
 *   <script src="https://aimarker.kr/m.js" data-name="회사 이름" async></script>
 *
 * 무엇을 찾나(모두 이 브라우저 안에서, 밖으로 보내는 것 없음 · 쿠키 없음 · 방문 기록 없음)
 *   1) 운영자 표시   <img data-ai="generated|edited|assisted|virtual|none">, 글 묶음 data-ai="text"
 *   2) 운영자 규칙   data-ai-gen=".ai-gallery, .hero img" · data-ai-edit · data-ai-virtual · data-ai-text · data-ai-path="/ai/, /event/*"
 *   3) 파일 속 기록  C2PA 출처 기록 · IPTC 디지털 출처 유형 · XMP 제작 도구 · PNG 생성 정보(같은 주소이거나 CORS 를 허용한 파일)
 *   4) 도구 흔적     파일 이름(DALL·E, ChatGPT Image, Gemini_Generated_Image …) · 대체 글 · 캡션('AI 생성', 'AI로 만든' …)
 *
 * 모양  data-tag="tag(기본)|mini|bar|none" · data-pos="tl|tr|bl|br" · data-tag-theme="dark|light" · data-motion="0"(떠 있는 움직임 끔. 방문자는 근거 창 · 안내 창에서 멈출 수 있고 이 브라우저에 기억)
 * 안내  data-style="badge(기본)|line|inline|none" · data-side · data-theme · data-use · data-level · data-review · data-privacy · data-contact · data-date (2.0 그대로)
 * 기타  data-auto="0"(자동 찾기 끔) · data-meta="0" · data-alt="0" · data-ld="0"(검색용 구조화 정보 끔) · data-min="96" · data-z · data-site(등록 번호) · data-lang="en"
 * 점검  주소 뒤에 ?aimarker=check 를 붙이면 운영자용 점검 모드(무엇을 왜 표시했는지, 못 읽은 파일은 무엇인지)가 열립니다.
 * 직접  AIMarker.tag(el, 'gen'|'edit'|'assist'|'virtual') · AIMarker.untag(el) · AIMarker.scan() · AIMarker.items() · AIMarker.check()
 *
 * 이 표시는 사이트 운영자가 설정한 것입니다. AIMarker 와 한국AI윤리위원회는 각 사이트를 심사 · 보증하지 않으며, 창에도 그렇게 적습니다. */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.AIMarker && W.AIMarker.v3) return;
  var VERSION = '3.2.0', HOME = 'https://aimarker.kr', NOW = Date.now();
  var FP = 'M37.71 99.99C37.6 99.96 36.62 99.9 36.01 99.87C34.52 99.82 33.88 99.76 32.93 99.61C27.82 98.77 22.85 96.67 18.84 93.67C17.85 92.93 17.13 92.34 16.28 91.55C14.69 90.08 13.47 88.65 11.87 86.35C10.77 84.77 10.41 84.27 10.19 83.97C9.63 83.21 9.46 82.82 9.41 82.15C9.34 81.28 9.59 80.54 10.2 79.84C10.44 79.56 10.97 79.21 11.4 79.05C12.14 78.77 13.11 78.84 13.82 79.24C14.48 79.6 14.68 79.84 16.19 81.98C16.29 82.11 16.5 82.42 16.68 82.67C18 84.55 18.69 85.39 19.83 86.52C23.58 90.23 28.62 92.73 34.11 93.61C34.67 93.7 35 93.73 36.24 93.78C38.35 93.87 38.85 93.96 39.5 94.36C41.11 95.35 41.43 97.56 40.18 98.97C39.67 99.53 38.99 99.88 38.23 99.97C38.01 100 37.79 100 37.71 99.99ZM46.12 99.88C44.53 99.74 43.33 98.44 43.33 96.84C43.33 95.68 43.96 94.65 44.99 94.13C45.37 93.93 45.73 93.84 46.33 93.79C47.29 93.7 49.34 93.17 51.19 92.53C57.04 90.5 61.64 87.03 65.33 81.86C67.28 79.13 69.05 75.83 70.64 71.96C71.06 70.94 71.17 70.75 71.57 70.36C71.85 70.09 72.04 69.95 72.36 69.8C73.17 69.42 74.09 69.42 74.89 69.79C75.98 70.31 76.63 71.41 76.58 72.62C76.56 73.03 76.48 73.31 76.19 74.04C75.47 75.83 74.78 77.35 73.95 79.02C73.47 79.97 73.31 80.29 72.89 81.04C70.4 85.57 67.36 89.37 63.98 92.19C63.84 92.31 63.69 92.43 63.66 92.46C63.42 92.66 62.76 93.17 62.41 93.43C60.76 94.65 59.14 95.64 57.27 96.56C56.75 96.82 56.61 96.89 56.11 97.12C55.4 97.44 54.2 97.92 53.43 98.19C50.54 99.2 47.99 99.83 46.54 99.88C46.37 99.89 46.19 99.89 46.12 99.88ZM39.37 91.76C33.47 91.49 28.24 89.59 23.62 86.04C22.04 84.82 20.33 83.19 18.95 81.58C16.12 78.25 13.78 74.23 12.01 69.62C10.93 66.82 9.79 62.82 9.38 60.41C9.22 59.52 9.19 59.2 9.19 58.62C9.19 58.1 9.19 58.06 9.26 57.82C9.41 57.28 9.66 56.84 10.04 56.47C10.41 56.11 10.82 55.88 11.35 55.73C11.57 55.67 11.63 55.66 12.04 55.66C12.52 55.66 12.67 55.69 13.05 55.83C13.62 56.03 14.12 56.44 14.46 56.96C14.75 57.4 14.88 57.8 14.94 58.48C15.03 59.45 15.29 60.66 15.78 62.46C16.34 64.52 16.9 66.22 17.58 67.93C18.9 71.27 20.72 74.46 22.69 76.9C22.86 77.11 23.03 77.31 23.06 77.35C23.09 77.4 23.31 77.65 23.54 77.91C27.56 82.51 32.58 85.19 38.22 85.76C39.19 85.85 39.58 85.87 40.69 85.87C43.41 85.87 45.87 85.5 48.04 84.76C52.14 83.36 55.87 80.66 58.43 77.24C58.87 76.64 59.12 76.27 59.52 75.65C60.2 74.55 60.94 73.09 61.44 71.82C62.86 68.24 63.62 64.31 63.81 59.5C63.84 58.7 63.84 56.27 63.81 55.37C63.66 51.06 63.12 47.05 62.22 43.38C60.6 36.83 58.18 31.98 54.78 28.49C52.17 25.81 48.78 24.15 45.19 23.8C42.14 23.49 39.27 23.96 36.5 25.22C32.49 27.03 28.89 30.52 26.27 35.11C24.16 38.84 22.8 43.2 22.34 47.76C22.2 49.13 22.19 49.47 22.19 51.23C22.19 52.91 22.2 53.18 22.3 54.38C22.82 60.27 24.88 65.97 27.97 70.07C29.19 71.68 30.66 73.17 32.05 74.21C34.27 75.88 36.83 76.94 39.41 77.25C40.43 77.38 41.68 77.4 42.61 77.3C47.32 76.8 51.28 74.14 53.71 69.86C55.66 66.41 56.41 62.08 55.88 57.31C55.38 52.89 53.68 48.52 51.22 45.38C50.61 44.59 49.58 43.51 49.02 43.07C47.85 42.14 46.57 41.58 45.21 41.39C44.84 41.34 44.04 41.34 43.72 41.38C41.71 41.67 40.25 42.88 39.36 44.98C38.39 47.26 38.23 50.28 38.91 53.47C39.05 54.1 39.35 55.2 39.51 55.64C39.81 56.46 39.89 56.69 40.07 57.09C40.68 58.49 41.43 59.43 41.94 59.43L42.05 59.43L42.04 59.05C42.02 58.58 41.95 58.23 41.67 57.09C41.56 56.61 41.45 56.13 41.43 56.02C41.35 55.43 41.52 54.72 41.88 54.22C42.01 54.04 42.39 53.66 42.55 53.56C43.64 52.85 45.03 53.02 45.89 53.98C46.28 54.42 46.34 54.57 46.66 55.78C46.99 56.99 47.09 57.46 47.19 58.15C47.27 58.69 47.28 59.81 47.21 60.26C47.04 61.33 46.66 62.24 46.1 62.95C45.71 63.44 45.17 63.86 44.55 64.15C43.38 64.71 41.89 64.86 40.58 64.55C38.78 64.11 37.24 62.84 36.06 60.78C34.8 58.59 33.72 54.98 33.42 51.91C33.32 50.97 33.31 50.78 33.31 49.57C33.31 48.31 33.32 48.05 33.43 47.17C33.74 44.55 34.6 42.18 35.91 40.36C36.56 39.46 37.46 38.55 38.33 37.92C42.22 35.13 47.63 35.38 51.95 38.55C53.89 39.98 55.97 42.45 57.52 45.17C60.75 50.85 62.13 57.91 61.26 64.34C60.71 68.41 59.29 72 56.99 75.08C53.5 79.76 48.34 82.6 42.57 83.02C42.01 83.07 40.36 83.07 39.81 83.03C36.26 82.76 32.93 81.63 29.9 79.66C27.54 78.12 25.29 75.95 23.36 73.34C20.3 69.2 18.11 63.81 17.15 58.04C16.76 55.74 16.59 53.65 16.59 51.25C16.59 49.12 16.71 47.39 17.01 45.35C18.13 37.57 21.48 30.53 26.47 25.45C31.3 20.53 37.14 17.94 43.41 17.94C47.19 17.94 50.58 18.8 53.76 20.55C56.4 22.01 58.77 24.07 60.82 26.74C63.83 30.62 66.04 35.5 67.57 41.65C68.51 45.42 69.07 49.21 69.35 53.71C69.49 55.96 69.5 59.06 69.37 61.23C68.95 68.57 67.13 74.67 63.89 79.56C61.28 83.51 57.65 86.71 53.34 88.9C49.99 90.59 46.67 91.46 42.55 91.73C41.81 91.77 40.05 91.79 39.37 91.76ZM7.61 77.15C7.21 77.09 6.75 76.92 6.42 76.71C6.23 76.59 5.89 76.28 5.73 76.09C5.29 75.55 4.5 74.03 3.83 72.43C2.24 68.63 0.92 63.17 0.34 57.93C-0.06 54.29-0.11 50.33 0.19 46.63C0.77 39.55 2.62 32.71 5.6 26.55C5.76 26.2 5.94 25.84 5.99 25.75C6.04 25.66 6.18 25.38 6.31 25.13C8.05 21.75 10.35 18.33 12.76 15.52C14.43 13.57 16.34 11.66 18.19 10.08C19.2 9.22 19.5 8.99 19.82 8.81C20.78 8.29 21.99 8.33 22.88 8.9C24.47 9.91 24.8 12.04 23.6 13.46C23.45 13.65 23.19 13.88 22.79 14.19C22.59 14.36 21.85 14.98 21.69 15.12C21.64 15.16 21.48 15.31 21.32 15.45C21.17 15.58 20.91 15.82 20.74 15.97C20.42 16.26 18.85 17.83 18.54 18.17C12.09 25.09 7.88 34.16 6.46 44.18C5.93 47.95 5.82 52.01 6.13 55.83C6.66 62.19 8.41 68.85 10.49 72.41C10.83 73.01 10.94 73.3 11.01 73.79C11.23 75.32 10.19 76.8 8.68 77.12C8.35 77.18 7.91 77.2 7.61 77.15ZM41.27 73.82C39.46 73.7 37.7 73.23 36.19 72.46C33.09 70.88 30.46 67.99 28.37 63.88C25.82 58.85 24.67 52.77 25.17 46.94C25.54 42.58 26.85 38.61 29.02 35.31C29.3 34.9 29.36 34.8 29.76 34.28C31.31 32.21 33.3 30.44 35.46 29.19C37.63 27.94 39.92 27.21 42.44 26.97C42.99 26.92 44.4 26.91 44.97 26.96C47.82 27.19 50.46 28.08 52.71 29.56C54.33 30.63 55.73 31.99 56.83 33.56C57.25 34.16 57.43 34.68 57.43 35.29C57.43 35.89 57.29 36.36 56.97 36.84C56.73 37.2 56.54 37.38 56.16 37.64C55.4 38.14 54.33 38.21 53.51 37.81C53.01 37.57 52.68 37.28 52.31 36.76C51.64 35.82 50.82 35 49.91 34.37C48.52 33.4 46.84 32.78 44.98 32.55C44.55 32.49 43.09 32.48 42.66 32.53C39.68 32.88 36.98 34.35 34.79 36.81C31.38 40.64 29.86 46.55 30.64 52.97C31.06 56.43 32.2 59.83 33.88 62.64C34.64 63.93 35.36 64.86 36.27 65.78C37.99 67.48 39.56 68.21 41.79 68.35C42.87 68.41 43.95 68.22 44.76 67.81C46.58 66.9 47.83 64.79 48.25 61.92C48.44 60.61 48.44 59.11 48.24 57.7C48.04 56.33 47.71 55.16 47.13 53.8C46.44 52.19 45.83 51.12 45.34 50.65C44.75 50.09 44.54 49.79 44.39 49.25C43.98 47.83 44.87 46.34 46.33 46.02C46.6 45.96 47.06 45.95 47.31 45.99C48.02 46.12 48.65 46.55 49.37 47.36C50.29 48.41 51.18 50 52.14 52.27C53.43 55.33 53.95 58.84 53.61 62.16C53.3 65.16 52.3 67.84 50.74 69.81C50.49 70.12 50.44 70.17 50.06 70.59C49.65 71.04 48.86 71.71 48.29 72.09C46.32 73.4 43.92 73.99 41.27 73.82ZM80.75 67.89C80.05 67.81 79.47 67.53 78.96 67.02C78.63 66.69 78.41 66.34 78.26 65.9C78.13 65.51 78.1 65.31 78.1 64.86C78.1 64.26 78.17 63.76 78.45 62.46C78.78 60.85 79.02 57.85 78.98 55.63C78.92 51.83 78.42 46.96 77.66 42.84C76.43 36.21 74.56 30.39 71.98 25.22C69.31 19.87 66.11 15.69 62.23 12.48C59.5 10.23 56.31 8.49 52.98 7.44C50.76 6.74 48.98 6.42 46.12 6.23C45.5 6.19 43.05 6.19 42.42 6.23C39.46 6.43 37.44 6.88 35.84 7.69C35.59 7.82 35.3 7.96 35.2 8C34.08 8.4 32.84 8.13 31.99 7.29C31.59 6.9 31.25 6.28 31.13 5.7C31.07 5.44 31.07 4.81 31.12 4.57C31.3 3.74 31.71 3.07 32.34 2.62C32.83 2.27 33.93 1.74 34.9 1.39C36.7 0.75 38.98 0.29 41.33 0.12C42.44 0.03 42.91 0.01 44.25 0.01C47.49 0.01 50.21 0.32 52.83 0.97C57.94 2.25 62.58 4.67 66.65 8.17C68.81 10.03 70.97 12.37 72.72 14.76C72.91 15.03 73.1 15.28 73.14 15.33C73.37 15.64 74.23 16.93 74.73 17.71C79.54 25.37 82.88 35.51 84.29 46.77C84.58 49.15 84.78 51.41 84.9 53.88C85.03 56.69 84.93 59.16 84.58 62.02C84.48 62.78 84.45 62.99 84.27 63.86C84.18 64.33 84.1 64.79 84.08 64.96C84.01 65.86 83.74 66.48 83.2 67.03C82.71 67.52 82.07 67.82 81.37 67.89C81.1 67.92 81.03 67.92 80.75 67.89ZM73.11 66.38C72.63 66.29 72.36 66.2 72.01 65.99C71.34 65.6 70.8 64.87 70.64 64.11C70.58 63.83 70.56 63.27 70.58 62.79C70.6 62.33 70.63 62.1 70.77 61.15C70.93 60.02 71 58.6 71 55.94C71 53.89 70.98 53.45 70.89 52.07C70.72 49.46 70.33 46.56 69.89 44.64C69.54 43.1 69.45 42.55 69.45 41.87C69.45 41.4 69.46 41.35 69.52 41.12C69.6 40.81 69.82 40.37 69.99 40.14C70.39 39.62 70.97 39.23 71.59 39.06C71.81 39 71.88 38.99 72.31 38.99C72.76 38.99 72.81 38.99 73.05 39.06C74.23 39.39 75.05 40.37 75.19 41.6C75.23 42.01 75.31 42.41 75.51 43.3C75.84 44.82 76.03 45.95 76.29 47.95C76.78 51.74 76.91 55.65 76.7 59.98C76.65 60.99 76.64 61.09 76.44 62.47C76.42 62.61 76.39 63 76.38 63.33C76.36 63.97 76.33 64.17 76.2 64.49C75.85 65.41 75.12 66.06 74.18 66.31C73.98 66.36 73.86 66.38 73.56 66.38C73.35 66.39 73.15 66.39 73.11 66.38ZM11.44 48.19C10.24 47.96 9.32 47.04 9.11 45.85C8.93 44.81 9.46 41.73 10.47 38.08C11.32 34.96 12.38 32.2 13.78 29.4C15.91 25.13 18.51 21.47 21.66 18.31C27.31 12.62 34.19 9.32 41.51 8.78C46.65 8.41 51.41 9.3 55.64 11.43C57.26 12.25 58.66 13.13 60.14 14.29C63.51 16.9 66.53 20.4 68.97 24.53C69.78 25.91 70.18 26.71 71.15 28.97C71.82 30.52 72 30.92 72.38 31.69C72.82 32.58 72.91 32.89 72.88 33.54C72.86 33.95 72.78 34.28 72.61 34.63C72.43 34.99 72.31 35.15 72.04 35.43C71.53 35.95 70.87 36.25 70.13 36.28C69.58 36.31 69.2 36.23 68.69 35.98C68.22 35.76 67.77 35.35 67.5 34.9C67.18 34.38 66.54 33.02 65.75 31.21C64.97 29.39 64.62 28.69 63.93 27.55C60.97 22.59 56.99 18.71 52.83 16.7C52.04 16.32 51.47 16.08 50.72 15.82C47.45 14.66 43.59 14.38 39.8 15C36.29 15.59 32.97 16.97 29.79 19.16C27.43 20.79 25.04 23.07 23.05 25.61C20.22 29.2 17.9 33.63 16.5 38.1C15.63 40.88 14.99 43.67 14.84 45.4C14.8 45.85 14.78 45.96 14.7 46.22C14.42 47.13 13.62 47.89 12.68 48.14C12.37 48.22 11.74 48.25 11.44 48.19Z';   // 13.1 로고와 같은 지문(전체 심볼)
  var FP_VB = '0 0 84.97 100';
  var FONT = '"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
  var uid = 0;
  function fp(cls, mono) {
    uid++;
    var g = 'amfp' + uid;
    return '<svg class="' + (cls || 'fp') + '" viewBox="' + FP_VB + '" aria-hidden="true" focusable="false">' +
      (mono ? '' : '<defs><linearGradient id="' + g + '" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="84.97" y2="0"><stop offset="0" stop-color="#0030C4"/><stop offset=".45" stop-color="#0858F0"/><stop offset=".8" stop-color="#0E8BFB"/><stop offset="1" stop-color="#33C8FF"/></linearGradient></defs>') +
      '<path fill="' + (mono ? 'currentColor' : 'url(#' + g + ')') + '" d="' + FP + '"/></svg>';
  }

  /* ---------- 말 ---------- */
  var LANG = 'ko';
  var T = {
    ko: {
      gen: 'AI 생성', edit: 'AI 편집', assist: 'AI 보조', virtual: '가상인물', text: 'AI 도움 글',
      genL: '생성형 AI로 만든 콘텐츠입니다.', editL: '생성형 AI로 편집하거나 합성한 콘텐츠입니다.', assistL: '생성형 AI의 도움을 받아 만든 콘텐츠입니다.',
      virtualL: 'AI로 만든 가상인물이 나옵니다. 실제 사람이 아닙니다.', textL: '생성형 AI의 도움을 받아 쓴 글입니다.',
      img: '이미지', video: '영상', bg: '이미지', block: '글', frame: '영상',
      basis: '근거', tool: '도구', who: '붙인 곳', when: '확인',
      b_owner: '사이트 운영자가 표시', b_rule: '운영자가 정한 위치 규칙', b_c2pa: '파일 속 출처 기록(C2PA)', b_iptc: '파일 속 출처 기록(IPTC)', b_gen: '파일 속 생성 정보', b_name: '파일 이름, 설명의 AI 도구 흔적',
      g3: '기록', g2: '규칙', g1: '흔적',
      verify: 'AIMarker에서 확인', notice: '이 사이트의 AI 마킹',
      foot: '이 마크는 사이트 운영자가 AIMarker로 설정했습니다. 콘텐츠의 적법성을 보증하지 않습니다.',
      std: '표시 문구 기준 한국AI윤리위원회', nocert: '이 안내와 AI 마크는 심사나 보증이 아닙니다',
      close: '닫기', open: 'AI 마킹 보기', here: '이 페이지의 AI 마킹', go: '위치 보기',
      browser: '이 브라우저에서 확인',
      mk: 'AI 마크', ariaGo: 'AIMarker AI 마킹 근거 보기', cardL: 'AI 마킹 근거', brand: 'AIMarker AI 마킹',
      mark: 'AI 마킹', k_gen: '생성', k_edit: '편집', k_assist: '보조', k_virtual: '가상인물', k_text: '도움 글', noticeT: 'AI 마킹', noticeA: 'AI 마킹 안내',
      mOff: 'AI 마크 움직임 멈추기', mOn: 'AI 마크 움직임 다시 켜기'
    },
    en: {
      gen: 'AI generated', edit: 'AI edited', assist: 'AI assisted', virtual: 'Virtual human', text: 'AI-assisted text',
      genL: 'Created with generative AI.', editL: 'Edited or composited with generative AI.', assistL: 'Made with help from generative AI.',
      virtualL: 'Features an AI-generated virtual person, not a real one.', textL: 'Written with help from generative AI.',
      img: 'image', video: 'video', bg: 'image', block: 'text', frame: 'video',
      basis: 'Basis', tool: 'Tool', who: 'By', when: 'Checked',
      b_owner: 'Labeled by the site owner', b_rule: 'Site owner rule', b_c2pa: 'Content Credentials (C2PA) in file', b_iptc: 'IPTC digital source type in file', b_gen: 'Generator data in file', b_name: 'AI tool traces in file name or caption',
      g3: 'record', g2: 'rule', g1: 'trace',
      verify: 'Check on AIMarker', notice: 'How this site uses AI',
      foot: 'This label was set up by the site owner with AIMarker. It does not certify the content.',
      std: 'Label wording: Korea AI Ethics Committee', nocert: 'This notice and the AI labels are not a certification',
      close: 'Close', open: 'Details', here: 'Labeled on this page', go: 'Show',
      browser: 'checked in this browser',
      mk: 'AI label', ariaGo: 'see AIMarker label details', cardL: 'AI label details', brand: 'AIMarker AI labeling',
      mark: 'AI marked', k_gen: 'generated', k_edit: 'edited', k_assist: 'assisted', k_virtual: 'virtual human', k_text: 'assisted text', noticeT: 'AI marked', noticeA: 'AI use notice',
      mOff: 'Stop label motion', mOn: 'Resume label motion'
    }
  };
  function t(k) { return (T[LANG] && T[LANG][k]) || T.ko[k] || k; }
  var GRADE = { owner: 2, rule: 2, c2pa: 3, iptc: 3, gen: 3, name: 1 };
  var DST = { gen: 'trainedAlgorithmicMedia', edit: 'compositeWithTrainedAlgorithmicMedia', assist: 'algorithmicallyEnhanced', virtual: 'trainedAlgorithmicMedia' };

  /* ---------- 2.0 안내 창(사이트 전체 AI 마킹 안내) ---------- */
  var USE = {
    text: '글 · 상품 설명 · 공지를 쓸 때 AI의 도움을 받습니다',
    image: '일부 이미지를 AI로 만들거나 다듬습니다',
    video: '일부 영상 · 음성을 AI로 만들거나 편집합니다',
    chat: '고객 문의 일부에 AI 챗봇 · 자동 답변을 사용합니다',
    recommend: '상품 · 콘텐츠 추천에 AI를 사용합니다',
    translate: '번역 · 요약에 AI를 사용합니다',
    analysis: '데이터 분석 · 업무 자동화에 AI를 사용합니다',
    virtual: '광고 · 소개에 AI로 만든 가상인물이 나옵니다'
  };
  var REVIEW = { all: 'AI가 만든 결과물은 담당자가 확인한 뒤 게시합니다', important: '중요한 안내와 계약 관련 내용은 담당자가 직접 확인합니다' };
  var LEVELS = [['human', '사람 작성'], ['assist', 'AI 도움'], ['generated', 'AI 생성']];

  function clean(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n || 60); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function josa(w) { var c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? (c % 28 ? '은' : '는') : '는'; }
  function store(k, v) { try { if (v === undefined) return W.localStorage.getItem(k); W.localStorage.setItem(k, v); } catch (e) { /* 저장소를 못 쓰면 그냥 넘어감 */ } return null; }
  function abs(u) { try { return new URL(u, location.href).href; } catch (e) { return ''; } }
  function fileOf(u) { var n = String(u || '').split('#')[0].split('?')[0].split('/').pop() || ''; try { n = decodeURIComponent(n); } catch (e) { /* 그대로 */ } return n; }
  function cs(el) { try { return W.getComputedStyle(el); } catch (e) { return null; } }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2); }

  function normalize(raw) {
    var c = {};
    c.name = clean(raw.name, 30);
    c.uses = clean(raw.use, 160).split(/[,\s]+/).filter(function (k, i, a) { return USE[k] && a.indexOf(k) === i; });
    c.review = REVIEW[clean(raw.review, 12)] || '';
    c.privacy = clean(raw.privacy, 2) === '1';
    c.contact = clean(raw.contact, 80);
    if (c.contact && !/^[^\s@]{1,64}@[A-Za-z0-9.\-]{1,120}\.[A-Za-z]{2,}$/.test(c.contact) && !/^https?:\/\/[^\s"'<>]{3,80}$/.test(c.contact)) c.contact = '';
    var st = clean(raw.style, 8);
    c.style = ({ badge: 1, line: 1, inline: 1, none: 1 })[st] ? st : 'badge';
    c.side = clean(raw.side, 6) === 'right' ? 'right' : 'left';
    c.dark = clean(raw.theme, 6) === 'dark';
    c.date = /^\d{4}-\d{2}$/.test(clean(raw.date, 7)) ? clean(raw.date, 7) : '';
    var lv = clean(raw.level, 10);
    if (!({ human: 1, assist: 1, generated: 1 })[lv]) lv = c.uses.length ? 'assist' : 'human';
    c.level = lv;
    if (!c.uses.length && lv !== 'human') c.uses = ['text'];
    c.site = clean(raw.site, 40).replace(/[^\w\-.]/g, '');
    return c;
  }

  var NOTICE = null;   // { host, open(on), update() }
  function noticeCss(C, side) {
    return ':host{all:initial}*{box-sizing:border-box}' +
      '.k{font-family:' + FONT + ';color:' + C.fg + ';-webkit-font-smoothing:antialiased;letter-spacing:-.01em;line-height:1.5;word-break:keep-all}' +
      '.k svg{flex:0 0 auto}' +
      '.badge{position:relative;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 7px 0 5px;border-radius:999px;border:1px solid ' + C.line + ';background:' + C.bg + ';color:' + C.fg + ';font-family:inherit;font-weight:720;font-size:13px;letter-spacing:-.01em;line-height:1;cursor:pointer;box-shadow:0 1px 2px rgba(9,20,47,.06),0 12px 28px -10px rgba(9,20,47,.28);transition:box-shadow .18s ease,border-color .18s ease}' +
      '.badge.fl{animation:amf 6s ease-in-out infinite}@keyframes amf{0%,100%{translate:0 0}50%{translate:0 -3px}}' +
      '.badge:hover{box-shadow:0 1px 2px rgba(9,20,47,.06),0 16px 34px -12px rgba(9,20,47,.34)}' +
      '.inl .badge{box-shadow:none}.inl .badge:hover{box-shadow:none;border-color:' + C.acc + '}' +
      '.badge .ic{position:relative;width:30px;height:30px;border-radius:50%;background:' + C.chip + ';display:inline-flex;align-items:center;justify-content:center}.badge .ic svg{width:15.3px;height:18px}' +
      '.badge.fl .ic::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(11,99,246,.36);opacity:0;animation:amp 6s ease-out infinite;pointer-events:none}@keyframes amp{0%,55%{opacity:0;transform:scale(1)}62%{opacity:1}100%{opacity:0;transform:scale(1.5)}}' +
      '.badge .n{min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:' + C.acc + ';color:#fff;font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}.badge .n[hidden]{display:none}' +
      '.badge .lb{padding-right:4px}' +
      '.badge:focus-visible,.lnk:focus-visible,.line button:focus-visible,.it:focus-visible{outline:2px solid ' + C.acc + ';outline-offset:2px}' +
      '.line{display:flex;justify-content:center;padding:12px 16px;font-size:12.5px;color:' + C.sub + '}' +
      '.line button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:inherit;font:inherit;cursor:pointer;padding:4px 6px;border-radius:8px}.line button b{color:' + C.acc + '}.line svg{width:15px;height:17px}' +
      '.pop{position:absolute;bottom:48px;' + side + ':0;width:344px;max-width:calc(100vw - 24px);max-height:calc(100vh - 90px);overflow:auto;background:' + C.bg + ';border:1px solid ' + C.line + ';border-radius:18px;box-shadow:0 24px 60px rgba(9,20,47,.26);padding:16px 16px 12px;display:none;text-align:left}' +
      '.pop.on{display:block}.pop h4{display:flex;align-items:center;gap:8px;margin:0 0 2px;font-size:15.5px;font-weight:800;color:' + C.fg + '}.pop h4 svg{width:17px;height:19px}' +
      '.pop .who{margin:0;font-size:12.5px;color:' + C.sub + '}' +
      '.lv{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:12px 0 4px}.lv span{text-align:center;padding:6px 2px;border-radius:8px;background:' + C.chip + ';color:' + C.sub + ';font-weight:750;font-size:11.5px}' +
      '.lv span.on{color:#fff}.lv .human.on{background:#0E9A6A}.lv .assist.on{background:#0B63F6}.lv .generated.on{background:#0E1F47' + (C.dark ? ';box-shadow:inset 0 0 0 1px #3A4A70' : '') + '}' +
      '.lvt{margin:0 0 6px;font-size:11.5px;color:' + C.sub + '}' +
      '.pop ul{list-style:none;margin:0;padding:0}.pop li{display:flex;gap:8px;padding:7px 0;border-top:1px solid ' + C.line + ';font-size:13.5px;color:' + C.fg + '}.pop li:first-child{border-top:0}' +
      '.pop li i{flex:0 0 6px;height:6px;margin-top:8px;border-radius:50%;background:' + C.acc + '}.pop li.ok i{background:#0E9A6A}' +
      '.here{margin:12px 0 2px;padding:10px;border-radius:12px;background:' + C.chip + '}.here[hidden]{display:none}.here b{display:block;font-size:12px;font-weight:800;color:' + C.fg + ';margin-bottom:6px}' +
      '.it{display:flex;align-items:center;gap:9px;width:100%;padding:6px;border:0;border-radius:9px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.it:hover{background:' + C.bg + '}' +
      '.it .th{width:34px;height:34px;border-radius:7px;background:' + C.line + ' center/cover no-repeat;flex:0 0 34px;display:flex;align-items:center;justify-content:center;font-size:10px;color:' + C.sub + '}' +
      '.it span{display:block;font-size:12.5px;font-weight:750;line-height:1.35}.it small{display:block;font-size:11px;color:' + C.sub + ';line-height:1.35}' +
      '.it em{margin-left:auto;font-style:normal;font-size:11px;color:' + C.acc + ';font-weight:750;white-space:nowrap}' +
      '.pop .ct{margin:8px 0 0;font-size:12.5px;color:' + C.sub + ';word-break:break-all}.pop .ct a{color:' + C.acc + '}' +
      '.pop .ft{margin:12px -16px -12px;padding:10px 16px 11px;border-top:1px solid ' + C.line + ';background:' + C.foot + ';border-radius:0 0 18px 18px;font-size:11.5px;color:' + C.sub + '}' +
      '.lnk{display:flex;align-items:center;gap:8px;margin-top:7px;color:' + C.fg + ';text-decoration:none;font-size:12px;line-height:1.35}.lnk svg{width:20px;height:23px}' +
      '.lnk b{display:block;font-weight:850;letter-spacing:.01em}.lnk b .ai{color:' + C.acc + '}.lnk em{display:block;font-style:normal;font-weight:700;color:' + C.acc + '}.lnk:hover em{text-decoration:underline}' +
      '.std{display:block;margin-top:6px;font-size:10.5px;color:' + C.sub + ';opacity:.9}' +
      '.mo{display:block;margin-top:7px;padding:2px 0;border:0;background:none;color:' + C.acc + ';font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:2px}.mo:focus-visible{outline:2px solid ' + C.acc + ';outline-offset:2px;border-radius:4px}' +
      '.x{position:absolute;top:10px;right:10px;width:28px;height:28px;border:0;border-radius:8px;background:' + C.chip + ';color:' + C.sub + ';cursor:pointer;font:700 16px/28px sans-serif;padding:0}' +
      '.wrap{position:relative;display:inline-block}' +
      '@media (max-width:560px){.badge{height:36px;font-size:12px}.badge .ic{width:26px;height:26px}.pop{bottom:46px}}' +
      '@media (prefers-reduced-motion:reduce){.badge.fl,.badge.fl .ic::after{animation:none}}';
  }

  function build(raw, mountEl) {
    var c = normalize(raw || {});
    if (c.style === 'none' && !mountEl) return null;
    var C = c.dark ? { bg: '#0B1734', fg: '#E9EDF5', sub: '#9AA5BC', line: '#22325A', chip: '#17264D', acc: '#5B9BFF', foot: '#0A1530', dark: 1 }
      : { bg: '#FFFFFF', fg: '#0E1F47', sub: '#586179', line: '#E2E6EE', chip: '#F1F4F9', acc: '#0B63F6', foot: '#F6F8FB' };
    var items = c.uses.map(function (k) { return '<li><i></i><span>' + esc(USE[k]) + '</span></li>'; }).join('') +
      (c.review ? '<li class="ok"><i></i><span>' + esc(c.review) + '</span></li>' : '') +
      (c.privacy ? '<li class="ok"><i></i><span>AI 도구에 고객 개인정보를 넣지 않습니다</span></li>' : '');
    if (!items) items = '<li class="ok"><i></i><span>사람이 직접 만든 콘텐츠를 중심으로 운영합니다</span></li>';
    var ct = c.contact ? '<p class="ct">AI 활용 문의 ' + (c.contact.indexOf('@') > 0 ? '<a href="mailto:' + esc(c.contact) + '">' + esc(c.contact) + '</a>' : '<a href="' + esc(c.contact) + '" target="_blank" rel="noopener">' + esc(c.contact.replace(/^https?:\/\//, '')) + '</a>') + '</p>' : '';
    var lvName = LEVELS.filter(function (l) { return l[0] === c.level; })[0][1];
    var lv = '<div class="lv" role="img" aria-label="AI 성분표: ' + lvName + '">' +
      LEVELS.map(function (l) { return '<span class="' + l[0] + (l[0] === c.level ? ' on' : '') + '">' + l[1] + '</span>'; }).join('') + '</div><p class="lvt">AI 성분표 · 이 사이트의 콘텐츠는 주로 \'' + lvName + '\'입니다</p>';
    var who = (c.name ? esc(c.name) + josa(c.name) + ' 이렇게 AI를 사용합니다' : '이 사이트는 이렇게 AI를 사용합니다') + (c.date ? ' · ' + c.date.replace('-', '.') + ' 작성' : '');
    var reg = c.site ? '<a class="lnk" href="' + HOME + '/v/?s=' + encodeURIComponent(location.hostname) + '&id=' + encodeURIComponent(c.site) + '" target="_blank" rel="noopener" style="margin-top:4px"><span><em>AIMarker 등록 사이트인지 확인 →</em></span></a>' : '';
    var pop = '<div class="pop" role="dialog" aria-label="' + t('noticeA') + '"><button class="x" type="button" aria-label="' + t('close') + '">×</button><h4>' + fp('h') + t('noticeT') + '</h4><p class="who">' + who + '</p>' + lv + '<ul>' + items + '</ul>' +
      '<div class="here" hidden><b>' + t('here') + '</b><div class="list"></div></div>' + ct +
      '<div class="ft">이 안내는 사이트 운영자가 직접 작성했습니다.' + reg + '<a class="lnk" href="' + HOME + '/label/?utm_source=label&utm_medium=referral" target="_blank" rel="noopener">' + fp('l') + '<span><b><span class="ai">AI</span>Marker</b><em>AI 마킹 · 무료로 시작하기 →</em></span></a><span class="std">' + t('std') + '. ' + t('nocert') + '</span>' + (CFG.motion && !mountEl ? '<button class="mo" type="button" data-mo>' + t(moving() ? 'mOff' : 'mOn') + '</button>' : '') + '</div></div>';
    var host = D.createElement('div');
    host.setAttribute('data-aimarker', '1');
    var style = c.style, box = null;
    if (mountEl) { host.style.cssText = style === 'badge' || style === 'none' ? 'all:initial;position:absolute;bottom:14px;' + c.side + ':14px;z-index:5' : 'all:initial;display:block;position:absolute;left:0;right:0;bottom:0'; if (style === 'none') style = 'badge'; }
    else {
      box = style === 'inline' ? D.getElementById('aimarker') : null;
      if (style === 'inline' && !box) style = 'line';
      host.style.cssText = style === 'badge' ? 'all:initial;position:fixed;bottom:16px;' + c.side + ':16px;z-index:2147482000' : 'all:initial;display:block';
    }
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var trigger = style === 'line'
      ? '<div class="line"><button type="button" aria-expanded="false">' + fp('m') + '<span>' + (c.name ? esc(c.name) + josa(c.name) : '이 사이트는') + ' 일부 콘텐츠에 AI를 활용합니다 · <b>' + t('open') + '</b></span></button></div>'
      : '<button class="badge' + (!box && !mountEl && moving() ? ' fl' : '') + '" type="button" aria-expanded="false"><span class="ic">' + fp('b') + '</span><span class="lb">' + t('noticeT') + '</span><span class="n" hidden></span></button>';
    root.innerHTML = '<style>' + noticeCss(C, c.side) + '</style><div class="k' + (box ? ' inl' : '') + '"><div class="wrap">' + pop + trigger + '</div></div>';
    var p = root.querySelector('.pop'), tr = root.querySelector('.badge, .line button');
    if (style === 'line') { var wr = root.querySelector('.wrap'); wr.style.display = 'block'; p.style.left = '50%'; p.style.right = 'auto'; p.style.transform = 'translateX(-50%)'; p.style.bottom = '48px'; }
    if (mountEl) { p.style.maxWidth = Math.max(240, (mountEl.clientWidth || 360) - 28) + 'px'; p.style.maxHeight = 'none'; }
    function setOpen(on) { p.classList.toggle('on', on); tr.setAttribute('aria-expanded', on ? 'true' : 'false'); if (on) fillHere(); }
    tr.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!p.classList.contains('on')); });
    root.querySelector('.x').addEventListener('click', function (e) { e.stopPropagation(); setOpen(false); });
    p.addEventListener('click', function (e) { e.stopPropagation(); });
    if (!mountEl) {
      D.addEventListener('click', function () { setOpen(false); });
      D.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    }
    var here = root.querySelector('.here'), list = root.querySelector('.here .list'), cnt = root.querySelector('.badge .n');
    function fillHere() {
      var its = ITEMS.filter(function (x) { return x.kind && x.el.isConnected; }).sort(docOrder);
      here.hidden = !its.length;
      if (!its.length) return;
      list.innerHTML = its.slice(0, 12).map(function (x, i) {
        var th = x.thumb ? '<span class="th" style="background-image:url(&quot;' + esc(x.thumb) + '&quot;)"></span>' : '<span class="th">' + esc(t(x.type === 'block' ? 'block' : 'img')) + '</span>';
        return '<button class="it" type="button" data-i="' + i + '">' + th + '<span><span>' + esc(labelOf(x)) + '</span><small>' + esc(t('b_' + x.basis)) + '</small></span><em>' + t('go') + '</em></button>';
      }).join('') + (its.length > 12 ? '<small style="display:block;padding:4px 6px 0;font-size:11px;color:' + C.sub + '">외 ' + (its.length - 12) + '건</small>' : '');
      Array.prototype.forEach.call(list.querySelectorAll('.it'), function (b) {
        b.addEventListener('click', function () { var x = its[+b.getAttribute('data-i')]; setOpen(false); reveal(x); });
      });
    }
    function update() {
      if (!cnt) return;
      var n = ITEMS.filter(function (x) { return x.kind; }).length;
      cnt.hidden = !n; cnt.textContent = n > 99 ? '99+' : String(n);
      tr.setAttribute('aria-label', t('noticeA') + (n ? ', 이 페이지 AI 마킹 ' + n + '건' : ''));
      if (p.classList.contains('on')) fillHere();
    }
    host.__open = setOpen;
    if (mountEl) mountEl.appendChild(host);
    else if (box) box.appendChild(host);
    else (D.body || D.documentElement).appendChild(host);
    var mo = root.querySelector('[data-mo]');
    if (mo) mo.addEventListener('click', function (e) { e.stopPropagation(); setMotion(!moving()); });
    function motionUi(on) { var bd = root.querySelector('.badge'); if (bd && !box && !mountEl) bd.classList.toggle('fl', on); if (mo) mo.textContent = t(on ? 'mOff' : 'mOn'); }
    var api = { host: host, open: setOpen, update: update, motion: motionUi };
    if (!mountEl) NOTICE = api;
    return host;
  }

  /* ---------- AI 마크 태그 ---------- */
  var CFG = { tag: 'tag', pos: 'tl', light: false, motion: true, z: 3, min: 96, meta: true, alt: true, ld: true, auto: true, rules: {}, site: '', name: '' };
  var ITEMS = [];          // { el, type: img|video|bg|block|frame, kind, basis, tool, why, host, thumb, src, ... }
  /* 13.0 움직임: 사이트가 켜 두었고(data-motion) 방문자가 멈추지 않았을 때만. 방문자 설정은 이 브라우저에 기억(웹 접근성: 움직이는 콘텐츠 멈추기) */
  var MKEY = 'aimarker-motion';
  function moving() { return CFG.motion && store(MKEY) !== 'off'; }
  function setMotion(on) {
    store(MKEY, on ? 'on' : 'off');
    ITEMS.forEach(function (x) { var el = x.host && x.host.__r && x.host.__r.querySelector('.t'); if (el) el.classList.toggle('fl', on); });
    if (NOTICE && NOTICE.motion) NOTICE.motion(on);
    if (CARD && CARD.mo) CARD.mo.textContent = t(on ? 'mOff' : 'mOn');
    try { W.dispatchEvent(new CustomEvent('aimarker:motion', { detail: { on: on } })); } catch (e) { /* 오래된 브라우저 */ }
  }
  var BY = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function itemOf(el) { if (BY) return BY.get(el); for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].el === el) return ITEMS[i]; return null; }
  function labelOf(x) { return x.type === 'block' ? t('text') : t(x.kind); }
  /* 13.1 마크 글자: 'AI 마킹'을 크게, 어떤 AI 사용인지(생성 · 편집 · 보조 · 가상인물 · 도움 글)는 표시 기준이라 가는 선 뒤에 함께 */
  function markText(x) { return '<span class="l"><b>' + esc(t('mark')) + '</b><i>' + esc(t('k_' + (x.type === 'block' ? 'text' : x.kind))) + '</i></span>'; }
  function docOrder(a, b) { if (a.el === b.el) return 0; return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1; }

  /* 13.0 AI 마크(2026.10.23): 둥근 알약 · 유리 같은 남색 바탕 · 흰 원 안의 지문, 은은하게 떠 있는 움직임(data-motion="0" 이면 멈춤, 움직임 줄이기 설정 존중) */
  var TAG_CSS = ':host{all:initial}*{box-sizing:border-box}' +
    '.t{position:relative;display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 12px 0 3px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:linear-gradient(180deg,rgba(26,48,104,.86),rgba(8,20,47,.9));-webkit-backdrop-filter:blur(10px) saturate(160%);backdrop-filter:blur(10px) saturate(160%);color:#fff;font:700 12.5px/1 ' + FONT + ';letter-spacing:-.01em;white-space:nowrap;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 10px 24px -8px rgba(8,20,47,.55),0 2px 6px rgba(8,20,47,.2);transition:background .18s ease,box-shadow .18s ease,padding .22s ease;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}' +
    '.t.fl{animation:amf var(--d,5.6s) ease-in-out var(--dl,0s) infinite}' +
    '@keyframes amf{0%,100%{translate:0 0}50%{translate:0 -3px}}' +
    '.t:hover{background:linear-gradient(180deg,rgba(32,60,128,.94),rgba(8,20,47,.96));box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 14px 30px -10px rgba(8,20,47,.6),0 2px 6px rgba(8,20,47,.22)}.t:active{scale:.97}.t:focus-visible{outline:2px solid #33C8FF;outline-offset:3px}' +
    '.f{position:relative;width:22px;height:22px;border-radius:50%;background:#fff;display:inline-flex;align-items:center;justify-content:center;flex:0 0 22px;box-shadow:0 0 0 2px rgba(125,184,255,.3)}.f svg{width:13.6px;height:16px}' +
    '.l b{font-weight:760}.l i{font-style:normal;font-weight:560;opacity:.8;margin-left:7px;padding-left:7px;border-left:1px solid rgba(255,255,255,.3)}.t.light .l i{border-left-color:rgba(14,31,71,.2)}.bar .l i{border-left-color:rgba(255,255,255,.3)}' +
    '.t.fl .f::after{content:"";position:absolute;inset:-2px;border-radius:50%;border:2px solid rgba(51,200,255,.5);opacity:0;animation:amp var(--d,5.6s) ease-out var(--dl,0s) infinite;pointer-events:none}' +
    '@keyframes amp{0%,55%{opacity:0;transform:scale(1)}62%{opacity:1}100%{opacity:0;transform:scale(1.45)}}' +
    '.l{display:inline-block}' +
    '.t.light{background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(242,246,252,.92));color:#0E1F47;border-color:rgba(14,31,71,.14);box-shadow:inset 0 1px 0 #fff,0 10px 24px -10px rgba(9,20,47,.34),0 2px 6px rgba(9,20,47,.1)}.t.light:hover{background:#fff}.t.light .f{background:#EEF4FF;box-shadow:0 0 0 2px rgba(11,99,246,.14)}' +
    '.t.mini{padding:0 3px;gap:0}.t.mini .l{max-width:0;overflow:hidden;opacity:0;transition:max-width .24s ease,opacity .18s ease,margin .24s ease}' +
    '.t.mini:hover,.t.mini:focus-visible{padding:0 12px 0 3px}.t.mini:hover .l,.t.mini:focus-visible .l{max-width:170px;opacity:1;margin-left:7px}' +
    '.t.blk{height:24px;gap:6px;padding:0 10px 0 2px;font-size:11.5px}.t.blk .f{width:19px;height:19px;flex-basis:19px}.t.blk .f svg{width:11.9px;height:14px}.t.blk .l i{margin-left:6px;padding-left:6px}' +
    '.bar{display:flex;align-items:center;gap:8px;width:100%;height:30px;padding:0 10px 0 4px;border:0;border-radius:0;background:linear-gradient(0deg,rgba(8,20,47,.9),rgba(8,20,47,.6));-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#fff;font:700 12px/1 ' + FONT + ';letter-spacing:-.01em;cursor:pointer;text-align:left;white-space:nowrap;overflow:hidden}' +
    '.bar .f{width:21px;height:21px;flex-basis:21px}.bar .s{margin-left:auto;font-weight:650;font-size:11px;opacity:.8}.bar .s b{color:#7DB8FF;font-weight:800}' +
    '.flash{animation:fl 1.1s ease 2}@keyframes fl{0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 10px 24px -8px rgba(8,20,47,.55)}50%{box-shadow:0 0 0 6px rgba(51,200,255,.55)}}' +
    '.ck{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 8px;border-radius:7px;background:rgba(255,255,255,.92);color:#586179;border:1px dashed #9AA5BC;font:700 11px/1 ' + FONT + ';white-space:nowrap}' +
    '.ck.cors{color:#B54708;border-color:#F3B26B}.ck.no{color:#586179}.ck.skip{color:#858C9D}' +
    '@media (prefers-reduced-motion:reduce){.t,.t.mini .l{transition:none}.t.fl,.t.fl .f::after,.flash{animation:none}}';

  function hostFor(x) {
    var h = D.createElement('am-tag');
    h.setAttribute('data-aimarker-tag', x.kind || 'check');
    // 'all:initial' 은 쓰지 않음(뒤에 넣는 위치 값까지 덮어씀). 사이트 CSS 가 건드리기 쉬운 것만 되돌림
    h.style.cssText = 'position:absolute !important;z-index:' + CFG.z + ' !important;display:block !important;margin:0 !important;padding:0 !important;border:0 !important;' +
      'width:auto;height:auto;min-width:0 !important;min-height:0 !important;max-width:none !important;max-height:none !important;float:none !important;transform:none !important;' +
      'opacity:1 !important;filter:none !important;line-height:0 !important;font-size:0 !important;background:none !important;box-shadow:none !important;outline:0 !important;' +
      'pointer-events:auto !important;flex:none !important;grid-area:auto !important;inset:auto;left:0;top:0;visibility:hidden';
    var r = h.attachShadow ? h.attachShadow({ mode: 'open' }) : h;
    r.innerHTML = '<style>' + TAG_CSS + '</style>';
    h.__r = r;
    return h;
  }
  function render(x) {
    var r = x.host.__r, old = r.querySelector('.t,.bar,.ck');
    if (old) old.remove();
    var el;
    if (!x.kind) {   // 점검 모드: 표시하지 않은 것
      el = D.createElement('span');
      el.className = 'ck ' + (x.state || 'no');
      el.textContent = x.state === 'cors' ? '못 읽음(다른 서버)' : x.state === 'skip' ? '작아서 건너뜀' : x.state === 'none' ? '운영자: AI 아님' : x.state === 'wait' ? '확인 중' : '기록 없음';
      r.appendChild(el);
      return;
    }
    var lab = labelOf(x);
    var style = x.type === 'block' ? 'tag' : (x.small && CFG.tag === 'tag' ? 'mini' : CFG.tag);
    if (style === 'bar' && x.type !== 'block') {
      el = D.createElement('button'); el.type = 'button'; el.className = 'bar';
      el.innerHTML = '<span class="f">' + fp() + '</span>' + markText(x) + '<span class="s"><b>AI</b>Marker</span>';
    } else {
      el = D.createElement('button'); el.type = 'button';
      el.className = 't' + (CFG.light ? ' light' : '') + (style === 'mini' ? ' mini' : '') + (x.type === 'block' ? ' blk' : '') + (moving() ? ' fl' : '');
      el.innerHTML = '<span class="f">' + fp() + '</span>' + markText(x);
      if (CFG.motion) { if (x.ph == null) x.ph = (Math.random() * 5.2).toFixed(2); el.style.setProperty('--dl', '-' + x.ph + 's'); el.style.setProperty('--d', (5.2 + (+x.ph % 1.4)).toFixed(2) + 's'); }
    }
    var tw = t(x.type === 'block' ? 'block' : x.type === 'video' || x.type === 'frame' ? 'video' : 'img');
    el.setAttribute('aria-label', (lab.slice(-tw.length) === tw ? lab : lab + ' ' + tw) + ', ' + t('ariaGo'));
    el.title = t('mark') + ' · ' + lab + ' · ' + t('b_' + x.basis);
    el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openCard(x, el); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); });
    ['mousedown', 'pointerdown', 'touchstart'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    r.appendChild(el);
  }

  /* 태그를 미디어 바로 뒤(같은 칸)에 넣어 함께 움직이고 함께 가려지게 */
  function anchorOf(el) {
    var a = el, p = el.parentElement;
    if (p && p.tagName === 'PICTURE') { a = p; p = p.parentElement; }
    // 이미지 하나만 감싼 링크 · span 은 그 바깥에(눌러도 링크로 넘어가지 않게)
    if (p && /^(A|SPAN)$/.test(p.tagName) && p.children.length === 1 && !String(p.textContent || '').trim()) a = p;
    return a;
  }
  function attach(x) {
    if (x.host && x.host.isConnected) return;
    if (!x.host) x.host = hostFor(x);
    var a = x.type === 'block' ? x.el : anchorOf(x.el);
    if (!a.parentNode) return;
    if (a.nextSibling) a.parentNode.insertBefore(x.host, a.nextSibling); else a.parentNode.appendChild(x.host);
    x.cb = undefined;
    var r0 = x.el.getBoundingClientRect();
    x.small = x.type !== 'block' && (r0.width < 220 || r0.height < 140);
    render(x);
    watchSize(x);
    place(x);
  }
  function detach(x) { if (x.host && x.host.parentNode) x.host.parentNode.removeChild(x.host); }

  function cbOf(h) {   // 절대 위치의 기준 상자(가장 가까운 기준 조상). 없으면 문서
    for (var el = h.parentElement; el && el !== D.documentElement; el = el.parentElement) {
      var s = cs(el);
      if (!s) continue;
      if (el === D.body && s.position === 'static') continue;
      if (s.position !== 'static' || (s.transform && s.transform !== 'none') || (s.perspective && s.perspective !== 'none') || (s.filter && s.filter !== 'none') ||
        (s.backdropFilter && s.backdropFilter !== 'none') || /paint|layout|strict|content/.test(s.contain || '') || /transform|perspective|filter/.test(s.willChange || '') ||
        (s.containerType && s.containerType !== 'normal')) return el;
    }
    return null;
  }
  function place(x) {
    var h = x.host;
    if (!h || !h.isConnected) return;
    var r = x.el.getBoundingClientRect();
    var tooSmall = r.width < 24 || r.height < 18;
    if (tooSmall || (x.el.offsetParent === null && cs(x.el) && cs(x.el).position !== 'fixed')) { h.style.setProperty('visibility', 'hidden', 'important'); return; }
    if (x.cb === undefined) x.cb = cbOf(h);
    var cb = x.cb, ox, oy, sx = 1, sy = 1;
    if (cb) {
      var pr = cb.getBoundingClientRect();
      sx = cb.offsetWidth ? pr.width / cb.offsetWidth : 1; sy = cb.offsetHeight ? pr.height / cb.offsetHeight : 1;
      if (!sx || !isFinite(sx)) sx = 1; if (!sy || !isFinite(sy)) sy = 1;
      ox = pr.left + cb.clientLeft * sx - cb.scrollLeft * sx; oy = pr.top + cb.clientTop * sy - cb.scrollTop * sy;
    } else { ox = -W.pageXOffset; oy = -W.pageYOffset; }
    var small = x.type !== 'block' && (r.width < 220 || r.height < 140);
    if (small !== x.small && x.kind) { x.small = small; render(x); }
    var pad = x.type === 'block' ? 6 : (r.width < 160 ? 6 : 10), bar = CFG.tag === 'bar' && x.type !== 'block' && x.kind;
    var w = h.offsetWidth || 90, hh = h.offsetHeight || 26, left, top;
    if (bar) { h.style.setProperty('width', Math.round(r.width) + 'px', 'important'); left = r.left; top = r.bottom - 28; }
    else {
      var pos = x.type === 'block' ? 'tr' : CFG.pos;
      left = pos.charAt(1) === 'r' ? r.right - pad - w : r.left + pad;
      top = pos.charAt(0) === 'b' ? r.bottom - pad - hh : r.top + pad;
      if (x.type === 'block') top = r.top - Math.round(hh / 2);
    }
    h.style.setProperty('left', Math.round((left - ox) / sx) + 'px', 'important');
    h.style.setProperty('top', Math.round((top - oy) / sy) + 'px', 'important');
    h.style.setProperty('visibility', 'visible', 'important');
    x.at = [r.left, r.top, r.width, r.height];
  }
  var RO = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function (es) { es.forEach(function (e) { var x = itemOf(e.target); if (x) place(x); }); }) : null;
  function watchSize(x) { if (RO && !x.ro) { try { RO.observe(x.el); x.ro = 1; } catch (e) { /* 무시 */ } } }
  var placeAllT = 0;
  function placeAll() { if (placeAllT) return; placeAllT = setTimeout(function () { placeAllT = 0; ITEMS.forEach(function (x) { if (x.host) { x.cb = undefined; place(x); } }); }, 120); }

  /* ---------- 근거 창 ---------- */
  var CARD = null;
  var CARD_CSS = ':host{all:initial}*{box-sizing:border-box}' +
    '.bk{position:fixed;inset:0;z-index:2147483000}.bk.sheet{background:rgba(8,20,47,.36)}' +
    '.c{position:fixed;z-index:2147483001;width:332px;max-width:calc(100vw - 20px);background:#fff;color:#0E1F47;border-radius:18px;box-shadow:0 26px 64px rgba(8,20,47,.30),0 0 0 1px rgba(14,31,71,.08);font-family:' + FONT + ';letter-spacing:-.01em;line-height:1.5;-webkit-font-smoothing:antialiased;word-break:keep-all;overflow:hidden;animation:in .16s ease}' +
    '.c.sheet{left:0;right:0;bottom:0;top:auto!important;width:auto;max-width:none;border-radius:20px 20px 0 0;padding-bottom:env(safe-area-inset-bottom)}' +
    '@keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
    '.hd{display:flex;gap:12px;align-items:center;padding:16px 46px 12px 16px}.ic{width:42px;height:42px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#FFFFFF,#E6EEFF 70%);box-shadow:inset 0 0 0 1px rgba(11,99,246,.14),0 6px 16px -8px rgba(11,99,246,.5);display:flex;align-items:center;justify-content:center;flex:0 0 42px}.ic svg{width:21px;height:24px}' +
    '.hd b{display:block;font-size:16px;font-weight:820;line-height:1.3}.hd small{display:block;font-size:12.5px;color:#586179;margin-top:2px}' +
    '.k{display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;background:#0E1F47;color:#fff;font-size:11.5px;font-weight:800;margin-right:6px;vertical-align:1px}.k.edit{background:#0A4FCB}.k.assist{background:#0B63F6}.k.virtual{background:#5B3BD6}' +
    '.rows{padding:0 16px 6px}.row{display:grid;grid-template-columns:44px 1fr;gap:10px;padding:8px 0;border-top:1px solid #EEF1F6;font-size:12.8px;align-items:start}.row>span{color:#858C9D;font-weight:650}.row b{font-weight:720}' +
    '.g{display:inline-flex;align-items:flex-end;gap:2px;height:12px;margin-left:6px;vertical-align:-1px}.g i{display:block;width:4px;border-radius:2px;background:#DCE3EE}.g i:nth-child(1){height:6px}.g i:nth-child(2){height:9px}.g i:nth-child(3){height:12px}.g.g1 i:nth-child(-n+1),.g.g2 i:nth-child(-n+2),.g.g3 i{background:#0B63F6}' +
    '.act{display:flex;gap:6px;padding:8px 16px 14px}.act a,.act button{flex:1;display:inline-flex;align-items:center;justify-content:center;height:38px;border-radius:10px;font:720 12.8px/1 ' + FONT + ';text-decoration:none;cursor:pointer;white-space:nowrap}' +
    '.act .p{background:#0B63F6;color:#fff;border:1px solid #0B63F6}.act .p:hover{background:#0952D6;border-color:#0952D6}.act .s{background:#fff;color:#0E1F47;border:1px solid #D0D6E0}.act .s:hover{border-color:#0E1F47}' +
    '.ft{display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding:10px 16px;background:#F6F8FB;border-top:1px solid #EEF1F6;font-size:11px;color:#858C9D;line-height:1.45}.ft>span{flex:1 1 0;min-width:0}.ft .mo{flex:0 0 calc(100% - 20px);margin:0 0 0 20px;padding:2px 0;border:0;background:none;color:#0B63F6;font:700 11px/1.4 ' + FONT + ';text-align:left;cursor:pointer;text-decoration:underline;text-underline-offset:2px}.ft svg{width:13px;height:15px;flex:0 0 13px}.ft b{color:#0E1F47;font-weight:850}.ft b i{font-style:normal;color:#0B63F6}' +
    '.x{position:absolute;top:12px;right:12px;width:30px;height:30px;border:0;border-radius:9px;background:#F1F4F9;color:#586179;cursor:pointer;font:700 17px/30px sans-serif;padding:0}.x:hover{background:#E6EBF3}' +
    'a:focus-visible,button:focus-visible{outline:2px solid #0B63F6;outline-offset:2px}' +
    '@media (prefers-reduced-motion:reduce){.c{animation:none}}';
  function closeCard() { if (CARD) { CARD.host.remove(); if (CARD.from && CARD.from.focus) try { CARD.from.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } CARD = null; } }
  function openCard(x, from) {
    closeCard();
    var host = D.createElement('div'); host.setAttribute('data-aimarker-card', '1');
    host.style.cssText = 'all:initial;position:fixed;left:0;top:0;width:0;height:0;z-index:2147483000';
    var r = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    var sheet = W.innerWidth < 560;
    var lab = labelOf(x), what = t(x.type === 'block' ? 'block' : x.type === 'video' || x.type === 'frame' ? 'video' : 'img');
    var g = GRADE[x.basis] || 1;
    var lead = x.type === 'block' ? t('textL') : t(x.kind + 'L');
    var site = CFG.name ? esc(CFG.name) : esc(location.hostname.replace(/^www\./, ''));
    var vq = '?u=' + encodeURIComponent(x.src || '') + '&k=' + x.kind + '&b=' + x.basis + (x.tool ? '&t=' + encodeURIComponent(x.tool) : '') + '&s=' + encodeURIComponent(location.hostname) + (CFG.site ? '&id=' + encodeURIComponent(CFG.site) : '');
    r.innerHTML = '<style>' + CARD_CSS + '</style><div class="bk' + (sheet ? ' sheet' : '') + '"></div>' +
      '<div class="c' + (sheet ? ' sheet' : '') + '" role="dialog" aria-modal="false" aria-label="' + esc(lab) + ' ' + t('cardL') + '">' +
      '<button class="x" type="button" aria-label="' + t('close') + '">×</button>' +
      '<div class="hd"><span class="ic">' + fp() + '</span><span><b><span class="k ' + x.kind + '">' + esc(lab) + '</span>' + esc(what) + '</b><small>' + esc(lead) + '</small></span></div>' +
      '<div class="rows">' +
      '<div class="row"><span>' + t('basis') + '</span><span><b>' + esc(t('b_' + x.basis)) + '</b><span class="g g' + g + '" aria-hidden="true"><i></i><i></i><i></i></span>' + (x.why ? '<br><small style="color:#586179">' + esc(x.why) + '</small>' : '') + '</span></div>' +
      (x.tool ? '<div class="row"><span>' + t('tool') + '</span><span>' + esc(x.tool) + '</span></div>' : '') +
      '<div class="row"><span>' + t('who') + '</span><span>' + site + ' (AIMarker)</span></div>' +
      '<div class="row"><span>' + t('when') + '</span><span>' + ymd() + ' · ' + t('browser') + '</span></div>' +
      '</div>' +
      '<div class="act"><a class="p" href="' + HOME + '/v/' + vq + '" target="_blank" rel="noopener">' + t('verify') + '</a>' + (NOTICE ? '<button class="s" type="button" data-n>' + t('notice') + '</button>' : '') + '</div>' +
      '<div class="ft">' + fp('', false) + '<span><b><i>AI</i>Marker</b> ' + t('mk') + ' · ' + t('foot') + '</span>' + (CFG.motion ? '<button class="mo" type="button" data-mo>' + t(moving() ? 'mOff' : 'mOn') + '</button>' : '') + '</div></div>';
    (D.body || D.documentElement).appendChild(host);
    var c = r.querySelector('.c');
    if (!sheet) {
      var b = from.getBoundingClientRect(), cw = c.offsetWidth, ch = c.offsetHeight;
      var left = Math.min(Math.max(10, b.left), W.innerWidth - cw - 10), top = b.bottom + 8;
      if (top + ch > W.innerHeight - 10) top = Math.max(10, b.top - ch - 8);
      c.style.left = left + 'px'; c.style.top = top + 'px';
    }
    r.querySelector('.bk').addEventListener('click', closeCard);
    r.querySelector('.x').addEventListener('click', closeCard);
    var nb = r.querySelector('[data-n]');
    if (nb) nb.addEventListener('click', function () { closeCard(); if (NOTICE) setTimeout(function () { NOTICE.open(true); }, 0); });
    c.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
    var mb = r.querySelector('[data-mo]');
    if (mb) mb.addEventListener('click', function () { setMotion(!moving()); });
    CARD = { host: host, from: from, mo: mb };
    try { r.querySelector('.x').focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
  }
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCard(); });
  W.addEventListener('scroll', function () { if (CARD && W.innerWidth >= 560) closeCard(); }, { passive: true });

  function reveal(x) {
    if (!x || !x.el) return;
    try { x.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { x.el.scrollIntoView(); }
    setTimeout(function () { place(x); var b = x.host && x.host.__r && x.host.__r.querySelector('.t,.bar'); if (b) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); } }, 450);
  }

  /* ---------- 찾기: 운영자 표시 · 규칙 · 흔적 · 파일 속 기록 ---------- */
  var OWN = { generated: 'gen', gen: 'gen', ai: 'gen', 'true': 'gen', '1': 'gen', yes: 'gen', edited: 'edit', edit: 'edit', composite: 'edit', assisted: 'assist', assist: 'assist', help: 'assist', enhanced: 'assist', virtual: 'virtual', avatar: 'virtual', text: 'assist',
    none: 'none', human: 'none', no: 'none', 'false': 'none', '0': 'none' };
  var NAME_RE = /Gemini_Generated_Image|ChatGPT[\s_\-]?Image|DALL[·\-_\s]?E|^OIG\d?[._\-]|ComfyUI|midjourney|^mj[_\-]|firefly|leonardo[_\-]|ideogram|stable[\s_\-]?diffusion|^sdxl|novelai|flux[_\-]\d|imagen[_\-]\d|bing[\s_\-]?image|copilot[\s_\-]image|generated[\s_\-]image|ai[\s_\-]generated|AI\s?생성|dreamina|seedream|recraft|kling[_\-]|runway[_\-]gen|sora[_\-]|veo[_\-]?\d|^\d{5}-\d{6,12}\.png$/i;
  var ALT_GEN = /(?:생성형\s?AI|인공지능|AI)\s?(?:로|으로)?\s?(?:생성|제작|만든|그린|만들었|생성한|생성된)|AI\s?(?:생성|이미지|그림|일러스트|아트)\b|\bAI[-\s]?generated|generated\s+(?:by|with)\s+(?:an?\s+)?AI|made\s+with\s+AI|created\s+(?:by|with)\s+AI|[\(\[]\s?AI\s?(?:생성)?[\)\]]|#AI생성/i;
  var ALT_EDIT = /(?:AI|인공지능)\s?(?:로|으로)?\s?(?:편집|보정|합성|수정|리터칭)|\bAI[-\s]?(?:edited|enhanced|retouched)\b/i;
  var ALT_VIRT = /가상\s?인물|가상\s?인간|버추얼\s?휴먼|AI\s?모델|virtual\s+(?:human|model|influencer)/i;

  function ownerKind(el) {
    // 가장 가까운 data-ai 를 따름(그림을 감싼 figure · div 에 붙여도 됨). 글 묶음 표시(text · assist)는 그 안의 그림에 물려주지 않음
    var c = el.closest ? el.closest('[data-ai]') : null;
    if (!c) return '';
    var v = String(c.getAttribute('data-ai') || '').toLowerCase().trim();
    if (c !== el && /^(text|assist|assisted)$/.test(v) && !/^(IMG|VIDEO|IFRAME|PICTURE|FIGURE|A|SPAN)$/.test(c.tagName)) return '';
    return OWN[v] || 'gen';
  }
  function ruleKind(el) {
    var R = CFG.rules;
    try {
      if (R.virtual && el.closest(R.virtual)) return 'virtual';
      if (R.edit && el.closest(R.edit)) return 'edit';
      if (R.gen && el.closest(R.gen)) return 'gen';
    } catch (e) { /* 잘못된 선택자 */ }
    return '';
  }
  function pathKind(el) { return CFG.rules.pathOn && !el.closest('header,nav,footer,[role=banner],[role=navigation],[role=contentinfo]') ? 'gen' : ''; }
  function captionOf(el) {
    var s = [el.getAttribute('alt'), el.getAttribute('title'), el.getAttribute('aria-label')].filter(Boolean).join(' ');
    var f = el.closest && el.closest('figure');
    if (f) { var fc = f.querySelector('figcaption'); if (fc) s += ' ' + fc.textContent; }
    return s.slice(0, 400);
  }
  function hintKind(el, src) {
    if (!CFG.alt) return null;
    var cap = captionOf(el), n = fileOf(src);
    if (ALT_VIRT.test(cap)) return { k: 'virtual', why: '설명에 가상인물 표기가 있습니다' };
    if (ALT_EDIT.test(cap)) return { k: 'edit', why: '설명에 AI 편집 표기가 있습니다' };
    if (ALT_GEN.test(cap)) return { k: 'gen', why: '설명(대체 글 · 캡션)에 AI 생성 표기가 있습니다' };
    if (n && NAME_RE.test(n)) return { k: 'gen', why: '파일 이름에 AI 도구 흔적이 있습니다: ' + n.slice(0, 48), tool: toolFromName(n) };
    return null;
  }
  function toolFromName(n) {
    var m = [[/Gemini_Generated/i, 'Google Gemini'], [/ChatGPT/i, 'ChatGPT'], [/DALL/i, 'DALL·E'], [/^OIG/i, 'Microsoft Designer'], [/ComfyUI/i, 'ComfyUI'], [/midjourney|^mj[_\-]/i, 'Midjourney'], [/firefly/i, 'Adobe Firefly'], [/leonardo/i, 'Leonardo.Ai'], [/ideogram/i, 'Ideogram'], [/stable|sdxl/i, 'Stable Diffusion'], [/novelai/i, 'NovelAI'], [/flux/i, 'FLUX'], [/imagen/i, 'Google Imagen'], [/bing|copilot/i, 'Microsoft Copilot'], [/dreamina|seedream/i, 'Dreamina'], [/recraft/i, 'Recraft'], [/kling/i, 'Kling'], [/runway/i, 'Runway'], [/sora/i, 'Sora'], [/veo/i, 'Google Veo']];
    for (var i = 0; i < m.length; i++) if (m[i][0].test(n)) return m[i][1];
    return '';
  }

  /* 파일 속 기록 읽기: 앞 256KB(+ 필요하면 뒤 128KB). 같은 주소이거나 CORS 를 허용한 파일만. 결과는 이 브라우저에 7일 기억 */
  var TOOLS = [
    [/DALL[·Â·\-\s]*E|DALL-E/, 'DALL·E'], [/ChatGPT/, 'ChatGPT'], [/OpenAI/, 'OpenAI'], [/Adobe Firefly|Firefly/, 'Adobe Firefly'], [/Midjourney/i, 'Midjourney'],
    [/Stable Diffusion|stable-diffusion|StableDiffusion/i, 'Stable Diffusion'], [/ComfyUI/, 'ComfyUI'], [/NovelAI/, 'NovelAI'], [/InvokeAI|invokeai_metadata/, 'InvokeAI'], [/Fooocus/, 'Fooocus'],
    [/Leonardo\.?Ai/i, 'Leonardo.Ai'], [/Ideogram/, 'Ideogram'], [/Bing Image Creator|Image Creator from Microsoft|Microsoft Designer|Microsoft Copilot/, 'Microsoft Designer · Copilot'],
    [/Made with Google AI|Google AI/, 'Google AI'], [/Imagen/, 'Google Imagen'], [/Gemini/, 'Google Gemini'], [/Meta AI|Imagined with AI/, 'Meta AI'], [/Recraft/, 'Recraft'],
    [/Black Forest Labs|FLUX\.\d/, 'FLUX'], [/Kling/, 'Kling'], [/Runway/, 'Runway'], [/\bSora\b/, 'Sora'], [/\bVeo\b/, 'Google Veo'], [/Luma AI|Dream Machine/, 'Luma'], [/Hailuo|MiniMax/, 'Hailuo'],
    [/Dreamina|Seedream|Jimeng/, 'Dreamina'], [/Krea/, 'Krea'], [/Playground AI/, 'Playground'], [/Karlo/, 'Karlo'], [/Wrtn|뤼튼/, '뤼튼'],
    [/Claude \(Anthropic\)|CreatorTool="Claude/, 'Claude']
  ];
  var STRONG = /DALL|ChatGPT|OpenAI|Firefly|Midjourney|Stable Diffusion|stable-diffusion|ComfyUI|NovelAI|InvokeAI|invokeai|Fooocus|Leonardo|Ideogram|Image Creator|Microsoft Designer|Made with Google AI|Imagined with AI|Recraft|Black Forest Labs|Dreamina|Seedream|Hailuo|Dream Machine|Playground AI|Karlo/i;
  function dstKind(t) {
    if (!t) return '';
    if (/compositeWithTrainedAlgorithmicMedia/.test(t)) return 'edit';
    if (/trainedAlgorithmicMedia/.test(t)) return 'gen';
    if (/[^A-Za-z]algorithmicMedia/.test(t)) return 'gen';
    if (/algorithmicallyEnhanced/.test(t)) return 'assist';
    return '';
  }
  function scanBytes(s) {
    // 1) IPTC 디지털 출처 유형(XMP · C2PA 둘 다 같은 이름)
    var c2pa = /c2pa/.test(s) && /jumb|jumd|caBX|urn:c2pa|urn:uuid/.test(s), kind = '', basis = '', note = '';
    // 근거를 정확히: XMP 안의 IPTC 기록과 C2PA 매니페스트 안의 기록을 나눠 봄(C2PA 가 있어도 출처 유형이 XMP 에만 있으면 IPTC)
    var xi = s.indexOf('<x:xmpmeta'), xe = xi < 0 ? -1 : s.indexOf('</x:xmpmeta>', xi), xmp = xi < 0 ? '' : s.slice(xi, xe > xi ? xe : xi + 262144);
    var rest = xi < 0 ? s : s.slice(0, xi) + s.slice(xi + xmp.length);
    var kc = c2pa ? dstKind(rest) : '', kx = dstKind(xmp);
    if (kc) { kind = kc; basis = 'c2pa'; }
    else if (kx) { kind = kx; basis = 'iptc'; }
    else if ((kind = dstKind(s))) basis = c2pa ? 'c2pa' : 'iptc';
    // 2) 생성 도구 이름(기록 칸 가까이에 있을 때만)
    var tool = '';
    var ctx = /(?:CreatorTool|softwareAgent|claim_generator|Software|generator|parameters|Description|Comment|Credit|photoshop:Credit|tEXt|iTXt)[\s\S]{0,260}/g, m, near = '';
    while ((m = ctx.exec(s)) && near.length < 6000) near += m[0] + '\n';
    var pool = c2pa ? s : near;
    for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i][0].test(pool)) { tool = TOOLS[i][1]; break; }
    // PNG 생성 정보(Stable Diffusion · ComfyUI · NovelAI)
    if (!kind) {
      if (/parameters\u0000[\s\S]{0,4000}Steps: \d+[\s\S]{0,400}Sampler:/.test(s)) { kind = 'gen'; basis = 'gen'; tool = tool || 'Stable Diffusion'; }
      else if (/(?:prompt|workflow)\u0000\{[\s\S]{0,4000}"class_type"/.test(s)) { kind = 'gen'; basis = 'gen'; tool = tool || 'ComfyUI'; }
      else if (/Software\u0000NovelAI|"software":\s?"NovelAI"/.test(s)) { kind = 'gen'; basis = 'gen'; tool = 'NovelAI'; }
      else if (/invokeai_metadata|sd-metadata/.test(s)) { kind = 'gen'; basis = 'gen'; tool = tool || 'InvokeAI'; }
      else if (tool && (c2pa ? STRONG.test(s) : STRONG.test(near))) { kind = 'gen'; basis = c2pa ? 'c2pa' : 'gen'; }
    }
    if (!kind && c2pa && /com\.anthropic|Anthropic Files/.test(s)) note = 'Claude 출처 기록이 있지만 생성 여부(디지털 출처 유형)가 적혀 있지 않아 표시하지 않았습니다';
    return { kind: kind, basis: basis, tool: tool, note: note, c2pa: c2pa };
  }
  function latin1(u8) { var s = '', i, n = u8.length; for (i = 0; i < n; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(n, i + 8192))); return s; }
  var Q = [], RUN = 0, READS = 0, MAXREADS = 60;
  function cacheGet(u) { var v = store('amk3:' + u.slice(0, 300)); if (!v) return null; try { v = JSON.parse(v); } catch (e) { return null; } return v && NOW - v.ts < 7 * 864e5 ? v : null; }
  function cachePut(u, v) { v.ts = Date.now(); store('amk3:' + u.slice(0, 300), JSON.stringify(v)); }
  function readMeta(u, el) {
    return new Promise(function (res) {
      var hit = cacheGet(u);
      if (hit) return res(hit);
      Q.push({ u: u, res: res, el: el });
      pump();
    });
  }
  function pump() {
    while (RUN < 3 && Q.length) {
      var j = Q.shift(); RUN++;
      (function (j) {
        fetchHead(j.u, j.el).then(function (v) { if (v.state !== 'cors' && v.state !== 'err' && v.state !== 'skip') cachePut(j.u, v); j.res(v); }, function () { j.res({ state: 'err' }); })
          .then(function () { RUN--; pump(); });
      })(j);
    }
  }
  function readStream(resp, cap) {
    if (!resp.body || !resp.body.getReader) return resp.arrayBuffer().then(function (ab) { return new Uint8Array(ab.slice(0, cap)); });
    var rd = resp.body.getReader(), parts = [], got = 0;
    function step() {
      return rd.read().then(function (o) {
        if (o.done) return join();
        parts.push(o.value); got += o.value.length;
        if (got >= cap) { try { rd.cancel(); } catch (e) { /* 무시 */ } return join(); }
        return step();
      });
    }
    function join() { var out = new Uint8Array(Math.min(got, cap)), off = 0; parts.forEach(function (p) { var n = Math.min(p.length, out.length - off); if (n > 0) { out.set(p.subarray(0, n), off); off += n; } }); return out; }
    return step();
  }
  function fetchHead(u, el) {
    if (!W.fetch) return Promise.resolve({ state: 'err' });
    if (/^data:/.test(u)) {
      try { var b = atob(u.split(',')[1] || '').slice(0, 3 * 1048576); var v = scanBytes(b); v.state = 'ok'; return Promise.resolve(v); } catch (e) { return Promise.resolve({ state: 'err' }); }
    }
    READS++;
    if (READS > MAXREADS) return Promise.resolve({ state: 'skip' });
    var same = false; try { same = new URL(u).origin === location.origin; } catch (e) { /* 무시 */ }
    // 다른 서버(CDN) 파일은 CORS 를 허용할 때만 읽힘. 막히면 브라우저 콘솔에 오류가 남으므로 기본은 같은 주소만, data-meta="all" · 점검 모드 · crossorigin 이 있는 그림은 다른 서버도
    if (!same && CFG.meta !== 'all' && !CHECK && !(el && el.hasAttribute && el.hasAttribute('crossorigin'))) return Promise.resolve({ state: 'cors', skipped: 1 });
    var opt = { headers: { Range: 'bytes=0-262143' }, credentials: same ? 'same-origin' : 'omit', mode: 'cors', cache: 'force-cache' };
    return fetch(u, opt).then(function (r) {
      if (!r.ok && r.status !== 206) return { state: 'err' };
      var total = 0, cr = r.headers.get('Content-Range') || '';
      var mt = /\/(\d+)$/.exec(cr); if (mt) total = +mt[1];
      return readStream(r, r.status === 206 ? 262144 : 4 * 1048576).then(function (head) {
        var s = latin1(head), v = scanBytes(s);
        // WebP · PNG 는 기록이 끝에 있을 수 있어 뒤도 봄
        if (!v.kind && r.status === 206 && total > 262144 && /^RIFF|^\u0089PNG/.test(s.slice(0, 8))) {
          return fetch(u, { headers: { Range: 'bytes=-131072' }, credentials: opt.credentials, mode: 'cors', cache: 'force-cache' }).then(function (r2) {
            return r2.status === 206 ? readStream(r2, 131072).then(function (tail) { var v2 = scanBytes(latin1(tail)); v2.state = 'ok'; return v2.kind ? v2 : (v.state = 'ok', v); }) : (v.state = 'ok', v);
          }, function () { v.state = 'ok'; return v; });
        }
        v.state = 'ok';
        return v;
      });
    }, function () { return { state: same ? 'err' : 'cors' }; });
  }

  /* ---------- 훑기 ---------- */
  function srcOf(el) {
    var tg = el.tagName;
    if (tg === 'IMG') return el.currentSrc || el.src || '';
    if (tg === 'VIDEO') { if (el.currentSrc || el.src) return el.currentSrc || el.src; var so = el.querySelector('source[src]'); return so ? abs(so.getAttribute('src')) : ''; }
    if (tg === 'IFRAME') return el.src || '';
    var st = el.getAttribute('style') || '', m = /background(?:-image)?\s*:[^;]*url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(st);
    return m ? abs(m[1]) : '';
  }
  function typeOf(el) { var tg = el.tagName; return tg === 'IMG' ? 'img' : tg === 'VIDEO' ? 'video' : tg === 'IFRAME' ? 'frame' : 'bg'; }
  function sizeOk(el) {
    var r = el.getBoundingClientRect(), mn = CFG.min;
    if (el.tagName === 'IMG' && el.naturalWidth && el.naturalWidth < 48 && el.naturalHeight < 48) return false;
    return (r.width >= mn && r.height >= mn * 0.6) || (r.width >= mn * 0.6 && r.height >= mn);
  }
  function mine(el) { return el.closest && el.closest('am-tag,[data-aimarker],[data-aimarker-card],[data-aimarker-panel]'); }
  function candidates() {
    var out = [], seen = typeof Set !== 'undefined' ? new Set() : null, seenA = [];
    function has(el) { return seen ? seen.has(el) : seenA.indexOf(el) >= 0; }
    function add(el) { if (!el || has(el) || mine(el)) return; if (seen) seen.add(el); else seenA.push(el); out.push(el); }
    function addMedia(root) { Array.prototype.forEach.call(root.querySelectorAll('img,video,iframe,[style*="url("]'), function (m) { if (m.tagName !== 'IFRAME' || m.closest('[data-ai]') || ruleKind(m)) add(m); }); }
    var list = D.querySelectorAll('img,video,[data-ai],[style*="url("]');
    for (var i = 0; i < list.length && out.length < 800; i++) {
      var el = list[i], tg = el.tagName;
      if (tg === 'IMG' || tg === 'VIDEO' || tg === 'IFRAME') { add(el); continue; }
      if (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'PICTURE' || tg === 'SOURCE') continue;
      var v = el.getAttribute('data-ai');
      if (v != null && /^(text|assist|assisted)$/i.test(v.trim()) && !/url\(/i.test(el.getAttribute('style') || '')) { add(el); continue; }
      if (/url\(/i.test(el.getAttribute('style') || '')) add(el);
      if (v != null) addMedia(el);   // 그림 묶음에 붙인 data-ai: 안의 그림 · 영상에
    }
    var R = CFG.rules;
    ['gen', 'edit', 'virtual'].forEach(function (k) {
      if (!R[k]) return;
      try { Array.prototype.forEach.call(D.querySelectorAll(R[k]), function (el) { if (/^(IMG|VIDEO|IFRAME)$/.test(el.tagName)) add(el); else { if (/url\(/i.test(el.getAttribute('style') || '')) add(el); addMedia(el); } }); } catch (e) { /* 잘못된 선택자 */ }
    });
    if (R.text) { try { Array.prototype.forEach.call(D.querySelectorAll(R.text), function (el) { el.__amText = 1; add(el); }); } catch (e) { /* 무시 */ } }
    return out;
  }
  function isBlock(el) { return !/^(IMG|VIDEO|IFRAME|PICTURE)$/.test(el.tagName) && (el.__amText || /^(text|assist|assisted)$/i.test(String(el.getAttribute('data-ai') || '').trim())) && !srcOf(el); }

  function judge(el) {
    var x = itemOf(el), src = srcOf(el), blk = isBlock(el);
    if (x && x.src === src && x.done) return;
    if (!x) { x = { el: el, type: blk ? 'block' : typeOf(el) }; ITEMS.push(x); if (BY) BY.set(el, x); }
    x.src = src; x.done = false;
    var own = ownerKind(el);
    if (own === 'none') return settle(x, '', '', 'none');
    if (blk) return settle(x, own && own !== 'none' ? own : 'assist', el.__amText && !own ? 'rule' : 'owner');
    if (own) return settle(x, own, 'owner');
    var rk = ruleKind(el);
    if (rk) return settle(x, rk, 'rule');
    if (x.type !== 'frame' && !sizeOk(el)) { x.done = true; x.state = 'skip'; x.kind = ''; detach(x); if (CHECK) checkTag(x); return; }
    var pk = pathKind(el);
    if (pk) return settle(x, pk, 'rule');
    if (!CFG.auto) return settle(x, '', '', 'off');
    var h = hintKind(el, src);
    if (h) { x.why = h.why; x.tool = h.tool || ''; return settle(x, h.k, 'name'); }
    if (!CFG.meta || !src || x.type === 'frame' || /^blob:/.test(src) || /\.svg(?:$|\?)/i.test(src)) return settle(x, '', '', 'no');
    if (x.type === 'video' && !/\.(mp4|m4v|mov|webm)(?:$|\?)/i.test(src)) return settle(x, '', '', 'no');
    x.state = 'wait'; if (CHECK) checkTag(x);
    readMeta(src, el).then(function (v) {
      if (x.src !== src) return;
      if (v && v.kind) { x.tool = v.tool || ''; x.why = v.kind === 'edit' ? 'IPTC 디지털 출처 유형: AI로 합성(compositeWithTrainedAlgorithmicMedia)' : v.basis === 'gen' ? '파일에 생성 프로그램의 설정 기록이 들어 있습니다' : '디지털 출처 유형이 생성형 AI(trainedAlgorithmicMedia)로 기록돼 있습니다'; settle(x, v.kind, v.basis); }
      else { x.why = v && v.note || ''; settle(x, '', '', v && v.state === 'cors' ? 'cors' : v && v.state === 'skip' ? 'skip' : 'no'); }
    });
  }
  function settle(x, kind, basis, state) {
    x.done = true; x.kind = kind || ''; x.basis = basis || ''; x.state = state || (kind ? 'on' : 'no');
    if (x.kind) {
      if (x.type === 'img' || x.type === 'bg') x.thumb = x.src && x.src.length < 2000 ? x.src : '';
      attach(x);
    } else if (CHECK) checkTag(x);
    else detach(x);
    changed();
  }
  var chT = 0;
  function changed() {
    if (chT) return;
    chT = setTimeout(function () { chT = 0; if (NOTICE) NOTICE.update(); if (CFG.ld) writeLd(); if (CHECK) drawPanel(); }, 300);
  }

  var IO = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { IO.unobserve(e.target); e.target.__amSeen = 1; judgeWhenReady(e.target); } });
  }, { rootMargin: '400px 0px' }) : null;
  function judgeWhenReady(el) {
    if (el.tagName === 'IMG' && !(el.complete && el.naturalWidth)) { el.addEventListener('load', function () { judge(el); }, { once: true }); return; }
    judge(el);
  }
  function scan() {
    candidates().forEach(function (el) {
      var x = itemOf(el);
      if (x && x.done && x.src === srcOf(el) && !(x.state === 'skip' && sizeOk(el))) { if (x.host && !x.host.isConnected && x.kind) attach(x); return; }
      if (x && x.state === 'skip') x.done = false;
      // 운영자 표시 · 규칙은 화면 밖이어도 바로(목록 · 검색 정보에 들어가게), 나머지는 가까워질 때
      if (ownerKind(el) || ruleKind(el) || isBlock(el) || !IO || el.__amSeen || (x && x.state === 'skip')) judgeWhenReady(el);
      else IO.observe(el);
    });
    // 사라진 것 정리
    ITEMS = ITEMS.filter(function (x) { if (!x.el.isConnected) { detach(x); return false; } return true; });
    changed();
  }

  /* ---------- 검색 · AI용 구조화 정보(schema.org digitalSourceType) ---------- */
  function writeLd() {
    var its = ITEMS.filter(function (x) { return x.kind && x.src && /^https?:/.test(x.src) && x.type !== 'block' && x.type !== 'frame'; }).slice(0, 40);
    var old = D.getElementById('aimarker-ld');
    if (!its.length) { if (old) old.remove(); return; }
    var g = its.map(function (x) {
      return { '@type': x.type === 'video' ? 'VideoObject' : 'ImageObject', contentUrl: x.src, digitalSourceType: 'https://cv.iptc.org/newscodes/digitalsourcetype/' + DST[x.kind],
        description: labelOf(x) + ' (' + t('b_' + x.basis) + ', ' + t('brand') + ')' };
    });
    var s = old || D.createElement('script');
    s.type = 'application/ld+json'; s.id = 'aimarker-ld';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': g });
    if (!old) (D.head || D.documentElement).appendChild(s);
  }

  /* ---------- 점검 모드(운영자용) ---------- */
  var CHECK = false, PANEL = null;
  function checkTag(x) { if (!CHECK || x.kind) return; if (!x.host) x.host = hostFor(x); if (!x.host.isConnected) { var a = x.type === 'block' ? x.el : anchorOf(x.el); if (a.parentNode) a.parentNode.insertBefore(x.host, a.nextSibling); } render(x); place(x); }
  function startCheck() {
    if (CHECK) return; CHECK = true;
    var host = D.createElement('div'); host.setAttribute('data-aimarker-panel', '1');
    host.style.cssText = 'all:initial;position:fixed;top:12px;right:12px;bottom:12px;width:360px;max-width:calc(100vw - 24px);z-index:2147482500';
    var r = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    r.innerHTML = '<style>:host{all:initial}*{box-sizing:border-box}.p{display:flex;flex-direction:column;height:100%;background:#fff;border-radius:18px;box-shadow:0 24px 64px rgba(8,20,47,.3),0 0 0 1px rgba(14,31,71,.1);font-family:' + FONT + ';color:#0E1F47;letter-spacing:-.01em;-webkit-font-smoothing:antialiased;overflow:hidden}' +
      '.h{padding:14px 16px 12px;background:#0E1F47;color:#fff}.h b{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:820}.h b svg{width:16px;height:18px}.h small{display:block;margin-top:4px;font-size:12px;color:#B7C3DD;line-height:1.5}' +
      '.s{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:12px 14px;border-bottom:1px solid #EEF1F6}.s div{padding:8px 6px;border-radius:10px;background:#F4F6FA;text-align:center}.s b{display:block;font-size:18px;font-weight:820}.s span{font-size:11px;color:#586179}' +
      '.l{flex:1;overflow:auto;padding:6px 8px}.i{display:flex;gap:10px;align-items:center;padding:8px;border-radius:10px;cursor:pointer}.i:hover{background:#F4F6FA}.i .th{width:44px;height:44px;border-radius:8px;background:#E2E6EE center/cover no-repeat;flex:0 0 44px}' +
      '.i b{display:block;font-size:12.5px}.i small{display:block;font-size:11.5px;color:#586179;line-height:1.4;word-break:break-all}.i .st{display:inline-flex;height:20px;align-items:center;padding:0 7px;border-radius:6px;font-size:11px;font-weight:800;margin-right:4px}' +
      '.on{background:#E8F1FF;color:#0A4FCB}.cors{background:#FFF4E5;color:#B54708}.no{background:#F1F4F9;color:#586179}.skip,.off,.none,.wait{background:#F6F8FB;color:#858C9D}' +
      '.f{padding:12px 14px;border-top:1px solid #EEF1F6;font-size:12px;color:#586179;line-height:1.6}.f a{color:#0B63F6}.f button{margin-top:8px;width:100%;height:36px;border:1px solid #D0D6E0;border-radius:10px;background:#fff;color:#0E1F47;font:720 12.5px/1 ' + FONT + ';cursor:pointer}</style>' +
      '<div class="p" role="region" aria-label="AIMarker 점검 모드"><div class="h"><b>' + fp('', true) + 'AIMarker 점검 모드</b><small>운영자용 점검 화면입니다. 주소 뒤에 ?aimarker=check 를 붙였을 때만 열리고, 보통 방문자에게는 보이지 않습니다. 이 페이지의 이미지와 영상을 무엇으로 판단했는지 보여 줍니다.</small></div>' +
      '<div class="s"><div><b data-c="on">0</b><span>표시함</span></div><div><b data-c="no">0</b><span>기록 없음</span></div><div><b data-c="cors">0</b><span>못 읽음</span></div><div><b data-c="skip">0</b><span>건너뜀</span></div></div>' +
      '<div class="l"></div><div class="f">AI로 만든 이미지인데 \'기록 없음\'이면 이미지 설명(대체 글)에 \'AI 생성\'을 적거나, 설치 코드에 위치 규칙(data-ai-gen)을 더하세요. \'못 읽음\'은 다른 서버(CDN)에 있는 파일이라 기록을 읽지 못한 것입니다. <a href="' + HOME + '/site/#rules" target="_blank" rel="noopener">규칙 만들기</a><button type="button">점검 끝내기</button></div></div>';
    (D.body || D.documentElement).appendChild(host);
    r.querySelector('button').addEventListener('click', function () { var u = new URL(location.href); u.searchParams.delete('aimarker'); location.href = u.href.replace(/#aimarker=check$/, ''); });
    PANEL = r;
    ITEMS.forEach(function (x) { if (!x.kind) checkTag(x); });
    drawPanel();
  }
  var ST = { on: '표시함', no: '기록 없음', cors: '못 읽음', skip: '건너뜀', off: '자동 꺼짐', none: 'AI 아님(운영자)', wait: '확인 중' };
  function drawPanel() {
    if (!PANEL) return;
    var n = { on: 0, no: 0, cors: 0, skip: 0 };
    ITEMS.forEach(function (x) { var k = x.kind ? 'on' : x.state; if (k === 'off' || k === 'none' || k === 'wait') k = 'skip'; if (n[k] != null) n[k]++; });
    Object.keys(n).forEach(function (k) { PANEL.querySelector('[data-c="' + k + '"]').textContent = n[k]; });
    var l = PANEL.querySelector('.l');
    ITEMS.sort(docOrder);
    l.innerHTML = ITEMS.map(function (x, i) {
      var k = x.kind ? 'on' : x.state || 'no';
      var th = x.src && x.type !== 'block' && x.type !== 'frame' && x.type !== 'video' ? '<span class="th" style="background-image:url(&quot;' + esc(x.src) + '&quot;)"></span>' : '<span class="th"></span>';
      var why = x.kind ? t('b_' + x.basis) + (x.tool ? ' · ' + x.tool : '') + (x.why ? ' · ' + x.why : '') : (x.why || fileOf(x.src) || x.el.tagName.toLowerCase());
      return '<div class="i" data-i="' + i + '">' + th + '<span><b><span class="st ' + k + '">' + (x.kind ? esc(labelOf(x)) : ST[k] || k) + '</span></b><small>' + esc(why).slice(0, 160) + '</small></span></div>';
    }).join('') || '<p style="padding:12px;font-size:12.5px;color:#586179">이미지나 영상을 찾는 중입니다.</p>';
    Array.prototype.forEach.call(l.querySelectorAll('.i'), function (d) { d.addEventListener('click', function () { reveal(ITEMS[+d.getAttribute('data-i')]); }); });
  }

  /* ---------- 시작 ---------- */
  function readCfg(me) {
    function a(k) { return me.getAttribute('data-' + k) || ''; }
    var raw = {};
    ['name', 'use', 'level', 'review', 'privacy', 'contact', 'style', 'side', 'theme', 'date', 'site'].forEach(function (k) { raw[k] = a(k); });
    var tg = a('tag'); CFG.tag = ({ tag: 1, mini: 1, bar: 1, none: 1 })[tg] ? tg : 'tag';
    var ps = a('pos'); CFG.pos = ({ tl: 1, tr: 1, bl: 1, br: 1 })[ps] ? ps : 'tl';
    CFG.light = a('tag-theme') === 'light';
    CFG.motion = !/^(0|off|none)$/i.test(a('motion'));
    CFG.z = Math.max(1, Math.min(2147480000, parseInt(a('z'), 10) || 3));
    CFG.min = Math.max(40, Math.min(600, parseInt(a('min'), 10) || 96));
    CFG.meta = a('meta') === '0' ? false : a('meta') === 'all' ? 'all' : 'same'; CFG.alt = a('alt') !== '0'; CFG.ld = a('ld') !== '0'; CFG.auto = a('auto') !== '0';
    CFG.name = clean(raw.name, 30); CFG.site = clean(raw.site, 40);
    LANG = a('lang') === 'en' ? 'en' : 'ko';
    var R = {};
    ['gen', 'edit', 'virtual', 'text'].forEach(function (k) { var v = a('ai-' + k).slice(0, 400); if (v) { try { D.querySelector(v); R[k] = v; } catch (e) { /* 잘못된 선택자는 버림 */ } } });
    var paths = a('ai-path').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    R.pathOn = paths.some(function (p) { var re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')); return re.test(location.pathname); });
    CFG.rules = R;
    return raw;
  }

  var API = W.AIMarker = W.AIMarker || {};
  API.v3 = true; API.version = VERSION;
  API.render = build;
  API.tag = function (el, kind, why) { if (!el) return; var x = itemOf(el); if (!x) { x = { el: el, type: isBlock(el) ? 'block' : typeOf(el) }; ITEMS.push(x); if (BY) BY.set(el, x); } x.src = srcOf(el); x.why = why || ''; settle(x, OWN[kind] && OWN[kind] !== 'none' ? OWN[kind] : 'gen', 'owner'); };
  API.untag = function (el) { var x = itemOf(el); if (x) { x.kind = ''; x.state = 'none'; detach(x); changed(); } };
  API.scan = function () { scan(); };
  API.items = function () { return ITEMS.filter(function (x) { return x.kind; }).map(function (x) { return { el: x.el, kind: x.kind, label: labelOf(x), basis: x.basis, tool: x.tool || '', src: x.src || '' }; }); };
  API.check = startCheck;

  var me = D.currentScript;
  if (!me) { var all = D.querySelectorAll('script[src*="aimarker.kr/m.js"],script[src*="/m.js"]'); me = all[all.length - 1]; }
  if (!me || me.__am) return;
  me.__am = 1;
  if (me.hasAttribute('data-preview')) return;   // 설치 마법사 미리보기는 render 만 씀
  var RAW = readCfg(me);
  var wantCheck = /[?&#]aimarker=check\b/.test(location.search + location.hash) || me.getAttribute('data-check') === '1';
  function boot() {
    if (!D.querySelector('[data-aimarker]')) build(RAW);
    if (CFG.tag !== 'none' || wantCheck) {
      scan();
      var mt = 0;
      if (W.MutationObserver) new MutationObserver(function (ms) {
        if (mt) return;
        for (var i = 0; i < ms.length; i++) {
          var m = ms[i], t0 = m.target;
          if (t0 && t0.nodeType === 1 && mine(t0)) continue;
          if (m.type === 'childList') {
            var ok = false, j;
            for (j = 0; !ok && j < m.addedNodes.length; j++) { var nd = m.addedNodes[j]; if (nd.nodeType === 1 && nd.tagName !== 'AM-TAG' && !(nd.hasAttribute && (nd.hasAttribute('data-aimarker') || nd.hasAttribute('data-aimarker-card') || nd.hasAttribute('data-aimarker-panel')))) ok = true; }
            for (j = 0; !ok && j < m.removedNodes.length; j++) if (m.removedNodes[j].nodeType === 1 && m.removedNodes[j].tagName !== 'AM-TAG') ok = true;
            if (!ok) continue;
          } else if (m.attributeName === 'style' && !/url\(/i.test(t0.getAttribute('style') || '') && !itemOf(t0)) continue;
          mt = setTimeout(function () { mt = 0; scan(); }, 400);
          return;
        }
      }).observe(D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'data-ai', 'style'] });
      W.addEventListener('resize', placeAll);
      W.addEventListener('load', function () { scan(); placeAll(); });
      if (D.fonts && D.fonts.ready) D.fonts.ready.then(placeAll);
      // 레이아웃이 밀린 경우(펼침 · 늦게 뜬 광고 등)를 위해 화면 가까이 있는 것만 가끔 다시 맞춤
      setInterval(function () {
        if (D.hidden) return;
        ITEMS.forEach(function (x) {
          if (!x.host || !x.host.isConnected) return;
          var r = x.el.getBoundingClientRect();
          if (r.bottom < -80 || r.top > W.innerHeight + 80) return;
          if (x.at && (Math.abs(r.width - x.at[2]) > 1 || Math.abs(r.height - x.at[3]) > 1)) x.cb = undefined;
          place(x);
        });
      }, 900);
    }
    if (wantCheck) startCheck();
  }
  if (D.body) boot(); else D.addEventListener('DOMContentLoaded', boot);
})();
