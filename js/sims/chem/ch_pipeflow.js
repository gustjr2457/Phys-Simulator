/* [화학공학·유체와 수송] 관내 유동과 압력 손실 — Re = ρVD/μ, Δp = f(L/D)(ρV²/2)
   레이놀즈가 1883년에 한 실험을 그대로 재현한다. 유속을 천천히 올리면 잉크 실이
   한 줄로 곧게 흐르다가(층류) 어느 순간 갑자기 흐트러진다(난류). 그 "어느 순간"이
   Re ≈ 2300이고, 그 순간 마찰계수가 뛰어 펌프 동력이 급증한다. 배관·열교환기·
   화학플랜트 설계에서 관 지름을 정하는 계산이 이것이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Dp: '#5eead4', Vm: '#fb7185', L: '#93a2c4', mu: '#a78bfa', eps: '#fbbf24',
              Re: '#60a5fa', f: '#fb923c', dp: '#f472b6' };
  const RHO = 998;                       // 물 밀도 kg/m³ (점도만 슬라이더로 바꾼다)
  const RAMP = 18;                       // 유속을 끝까지 올리는 데 걸리는 시간(초)

  const ReOf = (V, p) => RHO * V * (p.Dp / 1000) / (p.mu / 1000);
  function fOf(Re, p) {
    if (Re < 1) return 64;
    if (Re < 2300) return 64 / Re;                                     // 층류: 하겐-푸아죄유
    const rel = (p.eps / p.Dp);                                        // 상대조도 ε/D
    if (Re < 4000) {                                                   // 천이: 층류 끝과 난류 시작을 부드럽게 연결
      const u = (Re - 2300) / 1700;
      return (1 - u) * (64 / 2300) + u * haaland(4000, rel);
    }
    return haaland(Re, rel);
  }
  function haaland(Re, rel) {                                          // 하알란트 식(콜브룩의 명시해)
    const t = Math.pow(rel / 3.7, 1.11) + 6.9 / Re;
    const s = -1.8 * Math.log10(t);
    return 1 / (s * s);
  }
  const Vnow = (st, p) => p.Vm * (.06 + .94 * Math.min(1, st.t / RAMP));
  const dpOf = (V, p) => fOf(ReOf(V, p), p) * (p.L / (p.Dp / 1000)) * RHO * V * V / 2;  // Pa
  const Qof = (V, p) => V * Math.PI * Math.pow(p.Dp / 1000, 2) / 4 * 1000;             // L/s
  const Vtrans = p => 2300 * (p.mu / 1000) / (RHO * (p.Dp / 1000));                    // 전이 유속
  const regime = Re => Re < 2300 ? 0 : (Re < 4000 ? 1 : 2);
  const RNAME = ['층류 — 잉크 실이 한 줄', '천이 — 흐트러지기 시작', '난류 — 완전히 뒤섞임'];
  const RCOL = ['#60a5fa', '#fbbf24', '#fb7185'];

  PS.register({
    id: 'ch-pipeflow', mode: 'chem', category: '유체와 수송',
    title: '관내 유동과 압력 손실',
    sub: 'Re = ρVD/μ',
    tagline: '유속을 천천히 올려 보세요. 잉크 실이 곧게 흐르다가 Re ≈ 2300에서 갑자기 흐트러집니다 — 그 순간 마찰이 뛰고 펌프 동력이 급증합니다. 레이놀즈의 1883년 실험 그대로입니다.',

    params: [
      { key: 'Dp', symbol: 'D', label: '관 지름', unit: 'mm', min: 10, max: 200, step: 5, value: 50, color: C.Dp, dec: 0, reset: true,
        where: '<b>관의 안지름</b>입니다. 압력 손실에 D⁵로(같은 유량 기준) 들어가는 가장 강력한 변수입니다 — 배관 설계비의 대부분이 이 숫자 하나로 결정됩니다.' },
      { key: 'Vm', symbol: 'V', label: '최대 유속', unit: 'm/s', min: .2, max: 6, step: .2, value: 3, color: C.Vm, dec: 1, reset: true,
        where: '유속을 0에서 이 값까지 <b>18초에 걸쳐 올립니다</b>(스윕). 그 과정에서 층류 → 난류 전이가 일어나며 오른쪽 그래프에 마찰계수 곡선이 그려집니다.' },
      { key: 'L', symbol: 'L', label: '관 길이', unit: 'm', min: 2, max: 200, step: 2, value: 30, color: C.L, dec: 0,
        where: '압력을 측정하는 <b>구간의 길이</b>입니다. 손실은 길이에 정비례합니다 — 그래서 장거리 배관은 중간에 펌프를 다시 둡니다.' },
      { key: 'mu', symbol: 'μ', label: '점도', unit: 'mPa·s', min: .3, max: 200, step: .1, value: 1, color: C.mu, dec: 1, reset: true,
        where: '유체가 <b>얼마나 끈적한가</b>입니다(물 1 · 혈액 4 · 올리브유 80 · 꿀 10000 mPa·s). 점도가 크면 Re가 작아져 난류로 넘어가지 않습니다 — 끈적한 유체는 층류로 흐릅니다.' },
      { key: 'eps', symbol: 'ε', label: '관 거칠기', unit: 'mm', min: 0, max: 2, step: .05, value: .05, color: C.eps, dec: 2,
        where: '관 <b>안쪽 벽의 요철 높이</b>입니다(새 강관 0.05 · 녹슨 강관 1~3 mm). 층류에서는 아무 영향이 없고, 난류에서만 마찰을 키웁니다.' }
    ],
    vars: {
      Re: { symbol: 'Re', label: '레이놀즈 수', unit: '', color: C.Re,
        where: '관성력과 점성력의 비입니다. 화면 아래 <b>Re 게이지</b>의 바늘이 2300을 넘는 순간 유동의 성격이 바뀝니다 — 단위가 없는 숫자 하나가 흐름의 종류를 결정합니다.' },
      f: { symbol: 'f', label: '마찰계수', unit: '', color: C.f,
        where: '관 벽이 유체를 붙잡는 정도입니다. 층류에서는 64/Re로 떨어지다가 <b>전이에서 위로 뜁니다</b>(오른쪽 f–Re 그래프).' },
      dp: { symbol: 'Δp', label: '압력 손실', unit: 'kPa', color: C.dp,
        where: '구간 양 끝의 <b>압력 차이</b>입니다. 관 위에 세워진 압력계 기둥의 높이 차로 보이며, 펌프가 이겨내야 하는 값입니다.' }
    },
    formulas: [
      { name: '레이놀즈 수', tpl: '{Re} = ρ{Vm}{Dp} ⁄ {mu}' },
      { name: '압력 손실 (다르시-바이스바흐)', tpl: '{dp} = {f} · ({L}⁄{Dp}) · ρ{Vm}² ⁄ 2' },
      { name: '층류 (Re < 2300)', tpl: '{f} = 64 ⁄ {Re}' },
      { name: '난류 (조도의 영향을 받는다)', tpl: '1⁄√{f} = −1.8 log( ({eps}⁄3.7{Dp})^1.11 + 6.9⁄{Re} )' }
    ],

    init(p) {
      const ink = [];
      for (let i = 0; i < 70; i++) ink.push({ u: i / 69, ph: Math.random() * 6.28 });
      return { ink: ink, done: false };
    },
    step(st, p, dt) { if (st.t > RAMP + 8) st.done = true; },

    graphs: [{
      title: '마찰계수 – 레이놀즈 수 (무디 선도)', xKey: 'Re', xUnit: '', y0: 0,
      series: [{ key: 'f', label: 'f', color: C.f }]
    }, {
      title: '압력 손실 – 레이놀즈 수', xKey: 'Re', xUnit: '', y0: 0,
      series: [{ key: 'dp', label: 'Δp (kPa)', color: C.dp }]
    }],
    sample(st, p) {
      const V = Vnow(st, p), Re = ReOf(V, p);
      return { Re: Re, f: fOf(Re, p), dp: dpOf(V, p) / 1000 };
    },

    readouts(st, p) {
      const V = Vnow(st, p), Re = ReOf(V, p), f = fOf(Re, p);
      const dp = dpOf(V, p), Q = Qof(V, p);
      const rg = regime(Re);
      return [
        { label: '현재 유속 V', value: V, unit: 'm/s', color: C.Vm, dec: 2 },
        { label: '레이놀즈 수 Re', value: Re, unit: '', color: C.Re, dec: 0 },
        { label: '마찰계수 f', value: f, unit: '', color: C.f, dec: 4 },
        { label: '압력 손실 Δp', value: dp / 1000, unit: 'kPa', color: C.dp, dec: 2 },
        { label: '유량 Q', value: Q, unit: 'L/s', color: C.Dp, dec: 2 },
        { label: '펌프 동력 (Δp·Q)', value: dp * Q / 1000, unit: 'W', dec: 1, color: '#fbbf24' },
        { label: '전이 유속 (Re = 2300)', value: Vtrans(p), unit: 'm/s', dec: 3, color: '#93a2c4' },
        { label: '상대조도 ε/D', value: p.eps / p.Dp, unit: '', dec: 5, color: C.eps },
        { label: '유동 상태', value: RNAME[rg], wide: true, color: RCOL[rg] }
      ];
    },

    notes: [
      '<b>Re ≈ 2300</b>이 층류와 난류의 경계입니다. 이 숫자는 관 지름·유속·점도·밀도를 하나로 묶은 무차원수라서, 송유관이든 모세혈관이든 같은 기준으로 비교할 수 있습니다.',
      '전이 순간 <b>마찰계수가 위로 뜁니다.</b> 난류는 소용돌이로 운동량을 벽까지 실어 나르기 때문에, 유속이 조금 늘었을 뿐인데 펌프 동력이 급격히 커집니다.',
      '<b>관 지름이 모든 것을 지배합니다.</b> 같은 유량을 보낼 때 지름을 2배로 하면 유속이 1/4, Δp는 약 1/32로 떨어집니다. 배관 공사비와 평생 펌프 전기료의 맞교환이 이 식 위에서 결정됩니다.',
      '<b>층류에서는 관이 거칠어도 아무 상관이 없습니다.</b> 벽 근처 유체가 느리게 미끄러져 요철이 흐름에 노출되지 않기 때문입니다. 난류에서만 거칠기가 마찰을 키웁니다 — 녹슨 관을 교체하는 이유입니다.',
      '점도가 큰 유체(기름·꿀·혈액)는 Re가 작아 <b>층류로만 흐릅니다.</b> 그래서 점성 유체를 다루는 공정은 난류 혼합을 기대할 수 없고, 교반기나 정적 혼합기를 따로 넣습니다.'
    ],
    presets: [
      { name: '물, 50 mm 관', set: { Dp: 50, Vm: 3, L: 30, mu: 1, eps: .05 } },
      { name: '큰 관으로 바꾸면', set: { Dp: 150, Vm: 3, L: 30, mu: 1, eps: .05 } },
      { name: '점성 기름 (층류만)', set: { Dp: 50, Vm: 3, mu: 120, eps: .05 } },
      { name: '녹슨 관', set: { Dp: 50, Vm: 5, mu: 1, eps: 2 } },
      { name: '가느다란 관 + 고속', set: { Dp: 10, Vm: 6, L: 60, mu: 1, eps: .05 } }
    ],
    challenges: [
      {
        id: 'lam', title: '층류로 1 L/s 보내기',
        desc: '유량 1 L/s 이상을 보내면서 레이놀즈 수를 2300 아래로 유지해 보세요.',
        hint: '같은 유량이라도 관을 굵게 하면 유속이 떨어져 Re가 작아집니다. 점도가 큰 유체도 도움이 됩니다.',
        check: ({ P, st }) => { const V = Vnow(st, P); return Qof(V, P) >= 1 && ReOf(V, P) < 2300; }
      },
      {
        id: 'cheap', title: '10 kPa로 5 L/s 보내기',
        desc: '압력 손실 10 kPa 이하로 유량 5 L/s 이상을 흘려 보세요 — 펌프 비용을 아끼는 설계입니다.',
        hint: '관 지름을 키우는 것이 압도적으로 효과적입니다. 길이를 줄이는 것도 선형으로 듣습니다.',
        check: ({ P, st }) => { const V = Vnow(st, P); return Qof(V, P) >= 5 && dpOf(V, P) <= 1e4; }
      },
      {
        id: 'edge', title: '전이 순간을 붙잡기',
        desc: '레이놀즈 수가 2300~2600 사이인 순간에 일시정지(Space)해서, 잉크 실이 막 흐트러지는 장면을 관찰하세요.',
        hint: '최대 유속을 전이 유속(측정값 칸)보다 살짝 크게 맞추면 스윕이 그 근처에서 천천히 지나갑니다.',
        check: ({ P, st }) => { const Re = ReOf(Vnow(st, P), P); return Re >= 2300 && Re <= 2600; }
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const V = Vnow(st, p), Re = ReOf(V, p), f = fOf(Re, p), dp = dpOf(V, p);
      const rg = regime(Re), turb = clamp((Re - 2300) / 2600, 0, 1);

      /* ── 관 (측면 절단) ── */
      const px = 56, pw = Math.min(w - px - 60, 420);
      const pyMid = h * .34;
      const ph = clamp(26 + p.Dp * .42, 26, 104);
      const top = pyMid - ph / 2, bot = pyMid + ph / 2;

      // 관 벽 (거칠기를 요철로 표현)
      [top, bot].forEach((yy, si) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(200,211,239,.7)'; ctx.lineWidth = 2.6;
        if (hl === 'eps') { ctx.shadowColor = C.eps; ctx.shadowBlur = 12; }
        ctx.beginPath();
        const bump = clamp(p.eps * 2.4, 0, 5);
        for (let i = 0; i <= 120; i++) {
          const xx = px + pw * i / 120;
          const dy = bump * Math.sin(i * 1.9 + si * 2.1) * (i % 3 ? 1 : .5);
          i ? ctx.lineTo(xx, yy + (si ? dy : -dy)) : ctx.moveTo(xx, yy);
        }
        ctx.stroke(); ctx.restore();
      });
      ctx.fillStyle = 'rgba(96,165,250,.07)'; ctx.fillRect(px, top, pw, ph);
      D.dim(ctx, px - 24, top, px - 24, bot, 'D ' + fmt(p.Dp, 0), C.Dp, hl === 'Dp');
      D.dim(ctx, px, bot + 34, px + pw, bot + 34, 'L = ' + fmt(p.L, 0) + ' m', C.L, hl === 'L');

      /* ── 잉크 실 (레이놀즈 실험) ── */
      ctx.save();
      ctx.strokeStyle = rg === 0 ? '#fbbf24' : (rg === 1 ? '#fb923c' : '#fb7185');
      ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      if (hl === 'Re') { ctx.shadowColor = C.Re; ctx.shadowBlur = 12; }
      // 유속 프로파일에 따라 중심선 속도가 다르므로, 유동 상태에 따라 흐트러짐을 다르게 준다
      const seg = 120;
      ctx.beginPath();
      for (let i = 0; i <= seg; i++) {
        const u = i / seg, xx = px + pw * u;
        let dy = 0;
        if (turb > 0) {
          // 전이 지점 뒤에서만 흐트러진다 — 난류는 여러 크기의 소용돌이가 겹친 것
          const grow = clamp((u - (1 - turb) * .55) / .3, 0, 1);
          const T = st.t * (2 + V);
          dy = grow * turb * ph * .40 * (
            Math.sin(u * 17 + T * 2.1) * .5 +
            Math.sin(u * 41 - T * 3.3) * .3 +
            Math.sin(u * 79 + T * 5.1) * .2);
        }
        i ? ctx.lineTo(xx, pyMid + dy) : ctx.moveTo(xx, pyMid + dy);
      }
      ctx.stroke(); ctx.restore();
      D.text(ctx, '잉크', px - 8, pyMid + 4, { size: 9.5, color: '#fbbf24', align: 'right' });
      // 난류 소용돌이
      if (turb > .15) {
        ctx.save(); ctx.strokeStyle = 'rgba(251,113,133,.35)'; ctx.lineWidth = 1.3;
        for (let i = 0; i < 9; i++) {
          const u = .35 + (i / 9) * .6;
          const xx = px + pw * u + Math.sin(st.t * 2 + i) * 10;
          const yy = pyMid + Math.cos(st.t * 2.4 + i * 2.1) * ph * .28;
          const rr = 4 + turb * 9 + (i % 3) * 2;
          ctx.beginPath(); ctx.arc(xx, yy, rr, st.t * 3 + i, st.t * 3 + i + 5.2); ctx.stroke();
        }
        ctx.restore();
      }

      /* ── 속도 분포 (관 단면) ── */
      const vx = px + pw + 34;
      const prof = r => rg === 0 ? 2 * (1 - r * r)                            // 층류: 포물선
                                 : (1.22 * Math.pow(Math.max(1 - r, 1e-6), 1 / 7));  // 난류: 뭉툭
      ctx.save();
      ctx.strokeStyle = RCOL[rg]; ctx.lineWidth = 1.8; ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const r = -1 + 2 * i / 40, yy = pyMid + r * ph / 2;
        const xx = vx + prof(Math.abs(r)) * 34;
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke(); ctx.restore();
      D.line(ctx, vx, top, vx, bot, { color: 'rgba(200,211,239,.4)' });
      for (let i = 1; i < 7; i++) {
        const r = -1 + 2 * i / 7, yy = pyMid + r * ph / 2;
        D.arrow(ctx, vx, yy, prof(Math.abs(r)) * 34, 0, { color: RCOL[rg], width: 1.6, head: 5 });
      }
      D.text(ctx, '속도 분포', vx + 4, top - 8, { size: 9.5, color: RCOL[rg] });

      /* ── 압력계 기둥 ── */
      const gy0 = bot + 56, gh = Math.min(74, h - gy0 - 150);
      if (gh > 20) {
        D.line(ctx, px, gy0 + gh, px + pw, gy0 + gh, { color: 'rgba(147,162,196,.25)' });
        ctx.save();
        ctx.strokeStyle = C.dp; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i <= 5; i++) {
          const u = i / 5, xx = px + pw * u;
          const hh = gh * (1 - u * .9);        // 압력이 직선으로 떨어진다
          ctx.moveTo(xx, gy0 + gh); ctx.lineTo(xx, gy0 + gh - hh);
          ctx.moveTo(xx - 5, gy0 + gh - hh); ctx.lineTo(xx + 5, gy0 + gh - hh);
        }
        ctx.stroke(); ctx.restore();
        D.text(ctx, '압력 (직선으로 떨어진다)', px, gy0 - 6, { size: 9.5, color: '#61719a' });
        D.tag(ctx, 'Δp = ' + fmt(dp / 1000, 2) + ' kPa', px + pw * .5, gy0 + gh + 18, C.dp, hl === 'dp');
      }

      /* ── Re 게이지 ── */
      const rx = 56, ry = h - 62, rw2 = Math.min(pw, w - 120);
      const lg = v => Math.log10(Math.max(v, 100));
      const LO = lg(100), HI = lg(1e6);
      const GX = v => rx + clamp((lg(v) - LO) / (HI - LO), 0, 1) * rw2;
      D.roundRect(ctx, rx, ry, rw2, 11, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      ctx.fillStyle = 'rgba(96,165,250,.28)'; ctx.fillRect(rx, ry, GX(2300) - rx, 11);
      ctx.fillStyle = 'rgba(251,191,36,.28)'; ctx.fillRect(GX(2300), ry, GX(4000) - GX(2300), 11);
      ctx.fillStyle = 'rgba(251,113,133,.24)'; ctx.fillRect(GX(4000), ry, rx + rw2 - GX(4000), 11);
      D.line(ctx, GX(2300), ry - 6, GX(2300), ry + 17, { color: '#fff', width: 2 });
      D.text(ctx, '2300', GX(2300), ry + 30, { size: 9.5, color: '#e8eefc', align: 'center' });
      D.text(ctx, '층류', rx + 4, ry + 30, { size: 9.5, color: '#60a5fa' });
      D.text(ctx, '난류', rx + rw2, ry + 30, { size: 9.5, color: '#fb7185', align: 'right' });
      const marker = GX(Re);
      ctx.save(); ctx.shadowColor = C.Re; ctx.shadowBlur = 12;
      D.dot(ctx, marker, ry + 5.5, 7, C.Re, true); ctx.restore();
      D.text(ctx, 'Re = ' + fmt(Re, 0), rx, ry - 12,
        { size: 12, color: hl === 'Re' ? '#fff' : C.Re, bold: true });
      D.text(ctx, 'V = ' + fmt(V, 2) + ' m/s  ·  f = ' + fmt(f, 4),
        rx + 120, ry - 12, { size: 11, color: hl === 'f' ? '#fff' : C.f });

      D.tag(ctx, RNAME[rg], px + pw * .5, top - 26, RCOL[rg], true);
    }
  });
})();
