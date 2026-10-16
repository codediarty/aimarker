#!/usr/bin/env node
/*
 * AIMarker MCP 서버 1.0.0 · https://aimarker.kr/developers/#mcp
 * AI 에이전트(Claude · Cursor · VS Code · Codex 등)가 광고 · 콘텐츠 문구를 올리기 전에
 * AIMarker 엔진으로 검수하고, 표시 문구를 받고, 승인 링크와 증거 원장을 다루게 합니다.
 *
 * 실행: AIMARKER_KEY=amk_... npx -y https://aimarker.kr/mcp/aimarker-mcp-1.0.0.tgz
 * 또는:  AIMARKER_KEY=amk_... node aimarker-mcp.mjs
 * 필요: Node.js 18 이상(내장 fetch). 의존성 없음. 표준 입출력(stdio) MCP.
 *
 * 결과는 위험 후보와 근거이며 법률 자문이 아닙니다. 문구는 검수에만 쓰고 AIMarker 서버에 저장하지 않습니다.
 */
import { createInterface } from 'node:readline';
import { createHash } from 'node:crypto';

const VERSION = '1.0.0';
const API = process.env.AIMARKER_URL || 'https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec';
const KEY = String(process.env.AIMARKER_KEY || '').trim();
const TIMEOUT = Number(process.env.AIMARKER_TIMEOUT_MS) || 30000;
const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const DEC = { fix: '수정 후 출고', expert: '전문가 검토 권장', review: '확인 후 출고', clear: '큰 위험 후보 없음' };
const LV = { 3: '높음', 2: '주의', 1: '참고' };
const CAT = { 1: 'AI 사용 근거 · 표시', 2: '가상인물 · 딥페이크', 3: '업종별 금지 · 과장', 4: '추천 · 보증(협찬)', 5: '저작권 · 초상권 단서', 6: '브랜드 가이드' };
const NOTE = '안내: 위험 후보와 근거를 보여 주는 결과이며 법률 자문이 아닙니다. 위반이라고 단정하지 말고, 최종 판단은 담당자가 합니다.';

const INSTRUCTIONS = [
  'AIMarker는 한국 광고 · 콘텐츠 규칙(표시광고법 · 식품 · 건강기능식품 · 화장품 · 의료 · 금융 광고 규제, 추천 · 보증 심사지침의 협찬 · 가상인물 표시, AI 생성물 표시)으로 문구를 검수합니다.',
  '광고 · 상세페이지 · SNS · 보도자료 문구를 쓰거나 고쳤다면, 사용자에게 내보내기 전에 aimarker_check 로 검수하세요.',
  'decision 이 fix(수정 후 출고) 또는 expert(전문가 검토 권장)이면 findings 의 suggestions(바꿀 말)와 tip 을 반영해 고친 뒤 다시 검수하세요. clear 나 review 가 나올 때까지 반복하되, 같은 문구를 세 번 넘게 고치지 마세요.',
  '결과를 설명할 때 위반이라고 단정하지 말고 "위험 후보"와 근거 법령으로 말하세요. 법률 자문이 아님을 함께 알리세요.',
  '대가를 받은 콘텐츠면 flags.sponsored, AI로 만든 인물 · 목소리가 나오면 flags.aiPerson, AI로 만든 이미지 · 영상을 쓰면 flags.aiMedia 를 true 로 보내세요. 모르면 사용자에게 물어보세요.',
  '여러 문구는 aimarker_check_batch(한 번에 20건)를 쓰세요. 광고주 승인이 필요하면 aimarker_request_approval 로 링크를 만들고 aimarker_approval_status 로 답을 확인하세요.'
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
const RO = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };

