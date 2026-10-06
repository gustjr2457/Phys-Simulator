/* 초급·개념 — 엔트로피란 무엇인가? (거시세계)
   칸막이를 치우면 기체는 저절로 빈 공간까지 퍼지지만, 퍼진 기체가 저절로
   한쪽에 다시 모이는 일은 없다. '열이란 무엇인가?'에서 본 "왜 열은 항상
   뜨거운 쪽에서 차가운 쪽으로만 흐르는가"에 대한 진짜 답 — 흩어진 상태로
   가는 배치의 수가 압도적으로 많기 때문 — 를 입자 하나하나를 눈으로 보며
   느끼게 한다. 계산(ln Ω)은 '일반물리·열역학'의 통계적 엔트로피에서 다룬다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { N: '#60a5fa', v0: '#fbbf24', left: '#34d399' };
  const BOX = { x0: -30, x1: 30, y0: -16, y1: 16 };
  const R = 0.55;

  function makeParticles(N, v0) {
    const arr = [];
    for (let i = 0; i < N; i++) {
      const x = BOX.x0 + R + Math.random() * (Math.abs(BOX.x0) - 2 * R); // 왼쪽 절반에서만 시작
      const y = BOX.y0 + R + Math.random() * (BOX.y1 - BOX.y0 - 2 * R);
      const ang = Math.random() * Math.PI * 2;
      arr.push({ x, y, vx: Math.cos(ang) * v0, vy: Math.sin(ang) * v0 });
    }
    return arr;
  }

  PS.register({
    id: 'c-entropy', mode: 'concept', category: '거시세계',
    title: '엔트로피란 무엇인가?',
    sub: '흩어지는 쪽으로만 저절로 진행된다',
    tagline: '입자들이 처음엔 모두 왼쪽 칸에 모여 있습니다. 가운데 칸막이를 치우면 어떻게 될까요? 재생을 눌러 지켜보세요 — 입자들은 저절로 상자 전체로 퍼지지만, 아무리 오래 기다려도 저절로 다시 왼쪽에만 모이는 일은 일어나지 않습니다.',

    params: [
      { key: 'N', symbol: 'N', label: '입자 수', unit: '개', min: 20, max: 120, step: 10, value: 70, color: C.N, reset: true, dec: 0,
        where: '상자 안에 있는 <b>입자(기체 분자)의 개수</b>입니다. 개수가 많을수록 "저절로 다시 모이는" 우연이 더욱더 일어나기 힘들어집니다.' },
      { key: 'v0', symbol: 'v', label: '입자 속력', unit: '', min: 1, max: 4, step: .5, value: 2.5, color: C.v0, reset: true,
        where: '입자들이 <b>얼마나 빠르게 움직이는지</b>입니다(온도와 비슷한 역할). 빠를수록 상자 전체로 더 빨리 퍼집니다.' }
    ],
    vars: {
      left: { symbol: 'f_L', label: '왼쪽 칸에 있는 비율', unit: '', color: C.left,
        where: '전체 입자 중 <b>상자의 왼쪽 절반</b>에 있는 비율입니다. 처음엔 1(100%)이었다가, 시간이 지나면 <b>0.5 근처에서 계속 오르내릴 뿐</b> 다시 1로 돌아가지 않습니다.' }
    },
    formulas: [
      { name: '충분한 시간이 지나면', tpl: '{left} ≈ 0.5  (좌우 어디에나 고르게)' },
      { name: '거꾸로 가는 경우는?', tpl: '스스로 다시 한쪽에 모이는 모습 — 관찰된 적 없음' }
    ],

    init(p) {
      return { particles: makeParticles(p.N, p.v0), left: 1, mixed: false };
    },
    step(st, p, dt) {
      const b = BOX;
      st.particles.forEach(pt => {
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        // 벽에 부딪히면 방향을 무작위로 다시 정한다(확산 반사) — 입자끼리 충돌은 없지만
        // 이렇게 해야 특정 입자가 거의 수직으로만 움직이며 영원히 한쪽에 갇히는 일이 없다.
        let hit = false;
        if (pt.x < b.x0 + R) { pt.x = b.x0 + R; hit = 'L'; }
        else if (pt.x > b.x1 - R) { pt.x = b.x1 - R; hit = 'R'; }
        else if (pt.y < b.y0 + R) { pt.y = b.y0 + R; hit = 'B'; }
        else if (pt.y > b.y1 - R) { pt.y = b.y1 - R; hit = 'T'; }
        if (hit) {
          const ang = Math.random() * Math.PI * 2;
          let vx = Math.cos(ang) * p.v0, vy = Math.sin(ang) * p.v0;
          if (hit === 'L' && vx < 0) vx = -vx;
          if (hit === 'R' && vx > 0) vx = -vx;
          if (hit === 'B' && vy < 0) vy = -vy;
          if (hit === 'T' && vy > 0) vy = -vy;
          pt.vx = vx; pt.vy = vy;
        }
      });
      const nLeft = st.particles.reduce((a, pt) => a + (pt.x < 0 ? 1 : 0), 0);
      st.left = nLeft / st.particles.length;
      if (st.left < 0.7) st.mixed = true; // 한 번 충분히 섞였는지(상태 표시용)
    },

    graphs: [{
      title: '왼쪽 칸 비율 – 시간', xmin: 8, window: 12,
      series: [{ key: 'f', label: 'f_L (왼쪽 비율)', color: C.left }]
    }],
    sample(st, p) { return { f: st.left }; },

    readouts(st, p) {
      const pct = st.left * 100;
      const state = !st.mixed
        ? '아직 퍼지는 중'
        : (Math.abs(st.left - 0.5) < 0.15 ? '뒤섞인 상태 — 계속 이 근처에 머무름' : '뒤섞이는 중 (요동)');
      return [
        { label: '왼쪽 칸 비율', value: pct, unit: '%', dec: 1, color: C.left, wide: true },
        { label: '입자 수', value: p.N, unit: '개', dec: 0, color: C.N },
        { label: '상태', value: state, wide: true }
      ];
    },

    notes: [
      '입자들은 <b>스스로 상자 전체에 고르게 퍼집니다</b> — 아무도 밀어주지 않아도 저절로 일어납니다.',
      '반대로 상자 전체에 퍼진 입자들이 <b>저절로 다시 왼쪽 칸에만 모이는 일은 일어나지 않습니다</b>. 물리 법칙이 그것을 금지해서가 아니라, "고르게 퍼진 배치"가 "한쪽에만 모인 배치"보다 <b>압도적으로 경우의 수가 많기 때문</b>입니다.',
      '입자 수(N)를 늘려 보세요 — N이 클수록 "우연히 거의 다 왼쪽으로 돌아가는" 요동은 더욱더 일어나기 어려워집니다. 실제 기체는 입자가 10²³개 수준이라 사실상 절대 일어나지 않습니다.',
      '"경우의 수가 많은 쪽으로 저절로 진행된다"는 성질에 붙는 이름이 <b>엔트로피(무질서도)</b>입니다. 이 경우의 수를 직접 세어 계산하는 방법은 일반물리·열역학의 <b>통계적 엔트로피</b>에서 다룹니다.'
    ],
    presets: [
      { name: '적은 입자(요동이 잘 보임)', set: { N: 20, v0: 2 } },
      { name: '기본', set: { N: 70, v0: 2.5 } },
      { name: '많은 입자(요동이 거의 안 보임)', set: { N: 120, v0: 2.5 } },
      { name: '빠르게 퍼짐', set: { N: 70, v0: 4 } }
    ],

    challenges: [
      { id: 'ch-mixed', title: '골고루 섞기 (40~60%)',
        desc: '재생해서 기다린 뒤, 왼쪽 칸에 있는 입자 비율이 40%~60% 사이가 되게 만들어보세요.',
        check: ctx => Math.abs(ctx.st.left - 0.5) <= 0.1,
        hint: '입자 속력(v)을 높이면 더 빨리 섞입니다. 재생 후 충분히 기다려보세요.' },
      { id: 'ch-manyparticles', title: '입자 100개 이상으로',
        desc: '입자 수(N)를 100개 이상으로 늘려보세요 — 입자가 많을수록 "저절로 다시 모이는" 일은 더욱 일어나지 않습니다.',
        check: ctx => ctx.P.N >= 100,
        hint: 'N 슬라이더를 오른쪽 끝 근처로 옮겨보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, Object.assign({ pad: 24 }, BOX));

      // 상자
      D.line(ctx, V.X(BOX.x0), V.Y(BOX.y0), V.X(BOX.x1), V.Y(BOX.y0), { color: 'rgba(147,162,196,.55)', width: 2 });
      D.line(ctx, V.X(BOX.x0), V.Y(BOX.y1), V.X(BOX.x1), V.Y(BOX.y1), { color: 'rgba(147,162,196,.55)', width: 2 });
      D.line(ctx, V.X(BOX.x0), V.Y(BOX.y0), V.X(BOX.x0), V.Y(BOX.y1), { color: 'rgba(147,162,196,.55)', width: 2 });
      D.line(ctx, V.X(BOX.x1), V.Y(BOX.y0), V.X(BOX.x1), V.Y(BOX.y1), { color: 'rgba(147,162,196,.55)', width: 2 });

      // 원래 칸막이가 있던 자리(점선 — 지금은 실제 벽이 아님)
      D.line(ctx, V.X(0), V.Y(BOX.y0), V.X(0), V.Y(BOX.y1), { color: hl === 'left' ? C.left : 'rgba(147,162,196,.35)', width: hl === 'left' ? 2.4 : 1.4, dash: [6, 6] });
      D.text(ctx, '원래 칸막이가 있던 자리', V.X(0), V.Y(BOX.y1) - 12, { size: 10.5, color: '#61719a', align: 'center' });

      // 입자
      st.particles.forEach(pt => {
        D.dot(ctx, V.X(pt.x), V.Y(pt.y), Math.max(2.6, V.S(R) * .55), pt.x < 0 ? C.left : '#93a2c4', false);
      });

      // 왼쪽 비율 가로 막대(아래쪽)
      const barW = Math.min(220, w * .32), barX2 = w / 2 - barW / 2, barY2 = V.Y(BOX.y0) + 26;
      D.bar(ctx, barX2, barY2, barW, 14, st.left, 1, C.left, '왼쪽 칸 비율', hl === 'left');
      D.tag(ctx, fmt(st.left * 100, 0) + '%', barX2 + barW + 26, barY2 + 7, C.left, hl === 'left');
    }
  });
})();
