#!/usr/bin/env node
/*
 * AIMarker MCP 서버 2.0.0 · https://aimarker.kr/developers/#mcp
 * AI 에이전트(Claude · Cursor · VS Code · Codex 등)가 이미지 · 영상 · 오디오 · 글의 AI 사용 여부를
 * 파일 속 근거로 확인하고, 근거에 맞는 서명된 AIMarker 마크를 발급 · 확인하게 합니다.
 *
 * - 파일은 이 컴퓨터에서 읽습니다(출처 판독기 aim-extract 내장). 서버에는 특징값 · 해시 · 서명 검증용 출처 기록 조각만 갑니다.
 *   원본 파일 · 픽셀 · 글 원문은 보내지 않습니다(글은 해시만).
 * - 마크 서명(Ed25519 · JWS)은 이 컴퓨터에서 공개키로 확인합니다.
 * - 부가 기능: 광고 문구 검수 · 자동 수정 · 표시 문구 · 사이트 진단 · 광고주 승인 링크 · 증거 원장.
 *
 * 실행: AIMARKER_KEY=amk_... npx -y https://aimarker.kr/mcp/aimarker-mcp-2.0.0.tgz
 * 또는:  AIMARKER_KEY=amk_... node aimarker-mcp.mjs
 * 필요: Node.js 18 이상. 의존성 없음(sharp 가 있으면 비슷한 이미지 찾기용 지각 해시도 만듭니다). 표준 입출력(stdio) MCP.
 *
 * 마크는 표시와 근거를 기록하고 서명한 것이며 법적 인증이 아닙니다. 광고 검수 결과는 위험 후보와 근거이며 법률 자문이 아닙니다.
 */
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';
import { readFile, writeFile, stat, mkdir, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const VERSION = '2.2.0';
const API = process.env.AIMARKER_URL || 'https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec';
const SITE = 'https://aimarker.kr';
const KEYS_URL = process.env.AIMARKER_KEYS_URL || SITE + '/.well-known/aimarker-keys.json';
const KEY = String(process.env.AIMARKER_KEY || '').trim();
const TIMEOUT = Number(process.env.AIMARKER_TIMEOUT_MS) || 90000;
const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_FILE = 300 * 1024 * 1024;

/* ---------- 출처 판독기 aim-extract(내장) ---------- */
const AIM = (() => {
  const module = { exports: {} }, exports = module.exports, require = createRequire(import.meta.url);   // eslint-disable-line no-unused-vars
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
  var VERSION = '1.3.0', SCHEMA = 1;

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
    if (u8[0] === 0xD0 && u8[1] === 0xCF && u8[2] === 0x11 && u8[3] === 0xE0 && u8[4] === 0xA1 && u8[5] === 0xB1 && u8[6] === 0x1A && u8[7] === 0xE1) return 'ole';   // 1.3.0 HWP · DOC · XLS · PPT
    var head = latin1(u8, 0, Math.min(u8.length, 1024)).replace(/^﻿/, '').trim();
    if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return 'svg';
    return 'other';
  }
  var KIND = { jpeg: 'image', png: 'image', webp: 'image', gif: 'image', heic: 'image', avif: 'image', tiff: 'image', jxl: 'image', svg: 'image', cr3: 'image', mp4: 'video', mov: 'video', avi: 'video', m4a: 'audio', mp3: 'audio', wav: 'audio', flac: 'audio', pdf: 'doc', zip: 'other', docx: 'doc', pptx: 'doc', xlsx: 'doc', hwpx: 'doc', odt: 'doc', ods: 'doc', odp: 'doc', epub: 'doc', ole: 'doc', hwp: 'doc', doc: 'doc', xls: 'doc', ppt: 'doc', other: 'other' };
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
    if (fmt === 'none') return out;   // 1.3.0 문서 꾸러미 · 옛 오피스 문서: 안에 든 그림의 기록을 문서 기록으로 잘못 읽지 않게(그림은 따로 확인)
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
    var fmt = sniff(u8), zdir = null, P;
    if (fmt === 'zip' && !opts.nested) { zdir = zipDir(u8); if (zdir) fmt = zipKind(u8, zdir); }   // 1.3.0 DOCX · PPTX · XLSX · HWPX · ODF · EPUB
    if (fmt === 'ole') { var ext = String(opts.name || '').toLowerCase().replace(/^.*\./, ''); fmt = { hwp: 'hwp', doc: 'doc', xls: 'xls', ppt: 'ppt' }[ext] || 'ole'; }
    var kind = KIND[fmt] || 'other'; P = pieces(u8, fmt === 'zip' || (kind === 'doc' && fmt !== 'pdf') ? 'none' : fmt);
    var rep = { v: VERSION, format: fmt, kind: kind, size: u8.length, name: clip(opts.name || '', 160), w: P.dims ? P.dims.w : 0, h: P.dims ? P.dims.h : 0, sha256: '', c2pa: null, xmp: null, exif: null, gen: null, strings: [], stripped: false, notes: [] };
    var exifs = P.exif.map(exifParse).filter(Boolean); rep.exif = exifs.length ? exifs.reduce(function (a, b) { for (var k in b) if (!a[k]) a[k] = b[k]; return a; }, {}) : null;
    rep.xmp = xmpParse(P.xmp);
    var G = { sdParams: false, comfy: false, invoke: false, novelai: false, mjJob: false, models: [], tools: [], texts: [], keys: [] };
    if (rep.exif && rep.exif.userComment) genInfo('userComment', rep.exif.userComment, G);
    P.com.forEach(function (s) { var c = clip(s, 160); if (c && rep.strings.length < 12) rep.strings.push(c); });
    var c2paRaw = null;
    return Promise.all([
      digest('sha256', u8).then(function (h) { rep.sha256 = hex(h); }),
      zdir && OFFICE[fmt] ? officeProps(u8, zdir, fmt).then(function (d) { rep.doc = d; if (d.aimarker) rep.xmp = { dst: [], creatorTool: '', credit: '', agents: [], actions: [], description: '', aiSystem: '', aiPrompt: false, provenance: false, aimarker: d.aimarker, rawLen: 0, office: true }; }).catch(function () { rep.doc = { name: DOC_NAME[fmt] || '', app: '' }; }) : null,
      zdir && OFFICE[fmt] && opts.parts !== false ? docParts(u8, zdir).then(function (x) { rep.parts = x.items; rep.partCount = x.count; }).catch(function () { rep.parts = []; }) : null,
      zdir && fmt === 'zip' ? Promise.resolve().then(function () { rep.zip = { entries: zdir.list.filter(function (e) { return !/\/$/.test(e.name); }).length }; }) : null,
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
      rep.stripped = (kind === 'image' || kind === 'video' || kind === 'audio') && !rep.c2pa && !rep.xmp && !rep.exif && !rep.gen && !P.com.length;   // 문서 · 압축 파일 등은 원래 AI 출처 기록이 없는 형식이라 '지워짐'으로 보지 않음
      if (kind === 'doc' && !rep.doc) rep.doc = { name: DOC_NAME[fmt] || '', app: '' };
      if (rep.doc && rep.doc.app) rep.strings.push('doc.app: ' + rep.doc.app + (rep.doc.appVersion ? ' ' + rep.doc.appVersion : ''));
      if (rep.doc && rep.doc.generator) rep.strings.push('doc.generator: ' + rep.doc.generator);
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

  /* ---------- 1.3.0 문서 꾸러미(ZIP 바탕: DOCX · PPTX · XLSX · HWPX · ODF · EPUB) ---------- */
  var OFFICE = { docx: 'ooxml', pptx: 'ooxml', xlsx: 'ooxml', hwpx: 'hwpx', odt: 'odf', ods: 'odf', odp: 'odf', epub: 'epub' };
  var DOC_NAME = { docx: 'Word 문서', pptx: 'PowerPoint 발표 자료', xlsx: 'Excel 통합 문서', hwpx: '한글 문서', odt: 'ODF 문서', ods: 'ODF 스프레드시트', odp: 'ODF 프레젠테이션', epub: '전자책', pdf: 'PDF 문서', hwp: '한글 문서', doc: 'Word 문서(97-2003)', xls: 'Excel 통합 문서(97-2003)', ppt: 'PowerPoint 발표 자료(97-2003)', ole: '오피스 문서(97-2003)', zip: '압축 파일' };
  function le16(u8, i) { return u8[i] | (u8[i + 1] << 8); }
  function le16b(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
  function zipDir(u8) {
    var n = u8.length, stop = Math.max(0, n - 65557), e = -1, i;
    for (i = n - 22; i >= stop; i--) if (u8[i] === 0x50 && u8[i + 1] === 0x4B && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) { e = i; break; }
    if (e < 0) return null;
    var count = le16(u8, e + 10), size = u32le(u8, e + 12), off = u32le(u8, e + 16), z64 = false;
    if (count === 0xFFFF || size === 0xFFFFFFFF || off === 0xFFFFFFFF) {
      var L = e - 20; if (L < 0 || u32le(u8, L) !== 0x07064b50) return null;
      var z = u32le(u8, L + 8) + u32le(u8, L + 12) * 4294967296; if (z + 56 > n || u32le(u8, z) !== 0x06064b50) return null;
      count = u32le(u8, z + 32) + u32le(u8, z + 36) * 4294967296; size = u32le(u8, z + 40) + u32le(u8, z + 44) * 4294967296; off = u32le(u8, z + 48) + u32le(u8, z + 52) * 4294967296; z64 = true;
    }
    if (off + size > n) return null;
    var list = [], p = off, end = off + size;
    while (p + 46 <= end && u32le(u8, p) === 0x02014b50 && list.length < 20000) {
      var nl = le16(u8, p + 28), xl = le16(u8, p + 30), cl = le16(u8, p + 32), flags = le16(u8, p + 8), nameB = u8.slice(p + 46, p + 46 + nl);
      var ent = { name: flags & 0x800 ? utf8(nameB) : latin1(nameB), nameB: nameB, flags: flags, made: le16(u8, p + 4), need: le16(u8, p + 6), method: le16(u8, p + 10), time: le16(u8, p + 12), date: le16(u8, p + 14),
        crc: u32le(u8, p + 16), csize: u32le(u8, p + 20), usize: u32le(u8, p + 24), iattr: le16(u8, p + 36), ext: u32le(u8, p + 38), lho: u32le(u8, p + 42), z64: false };
      if (ent.usize === 0xFFFFFFFF || ent.csize === 0xFFFFFFFF || ent.lho === 0xFFFFFFFF) {   // ZIP64 덧붙임 칸
        var x = p + 46 + nl, xe = x + xl;
        while (x + 4 <= xe) {
          var id = le16(u8, x), sz = le16(u8, x + 2), q = x + 4;
          if (id === 1) { var rd = function () { var v = u32le(u8, q) + u32le(u8, q + 4) * 4294967296; q += 8; return v; }; if (ent.usize === 0xFFFFFFFF) ent.usize = rd(); if (ent.csize === 0xFFFFFFFF) ent.csize = rd(); if (ent.lho === 0xFFFFFFFF) ent.lho = rd(); }
          x += 4 + sz;
        }
        ent.z64 = true;
      }
      list.push(ent); p += 46 + nl + xl + cl;
    }
    if (!list.length) return null;
    var by = {}; list.forEach(function (t) { if (!by[t.name]) by[t.name] = t; });
    return { list: list, by: by, z64: z64 || list.some(function (t) { return t.z64; }), count: count };
  }
  function zipLocal(u8, e) { var p = e.lho; if (p + 30 > u8.length || u32le(u8, p) !== 0x04034b50) return -1; return p + 30 + le16(u8, p + 26) + le16(u8, p + 28); }
  function zipRaw(u8, e) { var s = zipLocal(u8, e); if (s < 0 || s + e.csize > u8.length) return null; return u8.subarray(s, s + e.csize); }
  function zflow(Ctor, u8, node) {
    if (Ctor && typeof Blob !== 'undefined' && typeof Response !== 'undefined') {
      try { return new Response(new Blob([u8]).stream().pipeThrough(new Ctor('deflate-raw'))).arrayBuffer().then(function (b) { return new Uint8Array(b); }); } catch (e) { /* 아래로 */ }
    }
    try { return Promise.resolve(new Uint8Array(require('zlib')[node](u8))); } catch (e2) { return Promise.reject(new Error('NO_ZLIB')); }
  }
  function inflateRaw(u8) { return zflow(typeof DecompressionStream !== 'undefined' ? DecompressionStream : null, u8, 'inflateRawSync'); }
  function deflateRaw(u8) { return zflow(typeof CompressionStream !== 'undefined' ? CompressionStream : null, u8, 'deflateRawSync'); }
  function zipData(u8, e, max) {
    if (max && e.usize > max) return Promise.resolve(null);
    var raw = zipRaw(u8, e); if (!raw || (e.flags & 1)) return Promise.resolve(null);   // 암호 걸린 항목은 읽지 않음
    if (e.method === 0) return Promise.resolve(raw);
    if (e.method !== 8) return Promise.resolve(null);
    return inflateRaw(raw).catch(function () { return null; });
  }
  function zipText(u8, d, name, max) { var e = d.by[name]; return e ? zipData(u8, e, max || 4194304).then(function (b) { return b ? utf8(b) : ''; }) : Promise.resolve(''); }
  function zipKind(u8, d) {
    var by = d.by, mt = by.mimetype, m = '';
    if (mt && mt.method === 0 && mt.usize < 120) { var r = zipRaw(u8, mt); m = r ? latin1(r).trim() : ''; }
    if (/hwp\+zip/i.test(m)) return 'hwpx';
    if (m === 'application/epub+zip') return 'epub';
    if (/opendocument\.text/.test(m)) return 'odt';
    if (/opendocument\.spreadsheet/.test(m)) return 'ods';
    if (/opendocument\.presentation/.test(m)) return 'odp';
    if (by['[Content_Types].xml']) { if (by['word/document.xml']) return 'docx'; if (by['ppt/presentation.xml']) return 'pptx'; if (by['xl/workbook.xml']) return 'xlsx'; }
    if (by['Contents/content.hpf'] || by['Contents/section0.xml']) return 'hwpx';
    if (by['META-INF/container.xml'] && d.list.some(function (e) { return /\.opf$/i.test(e.name); })) return 'epub';
    return 'zip';
  }
  function xmlTag(x, tag) { var m = new RegExp('<' + esc(tag) + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + esc(tag) + '>').exec(x || ''); return m ? clip(unent(m[1].replace(/<[^>]+>/g, '')), 160) : ''; }
  var GEN_LIB = /python-docx|python-pptx|openpyxl|xlsxwriter|docx4j|aspose|phpword|phpspreadsheet|phpoffice|exceljs|sheetjs|pandoc|apache poi|closedxml|epplus|npoi|officegen/i;
  function customProps(x) {
    var out = {}, re = /<(?:\w+:)?property\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?property>/g, m;
    while ((m = re.exec(x || ''))) { var nm = /\bname="([^"]*)"/.exec(m[1]); if (nm) out[unent(nm[1])] = clip(unent(m[2].replace(/<[^>]+>/g, '')), 300); }
    return out;
  }
  function markFrom(p) {
    var id = String(p['AIMarker Mark'] || '').toUpperCase();
    return /^AM-[0-9A-Z]{6,20}$/.test(id) ? { id: id, url: clip(p['AIMarker Url'] || '', 200), label: clip(p['AIMarker Label'] || '', 20), basis: clip(p['AIMarker Basis'] || '', 20), cred: '' } : null;
  }
  var MEDIA_RE = /^(?:word|ppt|xl)\/media\/|^BinData\/|^Pictures\/|(?:^|\/)(?:images?|img|media)\//i, MEDIA_EXT = /\.(?:jpe?g|png|webp|gif|tiff?|avif|heic|jxl|bmp)$/i;
  function officeProps(u8, d, fmt) {
    var kind = OFFICE[fmt], doc = { name: DOC_NAME[fmt] || '', app: '', appVersion: '', generator: '', title: '', signed: false, aimarker: null, media: 0, notice: false };
    var names = d.list.map(function (e) { return e.name; });
    doc.signed = names.some(function (n) { return /^_xmlsignatures\/|^META-INF\/(?:document)?signatures?\.xml$/i.test(n); });
    doc.media = names.filter(function (n) { return MEDIA_RE.test(n) && MEDIA_EXT.test(n); }).length;
    var lib = function (s) { var g = GEN_LIB.exec(s || ''); if (g && !doc.generator) doc.generator = g[0]; };
    if (kind === 'ooxml') {
      var main = fmt === 'docx' ? 'word/document.xml' : '';
      return Promise.all([zipText(u8, d, 'docProps/app.xml'), zipText(u8, d, 'docProps/core.xml'), zipText(u8, d, 'docProps/custom.xml'), main ? zipText(u8, d, main, 67108864) : '']).then(function (t) {
        doc.app = xmlTag(t[0], 'Application'); doc.appVersion = xmlTag(t[0], 'AppVersion'); doc.title = xmlTag(t[1], 'dc:title');
        lib([xmlTag(t[1], 'dc:creator'), xmlTag(t[1], 'cp:lastModifiedBy'), xmlTag(t[1], 'dc:description'), doc.app].join(' | '));
        doc.aimarker = markFrom(customProps(t[2]));
        doc.notice = /w:name="_AIMarker"/.test(t[3] || '');
        return doc;
      });
    }
    if (kind === 'odf') return zipText(u8, d, 'meta.xml').then(function (x) {
      doc.app = xmlTag(x, 'meta:generator'); doc.title = xmlTag(x, 'dc:title'); lib(doc.app + ' | ' + xmlTag(x, 'dc:creator'));
      var p = {}, re = /<meta:user-defined\b[^>]*meta:name="([^"]*)"[^>]*>([^<]*)<\/meta:user-defined>/g, m; while ((m = re.exec(x || ''))) p[unent(m[1])] = clip(unent(m[2]), 300);
      doc.aimarker = markFrom(p); return doc;
    });
    if (kind === 'hwpx') return Promise.all([zipText(u8, d, 'version.xml'), zipText(u8, d, 'Contents/content.hpf')]).then(function (t) {
      var a = /\bapplication="([^"]{1,80})"/.exec(t[0] || ''), v = /\bappVersion="([^"]{1,60})"/.exec(t[0] || '');
      doc.app = a ? clip(unent(a[1]), 80) : ''; doc.appVersion = v ? clip(unent(v[1]), 60) : ''; doc.title = xmlTag(t[1], 'opf:title'); return doc;
    });
    if (kind === 'epub') return zipText(u8, d, 'META-INF/container.xml').then(function (c) {
      var r = /full-path="([^"]+)"/.exec(c || ''); return r ? zipText(u8, d, unent(r[1])) : '';
    }).then(function (o) { doc.title = xmlTag(o, 'dc:title'); var g = /<meta[^>]*name="generator"[^>]*content="([^"]{1,80})"/.exec(o || ''); doc.app = g ? clip(unent(g[1]), 80) : ''; lib(doc.app); return doc; });
    return Promise.resolve(doc);
  }
  /* 문서 속 이미지(최대 12개 · 모두 120MB): 같은 방법으로 출처 기록을 읽음. 바이트는 지각 해시를 만들 때까지만 둠 */
  function docParts(u8, d) {
    var list = d.list.filter(function (e) { return MEDIA_RE.test(e.name) && MEDIA_EXT.test(e.name) && e.usize <= 31457280; }), out = [], total = 0;
    return list.slice(0, 24).reduce(function (p, e) {
      return p.then(function () {
        if (out.length >= 12 || total + e.usize > 125829120) return null;
        total += e.usize;
        return zipData(u8, e, 31457280).then(function (b) {
          if (!b || !b.length) return null;
          return inspect(b, { name: e.name, nested: true }).then(function (r) { Object.defineProperty(r, '_bytes', { value: b, enumerable: false, configurable: true, writable: true }); out.push(r); });
        }).catch(function () { return null; });
      });
    }, Promise.resolve()).then(function () { return { count: list.length, items: out }; });
  }
  /* 압축 파일 풀기(일반 ZIP): 화면이 안의 파일을 하나씩 확인 · 마킹할 수 있게 */
  function unzip(input, opt) {
    opt = opt || {};
    var u8 = input instanceof Uint8Array ? input : new Uint8Array(input), d = zipDir(u8); if (!d) return Promise.resolve(null);
    var max = opt.max || 50, lim = opt.limit || 314572800, total = 0, out = [], skipped = 0;
    var list = d.list.filter(function (e) { return !/\/$/.test(e.name) && !/(?:^|\/)(?:__MACOSX|\.DS_Store|Thumbs\.db)/i.test(e.name) && !/(?:^|\/)\._/.test(e.name); });
    return list.reduce(function (p, e) {
      return p.then(function () {
        if (out.length >= max || total + e.usize > lim || (e.flags & 1) || (opt.filter && !opt.filter(e.name))) { skipped++; return null; }
        total += e.usize;
        return zipData(u8, e, lim).then(function (b) { if (b) out.push({ name: e.name.split('/').pop(), path: e.name, bytes: b }); else skipped++; });
      });
    }, Promise.resolve()).then(function () { return { files: out, skipped: skipped, total: list.length }; });
  }

  /* ---------- 1.3.0 문서에 마크 넣기(DOCX · PPTX · XLSX: 사용자 정의 속성 + 문서 안 표시 문장, ODF: 사용자 정의 속성) ----------
   * o: { id, url, label, basis, text(표시 문장), notice: 'end' | 'top' | '' }. 원래 문서의 다른 부분은 바이트 그대로 둠 */
  function dosNow() { var t = new Date(); return { time: (t.getHours() << 11) | (t.getMinutes() << 5) | (t.getSeconds() >> 1), date: ((t.getFullYear() - 1980) << 9) | ((t.getMonth() + 1) << 5) | t.getDate() }; }
  function zipRewrite(u8, d, changes) {
    var names = Object.keys(changes);
    return Promise.all(names.map(function (n) {
      var v = changes[n]; if (v == null) return null;
      var b = typeof v === 'string' ? enc(v) : v;
      return deflateRaw(b).then(function (c) { return { u: b, c: c, crc: crc32(b) }; });
    })).then(function (done) {
      var made = {}; names.forEach(function (n, i) { made[n] = done[i]; });
      var parts = [], cds = [], off = 0, now = { time: 0, date: 23585 }, cnt = 0;   // 새로 넣는 항목 시각은 2026-01-01 로 고정(같은 파일 · 같은 마크면 같은 결과 → 표시본 해시가 그대로 이어짐)
      var put = function (r) {
        var nb = r.nameB, lh = concat([le32(0x04034b50), le16b(r.need), le16b(r.flags), le16b(r.method), le16b(r.time), le16b(r.date), le32(r.crc), le32(r.cs), le32(r.us), le16b(nb.length), le16b(0), nb]);
        cds.push(concat([le32(0x02014b50), le16b(r.made), le16b(r.need), le16b(r.flags), le16b(r.method), le16b(r.time), le16b(r.date), le32(r.crc), le32(r.cs), le32(r.us), le16b(nb.length), le16b(0), le16b(0), le16b(0), le16b(r.iattr || 0), le32(r.ext || 0), le32(off), nb]));
        parts.push(lh, r.data); off += lh.length + r.data.length; cnt++;
      };
      d.list.forEach(function (e) {
        if (Object.prototype.hasOwnProperty.call(changes, e.name)) {
          var x = made[e.name]; if (!x) return;   // null: 지움
          put({ nameB: e.nameB, need: 20, flags: e.flags & 0x0800, method: 8, time: e.time, date: e.date, crc: x.crc, cs: x.c.length, us: x.u.length, data: x.c, made: e.made, iattr: e.iattr, ext: e.ext });
          return;
        }
        var raw = zipRaw(u8, e); if (!raw) throw new Error('ZIP_ENTRY');
        put({ nameB: e.nameB, need: e.need, flags: e.flags & ~0x0008, method: e.method, time: e.time, date: e.date, crc: e.crc, cs: e.csize, us: e.usize, data: raw, made: e.made, iattr: e.iattr, ext: e.ext });
      });
      names.forEach(function (n) {
        if (d.by[n] || !made[n]) return;
        var nb = enc(n), x = made[n];
        put({ nameB: nb, need: 20, flags: /[^\x20-\x7e]/.test(n) ? 0x0800 : 0, method: 8, time: now.time, date: now.date, crc: x.crc, cs: x.c.length, us: x.u.length, data: x.c, made: 20, iattr: 0, ext: 0 });
      });
      var cd = concat(cds);
      if (off + cd.length > 4294967295 || cnt > 65535) throw new Error('ZIP64_UNSUPPORTED');
      parts.push(cd, concat([le32(0x06054b50), le16b(0), le16b(0), le16b(cnt), le16b(cnt), le32(cd.length), le32(off), le16b(0)]));
      return concat(parts);
    });
  }
  /* 1.3.0 ZIP 만들기(자동 마킹 꾸러미): files [{ name, data(Uint8Array | 글), store(압축 안 함) }] → 조각 배열(Blob 으로 묶어 내려받기) */
  var STORE_EXT = /\.(?:jpe?g|png|webp|gif|avif|heic|heif|jxl|mp4|mov|m4a|mp3|aac|ogg|webm|zip|docx|pptx|xlsx|hwpx|odt|ods|odp|epub|pdf|woff2?)$/i;
  function zipBuild(files) {
    var parts = [], cds = [], off = 0, now = dosNow(), used = {};
    var uniq = function (n) {
      n = String(n || 'file').replace(/\\/g, '/').replace(/^\/+/, '').replace(/(^|\/)\.\.(?=\/|$)/g, '$1_');
      var k = n.toLowerCase(), i = 2, b = n.replace(/(\.[^./]+)?$/, ''), e = (/(\.[^./]+)$/.exec(n) || ['', ''])[1];
      while (used[k]) { n = b + ' (' + (i++) + ')' + e; k = n.toLowerCase(); }
      used[k] = 1; return n;
    };
    return files.reduce(function (p, f) {
      return p.then(function () {
        var data = typeof f.data === 'string' ? enc(f.data) : f.data, name = uniq(f.name), store = f.store != null ? !!f.store : (STORE_EXT.test(name) || data.length < 128);
        return (store ? Promise.resolve(data) : deflateRaw(data).catch(function () { return null; })).then(function (c) {
          if (!c || (!store && c.length >= data.length)) { c = data; store = true; }
          var nb = enc(name), flags = /[^\x20-\x7e]/.test(name) ? 0x0800 : 0, crc = crc32(data), method = store ? 0 : 8;
          var lh = concat([le32(0x04034b50), le16b(20), le16b(flags), le16b(method), le16b(now.time), le16b(now.date), le32(crc), le32(c.length), le32(data.length), le16b(nb.length), le16b(0), nb]);
          // 만든 곳 = 유닉스(3): 압축 풀기 도구가 이름을 옛 도스 글자표로 바꾸지 않게(이름은 UTF-8 깃발로 알림), 권한 rw-r--r--
          cds.push(concat([le32(0x02014b50), le16b(0x031E), le16b(20), le16b(flags), le16b(method), le16b(now.time), le16b(now.date), le32(crc), le32(c.length), le32(data.length), le16b(nb.length), le16b(0), le16b(0), le16b(0), le16b(0), le32(0x81A40000), le32(off), nb]));
          parts.push(lh, c); off += lh.length + c.length;
        });
      });
    }, Promise.resolve()).then(function () {
      var cd = concat(cds);
      if (off + cd.length > 4294967295 || cds.length > 65535) throw new Error('ZIP_TOO_BIG');
      parts.push(cd, concat([le32(0x06054b50), le16b(0), le16b(0), le16b(cds.length), le16b(cds.length), le32(cd.length), le32(off), le16b(0)]));
      return parts;
    });
  }
  var NOTICE_ID = 'AIMarker 표시';
  function customXml(old, props) {
    var add = function (pid0, pre) { return props.map(function (p, i) { return '<' + pre + 'property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="' + (pid0 + i) + '" name="' + xmlEsc(p[0]) + '"><vt:lpwstr>' + xmlEsc(p[1]) + '</vt:lpwstr></' + pre + 'property>'; }).join(''); };
    var root = /<(\w+:)?Properties\b[^>]*>/.exec(old || '');
    if (!root) return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' + add(2, '') + '</Properties>';
    var pre = root[1] || '', x = old.replace(/<(\w+:)?property\b[^>]*\bname="AIMarker[^"]*"[^>]*>[\s\S]*?<\/(\w+:)?property>/g, ''), pid = 1, m, re = /\bpid="(\d+)"/g;
    while ((m = re.exec(x))) pid = Math.max(pid, +m[1]);
    if (!/xmlns:vt="http:\/\/schemas\.openxmlformats\.org\/officeDocument\/2006\/docPropsVTypes"/.test(root[0])) x = x.replace(root[0], root[0].replace(/>$/, ' xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'));
    var close = '</' + pre + 'Properties>', at = x.lastIndexOf(close);
    if (at < 0) { var self = new RegExp('<' + esc(pre) + 'Properties\\b([^>]*)/>').exec(x); if (!self) return null; return x.replace(self[0], self[0].replace(/\/>$/, '>') + add(pid + 1, pre) + close); }
    return x.slice(0, at) + add(pid + 1, pre) + x.slice(at);
  }
  /* 앞서 넣은 표시(needle 이 든 단락 · 도형)를 지움: needle 앞의 가장 가까운 여는 꼬리표부터 닫는 꼬리표까지 */
  function dropMarked(x, needle, open, close) {
    for (var guard = 0; guard < 8; guard++) {
      var k = x.indexOf(needle); if (k < 0) break;
      var re = new RegExp(open, 'g'), m, last = -1, head = x.slice(0, k);
      while ((m = re.exec(head))) if (!/\/>$/.test(m[0])) last = m.index;
      var e = x.indexOf(close, k); if (last < 0 || e < 0) break;
      x = x.slice(0, last) + x.slice(e + close.length);
    }
    return x;
  }
  function docxNotice(x, text, where) {
    x = dropMarked(x, 'w:name="_AIMarker"', '<w:p(?:\\s[^>]*)?>', '</w:p>');   // 앞서 넣은 표시 문장은 바꿔 넣음
    if (!where || !text) return x;
    var bid = 990001; while (x.indexOf('w:id="' + bid + '"') >= 0) bid++;
    var para = '<w:p><w:pPr><w:spacing w:before="' + (where === 'top' ? '0' : '240') + '" w:after="' + (where === 'top' ? '240' : '0') + '"/></w:pPr><w:bookmarkStart w:id="' + bid + '" w:name="_AIMarker"/><w:r><w:rPr><w:color w:val="5B687D"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">' + xmlEsc(text) + '</w:t></w:r><w:bookmarkEnd w:id="' + bid + '"/></w:p>';
    var b0 = /<w:body\b[^>]*>/.exec(x); if (!b0) return null;
    if (where === 'top') return x.replace(b0[0], b0[0] + para);
    var end = x.lastIndexOf('</w:body>'); if (end < 0) return null;
    var sp = x.lastIndexOf('<w:sectPr', end), lastP = Math.max(x.lastIndexOf('</w:p>', end), x.lastIndexOf('</w:tbl>', end), x.lastIndexOf('</w:sdt>', end), x.lastIndexOf('<w:p/>', end));
    var at = sp > lastP ? sp : end;
    return x.slice(0, at) + para + x.slice(at);
  }
  function pptxNotice(slide, pres, text) {
    slide = dropMarked(slide, 'name="' + NOTICE_ID + '"', '<p:sp(?:\\s[^>]*)?>', '</p:sp>');
    if (!text) return slide;
    if (slide.indexOf('xmlns:a=') < 0 || slide.lastIndexOf('</p:spTree>') < 0) return null;
    var sz = /<p:sldSz\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/.exec(pres || ''), cx = sz ? +sz[1] : 12192000, cy = sz ? +sz[2] : 6858000, id = 1, m, re = /<p:cNvPr\b[^>]*\bid="(\d+)"/g;
    while ((m = re.exec(slide))) id = Math.max(id, +m[1]);
    var sp = '<p:sp><p:nvSpPr><p:cNvPr id="' + (id + 1) + '" name="' + NOTICE_ID + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + Math.round(cx * 0.025) + '" y="' + Math.round(cy * 0.935) + '"/><a:ext cx="' + Math.round(cx * 0.7) + '" cy="' + Math.round(cy * 0.05) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>' +
      '<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="b"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:r><a:rPr lang="ko-KR" sz="900" dirty="0"><a:solidFill><a:srgbClr val="5B687D"/></a:solidFill></a:rPr><a:t>' + xmlEsc(text) + '</a:t></a:r></a:p></p:txBody></p:sp>';
    var at = slide.lastIndexOf('</p:spTree>');
    return slide.slice(0, at) + sp + slide.slice(at);
  }
  function firstSlide(u8, d) {
    return Promise.all([zipText(u8, d, 'ppt/presentation.xml'), zipText(u8, d, 'ppt/_rels/presentation.xml.rels')]).then(function (t) {
      var sid = /<p:sldId\b[^>]*\br:id="([^"]+)"/.exec(t[0] || ''), path = 'ppt/slides/slide1.xml';
      if (sid) { var rel = new RegExp('<Relationship\\b[^>]*\\bId="' + esc(sid[1]) + '"[^>]*>').exec(t[1] || ''), tg = rel ? /\bTarget="([^"]+)"/.exec(rel[0]) : null; if (tg) path = tg[1].charAt(0) === '/' ? tg[1].slice(1) : 'ppt/' + tg[1].replace(/^\.\//, ''); }
      return { pres: t[0], path: path };
    });
  }
  function embedOffice(input, o) {
    o = o || {};
    var u8 = input instanceof Uint8Array ? input : new Uint8Array(input), d = zipDir(u8);
    if (!d) return Promise.reject(new Error('FORMAT_UNSUPPORTED'));
    if (d.z64) return Promise.reject(new Error('ZIP64_UNSUPPORTED'));
    var fmt = zipKind(u8, d), kind = OFFICE[fmt];
    if (kind !== 'ooxml' && kind !== 'odf') return Promise.reject(new Error('FORMAT_UNSUPPORTED'));
    if (d.list.some(function (e) { return /^_xmlsignatures\/|^META-INF\/(?:document)?signatures?\.xml$/i.test(e.name); })) return Promise.reject(new Error('SIGNED'));
    var props = [['AIMarker Mark', o.id || ''], ['AIMarker Label', o.label || ''], ['AIMarker Basis', o.basis || ''], ['AIMarker Url', o.url || '']];
    if (o.labelKo) props.push(['AIMarker 표시', o.labelKo + (o.basisKo ? ' · 근거 ' + o.basisKo : '')]);
    var ch = {}, where = o.notice === 'top' ? 'top' : o.notice ? 'end' : '';
    if (kind === 'odf') return zipText(u8, d, 'meta.xml').then(function (x) {
      if (!x || x.indexOf('</office:meta>') < 0) throw new Error('FORMAT_UNSUPPORTED');
      x = x.replace(/<meta:user-defined\b[^>]*meta:name="AIMarker[^"]*"[^>]*>[^<]*<\/meta:user-defined>/g, '');
      var add = props.map(function (p) { return '<meta:user-defined meta:name="' + xmlEsc(p[0]) + '">' + xmlEsc(p[1]) + '</meta:user-defined>'; }).join('');
      ch['meta.xml'] = x.replace('</office:meta>', add + '</office:meta>');
      return zipRewrite(u8, d, ch).then(function (out) { return { bytes: out, format: fmt, notice: false }; });
    });
    var jobs = [zipText(u8, d, '[Content_Types].xml'), zipText(u8, d, '_rels/.rels'), zipText(u8, d, 'docProps/custom.xml'), fmt === 'docx' ? zipText(u8, d, 'word/document.xml', 67108864) : '', fmt === 'pptx' ? firstSlide(u8, d) : null];
    return Promise.all(jobs).then(function (t) {
      var ct = t[0], rels = t[1]; if (!ct || !rels) throw new Error('FORMAT_UNSUPPORTED');
      var cx = customXml(t[2], props); if (!cx) throw new Error('FORMAT_UNSUPPORTED');
      ch['docProps/custom.xml'] = cx;
      if (!/PartName="\/docProps\/custom\.xml"/i.test(ct)) ch['[Content_Types].xml'] = ct.replace('</Types>', '<Override PartName="/docProps/custom.xml" ContentType="application/vnd.openxmlformats-officedocument.custom-properties+xml"/></Types>');
      if (!/Target="\/?docProps\/custom\.xml"/i.test(rels)) { var rid = 1; while (rels.indexOf('Id="rIdAimk' + rid + '"') >= 0) rid++; ch['_rels/.rels'] = rels.replace('</Relationships>', '<Relationship Id="rIdAimk' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties" Target="docProps/custom.xml"/></Relationships>'); }
      var noticed = false;
      if (fmt === 'docx' && t[3]) { var nx = docxNotice(t[3], o.text, where); if (nx && nx !== t[3]) { ch['word/document.xml'] = nx; noticed = !!where; } }
      var pp = Promise.resolve();
      if (fmt === 'pptx' && t[4]) pp = zipText(u8, d, t[4].path, 33554432).then(function (s) { if (!s) return; var nx2 = pptxNotice(s, t[4].pres, where ? o.text : ''); if (nx2 && nx2 !== s) { ch[t[4].path] = nx2; noticed = !!where; } });
      return pp.then(function () { return zipRewrite(u8, d, ch); }).then(function (out) { return { bytes: out, format: fmt, notice: noticed }; });
    });
  }

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
    if (rep.doc) f.doc = { app: clip(rep.doc.app || '', 80), ver: clip(rep.doc.appVersion || '', 40), gen: rep.doc.generator || '', signed: !!rep.doc.signed, media: rep.doc.media || 0 };   // 1.3.0
    if (rep.parts && rep.parts.length) f.parts = rep.parts.slice(0, 12).map(function (r) { var pf = features(r, { dhash: r.dhash || '' }); delete pf.strings; if (pf.c2pa) pf.c2pa.others = pf.c2pa.others.slice(-2); pf.name = clip(r.name, 80); return pf; });
    f.strings = rep.strings.slice(0, 24);
    return f;
  }
  function normText(t) { var s = String(t == null ? '' : t).replace(/\r\n?/g, '\n').replace(/[​-‍﻿⁠­]/g, ''); if (s.normalize) s = s.normalize('NFC'); return s.replace(/^[^\n]*AIMarker 마크 AM-[0-9A-Z]{10}[^\n]*$/gm, '').trim(); }   // 1.3.0 AIMarker 표시 문장(마크 번호가 든 줄)은 지문에서 뺌
  var DISCLOSE = /(?:AI|인공지능|생성형\s?AI|ChatGPT|챗\s?GPT|GPT|Claude|클로드|Gemini|제미나이|Copilot|코파일럿|뤼튼|Wrtn|하이퍼클로바|HyperCLOVA|클로바\s?X|퍼플렉시티|Perplexity|딥시크|DeepSeek)(?:[가-힣A-Za-z\s·,()-]{0,14}?)(?:로|으로|를|을|이|가|의|에게|와|과)?\s?(?:활용|사용|이용|도움)?(?:[가-힣\s]{0,8}?)(?:생성|작성|제작|만든|만들었|만들어|썼|쓴|써|정리|요약|번역|다듬|교정|초안)|AI[- ]?(?:generated|written|assisted)|(?:generated|written|created|drafted) (?:by|with|using) (?:AI|ChatGPT|Claude|Gemini)|made with AI/i;
  function textFeatures(text) {
    var raw = String(text == null ? '' : text), t = normText(raw), zw = /[​-‍﻿⁠]/.test(raw);
    return digest('sha256', enc(t)).then(function (h) { return { v: SCHEMA, lib: VERSION, kind: 'text', format: 'text', size: t.length, sha256: hex(h), zw: zw, disclosure: DISCLOSE.test(t) }; });
  }

  /* ---------- 표시본 만들기(XMP 넣기 · 출처 기록 떼기) ---------- */
  function xmlEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var DST_URI = 'http://cv.iptc.org/newscodes/digitalsourcetype/';
  /* o: { dst, aiSystem, title, desc(=note), alt, creator, credit, rights, web, id, url, label, basis, cred } · 1.3.0 검색(SEO) · 저작권 필드 */
  function buildXmp(o) {
    o = o || {};
    var simple = function (tag, v) { return v ? '<' + tag + '>' + xmlEsc(v) + '</' + tag + '>' : ''; };
    var alt = function (tag, v) { return v ? '<' + tag + '><rdf:Alt><rdf:li xml:lang="x-default">' + xmlEsc(v) + '</rdf:li></rdf:Alt></' + tag + '>' : ''; };
    var seq = function (tag, v) { return v ? '<' + tag + '><rdf:Seq><rdf:li>' + xmlEsc(v) + '</rdf:li></rdf:Seq></' + tag + '>' : ''; };
    var body = (o.dst ? simple('Iptc4xmpExt:DigitalSourceType', DST_URI + o.dst) : '') + simple('Iptc4xmpExt:AISystemUsed', o.aiSystem) +
      alt('dc:title', o.title) + alt('dc:description', o.desc || o.note) + alt('Iptc4xmpCore:AltTextAccessibility', o.alt) + seq('dc:creator', o.creator) +
      simple('photoshop:Credit', o.credit) + alt('dc:rights', o.rights) + simple('xmpRights:WebStatement', o.web) + (o.rights ? '<xmpRights:Marked>True</xmpRights:Marked>' : '');
    return '<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="AIMarker ' + VERSION + '"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
      '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:Iptc4xmpCore="http://iptc.org/std/Iptc4xmpCore/1.0/xmlns/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:aimarker="https://aimarker.kr/ns/1.0/">' +
      body + '<aimarker:Mark>' + xmlEsc(o.id || '') + '</aimarker:Mark><aimarker:Url>' + xmlEsc(o.url || '') + '</aimarker:Url><aimarker:Label>' + xmlEsc(o.label || '') + '</aimarker:Label><aimarker:Basis>' + xmlEsc(o.basis || '') + '</aimarker:Basis>' + (o.cred ? '<aimarker:Credential>' + xmlEsc(o.cred) + '</aimarker:Credential>' : '') +
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
        var parts = (rep.parts || []).filter(function (p) { return p._bytes && p.kind === 'image' && typeof Blob !== 'undefined'; });
        return parts.reduce(function (q, p) {   // 1.3.0 문서 속 그림도 지각 해시(등록 기록의 비슷한 이미지 찾기)
          return q.then(function () { return pixels(new Blob([p._bytes])).then(function (pp) { if (pp) { p.dhash = dhash(pp); if (!p.w) { p.w = pp.w; p.h = pp.h; } } }); }).then(function () { p._bytes = null; }, function () { p._bytes = null; });
        }, Promise.resolve()).then(function () {
          (rep.parts || []).forEach(function (p) { p._bytes = null; });
          return { bytes: u8, report: rep, features: features(rep, { dhash: dh, w: px ? px.w : 0, h: px ? px.h : 0 }), pack: pack(rep) };
        });
      });
    });
  }

  return { VERSION: VERSION, SCHEMA: SCHEMA, sniff: sniff, inspect: inspect, features: features, pack: pack, textFeatures: textFeatures, normText: normText, dhash: dhash, hamming: hamming, inspectFile: inspectFile, fileBytes: fileBytes, pixels: pixels, buildXmp: buildXmp, embedXmp: embedXmp, verifyMark: verifyMark, _edVerifyJs: edVerifyJs,
    embedOffice: embedOffice, unzip: unzip, zipBuild: zipBuild, zipDir: zipDir, zipKind: zipKind, DOC_NAME: DOC_NAME, OFFICE: OFFICE, crc32: crc32, deflateRaw: deflateRaw, inflateRaw: inflateRaw, _zipRewrite: zipRewrite,
    _cbor: cbor, _x509: x509, _hex: hex, _b64: b64, _unb64: unb64, _boxList: boxList, _jumbTree: jumbTree };
});
  return module.exports;
})();
/* ---------- 일괄 확인 리포트 aim-report(내장) ---------- */
const REP = (() => {
  const module = { exports: {} }, exports = module.exports;   // eslint-disable-line no-unused-vars
/* AIMarker 일괄 확인 리포트(aim-report) 1.0.2 · 브라우저 · Node 공용 · 의존성 없음
 * 판정 결과(am.analyze · am.analyzebatch)를 모아 '콘텐츠 n건 AI 사용 확인 리포트'를 만든다.
 * 하는 일: 근거 등급별로 나누기 · 바로 표시할 수 있는 비율 · 도구 · 서명자 분포 · 확인할 점
 *  (지금 표시와 근거가 다른 것, 같은 · 비슷한 이미지인데 근거가 다른 것, 출처 기록이 파일과 맞지 않는 것) · CSV · 혼자 열리는 HTML.
 * 판정은 서버가 하고, 이 파일은 정리만 한다(새 판정을 만들지 않음). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AIMReport = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = '1.0.2';
  var LABEL = { ai_generated: 'AI 생성', ai_edited: 'AI 편집 · 합성', ai_assisted: 'AI 보조', no_ai: 'AI 미사용', none: '표시 없음' };
  var BASIS = { verified: '서명 검증', record: '파일 기록', declared: '발급자 신고', none: '근거 없음' };
  var SCOPE = { generated: 'AI로 생성', edited: 'AI로 편집 · 합성', enhanced: 'AI로 보정' };
  var KIND = { image: '이미지', video: '영상', audio: '오디오', doc: '문서', text: '글', other: '기타' };
  var CAT = {
    ai_verified: { t: 'AI 사용 · 서명 검증', s: 'AI 사용', b: '서명 검증', c: '#0E2A6B', d: 'C2PA 출처 기록의 전자서명을 서버가 다시 확인했고, AI 생성 · 편집 기록이 있습니다.' },
    ai_record: { t: 'AI 사용 · 파일 기록', s: 'AI 사용', b: '파일 기록', c: '#1F55F5', d: '서명은 없지만 파일 안에 AI 생성 · 편집 기록(IPTC · 생성 도구 설정값 등)이 있습니다.' },
    cap: { t: 'AI 미사용 · 촬영 원본 서명', s: 'AI 미사용', b: '촬영 원본 서명', c: '#0FA88F', d: '신뢰 목록의 촬영 기기 서명으로 원본이 확인됐고 AI 기록이 없습니다.' },
    none: { t: '근거 없음 · 확인 필요', s: '근거 없음', b: '확인 필요', c: '#B7C2D3', d: '파일에 판단할 기록이 없습니다. 제작자 · 판매자에게 AI 사용 여부를 확인해 발급자 신고로 표시합니다.' },
    error: { t: '확인 못함', s: '확인 못함', b: '', c: '#E0A33A', d: '파일을 읽지 못했거나 서버 확인이 끝나지 않았습니다.' }
  };
  var CAT_ORDER = ['ai_verified', 'ai_record', 'cap', 'none', 'error'];
  var FINE = 12, TINT = 48, NEAR = 2;   // 같은 · 비슷한 이미지: 256비트 해시 거리 · 4칸 평균 색 차이(브라우저), 64비트 해시만 있으면 더 엄격히

  function str(v) { return v === null || v === undefined ? '' : String(v); }
  function esc(s) { return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function base(name) { var s = str(name).replace(/\\/g, '/'); return s.slice(s.lastIndexOf('/') + 1); }
  function ham(a, b) { if (!a || !b || a.length !== b.length) return 64; var n = 0; for (var i = 0; i < a.length; i++) { var x = parseInt(a.charAt(i), 16) ^ parseInt(b.charAt(i), 16); while (x) { n += x & 1; x >>= 1; } } return n; }
  function pct(a, b) { return b ? Math.round(a * 1000 / b) / 10 : 0; }
  function bytes(n) { n = +n || 0; return n < 1024 ? n + 'B' : n < 1048576 ? (n / 1024).toFixed(1) + 'KB' : n < 1073741824 ? (n / 1048576).toFixed(1) + 'MB' : (n / 1073741824).toFixed(2) + 'GB'; }
  function two(n) { return ('0' + n).slice(-2); }
  function stamp(d) { d = d || new Date(); return d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate()) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes()); }

  /* ---------- 지금 표시 목록(CSV) 읽기: 파일 이름, 지금 표시 ---------- */
  var DECL_WORDS = [
    [/^(ai[ _-]?generated|ai\s*생성|생성)$/i, 'ai_generated'],
    [/^(ai[ _-]?edited|ai\s*편집.*|ai\s*합성|편집|합성)$/i, 'ai_edited'],
    [/^(ai[ _-]?assisted|ai\s*보조|ai\s*보정|보조|보정)$/i, 'ai_assisted'],
    [/^(no[ _-]?ai|ai\s*미사용|미사용|사람\s*제작|사람이\s*만듦|human)$/i, 'no_ai'],
    [/^(none|표시\s*없음|없음|미표시|-|)$/i, 'none']
  ];
  function declWord(v) { var s = str(v).trim().replace(/^"|"$/g, ''); for (var i = 0; i < DECL_WORDS.length; i++) if (DECL_WORDS[i][0].test(s)) return DECL_WORDS[i][1]; return ''; }
  function csvRows(text) {   // 따옴표 · 쉼표 · 줄바꿈을 지키는 작은 CSV 읽기
    var rows = [], row = [], cell = '', q = false, s = str(text).replace(/^﻿/, '');
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (q) { if (ch === '"') { if (s.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
      if (ch === '"') q = true; else if (ch === ',' || ch === '\t' || ch === ';') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s.charAt(i + 1) === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return str(c).trim(); }); });
  }
  /** CSV 글 → { 파일 이름(소문자): 표시 값 } · 첫 줄이 머리글이면 건너뜀 · 못 읽은 줄 수도 돌려줌 */
  function parseDeclared(text) {
    var map = {}, bad = 0, n = 0;
    csvRows(text).forEach(function (r, i) {
      var name = base(str(r[0]).trim()), lab = declWord(r[1]);
      if (i === 0 && !lab && /파일|file|name|이름/i.test(str(r[0]))) return;
      if (!name) return;
      if (!lab && str(r[1]).trim()) { bad++; return; }
      map[name.toLowerCase()] = lab || 'none'; n++;
    });
    return { map: map, count: n, bad: bad };
  }
  function declaredTemplate(names) {
    var lines = ['파일 이름,지금 표시'];
    (names && names.length ? names : ['상품컷_001.jpg', '모델컷_002.png', '배너_003.webp']).forEach(function (nm, i) { lines.push('"' + base(nm).replace(/"/g, '""') + '",' + (names && names.length ? '' : ['AI 생성', 'AI 미사용', '표시 없음'][i % 3])); });
    return '﻿' + lines.join('\r\n') + '\r\n';
  }

  /* ---------- 한 건 정리 ---------- */
  function info(e) {
    var r = e.result, o = { cat: 'error', basis: 'none', scope: '', tools: [], signer: '', signerTrust: '', allowed: [], suggest: '', marks: [], near: [], checks: [], summary: '' };
    if (!r || r.ok === false || !r.verdict) { o.err = e.error || (r && (r.msg || r.message)) || '확인하지 못했습니다'; return o; }
    var v = r.verdict;
    o.cat = v.ai === 'used' ? (v.basis === 'verified' ? 'ai_verified' : 'ai_record') : v.ai === 'not_used' ? 'cap' : 'none';
    o.basis = v.ai === 'unknown' ? 'none' : (v.basis || 'none');
    o.scope = v.ai === 'used' ? v.scope || '' : '';
    o.allowed = (v.allowed || []).slice(); o.suggest = v.suggest || '';
    o.summary = r.summary || '';
    (r.signals || []).forEach(function (s) { if (s.dir === 'ai' && s.tool) str(s.tool).split(/\s*·\s*|\s*,\s*/).forEach(function (t) { t = t.replace(/\s*계열$/, '').trim(); if (t && o.tools.indexOf(t) < 0) o.tools.push(t); }); });   // 'Stable Diffusion 계열' 과 'Stable Diffusion' 은 한 도구로
    if (r.signer) {
      o.signer = str(r.signer.org); o.signerTrust = str(r.signer.trust);
      if (r.signer.valid === false) o.checks.push(['tamper', '출처 기록의 서명이 맞지 않습니다. 기록이 바뀌었을 수 있습니다.']);
      else if (r.signer.binding === 'mismatch') o.checks.push(['tamper', '서명 뒤에 파일 내용이 바뀌었습니다(편집 뒤 다시 저장 등). 지금 파일의 출처 기록으로는 확인할 수 없습니다.']);
    }
    (r.registry || []).forEach(function (h) {
      if (h.exact && h.status !== 'revoked') o.marks.push({ id: h.id, label: h.label, basis: h.basis });
      else if (!h.exact && h.status !== 'revoked' && h.label && h.label !== 'no_ai') o.near.push({ id: h.id, label: h.label, how: h.alt ? 'alt' : 'near' });
    });
    if (o.cat === 'none' && o.near.length) o.checks.push(['near', (o.near[0].how === 'alt' ? '표시본으로 등록된' : '비슷한') + " 이미지가 '" + LABEL[o.near[0].label] + "' 마크(" + o.near[0].id + ')로 등록돼 있습니다. AI 사용 여부를 다시 확인하세요.']);
    return o;
  }
  function compare(e, o) {   // 지금 표시 ↔ 근거
    var d = e.declared; if (!d || o.cat === 'error') return null;
    var ai = d !== 'none' && d !== 'no_ai';
    if (o.cat === 'ai_verified' || o.cat === 'ai_record') {
      if (d === 'none') return ['missing', 'AI 생성 · 편집 기록이 있는데 AI 사용 표시가 없습니다.'];
      if (d === 'no_ai') return ['conflict', "AI 생성 · 편집 기록이 있는데 'AI 미사용'으로 표시돼 있습니다."];
      if (o.allowed.length && o.allowed.indexOf(d) < 0) return ['weaker', "파일 기록은 '" + (SCOPE[o.scope] || 'AI 사용') + "'인데 '" + LABEL[d] + "'로 표시돼 있습니다. 고를 수 있는 표시: " + o.allowed.map(function (x) { return LABEL[x]; }).join(', ')];
      return null;
    }
    if (o.cat === 'cap' && ai) return ['conflict', "촬영 원본 서명이 확인된 파일인데 '" + LABEL[d] + "'로 표시돼 있습니다. AI로 고친 파일이 따로 있다면 그 파일로 확인하세요."];
    return null;
  }

  /* ---------- 같은 · 비슷한 이미지 묶음 ---------- */
  function hexOk(v, n) { return new RegExp('^[0-9a-f]{' + n + '}$').test(str(v)); }
  function nearImg(a, b) {   // 다른 상품을 같은 사진으로 묶지 않도록 보수적으로(밝기 구조 + 색 + 비율)
    if (a.kind !== 'image' || b.kind !== 'image') return false;
    if (+a.w > 0 && +a.h > 0 && +b.w > 0 && +b.h > 0) { var ra = a.w / a.h, rb = b.w / b.h; if (Math.abs(ra - rb) / Math.max(ra, rb) > 0.03) return false; }
    if (hexOk(a.fh, 64) && hexOk(b.fh, 64)) {
      if (ham(a.fh, b.fh) > FINE) return false;
      if (hexOk(a.rgb, 24) && hexOk(b.rgb, 24)) for (var q = 0; q < 4; q++) { var t = 0; for (var k = 0; k < 3; k++) { var v = parseInt(a.rgb.substr(q * 6 + k * 2, 2), 16) - parseInt(b.rgb.substr(q * 6 + k * 2, 2), 16); t += v * v; } if (Math.sqrt(t) > TINT) return false; }
      return true;
    }
    return hexOk(a.dhash, 16) && hexOk(b.dhash, 16) && ham(a.dhash, b.dhash) <= NEAR;
  }
  function groups(entries, infos) {
    /* 같은 파일(SHA-256)은 한 묶음. 비슷한 이미지는 묶음 안 모든 이미지와 가까울 때만 넣음(사슬처럼 번지지 않게) */
    var gl = [], bySha = {};
    entries.forEach(function (e, i) {
      var s = str(e.sha256);
      if (s && bySha[s] !== undefined) { gl[bySha[s]].push(i); return; }
      var gi = -1;
      if (e.kind === 'image') for (var g = 0; g < gl.length && gi < 0; g++) {
        if (gl[g].every(function (j) { return str(entries[j].sha256) === s && s ? true : nearImg(e, entries[j]); })) gi = g;
      }
      if (gi < 0) { gl.push([i]); gi = gl.length - 1; } else gl[gi].push(i);
      if (s) bySha[s] = gi;
    });
    var out = [];
    gl.forEach(function (m) {
      if (m.length < 2) return;
      var cats = {}, decl = {}, same = true;
      m.forEach(function (i) { var c = infos[i].cat; if (c !== 'error') cats[c === 'ai_verified' || c === 'ai_record' ? 'ai' : c] = 1; if (entries[i].declared) decl[entries[i].declared] = 1; if (entries[i].sha256 !== entries[m[0]].sha256) same = false; });
      var ck = Object.keys(cats), dk = Object.keys(decl), flag = '';
      if (ck.length > 1 && cats.ai) flag = '같은 · 비슷한 이미지인데 한쪽에만 AI 기록이 있습니다. 기록이 지워진 사본일 수 있으니, 같은 콘텐츠라면 표시를 맞추세요.';
      else if (ck.length > 1) flag = '같은 · 비슷한 이미지인데 근거가 서로 다릅니다.';
      else if (dk.length > 1) flag = '같은 · 비슷한 이미지인데 지금 표시가 서로 다릅니다.';
      out.push({ members: m, exact: same, flag: flag });
    });
    out.sort(function (x, y) { return (y.flag ? 1 : 0) - (x.flag ? 1 : 0) || y.members.length - x.members.length; });
    return out;
  }

  /* ---------- 리포트 만들기 ---------- */
  /** entries: [{ name, path?, size, kind, sha256, dhash, result | error, declared?, thumb? }] · opts: { org, title, at(Date), source } */
  function build(entries, opts) {
    opts = opts || {};
    var infos = entries.map(info), R = { v: VERSION, org: str(opts.org).trim().slice(0, 60), title: str(opts.title).trim() || 'AI 사용 확인 리포트', at: opts.at || new Date(), source: str(opts.source) || 'aimarker.kr/report',
      n: entries.length, ok: 0, kinds: {}, cats: {}, tools: {}, signers: {}, marks: 0, size: 0, rows: [], issues: [], groups: [], declared: 0, decl: { missing: 0, conflict: 0, weaker: 0 } };
    CAT_ORDER.forEach(function (c) { R.cats[c] = 0; });
    entries.forEach(function (e, i) {
      var o = infos[i], kind = e.kind || 'other';
      R.kinds[kind] = (R.kinds[kind] || 0) + 1; R.cats[o.cat]++; R.size += +e.size || 0;
      if (o.cat !== 'error') R.ok++;
      o.tools.forEach(function (t) { R.tools[t] = (R.tools[t] || 0) + 1; });
      if (o.signer) R.signers[o.signer] = (R.signers[o.signer] || 0) + 1;
      if (o.marks.length) R.marks++;
      if (e.declared) R.declared++;
      var cmp = compare(e, o); if (cmp) R.decl[cmp[0]]++;
      var row = { i: i + 1, name: e.name, path: e.path || '', size: e.size || 0, kind: kind, cat: o.cat, basis: o.basis, scope: o.scope, tools: o.tools, signer: o.signer, allowed: o.allowed, suggest: o.suggest,
        marks: o.marks, declared: e.declared || '', cmp: cmp, checks: o.checks, err: o.err || '', sha256: e.sha256 || '', thumb: e.thumb || '' };
      R.rows.push(row);
      if (cmp) R.issues.push({ type: cmp[0], row: row, text: cmp[1] });
      o.checks.forEach(function (c) { R.issues.push({ type: c[0], row: row, text: c[1] }); });
    });
    R.groups = groups(entries, infos);
    R.groups.forEach(function (g, gi) { if (g.flag) R.issues.push({ type: 'group', group: gi, rows: g.members.map(function (i) { return R.rows[i]; }), text: g.flag }); });
    var order = { conflict: 0, missing: 1, group: 2, tamper: 3, weaker: 4, near: 5 };
    R.issues.sort(function (a, b) { return order[a.type] - order[b.type]; });
    R.ready = R.cats.ai_verified + R.cats.ai_record + R.cats.cap;
    R.readyPct = pct(R.ready, R.ok); R.nonePct = pct(R.cats.none, R.ok);
    R.aiPct = pct(R.cats.ai_verified + R.cats.ai_record, R.ok);
    return R;
  }
  function top(obj, k) { return Object.keys(obj).map(function (x) { return [x, obj[x]]; }).sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); }).slice(0, k || 8); }

  /** 한 줄 요약(상담 신청 · 알림용) */
  function summaryText(R) {
    var s = '콘텐츠 ' + R.n + '건 AI 사용 확인: AI 사용 근거 ' + (R.cats.ai_verified + R.cats.ai_record) + '건(서명 검증 ' + R.cats.ai_verified + ' · 파일 기록 ' + R.cats.ai_record + '), 촬영 원본 서명 ' + R.cats.cap + '건, 근거 없음 ' + R.cats.none + '건' + (R.cats.error ? ', 확인 못함 ' + R.cats.error + '건' : '') + '. 바로 표시 가능 ' + R.readyPct + '%.';
    var iss = R.issues.filter(function (x) { return x.type !== 'near'; }).length; if (iss) s += ' 확인할 점 ' + iss + '건.';
    var t = top(R.tools, 3); if (t.length) s += ' 주요 도구: ' + t.map(function (x) { return x[0] + ' ' + x[1]; }).join(', ') + '.';
    return s;
  }

  /* ---------- CSV ---------- */
  function csv(R) {
    var head = ['번호', '파일', '경로', '종류', '크기(바이트)', '판정', '근거 등급', '범위', '도구', '서명자', '고를 수 있는 표시', '지금 표시', '지금 표시와 비교', '확인할 점', '이미 있는 AIMarker 마크', 'SHA-256'];
    var q = function (v) { v = str(v); return /[",\r\n]/.test(v) || /^[=+\-@]/.test(v) ? '"' + (/^[=+\-@]/.test(v) ? "'" : '') + v.replace(/"/g, '""') + '"' : v; };
    var lines = [head.join(',')];
    R.rows.forEach(function (r) {
      lines.push([r.i, r.name, r.path, KIND[r.kind] || r.kind, r.size, CAT[r.cat].t, BASIS[r.basis] || '', SCOPE[r.scope] || '', r.tools.join(' · '), r.signer, r.allowed.map(function (x) { return LABEL[x]; }).join(' · '),
        r.declared ? LABEL[r.declared] : '', r.cmp ? r.cmp[1] : '', (r.checks.map(function (c) { return c[1]; }).concat(r.err ? [r.err] : [])).join(' / '), r.marks.map(function (m) { return m.id + '(' + (LABEL[m.label] || m.label) + ')'; }).join(' · '), r.sha256].map(q).join(','));
    });
    return '﻿' + lines.join('\r\n') + '\r\n';
  }

  /* ---------- 혼자 열리는 HTML(인쇄 · PDF 저장 가능) ---------- */
  var CSS = [
    ':root{--ink:#0B1324;--ink2:#4A566B;--ink3:#7A869A;--line:#E4E9F2;--soft:#F5F7FB;--navy:#0E2A6B;--blue:#1F55F5;--mint:#0FA88F;--warn:#B4600A;--bad:#C2333A}',
    '*{box-sizing:border-box}html,body{margin:0;background:#fff;color:var(--ink);font:15px/1.6 "Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;word-break:keep-all;overflow-wrap:anywhere}',
    '.rp{max-width:1040px;margin:0 auto;padding:40px 32px 56px}',
    '.rp-top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid var(--navy);padding-bottom:20px}',
    '.rp-brand{font-weight:800;color:var(--navy);letter-spacing:-.01em}.rp-brand b{color:var(--blue)}',
    '.rp h1{font-size:28px;line-height:1.3;margin:6px 0 4px;letter-spacing:-.02em}.rp-sub{color:var(--ink2);margin:0}',
    '.rp-meta{text-align:right;color:var(--ink3);font-size:13px;white-space:nowrap}',
    '.rp h2{font-size:19px;margin:36px 0 12px;letter-spacing:-.01em}.rp h2 small{font-weight:500;color:var(--ink3);font-size:13px;margin-left:8px}',
    '.rp-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:22px}',
    '.rp-kpi div{border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:#fff}.rp-kpi b{display:block;font-size:28px;line-height:1.15;letter-spacing:-.02em;font-variant-numeric:tabular-nums}.rp-kpi span{color:var(--ink2);font-size:13px}',
    '.rp-kpi .hi{background:var(--navy);border-color:var(--navy);color:#fff}.rp-kpi .hi span{color:#C9D6F5}',
    '.rp-bar{display:flex;height:18px;border-radius:9px;overflow:hidden;background:var(--soft);margin:6px 0 10px}.rp-bar i{display:block;height:100%}',
    '.rp-leg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px 18px;margin:0;padding:0;list-style:none}.rp-leg li{display:flex;gap:10px;align-items:flex-start;font-size:14px}',
    '.rp-leg i{flex:none;width:12px;height:12px;border-radius:3px;margin-top:5px}.rp-leg b{font-variant-numeric:tabular-nums}.rp-leg small{display:block;color:var(--ink3);font-size:12.5px}',
    '.rp-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}',
    '.rp-hb{margin:0;padding:0;list-style:none}.rp-hb li{display:grid;grid-template-columns:150px 1fr 40px;gap:10px;align-items:center;font-size:14px;margin:6px 0}.rp-hb span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.rp-hb em{display:block;height:10px;border-radius:5px;background:var(--blue)}.rp-hb b{text-align:right;font-variant-numeric:tabular-nums}',
    '.rp-empty{color:var(--ink3);font-size:14px;margin:4px 0}',
    '.rp-iss{margin:0;padding:0;list-style:none;border:1px solid var(--line);border-radius:12px;overflow:hidden}.rp-iss li{display:grid;grid-template-columns:110px 1fr;gap:14px;padding:12px 16px;border-top:1px solid var(--line);font-size:14px}.rp-iss li:first-child{border-top:0}',
    '.rp-tag{display:inline-block;font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--soft);color:var(--ink2);height:max-content}',
    '.t-conflict,.t-tamper{background:#FDECEC;color:var(--bad)}.t-missing,.t-group{background:#FFF3E2;color:var(--warn)}.t-weaker,.t-near{background:#EEF3FF;color:var(--blue)}',
    '.rp-iss .fn{font-weight:600;word-break:break-all}.rp-iss p{margin:2px 0 0;color:var(--ink2)}',
    '.rp-next{margin:0;padding-left:20px}.rp-next li{margin:6px 0}',
    'table.rp-t{width:100%;border-collapse:collapse;font-size:13px}.rp-t th{position:sticky;top:0;background:var(--navy);color:#fff;text-align:left;font-weight:600;padding:8px 8px}',
    '.rp-t td{border-bottom:1px solid var(--line);padding:7px 8px;vertical-align:top}.rp-t tr:nth-child(even) td{background:#FAFBFD}',
    '.rp-t td:first-child{white-space:nowrap;font-variant-numeric:tabular-nums}.rp-t .fc{min-width:160px}.rp-t .tl{min-width:130px}.rp-t .nt{min-width:170px}.rp-t .fn{word-break:break-all;font-weight:600}.rp-t .sub{display:block;color:var(--ink3);font-weight:400;font-size:12px}.rp-t img{width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid var(--line);display:block}',
    '.rp-c{display:inline-flex;align-items:flex-start;gap:6px;font-weight:600;white-space:nowrap}.rp-c i{width:9px;height:9px;border-radius:50%;flex:none;margin-top:5px}',
    '.rp-t .lb{display:inline-block;white-space:nowrap;margin:0 4px 3px 0;padding:0 6px;border-radius:6px;background:#EEF3FF;color:#1F55F5;font-size:12px;font-weight:600}.rp-t .nw{white-space:nowrap}',
    '.rp-note{margin-top:36px;padding:16px 18px;background:var(--soft);border-radius:12px;color:var(--ink2);font-size:13px}.rp-note ul{margin:6px 0 0;padding-left:18px}',
    '.rp-foot{margin-top:18px;color:var(--ink3);font-size:12px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '@media screen and (max-width:720px){.rp{padding:24px 16px 40px}.rp-top{flex-direction:column}.rp-meta{text-align:left}.rp-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.rp-2{grid-template-columns:1fr}.rp-iss li{grid-template-columns:1fr;gap:6px}.rp-hb li{grid-template-columns:110px 1fr 34px}',
    '.rp-t thead{display:none}.rp-t,.rp-t tbody{display:block}.rp-t tr{display:grid;grid-template-columns:48px minmax(0,1fr);column-gap:12px;position:relative;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:10px}',
    '.rp-t tr:nth-child(even) td{background:none}.rp-t td{display:block;border:0;padding:0;grid-column:1/-1;min-width:0}.rp-t td.no{position:absolute;top:10px;right:12px;color:var(--ink3);font-size:12px}',
    '.rp-t td.th{grid-column:1;grid-row:1/span 2}.rp-t td.fc,.rp-t td.vd{grid-column:2;padding-right:26px}.rp-t td.vd{margin-top:4px}.rp-t.nothumb tr{grid-template-columns:minmax(0,1fr)}.rp-t.nothumb td.fc,.rp-t.nothumb td.vd{grid-column:1}',
    '.rp-t td[data-l]{margin-top:8px}.rp-t td[data-l]::before{content:attr(data-l);display:block;color:var(--ink3);font-size:11.5px;font-weight:600}.rp-t td[data-l]:empty{display:none}}',
    '@media print{@page{size:A4;margin:14mm}.rp{max-width:none;padding:0}.rp h2{break-after:avoid}.rp-iss li,.rp-t tr{break-inside:avoid}.rp-full{break-before:page}.rp-t th{position:static}.rp-t{font-size:11.5px}.rp-t img{width:36px;height:36px}.rp-t .fc{min-width:110px}.rp-t .tl{min-width:100px}.rp-t .nt{min-width:130px}.rp-kpi b{font-size:24px}}'
  ].join('\n');

  function catChip(c, short) { return '<span class="rp-c"><i style="background:' + CAT[c].c + '"></i>' + esc(short ? CAT[c].s : CAT[c].t) + '</span>'; }
  function rowName(r) { return '<span class="fn">' + esc(r.name) + '</span>' + (r.path && r.path !== r.name ? '<span class="sub">' + esc(r.path) + '</span>' : ''); }
  function nextSteps(R) {
    var out = [], ai = R.cats.ai_verified + R.cats.ai_record;
    if (ai) out.push('<b>AI 사용 근거가 있는 ' + ai + '건</b>은 근거 그대로 마크를 발급할 수 있습니다. 기업 API · MCP 로 올리는 순간 자동 발급(label: auto)하면 사람이 고를 일이 없습니다.');
    if (R.cats.cap) out.push('<b>촬영 원본 서명이 확인된 ' + R.cats.cap + '건</b>은 \'AI 미사용 · 서명 검증\' 마크로 원본임을 밝힐 수 있습니다.');
    if (R.cats.none) out.push('<b>근거 없는 ' + R.cats.none + '건</b>은 기술로 AI 사용 여부를 정할 수 없습니다. 제작자 · 판매자에게 확인해 \'발급자 신고\'로 표시하고, 앞으로는 생성 도구의 출처 기록(C2PA)을 지우지 않고 올리도록 안내하세요.');
    var c = R.decl.conflict + R.decl.missing; if (c) out.push('<b>지금 표시와 근거가 다른 ' + c + '건</b>을 먼저 고치세요. 근거와 다른 표시는 AIMarker 에서 발급되지 않습니다.');
    if (R.issues.some(function (x) { return x.type === 'group'; })) out.push('<b>같은 · 비슷한 이미지인데 근거가 다른 묶음</b>은 한쪽의 출처 기록이 지워진 사본일 수 있습니다. 같은 콘텐츠라면 같은 표시로 맞추세요.');
    if (R.issues.some(function (x) { return x.type === 'tamper'; })) out.push('<b>출처 기록과 파일이 맞지 않는 파일</b>은 편집 뒤 다시 저장되며 기록이 깨졌을 수 있습니다. 원본 파일로 다시 확인하세요.');
    out.push('대량 처리 · 정기 리포트 · 쇼핑몰 연동은 <b>contact@skkc.co.kr</b> 또는 aimarker.kr/contact 로 상담하세요.');
    return out;
  }
  /** opts: { thumbs: true(행에 썸네일), full: true(전체 목록 넣기, 기본 true) } */
  function html(R, opts) {
    opts = opts || {};
    var full = opts.full !== false, thumbs = opts.thumbs !== false && R.rows.some(function (r) { return r.thumb; });
    var kinds = top(R.kinds, 6).map(function (x) { return (KIND[x[0]] || x[0]) + ' ' + x[1]; }).join(' · ');
    var bar = CAT_ORDER.filter(function (c) { return R.cats[c]; }).map(function (c) { return '<i title="' + esc(CAT[c].t + ' ' + R.cats[c]) + '" style="width:' + pct(R.cats[c], R.n) + '%;background:' + CAT[c].c + '"></i>'; }).join('');
    var leg = CAT_ORDER.filter(function (c) { return c !== 'error' || R.cats.error; }).map(function (c) { return '<li><i style="background:' + CAT[c].c + '"></i><div><b>' + esc(CAT[c].t) + ' ' + R.cats[c] + '건</b> (' + pct(R.cats[c], R.n) + '%)<small>' + esc(CAT[c].d) + '</small></div></li>'; }).join('');
    var tl = top(R.tools, 8), sl = top(R.signers, 8), tmax = tl.length ? tl[0][1] : 1, smax = sl.length ? sl[0][1] : 1;
    var hb = function (list, max, empty) { return list.length ? '<ul class="rp-hb">' + list.map(function (x) { return '<li><span title="' + esc(x[0]) + '">' + esc(x[0]) + '</span><em style="width:' + Math.max(4, Math.round(x[1] * 100 / max)) + '%"></em><b>' + x[1] + '</b></li>'; }).join('') + '</ul>' : '<p class="rp-empty">' + esc(empty) + '</p>'; };
    var TAG = { conflict: '근거와 다름', missing: '표시 빠짐', group: '사본 불일치', tamper: '기록 손상', weaker: '표시 약함', near: '등록 이미지' };
    var iss = R.issues.slice(0, 60).map(function (x) {
      var who = x.type === 'group' ? x.rows.map(function (r) { return '<span class="fn">' + r.i + '. ' + esc(r.name) + '</span> ' + catChip(r.cat); }).join('<br>') : '<span class="fn">' + x.row.i + '. ' + esc(x.row.name) + '</span>';
      return '<li><span class="rp-tag t-' + x.type + '">' + TAG[x.type] + '</span><div>' + who + '<p>' + esc(x.text) + '</p></div></li>';
    }).join('');
    var more = R.issues.length > 60 ? '<p class="rp-empty">외 ' + (R.issues.length - 60) + '건은 CSV 에 있습니다.</p>' : '';
    var declNote = R.declared ? '지금 표시 목록과 맞춘 콘텐츠 ' + R.declared + '건: 근거와 다름 ' + R.decl.conflict + ' · 표시 빠짐 ' + R.decl.missing + ' · 표시 약함 ' + R.decl.weaker : '지금 표시 목록(CSV)을 함께 넣으면, 지금 붙어 있는 표시가 근거와 맞는지도 비교합니다.';
    var rows = R.rows.map(function (r) {
      var lab = r.err ? '<span class="sub">' + esc(r.err) + '</span>' : (r.allowed.length ? r.allowed.map(function (x) { return '<span class="lb">' + esc(LABEL[x]) + '</span>'; }).join('') : '');
      var note = [].concat(r.cmp ? [r.cmp[1]] : [], r.checks.map(function (c) { return c[1]; }), r.marks.length ? ['AIMarker 마크 ' + r.marks.map(function (m) { return m.id; }).join(', ')] : []);
      return '<tr>' + '<td class="no">' + r.i + '</td>' + (thumbs ? '<td class="th">' + (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="">' : '') + '</td>' : '') +
        '<td class="fc">' + rowName(r) + '<span class="sub">' + esc((KIND[r.kind] || r.kind) + ' · ' + bytes(r.size)) + '</span></td>' +
        '<td class="vd">' + catChip(r.cat, true) + '<span class="sub">' + esc([CAT[r.cat].b, SCOPE[r.scope] || ''].filter(Boolean).join(' · ')) + '</span></td>' +
        '<td class="tl" data-l="도구 · 서명자">' + esc([r.tools.join(', '), r.signer ? '서명 ' + r.signer : ''].filter(Boolean).join(' · ')) + '</td>' +
        '<td data-l="고를 수 있는 표시">' + lab + '</td>' + (R.declared ? '<td class="nw" data-l="지금 표시">' + esc(r.declared ? LABEL[r.declared] : '') + '</td>' : '') +
        '<td class="nt" data-l="확인할 점">' + esc(note.join(' / ')) + '</td></tr>';
    }).join('');
    var ttl = (R.org ? R.org + ' · ' : '') + R.title;
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(ttl) + '</title><meta name="robots" content="noindex"><style>' + CSS + '</style></head><body><main class="rp">' +
      '<header class="rp-top"><div><div class="rp-brand"><b>AI</b>Marker</div><h1>' + esc(ttl) + '</h1><p class="rp-sub">콘텐츠 ' + R.n + '건 · ' + esc(kinds) + ' · ' + bytes(R.size) + '</p></div>' +
      '<div class="rp-meta">' + esc(stamp(R.at)) + '<br>판정: AIMarker 출처 판정 엔진<br>' + esc(R.source) + '</div></header>' +
      '<section class="rp-kpi"><div class="hi"><b>' + R.readyPct + '%</b><span>근거로 바로 표시할 수 있는 콘텐츠</span></div>' +
      '<div><b>' + (R.cats.ai_verified + R.cats.ai_record) + '건</b><span>AI 사용 근거(서명 검증 ' + R.cats.ai_verified + ' · 파일 기록 ' + R.cats.ai_record + ')</span></div>' +
      '<div><b>' + R.cats.none + '건</b><span>근거 없음 · 제작자 확인 필요</span></div>' +
      '<div><b>' + R.issues.filter(function (x) { return x.type !== 'near'; }).length + '건</b><span>먼저 확인할 점</span></div></section>' +
      '<h2>근거 등급별 분포<small>판정은 파일 안 출처 기록과 전자서명으로만 합니다</small></h2><div class="rp-bar">' + bar + '</div><ul class="rp-leg">' + leg + '</ul>' +
      '<h2>먼저 확인할 점<small>' + esc(declNote) + '</small></h2>' + (iss ? '<ul class="rp-iss">' + iss + '</ul>' + more : '<p class="rp-empty">근거와 다른 표시 · 사본 불일치 · 손상된 출처 기록이 없습니다.</p>') +
      '<div class="rp-2"><div><h2>사용된 생성 · 편집 도구</h2>' + hb(tl, tmax, '파일 기록에서 찾은 AI 도구가 없습니다.') + '</div><div><h2>출처 기록 서명자</h2>' + hb(sl, smax, 'C2PA 전자서명이 있는 파일이 없습니다.') + '</div></div>' +
      (R.marks ? '<p class="rp-empty">이미 AIMarker 마크가 있는 콘텐츠 ' + R.marks + '건</p>' : '') +
      '<h2>다음 단계</h2><ol class="rp-next">' + nextSteps(R).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
      (full ? '<section class="rp-full"><h2>전체 목록<small>' + R.n + '건</small></h2><div class="rp-t-wrap"><table class="rp-t' + (thumbs ? '' : ' nothumb') + '"><thead><tr><th>#</th>' + (thumbs ? '<th></th>' : '') + '<th>파일</th><th>판정</th><th>도구 · 서명자</th><th>고를 수 있는 표시</th>' + (R.declared ? '<th>지금 표시</th>' : '') + '<th>확인할 점</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' : '') +
      '<div class="rp-note"><b>알아 두실 점</b><ul><li>이 리포트는 파일 안 출처 기록(C2PA · IPTC · XMP · 생성 도구 설정값)과 전자서명으로 판정한 결과입니다. 기록이 없는 파일의 AI 사용 여부는 추측하지 않고 \'근거 없음\'으로 둡니다.</li>' +
      '<li>원본 파일 · 픽셀은 AIMarker 서버로 보내지 않았습니다. 서버에는 특징값 · 해시 · 서명 검증에 필요한 기록 조각만 보냈고, 이 리포트는 확인을 실행한 사람의 브라우저에서 만들어졌습니다.</li>' +
      '<li>법률 자문이 아니며, 콘텐츠의 적법성을 보증하지 않습니다. 표시의 최종 책임은 게시자에게 있습니다.</li></ul></div>' +
      '<footer class="rp-foot"><span>AIMarker · AI 콘텐츠 투명성 기술 플랫폼 · aimarker.kr</span><span>리포트 ' + VERSION + '</span></footer>' +
      '</main></body></html>';
  }

  return { VERSION: VERSION, LABEL: LABEL, BASIS: BASIS, SCOPE: SCOPE, KIND: KIND, CAT: CAT, CAT_ORDER: CAT_ORDER, build: build, csv: csv, html: html, summaryText: summaryText, parseDeclared: parseDeclared, declaredTemplate: declaredTemplate, declWord: declWord, _info: info, _groups: groups, _ham: ham };
});
  return module.exports;
})();

/* ---------- 이름표 ---------- */
const LABELS = ['ai_generated', 'ai_edited', 'ai_assisted', 'no_ai'];
const LABEL_KO = { ai_generated: 'AI 생성', ai_edited: 'AI 편집 · 합성', ai_assisted: 'AI 보조', no_ai: 'AI 미사용' };
const BASIS_KO = { verified: '서명 검증', record: '파일 기록', declared: '발급자 신고', none: '근거 없음' };
const AI_KO = { used: 'AI 사용 근거 있음', not_used: 'AI 미사용 근거 있음(촬영 원본 서명 확인)', unknown: '파일만으로는 알 수 없음(기록 없음)' };
const SCOPE_KO = { generated: 'AI로 생성', edited: 'AI로 편집 · 합성', enhanced: 'AI로 보정', unknown: '범위 모름' };
const TRUST_KO = { c2pa: 'C2PA 신뢰 목록에 있는 서명자', itl: '임시 신뢰 목록(ITL)에 있는 서명자', allowed: '허용 인증서 목록에 있는 서명자', untrusted: '신뢰 목록에 없는 서명자' };
const KIND_KO = { image: '이미지', video: '영상', audio: '오디오', doc: '문서', text: '글', other: '파일' };
const DEC = { fix: '수정 후 출고', expert: '전문가 검토 권장', review: '확인 후 출고', clear: '큰 위험 후보 없음' };
const LV = { 3: '높음', 2: '주의', 1: '참고' };
const CAT = { 1: 'AI 사용 근거 · 표시', 2: '가상인물 · 딥페이크', 3: '업종별 금지 · 과장', 4: '추천 · 보증(협찬)', 5: '저작권 · 초상권 단서', 6: '브랜드 가이드' };
const MARK_NOTE = '마크는 표시와 근거를 기록하고 서명한 것이며 법적 인증이 아닙니다.';
const AD_NOTE = '안내: 위험 후보와 근거를 보여 주는 결과이며 법률 자문이 아닙니다. 위반이라고 단정하지 말고, 최종 판단은 담당자가 합니다.';

const INSTRUCTIONS = [
  'AIMarker는 콘텐츠의 AI 사용 여부를 파일 속 근거(C2PA 서명 · 생성 도구 기록 · 메타데이터)로 확인하고, 근거에 맞는 표시만 서명된 마크로 발급합니다. 마크 확인 쪽(aimarker.kr/m/)에서 누구나 표시 · 근거 · 이력을 봅니다.',
  '이미지 · 영상 · 오디오 · 글을 사용자에게 넘기거나 게시하기 전에 aimarker_analyze_file(글은 aimarker_analyze_text)로 확인하고, 표시가 필요하면 aimarker_mark 로 마크를 받으세요.',
  '표시는 verdict.allowed 안에서만 고르세요. 파일에 근거가 있으면 label 을 auto 로 두면 됩니다. 근거가 없으면(unknown) 사용자에게 실제 AI 사용 여부와 사용한 도구를 물은 뒤 그 답으로 발급하세요(근거: 발급자 신고).',
  '이 대화에서 당신(AI)이 만들거나 고친 콘텐츠라면 AI 사용 표시(ai_generated · ai_edited · ai_assisted)를 고르고 tools 에 사용한 AI를 적으세요. no_ai(AI 미사용)는 사용자가 AI를 사용하지 않았다고 직접 말했을 때만 고르세요. 추측으로 고르지 마세요.',
  'CONFIRM 이 오면(비슷한 이미지에 AI 마크가 있음 등) 그 내용을 사용자에게 그대로 보여 주고, 사용자가 확인했을 때만 confirm: true 로 다시 보내세요. CONFLICT 는 근거와 맞지 않는 표시이니 allowed 에서 다시 고르세요.',
  '발급 결과의 관리 키(mk_…)는 한 번만 나옵니다. 사용자에게 비밀번호처럼 보관하라고 알리세요. 표시 변경 · 철회에 필요합니다.',
  '폴더 · 여러 파일을 한꺼번에 확인해 정리할 때는 aimarker_analyze_folder(20건씩 확인 · 리포트 HTML · CSV 저장)를 쓰세요. 발급은 하지 않습니다.',
  '받은 파일 · 마크를 확인할 때는 aimarker_verify_mark(파일 속 서명 확인) · aimarker_mark_info(번호) · aimarker_find_marks(같은 · 비슷한 파일)를 쓰세요.',
  '부가 기능: 광고 · 상세페이지 · SNS 문구는 aimarker_check(또는 aimarker_auto_fix)로 검수할 수 있습니다. 결과는 위험 후보이며, 위반이라고 단정하지 말고 법률 자문이 아님을 알리세요.',
  '마크는 법적 인증이 아니라 표시와 근거의 기록입니다. 판정 정확도를 숫자로 말하지 마세요.'
].join('\n');

/* ---------- 도구 정의 ---------- */
const IND = { type: 'string', enum: ['auto', 'gen', 'food', 'hfood', 'cos', 'med', 'fin'], description: '업종 규칙 팩. auto(글로 자동 판별) · gen 일반 상품 · food 일반식품 · hfood 건강기능식품 · cos 화장품 · med 의료 · fin 금융. 모르면 auto.' };
const FLAGS = { type: 'object', description: '콘텐츠 정보. 모르면 비우세요.', properties: {
  sponsored: { type: 'boolean', description: '대가(제품 · 원고료 · 할인)를 받은 콘텐츠인지' },
  aiPerson: { type: 'boolean', description: 'AI로 만든 인물 · 목소리 · 아바타가 나오는지' },
  aiMedia: { type: 'boolean', description: 'AI로 만든 이미지 · 영상을 쓰는지' } } };
const GUIDE = { type: 'object', description: '브랜드 정책(선택).', properties: {
  ban: { type: 'array', items: { type: 'string' }, maxItems: 50, description: '쓰지 않을 말' },
  must: { type: 'array', items: { type: 'string' }, maxItems: 20, description: '꼭 넣을 문구' } } };
const LABEL = { type: 'string', enum: ['auto', ...LABELS], description: 'auto(파일 근거로 정함) · ai_generated(AI 생성) · ai_edited(AI 편집 · 합성) · ai_assisted(AI 보조) · no_ai(AI 미사용). 근거와 맞지 않으면 발급되지 않습니다.' };
const TOOLS_P = { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 40 }, description: '사용한 AI 도구 이름(예: Midjourney · ChatGPT · Firefly). AI 미사용이면 비움.' };
const RO = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };
const WR = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };

