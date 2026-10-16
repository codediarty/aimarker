/* AIMarker 4.0 홈: 첫 화면 운영 화면 · 형광펜 · 처리 흐름 · 엔진 구조도 · 절감 계산기 */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var won = function (n) { return Math.round(n).toLocaleString('ko-KR') + '원'; };
  var ICO = function (p) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };

  /* ---------- 형광펜: 화면에 들어오면 한 번 긋기 ---------- */
  var marks = $$('.mk');
  if ('IntersectionObserver' in window && !RM) {
    var mo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); mo.unobserve(e.target); } }); }, { threshold: .6 });
    marks.forEach(function (m) { mo.observe(m); });
  } else marks.forEach(function (m) { m.classList.add('on'); });

  /* ---------- 첫 화면: 실시간처럼 흐르는 운영 화면(데모 데이터) ---------- */
  var dash = $('[data-hdash]');
  if (dash) {
    var feed = $('[data-hfeed]', dash), toast = $('[data-htoast]', dash);
    var K = { total: 1284, auto: 796, wait: 14, ledger: 1231 };
    var ST = { ok: ['s-ok', '자동 통과'], wait: ['s-wait', '승인 대기'], hi: ['s-hi', '수정 필요'], done: ['s-done', '원장 기록'] };
    var POOL = [
      ['t5', 'AI 모델 화보 컷 04.png', '숲결 뷰티 · 외주 납품', 'wait'],
      ['t6', '블랙프라이데이 카피 12종', '온결 리빙 · 검색 광고', 'ok'],
      ['t1', '비타민C 세럼 상세.jpg', '숲결 뷰티 · 상세페이지', 'hi'],
      ['t3', '유산균 체험단 원고.docx', '든든 헬스 · 블로그', 'wait'],
      ['t4', '겨울 패딩 룩북.webp', '온결 리빙 · 자사몰', 'ok'],
      ['t2', '치아 미백 이벤트 랜딩', '밝은미소 치과 · 랜딩', 'hi'],
      ['t6', '가을 니트 데일리룩.jpg', '온결 리빙 · 인스타그램', 'done'],
      ['t1', '수분크림 숏폼 자막.srt', '숲결 뷰티 · 쇼츠', 'ok'],
      ['t3', '루테인 배너 3종.png', '든든 헬스 · 디스플레이', 'ok'],
      ['t5', '가상 모델 보이스 광고.mp4', '숲결 뷰티 · 유튜브', 'wait']
    ];
    var pi = 0, n = 0;
    var fmt = function (v) { return v.toLocaleString('ko-KR'); };
    var paintK = function () {
      $('[data-hk="total"]', dash).textContent = fmt(K.total);
      $('[data-hk="auto"]', dash).textContent = Math.round(K.auto / K.total * 100);
      $('[data-hk="wait"]', dash).textContent = fmt(K.wait);
      $('[data-hk="ledger"]', dash).textContent = fmt(K.ledger);
    };
    var hex = function (k) { var s = ''; for (var i = 0; i < k; i++) s += '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16)); return s; };
    var tick = function () {
      if (document.hidden) return;
      var it = POOL[pi++ % POOL.length], li = document.createElement('li');
      li.className = 'in';
      li.innerHTML = '<span class="th ' + it[0] + '"></span><span class="nm"><b>' + esc(it[1]) + '</b><small>' + esc(it[2]) + '</small></span><span class="st s-run">분석 중</span>';
      feed.insertBefore(li, feed.firstChild);
      while (feed.children.length > 4) feed.removeChild(feed.lastChild);
      setTimeout(function () {
        var s = ST[it[3]], st = li.querySelector('.st');
        st.className = 'st ' + s[0]; st.textContent = s[1];
        K.total += 1 + Math.floor(Math.random() * 2);
        if (it[3] === 'ok' || it[3] === 'done') { K.auto++; K.ledger++; }
        if (it[3] === 'wait') K.wait++;
        if (it[3] === 'hi') K.wait = Math.max(8, K.wait - 1);
        paintK();
        if (++n % 3 === 0 && toast) {
          var d = new Date(), tm = [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (x) { return ('0' + x).slice(-2); }).join(':');
          toast.querySelector('small').textContent = 'LG' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + hex(4) + ' · ' + tm;
          toast.classList.add('on'); setTimeout(function () { toast.classList.remove('on'); }, 2400);
        }
        $$('.hdw-pipe i', dash).forEach(function (b, i) { var base = [100, 96, 93, 38, 96, 96][i]; b.style.setProperty('--w', Math.max(12, Math.min(100, base + Math.round((Math.random() - .5) * (i === 3 ? 30 : 6)))) + '%'); });
      }, 1200);
    };
    if (!RM) {
      var timer = null;
      var start = function () { if (!timer) timer = setInterval(tick, 2800); };
      var stop = function () { clearInterval(timer); timer = null; };
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else stop(); }, { threshold: .2 }).observe(dash);
      else start();
    }
  }

  /* ---------- 03 처리 흐름 ---------- */
  var rail = $('[data-rail]');
  if (rail) {
    var STEPS = [
      ['작업 공간 · API · 사이트 스크립트로 콘텐츠가 들어옵니다', '캠페인 · 브랜드 · 담당자 정보가 함께 붙고, 콘텐츠마다 고유 번호가 생깁니다. 대량 업로드와 연동 앱도 같은 입구를 씁니다.', 'Workflow Engine', 'CT-2610-0412 · 숲결 뷰티 · 가을 캠페인 v3'],
      ['출처와 생성 이력을 읽고, 등록된 콘텐츠와 겹치는지 봅니다', '파일 속 C2PA · IPTC · XMP 기록과 생성 도구 흔적을 신호별로 나눠 세고, 신뢰 수준을 네 단계로 매깁니다.', 'Origin · Fingerprint Engine', '출처: AI 생성 확인됨(IPTC trainedAlgorithmicMedia)'],
      ['업종 규칙 · 브랜드 정책 · 표시 기준으로 검수합니다', '위험 후보마다 근거 법령과 바꿀 말을 붙이고, 빠진 표시를 찾고, 출고 결정을 냅니다. 적용한 정책 버전도 함께 남습니다.', 'Policy Engine', '높음 5 · 주의 4 · 결정: 전문가 검토 권장 · KR-AdLaw 2026.10.15'],
      ['판단이 필요한 것만 사람에게 갑니다', '담당자가 확인하고, 광고주는 로그인 없이 링크로 승인하거나 수정을 요청합니다. 답은 자동으로 돌아옵니다.', 'Workflow Engine', '담당자 확인 14:20 → 광고주 승인 14:32'],
      ['승인된 버전에만 필요한 표시를 붙여 내보냅니다', '보이는 표시와 파일 속 기록(IPTC 디지털 출처 유형)을 함께 넣고, 게시 시스템 · API로 넘깁니다.', 'Workflow · Origin Engine', '[가상인물] · AI 생성 표시 · IPTC 기록 넣기'],
      ['판단 근거 · 승인 · 정책 버전을 검증 가능한 기록으로 남깁니다', '내용 대신 해시와 서버 시각을 남겨, 받은 쪽이 언제든 그때 그대로인지 확인합니다. 감사 때는 증거 패키지로 냅니다.', 'Evidence Ledger', 'LG261016-8F2A · SHA-256 · 서버 시각 14:32:08']
    ];
    var btns = $$('.rail-steps button', rail), fill = $('.rail-fill', rail), tok = $('.rail-tok', rail), panel = $('.rail-panel', rail);
    var cur = 0, user = false, rt = null;
    var setStep = function (i) {
      cur = i;
      btns.forEach(function (b, j) { b.setAttribute('aria-selected', i === j ? 'true' : 'false'); b.tabIndex = i === j ? 0 : -1; });
      var pct = ((i + .5) / STEPS.length * 100).toFixed(2) + '%';
      fill.style.width = pct; placeTok();
      var s = STEPS[i];
      panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
      $('.rp-t', panel).textContent = s[0]; $('.rp-d', panel).textContent = s[1]; $('.rp-eng', panel).textContent = s[2]; $('.rp-out', panel).textContent = s[3];
    };
    function placeTok() {
      var line = tok.parentNode, lw = line.clientWidth, tw = tok.offsetWidth, c = (cur + .5) / STEPS.length * lw;
      tok.style.left = Math.max(0, Math.min(lw - tw, c - tw / 2)) + 'px';
    }
    window.addEventListener('resize', placeTok);
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { user = true; clearInterval(rt); setStep(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); user = true; clearInterval(rt); var k = (cur + (e.key === 'ArrowRight' ? 1 : -1) + STEPS.length) % STEPS.length; setStep(k); btns[k].focus(); }
      });
    });
    setStep(0);
    if (!RM && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !user && !rt) rt = setInterval(function () { if (!user) setStep((cur + 1) % STEPS.length); }, 3200);
        else if (!es[0].isIntersecting) { clearInterval(rt); rt = null; }
      }, { threshold: .35 }).observe(rail);
    }
  }

  /* ---------- 05 엔진 구조도 ---------- */
  var arch = $('[data-arch]');
  if (arch) {
    var I = {
      origin: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>',
      fingerprint: '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
      policy: '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
      workflow: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
      ledger: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="m9 9.5 2 2 4-4"/>',
      warn: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
    };
    var E = window.AM_ENGINES = {
      origin: { n: 'Origin Engine', k: '출처 엔진', d: 'AI 콘텐츠의 출처와 생성 이력을 여러 신호로 확인하고, 신호마다 신뢰 수준을 나눠 알려 줍니다.',
        i: ['이미지 · 영상 파일', '파일 속 C2PA · IPTC · XMP · EXIF 기록', 'PNG 생성 설정값 · 파일 이름', '사이트 주소(공개된 첫 화면)'],
        p: ['메타데이터 판독(서명 · 생성 도구 · 디지털 출처 유형)', '생성 도구 흔적 · 파일 이름 · 크기 패턴 · 카메라 원본을 따로 셈', '신호별 무게로 네 단계 신뢰 수준 산정', '판별 모델 점수는 보조 신호로만'],
        o: ['확인됨 · 가능성 높음 · 확인 필요 · 확인 불가', '신호 목록과 근거', '붙일 표시와 IPTC 값 제안'],
        u: ['외주 납품 이미지 출처 확인', '상세페이지 AI 이미지 표시', '입점 · 제휴 사이트 진단'],
        live: ['C2PA · IPTC · XMP · 생성 설정값 판독(브라우저 안)', '사이트 진단(첫 화면 이미지 12장)', '네 단계 보수적 판정'],
        dev: ['공개 워터마크 검출기 연동', '생성 도구 API로 생성 기록 받기'],
        plan: ['원본 · 변형 파일 관계 분석', '영상 · 음성 출처 분석'],
        h: 'AI 판별 모델의 확률 점수를 AI 생성 사실의 확정 근거로 쓰지 않습니다. 기록이 지워진 파일은 \'없음\'이 아니라 \'확인 불가\'로 셉니다.' },
      fingerprint: { n: 'Fingerprint Engine', k: '지문 엔진', d: '등록된 콘텐츠의 지문을 만들어, 표시가 지워지거나 파일이 바뀌어도 원래 콘텐츠와의 관계를 찾습니다.',
        i: ['등록된 이미지 · 영상 · 문구', '새로 올라온 콘텐츠'],
        p: ['이미지 지각 해시(크기 · 압축 · 자르기에 강한 지문)', '텍스트 유사도 지문', '영상 대표 프레임 특징', '등록 색인과 비교해 변형 관계 판단'],
        o: ['일치하는 등록 콘텐츠와 유사도', '변형 유형(크기 변경 · 자르기 · 표시 제거)', '콘텐츠 계보(원본 → 파생)'],
        u: ['표시가 지워진 재업로드 찾기', '외주 납품물 재사용 · 중복 확인', '판매자 사이 이미지 재사용 추적(등록 범위 안)'],
        live: ['파일 SHA-256 정확 일치(원장 · 검증)'],
        dev: ['이미지 지각 해시 시험판(기술 문서에서 시연)'],
        plan: ['텍스트 지문 · 영상 프레임 지문', '콘텐츠 계보 그래프 · 표시 복원'],
        h: '등록된 콘텐츠 범위 안에서만 찾습니다. 인터넷에 있는 모든 콘텐츠를 추적하지 않습니다.' },
      policy: { n: 'Policy Engine', k: '정책 엔진', d: '업종 규칙 · 기업 정책 · 표시 기준을 자동으로 적용하고, 위험 후보마다 근거와 바꿀 말을 붙입니다.',
        i: ['광고 문구 · 상세페이지 글', '업종(자동 판별)', '협찬 · AI 인물 · AI 이미지 여부', '브랜드 금지어 · 필수 문구'],
        p: ['글자 정리 · 띄어 쓴 표현 잇기', '업종 팩과 콘텐츠 정보로 규칙 고르기', '면책 · 부정 문장 빼기', '필수 표시 확인 · 위험 점수 · 출고 결정'],
        o: ['위험 후보 · 근거 법령 · 바꿀 말', '붙일 표시 문구', '결정: 수정 후 출고 · 확인 후 출고 · 전문가 검토 권장', '적용한 정책 버전'],
        u: ['광고 소재 대량 검수', '브랜드별 정책 자동 적용', '광고 집행 전 체크리스트'],
        live: ['KR-AdLaw 규칙 팩 66항목 · 6개 업종 · 6개 범주', '브랜드 금지어 · 필수 문구', '배포마다 정답 시험 문장 자동 채점'],
        dev: ['정책 버전 관리 화면 · 승인 절차', '기업 AI 활용 지침 템플릿', '언어모델을 더한 문맥 판단'],
        plan: ['국가별 매핑(일본 약기법 · EU AI Act 제50조)', '이미지 · 영상 속 글자 검수'],
        h: '위반이라고 단정하지 않고 후보와 근거만 냅니다. 규정 변경은 검토 · 승인한 정책 업데이트로만 반영하고, 최종 판단은 사람이 합니다. 법적 적합성을 보장하지 않습니다.' },
      workflow: { n: 'Workflow Engine', k: '워크플로 엔진', d: '업로드부터 분석, 검수 요청, 승인, 표시, 게시, 보고서까지 기업의 반복 업무를 자동으로 잇습니다.',
        i: ['업로드 이벤트(작업 공간 · API · 사이트 스크립트)', '조직 · 프로젝트 · 캠페인 · 역할', '승인 규칙(담당자 → 팀장 → 광고주)'],
        p: ['이벤트 감지 → 자동 분석', '위험 수준 분류 → 담당자 검수 요청', '승인 · 반려 · 수정 요청', '표시 적용 → 게시 연동 → 보고서'],
        o: ['검수 대기열 · 승인 링크 · 상태', '표시가 붙은 콘텐츠', '보고서 · API 응답 · Webhook 이벤트'],
        u: ['대행사 캠페인 검수 · 광고주 승인', '쇼핑몰 입점 콘텐츠 자동 분류', '플랫폼 업로드 단계 관문'],
        live: ['검수 작업 공간 · 로그인 없는 광고주 승인 링크', 'API 8종 · MCP 서버 · 구글 시트 함수', '사이트 자동 표시 스크립트'],
        dev: ['기업 계정 · 팀 초대 · 역할 권한', '대량 업로드 · 검수 대기열 · 다단계 승인', 'Webhook · 클라우드 보관'],
        plan: ['게시 시스템 연동(쇼핑몰 솔루션 · 광고 매체)', 'SDK 정식 · 화이트라벨'],
        h: '사람의 승인 단계를 없애지 않습니다. 자동으로 넘기는 범위는 기업이 정책으로 정합니다.' },
      ledger: { n: 'Evidence Ledger', k: '증거 원장', d: '검수와 승인 과정을 검증할 수 있는 기록으로 남겨, 누가 무엇을 왜 승인했는지 나중에도 증명합니다.',
        i: ['콘텐츠 버전 · 파일 해시', '분석 결과와 판단 근거', '담당자 · 광고주 승인 기록', '적용한 정책 버전'],
        p: ['콘텐츠별 고유 번호', '키 순서를 맞춘 기록의 SHA-256 해시', '서버 시각과 함께 추가만 하는 기록', '앞 기록 해시를 잇는 해시 체인(개발 중)'],
        o: ['원장 번호 · 해시 · 서버 시각', '누구나 쓰는 검증 페이지', '감사용 증거 패키지'],
        u: ['광고주 · 감사 제출용 증빙', '분쟁 때 승인 사실 확인', '정책 적용 이력 감사'],
        live: ['보고서 · 버전 · 승인 해시와 서버 시각 기록', '공개 검증 페이지(aimarker.kr/verify/)', '내용 대신 해시만 저장'],
        dev: ['해시 체인(추가만 하는 감사 로그)', '감사 증거 패키지 내보내기'],
        plan: ['하루 단위 머클 루트 외부 공개', 'RFC 3161 시간 도장'],
        h: '일반 데이터베이스 기록은 고쳐도 흔적이 남지 않습니다. 증거 원장은 해시를 이어 한 줄만 바뀌어도 검증에서 드러나게 합니다. 블록체인은 쓰지 않고, 비용 · 속도 · 개인정보를 고려해 해시 체인과 외부 시간 도장을 택했습니다.' }
    };
    var pnl = $('#engPanel');
    var li = function (a) { return '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
    var show = function (k) {
      var e = E[k]; if (!e) return;
      $$('.eng', arch).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-eng') === k ? 'true' : 'false'); });
      pnl.innerHTML = '<div class="ep-h"><i>' + ICO(I[k]) + '</i><h3>' + e.n + '<small>' + e.k + '</small></h3><p>' + esc(e.d) + '</p></div>' +
        '<div class="ep-grid"><div><b>입력 데이터</b>' + li(e.i) + '</div><div><b>처리 방식</b>' + li(e.p) + '</div><div><b>출력 결과</b>' + li(e.o) + '</div><div><b>활용 사례</b>' + li(e.u) + '</div></div>' +
        '<div class="ep-st"><div><span class="stt is-live">운영 중</span>' + li(e.live) + '</div><div><span class="stt is-dev">개발 중</span>' + li(e.dev) + '</div><div><span class="stt is-plan">계획</span>' + li(e.plan) + '</div></div>' +
        '<p class="ep-honest">' + ICO(I.warn) + '<span>' + esc(e.h) + '</span></p>';
    };
    $$('.eng', arch).forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-eng')); }); });
    show('origin');
  }

  /* ---------- 07 절감 계산기 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-calc]'), function (box) {
    var g = function (id) { return box.querySelector('#' + id); };
    var feeTouched = false;
    var planFor = function (n) {
      var c = [['Business', 149000 + Math.max(0, n - 1000) * 150], ['Agency', 490000 + Math.max(0, n - 10000) * 50], ['Enterprise', 1000000 + Math.max(0, n - 50000) * 20]];
      c.sort(function (a, b) { return a[1] - b[1]; });
      return c[0];
    };
    var calc = function () {
      var n = +g('cN').value, m = +g('cM').value, w = +g('cW').value, a = +g('cA').value / 100;
      var plan = planFor(n);
      if (!feeTouched) g('cC').value = Math.min(+g('cC').max, Math.round(plan[1] / 10000) * 10000);
      var fee = +g('cC').value;
      var hours = n * m / 60, now = hours * w, human = now * (1 - a), after = human + fee, save = now - after;
      g('cNo').textContent = n.toLocaleString('ko-KR') + '건'; g('cMo').textContent = m + '분'; g('cWo').textContent = won(w); g('cAo').textContent = Math.round(a * 100) + '%'; g('cCo').textContent = won(fee);
      g('cCp').textContent = feeTouched ? '직접 정한 값으로 계산 중' : '추천 상품 ' + plan[0] + ' 예상 요금 기준 · 움직이면 직접 정한 값으로 계산';
      g('cSave').textContent = save >= 0 ? won(save) : '-' + won(-save);
      g('cSaveY').textContent = save >= 0 ? '한 해 ' + won(save * 12) : '이 조건에서는 도입 비용이 더 큽니다';
      g('cNow').textContent = won(now); g('cAfter').textContent = won(after);
      var mx = Math.max(now, after, 1);
      g('cbNow').style.width = (now / mx * 100) + '%'; g('cbAfterH').style.width = (human / mx * 100) + '%'; g('cbAfterF').style.width = (fee / mx * 100) + '%';
      g('cHours').textContent = (Math.round(hours * 10) / 10).toLocaleString('ko-KR') + '시간 → ' + (Math.round(hours * (1 - a) * 10) / 10).toLocaleString('ko-KR') + '시간';
      g('cRoi').textContent = fee > 0 ? (save / fee).toFixed(1) + '배' : '도입 비용 0원';
      g('cPlan').textContent = plan[0];
    };
    ['cN', 'cM', 'cW', 'cA', 'cC'].forEach(function (id) {
      g(id).addEventListener('input', function () { if (id === 'cC') feeTouched = true; calc(); });
    });
    calc();
  });

  /* ---------- 데모로 가는 단추: 데모 화면 맨 위로 ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#demo"]');
    if (!a) return;
    var t = document.getElementById('demo'); if (!t) return;
    e.preventDefault(); t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', '#demo');
  });
})();
