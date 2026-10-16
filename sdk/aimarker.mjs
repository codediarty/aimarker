/*
 * AIMarker SDK for JavaScript 1.0.0 · https://aimarker.kr/developers/#sdk
 * Node.js 20+ · Deno · Bun · Cloudflare Workers 처럼 fetch 와 Web Crypto 가 있는 서버 환경에서 쓰세요.
 * API 키를 브라우저 코드에 넣지 마세요. 의존성 없음 · MIT
 *
 * 핵심: 파일 · 글의 AI 사용 여부를 근거로 확인하고, 근거에 맞는 서명된 마크를 발급 · 확인합니다.
 * 파일은 이 환경에서 읽고(출처 판독기 aim-extract 내장), 서버에는 특징값 · 해시 · 서명 검증용 출처 기록 조각만 보냅니다.
 *
 *   import { AIMarker } from './aimarker.mjs';
 *   import { readFile } from 'node:fs/promises';
 *   const am = new AIMarker({ key: process.env.AIMARKER_KEY });
 *   const bytes = await readFile('cover.jpg');
 *   const a = await am.analyzeFile(bytes, { name: 'cover.jpg' });          // a.verdict.ai: used | not_used | unknown
 *   const m = await am.mark({ bytes, name: 'cover.jpg' }, { label: 'auto' }); // 근거가 없으면 DECLARE 오류: 사용자에게 물어 label 을 정하세요
 *   const marked = AIMarker.embedMark(bytes, m);                              // 마크 번호 · 서명을 넣은 표시본(JPEG · PNG)
 *   await am.markEdit(m.id, m.key, { alt: [await AIMarker.sha256(marked)] });   // 표시본 등록
 *   const v = await AIMarker.verifyMark(m.cred);                              // 공개키로 서명 확인(서버에 묻지 않음)
 *
 * 마크는 표시와 근거를 기록하고 서명한 것이며 법적 인증이 아닙니다. 광고 검수(부가 기능)는 위험 후보와 근거이며 법률 자문이 아닙니다.
 */
const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec';
const KEYS_URL = 'https://aimarker.kr/.well-known/aimarker-keys.json';
export const LABELS = ['ai_generated', 'ai_edited', 'ai_assisted', 'no_ai'];
export const LABEL_KO = { ai_generated: 'AI 생성', ai_edited: 'AI 편집 · 합성', ai_assisted: 'AI 보조', no_ai: 'AI 미사용' };
export const BASIS_KO = { verified: '서명 검증', record: '파일 기록', declared: '발급자 신고', none: '근거 없음' };

