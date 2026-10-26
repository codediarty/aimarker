# 가게 AI 검색 등록: 올린 가게(13.9)

결제한 가게의 '가게 정보 파일'(무료 진단 화면의 [가게 정보 파일 받기], `aimarker-store-*.json`)을 이 폴더에 넣고 `python3 _src/build.py` 를 돌리면

- `p/<주소>/index.html`: AI가 읽는 가게 페이지(화면 미리보기와 같은 엔진 `assets/local-core.js`)
- `p/index.html`: 등록 가게 목록
- `sitemap.xml` 에 주소 추가, `llms.txt` 끝에 '등록 가게' 줄 추가

가 만들어집니다. 배포한 뒤에는 새 주소를 IndexNow 로 알립니다(네이버 · 빙, 아래).

- 파일 이름 앞에 `_` 를 붙이면 건너뜁니다(`_example.json`). 잠시 내리려면 파일에 `"publish": false`.
- `updated`(사장님이 확인한 날, YYYY-MM-DD)가 없으면 빌드가 멈춥니다. 주소(slug)는 이름에서 자동으로 만들고, 겹치면 `"slug"` 를 직접 적습니다.
- 사장님이 보낸 사실만 올립니다. 법으로 정한 표시가 빠지면 빌드가 멈춥니다(store_render.js `need()`):
  - 학원: 교습비(교육청에 신고한 금액 그대로, 학원법 제15조)
  - 부동산: 중개사무소 등록번호 · 개업공인중개사 이름 · 소재지 · 연락처(공인중개사법 제18조의2)
  - 법률 · 세무 · 노무 사무소: 세부 업종(변호사가 아니면 '법률사무소'라고 쓸 수 없음, 변호사법 제112조)
  - 병원 · 치과 · 한의원 · 피부과: 광고 표현 점검 기록(`check`, 화면에서 점검한 뒤 받은 파일에 들어감), 높은 위험 후보 0개
- 같은 이름이 이미 있으면 주소 뒤에 지역을 붙입니다. 그래도 겹치면 멈추니 파일에 `"slug"` 를 적습니다.

## IndexNow(네이버 · 빙에 바로 알리기)

키 파일은 저장소 맨 위 `<키>.txt`(build.py 의 INDEXNOW_KEY)입니다. 배포가 끝나면 브라우저(aimarker.kr 탭)에서:

```js
['https://aimarker.kr/p/주소/'].forEach(u => fetch('https://api.indexnow.org/indexnow?url=' + encodeURIComponent(u) + '&key=' + KEY, { mode: 'no-cors' }));
```
