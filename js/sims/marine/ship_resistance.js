/* [선박공학·저항과 추진] 선체 저항과 프루드 수 — Fn = V/√(gL)
   배가 받는 저항은 두 가지다. 물과의 마찰(마찰저항)은 속력의 제곱으로 얌전히
   늘어나지만, 배가 스스로 만든 파도에 쓰이는 에너지(조파저항)는 어느 속력부터
   폭발적으로 커진다. 그 "어느 속력"을 결정하는 것이 프루드 수이고, 배가 만드는
   파도의 길이가 배 길이와 맞아떨어질 때 저항이 봉우리(험프)를 만든다 —
   그래서 긴 배가 빠르고, 선박의 설계 속력은 Fn 0.25 근처에 모여 있다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { L: '#5eead4', Vs: '#fb7185', Cb: '#fbbf24',
              Fn: '#f472b6', RF: '#60a5fa', RW: '#fb923c', RT: '#e8eefc', P: '#a78bfa' };
  const G = 9.81, RHO = 1025, NU = 1.19e-6, FORM = 1.18;
  const KN = .5144;                    // 1 노트 = 0.5144 m/s
  const RAMP = 14;                     // 설정 속력까지 가속하는 시간(초)

  const dims = p => {
    const B = p.L / 7, T = p.L / 18;
    const disp = p.Cb * p.L * B * T;                      // 배수용적 m³
    return { B: B, T: T, disp: disp, S: 1.7 * p.L * T + disp / T };
  };
  const FnOf = (V, p) => V / Math.sqrt(G * p.L);
  const ReOf = (V, p) => V * p.L / NU;
  const CFof = (V, p) => { const R = Math.max(ReOf(V, p), 1e4); const l = Math.log10(R) - 2; return .075 / (l * l); };
  // 조파저항계수 — 교육용 근사: Fn⁴ 기본항 + 험프 두 개(선수·선미 파계의 간섭)
  const CWof = (V, p) => {
    const F = FnOf(V, p);
    const bulk = .0768 * Math.pow(F, 4);
    const h1 = 1.2e-3 * Math.exp(-Math.pow((F - .33) / .04, 2));
    const h2 = 2.5e-3 * Math.exp(-Math.pow((F - .49) / .07, 2));
    return (bulk + h1 + h2) * (.72 + .5 * p.Cb);          // 뚱뚱한 배가 파도를 더 만든다
  };
  const RF = (V, p) => .5 * RHO * FORM * CFof(V, p) * dims(p).S * V * V;
  const RW = (V, p) => .5 * RHO * CWof(V, p) * dims(p).S * V * V;
  const RT = (V, p) => RF(V, p) + RW(V, p);
  const Vnow = (st, p) => p.Vs * KN * Math.min(1, st.t / RAMP);
  const waveLen = V => 2 * Math.PI * V * V / G;

  PS.register({
    id: 'ship-resistance', mode: 'marine', category: '저항과 추진',
    title: '선체 저항과 프루드 수',
    sub: 'Fn = V/√(gL)',
    tagline: '배는 스스로 만든 파도에 발목을 잡힙니다. 그 파도의 길이가 배 길이와 맞아떨어지는 속력에서 저항이 봉우리를 만듭니다 — 긴 배가 빠른 이유입니다.',

    params: [
      { key: 'L', symbol: 'L', label: '선박 길이', unit: 'm', min: 50, max: 350, step: 10, value: 150, color: C.L, dec: 0, reset: true,
        where: '<b>수선간 길이</b>입니다. 프루드 수 Fn = V/√(gL)의 분모이므로, 길면 같은 속력에서 Fn이 작아져 조파저항의 험프를 피할 수 있습니다 — 컨테이너선이 400 m까지 길어진 이유입니다.' },
      { key: 'Vs', symbol: 'V', label: '설정 속력', unit: 'kn', min: 5, max: 35, step: 1, value: 20, color: C.Vs, dec: 0, reset: true,
        where: '목표 속력입니다. 정지 상태에서 <b>14초에 걸쳐 가속</b>하며, 그 과정에서 두 저항이 어떻게 갈라지는지 오른쪽 그래프에 그려집니다.' },
      { key: 'Cb', symbol: 'C_b', label: '방형계수', unit: '', min: .55, max: .85, step: .01, value: .7, color: C.Cb, dec: 2, reset: true,
        where: '선체가 <b>얼마나 뚱뚱한가</b>입니다(직육면체에 대한 부피 비). 크면 같은 길이에 짐을 더 싣지만 물을 더 밀어내 파도를 많이 만듭니다 — 유조선 0.85, 컨테이너선 0.65, 구축함 0.50.' }
    ],
    vars: {
      Fn: { symbol: 'Fn', label: '프루드 수', unit: '', color: C.Fn,
        where: '속력을 배 길이로 <b>무차원화한 값</b>입니다. 모형시험에서 실선의 거동을 예측할 수 있게 해 주는 바로 그 수이고, 조파저항은 Fn만의 함수입니다.' },
      RF: { symbol: 'R_F', label: '마찰저항', unit: 'kN', color: C.RF,
        where: '젖은 표면이 물과 <b>비벼지며 생기는 저항</b>(파란 막대)입니다. 속력의 제곱으로 얌전히 늘어나고, 저속선에서는 전체의 70~80%를 차지합니다.' },
      RW: { symbol: 'R_W', label: '조파저항', unit: 'kN', color: C.RW,
        where: '배가 <b>파도를 만드는 데 버리는 에너지</b>(주황 막대)입니다. Fn이 커지면 폭발적으로 늘어나 고속에서는 전체를 지배합니다.' },
      RT: { symbol: 'R_T', label: '전체 저항', unit: 'kN', color: C.RT,
        where: '두 저항의 합이자 프로펠러가 밀어내야 하는 힘입니다. 아래 저항 곡선에서 험프(봉우리)와 할로(골)가 보입니다.' }
    },
    formulas: [
      { name: '프루드 수 (파도를 지배)', tpl: '{Fn} = {Vs} ⁄ √(g{L})' },
      { name: '마찰저항 (ITTC-57)', tpl: '{RF} = ½ρ·C_F·S·{Vs}²' },
      { name: '조파저항', tpl: '{RW} = ½ρ·C_W({Fn})·S·{Vs}²' },
      { name: '전체 저항과 유효마력', tpl: '{RT} = {RF} + {RW},   EHP = {RT}·{Vs}' },
      { name: '배가 만드는 파도의 길이', tpl: 'λ = 2π{Vs}² ⁄ g' }
    ],

    init(p) { return { done: false }; },
    step(st, p, dt) { if (st.t > RAMP + 6) st.done = true; },

    graphs: [{
      title: '저항 – 속력 (가속하며 기록)', xKey: 'Vk', xUnit: 'kn', xMin: 0, y0: 0,
      series: [
        { key: 'RT', label: 'R_T 전체', color: C.RT },
        { key: 'RF', label: 'R_F 마찰', color: C.RF },
        { key: 'RW', label: 'R_W 조파', color: C.RW }
      ]
    }, {
      title: '필요 동력 (유효마력)', xKey: 'Vk', xUnit: 'kn', xMin: 0, y0: 0,
      series: [{ key: 'P', label: 'EHP (MW)', color: C.P }]
    }],
    sample(st, p) {
      const V = Vnow(st, p);
      return { Vk: V / KN, RF: RF(V, p) / 1000, RW: RW(V, p) / 1000, RT: RT(V, p) / 1000, P: RT(V, p) * V / 1e6 };
    },

    readouts(st, p) {
      const V = Vnow(st, p), d = dims(p);
      const Fn = FnOf(V, p), rf = RF(V, p), rw = RW(V, p), rt = rf + rw;
      const lam = waveLen(V);
      const wf = rt > 1 ? rw / rt : 0;
      return [
        { label: '현재 속력', value: V / KN, unit: 'kn', color: C.Vs, dec: 1 },
        { label: '프루드 수 Fn', value: Fn, unit: '', color: C.Fn, dec: 3 },
        { label: '레이놀즈 수 Re', value: ReOf(V, p), unit: '', dec: 0, color: '#93a2c4' },
        { label: '마찰저항 R_F', value: rf / 1000, unit: 'kN', color: C.RF, dec: 1 },
        { label: '조파저항 R_W', value: rw / 1000, unit: 'kN', color: C.RW, dec: 1 },
        { label: '전체 저항 R_T', value: rt / 1000, unit: 'kN', color: C.RT, dec: 1 },
        { label: '조파저항 비율', value: wf * 100, unit: '%', dec: 1, color: C.RW },
        { label: '유효마력 EHP', value: rt * V / 1e6, unit: 'MW', color: C.P, dec: 2 },
        { label: '배가 만드는 파도 λ', value: lam, unit: 'm', dec: 1, color: '#fbbf24' },
        { label: 'λ / L', value: lam / p.L, unit: '', dec: 2, color: '#fbbf24' },
        { label: '배수량 (대략)', value: d.disp * 1.025, unit: 't', dec: 0, color: C.Cb },
        { label: '젖은 표면적 S', value: d.S, unit: 'm²', dec: 0, color: '#93a2c4' },
        { label: '지금 어느 영역인가', wide: true,
          color: Fn < .22 ? '#34d399' : (Fn < .32 ? '#fbbf24' : '#fb7185'),
          value: Fn < .22 ? '경제 속력 — 마찰이 지배, 조파는 작다' :
                 (Fn < .32 ? '설계 속력대 — 조파가 자라기 시작' :
                  (Fn < .42 ? '제1 험프 근처 — 저항이 급증' : '고속 영역 — 조파가 지배, 동력이 폭증')) }
      ];
    },

    notes: [
      '<b>속력을 2배로 올리려면 동력은 8배 이상 듭니다.</b> 저항이 속력의 제곱에 비례하고, 동력은 거기에 속력을 한 번 더 곱하기 때문입니다 — 조파저항이 커지는 영역에서는 그보다 더 가파릅니다. 그래서 유조선은 15 kn로 다니고, 연료비가 오르면 "저속 운항(slow steaming)"을 합니다.',
      '<b>긴 배가 빠릅니다.</b> 같은 속력이라도 길이가 길면 Fn이 작아져 조파저항의 험프를 피할 수 있습니다. 배를 길게 하면 마찰 면적은 늘지만, 그 손해보다 조파저항에서 버는 이득이 큽니다.',
      '배가 만드는 파도의 길이는 <b>λ = 2πV²/g</b>입니다. 이 λ가 선체 길이 L과 비슷해지면(λ/L ≈ 1, Fn ≈ 0.4) 선수가 만든 파도의 골에 선미가 빠져 배가 자기 파도를 기어올라야 합니다 — 이것이 "선체 속력(hull speed)"의 벽입니다.',
      '프루드 수가 중요한 이유는 <b>모형시험</b>입니다. 축소 모형과 실선은 Re를 동시에 맞출 수 없으므로, Fn을 맞춰 조파저항만 실험으로 재고 마찰저항은 ITTC 공식으로 계산해 더합니다(프루드의 가설, 1868).',
      '초고속이 필요하면 아예 <b>물에서 벗어납니다</b> — 수중익선(하이드로포일), 공기부양선, 활주형 선체는 선체를 띄워 조파저항 자체를 회피합니다. 이 시뮬레이션의 배수량형 선체로는 Fn 0.5 이상이 사실상 불가능합니다.',
      '※ 여기 쓰인 조파저항 모델은 험프의 위치와 크기를 보여 주기 위한 <b>교육용 근사식</b>입니다. 실제 설계는 수조시험이나 CFD로 구합니다.'
    ],
    presets: [
      { name: '컨테이너선 (150 m, 20 kn)', set: { L: 150, Vs: 20, Cb: .7 } },
      { name: '초대형 유조선 (330 m, 15 kn)', set: { L: 330, Vs: 15, Cb: .85 } },
      { name: '경제 속력 (Fn ≈ 0.2)', set: { L: 200, Vs: 17, Cb: .75 } },
      { name: '제1 험프에 올라타기', set: { L: 100, Vs: 20, Cb: .7 } },
      { name: '날렵한 고속선', set: { L: 120, Vs: 30, Cb: .55 } }
    ],
    challenges: [
      {
        id: 'cross', title: '조파저항이 마찰저항을 넘는 순간',
        desc: '조파저항 R_W가 마찰저항 R_F보다 커지는 상태를 만들어 보세요 — 여기서부터 "속력이 비싸집니다".',
        hint: '짧은 배를 빠르게 달리게 하면 Fn이 커집니다. 방형계수를 올려 뚱뚱하게 만드는 것도 효과가 있습니다.',
        check: ({ P, st }) => { const V = Vnow(st, P); return V > 1 && RW(V, P) > RF(V, P); }
      },
      {
        id: 'eco', title: '경제 속력으로 설계하기',
        desc: '속력 16 kn 이상을 내면서 프루드 수를 0.22 이하, 조파저항 비율을 15% 이하로 유지해 보세요.',
        hint: 'Fn = V/√(gL)이므로 배를 길게 만들면 됩니다. 실제 대형 상선이 바로 이 영역에서 운항합니다.',
        check: ({ P, st }) => {
          const V = Vnow(st, P);
          if (V / KN < 16) return false;
          const rw = RW(V, P), rt = RT(V, P);
          return FnOf(V, P) <= .22 && rw / rt <= .15;
        }
      },
      {
        id: 'hump', title: '제1 험프에 정확히 올라타기',
        desc: '프루드 수를 0.32~0.34에 맞춰 보세요 — 선수와 선미의 파계가 겹쳐 저항이 봉우리를 만드는 지점입니다.',
        hint: '설정 속력과 배 길이를 함께 조절하세요. 가속이 끝나기를 기다렸다가 측정값 칸의 Fn을 확인하면 됩니다.',
        check: ({ P, st }) => { const F = FnOf(Vnow(st, P), P); return F >= .32 && F <= .34; }
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = Vnow(st, p), d = dims(p);
      const Fn = FnOf(V, p), rf = RF(V, p), rw = RW(V, p), rt = rf + rw;
      const lam = waveLen(V);

      /* ── 해면 + 선체 ── */
      const sea = h * .36;
      const PPM = Math.min((w - 150) / 360, 1.25);           // 1 m → px (길이 350 m까지 들어가도록)
      const Lpx = p.L * PPM;
      const bowX = Math.max(70, w * .5 - Lpx * .5) + Lpx;    // 선수(오른쪽)
      const sternX = bowX - Lpx;
      const draftPx = clamp(d.T * PPM * 1.6, 7, 34);
      const deckPx = clamp(d.T * PPM * 1.1, 6, 26);

      // 배가 만드는 파도 — 선수를 기준으로 뒤로 퍼지고, 배에 대해 "정지"해 있다
      const amp = clamp(Math.pow(Fn, 2) * 230 * PPM, 0, draftPx * 1.5 + 14);
      const lamPx = Math.max(lam * PPM, 6);
      const eta = x => {
        const dx = bowX - x;                                 // 선수에서 뒤로의 거리
        if (dx < -4) return 0;
        const decay = Math.exp(-Math.max(dx, 0) / (lamPx * 3.4 + 60));
        return -amp * Math.cos(2 * Math.PI * Math.max(dx, 0) / lamPx) * decay;
      };
      // 물 채우기
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) ctx.lineTo(x, sea + eta(x));
      ctx.lineTo(w, h); ctx.closePath();
      const wg = ctx.createLinearGradient(0, sea - amp, 0, h);
      wg.addColorStop(0, 'rgba(37,99,164,.30)'); wg.addColorStop(1, 'rgba(10,30,62,.12)');
      ctx.fillStyle = wg; ctx.fill();
      ctx.strokeStyle = hl === 'Fn' ? 'rgba(244,114,182,.9)' : 'rgba(125,190,255,.65)';
      ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      // 흐르는 기준 거품(배가 움직인다는 표시)
      ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.22)';
      for (let k = 0; k < 16; k++) {
        let u = ((k / 16) - st.t * V * PPM / w * .9) % 1; if (u < 0) u += 1;
        const x = u * w;
        ctx.fillRect(x, sea + eta(x) + 16 + (k % 3) * 9, 10, 1.6);
      }
      ctx.restore();

      // 선체 (측면)
      const hull = [];
      hull.push([sternX, sea - deckPx]);
      hull.push([bowX - Lpx * .04, sea - deckPx - 5]);
      hull.push([bowX, sea - deckPx - 9]);                   // 선수 플레어
      hull.push([bowX, sea + draftPx * .35]);
      hull.push([bowX - Lpx * .12, sea + draftPx]);
      hull.push([sternX + Lpx * .06, sea + draftPx]);
      hull.push([sternX, sea + draftPx * .5]);
      ctx.save();
      if (hl === 'L' || hl === 'Cb') { ctx.shadowColor = hl === 'L' ? C.L : C.Cb; ctx.shadowBlur = 18; }
      D.poly(ctx, hull, { fill: 'rgba(200,211,239,.26)', stroke: '#c8d3ef', width: 2 });
      ctx.restore();
      // 상부 구조
      D.roundRect(ctx, sternX + Lpx * .08, sea - deckPx - 22, Lpx * .16, 22, 2);
      ctx.fillStyle = 'rgba(200,211,239,.4)'; ctx.fill();
      // 흘수선
      D.line(ctx, sternX - 6, sea, bowX + 6, sea, { color: 'rgba(255,255,255,.3)', dash: [4, 4] });
      D.dim(ctx, sternX, sea - deckPx - 36, bowX, sea - deckPx - 36, 'L = ' + fmt(p.L, 0) + ' m', C.L, hl === 'L');

      // 파장 치수선 — λ와 L을 바로 비교하게
      if (V > .4 && lamPx > 14) {
        const wy = sea + draftPx + 26;
        D.dim(ctx, bowX, wy, bowX - Math.min(lamPx, bowX - 20), wy,
          'λ = ' + fmt(lam, 0) + ' m  (λ/L = ' + fmt(lam / p.L, 2) + ')', '#fbbf24', false);
      }
      // 속력 화살표
      D.arrow(ctx, bowX + 18, sea - deckPx - 14, clamp(18 + V * 4, 18, 64), 0,
        { color: C.Vs, width: 3.4, hot: hl === 'Vs', label: fmt(V / KN, 1) + ' kn', ly: -13 });
      D.tag(ctx, 'Fn = ' + fmt(Fn, 3), sternX + Lpx * .5, sea - deckPx - 60, C.Fn, hl === 'Fn');

      /* ── 저항 막대 ── */
      const bx = 56, byy = Math.min(h - 150, sea + draftPx + 70), bw = Math.min(w * .42, 280);
      if (byy + 56 < h) {
        const rmax = Math.max(rt, 1) * 1.1;
        D.text(ctx, '저항의 구성', bx, byy - 24, { size: 10.5, color: '#61719a' });
        [['R_F 마찰', rf, C.RF, hl === 'RF'], ['R_W 조파', rw, C.RW, hl === 'RW']].forEach(([lab, v, col, hot], k) => {
          D.bar(ctx, bx, byy + k * 30, bw, 15, v, rmax, col, lab + '  ' + fmt(v / 1000, 1) + ' kN', hot);
        });
        D.text(ctx, 'R_T = ' + fmt(rt / 1000, 1) + ' kN   ·   EHP = ' + fmt(rt * V / 1e6, 2) + ' MW',
          bx, byy + 76, { size: 11.5, color: hl === 'RT' ? '#fff' : C.RT, bold: true });
      }

      /* ── 저항계수 – Fn 곡선 (험프가 보인다) ── */
      const qw = Math.min(w - bx - bw - 110, 250), qh = 128;
      const qx = w - qw - 44, qy = Math.min(h - qh - 46, sea + draftPx + 62);
      if (qw > 120 && qy > sea) {
        D.roundRect(ctx, qx, qy, qw, qh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
        D.text(ctx, '저항계수 – 프루드 수', qx + 4, qy - 8, { size: 10.5, color: '#61719a' });
        const FMAX = .55;
        const cmax = .0062;
        const QX = ff => qx + clamp(ff / FMAX, 0, 1) * qw;
        const QY = cc => qy + qh - clamp(cc / cmax, 0, 1) * qh;
        const Vof = ff => ff * Math.sqrt(G * p.L);
        [[(ff) => CFof(Vof(ff), p), C.RF, 'C_F'], [(ff) => CWof(Vof(ff), p), C.RW, 'C_W']].forEach(([fn, col, lab]) => {
          ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.9; ctx.beginPath();
          for (let k = 1; k <= 110; k++) {
            const ff = FMAX * k / 110, X = QX(ff), Y = QY(fn(ff));
            k > 1 ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
          }
          ctx.stroke(); ctx.restore();
          D.text(ctx, lab, QX(FMAX) - 3, QY(fn(FMAX * .97)) - 5, { size: 9.5, color: col, align: 'right' });
        });
        // 험프 표시
        [[.33, '제1 험프'], [.49, '제2 험프']].forEach(([ff, lab]) => {
          if (ff > FMAX) return;
          D.line(ctx, QX(ff), qy, QX(ff), qy + qh, { color: 'rgba(251,146,60,.3)', dash: [3, 4] });
          D.text(ctx, lab, QX(ff), qy + 12, { size: 8.5, color: 'rgba(251,146,60,.85)', align: 'center' });
        });
        // 경제 속력대
        ctx.save(); ctx.fillStyle = 'rgba(52,211,153,.08)';
        ctx.fillRect(qx, qy, QX(.22) - qx, qh); ctx.restore();
        D.text(ctx, '경제', qx + 4, qy + qh - 6, { size: 8.5, color: 'rgba(52,211,153,.8)' });
        // 현재 위치
        D.line(ctx, QX(Fn), qy, QX(Fn), qy + qh, { color: 'rgba(255,255,255,.35)' });
        D.dot(ctx, QX(Fn), QY(CWof(V, p)), 4, C.RW, true);
        D.dot(ctx, QX(Fn), QY(CFof(V, p)), 4, C.RF, true);
        D.text(ctx, 'Fn →', qx + qw, qy + qh + 14, { size: 9, color: '#61719a', align: 'right' });
        D.text(ctx, fmt(Fn, 3), QX(Fn), qy + qh + 14, { size: 9.5, color: '#e8eefc', align: 'center' });
      }
    }
  });
})();
