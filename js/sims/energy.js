/* 역학적 에너지 보존 — E = ½mv² + mgh (롤러코스터) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { h0: '#a78bfa', m: '#f472b6', g: '#c084fc', mu: '#fb7185', v: '#60a5fa', K: '#60a5fa', U: '#a78bfa', E: '#34d399', h: '#fbbf24' };
  const X1 = 20;

  // 트랙 높이와 기울기
  function H(x) {
    return 6 * Math.exp(-Math.pow((x - 3) / 2.4, 2))
      + 3.4 * Math.exp(-Math.pow((x - 13) / 2.2, 2)) + 0.4;
  }
  function Hp(x) {
    return 6 * Math.exp(-Math.pow((x - 3) / 2.4, 2)) * (-2 * (x - 3) / (2.4 * 2.4))
      + 3.4 * Math.exp(-Math.pow((x - 13) / 2.2, 2)) * (-2 * (x - 13) / (2.2 * 2.2));
  }
  // 출발 높이 → 왼쪽 언덕 위의 위치
  function xOf(h0) {
    let lo = 0, hi = 3;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (H(mid) < h0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  PS.register({
    id: 'energy',
    category: '역학과 에너지',
    title: '역학적 에너지 보존',
    sub: 'E = ½mv² + mgh',
    tagline: '높이가 낮아진 만큼 빨라집니다. 위치 에너지와 운동 에너지가 서로 옮겨 다니는 모습을 막대로 확인하세요.',

    params: [
      { key: 'h0', symbol: 'h₀', label: '출발 높이', unit: 'm', min: 1.8, max: 6.3, step: .1, value: 6.3, color: C.h0, reset: true, dec: 1,
        where: '<b>공이 출발하는 지점의 높이</b>입니다. 처음 역학적 에너지 E = mgh₀ 전부가 여기서 결정되므로, 공은 절대 이 높이보다 높이 올라갈 수 없습니다.' },
      { key: 'm', symbol: 'm', label: '질량', unit: 'kg', min: .5, max: 5, step: .5, value: 2, color: C.m, reset: true,
        where: '<b>공의 크기</b>입니다. 재미있게도 m은 K와 U 양쪽에 똑같이 들어가서 <b>속도에는 영향을 주지 않습니다</b>. 막대(에너지)의 크기만 커집니다.' },
      { key: 'g', symbol: 'g', label: '중력 가속도', unit: 'm/s²', min: 1.6, max: 12, step: .1, value: 9.8, color: C.g, reset: true, dec: 1,
        where: '공에서 아래로 향한 <b>보라색 화살표</b>입니다. 지구는 9.8, 달은 1.6. 작을수록 같은 높이에서도 천천히 굴러갑니다.' },
      { key: 'mu', symbol: 'μ', label: '마찰 계수', unit: '', min: 0, max: .12, step: .005, value: 0, color: C.mu, reset: true, dec: 3,
        where: '0이면 역학적 에너지가 <b>완벽히 보존</b>됩니다. 0보다 크면 에너지가 열로 빠져나가 초록 막대(총 에너지)가 조금씩 줄어듭니다.' }
    ],
    vars: {
      E: { symbol: 'E', label: '역학적 에너지', unit: 'J', color: C.E,
        where: '오른쪽 <b>초록 막대(전체 높이)</b>입니다. 마찰이 없다면 공이 어디에 있든 항상 같은 높이를 유지합니다.' },
      K: { symbol: 'K', label: '운동 에너지', unit: 'J', color: C.K,
        where: '오른쪽 막대의 <b>파란 부분</b>. 공이 빠를수록 커집니다. 가장 낮은 골짜기에서 최대!' },
      U: { symbol: 'U', label: '위치 에너지', unit: 'J', color: C.U,
        where: '오른쪽 막대의 <b>보라 부분</b>. 공이 높이 있을수록 커집니다.' },
      v: { symbol: 'v', label: '속력', unit: 'm/s', color: C.v,
        where: '공의 <b>진행 방향 파란 화살표</b>입니다. 트랙을 따라 접선 방향을 향합니다.' },
      h: { symbol: 'h', label: '높이', unit: 'm', color: C.h,
        where: '공에서 바닥까지 내려간 <b>노란 점선</b>입니다. 기준면(바닥)을 어디로 잡느냐에 따라 U 값은 달라지지만 운동은 같습니다.' }
    },
    formulas: [
      { name: '역학적 에너지 보존', tpl: '{E} = {K} + {U} = 일정' },
      { name: '운동 에너지', tpl: '{K} = ½{m}{v}²' },
      { name: '위치 에너지', tpl: '{U} = {m}{g}{h}' },
      { name: '높이차로 속력 구하기', tpl: '{v} = √( 2{g}({h0} − {h}) )' }
    ],

    init(p) {
      const x = xOf(p.h0);
      return { x, dir: 1, v: 0, E: p.m * p.g * H(x), E0: p.m * p.g * H(x), lost: 0 };
    },

    step(st, p, dt) {
      const h = H(st.x);
      let k = st.E - p.m * p.g * h;               // 운동 에너지
      if (k <= 0) {                                // 되돌아오는 지점
        k = 0; st.dir *= -1; st.v = 0;
        st.x += st.dir * 0.004;
        return;
      }
      st.v = Math.sqrt(2 * k / p.m);
      const slope = Hp(st.x);
      const cos = 1 / Math.sqrt(1 + slope * slope);
      const ds = st.v * dt;
      st.x += st.dir * ds * cos;
      if (st.x < 0.05) { st.x = 0.05; st.dir = 1; }
      if (st.x > X1 - 0.05) { st.x = X1 - 0.05; st.dir = -1; }
      if (p.mu > 0) {
        const loss = p.mu * p.m * p.g * cos * ds;
        st.E = Math.max(p.m * p.g * H(st.x), st.E - loss);
        st.lost += loss;
      }
    },

    graphs: [{
      title: '에너지 – 시간',
      xmin: 8, window: 14,
      y0: 0,
      series: [
        { key: 'K', label: '운동 K', color: C.K },
        { key: 'U', label: '위치 U', color: C.U },
        { key: 'E', label: '역학적 E', color: C.E }
      ]
    }],
    sample(st, p) {
      const U = p.m * p.g * H(st.x);
      return { K: Math.max(0, st.E - U), U: U, E: st.E };
    },

    readouts(st, p) {
      const h = H(st.x), U = p.m * p.g * h, K = Math.max(0, st.E - U);
      return [
        { label: '속력 v', value: st.v, unit: 'm/s', color: C.v },
        { label: '높이 h', value: h, unit: 'm', color: C.h },
        { label: '운동 에너지 K', value: K, unit: 'J', color: C.K },
        { label: '위치 에너지 U', value: U, unit: 'J', color: C.U },
        { label: '역학적 에너지 E = K + U', value: st.E, unit: 'J', color: C.E, wide: true },
        { label: '마찰로 잃은 에너지', value: st.lost, unit: 'J', color: C.mu, wide: true }
      ];
    },

    notes: [
      '공은 <b>출발한 높이보다 높이 올라갈 수 없습니다</b>. 두 번째 언덕을 넘기려면 출발 높이를 올려 보세요.',
      '질량 m을 바꿔도 <b>속력은 그대로</b>입니다. mgh와 ½mv² 양쪽에서 m이 약분되기 때문입니다.',
      '가장 낮은 곳에서 <b>운동 에너지가 최대</b>, 가장 높은 곳에서 <b>위치 에너지가 최대</b>입니다.',
      '마찰 μ를 조금만 올려도 총 에너지(초록)가 계단처럼 줄며 결국 골짜기에 갇힙니다.'
    ],
    presets: [
      { name: '지구 (g=9.8)', set: { g: 9.8, mu: 0, h0: 6.3 } },
      { name: '달 (g=1.6)', set: { g: 1.6, mu: 0, h0: 6.3 } },
      { name: '두 번째 언덕을 못 넘음', set: { h0: 3.0, mu: 0 } },
      { name: '마찰이 있는 트랙', set: { h0: 6.3, mu: .04 } },
      { name: '무거운 공', set: { m: 5 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const BW = 128;                                  // 오른쪽 에너지 막대 영역
      const V = PS.view(w - BW, h, { x0: 0, x1: X1, y0: 0, y1: 7.4, pad: 22 });
      const ground = V.Y(0);

      // 트랙
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(V.X(0), ground);
      for (let x = 0; x <= X1; x += .1) ctx.lineTo(V.X(x), V.Y(H(x)));
      ctx.lineTo(V.X(X1), ground);
      ctx.closePath();
      const g1 = ctx.createLinearGradient(0, V.Y(6.5), 0, ground);
      g1.addColorStop(0, 'rgba(94,234,212,.10)');
      g1.addColorStop(1, 'rgba(94,234,212,.02)');
      ctx.fillStyle = g1; ctx.fill();
      ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 2.5; ctx.globalAlpha = .8;
      ctx.beginPath();
      for (let x = 0; x <= X1; x += .1) { const px = V.X(x), py = V.Y(H(x)); x === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      ctx.stroke();
      ctx.restore();
      D.line(ctx, V.X(0), ground, V.X(X1), ground, { color: 'rgba(147,162,196,.35)', width: 1.5, dash: [6, 5] });
      D.text(ctx, '기준면 (h = 0)', V.X(0) + 4, ground + 14, { size: 10, color: '#4a5878' });

      // 출발 높이 보조선
      const hotH0 = hl === 'h0' || hl === 'E';
      D.line(ctx, V.X(0), V.Y(p.h0), V.X(X1), V.Y(p.h0), { color: C.h0, dash: [5, 6], width: hotH0 ? 2 : 1, hot: hotH0 });
      D.text(ctx, '출발 높이 h₀ = ' + fmt(p.h0, 1) + ' m (여기보다 높이 갈 수 없음)', V.X(X1) - 4, V.Y(p.h0) - 7,
        { size: 10.5, color: C.h0, align: 'right', bold: hotH0 });

      // 공
      const bx = V.X(st.x), by = V.Y(H(st.x));
      const r = V.S(0.17 * Math.cbrt(p.m / 2)) + 5;
      const slope = Hp(st.x), cos = 1 / Math.sqrt(1 + slope * slope), sin = slope * cos;
      // 공은 트랙 법선 방향으로 반지름만큼 띄워서 얹는다
      const ballX = bx - sin * r, ballY = by - cos * r;

      // 높이 점선
      D.line(ctx, ballX, ballY, ballX, ground, { color: C.h, dash: [4, 5], width: hl === 'h' ? 2.5 : 1.4, hot: hl === 'h' });
      D.tag(ctx, 'h = ' + fmt(H(st.x), 2) + ' m', ballX, (ballY + ground) / 2, C.h, hl === 'h');

      // 중력 화살표
      D.arrow(ctx, ballX, ballY, 0, clamp(p.g * 4.5, 10, 90),
        { color: C.g, width: 2.5, hot: hl === 'g', label: 'g', lx: -20, ly: 10 });

      // 속도 화살표(접선 방향)
      const tx = st.dir * cos, ty = -st.dir * sin;
      D.arrow(ctx, ballX, ballY, tx * clamp(st.v * 9, 0, 130), ty * clamp(st.v * 9, 0, 130),
        { color: C.v, width: 3.5, hot: hl === 'v' || hl === 'K', label: 'v = ' + fmt(st.v, 1) + ' m/s', ly: -16 });

      ctx.save();
      if (hl === 'm') { ctx.shadowColor = C.m; ctx.shadowBlur = 24; }
      const bg = ctx.createRadialGradient(ballX - r * .3, ballY - r * .3, 1, ballX, ballY, r);
      bg.addColorStop(0, '#fde7f3'); bg.addColorStop(1, C.m);
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(ballX, ballY, r, 0, 7); ctx.fill();
      ctx.restore();
      D.text(ctx, fmt(p.m, 1) + ' kg', ballX, ballY + r + 14, { size: 10, color: C.m, align: 'center', bold: hl === 'm' });

      // 에너지 막대 (오른쪽)
      const U = p.m * p.g * H(st.x), K = Math.max(0, st.E - U);
      const top = 40, bot = h - 40, bh = bot - top;
      const bxx = w - BW + 26, bwid = 46;
      const maxE = Math.max(st.E0, 1);
      const kh = bh * (K / maxE), uh = bh * (U / maxE);
      D.text(ctx, '에너지', bxx + bwid / 2, top - 22, { size: 11, color: '#61719a', align: 'center' });
      D.roundRect(ctx, bxx, top, bwid, bh, 6); ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fill();
      ctx.save();
      if (hl === 'U') { ctx.shadowColor = C.U; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.U; ctx.fillRect(bxx, bot - uh, bwid, uh);
      ctx.restore();
      ctx.save();
      if (hl === 'K') { ctx.shadowColor = C.K; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.K; ctx.fillRect(bxx, bot - uh - kh, bwid, kh);
      ctx.restore();
      // 총 에너지 선
      const ey = bot - bh * (st.E / maxE);
      D.line(ctx, bxx - 10, ey, bxx + bwid + 10, ey, { color: C.E, width: hl === 'E' ? 3 : 2, hot: hl === 'E' });
      D.text(ctx, 'E ' + fmt(st.E, 0) + 'J', bxx + bwid + 12, ey + 4, { size: 10.5, color: C.E, bold: hl === 'E' });
      D.text(ctx, 'K ' + fmt(K, 0), bxx + bwid / 2, bot - uh - kh / 2 + 4, { size: 10, color: '#04121f', align: 'center', bold: true });
      D.text(ctx, 'U ' + fmt(U, 0), bxx + bwid / 2, bot - uh / 2 + 4, { size: 10, color: '#14061f', align: 'center', bold: true });
      if (p.mu > 0) {
        const ly = bot - bh * (st.E0 / maxE);
        D.line(ctx, bxx - 10, ly, bxx + bwid + 10, ly, { color: C.mu, dash: [4, 4], hot: hl === 'mu' });
        D.text(ctx, '처음 E', bxx + bwid + 12, ly + 4, { size: 9.5, color: C.mu });
      }
    }
  });
})();
