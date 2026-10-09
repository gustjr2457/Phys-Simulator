/* [항공우주공학·궤도역학] 중력 어시스트 (스윙바이) — Δv = 2v∞·sin(δ/2)
   연료를 전혀 쓰지 않고 탐사선을 가속시키는 방법. 행성 입장에서 보면 탐사선은
   들어올 때와 나갈 때 속력이 똑같고 방향만 꺾인다(에너지 보존). 그런데 그 행성이
   초속 13 km로 태양 둘레를 돌고 있으므로, 태양 입장에서 보면 속도가 통째로 달라진다.
   공짜로 보이지만 공짜가 아니다 — 행성의 공전 운동량을 아주 조금 빼앗은 것이다.
   보이저·카시니·파커 탐사선이 전부 이 수법으로 목적지에 갔다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { vinf: '#fb7185', rp: '#5eead4', pl: '#fbbf24', app: '#a78bfa',
              delta: '#f472b6', gain: '#34d399' };

  const PLANETS = [
    { n: '금성', mu: 3.2486e5, R: 6052, V: 35.02, c: '#fbbf24' },
    { n: '지구', mu: 3.9860e5, R: 6371, V: 29.78, c: '#60a5fa' },
    { n: '목성', mu: 1.2669e8, R: 69911, V: 13.07, c: '#fb923c' },
    { n: '토성', mu: 3.7931e7, R: 58232, V: 9.69, c: '#5eead4' }
  ];
  const plOf = p => PLANETS[clamp(Math.round(p.pl), 0, 3)];
  const eccOf = p => { const q = plOf(p); return 1 + (p.rp * q.R) * p.vinf * p.vinf / q.mu; };
  const deltaOf = p => 2 * Math.asin(1 / eccOf(p));              // 편향각 [rad]
  // 태양 기준 입·출 속도
  function solar(p) {
    const q = plOf(p), d = deltaOf(p);
    const a = p.app * Math.PI / 180;                              // v∞가 행성 진행 방향과 이루는 각
    const vin = [p.vinf * Math.cos(a), p.vinf * Math.sin(a)];
    // 이득이 커지는 쪽으로 꺾는다(v∞를 행성 진행 방향에 가깝게)
    const sgn = Math.sin(a) >= 0 ? -1 : 1;
    const th = a + sgn * d;
    const vout = [p.vinf * Math.cos(th), p.vinf * Math.sin(th)];
    const sin = [q.V + vin[0], vin[1]], sout = [q.V + vout[0], vout[1]];
    return { d: d, vin: vin, vout: vout, sin: sin, sout: sout,
             si: Math.hypot(sin[0], sin[1]), so: Math.hypot(sout[0], sout[1]) };
  }
  const gainOf = p => { const s = solar(p); return s.so - s.si; };

  PS.register({
    id: 'aero-swingby', mode: 'aero', category: '궤도역학',
    title: '중력 어시스트 (스윙바이)',
    sub: 'Δv = 2v∞ sin(δ/2)',
    tagline: '연료를 한 방울도 안 쓰고 가속합니다. 행성 입장에서는 속력이 그대로인데, 그 행성이 초속 13 km로 돌고 있어서 — 태양 입장에서는 속도가 통째로 달라집니다.',

    params: [
      { key: 'pl', symbol: 'P', label: '행성 (0금성 1지구 2목성 3토성)', unit: '', min: 0, max: 3, step: 1, value: 2, color: C.pl, dec: 0, reset: true,
        where: '스윙바이할 <b>행성</b>입니다. 중력(µ)이 클수록 많이 꺾이고, 공전 속도가 빠를수록 얻을 수 있는 속도가 큽니다 — 목성은 둘 다 커서 최고의 가속 발판입니다.' },
      { key: 'vinf', symbol: 'v∞', label: '행성 기준 접근 속도', unit: 'km/s', min: 2, max: 25, step: .5, value: 10, color: C.vinf, dec: 1, reset: true,
        where: '행성에서 <b>아주 멀리서 본 탐사선의 속도</b>입니다. 이론상 최대 이득이 2v∞이지만, 빠를수록 덜 꺾여서(쌍곡선이 펴져서) 실제 이득은 중간에 최대가 됩니다.' },
      { key: 'rp', symbol: 'r_p', label: '최근접 거리 (행성 반지름 배수)', unit: '', min: 1.05, max: 30, step: .05, value: 3, color: C.rp, dec: 2, reset: true,
        where: '행성 중심에서 <b>얼마나 가까이 스쳐 지나가는가</b>입니다. 가까울수록 많이 꺾여 이득이 커지지만, 대기와 방사선대가 한계를 만듭니다.' },
      { key: 'app', symbol: 'θ', label: '접근 방향', unit: '°', min: 10, max: 170, step: 5, value: 150, color: C.app, dec: 0, reset: true,
        where: '접근 속도 v∞가 <b>행성 진행 방향과 이루는 각</b>입니다. 행성 <b>뒤쪽으로</b> 지나가면 가속(슬링샷), <b>앞쪽으로</b> 지나가면 감속됩니다 — 수성 탐사선은 일부러 감속 스윙바이를 씁니다.' }
    ],
    vars: {
      delta: { symbol: 'δ', label: '편향각', unit: '°', color: C.delta,
        where: '행성 중력이 탐사선의 <b>방향을 꺾는 각도</b>입니다. 왼쪽 그림의 쌍곡선이 휘는 정도이고, 이 각이 클수록 태양 기준 속도 변화가 큽니다.' },
      gain: { symbol: 'Δv', label: '속도 이득', unit: 'km/s', color: C.gain,
        where: '태양 기준으로 <b>얼마나 빨라졌는가</b>입니다. 오른쪽 속도 삼각형에서 두 벡터 길이의 차이입니다. 음수면 감속한 것입니다.' }
    },
    formulas: [
      { name: '쌍곡선 이심률', tpl: 'e = 1 + r_p·v∞² ⁄ μ' },
      { name: '편향각', tpl: 'sin({delta}⁄2) = 1 ⁄ e' },
      { name: '행성 기준 속도 변화', tpl: '|Δv∞| = 2v∞·sin({delta}⁄2)' },
      { name: '태양 기준 속도', tpl: 'v_태양 = V_행성 + v∞   (벡터 합)' },
      { name: '이론상 최대 이득', tpl: '{gain}_max = 2v∞   (정면 반사일 때)' }
    ],

    init(p) { return { u: 0, done: false }; },
    step(st, p, dt) { st.u += dt * .22; if (st.u > 1) st.u -= 1; },

    graphs: [{
      title: '접근 속도에 따른 속도 이득 (최적점이 있다)', xKey: 'vx', xUnit: 'km/s', xMin: 2, xMax: 25,
      series: [{ key: 'gn', label: 'Δv (km/s)', color: C.gain }]
    }],
    sample(st, p) {
      const vx = 2 + ((st.t * 4.5) % 23);
      return { vx: vx, gn: gainOf({ pl: p.pl, vinf: vx, rp: p.rp, app: p.app }) };
    },

    readouts(st, p) {
      const q = plOf(p), s = solar(p), e = eccOf(p);
      const gain = s.so - s.si;
      return [
        { label: '행성', value: q.n, color: q.c },
        { label: '행성 공전 속도', value: q.V, unit: 'km/s', color: q.c, dec: 2 },
        { label: '최근접 거리', value: p.rp * q.R, unit: 'km', color: C.rp, dec: 0 },
        { label: '쌍곡선 이심률 e', value: e, unit: '', dec: 3, color: '#93a2c4' },
        { label: '편향각 δ', value: s.d * 180 / Math.PI, unit: '°', color: C.delta, dec: 1 },
        { label: '행성 기준 속도 변화 |Δv∞|', value: 2 * p.vinf * Math.sin(s.d / 2), unit: 'km/s', dec: 2, color: C.vinf },
        { label: '태양 기준 — 접근 속도', value: s.si, unit: 'km/s', dec: 2, color: '#93a2c4' },
        { label: '태양 기준 — 이탈 속도', value: s.so, unit: 'km/s', dec: 2, color: C.gain },
        { label: '속도 이득 Δv', value: gain, unit: 'km/s', color: gain >= 0 ? C.gain : '#fb7185', dec: 2 },
        { label: '이론상 최대 이득 (2v∞)', value: 2 * p.vinf, unit: 'km/s', dec: 1, color: '#fbbf24' },
        { label: '최대 대비 달성률', value: gain / (2 * p.vinf) * 100, unit: '%', dec: 1, color: C.gain },
        { label: '효과', wide: true, color: gain > .5 ? '#34d399' : (gain < -.5 ? '#fb7185' : '#fbbf24'),
          value: gain > .5 ? '가속 스윙바이 — 행성 뒤쪽을 지나며 끌려간다' :
                 (gain < -.5 ? '감속 스윙바이 — 안쪽 행성으로 가려면 이것이 필요' : '거의 방향 전환만') },
        { label: '행성이 잃는 속도', value: 1e-24, unit: 'km/s', dec: 0, wide: true, color: '#4b5a80' }
      ];
    },

    notes: [
      '<b>행성 입장에서는 공짜입니다.</b> 탐사선은 들어올 때와 나갈 때 행성에 대한 속력이 정확히 같고 방향만 꺾입니다 — 에너지 보존 그대로입니다. 당구공이 벽에 튕기는 것과 같습니다.',
      '<b>그런데 그 "벽"이 움직이고 있습니다.</b> 목성은 초속 13 km로 태양 둘레를 돕니다. 움직이는 벽에 공이 튕기면 공의 속도가 달라지듯, 태양 입장에서는 탐사선의 속도가 통째로 바뀝니다 — 이것이 중력 어시스트의 전부입니다.',
      '<b>완전히 공짜는 아닙니다.</b> 탐사선이 얻은 운동량만큼 행성은 잃습니다 — 다만 질량비가 10²² 정도라 행성의 속도 변화는 측정 자체가 불가능한 수준입니다.',
      '<b>v∞가 빠를수록 좋은 것이 아닙니다.</b> 빠르면 쌍곡선이 펴져서 덜 꺾이고(δ 감소), 이득 = 2v∞·sin(δ/2)에서 두 요소가 반대로 작용합니다. 그래서 이득이 최대가 되는 접근 속도가 중간 어딘가에 있습니다 — 그래프에서 봉우리를 찾아보세요.',
      '<b>방향이 전부입니다.</b> 행성 뒤쪽으로 지나가면 끌려가며 가속, 앞쪽으로 지나가면 제동이 걸립니다. 태양에 가까이 가려면 오히려 속도를 <b>버려야</b> 하기 때문에, 수성 탐사선 베피콜롬보는 감속 스윙바이를 아홉 번이나 했습니다.',
      '<b>보이저 2호</b>는 목성-토성-천왕성-해왕성을 176년에 한 번 오는 배열로 연달아 스윙바이해 30년 걸릴 여정을 12년으로 줄였습니다. <b>파커 태양 탐사선</b>은 금성에서 일곱 번 감속해 태양에 점점 가까이 들어갑니다.'
    ],
    presets: [
      { name: '목성 가속 스윙바이 (보이저)', set: { pl: 2, vinf: 10, rp: 3, app: 150 } },
      { name: '아주 가깝게 스쳐 지나가기', set: { pl: 2, vinf: 10, rp: 1.1, app: 150 } },
      { name: '지구 스윙바이 (갈릴레오)', set: { pl: 1, vinf: 6, rp: 1.5, app: 150 } },
      { name: '금성 감속 스윙바이 (파커)', set: { pl: 0, vinf: 8, rp: 1.3, app: 30 } },
      { name: '너무 빨라서 덜 꺾인다', set: { pl: 2, vinf: 25, rp: 3, app: 150 } },
      { name: '멀리 지나가면 효과 없음', set: { pl: 2, vinf: 10, rp: 30, app: 150 } }
    ],
    challenges: [
      {
        id: 'boost', title: '초속 5 km 공짜로 얻기',
        desc: '연료를 쓰지 않고 태양 기준 속도를 5 km/s 이상 올려 보세요.',
        hint: '목성처럼 무겁고 빠른 행성을, 뒤쪽으로(접근 방향 150° 근처), 가까이 지나가세요.',
        check: ({ P }) => gainOf(P) >= 5
      },
      {
        id: 'brake', title: '감속 스윙바이',
        desc: '속도 이득을 음수(−2 km/s 이하)로 만들어 보세요 — 태양 쪽 안쪽 행성으로 가려면 이것이 필요합니다.',
        hint: '접근 방향을 작게(행성 앞쪽으로 지나가게) 하면 제동이 걸립니다.',
        check: ({ P }) => gainOf(P) <= -2
      },
      {
        id: 'bend', title: '진로를 90° 이상 꺾기',
        desc: '행성 기준 편향각을 90° 이상으로 만들어, 탐사선의 진행 방향을 통째로 바꿔 보세요.',
        hint: 'sin(δ/2) = 1/e 이고 e = 1 + r_p v∞²/μ 입니다. 아주 가깝게, 천천히, 무거운 행성에서.',
        check: ({ P }) => deltaOf(P) * 180 / Math.PI >= 90
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const q = plOf(p), s = solar(p), gain = s.so - s.si;

      /* ── 왼쪽: 행성 기준 쌍곡선 ── */
      const lx = w * .26, cy = h * .36;
      const pr = clamp(w * .022, 12, 24);
      D.text(ctx, '행성 기준 — 속력은 그대로, 방향만 꺾인다', lx, cy - h * .25,
        { size: 11, color: '#61719a', align: 'center' });
      // 행성
      ctx.save(); if (hl === 'pl') { ctx.shadowColor = q.c; ctx.shadowBlur = 20; }
      const g1 = ctx.createRadialGradient(lx, cy, 0, lx, cy, pr);
      g1.addColorStop(0, q.c); g1.addColorStop(1, q.c.replace(')', '').replace('#', '#') );
      ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(lx, cy, pr, 0, 7); ctx.fill(); ctx.restore();
      D.text(ctx, q.n, lx, cy + pr + 16, { size: 11, color: q.c, align: 'center', bold: true });
      // 쌍곡선 궤도
      const e = eccOf(p), d = s.d;
      const rpPx = clamp(pr * p.rp / 1.5, pr + 6, 110);
      const aHyp = rpPx / (e - 1);
      const nuMax = Math.acos(-1 / e) * .92;
      const ang0 = Math.atan2(s.vin[1], s.vin[0]) + Math.PI;    // 들어오는 방향
      const turnSgn = Math.sin(p.app * Math.PI / 180) >= 0 ? -1 : 1;
      ctx.save();
      ctx.strokeStyle = hl === 'delta' ? '#f472b6' : 'rgba(244,114,182,.8)'; ctx.lineWidth = 2.4;
      if (hl === 'delta') { ctx.shadowColor = C.delta; ctx.shadowBlur = 12; }
      ctx.beginPath();
      const axisAng = ang0 + turnSgn * (Math.PI - nuMax);
      for (let i = 0; i <= 120; i++) {
        const nu = -nuMax + 2 * nuMax * i / 120;
        const rr = aHyp * (e * e - 1) / (1 + e * Math.cos(nu));
        const a2 = axisAng + turnSgn * nu;
        const X = lx + rr * Math.cos(a2), Y = cy + rr * Math.sin(a2);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke(); ctx.restore();
      // 탐사선
      {
        const nu = -nuMax + 2 * nuMax * st.u;
        const rr = aHyp * (e * e - 1) / (1 + e * Math.cos(nu));
        const a2 = axisAng + turnSgn * nu;
        ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
        D.dot(ctx, lx + rr * Math.cos(a2), cy + rr * Math.sin(a2), 4.5, '#fff', true); ctx.restore();
      }
      // 입·출 v∞ 벡터
      const VS = clamp(90 / Math.max(p.vinf, 1), 3, 9);
      D.arrow(ctx, lx - s.vin[0] * VS * 2.2, cy + s.vin[1] * VS * 2.2, s.vin[0] * VS, -s.vin[1] * VS,
        { color: 'rgba(147,162,196,.9)', width: 2.4, head: 7, label: 'v∞ 입', ly: -10 });
      D.arrow(ctx, lx + s.vout[0] * VS * 1.4, cy - s.vout[1] * VS * 1.4, s.vout[0] * VS, -s.vout[1] * VS,
        { color: C.vinf, width: 2.4, head: 7, hot: hl === 'vinf', label: 'v∞ 출', ly: -10 });
      // 편향각 표시
      D.tag(ctx, 'δ = ' + fmt(d * 180 / Math.PI, 1) + '°', lx, cy + h * .21, C.delta, hl === 'delta');
      D.text(ctx, '|v∞| = ' + fmt(p.vinf, 1) + ' km/s  (입·출 동일)', lx, cy + h * .21 + 22,
        { size: 10, color: '#93a2c4', align: 'center' });
      D.dim(ctx, lx, cy, lx + rpPx * .7, cy - rpPx * .7,
        'r_p = ' + fmt(p.rp, 2) + 'R', C.rp, hl === 'rp');

      /* ── 오른쪽: 태양 기준 속도 삼각형 ── */
      const rx = w * .72, ry = cy;
      const ar = Math.min(w * .20, h * .22);
      D.text(ctx, '태양 기준 — 속도가 통째로 달라진다', rx, ry - h * .25,
        { size: 11, color: '#61719a', align: 'center' });
      const SS = ar / Math.max(s.so, s.si, q.V + p.vinf) * .9;
      const ox = rx - ar * .5, oy = ry + ar * .4;
      // 행성 공전 속도
      D.arrow(ctx, ox, oy, q.V * SS, 0, { color: q.c, width: 3, head: 8, hot: hl === 'pl' });
      D.text(ctx, 'V_' + q.n + ' = ' + fmt(q.V, 1), ox + q.V * SS / 2, oy + 18,
        { size: 10, color: q.c, align: 'center' });
      // 입 (회색) / 출 (초록)
      D.arrow(ctx, ox + q.V * SS, oy, s.vin[0] * SS, -s.vin[1] * SS,
        { color: 'rgba(147,162,196,.8)', width: 2.2, head: 7 });
      D.arrow(ctx, ox + q.V * SS, oy, s.vout[0] * SS, -s.vout[1] * SS,
        { color: C.vinf, width: 2.2, head: 7, hot: hl === 'app' });
      D.arrow(ctx, ox, oy, s.sin[0] * SS, -s.sin[1] * SS,
        { color: 'rgba(200,211,239,.75)', width: 2.6, head: 8, dash: [5, 4] });
      ctx.save(); if (hl === 'gain') { ctx.shadowColor = C.gain; ctx.shadowBlur = 14; }
      D.arrow(ctx, ox, oy, s.sout[0] * SS, -s.sout[1] * SS,
        { color: C.gain, width: 3.2, head: 9 }); ctx.restore();
      D.text(ctx, '전 ' + fmt(s.si, 2), ox + s.sin[0] * SS * .6, oy - s.sin[1] * SS * .6 - 8,
        { size: 10, color: '#93a2c4' });
      D.text(ctx, '후 ' + fmt(s.so, 2), ox + s.sout[0] * SS * .85, oy - s.sout[1] * SS * .85 - 8,
        { size: 11, color: C.gain, bold: true });
      D.tag(ctx, (gain >= 0 ? '+' : '') + fmt(gain, 2) + ' km/s' + (gain >= 0 ? ' 가속' : ' 감속'),
        rx, ry + h * .21, gain >= 0 ? C.gain : '#fb7185', hl === 'gain');
      D.text(ctx, '이론상 최대 ' + fmt(2 * p.vinf, 1) + ' km/s의 ' + fmt(gain / (2 * p.vinf) * 100, 0) + '%',
        rx, ry + h * .21 + 22, { size: 10, color: '#93a2c4', align: 'center' });

      /* ── 요약 ── */
      D.text(ctx, '연료 소모: 0   ·   행성이 잃는 속도: 측정 불가 수준',
        36, h - 16, { size: 11, color: '#4b5a80' });
    }
  });
})();
