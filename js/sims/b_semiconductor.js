/* [고등물리·물질과 전자기장] 에너지띠와 반도체 — n ∝ e^(−E_g/2kT)
   고체 속 전자는 아무 에너지나 가질 수 없고, '띠' 안에만 있을 수 있다.
   가득 찬 가전자띠와 비어 있는 전도띠 사이의 틈(띠간격)이 얼마나 큰지가
   도체·반도체·부도체를 가른다. 반도체가 특별한 이유는 그 틈이 '열로 겨우 넘을 만큼'
   이어서 — 온도나 불순물(도핑)로 전도성을 자유자재로 조절할 수 있다는 점이다.
   트랜지스터, 다이오드, LED, 태양전지가 전부 여기서 나온다.
   (물리학Ⅰ '전기력과 물질의 성질' 단원) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Eg: '#fbbf24', T: '#fb7185', dope: '#5eead4', n: '#60a5fa', sig: '#a78bfa' };
  const KB_EV = 8.617333e-5;            // 볼츠만 상수 [eV/K]

  // 열로 전도띠에 올라간 전자의 상대적 비율
  const nOf = p => Math.exp(-p.Eg / (2 * KB_EV * p.T));
  const DOPE = [
    { n: '순수 (진성)', c: '#93a2c4', d: '열로 넘어간 전자만큼만 전류가 흐른다' },
    { n: 'n형 도핑 (인 첨가)', c: '#60a5fa', d: '전자를 하나 더 가진 원자를 섞어 — 전자가 운반자' },
    { n: 'p형 도핑 (붕소 첨가)', c: '#fb7185', d: '전자가 하나 모자란 원자를 섞어 — 양공이 운반자' }
  ];
  const dopeOf = p => DOPE[clamp(Math.round(p.dope), 0, 2)];
  // 도핑하면 운반자가 수십만 배 늘어난다
  const carriers = p => nOf(p) * (Math.round(p.dope) === 0 ? 1 : 1e6 * p.nd);
  const KIND = p => p.Eg < .1 ? 0 : (p.Eg < 3.2 ? 1 : 2);
  const KNAME = ['도체 — 띠가 겹쳐 있어 항상 전류가 흐른다', '반도체 — 조건에 따라 흐르기도, 안 흐르기도', '부도체 — 열로는 넘을 수 없다'];
  const KCOL = ['#fbbf24', '#5eead4', '#fb7185'];
  const MAT = [[0, '구리 (도체)'], [.67, '저마늄 0.67'], [1.12, '실리콘 1.12'], [1.42, '갈륨비소 1.42'],
               [2.26, '인화갈륨 2.26 (녹색 LED)'], [3.4, '질화갈륨 3.4 (청색 LED)'], [5.5, '다이아몬드 5.5'], [8, '석영 ~9']];

  PS.register({
    id: 'b-semiconductor', mode: 'basic', category: '물질과 전자기장',
    title: '에너지띠와 반도체',
    sub: 'n ∝ e^(−E_g/2kT)',
    tagline: '고체 속 전자는 아무 에너지나 가질 수 없고 "띠" 안에만 있습니다. 그 사이 틈이 얼마나 큰지가 도체·반도체·부도체를 가릅니다 — 반도체는 그 틈이 열로 겨우 넘을 만합니다.',

    params: [
      { key: 'Eg', symbol: 'E_g', label: '띠간격', unit: 'eV', min: 0, max: 8, step: .02, value: 1.12, color: C.Eg, dec: 2,
        where: '가전자띠와 전도띠 사이의 <b>에너지 틈</b>입니다. 이 값 하나가 물질이 도체인지 반도체인지 부도체인지를 결정합니다 — 실리콘 1.12 eV, 다이아몬드 5.5 eV.' },
      { key: 'T', symbol: 'T', label: '온도', unit: 'K', min: 100, max: 700, step: 5, value: 300, color: C.T, dec: 0,
        where: '<b>절대 온도</b>입니다. 열에너지 kT가 전자를 띠 너머로 밀어 올립니다. 반도체는 온도가 오르면 전도성이 <b>좋아지는데</b>, 금속은 반대로 나빠집니다 — 결정적인 차이입니다.' },
      { key: 'dope', symbol: 'D', label: '도핑 (0순수 1n형 2p형)', unit: '', min: 0, max: 2, step: 1, value: 0, color: C.dope, dec: 0, reset: true,
        where: '<b>불순물을 얼마나 섞었는가</b>입니다. 백만 개에 하나만 섞어도 전도성이 수십만 배 뛰며, n형(전자)과 p형(양공)을 붙이면 다이오드·트랜지스터가 됩니다.' },
      { key: 'nd', symbol: 'N_D', label: '도핑 농도 (배율)', unit: '', min: .1, max: 10, step: .1, value: 1, color: C.n, dec: 1,
        where: '도핑 <b>농도의 배율</b>입니다(순수일 때는 효과 없음). 높을수록 운반자가 많아져 저항이 내려갑니다 — 반도체 공정에서 정밀하게 조절하는 값입니다.' }
    ],
    vars: {
      n: { symbol: 'n', label: '전도 전자 비율', unit: '', color: C.n,
        where: '전도띠로 <b>올라간 전자의 상대적 수</b>입니다. 띠간격에는 지수적으로 줄고 온도에는 지수적으로 늘어납니다.' },
      sig: { symbol: 'σ', label: '전도도 (상대값)', unit: '', color: C.sig,
        where: '전류가 <b>얼마나 잘 흐르는가</b>입니다(오른쪽 막대). 운반자 수에 비례하며, 로그 눈금으로 봐야 할 만큼 범위가 넓습니다.' }
    },
    formulas: [
      { name: '열로 띠를 넘는 전자의 비율', tpl: '{n} ∝ e^(−{Eg} ⁄ 2k{T})' },
      { name: '전도도', tpl: '{sig} ∝ {n} · (전하 운반자 수)' },
      { name: '상온의 열에너지', tpl: 'k{T} ≈ 0.026 eV  (300 K)' },
      { name: '분류 기준', tpl: '{Eg} ≈ 0 도체 · 0.1~3 반도체 · 3 이상 부도체' }
    ],

    init(p) {
      const el = [];
      for (let i = 0; i < 46; i++) el.push({ x: Math.random(), y: Math.random(), ph: Math.random() * 6.28, u: (i + .5) / 46 });
      return { el: el, done: false };
    },
    step(st, p, dt) {
      st.el.forEach(q => { q.x += dt * .22 * (carriers(p) > 1e-9 ? 1 : 0); if (q.x > 1) q.x -= 1; });
    },

    graphs: [{
      title: '온도에 따른 전도 전자 수 (로그)', xKey: 'TT', xUnit: 'K', xMin: 100, xMax: 700,
      series: [{ key: 'lgn', label: 'log₁₀ n', color: C.n }]
    }],
    sample(st, p) {
      const TT = 100 + ((st.t * 40) % 600);
      return { TT: TT, lgn: Math.log10(Math.max(Math.exp(-p.Eg / (2 * KB_EV * TT)), 1e-300)) };
    },

    readouts(st, p) {
      const n = nOf(p), k = KIND(p), d = dopeOf(p), cr = carriers(p);
      const kT = KB_EV * p.T;
      const near = MAT.reduce((a, b) => Math.abs(b[0] - p.Eg) < Math.abs(a[0] - p.Eg) ? b : a);
      return [
        { label: '띠간격 E_g', value: p.Eg, unit: 'eV', color: C.Eg, dec: 2 },
        { label: '열에너지 kT', value: kT * 1000, unit: 'meV', color: C.T, dec: 2 },
        { label: 'E_g / kT (몇 배나 높은 벽인가)', value: kT > 0 ? p.Eg / kT : Infinity, unit: '배', dec: 1, color: C.Eg },
        { label: '전도 전자 비율 n', value: n, unit: '', color: C.n, dec: 0 },
        { label: '전도 전자 비율 (지수 표기)', value: n < 1e-4 ? n.toExponential(2) : fmt(n, 6), wide: true, color: C.n },
        { label: '도핑', value: d.n, wide: true, color: d.c },
        { label: '도핑 효과', value: d.d, wide: true, color: d.c },
        { label: '전도도 (상대값)', value: cr < 1e-4 ? cr.toExponential(2) : fmt(cr, 4), wide: true, color: C.sig },
        { label: '분류', value: KNAME[k], wide: true, color: KCOL[k] },
        { label: '가장 비슷한 물질', value: near[1], wide: true, color: '#fbbf24' },
        { label: '온도를 100 K 올리면 n은', value: Math.exp(-p.Eg / (2 * KB_EV * (p.T + 100))) / Math.max(n, 1e-300), unit: '배', dec: 2, color: C.T },
        { label: '이 띠간격에서 나오는 빛', wide: true, color: '#a78bfa',
          value: p.Eg > .3 ? fmt(1239.8 / p.Eg, 0) + ' nm ' +
                 (1239.8 / p.Eg < 400 ? '(자외선)' : (1239.8 / p.Eg < 500 ? '(파랑 — 청색 LED)' :
                 (1239.8 / p.Eg < 580 ? '(초록)' : (1239.8 / p.Eg < 700 ? '(빨강)' : '(적외선)')))) : '— (띠간격이 너무 작다)' }
      ];
    },

    notes: [
      '<b>띠간격 하나가 물질의 운명을 정합니다.</b> 0에 가까우면 도체, 0.1~3 eV면 반도체, 3 eV 이상이면 부도체입니다. 실리콘(1.12)과 다이아몬드(5.5)는 둘 다 같은 4족 원소의 결정인데, 띠간격 차이 때문에 하나는 컴퓨터가 되고 하나는 보석이 됩니다.',
      '<b>반도체는 온도가 오르면 전기가 더 잘 통합니다.</b> 열이 전자를 띠 너머로 밀어 올리기 때문입니다. 반면 금속은 온도가 오르면 원자 진동이 전자를 방해해 저항이 <b>커집니다</b> — 이 반대 경향이 둘을 구별하는 가장 확실한 실험적 기준입니다.',
      '<b>도핑이 반도체를 쓸모 있게 만듭니다.</b> 순수 실리콘은 사실 전기가 잘 안 통합니다. 백만 개에 하나꼴로 인(n형)이나 붕소(p형)를 섞으면 전도성이 수십만 배 뛰고, 그 양을 정밀하게 조절할 수 있다는 것이 반도체 산업의 전부입니다.',
      '<b>n형과 p형을 붙이면 다이오드</b>가 됩니다 — 한 방향으로만 전류가 흐릅니다. 세 층으로 쌓으면 트랜지스터가 되고, 그 트랜지스터 수백억 개가 오늘날의 칩입니다.',
      '<b>전자가 띠를 내려올 때 빛이 나옵니다.</b> 그 빛의 파장이 띠간격으로 정해지므로, 띠간격을 바꾸면 LED의 색이 바뀝니다 — 청색 LED(질화갈륨, 3.4 eV)가 늦게 나온 이유는 그만큼 넓은 띠간격의 좋은 결정을 만들기가 어려웠기 때문이고, 그 공로로 2014년 노벨 물리학상이 수여됐습니다.',
      '거꾸로 빛을 받아 전자를 띠 너머로 올리면 <b>태양전지</b>가 됩니다. 실리콘의 1.12 eV가 태양 스펙트럼과 잘 맞아 태양전지의 주력 재료가 됐습니다.'
    ],
    presets: [
      { name: '실리콘 (상온)', set: { Eg: 1.12, T: 300, dope: 0, nd: 1 } },
      { name: '실리콘 + n형 도핑', set: { Eg: 1.12, T: 300, dope: 1, nd: 1 } },
      { name: '실리콘 + p형 도핑', set: { Eg: 1.12, T: 300, dope: 2, nd: 1 } },
      { name: '온도를 올리면 (500 K)', set: { Eg: 1.12, T: 500, dope: 0, nd: 1 } },
      { name: '다이아몬드 (부도체)', set: { Eg: 5.5, T: 300, dope: 0, nd: 1 } },
      { name: '도체 (띠가 겹침)', set: { Eg: 0, T: 300, dope: 0, nd: 1 } },
      { name: '청색 LED (질화갈륨)', set: { Eg: 3.4, T: 300, dope: 1, nd: 5 } }
    ],
    challenges: [
      {
        id: 'si', title: '실리콘을 찾아라',
        desc: '띠간격을 1.1 ± 0.05 eV에 맞춰 보세요 — 반도체 산업 전체를 떠받치는 숫자입니다.',
        hint: '슬라이더를 1.12 근처로. 측정값 칸의 "가장 비슷한 물질"이 실리콘이 되면 성공입니다.',
        check: ({ P }) => Math.abs(P.Eg - 1.12) <= .05
      },
      {
        id: 'heat', title: '온도로 전도성 10배 올리기',
        desc: '실리콘(1.12 eV)에서 온도만 올려, 전도 전자 수를 상온(300 K)의 10배 이상으로 만들어 보세요.',
        hint: 'n ∝ e^(−E_g/2kT) 이므로 온도에 지수적입니다. 400 K 근처면 됩니다 — 금속이라면 반대로 나빠졌을 것입니다.',
        check: ({ P }) => Math.abs(P.Eg - 1.12) <= .1 && nOf(P) >= 10 * Math.exp(-1.12 / (2 * KB_EV * 300))
      },
      {
        id: 'blue', title: '청색 LED 만들기',
        desc: '띠간격을 조절해 450~490 nm(파란빛)가 나오게 해 보세요 — 2014년 노벨상의 그 색입니다.',
        hint: 'λ(nm) = 1239.8 / E_g(eV). 파란빛이면 E_g가 약 2.5~2.75 eV입니다.',
        check: ({ P }) => { const l = 1239.8 / Math.max(P.Eg, .01); return l >= 450 && l <= 490; }
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const n = nOf(p), k = KIND(p), d = dopeOf(p);

      /* ── 에너지띠 ── */
      const bx = 64, bw = Math.min(w * .40, 240);
      const cy = h * .40;
      const EMAX = 9;
      const SY = e => cy + 100 - e / EMAX * 200;             // 에너지 → y
      const gap = clamp(p.Eg, 0, EMAX - 2);

      // 가전자띠 (가득 찬)
      ctx.save(); ctx.fillStyle = 'rgba(96,165,250,.35)';
      ctx.fillRect(bx, SY(0), bw, SY(-2) - SY(0)); ctx.restore();
      D.text(ctx, '가전자띠 (가득 참)', bx + bw / 2, SY(-1) + 4, { size: 10.5, color: '#93a2c4', align: 'center' });
      // 전도띠 (비어 있는)
      ctx.save(); ctx.fillStyle = 'rgba(94,234,212,.22)';
      ctx.fillRect(bx, SY(gap + 2.6), bw, SY(gap) - SY(gap + 2.6)); ctx.restore();
      D.text(ctx, '전도띠 (비어 있음)', bx + bw / 2, SY(gap + 1.3) + 4, { size: 10.5, color: '#5eead4', align: 'center' });
      // 띠간격
      ctx.save();
      if (hl === 'Eg') { ctx.shadowColor = C.Eg; ctx.shadowBlur = 16; }
      ctx.fillStyle = 'rgba(251,191,36,.10)'; ctx.fillRect(bx, SY(gap), bw, SY(0) - SY(gap));
      ctx.strokeStyle = C.Eg; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, SY(0)); ctx.lineTo(bx + bw, SY(0));
      ctx.moveTo(bx, SY(gap)); ctx.lineTo(bx + bw, SY(gap)); ctx.stroke(); ctx.restore();
      if (gap > .15) {
        D.dim(ctx, bx + bw + 22, SY(0), bx + bw + 22, SY(gap),
          'E_g = ' + fmt(p.Eg, 2) + ' eV', C.Eg, hl === 'Eg');
      } else {
        D.text(ctx, '띠가 겹쳐 있다 (도체)', bx + bw + 14, SY(0), { size: 10.5, color: '#fbbf24' });
      }
      // 열에너지 kT 눈금
      const kT = KB_EV * p.T;
      D.line(ctx, bx - 26, SY(0), bx - 10, SY(0), { color: C.T, width: 2 });
      D.line(ctx, bx - 26, SY(kT * 8), bx - 10, SY(kT * 8), { color: C.T, width: 2, hot: hl === 'T' });
      D.text(ctx, 'kT×8', bx - 30, SY(kT * 4) + 4, { size: 9, color: hl === 'T' ? '#fff' : C.T, align: 'right' });

      /* ── 전자 ── */
      st.el.forEach((q, i) => {
        const up = q.u < Math.min(n * (Math.round(p.dope) ? 1e5 * p.nd : 1) * 1e3, .55);
        const ex = bx + 12 + ((q.x + i * .021) % 1) * (bw - 24);
        if (up) {
          const ey = SY(gap + .5 + (q.y * 1.8));
          D.dot(ctx, ex, ey + Math.sin(st.t * 3 + q.ph) * 3, 3.2, '#5eead4', true);
          // 뒤에 남은 양공
          D.dot(ctx, ex, SY(-.4 - q.y * 1.1), 3, 'rgba(251,113,133,.8)', false);
        } else {
          D.dot(ctx, ex, SY(-.3 - q.y * 1.4), 2.8, 'rgba(96,165,250,.75)', false);
        }
      });
      // 도핑으로 생긴 여분 준위
      if (Math.round(p.dope) === 1) {
        D.line(ctx, bx + 8, SY(gap - .25), bx + bw - 8, SY(gap - .25), { color: '#60a5fa', dash: [5, 4], width: 2, hot: hl === 'dope' });
        D.text(ctx, 'n형 — 전도띠 바로 아래 여분 전자', bx + 10, SY(gap - .25) - 6, { size: 9.5, color: '#60a5fa' });
      } else if (Math.round(p.dope) === 2) {
        D.line(ctx, bx + 8, SY(.25), bx + bw - 8, SY(.25), { color: '#fb7185', dash: [5, 4], width: 2, hot: hl === 'dope' });
        D.text(ctx, 'p형 — 가전자띠 바로 위 빈자리(양공)', bx + 10, SY(.25) + 14, { size: 9.5, color: '#fb7185' });
      }
      D.text(ctx, '에너지 ↑', bx - 30, SY(gap + 2.6) - 6, { size: 9.5, color: '#61719a', align: 'right' });
      D.tag(ctx, KNAME[k].split(' —')[0], bx + bw / 2, SY(gap + 3.4), KCOL[k], true);

      /* ── 전도도 막대 (로그) ── */
      const sx = Math.min(w - 120, bx + bw + 110), sTop = cy - 110, sH = 220, sW = 32;
      if (sx + sW + 60 < w + 60) {
        D.text(ctx, '전도도 (로그)', sx + sW / 2, sTop - 24, { size: 10.5, color: '#61719a', align: 'center' });
        D.roundRect(ctx, sx, sTop, sW, sH, 6); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
        const cr = carriers(p);
        const LO = -40, HI = 0;
        const frac = clamp((Math.log10(Math.max(cr, 1e-300)) - LO) / (HI - LO), 0, 1);
        ctx.save(); if (hl === 'sig') { ctx.shadowColor = C.sig; ctx.shadowBlur = 16; }
        D.roundRect(ctx, sx, sTop + sH * (1 - frac), sW, sH * frac, 6);
        ctx.fillStyle = C.sig; ctx.globalAlpha = .8; ctx.fill(); ctx.restore();
        [[0, '도체'], [-10, '반도체'], [-30, '부도체']].forEach(([lv, lab]) => {
          const yy = sTop + sH * (1 - (lv - LO) / (HI - LO));
          D.line(ctx, sx - 5, yy, sx + sW + 5, yy, { color: 'rgba(147,162,196,.35)', dash: [3, 3] });
          D.text(ctx, lab, sx + sW + 9, yy + 4, { size: 9.5, color: '#93a2c4' });
        });
        D.text(ctx, cr < 1e-4 ? cr.toExponential(1) : fmt(cr, 3), sx + sW / 2, sTop - 8,
          { size: 11, color: C.sig, align: 'center', bold: true });
      }

      /* ── 물질 눈금 ── */
      const mx = 48, my = h - 58, mw = Math.min(w - 96, 500);
      D.text(ctx, '물질별 띠간격 (eV)', mx, my - 10, { size: 10.5, color: '#61719a' });
      D.roundRect(ctx, mx, my, mw, 11, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const MX = e => mx + mw * clamp(e / 9, 0, 1);
      ctx.fillStyle = 'rgba(251,191,36,.22)'; ctx.fillRect(mx, my, MX(.1) - mx, 11);
      ctx.fillStyle = 'rgba(94,234,212,.22)'; ctx.fillRect(MX(.1), my, MX(3.2) - MX(.1), 11);
      ctx.fillStyle = 'rgba(251,113,133,.18)'; ctx.fillRect(MX(3.2), my, mx + mw - MX(3.2), 11);
      MAT.forEach(([e, nm], i) => {
        D.line(ctx, MX(e), my - 4, MX(e), my + 15, { color: 'rgba(147,162,196,.45)', width: 1.2 });
        D.text(ctx, nm.split(' ')[0], MX(e), my + (i % 2 ? 38 : 27), { size: 8.5, color: '#93a2c4', align: 'center' });
      });
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      D.line(ctx, MX(p.Eg), my - 7, MX(p.Eg), my + 18, { color: '#fff', width: 2.4 }); ctx.restore();
      D.text(ctx, '도체', mx + 4, my + 9, { size: 8.5, color: '#fbbf24' });
      D.text(ctx, '부도체', mx + mw - 4, my + 9, { size: 8.5, color: '#fb7185', align: 'right' });
    }
  });
})();
