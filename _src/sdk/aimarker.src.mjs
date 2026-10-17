/*
 * AIMarker SDK for JavaScript 1.2.0 · https://aimarker.kr/developers/#sdk
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
 *   // 1.1: 많은 파일을 20건씩 확인하고 리포트로(발급은 하지 않음)
 *   const entries = await am.analyzeFiles(['./upload/a.jpg', './upload/b.png']);
 *   const R = report.build(entries, { org: '우리 회사' }); console.log(report.summaryText(R)); // report.html(R) · report.csv(R)
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
/*@@AIM_EXTRACT@@*/
  return module.exports;
})();

/* 일괄 확인 리포트 aim-report(내장): report.build(entries) · report.html(R) · report.csv(R) · report.summaryText(R) · report.parseDeclared(csv) */
export const report = (() => {
  const module = { exports: {} }, exports = module.exports;   // eslint-disable-line no-unused-vars
/*@@AIM_REPORT@@*/
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
  /** 20건까지 한 번에 확인(발급하지 않음). items: [{ ref?, bytes, name } | { ref?, text } | { ref?, features, pack }] → { results: [{ ok, ref, verdict, … } | { ok: false, ref, code, msg }] } */
  async analyzeBatch(items) {
    if (!Array.isArray(items) || !items.length) throw new AIMarkerError('EMPTY', 'items 에 확인할 항목을 넣어 주세요.');
    if (items.length > 20) throw new AIMarkerError('TOO_MANY', '한 번에 20건까지 보낼 수 있습니다. analyzeFiles 를 쓰면 알아서 나눕니다.');
    const out = [];
    for (const [i, it] of items.entries()) { const x = await this._input(it); out.push({ ref: String(it.ref != null ? it.ref : i), features: x.features, pack: x.pack || undefined }); }
    return this.call('am.analyzebatch', { items: out });
  }
  /**
   * 많은 파일을 20건씩(서명 묶음 90만 자) 나눠 동시에 3묶음씩 확인하고, report.build 에 바로 넣는 목록을 돌려줍니다.
   * inputs: 파일 경로(Node) · { path } · { bytes, name } · { …, declared: 'ai_generated'|'ai_edited'|'ai_assisted'|'no_ai'|'none' }
   * 돌려줌: [{ name, path, size, kind, sha256, dhash, result, error, declared }] (입력 순서 그대로)
   */
  async analyzeFiles(inputs, { concurrency = 3, onProgress } = {}) {
    const entries = [];
    for (const inp of inputs || []) {
      const e = { name: '', path: '', size: 0, kind: 'other', sha256: '', dhash: '', result: null, error: '', declared: (inp && inp.declared) || '' };
      try {
        let bytes, name;
        if (typeof inp === 'string' || (inp && inp.path && !inp.bytes)) {
          const p = typeof inp === 'string' ? inp : inp.path, fs = await import('node:fs/promises');
          bytes = new Uint8Array(await fs.readFile(p)); name = String(p).split(/[\\/]/).pop(); e.path = String(p);
        } else { bytes = inp.bytes instanceof Uint8Array ? inp.bytes : new Uint8Array(inp.bytes); name = inp.name || ''; e.path = inp.path || ''; }
        e.name = name; e.size = bytes.length;
        const x = await AIMarker.features(bytes, { name, dhash: (inp && inp.dhash) || '' });
        e.kind = x.features.kind || 'other'; e.sha256 = x.features.sha256; e.dhash = x.features.dhash || '';
        e._f = x.features; e._p = x.pack || null; e._pl = e._p ? JSON.stringify(e._p).length : 0;
      } catch (err) { e.error = '파일을 읽지 못했습니다: ' + ((err && err.message) || err); }
      entries.push(e);
    }
    const todo = entries.filter((e) => e._f), batches = [];
    let cur = [], budget = 900000;
    for (const e of todo) { if (cur.length && (cur.length >= 20 || e._pl > budget)) { batches.push(cur); cur = []; budget = 900000; } cur.push(e); budget -= e._pl; }
    if (cur.length) batches.push(cur);
    let i = 0, done = entries.length - todo.length, stop = '';
    const alone = [];
    const run = async () => {
      while (i < batches.length) {
        const b = batches[i++];
        if (stop) b.forEach((e) => { e.error = stop; });
        else {
          try {
            const r = await this.call('am.analyzebatch', { items: b.map((e, k) => ({ ref: String(k), features: e._f, pack: e._p || undefined })) });
            r.results.forEach((x, k) => { const e = b[+x.ref] || b[k]; if (x.ok) e.result = x; else if (x.code === 'TIME' || x.code === 'PACK_BUDGET') alone.push(e); else e.error = x.msg || x.code || '확인하지 못했습니다'; });
          } catch (err) {
            if (err && (err.code === 'QUOTA' || err.code === 'BUSY' || err.code === 'KEY')) stop = err.message;
            b.forEach((e) => { e.error = (err && err.message) || '확인하지 못했습니다'; });
          }
        }
        done += b.length; if (onProgress) onProgress(done, entries.length);
      }
    };
    await Promise.all(new Array(Math.min(Math.max(1, concurrency), batches.length)).fill(0).map(run));
    for (const e of alone) { try { e.result = await this.call('am.analyze', { features: e._f, pack: e._p || undefined }); } catch (err) { e.error = (err && err.message) || '확인하지 못했습니다'; } }
    entries.forEach((e) => { delete e._f; delete e._p; delete e._pl; });
    return entries;
  }
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
  /** GEO 진단: AI 검색 준비 점수 · 고칠 코드 · (상품 쪽이면) AI 상품 피드 */
  geo(url) { return this.call('am.geo', { url: String(url || '') }); }
  /** AI 작성 추정률(추정 · 판정 아님 · 같은 글은 같은 값). 글은 서버에서 저장하지 않음. 6,000자까지 */
  /** AI 작성률과 판정(band: 안전 · 고위험 · 부적합 · 판정 근거 why, AIMarker 판정 기준 1.0). 추정이며 증명이 아님. 무료 키는 맛보기(판정 · 수치는 같은 값, 문장 위치는 2개만), pass(개인 이용권 코드)나 유료 키면 문장별 · 구간별 전체 */
  detect(text, { sentences = true, pass = '' } = {}) { const b = { text: String(text || ''), sentences }; if (pass) b.pass = String(pass); return this.call('am.detect', b); }
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
