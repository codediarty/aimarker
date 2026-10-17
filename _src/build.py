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
VER = "20261017h"
TODAY = "2026-10-16"
# 운영사 정보(skkc.co.kr 바닥글과 같게, 비어 있는 칸은 표시하지 않음)
BIZ = {"name": "성균관컨설팅", "ceo": "이채연", "no": "272-32-01885", "addr": "연구실 경기도 수원시 장안구 서부로 2066 성균관대학교 브릿지팩토리", "mail": "contact@skkc.co.kr", "tel": "", "ecom": "제2026-경기송탄-0622"}
SITE = "https://aimarker.kr/"
# 옮긴 주소(2.0 → 3.0): 베타 → 파일럿, 작동 방식 → 제품
REDIRECTS = [("beta/", "contact/"), ("pilot/", "contact/"), ("how/", "product/"), ("mcp/", "developers/#mcp"), ("image/", "mark/")]
# 마크 서명 공개키(서버 am.pubkey 와 같은 값. 서버가 스스로 만든 키, 비밀 키는 서버 밖으로 나오지 않음)
MARK_KEYS = [{"kty": "OKP", "crv": "Ed25519", "x": "XdbkQ_O_R4Aq19ugDnJVpMcCX5OYPAV1NobuLhL-AEA", "kid": "amk1-f4e2e03c4c04", "use": "sig", "alg": "EdDSA", "since": "2026-10-16"}]

ICONS = {
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
}
SPARK = '<path d="M12 2.5l1.9 5.2a3 3 0 0 0 1.8 1.8L21 11.4l-5.3 1.9a3 3 0 0 0-1.8 1.8L12 20.5l-1.9-5.4a3 3 0 0 0-1.8-1.8L3 11.4l5.3-1.9a3 3 0 0 0 1.8-1.8z" fill="currentColor"/>'
LOGO = ('<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0E2A6B"/>'
        '<path d="M20 7.6l1.86 5.1a2.8 2.8 0 0 0 1.68 1.68l5.1 1.86-5.1 1.86a2.8 2.8 0 0 0-1.68 1.68L20 24.9l-1.86-5.12a2.8 2.8 0 0 0-1.68-1.68l-5.1-1.86 5.1-1.86a2.8 2.8 0 0 0 1.68-1.68z" fill="#fff"/>'
        '<rect x="11" y="28.6" width="18" height="3.6" rx="1.8" fill="#3BD6BD"/></svg>')

# 메뉴(6.0, 2026.10.17): 기업용 · 개인용 두 갈래 + 마크 확인 · 기술 · 요금 · 회사
# 펼침 메뉴 항목: (주소, 아이콘, 제목, 설명) · 묶음 제목은 ("#", None, "묶음 이름", None)
NAV = [("business", "business", "기업용", [
           ("#", None, "핵심 제품", None),
           ("geo/", "globe", "GEO 자동 최적화", "AI 검색이 읽고 인용하게 · 무료 진단"),
           ("commerce/", "store", "AI 커머스 엔진", "AI 상품 피드 · 상세페이지 · 전환 분석"),
           ("compliance/", "shield", "AI 신뢰 · 컴플라이언스", "출고 전 확인 · 자동 표시 · 감사 기록"),
           ("#", None, "도구 · 연동", None),
           ("mark/", "badge", "자동 마킹", "파일을 넣으면 AI 표시가 박힘"),
           ("report/", "bars", "일괄 확인 리포트", "콘텐츠 수백 건을 한 번에"),
           ("check/", "megaphone", "광고 문구 검수", "위험 후보 · 근거 · 바꿀 말"),
           ("site/", "tag", "AI 표시 자동 태그", "코드 한 줄 · 아임웹 앱"),
           ("developers/", "code", "API · MCP", "우리 서비스에 바로 연결"),
           ("business/", "building", "기업용 전체 보기", "업종별 쓰임 · 요금")]),
       ("personal", "personal", "개인용", [
           ("humanize/", "sparkle", "AI 작성률 검사 · 휴머나이징", "AI가 쓴 티를 확인하고 다듬기"),
           ("mark/", "badge", "무료 AI 표시", "AI 이미지 · 영상에 서명된 표시"),
           ("proof/", "printer", "AI 활용 증빙서", "과제 · 공모전에 AI 사용 밝히기"),
           ("creators/", "users", "크리에이터 사전 등록", "AI 작업으로 기업 의뢰 받기"),
           ("personal/", "user", "개인용 전체 보기", "무료로 시작 · 요금")]),
       ("m/", "mcheck", "마크 확인", None),
       ("technology/", "technology", "기술", None),
       ("pricing/", "pricing", "요금", None),
       ("company/", "company", "회사", None)]
