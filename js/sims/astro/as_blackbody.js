/* [천문학·별빛 읽기] 흑체복사 — 별의 색이 곧 온도다
   λ_max·T = 2.898×10⁻³ m·K (빈의 변위 법칙),  F = σT⁴ (슈테판-볼츠만)
   별에 온도계를 꽂을 수는 없다. 그런데도 우리가 별의 온도를 아는 이유는,
   뜨거운 물체가 내는 빛의 '색깔 분포'가 온도만으로 완전히 정해지기 때문이다.
   분광기로 파장을 훑으면 봉우리의 위치가 나오고, 그 위치 하나가 온도를 말해 준다.
   별의 분광형(OBAFGKM)은 결국 이 봉우리가 어디 있느냐의 분류다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { T: '#fb7185', R: '#5eead4', lam: '#fbbf24', lmax: '#f472b6', L: '#a78bfa', F: '#fb923c' };
  const HCK = 1.43878e7;          // hc/k [nm·K]
  const WIEN = 2.8978e6;          // 빈의 상수 [nm·K]
  const TSUN = 5772, SCAN = 16;   // 태양 유효온도 / 분광 스캔 시간(초)
  const LAM0 = 120, LAM1 = 2400;  // 스캔 범위 [nm]

  // 플랑크 법칙 (봉우리를 1로 정규화)
  function planck(lam, T) {
    const x = HCK / (lam * T);
    if (x > 700) return 0;
    const lm = WIEN / T;
    const num = Math.pow(lm / lam, 5) * (Math.exp(HCK / (lm * T)) - 1);
    return num / (Math.exp(x) - 1);
  }
  // 색온도 → RGB (별을 실제 색으로 그리기 위한 표준 근사)
  function bbRGB(T) {
    const t = clamp(T, 1000, 40000) / 100;
    let r, g, b;
    if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
    else { r = 329.7 * Math.pow(t - 60, -.133); g = 288.12 * Math.pow(t - 60, -.0755); b = 255; }
    return [clamp(r, 0, 255) | 0, clamp(g, 0, 255) | 0, clamp(b, 0, 255) | 0];
  }
  const rgb = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')';
  // 가시광 파장 → 대략적인 RGB (스펙트럼 띠를 칠하기 위함)
  function visRGB(l) {
    let r = 0, g = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = -(l - 645) / 65; }
    else { r = 1; }
    return [(r * 255) | 0, (g * 255) | 0, (b * 255) | 0];
  }
  const CLASS = [[30000, 'O', '파란 별 — 가장 뜨겁고 수명이 짧다'], [10000, 'B', '청백색 — 리겔, 스피카'],
                 [7500, 'A', '흰색 — 시리우스, 베가'], [6000, 'F', '연노랑 — 프로키온'],
                 [5200, 'G', '노란색 — 태양, 알파 센타우리 A'], [3700, 'K', '주황색 — 아크투루스'],
                 [0, 'M', '붉은 별 — 베텔게우스, 프록시마']];
  const classOf = T => CLASS.find(c => T >= c[0]) || CLASS[CLASS.length - 1];

  const lamMax = T => WIEN / T;
  const radOf = p => Math.pow(10, p.lgR);                                  // R/R☉
  const lumOf = p => Math.pow(radOf(p), 2) * Math.pow(p.T / TSUN, 4);      // L/L☉
  const scanLam = st => LAM0 + (LAM1 - LAM0) * Math.min(1, st.t / SCAN);

  PS.register({
    id: 'as-blackbody', mode: 'astro', category: '별빛 읽기',
    title: '별의 색과 온도 — 흑체복사',
    sub: 'λ_max·T = 2.898×10⁻³ m·K',
    tagline: '별에 온도계를 꽂을 수는 없습니다. 그런데도 온도를 아는 이유는 — 분광기로 파장을 훑으면 나오는 봉우리의 위치가 오직 온도 하나로 정해지기 때문입니다.',

    params: [
      { key: 'T', symbol: 'T', label: '표면 온도', unit: 'K', min: 2500, max: 40000, step: 100, value: 5772, color: C.T, dec: 0,
        where: '별 표면의 <b>유효 온도</b>입니다. 스펙트럼 봉우리의 위치(λ_max)와 별의 색을 동시에 결정하며, 왼쪽 별 그림의 색이 실제 그 온도의 색입니다.' },
      { key: 'lgR', symbol: 'R', label: '별의 반지름 (10^x R☉)', unit: '', min: -2.3, max: 3.1, step: .02, value: 0, color: C.R, dec: 2,
        where: '태양 반지름을 1로 둔 <b>별의 크기</b>(로그 눈금 — 백색왜성 0.008부터 적색초거성 1000까지 담기 위함)입니다. 색(온도)에는 전혀 영향을 주지 않고 <b>광도만</b> 바꿉니다 — L = 4πR²σT⁴.' }
    ],
    vars: {
      lmax: { symbol: 'λ_max', label: '봉우리 파장', unit: 'nm', color: C.lmax,
        where: '스펙트럼에서 <b>가장 밝은 파장</b>(분홍 수직선)입니다. 온도가 올라가면 왼쪽(짧은 파장·파란색)으로 밀려갑니다 — 이것이 빈의 변위 법칙입니다.' },
      lam: { symbol: 'λ', label: '관측 중인 파장', unit: 'nm', color: C.lam,
        where: '분광기가 <b>지금 보고 있는 파장</b>(노란 세로선)입니다. 이 선이 오른쪽으로 훑으면서 스펙트럼 곡선이 그려집니다.' },
      F: { symbol: 'F', label: '표면 플럭스', unit: 'W/m²', color: C.F,
        where: '별 표면 1 m²가 내보내는 <b>총 에너지</b>입니다. 온도의 <b>4제곱</b>에 비례해서, 온도가 2배면 16배가 됩니다.' },
      L: { symbol: 'L', label: '광도', unit: 'L☉', color: C.L,
        where: '별 전체가 내는 <b>총 에너지</b>입니다. 표면적(R²)과 표면 플럭스(T⁴)의 곱이라, 크고 뜨거운 별은 압도적으로 밝습니다.' }
    },
    formulas: [
      { name: '빈의 변위 법칙 — 색이 곧 온도', tpl: '{lmax} = 2.898×10⁶ ⁄ {T}   [nm]' },
      { name: '슈테판-볼츠만 법칙', tpl: '{F} = σ{T}⁴' },
      { name: '별의 광도', tpl: '{L} = 4π{lgR}²σ{T}⁴' },
      { name: '플랑크 법칙 (스펙트럼의 모양)', tpl: 'B({lam},{T}) ∝ {lam}⁻⁵ ⁄ (e^(hc⁄{lam}k{T}) − 1)' }
    ],

    init(p) { return { done: false }; },
    step(st, p, dt) { if (st.t > SCAN + 3) st.done = true; },

    graphs: [{
      title: '분광기가 그리는 스펙트럼 (세기 – 파장)', xKey: 'lam', xUnit: 'nm', xMin: LAM0, xMax: LAM1, y0: 0,
      series: [
        { key: 'I', label: '이 별', color: C.T },
        { key: 'Isun', label: '태양 (비교)', color: '#93a2c4' }
      ]
    }],
    sample(st, p) {
      const l = scanLam(st);
      return { lam: l, I: planck(l, p.T), Isun: planck(l, TSUN) };
    },

    readouts(st, p) {
      const lm = lamMax(p.T), cls = classOf(p.T);
      const F = 5.670e-8 * Math.pow(p.T, 4);
      const L = lumOf(p);
      // 가시광(380~750 nm)이 차지하는 비율을 수치적분으로
      let vis = 0, tot = 0;
      for (let l = 50; l < 4000; l += 10) { const b = planck(l, p.T) / Math.pow(l, 0) * 10; tot += b; if (l >= 380 && l <= 750) vis += b; }
      return [
        { label: '봉우리 파장 λ_max', value: lm, unit: 'nm', color: C.lmax, dec: 0 },
        { label: '분광형', value: cls[1] + '형', color: rgb(bbRGB(p.T)) },
        { label: '색', value: cls[2], wide: true, color: rgb(bbRGB(p.T)) },
        { label: '봉우리가 있는 영역', wide: true, color: lm < 380 ? '#a78bfa' : (lm > 750 ? '#fb7185' : '#34d399'),
          value: lm < 380 ? '자외선 — 눈에 보이는 빛은 꼬리뿐' : (lm > 750 ? '적외선 — 대부분의 에너지가 눈에 안 보인다' : '가시광선 안') },
        { label: '표면 플럭스 σT⁴', value: F / 1e6, unit: 'MW/m²', color: C.F, dec: 2 },
        { label: '광도 L', value: L, unit: 'L☉', color: C.L, dec: L > 100 ? 0 : (L > 1 ? 2 : 5) },
        { label: '태양의 몇 배로 밝은가', wide: true, color: C.L,
          value: L >= 1 ? fmt(L, L > 100 ? 0 : 1) + ' 배' : '1/' + fmt(1 / L, 0) + ' 배' },
        { label: '가시광선이 차지하는 비율', value: vis / tot * 100, unit: '%', dec: 1, color: '#fbbf24' },
        { label: '관측 중인 파장', value: scanLam(st), unit: 'nm', color: C.lam, dec: 0 }
      ];
    },

    notes: [
      '<b>색만 보면 온도를 알 수 있습니다.</b> 뜨거울수록 파랗고 차가울수록 붉습니다 — 흔히 "빨강=뜨겁다"고 생각하지만 별에서는 정반대입니다. 가스레인지 불꽃도, 용광로 쇳물도 똑같습니다.',
      '<b>온도가 2배면 밝기는 16배</b>입니다(σT⁴). 그래서 표면적이 같아도 뜨거운 별은 비교가 안 되게 밝고, 반대로 붉은 별이 밝아 보인다면 <b>엄청나게 클 수밖에</b> 없습니다 — 베텔게우스가 그렇습니다.',
      '분광형 <b>O B A F G K M</b>은 뜨거운 것부터 차가운 순서입니다. 처음에 수소선의 세기순으로 A, B, C… 라고 붙였다가 나중에 온도순으로 재배열하면서 순서가 뒤죽박죽이 됐습니다.',
      '태양의 봉우리는 500 nm 근처 — <b>우리 눈이 가장 민감한 파장</b>입니다. 우연이 아니라, 눈이 태양빛에 맞춰 진화한 결과입니다.',
      '같은 흑체복사 법칙이 <b>우주 배경복사</b>에도 적용됩니다. 온도 2.725 K의 완벽한 흑체이고, 봉우리는 약 1 mm(마이크로파)에 있습니다 — 빅뱅의 잔열입니다.'
    ],
    presets: [
      { name: '태양 (G형)', set: { T: 5772, lgR: 0 } },
      { name: '시리우스 A (A형 흰 별)', set: { T: 9940, lgR: .24 } },
      { name: '베텔게우스 (M형 적색초거성, 764 R☉)', set: { T: 3600, lgR: 2.88 } },
      { name: '안타레스 (M형 적색초거성)', set: { T: 3660, lgR: 2.83 } },
      { name: '리겔 (B형 청색초거성)', set: { T: 12100, lgR: 1.89 } },
      { name: '프록시마 (M형 적색왜성)', set: { T: 3042, lgR: -.81 } },
      { name: '시리우스 B (백색왜성)', set: { T: 25000, lgR: -2.08 } }
    ],
    challenges: [
      {
        id: 'sun', title: '태양과 같은 색 만들기',
        desc: '봉우리 파장을 가시광선 한가운데(480~520 nm)에 맞춰 보세요 — 우리 눈이 가장 잘 보는 색입니다.',
        hint: 'λ_max = 2.898×10⁶ / T 이므로 T ≈ 5,800 K 근처입니다.',
        check: ({ P }) => { const l = lamMax(P.T); return l >= 480 && l <= 520; }
      },
      {
        id: 'giant', title: '붉으면서 밝은 별 만들기',
        desc: '표면 온도는 4,000 K 이하로 차가우면서 광도는 태양의 10,000배가 넘는 별을 만들어 보세요 — 이런 별은 어떤 모습일 수밖에 없을까요?',
        hint: '차가운데 밝으려면 어마어마하게 클 수밖에 없습니다 — 반지름이 200 R☉은 넘어야 합니다. 적색초거성이 바로 이것입니다.',
        check: ({ P }) => P.T <= 4000 && lumOf(P) >= 1e4
      },
      {
        id: 'uv', title: '눈에 거의 안 보이는 별',
        desc: '봉우리를 자외선(380 nm 미만)으로 밀어내, 내는 에너지의 대부분을 눈으로 볼 수 없는 별을 만들어 보세요.',
        hint: '온도를 7,600 K 이상으로 올리면 봉우리가 가시광선 밖으로 나갑니다. O형 별은 에너지의 대부분을 자외선으로 냅니다.',
        check: ({ P }) => lamMax(P.T) < 380
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const col = bbRGB(p.T), lm = lamMax(p.T), cls = classOf(p.T), L = lumOf(p);
      const now = scanLam(st);

      /* ── 별 ── */
      const sx = 92, sy = h * .30;
      const rad = clamp(14 + p.lgR * 12 + 30, 5, 60);
      ctx.save();
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad * 2.6);
      g.addColorStop(0, rgb(col, .95)); g.addColorStop(.35, rgb(col, .5)); g.addColorStop(1, rgb(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, rad * 2.6, 0, 7); ctx.fill();
      if (hl === 'T' || hl === 'R') { ctx.shadowColor = rgb(col); ctx.shadowBlur = 26; }
      ctx.fillStyle = rgb(col); ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 7); ctx.fill();
      ctx.restore();
      D.text(ctx, cls[1] + '형  ' + fmt(p.T, 0) + ' K', sx, sy + rad + 24, { size: 12, color: rgb(col), align: 'center', bold: true });
      const RR = radOf(p);
      D.text(ctx, 'R = ' + (RR >= 1 ? fmt(RR, RR > 100 ? 0 : 2) : RR.toExponential(2)) + ' R☉', sx, sy + rad + 40,
        { size: 10.5, color: hl === 'lgR' ? '#fff' : C.R, align: 'center', bold: hl === 'lgR' });
      // 태양 크기 비교 원
      const rsun = clamp(14 + 30, 5, 60);
      D.line(ctx, sx - rsun, sy + rad + 56, sx + rsun, sy + rad + 56, { color: 'rgba(251,191,36,.5)', width: 2 });
      D.text(ctx, '태양 크기', sx, sy + rad + 70, { size: 9, color: 'rgba(251,191,36,.7)', align: 'center' });

      /* ── 분광기: 프리즘 + 스펙트럼 띠 ── */
      const px = sx + rad + 46;
      D.poly(ctx, [[px, sy - 18], [px + 26, sy], [px, sy + 18]], { fill: 'rgba(200,211,239,.18)', stroke: 'rgba(200,211,239,.5)', width: 1.5 });
      D.line(ctx, sx + rad, sy, px, sy, { color: rgb(col, .8), width: 3 });

      /* ── 스펙트럼 곡선 ── */
      const gx = px + 52, gy = 56;
      const gw = Math.max(170, w - gx - 44), gh = Math.min(h * .46, 210);
      const GX = l => gx + clamp((l - LAM0) / (LAM1 - LAM0), 0, 1) * gw;
      const GY = v => gy + gh - clamp(v, 0, 1.08) * gh;

      // 가시광선 띠
      for (let l = 380; l <= 750; l += 4) {
        const c2 = visRGB(l);
        ctx.fillStyle = 'rgba(' + c2[0] + ',' + c2[1] + ',' + c2[2] + ',.14)';
        ctx.fillRect(GX(l), gy, Math.max(1, GX(l + 4) - GX(l)) + .5, gh);
      }
      D.text(ctx, '가시광선', GX(565), gy + gh + 15, { size: 9, color: '#93a2c4', align: 'center' });
      D.text(ctx, '자외선', GX(LAM0) + 3, gy + gh + 15, { size: 9, color: '#a78bfa' });
      D.text(ctx, '적외선 →', GX(LAM1) - 3, gy + gh + 15, { size: 9, color: '#fb7185', align: 'right' });
      D.roundRect(ctx, gx, gy, gw, gh, 5);
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.stroke();

      // 태양 기준 곡선
      ctx.save(); ctx.strokeStyle = 'rgba(147,162,196,.45)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) { const l = LAM0 + (LAM1 - LAM0) * i / 160; const X = GX(l), Y = GY(planck(l, TSUN)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.restore();

      // 이 별의 곡선 — 스캔한 데까지만 진하게
      ctx.save();
      if (hl === 'T') { ctx.shadowColor = rgb(col); ctx.shadowBlur = 14; }
      ctx.strokeStyle = rgb(col); ctx.lineWidth = 2.4; ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const l = LAM0 + (LAM1 - LAM0) * i / 200;
        if (l > now) break;
        const X = GX(l), Y = GY(planck(l, p.T)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
      ctx.globalAlpha = .22; ctx.setLineDash([3, 3]); ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const l = LAM0 + (LAM1 - LAM0) * i / 200; const X = GX(l), Y = GY(planck(l, p.T)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.restore();

      // λ_max
      if (lm >= LAM0 && lm <= LAM1) {
        D.line(ctx, GX(lm), gy, GX(lm), gy + gh, { color: C.lmax, width: 2, hot: hl === 'lmax' });
        D.text(ctx, 'λ_max ' + fmt(lm, 0) + ' nm', GX(lm) + 5, gy + 14,
          { size: 10.5, color: hl === 'lmax' ? '#fff' : C.lmax, bold: true });
      } else {
        D.text(ctx, '봉우리가 화면 ' + (lm < LAM0 ? '왼쪽(자외선)' : '오른쪽(적외선)') + ' 밖에 있습니다',
          gx + 6, gy + 14, { size: 10, color: C.lmax });
      }
      // 분광기 현재 위치
      D.line(ctx, GX(now), gy - 6, GX(now), gy + gh + 4, { color: C.lam, width: 1.8, hot: hl === 'lam' });
      D.dot(ctx, GX(now), GY(planck(now, p.T)), 4, C.lam, true);
      D.text(ctx, fmt(now, 0) + ' nm', GX(now), gy - 10, { size: 9.5, color: C.lam, align: 'center' });

      /* ── 분광형 띠 ── */
      const bx = 44, by = h - 74, bw = Math.min(w - 88, 520);
      D.text(ctx, '분광형 — 뜨거운 쪽에서 차가운 쪽으로', bx, by - 9, { size: 10.5, color: '#61719a' });
      const TLO = Math.log10(2500), THI = Math.log10(40000);
      const BX = T => bx + bw * (1 - (Math.log10(clamp(T, 2500, 40000)) - TLO) / (THI - TLO));
      for (let i = 0; i <= 90; i++) {
        const T2 = Math.pow(10, THI - (THI - TLO) * i / 90);
        ctx.fillStyle = rgb(bbRGB(T2), .85);
        ctx.fillRect(bx + bw * i / 90, by, bw / 90 + 1, 16);
      }
      ['O', 'B', 'A', 'F', 'G', 'K', 'M'].forEach((nm, i) => {
        const edges = [30000, 10000, 7500, 6000, 5200, 3700, 2500];
        const lo = i === 0 ? 40000 : edges[i - 1], hi2 = edges[i];
        D.text(ctx, nm, (BX(lo) + BX(hi2)) / 2, by + 29, { size: 10.5, color: '#93a2c4', align: 'center', bold: true });
        if (i) D.line(ctx, BX(lo), by, BX(lo), by + 16, { color: 'rgba(10,17,32,.7)', width: 1.5 });
      });
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      D.line(ctx, BX(p.T), by - 7, BX(p.T), by + 23, { color: '#fff', width: 2.4 }); ctx.restore();
      D.text(ctx, '40000 K', bx, by + 44, { size: 9, color: '#4b5a80' });
      D.text(ctx, '2500 K', bx + bw, by + 44, { size: 9, color: '#4b5a80', align: 'right' });

      /* ── 광도 요약 ── */
      D.text(ctx, 'L = ' + (L >= 1 ? fmt(L, L > 100 ? 0 : 2) : L.toExponential(1)) + ' L☉',
        Math.min(w - 44, bx + bw + 24), by + 6, { size: 12.5, color: hl === 'L' ? '#fff' : C.L, bold: true, align: 'right' });
    }
  });
})();
