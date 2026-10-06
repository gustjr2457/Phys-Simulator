/* 초급·개념 — 입자란 무엇인가? (미시세계)
   모든 물질은 눈에 보이지 않는 작은 알갱이(입자)로 이루어져 있고,
   그 알갱이가 "얼마나 활발히 움직이는가"가 곧 온도라는 것,
   그리고 그 활발함의 정도에 따라 고체·액체·기체가 갈린다는 것을 보여준다.
   실제 분자간 힘을 정밀히 계산하지는 않는 단순화된 개념 모델이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { T: '#fb7185', vavg: '#34d399', box: '#93a2c4' };
  const X0 = 0, X1 = 8, Y0 = 0, Y1 = 6;
  const R = 0.16;          // 입자 반지름(m)
  const AG = 3.0;          // 중력 가속도(단순화)
  const DAMP = 1.0;        // 속도 감쇠
  const NOISE = 5.5;       // 열운동 잡음 세기
  const MELT = 1.0, BOIL = 2.3;

  function phaseOf(T) { return T < MELT ? 'solid' : (T < BOIL ? 'liquid' : 'gas'); }
  function phaseLabel(ph) { return ph === 'solid' ? '고체' : (ph === 'liquid' ? '액체' : '기체'); }

  function speedColor(s) {
    const t = clamp(s / 3.2, 0, 1);
    const c1 = [96, 165, 250], c2 = [251, 113, 133];
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  PS.register({
    id: 'c-particle', mode: 'concept', category: '물질의 구성',
    title: '입자란 무엇인가?',
    sub: '모든 물질은 끊임없이 움직이는 작은 알갱이로 되어 있다',
    tagline: '눈에는 안 보이지만, 물질은 전부 작은 알갱이(입자)의 집합입니다. 온도 슬라이더를 올려서 알갱이들이 점점 더 활발히 움직이며 고체 → 액체 → 기체로 바뀌는 걸 보세요.',

    params: [
      { key: 'T', symbol: 'T', label: '온도', unit: '', min: 0.15, max: 3.5, step: .05, value: 0.5, color: C.T,
        where: '입자가 <b>얼마나 활발하게 움직이는지</b>를 나타내는 값입니다. 온도가 오른다는 것은 곧 입자의 평균 운동이 빨라진다는 뜻입니다.' }
    ],
    vars: {
      vavg: { symbol: '⟨v⟩', label: '평균 속력', unit: '', color: C.vavg,
        where: '입자들이 <b>평균적으로 얼마나 빨리</b> 움직이는지입니다. 화면에서 붉을수록 빠르고 파랄수록 느린 입자입니다.' }
    },
    formulas: [
      { name: '온도의 정체', tpl: '{T} ↑  →  입자의 {vavg} ↑' }
    ],

    init(p) {
      const parts = [];
      const cols = 7, rows = 4;
      const x0 = 2.15, y0 = 0.55, dx = 0.62, dy = 0.62;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const hx = x0 + i * dx, hy = y0 + j * dy;
          parts.push({ x: hx, y: hy, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, hx, hy });
        }
      }
      return { parts, t: 0 };
    },

    step(st, p, dt) {
      const ph = phaseOf(p.T);
      const k = ph === 'solid' ? 140 : (ph === 'liquid' ? 5 : 0);
      const homeRelax = ph === 'liquid' ? 1.2 : 0;
      const sqDt = Math.sqrt(dt);
      const noiseAmp = NOISE * Math.sqrt(p.T);
      st.parts.forEach(q => {
        // 스프링(구조를 유지하려는 힘) + 중력(y방향)
        const ax = -k * (q.x - q.hx);
        const ay = -k * (q.y - q.hy) - AG;
        // 감쇠 후 열잡음(무작위 요동)을 속도에 더한다 — 온도가 높을수록 요동이 커짐
        q.vx = (q.vx + ax * dt) * Math.exp(-DAMP * dt) + noiseAmp * (Math.random() * 2 - 1) * sqDt;
        q.vy = (q.vy + ay * dt) * Math.exp(-DAMP * dt) + noiseAmp * (Math.random() * 2 - 1) * sqDt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        if (homeRelax > 0) {
          q.hx += homeRelax * dt * (q.x - q.hx);
          q.hy += homeRelax * dt * (q.y - q.hy);
        }
        // 벽 충돌(탄성)
        if (q.x < X0 + R) { q.x = X0 + R; q.vx = Math.abs(q.vx); if (homeRelax > 0) q.hx = q.x; }
        if (q.x > X1 - R) { q.x = X1 - R; q.vx = -Math.abs(q.vx); if (homeRelax > 0) q.hx = q.x; }
        if (q.y < Y0 + R) { q.y = Y0 + R; q.vy = Math.abs(q.vy); if (homeRelax > 0) q.hy = q.y; }
        if (q.y > Y1 - R) { q.y = Y1 - R; q.vy = -Math.abs(q.vy); if (homeRelax > 0) q.hy = q.y; }
      });
      st.t += dt;
    },

    graphs: [{
      title: '평균 속력 – 시간', xmin: 6, window: 10, y0: 0,
      series: [{ key: 'vavg', label: '평균 속력', color: C.vavg }]
    }],
    sample(st, p) {
      let s = 0;
      st.parts.forEach(q => { s += Math.hypot(q.vx, q.vy); });
      return { vavg: s / st.parts.length };
    },

    readouts(st, p) {
      let s = 0;
      st.parts.forEach(q => { s += Math.hypot(q.vx, q.vy); });
      const ph = phaseOf(p.T);
      return [
        { label: '상태', value: phaseLabel(ph), color: '#e8eefc' },
        { label: '평균 속력', value: s / st.parts.length, dec: 2, color: C.vavg },
        { label: '입자 수', value: st.parts.length, dec: 0, color: '#93a2c4' }
      ];
    },

    notes: [
      '<b>고체</b>: 입자끼리 강하게 붙잡혀 있어 제자리에서만 진동 — 모양이 유지됩니다.',
      '<b>액체</b>: 붙잡는 힘이 약해져 서로의 자리를 바꿔가며 흐르지만, 완전히 흩어지지는 않습니다.',
      '<b>기체</b>: 서로를 거의 붙잡지 못해 빠르게 퍼지며 용기 전체를 채웁니다.',
      '실제로는 물 분자, 산소 분자처럼 훨씬 더 복잡하지만, 원리는 "온도 = 입자 운동의 활발함"으로 같습니다.'
    ],
    presets: [
      { name: '얼음 (고체)', set: { T: 0.4 } },
      { name: '물 (액체)', set: { T: 1.6 } },
      { name: '수증기 (기체)', set: { T: 3.0 } }
    ],

    challenges: [
      { id: 'ch-gas', title: '기체 상태 만들기',
        desc: '온도(T)를 충분히 올려서 물질을 기체 상태로 만들어보세요.',
        check: ctx => phaseOf(ctx.P.T) === 'gas',
        hint: 'T를 2.3보다 크게 올려보세요.' },
      { id: 'ch-fastavg', title: '평균 속력 3 이상 만들기',
        desc: '온도를 올리고 잠시 지켜봐서, 입자들의 평균 속력이 3 이상이 되게 만들어보세요.',
        check: ctx => {
          let s = 0; ctx.st.parts.forEach(q => s += Math.hypot(q.vx, q.vy));
          return (s / ctx.st.parts.length) >= 3;
        },
        hint: 'T를 2 이상으로 올리고 몇 초 기다려보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, { x0: X0 - 0.4, x1: X1 + 0.4, y0: Y0 - 0.4, y1: Y1 + 0.6, pad: 20 });
      const ph = phaseOf(p.T);

      // 용기
      ctx.save();
      D.roundRect(ctx, V.X(X0), V.Y(Y1), V.X(X1) - V.X(X0), V.Y(Y0) - V.Y(Y1), 8);
      ctx.strokeStyle = 'rgba(147,162,196,.5)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();

      D.text(ctx, phaseLabel(ph), V.X((X0 + X1) / 2), V.Y(Y1) - 14, { size: 13, color: '#e8eefc', align: 'center', bold: true });

      st.parts.forEach(q => {
        const speed = Math.hypot(q.vx, q.vy);
        const col = hl === 'T' || hl === 'vavg' ? '#fbbf24' : speedColor(speed);
        D.dot(ctx, V.X(q.x), V.Y(q.y), V.S(R) , col, hl === 'T' || hl === 'vavg');
      });

      D.text(ctx, '파랑 = 느린 입자, 빨강 = 빠른 입자', V.X(X0), V.Y(Y0) + 26, { size: 10.5, color: '#61719a' });
    }
  });
})();
