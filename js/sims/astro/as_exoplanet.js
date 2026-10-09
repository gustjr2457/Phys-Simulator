/* [천문학·다른 별의 행성] 외계행성 찾기 — 시선속도법과 트랜싯법
   K ≈ 0.09 (M_p/M⊕)·sin i·√(1AU/a · M☉/M★) [m/s],   δ = (R_p/R★)²
   외계행성은 거의 전부 '간접 관측'으로 찾는다. 행성이 별을 끌어당겨 별이 조금
   흔들리면(시선속도법) 스펙트럼선이 주기적으로 떨리고, 행성이 별 앞을 지나가면
   (트랜싯법) 별빛이 아주 조금 어두워진다. 2025년 9월 NASA 확인 외계행성이
   6,000개를 넘었는데, 그 대부분이 이 두 방법으로 찾은 것이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { lgM: '#f472b6', lga: '#5eead4', Ms: '#fbbf24', inc: '#a78bfa',
              P: '#93a2c4', K: '#fb7185', dep: '#60a5fa' };
  const RE_RS = 6371 / 696000;          // 지구 반지름 / 태양 반지름
  const RS_AU = 696000 / 1.496e8;       // 태양 반지름 / 1 AU
  const SHOW = 10;                      // 공전 한 바퀴를 화면 10초로

  const mpOf = p => Math.pow(10, p.lgM);                   // 행성 질량 [M⊕]
  const aOf = p => Math.pow(10, p.lga);                    // 공전 반지름 [AU]
  const perOf = p => Math.sqrt(Math.pow(aOf(p), 3) / p.Ms);  // 공전 주기 [년]
  const rstar = p => Math.pow(p.Ms, .8);                   // 별 반지름 [R☉]
  function rplanet(p) {                                     // 질량-반지름 관계 [R⊕]
    const M = mpOf(p);
    return M <= 4 ? Math.pow(M, .27) : Math.min(12, 1.45 * Math.pow(M / 4, .45));
  }
  const Kof = p => .09 * mpOf(p) * Math.sin(p.inc * Math.PI / 180) *
                   Math.sqrt((1 / aOf(p)) * (1 / p.Ms));   // 시선속도 반진폭 [m/s]
  const depthOf = p => Math.pow(rplanet(p) * RE_RS / rstar(p), 2);          // 트랜싯 깊이
  const probOf = p => clamp(rstar(p) * RS_AU / aOf(p), 0, 1);               // 트랜싯 확률
  const bOf = p => Math.abs(Math.cos(p.inc * Math.PI / 180)) / Math.max(probOf(p), 1e-9); // 충돌 매개변수
  const transits = p => bOf(p) < 1;
  const durOf = p => {                                      // 트랜싯 지속 시간 [시간]
    const b = bOf(p); if (b >= 1) return 0;
    return perOf(p) * 8766 / Math.PI * probOf(p) * Math.sqrt(1 - b * b);
  };

  PS.register({
    id: 'as-exoplanet', mode: 'astro', category: '다른 별의 행성',
    title: '외계행성 찾기',
    sub: 'K ∝ M_p/√a,  δ = (R_p/R★)²',
    tagline: '외계행성은 거의 전부 간접 관측입니다. 행성이 별을 흔들면 스펙트럼선이 떨리고(시선속도법), 별 앞을 지나가면 별빛이 아주 조금 어두워집니다(트랜싯법).',

    params: [
      { key: 'lgM', symbol: 'M_p', label: '행성 질량 (10^x M⊕)', unit: '', min: -.3, max: 3, step: .05, value: 0, color: C.lgM, dec: 2, reset: true,
        where: '행성의 <b>질량</b>(로그 눈금, 0 = 지구 · 2.5 = 목성)입니다. 시선속도 K에 정비례해서, 무거울수록 별을 세게 흔들어 찾기 쉬워집니다.' },
      { key: 'lga', symbol: 'a', label: '공전 반지름 (10^x AU)', unit: '', min: -1.7, max: .7, step: .05, value: 0, color: C.lga, dec: 2, reset: true,
        where: '행성이 별에서 <b>얼마나 떨어져 도는가</b>(로그 눈금, 0 = 1 AU = 지구 궤도)입니다. 가까울수록 주기가 짧고, K도 트랜싯 확률도 커져 압도적으로 찾기 쉽습니다.' },
      { key: 'Ms', symbol: 'M★', label: '별의 질량', unit: 'M☉', min: .2, max: 2, step: .05, value: 1, color: C.Ms, dec: 2, reset: true,
        where: '<b>중심별의 질량</b>입니다. 가벼운 별일수록 같은 행성에 더 크게 흔들리고, 별도 작아서 트랜싯이 더 깊어집니다 — 적색왜성이 외계행성 사냥의 주 무대인 이유입니다.' },
      { key: 'inc', symbol: 'i', label: '궤도 경사', unit: '°', min: 80, max: 90, step: .1, value: 90, color: C.inc, dec: 1, reset: true,
        where: '궤도면이 <b>우리 시선과 이루는 각</b>입니다. 90°면 정확히 옆에서 보는 것이라 행성이 별 앞을 가로지릅니다. 조금만 기울어도 트랜싯은 사라지고, 시선속도도 sin i만큼 줄어듭니다.' }
    ],
    vars: {
      P: { symbol: 'P', label: '공전 주기', unit: '일', color: C.P,
        where: '행성이 <b>한 바퀴 도는 데 걸리는 시간</b>입니다(케플러 3법칙). 두 그래프의 반복 주기이기도 합니다.' },
      K: { symbol: 'K', label: '시선속도 반진폭', unit: 'm/s', color: C.K,
        where: '행성이 끌어당겨 <b>별이 흔들리는 속도</b>입니다. 위 그래프 사인파의 높이이고, 이 값이 분광기의 정밀도보다 커야 검출됩니다.' },
      dep: { symbol: 'δ', label: '트랜싯 깊이', unit: 'ppm', color: C.dep,
        where: '행성이 별 앞을 가릴 때 <b>별빛이 줄어드는 비율</b>입니다. 아래 광도 곡선의 움푹 팬 깊이로, 면적비 (R_p/R★)²와 정확히 같습니다.' }
    },
    formulas: [
      { name: '케플러 제3법칙', tpl: '{P}² = {lga}³ ⁄ {Ms}' },
      { name: '시선속도 반진폭', tpl: '{K} ≈ 0.09 · {lgM} · sin {inc} · √(1⁄{lga} · 1⁄{Ms})' },
      { name: '트랜싯 깊이 (면적비)', tpl: '{dep} = (R_p ⁄ R★)²' },
      { name: '트랜싯이 일어날 확률', tpl: 'p ≈ R★ ⁄ {lga}' }
    ],

    init(p) { return { done: false }; },
    step(st, p, dt) { if (st.t > SHOW * 3.2) st.done = true; },

    graphs: [{
      title: '시선속도 — 별이 흔들린다', xmin: SHOW * 2, window: SHOW * 2.2,
      series: [{ key: 'rv', label: 'v (m/s)', color: C.K }]
    }, {
      title: '광도 곡선 — 별빛이 가려진다', xmin: SHOW * 2, window: SHOW * 2.2,
      series: [{ key: 'flux', label: '밝기 (ppm 감소)', color: C.dep }]
    }],
    sample(st, p) {
      const ph = (st.t / SHOW) * 2 * Math.PI;
      let dip = 0;
      if (transits(p)) {
        // 트랜싯은 행성이 우리 쪽(위상 0 근처)에 올 때 일어난다
        const half = Math.PI * durOf(p) / (perOf(p) * 8766);
        let dph = ((ph + Math.PI) % (2 * Math.PI)) - Math.PI;
        if (Math.abs(dph) < half) dip = depthOf(p) * 1e6;
      }
      return { rv: Kof(p) * Math.sin(ph), flux: -dip };
    },

    readouts(st, p) {
      const P = perOf(p), K = Kof(p), dep = depthOf(p) * 1e6, prob = probOf(p);
      const Rp = rplanet(p), tr = transits(p);
      return [
        { label: '공전 주기 P', value: P * 365.25, unit: '일', color: C.P, dec: P * 365.25 > 100 ? 0 : 2 },
        { label: '행성 반지름 (추정)', value: Rp, unit: 'R⊕', color: C.lgM, dec: 2 },
        { label: '행성 질량', value: mpOf(p), unit: 'M⊕', color: C.lgM, dec: mpOf(p) > 10 ? 0 : 2 },
        { label: '시선속도 반진폭 K', value: K, unit: 'm/s', color: C.K, dec: K < 1 ? 3 : 2 },
        { label: '트랜싯 깊이 δ', value: dep, unit: 'ppm', color: C.dep, dec: dep > 100 ? 0 : 1 },
        { label: '트랜싯 확률', value: prob * 100, unit: '%', dec: 2, color: '#93a2c4' },
        { label: '충돌 매개변수 b', value: bOf(p), unit: '', dec: 2, color: C.inc },
        { label: '트랜싯 지속 시간', value: durOf(p), unit: '시간', dec: 2, color: C.dep },
        { label: '시선속도법으로 찾을 수 있나', wide: true,
          color: K >= 1 ? '#34d399' : (K >= .25 ? '#fbbf24' : '#fb7185'),
          value: K >= 1 ? '✔ HARPS급(1 m/s)으로 가능' :
                 (K >= .25 ? '△ ESPRESSO급(0.25 m/s)이 필요' : '✘ 현재 기술로는 어렵다') },
        { label: '트랜싯법으로 찾을 수 있나', wide: true,
          color: !tr ? '#fb7185' : (dep >= 100 ? '#34d399' : (dep >= 20 ? '#fbbf24' : '#fb7185')),
          value: !tr ? '✘ 궤도가 기울어 별 앞을 지나지 않는다' :
                 (dep >= 100 ? '✔ TESS급(100 ppm)으로 가능' :
                  (dep >= 20 ? '△ 케플러급(20 ppm)이 필요' : '✘ 너무 얕다')) },
        { label: '표면 온도 (대략, 알베도 0.3)', dec: 0, unit: 'K', color: '#fb923c',
          value: 278 * Math.pow(p.Ms, 1.75) / Math.sqrt(aOf(p)) }
      ];
    },

    notes: [
      '<b>두 방법은 서로 다른 것을 알려 줍니다.</b> 시선속도법은 질량(정확히는 M sin i), 트랜싯법은 반지름을 줍니다. 둘 다 성공한 행성만 <b>밀도</b>를 알 수 있고, 그래야 암석인지 가스인지 판별됩니다 — 그래서 두 방법을 함께 씁니다.',
      '<b>가깝고 무거운 행성이 압도적으로 찾기 쉽습니다.</b> K ∝ M_p/√a, 트랜싯 확률 ∝ 1/a 이기 때문입니다. 그래서 초기에 발견된 외계행성이 전부 "뜨거운 목성"이었습니다 — 그런 행성이 흔해서가 아니라 <b>그것만 보였기</b> 때문입니다(관측 선택 효과).',
      '지구가 태양을 흔드는 속도는 <b>초속 9 cm</b>, 가리는 빛은 <b>100만분의 84</b>입니다. 사람이 걷는 속도의 20분의 1을, 수십 광년 밖에서 재야 한다는 뜻입니다 — 제2의 지구 탐색이 어려운 이유가 이 두 숫자에 다 들어 있습니다.',
      '<b>적색왜성이 유리합니다.</b> 별이 가벼우면 더 크게 흔들리고, 별이 작으면 같은 행성이 더 깊은 트랜싯을 만듭니다. 트라피스트-1(0.09 M☉)에서 지구 크기 행성 7개를 찾은 것이 이 덕분입니다.',
      '<b>경사각을 조금만 기울여 보세요.</b> 90°에서 1°만 벗어나도 지구 같은 궤도에서는 트랜싯이 사라집니다. 트랜싯법으로 찾은 행성은 전부 "운 좋게 궤도면이 우리 쪽을 향한" 소수이고, 확률은 지구-태양의 경우 0.5%도 안 됩니다.',
      '2025년 9월 NASA 확인 외계행성이 <b>6,000개</b>를 넘었습니다(12월 기준 6,065개). 통계적으로 우리은하의 별 대부분이 행성을 거느린다는 뜻이고, 후보까지 더하면 훨씬 많습니다.'
    ],
    presets: [
      { name: '지구 (찾기 가장 어려운 쪽)', set: { lgM: 0, lga: 0, Ms: 1, inc: 90 } },
      { name: '목성', set: { lgM: 2.5, lga: .716, Ms: 1, inc: 90 } },
      { name: '뜨거운 목성 (51 페가시 b)', set: { lgM: 2.2, lga: -1.3, Ms: 1.1, inc: 90 } },
      { name: '슈퍼지구 (적색왜성 주위)', set: { lgM: .7, lga: -1.1, Ms: .3, inc: 90 } },
      { name: '트라피스트-1 e 비슷하게', set: { lgM: -.1, lga: -1.55, Ms: .2, inc: 90 } },
      { name: '살짝 기울어 트랜싯 실패', set: { lgM: 2.5, lga: 0, Ms: 1, inc: 89 } }
    ],
    challenges: [
      {
        id: 'earth', title: '제2의 지구는 왜 어려운가',
        desc: '태양 같은 별(0.9~1.1 M☉)의 1 AU 궤도에 지구 질량 행성을 놓고, 시선속도 K와 트랜싯 깊이가 얼마나 작은지 확인하세요.',
        hint: '세 슬라이더를 모두 기본값 근처로. K는 0.09 m/s, 깊이는 84 ppm이 나옵니다 — 둘 다 현재 기술의 한계선입니다.',
        check: ({ P }) => P.Ms >= .9 && P.Ms <= 1.1 && aOf(P) >= .9 && aOf(P) <= 1.1 && mpOf(P) >= .8 && mpOf(P) <= 1.3
      },
      {
        id: 'hotjup', title: '뜨거운 목성 만들기',
        desc: '시선속도 K가 50 m/s를 넘는 행성계를 만들어 보세요 — 1995년에 처음 발견된 외계행성이 이런 종류였습니다.',
        hint: '무거운 행성(목성급)을 아주 가까운 궤도(0.05 AU 근처)에 놓으세요. K ∝ M_p/√a 입니다.',
        check: ({ P }) => Kof(P) >= 50
      },
      {
        id: 'prob', title: '트랜싯 확률 10% 넘기기',
        desc: '행성이 별 앞을 지나갈 확률을 10% 이상으로 만들어 보세요 — 대량 탐사의 효율이 여기서 결정됩니다.',
        hint: '확률 ≈ R★/a 입니다. 궤도를 아주 가깝게 하거나 별을 크게 하세요.',
        check: ({ P }) => probOf(P) >= .1
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const K = Kof(p), dep = depthOf(p), prob = probOf(p), Rp = rplanet(p), tr = transits(p);
      const ph = (st.t / SHOW) * 2 * Math.PI;

      /* ── 옆에서 본 행성계 ── */
      const cx = w * .33, cy = h * .30;
      const srad = clamp(16 + rstar(p) * 16, 12, 44);
      const orb = Math.min(w * .26, 150);
      const b = Math.min(bOf(p), 1.6);
      const py = cy + b * srad;                                  // 궤도면이 기울어진 만큼 위아래로
      const px = cx + Math.sin(ph) * orb;
      const front = Math.cos(ph) < 0;                            // 우리 쪽(앞)인가

      // 궤도
      ctx.save(); ctx.strokeStyle = 'rgba(94,234,212,.3)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, (cy + py) / 2, orb, Math.max(3, b * srad * .5 + 5), 0, 0, 7); ctx.stroke(); ctx.restore();

      // 별 (무게중심 둘레로 흔들린다 — 과장)
      const wob = clamp(K * .5, 0, 12);
      const sx2 = cx - Math.sin(ph) * wob;
      if (!front) { D.dot(ctx, px, py, Math.max(2.5, srad * Rp * RE_RS / rstar(p) * 1.6), '#8aa0c8', false); }
      ctx.save();
      const g = ctx.createRadialGradient(sx2, cy, 0, sx2, cy, srad * 2.2);
      g.addColorStop(0, 'rgba(255,236,180,.9)'); g.addColorStop(.4, 'rgba(255,210,120,.4)'); g.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx2, cy, srad * 2.2, 0, 7); ctx.fill();
      if (hl === 'Ms' || hl === 'K') { ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 22; }
      ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(sx2, cy, srad, 0, 7); ctx.fill();
      ctx.restore();
      if (front) {
        const prad = Math.max(2.5, srad * Rp * RE_RS / rstar(p) * 1.6);
        ctx.save(); if (hl === 'lgM' || hl === 'dep') { ctx.shadowColor = C.dep; ctx.shadowBlur = 14; }
        D.dot(ctx, px, py, prad, '#1b2742', false);
        ctx.strokeStyle = 'rgba(96,165,250,.7)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(px, py, prad, 0, 7); ctx.stroke(); ctx.restore();
      }
      // 별의 흔들림 화살표
      D.arrow(ctx, cx, cy - srad - 16, -Math.sin(ph) * clamp(K * 1.2, 4, 40), 0,
        { color: C.K, width: 2.6, head: 7, hot: hl === 'K' });
      D.tag(ctx, 'K = ' + (K < 1 ? fmt(K, 3) : fmt(K, 1)) + ' m/s', cx, cy - srad - 36, C.K, hl === 'K');
      D.line(ctx, cx - orb - 20, cy + srad + 26, cx + orb + 20, cy + srad + 26, { color: 'rgba(147,162,196,.2)', dash: [4, 5] });
      D.text(ctx, tr ? '우리 시선 — 행성이 별 앞을 지난다' : '우리 시선 — 행성이 별을 비껴간다',
        cx, cy + srad + 42, { size: 10, color: tr ? '#34d399' : '#fb7185', align: 'center' });

      /* ── 검출 가능성 패널 ── */
      const bx = Math.min(w - 196, cx + orb + 54), by = 56;
      if (bx > cx + orb + 20) {
        D.text(ctx, '검출 가능성', bx, by - 10, { size: 10.5, color: '#61719a' });
        // 시선속도
        const kLO = Math.log10(.01), kHI = Math.log10(300);
        const KX = v => bx + clamp((Math.log10(clamp(v, .01, 300)) - kLO) / (kHI - kLO), 0, 1) * 170;
        D.text(ctx, '시선속도 K', bx, by + 10, { size: 10, color: C.K });
        D.roundRect(ctx, bx, by + 16, 170, 9, 4); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
        ctx.fillStyle = 'rgba(52,211,153,.3)'; ctx.fillRect(KX(1), by + 16, bx + 170 - KX(1), 9);
        [[1, 'HARPS', 0], [.25, 'ESPRESSO', 1]].forEach(([v, lab, row]) => {
          D.line(ctx, KX(v), by + 12, KX(v), by + 29 + row * 9, { color: '#93a2c4', width: 1.2 });
          D.text(ctx, lab, KX(v), by + 40 + row * 10, { size: 8, color: '#93a2c4', align: 'center' });
        });
        ctx.save(); ctx.shadowColor = C.K; ctx.shadowBlur = 10;
        D.dot(ctx, KX(K), by + 20.5, 5, C.K, true); ctx.restore();
        // 트랜싯 깊이
        const dLO = Math.log10(1), dHI = Math.log10(3e4);
        const DX = v => bx + clamp((Math.log10(clamp(v, 1, 3e4)) - dLO) / (dHI - dLO), 0, 1) * 170;
        D.text(ctx, '트랜싯 깊이 δ', bx, by + 66, { size: 10, color: C.dep });
        D.roundRect(ctx, bx, by + 72, 170, 9, 4); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
        ctx.fillStyle = 'rgba(52,211,153,.3)'; ctx.fillRect(DX(100), by + 72, bx + 170 - DX(100), 9);
        [[20, '케플러'], [100, 'TESS']].forEach(([v, lab]) => {
          D.line(ctx, DX(v), by + 68, DX(v), by + 85, { color: '#93a2c4', width: 1.2 });
          D.text(ctx, lab, DX(v), by + 96, { size: 8, color: '#93a2c4', align: 'center' });
        });
        if (tr) { ctx.save(); ctx.shadowColor = C.dep; ctx.shadowBlur = 10; D.dot(ctx, DX(dep * 1e6), by + 76.5, 5, C.dep, true); ctx.restore(); }
        else D.text(ctx, '트랜싯 없음', bx + 85, by + 80, { size: 10, color: '#fb7185', align: 'center', bold: true });
        // 요약
        D.text(ctx, 'P = ' + fmt(perOf(p) * 365.25, perOf(p) * 365.25 > 100 ? 0 : 2) + ' 일',
          bx, by + 122, { size: 11, color: hl === 'P' ? '#fff' : C.P });
        D.text(ctx, 'R_p = ' + fmt(Rp, 2) + ' R⊕   ·   트랜싯 확률 ' + fmt(prob * 100, 2) + '%',
          bx, by + 140, { size: 10, color: '#93a2c4' });
      }

      /* ── 질량-반지름 분포 (행성의 종류) ── */
      const qx = 48, qy = h - 118, qw = Math.min(w - 96, 420), qh = 92;
      if (qy > cy + 60) {
        D.roundRect(ctx, qx, qy, qw, qh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
        D.text(ctx, '질량 – 반지름 (행성의 종류)', qx + 4, qy - 8, { size: 10.5, color: '#61719a' });
        const QX = M => qx + clamp((Math.log10(clamp(M, .5, 1000)) - Math.log10(.5)) / (Math.log10(1000) - Math.log10(.5)), 0, 1) * qw;
        const QY = R => qy + qh - clamp(R / 13, 0, 1) * qh;
        ctx.save(); ctx.strokeStyle = 'rgba(244,114,182,.6)'; ctx.lineWidth = 1.8; ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const M = .5 * Math.pow(2000, i / 80);
          const R = M <= 4 ? Math.pow(M, .27) : Math.min(12, 1.45 * Math.pow(M / 4, .45));
          const X = QX(M), Y = QY(R); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.stroke(); ctx.restore();
        [[1, '지구'], [17, '해왕성'], [318, '목성']].forEach(([M, lab]) => {
          const R = M <= 4 ? Math.pow(M, .27) : Math.min(12, 1.45 * Math.pow(M / 4, .45));
          D.dot(ctx, QX(M), QY(R), 3, '#93a2c4', false);
          D.text(ctx, lab, QX(M), QY(R) - 8, { size: 8.5, color: '#93a2c4', align: 'center' });
        });
        ctx.save(); ctx.shadowColor = C.lgM; ctx.shadowBlur = 12;
        D.dot(ctx, QX(mpOf(p)), QY(Rp), 5, C.lgM, true); ctx.restore();
        D.text(ctx, '질량 (M⊕, 로그) →', qx + qw, qy + qh + 14, { size: 9, color: '#61719a', align: 'right' });
      }
    }
  });
})();
