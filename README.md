# AIMarker (aimarker.kr)

AI로 만든 글 · 이미지 · 영상 · 상담을 밝히는 표시 도구. 운영 성균관컨설팅.

- 사이트 표시: `/site/` (표시 스크립트 `m.js`)
- 이미지 표시 · 확인: `/image/`
- AI 활용 증빙서: `/proof/`

## 고치는 법

1. `_src/pages/*.html` 이나 `assets/*` 를 고칩니다.
2. `python3 _src/build.py` 로 쪽마다 머리글 · 바닥글을 입힌 HTML 과 `sitemap.xml` 을 다시 만듭니다.
3. 커밋하고 푸시하면 GitHub Pages 가 바로 반영합니다.

신청 · 문의(am.lead)와 사이트 자동 진단(am.scan)은 KAIEC 위원 활동 시스템(Apps Script) 1.13.0 이 받습니다.
