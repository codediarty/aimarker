<div class="arch" data-arch>
      <div class="arch-io arch-in"><b>들어오는 것</b><ul><li>이미지 · 영상 파일</li><li>광고 문구 · 상세페이지</li><li>외주 납품물</li><li>업로드 이벤트 · API 요청</li><li>기업 정책 · 브랜드 가이드</li></ul></div>
      <div class="arch-v" aria-hidden="true"></div>
      <div class="arch-wf">
        <button type="button" class="eng eng-wf" data-eng="workflow" aria-pressed="false"><i>{{ico:flow}}</i><span><b>Workflow Engine</b><small>업로드 감지 · 검수 요청 · 승인 · 게시 · 보고서 · API</small></span></button>
        <div class="arch-row">
          <button type="button" class="eng" data-eng="origin" aria-pressed="true"><i>{{ico:scanx}}</i><span><b>Origin Engine</b><small>출처 · 생성 이력</small></span></button>
          <span class="arch-arw" aria-hidden="true"></span>
          <button type="button" class="eng" data-eng="fingerprint" aria-pressed="false"><i>{{ico:fingerprint}}</i><span><b>Fingerprint Engine</b><small>변형 · 재유통 추적</small></span></button>
          <span class="arch-arw" aria-hidden="true"></span>
          <button type="button" class="eng" data-eng="policy" aria-pressed="false"><i>{{ico:scroll}}</i><span><b>Policy Engine</b><small>정책 · 규칙 적용</small></span></button>
          <span class="arch-arw" aria-hidden="true"></span>
          <span class="arch-human"><i>{{ico:user}}</i><span><b>사람 판단</b><small>애매한 것만 검수 · 승인</small></span></span>
        </div>
      </div>
      <div class="arch-v" aria-hidden="true"></div>
      <button type="button" class="eng eng-ledger" data-eng="ledger" aria-pressed="false"><i>{{ico:ledger}}</i><span><b>Evidence Ledger</b><small>모든 판단 · 승인 · 정책 버전을 해시와 서버 시각으로</small></span></button>
      <div class="arch-v" aria-hidden="true"></div>
      <div class="arch-io arch-out"><b>나가는 것</b><ul><li>위험 후보 · 근거 · 바꿀 말</li><li>승인 · 반려 기록</li><li>보이는 표시 · 파일 속 기록</li><li>보고서 · 증거 패키지</li><li>API 응답 · Webhook</li></ul></div>
    </div>
    <div class="eng-panel" id="engPanel" aria-live="polite"></div>
