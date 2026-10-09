/* [일반물리·전자기학] 전기장과 전위 — E = kq/r², V = kq/r
   전하 둘레의 공간이 어떻게 '바뀌어 있는가'를 두 가지 방식으로 본다. 전기장 E는
   방향이 있는 벡터(어디로 밀리는가)이고 전위 V는 방향이 없는 스칼라(얼마나 높은
   언덕인가)다. 전기력선은 항상 등전위선과 수직이고, 전하는 언덕을 굴러 내려간다.
   퍼텐셜 에너지로 생각하면 중력과 완전히 같은 구조인데 — 전하는 부호가 둘이라
   '끌어당기는 언덕'과 '밀어내는 언덕'이 함께 존재한다는 것만 다르다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { q1: '#fb7185', q2: '#60a5fa', d: '#93a2c4', qt: '#fbbf24',
              E: '#5eead4', V: '#a78bfa', F: '#f472b6' };
  const K = 8.988e9;              // 쿨롱 상수
  const SCALE = 1 / 100;          // 화면 1 px = 1 cm

  const pos = p => [[-p.d / 2, 0], [p.d / 2, 0]];     // 두 전하 위치 [cm]
  // 전기장 [N/C] / 전위 [V] — 위치는 cm, 전하는 nC
  function field(p, x, y) {
    const P = pos(p), q = [p.q1 * 1e-9, p.q2 * 1e-9];
    let ex = 0, ey = 0, v = 0;
    for (let i = 0; i < 2; i++) {
      const dx = (x - P[i][0]) * SCALE, dy = (y - P[i][1]) * SCALE;
      const r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
      if (r < 4e-3) continue;
      const e = K * q[i] / r2;
      ex += e * dx / r; ey += e * dy / r; v += K * q[i] / r;
    }
    return { ex: ex, ey: ey, mag: Math.hypot(ex, ey), v: v };
  }
  const forceBetween = p => {
    const r = p.d * SCALE;
    return K * Math.abs(p.q1 * p.q2) * 1e-18 / (r * r);
  };

  PS.register({
    id: 'g-efield', mode: 'general', category: '전자기학',
    title: '전기장과 전위',
    sub: 'E = kq/r²,  V = kq/r',
    tagline: '전하 둘레의 공간이 어떻게 바뀌어 있는가. 전기장은 "어디로 밀리는가"(벡터), 전위는 "얼마나 높은 언덕인가"(스칼라) — 같은 사실의 두 얼굴입니다.',

    params: [
      { key: 'q1', symbol: 'q₁', label: '왼쪽 전하', unit: 'nC', min: -10, max: 10, step: .5, value: 5, color: C.q1, dec: 1,
        where: '<b>왼쪽 전하</b>입니다. 양(+)이면 전기력선이 뻗어 나가고 전위 언덕이 솟아오르며(붉은색), 음(−)이면 빨려 들어가고 골짜기가 됩니다(파란색).' },
      { key: 'q2', symbol: 'q₂', label: '오른쪽 전하', unit: 'nC', min: -10, max: 10, step: .5, value: -5, color: C.q2, dec: 1,
        where: '<b>오른쪽 전하</b>입니다. 부호를 같게 하면 두 전하 사이에 전기장이 0인 <b>중립점</b>이 생기고, 반대로 하면(쌍극자) 전기력선이 한쪽에서 다른 쪽으로 이어집니다.' },
      { key: 'd', symbol: 'd', label: '두 전하 간격', unit: 'cm', min: 3, max: 16, step: .5, value: 8, color: C.d, dec: 1, reset: true,
        where: '두 전하 사이의 <b>거리</b>입니다. 쿨롱 힘은 거리의 제곱에 반비례하므로, 간격을 절반으로 줄이면 서로 당기거나 미는 힘이 4배가 됩니다.' },
      { key: 'y0', symbol: 'y₀', label: '시험전하 출발 높이', unit: 'cm', min: -8, max: 8, step: .5, value: 5, color: C.qt, dec: 1, reset: true,
        where: '<b>노란 시험전하(+1 nC)</b>가 출발하는 높이입니다. 가만히 놓으면 전기장을 따라 움직이며, 그 경로가 전기력선과 같다는 것을 보여 줍니다.' }
    ],
    vars: {
      E: { symbol: 'E', label: '전기장', unit: 'N/C', color: C.E,
        where: '그 자리에 놓인 <b>+1 C가 받는 힘</b>입니다. 화면의 <b>전기력선</b>(청록색)이 그 방향이고, 선이 빽빽한 곳이 센 곳입니다.' },
      V: { symbol: 'V', label: '전위', unit: 'V', color: C.V,
        where: '그 자리의 <b>전기적 높이</b>입니다. 배경 색(붉은 = 높음, 파란 = 낮음)과 <b>등전위선</b>(흰 점선)으로 표시됩니다. 등전위선 위에서는 움직여도 일이 들지 않습니다.' },
      F: { symbol: 'F', label: '두 전하 사이의 힘', unit: 'N', color: C.F,
        where: '두 전하가 서로 <b>당기거나 미는 힘</b>입니다(전하 위의 화살표). 같은 부호면 밀고, 다른 부호면 당깁니다.' }
    },
    formulas: [
      { name: '쿨롱 법칙', tpl: '{F} = k{q1}{q2} ⁄ {d}²' },
      { name: '전기장 (벡터)', tpl: '{E} = k q ⁄ r²' },
      { name: '전위 (스칼라)', tpl: '{V} = k q ⁄ r' },
      { name: '둘의 관계', tpl: '{E} = −d{V}⁄dr   (전기장은 전위의 기울기)' }
    ],

    init(p) { return { x: 0, y: p.y0, vx: 0, vy: 0, trail: [], gone: false, done: false }; },
    step(st, p, dt) {
      if (st.gone) return;
      const f = field(p, st.x, st.y);
      // 시험전하 +1 nC, 질량은 보기 좋은 값으로 (경로 모양은 전기력선과 같다)
      const m = 2e-11;
      st.vx += f.ex * 1e-9 / m * dt; st.vy += f.ey * 1e-9 / m * dt;
      st.x += st.vx * dt * 100; st.y += st.vy * dt * 100;
      if (st.trail.length === 0 || Math.hypot(st.x - st.trail[st.trail.length - 1][0], st.y - st.trail[st.trail.length - 1][1]) > .25)
        st.trail.push([st.x, st.y]);
      if (st.trail.length > 600) st.trail.shift();
      const P = pos(p);
      for (let i = 0; i < 2; i++) if (Math.hypot(st.x - P[i][0], st.y - P[i][1]) < .8) { st.gone = true; st.done = true; }
      if (Math.abs(st.x) > 40 || Math.abs(st.y) > 30) { st.gone = true; st.done = true; }
    },

    graphs: [{
      title: '시험전하의 에너지 — 합은 보존된다', xmin: 4, window: 8,
      series: [
        { key: 'KE', label: '운동에너지', color: '#fb923c' },
        { key: 'PE', label: '전기 퍼텐셜', color: C.V },
        { key: 'TOT', label: '합', color: '#e8eefc' }
      ]
    }],
    sample(st, p) {
      const f = field(p, st.x, st.y);
      const m = 2e-11;
      const KE = .5 * m * (st.vx * st.vx + st.vy * st.vy) * 1e9;    // nJ
      const PE = 1e-9 * f.v * 1e9;
      return { KE: KE, PE: PE, TOT: KE + PE };
    },

    readouts(st, p) {
      const mid = field(p, 0, 0), at = field(p, st.x, st.y);
      // 축 위에서 전기장이 0이 되는 지점 (같은 부호일 때)
      let neutral = null;
      if (p.q1 * p.q2 > 0 && Math.abs(p.q1) > .01) {
        const r = Math.sqrt(Math.abs(p.q2 / p.q1));
        neutral = -p.d / 2 + p.d / (1 + r);
      }
      return [
        { label: '두 전하 사이의 힘 F', value: forceBetween(p), unit: 'N', color: C.F, dec: 6 },
        { label: '힘의 방향', wide: true, color: p.q1 * p.q2 < 0 ? C.q2 : C.q1,
          value: p.q1 * p.q2 === 0 ? '—' : (p.q1 * p.q2 < 0 ? '서로 끌어당긴다' : '서로 밀어낸다') },
        { label: '중앙의 전기장 E', value: mid.mag, unit: 'N/C', color: C.E, dec: 0 },
        { label: '중앙의 전위 V', value: mid.v, unit: 'V', color: C.V, dec: 0 },
        { label: '시험전하 위치의 E', value: at.mag, unit: 'N/C', color: C.E, dec: 0 },
        { label: '시험전하 위치의 V', value: at.v, unit: 'V', color: C.V, dec: 0 },
        { label: '전체 전하량 (멀리서 보면)', value: p.q1 + p.q2, unit: 'nC', dec: 1, color: '#93a2c4' },
        { label: '배치', wide: true, color: '#fbbf24',
          value: p.q1 * p.q2 < 0 ? (Math.abs(p.q1 + p.q2) < .01 ? '전기 쌍극자 — 멀리서는 거의 안 보인다' : '서로 다른 부호') :
                 (p.q1 * p.q2 > 0 ? '같은 부호 — 사이에 전기장 0인 중립점이 있다' : '한쪽이 0') },
        { label: '전기장이 0인 지점 (축 위)', wide: true, color: C.E,
          value: neutral !== null ? 'x = ' + fmt(neutral, 2) + ' cm' : (p.q1 * p.q2 < 0 ? '없다 (부호가 달라서)' : '—') },
        { label: '시험전하 상태', wide: true, color: st.gone ? '#fb7185' : '#34d399',
          value: st.gone ? '전하에 흡수되거나 화면 밖으로 나갔다' : '전기력선을 따라 움직이는 중' }
      ];
    },

    notes: [
      '<b>전기장과 전위는 같은 사실의 두 얼굴입니다.</b> 전기장은 "어느 쪽으로 밀리는가"(벡터), 전위는 "얼마나 높은 언덕인가"(스칼라). 전기장은 전위의 기울기이고, 공 하나가 언덕을 굴러 내려가듯 전하는 전위가 낮아지는 쪽으로 갑니다(양전하 기준).',
      '<b>전기력선은 등전위선과 항상 수직입니다.</b> 등전위선 위에서 움직이는 데는 일이 전혀 들지 않기 때문입니다 — 등고선을 따라 산을 도는 것과 같습니다.',
      '<b>부호가 같은 두 전하 사이에는 전기장이 0인 점이 생깁니다.</b> 그런데 그 점의 전위는 0이 아닙니다 — 벡터는 상쇄돼도 스칼라는 더해지기 때문입니다. 반대로 쌍극자에서는 가운데 전위가 0이지만 전기장은 가장 셉니다.',
      '<b>전기 쌍극자(+q와 −q)는 멀리서 보면 거의 보이지 않습니다.</b> 전체 전하가 0이라 1/r²이 상쇄되고 1/r³만 남기 때문입니다 — 중성 분자들이 멀리서는 전기적으로 "조용한" 이유이고, 가까이 가면 반데르발스 힘으로 드러나는 이유이기도 합니다.',
      '구조가 <b>중력과 완전히 같습니다</b>(F ∝ 1/r², V ∝ 1/r). 차이는 전하에 부호가 둘 있다는 것뿐이고, 그래서 전기력은 가려질 수 있지만 중력은 가릴 수 없습니다 — 우주 규모에서 중력이 이기는 이유입니다.'
    ],
    presets: [
      { name: '전기 쌍극자 (+5, −5)', set: { q1: 5, q2: -5, d: 8, y0: 5 } },
      { name: '같은 부호 (+5, +5)', set: { q1: 5, q2: 5, d: 8, y0: 5 } },
      { name: '한쪽만 크게 (+10, −2)', set: { q1: 10, q2: -2, d: 8, y0: 4 } },
      { name: '가까이 붙이면', set: { q1: 5, q2: -5, d: 3, y0: 5 } },
      { name: '전하 하나만 (+8)', set: { q1: 8, q2: 0, d: 8, y0: 6 } }
    ],
    challenges: [
      {
        id: 'neutral', title: '중립점 만들기',
        desc: '두 전하 사이에 전기장이 정확히 0이 되는 지점이 생기게 해 보세요 — 그런데 그 점의 전위는 0이 아닙니다.',
        hint: '두 전하의 부호를 같게 하면 됩니다. 측정값 칸의 "전기장이 0인 지점"을 확인하세요.',
        check: ({ P }) => P.q1 * P.q2 > 0
      },
      {
        id: 'dipole', title: '완벽한 쌍극자',
        desc: '전체 전하량이 0인 쌍극자를 만들고, 가운데(x=0)에서 전위가 0인데도 전기장은 0이 아니라는 것을 확인하세요.',
        hint: 'q₁ = −q₂ 로 맞추면 됩니다. 벡터는 더해지고 스칼라는 상쇄되는 상황입니다.',
        check: ({ P }) => Math.abs(P.q1 + P.q2) < .01 && Math.abs(P.q1) > 1
      },
      {
        id: 'strong', title: '힘을 10배로',
        desc: '전하는 그대로 두고 거리만 바꿔서, 두 전하 사이의 힘을 처음(5 nC, −5 nC, 8 cm)의 4배 이상으로 만들어 보세요.',
        hint: '쿨롱 힘은 거리의 제곱에 반비례합니다 — 간격을 절반으로 줄이면 4배가 됩니다.',
        check: ({ P }) => Math.abs(P.q1) >= 5 && Math.abs(P.q2) >= 5 && P.d <= 4
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cx = w * .42, cy = h * .48, PX = 13;      // 1 cm → px
      const X = x => cx + x * PX, Y = y => cy - y * PX;
      const P = pos(p);

      /* ── 전위 격자를 한 번만 계산해 색지도와 등전위선에 함께 쓴다 ── */
      const cell = 10, gw = Math.ceil(w * .84 / cell), gh2 = Math.ceil((h - 44) / cell);
      const grid = new Float64Array((gw + 1) * (gh2 + 1));
      const gxOf = i => (i * cell - cx) / PX, gyOf = j => (cy - (24 + j * cell)) / PX;
      for (let i = 0; i <= gw; i++) for (let j = 0; j <= gh2; j++)
        grid[i * (gh2 + 1) + j] = field(p, gxOf(i), gyOf(j)).v;
      const G = (i, j) => grid[i * (gh2 + 1) + j];

      // 색지도
      const vmax = 2400;
      ctx.save();
      for (let i = 0; i < gw; i++) for (let j = 0; j < gh2; j++) {
        const u = clamp((G(i, j) + G(i + 1, j) + G(i, j + 1) + G(i + 1, j + 1)) / 4 / vmax, -1, 1);
        if (Math.abs(u) < .012) continue;
        ctx.fillStyle = u > 0 ? 'rgba(251,113,133,' + (Math.abs(u) * .40) + ')'
                              : 'rgba(96,165,250,' + (Math.abs(u) * .40) + ')';
        ctx.fillRect(i * cell, 24 + j * cell, cell + .5, cell + .5);
      }
      ctx.restore();

      // 등전위선 — 격자에서 등고선이 지나는 변만 짧게 긋는다
      ctx.save();
      ctx.strokeStyle = hl === 'V' ? 'rgba(232,238,252,.75)' : 'rgba(232,238,252,.26)';
      ctx.lineWidth = hl === 'V' ? 1.6 : 1.1;
      ctx.beginPath();
      [-1600, -800, -400, -200, 200, 400, 800, 1600].forEach(lev => {
        for (let i = 0; i < gw; i++) for (let j = 0; j < gh2; j++) {
          const v0 = G(i, j) - lev, vr = G(i + 1, j) - lev, vd = G(i, j + 1) - lev;
          const sx0 = i * cell, sy0 = 24 + j * cell;
          if (v0 * vr < 0) { const t = Math.abs(v0) / (Math.abs(v0) + Math.abs(vr)); ctx.moveTo(sx0 + cell * t, sy0 - 1); ctx.lineTo(sx0 + cell * t, sy0 + 1); }
          if (v0 * vd < 0) { const t = Math.abs(v0) / (Math.abs(v0) + Math.abs(vd)); ctx.moveTo(sx0 - 1, sy0 + cell * t); ctx.lineTo(sx0 + 1, sy0 + cell * t); }
        }
      });
      ctx.stroke();
      ctx.restore();

      /* ── 전기력선 ── */
      ctx.save();
      ctx.strokeStyle = hl === 'E' ? 'rgba(94,234,212,.95)' : 'rgba(94,234,212,.55)';
      ctx.lineWidth = hl === 'E' ? 1.8 : 1.3;
      [0, 1].forEach(i => {
        const q = i ? p.q2 : p.q1;
        if (Math.abs(q) < .2) return;
        const n = clamp(Math.round(Math.abs(q) * 1.2) + 6, 7, 16);
        for (let k = 0; k < n; k++) {
          const a0 = 2 * Math.PI * k / n + .12;
          let x = P[i][0] + Math.cos(a0) * .9, y = P[i][1] + Math.sin(a0) * .9;
          const dir = q > 0 ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(X(x), Y(y));
          for (let s = 0; s < 170; s++) {
            const f = field(p, x, y);
            if (!isFinite(f.mag) || f.mag < 1) break;
            x += dir * f.ex / f.mag * .34; y += dir * f.ey / f.mag * .34;
            if (Math.abs(x) > 34 || Math.abs(y) > 24) break;
            let hitOther = false;
            for (let j = 0; j < 2; j++) if (Math.hypot(x - P[j][0], y - P[j][1]) < .85) hitOther = true;
            ctx.lineTo(X(x), Y(y));
            if (hitOther) break;
          }
          ctx.stroke();
        }
      });
      ctx.restore();

      /* ── 전하 ── */
      [0, 1].forEach(i => {
        const q = i ? p.q2 : p.q1, key = i ? 'q2' : 'q1';
        if (Math.abs(q) < .05) return;
        const r = 7 + Math.abs(q) * .9;
        ctx.save();
        if (hl === key) { ctx.shadowColor = q > 0 ? C.q1 : C.q2; ctx.shadowBlur = 20; }
        ctx.fillStyle = q > 0 ? '#fb7185' : '#60a5fa';
        ctx.beginPath(); ctx.arc(X(P[i][0]), Y(P[i][1]), r, 0, 7); ctx.fill();
        ctx.restore();
        D.text(ctx, q > 0 ? '+' : '−', X(P[i][0]), Y(P[i][1]) + 5,
          { size: 15, color: '#0a1120', align: 'center', bold: true });
        D.text(ctx, fmt(q, 1) + ' nC', X(P[i][0]), Y(P[i][1]) + r + 15,
          { size: 10, color: q > 0 ? C.q1 : C.q2, align: 'center', bold: hl === key });
      });
      // 두 전하 사이의 힘
      const F = forceBetween(p);
      if (Math.abs(p.q1 * p.q2) > .01) {
        const att = p.q1 * p.q2 < 0;
        const al = clamp(14 + F * 8e4, 14, 46);
        [0, 1].forEach(i => {
          const s = i ? 1 : -1;
          D.arrow(ctx, X(P[i][0]) + s * 16, Y(P[i][1]) - 26, (att ? -s : s) * al, 0,
            { color: C.F, width: 2.6, head: 7, hot: hl === 'F' });
        });
        D.tag(ctx, 'F = ' + F.toExponential(2) + ' N', X(0), Y(0) - 44, C.F, hl === 'F');
      }
      D.dim(ctx, X(P[0][0]), Y(0) + 42, X(P[1][0]), Y(0) + 42, 'd = ' + fmt(p.d, 1) + ' cm', C.d, hl === 'd');

      /* ── 시험전하 ── */
      if (st.trail.length > 1) {
        ctx.save(); ctx.strokeStyle = 'rgba(251,191,36,.7)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        ctx.beginPath();
        st.trail.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])));
        ctx.stroke(); ctx.restore();
      }
      if (!st.gone) {
        ctx.save(); if (hl === 'y0') { ctx.shadowColor = C.qt; ctx.shadowBlur = 16; }
        D.dot(ctx, X(st.x), Y(st.y), 5, C.qt, true); ctx.restore();
        const f = field(p, st.x, st.y);
        if (f.mag > 1) D.arrow(ctx, X(st.x), Y(st.y), f.ex / f.mag * 24, -f.ey / f.mag * 24,
          { color: C.E, width: 2.2, head: 7, hot: hl === 'E' });
      }
      D.text(ctx, '노란 점: 시험전하 (+1 nC) — 전기력선을 따라 움직인다', 16, h - 10, { size: 10, color: '#61719a' });
      D.text(ctx, '배경색 = 전위 (붉은 높음 / 파란 낮음) · 흰 점선 = 등전위선', 16, 18, { size: 10, color: '#61719a' });
    }
  });
})();
