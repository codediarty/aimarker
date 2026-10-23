<div class="hz12" id="hz">
  <ol class="hz12-steps" id="hzSteps" aria-label="진행 순서">
    <li class="on" data-step="1"><i>1</i><span>글 넣기</span></li>
    <li data-step="2"><i>2</i><span class="f">AI 작성률 확인</span><span class="s">검사</span></li>
    <li data-step="3"><i>3</i><span class="f">자연스럽게 다듬기</span><span class="s">다듬기</span></li>
  </ol>
  <div class="hz12-card">
    <div class="hz12-in" id="hzIn">
      <div class="hz12-drop" id="hzDrop">
        <label class="k-sr" for="hzText">검사할 글</label>
        <textarea id="hzText" maxlength="50000" spellcheck="false" placeholder="검사할 글을 붙여 넣으세요"></textarea>
        <div class="hz12-empty" id="hzEmpty">
          <button type="button" class="hz12-up" id="hzPick">{{ico:upload}}<span>파일 올리기</span></button>
          <p class="dnd">또는 여기로 끌어다 놓으세요</p>
          <p class="fmt">한글(HWP, HWPX), 워드(DOCX), PDF, 텍스트</p>
        </div>
        <div class="hz12-over" aria-hidden="true">{{ico:upload}}<span>놓으면 글을 꺼내 옵니다</span></div>
        <div class="hz12-busy" id="hzBusy" hidden><span class="ds-spin" aria-hidden="true"></span><span id="hzBusyT">파일에서 글을 꺼내는 중</span></div>
      </div>
      <input type="file" id="hzFile" class="k-sr" tabindex="-1" aria-hidden="true" aria-label="파일 올리기" accept=".hwp,.hwpx,.docx,.pdf,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
      <div class="hz12-bar">
        <div class="hz12-file" id="hzFileChip" hidden></div>
        <div class="hz12-ex" id="hzEx" role="group" aria-label="예시 글로 해 보기"><span>예시</span><button type="button" data-ex="report">레포트</button><button type="button" data-ex="essay">자기소개서</button><button type="button" data-ex="blog">블로그</button></div>
        <span class="hz12-cnt"><b id="hzCount">0</b>자<span class="lim" id="hzLimit"> / 무료 6,000자</span></span>
      </div>
    </div>
    <div class="hz12-sum" id="hzSum" hidden></div>
    <div class="hz12-go" id="hzGo">
      <button class="k-btn k-btn-p k-btn-lg hz12-run" type="button" id="hzCheck">{{ico:search}}<span id="hzChkL">AI 작성률 무료 검사</span><em class="hz7-pill" id="hzChkTag" hidden></em></button>
      <button class="k-btn k-btn-l k-btn-lg hz12-run2" type="button" id="hzPro" hidden>{{ico:pen}}<span>휴머나이징</span><em class="hz7-pill" id="hzProTag"></em></button>
      <p class="hz12-note" id="hzNote">{{ico:lock}}<span>가입 없이 무료 · 글과 파일은 저장하지 않습니다</span></p>
      <div class="hz7-pass hz12-pass" id="hzPass" aria-live="polite"></div>
    </div>
  </div>
  <p class="k-sr" id="hzStat" role="status" aria-live="polite"></p>
  <div class="hz12-out" id="hzOut"></div>
</div>

<dialog class="hz7-dlg" id="hzBuy" aria-labelledby="hzBuyT">
  <form method="dialog" class="hz7-dlg-x"><button type="submit" aria-label="닫기">{{ico:x}}</button></form>
  <div class="hz7-dlg-b" id="hzBuyBody">
    <h2 id="hzBuyT">토큰 충전</h2>
    <p class="hz12-need" id="hzBuyNeed" hidden></p>
    <form id="hzBuyForm" novalidate>
      <fieldset class="hz7-to" hidden></fieldset>
      <fieldset class="hz7-prod"><legend class="sr">충전할 토큰</legend>
        <label><input type="radio" name="product" value="c3"><span><b>300토큰</b><em>3,000원</em><small>300토큰 · 3,000자 글 검사와 휴머나이징 약 1번</small></span></label>
        <label><input type="radio" name="product" value="c10" checked><span><b>1,100토큰</b><em>10,000원</em><small>1,000토큰 + 100토큰 더 · 3,000자 글 검사와 휴머나이징 약 6번</small></span></label>
        <label class="best"><input type="radio" name="product" value="c30"><span><b>3,500토큰<i>추천</i></b><em>30,000원</em><small>3,000토큰 + 500토큰 더 · 3,000자 글 검사와 휴머나이징 약 19번</small></span></label>
        <label><input type="radio" name="product" value="c50"><span><b>6,000토큰</b><em>50,000원</em><small>5,000토큰 + 1,000토큰 더 · 3,000자 글 검사와 휴머나이징 약 33번</small></span></label>
      </fieldset>
      <div class="field"><label for="hzBuyMail">토큰 코드, 영수증을 받을 이메일 <em>필수</em></label><input class="inp" id="hzBuyMail" name="contact" type="email" inputmode="email" autocomplete="email" maxlength="80" required placeholder="name@example.com"></div>
      <label class="consent"><input type="checkbox" name="agree"><span>쓴 토큰과 더 받은 토큰은 환불되지 않고, 쓰고 남은 유료 토큰은 충전한 날부터 7일 안에는 그대로, 그 뒤에는 10%를 뺀 금액만 환불된다는 것(유효기간 5년)을 확인했고, 토큰 약관과 주문 확인, 코드와 영수증 발송을 위한 이메일 수집에 동의합니다. <a href="{{root}}terms/#pass" target="_blank" rel="noopener">이용약관</a>, <a href="{{root}}privacy/" target="_blank" rel="noopener">개인정보처리방침</a></span></label>
      <input class="hp" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-p btn-l" type="submit"><span>주문하기</span></button>
      <p class="msg" role="status"></p>
      <p class="hz7-dlg-n" id="hzBuyNote">주문하면 결제 안내를 메일로 드리고, 결제가 확인되면 토큰 코드를 메일로 보내 드립니다.</p>
      <p class="hz7-dlg-n">가격은 부가세 포함입니다. 결제는 공식 결제처 성균관컨설팅에서 하며, 카드 명세서에는 성균관컨설팅으로 표시됩니다. 미성년자는 법정대리인의 동의를 받아 구매해 주세요(동의 없는 구매는 취소할 수 있습니다). 운영 성균관컨설팅(대표 이채연), 사업자등록번호 272-32-01885, 통신판매업 신고 제2026-경기송탄-0622, 문의 contact@skkc.co.kr</p>
    </form>
  </div>
</dialog>

<dialog class="hz7-dlg" id="hzCode" aria-labelledby="hzCodeT">
  <form method="dialog" class="hz7-dlg-x"><button type="submit" aria-label="닫기">{{ico:x}}</button></form>
  <div class="hz7-dlg-b">
    <h2 id="hzCodeT">토큰 코드 넣기</h2>
    <form id="hzCodeForm" novalidate>
      <div class="field"><label for="hzCodeIn">메일로 받은 16자리 코드</label><input class="inp hz7-code-in" id="hzCodeIn" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX"></div>
      <button class="btn btn-p btn-l" type="submit">코드 넣기</button>
      <p class="msg" role="status"></p>
      <p class="hz7-dlg-n">코드는 이 브라우저에만 저장됩니다. 다른 기기에서는 코드를 다시 넣어 주세요. 예전에 산 이용권 코드도 여기에 넣습니다. 코드가 없나요? <button type="button" class="hz7-link" data-buy="c10">토큰 충전</button></p>
    </form>
  </div>
</dialog>
