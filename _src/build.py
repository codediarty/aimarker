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
VER = "20261009a"
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
    "refresh": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
}
SPARK = '<path d="M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z" fill="currentColor"/>'
LOGO = ('<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0E2A6B"/>'
        '<path d="M20 7.6l1.86 5.1a2.8 2.8 0 0 0 1.68 1.68l5.1 1.86-5.1 1.86a2.8 2.8 0 0 0-1.68 1.68L20 24.9l-1.86-5.12a2.8 2.8 0 0 0-1.68-1.68l-5.1-1.86 5.1-1.86a2.8 2.8 0 0 0 1.68-1.68z" fill="#fff"/>'
        '<rect x="11" y="28.6" width="18" height="3.6" rx="1.8" fill="#3BD6BD"/></svg>')

NAV = [("site/", "site", "사이트 표시"), ("image/", "image", "이미지 표시"), ("proof/", "proof", "AI 활용 증빙서"),
       ("pricing/", "pricing", "요금"), ("business/", "business", "기업 · 플랫폼"), ("guide/", "guide", "AI 표시 가이드")]


def ico(name, cls="ico"):
    if name == "spark":
        return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none">%s</svg>' % (cls, SPARK)
    return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true">%s</svg>' % (cls, ICONS[name])


def brand(root):
    return '<a class="brand" href="%s" aria-label="AIMarker 홈">%s<span><b>AI</b>Marker</span></a>' % (root or "./", LOGO)


def header(root, key):
    links = "".join('<a href="%s%s"%s>%s</a>' % (root, href, ' aria-current="page"' if k == key else "", label) for href, k, label in NAV)
    mlinks = "".join('<a href="%s%s">%s</a>' % (root, href, label) for href, k, label in NAV)
    return ('<header class="hd" id="hd"><div class="wrap">%s<nav class="nav" aria-label="주 메뉴">%s</nav>'
            '<div class="hd-cta"><a class="btn btn-g btn-s" href="%sbusiness/#ask">도입 문의</a><a class="btn btn-p btn-s" href="%ssite/">무료로 시작</a></div>'
            '<button class="menu-btn" type="button" id="menuBtn" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mnav">%s</button></div></header>'
            '<nav class="mnav" id="mnav" aria-label="모바일 메뉴">%s<a class="btn btn-p" href="%ssite/">무료로 시작하기</a><a class="btn btn-g" href="%sbusiness/#ask">기업 · 기관 도입 문의</a></nav>'
            % (brand(root), links, root, root, ico("menu"), mlinks, root, root))


def footer(root):
    return ('<footer class="ft"><div class="wrap"><div class="top"><div>%s'
            '<p class="about">AI로 만든 글 · 이미지 · 영상 · 상담을 먼저 밝히는 일을 쉽게 만듭니다. 고르지 않아도 찾아 주고, 한 줄이면 붙습니다.</p><div id="aimarker" class="ft-label"></div></div>'
            '<div class="cols"><div><b>도구</b><a href="%ssite/">사이트 표시</a><a href="%simage/">이미지 표시 · 확인</a><a href="%sproof/">AI 활용 증빙서</a></div>'
            '<div><b>서비스</b><a href="%spricing/">요금</a><a href="%sbusiness/">기업 · 기관 · 플랫폼</a><a href="%sguide/">AI 표시 가이드</a></div>'
            '<div><b>안내</b><a href="%sterms/">이용약관</a><a href="%sprivacy/"><b style="display:inline;color:#DDE5F2;margin:0">개인정보처리방침</b></a><a href="%sbusiness/?type=ad#ask">제휴 · 광고 문의</a></div></div></div>'
            '<div class="biz"><span>운영 성균관컨설팅</span><span>대표 이채연</span><span>통신판매업 신고 제2026-경기송탄-0622</span><span>문의 <a href="mailto:contact@skkc.co.kr">contact@skkc.co.kr</a></span><br>'
            '<span>표시 문구 기준 <a href="https://kaiec.kr/" target="_blank" rel="noopener">한국AI윤리위원회</a></span><span>AIMarker 와 위원회는 개별 사이트 · 콘텐츠를 심사 · 보증하지 않으며, 이 서비스는 법률 자문을 대신하지 않습니다.</span><br>'
            '<span>© 2026 AIMarker</span></div></div></footer>'
            % (brand(root), root, root, root, root, root, root, root, root, root))


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
            '<meta property="og:description" content="%s"><meta property="og:url" content="%s%s"><meta property="og:image" content="%sassets/og.png">'
            '<meta property="og:locale" content="ko_KR"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#0E2A6B">'
            '<link rel="icon" href="%sassets/favicon.svg" type="image/svg+xml"><link rel="icon" href="%sassets/favicon-32.png" sizes="32x32" type="image/png">'
            '<link rel="apple-touch-icon" href="%sassets/apple-touch-icon.png">'
            '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>'
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">'
            '<link rel="stylesheet" href="%sassets/am.css?v=%s">%s%s</head>'
            % (title, desc, noindex, SITE, path, meta.get("ogtitle", title), desc, SITE, path, SITE, root, root, root, root, VER, jsonld, pre))
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
        sm.append("<url><loc>%s%s</loc><lastmod>2026-10-09</lastmod></url>" % (SITE, u))
    sm.append("</urlset>")
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(sm) + "\n")
    print("만든 페이지:", ", ".join(built))


if __name__ == "__main__":
    sys.exit(main())