const TOOLS = [
  { name: 'aimarker_analyze_file', title: '파일의 AI 사용 확인',
    description: '이미지 · 영상 · 오디오 · 문서 파일을 이 컴퓨터에서 읽어 AI 사용 근거(C2PA 서명 재검증 · 생성 도구 기록 · 메타데이터)를 확인합니다. 판정(AI 사용 근거 있음 · 미사용 근거 있음 · 알 수 없음), 근거 등급, 고를 수 있는 표시(allowed), 같은 · 비슷한 파일의 기존 마크를 돌려줍니다. 원본 파일은 보내지 않습니다. 마크를 받기 전에 부르세요.',
    inputSchema: { type: 'object', properties: { path: { type: 'string', minLength: 1, description: '파일 경로(절대 경로 권장)' } }, required: ['path'] },
    annotations: { title: '파일의 AI 사용 확인', ...RO } },
  { name: 'aimarker_analyze_text', title: '글의 AI 사용 확인',
    description: '글은 파일 기록이 없어 AI 사용 여부를 파일만으로 확인할 수 없습니다. 글의 해시(SHA-256)와 AI 활용을 밝히는 표현이 있는지만 보내 같은 글의 기존 마크와 주의할 점을 돌려줍니다. 글 원문은 보내지 않습니다.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 200000, description: '확인할 글' } }, required: ['text'] },
    annotations: { title: '글의 AI 사용 확인', ...RO } },
  { name: 'aimarker_analyze_folder', title: '폴더 일괄 확인 리포트',
    description: '폴더(또는 파일 목록)의 이미지 · 영상 · 오디오 · PDF 를 이 컴퓨터에서 읽어 20건씩 AI 사용 근거를 확인하고 리포트로 정리합니다: 근거 등급별 개수, 근거로 바로 표시할 수 있는 비율, 먼저 확인할 점(지금 표시와 근거가 다른 것 · 같은 파일인데 근거가 다른 것 · 출처 기록이 파일과 맞지 않는 것), 도구 · 서명자 분포. declared_csv(파일 이름, 지금 표시)를 주면 지금 붙인 표시가 근거와 맞는지도 비교하고, save_dir 을 주면 리포트(HTML) · CSV 를 저장합니다. 원본은 보내지 않고, 마크는 발급하지 않습니다.',
    inputSchema: { type: 'object', properties: {
      path: { type: 'string', description: '폴더 경로(또는 파일 하나)' },
      paths: { type: 'array', maxItems: 200, items: { type: 'string' }, description: '파일 경로 목록(path 대신 쓸 때)' },
      recursive: { type: 'boolean', description: '하위 폴더까지 볼지(기본 true)' },
      max_files: { type: 'integer', minimum: 1, maximum: 200, description: '최대 파일 수(기본 200)' },
      declared_csv: { type: 'string', description: '지금 표시 목록 CSV 경로(선택). 첫 칸 파일 이름, 둘째 칸 AI 생성 · AI 편집 · AI 보조 · AI 미사용 · 표시 없음' },
      org: { type: 'string', maxLength: 60, description: '리포트 제목에 넣을 회사 · 브랜드 이름(선택)' },
      save_dir: { type: 'string', description: '리포트 HTML · CSV 를 저장할 폴더(선택)' } } },
    annotations: { title: '폴더 일괄 확인 리포트', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } },
  { name: 'aimarker_mark', title: 'AI 사용 마크 발급',
    description: '파일(path) 또는 글(text)에 서명된 AIMarker 마크를 발급합니다. 서버가 근거를 다시 확인해 맞지 않는 표시는 막습니다(CONFLICT). 마크 번호 · 확인 주소 · 관리 키(한 번만) · 서명(JWS) · 원장 번호를 돌려줍니다. write_copy 가 true 면 JPEG · PNG 파일 안에 마크 번호와 서명을 넣은 표시본을 만들어 저장하고 마크에 등록합니다.',
    inputSchema: { type: 'object', properties: {
      path: { type: 'string', description: '파일 경로(path 와 text 가운데 하나)' },
      text: { type: 'string', maxLength: 200000, description: '글(path 와 text 가운데 하나, 원문은 보내지 않음)' },
      label: LABEL, tools: TOOLS_P,
      title: { type: 'string', maxLength: 80, description: '콘텐츠 이름(마크 확인 쪽에 보임, 선택)' },
      issuer: { type: 'string', maxLength: 40, description: '발급자 이름(마크 확인 쪽에 보임, 선택)' },
      confirm: { type: 'boolean', description: 'CONFIRM 질문을 사용자가 확인했을 때만 true' },
      write_copy: { type: 'boolean', description: 'true 면 마크를 넣은 표시본 파일(JPEG · PNG)을 원본 옆에 저장' },
      copy_path: { type: 'string', description: '표시본 저장 경로(선택, 기본: 원본이름.aimarker.확장자)' } } },
    annotations: { title: 'AI 사용 마크 발급', ...WR } },
  { name: 'aimarker_mark_batch', title: '여러 파일 한 번에 마크 발급',
    description: '파일 · 글을 한 번에 20개까지 확인하고 발급합니다. label 이 auto(기본)면 파일 근거로 표시를 정하고, 근거가 없는 항목은 발급하지 않고 DECLARE 로 돌려줍니다(사용자에게 물어 aimarker_mark 로 따로 발급).',
    inputSchema: { type: 'object', properties: {
      items: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'object', properties: { path: { type: 'string' }, text: { type: 'string', maxLength: 200000 }, label: LABEL, tools: TOOLS_P, title: { type: 'string', maxLength: 80 }, ref: { type: 'string', maxLength: 60, description: '구분용 이름(선택)' } } } },
      issuer: { type: 'string', maxLength: 40 } }, required: ['items'] },
    annotations: { title: '여러 파일 한 번에 마크 발급', ...WR } },
  { name: 'aimarker_mark_info', title: '마크 확인',
    description: '마크 번호(AM-로 시작)로 표시 · 근거 · 상태(유효 · 철회) · 이력 · 공개 근거를 확인하고, 마크 서명(Ed25519)을 공개키로 이 컴퓨터에서 확인합니다.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', minLength: 13, maxLength: 16, description: '마크 번호(예: AM-7K2Q9XR4TB)' } }, required: ['id'] },
    annotations: { title: '마크 확인', ...RO } },
  { name: 'aimarker_verify_mark', title: '파일 · 서명으로 마크 확인',
    description: '파일 안에 들어 있는 AIMarker 마크(표시본의 XMP 마크 번호 · 서명)나 서명 문자열(JWS)을 공개키로 확인합니다. 파일이면 서명에 적힌 원본 해시 · 등록된 표시본 해시와 이 파일을 대조하고, 마크가 철회됐는지도 봅니다.',
    inputSchema: { type: 'object', properties: { path: { type: 'string', description: '확인할 파일 경로' }, credential: { type: 'string', description: '마크 서명(JWS) 문자열' } } },
    annotations: { title: '파일 · 서명으로 마크 확인', ...RO } },
  { name: 'aimarker_find_marks', title: '같은 · 비슷한 파일의 마크 찾기',
    description: '파일(path) · SHA-256 · 지각 해시(dhash)로 이미 발급된 마크를 찾습니다. 같은 파일 · 발급자가 등록한 표시본 · 비슷한 이미지를 나눠 돌려줍니다. 마크를 떼어 낸 파일의 원래 표시를 찾을 때 씁니다.',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, dhash: { type: 'string', pattern: '^[0-9a-f]{16}$' } } },
    annotations: { title: '같은 · 비슷한 파일의 마크 찾기', ...RO } },
  { name: 'aimarker_edit_mark', title: '마크 표시 변경 · 철회',
    description: '관리 키로 마크의 제목 · 발급자 이름 · 표시를 바꾸거나 철회합니다. 표시는 발급 때 확인한 근거 안에서만 바꿀 수 있고, 바꾸면 새로 서명됩니다. 모든 변경은 이력과 원장에 남습니다. 철회는 되돌릴 수 없으니 사용자가 원할 때만 쓰세요.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, key: { type: 'string', pattern: '^mk_[0-9a-f]{32}$', description: '관리 키(mk_…)' }, label: { type: 'string', enum: LABELS }, title: { type: 'string', maxLength: 80 }, issuer: { type: 'string', maxLength: 40 }, revoke: { type: 'string', maxLength: 80, description: '철회 이유(이 값이 있으면 철회)' } }, required: ['id', 'key'] },
    annotations: { title: '마크 표시 변경 · 철회', readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true } },
  { name: 'aimarker_anchor', title: '공개 앵커 확인',
    description: '하루치 원장(마크 발급 · 변경 기록)을 묶은 뿌리 해시와 OpenTimestamps 증명을 확인합니다. date(YYYY-MM-DD) 또는 원장 번호(LG…)를 넣으세요. save_dir 을 주면 그날 원장 글(.txt)과 증명 파일(.ots)을 저장합니다(ots verify 로 직접 확인 가능).',
    inputSchema: { type: 'object', properties: { date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }, ledger_id: { type: 'string' }, save_dir: { type: 'string', description: '원장 글 · 증명 파일을 저장할 폴더(선택)' } } },
    annotations: { title: '공개 앵커 확인', ...RO } },
  /* 부가 기능 */
  { name: 'aimarker_check', title: '광고 · 콘텐츠 문구 검수(부가 기능)',
    description: '광고 · 상세페이지 · SNS 문구를 한국 광고 규칙과 협찬 · 가상인물 · AI 표시 기준으로 검수합니다. 위험 후보마다 근거 법령 · 이유 · 바꿀 말, 붙일 표시, 출고 결정(fix · expert · review · clear), 바꿀 말을 반영한 문구(fixed_text)를 돌려줍니다.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 5000, description: '검수할 문구(5,000자까지)' }, ind: IND, flags: FLAGS, guide: GUIDE }, required: ['text'] },
    annotations: { title: '광고 · 콘텐츠 문구 검수', ...RO } },
  { name: 'aimarker_auto_fix', title: '광고 문구 자동 수정(부가 기능)',
    description: '검수 · 고치기 · 다시 검수를 서버에서 끝까지 자동으로 합니다. 결과는 그대로 출고 가능 · 자동 수정 후 출고 가능 · 자동으로 고칠 수 없어 반려 가운데 하나와 고친 문구 · 바꾼 곳 · 남은 위험 후보입니다. stamp 가 true 면 고친 문구의 해시를 원장에 남깁니다.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 5000 }, ind: IND, flags: FLAGS, guide: GUIDE, stamp: { type: 'boolean' } }, required: ['text'] },
    annotations: { title: '광고 문구 자동 수정', ...RO } },
  { name: 'aimarker_check_batch', title: '여러 문구 한 번에 검수(부가 기능)',
    description: '문구를 한 번에 최대 20건 검수합니다. 각 항목의 점수 · 결정 · 위험 후보를 돌려줍니다.',
    inputSchema: { type: 'object', properties: { items: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'object', properties: { id: { type: 'string', description: '구분용 이름(선택)' }, text: { type: 'string', minLength: 1, maxLength: 5000 }, ind: IND, flags: FLAGS }, required: ['text'] } }, guide: GUIDE }, required: ['items'] },
    annotations: { title: '여러 문구 한 번에 검수', ...RO } },
  { name: 'aimarker_label', title: 'AI · 광고 표시 문구 받기',
    description: '붙일 표시 문구를 받습니다. kind: image(AI 이미지) · video(AI 영상) · person(가상인물) · text(AI 글) · sponsor(광고 · 협찬). 짧은 표시 · 긴 안내 문장 · HTML · 마크다운 · IPTC 디지털 출처 값을 돌려줍니다. 표시 문구는 한국AI윤리위원회 기준을 따릅니다.',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['image', 'video', 'person', 'text', 'sponsor'] }, level: { type: 'string', enum: ['gen', 'edit'], description: 'gen: AI로 만듦 · edit: AI로 고침' } }, required: ['kind'] },
    annotations: { title: 'AI · 광고 표시 문구 받기', ...RO } },
  { name: 'aimarker_geo_check', title: 'GEO 진단 · AI 상품 피드',
    description: '사이트 · 상품 쪽 주소 하나로 AI 검색 준비 점수(0~100: AI 크롤러 접근 · 구조화 데이터 · 본문 · 메타 · 질문과 답 · 이미지 · 신뢰)와 붙여 넣을 고칠 코드(JSON-LD · llms.txt · robots.txt · 메타 · FAQ)를 받습니다. 상품 쪽이면 AI 상품 피드 한 줄(id · title · price · brand · image_link …)도 줍니다. 공개된 쪽만 읽고, 같은 주소는 6시간 같은 결과입니다.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', minLength: 4, maxLength: 300, description: '사이트 · 상품 쪽 주소(예: myshop.co.kr/product/123)' } }, required: ['url'] },
    annotations: { title: 'GEO 진단 · AI 상품 피드', ...RO } },
  { name: 'aimarker_detect_text', title: 'AI 작성 추정률(글)',
    description: '글을 서버로 보내 AI 작성 추정률(0~100: 글 가운데 AI가 쓴 글과 비슷한 패턴을 보이는 부분의 비율)과 AI 패턴이 몰린 문장을 받습니다. 결정적 모델이라 같은 글은 언제나 같은 값입니다. 추정일 뿐 판정 · 증명이 아니니 결과만으로 사람을 판단하지 마세요. 글은 저장하지 않습니다. 한 번에 6,000자.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 6000, description: '확인할 글(6,000자까지)' } }, required: ['text'] },
    annotations: { title: 'AI 작성 추정률', ...RO } },
  { name: 'aimarker_scan_site', title: '사이트 진단(부가 기능)',
    description: '공개된 사이트 첫 화면과 이미지 12장까지 살펴 AI 사용 흔적 · AI 상담 창 · 광고 표현 위험 후보를 보수적으로 진단합니다. 기록이 지워진 이미지는 없음이 아니라 확인 불가로 셉니다. 10~20초 걸립니다.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', minLength: 4, maxLength: 200, description: '사이트 주소(예: myshop.co.kr)' } }, required: ['url'] },
    annotations: { title: '사이트 진단', ...RO } },
  { name: 'aimarker_request_approval', title: '광고주 승인 링크 만들기(부가 기능)',
    description: '문구를 검수한 뒤, 광고주가 로그인 없이 승인하거나 수정을 요청할 수 있는 링크(90일 보관)를 만듭니다. 문구가 서버에 90일 보관되므로 사용자가 원할 때만 쓰세요.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 3000 }, title: { type: 'string', maxLength: 60, description: '소재 이름' }, brand: { type: 'string', maxLength: 40 }, channel: { type: 'string', maxLength: 30, description: '예: 인스타그램 · 상세페이지' }, requester: { type: 'string', maxLength: 30, description: '요청하는 사람 · 팀' }, ind: IND, flags: FLAGS }, required: ['text', 'title'] },
    annotations: { title: '광고주 승인 링크 만들기', ...WR } },
  { name: 'aimarker_approval_status', title: '승인 상태 확인(부가 기능)',
    description: '승인 링크 id(AP로 시작)들의 상태(대기 · 승인 · 수정 요청)와 답한 사람 · 시각 · 메모를 확인합니다.',
    inputSchema: { type: 'object', properties: { ids: { type: 'array', minItems: 1, maxItems: 60, items: { type: 'string' } } }, required: ['ids'] },
    annotations: { title: '승인 상태 확인', ...RO } },
  { name: 'aimarker_stamp', title: '증거 원장에 기록',
    description: '보고서 · 콘텐츠 버전 · 승인 기록의 SHA-256 해시를 서버 시각과 함께 원장에 남깁니다. content 를 주면 이 컴퓨터에서 해시만 계산해 보냅니다. 원장은 매일 공개 앵커로 묶입니다.',
    inputSchema: { type: 'object', properties: { content: { type: 'string', description: '기록할 내용(해시만 보냄)' }, sha256: { type: 'string', pattern: '^[0-9a-f]{64}$', description: '이미 계산한 SHA-256' }, kind: { type: 'string', enum: ['report', 'version', 'approval'] }, count: { type: 'integer', minimum: 0, description: '보고서에 든 소재 수(선택)' } } },
    annotations: { title: '증거 원장에 기록', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } },
  { name: 'aimarker_verify', title: '증거 원장 확인',
    description: '원장 번호(LG로 시작) · SHA-256 · 내용 가운데 하나로 원장에 기록이 있는지, 언제 무엇으로 기록됐는지 확인합니다. content 는 이 컴퓨터에서 해시로 바꿔 보냅니다.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, content: { type: 'string' } } },
    annotations: { title: '증거 원장 확인', ...RO } }
];

