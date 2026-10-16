"""AIMarker SDK for Python 0.9.0(베타) · https://aimarker.kr/developers/#sdk

표준 라이브러리만 씁니다(Python 3.8+). 서버에서 쓰고, API 키는 환경 변수에 두세요. MIT

    from aimarker import AIMarker
    am = AIMarker(os.environ["AIMARKER_KEY"])
    r = am.check("부작용 없는 순한 크림", ind="cos")
    if r["decision"] in ("fix", "expert"):
        print(r["findings"], AIMarker.apply_fixes(r["text"], r["findings"]))
"""
import hashlib
import json
import urllib.request

DEFAULT_URL = "https://script.google.com/macros/s/AKfycbw3ZPLXHv92tfNVs7caH-Bf1OvMesqh0RfR8y4LCsT5DaE3otEbGWhyFLIY6FqoBEY/exec"


class AIMarkerError(Exception):
    def __init__(self, code, message):
        super().__init__("[%s] %s" % (code, message))
        self.code = code


class AIMarker:
    def __init__(self, key, url=DEFAULT_URL, timeout=30):
        self.key = (key or "").strip()
        if not self.key:
            raise AIMarkerError("KEY", "API 키가 필요합니다. https://aimarker.kr/developers/#key")
        self.url, self.timeout = url, timeout

    def call(self, action, **body):
        """모든 요청은 같은 주소로 POST, action 으로 동작을 고릅니다. urllib 은 302 를 GET 으로 따라갑니다."""
        data = json.dumps(dict(body, action=action, key=self.key), ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(self.url, data=data, headers={"Content-Type": "text/plain; charset=utf-8"}, method="POST")
        with urllib.request.urlopen(req, timeout=self.timeout) as res:
            raw = res.read().decode("utf-8")
        try:
            j = json.loads(raw)
        except ValueError:
            raise AIMarkerError("HTTP", "AIMarker 응답을 읽지 못했습니다")
        if not j.get("ok"):
            raise AIMarkerError(j.get("code", "ERROR"), j.get("message", "요청을 처리하지 못했습니다"))
        return j

    def check(self, text, ind="", flags=None, guide=None):
        """ind: auto|gen|food|hfood|cos|med|fin · flags: {sponsored, aiPerson, aiMedia} · guide: {ban: [], must: []}"""
        body = {"text": text, "ind": "" if ind == "auto" else ind, "flags": flags or {}}
        if guide:
            body["guide"] = guide
        r = self.call("am.check", **body)
        r["text"] = text
        return r

    def batch(self, items, guide=None):
        body = {"items": [dict(it, ind="" if it.get("ind") in (None, "auto") else it["ind"]) for it in items]}
        if guide:
            body["guide"] = guide
        return self.call("am.batch", **body)

    def label(self, kind, level="gen"):
        return self.call("am.label", kind=kind, level=level)

    def scan(self, url):
        return self.call("am.scan", url=url)

    def status(self, ids):
        return self.call("am.status", ids=list(ids))

    def stamp(self, content, kind="report", count=None):
        """내용 대신 SHA-256 만 보내 증거 원장에 남깁니다."""
        body = {"h": self.sha256(content), "k": kind}
        if count is not None:
            body["n"] = count
        return self.call("am.stamp", **body)

    def verify(self, id=None, content=None, sha256=None):
        return self.call("am.verify", id=id) if id else self.call("am.verify", h=sha256 or self.sha256(content))

    @staticmethod
    def sha256(s):
        return hashlib.sha256(str(s).encode("utf-8")).hexdigest()

    @staticmethod
    def apply_fixes(text, findings):
        """바꿀 말이 있는 후보와 빠진 표시만 반영합니다(빼기 · 바꿀 말 없는 후보는 사람에게 남김)."""
        import re

        def fix(t, f, rep):
            if f["s"] >= 0:
                if t[f["s"]:f["e"]] != f["t"]:
                    return t
                b = f["re"] if f.get("re", 0) >= f["e"] else f["e"]
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
