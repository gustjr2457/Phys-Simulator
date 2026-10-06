/* [일반물리·열역학] 통계적 엔트로피 — S = ln Ω (에렌페스트 항아리 모형)
   '초급·개념'의 '엔트로피란 무엇인가?'에서 눈으로만 보여준 것을 여기서는
   실제로 센다. N개의 입자가 왼쪽/오른쪽 두 칸을 오가며(각 순간 입자 하나가
   무작위로 칸을 옮겨 다님 — 에렌페스트 모형), 왼쪽에 k개가 있는 거시상태를
   만드는 방법의 수 Ω = C(N,k)를 직접 계산해 S=lnΩ로 나타낸다. 큰 수의
   오버플로를 피하려고 ln(N!) 자체가 아니라 ln(i)들의 합으로 계산한다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { N: '#60a5fa', rate: '#fbbf24', left: '#34d399', right: '#93a2c4', Omega: '#a78bfa', S: '#f472b6' };

  // ln(N!) 을 직접 큰 수로 만들지 않고 ln(i)의 합으로 구해 오버플로를 피한다.
  function lnFact(n) { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; }
  function lnOmega(N, k) { return lnFact(N) - lnFact(k) - lnFact(N - k); }

  PS.register({
    id: 'g-entropy2', mode: 'general', category: '열역학',
    title: '통계적 엔트로피',
    sub: 'S = ln Ω  (Ω = 미시상태의 수)',
    tagline: 'N개의 입자가 왼쪽·오른쪽 칸을 무작위로 오갑니다(에렌페스트 항아리 모형). 왼쪽에 정확히 k개가 있는 "거시상태"를 만들 수 있는 방법의 수 Ω = C(N,k)를 직접 세어, 그 로그값 S = ln Ω가 시간에 따라 어떻게 변하는지 봅니다.',

    params: [
      { key: 'N', symbol: 'N', label: '입자 수', unit: '개', min: 10, max: 50, step: 2, value: 36, color: C.N, reset: true, dec: 0,
        where: '항아리 안 <b>전체 입자 개수</b>입니다. 클수록 "다시 전부 한쪽으로 몰리는" 요동은 사실상 불가능해집니다.' },
      { key: 'rate', symbol: 'λ', label: '칸 이동 시도 빈도', unit: '/s', min: 5, max: 60, step: 5, value: 25, color: C.rate,
        where: '1초에 <b>입자 하나가 칸을 옮겨볼 기회</b>가 몇 번 오는지입니다. 클수록 평형에 더 빨리 도달합니다.' }
    ],
    vars: {
      Omega: { symbol: 'Ω', label: '미시상태 수(경우의 수)', unit: '', color: C.Omega,
        where: '왼쪽 칸에 <b>정확히 k개</b>가 있게 만드는 서로 다른 배치 방법의 수입니다(어느 입자가 왼쪽인지만 다르면 다른 경우로 셈). k=0이나 k=N일 때 Ω=1(방법이 단 하나)이고, k=N/2 근처에서 Ω가 <b>가장 커집니다</b>.' },
      S: { symbol: 'S', label: '통계적 엔트로피', unit: '', color: C.S, where: 'Ω가 너무 커지는 걸 다루기 쉽게 <b>로그를 취한 값</b>입니다. Ω가 커질수록(더 무질서할수록) S도 커집니다.' }
    },
    formulas: [
      { name: '거시상태 k를 만드는 방법의 수', tpl: '{Omega} = N! ⁄ ( k! (N−k)! )' },
      { name: '통계적 엔트로피', tpl: '{S} = ln {Omega}' }
    ],

    init(p) { return { nLeft: p.N, acc: 0, S: 0, Omega: 1, Smax: lnOmega(p.N, Math.round(p.N / 2)) }; },
    step(st, p, dt) {
      // 에렌페스트 항아리 모형: 매 "시도"마다 N개 중 무작위로 하나를 골라 그 입자가 있는 칸에서 반대 칸으로 옮긴다.
      // → 왼쪽에서 뽑힐 확률은 nLeft/N 이므로, 입자가 많은 쪽에서 옮겨갈 확률이 저절로 더 높다(평형으로 끌리는 이유).
      st.acc += p.rate * dt;
      while (st.acc >= 1) {
        st.acc -= 1;
        const fromLeft = Math.random() * p.N < st.nLeft;
        if (fromLeft) { if (st.nLeft > 0) st.nLeft--; }
        else { if (st.nLeft < p.N) st.nLeft++; }
      }
      st.Omega = Math.exp(lnOmega(p.N, st.nLeft));
      st.S = lnOmega(p.N, st.nLeft);
      st.Smax = lnOmega(p.N, Math.round(p.N / 2));
    },

    graphs: [{
      title: 'S = ln Ω – 시간', xmin: 8, window: 14,
      series: [{ key: 'S', label: 'S', color: C.S }]
    }],
    sample(st, p) { return { S: st.S }; },

    readouts(st, p) {
      return [
        { label: '왼쪽 칸 입자 수 k', value: st.nLeft, unit: '개', dec: 0, color: C.left },
        { label: '오른쪽 칸 입자 수', value: p.N - st.nLeft, unit: '개', dec: 0, color: C.right },
        { label: '경우의 수 Ω', value: st.Omega.toExponential(2).replace('e+', '×10^'), wide: true, color: C.Omega },
        { label: '엔트로피 S = ln Ω', value: st.S, dec: 3, color: C.S },
        { label: '최대로 가능한 S_max (k=N/2)', value: st.Smax, dec: 3, color: C.S, wide: true }
      ];
    },

    notes: [
      '처음엔 <b>모든 입자가 왼쪽</b>에 있어서 방법의 수 Ω=1, 즉 S=0(가장 "질서 있는" 상태)입니다.',
      '입자들이 무작위로 칸을 옮기다 보면 <b>k=N/2 근처(양쪽이 거의 같은 상태)가 압도적으로 방법의 수가 많아서</b> 결국 그 근처에 머무르게 됩니다 — 누가 밀어준 게 아니라 <b>경우의 수가 그쪽이 훨씬 많기 때문</b>입니다.',
      'S는 <b>대체로 늘어나지만 가끔 아주 조금 줄어들기도 합니다</b>(요동). N이 클수록 이런 요동은 S_max에 비해 무시할 만큼 작아지는데, 이것이 "엔트로피는 감소하지 않는다"는 열역학 제2법칙이 <b>절대적 법칙이 아니라 통계적(확률적) 법칙</b>인 이유입니다.',
      'N을 키워 보세요 — 입자 수가 많아질수록 S_max에 도달한 뒤로는 <b>거의 평평한 그래프</b>가 됩니다(현실의 기체는 N~10²³이라 요동이 사실상 0으로 보입니다).'
    ],
    presets: [
      { name: '기본', set: { N: 36, rate: 25 } },
      { name: '적은 입자(요동이 크게 보임)', set: { N: 12, rate: 20 } },
      { name: '많은 입자(요동이 작게 보임)', set: { N: 50, rate: 35 } },
      { name: '천천히 섞임', set: { N: 30, rate: 6 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const boxW = Math.min(210, w * .27), boxH = 190, cy = h / 2 - 10;
      const ax = w / 2 - boxW - 10, bx = w / 2 + 10;

      function dotsGrid(x0, y0, bw, bh, count, color, hot) {
        const cols = Math.ceil(Math.sqrt(count * bw / bh)) || 1;
        const rows = Math.ceil(count / cols) || 1;
        const cellW = bw / cols, cellH = bh / rows;
        let n = 0;
        for (let r = 0; r < rows && n < count; r++) {
          for (let c = 0; c < cols && n < count; c++, n++) {
            D.dot(ctx, x0 + cellW * (c + .5), y0 + cellH * (r + .5), Math.min(cellW, cellH) * .28, color, hot);
          }
        }
      }

      [['왼쪽', ax, st.nLeft, C.left], ['오른쪽', bx, p.N - st.nLeft, C.right]].forEach(([label, x, count]) => {
        D.roundRect(ctx, x, cy - boxH / 2, boxW, boxH, 10);
        ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fill();
        ctx.save(); ctx.strokeStyle = 'rgba(147,162,196,.4)'; ctx.lineWidth = 1.5;
        D.roundRect(ctx, x, cy - boxH / 2, boxW, boxH, 10); ctx.stroke(); ctx.restore();
        D.text(ctx, label + ' 칸 (' + count + '개)', x + boxW / 2, cy - boxH / 2 - 12, { size: 12.5, color: '#e8eefc', align: 'center', bold: true });
        dotsGrid(x + 12, cy - boxH / 2 + 12, boxW - 24, boxH - 24, count, label === '왼쪽' ? C.left : C.right, false);
      });

      // 가운데 이동 표시
      const midx = w / 2;
      D.line(ctx, midx, cy - boxH / 2 - 4, midx, cy + boxH / 2 + 4, { color: 'rgba(255,255,255,.35)', width: 2, dash: [4, 6] });
      D.tag(ctx, 'λ=' + fmt(p.rate, 0) + '/s로 무작위 이동', midx, cy - boxH / 2 - 34, C.rate, hl === 'rate');

      // 엔트로피 요약
      const barY = cy + boxH / 2 + 30;
      D.tag(ctx, 'S = ' + fmt(st.S, 2) + '  (최대 가능 S_max = ' + fmt(st.Smax, 2) + ')', midx, barY, C.S, hl === 'S' || hl === 'Omega');
      const barW = Math.min(260, w * .4), barX = midx - barW / 2, barH = 12;
      D.bar(ctx, barX, barY + 14, barW, barH, st.S, Math.max(st.Smax, .01), C.S, null, hl === 'S');
    }
  });
})();
