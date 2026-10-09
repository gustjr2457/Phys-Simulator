/* [선박공학·운항 제어] LOS 항로 추종과 충돌 회피 — χ_d = α_p + atan(−e/Δ)
   자율운항 선박은 두 가지를 동시에 해야 한다. 정해진 항로를 벗어나지 않는 것(유도)과,
   다가오는 배와 부딪히지 않는 것(회피)이다. 전자는 LOS 유도법이 푼다 — 항로 위
   전방 Δ만큼 앞의 한 점을 바라보고 그쪽으로 가면, 횡방향 오차가 저절로 0으로 수렴한다.
   후자는 최근접점(CPA)과 그때까지의 시간(TCPA)을 계산해, 위험하면 COLREG에 따라
   우현으로 변침한다. 이 둘이 자율운항 시스템의 뼈대다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { look: '#5eead4', V: '#fb7185', tV: '#fbbf24', tC: '#a78bfa',
              Rs: '#f472b6', e: '#60a5fa', cpa: '#fb923c' };
  const KN = .5144;
  const WP = [[0, 0], [1600, 300], [3200, -200], [4800, 400]];   // 항로 경유점 [m]

  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  // 현재 구간과 횡방향 오차
  function pathInfo(st) {
    const i = clamp(st.leg, 0, WP.length - 2);
    const a = WP[i], b = WP[i + 1];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const ap = Math.atan2(dy, dx);
    const rx = st.x - a[0], ry = st.y - a[1];
    const s = (rx * dx + ry * dy) / L;                 // 항로 방향 진행거리
    const e = (-rx * dy + ry * dx) / L;                // 횡방향 오차 (좌현 +)
    return { i: i, ap: ap, s: s, e: e, L: L };
  }
  // 최근접점 (CPA) 과 그때까지의 시간 (TCPA)
  function cpaOf(st, p) {
    const vx = p.V * KN * Math.cos(st.psi), vy = p.V * KN * Math.sin(st.psi);
    const tc = p.tC * Math.PI / 180;
    const tvx = p.tV * KN * Math.cos(tc), tvy = p.tV * KN * Math.sin(tc);
    const rx = st.tx - st.x, ry = st.ty - st.y;
    const rvx = tvx - vx, rvy = tvy - vy;
    const v2 = rvx * rvx + rvy * rvy;
    const t = v2 < 1e-9 ? 0 : -(rx * rvx + ry * rvy) / v2;
    const tt = Math.max(t, 0);
    return { d: Math.hypot(rx + rvx * tt, ry + rvy * tt), t: t, now: Math.hypot(rx, ry) };
  }

  PS.register({
    id: 'ship-los', mode: 'marine', category: '운항 제어',
    title: 'LOS 항로 추종과 충돌 회피',
    sub: 'χ_d = α_p + atan(−e/Δ)',
    tagline: '자율운항은 두 가지를 동시에 합니다 — 항로를 벗어나지 않기(LOS 유도)와 부딪히지 않기(CPA 판정 + 우현 변침). 이 둘이 시스템의 뼈대입니다.',

    params: [
      { key: 'look', symbol: 'Δ', label: '전방주시거리', unit: 'm', min: 100, max: 2000, step: 50, value: 500, color: C.look, dec: 0, reset: true,
        where: '항로 위 <b>얼마나 앞을 보고 조타할 것인가</b>입니다(청록 원). 짧으면 빠르게 복귀하지만 과도하게 꺾이고(진동), 길면 부드럽지만 느리게 수렴합니다.' },
      { key: 'V', symbol: 'V', label: '자선 속력', unit: 'kn', min: 4, max: 24, step: .5, value: 14, color: C.V, dec: 1, reset: true,
        where: '<b>내 배의 속력</b>입니다. 빠를수록 선회 반경이 커져 항로 복귀가 어려워지고, 충돌 회피에 쓸 수 있는 시간도 줄어듭니다.' },
      { key: 'tV', symbol: 'V_t', label: '타선 속력', unit: 'kn', min: 0, max: 24, step: .5, value: 12, color: C.tV, dec: 1, reset: true,
        where: '<b>마주 오는 배의 속력</b>(노란 배)입니다. 0으로 두면 정지 장애물이 됩니다.' },
      { key: 'tC', symbol: 'χ_t', label: '타선 침로', unit: '°', min: 0, max: 359, step: 5, value: 200, color: C.tC, dec: 0, reset: true,
        where: '타선이 <b>가는 방향</b>입니다(0° = 동쪽/오른쪽). 자선 항로를 가로지르도록 맞추면 횡단 상황(crossing)이 만들어집니다.' },
      { key: 'Rs', symbol: 'R_s', label: '안전 반경', unit: 'm', min: 200, max: 2000, step: 50, value: 700, color: C.Rs, dec: 0,
        where: '이 거리 안으로 접근하면 위험하다고 판단하는 <b>경계</b>(분홍 원)입니다. 최근접 거리(CPA)가 이보다 작아질 것으로 예측되면 회피 기동에 들어갑니다.' }
    ],
    vars: {
      e: { symbol: 'e', label: '횡방향 오차', unit: 'm', color: C.e,
        where: '항로에서 <b>옆으로 벗어난 거리</b>입니다. LOS 유도의 목표는 이 값을 0으로 만드는 것이고, 화면에서 배와 항로를 잇는 파란 선입니다.' },
      cpa: { symbol: 'CPA', label: '최근접 거리', unit: 'm', color: C.cpa,
        where: '지금 속도와 침로를 유지하면 두 배가 <b>가장 가까워졌을 때의 거리</b>입니다. 이 값이 안전 반경보다 작으면 회피해야 합니다.' }
    },
    formulas: [
      { name: 'LOS 유도 — 목표 침로', tpl: 'χ_d = α_p + atan(−{e} ⁄ {look})' },
      { name: '횡방향 오차는 지수적으로 0으로', tpl: '{e}(t) → 0' },
      { name: '최근접 거리와 시간', tpl: 'TCPA = −(r·v_rel) ⁄ |v_rel|²' },
      { name: '회피 판단', tpl: '{cpa} < {Rs} 이고 TCPA > 0  →  우현 변침' }
    ],

    init(p) {
      return { x: 0, y: -600, psi: .2, leg: 0, trail: [],
               tx: 3000, ty: 1400, avoid: false, minD: 1e9, off: 0, done: false };
    },
    step(st, p, dt) {
      const sdt = dt * 14;                                  // 화면 1초 = 실제 14초
      const pi = pathInfo(st);
      if (pi.s > pi.L && st.leg < WP.length - 2) st.leg++;

      // ── 충돌 회피 판단 ──
      const c = cpaOf(st, p);
      const danger = c.d < p.Rs && c.t > 0 && c.t < 900 && c.now < 6000;
      st.avoid = danger;
      // 위험하면 목표 침로를 우현(시계 방향)으로 틀어 준다
      const want = danger ? clamp((p.Rs - c.d) / p.Rs, 0, 1) * 55 : 0;
      st.off += (want - st.off) * clamp(sdt / 12, 0, 1);

      // ── LOS 유도 ──
      const chi = pi.ap + Math.atan2(-pi.e, p.look) - st.off * Math.PI / 180;
      // 1차 조타 응답 + 선회율 제한
      const err = wrap(chi - st.psi);
      const rate = clamp(err / 55, -.0085, .0085);          // rad/s
      st.psi = wrap(st.psi + rate * sdt);

      st.x += p.V * KN * Math.cos(st.psi) * sdt;
      st.y += p.V * KN * Math.sin(st.psi) * sdt;
      const tc = p.tC * Math.PI / 180;
      st.tx += p.tV * KN * Math.cos(tc) * sdt;
      st.ty += p.tV * KN * Math.sin(tc) * sdt;

      const dd = Math.hypot(st.tx - st.x, st.ty - st.y);
      if (dd < st.minD) st.minD = dd;
      if (st.trail.length === 0 || Math.hypot(st.x - st.trail[st.trail.length - 1][0], st.y - st.trail[st.trail.length - 1][1]) > 30)
        st.trail.push([st.x, st.y]);
      if (st.trail.length > 900) st.trail.shift();
      if (st.x > WP[WP.length - 1][0] + 400) st.done = true;
    },

    graphs: [{
      title: '횡방향 오차와 두 배의 거리', xmin: 20, y0: 0,
      series: [
        { key: 'ee', label: '횡방향 오차 |e| (m)', color: C.e },
        { key: 'dd', label: '두 배의 거리 (m)', color: C.cpa },
        { key: 'rs', label: '안전 반경', color: C.Rs }
      ]
    }],
    sample(st, p) {
      return { ee: Math.abs(pathInfo(st).e), dd: Math.hypot(st.tx - st.x, st.ty - st.y), rs: p.Rs };
    },

    readouts(st, p) {
      const pi = pathInfo(st), c = cpaOf(st, p);
      const dnow = Math.hypot(st.tx - st.x, st.ty - st.y);
      return [
        { label: '현재 구간', value: (pi.i + 1) + ' / ' + (WP.length - 1), color: '#93a2c4' },
        { label: '횡방향 오차 e', value: pi.e, unit: 'm', color: C.e, dec: 1 },
        { label: '항로 침로 α_p', value: pi.ap * 180 / Math.PI, unit: '°', dec: 1, color: '#93a2c4' },
        { label: '목표 침로 χ_d', value: (pi.ap + Math.atan2(-pi.e, p.look)) * 180 / Math.PI - st.off, unit: '°', dec: 1, color: C.look },
        { label: '현재 침로 ψ', value: st.psi * 180 / Math.PI, unit: '°', dec: 1, color: C.V },
        { label: '타선과의 현재 거리', value: dnow, unit: 'm', dec: 0, color: '#93a2c4' },
        { label: '최근접 거리 CPA', value: c.d, unit: 'm', color: C.cpa, dec: 0 },
        { label: '최근접까지 시간 TCPA', value: c.t > 0 ? c.t / 60 : 0, unit: '분', dec: 1, color: C.cpa },
        { label: '실제 최근접 거리 (지금까지)', value: st.minD < 1e8 ? st.minD : 0, unit: 'm', dec: 0,
          color: st.minD < p.Rs ? '#fb7185' : '#34d399' },
        { label: '회피 기동', wide: true, color: st.avoid ? '#fb7185' : '#34d399',
          value: st.avoid ? '작동 중 — 우현 ' + fmt(st.off, 0) + '° 변침 (COLREG)' : '불필요 — 항로 유지' },
        { label: '추종 품질', wide: true, color: Math.abs(pi.e) < 60 ? '#34d399' : (Math.abs(pi.e) < 200 ? '#fbbf24' : '#fb7185'),
          value: Math.abs(pi.e) < 60 ? '항로에 잘 붙어 있다' :
                 (Math.abs(pi.e) < 200 ? '약간 벗어남' : '크게 벗어남 — 전방주시거리를 줄여 보세요') },
        { label: '안전 판정', wide: true, color: st.minD >= p.Rs ? '#34d399' : '#fb7185',
          value: st.minD >= p.Rs ? '✔ 안전 반경을 지켰다' : '✘ 안전 반경 침범 — 더 일찍 회피했어야 한다' }
      ];
    },

    notes: [
      '<b>LOS 유도는 "앞을 보고 간다"는 생각을 수식으로 옮긴 것입니다.</b> 항로에서 Δ만큼 앞에 있는 한 점을 겨냥하면, 벗어난 쪽을 자동으로 메우는 방향으로 침로가 잡힙니다 — 운전자가 차선을 지킬 때 하는 일과 똑같습니다.',
      '<b>전방주시거리 Δ가 제어의 성격을 정합니다.</b> 짧으면 즉각 복귀하지만 과하게 꺾여 진동하고, 길면 부드럽지만 느리게 수렴합니다. 보통 선체 길이의 2~5배를 씁니다 — 항로 추종에서 유일하게 조율하는 값입니다.',
      '<b>CPA와 TCPA가 충돌 회피의 언어입니다.</b> "지금 거리"가 아니라 "이대로 가면 얼마나 가까워질지"와 "그게 언제인지"를 봅니다. 멀리 있어도 TCPA가 짧고 CPA가 작으면 당장 조치해야 합니다.',
      '<b>COLREG(국제해상충돌예방규칙)는 우현 변침을 기본으로 합니다.</b> 마주칠 때는 서로 우현으로 비켜 좌현끼리 통과하고(규칙 14), 횡단 상황에서는 상대를 우현에 둔 배가 피합니다(규칙 15). 자율운항 시스템도 이 규칙을 지켜야 — 사람이 모는 배가 예측할 수 있습니다.',
      '<b>회피는 "크고 일찍"이 원칙입니다</b>(규칙 8). 상대가 알아볼 수 있을 만큼 뚜렷하게, 여유가 있을 때 하라는 것입니다 — 찔끔찔끔 바꾸면 상대가 의도를 못 읽어 더 위험해집니다.',
      '배는 <b>타를 꺾어도 바로 안 돕니다.</b> 대형선은 선회에만 수 분, 정지에는 수 km가 필요합니다 — 그래서 자동차처럼 "보고 피하는" 방식이 통하지 않고, 수 km 앞을 예측해 움직여야 합니다.'
    ],
    presets: [
      { name: '횡단 상황 (기본)', set: { look: 500, V: 14, tV: 12, tC: 200, Rs: 700 } },
      { name: '전방주시거리가 짧으면 (진동)', set: { look: 120, V: 14, tV: 12, tC: 200, Rs: 700 } },
      { name: '전방주시거리가 길면 (느린 수렴)', set: { look: 1800, V: 14, tV: 12, tC: 200, Rs: 700 } },
      { name: '정면 조우', set: { look: 500, V: 14, tV: 14, tC: 185, Rs: 800 } },
      { name: '정지한 장애물', set: { look: 500, V: 14, tV: 0, tC: 0, Rs: 900 } },
      { name: '넓은 안전 반경 (일찍 회피)', set: { look: 500, V: 14, tV: 12, tC: 200, Rs: 1600 } },
      { name: '고속 항해 (회피 여유 부족)', set: { look: 500, V: 24, tV: 20, tC: 200, Rs: 700 } }
    ],
    challenges: [
      {
        id: 'track', title: '항로에 붙어 가기',
        desc: '횡방향 오차를 50 m 이내로 유지한 채 두 번째 경유점까지 가 보세요.',
        hint: '전방주시거리를 적당히(400~700 m) 두면 부드럽게 수렴합니다. 너무 짧으면 흔들립니다.',
        check: ({ st }) => st.leg >= 1 && Math.abs(pathInfo(st).e) <= 50
      },
      {
        id: 'avoid', title: '안전 반경 지키며 통과하기',
        desc: '타선과의 실제 최근접 거리가 안전 반경 이상이 되도록 회피에 성공하세요.',
        hint: '안전 반경을 넉넉히 잡으면 시스템이 더 일찍 회피를 시작합니다 — COLREG의 "크고 일찍" 원칙입니다.',
        check: ({ P, st }) => st.t > 25 && st.minD >= P.Rs
      },
      {
        id: 'osc', title: '너무 짧은 전방주시거리의 대가',
        desc: '전방주시거리를 150 m 이하로 줄여, 배가 항로 주위에서 지그재그로 흔들리는 것을 관찰하세요.',
        hint: '앞을 짧게 보면 작은 오차에도 크게 꺾어 — 제어가 과민해집니다.',
        check: ({ P }) => P.look <= 150
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const pi = pathInfo(st), c = cpaOf(st, p);

      // 화면 좌표 (배를 따라간다)
      const SC = Math.min(w / 4200, h / 2600);
      const camX = clamp(st.x - 1200 / SC * 0 - 900, -500, WP[WP.length - 1][0] - 1800);
      const X = x => (x - camX) * SC + 70;
      const Y = y => h * .48 - y * SC;

      /* ── 항로 ── */
      ctx.save();
      ctx.strokeStyle = 'rgba(94,234,212,.45)'; ctx.lineWidth = 2; ctx.setLineDash([7, 6]);
      ctx.beginPath();
      WP.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])));
      ctx.stroke(); ctx.restore();
      WP.forEach((q, i) => {
        D.dot(ctx, X(q[0]), Y(q[1]), 4, i === pi.i + 1 ? '#5eead4' : 'rgba(94,234,212,.5)', i === pi.i + 1);
        D.text(ctx, 'WP' + i, X(q[0]), Y(q[1]) - 10, { size: 9, color: '#5eead4', align: 'center' });
      });

      /* ── 지나온 길 ── */
      if (st.trail.length > 1) {
        ctx.save(); ctx.strokeStyle = 'rgba(251,113,133,.55)'; ctx.lineWidth = 2;
        ctx.beginPath();
        st.trail.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])));
        ctx.stroke(); ctx.restore();
      }

      /* ── 전방주시점 ── */
      const a = WP[pi.i];
      const lx = a[0] + Math.cos(pi.ap) * (pi.s + p.look), ly = a[1] + Math.sin(pi.ap) * (pi.s + p.look);
      ctx.save(); ctx.strokeStyle = C.look; ctx.lineWidth = 1.4; ctx.setLineDash([3, 4]);
      if (hl === 'look') { ctx.shadowColor = C.look; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(X(st.x), Y(st.y), p.look * SC, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(st.x), Y(st.y)); ctx.lineTo(X(lx), Y(ly)); ctx.stroke(); ctx.restore();
      D.dot(ctx, X(lx), Y(ly), 4, C.look, hl === 'look');
      D.text(ctx, 'Δ = ' + fmt(p.look, 0) + ' m', X(lx) + 10, Y(ly) + 18,
        { size: 10, color: hl === 'look' ? '#fff' : C.look });

      /* ── 횡방향 오차 ── */
      const fx = a[0] + Math.cos(pi.ap) * pi.s, fy = a[1] + Math.sin(pi.ap) * pi.s;
      D.line(ctx, X(st.x), Y(st.y), X(fx), Y(fy), { color: C.e, width: 2, hot: hl === 'e' });
      D.tag(ctx, 'e = ' + fmt(pi.e, 0) + ' m', (X(st.x) + X(fx)) / 2 + 30, (Y(st.y) + Y(fy)) / 2, C.e, hl === 'e');

      /* ── 안전 반경 ── */
      ctx.save();
      ctx.strokeStyle = st.avoid ? 'rgba(244,114,182,.8)' : 'rgba(244,114,182,.3)';
      ctx.lineWidth = st.avoid ? 2.2 : 1.4; ctx.setLineDash([4, 5]);
      if (hl === 'Rs') { ctx.shadowColor = C.Rs; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(X(st.tx), Y(st.ty), p.Rs * SC, 0, 7); ctx.stroke(); ctx.restore();

      /* ── 타선 + 예측 경로 ── */
      const tc = p.tC * Math.PI / 180;
      ctx.save(); ctx.strokeStyle = 'rgba(251,191,36,.35)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(X(st.tx), Y(st.ty));
      ctx.lineTo(X(st.tx + Math.cos(tc) * p.tV * KN * 900), Y(st.ty + Math.sin(tc) * p.tV * KN * 900));
      ctx.stroke(); ctx.restore();
      const drawShip = (x, y, psi, col, hot, len) => {
        ctx.save(); ctx.translate(X(x), Y(y)); ctx.rotate(-psi);
        if (hot) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
        D.poly(ctx, [[len, 0], [len * .3, -len * .34], [-len * .7, -len * .3],
                     [-len * .7, len * .3], [len * .3, len * .34]],
          { fill: col, stroke: col, width: 1.6 });
        ctx.restore();
      };
      ctx.save(); ctx.globalAlpha = .55; drawShip(st.tx, st.ty, tc, '#fbbf24', hl === 'tV' || hl === 'tC', 12); ctx.restore();
      D.text(ctx, '타선 ' + fmt(p.tV, 1) + ' kn', X(st.tx), Y(st.ty) + 24,
        { size: 10, color: '#fbbf24', align: 'center' });

      /* ── 자선 ── */
      ctx.save(); ctx.globalAlpha = .75; drawShip(st.x, st.y, st.psi, '#fb7185', hl === 'V', 13); ctx.restore();
      D.text(ctx, '자선 ' + fmt(p.V, 1) + ' kn', X(st.x), Y(st.y) + 26,
        { size: 10, color: '#fb7185', align: 'center' });

      /* ── CPA 표시 ── */
      if (c.t > 0 && c.t < 1800) {
        const vx = p.V * KN * Math.cos(st.psi), vy = p.V * KN * Math.sin(st.psi);
        const ax = st.x + vx * c.t, ay = st.y + vy * c.t;
        const bx = st.tx + p.tV * KN * Math.cos(tc) * c.t, by = st.ty + p.tV * KN * Math.sin(tc) * c.t;
        ctx.save(); ctx.strokeStyle = c.d < p.Rs ? 'rgba(251,113,133,.85)' : 'rgba(251,146,60,.6)';
        ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(X(ax), Y(ay)); ctx.lineTo(X(bx), Y(by)); ctx.stroke(); ctx.restore();
        D.dot(ctx, X(ax), Y(ay), 3, '#fb923c', false);
        D.dot(ctx, X(bx), Y(by), 3, '#fb923c', false);
        D.tag(ctx, 'CPA ' + fmt(c.d, 0) + ' m / ' + fmt(c.t / 60, 1) + '분',
          (X(ax) + X(bx)) / 2, (Y(ay) + Y(by)) / 2 - 18,
          c.d < p.Rs ? '#fb7185' : C.cpa, hl === 'cpa');
      }

      /* ── 상태 ── */
      D.tag(ctx, st.avoid ? '충돌 회피 작동 — 우현 ' + fmt(st.off, 0) + '° 변침' : 'LOS 항로 추종 중',
        w * .5, 30, st.avoid ? '#fb7185' : '#34d399', true);
      D.text(ctx, '최근접 기록 ' + fmt(st.minD < 1e8 ? st.minD : 0, 0) + ' m  /  안전 반경 ' + fmt(p.Rs, 0) + ' m',
        24, h - 30, { size: 11, color: st.minD >= p.Rs ? '#34d399' : '#fb7185' });
      D.text(ctx, '화면 1초 = 실제 14초   ·   항로는 4개 경유점으로 이뤄진 지그재그',
        24, h - 12, { size: 9.5, color: '#4b5a80' });
    }
  });
})();
