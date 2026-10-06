/* [고등물리 · 물리학Ⅰ] 빛의 굴절과 전반사 — n₁sinθ₁ = n₂sinθ₂ */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { n1: '#60a5fa', n2: '#34d399', t1: '#fbbf24', t2: '#f472b6', tc: '#fb7185' };
  const D2R = Math.PI / 180;

  PS.register({
    id: 'refraction',
    mode: 'basic',
    category: '파동과 정보통신',
    title: '빛의 굴절과 전반사',
    sub: 'n₁sinθ₁ = n₂sinθ₂',
    tagline: '입사각을 키워 보세요. 굴절률이 큰 매질(n₁)에서 작은 매질(n₂)로 나갈 때, 어느 각도를 넘으면 빛이 아예 못 나가고 전부 반사됩니다 — 이게 광섬유가 빛을 가두는 원리입니다.',

    params: [
      { key: 'n1', symbol: 'n₁', label: '입사 매질의 굴절률', unit: '', min: 1.0, max: 2.6, step: .01, value: 1.5, color: C.n1, dec: 2,
        where: '빛이 <b>출발하는 매질</b>(아래쪽, 파란 영역)입니다. 클수록 그 매질 속에서 빛이 더 많이 꺾입니다. 진공·공기=1.0, 물=1.33, 유리=1.5, 다이아몬드=2.42.' },
      { key: 'n2', symbol: 'n₂', label: '도착 매질의 굴절률', unit: '', min: 1.0, max: 2.6, step: .01, value: 1.0, color: C.n2, dec: 2,
        where: '빛이 <b>들어가는 매질</b>(위쪽, 초록 영역)입니다. n₁보다 작을 때만 전반사가 일어날 수 있습니다.' },
      { key: 'theta1', symbol: 'θ₁', label: '입사각', unit: '°', min: 0, max: 89, step: 1, value: 20, color: C.t1, dec: 0,
        where: '경계면의 <b>수직선(법선)</b>과 입사광선 사이의 각도입니다. 이 각도를 키우면서 전반사가 시작되는 순간을 찾아보세요.' }
    ],
    vars: {
      t2: { symbol: 'θ₂', label: '굴절각', unit: '°', color: C.t2,
        where: '법선과 <b>굴절광선</b> 사이의 각도입니다. n₁ > n₂이면 θ₂가 항상 θ₁보다 커서, 빛이 경계면에 더 가깝게(눕듯이) 꺾여 나갑니다.' },
      tc: { symbol: 'θ_c', label: '임계각', unit: '°', color: C.tc,
        where: '이 각도를 <b>넘는 순간부터 빛이 전혀 빠져나가지 못하고 전부 반사</b>됩니다(전반사). n₁ > n₂일 때만 존재합니다.' }
    },
    formulas: [
      { name: '스넬의 법칙(굴절의 법칙)', tpl: '{n1}sin{theta1} = {n2}sin{t2}' },
      { name: '전반사가 시작되는 각도', tpl: 'sin{tc} = {n2} ⁄ {n1}   (n₁ > n₂일 때만)' }
    ],

    init(p) { return {}; },
    step(st, p, dt) {},

    readouts(st, p) {
      const t1 = p.theta1 * D2R;
      const hasCrit = p.n1 > p.n2;
      const thetaC = hasCrit ? Math.asin(clamp(p.n2 / p.n1, 0, 1)) / D2R : null;
      const sinT2 = p.n1 * Math.sin(t1) / p.n2;
      const tir = sinT2 > 1;
      return [
        { label: '임계각 θ_c', value: hasCrit ? fmt(thetaC, 1) + '°' : '없음(n₁ ≤ n₂)', color: C.tc, wide: true },
        { label: '굴절각 θ₂', value: tir ? '—(전반사)' : fmt(Math.asin(sinT2) / D2R, 1) + '°', color: C.t2, wide: true },
        { label: '상태', value: tir ? '전반사 (빛이 못 나감)' : '굴절해서 통과', color: tir ? C.tc : C.n2, wide: true }
      ];
    },

    notes: [
      '빛이 <b>굴절률이 큰 매질 → 작은 매질</b>로 나갈 때만 전반사가 일어날 수 있습니다(예: 물→공기, 유리→공기).',
      '입사각이 <b>임계각보다 작으면</b> 늘 조금은 굴절해서 빠져나가고, <b>임계각을 넘으면</b> 100% 반사되어 하나도 못 나갑니다.',
      '광섬유(광통신 케이블)는 유리 속에서 빛이 계속 전반사를 반복하며 <b>거의 손실 없이</b> 먼 거리를 이동하게 만든 것입니다.',
      '다이아몬드가 유난히 반짝이는 이유도 굴절률이 매우 커서(2.42) <b>임계각이 아주 작기 때문</b>입니다 — 웬만한 각도에서는 다 전반사됩니다.'
    ],
    presets: [
      { name: '유리 → 공기 (임계각 41.8°)', set: { n1: 1.5, n2: 1.0, theta1: 30 } },
      { name: '유리 → 공기, 전반사!', set: { n1: 1.5, n2: 1.0, theta1: 55 } },
      { name: '물 → 공기 (임계각 48.8°)', set: { n1: 1.33, n2: 1.0, theta1: 40 } },
      { name: '다이아몬드 → 공기(임계각 24.4°)', set: { n1: 2.42, n2: 1.0, theta1: 30 } },
      { name: '공기 → 물(들어갈 때는 항상 통과)', set: { n1: 1.0, n2: 1.33, theta1: 50 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, { x0: -4, x1: 4, y0: -3, y1: 3, pad: 24 });
      const t1 = p.theta1 * D2R;
      const hasCrit = p.n1 > p.n2;
      const sinT2 = p.n1 * Math.sin(t1) / p.n2;
      const tir = sinT2 > 1;
      const ox = V.X(0), oy = V.Y(0);
      const L = V.S(3.4);

      // 매질 배경(위: n2, 아래: n1)
      ctx.save();
      ctx.fillStyle = 'rgba(52,211,153,.08)'; ctx.fillRect(0, 0, w, oy);
      ctx.fillStyle = 'rgba(96,165,250,.08)'; ctx.fillRect(0, oy, w, h - oy);
      ctx.restore();
      D.line(ctx, 0, oy, w, oy, { color: 'rgba(147,162,196,.5)', width: 2 });
      D.text(ctx, 'n₂ = ' + fmt(p.n2, 2), 14, oy - 14, { size: 12, color: hl === 'n2' ? '#fff' : C.n2, bold: hl === 'n2' });
      D.text(ctx, 'n₁ = ' + fmt(p.n1, 2), 14, oy + 20, { size: 12, color: hl === 'n1' ? '#fff' : C.n1, bold: hl === 'n1' });

      // 법선(수직 점선)
      D.line(ctx, ox, oy - V.S(2.8), ox, oy + V.S(2.8), { color: 'rgba(255,255,255,.25)', dash: [4, 5] });

      // 입사 광선(아래에서 경계면으로)
      const ix = ox - L * Math.sin(t1), iy = oy + L * Math.cos(t1);
      D.arrow(ctx, ix, iy, ox - ix, oy - iy, { color: C.t1, width: 3, hot: hl === 'theta1', label: '입사광' });

      if (tir) {
        // 전반사: 같은 매질 안에서 반사
        const rx = ox - L * Math.sin(t1), ry = oy - L * Math.cos(t1);
        D.arrow(ctx, ox, oy, rx - ox, ry - oy, { color: C.tc, width: 3.5, hot: true, label: '전반사!' });
        D.tag(ctx, '전반사 — 빛이 못 나갑니다', ox, oy - V.S(2.4), C.tc, true);
      } else {
        const t2 = Math.asin(sinT2);
        const rx = ox + L * Math.sin(t2), ry = oy - L * Math.cos(t2);
        D.arrow(ctx, ox, oy, rx - ox, ry - oy, { color: C.t2, width: 3, hot: hl === 't2', label: '굴절광' });
        // 살짝 반사되는 성분도 항상 존재함을 옅게 표시
        const rrx = ox - L * .35 * Math.sin(t1), rry = oy - L * .35 * Math.cos(t1);
        D.arrow(ctx, ox, oy, rrx - ox, rry - oy, { color: 'rgba(255,255,255,.35)', width: 1.5, head: 7, label: '' });
      }

      // 각도 호 표시
      ctx.save();
      ctx.strokeStyle = C.t1; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ox, oy, 34, Math.PI / 2, Math.PI / 2 + t1); ctx.stroke();
      ctx.restore();
      D.text(ctx, 'θ₁=' + fmt(p.theta1, 0) + '°', ox - 50, oy + 46, { size: 11, color: C.t1 });

      if (hasCrit) {
        const thetaC = Math.asin(clamp(p.n2 / p.n1, 0, 1));
        D.text(ctx, '임계각 θ_c = ' + fmt(thetaC / D2R, 1) + '°', ox + 60, oy - V.S(2.6),
          { size: 12, color: hl === 'tc' ? '#fff' : C.tc, bold: hl === 'tc' });
      } else {
        D.text(ctx, '이 방향(n₁ ≤ n₂)은 전반사가 없습니다', ox + 60, oy - V.S(2.6), { size: 11, color: '#61719a' });
      }
    }
  });
})();