/* 출처 판독기 aim-extract(내장) */
export const AIMExtract = (() => {
  const module = { exports: {} }, exports = module.exports;   // eslint-disable-line no-unused-vars
  const require = (n) => { const p = globalThis.process; if (p && typeof p.getBuiltinModule === 'function') return p.getBuiltinModule(n); throw new Error('require ' + n); };   // eslint-disable-line no-unused-vars
/* AIMarker 출처 판독기 aim-extract 1.2 (브라우저 · Node 공용, 의존성 없음)
 * 파일을 기기 밖으로 보내지 않고 이 기기에서 읽는다.
 *   report  : 사람이 보는 출처 기록. C2PA 서명 · 무결성, IPTC · XMP · EXIF · PNG 생성 기록.
 *   features: 판정 서버(am.analyze · am.mark)에 보내는 작은 요약. 원본 파일 · 픽셀 · 프롬프트는 담지 않는다.
 *   pack    : 서버가 서명을 다시 검증할 수 있도록 C2PA 기록에서 서명 · 클레임 · 필요한 단정만 떼어 낸 것.
 *             썸네일 · 위치 정보(stds.exif) · 작성자 정보는 담지 않는다.
 *   verifyMark: AIMarker 마크 서명(JWS · Ed25519)을 공개키로 이 기기에서 확인한다(서버에 묻지 않음).
 * AI 사용 여부 판정 규칙, 생성 도구 지문, 신뢰 목록 판단은 서버에만 있다.
 * (c) 2026 AIMarker · 성균관컨설팅 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AIMExtract = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.2.0', SCHEMA = 1;

  /* ---------- 공통 ---------- */
  var _subtle = null;
  function subtle() {
    if (_subtle) return _subtle;
    if (typeof crypto !== 'undefined' && crypto && crypto.subtle) _subtle = crypto.subtle;
    else { try { _subtle = require('crypto').webcrypto.subtle; } catch (e) { _subtle = null; } }
    return _subtle;
  }
  var TD = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: false }) : null;
  var TE = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  function utf8(u8) { if (!u8 || !u8.length) return ''; if (TD) return TD.decode(u8); return Buffer.from(u8).toString('utf8'); }
  function enc(s) { return TE ? TE.encode(s) : new Uint8Array(Buffer.from(s, 'utf8')); }
  function latin1(u8, s, e) { var out = '', CH = 8192; s = s || 0; e = Math.min(e == null ? u8.length : e, u8.length); for (var i = s; i < e; i += CH) out += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + CH, e))); return out; }
  function u16(u8, i) { return (u8[i] << 8) | u8[i + 1]; }
  function u32(u8, i) { return ((u8[i] << 24) >>> 0) + (u8[i + 1] << 16) + (u8[i + 2] << 8) + u8[i + 3]; }
  function u32le(u8, i) { return u8[i] + (u8[i + 1] << 8) + (u8[i + 2] << 16) + ((u8[i + 3] << 24) >>> 0); }
  function u64(u8, i) { return u32(u8, i) * 4294967296 + u32(u8, i + 4); }
  function be64(n) { var b = new Uint8Array(8), hi = Math.floor(n / 4294967296), lo = n >>> 0; b[0] = hi >>> 24; b[1] = (hi >>> 16) & 255; b[2] = (hi >>> 8) & 255; b[3] = hi & 255; b[4] = lo >>> 24; b[5] = (lo >>> 16) & 255; b[6] = (lo >>> 8) & 255; b[7] = lo & 255; return b; }
  function hex(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16); return s; }
  function b64(u8) { if (typeof btoa === 'undefined') return Buffer.from(u8).toString('base64'); var s = '', CH = 8192; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + CH, u8.length))); return btoa(s); }
  function unb64(s) { s = String(s || '').replace(/[^A-Za-z0-9+/=]/g, ''); if (typeof atob === 'undefined') return new Uint8Array(Buffer.from(s, 'base64')); var bin = atob(s), o = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; }
  function eq(a, b) { if (!a || !b || a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function clip(s, n) { s = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) : s; }
  function concat(parts) { var n = 0, i; for (i = 0; i < parts.length; i++) n += parts[i].length; var o = new Uint8Array(n), p = 0; for (i = 0; i < parts.length; i++) { o.set(parts[i], p); p += parts[i].length; } return o; }
  function find(u8, pat, from, to) { var n = pat.length, end = Math.min(to == null ? u8.length : to, u8.length) - n; outer: for (var i = from || 0; i <= end; i++) { for (var k = 0; k < n; k++) if (u8[i + k] !== pat[k]) continue outer; return i; } return -1; }
  var ALG = { sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' };
  function digest(alg, u8) { var s = subtle(); if (!s) return Promise.reject(new Error('NO_CRYPTO')); return s.digest(ALG[alg] || 'SHA-256', u8).then(function (b) { return new Uint8Array(b); }); }
  /* 큰 파일을 여러 조각으로 해시(조각을 합치지 않음) */
  function digestParts(alg, parts) {
    var total = 0; parts.forEach(function (p) { total += p.length; });
    if (total <= 268435456) return digest(alg, parts.length === 1 ? parts[0] : concat(parts));
    return Promise.reject(new Error('TOO_LARGE'));
  }

  /* ---------- CBOR ---------- */
  function Tag(tag, value) { this.tag = tag; this.value = value; }
  function cborDecode(u8, start, end) {
    var p = start || 0, BREAK = {}; end = end == null ? u8.length : end;
    function need(n) { if (p + n > end) throw new Error('CBOR_EOF'); }
    function arg(ai) {
      if (ai < 24) return ai;
      if (ai === 24) { need(1); return u8[p++]; }
      if (ai === 25) { need(2); var v = u16(u8, p); p += 2; return v; }
      if (ai === 26) { need(4); var w = u32(u8, p); p += 4; return w; }
      if (ai === 27) { need(8); var x = u64(u8, p); p += 8; return x; }
      if (ai === 31) return -1;
      throw new Error('CBOR_AI');
    }
    function half(h) { var s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff; if (e === 0) return s * Math.pow(2, -14) * (f / 1024); if (e === 31) return f ? NaN : s * Infinity; return s * Math.pow(2, e - 15) * (1 + f / 1024); }
    function item(depth) {
      if (depth > 64) throw new Error('CBOR_DEEP');
      need(1); var ib = u8[p++], mt = ib >> 5, ai = ib & 31, n, i, out;
      if (mt === 7) {
        if (ai === 20) return false; if (ai === 21) return true; if (ai === 22) return null; if (ai === 23) return undefined;
        if (ai === 25) { need(2); var h = u16(u8, p); p += 2; return half(h); }
        if (ai === 26) { need(4); var dv = new DataView(u8.buffer, u8.byteOffset + p, 4); p += 4; return dv.getFloat32(0); }
        if (ai === 27) { need(8); var dv2 = new DataView(u8.buffer, u8.byteOffset + p, 8); p += 8; return dv2.getFloat64(0); }
        if (ai === 31) return BREAK;
        if (ai < 24) return { simple: ai };
        need(1); return { simple: u8[p++] };
      }
      n = arg(ai);
      switch (mt) {
        case 0: return n;
        case 1: return -1 - n;
        case 2: case 3:
          if (n < 0) { var parts = []; for (;;) { var c = item(depth + 1); if (c === BREAK) break; parts.push(mt === 3 ? enc(c) : c); } var joined = concat(parts); return mt === 3 ? utf8(joined) : joined; }
          need(n); var bs = u8.slice(p, p + n); p += n; return mt === 3 ? utf8(bs) : bs;
        case 4:
          out = [];
          if (n < 0) { for (;;) { var a = item(depth + 1); if (a === BREAK) break; out.push(a); } }
          else { if (n > 100000) throw new Error('CBOR_BIG'); for (i = 0; i < n; i++) out.push(item(depth + 1)); }
          return out;
        case 5:
          out = {};
          if (n < 0) { for (;;) { var k = item(depth + 1); if (k === BREAK) break; out[String(k)] = item(depth + 1); } }
          else { if (n > 100000) throw new Error('CBOR_BIG'); for (i = 0; i < n; i++) { var key = item(depth + 1); out[String(key)] = item(depth + 1); } }
          return out;
        case 6: return new Tag(n, item(depth + 1));
      }
      throw new Error('CBOR_MT');
    }
    var v = item(0);
    return { value: v, end: p };
  }
  function cbor(u8, s, e) { return cborDecode(u8, s, e).value; }
  function cborHead(mt, n) {
    if (n < 24) return new Uint8Array([(mt << 5) | n]);
    if (n < 256) return new Uint8Array([(mt << 5) | 24, n]);
    if (n < 65536) return new Uint8Array([(mt << 5) | 25, n >> 8, n & 255]);
    return new Uint8Array([(mt << 5) | 26, (n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255]);
  }
  function cborBytes(b) { return concat([cborHead(2, b.length), b]); }
  function cborText(s) { var b = enc(s); return concat([cborHead(3, b.length), b]); }

  /* ---------- JUMBF 상자 ---------- */
  function boxList(u8, start, end) {
    var out = [], i = start;
    while (i + 8 <= end) {
      var L = u32(u8, i), T = latin1(u8, i + 4, i + 8), h = 8;
      if (L === 1) { if (i + 16 > end) break; L = u64(u8, i + 8); h = 16; }
      else if (L === 0) L = end - i;
      if (L < h || i + L > end) break;
      out.push({ type: T, start: i, end: i + L, body: i + h });
      i += L;
    }
    return out;
  }
  function jumbTree(u8, box, depth) {
    var kids = boxList(u8, box.body, box.end), node = { type: 'jumb', start: box.start, end: box.end, body: box.body, label: '', uuid: '', children: [], content: [] };
    if (!kids.length || kids[0].type !== 'jumd') return node;
    var d = kids[0], ds = d.body, de = d.end;
    if (de - ds >= 17) {
      node.uuid = latin1(u8, ds, ds + 4);
      var tog = u8[ds + 16], q = ds + 17;
      if (tog & 2) { var z = q; while (z < de && u8[z] !== 0) z++; node.label = utf8(u8.subarray(q, z)); q = z + 1; }
    }
    for (var k = 1; k < kids.length; k++) {
      var c = kids[k];
      if (c.type === 'jumb') { if (depth < 12) node.children.push(jumbTree(u8, c, depth + 1)); }
      else node.content.push(c);
    }
    return node;
  }
  function child(node, label) { if (!node) return null; for (var i = 0; i < node.children.length; i++) if (node.children[i].label === label) return node.children[i]; return null; }
  function contentOf(node, type) { for (var i = 0; i < node.content.length; i++) if (node.content[i].type === type) return node.content[i]; return null; }

  /* ---------- DER · X.509 · 시각 도장 ---------- */
  function derRead(u8, i) {
    var tag = u8[i], len = u8[i + 1], h = 2;
    if (len & 0x80) { var n = len & 0x7f; if (!n || n > 4) throw new Error('DER_LEN'); len = 0; for (var k = 0; k < n; k++) len = len * 256 + u8[i + 2 + k]; h = 2 + n; }
    if (i + h + len > u8.length) throw new Error('DER_EOF');
    return { tag: tag, start: i, body: i + h, end: i + h + len };
  }
  function derKids(u8, t) { var out = [], i = t.body; while (i < t.end) { var c = derRead(u8, i); out.push(c); i = c.end; } return out; }
  function oid(u8, t) {
    var b = u8.subarray(t.body, t.end), parts = [Math.floor(b[0] / 40), b[0] % 40], v = 0;
    for (var i = 1; i < b.length; i++) { v = v * 128 + (b[i] & 0x7f); if (!(b[i] & 0x80)) { parts.push(v); v = 0; } }
    return parts.join('.');
  }
  var DN = { '2.5.4.3': 'CN', '2.5.4.10': 'O', '2.5.4.11': 'OU', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST' };
  function derName(u8, t) {
    var o = {};
    derKids(u8, t).forEach(function (set) { derKids(u8, set).forEach(function (seq) { var kv = derKids(u8, seq); if (kv.length < 2) return; var k = DN[oid(u8, kv[0])]; if (k && !o[k]) o[k] = utf8(u8.subarray(kv[1].body, kv[1].end)); }); });
    return o;
  }
  function derTime(u8, t) {
    var s = latin1(u8, t.body, t.end), y, r;
    if (t.tag === 0x17) { y = +s.slice(0, 2); y += y < 50 ? 2000 : 1900; r = s.slice(2); } else { y = +s.slice(0, 4); r = s.slice(4); }
    return Date.UTC(y, +r.slice(0, 2) - 1, +r.slice(2, 4), +r.slice(4, 6), +r.slice(6, 8), +r.slice(8, 10) || 0);
  }
  function x509(der) {
    var c = derRead(der, 0), parts = derKids(der, c), tbs = derKids(der, parts[0]), i = 0;
    if (tbs[0].tag === 0xa0) i = 1;
    var serial = hex(der.subarray(tbs[i].body, tbs[i].end)), issuer = derName(der, tbs[i + 2]), validity = derKids(der, tbs[i + 3]), subject = derName(der, tbs[i + 4]), spki = tbs[i + 5];
    var algSeq = derKids(der, derKids(der, spki)[0]), keyOid = oid(der, algSeq[0]), curve = algSeq[1] && algSeq[1].tag === 0x06 ? oid(der, algSeq[1]) : '';
    return { serial: serial, issuer: issuer, subject: subject, notBefore: derTime(der, validity[0]), notAfter: derTime(der, validity[1]), spki: der.slice(spki.start, spki.end), keyOid: keyOid, curve: curve };
  }
  function tstTime(tok) {   // RFC 3161 시각 도장 → 서명 시각(검증하지 않은 값)
    try {
      var ci = derRead(tok, 0), k = derKids(tok, ci);
      if (k[0].tag === 0x30 && k[1] && k[1].tag === 0x30) k = derKids(tok, k[1]);   // TimeStampResp { status, token }
      var sd = derRead(tok, k[1].body), sk = derKids(tok, sd), ek = derKids(tok, sk[2]), oct = derRead(tok, ek[1].body), tk = derKids(tok, derRead(tok, oct.body));
      for (var i = 0; i < tk.length; i++) if (tk[i].tag === 0x18) return derTime(tok, tk[i]);
    } catch (e) { /* 넘어감 */ }
    return 0;
  }
  function rsaSpki(spki) {   // id-RSASSA-PSS 공개키를 웹 암호가 받는 rsaEncryption 꼴로
    var top = derRead(spki, 0), kids = derKids(spki, top), bits = spki.slice(kids[1].start, kids[1].end);
    var alg = new Uint8Array([0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00]);
    var body = concat([alg, bits]), len = body.length, head = len < 128 ? new Uint8Array([0x30, len]) : len < 256 ? new Uint8Array([0x30, 0x81, len]) : new Uint8Array([0x30, 0x82, len >> 8, len & 255]);
    return concat([head, body]);
  }
  var CURVE = { '1.2.840.10045.3.1.7': 'P-256', '1.3.132.0.34': 'P-384', '1.3.132.0.35': 'P-521' };
  var COSE_ALG = { '-7': ['ECDSA', 'SHA-256', 'ES256'], '-35': ['ECDSA', 'SHA-384', 'ES384'], '-36': ['ECDSA', 'SHA-512', 'ES512'], '-37': ['RSA-PSS', 'SHA-256', 'PS256'], '-38': ['RSA-PSS', 'SHA-384', 'PS384'], '-39': ['RSA-PSS', 'SHA-512', 'PS512'], '-8': ['Ed25519', '', 'Ed25519'] };
  function importKey(cert, spec) {
    var s = subtle(), name = spec[0];
    if (name === 'ECDSA') return s.importKey('spki', cert.spki, { name: 'ECDSA', namedCurve: CURVE[cert.curve] || 'P-256' }, false, ['verify']);
    if (name === 'RSA-PSS') return s.importKey('spki', cert.keyOid === '1.2.840.113549.1.1.10' ? rsaSpki(cert.spki) : cert.spki, { name: 'RSA-PSS', hash: spec[1] }, false, ['verify']);
    return s.importKey('spki', cert.spki, { name: 'Ed25519' }, false, ['verify']);
  }
  function verifySig(spec, key, sig, data) {
    var s = subtle(), name = spec[0];
    if (name === 'ECDSA') return s.verify({ name: 'ECDSA', hash: spec[1] }, key, sig, data);
    if (name === 'RSA-PSS') return s.verify({ name: 'RSA-PSS', saltLength: spec[1] === 'SHA-256' ? 32 : spec[1] === 'SHA-384' ? 48 : 64 }, key, sig, data);
    return s.verify({ name: 'Ed25519' }, key, sig, data);
  }

  /* ---------- 파일 형식 ---------- */
  function sniff(u8) {
    if (!u8 || u8.length < 12) return 'other';
    var h4 = latin1(u8, 0, 4), h12 = latin1(u8, 8, 12);
    if (u8[0] === 0xFF && u8[1] === 0xD8 && u8[2] === 0xFF) return 'jpeg';
    if (u8[0] === 0x89 && h4.slice(1) === 'PNG') return 'png';
    if (h4 === 'RIFF' && h12 === 'WEBP') return 'webp';
    if (h4 === 'RIFF' && h12 === 'WAVE') return 'wav';
    if (h4 === 'RIFF' && h12.indexOf('AVI') === 0) return 'avi';
    if (latin1(u8, 0, 3) === 'GIF') return 'gif';
    if (latin1(u8, 0, 5) === '%PDF-') return 'pdf';
    if (h4 === 'fLaC') return 'flac';
    if (latin1(u8, 4, 8) === 'ftyp') {
      var brand = latin1(u8, 8, 12).toLowerCase();
      if (/heic|heix|mif1|msf1|hevc|heim|heis/.test(brand)) return 'heic';
      if (/avif|avis/.test(brand)) return 'avif';
      if (/m4a |m4b |m4p /.test(brand)) return 'm4a';
      if (/qt  /.test(brand)) return 'mov';
      if (/crx /.test(brand)) return 'cr3';
      return 'mp4';
    }
    if (latin1(u8, 0, 3) === 'ID3') {   // ID3 다음 실제 형식
      var sz = ((u8[6] & 127) << 21) | ((u8[7] & 127) << 14) | ((u8[8] & 127) << 7) | (u8[9] & 127), at = 10 + sz;
      if (latin1(u8, at, at + 4) === 'fLaC') return 'flac';
      return 'mp3';
    }
    if (u8[0] === 0xFF && (u8[1] & 0xE0) === 0xE0) return 'mp3';
    if ((u8[0] === 0x49 && u8[1] === 0x49 && u8[2] === 0x2A) || (u8[0] === 0x4D && u8[1] === 0x4D && u8[3] === 0x2A)) return 'tiff';
    if (u8[0] === 0xFF && u8[1] === 0x0A) return 'jxl';
    if (latin1(u8, 4, 12) === 'JXL \r\n\u0087\n') return 'jxl';
    if (h4 === 'PK\u0003\u0004') return 'zip';
    var head = latin1(u8, 0, Math.min(u8.length, 1024)).replace(/^﻿/, '').trim();
    if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return 'svg';
    return 'other';
  }
  var KIND = { jpeg: 'image', png: 'image', webp: 'image', gif: 'image', heic: 'image', avif: 'image', tiff: 'image', jxl: 'image', svg: 'image', cr3: 'image', mp4: 'video', mov: 'video', avi: 'video', m4a: 'audio', mp3: 'audio', wav: 'audio', flac: 'audio', pdf: 'doc', zip: 'doc', other: 'other' };
  var BMFF_FMT = { mp4: 1, mov: 1, m4a: 1, heic: 1, avif: 1, cr3: 1 };
  var BMFF_C2PA = 'd8fec3d61b0e483c92975828877ec481', BMFF_XMP = 'be7acfcb97a942e89c71999491e3afac';
  var JUMD_C2PA = [0x6a, 0x75, 0x6d, 0x64, 0x63, 0x32, 0x70, 0x61];   // 'jumdc2pa'

  function c2paStoreAt(u8, s) {   // s 위치에서 시작하는 c2pa 상자 → 바이트(없으면 null)
    if (s < 0 || s + 8 > u8.length || latin1(u8, s + 4, s + 8) !== 'jumb') return null;
    var L = u32(u8, s); if (L < 32 || s + L > u8.length) return null;
    return u8.subarray(s, s + L);
  }
  /* 파일 안의 기록 덩어리(출처 기록 · XMP · EXIF · 글 조각) 꺼내기 */
  function pieces(u8, fmt) {
    var out = { jumbf: null, ranges: [], strict: true, xmp: [], exif: [], png: [], com: [], dims: null, top: null };
    var i, L;
    if (fmt === 'jpeg') {
      i = 2; var groups = {};
      while (i + 4 <= u8.length) {
        if (u8[i] !== 0xFF) { i++; continue; }
        var m = u8[i + 1];
        if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
        if (m === 0xFF) { i++; continue; }
        if (m === 0xD9 || m === 0xDA) break;
        L = u16(u8, i + 2);
        var st = i + 4, en = i + 2 + L;
        if (en > u8.length) break;
        if ((m >= 0xC0 && m <= 0xCF) && m !== 0xC4 && m !== 0xC8 && m !== 0xCC && !out.dims) out.dims = { h: u16(u8, st + 1), w: u16(u8, st + 3) };
        if (m === 0xE1) {
          var head = latin1(u8, st, Math.min(en, st + 40));
          if (head.indexOf('Exif\u0000') === 0) out.exif.push(u8.subarray(st + 6, en));
          else if (head.indexOf('http://ns.adobe.com/xap/1.0/\u0000') === 0) out.xmp.push(utf8(u8.subarray(st + 29, en)));
          else if (head.indexOf('http://ns.adobe.com/xmp/extension/\u0000') === 0) out.xmp.push(utf8(u8.subarray(st + 35 + 40, en)));
        } else if (m === 0xEB && u8[st] === 0x4A && u8[st + 1] === 0x50) {
          var enN = u16(u8, st + 2), z = u32(u8, st + 4);
          (groups[enN] = groups[enN] || []).push({ z: z, data: u8.subarray(st + 8, en), seg: [i, en] });
        } else if (m === 0xFE) out.com.push(latin1(u8, st, en));
        i = en;
      }
      Object.keys(groups).forEach(function (k) {
        if (out.jumbf) return;
        var g = groups[k].sort(function (a, b) { return a.z - b.z; }), parts = [g[0].data];
        for (var q = 1; q < g.length; q++) { var d = g[q].data, hl = u32(d, 0) === 1 ? 16 : 8; parts.push(d.subarray(hl)); }
        var data = concat(parts), first = boxList(data, 0, data.length)[0];
        if (!first || first.type !== 'jumb') return;
        if (jumbTree(data, first, 0).label === 'c2pa') { out.jumbf = data; out.ranges = g.map(function (x) { return x.seg; }); }
      });
    } else if (fmt === 'png') {
      i = 8;
      while (i + 12 <= u8.length) {
        L = u32(u8, i); var tp = latin1(u8, i + 4, i + 8), ds = i + 8, de = ds + L;
        if (de + 4 > u8.length) break;
        if (tp === 'IHDR') out.dims = { w: u32(u8, ds), h: u32(u8, ds + 4) };
        else if (tp === 'caBX' && !out.jumbf) { out.jumbf = u8.subarray(ds, de); out.ranges.push([i, de + 4]); }
        else if (tp === 'eXIf') out.exif.push(u8.subarray(ds, de));
        else if (tp === 'tEXt' || tp === 'iTXt' || tp === 'zTXt') out.png.push({ type: tp, data: u8.subarray(ds, de) });
        if (tp === 'IEND') break;
        i = de + 4;
      }
    } else if (fmt === 'webp' || fmt === 'wav' || fmt === 'avi') {
      i = 12;
      while (i + 8 <= u8.length) {
        var fc = latin1(u8, i, i + 4), sz = u32le(u8, i + 4), s2 = i + 8, e2 = s2 + sz;
        if (e2 > u8.length) break;
        if (fc === 'VP8X') out.dims = { w: 1 + (u8[s2 + 4] | (u8[s2 + 5] << 8) | (u8[s2 + 6] << 16)), h: 1 + (u8[s2 + 7] | (u8[s2 + 8] << 8) | (u8[s2 + 9] << 16)) };
        else if (fc === 'VP8 ' && !out.dims) out.dims = { w: (u8[s2 + 6] | (u8[s2 + 7] << 8)) & 0x3fff, h: (u8[s2 + 8] | (u8[s2 + 9] << 8)) & 0x3fff };
        else if (fc === 'VP8L' && !out.dims) { var b0 = u8[s2 + 1], b1 = u8[s2 + 2], b2 = u8[s2 + 3], b3 = u8[s2 + 4]; out.dims = { w: 1 + (((b1 & 0x3f) << 8) | b0), h: 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) }; }
        else if (fc === 'EXIF') { var ex = u8.subarray(s2, e2); out.exif.push(latin1(ex, 0, 6) === 'Exif\u0000\u0000' ? ex.subarray(6) : ex); }
        else if (fc === 'XMP ' || fc === '_PMX') out.xmp.push(utf8(u8.subarray(s2, e2)));
        else if ((fc === 'C2PA' || fc === 'c2pa') && !out.jumbf) { out.jumbf = u8.subarray(s2, e2); out.ranges.push([i, e2 + (sz % 2)]); }
        else if (fc === 'LIST' && latin1(u8, s2, s2 + 4) === 'INFO') { var t2 = latin1(u8, s2 + 4, e2); var sw = /ISFT[\s\S]{4}([ -~]{2,120})/.exec(t2); if (sw) out.com.push('ISFT ' + sw[1]); }
        i = e2 + (sz % 2);
      }
    } else if (BMFF_FMT[fmt]) {
      var bx = boxList(u8, 0, u8.length); out.top = bx;
      bx.forEach(function (b) {
        if (b.type === 'uuid' && b.end - b.body >= 16) {
          var id = hex(u8.subarray(b.body, b.body + 16));
          if (id === BMFF_C2PA && !out.jumbf) {
            var q = b.body + 16 + 4, z2 = q; while (z2 < b.end && u8[z2] !== 0) z2++;
            var purpose = latin1(u8, q, z2); q = z2 + 1;
            if (purpose === 'manifest') { q += 8; out.jumbf = u8.subarray(q, b.end); out.ranges.push([b.start, b.end]); }
          } else if (id === BMFF_XMP) out.xmp.push(utf8(u8.subarray(b.body + 16, b.end)));
        } else if (b.type === 'moov' || b.type === 'meta') {
          var s3 = latin1(u8, b.body, Math.min(b.end, b.body + 1048576)), mm = s3.match(/(?:©too|©swr|©enc|encoder|©cmt)[\s\S]{0,12}?([ -~]{3,80})/g);
          if (mm) mm.slice(0, 6).forEach(function (x) { out.com.push(x.replace(/[^ -~]/g, ' ')); });
        }
      });
    } else if (fmt === 'gif') {
      out.dims = { w: u8[6] | (u8[7] << 8), h: u8[8] | (u8[9] << 8) };
      var gx = find(u8, [0x21, 0xFF, 0x0B, 0x43, 0x32, 0x50, 0x41, 0x5F, 0x47, 0x49, 0x46], 13);
      if (gx >= 0) {
        var p = gx + 14, chunks = [];
        while (p < u8.length && u8[p] !== 0) { chunks.push(u8.subarray(p + 1, p + 1 + u8[p])); p += 1 + u8[p]; }
        var gdata = concat(chunks), gfirst = boxList(gdata, 0, gdata.length)[0];
        if (gfirst && gfirst.type === 'jumb' && jumbTree(gdata, gfirst, 0).label === 'c2pa') { out.jumbf = gdata; out.ranges.push([gx, p + 1]); }
      }
    } else if (fmt === 'svg') {
      var txt = latin1(u8, 0, Math.min(u8.length, 33554432)), sa = txt.indexOf('<c2pa:manifest>');
      if (sa >= 0) { var sb = txt.indexOf('</c2pa:manifest>', sa); if (sb > sa) { try { out.jumbf = unb64(txt.slice(sa + 15, sb)); out.ranges.push([sa, sb + 16]); out.strict = false; } catch (e) { /* 넘어감 */ } } }
    }
    if (!out.jumbf && fmt !== 'jpeg' && fmt !== 'png' && fmt !== 'webp' && !BMFF_FMT[fmt]) {   // 그 밖의 형식: 기록 상자를 직접 찾음(TIFF · MP3 · FLAC · PDF · JXL 등)
      var from = 0;
      for (var tries = 0; tries < 8; tries++) {
        var at = find(u8, JUMD_C2PA, from); if (at < 0) break;
        var store = c2paStoreAt(u8, at - 12);
        if (store) { var tb = boxList(store, 0, store.length)[0]; if (tb && jumbTree(store, tb, 0).label === 'c2pa') { out.jumbf = store; out.ranges.push([at - 12, at - 12 + store.length]); out.strict = false; break; } }
        from = at + 8;
      }
    }
    if (!out.xmp.length) {   // 놓친 XMP 는 파일 앞뒤에서 찾음
      var lim = Math.min(u8.length, 4194304), raw = latin1(u8, 0, lim), a = raw.indexOf('<x:xmpmeta');
      if (a < 0 && u8.length > lim) { raw = latin1(u8, u8.length - lim, u8.length); a = raw.indexOf('<x:xmpmeta'); if (a >= 0) a += u8.length - lim; }
      if (a >= 0) { var rr = latin1(u8, a, Math.min(u8.length, a + 1048576)), b2i = rr.indexOf('</x:xmpmeta>'); if (b2i > 0) out.xmp.push(utf8(u8.subarray(a, a + b2i + 12))); }
    }
    return out;
  }

  /* ---------- EXIF ---------- */
  var EXIF_TAGS = { 0x010E: 'description', 0x010F: 'make', 0x0110: 'model', 0x0131: 'software', 0x0132: 'datetime', 0x013B: 'artist', 0x8298: 'copyright', 0x829A: 'exposureTime', 0x829D: 'fNumber', 0x8827: 'iso', 0x9003: 'dateOriginal', 0x9286: 'userComment', 0x920A: 'focalLength', 0xA433: 'lensMake', 0xA434: 'lensModel', 0x9C9C: 'xpComment', 0x9C9B: 'xpTitle' };
  function exifParse(t) {
    if (!t || t.length < 8) return null;
    var le = t[0] === 0x49, r16 = function (i) { return le ? t[i] | (t[i + 1] << 8) : (t[i] << 8) | t[i + 1]; }, r32 = function (i) { return le ? u32le(t, i) : u32(t, i); };
    if (r16(2) !== 42) return null;
    var o = {}, seen = {};
    function ucs2(body) { var bl = le; if (body.length > 1) { if (body[0] === 0 && body[1] !== 0) bl = false; else if (body[1] === 0 && body[0] !== 0) bl = true; } var s = ''; for (var q = 0; q + 1 < body.length; q += 2) { var c = bl ? body[q] | (body[q + 1] << 8) : (body[q] << 8) | body[q + 1]; if (!c) break; s += String.fromCharCode(c); } return s; }
    function ifd(off, depth) {
      if (!off || off + 2 > t.length || seen[off] || depth > 3) return; seen[off] = 1;
      var n = r16(off); if (n > 500) return;
      for (var k = 0; k < n; k++) {
        var e = off + 2 + k * 12; if (e + 12 > t.length) break;
        var tag = r16(e), type = r16(e + 2), cnt = r32(e + 4), vo = e + 8;
        if (tag === 0x8769) { ifd(r32(vo), depth + 1); continue; }
        var name = EXIF_TAGS[tag]; if (!name) continue;
        var size = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 })[type] || 1, total = size * cnt, at = total > 4 ? r32(vo) : vo;
        if (at + total > t.length || total > 65536) continue;
        if (type === 2) o[name] = clip(utf8(t.subarray(at, at + total)).replace(/\u0000+$/, ''), 300);
        else if (name === 'xpComment' || name === 'xpTitle') o[name] = clip(ucs2(t.subarray(at, at + total)), 300);
        else if ((type === 7 || type === 1) && name === 'userComment') { var code = latin1(t, at, at + 8), body = t.subarray(at + 8, at + total); o[name] = clip(/UNICODE/.test(code) ? ucs2(body) : /ASCII|JIS|\u0000{8}/.test(code) ? utf8(body) : utf8(t.subarray(at, at + total)), 2000); }
        else if (type === 5 || type === 10) o[name] = r32(at + 4) ? r32(at) / r32(at + 4) : 0;
        else if (type === 3) o[name] = r16(at);
        else if (type === 4) o[name] = r32(at);
      }
    }
    ifd(r32(4), 0);
    return Object.keys(o).length ? o : null;
  }

  /* ---------- XMP ---------- */
  function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function xmpField(x, name) {
    var en = esc(name), re1 = new RegExp(en + '="([^"]{0,600})"'), m = re1.exec(x); if (m) return m[1];
    var re2 = new RegExp('<' + en + '(?:\\s[^>]*)?>([\\s\\S]{0,2000}?)</' + en + '>'), m2 = re2.exec(x);
    if (m2) { var li = /<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/.exec(m2[1]); return (li ? li[1] : m2[1]).replace(/<[^>]+>/g, ' ').trim(); }
    return '';
  }
  function unent(s) { return String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); }).replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&amp;/g, '&'); }
  function xmpParse(list) {
    if (!list.length) return null;
    var x = list.join('\n'), o = { dst: [], creatorTool: '', credit: '', agents: [], actions: [], description: '', aiSystem: '', aiPrompt: false, provenance: false, aimarker: null, rawLen: x.length };
    var re = /digitalsourcetype\/([A-Za-z]+)/gi, m;
    while ((m = re.exec(x))) if (o.dst.indexOf(m[1]) < 0) o.dst.push(m[1]);
    o.creatorTool = clip(unent(xmpField(x, 'xmp:CreatorTool')), 160);
    o.credit = clip(unent(xmpField(x, 'photoshop:Credit') || xmpField(x, 'Iptc4xmpCore:CreditLine')), 160);
    o.description = clip(unent(xmpField(x, 'dc:description')), 300);
    o.aiSystem = clip(unent(xmpField(x, 'Iptc4xmpExt:AISystemUsed') + ' ' + xmpField(x, 'Iptc4xmpExt:AISystemVersionUsed')), 160);
    o.aiPrompt = /AIPromptInformation|AIPromptWriterName/.test(x);
    o.provenance = /dcterms:provenance|c2pa/i.test(x);
    var ag = /stEvt:softwareAgent(?:="([^"]{1,160})"|>([^<]{1,160})<)/g;
    while ((m = ag.exec(x)) && o.agents.length < 20) { var v = clip(unent(m[1] || m[2]), 160); if (v && o.agents.indexOf(v) < 0) o.agents.push(v); }
    var ac = /stEvt:(?:action|changed)(?:="([^"]{1,60})"|>([^<]{1,60})<)/g;
    while ((m = ac.exec(x)) && o.actions.length < 24) { var w = (m[1] || m[2] || '').trim(); if (w && o.actions.indexOf(w) < 0) o.actions.push(w); }
    var mk = /aimarker:[Mm]ark(?:Id)?(?:="(AM-[A-Z0-9]{6,20})"|>(AM-[A-Z0-9]{6,20})<)/.exec(x);
    if (mk) o.aimarker = { id: mk[1] || mk[2], url: clip(unent(xmpField(x, 'aimarker:Url') || xmpField(x, 'aimarker:url')), 200), label: clip(unent(xmpField(x, 'aimarker:Label')), 20), basis: clip(unent(xmpField(x, 'aimarker:Basis')), 20), cred: clip(unent(xmpField(x, 'aimarker:Credential')), 4000).replace(/[^A-Za-z0-9_\-.]/g, '') };
    return o;
  }

  /* ---------- PNG 글 조각 ---------- */
  function inflate(u8) {
    if (typeof DecompressionStream !== 'undefined' && typeof Blob !== 'undefined' && typeof Response !== 'undefined') {
      try { var ds = new DecompressionStream('deflate'), w = new Blob([u8]).stream().pipeThrough(ds); return new Response(w).arrayBuffer().then(function (b) { return new Uint8Array(b); }).catch(function () { return null; }); } catch (e) { return Promise.resolve(null); }
    }
    try { return Promise.resolve(new Uint8Array(require('zlib').inflateSync(u8))); } catch (e2) { return Promise.resolve(null); }
  }
  function pngTexts(list) {
    return Promise.all(list.slice(0, 40).map(function (c) {
      var d = c.data, z = 0; while (z < d.length && d[z] !== 0) z++;
      var key = latin1(d, 0, Math.min(z, 79));
      if (c.type === 'tEXt') return { key: key, text: latin1(d, z + 1, Math.min(d.length, z + 1 + 400000)) };
      if (c.type === 'zTXt') return inflate(d.subarray(z + 2)).then(function (b) { return { key: key, text: b ? utf8(b.subarray(0, Math.min(b.length, 400000))) : '' }; });
      var flag = d[z + 1], q = z + 3; while (q < d.length && d[q] !== 0) q++; q++; while (q < d.length && d[q] !== 0) q++; q++;
      var body = d.subarray(q);
      return (flag ? inflate(body) : Promise.resolve(body)).then(function (b) { return { key: key, text: b ? utf8(b.subarray(0, Math.min(b.length, 400000))) : '' }; });
    }));
  }
  /* 생성 설정값(프롬프트 등)은 기기 밖으로 보내지 않고 도구 · 모델 이름만 뽑음 */
  function genInfo(key, v, out) {
    var s = String(v || '');
    if (key === 'parameters' || key === 'userComment') {
      if (/Steps: ?\d+[\s\S]{0,400}(Sampler|CFG scale|Seed)/.test(s)) {
        out.sdParams = true;
        var mm = /Model: ([^,\n]{1,80})/.exec(s); if (mm) out.models.push(clip(mm[1], 80));
        var vv = /Version: ([^,\n]{1,40})/.exec(s); if (vv) out.tools.push('A1111 ' + clip(vv[1], 40));
      }
      if (/^\s*\{/.test(s) && /"(?:sui_image_params|fooocus|Fooocus|prompt)"/.test(s)) { out.sdParams = true; if (/sui_image_params/.test(s)) out.tools.push('SwarmUI'); if (/fooocus/i.test(s)) out.tools.push('Fooocus'); var m2 = /"(?:model|base_model|Base Model)"\s*:\s*"([^"]{1,80})"/.exec(s); if (m2) out.models.push(clip(m2[1], 80)); }
    }
    if ((key === 'prompt' || key === 'workflow') && /^\s*[\[{]/.test(s) && /class_type|"nodes"\s*:|"last_node_id"/.test(s)) {
      out.comfy = true; var rx = /"ckpt_name"\s*:\s*"([^"]{1,100})"/g, mt; while ((mt = rx.exec(s)) && out.models.length < 6) out.models.push(clip(mt[1], 100));
      var ux = /"unet_name"\s*:\s*"([^"]{1,100})"/g; while ((mt = ux.exec(s)) && out.models.length < 6) out.models.push(clip(mt[1], 100));
    }
    if (/^(invokeai_metadata|invokeai_graph|sd-metadata|Dream)$/.test(key)) { out.invoke = true; var im = /"model"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]{1,80})"/.exec(s) || /"model_name"\s*:\s*"([^"]{1,80})"/.exec(s); if (im) out.models.push(clip(im[1], 80)); }
    if (key === 'fooocus_scheme') out.tools.push('Fooocus');
    if (key === 'Software' || key === 'Source' || key === 'Title' || key === 'Author' || key === 'generation_data' || key === 'Creation Time') out.texts.push(key + ': ' + clip(s, 120));
    if (key === 'Comment' && /"(steps|sampler|n_samples|uc|scale)"/.test(s)) out.novelai = out.novelai || /"(uc|n_samples|noise_schedule|v4_prompt)"/.test(s);
    if (key === 'Description' && /Job ID:\s*[0-9a-f-]{20,}/i.test(s)) out.mjJob = true;
    if (key === 'Software' && /novelai/i.test(s)) out.novelai = true;
  }

  /* ---------- C2PA(출처 기록) 판독 · 서명 · 무결성 확인 ---------- */
  function hashedUrl(url, manLabel) {
    var p = String(url || '').replace(/^self#jumbf=/, '');
    if (p.charAt(0) === '/') { var s = p.split('/'); return { manifest: s[2] || manLabel, path: s.slice(3) }; }
    return { manifest: manLabel, path: p.split('/') };
  }
  function findPath(manNode, path) { var n = manNode; for (var i = 0; i < path.length && n; i++) n = child(n, path[i]); return n; }
  function assertionValue(u8, node) {
    var cb = contentOf(node, 'cbor'); if (cb) { try { return cbor(u8, cb.body, cb.end); } catch (e) { return null; } }
    var js = contentOf(node, 'json'); if (js) { try { return JSON.parse(utf8(u8.subarray(js.body, js.end))); } catch (e2) { return null; } }
    return null;
  }
  function genOf(claim) {
    var out = [];
    if (claim.claim_generator) out.push(clip(claim.claim_generator, 160));
    var gi = claim.claim_generator_info, arr = Array.isArray(gi) ? gi : gi ? [gi] : [];
    arr.forEach(function (g) { if (g && g.name) out.push(clip(g.name + (g.version ? ' ' + g.version : ''), 160)); });
    return out;
  }
  function agentName(a) { if (!a) return ''; if (typeof a === 'string') return clip(a, 120); if (a.name) return clip(a.name + (a.version ? ' ' + a.version : ''), 120); return ''; }
  function dstName(v) { var s = String(v || ''); var m = /digitalsourcetype\/([A-Za-z]+)/i.exec(s); return m ? m[1] : s ? clip(s, 60) : ''; }
  function mergeRanges(r) { var a = r.slice().sort(function (x, y) { return x[0] - y[0]; }), out = []; a.forEach(function (x) { var l = out[out.length - 1]; if (l && x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else out.push([x[0], x[1]]); }); return out; }
  /* 제외 구간이 출처 기록이 든 자리만 덮는지(그 밖을 덮으면 그 부분을 바꿔도 알아챌 수 없음) */
  function exclusionsTight(ex, ranges, strict) {
    var mr = mergeRanges(ranges), slack = strict ? 0 : 512;
    return ex.every(function (e) { var s = e[0], t = e[0] + e[1]; return mr.some(function (r) { return s >= r[0] - slack && t <= r[1] + slack; }); });
  }
  /* BMFF(동영상 · HEIF) 해시: 맨 위 상자마다 8바이트 위치 + 상자 내용, 제외 상자는 건너뜀 */
  var BMFF_CONTAINERS = { moov: 1, trak: 1, mdia: 1, minf: 1, stbl: 1, udta: 1, edts: 1, dinf: 1, mvex: 1, moof: 1, traf: 1, iprp: 1, ipco: 1 };
  function bmffKids(u8, b) { var s = b.type === 'meta' ? b.body + 4 : b.body; return BMFF_CONTAINERS[b.type] || b.type === 'meta' ? boxList(u8, s, b.end) : []; }
  function bmffMatch(u8, list, path) {
    var out = [];
    list.forEach(function (b) { if (b.type !== path[0]) return; if (path.length === 1) out.push(b); else out = out.concat(bmffMatch(u8, bmffKids(u8, b), path.slice(1))); });
    return out;
  }
  function bmffVerify(file, top, hv) {
    if (hv.merkle && hv.merkle.length) return Promise.resolve({ state: 'unsupported' });
    var whole = {}, sub = [], loose = false;
    (hv.exclusions || []).forEach(function (ex) {
      var path = String(ex.xpath || '').split('/').filter(Boolean); if (!path.length) return;
      bmffMatch(file, top, path).forEach(function (b) {
        if (ex.length != null && (b.end - b.start) !== ex.length) return;
        if (ex.data && !(ex.data || []).every(function (d) { var v = d.value instanceof Uint8Array ? d.value : new Uint8Array(0); return eq(file.subarray(b.start + d.offset, b.start + d.offset + v.length), v); })) return;
        if (ex.version != null && file[b.body] !== ex.version) return;
        if (ex.subset && ex.subset.length) { ex.subset.forEach(function (s) { var st = b.start + (s.offset || 0), en = s.length ? st + s.length : b.end; sub.push([st, Math.min(en, b.end)]); }); return; }
        if (path.length === 1) { whole[b.start] = 1; if (/^(mdat|moov|moof|meta|trak)$/.test(b.type)) loose = true; }
        else { sub.push([b.start, b.end]); if (/^(trak|mdia|minf|stbl|stco|co64|stsz)$/.test(b.type)) loose = true; }
      });
    });
    var parts = [], ms = mergeRanges(sub);
    top.forEach(function (b) {
      if (whole[b.start]) return;
      parts.push(be64(b.start));
      var at = b.start;
      ms.forEach(function (r) { if (r[1] <= b.start || r[0] >= b.end) return; if (r[0] > at) parts.push(file.subarray(at, r[0])); at = Math.max(at, r[1]); });
      if (at < b.end) parts.push(file.subarray(at, b.end));
    });
    return digestParts(hv.alg || 'sha256', parts).then(function (h) { return { state: eq(h, hv.hash) ? (loose ? 'loose' : 'ok') : 'mismatch' }; });
  }

  function readManifest(store, file, man, isActive, env) {
    var u8 = env.u8;
    var r = { label: man.label, active: isActive, generator: [], title: '', format: '', instanceID: '', actions: [], ingredients: [], assertions: [], vendor: [], exif: null, author: '', sig: null, codes: [], hashedOk: null, binding: null, claimVersion: 1, pack: null };
    var claimNode = child(man, 'c2pa.claim.v2') || child(man, 'c2pa.claim');
    if (!claimNode) { r.codes.push('claim.missing'); return Promise.resolve(r); }
    if (claimNode.label === 'c2pa.claim.v2') r.claimVersion = 2;
    var cbBox = contentOf(claimNode, 'cbor'); if (!cbBox) { r.codes.push('claim.cbor.invalid'); return Promise.resolve(r); }
    var claimBytes = u8.slice(cbBox.body, cbBox.end), claim;
    try { claim = cbor(claimBytes); } catch (e) { r.codes.push('claim.cbor.invalid'); return Promise.resolve(r); }
    r.generator = genOf(claim); r.title = clip(claim['dc:title'] || claim.title || '', 120); r.format = clip(claim['dc:format'] || '', 40); r.instanceID = clip(claim.instanceID || '', 80);
    var alg = claim.alg || 'sha256';
    var refs = (claim.assertions || []).concat(claim.created_assertions || [], claim.gathered_assertions || []);
    var asNode = child(man, 'c2pa.assertions');
    var pack = r.pack = { label: man.label, claim: claimBytes, sig: null, as: {} };
    if (asNode) asNode.children.forEach(function (a) { r.assertions.push(a.label); });
    var ingRefs = [];
    if (asNode) asNode.children.forEach(function (a) {
      var lab = a.label.replace(/__\d+$/, '');
      if (/^c2pa\.(actions(\.v2)?|ingredient(\.v[23])?|hash\.(data|bmff(\.v[23])?|boxes|collection\.data)|soft-binding)$/.test(lab) && a.end - a.body <= 16384) pack.as[a.label] = u8.slice(a.body, a.end);
      if (/^c2pa\.actions(\.v2)?$/.test(lab)) {
        var v = assertionValue(u8, a), agents = v && Array.isArray(v.softwareAgents) ? v.softwareAgents : [];
        (v && v.actions || []).slice(0, 40).forEach(function (x) {
          var ag = x.softwareAgent != null ? x.softwareAgent : (typeof x.softwareAgentIndex === 'number' ? agents[x.softwareAgentIndex] : null);
          var params = x.parameters && typeof x.parameters === 'object' ? x.parameters : {};
          r.actions.push({ action: clip(x.action, 60), dst: dstName(x.digitalSourceType || params.digitalSourceType), agent: agentName(ag), desc: clip(x.description || params.description || '', 160), reason: clip(x.reason || '', 60), ingredient: !!(params.ingredient || params.ingredients || params.ingredientIds) });
        });
      } else if (/^c2pa\.ingredient(\.v[23])?$/.test(lab)) {
        var iv = assertionValue(u8, a);
        if (iv) {
          var ref = iv.c2pa_manifest || iv.activeManifest || null;
          r.ingredients.push({ title: clip(iv['dc:title'] || iv.title || '', 80), format: clip(iv['dc:format'] || iv.format || '', 40), relationship: clip(iv.relationship || '', 20), dst: dstName(iv.digitalSourceType), hasManifest: !!ref, manifest: ref && ref.url ? hashedUrl(ref.url, man.label).manifest : '', validation: Array.isArray(iv.validationStatus) ? iv.validationStatus.map(function (s) { return clip(s.code, 50); }).slice(0, 8) : (iv.validationResults && iv.validationResults.activeManifest && Array.isArray(iv.validationResults.activeManifest.failure) ? iv.validationResults.activeManifest.failure.map(function (s) { return clip(s.code, 50); }).slice(0, 8) : []) });
          if (ref && ref.url) ingRefs.push({ ref: ref, v3: !iv.c2pa_manifest, sig: iv.claimSignature || null });
        }
      } else if (lab === 'stds.exif') {
        var ev = assertionValue(u8, a); if (ev) r.exif = { make: clip(ev['tiff:Make'] || ev['exif:Make'] || '', 60), model: clip(ev['tiff:Model'] || ev['exif:Model'] || '', 60) };
      } else if (lab === 'stds.schema-org.CreativeWork') {
        var cw = assertionValue(u8, a); if (cw) r.author = clip((cw.author && cw.author[0] && cw.author[0].name) || '', 80);
      } else if (!/^c2pa\.(hash|thumbnail|ingredient|actions|soft-binding|metadata|training-mining|asset-type|depthmap|embedded-data|cloud-data|time-stamp|certificate-status|asset-ref)/.test(lab) && !/^(stds\.|cawg\.)/.test(lab)) {
        r.vendor.push(clip(a.label, 80));
      }
    });
    // 단정 해시 확인
    var jobs = refs.map(function (ref) {
      var hu = hashedUrl(ref.url, man.label), target = hu.manifest === man.label ? man : child(store, hu.manifest), node = target ? findPath(target, hu.path) : null;
      if (!node) return Promise.resolve({ ref: ref, ok: false, missing: true });
      return digest(ref.alg || alg, u8.subarray(node.body, node.end)).then(function (h) { return { ref: ref, ok: eq(h, ref.hash), node: node }; });
    });
    // 재료가 가리키는 출처 기록이 있고 바뀌지 않았는지
    var ingJobs = ingRefs.map(function (ir) {   // v1 · v2 는 클레임 CBOR, v3 는 기록 상자 내용을 해시함
      var ref = ir.ref, hu = hashedUrl(ref.url, man.label), node = child(store, hu.manifest);
      if (!node) return Promise.resolve('ingredient.manifest.missing');
      if (!ref.hash) return Promise.resolve('');
      var cl = child(node, 'c2pa.claim.v2') || child(node, 'c2pa.claim'), cc = cl ? contentOf(cl, 'cbor') : null;
      var tries = [u8.subarray(node.body, node.end)]; if (cc) tries[ir.v3 ? 'push' : 'unshift'](u8.subarray(cc.body, cc.end));
      return Promise.all(tries.map(function (b) { return digest(ref.alg || alg, b); })).then(function (hs) {
        if (!hs.some(function (h) { return eq(h, ref.hash); })) return 'ingredient.manifest.mismatch';
        if (!ir.sig || !ir.sig.hash) return '';
        var sn = child(node, 'c2pa.signature'); if (!sn) return 'ingredient.claimSignature.missing';
        return digest(ir.sig.alg || alg, u8.subarray(sn.body, sn.end)).then(function (h2) { return eq(h2, ir.sig.hash) ? '' : 'ingredient.claimSignature.mismatch'; });
      });
    });
    return Promise.all(jobs).then(function (res) {
      var bad = res.filter(function (x) { return !x.ok; });
      r.hashedOk = !bad.length;
      bad.forEach(function (x) { var c = x.missing ? 'assertion.missing' : 'assertion.hashedURI.mismatch'; if (r.codes.indexOf(c) < 0) r.codes.push(c); });
      return Promise.all(ingJobs).then(function (ic) { ic.forEach(function (c) { if (c && r.codes.indexOf(c) < 0) r.codes.push(c); }); return res; });
    }).then(function (res) {
      if (!isActive) return null;
      var bind = null;
      res.forEach(function (x) { if (x.node && /^c2pa\.hash\.(data|bmff|boxes|collection)/.test(x.node.label) && !bind) bind = x.node; });
      if (!bind) { r.binding = 'missing'; r.codes.push('claim.hardBindings.missing'); return null; }
      var hv = assertionValue(u8, bind); if (!hv || !hv.hash) { r.binding = 'invalid'; r.codes.push('assertion.dataHash.malformed'); return null; }
      if (/^c2pa\.hash\.bmff/.test(bind.label)) {
        if (!env.top) { r.binding = 'unsupported'; return null; }
        return bmffVerify(file, env.top, hv).then(function (b) { r.binding = b.state; if (b.state === 'mismatch' || b.state === 'loose') r.codes.push('assertion.bmffHash.mismatch'); }).catch(function () { r.binding = 'unsupported'; });
      }
      if (!/^c2pa\.hash\.data/.test(bind.label)) { r.binding = 'unsupported'; return null; }
      var ex = (hv.exclusions || []).map(function (e) { return [e.start, e.length]; }).sort(function (a, b) { return a[0] - b[0]; }), parts = [], at = 0;
      ex.forEach(function (e) { if (e[0] > at) parts.push(file.subarray(at, e[0])); at = Math.max(at, e[0] + e[1]); });
      if (at < file.length) parts.push(file.subarray(at));
      var tight = exclusionsTight(ex, env.ranges, env.strict);
      return digestParts(hv.alg || alg, parts).then(function (h) { r.binding = !eq(h, hv.hash) ? 'mismatch' : tight ? 'ok' : 'loose'; if (r.binding !== 'ok') r.codes.push('assertion.dataHash.mismatch'); });
    }).then(function () {
      // 서명(COSE_Sign1)
      var sigNode = child(man, 'c2pa.signature'); if (!sigNode) { r.codes.push('claimSignature.missing'); return; }
      var sb = contentOf(sigNode, 'cbor'); if (!sb) { r.codes.push('claimSignature.missing'); return; }
      pack.sig = u8.slice(sb.body, sb.end);
      var cose; try { cose = cbor(u8, sb.body, sb.end); } catch (e) { r.codes.push('claimSignature.invalid'); return; }
      if (cose instanceof Tag) cose = cose.value;
      if (!Array.isArray(cose) || cose.length < 4) { r.codes.push('claimSignature.invalid'); return; }
      var prot = cose[0] instanceof Uint8Array ? cose[0] : new Uint8Array(0), unprot = cose[1] || {}, sig = cose[3], ph = {};
      try { ph = prot.length ? cbor(prot) : {}; } catch (e2) { ph = {}; }
      var algId = String(ph['1'] != null ? ph['1'] : unprot['1']), spec = COSE_ALG[algId];
      var chain = ph['33'] || unprot['33'] || ph.x5chain || unprot.x5chain, leaf = Array.isArray(chain) ? chain[0] : chain;
      var tst = ph.sigTst2 || unprot.sigTst2 || ph.sigTst || unprot.sigTst, ttime = 0;
      if (tst && Array.isArray(tst.tstTokens) && tst.tstTokens[0] && tst.tstTokens[0].val instanceof Uint8Array) ttime = tstTime(tst.tstTokens[0].val);
      var S = r.sig = { alg: spec ? spec[2] : 'unknown(' + algId + ')', valid: null, issuer: '', org: '', cn: '', notBefore: 0, notAfter: 0, chain: Array.isArray(chain) ? chain.length : chain ? 1 : 0, tsa: !!tst, time: ttime, certs: [] };
      if (!(leaf instanceof Uint8Array)) { r.codes.push('signingCredential.missing'); return; }
      var cert; try { cert = x509(leaf); } catch (e3) { r.codes.push('signingCredential.invalid'); return; }
      S.org = cert.subject.O || ''; S.cn = cert.subject.CN || ''; S.issuer = cert.issuer.O || cert.issuer.CN || ''; S.notBefore = cert.notBefore; S.notAfter = cert.notAfter; S.serial = cert.serial;
      (Array.isArray(chain) ? chain : [leaf]).slice(0, 5).forEach(function (der) { try { var c = x509(der); S.certs.push({ subject: c.subject, issuer: c.issuer, notAfter: c.notAfter }); } catch (e5) { /* 넘어감 */ } });
      var at = ttime || Date.now();
      if (at > cert.notAfter || at < cert.notBefore) r.codes.push('signingCredential.expired');
      if (!spec || !subtle()) { r.codes.push('algorithm.unsupported'); return; }
      var tbs = concat([new Uint8Array([0x84]), cborText('Signature1'), cborBytes(prot), cborBytes(new Uint8Array(0)), cborBytes(claimBytes)]);
      return importKey(cert, spec).then(function (key) { return verifySig(spec, key, sig, tbs); }).then(function (ok) {
        S.valid = !!ok; if (!ok) r.codes.push('claimSignature.mismatch');
      }).catch(function () { S.valid = null; r.codes.push('algorithm.unsupported'); });
    }).then(function () { return r; });
  }

  function readC2pa(jumbf, file, P) {
    var top = boxList(jumbf, 0, jumbf.length)[0]; if (!top || top.type !== 'jumb') return Promise.resolve(null);
    var store = jumbTree(jumbf, top, 0); if (store.label !== 'c2pa') return Promise.resolve(null);
    var mans = store.children.filter(function (n) { return n.uuid === 'c2ma' || n.uuid === 'c2um' || child(n, 'c2pa.claim') || child(n, 'c2pa.claim.v2'); });
    if (!mans.length) return Promise.resolve({ manifests: [], active: null, n: 0 });
    var act = mans[mans.length - 1], env = { u8: jumbf, ranges: P.ranges, strict: P.strict, top: P.top };
    return Promise.all(mans.map(function (m) { return readManifest(store, file, m, m === act, env); })).then(function (list) { return { manifests: list, active: list[list.length - 1], n: list.length }; });
  }

  /* ---------- 보고서 ---------- */
  function stateOf(a) {
    var sigOk = a.sig ? a.sig.valid : null;
    if (!a.sig) return 'unsigned';
    if (sigOk === false) return 'signature_bad';
    if (a.hashedOk === false || a.codes.indexOf('ingredient.manifest.mismatch') >= 0) return 'tampered';
    if (a.binding === 'mismatch') return 'changed';
    if (a.binding === 'loose') return 'loose';
    if (sigOk === true && a.hashedOk === true && a.binding === 'ok') return 'valid';
    if (a.binding === 'unsupported') return 'signed_unbound';
    return 'incomplete';
  }
  function summarizeC2pa(c) {
    if (!c || !c.active) return null;
    var a = c.active, state = stateOf(a);
    return { state: state, ok: state === 'valid', generator: a.generator, title: a.title, signer: a.sig ? { org: a.sig.org, cn: a.sig.cn, issuer: a.sig.issuer, alg: a.sig.alg, notBefore: a.sig.notBefore, notAfter: a.sig.notAfter, tsa: a.sig.tsa, time: a.sig.time, chain: a.sig.chain, certs: a.sig.certs } : null,
      actions: a.actions, ingredients: a.ingredients, vendor: a.vendor, exif: a.exif, author: a.author, binding: a.binding, assertions: a.assertions.length, codes: a.codes.slice(0, 20), manifests: c.n, claimVersion: a.claimVersion,
      others: c.manifests.slice(0, -1).map(function (m) { return { label: m.label, generator: m.generator, signer: m.sig ? m.sig.org : '', sig: m.sig ? m.sig.valid : null, codes: m.codes.slice(0, 8), actions: m.actions.slice(0, 12), state: stateOf(m) }; }) };
  }

  function inspect(input, opts) {
    opts = opts || {};
    var u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
    var fmt = sniff(u8), kind = KIND[fmt] || 'other', P = pieces(u8, fmt);
    var rep = { v: VERSION, format: fmt, kind: kind, size: u8.length, name: clip(opts.name || '', 160), w: P.dims ? P.dims.w : 0, h: P.dims ? P.dims.h : 0, sha256: '', c2pa: null, xmp: null, exif: null, gen: null, strings: [], stripped: false, notes: [] };
    var exifs = P.exif.map(exifParse).filter(Boolean); rep.exif = exifs.length ? exifs.reduce(function (a, b) { for (var k in b) if (!a[k]) a[k] = b[k]; return a; }, {}) : null;
    rep.xmp = xmpParse(P.xmp);
    var G = { sdParams: false, comfy: false, invoke: false, novelai: false, mjJob: false, models: [], tools: [], texts: [], keys: [] };
    if (rep.exif && rep.exif.userComment) genInfo('userComment', rep.exif.userComment, G);
    P.com.forEach(function (s) { var c = clip(s, 160); if (c && rep.strings.length < 12) rep.strings.push(c); });
    var c2paRaw = null;
    return Promise.all([
      digest('sha256', u8).then(function (h) { rep.sha256 = hex(h); }),
      P.png.length ? pngTexts(P.png).then(function (list) {
        list.forEach(function (t) { if (!t) return; if (G.keys.indexOf(t.key) < 0) G.keys.push(t.key); if (t.key === 'XML:com.adobe.xmp' && !rep.xmp) rep.xmp = xmpParse([t.text]); genInfo(t.key, t.text, G); });
      }) : null,
      P.jumbf ? readC2pa(P.jumbf, u8, P).then(function (c) { c2paRaw = c; rep.c2pa = summarizeC2pa(c); if (!rep.c2pa) rep.notes.push('c2pa_unreadable'); }).catch(function (e) { rep.notes.push('c2pa_error'); }) : null
    ]).then(function () {
      if (G.keys.length || G.sdParams || G.comfy || G.invoke || G.novelai || G.mjJob) rep.gen = { sdParams: G.sdParams, comfy: G.comfy, invoke: G.invoke, novelai: G.novelai, mjJob: G.mjJob, models: G.models.slice(0, 6), tools: G.tools.slice(0, 6), keys: G.keys.slice(0, 24) };
      G.texts.slice(0, 8).forEach(function (s) { rep.strings.push('png.' + s); });
      if (rep.exif) ['software', 'artist', 'description', 'make', 'model', 'xpComment'].forEach(function (k) { if (rep.exif[k]) rep.strings.push('exif.' + k + ': ' + clip(rep.exif[k], 160)); });
      if (rep.xmp) { if (rep.xmp.creatorTool) rep.strings.push('xmp.CreatorTool: ' + rep.xmp.creatorTool); if (rep.xmp.credit) rep.strings.push('xmp.Credit: ' + rep.xmp.credit); if (rep.xmp.aiSystem) rep.strings.push('xmp.AISystemUsed: ' + rep.xmp.aiSystem); rep.xmp.agents.slice(0, 8).forEach(function (s) { rep.strings.push('xmp.agent: ' + s); }); if (rep.xmp.description) rep.strings.push('xmp.description: ' + rep.xmp.description); }
      rep.strings = rep.strings.filter(function (s, i, a) { return a.indexOf(s) === i; }).slice(0, 24);
      rep.stripped = !rep.c2pa && !rep.xmp && !rep.exif && !rep.gen && !P.com.length;
      if (P.jumbf && !rep.c2pa && rep.notes.indexOf('c2pa_unreadable') < 0) rep.notes.push('c2pa_unreadable');
      Object.defineProperty(rep, '_pack', { value: c2paRaw, enumerable: false });
      return rep;
    });
  }

  /* ---------- 서버 검증용 묶음 ---------- */
  function pack(rep) {
    var c = rep && rep._pack; if (!c || !c.manifests || !c.manifests.length) return null;
    var list = c.manifests.slice(-8), total = 0, out = { v: 1, fmt: rep.format, size: rep.size, sha256: rep.sha256, binding: c.active ? c.active.binding : '', active: c.active ? c.active.label : '', manifests: [] };
    for (var i = list.length - 1; i >= 0; i--) {   // 활성 기록부터 담음
      var m = list[i]; if (!m.pack || !m.pack.sig) continue;
      var as = {}, sz = m.pack.claim.length + m.pack.sig.length;
      Object.keys(m.pack.as).forEach(function (k) { sz += m.pack.as[k].length; });
      if (total + sz > 196608 && out.manifests.length) break;
      Object.keys(m.pack.as).forEach(function (k) { as[k] = b64(m.pack.as[k]); });
      out.manifests.unshift({ label: m.label, claim: b64(m.pack.claim), sig: b64(m.pack.sig), as: as });
      total += sz;
    }
    return out.manifests.length ? out : null;
  }

  /* ---------- 지각 해시(dHash, 칸 면적 평균) ---------- */
  function cover(n, m) { var out = []; for (var k = 0; k < m; k++) { var s = k * n / m, e = (k + 1) * n / m, ws = []; for (var i = Math.floor(s); i < e; i++) { var w = Math.min(e, i + 1) - Math.max(s, i); if (w > 0) ws.push([i, w]); } out.push(ws); } return out; }
  function dhash(img) {
    var W = img.width, H = img.height, d = img.data; if (!W || !H) return '';
    var wx = cover(W, 9), wy = cover(H, 8), g = [], bits = '', y, x;
    for (y = 0; y < 8; y++) for (x = 0; x < 9; x++) {
      var t = 0, ws = 0;
      for (var a = 0; a < wy[y].length; a++) for (var b = 0; b < wx[x].length; b++) { var pj = wy[y][a], pi = wx[x][b], o = (pj[0] * W + pi[0]) * 4, w = pj[1] * pi[1]; t += (0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2]) * w; ws += w; }
      g.push(t / ws);
    }
    for (y = 0; y < 8; y++) for (x = 0; x < 8; x++) bits += g[y * 9 + x] > g[y * 9 + x + 1] ? '1' : '0';
    var out = ''; for (var q = 0; q < 64; q += 4) out += parseInt(bits.slice(q, q + 4), 2).toString(16);
    return out;
  }
  function hamming(a, b) { if (!a || !b || a.length !== b.length) return 64; var n = 0; for (var i = 0; i < a.length; i++) { var x = parseInt(a.charAt(i), 16) ^ parseInt(b.charAt(i), 16); while (x) { n += x & 1; x >>= 1; } } return n; }

  /* ---------- 판정 서버에 보낼 특징값 ---------- */
  function features(rep, extra) {
    extra = extra || {};
    var c = rep.c2pa, f = { v: SCHEMA, lib: VERSION, kind: rep.kind, format: rep.format, size: rep.size, w: rep.w || extra.w || 0, h: rep.h || extra.h || 0, sha256: rep.sha256, dhash: extra.dhash || rep.dhash || '', stripped: !!rep.stripped };
    if (c) f.c2pa = { state: c.state, generator: c.generator.slice(0, 4), signer: c.signer ? { org: c.signer.org, cn: c.signer.cn, issuer: c.signer.issuer, alg: c.signer.alg, tsa: !!c.signer.tsa, time: c.signer.time || 0 } : null,
      actions: c.actions.slice(0, 24).map(function (a) { return { a: a.action, dst: a.dst, agent: a.agent, desc: a.desc ? a.desc.slice(0, 120) : '' }; }), ingredients: c.ingredients.slice(0, 12).map(function (i) { return { rel: i.relationship, dst: i.dst, m: !!i.hasManifest, v: i.validation.slice(0, 4) }; }),
      vendor: c.vendor.slice(0, 8), exif: c.exif, binding: c.binding, codes: c.codes.slice(0, 12), manifests: c.manifests, others: c.others.slice(-6).map(function (o) { return { gen: o.generator.slice(0, 2), signer: o.signer, sig: o.sig, state: o.state, acts: o.actions.slice(0, 6).map(function (a) { return { a: a.action, dst: a.dst, agent: a.agent }; }) }; }) };
    if (rep.xmp) f.xmp = { dst: rep.xmp.dst.slice(0, 6), creatorTool: rep.xmp.creatorTool, credit: rep.xmp.credit, aiSystem: rep.xmp.aiSystem, aiPrompt: rep.xmp.aiPrompt, agents: rep.xmp.agents.slice(0, 10), actions: rep.xmp.actions.slice(0, 12), aimarker: rep.xmp.aimarker ? { id: rep.xmp.aimarker.id } : null };
    if (rep.exif) f.exif = { make: rep.exif.make || '', model: rep.exif.model || '', software: rep.exif.software || '', lens: rep.exif.lensModel || '', dto: rep.exif.dateOriginal || '', exposure: !!(rep.exif.exposureTime || rep.exif.fNumber || rep.exif.iso), artist: rep.exif.artist ? clip(rep.exif.artist, 60) : '', description: rep.exif.description ? clip(rep.exif.description, 160) : '' };
    if (rep.gen) f.gen = rep.gen;
    f.strings = rep.strings.slice(0, 24);
    return f;
  }
  function normText(t) { var s = String(t == null ? '' : t).replace(/\r\n?/g, '\n').replace(/[​-‍﻿⁠­]/g, ''); if (s.normalize) s = s.normalize('NFC'); return s.trim(); }
  var DISCLOSE = /(?:AI|인공지능|생성형\s?AI|ChatGPT|챗\s?GPT|GPT|Claude|클로드|Gemini|제미나이|Copilot|코파일럿|뤼튼|Wrtn|하이퍼클로바|HyperCLOVA|클로바\s?X|퍼플렉시티|Perplexity|딥시크|DeepSeek)(?:[가-힣A-Za-z\s·,()-]{0,14}?)(?:로|으로|를|을|이|가|의|에게|와|과)?\s?(?:활용|사용|이용|도움)?(?:[가-힣\s]{0,8}?)(?:생성|작성|제작|만든|만들었|만들어|썼|쓴|써|정리|요약|번역|다듬|교정|초안)|AI[- ]?(?:generated|written|assisted)|(?:generated|written|created|drafted) (?:by|with|using) (?:AI|ChatGPT|Claude|Gemini)|made with AI/i;
  function textFeatures(text) {
    var raw = String(text == null ? '' : text), t = normText(raw), zw = /[​-‍﻿⁠]/.test(raw);
    return digest('sha256', enc(t)).then(function (h) { return { v: SCHEMA, lib: VERSION, kind: 'text', format: 'text', size: t.length, sha256: hex(h), zw: zw, disclosure: DISCLOSE.test(t) }; });
  }

  /* ---------- 표시본 만들기(XMP 넣기 · 출처 기록 떼기) ---------- */
  function xmlEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var DST_URI = 'http://cv.iptc.org/newscodes/digitalsourcetype/';
  function buildXmp(o) {
    o = o || {};
    var dst = o.dst ? '<Iptc4xmpExt:DigitalSourceType>' + xmlEsc(DST_URI + o.dst) + '</Iptc4xmpExt:DigitalSourceType>' : '';
    var sys = o.aiSystem ? '<Iptc4xmpExt:AISystemUsed>' + xmlEsc(o.aiSystem) + '</Iptc4xmpExt:AISystemUsed>' : '';
    var desc = o.note ? '<dc:description><rdf:Alt><rdf:li xml:lang="x-default">' + xmlEsc(o.note) + '</rdf:li></rdf:Alt></dc:description>' : '';
    return '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="AIMarker ' + VERSION + '"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
      '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:aimarker="https://aimarker.kr/ns/1.0/">' +
      dst + sys + desc + '<aimarker:Mark>' + xmlEsc(o.id || '') + '</aimarker:Mark><aimarker:Url>' + xmlEsc(o.url || '') + '</aimarker:Url><aimarker:Label>' + xmlEsc(o.label || '') + '</aimarker:Label><aimarker:Basis>' + xmlEsc(o.basis || '') + '</aimarker:Basis>' + (o.cred ? '<aimarker:Credential>' + xmlEsc(o.cred) + '</aimarker:Credential>' : '') +
      '</rdf:Description></rdf:RDF></x:xmpmeta>\n<?xpacket end="w"?>';
  }
  function crc32(u8) { var c, t = crc32.t; if (!t) { t = crc32.t = []; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } } c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = t[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function be32(n) { return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]); }
  function le32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
  /* 원본에 XMP 를 넣은 표시본(JPEG · PNG · WebP). 기존 XMP · C2PA 기록은 뺀다(바뀐 파일에 남으면 '변조'로 보이므로). */
  function embedXmp(input, xmp) {
    var u8 = input instanceof Uint8Array ? input : new Uint8Array(input), fmt = sniff(u8), x = enc(xmp), i, L;
    if (fmt === 'jpeg') {
      var head = enc('http://ns.adobe.com/xap/1.0/\u0000'); if (head.length + x.length + 2 > 65535) throw new Error('XMP_TOO_BIG');
      var seg = concat([new Uint8Array([0xFF, 0xE1, (head.length + x.length + 2) >> 8, (head.length + x.length + 2) & 255]), head, x]);
      var parts = [u8.subarray(0, 2)], inserted = false; i = 2;
      while (i + 4 <= u8.length) {
        if (u8[i] !== 0xFF) break;
        var m = u8[i + 1];
        if (m === 0xDA || m === 0xD9) break;
        L = u16(u8, i + 2); var st = i + 4, en = i + 2 + L; if (en > u8.length) break;
        var drop = (m === 0xEB && u8[st] === 0x4A && u8[st + 1] === 0x50) || (m === 0xE1 && latin1(u8, st, st + 29) === 'http://ns.adobe.com/xap/1.0/\u0000') || (m === 0xE1 && latin1(u8, st, st + 35) === 'http://ns.adobe.com/xmp/extension/\u0000');
        if (!inserted && m !== 0xE0 && !(m === 0xE1 && latin1(u8, st, st + 6) === 'Exif\u0000\u0000')) { parts.push(seg); inserted = true; }
        if (!drop) parts.push(u8.subarray(i, en));
        i = en;
      }
      if (!inserted) parts.push(seg);
      parts.push(u8.subarray(i));
      return concat(parts);
    }
    if (fmt === 'png') {
      var kw = enc('XML:com.adobe.xmp'), body = concat([kw, new Uint8Array([0, 0, 0, 0, 0]), x]), tp = enc('iTXt');
      var chunk = concat([be32(body.length), tp, body, be32(crc32(concat([tp, body])))]);
      var pp = [u8.subarray(0, 8)], done = false; i = 8;
      while (i + 12 <= u8.length) {
        L = u32(u8, i); var t2 = latin1(u8, i + 4, i + 8), e2 = i + 12 + L; if (e2 > u8.length) break;
        var isXmp = t2 === 'iTXt' && latin1(u8, i + 8, i + 8 + 18) === 'XML:com.adobe.xmp\u0000';
        if (!done && (t2 === 'IDAT' || t2 === 'IEND')) { pp.push(chunk); done = true; }
        if (t2 !== 'caBX' && !isXmp) pp.push(u8.subarray(i, e2));
        i = e2; if (t2 === 'IEND') break;
      }
      return concat(pp);
    }
    if (fmt === 'webp') {
      var chunks = [], vp8x = null, w = 0, h = 0, hasAlpha = false, anim = false; i = 12;
      while (i + 8 <= u8.length) {
        var fc = latin1(u8, i, i + 4), sz = u32le(u8, i + 4), s2 = i + 8, e3 = s2 + sz + (sz % 2); if (s2 + sz > u8.length) break;
        if (fc === 'VP8X') { vp8x = u8.slice(s2, s2 + 10); w = 1 + (u8[s2 + 4] | (u8[s2 + 5] << 8) | (u8[s2 + 6] << 16)); h = 1 + (u8[s2 + 7] | (u8[s2 + 8] << 8) | (u8[s2 + 9] << 16)); }
        else if (fc !== 'XMP ' && fc !== 'C2PA') { chunks.push(u8.subarray(i, e3)); if (fc === 'VP8 ' && !w) { w = (u8[s2 + 6] | (u8[s2 + 7] << 8)) & 0x3fff; h = (u8[s2 + 8] | (u8[s2 + 9] << 8)) & 0x3fff; } if (fc === 'VP8L' && !w) { var c0 = u8[s2 + 1], c1 = u8[s2 + 2], c2 = u8[s2 + 3], c3 = u8[s2 + 4]; w = 1 + (((c1 & 0x3f) << 8) | c0); h = 1 + (((c3 & 0xf) << 10) | (c2 << 2) | ((c1 & 0xc0) >> 6)); hasAlpha = !!(c3 & 0x10); } if (fc === 'ALPH') hasAlpha = true; if (fc === 'ANIM') anim = true; }
        i = e3;
      }
      if (!vp8x) { vp8x = new Uint8Array(10); vp8x[4] = (w - 1) & 255; vp8x[5] = ((w - 1) >> 8) & 255; vp8x[6] = ((w - 1) >> 16) & 255; vp8x[7] = (h - 1) & 255; vp8x[8] = ((h - 1) >> 8) & 255; vp8x[9] = ((h - 1) >> 16) & 255; if (hasAlpha) vp8x[0] |= 0x10; if (anim) vp8x[0] |= 0x02; }
      vp8x[0] |= 0x04;
      var xc = concat([enc('XMP '), le32(x.length), x, x.length % 2 ? new Uint8Array(1) : new Uint8Array(0)]);
      var bodyW = concat([enc('WEBP'), enc('VP8X'), le32(10), vp8x].concat(chunks).concat([xc]));
      return concat([enc('RIFF'), le32(bodyW.length), bodyW]);
    }
    throw new Error('FORMAT_UNSUPPORTED');
  }

  /* ---------- AIMarker 마크 서명 확인(JWS compact · EdDSA/Ed25519) ----------
   * keys: 공개키 JWK 배열(https://aimarker.kr/.well-known/aimarker-keys.json 의 keys). 브라우저가 Ed25519 를 지원하면 WebCrypto,
   * 아니면 아래 BigInt 계산으로 확인한다. 돌려줌: {ok, kid, payload, reason} */
  function b64uDec(s) { s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return unb64(s); }
  function utf8(u8) { try { return typeof TextDecoder !== 'undefined' ? new TextDecoder().decode(u8) : Buffer.from(u8).toString('utf8'); } catch (e) { return ''; } }
  var ED = null;
  function edC() {
    if (ED) return ED;
    var B = BigInt, p = (B(1) << B(255)) - B(19);
    function md(a) { var r = a % p; return r < B(0) ? r + p : r; }
    function pw(b, e) { var r = B(1); b = md(b); while (e > B(0)) { if (e & B(1)) r = r * b % p; e >>= B(1); b = b * b % p; } return r; }
    var d = md(B(-121665) * pw(B(121666), p - B(2))), I = pw(B(2), (p - B(1)) / B(4));
    var gx = B('15112221349535400772501151409588531511454012693041857206046113283949847762202'), gy = B('46316835694926478169428394003475163141307993866256225615783033603165251855960');
    ED = { B: B, p: p, d: d, I: I, L: (B(1) << B(252)) + B('27742317777372353535851937790883648493'), G: [gx, gy, B(1), gx * gy % p], md: md, pw: pw };
    return ED;
  }
  function edAdd(P, Q) { var E = edC(), p = E.p, md = E.md, B = E.B, A = md((P[1] - P[0]) * (Q[1] - Q[0])), Bb = (P[1] + P[0]) * (Q[1] + Q[0]) % p, C = B(2) * P[3] * Q[3] % p * E.d % p, D = B(2) * P[2] * Q[2] % p, e = md(Bb - A), f = md(D - C), g = (D + C) % p, h = (Bb + A) % p; return [e * f % p, g * h % p, f * g % p, e * h % p]; }
  function edMul(s, P) { var B = edC().B, Q = [B(0), B(1), B(1), B(0)]; while (s > B(0)) { if (s & B(1)) Q = edAdd(Q, P); P = edAdd(P, P); s >>= B(1); } return Q; }
  function le(u8) { var B = edC().B, x = B(0); for (var i = u8.length - 1; i >= 0; i--) x = (x << B(8)) + B(u8[i]); return x; }
  function edDec(b) {
    var E = edC(), B = E.B, p = E.p, md = E.md, bb = new Uint8Array(b), sign = bb[31] >> 7; bb[31] &= 0x7f; var y = le(bb); if (y >= p) return null;
    var y2 = y * y % p, x2 = md((y2 - B(1)) * E.pw(E.d * y2 + B(1), p - B(2))), x = E.pw(x2, (p + B(3)) / B(8));
    if (md(x * x - x2) !== B(0)) x = x * E.I % p;
    if (md(x * x - x2) !== B(0)) return null;
    if (Number(x & B(1)) !== sign) x = p - x;
    return [x, y, B(1), x * y % p];
  }
  function edVerifyJs(pub, msg, sig) {
    if (typeof BigInt === 'undefined' || pub.length !== 32 || sig.length !== 64) return Promise.resolve(false);
    var E = edC(), B = E.B, A = edDec(pub), R = edDec(sig.subarray(0, 32)); if (!A || !R) return Promise.resolve(false);
    var S = le(sig.subarray(32)); if (S >= E.L) return Promise.resolve(false);
    return digest('sha512', concat([sig.subarray(0, 32), pub, msg])).then(function (h) {
      var k = le(h) % E.L, l = edMul(S, E.G), r = edAdd(R, edMul(k, A)), p = E.p, md = E.md;
      return md(l[0] * r[2] - r[0] * l[2]) === B(0) && md(l[1] * r[2] - r[1] * l[2]) === B(0);
    });
  }
  function verifyMark(jws, keys) {
    var parts = String(jws || '').split('.'), out = { ok: false, kid: '', payload: null, reason: '' };
    if (parts.length !== 3) { out.reason = 'format'; return Promise.resolve(out); }
    var head, body;
    try { head = JSON.parse(utf8(b64uDec(parts[0]))); body = JSON.parse(utf8(b64uDec(parts[1]))); } catch (e) { out.reason = 'format'; return Promise.resolve(out); }
    out.kid = head.kid || ''; out.payload = body;
    if (head.alg !== 'EdDSA') { out.reason = 'alg'; return Promise.resolve(out); }
    var k = (keys || []).filter(function (x) { return x && x.kid === head.kid && x.crv === 'Ed25519' && x.x; })[0];
    if (!k) { out.reason = 'unknown_key'; return Promise.resolve(out); }
    if (body.iss !== 'https://aimarker.kr') { out.reason = 'issuer'; return Promise.resolve(out); }
    var pub = b64uDec(k.x), msg = enc(parts[0] + '.' + parts[1]), sig = b64uDec(parts[2]), s = subtle();
    var web = s ? s.importKey('raw', pub, { name: 'Ed25519' }, false, ['verify']).then(function (key) { return s.verify({ name: 'Ed25519' }, key, sig, msg); }) : Promise.reject(new Error('no'));
    return web.catch(function () { return edVerifyJs(pub, msg, sig); }).then(function (v) { out.ok = v === true; if (!out.ok) out.reason = 'signature'; return out; });
  }

  /* ---------- 브라우저 도우미 ---------- */
  function fileBytes(file) { return file.arrayBuffer ? file.arrayBuffer().then(function (b) { return new Uint8Array(b); }) : new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(new Uint8Array(r.result)); }; r.onerror = no; r.readAsArrayBuffer(file); }); }
  function pixels(src) {
    if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') return Promise.resolve(null);
    return createImageBitmap(src).then(function (bm) {
      var W = bm.width, H = bm.height, k = Math.min(1, 1600 / Math.max(W, H)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(W * k)); c.height = Math.max(1, Math.round(H * k));
      var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(bm, 0, 0, c.width, c.height);
      var d = x.getImageData(0, 0, c.width, c.height); if (bm.close) bm.close();
      return { width: d.width, height: d.height, data: d.data, w: W, h: H };
    }).catch(function () { return null; });
  }
  function inspectFile(file) {
    return fileBytes(file).then(function (u8) {
      var isImg = /^image\//.test(file.type || '') || /\.(jpe?g|png|webp|gif|avif|heic|bmp)$/i.test(file.name || '');
      return Promise.all([inspect(u8, { name: file.name }), isImg ? pixels(file) : null]).then(function (r) {
        var rep = r[0], px = r[1], dh = px ? dhash(px) : '';
        if (px && !rep.w) { rep.w = px.w; rep.h = px.h; }
        rep.dhash = dh;
        return { bytes: u8, report: rep, features: features(rep, { dhash: dh, w: px ? px.w : 0, h: px ? px.h : 0 }), pack: pack(rep) };
      });
    });
  }

  return { VERSION: VERSION, SCHEMA: SCHEMA, sniff: sniff, inspect: inspect, features: features, pack: pack, textFeatures: textFeatures, normText: normText, dhash: dhash, hamming: hamming, inspectFile: inspectFile, fileBytes: fileBytes, pixels: pixels, buildXmp: buildXmp, embedXmp: embedXmp, verifyMark: verifyMark, _edVerifyJs: edVerifyJs,
    _cbor: cbor, _x509: x509, _hex: hex, _b64: b64, _unb64: unb64, _boxList: boxList, _jumbTree: jumbTree };
});
  return module.exports;
})();

