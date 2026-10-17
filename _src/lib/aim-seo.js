/* AIMarker 검색 · AI 검색 꾸러미(SEO · GEO) 1.0.0 (2026.10)
 * 마크를 받은 콘텐츠에 붙일 대체 텍스트 · 파일 속 검색 정보(IPTC) · 구조화 데이터(schema.org) · 삽입 코드 · 이미지 사이트맵 ·
 * llms.txt 항목 · 'AI 사용 안내' 쪽을 만듭니다. 서버 없이 브라우저(또는 Node)에서 만들고, 고객 콘텐츠를 어디에도 보내지 않습니다.
 * 항목 m: { id, label, basis, kind, name(파일 이름), file(꾸러미 안 이름), mime, w, h, title, tools }
 * 설정 o: { brand, rights, credit, desc, base(콘텐츠가 올라갈 주소), page(콘텐츠가 실린 쪽 주소), date } */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AIMSeo = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.0', SITE = 'https://aimarker.kr';
  var LABEL = { ai_generated: 'AI 생성', ai_edited: 'AI 편집 · 합성', ai_assisted: 'AI 보조', no_ai: 'AI 미사용' };
  var SHORT = { ai_generated: 'AI 생성', ai_edited: 'AI 편집', ai_assisted: 'AI 보조', no_ai: 'AI 미사용' };
  var BASIS = { verified: '서명 검증', record: '파일 기록', declared: '발급자 신고' };
  var DST = { ai_generated: 'trainedAlgorithmicMedia', ai_edited: 'compositeWithTrainedAlgorithmicMedia', ai_assisted: 'algorithmicallyEnhanced' };
  var SCHEMA_DST = { ai_generated: 'TrainedAlgorithmicMediaDigitalSource', ai_edited: 'CompositeWithTrainedAlgorithmicMediaDigitalSource', ai_assisted: 'AlgorithmicallyEnhancedDigitalSource' };
  var SUBJ = { image: '이 이미지는', video: '이 영상은', audio: '이 오디오는', doc: '이 문서는', text: '이 글은', other: '이 파일은' };
  var KIND_KO = { image: '이미지', video: '영상', audio: '오디오', doc: '문서', text: '글', other: '파일' };
  var TYPE = { image: 'ImageObject', video: 'VideoObject', audio: 'AudioObject', doc: 'DigitalDocument', text: 'CreativeWork', other: 'MediaObject' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function xesc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function clip(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) : s; }
  function markUrl(id) { return SITE + '/m/?id=' + encodeURIComponent(id); }
  function shortUrl(id) { return 'aimarker.kr/m/?id=' + id; }
  /* 받침에 따라 조사(은/는 · 이/가 · 을/를) */
  function josa(word, a, b) {
    var w = String(word || '').trim(), c = w.charCodeAt(w.length - 1);
    if (c >= 0xAC00 && c <= 0xD7A3) return w + ((c - 0xAC00) % 28 ? a : b);
    return w + (/[13678lmnLMN]$/.test(w) ? a : b);
  }
  function sentence(label, kind) {
    var s = SUBJ[kind] || SUBJ.other;
    return { ai_generated: s + ' AI로 만들었습니다.', ai_edited: s + ' AI로 편집하거나 합성한 부분이 있습니다.', ai_assisted: s + ' AI의 도움을 받아 만들었습니다.', no_ai: s + ' AI를 사용하지 않고 만들었습니다.' }[label] || '';
  }
  /* 문서 · 글 끝에 붙일 표시 문장(마크 번호 · 근거 · 확인 주소) */
  function notice(m) { return sentence(m.label, m.kind) + ' AIMarker 마크 ' + m.id + ' · 근거 ' + (BASIS[m.basis] || '') + ' · 확인 ' + shortUrl(m.id); }
  function words(name) {
    var w = String(name || '').replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_\-.+]+/g, ' ').replace(/\s+/g, ' ').trim();
    return /^(?:img|dsc|dscn|image|photo|pxl|screenshot|스크린샷|kakaotalk|카카오톡|untitled|제목 없음)?\s?[\d\s]*$/i.test(w) ? '' : w;
  }
  function tag(m) { return m.label && m.label !== 'no_ai' ? SHORT[m.label] + ' ' + (KIND_KO[m.kind] || '파일') : ''; }
  /* 대체 텍스트: 설명(없으면 파일 이름) + (AI 생성 이미지) */
  function alt(m, o) {
    o = o || {};
    var base = clip(m.desc || o.desc || words(m.name) || m.title || '', 110), t = tag(m);
    if (!base) return t || (KIND_KO[m.kind] || '');
    return t ? base + ' (' + t + ')' : base;
  }
  function credit(m, o) { o = o || {}; if (o.credit) return clip(o.credit, 120); var b = clip(o.brand || '', 60); var l = m.label && m.label !== 'no_ai' ? LABEL[m.label] : ''; return b && l ? b + ' · ' + l : b || l; }
  function url(m, o) { var b = o && o.base ? String(o.base).trim() : ''; if (!b) return ''; if (!/\/$/.test(b)) b += '/'; return b + encodeURI(m.file || m.name || ''); }
  /* 파일 속 검색 정보(XMP · IPTC): aim-extract buildXmp 에 그대로 넘김 */
  function xmpFields(m, o) {
    o = o || {};
    return { dst: DST[m.label] || '', aiSystem: (m.tools || []).join(', ').slice(0, 120), title: clip(m.title || words(m.name), 120), desc: sentence(m.label, m.kind) + ' AIMarker 마크 ' + m.id, alt: alt(m, o),
      creator: clip(o.brand || '', 80), credit: credit(m, o), rights: clip(o.rights || '', 160) };
  }
  /* 구조화 데이터(JSON-LD): 콘텐츠 하나 */
  function ld(m, o) {
    o = o || {};
    var x = { '@context': 'https://schema.org', '@type': TYPE[m.kind] || 'MediaObject', name: clip(m.title || words(m.name) || m.name || m.id, 120) };
    var u = url(m, o); if (u) x.contentUrl = u;
    if (m.kind === 'image') { x.caption = alt(m, o); if (m.w && m.h) { x.width = m.w; x.height = m.h; } }
    x.description = sentence(m.label, m.kind);
    if (m.mime) x.encodingFormat = m.mime;
    if (o.brand) x.creator = { '@type': 'Organization', name: clip(o.brand, 80) };
    var cr = credit(m, o); if (cr) x.creditText = cr;
    if (o.rights) x.copyrightNotice = clip(o.rights, 160);
    if (SCHEMA_DST[m.label]) x.digitalSourceType = 'https://schema.org/' + SCHEMA_DST[m.label];
    x.identifier = { '@type': 'PropertyValue', propertyID: 'AIMarker', value: m.id, url: markUrl(m.id) };
    return x;
  }
  function jsonld(items, o) { return items.filter(function (m) { return m && m.id; }).map(function (m) { return ld(m, o); }); }
  /* 웹사이트 삽입 코드 */
  function figure(m, o) {
    o = o || {};
    var src = url(m, o) || (m.file || m.name || ''), cap = (m.label ? esc(LABEL[m.label]) + ' · ' : '') + '<a href="' + markUrl(m.id) + '" target="_blank" rel="noopener">AIMarker 표시 확인</a>';
    var ldTag = '\n  <script type="application/ld+json">' + JSON.stringify(ld(m, o)).replace(/</g, '\\u003c') + '</script>';
    if (m.kind === 'image') return '<figure class="aimarker-figure" data-aimarker="' + esc(m.id) + '">\n  <img src="' + esc(src) + '" alt="' + esc(alt(m, o)) + '"' + (m.w && m.h ? ' width="' + m.w + '" height="' + m.h + '"' : '') + ' loading="lazy" decoding="async">\n  <figcaption>' + cap + '</figcaption>' + ldTag + '\n</figure>';
    if (m.kind === 'video') return '<figure class="aimarker-figure" data-aimarker="' + esc(m.id) + '">\n  <video src="' + esc(src) + '" controls preload="metadata"></video>\n  <figcaption>' + cap + '</figcaption>' + ldTag + '\n</figure>';
    if (m.kind === 'audio') return '<figure class="aimarker-figure" data-aimarker="' + esc(m.id) + '">\n  <audio src="' + esc(src) + '" controls preload="metadata"></audio>\n  <figcaption>' + cap + '</figcaption>' + ldTag + '\n</figure>';
    return '<p class="aimarker-file" data-aimarker="' + esc(m.id) + '"><a href="' + esc(src) + '">' + esc(m.title || m.name || m.id) + '</a> · ' + cap + '</p>' + ldTag;
  }
  function snippets(items, o) {
    var list = items.filter(function (m) { return m && m.id; });
    return '<!-- AIMarker 삽입 코드: 콘텐츠마다 화면 표시 · 대체 텍스트 · 구조화 데이터가 들어 있습니다.\n     ' + (o && o.base ? '주소는 ' + esc(o.base) + ' 기준입니다.' : 'src 의 파일 이름을 실제로 올린 주소로 바꿔 쓰세요.') + ' -->\n\n' +
      list.map(function (m) { return '<!-- ' + esc(m.name) + ' · ' + esc(LABEL[m.label] || '') + ' · ' + esc(m.id) + ' -->\n' + figure(m, o); }).join('\n\n') + '\n';
  }
  /* 이미지 사이트맵(이미지가 실린 쪽 주소 아래에 이미지 주소) */
  function sitemap(items, o) {
    o = o || {};
    var imgs = items.filter(function (m) { return m && m.id && m.kind === 'image'; }), page = String(o.page || o.base || 'https://example.com/').trim();
    var locs = imgs.map(function (m) { return '    <image:image><image:loc>' + xesc(url(m, o) || ('https://example.com/' + encodeURI(m.file || m.name))) + '</image:loc></image:image>'; });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<!-- AIMarker 이미지 사이트맵: <loc> 는 이미지가 실린 쪽 주소로 바꾸고, 쪽이 여러 개면 <url> 을 나눠 쓰세요. -->\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n  <url>\n    <loc>' + xesc(page) + '</loc>\n' + locs.join('\n') + (locs.length ? '\n' : '') + '  </url>\n</urlset>\n';
  }
  /* llms.txt 에 덧붙일 항목(AI 검색 · 답변 엔진이 출처와 AI 사용 표시를 읽을 수 있게) */
  function llms(items, o) {
    o = o || {};
    var list = items.filter(function (m) { return m && m.id; }), who = clip(o.brand || '', 60);
    return '## AI 사용 표시\n\n' + (who ? josa(who, '은', '는') + ' ' : '') + '콘텐츠를 만들 때 AI를 사용했다면 표시합니다. 아래 콘텐츠는 AIMarker로 AI 사용 여부를 확인하고 표시했습니다. 표시 내용 · 근거 · 이력은 각 확인 주소에서 볼 수 있습니다.\n\n' +
      list.map(function (m) { var u = url(m, o); return '- ' + (u ? '[' + (m.title || m.name) + '](' + u + ')' : (m.title || m.name)) + ': ' + (LABEL[m.label] || '') + ' · 근거 ' + (BASIS[m.basis] || '') + ' · AIMarker 마크 ' + m.id + ' (' + markUrl(m.id) + ')'; }).join('\n') + '\n';
  }
  /* 'AI 사용 안내' 쪽(그대로 올려 쓰는 HTML 한 장) */
  function noticePage(items, o) {
    o = o || {};
    var list = items.filter(function (m) { return m && m.id; }), who = clip(o.brand || '', 60) || '저희', day = o.date || new Date().toISOString().slice(0, 10);
    var ai = list.filter(function (m) { return m.label !== 'no_ai'; }).length;
    var rows = list.map(function (m) { var u = url(m, o); return '<tr><td>' + (u ? '<a href="' + esc(u) + '">' + esc(m.title || m.name) + '</a>' : esc(m.title || m.name)) + '</td><td>' + esc(KIND_KO[m.kind] || '') + '</td><td><b>' + esc(LABEL[m.label] || '') + '</b></td><td>' + esc(BASIS[m.basis] || '') + '</td><td><a href="' + markUrl(m.id) + '" target="_blank" rel="noopener">' + esc(m.id) + '</a></td></tr>'; }).join('\n');
    var page = { '@context': 'https://schema.org', '@type': 'WebPage', name: who + ' AI 사용 안내', inLanguage: 'ko', dateModified: day, hasPart: jsonld(list, o).map(function (x) { delete x['@context']; return x; }) };
    return '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(who) + ' AI 사용 안내</title>\n<meta name="description" content="' + esc(who) + ' 콘텐츠의 AI 사용 여부와 표시 근거를 안내합니다.">\n' +
      '<script type="application/ld+json">' + JSON.stringify(page).replace(/</g, '\\u003c') + '</script>\n' +
      '<style>body{margin:0;font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#0B1324;line-height:1.7;background:#fff}main{max-width:880px;margin:0 auto;padding:48px 20px 64px}h1{font-size:30px;margin:0 0 12px;letter-spacing:-.03em}p{color:#3A4559}table{width:100%;border-collapse:collapse;margin:24px 0;font-size:14.5px}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #E4E9F2;vertical-align:top}th{color:#5B687D;font-weight:700;font-size:13px}a{color:#1F55F5}small{color:#8794A7}@media(max-width:640px){th:nth-child(2),td:nth-child(2),th:nth-child(4),td:nth-child(4){display:none}}</style>\n</head><body><main>\n' +
      '<h1>AI 사용 안내</h1>\n<p>' + esc(josa(who, '은', '는')) + ' 콘텐츠를 만들 때 AI를 사용했다면 그 사실과 범위를 표시합니다. 아래는 AIMarker로 확인하고 표시한 콘텐츠 ' + list.length + '건' + (ai ? '(이 가운데 AI 사용 ' + ai + '건)' : '') + '입니다. 확인 주소에서 표시 내용, 근거, 발급 · 변경 이력을 볼 수 있습니다.</p>\n' +
      '<table><thead><tr><th>콘텐츠</th><th>종류</th><th>표시</th><th>근거</th><th>확인</th></tr></thead><tbody>\n' + rows + '\n</tbody></table>\n' +
      '<p><small>근거 등급: 서명 검증(파일 안 출처 기록의 전자서명을 확인) · 파일 기록(파일 안에 남은 생성 · 편집 기록) · 발급자 신고(발급자가 밝힌 내용). AIMarker 마크는 표시와 근거를 기록한 것이며 법률 자문이나 적법성 보증이 아닙니다. 마지막 수정 ' + esc(day) + '.</small></p>\n</main></body></html>\n';
  }
  /* 꾸러미 안내 */
  function readme(o) {
    o = o || {};
    var c = o.counts || {}, lines = [
      'AIMarker 자동 마킹 꾸러미 · ' + (o.date || new Date().toISOString().slice(0, 10)),
      '',
      '이 꾸러미는 이 브라우저에서 만들었습니다. 원본 파일은 AIMarker 서버로 보내지 않았고, 서버에는 마크 번호 · 해시 · 판정 근거만 남습니다.',
      '',
      '[표시본] 마크를 넣은 파일입니다. 원래 파일 대신 이 파일을 올리세요.',
      '  - 이미지(JPG · PNG · WebP): 보이는 마크(설정한 경우)와 파일 속 IPTC · XMP 정보(디지털 소스 유형, 대체 텍스트, 만든 이, 저작권, AIMarker 마크 번호 · 서명)',
      '  - Word · PowerPoint · Excel · ODF 문서: 문서 속성(AIMarker Mark 등)과, Word · PowerPoint 는 표시 문장(설정한 경우)',
      '  - 표시본은 마크에 등록되어, 이 파일을 다시 확인하면 같은 마크로 이어집니다.',
      '[기록 파일] 파일 안에 넣지 못하는 형식(PDF · 영상 · 오디오 · GIF 등)은 같은 이름의 .xmp 기록 파일과 마크 카드(PNG)를 드립니다. 파일과 함께 보관 · 게시하세요.',
      '[검색 · AI 검색] 웹사이트에 붙여 쓰는 자료입니다.',
      '  - 삽입 코드.html: 콘텐츠마다 화면 표시 · 대체 텍스트 · 구조화 데이터(schema.org digitalSourceType)',
      '  - 구조화 데이터.json: 같은 정보를 JSON-LD 로',
      '  - 이미지 사이트맵.xml: 검색 엔진에 이미지를 알리는 사이트맵 조각',
      '  - llms 항목.md: llms.txt 에 덧붙이면 AI 검색 · 답변 엔진이 AI 사용 표시와 확인 주소를 읽을 수 있습니다',
      '  - AI 사용 안내.html: 그대로 올려 쓰는 안내 쪽(콘텐츠 목록 · 표시 · 근거 · 확인 주소)',
      (o.ad ? '[광고 표시] 광고 · 가상인물 표시 문구와 붙일 자리입니다.' : ''),
      '[마크 목록 · 관리 키.csv] 마크 번호 · 표시 · 근거 · 관리 키 · 확인 주소입니다. 관리 키는 표시를 바꾸거나 철회할 때 필요하고 다시 발급되지 않으니 안전하게 보관하세요.',
      '',
      '이번 꾸러미: 표시본 ' + (c.embedded || 0) + '개 · 기록 파일 ' + (c.sidecar || 0) + '개 · 마크 ' + (c.marks || 0) + '개',
      '',
      '검색 엔진 · AI 검색이 이 정보를 언제 어떻게 보여 줄지는 각 서비스가 정합니다. AIMarker 마크는 표시와 근거를 기록한 것이며 법률 자문이나 적법성 보증이 아닙니다.',
      '마크 확인: https://aimarker.kr/m/ · 문의: contact@skkc.co.kr'
    ];
    return lines.filter(function (l, i) { return l !== '' || lines[i - 1] !== ''; }).join('\r\n') + '\r\n';
  }
  /* 광고 표시 문구(서버 am.label 이 준 문구를 그대로 씀) */
  function adText(labels, o) {
    o = o || {};
    var out = ['광고 · 가상인물 표시 문구', ''];
    (labels || []).forEach(function (l) { if (!l) return; out.push('[' + l.text + '] ' + l.long); if (l.where) out.push('  붙일 자리: ' + l.where); out.push(''); });
    out.push('이미지 · 영상 위에는 보이는 마크 옆에 같은 표시를 넣었습니다(설정한 경우). 글 · 게시물에는 위 문장을 첫머리에 붙이세요.');
    out.push('표시 문구는 법률 자문이 아니며, 플랫폼 · 업종별 기준을 함께 확인하세요.');
    return out.join('\r\n') + '\r\n';
  }
  function csv(rows) {
    var q = function (s) { s = String(s == null ? '' : s); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\r\n') + '\r\n';
  }
  return { VERSION: VERSION, LABEL: LABEL, SHORT: SHORT, BASIS: BASIS, DST: DST, SCHEMA_DST: SCHEMA_DST, KIND_KO: KIND_KO, josa: josa, sentence: sentence, notice: notice, alt: alt, credit: credit, url: url,
    xmpFields: xmpFields, ld: ld, jsonld: jsonld, figure: figure, snippets: snippets, sitemap: sitemap, llms: llms, noticePage: noticePage, readme: readme, adText: adText, csv: csv, markUrl: markUrl, words: words };
});
