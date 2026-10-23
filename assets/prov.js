/* AIMarker 이미지 출처 판별 · 표시 넣기(작업 공간용). 파일은 서버로 보내지 않고 이 브라우저 안에서만 읽습니다.
 * 근거: C2PA(JUMBF) · IPTC DigitalSourceType(XMP) · 생성 도구 기록(EXIF · XMP · PNG 설명) · 파일 이름 · AI 생성물에 흔한 크기 · 카메라 원본 기록
 * 판정(보수적): confirmed(파일 속 AI 기록) · likely(이름 단서) · check(크기 단서 · 편집 도구) · camera(카메라 원본) · unknown(기록이 지워짐 · 확인 불가) */
(function () {
  'use strict';
  var P = window.AMProv = {};
  var FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  var SPARK = 'M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z';
  var FP = 'M37.71 99.99C37.6 99.96 36.62 99.9 36.01 99.87C34.52 99.82 33.88 99.76 32.93 99.61C27.82 98.77 22.85 96.67 18.84 93.67C17.85 92.93 17.13 92.34 16.28 91.55C14.69 90.08 13.47 88.65 11.87 86.35C10.77 84.77 10.41 84.27 10.19 83.97C9.63 83.21 9.46 82.82 9.41 82.15C9.34 81.28 9.59 80.54 10.2 79.84C10.44 79.56 10.97 79.21 11.4 79.05C12.14 78.77 13.11 78.84 13.82 79.24C14.48 79.6 14.68 79.84 16.19 81.98C16.29 82.11 16.5 82.42 16.68 82.67C18 84.55 18.69 85.39 19.83 86.52C23.58 90.23 28.62 92.73 34.11 93.61C34.67 93.7 35 93.73 36.24 93.78C38.35 93.87 38.85 93.96 39.5 94.36C41.11 95.35 41.43 97.56 40.18 98.97C39.67 99.53 38.99 99.88 38.23 99.97C38.01 100 37.79 100 37.71 99.99ZM46.12 99.88C44.53 99.74 43.33 98.44 43.33 96.84C43.33 95.68 43.96 94.65 44.99 94.13C45.37 93.93 45.73 93.84 46.33 93.79C47.29 93.7 49.34 93.17 51.19 92.53C57.04 90.5 61.64 87.03 65.33 81.86C67.28 79.13 69.05 75.83 70.64 71.96C71.06 70.94 71.17 70.75 71.57 70.36C71.85 70.09 72.04 69.95 72.36 69.8C73.17 69.42 74.09 69.42 74.89 69.79C75.98 70.31 76.63 71.41 76.58 72.62C76.56 73.03 76.48 73.31 76.19 74.04C75.47 75.83 74.78 77.35 73.95 79.02C73.47 79.97 73.31 80.29 72.89 81.04C70.4 85.57 67.36 89.37 63.98 92.19C63.84 92.31 63.69 92.43 63.66 92.46C63.42 92.66 62.76 93.17 62.41 93.43C60.76 94.65 59.14 95.64 57.27 96.56C56.75 96.82 56.61 96.89 56.11 97.12C55.4 97.44 54.2 97.92 53.43 98.19C50.54 99.2 47.99 99.83 46.54 99.88C46.37 99.89 46.19 99.89 46.12 99.88ZM39.37 91.76C33.47 91.49 28.24 89.59 23.62 86.04C22.04 84.82 20.33 83.19 18.95 81.58C16.12 78.25 13.78 74.23 12.01 69.62C10.93 66.82 9.79 62.82 9.38 60.41C9.22 59.52 9.19 59.2 9.19 58.62C9.19 58.1 9.19 58.06 9.26 57.82C9.41 57.28 9.66 56.84 10.04 56.47C10.41 56.11 10.82 55.88 11.35 55.73C11.57 55.67 11.63 55.66 12.04 55.66C12.52 55.66 12.67 55.69 13.05 55.83C13.62 56.03 14.12 56.44 14.46 56.96C14.75 57.4 14.88 57.8 14.94 58.48C15.03 59.45 15.29 60.66 15.78 62.46C16.34 64.52 16.9 66.22 17.58 67.93C18.9 71.27 20.72 74.46 22.69 76.9C22.86 77.11 23.03 77.31 23.06 77.35C23.09 77.4 23.31 77.65 23.54 77.91C27.56 82.51 32.58 85.19 38.22 85.76C39.19 85.85 39.58 85.87 40.69 85.87C43.41 85.87 45.87 85.5 48.04 84.76C52.14 83.36 55.87 80.66 58.43 77.24C58.87 76.64 59.12 76.27 59.52 75.65C60.2 74.55 60.94 73.09 61.44 71.82C62.86 68.24 63.62 64.31 63.81 59.5C63.84 58.7 63.84 56.27 63.81 55.37C63.66 51.06 63.12 47.05 62.22 43.38C60.6 36.83 58.18 31.98 54.78 28.49C52.17 25.81 48.78 24.15 45.19 23.8C42.14 23.49 39.27 23.96 36.5 25.22C32.49 27.03 28.89 30.52 26.27 35.11C24.16 38.84 22.8 43.2 22.34 47.76C22.2 49.13 22.19 49.47 22.19 51.23C22.19 52.91 22.2 53.18 22.3 54.38C22.82 60.27 24.88 65.97 27.97 70.07C29.19 71.68 30.66 73.17 32.05 74.21C34.27 75.88 36.83 76.94 39.41 77.25C40.43 77.38 41.68 77.4 42.61 77.3C47.32 76.8 51.28 74.14 53.71 69.86C55.66 66.41 56.41 62.08 55.88 57.31C55.38 52.89 53.68 48.52 51.22 45.38C50.61 44.59 49.58 43.51 49.02 43.07C47.85 42.14 46.57 41.58 45.21 41.39C44.84 41.34 44.04 41.34 43.72 41.38C41.71 41.67 40.25 42.88 39.36 44.98C38.39 47.26 38.23 50.28 38.91 53.47C39.05 54.1 39.35 55.2 39.51 55.64C39.81 56.46 39.89 56.69 40.07 57.09C40.68 58.49 41.43 59.43 41.94 59.43L42.05 59.43L42.04 59.05C42.02 58.58 41.95 58.23 41.67 57.09C41.56 56.61 41.45 56.13 41.43 56.02C41.35 55.43 41.52 54.72 41.88 54.22C42.01 54.04 42.39 53.66 42.55 53.56C43.64 52.85 45.03 53.02 45.89 53.98C46.28 54.42 46.34 54.57 46.66 55.78C46.99 56.99 47.09 57.46 47.19 58.15C47.27 58.69 47.28 59.81 47.21 60.26C47.04 61.33 46.66 62.24 46.1 62.95C45.71 63.44 45.17 63.86 44.55 64.15C43.38 64.71 41.89 64.86 40.58 64.55C38.78 64.11 37.24 62.84 36.06 60.78C34.8 58.59 33.72 54.98 33.42 51.91C33.32 50.97 33.31 50.78 33.31 49.57C33.31 48.31 33.32 48.05 33.43 47.17C33.74 44.55 34.6 42.18 35.91 40.36C36.56 39.46 37.46 38.55 38.33 37.92C42.22 35.13 47.63 35.38 51.95 38.55C53.89 39.98 55.97 42.45 57.52 45.17C60.75 50.85 62.13 57.91 61.26 64.34C60.71 68.41 59.29 72 56.99 75.08C53.5 79.76 48.34 82.6 42.57 83.02C42.01 83.07 40.36 83.07 39.81 83.03C36.26 82.76 32.93 81.63 29.9 79.66C27.54 78.12 25.29 75.95 23.36 73.34C20.3 69.2 18.11 63.81 17.15 58.04C16.76 55.74 16.59 53.65 16.59 51.25C16.59 49.12 16.71 47.39 17.01 45.35C18.13 37.57 21.48 30.53 26.47 25.45C31.3 20.53 37.14 17.94 43.41 17.94C47.19 17.94 50.58 18.8 53.76 20.55C56.4 22.01 58.77 24.07 60.82 26.74C63.83 30.62 66.04 35.5 67.57 41.65C68.51 45.42 69.07 49.21 69.35 53.71C69.49 55.96 69.5 59.06 69.37 61.23C68.95 68.57 67.13 74.67 63.89 79.56C61.28 83.51 57.65 86.71 53.34 88.9C49.99 90.59 46.67 91.46 42.55 91.73C41.81 91.77 40.05 91.79 39.37 91.76ZM7.61 77.15C7.21 77.09 6.75 76.92 6.42 76.71C6.23 76.59 5.89 76.28 5.73 76.09C5.29 75.55 4.5 74.03 3.83 72.43C2.24 68.63 0.92 63.17 0.34 57.93C-0.06 54.29-0.11 50.33 0.19 46.63C0.77 39.55 2.62 32.71 5.6 26.55C5.76 26.2 5.94 25.84 5.99 25.75C6.04 25.66 6.18 25.38 6.31 25.13C8.05 21.75 10.35 18.33 12.76 15.52C14.43 13.57 16.34 11.66 18.19 10.08C19.2 9.22 19.5 8.99 19.82 8.81C20.78 8.29 21.99 8.33 22.88 8.9C24.47 9.91 24.8 12.04 23.6 13.46C23.45 13.65 23.19 13.88 22.79 14.19C22.59 14.36 21.85 14.98 21.69 15.12C21.64 15.16 21.48 15.31 21.32 15.45C21.17 15.58 20.91 15.82 20.74 15.97C20.42 16.26 18.85 17.83 18.54 18.17C12.09 25.09 7.88 34.16 6.46 44.18C5.93 47.95 5.82 52.01 6.13 55.83C6.66 62.19 8.41 68.85 10.49 72.41C10.83 73.01 10.94 73.3 11.01 73.79C11.23 75.32 10.19 76.8 8.68 77.12C8.35 77.18 7.91 77.2 7.61 77.15ZM41.27 73.82C39.46 73.7 37.7 73.23 36.19 72.46C33.09 70.88 30.46 67.99 28.37 63.88C25.82 58.85 24.67 52.77 25.17 46.94C25.54 42.58 26.85 38.61 29.02 35.31C29.3 34.9 29.36 34.8 29.76 34.28C31.31 32.21 33.3 30.44 35.46 29.19C37.63 27.94 39.92 27.21 42.44 26.97C42.99 26.92 44.4 26.91 44.97 26.96C47.82 27.19 50.46 28.08 52.71 29.56C54.33 30.63 55.73 31.99 56.83 33.56C57.25 34.16 57.43 34.68 57.43 35.29C57.43 35.89 57.29 36.36 56.97 36.84C56.73 37.2 56.54 37.38 56.16 37.64C55.4 38.14 54.33 38.21 53.51 37.81C53.01 37.57 52.68 37.28 52.31 36.76C51.64 35.82 50.82 35 49.91 34.37C48.52 33.4 46.84 32.78 44.98 32.55C44.55 32.49 43.09 32.48 42.66 32.53C39.68 32.88 36.98 34.35 34.79 36.81C31.38 40.64 29.86 46.55 30.64 52.97C31.06 56.43 32.2 59.83 33.88 62.64C34.64 63.93 35.36 64.86 36.27 65.78C37.99 67.48 39.56 68.21 41.79 68.35C42.87 68.41 43.95 68.22 44.76 67.81C46.58 66.9 47.83 64.79 48.25 61.92C48.44 60.61 48.44 59.11 48.24 57.7C48.04 56.33 47.71 55.16 47.13 53.8C46.44 52.19 45.83 51.12 45.34 50.65C44.75 50.09 44.54 49.79 44.39 49.25C43.98 47.83 44.87 46.34 46.33 46.02C46.6 45.96 47.06 45.95 47.31 45.99C48.02 46.12 48.65 46.55 49.37 47.36C50.29 48.41 51.18 50 52.14 52.27C53.43 55.33 53.95 58.84 53.61 62.16C53.3 65.16 52.3 67.84 50.74 69.81C50.49 70.12 50.44 70.17 50.06 70.59C49.65 71.04 48.86 71.71 48.29 72.09C46.32 73.4 43.92 73.99 41.27 73.82ZM80.75 67.89C80.05 67.81 79.47 67.53 78.96 67.02C78.63 66.69 78.41 66.34 78.26 65.9C78.13 65.51 78.1 65.31 78.1 64.86C78.1 64.26 78.17 63.76 78.45 62.46C78.78 60.85 79.02 57.85 78.98 55.63C78.92 51.83 78.42 46.96 77.66 42.84C76.43 36.21 74.56 30.39 71.98 25.22C69.31 19.87 66.11 15.69 62.23 12.48C59.5 10.23 56.31 8.49 52.98 7.44C50.76 6.74 48.98 6.42 46.12 6.23C45.5 6.19 43.05 6.19 42.42 6.23C39.46 6.43 37.44 6.88 35.84 7.69C35.59 7.82 35.3 7.96 35.2 8C34.08 8.4 32.84 8.13 31.99 7.29C31.59 6.9 31.25 6.28 31.13 5.7C31.07 5.44 31.07 4.81 31.12 4.57C31.3 3.74 31.71 3.07 32.34 2.62C32.83 2.27 33.93 1.74 34.9 1.39C36.7 0.75 38.98 0.29 41.33 0.12C42.44 0.03 42.91 0.01 44.25 0.01C47.49 0.01 50.21 0.32 52.83 0.97C57.94 2.25 62.58 4.67 66.65 8.17C68.81 10.03 70.97 12.37 72.72 14.76C72.91 15.03 73.1 15.28 73.14 15.33C73.37 15.64 74.23 16.93 74.73 17.71C79.54 25.37 82.88 35.51 84.29 46.77C84.58 49.15 84.78 51.41 84.9 53.88C85.03 56.69 84.93 59.16 84.58 62.02C84.48 62.78 84.45 62.99 84.27 63.86C84.18 64.33 84.1 64.79 84.08 64.96C84.01 65.86 83.74 66.48 83.2 67.03C82.71 67.52 82.07 67.82 81.37 67.89C81.1 67.92 81.03 67.92 80.75 67.89ZM73.11 66.38C72.63 66.29 72.36 66.2 72.01 65.99C71.34 65.6 70.8 64.87 70.64 64.11C70.58 63.83 70.56 63.27 70.58 62.79C70.6 62.33 70.63 62.1 70.77 61.15C70.93 60.02 71 58.6 71 55.94C71 53.89 70.98 53.45 70.89 52.07C70.72 49.46 70.33 46.56 69.89 44.64C69.54 43.1 69.45 42.55 69.45 41.87C69.45 41.4 69.46 41.35 69.52 41.12C69.6 40.81 69.82 40.37 69.99 40.14C70.39 39.62 70.97 39.23 71.59 39.06C71.81 39 71.88 38.99 72.31 38.99C72.76 38.99 72.81 38.99 73.05 39.06C74.23 39.39 75.05 40.37 75.19 41.6C75.23 42.01 75.31 42.41 75.51 43.3C75.84 44.82 76.03 45.95 76.29 47.95C76.78 51.74 76.91 55.65 76.7 59.98C76.65 60.99 76.64 61.09 76.44 62.47C76.42 62.61 76.39 63 76.38 63.33C76.36 63.97 76.33 64.17 76.2 64.49C75.85 65.41 75.12 66.06 74.18 66.31C73.98 66.36 73.86 66.38 73.56 66.38C73.35 66.39 73.15 66.39 73.11 66.38ZM11.44 48.19C10.24 47.96 9.32 47.04 9.11 45.85C8.93 44.81 9.46 41.73 10.47 38.08C11.32 34.96 12.38 32.2 13.78 29.4C15.91 25.13 18.51 21.47 21.66 18.31C27.31 12.62 34.19 9.32 41.51 8.78C46.65 8.41 51.41 9.3 55.64 11.43C57.26 12.25 58.66 13.13 60.14 14.29C63.51 16.9 66.53 20.4 68.97 24.53C69.78 25.91 70.18 26.71 71.15 28.97C71.82 30.52 72 30.92 72.38 31.69C72.82 32.58 72.91 32.89 72.88 33.54C72.86 33.95 72.78 34.28 72.61 34.63C72.43 34.99 72.31 35.15 72.04 35.43C71.53 35.95 70.87 36.25 70.13 36.28C69.58 36.31 69.2 36.23 68.69 35.98C68.22 35.76 67.77 35.35 67.5 34.9C67.18 34.38 66.54 33.02 65.75 31.21C64.97 29.39 64.62 28.69 63.93 27.55C60.97 22.59 56.99 18.71 52.83 16.7C52.04 16.32 51.47 16.08 50.72 15.82C47.45 14.66 43.59 14.38 39.8 15C36.29 15.59 32.97 16.97 29.79 19.16C27.43 20.79 25.04 23.07 23.05 25.61C20.22 29.2 17.9 33.63 16.5 38.1C15.63 40.88 14.99 43.67 14.84 45.4C14.8 45.85 14.78 45.96 14.7 46.22C14.42 47.13 13.62 47.89 12.68 48.14C12.37 48.22 11.74 48.25 11.44 48.19Z';
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
    rr(ctx, x, y, w, h, rad); ctx.fillStyle = dark ? 'rgba(14, 31, 71,.78)' : 'rgba(255,255,255,.92)'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.save(); rr(ctx, x + padX - icon * 0.08, y + (h - icon * 1.16) / 2, icon * 1.16, icon * 1.16, icon * 0.3); ctx.fillStyle = dark ? '#FFFFFF' : '#EEF4FF'; ctx.fill();
    var fh = icon * 0.78, fw = fh * 0.8497; ctx.translate(x + padX - icon * 0.08 + (icon * 1.16 - fw) / 2, y + (h - fh) / 2); ctx.scale(fw / 84.97, fh / 100);
    var gg = ctx.createLinearGradient(0, 100, 84.97, 0); gg.addColorStop(0, '#0030C4'); gg.addColorStop(0.45, '#0858F0'); gg.addColorStop(0.8, '#0E8BFB'); gg.addColorStop(1, '#33C8FF'); ctx.fillStyle = gg; ctx.fill(new Path2D(FP)); ctx.restore();   // 10.0 AI 마크
    ctx.fillStyle = dark ? '#FFFFFF' : '#0E1F47'; ctx.textBaseline = 'middle'; ctx.font = '800 ' + f + 'px ' + FONT; ctx.fillText(text, x + padX + icon + gap, y + h / 2 + f * 0.04);
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
