/* [고등물리·역학과 에너지] 질량과 에너지 — E = mc²
   질량과 에너지는 서로 다른 두 가지가 아니라 같은 것의 두 이름이다. c²이라는
   어마어마한 환산 계수 때문에, 아주 조금의 질량만 사라져도 엄청난 에너지가 나온다.
   석탄은 질량의 100억분의 1쯤을 쓰고, 핵분열은 1000분의 1, 핵융합은 100분의 1,
   반물질은 전부를 쓴다 — 태양이 46억 년을 타고도 멀쩡한 이유가 여기 있다.
   (물리학Ⅰ '질량과 에너지' 단원) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { rxn: '#fbbf24', lgm: '#5eead4', E: '#fb7185', dm: '#a78bfa' };
  const CC = 2.99792458e8, C2 = CC * CC;

  const RXN = [
    { n: '석탄 연소 (화학)', eta: 3.56e-10, c: '#93a2c4', d: '탄소 원자끼리 결합을 바꿀 뿐 — 원자핵은 그대로' },
    { n: '핵분열 (우라늄-235)', eta: 9.1e-4, c: '#5eead4', d: '무거운 핵이 쪼개지며 결합에너지 차이가 풀려난다' },
    { n: '핵융합 (중수소-삼중수소)', eta: 3.75e-3, c: '#fbbf24', d: '가벼운 핵이 합쳐진다 — 같은 질량으로 핵분열의 4배' },
    { n: '태양의 수소 연소 (p-p)', eta: 7.0e-3, c: '#fb923c', d: '수소 4개가 헬륨 1개로 — 질량의 0.7%가 빛이 된다' },
    { n: '반물질 소멸', eta: 1, c: '#f472b6', d: '질량이 통째로 에너지가 된다 — 이론상 최대' }
  ];
  const rOf = p => RXN[clamp(Math.round(p.rxn), 0, RXN.length - 1)];
  const massOf = p => Math.pow(10, p.lgm);                 // kg
  const enOf = p => rOf(p).eta * massOf(p) * C2;           // J
  const dmOf = p => rOf(p).eta * massOf(p);                // 사라지는 질량 kg

  PS.register({
    id: 'b-massenergy', mode: 'basic', category: '역학과 에너지',
    title: '질량과 에너지',
    sub: 'E = mc²',
    tagline: '질량과 에너지는 다른 두 가지가 아니라 같은 것의 두 이름입니다. c²이 워낙 큰 숫자라, 아주 조금의 질량만 사라져도 엄청난 에너지가 나옵니다.',

    params: [
      { key: 'rxn', symbol: 'η', label: '반응 (0석탄 1핵분열 2핵융합 3태양 4반물질)', unit: '', min: 0, max: 4, step: 1, value: 1, color: C.rxn, dec: 0, reset: true,
        where: '어떤 반응으로 에너지를 꺼내는가입니다. 각 반응이 <b>질량의 몇 %를 에너지로 바꾸는지</b>가 다르고, 그 비율 하나가 모든 차이를 만듭니다.' },
      { key: 'lgm', symbol: 'm', label: '연료 질량 (10^x kg)', unit: '', min: -3, max: 3, step: .1, value: 0, color: C.lgm, dec: 1, reset: true,
        where: '반응에 쓰는 <b>연료의 질량</b>(로그 눈금, 0 = 1 kg)입니다. 나오는 에너지는 여기에 정비례합니다.' }
    ],
    vars: {
      E: { symbol: 'E', label: '나오는 에너지', unit: 'J', color: C.E,
        where: '사라진 질량이 바뀐 <b>에너지</b>입니다. 화면 오른쪽 막대와 비교 눈금으로 크기를 가늠해 보세요.' },
      dm: { symbol: 'Δm', label: '사라지는 질량', unit: 'kg', color: C.dm,
        where: '반응 전후의 <b>질량 차이(질량 결손)</b>입니다. 저울 그림에서 오른쪽이 아주 조금 가벼워진 만큼이고, 이것이 전부 에너지가 됩니다.' }
    },
    formulas: [
      { name: '질량-에너지 등가', tpl: '{E} = {dm}c²' },
      { name: '실제로 쓰는 질량', tpl: '{dm} = η · {lgm}   (η = 반응마다 다른 비율)' },
      { name: '빛의 속력의 제곱', tpl: 'c² = 9 × 10¹⁶ m²/s²' }
    ],

    init(p) { return { prog: 0, done: false }; },
    step(st, p, dt) {
      st.prog = Math.min(1, st.prog + dt * .5);
      if (st.prog >= 1 && st.t > 4) st.done = true;
    },

    graphs: [{
      title: '반응이 진행되며 나오는 에너지', xmin: 3, window: 5, y0: 0,
      series: [{ key: 'ej', label: '누적 에너지 (GJ)', color: C.E }]
    }],
    sample(st, p) { return { ej: enOf(p) * st.prog / 1e9 }; },

    readouts(st, p) {
      const r = rOf(p), m = massOf(p), E = enOf(p), dm = dmOf(p);
      const tnt = E / 4.184e9;                              // TNT 톤 환산
      const kwh = E / 3.6e6;
      return [
        { label: '반응', value: r.n, wide: true, color: r.c },
        { label: '질량 → 에너지 변환율 η', value: r.eta * 100, unit: '%', color: C.rxn, dec: r.eta < .01 ? 6 : 2 },
        { label: '연료 질량', value: m, unit: 'kg', color: C.lgm, dec: m < 1 ? 3 : 1 },
        { label: '사라지는 질량 Δm', value: dm * 1e6, unit: 'mg', color: C.dm, dec: dm * 1e6 < 1 ? 6 : 3 },
        { label: '나오는 에너지 E', value: E, unit: 'J', color: C.E, dec: 0 },
        { label: '전력량으로', value: kwh, unit: 'kWh', dec: kwh > 1000 ? 0 : 2, color: C.E },
        { label: 'TNT 환산', value: tnt, unit: '톤', dec: tnt > 100 ? 0 : 3, color: '#fb923c' },
        { label: '4인 가구 몇 년치 전기 (연 3,500 kWh)', value: kwh / 3500, unit: '년', dec: 1, color: '#34d399' },
        { label: '0 °C 물을 끓일 수 있는 양', value: E / (4186 * 100 + 2.26e6) / 1000, unit: '톤', dec: 2, color: '#60a5fa' },
        { label: '같은 질량의 석탄 대비', value: r.eta / RXN[0].eta, unit: '배', dec: 0, color: '#fbbf24' },
        { label: '이 반응은', value: r.d, wide: true, color: r.c }
      ];
    },

    notes: [
      '<b>c² = 9 × 10¹⁶</b>이라는 숫자가 모든 것을 설명합니다. 질량 1 g이 통째로 에너지가 되면 9 × 10¹³ J — 히로시마 원폭(약 6 × 10¹³ J)보다 큽니다. 그래서 "아주 조금만" 변환해도 엄청난 에너지가 나옵니다.',
      '<b>화학 반응도 질량이 줄어듭니다.</b> 다만 100억분의 1 수준이라 어떤 저울로도 잴 수 없을 뿐입니다. 질량 보존 법칙은 틀린 것이 아니라 <b>화학 반응에서는 충분히 좋은 근사</b>인 것입니다.',
      '<b>핵융합이 핵분열보다 효율이 좋습니다</b>(0.375% vs 0.09%). 게다가 연료(중수소)가 바닷물에 사실상 무한히 있고 방사성 폐기물도 훨씬 적습니다 — 다만 1억 도를 가둬야 해서 아직 상용화되지 않았습니다.',
      '<b>태양은 1초에 420만 톤씩 가벼워집니다.</b> 수소 6억 톤이 헬륨 5억 9600만 톤으로 바뀌면서 그 차이가 빛이 됩니다. 그래도 태양 질량의 0.03%밖에 안 써서, 앞으로 50억 년은 더 탑니다.',
      '<b>질량은 "에너지가 들어 있는 정도"입니다.</b> 용수철을 압축하면 아주 미세하게 무거워지고, 뜨거운 물은 찬물보다 무겁습니다. 원자핵이 양성자·중성자 각각의 합보다 가벼운 것(질량 결손)도 결합에너지만큼 에너지가 빠져나갔기 때문입니다.',
      '<b>반물질은 100% 변환</b>이라 이론상 최고의 연료지만, 만드는 데 드는 에너지가 얻는 에너지보다 수십억 배 많습니다 — 연료가 아니라 "에너지를 담아 두는 그릇"에 가깝습니다.'
    ],
    presets: [
      { name: '석탄 1 kg', set: { rxn: 0, lgm: 0 } },
      { name: '우라늄 1 kg (핵분열)', set: { rxn: 1, lgm: 0 } },
      { name: '중수소 1 kg (핵융합)', set: { rxn: 2, lgm: 0 } },
      { name: '반물질 1 g', set: { rxn: 4, lgm: -3 } },
      { name: '태양이 1초에 쓰는 양에 비하면', set: { rxn: 3, lgm: 3 } },
      { name: '핵분열 1 톤', set: { rxn: 1, lgm: 3 } }
    ],
    challenges: [
      {
        id: 'city', title: '도시 하나를 1년 먹여 살리기',
        desc: '4인 가구 10만 가구의 1년치 전기(3.5억 kWh)를 낼 수 있는 조건을 만들어 보세요.',
        hint: '필요한 에너지는 약 1.26×10¹⁵ J입니다. 핵분열이나 핵융합으로 수십 kg이면 됩니다.',
        check: ({ P }) => enOf(P) / 3.6e6 >= 3.5e8
      },
      {
        id: 'tiny', title: '1 g의 반물질',
        desc: '반물질 1 g(10^−3 kg)을 골라, 나오는 에너지가 TNT 2만 톤이 넘는 것을 확인하세요 — 히로시마 원폭 수준입니다.',
        hint: '반응을 4(반물질), 질량을 −3으로 맞추세요. η = 1이라 질량이 통째로 에너지가 됩니다.',
        check: ({ P }) => Math.round(P.rxn) === 4 && enOf(P) / 4.184e9 >= 2e4
      },
      {
        id: 'compare', title: '석탄과 핵분열의 격차 보기',
        desc: '같은 질량에서 핵분열이 석탄의 250만 배 넘는 에너지를 낸다는 것을 확인하세요.',
        hint: '반응을 1(핵분열)로 두고 측정값 칸의 "같은 질량의 석탄 대비"를 보세요.',
        check: ({ P }) => Math.round(P.rxn) >= 1
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const r = rOf(p), m = massOf(p), E = enOf(p), dm = dmOf(p);

      /* ── 저울: 반응 전 / 반응 후 ── */
      const cy = h * .30, bx = 86;
      const frac = r.eta * st.prog;
      D.text(ctx, '반응 전', bx, cy - 76, { size: 11, color: '#93a2c4', align: 'center' });
      D.text(ctx, '반응 후', bx + 170, cy - 76, { size: 11, color: '#93a2c4', align: 'center' });
      [[0, 1, '#93a2c4'], [170, 1 - frac, r.c]].forEach(([off, mm, cc]) => {
        const bw = 64, bh = 48;
        // 저울 접시
        D.line(ctx, bx + off - 44, cy + 34, bx + off + 44, cy + 34, { color: 'rgba(147,162,196,.6)', width: 3 });
        D.line(ctx, bx + off, cy + 34, bx + off, cy + 52, { color: 'rgba(147,162,196,.4)', width: 2 });
        ctx.save();
        if (hl === 'lgm' || (off && hl === 'dm')) { ctx.shadowColor = cc; ctx.shadowBlur = 16; }
        D.roundRect(ctx, bx + off - bw / 2, cy + 34 - bh, bw, bh, 5);
        ctx.fillStyle = cc; ctx.globalAlpha = .35; ctx.fill();
        ctx.strokeStyle = cc; ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        D.text(ctx, fmt(m * mm, m < 1 ? 4 : 3) + ' kg', bx + off, cy + 12,
          { size: 11.5, color: '#e8eefc', align: 'center', bold: true });
      });
      // 사라진 질량
      D.arrow(ctx, bx + 52, cy + 10, 62, 0, { color: C.dm, width: 2.6, head: 8, hot: hl === 'dm' });
      D.tag(ctx, 'Δm = ' + (dm * 1e6 < 1 ? (dm * 1e9).toExponential(2) + ' µg' : fmt(dm * 1e6, 3) + ' mg'),
        bx + 85, cy - 14, C.dm, hl === 'dm');
      D.text(ctx, '질량의 ' + (r.eta * 100 < .01 ? (r.eta * 100).toExponential(2) : fmt(r.eta * 100, 3)) + '%',
        bx + 85, cy + 36, { size: 10, color: C.dm, align: 'center' });

      /* ── 에너지 분출 ── */
      const ex = bx + 250;
      if (st.prog > .02) {
        ctx.save();
        const g = ctx.createRadialGradient(ex, cy, 0, ex, cy, 56);
        g.addColorStop(0, 'rgba(255,240,200,' + (.75 * st.prog) + ')');
        g.addColorStop(.5, 'rgba(251,146,60,' + (.4 * st.prog) + ')');
        g.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, cy, 56, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,220,150,' + (.5 * st.prog) + ')'; ctx.lineWidth = 2;
        for (let k = 0; k < 10; k++) {
          const a = k * Math.PI / 5 + st.t * .7;
          ctx.beginPath();
          ctx.moveTo(ex + Math.cos(a) * 22, cy + Math.sin(a) * 22);
          ctx.lineTo(ex + Math.cos(a) * (36 + 14 * Math.sin(st.t * 3 + k)), cy + Math.sin(a) * (36 + 14 * Math.sin(st.t * 3 + k)));
          ctx.stroke();
        }
        ctx.restore();
      }
      D.text(ctx, 'E = Δm·c²', ex, cy - 72, { size: 12, color: hl === 'E' ? '#fff' : C.E, align: 'center', bold: true });
      D.text(ctx, E.toExponential(3) + ' J', ex, cy + 76, { size: 13, color: C.E, align: 'center', bold: true });

      /* ── 반응별 변환율 비교 ── */
      const lx = 48, ly = h - 150, lw = Math.min(w - 96, 480);
      D.text(ctx, '반응별 질량→에너지 변환율 (로그 눈금)', lx, ly - 10, { size: 10.5, color: '#61719a' });
      const LO = Math.log10(1e-10), HI = 0;
      const LX = e => lx + lw * clamp((Math.log10(e) - LO) / (HI - LO), 0, 1);
      D.line(ctx, lx, ly + 16, lx + lw, ly + 16, { color: 'rgba(147,162,196,.25)', width: 2 });
      RXN.forEach((rr, i) => {
        const on = rr === r;
        ctx.save(); if (on) { ctx.shadowColor = rr.c; ctx.shadowBlur = 14; }
        D.line(ctx, LX(rr.eta), ly + 16 - (on ? 20 : 11), LX(rr.eta), ly + 16,
          { color: rr.c, width: on ? 3.4 : 1.8 });
        ctx.restore();
        D.text(ctx, rr.n.split(' ')[0], LX(rr.eta), ly + (i % 2 ? 42 : 30),
          { size: 8.5, color: on ? rr.c : '#4b5a80', align: 'center', bold: on });
      });
      D.text(ctx, '10⁻¹⁰', lx, ly + 58, { size: 9, color: '#4b5a80' });
      D.text(ctx, '100% (반물질)', lx + lw, ly + 58, { size: 9, color: '#4b5a80', align: 'right' });

      /* ── 에너지 크기 비교 ── */
      const qy = h - 62;
      const MARKS = [[3.6e6, '1 kWh'], [1.3e8, '휘발유 1 L'], [4.184e9, 'TNT 1톤'],
                     [6.3e13, '히로시마 원폭'], [1.26e16, '서울 1년 전력']];
      D.text(ctx, '이 에너지는 얼마나 큰가', lx, qy - 10, { size: 10.5, color: '#61719a' });
      const QLO = Math.log10(1e5), QHI = Math.log10(1e18);
      const QX = e => lx + lw * clamp((Math.log10(Math.max(e, 1e5)) - QLO) / (QHI - QLO), 0, 1);
      D.roundRect(ctx, lx, qy, lw, 10, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      ctx.save(); if (hl === 'E') { ctx.shadowColor = C.E; ctx.shadowBlur = 12; }
      ctx.fillStyle = C.E; ctx.globalAlpha = .7;
      ctx.fillRect(lx, qy, QX(E) - lx, 10); ctx.restore();
      MARKS.forEach(([e, lab], i) => {
        D.line(ctx, QX(e), qy - 4, QX(e), qy + 14, { color: 'rgba(147,162,196,.45)', width: 1.2 });
        D.text(ctx, lab, QX(e), qy + (i % 2 ? 36 : 26), { size: 8.5, color: '#93a2c4', align: 'center' });
      });
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      D.dot(ctx, QX(E), qy + 5, 5.5, '#fff', true); ctx.restore();
    }
  });
})();
