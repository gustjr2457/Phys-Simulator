/* [기계공학·고체역학] 보의 굽힘과 처짐 — δ = PL³/(3EI), I = bh³/12
   한쪽만 고정한 외팔보 끝에 하중을 걸면 얼마나 처지는가. 처짐은 길이의 세제곱에
   비례하고, 단면 높이의 세제곱에 반비례한다 — 같은 재료를 같은 양만큼 쓰면서도
   "세워서" 쓰면 8배 튼튼해지는 이유. 항공기 날개보, 선체 종강도, 건물 보가 모두
   이 식 하나로 설계된다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { P: '#f472b6', L: '#93a2c4', b: '#60a5fa', h: '#5eead4', E: '#a78bfa',
              I: '#fbbf24', d: '#fb7185', sig: '#fb923c' };
  const SY = 250;                   // 가정한 항복강도(연강) MPa

  const Imm = p => p.b * p.h * p.h * p.h / 12;                       // mm⁴
  // δ[mm] = P[N]·L[mm]³ / (3·E[N/mm²]·I[mm⁴])
  const defl = p => p.P * Math.pow(p.L * 1000, 3) / (3 * p.E * 1000 * Imm(p));
  const sigMax = p => 6 * p.P * (p.L * 1000) / (p.b * p.h * p.h);     // MPa

  PS.register({
    id: 'me-beam', mode: 'mech', category: '고체역학',
    title: '보의 굽힘과 처짐',
    sub: 'δ = PL³ / 3EI',
    tagline: '같은 양의 재료라도 "어떤 모양으로 배치하는가"가 강성을 결정합니다. 단면 높이를 2배로 하면 처짐은 8분의 1이 됩니다 — 자를 눕혀 들 때와 세워 들 때의 차이입니다.',

    params: [
      { key: 'P', symbol: 'P', label: '끝단 하중', unit: 'N', min: 100, max: 3000, step: 50, value: 600, color: C.P, dec: 0,
        where: '보의 <b>자유단에 매달린 힘</b>(분홍 화살표)입니다. 처짐과 응력 모두 P에 정비례하므로, 하중이 2배면 처짐도 2배입니다.' },
      { key: 'L', symbol: 'L', label: '보의 길이', unit: 'm', min: .4, max: 2.4, step: .1, value: 1.2, color: C.L, dec: 1, reset: true,
        where: '고정단에서 하중까지의 <b>뻗은 길이</b>입니다. 처짐에 <b>세제곱</b>으로 들어가므로 가장 무서운 변수입니다 — 길이를 2배로 하면 처짐은 8배.' },
      { key: 'b', symbol: 'b', label: '단면 폭', unit: 'mm', min: 10, max: 120, step: 5, value: 50, color: C.b, dec: 0,
        where: '단면의 <b>가로 폭</b>(오른쪽 단면도)입니다. I = bh³/12에서 1제곱으로만 들어가므로, 폭을 2배로 해도 처짐은 절반밖에 줄지 않습니다.' },
      { key: 'h', symbol: 'h', label: '단면 높이', unit: 'mm', min: 10, max: 120, step: 5, value: 25, color: C.h, dec: 0,
        where: '단면의 <b>세로 높이</b>(굽힘 방향)입니다. I에 <b>세제곱</b>으로 들어가 처짐을 지배합니다. H형강·I형강이 위아래로 긴 이유입니다.' },
      { key: 'E', symbol: 'E', label: '탄성계수', unit: 'GPa', min: 50, max: 250, step: 10, value: 200, color: C.E, dec: 0,
        where: '재료의 <b>뻣뻣함</b>입니다(강철 200 · 알루미늄 70 GPa). 처짐에 반비례하지만, 단면 높이와 달리 선택의 폭이 좁습니다.' }
    ],
    vars: {
      d: { symbol: 'δ', label: '최대 처짐', unit: 'mm', color: C.d,
        where: '자유단이 <b>아래로 내려간 거리</b>(붉은 치수선)입니다. 설계에서는 보통 L/300 이하로 제한합니다.' },
      I: { symbol: 'I', label: '단면 2차 모멘트', unit: 'mm⁴', color: C.I,
        where: '단면의 <b>모양만으로 정해지는 굽힘 저항</b>입니다(오른쪽 단면도). 재료와 무관하게 "어떻게 배치했는가"를 나타냅니다.' },
      sig: { symbol: 'σ', label: '최대 굽힘응력', unit: 'MPa', color: C.sig,
        where: '고정단 <b>위·아래 표면</b>에서 가장 커집니다(붉은·파란 색띠). 위는 늘어나고(인장) 아래는 눌립니다(압축). 중앙선에서는 0입니다.' }
    },
    formulas: [
      { name: '외팔보 끝단 처짐', tpl: '{d} = {P}{L}³ ⁄ ( 3{E}{I} )' },
      { name: '직사각 단면의 2차 모멘트', tpl: '{I} = {b}{h}³ ⁄ 12' },
      { name: '최대 굽힘응력 (고정단)', tpl: '{sig} = 6{P}{L} ⁄ ( {b}{h}² )' }
    ],

    init(p) { return { r: 0, done: false }; },
    step(st, p, dt) {                       // 하중을 2.5초에 걸쳐 서서히 올린다
      st.r = Math.min(1, st.r + dt / 2.5);
      if (st.r >= 1) st.done = false;       // 그래프가 계속 그려지도록 멈추지는 않는다
    },

    graphs: [{
      title: '처짐 – 하중 (탄성이면 직선)', xKey: 'Pn', xUnit: 'N', xMin: 0, y0: 0,
      series: [{ key: 'dl', label: 'δ (mm)', color: C.d }]
    }, {
      title: '굽힘응력 – 하중', xKey: 'Pn', xUnit: 'N', xMin: 0, y0: 0,
      series: [
        { key: 'sg', label: 'σ (MPa)', color: C.sig },
        { key: 'syl', label: '항복강도 250', color: '#fb7185' }
      ]
    }],
    sample(st, p) {
      return { Pn: p.P * st.r, dl: defl(p) * st.r, sg: sigMax(p) * st.r, syl: SY };
    },

    readouts(st, p) {
      const dl = defl(p) * st.r, sg = sigMax(p) * st.r;
      const lim = p.L * 1000 / 300;
      return [
        { label: '단면 2차 모멘트 I', value: Imm(p), unit: 'mm⁴', color: C.I, dec: 0 },
        { label: '최대 처짐 δ', value: dl, unit: 'mm', color: C.d, dec: 2 },
        { label: '처짐 한계 L/300', value: lim, unit: 'mm', dec: 2, color: '#93a2c4' },
        { label: '처짐 판정', wide: true, value: dl <= lim ? '✔ 한계 안 (δ ≤ L/300)' : '✘ 너무 처진다 (δ > L/300)',
          color: dl <= lim ? '#34d399' : '#fb7185' },
        { label: '최대 굽힘응력 σ', value: sg, unit: 'MPa', color: C.sig, dec: 0 },
        { label: '안전율 (250 MPa 기준)', value: sg > .5 ? SY / sg : Infinity, dec: 2,
          color: sg < SY ? '#34d399' : '#fb7185' },
        { label: '현재 하중', value: p.P * st.r, unit: 'N', color: C.P, dec: 0 },
        { label: '높이를 2배로 하면', value: fmt(dl / 8, 2) + ' mm (1/8)', wide: true, color: C.h },
        { label: '강도 판정', wide: true, value: sg < SY ? '탄성 — 하중을 풀면 완전히 복원' : '항복 — 영구 변형 발생(공식 적용 범위 밖)',
          color: sg < SY ? '#34d399' : '#fb7185' }
      ];
    },

    notes: [
      '<b>처짐은 길이의 세제곱</b>입니다. 외팔보를 2배 길게 뻗으면 같은 하중에서 8배 처집니다 — 크레인 붐, 항공기 날개, 선반 지지대 모두 길이를 줄이려 애쓰는 이유입니다.',
      '<b>단면 높이도 세제곱</b>입니다(I = bh³/12). 같은 단면적이라면 높이를 늘리고 폭을 줄이는 쪽이 압도적으로 유리합니다 — 자를 세워서 들어 보면 손으로 바로 느낄 수 있습니다.',
      '그래서 <b>I형강·H형강</b>은 재료를 위아래 플랜지에 몰아 둡니다. 중앙선 근처는 응력이 거의 0이라 재료를 둬도 쓸모가 적고, 무게만 늘기 때문입니다.',
      '<b>처짐과 강도는 다른 문제입니다.</b> 처짐은 E와 I가 결정하고(강성), 파손은 σ와 항복강도가 결정합니다(강도). 안 부러져도 너무 흔들리면 쓸 수 없으므로 두 조건을 모두 만족시켜야 합니다.',
      '굽힘응력은 고정단 표면에서 최대입니다. 위는 인장, 아래는 압축이며 중앙(중립축)은 0 — 그래서 <b>균열은 거의 항상 표면에서</b> 시작합니다.'
    ],
    presets: [
      { name: '기본 (각재 50×25)', set: { P: 600, L: 1.2, b: 50, h: 25, E: 200 } },
      { name: '세워서 쓰기 (25×50)', set: { b: 25, h: 50 } },
      { name: '두 배 길게', set: { L: 2.4 } },
      { name: '알루미늄으로 교체', set: { E: 70 } },
      { name: '얇고 긴 외팔보 (위험)', set: { P: 1500, L: 2.4, b: 40, h: 12 } }
    ],
    challenges: [
      {
        id: 'stiff', title: '1000 N을 2 mm 안에서 받치기',
        desc: '하중 1000 N 이상에서 최대 처짐을 2 mm 이하로 만들어 보세요.',
        hint: '폭 b보다 높이 h를 올리는 쪽이 8배 효율적입니다. 길이를 줄이는 것도 세제곱으로 듣습니다.',
        check: ({ P, st }) => P.P >= 1000 && st.r > .99 && defl(P) <= 2
      },
      {
        id: 'shape', title: '모양만 바꿔서 이기기',
        desc: '단면적을 1250 mm² 이하로 유지하면서(재료를 더 쓰지 않고) I를 400,000 mm⁴ 이상 만들어 보세요.',
        hint: '같은 면적이라면 폭을 좁히고 높이를 높이세요. b×h를 같게 두고 h를 올려 보면 I가 세제곱으로 뜁니다.',
        check: ({ P }) => P.b * P.h <= 1250 && P.b * P.h * P.h * P.h / 12 >= 4e5
      },
      {
        id: 'both', title: '강성과 강도를 동시에',
        desc: '2000 N 이상을 걸면서 처짐은 L/300 이하, 굽힘응력은 250 MPa 이하로 맞춰 보세요.',
        hint: '둘 다 h에 유리하지만 응력은 h², 처짐은 h³입니다. 길이를 짧게 하는 것이 양쪽 모두에 가장 잘 듣습니다.',
        check: ({ P, st }) => P.P >= 2000 && st.r > .99 && defl(P) <= P.L * 1000 / 300 && sigMax(P) <= SY
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const r = st.r;
      const dlmm = defl(p) * r, sg = sigMax(p) * r;

      const x0 = 86, y0 = h * .36;
      const span = Math.min(w * .52, 340);
      const pxPerM = span / 2.4;                     // 길이 축척 고정 → L 변화가 눈에 보인다
      const Lpx = p.L * pxPerM;
      const hpx = clamp(p.h * .42, 5, 52);           // 단면 높이 표시 축척
      // 처짐은 보기 좋게 과장하되, 비율(세제곱 법칙)은 유지한다
      const dpx = clamp(dlmm * 1.7, 0, h * .30);
      const yOf = x => {                              // 외팔보 처짐 곡선 y(x) = δ·x²(3L−x)/(2L³)
        const u = x / Lpx;
        return dpx * (u * u * (3 - u)) / 2;
      };

      // 벽(고정단)
      ctx.fillStyle = 'rgba(147,162,196,.18)';
      ctx.fillRect(x0 - 34, y0 - 72, 34, 150);
      D.line(ctx, x0, y0 - 72, x0, y0 + 78, { color: 'rgba(147,162,196,.7)', width: 3 });
      for (let i = 0; i < 9; i++) D.line(ctx, x0 - 34, y0 - 66 + i * 17, x0 - 22, y0 - 76 + i * 17, { color: 'rgba(147,162,196,.3)' });
      D.text(ctx, '고정단', x0 - 36, y0 + 94, { size: 10, color: '#61719a', align: 'center' });

      // 보 — 위·아래 표면을 굽힘응력 비율로 색칠(위 인장 / 아래 압축)
      const seg = 60;
      const top = [], bot = [];
      for (let i = 0; i <= seg; i++) {
        const x = Lpx * i / seg, yy = y0 + yOf(x);
        const slope = dpx * (6 * (x / Lpx) - 3 * (x / Lpx) * (x / Lpx)) / (2 * Lpx);
        const nx = -slope / Math.hypot(1, slope), ny = 1 / Math.hypot(1, slope);
        top.push([x0 + x + nx * -hpx / 2, yy + ny * -hpx / 2]);
        bot.push([x0 + x + nx * hpx / 2, yy + ny * hpx / 2]);
      }
      ctx.save();
      if (hl === 'h' || hl === 'b' || hl === 'I') { ctx.shadowColor = hl === 'h' ? C.h : (hl === 'b' ? C.b : C.I); ctx.shadowBlur = 16; }
      D.poly(ctx, top.concat(bot.slice().reverse()),
        { fill: 'rgba(147,162,196,.16)', stroke: sg > SY ? '#fb7185' : '#c8d3ef', width: 2 });
      ctx.restore();
      // 응력 색띠: 고정단에서 진하고 자유단에서 0
      const sFrac = clamp(sg / SY, 0, 1.3);
      ctx.save();
      ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      [[top, '#fb7185', '인장'], [bot, '#60a5fa', '압축']].forEach(([pts, cc]) => {
        for (let i = 0; i < seg; i++) {
          const a = 1 - i / seg;                       // 굽힘모멘트는 고정단에서 최대
          ctx.strokeStyle = cc; ctx.globalAlpha = .18 + .72 * a * Math.min(1, sFrac);
          ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
        }
      });
      ctx.restore();
      D.text(ctx, '인장 (늘어남)', x0 + 8, top[2][1] - 8, { size: 9.5, color: '#fb7185' });
      D.text(ctx, '압축 (눌림)', x0 + 8, bot[2][1] + 16, { size: 9.5, color: '#60a5fa' });
      // 중립축
      ctx.save(); ctx.strokeStyle = 'rgba(232,238,252,.35)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= seg; i++) { const x = Lpx * i / seg; i ? ctx.lineTo(x0 + x, y0 + yOf(x)) : ctx.moveTo(x0 + x, y0 + yOf(x)); }
      ctx.stroke(); ctx.restore();
      D.text(ctx, '중립축 (σ = 0)', x0 + Lpx * .5, y0 + yOf(Lpx * .5) - 3, { size: 9, color: 'rgba(232,238,252,.5)', align: 'center' });

      // 처짐 전 기준선
      D.line(ctx, x0, y0, x0 + Lpx + 26, y0, { color: 'rgba(147,162,196,.3)', dash: [5, 6] });

      // 하중 화살표
      const tipX = x0 + Lpx, tipY = y0 + dpx;
      const al = clamp(26 + p.P * r * .024, 22, 86);
      D.arrow(ctx, tipX, tipY - al - hpx / 2, 0, al, { color: C.P, width: 4, hot: hl === 'P', label: 'P = ' + fmt(p.P * r, 0) + ' N', ly: -14 });

      // 처짐 치수선
      D.dim(ctx, tipX + 30, y0, tipX + 30, tipY, 'δ = ' + fmt(dlmm, 2) + ' mm', C.d, hl === 'd');
      // 길이 치수선
      D.dim(ctx, x0, y0 - 84, tipX, y0 - 84, 'L = ' + fmt(p.L, 1) + ' m', C.L, hl === 'L');

      // 비교 유령선: 높이를 절반 / 두 배로 했을 때
      [[.5, 8, '높이 ½ → 8배'], [2, 1 / 8, '높이 2배 → ⅛']].forEach(([, k, lab], idx) => {
        const gd = clamp(dlmm * k * 1.7, 0, h * .34);
        ctx.save();
        ctx.strokeStyle = idx ? 'rgba(94,234,212,.5)' : 'rgba(251,113,133,.4)';
        ctx.setLineDash([3, 4]); ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i <= seg; i++) {
          const x = Lpx * i / seg, u = x / Lpx, yy = y0 + gd * (u * u * (3 - u)) / 2;
          i ? ctx.lineTo(x0 + x, yy) : ctx.moveTo(x0 + x, yy);
        }
        ctx.stroke(); ctx.restore();
        D.text(ctx, lab, tipX + 4, y0 + gd + (idx ? -4 : 12),
          { size: 9, color: idx ? 'rgba(94,234,212,.8)' : 'rgba(251,113,133,.75)' });
      });

      /* ── 단면도 ── */
      const sx = w - 118, sy = h - 168;
      D.text(ctx, '단면 (b × h)', sx, sy - 12, { size: 10.5, color: '#61719a' });
      const dw = clamp(p.b * .62, 8, 76), dh = clamp(p.h * .62, 8, 76);
      ctx.save();
      if (hl === 'I') { ctx.shadowColor = C.I; ctx.shadowBlur = 16; }
      D.roundRect(ctx, sx + 38 - dw / 2, sy + 42 - dh / 2, dw, dh, 2);
      ctx.fillStyle = 'rgba(147,162,196,.22)'; ctx.fill();
      ctx.strokeStyle = C.I; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.restore();
      D.dim(ctx, sx + 38 - dw / 2, sy + 42 + dh / 2 + 13, sx + 38 + dw / 2, sy + 42 + dh / 2 + 13,
        'b ' + fmt(p.b, 0), C.b, hl === 'b');
      D.dim(ctx, sx + 38 + dw / 2 + 14, sy + 42 - dh / 2, sx + 38 + dw / 2 + 14, sy + 42 + dh / 2,
        'h ' + fmt(p.h, 0), C.h, hl === 'h');
      D.text(ctx, 'I = ' + fmt(Imm(p), 0) + ' mm⁴', sx - 4, sy + 108,
        { size: 11, color: hl === 'I' ? '#fff' : C.I, bold: hl === 'I' });

      /* ── 상태 배너 ── */
      const over = sg > SY;
      D.tag(ctx, over ? '항복! σ = ' + fmt(sg, 0) + ' MPa > 250' : 'σ = ' + fmt(sg, 0) + ' MPa  ·  δ = ' + fmt(dlmm, 2) + ' mm',
        w * .45, 26, over ? '#fb7185' : '#34d399', true);
    }
  });
})();
