"""AIMarker SDK for Python 1.2.0 · https://aimarker.kr/developers/#sdk

표준 라이브러리만 씁니다(Python 3.8+). 서버에서 쓰고, API 키는 환경 변수에 두세요. MIT

핵심: 파일 · 글의 AI 사용 여부를 근거로 확인하고, 근거에 맞는 서명된 마크를 발급 · 확인합니다.

    import os
    from aimarker import AIMarker
    am = AIMarker(os.environ["AIMARKER_KEY"])

    # 글: 원문 대신 해시만 보냅니다
    m = am.mark_text("ChatGPT로 정리한 회의록", label="ai_assisted", tools=["ChatGPT"])
    print(m["id"], m["url"], m["key"])          # key(관리 키)는 한 번만 나옵니다

    # 파일: 출처 판독은 aim-extract(JavaScript)가 합니다. Node.js 가 있으면 자동으로 씁니다.
    a = am.analyze_file("cover.jpg")            # a["verdict"]["ai"]: used | not_used | unknown
    m = am.mark_file("cover.jpg", label="auto")  # 근거가 없으면 AIMarkerError(DECLARE): 사용자에게 물어 label 을 정하세요

    # 서명 확인(서버에 묻지 않음)
    v = AIMarker.verify_mark(m["cred"])          # {"ok": True, "kid": "...", "payload": {...}}

    # 1.1: 여러 파일을 20건씩 확인(발급하지 않음). 리포트(HTML · CSV)는 JavaScript SDK · MCP 의 report 를 쓰세요
    rows = am.analyze_files(["a.jpg", "b.png"])  # [{"name", "path", "kind", "sha256", "result", "error"}]

마크는 표시와 근거를 기록하고 서명한 것이며 법적 인증이 아닙니다.
광고 검수(부가 기능)는 위험 후보와 근거이며 법률 자문이 아닙니다.
"""
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import unicodedata
import urllib.request

DEFAULT_URL = "https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec"
KEYS_URL = "https://aimarker.kr/.well-known/aimarker-keys.json"
MCP_PKG = "https://aimarker.kr/mcp/aimarker-mcp-2.3.0.tgz"
LABELS = ("ai_generated", "ai_edited", "ai_assisted", "no_ai")
LABEL_KO = {"ai_generated": "AI 생성", "ai_edited": "AI 편집 · 합성", "ai_assisted": "AI 보조", "no_ai": "AI 미사용"}
BASIS_KO = {"verified": "서명 검증", "record": "파일 기록", "declared": "발급자 신고", "none": "근거 없음"}


class AIMarkerError(Exception):
    def __init__(self, code, message, body=None):
        super().__init__("[%s] %s" % (code, message))
        self.code = code
        self.body = body or {}


# ---------- 글의 특징값(aim-extract textFeatures 와 같은 계산) ----------
_ZW_REMOVE = re.compile("[​-‍﻿⁠­]")
_ZW_FLAG = re.compile("[​-‍﻿⁠]")
_DISCLOSE = re.compile(
    r"(?:AI|인공지능|생성형\s?AI|ChatGPT|챗\s?GPT|GPT|Claude|클로드|Gemini|제미나이|Copilot|코파일럿|뤼튼|Wrtn|하이퍼클로바|HyperCLOVA|클로바\s?X|퍼플렉시티|Perplexity|딥시크|DeepSeek)"
    r"(?:[가-힣A-Za-z\s·,()-]{0,14}?)(?:로|으로|를|을|이|가|의|에게|와|과)?\s?(?:활용|사용|이용|도움)?(?:[가-힣\s]{0,8}?)"
    r"(?:생성|작성|제작|만든|만들었|만들어|썼|쓴|써|정리|요약|번역|다듬|교정|초안)"
    r"|AI[- ]?(?:generated|written|assisted)|(?:generated|written|created|drafted) (?:by|with|using) (?:AI|ChatGPT|Claude|Gemini)|made with AI",
    re.I)
_JS_SPACE = " \t\n\v\f\r                 　﻿"


def norm_text(t):
    """줄바꿈을 \\n 으로, 폭 없는 문자를 빼고, NFC 로 맞춘 뒤 앞뒤 공백을 뺍니다(사이트 · JS SDK 와 같은 해시)."""
    s = "" if t is None else str(t)
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = _ZW_REMOVE.sub("", s)
    s = unicodedata.normalize("NFC", s)
    return s.strip(_JS_SPACE)


