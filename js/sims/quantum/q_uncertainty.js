/* [양자역학] 불확정성 원리 — 좁게 만들수록 파장이 번진다 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { sk: '#fbbf24', k0: '#60a5fa', N: '#5eead4', dx: '#34d399', dp: '#f472b6', psi: '#60a5fa' };
  const HBAR = 1.054571817e-34;
  const XW = 10;                       // 위치 창: ±10 nm
  const NX = 300;

  // k(1/nm) 성분들과 가중치
  function comps(p) {
    const N = Math.round(p.N), out = [];
    if (N === 1) return [{ k: p.k0, w: 1 }];
    for (let i = 0; i < N; i++) {
      const k = p.k0 + p.sk * 2.5 * (2 * i / (N - 1) - 1);
      out.push({ k: k, w: Math.exp(-Math.pow((k - p.k0) / p.sk, 2) / 2) });
    }
    return out;
  }
  // 파속과 측정된 폭
  function packet(p) {
    const cs = comps(p);
    const wsum = cs.reduce((a, c) => a + c.w, 0);
    const psi = [], prob = [];
    let s0 = 0, s2 = 0;
    for (let i = 0; i <= NX; i++) {
      const x = -XW + 2 * XW * i / NX;
      let v = 0;
      cs.forEach(c => { v += c.w * Math.cos(c.k * x); });
      v /= wsum;
      psi.push(v);
      const pr = v * v;
      prob.push(pr); s0 += pr; s2 += pr * x * x;
    }
    const sx = Math.sqrt(s2 / Math.max(s0, 1e-12));                 // nm
    let kb = 0, kw = 0;
    cs.forEach(c => { const w2 = c.w * c.w; kb += c.k * w2; kw += w2; });
    kb /= kw;
    let sk2 = 0;
    cs.forEach(c => { const w2 = c.w * c.w; sk2 += w2 * Math.pow(c.k - kb, 2); });
    const sk = Math.sqrt(sk2 / kw);                                  // 1/nm
    return { cs: cs, psi: psi, prob: prob, sx: sx, sk: sk, kmax: Math.max.apply(null, prob) };
  }
  // Δx·Δp 를 ħ/2 단위로
  const ratio = r => (r.sx * 1e-9) * (HBAR * r.sk * 1e9) / (HBAR / 2);

  PS.register({
    id: 'q-uncertainty', mode: 'quantum', category: '파동이기에 생기는 일',
    title: '불확정성 원리',
    sub: 'Δx · Δp ≥ ħ/2',
    tagline: '위치를 좁히려면 여러 파장을 섞어야 하고, 파장을 하나로 맞추면 위치가 무한히 퍼집니다. 신비로운 규칙이 아니라 — 짧은 북소리에 여러 음이 섞이는 것과 똑같은, 모든 파동의 성질입니다.',

    params: [
      { key: 'sk', symbol: 'Δk', label: '섞는 파장의 범위', unit: '/nm', min: .15, max: 2.5, step: .05, value: .8, color: C.sk, dec: 2,
        where: '오른쪽 <b>운동량 막대그래프의 폭</b>입니다. 넓게 섞을수록 파속이 좁아지고(위치를 잘 알게 되고), 좁게 섞을수록 파속이 길게 퍼집니다. 이 하나가 불확정성의 전부입니다.' },
      { key: 'k0', symbol: 'k₀', label: '중심 파수', unit: '/nm', min: 2, max: 14, step: .5, value: 7, color: C.k0, dec: 1,
        where: '섞는 파장들의 <b>중심값</b>입니다. 운동량 p = ħk 이므로 이 값이 곧 평균 운동량입니다. 폭은 그대로 두고 중심만 옮겨도 불확정성은 변하지 않습니다.' },
      { key: 'N', symbol: 'N', label: '실제로 더하는 파동 수', unit: '개', min: 1, max: 25, step: 1, value: 15, color: C.N, dec: 0,
        where: '몇 개의 사인파를 <b>실제로 더할 것인가</b>입니다. 1개면 끝없이 이어지는 순수한 파동, 2~3개면 마디가 반복되는 맥놀이, 많이 더해야 비로소 <b>한 덩어리로 뭉친 파속</b>이 됩니다.' }
    ],
    vars: {
      dx: { symbol: 'Δx', label: '위치의 불확정성', unit: 'nm', color: C.dx,
        where: '아래 <b>초록색 가로 치수선</b> — 파속이 퍼져 있는 폭입니다. 전자가 "이 근처 어딘가"에 있다는 범위입니다.' },
      dp: { symbol: 'Δp', label: '운동량의 불확정성', unit: 'kg·m/s', color: C.dp,
        where: '오른쪽 <b>분홍색 세로 치수선</b> — 섞어 쓴 운동량의 폭입니다. p = ħk 로 파수 폭에서 바로 나옵니다.' },
      psi: { symbol: 'ψ', label: '파속 (더한 결과)', unit: '', color: C.psi,
        where: '가운데 <b>파란 곡선</b>입니다. 여러 사인파를 더하면 가운데서는 보강되고 양옆에서는 상쇄되어 한 덩어리로 뭉칩니다.' }
    },
    formulas: [
      { name: '하이젠베르크 불확정성 원리', tpl: '{dx} · {dp} ≥ ħ ⁄ 2' },
      { name: '운동량과 파수', tpl: '{dp} = ħ · {sk}' },
      { name: '파속 — 여러 파장의 합', tpl: '{psi}(x) = Σ A(k) cos(k x)' },
      { name: '가우시안일 때 등호 성립 (최소 불확정성)', tpl: '{dx} · {dp} = ħ ⁄ 2' }
    ],

    init() { return { ph: 0 }; },
    step(st, p, dt) { st.ph += dt * 1.6; },

    graphs: [{
      title: '섞는 범위 Δk – 위치 폭 Δx (반비례)', xKey: 'sk', xUnit: '/nm', xMin: .15, xMax: 2.5, y0: 0,
      series: [{ key: 'dx', label: 'Δx (nm)', color: C.dx }]
    }],
    sample(st, p) { const r = packet(p); return { sk: p.sk, dx: r.sx }; },

    readouts(st, p) {
      const r = packet(p), N = Math.round(p.N);
      const dp = HBAR * r.sk * 1e9;
      const rt = ratio(r);
      const pure = N === 1;
      return [
        { label: '위치 불확정성 Δx', value: pure ? '∞' : fmt(r.sx, 2), unit: pure ? '' : 'nm', color: C.dx },
        { label: '파수 폭 Δk', value: r.sk, unit: '/nm', color: C.sk, dec: 3 },
        { label: '운동량 불확정성 Δp', value: pure ? 0 : dp * 1e25, unit: '×10⁻²⁵ kg·m/s', color: C.dp, dec: 2 },
        { label: '중심 운동량 p₀ = ħk₀', value: HBAR * p.k0 * 1e9 * 1e25, unit: '×10⁻²⁵', dec: 2 },
        { label: '평균 파장 λ₀ = 2π/k₀', value: 2 * Math.PI / p.k0, unit: 'nm' },
        { label: '더하는 파동 수', value: N, unit: '개', color: C.N, dec: 0 },
        {
          label: 'Δx · Δp (ħ/2 를 1로 본 값)', wide: true,
          color: pure ? '#fb7185' : (rt < 1.25 ? '#34d399' : '#fbbf24'),
          value: pure ? '파장이 하나뿐 → 운동량은 완벽히 알지만 위치는 전혀 모름'
            : fmt(rt, 2) + ' × (ħ/2)' + (rt < 1.25 ? '  —  최소 불확정성에 가까움' : '')
        }
      ];
    },

    notes: [
      '<b>모든 파동의 성질입니다.</b> 북을 아주 짧게 치면 "퍽" 하고 여러 음이 섞여 들리고, 순수한 한 음을 내려면 길게 울려야 합니다. 불확정성은 이것과 똑같습니다.',
      '파동 수 N을 1로 두면 <b>끝없이 이어지는 사인파</b>가 됩니다 — 파장(운동량)은 완벽히 알지만 "어디 있는지"는 전혀 알 수 없습니다.',
      '반대로 위치를 좁히려면 <b>많은 파장을 섞어야</b> 하고, 그러면 운동량이 번집니다. 둘을 동시에 좁히는 방법은 없습니다.',
      '이것은 "측정 기술이 부족해서"가 아니라 <b>파동이라는 존재 방식 자체의 성질</b>입니다. 더 좋은 장비로도 뚫을 수 없습니다.',
      '가우시안 모양으로 섞을 때 딱 <b>ħ/2</b>로 등호가 성립합니다 — 자연이 허용하는 최소값입니다.'
    ],
    presets: [
      { name: '균형 잡힌 파속', set: { sk: .8, k0: 7, N: 15 } },
      { name: '위치를 좁히면 (Δk 크게)', set: { sk: 2.2, k0: 7, N: 25 } },
      { name: '운동량을 좁히면 (Δk 작게)', set: { sk: .2, k0: 7, N: 15 } },
      { name: '순수한 파동 하나 (N=1)', set: { sk: .8, k0: 7, N: 1 } },
      { name: '맥놀이 — 두 개만 더하기', set: { sk: 1.2, k0: 7, N: 2 } }
    ],
    challenges: [
      {
        id: 'minimum', title: '최소 불확정성에 닿기',
        desc: '파동을 15개 이상 더해서 Δx·Δp를 ħ/2의 1.2배 이하로 만들어 보세요.',
        hint: '많이 더할수록 가우시안에 가까워집니다. N을 크게 올려 보세요.',
        check: ({ P }) => Math.round(P.N) >= 15 && ratio(packet(P)) <= 1.2
      },
      {
        id: 'pure', title: '파장이 하나뿐이라면',
        desc: 'N을 1로 두고, 파동이 창 끝까지 끝없이 이어져 위치를 정할 수 없는 것을 확인하세요.',
        hint: '세 번째 슬라이더를 맨 왼쪽으로.',
        check: ({ P }) => Math.round(P.N) === 1
      },
      {
        id: 'narrow', title: '위치를 1 nm 안으로',
        desc: '섞는 범위를 넓혀서 Δx를 1 nm 이하로 좁혀 보세요. 대신 운동량이 얼마나 번지는지 보세요.',
        hint: 'Δx는 Δk에 반비례합니다. 첫 슬라이더를 오른쪽으로.',
        check: ({ P }) => Math.round(P.N) >= 5 && packet(P).sx <= 1
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const r = packet(p), N = Math.round(p.N);
      const pure = N === 1;

      /* ── 왼쪽: 위치 공간 ── */
      const px0 = 48, px1 = w * .60, cy = h * .42;
      const amp = Math.min(h * .17, 86);
      const X = xn => px0 + (xn + XW) / (2 * XW) * (px1 - px0);

      D.text(ctx, '위치 공간 — 전자는 어디에 있나', px0, 26, { size: 11.5, color: '#93a2c4' });
      D.line(ctx, px0, cy, px1, cy, { color: 'rgba(147,162,196,.25)', dash: [5, 5] });
      for (let xn = -10; xn <= 10; xn += 5) {
        D.line(ctx, X(xn), cy - 4, X(xn), cy + 4, { color: 'rgba(147,162,196,.35)' });
        D.text(ctx, xn + ' nm', X(xn), cy + 18, { size: 9, color: '#4a5878', align: 'center' });
      }

      // 더해지는 개별 파동 (앞의 몇 개만 희미하게)
      const show = Math.min(5, r.cs.length);
      ctx.save();
      ctx.globalAlpha = .30; ctx.lineWidth = 1;
      for (let j = 0; j < show; j++) {
        const c = r.cs[Math.floor(j * r.cs.length / show)];
        ctx.strokeStyle = hl === 'N' ? C.N : 'rgba(94,234,212,.7)';
        ctx.beginPath();
        for (let i = 0; i <= NX; i += 2) {
          const xn = -XW + 2 * XW * i / NX;
          const y = cy - amp * 1.52 - 10 + Math.cos(c.k * xn) * 7;
          i ? ctx.lineTo(X(xn), y) : ctx.moveTo(X(xn), y);
        }
        ctx.stroke();
      }
      ctx.restore();
      D.text(ctx, '더하는 파동들 (' + N + '개)', px0, cy - amp * 1.52 - 24,
        { size: 10, color: hl === 'N' ? '#fff' : C.N, bold: hl === 'N' });

      // |ψ|² 확률
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px0, cy + amp);
      for (let i = 0; i <= NX; i++) {
        const xn = -XW + 2 * XW * i / NX;
        ctx.lineTo(X(xn), cy + amp - (r.prob[i] / Math.max(r.kmax, 1e-9)) * amp * .9);
      }
      ctx.lineTo(px1, cy + amp); ctx.closePath();
      ctx.fillStyle = 'rgba(52,211,153,.20)'; ctx.fill();
      ctx.restore();
      D.text(ctx, '|ψ|² — 발견할 확률', px0 + 4, cy + amp - 6, { size: 10, color: 'rgba(52,211,153,.9)' });

      // 파속 ψ
      ctx.save();
      ctx.strokeStyle = C.psi; ctx.lineWidth = hl === 'psi' ? 3 : 2.2;
      if (hl === 'psi') { ctx.shadowColor = C.psi; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let i = 0; i <= NX; i++) {
        const xn = -XW + 2 * XW * i / NX;
        const y = cy - r.psi[i] * amp * Math.cos(st.ph) / Math.max(Math.abs(r.psi[NX / 2 | 0]), .3);
        i ? ctx.lineTo(X(xn), y) : ctx.moveTo(X(xn), y);
      }
      ctx.stroke(); ctx.restore();

      // Δx 치수선
      if (!pure) {
        const yD = cy + amp + 34;
        D.dim(ctx, X(-r.sx), yD, X(r.sx), yD, 'Δx = ' + fmt(r.sx, 2) + ' nm', C.dx, hl === 'dx');
      } else {
        D.tag(ctx, 'Δx = ∞ — 창 밖까지 끝없이 이어집니다', (px0 + px1) / 2, cy + amp + 34, '#fb7185', true);
      }

      /* ── 오른쪽: 운동량 공간 ── */
      const qx0 = w * .68, qx1 = w - 36, qyB = h * .68, qyT = h * .18;
      D.text(ctx, '운동량 공간 — 어떤 파장을 썼나', qx0, 26, { size: 11.5, color: '#93a2c4' });
      D.line(ctx, qx0, qyB, qx1, qyB, { color: 'rgba(147,162,196,.4)', width: 1.5 });
      const kLo = Math.max(0, p.k0 - 7), kHi = p.k0 + 7;
      const K = kk => qx0 + (kk - kLo) / (kHi - kLo) * (qx1 - qx0);
      for (let kk = Math.ceil(kLo / 4) * 4; kk <= kHi; kk += 4) {
        D.line(ctx, K(kk), qyB, K(kk), qyB + 5, { color: 'rgba(147,162,196,.35)' });
        D.text(ctx, kk + '', K(kk), qyB + 18, { size: 9, color: '#4a5878', align: 'center' });
      }
      D.text(ctx, 'k (1/nm)', qx1, qyB + 32, { size: 9.5, color: '#4a5878', align: 'right' });

      // 성분 막대
      const bw = Math.max(2, (qx1 - qx0) / 40);
      r.cs.forEach(c => {
        const x = K(c.k), hh = c.w * (qyB - qyT);
        ctx.save();
        if (hl === 'sk') { ctx.shadowColor = C.sk; ctx.shadowBlur = 10; }
        ctx.fillStyle = C.sk; ctx.globalAlpha = .55 + .45 * c.w;
        ctx.fillRect(x - bw / 2, qyB - hh, bw, hh);
        ctx.restore();
      });
      // 중심 k₀
      D.line(ctx, K(p.k0), qyT - 10, K(p.k0), qyB, { color: C.k0, dash: [4, 4], width: hl === 'k0' ? 2.2 : 1.4, hot: hl === 'k0' });
      D.text(ctx, 'k₀', K(p.k0), qyT - 16, { size: 10, color: C.k0, align: 'center', bold: hl === 'k0' });

      // Δp 치수선
      if (!pure) {
        const yD = qyB - (qyB - qyT) * .42;
        D.dim(ctx, K(p.k0 - r.sk), yD, K(p.k0 + r.sk), yD,
          'Δp = ħ·Δk', C.dp, hl === 'dp' || hl === 'sk');
      }

      /* ── 아래: Δx·Δp 저울 ── */
      const rt = ratio(r);
      const sx0 = w * .08, sw = w * .5, sy = h - 44;
      D.text(ctx, 'Δx · Δp', sx0, sy - 10, { size: 11, color: '#93a2c4' });
      D.roundRect(ctx, sx0, sy, sw, 13, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const lim = sx0 + sw * (1 / 3);                      // ħ/2 지점을 1/3 위치에
      ctx.save();
      ctx.fillStyle = pure ? '#fb7185' : (rt < 1.25 ? '#34d399' : '#fbbf24');
      D.roundRect(ctx, sx0, sy, clamp(sw * (rt / 3), 3, sw), 13, 5); ctx.fill();
      ctx.restore();
      D.line(ctx, lim, sy - 6, lim, sy + 19, { color: '#fff', width: 2 });
      D.text(ctx, 'ħ/2 — 이보다 작아질 수 없음', lim + 6, sy - 10, { size: 10, color: '#fff' });
      D.text(ctx, pure ? '측정 불가' : fmt(rt, 2) + ' × ħ/2', sx0 + sw + 10, sy + 12,
        { size: 12, color: pure ? '#fb7185' : '#e8eefc', bold: true });
    }
  });
})();
