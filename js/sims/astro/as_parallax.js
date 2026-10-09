/* [천문학·우주의 크기 재기] 연주시차 — 우주에서 거리를 재는 유일한 '직접' 방법
   d [pc] = 1 ⁄ p [″]
   지구가 태양 둘레를 도는 동안 가까운 별은 먼 배경별에 대해 아주 조금 왔다 갔다 한다.
   그 흔들림의 각도 하나로 거리가 나온다 — 삼각측량이고, 가정이 하나도 필요 없다.
   거리 사다리의 맨 아래 칸이며, 세페이드 변광성도 Ia형 초신성도 허블 법칙도
   전부 이 칸 위에서 눈금을 얻는다. 1838년 베셀이 백조자리 61에서 처음 성공했다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { lgd: '#5eead4', lgs: '#fb7185', p: '#fbbf24', d: '#a78bfa', sn: '#34d399' };
  const YEAR = 6;                       // 1년을 화면 6초로
  const PC_LY = 3.2616;

  const dOf = p => Math.pow(10, p.lgd);                 // 거리 [pc]
  const sigOf = p => Math.pow(10, p.lgs);               // 측정 정밀도 [µas]
  const parMas = p => 1000 / dOf(p);                    // 연주시차 [mas]
  const snOf = p => parMas(p) * 1000 / sigOf(p);        // 신호 대 잡음비
  const dMax = p => 1000 / (sigOf(p) * 5 / 1000);       // S/N = 5가 되는 한계 거리 [pc]

  // 결정적 유사난수 (배경별 · 관측 잡음 재현용)
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const gauss = i => (rnd(i) + rnd(i + 97) + rnd(i + 211) - 1.5) * 1.15;

  const LADDER = [
    [1, 2e4, '연주시차', '#5eead4', '삼각측량 — 가정이 필요 없는 유일한 방법'],
    [1e3, 3e7, '세페이드 변광성', '#fbbf24', '맥동 주기가 광도를 알려 준다 (주기-광도 관계)'],
    [3e6, 3e9, 'Ia형 초신성', '#fb7185', '폭발 밝기가 항상 같다 — 표준 촛불'],
    [1e8, 4e9, '허블 법칙', '#a78bfa', '적색편이로 거리를 잰다']
  ];

  PS.register({
    id: 'as-parallax', mode: 'astro', category: '우주의 크기 재기',
    title: '연주시차와 거리 사다리',
    sub: 'd [pc] = 1 / p [″]',
    tagline: '별까지의 거리를 재는 가장 정직한 방법. 지구가 공전하는 동안 가까운 별이 배경별에 대해 그리는 작은 타원 — 그 각도 하나면 됩니다.',

    params: [
      { key: 'lgd', symbol: 'd', label: '별까지의 거리 (10^x pc)', unit: '', min: 0, max: 4.3, step: .02, value: .114, color: C.lgd, dec: 2, reset: true,
        where: '별까지의 <b>거리</b>입니다(로그 눈금). 멀수록 시차가 작아져 — 왼쪽 그림의 두 시선이 평행에 가까워지고, 오른쪽 하늘에서 별이 그리는 타원이 작아집니다.' },
      { key: 'lgs', symbol: 'σ', label: '측정 정밀도 (10^x µas)', unit: '', min: 0, max: 5.2, step: .1, value: 1.3, color: C.lgs, dec: 1,
        where: '망원경이 별의 위치를 재는 <b>오차</b>입니다(로그 눈금). 가이아 20 µas · 허블 100 µas · 지상 망원경 수만 µas. 오른쪽 하늘 그림에서 측정점이 흩어지는 정도입니다.' }
    ],
    vars: {
      p: { symbol: 'p', label: '연주시차', unit: 'mas', color: C.p,
        where: '지구 궤도 반지름(1 AU)이 그 별에서 <b>보이는 각도</b>입니다. 별이 하늘에 그리는 타원의 긴반지름이기도 합니다.' },
      d: { symbol: 'd', label: '거리', unit: 'pc', color: C.d,
        where: '시차의 역수입니다. <b>1 파섹</b>은 시차가 정확히 1초각이 되는 거리로, 3.26 광년입니다 — 파섹이라는 단위 자체가 이 식에서 나왔습니다.' },
      sn: { symbol: 'S/N', label: '신호 대 잡음비', unit: '', color: C.sn,
        where: '시차를 측정 오차로 나눈 값입니다. 보통 <b>5 이상</b>이어야 "거리를 쟀다"고 말할 수 있습니다.' }
    },
    formulas: [
      { name: '시차와 거리 (파섹의 정의)', tpl: '{d} [pc] = 1 ⁄ {p} [″]' },
      { name: '삼각측량', tpl: 'tan {p} = 1 AU ⁄ {d}' },
      { name: '측정이 되는가', tpl: '{sn} = {p} ⁄ σ ≥ 5' },
      { name: '단위', tpl: '1 pc = 3.26 광년 = 206265 AU' }
    ],

    init(p) { return { meas: [], done: false }; },
    step(st, p, dt) {
      // 1년에 12번쯤 관측한다
      const n = Math.floor(st.t / (YEAR / 12));
      while (st.meas.length < n && st.meas.length < 240) {
        const k = st.meas.length;
        const ph = (k / 12) * 2 * Math.PI;
        st.meas.push({ ph: ph, ex: gauss(k * 3 + 1), ey: gauss(k * 3 + 2) });
      }
      if (st.t > YEAR * 2.4) st.done = true;
    },

    graphs: [{
      title: '하늘에서의 위치 (적경 방향) – 시간 — 1년 주기로 흔들린다', xmin: 12, window: 14,
      series: [
        { key: 'obs', label: '관측값 (오차 포함)', color: '#e8eefc' },
        { key: 'tru', label: '참값', color: C.p }
      ]
    }],
    sample(st, p) {
      const pm = parMas(p), sg = sigOf(p) / 1000;          // mas
      const ph = st.t / YEAR * 2 * Math.PI;
      const tru = pm * Math.cos(ph);
      return { tru: tru, obs: tru + gauss(Math.floor(st.t * 60) + 7) * sg };
    },

    readouts(st, p) {
      const d = dOf(p), pm = parMas(p), sn = snOf(p), sg = sigOf(p);
      return [
        { label: '연주시차 p', value: pm, unit: 'mas', color: C.p, dec: pm < 1 ? 4 : 2 },
        { label: '거리 d', value: d, unit: 'pc', color: C.d, dec: d > 100 ? 0 : 2 },
        { label: '거리 (광년)', value: d * PC_LY, unit: '광년', color: C.d, dec: d > 100 ? 0 : 2 },
        { label: '측정 정밀도 σ', value: sg, unit: 'µas', color: C.lgs, dec: sg > 100 ? 0 : 2 },
        { label: '신호 대 잡음비 S/N', value: sn, unit: '', color: C.sn, dec: 2 },
        { label: '거리 오차', value: sn > .2 ? 100 / sn : Infinity, unit: '%', dec: 1,
          color: sn >= 10 ? '#34d399' : (sn >= 5 ? '#fbbf24' : '#fb7185') },
        { label: '이 정밀도로 잴 수 있는 최대 거리', value: dMax(p), unit: 'pc', dec: 0, color: '#93a2c4' },
        { label: '판정', wide: true, color: sn >= 10 ? '#34d399' : (sn >= 5 ? '#fbbf24' : '#fb7185'),
          value: sn >= 10 ? '✔ 정밀하게 측정됨' : (sn >= 5 ? '△ 겨우 측정됨 (오차가 크다)' : '✘ 잡음에 묻혔다 — 거리를 알 수 없다') },
        { label: '어느 사다리 칸인가', wide: true, color: '#fbbf24',
          value: d < 2e4 ? '연주시차로 직접 측정 가능한 범위' : '시차로는 불가능 — 세페이드 이상의 방법이 필요' }
      ];
    },

    notes: [
      '<b>시차는 거리의 역수입니다.</b> 그래서 가까운 별은 쉽고 먼 별은 급격히 어려워집니다 — 거리가 10배면 시차가 1/10이 되어, 정밀도를 10배 올려야 같은 품질로 잴 수 있습니다.',
      '<b>1 파섹</b>은 "시차(parallax)가 1초각(second)이 되는 거리"의 줄임말입니다. 3.26 광년이며, 실제로 시차가 1초각을 넘는 별은 <b>하나도 없습니다</b> — 가장 가까운 프록시마도 0.77초각입니다.',
      '1초각은 <b>4 km 밖의 1원짜리 동전</b>이 보이는 각도입니다. 베셀이 1838년에 이것보다 작은 0.3초각을 맨눈 관측 장비로 측정해 낸 것이 천문학의 분기점이었습니다 — 그 전까지 아무도 별까지의 거리를 몰랐습니다.',
      '<b>가이아(Gaia) 위성</b>은 정밀도 약 20 µas로 15억 개 별의 거리를 쟀습니다. 이 한 번의 임무가 우리은하의 3차원 지도를 처음으로 그렸고, 거리 사다리 전체의 눈금을 다시 매겼습니다.',
      '시차가 닿지 않는 거리부터는 <b>"밝기를 아는 천체"</b>를 찾아야 합니다 — 세페이드 변광성(맥동 주기가 광도를 알려 줌), Ia형 초신성(폭발 밝기가 항상 같음). 그런데 그 방법들의 눈금은 결국 시차로 거리를 아는 가까운 표본에서 맞춥니다. <b>사다리의 아래 칸이 흔들리면 위 칸이 전부 흔들립니다</b> — 허블 상수 논쟁의 뿌리이기도 합니다.'
    ],
    presets: [
      { name: '프록시마 켄타우리 (1.30 pc)', set: { lgd: .114, lgs: 1.3 } },
      { name: '시리우스 (2.64 pc)', set: { lgd: .422, lgs: 1.3 } },
      { name: '베텔게우스 (168 pc)', set: { lgd: 2.225, lgs: 1.3 } },
      { name: '플레이아데스 성단 (136 pc)', set: { lgd: 2.134, lgs: 1.3 } },
      { name: '지상 망원경으로는 (σ = 50 mas)', set: { lgd: 2, lgs: 4.7 } },
      { name: '가이아의 한계 근처 (10 kpc)', set: { lgd: 4, lgs: 1.3 } }
    ],
    challenges: [
      {
        id: 'proxima', title: '가장 가까운 별 찾기',
        desc: '시차가 700~800 mas인 거리에 맞춰 보세요 — 프록시마 켄타우리, 태양 다음으로 가까운 별입니다.',
        hint: 'p = 1000/d(pc) 이므로 거리를 약 1.3 pc(4.2 광년)로 맞추면 됩니다.',
        check: ({ P }) => { const pm = parMas(P); return pm >= 700 && pm <= 800; }
      },
      {
        id: 'gaia', title: '가이아의 성능 체감하기',
        desc: '정밀도 20 µas 이하로 5,000 pc(1만 6천 광년) 넘는 별의 거리를 S/N 5 이상으로 측정해 보세요.',
        hint: '정밀도 슬라이더를 1.3(=20 µas) 이하로 내리고 거리를 3.7 이상으로 올리세요. 우리은하 중심까지가 약 8,000 pc입니다.',
        check: ({ P }) => sigOf(P) <= 20 && dOf(P) >= 5000 && snOf(P) >= 5
      },
      {
        id: 'fail', title: '지상에서는 왜 안 되는가',
        desc: '정밀도를 10,000 µas(=10 mas, 대기 흔들림이 있는 지상 수준) 이상으로 두고, 100 pc 별의 시차가 잡음에 묻히는 것을 확인하세요.',
        hint: '거리 2.0(=100 pc)에서 시차는 10 mas입니다. 오차가 그만큼 크면 신호가 보이지 않습니다.',
        check: ({ P }) => sigOf(P) >= 1e4 && dOf(P) >= 100 && snOf(P) < 5
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const d = dOf(p), pm = parMas(p), sg = sigOf(p) / 1000, sn = snOf(p);
      const ph = st.t / YEAR * 2 * Math.PI;

      /* ── 위에서 본 삼각측량 ── */
      const ox = 92, oy = h * .27, au = 34;
      D.text(ctx, '위에서 본 지구 궤도', ox, oy - au - 34, { size: 10.5, color: '#61719a', align: 'center' });
      // 태양 · 궤도
      ctx.save(); ctx.strokeStyle = 'rgba(147,162,196,.3)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(ox, oy, au, au * .42, 0, 0, 7); ctx.stroke(); ctx.restore();
      D.dot(ctx, ox, oy, 7, '#fbbf24', true);
      D.text(ctx, '태양', ox, oy + 20, { size: 9, color: '#fbbf24', align: 'center' });
      // 지구 (현재 위치 + 6개월 뒤)
      const ex = ox + Math.cos(ph) * au, ey = oy + Math.sin(ph) * au * .42;
      const ex2 = ox - Math.cos(ph) * au, ey2 = oy - Math.sin(ph) * au * .42;
      D.dot(ctx, ex, ey, 5, '#60a5fa', true);
      D.dot(ctx, ex2, ey2, 4, 'rgba(96,165,250,.35)', false);
      D.text(ctx, '지구', ex + 8, ey + 4, { size: 9, color: '#60a5fa' });
      D.dim(ctx, ox, oy + au * .42 + 18, ox + au, oy + au * .42 + 18, '1 AU', '#93a2c4', false);

      // 별 (오른쪽) + 두 시선 — 거리가 멀수록 두 시선이 평행해진다
      const starX = ox + 196, starY = oy - 6;
      const spread = clamp(Math.log10(2e4 / d) / Math.log10(2e4) , .02, 1);
      ctx.save(); ctx.strokeStyle = 'rgba(94,234,212,.5)'; ctx.lineWidth = 1.4;
      [[ex, ey], [ex2, ey2]].forEach(([qx, qy]) => {
        ctx.beginPath(); ctx.moveTo(qx, qy);
        ctx.lineTo(starX, starY); ctx.stroke();
      });
      ctx.restore();
      // 시차각 호
      const a1 = Math.atan2(ey - starY, ex - starX), a2 = Math.atan2(ey2 - starY, ex2 - starX);
      ctx.save(); ctx.strokeStyle = C.p; ctx.lineWidth = 2;
      if (hl === 'p') { ctx.shadowColor = C.p; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(starX, starY, 44, Math.min(a1, a2), Math.max(a1, a2)); ctx.stroke(); ctx.restore();
      D.text(ctx, '2p', starX - 52, starY + 4, { size: 10.5, color: hl === 'p' ? '#fff' : C.p, align: 'right', bold: true });
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
      D.dot(ctx, starX, starY, 5, '#fff', true); ctx.restore();
      D.text(ctx, 'd = ' + (d > 100 ? fmt(d, 0) : fmt(d, 2)) + ' pc', starX + 12, starY + 4,
        { size: 11, color: hl === 'd' ? '#fff' : C.d, bold: hl === 'd' });
      D.text(ctx, '(' + fmt(d * PC_LY, d > 100 ? 0 : 1) + ' 광년)', starX + 12, starY + 19, { size: 9.5, color: '#61719a' });
      // 거리 압축 표시
      D.text(ctx, '≈≋≈', (ox + starX) / 2 + 36, starY - 14, { size: 11, color: 'rgba(147,162,196,.5)', align: 'center' });
      D.text(ctx, '(그림은 거리를 크게 줄였습니다)', ox, oy + au * .42 + 42, { size: 9, color: '#4b5a80' });

      /* ── 하늘에서 본 모습 ── */
      const vx = Math.min(w - 150, starX + 140), vy = oy, vr = Math.min(76, (w - vx - 44));
      if (vr > 40) {
        const span = Math.max(pm * 2.6, sg * 5, 1e-4);     // 시야 반폭 [mas]
        const S = m => m / span * vr;
        ctx.save();
        ctx.beginPath(); ctx.arc(vx, vy, vr, 0, 7);
        ctx.fillStyle = 'rgba(8,14,28,.75)'; ctx.fill();
        ctx.strokeStyle = 'rgba(147,162,196,.35)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.clip();
        // 배경별 (아주 멀어서 안 움직인다)
        for (let i = 0; i < 30; i++) {
          const ang = rnd(i) * 6.283, rr = Math.sqrt(rnd(i + 50)) * vr;
          D.dot(ctx, vx + Math.cos(ang) * rr, vy + Math.sin(ang) * rr, .9 + rnd(i + 90) * 1.3, 'rgba(200,211,239,.55)', false);
        }
        // 시차 타원 (참 궤적)
        ctx.strokeStyle = 'rgba(251,191,36,.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.ellipse(vx, vy, S(pm), S(pm) * .45, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        // 관측점
        st.meas.forEach((m, i) => {
          const X = vx + S(pm * Math.cos(m.ph) + m.ex * sg);
          const Y = vy + S((pm * Math.sin(m.ph)) * .45 + m.ey * sg);
          ctx.globalAlpha = .35 + .65 * (i / Math.max(1, st.meas.length - 1));
          D.dot(ctx, X, Y, 2.4, '#e8eefc', false);
        });
        ctx.globalAlpha = 1;
        // 현재 위치
        const cxx = vx + S(pm * Math.cos(ph)), cyy = vy + S(pm * Math.sin(ph) * .45);
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
        D.dot(ctx, cxx, cyy, 4, '#fff', true);
        ctx.restore();
        D.text(ctx, '하늘에서 본 모습', vx, vy - vr - 10, { size: 10.5, color: '#61719a', align: 'center' });
        D.text(ctx, '시야 ' + (span * 2 > 1000 ? fmt(span * 2 / 1000, 2) + '″' : fmt(span * 2, 1) + ' mas'),
          vx, vy + vr + 15, { size: 9, color: '#4b5a80', align: 'center' });
        D.text(ctx, sn >= 5 ? '타원이 보인다' : '잡음에 묻혔다',
          vx, vy + vr + 30, { size: 10, color: sn >= 5 ? '#34d399' : '#fb7185', align: 'center', bold: true });
      }

      /* ── 거리 사다리 ── */
      const lx = 44, ly = h - 118, lw = Math.min(w - 88, 540);
      D.text(ctx, '우주 거리 사다리 — 각 방법이 닿는 범위', lx, ly - 10, { size: 10.5, color: '#61719a' });
      const LO = 0, HI = Math.log10(4e9);
      const LX = pc => lx + lw * clamp((Math.log10(Math.max(pc, 1)) - LO) / (HI - LO), 0, 1);
      LADDER.forEach((rung, i) => {
        const yy = ly + i * 17;
        ctx.save();
        if (i === 0 && hl === 'd') { ctx.shadowColor = rung[3]; ctx.shadowBlur = 12; }
        D.roundRect(ctx, LX(rung[0]), yy, Math.max(4, LX(rung[1]) - LX(rung[0])), 11, 4);
        ctx.fillStyle = rung[3]; ctx.globalAlpha = .45; ctx.fill(); ctx.restore();
        D.text(ctx, rung[2], LX(rung[0]) + 5, yy + 9, { size: 9, color: rung[3] });
      });
      [[1, '1 pc'], [1e3, '1 kpc'], [1e6, '1 Mpc'], [1e9, '1 Gpc']].forEach(([v, lab]) => {
        D.line(ctx, LX(v), ly - 4, LX(v), ly + 70, { color: 'rgba(255,255,255,.05)' });
        D.text(ctx, lab, LX(v), ly + 82, { size: 9, color: '#4b5a80', align: 'center' });
      });
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      D.line(ctx, LX(d), ly - 6, LX(d), ly + 72, { color: '#fff', width: 2 }); ctx.restore();

      /* ── S/N 게이지 ── */
      D.text(ctx, 'S/N = p / σ = ' + fmt(sn, 2), lx, h - 14,
        { size: 12, color: sn >= 5 ? '#34d399' : '#fb7185', bold: true });
      D.text(ctx, 'p = ' + (pm < 1 ? fmt(pm * 1000, 1) + ' µas' : fmt(pm, 2) + ' mas') +
        '   ·   σ = ' + (sg < 1 ? fmt(sg * 1000, 0) + ' µas' : fmt(sg, 1) + ' mas'),
        lx + 150, h - 14, { size: 11, color: '#93a2c4' });
    }
  });
})();
