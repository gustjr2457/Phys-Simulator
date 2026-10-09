/* [선박공학·저항과 추진] 프로펠러와 캐비테이션 — J = V_a/nD,  η₀ = J·K_T/(2π·K_Q)
   프로펠러의 성능은 전진비 J 하나로 정리된다. 회전은 빠른데 배가 안 나가면(J가 작으면)
   추력은 크지만 물을 휘젓기만 해서 효율이 나쁘고, 너무 빨리 나가면(J가 크면) 날개가
   물을 밀지 못한다. 그 사이 어딘가에 효율이 최대인 지점이 있다.
   그리고 날개 뒷면의 압력이 물의 증기압 아래로 내려가면 상온에서 물이 끓는다 —
   캐비테이션. 그 기포가 터지며 금속을 깎아 내는 것이 프로펠러 설계의 최대 적이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { n: '#fb7185', Dp: '#5eead4', Va: '#60a5fa', hs: '#a78bfa',
              J: '#fbbf24', T: '#f472b6', eta: '#34d399', sig: '#fb923c' };
  const RHO = 1025, PATM = 101325, PVAP = 2340, G = 9.81, KN = .5144;

  const nrps = p => p.n / 60;
  const vaOf = p => p.Va * KN;
  const Jof = p => vaOf(p) / (nrps(p) * p.Dp);
  const ktOf = p => Math.max(0, .42 - .38 * Jof(p));
  const kqOf = p => Math.max(1e-4, .055 - .042 * Jof(p));
  const thrust = p => ktOf(p) * RHO * Math.pow(nrps(p), 2) * Math.pow(p.Dp, 4);
  const torque = p => kqOf(p) * RHO * Math.pow(nrps(p), 2) * Math.pow(p.Dp, 5);
  const etaOf = p => { const J = Jof(p); return J <= 0 ? 0 : clamp(J * ktOf(p) / (2 * Math.PI * kqOf(p)), 0, 1); };
  const vr2 = p => Math.pow(vaOf(p), 2) + Math.pow(.7 * Math.PI * nrps(p) * p.Dp, 2);
  const sigOf = p => (PATM + RHO * G * p.hs - PVAP) / (.5 * RHO * vr2(p));
  const areaD = p => .65 * Math.PI * p.Dp * p.Dp / 4;
  const tauOf = p => thrust(p) / (.5 * RHO * areaD(p) * vr2(p));
  const tauCrit = p => .3 * Math.pow(Math.max(sigOf(p), 1e-4), .57);         // 버릴 한계
  const cavit = p => tauOf(p) > tauCrit(p);

  PS.register({
    id: 'ship-propeller', mode: 'marine', category: '저항과 추진',
    title: '프로펠러와 캐비테이션',
    sub: 'J = V_a/nD,  η₀ = J·K_T/(2π·K_Q)',
    tagline: '회전은 빠른데 배가 안 나가면 물만 휘젓고, 너무 빨리 나가면 날개가 물을 못 밉니다. 그 사이에 효율 최대점이 있고 — 날개 뒷면이 너무 낮아지면 물이 상온에서 끓습니다.',

    params: [
      { key: 'n', symbol: 'n', label: '회전수', unit: 'rpm', min: 30, max: 250, step: 5, value: 110, color: C.n, dec: 0, reset: true,
        where: '프로펠러 <b>회전수</b>입니다. 추력은 n²로 커지지만 전진비 J가 작아져 효율이 떨어지고, 날개 끝 속도가 빨라져 캐비테이션 위험이 급증합니다.' },
      { key: 'Dp', symbol: 'D', label: '프로펠러 지름', unit: 'm', min: 2, max: 11, step: .25, value: 6, color: C.Dp, dec: 2, reset: true,
        where: '<b>프로펠러 지름</b>입니다. 추력은 D⁴로 커져서 — 크고 천천히 도는 프로펠러가 작고 빨리 도는 것보다 훨씬 효율적입니다. 다만 흘수와 선미 형상이 한계를 정합니다.' },
      { key: 'Va', symbol: 'V_a', label: '프로펠러 유입 속도', unit: 'kn', min: 2, max: 30, step: .5, value: 12, color: C.Va, dec: 1, reset: true,
        where: '프로펠러로 <b>들어오는 물의 속도</b>입니다(선속보다 약간 느림 — 반류). 전진비 J의 분자이고, 선속이 오르면 같이 올라갑니다.' },
      { key: 'hs', symbol: 'h', label: '프로펠러 축 깊이', unit: 'm', min: 2, max: 16, step: .5, value: 6, color: C.hs, dec: 1,
        where: '수면에서 <b>프로펠러 축까지의 깊이</b>입니다. 깊을수록 주변 압력이 높아져 캐비테이션이 덜 생깁니다 — 10 m마다 1기압씩 올라갑니다.' }
    ],
    vars: {
      J: { symbol: 'J', label: '전진비', unit: '', color: C.J,
        where: '한 바퀴 도는 동안 <b>몇 지름만큼 전진하는가</b>입니다. 프로펠러 성능을 이 하나로 정리할 수 있어, 아래 성능 곡선의 가로축이 됩니다.' },
      T: { symbol: 'T', label: '추력', unit: 'kN', color: C.T,
        where: '프로펠러가 배를 <b>미는 힘</b>입니다. 이 힘이 선체 저항과 같아지는 속도에서 배가 정속 항해합니다.' },
      eta: { symbol: 'η₀', label: '프로펠러 효율', unit: '', color: C.eta,
        where: '축에 넣어 준 동력 중 <b>추력으로 바뀐 비율</b>입니다. 좋은 설계가 65~72% 정도이고, 나머지는 물을 휘젓는 데 버려집니다.' },
      sig: { symbol: 'σ', label: '캐비테이션 수', unit: '', color: C.sig,
        where: '주변 압력이 <b>동압에 비해 얼마나 여유가 있는가</b>입니다. 작을수록 위험하고, 추력 하중이 한계선을 넘으면 날개 뒷면에서 물이 끓기 시작합니다.' }
    },
    formulas: [
      { name: '전진비', tpl: '{J} = {Va} ⁄ ({n}{Dp})' },
      { name: '추력과 토크', tpl: '{T} = K_T·ρ{n}²{Dp}⁴,   Q = K_Q·ρ{n}²{Dp}⁵' },
      { name: '프로펠러 효율', tpl: '{eta} = {J}·K_T ⁄ (2π·K_Q)' },
      { name: '캐비테이션 수', tpl: '{sig} = (p₀ + ρg{hs} − p_v) ⁄ (½ρV_r²)' }
    ],

    init(p) { return { ang: 0, done: false }; },
    step(st, p, dt) { st.ang += nrps(p) * 2 * Math.PI * dt * .22; },

    graphs: [{
      title: '프로펠러 성능 곡선 (전진비 J에 대하여)', xKey: 'Jx', xUnit: '', xMin: 0, xMax: 1.1, y0: 0,
      series: [
        { key: 'kt', label: 'K_T ×10', color: C.T },
        { key: 'kq', label: 'K_Q ×100', color: '#a78bfa' },
        { key: 'ef', label: '효율 η₀', color: C.eta }
      ]
    }],
    sample(st, p) {
      const Jx = ((st.t * .14) % 1) * 1.1;
      const kt = Math.max(0, .42 - .38 * Jx), kq = Math.max(1e-4, .055 - .042 * Jx);
      return { Jx: Jx, kt: kt * 10, kq: kq * 100, ef: clamp(Jx * kt / (2 * Math.PI * kq), 0, 1) };
    },

    readouts(st, p) {
      const J = Jof(p), T = thrust(p), Q = torque(p), e = etaOf(p);
      const Pd = 2 * Math.PI * nrps(p) * Q;
      const sig = sigOf(p), tau = tauOf(p), tc = tauCrit(p);
      const tip = .7 * Math.PI * nrps(p) * p.Dp;
      return [
        { label: '전진비 J', value: J, unit: '', color: C.J, dec: 3 },
        { label: '추력계수 K_T', value: ktOf(p), unit: '', color: C.T, dec: 4 },
        { label: '토크계수 K_Q', value: kqOf(p), unit: '', dec: 4, color: '#a78bfa' },
        { label: '추력 T', value: T / 1000, unit: 'kN', color: C.T, dec: 1 },
        { label: '토크 Q', value: Q / 1000, unit: 'kN·m', dec: 1, color: '#a78bfa' },
        { label: '전달 동력', value: Pd / 1e6, unit: 'MW', dec: 2, color: '#fbbf24' },
        { label: '프로펠러 효율 η₀', value: e * 100, unit: '%', color: C.eta, dec: 1 },
        { label: '날개 0.7R 지점 속도', value: tip, unit: 'm/s', dec: 1, color: C.n },
        { label: '캐비테이션 수 σ', value: sig, unit: '', color: C.sig, dec: 3 },
        { label: '추력 하중 τ', value: tau, unit: '', dec: 4, color: C.sig },
        { label: '캐비테이션 한계 τ_c', value: tc, unit: '', dec: 4, color: '#fb7185' },
        { label: '캐비테이션', wide: true, color: cavit(p) ? '#fb7185' : (tau > tc * .8 ? '#fbbf24' : '#34d399'),
          value: cavit(p) ? '발생! 날개 뒷면에서 물이 끓는다 — 침식·소음·추력 손실' :
                 (tau > tc * .8 ? '한계 근처 — 조금만 더 올리면 발생' : '없음 (안전)') },
        { label: '운전 영역', wide: true, color: J < .3 ? '#fbbf24' : (J > .9 ? '#fb7185' : '#34d399'),
          value: J < .3 ? '과부하 — 물만 휘젓는다 (예인·저속)' :
                 (J > .9 ? '공회전에 가깝다 — 추력이 거의 없다' : '정상 운전 영역') }
      ];
    },

    notes: [
      '<b>크고 느린 프로펠러가 효율적입니다.</b> 추력은 D⁴, 토크는 D⁵에 비례하므로, 같은 추력을 지름을 키워서 내면 회전수를 크게 낮출 수 있습니다 — 물에 주는 속도 변화가 작아져 버려지는 에너지가 줄어듭니다. 대형 컨테이너선의 프로펠러가 지름 10 m에 분당 80회전인 이유입니다.',
      '<b>전진비 J 하나가 모든 것을 정리합니다.</b> 지름도 회전수도 속도도 다른 프로펠러들을 J로 환산하면 같은 곡선 위에 올라옵니다 — 모형시험 결과를 실선에 그대로 쓸 수 있는 이유입니다.',
      '<b>효율에는 최대점이 있습니다.</b> J가 작으면 추력은 크지만 물을 많이 가속해 에너지를 버리고, J가 크면 날개가 물을 거의 못 밉니다. 보통 J = 0.6~0.8에서 65~72%가 나옵니다.',
      '<b>캐비테이션은 날개 뒷면에서 시작합니다.</b> 양력을 내느라 그쪽 압력이 낮아지는데, 그것이 물의 증기압(2.3 kPa) 아래로 내려가면 상온에서 끓어 기포가 생깁니다. 그 기포가 압력이 회복되는 곳에서 붕괴하며 <b>마이크로제트</b>를 쏘아 금속을 깎아 냅니다.',
      '캐비테이션의 대가는 셋입니다 — <b>침식</b>(날개에 구멍이 뚫린다), <b>소음</b>(잠수함에서는 치명적), <b>추력 손실</b>(기포가 물 대신 자리를 차지). 피하는 방법은 날개 면적을 넓히거나, 회전수를 낮추거나, 프로펠러를 더 깊이 두는 것입니다.',
      '그래서 <b>잠수함은 깊이 잠항합니다.</b> 10 m 내려갈 때마다 주변 압력이 1기압씩 올라가 캐비테이션 한계가 높아지므로, 더 깊은 곳에서 더 빨리 조용히 달릴 수 있습니다.'
    ],
    presets: [
      { name: '컨테이너선 순항', set: { n: 100, Dp: 8, Va: 16, hs: 8 } },
      { name: '대형 저속 프로펠러 (최고 효율)', set: { n: 80, Dp: 10, Va: 15, hs: 9 } },
      { name: '고속 소형 (캐비테이션 위험)', set: { n: 240, Dp: 2.5, Va: 20, hs: 2.5 } },
      { name: '예인선 (J가 아주 작다)', set: { n: 180, Dp: 3, Va: 3, hs: 4 } },
      { name: '깊이 잠항한 잠수함', set: { n: 120, Dp: 6, Va: 14, hs: 16 } },
      { name: '얕은 흘수 + 고회전', set: { n: 200, Dp: 5, Va: 12, hs: 2 } }
    ],
    challenges: [
      {
        id: 'eff', title: '효율 68% 넘기기',
        desc: '프로펠러 효율을 68% 이상으로 올려 보세요 — 실선에서 아주 잘 설계된 수준입니다.',
        hint: '전진비 J를 0.7 근처로 맞추세요. 지름을 키우고 회전수를 낮추면 J가 올라갑니다.',
        check: ({ P }) => etaOf(P) >= .68
      },
      {
        id: 'cav', title: '캐비테이션 일으키기',
        desc: '회전수나 깊이를 조절해 날개 뒷면에서 물이 끓게 만들어 보세요 — 기포가 보이면 성공입니다.',
        hint: '회전수를 올리고 프로펠러를 얕게 두면 됩니다. 추력 하중 τ가 한계 τ_c를 넘어야 합니다.',
        check: ({ P }) => cavit(P)
      },
      {
        id: 'big', title: '캐비테이션 없이 1,000 kN 밀기',
        desc: '추력 1,000 kN 이상을 내면서 캐비테이션은 일으키지 않는 설계를 찾아 보세요.',
        hint: '회전수를 올리는 대신 <b>지름</b>을 키우세요(T ∝ D⁴). 깊이도 함께 늘리면 안전 여유가 생깁니다.',
        check: ({ P }) => thrust(P) >= 1e6 && !cavit(P)
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const J = Jof(p), T = thrust(p), e = etaOf(p), cav = cavit(p);

      /* ── 물 ── */
      const sea = 46;
      ctx.save(); ctx.fillStyle = 'rgba(37,99,164,.10)';
      ctx.fillRect(0, sea, w, h - sea); ctx.restore();
      D.line(ctx, 0, sea, w, sea, { color: 'rgba(125,190,255,.5)', width: 2 });
      D.text(ctx, '수면', 12, sea - 7, { size: 10, color: 'rgba(125,190,255,.8)' });

      /* ── 프로펠러 (뒤에서 본 모습) ── */
      // 축이 깊어도 아래 캐비테이션 선도(h−110부터)를 침범하지 않도록 축척을 잡는다
      const PXM = clamp((h - sea - 190) / 18, 4, 15);           // 1 m → px
      const cx = w * .26, cy = sea + p.hs * PXM;
      const R = p.Dp / 2 * PXM;
      // 축 깊이
      D.dim(ctx, cx - R - 32, sea, cx - R - 32, cy, fmt(p.hs, 1) + ' m', C.hs, hl === 'hs');
      // 허브 + 날개 4장
      ctx.save();
      ctx.translate(cx, cy);
      for (let k = 0; k < 4; k++) {
        const a = st.ang + k * Math.PI / 2;
        ctx.save(); ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.quadraticCurveTo(R * .55, -R * .42, R * .96, -R * .12);
        ctx.quadraticCurveTo(R * .72, R * .22, 0, 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(200,211,239,.45)'; ctx.fill();
        ctx.strokeStyle = hl === 'Dp' ? '#5eead4' : '#c8d3ef'; ctx.lineWidth = 1.6; ctx.stroke();
        // 캐비테이션 기포 (날개 뒷면)
        if (cav) {
          const amt = clamp((tauOf(p) / tauCrit(p) - 1) * 2.2, .1, 1);
          ctx.fillStyle = 'rgba(255,255,255,' + (.35 + .5 * amt) + ')';
          for (let b = 0; b < 7; b++) {
            const rr = R * (.45 + b * .075);
            ctx.beginPath();
            ctx.arc(rr, -R * .16 + Math.sin(st.t * 14 + b + k) * 2, 1.4 + amt * 2.6 * (b / 7 + .3), 0, 7);
            ctx.fill();
          }
        }
        ctx.restore();
      }
      ctx.restore();
      ctx.save(); if (hl === 'n') { ctx.shadowColor = C.n; ctx.shadowBlur = 16; }
      D.dot(ctx, cx, cy, 8, '#8aa0c8', true); ctx.restore();
      D.dim(ctx, cx - R, cy + R + 22, cx + R, cy + R + 22, 'D = ' + fmt(p.Dp, 2) + ' m', C.Dp, hl === 'Dp');
      // 회전 방향
      ctx.save(); ctx.strokeStyle = C.n; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R + 14, -2.0, -.7); ctx.stroke(); ctx.restore();
      D.text(ctx, fmt(p.n, 0) + ' rpm', cx, cy - R - 26,
        { size: 11.5, color: hl === 'n' ? '#fff' : C.n, align: 'center', bold: true });
      // 유입 흐름
      for (let k = -2; k <= 2; k++) {
        const yy = cy + k * R * .4;
        const u = (st.t * .6 + (k + 2) * .2) % 1;
        D.arrow(ctx, cx - R - 70 + u * 30, yy, 22, 0, { color: 'rgba(96,165,250,.6)', width: 2, head: 6 });
      }
      D.text(ctx, 'V_a = ' + fmt(p.Va, 1) + ' kn', cx - R - 56, cy + R + 6,
        { size: 10.5, color: hl === 'Va' ? '#fff' : C.Va, align: 'center', bold: hl === 'Va' });
      // 추력
      D.arrow(ctx, cx + R + 16, cy, clamp(18 + T / 1e5, 18, 70), 0,
        { color: C.T, width: 4, head: 10, hot: hl === 'T' });
      D.tag(ctx, 'T = ' + fmt(T / 1000, 0) + ' kN', cx + R + 60, cy - 24, C.T, hl === 'T');
      if (cav) D.tag(ctx, '캐비테이션 발생 — 침식·소음·추력 손실', cx, cy + R + 50, '#fb7185', true);

      /* ── 성능 곡선 ── */
      const gx = Math.min(w - 280, cx + R + 110), gy = sea + 24;
      const gw = Math.min(w - gx - 44, 250), gh = Math.min(h * .40, 170);
      if (gw > 150) {
        D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
        D.text(ctx, '성능 곡선 (전진비 J)', gx + 4, gy - 8, { size: 10.5, color: '#61719a' });
        const GX = j => gx + gw * clamp(j / 1.1, 0, 1);
        const GY = v => gy + gh - clamp(v, 0, 1) * (gh - 6) - 3;
        [[(j) => Math.max(0, .42 - .38 * j) * 2, C.T, 'K_T'],
         [(j) => Math.max(1e-4, .055 - .042 * j) * 14, '#a78bfa', 'K_Q'],
         [(j) => { const kt = Math.max(0, .42 - .38 * j), kq = Math.max(1e-4, .055 - .042 * j); return clamp(j * kt / (2 * Math.PI * kq), 0, 1); }, C.eta, 'η₀']
        ].forEach(([fn, cc, lab]) => {
          ctx.save(); ctx.strokeStyle = cc; ctx.lineWidth = 2; ctx.beginPath();
          for (let i = 0; i <= 80; i++) { const j = 1.1 * i / 80; const X = GX(j), Y = GY(fn(j)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
          ctx.stroke(); ctx.restore();
          D.text(ctx, lab, GX(.05), GY(fn(.05)) - 6, { size: 9, color: cc });
        });
        ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
        D.line(ctx, GX(J), gy, GX(J), gy + gh, { color: '#fff', width: 2 }); ctx.restore();
        D.dot(ctx, GX(J), GY(e), 4.5, C.eta, true);
        D.text(ctx, 'J = ' + fmt(J, 3), GX(J), gy + gh + 15,
          { size: 10, color: hl === 'J' ? '#fff' : C.J, align: 'center', bold: true });
        D.text(ctx, 'η₀ = ' + fmt(e * 100, 1) + '%', gx + gw - 4, gy + 14,
          { size: 12, color: hl === 'eta' ? '#fff' : C.eta, align: 'right', bold: true });
      }

      /* ── 캐비테이션 선도 ── */
      const bx = 48, by = h - 76, bw = Math.min(w - 96, 440);
      D.text(ctx, '캐비테이션 선도 — 추력 하중 τ 가 한계 τ_c 를 넘으면 발생', bx, by - 10,
        { size: 10.5, color: '#61719a' });
      D.roundRect(ctx, bx, by, bw, 13, 6); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const tc = tauCrit(p), tau = tauOf(p);
      const MAXT = Math.max(tc * 2.2, tau * 1.2);
      ctx.fillStyle = 'rgba(52,211,153,.25)'; ctx.fillRect(bx, by, bw * clamp(tc / MAXT, 0, 1), 13);
      ctx.fillStyle = 'rgba(251,113,133,.25)';
      ctx.fillRect(bx + bw * clamp(tc / MAXT, 0, 1), by, bw * (1 - clamp(tc / MAXT, 0, 1)), 13);
      D.line(ctx, bx + bw * clamp(tc / MAXT, 0, 1), by - 6, bx + bw * clamp(tc / MAXT, 0, 1), by + 19,
        { color: '#fff', width: 2 });
      D.text(ctx, 'τ_c = ' + fmt(tc, 3), bx + bw * clamp(tc / MAXT, 0, 1), by + 32,
        { size: 9, color: '#e8eefc', align: 'center' });
      ctx.save(); ctx.shadowColor = cav ? '#fb7185' : '#34d399'; ctx.shadowBlur = 12;
      D.dot(ctx, bx + bw * clamp(tau / MAXT, 0, 1), by + 6.5, 6, cav ? '#fb7185' : '#34d399', true); ctx.restore();
      D.text(ctx, '안전', bx + 6, by + 10, { size: 9, color: 'rgba(52,211,153,.9)' });
      D.text(ctx, '캐비테이션', bx + bw - 6, by + 10, { size: 9, color: 'rgba(251,113,133,.9)', align: 'right' });
      D.text(ctx, 'σ = ' + fmt(sigOf(p), 3) + '   ·   τ = ' + fmt(tau, 4),
        bx, by + 34, { size: 11, color: hl === 'sig' ? '#fff' : C.sig });
    }
  });
})();
