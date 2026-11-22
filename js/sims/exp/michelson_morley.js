/* [유명한 실험] 마이컬슨-몰리 실험(1887) — 에테르 바람은 없었다
   빛을 반투명 거울로 둘로 나눠 서로 직각인 두 팔(길이 L)을 왕복시킨 뒤 다시 겹쳐 간섭무늬를 본다.
   에테르 가설: 지구가 에테르 속을 v 로 달리면, 바람과 나란한 팔 왕복 시간 t∥ = 2Lc/(c² − v²),
   가로지르는 팔 t⊥ = 2L/√(c² − v²). 팔이 바람과 각 α 를 이룰 때 일반식 t(α) = (2L/c)·√(1 − β²sin²α)/(1 − β²).
   장치를 θ 만큼 돌리면 무늬가 S(θ) = (ΔN/2)(1 − cos2θ) 만큼 밀려야 하고, 90° 에서 ΔN = 2c·Δt/λ ≈ 2Lv²/(λc²).
   1887년 관측은 0 (예측 0.4개의 20분의 1 아래). 화면의 빛은 아주 느리게, 바람 효과는 크게 과장해 그린다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { L: PAL.violet, v: PAL.steel, lam: PAL.teal, world: PAL.dusty, tpar: PAL.sage, tper: PAL.burnt, dt: PAL.rust, dN: PAL.amber };

  const CL = 299792458;                 // 빛의 속력 (m/s, 정의값)
  const SPIN = 15;                      // 장치가 도는 빠르기 (°/s, 화면 24초에 한 바퀴 — 6초에 90°, 무늬 이동이 가장 큰 자리)
  const CYCLE = 3.2;                    // 빛 알갱이를 다시 쏘는 간격 (화면 초)
  const RAD = Math.PI / 180;

  // 에테르 가설의 왕복 시간 (s) — 교과서 식 그대로
  function times(p) {
    const L = p.L, v = p.v * 1000, c = CL;
    const tpar = 2 * L * c / (c * c - v * v);
    const tper = 2 * L / Math.sqrt(c * c - v * v);
    const b2 = (v / c) * (v / c);
    // t∥ − t⊥ 는 아주 가까운 두 수의 차라 정리한 식으로: (2L/c)·(1/(1−β²) − 1/√(1−β²)) = (2L/c)·(1 − √(1−β²))/(1−β²)
    const dt = (2 * L / c) * (b2 / (1 + Math.sqrt(1 - b2))) / (1 - b2);
    const dN = 2 * c * dt / (p.lam * 1e-9);
    return { tpar, tper, dt, dN };
  }
  // 장치를 θ(°) 돌렸을 때 에테르 가설이 예측하는 무늬 이동 (처음 자리 기준, 무늬 개수)
  const shiftAt = (dN, th) => dN / 2 * (1 - Math.cos(2 * th * RAD));

  PS.register({
    id: 'exp-michelson', mode: 'exp', category: '빛의 정체를 밝히다',
    title: '마이컬슨-몰리 실험 (1887)',
    sub: 'ΔN = 2Lv² ⁄ (λc²), 관측값은 0',
    tagline: '빛을 둘로 나눠 서로 직각인 두 팔을 왕복시킨 뒤 겹쳐 봅니다. 장치를 돌려도 간섭무늬가 움직이지 않아 에테르 바람이 없다는 것을 확인합니다.',

    params: [
      { key: 'L', symbol: 'L', label: '팔의 길이', unit: 'm', min: 1, max: 15, step: .1, value: 11, color: C.L, dec: 1,
        where: '가운데 반투명 거울에서 끝 거울까지의 <b>보라색 두 팔</b>입니다. 1887년 장치는 거울로 빛을 여러 번 오가게 해 약 11 m 였습니다.' },
      { key: 'v', symbol: 'v', label: '지구의 공전 속도', unit: 'km/s', min: 0, max: 60, step: 1, value: 30, color: C.v, dec: 0,
        where: '왼쪽 아래 <b>파란 화살표</b>입니다. 에테르 가설에서는 이 속도로 반대 방향의 에테르 바람이 분다고 보았습니다.' },
      { key: 'lam', symbol: 'λ', label: '빛의 파장', unit: 'nm', min: 400, max: 700, step: 10, value: 550, color: C.lam, dec: 0,
        where: '오른쪽(폰에서는 아래) <b>청록 줄무늬</b>의 간격을 정합니다. 시간 차가 같아도 파장이 짧을수록 무늬가 더 많이 밀립니다.' },
      { key: 'world', symbol: '', label: '어느 세계를 볼까', unit: '', min: 0, max: 1, step: 1, value: 0, color: C.world, dec: 0,
        where: '<b>0 = 실제 자연</b>(1887년에 본 결과, 빛은 어느 방향으로나 같은 빠르기) / <b>1 = 에테르 가설</b>(빛이 에테르 바람에 밀린다고 가정한 세계).' }
    ],
    vars: {
      tpar: { symbol: 't∥', label: '바람과 나란한 팔 왕복 시간 (에테르 가설)', unit: 'ns', color: C.tpar,
        where: '팔이 바람 방향과 나란할 때 빛이 갔다 오는 시간입니다. 그 순간 그 팔이 <b>초록색</b>으로 바뀝니다.' },
      tper: { symbol: 't⊥', label: '바람을 가로지르는 팔 왕복 시간 (에테르 가설)', unit: 'ns', color: C.tper,
        where: '팔이 바람 방향과 직각일 때 빛이 갔다 오는 시간입니다. 그 순간 그 팔이 <b>주황색</b>으로 바뀝니다.' },
      dt: { symbol: 'Δt', label: '두 팔의 왕복 시간 차', unit: 'fs', color: C.dt,
        where: '에테르 가설에서 두 빛이 돌아오는 시간의 차이입니다. 1 fs(펨토초)는 1000조분의 1초로, 측정값 목록에 나옵니다.' },
      dN: { symbol: 'ΔN', label: '90° 돌릴 때 예측한 무늬 이동', unit: '개', color: C.dN,
        where: '오른쪽 간섭무늬 위의 <b>노란 점선</b>이 처음 자리에서 밀려나는 최대 거리입니다. 무늬 한 칸이 1개입니다.' }
    },
    formulas: [
      { name: '바람과 나란한 팔 왕복 시간 (에테르 가설)', tpl: '{tpar} = 2{L}c ⁄ (c² − {v}²)' },
      { name: '바람을 가로지르는 팔 왕복 시간 (에테르 가설)', tpl: '{tper} = 2{L} ⁄ √(c² − {v}²)' },
      { name: '두 팔의 시간 차', tpl: '{dt} = {tpar} − {tper} ≈ {L}{v}² ⁄ c³' },
      { name: '장치를 90° 돌릴 때 무늬 이동 (가설의 예측, 관측은 0)', tpl: '{dN} = 2c{dt} ⁄ {lam} ≈ 2{L}{v}² ⁄ ({lam}c²)' }
    ],

    init() { return { th: 0, tau: 0 }; },
    step(st, p, dt) {
      st.th += SPIN * dt; if (st.th >= 360) st.th -= 360;     // 장치 회전 각도 (°)
      st.tau += dt; if (st.tau >= CYCLE) st.tau -= CYCLE;     // 빛 알갱이 시계
    },

    graphs: [
      { title: '장치 각도에 따른 간섭무늬 이동', xKey: 'ang', xUnit: '°', xMin: 0, xMax: 360, y0: 0,
        series: [{ key: 'sp', label: '에테르 가설의 예측 (무늬 개수)', color: C.dN }, { key: 'so', label: '이 화면에 보이는 무늬 이동', color: PAL.sage }] }
    ],
    sample(st, p) {
      const T = times(p), s = shiftAt(T.dN, st.th);
      return { ang: st.th, sp: s, so: p.world >= 1 ? s : 0 };
    },

    readouts(st, p) {
      const T = times(p), s = shiftAt(T.dN, st.th), eth = p.world >= 1;
      return [
        { label: '장치를 돌린 각도 θ', value: st.th, unit: '°', dec: 0 },
        { label: '바람과 나란한 팔 왕복 시간 t∥ (가설)', value: T.tpar * 1e9, unit: 'ns', color: C.tpar, dec: 4 },
        { label: '바람을 가로지르는 팔 왕복 시간 t⊥ (가설)', value: T.tper * 1e9, unit: 'ns', color: C.tper, dec: 4 },
        { label: '두 팔의 시간 차 Δt (가설)', value: T.dt * 1e15, unit: 'fs', color: C.dt, dec: 4 },
        { label: '90° 돌릴 때 예측한 무늬 이동 ΔN', value: T.dN, unit: '개', color: C.dN, dec: 3 },
        { label: '지금 각도에서 예측한 무늬 이동', value: s, unit: '개', color: C.dN, dec: 3 },
        { label: '이 화면에 보이는 무늬 이동', value: eth ? s : 0, unit: '개', color: PAL.sage, dec: 3 },
        { label: '1887년 실제 관측', value: '0.02개보다 작음 (예측의 20분의 1 아래)', unit: '' },
        { label: '읽는 법', wide: true, color: eth ? C.dN : PAL.sage,
          value: eth ? '에테르가 있다면 장치를 돌릴 때 무늬가 최대 ' + fmt(T.dN, 2) + '개 밀려야 한다. 실제 실험에서는 이렇게 움직이지 않았다'
                     : '장치를 돌려도 무늬가 그대로다. 빛은 방향과 상관없이 같은 빠르기로 오가고, 에테르 바람은 없다' }
      ];
    },

    notes: [
      '강에서 배가 물살을 따라 갔다 오는 것과, 같은 거리를 강을 가로질러 갔다 오는 것은 시간이 다릅니다. 물살을 따라 왕복하는 쪽이 늘 조금 더 늦습니다.',
      '19세기 과학자들은 빛도 소리처럼 <b>에테르</b>라는 매질 속을 지난다고 생각했습니다. 지구가 초속 30 km 로 돌면 에테르 바람 때문에 빛의 빠르기가 방향마다 달라져야 합니다.',
      '이 장치는 빛을 둘로 나눠 직각인 두 팔을 왕복시킨 뒤 다시 겹칩니다. 돌아오는 시간이 아주 조금만 달라도 <b>간섭무늬</b>가 옆으로 밀립니다.',
      '장치를 90° 돌리면 두 팔의 역할이 바뀌어, 에테르가 있다면 무늬가 약 0.4개 움직여야 했습니다. 실제로는 그 20분의 1도 움직이지 않았습니다.',
      '이 결과는 "빛의 속력은 누구에게나 같다"는 특수 상대성이론(1905)의 바탕이 되었습니다. 같은 원리의 간섭계가 오늘날 중력파 검출기(LIGO)입니다.',
      '그림 속 빛은 눈에 보이도록 아주 느리게, 바람 효과는 크게 과장해 그렸습니다. 실제 두 팔의 시간 차는 1000조분의 1초(펨토초) 정도입니다.'
    ],
    presets: [
      { name: '1887년 실험 그대로 (실제 결과)', set: { L: 11, v: 30, lam: 550, world: 0 } },
      { name: '에테르 가설이 맞았다면', set: { L: 11, v: 30, lam: 550, world: 1 } },
      { name: '1881년 첫 실험 (팔 1.2 m)', set: { L: 1.2, v: 30, lam: 550, world: 1 } },
      { name: '바람이 두 배라면 (v = 60 km/s)', set: { L: 11, v: 60, lam: 550, world: 1 } }
    ],
    challenges: [
      {
        id: 'one', title: '무늬 한 칸 이동 예측',
        desc: '에테르 가설이 예측하는 무늬 이동 ΔN 이 정확히 1개(0.95~1.05)가 되게 만들어 보세요.',
        hint: 'ΔN ≈ 2Lv² ⁄ (λc²) 입니다. 팔을 길게, 파장을 짧게 하거나 속도를 키우면 커집니다. 속도는 제곱으로 들어갑니다.',
        check: ({ P }) => { const n = times(P).dN; return n >= .95 && n <= 1.05; }
      },
      {
        id: 'y1881', title: '1881년의 아쉬움',
        desc: '지구 속도를 실제 값 30 km/s 로 둔 채, 예측 무늬 이동이 0.05개 이하가 되게 해 보세요. 마이컬슨의 첫 실험이 확신을 못 준 까닭입니다.',
        hint: '1881년 장치의 팔은 약 1.2 m 였습니다. 팔을 짧게 줄여 보세요.',
        check: ({ P }) => Math.abs(P.v - 30) < .5 && times(P).dN <= .05
      },
      {
        id: 'big', title: '에테르 세계에서 크게',
        desc: '에테르 가설의 세계(1)로 바꾸고, 무늬가 2개 넘게 밀리도록 만들어 보세요. 실제 실험이었다면 놓칠 수 없는 크기입니다.',
        hint: '속도를 60 km/s 가까이 올리고 팔을 길게, 파장은 짧게 해 보세요.',
        check: ({ P }) => P.world >= 1 && times(P).dN >= 2
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600, small = h < 330;
      const eth = p.world >= 1, T = times(p);
      const th = st.th * RAD, cs = Math.cos(th), sn = Math.sin(th);

      /* ── 배치: 넓으면 [장치 | 간섭무늬], 좁으면 위 장치, 아래 간섭무늬 ── */
      const aw = narrow ? w : w * .6, ah = narrow ? h * .6 : h;
      // 돌판의 먼 모서리(대각선 √2·(S + 12))가 장치 칸 안에서 돌도록 크기를 정한다
      const R = Math.min(aw / 2 - 8, ah / 2 - 4), S = Math.max(20, R / 1.42 - 12);   // 팔이 가장 길 때(15 m)의 화면 길이
      const ell = S * (.55 + .45 * p.L / 15), a = S * .5;             // 팔 길이, 광원·망원경까지 거리
      const cx = aw / 2, cy = ah / 2 + 2;
      const P2 = q => [cx + q[0] * cs - q[1] * sn, cy - (q[0] * sn + q[1] * cs)];   // 장치 좌표(위 = +) → 화면
      if (narrow) D.line(ctx, 8, ah, w - 8, ah, { color: PS.rgba('line', .9) });
      else D.line(ctx, aw + 4, 10, aw + 4, h - 10, { color: PS.rgba('line', .9) });

      // 에테르 바람 (가설의 세계에서만) — 지구 진행 방향(오른쪽)의 반대로 흐른다
      if (eth && p.v > 0) {
        const sp = 20 + 60 * p.v / 60, off = (st.t * sp) % 80;
        for (let r = 0; r < 4; r++) {
          const yy = cy - 1.35 * S + r * .9 * S;
          if (yy < 36 || yy > ah - 30) continue;
          for (let x = aw - 10 - off - (r % 2) * 40; x > 36; x -= 80)
            D.arrow(ctx, x, yy, -26, 0, { color: PS.rgba('steel', .42), width: 1.2, head: 5 });
        }
      }

      // 돌판 (실제 장치는 수은 위에 띄운 돌판이라 천천히 돌릴 수 있었다)
      const b0 = -a - 12, b1 = ell + 12;
      D.poly(ctx, [[b0, b0], [b1, b0], [b1, b1], [b0, b1]].map(P2),
        { fill: PS.rgba('ink3', .12), stroke: PS.rgba('ink3', .45), width: 1 });

      // 팔 — 바람과 나란하면 초록(t∥), 직각이면 주황(t⊥)
      const armCol = ang => { const c = Math.abs(Math.cos(ang)); return c > .97 ? C.tpar : (c < .25 ? C.tper : C.L); };
      const O = P2([0, 0]), MA = P2([ell, 0]), MB = P2([0, ell]), SRC = P2([-a, 0]), DET = P2([0, -a]);
      const cA = armCol(th), cB = armCol(th + Math.PI / 2);
      D.line(ctx, O[0], O[1], MA[0], MA[1], { color: cA, width: 4, hot: hl === 'L' || (hl === 'tpar' && cA === C.tpar) || (hl === 'tper' && cA === C.tper) });
      D.line(ctx, O[0], O[1], MB[0], MB[1], { color: cB, width: 4, hot: hl === 'L' || (hl === 'tpar' && cB === C.tpar) || (hl === 'tper' && cB === C.tper) });
      D.line(ctx, SRC[0], SRC[1], O[0], O[1], { color: PS.rgba('teal', .35), width: 1.5 });
      D.line(ctx, O[0], O[1], DET[0], DET[1], { color: PS.rgba('teal', .35), width: 1.5 });
      // 끝 거울 두 개와 가운데 반투명 거울
      const mir = (q, d) => { const m1 = P2([q[0] + d[0], q[1] + d[1]]), m2 = P2([q[0] - d[0], q[1] - d[1]]); D.line(ctx, m1[0], m1[1], m2[0], m2[1], { color: PAL.ink, width: 3 }); };
      const mh = Math.max(7, S * .09);
      mir([ell, 0], [0, mh]); mir([0, ell], [mh, 0]);
      const bs1 = P2([-mh * .8, -mh * .8]), bs2 = P2([mh * .8, mh * .8]);
      D.line(ctx, bs1[0], bs1[1], bs2[0], bs2[1], { color: PS.rgba('ink', .7), width: 2.5 });
      D.dot(ctx, SRC[0], SRC[1], 5, PAL.teal);
      D.poly(ctx, [[-6, -4], [6, -4], [6, -14], [-6, -14]].map(q => P2([q[0], -a + q[1] + 4])), { fill: PS.rgba('ink2', .7) });

      // 이름 — 장치와 함께 돌아가는 자리
      const lab = (q, t, col) => { const s2 = P2(q); D.text(ctx, t, s2[0], s2[1] + 4, { size: small ? 9.5 : 10.5, color: col, align: 'center' }); };
      lab([ell + 22, 0], '팔 1', cA === C.L ? PAL.ink2 : cA);
      lab([0, ell + 20], '팔 2', cB === C.L ? PAL.ink2 : cB);
      if (!small) { lab([-a - 26, 0], '광원', PAL.ink3); lab([0, -a - 26], '망원경', PAL.ink3); }

      // 빛 알갱이 — 그림 속 빛의 빠르기는 1 (팔 S 를 0.5초에), 에테르 세계에서는 바람 β = v/100 (과장)
      const bv = eth ? p.v / 100 : 0, wl = [-bv * cs, bv * sn];          // 장치 좌표에서 본 바람
      const cpx = S / .5;
      const speed = u => { const uw = u[0] * wl[0] + u[1] * wl[1]; return uw + Math.sqrt(uw * uw + 1 - bv * bv); };
      function walk(pts, tau) {
        let t0 = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], d = Math.hypot(dx, dy);
          const ts = d / (cpx * speed([dx / d, dy / d]));
          if (tau <= t0 + ts) { const f = (tau - t0) / ts; return { q: [pts[i][0] + dx * f, pts[i][1] + dy * f], end: t0 + ts, done: false }; }
          t0 += ts;
        }
        return { q: pts[pts.length - 1], end: t0, done: true };
      }
      const pathA = [[-a, 0], [0, 0], [ell, 0], [0, 0], [0, -a]], pathB = [[-a, 0], [0, 0], [0, ell], [0, 0], [0, -a]];
      const tA = walk(pathA, 1e9).end, tB = walk(pathB, 1e9).end;
      const qa = walk(pathA, st.tau), qb = walk(pathB, st.tau);
      if (st.tau < Math.max(tA, tB) + .35) {
        [qa, qb].forEach(r => { const s2 = P2(r.q); D.dot(ctx, s2[0], s2[1], r.done ? 3 : 4.5, PS.rgba('teal', r.done ? .5 : 1), hl === 'lam'); });
      }

      // 머리글: 어느 세계인가, 각도, 도착 상태
      const fs = small ? 10 : 11.5;
      D.text(ctx, eth ? '에테르 가설의 세계' : '실제 자연 (1887년 결과)', 8, 14, { size: fs, color: C.world, bold: true });
      D.text(ctx, 'θ = ' + fmt(st.th, 0) + '°', aw - 8, 14, { size: fs, color: PAL.ink, align: 'right', bold: true });
      if (!small) {
        let msg;
        if (st.tau < Math.min(tA, tB)) msg = '빛이 두 팔을 왕복하는 중';
        else if (Math.abs(tA - tB) < .01) msg = '두 빛이 동시에 돌아옴';
        else msg = (tA < tB ? '팔 1' : '팔 2') + ' 빛이 먼저 돌아옴';
        D.text(ctx, msg, 8, 30, { size: 10.5, color: PAL.ink2 });
      }

      // 지구의 공전 속도 v — 왼쪽 아래 화살표
      const vy = ah - (small ? 8 : 14), vl = (narrow ? aw * .22 : aw * .25) * p.v / 60;
      D.arrow(ctx, 10, vy, vl, 0, { color: C.v, width: 2.4, head: 8, hot: hl === 'v' });
      D.text(ctx, '지구 v ' + fmt(p.v, 0) + ' km/s', 10, vy - 9, { size: small ? 9.5 : 10.5, color: C.v, bold: hl === 'v' });
      if (!small) D.text(ctx, eth ? '에테르 바람 (가설) ←' : '에테르 바람 없음', aw - 8, vy - 9, { size: 10, color: eth ? C.v : PAL.ink3, align: 'right' });
      if (!small && !narrow) D.text(ctx, '그림의 빛은 아주 느리게, 바람 효과는 과장', aw - 8, vy + 5, { size: 9.5, color: PAL.ink3, align: 'right' });

      /* ── 간섭무늬 (관측 망원경 속) ── */
      const fx0 = narrow ? 14 : aw + 22, fx1 = w - 14;
      const fy0 = narrow ? ah + (small ? 18 : 42) : (small ? 44 : 70), fy1 = narrow ? h - (small ? 20 : 40) : h - (small ? 34 : 70);
      const pw = fx1 - fx0, per = pw / 5, xc = fx0 + pw / 2;
      const sPred = shiftAt(T.dN, st.th), sShow = eth ? sPred : 0;
      ctx.save();
      ctx.beginPath(); ctx.rect(fx0, fy0, pw, fy1 - fy0); ctx.clip();
      for (let x = fx0; x < fx1; x += 2) {
        const I = Math.pow(Math.cos(Math.PI * ((x + 1 - xc) / per - sShow)), 2);
        ctx.fillStyle = PS.rgba('teal', .06 + .8 * I);
        ctx.fillRect(x, fy0, 2, fy1 - fy0);
      }
      ctx.restore();
      D.poly(ctx, [[fx0, fy0], [fx1, fy0], [fx1, fy1], [fx0, fy1]], { stroke: hl === 'lam' ? C.lam : PS.rgba('ink3', .6), width: hl === 'lam' ? 2 : 1, hot: hl === 'lam' });
      // 처음 자리(가운데 밝은 무늬가 처음 있던 곳)
      D.line(ctx, xc, fy0 - 4, xc, fy1 + 4, { color: PS.rgba('ink', .55), width: 1, dash: [2, 3] });
      // 에테르 가설의 예측 자리
      const xp = xc + sPred * per;
      D.line(ctx, xp, fy0 - 6, xp, fy1 + 6, { color: C.dN, width: hl === 'dN' ? 2.6 : 1.8, dash: [5, 4], hot: hl === 'dN' });
      D.tag(ctx, '가설의 예측 ' + fmt(sPred, 2) + '개', xp, fy0 - 14, C.dN, hl === 'dN');
      if (!small) {
        D.text(ctx, narrow ? '간섭무늬 (망원경 속)' : '간섭무늬 (관측 망원경 속)', fx0, narrow ? ah + 16 : fy0 - 32,{ size: 11, color: PAL.ink2, bold: true });
        D.text(ctx, '점선 흰 줄: 처음 자리', fx0, fy1 + 18, { size: 9.5, color: PAL.ink3 });
        D.text(ctx, '보이는 무늬 이동 ' + fmt(sShow, 2) + '개', fx1, fy1 + 18, { size: 10.5, color: PAL.sage, align: 'right', bold: true });
        if (!narrow) D.text(ctx, 'ΔN = ' + fmt(T.dN, 3) + '개 (90°에서 최대)', fx0, fy1 + 36, { size: 10.5, color: C.dN, bold: hl === 'dN' });
      } else {
        D.text(ctx, '보이는 이동 ' + fmt(sShow, 2) + '개', fx1, fy1 + 14, { size: 9.5, color: PAL.sage, align: 'right' });
      }
    }
  });
})();
