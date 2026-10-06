/* [양자역학] 전자의 에너지 준위와 스펙트럼 — 네온사인의 색 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Z: '#5eead4', ni: '#fbbf24', nf: '#60a5fa', E: '#a78bfa', lam: '#f472b6', f: '#34d399' };
  const RY = 13.605693;                       // 리드베리 에너지 (eV)
  const HC = 1239.841984;                     // h·c (eV·nm)
  const ATOM = ['수소 H', '헬륨 이온 He⁺', '리튬 이온 Li²⁺'];

  const En = (n, Z) => -RY * Z * Z / (n * n);
  const nfOf = p => Math.min(Math.round(p.nf), Math.round(p.ni) - 1);   // 반드시 ni > nf
  const dEOf = p => En(Math.round(p.ni), p.Z) - En(nfOf(p), p.Z);
  const lamOf = p => HC / dEOf(p);
  const SERIES = { 1: '라이먼 계열 (자외선)', 2: '발머 계열 (가시광선)', 3: '파셴 계열 (적외선)', 4: '브래킷 계열', 5: '푼트 계열' };

  // 파장(nm) → 눈에 보이는 색
  function rgb(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
    else if (nm <= 750) { r = 1; }
    else return null;                                   // 보이지 않음
    let f = 1;
    if (nm < 420) f = .3 + .7 * (nm - 380) / 40;
    else if (nm > 700) f = .3 + .7 * (750 - nm) / 50;
    return 'rgb(' + Math.round(255 * r * f) + ',' + Math.round(255 * g * f) + ',' + Math.round(255 * b * f) + ')';
  }

  PS.register({
    id: 'q-spectrum', mode: 'quantum', category: '에너지는 띄엄띄엄하다',
    title: '에너지 준위와 스펙트럼',
    sub: 'Eₙ = −13.6Z²/n²',
    tagline: '네온사인·불꽃놀이·별빛의 색은 모두 "전자가 어느 준위에서 어느 준위로 떨어졌는가"로 정해집니다. 준위 간격이 곧 광자 하나의 에너지이고, 그게 곧 색입니다.',

    params: [
      { key: 'Z', symbol: 'Z', label: '원자 번호 (수소 → Li²⁺)', unit: '', min: 1, max: 3, step: 1, value: 1, color: C.Z, dec: 0,
        where: '핵의 <b>(+)전하 수</b>입니다. 전자를 당기는 힘이 세질수록 모든 준위가 아래로 깊어지고(E ∝ Z²), 같은 전이에서도 더 큰 에너지의 광자가 나옵니다.' },
      { key: 'ni', symbol: 'nᵢ', label: '출발 준위 (높은 쪽)', unit: '', min: 2, max: 7, step: 1, value: 3, color: C.ni, dec: 0,
        where: '전자가 <b>떨어지기 전</b>에 있던 준위입니다. 왼쪽 사다리에서 노란 점으로 표시되며, 여기서 아래로 떨어질 때 광자가 나옵니다.' },
      { key: 'nf', symbol: 'n_f', label: '도착 준위 (낮은 쪽)', unit: '', min: 1, max: 6, step: 1, value: 2, color: C.nf, dec: 0,
        where: '전자가 <b>내려앉는</b> 준위입니다. 이 값이 계열을 정합니다 — 1이면 자외선(라이먼), 2면 가시광선(발머), 3이면 적외선(파셴).' }
    ],
    vars: {
      E: { symbol: 'E', label: '에너지 준위', unit: 'eV', color: C.E,
        where: '왼쪽 <b>에너지 사다리</b>입니다. 값이 음수인 것은 "전자가 핵에 묶여 있다"는 뜻이고, 0이 되면 원자에서 떨어져 나갑니다.' },
      lam: { symbol: 'λ', label: '방출된 빛의 파장', unit: 'nm', color: C.lam,
        where: '오른쪽 <b>스펙트럼 띠에 그어지는 선</b>입니다. 380~750 nm 안에 들어오면 눈에 보이는 색이 됩니다.' },
      f: { symbol: 'f', label: '진동수', unit: 'Hz', color: C.f,
        where: '광자 하나의 에너지가 곧 hf입니다 — 광전효과 시뮬레이션에서 쓰던 그 관계입니다.' },
      r: { symbol: 'r', label: '궤도 반지름', unit: '', color: C.ni,
        where: '가운데 그림의 <b>원형 정상파</b> 반지름입니다. 둘레에 파장이 정확히 n개 들어가야만 안정합니다.' },
      lamb: { symbol: 'λ', label: '전자의 물질파 파장', unit: '', color: C.nf,
        where: '전자의 드브로이 파장입니다. 이것이 원 둘레에 정수 번 들어맞는 조건이 바로 보어의 양자 조건입니다.' }
    },
    formulas: [
      { name: '수소형 원자의 에너지 준위', tpl: '{E}ₙ = −13.6 {Z}² ⁄ n²  [eV]' },
      { name: '방출되는 광자의 에너지', tpl: 'Δ{E} = {E}(nᵢ) − {E}(n_f) = h{f}' },
      { name: '파장으로 바꾸면', tpl: '{lam} = hc ⁄ Δ{E} = 1240 ⁄ Δ{E}[eV]   nm' },
      { name: '보어의 양자 조건 — 원 둘레의 정상파', tpl: '2π{r} = n · {lamb}' }
    ],

    init(p) { return { ph: 0, fly: -9, lines: [] }; },
    step(st, p, dt) {
      st.ph += dt * 1.4;
      // 설정이 바뀌면 광자를 다시 날린다
      const key = Math.round(p.Z) + '|' + Math.round(p.ni) + '|' + nfOf(p);
      if (key !== st.key) {
        st.key = key; st.fly = st.t;
        const L = lamOf(p);
        if (!st.lines.some(l => Math.abs(l - L) < .5)) { st.lines.push(L); if (st.lines.length > 14) st.lines.shift(); }
      }
    },

    graphs: [{
      title: '준위 n – 에너지 (위로 갈수록 0에 수렴)', xKey: 'n', xUnit: '', xMin: 1, xMax: 7,
      series: [{ key: 'En', label: 'Eₙ (eV)', color: C.E }]
    }],
    sample(st, p) { return { n: Math.round(p.ni), En: En(Math.round(p.ni), p.Z) }; },

    readouts(st, p) {
      const ni = Math.round(p.ni), nf = nfOf(p), dE = dEOf(p), L = lamOf(p);
      const visible = L >= 380 && L <= 750;
      return [
        { label: '원자', value: ATOM[Math.round(p.Z) - 1], color: C.Z, wide: true },
        { label: '출발 준위 E(nᵢ)', value: En(ni, p.Z), unit: 'eV', color: C.ni, dec: 2 },
        { label: '도착 준위 E(n_f)', value: En(nf, p.Z), unit: 'eV', color: C.nf, dec: 2 },
        { label: '광자 에너지 ΔE', value: dE, unit: 'eV', color: C.E, dec: 3 },
        { label: '파장 λ', value: L, unit: 'nm', color: C.lam, dec: 1 },
        { label: '진동수 f', value: dE / 4.135667e-15 / 1e12, unit: 'THz', color: C.f, dec: 0 },
        { label: '계열', value: SERIES[nf] || (nf + '번 준위로'), wide: true },
        {
          label: '눈에 보이는가', wide: true, color: visible ? '#34d399' : '#fb7185',
          value: visible ? '✔ 가시광선 — 색으로 보입니다 (' + fmt(L, 0) + ' nm)'
            : (L < 380 ? '✘ 자외선 — 눈에 보이지 않습니다' : '✘ 적외선 — 눈에 보이지 않습니다')
        }
      ];
    },

    notes: [
      '에너지가 <b>음수</b>인 것은 전자가 핵에 묶여 있다는 뜻입니다. 0이 되면 원자에서 완전히 떨어져 나갑니다(이온화).',
      '준위 간격이 곧 <b>광자 하나의 에너지</b>이고, 그게 곧 색입니다. 네온사인·불꽃놀이·별빛의 색이 전부 이 간격으로 정해집니다.',
      '<b>발머 계열</b>(n_f = 2)만 가시광선에 들어옵니다. 수소의 빨간 선 656 nm가 그중 가장 유명합니다.',
      '위로 갈수록 준위 간격이 <b>좁아집니다</b>. 그래서 높은 준위에서 오는 선들은 스펙트럼에서 한쪽으로 몰립니다.',
      '가운데 그림처럼, 전자는 <b>공처럼 도는 것이 아니라</b> 원 둘레에 정수 번 들어맞는 정상파입니다 — "상자 속 전자"를 원형으로 구부린 것과 같습니다.',
      '별빛을 쪼개 이 선들을 읽으면 <b>그 별이 무엇으로 되어 있는지</b> 알 수 있습니다.'
    ],
    presets: [
      { name: '수소 빨간 선 (656 nm)', set: { Z: 1, ni: 3, nf: 2 } },
      { name: '수소 청록 선 (486 nm)', set: { Z: 1, ni: 4, nf: 2 } },
      { name: '라이먼 — 자외선', set: { Z: 1, ni: 2, nf: 1 } },
      { name: '파셴 — 적외선', set: { Z: 1, ni: 4, nf: 3 } },
      { name: '헬륨 이온 (Z=2)', set: { Z: 2, ni: 3, nf: 2 } }
    ],
    challenges: [
      {
        id: 'balmer-red', title: '수소의 빨간 선을 만들어라',
        desc: '수소(Z=1)에서 656 nm 빨간빛이 나오는 전이를 찾아보세요.',
        hint: '발머 계열이므로 도착 준위는 2입니다. 출발 준위를 하나씩 올려 보세요.',
        check: ({ P }) => Math.round(P.Z) === 1 && Math.round(P.ni) === 3 && Math.min(Math.round(P.nf), Math.round(P.ni) - 1) === 2
      },
      {
        id: 'visible', title: '눈에 보이는 빛 찾기',
        desc: '파장이 380~750 nm 안에 들어오는 전이를 만들어 보세요.',
        hint: '도착 준위를 2로 두면 가시광선이 나옵니다(발머 계열).',
        check: ({ P }) => { const L = lamOf(P); return L >= 380 && L <= 750; }
      },
      {
        id: 'lyman', title: '자외선만 나오는 계열',
        desc: '도착 준위를 1로 두고, 나오는 빛이 전부 자외선인 것을 확인하세요.',
        hint: '바닥 상태(n=1)로 떨어지면 에너지 차가 너무 커서 자외선이 됩니다.',
        check: ({ P }) => Math.min(Math.round(P.nf), Math.round(P.ni) - 1) === 1 && lamOf(P) < 380
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const Z = Math.round(p.Z), ni = Math.round(p.ni), nf = nfOf(p);
      const dE = dEOf(p), L = lamOf(p), col = rgb(L) || '#6b7896';
      const visible = !!rgb(L);

      /* ── 왼쪽: 에너지 사다리 ── */
      const lx = 58, lw = Math.min(150, w * .2);
      const top = 46, botY = h - 118;            // 아래 스펙트럼 띠와 겹치지 않게
      const Emin = En(1, Z);
      const EY = e => botY - (e - Emin) / (0 - Emin) * (botY - top);
      D.text(ctx, '에너지 준위 (eV)', lx, top - 20, { size: 11, color: hl === 'E' ? '#fff' : '#93a2c4', bold: hl === 'E' });
      D.line(ctx, lx - 6, EY(0), lx + lw + 10, EY(0), { color: 'rgba(147,162,196,.45)', dash: [4, 4] });
      D.text(ctx, '0 — 자유 전자', lx + lw + 14, EY(0) + 4, { size: 9.5, color: '#61719a' });
      for (let n = 1; n <= 7; n++) {
        const e = En(n, Z), y = EY(e);
        const isI = n === ni, isF = n === nf;
        D.line(ctx, lx, y, lx + lw, y, {
          color: isI ? C.ni : (isF ? C.nf : 'rgba(167,139,250,.4)'),
          width: isI || isF ? 3 : 1.4, hot: (isI && hl === 'ni') || (isF && hl === 'nf')
        });
        // 위쪽 준위들은 촘촘해서 겹치므로 라벨을 솎아 낸다
        if (n <= 4 || isI || isF) {
          D.text(ctx, 'n=' + n, lx - 6, y + 4, { size: 9.5, color: isI ? C.ni : (isF ? C.nf : '#4a5878'), align: 'right', bold: isI || isF });
          D.text(ctx, fmt(e, 1), lx + lw + 6, y + 4, { size: 9, color: '#4a5878' });
        }
      }
      // 전이 화살표
      const yI = EY(En(ni, Z)), yF = EY(En(nf, Z));
      D.arrow(ctx, lx + lw * .55, yI, 0, yF - yI, {
        color: col, width: 3.5, hot: hl === 'E' || hl === 'lam',
        label: 'ΔE = ' + fmt(dE, 2) + ' eV', lx: 46
      });
      D.dot(ctx, lx + lw * .55, yI, 5, C.ni, hl === 'ni');

      /* ── 가운데: 원 둘레의 정상파 ── */
      const ox = w * .50, oy = h * .40, orad = clamp(Math.min(w * .11, h * .20), 40, 92);
      D.dot(ctx, ox, oy, 7, '#fb7185', hl === 'Z');
      D.text(ctx, '핵 +' + Z, ox, oy + 22, { size: 10, color: '#fb7185', align: 'center', bold: hl === 'Z' });
      ctx.save();
      ctx.strokeStyle = C.nf; ctx.lineWidth = hl === 'lamb' || hl === 'r' ? 2.6 : 1.9;
      if (hl === 'lamb' || hl === 'r') { ctx.shadowColor = C.nf; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + .02; a += .02) {
        const rr = orad + Math.sin(a * ni + st.ph) * 9;
        const x = ox + Math.cos(a) * rr, y = oy + Math.sin(a) * rr;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke(); ctx.restore();
      D.text(ctx, '전자의 정상파 — 둘레에 ' + ni + '개', ox, oy - orad - 24, { size: 10.5, color: C.nf, align: 'center' });
      D.text(ctx, '2πr = ' + ni + 'λ', ox, oy - orad - 10, { size: 10, color: '#61719a', align: 'center' });

      /* ── 날아가는 광자 ── */
      const age = st.t - st.fly;
      if (age >= 0 && age < 2.2) {
        const prog = age / 2.2;
        const px = ox + orad + 10 + prog * (w * .32);
        ctx.save();
        ctx.globalAlpha = 1 - prog * .7;
        ctx.strokeStyle = col; ctx.lineWidth = 2.4;
        ctx.shadowColor = col; ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const x = px - 36 + i * .9;
          const y = oy + Math.sin(i * .55 + st.ph * 3) * 7;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.restore();
        if (prog < .5) D.tag(ctx, '광자 ' + fmt(dE, 2) + ' eV', px - 16, oy - 26, col, true);
      }

      /* ── 오른쪽 아래: 스펙트럼 띠 ── */
      const sx = w * .30, sw = w * .62, sy = h - 56, sh = 30;
      ctx.save();
      for (let i = 0; i < sw; i++) {
        const nm = 380 + (i / sw) * 370;
        ctx.fillStyle = rgb(nm) || '#000';
        ctx.globalAlpha = .55;
        ctx.fillRect(sx + i, sy, 1.5, sh);
      }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(147,162,196,.4)'; ctx.lineWidth = 1;
      ctx.strokeRect(sx, sy, sw, sh); ctx.restore();
      [400, 500, 600, 700].forEach(nm => {
        const x = sx + (nm - 380) / 370 * sw;
        D.text(ctx, nm + '', x, sy + sh + 13, { size: 9, color: '#4a5878', align: 'center' });
      });
      D.text(ctx, '가시광선 스펙트럼 (nm)', sx, sy - 8, { size: 10.5, color: '#93a2c4' });

      // 지금까지 만든 선들
      st.lines.forEach(ln => {
        if (ln < 380 || ln > 750) return;
        const x = sx + (ln - 380) / 370 * sw;
        D.line(ctx, x, sy, x, sy + sh, { color: 'rgba(255,255,255,.55)', width: 1.4 });
      });
      // 현재 선
      if (visible) {
        const x = sx + (L - 380) / 370 * sw;
        ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14;
        D.line(ctx, x, sy - 6, x, sy + sh + 6, { color: '#fff', width: 2.6 });
        ctx.restore();
        D.tag(ctx, fmt(L, 0) + ' nm', x, sy - 20, col, true);
      } else {
        const left = L < 380;
        D.tag(ctx, (left ? '◀ 자외선 ' : '적외선 ▶ ') + fmt(L, 0) + ' nm — 눈에 안 보임',
          left ? sx + 90 : sx + sw - 90, sy - 20, '#93a2c4', true);
      }

      D.text(ctx, SERIES[nf] || '', w - 24, 30, { size: 12, color: col, align: 'right', bold: true });
      if (Math.round(p.nf) !== nf)
        D.tag(ctx, '도착 준위는 출발 준위보다 낮아야 합니다 → n_f = ' + nf + '로 맞춤', w / 2, 24, '#fbbf24', true);
    }
  });
})();
