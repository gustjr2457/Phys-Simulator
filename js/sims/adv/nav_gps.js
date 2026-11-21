/* [공학응용·항법] 위성항법(GPS)의 위치 결정 — r = c·Δt,  Δr = c·δt
   위성은 원자시계로 "보낸 시각"을 실어 전파를 보낸다. 수신기는 도착 시각과의 차 Δt 에 빛의 속도 c 를 곱해 거리를 잰다.
   수신기 시계가 δt 만큼 빠르면 모든 위성의 거리가 똑같이 c·δt 만큼 길게 재진다(의사거리 ρ = r + c·δt).
   이 화면은 지구 단면(평면)이라 위치 x, y 와 시계 오차까지 미지수 3개 → 위성 3개로 푼다(실제 공간은 4개).
   위성 1·2 의 측정 거리 원 두 개가 만나는 점 = 시계 오차를 모른 채 계산한 위치, 위성 3 이 그 점과 어긋나는 것으로 시계 오차를 알아챈다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { H: PAL.violet, phi: PAL.steel, dte: PAL.rust, tt: PAL.teal, r: PAL.teal, dr: PAL.burnt, pr: PAL.ink, e: PAL.amber };
  const SAT = ['sage', 'teal', 'dusty'];                    // 위성 1·2·3 의 색 (PAL 이름)

  const CKM = 299792.458, RE = 6371;                        // 빛의 속도(km/s), 지구 반지름(km)
  const SANG = [-45, 5, 50].map(a => a * Math.PI / 180);    // 지구 중심에서 본 위성 세 개의 방향(위쪽에서 잰 각)
  const RATE = .05, LOOP = .2;                              // 화면 1초 = 실제 0.05초, 0.2초(화면 4초)마다 다시 보낸다

  const hyp = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // 두 원(중심 A 반지름 ra, 중심 B 반지름 rb)의 교점 가운데 near 에 가까운 것
  function meet(A, ra, B, rb, near) {
    const Dd = hyp(A, B), x = (ra * ra - rb * rb + Dd * Dd) / (2 * Dd), yy = ra * ra - x * x;
    if (!(yy >= 0) || !(Dd > 0)) return null;
    const y = Math.sqrt(yy), ex = [(B[0] - A[0]) / Dd, (B[1] - A[1]) / Dd], ey = [-ex[1], ex[0]];
    const P1 = [A[0] + x * ex[0] + y * ey[0], A[1] + x * ex[1] + y * ey[1]];
    const P2 = [A[0] + x * ex[0] - y * ey[0], A[1] + x * ex[1] - y * ey[1]];
    return hyp(P1, near) <= hyp(P2, near) ? P1 : P2;
  }

  // 위치와 거리 — km 단위
  function geo(p, dte) {
    const Rs = RE + p.H, ph = p.phi * Math.PI / 180;
    const S = SANG.map(a => [Rs * Math.sin(a), Rs * Math.cos(a)]);
    const R = [RE * Math.sin(ph), RE * Math.cos(ph)];
    const d = S.map(s => hyp(s, R));                                  // 진짜 거리 r
    const b = CKM * (dte === undefined ? p.dte : dte) * 1e-9;         // 시계 오차가 만든 거리 오차 (km)
    const rho = d.map(x => x + b);                                    // 수신기가 잰 거리 (의사거리)
    const fix = meet(S[0], rho[0], S[1], rho[1], R);                  // 위성 1·2 로만 계산한 위치
    return { Rs, S, R, d, b, rho, fix, e: fix ? hyp(fix, R) * 1000 : null, miss: fix ? (hyp(S[2], fix) - rho[2]) * 1000 : null };
  }

  // 위성 3개로 (x, y, 시계 몫 b) 를 함께 푼다 — 뉴턴 반복, 3×3 은 크라메르 공식
  function solve3(S, rho) {
    let x = 0, y = RE, bb = 0;
    for (let it = 0; it < 12; it++) {
      const J = [], f = [];
      for (let i = 0; i < 3; i++) {
        const dx = x - S[i][0], dy = y - S[i][1], dd = Math.hypot(dx, dy);
        J.push([dx / dd, dy / dd, 1]); f.push(-(dd + bb - rho[i]));
      }
      const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
      const dj = det(J);
      if (!(Math.abs(dj) > 1e-12)) break;
      const col = k => J.map((row, i) => row.map((v, j) => j === k ? f[i] : v));
      x += det(col(0)) / dj; y += det(col(1)) / dj; bb += det(col(2)) / dj;
    }
    return { x, y, b: bb };
  }

  PS.register({
    id: 'adv-gps', mode: 'adv', category: '항법',
    title: '위성항법(GPS)의 위치 결정',
    sub: 'r = c·Δt,  Δr = c·δt',
    tagline: '위성에서 온 전파가 걸린 시간으로 거리를 재고, 원 세 개가 만나는 점으로 위치를 찾습니다. 시계가 아주 조금만 틀려도 위치가 크게 어긋나는 것을 확인합니다.',

    params: [
      { key: 'H', symbol: 'H', label: '위성 고도', unit: 'km', min: 15000, max: 36000, step: 100, value: 20200, color: C.H, dec: 0,
        where: '왼쪽 그림에서 지구 표면부터 <b>위성 2</b>까지의 보라색 치수선입니다. 실제 GPS 위성은 약 20,200 km 높이에서 돕니다.' },
      { key: 'phi', symbol: 'φ', label: '수신기 위치 (지구 중심에서 본 각도)', unit: '°', min: -20, max: 20, step: 1, value: 0, color: C.phi, dec: 0,
        where: '지구 표면의 <b>파란 점(수신기)</b>이 놓인 자리입니다. 움직이면 위성마다 거리와 전파가 걸리는 시간이 달라집니다.' },
      { key: 'dte', symbol: 'δt', label: '수신기 시계 오차', unit: 'ns', min: 0, max: 1000, step: 10, value: 100, color: C.dte, dec: 0,
        where: '오른쪽 확대 그림 위 빨간 글자입니다. 1 ns 는 10억분의 1초입니다. 시계가 빠르면 <b>모든 위성의 거리가 똑같이 길게</b> 재집니다.' }
    ],
    vars: {
      tt: { symbol: 'Δt', label: '전파가 걸린 시간 (위성 2)', unit: 'ms', color: C.tt,
        where: '위성 2에서 출발한 <b>청록 물결</b>이 수신기에 닿을 때까지 걸린 시간입니다. 왼쪽 아래 목록에 위성마다 적힙니다.' },
      r: { symbol: 'r', label: '위성 2까지 진짜 거리', unit: 'km', color: C.r,
        where: '위성 2와 수신기를 잇는 청록 선의 길이입니다. 오른쪽 확대 그림에서는 수신기를 지나는 <b>점선 원</b>입니다.' },
      dr: { symbol: 'Δr', label: '시계 오차가 만든 거리 오차', unit: 'm', color: C.dr,
        where: '오른쪽 확대 그림의 <b>주황 치수선</b>입니다. 점선(진짜 거리)과 실선(잰 거리) 사이의 간격으로, 세 위성 모두 같습니다.' },
      pr: { symbol: 'ρ', label: '수신기가 잰 거리 (의사거리)', unit: 'km', color: C.pr,
        where: '수신기 시계로 잰 시간에 c 를 곱한 거리입니다. 오른쪽 확대 그림의 <b>실선 원</b>으로, 진짜 거리보다 Δr 만큼 깁니다.' },
      e: { symbol: 'e', label: '위성 2개로 계산한 위치 오차', unit: 'm', color: C.e,
        where: '오른쪽 확대 그림의 <b>노란 화살표</b>입니다. 시계 오차를 모른 채 위성 1·2의 실선 원이 만나는 점을 위치로 고르면 이만큼 빗나갑니다.' }
    },
    formulas: [
      { name: '거리 = 빛의 속도 × 걸린 시간', tpl: '{r} = c · {tt}' },
      { name: '시계 오차가 만드는 거리 오차', tpl: '{dr} = c · {dte}' },
      { name: '수신기가 재는 거리 (의사거리)', tpl: '{pr} = {r} + {dr}' }
    ],

    init() { return { tr: 0, sw: 0 }; },
    step(st, p, dt) {
      st.tr += RATE * dt; if (st.tr >= LOOP) st.tr -= LOOP;      // 전파가 퍼지는 실제 시간 (s)
      st.sw += dt / 6; if (st.sw >= 1) st.sw -= 1;               // 그래프: 6초마다 시계 오차 0→1000 ns 를 훑는다
    },

    graphs: [
      { title: '시계 오차에 따른 거리 오차와 위치 오차', xKey: 'xx', now: 'dte', xUnit: 'ns', xMin: 0, xMax: 1000, y0: 0,
        series: [{ key: 'ee', now: 'enow', label: '위치 오차 e, 위성 2개 (m)', color: C.e }, { key: 'dd', label: '거리 오차 Δr (m)', color: C.dr }] }
    ],
    sample(st, p) {
      const xx = 1000 * st.sw, g = geo(p, xx), g0 = geo(p);
      return { xx, ee: g.e === null ? 0 : g.e, dd: CKM * xx * 1e-6, dte: p.dte, enow: g0.e === null ? 0 : g0.e };
    },

    readouts(st, p) {
      const G = geo(p), sol = solve3(G.S, G.rho), ms = G.d.map(x => x / CKM * 1000);
      const solErr = hyp([sol.x, sol.y], G.R) * 1000;
      const ok = G.e !== null;
      return [
        { label: '신호 출발 뒤 시간 (화면 1초 = 실제 50 ms)', value: st.tr * 1000, unit: 'ms', dec: 0 },
        { label: '위성 2 신호 시간 Δt', value: ms[1], unit: 'ms', color: C.tt, dec: 2 },
        { label: '위성 2까지 진짜 거리 r', value: G.d[1], unit: 'km', color: C.r, dec: 0 },
        { label: '위성 1 신호 시간', value: ms[0], unit: 'ms', color: PAL.sage, dec: 2 },
        { label: '위성 3 신호 시간', value: ms[2], unit: 'ms', color: PAL.dusty, dec: 2 },
        { label: '거리 오차 Δr = c·δt', value: G.b * 1000, unit: 'm', color: C.dr, dec: 1 },
        { label: '위성 2개로 계산한 위치 오차 e', value: ok ? G.e : '두 원이 만나지 않음', unit: ok ? 'm' : '', color: C.e, dec: 1 },
        { label: '위성 3의 원과 어긋난 거리', value: ok ? Math.abs(G.miss) : '두 원이 만나지 않음', unit: ok ? 'm' : '', dec: 1 },
        { label: '위성 3개로 풀어 낸 시계 오차', value: sol.b / CKM * 1e9, unit: 'ns', color: C.dte, dec: 1 },
        { label: '위성 3개로 푼 위치 오차', value: solErr, unit: 'm', dec: 2 },
        { label: '읽는 법', wide: true, color: p.dte > 0 ? C.e : PAL.sage,
          value: p.dte > 0 ? '시계가 ' + fmt(p.dte, 0) + ' ns 틀려 거리가 모두 ' + fmt(G.b * 1000, 0) + ' m 길어졌다. 위성 3개로 풀면 시계 오차까지 알아내 위치를 바로잡는다'
                           : '시계가 정확해 세 원이 수신기 한 점에서 만난다' }
      ];
    },

    notes: [
      '번개가 번쩍인 뒤 천둥이 3초 뒤에 들리면 번개는 약 1 km 떨어져 있습니다. GPS 는 소리 대신 빛의 속도로 오는 전파로 같은 일을 합니다.',
      '위성 하나는 "나는 이 원 위 어딘가에 있다"까지만 알려 줍니다. 원 두 개가 만나는 점이 위치 후보이고, 셋째 원이 그 점을 확인해 줍니다.',
      '빛은 1초에 약 30만 km 를 갑니다. 그래서 수신기 시계가 <b>100만분의 1초(1000 ns)</b>만 틀려도 거리가 약 300 m 틀립니다.',
      '위성에는 원자시계가 있지만 휴대폰에는 없습니다. 그래서 위성 하나를 더 써서 위치와 함께 <b>내 시계가 얼마나 틀렸는지</b>까지 풉니다.',
      '이 화면은 평면이라 위성 3개면 되지만, 실제 공간에서는 x, y, z 와 시계 오차를 풀어야 해서 <b>위성 4개 이상</b>이 필요합니다.',
      '위성 시계는 높은 곳(약한 중력)과 빠른 속도 때문에 하루에 약 38 μs 빨라집니다. 상대성이론으로 보정하지 않으면 하루에 10 km 넘게 틀립니다.'
    ],
    presets: [
      { name: '시계가 정확할 때 (δt = 0)', set: { dte: 0 } },
      { name: '시계가 1 μs 틀릴 때', set: { dte: 1000 } },
      { name: '아주 높은 위성 (36,000 km)', set: { H: 36000, dte: 300 } },
      { name: '수신기를 옆으로 (φ = 20°)', set: { phi: 20, dte: 500 } }
    ],
    challenges: [
      {
        id: 'err150', title: '거리 오차 150 m',
        desc: '시계 오차 때문에 생기는 거리 오차 Δr 를 150 m(±3 m)로 만들어 보세요. 시계가 몇 ns 틀린 것일까요?',
        hint: 'Δr = c·δt 입니다. 빛은 1 ns 에 약 0.3 m 를 갑니다.',
        check: ({ P }) => Math.abs(CKM * P.dte * 1e-6 - 150) <= 3
      },
      {
        id: 'time100', title: '전파가 0.1초 걸리는 위성',
        desc: '위성 2의 전파가 수신기까지 0.1초(100 ms, ±0.5 ms) 걸리게 해 보세요. 그때 위성은 얼마나 멀리 있을까요?',
        hint: 'r = c·Δt 이므로 약 30,000 km 입니다. 수신기를 위성 2 바로 아래(φ = 5°)에 두고 고도를 맞춰 보세요.',
        check: ({ P }) => { const g = geo(P); return Math.abs(g.d[1] / CKM * 1000 - 100) <= .5; }
      },
      {
        id: 'fix100', title: '위치가 100 m 빗나가게',
        desc: '위성 2개로만 계산한 위치 오차 e 가 100 m(±3 m)가 되게 시계 오차를 맞춰 보세요. 거리 오차 Δr 보다 큰가요, 작은가요?',
        hint: '원 두 개가 모두 Δr 만큼 커지면 교점은 Δr 보다 조금 더 멀리 밀려납니다. 300 ns 근처에서 찾아보세요.',
        check: ({ P }) => { const g = geo(P); return g.e !== null && Math.abs(g.e - 100) <= 3; }
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600, small = h < 330;
      const G = geo(p), rr = CKM * st.tr;

      /* ── 배치: 넓으면 [전체 그림 | 확대], 좁으면 위 전체 그림, 아래 확대 ── */
      const ow = narrow ? w : w * .58, oh = narrow ? h * .5 : h;
      const zx = narrow ? 0 : w * .6, zy = narrow ? h * .5 : 0, zw = narrow ? w : w * .4, zh = narrow ? h * .5 : h;
      if (narrow) D.line(ctx, 8, zy, w - 8, zy, { color: PS.rgba('line', .9) });
      else D.line(ctx, w * .59, 10, w * .59, h - 10, { color: PS.rgba('line', .9) });

      /* ── 전체 그림: 지구, 위성 세 개, 퍼져 나가는 전파 ── */
      const Rs = G.Rs;
      const V = PS.view(ow, oh, { x0: -.8 * Rs, x1: .86 * Rs, y0: -.04 * Rs, y1: 1.08 * Rs, pad: small ? 8 : 16 });
      const X = x => V.X(x), Y = y => V.Y(y);
      // 궤도(점선)와 지구
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, ow, oh); ctx.clip();
      ctx.setLineDash([3, 5]); ctx.strokeStyle = PS.rgba('violet', .3); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(X(0), Y(0), V.S(Rs), Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(X(0), Y(0), V.S(RE), 0, 7); ctx.fillStyle = PS.rgba('ink3', .22); ctx.fill();
      ctx.strokeStyle = PAL.ink3; ctx.lineWidth = 1.2; ctx.stroke();
      // 전파 — 위성마다 같은 순간에 출발해 빛의 속도로 퍼진다. 수신기를 지나면 흐려진다
      G.S.forEach((s, i) => {
        if (rr <= 0 || rr > G.d[i] * 1.25) return;
        const a = rr <= G.d[i] ? .75 : .75 * (1 - (rr - G.d[i]) / (.25 * G.d[i]));
        ctx.beginPath(); ctx.arc(X(s[0]), Y(s[1]), V.S(rr), 0, 7);
        ctx.strokeStyle = PS.rgba(SAT[i], clamp(a, 0, 1)); ctx.lineWidth = i === 1 && hl === 'tt' ? 2.6 : 1.6; ctx.stroke();
      });
      ctx.restore();
      // 위성 → 수신기 선: 도착 전에는 흐린 점선, 도착하면 실선
      G.S.forEach((s, i) => {
        const arrived = rr >= G.d[i];
        D.line(ctx, X(s[0]), Y(s[1]), X(G.R[0]), Y(G.R[1]),
          { color: PS.rgba(SAT[i], arrived ? .85 : .3), width: arrived ? 1.6 : 1, dash: arrived ? null : [4, 5], hot: i === 1 && (hl === 'r' || hl === 'tt') });
      });
      // 위성 고도 H — 위성 2 아래 지구 표면에서 위성까지
      const s2 = G.S[1], base = [RE * Math.sin(SANG[1]), RE * Math.cos(SANG[1])];
      const hx = V.S(Rs) * .06;
      D.dim(ctx, X(base[0]) - hx, Y(base[1]), X(s2[0]) - hx, Y(s2[1]) + 8, null, C.H, hl === 'H');
      D.text(ctx, 'H ' + fmt(p.H, 0) + ' km', X(base[0]) - hx - 6, (Y(base[1]) + Y(s2[1])) / 2, { size: small ? 9.5 : 10.5, color: C.H, align: 'right', bold: hl === 'H' });
      // 위성 그림과 이름
      G.S.forEach((s, i) => {
        const sx = X(s[0]), sy = Y(s[1]);
        D.line(ctx, sx - 8, sy, sx + 8, sy, { color: PAL[SAT[i]], width: 3 });
        D.dot(ctx, sx, sy, 4, PAL[SAT[i]]);
        D.text(ctx, '위성 ' + (i + 1), sx, sy - 10, { size: small ? 9.5 : 10.5, color: PAL[SAT[i]], align: 'center', bold: true });
      });
      // 수신기
      D.dot(ctx, X(G.R[0]), Y(G.R[1]), 4.5, C.phi, hl === 'phi');
      D.text(ctx, '수신기', X(G.R[0]), Y(G.R[1]) + 16, { size: small ? 9.5 : 10.5, color: C.phi, align: 'center', bold: hl === 'phi' });
      // 시간과 도착 목록
      D.text(ctx, '신호 출발 뒤 ' + fmt(st.tr * 1000, 0) + ' ms', 8, 14, { size: small ? 10 : 11.5, color: PAL.ink, bold: true });
      if (!small) {
        D.text(ctx, '화면 1초 = 실제 0.05초', 8, 29, { size: 9.5, color: PAL.ink3 });
        G.d.forEach((d, i) => {
          const ms = d / CKM * 1000, arrived = rr >= d;
          D.text(ctx, '위성 ' + (i + 1) + ': ' + (arrived ? fmt(ms, 2) + ' ms 만에 도착' : '오는 중'), 8, oh - 10 - (2 - i) * 15,
            { size: 10, color: PAL[SAT[i]], bold: i === 1 && hl === 'tt' });
        });
      }

      /* ── 확대: 수신기 둘레. 위쪽 = 지구 바깥 방향 ── */
      const L = Math.max(40, 1.3 * Math.max(G.e || 0, G.b * 1000));       // 확대 그림의 반폭 (m)
      const top = zy + (small ? 18 : 34), bot = zy + zh - (small ? 4 : 30);
      const V0 = PS.view(zw, bot - top, { x0: -L, x1: L, y0: -L, y1: L, pad: small ? 6 : 14 });
      const Vz = { k: V0.k, X: x => zx + V0.X(x), Y: y => top + V0.Y(y), S: V0.S };
      const ph = p.phi * Math.PI / 180, up = [Math.sin(ph), Math.cos(ph)], east = [Math.cos(ph), -Math.sin(ph)];
      const loc = P => { const dx = P[0] - G.R[0], dy = P[1] - G.R[1]; return [(dx * east[0] + dy * east[1]) * 1000, (dx * up[0] + dy * up[1]) * 1000]; };
      const scr = q => [Vz.X(q[0]), Vz.Y(q[1])];
      // 원호 — 위성 중심, 반지름 rad(km). 수신기 근처만 촘촘히
      function arc(S, rad, style) {
        const th0 = Math.atan2(G.R[1] - S[1], G.R[0] - S[0]), span = 3 * L / 1000 / rad;
        ctx.beginPath();
        for (let k = -20; k <= 20; k++) {
          const th = th0 + span * k / 20, q = scr(loc([S[0] + rad * Math.cos(th), S[1] + rad * Math.sin(th)]));
          if (k === -20) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
        }
        ctx.strokeStyle = style.color; ctx.lineWidth = style.width;
        ctx.setLineDash(style.dash || []);
        if (style.hot) { ctx.shadowColor = style.color; ctx.shadowBlur = 10; }
        ctx.stroke(); ctx.shadowBlur = 0; ctx.setLineDash([]);
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(zx, top, zw, bot - top); ctx.clip();
      G.S.forEach((s, i) => arc(s, G.d[i], { color: PS.rgba(SAT[i], .5), width: 1.2, dash: [4, 4], hot: i === 1 && hl === 'r' }));
      G.S.forEach((s, i) => arc(s, G.rho[i], { color: PAL[SAT[i]], width: hl === 'pr' ? 2.8 : 2, hot: hl === 'pr' }));
      ctx.restore();

      const o = scr([0, 0]);
      // 거리 오차 Δr — 위성 2 쪽 점선과 실선 사이 (계산한 위치와 반대편에 둔다)
      const n2 = (() => { const q = loc(s2), m = Math.hypot(q[0], q[1]); return [q[0] / m, q[1] / m]; })();
      const t2 = [n2[1], -n2[0]];
      const fl = G.fix ? loc(G.fix) : [0, 0];
      const sg = fl[0] * t2[0] + fl[1] * t2[1] > 0 ? -1 : 1;
      const A = [t2[0] * sg * .55 * L, t2[1] * sg * .55 * L], B = [A[0] - n2[0] * G.b * 1000, A[1] - n2[1] * G.b * 1000];
      const As = scr(A), Bs = scr(B);
      if (Math.hypot(Bs[0] - As[0], Bs[1] - As[1]) > 6) {
        D.dim(ctx, As[0], As[1], Bs[0], Bs[1], null, C.dr, hl === 'dr' || hl === 'dte');
        D.text(ctx, 'Δr ' + fmt(G.b * 1000, 0) + ' m', (As[0] + Bs[0]) / 2 + sg * t2[0] * 10, (As[1] + Bs[1]) / 2 + 4,
          { size: 10.5, color: C.dr, align: sg * t2[0] >= 0 ? 'left' : 'right', bold: hl === 'dr' });
      }
      // 실제 위치와 위성 2개로 계산한 위치
      D.dot(ctx, o[0], o[1], 4.5, C.phi, hl === 'phi');
      if (G.e !== null && G.e > .05) {
        const f = scr(fl);
        D.arrow(ctx, o[0], o[1], f[0] - o[0], f[1] - o[1], { color: C.e, width: 2.2, head: 8, hot: hl === 'e' });
        D.dot(ctx, f[0], f[1], 4, C.e, hl === 'e');
        const mx = (o[0] + f[0]) / 2, my = (o[1] + f[1]) / 2, fl2 = Math.hypot(f[0] - o[0], f[1] - o[1]) || 1;
        const nx = -(f[1] - o[1]) / fl2, ny = (f[0] - o[0]) / fl2;
        D.tag(ctx, 'e = ' + fmt(G.e, 0) + ' m', mx + nx * 16, my + ny * 16, C.e, hl === 'e');
        if (!small) D.text(ctx, '위성 2개로 계산한 위치', f[0], f[1] + 18, { size: 10, color: C.e, align: 'center' });
      } else if (!small) {
        D.text(ctx, '세 원이 한 점에서 만남', o[0], o[1] + 20, { size: 10.5, color: PAL.sage, align: 'center' });
      }
      if (!small) D.text(ctx, '실제 위치', o[0], o[1] - 10, { size: 10, color: C.phi, align: 'center', bold: hl === 'phi' });

      // 머리글과 눈금자
      D.text(ctx, narrow ? '수신기 근처 확대 (m)' : '수신기 근처 확대 (m, 위 = 하늘)', zx + 8, zy + 14, { size: 11, color: PAL.ink2, bold: true });
      D.text(ctx, 'δt = ' + fmt(p.dte, 0) + ' ns', zx + zw - 8, zy + 14, { size: 11, color: C.dte, align: 'right', bold: true });
      if (!small) {
        D.text(ctx, '점선: 진짜 거리 r · 실선: 잰 거리 ρ', zx + 8, zy + 28, { size: 9.5, color: PAL.ink3 });
        D.ruler(ctx, Vz, { x0: -L, x1: L, y: bot + 4, unit: 'm' });
      }
    }
  });
})();
