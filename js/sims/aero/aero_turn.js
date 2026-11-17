/* [항공우주공학·비행역학] 선회 비행과 하중 배수 — n = 1/cosφ,  R = V²/(g·tanφ),  V_s,선회 = V_s·√n
   비행기는 방향을 바꾸는 힘을 따로 갖고 있지 않다. 날개를 φ만큼 기울이면 양력 L도 같이 기울고,
   그 옆 성분 L·sinφ 가 원의 중심으로 끄는 구심력이 된다. 고도를 지키려면 위 성분 L·cosφ 가 여전히
   무게 W와 같아야 하므로 L = W/cosφ — 양력(그리고 조종사가 느끼는 무게)이 n = 1/cosφ 배가 된다.
   왼쪽: 위에서 내려다본 선회(자취를 적분해 그린다), 오른쪽: 뒤에서 본 기울어진 비행기와 힘 분해. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { V: PAL.steel, phi: PAL.teal, Vs: PAL.rust, n: PAL.amber, R: PAL.sage, omega: PAL.dusty, Vt: PAL.rust, W: PAL.ink2 };
  const G = 9.80665, RAD = Math.PI / 180, SUB = 0.01;   // 적분 쪼갬 10 ms

  const nOf = p => 1 / Math.cos(p.phi * RAD);
  const Rof = p => p.V * p.V / (G * Math.tan(p.phi * RAD));
  const VtOf = p => p.Vs * Math.sqrt(nOf(p));
  // 실속 — 날개가 낼 수 있는 최대 양력은 L_max = ½ρV²S·C_Lmax 이고, 수평 비행 실속 속도의 정의가
  // W = ½ρVₛ²S·C_Lmax 이므로 L_max / W = (V/Vₛ)². 선회에 필요한 n 이 이보다 크면 날개는 최대치까지만 낸다.
  // (실제로는 실속을 넘기면 양력이 오히려 줄어든다 — 여기서는 "최대치에 묶인다"까지만 보여 준다)
  const nMaxOf = p => (p.V / p.Vs) * (p.V / p.Vs);
  const nEffOf = p => Math.min(nOf(p), nMaxOf(p));
  const stalled = p => nMaxOf(p) < nOf(p);                               // = V < Vₛ·√n
  // 실제로 그리는 원의 반경 — 옆 성분 n_eff·g·sinφ 가 구심력 (실속이 아니면 R 과 같다)
  const ReOf = p => p.V * p.V / (G * nEffOf(p) * Math.sin(p.phi * RAD));
  // 위 성분이 무게에 모자라는 만큼 아래로 — a_z = g(n_eff·cosφ − 1) (실속이 아니면 0)
  const azOf = p => G * (nEffOf(p) * Math.cos(p.phi * RAD) - 1);
  const ALT_LIMIT = 600;                                                   // 이만큼 떨어지면 끝 (m)

  // 선회 중심을 원점에 두고, 비행기를 중심의 오른쪽(동쪽)에서 시작한다.
  // 화면 좌표(y 아래)로 시계 방향 = 오른쪽으로 기울인 선회. 진행 방향의 오른쪽이 중심.
  function start(st, p) {
    const R = ReOf(p);
    st.x = R; st.y = 0; st.vx = 0; st.vy = p.V;
    st.pV = p.V; st.pphi = p.phi; st.pVs = p.Vs; st.trail = [{ x: st.x, y: st.y }]; st.acc = 0; st.head = 0;
    st.alt = 0; st.vz = 0; st.done = false;
  }
  // 가속도 — 양력의 옆 성분 L·sinφ/m = n·g·sinφ, 속도에 수직(진행 방향 오른쪽)
  function acc(vx, vy, p) {
    const v = Math.hypot(vx, vy) || 1, a = nEffOf(p) * G * Math.sin(p.phi * RAD);
    return [-vy / v * a, vx / v * a];
  }
  // 자취의 세 점을 지나는 원의 반지름 — 공식이 아니라 실제로 그려진 길에서 잰다
  function circum(a, b, c) {
    const ab = Math.hypot(a.x - b.x, a.y - b.y), bc = Math.hypot(b.x - c.x, b.y - c.y), ca = Math.hypot(c.x - a.x, c.y - a.y);
    const area2 = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y));
    return area2 > 1e-9 ? ab * bc * ca / (2 * area2) : Infinity;
  }
  const TRAIL_DT = 0.1, GAP = 5;                 // 0.1 s마다 자취 점, 0.5 s 떨어진 세 점으로 잰다
  function measured(st) {
    const T = st.trail, k = T.length - 1;
    return k >= 2 * GAP ? circum(T[k], T[k - GAP], T[k - 2 * GAP]) : null;
  }
  // 1 · 2 · 5 × 10ⁿ 중에서 x 이하인 가장 큰 값 (축척 막대)
  function nice(x) {
    const e = Math.pow(10, Math.floor(Math.log10(x))), m = x / e;
    return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * e;
  }

  PS.register({
    id: 'aero-turn', mode: 'aero', category: '비행역학',
    title: '선회 비행과 하중 배수',
    sub: 'n = 1/cosφ,  R = V²/(g·tanφ)',
    tagline: '비행기는 날개를 기울여 양력을 옆으로 눕혀서 돕니다. 많이 기울일수록 좁게 돌지만, 날개와 조종사가 받는 힘(하중 배수)이 커집니다.',

    params: [
      { key: 'V', symbol: 'V', label: '비행 속도', unit: 'm/s', min: 40, max: 250, step: 1, value: 100, color: C.V, dec: 0,
        where: '위에서 본 그림의 <b>파란 화살표</b>입니다. 빠를수록 같은 기울기에서 원이 훨씬 커집니다(속도의 제곱).' },
      { key: 'phi', symbol: 'φ', label: '경사각 (기울기)', unit: '°', min: 5, max: 75, step: 1, value: 30, color: C.phi, dec: 0,
        where: '뒤에서 본 비행기의 <b>날개가 수평에서 기운 각도</b>입니다. 청록 호로 표시되고, 양력 화살표도 같은 각도만큼 눕습니다.' },
      { key: 'Vs', symbol: 'Vₛ', label: '수평 비행 실속 속도', unit: 'm/s', min: 20, max: 80, step: 1, value: 50, color: C.Vs, dec: 0,
        where: '기울이지 않고 똑바로 날 때 이보다 느리면 날개가 양력을 잃습니다. 아래 <b>속도 막대의 붉은 눈금</b>의 출발점입니다.' }
    ],
    vars: {
      n: { symbol: 'n', label: '하중 배수 (G)', unit: '배', color: C.n,
        where: '뒤에서 본 그림의 <b>주황 양력 화살표 L</b>이 회색 무게 화살표 W의 몇 배인지입니다. 조종사는 몸무게가 이만큼 무거워진 것처럼 느낍니다.' },
      R: { symbol: 'R', label: '선회 반경', unit: 'm', color: C.R,
        where: '위에서 본 그림에서 <b>선회 중심부터 비행기까지의 초록 선</b>입니다. 아래 축척 막대로 실제 길이를 읽습니다.' },
      omega: { symbol: 'ω', label: '선회율 (1초에 도는 각도)', unit: '°/s', color: C.omega,
        where: '비행기가 <b>1초에 원을 따라 도는 각도</b>입니다. 360을 이 값으로 나누면 한 바퀴 시간입니다.' },
      Vt: { symbol: 'Vₛ′', label: '선회 중 실속 속도', unit: 'm/s', color: C.Vt,
        where: '기울여 도는 동안의 실속 속도로, <b>속도 막대의 붉은 눈금</b>입니다. 파란 눈금(지금 속도)이 이보다 왼쪽이면 실속합니다.' }
    },
    formulas: [
      { name: '하중 배수 (위 성분 L·cosφ가 무게와 같아야)', tpl: '{n} = 1 ⁄ cos{phi}' },
      { name: '선회 반경 (옆 성분 L·sinφ가 구심력)', tpl: '{R} = {V}² ⁄ (g · tan{phi})' },
      { name: '선회율', tpl: '{omega} = g · tan{phi} ⁄ {V}' },
      { name: '선회 중 실속 속도', tpl: '{Vt} = {Vs} · √{n}' }
    ],

    init(p) { const st = {}; start(st, p); return st; },
    step(st, p, dt) {
      // 속도나 기울기를 바꾸면 그 자리에서 새 원을 시작한다 (방향은 그대로)
      if (p.V !== st.pV || p.phi !== st.pphi || p.Vs !== st.pVs) {
        const v = Math.hypot(st.vx, st.vy) || 1, ux = st.vx / v, uy = st.vy / v, R = ReOf(p);
        const cx = st.x - uy * R, cy = st.y + ux * R;          // 진행 방향 오른쪽 R 에 새 중심
        st.x -= cx; st.y -= cy; st.vx = ux * p.V; st.vy = uy * p.V;
        st.pV = p.V; st.pphi = p.phi; st.pVs = p.Vs; st.trail = [{ x: st.x, y: st.y }]; st.acc = 0;
        if (!stalled(p)) st.vz = 0;                       // 실속에서 빠져나오면 더 떨어지지 않는다 (잃은 고도는 그대로)
      }
      // 고도 — 실속이면 위 성분이 모자라 일정한 가속도로 떨어진다 (정확한 등가속도 식)
      const az = azOf(p);
      st.alt += st.vz * dt + .5 * az * dt * dt; st.vz += az * dt;
      if (st.alt <= -ALT_LIMIT) { st.alt = -ALT_LIMIT; st.done = true; }
      // RK4 — 10 ms 이하로 쪼갠다
      let left = dt;
      while (left > 1e-12) {
        const h = Math.min(SUB, left); left -= h;
        const { x, y, vx, vy } = st;
        const a1 = acc(vx, vy, p);
        const a2 = acc(vx + a1[0] * h / 2, vy + a1[1] * h / 2, p);
        const v2x = vx + a1[0] * h / 2, v2y = vy + a1[1] * h / 2;
        const a3 = acc(vx + a2[0] * h / 2, vy + a2[1] * h / 2, p);
        const v3x = vx + a2[0] * h / 2, v3y = vy + a2[1] * h / 2;
        const a4 = acc(vx + a3[0] * h, vy + a3[1] * h, p);
        const v4x = vx + a3[0] * h, v4y = vy + a3[1] * h;
        st.x = x + h / 6 * (vx + 2 * v2x + 2 * v3x + v4x);
        st.y = y + h / 6 * (vy + 2 * v2y + 2 * v3y + v4y);
        st.vx = vx + h / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
        st.vy = vy + h / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
      }
      st.acc += dt;
      while (st.acc >= TRAIL_DT - 1e-9) {
        st.acc -= TRAIL_DT;
        st.trail.push({ x: st.x, y: st.y });
        if (st.trail.length > 600) st.trail.shift();
      }
    },

    graphs: [{
      title: '경사각에 따른 하중 배수 n과 실속 속도 배율 √n (5° → 85°를 되풀이해 훑는다)', xKey: 'ph', xUnit: '°', xMin: 0, xMax: 85, y0: 0,
      series: [
        { key: 'n', label: '하중 배수 n = 1/cosφ', color: C.n },
        { key: 'sq', label: '실속 속도 배율 √n', color: C.Vt }
      ]
    }],
    sample(st) {
      const ph = 5 + (st.t * 8) % 80, n = 1 / Math.cos(ph * RAD);
      return { ph, n, sq: Math.sqrt(n) };
    },

    readouts(st, p) {
      const n = nOf(p), R = Rof(p), om = G * Math.tan(p.phi * RAD) / p.V / RAD, Vt = VtOf(p);
      const Rm = measured(st), spd = Math.hypot(st.vx, st.vy), ok = !stalled(p);
      return [
        { label: '하중 배수 n (필요)', value: n, unit: 'G', color: C.n, dec: 3 },
        { label: '선회 반경 R (공식)', value: R, unit: 'm', color: C.R, dec: 1 },
        { label: '잰 선회 반경 (자취)', value: Rm === null ? '1초 날면 표시' : Rm, unit: Rm === null ? '' : 'm', color: C.R, dec: 1 },
        { label: '선회율 ω', value: om, unit: '°/s', color: C.omega, dec: 3 },
        { label: '한 바퀴 시간', value: 360 / om, unit: 's', color: C.omega, dec: 1 },
        { label: '구심 가속도', value: G * Math.tan(p.phi * RAD), unit: 'm/s²', color: C.R, dec: 3 },
        { label: '선회 중 실속 속도', value: Vt, unit: 'm/s', color: C.Vt, dec: 2 },
        { label: '날개가 낼 수 있는 최대 하중 (V/Vₛ)²', value: nMaxOf(p), unit: 'G', color: ok ? C.n : C.Vs, dec: 3 },
        { label: '고도 변화', value: st.alt, unit: 'm', color: st.alt < -0.05 ? C.Vs : C.V, dec: 1 },
        { label: '지금 속력', value: spd, unit: 'm/s', color: C.V, dec: 3 },
        { label: '60 kg 학생이 느끼는 몸무게', value: 60 * nEffOf(p), unit: 'kg', color: C.n, dec: 1 },
        { label: '양력이 받쳐야 하는 무게', wide: true, color: C.n,
          value: '비행기 무게의 ' + fmt(n, 2) + '배 — 위 성분 L·cosφ = W, 옆 성분 L·sinφ = 구심력' },
        { label: '실속 여유', wide: true, color: ok ? C.V : C.Vs,
          value: ok ? '지금 속도가 선회 실속 속도보다 ' + fmt(p.V - Vt, 1) + ' m/s 빠르다 — 안전'
                    : '실속! 날개가 ' + fmt(nMaxOf(p), 2) + ' G 까지만 낸다 — 원이 커지고 1초에 ' + fmt(-azOf(p), 1) + ' m/s 씩 더 빨리 떨어진다' }
      ];
    },

    notes: [
      '롤러코스터가 기울어진 커브를 돌 때 몸이 의자에 꽉 눌립니다. 비행기도 <b>기울여서 돌면</b> 날개가 무게보다 큰 힘으로 받쳐야 합니다.',
      '비행기에는 옆으로 미는 장치가 없습니다. 날개를 기울여 <b>양력을 옆으로 눕히면</b> 그 옆 성분 L·sinφ가 원의 중심으로 끄는 힘(구심력)이 됩니다.',
      '고도를 지키려면 양력의 위 성분 L·cosφ가 여전히 무게와 같아야 합니다. 그래서 양력 전체는 <b>n = 1/cosφ 배</b>가 되어야 합니다 — 하중 배수입니다.',
      '60° 기울이면 n = 2, 몸무게가 두 배로 느껴집니다(2G). 날개도 두 배 힘을 견뎌야 해서 여객기는 보통 <b>25~30° 이하</b>로만 기울입니다.',
      '양력을 n배로 내려면 더 빨라야 합니다. 그래서 선회 중에는 <b>실속 속도가 √n배</b>로 올라갑니다 — 느리게 급선회하면 날개가 갑자기 양력을 잃습니다.'
    ],
    presets: [
      { name: '표준 선회 (30°)', set: { V: 100, phi: 30, Vs: 50 } },
      { name: '완만한 선회 (15°)', set: { V: 100, phi: 15, Vs: 50 } },
      { name: '급선회 60° (2G)', set: { V: 100, phi: 60, Vs: 50 } },
      { name: '곡예비행 (75°, 약 3.9G)', set: { V: 120, phi: 75, Vs: 40 } },
      { name: '느린데 급하게 (실속!)', set: { V: 60, phi: 60, Vs: 50 } },
      { name: '빠른 제트기 (200 m/s, 30°)', set: { V: 200, phi: 30, Vs: 70 } }
    ],
    challenges: [
      {
        id: 'two-g', title: '2G 선회',
        desc: '하중 배수 n이 1.95 ~ 2.05 G가 되게 기울여 보세요 — 조종사의 몸무게가 두 배로 느껴지는 선회입니다.',
        hint: 'n = 1/cosφ 입니다. cosφ가 0.5가 되는 각도를 찾아보세요.',
        check: ({ P }) => { const n = nOf(P); return n >= 1.95 && n <= 2.05; }
      },
      {
        id: 'tight', title: '실속 없이 300 m 안에서 돌기',
        desc: '실속 속도 50 m/s 인 비행기(Vₛ ≥ 50)로, 실속하지 않으면서 선회 반경을 300 m 이하로 줄여 보세요.',
        hint: '많이 기울이면 원이 작아지지만 선회 실속 속도도 올라갑니다. 크게 기울인 뒤, 붉은 눈금을 겨우 넘는 속도까지 줄여 보세요.',
        check: ({ P }) => P.Vs >= 49.5 && P.V >= VtOf(P) && Rof(P) <= 300
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600;
      const n = nOf(p), R = Rof(p), Vt = VtOf(p), ph = p.phi * RAD, stall = stalled(p);
      const Re = ReOf(p), nE = nEffOf(p);                // 실제로 그리는 원 · 실제로 나는 하중

      /* ── 배치: 넓으면 왼쪽(위에서 본 선회)·오른쪽(뒤에서 본 비행기), 좁으면 위·아래 ── */
      let A, B;                                         // A: 위에서 본 판, B: 뒤에서 본 판 {x0,y0,x1,y1}
      if (!narrow) {
        const mid = Math.round(w * .48);
        A = { x0: 14, y0: 30, x1: mid - 10, y1: h - 14 };
        B = { x0: mid + 10, y0: 30, x1: w - 14, y1: h - 14 };
      } else {
        const mid = Math.round(h * .5);
        A = { x0: 10, y0: 26, x1: w - 10, y1: mid - 6 };
        B = { x0: 10, y0: mid + 22, x1: w - 10, y1: h - 10 };
      }
      D.line(ctx, narrow ? 14 : B.x0 - 10, narrow ? A.y1 + 12 : 34, narrow ? w - 14 : B.x0 - 10, narrow ? A.y1 + 12 : h - 18,
        { color: 'rgba(167,170,176,.16)' });

      /* ── A. 위에서 내려다본 선회 ── */
      D.text(ctx, '위에서 본 선회', A.x0 + 4, A.y0 - 10, { size: 11, color: PAL.ink2, bold: true });
      const acx = (A.x0 + A.x1) / 2, acy = (A.y0 + A.y1) / 2 + (narrow ? 0 : -10);
      const rpx = Math.max(20, Math.min(A.x1 - A.x0, A.y1 - A.y0 - (narrow ? 22 : 50)) / 2 - (narrow ? 12 : 34));
      const S = rpx / Re;                               // 1 m → px (실속이면 실제 원이 계획한 원보다 크다)
      const SX = x => acx + x * S, SY = y => acy + y * S;

      // 앞으로 갈 길 (점선 원)과 지나온 자취
      ctx.save(); ctx.strokeStyle = 'rgba(167,170,176,.28)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(acx, acy, rpx, 0, 7); ctx.stroke(); ctx.restore();
      if (stall) {   // 계획한 원 — 날개가 힘이 모자라 이 원을 돌지 못한다
        ctx.save(); ctx.strokeStyle = 'rgba(196,112,95,.55)'; ctx.setLineDash([2, 5]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(acx, acy, R * S, 0, 7); ctx.stroke(); ctx.restore();
        D.text(ctx, '계획한 원 (못 돈다)', acx, acy - R * S - 6, { size: 9.5, color: C.Vs, align: 'center' });
      }
      if (st.trail.length > 1) {
        ctx.save(); ctx.strokeStyle = stall ? 'rgba(196,112,95,.75)' : 'rgba(111,159,196,.65)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath();
        st.trail.forEach((q, i) => i ? ctx.lineTo(SX(q.x), SY(q.y)) : ctx.moveTo(SX(q.x), SY(q.y)));
        ctx.lineTo(SX(st.x), SY(st.y)); ctx.stroke(); ctx.restore();
      }
      // 선회 중심과 반경 R
      const bx = SX(st.x), by = SY(st.y);
      // "선회 중심" 글자는 비행기 반대편에 — 반경선·R 라벨과 겹치지 않게
      const rl = Math.hypot(bx - acx, by - acy) || 1, ex = (bx - acx) / rl, ey = (by - acy) / rl;
      D.dot(ctx, acx, acy, 3.5, PAL.ink2);
      D.text(ctx, '선회 중심', acx - ex * 30, acy - ey * 16 + 4, { size: 10, color: PAL.ink2, align: 'center' });
      D.line(ctx, acx, acy, bx, by, { color: C.R, width: hl === 'R' ? 2.6 : 1.8, hot: hl === 'R' });
      const rTxt = 'R = ' + (Re >= 1000 ? fmt(Re / 1000, 2) + ' km' : fmt(Re, 0) + ' m');
      if (narrow) D.tag(ctx, rTxt, A.x1 - 4, A.y0 - 2, C.R, hl === 'R', 'right');     // 폰: 원이 작아 판 오른쪽 위에
      else D.tag(ctx, rTxt, acx + (bx - acx) * .5 - ey * 14, acy + (by - acy) * .5 + ex * 14, C.R, hl === 'R');

      // 비행기 (위에서 본 모양) — 진행 방향으로 돌린다
      const v = Math.hypot(st.vx, st.vy) || 1, ux = st.vx / v, uy = st.vy / v;
      const sc = narrow ? .8 : 1;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.atan2(uy, ux)); ctx.scale(sc, sc);
      D.poly(ctx, [[14, 0], [6, -2.6], [-12, -2], [-14, 0], [-12, 2], [6, 2.6]], { fill: 'rgba(207,214,232,.55)', stroke: '#c8cad2', width: 1.3 });
      D.poly(ctx, [[3, -2], [-3, -15], [-7, -15], [-5, -2], [-5, 2], [-7, 15], [-3, 15], [3, 2]], { fill: 'rgba(207,214,232,.4)', stroke: '#c8cad2', width: 1.2 });
      D.poly(ctx, [[-10, -1.5], [-14, -6], [-15.5, -6], [-14, 0], [-15.5, 6], [-14, 6], [-10, 1.5]], { fill: 'rgba(207,214,232,.4)', stroke: '#c8cad2', width: 1 });
      ctx.restore();
      // 속도(원의 접선 방향) — 라벨은 화살표 끝 너머에 두어 비행기를 가리지 않는다
      const va = narrow ? 34 : 46;
      D.arrow(ctx, bx, by, ux * va, uy * va, { color: C.V, width: 2.6, head: 8, hot: hl === 'V' });
      D.text(ctx, 'V', bx + ux * (va + 10), by + uy * (va + 10) + 4, { size: 11, color: C.V, align: 'center', bold: true });
      // 축척 막대
      const sbm = nice(Re * .8), sbp = sbm * S, sbx = A.x0 + 8, sby = A.y1 - 8;
      D.line(ctx, sbx, sby, sbx + sbp, sby, { color: PAL.ink2, width: 2 });
      D.line(ctx, sbx, sby - 4, sbx, sby + 2, { color: PAL.ink2, width: 1.5 });
      D.line(ctx, sbx + sbp, sby - 4, sbx + sbp, sby + 2, { color: PAL.ink2, width: 1.5 });
      D.text(ctx, sbm >= 1000 ? fmt(sbm / 1000, 0) + ' km' : fmt(sbm, 0) + ' m', sbx + sbp + 6, sby + 4, { size: 10, color: PAL.ink2 });
      D.text(ctx, '한 바퀴 ' + fmt(2 * Math.PI * Re / p.V, 0) + ' 초', A.x1 - 4, A.y1 - 4,
        { size: narrow ? 10 : 10.5, color: C.omega, align: 'right', bold: hl === 'omega' });

      /* ── B. 뒤에서 본 비행기와 힘 ── */
      D.text(ctx, '뒤에서 본 비행기 (힘의 분해)', B.x0 + 4, B.y0 - 10, { size: 11, color: PAL.ink2, bold: true });
      // 화살표 축척: 무게 W 가 k px. 75°에서 옆 성분 k·tan75° ≈ 3.7k 가 판 안에 들어오게
      const gaugeH = narrow ? 30 : 46;
      const bw = B.x1 - B.x0, bh = B.y1 - B.y0 - gaugeH;
      // 75°에서 양력 끝 + 라벨(약 100 px)까지 판 안에: px + k·tan75° + 100 ≤ 오른쪽 끝
      const k = Math.max(18, Math.min(narrow ? 52 : 74, (bw * .84 - 100) / 3.73, bh * .34));
      const px = B.x0 + bw * .14, py = B.y0 + bh * .55;
      // 수평선
      D.line(ctx, B.x0 + 4, py, B.x1 - 4, py, { color: 'rgba(167,170,176,.22)', dash: [3, 5] });
      D.text(ctx, '수평', B.x0 + 6, py - 5, { size: 9.5, color: PAL.ink3 });
      // 비행기 뒷모습 — φ만큼 오른쪽으로 기운다 (화살표가 주인공이라 작게)
      const span = narrow ? 30 : 42;
      ctx.save(); ctx.translate(px, py); ctx.rotate(ph);
      if (hl === 'phi') { ctx.shadowColor = C.phi; ctx.shadowBlur = 14; }
      D.poly(ctx, [[-span, -1.5], [span, -1.5], [span, 2.5], [-span, 2.5]], { fill: 'rgba(207,214,232,.45)', stroke: '#c8cad2', width: 1.3 });
      D.poly(ctx, [[-1.4, -5], [-.9, -16], [.9, -16], [1.4, -5]], { fill: 'rgba(207,214,232,.45)', stroke: '#c8cad2', width: 1.1 });
      D.poly(ctx, [[-11, -4.5], [11, -4.5], [11, -2.8], [-11, -2.8]], { fill: 'rgba(207,214,232,.3)', stroke: '#c8cad2', width: 1 });
      ctx.restore();
      D.dot(ctx, px, py, narrow ? 4.5 : 5.5, '#c8cad2');
      // 경사각 φ — 수평에서 날개까지 (날개 아래쪽 바깥에 글자)
      ctx.save(); ctx.strokeStyle = C.phi; ctx.lineWidth = hl === 'phi' ? 2.6 : 1.8;
      if (hl === 'phi') { ctx.shadowColor = C.phi; ctx.shadowBlur = 10; }
      const ar = span + 8;
      ctx.beginPath(); ctx.arc(px, py, ar, 0, ph); ctx.stroke(); ctx.restore();
      const pa = Math.max(ph * .5, .35);
      D.text(ctx, 'φ = ' + fmt(p.phi, 0) + '°', px + (ar + 10) * Math.cos(pa), py + (ar + 10) * Math.sin(pa) + 8,
        { size: 11, color: C.phi, bold: true });
      // 힘: 무게 W(아래), 양력 L(날개에 수직), 그 두 성분
      const Lx = Math.sin(ph) * nE * k, Ly = -Math.cos(ph) * nE * k;    // 실속이 아니면 (k·tanφ, −k)
      D.arrow(ctx, px, py, 0, k, { color: C.W, width: 2.6, head: 8, hot: false });
      D.text(ctx, 'W 무게', px - 8, py + k - 2, { size: 10.5, color: C.W, align: 'right', bold: true });
      D.line(ctx, px, py, px, py + Ly, { color: C.n, dash: [4, 4], width: 1.6 });
      D.line(ctx, px, py + Ly, px + Lx, py + Ly, { color: C.n, dash: [4, 4], width: 1.2 });
      D.arrow(ctx, px, py, Lx, 0, { color: C.n, width: 2, head: 7, dash: [5, 3], hot: hl === 'R' });
      D.arrow(ctx, px, py, Lx, Ly, { color: C.n, width: 3.2, head: 10, hot: hl === 'n' });
      D.tag(ctx, 'L = ' + fmt(nE, 2) + ' W' + (stall ? ' (최대)' : ''), px + Lx + 8, py + Ly, C.n, hl === 'n', 'left');
      D.text(ctx, stall ? 'L·cosφ < W' : 'L·cosφ = W', px - 8, py + Ly + 4, { size: 10, color: stall ? C.Vs : C.n, align: 'right' });
      if (stall) {   // 위 성분이 무게에 모자라는 만큼 — 아래로 남는 힘
        // 비행기 근처는 날개·φ 호·라벨로 붐벼서, 같은 축척의 화살표를 오른쪽 빈자리에 따로 그린다
        const net = Math.max((1 - nE * Math.cos(ph)) * k, 6), ax = px + bw * .42, ay = py + 10;
        D.arrow(ctx, ax, ay, 0, net, { color: C.Vs, width: 3, head: 9, hot: true });
        D.text(ctx, '남는 힘 = W − L·cosφ', ax + 10, ay + 10, { size: 10, color: C.Vs, bold: true });
        D.text(ctx, '↓ 고도를 잃는다', ax + 10, ay + 24, { size: 10, color: C.Vs });
        D.text(ctx, '고도 ' + fmt(st.alt, 0) + ' m', B.x0 + 4, B.y0 + (narrow ? 24 : 30), { size: narrow ? 11 : 12, color: C.Vs, bold: true });
      }
      D.text(ctx, 'L·sinφ → 선회 중심', px + Math.max(Lx, span) + 8, py - 6, { size: 10, color: C.n });
      // 조종사가 실제로 느끼는 무게는 날개가 실제로 낸 양력 — 실속이면 필요한 n 이 아니라 n_eff
      D.text(ctx, (narrow ? '' : '조종사가 느끼는 무게 ') + '×' + fmt(nE, 2) + ' (' + fmt(nE, 2) + ' G)' + (stall ? (narrow ? '' : ', 필요 ' + fmt(n, 2) + ' G') : ''),
        B.x1 - 4, B.y0 + (narrow ? 4 : 8), { size: narrow ? 11 : 12, color: stall ? C.Vs : C.n, align: 'right', bold: true });

      /* ── 속도 막대: 지금 속도 V 와 선회 실속 속도 Vₛ′ ── */
      const gx0 = B.x0 + (narrow ? 8 : 14), gx1 = B.x1 - (narrow ? 8 : 14), gy = B.y1 - (narrow ? 12 : 18);
      const VMAX = 260, GX = u => gx0 + clamp(u / VMAX, 0, 1) * (gx1 - gx0);
      D.roundRect(ctx, gx0, gy - 4, gx1 - gx0, 8, 4); ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill(); ctx.restore();
      D.roundRect(ctx, gx0, gy - 4, GX(Vt) - gx0, 8, 4); ctx.save(); ctx.fillStyle = 'rgba(196,112,95,.35)'; ctx.fill(); ctx.restore();
      D.line(ctx, GX(p.Vs), gy - 7, GX(p.Vs), gy + 7, { color: C.Vs, width: 1.4, dash: [2, 2] });
      D.line(ctx, GX(Vt), gy - 9, GX(Vt), gy + 9, { color: C.Vt, width: 2.4, hot: hl === 'Vt' || hl === 'Vs' });
      D.dot(ctx, GX(p.V), gy, hl === 'V' ? 6.5 : 5.5, C.V, hl === 'V');
      D.text(ctx, '실속 ' + fmt(Vt, 0), GX(Vt), gy - 12, { size: 10, color: C.Vt, align: 'center', bold: hl === 'Vt' });
      D.text(ctx, 'V ' + fmt(p.V, 0), GX(p.V), gy + 19, { size: 10, color: C.V, align: 'center', bold: hl === 'V' });
      if (!narrow) D.text(ctx, 'm/s', gx1, gy + 19, { size: 9.5, color: PAL.ink3, align: 'right' });
      if (stall) D.tag(ctx, st.done ? '실속으로 ' + ALT_LIMIT + ' m 추락. 값을 바꾸면 다시 출발' : '실속! 이 기울기에서는 ' + fmt(Vt, 0) + ' m/s 보다 빨라야',
        (B.x0 + B.x1) / 2, py + k + (narrow ? 20 : 30), C.Vs, true);
    }
  });
})();
