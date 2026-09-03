/* [항공우주공학] 호만 전이 궤도 — 두 번의 점화로 궤도를 바꾸기 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { h1: '#5eead4', h2: '#fbbf24', dv1: '#34d399', dv2: '#f472b6', dv: '#a78bfa', tt: '#60a5fa' };
  const MU = 3.986e14, RE = 6.371e6, TS = 1400;

  const r1of = p => RE + p.h1 * 1000;
  const r2of = p => RE + p.h2 * 1000;
  const dv1of = p => { const r1 = r1of(p), r2 = r2of(p); return Math.sqrt(MU / r1) * (Math.sqrt(2 * r2 / (r1 + r2)) - 1); };
  const dv2of = p => { const r1 = r1of(p), r2 = r2of(p); return Math.sqrt(MU / r2) * (1 - Math.sqrt(2 * r1 / (r1 + r2))); };
  const ttof = p => Math.PI * Math.sqrt(Math.pow((r1of(p) + r2of(p)) / 2, 3) / MU);

  PS.register({
    id: 'space-hohmann', mode: 'adv', category: '항공우주공학',
    title: '호만 전이 궤도',
    sub: 'Δv₁ + Δv₂',
    tagline: '낮은 궤도에서 높은 궤도로 옮겨 가는 가장 연료가 적게 드는 방법. 정지위성은 모두 이 길로 갑니다.',

    params: [
      { key: 'h1', symbol: 'h₁', label: '출발 궤도 고도', unit: 'km', min: 300, max: 2000, step: 50, value: 400, color: C.h1, reset: true, dec: 0,
        where: '<b>청록색 안쪽 원</b>입니다. 보통 로켓이 먼저 도달하는 저궤도(LEO)이며, 여기서 첫 번째 점화를 합니다.' },
      { key: 'h2', symbol: 'h₂', label: '목표 궤도 고도', unit: 'km', min: 1000, max: 40000, step: 500, value: 35786, color: C.h2, reset: true, dec: 0,
        where: '<b>노란색 바깥 원</b>입니다. 35,786 km가 지구 자전과 같은 주기를 갖는 <b>정지궤도(GEO)</b>입니다. 멀수록 Δv도 전이 시간도 커집니다.' }
    ],
    vars: {
      dv1: { symbol: 'Δv₁', label: '1차 점화 (근지점)', unit: 'm/s', color: C.dv1,
        where: '출발 원궤도에서 <b>진행 방향으로</b> 가속하는 첫 점화(초록 화살표)입니다. 이 순간 궤도가 원에서 타원으로 늘어납니다.' },
      dv2: { symbol: 'Δv₂', label: '2차 점화 (원지점)', unit: 'm/s', color: C.dv2,
        where: '타원의 가장 먼 지점에 도착했을 때 하는 <b>두 번째 가속</b>(분홍 화살표)입니다. 이걸 하지 않으면 다시 출발 고도로 떨어집니다.' },
      dv: { symbol: 'Δv', label: '총 속도 변화량', unit: 'm/s', color: C.dv,
        where: '두 점화의 합이며, 곧 <b>필요한 연료의 양</b>입니다. 로켓 설계의 화폐 단위와 같습니다.' },
      tt: { symbol: 't', label: '전이 시간', unit: '시간', color: C.tt,
        where: '전이 타원의 <b>절반</b>을 도는 시간입니다. LEO→GEO는 약 5.3시간이 걸립니다.' }
    },
    formulas: [
      { name: '1차 점화', tpl: '{dv1} = √(μ⁄r₁) · ( √( 2r₂⁄(r₁+r₂) ) − 1 )' },
      { name: '2차 점화', tpl: '{dv2} = √(μ⁄r₂) · ( 1 − √( 2r₁⁄(r₁+r₂) ) )' },
      { name: '총 Δv', tpl: '{dv} = {dv1} + {dv2}' },
      { name: '전이 시간', tpl: '{tt} = π √( a³⁄μ ) ,  a = (r₁+r₂)⁄2' }
    ],

    init(p) {
      const r1 = r1of(p);
      return {
        x: r1, y: 0, vx: 0, vy: Math.sqrt(MU / r1),
        phase: 0, trail: [], flash: -9, wait: 0, done: false, prevRdot: 0
      };
    },

    step(st, p, dt) {
      const dtp = dt * TS;
      const acc = (x, y) => { const r = Math.hypot(x, y); const kk = -MU / (r * r * r); return [kk * x, kk * y]; };
      let a = acc(st.x, st.y);
      st.vx += a[0] * dtp / 2; st.vy += a[1] * dtp / 2;
      st.x += st.vx * dtp; st.y += st.vy * dtp;
      a = acc(st.x, st.y);
      st.vx += a[0] * dtp / 2; st.vy += a[1] * dtp / 2;

      const r = Math.hypot(st.x, st.y), v = Math.hypot(st.vx, st.vy);
      const rdot = (st.x * st.vx + st.y * st.vy) / r;

      if (st.phase === 0) {                      // 출발 원궤도에서 잠시 대기 후 1차 점화
        st.wait += dt;
        if (st.wait > 1.6) {
          const f = (v + dv1of(p)) / v;
          st.vx *= f; st.vy *= f;
          st.phase = 1; st.flash = st.t; st.trail = [];
        }
      } else if (st.phase === 1) {               // 원지점(반지름 속도 부호 반전)에서 2차 점화
        if (st.prevRdot > 0 && rdot <= 0 && r > r1of(p) * 1.2) {
          const f = (v + dv2of(p)) / v;
          st.vx *= f; st.vy *= f;
          st.phase = 2; st.flash = st.t;
        }
      }
      st.prevRdot = rdot;

      st.trail.push([st.x, st.y]);
      if (st.trail.length > 3000) st.trail.shift();
      if (r < RE) st.done = true;
    },

    graphs: [
      { title: '고도 – 시간', xmin: 10, window: 40, series: [{ key: 'alt', label: '고도 (km)', color: C.h2 }] },
      { title: '속력 – 시간', xmin: 10, window: 40, series: [{ key: 'sp', label: 'v (km/s)', color: C.tt }] }
    ],
    sample(st) {
      const r = Math.hypot(st.x, st.y);
      return { alt: (r - RE) / 1000, sp: Math.hypot(st.vx, st.vy) / 1000 };
    },

    readouts(st, p) {
      const r = Math.hypot(st.x, st.y);
      const names = ['① 출발 원궤도 대기', '② 전이 타원 비행 중', '③ 목표 궤도 진입 완료'];
      return [
        { label: '1차 점화 Δv₁', value: dv1of(p), unit: 'm/s', color: C.dv1, dec: 0 },
        { label: '2차 점화 Δv₂', value: dv2of(p), unit: 'm/s', color: C.dv2, dec: 0 },
        { label: '총 Δv', value: dv1of(p) + dv2of(p), unit: 'm/s', color: C.dv, dec: 0, wide: true },
        { label: '전이 시간', value: ttof(p) / 3600, unit: '시간', color: C.tt },
        { label: '현재 고도', value: (r - RE) / 1000, unit: 'km', dec: 0 },
        { label: '현재 속력', value: Math.hypot(st.vx, st.vy) / 1000, unit: 'km/s' },
        { label: '목표 궤도 주기', value: 2 * Math.PI * Math.sqrt(Math.pow(r2of(p), 3) / MU) / 3600, unit: '시간' },
        { label: '단계', value: names[st.phase], wide: true, color: ['#5eead4', '#fbbf24', '#34d399'][st.phase] }
      ];
    },

    notes: [
      '궤도를 바꾸려면 <b>속도를 바꿔야</b> 합니다. 우주에서 "위로 올라간다"는 것은 곧 "빨라진다"는 뜻입니다.',
      '점화는 <b>두 번</b> 필요합니다. 한 번만 하면 타원을 그리며 다시 출발 고도로 되돌아옵니다.',
      '호만 전이는 <b>연료가 가장 적게</b> 드는 방법입니다. 대신 시간이 오래 걸립니다 — 연료와 시간의 맞교환입니다.',
      'LEO(400 km) → GEO(35,786 km)는 총 Δv 약 <b>3.9 km/s</b>, 시간 약 5.3시간이 듭니다.',
      '점화는 반드시 <b>근지점과 원지점</b>에서 해야 효율이 가장 좋습니다.'
    ],
    presets: [
      { name: 'LEO → 정지궤도(GEO)', set: { h1: 400, h2: 35786 } },
      { name: 'LEO → 중궤도(MEO)', set: { h1: 400, h2: 20200 } },
      { name: '가까운 궤도 변경', set: { h1: 400, h2: 1000 } },
      { name: '아주 먼 궤도', set: { h1: 400, h2: 40000 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const r1 = r1of(p), r2 = r2of(p);
      const rmax = Math.max(r1, r2) * 1.22;
      const k = Math.min(w * .82, h) * .45 / rmax;
      const ox = w * .40, oy = h * .5;
      const X = x => ox + x * k, Y = y => oy - y * k;

      ctx.save();
      for (let i = 0; i < 60; i++) {
        ctx.globalAlpha = .1 + (i % 5) * .05; ctx.fillStyle = '#fff';
        ctx.fillRect((i * 173.1) % w, (i * 97.3) % h, 1.4, 1.4);
      }
      ctx.restore();

      // 출발/목표 원궤도
      const circle = (rr, col, hot, label) => {
        ctx.save();
        ctx.strokeStyle = col; ctx.lineWidth = hot ? 2.4 : 1.4;
        ctx.globalAlpha = hot ? 1 : .6;
        if (hot) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
        ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.arc(X(0), Y(0), rr * k, 0, 7); ctx.stroke();
        ctx.restore();
        D.text(ctx, label, X(0), Y(0) - rr * k - 8, { size: 10.5, color: col, align: 'center', bold: hot });
      };
      circle(r1, C.h1, hl === 'h1', '출발 궤도 ' + fmt(p.h1, 0) + ' km');
      circle(r2, C.h2, hl === 'h2', '목표 궤도 ' + fmt(p.h2, 0) + ' km');

      // 실제 자취 (전이 타원은 비행하면서 그대로 그려집니다)
      ctx.save();
      ctx.strokeStyle = st.phase === 1 ? 'rgba(167,139,250,.95)' : 'rgba(94,234,212,.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      st.trail.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])));
      ctx.stroke(); ctx.restore();

      // 지구
      const RP = Math.max(6, RE * k);
      ctx.save();
      const eg = ctx.createRadialGradient(X(0) - RP * .3, Y(0) - RP * .3, RP * .1, X(0), Y(0), RP);
      eg.addColorStop(0, '#4a9de0'); eg.addColorStop(1, '#0d2f52');
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(X(0), Y(0), RP, 0, 7); ctx.fill();
      ctx.restore();

      // 위성
      const sx = X(st.x), sy = Y(st.y), v = Math.hypot(st.vx, st.vy);
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, 7); ctx.fill(); ctx.restore();

      // 점화 화살표(잔상)
      const age = st.t - st.flash;
      if (age < 1.6 && st.phase > 0) {
        const col = st.phase === 1 ? C.dv1 : C.dv2;
        ctx.save(); ctx.globalAlpha = 1 - age / 1.6;
        D.arrow(ctx, sx, sy, st.vx / v * 74, -st.vy / v * 74,
          { color: col, width: 5, hot: true, label: (st.phase === 1 ? 'Δv₁ = ' + fmt(dv1of(p), 0) : 'Δv₂ = ' + fmt(dv2of(p), 0)) + ' m/s', ly: -16 });
        D.dot(ctx, sx, sy, 12 * (1 - age / 1.6) + 4, col);
        ctx.restore();
      }

      // Δv 예산 막대
      const bx = 20, by = h - 96, bw = Math.min(250, w * .28);
      const tot = dv1of(p) + dv2of(p), mx = Math.max(tot, 1) * 1.05;
      D.text(ctx, 'Δv 예산 (= 필요한 연료)', bx, by - 8, { size: 11.5, color: hl === 'dv' ? '#fff' : '#61719a', bold: hl === 'dv' });
      D.bar(ctx, bx, by, bw, 11, dv1of(p), mx, C.dv1, null, hl === 'dv1' || st.phase === 1);
      D.text(ctx, 'Δv₁ ' + fmt(dv1of(p), 0) + ' m/s', bx + bw + 8, by + 10, { size: 10.5, color: C.dv1, bold: hl === 'dv1' });
      D.bar(ctx, bx, by + 18, bw, 11, dv2of(p), mx, C.dv2, null, hl === 'dv2' || st.phase === 2);
      D.text(ctx, 'Δv₂ ' + fmt(dv2of(p), 0) + ' m/s', bx + bw + 8, by + 28, { size: 10.5, color: C.dv2, bold: hl === 'dv2' });
      D.bar(ctx, bx, by + 38, bw, 13, tot, mx, C.dv, null, hl === 'dv');
      D.text(ctx, '합계 ' + fmt(tot, 0) + ' m/s', bx + bw + 8, by + 49, { size: 12, color: C.dv, bold: true });

      // 단계 표시
      const names = ['① 출발 원궤도', '② 전이 타원', '③ 목표 궤도 도착'];
      D.text(ctx, names[st.phase], 20, 26, { size: 13, color: ['#5eead4', '#a78bfa', '#34d399'][st.phase], bold: true });
      D.text(ctx, '전이 시간 ' + fmt(ttof(p) / 3600, 2) + ' 시간 · 시간 배속 ×' + TS, 20, 46, { size: 10.5, color: hl === 'tt' ? '#fff' : '#4a5878' });
      if (st.phase === 2) D.tag(ctx, '목표 궤도 진입 성공 — 원궤도로 안정화되었습니다', w / 2, h - 16, '#34d399', true);
    }
  });
})();