const PROMPTS = [
  { name: 'mark_content', title: 'AI 사용 확인하고 마크 받기', description: '파일의 AI 사용 근거를 확인하고, 근거에 맞는 표시로 서명된 마크를 받습니다.',
    arguments: [{ name: 'path', description: '파일 경로', required: true }, { name: 'how_made', description: '만든 방법 · 사용한 AI 도구(알면)', required: false }] },
  { name: 'check_received_file', title: '받은 파일의 마크 확인', description: '파일 속 AIMarker 마크와 서명, 같은 · 비슷한 파일의 마크를 확인합니다.',
    arguments: [{ name: 'path', description: '파일 경로', required: true }] },
  { name: 'report_folder', title: '폴더 콘텐츠 AI 사용 확인 리포트', description: '폴더 안 이미지 · 영상 · 오디오 · PDF 의 AI 사용 근거를 한꺼번에 확인하고, 바로 표시할 수 있는 것 · 물어봐야 할 것 · 고칠 것을 정리합니다.',
    arguments: [{ name: 'path', description: '폴더 경로', required: true }, { name: 'save_dir', description: '리포트를 저장할 폴더(선택)', required: false }] },
  { name: 'review_ad_copy', title: '광고 문구 검수하고 고치기(부가 기능)', description: '문구를 AIMarker로 검수하고, 위험 후보를 근거와 함께 설명한 뒤 고친 문구를 제안합니다.',
    arguments: [{ name: 'text', description: '검수할 문구', required: true }, { name: 'industry', description: '업종(모르면 비움): 일반 · 식품 · 건강기능식품 · 화장품 · 의료 · 금융', required: false }] }
];

