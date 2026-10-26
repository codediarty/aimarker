# -*- coding: utf-8 -*-
# 13.8 기업용 검색 수요 안내 페이지 3개(GEO 세팅 · SEO 설정 · GEO 마케팅)를 _src/pages/ 에 만듭니다.
# 쓰는 법: python3 _src/tools/lp138g.py → python3 _src/build.py
# 페이지마다 /geo/ 와 같은 무료 AI 검색 노출 진단 도구(#gForm · #result, assets/geo.js)가 맨 위에 있습니다.
import os

HERE = os.path.dirname(os.path.abspath(__file__))

HEAD = """<!--
path: {path}
key: {key}
title: {title}
ogtitle: {ogtitle}
desc: {desc}
scripts: assets/geo.js
styles: assets/mark.css, assets/v6.css
selflabel: footer
-->
"""

HERO = """<section class="k-phero k-ph2" id="top" aria-labelledby="h1">
  <div class="k-wrap">
    <div>
      <p class="k-crumb"><a href="{{{{root}}}}">AIMarker</a>{{{{ico:chev}}}}<a href="{{{{root}}}}geo/">AI 검색 노출 최적화</a>{{{{ico:chev}}}}<span>{crumb}</span></p>
      <h1 class="k-h1" id="h1">{h1}</h1>
      <p class="k-lead">{lead}</p>
      <form class="k-url" id="gForm" role="search" aria-label="AI 검색 노출 진단" style="margin-top:28px;max-width:560px">
        <label class="k-sr" for="gUrl">진단할 주소</label>
        <input id="gUrl" name="url" type="text" inputmode="url" autocomplete="url" spellcheck="false" placeholder="사이트나 상품 페이지 주소(예: myshop.co.kr)" maxlength="300" required>
        <button class="k-btn k-btn-p" type="submit">{{{{ico:search}}}}무료로 진단하기</button>
      </form>
      <div class="k-hero-foot"><span>{{{{ico:lock}}}}공개된 페이지만 읽고 저장하지 않음</span><span>{{{{ico:clock}}}}10초 안팎</span><span>{{{{ico:check}}}}가입 없이 무료</span></div>
      <p class="k-small" style="margin-top:12px">해 보기 <button type="button" class="k-chip" data-ex="aimarker.kr">aimarker.kr</button> <button type="button" class="k-chip" data-ex="aimarker.kr/pricing/">요금 페이지</button></p>
      <div class="k-engines" aria-label="대상 AI 검색"><span>ChatGPT</span> <span>제미나이</span> <span>퍼플렉시티</span> <span>Claude</span> <span>네이버 AI 브리핑</span> <span>구글 AI 개요</span> <span>빙 코파일럿</span></div>
    </div>
    <div class="k-screen" aria-hidden="true">
      <div class="k-screen-bar"><i></i><i></i><i></i><span>aimarker.kr/geo/ 진단 결과</span><em class="k-ex">예시</em></div>
      <div class="k-screen-body">
        <div class="k-geo">
          <div class="k-geo-top"><div class="k-ring" style="--p:41"><b>41</b></div><div><b style="display:block;font-size:17px;font-weight:760">AI 검색 준비 41점</b><span class="k-small" style="color:var(--k-gray)">myshop.co.kr/product/123, 상품 페이지, 비어 있는 점수 +59</span></div></div>
          <div class="k-bars">
            <div class="k-bar"><span>AI 크롤러 접근</span><i><em class="lo" style="--w:50%"></em></i><b>10/20</b></div>
            <div class="k-bar"><span>구조화 데이터</span><i><em class="lo" style="--w:8%"></em></i><b>2/25</b></div>
            <div class="k-bar"><span>본문 가독성</span><i><em style="--w:70%"></em></i><b>14/20</b></div>
            <div class="k-bar"><span>질문과 답</span><i><em class="lo" style="--w:2%"></em></i><b>0/10</b></div>
          </div>
          <div class="k-rows">
            <div class="h"><span>고칠 거리</span><span></span><span>결과</span></div>
            <div><b>Product 구조화 데이터, 가격, 브랜드</b><span></span><span class="k-dot ok">코드 만듦</span></div>
            <div><b>Perplexity, Claude 검색 크롤러 허용</b><span></span><span class="k-dot ok">규칙 만듦</span></div>
            <div><b>llms.txt, 자주 묻는 질문 틀</b><span></span><span class="k-dot ok">초안 만듦</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="k-sec k-tight k-panel" id="result" hidden>
  <div class="k-wrap"><div class="gr6" id="gOut" aria-live="polite"></div></div>
</section>

{{{{inc:lp-links-b.inc}}}}

<section class="k-sec lp-ans" id="answer" aria-labelledby="ansT">
  <div class="k-wrap">
    <div class="lp-ans-b">
      <p class="lp-k">한 줄 답</p>
      <h2 class="k-h2" id="ansT">{ans_h}</h2>
      <p class="k-lead">{ans_p}</p>
      <ul class="lp-pts">{ans_pts}</ul>
    </div>
  </div>
</section>
"""

