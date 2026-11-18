/* [공학응용·센서와 계측] 스트레인 게이지와 휘트스톤 브리지 — Vo = Vs·GF·ε/4
   외팔보 끝에 추(하중 F) → 고정단 윗면 변형률 ε = 6FL/(E·b·h²) → 게이지 저항 ΔR/R = GF·ε
   → 1/4 브리지 출력 Vo ≈ Vs·(ΔR/R)/4 → 계장 증폭기 ×A → ADC(0~5 V).
   실제 처짐(최대 3.75 mm)과 게이지 늘어남(0.075 %)은 눈에 안 보일 만큼 작아서, 그림은 과장하고 배율을 화면에 적는다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { F: PAL.sage, GF: PAL.amber, Vs: PAL.dusty, A: PAL.violet, eps: PAL.teal, Vo: PAL.steel, Vout: PAL.steel, R: PAL.amber };

  // 외팔보 제원 (스테인리스)
  const L = 0.15, bw = 0.02, hh = 0.003, E = 200e9;
  const I = bw * hh * hh * hh / 12;
  const strain = F => F * L * (hh / 2) / (E * I);              // 고정단 표면 변형률 (= 6FL/(E·b·h²))
  const strainAt = (F, x) => 6 * F * (L - x) / (E * bw * hh * hh); // 고정단에서 x 떨어진 윗면 — 굽힘 모멘트 F(L−x)에 비례
  const defl = F => F * L * L * L / (3 * E * I);               // 자유단 처짐
  const vbridge = (F, p) => p.Vs * p.GF * strain(F) / 4;
  const FMAX = 30, R0 = 350, ADC = 5;
  const KG = .25 / strain(FMAX);                               // 확대 그림: 30 N 에서 게이지가 25 % 늘어나 보이게 (과장 배율)
  const frac = v => v - Math.floor(v);

  PS.register({
    id: 'sensor-strain', mode: 'adv', category: '센서와 계측',
    title: '스트레인 게이지와 브리지 회로',
    sub: 'Vo = Vs·GF·ε/4',
    tagline: '눈에 보이지 않는 0.02%의 변형을 어떻게 전압으로 바꿀까요? 로드셀(전자저울)의 심장입니다.',

    params: [
      { key: 'F', symbol: 'F', label: '가해진 하중', unit: 'N', min: 0, max: 30, step: .5, value: 10, color: C.F, dec: 1,
        where: '보 끝에 매단 <b>초록 추</b>와 아래로 향한 화살표입니다. 보가 휘면서 윗면이 늘어나고, 그 위에 붙은 게이지도 함께 늘어납니다.' },
      { key: 'GF', symbol: 'GF', label: '게이지율', unit: '', min: 1.5, max: 5, step: .1, value: 2, color: C.GF, dec: 1,
        where: '게이지가 <b>얼마나 민감한가</b>입니다. 변형률 1당 저항이 몇 배 변하는지(ΔR/R = GF·ε)를 뜻하며, 금속 게이지는 보통 2.0입니다. 회로도의 <b>청록 저항 R₁</b>에 작용합니다.' },
      { key: 'Vs', symbol: 'Vs', label: '브리지 여기 전압', unit: 'V', min: 1, max: 10, step: .5, value: 5, color: C.Vs, dec: 1,
        where: '브리지 맨 위 <b>+Vs 단자</b>에 걸어 주는 전원입니다. 키우면 브리지 팔을 따라 흐르는 <b>분홍 점(전류)</b>이 빨라집니다. 출력이 Vs에 비례하므로 신호도 커지지만, 게이지가 <b>자체 발열</b>로 오차를 일으킵니다.' },
      { key: 'A', symbol: 'A', label: '증폭기 이득', unit: '배', min: 1, max: 1000, step: 1, value: 500, color: C.A, dec: 0,
        where: '브리지 출력은 겨우 <b>mV</b> 수준이라 그대로는 쓸 수 없습니다. <b>보라 삼각형</b>(계장 증폭기)이 이 값만큼 키워 ADC가 읽을 수 있는 전압으로 만듭니다.' }
    ],
    vars: {
      eps: { symbol: 'ε', label: '변형률', unit: 'μɛ', color: C.eps,
        where: '보 윗면이 <b>원래 길이 대비 얼마나 늘어났는가</b>입니다. 보 윗면의 <b>청록 띠</b>(고정단 쪽이 가장 진함)와 오른쪽 위 확대 그림에서 게이지가 늘어나는 정도로 보입니다. 보통 1000 μɛ = 0.1%에 불과합니다.' },
      Vo: { symbol: 'Vo', label: '브리지 출력', unit: 'mV', color: C.Vo,
        where: '브리지 <b>가운데 두 점 A와 B 사이의 전압차</b>입니다. 두 점 모두 Vs의 절반 근처라 차이는 아주 작습니다. 하중이 0이면 좌우가 균형을 이뤄 0 V가 됩니다(영점).' },
      Vout: { symbol: 'V', label: '최종 출력 전압', unit: 'V', color: C.Vout,
        where: '증폭기를 거친 <b>최종 출력</b>입니다. 오른쪽 <b>세로 막대(ADC 0~5 V)</b>와 큰 숫자로 표시됩니다.' },
      R: { symbol: 'R', label: '게이지 저항', unit: 'Ω', color: C.R,
        where: '보통 120 Ω 또는 350 Ω이고, 여기서는 350 Ω 게이지를 씁니다. 늘어나면 저항이 조금 커집니다(ΔR). 확대 그림 아래에 표시됩니다.' }
    },
    formulas: [
      { name: '보 표면의 변형률', tpl: '{eps} = 6{F}L ⁄ ( E·b·h² )' },
      { name: '게이지 저항 변화', tpl: 'Δ{R} ⁄ {R} = {GF} · {eps}' },
      { name: '1/4 브리지 출력', tpl: '{Vo} = {Vs} · (Δ{R}⁄{R}) ⁄ 4' },
      { name: '증폭 후 출력', tpl: '{Vout} = {A} · {Vo}' }
    ],

    init(p) { return { F: p.F, sw: 0, ph: 0 }; },
    step(st, p, dt) {
      st.F += (p.F - st.F) * Math.min(1, dt * 12);              // 하중 변화를 부드럽게
      st.sw += dt / 6; if (st.sw >= 1) st.sw -= 1;              // 그래프: 6초마다 하중 0→30 N, 위치 0→150 mm 를 훑는다
      st.ph = frac(st.ph + dt * (.08 + .05 * p.Vs));            // 전류 점 — 여기 전압이 클수록 빨리 흐른다
    },

    graphs: [
      { title: '교정 곡선과 ADC 한계 (하중 0 → 30 N 을 훑음)', xKey: 'ff', xUnit: 'N', xMin: 0, xMax: 30, y0: 0,
        series: [{ key: 'adc', label: 'ADC가 읽는 값 (V)', color: C.Vout }, { key: 'lim', label: '한계 5 V', color: PAL.rust }] },
      { title: '보의 변형률 분포 (고정단 0 → 끝 150 mm)', xKey: 'xx', xUnit: 'mm', xMin: 0, xMax: 150,
        series: [{ key: 'ex', label: '윗면 늘어남 (μɛ)', color: C.eps }, { key: 'exb', label: '아랫면 줄어듦', color: PAL.rust }] }
    ],
    sample(st, p) {
      const ff = FMAX * st.sw, xx = 150 * st.sw;
      const ex = strainAt(st.F, xx / 1000) * 1e6;
      return { ff, adc: Math.min(vbridge(ff, p) * p.A, ADC), lim: ADC, xx, ex, exb: -ex };
    },

    readouts(st, p) {
      const e = strain(st.F), Vo = vbridge(st.F, p);
      return [
        { label: '변형률 ε', value: e * 1e6, unit: 'μɛ', color: C.eps, dec: 0 },
        { label: '자유단 처짐', value: defl(st.F) * 1000, unit: 'mm', color: C.F },
        { label: '표면 응력 σ', value: e * E / 1e6, unit: 'MPa' },
        { label: '저항 변화 ΔR/R', value: p.GF * e * 100, unit: '%', dec: 3 },
        { label: '게이지 저항 R₁ (350 Ω 게이지)', value: R0 * (1 + p.GF * e), unit: 'Ω', color: C.R, dec: 3 },
        { label: '브리지 출력 Vo', value: Vo * 1000, unit: 'mV', color: C.Vo, dec: 3 },
        { label: '증폭 후 출력', value: Vo * p.A, unit: 'V', color: C.Vout },
        { label: '감도 (출력/하중)', value: st.F > .01 ? (Vo * p.A / st.F) * 1000 : (vbridge(1, p) * p.A) * 1000, unit: 'mV/N', wide: true, color: C.A }
      ];
    },

    notes: [
      '센서의 본질은 <b>물리량 → 저항 변화 → 전압</b>이라는 변환 사슬입니다. 이 3단계가 모든 센서에 공통입니다.',
      '변형률은 고작 수백 μɛ(0.0x %)입니다. 그래서 <b>브리지 + 증폭기</b>가 반드시 필요합니다.',
      '브리지는 <b>영점(하중 0에서 출력 0)</b>을 만들어 줍니다. A와 B는 둘 다 약 2.5 V라 각각 재면 차이가 묻히지만, 둘의 차이만 뽑으면 0.6 mV도 읽힙니다.',
      '출력이 하중에 <b>정비례</b>(교정 곡선이 직선)해야 좋은 센서입니다. 이 직선의 기울기가 <b>감도</b>입니다.',
      '보 윗면의 변형률은 <b>고정단에서 가장 크고 끝으로 갈수록 0</b>이 됩니다(아래 두 번째 그래프). 그래서 게이지를 고정단 가까이 붙입니다.',
      'Vs를 키우면 감도가 오르지만 자기 발열이 생기고, A를 키우면 <b>노이즈도 같이 증폭</b>됩니다.'
    ],
    presets: [
      { name: '무부하 (영점)', set: { F: 0 } },
      { name: '표준 로드셀', set: { F: 10, GF: 2, Vs: 5, A: 500 } },
      { name: '고감도 반도체 게이지', set: { GF: 5 } },
      { name: '증폭 없이 (A=1)', set: { A: 1 } }
    ],
    challenges: [
      {
        id: 'fullscale', title: '30 N 에서 4 V, 포화 없이',
        desc: '하중 30 N 일 때 증폭 후 출력이 4 V 이상이면서 포화(5 V)는 넘지 않게 맞춰 보세요.',
        hint: '출력 = A × Vs·GF·ε ⁄ 4 입니다. 여기 전압과 게이지율을 키우면 필요한 이득이 줄어듭니다.',
        check: ({ P }) => { const v = vbridge(P.F, P) * P.A; return P.F >= 30 && v >= 4 && v <= 5; }
      },
      {
        id: 'no-amp', title: '증폭기 없이 2 mV',
        desc: '증폭기 이득을 1 로 두고 브리지 출력만으로 2 mV 를 넘게 해 보세요.',
        hint: '브리지 출력은 Vs·GF·ε ⁄ 4 입니다. 하중, 게이지율, 여기 전압을 키우세요.',
        check: ({ P }) => P.A === 1 && vbridge(P.F, P) >= 2e-3
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600, small = h < 330;
      const F = st.F, e = strain(F), dr = p.GF * e, Vo = vbridge(F, p), Vout = Vo * p.A;
      const hotG = hl === 'eps' || hl === 'GF' || hl === 'R';
      const wire = PS.rgba('ink2', .55);

      /* ── 1. 외팔보 — 벽에 고정, 끝에 추 ── */
      const bx = narrow ? 22 : 34;
      const blen = narrow ? w * .52 : Math.min(w * .44, 400);
      const by = h * (narrow ? .14 : .2), bt = clamp(h * .034, 9, 18);
      const tipMax = Math.min(h * (narrow ? .12 : .14), 64);
      const tip = tipMax * F / FMAX;
      const exag = tipMax / (defl(FMAX) * blen / L);               // 처짐 과장 배율
      const yAt = s => by + tip * (s * s * (3 - s)) / 2;          // 외팔보 처짐 모양 (s: 0 고정단 ~ 1 끝)
      const path = (y0f, y1f) => {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) { const s = i / 40; i ? ctx.lineTo(bx + s * blen, y0f(s)) : ctx.moveTo(bx, y0f(0)); }
        for (let i = 40; i >= 0; i--) { const s = i / 40; ctx.lineTo(bx + s * blen, y1f(s)); }
        ctx.closePath();
      };

      // 벽
      ctx.save();
      ctx.fillStyle = PS.rgba('ink2', .16); ctx.fillRect(bx - 16, by - bt * 2.2, 16, bt * 5.4);
      ctx.restore();
      for (let i = 0; i < 6; i++) {
        const y = by - bt * 2.2 + i * bt * 5.4 / 6;
        D.line(ctx, bx - 16, y + bt * .7, bx - 4, y, { color: PS.rgba('ink3', .6) });
      }
      // 보 몸통
      path(yAt, s => yAt(s) + bt);
      ctx.save(); ctx.fillStyle = PS.rgba('ink2', .38); ctx.fill(); ctx.strokeStyle = PAL.ink2; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      // 윗면 늘어남(청록)·아랫면 줄어듦(적갈) — 굽힘 모멘트처럼 고정단에서 가장 진하고 끝에서 0
      const a = .15 + .75 * F / FMAX;
      if (F > .05) {
        const band = (y0f, y1f, name) => {
          path(y0f, y1f);
          const g = ctx.createLinearGradient(bx, 0, bx + blen, 0);
          g.addColorStop(0, PS.rgba(name, a)); g.addColorStop(1, PS.rgba(name, 0));
          ctx.save(); ctx.fillStyle = g; ctx.fill(); ctx.restore();
        };
        band(yAt, s => yAt(s) + bt * .4, 'teal');
        band(s => yAt(s) + bt * .6, s => yAt(s) + bt, 'rust');
        if (!small) {
          D.text(ctx, '윗면 늘어남', bx + blen * .52, yAt(.52) - 6, { size: 10, color: C.eps, align: 'center' });
          D.text(ctx, '아랫면 줄어듦', bx + blen * .52, yAt(.52) + bt + 14, { size: 10, color: PAL.rust, align: 'center' });
        }
      }

      // 게이지 (고정단 근처 윗면) — 지그재그 저항선
      const s0 = .05, s1 = .23, gx0 = bx + blen * s0, gx1 = bx + blen * s1;
      ctx.save();
      if (hotG) { ctx.shadowColor = C.eps; ctx.shadowBlur = 12; }
      ctx.strokeStyle = C.eps; ctx.lineWidth = hotG ? 2 : 1.5; ctx.lineJoin = 'round';
      ctx.beginPath();
      const zig = 6;
      for (let i = 0; i <= zig * 2; i++) {
        const s = s0 + (s1 - s0) * i / (zig * 2), x = bx + blen * s;
        const y = yAt(s) - 1.5 - (i % 2 ? 5 : 0);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      D.text(ctx, narrow ? 'R₁' : '게이지 R₁', gx0, yAt(s0) - 12, { size: 10.5, color: C.eps, bold: hotG });

      // 추 — 크기는 하중에 따라
      const tx = bx + blen - 6, ty = yAt(1) + bt;
      D.line(ctx, tx, ty, tx, ty + 8, { color: PAL.ink2, width: 1.5 });
      if (F > .05) {
        const bs = 9 + 17 * Math.sqrt(F / FMAX), top = ty + 8;
        ctx.save();
        if (hl === 'F') { ctx.shadowColor = C.F; ctx.shadowBlur = 14; }
        D.roundRect(ctx, tx - bs / 2, top, bs, bs, 3);
        ctx.fillStyle = PS.rgba('sage', hl === 'F' ? .55 : .3); ctx.fill();
        ctx.strokeStyle = C.F; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
        if (!small) D.arrow(ctx, tx, top + bs + 3, 0, 8 + 18 * F / FMAX, { color: C.F, width: 2.5, head: 7, hot: hl === 'F' });
        D.text(ctx, 'F = ' + fmt(F, 1) + ' N', tx + bs / 2 + 8, top + bs / 2 + 4, { size: 11, color: C.F, bold: hl === 'F' });
      } else D.text(ctx, 'F = 0 N', tx + 8, ty + 12, { size: 11, color: C.F, bold: hl === 'F' });

      D.text(ctx, (narrow ? 'ε = ' + fmt(e * 1e6, 0) + ' μɛ · ' : 'L = 150 mm · 폭 20 mm · 두께 3 mm · 스테인리스 · ') + '처짐 ×' + fmt(exag, 0) + ' 과장',
        bx, by + bt + tipMax * .25 + 30, { size: 9.5, color: narrow ? C.eps : PAL.ink3, bold: narrow && hl === 'eps' });

      /* ── 2. 게이지 확대 그림 (넓은 화면) ── */
      if (!narrow && !small) {
        const room = w - (bx + blen);
        const zr = Math.min(h * .17, room * .3, 84);
        const zx = bx + blen + room * .55, zy = Math.max(zr + 26, h * .25);
        const k = 1 + e * KG;                                      // 과장한 늘어남
        // 이음선 — 보 위 게이지에서 확대 그림으로
        const Ly = by - 22, dy = Ly - zy;
        const ex = Math.abs(dy) < zr ? zx - Math.sqrt(zr * zr - dy * dy) : zx;
        const ey = Math.abs(dy) < zr ? Ly : zy - zr;
        ctx.save();
        ctx.strokeStyle = PS.rgba('teal', .45); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(gx1, yAt(s1) - 7); ctx.lineTo(gx1 + 10, Ly); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath(); ctx.arc(zx, zy, zr, 0, 7);
        ctx.fillStyle = PS.rgba('ink', .035); ctx.fill();
        ctx.strokeStyle = PS.rgba('teal', hotG ? .9 : .45); ctx.lineWidth = 1.2; ctx.stroke();
        ctx.clip();
        const g0 = zr * 1.1, gh = zr * .7;
        // 늘어나기 전 크기 (점선)
        ctx.strokeStyle = PS.rgba('ink3', .8); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.strokeRect(zx - g0 / 2, zy - gh / 2, g0, gh);
        ctx.setLineDash([]);
        // 늘어난 저항선 — 길어지고 가늘어진다(푸아송 효과로 폭은 조금 줄어든다)
        const gl = g0 * k, ghk = gh * (1 - .3 * e * KG), n = 7;
        const xL = zx - gl / 2, xR = zx + gl / 2;
        if (hotG) { ctx.shadowColor = C.eps; ctx.shadowBlur = 10; }
        ctx.strokeStyle = C.eps; ctx.lineWidth = 2.4 / Math.sqrt(k); ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const y = zy - ghk / 2 + ghk * i / (n - 1), lr = i % 2 === 0;
          if (i === 0) ctx.moveTo(xL - 8, y);
          ctx.lineTo(lr ? xL : xR, y); ctx.lineTo(lr ? xR : xL, y);
          if (i < n - 1) ctx.lineTo(lr ? xR : xL, zy - ghk / 2 + ghk * (i + 1) / (n - 1));
          else ctx.lineTo(xR + 8, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = C.eps;
        ctx.fillRect(xL - 14, zy - ghk / 2 - 3, 6, 6); ctx.fillRect(xR + 8, zy + ghk / 2 - 3, 6, 6);
        ctx.restore();
        if (F > .3) {
          const al = 5 + 14 * F / FMAX;
          D.arrow(ctx, xR + 4, zy, al, 0, { color: C.eps, width: 2, head: 6 });
          D.arrow(ctx, xL - 4, zy, -al, 0, { color: C.eps, width: 2, head: 6 });
        }
        D.text(ctx, '게이지 확대 (늘어남 ×' + fmt(KG, 0) + ' 과장)', zx, zy - zr - 9, { size: 10, color: PAL.ink2, align: 'center' });
        D.text(ctx, 'R₁ = 350 Ω + ' + fmt(R0 * dr, 3) + ' Ω', zx, zy + zr + 17, { size: 11.5, color: C.R, align: 'center', bold: hotG });
        D.text(ctx, 'ε = ' + fmt(e * 1e6, 0) + ' μɛ · ΔR/R = ' + fmt(dr * 100, 3) + ' %', zx, zy + zr + 32,
          { size: 10, color: C.eps, align: 'center', bold: hl === 'eps' });
      } else if (!narrow) {
        D.text(ctx, 'ε = ' + fmt(e * 1e6, 0) + ' μɛ', gx1 + 10, yAt(s1) - 12, { size: 10.5, color: C.eps, bold: hotG });
      }

      /* ── 3. 휘트스톤 브리지 ── */
      const yT = h * (narrow ? .5 : .52), yB = h - 10;
      const Rb = Math.max(18, Math.min((yB - yT) / 2 - 30, narrow ? w * .14 : w * .11, 92));
      const cx = narrow ? Math.max(w * .22, Rb + 26) : Math.max(w * .26, Rb + 110), cy = (yT + yB) / 2 - 8;
      const N = [cx, cy - Rb], S = [cx, cy + Rb], W = [cx - Rb, cy], Ep = [cx + Rb, cy];
      const VA = p.Vs * 1 / (2 + dr), VB = p.Vs / 2;              // A = R₃/(R₁+R₃)·Vs (R₁만 커짐), B = Vs/2

      const arm = (a, b, col, hot, lw) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        const z0 = .3, z1 = .7, amp = clamp(Rb * .07, 3.5, 6), nz = 6;
        D.line(ctx, a[0], a[1], a[0] + dx * z0, a[1] + dy * z0, { color: wire, width: 1.6 });
        D.line(ctx, a[0] + dx * z1, a[1] + dy * z1, b[0], b[1], { color: wire, width: 1.6 });
        ctx.save();
        if (hot) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i <= nz * 2; i++) {
          const f = z0 + (z1 - z0) * i / (nz * 2), o = i === 0 || i === nz * 2 ? 0 : (i % 2 ? amp : -amp);
          const x = a[0] + dx * f - uy * o, y = a[1] + dy * f + ux * o;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.restore();
      };
      arm(N, W, C.eps, hotG, 2.2);
      arm(N, Ep, PAL.ink2, false, 1.6);
      arm(W, S, PAL.ink2, false, 1.6);
      arm(Ep, S, PAL.ink2, false, 1.6);
      // 저항 이름 — 팔 바깥쪽
      const o = Rb * .5 + 12;
      D.text(ctx, narrow ? 'R₁' : 'R₁ 게이지', cx - o, cy - o + 2, { size: 10.5, color: C.eps, align: 'right', bold: hotG });
      if (!small) {
        D.text(ctx, 'R₂', cx + o, cy - o + 2, { size: 10, color: PAL.ink3 });
        D.text(ctx, 'R₃', cx - o, cy + o + 6, { size: 10, color: PAL.ink3, align: 'right' });
        D.text(ctx, 'R₄', cx + o, cy + o + 6, { size: 10, color: PAL.ink3 });
      }

      // 전류 점 — +Vs 에서 두 갈래로 나뉘어 GND 로
      const lerp2 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      for (let k = 0; k < 5; k++) {
        const u = frac(st.ph + k / 5);
        const P1 = u < .5 ? lerp2(N, W, u * 2) : lerp2(W, S, (u - .5) * 2);
        const P2 = u < .5 ? lerp2(N, Ep, u * 2) : lerp2(Ep, S, (u - .5) * 2);
        D.dot(ctx, P1[0], P1[1], 2.3, PS.rgba('dusty', .9), hl === 'Vs');
        D.dot(ctx, P2[0], P2[1], 2.3, PS.rgba('dusty', .9), hl === 'Vs');
      }

      // 전원 +Vs, 접지
      D.line(ctx, N[0], N[1], N[0], N[1] - 12, { color: C.Vs, width: 2, hot: hl === 'Vs' });
      D.dot(ctx, N[0], N[1] - 14, 3, C.Vs, hl === 'Vs');
      D.text(ctx, '+Vs = ' + fmt(p.Vs, 1) + ' V', N[0] + 9, N[1] - 11, { size: 11, color: C.Vs, bold: hl === 'Vs' });
      D.line(ctx, S[0], S[1], S[0], S[1] + 8, { color: wire, width: 1.6 });
      D.line(ctx, S[0] - 8, S[1] + 8, S[0] + 8, S[1] + 8, { color: PAL.ink2, width: 1.6 });
      D.line(ctx, S[0] - 5, S[1] + 12, S[0] + 5, S[1] + 12, { color: PAL.ink2, width: 1.4 });
      D.line(ctx, S[0] - 2, S[1] + 16, S[0] + 2, S[1] + 16, { color: PAL.ink2, width: 1.2 });

      // 증폭기 위치와 배선 — B 는 + 입력으로 곧장, A 는 아래로 돌아 − 입력으로
      const at = clamp(Rb * .55, 26, 50), ah = at * .62;
      const ax = Ep[0] + (narrow ? 40 : 92), ay = cy + 8;
      const yLow = S[1] + 24, xr = ax - 14;
      D.line(ctx, Ep[0], cy, ax, cy, { color: wire, width: 1.6 });
      ctx.save();
      ctx.strokeStyle = wire; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(W[0], cy); ctx.lineTo(W[0] - 12, cy); ctx.lineTo(W[0] - 12, yLow); ctx.lineTo(xr, yLow); ctx.lineTo(xr, cy + 16); ctx.lineTo(ax, cy + 16); ctx.stroke();
      ctx.restore();
      D.dot(ctx, W[0], W[1], 3.2, C.Vo, hl === 'Vo'); D.dot(ctx, Ep[0], Ep[1], 3.2, C.Vo, hl === 'Vo');
      if (!narrow) {
        D.text(ctx, 'A ' + fmt(VA, 4) + ' V', W[0] - 16, cy - 7, { size: 10.5, color: C.Vo, align: 'right', bold: hl === 'Vo' });
        D.text(ctx, 'B ' + fmt(VB, 4) + ' V', Ep[0] + 8, cy - 7, { size: 10.5, color: C.Vo, bold: hl === 'Vo' });
        if (!small) D.text(ctx, '휘트스톤 브리지', cx, yLow + 15, { size: 10, color: PAL.ink3, align: 'center' });
      } else {
        D.text(ctx, 'A', W[0] - 16, cy - 5, { size: 10.5, color: C.Vo, align: 'right' });
        D.text(ctx, 'B', Ep[0] + 6, cy - 5, { size: 10.5, color: C.Vo });
      }
      D.tag(ctx, 'Vo = ' + fmt(Vo * 1000, 3) + ' mV', cx, cy, C.Vo, hl === 'Vo');
      if (!narrow && !small) D.text(ctx, 'B − A', cx, cy + 17, { size: 9.5, color: PAL.ink3, align: 'center' });

      // 계장 증폭기
      ctx.save();
      if (hl === 'A') { ctx.shadowColor = C.A; ctx.shadowBlur = 16; }
      ctx.beginPath(); ctx.moveTo(ax, ay - ah); ctx.lineTo(ax + at, ay); ctx.lineTo(ax, ay + ah); ctx.closePath();
      ctx.fillStyle = PS.rgba('violet', hl === 'A' ? .3 : .12); ctx.fill();
      ctx.strokeStyle = C.A; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.restore();
      if (!small) {
        D.text(ctx, '+', ax + 3, cy + 3.5, { size: 9.5, color: C.A });
        D.text(ctx, '−', ax + 3, cy + 19.5, { size: 9.5, color: C.A });
      }
      D.text(ctx, '×' + p.A, ax + at * .36, ay + 4, { size: narrow ? 9.5 : 10.5, color: C.A, bold: true });
      D.text(ctx, narrow ? '증폭' : '계장 증폭기', ax + at / 2, ay - ah - 7, { size: 10, color: C.A, align: 'center', bold: hl === 'A' });

      /* ── 4. ADC 막대 (0~5 V) ── */
      const mx = narrow ? ax + at + 30 : Math.max(ax + at + 70, w * .72), mw = 14;
      const mT = cy - Rb, mH = Rb * 2, sat = Vout > ADC;
      D.line(ctx, ax + at, ay, mx, ay, { color: wire, width: 1.6 });
      ctx.save();
      D.roundRect(ctx, mx, mT, mw, mH, 3);
      ctx.fillStyle = PS.rgba('ink', .05); ctx.fill(); ctx.strokeStyle = PS.rgba('ink3', .7); ctx.lineWidth = 1; ctx.stroke();
      const fh = mH * clamp(Vout / ADC, 0, 1);
      if (fh > .5) {
        if (hl === 'Vout' || hl === 'A') { ctx.shadowColor = C.Vout; ctx.shadowBlur = 12; }
        D.roundRect(ctx, mx, mT + mH - fh, mw, fh, 3);
        ctx.fillStyle = sat ? PAL.rust : C.Vout; ctx.globalAlpha = .85; ctx.fill();
      }
      ctx.restore();
      for (let v = 0; v <= ADC; v++) {
        const y = mT + mH - mH * v / ADC, lab = mH > 70 || v === 0 || v === ADC;
        D.line(ctx, mx + mw, y, mx + mw + 4, y, { color: PAL.ink3 });
        if (lab) D.text(ctx, v + '', mx + mw + 7, y + 3.5, { size: 9, color: PAL.ink3 });
      }
      const nx = mx + mw + (narrow ? 20 : 30);
      D.text(ctx, fmt(Vout, 3) + ' V', nx, cy + 2, { size: narrow ? 14 : 20, color: sat ? PAL.rust : C.Vout, bold: true });
      D.text(ctx, narrow ? 'ADC' : 'ADC 입력 (0~5 V)', nx, cy + (narrow ? 16 : 20), { size: 9.5, color: PAL.ink3 });
      if (sat) D.tag(ctx, narrow ? '⚠ 포화' : '⚠ 포화. 이득을 낮추세요', nx, cy - (narrow ? 16 : 24), PAL.rust, true, 'left');
    }
  });
})();