/* ---------- 도움 함수 ---------- */
class ToolError extends Error {}
const sha = (s) => createHash('sha256').update(typeof s === 'string' ? Buffer.from(s, 'utf8') : s).digest('hex');
const IND_KO = { '일반': 'gen', '식품': 'food', '일반식품': 'food', '건강기능식품': 'hfood', '건기식': 'hfood', '화장품': 'cos', '의료': 'med', '병원': 'med', '금융': 'fin' };
const indOf = (v) => { v = String(v || '').trim(); if (!v || v === 'auto') return ''; return IND_KO[v] || v; };
const need = (c, msg) => { if (!c) throw new ToolError(msg); };
const ok = (text, structured) => ({ content: [{ type: 'text', text }], ...(structured ? { structuredContent: structured } : {}) });
const fail = (msg) => ({ content: [{ type: 'text', text: msg }], isError: true });
const markUrl = (id) => SITE + '/m/?id=' + encodeURIComponent(id);

async function api(action, body, { keyless } = {}) {
  if (!KEY && !keyless) throw new ToolError('AIMARKER_KEY 환경 변수가 없습니다. https://aimarker.kr/developers/#key 에서 무료 API 키를 받아 MCP 설정의 env 에 AIMARKER_KEY 로 넣어 주세요.');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  let res, txt;
  try {
    res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, ...(KEY ? { key: KEY } : {}), ...body }), redirect: 'follow', signal: ctl.signal });
    txt = await res.text();
  } catch (e) {
    throw new ToolError(e.name === 'AbortError' ? 'AIMarker 서버가 ' + Math.round(TIMEOUT / 1000) + '초 안에 답하지 않았습니다. 잠시 뒤 다시 시도해 주세요.' : 'AIMarker 서버에 연결하지 못했습니다: ' + e.message);
  } finally { clearTimeout(timer); }
  let j;
  try { j = JSON.parse(txt); } catch { throw new ToolError('AIMarker 서버 응답을 읽지 못했습니다(HTTP ' + res.status + '). 잠시 뒤 다시 시도해 주세요.'); }
  if (!j || !j.ok) {
    const code = (j && j.code) || 'ERROR';
    const hint = { KEY: ' API 키를 확인해 주세요.', QUOTA: ' 오늘 한도를 다 썼습니다. 내일 다시 쓰거나 한도 상향을 문의해 주세요(contact@skkc.co.kr).', BUSY: ' 잠시 뒤 다시 시도해 주세요.' }[code] || '';
    const err = new ToolError('[' + code + '] ' + ((j && (j.message || j.msg)) || '요청을 처리하지 못했습니다.') + hint);
    err.body = j; throw err;
  }
  return j;
}