export class AIMarkerError extends Error {
  constructor(code, message, body) { super(message); this.name = 'AIMarkerError'; this.code = code; this.body = body || null; }
}

export class AIMarker {
  /** @param {{ key: string, url?: string, timeoutMs?: number }} opts */
  constructor(opts = {}) {
    this.key = String(opts.key || '').trim();
    this.url = opts.url || DEFAULT_URL;
    this.timeoutMs = opts.timeoutMs || 90000;
    if (!this.key) throw new AIMarkerError('KEY', 'API 키가 필요합니다. https://aimarker.kr/developers/#key');
  }

  /** 모든 요청은 같은 주소로 POST 하고 action 으로 동작을 고릅니다(302 넘겨주기를 따라감). 실패하면 AIMarkerError(code · body). */
  async call(action, body = {}) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, key: this.key, ...body }), redirect: 'follow', signal: ctl.signal });
      const txt = await res.text();
      let j; try { j = JSON.parse(txt); } catch { throw new AIMarkerError('HTTP', 'AIMarker 응답을 읽지 못했습니다(HTTP ' + res.status + ')'); }
      if (!j.ok) throw new AIMarkerError(j.code || 'ERROR', j.message || j.msg || '요청을 처리하지 못했습니다', j);
      return j;
    } finally { clearTimeout(t); }
  }

  /* ---------- 핵심: AI 사용 확인 · 마크 ---------- */
  /** 파일 바이트 → 특징값 · 서명 검증용 조각(원본은 보내지 않음). dhash 를 알면 넣으세요(비슷한 이미지 찾기). */
  static async features(bytes, { name = '', dhash = '' } = {}) {
    const rep = await AIMExtract.inspect(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), { name });
    return { features: AIMExtract.features(rep, { dhash }), pack: AIMExtract.pack(rep), report: rep };
  }
  /** 글 → 해시와 AI 활용 표현 여부(원문은 보내지 않음) */
  static textFeatures(text) { return AIMExtract.textFeatures(text).then((features) => ({ features, pack: null })); }
  /** RGBA 픽셀(sharp 의 raw() 등)로 지각 해시. 긴 변 1,600px 이하로 줄여 넣으면 사이트와 같은 값이 나옵니다. */
  static dhash(width, height, rgba) { return AIMExtract.dhash({ width, height, data: rgba }); }

  async _input(input) {
    if (input && input.features) return { features: input.features, pack: input.pack || null };
    if (input && typeof input.text === 'string') return AIMarker.textFeatures(input.text);
    if (input && input.bytes) return AIMarker.features(input.bytes, { name: input.name, dhash: input.dhash });
    throw new AIMarkerError('INPUT', '{ bytes, name } · { text } · { features, pack } 가운데 하나를 넣어 주세요.');
  }
  /** 파일의 AI 사용 확인: verdict { ai, scope, basis, allowed, suggest } · signals · signer · registry */
  async analyzeFile(bytes, { name = '', dhash = '' } = {}) { const x = await AIMarker.features(bytes, { name, dhash }); return this.call('am.analyze', { features: x.features, pack: x.pack || undefined }); }
  /** 글의 확인(해시 · 표현만) */
  async analyzeText(text) { const x = await AIMarker.textFeatures(text); return this.call('am.analyze', { features: x.features }); }
  /**
   * 마크 발급. input: { bytes, name, dhash? } | { text } | { features, pack }
   * label: 'auto'(근거로 정함 · 근거 없으면 DECLARE 오류) | 'ai_generated' | 'ai_edited' | 'ai_assisted' | 'no_ai'
   * 근거와 맞지 않으면 CONFLICT, 비슷한 이미지에 AI 마크가 있으면 CONFIRM(사용자 확인 뒤 confirm: true) 오류.
   * 돌려줌: id · url · key(관리 키, 한 번만) · cred(JWS) · kid · label · basis · ledger · xmp
   */
  async mark(input, { label = 'auto', tools = [], title = '', issuer = '', confirm = false } = {}) {
    const x = await this._input(input);
    if (label === 'auto') {
      const a = await this.call('am.analyze', { features: x.features, pack: x.pack || undefined });
      if (!a.verdict || !a.verdict.suggest) throw new AIMarkerError('DECLARE', '파일에 AI 사용 근거가 없어 표시를 자동으로 정할 수 없습니다. 사용자에게 AI 사용 여부를 물어 label 을 정해 주세요.', { allowed: a.verdict ? a.verdict.allowed : LABELS, analysis: a });
      label = a.verdict.suggest;
    }
    return this.call('am.mark', { features: x.features, pack: x.pack || undefined, label, tools, title, issuer, confirm });
  }
  /** 20개까지 한 번에. items: [{ bytes, name } | { text } | { features, pack }, label?, tools?, title?, ref? ] · label 기본 auto(근거 없으면 그 항목만 DECLARE) */
  async markBatch(items, { issuer = '' } = {}) {
    const out = [];
    for (const it of items.slice(0, 20)) { const x = await this._input(it); out.push({ ref: it.ref || it.name || '', features: x.features, pack: x.pack || undefined, label: it.label || 'auto', tools: it.tools || [], title: it.title || '' }); }
    return this.call('am.markbatch', { items: out, issuer });
  }
  /** 마크 정보(누구나) */
  markInfo(id) { return this.call('am.markinfo', { id }); }
  /** 같은 파일 · 표시본 · 비슷한 이미지의 마크 찾기 */
  lookup({ sha256, dhash } = {}) { return this.call('am.lookup', { sha256, dhash }); }
  /** 관리 키로 바꾸기: { label, title, issuer, alt: [표시본 SHA-256], revoke: '이유' } */
  markEdit(id, key, changes = {}) { return this.call('am.markedit', { id, ...changes, mkey: key }); }   // API 키는 key, 관리 키는 mkey
  /** 마크 서명 공개키 */
  pubkey() { return this.call('am.pubkey', {}); }
  /** 공개 앵커: { date: 'YYYY-MM-DD' } | { id: 'LG…' } | {}(최근 목록) */
  anchor(q = {}) { return this.call('am.anchor', q); }

  /** 마크 서명(JWS) 확인. keys 를 주지 않으면 aimarker.kr 공개키를 받아 씀. → { ok, kid, payload, reason } */
  static async verifyMark(jws, keys) {
    if (!keys) {
      try { const r = await fetch(KEYS_URL); keys = r.ok ? (await r.json()).keys : []; } catch { keys = []; }
    }
    return AIMExtract.verifyMark(jws, keys);
  }
  /** 마크를 넣은 표시본(JPEG · PNG): 파일 안 XMP 에 마크 번호 · 확인 주소 · 표시 · 근거 · 서명을 넣음 */
  static embedMark(bytes, m) {
    const xmp = AIMExtract.buildXmp({ id: m.id, url: m.url, label: m.label, basis: m.basis, cred: m.cred, dst: m.xmp && m.xmp.dst, aiSystem: m.xmp && m.xmp.aiSystem, note: (LABEL_KO[m.label] || m.label) + ' · AIMarker ' + m.id + ' · ' + m.url });
    return AIMExtract.embedXmp(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), xmp);
  }
  /** 웹 페이지에 붙이는 배지 HTML */
  static badgeHtml(m) { return '<a class="aimarker-mark" href="' + m.url + '" data-id="' + m.id + '" data-label="' + m.label + '" data-basis="' + m.basis + '">' + (LABEL_KO[m.label] || m.label) + ' · AIMarker</a><script src="https://aimarker.kr/m/embed.js" async></script>'; }

  /* ---------- 부가 기능: 광고 문구 검수 · 승인 · 원장 ---------- */
  /** 문구 하나 검수. ind: 'auto'|'gen'|'food'|'hfood'|'cos'|'med'|'fin' · flags: { sponsored, aiPerson, aiMedia } · guide: { ban:[], must:[] } */
  async check(text, { ind = '', flags = {}, guide } = {}) {
    const r = await this.call('am.check', { text, ind: ind === 'auto' ? '' : ind, flags, guide });
    return Object.assign(r, { text });
  }
  /** 검수 · 고치기 · 다시 검수를 서버에서 끝까지(outcome: pass | fixed | return) */
  auto(text, { ind = '', flags = {}, guide, stamp = false } = {}) { return this.call('am.auto', { text, ind: ind === 'auto' ? '' : ind, flags, guide, stamp }); }
  /** 20건까지 한 번에. items: [{ id, text, ind, flags }] */
  batch(items, { guide } = {}) { return this.call('am.batch', { items: items.map((it) => ({ ...it, ind: it.ind === 'auto' ? '' : it.ind || '' })), guide }); }
  /** 표시 문구. kind: 'image'|'video'|'person'|'text'|'sponsor' · level: 'gen'|'edit' */
  label(kind, level = 'gen') { return this.call('am.label', { kind, level }); }
  /** 사이트 진단(10~20초) */
  scan(url) { return this.call('am.scan', { url }); }
  /** 광고주 승인 링크(90일 보관). data: { title, brand, channel, ind, copy, score, dec, fnd, h } */
  share(data) { return this.call('am.share', { data }); }
  /** 승인 상태. ids: ['AP…'] */
  status(ids) { return this.call('am.status', { ids }); }
  /** 증거 원장 기록: 내용 대신 SHA-256 만 보냅니다. kind: 'report'|'version'|'approval' */
  async stamp(content, { kind = 'report', count } = {}) { return this.call('am.stamp', { h: await AIMarker.sha256(content), k: kind, n: count }); }
  /** 원장 확인: { id } 또는 { content } 또는 { sha256 } */
  async verify({ id, content, sha256 } = {}) { return this.call('am.verify', id ? { id } : { h: sha256 || (await AIMarker.sha256(content)) }); }

  /** 바꿀 말이 있는 후보와 빠진 표시만 반영한 문구(빼기 · 바꿀 말 없는 후보는 사람에게 남김) */
  static applyFixes(text, findings = []) {
    const fix = (t, f, rep) => {
      if (f.s >= 0) { if (t.slice(f.s, f.e) !== f.t) return t; const b = f.re && f.re >= f.e ? f.re : f.e; return (t.slice(0, f.s) + rep + t.slice(b)).replace(/[ \t]{2,}/g, ' ').replace(/ ([,.!?])/g, '$1'); }
      if (t.includes(rep.trim())) return t;
      if (/^[\[(]/.test(rep)) { const m = /^\s*/.exec(t)[0]; return m + rep + t.slice(m.length); }
      return t.replace(/\s+$/, '') + rep;
    };
    let at = Infinity;
    findings.filter((f) => f.s >= 0 && (f.reps || []).some((r) => r && r !== '(삭제)')).sort((a, b) => b.s - a.s).forEach((f) => {
      if ((f.re || f.e) > at) return; const t2 = fix(text, f, f.reps.find((r) => r && r !== '(삭제)')); if (t2 !== text) { text = t2; at = f.s; }
    });
    findings.filter((f) => f.s < 0 && f.reps && f.reps[0]).forEach((f) => { text = fix(text, f, f.reps[0]); });
    return text;
  }
  /** 글 · 바이트의 SHA-256(소문자 16진수) */
  static async sha256(s) {
    const u = s instanceof Uint8Array ? s : s instanceof ArrayBuffer ? new Uint8Array(s) : new TextEncoder().encode(String(s));
    const b = await crypto.subtle.digest('SHA-256', u);
    return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
  }
}
export default AIMarker;
