/* [항공우주공학·비행역학] 항력과 양항비 — L/D = C_L/C_D,  C_D = C_D0 + C_L²/(πARe)
   비행기가 받는 항력은 두 종류다. 공기를 헤치고 나가는 '유해항력'은 빠를수록
   커지고, 양력을 만드느라 생기는 '유도항력'은 느릴수록 커진다. 둘의 합이 최소가
   되는 지점이 딱 하나 있고, 거기서 양항비 L/D가 최대가 된다 — 엔진이 꺼져도
   가장 멀리 활공하는 속도이고, 가장 적은 연료로 가장 멀리 가는 속도이기도 하다.
   글라이더가 가늘고 긴 날개를 갖는 이유가 이 식 하나에 들어 있다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { V: '#fb7185', AR: '#5eead4', CD0: '#fbbf24', WS: '#a78bfa',
              CL: '#60a5fa', CD: '#fb923c', LD: '#34d399' };
  const RHO = 1.225, OSW = .82;

  const clOf = p => (p.WS) / (.5 * RHO * p.V * p.V);
  const cdiOf = p => { const cl = clOf(p); return cl * cl / (Math.PI * p.AR * OSW); };
  const cdOf = p => p.CD0 + cdiOf(p);
  const ldOf = p => clOf(p) / cdOf(p);
  const ldMax = p => .5 * Math.sqrt(Math.PI * p.AR * OSW / p.CD0);
  const vBest = p => Math.sqrt(2 * p.WS / RHO / Math.sqrt(Math.PI * p.AR * OSW * p.CD0));
  const glideDeg = p => Math.atan(1 / ldOf(p)) * 180 / Math.PI;

  PS.register({
    id: 'aero-drag', mode: 'aero', category: '비행역학',
    title: '항력과 양항비',
    sub: 'L/D = C_L/C_D',
    tagline: '유해항력은 빠를수록, 유도항력은 느릴수록 커집니다. 둘의 합이 최소가 되는 속도가 딱 하나 있고 — 엔진이 꺼져도 가장 멀리 가는 속도입니다.',

    params: [
      { key: 'V', symbol: 'V', label: '비행 속도', unit: 'm/s', min: 25, max: 300, step: 1, value: 60, color: C.V, dec: 0,
        where: '<b>대기에 대한 비행 속도</b>입니다. 유해항력은 V²로 커지고 유도항력은 V⁴로 작아져 — 둘의 합이 최소가 되는 지점이 아래 곡선의 바닥입니다.' },
      { key: 'AR', symbol: 'AR', label: '날개 가로세로비', unit: '', min: 3, max: 40, step: .5, value: 10, color: C.AR, dec: 1,
        where: '날개가 <b>얼마나 가늘고 긴가</b>(b²/S)입니다. 크면 날개 끝 소용돌이가 약해져 유도항력이 줄어듭니다 — 글라이더가 20~40, 여객기 9, 전투기 3 정도입니다.' },
      { key: 'CD0', symbol: 'C_D0', label: '유해항력계수', unit: '', min: .008, max: .06, step: .001, value: .025, color: C.CD0, dec: 3,
        where: '양력과 무관하게 <b>형상과 마찰로 생기는 항력</b>입니다. 매끈한 글라이더 0.010 · 여객기 0.018 · 랜딩기어를 내리면 0.05까지 올라갑니다.' },
      { key: 'WS', symbol: 'W/S', label: '날개 하중', unit: 'N/m²', min: 150, max: 7000, step: 50, value: 700, color: C.WS, dec: 0,
        where: '날개 면적 1 m²가 떠받치는 <b>무게</b>입니다. 크면 같은 양력을 내려고 더 빨리 날아야 합니다 — 글라이더 300, 세스나 700, 여객기 6000 N/m².' }
    ],
    vars: {
      CL: { symbol: 'C_L', label: '양력계수', unit: '', color: C.CL,
        where: '무게를 떠받치기 위해 <b>필요한 양력계수</b>입니다. 속도가 느릴수록 커야 하고, 보통 1.5 근처에서 실속합니다.' },
      CD: { symbol: 'C_D', label: '항력계수', unit: '', color: C.CD,
        where: '유해항력(상수)과 유도항력(C_L²에 비례)의 <b>합</b>입니다. 아래 곡선의 세로축입니다.' },
      LD: { symbol: 'L/D', label: '양항비', unit: '', color: C.LD,
        where: '양력을 항력으로 나눈 값입니다. 그대로 <b>활공비</b>가 됩니다 — L/D가 20이면 고도 1 km에서 20 km를 활공합니다.' }
    },
    formulas: [
      { name: '수평비행 조건 (양력 = 무게)', tpl: '{CL} = (W⁄S) ⁄ (½ρ{V}²)' },
      { name: '항력 = 유해 + 유도', tpl: '{CD} = {CD0} + {CL}² ⁄ (π{AR}e)' },
      { name: '양항비 = 활공비', tpl: '{LD} = {CL} ⁄ {CD}' },
      { name: '최대 양항비', tpl: '({LD})_max = ½√(π{AR}e ⁄ {CD0})' }
    ],

    init(p) { return { x: 0, done: false }; },
    step(st, p, dt) { st.x += dt * .35; if (st.x > 1) st.x -= 1; },

    graphs: [{
      title: '항력 분해 – 속도 (합이 최소인 지점이 최적 속도)', xKey: 'vx', xUnit: 'm/s', xMin: 25, y0: 0,
      series: [
        { key: 'dp', label: '유해항력 (N)', color: C.CD0 },
        { key: 'di', label: '유도항력 (N)', color: C.CL },
        { key: 'dt', label: '합 (N)', color: C.CD }
      ]
    }],
    sample(st, p) {
      const vb = vBest(p);
      const v = vb * (.55 + ((st.t * .19) % 1) * 2.1);      // 최적 속도 주위를 훑는다
      const S = 1;                                          // 단위 면적당으로 본다
      const q = .5 * RHO * v * v;
      const cl = p.WS / q;
      const dp = p.CD0 * q * S, di = (cl * cl / (Math.PI * p.AR * OSW)) * q * S;
      return { vx: v, dp: dp, di: di, dt: dp + di };
    },

    readouts(st, p) {
      const cl = clOf(p), cd = cdOf(p), cdi = cdiOf(p), ld = ldOf(p);
      const best = vBest(p), lm = ldMax(p);
      const stall = Math.sqrt(2 * p.WS / (RHO * 1.5));
      return [
        { label: '양력계수 C_L', value: cl, unit: '', color: C.CL, dec: 3 },
        { label: '유해항력계수', value: p.CD0, unit: '', color: C.CD0, dec: 4 },
        { label: '유도항력계수', value: cdi, unit: '', color: C.CL, dec: 4 },
        { label: '전체 항력계수 C_D', value: cd, unit: '', color: C.CD, dec: 4 },
        { label: '양항비 L/D', value: ld, unit: '', color: C.LD, dec: 2 },
        { label: '이 날개의 최대 L/D', value: lm, unit: '', color: '#34d399', dec: 2 },
        { label: '최적 활공 속도', value: best, unit: 'm/s', dec: 1, color: C.V },
        { label: '실속 속도 (C_L = 1.5)', value: stall, unit: 'm/s', dec: 1,
          color: p.V < stall ? '#fb7185' : '#93a2c4' },
        { label: '활공각', value: glideDeg(p), unit: '°', dec: 2, color: C.LD },
        { label: '고도 1 km에서 활공 거리', value: ld, unit: 'km', dec: 2, color: C.LD },
        { label: '유도/유해 항력 비', value: cdi / p.CD0, unit: '', dec: 2, color: '#fbbf24' },
        { label: '지금 어떤 상태인가', wide: true,
          color: p.V < stall ? '#fb7185' : (Math.abs(p.V - best) / best < .06 ? '#34d399' : '#fbbf24'),
          value: p.V < stall ? '실속! 이 속도로는 뜰 수 없다' :
                 (Math.abs(p.V - best) / best < .06 ? '최적 활공 속도 — L/D 최대' :
                  (p.V < best ? '너무 느리다 — 유도항력이 지배' : '너무 빠르다 — 유해항력이 지배')) },
        { label: '최대 L/D일 때는', value: '유도항력 = 유해항력 (정확히 반반)', wide: true, color: '#34d399' }
      ];
    },

    notes: [
      '<b>항력이 두 종류라는 것이 핵심입니다.</b> 유해항력은 속도의 제곱으로 커지고, 유도항력은 (양력을 유지해야 하므로) 속도의 네제곱으로 작아집니다. 그래서 합이 최소인 속도가 딱 하나 존재합니다.',
      '<b>최대 L/D에서는 유도항력과 유해항력이 정확히 같습니다.</b> 이것이 최적 활공 속도이자 최대 항속거리 속도입니다 — 슬라이더로 속도를 옮기며 아래 두 곡선이 교차하는 지점을 찾아보세요.',
      '<b>양항비가 곧 활공비입니다.</b> L/D = 20이면 엔진이 꺼져도 고도 1 km에서 20 km를 갑니다. 2009년 허드슨강 불시착 때 조종사가 계산한 것이 정확히 이 값이었습니다.',
      '<b>가로세로비(AR)가 유도항력을 지배합니다.</b> 날개 끝에서 아래쪽 고압 공기가 위로 말려 올라가며 소용돌이를 만드는데, 날개가 길수록 그 비율이 작아집니다. 글라이더(AR 30+)가 L/D 50을 넘는 이유이고, 여객기에 윙렛을 다는 이유이기도 합니다.',
      '<b>전투기는 일부러 AR을 낮춥니다</b>(3~4). 초음속에서는 긴 날개가 오히려 불리하고, 빠른 롤 기동과 구조 강도가 더 중요하기 때문입니다 — 효율보다 기동성을 산 것입니다.',
      '항속거리는 <b>브레게 식</b> R = (V/c)·(L/D)·ln(W₀/W₁) 으로, L/D에 정비례합니다. L/D를 10% 올리면 연료를 그대로 두고도 10% 멀리 갑니다 — 항공사 수익과 직결되는 숫자입니다.'
    ],
    presets: [
      { name: '경비행기 (세스나급)', set: { V: 60, AR: 7.5, CD0: .028, WS: 700 } },
      { name: '고성능 글라이더', set: { V: 30, AR: 30, CD0: .010, WS: 350 } },
      { name: '여객기 (순항)', set: { V: 250, AR: 9, CD0: .018, WS: 6000 } },
      { name: '전투기 (낮은 AR)', set: { V: 200, AR: 3.5, CD0: .022, WS: 4000 } },
      { name: '랜딩기어를 내리면', set: { V: 60, AR: 7.5, CD0: .055, WS: 700 } },
      { name: '너무 느리게 (유도항력 폭증)', set: { V: 32, AR: 7.5, CD0: .028, WS: 700 } }
    ],
    challenges: [
      {
        id: 'glider', title: '활공비 40 넘기기',
        desc: '양항비 L/D를 40 이상으로 만들어, 고도 1 km에서 40 km를 활공할 수 있게 해 보세요.',
        hint: '(L/D)max = ½√(πARe/C_D0). 가로세로비를 크게, 유해항력을 작게 — 그리고 속도를 최적 활공 속도에 맞추세요.',
        check: ({ P }) => ldOf(P) >= 40
      },
      {
        id: 'best', title: '최적 속도 맞추기',
        desc: '현재 L/D가 이 날개의 최대 L/D의 99% 이상이 되도록 속도를 맞춰 보세요.',
        hint: '측정값 칸의 "최적 활공 속도"에 속도 슬라이더를 맞추면 됩니다. 그때 유도항력과 유해항력이 같아집니다.',
        check: ({ P }) => ldOf(P) >= ldMax(P) * .99
      },
      {
        id: 'even', title: '두 항력을 똑같이 만들기',
        desc: '유도항력계수와 유해항력계수의 비를 1.00 ± 0.03으로 맞춰 보세요 — 이것이 최대 L/D의 조건입니다.',
        hint: '최적 속도에서 정확히 이렇게 됩니다. 측정값 칸의 "유도/유해 항력 비"를 보며 속도를 조절하세요.',
        check: ({ P }) => { const r = cdiOf(P) / P.CD0; return r >= .97 && r <= 1.03; }
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cl = clOf(p), cd = cdOf(p), ld = ldOf(p), ga = glideDeg(p);
      const best = vBest(p), lm = ldMax(p);
      const stall = Math.sqrt(2 * p.WS / (RHO * 1.5));

      /* ── 활공하는 비행기 ── */
      const px = w * .30, py = h * .22;
      const rad = -ga * Math.PI / 180;
      ctx.save();
      ctx.translate(px, py); ctx.rotate(rad);
      // 동체
      D.poly(ctx, [[-30, 0], [14, -4], [26, 0], [14, 4]], { fill: 'rgba(200,211,239,.4)', stroke: '#c8d3ef', width: 1.6 });
      // 날개 (가로세로비를 길이로 표현)
      const span = clamp(10 + p.AR * 2.4, 20, 110);
      ctx.save();
      if (hl === 'AR') { ctx.shadowColor = C.AR; ctx.shadowBlur = 16; }
      D.roundRect(ctx, -6, -span / 2, 11, span, 2);
      ctx.fillStyle = 'rgba(94,234,212,.4)'; ctx.fill();
      ctx.strokeStyle = C.AR; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
      D.poly(ctx, [[-30, 0], [-24, -13], [-20, 0]], { fill: 'rgba(200,211,239,.4)', stroke: '#c8d3ef', width: 1.2 });
      ctx.restore();
      // 날개 끝 소용돌이 (유도항력)
      const vg = clamp(cdiOf(p) / Math.max(cd, 1e-6), 0, 1);
      if (vg > .05) {
        ctx.save(); ctx.strokeStyle = 'rgba(96,165,250,' + (.2 + .55 * vg) + ')'; ctx.lineWidth = 1.5;
        [-1, 1].forEach(s => {
          for (let k = 0; k < 4; k++) {
            const bx = px - 34 - k * 20, by = py + s * span * .5 * Math.cos(rad);
            ctx.beginPath();
            ctx.arc(bx, by, 5 + k * 2.5 + vg * 8, st.t * 3 * s + k, st.t * 3 * s + k + 4.6);
            ctx.stroke();
          }
        });
        ctx.restore();
        D.text(ctx, '날개 끝 소용돌이 = 유도항력', px - 46, py + span * .5 + 32,
          { size: 9.5, color: 'rgba(96,165,250,.85)', align: 'center' });
      }
      // 양력·항력·무게
      D.arrow(ctx, px, py, Math.sin(rad) * 60, -Math.cos(rad) * 60,
        { color: C.CL, width: 3, head: 8, hot: hl === 'CL', label: 'L', ly: -8 });
      D.arrow(ctx, px, py, -Math.cos(rad) * clamp(60 / Math.max(ld, 1) * 4, 10, 60), -Math.sin(rad) * clamp(60 / Math.max(ld, 1) * 4, 10, 60),
        { color: C.CD, width: 3, head: 8, hot: hl === 'CD', label: 'D', ly: 14 });
      D.arrow(ctx, px, py, 0, 56, { color: '#93a2c4', width: 2.4, head: 7, label: 'W', lx: 12 });
      // 활공 경로
      const gx2 = px + 140;
      D.line(ctx, px, py, gx2, py + (gx2 - px) * Math.tan(ga * Math.PI / 180),
        { color: 'rgba(52,211,153,.5)', dash: [5, 5], width: 1.8 });
      D.line(ctx, px, py, gx2, py, { color: 'rgba(147,162,196,.25)', dash: [3, 4] });
      ctx.save(); ctx.strokeStyle = C.LD; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(px, py, 62, 0, ga * Math.PI / 180); ctx.stroke(); ctx.restore();
      D.text(ctx, 'γ = ' + fmt(ga, 2) + '°', px + 70, py + 20,
        { size: 11, color: hl === 'LD' ? '#fff' : C.LD, bold: true });
      D.tag(ctx, 'L/D = ' + fmt(ld, 2) + '  →  1 km 고도에서 ' + fmt(ld, 1) + ' km 활공',
        px + 16, py - 72, C.LD, hl === 'LD');
      if (p.V < stall) D.tag(ctx, '실속! 속도가 너무 낮다', px, py + 92, '#fb7185', true);

      /* ── 항력 곡선 ── */
      const gx = 48, gy = h - 178, gw = Math.min(w - 96, 480), gh = 124;
      D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      D.text(ctx, '항력 – 속도  (두 곡선이 만나는 곳이 최적)', gx + 4, gy - 8, { size: 10.5, color: '#61719a' });
      const VLO = Math.max(15, best * .45), VHI = Math.min(300, Math.max(best * 2.8, p.V * 1.15));
      const GX = v => gx + gw * clamp((v - VLO) / (VHI - VLO), 0, 1);
      const dmax = (p.WS / Math.max(lm, 1)) * 3.4;          // 최소 항력의 3.4배까지만 보여 준다
      const GY = d => gy + gh - d / dmax * (gh - 6) - 3;
      [[(v) => p.CD0 * .5 * RHO * v * v, C.CD0, '유해'],
       [(v) => { const q = .5 * RHO * v * v, c2 = p.WS / q; return c2 * c2 / (Math.PI * p.AR * OSW) * q; }, C.CL, '유도'],
       [(v) => { const q = .5 * RHO * v * v, c2 = p.WS / q; return p.CD0 * q + c2 * c2 / (Math.PI * p.AR * OSW) * q; }, C.CD, '합']
      ].forEach(([fn, cc, lab], i) => {
        ctx.save(); ctx.strokeStyle = cc; ctx.lineWidth = i === 2 ? 2.4 : 1.6;
        if (i < 2) ctx.setLineDash([4, 3]);
        ctx.beginPath();
        let up = true;                                       // 상자 위로 벗어나면 선을 끊는다
        for (let v = VLO; v <= VHI; v += (VHI - VLO) / 160) {
          const Y = GY(fn(v));
          if (Y < gy + 1) { up = true; continue; }
          if (up) { ctx.moveTo(GX(v), Y); up = false; } else ctx.lineTo(GX(v), Y);
        }
        ctx.stroke(); ctx.restore();
        const lv = i === 1 ? VLO + (VHI - VLO) * .08 : VHI - (VHI - VLO) * .06;
        D.text(ctx, lab, GX(lv), clamp(GY(fn(lv)) - 6, gy + 10, gy + gh - 4),
          { size: 9, color: cc, align: i === 1 ? 'left' : 'right' });
      });
      // 최적 속도 · 실속 속도 · 현재
      D.line(ctx, GX(best), gy, GX(best), gy + gh, { color: '#34d399', dash: [4, 4], width: 1.8 });
      D.text(ctx, '최적 ' + fmt(best, 0), GX(best) + 4, gy + 14, { size: 9.5, color: '#34d399' });
      if (stall > VLO && stall < VHI) {
        ctx.save(); ctx.fillStyle = 'rgba(251,113,133,.10)'; ctx.fillRect(gx, gy, GX(stall) - gx, gh); ctx.restore();
        D.text(ctx, '실속', gx + 4, gy + gh - 6, { size: 9, color: 'rgba(251,113,133,.85)' });
      }
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      D.line(ctx, GX(p.V), gy, GX(p.V), gy + gh, { color: '#fff', width: 2 }); ctx.restore();
      D.dot(ctx, GX(p.V), GY(cd * .5 * RHO * p.V * p.V), 4.5, C.CD, true);
      D.text(ctx, '속도 (m/s) →', gx + gw, gy + gh + 15, { size: 9, color: '#61719a', align: 'right' });

      /* ── 요약 ── */
      D.text(ctx, 'L/D = ' + fmt(ld, 2) + '  /  최대 ' + fmt(lm, 2) + '   ·   최적 속도 ' + fmt(best, 0) + ' m/s',
        gx, h - 32, { size: 12, color: hl === 'LD' ? '#fff' : C.LD, bold: true });
      D.text(ctx, 'AR = ' + fmt(p.AR, 1) + '   ·   C_D0 = ' + fmt(p.CD0, 3) +
        '   ·   유도/유해 = ' + fmt(cdiOf(p) / p.CD0, 2),
        gx, h - 12, { size: 11, color: '#93a2c4' });
    }
  });
})();