/* 파일 읽기 → 특징값 · 서명 검증용 조각(원본은 이 컴퓨터에만) */
function resolvePath(p) { return path.resolve(String(p).replace(/^~(?=$|[\\/])/, os.homedir())); }
async function readLocal(p) {
  need(typeof p === 'string' && p.trim(), 'path(파일 경로)를 넣어 주세요.');
  const fp = resolvePath(p.trim());
  let st; try { st = await stat(fp); } catch { throw new ToolError('파일을 찾지 못했습니다: ' + fp); }
  need(st.isFile(), '파일 경로가 아닙니다: ' + fp);
  need(st.size <= MAX_FILE, '파일이 너무 큽니다(300MB까지): ' + fp);
  return { fp, bytes: new Uint8Array(await readFile(fp)) };
}
let SHARP = null;
async function dhashOf(fp, kind) {
  if (kind !== 'image') return '';
  try {
    if (SHARP === null) { try { SHARP = (await import('sharp')).default; } catch { SHARP = false; } }
    if (!SHARP) return '';
    const { data, info } = await SHARP(fp, { failOn: 'none' }).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return AIM.dhash({ width: info.width, height: info.height, data });
  } catch { return ''; }
}
async function fileInput(p) {
  const { fp, bytes } = await readLocal(p);
  const rep = await AIM.inspect(bytes, { name: path.basename(fp) });
  const dh = await dhashOf(fp, rep.kind);
  return { fp, bytes, rep, features: AIM.features(rep, { dhash: dh }), pack: AIM.pack(rep) };
}
async function textInput(t) {
  need(typeof t === 'string' && t.trim(), 'text(글)를 넣어 주세요.');
  return { features: await AIM.textFeatures(t), pack: null };
}
async function input(a) {
  need(!!a.path !== (a.text != null && a.text !== ''), 'path(파일)와 text(글) 가운데 하나만 넣어 주세요.');
  return a.path ? fileInput(a.path) : textInput(a.text);
}

