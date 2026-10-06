/* [일반물리] 회전운동과 각운동량 — L = Iω (각운동량 보존) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { L: '#fbbf24', r: '#a78bfa', I: '#5eead4', w: '#60a5fa', K: '#f472b6' };
  const M = 1; // 점질량 모형: 팔 끝에 달린 질량(단순화를 위해 1로 고정)

  PS.register({
    id: 'g-rotation', mode: 'general', category: '회전운동',
    title: '회전운동과 각운동량',
    sub: 'L = Iω',
    tagline: '피겨스케이팅 선수가 팔을 오므리면 왜 더 빨리 돌까요? 팔의 길이(r) 슬라이더를 줄여 보면서 회전 속도가 어떻게 반응하는지 보세요. 각운동량 L은 그대로인데, 팔을 오므리면 관성모멘트 I가 줄어 각속도 ω가 커집니다.',

    params: [
      { key: 'L', symbol: 'L', label: '각운동량', unit: '', min: 2, max: 16, step: .5, value: 8, color: C.L,
        where: '처음에 <b>얼마나 세게 돌기 시작했는지</b>입니다. 외부에서 손으로 밀어주지 않는 한(예: 얼음판 위 회전) 이 값은 <b>절대 바뀌지 않습니다</b> — 각운동량 보존 법칙입니다.' },
      { key: 'r', symbol: 'r', label: '팔을 벌린 정도(반지름)', unit: '', min: .35, max: 1.8, step: .05, value: 1.2, color: C.r,
        where: '<b>팔(막대)의 길이</b>입니다. 팔을 오므려 r을 줄이면 관성모멘트 I(=r²)가 줄어들고, L이 그대로이므로 ω(=L/I)가 커져 <b>더 빨리 돕니다</b>.' }
    ],
    vars: {
      I: { symbol: 'I', label: '관성모멘트', unit: '', color: C.I,
        where: '<b>회전하기 어려운 정도</b>입니다. 팔이 길게 뻗을수록(r↑) 커져서 돌리기 힘들어집니다(단순화: I = r², 질량 1인 점질량 두 개 모형).' },
      w: { symbol: 'ω', label: '각속도', unit: 'rad/s', color: C.w,
        where: '<b>실제로 얼마나 빨리 도는지</b>입니다. 막대가 화면에서 도는 빠르기 그 자체입니다.' },
      K: { symbol: 'K_회전', label: '회전 운동에너지', unit: '', color: C.K,
        where: '회전에 담긴 에너지입니다. <b>주의</b>: 각운동량 L은 보존되지만 이 에너지는 보존되지 않습니다 — 팔을 오므리는 동작 자체가 몸에 일을 하기 때문에, 팔을 오므리면 오히려 <b>이 값이 늘어납니다</b>.' }
    },
    formulas: [
      { name: '각운동량(항상 일정)', tpl: '{L} = {I}{w}  (팔을 움직여도 L은 그대로)' },
      { name: '관성모멘트(단순화)', tpl: '{I} = {r}²' },
      { name: '회전 운동에너지', tpl: '{K} = ½{I}{w}²' }
    ],

    init(p) { return { theta: 0 }; },
    step(st, p, dt) {
      const I = p.r * p.r;
      const w = p.L / I;
      st.theta += w * dt;
    },

    graphs: [{
      title: '각속도 ω – 시간', xmin: 6, window: 10, y0: 0,
      series: [{ key: 'w', label: 'ω (rad/s)', color: C.w }]
    }],
    sample(st, p) { return { w: p.L / (p.r * p.r) }; },

    readouts(st, p) {
      const I = p.r * p.r, w = p.L / I, K = 0.5 * I * w * w;
      return [
        { label: '관성모멘트 I', value: I, dec: 2, color: C.I },
        { label: '각속도 ω', value: w, unit: 'rad/s', dec: 2, color: C.w },
        { label: '1초에 도는 횟수', value: w / (2 * Math.PI), unit: '회전/초', dec: 2, color: C.w },
        { label: '회전 운동에너지 K', value: K, dec: 2, color: C.K, wide: true }
      ];
    },

    notes: [
      '외부에서 비틀어 주는 힘(돌림힘)이 없으면 <b>각운동량 L은 절대 변하지 않습니다</b> — 회전판·얼음판처럼 마찰이 거의 없는 상황에서 성립합니다.',
      '팔을 오므리면(r↓) I가 줄고, L = Iω가 일정해야 하므로 <b>ω가 커집니다</b> — 피겨스케이팅 스핀의 원리입니다.',
      '신기하게도 회전 운동에너지 K는 팔을 오므릴 때 <b>오히려 늘어납니다</b> — 팔을 오므리는 근육이 일을 해서 에너지를 더해주기 때문입니다(L 보존 ≠ 에너지 보존).',
      '이 모형은 팔 끝에 달린 점질량 두 개로 단순화한 것입니다. 실제 사람의 관성모멘트 분포는 훨씬 복잡합니다.'
    ],
    presets: [
      { name: '팔을 벌린 상태', set: { L: 8, r: 1.8 } },
      { name: '팔을 오므린 상태', set: { L: 8, r: .4 } },
      { name: '세게 돌기 시작', set: { L: 15, r: 1.2 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const cx = w * .42, cy = h / 2;
      const PPM = Math.min(150, (Math.min(w * .8, h) - 60) / 2);
      const I = p.r * p.r, om = p.L / I;

      // 회전판(바닥)
      ctx.save();
      ctx.strokeStyle = 'rgba(147,162,196,.25)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, PPM * 1.85, 0, 7); ctx.stroke();
      ctx.restore();

      const rr = p.r * PPM;
      const x1 = cx + rr * Math.cos(st.theta), y1 = cy + rr * Math.sin(st.theta);
      const x2 = cx - rr * Math.cos(st.theta), y2 = cy - rr * Math.sin(st.theta);

      // 팔(막대)
      const hotR = hl === 'r' || hl === 'I';
      D.line(ctx, x1, y1, x2, y2, { color: hotR ? '#fff' : C.r, width: hotR ? 5 : 3.5, hot: hotR });
      D.dot(ctx, cx, cy, 5, '#93a2c4', false);

      // 양 끝 질량
      [[x1, y1], [x2, y2]].forEach(([x, y]) => {
        ctx.save();
        if (hl === 'w' || hl === 'L') { ctx.shadowColor = C.w; ctx.shadowBlur = 18; }
        const g = ctx.createRadialGradient(x - 5, y - 5, 1, x, y, 16);
        g.addColorStop(0, '#fde7f3'); g.addColorStop(1, '#f472b6');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill();
        ctx.restore();
      });

      // 회전 방향 화살표
      const tipAng = st.theta + Math.PI / 2 + (om < 0 ? Math.PI : 0);
      D.arrow(ctx, x1 + Math.cos(tipAng) * 4, y1 + Math.sin(tipAng) * 4,
        Math.cos(tipAng) * clamp(Math.abs(om) * 10, 8, 40), Math.sin(tipAng) * clamp(Math.abs(om) * 10, 8, 40),
        { color: C.w, width: 2.5, head: 8 });

      // r 치수선
      D.dim(ctx, cx, cy - rr - 22, x1, y1 - 22, 'r = ' + fmt(p.r, 2), C.r, hl === 'r');

      // 오른쪽 요약 패널
      const gx = w - 210, gy = 60;
      D.text(ctx, 'I = r² = ' + fmt(I, 2), gx, gy, { size: 13, color: hl === 'I' ? '#fff' : C.I, bold: hl === 'I' });
      D.text(ctx, 'ω = L / I = ' + fmt(om, 2) + ' rad/s', gx, gy + 26, { size: 13, color: hl === 'w' ? '#fff' : C.w, bold: hl === 'w' });
      D.text(ctx, 'K = ½Iω² = ' + fmt(0.5 * I * om * om, 2), gx, gy + 52, { size: 13, color: hl === 'K' ? '#fff' : C.K, bold: hl === 'K' });
    }
  });
})();
