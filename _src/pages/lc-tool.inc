<section class="k-sec lc-sec" id="tool" aria-labelledby="lcT">
  <div class="k-wrap">
    <div class="k-head">
      <p class="k-eyebrow">{{ico:radar}}자세한 진단 · AI 가게 페이지 무료로 만들기</p>
      <h2 class="k-h2" id="lcT">빈칸을 채우면, AI가 읽는 가게 페이지가 바로 생깁니다</h2>
      <p class="k-lead">가게 정보를 넣는 만큼 점수가 바로 오르고, 손님 질문에 답할 수 있는 개수가 늘어납니다. AI가 읽는 가게 페이지와 구조화 데이터를 그 자리에서 만들어 드리고, 결제하신 분은 여기서 받은 '가게 정보 파일'만 회신하면 됩니다. <button type="button" class="k-a lc-lq" data-lq>먼저 30초 진단부터 하기</button></p>
    </div>
    <div class="lc" id="lcTool" data-ind="{{lc_ind}}">
      <form class="lc-form" id="lcForm" novalidate autocomplete="off">
        <p class="lc-pill" id="lcPill" hidden aria-hidden="true"></p>
        <details class="lc-step" id="s1" open>
          <summary><span class="n">1</span><span class="tt">가게 기본 정보<small>이것만 넣어도 점수가 나옵니다</small></span><span class="lc-gain"></span></summary>
          <div class="lc-body">
            <div class="lc-row">
              <div class="field"><label for="f-ind">업종</label><select class="sel" id="f-ind" name="ind"></select></div>
              <div class="field" id="f-subw" hidden><label for="f-sub">세부 업종</label><select class="sel" id="f-sub" name="sub"></select></div>
            </div>
            <div class="lc-row">
              <div class="field"><label for="f-name">가게 이름 <em>필수</em></label><input class="inp" id="f-name" name="name" maxlength="60" placeholder="예: 봄결 네일"></div>
              <div class="field"><label for="f-area">동네 · 가까운 역</label><input class="inp" id="f-area" name="area" maxlength="30" placeholder="예: 강남역, 분당 정자동"></div>
            </div>
            <div class="field"><label for="f-addr">도로명 주소</label><input class="inp" id="f-addr" name="addr" maxlength="160" placeholder="예: 서울 강남구 테헤란로 123, 4층"></div>
            <div class="lc-row">
              <div class="field"><label for="f-tel">전화번호</label><input class="inp" id="f-tel" name="tel" maxlength="30" inputmode="tel" placeholder="예: 02-555-1234"></div>
              <div class="field"><label for="f-addr2">찾아오는 길 <small>선택</small></label><input class="inp" id="f-addr2" name="addr2" maxlength="160" placeholder="예: 강남역 3번 출구에서 걸어서 4분"></div>
            </div>
            <div class="lc-warn" id="lcWarn" hidden><b>업종 주의</b><p></p></div>
          </div>
        </details>
        <details class="lc-step" id="s2">
          <summary><span class="n">2</span><span class="tt"><span data-t="hw">영업시간</span><small>'일요일에 여는 곳' 같은 질문에 답합니다</small></span><span class="lc-gain"></span></summary>
          <div class="lc-body">
            <div class="lc-hours" id="lcHours"></div>
            <div class="lc-row">
              <div class="field"><label for="f-brk">점심 · 쉬는 시간 <small>선택</small></label><input class="inp" id="f-brk" name="brk" maxlength="40" placeholder="예: 13:00-14:00"></div>
              <div class="field"><label for="f-off">쉬는 날 안내 <small>선택</small></label><input class="inp" id="f-off" name="off" maxlength="80" placeholder="예: 설 · 추석 당일"></div>
            </div>
          </div>
        </details>
        <details class="lc-step" id="s3">
          <summary><span class="n">3</span><span class="tt"><span data-t="itemsT">대표 서비스와 가격</span><small>'얼마야?'에 답합니다</small></span><span class="lc-gain"></span></summary>
          <div class="lc-body">
            <div class="lc-items" id="lcItems"></div>
            <div class="field" data-for="cuisine" hidden><label for="f-cuisine">음식 종류</label><input class="inp" id="f-cuisine" name="cuisine" maxlength="40" placeholder="예: 한식, 고기, 일식"></div>
            <div class="field" data-for="fee" hidden><label for="f-fee">교습비 <em>학원법</em></label><input class="inp" id="f-fee" name="fee" maxlength="200" placeholder="예: 중등 월 38만 원(주 3회), 고등 월 45만 원(주 3회)"></div>
            <div class="field" data-for="areaServed" hidden><label for="f-area2">일하는 지역</label><input class="inp" id="f-area2" name="area2" maxlength="120" placeholder="예: 서울 서초구, 강남구, 경기 과천시"></div>
            <div class="lc-row" data-for="stay" hidden>
              <div class="field"><label for="f-checkin">체크인</label><input class="inp" type="time" id="f-checkin" name="checkin" step="1800"></div>
              <div class="field"><label for="f-checkout">체크아웃</label><input class="inp" type="time" id="f-checkout" name="checkout" step="1800"></div>
            </div>
          </div>
        </details>
        <details class="lc-step" id="s4">
          <summary><span class="n">4</span><span class="tt">손님이 자주 묻는 것<small>주차 · 예약 · 편의, 되는 것만 고르세요</small></span><span class="lc-gain"></span></summary>
          <div class="lc-body">
            <div class="lc-feat picks" id="lcFeat"></div>
            <div class="field"><label for="f-note">참고 · 안 되는 것 <small>선택</small></label><input class="inp" id="f-note" name="note" maxlength="200" placeholder="예: 건물 지하 주차장 2시간 무료, 반려동물은 안 됩니다"></div>
          </div>
        </details>
        <details class="lc-step" id="s5">
          <summary><span class="n">5</span><span class="tt">손님이 우리를 찾는 곳<small>플레이스 · 지도 · SNS · 예약 링크</small></span><span class="lc-gain"></span></summary>
          <div class="lc-body">
            <div class="lc-row">
              <div class="field"><label for="l-place">네이버 플레이스 주소</label><input class="inp" id="l-place" name="l-place" maxlength="300" inputmode="url" spellcheck="false" placeholder="naver.me/… 또는 map.naver.com/…"></div>
              <div class="field"><label for="l-kakao">카카오맵 주소</label><input class="inp" id="l-kakao" name="l-kakao" maxlength="300" inputmode="url" spellcheck="false" placeholder="place.map.kakao.com/…"></div>
            </div>
            <div class="lc-row">
              <div class="field"><label for="l-google">구글 지도 주소</label><input class="inp" id="l-google" name="l-google" maxlength="300" inputmode="url" spellcheck="false" placeholder="maps.app.goo.gl/…"></div>
              <div class="field"><label for="l-book">예약 링크</label><input class="inp" id="l-book" name="l-book" maxlength="300" inputmode="url" spellcheck="false" placeholder="네이버 예약 · 캐치테이블 · 카카오 예약 등"></div>
            </div>
            <div class="lc-row">
              <div class="field"><label for="l-home">홈페이지 <small>있으면</small></label><input class="inp" id="l-home" name="l-home" maxlength="300" inputmode="url" spellcheck="false" placeholder="mystore.co.kr"></div>
              <div class="field"><label for="l-insta">인스타그램 · 블로그</label><input class="inp" id="l-insta" name="l-insta" maxlength="300" inputmode="url" spellcheck="false" placeholder="instagram.com/…"></div>
            </div>
          </div>
        </details>
        <details class="lc-step" id="s6">
          <summary><span class="n">6</span><span class="tt">소개와 사업자 정보<small>AI가 믿을 근거, 선택</small></span><span class="lc-gain"></span></summary>
          <div class="lc-body">
            <div class="field"><label for="f-about">사장님 한 줄 소개 <small>선택</small></label><textarea class="txt lc-ta" id="f-about" name="about" maxlength="300" rows="2" placeholder="예: 예약한 시간에 한 분만 받습니다. 재료는 매일 아침 들여옵니다."></textarea></div>
            <div class="lc-row">
              <div class="field"><label for="b-owner">대표자 이름 <small>선택</small></label><input class="inp" id="b-owner" name="b-owner" maxlength="40"></div>
              <div class="field"><label for="b-no">사업자등록번호 <small>선택</small></label><input class="inp" id="b-no" name="b-no" maxlength="40" inputmode="numeric"></div>
            </div>
            <div class="field" data-for="reg" hidden><label for="b-reg">중개사무소 등록번호 <em>공인중개사법</em></label><input class="inp" id="b-reg" name="b-reg" maxlength="40" placeholder="예: 제41135-2026-00001호"></div>
          </div>
        </details>
        <div class="lc-go"><button class="k-btn k-btn-p k-btn-lg" type="submit">AI 가게 페이지 만들기{{ico:arrow}}</button><span>입력한 내용은 이 브라우저 안에서만 계산하고 서버로 보내지 않습니다(이 브라우저에만 임시 저장).</span></div>
      </form>
      <aside class="lc-side" id="lcSide" aria-label="AI 검색 준비도"></aside>
      <p class="k-sr" id="lcLive" aria-live="polite"></p>
    </div>
    <div class="lc-out" id="lcOut" hidden></div>
  </div>
</section>