const TOOLS = [
  { name: 'aimarker_check', title: '광고 · 콘텐츠 문구 검수',
    description: '광고 · 상세페이지 · SNS 문구를 올리기 전에 한국 광고 규칙과 협찬 · 가상인물 · AI 표시 기준으로 검수합니다. 위험 후보마다 근거 법령 · 이유 · 바꿀 말을 주고, 붙일 표시와 출고 결정(fix · expert · review · clear), 바꿀 말을 반영한 문구(fixed_text)를 돌려줍니다. 문구를 쓴 뒤 내보내기 전에 부르세요.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 5000, description: '검수할 문구(5,000자까지)' }, ind: IND, flags: FLAGS, guide: GUIDE }, required: ['text'] },
    annotations: { title: '광고 · 콘텐츠 문구 검수', ...RO } },
  { name: 'aimarker_check_batch', title: '여러 문구 한 번에 검수',
    description: '문구를 한 번에 최대 20건 검수합니다. 각 항목의 점수 · 결정 · 위험 후보를 돌려줍니다. 카피 여러 안, 상품 여러 개, 게시물 묶음에 쓰세요.',
    inputSchema: { type: 'object', properties: { items: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'object', properties: { id: { type: 'string', description: '구분용 이름(선택)' }, text: { type: 'string', minLength: 1, maxLength: 5000 }, ind: IND, flags: FLAGS }, required: ['text'] } }, guide: GUIDE }, required: ['items'] },
    annotations: { title: '여러 문구 한 번에 검수', ...RO } },
  { name: 'aimarker_label', title: 'AI · 광고 표시 문구 받기',
    description: '붙일 표시 문구를 받습니다. kind: image(AI 이미지) · video(AI 영상) · person(가상인물) · text(AI 글) · sponsor(광고 · 협찬). 짧은 표시 · 긴 안내 문장 · HTML · 마크다운 · IPTC 디지털 출처 값을 돌려줍니다. 표시 문구는 한국AI윤리위원회 기준을 따릅니다.',
    inputSchema: { type: 'object', properties: { kind: { type: 'string', enum: ['image', 'video', 'person', 'text', 'sponsor'] }, level: { type: 'string', enum: ['gen', 'edit'], description: 'gen: AI로 만듦 · edit: AI로 고침' } }, required: ['kind'] },
    annotations: { title: 'AI · 광고 표시 문구 받기', ...RO } },
  { name: 'aimarker_scan_site', title: '사이트 진단',
    description: '공개된 사이트 첫 화면과 이미지 12장까지 살펴 AI 사용 흔적(파일 속 출처 기록 · 생성 도구 흔적) · AI 상담 창 · 광고 표현 위험 후보를 보수적으로 진단합니다. 기록이 지워진 이미지는 없음이 아니라 확인 불가로 셉니다. 10~20초 걸립니다.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', minLength: 4, maxLength: 200, description: '사이트 주소(예: myshop.co.kr)' } }, required: ['url'] },
    annotations: { title: '사이트 진단', ...RO } },
  { name: 'aimarker_request_approval', title: '광고주 승인 링크 만들기',
    description: '문구를 검수한 뒤, 광고주가 로그인 없이 승인하거나 수정을 요청할 수 있는 링크(90일 보관)를 만듭니다. 링크에는 문구와 남은 위험 후보가 함께 보입니다. 돌려준 id 로 aimarker_approval_status 를 부르면 답을 확인합니다. 문구가 AIMarker 서버에 90일 보관되므로 사용자가 원할 때만 쓰세요.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 3000 }, title: { type: 'string', maxLength: 60, description: '소재 이름' }, brand: { type: 'string', maxLength: 40 }, channel: { type: 'string', maxLength: 30, description: '예: 인스타그램 · 상세페이지' }, requester: { type: 'string', maxLength: 30, description: '요청하는 사람 · 팀' }, ind: IND, flags: FLAGS }, required: ['text', 'title'] },
    annotations: { title: '광고주 승인 링크 만들기', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } },
  { name: 'aimarker_approval_status', title: '승인 상태 확인',
    description: '승인 링크 id(AP로 시작)들의 상태를 확인합니다. 대기 · 승인 · 수정 요청과 답한 사람 · 시각 · 메모를 돌려줍니다.',
    inputSchema: { type: 'object', properties: { ids: { type: 'array', minItems: 1, maxItems: 60, items: { type: 'string' } } }, required: ['ids'] },
    annotations: { title: '승인 상태 확인', ...RO } },
  { name: 'aimarker_stamp', title: '증거 원장에 기록',
    description: '보고서 · 콘텐츠 버전 · 승인 기록의 SHA-256 해시를 서버 시각과 함께 AIMarker 증거 원장에 남깁니다. content 를 주면 이 컴퓨터에서 해시만 계산해 보내고 내용은 보내지 않습니다. 같은 해시는 처음 받은 번호를 돌려줍니다. 누구나 aimarker.kr/verify/ 에서 확인할 수 있습니다.',
    inputSchema: { type: 'object', properties: { content: { type: 'string', description: '기록할 내용(해시만 보냄)' }, sha256: { type: 'string', pattern: '^[0-9a-f]{64}$', description: '이미 계산한 SHA-256(소문자 16진수 64자)' }, kind: { type: 'string', enum: ['report', 'version', 'approval'] }, count: { type: 'integer', minimum: 0, description: '보고서에 든 소재 수(선택)' } } },
    annotations: { title: '증거 원장에 기록', readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } },
  { name: 'aimarker_verify', title: '증거 원장 확인',
    description: '원장 번호(LG로 시작) · SHA-256 · 내용 가운데 하나로 원장에 기록이 있는지, 언제 무엇으로 기록됐는지 확인합니다. content 는 이 컴퓨터에서 해시로 바꿔 보냅니다.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, content: { type: 'string' } } },
    annotations: { title: '증거 원장 확인', ...RO } }
];

