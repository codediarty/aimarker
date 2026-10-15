# AIMarker (aimarker.kr)

AI로 만든 이미지 · 영상 · 글 · 상담을 자동으로 찾아(탐지) 법 기준에 맞게 표시하고(표시), 표시한 내역을 기록으로 남기는(기록) 서비스의 공식 사이트입니다.

- 홈 · 무료 진단: `/`
- 작동 방식: `/how/` · 자동 탐지 베타: `/beta/` · 요금: `/pricing/` · 기업 · 플랫폼: `/business/`
- 무료 도구: 사이트 표시 `/site/` (표시 스크립트 `m.js`) · 이미지 표시 · 확인 `/image/` · AI 활용 증빙서 `/proof/`
- 자료: AI 표시 가이드 `/guide/` · 신뢰 · 판단 기준 `/trust/`

## 고치는 법

1. `_src/pages/*.html` 이나 `assets/*` 를 고칩니다.
2. `python3 _src/build.py` 로 머리글 · 바닥글을 입힌 페이지와 `sitemap.xml` 을 다시 만듭니다.
3. 커밋하고 푸시하면 GitHub Pages 가 바로 반영합니다.

운영 성균관컨설팅 · 문의 contact@skkc.co.kr
