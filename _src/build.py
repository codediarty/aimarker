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
VER = "20261015a"
TODAY = "2026-10-15"
# 운영사 정보(skkc.co.kr 바닥글과 같게, 비어 있는 칸은 표시하지 않음)
BIZ = {"name": "성균관컨설팅", "ceo": "이채연", "no": "272-32-01885", "addr": "연구실 경기도 수원시 장안구 서부로 2066 성균관대학교 브릿지팩토리", "mail": "contact@skkc.co.kr", "tel": "", "ecom": "제2026-경기송탄-0622"}
SITE = "https://aimarker.kr/"

ICONS = {
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "arrow": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "image": '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
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
}
SPARK = '<path d="M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z" fill="currentColor"/>'
LOGO = ('<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0E2A6B"/>'
        '<path d="M20 7.6l1.86 5.1a2.8 2.8 0 0 0 1.68 1.68l5.1 1.86-5.1 1.86a2.8 2.8 0 0 0-1.68 1.68L20 24.9l-1.86-5.12a2.8 2.8 0 0 0-1.68-1.68l-5.1-1.86 5.1-1.86a2.8 2.8 0 0 0 1.68-1.68z" fill="#fff"/>'
        '<rect x="11" y="28.6" width="18" height="3.6" rx="1.8" fill="#3BD6BD"/></svg>')

NAV = [("how/", "how", "작동 방식"), ("tools", "tools", "무료 도구"), ("pricing/", "pricing", "요금"),
       ("business/", "business", "기업 · 플랫폼"), ("guide/", "guide", "AI 표시 가이드")]
TOOLS = [("#scan", "scan", "search", "무료 진단", "주소만 넣으면 10초 만에 진단"),
         ("site/", "site", "globe", "사이트 표시 만들기", "코드 한 줄 · 아임웹 앱으로 붙이기"),
         ("image/", "image", "image", "이미지 표시 · 확인", "출처 정보 읽기 · AI 생성 표시 넣기"),
         ("proof/", "proof", "file", "AI 활용 증빙서", "과제 · 논문 · 공모전 제출용")]


def ico(name, cls="ico"):
    if name == "spark":
        return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none">%s</svg>' % (cls, SPARK)
    return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true">%s</svg>' % (cls, ICONS[name])


def brand(root):
    return '<a class="brand" href="%s" aria-label="AIMarker 홈">%s<span><b>AI</b>Marker</span></a>' % (root or "./", LOGO)


def header(root, key):
    tool_keys = [k for _, k, _, _, _ in TOOLS]
    items = []
    for href, k, label in NAV:
        if k == "tools":
            cur = ' class="cur"' if key in tool_keys else ""
            menu = "".join('<a href="%s%s"><i>%s</i><span><b>%s</b><small>%s</small></span></a>' % (root, h, ico(ic), t, d) for h, _, ic, t, d in TOOLS)
            items.append('<div class="dd"><button type="button"%s aria-haspopup="true" aria-expanded="false">%s%s</button><div class="menu">%s</div></div>' % (cur, label, ico("chev"), menu))
        else:
            items.append('<a href="%s%s"%s>%s</a>' % (root, href, ' aria-current="page"' if k == key else "", label))
    mtools = "".join('<a href="%s%s">%s</a>' % (root, h, t) for h, _, _, t, _ in TOOLS)
    return ('<header class="hd" id="hd"><div class="wrap">%s<nav class="nav" aria-label="주 메뉴">%s</nav>'
            '<div class="hd-cta"><a class="btn btn-g btn-s" href="%sbusiness/#ask">도입 문의</a><a class="btn btn-p btn-s" href="%s#scan" data-scan-link>무료로 시작</a></div>'
            '<button class="menu-btn" type="button" id="menuBtn" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mnav">%s</button></div></header>'
            '<nav class="mnav" id="mnav" aria-label="모바일 메뉴"><a href="%show/">작동 방식</a><span class="grp">무료 도구</span>%s'
            '<span class="grp">서비스</span><a href="%spricing/">요금</a><a href="%sbusiness/">기업 · 플랫폼</a><a href="%sguide/">AI 표시 가이드</a><a href="%strust/">신뢰 · 판단 기준</a>'
            '<a class="btn btn-p" href="%sbeta/">자동 탐지 베타 신청</a><a class="btn btn-g" href="%sbusiness/#ask">기업 · 기관 도입 문의</a></nav>'
            % (brand(root), "".join(items), root, root, ico("menu"), root, mtools, root, root, root, root, root, root))


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
    return ('<footer class="ft"><div class="wrap"><div class="top"><div>%s'
            '<p class="about">AI로 만든 이미지 · 영상 · 글 · 상담을 자동으로 찾아 표시하고, 표시한 내역을 기록으로 남깁니다. 표시는 무료, 자동화와 기록은 구독으로.</p><div id="aimarker" class="ft-label"></div></div>'
            '<div class="cols">'
            '<div><b>제품</b><a href="%show/">작동 방식</a><a href="%sbeta/">자동 탐지 베타</a><a href="%spricing/">요금</a><a href="%sbusiness/">기업 · 플랫폼 · API</a></div>'
            '<div><b>무료 도구</b><a href="%s#scan">무료 진단</a><a href="%ssite/">사이트 표시 만들기</a><a href="%simage/">이미지 표시 · 확인</a><a href="%sproof/">AI 활용 증빙서</a></div>'
            '<div><b>자료</b><a href="%sguide/">AI 표시 가이드</a><a href="%strust/">신뢰 · 판단 기준</a><a href="%strust/#report">오류 신고</a></div>'
            '<div><b>안내</b><a href="%sterms/">이용약관</a><a href="%sprivacy/"><b style="display:inline;color:#DDE5F2;margin:0">개인정보처리방침</b></a><a href="%sbusiness/?type=ad#ask">제휴 · 광고 문의</a></div>'
            '</div></div>'
            '<div class="biz">%s<br>'
            '<span>표시 문구 기준 <a href="https://kaiec.kr/" target="_blank" rel="noopener">한국AI윤리위원회</a></span><span>AIMarker 와 위원회는 개별 사이트 · 콘텐츠를 심사 · 보증하지 않으며, 이 서비스는 법률 자문을 대신하지 않습니다.</span><br>'
            '<span>© 2026 AIMarker</span></div></div></footer>'
            % (brand(root), root, root, root, root, root, root, root, root, root, root, root, root, root, root, "".join(biz)))