const PROMPTS = [
  { name: 'review_ad_copy', title: '광고 문구 검수하고 고치기', description: '문구를 AIMarker로 검수하고, 위험 후보를 근거와 함께 설명한 뒤 고친 문구를 제안합니다.',
    arguments: [{ name: 'text', description: '검수할 문구', required: true }, { name: 'industry', description: '업종(모르면 비움): 일반 · 식품 · 건강기능식품 · 화장품 · 의료 · 금융', required: false }] },
  { name: 'write_safe_ad', title: '검수를 통과하는 광고 문구 쓰기', description: '광고 문구를 쓰고 AIMarker 검수에서 큰 위험 후보가 없을 때까지 고칩니다.',
    arguments: [{ name: 'product', description: '제품 · 서비스와 알리고 싶은 점', required: true }, { name: 'channel', description: '채널(예: 인스타그램 · 상세페이지)', required: false }, { name: 'industry', description: '업종', required: false }] }
];

/* ---------- 도움 함수 ---------- */
class ToolError extends Error {}
const sha = (s) => createHash('sha256').update(String(s), 'utf8').digest('hex');
const IND_KO = { '일반': 'gen', '식품': 'food', '일반식품': 'food', '건강기능식품': 'hfood', '건기식': 'hfood', '화장품': 'cos', '의료': 'med', '병원': 'med', '금융': 'fin' };
const indOf = (v) => { v = String(v || '').trim(); if (!v || v === 'auto') return ''; return IND_KO[v] || v; };

async function api(action, body) {
  if (!KEY) throw new ToolError('AIMARKER_KEY 환경 변수가 없습니다. https://aimarker.kr/developers/#key 에서 무료 API 키(하루 300회)를 받아 MCP 설정의 env 에 AIMARKER_KEY 로 넣어 주세요.');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  let res, txt;
  try {
    res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, key: KEY, ...body }), redirect: 'follow', signal: ctl.signal });
    txt = await res.text();
  } catch (e) {
    throw new ToolError(e.name === 'AbortError' ? 'AIMarker 서버가 ' + Math.round(TIMEOUT / 1000) + '초 안에 답하지 않았습니다. 잠시 뒤 다시 시도해 주세요.' : 'AIMarker 서버에 연결하지 못했습니다: ' + e.message);
  } finally { clearTimeout(timer); }
  let j;
  try { j = JSON.parse(txt); } catch { throw new ToolError('AIMarker 서버 응답을 읽지 못했습니다(HTTP ' + res.status + '). 잠시 뒤 다시 시도해 주세요.'); }
  if (!j || !j.ok) {
    const code = (j && j.code) || 'ERROR';
    const hint = { KEY: ' API 키를 확인해 주세요.', QUOTA: ' 오늘 한도를 다 썼습니다. 내일 다시 쓰거나 한도 상향을 문의해 주세요(contact@skkc.co.kr).', BUSY: ' 잠시 뒤 다시 시도해 주세요.' }[code] || '';
    throw new ToolError('[' + code + '] ' + ((j && j.message) || '요청을 처리하지 못했습니다.') + hint);
  }
  return j;
}

