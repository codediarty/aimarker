    <div class="calc" data-calc>
      <div class="calc-in">
        <div class="cf"><label for="cN">월 콘텐츠 수<output id="cNo">10,000건</output></label><input type="range" id="cN" min="500" max="100000" step="500" value="10000"></div>
        <div class="cf"><label for="cM">건당 수작업 검수 시간<output id="cMo">3분</output></label><input type="range" id="cM" min="1" max="15" step="0.5" value="3"></div>
        <div class="cf"><label for="cW">검수 인건비(시간당)<output id="cWo">25,000원</output></label><input type="range" id="cW" min="12000" max="80000" step="1000" value="25000"></div>
        <div class="cf"><label for="cA">자동화율<output id="cAo">50%</output></label><input type="range" id="cA" min="10" max="90" step="5" value="50"><small>사람이 다시 보지 않아도 되는 검수 작업의 비율</small></div>
        <div class="cf"><label for="cC">월 도입 비용<output id="cCo">490,000원</output></label><input type="range" id="cC" min="0" max="3000000" step="10000" value="490000"><small id="cCp">추천 상품 Agency 예상 요금 기준 · 움직이면 직접 정한 값으로 계산</small></div>
      </div>
      <div class="calc-out">
        <div class="co-big"><small>한 달 예상 절감</small><b id="cSave">5,760,000원</b><span id="cSaveY">한 해 69,120,000원</span></div>
        <div class="co-bars">
          <div class="cb"><span>지금</span><i><s id="cbNow" style="width:100%"></s></i><b id="cNow">12,500,000원</b></div>
          <div class="cb a"><span>도입 뒤</span><i><s id="cbAfterH" style="width:50%"></s><s class="fee" id="cbAfterF" style="width:3.9%"></s></i><b id="cAfter">6,740,000원</b></div>
        </div>
        <dl class="co-rows">
          <div><dt>한 달 검수 시간</dt><dd id="cHours">500시간 → 250시간</dd></div>
          <div><dt>도입 비용 대비</dt><dd id="cRoi">11.8배</dd></div>
          <div><dt>추천 상품</dt><dd id="cPlan">Agency</dd></div>
        </dl>
        <p class="co-note">예시 계산이며 실제 절감액을 보장하지 않습니다. 자동화율은 파일럿에서 실제 값으로 함께 잽니다. 부가세 별도.</p>
        <a class="btn btn-w" href="{{root}}contact/">이 숫자로 도입 상담{{ico:arrow}}</a>
      </div>
    </div>