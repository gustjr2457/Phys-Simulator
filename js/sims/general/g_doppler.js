/* [일반물리·파동과 광학] 도플러 효과와 충격파 — f′ = f (v ± v_o)/(v ∓ v_s)
   파원이 움직이면 앞쪽 파면은 촘촘해지고 뒤쪽은 성겨진다. 파동의 속력은 매질이
   정하므로 변하지 않고, '한 파장이 얼마나 긴가'만 달라지는 것이다. 파원이 파동보다
   빨라지면 파면이 뒤로 쌓여 원뿔이 되고 — 그것이 충격파(소닉붐)다.
   구급차 사이렌, 레이더 속도 측정, 초음파 도플러 진단, 그리고 은하의 적색편이가
   모두 이 식 하나로 설명된다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { fs: '#fbbf24', vs: '#fb7185', vo: '#60a5fa', v: '#5eead4',
              fa: '#fb7185', fr: '#60a5fa', M: '#a78bfa' };

  const machOf = p => p.vs / p.v;
  const fApp = p => p.vs >= p.v ? Infinity : p.fs * (p.v + p.vo) / (p.v - p.vs);
  const fRec = p => p.fs * (p.v - p.vo) / (p.v + p.vs);
  const coneDeg = p => machOf(p) > 1 ? Math.asin(1 / machOf(p)) * 180 / Math.PI : 0;
  const semitone = r => r > 0 && isFinite(r) ? 12 * Math.log2(r) : Infinity;

  PS.register({
    id: 'g-doppler', mode: 'general', category: '파동과 광학',
    title: '도플러 효과와 충격파',
    sub: "f′ = f (v ± v_o)/(v ∓ v_s)",
    tagline: '파원이 움직이면 앞쪽 파면은 촘촘해지고 뒤쪽은 성겨집니다. 파동의 속력은 매질이 정하니 변하지 않고, 파장만 달라지는 거죠 — 파원이 파동보다 빨라지면 충격파가 됩니다.',

    params: [
      { key: 'fs', symbol: 'f', label: '음원 진동수', unit: 'Hz', min: 100, max: 2000, step: 10, value: 440, color: C.fs, dec: 0,
        where: '음원이 <b>실제로 내는 진동수</b>입니다(440 Hz = 라). 파면이 그려지는 간격을 정하고, 관찰자가 듣는 진동수의 기준이 됩니다.' },
      { key: 'vs', symbol: 'v_s', label: '음원 속도', unit: 'm/s', min: 0, max: 700, step: 5, value: 100, color: C.vs, dec: 0, reset: true,
        where: '<b>음원(빨간 점)이 달리는 속도</b>입니다. 앞쪽 파면을 쫓아가 촘촘하게 만듭니다. 음속을 넘으면 파면 밖으로 튀어나가 <b>마하콘</b>이 생깁니다.' },
      { key: 'vo', symbol: 'v_o', label: '관찰자 속도', unit: 'm/s', min: -150, max: 150, step: 5, value: 0, color: C.vo, dec: 0,
        where: '<b>관찰자(파란 점)의 속도</b>입니다(+면 음원 쪽으로 다가감). 관찰자가 움직이면 파장이 아니라 <b>단위 시간에 만나는 파면 수</b>가 달라집니다 — 음원이 움직일 때와 수식이 다른 이유입니다.' },
      { key: 'v', symbol: 'v', label: '매질에서의 파동 속력', unit: 'm/s', min: 300, max: 1500, step: 10, value: 343, color: C.v, dec: 0, reset: true,
        where: '<b>매질이 정하는 파동의 속력</b>입니다(20 °C 공기 343 · 물 1480 · 헬륨 1007 m/s). 음원이 아무리 빨라도 파동 자체는 항상 이 속력으로 퍼집니다.' }
    ],
    vars: {
      fa: { symbol: 'f′_접근', label: '다가올 때 들리는 진동수', unit: 'Hz', color: C.fa,
        where: '음원이 <b>다가올 때</b> 들리는 진동수입니다. 앞쪽의 촘촘한(붉은) 파면에 해당하며, 원래보다 높게 들립니다.' },
      fr: { symbol: 'f′_후퇴', label: '멀어질 때 들리는 진동수', unit: 'Hz', color: C.fr,
        where: '음원이 <b>지나가 버린 뒤</b> 들리는 진동수입니다. 뒤쪽의 성긴(파란) 파면에 해당하며, 낮게 들립니다 — 구급차가 지나가는 순간 음이 뚝 떨어지는 이유입니다.' },
      M: { symbol: 'M', label: '마하수', unit: '', color: C.M,
        where: '음원 속도를 파동 속력으로 나눈 값입니다. <b>1을 넘으면</b> 파면이 뒤로 쌓여 원뿔(마하콘)을 이루고, 그 원뿔이 지나갈 때 충격파로 들립니다.' }
    },
    formulas: [
      { name: '도플러 효과 (일반형)', tpl: "f′ = {fs} · ({v} ± {vo}) ⁄ ({v} ∓ {vs})" },
      { name: '다가올 때', tpl: '{fa} = {fs} · {v} ⁄ ({v} − {vs})' },
      { name: '멀어질 때', tpl: '{fr} = {fs} · {v} ⁄ ({v} + {vs})' },
      { name: '마하수와 충격파 원뿔', tpl: '{M} = {vs} ⁄ {v},   sin μ = 1 ⁄ {M}' }
    ],

    init(p) { return { waves: [], last: -1, sx: -.15, ox: .82, done: false }; },
    step(st, p, dt) {
      const SPAN = 700;                           // 화면 가로를 700 m로 본다
      st.sx += p.vs / SPAN * dt;
      st.ox -= p.vo / SPAN * dt;
      if (st.sx > 1.2) { st.sx = -.2; st.waves.length = 0; }
      if (st.ox < .05 || st.ox > 1.1) st.ox = clamp(st.ox, .05, 1.1);
      // 일정 간격으로 파면을 방출 (보기 좋은 속도로 — 실제 440 Hz는 못 그린다)
      const period = .22;
      if (st.t - st.last > period) { st.last = st.t; st.waves.push({ x: st.sx, t: st.t }); }
      st.waves = st.waves.filter(q => (st.t - q.t) * p.v / SPAN < 1.7);
    },

    graphs: [{
      title: '관찰자가 듣는 진동수 — 음원이 지나가는 순간', xmin: 8, window: 10, y0: 0,
      series: [
        { key: 'heard', label: '들리는 f′ (Hz)', color: '#e8eefc' },
        { key: 'src', label: '실제 f (Hz)', color: C.fs }
      ]
    }],
    sample(st, p) {
      // 관찰자에서 본 음원의 시선 속도 성분으로 실제로 들리는 진동수를 계산
      const dx = st.ox - st.sx;
      const closing = dx > 0 ? p.vs : -p.vs;      // 음원이 다가오는 성분
      const f = p.vs >= p.v && dx > 0 ? NaN : p.fs * (p.v + (dx > 0 ? p.vo : -p.vo)) / (p.v - closing);
      return { heard: isFinite(f) ? clamp(f, 0, p.fs * 6) : null, src: p.fs };
    },

    readouts(st, p) {
      const M = machOf(p), fa = fApp(p), fr = fRec(p);
      return [
        { label: '다가올 때 f′', value: isFinite(fa) ? fa : Infinity, unit: 'Hz', color: C.fa, dec: 1 },
        { label: '멀어질 때 f′', value: fr, unit: 'Hz', color: C.fr, dec: 1 },
        { label: '지나가는 순간의 낙차', value: isFinite(fa) ? fa - fr : Infinity, unit: 'Hz', dec: 1, color: '#fbbf24' },
        { label: '음정 변화 (다가올 때)', value: isFinite(fa) ? semitone(fa / p.fs) : Infinity, unit: '반음', dec: 2, color: C.fa },
        { label: '앞쪽 파장', value: isFinite(fa) ? p.v / fa : 0, unit: 'm', dec: 3, color: C.fa },
        { label: '뒤쪽 파장', value: p.v / fr, unit: 'm', dec: 3, color: C.fr },
        { label: '마하수 M', value: M, unit: '', color: C.M, dec: 3 },
        { label: '마하콘 반각', value: M > 1 ? coneDeg(p) : 0, unit: '°', dec: 1, color: C.M },
        { label: '충격파', wide: true, color: M >= 1 ? '#fb7185' : '#34d399',
          value: M > 1 ? '발생 — 원뿔이 지나갈 때 소닉붐으로 들린다' :
                 (M > .99 ? '음속 돌파 직전 — 파면이 앞에 쌓인다' : '없음 (아음속)') },
        { label: '이 매질은', wide: true, color: C.v,
          value: p.v < 400 ? '공기 (343 m/s 근처)' : (p.v < 1200 ? '헬륨 (1007 m/s 근처)' : '물 (1480 m/s 근처)') },
        { label: '빛이었다면 (적색편이 z)', value: p.vs / 299792458 * 1e6, unit: '×10⁻⁶', dec: 4, wide: true, color: '#a78bfa' }
      ];
    },

    notes: [
      '<b>파동의 속력은 변하지 않습니다.</b> 매질이 정하기 때문입니다. 변하는 것은 "한 파장이 얼마나 긴가"뿐이고, 그래서 f′ = v/λ′ 로 진동수가 달라집니다.',
      '<b>음원이 움직일 때와 관찰자가 움직일 때는 수식이 다릅니다.</b> 음원이 움직이면 <b>파장 자체</b>가 바뀌고, 관찰자가 움직이면 파장은 그대로인데 <b>단위 시간에 만나는 파면 수</b>가 바뀝니다. 그래서 분모와 분자에 따로 들어갑니다.',
      '구급차가 <b>지나가는 순간</b> 음이 뚝 떨어지는 것은 접근 진동수에서 후퇴 진동수로 한 번에 건너뛰기 때문입니다. 100 km/h(28 m/s)면 약 1.4반음, 거의 반음 두 개 차이입니다.',
      '<b>M = 1에서 식이 무한대로 발산합니다.</b> 모든 파면이 한 점에 겹친다는 뜻이고, 실제로 음속 돌파 직전 항공기 앞에는 엄청난 압력 장벽이 생깁니다(음속 장벽). 넘어서면 파면이 뒤로 밀려 마하콘이 됩니다.',
      '<b>소닉붐은 "넘는 순간" 한 번 나는 소리가 아닙니다.</b> 초음속으로 나는 동안 원뿔이 계속 끌려다니고, 그 원뿔이 내 위를 지나가는 순간 들리는 것입니다 — 그래서 초음속 여객기의 육상 비행이 금지돼 있습니다.',
      '<b>빛에도 같은 일이 일어납니다.</b> 다만 빛은 매질이 없어 상대속도만 의미가 있고, 상대론적 보정이 들어갑니다. 멀어지는 은하의 빛이 붉어지는 적색편이가 그것이고, 경찰 속도 측정기와 도플러 초음파 진단도 같은 원리입니다.'
    ],
    presets: [
      { name: '구급차 (100 km/h)', set: { fs: 440, vs: 28, vo: 0, v: 343 } },
      { name: '고속열차 (300 km/h)', set: { fs: 440, vs: 83, vo: 0, v: 343 } },
      { name: '음속 바로 아래 (M = 0.95)', set: { fs: 440, vs: 325, vo: 0, v: 343 } },
      { name: '초음속 전투기 (M = 1.5)', set: { fs: 440, vs: 515, vo: 0, v: 343 } },
      { name: '마하 2', set: { fs: 440, vs: 686, vo: 0, v: 343 } },
      { name: '물속 소나 (v = 1480)', set: { fs: 1000, vs: 100, vo: 0, v: 1480 } },
      { name: '관찰자가 달려간다', set: { fs: 440, vs: 0, vo: 100, v: 343 } }
    ],
    challenges: [
      {
        id: 'half', title: '1.5배 높게 들리게',
        desc: '다가올 때 들리는 진동수가 원래의 1.5배(완전5도 위)가 되게 만들어 보세요.',
        hint: "f′/f = v/(v−v_s) = 1.5 → v_s = v/3. 공기(343)라면 약 114 m/s입니다.",
        check: ({ P }) => { const r = fApp(P) / P.fs; return isFinite(r) && r >= 1.48 && r <= 1.52; }
      },
      {
        id: 'boom', title: '음속 돌파하기',
        desc: '음원을 음속보다 빠르게 해서 마하콘(충격파)이 생기는 것을 확인하세요.',
        hint: '마하수 M = v_s/v 가 1을 넘으면 됩니다. 공기에서는 343 m/s 이상.',
        check: ({ P }) => machOf(P) > 1
      },
      {
        id: 'mach2', title: '마하 2의 원뿔',
        desc: '마하 2(±0.05)에 맞춰, 충격파 원뿔의 반각이 30°가 되는 것을 확인하세요.',
        hint: 'sin μ = 1/M 이므로 M = 2면 μ = 30°입니다. 정확히 음속의 2배로 맞추세요.',
        check: ({ P }) => { const M = machOf(P); return M >= 1.95 && M <= 2.05; }
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const M = machOf(p), SPAN = 700;
      const x0 = 36, pw = w - 72, cy = h * .42;
      const PX = pw / SPAN;                       // 1 m → px
      const X = u => x0 + u * pw;

      /* ── 파면 ── */
      ctx.save();
      ctx.beginPath(); ctx.rect(x0 - 4, 26, pw + 8, h - 110); ctx.clip();
      st.waves.forEach(q => {
        const age = st.t - q.t;
        const r = age * p.v * PX;
        if (r < 1) return;
        const fade = clamp(1 - age / 2.6, 0, 1);
        // 음원 진행 방향(오른쪽)이 앞쪽 — 붉게, 뒤쪽은 푸르게
        ctx.strokeStyle = 'rgba(200,211,239,' + (fade * .45) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(X(q.x), cy, r, 0, 7); ctx.stroke();
      });
      ctx.restore();

      /* ── 마하콘 ── */
      if (M > 1) {
        const mu = Math.asin(1 / M);
        ctx.save();
        ctx.strokeStyle = hl === 'M' ? 'rgba(251,113,133,.95)' : 'rgba(251,113,133,.6)';
        ctx.lineWidth = 2.4;
        [-1, 1].forEach(s => {
          ctx.beginPath(); ctx.moveTo(X(st.sx), cy);
          const L = pw * .9;
          ctx.lineTo(X(st.sx) - L * Math.cos(mu), cy + s * L * Math.sin(mu));
          ctx.stroke();
        });
        ctx.restore();
        D.text(ctx, '마하콘  μ = ' + fmt(coneDeg(p), 1) + '°', X(st.sx) - 90, cy - 34,
          { size: 11.5, color: hl === 'M' ? '#fff' : C.M, bold: true });
      }

      /* ── 음원 ── */
      ctx.save();
      if (hl === 'vs') { ctx.shadowColor = C.vs; ctx.shadowBlur = 18; }
      D.dot(ctx, X(st.sx), cy, 7, C.vs, true); ctx.restore();
      if (p.vs > 0) D.arrow(ctx, X(st.sx) + 10, cy, clamp(12 + p.vs * .07, 12, 56), 0,
        { color: C.vs, width: 2.6, head: 7, hot: hl === 'vs' });
      D.text(ctx, '음원  ' + fmt(p.vs, 0) + ' m/s', X(st.sx), cy - 20,
        { size: 10.5, color: hl === 'vs' ? '#fff' : C.vs, align: 'center', bold: true });

      /* ── 관찰자 ── */
      ctx.save();
      if (hl === 'vo') { ctx.shadowColor = C.vo; ctx.shadowBlur = 18; }
      D.dot(ctx, X(st.ox), cy + 54, 6, C.vo, true); ctx.restore();
      if (p.vo !== 0) D.arrow(ctx, X(st.ox), cy + 54, -Math.sign(p.vo) * clamp(12 + Math.abs(p.vo) * .14, 12, 40), 0,
        { color: C.vo, width: 2.4, head: 6, hot: hl === 'vo' });
      const dx = st.ox - st.sx;
      const heard = p.vs >= p.v && dx > 0 ? NaN
        : p.fs * (p.v + (dx > 0 ? p.vo : -p.vo)) / (p.v - (dx > 0 ? p.vs : -p.vs));
      D.tag(ctx, isFinite(heard) ? '듣는 중: ' + fmt(heard, 0) + ' Hz' : '충격파 도달 전',
        X(st.ox), cy + 78, isFinite(heard) ? (heard > p.fs ? C.fa : C.fr) : '#fb7185', true);

      /* ── 앞/뒤 파장 비교 ── */
      const la = isFinite(fApp(p)) ? p.v / fApp(p) : 0, lr = p.v / fRec(p);
      const by = h - 76;
      D.text(ctx, '파장 비교 (음원 기준)', x0, by - 10, { size: 10.5, color: '#61719a' });
      [[la, C.fa, '앞쪽 (다가옴)', 0], [lr, C.fr, '뒤쪽 (멀어짐)', 1]].forEach(([lam, cc, lab, row]) => {
        const yy = by + row * 24;
        const n = 9, step = clamp(lam * PX * 2.2, 3, 46);
        ctx.save(); ctx.strokeStyle = cc; ctx.lineWidth = 2;
        if ((row === 0 && hl === 'fa') || (row === 1 && hl === 'fr')) { ctx.shadowColor = cc; ctx.shadowBlur = 10; }
        for (let i = 0; i < n; i++) {
          const xx = x0 + 128 + i * step;
          if (xx > x0 + pw - 100) break;
          ctx.beginPath(); ctx.moveTo(xx, yy - 7); ctx.lineTo(xx, yy + 7); ctx.stroke();
        }
        ctx.restore();
        D.text(ctx, lab, x0, yy + 4, { size: 10, color: cc });
        D.text(ctx, lam > 0 ? fmt(lam, 3) + ' m  →  ' + fmt(lam > 0 ? p.v / lam : 0, 0) + ' Hz' : '파장 0 — 모든 파면이 겹침',
          x0 + 128 + n * step + 10, yy + 4, { size: 10, color: cc });
      });

      /* ── 마하수 게이지 ── */
      const mx = x0, my = h - 18, mw = Math.min(pw, 420);
      D.roundRect(ctx, mx, my - 7, mw, 9, 4); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const MX = m => mx + clamp(m / 2.2, 0, 1) * mw;
      ctx.fillStyle = 'rgba(52,211,153,.25)'; ctx.fillRect(mx, my - 7, MX(1) - mx, 9);
      ctx.fillStyle = 'rgba(251,113,133,.25)'; ctx.fillRect(MX(1), my - 7, mx + mw - MX(1), 9);
      D.line(ctx, MX(1), my - 12, MX(1), my + 7, { color: '#fff', width: 2 });
      D.text(ctx, 'M = 1 (음속)', MX(1), my - 16, { size: 9, color: '#e8eefc', align: 'center' });
      ctx.save(); ctx.shadowColor = C.M; ctx.shadowBlur = 10;
      D.dot(ctx, MX(M), my - 2.5, 6, C.M, true); ctx.restore();
      D.text(ctx, 'M = ' + fmt(M, 2), mx + mw + 10, my + 2,
        { size: 12, color: hl === 'M' ? '#fff' : C.M, bold: true });
    }
  });
})();
