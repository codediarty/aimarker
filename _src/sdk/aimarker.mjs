/*
 * AIMarker SDK for JavaScript 0.9.0(베타) · https://aimarker.kr/developers/#sdk
 * Node.js 18+ · Deno · Bun · Cloudflare Workers 처럼 fetch 가 있는 서버 환경에서 쓰세요.
 * API 키를 브라우저 코드에 넣지 마세요. 의존성 없음 · MIT
 *
 *   import { AIMarker } from './aimarker.mjs';
 *   const am = new AIMarker({ key: process.env.AIMARKER_KEY });
 *   const r = await am.check('부작용 없는 순한 크림', { ind: 'cos' });
 *   if (r.decision === 'fix' || r.decision === 'expert') console.log(r.findings, AIMarker.applyFixes(r.text, r.findings));
 */
const DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec';

export class AIMarkerError extends Error {
  constructor(code, message) { super(message); this.name = 'AIMarkerError'; this.code = code; }
}

export class AIMarker {
  /** @param {{ key: string, url?: string, timeoutMs?: number }} opts */
  constructor(opts = {}) {
    this.key = String(opts.key || '').trim();
    this.url = opts.url || DEFAULT_URL;
    this.timeoutMs = opts.timeoutMs || 30000;
    if (!this.key) throw new AIMarkerError('KEY', 'API 키가 필요합니다. https://aimarker.kr/developers/#key');
  }

  /** 모든 요청은 같은 주소로 POST 하고 action 으로 동작을 고릅니다(302 넘겨주기를 따라감). */
  async call(action, body = {}) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, key: this.key, ...body }), redirect: 'follow', signal: ctl.signal });
      const txt = await res.text();
      let j; try { j = JSON.parse(txt); } catch { throw new AIMarkerError('HTTP', 'AIMarker 응답을 읽지 못했습니다(HTTP ' + res.status + ')'); }
      if (!j.ok) throw new AIMarkerError(j.code || 'ERROR', j.message || '요청을 처리하지 못했습니다');
      return j;
    } finally { clearTimeout(t); }
  }

  /** 문구 하나 검수. ind: 'auto'|'gen'|'food'|'hfood'|'cos'|'med'|'fin' · flags: { sponsored, aiPerson, aiMedia } · guide: { ban:[], must:[] } */
  async check(text, { ind = '', flags = {}, guide } = {}) {
    const r = await this.call('am.check', { text, ind: ind === 'auto' ? '' : ind, flags, guide });
    return Object.assign(r, { text });
  }
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
  static async sha256(s) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
    return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
  }
}
export default AIMarker;
