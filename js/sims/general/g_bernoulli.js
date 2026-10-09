/* [일반물리·유체역학] 연속 방정식과 베르누이 — A₁v₁ = A₂v₂,  p + ½ρv² + ρgh = 일정
   관이 좁아지면 유체는 빨라져야 한다(들어온 만큼 나가야 하니까). 그런데 빨라지려면
   누군가 밀어 줘야 하고, 그 일을 하는 것이 압력이다 — 그래서 빠른 곳의 압력이 낮다.
   흔히 "베르누이 때문에 비행기가 난다"고 거칠게 말하지만, 정확히는 <b>에너지 보존</b>을
   유체에 적용한 것이고, 벤투리관·피토관·캐비테이션·분무기가 모두 여기서 나온다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Q: '#60a5fa', D1: '#93a2c4', D2: '#5eead4', rho: '#a78bfa',
              v1: '#93a2c4', v2: '#fb7185', dp: '#fbbf24' };
  const PVAP = 2340;                 // 20 °C 물의 포화 증기압 [Pa]
  const PATM = 101325;

  const area = d => Math.PI * Math.pow(d / 200, 2);           // 지름[cm] → 단면적[m²]
  const v1Of = p => p.Q / 1000 / area(p.D1);                  // m/s
  const v2Of = p => p.Q / 1000 / area(p.D2);
  const dpOf = p => .5 * p.rho * (v2Of(p) * v2Of(p) - v1Of(p) * v1Of(p));   // p1 − p2 [Pa]
  const p2Of = p => PATM - dpOf(p);                           // 목 부분 절대압력
  const reOf = p => p.rho * v1Of(p) * (p.D1 / 100) / 1.002e-3;
  const cavitates = p => p2Of(p) < PVAP;

  PS.register({
    id: 'g-bernoulli', mode: 'general', category: '유체역학',
    title: '연속 방정식과 베르누이',
    sub: 'p + ½ρv² = 일정',
    tagline: '관이 좁아지면 유체는 빨라져야 합니다 — 들어온 만큼 나가야 하니까요. 그런데 빨라지려면 누가 밀어 줘야 하고, 그 일을 하는 것이 압력입니다. 그래서 빠른 곳의 압력이 낮습니다.',

    params: [
      { key: 'Q', symbol: 'Q', label: '유량', unit: 'L/s', min: .5, max: 30, step: .5, value: 8, color: C.Q, dec: 1,
        where: '관을 흐르는 <b>부피 유량</b>입니다. 관 어디서든 같은 값이어야 하므로(연속 방정식), 이 값이 양쪽 속도를 동시에 정합니다.' },
      { key: 'D1', symbol: 'D₁', label: '넓은 부분 지름', unit: 'cm', min: 4, max: 20, step: .5, value: 10, color: C.D1, dec: 1,
        where: '벤투리관의 <b>입구 지름</b>입니다. 여기가 넓을수록 입구 유속이 느려 압력이 높습니다.' },
      { key: 'D2', symbol: 'D₂', label: '목 부분 지름', unit: 'cm', min: 1, max: 18, step: .5, value: 4, color: C.D2, dec: 1,
        where: '가장 좁아지는 <b>목(throat) 지름</b>입니다. 단면적이 제곱으로 줄어드니 유속은 제곱으로 빨라지고, 압력은 속도의 제곱으로 떨어집니다 — 가장 강력한 손잡이입니다.' },
      { key: 'rho', symbol: 'ρ', label: '유체 밀도', unit: 'kg/m³', min: 1, max: 1400, step: 1, value: 998, color: C.rho, dec: 0,
        where: '<b>유체의 밀도</b>입니다(공기 1.2 · 물 998 · 바닷물 1025 · 수은 13546). 압력 변화 ½ρv²에 정비례하므로, 공기에서는 같은 속도 변화가 800배 작은 압력차를 만듭니다.' }
    ],
    vars: {
      v1: { symbol: 'v₁', label: '입구 유속', unit: 'm/s', color: C.v1,
        where: '넓은 부분에서의 <b>유속</b>입니다. 화살표가 짧고 압력계 기둥이 높습니다.' },
      v2: { symbol: 'v₂', label: '목 유속', unit: 'm/s', color: C.v2,
        where: '좁은 목에서의 <b>유속</b>입니다. 유선이 빽빽해지고 화살표가 길어지며, 그만큼 압력계 기둥이 내려갑니다.' },
      dp: { symbol: 'Δp', label: '압력 차', unit: 'kPa', color: C.dp,
        where: '입구와 목의 <b>압력 차이</b>(두 압력계 기둥의 높이 차)입니다. 유량계는 이 값을 재서 거꾸로 유량을 계산합니다.' }
    },
    formulas: [
      { name: '연속 방정식 — 들어온 만큼 나간다', tpl: 'A₁{v1} = A₂{v2} = {Q}' },
      { name: '베르누이 방정식 (에너지 보존)', tpl: 'p + ½{rho}{v1}² = 일정' },
      { name: '압력 차', tpl: '{dp} = ½{rho}({v2}² − {v1}²)' },
      { name: '벤투리 유량계', tpl: '{Q} = A₂√( 2{dp} ⁄ {rho}(1 − (A₂⁄A₁)²) )' }
    ],

    init(p) {
      const dots = [];
      for (let i = 0; i < 90; i++) dots.push({ u: i / 90, lane: (i % 7) / 6 });
      return { dots: dots, done: false };
    },
    step(st, p, dt) {
      const r = p.D1 / p.D2;
      st.dots.forEach(q => {
        // 목이 좁을수록 그 구간을 빨리 지나간다 (연속 방정식의 시각화)
        const prof = 1 + (r * r - 1) * Math.exp(-Math.pow((q.u - .5) / .17, 2));
        q.u += prof * v1Of(p) * .022 * dt;
        if (q.u > 1) q.u -= 1;
      });
    },

    graphs: [{
      title: '관을 따라가는 압력과 속도', xKey: 'x', xUnit: '', xMin: 0, xMax: 1,
      series: [
        { key: 'pr', label: '압력 (kPa)', color: C.dp },
        { key: 'vv', label: '유속 (m/s)', color: C.v2 }
      ]
    }],
    sample(st, p) {
      // 관의 왼쪽 끝에서 오른쪽 끝까지 한 번 훑은 결과를 반복해서 그린다
      const x = (st.t * .25) % 1;
      const r = p.D1 / p.D2;
      const prof = 1 + (r * r - 1) * Math.exp(-Math.pow((x - .5) / .17, 2));
      const v = v1Of(p) * prof;
      return { x: x, vv: v, pr: (PATM - .5 * p.rho * (v * v - v1Of(p) * v1Of(p))) / 1000 };
    },

    readouts(st, p) {
      const v1 = v1Of(p), v2 = v2Of(p), dp = dpOf(p), p2 = p2Of(p);
      const ratio = Math.pow(p.D1 / p.D2, 2);
      return [
        { label: '입구 유속 v₁', value: v1, unit: 'm/s', color: C.v1, dec: 2 },
        { label: '목 유속 v₂', value: v2, unit: 'm/s', color: C.v2, dec: 2 },
        { label: '속도 비 v₂/v₁ = (D₁/D₂)²', value: ratio, unit: '배', color: C.D2, dec: 2 },
        { label: '압력 차 Δp', value: dp / 1000, unit: 'kPa', color: C.dp, dec: 2 },
        { label: '목의 절대 압력', value: p2 / 1000, unit: 'kPa', dec: 1,
          color: p2 < PVAP ? '#fb7185' : (p2 < PATM * .5 ? '#fbbf24' : '#34d399') },
        { label: '압력이 몇 기압 내려갔나', value: dp / PATM, unit: '기압', dec: 3, color: C.dp },
        { label: '동압 ½ρv₂²', value: .5 * p.rho * v2 * v2 / 1000, unit: 'kPa', dec: 2, color: C.v2 },
        { label: '레이놀즈 수 (입구)', value: reOf(p), unit: '', dec: 0, color: '#93a2c4' },
        { label: '캐비테이션', wide: true, color: cavitates(p) ? '#fb7185' : '#34d399',
          value: cavitates(p) ? '발생! 압력이 증기압 아래로 — 물이 끓어 기포가 생긴다' : '없음 (목 압력이 증기압보다 높다)' },
        { label: '같은 조건을 공기로 바꾸면 Δp', value: dp / p.rho * 1.2 / 1000, unit: 'kPa', dec: 4, wide: true, color: C.rho }
      ];
    },

    notes: [
      '<b>연속 방정식이 먼저입니다.</b> 관이 좁아지면 "빨라져야만" 합니다 — 들어온 부피가 그대로 나가야 하니까요. 단면적은 지름의 <b>제곱</b>이라, 지름을 절반으로 줄이면 유속은 4배가 됩니다.',
      '<b>빠른 곳의 압력이 낮은 이유</b>는 에너지 보존입니다. 유체가 빨라지려면 누군가 밀어 줘야 하고, 그 일을 해 준 만큼 압력(압력 에너지)이 줄어듭니다. "속도 때문에 압력이 낮아진다"가 아니라 <b>둘이 같은 에너지를 나눠 가진다</b>고 보는 게 정확합니다.',
      '<b>벤투리 유량계</b>는 이 식을 거꾸로 씁니다 — 압력 차만 재면 유량이 나오므로, 관 안에 아무 움직이는 부품 없이 유량을 측정할 수 있습니다. 분무기·카뷰레터·물제트 펌프도 같은 원리입니다.',
      '<b>캐비테이션</b>: 압력이 물의 증기압(20 °C에서 2.3 kPa) 아래로 내려가면 물이 상온에서 끓어 기포가 생깁니다. 그 기포가 압력이 회복되는 곳에서 터지면서 금속을 깎아 내 — <b>선박 프로펠러와 펌프 임펠러의 최대 적</b>입니다. 목 지름을 줄여 직접 일으켜 보세요.',
      '<b>밀도가 800배 차이납니다.</b> 같은 속도 변화라도 물에서는 압력차가 크고 공기에서는 작습니다. 그래서 비행기는 속도를 아주 크게 만들어야 하고(½ρv²에서 v로 벌충), 배는 느려도 큰 힘을 받습니다.',
      '※ 베르누이 식은 <b>점성이 없고 비압축성인 흐름</b>에 대한 것입니다. 실제 관에서는 마찰로 압력이 추가로 떨어지고, 유속이 음속의 30%를 넘으면 압축성도 고려해야 합니다.'
    ],
    presets: [
      { name: '벤투리 유량계 (물)', set: { Q: 8, D1: 10, D2: 4, rho: 998 } },
      { name: '목을 더 좁히면', set: { Q: 8, D1: 10, D2: 2, rho: 998 } },
      { name: '캐비테이션 발생', set: { Q: 20, D1: 12, D2: 2, rho: 998 } },
      { name: '공기로 바꾸면 (ρ = 1.2)', set: { Q: 8, D1: 10, D2: 4, rho: 1 } },
      { name: '수은 (ρ = 13546)', set: { Q: 4, D1: 10, D2: 5, rho: 1400 } },
      { name: '목이 거의 없을 때', set: { Q: 8, D1: 10, D2: 9.5, rho: 998 } }
    ],
    challenges: [
      {
        id: 'four', title: '목에서 유속 4배 만들기',
        desc: '목의 유속이 입구의 4배가 되게 해 보세요 — 지름은 얼마나 줄여야 할까요?',
        hint: '속도 비 = (D₁/D₂)² 이므로 지름을 절반으로 줄이면 됩니다.',
        check: ({ P }) => { const r = Math.pow(P.D1 / P.D2, 2); return r >= 3.9 && r <= 4.1; }
      },
      {
        id: 'cav', title: '물을 상온에서 끓이기',
        desc: '목의 압력을 물의 증기압(2.3 kPa) 아래로 떨어뜨려 캐비테이션을 일으켜 보세요.',
        hint: '유량을 키우고 목을 아주 좁게. 압력은 속도의 제곱으로 떨어집니다.',
        check: ({ P }) => cavitates(P)
      },
      {
        id: 'air', title: '공기로는 왜 어려운가',
        desc: '유체를 공기(ρ ≤ 10)로 바꾼 뒤, 같은 유속 비에서 압력차가 1 kPa도 안 되는 것을 확인하세요.',
        hint: '밀도 슬라이더를 최소로 내리세요. Δp ∝ ρ 입니다.',
        check: ({ P }) => P.rho <= 10 && Math.pow(P.D1 / P.D2, 2) >= 3 && dpOf(P) < 1000
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const v1 = v1Of(p), v2 = v2Of(p), dp = dpOf(p);

      const x0 = 56, pw = Math.min(w - 112, 420);
      const cy = h * .42;
      const SC = 4.2;                                    // 1 cm → px
      const halfOf = u => {                               // 관 반지름(px)
        const g = Math.exp(-Math.pow((u - .5) / .17, 2));
        return (p.D1 / 2 + (p.D2 / 2 - p.D1 / 2) * g) * SC;
      };
      const vOf = u => {
        const r = p.D1 / p.D2;
        return v1 * (1 + (r * r - 1) * Math.exp(-Math.pow((u - .5) / .17, 2)));
      };

      /* ── 관 벽 ── */
      const N = 80, top = [], bot = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, xx = x0 + pw * u, hh = halfOf(u);
        top.push([xx, cy - hh]); bot.push([xx, cy + hh]);
      }
      ctx.save();
      ctx.fillStyle = 'rgba(96,165,250,.08)';
      ctx.beginPath();
      top.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
      for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(200,211,239,.7)'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      [top, bot].forEach(arr => { ctx.beginPath(); arr.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); });
      ctx.restore();

      /* ── 유선 + 흐르는 입자 ── */
      ctx.save();
      for (let k = 0; k < 7; k++) {
        const lane = -1 + 2 * (k + .5) / 7;
        ctx.strokeStyle = 'rgba(96,165,250,.22)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) { const u = i / N; const yy = cy + lane * halfOf(u) * .86; i ? ctx.lineTo(x0 + pw * u, yy) : ctx.moveTo(x0 + pw * u, yy); }
        ctx.stroke();
      }
      ctx.restore();
      st.dots.forEach(q => {
        const lane = -1 + 2 * q.lane;
        const yy = cy + lane * halfOf(q.u) * .86;
        D.dot(ctx, x0 + pw * q.u, yy, 2.4, 'rgba(147,197,253,.85)', false);
      });

      /* ── 속도 화살표 ── */
      [[.10, 'v1'], [.5, 'v2']].forEach(([u, key]) => {
        const v = vOf(u), al = clamp(10 + v * 5, 10, 60);
        D.arrow(ctx, x0 + pw * u - al / 2, cy, al, 0,
          { color: key === 'v1' ? C.v1 : C.v2, width: 3, head: 8, hot: hl === key });
        D.tag(ctx, fmt(v, 2) + ' m/s', x0 + pw * u, cy - halfOf(u) - 16,
          key === 'v1' ? C.v1 : C.v2, hl === key);
      });
      D.dim(ctx, x0 + pw * .1, cy - halfOf(.1), x0 + pw * .1, cy + halfOf(.1), 'D₁', C.D1, hl === 'D1');
      D.dim(ctx, x0 + pw * .5, cy - halfOf(.5), x0 + pw * .5, cy + halfOf(.5), 'D₂', C.D2, hl === 'D2');

      /* ── 압력계 기둥 ── */
      const gTop = cy - Math.max(halfOf(0), 24) - 118;
      const gH = 100;
      const pMax = PATM * 1.05, pMin = Math.min(0, p2Of(p) - 8000);
      const GY = pp => gTop + gH - clamp((pp - pMin) / (pMax - pMin), 0, 1) * gH;
      D.text(ctx, '압력계 (관 안의 압력)', x0, gTop - 9, { size: 10.5, color: '#61719a' });
      D.line(ctx, x0 - 6, GY(PATM), x0 + pw + 6, GY(PATM), { color: 'rgba(147,162,196,.35)', dash: [4, 5] });
      D.text(ctx, '1 기압', x0 + pw + 10, GY(PATM) + 4, { size: 9, color: '#93a2c4' });
      D.line(ctx, x0 - 6, GY(PVAP), x0 + pw + 6, GY(PVAP), { color: 'rgba(251,113,133,.45)', dash: [3, 3] });
      // 두 기준선이 붙으면 라벨을 아래로 밀고, 그래도 겹치면 선만 남긴다
      const gapPV = GY(PVAP) - GY(PATM);
      if (gapPV > 20) D.text(ctx, '증기압', x0 + pw + 10, GY(PVAP) + 4, { size: 9, color: '#fb7185' });
      else if (gapPV > -20) D.text(ctx, '증기압', x0 + pw + 10, GY(PATM) + 18, { size: 9, color: '#fb7185' });
      // 압력 곡선
      ctx.save();
      ctx.strokeStyle = C.dp; ctx.lineWidth = 2.2;
      if (hl === 'dp') { ctx.shadowColor = C.dp; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const u = i / N, v = vOf(u);
        const pp = PATM - .5 * p.rho * (v * v - v1 * v1);
        i ? ctx.lineTo(x0 + pw * u, GY(pp)) : ctx.moveTo(x0 + pw * u, GY(pp));
      }
      ctx.stroke(); ctx.restore();
      // 측정관 두 개
      [[.10, C.v1], [.5, C.v2]].forEach(([u, cc]) => {
        const v = vOf(u), pp = PATM - .5 * p.rho * (v * v - v1 * v1);
        D.line(ctx, x0 + pw * u, cy - halfOf(u), x0 + pw * u, GY(pp), { color: 'rgba(200,211,239,.35)', width: 5 });
        ctx.save(); ctx.strokeStyle = cc; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0 + pw * u, GY(pp)); ctx.lineTo(x0 + pw * u, cy - halfOf(u)); ctx.stroke(); ctx.restore();
        D.dot(ctx, x0 + pw * u, GY(pp), 4, cc, true);
      });
      D.dim(ctx, x0 + pw * .30, GY(PATM), x0 + pw * .30, GY(p2Of(p)),
        'Δp = ' + fmt(dp / 1000, 2) + ' kPa', C.dp, hl === 'dp');

      /* ── 캐비테이션 ── */
      if (cavitates(p)) {
        for (let i = 0; i < 16; i++) {
          const u = .46 + (i % 8) / 8 * .14;
          const yy = cy + (((i * 37) % 11) / 10 - .5) * halfOf(u) * 1.5;
          D.dot(ctx, x0 + pw * u + Math.sin(st.t * 6 + i) * 4, yy, 1.6 + (i % 3), 'rgba(255,255,255,.65)', false);
        }
        D.tag(ctx, '캐비테이션! 물이 끓어 기포가 생긴다', x0 + pw * .5, cy + halfOf(.5) + 26, '#fb7185', true);
      }

      /* ── 요약 ── */
      D.text(ctx, 'A₁v₁ = A₂v₂  →  v₂/v₁ = (D₁/D₂)² = ' + fmt(Math.pow(p.D1 / p.D2, 2), 2) + ' 배',
        x0, h - 36, { size: 12, color: hl === 'Q' ? '#fff' : C.Q, bold: true });
      D.text(ctx, 'ρ = ' + fmt(p.rho, 0) + ' kg/m³   ·   목 압력 ' + fmt(p2Of(p) / 1000, 1) + ' kPa   ·   Re = ' + fmt(reOf(p), 0),
        x0, h - 16, { size: 11, color: '#93a2c4' });
    }
  });
})();
