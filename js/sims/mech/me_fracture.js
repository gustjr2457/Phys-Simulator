/* [기계공학·파괴역학] 균열과 응력확대계수 — K_I = σ√(πa), 파괴 조건 K_I ≥ K_IC
   항복강도를 한참 밑도는 응력에서도 구조물은 부서질 수 있다. 균열 끝에서 응력이
   무한히 치솟기 때문이다. 그 치솟는 정도를 하나의 수로 묶은 것이 응력확대계수 K이고,
   재료가 견딜 수 있는 K의 한계가 파괴인성 K_IC다. 리버티 수송선, 코멧 여객기,
   압력용기 사고가 모두 이 식을 몰라서 일어났다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { sig: '#fb7185', a: '#fbbf24', KIC: '#5eead4', sy: '#a78bfa',
              K: '#f472b6', ac: '#60a5fa' };

  const KofA = (sig, aMM) => sig * Math.sqrt(Math.PI * aMM / 1000);   // MPa√m (중앙균열, Y=1)
  const acOf = p => 1000 * (p.KIC / p.sig) * (p.KIC / p.sig) / Math.PI;   // 임계 균열 길이 mm
  const rpOf = (K, sy) => 1e3 * (K / sy) * (K / sy) / (2 * Math.PI);      // 소성역 크기 mm

  PS.register({
    id: 'me-fracture', mode: 'mech', category: '파괴역학',
    title: '균열과 응력확대계수',
    sub: 'K_I = σ√(πa)',
    tagline: '항복강도의 절반도 안 되는 응력에서 판이 쪼개집니다. 흠집 하나가 응력을 끝에 모아 주기 때문입니다 — "강도"만으로는 파손을 막을 수 없습니다.',

    params: [
      { key: 'sig', symbol: 'σ', label: '작용 응력', unit: 'MPa', min: 20, max: 500, step: 10, value: 180, color: C.sig, dec: 0, reset: true,
        where: '판을 <b>위아래로 당기는 응력</b>(붉은 화살표)입니다. 균열이 없다면 항복강도까지 멀쩡하겠지만, 균열이 있으면 이 값이 K를 통해 파괴를 직접 결정합니다.' },
      { key: 'a', symbol: 'a', label: '균열 반길이', unit: 'mm', min: .5, max: 60, step: .5, value: 8, color: C.a, dec: 1, reset: true,
        where: '판 가운데 <b>노란 균열</b>의 반길이입니다(전체 길이는 2a). K는 √a로 커지므로, 균열이 4배 길어지면 K는 2배가 됩니다.' },
      { key: 'KIC', symbol: 'K_IC', label: '파괴인성', unit: 'MPa√m', min: 10, max: 150, step: 5, value: 50, color: C.KIC, dec: 0,
        where: '재료가 견딜 수 있는 <b>K의 한계선</b>(오른쪽 청록 수평선)입니다. 유리 1 · 주철 20 · 구조용강 50 · 티타늄 80 · 저온강 120 정도로, 강도와는 완전히 별개의 성질입니다.' },
      { key: 'sy', symbol: 'σ_y', label: '항복강도', unit: 'MPa', min: 200, max: 1400, step: 50, value: 600, color: C.sy, dec: 0,
        where: '균열이 없을 때 버티는 한계입니다. 균열 끝에 생기는 <b>소성역(흰 원)</b>의 크기를 정하며, σ가 이 값보다 훨씬 낮아도 파괴될 수 있다는 것이 이 시뮬레이션의 핵심입니다.' }
    ],
    vars: {
      K: { symbol: 'K_I', label: '응력확대계수', unit: 'MPa√m', color: C.K,
        where: '균열 끝에 응력이 <b>얼마나 집중되는가</b>를 하나로 묶은 값입니다. 오른쪽 K–a 그림의 분홍 점이 현재 위치입니다.' },
      ac: { symbol: 'a_c', label: '임계 균열 길이', unit: 'mm', color: C.ac,
        where: '지금 응력에서 <b>이 길이를 넘으면 즉시 터지는</b> 균열 크기입니다(파란 점선). 검사 주기는 이 값으로 정합니다.' }
    },
    formulas: [
      { name: '응력확대계수 (중앙 관통균열)', tpl: '{K} = {sig}√(π{a})' },
      { name: '파괴 조건', tpl: '{K} ≥ {KIC}  →  불안정 파괴' },
      { name: '임계 균열 길이', tpl: '{ac} = (1⁄π)·({KIC} ⁄ {sig})²' },
      { name: '균열 끝 소성역 크기', tpl: 'r_p ≈ (1⁄2π)·({K} ⁄ {sy})²' }
    ],

    init(p) { return { a: p.a, broke: false, tb: 0, done: false }; },
    step(st, p, dt) {
      const K = KofA(p.sig, st.a);
      if (K >= p.KIC) {                       // 한 번 임계에 닿으면 K가 계속 커져 폭주한다
        st.broke = true;
        st.tb += dt;
        st.a += (60 + st.a * 14) * dt;        // 불안정 균열 전파: 수백 m/s 수준을 압축해 표현
        if (st.a > 300) { st.a = 300; st.done = true; }
      }
    },

    graphs: [{
      title: 'K_I 와 파괴인성 K_IC', xmin: 4, window: 8, y0: 0,
      series: [
        { key: 'K', label: 'K_I', color: C.K },
        { key: 'KIC', label: 'K_IC (한계)', color: C.KIC }
      ]
    }],
    sample(st, p) { return { K: KofA(p.sig, st.a), KIC: p.KIC }; },

    readouts(st, p) {
      const K = KofA(p.sig, st.a), ac = acOf(p), sr = K > .01 ? p.KIC / K : Infinity;
      return [
        { label: '응력확대계수 K_I', value: K, unit: 'MPa√m', color: C.K, dec: 1 },
        { label: '파괴인성 K_IC', value: p.KIC, unit: 'MPa√m', color: C.KIC, dec: 0 },
        { label: '임계 균열 길이 a_c', value: ac, unit: 'mm', color: C.ac, dec: 1 },
        { label: '현재 균열 a', value: st.a, unit: 'mm', color: C.a, dec: 1 },
        { label: '안전율 (K_IC / K_I)', value: sr, dec: 2, color: sr >= 1.5 ? '#34d399' : (sr >= 1 ? '#fbbf24' : '#fb7185') },
        { label: '응력 / 항복강도', value: p.sig / p.sy * 100, unit: '%', color: C.sy, dec: 0 },
        { label: '균열 끝 소성역 r_p', value: rpOf(K, p.sy), unit: 'mm', dec: 3, color: '#93a2c4' },
        { label: '균열이 없었다면', wide: true, color: p.sig < p.sy ? '#34d399' : '#fb7185',
          value: p.sig < p.sy ? '항복강도의 ' + fmt(p.sig / p.sy * 100, 0) + '% — 멀쩡했다' : '균열 없이도 항복' },
        { label: '상태', wide: true, color: st.broke ? '#fb7185' : (sr >= 1.5 ? '#34d399' : '#fbbf24'),
          value: st.broke ? '불안정 파괴 — 균열이 폭주해 판이 쪼개졌다' :
                 (sr >= 1.5 ? '안전 (안전율 1.5 이상)' : '위험 — 임계에 근접') }
      ];
    },

    notes: [
      '<b>강도가 높다고 안 깨지는 것이 아닙니다.</b> 파손을 막으려면 강도(σ_y)와 파괴인성(K_IC)을 따로 봐야 합니다. 고장력강은 강도를 올리면 보통 K_IC가 떨어져, 균열에는 더 취약해집니다.',
      'K는 <b>√a</b>로 커집니다 — 균열이 4배 길어져야 K가 2배가 됩니다. 반대로 임계 균열 길이 a_c는 <b>응력의 역제곱</b>이라, 응력을 절반으로 낮추면 허용 균열이 4배로 늘어납니다.',
      '제2차 세계대전 때 <b>리버티 수송선</b>이 항구에 정박한 채로 두 동강 난 사건이 파괴역학의 출발점입니다. 용접부의 작은 균열 + 저온에서 떨어진 K_IC가 원인이었습니다.',
      '그래서 항공기 정비는 "부러지기 전에 고친다"가 아니라 <b>"a_c보다 작을 때 찾아낸다"</b>가 목표입니다 — 검사로 찾을 수 있는 최소 균열과 a_c 사이의 간격이 정비 주기를 정합니다.',
      '균열 끝은 이론상 응력이 무한대지만, 실제로는 작은 영역이 항복해(<b>소성역</b>) 끝을 뭉개 줍니다. 이 소성역이 균열 길이보다 충분히 작을 때만 K로 다루는 선형탄성 파괴역학이 성립합니다.'
    ],
    presets: [
      { name: '구조용강 + 작은 균열', set: { sig: 180, a: 8, KIC: 50, sy: 600 } },
      { name: '취성 재료 (주철)', set: { KIC: 20, sy: 300, sig: 120, a: 8 } },
      { name: '리버티 수송선 (저온 취성)', set: { sig: 120, a: 30, KIC: 25, sy: 300 } },
      { name: '고인성 저온강', set: { KIC: 130, sy: 500, sig: 180, a: 8 } },
      { name: '임계 직전', set: { sig: 300, a: 8, KIC: 50, sy: 900 } }
    ],
    challenges: [
      {
        id: 'low', title: '항복강도의 1/3에서 부서뜨리기',
        desc: '작용 응력을 항복강도의 33% 이하로 유지한 채 판을 파괴해 보세요 — "충분히 안전한 응력"이 안전하지 않다는 증거입니다.',
        hint: '응력을 낮게 두고 균열 a를 키우거나, 파괴인성 K_IC가 낮은 취성 재료를 고르세요.',
        check: ({ P, st }) => P.sig <= P.sy / 3 && st.broke
      },
      {
        id: 'safe', title: '큰 균열을 안고도 안전하게',
        desc: '균열 반길이를 25 mm 이상으로 두면서 안전율(K_IC/K_I)을 2 이상 확보해 보세요.',
        hint: '응력을 낮추면 K가 비례해서 줄고, 인성이 높은 재료를 쓰면 한계선이 올라갑니다.',
        check: ({ P }) => P.a >= 25 && P.KIC / KofA(P.sig, P.a) >= 2
      },
      {
        id: 'crit', title: '임계 균열 길이를 정확히 맞추기',
        desc: '현재 균열 a를 임계 균열 길이 a_c의 95~100% 사이에 맞춰 보세요 — 파괴 직전의 외줄타기입니다.',
        hint: 'a_c = (1/π)(K_IC/σ)². 측정값 칸의 a_c를 보면서 균열 슬라이더를 조금씩 올리세요.',
        check: ({ P }) => { const ac = acOf(P); return P.a >= ac * .95 && P.a <= ac; }
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const K = KofA(p.sig, st.a), ac = acOf(p), crit = K >= p.KIC;

      /* ── 판 + 균열 ── */
      const pw = Math.min(w * .44, 290), ph = Math.min(h * .56, 300);
      const cx = w * .30, cy = h * .47;
      const MM = pw / 150;                                   // 1 mm → px (판 폭 150 mm 가정)
      const aPx = clamp(st.a * MM, 2, pw * .47);

      // 판
      D.roundRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, 3);
      ctx.fillStyle = 'rgba(147,162,196,.10)'; ctx.fill();
      ctx.strokeStyle = 'rgba(147,162,196,.45)'; ctx.lineWidth = 1.5; ctx.stroke();

      // 응력 흐름선 — 균열을 피해 돌아가며 끝에서 몰린다
      const nLine = 13;
      ctx.save();
      for (let i = 0; i < nLine; i++) {
        const u = (i + .5) / nLine;                           // 0..1 판 폭 방향
        const x0 = cx - pw / 2 + u * pw;
        const d = Math.abs(x0 - cx);                          // 균열 중심으로부터의 거리
        const inside = d < aPx;
        ctx.beginPath();
        ctx.strokeStyle = inside ? 'rgba(96,165,250,.10)' : 'rgba(96,165,250,.34)';
        ctx.lineWidth = inside ? 1 : 1.3;
        for (let j = 0; j <= 40; j++) {
          const t = j / 40, y = cy - ph / 2 + t * ph;
          const dy = Math.abs(y - cy);
          // 균열 근처에서 바깥으로 밀려나는 변위(개략): 균열 안쪽 선은 끊고, 바깥 선은 끝쪽으로 몰린다
          const pull = Math.exp(-(dy / (aPx * .9 + 14)) * (dy / (aPx * .9 + 14)));
          const push = inside ? 0 : Math.sign(x0 - cx) * -aPx * .55 * pull * Math.exp(-(d - aPx) / (aPx * .8 + 20));
          const x = x0 + push;
          if (inside && dy < aPx * .12) { ctx.stroke(); ctx.beginPath(); continue; }
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 균열(렌즈 모양 — 응력으로 벌어진다)
      const open = clamp(K / Math.max(1, p.KIC) * 5, 1.5, 11);
      ctx.save();
      if (hl === 'a' || crit) { ctx.shadowColor = crit ? '#fb7185' : C.a; ctx.shadowBlur = 18; }
      ctx.beginPath();
      ctx.moveTo(cx - aPx, cy);
      ctx.quadraticCurveTo(cx, cy - open, cx + aPx, cy);
      ctx.quadraticCurveTo(cx, cy + open, cx - aPx, cy);
      ctx.closePath();
      ctx.fillStyle = crit ? 'rgba(251,113,133,.85)' : C.a; ctx.fill();
      ctx.restore();

      // 균열 끝 소성역 + 응력집중 표시
      const rp = clamp(rpOf(K, p.sy) * MM, 2.5, 26);
      [-1, 1].forEach(s => {
        const tx = cx + s * aPx;
        ctx.save();
        ctx.strokeStyle = 'rgba(232,238,252,.75)'; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.arc(tx, cy, rp, 0, 7); ctx.stroke(); ctx.restore();
        // 응력 집중을 방사형 빛으로
        ctx.save();
        const g = ctx.createRadialGradient(tx, cy, 0, tx, cy, rp * 3.4);
        g.addColorStop(0, crit ? 'rgba(251,113,133,.55)' : 'rgba(244,114,182,.45)');
        g.addColorStop(1, 'rgba(244,114,182,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx, cy, rp * 3.4, 0, 7); ctx.fill(); ctx.restore();
      });
      D.text(ctx, '소성역 r_p', cx + aPx + rp + 6, cy - rp - 4, { size: 9, color: 'rgba(232,238,252,.6)' });
      D.dim(ctx, cx - aPx, cy + ph * .22, cx + aPx, cy + ph * .22, '2a = ' + fmt(st.a * 2, 1) + ' mm', C.a, hl === 'a');

      // 임계 균열 길이 점선
      const acPx = clamp(ac * MM, 0, pw * .49);
      if (acPx > 2 && acPx < pw * .49) {
        [-1, 1].forEach(s => D.line(ctx, cx + s * acPx, cy - ph * .16, cx + s * acPx, cy + ph * .16,
          { color: C.ac, dash: [3, 4], width: 1.6, hot: hl === 'ac' }));
        D.text(ctx, 'a_c = ' + fmt(ac, 1) + ' mm', cx + acPx + 6, cy - ph * .16 - 4,
          { size: 10, color: hl === 'ac' ? '#fff' : C.ac, bold: hl === 'ac' });
      }

      // 당기는 응력 화살표
      const al = clamp(20 + p.sig * .1, 20, 72);
      for (let i = -1; i <= 1; i++) {
        const ax = cx + i * pw * .33;
        D.arrow(ctx, ax, cy - ph / 2 - 10, 0, -al, { color: C.sig, width: 3.4, hot: hl === 'sig' });
        D.arrow(ctx, ax, cy + ph / 2 + 10, 0, al, { color: C.sig, width: 3.4, hot: hl === 'sig' });
      }
      D.tag(ctx, 'σ = ' + fmt(p.sig, 0) + ' MPa  (σ_y의 ' + fmt(p.sig / p.sy * 100, 0) + '%)',
        cx, cy - ph / 2 - al - 26, C.sig, hl === 'sig');

      if (st.broke) D.tag(ctx, '불안정 파괴 — 멈출 수 없다', cx, cy + ph / 2 + al + 26, '#fb7185', true);

      /* ── K – a 선도 ── */
      const gx = w - 232, gy = 56, gw = 196, gh = 150;
      const aMax = Math.max(st.a * 1.4, ac * 1.6, 20);
      const kMax = Math.max(p.KIC * 1.5, KofA(p.sig, aMax));
      D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fill();
      const GX = aa => gx + clamp(aa / aMax, 0, 1) * gw;
      const GY = kk => gy + gh - clamp(kk / kMax, 0, 1) * gh;
      D.text(ctx, 'K_I = σ√(πa)', gx + 4, gy - 8, { size: 10.5, color: '#61719a' });
      // K(a) 곡선
      ctx.save(); ctx.strokeStyle = C.K; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const aa = aMax * i / 80, X = GX(aa), Y = GY(KofA(p.sig, aa)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.restore();
      // K_IC 한계선
      D.line(ctx, gx, GY(p.KIC), gx + gw, GY(p.KIC), { color: C.KIC, width: 2, hot: hl === 'KIC' });
      D.text(ctx, 'K_IC', gx + gw - 2, GY(p.KIC) - 6, { size: 10, color: hl === 'KIC' ? '#fff' : C.KIC, align: 'right', bold: hl === 'KIC' });
      // 파괴 영역 음영
      ctx.save(); ctx.fillStyle = 'rgba(251,113,133,.10)'; ctx.fillRect(gx, gy, gw, GY(p.KIC) - gy); ctx.restore();
      D.text(ctx, '파괴', gx + 6, gy + 14, { size: 9.5, color: 'rgba(251,113,133,.85)' });
      // a_c 수직선 · 현재 점
      if (ac < aMax) D.line(ctx, GX(ac), gy, GX(ac), gy + gh, { color: C.ac, dash: [3, 4], hot: hl === 'ac' });
      D.dot(ctx, GX(st.a), GY(K), 4.5, crit ? '#fb7185' : C.K, true);
      D.text(ctx, 'K = ' + fmt(K, 1), GX(st.a) + 6, GY(K) - 8,
        { size: 10.5, color: hl === 'K' ? '#fff' : C.K, bold: true });
      D.text(ctx, '균열 길이 a →', gx + gw, gy + gh + 14, { size: 9.5, color: '#61719a', align: 'right' });

      // 안전율 게이지
      const sr = K > .01 ? p.KIC / K : 9;
      const sgy = gy + gh + 42;
      D.text(ctx, '안전율 K_IC / K_I = ' + (sr > 8 ? '∞' : fmt(sr, 2)), gx, sgy,
        { size: 11.5, color: sr >= 1.5 ? '#34d399' : (sr >= 1 ? '#fbbf24' : '#fb7185'), bold: true });
      D.roundRect(ctx, gx, sgy + 10, gw, 8, 4); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fill();
      ctx.fillStyle = sr >= 1.5 ? '#34d399' : (sr >= 1 ? '#fbbf24' : '#fb7185');
      ctx.fillRect(gx, sgy + 10, gw * clamp(sr / 3, 0, 1), 8);
      D.line(ctx, gx + gw / 3, sgy + 6, gx + gw / 3, sgy + 22, { color: '#fff', width: 1.5 });
      D.text(ctx, '1 (파괴)', gx + gw / 3, sgy + 34, { size: 9, color: '#93a2c4', align: 'center' });
    }
  });
})();
