# 13.8 검색 수요 키워드 안내 페이지를 _src/pages/ 에 만듭니다(13.8 여섯 개 + 13.12 네 개: 카피킬러 · AI 표절률 · AI 티 · 프롬프트).
# 쓰는 법: python3 _src/tools/lp138.py  → 그다음 python3 _src/build.py
# 페이지 글은 lp138_a.py · lp138_b.py · lp138_c.py 에 있습니다. 공통 조각은 _src/pages/lp-*.inc 입니다.
# 13.12 머리 주석에 crumb(빵 부스러기 이름) · updated(고친 날, 구조화 데이터 dateModified 와 '업데이트' 줄)를 넣습니다.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lp138_a import PAGES as A
from lp138_b import PAGES as B
from lp138_c import PAGES as C
UPDATED = "2026-10-28"

HEAD = """<!--
path: {path}
key: {key}
v9: 1
title: {title}
ogtitle: {ogtitle}
desc: {desc}
crumb: {crumb}
crumb_parent: humanize/|AI 휴머나이징
updated: {updated}
scripts: assets/textin.js, assets/humanize.js
styles: assets/humanize.css, assets/hz12.css
selflabel: footer
-->
"""

HERO = """<section class="hz12-hero hz13 hz15 lp-hero" id="top" aria-labelledby="h1">
  <div class="hz13-bg" aria-hidden="true"><i class="g1"></i><i class="g2"></i><i class="g3"></i><span class="grid"></span><span class="fade"></span></div>
  <div class="k-wrap">
    <div class="hz15-grid" id="hzHero">
      <div class="hz15-l" id="tool">
        <div class="hz12-hd hz15-hd">
          <p class="hz12-k">{{{{ico:fingerprint}}}}{eyebrow}</p>
          <h1 class="hz12-h1" id="h1">{h1}</h1>
          <p class="lp-sub">{sub}</p>
        </div>
{{{{inc:hz-tool.inc}}}}
      </div>
      <div class="hz15-r">
{{{{inc:hz-stage.inc}}}}
      </div>
    </div>
  </div>
</section>

{{{{inc:lp-links.inc}}}}

<section class="k-sec lp-ans" id="answer" aria-labelledby="ansT">
  <div class="k-wrap">
    <div class="lp-ans-b">
      <p class="lp-k">한 줄 답</p>
      <h2 class="k-h2" id="ansT">{ans_h}</h2>
      <p class="k-lead">{ans_p}</p>
      <ul class="lp-pts">{ans_pts}</ul>
      <p class="lp-upd"><time datetime="{updated}">{updated_k}</time> 업데이트 · AIMarker 편집</p>
    </div>
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

<section class="k-cta" aria-labelledby="cTitle">
  <div class="k-wrap ds-cta2">
    <div class="ds-cta-b">
      <h2 class="k-h2" id="cTitle">{cta_h}</h2>
      <p class="k-lead">{cta_p}</p>
      <div class="k-acts"><a class="k-btn k-btn-p k-btn-lg" href="#top" data-focus="hzText">AI 작성률 무료 검사</a><a class="k-btn k-btn-l k-btn-lg" href="{{{{root}}}}pricing/#credits">토큰 충전 보기</a></div>
    </div>
    <div class="ds-cta-c">
      <p class="k-prod-k">{{{{ico:fingerprint}}}}함께 보면 좋은 안내</p>
      <p class="k-p">{rel}</p>
    </div>
  </div>
</section>
"""


def faq_html(items):
    return "\n".join('      <details><summary>%s</summary><p>%s</p></details>' % (q, a) for q, a in items)


def main():
    out = os.path.join(HERE, "..", "pages")
    y, m, d = UPDATED.split("-")
    for p in A + B + C:
        p = dict(p, updated=p.get("updated", UPDATED))
        body = HEAD.format(**p) + HERO.format(eyebrow=p["eyebrow"], h1=p["h1"], sub=p["sub"], ans_h=p["ans_h"], ans_p=p["ans_p"],
                                              ans_pts="".join("<li>%s</li>" % x for x in p["ans_pts"]), updated=p["updated"],
                                              updated_k="%s년 %d월 %d일" % (y, int(m), int(d)))
        body += "\n" + p["mid"] + "\n\n{{inc:lp-pat.inc}}\n\n{{inc:lp-steps.inc}}\n\n{{inc:lp-diff.inc}}\n\n"
        body += FAQ.format(faq=faq_html(p["faq"]), cta_h=p["cta_h"], cta_p=p["cta_p"], rel=p["rel"])
        fn = os.path.join(out, p["key"] + ".html")
        with open(fn, "w", encoding="utf-8") as f:
            f.write(body)
        print("wrote", os.path.relpath(fn, os.path.join(HERE, "..", "..")), len(body))


if __name__ == "__main__":
    main()
