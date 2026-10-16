# AIMarker MCP 서버 2.0

AI 에이전트(Claude · Cursor · VS Code · Codex · Gemini CLI 등)가 이미지 · 영상 · 오디오 · 글의 **AI 사용 여부를 파일 속 근거로 확인**하고, 근거에 맞는 **서명된 AIMarker 마크**를 발급 · 확인하게 하는 MCP 서버입니다.

- 파일은 이 컴퓨터에서 읽습니다(출처 판독기 aim-extract 내장). 서버에는 특징값 · 해시 · 서명 검증에 필요한 출처 기록 조각만 갑니다. 원본 파일 · 픽셀 · 글 원문은 보내지 않습니다.
- 판정은 근거로만 합니다: C2PA 서명 재검증(서명 검증) · 생성 도구 기록(파일 기록) · 기록이 없으면 발급자 신고. 근거와 맞지 않는 표시는 서버가 막습니다.
- 마크마다 AIMarker 서버가 Ed25519 로 서명합니다(JWS). 이 서버는 공개키(https://aimarker.kr/.well-known/aimarker-keys.json)로 서명을 직접 확인합니다.
- 하루치 원장은 다음 날 OpenTimestamps 공개 앵커로 묶입니다.
- 부가 기능: 광고 문구 검수 · 자동 수정 · 표시 문구 · 사이트 진단 · 광고주 승인 링크 · 증거 원장.

마크는 표시와 근거를 기록하고 서명한 것이며 법적 인증이 아닙니다. 광고 검수 결과는 위험 후보와 근거이며 법률 자문이 아닙니다.

## 준비

1. https://aimarker.kr/developers/#key 에서 무료 API 키를 받습니다.
2. Node.js 18 이상이 필요합니다. 의존성은 없습니다. `sharp` 가 설치돼 있으면 비슷한 이미지 찾기에 쓰는 지각 해시도 만듭니다(선택).

## 설정

Claude Desktop · Cursor · Gemini CLI (`mcpServers`):

```json
{
  "mcpServers": {
    "aimarker": {
      "command": "npx",
      "args": ["-y", "https://aimarker.kr/mcp/aimarker-mcp-2.0.0.tgz"],
      "env": { "AIMARKER_KEY": "amk_발급받은_키" }
    }
  }
}
```

Windows 에서 `npx` 를 찾지 못하면 `"command": "cmd", "args": ["/c", "npx", "-y", "https://aimarker.kr/mcp/aimarker-mcp-2.0.0.tgz"]` 로 바꾸세요.

Claude Code:

```bash
claude mcp add aimarker -e AIMARKER_KEY=amk_발급받은_키 -- npx -y https://aimarker.kr/mcp/aimarker-mcp-2.0.0.tgz
```

파일 하나로 쓰려면 https://aimarker.kr/mcp/aimarker-mcp.mjs 를 내려받아 `"command": "node", "args": ["/경로/aimarker-mcp.mjs"]` 로 등록합니다.

## 도구

| 도구 | 하는 일 |
| --- | --- |
| aimarker_analyze_file | 파일의 AI 사용 근거 확인(판정 · 근거 등급 · 고를 수 있는 표시 · 기존 마크) |
| aimarker_analyze_text | 글의 해시와 AI 활용 표현으로 기존 마크 · 주의할 점 확인(원문은 보내지 않음) |
| aimarker_mark | 서명된 마크 발급(근거와 맞지 않는 표시는 막힘) · 원하면 마크를 넣은 표시본(JPEG · PNG) 저장 |
| aimarker_mark_batch | 20개까지 한 번에 확인 · 발급(근거 없는 항목은 DECLARE 로 돌려줌) |
| aimarker_mark_info | 마크 번호로 표시 · 근거 · 상태 · 이력 확인, 서명 직접 확인 |
| aimarker_verify_mark | 파일 속 마크 · 서명(JWS) 확인, 원본 · 표시본 대조, 철회 여부 |
| aimarker_find_marks | 같은 파일 · 표시본 · 비슷한 이미지의 마크 찾기 |
| aimarker_edit_mark | 관리 키로 표시 변경(근거 안에서) · 제목 · 발급자 · 철회 |
| aimarker_anchor | 하루치 원장의 뿌리 해시 · OpenTimestamps 증명 확인 · .ots 저장 |
| aimarker_check · aimarker_auto_fix · aimarker_check_batch | 광고 문구 검수 · 자동 수정(부가 기능) |
| aimarker_label · aimarker_scan_site | 표시 문구 · 사이트 진단 |
| aimarker_request_approval · aimarker_approval_status | 광고주 승인 링크 · 상태 |
| aimarker_stamp · aimarker_verify | 증거 원장 기록 · 확인 |

프롬프트: `mark_content`(확인하고 마크 받기) · `check_received_file`(받은 파일의 마크 확인) · `review_ad_copy`(광고 문구 검수)

## 에이전트가 지키는 원칙

- 표시는 판정의 allowed 안에서만 고릅니다. 근거가 없으면 사용자에게 묻고 '발급자 신고'로 발급합니다.
- 에이전트가 만들거나 고친 콘텐츠는 AI 사용 표시를 고르고 사용한 AI를 적습니다. 'AI 미사용'은 사용자가 그렇다고 말했을 때만 고릅니다.
- 비슷한 이미지에 AI 마크가 있으면 서버가 한 번 더 묻습니다(CONFIRM). 사용자가 확인했을 때만 다시 보내고, 그 사실은 마크의 공개 근거와 이력에 남습니다.

## 환경 변수

- `AIMARKER_KEY` (필수): API 키
- `AIMARKER_TIMEOUT_MS` (선택): 요청 제한 시간, 기본 90000

문의: contact@skkc.co.kr · https://aimarker.kr/developers/