/* 폴더 일괄 확인: 파일 고르기 · 20건씩 확인(서명 묶음 90만 자) · 동시에 3묶음 */
const EXT_RE = /\.(jpe?g|png|webp|gif|avif|heic|heif|tiff?|bmp|svg|mp4|m4v|mov|m4a|mp3|wav|flac|aac|ogg|webm|pdf)$/i;
const SKIP_RE = /(^|\/)(\.|__MACOSX\/|node_modules\/|Thumbs\.db$|desktop\.ini$)/i;
async function listFiles(dir, recursive, limit) {
  const out = [];
  async function walk(d) {
    if (out.length >= limit) return;
    let list; try { list = await readdir(d, { withFileTypes: true }); } catch { return; }
    list.sort((x, y) => (x.name < y.name ? -1 : 1));
    for (const de of list) {
      if (out.length >= limit) return;
      if (de.name.startsWith('.') || de.name === 'node_modules' || de.name === '__MACOSX') continue;
      const fp = path.join(d, de.name);
      if (de.isDirectory()) { if (recursive) await walk(fp); } else if (de.isFile()) out.push(fp);
    }
  }
  await walk(dir);
  return out;
}
async function analyzeEntries(entries) {
  const todo = entries.filter((e) => !e.error && e._f), batches = [];
  let cur = [], budget = 900000;
  for (const e of todo) { if (cur.length && (cur.length >= 20 || e._pl > budget)) { batches.push(cur); cur = []; budget = 900000; } cur.push(e); budget -= e._pl; }
  if (cur.length) batches.push(cur);
  let i = 0, stop = '';
  const alone = [];
  const run = async () => {
    while (i < batches.length) {
      const b = batches[i++];
      if (stop) { b.forEach((e) => { e.error = stop; }); continue; }
      try {
        const r = await api('am.analyzebatch', { items: b.map((e, k) => ({ ref: String(k), features: e._f, pack: e._p || undefined })) });
        r.results.forEach((x, k) => { const e = b[+x.ref] || b[k]; if (x.ok) e.result = x; else if (x.code === 'TIME' || x.code === 'PACK_BUDGET') alone.push(e); else e.error = x.msg || x.code || '확인하지 못했습니다'; });
      } catch (err) {
        const code = err && err.body && err.body.code;
        if (code === 'QUOTA' || code === 'BUSY' || code === 'KEY') stop = err.message;
        b.forEach((e) => { e.error = err.message || '확인하지 못했습니다'; });
      }
    }
  };
  await Promise.all(new Array(Math.min(3, batches.length)).fill(0).map(run));
  for (const e of alone) { try { e.result = await api('am.analyze', { features: e._f, pack: e._p || undefined }); } catch (err) { e.error = err.message || '확인하지 못했습니다'; } }
  entries.forEach((e) => { delete e._f; delete e._p; delete e._pl; });
  return entries;
}

/* 판정 모양 */
function shapeAnalysis(r, where) {
  const v = r.verdict || {};
  const groups = { verified: [], auto: [], registry: [] };
  (r.signals || []).forEach((s) => {
    if (s.src === 'registry') groups.registry.push(s.text);
    else if (s.level === 'verified') groups.verified.push(s.text);
    else groups.auto.push((s.level === 'hint' ? '(참고) ' : '') + s.text);
  });
  return {
    file: where || null, kind: r.kind, kind_ko: KIND_KO[r.kind] || r.kind,
    ai: v.ai, ai_ko: AI_KO[v.ai] || v.ai, scope: v.scope || '', scope_ko: SCOPE_KO[v.scope] || '',
    basis: v.basis, basis_ko: BASIS_KO[v.basis] || v.basis, allowed: v.allowed || [], allowed_ko: (v.allowed || []).map((x) => LABEL_KO[x]),
    suggest: v.suggest || '', suggest_ko: v.suggest ? LABEL_KO[v.suggest] : '', summary: r.summary || '', notes: r.notes || [],
    signer: r.signer || null, evidence: groups, existing_marks: (r.registry || []).map((h) => ({ id: h.id, label: h.label, label_ko: LABEL_KO[h.label] || h.label, basis_ko: BASIS_KO[h.basis] || h.basis, status: h.status, relation: h.exact ? '같은 파일' : h.alt ? '발급자가 등록한 표시본' : '비슷한 이미지(거리 ' + h.dist + ')', url: markUrl(h.id) })),
    engine: r.engine
  };
}
function analysisText(s) {
  const L = ['AIMarker AI 사용 확인' + (s.file ? ': ' + s.file : '') + ' (' + s.kind_ko + ')'];
  L.push('- 판정: ' + s.ai_ko + (s.scope_ko && s.ai === 'used' ? ' · ' + s.scope_ko : '') + ' · 근거: ' + s.basis_ko);
  if (s.summary) L.push('- 요약: ' + s.summary);
  L.push('- 고를 수 있는 표시: ' + s.allowed_ko.join(', ') + (s.suggest ? ' (근거로 정해지는 표시: ' + s.suggest_ko + ')' : ' (근거가 없어 사용자에게 물어 정해야 함)'));
  if (s.signer) L.push('- 서명자: ' + (s.signer.org || '알 수 없음') + ' · 서명 ' + (s.signer.valid ? '유효' : '확인 안 됨') + ' · ' + (TRUST_KO[s.signer.trust] || '신뢰 목록 확인 안 됨'));
  if (s.evidence.verified.length) L.push('', '기술적으로 검증된 출처 정보', ...s.evidence.verified.map((t) => '- ' + t));
  if (s.evidence.auto.length) L.push('', '자동 분석 결과', ...s.evidence.auto.map((t) => '- ' + t));
  if (s.existing_marks.length) L.push('', '이미 있는 마크', ...s.existing_marks.map((m) => '- ' + m.id + ' · ' + m.label_ko + ' · ' + m.basis_ko + ' · ' + m.relation + (m.status === 'revoked' ? ' · 철회됨' : '')));
  if (s.notes.length) L.push('', ...s.notes.map((t) => '참고: ' + t));
  L.push('', s.suggest ? '마크를 받으려면 aimarker_mark 를 label: "auto" 로 부르세요.' : '파일에 근거가 없습니다. 사용자에게 AI 사용 여부와 사용한 도구를 물은 뒤 aimarker_mark 에 label 과 tools 를 넣어 부르세요. AI 미사용은 사용자가 그렇다고 말했을 때만 고르세요.');
  return L.join('\n');
}

/* 마크 서명 확인(공개키는 한 번 받아 둠) */
let KEYS = null, KEYS_FRESH = false;
async function markKeys(fresh) {
  if (KEYS && (!fresh || KEYS_FRESH)) return KEYS;
  if (!fresh) {
    try { const r = await fetch(KEYS_URL); if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.keys) && j.keys.length) return (KEYS = j.keys); } } catch { /* 서버에서 받기 */ }
  }
  const p = await api('am.pubkey', {}, { keyless: true });
  KEYS_FRESH = true;
  const add = (p.keys || []).filter((k) => !(KEYS || []).some((x) => x.kid === k.kid));
  return (KEYS = (KEYS || []).concat(add));
}
async function checkCred(cred) {
  if (!cred) return { ok: false, reason: 'none' };
  let v = await AIM.verifyMark(cred, await markKeys());
  if (!v.ok && v.reason === 'unknown_key') v = await AIM.verifyMark(cred, await markKeys(true));   // 새 키: 서버 공개키로 한 번 더
  return { ok: v.ok, kid: v.kid, reason: v.reason || '', payload: v.payload };
}
const REASON_KO = { none: '서명이 없습니다(1.21.0 이전 발급)', format: '서명 형식이 올바르지 않습니다', alg: '지원하지 않는 서명 방식입니다', unknown_key: '공개키 목록에 없는 키입니다', issuer: '발급자가 aimarker.kr 이 아닙니다', signature: '서명이 내용과 맞지 않습니다(바뀐 내용)' };

/* 표시본: 마크 번호 · 서명을 파일 안(XMP)에 넣음 */
async function writeCopy(src, r, out) {
  const fmt = AIM.sniff(src.bytes);
  need(fmt === 'jpeg' || fmt === 'png', '표시본은 JPEG · PNG 만 만듭니다(이 파일: ' + fmt + '). 마크는 발급됐습니다.');
  const xmp = AIM.buildXmp({ id: r.id, url: r.url, label: r.label, basis: r.basis, cred: r.cred, dst: r.xmp && r.xmp.dst, aiSystem: r.xmp && r.xmp.aiSystem, note: LABEL_KO[r.label] + ' · AIMarker ' + r.id + ' · ' + r.url });
  const bytes = AIM.embedXmp(src.bytes, xmp);
  const ext = path.extname(src.fp);
  const dest = out ? resolvePath(out) : path.join(path.dirname(src.fp), path.basename(src.fp, ext) + '.aimarker' + ext);
  need(dest !== src.fp, '표시본 경로가 원본과 같습니다. 다른 경로를 주세요.');
  await writeFile(dest, bytes);
  const h = sha(bytes);
  let registered = false;
  try { const e = await api('am.markedit', { id: r.id, mkey: r.key, alt: [h] }); registered = (e.changed || []).includes('표시본') || (e.mark && (e.mark.alts || []).includes(h)); } catch { registered = false; }
  return { path: dest, sha256: h, registered };
}

