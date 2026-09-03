/* 전자기 유도 — 패러데이 법칙 V = −N ΔΦ/Δt */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { N: '#fbbf24', B: '#fb7185', v: '#60a5fa', R: '#c084fc', emf: '#34d399', phi: '#f472b6', I: '#5eead4' };
  const r = 0.04, A = Math.PI * r * r, LIM = 0.26;

  const flux = (x, B) => B * A * Math.pow(r, 3) / Math.pow(x * x + r * r, 1.5);
  const emfAt = (x, p, d) => 3 * p.N * p.B * A * Math.pow(r, 3) * x * d * p.v / Math.pow(x * x + r * r, 2.5);
  const peak = p => Math.abs(emfAt(r / 2, p, 1));

  PS.register({
    id: 'induction',
    category: '물질과 전자기장',
    title: '전자기 유도',
    sub: 'V = −N ΔΦ/Δt',
    tagline: '자석을 코일에 넣었다 뺐다 하면 전류가 흐릅니다. 무엇이 전류의 세기를 결정할까요?',

    params: [
      { key: 'N', symbol: 'N', label: '코일 감은 수', unit: '회', min: 1, max: 40, step: 1, value: 12, color: C.N, dec: 0,
        where: '<b>코일의 고리 개수</b>입니다. 고리 하나하나가 같은 기전력을 만들어 직렬로 더해지므로, N배로 감으면 기전력도 N배가 됩니다.' },
      { key: 'B', symbol: 'B', label: '자석의 세기', unit: 'T', min: .2, max: 1.5, step: .1, value: .8, color: C.B, dec: 1,
        where: '<b>자석에서 뻗어 나오는 자기력선의 진하기</b>입니다. 셀수록 코일을 지나는 자기 선속 Φ가 커집니다.' },
      { key: 'v', symbol: 'v', label: '자석의 속력', unit: 'm/s', min: .2, max: 3, step: .1, value: 1, color: C.v, dec: 1,
        where: '자석에 붙은 <b>파란 이동 화살표</b>입니다. 빠를수록 같은 선속 변화를 <b>짧은 시간</b>에 만들어 내므로 ΔΦ/Δt가 커집니다.' },
      { key: 'R', symbol: 'R', label: '회로의 저항', unit: 'Ω', min: 1, max: 20, step: 1, value: 4, color: C.R, dec: 0,
        where: '회로 아래쪽 <b>보라색 저항</b>입니다. 기전력이 같아도 저항이 크면 전류 I = V/R는 작아집니다.' }
    ],
    vars: {
      emf: { symbol: 'V', label: '유도 기전력', unit: 'V', color: C.emf,
        where: '<b>검류계 바늘</b>이 가리키는 값입니다. 자석이 코일 한가운데를 지날 때가 아니라, 선속이 <b>가장 빠르게 변하는 순간</b>에 최대가 됩니다.' },
      phi: { symbol: 'Φ', label: '자기 선속', unit: 'Wb', color: C.phi,
        where: '코일을 <b>통과하는 분홍색 화살표의 수</b>입니다. 자석이 가까울수록 촘촘해집니다. 중요한 것은 Φ 자체가 아니라 Φ의 <b>변화</b>입니다.' },
      t: { symbol: 't', label: '시간', unit: 's', color: '#94a3b8',
        where: '자석이 지나가는 데 걸리는 시간. 같은 변화라도 빨리 지나가면(Δt 작음) 기전력이 커집니다.' },
      I: { symbol: 'I', label: '유도 전류', unit: 'A', color: C.I,
        where: '회로 위를 흐르는 <b>움직이는 점들</b>입니다. 자석이 다가올 때와 멀어질 때 <b>방향이 반대</b>가 됩니다.' },
      Ar: { symbol: 'A', label: '코일의 단면적', unit: 'm²', color: C.phi,
        where: '코일 고리가 감싸는 넓이입니다. 넓을수록 더 많은 자기력선을 붙잡습니다.' }
    },
    formulas: [
      { name: '패러데이 전자기 유도 법칙', tpl: '{emf} = − {N} · Δ{phi} ⁄ Δ{t}' },
      { name: '자기 선속', tpl: '{phi} = {B} · {Ar}' },
      { name: '옴의 법칙', tpl: '{I} = {emf} ⁄ {R}' }
    ],

    init(p) { return { x: -LIM, d: 1, phi: flux(-LIM, p.B), emf: 0, q: 0 }; },

    step(st, p, dt) {
      st.x += st.d * p.v * dt;
      if (st.x > LIM) { st.x = LIM; st.d = -1; }
      if (st.x < -LIM) { st.x = -LIM; st.d = 1; }
      st.phi = flux(st.x, p.B);
      st.emf = emfAt(st.x, p, st.d);
      st.q += (st.emf / p.R) * dt * 6;   // 전류 표시용 위상
    },

    graphs: [
      { title: '자기 선속 Φ – 시간', xmin: 2, window: 4, series: [{ key: 'phi', label: 'Φ (mWb)', color: C.phi }] },
      { title: '유도 기전력 V – 시간', xmin: 2, window: 4, series: [{ key: 'emf', label: 'V (V)', color: C.emf }] }
    ],
    sample(st) { return { phi: st.phi * 1000, emf: st.emf }; },

    readouts(st, p) {
      const approaching = (st.d > 0 && st.x < 0) || (st.d < 0 && st.x > 0);
      return [
        { label: '자기 선속 Φ', value: st.phi * 1000, unit: 'mWb', color: C.phi },
        { label: '유도 기전력 V', value: st.emf, unit: 'V', color: C.emf },
        { label: '유도 전류 I = V/R', value: st.emf / p.R, unit: 'A', color: C.I },
        { label: '자석–코일 거리', value: Math.abs(st.x) * 100, unit: 'cm' },
        { label: '지금 상태', wide: true, color: approaching ? '#fb7185' : '#60a5fa',
          value: approaching ? '자석이 다가옴 → 코일이 밀어냄 (같은 극)' : '자석이 멀어짐 → 코일이 붙잡음 (다른 극)' }
      ];
    },

    notes: [
      '전류는 자석이 <b>움직일 때만</b> 흐릅니다. 코일 속에 자석을 넣고 <b>가만히 두면 전류는 0</b>입니다.',
      '기전력이 가장 큰 순간은 자석이 코일 <b>입구를 지날 때</b>입니다. 한가운데(Φ 최대)에서는 오히려 변화율이 0이라 전류가 0!',
      '감은 수 N, 자석 세기 B, 속력 v 중 <b>무엇을 키워도</b> 기전력이 커집니다.',
      '<b>렌츠 법칙</b>: 유도 전류는 언제나 원래의 변화를 <b>방해하는</b> 방향으로 흐릅니다.'
    ],
    presets: [
      { name: '천천히 (v=0.3)', set: { v: .3 } },
      { name: '빠르게 (v=3)', set: { v: 3 } },
      { name: '코일 많이 감기', set: { N: 40 } },
      { name: '한 번만 감기', set: { N: 1 } },
      { name: '센 자석 + 저항 작게', set: { B: 1.5, R: 1 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h * 1.35, { x0: -0.33, x1: 0.33, y0: -0.14, y1: 0.14, pad: 26 });
      const cy = h * .42, cx = V.X(0);
      const R = V.S(r), RM = V.S(r * .62);

      // 자기 선속 화살표 (코일을 통과하는 자기력선)
      const phiMax = flux(0, 1.5);
      const dens = clamp(st.phi / phiMax, 0, 1);
      const nLines = Math.round(1 + dens * 7);
      ctx.save();
      ctx.globalAlpha = hl === 'phi' ? 1 : .75;
      for (let i = 0; i < nLines; i++) {
        const off = (i - (nLines - 1) / 2) * (R * 1.7 / Math.max(1, nLines - 1)) * (nLines > 1 ? 1 : 0);
        D.arrow(ctx, cx - R * 1.5, cy + off, R * 3, 0, { color: C.phi, width: hl === 'phi' ? 2.5 : 1.6, head: 8 });
      }
      ctx.restore();
      D.text(ctx, 'Φ = ' + fmt(st.phi * 1000, 2) + ' mWb', cx, cy - R * 1.9 - 12,
        { size: 11, color: C.phi, align: 'center', bold: hl === 'phi', glow: hl === 'phi' });

      // 코일 (감은 수만큼 고리)
      const turns = Math.min(p.N, 14);
      const spread = R * 1.15;
      ctx.save();
      if (hl === 'N') { ctx.shadowColor = C.N; ctx.shadowBlur = 16; }
      for (let i = 0; i < turns; i++) {
        const t = turns === 1 ? 0 : (i / (turns - 1) - .5);
        const x = cx + t * spread * 2;
        ctx.beginPath();
        ctx.ellipse(x, cy, R * .32, R, 0, 0, 7);
        ctx.strokeStyle = hl === 'N' ? '#fde68a' : '#d9a441';
        ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.restore();
      D.text(ctx, 'N = ' + p.N + '회', cx, cy + R + 26, { size: 11.5, color: C.N, align: 'center', bold: hl === 'N' });

      // 자석
      const mx = V.X(st.x), ml = V.S(0.045), mh = RM;
      ctx.save();
      if (hl === 'B') { ctx.shadowColor = C.B; ctx.shadowBlur = 22; }
      ctx.fillStyle = '#fb7185';
      D.roundRect(ctx, mx - ml, cy - mh, ml, mh * 2, 4); ctx.fill();
      ctx.fillStyle = '#60a5fa';
      D.roundRect(ctx, mx, cy - mh, ml, mh * 2, 4); ctx.fill();
      ctx.restore();
      D.text(ctx, 'N', mx - ml / 2, cy + 5, { size: 13, color: '#fff', align: 'center', bold: true });
      D.text(ctx, 'S', mx + ml / 2, cy + 5, { size: 13, color: '#fff', align: 'center', bold: true });
      D.text(ctx, 'B = ' + fmt(p.B, 1) + ' T', mx, cy - mh - 12, { size: 11, color: C.B, align: 'center', bold: hl === 'B' });
      // 이동 방향
      D.arrow(ctx, mx, cy + mh + 22, st.d * 52, 0, { color: C.v, width: 3, hot: hl === 'v', label: 'v = ' + fmt(p.v, 1) + ' m/s', ly: 18 });

      // 회로: 코일 → 아래 → 저항 → 검류계 → 위
      const y2 = h - 62, xL = cx - R * 2.4, xR = cx + R * 2.4;
      const I = st.emf / p.R, Imax = Math.max(peak(p) / p.R, 1e-9);
      const path = [[cx - spread - R * .32, cy], [xL, cy], [xL, y2], [xR, y2], [xR, cy], [cx + spread + R * .32, cy]];
      ctx.save();
      ctx.strokeStyle = '#4b5b7d'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath(); path.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
      ctx.restore();

      // 전류(움직이는 점)
      const strength = clamp(Math.abs(I) / Imax, 0, 1);
      if (strength > .02) {
        const segs = [];
        let total = 0;
        for (let i = 1; i < path.length; i++) {
          const L = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
          segs.push({ a: path[i - 1], b: path[i], L, s: total }); total += L;
        }
        const gap = 26;
        ctx.save();
        ctx.fillStyle = C.I; ctx.globalAlpha = .35 + .65 * strength;
        if (hl === 'I') { ctx.shadowColor = C.I; ctx.shadowBlur = 12; }
        for (let s = 0; s < total; s += gap) {
          const d = (((s + st.q * 40) % total) + total) % total;
          const sg = segs.find(q => d >= q.s && d <= q.s + q.L) || segs[0];
          const f = (d - sg.s) / sg.L;
          const px = sg.a[0] + (sg.b[0] - sg.a[0]) * f, py = sg.a[1] + (sg.b[1] - sg.a[1]) * f;
          ctx.beginPath(); ctx.arc(px, py, 3 + 2 * strength, 0, 7); ctx.fill();
        }
        ctx.restore();
      }

      // 저항
      const rx = (xL + xR) / 2 - 26;
      ctx.save();
      ctx.fillStyle = hl === 'R' ? '#d8b4fe' : '#7c5aa8';
      D.roundRect(ctx, rx, y2 - 9, 52, 18, 4); ctx.fill();
      ctx.restore();
      D.text(ctx, p.R + 'Ω', rx + 26, y2 + 5, { size: 11, color: '#160b26', align: 'center', bold: true });

      // 검류계
      const gx = xR, gy = (cy + y2) / 2, gr = 30;
      ctx.save();
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 7);
      ctx.fillStyle = '#0f1830'; ctx.fill();
      ctx.strokeStyle = hl === 'emf' ? C.emf : '#33456d'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      const ang = -Math.PI / 2 + clamp(st.emf / Math.max(peak(p), 1e-9), -1, 1) * 1.05;
      D.line(ctx, gx, gy + 6, gx + Math.cos(ang) * gr * .8, gy + 6 + Math.sin(ang) * gr * .8,
        { color: C.emf, width: 2.5, hot: hl === 'emf' });
      D.dot(ctx, gx, gy + 6, 3, C.emf);
      D.text(ctx, fmt(st.emf, 2) + ' V', gx, gy + gr + 15, { size: 11, color: C.emf, align: 'center', bold: hl === 'emf' });
      D.text(ctx, '검류계', gx, gy - gr - 8, { size: 10, color: '#61719a', align: 'center' });

      // 렌츠 법칙 안내
      const approaching = (st.d > 0 && st.x < 0) || (st.d < 0 && st.x > 0);
      D.tag(ctx, approaching ? '자석이 다가온다 → 코일도 같은 극을 만들어 밀어낸다'
        : '자석이 멀어진다 → 코일이 반대 극을 만들어 붙잡는다',
        w / 2, h - 16, approaching ? '#fb7185' : '#60a5fa', hl === 'I' || hl === 'emf');
    }
  });
})();
