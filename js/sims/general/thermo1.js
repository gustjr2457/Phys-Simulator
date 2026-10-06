/* [일반물리·열역학] 열역학 제1법칙 — ΔU = Q − W (단원자 이상기체, 등압 과정)
   실린더 속 기체를 일정한 압력(추의 무게)으로 누른 채 아래에서 데우면,
   들어간 열 Q의 일부는 기체의 내부에너지 증가(ΔU)로, 나머지는 피스톤을
   밀어 올리는 일(W = PΔV)로 쓰인다. 단원자 이상기체에서는 이 배분 비율이
   항상 ΔU : W = 3 : 2 로 고정된다는 것을 정확한 해석해로 보여준다(수치오차 없음). */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { P: '#fbbf24', q: '#fb7185', Q: '#fb7185', W: '#60a5fa', U: '#a78bfa' };
  const V0 = 10, VMAX = 26;

  function rate(p) { return (2 / 5) * (p.q / p.P); } // dV/dt (등압 과정, 단원자 이상기체)
  function tCap(p) { return (VMAX - V0) / rate(p); }

  PS.register({
    id: 'g-thermo1', mode: 'general', category: '열과 통계',
    title: '열역학 제1법칙',
    sub: 'ΔU = Q − W',
    tagline: '피스톤 위 추의 무게가 기체 압력 P를 일정하게 유지합니다. 아래에서 열을 가하면 기체는 팽창하며 피스톤을 밀어 올립니다 — 들어간 열(Q) 중 일부는 기체 자체가 뜨거워지는 데(ΔU), 나머지는 피스톤을 미는 일(W)에 쓰입니다.',

    params: [
      { key: 'P', symbol: 'P', label: '압력(추의 무게)', unit: '', min: 1, max: 4, step: .2, value: 2, color: C.P, reset: true,
        where: '피스톤 위에 놓인 <b>추의 무게</b>가 만드는 기체 압력입니다. 무거울수록(P↑) 같은 열을 넣어도 기체는 <b>덜 팽창</b>합니다.' },
      { key: 'q', symbol: 'Q̇', label: '가열 속도', unit: '', min: .5, max: 3, step: .1, value: 1.5, color: C.q, reset: true,
        where: '아래 <b>불꽃(히터)</b>이 1초에 넣어주는 열의 양입니다. 클수록 더 빨리, 더 많이 팽창합니다.' }
    ],
    vars: {
      Q: { symbol: 'Q', label: '들어간 열', unit: '', color: C.Q, where: '히터가 기체에 넣어준 <b>총 열량</b>입니다. 시간이 지날수록 계속 늘어납니다.' },
      W: { symbol: 'W', label: '기체가 한 일', unit: '', color: C.W, where: '기체가 <b>피스톤을 밀어 올리며 한 일</b>입니다. W = PΔV. 항상 Q의 정확히 2/5입니다.' },
      dU: { symbol: 'ΔU', label: '내부에너지 변화', unit: '', color: C.U, where: '기체 분자들의 <b>운동이 얼마나 더 활발해졌는지</b>입니다(온도 상승분에 해당). 항상 Q의 정확히 3/5입니다.' }
    },
    formulas: [
      { name: '열역학 제1법칙', tpl: '{Q} = {dU} + {W}' },
      { name: '단원자 이상기체 · 등압 과정에서는', tpl: '{dU} : {W} = 3 : 2  (항상 이 비율)' }
    ],

    init(p) { return { V: V0, Q: 0, W: 0, dU: 0, done: false }; },
    step(st, p, dt) {
      // 등압 팽창은 정확한 해석해가 있으므로 수치 적분 없이 직접 계산한다 → 오차 0
      const r = rate(p), tc = tCap(p);
      const t = Math.min(st.t, tc);
      st.V = V0 + r * t;
      st.Q = p.q * t;
      st.W = p.P * (st.V - V0);
      st.dU = st.Q - st.W;
      st.done = st.t >= tc;
    },

    graphs: [{
      title: 'Q, W, ΔU – 시간', xmin: 8, window: 12,
      series: [{ key: 'Q', label: 'Q', color: C.Q }, { key: 'W', label: 'W', color: C.W }, { key: 'dU', label: 'ΔU', color: C.U }]
    }],
    sample(st, p) { return { Q: st.Q, W: st.W, dU: st.dU }; },

    readouts(st, p) {
      return [
        { label: '기체 부피 V', value: st.V, dec: 2, color: '#93a2c4' },
        { label: '들어간 열 Q', value: st.Q, dec: 2, color: C.Q },
        { label: '기체가 한 일 W', value: st.W, dec: 2, color: C.W },
        { label: '내부에너지 변화 ΔU', value: st.dU, dec: 2, color: C.U, wide: true },
        { label: '상태', value: st.done ? '실린더가 가득 참 — 가열을 멈췄다고 가정' : '가열 중', wide: true }
      ];
    },

    notes: [
      '<b>들어간 열(Q)은 사라지지 않습니다</b> — 전부 기체를 데우는 데(ΔU) 쓰이거나 피스톤을 미는 일(W)로 바뀔 뿐입니다: Q = ΔU + W.',
      '이 실린더처럼 <b>압력이 일정한(등압)</b> 과정에서 단원자 이상기체는 항상 <b>ΔU가 Q의 3/5, W가 Q의 2/5</b>를 차지합니다 — 추의 무게(P)나 가열 속도(q)를 바꿔도 이 비율 자체는 변하지 않습니다.',
      '압력 P를 높이면(추를 무겁게 하면) 같은 열을 넣어도 <b>부피가 덜 늘어납니다</b> — 그만큼 일(W)을 적게 하니, 결국 열의 절대량 배분은 그대로 3:2를 유지합니다.',
      '만약 피스톤을 완전히 고정해 부피가 전혀 못 바뀌게 하면(등적 과정) W = 0이 되어 <b>들어간 열이 전부 ΔU로만</b> 갑니다 — 이 경우는 다루지 않지만 극단적인 예로 기억해 두면 좋습니다.'
    ],
    presets: [
      { name: '기본', set: { P: 2, q: 1.5 } },
      { name: '무거운 추(적게 팽창)', set: { P: 4, q: 1.5 } },
      { name: '빠르게 가열', set: { P: 2, q: 3 } },
      { name: '가벼운 추 + 천천히 가열', set: { P: 1, q: .5 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cw = 130, cx = w * .38;
      // 피스톤이 끝까지 올라가도 그 위의 추가 화면 밖으로 나가지 않도록 위쪽 여백을 확보한다
      const baseY = h - 74, topY = 104;
      const pxPerV = (baseY - topY) / VMAX;
      const pistonY = baseY - st.V * pxPerV;

      // 실린더 벽(양옆 + 바닥) — 위는 열려 있음
      D.line(ctx, cx - cw / 2, topY, cx - cw / 2, baseY, { color: 'rgba(147,162,196,.55)', width: 3 });
      D.line(ctx, cx + cw / 2, topY, cx + cw / 2, baseY, { color: 'rgba(147,162,196,.55)', width: 3 });
      D.line(ctx, cx - cw / 2 - 6, baseY, cx + cw / 2 + 6, baseY, { color: 'rgba(147,162,196,.7)', width: 4 });

      // 기체(피스톤 아래 영역) — 뜨거울수록(ΔU 클수록) 붉게
      const heat = clamp(st.dU / Math.max(1, p.q * tCap(p) * 0.6), 0, 1);
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - cw / 2 + 2, pistonY, cw - 4, baseY - pistonY);
      const grad = ctx.createLinearGradient(0, pistonY, 0, baseY);
      grad.addColorStop(0, 'rgba(168,139,250,.18)');
      grad.addColorStop(1, `rgba(${Math.round(96 + 155 * heat)},${Math.round(120 - 40 * heat)},${Math.round(220 - 140 * heat)},.30)`);
      ctx.fillStyle = grad; ctx.fill();
      ctx.restore();

      // 피스톤
      const pistonH = 16;
      ctx.save();
      if (hl === 'V') { ctx.shadowColor = '#e8eefc'; ctx.shadowBlur = 14; }
      D.roundRect(ctx, cx - cw / 2 - 6, pistonY - pistonH, cw + 12, pistonH, 4);
      ctx.fillStyle = '#c8d3ef'; ctx.fill();
      ctx.restore();
      // 추(무게 = P) — 피스톤 위에 얹혀 함께 올라간다
      const wSize = 20 + p.P * 7;
      const wTop = Math.max(6, pistonY - pistonH - wSize);
      ctx.save();
      if (hl === 'P') { ctx.shadowColor = C.P; ctx.shadowBlur = 16; }
      D.roundRect(ctx, cx - wSize / 2, wTop, wSize, wSize, 6);
      ctx.fillStyle = C.P; ctx.fill();
      ctx.restore();
      D.text(ctx, 'P', cx, wTop + wSize / 2 + 4, { size: 12, color: '#08101f', align: 'center', bold: true });
      D.text(ctx, '추의 무게 = 압력', cx + wSize / 2 + 10, wTop + wSize / 2 + 4,
        { size: 10, color: hl === 'P' ? '#fff' : C.P, bold: hl === 'P' });

      // 부피 치수선
      D.dim(ctx, cx + cw / 2 + 24, baseY, cx + cw / 2 + 24, pistonY, 'V=' + fmt(st.V, 1), '#93a2c4', hl === 'V');

      // W 화살표(피스톤이 밀려 올라간 만큼)
      if (st.V > V0 + .2) {
        D.arrow(ctx, cx - cw / 2 - 34, baseY - st.V * pxPerV / 2, 0, -Math.min(60, st.V * pxPerV * .5),
          { color: C.W, width: 4, hot: hl === 'W', label: 'W' });
      }

      // 히터 불꽃 + Q 화살표(아래에서 위로)
      const flameX = cx, flameY = baseY + 20;
      ctx.save();
      const fcol = C.q;
      if (hl === 'q') { ctx.shadowColor = fcol; ctx.shadowBlur = 16; }
      ctx.fillStyle = fcol;
      ctx.beginPath();
      ctx.moveTo(flameX, flameY - 14 - p.q * 3);
      ctx.quadraticCurveTo(flameX + 10, flameY - 6, flameX + 6, flameY + 2);
      ctx.quadraticCurveTo(flameX + 3, flameY + 6, flameX, flameY + 2);
      ctx.quadraticCurveTo(flameX - 3, flameY + 6, flameX - 6, flameY + 2);
      ctx.quadraticCurveTo(flameX - 10, flameY - 6, flameX, flameY - 14 - p.q * 3);
      ctx.fill();
      ctx.restore();
      D.tag(ctx, 'Q̇=' + fmt(p.q, 1), flameX, flameY + 24, C.q, hl === 'q');

      // 에너지 배분 막대(오른쪽) — Q가 ΔU(보라)와 W(파랑)로 항상 3:2로 나뉨을 시각화
      const barX = w - 70, barTop = 40, barBot = h - 40, barH = barBot - barTop, barW = 34;
      D.roundRect(ctx, barX, barTop, barW, barH, 6); ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fill();
      const uH = barH * .6, wH = barH * .4;
      ctx.save(); if (hl === 'dU') { ctx.shadowColor = C.U; ctx.shadowBlur = 14; }
      ctx.fillStyle = C.U; ctx.fillRect(barX, barTop, barW, uH); ctx.restore();
      ctx.save(); if (hl === 'W') { ctx.shadowColor = C.W; ctx.shadowBlur = 14; }
      ctx.fillStyle = C.W; ctx.fillRect(barX, barTop + uH, barW, wH); ctx.restore();
      D.text(ctx, 'Q 배분', barX + barW / 2, barTop - 12, { size: 10.5, color: '#61719a', align: 'center' });
      D.text(ctx, 'ΔU 3', barX + barW / 2, barTop + uH / 2 + 4, { size: 10, color: '#08101f', align: 'center', bold: true });
      D.text(ctx, 'W 2', barX + barW / 2, barTop + uH + wH / 2 + 4, { size: 10, color: '#08101f', align: 'center', bold: true });
    }
  });
})();
