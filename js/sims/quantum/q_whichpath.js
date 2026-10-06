/* [양자역학] 관측하면 달라진다 — 어느 슬릿으로 갔나 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { det: '#fb7185', d: '#5eead4', rate: '#fbbf24', vis: '#60a5fa', hit: '#a78bfa' };
  const NB = 96;                              // 스크린 막대 개수

  // 간섭무늬 세기 (슬릿 간격 d가 클수록 무늬가 촘촘)
  const inter = (u, d) => Math.pow(Math.cos(Math.PI * d * u * .5), 2) * Math.exp(-u * u * .9);
  // 관측했을 때 — 두 덩어리(간섭 없음)
  const blobs = (u, d) => Math.exp(-Math.pow((u - .9 / d * 1.1), 2) * 3.2) + Math.exp(-Math.pow((u + .9 / d * 1.1), 2) * 3.2);

  function pick(p) {                           // 전자 하나가 떨어질 위치 u ∈ [-1,1]
    const observed = Math.random() < p.det / 100;
    const f = observed ? blobs : inter;
    for (let i = 0; i < 60; i++) {             // 기각 샘플링
      const u = Math.random() * 2 - 1;
      if (Math.random() < f(u, p.d)) return { u: u, observed: observed };
    }
    return { u: (Math.random() * 2 - 1) * .3, observed: observed };
  }

  // 쌓인 막대에서 무늬 대비(가시도)를 재 본다
  function visOf(st) {
    const mid = st.bins.slice(NB * .22 | 0, NB * .78 | 0);
    if (!mid.length) return 0;
    let mx = 0, mn = Infinity;
    for (let i = 1; i < mid.length - 1; i++) {
      const v = (mid[i - 1] + mid[i] + mid[i + 1]) / 3;
      mx = Math.max(mx, v); mn = Math.min(mn, v);
    }
    return mx + mn > 0 ? (mx - mn) / (mx + mn) : 0;
  }

  PS.register({
    id: 'q-whichpath', mode: 'quantum', category: '측정이라는 것',
    title: '관측하면 달라진다',
    sub: '어느 슬릿으로 갔나?',
    tagline: '전자를 하나씩 쏘면 스크린에는 점이 하나씩 찍힙니다. 그런데 아무것도 묻지 않으면 그 점들이 쌓여 줄무늬가 되고, "어느 슬릿으로 갔는지" 알아내려 하면 줄무늬가 사라지고 두 덩어리만 남습니다.',

    params: [
      { key: 'det', symbol: 'f', label: '경로를 관측하는 비율', unit: '%', min: 0, max: 100, step: 5, value: 0, color: C.det, dec: 0,
        where: '슬릿 옆 <b>검출기</b>가 전자 몇 %의 경로를 알아내는지입니다. 0 %면 줄무늬가 또렷하고, 100 %면 완전히 사라집니다. 중간값에서는 <b>그 비율만큼</b> 흐려집니다 — 전부 아니면 전무가 아닙니다.' },
      { key: 'd', symbol: 'd', label: '슬릿 간격', unit: '', min: 1, max: 6, step: .5, value: 3, color: C.d, dec: 1,
        where: '두 슬릿 사이의 거리입니다. 넓을수록 스크린의 <b>줄무늬 간격이 촘촘</b>해집니다.' },
      { key: 'rate', symbol: 'r', label: '초당 쏘는 전자 수', unit: '개/s', min: 5, max: 400, step: 5, value: 120, color: C.rate, dec: 0,
        where: '전자를 쏘는 속도입니다. 아주 느리게 두면 <b>한 번에 하나씩</b> 날아가 점이 찍히는 것을 볼 수 있습니다 — 그런데도 줄무늬가 생깁니다.' }
    ],
    vars: {
      vis: { symbol: 'V', label: '무늬 대비 (가시도)', unit: '', color: C.vis,
        where: '줄무늬가 <b>얼마나 또렷한가</b>입니다. 1이면 완벽한 줄무늬, 0이면 무늬가 전혀 없습니다. 관측 비율 f에 대해 V ≈ 1 − f 로 떨어집니다.' },
      hit: { symbol: 'N', label: '쌓인 전자 수', unit: '개', color: C.hit,
        where: '지금까지 스크린에 도착한 전자의 수입니다. 적을 때는 무작위처럼 보이지만, 수백 개가 쌓이면 무늬가 드러납니다.' }
    },
    formulas: [
      { name: '관측하지 않으면 — 두 경로가 더해진다', tpl: 'P = |ψ₁ + ψ₂|²  →  줄무늬' },
      { name: '관측하면 — 확률만 더해진다', tpl: 'P = |ψ₁|² + |ψ₂|²  →  두 덩어리' },
      { name: '부분적으로 관측하면', tpl: '{vis} ≈ 1 − {det}' },
      { name: '점 하나하나는 무작위, 쌓이면 확률 그대로', tpl: 'N회 반복 → 분포 ∝ P' }
    ],

    init(p) {
      return { bins: new Array(NB).fill(0), dots: [], hits: 0, obs: 0, acc: 0, flash: -9 };
    },
    step(st, p, dt) {
      st.acc += dt * p.rate;
      let n = Math.floor(st.acc);
      st.acc -= n;
      n = Math.min(n, 40);
      for (let i = 0; i < n; i++) {
        const e = pick(p);
        const bi = clamp(Math.floor((e.u + 1) / 2 * NB), 0, NB - 1);
        st.bins[bi]++; st.hits++;
        if (e.observed) { st.obs++; st.flash = st.t; }
        st.dots.push({ u: e.u, j: Math.random(), o: e.observed });
        if (st.dots.length > 4000) st.dots.shift();
      }
    },

    graphs: [{
      title: '관측 비율 – 무늬 대비 (V ≈ 1 − f)', xKey: 'det', xUnit: '%', xMin: 0, xMax: 100, y0: 0,
      series: [{ key: 'vis', label: '측정된 가시도', color: C.vis }]
    }],
    sample(st, p) { return st.hits > 300 ? { det: p.det, vis: visOf(st) } : null; },

    readouts(st, p) {
      const v = visOf(st);
      return [
        { label: '쌓인 전자 수', value: st.hits, unit: '개', color: C.hit, dec: 0 },
        { label: '경로가 관측된 전자', value: st.hits ? st.obs / st.hits * 100 : 0, unit: '%', color: C.det, dec: 1 },
        { label: '측정된 무늬 대비 V', value: st.hits > 300 ? fmt(v, 2) : '측정 중…', color: C.vis },
        { label: '예상 대비 1 − f', value: 1 - p.det / 100, unit: '', color: C.vis, dec: 2 },
        {
          label: '지금 스크린에 보이는 것', wide: true,
          color: p.det <= 5 ? '#34d399' : (p.det >= 95 ? '#fb7185' : '#fbbf24'),
          value: p.det <= 5 ? '또렷한 줄무늬 — 어느 쪽으로 갔는지 묻지 않았습니다'
            : p.det >= 95 ? '두 덩어리 — 경로를 전부 알아냈습니다'
              : '흐릿한 줄무늬 — ' + p.det + '%만 알아냈으므로 그만큼만 사라졌습니다'
        }
      ];
    },

    notes: [
      '점은 <b>언제나 하나씩</b> 찍힙니다. 전자는 쪼개져 도착하는 법이 없습니다 — 도착은 항상 알갱이로 합니다.',
      '그런데 <b>어디에</b> 찍힐지는 파동이 정합니다. 수백 개가 쌓여야 비로소 줄무늬가 드러납니다.',
      '<b>"전자가 두 틈을 동시에 지난다"고 말하지 않는 편이 좋습니다.</b> 실험이 말해 주는 것은 이것뿐입니다 — 어느 쪽인지 <b>묻지 않으면</b> 줄무늬가, <b>물으면</b> 두 덩어리가 나온다.',
      '관측 비율을 50 %로 두면 무늬가 절반만 남습니다. 전부 아니면 전무가 아니라 <b>아는 만큼 사라집니다</b>.',
      '실험실 트랙의 "영의 이중슬릿"은 빛(광자)으로 같은 일을 합니다. 여기서는 <b>물질(전자)</b>도 똑같다는 것을 보여 줍니다.'
    ],
    presets: [
      { name: '관측하지 않음 (줄무늬)', set: { det: 0, d: 3, rate: 120 } },
      { name: '절반만 관측 (반쯤 흐림)', set: { det: 50, d: 3, rate: 120 } },
      { name: '전부 관측 (두 덩어리)', set: { det: 100, d: 3, rate: 120 } },
      { name: '한 개씩 아주 천천히', set: { det: 0, d: 3, rate: 5 } },
      { name: '슬릿을 넓히면 (촘촘한 무늬)', set: { det: 0, d: 6, rate: 200 } }
    ],
    challenges: [
      {
        id: 'build', title: '줄무늬를 쌓아 보기',
        desc: '관측을 끄고(0 %) 전자를 800개 이상 쌓아서 줄무늬를 만들어 보세요.',
        hint: '점 하나하나는 무작위처럼 보이지만 계속 쌓으면 무늬가 드러납니다.',
        check: ({ P, st }) => P.det <= 5 && st.hits >= 800
      },
      {
        id: 'erase', title: '관측하면 사라진다',
        desc: '관측 비율을 100 %로 올리고 500개 이상 쌓아서, 줄무늬 대신 두 덩어리가 되는 것을 확인하세요.',
        hint: '첫 슬라이더를 끝까지 올린 뒤 ↺로 다시 쌓아 보세요.',
        check: ({ P, st }) => P.det >= 95 && st.hits >= 500
      },
      {
        id: 'half', title: '아는 만큼만 사라진다',
        desc: '관측 비율 50 % 부근에서 1000개 이상 쌓아, 측정된 무늬 대비가 0.3~0.7 사이에 오는 것을 확인하세요.',
        hint: '전부 아니면 전무가 아닙니다. V ≈ 1 − f 를 확인해 보세요.',
        check: ({ P, st }) => P.det >= 40 && P.det <= 60 && st.hits >= 1000 && visOf(st) > .3 && visOf(st) < .7
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const srcX = 54, slitX = w * .34, scrX = w * .74;
      const cy = h * .42, half = Math.min(h * .30, 160);
      const Y = u => cy + u * half;

      /* ── 전자총 ── */
      ctx.fillStyle = '#4d5f7d';
      D.roundRect(ctx, srcX - 26, cy - 15, 34, 30, 5); ctx.fill();
      D.text(ctx, '전자총', srcX - 9, cy + 34, { size: 10, color: '#93a2c4', align: 'center' });
      D.text(ctx, fmt(p.rate, 0) + ' 개/s', srcX - 9, cy - 24,
        { size: 10, color: hl === 'rate' ? '#fff' : C.rate, align: 'center', bold: hl === 'rate' });

      /* ── 슬릿 벽 ── */
      const gap = half * .14, off = half * .10 * p.d;
      ctx.save();
      ctx.fillStyle = '#2a3652';
      ctx.fillRect(slitX - 5, cy - half - 30, 10, (half + 30) - off - gap / 2);
      ctx.fillRect(slitX - 5, cy - off + gap / 2, 10, (off * 2 - gap));
      ctx.fillRect(slitX - 5, cy + off + gap / 2, 10, (half + 30) - off - gap / 2);
      ctx.restore();
      [-off, off].forEach(o => {
        D.line(ctx, slitX, cy + o - gap / 2, slitX, cy + o + gap / 2, { color: C.d, width: 3, hot: hl === 'd' });
      });
      D.dim(ctx, slitX - 34, cy - off, slitX - 34, cy + off, 'd', C.d, hl === 'd');

      /* ── 검출기 ── */
      const on = p.det > 0;
      const fresh = st.t - st.flash < .12;
      ctx.save();
      ctx.globalAlpha = on ? 1 : .35;
      ctx.fillStyle = on ? (fresh ? '#fecdd3' : C.det) : '#3a4663';
      D.roundRect(ctx, slitX + 14, cy - off - 13, 22, 26, 5); ctx.fill();
      D.roundRect(ctx, slitX + 14, cy + off - 13, 22, 26, 5); ctx.fill();
      ctx.restore();
      D.text(ctx, on ? '검출기 ON — ' + p.det + '%' : '검출기 OFF', slitX + 25, cy - half - 30,
        { size: 10.5, color: on ? C.det : '#4a5878', align: 'center', bold: hl === 'det' });
      if (on && fresh) { D.dot(ctx, slitX + 25, cy - off, 16, 'rgba(251,113,133,.35)'); }

      /* ── 전자 경로(장식) ── */
      ctx.save();
      ctx.strokeStyle = 'rgba(147,162,196,.14)'; ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(srcX + 10, cy);
        ctx.lineTo(slitX, cy + (i % 2 ? off : -off));
        ctx.lineTo(scrX, cy + i * half * .22);
        ctx.stroke();
      }
      ctx.restore();

      /* ── 스크린 ── */
      ctx.save();
      ctx.fillStyle = '#070b16';
      ctx.fillRect(scrX, cy - half - 20, w - scrX - 24, (half + 20) * 2);
      ctx.strokeStyle = 'rgba(147,162,196,.35)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(scrX, cy - half - 20, w - scrX - 24, (half + 20) * 2);
      ctx.restore();
      D.text(ctx, '스크린 — 점이 하나씩 쌓인다', scrX, cy - half - 28, { size: 10.5, color: '#93a2c4' });

      // 쌓인 점
      const sw = w - scrX - 24;
      ctx.save();
      st.dots.forEach(dt => {
        ctx.fillStyle = dt.o ? 'rgba(251,113,133,.85)' : 'rgba(167,139,250,.85)';
        ctx.fillRect(scrX + 4 + dt.j * (sw - 8), Y(dt.u), 2.1, 2.1);
      });
      ctx.restore();

      /* ── 세기 분포(막대) ── */
      const hx = scrX - 8;
      const mxb = Math.max.apply(null, st.bins) || 1;
      ctx.save();
      ctx.strokeStyle = C.vis; ctx.lineWidth = 1.8;
      if (hl === 'vis') { ctx.shadowColor = C.vis; ctx.shadowBlur = 10; }
      ctx.beginPath();
      for (let i = 0; i < NB; i++) {
        const u = (i + .5) / NB * 2 - 1;
        const x = hx - (st.bins[i] / mxb) * 56;
        i ? ctx.lineTo(x, Y(u)) : ctx.moveTo(x, Y(u));
      }
      ctx.stroke(); ctx.restore();
      D.text(ctx, '쌓인 분포', hx - 56, cy - half - 28, { size: 10, color: C.vis });

      /* ── 상태 표시 ── */
      const v = visOf(st);
      D.text(ctx, '쌓인 전자 ' + st.hits + '개', 24, h - 52, { size: 12, color: C.hit, bold: true });
      if (st.hits > 300) {
        D.text(ctx, '무늬 대비 V = ' + fmt(v, 2) + '  (예상 ' + fmt(1 - p.det / 100, 2) + ')',
          24, h - 34, { size: 11, color: hl === 'vis' ? '#fff' : C.vis, bold: hl === 'vis' });
      } else {
        D.text(ctx, '아직 점이 적어 무작위처럼 보입니다 — 더 쌓아 보세요', 24, h - 34, { size: 11, color: '#61719a' });
      }
      D.tag(ctx, p.det <= 5 ? '어느 쪽인지 묻지 않음 → 줄무늬'
        : p.det >= 95 ? '경로를 전부 알아냄 → 두 덩어리'
          : '일부만 알아냄 → 그만큼 흐려짐',
        w * .5, h - 16, p.det <= 5 ? '#34d399' : (p.det >= 95 ? '#fb7185' : '#fbbf24'), hl === 'det');
    }
  });
})();
