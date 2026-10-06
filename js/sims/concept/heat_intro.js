/* 초급·개념 — 열이란 무엇인가? (거시세계)
   열은 그 자체로 물질이 아니라 "이동 중인 에너지"이고, 항상 뜨거운 쪽에서
   차가운 쪽으로만 흐른다는 것, 그리고 결국 같은 온도(열평형)에 이른다는 것을
   계산 없이 보여준다. '입자란 무엇인가?'(온도 = 입자 운동의 활발함)의 다음 단계이며,
   뒤에 나오는 '엔트로피란 무엇인가?'로 바로 이어진다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { T1: '#fb7185', T2: '#60a5fa', k: '#fbbf24' };

  function colorOfT(t) {
    const f = clamp((t - 0) / 100, 0, 1);
    const c1 = [96, 165, 250], c2 = [251, 113, 133];
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * f);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * f);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * f);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  PS.register({
    id: 'c-heat', mode: 'concept', category: '거시세계',
    title: '열이란 무엇인가?',
    sub: '항상 뜨거운 곳에서 차가운 곳으로만 흐른다',
    tagline: '뜨거운 블록과 차가운 블록을 붙여 두면, 열(에너지)이 뜨거운 쪽에서 차가운 쪽으로 흘러 결국 같은 온도가 됩니다. 이 흐름은 저절로 반대로 가지 않습니다 — 차가운 쪽이 알아서 더 차가워지고 뜨거운 쪽이 더 뜨거워지는 일은 없습니다.',

    params: [
      { key: 'T1', symbol: 'T₁', label: '블록 A의 처음 온도', unit: '°', min: 10, max: 100, step: 1, value: 90, color: C.T1, reset: true, dec: 0,
        where: '<b>왼쪽(빨간) 블록</b>이 시작할 때의 온도입니다.' },
      { key: 'T2', symbol: 'T₂', label: '블록 B의 처음 온도', unit: '°', min: 10, max: 100, step: 1, value: 20, color: C.T2, reset: true, dec: 0,
        where: '<b>오른쪽(파란) 블록</b>이 시작할 때의 온도입니다.' },
      { key: 'k', symbol: 'k', label: '맞닿은 정도(열전달 빠르기)', unit: '', min: .1, max: 3, step: .1, value: 1, color: C.k,
        where: '두 블록이 <b>얼마나 잘 붙어 있는지</b>입니다. 클수록(꽉 붙어 있을수록) 열이 더 빨리 옮겨가 금방 같은 온도가 됩니다.' }
    ],
    vars: {},
    formulas: [
      { name: '열은 항상 이 방향으로만', tpl: '{T1} → {T2}  (뜨거운 쪽 → 차가운 쪽)' },
      { name: '결국 도달하는 곳', tpl: '{T1} = {T2}  (열평형)' }
    ],

    init(p) { return { a: p.T1, b: p.T2 }; },
    step(st, p, dt) {
      const flow = p.k * (st.a - st.b) * 0.6;
      st.a -= flow * dt;
      st.b += flow * dt;
    },

    graphs: [{
      title: '온도 – 시간', xmin: 6, window: 10,
      series: [{ key: 'a', label: 'T₁ (A)', color: C.T1 }, { key: 'b', label: 'T₂ (B)', color: C.T2 }]
    }],
    sample(st, p) { return { a: st.a, b: st.b }; },

    readouts(st, p) {
      const diff = Math.abs(st.a - st.b);
      return [
        { label: '블록 A 온도', value: st.a, unit: '°', dec: 1, color: C.T1 },
        { label: '블록 B 온도', value: st.b, unit: '°', dec: 1, color: C.T2 },
        { label: '온도 차이', value: diff, unit: '°', dec: 2, color: C.k, wide: true },
        { label: '상태', value: diff < 0.3 ? '열평형에 도달함(같은 온도)' : (st.a > st.b ? 'A → B로 열이 흐르는 중' : 'B → A로 열이 흐르는 중'), wide: true }
      ];
    },

    notes: [
      '열은 <b>항상 뜨거운 것에서 차가운 것으로</b>만 흐릅니다. 반대로 흐르는 것을 저절로 본 적은 없을 겁니다.',
      '두 블록의 온도를 더한 총량(정확히는 총 에너지)은 <b>변하지 않습니다</b> — 열은 사라지는 게 아니라 옮겨갈 뿐입니다.',
      '결국 두 블록은 <b>같은 온도(열평형)</b>에서 멈춥니다. 그 뒤로는 더 이상 열이 흐르지 않습니다.',
      '"왜 반대로는 절대 안 흐르는가?"에 대한 답은 다음 시뮬레이션 <b>엔트로피란 무엇인가?</b>에서 다룹니다.'
    ],
    presets: [
      { name: '뜨거운 커피 + 차가운 물', set: { T1: 90, T2: 20, k: 1 } },
      { name: '살짝 다른 온도', set: { T1: 45, T2: 35, k: 1 } },
      { name: '천천히 전달(얇게 닿음)', set: { T1: 90, T2: 20, k: .2 } },
      { name: '빠르게 전달(꽉 붙임)', set: { T1: 90, T2: 20, k: 3 } }
    ],

    challenges: [
      { id: 'ch-bigdiff', title: '온도차 80도 이상으로 시작하기',
        desc: '두 블록의 시작 온도(T₁, T₂) 차이가 80도 이상 나게 만들어보세요.',
        check: ctx => Math.abs(ctx.P.T1 - ctx.P.T2) >= 80,
        hint: 'T₁은 최대한 높게(예: 100), T₂는 최대한 낮게(예: 10) 맞춰보세요.' },
      { id: 'ch-fastequil', title: '2초 안에 열평형 만들기',
        desc: '열전달 빠르기(k)를 높여서, 재생 후 2초 안에 온도차가 1도 미만(열평형)이 되게 만들어보세요.',
        check: ctx => {
          const st = ctx.st;
          if (st.__eqT === undefined && Math.abs(st.a - st.b) < 1) st.__eqT = ctx.t;
          return st.__eqT !== undefined && st.__eqT <= 2;
        },
        hint: 'k를 2 이상으로 올리고 재생해서 지켜보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cy = h / 2, bw = Math.min(220, w * .28), bh = 200;
      const ax = w / 2 - bw - 6, bx = w / 2 + 6;

      [['A', ax, st.a, C.T1, 'T1'], ['B', bx, st.b, C.T2, 'T2']].forEach(([label, x, t, baseCol, key]) => {
        const col = colorOfT(t);
        ctx.save();
        if (hl === key) { ctx.shadowColor = col; ctx.shadowBlur = 22; }
        D.roundRect(ctx, x, cy - bh / 2, bw, bh, 10);
        ctx.fillStyle = col; ctx.fill();
        ctx.restore();
        D.text(ctx, '블록 ' + label, x + bw / 2, cy - bh / 2 - 14, { size: 13, color: '#e8eefc', align: 'center', bold: true });
        D.text(ctx, fmt(t, 1) + '°', x + bw / 2, cy + 8, { size: 26, color: '#08101f', align: 'center', bold: true });
      });

      // 접촉면 + 흐름 화살표
      const midx = w / 2;
      D.line(ctx, midx, cy - bh / 2 - 4, midx, cy + bh / 2 + 4, { color: 'rgba(255,255,255,.5)', width: 3 });
      const diff = st.a - st.b;
      if (Math.abs(diff) > .3) {
        const dir = diff > 0 ? 1 : -1;
        D.arrow(ctx, midx - dir * 46, cy - bh / 2 - 34, dir * 70, 0, { color: C.k, width: 4, hot: hl === 'k', label: '열 흐름' });
      } else {
        D.tag(ctx, '열평형 — 더 이상 흐르지 않음', midx, cy - bh / 2 - 34, '#34d399', true);
      }
    }
  });
})();
