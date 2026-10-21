# -*- coding: utf-8 -*-
"""AIMarker(aimarker.kr) 정적 사이트 만들기.
_src/pages/*.html 의 본문에 공통 머리 · 머리글 · 바닥글을 씌워 저장소 루트에 페이지를 씁니다.

    python3 _src/build.py

페이지 파일 첫머리 주석에 정보를 적습니다.
<!--
path: site/            (저장소 안 위치, 루트는 빈 값)
key: site              (메뉴 강조)
title: 페이지 제목
desc: 설명(검색 · 공유용)
scripts: assets/site.js (쉼표로 여러 개, 루트 기준)
-->
본문에서 {{root}} 는 루트까지의 상대 경로, {{ico:이름}} 은 아이콘, {{logo}} 는 로고로 바뀝니다.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VER = "20261021c"
TODAY = "2026-10-20"
# 운영사 정보(skkc.co.kr 바닥글과 같게, 비어 있는 칸은 표시하지 않음)
BIZ = {"name": "성균관컨설팅", "ceo": "이채연", "no": "272-32-01885", "addr": "연구실 경기도 수원시 장안구 서부로 2066 성균관대학교 브릿지팩토리", "mail": "contact@skkc.co.kr", "tel": "", "ecom": "제2026-경기송탄-0622"}
SITE = "https://aimarker.kr/"

# ---------- 10.0 상품 · 요금(한 곳에서 관리: 요금 칸 {{tiers:키}} · 결제 시트 assets/products.js) ----------
# 결제는 공식 결제처 성균관컨설팅(skkc.co.kr) 쇼핑몰. 상품을 등록하면 SHOP_IDX 에 상품 번호를 적으세요(비어 있으면 '결제 링크 받기'로 주문 요청).
SHOP_URL = "https://skkc.co.kr/shop_view?idx=%s&kaiec_buy=1"
SHOP_IDX = {
    "label-standard-m": "", "label-standard-y": "", "label-business-m": "", "label-business-y": "",
    "geo-lite": "", "geo-standard": "", "geo-pro": "", "geocare-care-m": "", "geocare-grow-m": "",
    "service-starter-m": "", "bundle-trust": "",
    # 12.1 크레딧(개인 c3 · c10 · c30 · c50 은 AI 휴머나이징 충전 창, 기업 credit-* 는 결제 시트). 비어 있으면 결제 안내 메일로
    "c3": "", "c10": "", "c30": "", "c50": "", "credit-b10": "", "credit-b30": "", "credit-b100": "",
}
CATALOG = {
    "label": {"name": "AI 표시 자동화", "vat": "부가세 별도", "tiers": [
        {"id": "label-free", "name": "무료", "who": "개인 · 1인 사이트", "price": "0원", "note": "사이트 1개까지", "per": "", "cta": "무료로 시작", "href": "site/",
         "feat": ["코드 한 줄로 사이트 속 AI 이미지 · 영상 · 글 자동 표시", "지문 마크와 근거 창, AI 활용 안내 창", "점검 모드: 무엇을 왜 표시했는지 한눈에", "검색 · AI가 읽는 표시(구조화 데이터) 자동", "생성물 지문 마크와 서명 마크(웹 도구) 무료"]},
        {"id": "label-standard", "name": "스탠다드", "who": "1인 사업자 · 소상공인", "price": "9,900원", "per": "월", "m": 9900, "y": 99000,
         "feat": ["무료의 모든 기능", "AIMarker 등록 사이트: 확인 페이지에 회사와 담당자 표시", "안내 창에 문의처와 등록 확인 링크", "매달 AI 표시 현황 메일 리포트", "서명 마크에 회사 이름과 등록 사이트 표시", "설치 도움 1회(원격)"]},
        {"id": "label-business", "name": "비즈니스", "who": "소규모 · 중견 기업", "price": "49,000원", "per": "월", "m": 49000, "y": 490000, "best": "추천",
         "feat": ["스탠다드의 모든 기능, 사이트 3개", "위치 규칙 설정 대행(상세페이지 · 배너 · 블로그)", "표시 누락 점검 매주, 새 AI 콘텐츠 알림", "AI 활용 고지문과 사내 AI 표시 가이드", "API로 서명 마크 대량 발급, 감사 기록과 분기 보고서", "API 키(하루 1만 회), 담당자 온라인 교육 1회"]},
        {"id": "label-enterprise", "name": "엔터프라이즈", "who": "대기업 · 공공기관 · 학교", "price": "견적", "note": "월 30만 원부터", "per": "", "cta": "견적 받기", "href": "contact/?plan=label-enterprise&type=enterprise",
         "feat": ["사이트 · 건수 제한 없음", "우리 브랜드로 표시(화이트 라벨)", "전용 규칙과 내부 시스템 연동(API · MCP · 대량 처리)", "보안 검토, 계약서 · 세금계산서, 서비스 수준 협약", "표시 정책 수립과 임직원 교육"]},
    ]},
    "service": {"name": "AI 서비스 표시 의무 대응", "vat": "부가세 별도", "tiers": [
        {"id": "service-starter", "name": "스타터", "who": "생성형 AI 서비스를 막 시작한 곳", "price": "99,000원", "per": "월", "m": 99000,
         "feat": ["결과물마다 서명된 AIMarker 마크(월 1만 건)", "파일 속 출처 기록(IPTC · XMP)과 보이는 지문 마크", "이용자 사전 고지 문구와 약관 문안", "다운로드할 때 한 번 안내하는 창", "이메일 지원"]},
        {"id": "service-growth", "name": "그로스", "who": "이용자가 빠르게 느는 서비스", "price": "490,000원", "per": "월", "best": "추천", "cta": "도입 상담", "href": "contact/?plan=service-growth&type=ai",
         "feat": ["서명된 마크 월 10만 건", "AI기본법 제31조 표시 정책 문서", "실제와 헷갈리는 결과물(딥페이크) 보이는 표시 규칙", "감사 기록과 분기 보고서", "기술 지원(영업일 당일 답변)"]},
        {"id": "service-enterprise", "name": "엔터프라이즈", "who": "대형 플랫폼 · 기관", "price": "견적", "note": "처리 건수와 설치 방식에 맞춰", "per": "", "cta": "견적 받기", "href": "contact/?plan=service-enterprise&type=ai",
         "feat": ["대량 처리와 전용 한도", "사내 설치형 판정 엔진 라이선스", "보안 검토와 서비스 수준 협약", "넘는 건수는 1,000건 단위로 정산"]},
    ]},
    "geo": {"name": "AI 검색 노출 최적화", "vat": "부가세 별도, 1회", "tiers": [
        {"id": "geo-lite", "name": "라이트", "who": "1인 · 소상공인, 페이지 10개까지", "price": "199,000원", "per": "1회", "m": 199000,
         "feat": ["AI 검색 노출 진단 리포트(100점, 7영역)", "AI 크롤러 출입 설정(ChatGPT · Claude · Perplexity · 구글 · 네이버 등 17종)", "구조화 데이터(회사 · 상품 기본) 설치", "llms.txt 작성과 등록", "네이버 서치어드바이저 · 구글 서치 콘솔 등록, 사이트맵 제출", "설치 뒤 다시 진단, 전후 비교"]},
        {"id": "geo-standard", "name": "스탠다드", "who": "소규모 기업, 페이지 30개까지", "price": "490,000원", "per": "1회", "m": 490000, "best": "추천",
         "feat": ["라이트의 모든 것", "AI가 인용하는 자주 묻는 질문 20개 작성 · 설치", "페이지별 제목 · 설명 · 요약 문장 다듬기", "경쟁사 1곳과 나란히 비교", "빙 웹마스터 등록, 브랜드 정보 한 줄로 맞추기", "첫 달 AI 답변 언급 리포트"]},
        {"id": "geo-pro", "name": "프로", "who": "쇼핑몰 · 중견 기업, 페이지 100개 · 상품 500개", "price": "1,490,000원", "per": "1회", "m": 1490000,
         "feat": ["스탠다드의 모든 것", "상품 구조화 데이터와 AI 쇼핑 상품 피드", "가격 · 재고 · 리뷰 정보 구조화", "경쟁사 3곳 비교 리포트", "상품 이미지 AI 표시 2,000건", "원격 설치까지"]},
        {"id": "geo-enterprise", "name": "엔터프라이즈", "who": "대기업 · 공공기관 · 학교, 여러 사이트", "price": "견적", "note": "390만 원부터", "per": "", "cta": "견적 받기", "href": "contact/?plan=geo-enterprise&type=enterprise",
         "feat": ["여러 사이트와 영문 페이지", "맞춤 콘텐츠 전략과 분기 리포트", "담당자 교육과 내부 가이드", "계약서 · 세금계산서"]},
    ]},
    "geocare": {"name": "AI 검색 관리(월)", "vat": "부가세 별도", "tiers": [
        {"id": "geocare-care", "name": "AI 검색 관리", "full": "AI 검색 관리(월 관리)", "who": "세팅을 마치고 꾸준히 관리할 회사", "price": "99,000원", "per": "월", "m": 99000,
         "feat": ["매달 다시 진단과 크롤러 변화 알림", "AI 답변 언급 모니터링: 질문 20개를 ChatGPT · 제미나이 · 퍼플렉시티 · 네이버에 물어 기록", "월간 리포트와 다음 달 할 일"]},
        {"id": "geocare-grow", "name": "AI 검색 성장", "full": "AI 검색 성장(월 관리)", "who": "경쟁이 센 업종", "price": "290,000원", "per": "월", "m": 290000, "best": "추천",
         "feat": ["관리의 모든 것", "AI가 인용하기 좋은 글 매달 2편", "자주 묻는 질문 · 상품 피드 갱신", "경쟁사 추적과 분기 전략 회의"]},
    ]},
}
CATALOG["credit"] = {"name": "기업 크레딧", "vat": "부가세 별도, 충전", "tiers": [
    {"id": "credit-b10", "name": "12,000크레딧", "full": "기업 크레딧 12,000", "who": "팀 하나 · 수업 한 반", "price": "100,000원", "per": "충전", "m": 100000, "note": "10,000크레딧 + 2,000크레딧 더", "cta": "충전하기",
     "feat": ["AI 작성률 검사 · AI 휴머나이징을 한 코드로 함께", "API · MCP 요청에도 같은 코드(pass)", "AIMarker 요금제 · 세팅 · 옵션 결제에도", "세금계산서, 유효기간 5년"]},
    {"id": "credit-b30", "name": "39,000크레딧", "full": "기업 크레딧 39,000", "who": "여러 팀 · 학과", "price": "300,000원", "per": "충전", "m": 300000, "best": "추천", "note": "30,000크레딧 + 9,000크레딧 더", "cta": "충전하기",
     "feat": ["12,000크레딧의 모든 것", "쓴 내역 정리(요청 시)", "부서 · 반별로 코드 나누기(요청 시)", "세금계산서, 유효기간 5년"]},
    {"id": "credit-b100", "name": "140,000크레딧", "full": "기업 크레딧 140,000", "who": "기관 전체 · 대학", "price": "1,000,000원", "per": "충전", "m": 1000000, "note": "100,000크레딧 + 40,000크레딧 더", "cta": "충전하기",
     "feat": ["39,000크레딧의 모든 것", "담당자 안내와 사용 가이드", "기관 계약서", "세금계산서, 유효기간 5년"]},
    {"id": "credit-ent", "name": "맞춤", "who": "더 많이 · 정기 충전", "price": "견적", "note": "기관 계약 · 연간 충전", "per": "", "cta": "견적 받기", "href": "contact/?plan=credit-ent&type=enterprise",
     "feat": ["필요한 만큼 맞춰 충전", "정기 충전 · 연간 계약", "전용 API 한도", "계약서 · 세금계산서"]},
]}
BUNDLES = [{"id": "bundle-trust", "name": "AI 신뢰 올인원", "who": "소규모 · 중견 기업", "was": "980,000원", "price": "790,000원", "m": 790000,
            "feat": ["AI 검색 노출 최적화 스탠다드(1회)", "AI 표시 자동화 비즈니스 12개월", "AI 활용 고지문 · 사내 표시 가이드"]}]


def tiers_html(key, root, pick=None):
    """요금 칸(11.0): 이름 · 대상 → 값 → 보조 줄(12개월, 보통 얼마부터) → 단추 → 포함 기능.
    값과 단추가 칸마다 같은 높이에 오도록 모든 칸이 같은 다섯 줄 구조. 주 단추(파랑)는 '추천' 칸 하나만.
    pick: 그 페이지가 권하는 칸 id 끝(예: {{tiers:geo:pro}} 이면 geo-pro 를 '추천'으로, 다른 칸의 추천은 뺌)."""
    c = CATALOG[key]
    out = []
    for t0 in c["tiers"]:
        t = dict(t0)
        if pick:
            if t["id"] == "%s-%s" % (key, pick):
                t["best"] = t0.get("best") or "추천"
            else:
                t.pop("best", None)
        feats = "".join('<li>%s<span>%s</span></li>' % (ico("check"), f) for f in t["feat"])
        per = ('<span>/ %s</span>' % t["per"]) if t.get("per") else ""
        if t.get("y"):
            sub = '12개월 %s원(10개월 요금)' % format(t["y"], ",")
        else:
            sub = t.get("note", "")
        sub = '<p class="yr">%s</p>' % (sub or '<span aria-hidden="true">&nbsp;</span>')
        best = (' <em class="k-best">%s</em>' % t["best"]) if t.get("best") else ""
        kind = "k-btn-p" if t.get("best") else "k-btn-l"
        if t.get("href"):
            btn = '<a class="k-btn %s" href="%s%s">%s</a>' % (kind, root, t["href"], t.get("cta", "자세히"))
        else:
            btn = '<button class="k-btn %s" type="button" data-buy="%s">%s</button>' % (kind, t["id"], t.get("cta", "결제하기"))
        out.append('<div class="k-plan%s" id="%s"><div class="hd"><h3>%s%s</h3><p class="who">%s</p></div><p class="pr"><b>%s</b>%s</p>%s%s<ul>%s</ul></div>'
                   % (" best" if t.get("best") else "", t["id"], t["name"], best, t["who"], t["price"], per, sub, btn, feats))
    n = len(c["tiers"])
    return '<div class="k-plans ds-plans%s">%s</div><p class="k-small k-vat">%s. 결제는 공식 결제처 성균관컨설팅에서 카드, 간편결제, 계좌이체로 합니다.</p>' % (" c4" if n == 4 else (" c2" if n == 2 else ""), "".join(out), c["vat"])


# 12.0 크레딧(AI 작성률 검사 · AI 휴머나이징). 글 검사, 요금, 개인용 페이지가 같은 칸을 씀(값은 서버 PASS_.PRODUCTS · PASS_.CR 와 같게)
CREDIT_COST = {"unit": (100, 2, 10), "pro": (100, 4, 20)}   # (글자 수 단위, 크레딧, 최소). 600자 이하 검사 · 도우미는 0
CREDITS = [
    {"id": "c3", "cr": 300, "base": 300, "price": 3000, "who": "한 편 검사하고 고칠 때"},
    {"id": "c10", "cr": 1100, "base": 1000, "price": 10000, "who": "레포트 여러 편"},
    {"id": "c30", "cr": 3500, "base": 3000, "price": 30000, "who": "한 학기 내내", "tag": "추천"},
    {"id": "c50", "cr": 6000, "base": 5000, "price": 50000, "who": "논문 · 졸업 시즌"},
]


def credit_cost(kind, n):
    per, cr, mn = CREDIT_COST[kind]
    return max(mn, -(-n // per) * cr)


def credits_html(mode, root):
    """크레딧 충전 칸 네 개. mode 'buy': 글 검사 페이지(그 자리에서 충전 창), 'link': 다른 페이지(글 검사 페이지의 충전 창으로)."""
    cyc = credit_cost("unit", 3000) + credit_cost("pro", 3000)
    feat = ["모든 AI 검출 문장과 이유, 구간별 분석", "글 전체 AI 휴머나이징과 다른 버전", "결과상세내역서(PDF)", "유효기간 5년, 모자라면 같은 코드에 충전"]
    out = []
    for t in CREDITS:
        tag = (' <em class="k-best">%s</em>' % t["tag"]) if t.get("tag") else ""
        kind = "k-btn-p" if t.get("tag") else "k-btn-l"
        label = "%s원 충전" % format(t["price"], ",")
        if mode == "buy":
            btn = '<button class="k-btn %s" type="button" data-buy="%s">%s</button>' % (kind, t["id"], label)
        else:
            btn = '<a class="k-btn %s" href="%shumanize/#buy-%s">%s</a>' % (kind, root, t["id"], label)
        more = ("%s크레딧 + %s크레딧 더" % (format(t["base"], ","), format(t["cr"] - t["base"], ","))) if t["cr"] > t["base"] else "%s원 = %s크레딧" % (format(t["price"], ","), format(t["cr"], ","))
        k = t["cr"] // cyc
        out.append('<article class="k-plan cr%s" id="cr-%s"><div class="hd"><h3>%s크레딧%s</h3><p class="who">%s</p></div><p class="pr"><b>%s원</b></p><p class="yr">%s</p>%s<ul><li class="cyc">%s<span>3,000자 글 검사와 휴머나이징 약 %d번</span></li></ul></article>'
                   % (" best" if t.get("tag") else "", t["id"], format(t["cr"], ","), tag, t["who"], format(t["price"], ","), more, btn, ico("pen"), k))
    allf = "".join('<li>%s<span>%s</span></li>' % (ico("check"), f) for f in feat)
    return ('<div class="k-plans ds-plans c4 cr-plans">%s</div>'
            '<div class="cr-all"><b>어느 크레딧이든 똑같이 열립니다</b><ul>%s</ul></div>') % ("".join(out), allf)


def credit_cost_html():
    u, pr = CREDIT_COST["unit"], CREDIT_COST["pro"]
    rows = [
        ("AI 작성률 검사", "모든 문장의 색과 이유, 구간별 분석, 결과상세내역서", "%d자당 %d크레딧, 최소 %d크레딧" % u, credit_cost("unit", 3000)),
        ("AI 휴머나이징", "글 전체, 바꾼 이유, 다른 버전, 바꾸기 전후 AI 작성률", "%d자당 %d크레딧, 최소 %d크레딧" % pr, credit_cost("pro", 3000)),
        ("문장 도우미 · 짧은 다시 검사", "600자 이하 문장 고쳐 쓰기, 문장 후보 2개, 고친 문단 다시 검사", "빠지지 않음(크레딧이 남아 있을 때)", 0),
        ("무료 맛보기", "앞 6,000자 AI 작성률과 판정, 근거, 가장 뚜렷한 문장 2개, 휴머나이징 첫 문단", "코드 없이 무료", 0),
    ]
    tr = "".join('<tr><th scope="row">%s<small>%s</small></th><td data-h="빠지는 크레딧">%s</td><td data-h="3,000자 글이면">%s</td></tr>'
                 % (a, b, c, ("%s크레딧(%s원)" % (format(d, ","), format(d * 10, ","))) if d else "0크레딧") for a, b, c, d in rows)
    return ('<table class="k-table cr-cost"><thead><tr><th scope="col">하는 일</th><th scope="col">빠지는 크레딧</th><th scope="col">3,000자 글이면</th></tr></thead><tbody>%s</tbody></table>'
            '<p class="k-small cr-note">1크레딧은 10원으로 셉니다. 글자 수만큼 빠지고, 처리하지 못한 요청은 빠지지 않습니다. 크레딧은 발급 또는 마지막 충전부터 5년 동안 사용할 수 있고, 모자라면 같은 코드에 충전합니다. '
            '충전한 날부터 7일 안에는 쓰고 남은 유료 크레딧을 그대로, 그 뒤에는 10%%를 빼고 환불해 드립니다(<a href="{{root}}terms/#pass">이용약관 제7조의3</a>).</p>') % tr


def products_js():
    d = {"shop": SHOP_URL, "idx": SHOP_IDX, "items": {}}
    for key, c in CATALOG.items():
        for t in c["tiers"]:
            if t.get("m"):
                d["items"][t["id"]] = {"name": t.get("full") or ("%s %s" % (c["name"], t["name"]) if t["name"] != c["name"] else t["name"]), "group": c["name"], "who": t["who"], "m": t["m"], "y": t.get("y", 0), "per": t.get("per", ""), "vat": c["vat"], "feat": t["feat"][:4]}
    for b in BUNDLES:
        d["items"][b["id"]] = {"name": b["name"], "group": "묶음", "who": b["who"], "m": b["m"], "y": 0, "per": "1회", "vat": "부가세 별도", "feat": b["feat"]}
    return "/* AIMarker 상품 · 요금(빌드에서 만듦: _src/build.py CATALOG) */\nwindow.AMP = " + json.dumps(d, ensure_ascii=False) + ";\n"

# 옮긴 주소(2.0 → 3.0): 베타 → 파일럿, 작동 방식 → 제품
REDIRECTS = [("beta/", "contact/"), ("pilot/", "contact/"), ("how/", "product/"), ("mcp/", "developers/#mcp"), ("image/", "mark/")]
# 마크 서명 공개키(서버 am.pubkey 와 같은 값. 서버가 스스로 만든 키, 비밀 키는 서버 밖으로 나오지 않음)
MARK_KEYS = [{"kty": "OKP", "crv": "Ed25519", "x": "XdbkQ_O_R4Aq19ugDnJVpMcCX5OYPAV1NobuLhL-AEA", "kid": "amk1-f4e2e03c4c04", "use": "sig", "alg": "EdDSA", "since": "2026-10-16"}]

ICONS = {
    "share": '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
    "phone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    "monitor": '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "arrow": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "image": '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    "folder": '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    "upload": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    "building": '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    "cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    "zap": '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    "menu": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "chat": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "printer": '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    "code": '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "scale": '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    "megaphone": '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    "plug": '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    "chev": '<path d="m6 9 6 6 6-6"/>',
    "radar": '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    "tag": '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    "ledger": '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="m9 9.5 2 2 4-4"/>',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    "flag": '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    "sliders": '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
    "store": '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
    "refresh": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    "plus": '<path d="M5 12h14"/><path d="M12 5v14"/>',
    "inbox": '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    "approve": '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    "send": '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
    "user": '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    "badge": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    "palette": '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    "trend": '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    "layers": '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    "calc": '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    "video": '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    "cpu": '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
    "sparkle": '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    "fingerprint": '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
    "branch": '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    "flow": '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
    "db": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    "server": '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
    "key": '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    "card": '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
    "receipt": '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    "bars": '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
    "dash": '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    "scanx": '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>',
    "scroll": '<path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
    "target": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "hash": '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
    "webhook": '<path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"/><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"/><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"/>',
    "cloud": '<path d="M12 13v8"/><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 17 4-4 4 4"/>',
    "rocket": '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    "check2": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "dot": '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
    "home": '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
    "pen": '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
    "grid": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
}
SPARK = '<path d="M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z" fill="currentColor"/>'
# 9.1 로고 '지문'(2026.10.19): 지문 심볼 + 워드마크(AI 지문 블루 · Marker 네이비). 파일은 assets/brand/
LOGO_W, LOGO_H = 413.17, 100.0   # 가로형 로고 비율(aimarker-logo.svg viewBox)


def logo_img(root, dark=False):
    """심볼만(작업 공간 · 승인 · 관리 화면의 {{logo}}, 어두운 바탕은 {{logo_dk}})"""
    return '<img src="%sassets/brand/aimarker-symbol%s.svg?v=%s" alt="" width="26" height="30">' % (root, "-dark" if dark else "", VER)


LOGO = ""   # 예전 이름(쓰지 않음, {{logo}} 는 logo_img 로 바뀜)

# 한국AI윤리위원회 상징(인증 기업 표시용, 8.0). 밝은 바탕 · 어두운 바탕 두 가지
KAIEC_SVG = ('<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="%(bg)s" stroke="%(g)s" stroke-width="3"/>'
             '<circle cx="32" cy="32" r="25.6" fill="none" stroke="%(au)s" stroke-width="1.3"/>'
             '<path d="M32 13.5 20.4 43.6M32 13.5l11.6 30.1" stroke="%(g)s" stroke-width="4.2" fill="none"/>'
             '<circle cx="20.4" cy="45" r="1.8" fill="%(g)s"/><circle cx="43.6" cy="45" r="1.8" fill="%(g)s"/>'
             '<rect x="31" y="10.4" width="2" height="35.4" fill="%(au)s"/><rect x="27.2" y="10.4" width="9.6" height="1.8" fill="%(au)s"/>'
             '<rect x="24.6" y="32.4" width="14.8" height="2" fill="%(au)s"/><rect x="27.6" y="44.4" width="8.8" height="1.8" fill="%(au)s"/>'
             '<text x="32" y="54.6" text-anchor="middle" font-family="Pretendard Variable, Pretendard, sans-serif" font-size="6.2" font-weight="700" letter-spacing="1.1" fill="%(tx)s">KAIEC</text></svg>')
KAIEC_LT = {"bg": "#FBFAF5", "g": "#0F4A3A", "au": "#B48A3C", "tx": "#1F2B3A"}
KAIEC_DK = {"bg": "none", "g": "#E6ECF5", "au": "#C9A55C", "tx": "#E6ECF5"}


def kaiec_badge(dark=False, lg=False):
    return ('<a class="x-kaiec%s%s" href="https://kaiec.kr/" target="_blank" rel="noopener" aria-label="한국AI윤리위원회 인증 기업(위원회 누리집 새 창)">%s'
            '<span><b>한국AI윤리위원회 인증 기업</b><small>KOREA AI ETHICS COMMITTEE</small></span></a>'
            % (" dk" if dark else "", " lg" if lg else "", KAIEC_SVG % (KAIEC_DK if dark else KAIEC_LT)))


# 메뉴(9.0, 2026.10.18): 제품 · 기업용 · 기술 · 요금 · 회사. 펼침은 제품 하나, 휴대폰은 아래 탭(앱처럼)
PRODUCTS = [("label/", "fingerprint", "AI 표시 자동화", "코드 한 줄로 사이트 속 AI 생성물에 지문 마크 자동 부착"),
            ("mark/", "badge", "생성물 자동 마킹", "이미지 · 영상 · 문서에 지문 마크와 출처 기록"),
            ("geo/", "globe", "AI 검색 노출 최적화", "ChatGPT · 제미나이 · 네이버 AI 브리핑이 우리를 찾고 추천하게"),
            ("humanize/", "pen", "AI 휴머나이징 · AI 작성률 검사", "레포트 · 논문 · 자기소개서의 AI 말버릇을 사람 말투로"),
            ("commerce/", "store", "AI 커머스 엔진", "AI 쇼핑이 읽는 상품 데이터와 상품 피드"),
            ("compliance/", "shield", "AI 컴플라이언스", "출고 전 점검, 광고주 승인, 감사 기록"),
            ("label/#service", "code", "AI 서비스 표시 의무 대응", "AI 서비스 결과물마다 표시를 자동으로(API · SDK · MCP)")]
# 12.0 메뉴: 개인(AI 휴머나이징)은 맨 앞 단독 메뉴, 기업용 제품은 펼침 하나로
MENU_GROUPS = [("표시와 검색", [("label/", "fingerprint", "AI 표시 자동화", "코드 한 줄로 사이트 속 AI 생성물에 지문 마크"),
                          ("mark/", "badge", "생성물 자동 마킹", "이미지 · 영상 · 문서에 지문 마크와 출처 기록"),
                          ("geo/", "globe", "AI 검색 노출 최적화", "ChatGPT · 네이버 AI 브리핑이 우리를 찾게"),
                          ("label/#service", "code", "AI 서비스 표시 의무 대응", "AI 서비스 결과물마다 자동 표시")]),
               ("운영과 관리", [("commerce/", "store", "AI 커머스 엔진", "AI 쇼핑이 읽는 상품 데이터와 피드"),
                            ("compliance/", "shield", "AI 컴플라이언스", "출고 전 점검, 승인, 감사 기록"),
                            ("report/", "file", "일괄 확인 리포트", "여러 파일의 AI 표시 상태를 한 번에"),
                            ("m/", "search", "마크 확인", "받은 마크가 진짜인지 확인")]),
               ("시작하기", [("business/", "building", "기업용 한눈에", "필요한 일로 고르는 제품과 요금"),
                          ("site/", "rocket", "설치 마법사", "AI 표시 자동화를 무료로 설치"),
                          ("developers/", "code", "API · SDK · MCP", "서비스와 AI 에이전트에 연결"),
                          ("contact/", "chat", "도입 상담", "견적, 파일럿, 세금계산서")])]
B2C_MENU = [("humanize/", "AI 휴머나이징", "AI 말버릇을 사람 말투로, AI 작성률 검사"), ("personal/", "개인용 한눈에", "학생 · 취업 준비생 · 창작자"), ("proof/", "AI 활용 증빙서", "어떤 AI를 어디에 썼는지 정리")]
NAV = [("humanize/", "AI 휴머나이징"), ("products", "기업용"), ("pricing/", "요금"), ("developers/", "개발자"), ("company/", "회사")]
PRODUCT_PAGE_KEYS = ["label", "site", "v", "mark", "mcheck", "m", "geo", "commerce", "compliance", "report", "check", "scan", "verify", "creators", "product", "app", "business", "contact"]
NAV_KEY = {"humanize/": ["humanize", "personal", "proof"], "pricing/": ["pricing"], "developers/": ["developers"], "company/": ["company", "brand", "technology", "trust", "guide"]}
B2C_KEYS = ["humanize", "personal", "proof"]
TABS = [("", "home", "홈", ["home"]), ("humanize/", "pen", "휴머나이징", ["humanize", "personal", "proof"]),
        ("business/", "building", "기업용", ["business", "contact", "label", "site", "v", "mark", "mcheck", "m", "geo", "commerce", "compliance", "report", "check", "scan", "verify", "app"]),
        ("pricing/", "tag", "요금", ["pricing"])]


def ico(name, cls="ico"):
    if name == "spark":
        return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none">%s</svg>' % (cls, SPARK)
    return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true">%s</svg>' % (cls, ICONS[name])


def brand(root):
    h = 30
    return ('<a class="k-logo" href="%s" aria-label="AIMarker 홈"><img src="%sassets/brand/aimarker-logo.svg?v=%s" alt="AIMarker" width="%d" height="%d"></a>'
            % (root or "./", root, VER, round(h * LOGO_W / LOGO_H), h))


def header(root, key):
    items = []
    for href, label in NAV:
        if href == "products":
            cur = " cur" if key in PRODUCT_PAGE_KEYS else ""
            groups = "".join('<div class="grp"><span>%s</span>%s</div>' % (g, "".join('<a href="%s%s"><i>%s</i><span><b>%s</b><small>%s</small></span></a>' % (root, h, ico(ic), t, d) for h, ic, t, d in links)) for g, links in MENU_GROUPS)
            items.append('<div class="k-dd%s"><button type="button" aria-haspopup="true" aria-expanded="false"><span>%s</span>%s</button>'
                         '<div class="k-menu">%s<div class="k-menu-f"><span>AI 표시 자동화는 무료로 바로 설치할 수 있습니다</span><a href="%ssite/">설치 마법사 열기</a></div></div></div>'
                         % (cur, label, ico("chev"), groups, root))
        else:
            on = key in NAV_KEY.get(href, [])
            items.append('<a href="%s%s"%s><span>%s</span></a>' % (root, href, ' aria-current="page"' if on else "", label))
    # 12.0 주 단추는 보는 사람에 맞춤: 기업 페이지는 AI 표시 무료 설치, 그 밖(첫 화면 · 개인 · 안내)은 AI 휴머나이징
    biz = key in PRODUCT_PAGE_KEYS
    if key == "humanize":
        cta = ('<a class="k-btn k-btn-p k-btn-s" href="%shumanize/#price">크레딧 충전</a>' % root)
    elif biz:
        cta = ('<a class="k-btn k-btn-p k-btn-s" href="%ssite/">무료로 설치</a>' % root)
    else:
        cta = ('<a class="k-btn k-btn-p k-btn-s" href="%shumanize/">무료로 시작</a>' % root)
    sheet = '<span class="grp">개인 · 학생</span>' + "".join('<a href="%s%s">%s<small>%s</small></a>' % (root, h, t, d) for h, t, d in B2C_MENU)
    for g, links in MENU_GROUPS[:2]:
        sheet += '<span class="grp">%s</span>' % g + "".join('<a href="%s%s">%s<small>%s</small></a>' % (root, h, t, d) for h, ic, t, d in links)
    sheet += '<span class="grp">더 보기</span><a href="%sbusiness/">기업용 한눈에</a><a href="%spricing/">요금과 결제</a><a href="%sdevelopers/">개발자</a><a href="%stechnology/">기술</a><a href="%scompany/">회사</a>' % (root, root, root, root, root)
    sheet += '<div class="ds-sheet-cta"><a href="%scontact/">도입 상담</a><a class="p" href="%s">%s</a></div>' % (root, (root + "site/") if biz else (root + "humanize/"), "무료로 설치" if biz else "무료로 시작")
    return ('<a class="k-skip" href="#main">본문으로 건너뛰기</a>'
            '<header class="k-hd" id="hd"><div class="k-hd-in">%s<nav class="k-nav" aria-label="주 메뉴">%s</nav>'
            '<div class="k-hd-r"><a class="k-hl opt" href="%scontact/">도입 상담</a>%s'
            '<button class="k-menu-btn" type="button" id="menuBtn" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mnav">%s</button></div></div></header>'
            '<nav class="k-sheet" id="mnav" aria-label="모바일 메뉴">%s</nav>'
            % (brand(root), "".join(items), root, cta, ico("menu"), sheet))


def tabbar(root, key):
    out = []
    for h, ic, label, keys in TABS:
        out.append('<a href="%s%s"%s>%s<span>%s</span></a>' % (root or "./" if not h else root, h, ' aria-current="page"' if key in keys else "", ico(ic), label))
    out.append('<button type="button" data-open-menu aria-controls="mnav">%s<span>메뉴</span></button>' % ico("grid"))
    return '<nav class="k-tab" aria-label="빠른 이동">%s</nav>' % "".join(out)


def footer(root):
    b = BIZ
    biz = ['<span>운영 %s</span>' % b["name"], '<span>대표 %s</span>' % b["ceo"]]
    if b["no"]:
        biz.append('<span>사업자등록번호 %s</span>' % b["no"])
    if b["ecom"]:
        biz.append('<span>통신판매업 신고 %s</span>' % b["ecom"])
    if b["addr"]:
        biz.append('<span>%s</span>' % b["addr"])
    biz.append('<span>문의 <a href="mailto:%s">%s</a></span>' % (b["mail"], b["mail"]))
    biz.append('<span>결제 · 세금계산서는 운영사 성균관컨설팅이 처리합니다</span>')
    cols = [("제품", [("humanize/", "AI 휴머나이징"), ("label/", "AI 표시 자동화"), ("site/", "설치 마법사"), ("mark/", "생성물 자동 마킹"), ("geo/", "AI 검색 노출 최적화"), ("commerce/", "AI 커머스 엔진"), ("compliance/", "AI 컴플라이언스"), ("m/", "마크 확인")]),
            ("고객별", [("personal/", "개인 · 학생"), ("proof/", "AI 활용 증빙서"), ("pricing/#label", "1인 · 소상공인"), ("business/", "기업 · 기관 · 학교"), ("label/#service", "AI 서비스 회사"), ("report/", "일괄 확인 리포트"), ("check/", "광고 문구 검수"), ("contact/", "도입 상담")]),
            ("개발자", [("developers/", "API와 SDK"), ("developers/#mcp", "MCP 서버"), ("developers/openapi.json", "OpenAPI 명세"), ("m.js", "자동 표시 스크립트(공개 코드)"), ("v/", "표시 확인"), ("llms.txt", "llms.txt"), (".well-known/aimarker-keys.json", "마크 서명 공개키"), ("verify/", "원장 확인")]),
            ("회사", [("company/", "회사 소개"), ("technology/", "기술"), ("pricing/", "요금"), ("trust/", "신뢰와 판단 기준"), ("guide/", "광고와 AI 표시 가이드"), ("brand/", "브랜드 자료"), ("terms/", "이용약관"), ("privacy/", "<b>개인정보처리방침</b>")])]
    colhtml = "".join('<div><b>%s</b>%s</div>' % (t, "".join('<a href="%s%s">%s</a>' % (root, h, x) for h, x in links)) for t, links in cols)
    std = ('<div class="k-ft-std"><span><b>표준</b>C2PA, IPTC, XMP, schema.org, llms.txt</span>'
           '<span><b>서명</b>Ed25519(JWS), <a href="%s.well-known/aimarker-keys.json">공개키</a></span>'
           '<span><b>원장</b>하루치를 OpenTimestamps에 고정, <a href="%sverify/">확인하기</a></span></div>' % (root, root))
    return ('<footer class="k-ft"><div class="k-wrap"><div class="k-ft-top"><div class="k-ft-brand">%s'
            '<p>AIMarker는 AI가 만든 이미지, 영상, 글에 지문 마크를 붙여 누구나 알아볼 수 있게 하고, AI 검색이 우리 회사를 정확히 읽고 추천하도록 돕는 AI 콘텐츠 신뢰 플랫폼입니다.</p>%s'
            '<div id="aimarker" class="ft-label"></div></div>'
            '<div class="k-ft-cols">%s</div></div>%s'
            '<div class="k-ft-biz">%s<br>'
            '<span>AIMarker 마크는 표시와 그 근거를 기록하는 것이며, 법률 자문을 대신하거나 개별 콘텐츠의 적법성을 보증하지 않습니다. 광고 검수 결과는 위험 후보와 근거입니다. AI 작성률은 정해진 기준에 따른 추정이며 증명이 아닙니다. AI 표시 문구는 <a href="https://kaiec.kr/" target="_blank" rel="noopener">한국AI윤리위원회</a> 기준을 따릅니다.</span><br>'
            '<span>© 2026 AIMarker</span></div></div></footer>'
            % (brand(root), kaiec_badge(), colhtml, std, "".join(biz)))


def auto_ld(meta, body, path, title, desc):
    """8.0: 모든 쪽에 구조화 데이터(운영 조직 · 이 페이지 · 자주 묻는 질문)를 자동으로. 우리 사이트도 GEO 기준을 지키게"""
    import html as _h
    if meta.get("layout") == "app" or meta.get("noindex"):
        return ""
    url = SITE + path
    own = meta.get("jsonld", "")
    graph = []
    if not own:
        graph.append({"@type": "Organization", "@id": SITE + "#org", "name": "AIMarker", "alternateName": "에이아이마커", "url": SITE,
                      "logo": SITE + "assets/icon-512.png", "email": "contact@skkc.co.kr",
                      "parentOrganization": {"@type": "Organization", "name": "성균관컨설팅", "url": "https://www.skkc.co.kr/"}})
        graph.append({"@type": "WebPage", "@id": url + "#page", "url": url, "name": title, "description": desc, "inLanguage": "ko-KR",
                      "isPartOf": {"@type": "WebSite", "@id": SITE + "#site", "url": SITE, "name": "AIMarker"}, "publisher": {"@id": SITE + "#org"}})
    tx = lambda s: re.sub(r"\s+", " ", _h.unescape(re.sub(r"<[^>]+>", "", s))).strip()
    qa = []
    for m in re.finditer(r"<details[^>]*>\s*<summary[^>]*>((?:(?!</summary>|<details).)*?)</summary>\s*<p>((?:(?!</details>|<details).)*?)</p>\s*</details>", body, re.S):
        q, a = tx(m.group(1)), tx(m.group(2))
        if q and a:
            qa.append({"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}})
    if len(qa) >= 2 and "FAQPage" not in own:
        graph.append({"@type": "FAQPage", "@id": url + "#faq", "mainEntity": qa[:20]})
    if not graph:
        return ""
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("</", "<\\/") + "</script>"


def page(meta, body):
    path = meta.get("path", "")
    depth = len([p for p in path.split("/") if p])
    root = "/" if meta.get("absroot") else "../" * depth
    body = re.sub(r"\{\{inc:([\w.\-]+)\}\}", lambda m: open(os.path.join(HERE, "pages", m.group(1)), encoding="utf-8").read(), body)
    body = body.replace("{{root}}", root).replace("{{ver}}", VER).replace("{{logo_dk}}", logo_img(root, True)).replace("{{logo}}", logo_img(root)).replace("{{kaiec}}", kaiec_badge()).replace("{{kaiec_lg}}", kaiec_badge(lg=True)).replace("{{kaiec_dk}}", kaiec_badge(dark=True))
    body = re.sub(r"\{\{tiers:([a-z]+)(?::([a-z]+))?\}\}", lambda m: tiers_html(m.group(1), root, m.group(2)), body)
    body = re.sub(r"\{\{(?:passes|credits):(buy|link)\}\}", lambda m: credits_html(m.group(1), root), body)
    body = body.replace("{{credit_cost}}", credit_cost_html().replace("{{root}}", root))
    # 11.0: 확인 도구 세 쪽(/v/ · /m/ · /verify/)을 잇는 같은 탭 줄
    body = re.sub(r"\{\{checknav:([a-z]+)\}\}", lambda m: '<nav class="ds-segnav" aria-label="확인 도구">' + "".join(
        '<a href="%s%s"%s>%s</a>' % (root, h, ' aria-current="page"' if k == m.group(1) else '', t)
        for k, h, t in (("v", "v/", "사이트 표시 확인"), ("m", "m/", "마크 번호, 파일 확인"), ("verify", "verify/", "원장 확인"))) + '</nav>', body)
    body = re.sub(r"\{\{ico:([a-z0-9]+)\}\}", lambda m: ico(m.group(1)), body)
    title = meta["title"]
    desc = meta.get("desc", "")
    scripts = "".join('<script src="%s%s?v=%s" defer></script>' % (root, s.strip(), VER) for s in meta.get("scripts", "").split(",") if s.strip())
    # 우리 사이트에도 우리 표시를 붙임(직접 쓰는 모습). 생성기 화면은 미리보기만
    sl = meta.get("selflabel", "")
    if sl == "preview":
        scripts = '<script src="%sm.js?v=%s" data-preview defer></script>' % (root, VER) + scripts
    elif sl != "none":
        # 9.0: 휴대폰 아래 탭과 겹치지 않게 늘 바닥글 안에 둠(밝은 바닥글)
        look = 'data-style="inline" data-theme="light"' if meta.get("layout") != "app" else 'data-side="right"'
        scripts += ('<script src="%sm.js?v=%s" data-name="AIMarker" data-use="text" data-level="assist" data-review="all" '
                    'data-privacy="1" data-auto="0" %s data-date="2026-10" defer></script>' % (root, VER, look))
    pre = "".join('<script src="%s"></script>' % s.strip() for s in meta.get("prescripts", "").split(",") if s.strip())
    pre += "".join('<link rel="stylesheet" href="%s%s?v=%s">' % (root, s.strip(), VER) for s in meta.get("styles", "").split(",") if s.strip())
    pre += '<link rel="stylesheet" href="%sassets/v9.css?v=%s"><link rel="stylesheet" href="%sassets/v10.css?v=%s"><link rel="stylesheet" href="%sassets/v11.css?v=%s">' % (root, VER, root, VER, root, VER)
    if meta.get("manifest"):
        pre += ('<link rel="manifest" href="%sapp/manifest.webmanifest"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
                '<meta name="apple-mobile-web-app-title" content="AIMarker"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">' % root)
    jsonld = meta.get("jsonld", "") + auto_ld(meta, body, path, title, desc)
    noindex = '<meta name="robots" content="noindex">' if meta.get("noindex") else ""
    head = ('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>%s</title><meta name="description" content="%s">%s<link rel="canonical" href="%s%s">'
            '<meta property="og:type" content="website"><meta property="og:site_name" content="AIMarker"><meta property="og:title" content="%s">'
            '<meta property="og:description" content="%s"><meta property="og:url" content="%s%s"><meta property="og:image" content="%sassets/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            '<meta property="og:locale" content="ko_KR"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="%sassets/og.jpg"><meta name="theme-color" content="#FFFFFF">'
            '<link rel="icon" href="%sassets/favicon.svg" type="image/svg+xml"><link rel="icon" href="%sassets/favicon-32.png" sizes="32x32" type="image/png">'
            '<link rel="apple-touch-icon" href="%sassets/apple-touch-icon.png">'
            '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>'
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">'
            '<link rel="stylesheet" href="%sassets/am.css?v=%s">%s%s%s</head>'
            % (title, desc, noindex, SITE, path, meta.get("ogtitle", title), desc, SITE, path, SITE, SITE, root, root, root, root, VER,
               ('' if (meta.get("layout") == "app" or meta.get("v9")) else '<link rel="stylesheet" href="%sassets/site4.css?v=%s"><link rel="stylesheet" href="%sassets/v8.css?v=%s">' % (root, VER, root, VER)), jsonld, pre))
    if meta.get("layout") != "app" and not meta.get("manifest"):   # 9.0: 휴대폰 홈 화면에 추가(웹 앱)
        head = head.replace('</head>', '<link rel="manifest" href="%smanifest.webmanifest"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
                            '<meta name="apple-mobile-web-app-title" content="AIMarker"><meta name="apple-mobile-web-app-status-bar-style" content="default"></head>' % root)
    if meta.get("layout") == "app":   # 작업 공간 · 승인 화면: 머리글 · 바닥글 없이
        return (head + '<body class="app" data-page="%s" data-root="%s">' % (meta.get("key", ""), root) + body +
                '<script src="%sassets/am.js?v=%s" defer></script>' % (root, VER) + scripts + '</body></html>\n')
    html = (head + '<body class="has-tab%s" data-page="%s" data-root="%s">' % (" v9" if meta.get("v9") else "", meta.get("key", ""), root) + header(root, meta.get("key", "")) +
            '<main id="main">' + body + '</main>' + footer(root) + tabbar(root, meta.get("key", "")) +
            '<script src="%sassets/am.js?v=%s" defer></script><script src="%sassets/k.js?v=%s" defer></script>' % (root, VER, root, VER) +
            '<script src="%sassets/products.js?v=%s" defer></script><script src="%sassets/order.js?v=%s" defer></script>' % (root, VER, root, VER) + scripts + '</body></html>\n')
    return html


def parse(src):
    m = re.match(r"\s*<!--(.*?)-->", src, re.S)
    meta = {}
    if m:
        for line in m.group(1).strip().splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        src = src[m.end():]
    if "jsonld_file" in meta:
        with open(os.path.join(HERE, "pages", meta["jsonld_file"]), encoding="utf-8") as f:
            meta["jsonld"] = '<script type="application/ld+json">' + json.dumps(json.load(f), ensure_ascii=False) + '</script>'
    return meta, src


# ---------- AI 연동 자료(4.0): MCP 서버 · SDK · 함수 호출 도구 정의 · llms.txt ----------
MCP_VER = "2.4.0"
_IND = {"type": "string", "enum": ["auto", "gen", "food", "hfood", "cos", "med", "fin"],
        "description": "업종 규칙 팩. auto(글로 자동 판별) · gen 일반 상품 · food 일반식품 · hfood 건강기능식품 · cos 화장품 · med 의료 · fin 금융. 모르면 auto."}
_FLAGS = {"type": "object", "description": "콘텐츠 정보(모르면 비움).", "properties": {
    "sponsored": {"type": "boolean", "description": "대가(제품 · 원고료 · 할인)를 받은 콘텐츠인지"},
    "aiPerson": {"type": "boolean", "description": "AI로 만든 인물 · 목소리 · 아바타가 나오는지"},
    "aiMedia": {"type": "boolean", "description": "AI로 만든 이미지 · 영상을 쓰는지"}}}
_GUIDE = {"type": "object", "description": "브랜드 정책(선택).", "properties": {
    "ban": {"type": "array", "items": {"type": "string"}, "description": "쓰지 않을 말"},
    "must": {"type": "array", "items": {"type": "string"}, "description": "꼭 넣을 문구"}}}
_LABEL = {"type": "string", "enum": ["auto", "ai_generated", "ai_edited", "ai_assisted", "no_ai"],
          "description": "auto(파일 근거로 정함, 근거가 없으면 발급하지 않음) · ai_generated(AI 생성) · ai_edited(AI 편집 · 합성) · ai_assisted(AI 보조) · no_ai(AI 미사용, 사용자가 그렇다고 말했을 때만). 근거와 맞지 않는 표시는 서버가 막습니다."}
_TOOLS = {"type": "array", "items": {"type": "string"}, "description": "사용한 AI 도구 이름(예: Midjourney · ChatGPT). AI 미사용이면 비움"}
# (이름, API 동작, 설명, 입력 속성, 필수) · path 는 실행 코드가 파일을 읽어 aim-extract 특징값(features · pack)으로 바꿔 보내고, content 는 SHA-256 으로 바꿔 h 로 보냄
FC_TOOLS = [
    ("aimarker_analyze_file", "am.analyze", "이미지 · 영상 · 오디오 · 문서 파일의 AI 사용 근거(C2PA 서명 재검증 · 생성 도구 기록 · 메타데이터)를 확인합니다. 판정(verdict.ai: used · not_used · unknown), 근거(basis: verified 서명 검증 · record 파일 기록 · none), 고를 수 있는 표시(allowed), 근거로 정해지는 표시(suggest), 같은 · 비슷한 파일의 기존 마크를 돌려줍니다. 파일은 실행 환경에서 읽고 원본은 보내지 않습니다.",
     {"path": {"type": "string", "description": "파일 경로"}}, ["path"]),
    ("aimarker_analyze_text", "am.analyze", "글의 해시와 AI 활용을 밝히는 표현 여부로 같은 글의 기존 마크와 주의할 점을 확인합니다. 글은 파일 기록이 없어 AI 사용 여부를 글만으로 판정하지 않습니다. 원문은 보내지 않습니다.",
     {"text": {"type": "string", "description": "확인할 글"}}, ["text"]),
    ("aimarker_mark", "am.mark", "파일(path) 또는 글(text)에 서명된 AIMarker 마크를 발급합니다. 마크 번호 · 확인 주소(aimarker.kr/m/) · 관리 키(한 번만) · 서명(JWS) · 원장 번호를 돌려줍니다. 근거와 맞지 않는 표시는 CONFLICT, 비슷한 이미지에 AI 마크가 있으면 CONFIRM(사용자가 확인한 뒤 confirm: true). 이 대화에서 AI가 만들거나 고친 콘텐츠는 AI 사용 표시를 고르고 tools 에 적으세요.",
     {"path": {"type": "string", "description": "파일 경로(path 와 text 가운데 하나)"}, "text": {"type": "string", "description": "글(원문은 보내지 않음)"}, "label": _LABEL, "tools": _TOOLS,
      "title": {"type": "string", "description": "콘텐츠 이름(선택)"}, "issuer": {"type": "string", "description": "발급자 이름(선택)"}, "confirm": {"type": "boolean", "description": "CONFIRM 질문을 사용자가 확인했을 때만 true"}}, ["label"]),
    ("aimarker_mark_info", "am.markinfo", "마크 번호(AM-로 시작)로 표시 · 근거 · 상태(유효 · 철회) · 공개 근거 · 이력과 서명(cred)을 확인합니다. 누구나 쓸 수 있습니다.",
     {"id": {"type": "string", "description": "마크 번호"}}, ["id"]),
    ("aimarker_find_marks", "am.lookup", "파일(path) 또는 SHA-256 · 지각 해시(dhash)로 이미 발급된 마크를 찾습니다(같은 파일 · 발급자가 등록한 표시본 · 비슷한 이미지).",
     {"path": {"type": "string"}, "sha256": {"type": "string", "description": "소문자 16진수 64자"}, "dhash": {"type": "string", "description": "16진수 16자"}}, []),
    ("aimarker_verify_mark", "am.pubkey", "마크 서명(JWS · EdDSA)을 AIMarker 공개키로 확인합니다. 실행 코드가 공개키(https://aimarker.kr/.well-known/aimarker-keys.json)로 직접 확인하고 서명 내용(마크 번호 · 표시 · 근거 · 원본 해시)을 돌려줍니다.",
     {"credential": {"type": "string", "description": "마크 서명(JWS) 문자열"}}, ["credential"]),
    ("aimarker_anchor", "am.anchor", "하루치 원장을 묶은 뿌리 해시와 OpenTimestamps 증명(공개 앵커)을 확인합니다. date(YYYY-MM-DD) 또는 원장 번호(id, LG로 시작).",
     {"date": {"type": "string"}, "id": {"type": "string"}}, []),
    ("aimarker_check", "am.check", "부가 기능: 광고 · 상세페이지 · SNS 문구를 한국 광고 규칙(표시광고법 · 식품 · 건강기능식품 · 화장품 · 의료 · 금융 광고 규제)과 협찬 · 가상인물 · AI 표시 기준으로 검수합니다. 위험 후보마다 근거 법령 · 이유 · 바꿀 말(reps)과 붙일 표시, 출고 결정(fix · expert · review · clear)을 돌려줍니다. 결과는 위험 후보이며 법률 자문이 아닙니다.",
     {"text": {"type": "string", "description": "검수할 문구(5,000자까지)"}, "ind": _IND, "flags": _FLAGS, "guide": _GUIDE}, ["text"]),
    ("aimarker_auto_fix", "am.auto", "부가 기능: 검수 · 고치기 · 다시 검수를 서버에서 끝까지 자동으로 합니다. outcome(pass 그대로 출고 가능 · fixed 자동 수정 후 출고 가능 · return 반려), 고친 문구(text), 바꾼 곳(applied), 남은 위험 후보(left)를 돌려줍니다.",
     {"text": {"type": "string"}, "ind": _IND, "flags": _FLAGS, "guide": _GUIDE, "stamp": {"type": "boolean", "description": "고친 문구의 해시를 원장에 남길지"}}, ["text"]),
    ("aimarker_label", "am.label", "붙일 표시 문구를 받습니다(한국AI윤리위원회 기준). kind: image · video · person(가상인물) · text · sponsor(광고 · 협찬). 짧은 표시 · 긴 문장 · HTML · 마크다운 · IPTC 값을 돌려줍니다.",
     {"kind": {"type": "string", "enum": ["image", "video", "person", "text", "sponsor"]}, "level": {"type": "string", "enum": ["gen", "edit"], "description": "gen: AI로 만듦 · edit: AI로 고침"}}, ["kind"]),
    ("aimarker_geo_check", "am.geo", "사이트 · 상품 쪽 주소 하나로 AI 검색 준비 점수(0~100: AI 크롤러 접근 · 구조화 데이터 · 본문 · 메타 · 질문과 답 · 이미지 · 신뢰)와 붙여 넣을 고칠 코드(JSON-LD · llms.txt · robots.txt · 메타 · FAQ)를 받습니다. 상품 쪽이면 AI 상품 피드 한 줄도 줍니다.",
     {"url": {"type": "string", "description": "사이트 · 상품 쪽 주소"}}, ["url"]),
    ("aimarker_detect_text", "am.detect", "글의 AI 작성률(0~100)과 판정(band: 안전 · 고위험 · 부적합, AIMarker 판정 기준 1.0) · 판정 근거(band.why) · 구간별 검출 · AI 문체 특성 · 종합 의견과 AI 패턴이 몰린 문장을 받습니다. 같은 글은 언제나 같은 값 · 같은 판정입니다. 추정일 뿐 증명이 아니므로 결과만으로 사람을 판단하지 마세요. 글은 서버로 보내지만 저장하지 않습니다. 6,000자까지. 무료 키는 맛보기(판정 · 수치는 같은 값, 문장 위치는 가장 뚜렷한 2개만)이고, 크레딧 코드(pass)나 유료 키면 모든 문장 · 구간을 받습니다.",
     {"text": {"type": "string", "description": "확인할 글(6,000자까지)"}, "pass": {"type": "string", "description": "크레딧 코드(선택). 글자 수만큼 크레딧이 빠짐: 100자당 2크레딧(최소 10), 600자 이하는 0. 코드가 없으면 맛보기"}}, ["text"]),
    ("aimarker_stamp", "am.stamp", "보고서 · 콘텐츠 버전 · 승인 기록을 증거 원장에 남깁니다. content 는 실행 코드에서 SHA-256 해시(h)로 바꿔 보내므로 내용은 서버로 가지 않습니다. 원장 번호와 서버 시각을 돌려주고, 하루치 원장은 다음 날 공개 앵커로 묶입니다.",
     {"content": {"type": "string", "description": "기록할 내용(실행 코드가 해시로 바꿈)"}, "k": {"type": "string", "enum": ["report", "version", "approval"], "description": "기록 종류"}, "n": {"type": "integer", "description": "보고서에 든 소재 수(선택)"}}, ["content"]),
    ("aimarker_verify", "am.verify", "원장 번호(id, LG로 시작)나 내용(content, 실행 코드가 해시로 바꿈)으로 증거 원장 기록을 확인합니다.",
     {"id": {"type": "string", "description": "원장 번호"}, "content": {"type": "string", "description": "확인할 내용"}}, []),
]


def _gemini_schema(x):
    """Gemini 함수 선언용: 지원하지 않을 수 있는 키(minLength · maxLength · pattern)를 뺌"""
    if isinstance(x, dict):
        return {k: _gemini_schema(v) for k, v in x.items() if k not in ("minLength", "maxLength", "pattern")}
    if isinstance(x, list):
        return [_gemini_schema(v) for v in x]
    return x


def build_ai_assets():
    import shutil
    import tarfile
    import io
    os.makedirs(os.path.join(ROOT, "mcp"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "sdk"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "developers", "tools"), exist_ok=True)
    src_mcp = os.path.join(HERE, "mcp")
    # 2.0: 출처 판독기(aim-extract)를 MCP 파일 안에 넣어 파일 하나로 돌게 함
    with open(os.path.join(src_mcp, "aimarker-mcp.src.mjs"), encoding="utf-8") as f:
        mcp_src = f.read()
    with open(os.path.join(HERE, "lib", "aim-extract.js"), encoding="utf-8") as f:
        aim_src = f.read()
    with open(os.path.join(HERE, "lib", "aim-report.js"), encoding="utf-8") as f:
        rep_src = f.read()
    assert "/*@@AIM_EXTRACT@@*/" in mcp_src and "/*@@AIM_REPORT@@*/" in mcp_src and "VERSION = '%s'" % MCP_VER in mcp_src
    mcp_out = mcp_src.replace("/*@@AIM_EXTRACT@@*/", aim_src.rstrip("\n")).replace("/*@@AIM_REPORT@@*/", rep_src.rstrip("\n"))
    with open(os.path.join(ROOT, "mcp", "aimarker-mcp.mjs"), "w", encoding="utf-8") as f:
        f.write(mcp_out)
    # npx 용 꾸러미(npm pack 과 같은 모양: package/ 아래 파일, 시각 고정)
    tgz = os.path.join(ROOT, "mcp", "aimarker-mcp-%s.tgz" % MCP_VER)
    buf = io.BytesIO()
    import gzip
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0) as gz:
        with tarfile.open(fileobj=gz, mode="w", format=tarfile.USTAR_FORMAT) as tar:
            for name in ("package.json", "aimarker-mcp.mjs", "README.md"):
                data = mcp_out.encode("utf-8") if name == "aimarker-mcp.mjs" else open(os.path.join(src_mcp, name), "rb").read()
                ti = tarfile.TarInfo("package/" + name)
                ti.size, ti.mtime, ti.mode = len(data), 499162500, 0o755 if name.endswith(".mjs") else 0o644
                tar.addfile(ti, io.BytesIO(data))
    old = open(tgz, "rb").read() if os.path.exists(tgz) else b""
    if old != buf.getvalue():
        open(tgz, "wb").write(buf.getvalue())
    # SDK 1.0: JavaScript 는 aim-extract 를 넣어 파일 하나로, Python 은 그대로
    with open(os.path.join(HERE, "sdk", "aimarker.src.mjs"), encoding="utf-8") as f:
        sdk_src = f.read()
    assert "/*@@AIM_EXTRACT@@*/" in sdk_src and "/*@@AIM_REPORT@@*/" in sdk_src
    with open(os.path.join(ROOT, "sdk", "aimarker.mjs"), "w", encoding="utf-8") as f:
        f.write(sdk_src.replace("/*@@AIM_EXTRACT@@*/", aim_src.rstrip("\n")).replace("/*@@AIM_REPORT@@*/", rep_src.rstrip("\n")))
    shutil.copyfile(os.path.join(HERE, "sdk", "aimarker.py"), os.path.join(ROOT, "sdk", "aimarker.py"))
    shutil.copyfile(os.path.join(HERE, "sdk", "aimarker-tools.mjs"), os.path.join(ROOT, "sdk", "aimarker-tools.mjs"))
    # 함수 호출 도구 정의 세 가지 모양
    def params(props, req):
        o = {"type": "object", "properties": props}
        if req:
            o["required"] = req
        return o
    openai = [{"type": "function", "name": n, "description": d, "parameters": params(pr, rq), "strict": False} for n, a, d, pr, rq in FC_TOOLS]
    anthropic = [{"name": n, "description": d, "input_schema": params(pr, rq)} for n, a, d, pr, rq in FC_TOOLS]
    gemini = {"functionDeclarations": [{"name": n, "description": d, "parameters": _gemini_schema(params(pr, rq))} for n, a, d, pr, rq in FC_TOOLS]}
    actions = {n: a for n, a, d, pr, rq in FC_TOOLS}
    for fname, data in (("openai.json", openai), ("anthropic.json", anthropic), ("gemini.json", gemini), ("actions.json", actions)):
        with open(os.path.join(ROOT, "developers", "tools", fname), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
    # AI가 읽는 문서
    for name in ("llms.txt", "llms-full.txt"):
        shutil.copyfile(os.path.join(HERE, "ai", name), os.path.join(ROOT, name))
    shutil.copyfile(os.path.join(HERE, "ai", "openapi.json"), os.path.join(ROOT, "developers", "openapi.json"))
    # 5.0 공개 판독기 · 마크 삽입 배지 · 마크 서명 공개키
    os.makedirs(os.path.join(ROOT, "lib"), exist_ok=True)
    shutil.copyfile(os.path.join(HERE, "lib", "aim-extract.js"), os.path.join(ROOT, "lib", "aim-extract.js"))
    shutil.copyfile(os.path.join(HERE, "lib", "aim-report.js"), os.path.join(ROOT, "lib", "aim-report.js"))
    shutil.copyfile(os.path.join(HERE, "lib", "aim-seo.js"), os.path.join(ROOT, "lib", "aim-seo.js"))   # 6.0 검색 · AI 검색 꾸러미
    os.makedirs(os.path.join(ROOT, "m"), exist_ok=True)
    shutil.copyfile(os.path.join(HERE, "m", "embed.js"), os.path.join(ROOT, "m", "embed.js"))
    # 10.0 자동 표시 3.0: 지문 심볼(작은 크기용) 경로를 넣어 m.js 한 파일로
    sym = open(os.path.join(ROOT, "assets", "brand", "aimarker-symbol-small.svg"), encoding="utf-8").read()
    fp_d = re.search(r'<path fill="url\(#amg\)" d="([^"]+)"', sym).group(1)
    lab = open(os.path.join(HERE, "m", "label.src.js"), encoding="utf-8").read()
    assert "@@FP_SMALL@@" in lab
    out = lab.replace("@@FP_SMALL@@", fp_d)
    old_m = open(os.path.join(ROOT, "m.js"), encoding="utf-8").read() if os.path.exists(os.path.join(ROOT, "m.js")) else ""
    if old_m != out:
        open(os.path.join(ROOT, "m.js"), "w", encoding="utf-8").write(out)
    # 10.0 지문 마크 넣기(브라우저) 라이브러리
    st = open(os.path.join(HERE, "lib", "aimarker-stamp.src.js"), encoding="utf-8").read()
    assert "@@FP_SMALL@@" in st
    st = st.replace("@@FP_SMALL@@", fp_d)
    sp = os.path.join(ROOT, "lib", "aimarker-stamp.js")
    if not os.path.exists(sp) or open(sp, encoding="utf-8").read() != st:
        open(sp, "w", encoding="utf-8").write(st)
    # 등록 사이트 목록(정적, AIMarker 확인 페이지가 읽음)
    os.makedirs(os.path.join(ROOT, "r"), exist_ok=True)
    reg = json.load(open(os.path.join(HERE, "registry", "sites.json"), encoding="utf-8"))
    with open(os.path.join(ROOT, "r", "sites.json"), "w", encoding="utf-8") as f:
        json.dump(reg, f, ensure_ascii=False, indent=1)
        f.write("\n")
    os.makedirs(os.path.join(ROOT, ".well-known"), exist_ok=True)
    with open(os.path.join(ROOT, ".well-known", "aimarker-keys.json"), "w", encoding="utf-8") as f:
        json.dump({"issuer": "https://aimarker.kr", "about": "AIMarker 마크 서명 공개키(JWS · EdDSA/Ed25519). 마크의 kid 와 같은 키로 서명을 확인하세요. https://aimarker.kr/developers/#verify",
                   "keys": MARK_KEYS}, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    pages_dir = os.path.join(HERE, "pages")
    built = []
    for name in sorted(os.listdir(pages_dir)):
        if not name.endswith(".html"):
            continue
        with open(os.path.join(pages_dir, name), encoding="utf-8") as f:
            meta, body = parse(f.read())
        out_rel = meta.get("out") or (meta.get("path", "") + "index.html")
        out = os.path.join(ROOT, out_rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            f.write(page(meta, body))
        if meta.get("noindex"):
            continue
        built.append(out_rel)
    # 옮긴 주소: 예전 주소로 들어오면 새 주소로(쿼리 · # 그대로)
    for old, new in REDIRECTS:
        out = os.path.join(ROOT, old, "index.html")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            f.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>AIMarker</title><meta name="robots" content="noindex">'
                    '<link rel="canonical" href="%s%s"><meta http-equiv="refresh" content="0; url=../%s">'
                    '<script>location.replace("../%s" + location.search + location.hash)</script></head>'
                    '<body><p><a href="../%s">AIMarker %s 페이지로 이동합니다</a></p></body></html>\n' % (SITE, new, new, new, new, new.strip("/")))
    # 사이트맵
    urls = [b[:-len("index.html")] for b in built if b.endswith("index.html") and "404" not in b]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in sorted(urls, key=lambda x: (x.count("/"), x)):
        sm.append("<url><loc>%s%s</loc><lastmod>%s</lastmod></url>" % (SITE, u, TODAY))
    sm.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(sm) + "\n")
    # 작업 공간 서비스 워커 저장소 이름도 같은 판으로(옛 저장분 지우기)
    swp = os.path.join(ROOT, "app", "sw.js")
    if os.path.exists(swp):
        sw = open(swp, encoding="utf-8").read()
        sw2 = re.sub(r"var V = 'am-app-[^']*';", "var V = 'am-app-%s';" % VER, sw)
        if sw2 != sw:
            open(swp, "w", encoding="utf-8").write(sw2)
    build_ai_assets()
    with open(os.path.join(ROOT, "assets", "products.js"), "w", encoding="utf-8") as f:
        f.write(products_js())
    print("만든 페이지:", ", ".join(built))


if __name__ == "__main__":
    sys.exit(main())
