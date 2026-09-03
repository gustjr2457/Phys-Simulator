/* 운동량과 충격량 — p = mv,  I = FΔt = Δp,  운동량 보존 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { m1: '#60a5fa', v1: '#93c5fd', m2: '#f472b6', v2: '#f9a8d4', e: '#fbbf24', I: '#34d399', F: '#34d399', dtc: '#a78bfa', p: '#e8eefc' };
  const LIM = 10.5;
  const half = m => (0.6 + 0.07 * m) / 2;

  PS.register({
    id: 'momentum',
    category: '역학과 에너지',
    title: '운동량과 충격량 (충돌)',
    sub: 'p = mv,  I = FΔt = Δp',
    tagline: '두 수레를 충돌시켜 보세요. 각각의 운동량은 변해도 두 운동량의 합은 언제나 그대로입니다.',

    params: [
      { key: 'm1', symbol: 'm₁', label: '① 수레 질량', unit: 'kg', min: .5, max: 8, step: .5, value: 2, color: C.m1, reset: true,
        where: '<b>파란 수레의 크기</b>입니다. 질량이 클수록 같은 속도라도 운동량(막대 길이)이 커집니다.' },
      { key: 'v1', symbol: 'v₁', label: '① 수레 속도', unit: 'm/s', min: -6, max: 6, step: .5, value: 3, color: C.v1, reset: true,
        where: '파란 수레 위 <b>화살표</b>. 오른쪽(+)·왼쪽(−) 방향을 부호로 나타냅니다. 운동량은 방향이 있는 양입니다.' },
      { key: 'm2', symbol: 'm₂', label: '② 수레 질량', unit: 'kg', min: .5, max: 8, step: .5, value: 4, color: C.m2, reset: true,
        where: '<b>분홍 수레의 크기</b>입니다.' },
      { key: 'v2', symbol: 'v₂', label: '② 수레 속도', unit: 'm/s', min: -6, max: 6, step: .5, value: -1, color: C.v2, reset: true,
        where: '분홍 수레 위 <b>화살표</b>입니다.' },
      { key: 'e', symbol: 'e', label: '반발 계수', unit: '', min: 0, max: 1, step: .05, value: 1, color: C.e, dec: 2, reset: true,
        where: '충돌 지점의 <b>노란 스프링</b>입니다. e = 1이면 완전 탄성 충돌(에너지 보존), e = 0이면 두 수레가 <b>붙어서</b> 함께 움직입니다.' },
      { key: 'dtc', symbol: 'Δt', label: '충돌 지속 시간', unit: 's', min: .01, max: .5, step: .01, value: .1, color: C.dtc, dec: 2,
        where: '두 수레가 <b>맞닿아 힘을 주고받는 시간</b>입니다. 같은 충격량이라도 Δt가 길수록 평균 힘 F는 작아집니다 — 에어백과 매트리스의 원리!' }
    ],
    vars: {
      p: { symbol: 'p', label: '운동량', unit: 'kg·m/s', color: C.p,
        where: '화면 위쪽 <b>가로 막대</b>입니다. 위 두 막대는 각 수레, 맨 아래 흰 막대는 <b>두 운동량의 합</b>이며 충돌 전후로 변하지 않습니다.' },
      m: { symbol: 'm', label: '질량', unit: 'kg', color: '#c4b5fd', where: '수레의 크기입니다.' },
      v: { symbol: 'v', label: '속도', unit: 'm/s', color: '#c4b5fd', where: '수레 위 화살표입니다.' },
      I: { symbol: 'I', label: '충격량', unit: 'N·s', color: C.I,
        where: '충돌 순간 두 수레가 서로에게 준 <b>초록 화살표</b>입니다. 크기는 같고 방향은 반대이며, 각 수레의 운동량 변화량 Δp와 정확히 같습니다.' },
      F: { symbol: 'F', label: '충돌 중 평균 힘', unit: 'N', color: C.F,
        where: '충격량을 충돌 시간으로 나눈 값입니다. 충돌 순간 화면에 표시됩니다.' }
    },
    formulas: [
      { name: '운동량', tpl: '{p} = {m}{v}' },
      { name: '운동량 보존', tpl: '{m1}{v1} + {m2}{v2} = {m1}{v1}′ + {m2}{v2}′' },
      { name: '충격량 = 운동량의 변화', tpl: '{I} = {F} · {dtc} = Δ{p}' },
      { name: '반발 계수', tpl: '{e} = |{v1}′ − {v2}′| ÷ |{v1} − {v2}|' }
    ],

    init(p) {
      return {
        x1: -5, x2: 5, u1: p.v1, u2: p.v2,
        hit: false, hitT: -9, J: 0, done: false,
        K0: .5 * p.m1 * p.v1 * p.v1 + .5 * p.m2 * p.v2 * p.v2
      };
    },

    step(st, p, dt) {
      st.x1 += st.u1 * dt;
      st.x2 += st.u2 * dt;
      const gap = (st.x2 - st.x1) - (half(p.m1) + half(p.m2));
      if (!st.hit && gap <= 0 && st.u1 > st.u2) {
        const M = p.m1 + p.m2, e = p.e;
        const w1 = ((p.m1 - e * p.m2) * st.u1 + (1 + e) * p.m2 * st.u2) / M;
        const w2 = ((p.m2 - e * p.m1) * st.u2 + (1 + e) * p.m1 * st.u1) / M;
        st.J = p.m1 * (w1 - st.u1);          // ①이 받은 충격량
        st.u1 = w1; st.u2 = w2;
        st.hit = true; st.hitT = st.t;
        st.x1 += gap / 2; st.x2 -= gap / 2;  // 겹침 보정
      }
      if (st.x1 < -LIM || st.x2 > LIM) st.done = true;
    },

    graphs: [{
      title: '운동량 – 시간',
      xmin: 4,
      series: [
        { key: 'p1', label: 'p₁', color: C.m1 },
        { key: 'p2', label: 'p₂', color: C.m2 },
        { key: 'ptot', label: 'p₁+p₂ (합)', color: '#e8eefc' }
      ]
    }],
    sample(st, p) {
      const a = p.m1 * st.u1, b = p.m2 * st.u2;
      return { p1: a, p2: b, ptot: a + b };
    },

    readouts(st, p) {
      const p1 = p.m1 * st.u1, p2 = p.m2 * st.u2;
      const K = .5 * p.m1 * st.u1 * st.u1 + .5 * p.m2 * st.u2 * st.u2;
      const F = st.hit ? Math.abs(st.J) / p.dtc : 0;
      return [
        { label: '① 운동량 p₁', value: p1, unit: 'kg·m/s', color: C.m1 },
        { label: '② 운동량 p₂', value: p2, unit: 'kg·m/s', color: C.m2 },
        { label: '총 운동량 (보존)', value: p1 + p2, unit: 'kg·m/s', color: '#fff', wide: true },
        { label: '충격량 |I| = |Δp|', value: st.hit ? Math.abs(st.J) : 0, unit: 'N·s', color: C.I },
        { label: '평균 힘 F = I/Δt', value: F, unit: 'N', color: C.F },
        { label: '운동 에너지 (충돌 전 → 후)', wide: true, color: p.e < 1 ? '#fb7185' : '#34d399',
          value: fmt(st.K0, 1) + ' → ' + fmt(K, 1) + ' J' + (p.e < 1 && st.hit ? '  (' + fmt(100 * (1 - K / st.K0), 0) + '% 손실)' : '') }
      ];
    },

    notes: [
      '충돌에서 <b>총 운동량은 항상 보존</b>됩니다. 그래프의 흰 선이 평평한 것을 확인하세요.',
      '운동 에너지는 <b>e = 1일 때만</b> 보존됩니다. e를 줄이면 에너지가 소리·열로 빠져나갑니다.',
      '두 수레가 받는 <b>충격량의 크기는 항상 같고 방향은 반대</b>입니다. (작용 반작용)',
      'Δt를 늘리면 같은 충격량에도 <b>평균 힘이 작아집니다</b>. 자동차 에어백이 바로 이 원리입니다.'
    ],
    presets: [
      { name: '완전 탄성 (e=1)', set: { e: 1, m1: 2, v1: 3, m2: 4, v2: -1 } },
      { name: '완전 비탄성 (붙음)', set: { e: 0, m1: 2, v1: 4, m2: 4, v2: 0 } },
      { name: '같은 질량 정면충돌', set: { m1: 3, m2: 3, v1: 3, v2: -3, e: 1 } },
      { name: '가벼운 것이 무거운 것에', set: { m1: 1, m2: 8, v1: 5, v2: 0, e: 1 } },
      { name: '에어백 효과 (Δt 크게)', set: { dtc: .4 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, { x0: -LIM, x1: LIM, y0: 0, y1: 6, pad: 20, uniform: false });
      const gy = h * .70;

      // 레일
      D.line(ctx, V.X(-LIM), gy, V.X(LIM), gy, { color: 'rgba(147,162,196,.5)', width: 3 });
      for (let m = -10; m <= 10; m += 2) {
        D.line(ctx, V.X(m), gy, V.X(m), gy + 6, { color: 'rgba(147,162,196,.25)' });
        D.text(ctx, m + '', V.X(m), gy + 19, { size: 9.5, color: '#4a5878', align: 'center' });
      }

      const cart = (x, m, v, col, colv, name, hotM, hotV) => {
        const wpx = V.S(2 * half(m)), hpx = 26 + m * 2.4;
        const px = V.X(x);
        ctx.save();
        if (hotM) { ctx.shadowColor = col; ctx.shadowBlur = 20; }
        D.roundRect(ctx, px - wpx / 2, gy - hpx - 6, wpx, hpx, 5);
        ctx.fillStyle = col; ctx.fill();
        ctx.restore();
        [-wpx * .3, wpx * .3].forEach(dx => D.dot(ctx, px + dx, gy - 3, 4.5, '#0a1120'));
        D.text(ctx, name, px, gy - hpx - 12, { size: 10.5, color: col, align: 'center', bold: hotM });
        D.text(ctx, fmt(m, 1) + 'kg', px, gy - hpx / 2, { size: 11, color: '#0a1120', align: 'center', bold: true });
        D.arrow(ctx, px, gy - hpx - 32, clamp(v * 16, -150, 150), 0,
          { color: colv, width: 3.5, hot: hotV, label: fmt(v, 1) + ' m/s' });
      };

      cart(st.x1, p.m1, st.u1, C.m1, C.v1, '①', hl === 'm1' || hl === 'm', hl === 'v1' || hl === 'v');
      cart(st.x2, p.m2, st.u2, C.m2, C.v2, '②', hl === 'm2' || hl === 'm', hl === 'v2' || hl === 'v');

      // 충돌 지점 표시(스프링/충격량)
      const contact = (V.X(st.x1) + V.X(st.x2)) / 2;
      if (!st.hit) {
        const gap = (st.x2 - st.x1) - (half(p.m1) + half(p.m2));
        if (gap < 3 && st.u1 > st.u2) {
          D.text(ctx, p.e >= .99 ? '완전 탄성 e=1' : (p.e <= .01 ? '완전 비탄성 e=0' : 'e = ' + fmt(p.e, 2)),
            contact, gy - 105, { size: 11, color: C.e, align: 'center', bold: hl === 'e', glow: hl === 'e' });
        }
      } else {
        const age = st.t - st.hitT;
        if (age < 1.4) {
          const al = 1 - age / 1.4;
          ctx.save(); ctx.globalAlpha = al;
          D.dot(ctx, contact, gy - 40, 30 * (1 - al) + 6, 'rgba(251,191,36,.35)');
          const Ipx = clamp(Math.abs(st.J) * 9, 20, 150);
          D.arrow(ctx, V.X(st.x1), gy - 84, Math.sign(st.J) * Ipx, 0,
            { color: C.I, width: 4, hot: hl === 'I' || hl === 'F', label: 'I = ' + fmt(st.J, 1) });
          D.arrow(ctx, V.X(st.x2), gy - 84, -Math.sign(st.J) * Ipx, 0,
            { color: C.I, width: 4, hot: hl === 'I' || hl === 'F', label: 'I = ' + fmt(-st.J, 1) });
          ctx.restore();
        }
        if (hl === 'F' || hl === 'dtc' || hl === 'I') {
          D.tag(ctx, 'F = I / Δt = ' + fmt(Math.abs(st.J), 1) + ' ÷ ' + fmt(p.dtc, 2) + ' = ' + fmt(Math.abs(st.J) / p.dtc, 0) + ' N',
            w / 2, h - 16, C.F, true);
        }
      }

      // 운동량 막대
      const p1 = p.m1 * st.u1, p2 = p.m2 * st.u2;
      const maxP = Math.max(8, Math.abs(p1) + Math.abs(p2));
      const bx = 20, bw = Math.min(260, w * .3);
      const zero = bx + bw / 2;
      const barRow = (y, val, col, lab, hot) => {
        D.roundRect(ctx, bx, y, bw, 11, 4); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
        const len = (val / maxP) * (bw / 2);
        ctx.save();
        if (hot) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
        D.roundRect(ctx, len >= 0 ? zero : zero + len, y, Math.abs(len), 11, 3);
        ctx.fillStyle = col; ctx.fill(); ctx.restore();
        D.line(ctx, zero, y - 2, zero, y + 13, { color: 'rgba(255,255,255,.3)' });
        D.text(ctx, lab + ' ' + fmt(val, 1), bx + bw + 8, y + 10, { size: 11, color: col, bold: hot });
      };
      D.text(ctx, '운동량 p = mv  (오른쪽 +, 왼쪽 −)', bx, 18, { size: 11, color: hl === 'p' ? '#fff' : '#61719a', bold: hl === 'p' });
      barRow(26, p1, C.m1, 'p₁', hl === 'm1' || hl === 'v1' || hl === 'p');
      barRow(42, p2, C.m2, 'p₂', hl === 'm2' || hl === 'v2' || hl === 'p');
      barRow(60, p1 + p2, '#e8eefc', '합', hl === 'p');

      if (st.done) D.tag(ctx, '수레가 트랙 끝에 닿았습니다 — ↺ 처음으로', w / 2, 26, '#fbbf24', true);
    }
  });
})();