def text_features(text):
    raw = "" if text is None else str(text)
    t = norm_text(raw)
    return {"v": 1, "lib": "py-1.0.0", "kind": "text", "format": "text", "size": len(t),
            "sha256": hashlib.sha256(t.encode("utf-8")).hexdigest(), "zw": bool(_ZW_FLAG.search(raw)), "disclosure": bool(_DISCLOSE.search(t))}


def file_features(path, mcp=None):
    """파일 → {features, pack}. 출처 판독(C2PA · XMP · EXIF · 생성 기록)은 aim-extract(JavaScript)가 하므로 Node.js 가 필요합니다.
    내려받은 aimarker-mcp.mjs 경로를 mcp(또는 환경 변수 AIMARKER_MCP)로 주면 그 파일을, 아니면 npx 로 MCP 꾸러미를 씁니다.
    원본 파일은 이 컴퓨터에서만 읽습니다."""
    mcp = mcp or os.environ.get("AIMARKER_MCP")
    node, npx = shutil.which("node"), shutil.which("npx")
    if mcp and node:
        cmd = [node, mcp, "--features", str(path)]
    elif npx:
        cmd = [npx, "-y", MCP_PKG, "--features", str(path)]
    else:
        raise AIMarkerError("NODE", "파일 출처 판독에는 Node.js 가 필요합니다(https://aimarker.kr/developers/#sdk). 이미 만든 특징값이 있으면 analyze_features · mark_features 를 쓰세요.")
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if r.returncode != 0:
        raise AIMarkerError("FEATURES", (r.stderr or "특징값을 만들지 못했습니다").strip()[:300])
    return json.loads(r.stdout.strip().splitlines()[-1])


