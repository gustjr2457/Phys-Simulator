/* 포물선 운동 — x = v₀cosθ·t,  y = v₀sinθ·t − ½gt²,  R = v₀²sin2θ/g,  H = v₀²sin²θ/(2g)
   비스듬히 던진 공의 움직임을 가로와 세로로 나누어 본다. 가로로는 아무 힘도 받지 않으니
   같은 빠르기로 가고(등속도), 세로로는 중력만 받으니 위로 던진 공과 똑같이 움직인다(등가속도).
   땅 위 그림자와 왼쪽 벽 그림자가 그 두 움직임이고, 둘을 합친 것이 포물선이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { v0: PAL.violet, th: PAL.teal, g: PAL.amber, vx: PAL.steel, vy: PAL.dusty,
              x: PAL.steel, y: PAL.dusty, R: PAL.sage, H: PAL.burnt, tf: PAL.ink2 };
  const RAD = Math.PI / 180;

  const vx0 = p => p.v0 * Math.cos(p.th * RAD);
  const vy0 = p => p.v0 * Math.sin(p.th * RAD);
  const range = p => p.v0 * p.v0 * Math.sin(2 * p.th * RAD) / p.g;
  const height = p => vy0(p) * vy0(p) / (2 * p.g);
  const flight = p => 2 * vy0(p) / p.g;
  // 자취 간격 — 비행 시간에 맞춰 6~12개가 찍히는 깔끔한 값
  const markStep = p => { const T = flight(p); return [.1, .2, .25, .5, 1, 2, 5].find(s => T / s <= 12) || 5; };

  PS.register({
    id: 'b-projectile',
    mode: 'basic',
    category: '역학과 에너지',
    title: '포물선 운동',
    sub: 'R = v₀² sin2θ ⁄ g',
    tagline: '비스듬히 던진 공은 가로로는 같은 빠르기로, 세로로는 중력에 끌려 움직입니다. 각도를 바꾸며 몇 도에서 가장 멀리 가는지 찾아보세요.',

    params: [
      { key: 'v0', symbol: 'v₀', label: '던지는 속력', unit: 'm/s', min: 5, max: 30, step: .5, value: 18, color: C.v0, reset: true, dec: 1,
        where: '발사대에서 뻗은 <b>보라색 화살표</b>의 길이입니다. 공이 손을 떠나는 순간의 빠르기이므로, 값을 바꾸면 처음부터 다시 던집니다.' },
      { key: 'th', symbol: 'θ', label: '던지는 각도', unit: '°', min: 5, max: 85, step: 1, value: 60, color: C.th, reset: true, dec: 0,
        where: '발사대의 <b>청록색 부채꼴</b>로 표시한, 땅과 보라색 화살표 사이의 각입니다. 0°면 땅과 나란히, 90°면 바로 위로 던집니다.' },
      { key: 'g', symbol: 'g', label: '중력 가속도', unit: 'm/s²', min: 1.6, max: 25, step: .1, value: 9.8, color: C.g, reset: true, dec: 1,
        where: '공에 붙은 <b>주황색 아래 화살표</b>입니다. 늘 똑같이 아래로만 당깁니다 — 지구 9.8, 달 1.6, 화성 3.7, 목성 24.8 m/s².' }
    ],
    vars: {
      x: { symbol: 'x', label: '가로 위치', unit: 'm', color: C.x,
        where: '공 바로 아래 <b>땅 위의 파란 그림자</b>입니다. 자취 점 사이의 가로 간격이 늘 같아서, 그림자는 같은 빠르기로 미끄러집니다.' },
      y: { symbol: 'y', label: '높이', unit: 'm', color: C.y,
        where: '<b>왼쪽 세로 눈금 위의 분홍 그림자</b>입니다. 위로 곧장 던진 공처럼 올라가며 느려지고, 내려오며 빨라집니다.' },
      t: { symbol: 't', label: '시간', unit: 's', color: C.tf,
        where: '공이 손을 떠난 뒤 흐른 시간입니다. 궤적 위의 <b>회색 자취 점</b>이 같은 시간 간격마다 찍힌 위치입니다.' },
      R: { symbol: 'R', label: '사거리', unit: 'm', color: C.R,
        where: '공이 떨어진 뒤 땅 아래에 나타나는 <b>초록색 치수선</b>입니다. 던진 곳에서 떨어진 곳까지의 가로 거리입니다.' },
      H: { symbol: 'H', label: '최고 높이', unit: 'm', color: C.H,
        where: '공이 꼭대기를 지나면 나타나는 <b>주홍색 세로 치수선</b>입니다. 꼭대기에서는 세로 속도가 0이 됩니다.' },
      tf: { symbol: 'T', label: '비행 시간', unit: 's', color: C.tf,
        where: '손을 떠나서 땅에 닿을 때까지 걸린 시간입니다. 측정값 칸의 <b>"날아간 시간"</b>이 착지하는 순간 이 값에서 멈춥니다.' }
    },
    formulas: [
      { name: '가로 — 같은 빠르기', tpl: '{x} = {v0}cos{th} · {t}' },
      { name: '세로 — 중력이 당긴다', tpl: '{y} = {v0}sin{th} · {t} − ½{g}{t}²' },
      { name: '사거리', tpl: '{R} = {v0}² sin2{th} ⁄ {g}' },
      { name: '최고 높이', tpl: '{H} = {v0}² sin²{th} ⁄ (2{g})' },
      { name: '비행 시간', tpl: '{tf} = 2{v0}sin{th} ⁄ {g}' }
    ],

    init(p) {
      return { x: 0, y: 0, vx: vx0(p), vy: vy0(p), ymax: 0, apex: false, tLand: 0,
               marks: [{ x: 0, y: 0 }], nextMark: 1, dm: markStep(p), done: false };
    },

    step(st, p, dt) {
      const T = st.t + dt, ux = vx0(p), uy = vy0(p);
      // 같은 시간 간격의 자취 — 찍는 순간의 정확한 위치(해석해)로 남긴다
      while (st.nextMark * st.dm <= T) {
        const tm = st.nextMark * st.dm, ym = uy * tm - .5 * p.g * tm * tm;
        if (ym < 0) break;
        st.marks.push({ x: ux * tm, y: ym }); st.nextMark++;
      }
      let y = uy * T - .5 * p.g * T * T;
      if (y <= 0 && T > 0) {                       // 착지 — 땅에 닿는 순간에 멈춘다
        const tl = 2 * uy / p.g;
        st.tLand = tl; st.x = ux * tl; st.y = 0; st.vx = ux; st.vy = -uy;
        st.apex = true; st.done = true;
        return;
      }
      st.x = ux * T; st.y = y; st.vx = ux; st.vy = uy - p.g * T;
      if (st.y > st.ymax) st.ymax = st.y;
      if (st.vy <= 0) st.apex = true;
    },

    graphs: [
      { title: '속도 성분 – 시간 (가로는 그대로, 세로만 줄어든다)', xmin: 3,
        series: [{ key: 'vx', label: 'vx (m/s)', color: C.vx }, { key: 'vy', label: 'vy (m/s)', color: C.vy }] },
      { title: '높이 – 시간', xmin: 3, y0: 0, series: [{ key: 'y', label: 'y (m)', color: C.y }] }
    ],
    sample(st) { return { vx: st.vx, vy: st.vy, y: st.y }; },

    readouts(st, p) {
      const pct = Math.sin(2 * p.th * RAD) * 100;
      return [
        { label: '가로 속도 vx', value: st.vx, unit: 'm/s', color: C.vx, dec: 2 },
        { label: '세로 속도 vy', value: st.vy, unit: 'm/s', color: C.vy, dec: 2 },
        { label: '가로 위치 x', value: st.x, unit: 'm', color: C.x, dec: 2 },
        { label: '높이 y', value: st.y, unit: 'm', color: C.y, dec: 2 },
        { label: '지금까지 최고 높이', value: st.ymax, unit: 'm', color: C.H, dec: 2 },
        { label: '날아간 시간', value: st.done ? st.tLand : st.t, unit: 's', color: C.tf, dec: 2 },
        { label: '예상 사거리 R', value: range(p), unit: 'm', color: C.R, dec: 2 },
        { label: '예상 최고 높이 H', value: height(p), unit: 'm', color: C.H, dec: 2 },
        { label: '예상 비행 시간 T', value: flight(p), unit: 's', color: C.tf, dec: 2 },
        { label: '속력 √(vx²+vy²)', value: Math.hypot(st.vx, st.vy), unit: 'm/s', color: C.v0, dec: 2 },
        { label: '45°로 던질 때와 비교', wide: true, color: Math.abs(p.th - 45) < .5 ? C.R : PAL.amber,
          value: '사거리가 같은 속력 최대치의 ' + fmt(pct, 1) + ' %' + (Math.abs(p.th - 45) >= .5 ? '  ·  ' + fmt(90 - p.th, 0) + '° 로 던져도 같은 거리' : '  (최대!)') }
      ];
    },

    notes: [
      '호스로 물을 비스듬히 뿌리면 물줄기가 둥글게 휩니다. <b>가로로는 같은 빠르기로 가고, 세로로만 중력이 끌어내리기</b> 때문입니다.',
      '자취 점의 <b>가로 간격은 늘 같고</b> 세로 간격만 바뀝니다. 땅 위 그림자는 등속도, 왼쪽 그림자는 위로 던진 공과 똑같이 움직입니다.',
      '같은 속력이면 <b>45°에서 가장 멀리</b> 갑니다. 30°와 60°처럼 더해서 90°인 두 각은 사거리가 같습니다 — 높이와 시간은 다릅니다.',
      '<b>꼭대기에서도 공은 멈추지 않습니다.</b> 세로 속도만 0이 되고, 가로 속도는 처음 그대로입니다. (회색 v 화살표가 옆을 향합니다)',
      '달은 g가 지구의 약 1/6이라 같은 공이 <b>6배 멀리</b> 갑니다. 실제 지구에서는 공기 저항 때문에 45°보다 조금 낮은 각이 더 멀리 갑니다.'
    ],
    presets: [
      { name: '45° — 가장 멀리', set: { v0: 20, th: 45, g: 9.8 } },
      { name: '30°', set: { v0: 20, th: 30, g: 9.8 } },
      { name: '60° — 30°와 같은 거리', set: { v0: 20, th: 60, g: 9.8 } },
      { name: '거의 수직 (85°)', set: { v0: 20, th: 85, g: 9.8 } },
      { name: '달에서 45° (g = 1.6)', set: { v0: 20, th: 45, g: 1.6 } }
    ],
    challenges: [
      {
        id: 'target', title: '30 m 앞에 정확히 떨어뜨리기',
        desc: '지구 중력(g = 9.8)에서 공이 29.5 ~ 30.5 m 사이에 떨어지게 던져 보세요.',
        hint: '측정값의 "예상 사거리 R"을 보며 각도를 맞추세요. 답은 낮은 각 하나, 높은 각 하나 — 두 개 있습니다.',
        check: ({ P, st }) => st.done && Math.abs(P.g - 9.8) < .05 && Math.abs(st.x - 30) <= .5
      },
      {
        id: 'high', title: '20 m 높이 넘기기',
        desc: '지구 중력(g = 9.8)에서 공을 20 m 보다 높이 올려 보세요.',
        hint: '최고 높이는 세로 속도 v₀sinθ 로만 정해집니다. 속력을 키우고, 각도를 90° 쪽으로 세우세요.',
        check: ({ P, st }) => Math.abs(P.g - 9.8) < .05 && st.ymax >= 20
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600;
      const R = range(p), H = height(p), ux = vx0(p), uy = vy0(p);
      // 속도 화살표 비율 — 던지는 속력(최대 30 m/s)이 화면 크기에 맞는 길이가 되게
      // (처음엔 화면의 16 % 로 잡았더니 1초 장면에서 화살표가 공 크기만 해 라벨이 공 위에 뭉쳤다)
      const LMAX = clamp(Math.min(w, h) * .36, 70, 160);
      const ka = LMAX / 30;
      // 여백 — 왼쪽: 높이 눈금, 오른쪽: 착지 직전의 가로 속도 화살표, 아래: 착지 직전의 세로 속도 화살표
      const padL = narrow ? 52 : 70, padR = Math.max(28, ux * ka + 22), padT = 56;
      const padB = Math.max(58, uy * ka + 14);
      const W = w - padL - padR, Hh = h - padT - padB;
      // 가로·세로 같은 비율 — 그래야 화면의 각도가 실제 각도와 같다
      const k = Math.min(W / Math.max(R, 1), Hh / Math.max(H, .5));
      const X0 = padL, GY = h - padB;
      const X = x => X0 + x * k, Y = y => GY - y * k;
      const axX = X0 - (narrow ? 26 : 34);

      // 땅
      D.ground(ctx, 14, w - 14, GY, 0);
      // 높이 눈금 (왼쪽 벽)
      D.line(ctx, axX, GY, axX, Y(H) - 10, { color: 'rgba(167,170,176,.35)', width: 1.5 });
      D.text(ctx, '높이', axX, Y(H) - 16, { size: 10, color: PAL.ink3, align: 'center' });

      // 같은 시간 간격의 자취 + 두 그림자 눈금
      const hotX = hl === 'x', hotY = hl === 'y', hotT = hl === 't';
      st.marks.forEach((m, i) => {
        const mx = X(m.x), my = Y(m.y);
        if (i) D.line(ctx, mx, my, mx, GY, { color: 'rgba(167,170,176,.14)', dash: [2, 4] });
        D.dot(ctx, mx, GY, hotX ? 3.5 : 2.5, C.x, hotX);
        D.dot(ctx, axX, my, hotY ? 3.5 : 2.5, C.y, hotY);
        D.dot(ctx, mx, my, hotT ? 5 : 4, hotT ? '#e6e7ea' : 'rgba(167,170,176,.55)', hotT);
      });
      // 설명 글은 오른쪽 아래 — 위쪽은 착지 표시와 궤적 꼭대기 자리
      D.text(ctx, '회색 점: ' + fmt(st.dm, st.dm < 1 ? 2 : 0) + '초마다 찍은 위치', w - 14, h - 10,
        { size: 10.5, color: hotT ? '#e6e7ea' : PAL.ink3, bold: hotT, align: 'right' });

      // 지나온 궤적
      ctx.save(); ctx.strokeStyle = 'rgba(169,140,196,.55)'; ctx.lineWidth = 2; ctx.beginPath();
      const tEnd = st.done ? st.tLand : st.t, n = 80;
      for (let i = 0; i <= n; i++) {
        const tt = tEnd * i / n, xx = X(ux * tt), yy = Y(Math.max(0, uy * tt - .5 * p.g * tt * tt));
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke(); ctx.restore();

      // 발사대 — 각도 부채꼴과 처음 속도
      const a = p.th * RAD, ar = narrow ? 30 : 38;
      ctx.save(); ctx.fillStyle = 'rgba(104,184,176,' + (hl === 'th' ? .3 : .14) + ')';
      ctx.strokeStyle = C.th; ctx.lineWidth = hl === 'th' ? 2.4 : 1.4;
      ctx.beginPath(); ctx.moveTo(X0, GY); ctx.arc(X0, GY, ar, -a, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      D.text(ctx, 'θ = ' + fmt(p.th, 0) + '°', X0 + ar + 6, GY - 6, { size: 11, color: C.th, bold: hl === 'th' });
      D.arrow(ctx, X0, GY, p.v0 * ka * Math.cos(a), -p.v0 * ka * Math.sin(a),
        { color: C.v0, width: hl === 'v0' ? 3 : 2.4, hot: hl === 'v0', label: 'v₀', lx: -14, ly: -6 });

      // 최고 높이 · 사거리 — 실제로 지나간 뒤에 나타난다
      if (st.apex) D.dim(ctx, X(R / 2), GY, X(R / 2), Y(H), 'H = ' + fmt(H, 1) + ' m', C.H, hl === 'H');
      if (st.done) D.dim(ctx, X0, GY + 30, X(R), GY + 30, 'R = ' + fmt(R, 1) + ' m', C.R, hl === 'R');

      // 공과 그림자
      const bx = X(st.x), by = Y(st.y) - 6;
      D.dot(ctx, bx, GY, hotX ? 6 : 5, C.x, hotX);
      D.dot(ctx, axX, Y(st.y), hotY ? 6 : 5, C.y, hotY);
      D.line(ctx, bx, by, bx, GY, { color: 'rgba(111,159,196,.35)', dash: [3, 3] });
      D.line(ctx, axX, Y(st.y), bx, Y(st.y), { color: 'rgba(192,128,152,.3)', dash: [3, 3] });
      D.dot(ctx, bx, by, 7, '#e6e7ea');
      if (hotX || hotY) D.tag(ctx, hotX ? 'x = ' + fmt(st.x, 1) + ' m' : 'y = ' + fmt(st.y, 1) + ' m',
        hotX ? bx : axX + 4, hotX ? GY + 14 : Y(st.y), hotX ? C.x : C.y, true, hotX ? undefined : 'left');

      // 속도 성분과 중력 — 날아가는 동안만
      if (!st.done) {
        D.arrow(ctx, bx, by, st.vx * ka, 0, { color: C.vx, width: 3, hot: hl === 'vx', label: 'vx', ly: 14 });
        D.arrow(ctx, bx, by, 0, -st.vy * ka, { color: C.vy, width: 3, hot: hl === 'vy', label: 'vy', lx: -18, ly: 0 });
        D.arrow(ctx, bx, by, st.vx * ka, -st.vy * ka, { color: 'rgba(230,231,234,.7)', width: 1.6, head: 8, label: 'v', ly: -12 });
        // 중력은 공의 왼쪽 아래에 — 오른쪽의 vx 화살표·라벨과 겹치지 않게
        D.arrow(ctx, bx - 14, by + 8, 0, Math.max(6, p.g * ka),
          { color: C.g, width: 2.2, head: 8, hot: hl === 'g', label: 'g', lx: -12, ly: 0 });
        if (st.apex && Math.abs(st.vy) < uy * .12)
          D.tag(ctx, '꼭대기: vy = 0, vx 는 그대로', bx, by - 34, C.vy, false);
      } else {
        D.tag(ctx, '착지! ' + fmt(st.tLand, 2) + ' s 동안 ' + fmt(st.x, 1) + ' m — ↺ 다시 던지기', w / 2, 22, PAL.amber, true);
      }
    }
  });
})();