/* 광고 검수 결과 모양(부가 기능) */
function applyFix(text, f, rep) {
  if (rep == null) return text;
  if (f.s >= 0) {
    const a = f.s, b = f.re && f.re >= f.e ? f.re : f.e;
    if (text.slice(f.s, f.e) !== f.t) return text;
    if (rep === '(삭제)') return text;
    return (text.slice(0, a) + rep + text.slice(b)).replace(/[ \t]{2,}/g, ' ').replace(/ ([,.!?])/g, '$1');
  }
  if (/^[\[(]/.test(rep)) { const m = /^\s*/.exec(text)[0]; if (text.includes(rep.trim())) return text; return m + rep + text.slice(m.length); }
  if (text.includes(rep.trim())) return text;
  return text.replace(/\s+$/, '') + rep;
}
function applyAll(text, findings) {
  let n = 0, at = Infinity;
  findings.filter((f) => f.s >= 0 && (f.reps || []).some((r) => r && r !== '(삭제)')).sort((a, b) => b.s - a.s).forEach((f) => {
    if ((f.re || f.e) > at) return;
    const rep = f.reps.filter((r) => r && r !== '(삭제)')[0];
    const t2 = applyFix(text, f, rep);
    if (t2 !== text) { text = t2; n++; at = f.s; }
  });
  findings.filter((f) => f.s < 0 && f.reps && f.reps[0]).forEach((f) => { const t2 = applyFix(text, f, f.reps[0]); if (t2 !== text) { text = t2; n++; } });
  return { text, n };
}
function shapeFinding(f) {
  return { rule: f.id, level: LV[f.lv] || String(f.lv), category: CAT[f.cat] || '', text: f.t || null, missing_label: f.s < 0,
    reason: f.why || '', law: f.law || '', suggestions: (f.reps || []).filter(Boolean).map((r) => (r === '(삭제)' ? '(이 표현 빼기)' : r.trim())), tip: f.tip || '', start: f.s, end: f.e };
}
function shapeCheck(text, r) {
  const fixed = applyAll(text, r.findings || []);
  return { decision: r.decision, decision_ko: DEC[r.decision] || r.decision, score: r.score, industry: r.indName || r.ind, industry_auto: !!r.auto,
    counts: r.counts, findings: (r.findings || []).map(shapeFinding), labels: (r.labels || []).map((l) => ({ text: l.text, sentence: l.long, where: l.where, iptc: l.iptc || null })),
    fixed_text: fixed.n ? fixed.text : null, fixed_count: fixed.n, rule_pack: r.pack ? r.pack.name + ' ' + r.pack.ver : '' };
}
function checkText(s) {
  const L = ['AIMarker 검수 결과' + (s.rule_pack ? ' (' + s.rule_pack + ')' : '')];
  L.push('- 결정: ' + s.decision_ko + ' (decision=' + s.decision + ') · 위험 점수 ' + s.score + '/100');
  L.push('- 업종: ' + s.industry + (s.industry_auto ? '(자동 판별)' : ''));
  if (s.counts) L.push('- 후보: 높음 ' + s.counts.high + ' · 주의 ' + s.counts.mid + ' · 참고 ' + s.counts.info);
  if (s.findings.length) {
    L.push('', '위험 후보');
    s.findings.forEach((f, i) => {
      L.push((i + 1) + '. [' + f.level + '] ' + (f.text ? '"' + f.text + '"' : '빠진 표시') + ' · ' + f.category + ' (' + f.rule + ')');
      if (f.reason) L.push('   이유: ' + f.reason);
      if (f.law) L.push('   근거: ' + f.law);
      if (f.suggestions.length) L.push('   바꿀 말: ' + f.suggestions.join(' / '));
      if (f.tip) L.push('   방법: ' + f.tip);
    });
  } else L.push('', '큰 위험 후보가 없습니다. 근거 자료 · 표시 위치는 한 번 더 확인하세요.');
  if (s.labels.length) { L.push('', '붙일 표시'); s.labels.forEach((l) => L.push('- ' + l.text + ': ' + l.sentence + ' (위치: ' + l.where + ')')); }
  if (s.fixed_text) L.push('', '바꿀 말을 반영한 문구(빼야 할 표현과 바꿀 말이 없는 표현은 그대로 두었으니 직접 고친 뒤 다시 검수하세요):', s.fixed_text);
  L.push('', AD_NOTE);
  return L.join('\n');
}

/* OpenTimestamps 증명 파일(.ots) */
function otsFile(rootHex, proofs) {
  const MAGIC = Buffer.from([0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94]);
  let list = Object.keys(proofs || {}).map((k) => Buffer.from(proofs[k], 'base64')).filter((u) => u.length);
  list = list.filter((u) => u[0] !== 0xff).concat(list.filter((u) => u[0] === 0xff).slice(0, 1));
  const parts = [MAGIC, Buffer.from([0x01, 0x08]), Buffer.from(rootHex, 'hex')];
  list.forEach((u, k) => { if (k < list.length - 1) parts.push(Buffer.from([0xff])); parts.push(u); });
  return Buffer.concat(parts);
}

/* ---------- 도구 실행 ---------- */
const RUN = {
  async aimarker_analyze_file(a) {
    const src = await fileInput(a.path);
    const r = await api('am.analyze', { features: src.features, pack: src.pack || undefined });
    const s = shapeAnalysis(r, src.fp);
    s.sha256 = src.features.sha256; s.dhash = src.features.dhash || '';
    if (src.rep.xmp && src.rep.xmp.aimarker && src.rep.xmp.aimarker.id) s.embedded_mark = src.rep.xmp.aimarker.id;
    return ok(analysisText(s) + (s.embedded_mark ? '\n\n이 파일 안에 AIMarker 마크(' + s.embedded_mark + ')가 들어 있습니다. aimarker_verify_mark 로 서명을 확인하세요.' : ''), s);
  },
  async aimarker_analyze_text(a) {
    const src = await textInput(a.text);
    const r = await api('am.analyze', { features: src.features });
    const s = shapeAnalysis(r, null);
    s.sha256 = src.features.sha256; s.disclosure = !!src.features.disclosure; s.hidden_chars = !!src.features.zw;
    return ok(analysisText(s) + (s.hidden_chars ? '\n참고: 글에 보이지 않는 문자(폭 없는 문자)가 들어 있습니다. 해시는 그 문자를 뺀 글로 계산했습니다.' : ''), s);
  },
  async aimarker_analyze_folder(a) {
    const max = Math.min(200, Math.max(1, Math.floor(+a.max_files || 200)));
    let files = [], root = '';
    if (Array.isArray(a.paths) && a.paths.length) files = a.paths.slice(0, 1000).map((x) => resolvePath(String(x)));
    else {
      need(typeof a.path === 'string' && a.path.trim(), 'path(폴더) 또는 paths(파일 목록)를 넣어 주세요.');
      root = resolvePath(a.path.trim());
      let st; try { st = await stat(root); } catch { throw new ToolError('폴더를 찾지 못했습니다: ' + root); }
      files = st.isDirectory() ? await listFiles(root, a.recursive !== false, 5000) : [root];
    }
    const skipped = { type: 0, over: 0 };
    files = files.filter((f) => { if (SKIP_RE.test(f.split(path.sep).join('/'))) return false; if (!EXT_RE.test(f)) { skipped.type++; return false; } return true; });
    if (files.length > max) { skipped.over = files.length - max; files = files.slice(0, max); }
    need(files.length, '확인할 파일(이미지 · 영상 · 오디오 · PDF)이 없습니다' + (skipped.type ? '(지원하지 않는 형식 ' + skipped.type + '개는 건너뜀)' : '') + '.');
    let decl = null;
    if (a.declared_csv) { try { decl = REP.parseDeclared(await readFile(resolvePath(a.declared_csv), 'utf8')); } catch { throw new ToolError('지금 표시 목록 CSV 를 읽지 못했습니다: ' + a.declared_csv); } }
    const entries = [];
    for (const fp of files) {
      const e = { name: path.basename(fp), path: root ? path.relative(root, fp) : fp, size: 0, kind: 'other', sha256: '', dhash: '', result: null, error: '' };
      try {
        const src = await fileInput(fp);
        e.size = src.bytes.length; e.kind = src.rep.kind || 'other'; e.sha256 = src.features.sha256; e.dhash = src.features.dhash || '';
        e._f = src.features; e._p = src.pack || null; e._pl = e._p ? JSON.stringify(e._p).length : 0;
      } catch (err) { e.error = '읽지 못했습니다: ' + (err && err.message || err); }
      if (decl) { const d = decl.map[e.name.toLowerCase()]; if (d) e.declared = d; }
      entries.push(e);
    }
    await analyzeEntries(entries);
    const R = REP.build(entries.map((e) => ({ name: e.name, path: e.path, size: e.size, kind: e.kind, sha256: e.sha256, dhash: e.dhash, result: e.result, error: e.error, declared: e.declared || '' })), { org: a.org || '', source: 'AIMarker MCP ' + VERSION });
    const saved = [];
    if (a.save_dir) {
      const dir = resolvePath(a.save_dir); await mkdir(dir, { recursive: true });
      const base = path.join(dir, 'aimarker-report-' + new Date().toISOString().slice(0, 10));
      await writeFile(base + '.html', REP.html(R), 'utf8'); await writeFile(base + '.csv', REP.csv(R), 'utf8');
      saved.push(base + '.html', base + '.csv');
    }
    const TAG = { conflict: '근거와 다름', missing: '표시 빠짐', group: '사본 불일치', tamper: '기록 손상', weaker: '표시 약함', near: '등록 이미지 참고' };
    const iss = R.issues.filter((x) => x.type !== 'near');
    const L = ['AIMarker 일괄 확인 리포트' + (R.org ? ' · ' + R.org : '') + (root ? ' · ' + root : ''), REP.summaryText(R)];
    if (skipped.type || skipped.over) L.push('건너뜀: ' + [skipped.type ? '지원하지 않는 형식 ' + skipped.type + '개' : '', skipped.over ? '최대 수를 넘는 ' + skipped.over + '개' : ''].filter(Boolean).join(' · '));
    if (iss.length) L.push('', '먼저 확인할 점', ...iss.slice(0, 12).map((x) => '- [' + TAG[x.type] + '] ' + (x.type === 'group' ? x.rows.map((r) => r.name).join(', ') : x.row.name) + ': ' + x.text), ...(iss.length > 12 ? ['- 외 ' + (iss.length - 12) + '건은 리포트에 있습니다.'] : []));
    L.push('', '다음 단계: 근거가 있는 파일은 aimarker_mark_batch(label auto)로 발급할 수 있습니다. 근거가 없는 파일은 사용자에게 AI 사용 여부를 물어 발급자 신고로 표시하세요.');
    if (saved.length) L.push('저장: ' + saved.join(' · '));
    L.push(MARK_NOTE);
    return ok(L.join('\n'), { n: R.n, ready_pct: R.readyPct, categories: R.cats, declared: R.declared ? R.decl : null, tools: R.tools, signers: R.signers, existing_marks: R.marks,
      issues: iss.slice(0, 50).map((x) => ({ type: x.type, type_ko: TAG[x.type], files: x.type === 'group' ? x.rows.map((r) => r.path || r.name) : [x.row.path || x.row.name], text: x.text })),
      files: R.rows.map((r) => ({ path: r.path || r.name, kind: r.kind, category: r.cat, basis: r.basis, allowed: r.allowed, tools: r.tools, signer: r.signer, declared: r.declared || '', note: r.cmp ? r.cmp[1] : (r.err || '') })), saved, skipped });
  },
  async aimarker_mark(a) {
    const src = await input(a);
    let label = String(a.label || 'auto');
    need(label === 'auto' || LABELS.includes(label), 'label 은 auto · ai_generated · ai_edited · ai_assisted · no_ai 가운데 하나입니다.');
    if (label === 'auto') {
      const an = await api('am.analyze', { features: src.features, pack: src.pack || undefined });
      const v = an.verdict || {};
      if (!v.suggest) return fail('[DECLARE] 파일에 AI 사용 근거가 없어 표시를 자동으로 정할 수 없습니다. 사용자에게 AI 사용 여부와 사용한 도구를 물은 뒤 label 과 tools 를 넣어 다시 부르세요. 고를 수 있는 표시: ' + (v.allowed || LABELS).map((x) => LABEL_KO[x] + '(' + x + ')').join(', ') + '. AI 미사용(no_ai)은 사용자가 그렇다고 말했을 때만 고르세요.');
      label = v.suggest;
    }
    const tools = Array.isArray(a.tools) ? a.tools.map((t) => String(t).slice(0, 40)).filter(Boolean).slice(0, 10) : [];
    let r;
    try {
      r = await api('am.mark', { features: src.features, pack: src.pack || undefined, label, tools, title: a.title || '', issuer: a.issuer || '', confirm: !!a.confirm });
    } catch (e) {
      const b = e.body || {};
      if (b.code === 'CONFIRM') return fail('[CONFIRM] ' + (b.message || b.msg) + (b.related ? '\n관련 마크: ' + markUrl(b.related) : '') + '\n사용자에게 이 내용을 보여 주고, 확인했다고 하면 confirm: true 로 다시 부르세요.');
      if (b.code === 'CONFLICT') return fail('[CONFLICT] ' + (b.message || b.msg) + (b.reasons && b.reasons.length ? '\n근거: ' + b.reasons.join(' / ') : '') + '\n고를 수 있는 표시: ' + (b.allowed || []).map((x) => LABEL_KO[x] + '(' + x + ')').join(', '));
      throw e;
    }
    const sig = await checkCred(r.cred).catch(() => ({ ok: false, reason: 'check' }));
    const s = { id: r.id, url: r.url, again: !!r.again, label: r.label, label_ko: LABEL_KO[r.label], basis: r.basis, basis_ko: BASIS_KO[r.basis], scope: r.scope || '', tools: r.tools || tools,
      management_key: r.key || null, credential: r.cred || null, kid: r.kid || '', signature_ok: sig.ok, ledger: r.ledger ? r.ledger.id : '', at: r.at || '', embed_html: '<a class="aimarker-mark" href="' + r.url + '" data-id="' + r.id + '" data-label="' + r.label + '" data-basis="' + r.basis + '">' + LABEL_KO[r.label] + ' · AIMarker</a><script src="' + SITE + '/m/embed.js" async></script>' };
    const L = [];
    if (r.again) L.push('같은 파일에 같은 표시의 마크가 이미 있어 그 마크를 돌려줍니다(새로 발급하지 않음).', '- 마크: ' + r.id + ' · ' + r.url);
    else {
      L.push('마크를 발급했습니다.', '- 마크: ' + r.id + ' · ' + LABEL_KO[r.label] + ' · 근거: ' + BASIS_KO[r.basis], '- 확인 주소: ' + r.url, '- 서명: ' + (sig.ok ? '공개키로 확인됨(' + r.kid + ')' : '확인 안 됨'), '- 원장: ' + s.ledger);
      if (r.key) L.push('- 관리 키: ' + r.key + ' (한 번만 보여 줍니다. 표시 변경 · 철회에 필요하니 비밀번호처럼 보관하세요)');
    }
    if (a.write_copy && src.fp && r.key) {
      try { const c = await writeCopy(src, Object.assign({}, r, { key: r.key }), a.copy_path); s.copy = c; L.push('- 표시본: ' + c.path + (c.registered ? ' (마크에 등록됨)' : ' (등록 실패: 마크 확인 쪽에서 다시 등록하세요)')); }
      catch (e) { L.push('- 표시본을 만들지 못했습니다: ' + e.message); }
    }
    if (r.basis === 'declared') L.push('', '근거가 발급자 신고이므로 마크 확인 쪽에 \'발급자 신고\'로 표시됩니다. 실제와 다르면 관리 키로 바꾸거나 철회하세요.');
    L.push('', '웹 페이지에 붙이는 배지(HTML):', s.embed_html, '', MARK_NOTE);
    return ok(L.join('\n'), s);
  },
  async aimarker_mark_batch(a) {
    need(Array.isArray(a.items) && a.items.length, 'items(발급할 파일 · 글 목록)를 넣어 주세요.');
    need(a.items.length <= 20, '한 번에 20개까지 발급합니다.');
    const prepared = [], local = [];
    for (let i = 0; i < a.items.length; i++) {
      const it = a.items[i] || {}, ref = String(it.ref || (it.path ? path.basename(it.path) : 'text-' + (i + 1))).slice(0, 60);
      try {
        const src = await input(it);
        prepared.push({ ref, features: src.features, pack: src.pack || undefined, label: it.label || 'auto', tools: Array.isArray(it.tools) ? it.tools.slice(0, 10) : [], title: it.title || '' });
      } catch (e) { local.push({ ref, ok: false, code: 'LOCAL', msg: e.message }); }
    }
    const r = prepared.length ? await api('am.markbatch', { items: prepared, issuer: a.issuer || '' }) : { results: [] };
    const results = (r.results || []).map((x) => ({ ref: x.ref, ok: !!x.ok, id: x.id || '', url: x.url || '', label_ko: x.label ? LABEL_KO[x.label] : '', basis_ko: x.basis ? BASIS_KO[x.basis] : '', management_key: x.key || null, again: !!x.again, code: x.ok ? '' : x.code, message: x.ok ? '' : (x.msg || x.message || '') })).concat(local);
    const L = ['AIMarker 일괄 발급 ' + results.length + '건 · 새로 발급 ' + results.filter((x) => x.ok && !x.again).length + '건'];
    results.forEach((x) => L.push('- ' + x.ref + ': ' + (x.ok ? x.id + ' · ' + x.label_ko + ' · ' + x.basis_ko + (x.again ? ' (이미 있음)' : '') : '발급 안 됨 · ' + x.code + ' · ' + x.message)));
    if (results.some((x) => x.code === 'DECLARE')) L.push('', 'DECLARE 항목은 파일에 근거가 없습니다. 사용자에게 AI 사용 여부를 물은 뒤 aimarker_mark 로 하나씩 발급하세요.');
    L.push('', '관리 키는 structuredContent.results 에 한 번만 있습니다. 사용자에게 안전하게 보관하라고 알리세요.', MARK_NOTE);
    return ok(L.join('\n'), { results });
  },
  async aimarker_mark_info(a) {
    need(a.id, 'id(마크 번호)를 넣어 주세요.');
    const r = await api('am.markinfo', { id: String(a.id).trim() }, { keyless: true });
    const sig = await checkCred(r.cred).catch(() => ({ ok: false, reason: 'check' }));
    const match = sig.payload ? sig.payload.sub === r.id && sig.payload.label === r.label && sig.payload.basis === r.basis && sig.payload.sha256 === r.sha256 : false;
    const s = { id: r.id, url: r.url, status: r.status, status_ko: r.status === 'revoked' ? '철회됨' : '유효', kind_ko: KIND_KO[r.kind] || r.kind, label: r.label, label_ko: r.labelKo || LABEL_KO[r.label], basis: r.basis, basis_ko: r.basisKo || BASIS_KO[r.basis],
      scope: r.scope, title: r.title, issuer: r.issuer, at: r.at, sha256: r.sha256, alts: r.alts || [], dhash: r.dhash, tools: r.tools, signer: r.signer, ledger: r.ledger,
      signature: { ok: sig.ok && match, kid: sig.kid || r.kid || '', reason: sig.ok ? (match ? '' : 'mismatch') : sig.reason }, evidence: r.evidence || [], history: r.history || [] };
    const L = ['AIMarker 마크 ' + s.id + ' · ' + s.status_ko, '- 표시: ' + s.label_ko + ' · 근거: ' + s.basis_ko + (s.title ? ' · ' + s.title : '') + (s.issuer ? ' · 발급자 ' + s.issuer : ''), '- 발급: ' + s.at + ' · 원장 ' + s.ledger,
      '- 서명: ' + (s.signature.ok ? '공개키로 확인됨(' + s.signature.kid + ')' : '확인 안 됨 · ' + (s.signature.reason === 'mismatch' ? '서명 내용과 마크 정보가 다릅니다' : REASON_KO[s.signature.reason] || s.signature.reason))];
    if (s.evidence.length) L.push('', '공개 근거', ...s.evidence.map((e) => '- ' + e.t));
    if (s.history.length) L.push('', '이력', ...s.history.map((h) => '- ' + h.at + ' · ' + (h.note || h.ev)));
    L.push('', '확인 주소: ' + s.url, MARK_NOTE);
    return ok(L.join('\n'), s);
  },
  async aimarker_verify_mark(a) {
    need(a.path || a.credential, 'path(파일) 또는 credential(서명 문자열)을 넣어 주세요.');
    let cred = a.credential ? String(a.credential).trim() : '', id = '', src = null;
    if (a.path) {
      src = await fileInput(a.path);
      const x = src.rep.xmp && src.rep.xmp.aimarker;
      if (x) { id = x.id || ''; if (!cred) cred = x.cred || ''; }
    }
    const L = [], s = { file: src ? src.fp : null, sha256: src ? src.features.sha256 : null, embedded_mark: id || null };
    if (!cred && !id) {
      if (src) {
        const lk = await api('am.lookup', { sha256: src.features.sha256, dhash: src.features.dhash || undefined }, { keyless: true });
        s.found = (lk.items || []).map((h) => ({ id: h.id, label_ko: LABEL_KO[h.label], basis_ko: BASIS_KO[h.basis], status: h.status, relation: h.exact ? '같은 파일' : h.alt ? '발급자가 등록한 표시본' : '비슷한 이미지', url: markUrl(h.id) }));
        L.push('파일 안에 AIMarker 마크가 없습니다.', s.found.length ? '같은 · 비슷한 파일의 마크:' : '같은 · 비슷한 파일로 등록된 마크도 없습니다.', ...s.found.map((m) => '- ' + m.id + ' · ' + m.label_ko + ' · ' + m.basis_ko + ' · ' + m.relation + (m.status === 'revoked' ? ' · 철회됨' : '')));
        return ok(L.join('\n'), s);
      }
      return fail('확인할 서명이 없습니다.');
    }
    const sig = await checkCred(cred).catch(() => ({ ok: false, reason: 'check' }));
    s.signature = { ok: sig.ok, kid: sig.kid || '', reason: sig.reason || '' };
    const p = sig.payload || {};
    if (!id) id = p.sub || '';
    let info = null;
    if (id) { try { info = await api('am.markinfo', { id }, { keyless: true }); } catch { info = null; } }
    s.mark = info ? { id: info.id, status: info.status, label_ko: info.labelKo, basis_ko: info.basisKo, url: info.url } : (id ? { id, url: markUrl(id) } : null);
    if (src) {
      const h = src.features.sha256, alts = info ? info.alts || [] : [];
      s.file_match = h === p.sha256 ? '원본과 같은 파일' : alts.includes(h) ? '발급자가 등록한 표시본' : '서명에 적힌 파일과 다름(바뀌었거나 다른 파일)';
    }
    L.push('AIMarker 마크 서명 확인' + (s.file ? ': ' + s.file : ''));
    L.push('- 서명: ' + (sig.ok ? '유효(공개키 ' + sig.kid + ')' : '확인 안 됨 · ' + (REASON_KO[sig.reason] || sig.reason)));
    if (sig.payload) L.push('- 서명 내용: ' + (p.sub || '') + ' · ' + (LABEL_KO[p.label] || p.label) + ' · 근거 ' + (BASIS_KO[p.basis] || p.basis) + ' · ' + (p.at || '') + (p.upd ? ' (표시 변경 ' + p.upd + ')' : ''));
    if (s.mark && s.mark.status) L.push('- 현재 상태: ' + (s.mark.status === 'revoked' ? '철회됨' : '유효') + ' · ' + s.mark.label_ko + (info && sig.payload && (info.label !== p.label) ? ' (서명 뒤 표시가 바뀜: 확인 쪽의 최신 서명을 보세요)' : ''));
    if (s.file_match) L.push('- 파일 대조: ' + s.file_match);
    if (s.mark) L.push('- 확인 주소: ' + s.mark.url);
    L.push('', MARK_NOTE);
    return ok(L.join('\n'), s);
  },
  async aimarker_find_marks(a) {
    let sha256 = a.sha256 ? String(a.sha256).toLowerCase() : '', dhash = a.dhash ? String(a.dhash).toLowerCase() : '', fp = null;
    if (a.path) { const src = await fileInput(a.path); sha256 = src.features.sha256; dhash = src.features.dhash || dhash; fp = src.fp; }
    need(sha256 || dhash, 'path · sha256 · dhash 가운데 하나를 넣어 주세요.');
    const r = await api('am.lookup', { sha256: sha256 || undefined, dhash: dhash || undefined }, { keyless: true });
    const items = (r.items || []).map((h) => ({ id: h.id, label: h.label, label_ko: LABEL_KO[h.label], basis_ko: BASIS_KO[h.basis], status: h.status, at: h.at, relation: h.exact ? '같은 파일' : h.alt ? '발급자가 등록한 표시본' : '비슷한 이미지(거리 ' + h.dist + ')', url: markUrl(h.id) }));
    const L = ['AIMarker 마크 찾기' + (fp ? ': ' + fp : '') + (dhash ? '' : ' (지각 해시 없음: 같은 파일 · 표시본만 찾음)')];
    if (!items.length) L.push('등록된 마크가 없습니다.');
    items.forEach((m) => L.push('- ' + m.id + ' · ' + m.label_ko + ' · ' + m.basis_ko + ' · ' + m.relation + (m.status === 'revoked' ? ' · 철회됨' : '') + ' · ' + m.url));
    return ok(L.join('\n'), { sha256, dhash, items });
  },
  async aimarker_edit_mark(a) {
    need(a.id && a.key, 'id(마크 번호)와 key(관리 키)를 넣어 주세요.');
    const body = { id: String(a.id).trim(), mkey: String(a.key).trim() };   // API 키는 key, 관리 키는 mkey
    if (a.label) body.label = a.label;
    if (a.title != null) body.title = a.title;
    if (a.issuer != null) body.issuer = a.issuer;
    if (a.revoke) body.revoke = String(a.revoke);
    const r = await api('am.markedit', body);
    const m = r.mark || {};
    return ok((r.changed && r.changed.length ? '바꿨습니다: ' + r.changed.join(', ') : '바뀐 것이 없습니다.') + '\n- 마크: ' + m.id + ' · ' + (m.status === 'revoked' ? '철회됨' : '유효') + ' · ' + (m.labelKo || '') + ' · 근거 ' + (m.basisKo || '') + (r.ledger ? '\n- 원장: ' + r.ledger.id : '') + '\n- 확인 주소: ' + (m.url || ''), { changed: r.changed || [], mark: m, ledger: r.ledger || null });
  },
  async aimarker_anchor(a) {
    const body = a.ledger_id ? { id: String(a.ledger_id).trim() } : a.date ? { date: String(a.date) } : {};
    const r = await api('am.anchor', body, { keyless: true });
    if (r.pending || (!r.root && !r.items)) return ok('아직 공개 앵커로 묶인 기록이 없습니다' + (r.date ? '(' + r.date + ')' : '') + '. ' + (r.message || '하루치 원장은 다음 날 새벽에 묶입니다.'), r);
    if (r.items) return ok('공개 앵커 목록(최근)\n' + r.items.map((x) => '- ' + x.date + ' · ' + x.count + '건 · ' + (x.status === 'anchored' ? '올림' : '다시 보내는 중') + ' · 뿌리 ' + String(x.root || '').slice(0, 16) + '…').join('\n'), r);
    const L = ['공개 앵커 ' + r.date + ' · ' + r.count + '건(' + r.first + ' ~ ' + r.last + ')', '- 뿌리 해시: ' + r.root, '- 다시 계산: ' + (r.match ? '같음' : '다름'), '- 앞날 뿌리: ' + r.prev, '- 상태: ' + (r.status === 'anchored' ? 'OpenTimestamps 달력 ' + Object.keys(r.proofs || {}).length + '곳에 올림(' + r.anchoredAt + ')' : '달력 서버에 다시 보내는 중')];
    if (body.id && r.position >= 0) L.push('- 원장 ' + body.id + ' 은 그날 ' + (r.position + 1) + '번째 줄입니다.');
    if (a.save_dir && r.text) {
      const dir = resolvePath(a.save_dir); await mkdir(dir, { recursive: true });
      const base = path.join(dir, 'aimarker-ledger-' + r.date);
      await writeFile(base + '.txt', r.text, 'utf8');
      const files = [base + '.txt'];
      if (r.proofs && Object.keys(r.proofs).length) { await writeFile(base + '.txt.ots', otsFile(r.root, r.proofs)); files.push(base + '.txt.ots'); }
      L.push('- 저장: ' + files.join(' · '), '  확인: sha256sum 으로 원장 글의 해시가 뿌리 해시와 같은지 보고, ots verify ' + path.basename(base) + '.txt.ots 로 시각 증명을 확인하세요(비트코인 블록에 들어가기까지 몇 시간 걸릴 수 있음).');
    }
    return ok(L.join('\n'), Object.assign({}, r, { text: undefined }));
  },
  async aimarker_check(a) {
    need(typeof a.text === 'string' && a.text.trim(), 'text(검수할 문구)를 넣어 주세요.');
    need(a.text.length <= 5000, '문구는 5,000자까지 검수합니다. 나눠서 보내 주세요.');
    const r = await api('am.check', { text: a.text, ind: indOf(a.ind), flags: a.flags || {}, guide: a.guide || undefined });
    const s = shapeCheck(a.text, r);
    return ok(checkText(s), s);
  },
  async aimarker_auto_fix(a) {
    need(typeof a.text === 'string' && a.text.trim(), 'text(고칠 문구)를 넣어 주세요.');
    const r = await api('am.auto', { text: a.text, ind: indOf(a.ind), flags: a.flags || {}, guide: a.guide || undefined, stamp: !!a.stamp });
    const L = ['AIMarker 자동 수정: ' + r.outcomeKo + ' (' + r.before.score + '점 → ' + r.after.score + '점)'];
    if (r.applied && r.applied.length) L.push('', '바꾼 곳', ...r.applied.map((x) => '- ' + (x.from ? '"' + x.from + '"' : '(빠진 표시)') + ' → ' + (x.to ? '"' + x.to + '"' : '(뺌)')));
    if (r.changed) L.push('', '고친 문구:', r.text);
    if (r.left && r.left.length) L.push('', '남은 위험 후보(사람이 고쳐야 함)', ...r.left.map((f) => '- [' + (LV[f.lv] || f.lv) + '] ' + (f.t ? '"' + f.t + '"' : '빠진 표시') + ' · ' + (f.why || '')));
    if (r.ledger) L.push('', '원장: ' + r.ledger.id);
    L.push('', AD_NOTE);
    return ok(L.join('\n'), r);
  },
  async aimarker_check_batch(a) {
    need(Array.isArray(a.items) && a.items.length, 'items(문구 목록)를 넣어 주세요.');
    need(a.items.length <= 20, '한 번에 20건까지 검수합니다.');
    const items = a.items.map((it, i) => ({ id: String(it.id || 'item-' + (i + 1)).slice(0, 60), text: String(it.text || ''), ind: indOf(it.ind), flags: it.flags || {} }));
    const r = await api('am.batch', { items, guide: a.guide || undefined });
    const results = (r.results || []).map((x, i) => (!x.ok ? { id: x.id, error: x.message || x.code || '검수하지 못함' } : { id: x.id, ...shapeCheck(items[i] ? items[i].text : '', x) }));
    const L = ['AIMarker 일괄 검수 ' + results.length + '건' + (r.pack ? ' (' + r.pack.name + ' ' + r.pack.ver + ')' : '')];
    results.forEach((x) => {
      if (x.error) { L.push('- ' + x.id + ': 오류 · ' + x.error); return; }
      L.push('- ' + x.id + ': ' + x.decision_ko + ' · ' + x.score + '점' + (x.findings.length ? ' · ' + x.findings.slice(0, 4).map((f) => (f.text ? '"' + f.text + '"' : '빠진 표시') + '(' + f.level + ')').join(', ') : ''));
    });
    L.push('', '자세한 근거 · 바꿀 말은 structuredContent.results 에 있습니다.', AD_NOTE);
    return ok(L.join('\n'), { results });
  },
  async aimarker_label(a) {
    need(a.kind, 'kind(image · video · person · text · sponsor)를 넣어 주세요.');
    const r = await api('am.label', { kind: a.kind, level: a.level || 'gen' });
    const s = { text: r.text, sentence: r.long, html: r.html, markdown: r.markdown, iptc: r.iptc || null };
    return ok('표시: ' + s.text + '\n안내 문장: ' + s.sentence + (s.iptc ? '\nIPTC digitalSourceType: ' + s.iptc : '') + '\nHTML: ' + s.html + '\n\n표시 문구는 한국AI윤리위원회 기준을 따릅니다. 파일마다 근거와 함께 남기려면 aimarker_mark 를 쓰세요.', s);
  },
  async aimarker_geo_check(a) {
    need(a.url && /\./.test(a.url), 'url(사이트 · 상품 쪽 주소)을 넣어 주세요. 예: myshop.co.kr/product/123');
    const r = await api('am.geo', { url: String(a.url).trim() });
    const L = ['GEO 진단: ' + (r.title || r.url || a.url), '- AI 검색 준비 점수: ' + r.score + ' / 100' + (r.cached ? '(6시간 안 같은 결과)' : '')];
    (r.parts || []).forEach((p) => L.push('- ' + (p.name || p.key) + ': ' + p.score + ' / ' + p.max));
    const fx = r.fixes || [];
    if (fx.length) L.push('', '고칠 것 ' + fx.length + '가지: ' + fx.slice(0, 6).map((f) => f.title || f.name || f.key).join(' · '), '붙여 넣을 코드는 structuredContent.fixes[].code 에 있습니다.');
    if (r.feed) L.push('', 'AI 상품 피드: ' + [r.feed.title, r.feed.price, r.feed.brand].filter(Boolean).join(' · '));
    return ok(L.join('\n'), r);
  },
  async aimarker_detect_text(a) {
    need(a.text && String(a.text).trim(), 'text(확인할 글)를 넣어 주세요.');
    const t = String(a.text);
    need(t.length <= 6000, '한 번에 6,000자까지입니다. 나눠서 보내 주세요.');
    const r = await api('am.detect', { text: t });
    const hits = (r.sentences || []).filter((x) => x.ai).slice(0, 6);
    const L = ['AI 작성 추정률: ' + r.rate + '% · ' + r.levelKo, '- 문장 ' + r.n + '개 · 글자 ' + r.chars + '자' + (r.short ? ' · 짧은 글이라 불안정' : '') + (r.verse ? ' · 시 · 노랫말처럼 짧은 줄이라 불안정' : '')];
    if (hits.length) L.push('', 'AI 패턴이 몰린 문장(일부):', ...hits.map((x) => '- (' + x.p + ') ' + x.t.slice(0, 120)));
    L.push('', r.note || '추정값이며 판정 · 증명이 아닙니다.');
    return ok(L.join('\n'), r);
  },
  async aimarker_scan_site(a) {
    need(a.url && /\./.test(a.url), 'url(사이트 주소)을 넣어 주세요. 예: myshop.co.kr');
    const r = await api('am.scan', { url: String(a.url).trim() });
    const LVK = { confirmed: 'AI 사용 확인됨', high: 'AI 사용 가능성 높음', check: '단서 있음', low: '단서 적음' };
    const im = r.images || {};
    const L = ['사이트 진단: ' + (r.siteName || a.url), '- 판단: ' + (LVK[r.level] || r.level || '단서 있음')];
    if (im.checked !== undefined) L.push('- 이미지: ' + (im.checked || 0) + '장 살핌 · AI 기록 ' + (im.ai || 0) + ' · AI 흔적 ' + ((im.aiName || 0) + (im.aiHost || 0)) + ' · 기록 없음 · 확인 불가 ' + ((im.stripped || 0) + (im.failed || 0)) + ' · 카메라 원본 ' + (im.camera || 0));
    (r.signals || []).forEach((sg) => L.push('- ' + sg));
    if (r.ad && r.ad.items && r.ad.items.length) L.push('- 광고 표현 확인 후보 ' + r.ad.n + '곳: ' + r.ad.items.slice(0, 8).map((x) => x.t).join(', '));
    L.push('', '보수적 판단입니다. 파일 기록이 지워진 이미지는 없음이 아니라 확인 불가로 셉니다. 공개된 첫 화면만 읽었습니다.');
    return ok(L.join('\n'), r);
  },
  async aimarker_request_approval(a) {
    need(typeof a.text === 'string' && a.text.trim(), 'text(승인받을 문구)를 넣어 주세요.');
    need(a.title, 'title(소재 이름)을 넣어 주세요.');
    const r = await api('am.check', { text: a.text, ind: indOf(a.ind), flags: a.flags || {} });
    const data = { title: String(a.title).slice(0, 60), brand: String(a.brand || '').slice(0, 40), channel: String(a.channel || '').slice(0, 30), ind: r.ind, copy: a.text.slice(0, 3000), score: r.score, dec: r.decision,
      from: String(a.requester || 'AI 에이전트').slice(0, 30), ver: 'v1', h: sha(a.text), step: '광고주',
      fnd: (r.findings || []).slice(0, 30).map((f) => ({ lv: f.lv, cat: f.cat, why: f.why, t: f.t, law: f.law })) };
    const x = await api('am.share', { data });
    const s = { id: x.id, url: x.url, decision: r.decision, decision_ko: DEC[r.decision], score: r.score, sha256: data.h };
    return ok('광고주 승인 링크를 만들었습니다.\n- 링크: ' + x.url + '\n- id: ' + x.id + '\n- 검수: ' + s.decision_ko + ' · ' + r.score + '점\n\n광고주에게 링크를 보내고, aimarker_approval_status 에 id 를 넣어 답을 확인하세요. 문구와 요약은 90일 보관됩니다.', s);
  },
  async aimarker_approval_status(a) {
    need(Array.isArray(a.ids) && a.ids.length, 'ids(승인 링크 id 목록)를 넣어 주세요.');
    const r = await api('am.status', { ids: a.ids.slice(0, 60).map(String) });
    const items = r.items || {};
    const L = a.ids.map((id) => { const s = items[id]; if (!s) return '- ' + id + ': 찾지 못함(만료 또는 잘못된 id)'; return '- ' + id + ': ' + (s.st || '대기') + (s.by ? ' · ' + s.by : '') + (s.done ? ' · ' + s.done : '') + (s.memo ? ' · 메모: ' + s.memo : ''); });
    return ok('승인 상태\n' + L.join('\n'), { items });
  },
  async aimarker_stamp(a) {
    const h = a.sha256 ? String(a.sha256).toLowerCase() : a.content != null ? sha(String(a.content)) : '';
    need(/^[0-9a-f]{64}$/.test(h), 'content 또는 sha256(소문자 16진수 64자)를 넣어 주세요.');
    const r = await api('am.stamp', { h, n: Number.isInteger(a.count) ? a.count : undefined, k: a.kind || 'report' });
    const s = { id: r.id, at: r.at, sha256: h, verify_url: SITE + '/verify/' };
    return ok('증거 원장에 기록했습니다.\n- 원장 번호: ' + r.id + '\n- 서버 시각: ' + r.at + '\n- SHA-256: ' + h + '\n누구나 https://aimarker.kr/verify/ 에서 번호나 해시로 확인할 수 있고, 하루치 원장은 다음 날 공개 앵커로 묶입니다. 내용은 보내지 않았습니다.', s);
  },
  async aimarker_verify(a) {
    const h = a.sha256 ? String(a.sha256).toLowerCase() : a.content != null ? sha(String(a.content)) : '';
    need(a.id || h, 'id(원장 번호) · sha256 · content 가운데 하나를 넣어 주세요.');
    const r = await api('am.verify', a.id ? { id: String(a.id) } : { h });
    return ok(r.found ? '원장에 기록이 있습니다.\n- 종류: ' + (r.kind || '') + '\n- 서버 시각: ' + (r.at || '') + (r.id ? '\n- 원장 번호: ' + r.id : '') : '원장에서 찾지 못했습니다. 내용이 한 글자라도 다르면 해시가 달라집니다.', r);
  }
};

function prompt(name, args) {
  args = args || {};
  if (name === 'mark_content') {
    if (!args.path) throw Object.assign(new Error('path 인자가 필요합니다.'), { code: -32602 });
    return { description: 'AI 사용 확인하고 마크 받기', messages: [{ role: 'user', content: { type: 'text', text:
      '다음 파일을 aimarker_analyze_file 로 확인해 주세요: ' + args.path + '\n' + (args.how_made ? '만든 방법 · 사용한 도구: ' + args.how_made + '\n' : '') +
      '1) 판정과 근거(기술적으로 검증된 출처 정보 · 자동 분석 결과)를 짧게 설명하고\n2) 근거가 있으면 aimarker_mark 를 label "auto" 로, 근거가 없으면 내가 밝힌 사용 여부와 도구로 발급해 주세요. 내가 밝히지 않았으면 먼저 물어봐 주세요.\n3) 마크 번호 · 확인 주소 · 관리 키를 알려 주고, 원하면 write_copy 로 표시본도 만들어 주세요.' } }] };
  }
  if (name === 'check_received_file') {
    if (!args.path) throw Object.assign(new Error('path 인자가 필요합니다.'), { code: -32602 });
    return { description: '받은 파일의 마크 확인', messages: [{ role: 'user', content: { type: 'text', text:
      '다음 파일의 AIMarker 마크를 확인해 주세요: ' + args.path + '\naimarker_verify_mark 로 파일 속 서명과 마크 상태를 보고, 마크가 없으면 aimarker_find_marks 로 같은 · 비슷한 파일의 마크를 찾아 주세요. 결과는 서명 유효 여부, 현재 표시, 원본과 같은 파일인지로 정리해 주세요.' } }] };
  }
  if (name === 'report_folder') {
    if (!args.path) throw Object.assign(new Error('path 인자가 필요합니다.'), { code: -32602 });
    return { description: '폴더 콘텐츠 AI 사용 확인 리포트', messages: [{ role: 'user', content: { type: 'text', text:
      '다음 폴더를 aimarker_analyze_folder 로 확인해 주세요: ' + args.path + (args.save_dir ? '\n리포트(HTML · CSV)는 여기에 저장: ' + args.save_dir : '') + '\n' +
      '1) 근거 등급별 개수와 바로 표시할 수 있는 비율을 짧게 말하고\n2) 먼저 확인할 점을 파일 이름과 함께 정리한 뒤\n3) 근거가 있는 파일은 마크를 발급할지 물어봐 주세요(발급은 aimarker_mark_batch, label auto).\n' +
      "근거가 없는 파일은 'AI 미사용'으로 단정하지 말고 '근거 없음 · 확인 필요'라고 말해 주세요." } }] };
  }
  if (name === 'review_ad_copy') {
    if (!args.text) throw Object.assign(new Error('text 인자가 필요합니다.'), { code: -32602 });
    return { description: '광고 문구 검수하고 고치기', messages: [{ role: 'user', content: { type: 'text', text:
      '다음 문구를 aimarker_check 로 검수해 주세요' + (args.industry ? '(업종: ' + args.industry + ')' : '') + '.\n' +
      '1) 위험 후보마다 이유와 근거 법령을 짧게 설명하고\n2) 바꿀 말을 반영해 고친 문구를 제안한 뒤\n3) 고친 문구를 다시 aimarker_check 로 확인해 결과를 알려 주세요.\n' +
      '위반이라고 단정하지 말고 "위험 후보"라고 말하고, 법률 자문이 아님을 함께 알려 주세요.\n\n문구:\n' + args.text } }] };
  }
  throw Object.assign(new Error('알 수 없는 프롬프트: ' + name), { code: -32602 });
}

/* ---------- MCP(JSON-RPC 2.0 · stdio) ---------- */
const send = (o) => process.stdout.write(JSON.stringify(o) + '\n');
const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
const rpcError = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

async function handle(m) {
  if (!m || typeof m !== 'object' || typeof m.method !== 'string') return;
  const isReq = m.id !== undefined && m.id !== null;
  try {
    switch (m.method) {
      case 'initialize': {
        const want = m.params && m.params.protocolVersion;
        return reply(m.id, { protocolVersion: PROTOCOLS.includes(want) ? want : PROTOCOLS[0],
          capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } },
          serverInfo: { name: 'aimarker', title: 'AIMarker', version: VERSION, websiteUrl: SITE + '/developers/' }, instructions: INSTRUCTIONS });
      }
      case 'ping': return isReq && reply(m.id, {});
      case 'tools/list': return reply(m.id, { tools: TOOLS });
      case 'tools/call': {
        const p = m.params || {}, fn = RUN[p.name];
        if (!fn) return rpcError(m.id, -32602, '알 수 없는 도구: ' + p.name);
        try { return reply(m.id, await fn(p.arguments || {})); }
        catch (e) { return reply(m.id, fail(e instanceof ToolError ? e.message : '도구를 실행하지 못했습니다: ' + e.message)); }
      }
      case 'prompts/list': return reply(m.id, { prompts: PROMPTS });
      case 'prompts/get': return reply(m.id, prompt(m.params && m.params.name, m.params && m.params.arguments));
      case 'resources/list': return reply(m.id, { resources: [] });
      case 'resources/templates/list': return reply(m.id, { resourceTemplates: [] });
      case 'logging/setLevel': return reply(m.id, {});
      default:
        if (m.method.startsWith('notifications/')) return;
        if (isReq) return rpcError(m.id, -32601, '지원하지 않는 요청: ' + m.method);
    }
  } catch (e) { if (isReq) rpcError(m.id, e.code || -32603, e.message || '내부 오류'); }
}

