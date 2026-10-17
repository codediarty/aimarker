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
 * 실행: AIMARKER_KEY=amk_... npx -y https://aimarker.kr/mcp/aimarker-mcp-2.4.0.tgz
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

const VERSION = '2.4.0';
const API = process.env.AIMARKER_URL || 'https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec';
const SITE = 'https://aimarker.kr';
const KEYS_URL = process.env.AIMARKER_KEYS_URL || SITE + '/.well-known/aimarker-keys.json';
const KEY = String(process.env.AIMARKER_KEY || '').trim();
const PASS = String(process.env.AIMARKER_PASS || '').trim();   // 2.3: 개인 이용권 코드(선택) · AI 작성률 문장별 전체. 2.4: 판정(안전 · 고위험 · 부적합) · 판정 근거 · 문체 특성 · 종합 의견
const TIMEOUT = Number(process.env.AIMARKER_TIMEOUT_MS) || 90000;
const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_FILE = 300 * 1024 * 1024;

/* ---------- 출처 판독기 aim-extract(내장) ---------- */
const AIM = (() => {
  const module = { exports: {} }, exports = module.exports, require = createRequire(import.meta.url);   // eslint-disable-line no-unused-vars
/*@@AIM_EXTRACT@@*/
  return module.exports;
})();
/* ---------- 일괄 확인 리포트 aim-report(내장) ---------- */
const REP = (() => {
  const module = { exports: {} }, exports = module.exports;   // eslint-disable-line no-unused-vars
/*@@AIM_REPORT@@*/
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
  { name: 'aimarker_detect_text', title: 'AI 작성률 · 판정(글)',
    description: '글을 서버로 보내 AI 작성률(0~100: AI 검출 문장의 글자 비율)과 판정(안전 · 고위험 · 부적합, AIMarker 판정 기준 1.0) · 판정 근거 · 구간별 검출 · AI 문체 특성 · 종합 분석 의견과 AI 패턴이 몰린 문장을 받습니다. 결정적 모델과 정해진 기준이라 같은 글은 언제나 같은 값 · 같은 판정입니다. 추정일 뿐 증명이 아니니 결과만으로 사람을 판단하지 마세요. 글은 저장하지 않습니다. 한 번에 6,000자. 무료 키는 맛보기(판정 · 수치는 같은 값, 문장 위치는 가장 뚜렷한 2개만)이고, 이용권 코드(pass)나 유료 키면 모든 문장 · 구간을 받습니다.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 6000, description: '확인할 글(6,000자까지)' }, pass: { type: 'string', maxLength: 24, description: '개인 이용권 코드(선택, 예: K7Q4-F9XD-2MTA-8PLW). 없으면 환경 변수 AIMARKER_PASS 를 씁니다. 한 번 부를 때 이용권 1회를 씁니다(600자 이하는 세지 않음).' } }, required: ['text'] },
    annotations: { title: 'AI 작성률 · 판정', ...RO } },
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
    const pass = String(a.pass || PASS || '').trim();
    const r = await api('am.detect', pass ? { text: t, pass } : { text: t });
    const hits = (r.sentences || []).filter((x) => x.g || x.ai).sort((a, b) => (b.p || 0) - (a.p || 0)).slice(0, 6);
    const b = r.band || {}, lv = r.lv || {}, LVN = ['', '낮음', '중간', '높음'];
    const L = ['AI 작성률: ' + r.rate + '% · 판정 ' + (b.label || r.levelKo) + (r.critName ? ' (' + r.critName + ')' : '')];
    (b.why || []).forEach((w) => L.push('- 판정 근거: ' + w));
    L.push('- 검출 글자 ' + (r.aiChars || 0) + ' / ' + r.chars + '자 · 검출 구간 ' + (r.segAi || 0) + ' / ' + (r.segN || 0) + ' · 검출 문장 ' + (r.aiN || 0) + ' / ' + r.n + '(높음 ' + (lv.hi || 0) + ' · 중간 ' + (lv.mid || 0) + ' · 낮음 ' + (lv.low || 0) + ')' + (r.short ? ' · 짧은 글이라 불안정' : '') + (r.verse ? ' · 시 · 노랫말처럼 짧은 줄이라 불안정' : ''));
    if (r.chat) L.push('- AI 대화창 흔적: ' + (r.chatList || []).map((c) => c.name + ' ' + c.n + '곳').join(', '));
    if ((r.feat || []).length) L.push('- AI 문체 특성: ' + r.feat.slice(0, 4).map((f) => f.name + ' ' + f.segs + '구간' + (f.tags && f.tags.length ? '(' + f.tags.slice(0, 3).join(', ') + ')' : '')).join(' · '));
    if ((r.opinion || []).length) L.push('', '종합 의견:', ...r.opinion.map((x, i) => (i + 1) + '. ' + x));
    if ((r.opDetail || []).length) L.push(...r.opDetail.map((x) => '- ' + x));
    if (hits.length) L.push('', 'AI 패턴이 몰린 문장(일부):', ...hits.map((x) => '- (' + (LVN[x.g] || '') + ' ' + x.p + ') ' + x.t.slice(0, 120)));
    if (r.full === false) L.push('', '무료 맛보기: 판정 · 수치는 이용권과 같은 값입니다. 검출 문장 ' + (r.aiN || 0) + '개 가운데 ' + (r.shown || 0) + '개만 위치를 보여 주고, 구간 위치 · 먼저 고칠 문장 · 특성별 걸린 표현은 이용권 코드(pass · https://aimarker.kr/humanize/#price)나 유료 API 키로 받습니다.');
    if (r.pass) L.push('- 이용권: ' + r.pass.name + ' · 남은 ' + r.pass.left + '회' + (r.pass.end ? ' · ' + String(r.pass.end).slice(0, 16) + '까지' : ''));
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
  console.log('AIMarker MCP 서버 ' + VERSION + '\n환경 변수: AIMARKER_KEY(필수) · AIMARKER_PASS(선택, 개인 이용권) · AIMARKER_TIMEOUT_MS(선택)\n설정 예시: https://aimarker.kr/developers/#mcp');
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
