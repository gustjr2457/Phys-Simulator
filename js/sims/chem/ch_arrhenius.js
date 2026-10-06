/* [화학공학·반응공학] 아레니우스 식 — k = A·e^(−Ea/RT)
   온도를 10 K만 올려도 반응 속도가 두 배가 되는 이유. 반응하려면 활성화 에너지
   Ea라는 문턱을 넘어야 하고, 그 문턱을 넘을 만큼 에너지가 큰 분자의 비율이
   e^(−Ea/RT)로 — 즉 온도에 지수적으로 — 늘어나기 때문이다. 반응기 설계,
   식품 보관, 약품 유효기간, 반도체 공정 온도가 모두 이 식 하나에 걸려 있다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { T: '#fb7185', Ea: '#fbbf24', lgA: '#a78bfa', C0: '#60a5fa',
              k: '#5eead4', Cc: '#60a5fa', X: '#34d399' };
  const RGAS = 8.314e-3;                              // kJ/mol·K

  const kOf = p => Math.pow(10, p.lgA) * Math.exp(-p.Ea / (RGAS * p.T));
  const fracOf = p => Math.exp(-p.Ea / (RGAS * p.T));        // 문턱을 넘는 분자 비율
  const q10Of = p => Math.exp(p.Ea * 10 / (RGAS * p.T * (p.T + 10)));
  // 에너지 분포 (3차원 맥스웰-볼츠만, 에너지 기준): f(E) ∝ √E · e^(−E/RT)
  const distOf = (E, T) => Math.sqrt(Math.max(E, 1e-9)) * Math.exp(-E / (RGAS * T));

  const NP = 130;

  PS.register({
    id: 'ch-arrhenius', mode: 'chem', category: '반응공학',
    title: '아레니우스 식',
    sub: 'k = A·e^(−Ea/RT)',
    tagline: '온도를 10도만 올려도 반응이 두 배 빨라집니다. 문턱(Ea)을 넘을 만큼 에너지가 큰 분자의 비율이 지수적으로 늘기 때문입니다 — 오른쪽 분포의 꼬리를 보세요.',

    params: [
      { key: 'T', symbol: 'T', label: '반응 온도', unit: 'K', min: 280, max: 450, step: 5, value: 310, color: C.T, dec: 0,
        where: '<b>반응기 온도</b>입니다. 오른쪽 에너지 분포의 꼬리를 늘려 문턱 Ea를 넘는 분자 비율을 지수적으로 키웁니다 — 이 시뮬레이션에서 가장 강력한 손잡이입니다.' },
      { key: 'Ea', symbol: 'E_a', label: '활성화 에너지', unit: 'kJ/mol', min: 20, max: 150, step: 5, value: 55, color: C.Ea, dec: 0,
        where: '반응이 일어나기 위해 넘어야 하는 <b>에너지 문턱</b>(노란 수직선)입니다. 분자가 부딪히더라도 이 문턱보다 에너지가 작으면 그냥 튕겨 나갑니다. 촉매는 바로 이 값을 낮춥니다.' },
      { key: 'lgA', symbol: 'log A', label: '빈도인자 (log₁₀)', unit: '', min: 5, max: 12, step: .5, value: 8, color: C.lgA, dec: 1,
        where: '<b>충돌 자체가 얼마나 자주, 올바른 방향으로 일어나는가</b>입니다. 온도와 무관한 "시도 횟수"에 해당하며, 속도 전체를 비례해서 올리거나 내립니다.' },
      { key: 'C0', symbol: 'C₀', label: '초기 농도', unit: 'mol/L', min: .2, max: 2, step: .1, value: 1, color: C.C0, dec: 1, reset: true,
        where: '<b>처음 넣은 반응물의 농도</b>(왼쪽 반응기의 파란 분자 수)입니다. 1차 반응에서는 전환율의 <b>시간 곡선을 바꾸지 않습니다</b> — 절대량만 달라집니다.' }
    ],
    vars: {
      k: { symbol: 'k', label: '반응 속도상수', unit: '1/s', color: C.k,
        where: '단위 시간에 반응물이 <b>몇 분의 몇씩 사라지는가</b>입니다. 아레니우스 식의 결과물이자, 반응기 크기를 정하는 값입니다.' },
      Cc: { symbol: 'C', label: '남은 농도', unit: 'mol/L', color: C.Cc,
        where: '아직 반응하지 않은 <b>파란 분자</b>의 농도입니다. C = C₀·e^(−kt)로 지수적으로 줄어듭니다.' },
      X: { symbol: 'X', label: '전환율', unit: '', color: C.X,
        where: '<b>초록 분자로 바뀐 비율</b>입니다. X = 1 − e^(−kt). 반응기 설계의 목표값이 바로 이 수치입니다.' }
    },
    formulas: [
      { name: '아레니우스 식', tpl: '{k} = A·e^(−{Ea} ⁄ R{T})' },
      { name: '문턱을 넘는 분자 비율', tpl: 'f = e^(−{Ea} ⁄ R{T})' },
      { name: '1차 반응의 농도', tpl: '{Cc} = {C0}·e^(−{k}t)' },
      { name: '반감기 (농도와 무관!)', tpl: 't½ = ln2 ⁄ {k}' }
    ],

    init(p) {
      const parts = [];
      for (let i = 0; i < NP; i++) {
        parts.push({
          u: (i + .5) / NP,                   // 변환 순서(균등 분포) — 난수 없이 정확한 e^(−kt) 재현
          px: Math.random(), py: Math.random(),
          ph: Math.random() * 6.28, sp: .5 + Math.random()
        });
      }
      return { kt: 0, parts: parts, done: false };
    },
    step(st, p, dt) {
      st.kt += kOf(p) * dt;                   // 누적 노출량 — 슬라이더를 중간에 바꿔도 모순이 없다
      if (st.kt > 12) st.done = true;
    },

    graphs: [{
      title: '농도와 전환율 – 시간', xmin: 20, y0: 0,
      series: [
        { key: 'Cc', label: 'C (mol/L)', color: C.Cc },
        { key: 'Pp', label: '생성물', color: C.X }
      ]
    }, {
      title: '전환율 X', xmin: 20, y0: 0,
      series: [{ key: 'X', label: 'X', color: C.X }]
    }],
    sample(st, p) {
      const X = 1 - Math.exp(-st.kt);
      return { Cc: p.C0 * (1 - X), Pp: p.C0 * X, X: X };
    },

    readouts(st, p) {
      const k = kOf(p), X = 1 - Math.exp(-st.kt);
      const th = Math.LN2 / k;
      return [
        { label: '속도상수 k', value: k, unit: '1/s', color: C.k, dec: k < .01 ? 6 : 4 },
        { label: '반감기 t½', value: th, unit: th > 600 ? '초' : '초', color: C.k, dec: th > 100 ? 0 : 2 },
        { label: '반감기 (읽기 쉽게)', wide: true, color: C.k,
          value: th < 90 ? fmt(th, 1) + ' 초' : (th < 5400 ? fmt(th / 60, 1) + ' 분' : (th < 1.3e5 ? fmt(th / 3600, 1) + ' 시간' : fmt(th / 86400, 1) + ' 일')) },
        { label: '전환율 X', value: X * 100, unit: '%', color: C.X, dec: 1 },
        { label: '남은 농도 C', value: p.C0 * (1 - X), unit: 'mol/L', color: C.Cc, dec: 3 },
        { label: '반응 속도 r = kC', value: k * p.C0 * (1 - X), unit: 'mol/L·s', dec: 4, color: '#fb923c' },
        { label: '문턱을 넘는 분자 비율', value: fracOf(p) * 100, unit: '%', dec: fracOf(p) < 1e-4 ? 8 : 4, color: C.Ea },
        { label: '온도 10 K 올리면', value: fmt(q10Of(p), 2) + ' 배 빨라짐', wide: true, color: C.T },
        { label: '상태', wide: true, color: X > .99 ? '#34d399' : '#fbbf24',
          value: X > .99 ? '사실상 완전 반응 (99% 이상)' : (X > .5 ? '절반 이상 반응' : '반응 진행 중') }
      ];
    },

    notes: [
      '<b>온도가 속도를 지수적으로 바꿉니다.</b> 활성화 에너지가 50 kJ/mol 정도인 흔한 반응은 상온에서 10 K 올릴 때마다 약 2배씩 빨라집니다 — 냉장고가 음식을 오래 보존하는 것도, 열이 나면 몸이 급해지는 것도 같은 식입니다.',
      '문턱을 넘는 분자 비율은 상온에서 <b>엄청나게 작습니다</b>(Ea = 55 kJ/mol, 300 K면 10억 분의 1 수준). 그래도 반응이 보이는 이유는 분자 수가 아보가드로 수만큼 많기 때문입니다.',
      '<b>촉매는 온도를 올리지 않고 Ea를 낮춥니다.</b> 노란 문턱선을 왼쪽으로 옮겨 보세요 — 같은 온도에서 속도가 수천 배 뛰는 것을 볼 수 있습니다. 암모니아 합성, 자동차 삼원촉매가 이 원리입니다.',
      '<b>1차 반응의 반감기는 초기 농도와 무관합니다.</b> C₀을 바꿔도 전환율 곡선이 전혀 움직이지 않습니다 — 방사성 붕괴가 농도에 상관없이 일정한 반감기를 갖는 것과 같은 수학입니다.',
      '빈도인자 A는 속도를 <b>비례해서</b> 올리고, 온도는 <b>지수적으로</b> 올립니다. 그래서 공정을 설계할 때는 거의 항상 온도가 먼저 검토됩니다 — 다만 너무 올리면 원하지 않는 부반응도 같이 빨라집니다.'
    ],
    presets: [
      { name: '기본', set: { T: 310, Ea: 55, lgA: 8, C0: 1 } },
      { name: '냉장 보관 (4 °C)', set: { T: 277, Ea: 55, lgA: 8 } },
      { name: '가열 (90 °C)', set: { T: 363, Ea: 55, lgA: 8 } },
      { name: '촉매 투입 (Ea 낮춤)', set: { T: 310, Ea: 30, lgA: 8 } },
      { name: '튼튼한 문턱 (상온에서 거의 안 변함)', set: { T: 298, Ea: 120, lgA: 10 } }
    ],
    challenges: [
      {
        id: 'fast', title: '10초 안에 90% 전환',
        desc: '속도상수를 키워 10초 만에 전환율 90%에 도달하게 만들어 보세요.',
        hint: '90%까지 가려면 kt = ln10 ≈ 2.3이 필요합니다. 즉 k ≥ 0.23 /s. 온도를 올리거나 Ea를 낮추세요.',
        check: ({ P }) => kOf(P) >= Math.LN10 / 10
      },
      {
        id: 'q10', title: '"10도에 두 배" 법칙 재현',
        desc: '온도를 10 K 올릴 때 속도가 1.9~2.1배가 되는 조건을 찾아 보세요 — 화학에서 가장 유명한 경험 법칙입니다.',
        hint: '이 배율은 Ea와 T로만 정해집니다. 상온(약 300 K) 근처에서 Ea를 50~55 kJ/mol로 맞춰 보세요.',
        check: ({ P }) => { const q = q10Of(P); return q >= 1.9 && q <= 2.1; }
      },
      {
        id: 'shelf', title: '상온에서 1년 버티는 약 만들기',
        desc: '온도 300 K 이하에서 반감기를 1년(약 3×10⁷초) 이상으로 만들어 보세요 — 유효기간 설계가 이 계산입니다.',
        hint: '문턱 Ea를 아주 높이고 빈도인자를 낮추면 됩니다. 측정값 칸의 반감기를 보면서 조절하세요.',
        check: ({ P }) => P.T <= 300 && Math.LN2 / kOf(P) >= 3.15e7
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const k = kOf(p), X = 1 - Math.exp(-st.kt);

      /* ── 반응기 ── */
      const bx = 44, byTop = 68, bw = Math.min(236, w * .33), bh = Math.min(228, h * .50);
      ctx.save();
      if (hl === 'T') { ctx.shadowColor = C.T; ctx.shadowBlur = 20; }
      D.roundRect(ctx, bx, byTop, bw, bh, 10);
      const tg = ctx.createLinearGradient(0, byTop, 0, byTop + bh);
      const hot = clamp((p.T - 280) / 170, 0, 1);
      tg.addColorStop(0, 'rgba(' + Math.round(40 + 120 * hot) + ',' + Math.round(60 - 20 * hot) + ',90,.28)');
      tg.addColorStop(1, 'rgba(' + Math.round(60 + 150 * hot) + ',' + Math.round(50 - 20 * hot) + ',70,.38)');
      ctx.fillStyle = tg; ctx.fill();
      ctx.strokeStyle = 'rgba(147,162,196,.5)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      D.text(ctx, '회분식 반응기', bx + bw / 2, byTop - 12, { size: 11, color: '#61719a', align: 'center' });
      D.tag(ctx, 'T = ' + fmt(p.T, 0) + ' K  (' + fmt(p.T - 273.15, 0) + ' °C)',
        bx + bw / 2, byTop + bh + 20, C.T, hl === 'T');

      // 분자 — 온도가 높으면 더 빨리 돌아다니고, 변환된 것은 초록
      const nShow = Math.max(8, Math.round(NP * p.C0 / 2 + NP * .35));
      const amp = 7 + hot * 16;
      st.parts.slice(0, nShow).forEach((q, i) => {
        const conv = X > q.u;
        const t = st.t * q.sp * (.3 + hot * 1.5);
        const x = bx + 14 + q.px * (bw - 28) + Math.sin(t * 1.7 + q.ph) * amp;
        const y = byTop + 14 + q.py * (bh - 28) + Math.cos(t * 1.3 + q.ph * 1.7) * amp;
        const fast = !conv && q.u < X + .06;           // 곧 문턱을 넘을 분자를 흰색으로 강조
        D.dot(ctx, x, y, conv ? 4.2 : 3.6, conv ? C.X : (fast ? '#e8eefc' : C.Cc), conv || fast);
      });
      // 전환율 막대
      const pbY = byTop + bh + 40;
      D.text(ctx, '전환율 X = ' + fmt(X * 100, 1) + ' %', bx, pbY - 6,
        { size: 11.5, color: hl === 'X' ? '#fff' : C.X, bold: true });
      D.roundRect(ctx, bx, pbY, bw, 11, 5); ctx.fillStyle = 'rgba(96,165,250,.22)'; ctx.fill();
      ctx.save(); if (hl === 'X') { ctx.shadowColor = C.X; ctx.shadowBlur = 12; }
      D.roundRect(ctx, bx, pbY, bw * X, 11, 5); ctx.fillStyle = C.X; ctx.fill(); ctx.restore();
      D.text(ctx, '반응물', bx, pbY + 26, { size: 9.5, color: C.Cc });
      D.text(ctx, '생성물', bx + bw, pbY + 26, { size: 9.5, color: C.X, align: 'right' });

      /* ── 에너지 분포 (로그 눈금) ── */
      const gx = bx + bw + 64, gy = 74;
      const gw = Math.max(150, w - gx - 44), gh = Math.min(206, h * .46);
      const Emax = p.Ea * 1.45;
      D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fill();
      D.text(ctx, '분자 에너지 분포  (세로 = 로그 눈금)', gx, gy - 12, { size: 11, color: '#61719a' });

      const DEC = 11;                                      // 표시할 자릿수 범위
      const peak = distOf(RGAS * p.T / 2, p.T);
      const GX = E => gx + clamp(E / Emax, 0, 1) * gw;
      const GY = f => {
        const l = Math.log10(Math.max(f, 1e-300) / peak);
        return gy + gh * clamp(-l / DEC, 0, 1);
      };
      // 자릿수 격자
      for (let d = 0; d <= DEC; d += 2) {
        const yy = gy + gh * d / DEC;
        D.line(ctx, gx, yy, gx + gw, yy, { color: 'rgba(255,255,255,.05)' });
        D.text(ctx, d === 0 ? '최대' : '10⁻' + d, gx - 4, yy + 3.5, { size: 8.5, color: '#4b5a80', align: 'right' });
      }
      // Ea 넘는 영역(반응할 수 있는 분자) 음영
      ctx.save();
      ctx.beginPath(); ctx.moveTo(GX(p.Ea), gy + gh);
      for (let i = 0; i <= 60; i++) {
        const E = p.Ea + (Emax - p.Ea) * i / 60;
        ctx.lineTo(GX(E), GY(distOf(E, p.T)));
      }
      ctx.lineTo(GX(Emax), gy + gh); ctx.closePath();
      ctx.fillStyle = 'rgba(52,211,153,.30)'; ctx.fill(); ctx.restore();

      // 분포 곡선 — 현재 온도, 그리고 비교용으로 +40 K
      [[p.T, C.T, 2.4], [p.T + 40, 'rgba(251,146,60,.6)', 1.4]].forEach(([TT, col, lw], idx) => {
        const pk = distOf(RGAS * TT / 2, TT);
        ctx.save();
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        if (idx === 1) ctx.setLineDash([4, 4]);
        if (idx === 0 && hl === 'T') { ctx.shadowColor = C.T; ctx.shadowBlur = 12; }
        ctx.beginPath();
        for (let i = 0; i <= 150; i++) {
          const E = Emax * i / 150;
          const l = Math.log10(Math.max(distOf(E, TT) / pk, 1e-300));
          const Y = gy + gh * clamp(-l / DEC, 0, 1);
          i ? ctx.lineTo(GX(E), Y) : ctx.moveTo(GX(E), Y);
        }
        ctx.stroke(); ctx.restore();
      });
      D.text(ctx, 'T + 40 K', gx + gw - 4, gy + 12, { size: 9, color: 'rgba(251,146,60,.85)', align: 'right' });

      // Ea 문턱
      D.line(ctx, GX(p.Ea), gy, GX(p.Ea), gy + gh, { color: C.Ea, width: 2.2, hot: hl === 'Ea' });
      D.text(ctx, 'E_a = ' + fmt(p.Ea, 0), GX(p.Ea) - 5, gy + 14,
        { size: 10.5, color: hl === 'Ea' ? '#fff' : C.Ea, align: 'right', bold: true });
      // 좁은 화면에서 넘치지 않도록 그래프 오른쪽 끝에 붙인다
      D.text(ctx, '→ 이 오른쪽만 반응', gx + gw - 4, gy + 30, { size: 9.5, color: C.X, align: 'right' });
      D.text(ctx, '에너지 (kJ/mol) →', gx + gw, gy + gh + 15, { size: 9.5, color: '#61719a', align: 'right' });
      D.text(ctx, '비율 f = e^(−Ea/RT) = ' + fracOf(p).toExponential(2),
        gx, gy + gh + 36, { size: 11, color: hl === 'Ea' ? '#fff' : C.Ea });
      D.text(ctx, 'k = A·f = ' + (k < .01 ? k.toExponential(3) : fmt(k, 4)) + ' /s',
        gx, gy + gh + 58, { size: 12, color: hl === 'k' ? '#fff' : C.k, bold: true });
      D.text(ctx, '온도 10 K ↑  →  ' + fmt(q10Of(p), 2) + ' 배',
        gx, gy + gh + 80, { size: 11, color: C.T });
    }
  });
})();