GROUP_KEYS = {"business": ["business", "geo", "commerce", "compliance", "product", "app", "developers", "verify", "check", "scan", "site", "report"],
              "personal": ["personal", "humanize", "proof", "creators", "mark"]}
PRODUCT_KEYS = GROUP_KEYS["business"]
ANNOUNCE = ("geo/", "기업", "월 구독 없이 1회 세팅으로 AI 검색 최적화와 AI 표시를 끝냅니다. 주소만 넣고 무료 진단부터 받아 보세요", "무료 진단")
ANNOUNCE_P = ("humanize/", "개인", "학교 · 기관 · 기업은 이미 AI 작성 여부를 확인합니다. 내기 전에 판정과 문장별 색으로 먼저 확인하세요", "무료 맛보기")


def ico(name, cls="ico"):
    if name == "spark":
        return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none">%s</svg>' % (cls, SPARK)
    return '<svg class="%s" viewBox="0 0 24 24" aria-hidden="true">%s</svg>' % (cls, ICONS[name])


def brand(root):
    return '<a class="brand" href="%s" aria-label="AIMarker 홈">%s<span><b>AI</b>Marker</span></a>' % (root or "./", LOGO)


def header(root, key):
    items = []
    for href, k, label, sub in NAV:
        if sub:
            cur = ' class="cur"' if (k == key or key in GROUP_KEYS.get(k, [])) else ""
            parts, mega = [], any(h == "#" for h, _, _, _ in sub)
            for h, ic, t, d in sub:
                if h == "#":
                    parts.append('<span class="mg">%s</span>' % t)
                else:
                    parts.append('<a href="%s%s"><i>%s</i><span><b>%s</b><small>%s</small></span></a>' % (root, h, ico(ic), t, d))
            items.append('<div class="dd%s"><button type="button"%s aria-haspopup="true" aria-expanded="false">%s%s</button><div class="menu">%s</div></div>'
                         % (" dd-mega" if mega else "", cur, label, ico("chev"), "".join(parts)))
        else:
            items.append('<a href="%s%s"%s>%s</a>' % (root, href, ' aria-current="page"' if k == key else "", label))
    mgroups = ""
    for href, k, label, sub in NAV:
        if sub:
            mgroups += '<span class="grp">%s</span>' % label + "".join(
                ('<span class="grp2">%s</span>' % t) if h == "#" else ('<a href="%s%s">%s</a>' % (root, h, t)) for h, _, t, _ in sub)
        else:
            mgroups += '<a href="%s%s">%s</a>' % (root, href, label)
    personal = key in GROUP_KEYS["personal"]
    ah, ab, at, ac = ANNOUNCE_P if personal else ANNOUNCE
    bar = ('<a class="annc" href="%s%s"><span class="annc-in"><b>%s</b><span>%s</span><em>%s%s</em></span></a>' % (root, ah, ab, at, ac, ico("arrow"))) if key not in ("contact", "404", "humanize", "home", "geo") else ""
    c1 = ("humanize/", "AI 작성률 검사") if personal else ("geo/", "무료 GEO 진단")
    return (bar + '<header class="hd" id="hd"><div class="wrap">%s<nav class="nav" aria-label="주 메뉴">%s</nav>'
            '<div class="hd-cta"><a class="btn btn-g btn-s" href="%s%s">%s</a><a class="btn btn-p btn-s" href="%scontact/">기업 상담</a></div>'
            '<button class="menu-btn" type="button" id="menuBtn" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mnav">%s</button></div></header>'
            '<nav class="mnav" id="mnav" aria-label="모바일 메뉴">%s'
            '<a class="btn btn-p" href="%scontact/">기업 상담</a><a class="btn btn-g" href="%s%s">%s</a></nav>'
            % (brand(root), "".join(items), root, c1[0], c1[1], root, ico("menu"), mgroups, root, root, c1[0], c1[1]))


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
    cols = [("기업용", [("geo/", "GEO 자동 최적화"), ("commerce/", "AI 커머스 엔진"), ("compliance/", "AI 신뢰 · 컴플라이언스"), ("business/", "기업용 전체 보기"), ("pricing/#business", "기업 요금")]),
            ("개인용", [("humanize/", "AI 작성률 검사 · 휴머나이징"), ("mark/", "무료 AI 표시 · 자동 마킹"), ("proof/", "AI 활용 증빙서"), ("creators/", "크리에이터 사전 등록"), ("pricing/#personal", "개인 요금")]),
            ("도구", [("m/", "마크 확인"), ("report/", "일괄 확인 리포트"), ("check/", "광고 문구 검수"), ("scan/", "사이트 진단"), ("site/", "AI 표시 자동 태그"), ("verify/", "원장 · 공개 타임스탬프")]),
            ("기술 · 개발자", [("technology/", "기술"), ("developers/", "API · AI 연동"), ("developers/#mcp", "MCP 서버"), (".well-known/aimarker-keys.json", "마크 서명 공개키"), ("llms.txt", "llms.txt"), ("developers/openapi.json", "OpenAPI 명세")]),
            ("회사", [("company/", "회사 소개"), ("contact/", "기업 상담"), ("trust/", "신뢰 · 판단 기준"), ("guide/", "광고 · AI 표시 가이드"), ("terms/", "이용약관"), ("privacy/", "<b>개인정보처리방침</b>")])]
    colhtml = "".join('<div><b class="ct">%s</b>%s</div>' % (t, "".join('<a href="%s%s">%s</a>' % (root, h, x) for h, x in links)) for t, links in cols)
    return ('<footer class="ft"><div class="wrap"><div class="top"><div class="ft-a">%s'
            '<p class="about">AIMarker는 AI 콘텐츠가 만들어지고, 발견되고, 거래되는 모든 과정에서 AI 검색 최적화(GEO) · 자동 AI 표시 · 근거 기록을 제공하는 AI 콘텐츠 플랫폼입니다.</p><div id="aimarker" class="ft-label"></div></div>'
            '<div class="cols">%s</div></div>'
            '<div class="biz">%s<br>'
            '<span>AIMarker 마크는 표시와 그 근거를 기록하는 것이며, 법률 자문을 대신하거나 개별 콘텐츠의 적법성을 보증하지 않습니다. 광고 검수 결과는 위험 후보와 근거입니다. AI 표시 문구는 <a href="https://kaiec.kr/" target="_blank" rel="noopener">한국AI윤리위원회</a> 기준을 따릅니다.</span><br>'
            '<span>© 2026 AIMarker</span></div></div></footer>'
            % (brand(root), colhtml, "".join(biz)))


