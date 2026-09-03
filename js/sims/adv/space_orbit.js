/* [항공우주공학] 인공위성 궤도 — 비스비바 v² = μ(2/r − 1/a), 케플러 법칙 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { h: '#5eead4', vr: '#fbbf24', v: '#60a5fa', r: '#a78bfa', mu: '#f472b6', T: '#fbbf24', e: '#34d399' };
  const MU = 3.986e14, RE = 6.371e6, TS = 500;      // TS: 실제 시간 배속

  PS.register({
    id: 'space-orbit', mode: 'adv', category: '항공우주공학',
    title: '인공위성의 궤도',
    sub: 'v² = μ(2/r − 1/a)',
    tagline: '조금 빠르면 타원, 딱 맞으면 원, √2배면 지구를 떠납니다. 궤도는 속도가 결정합니다.',

    params: [
      { key: 'h', symbol: 'h', label: '발사 고도', unit: 'km', min: 200, max: 4000, step: 50, value: 500, color: C.h, reset: true, dec: 0,
        where: '지표에서 <b>위성을 놓는 높이</b>입니다. 지구 반지름 6,371 km에 더해져 궤도 반지름 r이 되고, 필요한 원궤도 속도를 결정합니다.' },
      { key: 'vr', symbol: 'k', label: '원궤도 속도 대비 배율', unit: '×', min: .6, max: 1.5, step: .01, value: 1, color: C.vr, reset: true, dec: 2,
        where: '발사 순간 속도를 <b>원궤도 속도의 몇 배</b>로 줄지 정합니다. 1이면 완전한 원, 1보다 크면 반대편이 부풀어 타원, √2(1.41)를 넘으면 <b>지구 중력을 탈출</b>합니다. 1보다 작으면 반대편이 낮아져 대기권에 재진입합니다.' }
    ],
    vars: {
      v: { symbol: 'v', label: '현재 속력', unit: 'km/s', color: C.v,
        where: '위성에 붙은 <b>파란 화살표</b>입니다. 근지점(가까울 때)에서 가장 빠르고 원지점에서 가장 느립니다.' },
      r: { symbol: 'r', label: '지구 중심까지 거리', unit: 'km', color: C.r,
        where: '지구 중심과 위성을 잇는 <b>보라색 선</b>입니다. 이 선이 쓸고 지나간 넓이가 케플러 제2법칙의 주인공입니다.' },
      mu: { symbol: 'μ', label: '지구 중력 상수 GM', unit: 'm³/s²', color: C.mu,
        where: '지구가 끌어당기는 <b>힘의 세기</b>(3.986×10¹⁴)입니다. 모든 궤도 공식에 등장하는 지구의 고유값입니다.' },
      T: { symbol: 'T', label: '공전 주기', unit: '분', color: C.T,
        where: '한 바퀴 도는 데 걸리는 시간입니다. <b>장반경 a만으로</b> 결정됩니다(케플러 제3법칙).' },
      e: { symbol: 'e', label: '이심률', unit: '', color: C.e,
        where: '궤도가 <b>얼마나 찌그러졌는가</b>입니다. 0이면 완전한 원, 1에 가까울수록 길쭉한 타원, 1 이상이면 열린 궤도(탈출)입니다.' }
    },
    formulas: [
      { name: '원궤도 속도', tpl: 'v_c = √( {mu} ⁄ {r} )' },
      { name: '탈출 속도', tpl: 'v_esc = √( 2{mu} ⁄ {r} ) = √2 · v_c' },
      { name: '비스비바 (에너지) 방정식', tpl: '{v}² = {mu} ( 2⁄{r} − 1⁄a )' },
      { name: '케플러 제3법칙', tpl: '{T} = 2π √( a³ ⁄ {mu} )' },
      { name: '케플러 제2법칙', tpl: '{r} × {v} = 일정 → 같은 시간에 같은 넓이' }
    ],

    init(p) {
      const r0 = RE + p.h * 1000;
      const vc = Math.sqrt(MU / r0);
      return {
        x: r0, y: 0, vx: 0, vy: vc * p.vr,
        trail: [], sectors: [], cur: [], secT: 0, done: false, msg: ''
      };
    },

    step(st, p, dt) {
      const dtp = dt * TS;
      const acc = (x, y) => { const r = Math.hypot(x, y); const k = -MU / (r * r * r); return [k * x, k * y]; };
      let a = acc(st.x, st.y);
      st.vx += a[0] * dtp / 2; st.vy += a[1] * dtp / 2;
      st.x += st.vx * dtp; st.y += st.vy * dtp;
      a = acc(st.x, st.y);
      st.vx += a[0] * dtp / 2; st.vy += a[1] * dtp / 2;

      const r = Math.hypot(st.x, st.y);
      if (r < RE) { st.done = true; st.msg = '대기권 재진입 — 속도가 부족했습니다'; return; }
      if (r > RE * 12) { st.done = true; st.msg = '지구 중력권 탈출 — 돌아오지 않습니다'; return; }

      st.trail.push([st.x, st.y]);
      if (st.trail.length > 2400) st.trail.shift();

      // 케플러 제2법칙: 일정 시간마다 쓸고 간 부채꼴을 얼려 둔다
      st.cur.push([st.x, st.y]);
      st.secT += dt;
      if (st.secT > 1.1) {
        st.secT = 0;
        if (st.cur.length > 2) st.sectors.push(st.cur);
        if (st.sectors.length > 8) st.sectors.shift();
        st.cur = [[st.x, st.y]];
      }
    },

    graphs: [
      { title: '고도 – 시간', xmin: 10, window: 30, series: [{ key: 'alt', label: '고도 (km)', color: C.h }] },
      { title: '속력 – 시간', xmin: 10, window: 30, series: [{ key: 'sp', label: 'v (km/s)', color: C.v }] }
    ],
    sample(st) {
      const r = Math.hypot(st.x, st.y);
      return { alt: (r - RE) / 1000, sp: Math.hypot(st.vx, st.vy) / 1000 };
    },

    readouts(st, p) {
      const r = Math.hypot(st.x, st.y), v = Math.hypot(st.vx, st.vy);
      const inv_a = 2 / r - v * v / MU;
      const a = inv_a > 1e-12 ? 1 / inv_a : Infinity;
      const hAng = Math.abs(st.x * st.vy - st.y * st.vx);
      const e = isFinite(a) ? Math.sqrt(Math.max(0, 1 - hAng * hAng / (MU * a))) : Math.sqrt(1 + hAng * hAng * (-inv_a) / MU);
      const vc = Math.sqrt(MU / r);
      return [
        { label: '현재 고도', value: (r - RE) / 1000, unit: 'km', color: C.h, dec: 0 },
        { label: '현재 속력 v', value: v / 1000, unit: 'km/s', color: C.v },
        { label: '이 높이의 원궤도 속도', value: vc / 1000, unit: 'km/s' },
        { label: '탈출 속도', value: Math.SQRT2 * vc / 1000, unit: 'km/s', color: '#fb7185' },
        { label: '이심률 e', value: e, unit: '', color: C.e, dec: 3 },
        { label: '공전 주기 T', value: isFinite(a) ? 2 * Math.PI * Math.sqrt(a * a * a / MU) / 60 : NaN, unit: '분', color: C.T, dec: 1 },
        { label: '근지점 고도', value: isFinite(a) ? (a * (1 - e) - RE) / 1000 : NaN, unit: 'km', dec: 0 },
        { label: '원지점 고도', value: isFinite(a) ? (a * (1 + e) - RE) / 1000 : NaN, unit: 'km', dec: 0 },
        { label: '궤도 형태', wide: true, color: !isFinite(a) ? '#fb7185' : (e < .02 ? '#34d399' : '#fbbf24'),
          value: !isFinite(a) ? '탈출 궤도 (포물선/쌍곡선)' : (e < .02 ? '원 궤도' : '타원 궤도') }
      ];
    },

    notes: [
      '위성은 <b>계속 떨어지고 있습니다</b>. 다만 옆으로 충분히 빨라서, 떨어지는 만큼 지면이 휘어져 도달하지 못할 뿐입니다.',
      '배율을 1.0에서 조금만 올려 보세요. 던진 지점이 <b>근지점</b>이 되고 반대편이 부풀어 오릅니다.',
      '√2 ≈ 1.41배가 <b>탈출 속도</b>입니다. 그 이상이면 다시 돌아오지 않습니다.',
      '주황색 부채꼴들은 <b>같은 시간</b> 동안 쓸고 간 넓이입니다. 모양은 달라도 <b>넓이는 같습니다</b>(케플러 제2법칙).',
      '주기는 장반경 a로만 정해집니다. 찌그러진 타원이든 원이든 a가 같으면 주기도 같습니다.'
    ],
    presets: [
      { name: '국제우주정거장 (400 km 원)', set: { h: 400, vr: 1 } },
      { name: '타원 궤도', set: { h: 500, vr: 1.2 } },
      { name: '탈출 궤도 (√2배)', set: { h: 500, vr: 1.42 } },
      { name: '속도 부족 → 재진입', set: { h: 800, vr: .82 } },
      { name: '고고도 원궤도', set: { h: 4000, vr: 1 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      // 화면 배율: 지금까지의 최대 반경이 들어오도록
      let rmax = RE * 1.35;
      st.trail.forEach(q => rmax = Math.max(rmax, Math.hypot(q[0], q[1]) * 1.12));
      rmax = Math.max(rmax, Math.hypot(st.x, st.y) * 1.12);
      const k = Math.min(w, h) * .43 / rmax;
      const ox = w * .42, oy = h * .5;
      const X = x => ox + x * k, Y = y => oy - y * k;

      // 별
      ctx.save();
      for (let i = 0; i < 70; i++) {
        const sx = (i * 149.3) % w, sy = (i * 87.7) % h;
        ctx.globalAlpha = .12 + (i % 5) * .06;
        ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, 1.4, 1.4);
      }
      ctx.restore();

      // 지구 (부채꼴보다 먼저 — 저궤도에서는 부채꼴이 지구와 겹치기 때문)
      const RP = RE * k;
      ctx.save();
      const eg = ctx.createRadialGradient(X(0) - RP * .3, Y(0) - RP * .3, RP * .1, X(0), Y(0), RP);
      eg.addColorStop(0, '#4a9de0'); eg.addColorStop(.7, '#1e5a94'); eg.addColorStop(1, '#0d2f52');
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(X(0), Y(0), RP, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(94,234,212,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(X(0), Y(0), RP * 1.04, 0, 7); ctx.stroke();   // 대기권
      ctx.restore();
      D.text(ctx, '지구', X(0), Y(0) + 4, { size: 12, color: 'rgba(255,255,255,.55)', align: 'center' });

      // 케플러 2법칙 부채꼴 (같은 시간 동안 쓸고 간 넓이)
      st.sectors.concat([st.cur]).forEach((sec, i) => {
        if (sec.length < 3) return;
        ctx.save();
        ctx.globalAlpha = i === st.sectors.length ? .45 : .28;
        ctx.fillStyle = i % 2 ? '#fbbf24' : '#f472b6';
        ctx.beginPath(); ctx.moveTo(X(0), Y(0));
        sec.forEach(q => ctx.lineTo(X(q[0]), Y(q[1])));
        ctx.closePath(); ctx.fill();
        ctx.restore();
      });

      // 궤도 자취
      ctx.save();
      ctx.strokeStyle = 'rgba(94,234,212,.75)'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      st.trail.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])));
      ctx.stroke(); ctx.restore();

      // 반지름 벡터
      D.line(ctx, X(0), Y(0), X(st.x), Y(st.y), { color: C.r, dash: [4, 5], width: hl === 'r' ? 2.2 : 1.2, hot: hl === 'r' });
      const r = Math.hypot(st.x, st.y), v = Math.hypot(st.vx, st.vy);
      if (hl === 'r') D.tag(ctx, 'r = ' + fmt(r / 1000, 0) + ' km', (X(0) + X(st.x)) / 2, (Y(0) + Y(st.y)) / 2, C.r, true);

      // 위성 + 속도 화살표
      const sx = X(st.x), sy = Y(st.y);
      const vs = clamp(v / 1000 * 11, 16, 90);
      D.arrow(ctx, sx, sy, st.vx / v * vs, -st.vy / v * vs,
        { color: C.v, width: 3, hot: hl === 'v', label: fmt(v / 1000, 2) + ' km/s', ly: -14 });
      ctx.save();
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 7); ctx.fill();
      ctx.restore();

      // 발사점 표시
      const r0 = RE + p.h * 1000;
      D.dot(ctx, X(r0), Y(0), 3.5, C.h, hl === 'h');
      D.text(ctx, '발사점 h = ' + fmt(p.h, 0) + ' km', X(r0) + 8, Y(0) - 8, { size: 10, color: C.h, bold: hl === 'h' });

      // 상단 정보
      D.text(ctx, '속도 배율 k = ' + fmt(p.vr, 2) + ' × 원궤도 속도', 18, 24,
        { size: 12, color: hl === 'vr' ? '#fff' : C.vr, bold: hl === 'vr' });
      D.text(ctx, '(√2 = 1.41 이상이면 탈출)', 18, 42, { size: 10.5, color: '#4a5878' });
      D.text(ctx, '같은 색 부채꼴 = 같은 시간 동안 쓸고 간 넓이 (케플러 2법칙)', 18, h - 16, { size: 10.5, color: '#61719a' });
      D.text(ctx, '시간 배속 ×' + TS, w - 18, 24, { size: 10.5, color: '#4a5878', align: 'right' });

      if (st.done) D.tag(ctx, st.msg + ' — ↺ 처음으로', w / 2, 26, '#fb7185', true);
    }
  });
})();