def file_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# ---------- 마크 서명(Ed25519 · RFC 8032) 확인: 표준 라이브러리만 ----------
_P = 2 ** 255 - 19
_L = 2 ** 252 + 27742317777372353535851937790883648493
_D = -121665 * pow(121666, _P - 2, _P) % _P
_I = pow(2, (_P - 1) // 4, _P)


def _x(y, sign):
    if y >= _P:
        return None
    x2 = (y * y - 1) * pow(_D * y * y + 1, _P - 2, _P) % _P
    if x2 == 0:
        return None if sign else 0
    x = pow(x2, (_P + 3) // 8, _P)
    if (x * x - x2) % _P:
        x = x * _I % _P
    if (x * x - x2) % _P:
        return None
    if (x & 1) != sign:
        x = _P - x
    return x


_BY = 4 * pow(5, _P - 2, _P) % _P
_B = (_x(_BY, 0), _BY, 1, _x(_BY, 0) * _BY % _P)


def _add(p, q):
    a = (p[1] - p[0]) * (q[1] - q[0]) % _P
    b = (p[1] + p[0]) * (q[1] + q[0]) % _P
    c = 2 * p[3] * q[3] * _D % _P
    d = 2 * p[2] * q[2] % _P
    e, f, g, h = b - a, d - c, d + c, b + a
    return (e * f % _P, g * h % _P, f * g % _P, e * h % _P)


def _mul(s, p):
    q = (0, 1, 1, 0)
    while s > 0:
        if s & 1:
            q = _add(q, p)
        p = _add(p, p)
        s >>= 1
    return q


def _dec(b):
    if len(b) != 32:
        return None
    y = int.from_bytes(b, "little")
    sign = y >> 255
    y &= (1 << 255) - 1
    x = _x(y, sign)
    return None if x is None else (x, y, 1, x * y % _P)


def _eq(p, q):
    return (p[0] * q[2] - q[0] * p[2]) % _P == 0 and (p[1] * q[2] - q[1] * p[2]) % _P == 0


def ed25519_verify(pub, msg, sig):
    if len(sig) != 64:
        return False
    a, r = _dec(pub), _dec(sig[:32])
    s = int.from_bytes(sig[32:], "little")
    if a is None or r is None or s >= _L:
        return False
    k = int.from_bytes(hashlib.sha512(sig[:32] + pub + msg).digest(), "little") % _L
    return _eq(_mul(s, _B), _add(r, _mul(k, a)))


def _b64u(s):
    s = str(s)
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


class AIMarker:
    def __init__(self, key, url=DEFAULT_URL, timeout=90):
        self.key = (key or "").strip()
        if not self.key:
            raise AIMarkerError("KEY", "API 키가 필요합니다. https://aimarker.kr/developers/#key")
        self.url, self.timeout = url, timeout

    def call(self, action, **body):
        """모든 요청은 같은 주소로 POST, action 으로 동작을 고릅니다. urllib 은 302 를 GET 으로 따라갑니다."""
        data = json.dumps(dict({k: v for k, v in body.items() if v is not None}, action=action, key=self.key), ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(self.url, data=data, headers={"Content-Type": "text/plain; charset=utf-8"}, method="POST")
        with urllib.request.urlopen(req, timeout=self.timeout) as res:
            raw = res.read().decode("utf-8")
        try:
            j = json.loads(raw)
        except ValueError:
            raise AIMarkerError("HTTP", "AIMarker 응답을 읽지 못했습니다")
        if not j.get("ok"):
            raise AIMarkerError(j.get("code", "ERROR"), j.get("message") or j.get("msg") or "요청을 처리하지 못했습니다", j)
        return j

    # ---------- 핵심: AI 사용 확인 · 마크 ----------
    def analyze_features(self, features, pack=None):
        return self.call("am.analyze", features=features, pack=pack)

    def analyze_text(self, text):
        """글은 해시와 AI 활용 표현 여부만 보냅니다(원문은 보내지 않음)."""
        return self.call("am.analyze", features=text_features(text))

    def analyze_file(self, path):
        x = file_features(path)
        return self.call("am.analyze", features=x["features"], pack=x.get("pack"))

    def analyze_batch(self, items):
        """20건까지 한 번에 확인(발급하지 않음). items: [{"ref": "1", "features": …, "pack": …}] → {"results": [...]}"""
        items = list(items)
        if not items:
            raise AIMarkerError("EMPTY", "items 에 확인할 항목을 넣어 주세요.")
        if len(items) > 20:
            raise AIMarkerError("TOO_MANY", "한 번에 20건까지 보낼 수 있습니다. analyze_files 를 쓰면 알아서 나눕니다.")
        return self.call("am.analyzebatch", items=[{"ref": str(it.get("ref", i)), "features": it["features"], "pack": it.get("pack")} for i, it in enumerate(items)])

    def analyze_files(self, paths, mcp=None):
        """여러 파일을 읽어(Node.js 의 aim-extract) 20건씩(서명 묶음 90만 자) 나눠 확인합니다. 입력 순서대로 돌려줌:
        [{"name", "path", "size", "kind", "sha256", "result"(판정) 또는 "error"}]"""
        rows = []
        for p in paths:
            row = {"name": os.path.basename(str(p)), "path": str(p), "size": 0, "kind": "other", "sha256": "", "result": None, "error": ""}
            try:
                x = file_features(p, mcp=mcp)
                f = x["features"]
                row.update(size=f.get("size", 0), kind=f.get("kind", "other"), sha256=f.get("sha256", ""), _f=f, _p=x.get("pack"))
                row["_pl"] = len(json.dumps(row["_p"])) if row["_p"] else 0
            except AIMarkerError as e:
                row["error"] = str(e)
            rows.append(row)
        todo, batches, cur, budget = [r for r in rows if "_f" in r], [], [], 900000
        for r in todo:
            if cur and (len(cur) >= 20 or r["_pl"] > budget):
                batches.append(cur); cur, budget = [], 900000
            cur.append(r); budget -= r["_pl"]
        if cur:
            batches.append(cur)
        stop = ""
        for b in batches:
            if stop:
                for r in b:
                    r["error"] = stop
                continue
            try:
                res = self.call("am.analyzebatch", items=[{"ref": str(k), "features": r["_f"], "pack": r["_p"]} for k, r in enumerate(b)])
                for k, x in enumerate(res.get("results", [])):
                    r = b[int(x.get("ref", k))]
                    if x.get("ok"):
                        r["result"] = x
                    elif x.get("code") in ("TIME", "PACK_BUDGET"):
                        try:
                            r["result"] = self.call("am.analyze", features=r["_f"], pack=r["_p"])
                        except AIMarkerError as e2:
                            r["error"] = str(e2)
                    else:
                        r["error"] = x.get("msg") or x.get("code") or "확인하지 못했습니다"
            except AIMarkerError as e:
                if e.code in ("QUOTA", "BUSY", "KEY"):
                    stop = str(e)
                for r in b:
                    r["error"] = str(e)
        for r in rows:
            for k in ("_f", "_p", "_pl"):
                r.pop(k, None)
        return rows

    def mark_features(self, features, pack=None, label="auto", tools=None, title="", issuer="", confirm=False):
        """label: auto(근거로 정함, 없으면 DECLARE) | ai_generated | ai_edited | ai_assisted | no_ai
        근거와 맞지 않으면 CONFLICT, 비슷한 이미지에 AI 마크가 있으면 CONFIRM(사용자 확인 뒤 confirm=True)."""
        if label == "auto":
            a = self.call("am.analyze", features=features, pack=pack)
            v = a.get("verdict") or {}
            if not v.get("suggest"):
                raise AIMarkerError("DECLARE", "파일에 AI 사용 근거가 없어 표시를 자동으로 정할 수 없습니다. 사용자에게 AI 사용 여부를 물어 label 을 정해 주세요.", {"allowed": v.get("allowed", list(LABELS)), "analysis": a})
            label = v["suggest"]
        return self.call("am.mark", features=features, pack=pack, label=label, tools=list(tools or []), title=title, issuer=issuer, confirm=bool(confirm))

    def mark_text(self, text, label, tools=None, title="", issuer="", confirm=False):
        """글 마크. 글은 파일 기록이 없으므로 label 을 정해 주세요(근거: 발급자 신고)."""
        return self.mark_features(text_features(text), None, label=label, tools=tools, title=title, issuer=issuer, confirm=confirm)

    def mark_file(self, path, label="auto", tools=None, title="", issuer="", confirm=False):
        x = file_features(path)
        return self.mark_features(x["features"], x.get("pack"), label=label, tools=tools, title=title, issuer=issuer, confirm=confirm)

    def mark_batch(self, items, issuer=""):
        """items: [{"features": …, "pack": …, "label": "auto", "tools": [], "title": "", "ref": ""}] 20개까지"""
        return self.call("am.markbatch", items=list(items)[:20], issuer=issuer)

    def mark_info(self, id):
        return self.call("am.markinfo", id=id)

    def lookup(self, sha256=None, dhash=None):
        return self.call("am.lookup", sha256=sha256, dhash=dhash)

    def find_marks(self, path):
        """파일의 SHA-256 으로 같은 파일 · 표시본의 마크를 찾습니다(비슷한 이미지는 dhash 가 있어야 함)."""
        return self.lookup(sha256=file_sha256(path))

    def mark_edit(self, id, key, label=None, title=None, issuer=None, alt=None, revoke=None):
        return self.call("am.markedit", id=id, mkey=key, label=label, title=title, issuer=issuer, alt=alt, revoke=revoke)  # API 키는 key, 관리 키는 mkey

    def pubkey(self):
        return self.call("am.pubkey")

    def anchor(self, date=None, id=None):
        return self.call("am.anchor", date=date, id=id)

    @staticmethod
    def verify_mark(jws, keys=None):
        """마크 서명(JWS · EdDSA)을 공개키로 확인합니다. keys 를 주지 않으면 aimarker.kr 공개키를 받습니다.
        돌려줌: {"ok": bool, "kid": str, "payload": dict | None, "reason": str}"""
        out = {"ok": False, "kid": "", "payload": None, "reason": ""}
        parts = str(jws or "").split(".")
        if len(parts) != 3:
            out["reason"] = "format"
            return out
        try:
            head, body = json.loads(_b64u(parts[0])), json.loads(_b64u(parts[1]))
        except Exception:
            out["reason"] = "format"
            return out
        out["kid"], out["payload"] = head.get("kid", ""), body
        if head.get("alg") != "EdDSA":
            out["reason"] = "alg"
            return out
        if keys is None:
            with urllib.request.urlopen(KEYS_URL, timeout=30) as res:
                keys = json.loads(res.read().decode("utf-8")).get("keys", [])
        k = next((x for x in keys if x.get("kid") == head.get("kid") and x.get("crv") == "Ed25519"), None)
        if not k:
            out["reason"] = "unknown_key"
            return out
        if body.get("iss") != "https://aimarker.kr":
            out["reason"] = "issuer"
            return out
        out["ok"] = ed25519_verify(_b64u(k["x"]), (parts[0] + "." + parts[1]).encode("ascii"), _b64u(parts[2]))
        if not out["ok"]:
            out["reason"] = "signature"
        return out

    # ---------- 부가 기능: 광고 문구 검수 · 승인 · 원장 ----------
    def check(self, text, ind="", flags=None, guide=None):
        """ind: auto|gen|food|hfood|cos|med|fin · flags: {sponsored, aiPerson, aiMedia} · guide: {ban: [], must: []}"""
        r = self.call("am.check", text=text, ind="" if ind == "auto" else ind, flags=flags or {}, guide=guide)
        r["text"] = text
        return r

    def auto(self, text, ind="", flags=None, guide=None, stamp=False):
        """검수 · 고치기 · 다시 검수를 서버에서 끝까지(outcome: pass | fixed | return)"""
        return self.call("am.auto", text=text, ind="" if ind == "auto" else ind, flags=flags or {}, guide=guide, stamp=bool(stamp))

    def batch(self, items, guide=None):
        return self.call("am.batch", items=[dict(it, ind="" if it.get("ind") in (None, "auto") else it["ind"]) for it in items], guide=guide)

    def label(self, kind, level="gen"):
        return self.call("am.label", kind=kind, level=level)

    def geo(self, url):
        """GEO 진단: AI 검색 준비 점수 · 고칠 코드 · (상품 쪽이면) AI 상품 피드"""
        return self.call("am.geo", url=str(url or ""))

    def detect(self, text, sentences=True, pass_code=None):
        """AI 작성 추정률(추정 · 판정 아님 · 같은 글은 같은 값). 글은 서버에서 저장하지 않음. 6,000자까지.
        무료 키는 맛보기(앞 3,000자 · 의심 문장 2개), pass_code(개인 이용권 코드)나 유료 키면 문장별 전체"""
        extra = {"pass": str(pass_code)} if pass_code else {}
        return self.call("am.detect", text=str(text or ""), sentences=bool(sentences), **extra)

    def scan(self, url):
        return self.call("am.scan", url=url)

    def status(self, ids):
        return self.call("am.status", ids=list(ids))

    def stamp(self, content, kind="report", count=None):
        """내용 대신 SHA-256 만 보내 증거 원장에 남깁니다."""
        return self.call("am.stamp", h=self.sha256(content), k=kind, n=count)

    def verify(self, id=None, content=None, sha256=None):
        return self.call("am.verify", id=id) if id else self.call("am.verify", h=sha256 or self.sha256(content))

    @staticmethod
    def sha256(s):
        return hashlib.sha256(s if isinstance(s, (bytes, bytearray)) else str(s).encode("utf-8")).hexdigest()

    @staticmethod
    def apply_fixes(text, findings):
        """바꿀 말이 있는 후보와 빠진 표시만 반영합니다(빼기 · 바꿀 말 없는 후보는 사람에게 남김)."""

        def fix(t, f, rep):
            if f["s"] >= 0:
                if t[f["s"]:f["e"]] != f["t"]:
                    return t
                b = f["re"] if (f.get("re") or 0) >= f["e"] else f["e"]
                return re.sub(r" ([,.!?])", r"\1", re.sub(r"[ \t]{2,}", " ", t[:f["s"]] + rep + t[b:]))
            if rep.strip() in t:
                return t
            if rep[:1] in "[(":
                m = re.match(r"\s*", t).group(0)
                return m + rep + t[len(m):]
            return t.rstrip() + rep

        at = float("inf")
        spans = [f for f in findings if f["s"] >= 0 and any(r and r != "(삭제)" for r in f.get("reps", []))]
        for f in sorted(spans, key=lambda x: -x["s"]):
            if (f.get("re") or f["e"]) > at:
                continue
            rep = [r for r in f["reps"] if r and r != "(삭제)"][0]
            t2 = fix(text, f, rep)
            if t2 != text:
                text, at = t2, f["s"]
        for f in findings:
            if f["s"] < 0 and f.get("reps") and f["reps"][0]:
                text = fix(text, f, f["reps"][0])
        return text
