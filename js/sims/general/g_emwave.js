/* [일반물리·전자기학] 전자기파 — c = 1/√(ε₀μ₀),  E/B = c
   맥스웰이 자기 방정식을 정리하다가 파동 방정식이 튀어나왔고, 그 파동의 속력을
   계산해 보니 당시 측정된 빛의 속력과 같았다. "빛은 전자기파다"라는 결론이
   실험이 아니라 계산에서 먼저 나온 것이다. 변하는 전기장이 자기장을 만들고
   그 자기장이 다시 전기장을 만들며, 서로를 밀어 주듯 매질 없이도 영원히 나아간다.
   전파도 빛도 X선도 전부 같은 파동이고, 진동수만 다르다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { lgf: '#fbbf24', E0: '#fb7185', E: '#fb7185', B: '#5eead4',
              lam: '#a78bfa', ph: '#60a5fa', S: '#fb923c' };
  const Cc = 2.99792458e8, EPS0 = 8.8541878e-12, HEV = 4.135667696e-15;

  const fOf = p => Math.pow(10, p.lgf);
  const lamOf = p => Cc / fOf(p);
  const b0Of = p => p.E0 / Cc;
  const photonEV = p => HEV * fOf(p);
  const intensity = p => .5 * EPS0 * Cc * p.E0 * p.E0;             // W/m²

  const BANDS = [
    [0, 3e9, '전파', '#60a5fa', '방송·통신·전파망원경 — 대기를 그대로 통과'],
    [3e9, 3e11, '마이크로파', '#5eead4', '레이더·전자레인지·위성통신 — 물 분자를 흔든다'],
    [3e11, 4.3e14, '적외선', '#fb7185', '열복사 — 모든 따뜻한 물체가 낸다'],
    [4.3e14, 7.5e14, '가시광선', '#fbbf24', '눈이 보는 아주 좁은 창 — 대기가 열려 있는 구간'],
    [7.5e14, 3e16, '자외선', '#a78bfa', '피부를 태운다 — 오존층이 대부분 막아 준다'],
    [3e16, 3e19, 'X선', '#c084fc', '몸을 통과한다 — 대기가 막아 우주에서만 관측'],
    [3e19, 1e25, '감마선', '#f472b6', '원자핵에서 나온다 — 가장 높은 에너지']
  ];
  const bandOf = f => BANDS.find(b => f >= b[0] && f < b[1]) || BANDS[BANDS.length - 1];

  PS.register({
    id: 'g-emwave', mode: 'general', category: '전자기학',
    title: '전자기파',
    sub: 'c = 1/√(ε₀μ₀)',
    tagline: '맥스웰이 식을 정리하다 파동이 튀어나왔고, 그 속력이 빛의 속력과 같았습니다. "빛은 전자기파다"가 실험이 아니라 계산에서 먼저 나온 결론입니다.',

    params: [
      { key: 'lgf', symbol: 'f', label: '진동수 (10^x Hz)', unit: '', min: 4, max: 21, step: .05, value: 14.74, color: C.lgf, dec: 2, reset: true,
        where: '전자기파의 <b>진동수</b>(로그 눈금)입니다. 이 값 하나가 파장·광자 에너지·스펙트럼 영역을 전부 결정합니다 — 전파든 X선이든 <b>같은 파동</b>이고 이것만 다릅니다.' },
      { key: 'E0', symbol: 'E₀', label: '전기장 진폭', unit: 'V/m', min: 1, max: 1200, step: 1, value: 100, color: C.E0, dec: 0,
        where: '전기장의 <b>최대 세기</b>(빨간 화살표의 길이)입니다. 세기(W/m²)는 이 값의 제곱에 비례하고, 자기장 진폭은 자동으로 E₀/c가 됩니다. 1013 V/m이 지구에 닿는 햇빛 수준입니다.' }
    ],
    vars: {
      E: { symbol: 'E', label: '전기장', unit: 'V/m', color: C.E,
        where: '<b>빨간 화살표</b>입니다(화면 세로 방향). 전하를 흔드는 성분이라, 안테나가 실제로 받아들이는 것이 이것입니다.' },
      B: { symbol: 'B', label: '자기장', unit: 'T', color: C.B,
        where: '<b>청록 화살표</b>입니다(화면 안쪽 방향). 전기장과 <b>항상 수직이고 위상이 같으며</b>, 크기는 정확히 E/c라 숫자로는 아주 작습니다.' },
      lam: { symbol: 'λ', label: '파장', unit: 'm', color: C.lam,
        where: '마루에서 다음 마루까지의 <b>거리</b>입니다. λ = c/f 로, 진동수와 반비례합니다.' },
      ph: { symbol: 'E_γ', label: '광자 에너지', unit: 'eV', color: C.ph,
        where: '이 전자기파를 <b>알갱이로 봤을 때 한 알의 에너지</b>입니다(E = hf). 진동수에만 비례하고 밝기와는 무관하다는 것이 광전효과의 핵심이었습니다.' },
      S: { symbol: 'S', label: '세기', unit: 'W/m²', color: C.S,
        where: '단위 면적이 <b>1초에 받는 에너지</b>입니다. 전기장 진폭의 <b>제곱</b>에 비례합니다.' }
    },
    formulas: [
      { name: '빛의 속력 — 맥스웰이 계산해 낸 값', tpl: 'c = 1 ⁄ √(ε₀μ₀) = {lam}·f' },
      { name: '전기장과 자기장의 비', tpl: '{E} ⁄ {B} = c' },
      { name: '광자 한 알의 에너지', tpl: '{ph} = h·f' },
      { name: '세기 (포인팅 벡터의 평균)', tpl: '{S} = ½ε₀c{E0}²' }
    ],

    init(p) { return { ph: 0, done: false }; },
    step(st, p, dt) { st.ph += 2 * Math.PI * .55 * dt; },

    graphs: [{
      title: '한 지점에서 본 E와 B — 위상이 같다', xmin: 4, window: 6,
      series: [
        { key: 'Ey', label: 'E (V/m)', color: C.E },
        { key: 'Bz', label: 'B ×10⁹ (nT)', color: C.B }
      ]
    }],
    sample(st, p) {
      const s = Math.sin(st.t * 2 * Math.PI * .55);
      return { Ey: p.E0 * s, Bz: b0Of(p) * s * 1e9 };
    },

    readouts(st, p) {
      const f = fOf(p), lam = lamOf(p), band = bandOf(f);
      return [
        { label: '진동수 f', value: f, unit: 'Hz', color: C.lgf, dec: 0 },
        { label: '파장 λ', wide: true, color: C.lam,
          value: lam > 1 ? fmt(lam, 3) + ' m' : (lam > 1e-3 ? fmt(lam * 1e3, 3) + ' mm' :
                 (lam > 1e-6 ? fmt(lam * 1e6, 3) + ' µm' : (lam > 1e-9 ? fmt(lam * 1e9, 3) + ' nm' : fmt(lam * 1e12, 3) + ' pm'))) },
        { label: '스펙트럼 영역', value: band[2], wide: true, color: band[3] },
        { label: '쓰임새', value: band[4], wide: true, color: band[3] },
        { label: '광자 에너지', value: photonEV(p), unit: 'eV', color: C.ph, dec: photonEV(p) < 1 ? 6 : 2 },
        { label: '전기장 진폭 E₀', value: p.E0, unit: 'V/m', color: C.E, dec: 0 },
        { label: '자기장 진폭 B₀ = E₀/c', value: b0Of(p) * 1e9, unit: 'nT', color: C.B, dec: 3 },
        { label: '세기 S', value: intensity(p), unit: 'W/m²', color: C.S, dec: 2 },
        { label: '햇빛(1361 W/m²) 대비', value: intensity(p) / 1361 * 100, unit: '%', dec: 1, color: C.S },
        { label: '1초에 지나가는 파동 수', value: f, unit: '개', dec: 0, color: '#93a2c4' },
        { label: '파장을 사람 크기와 비교하면', wide: true, color: C.lam,
          value: lam > 100 ? '건물보다 길다' : (lam > .5 ? '사람 키 정도' : (lam > 1e-3 ? '머리카락~손톱 정도' :
                 (lam > 1e-7 ? '세균~분자 크기' : '원자보다 작다'))) },
        { label: '매질이 필요한가', value: '필요 없다 — 진공에서도 전파된다 (소리와 결정적으로 다른 점)', wide: true, color: '#34d399' }
      ];
    },

    notes: [
      '<b>전자기파는 매질이 필요 없습니다.</b> 변하는 전기장이 자기장을 낳고 그 자기장이 다시 전기장을 낳으며 서로를 밀어 줍니다 — 소리처럼 흔들어 줄 무언가가 없어도 됩니다. 19세기에는 이것을 못 받아들여 "에테르"를 가정했고, 마이컬슨-몰리 실험이 그것을 부정했습니다.',
      '<b>c = 1/√(ε₀μ₀).</b> 두 상수는 각각 "전기장이 진공에서 얼마나 잘 생기는가"와 "자기장이 얼마나 잘 생기는가"를 나타내는, 전혀 빛과 상관없어 보이는 값입니다. 그 둘만으로 빛의 속력이 나온다는 것이 19세기 물리학 최대의 놀라움이었습니다.',
      '<b>E와 B는 위상이 같고 항상 수직입니다.</b> 그리고 크기 비가 정확히 c라, 자기장 성분은 숫자로 아주 작아 보입니다 — 하지만 힘을 계산해 보면 전기력과 자기력이 대등하게 기여합니다.',
      '<b>전파·빛·X선은 전부 같은 파동입니다.</b> 진동수만 10²²배 범위로 다를 뿐이고, 우리 눈이 보는 가시광선은 그중 2배도 안 되는 아주 좁은 창입니다. 그 창이 하필 거기인 이유는 — 대기가 열려 있고 태양이 가장 밝게 내는 구간이기 때문입니다.',
      '<b>세기는 진폭의 제곱, 광자 에너지는 진동수에만 비례합니다.</b> 아무리 밝은 붉은빛도 광자 하나하나는 약하고, 아주 어두운 자외선도 광자 하나는 셉니다 — 광전효과(유명한 실험 트랙)가 바로 이 구분에서 양자역학을 열었습니다.',
      '세기가 진폭의 <b>제곱</b>이라서, 전파 송신기 출력을 4배로 올려야 전기장이 2배가 됩니다. 반대로 거리가 2배 멀어지면 세기는 1/4이 됩니다(역제곱 법칙).'
    ],
    presets: [
      { name: '녹색 빛 (550 nm)', set: { lgf: 14.74, E0: 100 } },
      { name: 'FM 라디오 (100 MHz)', set: { lgf: 8, E0: 10 } },
      { name: '전자레인지 (2.45 GHz)', set: { lgf: 9.39, E0: 1200 } },
      { name: '와이파이 (5 GHz)', set: { lgf: 9.7, E0: 5 } },
      { name: '자외선 B (300 nm)', set: { lgf: 15, E0: 100 } },
      { name: '의료용 X선', set: { lgf: 18.5, E0: 100 } },
      { name: '한낮의 햇빛 세기', set: { lgf: 14.74, E0: 1013 } }
    ],
    challenges: [
      {
        id: 'visible', title: '눈에 보이는 빛 만들기',
        desc: '진동수를 가시광선 영역(4.3~7.5 ×10¹⁴ Hz)에 맞춰 보세요 — 전체 스펙트럼에서 얼마나 좁은 창인지 확인하세요.',
        hint: '로그 눈금에서 14.63 ~ 14.88 사이입니다. 슬라이더 전체 범위(4~21) 중 아주 작은 구간입니다.',
        check: ({ P }) => { const f = fOf(P); return f >= 4.3e14 && f < 7.5e14; }
      },
      {
        id: 'ionize', title: '원자를 깨뜨릴 수 있는 빛',
        desc: '광자 한 알의 에너지를 13.6 eV 이상으로 만들어 보세요 — 수소 원자에서 전자를 떼어낼 수 있는 에너지입니다.',
        hint: 'E = hf 이므로 f ≥ 3.3×10¹⁵ Hz. 자외선 영역부터 가능합니다.',
        check: ({ P }) => photonEV(P) >= 13.6
      },
      {
        id: 'sun', title: '햇빛만큼 세게',
        desc: '세기를 1,361 W/m² 이상으로 만들어 보세요 — 지구 대기 밖에서 받는 햇빛의 세기입니다.',
        hint: 'S = ½ε₀cE₀² 이므로 E₀를 1013 V/m 이상으로. 진동수는 세기와 무관합니다.',
        check: ({ P }) => intensity(P) >= 1361
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const f = fOf(p), lam = lamOf(p), band = bandOf(f);

      /* ── 전자기파 (비스듬히 본 3차원) ── */
      const x0 = 70, pw = Math.min(w - 150, 440), cy = h * .34;
      const amp = clamp(12 + p.E0 * .035, 12, 48);
      const bamp = amp * .62;                       // B는 투시로 줄여 그린다(실제 크기 비는 1/c)
      const dxz = .42, dyz = -.30;                  // z축(화면 안쪽) 투시
      const cycles = 2.6;
      const PH = u => (u * cycles * 2 * Math.PI) - st.ph;

      // 진행 축
      D.line(ctx, x0 - 20, cy, x0 + pw + 26, cy, { color: 'rgba(147,162,196,.35)', width: 1.4 });
      D.arrow(ctx, x0 + pw + 4, cy, 26, 0, { color: '#93a2c4', width: 2, head: 7 });
      D.text(ctx, '진행 방향 (속력 c)', x0 + pw + 34, cy + 4, { size: 10, color: '#93a2c4' });
      // z축 안내
      D.line(ctx, x0, cy, x0 + 44 * dxz, cy + 44 * dyz, { color: 'rgba(147,162,196,.25)', dash: [3, 3] });

      // B (뒤쪽에 먼저)
      ctx.save();
      ctx.strokeStyle = hl === 'B' ? 'rgba(94,234,212,.95)' : 'rgba(94,234,212,.55)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const u = i / 180, s = Math.sin(PH(u));
        const X = x0 + pw * u + s * bamp * dxz, Y = cy + s * bamp * dyz;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke(); ctx.restore();
      for (let i = 0; i <= 14; i++) {
        const u = i / 14, s = Math.sin(PH(u));
        if (Math.abs(s) < .12) continue;
        D.line(ctx, x0 + pw * u, cy, x0 + pw * u + s * bamp * dxz, cy + s * bamp * dyz,
          { color: hl === 'B' ? 'rgba(94,234,212,.9)' : 'rgba(94,234,212,.4)', width: 1.4 });
      }
      D.text(ctx, 'B (자기장)', x0 + 60 * dxz - 10, cy + 60 * dyz - 6,
        { size: 11, color: hl === 'B' ? '#fff' : C.B, bold: hl === 'B' });

      // E (앞쪽)
      ctx.save();
      ctx.strokeStyle = hl === 'E' || hl === 'E0' ? '#fb7185' : 'rgba(251,113,133,.8)';
      ctx.lineWidth = 2.6;
      if (hl === 'E' || hl === 'E0') { ctx.shadowColor = C.E; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const u = i / 180, s = Math.sin(PH(u));
        const X = x0 + pw * u, Y = cy - s * amp;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke(); ctx.restore();
      for (let i = 0; i <= 14; i++) {
        const u = i / 14, s = Math.sin(PH(u));
        if (Math.abs(s) < .12) continue;
        D.arrow(ctx, x0 + pw * u, cy, 0, -s * amp,
          { color: C.E, width: 1.8, head: 6, hot: hl === 'E' || hl === 'E0' });
      }
      D.text(ctx, 'E (전기장)', x0 - 16, cy - amp - 10,
        { size: 11, color: hl === 'E' || hl === 'E0' ? '#fff' : C.E, align: 'right', bold: true });
      // 파장 치수선
      const lamPx = pw / cycles;
      D.dim(ctx, x0 + 10, cy + amp + 28, x0 + 10 + lamPx, cy + amp + 28,
        'λ', C.lam, hl === 'lam');
      D.text(ctx, lam > 1 ? fmt(lam, 2) + ' m' : (lam > 1e-6 ? fmt(lam * 1e6, 2) + ' µm' :
             (lam > 1e-9 ? fmt(lam * 1e9, 2) + ' nm' : lam.toExponential(2) + ' m')),
        x0 + 10 + lamPx / 2, cy + amp + 46, { size: 10.5, color: hl === 'lam' ? '#fff' : C.lam, align: 'center' });
      D.text(ctx, 'E ⊥ B ⊥ 진행 방향   ·   위상이 같다   ·   E/B = c',
        x0, cy - amp - 32, { size: 10.5, color: '#61719a' });

      /* ── 스펙트럼 띠 ── */
      const sx = 48, sy = h - 112, sw = Math.min(w - 96, 520);
      D.text(ctx, '전자기 스펙트럼 — 전부 같은 파동, 진동수만 다르다', sx, sy - 10, { size: 10.5, color: '#61719a' });
      const LO = 4, HI = 23;
      const SX = ff => sx + sw * clamp((Math.log10(ff) - LO) / (HI - LO), 0, 1);
      BANDS.forEach((bd, i) => {
        const a = SX(Math.max(bd[0], 1e4)), b2 = SX(bd[1]);
        ctx.save();
        if (bd === band) { ctx.shadowColor = bd[3]; ctx.shadowBlur = 14; }
        ctx.fillStyle = bd[3]; ctx.globalAlpha = bd === band ? .62 : .26;
        ctx.fillRect(a, sy, Math.max(2, b2 - a), 20); ctx.restore();
        if (b2 - a > 30) D.text(ctx, bd[2], (a + b2) / 2, sy + 34,
          { size: 9, color: bd === band ? bd[3] : '#4b5a80', align: 'center', bold: bd === band });
      });
      // 가시광선 강조
      ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
      ctx.strokeRect(SX(4.3e14), sy - 2, SX(7.5e14) - SX(4.3e14), 24); ctx.restore();
      [1e6, 1e9, 1e12, 1e15, 1e18, 1e21].forEach(ff => {
        D.text(ctx, '10' + ('' + Math.round(Math.log10(ff))).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]),
          SX(ff), sy + 48, { size: 8.5, color: '#4b5a80', align: 'center' });
      });
      D.text(ctx, 'Hz', sx + sw, sy + 48, { size: 8.5, color: '#4b5a80', align: 'right' });
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      D.line(ctx, SX(f), sy - 7, SX(f), sy + 27, { color: '#fff', width: 2.4 }); ctx.restore();

      /* ── 요약 ── */
      D.text(ctx, band[2] + '  ·  ' + fmt(f, 0) + ' Hz  ·  광자 ' +
        (photonEV(p) < 1 ? photonEV(p).toExponential(2) : fmt(photonEV(p), 2)) + ' eV',
        sx, h - 36, { size: 12, color: band[3], bold: true });
      D.text(ctx, 'B₀ = ' + fmt(b0Of(p) * 1e9, 3) + ' nT   ·   세기 ' + fmt(intensity(p), 2) + ' W/m²  (햇빛의 ' +
        fmt(intensity(p) / 1361 * 100, 1) + '%)', sx, h - 16,
        { size: 11, color: hl === 'S' ? '#fff' : '#93a2c4' });
    }
  });
})();