def page(meta, body):
    path = meta.get("path", "")
    depth = len([p for p in path.split("/") if p])
    root = "/" if meta.get("absroot") else "../" * depth
    body = re.sub(r"\{\{inc:([\w.\-]+)\}\}", lambda m: open(os.path.join(HERE, "pages", m.group(1)), encoding="utf-8").read(), body)
    body = body.replace("{{root}}", root).replace("{{logo}}", LOGO)
    body = re.sub(r"\{\{ico:([a-z0-9]+)\}\}", lambda m: ico(m.group(1)), body)
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
                    'data-privacy="1" data-auto="0" %s data-date="2026-10" defer></script>' % (root, VER, look))
    pre = "".join('<script src="%s"></script>' % s.strip() for s in meta.get("prescripts", "").split(",") if s.strip())
    pre += "".join('<link rel="stylesheet" href="%s%s?v=%s">' % (root, s.strip(), VER) for s in meta.get("styles", "").split(",") if s.strip())
    if meta.get("manifest"):
        pre += ('<link rel="manifest" href="%sapp/manifest.webmanifest"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
                '<meta name="apple-mobile-web-app-title" content="AIMarker"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">' % root)
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
            '<link rel="stylesheet" href="%sassets/am.css?v=%s">%s%s%s</head>'
            % (title, desc, noindex, SITE, path, meta.get("ogtitle", title), desc, SITE, path, SITE, SITE, root, root, root, root, VER,
               ('' if meta.get("layout") == "app" else '<link rel="stylesheet" href="%sassets/site4.css?v=%s">' % (root, VER)), jsonld, pre))
    if meta.get("layout") == "app":   # 작업 공간 · 승인 화면: 머리글 · 바닥글 없이
        return (head + '<body class="app" data-page="%s" data-root="%s">' % (meta.get("key", ""), root) + body +
                '<script src="%sassets/am.js?v=%s" defer></script>' % (root, VER) + scripts + '</body></html>\n')
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
    ("aimarker_detect_text", "am.detect", "글의 AI 작성률(0~100)과 판정(band: 안전 · 고위험 · 부적합, AIMarker 판정 기준 1.0) · 판정 근거(band.why) · 구간별 검출 · AI 문체 특성 · 종합 의견과 AI 패턴이 몰린 문장을 받습니다. 같은 글은 언제나 같은 값 · 같은 판정입니다. 추정일 뿐 증명이 아니므로 결과만으로 사람을 판단하지 마세요. 글은 서버로 보내지만 저장하지 않습니다. 6,000자까지. 무료 키는 맛보기(판정 · 수치는 같은 값, 문장 위치는 가장 뚜렷한 2개만)이고, 이용권 코드(pass)나 유료 키면 모든 문장 · 구간을 받습니다.",
     {"text": {"type": "string", "description": "확인할 글(6,000자까지)"}, "pass": {"type": "string", "description": "개인 이용권 코드(선택). 한 번 부를 때 1회를 씀(600자 이하는 세지 않음)"}}, ["text"]),
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
    print("만든 페이지:", ", ".join(built))


if __name__ == "__main__":
    sys.exit(main())
