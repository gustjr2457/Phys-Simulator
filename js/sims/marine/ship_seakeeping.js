/* [선박공학·내항성] 파랑 중 선체 운동 — ω_e = ω − (ω²/g)·V·cos μ
   같은 파도라도 배가 어느 방향으로 얼마나 빨리 달리느냐에 따라 '만나는 주기'가
   달라진다. 그 조우 주기가 선체의 고유 횡요·상하동요 주기와 맞아떨어지면 공진이
   일어나 배가 심하게 흔들린다. 선장이 폭풍 속에서 하는 일이 바로 이것 —
   속도를 줄이거나 침로를 바꿔 조우 주기를 공진에서 떨어뜨리는 것이다.
   자율운항 시스템이 스스로 판단해야 하는 핵심 결정이기도 하다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Hs: '#60a5fa', Tw: '#5eead4', V: '#fb7185', mu: '#a78bfa',
              lam: '#fbbf24', Te: '#f472b6', rao: '#fb923c' };
  const G = 9.81, KN = .5144, LSHIP = 150, TDRAFT = 8, ZETA = .18;

  const omOf = p => 2 * Math.PI / p.Tw;                        // 파랑 각진동수
  const kOf = p => omOf(p) * omOf(p) / G;                      // 파수 (심해파)
  const lamOf = p => 2 * Math.PI / kOf(p);                     // 파장
  const omE = p => omOf(p) - kOf(p) * p.V * KN * Math.cos(p.mu * Math.PI / 180);
  const Te = p => 2 * Math.PI / Math.max(Math.abs(omE(p)), 1e-6);
  const omN = () => 2 * Math.PI / (2 * Math.PI * Math.sqrt(2.25 * TDRAFT / G));  // 상하동요 고유 각진동수 (T_n ≈ 8.5 s)
  const Tn = () => 2 * Math.PI / omN();
  // 파장이 선체보다 짧으면 들어 올리지 못한다
  const excit = p => Math.exp(-1.2 * Math.pow(LSHIP / lamOf(p), 1.6));
  function raoOf(p) {
    const r = Math.abs(omE(p)) / omN();
    return excit(p) / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * ZETA * r, 2));
  }
  const heaveA = p => raoOf(p) * p.Hs / 2;                     // 상하동요 진폭 [m]
  const pitchA = p => {                                        // 종동요 각 [deg] — 파경사에 비례
    const slope = Math.atan(kOf(p) * p.Hs / 2) * 180 / Math.PI;
    const r = Math.abs(omE(p)) / (omN() * 1.08);
    return slope * excit(p) / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * ZETA * r, 2));
  };
  const bowAcc = p => heaveA(p) * Math.pow(Math.abs(omE(p)), 2) / G;   // 선수 수직가속도 [g]

  PS.register({
    id: 'ship-seakeeping', mode: 'marine', category: '내항성',
    title: '파랑 중 선체 운동',
    sub: 'ω_e = ω − (ω²/g)V cos μ',
    tagline: '같은 파도라도 배가 어디로 얼마나 빨리 달리느냐에 따라 "만나는 주기"가 달라집니다. 그게 선체의 고유 주기와 맞으면 공진 — 선장이 감속하거나 침로를 바꾸는 이유입니다.',

    params: [
      { key: 'Hs', symbol: 'H', label: '파고', unit: 'm', min: .5, max: 12, step: .5, value: 4, color: C.Hs, dec: 1,
        where: '파도의 <b>마루에서 골까지 높이</b>입니다. 선체 운동의 크기에 정비례할 뿐, 공진이 일어나는지 여부에는 영향을 주지 않습니다.' },
      { key: 'Tw', symbol: 'T', label: '파주기', unit: 's', min: 4, max: 18, step: .5, value: 9, color: C.Tw, dec: 1, reset: true,
        where: '파도의 <b>주기</b>입니다. 파장 λ = gT²/2π 를 정하고, 조우 주기의 바탕이 됩니다 — 너울(긴 주기)일수록 파장이 길어 배를 통째로 들어 올립니다.' },
      { key: 'V', symbol: 'V', label: '선속', unit: 'kn', min: 0, max: 26, step: .5, value: 16, color: C.V, dec: 1,
        where: '배의 <b>속력</b>입니다. 파도 쪽으로 달리면 더 자주 만나고(조우 주기 ↓), 파도와 같은 방향으로 달리면 덜 만납니다. <b>감속이 공진을 피하는 첫 번째 수단</b>입니다.' },
      { key: 'mu', symbol: 'μ', label: '조우각', unit: '°', min: 0, max: 180, step: 5, value: 180, color: C.mu, dec: 0,
        where: '파도가 오는 방향과 뱃머리가 이루는 각입니다. <b>180° = 선수파</b>(정면으로 받음), 90° = 횡파, <b>0° = 추파</b>(뒤에서 따라옴). 침로 변경이 두 번째 수단입니다.' }
    ],
    vars: {
      lam: { symbol: 'λ', label: '파장', unit: 'm', color: C.lam,
        where: '파도 마루 사이의 <b>거리</b>입니다. 선체 길이(150 m)와 비슷하거나 길어야 배가 제대로 들립니다 — 짧은 파도는 선체가 평균해 버립니다.' },
      Te: { symbol: 'T_e', label: '조우 주기', unit: 's', color: C.Te,
        where: '배가 <b>파도를 만나는 주기</b>입니다. 이 값이 고유 주기와 가까워지면 공진입니다 — 속도와 침로로 바꿀 수 있는 유일한 값입니다.' },
      rao: { symbol: 'RAO', label: '응답 배율', unit: '', color: C.rao,
        where: '파고 대비 <b>배가 얼마나 더 크게 흔들리는가</b>입니다. 1보다 크면 파도보다 심하게 움직이고, 공진에서 봉우리가 생깁니다.' }
    },
    formulas: [
      { name: '심해파의 파장', tpl: '{lam} = g{Tw}² ⁄ 2π' },
      { name: '조우 각진동수', tpl: 'ω_e = ω − (ω²⁄g)·{V}·cos{mu}' },
      { name: '응답 배율 (공진 곡선)', tpl: '{rao} = F ⁄ √((1−r²)² + (2ζr)²),  r = ω_e⁄ω_n' },
      { name: '공진 조건', tpl: '{Te} ≈ T_n  (고유 주기)' }
    ],

    init(p) { return { ph: 0, done: false }; },
    step(st, p, dt) { st.ph += 2 * Math.PI / Math.max(Te(p), .5) * dt * 2.2; },

    graphs: [{
      title: '상하동요 응답 곡선 (조우 주기에 대하여)', xKey: 'tx', xUnit: 's', xMin: 2, xMax: 20, y0: 0,
      series: [{ key: 'ra', label: 'RAO', color: C.rao }]
    }],
    sample(st, p) {
      const tx = 2 + ((st.t * 3.2) % 18);
      const we = 2 * Math.PI / tx, r = we / omN();
      return { tx: tx, ra: excit(p) / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * ZETA * r, 2)) };
    },

    readouts(st, p) {
      const lam = lamOf(p), te = Te(p), tn = Tn(), rao = raoOf(p);
      const ratio = te / tn;
      const res = Math.abs(ratio - 1) < .18;
      const ha = heaveA(p), pa = pitchA(p), ba = bowAcc(p);
      const following = omE(p) < 0;
      return [
        { label: '파장 λ', value: lam, unit: 'm', color: C.lam, dec: 1 },
        { label: 'λ / 선체 길이 (150 m)', value: lam / LSHIP, unit: '', color: C.lam, dec: 2 },
        { label: '파주기 T', value: p.Tw, unit: 's', color: C.Tw, dec: 1 },
        { label: '조우 주기 T_e', value: te, unit: 's', color: C.Te, dec: 2 },
        { label: '선체 고유 주기 T_n', value: tn, unit: 's', dec: 2, color: '#34d399' },
        { label: 'T_e / T_n', value: ratio, unit: '', dec: 2, color: res ? '#fb7185' : '#34d399' },
        { label: '응답 배율 RAO', value: rao, unit: '', color: C.rao, dec: 2 },
        { label: '상하동요 진폭', value: ha, unit: 'm', color: C.Hs, dec: 2 },
        { label: '종동요 각', value: pa, unit: '°', dec: 2, color: C.mu },
        { label: '선수 수직가속도', value: ba, unit: 'g', dec: 3,
          color: ba > .4 ? '#fb7185' : (ba > .2 ? '#fbbf24' : '#34d399') },
        { label: '추파 상태', wide: true, color: following ? '#fbbf24' : '#93a2c4',
          value: following ? '파도가 배를 추월한다 (추파) — 조타가 불안정해질 수 있다' : '배가 파도를 만나러 간다' },
        { label: '운동 상태', wide: true, color: res ? '#fb7185' : (rao > .8 ? '#fbbf24' : '#34d399'),
          value: res ? '공진! 조우 주기가 고유 주기와 맞았다 — 가장 위험한 상태' :
                 (rao > .8 ? '크게 흔들림' : (rao > .3 ? '보통' : '안정 — 파도를 거의 안 탄다')) },
        { label: '운항 권고', wide: true, color: res ? '#fb7185' : '#34d399',
          value: res ? (p.V > 4 ? '감속하거나 침로를 바꿔 조우 주기를 벗어나세요' : '침로를 바꿔 조우각을 조절하세요') :
                 (ba > .4 ? '선수 충격(슬래밍) 위험 — 감속 권고' : '현재 침로·속도 유지 가능') }
      ];
    },

    notes: [
      '<b>조우 주기가 전부입니다.</b> 파도의 주기는 바다가 정하지만, 배가 파도를 <b>만나는</b> 주기는 속도와 침로로 바꿀 수 있습니다 — 선장이 폭풍 속에서 쓸 수 있는 유일한 두 손잡이입니다.',
      '<b>선수파(μ = 180°)에서는 조우 주기가 짧아집니다.</b> 파도를 마주 보고 달리니 더 자주 만나기 때문입니다. 반대로 추파(μ = 0°)에서 배가 파도보다 빠르면 조우 주기가 길어지고, 파도 속도와 같아지면 배가 파도 위에 "얹혀" 조타가 불안정해집니다.',
      '<b>짧은 파도는 배를 못 들어 올립니다.</b> 파장이 선체 길이보다 훨씬 짧으면 마루와 골이 선체 아래에 여러 개 동시에 있어서 서로 상쇄됩니다 — 큰 배가 작은 배보다 편안한 이유입니다. 반대로 λ ≈ L일 때가 가장 심하게 흔들립니다.',
      '<b>파고는 공진 여부를 바꾸지 않습니다.</b> 흔들림의 크기만 비례해서 키울 뿐입니다 — 공진인지 아닌지는 주기만의 문제입니다. 그래서 잔잔해 보이는 긴 너울이 오히려 위험할 수 있습니다.',
      '<b>선수 수직가속도</b>가 0.4 g를 넘으면 선수가 물에 내리꽂히는 <b>슬래밍</b>이 일어나 선체에 충격 하중이 걸리고, 화물 고박이 풀리며, 승객이 다칩니다. 감속이 가장 직접적인 대응입니다.',
      '자율운항 선박은 기상 예보와 이 계산을 실시간으로 돌려 <b>항로와 속도를 스스로 최적화</b>합니다(weather routing) — 연료를 아끼면서 공진과 슬래밍을 피하는 것이 목표입니다.',
      '※ 선체 길이 150 m, 흘수 8 m로 고정한 교육용 1자유도 모델입니다. 실제 설계는 6자유도 수치해석(seakeeping analysis)을 씁니다.'
    ],
    presets: [
      { name: '선수파 순항', set: { Hs: 4, Tw: 9, V: 16, mu: 180 } },
      { name: '공진 (가장 위험)', set: { Hs: 4, Tw: 13, V: 26, mu: 145 } },
      { name: '감속으로 공진 회피', set: { Hs: 4, Tw: 13, V: 4, mu: 145 } },
      { name: '침로 변경으로 회피', set: { Hs: 4, Tw: 13, V: 26, mu: 60 } },
      { name: '짧은 파도 — 거의 안 흔들림', set: { Hs: 4, Tw: 5, V: 16, mu: 180 } },
      { name: '긴 너울 — 통째로 들린다', set: { Hs: 4, Tw: 16, V: 10, mu: 180 } },
      { name: '추파 (뒤에서 따라오는 파도)', set: { Hs: 5, Tw: 10, V: 20, mu: 0 } }
    ],
    challenges: [
      {
        id: 'res', title: '공진 상태 만들기',
        desc: '조우 주기를 선체 고유 주기에 맞춰 응답 배율(RAO)을 1.5 이상으로 만들어 보세요.',
        hint: '측정값 칸의 T_e / T_n 을 1.0 근처로. 파주기와 속도를 함께 조절하세요.',
        check: ({ P }) => raoOf(P) >= 1.5
      },
      {
        id: 'slow', title: '감속으로 공진 벗어나기',
        desc: '공진을 만든 조건에서 속도만 줄여 RAO를 0.6 이하로 떨어뜨려 보세요 — 선장이 쓰는 첫 번째 수단입니다.',
        hint: '파주기는 그대로 두고 속도 슬라이더만 내리세요. 조우 주기가 바뀌면서 공진에서 벗어납니다.',
        check: ({ P }) => P.V <= 6 && raoOf(P) <= .6
      },
      {
        id: 'course', title: '침로 변경으로 벗어나기',
        desc: '속도 12 kn 이상을 유지하면서 조우각만 바꿔 RAO를 0.6 이하로 만들어 보세요 — 속도를 잃지 않는 방법입니다.',
        hint: 'cos μ 가 조우 주기를 바꿉니다. μ를 90° 근처(횡파)나 작은 값(추파)으로 돌려 보세요.',
        check: ({ P }) => P.V >= 12 && raoOf(P) <= .6
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const lam = lamOf(p), te = Te(p), tn = Tn(), rao = raoOf(p);
      const ha = heaveA(p), pa = pitchA(p);
      const res = Math.abs(te / tn - 1) < .18;

      /* ── 파도 + 배 (측면) ── */
      const sea = h * .30;
      const PXM = Math.min((w - 120) / 400, 1.5);              // 1 m → px
      const lamPx = Math.max(lam * PXM, 20);
      const A = p.Hs / 2 * PXM;
      const wave = x => -A * Math.cos(2 * Math.PI * (x - w * .35) / lamPx + st.ph);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) ctx.lineTo(x, sea + wave(x));
      ctx.lineTo(w, h); ctx.closePath();
      const wg = ctx.createLinearGradient(0, sea - A, 0, h);
      wg.addColorStop(0, 'rgba(37,99,164,.32)'); wg.addColorStop(1, 'rgba(10,30,62,.12)');
      ctx.fillStyle = wg; ctx.fill();
      ctx.strokeStyle = hl === 'Hs' || hl === 'lam' ? 'rgba(125,190,255,1)' : 'rgba(125,190,255,.6)';
      ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      D.dim(ctx, w * .35, sea - A - 22, w * .35 + lamPx, sea - A - 22,
        'λ = ' + fmt(lam, 0) + ' m', C.lam, hl === 'lam');

      // 배
      const shipX = w * .35, Lpx = LSHIP * PXM;
      const heave = -ha * PXM * Math.cos(st.ph);
      const pitch = pa * Math.PI / 180 * Math.cos(st.ph + Math.PI / 2);
      ctx.save();
      ctx.translate(shipX, sea + heave); ctx.rotate(-pitch);
      const dpx = clamp(TDRAFT * PXM * 1.2, 6, 22), deck = dpx * .8;
      D.poly(ctx, [[-Lpx / 2, -deck], [Lpx * .42, -deck - 3], [Lpx / 2, -deck + 2],
                   [Lpx / 2, dpx * .3], [Lpx * .38, dpx], [-Lpx * .44, dpx], [-Lpx / 2, dpx * .4]],
        { fill: 'rgba(200,211,239,.3)', stroke: res ? '#fb7185' : '#c8d3ef', width: 2 });
      D.roundRect(ctx, -Lpx * .40, -deck - 16, Lpx * .16, 16, 2);
      ctx.fillStyle = 'rgba(200,211,239,.45)'; ctx.fill();
      ctx.restore();
      // 상하동요 치수선
      D.line(ctx, shipX + Lpx * .6, sea, shipX + Lpx * .6 + 26, sea, { color: 'rgba(147,162,196,.35)', dash: [3, 4] });
      D.dim(ctx, shipX + Lpx * .6 + 14, sea - ha * PXM, shipX + Lpx * .6 + 14, sea + ha * PXM,
        '±' + fmt(ha, 2) + ' m', C.Hs, hl === 'rao');
      D.text(ctx, '종동요 ±' + fmt(pa, 2) + '°', shipX, sea - deck - 40,
        { size: 10.5, color: hl === 'mu' ? '#fff' : C.mu, align: 'center' });
      D.tag(ctx, res ? '공진! RAO = ' + fmt(rao, 2) : 'RAO = ' + fmt(rao, 2),
        shipX, sea + dpx + 34, res ? '#fb7185' : (rao > .8 ? '#fbbf24' : '#34d399'), true);

      /* ── 조우각 다이어그램 ── */
      const cx = w * .17, cy = h * .66, cr = Math.min(w * .11, h * .16);
      D.text(ctx, '조우각 μ', cx, cy - cr - 16, { size: 10.5, color: '#61719a', align: 'center' });
      ctx.save(); ctx.strokeStyle = 'rgba(147,162,196,.3)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 7); ctx.stroke(); ctx.restore();
      // 배 (위에서 본 모습, 위쪽이 선수)
      D.poly(ctx, [[cx, cy - cr * .5], [cx + cr * .16, cy], [cx + cr * .13, cy + cr * .45],
                   [cx - cr * .13, cy + cr * .45], [cx - cr * .16, cy]],
        { fill: 'rgba(200,211,239,.45)', stroke: '#c8d3ef', width: 1.5 });
      // 파도 오는 방향
      const ma = (180 - p.mu) * Math.PI / 180;
      const wx = cx + Math.sin(ma) * cr, wy = cy - Math.cos(ma) * cr;
      ctx.save(); if (hl === 'mu') { ctx.shadowColor = C.mu; ctx.shadowBlur = 14; }
      D.arrow(ctx, wx * 1.0 + (cx - wx) * -.35, wy + (cy - wy) * -.35,
        (cx - wx) * .95, (cy - wy) * .95, { color: C.mu, width: 2.6, head: 8 });
      ctx.restore();
      D.text(ctx, p.mu >= 135 ? '선수파' : (p.mu >= 45 ? '횡파' : '추파'), cx, cy + cr + 20,
        { size: 11, color: C.mu, align: 'center', bold: true });
      D.text(ctx, fmt(p.mu, 0) + '°', cx, cy + cr + 36, { size: 10, color: '#93a2c4', align: 'center' });

      /* ── 응답 곡선 ── */
      const gx = cx + cr + 60, gy = h * .52;
      const gw = Math.min(w - gx - 44, 320), gh = Math.min(h * .34, 150);
      if (gw > 160) {
        D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
        D.text(ctx, '응답 곡선 — 고유 주기에서 봉우리', gx + 4, gy - 8, { size: 10.5, color: '#61719a' });
        const TLO = 2, THI = 20;
        const GX = t => gx + gw * clamp((t - TLO) / (THI - TLO), 0, 1);
        let rmax = 0;
        for (let t = TLO; t <= THI; t += .2) {
          const we = 2 * Math.PI / t, r = we / omN();
          rmax = Math.max(rmax, excit(p) / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * ZETA * r, 2)));
        }
        rmax = Math.max(rmax, 1.2);
        const GY = v => gy + gh - clamp(v / rmax, 0, 1) * (gh - 6) - 3;
        // 공진 영역 음영
        ctx.save(); ctx.fillStyle = 'rgba(251,113,133,.10)';
        ctx.fillRect(GX(tn * .82), gy, GX(tn * 1.18) - GX(tn * .82), gh); ctx.restore();
        ctx.save(); ctx.strokeStyle = C.rao; ctx.lineWidth = 2.2;
        if (hl === 'rao') { ctx.shadowColor = C.rao; ctx.shadowBlur = 12; }
        ctx.beginPath();
        for (let t = TLO; t <= THI; t += .15) {
          const we = 2 * Math.PI / t, r = we / omN();
          const v = excit(p) / Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * ZETA * r, 2));
          const X = GX(t), Y = GY(v); t === TLO ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
        }
        ctx.stroke(); ctx.restore();
        D.line(ctx, GX(tn), gy, GX(tn), gy + gh, { color: '#34d399', dash: [4, 4], width: 1.8 });
        D.text(ctx, '고유 ' + fmt(tn, 1) + 's', GX(tn) + 4, gy + 14, { size: 9.5, color: '#34d399' });
        D.line(ctx, GX(1), gy + gh - (gh - 6) / rmax - 3, GX(THI), gy + gh - (gh - 6) / rmax - 3,
          { color: 'rgba(147,162,196,.3)', dash: [2, 4] });
        ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
        D.dot(ctx, GX(te), GY(rao), 5.5, res ? '#fb7185' : C.rao, true); ctx.restore();
        D.text(ctx, 'T_e = ' + fmt(te, 2) + ' s', GX(te), gy + gh + 15,
          { size: 10, color: hl === 'Te' ? '#fff' : C.Te, align: 'center', bold: true });
        D.text(ctx, '조우 주기 (s) →', gx + gw, gy - 8, { size: 9, color: '#61719a', align: 'right' });
      }

      /* ── 요약 ── */
      D.text(ctx, 'T_e / T_n = ' + fmt(te / tn, 2) + (res ? '  → 공진!' : '  → 안전 범위'),
        48, h - 16, { size: 12, color: res ? '#fb7185' : '#34d399', bold: true });
    }
  });
})();
