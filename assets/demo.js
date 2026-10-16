/* AIMarker 4.0 제품 데모: 개요 · 콘텐츠 분석 · 위험 검토 · 정책 센터 · 증거 원장 · 연동 · 분석
   숫자와 브랜드는 데모 데이터입니다. 위험 검토의 '직접 검사'와 원장의 해시 계산만 실제로 돕니다. */
(function () {
  'use strict';
  var root = document.querySelector('[data-app4]');
  if (!root) return;
  var U = window.AMUI, AM = window.AM;
  var R = (document.body.getAttribute('data-root') || '');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var n0 = function (v) { return Number(v).toLocaleString('ko-KR'); };
  var ico = function (p, c) { return '<svg class="ico' + (c ? ' ' + c : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
  var P = {
    dash: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    intel: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>',
    risk: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    policy: '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
    ledger: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="m9 9.5 2 2 4-4"/>',
    plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    bars: '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    branch: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    dl: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'
  };
  var VIEWS = [
    ['overview', '개요', 'Overview', P.dash], ['intel', '콘텐츠 분석', 'Content Intelligence', P.intel], ['risk', '위험 검토', 'Risk Review', P.risk],
    ['policy', '정책 센터', 'Policy Center', P.policy], ['ledger', '증거 원장', 'Evidence Ledger', P.ledger], ['int', '연동', 'Integrations', P.plug], ['ana', '분석', 'Analytics', P.bars]
  ];
  var LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0E2A6B"/><path d="M20 7.6l1.86 5.1a2.8 2.8 0 0 0 1.68 1.68l5.1 1.86-5.1 1.86a2.8 2.8 0 0 0-1.68 1.68L20 24.9l-1.86-5.12a2.8 2.8 0 0 0-1.68-1.68l-5.1-1.86 5.1-1.86a2.8 2.8 0 0 0 1.68-1.68z" fill="#fff"/><rect x="11" y="28.6" width="18" height="3.6" rx="1.8" fill="#3BD6BD"/></svg>';

  /* 위험 검토 대기열: 실제 엔진 결과(KR-AdLaw 2026.10.15)를 그대로 담은 데모 데이터 */
  var QUEUE = [{"id":"q1","brand":"숲결 뷰티","title":"AI 모델 지아 화보 카피","ch":"인스타그램","camp":"가을 수분 캠페인","who":"김지윤","at":"14:12","text":"AI 모델 지아가 직접 써 본 재생 크림! 부작용 없는 순한 성분으로 바르자마자 주름이 사라져요. 국내 최초 특허 성분.","ind":"","flags":{"aiPerson":true,"aiMedia":true},"r":{"ind":"cos","indName":"화장품","auto":true,"score":100,"decision":"expert","counts":{"high":5,"mid":4,"info":0},"findings":[{"id":"A02","cat":1,"lv":3,"s":10,"e":16,"re":16,"t":"직접 써 본","why":"AI로 만든 이미지 · 인물을 실제 사용 모습 · 후기처럼 보이게 하면 기만 광고가 됩니다.","law":"AI기본법 제31조 · 표시광고법(기만)","reps":["(삭제)"],"tip":"AI로 만든 장면이면 실제 후기처럼 쓰지 말고 'AI로 만든 이미지'라고 밝히세요."},{"id":"A03","cat":2,"lv":3,"s":10,"e":14,"re":14,"t":"직접 써","why":"AI로 만든 인물의 '후기'는 실제 경험처럼 보여 기만 광고가 됩니다.","law":"추천 · 보증 심사지침 '가상인물' 표시(2026.6.1)","reps":["(삭제)"],"tip":"AI 인물에게 후기 · 체험을 말하게 하지 마세요."},{"id":"K01","cat":3,"lv":3,"s":17,"e":19,"re":19,"t":"재생","why":"화장품에 치료 · 재생처럼 의약품 효능을 표현하면 의약품으로 오인하게 하는 광고입니다.","law":"화장품법 제13조 · 시행규칙 별표 5","reps":["케어","관리"],"tip":"치료 · 재생 대신 '케어' · '보습' · '피부 컨디션' 같은 화장품 표현으로 바꾸세요."},{"id":"C01","cat":3,"lv":3,"s":24,"e":29,"re":30,"t":"부작용 없","why":"부작용이 없다 · 무해하다는 단정은 근거가 있어도 소비자를 오인하게 할 수 있어 거짓 · 과장 광고가 되기 쉽습니다.","law":"표시광고법 제3조(거짓 · 과장 · 기만 광고)","reps":["자극을 줄인","순한"],"tip":"단정 대신 시험 결과 · 주의 사항을 함께 적으세요."},{"id":"K04","cat":3,"lv":2,"s":39,"e":44,"re":44,"t":"바르자마자","why":"즉각적 · 극적인 효과를 단정하면 실증 자료가 필요하고, 없으면 과장 광고가 됩니다.","law":"화장품법 제13조 · 시행규칙 별표 5","reps":["꾸준히 사용하면"],"tip":"효과가 나타나는 조건 · 시험 결과를 함께 적거나 '꾸준히 사용하면'처럼 바꾸세요."},{"id":"K07","cat":3,"lv":3,"s":45,"e":51,"re":53,"t":"주름이 사라","why":"화장품에 치료 · 제거 · 질환 개선처럼 의약품 효능을 표현하면 의약품으로 오인하게 하는 광고입니다.","law":"화장품법 제13조 · 시행규칙 별표 5","reps":[],"tip":"효능을 단정하지 말고 '보습' · '피부 결' · '피부 컨디션' 같은 화장품 표현으로 다시 쓰세요. 기능성 화장품이면 심사받은 문구 그대로 쓰세요."},{"id":"C04","cat":3,"lv":2,"s":55,"e":60,"re":60,"t":"국내 최초","why":"최고 · 최초 · 1위 같은 최상급 표현은 객관적 근거가 없으면 거짓 · 과장 광고가 됩니다.","law":"표시광고법 제3조(거짓 · 과장 · 기만 광고)","reps":["많은 분이 찾는","믿을 수 있는"],"tip":"조사 기관 · 기간 · 대상을 함께 적거나(예: 'OO리서치 2026.9 조사 기준') 사실로 확인되는 말로 바꾸세요."},{"id":"C10","cat":3,"lv":2,"s":61,"e":66,"re":66,"t":"특허 성분","why":"특허 · 임상 · 인증 표현은 번호와 범위(무엇에 대한 것인지)가 맞아야 하고, 범위를 넘으면 과장 광고가 됩니다.","law":"표시광고법 제3조(거짓 · 과장 · 기만 광고)","reps":[],"tip":"인증 · 특허 번호와 대상(성분 · 제조 방법 등)을 함께 적으세요."},{"id":"D21","cat":1,"lv":2,"s":-1,"e":-1,"t":"","why":"AI로 만든 이미지 · 영상이 들어가는데 그 사실을 밝히는 말이 없습니다. 실제처럼 보이면 소비자를 오인하게 할 수 있습니다.","law":"AI기본법 제31조 · 표시광고법(기만)","reps":["(AI로 만든 이미지) "],"tip":"이미지 · 영상 가까이에 'AI로 만든 이미지'를 밝히세요."}],"labels":[{"kind":"person","text":"[가상인물]","long":"이 광고에는 AI로 만든 가상인물이 등장합니다.","where":"영상은 인물 가까이 화면 안, 글은 첫머리"},{"kind":"media","text":"AI 생성","long":"이 이미지(영상)는 AI로 만들었습니다.","where":"이미지 · 영상 위나 바로 아래","iptc":"http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"}]}},{"id":"q2","brand":"든든 헬스","title":"다이어트 젤리 숏폼 자막","ch":"유튜브 쇼츠","camp":"젤리 신제품 출시","who":"박선우","at":"13:58","text":"의사가 추천하는 다이어트 젤리! 먹기만 해도 2주 만에 5kg 빠지고 부작용도 전혀 없어요.","ind":"food","flags":{},"r":{"ind":"food","indName":"일반식품","auto":false,"score":100,"decision":"expert","counts":{"high":4,"mid":0,"info":0},"findings":[{"id":"F05","cat":3,"lv":3,"s":0,"e":6,"re":8,"t":"의사가 추천","why":"식품 광고에서 의사 · 약사 등 전문가가 효능을 추천 · 보증하는 표현은 부당 광고 기준에 들어갑니다.","law":"식품표시광고법 제8조","reps":["(삭제)"],"tip":"전문가 추천 표현을 빼세요. 개발 과정을 알리려면 소속 · 역할 사실만 적으세요."},{"id":"F04","cat":3,"lv":3,"s":18,"e":24,"re":24,"t":"먹기만 해도","why":"체중 감량 · 지방 분해 효과를 내세우는 표현은 식품 · 화장품에서 부당 광고로 자주 걸립니다.","law":"식품표시광고법 제8조","reps":["(삭제)"],"tip":"체중 감량 효과 대신 칼로리 · 원재료 같은 사실 정보로 바꾸세요. 건강기능식품은 인정 문구 그대로만."},{"id":"F04","cat":3,"lv":3,"s":31,"e":36,"re":38,"t":"5kg 빠","why":"체중 감량 · 지방 분해 효과를 내세우는 표현은 식품 · 화장품에서 부당 광고로 자주 걸립니다.","law":"식품표시광고법 제8조","reps":["(삭제)"],"tip":"체중 감량 효과 대신 칼로리 · 원재료 같은 사실 정보로 바꾸세요. 건강기능식품은 인정 문구 그대로만."},{"id":"C01","cat":3,"lv":3,"s":39,"e":48,"re":50,"t":"부작용도 전혀 없","why":"부작용이 없다 · 무해하다는 단정은 근거가 있어도 소비자를 오인하게 할 수 있어 거짓 · 과장 광고가 되기 쉽습니다.","law":"표시광고법 제3조(거짓 · 과장 · 기만 광고)","reps":[],"tip":"단정 대신 시험 결과 · 주의 사항을 함께 적으세요."}],"labels":[]}},{"id":"q3","brand":"숲결 뷰티","title":"체험단 후기 원고 7번","ch":"네이버 블로그","camp":"가을 수분 캠페인","who":"외주 · 리뷰랩","at":"13:41","text":"#내돈내산 인생 크림 찾았어요! 2주 만에 피부가 완전히 재생됐어요. 강력 추천합니다.","ind":"","flags":{"sponsored":true},"r":{"ind":"cos","indName":"화장품","auto":true,"score":90,"decision":"fix","counts":{"high":3,"mid":0,"info":0},"findings":[{"id":"R01","cat":4,"lv":3,"s":1,"e":5,"re":5,"t":"내돈내산","why":"대가를 받고 '내돈내산 · 광고 아님'이라고 쓰면 기만 광고입니다.","law":"추천 · 보증 등에 관한 표시 · 광고 심사지침(공정위)","reps":["(삭제)"],"tip":"대가 관계를 숨기는 말을 빼고 '광고' · '협찬'을 첫머리에 밝히세요."},{"id":"K01","cat":3,"lv":3,"s":32,"e":34,"re":37,"t":"재생","why":"화장품에 치료 · 재생처럼 의약품 효능을 표현하면 의약품으로 오인하게 하는 광고입니다.","law":"화장품법 제13조 · 시행규칙 별표 5","reps":[],"tip":"치료 · 재생 대신 '케어' · '보습' · '피부 컨디션' 같은 화장품 표현으로 바꾸세요."},{"id":"D02","cat":4,"lv":3,"s":-1,"e":-1,"t":"","why":"대가를 받은 콘텐츠인데 '광고' · '협찬' 표시가 없습니다.","law":"추천 · 보증 등에 관한 표시 · 광고 심사지침(공정위)","reps":["[광고] "],"tip":"제목이나 첫머리에 '광고' · '협찬'을 눈에 띄게 적으세요."}],"labels":[{"kind":"sponsor","text":"[광고]","long":"이 콘텐츠는 ○○로부터 제품(또는 원고료)을 받아 작성한 광고입니다.","where":"제목이나 첫 줄, 더보기 누르기 전에 보이는 곳"}]}},{"id":"q4","brand":"든든 헬스","title":"여주차 상세페이지 상단","ch":"상세페이지","camp":"건강차 기획전","who":"박선우","at":"13:20","text":"혈당 걱정 끝! 당뇨에 좋은 여주차. 하루 3잔이면 혈당이 쭉 내려갑니다.","ind":"food","flags":{},"r":{"ind":"food","indName":"일반식품","auto":false,"score":40,"decision":"fix","counts":{"high":2,"mid":0,"info":0},"findings":[{"id":"F02","cat":3,"lv":3,"s":9,"e":15,"re":15,"t":"당뇨에 좋은","why":"질병의 예방 · 치료 효능을 내세우는 표현입니다. 식품 · 화장품 · 일반 상품에서는 의약품으로 오인하게 하는 부당 광고가 됩니다.","law":"식품표시광고법 제8조","reps":["(삭제)"],"tip":"질병 이름과 효능을 함께 쓰지 마세요. 건강기능식품이면 인정받은 기능성 문구만 쓰세요."},{"id":"F02","cat":3,"lv":3,"s":29,"e":37,"re":40,"t":"혈당이 쭉 내려","why":"질병의 예방 · 치료 효능을 내세우는 표현입니다. 식품 · 화장품 · 일반 상품에서는 의약품으로 오인하게 하는 부당 광고가 됩니다.","law":"식품표시광고법 제8조","reps":["(삭제)"],"tip":"질병 이름과 효능을 함께 쓰지 마세요. 건강기능식품이면 인정받은 기능성 문구만 쓰세요."}],"labels":[]}},{"id":"q5","brand":"밝은미소 치과","title":"치아 미백 이벤트 랜딩","ch":"랜딩 페이지","camp":"치아 미백 이벤트","who":"이도현","at":"12:47","text":"치아 미백 이벤트! 1회 시술로 누구나 확실하게 밝아지는 최고의 효과, 부작용 없이 안전합니다. 첫 방문 스케일링 무료.","ind":"med","flags":{},"r":{"ind":"med","indName":"의료 · 병원","auto":false,"score":100,"decision":"expert","counts":{"high":3,"mid":1,"info":1},"findings":[{"id":"M05","cat":3,"lv":2,"s":6,"e":9,"re":9,"t":"이벤트","why":"의료광고의 할인 · 이벤트는 소비자를 속이거나 유인하는 광고로 볼 수 있어 심의에서 자주 걸립니다.","law":"의료법 제27조 · 제56조(환자 유인 · 의료광고)","reps":[],"tip":"할인 이벤트 대신 정확한 비급여 비용과 조건을 안내하세요."},{"id":"M03","cat":3,"lv":3,"s":32,"e":34,"re":35,"t":"최고","why":"다른 의료기관 · 의료인과 비교하거나 최상급으로 표현하는 의료광고는 금지됩니다.","law":"의료법 제56조(의료광고)","reps":["(삭제)"],"tip":"비교 · 최상급 표현을 빼고 객관적 사실(진료 과목 · 장비 · 경력)만 적으세요."},{"id":"M01","cat":3,"lv":3,"s":40,"e":45,"re":46,"t":"부작용 없","why":"치료 결과 · 안전을 단정하는 의료광고는 소비자를 오인하게 해 금지됩니다.","law":"의료법 제56조(의료광고)","reps":[],"tip":"결과 단정 대신 시술 과정 · 회복 기간 · 부작용 가능성을 함께 안내하세요."},{"id":"M04","cat":3,"lv":3,"s":59,"e":66,"re":66,"t":"스케일링 무료","why":"금품 제공 · 무료 시술 같은 혜택으로 환자를 끌어들이는 광고는 환자 유인으로 문제 될 수 있습니다.","law":"의료법 제27조 · 제56조(환자 유인 · 의료광고)","reps":["(삭제)"],"tip":"혜택 대신 진료 내용과 비용 안내로 바꾸고, 비급여 비용은 정확히 적으세요."},{"id":"D41","cat":3,"lv":1,"s":-1,"e":-1,"t":"","why":"의료광고는 매체 · 형태에 따라 사전 심의 대상입니다. 심의번호를 확인하세요.","law":"의료법 제56조(의료광고)","reps":[],"tip":"심의를 받았다면 심의번호를 함께 적으세요."}],"labels":[]}},{"id":"q6","brand":"온결 리빙","title":"겨울 니트 룩북 카피","ch":"자사몰","camp":"겨울 아우터 기획전","who":"최하은","at":"12:30","text":"겨울 니트 입고 산책 가기 좋은 날. 부드러운 촉감과 넉넉한 핏으로 데일리룩 완성!","ind":"","flags":{},"r":{"ind":"gen","indName":"일반 상품 · 서비스","auto":true,"score":0,"decision":"clear","counts":{"high":0,"mid":0,"info":0},"findings":[],"labels":[]}},{"id":"q7","brand":"든든 헬스","title":"젤리 상세 수정안 v2","ch":"상세페이지","camp":"젤리 신제품 출시","who":"박선우","at":"12:05","text":"꾸준히 관리하는 분들을 위한 저칼로리 젤리. 1포 20kcal, 식이섬유 3g이 들어 있어요.","ind":"food","flags":{},"r":{"ind":"food","indName":"일반식품","auto":false,"score":0,"decision":"clear","counts":{"high":0,"mid":0,"info":0},"findings":[],"labels":[]}}];

  var ST = { wait: ['s-wait', '검토 대기'], ok: ['s-ok', '승인'], fix: ['s-hi', '수정 요청'], auto: ['s-ok', '자동 통과'] };
  QUEUE.forEach(function (q) { q.st = q.r.decision === 'clear' ? 'auto' : 'wait'; });
  var S = { view: 'overview', period: 2, sel: 'q1', live: null, intelSel: 0, intelF: 'all', ledger: null };

  var BR = { '숲결 뷰티': 't1', '든든 헬스': 't2', '온결 리빙': 't4', '밝은미소 치과': 't6' };
  var CAMP = [
    ['가을 수분 캠페인', '숲결 뷰티', 412, 64, 'mid', 9, '10.21'], ['젤리 신제품 출시', '든든 헬스', 286, 48, 'hi', 14, '10.24'],
    ['겨울 아우터 기획전', '온결 리빙', 530, 81, 'low', 3, '10.30'], ['치아 미백 이벤트', '밝은미소 치과', 96, 31, 'hi', 7, '10.19'], ['건강차 기획전', '든든 헬스', 174, 58, 'mid', 4, '11.02']
  ];
  var RISK = { hi: ['s-hi', '높음'], mid: ['s-wait', '주의'], low: ['s-ok', '낮음'] };
  var PERIOD = [['오늘', 1284, 62, 14, 9, 1231, '+6%'], ['7일', 8790, 60, 37, 63, 8516, '+11%'], ['30일', 12480, 61, 37, 112, 12311, '+18%']];

  var toastT = 0;
  function toast(msg) {
    var t = root.querySelector('.a4-toast'); if (!t) return;
    t.innerHTML = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  function stamp() { var d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (x) { return ('0' + x).slice(-2); }).join(':'); }
  function lgId() { var d = new Date(), h = ''; for (var i = 0; i < 4; i++) h += '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16)); return 'LG' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + h; }

  /* ---------- 틀 ---------- */
  root.innerHTML = '<div class="a4" role="application" aria-label="AIMarker 제품 데모(데모 데이터)">' +
    '<div class="a4-top"><span class="a4-logo">' + LOGO + '<b>AIMarker</b></span>' +
    '<button type="button" class="a4-ws" data-act="ws"><span class="a4-av">모</span><span><b>모아 애드</b><small>대행사 워크스페이스</small></span>' + ico(P.chev) + '</button>' +
    '<label class="a4-search">' + ico(P.search) + '<input type="search" placeholder="콘텐츠 · 캠페인 · 원장 번호 검색" aria-label="검색(데모)" data-act="search"></label>' +
    '<span class="a4-demo">데모 데이터</span><span class="a4-me" title="김지윤 · 검수 담당(데모)">지윤</span></div>' +
    '<div class="a4-body"><nav class="a4-nav" role="tablist" aria-label="메뉴">' +
    VIEWS.map(function (v) { return '<button type="button" role="tab" data-v="' + v[0] + '" aria-selected="' + (v[0] === S.view) + '">' + ico(v[3]) + '<span><b>' + v[1] + '</b><small>' + v[2] + '</small></span>' + (v[0] === 'risk' ? '<em data-wait></em>' : '') + '</button>'; }).join('') +
    '<div class="a4-nav-foot"><b>유료 파일럿 2026.12</b><span>기업 계정 · 팀 초대 · 역할 권한을 함께 엽니다</span></div></nav>' +
    '<div class="a4-main" id="a4main" role="tabpanel" tabindex="-1"></div></div><div class="a4-toast" role="status"></div></div>';
  var main = root.querySelector('#a4main');

  function waitN() { return QUEUE.filter(function (q) { return q.st === 'wait'; }).length; }
  function head(t, sub, right) { return '<div class="a4-h"><div><h3>' + t + '</h3>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right ? '<div class="a4-h-r">' + right + '</div>' : '') + '</div>'; }
  function tag(cls, t) { return '<span class="st ' + cls + '">' + esc(t) + '</span>'; }
  function stt(k, t) { return '<span class="stt ' + k + '">' + t + '</span>'; }

  /* ---------- 개요 ---------- */
  function vOverview() {
    var p = PERIOD[S.period];
    var weeks = [[520, 310, 120], [610, 330, 140], [700, 340, 150], [760, 360, 130], [840, 380, 140], [930, 370, 120], [1010, 390, 110], [1090, 400, 100]];
    var mx = 1700, w = 560, h = 170, bw = 40, gap = (w - 8 * bw) / 7;
    var bars = weeks.map(function (x, i) {
      var y = h, out = '', cols = ['#1F55F5', '#8FB0FF', '#F2B54A'];
      x.forEach(function (v, j) { var bh = v / mx * h; y -= bh; out += '<rect x="' + (i * (bw + gap)).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw + '" height="' + bh.toFixed(1) + '" rx="3" fill="' + cols[j] + '"/>'; });
      return out + '<text x="' + (i * (bw + gap) + bw / 2).toFixed(1) + '" y="' + (h + 16) + '" text-anchor="middle">' + (i + 1) + '주</text>';
    }).join('');
    return head('개요', '모아 애드 · 브랜드 4곳 · 진행 중 캠페인 5개',
      '<div class="a4-seg">' + PERIOD.map(function (x, i) { return '<button type="button" data-period="' + i + '" aria-pressed="' + (i === S.period) + '">' + x[0] + '</button>'; }).join('') + '</div><button type="button" class="a4-btn" data-act="export">' + ico(P.dl) + '보고서 내보내기</button>') +
      '<div class="a4-kpi">' +
      '<div><small>처리한 콘텐츠</small><b>' + n0(p[1]) + '</b><span class="up">' + p[6] + '</span></div>' +
      '<div><small>자동 처리율</small><b>' + p[2] + '%</b><span>사람 확인 없이 통과 · 수정</span></div>' +
      '<div><small>검토 대기</small><b>' + p[3] + '</b><span>평균 대기 2.1시간</span></div>' +
      '<div><small>높음 위험 후보</small><b>' + p[4] + '</b><span>고친 뒤 출고</span></div>' +
      '<div><small>원장 기록</small><b>' + n0(p[5]) + '</b><span>검증 실패 0건</span></div></div>' +
      '<div class="a4-grid2"><div class="a4-card"><div class="a4-card-h"><b>주간 처리 현황</b><span class="a4-lg"><i style="background:#1F55F5"></i>자동 통과<i style="background:#8FB0FF"></i>수정 후 통과<i style="background:#F2B54A"></i>검토 · 반려</span></div>' +
      '<svg class="a4-chart" viewBox="0 0 ' + w + ' ' + (h + 22) + '" role="img" aria-label="8주 동안 처리량이 늘고 자동 통과 비율이 커지는 막대 그래프(데모 데이터)">' + bars + '</svg></div>' +
      '<div class="a4-card"><div class="a4-card-h"><b>최근 활동</b></div><ul class="a4-act">' +
      '<li><i class="d ok"></i><span><b>광고주 승인</b> 숲결 뷰티 · 가을 수분크림 피드 v3<small>14:32 · 원장 LG261016-8F2A</small></span></li>' +
      '<li><i class="d hi"></i><span><b>수정 요청</b> 든든 헬스 · 다이어트 젤리 숏폼 자막<small>14:05 · 높음 4 · 검수 김지윤</small></span></li>' +
      '<li><i class="d"></i><span><b>외주 납품 등록</b> 리뷰랩 · 체험단 원고 12건<small>13:41 · 출처 확인 12건</small></span></li>' +
      '<li><i class="d pol"></i><span><b>정책 적용</b> KR-AdLaw 2026.10.15<small>10.15 · 검토 · 승인한 업데이트</small></span></li></ul></div></div>' +
      '<div class="a4-card"><div class="a4-card-h"><b>캠페인별 위험</b><small>자동 처리율이 낮고 높음 후보가 많은 캠페인부터</small></div>' +
      '<div class="a4-tw"><table class="a4-t"><thead><tr><th>캠페인</th><th>브랜드</th><th>콘텐츠</th><th>자동 처리</th><th>위험</th><th>대기</th><th>마감</th></tr></thead><tbody>' +
      CAMP.map(function (c) { return '<tr><td><b>' + c[0] + '</b></td><td>' + c[1] + '</td><td>' + c[2] + '</td><td><span class="a4-mini"><i style="width:' + c[3] + '%"></i></span>' + c[3] + '%</td><td>' + tag(RISK[c[4]][0], RISK[c[4]][1]) + '</td><td>' + c[5] + '</td><td>' + c[6] + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }

  /* ---------- 콘텐츠 분석 ---------- */
  var LV = { ok: ['s-done', '확인됨'], hi: ['s-hi', '가능성 높음'], chk: ['s-wait', '확인 필요'], unk: ['s-run0', '확인 불가'], cam: ['s-ok', '카메라 원본'] };
  var INTEL = [
    ['t5', 'AI 모델 화보 컷 04.png', '숲결 뷰티 · 외주 납품', '이미지', 'ok', ['C2PA 서명 기록', 'IPTC 디지털 출처: 생성형 AI'], '원본', 'AI 생성 · 표시 필요', 'C2PA 매니페스트와 IPTC digitalSourceType(trainedAlgorithmicMedia)이 함께 있어 AI 생성으로 확인됩니다. 광고에 쓰면 이미지 가까이에 \'AI 생성\' 표시와 파일 속 기록을 함께 넣습니다.'],
    ['t1', '수분크림 상세 배경.png', '숲결 뷰티 · 상세페이지', '이미지', 'hi', ['PNG 생성 설정값', '1024 × 1024'], '원본', 'AI 생성 · 표시 필요', 'PNG 안에 생성 설정값(프롬프트 · 샘플러)이 남아 있어 생성 도구로 만들었을 가능성이 높습니다. 크기도 생성 도구 기본값과 같습니다.'],
    ['t3', '루테인 제품 연출컷.jpg', '든든 헬스 · 디스플레이', '이미지', 'chk', ['편집 도구 기록', '기록 일부 지워짐'], '등록 콘텐츠와 92% 비슷', '확인 요청', '편집 도구 기록만 있고 생성 기록은 없습니다. 등록된 원본과 지각 해시가 92% 비슷해, 원본에서 크기 · 밝기를 바꾼 파생본으로 보입니다(지문 엔진 시연).'],
    ['t4', '트렌치코트 착용샷.webp', '온결 리빙 · 자사몰', '이미지', 'unk', ['메타데이터 없음'], '없음', '확인 불가', '파일 기록이 모두 지워져 있습니다. 기록이 없다고 AI를 사용하지 않았다는 뜻은 아니므로 \'확인 불가\'로 두고, 납품처에 제작 방식을 확인하도록 요청합니다.'],
    ['t6', '니트 소재 클로즈업.jpg', '온결 리빙 · 인스타그램', '이미지', 'cam', ['카메라 EXIF · 촬영 기기'], '원본', '표시 불필요', '촬영 기기 · 노출 값이 있는 카메라 원본입니다. AI 생성 표시가 필요하지 않습니다.'],
    ['t2', '가상 모델 보이스 광고.mp4', '숲결 뷰티 · 유튜브', '영상', 'ok', ['외주 납품 확인서', '가상인물 등장'], '원본', '[가상인물] 표시 필요', '납품 확인서에 AI 성우 · 가상 모델 사용이 적혀 있습니다. 2026.6.1부터 가상인물 추천 광고에는 \'가상인물\' 표시를 권합니다.'],
    ['t5', '체험단 원고 7번.docx', '숲결 뷰티 · 블로그', '문구', 'chk', ['외주 원고', '협찬 콘텐츠'], '비슷한 원고 1건', '협찬 표시 확인', '대가를 받은 원고입니다. 문구 검수에서 \'내돈내산\'과 협찬 표시 누락을 찾았습니다(위험 검토로 넘김).']
  ];
  function vIntel() {
    var F = [['all', '전체'], ['이미지', '이미지'], ['영상', '영상'], ['문구', '문구']];
    var rows = INTEL.map(function (r, i) { return [r, i]; }).filter(function (x) { return S.intelF === 'all' || x[0][3] === S.intelF; });
    if (!rows.some(function (x) { return x[1] === S.intelSel; }) && rows.length) S.intelSel = rows[0][1];
    var cur = INTEL[S.intelSel];
    return head('콘텐츠 분석', '외주 · 사내 · 연동 앱으로 들어온 콘텐츠의 출처와 생성 이력', '<div class="a4-seg">' + F.map(function (f) { return '<button type="button" data-if="' + f[0] + '" aria-pressed="' + (S.intelF === f[0]) + '">' + f[1] + '</button>'; }).join('') + '</div>') +
      '<div class="a4-split"><div class="a4-card a4-pad0"><div class="a4-tw"><table class="a4-t a4-click"><thead><tr><th>콘텐츠</th><th>유형</th><th>출처 신뢰</th><th>신호</th><th>계보 <span class="stt is-dev">개발 중</span></th></tr></thead><tbody>' +
      rows.map(function (x) { var r = x[0]; return '<tr data-intel="' + x[1] + '" class="' + (x[1] === S.intelSel ? 'is-sel' : '') + '" tabindex="0"><td><span class="a4-file"><span class="th ' + r[0] + '"></span><span><b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + '</small></span></span></td><td>' + r[3] + '</td><td>' + tag(LV[r[4]][0], LV[r[4]][1]) + '</td><td><span class="a4-sig">' + r[5].map(function (s) { return '<i>' + esc(s) + '</i>'; }).join('') + '</span></td><td>' + esc(r[6]) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>' +
      '<aside class="a4-card a4-side"><span class="a4-file"><span class="th ' + cur[0] + '"></span><span><b>' + esc(cur[1]) + '</b><small>' + esc(cur[2]) + '</small></span></span>' +
      '<div class="a4-kv"><div><span>출처 신뢰</span>' + tag(LV[cur[4]][0], LV[cur[4]][1]) + '</div><div><span>판단</span><b>' + esc(cur[7]) + '</b></div></div>' +
      '<p class="a4-why">' + esc(cur[8]) + '</p>' +
      '<div class="a4-lin"><b>' + ico(P.branch) + '콘텐츠 계보</b><span class="stt is-dev">개발 중 · 시연</span>' +
      '<ol><li><i></i>원본 등록 · 10.02</li>' + (cur[6].indexOf('%') > 0 ? '<li><i></i>크기 · 밝기 변경 · 10.09</li><li class="me"><i></i>이 파일 · 지각 해시 92% 일치</li>' : '<li class="me"><i></i>이 파일 · ' + esc(cur[6]) + '</li>') + '</ol></div>' +
      '<p class="a4-foot">' + ico(P.info) + '판별 점수만으로 AI 생성이라고 확정하지 않습니다. 파일 판독은 브라우저 안에서 합니다.</p></aside></div>';
  }

  /* ---------- 위험 검토 ---------- */
  function sum(r) {
    var d = U.DEC[r.decision] || U.DEC.clear, c = r.counts || { high: 0, mid: 0, info: 0 };
    return '<div class="a4-sum">' + U.ring(r.score, 56) + '<div><b class="dec ' + d.c + '">' + d.t + '</b><small>' + d.s + '</small><div class="cnt"><span class="sv high">높음 ' + c.high + '</span><span class="sv mid">주의 ' + c.mid + '</span>' + (c.info ? '<span class="sv info">참고 ' + c.info + '</span>' : '') + '<span class="sv ind">' + esc(r.indName || '') + (r.auto ? ' · 자동' : '') + '</span></div></div></div>';
  }
  function detail(text, r, opt) {
    opt = opt || {};
    var labels = (r.labels || []).map(function (l) { return '<div><span><b>붙일 표시</b> <code>' + esc(l.text) + '</code> · ' + esc(l.where) + '</span></div>'; }).join('');
    return sum(r) + '<div class="prev3 a4-prev">' + U.highlight(text, r.findings) + '</div>' +
      (labels ? '<div class="lbls3">' + labels + '</div>' : '') +
      '<div class="fdl">' + (r.findings.length ? r.findings.map(function (f, i) { return U.finding(f, i, { fix: !!opt.fix }); }).join('') : '<div class="chk-empty">' + ico(P.check) + '<b style="display:block;color:var(--ink)">큰 위험 후보가 없어요</b>근거 자료 · 표시 위치는 한 번 더 확인하세요.</div>') + '</div>';
  }
  function vRisk() {
    var q = QUEUE.filter(function (x) { return x.id === S.sel; })[0];
    var list = QUEUE.map(function (x) { var d = U.DEC[x.r.decision]; return '<button type="button" class="a4-q' + (x.id === S.sel && !S.live ? ' is-sel' : '') + '" data-q="' + x.id + '"><span class="a4-q-s">' + U.ring(x.r.score, 34) + '</span><span class="a4-q-m"><b>' + esc(x.title) + '</b><small>' + esc(x.brand) + ' · ' + esc(x.ch) + '</small><span>' + tag(ST[x.st][0], ST[x.st][1]) + '<em>' + d.t + '</em></span></span></button>'; }).join('');
    var right;
    if (S.live) {
      right = '<div class="a4-live"><div class="a4-live-h"><b>' + ico(P.zap) + '직접 검사 · 실제 엔진</b><span>문구는 검사에만 쓰고 저장하지 않습니다</span></div>' +
        '<textarea class="a4-ta" id="a4text" maxlength="3000" rows="3" placeholder="검사할 광고 · 상세페이지 · SNS 문구를 붙여 넣으세요">' + esc(S.live.text) + '</textarea>' +
        '<div class="a4-flags"><label><input type="checkbox" id="a4spon"' + (S.live.flags.sponsored ? ' checked' : '') + '><span>협찬 · 대가</span></label><label><input type="checkbox" id="a4person"' + (S.live.flags.aiPerson ? ' checked' : '') + '><span>AI 인물</span></label><label><input type="checkbox" id="a4media"' + (S.live.flags.aiMedia ? ' checked' : '') + '><span>AI 이미지</span></label>' +
        '<select id="a4ind" aria-label="업종"><option value="">업종 자동</option><option value="gen">일반</option><option value="food">일반식품</option><option value="hfood">건강기능식품</option><option value="cos">화장품</option><option value="med">의료</option><option value="fin">금융</option></select>' +
        '<button type="button" class="a4-btn pri" data-act="run">' + ico(P.search) + '<span>검사하기</span></button></div>' +
        '<div id="a4out">' + (S.live.r ? '<p class="a4-meta">실시간 결과 · ' + esc(S.live.r.pack.name + ' ' + S.live.r.pack.ver) + ' · 서버 ' + S.live.r.ms + 'ms</p>' + detail(S.live.text, S.live.r, { fix: true }) : S.live.err ? '<p class="a4-err">' + esc(S.live.err) + '</p>' : '<p class="a4-meta">업종은 글로 알아서 고릅니다. 약 3초 걸립니다.</p>') + '</div></div>';
    } else {
      right = '<div class="a4-d-h"><div><b>' + esc(q.title) + '</b><small>' + esc(q.brand) + ' · ' + esc(q.ch) + ' · ' + esc(q.camp) + ' · 올린 사람 ' + esc(q.who) + ' ' + q.at + '</small></div>' + tag(ST[q.st][0], ST[q.st][1]) + '</div>' +
        '<p class="a4-meta">실제 엔진 결과 · KR-AdLaw 2026.10.15 · 정책: ' + esc(q.brand) + ' 브랜드 가이드</p>' + detail(q.text, q.r) +
        '<div class="a4-acts">' + (q.st === 'wait' ? '<button type="button" class="a4-btn ok" data-act="approve">' + ico(P.check) + '승인하고 원장 기록</button><button type="button" class="a4-btn" data-act="reject">' + ico(P.x) + '수정 요청</button>' : '<span class="a4-done">' + (q.st === 'auto' ? '정책 기준에 맞아 자동 통과했습니다' : q.st === 'ok' ? '승인 완료 · 원장에 기록했습니다' : '담당자에게 수정을 요청했습니다') + '</span>') + '</div>';
    }
    return head('위험 검토', '판단이 필요한 콘텐츠만 모았습니다 · 검토 대기 ' + waitN() + '건', '<button type="button" class="a4-btn' + (S.live ? ' on' : '') + '" data-act="live">' + ico(P.zap) + '직접 검사 · 실제 엔진</button>') +
      '<div class="a4-split rv"><div class="a4-ql">' + list + '</div><div class="a4-card a4-d">' + right + '</div></div>';
  }

  /* ---------- 정책 센터 ---------- */
  var POL = {
    inds: [['gen', '일반 상품 · 서비스', 1], ['food', '일반식품', 1], ['hfood', '건강기능식품', 1], ['cos', '화장품', 1], ['med', '의료 · 병원', 1], ['fin', '금융 · 대출 · 투자', 0]],
    brand: { '숲결 뷰티': { ban: ['역대급', '피부과 추천', '최저가'], must: ['#광고', '[가상인물]'] }, '든든 헬스': { ban: ['다이어트', '약 대신'], must: ['건강기능식품 문구'] } },
    pb: '숲결 뷰티'
  };
  function vPolicy() {
    var b = POL.brand[POL.pb];
    return head('정책 센터', '업종 규칙 · 브랜드 정책 · 표시 기준 · 승인 체계를 한곳에서', '<span class="stt is-live">KR-AdLaw 2026.10.15 적용 중</span>') +
      '<div class="a4-grid2"><div class="a4-card"><div class="a4-card-h"><b>업종 규칙 팩</b><small>66항목 · 6개 범주 · 업종 자동 판별</small></div><ul class="a4-tg">' +
      POL.inds.map(function (x, i) { return '<li><span>' + x[1] + '</span><button type="button" class="a4-sw" role="switch" aria-checked="' + !!x[2] + '" data-ind="' + i + '"><i></i></button></li>'; }).join('') + '</ul>' +
      '<p class="a4-foot">' + ico(P.info) + '규정이 바뀌면 검토 · 승인한 정책 업데이트로만 반영합니다.</p></div>' +
      '<div class="a4-card"><div class="a4-card-h"><b>브랜드 정책</b><span class="a4-seg">' + Object.keys(POL.brand).map(function (k) { return '<button type="button" data-pb="' + k + '" aria-pressed="' + (k === POL.pb) + '">' + k + '</button>'; }).join('') + '</span></div>' +
      '<div class="a4-chips"><b>쓰지 않을 말</b>' + b.ban.map(function (w, i) { return '<span class="a4-chip x">' + esc(w) + '<button type="button" data-rm="ban:' + i + '" aria-label="' + esc(w) + ' 빼기">×</button></span>'; }).join('') + '<input class="a4-add" data-add="ban" placeholder="+ 추가" maxlength="20" aria-label="쓰지 않을 말 추가"></div>' +
      '<div class="a4-chips"><b>꼭 넣을 문구</b>' + b.must.map(function (w, i) { return '<span class="a4-chip m">' + esc(w) + '<button type="button" data-rm="must:' + i + '" aria-label="' + esc(w) + ' 빼기">×</button></span>'; }).join('') + '<input class="a4-add" data-add="must" placeholder="+ 추가" maxlength="20" aria-label="꼭 넣을 문구 추가"></div>' +
      '<p class="a4-foot">' + ico(P.info) + '브랜드 정책은 이 브랜드 검수에만 쓰고, 다른 고객 판정에 쓰지 않습니다.</p></div></div>' +
      '<div class="a4-grid2"><div class="a4-card"><div class="a4-card-h"><b>승인 체계</b><span class="stt is-dev">다단계 · 개발 중</span></div>' +
      '<ol class="a4-flow"><li><b>자동</b><span>위험 점수 20 미만 · 필수 표시 있음 → 자동 통과</span></li><li><b>담당자</b><span>주의 후보 확인 · 바꿀 말 적용</span></li><li><b>팀장</b><span>높음 후보 · 전문가 검토 권장</span></li><li><b>광고주</b><span>로그인 없는 링크로 승인 · 답 자동 반영</span></li></ol></div>' +
      '<div class="a4-card"><div class="a4-card-h"><b>나라별 기준</b></div><ul class="a4-cty">' +
      '<li><b>한국</b><span>표시광고법 · 업종별 광고 규제 · 추천 · 보증 심사지침 · AI기본법 제31조</span>' + stt('is-live', '운영 중') + '</li>' +
      '<li><b>일본</b><span>약기법(薬機法) 광고 표현 · 스텔스 마케팅 규제</span>' + stt('is-plan', '계획') + '</li>' +
      '<li><b>EU</b><span>AI Act 제50조 투명성 · 딥페이크 표시</span>' + stt('is-plan', '계획') + '</li></ul>' +
      '<div class="a4-ver"><b>정책 버전</b><span><code>2026.10.15</code> 금융 업종 판별 · 의료 환자 유인 표현 보강</span><span><code>2026.10.09</code> 협찬 · 가상인물 표시 검사 추가</span></div></div></div>';
  }

  /* ---------- 증거 원장 ---------- */
  var LED = [
    ['LG261016-8F2A', '승인', '가을 수분크림 피드 v3', '9f2c41d07be3a8c95d1e6f0b2a7c38e4d1f05b96a2e7c3d48b1f9e06a5c7d2e1', '14:32:08', '2026.10.15'],
    ['LG261016-71C0', '보고서', '숲결 뷰티 10월 2주 검수 보고서', '3b8e5a0f1c2d7e94a6b03f58e1d2c7a9b4e60f13d8c5a2b7e9f1d04c6a3b85e2', '11:05:41', '2026.10.15'],
    ['LG261015-D93B', '버전', '루테인 상세 상단 v2', 'c71a09e4b5d23f8a6e1c04b97d2f5a38e6b10c4d9f2a7e53b8c16d0e4f9a2b73', '18:47:12', '2026.10.15'],
    ['LG261015-0A4E', '승인', '겨울 니트 룩북 카피', '5e0d8b2c7f1a94e36b2d05c8a1f7e3b94d60a2c5e8f1b7d3a09c4e6b2f5d81a7', '16:20:55', '2026.10.15'],
    ['LG261014-6B17', '보고서', '든든 헬스 10월 1주 검수 보고서', 'a4c82e9f05b1d7e3c60a8f2b4d19e7c5a3f0b6d82e4c1a97f5b03d6e8c2a14f9', '09:12:30', '2026.10.09']
  ];
  function vLedger() {
    return head('증거 원장', '판단 근거 · 승인 · 정책 버전을 내용 대신 해시와 서버 시각으로 남깁니다', '<button type="button" class="a4-btn" data-act="pkg">' + ico(P.dl) + '감사 증거 패키지</button>') +
      '<div class="a4-split ld"><div class="a4-card a4-pad0"><div class="a4-tw"><table class="a4-t mono"><thead><tr><th>원장 번호</th><th>종류</th><th>대상</th><th>SHA-256</th><th>서버 시각</th><th>정책</th><th></th></tr></thead><tbody>' +
      LED.map(function (l) { return '<tr><td><b>' + l[0] + '</b></td><td>' + l[1] + '</td><td class="tx">' + esc(l[2]) + '</td><td><code title="' + l[3] + '">' + l[3].slice(0, 10) + '…' + l[3].slice(-6) + '</code></td><td>' + l[4] + '</td><td>' + l[5] + '</td><td>' + tag('s-ok', '검증됨') + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="a4-chain"><b>' + ico(P.branch) + '해시 체인</b>' + stt('is-dev', '개발 중') + '<span>앞 기록의 해시를 다음 기록에 이어, 한 줄만 바뀌어도 그 뒤 기록이 모두 어긋나게 합니다.</span></div></div>' +
      '<aside class="a4-card a4-side"><b class="a4-sh">해시로 확인해 보기</b><p class="a4-why">보고서나 승인 기록의 내용이 한 글자라도 바뀌면 해시가 완전히 달라집니다. 이 브라우저에서 실제로 계산합니다.</p>' +
      '<textarea class="a4-ta" id="a4hin" rows="3" maxlength="2000">숲결 뷰티 · 가을 수분크림 피드 v3 · 광고주 승인 · 2026-10-16 14:32</textarea>' +
      '<button type="button" class="a4-btn pri" data-act="hash">' + ico(P.zap) + '<span>SHA-256 계산</span></button><div id="a4hout" class="a4-hout"></div>' +
      '<p class="a4-foot">' + ico(P.info) + '공개된 원장 확인은 <a href="' + R + 'verify/">aimarker.kr/verify</a> 에서 누구나 합니다.</p></aside></div>';
  }

  /* ---------- 연동 ---------- */
  var INT = [
    ['REST API', '검수 · 일괄 검수 · 표시 문구 · 진단 · 승인 · 원장 8종', 'is-live', '운영 중', 'api'],
    ['MCP 서버', 'Claude · Cursor · VS Code 같은 AI 에이전트에 도구로 연결', 'is-live', '운영 중', 'mcp'],
    ['구글 시트 함수', '=AIMARKER(A2) 로 카피 수백 줄을 한 번에', 'is-live', '운영 중', 'sheet'],
    ['n8n · Make', 'HTTP 노드 하나로 게시 전 관문 만들기', 'is-live', '운영 중', 'n8n'],
    ['사이트 표시 스크립트', '코드 한 줄로 AI 이미지에 표시 자동', 'is-live', '운영 중', 'mjs'],
    ['SDK', 'JavaScript · Python 단일 파일', 'is-dev', '베타', 'sdk'],
    ['아임웹 앱', 'AI 활용 표시 앱 · 앱스토어 심사 중', 'is-dev', '심사 중', ''],
    ['Webhook', '검수 · 승인 · 원장 이벤트를 우리 시스템으로', 'is-dev', '개발 중', ''],
    ['SSO · SCIM', '기업 계정 · 역할 권한 연동(Enterprise)', 'is-plan', '계획', ''],
    ['쇼핑몰 · CMS', '카페24 · 워드프레스 업로드 단계 연동', 'is-plan', '계획', ''],
    ['알림', '슬랙 · 메일로 검토 요청 · 승인 알림', 'is-plan', '계획', '']
  ];
  var SNIP = {
    api: 'curl -sL -H \'Content-Type: text/plain\' \\\n  -d \'{"action":"am.check","key":"amk_…","text":"부작용 없는 크림"}\' \\\n  \'https://script.google.com/macros/s/…/exec\'',
    mcp: '{\n  "mcpServers": {\n    "aimarker": {\n      "command": "npx",\n      "args": ["-y", "https://aimarker.kr/mcp/aimarker-mcp-1.0.0.tgz"],\n      "env": { "AIMARKER_KEY": "amk_…" }\n    }\n  }\n}',
    sheet: '=AIMARKER(A2, "cos")\n→ 100점 · 전문가 검토 · 재생, 부작용 없',
    n8n: 'HTTP Request · POST · Body(text/plain)\n{"action":"am.batch","key":"amk_…","items":[…]}\n→ decision 이 fix · expert 면 담당자에게, clear 면 바로 게시',
    mjs: '<script src="https://aimarker.kr/m.js" data-name="우리 쇼핑몰" defer></script>',
    sdk: 'import { AIMarker } from \'./aimarker.mjs\';\nconst am = new AIMarker({ key: process.env.AIMARKER_KEY });\nconst r = await am.check(\'부작용 없는 크림\');'
  };
  var INTSEL = 'mcp';
  function vInt() {
    var k = INT.filter(function (x) { return x[4] === INTSEL; })[0] || INT[1];
    return head('연동', '이미 쓰는 시스템과 AI 에이전트에 같은 엔진을 붙입니다', '<span class="a4-key">API 키 <code>amk_••••3f2a</code><span class="a4-mini"><i style="width:43%"></i></span>오늘 128 / 300</span>') +
      '<div class="a4-split it"><div class="a4-ints">' + INT.map(function (x) { return '<button type="button" class="a4-int' + (x[4] === INTSEL ? ' is-sel' : '') + '"' + (x[4] ? ' data-int="' + x[4] + '"' : ' disabled') + '><b>' + x[0] + '</b><span>' + x[1] + '</span>' + stt(x[2], x[3]) + '</button>'; }).join('') + '</div>' +
      '<aside class="a4-card a4-side"><b class="a4-sh">' + k[0] + '</b><p class="a4-why">' + k[1] + '</p><pre class="a4-code">' + esc(SNIP[k[4]] || '') + '</pre><a class="a4-btn pri" href="' + R + 'developers/' + (k[4] === 'mcp' ? '#mcp' : '') + '">연동 문서 보기</a></aside></div>';
  }

  /* ---------- 분석 ---------- */
  function line(vals, w, h, color) {
    var mx = 100, st = w / (vals.length - 1);
    var pts = vals.map(function (v, i) { return (i * st).toFixed(1) + ',' + (h - v / mx * h).toFixed(1); }).join(' ');
    return '<polyline fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="' + pts + '"/>' + vals.map(function (v, i) { return i === vals.length - 1 ? '<circle cx="' + (i * st).toFixed(1) + '" cy="' + (h - v / mx * h).toFixed(1) + '" r="4" fill="' + color + '"/>' : ''; }).join('');
  }
  function vAna() {
    var auto = [38, 41, 44, 46, 49, 51, 53, 55, 57, 58, 60, 61];
    var cats = [['업종별 금지 · 과장', 54], ['추천 · 보증(협찬)', 18], ['AI 사용 표시', 12], ['가상인물', 8], ['저작권 · 초상권 단서', 5], ['브랜드 가이드', 3]];
    var top = [['부작용 없음 · 무해 단정', 212], ['최고 · 최초 · 1위', 168], ['먹기만 해도 · 체중 감량', 97], ['내돈내산 · 협찬 숨김', 74], ['재생 · 치료(화장품)', 61]];
    return head('분석', '자동 처리율 · 위험 유형 · 승인 시간의 변화', '<span class="tag-ex">데모 데이터</span>') +
      '<div class="a4-kpi k3"><div><small>자동 처리율</small><b>61%</b><span class="up">12주 전 38%</span></div><div><small>평균 승인 시간</small><b>4.1시간</b><span class="up">도입 전 26시간</span></div><div><small>줄인 검수 시간(추정)</small><b>318시간</b><span>이번 달</span></div></div>' +
      '<div class="a4-grid2"><div class="a4-card"><div class="a4-card-h"><b>자동 처리율 추이</b><small>12주</small></div><svg class="a4-chart" viewBox="0 0 520 170" role="img" aria-label="자동 처리율이 12주 동안 38%에서 61%로 오르는 선 그래프(데모 데이터)">' +
      [25, 50, 75].map(function (g) { return '<line x1="0" x2="520" y1="' + (160 - g * 1.5) + '" y2="' + (160 - g * 1.5) + '" stroke="#E3E8F2"/><text x="0" y="' + (156 - g * 1.5) + '">' + g + '%</text>'; }).join('') +
      '<g transform="translate(0,10)">' + line(auto, 510, 150, '#1F55F5') + '</g></svg></div>' +
      '<div class="a4-card"><div class="a4-card-h"><b>위험 유형</b><small>이번 달 후보 기준</small></div><ul class="a4-hb">' + cats.map(function (c) { return '<li><span>' + c[0] + '</span><i><s style="width:' + (c[1] / 54 * 100) + '%"></s></i><b>' + c[1] + '%</b></li>'; }).join('') + '</ul></div></div>' +
      '<div class="a4-card"><div class="a4-card-h"><b>자주 걸리는 표현</b><small>규칙별 후보 수</small></div><ol class="a4-rank">' + top.map(function (t, i) { return '<li><em>' + (i + 1) + '</em><span>' + t[0] + '</span><b>' + t[1] + '</b></li>'; }).join('') + '</ol></div>';
  }

  var RENDER = { overview: vOverview, intel: vIntel, risk: vRisk, policy: vPolicy, ledger: vLedger, int: vInt, ana: vAna };
  function render(focus) {
    main.innerHTML = RENDER[S.view]();
    var w = root.querySelector('[data-wait]'); if (w) w.textContent = waitN() || '';
    Array.prototype.forEach.call(root.querySelectorAll('.a4-nav button'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-v') === S.view ? 'true' : 'false'); });
    if (S.view === 'risk' && S.live) { var sel = root.querySelector('#a4ind'); if (sel) sel.value = S.live.ind || ''; }
    if (focus) main.focus({ preventScroll: true });
  }
  render();

  /* ---------- 동작 ---------- */
  function runLive() {
    var ta = root.querySelector('#a4text'); if (!ta) return;
    var text = ta.value.trim(); if (!text) { ta.focus(); return; }
    S.live.text = ta.value; S.live.ind = root.querySelector('#a4ind').value;
    S.live.flags = { sponsored: root.querySelector('#a4spon').checked, aiPerson: root.querySelector('#a4person').checked, aiMedia: root.querySelector('#a4media').checked };
    var out = root.querySelector('#a4out'), btn = root.querySelector('[data-act="run"]');
    out.innerHTML = '<p class="a4-meta"><span class="spin"></span> 업종 규칙 팩으로 검사하는 중…</p>'; btn.disabled = true;
    AM.call('am.check', { text: S.live.text, ind: S.live.ind, flags: S.live.flags, cid: U.cid() }, 25000).then(function (r) {
      if (!r || !r.ok) throw new Error(r && r.message || '지금은 검사하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      S.live.r = r; S.live.err = '';
    }).catch(function (e) { S.live.r = null; S.live.err = e.message || '지금은 검사하지 못했어요.'; }).then(function () { render(); });
  }
  root.addEventListener('click', function (e) {
    var t = e.target;
    var nav = t.closest('.a4-nav button'); if (nav) { S.view = nav.getAttribute('data-v'); render(true); return; }
    var per = t.closest('[data-period]'); if (per) { S.period = +per.getAttribute('data-period'); render(); return; }
    var q = t.closest('[data-q]'); if (q) { S.sel = q.getAttribute('data-q'); S.live = null; render(); return; }
    var itf = t.closest('[data-if]'); if (itf) { S.intelF = itf.getAttribute('data-if'); render(); return; }
    var irow = t.closest('[data-intel]'); if (irow) { S.intelSel = +irow.getAttribute('data-intel'); render(); return; }
    var pb = t.closest('[data-pb]'); if (pb) { POL.pb = pb.getAttribute('data-pb'); render(); return; }
    var ind = t.closest('[data-ind]'); if (ind) { var x = POL.inds[+ind.getAttribute('data-ind')]; x[2] = x[2] ? 0 : 1; render(); toast(x[1] + ' 규칙 팩을 ' + (x[2] ? '켰어요' : '껐어요') + ' <small>(데모)</small>'); return; }
    var rm = t.closest('[data-rm]'); if (rm) { var p2 = rm.getAttribute('data-rm').split(':'); POL.brand[POL.pb][p2[0]].splice(+p2[1], 1); render(); return; }
    var it = t.closest('[data-int]'); if (it) { INTSEL = it.getAttribute('data-int'); render(); return; }
    var fx = t.closest('[data-fix]');
    if (fx && S.live && S.live.r) { var pp = fx.getAttribute('data-fix').split(':'), f = S.live.r.findings[+pp[0]]; var nt = U.applyFix(S.live.text, f, f.reps[+pp[1]]); if (nt !== S.live.text) { root.querySelector('#a4text').value = nt; S.live.ind = S.live.ind || S.live.r.ind; runLive(); } return; }
    var mk = t.closest('mark[data-i]'); if (mk) { var el = main.querySelector('[data-f="' + mk.getAttribute('data-i') + '"]'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 1400); } return; }
    var a = t.closest('[data-act]'); if (!a) return;
    var act = a.getAttribute('data-act'), cur = QUEUE.filter(function (x) { return x.id === S.sel; })[0];
    if (act === 'approve' && cur) { cur.st = 'ok'; var id = lgId(); LED.unshift([id, '승인', cur.title, Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(32)), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''), stamp(), '2026.10.15']); render(); toast('승인하고 원장에 기록했어요 · <code>' + id + '</code> <small>(데모)</small>'); }
    else if (act === 'reject' && cur) { cur.st = 'fix'; render(); toast('담당자에게 수정을 요청했어요 <small>(데모)</small>'); }
    else if (act === 'live') { S.live = S.live ? null : { text: QUEUE[0].text, ind: '', flags: { aiPerson: true, aiMedia: true }, r: null }; render(); var ta = root.querySelector('#a4text'); if (ta) ta.focus(); }
    else if (act === 'run') runLive();
    else if (act === 'hash') {
      var v = root.querySelector('#a4hin').value, o = root.querySelector('#a4hout');
      U.sha256(v).then(function (h) { if (!h) { o.textContent = '이 브라우저는 해시 계산을 지원하지 않아요.'; return; } o.innerHTML = '<code>' + h + '</code><small>' + v.length + '자 · 한 글자만 바꿔 다시 계산해 보세요</small>'; });
    }
    else if (act === 'export') toast('데모에서는 보고서를 내보내지 않아요. <a href="' + R + 'app/">작업 공간</a>에서 실제로 만들 수 있어요');
    else if (act === 'pkg') toast('감사 증거 패키지는 개발 중이에요(2026.12 파일럿)');
    else if (act === 'ws') toast('데모 워크스페이스입니다. 기업 계정은 2026.12 파일럿에서 엽니다');
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('[data-intel]')) { S.intelSel = +e.target.getAttribute('data-intel'); render(); }
    if (e.key === 'Enter' && e.target.matches('.a4-add')) {
      var v = e.target.value.trim(); if (!v) return;
      POL.brand[POL.pb][e.target.getAttribute('data-add')].push(v.slice(0, 20)); render();
      var n = root.querySelector('.a4-add[data-add="' + e.target.getAttribute('data-add') + '"]'); if (n) n.focus();
    }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.closest('.a4-nav')) {
      e.preventDefault(); var i = VIEWS.findIndex(function (v) { return v[0] === S.view; }); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + VIEWS.length) % VIEWS.length; S.view = VIEWS[i][0]; render(); root.querySelector('.a4-nav button[data-v="' + S.view + '"]').focus();
    }
  });
  root.addEventListener('submit', function (e) { e.preventDefault(); });
})();
