/* [항공우주공학·대기권 재진입] 탄도계수와 열 장벽 — β = m/(C_D A),  q̇ ∝ √ρ · V³
   궤도에서 돌아오는 우주선은 초속 7.8 km의 운동에너지를 전부 버려야 한다.
   역추진으로 버리려면 올라갈 때만큼의 연료가 필요하므로 — 대신 공기에 버린다.
   문제는 그 에너지가 열이 된다는 것이고, 가열률은 속도의 세제곱에 비례한다.
   가볍고 뭉툭할수록(탄도계수가 작을수록) 높은 고도의 옅은 공기에서 미리 감속해
   덜 뜨거워진다 — 아폴로 캡슐이 뾰족하지 않고 접시처럼 생긴 이유다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { V0: '#fb7185', gam: '#fbbf24', beta: '#5eead4',
              h: '#60a5fa', V: '#fb7185', g: '#a78bfa', q: '#fb923c' };
  const RHO0 = 1.225, HS = 7200, G0 = 9.81, RN = .9;        // 기준 밀도 / 척도고도 / 중력 / 노즈 반지름
  const TSCALE = 10;                                         // 화면 1초 = 실제 10초
  const H0 = 120000;                                         // 진입 고도 120 km

  const rhoOf = h => RHO0 * Math.exp(-Math.max(h, 0) / HS);
  // 서튼-그레이브스 정체점 가열률 [W/m²]
  const qdot = (h, V) => 1.7415e-4 * Math.sqrt(rhoOf(h) / RN) * Math.pow(V, 3);

  PS.register({
    id: 'aero-reentry', mode: 'aero', category: '대기권 재진입',
    title: '대기권 재진입',
    sub: 'β = m/(C_D A),  q̇ ∝ √ρ·V³',
    tagline: '궤도에서 돌아오려면 초속 7.8 km의 운동에너지를 전부 버려야 합니다. 연료로는 감당이 안 되니 공기에 버리는데 — 그게 전부 열이 됩니다.',

    params: [
      { key: 'V0', symbol: 'V₀', label: '진입 속도', unit: 'km/s', min: 5, max: 12, step: .1, value: 7.8, color: C.V0, dec: 1, reset: true,
        where: '고도 120 km에서의 <b>진입 속도</b>입니다. 저궤도 귀환 7.8 · 달 귀환 11 · 화성 귀환 12 km/s. 가열률이 <b>세제곱</b>으로 커져, 달에서 오면 열이 3배가 아니라 2.8배가 됩니다.' },
      { key: 'gam', symbol: 'γ', label: '진입각', unit: '°', min: .5, max: 15, step: .1, value: 2, color: C.gam, dec: 1, reset: true,
        where: '수평선 아래로 <b>얼마나 가파르게 들어오는가</b>입니다. 가파르면 짧고 뜨겁고 강하게(감속도 ↑), 얕으면 길고 완만합니다 — 아폴로는 6.5±0.5°라는 좁은 창을 맞춰야 했습니다.' },
      { key: 'beta', symbol: 'β', label: '탄도계수', unit: 'kg/m²', min: 20, max: 600, step: 10, value: 100, color: C.beta, dec: 0, reset: true,
        where: '<b>무게 / (항력계수 × 단면적)</b>입니다. 작을수록(가볍고 뭉툭할수록) 높은 고도의 옅은 공기에서 미리 감속해 덜 뜨거워집니다. 아폴로 캡슐 약 350, 우주왕복선 약 250, 운석 수천.' }
    ],
    vars: {
      h: { symbol: 'h', label: '고도', unit: 'km', color: C.h,
        where: '현재 <b>고도</b>입니다. 공기 밀도가 7.2 km마다 e배씩 줄어들기 때문에, 대부분의 감속은 아주 좁은 고도 구간에서 한꺼번에 일어납니다.' },
      V: { symbol: 'V', label: '속도', unit: 'km/s', color: C.V,
        where: '현재 <b>속도</b>입니다. 밀도가 커지는 구간에 들어서는 순간 급격히 떨어집니다.' },
      g: { symbol: 'a', label: '감속도', unit: 'g', color: C.g,
        where: '우주비행사가 느끼는 <b>감속 가속도</b>입니다. 유인 귀환은 보통 10 g 이하로 설계하고, 훈련받지 않은 사람은 15 g에서 위험합니다.' },
      q: { symbol: 'q̇', label: '가열률', unit: 'MW/m²', color: C.q,
        where: '기수가 받는 <b>단위 면적당 열</b>입니다. √ρ·V³ 이라 속도가 지배하며, 열방어 시스템(TPS) 설계의 기준값입니다.' }
    },
    formulas: [
      { name: '공기 밀도 (지수 대기)', tpl: 'ρ = ρ₀·e^(−{h}⁄H),  H ≈ 7.2 km' },
      { name: '감속 (항력)', tpl: 'd{V}⁄dt = −ρ{V}² ⁄ 2{beta} + g·sin{gam}' },
      { name: '탄도계수', tpl: '{beta} = m ⁄ (C_D·A)' },
      { name: '정체점 가열률', tpl: '{q} ∝ √ρ · {V}³' }
    ],

    init(p) {
      return { h: H0, V: p.V0 * 1000, maxG: 0, maxQ: 0, hMaxG: 0, heat: 0,
               trail: [], landed: false, done: false };
    },
    step(st, p, dt) {
      if (st.landed) return;
      const rdt = dt * TSCALE;
      const sg = Math.sin(p.gam * Math.PI / 180);
      const rho = rhoOf(st.h);
      const dec = rho * st.V * st.V / (2 * p.beta);          // 항력 감속도
      st.V += (-dec + G0 * sg) * rdt;
      st.h -= st.V * sg * rdt;
      const gl = dec / G0;
      if (gl > st.maxG) { st.maxG = gl; st.hMaxG = st.h; }
      const q = qdot(st.h, st.V);
      if (q > st.maxQ) st.maxQ = q;
      st.heat += q * rdt;
      if (st.trail.length === 0 || Math.abs(st.h - st.trail[st.trail.length - 1][0]) > 400)
        st.trail.push([st.h, st.V]);
      if (st.h <= 0 || st.V < 150) { st.h = Math.max(st.h, 0); st.landed = true; st.done = true; }
    },

    graphs: [{
      title: '속도와 감속도 – 시간 (화면 1초 = 실제 10초)', xmin: 20, y0: 0,
      series: [
        { key: 'vk', label: '속도 (km/s)', color: C.V },
        { key: 'gg', label: '감속도 (g)', color: C.g }
      ]
    }, {
      title: '고도와 가열률', xmin: 20, y0: 0,
      series: [
        { key: 'hk', label: '고도 (km)', color: C.h },
        { key: 'qq', label: '가열률 (MW/m²)', color: C.q }
      ]
    }],
    sample(st, p) {
      const rho = rhoOf(st.h);
      return { vk: st.V / 1000, gg: rho * st.V * st.V / (2 * p.beta) / G0,
               hk: st.h / 1000, qq: qdot(st.h, st.V) / 1e6 };
    },

    readouts(st, p) {
      const rho = rhoOf(st.h);
      const g = rho * st.V * st.V / (2 * p.beta) / G0;
      const q = qdot(st.h, st.V);
      const ke0 = .5 * Math.pow(p.V0 * 1000, 2);
      const blackout = st.h > 25000 && st.h < 90000 && st.V > 3000;
      return [
        { label: '고도', value: st.h / 1000, unit: 'km', color: C.h, dec: 1 },
        { label: '속도', value: st.V / 1000, unit: 'km/s', color: C.V, dec: 3 },
        { label: '마하수 (대략)', value: st.V / 300, unit: '', dec: 1, color: '#93a2c4' },
        { label: '현재 감속도', value: g, unit: 'g', color: C.g, dec: 2 },
        { label: '최대 감속도', value: st.maxG, unit: 'g', color: C.g, dec: 2 },
        { label: '최대 감속 고도', value: st.hMaxG / 1000, unit: 'km', dec: 1, color: C.h },
        { label: '현재 가열률', value: q / 1e6, unit: 'MW/m²', color: C.q, dec: 3 },
        { label: '최대 가열률', value: st.maxQ / 1e6, unit: 'MW/m²', color: C.q, dec: 3 },
        { label: '누적 열부하', value: st.heat / 1e6, unit: 'MJ/m²', dec: 0, color: C.q },
        { label: '버려야 할 운동에너지', value: ke0 / 1e6, unit: 'MJ/kg', dec: 1, color: C.V0 },
        { label: '통신 블랙아웃', wide: true, color: blackout ? '#fb7185' : '#34d399',
          value: blackout ? '차단 중 — 플라즈마가 전파를 막는다' : '통신 가능' },
        { label: '유인 귀환 적합성', wide: true,
          color: st.maxG <= 10 ? '#34d399' : (st.maxG <= 15 ? '#fbbf24' : '#fb7185'),
          value: st.maxG === 0 ? '진입 중…' :
                 (st.maxG <= 4 ? '✔ 매우 완만 (아폴로 수준)' :
                  (st.maxG <= 10 ? '✔ 유인 가능' :
                   (st.maxG <= 15 ? '△ 훈련된 승무원만' : '✘ 치명적 — 무인 전용'))) },
        { label: '상태', wide: true, color: st.landed ? '#34d399' : '#fbbf24',
          value: st.landed ? '감속 완료 — 낙하산 전개 고도 도달' : '재진입 중' }
      ];
    },

    notes: [
      '<b>왜 역추진으로 감속하지 않는가.</b> 초속 7.8 km를 엔진으로 지우려면 올라갈 때와 비슷한 연료가 필요합니다. 그 연료를 궤도까지 싣고 가는 것이 불가능해서, 공기에 버리는 것 말고는 방법이 없습니다.',
      '<b>탄도계수가 작을수록 안전합니다.</b> 가볍고 뭉툭하면 높은 고도의 옅은 공기에서 미리 감속합니다. 밀도가 낮으면 가열률(√ρ·V³)이 작으므로 — 속도를 일찍 버린 만큼 덜 뜨거워집니다. 그래서 아폴로 캡슐은 뾰족하지 않고 <b>접시처럼 생겼습니다</b>.',
      '<b>뭉툭한 코가 뾰족한 코보다 시원합니다.</b> 직관과 반대지만, 뭉툭하면 충격파가 기체에서 멀리 떨어져 서서(이탈 충격파) 뜨거운 공기가 표면에 직접 닿지 않습니다. 1951년 H. 줄리언 앨런이 발견한 이 역설이 모든 재진입체의 모양을 정했습니다.',
      '<b>진입각의 창이 아주 좁습니다.</b> 너무 가파르면 감속도와 가열이 치명적이고, 너무 얕으면 대기를 스치고 튕겨 나가(skip-out) 다시 우주로 갑니다. 아폴로의 허용 창은 6.5° ± 0.5° 였습니다.',
      '<b>통신 블랙아웃</b>은 고온 공기가 이온화되어 플라즈마 껍질을 만들고, 그 플라즈마가 전파를 반사하기 때문입니다. 아폴로는 약 4분, 우주왕복선은 약 12분간 교신이 끊겼습니다.',
      '달에서 돌아오면 속도가 11 km/s로 저궤도(7.8)의 1.4배인데, 가열률은 세제곱이라 <b>2.8배</b>가 됩니다. 아폴로 열방패가 머큐리보다 훨씬 두꺼웠던 이유입니다.',
      '※ 이 시뮬레이션은 진입각이 일정한 <b>탄도 재진입</b>(앨런-에거스 가정)을 씁니다. 실제 캡슐은 양력을 약간 내어 궤적을 조종합니다.'
    ],
    presets: [
      { name: '저궤도 귀환 (소유즈급)', set: { V0: 7.8, gam: 2, beta: 100 } },
      { name: '아폴로 달 귀환', set: { V0: 11, gam: 6.5, beta: 350 } },
      { name: '가파른 진입 (위험)', set: { V0: 7.8, gam: 12, beta: 100 } },
      { name: '얕은 진입 (완만)', set: { V0: 7.8, gam: .8, beta: 100 } },
      { name: '우주왕복선', set: { V0: 7.8, gam: 1.2, beta: 250 } },
      { name: '운석 (β 매우 큼)', set: { V0: 12, gam: 10, beta: 600 } }
    ],
    challenges: [
      {
        id: 'manned', title: '유인 귀환 조건 맞추기',
        desc: '최대 감속도를 10 g 이하로 유지하면서 재진입을 끝내 보세요 — 우주비행사가 견딜 수 있는 한계입니다.',
        hint: '진입각을 얕게, 탄도계수를 작게. 그러면 높은 고도에서 완만하게 감속합니다.',
        check: ({ st }) => st.landed && st.maxG > 0 && st.maxG <= 10
      },
      {
        id: 'moon', title: '달 귀환의 열 장벽',
        desc: '진입 속도 11 km/s로 들어와 최대 가열률 3 MW/m² 이상을 겪어 보세요 — 아폴로 열방패가 감당한 수준입니다.',
        hint: '속도를 11 km/s로 올리고 재생하세요. 가열률은 속도의 세제곱입니다.',
        check: ({ P, st }) => P.V0 >= 10.5 && st.maxQ / 1e6 >= 3
      },
      {
        id: 'blunt', title: '뭉툭한 캡슐의 이점',
        desc: '탄도계수를 50 kg/m² 이하로 낮춰, 최대 감속이 일어나는 고도를 50 km 이상으로 끌어올려 보세요.',
        hint: 'β가 작으면 옅은 공기에서도 충분히 감속됩니다 — 높은 고도에서 일이 끝나니 덜 뜨겁습니다.',
        check: ({ P, st }) => P.beta <= 50 && st.hMaxG >= 50000
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const rho = rhoOf(st.h);
      const gl = rho * st.V * st.V / (2 * p.beta) / G0;
      const q = qdot(st.h, st.V);

      /* ── 대기층 단면 ── */
      const ax = 48, aw = Math.min(w * .34, 220);
      const aTop = 48, aH = Math.min(h - 150, 300);
      const AY = hh => aTop + aH * (1 - clamp(hh / H0, 0, 1));
      // 밀도 그라데이션
      for (let i = 0; i < 60; i++) {
        const hh = H0 * (1 - i / 60);
        const d = rhoOf(hh) / RHO0;
        ctx.fillStyle = 'rgba(96,165,250,' + (.03 + .30 * Math.pow(d, .45)) + ')';
        ctx.fillRect(ax, AY(hh), aw, aH / 60 + 1);
      }
      ctx.strokeStyle = 'rgba(147,162,196,.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(ax, aTop, aw, aH);
      // 지표
      D.line(ctx, ax - 6, AY(0), ax + aw + 6, AY(0), { color: 'rgba(147,162,196,.7)', width: 3 });
      [0, 25, 50, 75, 100, 120].forEach(km => {
        D.line(ctx, ax - 5, AY(km * 1000), ax, AY(km * 1000), { color: 'rgba(147,162,196,.4)' });
        D.text(ctx, km + ' km', ax - 8, AY(km * 1000) + 4, { size: 8.5, color: '#4b5a80', align: 'right' });
      });
      // 블랙아웃 구간
      ctx.save(); ctx.fillStyle = 'rgba(251,113,133,.08)';
      ctx.fillRect(ax, AY(90000), aw, AY(25000) - AY(90000)); ctx.restore();
      D.text(ctx, '통신 블랙아웃 구간', ax + 5, AY(88000) + 10, { size: 8.5, color: 'rgba(251,113,133,.75)' });

      // 궤적
      if (st.trail.length > 1) {
        ctx.save(); ctx.strokeStyle = 'rgba(251,146,60,.6)'; ctx.lineWidth = 2;
        ctx.beginPath();
        st.trail.forEach((t, i) => {
          const X = ax + aw * (1 - t[1] / (p.V0 * 1000)) * .85 + aw * .08;
          i ? ctx.lineTo(X, AY(t[0])) : ctx.moveTo(X, AY(t[0]));
        });
        ctx.stroke(); ctx.restore();
      }
      // 캡슐
      const cxp = ax + aw * (1 - st.V / (p.V0 * 1000)) * .85 + aw * .08, cyp = AY(st.h);
      const hot = clamp(q / 4e6, 0, 1);
      if (hot > .01) {
        ctx.save();
        const g2 = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, 10 + hot * 26);
        g2.addColorStop(0, 'rgba(255,255,220,' + (.5 + .45 * hot) + ')');
        g2.addColorStop(.4, 'rgba(255,150,60,' + (.4 * hot) + ')');
        g2.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cxp, cyp, 10 + hot * 26, 0, 7); ctx.fill();
        ctx.restore();
        // 플라즈마 꼬리
        ctx.save(); ctx.strokeStyle = 'rgba(255,170,90,' + (.25 + .4 * hot) + ')'; ctx.lineWidth = 2;
        for (let k = 0; k < 4; k++) {
          ctx.beginPath(); ctx.moveTo(cxp, cyp);
          ctx.lineTo(cxp - 14 - k * 9 + Math.sin(st.t * 9 + k) * 4, cyp - 16 - k * 11);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save(); if (hl === 'beta') { ctx.shadowColor = C.beta; ctx.shadowBlur = 14; }
      D.poly(ctx, [[cxp - 7, cyp - 5], [cxp + 7, cyp - 5], [cxp + 4, cyp + 5], [cxp - 4, cyp + 5]],
        { fill: 'rgba(200,211,239,.75)', stroke: '#e8eefc', width: 1.4 });
      ctx.restore();
      D.text(ctx, '← 속도', ax + aw - 4, aTop + 14, { size: 9, color: '#61719a', align: 'right' });
      D.text(ctx, '고도 ↑', ax + 4, aTop + 14, { size: 9, color: '#61719a' });

      /* ── 계기 ── */
      const mx = ax + aw + 56, mw = Math.min(w - mx - 44, 250);
      if (mw > 140) {
        const row = (y, lab, val, frac, cc, hot2) => {
          D.text(ctx, lab, mx, y - 6, { size: 10, color: cc });
          D.roundRect(ctx, mx, y, mw, 12, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
          ctx.save(); if (hot2) { ctx.shadowColor = cc; ctx.shadowBlur = 12; }
          ctx.fillStyle = cc; ctx.globalAlpha = .8;
          ctx.fillRect(mx, y, mw * clamp(frac, 0, 1), 12); ctx.restore();
          D.text(ctx, val, mx + mw + 8, y + 10, { size: 10.5, color: cc, bold: true });
        };
        row(aTop + 10, '속도', fmt(st.V / 1000, 2) + ' km/s', st.V / (p.V0 * 1000), C.V, hl === 'V');
        row(aTop + 52, '고도', fmt(st.h / 1000, 1) + ' km', st.h / H0, C.h, hl === 'h');
        row(aTop + 94, '감속도 (최대 ' + fmt(st.maxG, 1) + ' g)', fmt(gl, 2) + ' g', gl / 16, C.g, hl === 'g');
        // 10 g 한계선
        D.line(ctx, mx + mw * 10 / 16, aTop + 90, mx + mw * 10 / 16, aTop + 110, { color: '#fb7185', width: 2 });
        D.text(ctx, '10 g (유인 한계)', mx + mw * 10 / 16, aTop + 124, { size: 8.5, color: '#fb7185', align: 'center' });
        row(aTop + 146, '가열률 (최대 ' + fmt(st.maxQ / 1e6, 2) + ')', fmt(q / 1e6, 2) + ' MW/m²', q / 8e6, C.q, hl === 'q');
        D.text(ctx, '탄도계수 β = ' + fmt(p.beta, 0) + ' kg/m²', mx, aTop + 196,
          { size: 11.5, color: hl === 'beta' ? '#fff' : C.beta, bold: true });
        D.text(ctx, '진입각 γ = ' + fmt(p.gam, 1) + '°   ·   진입 속도 ' + fmt(p.V0, 1) + ' km/s',
          mx, aTop + 216, { size: 11, color: '#93a2c4' });
        D.text(ctx, '화면 1초 = 실제 10초', mx, aTop + 236, { size: 9.5, color: '#4b5a80' });
        if (st.landed) D.tag(ctx, '감속 완료 — 최대 ' + fmt(st.maxG, 1) + ' g, ' + fmt(st.maxQ / 1e6, 2) + ' MW/m²',
          mx + mw / 2, aTop + 264, st.maxG <= 10 ? '#34d399' : '#fb7185', true);
      }
    }
  });
})();
