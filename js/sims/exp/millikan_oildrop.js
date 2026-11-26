/* [유명한 실험] 밀리컨 기름방울 실험(1909) : 전하는 띄엄띄엄한 덩어리로만 있다.
   두 금속판(간격 d = 5 mm) 사이에 아주 작은 기름방울을 띄우고 위쪽 판에 전압 V 를 건다.
   방울이 전자 n 개를 더 가지면 전하 q = n·e (음전하), 전기장 E = V/d 는 위(+)에서 아래(−)로 향하므로
   전기력 qE 는 위로 작용한다. 무게 W = (4/3)πr³ρg 와 같아지면 방울이 멈추고, 그때 q = W·d/V 로 전하를 잰다.
   방울이 작아 공기 저항(스토크스 6πηrv)이 크므로 10만분의 1초 안에 끝 속도 v = (qE − W)/(6πηr) 에 이른다.
   이 짧은 가속 구간과 공기 부력(기름의 0.1 % 남짓), 브라운 운동은 뺐다. 방울 크기는 그림에서 크게 과장한다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { r: PAL.violet, n: PAL.dusty, V: PAL.steel, E: PAL.teal, W: PAL.burnt, q: PAL.amber, v: PAL.sage, Vb: PAL.rust, y: PAL.ink };

  const E0 = 1.602176634e-19;   // 기본 전하 (C, 정의값)
  const RHO = 900;              // 기름 밀도 (kg/m³, 밀리컨이 쓴 시계 기름은 약 920)
  const ETA = 1.81e-5;          // 20 °C 공기의 점성 계수 (Pa·s)
  const G = 9.8;                // 중력 가속도 (m/s²)
  const GAP = 5e-3;             // 판 간격 d (m)
  const Y0 = 4.0;               // 방울이 처음 보이는 높이 (아랫판에서 mm)
  const NMAX = 11;              // 전하 사다리의 맨 위 칸 (e 의 배수)
  const BAL = .02;              // 알짜힘이 무게의 2 % 안이면 "멈춤"으로 본다

  // 모든 값은 SI 로 계산한다
  function forces(p) {
    const r = p.r * 1e-6;
    const W = 4 / 3 * Math.PI * r * r * r * RHO * G;    // 무게 (N)
    const q = p.n * E0;                                  // 전하의 크기 (C)
    const E = p.V / GAP;                                 // 전기장 (V/m)
    const Fe = q * E;                                    // 전기력 (N, 위로)
    const v = (Fe - W) / (6 * Math.PI * ETA * r);        // 끝 속도 (m/s, 위가 +)
    const Vb = W * GAP / q;                              // 멈추게 하는 전압 (V)
    return { W, q, E, Fe, v, Vb };
  }
  const balanced = P => { const f = forces(P); return P.V > 0 && Math.abs(f.Fe - f.W) <= BAL * f.W; };

  PS.register({
    id: 'exp-millikan', mode: 'exp', category: '물질의 구조를 밝히다',
    title: '밀리컨 기름방울 실험 (1909)',
    sub: '멈춘 방울: qE = mg, 그리고 q = n·e',
    tagline: '두 금속판 사이의 작은 기름방울을 전압으로 공중에 멈춰 세웁니다. 그때 잰 전하가 늘 같은 덩어리(e)의 정수배인 것을 확인합니다.',

    params: [
      { key: 'r', symbol: 'r', label: '방울의 반지름', unit: 'µm', min: .5, max: 2, step: .05, value: 1, color: C.r, reset: true, dec: 2,
        where: '가운데 <b>노란 방울</b>의 크기입니다(그림은 과장). 반지름이 두 배면 부피와 무게는 8배가 되어 멈추는 데 훨씬 큰 전압이 듭니다.' },
      { key: 'n', symbol: 'n', label: '방울이 더 가진 전자 수', unit: '개', min: 1, max: 10, step: 1, value: 3, color: C.n, reset: true, dec: 0,
        where: '방울의 전하 q = n·e 를 정합니다. 오른쪽(폰에서는 아래) <b>전하 사다리</b>에서 노란 점이 n 번째 칸에 놓입니다.' },
      { key: 'V', symbol: 'V', label: '판 사이 전압', unit: 'V', min: 0, max: 1000, step: 1, value: 0, color: C.V, dec: 0,
        where: '<b>위쪽 판</b>에 거는 전압입니다. 판 사이의 청록 점선(전기장)이 진해지고, 방울을 위로 당기는 청록 화살표가 길어집니다.' }
    ],
    vars: {
      W: { symbol: 'W', label: '방울의 무게 (mg)', unit: 'fN', color: C.W,
        where: '오른쪽 힘 그림의 <b>아래로 향한 주황 화살표</b>입니다. 1 fN(펨토뉴턴)은 1000조분의 1 N 입니다.' },
      q: { symbol: 'q', label: '방울의 전하', unit: '×10⁻¹⁹ C', color: C.q,
        where: '방울이 가진 전기의 양으로, 전하 사다리 위의 <b>노란 점</b>입니다. 늘 e 의 정수배 자리에만 놓입니다.' },
      E: { symbol: 'E', label: '판 사이 전기장', unit: 'kV/m', color: C.E,
        where: '판 사이의 <b>청록 점선</b>입니다. 위쪽 (+)판에서 아래쪽 (−)판으로 향하고, 세기는 전압 ÷ 판 간격입니다.' },
      v: { symbol: 'v', label: '방울의 끝 속도 (위가 +)', unit: 'mm/s', color: C.v,
        where: '방울이 공기 저항과 힘이 맞아 떨어져 움직이는 일정한 빠르기입니다. 아래 그래프에서 높이 곡선의 기울기입니다.' },
      Vb: { symbol: 'V_b', label: '방울을 멈추게 하는 전압', unit: 'V', color: C.Vb,
        where: '이 전압에서 전기력과 무게가 같아집니다. 두 판 사이 오른쪽 위의 <b>빨간 글자</b>로 나오며, 지금 전압과 비교해 보면 됩니다.' },
      y: { symbol: 'y', label: '방울의 높이 (아랫판에서)', unit: 'mm', color: C.y,
        where: '왼쪽 눈금자로 읽는 방울의 높이입니다. 판 간격은 5 mm 이고, 아래 그래프가 이 값을 시간에 따라 그립니다.' }
    },
    formulas: [
      { name: '방울의 무게 (ρ: 기름 밀도)', tpl: '{W} = mg = (4⁄3)π{r}³ρg' },
      { name: '전하는 기본 전하 e 의 정수배', tpl: '{q} = {n}e' },
      { name: '판 사이 전기장 (d = 5 mm)', tpl: '{E} = {V} ⁄ d' },
      { name: '멈출 때: 전기력 = 무게', tpl: '{q}{E} = {W}   →   {Vb} = {W}d ⁄ ({n}e)' },
      { name: '공기 저항과 맞선 끝 속도 (η: 공기의 점성)', tpl: '{v} = ({q}{E} − {W}) ⁄ (6πη{r})' }
    ],

    init() { return { y: Y0, stuck: 0 }; },
    step(st, p, dt) {
      if (st.stuck) return;
      const f = forces(p);
      st.y += f.v * 1e3 * dt;                                     // mm
      if (st.y >= GAP * 1e3) { st.y = GAP * 1e3; st.stuck = 1; st.done = true; }
      else if (st.y <= 0) { st.y = 0; st.stuck = -1; st.done = true; }
    },

    graphs: [
      { title: '방울의 높이 – 시간', xmin: 6, y0: 0,
        series: [{ key: 'y', label: '방울 높이 y (mm)', color: C.y }] }
    ],
    sample(st) { return { y: st.y }; },

    readouts(st, p) {
      const f = forces(p), vNow = st.stuck ? 0 : f.v * 1e3;
      const meas = p.V > 0 ? f.W * GAP / p.V : null;            // 지금 전압으로 계산한 전하 W·d/V
      let state;
      if (st.stuck > 0) state = '윗판에 닿았습니다. 전압을 낮추고 다시 시작해 보세요';
      else if (st.stuck < 0) state = '아랫판에 닿았습니다. 전압을 올리고 다시 시작해 보세요';
      else if (balanced(p)) state = '방울이 멈췄습니다. 전기력 qE 와 무게 W 가 같습니다';
      else if (f.v > 0) state = '전기력이 무게보다 커서 올라갑니다';
      else state = '무게가 전기력보다 커서 떨어집니다';
      return [
        { label: '방울 높이 y', value: st.y, unit: 'mm', color: C.y, dec: 3 },
        { label: '방울 속도 v', value: vNow, unit: 'mm/s', color: C.v, dec: 4 },
        { label: '무게 W', value: f.W * 1e15, unit: 'fN', color: C.W, dec: 2 },
        { label: '전기력 qE', value: f.Fe * 1e15, unit: 'fN', color: C.E, dec: 2 },
        { label: '전기장 E', value: f.E / 1e3, unit: 'kV/m', color: C.E, dec: 1 },
        { label: '방울의 전하 q', value: f.q * 1e19, unit: '×10⁻¹⁹ C', color: C.q, dec: 3 },
        f.Vb <= 1000 ? { label: '멈추게 하는 전압 V_b', value: f.Vb, unit: 'V', color: C.Vb, dec: 1 }
                     : { label: '멈추게 하는 전압 V_b', value: fmt(f.Vb, 0) + ' V (1000 V 를 넘어 멈출 수 없음)', unit: '', color: C.Vb },
        meas !== null ? { label: '지금 전압으로 잰 전하 Wd ⁄ V', value: meas * 1e19, unit: '×10⁻¹⁹ C', color: C.V, dec: 3 }
                      : { label: '지금 전압으로 잰 전하 Wd ⁄ V', value: '전압이 0 이라 잴 수 없음', unit: '', color: C.V },
        meas !== null ? { label: '잰 전하 ÷ e', value: meas / E0, unit: '배', color: C.V, dec: 2 }
                      : { label: '잰 전하 ÷ e', value: '전압이 0 이라 잴 수 없음', unit: '', color: C.V },
        { label: '상태', wide: true, value: state, unit: '', color: balanced(p) && !st.stuck ? C.q : PAL.ink2 }
      ];
    },

    notes: [
      '풍선을 머리에 비비면 정전기로 머리카락이 끌려 올라갑니다. 전기를 띤 작은 기름방울도 전기력으로 위로 당길 수 있고, 무게와 같아지면 공중에 멈춥니다.',
      '방울이 멈추면 전기력 qE 와 무게 W 가 같습니다. 무게는 방울 크기로, 전기장은 전압으로 알 수 있으니 전하 q = W ⁄ E 를 계산할 수 있습니다.',
      '밀리컨이 수많은 방울을 재어 보니 전하는 늘 1.6×10⁻¹⁹ C 의 정수배였습니다. 이 가장 작은 덩어리가 전자 하나의 전하, 기본 전하 e 입니다.',
      '작은 방울은 공기 저항이 커서 10만분의 1초 만에 일정한 속도가 됩니다. 밀리컨은 전압을 끄고 떨어지는 빠르기를 재어 방울의 크기를 알아냈습니다.',
      '이 실험으로 밀리컨은 1923년 노벨 물리학상을 받았습니다. 그림의 방울은 보이게 크게 그렸고, 공기 부력과 방울의 흔들림(브라운 운동)은 뺐습니다.'
    ],
    presets: [
      { name: '전압 끄기 (그냥 떨어지기)', set: { r: 1, n: 3, V: 0 } },
      { name: '딱 멈춘 방울 (n = 3)', set: { r: 1, n: 3, V: 384 } },
      { name: '전자 한 개짜리 방울', set: { r: .5, n: 1, V: 144 } },
      { name: '세게 끌어올리기', set: { r: .5, n: 10, V: 1000 } }
    ],
    challenges: [
      {
        id: 'stop', title: '방울을 공중에 멈추기',
        desc: '전압을 올려 방울이 공중에 멈추게 해 보세요. 전기력과 무게의 차이가 무게의 2 % 안이면 멈춘 것으로 봅니다.',
        hint: '전압이 클수록 위로 당기는 힘이 커집니다. 방울이 올라가기 시작하면 조금씩 낮추세요. V_b 측정값을 봐도 됩니다.',
        check: ({ P }) => balanced(P)
      },
      {
        id: 'rise', title: '위로 올려 보내기',
        desc: '방울이 1초에 0.2 mm 넘게 위로 올라가게 만들어 보세요.',
        hint: '전기력이 무게보다 훨씬 커야 합니다. 작은 방울(가벼움)에 전자를 많이 주고 전압을 높이세요.',
        check: ({ P }) => forces(P).v * 1e3 >= .2
      },
      {
        id: 'single', title: '전자 한 개를 잡아라',
        desc: '전자를 딱 한 개 더 가진 방울(n = 1)을 공중에 멈춰 보세요. 이때 잰 전하가 바로 기본 전하 e 입니다.',
        hint: '전하가 작으면 큰 전기장이 필요합니다. 방울을 가장 작게(0.5 µm) 하면 150 V 아래에서 멈춥니다.',
        check: ({ P }) => P.n === 1 && balanced(P)
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600, small = h < 330;
      const f = forces(p), dmm = GAP * 1e3, stopped = balanced(p) && !st.stuck;
      const fs = small ? 9.5 : 10.5;

      /* 배치: 넓으면 [판 | 전하 사다리], 좁으면 위 판, 아래 전하 사다리 */
      const aw = narrow ? w : w * .64, ah = narrow ? h * .64 : h;
      if (narrow) D.line(ctx, 8, ah, w - 8, ah, { color: PS.rgba('line', .9) });
      else D.line(ctx, aw + 4, 10, aw + 4, h - 10, { color: PS.rgba('line', .9) });

      // 머리글
      let head;
      if (st.stuck > 0) head = '윗판에 닿음';
      else if (st.stuck < 0) head = '아랫판에 닿음';
      else if (stopped) head = '방울이 멈춤 (qE = W)';
      else head = f.v > 0 ? '올라가는 중' : '떨어지는 중';
      D.text(ctx, head, 8, 15, { size: small ? 10.5 : 12, color: stopped ? C.q : PAL.ink, bold: true });
      D.text(ctx, 'V = ' + fmt(p.V, 0) + ' V', aw - 8, 15, { size: small ? 10.5 : 12, color: C.V, align: 'right', bold: true });

      // 두 판 (위 +, 아래 −)
      const plateH = small ? 6 : 9;
      const yT = (small ? 34 : 46) + plateH, yB = ah - (small ? 14 : 30) - plateH;
      const px0 = small ? 44 : 58, px1 = aw - (narrow ? 12 : 16);
      const Y = mm => yB - (mm / dmm) * (yB - yT);
      const hotV = hl === 'V' || hl === 'E';
      D.poly(ctx, [[px0, yT - plateH], [px1, yT - plateH], [px1, yT], [px0, yT]], { fill: PS.rgba('steel', .55), stroke: C.V, width: hotV ? 2 : 1, hot: hotV });
      D.poly(ctx, [[px0, yB], [px1, yB], [px1, yB + plateH], [px0, yB + plateH]], { fill: PS.rgba('ink3', .55), stroke: PAL.ink3, width: 1 });
      D.text(ctx, '+', px1 - 10, yT - plateH - 4, { size: 12, color: C.V, bold: true, align: 'center' });
      D.text(ctx, '−', px1 - 10, yB + plateH + 13, { size: 12, color: PAL.ink2, bold: true, align: 'center' });

      // 전기장 E: 위(+)에서 아래(−)로, 세기만큼 진하게
      const eA = p.V > 0 ? .12 + .5 * p.V / 1000 : 0;
      if (eA > 0) {
        const nL = Math.max(3, Math.floor((px1 - px0) / 70));
        for (let i = 0; i < nL; i++) {
          const x = px0 + (px1 - px0) * (i + .5) / nL;
          if (Math.abs(x - (px0 + px1) / 2) < 40) continue;          // 방울 둘레는 비워 둔다
          D.arrow(ctx, x, yT + 4, 0, yB - yT - 8, { color: PS.rgba('teal', eA), width: hl === 'E' ? 1.8 : 1.1, head: 6, dash: [3, 4] });
        }
      }

      // 눈금자 (현미경 속 눈금, 0.5 mm 간격)
      const rx = px0 - 10;
      D.line(ctx, rx, yT, rx, yB, { color: PS.rgba('ink3', .8) });
      for (let k = 0; k <= 10; k++) {
        const mm = k * .5, yy = Y(mm), major = k % 2 === 0;
        D.line(ctx, rx - (major ? 6 : 3), yy, rx, yy, { color: PS.rgba('ink3', .9) });
        if (major && (!small || k % 4 === 0)) D.text(ctx, fmt(mm, 0), rx - 9, yy + 3.5, { size: 9, color: PAL.ink3, align: 'right' });
      }
      D.text(ctx, 'mm', rx - 9, yT - plateH - 4, { size: 9, color: PAL.ink3, align: 'right' });

      // 방울과 그 자취
      const cx = px0 + (px1 - px0) * (narrow ? .42 : .38);
      const rpx = 3.5 + 3 * p.r;
      let dy = clamp(Y(st.y), yT + rpx, yB - rpx);
      D.line(ctx, cx, Y(Y0), cx, dy, { color: PS.rgba('ink', .18), width: 1, dash: [2, 3] });
      D.dot(ctx, cx, dy, rpx, C.q, hl === 'q' || hl === 'r' || hl === 'n' || stopped);
      D.text(ctx, '−' + p.n + 'e', cx - rpx - 5, dy + 4, { size: fs, color: C.q, align: 'right', bold: hl === 'n' || hl === 'q' });
      // 높이 y 를 눈금자에 잇는 선
      D.line(ctx, rx, dy, cx - rpx - 30, dy, { color: PS.rgba('ink', hl === 'y' ? .6 : .25), width: 1, dash: [1, 3] });

      // 멈추는 전압까지 얼마나 남았나 (판 오른쪽 위)
      if (!small) {
        const msg = f.Vb <= 1000 ? 'V_b = ' + fmt(f.Vb, 0) + ' V 에서 멈춤' : 'V_b = ' + fmt(f.Vb, 0) + ' V (범위 밖)';
        D.text(ctx, msg, px1, yT + 18, { size: fs, color: C.Vb, align: 'right', bold: hl === 'Vb' });
      }

      // 힘 그림: 방울 오른쪽에 따로 (판 밖으로 나가지 않게)
      const fx = Math.min(cx + (narrow ? 96 : 130), px1 - 40), fy = (yT + yB) / 2;
      const span = Math.max(16, (yB - yT) / 2 - 16);
      const kF = span / Math.max(f.W, f.Fe, 1e-30);
      // 움직일 때는 공기 저항이, 판에 닿아 멈췄을 때는 판이 미는 힘이 qE − W 를 맞비긴다
      const lW = f.W * kF, lE = f.Fe * kF, drag = f.Fe - f.W;
      D.dot(ctx, fx, fy, 3.5, C.q);
      D.arrow(ctx, fx, fy, 0, lW, { color: C.W, width: 2.6, head: 8, hot: hl === 'W' });
      if (lE > .8) D.arrow(ctx, fx, fy, 0, -lE, { color: C.E, width: 2.6, head: 8, hot: hl === 'E' || hl === 'V' });
      const lD = Math.abs(drag) * kF;
      if (lD > 2 && !stopped) D.arrow(ctx, fx + 14, fy, 0, drag > 0 ? lD : -lD, { color: PAL.ink2, width: 1.6, head: 6 });
      D.text(ctx, 'W', fx + 8, fy + lW - 2, { size: fs, color: C.W, bold: true });
      if (lE > .8) D.text(ctx, 'qE', fx - 8, fy - lE + 8, { size: fs, color: C.E, bold: true, align: 'right' });
      if (lD > 2 && !stopped && !small) D.text(ctx, st.stuck ? '판이 미는 힘' : '공기 저항', fx + 20, fy + (drag > 0 ? lD : -lD) / 2 + 3, { size: 9.5, color: PAL.ink2 });
      if (!small) D.text(ctx, '방울에 걸리는 힘', fx, yB - 6, { size: 9.5, color: PAL.ink3, align: 'center' });

      // 속도 (아래)
      const vRaw = st.stuck ? 0 : f.v * 1e3, vNow = Math.abs(vRaw) < 5e-4 ? 0 : vRaw;   // 0.000 보다 작으면 부호 없이 0
      D.text(ctx, 'v = ' + (vNow > 0 ? '+' : '') + fmt(vNow, 3) + ' mm/s', px0, ah - (small ? 3 : 10), { size: fs, color: C.v, bold: hl === 'v' });
      if (!small && !narrow) D.text(ctx, '방울 크기는 과장해 그림', px1, ah - 10, { size: 9.5, color: PAL.ink3, align: 'right' });

      /* 전하 사다리: q 는 e 의 정수배 자리에만 놓인다 */
      const meas = p.V > 0 ? f.W * GAP / p.V / E0 : null;   // 지금 전압으로 잰 전하 (e 단위)
      if (!narrow) {
        const lx = aw + (w - aw) * .45, l0 = h - (small ? 24 : 40), l1 = small ? 36 : 56;
        const LY = k => l0 - (k / NMAX) * (l0 - l1);
        D.text(ctx, '전하 사다리', lx, small ? 15 : 18, { size: small ? 10.5 : 12, color: PAL.ink, bold: true, align: 'center' });
        if (!small) D.text(ctx, '(e 의 몇 배인가)', lx, 34, { size: 9.5, color: PAL.ink3, align: 'center' });
        D.line(ctx, lx, l0, lx, l1, { color: PS.rgba('ink3', .8) });
        for (let k = 0; k <= NMAX; k++) {
          const yy = LY(k);
          D.line(ctx, lx - 14, yy, lx + 14, yy, { color: PS.rgba('ink3', k === p.n ? 1 : .55), width: k === p.n ? 1.6 : 1 });
          if (!small || k % 2 === 0) D.text(ctx, k + 'e', lx - 20, yy + 3.5, { size: 9, color: k === p.n ? C.q : PAL.ink3, align: 'right' });
        }
        D.dot(ctx, lx, LY(p.n), 5.5, C.q, hl === 'q' || hl === 'n');
        if (meas !== null) {
          const mk = Math.min(meas, NMAX + .4), yy = LY(mk);
          D.poly(ctx, [[lx + 18, yy], [lx + 28, yy - 5], [lx + 28, yy + 5]], { fill: C.V });
          D.text(ctx, meas > NMAX + .4 ? '잰 전하 ' + fmt(meas, 0) + 'e ↑' : '잰 전하 ' + fmt(meas, 2) + 'e', lx + 32, yy + 3.5, { size: fs, color: C.V });
        } else D.text(ctx, '전압 0: 잴 수 없음', lx, l0 + 18, { size: 9.5, color: C.V, align: 'center' });
      } else {
        const l0 = 26, l1 = w - 26, ly = ah + (h - ah) * .56;
        const LX = k => l0 + (k / NMAX) * (l1 - l0);
        D.text(ctx, '전하 사다리 (e 의 몇 배인가)', 8, ah + (small ? 12 : 18), { size: small ? 9.5 : 11, color: PAL.ink, bold: true });
        D.line(ctx, l0, ly, l1, ly, { color: PS.rgba('ink3', .8) });
        for (let k = 0; k <= NMAX; k++) {
          const xx = LX(k);
          D.line(ctx, xx, ly - 8, xx, ly + 8, { color: PS.rgba('ink3', k === p.n ? 1 : .55), width: k === p.n ? 1.6 : 1 });
          if (k % 2 === 0 || k === p.n) D.text(ctx, String(k), xx, ly + 20, { size: 9, color: k === p.n ? C.q : PAL.ink3, align: 'center' });
        }
        D.dot(ctx, LX(p.n), ly, 5, C.q, hl === 'q' || hl === 'n');
        if (meas !== null) {
          const xx = LX(Math.min(meas, NMAX + .4));
          D.poly(ctx, [[xx, ly - 10], [xx - 5, ly - 19], [xx + 5, ly - 19]], { fill: C.V });
          if (!small) D.text(ctx, '잰 전하 ' + (meas > NMAX + .4 ? fmt(meas, 0) + 'e →' : fmt(meas, 2) + 'e'), w - 8, ah + 18, { size: fs, color: C.V, align: 'right' });
        }
      }
    }
  });
})();