PACKAGES = """<section class="k-sec k-panel" id="packages" aria-labelledby="pkTitle">
  <div class="k-wrap">
    <div class="k-head-row"><div class="k-head"><h2 class="k-h2" id="pkTitle">{pk_h}</h2>
      <p class="k-lead">{pk_p}</p></div>
      <a class="k-btn k-btn-l" href="{{{{root}}}}pricing/#rates">토큰 가격표</a></div>
    {{{{tiers:geo}}}}
    <h3 class="k-h3" style="margin:48px 0 16px">세팅 뒤 꾸준히, 월 관리</h3>
    {{{{tiers:geocare:none}}}}
    <p class="k-small" style="margin-top:14px">1토큰은 100원이고 기업 상품은 부가세 별도입니다. 결제는 토큰 또는 운영사 성균관컨설팅 결제 페이지(카드 · 간편결제 · 계좌이체 · 세금계산서)에서 합니다. AI 검색 노출 최적화는 노출 순위를 약속하지 않습니다.</p>
  </div>
</section>
"""

FAQ = """<section class="k-sec" id="faq" aria-labelledby="fTitle">
  <div class="k-wrap">
    <div class="k-head"><h2 class="k-h2" id="fTitle">자주 묻는 질문</h2></div>
    <div class="k-faq">
{faq}
    </div>
  </div>
</section>

<section class="k-cta" aria-labelledby="ctaT">
  <div class="k-wrap k-cta-in">
    <div><h2 class="k-h2" id="ctaT">{cta_h}</h2><p class="k-lead">{cta_p}</p></div>
    <div>
      <form class="k-url" data-goto-geo role="search" aria-label="무료 AI 검색 노출 진단">
        <label class="k-sr" for="gUrl2">진단할 주소</label>
        <input id="gUrl2" name="url" type="text" inputmode="url" spellcheck="false" placeholder="myshop.co.kr/product/123" maxlength="300" required>
        <button class="k-btn k-btn-p" type="submit">무료로 진단하기</button>
      </form>
      <p class="k-small" style="margin-top:12px">{rel}</p>
    </div>
  </div>
</section>
"""


def faq_html(items):
    return "\n".join('      <details><summary>%s</summary><p>%s</p></details>' % (q, a) for q, a in items)


