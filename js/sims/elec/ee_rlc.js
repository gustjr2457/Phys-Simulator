/* [전기공학·회로이론] RLC 직렬 공진 — f₀ = 1/(2π√(LC)), Q = (1/R)√(L/C)
   주파수를 천천히 올리면서 전류를 기록한다(주파수 스윕 — 실험실에서 공진을 측정하는
   바로 그 방법). 코일의 유도성 리액턴스 X_L = ωL은 주파수와 함께 커지고, 커패시터의
   X_C = 1/ωC는 작아진다. 둘이 정확히 상쇄되는 지점이 공진이고, 그 순간 회로는
   저항만 남아 전류가 최대가 된다 — 라디오 선국, 무선충전, 임피던스 정합의 원리. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { R: '#fb7185', L: '#5eead4', Cc: '#60a5fa', V: '#fbbf24',
              f: '#93a2c4', f0: '#f472b6', Z: '#a78bfa', I: '#34d399', ph: '#fb923c' };
  const VS = 10;                     // 전원 진폭 10 V (고정)
  const SWEEP = 20;                  // 스윕 시간(초)

  const f0Of = p => 1 / (2 * Math.PI * Math.sqrt(p.L * 1e-3 * p.Cc * 1e-6));
  const Qof = p => (1 / p.R) * Math.sqrt(p.L * 1e-3 / (p.Cc * 1e-6));
  const fNow = (st, p) => f0Of(p) * (.15 + 2.85 * Math.min(1, st.t / SWEEP));
  const XL = (f, p) => 2 * Math.PI * f * p.L * 1e-3;
  const XC = (f, p) => 1 / (2 * Math.PI * f * p.Cc * 1e-6);
  const Zof = (f, p) => { const x = XL(f, p) - XC(f, p); return Math.sqrt(p.R * p.R + x * x); };
  const Iof = (f, p) => VS / Zof(f, p) * 1000;                       // mA
  const phOf = (f, p) => Math.atan2(XL(f, p) - XC(f, p), p.R) * 180 / Math.PI;

  PS.register({
    id: 'ee-rlc', mode: 'elec', category: '회로이론',
    title: 'RLC 공진과 임피던스',
    sub: 'f₀ = 1/2π√(LC)',
    tagline: '주파수를 천천히 올려 봅니다. 코일과 커패시터의 방해가 정확히 상쇄되는 한 점에서 전류가 폭발하듯 커집니다 — 라디오가 한 방송만 골라 듣는 방법입니다.',

    params: [
      { key: 'R', symbol: 'R', label: '저항', unit: 'Ω', min: 1, max: 200, step: 1, value: 50, color: C.R, dec: 0, reset: true,
        where: '<b>공진의 날카로움</b>을 혼자 결정합니다. 공진에서는 L과 C가 상쇄되어 R만 남으므로, 최대 전류는 정확히 V/R이고 선택도 Q는 1/R에 비례합니다.' },
      { key: 'L', symbol: 'L', label: '인덕터', unit: 'mH', min: 1, max: 100, step: 1, value: 10, color: C.L, dec: 0, reset: true,
        where: '<b>코일</b>입니다. 전류 변화를 거부하므로 주파수가 높을수록 더 막습니다(X_L = ωL — 오른쪽 그래프의 올라가는 청록 선).' },
      { key: 'Cc', symbol: 'C', label: '커패시터', unit: 'µF', min: .1, max: 10, step: .1, value: 1, color: C.Cc, dec: 1, reset: true,
        where: '<b>커패시터</b>입니다. 전압 변화를 거부하므로 주파수가 낮을수록 더 막습니다(X_C = 1/ωC — 내려가는 파란 선). 두 선이 만나는 곳이 공진입니다.' }
    ],
    vars: {
      f0: { symbol: 'f₀', label: '공진 주파수', unit: 'Hz', color: C.f0,
        where: 'X_L과 X_C가 정확히 상쇄되는 <b>단 하나의 주파수</b>입니다(분홍 수직선). L과 C만으로 정해지고 R과는 무관합니다.' },
      Z: { symbol: 'Z', label: '임피던스', unit: 'Ω', color: C.Z,
        where: '회로가 교류를 <b>얼마나 막는가</b>입니다. 공진에서 최소값 R까지 내려갑니다 — 그때 전류가 최대가 됩니다.' },
      I: { symbol: 'I', label: '전류', unit: 'mA', color: C.I,
        where: '회로에 흐르는 전류 진폭입니다. 아래 <b>공진 곡선</b>의 세로축이자, 공진에서 솟아오르는 봉우리입니다.' },
      ph: { symbol: 'φ', label: '위상차', unit: '°', color: C.ph,
        where: '전압보다 전류가 <b>얼마나 늦거나 빠른가</b>입니다. 공진 아래에서는 전류가 앞서고(용량성), 위에서는 뒤처지며(유도성), 공진에서 정확히 0이 됩니다.' }
    },
    formulas: [
      { name: '리액턴스', tpl: 'X_L = 2πf{L},  X_C = 1 ⁄ 2πf{Cc}' },
      { name: '임피던스', tpl: '{Z} = √( {R}² + (X_L − X_C)² )' },
      { name: '공진 조건 (X_L = X_C)', tpl: '{f0} = 1 ⁄ 2π√({L}{Cc})' },
      { name: '선택도 (첨예도)', tpl: 'Q = (1⁄{R})·√({L}⁄{Cc})' },
      { name: '전류와 위상', tpl: '{I} = V ⁄ {Z},   {ph} = tan⁻¹((X_L−X_C)⁄{R})' }
    ],

    init(p) { return { done: false }; },
    step(st, p, dt) { if (st.t > SWEEP + 4) st.done = true; },

    graphs: [{
      title: '전류 – 주파수 (공진 곡선)', xKey: 'f', xUnit: 'Hz', y0: 0,
      series: [{ key: 'I', label: 'I (mA)', color: C.I }]
    }, {
      title: '위상차 – 주파수', xKey: 'f', xUnit: 'Hz',
      series: [{ key: 'ph', label: 'φ (°)', color: C.ph }]
    }],
    sample(st, p) {
      const f = fNow(st, p);
      return { f: f, I: Iof(f, p), ph: phOf(f, p) };
    },

    readouts(st, p) {
      const f = fNow(st, p), f0 = f0Of(p), Q = Qof(p);
      const xl = XL(f, p), xc = XC(f, p), Z = Zof(f, p), I = Iof(f, p);
      const vl = I / 1000 * xl, vcv = I / 1000 * xc;
      return [
        { label: '현재 주파수 f', value: f, unit: 'Hz', color: C.f, dec: 0 },
        { label: '공진 주파수 f₀', value: f0, unit: 'Hz', color: C.f0, dec: 0 },
        { label: 'X_L = 2πfL', value: xl, unit: 'Ω', color: C.L, dec: 1 },
        { label: 'X_C = 1/2πfC', value: xc, unit: 'Ω', color: C.Cc, dec: 1 },
        { label: '임피던스 |Z|', value: Z, unit: 'Ω', color: C.Z, dec: 1 },
        { label: '전류 I', value: I, unit: 'mA', color: C.I, dec: 1 },
        { label: '위상차 φ', value: phOf(f, p), unit: '°', color: C.ph, dec: 1 },
        { label: '선택도 Q', value: Q, unit: '', color: '#fbbf24', dec: 2 },
        { label: '대역폭 Δf = f₀/Q', value: f0 / Q, unit: 'Hz', dec: 0, color: '#fbbf24' },
        { label: '코일 전압 V_L', value: vl, unit: 'V', color: C.L, dec: 2 },
        { label: '커패시터 전압 V_C', value: vcv, unit: 'V', color: C.Cc, dec: 2 },
        { label: '공진 시 최대 전류 (V/R)', value: VS / p.R * 1000, unit: 'mA', dec: 1, color: C.I },
        { label: '지금 어떤 성격인가', wide: true,
          color: Math.abs(xl - xc) < p.R * .2 ? '#34d399' : (xl > xc ? C.L : C.Cc),
          value: Math.abs(xl - xc) < p.R * .2 ? '공진 — 저항만 남았다 (φ ≈ 0)' :
                 (xl > xc ? '유도성 — 코일이 지배, 전류가 뒤처진다' : '용량성 — 커패시터가 지배, 전류가 앞선다') }
      ];
    },

    notes: [
      '<b>공진 주파수는 L과 C만으로 정해집니다.</b> 저항을 바꿔도 봉우리의 위치는 그대로이고 <b>높이와 폭만</b> 달라집니다 — R이 작을수록 좁고 높은 봉우리(큰 Q)가 됩니다.',
      '공진에서 코일과 커패시터의 방해는 <b>완전히 상쇄됩니다</b>(크기는 같고 부호가 반대). 회로는 순수한 저항처럼 보이고, 전원 입장에서는 L과 C가 사라진 것처럼 느껴집니다.',
      '그런데 <b>L과 C 각각의 전압은 사라지지 않습니다</b> — 공진에서 V_L = V_C = Q×V가 됩니다. Q가 10이면 10 V 전원으로 코일에 100 V가 걸립니다(전압 확대). 무선충전과 테슬라 코일이 이것을 이용하고, 설계에서는 내압을 반드시 확인해야 합니다.',
      '<b>Q는 선택도입니다.</b> 대역폭 Δf = f₀/Q이므로 Q가 클수록 좁은 주파수만 통과시킵니다 — 라디오가 옆 채널을 섞지 않고 한 방송만 듣는 원리입니다.',
      '위상차 φ는 공진에서 <b>0을 지나며 부호가 바뀝니다.</b> 전력 계통에서 "역률 개선"은 유도성 부하(모터)에 커패시터를 달아 이 φ를 0에 가깝게 되돌리는 작업입니다.'
    ],
    presets: [
      { name: '기본 (f₀ ≈ 1.6 kHz, Q = 2)', set: { R: 50, L: 10, Cc: 1 } },
      { name: '첨예한 공진 (Q = 20)', set: { R: 5, L: 10, Cc: 1 } },
      { name: '둔한 공진 (Q = 0.5)', set: { R: 200, L: 10, Cc: 1 } },
      { name: '낮은 공진 주파수', set: { R: 50, L: 100, Cc: 10 } },
      { name: '전압 확대 (V_L ≫ V)', set: { R: 2, L: 50, Cc: .5 } },
      { name: '1 kHz에 선국 (L·C = 25)', set: { R: 10, L: 25, Cc: 1 } }
    ],
    challenges: [
      {
        id: 'sharp', title: '첨예한 공진 (Q ≥ 10)',
        desc: '선택도 Q를 10 이상으로 만들어 좁고 높은 봉우리를 만들어 보세요.',
        hint: 'Q = (1/R)√(L/C)입니다. 저항을 작게, 인덕터를 크게, 커패시터를 작게.',
        check: ({ P }) => Qof(P) >= 10
      },
      {
        id: 'boost', title: '전원보다 큰 전압 만들기',
        desc: '코일 전압 V_L이 전원 전압(10 V)의 3배를 넘는 순간을 만들어 보세요 — 공진의 전압 확대입니다.',
        hint: '공진에서 V_L = Q×V입니다. Q를 3보다 크게 하고, 스윕이 공진을 지나갈 때까지 기다리세요.',
        check: ({ P, st }) => { const f = fNow(st, P); return Iof(f, P) / 1000 * XL(f, P) > VS * 3; }
      },
      {
        id: 'tune', title: '1 kHz에 선국하기',
        desc: '공진 주파수를 1000 ± 20 Hz에 맞춰 보세요 — 라디오 다이얼을 돌리는 것과 같은 작업입니다.',
        hint: 'f₀ = 1/(2π√(LC)). L을 키우면 내려가고, C를 키워도 내려갑니다. 측정값 칸의 f₀를 보며 조절하세요.',
        check: ({ P }) => Math.abs(f0Of(P) - 1000) <= 20
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const f = fNow(st, p), f0 = f0Of(p), Q = Qof(p);
      const xl = XL(f, p), xc = XC(f, p), Z = Zof(f, p), I = Iof(f, p), ph = phOf(f, p);
      const near = Math.abs(xl - xc) < p.R * .2;

      /* ── 회로 ── */
      const x0 = 52, x1 = Math.min(w * .52, x0 + 290);
      const yTop = 72, yBot = yTop + Math.min(120, h * .22);
      const wire = { color: 'rgba(200,211,239,.6)', width: 2.2 };
      const seg = (x1 - x0) / 3;

      // 교류 전원
      const by = (yTop + yBot) / 2;
      D.line(ctx, x0, yTop, x0, by - 15, wire);
      D.line(ctx, x0, by + 15, x0, yBot, wire);
      ctx.save();
      if (hl === 'ph') { ctx.shadowColor = C.ph; ctx.shadowBlur = 14; }
      ctx.strokeStyle = C.V; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x0, by, 15, 0, 7); ctx.stroke();
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const u = -1 + 2 * k / 20;
        const xx = x0 + u * 9, yy = by - Math.sin(u * Math.PI) * 6;
        k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke(); ctx.restore();
      D.text(ctx, '10 V~', x0 - 20, by + 4, { size: 10, color: C.V, align: 'right' });

      // R
      D.line(ctx, x0, yTop, x0 + seg * .5 - 26, yTop, wire);
      ctx.save();
      if (hl === 'R') { ctx.shadowColor = C.R; ctx.shadowBlur = 14; }
      D.roundRect(ctx, x0 + seg * .5 - 26, yTop - 9, 52, 18, 3);
      ctx.fillStyle = 'rgba(251,113,133,.2)'; ctx.fill();
      ctx.strokeStyle = C.R; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      D.text(ctx, p.R + ' Ω', x0 + seg * .5, yTop - 16, { size: 10, color: hl === 'R' ? '#fff' : C.R, align: 'center', bold: hl === 'R' });

      // L (코일)
      const lx = x0 + seg * 1.5;
      D.line(ctx, x0 + seg * .5 + 26, yTop, lx - 28, yTop, wire);
      ctx.save();
      ctx.strokeStyle = C.L; ctx.lineWidth = hl === 'L' ? 3 : 2.2; ctx.lineCap = 'round';
      if (hl === 'L') { ctx.shadowColor = C.L; ctx.shadowBlur = 14; }
      ctx.beginPath();
      for (let k = 0; k < 4; k++) ctx.arc(lx - 21 + k * 14, yTop, 7, Math.PI, 0, false);
      ctx.stroke(); ctx.restore();
      D.text(ctx, p.L + ' mH', lx, yTop - 18, { size: 10, color: hl === 'L' ? '#fff' : C.L, align: 'center', bold: hl === 'L' });

      // C
      const ccx = x0 + seg * 2.5;
      D.line(ctx, lx + 28, yTop, ccx - 7, yTop, wire);
      ctx.save();
      if (hl === 'Cc') { ctx.shadowColor = C.Cc; ctx.shadowBlur = 14; }
      D.line(ctx, ccx - 7, yTop - 12, ccx - 7, yTop + 12, { color: C.Cc, width: 3.2 });
      D.line(ctx, ccx + 7, yTop - 12, ccx + 7, yTop + 12, { color: C.Cc, width: 3.2 });
      ctx.restore();
      D.line(ctx, ccx + 7, yTop, x1, yTop, wire);
      D.text(ctx, fmt(p.Cc, 1) + ' µF', ccx, yTop - 20, { size: 10, color: hl === 'Cc' ? '#fff' : C.Cc, align: 'center', bold: hl === 'Cc' });
      D.line(ctx, x1, yTop, x1, yBot, wire);
      D.line(ctx, x0, yBot, x1, yBot, wire);

      // 전류(움직이는 점) — 공진에서 가장 밝고 빠르다
      const imax = VS / p.R * 1000;
      const bright = clamp(I / imax, .05, 1);
      ctx.save();
      ctx.globalAlpha = bright;
      for (let k = 0; k < 18; k++) {
        const u = ((st.t * (.6 + bright * 1.4) + k / 18) % 1);
        const px2 = x0 + (x1 - x0) * u;
        D.dot(ctx, px2, yTop, 2.6, C.I, false);
        D.dot(ctx, x1 - (x1 - x0) * u, yBot, 2.6, C.I, false);
      }
      ctx.globalAlpha = 1; ctx.restore();
      D.tag(ctx, 'I = ' + fmt(I, 1) + ' mA', (x0 + x1) / 2, yBot + 20, C.I, hl === 'I');

      /* ── 페이저 ── */
      const px = x1 + 100, py = yTop + 42, scale = Math.min(46, (w - x1 - 110) * .42);
      if (px + scale + 40 < w) {
        const vmax = Math.max(VS, I / 1000 * Math.max(xl, xc)) * 1.1;
        const S = v => v / vmax * scale;
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(px, py, scale, 0, 7); ctx.stroke(); ctx.restore();
        D.line(ctx, px - scale - 6, py, px + scale + 6, py, { color: 'rgba(255,255,255,.12)' });
        D.line(ctx, px, py - scale - 6, px, py + scale + 6, { color: 'rgba(255,255,255,.12)' });
        const vr = I / 1000 * p.R, vl = I / 1000 * xl, vcv = I / 1000 * xc;
        D.arrow(ctx, px, py, S(vr), 0, { color: C.R, width: 2.6, head: 7, hot: hl === 'R' });
        D.arrow(ctx, px + S(vr), py, 0, -S(vl), { color: C.L, width: 2.6, head: 7, hot: hl === 'L' });
        D.arrow(ctx, px + S(vr), py - S(vl), 0, S(vcv), { color: C.Cc, width: 2.6, head: 7, hot: hl === 'Cc' });
        D.arrow(ctx, px, py, S(vr), -S(vl) + S(vcv), { color: C.V, width: 2.2, head: 7, dash: [4, 3] });
        D.text(ctx, '페이저 (전압 벡터)', px - scale, py - scale - 16, { size: 10, color: '#61719a' });
        D.text(ctx, 'V_R', px + S(vr) * .5, py + 14, { size: 9.5, color: C.R, align: 'center' });
        D.text(ctx, 'V_L ' + fmt(vl, 1) + 'V', px + S(vr) + 6, py - S(vl) * .6, { size: 9.5, color: C.L });
        D.text(ctx, 'V_C ' + fmt(vcv, 1) + 'V', px + S(vr) + 6, py - S(vl) + S(vcv) * .6, { size: 9.5, color: C.Cc });
        D.text(ctx, 'φ = ' + fmt(ph, 1) + '°', px - scale, py + scale + 16,
          { size: 11, color: hl === 'ph' ? '#fff' : C.ph, bold: true });
      }

      /* ── 리액턴스 + 공진 곡선 ── */
      const cx0 = 52, cy0 = yBot + 74;
      const cw = Math.min(w - 104, 500), ch = Math.min(h - cy0 - 42, 180);
      if (ch > 60) {
        const fmaxP = f0 * 3;
        const CX = ff => cx0 + clamp(ff / fmaxP, 0, 1) * cw;
        D.roundRect(ctx, cx0, cy0, cw, ch, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
        // 아래 절반: 공진 곡선 I(f)
        const ih = ch * .56, iy = cy0 + ch - ih;
        const iPeak = VS / p.R * 1000;
        const IY = ii => iy + ih - clamp(ii / iPeak, 0, 1) * ih;
        // −3dB 대역 음영
        const bw = f0 / Q;
        ctx.save(); ctx.fillStyle = 'rgba(52,211,153,.10)';
        ctx.fillRect(CX(Math.max(0, f0 - bw / 2)), iy, CX(f0 + bw / 2) - CX(Math.max(0, f0 - bw / 2)), ih);
        ctx.restore();
        ctx.save(); ctx.strokeStyle = C.I; ctx.lineWidth = 2.2; ctx.beginPath();
        for (let k = 0; k <= 180; k++) {
          const ff = Math.max(1, fmaxP * k / 180);
          const X = CX(ff), Y = IY(Iof(ff, p));
          k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.stroke(); ctx.restore();
        // 위 절반: X_L, X_C
        const xh = ch * .40;
        const xMax = Math.max(XL(fmaxP, p), p.R * 6);
        const XY = xx => cy0 + xh - clamp(xx / xMax, 0, 1) * xh;
        [[(ff) => XL(ff, p), C.L, 'X_L'], [(ff) => XC(ff, p), C.Cc, 'X_C']].forEach(([fn, col, lab]) => {
          ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
          ctx.beginPath();
          for (let k = 0; k <= 120; k++) {
            const ff = Math.max(1, fmaxP * k / 120);
            const Y = XY(fn(ff));
            if (Y > cy0 + xh + 2) { ctx.stroke(); ctx.beginPath(); continue; }
            k ? ctx.lineTo(CX(ff), Y) : ctx.moveTo(CX(ff), Y);
          }
          ctx.stroke(); ctx.restore();
          D.text(ctx, lab, CX(fmaxP) - 4, XY(fn(fmaxP)) + (lab === 'X_L' ? -4 : 12),
            { size: 9.5, color: col, align: 'right' });
        });
        // 공진 수직선
        D.line(ctx, CX(f0), cy0, CX(f0), cy0 + ch, { color: C.f0, width: 1.8, dash: [4, 4], hot: hl === 'f0' });
        D.text(ctx, 'f₀ = ' + fmt(f0, 0) + ' Hz', CX(f0) + 5, cy0 + 12,
          { size: 10.5, color: hl === 'f0' ? '#fff' : C.f0, bold: true });
        // 현재 위치
        D.line(ctx, CX(f), cy0, CX(f), cy0 + ch, { color: 'rgba(255,255,255,.4)', width: 1.4 });
        D.dot(ctx, CX(f), IY(I), 4.5, C.I, true);
        D.text(ctx, 'f = ' + fmt(f, 0) + ' Hz', CX(f), cy0 + ch + 15,
          { size: 10, color: '#e8eefc', align: 'center' });
        D.text(ctx, '리액턴스 / 전류 – 주파수', cx0 + 4, cy0 - 7, { size: 10.5, color: '#61719a' });
        D.text(ctx, 'Q = ' + fmt(Q, 2) + '  ·  대역폭 ' + fmt(bw, 0) + ' Hz',
          cx0 + cw, cy0 - 7, { size: 10.5, color: '#fbbf24', align: 'right' });
      }

      if (near) D.tag(ctx, '공진! Z = R = ' + p.R + ' Ω,  전류 최대', (x0 + x1) / 2, yTop - 42, '#34d399', true);
      else D.tag(ctx, xl > xc ? '유도성 (전류가 뒤처진다)' : '용량성 (전류가 앞선다)',
        (x0 + x1) / 2, yTop - 42, xl > xc ? C.L : C.Cc, false);
    }
  });
})();
