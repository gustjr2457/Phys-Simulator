/* [항공우주공학] 양력과 실속 — L = ½ρV²S·C_L */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { a: '#fbbf24', V: '#60a5fa', rho: '#5eead4', S: '#a78bfa', L: '#34d399', Dg: '#fb7185', CL: '#fbbf24', W: '#f472b6' };
  const ALPHA_STALL = 15;          // 실속 받음각(도)
  const CL0 = 0.25, SLOPE = 0.10;  // C_L = CL0 + 0.10·α (1/도)

  // 받음각 → 양력계수 (실속 이후 급감)
  function CLof(a) {
    if (a <= ALPHA_STALL) return CL0 + SLOPE * a;
    const peak = CL0 + SLOPE * ALPHA_STALL;
    return Math.max(0.5, peak - (a - ALPHA_STALL) * 0.055);
  }
  const CDof = a => 0.02 + Math.pow(CLof(a), 2) / (Math.PI * 7 * .8) + (a > ALPHA_STALL ? (a - ALPHA_STALL) * 0.012 : 0);
  const rhoOf = alt => 1.225 * Math.exp(-alt / 8500);

  PS.register({
    id: 'aero-lift', mode: 'adv', category: '항공우주공학',
    title: '양력과 실속',
    sub: 'L = ½ρV²S·C_L',
    tagline: '비행기를 띄우는 것은 속도일까요 각도일까요? 받음각을 올리다 보면 어느 순간 양력이 무너집니다.',

    params: [
      { key: 'a', symbol: 'α', label: '받음각', unit: '°', min: -4, max: 24, step: .5, value: 6, color: C.a, dec: 1,
        where: '날개가 <b>공기 흐름과 이루는 각도</b>입니다. 화면의 노란 각도 표시이며, 오른쪽 C_L 곡선의 가로축입니다. 15°를 넘으면 흐름이 날개 윗면에서 떨어져 나가 <b>실속</b>합니다.' },
      { key: 'V', symbol: 'V', label: '비행 속도', unit: 'm/s', min: 20, max: 250, step: 5, value: 80, color: C.V, dec: 0,
        where: '유입 <b>공기 흐름선의 속도</b>입니다. 양력은 속도의 <b>제곱</b>에 비례하므로, 속도를 2배로 하면 양력은 4배가 됩니다.' },
      { key: 'alt', symbol: 'h', label: '비행 고도', unit: 'm', min: 0, max: 12000, step: 250, value: 0, color: C.rho, dec: 0,
        where: '고도가 높을수록 <b>공기 밀도 ρ가 작아집니다</b>(배경의 흐름선이 옅어집니다). 그래서 고고도에서는 같은 양력을 내려면 더 빨리 날아야 합니다.' },
      { key: 'S', symbol: 'S', label: '날개 면적', unit: 'm²', min: 8, max: 60, step: 1, value: 16, color: C.S, dec: 0,
        where: '<b>날개의 크기</b>입니다. 양력에 정비례합니다. 착륙할 때 플랩을 펴서 S와 C_L을 동시에 키웁니다.' },
      { key: 'm', symbol: 'm', label: '기체 질량', unit: 'kg', min: 500, max: 6000, step: 100, value: 1200, color: C.W, dec: 0,
        where: '아래로 향한 <b>무게 화살표</b>입니다. 양력이 이 무게와 같아야 수평 비행이 유지됩니다.' }
    ],
    vars: {
      L: { symbol: 'L', label: '양력', unit: 'N', color: C.L,
        where: '날개 위로 향한 <b>초록 화살표</b>입니다. 무게보다 크면 상승, 작으면 하강합니다.' },
      Dg: { symbol: 'D', label: '항력', unit: 'N', color: C.Dg,
        where: '흐름 방향으로 <b>뒤로 끄는 붉은 화살표</b>입니다. 받음각을 키우면 양력과 함께 커지고, 실속 후에는 폭증합니다.' },
      CL: { symbol: 'C_L', label: '양력 계수', unit: '', color: C.CL,
        where: '오른쪽 <b>C_L–α 곡선</b>의 세로축입니다. 날개 모양과 받음각만으로 정해지는 "날개의 성능표"입니다.' },
      rho: { symbol: 'ρ', label: '공기 밀도', unit: 'kg/m³', color: C.rho,
        where: '고도에 따라 변합니다. 해면에서 1.225, 10 km 상공에서는 약 0.41로 <b>3분의 1</b>입니다.' }
    },
    formulas: [
      { name: '양력', tpl: '{L} = ½ {rho} {V}² {S} {CL}' },
      { name: '항력', tpl: '{Dg} = ½ {rho} {V}² {S} C_D' },
      { name: '양력 계수 (실속 전)', tpl: '{CL} ≈ 0.25 + 0.10·{a}' },
      { name: '수평 비행 조건', tpl: '{L} = {m}g' },
      { name: '실속 속도', tpl: 'V_s = √( 2{m}g ⁄ ({rho}{S}·C_Lmax) )' }
    ],

    init(p) { return { flow: 0 }; },
    step(st, p, dt) { st.flow += p.V * dt * .02; },

    graphs: [
      { title: '받음각 – 양력계수 (C_L 곡선)', xKey: 'a', xUnit: '°', xMin: -4, xMax: 24,
        series: [{ key: 'CL', label: 'C_L', color: C.CL }] },
      { title: '받음각 – 양력', xKey: 'a', xUnit: '°', xMin: -4, xMax: 24, y0: 0,
        series: [{ key: 'L', label: 'L (kN)', color: C.L }, { key: 'W', label: '무게 (kN)', color: C.W }] }
    ],
    sample(st, p) {
      const rho = rhoOf(p.alt), q = .5 * rho * p.V * p.V;
      return { a: p.a, CL: CLof(p.a), L: q * p.S * CLof(p.a) / 1000, W: p.m * 9.81 / 1000 };
    },

    readouts(st, p) {
      const rho = rhoOf(p.alt), q = .5 * rho * p.V * p.V;
      const CL = CLof(p.a), L = q * p.S * CL, Dr = q * p.S * CDof(p.a), W = p.m * 9.81;
      const CLmax = CL0 + SLOPE * ALPHA_STALL;
      const Vs = Math.sqrt(2 * W / (rho * p.S * CLmax));
      const stall = p.a > ALPHA_STALL;
      return [
        { label: '양력 계수 C_L', value: CL, unit: '', color: C.CL },
        { label: '공기 밀도 ρ', value: rho, unit: 'kg/m³', color: C.rho, dec: 3 },
        { label: '동압 ½ρV²', value: q, unit: 'Pa', dec: 0 },
        { label: '양력 L', value: L / 1000, unit: 'kN', color: C.L },
        { label: '무게 mg', value: W / 1000, unit: 'kN', color: C.W },
        { label: '양항비 L/D', value: CL / CDof(p.a), unit: '', color: C.Dg },
        { label: '실속 속도 V_s', value: Vs, unit: 'm/s', color: C.V },
        { label: '하중 배수 L/W', value: L / W, unit: '배' },
        { label: '비행 상태', wide: true, color: stall ? '#fb7185' : (L > W * 1.05 ? '#34d399' : (L < W * .95 ? '#fbbf24' : '#5eead4')),
          value: stall ? '⚠ 실속 — 흐름 박리, 양력 급감' : (L > W * 1.05 ? '상승' : (L < W * .95 ? '하강 (양력 부족)' : '수평 비행 (L = mg)')) }
      ];
    },

    notes: [
      '양력은 속도의 <b>제곱</b>에 비례합니다. 속도를 절반으로 줄이면 양력은 <b>1/4</b>로 떨어집니다.',
      '받음각을 키우면 양력이 커지지만 <b>15° 부근에서 한계</b>에 부딪히고, 넘어서면 오히려 급감합니다 — 이것이 실속입니다.',
      '실속은 <b>속도가 아니라 받음각</b>이 결정합니다. 아무리 빨라도 각도가 크면 실속합니다.',
      '고도가 높으면 ρ가 작아 같은 양력을 내려면 더 빠르게 날아야 합니다. 그래서 고고도 순항 속도가 빠릅니다.',
      '착륙 시 플랩을 내리는 이유: <b>S와 C_L을 키워</b> 느린 속도에서도 무게를 지탱하기 위해서입니다.'
    ],
    presets: [
      { name: '순항', set: { a: 4, V: 120, alt: 3000, S: 16, m: 1200 } },
      { name: '이륙 직후', set: { a: 10, V: 55, alt: 0 } },
      { name: '실속 진입', set: { a: 20, V: 50, alt: 0 } },
      { name: '고고도 순항', set: { alt: 11000, V: 220, a: 3 } },
      { name: '무거운 기체', set: { m: 5000 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const rho = rhoOf(p.alt), q = .5 * rho * p.V * p.V;
      const CL = CLof(p.a), L = q * p.S * CL, Dr = q * p.S * CDof(p.a), W = p.m * 9.81;
      const stall = p.a > ALPHA_STALL;
      const rad = p.a * Math.PI / 180;

      /* ── 왼쪽: 날개 단면과 흐름 ─────────────── */
      const cx = w * .27, cy = h * .44, chord = Math.min(230, w * .26);
      const cosA = Math.cos(rad), sinA = Math.sin(rad);
      // 받음각이 +면 앞전(왼쪽)이 위로, 뒷전(오른쪽)이 아래로 기울어야 한다
      const rot = (x, y) => [cx + x * cosA - y * sinA, cy + x * sinA + y * cosA];
      const upperY = t => -(.17 * chord * Math.sqrt(Math.max(0, t)) * (1 - t) * 2.6 + .04 * chord * Math.sin(Math.PI * t));
      const lowerY = t => .05 * chord * Math.sqrt(Math.max(0, t)) * (1 - t) * 2.6;

      // 익형 표면을 x구간별 상·하한으로 만들어 흐름선이 날개를 뚫지 못하게 한다
      const NB = 150, bx0 = cx - chord * .95, bx1 = cx + chord * 1.1, bwid = (bx1 - bx0) / NB;
      const topB = new Array(NB).fill(Infinity), botB = new Array(NB).fill(-Infinity);
      const upper = [], lower = [];
      for (let i = 0; i <= 180; i++) {
        const t = i / 180, xx = (t - .3) * chord;
        const pu = rot(xx, upperY(t)), pl = rot(xx, lowerY(t));
        if (i % 3 === 0) { upper.push(pu); lower.push(pl); }
        [pu, pl].forEach(pt => {
          const b = Math.floor((pt[0] - bx0) / bwid);
          if (b >= 0 && b < NB) { topB[b] = Math.min(topB[b], pt[1]); botB[b] = Math.max(botB[b], pt[1]); }
        });
      }
      // 구간 경계에서 흐름선이 계단처럼 꺾이지 않도록 표면 경계를 평활화
      for (let pass = 0; pass < 2; pass++) {
        const t0 = topB.slice(), b0 = botB.slice();
        for (let i = 1; i < NB - 1; i++) {
          if (t0[i - 1] < Infinity && t0[i] < Infinity && t0[i + 1] < Infinity) topB[i] = (t0[i - 1] + t0[i] + t0[i + 1]) / 3;
          if (b0[i - 1] > -Infinity && b0[i] > -Infinity && b0[i + 1] > -Infinity) botB[i] = (b0[i - 1] + b0[i] + b0[i + 1]) / 3;
        }
      }
      const bIdx = x => { const b = Math.floor((x - bx0) / bwid); return (b >= 0 && b < NB && topB[b] < Infinity) ? b : -1; };

      // 흐름선의 변위 = 순환(앞쪽 상승류·뒤쪽 하강류) + 날개 두께에 의한 밀어냄 + 실속 시 박리 요동
      const flowY = (x, y0) => {
        const d = y0 - cy, rel = (x - cx) / chord, above = d < 0;
        const circ = CL * chord * .062 * Math.exp(-Math.pow(d / (chord * .95), 2)) * Math.tanh(rel * 2.0);
        const thick = (above ? -1 : 1) * chord * .05
          * Math.exp(-Math.pow(d / (chord * .42), 2)) * Math.exp(-Math.pow(rel * 1.5, 2));
        let yy = y0 + circ + thick;
        if (stall && above && rel > -.15) {
          const sev = clamp((p.a - ALPHA_STALL) / 9, 0, 1);
          yy += Math.sin(x * .17 + st.flow * 9 + d * .05) * sev * 17
            * clamp(rel + .15, 0, 1) * Math.exp(-Math.pow(d / (chord * .55), 2));
        }
        const b = bIdx(x);
        if (b >= 0) { if (above) yy = Math.min(yy, topB[b] - 5); else yy = Math.max(yy, botB[b] + 5); }
        return yy;
      };

      // 실속 시 박리 영역
      if (stall) {
        ctx.save();
        ctx.fillStyle = 'rgba(251,113,133,.10)';
        ctx.beginPath();
        ctx.ellipse(cx + chord * .28, cy - chord * .22, chord * .55, chord * .26, -rad, 0, 7);
        ctx.fill(); ctx.restore();
      }

      // 유입 흐름선
      const xs = cx - chord * .95, xe = cx + chord * 1.1, NS = 11;
      ctx.save();
      ctx.globalAlpha = clamp(rho / 1.225, .3, 1) * (hl === 'rho' || hl === 'alt' ? 1 : .85);
      for (let i = 0; i < NS; i++) {
        const y0 = cy - 108 + i * 22;
        const above = y0 < cy;
        const mid = Math.abs(y0 - cy) < 30;
        ctx.strokeStyle = mid ? C.V : 'rgba(96,165,250,.42)';
        ctx.lineWidth = mid ? 2 : 1.3;
        ctx.beginPath();
        for (let s = 0; s <= 90; s++) {
          const x = xs + (s / 90) * (xe - xs);
          const yy = flowY(x, y0);
          s ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
        }
        ctx.stroke();
        // 흐름 방향 점 — 윗면 쪽이 더 빠르게 지나간다
        const spd = above ? 1 + CL * .38 : 1 - CL * .13;
        for (let k = 0; k < 3; k++) {
          const ph = ((st.flow * 2.6 * spd + i * .21 + k / 3) % 1);
          const xd = xs + ph * (xe - xs);
          D.dot(ctx, xd, flowY(xd, y0), mid ? 3 : 2.3, mid ? C.V : 'rgba(96,165,250,.6)');
        }
      }
      ctx.restore();

      const lx0 = Math.max(14, xs - 40);
      D.arrow(ctx, lx0, cy + 132, 70, 0, { color: C.V, width: 3, hot: hl === 'V', label: 'V = ' + fmt(p.V, 0) + ' m/s', ly: 18 });
      D.text(ctx, 'ρ = ' + fmt(rho, 3) + ' kg/m³  (고도 ' + fmt(p.alt, 0) + ' m)', lx0, cy - 142,
        { size: 11, color: hl === 'rho' || hl === 'alt' ? '#fff' : C.rho, bold: hl === 'rho' });

      // 익형
      ctx.save();
      ctx.beginPath();
      upper.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
      for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1]);
      ctx.closePath();
      if (hl === 'S') { ctx.shadowColor = C.S; ctx.shadowBlur = 20; }
      const wg = ctx.createLinearGradient(0, cy - chord * .2, 0, cy + chord * .2);
      wg.addColorStop(0, hl === 'S' ? '#c4b5fd' : '#dbe4f6'); wg.addColorStop(1, '#8794b5');
      ctx.fillStyle = wg; ctx.fill();
      ctx.restore();

      // 압력 설명 (힘 화살표와 겹치지 않도록 왼쪽에)
      if (!stall) {
        D.text(ctx, '윗면: 빠름 → 압력 낮음', lx0, cy - chord * .52, { size: 10.5, color: '#93c5fd' });
        D.text(ctx, '아랫면: 느림 → 압력 높음', lx0, cy + chord * .56, { size: 10.5, color: '#93a2c4' });
      }

      // 하강류(downwash) — 날개가 공기를 아래로 밀어낸 반작용이 곧 양력
      if (CL > .1) {
        const dwx = xe - 12, dwy = cy + chord * .12;
        D.arrow(ctx, dwx, dwy, 12, clamp(CL * 34, 10, 60),
          { color: 'rgba(96,165,250,.9)', width: 2.5, head: 9, hot: hl === 'L' || hl === 'CL' });
        D.text(ctx, '하강류', dwx + 16, dwy + clamp(CL * 34, 10, 60) + 14,
          { size: 10, color: '#60a5fa', align: 'center' });
      }

      // 받음각 표시 — 자유류(수평)와 시위선(앞전→뒷전) 사이의 각
      const LE = rot(-.3 * chord, 0), TE = rot(.7 * chord, 0);
      D.line(ctx, LE[0], LE[1], LE[0] + chord * .9, LE[1], { color: 'rgba(147,162,196,.45)', dash: [5, 5] });
      D.line(ctx, LE[0], LE[1], TE[0], TE[1], { color: 'rgba(147,162,196,.6)', dash: [3, 4] });
      ctx.save();
      ctx.strokeStyle = C.a; ctx.lineWidth = hl === 'a' ? 3 : 2;
      if (hl === 'a') { ctx.shadowColor = C.a; ctx.shadowBlur = 12; }
      ctx.beginPath();
      ctx.arc(LE[0], LE[1], 52, Math.min(0, rad), Math.max(0, rad));
      ctx.stroke(); ctx.restore();
      D.tag(ctx, 'α = ' + fmt(p.a, 1) + '°', LE[0] + 74, LE[1] + (p.a >= 0 ? 20 : -20), C.a, hl === 'a');

      // 힘 화살표
      const FS = 90 / Math.max(1, W / 1000);      // 무게를 90 px로 정규화
      D.arrow(ctx, cx, cy - 16, 0, -clamp(L / 1000 * FS, 6, 190),
        { color: C.L, width: 5, hot: hl === 'L' || hl === 'CL', label: 'L = ' + fmt(L / 1000, 1) + ' kN', lx: 54 });
      D.arrow(ctx, cx + chord * .18, cy + chord * .30, clamp(Dr / 1000 * FS, 4, 120), 0,
        { color: C.Dg, width: 3.5, hot: hl === 'Dg', label: 'D = ' + fmt(Dr / 1000, 2) + ' kN', ly: 20 });
      D.arrow(ctx, cx, cy + 16, 0, clamp(W / 1000 * FS, 6, 190),
        { color: C.W, width: 4, hot: hl === 'm', label: 'mg = ' + fmt(W / 1000, 1) + ' kN', lx: -58 });

      if (stall) D.tag(ctx, '⚠ 실속 (STALL) — 윗면 흐름 박리', cx, cy - 150, '#fb7185', true);

      /* ── 오른쪽: C_L 곡선 ──────────────────── */
      const px = w * .62, py = 56, pw = w - px - 34, ph = h * .5;
      const AX = a => px + ((a + 4) / 28) * pw;
      const AY = c => py + ph - clamp(c / 2.4, 0, 1) * ph;
      D.roundRect(ctx, px, py, pw, ph, 8);
      ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.stroke();
      D.text(ctx, '양력 계수 곡선  C_L – α', px, py - 12, { size: 11.5, color: '#93a2c4' });
      for (let a = 0; a <= 24; a += 6) {
        D.line(ctx, AX(a), py, AX(a), py + ph, { color: 'rgba(255,255,255,.05)' });
        D.text(ctx, a + '°', AX(a), py + ph + 14, { size: 9.5, color: '#61719a', align: 'center' });
      }
      // 실속 영역
      ctx.save(); ctx.fillStyle = 'rgba(251,113,133,.08)';
      ctx.fillRect(AX(ALPHA_STALL), py, px + pw - AX(ALPHA_STALL), ph); ctx.restore();
      D.line(ctx, AX(ALPHA_STALL), py, AX(ALPHA_STALL), py + ph, { color: '#fb7185', dash: [5, 5] });
      D.text(ctx, '실속 영역', AX(ALPHA_STALL) + 6, py + 14, { size: 10, color: '#fb7185' });

      ctx.save();
      ctx.strokeStyle = C.CL; ctx.lineWidth = hl === 'CL' || hl === 'a' ? 3 : 2.2;
      if (hl === 'CL' || hl === 'a') { ctx.shadowColor = C.CL; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let i = 0; i <= 140; i++) { const a = -4 + i / 140 * 28; const y = AY(CLof(a)); i ? ctx.lineTo(AX(a), y) : ctx.moveTo(AX(a), y); }
      ctx.stroke(); ctx.restore();

      const opx = AX(p.a), opy = AY(CL);
      D.line(ctx, opx, py + ph, opx, opy, { color: C.a, dash: [3, 4], hot: hl === 'a' });
      D.dot(ctx, opx, opy, 6, '#fff', true);
      D.tag(ctx, 'C_L = ' + fmt(CL, 2), opx, opy - 20, C.CL, hl === 'CL' || hl === 'a');

      // 양력 = 무게 비교 막대
      const bx = px, byy = py + ph + 40;
      const maxF = Math.max(L, W) * 1.15 / 1000;
      D.text(ctx, '양력과 무게의 균형', bx, byy - 8, { size: 11, color: '#61719a' });
      D.bar(ctx, bx, byy, pw, 12, L / 1000, maxF, C.L, null, hl === 'L');
      D.text(ctx, '양력 ' + fmt(L / 1000, 1) + ' kN', bx + pw + 6, byy + 11, { size: 10.5, color: C.L, align: 'right' });
      D.bar(ctx, bx, byy + 20, pw, 12, W / 1000, maxF, C.W, null, hl === 'm');
      D.text(ctx, '무게 ' + fmt(W / 1000, 1) + ' kN', bx + pw + 6, byy + 31, { size: 10.5, color: C.W, align: 'right' });
    }
  });
})();
