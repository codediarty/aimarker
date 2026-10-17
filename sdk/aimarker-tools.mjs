/*
 * AIMarker 함수 호출 실행기 1.0.0 · https://aimarker.kr/developers/#tools
 * OpenAI · Claude · Gemini 함수 호출에서 AIMarker 도구(https://aimarker.kr/developers/tools/)를 실행합니다.
 * 같은 폴더에 SDK(aimarker.mjs)를 두세요. Node.js 20+ · 의존성 없음 · MIT
 *
 *   import { runAimarkerTool } from './aimarker-tools.mjs';
 *   const result = await runAimarkerTool(call.name, JSON.parse(call.arguments));   // 결과(JSON)를 모델에 돌려주세요
 *
 * - path 는 이 환경에서 파일을 읽어 특징값으로 바꿔 보냅니다(원본은 보내지 않음).
 * - text · content 는 원문 대신 해시를 보냅니다(광고 검수 · 자동 수정은 문구를 보내고 서버는 저장하지 않음).
 * - 오류는 던지지 않고 { ok: false, code, message, allowed?, related? } 로 돌려줍니다. 모델이 CONFIRM · CONFLICT · DECLARE 를 읽고 사용자에게 묻게 하세요.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { AIMarker } from './aimarker.mjs';

export async function runAimarkerTool(name, args = {}, { key = globalThis.process && process.env.AIMARKER_KEY, url } = {}) {
  try {
    const am = new AIMarker({ key, url });
    const file = async (p) => ({ bytes: new Uint8Array(await readFile(p)), name: path.basename(p) });
    switch (name) {
      case 'aimarker_analyze_file': { const f = await file(args.path); return await am.analyzeFile(f.bytes, { name: f.name }); }
      case 'aimarker_analyze_text': return await am.analyzeText(args.text);
      case 'aimarker_mark': return await am.mark(args.path ? await file(args.path) : { text: String(args.text || '') }, { label: args.label || 'auto', tools: args.tools || [], title: args.title || '', issuer: args.issuer || '', confirm: !!args.confirm });
      case 'aimarker_mark_info': return await am.markInfo(args.id);
      case 'aimarker_find_marks': {
        let { sha256, dhash } = args;
        if (args.path) sha256 = (await AIMarker.features((await file(args.path)).bytes)).features.sha256;
        return await am.lookup({ sha256, dhash });
      }
      case 'aimarker_verify_mark': return await AIMarker.verifyMark(args.credential);
      case 'aimarker_anchor': return await am.anchor(args.id ? { id: args.id } : args.date ? { date: args.date } : {});
      case 'aimarker_check': return await am.check(args.text, { ind: args.ind || '', flags: args.flags || {}, guide: args.guide });
      case 'aimarker_auto_fix': return await am.auto(args.text, { ind: args.ind || '', flags: args.flags || {}, guide: args.guide, stamp: !!args.stamp });
      case 'aimarker_label': return await am.label(args.kind, args.level || 'gen');
      case 'aimarker_geo_check': return await am.geo(args.url);
      case 'aimarker_detect_text': return await am.detect(args.text, { pass: args.pass || '' });
      case 'aimarker_stamp': return await am.stamp(args.content, { kind: args.k || 'report', count: args.n });
      case 'aimarker_verify': return await am.verify({ id: args.id, content: args.content });
      default: return { ok: false, code: 'TOOL', message: '알 수 없는 도구: ' + name };
    }
  } catch (e) {
    const b = (e && e.body) || {};
    return { ok: false, code: (e && e.code) || 'ERROR', message: (e && e.message) || String(e), allowed: b.allowed, related: b.related, reasons: b.reasons };
  }
}
export default runAimarkerTool;