if (process.argv.includes('--version')) { console.log(VERSION); process.exit(0); }
if (process.argv.includes('--features')) {   // 다른 언어(예: Python SDK)에서 쓰는 특징값 만들기: node aimarker-mcp.mjs --features 파일
  const f = process.argv[process.argv.indexOf('--features') + 1];
  fileInput(f).then((x) => { process.stdout.write(JSON.stringify({ features: x.features, pack: x.pack }) + '\n'); process.exit(0); })
    .catch((e) => { process.stderr.write(String(e.message || e) + '\n'); process.exit(1); });
} else {
if (process.argv.includes('--help')) {
  console.log('AIMarker MCP 서버 ' + VERSION + '\n환경 변수: AIMARKER_KEY(필수) · AIMARKER_TIMEOUT_MS(선택)\n설정 예시: https://aimarker.kr/developers/#mcp');
  process.exit(0);
}
if (!KEY) process.stderr.write('[aimarker-mcp] AIMARKER_KEY 가 없습니다. 마크 확인 · 앵커 확인은 되지만 확인 · 발급 도구를 부르면 키 안내를 돌려줍니다. https://aimarker.kr/developers/#key\n');
let pending = 0, closed = false;
const done = () => { if (closed && pending === 0) process.exit(0); };
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  line = line.trim(); if (!line) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  (Array.isArray(msg) ? msg : [msg]).forEach((x) => { pending++; Promise.resolve(handle(x)).finally(() => { pending--; done(); }); });
});
rl.on('close', () => { closed = true; done(); });
}
