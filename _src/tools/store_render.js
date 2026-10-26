#!/usr/bin/env node
/* 13.9 가게 AI 검색 등록: _src/stores/*.json(가게 정보 파일) → p/<주소>/index.html
   화면의 미리보기와 같은 엔진(assets/local-core.js 의 page())으로 만들어, 손님이 본 미리보기와 올린 페이지가 똑같습니다.
   '_' 로 시작하는 파일과 "publish": false 인 파일은 건너뜁니다. 결과 목록(JSON)을 표준 출력으로 build.py 에 넘깁니다.
   법으로 정한 표시가 빠지면 올리지 않고 멈춥니다(학원 교습비 · 부동산 등록번호와 개업공인중개사 · 사무소 세부 업종 · 의료 광고 표현 점검). */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const L = require(path.join(ROOT, 'assets', 'local-core.js'));
const dir = path.join(ROOT, '_src', 'stores');
const out = [], seen = {};
function need(f, s) {
  const I = L.IND[s.ind], miss = [];
  if (!s.name) miss.push('가게 이름');
  if (!s.updated) miss.push('확인 날짜(updated, YYYY-MM-DD)');
  if (I.fee && !s.fee) miss.push('교습비(학원법: 교습비 표시)');
  if (I.reg && (!s.biz.reg || !s.biz.owner || !s.addr || !s.tel)) miss.push('중개사무소 등록번호 · 개업공인중개사 이름 · 소재지 · 연락처(공인중개사법 제18조의2)');
  if (I.subReq && !s.sub) miss.push('세부 업종(변호사 · 법무사 · 세무사 · 회계사 · 노무사 · 행정사. "법률사무소"는 변호사만 쓸 수 있음)');
  if (I.med && !s.check) miss.push('광고 표현 점검 기록(진단 화면 → 광고 표현 점검 → 가게 정보 파일 다시 받기)');
  if (I.med && s.check && s.check.hi > 0) miss.push('광고 표현 점검의 높은 위험 후보 ' + s.check.hi + '개를 고친 뒤 다시 점검');
  if (miss.length) throw new Error(f + ': 올리기 전에 채울 것 → ' + miss.join(' / '));
}
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith('.json') || f.startsWith('_')) continue;
  const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (raw.publish === false) continue;
  const s = L.normalize(raw);
  need(f, s);
  /* 주소(slug): 파일에 적은 값 → 이름 → 겹치면 지역을 붙임 → 그래도 겹치면 멈춤 */
  s.slug = s.slug || L.slug(s.name, s.area);
  if (seen[s.slug] && !raw.slug) { const alt = (s.slug + '-' + L.slug(s.area || L.parseAddr(s.addr).short || 'kr', '')).slice(0, 48).replace(/-+$/, ''); if (alt !== s.slug) s.slug = alt; }
  if (seen[s.slug]) throw new Error(f + ': 주소(slug) ' + s.slug + ' 가 ' + seen[s.slug] + ' 와 겹칩니다. 파일에 "slug" 를 따로 적으세요');
  seen[s.slug] = f;
  const url = L.SITE + 'p/' + s.slug + '/';
  const html = L.page(s, { url: url, hosted: true });
  const fp = path.join(ROOT, 'p', s.slug, 'index.html');
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  if (!fs.existsSync(fp) || fs.readFileSync(fp, 'utf8') !== html) fs.writeFileSync(fp, html);
  out.push({ file: f, slug: s.slug, url: url, name: s.name + (s.branch ? ' ' + s.branch : ''), ind: L.IND[s.ind].t, noun: L.noun(s), area: s.area || L.parseAddr(s.addr).short, intro: L.intro(s), updated: s.updated, score: L.score(s).total });
}
process.stdout.write(JSON.stringify(out));
