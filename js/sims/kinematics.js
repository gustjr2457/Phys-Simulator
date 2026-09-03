/* 등가속도 직선 운동 — v = v₀ + at,  s = v₀t + ½at² */
(function () {
  const D = PS.D, fmt = PS.fmt;
  const C = { v0: '#a78bfa', a: '#fbbf24', t: '#94a3b8', v: '#60a5fa', s: '#34d399' };

  function car(ctx, x, y, w, h, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    D.roundRect(ctx, x - w / 2, y - h, w, h * .62, 5);
    ctx.fillStyle = color; ctx.fill();
    D.roundRect(ctx, x - w * .28, y - h * 1.34, w * .56, h * .5, 4);
    ctx.fillStyle = color; ctx.globalAlpha *= .75; ctx.fill();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.fillStyle = '#0a1120';
    [-w * .28, w * .28].forEach(dx => {
      ctx.beginPath(); ctx.arc(x + dx, y - h * .38 + h * .38, h * .2, 0, 7); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.restore();
  }

  PS.register({
    id: 'kinematics',
    category: '역학과 에너지',
    title: '등가속도 직선 운동',
    sub: 'v = v₀ + at',
    tagline: '초기 속도와 가속도를 바꾸면 1초마다 찍히는 자취의 간격이 어떻게 달라지는지 확인해 보세요.',

    params: [
      { key: 'v0', symbol: 'v₀', label: '초기 속도', unit: 'm/s', min: -10, max: 20, step: .5, value: 4, color: C.v0, reset: true,
        where: '출발선에 그려진 <b>보라색 화살표</b>의 길이입니다. 출발하는 순간(t = 0)의 속도이므로, 값을 바꾸면 처음부터 다시 출발합니다.' },
      { key: 'a', symbol: 'a', label: '가속도', unit: 'm/s²', min: -6, max: 6, step: .5, value: 2, color: C.a, reset: true,
        where: '수레 <b>아래쪽 주황색 화살표</b>입니다. 1초마다 속도를 이만큼 바꿔 주기 때문에, 위쪽 파란 화살표가 매초 이만큼씩 자랍니다. 음수면 화살표가 반대로 향하고 수레는 느려집니다.' }
    ],
    vars: {
      t: { symbol: 't', label: '시간', unit: 's', color: C.t,
        where: '바닥에 <b>1초 간격으로 남는 잔상</b>이 곧 시간입니다. 잔상 사이의 간격이 점점 벌어지면 속도가 커지고 있다는 뜻입니다.' },
      v: { symbol: 'v', label: 't초일 때의 속도', unit: 'm/s', color: C.v,
        where: '수레 <b>위쪽 파란색 화살표</b>입니다. 화살표가 길수록 빠릅니다.' },
      s: { symbol: 's', label: '변위', unit: 'm', color: C.s,
        where: '출발선에서 수레까지 이어진 <b>초록색 치수선</b>입니다. v-t 그래프에서 그래프 아래 넓이와 같습니다.' }
    },
    formulas: [
      { name: '속도', tpl: '{v} = {v0} + {a}{t}' },
      { name: '변위', tpl: '{s} = {v0}{t} + ½{a}{t}²' },
      { name: '시간을 모를 때', tpl: '2{a}{s} = {v}² − {v0}²' }
    ],

    init(p) { return { x: 0, v: p.v0, marks: [], nextMark: 1, done: false }; },

    step(st, p, dt) {
      const T = st.t + dt;
      st.v = p.v0 + p.a * T;
      st.x = p.v0 * T + .5 * p.a * T * T;
      if (T >= st.nextMark) { st.marks.push({ x: st.x, n: st.nextMark }); st.nextMark++; }
      if (T > 14 || st.x > 120 || st.x < -40) st.done = true;
    },

    graphs: [
      { title: '속도 – 시간', series: [{ key: 'v', label: 'v (m/s)', color: C.v }], xmin: 6 },
      { title: '변위 – 시간', series: [{ key: 'x', label: 's (m)', color: C.s }], xmin: 6 }
    ],
    sample(st) { return { v: st.v, x: st.x }; },

    readouts(st, p) {
      return [
        { label: '현재 속도 v', value: st.v, unit: 'm/s', color: C.v },
        { label: '변위 s', value: st.x, unit: 'm', color: C.s },
        { label: '평균 속도 s/t', value: st.t > 0 ? st.x / st.t : p.v0, unit: 'm/s' },
        { label: '(v₀+v)/2', value: (p.v0 + st.v) / 2, unit: 'm/s' },
        { label: '검산  v² − v₀² = 2as', wide: true, color: C.a,
          value: fmt(st.v * st.v - p.v0 * p.v0, 1) + '  =  ' + fmt(2 * p.a * st.x, 1) }
      ];
    },

    notes: [
      '<b>가속도</b>는 "속도가 변하는 빠르기"입니다. a = 0이면 화살표 길이가 그대로 → 등속도 운동.',
      '1초 간격 잔상이 <b>일정</b>하면 등속도, <b>점점 넓어지면</b> 가속, <b>좁아지면</b> 감속입니다.',
      'v-t 그래프의 <b>기울기 = 가속도</b>, <b>그래프 아래 넓이 = 변위</b>입니다.',
      'v₀와 a의 부호가 반대이면 수레는 멈췄다가 되돌아옵니다. (a = −6으로 두고 확인!)'
    ],
    presets: [
      { name: '정지 상태에서 출발', set: { v0: 0, a: 2 } },
      { name: '등속도 운동 (a=0)', set: { v0: 8, a: 0 } },
      { name: '던져 올린 물체처럼', set: { v0: 12, a: -4 } },
      { name: '급제동', set: { v0: 16, a: -6 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const xmax = Math.max(26, st.x + 8, 6);
      const xmin = Math.min(-2, st.x - 4);
      const k = (w - 90) / (xmax - xmin);
      const X = x => 60 + (x - xmin) * k;
      const gy = h * .68;

      // 눈금자
      ctx.save();
      const tick = xmax - xmin > 60 ? 20 : (xmax - xmin > 30 ? 10 : 5);
      for (let m = Math.ceil(xmin / tick) * tick; m <= xmax; m += tick) {
        D.line(ctx, X(m), gy, X(m), gy + 7, { color: 'rgba(147,162,196,.3)' });
        D.text(ctx, m + ' m', X(m), gy + 20, { size: 10, color: '#61719a', align: 'center' });
      }
      ctx.restore();
      D.ground(ctx, 20, w - 20, gy, 0);

      // 1초 간격 잔상 (시간의 시각화)
      const hotT = hl === 't';
      st.marks.forEach(m => {
        car(ctx, X(m.x), gy, 46, 26, '#3b4a6b', hotT ? .85 : .45);
        D.line(ctx, X(m.x), gy, X(m.x), gy - 46, { color: hotT ? C.t : 'rgba(147,162,196,.25)', dash: [3, 4] });
        D.text(ctx, m.n + 's', X(m.x), gy - 52, { size: 10, color: hotT ? C.t : '#3f4d6e', align: 'center', bold: hotT });
      });

      // 출발선 + 초기 속도
      D.line(ctx, X(0), gy + 6, X(0), gy - 92, { color: C.v0, width: 2, dash: [5, 5], hot: hl === 'v0' });
      D.text(ctx, '출발', X(0), gy - 98, { size: 11, color: C.v0, align: 'center' });
      D.arrow(ctx, X(0), gy - 70, Math.max(-160, Math.min(160, p.v0 * 7)), 0,
        { color: C.v0, width: 3, hot: hl === 'v0', label: 'v₀ = ' + fmt(p.v0, 1) + ' m/s' });

      // 변위 치수선
      D.dim(ctx, X(0), gy + 34, X(st.x), gy + 34, 's = ' + fmt(st.x, 1) + ' m', C.s, hl === 's');

      // 수레
      const cx = X(st.x);
      car(ctx, cx, gy, 52, 30, hl === 'v' ? '#7ab6ff' : '#4d7fc7');

      // 속도 화살표 (위)
      D.arrow(ctx, cx, gy - 54, PS.clamp(st.v * 7, -230, 230), 0,
        { color: C.v, width: 4, hot: hl === 'v', label: 'v = ' + fmt(st.v, 1) + ' m/s' });
      // 가속도 화살표 (아래)
      if (Math.abs(p.a) > .01) {
        D.arrow(ctx, cx, gy - 12, PS.clamp(p.a * 16, -180, 180), 0,
          { color: C.a, width: 4, hot: hl === 'a', label: 'a = ' + fmt(p.a, 1) + ' m/s²', ly: 20 });
      } else {
        D.tag(ctx, 'a = 0 (등속도)', cx, gy - 12, C.a, hl === 'a');
      }

      if (st.done) D.tag(ctx, '측정 종료 — ↺ 처음으로', w / 2, 26, '#fbbf24', true);
    }
  });
})();
