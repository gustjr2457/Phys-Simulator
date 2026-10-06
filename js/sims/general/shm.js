/* [일반물리] 단진동(SHM) — F = −kx,  x(t) = A cos(ωt) (감쇠 없는 이상적인 경우) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { k: '#5eead4', m: '#f472b6', A: '#a78bfa', w: '#fbbf24', T: '#fbbf24', U: '#a78bfa', K: '#60a5fa' };

  const omega = p => Math.sqrt(p.k / p.m);

  PS.register({
    id: 'g-shm', mode: 'general', category: '역학과 진동',
    title: '단진동(SHM)',
    sub: 'x(t) = A cos(ωt)',
    tagline: '공학응용 트랙의 "감쇠 자유진동"에서 대시포트(감쇠기)를 완전히 없앤 가장 이상적인 경우입니다. 감쇠가 없으니 스프링의 에너지와 운동에너지가 정확히 주고받히며 총량은 절대 변하지 않습니다.',

    params: [
      { key: 'k', symbol: 'k', label: '스프링 상수', unit: 'N/m', min: 5, max: 60, step: 1, value: 20, color: C.k,
        where: '<b>청록색 스프링</b>입니다. 단단할수록(k↑) 더 빠르게 진동합니다(ω = √(k/m)).' },
      { key: 'm', symbol: 'm', label: '질량', unit: 'kg', min: .3, max: 4, step: .1, value: 1, color: C.m,
        where: '스프링 끝의 <b>블록</b>입니다. 무거울수록(m↑) 관성이 커서 <b>느리게</b> 진동합니다.' },
      { key: 'A', symbol: 'A', label: '진폭', unit: 'm', min: .3, max: 2.4, step: .1, value: 1.5, color: C.A, reset: true,
        where: '평형 위치에서 <b>얼마나 당겼다 놓았는지</b>입니다. 진동수에는 영향을 주지 않고, 오직 "얼마나 크게" 흔들리는지만 정합니다.' }
    ],
    vars: {
      w: { symbol: 'ω', label: '각진동수', unit: 'rad/s', color: C.w,
        where: '<b>1초에 몇 라디안</b>을 도는 셈인지로 나타낸 진동 속도입니다. 오직 k와 m으로만 정해지고, 진폭 A와는 무관합니다.' },
      T: { symbol: 'T', label: '주기', unit: 's', color: C.T, where: '한 번 왕복하는 데 걸리는 시간입니다.' },
      U: { symbol: 'U', label: '스프링에 저장된 에너지', unit: '', color: C.U, where: '오른쪽 막대의 <b>보라 부분</b>. 블록이 평형에서 멀수록 커집니다.' },
      K: { symbol: 'K', label: '운동에너지', unit: '', color: C.K, where: '오른쪽 막대의 <b>파란 부분</b>. 블록이 평형을 지날 때(가장 빠를 때) 최대입니다.' }
    },
    formulas: [
      { name: '각진동수', tpl: '{w} = √( {k} ⁄ {m} )' },
      { name: '주기', tpl: '{T} = 2π ⁄ {w}' },
      { name: '에너지는 스프링 ↔ 운동 사이만 오간다', tpl: '{U} + {K} = 항상 일정' }
    ],

    init(p) { return { x: p.A, v: 0 }; },
    step(st, p, dt) {
      // 감쇠가 없는 이상적인 조화진동이므로 수치 적분 대신 정확한 해를 그대로 쓴다(에너지 오차 0).
      const w = omega(p);
      st.x = p.A * Math.cos(w * st.t);
      st.v = -p.A * w * Math.sin(w * st.t);
    },

    graphs: [{
      title: '변위 x – 시간', xmin: 6, window: 8,
      series: [{ key: 'x', label: 'x (m)', color: C.A }]
    }],
    sample(st, p) { return { x: st.x }; },

    readouts(st, p) {
      const w = omega(p);
      const U = 0.5 * p.k * st.x * st.x, K = 0.5 * p.m * st.v * st.v;
      return [
        { label: '현재 변위 x', value: st.x, unit: 'm', dec: 3, color: C.A },
        { label: '현재 속도 v', value: st.v, unit: 'm/s', dec: 2, color: C.K },
        { label: '각진동수 ω', value: w, unit: 'rad/s', dec: 2, color: C.w },
        { label: '주기 T', value: 2 * Math.PI / w, unit: 's', dec: 2, color: C.T },
        { label: '스프링 에너지 U + 운동에너지 K', value: U + K, dec: 2, color: C.U, wide: true }
      ];
    },

    notes: [
      '진폭 A를 바꿔도 <b>진동수는 그대로</b>입니다 — 단진동의 가장 신기한 성질 중 하나입니다(크게 흔들든 작게 흔들든 걸리는 시간은 같음).',
      '블록이 <b>평형을 지날 때 가장 빠르고</b>(K 최대, U=0), <b>양 끝에서 순간 멈춥니다</b>(U 최대, K=0).',
      '이 시뮬레이션에는 감쇠(마찰)가 없어서 <b>영원히</b> 똑같은 크기로 진동합니다 — 현실에는 없는 이상적인 경우입니다.',
      '감쇠기(대시포트)를 추가하면 진폭이 점점 줄어드는데, 이건 공학응용 트랙의 "감쇠 자유진동"에서 다룹니다.'
    ],
    presets: [
      { name: '단단한 스프링(빠르게)', set: { k: 50, m: 1, A: 1.2 } },
      { name: '무거운 블록(느리게)', set: { k: 20, m: 3.5, A: 1.2 } },
      { name: '크게 당겨서', set: { k: 20, m: 1, A: 2.4 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const BW = 118;
      const cx = (w - BW) * .42, top = 60;
      const PPM = Math.min(120, ((w - BW) * .5 - 40) / 2.6);
      const eq = cx;                      // 평형 위치(화면 x) — 수평 진동이므로 x축 기준
      const midY = h / 2;
      const bx = eq + st.x * PPM;

      // 벽
      D.line(ctx, 60, top, 60, h - 60, { color: 'rgba(147,162,196,.5)', width: 3 });
      for (let i = 0; i < 12; i++) D.line(ctx, 60, top + i * ((h - 120) / 11), 48, top + 10 + i * ((h - 120) / 11), { color: 'rgba(147,162,196,.25)' });

      // 스프링(가로)
      const bw = 46 + p.m * 10, bh = 46 + p.m * 6;
      D.spring(ctx, 60, midY, bx - bw / 2, midY, { coils: 10, amp: 12, color: C.k, hot: hl === 'k' });
      D.text(ctx, 'k = ' + fmt(p.k, 0), (60 + bx - bw / 2) / 2, midY - 34, { size: 11, color: C.k, align: 'center', bold: hl === 'k' });

      // 평형선 · 진폭 안내선
      D.line(ctx, eq, top, eq, h - 60, { color: 'rgba(147,162,196,.3)', dash: [5, 6] });
      D.text(ctx, '평형', eq, top - 8, { size: 10, color: '#61719a', align: 'center' });
      const hotA = hl === 'A';
      D.line(ctx, eq + p.A * PPM, top, eq + p.A * PPM, h - 60, { color: C.A, dash: [4, 5], hot: hotA });
      D.line(ctx, eq - p.A * PPM, top, eq - p.A * PPM, h - 60, { color: C.A, dash: [4, 5], hot: hotA });

      // 블록
      ctx.save();
      if (hl === 'm') { ctx.shadowColor = C.m; ctx.shadowBlur = 20; }
      D.roundRect(ctx, bx - bw / 2, midY - bh / 2, bw, bh, 8);
      const g = ctx.createLinearGradient(0, midY - bh / 2, 0, midY + bh / 2);
      g.addColorStop(0, hl === 'm' ? '#f9a8d4' : '#8ba4d8'); g.addColorStop(1, hl === 'm' ? '#be5a92' : '#4a6ba8');
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
      D.text(ctx, fmt(p.m, 1) + ' kg', bx, midY + 4, { size: 12, color: '#0a1120', align: 'center', bold: true });

      // 변위 치수선
      D.dim(ctx, eq, midY + bh / 2 + 26, bx, midY + bh / 2 + 26, 'x = ' + fmt(st.x, 2), C.A, hl === 'A');

      // 에너지 막대(오른쪽) — 초급 '에너지란 무엇인가?'와 같은 방식
      const U = 0.5 * p.k * st.x * st.x, K = 0.5 * p.m * st.v * st.v, maxE = Math.max(0.5 * p.k * p.A * p.A, .1);
      const top2 = 34, bot2 = h - 34, bh2 = bot2 - top2;
      const bxx = w - BW + 24, bwid = 46;
      const uh = bh2 * clamp(U / maxE, 0, 1), kh = bh2 * clamp(K / maxE, 0, 1 - U / maxE);
      D.text(ctx, '에너지', bxx + bwid / 2, top2 - 20, { size: 11, color: '#61719a', align: 'center' });
      D.roundRect(ctx, bxx, top2, bwid, bh2, 6); ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fill();
      ctx.save(); if (hl === 'U') { ctx.shadowColor = C.U; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.U; ctx.fillRect(bxx, bot2 - uh, bwid, uh); ctx.restore();
      ctx.save(); if (hl === 'K') { ctx.shadowColor = C.K; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.K; ctx.fillRect(bxx, bot2 - uh - kh, bwid, kh); ctx.restore();
      D.text(ctx, '총량 항상 일정', bxx + bwid + 10, top2 + 8, { size: 9.5, color: '#61719a' });
    }
  });
})();
