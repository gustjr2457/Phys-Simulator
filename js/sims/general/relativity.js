/* 일반물리 · 상대성이론 — 특수 상대성이론
   초급의 "중력과 시간"에서 계산 없이 본 속도 효과(시간 지연)를, 여기서는 정량적으로
   더 깊이 다룬다: 로런츠 인자 γ, 길이 수축, 그리고 왜 질량이 있는 물체는 빛의 속력에
   도달할 수 없는지(운동에너지가 발산함)까지.
   모든 식은 특수 상대성이론의 정확한 식이며(근사 없음), β=v/c 하나로 전부 결정된다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { beta: '#60a5fa', gamma: '#fbbf24', L: '#5eead4', KE: '#f472b6' };
  const L0 = 4; // 정지 길이(고유 길이) — 임의 단위

  function gammaOf(beta) { return 1 / Math.sqrt(Math.max(1e-9, 1 - beta * beta)); }

  PS.register({
    id: 'g-relativity', mode: 'general', category: '상대성이론',
    title: '특수 상대성이론',
    sub: '빛의 속력은 누구에게나 똑같다 — 그 대가로 시간과 길이가 관측자마다 달라진다',
    tagline: '우주선의 속력(β=v/c)을 올려 보세요. 우주선의 길이가 짧아 보이고(길이 수축), 우주선 안의 시계는 느리게 가며(시간 지연), 우주선을 더 빠르게 만드는 데 드는 에너지는 빛의 속력에 가까워질수록 끝없이 커집니다 — 그래서 질량이 있는 것은 결코 빛의 속력에 도달할 수 없습니다.',

    params: [
      { key: 'beta', symbol: 'β', label: '우주선의 속력(빛의 속력 대비)', unit: 'c', min: 0, max: .999, step: .001, value: 0, color: C.beta, dec: 3,
        where: '우주선이 <b>빛의 속력(c)의 몇 배</b>로 나는지입니다. 특수 상대성이론의 모든 효과가 이 값 하나로 결정됩니다.' }
    ],
    vars: {
      gamma: { symbol: 'γ', label: '로런츠 인자', unit: '', color: C.gamma, where: '상대성이론 효과의 크기를 나타내는 핵심 숫자입니다. β=0이면 γ=1(효과 없음), β→1이면 γ→∞(효과가 무한히 커짐).' },
      L: { symbol: 'L', label: '관측되는 길이', unit: '', color: C.L, where: '정지해 있는 관측자가 보는, <b>움직이는 우주선의 길이</b>입니다. 우주선 안의 승무원에게는 여전히 원래 길이(L₀)로 보입니다 — "짧아지는 건 밖에서 볼 때뿐"입니다.' },
      dtau: { symbol: 'Δτ', label: '우주선 시계가 잰 시간', unit: '', color: '#a78bfa', where: '우주선 <b>안</b>의 시계가 잰 시간입니다.' },
      dtref: { symbol: 'Δt', label: '기준 시계가 잰 시간', unit: '', color: '#e8eefc', where: '정지한 관측자(지구)의 시계가 잰 시간입니다.' }
    },
    formulas: [
      { name: '로런츠 인자', tpl: '{gamma} = 1 ⁄ √(1 − {beta}²)' },
      { name: '시간 지연', tpl: '{dtau} = {dtref} × √(1 − {beta}²)' },
      { name: '길이 수축', tpl: '{L} = L₀ × √(1 − {beta}²)' },
      { name: '운동에너지 ⁄ 정지에너지', tpl: 'KE ⁄ (mc²) = {gamma} − 1' }
    ],

    init(p) { return { dtau: 0, x: -5 }; },
    step(st, p, dt) {
      st.dtau += Math.sqrt(Math.max(0, 1 - p.beta * p.beta)) * dt;
      st.x += (0.6 + p.beta * 3.2) * dt;
      if (st.x > 5.6) st.x = -5.6;
    },

    graphs: [{
      title: 'γ(로런츠 인자) — 시간', xmin: 6, window: 10, y0: 0,
      series: [{ key: 'gamma', label: 'γ', color: C.gamma }]
    }],
    sample(st, p) { return { gamma: gammaOf(p.beta) }; },

    readouts(st, p) {
      const g = gammaOf(p.beta);
      const factor = Math.sqrt(Math.max(0, 1 - p.beta * p.beta));
      return [
        { label: '로런츠 인자(γ)', value: g, dec: 2, color: C.gamma },
        { label: '관측되는 길이', value: L0 * factor, dec: 2, color: C.L },
        { label: '우주선 시계 경과', value: st.dtau, dec: 2, color: '#a78bfa' },
        { label: '기준 시계 경과', value: st.t, dec: 2, color: '#e8eefc' },
        { label: '운동에너지 ⁄ 정지에너지', value: g - 1, dec: 2, color: C.KE, wide: true }
      ];
    },

    notes: [
      '아인슈타인의 출발점은 딱 하나입니다: <b>빛의 속력은 누가 어떤 속도로 움직이며 재도 항상 똑같다</b>. 이 하나의 사실만으로 시간·길이·에너지에 대한 모든 결과가 논리적으로 따라 나옵니다.',
      '"우주선 안의 시계가 느리게 간다"는 것은 <b>정지한 관측자가 볼 때만</b>의 이야기입니다. 우주선 안의 승무원 입장에서는 자기 시계도, 자기 자를 잰 길이(L₀)도 평소와 똑같습니다 — 대신 그들 눈에는 "지구 쪽"이 느려지고 짧아져 보입니다. 이것이 상대성(relativity)이라는 이름의 이유입니다.',
      'β가 1에 가까워질수록 <b>운동에너지가 끝없이 커집니다</b>(γ→∞). 유한한 에너지로는 γ를 무한대로 만들 수 없으므로, 질량이 있는 것은 빛의 속력에 정확히 도달할 수 없습니다 — 빛(광자)처럼 질량이 0인 것만 c로 움직일 수 있습니다.',
      'E=mc²(정지에너지)은 β=0일 때도 이미 있는 에너지입니다. 여기 그래프의 "운동에너지 ÷ 정지에너지 = γ−1"은 <b>움직이기 때문에 추가로 필요한</b> 에너지의 비율입니다.',
      '초급의 "중력과 시간"에서 다룬 로켓 시계 효과가 바로 이 시뮬레이션의 시간 지연과 같은 식(√(1−β²))입니다 — 여기서는 길이 수축과 에너지까지 함께 정량적으로 봅니다.'
    ],
    presets: [
      { name: '정지', set: { beta: 0 } },
      { name: '빛의 속력의 50%', set: { beta: .5 } },
      { name: '빛의 속력의 90%', set: { beta: .9 } },
      { name: '빛의 속력의 99.9%', set: { beta: .999 } }
    ],

    challenges: [
      { id: 'ch-gamma10', title: '로런츠 인자(γ) 10 이상',
        desc: 'β를 올려서 로런츠 인자 γ가 10 이상이 되게 만들어보세요.',
        check: ctx => gammaOf(ctx.P.beta) >= 10,
        hint: 'β를 0.995 이상으로 올려보세요.' },
      { id: 'ch-ke5x', title: '운동에너지를 정지에너지의 5배 이상으로',
        desc: 'β를 올려서 운동에너지가 정지에너지(mc²)의 5배 이상이 되게 만들어보세요(γ−1 ≥ 5).',
        check: ctx => gammaOf(ctx.P.beta) - 1 >= 5,
        hint: 'β를 0.987 이상으로 올려보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, { x0: -6.2, x1: 6.2, y0: -3.4, y1: 3.4, pad: 24, uniform: false });
      const g = gammaOf(p.beta), factor = Math.sqrt(Math.max(0, 1 - p.beta * p.beta));

      D.text(ctx, '정지한 관측자가 보는 우주선', w / 2, 22, { size: 12, color: '#93a2c4', align: 'center' });

      // 정지 길이(점선, 기준) vs 실제 관측되는 길이(실선)
      const cy = V.Y(1.4);
      D.line(ctx, V.X(-L0 / 2), cy, V.X(L0 / 2), cy, { color: 'rgba(147,162,196,.35)', width: 1.4, dash: [5, 5] });
      D.text(ctx, '정지했을 때 길이(L₀)', V.X(0), cy - 12, { size: 10, color: '#61719a', align: 'center' });

      const cy2 = V.Y(0.5);
      const halfL = (L0 * factor) / 2;
      ctx.save();
      if (hl === 'L' || hl === 'beta') { ctx.shadowColor = C.L; ctx.shadowBlur = 16; }
      D.roundRect(ctx, V.X(-halfL), cy2 - 16, V.X(halfL) - V.X(-halfL), 32, 8);
      ctx.fillStyle = C.L; ctx.fill();
      ctx.restore();
      D.text(ctx, '지금 관측되는 길이(L)', V.X(0), cy2 + 34, { size: 11, color: C.L, align: 'center', bold: hl === 'L' });

      // 날아가는 우주선(장식 애니메이션 — β에 비례한 속도로 이동)
      const shipY = V.Y(-1.3);
      const shipX = V.X(st.x);
      D.dot(ctx, shipX, shipY, 6, '#e8eefc', hl === 'beta');
      D.arrow(ctx, shipX - 18, shipY, 30, 0, { color: C.beta, width: 2.4, hot: hl === 'beta' });

      // γ 곡선(정적 함수 그래프) — 우측 하단에 작게
      const gx0 = w - 190, gy0 = h - 150, gw = 160, gh = 110;
      D.text(ctx, 'γ(β) 곡선', gx0 + gw / 2, gy0 - 8, { size: 10.5, color: '#61719a', align: 'center' });
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
      ctx.strokeRect(gx0, gy0, gw, gh);
      ctx.strokeStyle = C.gamma; ctx.lineWidth = 2; ctx.beginPath();
      const GMAX = 12;
      for (let i = 0; i <= 60; i++) {
        const b = (i / 60) * .999;
        const gy = clamp(gammaOf(b), 1, GMAX);
        const px = gx0 + gw * (b / .999), py = gy0 + gh - gh * ((gy - 1) / (GMAX - 1));
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      const curB = clamp(p.beta, 0, .999), curG = clamp(g, 1, GMAX);
      const dotX = gx0 + gw * (curB / .999), dotY = gy0 + gh - gh * ((curG - 1) / (GMAX - 1));
      D.dot(ctx, dotX, dotY, 4, C.gamma, hl === 'gamma');
      ctx.restore();
      D.text(ctx, 'β=0', gx0, gy0 + gh + 12, { size: 9.5, color: '#61719a' });
      D.text(ctx, 'β→1', gx0 + gw, gy0 + gh + 12, { size: 9.5, color: '#61719a', align: 'right' });
    }
  });
})();