def page(meta, body):
    path = meta.get("path", "")
    depth = len([p for p in path.split("/") if p])
    root = "/" if meta.get("absroot") else "../" * depth
    body = body.replace("{{root}}", root).replace("{{logo}}", LOGO)
    body = re.sub(r"\{\{ico:([a-z]+)\}\}", lambda m: ico(m.group(1)), body)
    title = meta["title"]
    desc = meta.get("desc", "")
    scripts = "".join('<script src="%s%s?v=%s" defer></script>' % (root, s.strip(), VER) for s in meta.get("scripts", "").split(",") if s.strip())
    # 우리 사이트에도 우리 표시를 붙임(직접 쓰는 모습). 생성기 화면은 미리보기만
    sl = meta.get("selflabel", "")
    if sl == "preview":
        scripts = '<script src="%sm.js?v=%s" data-preview defer></script>' % (root, VER) + scripts
    elif sl != "none":
        # footer: 도구 화면은 떠 있는 배지 대신 바닥글 안에 둠(버튼을 가리지 않게)
        look = 'data-style="inline" data-theme="dark"' if sl == "footer" else 'data-side="right"'
        scripts += ('<script src="%sm.js?v=%s" data-name="AIMarker" data-use="text" data-level="assist" data-review="all" '
                    'data-privacy="1" %s data-date="2026-10" defer></script>' % (root, VER, look))
    pre = "".join('<script src="%s"></script>' % s.strip() for s in meta.get("prescripts", "").split(",") if s.strip())
    jsonld = meta.get("jsonld", "")
    noindex = '<meta name="robots" content="noindex">' if meta.get("noindex") else ""
    head = ('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>%s</title><meta name="description" content="%s">%s<link rel="canonical" href="%s%s">'
            '<meta property="og:type" content="website"><meta property="og:site_name" content="AIMarker"><meta property="og:title" content="%s">'
            '<meta property="og:description" content="%s"><meta property="og:url" content="%s%s"><meta property="og:image" content="%sassets/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            '<meta property="og:locale" content="ko_KR"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="%sassets/og.jpg"><meta name="theme-color" content="#0E2A6B">'
            '<link rel="icon" href="%sassets/favicon.svg" type="image/svg+xml"><link rel="icon" href="%sassets/favicon-32.png" sizes="32x32" type="image/png">'
            '<link rel="apple-touch-icon" href="%sassets/apple-touch-icon.png">'
            '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>'
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">'
            '<link rel="stylesheet" href="%sassets/am.css?v=%s">%s%s</head>'
            % (title, desc, noindex, SITE, path, meta.get("ogtitle", title), desc, SITE, path, SITE, SITE, root, root, root, root, VER, jsonld, pre))
    html = (head + '<body data-page="%s" data-root="%s">' % (meta.get("key", ""), root) + header(root, meta.get("key", "")) +
            '<main id="main">' + body + '</main>' + footer(root) +
            '<script src="%sassets/am.js?v=%s" defer></script>' % (root, VER) + scripts + '</body></html>\n')
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
        built.append(out_rel)
    # 사이트맵
    urls = [b[:-len("index.html")] for b in built if b.endswith("index.html") and "404" not in b]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in sorted(urls, key=lambda x: (x.count("/"), x)):
        sm.append("<url><loc>%s%s</loc><lastmod>%s</lastmod></url>" % (SITE, u, TODAY))
    sm.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(sm) + "\n")
    print("만든 페이지:", ", ".join(built))


if __name__ == "__main__":
    sys.exit(main())
