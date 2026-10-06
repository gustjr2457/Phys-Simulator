/* [양자역학] 터널링 — 벽을 스며 통과한다 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { E: '#fbbf24', V: '#fb7185', d: '#5eead4', T: '#34d399', R: '#f472b6', kap: '#a78bfa' };
  const HBAR = 1.054571817e-34, ME = 9.1093837e-31, QE = 1.602176634e-19;

  const kOf = eV => Math.sqrt(2 * ME * eV * QE) / HBAR;              // 1/m
  const kapOf = (E, V) => Math.sqrt(2 * ME * Math.max(V - E, 0) * QE) / HBAR;

  // 사각 장벽 투과 확률
  function Tof(p) {
    const E = p.E, V = p.V, d = p.d * 1e-9;
    if (Math.abs(E - V) < 1e-6) {                                     // E = V 극한
      const k = kOf(E);
      return 1 / (1 + k * k * d * d / 4);
    }
    if (E < V) {
      const kap = kapOf(E, V), s = Math.sinh(kap * d);
      return 1 / (1 + V * V * s * s / (4 * E * (V - E)));
    }
    const k2 = Math.sqrt(2 * ME * (E - V) * QE) / HBAR, s = Math.sin(k2 * d);
    return 1 / (1 + V * V * s * s / (4 * E * (E - V)));
  }

  PS.register({
    id: 'q-tunnel', mode: 'quantum', category: '파동이기에 생기는 일',
    title: '터널링 — 벽을 통과하는 확률',
    sub: 'T ≈ e^(−2κd)',
    tagline: '고전역학에서는 에너지가 모자라면 벽을 절대 못 넘습니다. 그런데 파동은 벽 안에서 곧바로 0이 되지 않고 조금씩 줄어들 뿐이어서, 벽이 얇으면 반대편에 일부가 남습니다. 태양이 타는 것도, USB 메모리가 작동하는 것도 이 덕분입니다.',

    params: [
      { key: 'E', symbol: 'E', label: '입자의 에너지', unit: 'eV', min: .2, max: 10, step: .1, value: 1, color: C.E, dec: 1,
        where: '전자가 가진 <b>에너지</b>입니다. 그림의 노란 수평선이며, 장벽 높이보다 낮으면 고전적으로는 절대 통과할 수 없습니다. 장벽에 가까울수록 투과 확률이 급격히 올라갑니다.' },
      { key: 'V', symbol: 'V₀', label: '장벽 높이', unit: 'eV', min: .5, max: 10, step: .1, value: 5, color: C.V, dec: 1,
        where: '가로막은 <b>벽의 높이</b>(붉은 블록)입니다. E보다 높을수록 벽 안에서 파동이 빠르게 줄어들어 통과하기 어려워집니다.' },
      { key: 'd', symbol: 'd', label: '장벽 두께', unit: 'nm', min: .05, max: 1.5, step: .05, value: .3, color: C.d, dec: 2,
        where: '벽의 <b>두께</b>입니다. 투과 확률이 두께에 <b>지수적으로</b> 줄어듭니다 — 두께를 2배로 하면 확률은 제곱으로 작아집니다. 터널링이 원자 크기에서만 의미 있는 이유입니다.' }
    ],
    vars: {
      T: { symbol: 'T', label: '투과 확률', unit: '', color: C.T,
        where: '벽 반대편으로 <b>빠져나갈 확률</b>입니다. 아래 막대와 오른쪽 파동의 크기로 표현됩니다.' },
      R: { symbol: 'R', label: '반사 확률', unit: '', color: C.R,
        where: '벽에 부딪혀 <b>되돌아올 확률</b>입니다. T + R = 1 이며, 왼쪽에 생기는 울퉁불퉁한 정상파가 반사의 증거입니다.' },
      kap: { symbol: 'κ', label: '감쇠 상수', unit: '1/nm', color: C.kap,
        where: '벽 안에서 파동이 <b>얼마나 빨리 줄어드는가</b>입니다. 1/κ 만큼 들어갈 때마다 약 2.7분의 1로 작아집니다.' },
      lam: { symbol: 'λ', label: '드브로이 파장', unit: 'nm', color: C.E,
        where: '입자의 물질파 파장입니다. 에너지가 클수록 짧아집니다.' }
    },
    formulas: [
      { name: '벽 안에서 파동은 지수적으로 줄어든다', tpl: 'ψ(x) ∝ e^(−{kap}x)' },
      { name: '감쇠 상수', tpl: '{kap} = √( 2m({V} − {E}) ) ⁄ ħ' },
      { name: '투과 확률 (두꺼운 벽 근사)', tpl: '{T} ≈ 16{E}({V}−{E})⁄{V}² · e^(−2{kap}{d})' },
      { name: '확률 보존', tpl: '{T} + {R} = 1' }
    ],

    init() { return { ph: 0 }; },
    step(st, p, dt) { st.ph += dt * 2.2; },

    graphs: [
      { title: '장벽 두께 – 투과 확률 (지수적 감소)', xKey: 'd', xUnit: 'nm', xMin: .05, xMax: 1.5, y0: 0,
        series: [{ key: 'T', label: 'T', color: C.T }] },
      { title: '입자 에너지 – 투과 확률', xKey: 'E', xUnit: 'eV', xMin: .2, xMax: 10, y0: 0,
        series: [{ key: 'T2', label: 'T', color: C.E }] }
    ],
    sample(st, p) { const T = Tof(p); return { d: p.d, E: p.E, T: T, T2: T }; },

    readouts(st, p) {
      const T = Tof(p), under = p.E < p.V;
      const kap = kapOf(p.E, p.V);
      const lam = 2 * Math.PI / kOf(p.E) * 1e9;
      return [
        { label: '투과 확률 T', value: T > 1e-4 ? fmt(T * 100, 3) + ' %' : (T * 100).toExponential(2) + ' %', color: C.T, wide: true },
        { label: '반사 확률 R', value: (1 - T) * 100, unit: '%', color: C.R, dec: 3 },
        { label: '감쇠 상수 κ', value: under ? kap / 1e9 : 0, unit: '1/nm', color: C.kap, dec: 2 },
        { label: '벽 안 침투 깊이 1/κ', value: under ? 1e9 / kap : Infinity, unit: 'nm', dec: 3 },
        { label: '드브로이 파장 λ', value: lam, unit: 'nm', color: C.E, dec: 3 },
        { label: '에너지 부족분 V₀ − E', value: Math.max(p.V - p.E, 0), unit: 'eV', color: C.V },
        {
          label: '고전역학이라면', wide: true, color: under ? '#fb7185' : '#34d399',
          value: under ? '✘ 절대 통과 불가 (에너지 부족) — 그런데 실제로는 ' + (T > 1e-4 ? fmt(T * 100, 2) + '%' : (T * 100).toExponential(1) + '%') + ' 통과'
            : '✔ 항상 통과 — 그런데 양자역학에서는 일부가 되튕깁니다'
        }
      ];
    },

    notes: [
      '벽 안에서 파동은 <b>갑자기 0이 되지 못하고</b> 지수적으로 줄어듭니다. 벽이 얇으면 다 줄어들기 전에 반대편에 닿아 일부가 살아남습니다.',
      '두께에 <b>지수적으로</b> 민감합니다. 두께를 2배로 하면 확률은 대략 제곱으로 작아집니다 — 1%가 0.01%가 되는 식입니다.',
      '<b>주사터널현미경(STM)</b>은 이 민감함을 거꾸로 이용합니다. 탐침과 표면 간격이 원자 하나만큼 변해도 전류가 크게 변해서, 원자 하나하나를 그려낼 수 있습니다.',
      '<b>태양이 타는 이유</b>이기도 합니다. 양성자끼리 밀어내는 전기 장벽을 넘을 만큼 뜨겁지 않은데도, 터널링으로 가끔 융합이 일어납니다.',
      'E가 V₀보다 <b>커도</b> 일부가 되튕깁니다(고전적으로는 100% 통과). 두께를 바꾸면 반사가 0이 되는 지점이 주기적으로 나타납니다 — 공명 투과입니다.'
    ],
    presets: [
      { name: '얇은 벽 — 잘 통과', set: { E: 1, V: 5, d: .1 } },
      { name: '두께 2배 — 확률 급락', set: { E: 1, V: 5, d: .2 } },
      { name: '두꺼운 벽 — 거의 불가능', set: { E: 1, V: 5, d: 1 } },
      { name: '에너지를 장벽 가까이', set: { E: 4.5, V: 5, d: .3 } },
      { name: '장벽보다 높은 에너지 (공명)', set: { E: 7, V: 5, d: .6 } }
    ],
    challenges: [
      {
        id: 'pass1', title: '1% 이상 통과시키기',
        desc: '에너지가 장벽보다 낮은 상태(E < V₀)를 유지하면서 투과 확률을 1% 이상으로 만들어 보세요.',
        hint: '벽을 얇게 하거나, 에너지를 장벽 높이에 가깝게 올리면 됩니다.',
        check: ({ P }) => P.E < P.V && Tof(P) >= .01
      },
      {
        id: 'thick', title: '두꺼우면 사실상 0',
        desc: '장벽을 1 nm 이상으로 두껍게 해서 투과 확률이 0.0001 % 밑으로 떨어지는 것을 확인하세요.',
        hint: '지수적 감소라 두께가 조금만 늘어도 확률이 폭락합니다.',
        check: ({ P }) => P.d >= 1 && P.E < P.V && Tof(P) < 1e-6
      },
      {
        id: 'resonance', title: '넘을 수 있는데도 되튕긴다',
        desc: '에너지를 장벽보다 높게(E > V₀) 올려서, 투과 확률이 100 %가 안 되는 경우를 찾아보세요.',
        hint: '고전역학이라면 무조건 통과입니다. 두께를 조금씩 바꿔 보세요.',
        check: ({ P }) => P.E > P.V && Tof(P) < .98
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const T = Tof(p), R = 1 - T, under = p.E < p.V;
      const kap = kapOf(p.E, p.V), k1 = kOf(p.E);

      /* ── 좌표계: 에너지(세로) × 위치(가로) ── */
      const x0 = 50, x1 = w - 40, baseY = h * .74, topY = h * .14;
      const Emax = Math.max(p.V, p.E) * 1.25;
      const EY = e => baseY - (e / Emax) * (baseY - topY);
      // 장벽 위치 — 두께를 화면에서 보이도록 1 nm = 170 px
      const PPNM = 170;
      const bx0 = (x0 + x1) / 2 - p.d * PPNM / 2, bx1 = bx0 + p.d * PPNM;

      // 바닥
      D.line(ctx, x0, baseY, x1, baseY, { color: 'rgba(147,162,196,.4)', width: 1.5 });
      D.text(ctx, '위치 →', x1, baseY + 18, { size: 9.5, color: '#4a5878', align: 'right' });
      D.text(ctx, '에너지 ↑', x0 - 6, topY - 6, { size: 9.5, color: '#4a5878' });

      // 장벽
      ctx.save();
      if (hl === 'V' || hl === 'd') { ctx.shadowColor = C.V; ctx.shadowBlur = 18; }
      const vg = ctx.createLinearGradient(0, EY(p.V), 0, baseY);
      vg.addColorStop(0, 'rgba(251,113,133,.55)'); vg.addColorStop(1, 'rgba(251,113,133,.18)');
      ctx.fillStyle = vg;
      ctx.fillRect(bx0, EY(p.V), bx1 - bx0, baseY - EY(p.V));
      ctx.restore();
      D.line(ctx, bx0, EY(p.V), bx1, EY(p.V), { color: C.V, width: 2.5, hot: hl === 'V' });
      D.text(ctx, 'V₀ = ' + fmt(p.V, 1) + ' eV', (bx0 + bx1) / 2, EY(p.V) - 9,
        { size: 11, color: C.V, align: 'center', bold: hl === 'V' });
      D.dim(ctx, bx0, baseY + 26, bx1, baseY + 26, 'd = ' + fmt(p.d, 2) + ' nm', C.d, hl === 'd');

      // 입자 에너지선
      D.line(ctx, x0, EY(p.E), x1, EY(p.E), { color: C.E, dash: [6, 5], width: hl === 'E' ? 2.6 : 1.8, hot: hl === 'E' });
      D.text(ctx, 'E = ' + fmt(p.E, 1) + ' eV', x0 + 4, EY(p.E) - 8, { size: 11, color: C.E, bold: hl === 'E' });

      /* ── 파동 ── */
      const wy = EY(p.E);                       // 파동은 에너지선 위에 그린다
      const A = Math.min(34, (baseY - topY) * .16);
      const nmPerPx = 1 / PPNM;
      const ph = st.ph;
      const rAmp = Math.sqrt(R), tAmp = Math.sqrt(T);

      ctx.save();
      ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      // ① 입사 + 반사 (왼쪽)
      ctx.strokeStyle = C.E;
      ctx.beginPath();
      for (let x = x0; x <= bx0; x += 1.5) {
        const xm = (x - bx0) * nmPerPx * 1e-9;
        const inc = Math.cos(k1 * xm - ph);
        const ref = rAmp * Math.cos(k1 * xm + ph);
        const y = wy - (inc + ref) / (1 + rAmp) * A;
        x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // ② 벽 안 — 지수적으로 감쇠
      ctx.strokeStyle = C.kap;
      if (hl === 'kap') { ctx.shadowColor = C.kap; ctx.shadowBlur = 12; }
      ctx.beginPath();
      let yJoin = wy;
      for (let x = bx0; x <= bx1; x += 1) {
        const xm = (x - bx0) * nmPerPx * 1e-9;
        const env = under ? Math.exp(-kap * xm) : 1;
        const y = wy - env * Math.cos(ph) * A * (under ? 1 : .8);
        x === bx0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        yJoin = y;
      }
      ctx.stroke();
      // 감쇠 포락선
      if (under) {
        ctx.setLineDash([3, 3]); ctx.globalAlpha = .55; ctx.lineWidth = 1.2;
        [1, -1].forEach(sgn => {
          ctx.beginPath();
          for (let x = bx0; x <= bx1; x += 2) {
            const xm = (x - bx0) * nmPerPx * 1e-9;
            const y = wy - sgn * Math.exp(-kap * xm) * A;
            x === bx0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
        ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.lineWidth = 2.2;
      }
      // ③ 투과 (오른쪽)
      ctx.strokeStyle = C.T;
      if (hl === 'T') { ctx.shadowColor = C.T; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let x = bx1; x <= x1; x += 1.5) {
        const xm = (x - bx1) * nmPerPx * 1e-9;
        const y = wy - tAmp * Math.cos(k1 * xm - ph) * A;
        x === bx1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      D.text(ctx, '입사 + 반사 (울퉁불퉁 = 되튕김)', x0 + 4, wy - A - 14, { size: 10, color: C.E });
      if (under) D.text(ctx, '벽 안: 지수적으로 감소', (bx0 + bx1) / 2, wy + A + 20,
        { size: 9.5, color: C.kap, align: 'center' });
      D.text(ctx, '통과한 파동', bx1 + 8, wy - A - 14, { size: 10, color: C.T });
      if (under) {
        // 침투 깊이는 장벽 안쪽(에너지선과 장벽 꼭대기 사이)에 표시해 두께 치수선과 겹치지 않게
        const dep = Math.min((1e9 / kap) * PPNM, bx1 - bx0);
        const yk = (EY(p.V) + wy) / 2;
        D.dim(ctx, bx0, yk, bx0 + dep, yk, '1/κ = ' + fmt(1e9 / kap, 2) + ' nm', C.kap, hl === 'kap');
      }

      /* ── 확률 막대 ── */
      const mx = 48, mw = Math.min(300, w * .36), my = h - 44;
      D.text(ctx, '반사 R 와 투과 T', mx, my - 10, { size: 11, color: '#93a2c4' });
      D.roundRect(ctx, mx, my, mw, 15, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      ctx.save();
      ctx.fillStyle = C.R; D.roundRect(ctx, mx, my, mw * R, 15, 5); ctx.fill();
      ctx.fillStyle = C.T;
      if (T * mw > 1.5) { D.roundRect(ctx, mx + mw * R, my, Math.max(mw * T, 2), 15, 5); ctx.fill(); }
      ctx.restore();
      D.text(ctx, '반사 ' + fmt(R * 100, 2) + ' %', mx, my + 30, { size: 10.5, color: C.R });
      D.text(ctx, '투과 ' + (T > 1e-4 ? fmt(T * 100, 3) + ' %' : (T * 100).toExponential(2) + ' %'),
        mx + mw + 10, my + 12, { size: 12, color: C.T, bold: true });

      if (!under) D.tag(ctx, '에너지가 장벽보다 높은데도 일부가 되튕깁니다 (공명 투과)', w / 2, 26, '#fbbf24', true);
    }
  });
})();