/* 바꿀 말 적용(빼기 · 바꿀 말 없는 후보는 그대로 두고 사람에게 남김) */
function applyFix(text, f, rep) {
  if (rep == null) return text;
  if (f.s >= 0) {
    let a = f.s, b = f.re && f.re >= f.e ? f.re : f.e;
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
function checkText(s, text) {
  const L = [];
  L.push('AIMarker 검수 결과' + (s.rule_pack ? ' (' + s.rule_pack + ')' : ''));
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
  L.push('', NOTE);
  return L.join('\n');
}
const ok = (text, structured) => ({ content: [{ type: 'text', text }], ...(structured ? { structuredContent: structured } : {}) });
const fail = (msg) => ({ content: [{ type: 'text', text: msg }], isError: true });
const need = (c, msg) => { if (!c) throw new ToolError(msg); };

/* ---------- 도구 실행 ---------- */
const RUN = {
  async aimarker_check(a) {
    need(typeof a.text === 'string' && a.text.trim(), 'text(검수할 문구)를 넣어 주세요.');
    need(a.text.length <= 5000, '문구는 5,000자까지 검수합니다. 나눠서 보내 주세요.');
    const r = await api('am.check', { text: a.text, ind: indOf(a.ind), flags: a.flags || {}, guide: a.guide || undefined });
    const s = shapeCheck(a.text, r);
    return ok(checkText(s, a.text), s);
  },
  async aimarker_check_batch(a) {
    need(Array.isArray(a.items) && a.items.length, 'items(문구 목록)를 넣어 주세요.');
    need(a.items.length <= 20, '한 번에 20건까지 검수합니다.');
    const items = a.items.map((it, i) => ({ id: String(it.id || 'item-' + (i + 1)).slice(0, 60), text: String(it.text || ''), ind: indOf(it.ind), flags: it.flags || {} }));
    const r = await api('am.batch', { items, guide: a.guide || undefined });
    const results = (r.results || []).map((x, i) => {
      if (!x.ok) return { id: x.id, error: x.message || x.code || '검수하지 못함' };
      return { id: x.id, ...shapeCheck(items[i] ? items[i].text : '', x) };
    });
    const L = ['AIMarker 일괄 검수 ' + results.length + '건' + (r.pack ? ' (' + r.pack.name + ' ' + r.pack.ver + ')' : '')];
    results.forEach((x) => {
      if (x.error) { L.push('- ' + x.id + ': 오류 · ' + x.error); return; }
      L.push('- ' + x.id + ': ' + x.decision_ko + ' · ' + x.score + '점' + (x.findings.length ? ' · ' + x.findings.slice(0, 4).map((f) => (f.text ? '"' + f.text + '"' : '빠진 표시') + '(' + f.level + ')').join(', ') : ''));
    });
    L.push('', '자세한 근거 · 바꿀 말은 structuredContent.results 에 있습니다. 위험한 항목은 aimarker_check 로 하나씩 다시 보세요.', NOTE);
    return ok(L.join('\n'), { results });
  },
  async aimarker_label(a) {
    need(a.kind, 'kind(image · video · person · text · sponsor)를 넣어 주세요.');
    const r = await api('am.label', { kind: a.kind, level: a.level || 'gen' });
    const s = { text: r.text, sentence: r.long, html: r.html, markdown: r.markdown, iptc: r.iptc || null };
    return ok('표시: ' + s.text + '\n안내 문장: ' + s.sentence + (s.iptc ? '\nIPTC digitalSourceType: ' + s.iptc : '') + '\nHTML: ' + s.html + '\n\n표시 문구는 한국AI윤리위원회 기준을 따릅니다.', s);
  },
  async aimarker_scan_site(a) {
    need(a.url && /\./.test(a.url), 'url(사이트 주소)을 넣어 주세요. 예: myshop.co.kr');
    const r = await api('am.scan', { url: String(a.url).trim() });
    const LVK = { confirmed: 'AI 사용 확인됨', high: 'AI 사용 가능성 높음', check: '확인 필요', low: '단서 적음' };
    const im = r.images || {};
    const L = ['사이트 진단: ' + (r.siteName || a.url), '- 판단: ' + (LVK[r.level] || r.level || '확인 필요')];
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
    return ok('광고주 승인 링크를 만들었습니다.\n- 링크: ' + x.url + '\n- id: ' + x.id + '\n- 검수: ' + s.decision_ko + ' · ' + r.score + '점(남은 위험 후보가 링크에 함께 보입니다)\n\n광고주에게 링크를 보내고, aimarker_approval_status 에 id 를 넣어 답을 확인하세요. 문구와 요약은 90일 보관됩니다.', s);
  },
  async aimarker_approval_status(a) {
    need(Array.isArray(a.ids) && a.ids.length, 'ids(승인 링크 id 목록)를 넣어 주세요.');
    const r = await api('am.status', { ids: a.ids.slice(0, 60).map(String) });
    const items = r.items || {};
    const L = a.ids.map((id) => { const s = items[id]; if (!s) return '- ' + id + ': 찾지 못함(만료 또는 잘못된 id)'; return '- ' + id + ': ' + (s.st || '대기') + (s.by ? ' · ' + s.by : '') + (s.done ? ' · ' + s.done : '') + (s.memo ? ' · 메모: ' + s.memo : ''); });
    return ok('승인 상태\n' + L.join('\n'), { items });
  },
  async aimarker_stamp(a) {
    const h = a.sha256 ? String(a.sha256).toLowerCase() : a.content != null ? sha(a.content) : '';
    need(/^[0-9a-f]{64}$/.test(h), 'content 또는 sha256(소문자 16진수 64자)를 넣어 주세요.');
    const r = await api('am.stamp', { h, n: Number.isInteger(a.count) ? a.count : undefined, k: a.kind || 'report' });
    const s = { id: r.id, at: r.at, sha256: h, verify_url: 'https://aimarker.kr/verify/' };
    return ok('증거 원장에 기록했습니다.\n- 원장 번호: ' + r.id + '\n- 서버 시각: ' + r.at + '\n- SHA-256: ' + h + '\n누구나 https://aimarker.kr/verify/ 에서 번호나 해시로 확인할 수 있습니다. 내용은 보내지 않았습니다.', s);
  },
  async aimarker_verify(a) {
    const h = a.sha256 ? String(a.sha256).toLowerCase() : a.content != null ? sha(a.content) : '';
    need(a.id || h, 'id(원장 번호) · sha256 · content 가운데 하나를 넣어 주세요.');
    const r = await api('am.verify', a.id ? { id: String(a.id) } : { h });
    return ok(r.found ? '원장에 기록이 있습니다.\n- 종류: ' + (r.kind || '') + '\n- 서버 시각: ' + (r.at || '') + (r.id ? '\n- 원장 번호: ' + r.id : '') : '원장에서 찾지 못했습니다. 내용이 한 글자라도 다르면 해시가 달라집니다.', r);
  }
};

function prompt(name, args) {
  args = args || {};
  if (name === 'review_ad_copy') {
    if (!args.text) throw Object.assign(new Error('text 인자가 필요합니다.'), { code: -32602 });
    return { description: '광고 문구 검수하고 고치기', messages: [{ role: 'user', content: { type: 'text', text:
      '다음 문구를 aimarker_check 로 검수해 주세요' + (args.industry ? '(업종: ' + args.industry + ')' : '') + '.\n' +
      '1) 위험 후보마다 이유와 근거 법령을 짧게 설명하고\n2) 바꿀 말을 반영해 고친 문구를 제안한 뒤\n3) 고친 문구를 다시 aimarker_check 로 확인해 결과를 알려 주세요.\n' +
      '위반이라고 단정하지 말고 "위험 후보"라고 말하고, 법률 자문이 아님을 함께 알려 주세요.\n\n문구:\n' + args.text } }] };
  }
  if (name === 'write_safe_ad') {
    if (!args.product) throw Object.assign(new Error('product 인자가 필요합니다.'), { code: -32602 });
    return { description: '검수를 통과하는 광고 문구 쓰기', messages: [{ role: 'user', content: { type: 'text', text:
      (args.channel ? args.channel + '에 올릴 ' : '') + '광고 문구를 3안 써 주세요. 제품 · 서비스: ' + args.product + (args.industry ? ' · 업종: ' + args.industry : '') + '\n' +
      '각 안을 aimarker_check_batch 로 검수하고, decision 이 fix 나 expert 인 안은 바꿀 말과 방법을 반영해 고친 뒤 다시 검수해 주세요.\n' +
      '최종안은 큰 위험 후보가 없거나(clear) 확인 후 출고(review)인 것만 보여 주고, 필요한 표시([광고] · [가상인물] · AI 생성)를 함께 알려 주세요.' } }] };
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
          serverInfo: { name: 'aimarker', title: 'AIMarker', version: VERSION, websiteUrl: 'https://aimarker.kr/developers/' }, instructions: INSTRUCTIONS });
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
if (process.argv.includes('--help')) {
  console.log('AIMarker MCP 서버 ' + VERSION + '\n환경 변수: AIMARKER_KEY(필수) · AIMARKER_TIMEOUT_MS(선택)\n설정 예시: https://aimarker.kr/developers/#mcp');
  process.exit(0);
}
if (!KEY) process.stderr.write('[aimarker-mcp] AIMARKER_KEY 가 없습니다. 도구를 부르면 키 안내를 돌려줍니다. https://aimarker.kr/developers/#key\n');
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