PAGES = [
{
 "path": "geo-setup/", "key": "geo-setup", "crumb": "GEO 세팅 · GEO 설정",
 "title": "GEO 세팅 · GEO 설정 · AI 검색 설정 | ChatGPT · 제미나이 · 네이버 AI 브리핑에 우리 회사가 나오게 하는 7가지 | AIMarker",
 "ogtitle": "GEO 세팅, 무엇을 설정해야 AI 검색에 나올까요 | AIMarker",
 "desc": "GEO(생성형 AI 검색 최적화) 세팅 · GEO 설정 · AI 검색 설정의 실제 항목 7가지: AI 크롤러 허용(robots.txt), 구조화 데이터(JSON-LD), llms.txt, 자주 묻는 질문, 본문 구조, 검색 엔진 등록, AI 답변 언급 모니터링. 주소 하나로 지금 상태를 무료로 진단하고, 직접 하거나 1회 세팅(1,990토큰부터, 1토큰 100원)으로 끝냅니다.",
 "h1": "GEO 세팅,<br>무엇을 설정하는 것일까요",
 "lead": "GEO(Generative Engine Optimization)는 ChatGPT · 제미나이 · 퍼플렉시티 · 네이버 AI 브리핑 · 구글 AI 개요가 우리 사이트를 찾고, 읽고, 믿고, 인용하도록 사이트를 설정하는 일입니다. 설정할 것은 일곱 가지이고, 주소 하나면 지금 몇 가지가 되어 있는지 바로 보입니다.",
 "ans_h": "GEO 설정은 이 일곱 가지입니다",
 "ans_p": "검색 엔진 최적화(SEO)가 '검색 결과 순위'를 위한 설정이라면, GEO 설정은 'AI 가 답을 만들 때 우리 자료를 가져다 쓰게' 하는 설정입니다. AI 는 크롤러로 읽을 수 있고, 구조가 분명하고, 믿을 근거가 있는 페이지를 인용합니다.",
 "ans_pts": ["① AI 크롤러 허용(robots.txt): GPTBot · ClaudeBot · PerplexityBot · Google-Extended · 네이버 등 17종을 막고 있지 않은지",
             "② 구조화 데이터(JSON-LD): 회사 · 상품 · 자주 묻는 질문을 기계가 읽는 형식으로",
             "③ llms.txt: AI 에게 주는 사이트 안내문 ④ 자주 묻는 질문: AI 가 그대로 인용하는 질문과 답",
             "⑤ 본문 구조: 제목 · 요약 문장 · 표 ⑥ 검색 엔진 등록: 네이버 서치어드바이저 · 구글 서치 콘솔 · 빙 ⑦ AI 답변 언급 모니터링"],
 "mid": """<section class="k-sec" id="checklist" aria-labelledby="ckT">
  <div class="k-wrap">
    <div class="k-head">
      <h2 class="k-h2" id="ckT">GEO 세팅 체크리스트 7가지</h2>
      <p class="k-lead">위에서부터 하나씩 확인하세요. 진단 도구는 이 일곱 가지를 100점으로 재고, 비어 있는 항목에는 붙여 넣을 코드까지 만들어 줍니다.</p>
    </div>
    <ol class="lp-tips">
      <li><b>AI 크롤러 허용</b><span>robots.txt 에서 GPTBot · ClaudeBot · PerplexityBot · Google-Extended · Bingbot · Yeti(네이버) 등 17종이 막혀 있지 않아야 합니다. 많은 사이트가 보안 플러그인이나 기본 설정 때문에 AI 크롤러를 막아 둔 채 'AI 검색에 왜 안 나오지'라고 묻습니다.</span></li>
      <li><b>구조화 데이터(JSON-LD)</b><span>Organization · Product · FAQPage · Article 을 schema.org 형식으로 넣습니다. AI 는 본문을 추측하기보다 구조화 데이터의 이름 · 가격 · 설명을 믿습니다.</span></li>
      <li><b>llms.txt</b><span>사이트 루트에 두는 AI 용 안내문입니다. 회사가 무엇을 하고, 어느 페이지에 무엇이 있는지 한 파일로 정리해 두면 AI 가 사이트를 요약할 때 그대로 씁니다.</span></li>
      <li><b>자주 묻는 질문</b><span>고객이 AI 에게 묻는 말투 그대로 질문을 적고, 두세 문장으로 바로 답합니다. AI 답변에 가장 자주 인용되는 형식입니다.</span></li>
      <li><b>본문 구조와 요약 문장</b><span>페이지마다 첫 문단에 '누가 · 무엇을 · 얼마에'가 들어간 요약 문장, 제목 단계(h1 → h2), 표와 목록. AI 는 긴 문단보다 구조가 보이는 글을 가져옵니다.</span></li>
      <li><b>검색 엔진 등록과 사이트맵</b><span>네이버 서치어드바이저 · 구글 서치 콘솔 · 빙 웹마스터에 사이트를 등록하고 sitemap.xml 을 제출합니다. 네이버 AI 브리핑과 빙 코파일럿은 각 검색 엔진 색인에서 출발합니다.</span></li>
      <li><b>AI 답변 언급 모니터링</b><span>고객이 물을 질문 20개를 ChatGPT · 제미나이 · 퍼플렉시티 · 네이버에 실제로 물어 우리 이름이 나오는지 매달 기록합니다. 설정이 됐는지는 이 숫자로 압니다.</span></li>
    </ol>
  </div>
</section>

<section class="k-sec" id="diy" aria-labelledby="diyT">
  <div class="k-wrap">
    <div class="k-head">
      <h2 class="k-h2" id="diyT">직접 할까요, 맡길까요</h2>
      <p class="k-lead">진단 결과의 '고칠 거리'는 붙여 넣을 코드로 드리니 개발자가 있으면 직접 해도 됩니다. 한 번에 끝내고 전후를 비교하고 싶으면 1회 세팅입니다.</p>
    </div>
    <div class="k-tbl-w">
      <table class="lp-tbl">
        <thead><tr><th scope="col">항목</th><th scope="col">직접 할 때</th><th scope="col">AIMarker 1회 세팅</th></tr></thead>
        <tbody>
          <tr><td>크롤러 · robots.txt</td><td>진단 결과의 규칙을 붙여 넣기(10분)</td><td>17종 점검과 설치, 설치 뒤 다시 진단</td></tr>
          <tr><td>구조화 데이터</td><td>페이지마다 JSON-LD 작성(페이지당 30분~)</td><td>회사 · 상품 기본부터 상품 500개 피드까지</td></tr>
          <tr><td>llms.txt · FAQ</td><td>초안을 받아 다듬기</td><td>AI 가 인용하는 질문 20개 작성 · 설치</td></tr>
          <tr><td>검색 엔진 등록</td><td>네이버 · 구글 · 빙 각각 가입 · 소유 확인</td><td>등록과 사이트맵 제출 대행</td></tr>
          <tr><td>효과 확인</td><td>직접 질문해 보기</td><td>첫 달 AI 답변 언급 리포트, 월 관리로 매달</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>""",
 "pk_h": "GEO 세팅, 1회로 끝내기",
 "pk_p": "라이트(1,990토큰)는 일곱 가지 기본 설정, 스탠다드(4,900토큰)는 질문 20개와 경쟁사 비교까지, 프로(14,900토큰)는 상품 피드와 원격 설치까지. 설치 뒤 다시 진단해 전후를 비교합니다.",
 "faq": [
  ("GEO 와 SEO 는 무엇이 다른가요?", "SEO(검색 엔진 최적화)는 검색 결과 목록에서 위에 오르는 일이고, GEO(생성형 AI 검색 최적화)는 AI 가 답을 만들 때 우리 자료를 인용하게 하는 일입니다. 겹치는 설정(사이트맵 · 구조화 데이터 · 제목 · 본문 구조)이 많아 GEO 세팅을 하면 SEO 기본도 함께 됩니다. 다른 점은 AI 크롤러 허용, llms.txt, 질문과 답, AI 답변 모니터링입니다. <a class=\"k-a\" href=\"{{root}}seo-setup/\">SEO 설정 · 세팅 안내</a>"),
  ("GEO 세팅을 하면 AI 검색에 꼭 나오나요?", "약속할 수 없습니다. AI 가 어떤 자료를 인용할지는 AI 회사의 모델과 그때그때의 질문에 달려 있습니다. AIMarker 가 하는 일은 AI 가 읽을 수 없거나 믿지 못해 빠지는 이유를 없애는 것이고, 결과는 AI 답변 언급 모니터링으로 매달 확인합니다."),
  ("우리 사이트가 AI 크롤러를 막고 있는지 어떻게 아나요?", "위 진단 도구에 주소를 넣으면 robots.txt 와 응답 헤더를 읽어 17종 크롤러별로 허용 · 차단을 보여 주고, 허용할 규칙을 만들어 줍니다. 아임웹 · 카페24 · 워드프레스 같은 플랫폼별 설치 자리도 안내합니다."),
  ("llms.txt 는 꼭 있어야 하나요?", "없어도 AI 가 사이트를 읽을 수는 있지만, 있으면 사이트 전체를 한 번에 정확히 요약합니다. 작성은 한 시간이면 되고 진단 도구가 초안을 만들어 줍니다. AIMarker 자신의 llms.txt 는 <a class=\"k-a\" href=\"{{root}}llms.txt\">여기</a>에서 볼 수 있습니다."),
  ("세팅 비용은 얼마이고 어떻게 내나요?", "라이트 1,990토큰 · 스탠다드 4,900토큰 · 프로 14,900토큰(1회, 1토큰 100원, 부가세 별도)이고 월 관리는 월 990토큰부터입니다. 기업 토큰(GEO 스타터 4,500토큰부터)을 충전해 세금계산서로 내거나, 운영사 성균관컨설팅 결제 페이지에서 카드로 바로 냅니다. <a class=\"k-a\" href=\"{{root}}pricing/#rates\">토큰 가격표</a>"),
  ("설치는 누가 하나요?", "라이트 · 스탠다드는 설치 코드와 파일을 드리고 설치 자리를 안내하며, 요청하면 원격으로 함께 설치합니다. 프로는 원격 설치까지 포함입니다. 설치 뒤 같은 기준으로 다시 진단해 전후 점수를 드립니다."),
 ],
 "cta_h": "지금 몇 가지가 되어 있는지, 주소 하나로",
 "cta_p": "10초 안에 일곱 가지 점수와 고칠 거리가 나옵니다. 가입 없이 무료이고, 공개된 페이지만 읽고 저장하지 않습니다.",
 "rel": "함께 보기: <a href=\"{{root}}seo-setup/\">SEO 설정 · 세팅</a> · <a href=\"{{root}}geo-marketing/\">GEO 마케팅</a> · <a href=\"{{root}}geo/\">AI 검색 노출 최적화 전체</a> · <a href=\"{{root}}pricing/#rates\">토큰 가격표</a>",
},
{
 "path": "seo-setup/", "key": "seo-setup", "crumb": "SEO 설정 · SEO 세팅",
 "title": "SEO 설정 · SEO 세팅 체크리스트 2026 | 검색 엔진 등록부터 AI 검색(GEO)까지 한 번에 | AIMarker",
 "ogtitle": "SEO 설정, 2026년에는 AI 검색까지 한 번에 | AIMarker",
 "desc": "SEO 설정 · SEO 세팅 체크리스트: 네이버 서치어드바이저 · 구글 서치 콘솔 등록, 사이트맵 · robots.txt, 제목 · 설명, 구조화 데이터, 모바일 · 속도, 그리고 2026년에 빠지면 안 되는 AI 검색(GEO) 설정. 주소 하나로 지금 상태를 무료로 진단하고, SEO 기본과 GEO 를 1회 세팅(1,990토큰부터)으로 함께 끝냅니다.",
 "h1": "SEO 설정,<br>이제 AI 검색까지 한 번에",
 "lead": "검색 결과 위에 오르는 SEO 설정과, AI 가 답할 때 우리 회사를 인용하게 하는 GEO 설정은 절반 이상 겹칩니다. 2026년의 SEO 세팅은 둘을 한 번에 합니다. 주소 하나로 지금 상태부터 보세요.",
 "ans_h": "SEO 설정 체크리스트, 한 줄로",
 "ans_p": "SEO 설정은 ① 검색 엔진에 사이트를 알리고(등록 · 사이트맵 · robots.txt) ② 페이지마다 무엇에 관한 글인지 분명히 하고(제목 · 설명 · 제목 단계 · 구조화 데이터) ③ 읽기 좋게(모바일 · 속도 · 내부 링크) 만드는 일입니다. 여기에 AI 크롤러 허용 · llms.txt · 질문과 답을 더하면 GEO 까지 됩니다.",
 "ans_pts": ["네이버 검색의 다섯 번에 한 번 이상은 AI 브리핑이 먼저 답합니다(CEO스코어데일리 2026.3.11). 순위만 보는 SEO 로는 이 답에 들어가지 못합니다.",
             "구글 AI 개요는 월 20억 명이 봅니다(TechCrunch 2025.7.23). 검색 결과 1위보다 AI 개요에 인용되는 쪽이 먼저 보입니다.",
             "AIMarker 의 1회 세팅은 SEO 기본(등록 · 사이트맵 · 제목 · 설명 · 구조화 데이터)과 GEO(크롤러 · llms.txt · FAQ · 모니터링)를 함께 합니다."],
 "mid": """<section class="k-sec" id="checklist" aria-labelledby="ckT">
  <div class="k-wrap">
    <div class="k-head">
      <h2 class="k-h2" id="ckT">SEO 세팅 체크리스트 10가지(2026)</h2>
      <p class="k-lead">1~7은 예전부터 하던 SEO 기본, 8~10은 2026년에 빠지면 안 되는 AI 검색 설정입니다. 진단 도구가 7영역 100점으로 재고 비어 있는 항목의 코드를 만들어 줍니다.</p>
    </div>
    <div class="k-tbl-w">
      <table class="lp-tbl">
        <thead><tr><th scope="col">#</th><th scope="col">설정</th><th scope="col">확인할 것</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>검색 엔진 등록</td><td>네이버 서치어드바이저 · 구글 서치 콘솔 · 빙 웹마스터에 사이트 등록과 소유 확인</td></tr>
          <tr><td>2</td><td>사이트맵 · robots.txt</td><td>sitemap.xml 제출, robots.txt 에서 중요한 페이지가 막혀 있지 않은지</td></tr>
          <tr><td>3</td><td>제목 · 설명</td><td>페이지마다 다른 제목(검색어 포함, 60자 안팎)과 설명(150자 안팎)</td></tr>
          <tr><td>4</td><td>제목 단계 · 본문 구조</td><td>h1 하나, h2 로 나눈 구획, 첫 문단에 요약 문장</td></tr>
          <tr><td>5</td><td>구조화 데이터</td><td>Organization · Product · FAQPage · BreadcrumbList(JSON-LD)</td></tr>
          <tr><td>6</td><td>모바일 · 속도</td><td>휴대폰에서 가로 넘침 없음, 이미지 크기, 첫 화면 2~3초 안</td></tr>
          <tr><td>7</td><td>내부 링크 · 표준 주소</td><td>관련 페이지끼리 연결, canonical, http → https</td></tr>
          <tr><td>8</td><td>AI 크롤러 허용</td><td>GPTBot · ClaudeBot · PerplexityBot · Google-Extended 등 17종</td></tr>
          <tr><td>9</td><td>llms.txt · 질문과 답</td><td>AI 용 사이트 안내문과 고객 말투의 FAQ</td></tr>
          <tr><td>10</td><td>AI 답변 모니터링</td><td>질문 20개를 AI 네 곳에 물어 우리 이름이 나오는지 매달 기록</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="k-sec" id="vs" aria-labelledby="vsT">
  <div class="k-wrap">
    <div class="k-head">
      <h2 class="k-h2" id="vsT">SEO 와 GEO, 무엇이 같고 무엇이 다른가</h2>
      <p class="k-lead">같은 설정으로 둘 다 좋아지는 것이 많습니다. 다른 것은 'AI 가 가져다 쓰기 좋은 형태'를 더하는 일입니다.</p>
    </div>
    <div class="k-cols lp-cols">
      <div class="k-col"><h4>같은 것</h4><p>사이트맵 · robots.txt · 제목과 설명 · 제목 단계 · 구조화 데이터 · 모바일 · 속도 · 내부 링크. SEO 기본이 안 되어 있으면 GEO 도 안 됩니다.</p></div>
      <div class="k-col"><h4>GEO 에서 더하는 것</h4><p>AI 크롤러 허용(SEO 는 검색 크롤러만 봄), llms.txt, 질문과 답, 첫 문단 요약 문장, 출처 · 사업자 정보 같은 신뢰 신호, AI 답변 모니터링.</p></div>
      <div class="k-col"><h4>보는 숫자</h4><p>SEO 는 순위와 클릭, GEO 는 'AI 답변에 우리 이름이 몇 번 나오나'. AIMarker 월 관리는 질문 20개를 매달 물어 이 숫자를 기록합니다.</p></div>
      <div class="k-col"><h4>한 번에 하는 법</h4><p>AIMarker 1회 세팅은 1~10을 함께 합니다. 라이트 1,990토큰(페이지 10개), 스탠다드 4,900토큰(질문 20개 · 경쟁사 비교), 프로 14,900토큰(상품 500개 · 원격 설치).</p></div>
    </div>
  </div>
</section>""",
 "pk_h": "SEO 기본과 GEO 를 한 번에, 1회 세팅",
 "pk_p": "검색 엔진 등록과 사이트맵 제출 대행, 제목 · 설명 다듬기, 구조화 데이터, AI 크롤러 · llms.txt · FAQ 까지. 설치 뒤 다시 진단해 전후를 비교합니다.",
 "faq": [
  ("SEO 설정을 직접 하려면 어디서부터 하나요?", "네이버 서치어드바이저와 구글 서치 콘솔에 사이트를 등록하고 sitemap.xml 을 제출하는 것이 먼저입니다. 그다음 페이지 제목 · 설명을 검색어가 들어가게 다듬고, 위 진단 도구로 구조화 데이터와 AI 크롤러 상태를 확인하세요. 비어 있는 항목은 붙여 넣을 코드를 만들어 드립니다."),
  ("아임웹 · 카페24 · 워드프레스 사이트도 되나요?", "됩니다. 플랫폼마다 코드를 넣는 자리(머리 코드 · 푸터 코드 · robots.txt 설정)가 달라 진단 결과에서 플랫폼별 설치 자리를 안내하고, 1회 세팅에서는 저희가 함께 넣습니다."),
  ("SEO 세팅을 하면 네이버 · 구글 1위가 되나요?", "순위는 약속할 수 없습니다. 검색 엔진과 AI 의 기준은 계속 바뀌고 경쟁 사이트도 있습니다. AIMarker 가 하는 일은 검색 엔진과 AI 가 우리 페이지를 못 읽거나 못 믿어서 빠지는 이유를 없애는 것이고, 결과는 서치 콘솔 지표와 AI 답변 언급 리포트로 확인합니다."),
  ("블로그 · 유튜브 같은 콘텐츠 마케팅과는 어떻게 다른가요?", "SEO · GEO 설정은 '그릇'을 고치는 일이고 콘텐츠는 '담는 내용'입니다. 그릇이 깨져 있으면 좋은 글도 AI 와 검색 엔진에 닿지 않습니다. 월 관리 '성장'에는 AI 가 인용하기 좋은 글 매달 2편이 들어 있습니다."),
  ("비용은 얼마인가요?", "1회 세팅 라이트 1,990토큰 · 스탠다드 4,900토큰 · 프로 14,900토큰(1토큰 100원, 부가세 별도), 월 관리 990토큰 · 2,900토큰. 기업 토큰을 충전해 세금계산서로 내거나 운영사 성균관컨설팅 결제 페이지에서 카드로 바로 냅니다. <a class=\"k-a\" href=\"{{root}}pricing/#rates\">토큰 가격표</a>"),
  ("진단은 무엇을 보나요?", "AI 크롤러 접근 · 구조화 데이터 · 본문 가독성 · 메타 정보 · 질문과 답 · 이미지 · 신뢰 신호 일곱 영역을 100점으로 잽니다. 공개된 페이지만 읽고 저장하지 않으며, 같은 주소는 6시간 안에 같은 결과를 줍니다."),
 ],
 "cta_h": "SEO 점수, 주소 하나로 지금",
 "cta_p": "10초 안에 일곱 영역 점수와 고칠 거리가 나옵니다. 가입 없이 무료이고, 공개된 페이지만 읽고 저장하지 않습니다.",
 "rel": "함께 보기: <a href=\"{{root}}geo-setup/\">GEO 세팅 · 설정</a> · <a href=\"{{root}}geo-marketing/\">GEO 마케팅</a> · <a href=\"{{root}}geo/\">AI 검색 노출 최적화 전체</a> · <a href=\"{{root}}pricing/#rates\">토큰 가격표</a>",
},
{
 "path": "geo-marketing/", "key": "geo-marketing", "crumb": "GEO 마케팅",
 "title": "GEO 마케팅 · AI 검색 마케팅 | AI 가 추천하는 회사가 되는 법, 무료 진단부터 월 관리까지 | AIMarker",
 "ogtitle": "GEO 마케팅, 광고가 아니라 AI 의 추천을 받는 일 | AIMarker",
 "desc": "GEO 마케팅(AI 검색 마케팅)은 광고를 사는 것이 아니라 ChatGPT · 제미나이 · 퍼플렉시티 · 네이버 AI 브리핑이 우리 회사를 답에 넣도록 사이트와 콘텐츠를 갖추는 일입니다. 왜 지금인지(구글 AI 개요 월 20억 명, 네이버 AI 브리핑 20%+, AI 경유 방문 693% 증가), 무엇을 하는지, 매달 어떻게 재는지. 주소 하나로 무료 진단.",
 "h1": "GEO 마케팅,<br>AI 가 우리를 추천하게",
 "lead": "고객이 검색창 대신 AI 에게 묻는 시대의 마케팅입니다. 광고 자리를 사는 것이 아니라, AI 가 답을 만들 때 우리 회사를 가져다 쓰도록 사이트와 콘텐츠를 갖추고 매달 결과를 잽니다. 주소 하나로 지금 상태부터 보세요.",
 "ans_h": "GEO 마케팅은 무엇을 하는 일인가요?",
 "ans_p": "세 가지입니다. ① 세팅: AI 가 읽고 믿을 수 있게 사이트를 고칩니다(크롤러 · 구조화 데이터 · llms.txt · FAQ). ② 콘텐츠: 고객이 AI 에게 묻는 질문에 바로 답하는 글을 만듭니다. ③ 측정: 질문 20개를 AI 네 곳에 매달 물어 우리 이름이 나오는지 기록하고 다음 달 할 일을 정합니다.",
 "ans_pts": ["구글 AI 개요는 월 20억 명이 봅니다(TechCrunch 2025.7.23). 네이버 검색도 다섯 번에 한 번 이상은 AI 브리핑이 답합니다(CEO스코어데일리 2026.3.11).",
             "AI 를 거쳐 들어온 소매 사이트 방문은 1년 새 693% 늘었고 구매 전환은 31% 더 높았습니다(Adobe 2026.1.12).",
             "AI 의 추천은 돈으로 살 수 없습니다. 읽을 수 있고, 믿을 수 있고, 질문에 바로 답하는 사이트가 인용됩니다."],
 "mid": """<section class="k-sec" id="why" aria-labelledby="whyT">
  <div class="k-wrap">
    <div class="k-head">
      <h2 class="k-h2" id="whyT">검색 광고와 GEO 마케팅, 무엇이 다른가</h2>
      <p class="k-lead">광고는 멈추면 끝나고, GEO 는 한 번 갖추면 AI 가 계속 가져다 씁니다. 대신 '자리를 산다'는 개념이 없어 사이트와 콘텐츠로 증명해야 합니다.</p>
    </div>
    <div class="k-tbl-w">
      <table class="lp-tbl">
        <thead><tr><th scope="col">무엇을</th><th scope="col">검색 광고</th><th scope="col">GEO 마케팅</th></tr></thead>
        <tbody>
          <tr><td>노출되는 곳</td><td>검색 결과 위 광고 칸</td><td>AI 의 답변 본문과 출처 목록</td></tr>
          <tr><td>비용 구조</td><td>클릭마다 과금, 멈추면 노출도 멈춤</td><td>1회 세팅 + 월 관리, 갖춘 것은 남음</td></tr>
          <tr><td>고객이 보는 것</td><td>'광고' 표시가 붙은 링크</td><td>AI 가 추천하는 회사로 소개</td></tr>
          <tr><td>필요한 것</td><td>예산과 입찰</td><td>읽을 수 있는 사이트, 믿을 근거, 질문에 답하는 글</td></tr>
          <tr><td>측정</td><td>클릭 · 전환</td><td>AI 답변 언급 횟수 · AI 경유 방문 · 전환</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="k-sec" id="flow" aria-labelledby="flT">
  <div class="k-wrap">
    <div class="k-head">
      <h2 class="k-h2" id="flT">GEO 마케팅은 이렇게 돌아갑니다</h2>
      <p class="k-lead">진단 → 세팅 → 콘텐츠 → 측정의 한 달 주기입니다. 첫 달은 세팅이 대부분이고, 둘째 달부터 콘텐츠와 측정이 돕니다.</p>
    </div>
    <ol class="lp-tips">
      <li><b>무료 진단으로 출발점을 잽니다</b><span>주소 하나로 7영역 100점과 고칠 거리를 받습니다. 경쟁사 1~3곳과 나란히 비교하면 어디서 벌어지는지 보입니다.</span></li>
      <li><b>1회 세팅으로 그릇을 고칩니다</b><span>AI 크롤러 허용, 구조화 데이터, llms.txt, 자주 묻는 질문 20개, 제목 · 설명, 검색 엔진 등록. 설치 뒤 다시 진단해 전후를 비교합니다.</span></li>
      <li><b>AI 가 인용하기 좋은 글을 만듭니다</b><span>고객이 AI 에게 묻는 질문을 모아 바로 답하는 글을 매달 2편(월 관리 '성장'). 상품이 있으면 AI 쇼핑 상품 피드도 갱신합니다.</span></li>
      <li><b>매달 잽니다</b><span>질문 20개를 ChatGPT · 제미나이 · 퍼플렉시티 · 네이버에 물어 우리 이름이 나오는지 기록하고, 크롤러 변화를 알리고, 다음 달 할 일을 정합니다.</span></li>
    </ol>
  </div>
</section>""",
 "pk_h": "GEO 마케팅, 세팅부터 월 관리까지",
 "pk_p": "1회 세팅으로 시작하고, AI 검색 관리(월 990토큰) 또는 성장(월 2,900토큰, 글 2편 · 경쟁사 추적)으로 이어 갑니다. 설치 뒤 다시 진단해 전후를 비교합니다.",
 "faq": [
  ("GEO 마케팅을 하면 AI 가 우리를 꼭 추천하나요?", "약속할 수 없습니다. AI 의 답은 모델과 질문에 따라 바뀝니다. 할 수 있는 일은 AI 가 우리를 못 읽거나 못 믿어서 빠지는 이유를 없애고, 고객의 질문에 바로 답하는 자료를 갖추고, 매달 재서 고치는 것입니다. 그래서 AIMarker 는 '노출 보장' 대신 'AI 답변 언급 리포트'를 드립니다."),
  ("어떤 업종에 효과가 큰가요?", "고객이 '어디가 좋아?', '어떻게 해?'라고 AI 에게 묻는 업종입니다. 쇼핑몰 · 지역 서비스(병원 · 학원 · 인테리어) · 전문 서비스(법률 · 세무 · 컨설팅) · B2B 소프트웨어. 경쟁사가 아직 GEO 를 안 했을수록 먼저 인용될 여지가 큽니다."),
  ("기존 SEO 대행이나 광고 대행과 같이 해도 되나요?", "됩니다. GEO 세팅은 사이트의 구조와 데이터를 고치는 일이라 광고 · 콘텐츠 대행과 부딪히지 않습니다. 대행사가 있으면 진단 결과의 고칠 거리를 그대로 전달해 설치를 맡겨도 됩니다."),
  ("효과는 언제 보이나요?", "크롤러 허용 · 구조화 데이터 같은 설정은 AI 가 다시 읽는 몇 주 안에 반영되고, AI 답변에 이름이 나오는 것은 콘텐츠와 신뢰 신호가 쌓이는 두세 달 뒤부터 달라지는 경우가 많습니다. 월 관리 리포트로 매달 숫자를 봅니다."),
  ("비용은 얼마인가요?", "1회 세팅 라이트 1,990토큰 · 스탠다드 4,900토큰 · 프로 14,900토큰, 월 관리 990토큰 · 2,900토큰(1토큰 100원, 부가세 별도). 기업 토큰(GEO 스타터 4,500토큰 20만 원부터)을 충전해 세금계산서로 내거나 운영사 성균관컨설팅 결제 페이지에서 카드로 냅니다. <a class=\"k-a\" href=\"{{root}}pricing/#rates\">토큰 가격표</a>"),
  ("AI 가 우리 상품 이미지를 가져다 쓸 때 표시는 어떻게 하나요?", "AI 로 만든 상세 이미지에는 <a class=\"k-a\" href=\"{{root}}label/\">AI 마킹</a>으로 코드 한 줄에 AI 마크를 붙이고, AI 검색에는 상품 피드로 정확한 정보를 줍니다. 둘 다 같은 기업 토큰으로 씁니다."),
 ],
 "cta_h": "AI 가 지금 우리를 어떻게 보는지, 주소 하나로",
 "cta_p": "10초 안에 7영역 점수와 고칠 거리가 나옵니다. 가입 없이 무료이고, 공개된 페이지만 읽고 저장하지 않습니다.",
 "rel": "함께 보기: <a href=\"{{root}}geo-setup/\">GEO 세팅 · 설정</a> · <a href=\"{{root}}seo-setup/\">SEO 설정 · 세팅</a> · <a href=\"{{root}}geo/\">AI 검색 노출 최적화 전체</a> · <a href=\"{{root}}business/\">기업용 한눈에</a>",
},
]


def main():
    out = os.path.join(HERE, "..", "pages")
    for p in PAGES:
        body = HEAD.format(**p) + HERO.format(crumb=p["crumb"], h1=p["h1"], lead=p["lead"], ans_h=p["ans_h"], ans_p=p["ans_p"],
                                              ans_pts="".join("<li>%s</li>" % x for x in p["ans_pts"]))
        body += "\n" + p["mid"] + "\n\n" + PACKAGES.format(pk_h=p["pk_h"], pk_p=p["pk_p"]) + "\n"
        body += FAQ.format(faq=faq_html(p["faq"]), cta_h=p["cta_h"], cta_p=p["cta_p"], rel=p["rel"])
        fn = os.path.join(out, p["key"] + ".html")
        with open(fn, "w", encoding="utf-8") as f:
            f.write(body)
        print("wrote", os.path.relpath(fn, os.path.join(HERE, "..", "..")), len(body))


if __name__ == "__main__":
    main()
