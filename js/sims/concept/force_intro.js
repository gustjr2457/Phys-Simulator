/* 초급·개념 — 힘이란 무엇인가? (거시세계)
   힘은 크기와 방향을 가진 화살표(벡터)이고, 여러 힘이 동시에 작용하면
   "하나로 합쳐진 힘(알짜힘)"처럼 움직인다는 것. 알짜힘이 0이면 하던 대로
   계속하고(관성), 알짜힘이 있으면 그 방향으로 가속된다는 것을 계산 없이 보여준다.
   고등물리 트랙의 'F = ma'(마찰·수직항력 중심의 1차원 힘 분석)보다 앞서 보는 개념 시뮬. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { F1: '#60a5fa', a1: '#60a5fa', F2: '#f472b6', a2: '#f472b6', net: '#fbbf24' };
  const D2R = Math.PI / 180;

  PS.register({
    id: 'c-force', mode: 'concept', category: '힘과 운동',
    title: '힘이란 무엇인가?',
    sub: '크기와 방향을 가진 화살표 — 여러 힘은 하나로 더해진다',
    tagline: '파란 힘과 분홍 힘, 두 힘을 동시에 걸어 보세요. 상자는 그 둘을 더한 "알짜힘"(노란 화살표) 방향으로만 움직입니다. 두 힘을 정확히 반대로 걸면 상자는 꼼짝하지 않습니다.',

    params: [
      { key: 'F1', symbol: 'F₁', label: '힘 1의 크기', unit: '', min: 0, max: 8, step: .2, value: 6, color: C.F1,
        where: '<b>파란 화살표</b>의 길이입니다. 0으로 두면 이 힘은 없는 것과 같습니다.' },
      { key: 'a1', symbol: 'θ₁', label: '힘 1의 방향', unit: '°', min: 0, max: 360, step: 5, value: 0, color: C.a1, dec: 0,
        where: '<b>파란 화살표</b>가 가리키는 방향입니다. 0°는 오른쪽, 90°는 위쪽입니다.' },
      { key: 'F2', symbol: 'F₂', label: '힘 2의 크기', unit: '', min: 0, max: 8, step: .2, value: 6, color: C.F2,
        where: '<b>분홍 화살표</b>의 길이입니다. 예를 들어 친구가 반대쪽에서 미는 힘, 또는 바람이나 마찰이라고 생각해도 됩니다.' },
      { key: 'a2', symbol: 'θ₂', label: '힘 2의 방향', unit: '°', min: 0, max: 360, step: 5, value: 180, color: C.a2, dec: 0,
        where: '<b>분홍 화살표</b>가 가리키는 방향입니다. θ₁과 정확히 180° 차이 나면 두 힘은 서로 정반대를 향합니다.' }
    ],
    vars: {
      net: { symbol: 'F_net', label: '알짜힘(합력)', unit: '', color: C.net,
        where: '<b>노란 화살표</b> — 두 힘을 벡터로 더한 결과입니다. 상자는 실제로 이 화살표 방향으로만 가속됩니다. 길이가 0이면(두 힘이 정확히 반대) 상자는 하던 대로(멈춰 있으면 계속 멈춰) 있습니다.' }
    },
    formulas: [
      { name: '힘은 벡터, 더해진다', tpl: '{net} = {F1} + {F2}  (방향까지 더한 벡터 합)' },
      { name: '알짜힘이 0이면', tpl: '{net} = 0  →  하던 대로 계속(관성)' }
    ],

    init(p) {
      return { x: 0, y: 0, vx: 0, vy: 0, trail: [] };
    },

    step(st, p, dt) {
      const a1 = p.a1 * D2R, a2 = p.a2 * D2R;
      const fx = p.F1 * Math.cos(a1) + p.F2 * Math.cos(a2);
      const fy = p.F1 * Math.sin(a1) + p.F2 * Math.sin(a2);
      st.vx += fx * dt; st.vy += fy * dt;
      st.x += st.vx * dt; st.y += st.vy * dt;
      const R = 3.1;
      if (st.x < -R) { st.x = -R; st.vx = Math.abs(st.vx) * .4; }
      if (st.x > R) { st.x = R; st.vx = -Math.abs(st.vx) * .4; }
      if (st.y < -2.1) { st.y = -2.1; st.vy = Math.abs(st.vy) * .4; }
      if (st.y > 2.1) { st.y = 2.1; st.vy = -Math.abs(st.vy) * .4; }
      st.trail.push({ x: st.x, y: st.y });
      if (st.trail.length > 260) st.trail.shift();
    },

    readouts(st, p) {
      const a1 = p.a1 * D2R, a2 = p.a2 * D2R;
      const fx = p.F1 * Math.cos(a1) + p.F2 * Math.cos(a2);
      const fy = p.F1 * Math.sin(a1) + p.F2 * Math.sin(a2);
      const mag = Math.hypot(fx, fy);
      const ang = ((Math.atan2(fy, fx) / D2R) + 360) % 360;
      return [
        { label: '알짜힘 크기', value: mag, dec: 2, color: C.net },
        { label: '알짜힘 방향', value: mag > .05 ? fmt(ang, 0) + '°' : '(없음)', color: C.net, wide: true },
        { label: '상자의 속력', value: Math.hypot(st.vx, st.vy), dec: 2, color: '#e8eefc' }
      ];
    },

    notes: [
      '힘은 숫자 하나가 아니라 <b>크기 + 방향</b>을 함께 가진 화살표(벡터)입니다.',
      '두 힘이 <b>정확히 반대 방향, 같은 크기</b>면 알짜힘이 0이 되어 상자는 멈춘 채로 있습니다 — 줄다리기가 팽팽할 때와 같습니다.',
      '알짜힘이 있으면 상자는 <b>그 화살표 방향으로만</b> 점점 빨라집니다. 방향을 바꾸려면 다른 힘이 더 필요합니다.',
      '"얼마나 빨리 빨라지는가"(F=ma)는 고등물리 트랙의 뉴턴 운동 제2법칙에서 다룹니다.'
    ],
    presets: [
      { name: '힘의 평형(줄다리기)', set: { F1: 6, a1: 0, F2: 6, a2: 180 } },
      { name: '한쪽으로만 밀기', set: { F1: 6, a1: 0, F2: 0, a2: 0 } },
      { name: '대각선으로 밀기', set: { F1: 5, a1: 30, F2: 4, a2: 300 } },
      { name: '비스듬히 반대로', set: { F1: 7, a1: 20, F2: 5, a2: 200 } }
    ],

    challenges: [
      { id: 'ch-equilibrium', title: '다른 각도에서도 평형 만들기',
        desc: '처음 상태(θ₁=0°, θ₂=180°)가 아닌 다른 각도로 두 힘의 방향을 바꿔서, 그래도 상자가 꼼짝 못 하게(알짜힘=0) 만들어보세요.',
        check: ctx => {
          const p = ctx.P, a1 = p.a1 * D2R, a2 = p.a2 * D2R;
          const fx = p.F1 * Math.cos(a1) + p.F2 * Math.cos(a2), fy = p.F1 * Math.sin(a1) + p.F2 * Math.sin(a2);
          const a1n = ((p.a1 % 360) + 360) % 360;
          return Math.hypot(fx, fy) < 0.15 && Math.min(a1n, 360 - a1n) > 15;
        },
        hint: 'F₁=F₂로 맞추고, θ₂를 θ₁+180°로 맞춰보세요 — 이번엔 θ₁을 0°가 아닌 값(예: 45°, θ₂=225°)으로 해보세요.' },
      { id: 'ch-bignet', title: '알짜힘을 10 이상으로 키우기',
        desc: '두 힘을 같은 방향으로 맞춰서, 알짜힘의 크기를 10 이상으로 만들어보세요.',
        check: ctx => {
          const p = ctx.P, a1 = p.a1 * D2R, a2 = p.a2 * D2R;
          const fx = p.F1 * Math.cos(a1) + p.F2 * Math.cos(a2), fy = p.F1 * Math.sin(a1) + p.F2 * Math.sin(a2);
          return Math.hypot(fx, fy) >= 10;
        },
        hint: 'θ₁과 θ₂를 같게 맞추고, F₁과 F₂를 최대로 올려보세요.' }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = PS.view(w, h, { x0: -3.6, x1: 3.6, y0: -2.6, y1: 2.6, pad: 26 });
      D.grid(ctx, w, h, 34);

      // 지나온 자취
      if (st.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(94,234,212,.5)'; ctx.lineWidth = 2;
        ctx.beginPath();
        st.trail.forEach((q, i) => { const px = V.X(q.x), py = V.Y(q.y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
        ctx.stroke();
        ctx.restore();
      }

      const bx = V.X(st.x), by = V.Y(st.y);
      const a1 = p.a1 * D2R, a2 = p.a2 * D2R;
      const fx1 = p.F1 * Math.cos(a1), fy1 = -p.F1 * Math.sin(a1);
      const fx2 = p.F2 * Math.cos(a2), fy2 = -p.F2 * Math.sin(a2);
      const scale = 16;

      // 상자
      ctx.save();
      D.roundRect(ctx, bx - 22, by - 22, 44, 44, 8);
      const g = ctx.createLinearGradient(0, by - 22, 0, by + 22);
      g.addColorStop(0, '#8ba4d8'); g.addColorStop(1, '#4a6ba8');
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();

      // 힘 화살표 두 개
      D.arrow(ctx, bx, by, fx1 * scale, fy1 * scale, { color: C.F1, width: 3, hot: hl === 'F1' || hl === 'a1', label: 'F₁' });
      D.arrow(ctx, bx, by, fx2 * scale, fy2 * scale, { color: C.F2, width: 3, hot: hl === 'F2' || hl === 'a2', label: 'F₂' });

      // 알짜힘(합력) 화살표
      const nfx = fx1 + fx2, nfy = fy1 + fy2;
      const mag = Math.hypot(nfx, nfy);
      if (mag > .08) {
        D.arrow(ctx, bx, by, nfx * scale, nfy * scale, { color: C.net, width: 4.5, hot: hl === 'net', label: '알짜힘', ly: -18 });
      } else {
        D.tag(ctx, '알짜힘 = 0 (평형)', bx, by - 46, C.net, hl === 'net');
      }

      D.text(ctx, '노란 화살표 = 실제로 상자를 움직이는 방향', w / 2, h - 16, { size: 10.5, color: '#61719a', align: 'center' });
    }
  });
})();
