# AIMarker MCP 서버

AI 에이전트(Claude · Cursor · VS Code · Codex · Gemini CLI 등)가 광고 · 상세페이지 · SNS 문구를 **올리기 전에** AIMarker 엔진으로 검수하게 하는 MCP 서버입니다.

- 한국 광고 규칙(KR-AdLaw 규칙 팩: 표시광고법 · 식품 · 건강기능식품 · 화장품 · 의료 · 금융 · 추천 · 보증(협찬 · 가상인물) · AI 생성물 표시)
- 위험 후보 · 근거 법령 · 바꿀 말 · 붙일 표시 · 출고 결정
- 광고주 승인 링크 · 증거 원장(해시) 기록 · 확인

결과는 위험 후보와 근거이며 법률 자문이 아닙니다. 검수 문구는 AIMarker 서버에 저장하지 않습니다.

## 준비

1. https://aimarker.kr/developers/#key 에서 무료 API 키(하루 300회)를 받습니다.
2. Node.js 18 이상이 필요합니다. 의존성은 없습니다.

## 설정

Claude Desktop · Cursor · Gemini CLI (`mcpServers`):

```json
{
  "mcpServers": {
    "aimarker": {
      "command": "npx",
      "args": ["-y", "https://aimarker.kr/mcp/aimarker-mcp-1.0.0.tgz"],
      "env": { "AIMARKER_KEY": "amk_발급받은_키" }
    }
  }
}
```

Windows 에서 `npx` 를 찾지 못하면 `"command": "cmd", "args": ["/c", "npx", "-y", "https://aimarker.kr/mcp/aimarker-mcp-1.0.0.tgz"]` 로 바꾸세요.

Claude Code:

```bash
claude mcp add aimarker -e AIMARKER_KEY=amk_발급받은_키 -- npx -y https://aimarker.kr/mcp/aimarker-mcp-1.0.0.tgz
```

파일 하나로 쓰려면 https://aimarker.kr/mcp/aimarker-mcp.mjs 를 내려받아 `"command": "node", "args": ["/경로/aimarker-mcp.mjs"]` 로 등록합니다.

## 도구

| 도구 | 하는 일 |
| --- | --- |
| aimarker_check | 문구 하나 검수(위험 후보 · 근거 · 바꿀 말 · 표시 · 결정 · 고친 문구) |
| aimarker_check_batch | 20건까지 한 번에 검수 |
| aimarker_label | AI · 광고 표시 문구(HTML · IPTC 값 포함) |
| aimarker_scan_site | 사이트 첫 화면의 AI 사용 흔적 · 광고 표현 후보 진단 |
| aimarker_request_approval | 검수 뒤 광고주 승인 링크 만들기(90일 보관) |
| aimarker_approval_status | 승인 상태 확인 |
| aimarker_stamp | 내용의 SHA-256 해시를 증거 원장에 기록(내용은 보내지 않음) |
| aimarker_verify | 원장 번호 · 해시 · 내용으로 기록 확인 |

프롬프트: `review_ad_copy`(검수하고 고치기) · `write_safe_ad`(검수를 통과하는 문구 쓰기)

## 환경 변수

- `AIMARKER_KEY` (필수): API 키
- `AIMARKER_TIMEOUT_MS` (선택): 요청 제한 시간, 기본 30000

문의: contact@skkc.co.kr · https://aimarker.kr/developers/
