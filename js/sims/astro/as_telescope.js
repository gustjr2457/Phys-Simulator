/* [천문학·별빛 읽기] 망원경의 분해능 — θ = 1.22 λ/D
   망원경을 크게 만드는 이유는 두 가지다. 빛을 많이 모으는 것(D²)과,
   더 '잘게' 보는 것(1/D). 아무리 완벽하게 갈아 만든 렌즈라도 빛이 파동인 이상
   점광원은 점으로 맺히지 않고 에어리 원반으로 퍼지며, 두 별이 그 원반 크기보다
   가까우면 영원히 하나로 보인다. 이것이 회절 한계이고, 지상에서는 대기 흔들림
   (시상)이 그 한계보다 먼저 가로막는다 — 허블을 우주로 올린 이유다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { lgD: '#5eead4', lam: '#fbbf24', lgsep: '#f472b6', seeing: '#fb7185', th: '#a78bfa' };
  const ARC = 206265;                     // 1 rad [arcsec]
  const EYE = .007;                       // 사람 눈 동공 7 mm

  const Dof = p => Math.pow(10, p.lgD);                    // 구경 [m]
  const sepOf = p => Math.pow(10, p.lgsep);                // 두 별 각거리 [arcsec]
  const thDiff = p => 1.22 * (p.lam * 1e-9) / Dof(p) * ARC;  // 회절 한계 [arcsec]
  const thEff = p => Math.sqrt(thDiff(p) * thDiff(p) + p.seeing * p.seeing);
  const resolved = p => sepOf(p) >= thEff(p);
  const gather = p => Math.pow(Dof(p) / EYE, 2);           // 집광력 (사람 눈 대비)

  // 1종 베셀 함수 J1 (급수) — 에어리 무늬 계산용
  function J1(x) {
    if (Math.abs(x) < 1e-8) return x / 2;
    let s = 0, term = x / 2;
    for (let m = 0; m < 42; m++) {
      if (m) term *= -(x * x / 4) / (m * (m + 1));
      s += term;
      if (Math.abs(term) < 1e-14) break;
    }
    return s;
  }
  // 에어리 무늬 세기 (θ: arcsec, 회절한계 th)
  function airy(th0, thd) {
    const u = 3.8317 * Math.abs(th0) / thd;
    if (u < 1e-6) return 1;
    const j = J1(u);
    return Math.pow(2 * j / u, 2);
  }

  const SCOPES = [[.007, '사람 눈'], [.05, '쌍안경'], [.2, '아마추어'], [2.4, '허블'],
                  [6.5, 'JWST'], [10, '켁'], [39, 'ELT']];

  PS.register({
    id: 'as-telescope', mode: 'astro', category: '별빛 읽기',
    title: '망원경의 분해능',
    sub: 'θ = 1.22 λ/D',
    tagline: '망원경을 키우는 이유는 둘입니다 — 빛을 더 모으고(D²), 더 잘게 보는 것(1/D). 빛이 파동인 이상 점은 점으로 맺히지 않고, 그 한계가 분해능입니다.',

    params: [
      { key: 'lgD', symbol: 'D', label: '구경 (10^x m)', unit: '', min: -2.2, max: 1.6, step: .02, value: .38, color: C.lgD, dec: 2, reset: true,
        where: '망원경 <b>주경의 지름</b>(로그 눈금, 0.38 = 2.4 m 허블)입니다. 분해능은 1/D로, 집광력은 D²로 좋아집니다 — 아래 비교 막대에서 현재 위치를 보세요.' },
      { key: 'lam', symbol: 'λ', label: '관측 파장', unit: 'nm', min: 300, max: 3000, step: 25, value: 550, color: C.lam, dec: 0,
        where: '보고 있는 <b>빛의 파장</b>입니다. 파장이 길수록(적외선) 회절이 심해져 같은 구경에서도 흐릿해집니다 — JWST가 허블보다 크면서도 해상도가 비슷한 이유입니다.' },
      { key: 'lgsep', symbol: 'Δθ', label: '두 별의 각거리 (10^x ″)', unit: '', min: -2.5, max: .7, step: .02, value: -1, color: C.lgsep, dec: 2,
        where: '관측하려는 <b>쌍성 두 별 사이의 각도</b>(로그 눈금, −1 = 0.1초각)입니다. 이 값이 분해능보다 커야 둘로 보입니다.' },
      { key: 'seeing', symbol: 's', label: '대기 시상', unit: '″', min: 0, max: 2, step: .05, value: 0, color: C.seeing, dec: 2,
        where: '<b>대기가 흔들어 별상을 번지게 하는 정도</b>입니다. 0 = 우주(허블·JWST), 0.4 = 최상급 산꼭대기, 1~2 = 보통 지상. 구경을 아무리 키워도 이 값보다 잘게 볼 수는 없습니다.' }
    ],
    vars: {
      th: { symbol: 'θ', label: '분해능', unit: '″', color: C.th,
        where: '구분할 수 있는 <b>최소 각도</b>입니다(레일리 기준). 아래 단면 그래프에서 두 봉우리가 막 갈라지는 간격이 이 값입니다.' }
    },
    formulas: [
      { name: '회절 한계 (레일리 기준)', tpl: '{th} = 1.22 {lam} ⁄ {lgD}' },
      { name: '대기를 포함한 유효 분해능', tpl: 'θ_eff = √({th}² + {seeing}²)' },
      { name: '분해 조건', tpl: '{lgsep} ≥ θ_eff' },
      { name: '집광력', tpl: 'A ∝ {lgD}²' }
    ],

    init(p) { return { done: false }; },
    step(st, p, dt) { },

    readouts(st, p) {
      const td = thDiff(p), te = thEff(p), sep = sepOf(p), Dm = Dof(p);
      const limited = p.seeing > td;
      return [
        { label: '구경 D', value: Dm, unit: 'm', color: C.lgD, dec: Dm < 1 ? 3 : 2 },
        { label: '회절 한계 θ', value: td, unit: '″', color: C.th, dec: td < .1 ? 4 : 3 },
        { label: '회절 한계 (밀리초각)', value: td * 1000, unit: 'mas', color: C.th, dec: 1 },
        { label: '유효 분해능 (대기 포함)', value: te, unit: '″', color: C.seeing, dec: te < .1 ? 4 : 3 },
        { label: '두 별의 각거리', value: sep, unit: '″', color: C.lgsep, dec: sep < .1 ? 4 : 3 },
        { label: '집광력 (사람 눈 대비)', value: gather(p), unit: '배', dec: 0, color: '#fbbf24' },
        { label: '한계 등급 (대략)', value: 6 + 2.5 * Math.log10(gather(p)), unit: '등급', dec: 1, color: '#fbbf24' },
        { label: '무엇이 한계인가', wide: true, color: limited ? '#fb7185' : '#34d399',
          value: limited ? '대기(시상)가 한계 — 구경을 더 키워도 소용없다' : '회절이 한계 — 구경을 키우면 좋아진다' },
        { label: '분해 결과', wide: true, color: resolved(p) ? '#34d399' : '#fb7185',
          value: resolved(p) ? '✔ 두 별로 보인다' : '✘ 하나로 뭉쳐 보인다' },
        { label: '달 표면에서 구분 가능한 크기', value: te / ARC * 3.844e8, unit: 'm', dec: 0, color: '#93a2c4' },
        { label: '1 pc 거리에서 구분 가능한 크기', value: te, unit: 'AU', dec: 3, color: '#93a2c4' }
      ];
    },

    notes: [
      '<b>빛이 파동이라서 생기는 한계입니다.</b> 렌즈를 아무리 완벽하게 갈아도 점광원은 점으로 맺히지 않고 "에어리 원반"으로 퍼집니다. 두 별이 그 원반보다 가까우면 어떤 기술로도 갈라 볼 수 없습니다.',
      '<b>구경은 두 가지를 동시에 삽니다</b> — 분해능은 1/D(선형), 집광력은 D²(제곱). 그래서 망원경 경쟁은 언제나 "누가 더 큰 거울을 만드느냐"였고, 지금 짓고 있는 ELT는 39 m입니다.',
      '<b>파장이 길수록 흐릿합니다.</b> JWST(6.5 m)는 허블(2.4 m)보다 2.7배 크지만 주로 적외선(2 µm)으로 보기 때문에 각분해능은 비슷합니다. 대신 허블이 못 보는 파장을 봅니다.',
      '<b>지상 망원경의 진짜 적은 대기입니다.</b> 시상이 1″면 10 m 켁 망원경(회절 한계 0.014″)도 0.07 m 아마추어 망원경 수준의 분해능밖에 못 냅니다 — 구경을 70배 키운 이득이 통째로 사라집니다. 허블을 우주로 올린 이유가 이것입니다.',
      '요즘 지상 대형 망원경은 <b>적응광학</b>으로 대기 흔들림을 실시간 보정해 회절 한계에 근접합니다 — 레이저로 인공별을 만들어 대기 왜곡을 측정하고, 변형 거울을 1초에 수백 번 휘어 되돌립니다.',
      '같은 식이 <b>전파망원경</b>에도 적용됩니다. 전파는 파장이 수 cm~m라 단일 접시로는 분해능이 형편없어서, 여러 망원경을 지구 크기로 늘어놓아 D를 키웁니다(간섭계). 블랙홀 그림자를 찍은 EHT가 바로 이 방법입니다.'
    ],
    presets: [
      { name: '허블 우주망원경 (2.4 m)', set: { lgD: .38, lam: 550, seeing: 0, lgsep: -1 } },
      { name: 'JWST (6.5 m, 적외선)', set: { lgD: .813, lam: 2000, seeing: 0, lgsep: -1 } },
      { name: '켈 망원경 (10 m, 지상)', set: { lgD: 1, lam: 550, seeing: .8, lgsep: -1 } },
      { name: '켁 + 적응광학', set: { lgD: 1, lam: 2200, seeing: .02, lgsep: -1.4 } },
      { name: 'ELT (39 m)', set: { lgD: 1.59, lam: 550, seeing: 0, lgsep: -2 } },
      { name: '사람 눈', set: { lgD: -2.15, lam: 550, seeing: 0, lgsep: -.1 } }
    ],
    challenges: [
      {
        id: 'split', title: '가까운 쌍성 가르기',
        desc: '각거리 0.05″ 이하인 쌍성을 둘로 분해해 보세요.',
        hint: '회절 한계가 그보다 작아야 합니다 — 구경을 키우거나 짧은 파장으로 보세요. 대기 시상은 0으로.',
        check: ({ P }) => sepOf(P) <= .05 && resolved(P)
      },
      {
        id: 'atm', title: '대기의 벽 확인하기',
        desc: '시상 1″ 이상인 지상에서 구경 8 m 넘는 망원경으로도 0.5″ 쌍성을 못 가르는 상황을 만들어 보세요.',
        hint: '유효 분해능 = √(회절² + 시상²)이라, 시상이 크면 구경이 아무리 커도 소용없습니다.',
        check: ({ P }) => P.seeing >= 1 && Dof(P) >= 8 && !resolved(P)
      },
      {
        id: 'ir', title: '적외선의 대가',
        desc: '같은 망원경으로 파장만 2,500 nm 이상으로 올려, 가시광에서는 갈라지던 쌍성이 하나로 뭉치게 만들어 보세요.',
        hint: '먼저 550 nm에서 겨우 분해되는 각거리를 찾고, 파장만 올려 보세요. θ ∝ λ 입니다.',
        check: ({ P }) => P.lam >= 2500 && !resolved(P) &&
          sepOf(P) >= Math.sqrt(Math.pow(1.22 * 550e-9 / Dof(P) * ARC, 2) + P.seeing * P.seeing)
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const td = thDiff(p), te = thEff(p), sep = sepOf(p), ok = resolved(p);
      const span = Math.max(sep * 2.6, te * 4);               // 시야 반폭 [arcsec]

      /* ── 두 별의 상 ── */
      const vx = w * .26, vy = h * .28, vr = Math.min(86, h * .19);
      const S = a => a / span * vr;
      ctx.save();
      ctx.beginPath(); ctx.arc(vx, vy, vr, 0, 7);
      ctx.fillStyle = 'rgba(6,11,24,.9)'; ctx.fill();
      ctx.strokeStyle = 'rgba(147,162,196,.35)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.clip();
      [-1, 1].forEach(s => {
        const px = vx + S(sep / 2) * s;
        const g = ctx.createRadialGradient(px, vy, 0, px, vy, Math.max(3, S(te * 1.4)));
        g.addColorStop(0, 'rgba(255,255,255,.95)');
        g.addColorStop(.35, 'rgba(210,228,255,.55)');
        g.addColorStop(1, 'rgba(160,200,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, vy, Math.max(3, S(te * 1.4)), 0, 7); ctx.fill();
        // 시상이 없으면 에어리 고리를 그린다
        if (p.seeing < td * .3) {
          ctx.strokeStyle = 'rgba(190,215,255,.22)'; ctx.lineWidth = 1;
          [1.63, 2.68].forEach(k => { ctx.beginPath(); ctx.arc(px, vy, S(td * k), 0, 7); ctx.stroke(); });
        }
      });
      ctx.restore();
      D.text(ctx, '망원경으로 본 쌍성', vx, vy - vr - 11, { size: 10.5, color: '#61719a', align: 'center' });
      D.text(ctx, ok ? '두 별로 보인다' : '하나로 뭉쳐 보인다', vx, vy + vr + 17,
        { size: 11.5, color: ok ? '#34d399' : '#fb7185', align: 'center', bold: true });

      /* ── 세기 단면 ── */
      const px0 = Math.min(w * .52, vx + vr + 44), py0 = 56;
      const pw = Math.max(170, w - px0 - 44), phh = Math.min(h * .34, 160);
      D.roundRect(ctx, px0, py0, pw, phh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      D.text(ctx, '세기 단면 — 두 봉우리가 갈라지는가', px0 + 4, py0 - 9, { size: 10.5, color: '#61719a' });
      const PX = a => px0 + pw * (a / (2 * span) + .5);
      const N = 150;
      // 시상이 있으면 가우시안 번짐을 더해 유효 분해능으로 환산한 프로파일을 쓴다
      const useAiry = p.seeing < td * .3;
      const sig = te / 2.3548;
      const prof = a => useAiry ? airy(a, td) : Math.exp(-(a * a) / (2 * sig * sig));
      const tot = a => prof(a - sep / 2) + prof(a + sep / 2);
      let peak = 0;
      for (let i = 0; i <= N; i++) { const a = -span + 2 * span * i / N; peak = Math.max(peak, tot(a)); }
      const PY = v => py0 + phh - clamp(v / peak, 0, 1) * (phh - 8) - 4;
      // 각 별의 기여
      [-1, 1].forEach(s => {
        ctx.save(); ctx.strokeStyle = 'rgba(147,162,196,.35)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let i = 0; i <= N; i++) { const a = -span + 2 * span * i / N; const X = PX(a), Y = PY(prof(a - s * sep / 2)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke(); ctx.restore();
      });
      // 합
      ctx.save();
      ctx.strokeStyle = ok ? '#34d399' : '#fb7185'; ctx.lineWidth = 2.4;
      if (hl === 'th') { ctx.shadowColor = C.th; ctx.shadowBlur = 12; }
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const a = -span + 2 * span * i / N; const X = PX(a), Y = PY(tot(a)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke(); ctx.restore();
      // 각거리 치수선
      D.dim(ctx, PX(-sep / 2), py0 + phh - 6, PX(sep / 2), py0 + phh - 6,
        'Δθ = ' + (sep < .1 ? fmt(sep * 1000, 1) + ' mas' : fmt(sep, 3) + '″'), C.lgsep, hl === 'lgsep');
      // 분해능 눈금
      D.line(ctx, PX(-te / 2), py0 + 6, PX(-te / 2), py0 + phh - 18, { color: C.th, dash: [3, 4] });
      D.line(ctx, PX(te / 2), py0 + 6, PX(te / 2), py0 + phh - 18, { color: C.th, dash: [3, 4] });
      D.text(ctx, 'θ_eff = ' + (te < .1 ? fmt(te * 1000, 1) + ' mas' : fmt(te, 3) + '″'),
        px0 + pw - 4, py0 + 14, { size: 10.5, color: hl === 'th' ? '#fff' : C.th, align: 'right', bold: true });

      /* ── 망원경 비교 ── */
      const bx = 48, by = h - 112, bw = Math.min(w - 96, 500);
      D.text(ctx, '구경 비교 — 분해능은 1/D, 집광력은 D²', bx, by - 10, { size: 10.5, color: '#61719a' });
      const LO = Math.log10(.005), HI = Math.log10(45);
      const BX = d => bx + bw * clamp((Math.log10(clamp(d, .005, 45)) - LO) / (HI - LO), 0, 1);
      D.line(ctx, bx, by + 10, bx + bw, by + 10, { color: 'rgba(147,162,196,.25)', width: 2 });
      SCOPES.forEach(([d, nm], i) => {
        D.line(ctx, BX(d), by + 5, BX(d), by + 15, { color: 'rgba(147,162,196,.5)', width: 1.4 });
        D.text(ctx, nm, BX(d), by + (i % 2 ? 28 : -2), { size: 8.5, color: '#93a2c4', align: 'center' });
      });
      ctx.save(); ctx.shadowColor = C.lgD; ctx.shadowBlur = 12;
      D.dot(ctx, BX(Dof(p)), by + 10, 6, C.lgD, true); ctx.restore();
      D.text(ctx, 'D = ' + (Dof(p) < 1 ? fmt(Dof(p) * 100, 1) + ' cm' : fmt(Dof(p), 2) + ' m'),
        bx, by + 48, { size: 12, color: hl === 'lgD' ? '#fff' : C.lgD, bold: true });
      D.text(ctx, 'λ = ' + fmt(p.lam, 0) + ' nm', bx + 150, by + 48,
        { size: 11, color: hl === 'lam' ? '#fff' : C.lam });
      D.text(ctx, p.seeing > 0 ? '시상 ' + fmt(p.seeing, 2) + '″ (지상)' : '대기 없음 (우주)',
        bx + 280, by + 48, { size: 11, color: p.seeing > td ? C.seeing : '#34d399' });
      if (p.seeing > td)
        D.text(ctx, '→ 대기가 회절보다 ' + fmt(p.seeing / td, 0) + '배 큰 한계 — 구경을 키워도 소용없다',
          bx, by + 68, { size: 10.5, color: C.seeing });
      else
        D.text(ctx, '→ 회절 한계에 도달 — 구경을 키우면 그만큼 좋아진다',
          bx, by + 68, { size: 10.5, color: '#34d399' });
    }
  });
})();
