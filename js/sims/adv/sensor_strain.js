/* [센서공학] 스트레인 게이지 & 휘트스톤 브리지 — Vo = Vs·GF·ε/4 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { F: '#34d399', GF: '#fbbf24', Vs: '#f472b6', A: '#a78bfa', eps: '#5eead4', Vo: '#60a5fa', Vout: '#60a5fa' };

  // 외팔보 제원 (스테인리스)
  const L = 0.15, bw = 0.02, hh = 0.003, E = 200e9;
  const I = bw * hh * hh * hh / 12;
  const strain = F => F * L * (hh / 2) / (E * I);      // 고정단 표면 변형률
  const defl = F => F * L * L * L / (3 * E * I);       // 자유단 처짐
  const vbridge = (F, p) => p.Vs * p.GF * strain(F) / 4;

  PS.register({
    id: 'sensor-strain', mode: 'adv', category: '센서공학',
    title: '스트레인 게이지와 브리지 회로',
    sub: 'Vo = Vs·GF·ε/4',
    tagline: '눈에 보이지 않는 0.02%의 변형을 어떻게 전압으로 바꿀까요? 로드셀(전자저울)의 심장입니다.',

    params: [
      { key: 'F', symbol: 'F', label: '가해진 하중', unit: 'N', min: 0, max: 30, step: .5, value: 10, color: C.F, dec: 1,
        where: '외팔보 끝을 누르는 <b>초록 화살표</b>입니다. 보가 휘면서 윗면이 늘어나고, 그 위에 붙은 게이지도 함께 늘어납니다.' },
      { key: 'GF', symbol: 'GF', label: '게이지율', unit: '', min: 1.5, max: 5, step: .1, value: 2, color: C.GF, dec: 1,
        where: '게이지가 <b>얼마나 민감한가</b>입니다. 변형률 1당 저항이 몇 배 변하는지(ΔR/R = GF·ε)를 뜻하며, 금속 게이지는 보통 2.0입니다. 회로도의 게이지 저항 R₁에 작용합니다.' },
      { key: 'Vs', symbol: 'Vs', label: '브리지 여기 전압', unit: 'V', min: 1, max: 10, step: .5, value: 5, color: C.Vs, dec: 1,
        where: '브리지 <b>양 끝에 걸어 주는 전원</b>입니다. 출력이 Vs에 비례하므로 키우면 신호도 커지지만, 게이지가 <b>자체 발열</b>로 오차를 일으킵니다.' },
      { key: 'A', symbol: 'A', label: '증폭기 이득', unit: '배', min: 1, max: 1000, step: 1, value: 500, color: C.A, dec: 0,
        where: '브리지 출력은 겨우 <b>mV</b> 수준이라 그대로는 쓸 수 없습니다. 계장 증폭기가 이 값만큼 키워 ADC가 읽을 수 있는 전압으로 만듭니다.' }
    ],
    vars: {
      eps: { symbol: 'ε', label: '변형률', unit: 'μɛ', color: C.eps,
        where: '보 윗면이 <b>원래 길이 대비 얼마나 늘어났는가</b>입니다. 게이지 그림이 늘어나는 정도로 표현됩니다. 보통 1000 μɛ = 0.1%에 불과합니다.' },
      Vo: { symbol: 'Vo', label: '브리지 출력', unit: 'mV', color: C.Vo,
        where: '브리지 <b>가운데 두 점 사이의 전압차</b>입니다. 하중이 0이면 좌우가 균형을 이뤄 0 V가 됩니다(영점).' },
      Vout: { symbol: 'V', label: '최종 출력 전압', unit: 'V', color: C.Vout,
        where: '증폭기를 거친 <b>최종 출력</b>입니다. 오른쪽 계기와 막대로 표시됩니다.' },
      R: { symbol: 'R', label: '게이지 저항', unit: 'Ω', color: C.GF,
        where: '보통 120 Ω 또는 350 Ω입니다. 늘어나면 저항이 조금 커집니다(ΔR).' }
    },
    formulas: [
      { name: '보 표면의 변형률', tpl: '{eps} = 6{F}L ⁄ ( E·b·h² )' },
      { name: '게이지 저항 변화', tpl: 'Δ{R} ⁄ {R} = {GF} · {eps}' },
      { name: '1/4 브리지 출력', tpl: '{Vo} = {Vs} · (Δ{R}⁄{R}) ⁄ 4' },
      { name: '증폭 후 출력', tpl: '{Vout} = {A} · {Vo}' }
    ],

    init(p) { return { F: p.F }; },
    step(st, p, dt) { st.F += (p.F - st.F) * Math.min(1, dt * 12); },   // 하중 변화를 부드럽게

    graphs: [
      { title: '하중 – 변형률 (선형)', xKey: 'F', xUnit: 'N', xMin: 0, xMax: 30, y0: 0,
        series: [{ key: 'eps', label: 'ε (μɛ)', color: C.eps }] },
      { title: '하중 – 출력 전압 (교정 곡선)', xKey: 'F', xUnit: 'N', xMin: 0, xMax: 30, y0: 0,
        series: [{ key: 'Vout', label: 'V (V)', color: C.Vout }] }
    ],
    sample(st, p) {
      return { F: st.F, eps: strain(st.F) * 1e6, Vout: vbridge(st.F, p) * p.A };
    },

    readouts(st, p) {
      const e = strain(st.F), Vo = vbridge(st.F, p);
      return [
        { label: '변형률 ε', value: e * 1e6, unit: 'μɛ', color: C.eps, dec: 0 },
        { label: '자유단 처짐', value: defl(st.F) * 1000, unit: 'mm', color: C.F },
        { label: '표면 응력 σ', value: e * E / 1e6, unit: 'MPa' },
        { label: '저항 변화 ΔR/R', value: p.GF * e * 100, unit: '%', dec: 3 },
        { label: '브리지 출력 Vo', value: Vo * 1000, unit: 'mV', color: C.Vo, dec: 3 },
        { label: '증폭 후 출력', value: Vo * p.A, unit: 'V', color: C.Vout },
        { label: '감도 (출력/하중)', value: st.F > .01 ? (Vo * p.A / st.F) * 1000 : (vbridge(1, p) * p.A) * 1000, unit: 'mV/N', wide: true, color: C.A }
      ];
    },

    notes: [
      '센서의 본질은 <b>물리량 → 저항 변화 → 전압</b>이라는 변환 사슬입니다. 이 3단계가 모든 센서에 공통입니다.',
      '변형률은 고작 수백 μɛ(0.0x %)입니다. 그래서 <b>브리지 + 증폭기</b>가 반드시 필요합니다.',
      '브리지는 <b>영점(하중 0에서 출력 0)</b>을 만들어 줍니다. 큰 값에서 작은 차이를 읽는 대신, 차이만 뽑아내는 구조입니다.',
      '출력이 하중에 <b>정비례</b>(교정 곡선이 직선)해야 좋은 센서입니다. 이 직선의 기울기가 <b>감도</b>입니다.',
      'Vs를 키우면 감도가 오르지만 자기 발열이 생기고, A를 키우면 <b>노이즈도 같이 증폭</b>됩니다.'
    ],
    presets: [
      { name: '무부하 (영점)', set: { F: 0 } },
      { name: '표준 로드셀', set: { F: 10, GF: 2, Vs: 5, A: 500 } },
      { name: '고감도 반도체 게이지', set: { GF: 5 } },
      { name: '증폭 없이 (A=1)', set: { A: 1 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const e = strain(st.F), Vo = vbridge(st.F, p), Vout = Vo * p.A;

      /* ── 외팔보 ─────────────────────────────── */
      const bx = 60, by = h * .27, blen = Math.min(300, w * .34), bthk = 16;
      const tip = clamp(defl(st.F) * 22000, 0, 90);      // 처짐 과장 표시

      // 벽(고정단)
      ctx.fillStyle = '#1b2540'; ctx.fillRect(bx - 26, by - 60, 26, 120);
      for (let i = 0; i < 7; i++) D.line(ctx, bx - 26, by - 56 + i * 18, bx - 40, by - 46 + i * 18, { color: 'rgba(147,162,196,.3)' });

      // 휜 보 (2차 곡선 근사)
      const yAt = s => by + tip * (s * s * (3 - s)) / 2;   // s: 0~1
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const s = i / 40; const x = bx + s * blen; i ? ctx.lineTo(x, yAt(s)) : ctx.moveTo(x, yAt(s)); }
      for (let i = 40; i >= 0; i--) { const s = i / 40; const x = bx + s * blen; ctx.lineTo(x, yAt(s) + bthk); }
      ctx.closePath();
      const gr = ctx.createLinearGradient(0, by, 0, by + bthk);
      gr.addColorStop(0, '#93a2c4'); gr.addColorStop(1, '#55628a');
      ctx.fillStyle = gr; ctx.fill();
      ctx.restore();

      // 게이지 (고정단 근처 윗면) — 변형률에 따라 늘어남
      const gx0 = bx + blen * .08, gw = 54 * (1 + e * 300), gy = by - 3;
      ctx.save();
      if (hl === 'eps' || hl === 'GF') { ctx.shadowColor = C.eps; ctx.shadowBlur = 14; }
      ctx.strokeStyle = hl === 'eps' || hl === 'GF' ? '#a7f3e5' : C.eps;
      ctx.lineWidth = 2; ctx.beginPath();
      const zig = 5;
      for (let i = 0; i <= zig * 2; i++) {
        const x = gx0 + (gw / (zig * 2)) * i;
        const y = gy - (i % 2 ? 9 : 0);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      D.text(ctx, '스트레인 게이지', gx0, gy - 16, { size: 10.5, color: C.eps, bold: hl === 'eps' || hl === 'GF' });
      D.tag(ctx, 'ε = ' + fmt(e * 1e6, 0) + ' μɛ', gx0 + gw + 62, gy - 6, C.eps, hl === 'eps');

      // 하중 화살표
      const tipY = yAt(1);
      D.arrow(ctx, bx + blen, tipY - 78, 0, 66,
        { color: C.F, width: 4, hot: hl === 'F', label: 'F = ' + fmt(st.F, 1) + ' N', ly: -14 });
      D.line(ctx, bx, by + 70, bx + blen, by + 70, { color: 'rgba(147,162,196,.25)', dash: [4, 4] });
      D.text(ctx, 'L = 150 mm · 폭 20 mm · 두께 3 mm · 스테인리스', bx, by + 88, { size: 10, color: '#4a5878' });

      /* ── 휘트스톤 브리지 ────────────────────── */
      const cx = w * .62, cy = h * .62, R = 84;
      const N = [cx, cy - R], S = [cx, cy + R], Wp = [cx - R, cy], Ep = [cx + R, cy];
      ctx.save();
      ctx.strokeStyle = '#4b5b7d'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(N[0], N[1]); ctx.lineTo(Ep[0], Ep[1]); ctx.lineTo(S[0], S[1]); ctx.lineTo(Wp[0], Wp[1]); ctx.closePath();
      ctx.stroke(); ctx.restore();

      const res = (a, b, label, col, hot) => {
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
        if (hot) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
        D.roundRect(ctx, -17, -8, 34, 16, 3);
        ctx.fillStyle = col; ctx.fill();
        ctx.restore();
        D.text(ctx, label, mx + (a[0] < cx && b[0] < cx ? -30 : 30), my + 4,
          { size: 10.5, color: col, align: a[0] < cx && b[0] < cx ? 'right' : 'left', bold: hot });
      };
      res(N, Wp, 'R₁ (게이지)', hl === 'GF' || hl === 'eps' ? '#a7f3e5' : C.eps, hl === 'GF' || hl === 'eps');
      res(N, Ep, 'R₂', '#55628a', false);
      res(Wp, S, 'R₃', '#55628a', false);
      res(Ep, S, 'R₄', '#55628a', false);

      // 여기 전압
      D.text(ctx, '+Vs', N[0], N[1] - 14, { size: 11.5, color: C.Vs, align: 'center', bold: hl === 'Vs' });
      D.text(ctx, 'GND', S[0], S[1] + 20, { size: 10.5, color: '#61719a', align: 'center' });
      D.line(ctx, N[0], N[1] - 10, N[0], N[1] - 4, { color: C.Vs, width: 2, hot: hl === 'Vs' });
      D.text(ctx, fmt(p.Vs, 1) + ' V', N[0] + 26, N[1] - 12, { size: 10.5, color: C.Vs, bold: hl === 'Vs' });

      // 출력단
      D.line(ctx, Wp[0], Wp[1], Wp[0] - 46, Wp[1], { color: '#4b5b7d', width: 2 });
      D.line(ctx, Ep[0], Ep[1], Ep[0] + 30, Ep[1], { color: '#4b5b7d', width: 2 });
      D.tag(ctx, 'Vo = ' + fmt(Vo * 1000, 3) + ' mV', Wp[0] - 92, Wp[1], C.Vo, hl === 'Vo');

      // 증폭기(삼각형)
      const ax = Ep[0] + 30, ay = Ep[1];
      ctx.save();
      if (hl === 'A') { ctx.shadowColor = C.A; ctx.shadowBlur = 16; }
      ctx.beginPath(); ctx.moveTo(ax, ay - 26); ctx.lineTo(ax + 46, ay); ctx.lineTo(ax, ay + 26); ctx.closePath();
      ctx.fillStyle = hl === 'A' ? '#c4b5fd' : '#5b4d8a'; ctx.fill();
      ctx.restore();
      D.text(ctx, '×' + p.A, ax + 12, ay + 4, { size: 11, color: '#0d0820', bold: true });
      D.text(ctx, '증폭기', ax + 22, ay - 34, { size: 10, color: C.A, align: 'center', bold: hl === 'A' });

      // 최종 출력 막대 + 수치
      const obx = ax + 60, oby = ay - 60, obw = Math.min(150, w - obx - 24);
      D.text(ctx, '최종 출력', obx, oby - 6, { size: 10.5, color: '#61719a' });
      D.bar(ctx, obx, oby, obw, 14, Math.abs(Vout), 5, C.Vout, null, hl === 'Vout' || hl === 'A');
      D.text(ctx, fmt(Vout, 3) + ' V', obx, oby + 44, { size: 20, color: C.Vout, bold: true });
      D.text(ctx, '(ADC 입력 범위 0~5 V 기준)', obx, oby + 60, { size: 9.5, color: '#4a5878' });
      if (Math.abs(Vout) > 5) D.tag(ctx, '⚠ 포화 — 이득을 낮추세요', obx + obw / 2, oby + 78, '#fb7185', true);
    }
  });
})();
