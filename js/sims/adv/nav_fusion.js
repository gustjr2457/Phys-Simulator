/* [공학응용·항법] 자이로와 가속도계 합치기 (상보 필터) — θ_f ← α(θ_f + ωΔt) + (1 − α)θ_a,  α = τ/(τ + Δt)
   드론의 실제 기울기 θ(t) = A·sin(2πt/5 s) 를 두 센서가 100 Hz(Δt = 0.01 s)로 잰다.
   자이로: 돌아가는 빠르기 ω 에 치우침 b 가 더해져 나온다. 더해 가면(적분) 모양은 잘 따라가지만 오차가 b·t 로 계속 쌓인다.
   가속도계: 중력 방향으로 기울기를 바로 재지만, 진동 때문에 표준편차 σ 로 떨린다(같은 씨앗의 의사 난수라 매번 같은 떨림).
   상보 필터: 짧은 시간에는 자이로, 긴 시간(τ 보다 긴)에는 가속도계를 믿는다.
   치우침만 있으면 필터 오차는 b·τ 로 다가가고, 떨림은 1차 필터를 지나 σ·√(Δt/(2τ + Δt)) 로 줄어든다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { th: PAL.ink, A: PAL.violet, b: PAL.rust, sig: PAL.dusty, tau: PAL.sage, w: PAL.steel,
    thg: PAL.rust, tha: PAL.dusty, thf: PAL.amber, al: PAL.sage, eg: PAL.rust, ef: PAL.amber, nf: PAL.amber };

  const H = .01;          // 센서 표본 간격 Δt (s) — 100 Hz
  const PER = 5;          // 드론이 한 번 흔들리는 주기 (s)
  const WIN = 10;         // 화면 속 각도 그래프가 보여 주는 시간 (s)
  const SEED = 20261125;
  const RAD = Math.PI / 180;

  const truth = (p, t) => p.A * Math.sin(2 * Math.PI * t / PER);

  // 같은 씨앗에서 나오는 의사 난수 (선형 합동) → 표준 정규 분포 (박스-뮬러)
  function gauss(st) {
    st.seed = (Math.imul(st.seed, 1664525) + 1013904223) >>> 0;
    const u1 = (st.seed + 1) / 4294967297;
    st.seed = (Math.imul(st.seed, 1664525) + 1013904223) >>> 0;
    const u2 = st.seed / 4294967296;
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  // 센서 한 번 읽기 (Δt = 0.01 s)
  function tick(st, p) {
    const t1 = st.ts + H, th0 = truth(p, st.ts), th1 = truth(p, t1);
    const w = (th1 - th0) / H + p.b;                 // 자이로가 내놓는 회전 빠르기 (실제 + 치우침)
    const al = p.tau / (p.tau + H);
    st.w = w;
    st.thg += w * H;                                  // 자이로만 더해 간 각도
    st.tha = th1 + p.sig * gauss(st);                 // 가속도계가 본 각도 (떨림 포함)
    st.thf = al * (st.thf + w * H) + (1 - al) * st.tha;
    st.ts = t1; st.th = th1;
    st.n++;
    st.sa2 += (st.tha - th1) * (st.tha - th1);
    st.sf2 += (st.thf - th1) * (st.thf - th1);
    if (st.n % 5 === 0) {                             // 화면 그래프용 기록 (20 Hz)
      st.hist.push({ t: t1, th: th1, thg: st.thg, tha: st.tha, thf: st.thf });
      if (st.hist.length > WIN * 20 + 10) st.hist.shift();
    }
  }

  PS.register({
    id: 'adv-fusion', mode: 'adv', category: '항법',
    title: '자이로와 가속도계 합치기 (상보 필터)',
    sub: 'θ_f = α(θ_f + ωΔt) + (1−α)θ_a',
    tagline: '드론이 자기 기울기를 알아내는 방법입니다. 점점 틀어지는 자이로와 마구 떨리는 가속도계를 섞어 둘보다 정확한 각도를 얻는 것을 봅니다.',

    params: [
      { key: 'A', symbol: 'A', label: '드론이 흔들리는 폭', unit: '°', min: 0, max: 40, step: 5, value: 20, color: C.A, dec: 0,
        where: '드론이 좌우로 기우는 최대 각도입니다. 오른쪽 각도 그래프의 <b>보라 점선 두 줄</b>이 ±A 입니다.' },
      { key: 'b', symbol: 'b', label: '자이로 치우침', unit: '°/s', min: 0, max: 5, step: .1, value: 1.5, color: C.b, dec: 1,
        where: '가만히 있어도 자이로가 "돌고 있다"고 잘못 알려 주는 빠르기입니다. <b>빨간 선(자이로만)</b>이 시간이 갈수록 위로 벗어나는 원인입니다.' },
      { key: 'sig', symbol: 'σ', label: '가속도계 떨림', unit: '°', min: 0, max: 15, step: .5, value: 6, color: C.sig, dec: 1,
        where: '모터 진동 때문에 가속도계 각도가 흔들리는 크기(표준편차)입니다. 그래프의 <b>분홍 점들</b>이 흩어진 폭입니다.' },
      { key: 'tau', symbol: 'τ', label: '필터 시정수', unit: 's', min: .1, max: 10, step: .1, value: 2, color: C.tau, dec: 1,
        where: '필터가 가속도계를 몇 초에 걸쳐 천천히 믿는가입니다. 그래프 아래 <b>초록 치수선</b>의 길이가 τ 입니다. 크면 자이로를 더 오래 믿습니다.' }
    ],
    vars: {
      th: { symbol: 'θ', label: '실제 기울기', unit: '°', color: C.th,
        where: '왼쪽 그림의 <b>흰 드론 몸체</b>가 기운 각도이고, 오른쪽 그래프의 굵은 흰 곡선입니다.' },
      w: { symbol: 'ω', label: '자이로가 잰 회전 빠르기', unit: '°/s', color: C.w,
        where: '자이로가 1초에 몇 도 돌았다고 알려 주는 값입니다. 왼쪽 그림 위 파란 글자로 나옵니다. 실제 빠르기에 치우침 b 가 더해져 있습니다.' },
      thg: { symbol: 'θ_g', label: '자이로만 쓴 각도', unit: '°', color: C.thg,
        where: '자이로의 ω 를 0.01초마다 더해 간 각도입니다. 왼쪽의 <b>빨간 선</b>, 오른쪽 그래프의 빨간 곡선입니다.' },
      tha: { symbol: 'θ_a', label: '가속도계 각도', unit: '°', color: C.tha,
        where: '중력이 당기는 방향으로 잰 각도입니다. 왼쪽의 <b>분홍 선</b>(떨림), 오른쪽 그래프의 분홍 점들입니다.' },
      thf: { symbol: 'θ_f', label: '상보 필터 각도', unit: '°', color: C.thf,
        where: '두 센서를 섞어 얻은 각도입니다. 왼쪽의 <b>노란 선</b>, 오른쪽 그래프의 노란 곡선으로, 흰 곡선(실제)에 가장 가깝게 붙어 갑니다.' },
      al: { symbol: 'α', label: '자이로를 믿는 비율', unit: '', color: C.al,
        where: '0.01초마다 자이로 쪽에 주는 몫입니다. 나머지 1 − α 만큼 가속도계 쪽으로 당깁니다. τ 가 클수록 1 에 가깝습니다.' },
      eg: { symbol: 'e_g', label: '자이로만 쓴 오차', unit: '°', color: C.eg,
        where: '빨간 곡선이 흰 곡선에서 벗어난 각도입니다. 치우침이 쌓여 시간에 비례해 커집니다. 아래 오차 그래프의 빨간 선입니다.' },
      ef: { symbol: 'e_b', label: '치우침이 남기는 필터 오차', unit: '°', color: C.ef,
        where: '충분히 오래 지난 뒤 노란 곡선이 흰 곡선보다 늘 위에 떠 있는 각도입니다. 아래 오차 그래프의 노란 선이 이 값 근처에 머뭅니다.' },
      nf: { symbol: 'σ_f', label: '필터를 지나고 남는 떨림', unit: '°', color: C.nf,
        where: '노란 곡선에 남은 잔떨림의 크기입니다. 분홍 점들(σ)보다 훨씬 작습니다. τ 를 키울수록 매끈해집니다.' }
    },
    formulas: [
      { name: '자이로만 쓰면 오차가 쌓인다', tpl: '{eg} = {b} · t' },
      { name: '상보 필터 (0.01초마다)', tpl: '{thf} ← {al}·({thf} + {w}Δt) + (1 − {al})·{tha}' },
      { name: '자이로를 믿는 비율', tpl: '{al} = {tau} ⁄ ({tau} + Δt)' },
      { name: '치우침이 남기는 오차', tpl: '{ef} = {b} · {tau}' },
      { name: '남는 떨림', tpl: '{nf} ≈ {sig} · √(Δt ⁄ 2{tau})' }
    ],

    init(p) {
      return { seed: SEED, acc: 0, ts: 0, th: 0, w: 0, thg: 0, tha: 0, thf: 0, n: 0, sa2: 0, sf2: 0, hist: [] };
    },

    step(st, p, dt) {
      st.acc += dt;                                   // 센서는 100 Hz — 지나간 시간만큼 읽는다
      while (st.acc >= H - 1e-12) { st.acc -= H; tick(st, p); }
    },

    graphs: [{
      title: '오차 – 시간', xmin: 8, window: 14,
      series: [
        { key: 'eg', label: '자이로만 쓴 오차 e_g', color: C.eg },
        { key: 'ef', label: '필터 오차', color: C.ef }
      ]
    }],
    sample(st, p) { return { eg: st.thg - st.th, ef: st.thf - st.th }; },

    readouts(st, p) {
      const al = p.tau / (p.tau + H), any = st.n > 0;
      const eg = st.thg - st.th, efNow = st.thf - st.th, eb = p.b * p.tau, nf = p.sig * Math.sqrt(H / (2 * p.tau));
      return [
        { label: '실제 기울기 θ', value: st.th, unit: '°', color: C.th, dec: 1 },
        { label: '자이로가 잰 회전 빠르기 ω', value: st.w, unit: '°/s', color: C.w, dec: 1 },
        { label: '자이로만 쓴 각도 θ_g', value: st.thg, unit: '°', color: C.thg, dec: 1 },
        { label: '가속도계 각도 θ_a', value: st.tha, unit: '°', color: C.tha, dec: 1 },
        { label: '상보 필터 각도 θ_f', value: st.thf, unit: '°', color: C.thf, dec: 1 },
        { label: '자이로만 쓴 오차 e_g', value: eg, unit: '°', color: C.eg, dec: 2 },
        { label: '필터 오차 (지금)', value: efNow, unit: '°', color: C.ef, dec: 2 },
        { label: '치우침이 남기는 오차 b·τ', value: eb, unit: '°', color: C.ef, dec: 2 },
        { label: '남는 떨림 σ√(Δt/2τ)', value: nf, unit: '°', color: C.nf, dec: 2 },
        { label: '자이로를 믿는 비율 α', value: al, unit: '', color: C.al, dec: 4 },
        { label: '가속도계 오차의 RMS (잰 값)', value: any ? Math.sqrt(st.sa2 / st.n) : '아직 읽은 값 없음', unit: any ? '°' : '', color: C.tha, dec: 2 },
        { label: '필터 오차의 RMS (잰 값, 치우침 포함)', value: any ? Math.sqrt(st.sf2 / st.n) : '아직 읽은 값 없음', unit: any ? '°' : '', color: C.thf, dec: 2 },
        { label: '읽는 법', wide: true, color: C.thf,
          value: '자이로만 쓰면 ' + fmt(Math.abs(eg), 1) + '° 틀어졌고(점점 커짐), 가속도계는 ±' + fmt(p.sig, 1) + '° 로 떨린다. 필터는 치우침 ' +
            fmt(eb, 2) + '° 와 떨림 ' + fmt(nf, 2) + '° 만 남긴다' }
      ];
    },

    notes: [
      '눈을 감고 제자리에서 돌면 처음엔 방향을 알지만 오래 돌수록 헷갈립니다. 자이로도 작은 실수가 쌓여 점점 틀려집니다.',
      '가속도계는 중력이 당기는 쪽으로 기울기를 봅니다. 오래 보면 정확하지만, 진동이 있으면 값이 마구 떨립니다.',
      '상보 필터는 짧은 시간에는 자이로를, 긴 시간에는 가속도계를 믿습니다. 그 경계가 시정수 τ 입니다.',
      'τ 를 키우면 떨림은 줄지만 자이로 치우침이 <b>b·τ</b> 만큼 남습니다. 줄이면 반대입니다. 두 오차를 맞바꾸는 셈입니다.',
      '드론, 휴대폰 화면 돌리기, 비행기 자세계(AHRS)가 이렇게 센서를 합칩니다. 더 정교한 방법이 칼만 필터입니다.',
      '실제 가속도계는 기체가 가속하거나 선회할 때도 속습니다. 이 화면은 그런 효과를 떨림 σ 하나로만 나타냈습니다.'
    ],
    presets: [
      { name: '자이로를 오래 믿기 (τ = 10 s)', set: { tau: 10 } },
      { name: '가속도계를 바로 믿기 (τ = 0.1 s)', set: { tau: .1 } },
      { name: '알맞게 섞기 (τ = 0.5 s)', set: { tau: .5 } },
      { name: '비싼 자이로 (b = 0.1 °/s)', set: { b: .1 } },
      { name: '심한 진동 (σ = 15°)', set: { sig: 15, tau: 3 } }
    ],
    challenges: [
      {
        id: 'gyro10', title: '자이로만으로 10초 버티기',
        desc: '자이로만 쓴 각도가 10초 뒤에도 2° 넘게 틀리지 않게 해 보세요.',
        hint: '자이로 오차는 치우침 × 시간(b·t)으로 쌓입니다. 10초에 2° 이하면 치우침은 얼마여야 할까요?',
        check: ({ P }) => P.b * 10 <= 2 + 1e-9
      },
      {
        id: 'balance', title: '값싼 자이로로 알맞게 섞기',
        desc: '치우침이 1.5 °/s 이상인 자이로로, 필터의 떨림을 가속도계의 10분의 1 이하로 줄이면서 치우침 오차 b·τ 는 2° 이하로 만들어 보세요.',
        hint: '떨림이 10분의 1이 되려면 √(Δt/2τ) ≤ 0.1, 곧 τ ≥ 0.5 s 입니다. 그러면서 b·τ ≤ 2° 가 되는 τ 를 찾아보세요.',
        check: ({ P }) => P.b >= 1.5 - 1e-9 && P.tau >= .5 - 1e-9 && P.b * P.tau <= 2 + 1e-9
      },
      {
        id: 'good', title: '좋은 자이로의 힘',
        desc: '가속도계 떨림이 6° 이상인 채로, 치우침 오차 b·τ 는 0.5° 이하, 남는 떨림 σ_f 는 0.3° 이하로 만들어 보세요.',
        hint: '떨림을 0.3° 로 줄이려면 τ 가 꽤 커야 합니다(2초 이상). 그만큼 치우침 b 를 작게 해야 b·τ 가 작아집니다.',
        check: ({ P }) => P.sig >= 6 - 1e-9 && P.b * P.tau <= .5 + 1e-9 && P.sig * Math.sqrt(H / (2 * P.tau)) <= .3 + 1e-9
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600, small = h < 330;

      /* ── 배치: 넓으면 [드론 | 각도 그래프], 좁으면 위 드론, 아래 그래프 ── */
      const dw = narrow ? w : w * .4, dh = narrow ? h * .46 : h;
      const gx0 = narrow ? 34 : w * .44 + 30, gx1 = w - (narrow ? 40 : 96);
      const gy0 = narrow ? h * .46 + (small ? 22 : 30) : (small ? 34 : 46), gy1 = h - (small ? 24 : 34);
      if (narrow) D.line(ctx, 8, h * .46, w - 8, h * .46, { color: PS.rgba('line', .9) });
      else D.line(ctx, w * .42, 10, w * .42, h - 10, { color: PS.rgba('line', .9) });

      /* ── 드론 (뒤에서 본 모습) ── */
      const cx = dw / 2, cy = narrow ? dh * .58 : dh * .5;
      const R = Math.max(30, Math.min(dw * .34, dh * (narrow ? .4 : .3)));
      // 수평선
      D.line(ctx, cx - R * 1.35, cy, cx + R * 1.35, cy, { color: PS.rgba('ink3', .7), dash: [5, 5] });
      if (!small) D.text(ctx, '수평', cx - R * 1.35, cy - 6, { size: 10, color: PAL.ink3 });
      // 중력 방향 (가속도계가 보는 것)
      D.arrow(ctx, cx, cy + 10, 0, R * .55, { color: PS.rgba('dusty', .6), width: 1.8, head: 7, dash: [4, 3] });
      if (!small) D.text(ctx, '중력 (가속도계가 보는 방향)', cx - 8, cy + 10 + R * .55, { size: 10, color: PAL.dusty, align: 'right' });
      // 몸체 — 실제 기울기 θ, 반시계가 +
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(-st.th * RAD);
      if (hl === 'th') { ctx.shadowColor = PAL.ink; ctx.shadowBlur = 12; }
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-R * .85, 0); ctx.lineTo(R * .85, 0); ctx.stroke();
      ctx.fillStyle = PS.rgba('ink', .9);
      D.roundRect(ctx, -R * .16, -R * .1, R * .32, R * .2, 4); ctx.fill();
      ctx.shadowBlur = 0;
      [-1, 1].forEach(s => {
        ctx.fillStyle = PS.rgba('ink2', .55);
        ctx.beginPath(); ctx.ellipse(s * R * .85, -R * .1, R * .26, R * .05, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = PAL.ink2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(s * R * .85, 0); ctx.lineTo(s * R * .85, -R * .1); ctx.stroke();
      });
      ctx.restore();
      // ±A 범위 (보라 호)
      if (p.A > 0) {
        ctx.save();
        ctx.strokeStyle = PS.rgba('violet', hl === 'A' ? .9 : .45); ctx.lineWidth = hl === 'A' ? 2.5 : 1.5; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, -p.A * RAD, p.A * RAD); ctx.stroke();
        ctx.restore();
      }
      // 세 추정값 — 가운데에서 오른쪽으로 뻗는 선
      const ray = (ang, len, color, width, hot) => {
        const ex = cx + len * Math.cos(ang * RAD), ey = cy - len * Math.sin(ang * RAD);
        D.line(ctx, cx, cy, ex, ey, { color, width, hot });
        return [ex, ey];
      };
      const Lr = Math.max(R * .7, Math.min(R * 1.15, dw - cx - (narrow ? 40 : 92)));   // 이름표가 칸 경계를 넘지 않게
      const pg = ray(st.thg, Lr, C.thg, hl === 'thg' || hl === 'b' ? 3 : 2, hl === 'thg' || hl === 'b');
      const pa = ray(st.tha, Lr, PS.rgba('dusty', .85), hl === 'tha' || hl === 'sig' ? 2.6 : 1.6, hl === 'tha' || hl === 'sig');
      const pf = ray(st.thf, Lr, C.thf, hl === 'thf' ? 3.4 : 2.6, hl === 'thf');
      // 선 끝 이름표 — 위에서부터 줄 간격을 지켜 쌓는다 (세 선이 가까워도 겹치지 않게)
      const RL = [
        { p: pf, t: narrow ? 'θ_f' : 'θ_f 필터', col: C.thf, bold: true },
        { p: pg, t: narrow ? 'θ_g' : 'θ_g 자이로만', col: C.thg, bold: hl === 'thg' },
        { p: pa, t: narrow ? 'θ_a' : 'θ_a 가속도계', col: C.tha, bold: hl === 'tha' }
      ].map(o => ({ x: o.p[0] + 6, y: o.p[1] + 4, t: o.t, col: o.col, bold: o.bold })).sort((a, b) => a.y - b.y);
      const rgap = small ? 13 : 14;
      for (let i = 1; i < RL.length; i++) RL[i].y = Math.max(RL[i].y, RL[i - 1].y + rgap);
      RL.forEach(o => D.text(ctx, o.t, o.x, o.y, { size: small ? 10 : 11, color: o.col, bold: o.bold }));
      // 머리글
      D.text(ctx, '실제 기울기 θ = ' + fmt(st.th, 1) + '°', 10, small ? 14 : 18, { size: small ? 11 : 12.5, color: PAL.ink, bold: true });
      D.text(ctx, '자이로 ω = ' + fmt(st.w, 1) + ' °/s', 10, small ? 28 : 36, { size: small ? 10 : 11, color: C.w, bold: hl === 'w' });

      /* ── 각도 – 시간 그래프 (최근 10초) ── */
      const gw = gx1 - gx0, gh = gy1 - gy0;
      const Ym = Math.max(20, p.A + Math.max(10, 2 * p.sig));
      const tR = Math.max(WIN, st.ts), tL = tR - WIN;
      const X = t => gx0 + (t - tL) / WIN * gw;
      const Yr = v => gy0 + gh / 2 - v / Ym * gh / 2;                 // 곡선·점: 범위 밖은 잘라 낸다 (가장자리에 눌러 붙이지 않는다)
      const Y = v => Yr(clamp(v, -Ym, Ym));                           // 이름표 자리
      D.text(ctx, narrow ? '각도 – 시간 (점 = θ_a)' : '각도 – 시간 (최근 10초) · 분홍 점 = θ_a 가속도계', gx0, gy0 - (small ? 8 : 12), { size: small ? 10.5 : 11.5, color: PAL.ink2, bold: true });
      D.line(ctx, gx0, gy0, gx0, gy1, { color: PS.rgba('ink3', .8) });
      D.line(ctx, gx0, Y(0), gx1, Y(0), { color: PS.rgba('ink3', .6) });
      D.text(ctx, '+' + fmt(Ym, 0) + '°', gx0 - 4, gy0 + 8, { size: 9.5, color: PAL.ink3, align: 'right' });
      D.text(ctx, '0', gx0 - 4, Y(0) + 4, { size: 9.5, color: PAL.ink3, align: 'right' });
      D.text(ctx, '−' + fmt(Ym, 0) + '°', gx0 - 4, gy1, { size: 9.5, color: PAL.ink3, align: 'right' });
      if (p.A > 0) {
        D.line(ctx, gx0, Y(p.A), gx1, Y(p.A), { color: PS.rgba('violet', hl === 'A' ? .9 : .45), dash: [3, 4], width: hl === 'A' ? 2 : 1 });
        D.line(ctx, gx0, Y(-p.A), gx1, Y(-p.A), { color: PS.rgba('violet', hl === 'A' ? .9 : .45), dash: [3, 4], width: hl === 'A' ? 2 : 1 });
      }
      const pts = st.hist.filter(q => q.t >= tL);
      ctx.save();
      ctx.beginPath(); ctx.rect(gx0, gy0 - 2, gw, gh + 4); ctx.clip();
      pts.forEach(q => Math.abs(q.tha) <= Ym && D.dot(ctx, X(q.t), Yr(q.tha), hl === 'tha' || hl === 'sig' ? 2.2 : 1.6, PS.rgba('dusty', .75)));
      const curve = (key, color, width, hot) => {
        if (pts.length < 2) return;
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
        if (hot) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
        ctx.beginPath();
        pts.forEach((q, i) => i ? ctx.lineTo(X(q.t), Yr(q[key])) : ctx.moveTo(X(q.t), Yr(q[key])));
        ctx.stroke(); ctx.restore();
      };
      curve('th', PAL.ink, hl === 'th' ? 3.4 : 2.6, hl === 'th');
      curve('thg', C.thg, hl === 'thg' || hl === 'b' ? 2.8 : 2, hl === 'thg' || hl === 'b');
      curve('thf', C.thf, hl === 'thf' ? 3 : 2.2, hl === 'thf');
      ctx.restore();
      // 곡선 끝 이름표 — 위에서부터 줄 간격을 지켜 쌓는다 (곡선이 가까워도 겹치지 않게)
      if (pts.length) {
        const q = pts[pts.length - 1], xe = Math.min(X(q.t), gx1) + 5, gap = small ? 12 : 13;
        const L = [
          { y: Y(q.th) + 4, t: narrow ? 'θ' : 'θ 실제', col: PAL.ink, bold: hl === 'th' },
          { y: Y(q.thf) + 4, t: narrow ? 'θ_f' : 'θ_f 필터', col: C.thf, bold: true },
          { y: Y(q.thg) + 4, t: Math.abs(q.thg) > Ym ? (q.thg > 0 ? '↑ ' : '↓ ') + (narrow ? '' : 'θ_g ') + fmt(q.thg, 0) + '°' : (narrow ? 'θ_g' : 'θ_g 자이로만'), col: C.thg, bold: hl === 'thg' }
        ].sort((a, b) => a.y - b.y);
        for (let i = 1; i < L.length; i++) L[i].y = Math.max(L[i].y, L[i - 1].y + gap);
        const over = L[L.length - 1].y - (gy1 + 4);
        if (over > 0) L.forEach(o => { o.y -= over; });
        L.forEach(o => D.text(ctx, o.t, xe, o.y, { size: small ? 9.5 : 10.5, color: o.col, bold: o.bold }));
      }
      // 시정수 τ — 그래프 시간축 위 치수선
      const tauW = Math.min(p.tau, WIN), dy = gy1 - 8;
      D.dim(ctx, X(tR - tauW), dy, X(tR), dy, null, C.tau, hl === 'tau');
      D.text(ctx, 'τ = ' + fmt(p.tau, 1) + ' s' + (p.tau >= WIN ? ' (화면 끝까지)' : ''), X(tR - tauW / 2), dy - 7,
        { size: small ? 9.5 : 10.5, color: C.tau, align: 'center', bold: hl === 'tau' });
      if (!small) D.text(ctx, '시간 →', gx1, gy1 + 16, { size: 9.5, color: PAL.ink3, align: 'right' });
    }
  });
})();
