/* 뉴턴 운동 제2법칙 — F = ma (마찰 포함) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const G = 9.8;
  const C = { F: '#34d399', m: '#f472b6', mu: '#fb7185', a: '#fbbf24', v: '#60a5fa', N: '#60a5fa', f: '#fb7185', W: '#a78bfa' };

  function friction(p) { return p.mu * p.m * G; }
  function accel(st, p) {
    const fmax = friction(p);
    if (Math.abs(st.v) < 1e-6) return p.F > fmax ? (p.F - fmax) / p.m : 0;
    return (p.F - fmax * Math.sign(st.v)) / p.m;
  }

  PS.register({
    id: 'newton',
    category: '역학과 에너지',
    title: '뉴턴 운동 제2법칙',
    sub: 'F = ma',
    tagline: '같은 힘으로 밀어도 질량이 크면 왜 천천히 빨라질까요? 힘·질량·마찰을 직접 바꿔 보세요.',

    params: [
      { key: 'F', symbol: 'F', label: '미는 힘', unit: 'N', min: 0, max: 60, step: 1, value: 20, color: C.F,
        where: '상자 왼쪽에서 밀고 있는 <b>초록색 화살표</b>입니다. 화살표 길이가 곧 힘의 크기입니다.' },
      { key: 'm', symbol: 'm', label: '질량', unit: 'kg', min: .5, max: 12, step: .5, value: 4, color: C.m,
        where: '<b>상자의 크기(와 무게)</b>로 나타납니다. 질량은 "속도를 바꾸기 어려운 정도"라서, 커질수록 같은 힘에도 가속도가 작아집니다. 동시에 마찰력 μmg도 함께 커집니다.' },
      { key: 'mu', symbol: 'μ', label: '마찰 계수', unit: '', min: 0, max: .8, step: .02, value: .2, color: C.mu, dec: 2,
        where: '바닥의 <b>거칠기</b>이자 상자 오른쪽 아래 <b>빨간 화살표</b>(마찰력)의 크기를 정합니다. μ = 0이면 얼음판처럼 미끄러집니다.' }
    ],
    vars: {
      a: { symbol: 'a', label: '가속도', unit: 'm/s²', color: C.a,
        where: '상자 위쪽 <b>노란 화살표</b>입니다. 알짜힘을 질량으로 나눈 값이며, 속도(파란 화살표)를 매초 이만큼 바꿉니다.' },
      Fnet: { symbol: 'F', label: '알짜힘', unit: 'N', color: '#e8eefc',
        where: '화면 위쪽 <b>알짜힘 막대</b>입니다. 미는 힘에서 마찰력을 뺀 나머지로, 이것이 0이면 속도는 변하지 않습니다.' },
      f: { symbol: 'f', label: '마찰력', unit: 'N', color: C.f,
        where: '운동을 방해하는 <b>빨간 화살표</b>. 항상 운동 방향의 반대쪽을 향합니다.' },
      g: { symbol: 'g', label: '중력 가속도', unit: '9.8 m/s²', color: C.W,
        where: '아래로 향한 <b>보라색 화살표</b>(무게 mg)를 만듭니다. 무게가 클수록 바닥을 세게 눌러 마찰력도 커집니다.' }
    },
    formulas: [
      { name: '운동 제2법칙', tpl: '{a} = {Fnet} ÷ {m}' },
      { name: '알짜힘', tpl: '{Fnet} = {F} − {f}' },
      { name: '마찰력', tpl: '{f} = {mu} · {m}{g}' }
    ],

    init(p) { const s = { x: 0, v: 0, moved: 0 }; s.a = accel(s, p); return s; },

    step(st, p, dt) {
      const a = accel(st, p);
      const v2 = st.v + a * dt;
      // 미는 힘이 최대 정지마찰보다 작으면 멈춘 채로 유지
      if (st.v > 0 && v2 <= 0 && p.F <= friction(p)) { st.v = 0; }
      else st.v = v2;
      st.x += st.v * dt;
      st.moved += Math.abs(st.v) * dt;
      st.a = a;
    },

    graphs: [
      { title: '속도 – 시간', series: [{ key: 'v', label: 'v (m/s)', color: C.v }], xmin: 6 },
      { title: '가속도 – 시간', series: [{ key: 'a', label: 'a (m/s²)', color: C.a }], xmin: 6, y0: 0 }
    ],
    sample(st, p) { return { v: st.v, a: accel(st, p) }; },

    readouts(st, p) {
      const f = friction(p), a = accel(st, p);
      const moving = Math.abs(st.v) > 1e-6 || p.F > f;
      return [
        { label: '가속도 a', value: a, unit: 'm/s²', color: C.a },
        { label: '속도 v', value: st.v, unit: 'm/s', color: C.v },
        { label: '마찰력 f = μmg', value: f, unit: 'N', color: C.f },
        { label: '알짜힘 F − f', value: moving ? p.F - f : 0, unit: 'N' },
        { label: '이동 거리', value: st.x, unit: 'm' },
        { label: '상태', value: moving ? '가속 중' : '정지 (힘 부족)', color: moving ? '#34d399' : '#fb7185' }
      ];
    },

    notes: [
      '알짜힘이 <b>0이면 속도는 변하지 않습니다</b>. (관성 법칙) 힘이 있어야 "속도"가 아니라 "속도의 변화"가 생깁니다.',
      '같은 힘이라도 질량 m을 2배로 하면 가속도는 <b>절반</b>이 됩니다. F = ma를 직접 확인해 보세요.',
      '미는 힘이 최대 정지 마찰력 μmg보다 작으면 상자는 <b>꿈쩍도 하지 않습니다</b>.',
      'μ = 0 (얼음판)으로 두면 아주 작은 힘으로도 계속 빨라집니다.'
    ],
    presets: [
      { name: '가벼운 상자', set: { F: 20, m: 1.5, mu: .2 } },
      { name: '무거운 상자', set: { F: 20, m: 10, mu: .2 } },
      { name: '얼음판 (μ=0)', set: { F: 10, m: 4, mu: 0 } },
      { name: '꿈쩍 않는 경우', set: { F: 8, m: 8, mu: .5 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const gy = h * .72;
      const PPM = 34;                        // 1 m = 34 px
      const side = 38 * Math.cbrt(p.m / 4);  // 질량 → 상자 크기
      const cx = w * .42;
      const off = st.x * PPM;

      // 바닥 (마찰 계수에 따라 거칠기 표시)
      D.ground(ctx, 0, w, gy, off);
      ctx.save();
      ctx.globalAlpha = hl === 'mu' ? 1 : .55;
      ctx.fillStyle = C.mu;
      const bumps = Math.round(p.mu * 26);
      for (let i = 0; i < bumps; i++) {
        const x = ((i * 41 - off) % (w + 60) + w + 60) % (w + 60) - 30;
        ctx.beginPath(); ctx.arc(x, gy + 4, 2.2, 0, 7); ctx.fill();
      }
      ctx.restore();
      D.text(ctx, 'μ = ' + fmt(p.mu, 2), 14, gy + 26, { size: 11, color: C.mu, bold: hl === 'mu' });

      // 거리 표시 (지나간 거리)
      D.text(ctx, '이동 거리 ' + fmt(st.x, 1) + ' m', w - 14, gy + 26, { size: 11, color: '#61719a', align: 'right' });

      // 상자
      const by = gy - side;
      ctx.save();
      if (hl === 'm') { ctx.shadowColor = C.m; ctx.shadowBlur = 22; }
      D.roundRect(ctx, cx - side / 2, by, side, side, 6);
      const grd = ctx.createLinearGradient(0, by, 0, by + side);
      grd.addColorStop(0, hl === 'm' ? '#f9a8d4' : '#8ba4d8');
      grd.addColorStop(1, hl === 'm' ? '#be5a92' : '#4a6ba8');
      ctx.fillStyle = grd; ctx.fill();
      ctx.restore();
      D.text(ctx, fmt(p.m, 1) + ' kg', cx, by + side / 2 + 4, { size: 12, color: '#0a1120', align: 'center', bold: true });

      const f = friction(p);
      const moving = Math.abs(st.v) > 1e-6 || p.F > f;
      const S = 4.2; // N → px

      // 힘 화살표들
      D.arrow(ctx, cx - side / 2 - clamp(p.F * S, 0, 200) - 6, by + side * .45, clamp(p.F * S, 0, 200), 0,
        { color: C.F, width: 4, hot: hl === 'F', label: 'F = ' + fmt(p.F, 0) + ' N', ly: -14 });
      if (f > .05) {
        D.arrow(ctx, cx + side / 2 + 6, by + side * .82, clamp(moving ? f : Math.min(f, p.F), 0, 200) * S, 0,
          { color: C.f, width: 3.5, hot: hl === 'f' || hl === 'mu', label: 'f = ' + fmt(moving ? f : Math.min(f, p.F), 1) + ' N', ly: 18 });
      }
      // 무게 mg (질량 중심에서 아래로) / 수직항력 N (접촉면에서 위로)
      const wgt = clamp(p.m * G * S * .5, 14, 110);
      D.arrow(ctx, cx + 12, by + side / 2, 0, wgt, { color: C.W, width: 2.5, hot: hl === 'g' || hl === 'm', label: 'mg = ' + fmt(p.m * G, 0) + ' N', lx: 52, ly: 30 });
      D.arrow(ctx, cx - 12, gy, 0, -wgt, { color: C.N, width: 2, dash: [4, 4], hot: hl === 'g', label: 'N', lx: -22, ly: 4 });

      // 가속도 / 속도 화살표
      D.arrow(ctx, cx, by - 30, clamp(st.a * 20, -220, 220), 0,
        { color: C.a, width: 4, hot: hl === 'a', label: 'a = ' + fmt(st.a, 2) + ' m/s²' });
      D.arrow(ctx, cx, by - 66, clamp(st.v * 12, -240, 240), 0,
        { color: C.v, width: 4, hot: hl === 'v', label: 'v = ' + fmt(st.v, 1) + ' m/s' });

      // 알짜힘 막대
      const bx = 22, bw = Math.min(240, w * .3), byy = 22;
      const maxF = 60;
      D.text(ctx, '알짜힘 = 미는 힘 − 마찰력', bx, byy - 8, { size: 11, color: hl === 'Fnet' ? '#fff' : '#61719a', bold: hl === 'Fnet' });
      const fShown = moving ? f : Math.min(f, p.F);
      D.bar(ctx, bx, byy, bw, 10, p.F, maxF, C.F, null, hl === 'F');
      D.text(ctx, '미는 힘 ' + fmt(p.F, 0) + ' N', bx + bw + 8, byy + 9, { size: 11, color: C.F, bold: hl === 'F' });
      D.bar(ctx, bx, byy + 16, bw, 10, fShown, maxF, C.f, null, hl === 'f' || hl === 'mu');
      D.text(ctx, '마찰력 ' + fmt(fShown, 1) + ' N', bx + bw + 8, byy + 25, { size: 11, color: C.f, bold: hl === 'f' || hl === 'mu' });
      D.bar(ctx, bx, byy + 32, bw, 12, moving ? p.F - f : 0, maxF, '#e8eefc', null, hl === 'Fnet');
      D.text(ctx, '알짜힘 ' + fmt(moving ? p.F - f : 0, 1) + ' N', bx + bw + 8, byy + 42, { size: 12, color: '#e8eefc', bold: true });

      if (!moving) D.tag(ctx, '미는 힘 ≤ 최대 정지 마찰력 → 정지', w / 2, h - 18, C.f, hl === 'mu' || hl === 'f');
    }
  });
})();
