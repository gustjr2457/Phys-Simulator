/* [항공우주공학] 로켓 방정식과 궤도 진입 — Δv = Isp·g₀·ln(m₀/m_f), 중력 선회 */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Isp: '#fbbf24', lam: '#f472b6', TW: '#34d399', kick: '#60a5fa', dv: '#5eead4', v: '#60a5fa', loss: '#fb7185' };
  const G0 = 9.80665, M0 = 50000;
  const MU = 3.986e14, RE = 6.371e6;
  const H_KICK = 1500, KICK_DUR = 12;      // 킥 시작 고도(m), 킥 지속 시간(s)
  const TS_BURN = 14, TS_COAST = 320;      // 시간 배속

  const mfOf = p => M0 * (1 - p.lam);
  const dvIdeal = p => p.Isp * G0 * Math.log(M0 / mfOf(p));
  const thrust = p => p.TW * M0 * G0;
  const mdot = p => thrust(p) / (p.Isp * G0);
  const tBurn = p => (M0 - mfOf(p)) / mdot(p);
  const mmss = s => Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2);

  // 현재 상태의 궤도 요소
  function orbit(st) {
    const r = Math.hypot(st.x, st.y), v = Math.hypot(st.vx, st.vy);
    const invA = 2 / r - v * v / MU;
    const a = invA > 1e-14 ? 1 / invA : Infinity;
    const hA = st.x * st.vy - st.y * st.vx;
    const e = isFinite(a) ? Math.sqrt(Math.max(0, 1 - hA * hA / (MU * a))) : 1;
    return { r, v, a, e, rp: isFinite(a) ? a * (1 - e) : NaN, ra: isFinite(a) ? a * (1 + e) : Infinity };
  }

  PS.register({
    id: 'space-rocket', mode: 'adv', category: '항공우주공학',
    title: '로켓 방정식과 궤도 진입',
    sub: 'Δv = Isp·g₀·ln(m₀/m_f)',
    tagline: '똑바로 위로만 쏘면 아무리 힘이 좋아도 반드시 떨어집니다. 궤도는 높이가 아니라 옆으로 가는 속도입니다.',

    params: [
      { key: 'Isp', symbol: 'Isp', label: '비추력', unit: 's', min: 200, max: 460, step: 10, value: 450, color: C.Isp, reset: true, dec: 0,
        where: '<b>엔진의 연비</b>입니다. 배기 속도 v_e = Isp·g₀이며 화염의 길이로 나타납니다. 고체 260, 케로신 300, 액체수소 450초 수준입니다.' },
      { key: 'lam', symbol: 'λ', label: '추진제 질량비', unit: '', min: .5, max: .95, step: .01, value: .90, color: C.lam, reset: true, dec: 2,
        where: '전체 질량 중 <b>연료의 비율</b>입니다. 왼쪽 탱크 게이지가 이만큼 채워집니다. ln 안에 들어가므로 0.9를 넘어서면 효과가 급격히 커집니다.' },
      { key: 'TW', symbol: 'T/W', label: '추력 대 중량비', unit: '', min: 1.1, max: 4, step: .1, value: 1.5, color: C.TW, reset: true, dec: 1,
        where: '<b>엔진의 힘</b>입니다. 1보다 커야 이륙합니다. 크면 연소 시간이 짧아져 중력 손실이 줄지만 체감 G가 커집니다.' },
      { key: 'kick', symbol: 'θ', label: '최종 기울기 (피치 프로그램)', unit: '°', min: 0, max: 110, step: 1, value: 90, color: C.kick, reset: true, dec: 0,
        where: '고도 1.5 km부터 연소 종료까지 로켓을 <b>연직에서 옆으로 서서히 눕히는 최종 각도</b>입니다. <b>궤도 진입의 열쇠</b>입니다. 0°면 수직으로만 올라가 반드시 떨어지고, 90°에 가까우면 고도를 못 얻어 지면에 부딪힙니다. 실제 발사체도 이런 피치 프로그램을 따라 비행합니다.' }
    ],
    vars: {
      dv: { symbol: 'Δv', label: '이상적 속도 증가량', unit: 'm/s', color: C.dv,
        where: '로켓이 낼 수 있는 <b>속도의 총량</b>입니다. 오른쪽 Δv 게이지이며, 여기서 중력 손실을 뺀 값이 실제 속도가 됩니다.' },
      m0: { symbol: 'm₀', label: '이륙 질량', unit: 'kg', color: C.lam, where: '연료를 가득 채운 출발 질량(50 t 고정)입니다.' },
      mf: { symbol: 'm_f', label: '연소 종료 질량', unit: 'kg', color: C.lam,
        where: '연료를 다 쓴 뒤 남는 <b>빈 로켓 + 화물</b>입니다. 작을수록 ln 안의 비가 커집니다.' },
      loss: { symbol: 'g₀t_b', label: '중력 손실', unit: 'm/s', color: C.loss,
        where: '올라가는 동안 <b>중력이 깎아 먹은 속도</b>의 누적입니다. 수직으로 갈수록 크고, 일찍 옆으로 누울수록 작아집니다 — 그래서 중력 선회를 합니다.' },
      v: { symbol: 'v', label: '현재 속도', unit: 'm/s', color: C.v,
        where: '실제 속도입니다. <b>수평 성분</b>이 궤도 속도(약 7.8 km/s)에 도달해야 떨어지지 않습니다.' }
    },
    formulas: [
      { name: '치올콥스키 로켓 방정식', tpl: '{dv} = {Isp} · g₀ · ln( {m0} ⁄ {mf} )' },
      { name: '연소 종료 질량', tpl: '{mf} = {m0} · ( 1 − {lam} )' },
      { name: '중력 손실', tpl: '{loss} = ∫ g·sin γ dt   (γ = 비행 경로각)' },
      { name: '원궤도 속도', tpl: 'v_c = √( μ ⁄ r ) ≈ 7.8 km/s' },
      { name: '궤도 진입 조건', tpl: '근지점 고도 = a(1−e) − R⊕ > 100 km' }
    ],

    init(p) {
      return {
        x: 0, y: RE, vx: 0, vy: 0, m: M0,
        burning: true, phase: 0, tKick: 0, gLoss: 0,
        trail: [], smoke: [], smokeT: 0,
        events: [{ mt: 0, label: '이륙' }], mt: 0,
        apogee: 0, done: false, verdict: '', karman: false, meco: false, shake: 0
      };
    },

    step(st, p, dt) {
      if (st.done) return;
      const ts = st.burning ? TS_BURN : TS_COAST;
      const dtp = dt * ts;
      st.mt += dtp;

      const r = Math.hypot(st.x, st.y);
      const h = r - RE;
      const ur = [st.x / r, st.y / r];                       // 지역 연직(위)
      const v = Math.hypot(st.vx, st.vy);
      const uv = v > 1 ? [st.vx / v, st.vy / v] : ur;        // 속도 방향

      // ── 추력 방향: 수직 상승 → 피치 프로그램(연직에서 서서히 눕힘) ──
      let dir = ur, pitch = 0;
      if (st.burning) {
        if (st.phase === 0 && h > H_KICK) { st.phase = 1; st.tKick = st.mt; st.events.push({ mt: st.mt, label: '피치 프로그램 시작' }); }
        if (st.phase >= 1) {
          const prog = clamp((st.mt - st.tKick) / Math.max(1, tBurn(p) * .88 - st.tKick), 0, 1);
          pitch = p.kick * Math.PI / 180 * Math.pow(prog, .42);
          dir = [ur[0] * Math.cos(pitch) + ur[1] * Math.sin(pitch),
                -ur[0] * Math.sin(pitch) + ur[1] * Math.cos(pitch)];
        }
      }
      st.pitch = pitch;

      // ── 가속도 ──
      const g = MU / (r * r);
      let ax = -g * ur[0], ay = -g * ur[1];
      if (st.burning) {
        const acc = thrust(p) / st.m;
        ax += acc * dir[0]; ay += acc * dir[1];
        st.m = Math.max(mfOf(p), st.m - mdot(p) * dtp);
        if (st.m <= mfOf(p) + 1e-6) {
          st.burning = false; st.meco = true;
          st.events.push({ mt: st.mt, label: '연소 종료 (MECO)' });
        }
      }
      // 중력 손실: 속도 방향이 연직에 가까울수록 크다
      const sinG = v > 1 ? (st.vx * ur[0] + st.vy * ur[1]) / v : 1;
      if (st.burning) st.gLoss += g * Math.max(0, sinG) * dtp;

      st.vx += ax * dtp; st.vy += ay * dtp;
      st.x += st.vx * dtp; st.y += st.vy * dtp;

      const r2 = Math.hypot(st.x, st.y), h2 = r2 - RE;
      st.apogee = Math.max(st.apogee, h2);
      if (h2 > 100000 && !st.karman) { st.karman = true; st.events.push({ mt: st.mt, label: '카르만 선 통과 — 우주' }); }

      // 자취
      st.trailT = (st.trailT || 0) + dt;
      if (st.trailT > .02) { st.trailT = 0; st.trail.push([st.x, st.y]); if (st.trail.length > 1800) st.trail.shift(); }

      // 배기 연기 (실제 크기 m 단위)
      st.smokeT += dt;
      if (st.burning && st.smokeT > .04) {
        st.smokeT = 0;
        st.smoke.push({ x: st.x, y: st.y, rm: 24 + Math.random() * 16, age: 0 });
        if (st.smoke.length > 80) st.smoke.shift();
      }
      st.smoke.forEach(s => { s.age += dt; s.rm = Math.min(s.rm + dtp * 22, 700); });
      if (st.smoke.length && st.smoke[0].age > 5) st.smoke = st.smoke.filter(s => s.age <= 5);
      st.shake = st.burning ? clamp(p.TW * .8, 0, 3.5) : 0;

      // ── 판정 ──
      const ob = orbit(st);
      if (st.meco && !st.verdict) {
        // 탈출 여부는 에너지로 판단한다 (수직 발사는 e≈1이지만 탈출이 아니다)
        if (!isFinite(ob.a)) {
          st.verdict = 'escape';
          st.events.push({ mt: st.mt, label: '지구 탈출 궤도 — Δv 과잉' });
        } else if (ob.rp - RE > 0) {
          st.verdict = 'orbit';
          st.events.push({ mt: st.mt, label: '궤도 진입 성공 — 근지점 ' + fmt((ob.rp - RE) / 1000, 0) + ' km' });
        } else st.verdict = 'suborbital';
      }
      if (h2 <= 0 && st.mt > 5) {
        st.done = true;
        if (!st.verdict) st.verdict = 'crash';
        st.events.push({ mt: st.mt, label: st.verdict === 'orbit' ? '재진입' : '추락 — 궤도 진입 실패' });
      }
      // 궤도에 안착했으면 한 바퀴쯤 보여주고 멈춘다
      if ((st.verdict === 'orbit' || st.verdict === 'escape') && st.mt > st.events[st.events.length - 1].mt + 7000) st.done = true;
    },

    graphs: [
      { title: '고도 – 시간', xmin: 10, window: 40, y0: 0, series: [{ key: 'alt', label: '고도 (km)', color: C.TW }] },
      { title: '속도 – 시간', xmin: 10, window: 40, y0: 0,
        series: [{ key: 'v', label: '속도 (m/s)', color: C.v }, { key: 'vh', label: '수평 성분', color: C.kick }] }
    ],
    sample(st) {
      const r = Math.hypot(st.x, st.y);
      const ur = [st.x / r, st.y / r];
      const vr = st.vx * ur[0] + st.vy * ur[1];
      const v = Math.hypot(st.vx, st.vy);
      return { alt: (r - RE) / 1000, v: v, vh: Math.sqrt(Math.max(0, v * v - vr * vr)) };
    },

    readouts(st, p) {
      const ob = orbit(st);
      const ur = [st.x / ob.r, st.y / ob.r];
      const vr = st.vx * ur[0] + st.vy * ur[1];
      const vh = Math.sqrt(Math.max(0, ob.v * ob.v - vr * vr));
      const gamma = ob.v > 1 ? Math.asin(clamp(vr / ob.v, -1, 1)) * 180 / Math.PI : 90;
      const gForce = st.burning ? thrust(p) / (st.m * G0) : 0;
      const vc = Math.sqrt(MU / ob.r);
      return [
        { label: '이상적 Δv', value: dvIdeal(p), unit: 'm/s', color: C.dv, dec: 0 },
        { label: '중력 손실 (누적)', value: st.gLoss, unit: 'm/s', color: C.loss, dec: 0 },
        { label: '고도', value: (ob.r - RE) / 1000, unit: 'km', color: C.TW },
        { label: '속도', value: ob.v, unit: 'm/s', color: C.v, dec: 0 },
        { label: '수평 속도', value: vh, unit: 'm/s', color: C.kick, dec: 0 },
        { label: '필요 원궤도 속도', value: vc, unit: 'm/s', dec: 0 },
        { label: '비행 경로각 γ', value: gamma, unit: '°' },
        { label: '체감 중력', value: gForce, unit: 'G', color: gForce > 4 ? '#fb7185' : C.TW },
        { label: '근지점 고도', value: isFinite(ob.rp) ? (ob.rp - RE) / 1000 : '탈출', unit: isFinite(ob.rp) ? 'km' : '', dec: 0 },
        { label: '원지점 고도', value: isFinite(ob.ra) ? (ob.ra - RE) / 1000 : '탈출', unit: isFinite(ob.ra) ? 'km' : '', dec: 0 },
        {
          label: '궤도 판정', wide: true,
          color: st.verdict === 'orbit' ? '#34d399' : (st.verdict === 'escape' ? '#a78bfa' : (st.verdict ? '#fb7185' : '#fbbf24')),
          value: st.verdict === 'orbit' ? '✔ 궤도 진입 성공 (타원 궤도)'
            : st.verdict === 'escape' ? '지구 탈출 궤도 — Δv가 과합니다'
              : st.verdict === 'crash' ? '✘ 추락 — 너무 일찍 눕혀 고도를 얻지 못했습니다'
                : (st.verdict ? '✘ 준궤도 — 근지점이 지면 아래라 떨어집니다'
                  : (st.burning ? '연소 중 — 수평 속도를 쌓는 중' : '관성 비행'))
        }
      ];
    },

    notes: [
      '<b>수직으로만 올라가면 반드시 떨어집니다.</b> 기울기를 0°로 두고 확인해 보세요 — 고도 19,000 km까지 솟았다가 그대로 돌아옵니다. 궤도는 "높이"가 아니라 <b>"옆으로 가는 속도"</b>이기 때문입니다.',
      '반대로 너무 일찍 눕히면(100° 이상) 고도를 얻지 못해 지면에 부딪힙니다. <b>그 사이의 최적점</b>을 찾는 것이 발사 궤적 설계입니다.',
      '수직으로 갈수록 <b>중력 손실</b>이 커집니다. 기울기를 키울수록 손실 막대가 줄어드는 것을 확인해 보세요.',
      '성공해도 결과는 <b>길쭉한 타원 궤도</b>입니다. 실제 발사는 여기서 원지점에 도달했을 때 한 번 더 점화해 원궤도로 만듭니다 — <b>호만 전이 시뮬레이션</b>이 바로 그 단계입니다.',
      'Isp 300 · λ 0.85(현실적인 1단)로는 <b>어떤 각도로도 궤도에 못 갑니다.</b> Δv 5,581 m/s로는 7,800 m/s에 못 미칩니다 — 실제 로켓이 <b>다단</b>인 이유입니다.',
      'λ을 0.95까지 올리면 Δv가 11.2 km/s인 <b>탈출 속도</b>를 넘어 지구를 아예 떠나 버립니다.'
    ],
    presets: [
      { name: '궤도 진입 성공', set: { Isp: 450, lam: .90, TW: 1.5, kick: 90 } },
      { name: '수직 발사 (반드시 실패)', set: { Isp: 450, lam: .90, TW: 1.5, kick: 0 } },
      { name: '너무 일찍 눕힘 (추락)', set: { Isp: 450, lam: .90, TW: 1.5, kick: 106 } },
      { name: '현실적인 1단 (Δv 부족)', set: { Isp: 300, lam: .85, TW: 1.5, kick: 90 } },
      { name: '고추력 (손실 감소)', set: { Isp: 450, lam: .90, TW: 2, kick: 96 } },
      { name: '탈출 궤도 (Δv 과잉)', set: { Isp: 450, lam: .95, TW: 1.5, kick: 90 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const top = 30, bot = h * .92;
      const ob = orbit(st);
      const alt = ob.r - RE;

      /* ── 카메라: 고도에 따라 줌아웃, 멀어지면 지구 중심으로 ── */
      let span = clamp(Math.max(alt, st.apogee) * 3.4 + 3000, 3000, 8e7);
      if (st.verdict === 'orbit') span = Math.max(span, (ob.ra + RE) * 2.5);
      const k = (bot - top) / span;
      const blend = clamp((span - RE * .7) / (RE * 2.2), 0, 1);
      const camX = st.x * (1 - blend), camY = st.y * (1 - blend);
      const scx = w * .42, scy = top + (bot - top) * (blend ? .5 : .68);
      const X = wx => scx + (wx - camX) * k;
      const Y = wy => scy - (wy - camY) * k;

      /* ── 배경 ── */
      const dark = clamp(alt / 90000, 0, 1);
      ctx.save();
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, 'rgba(4,7,16,1)');
      sky.addColorStop(1, 'rgba(' + Math.round(10 + 30 * (1 - dark)) + ',' +
        Math.round(24 + 70 * (1 - dark)) + ',' + Math.round(48 + 82 * (1 - dark)) + ',1)');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      ctx.restore();
      for (let i = 0; i < 90; i++) {
        ctx.save(); ctx.globalAlpha = dark * (.14 + (i % 6) * .11); ctx.fillStyle = '#fff';
        ctx.fillRect((i * 163.7) % w, (i * 91.3) % (h * .92), 1.5, 1.5); ctx.restore();
      }

      /* ── 지구 ── */
      const ecx = X(0), ecy = Y(0), Rpx = RE * k;
      const rsx = X(st.x), rsy = Y(st.y);
      const angC = Math.atan2(rsy - ecy, rsx - ecx);          // 지구 중심에서 로켓을 보는 방향
      const dAng = clamp(w * .9 / Math.max(1, Rpx), .002, Math.PI);
      const lowAlt = clamp(1 - alt / 250000, 0, 1);            // 1이면 지면 근처

      ctx.save();
      ctx.beginPath(); ctx.arc(ecx, ecy, Rpx, 0, 7);
      const nearY = ecy - Rpx;
      const gg = ctx.createLinearGradient(0, nearY, 0, nearY + Math.min(420, Rpx));
      const mix = (a, b) => Math.round(a + (b - a) * lowAlt);
      gg.addColorStop(0, 'rgb(' + mix(74, 68) + ',' + mix(157, 86) + ',' + mix(224, 72) + ')');
      gg.addColorStop(1, 'rgb(' + mix(12, 20) + ',' + mix(42, 29) + ',' + mix(74, 34) + ')');
      ctx.fillStyle = gg; ctx.fill();
      ctx.restore();

      // 대기층 — 지표 위 얇은 띠
      ctx.save();
      ctx.strokeStyle = 'rgba(120,200,255,.16)';
      ctx.lineWidth = clamp(100000 * k, 1.2, 44);
      ctx.beginPath();
      ctx.arc(ecx, ecy, Rpx + ctx.lineWidth * .5, angC - dAng * 1.4, angC + dAng * 1.4);
      ctx.stroke();
      ctx.restore();

      /* ── 고도 눈금 (지구와 동심원) ── */
      if (span < 1.6e6) {
        const raw = span / 6, mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const stepA = [1, 2, 5, 10].map(m => m * mag).find(v => v >= raw) || 10 * mag;
        // 화면 왼쪽(x=LBL)에서 그 동심원의 높이를 구해 라벨을 붙인다
        const LBL = 38;
        const yAtLeft = rr => {
          const dx2 = LBL - ecx;
          return rr * rr > dx2 * dx2 ? ecy - Math.sqrt(rr * rr - dx2 * dx2) : NaN;
        };
        ctx.save();
        for (let a = stepA; a < span * 1.3; a += stepA) {
          const rr = (RE + a) * k;
          ctx.strokeStyle = 'rgba(147,162,196,.16)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(ecx, ecy, rr, angC - dAng, angC + dAng); ctx.stroke();
          const ly2 = yAtLeft(rr);
          if (isFinite(ly2) && ly2 > top + 6 && ly2 < bot)
            D.text(ctx, a >= 1000 ? fmt(a / 1000, a >= 10000 ? 0 : 1) + ' km' : fmt(a, 0) + ' m',
              LBL + 4, ly2 - 4, { size: 9.5, color: 'rgba(147,162,196,.55)' });
        }
        ctx.restore();
        // 카르만 선
        const kr = (RE + 100000) * k;
        ctx.save();
        ctx.strokeStyle = 'rgba(94,234,212,.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.arc(ecx, ecy, kr, angC - dAng, angC + dAng); ctx.stroke();
        ctx.restore();
        const ky2 = yAtLeft(kr);
        if (isFinite(ky2) && ky2 > top + 6 && ky2 < bot)
          D.text(ctx, '카르만 선 100 km — 우주의 경계', LBL + 4, ky2 - 6, { size: 10.5, color: '#5eead4' });
      }

      /* ── 비행 자취 ── */
      ctx.save();
      ctx.strokeStyle = 'rgba(94,234,212,.7)'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      st.trail.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])));
      ctx.stroke(); ctx.restore();

      /* ── 배기 연기 ── */
      st.smoke.forEach(s => {
        const al = clamp(.30 - s.age * .06, 0, .30);
        if (al < .015) return;
        const rp = s.rm * k;
        if (rp < .7) return;
        const sx = X(s.x), sy = Y(s.y);
        if (sx < -80 || sx > w + 80 || sy < -80 || sy > h + 80) return;
        ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(sx, sy, rp, 0, 7); ctx.fill(); ctx.restore();
      });

      /* ── 로켓 ── */
      const r = ob.r, ur = [st.x / r, st.y / r], v = ob.v;
      const uv = v > 1 ? [st.vx / v, st.vy / v] : ur;
      const nose = st.burning ? (st.phase === 0 ? ur : uv) : uv;
      const sdx = nose[0], sdy = -nose[1];
      const ang = Math.atan2(sdy, sdx) + Math.PI / 2;
      const rpx = X(st.x) + (st.shake ? (Math.random() - .5) * st.shake : 0);
      const rpy = Y(st.y);
      const RS = clamp(90 * Math.pow(3000 / span, .16), 20, 90);   // 로켓은 화면상 일정 크기로
      const RW = RS * .24, RH = RS;

      ctx.save();
      ctx.translate(rpx, rpy); ctx.rotate(ang);
      // 화염
      if (st.burning) {
        const expand = 1 + 2.0 * (1 - Math.exp(-alt / 26000));
        const fl = (RS * .28 + p.Isp * .13 * (RS / 90)) * p.TW * .72 * (.85 + .3 * Math.random());
        const fg = ctx.createLinearGradient(0, RH / 2, 0, RH / 2 + fl);
        fg.addColorStop(0, 'rgba(255,255,235,.95)');
        fg.addColorStop(.3, 'rgba(255,190,70,.85)');
        fg.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = fg;
        if (hl === 'Isp') { ctx.shadowColor = C.Isp; ctx.shadowBlur = 22; }
        ctx.beginPath();
        ctx.moveTo(-RW * .8, RH / 2);
        ctx.quadraticCurveTo(-RW * .8 * expand * 2.2, RH / 2 + fl * .72, 0, RH / 2 + fl * 1.1);
        ctx.quadraticCurveTo(RW * .8 * expand * 2.2, RH / 2 + fl * .72, RW * .8, RH / 2);
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur = 0;
      }
      // 동체
      ctx.beginPath();
      ctx.moveTo(0, -RH / 2 - RS * .24);
      ctx.lineTo(RW, -RH / 2 + RS * .09);
      ctx.lineTo(RW, RH / 2); ctx.lineTo(-RW, RH / 2);
      ctx.lineTo(-RW, -RH / 2 + RS * .09);
      ctx.closePath();
      const bg = ctx.createLinearGradient(-RW, 0, RW, 0);
      bg.addColorStop(0, '#96a5c4'); bg.addColorStop(.4, '#f1f5fb'); bg.addColorStop(1, '#8794b5');
      ctx.fillStyle = bg; ctx.fill();
      // 추진제
      const frac = (st.m - mfOf(p)) / (M0 - mfOf(p));
      ctx.fillStyle = C.lam; ctx.globalAlpha = .9;
      ctx.fillRect(-RW + RS * .03, RH / 2 - RS * .06 - (RH - RS * .22) * frac, RW * 2 - RS * .06, (RH - RS * .22) * frac);
      ctx.globalAlpha = 1;
      // 핀
      ctx.fillStyle = '#8794b5';
      ctx.beginPath(); ctx.moveTo(-RW, RH / 2 - RS * .2); ctx.lineTo(-RW - RS * .13, RH / 2 + RS * .05); ctx.lineTo(-RW, RH / 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(RW, RH / 2 - RS * .2); ctx.lineTo(RW + RS * .13, RH / 2 + RS * .05); ctx.lineTo(RW, RH / 2); ctx.fill();
      ctx.restore();

      // 속도 벡터 (수평 성분이 궤도의 핵심)
      if (v > 50 && blend < .9) {
        D.arrow(ctx, rpx, rpy, uv[0] * 54, -uv[1] * 54,
          { color: C.v, width: 2.5, head: 9, hot: hl === 'v', label: fmt(v, 0) + ' m/s', ly: -14 });
      }

      /* ── HUD ── */
      const vr = st.vx * ur[0] + st.vy * ur[1];
      const vh = Math.sqrt(Math.max(0, v * v - vr * vr));
      const gamma = v > 1 ? Math.asin(clamp(vr / v, -1, 1)) * 180 / Math.PI : 90;
      const gForce = st.burning ? thrust(p) / (st.m * G0) : 0;
      const ph = ['수직 상승', '중력 선회 중', '중력 선회', '관성 비행'][st.burning ? st.phase : 3];
      D.text(ctx, 'T + ' + mmss(st.mt), 28, top + 8, { size: 15, color: '#e8eefc', bold: true, mono: true });
      D.text(ctx, ph + '  ·  ' + fmt(gForce, 1) + ' G  ·  γ ' + fmt(gamma, 0) + '°',
        28, top + 26, { size: 11, color: st.burning ? C.TW : '#61719a' });
      D.text(ctx, fmt(alt / 1000, 1) + ' km', 28, top + 50, { size: 20, color: C.TW, bold: true });
      D.text(ctx, '수평 ' + fmt(vh, 0) + ' / 필요 ' + fmt(Math.sqrt(MU / r), 0) + ' m/s',
        28, top + 70, { size: 12, color: hl === 'v' ? '#fff' : C.kick });
      D.text(ctx, '시간 배속 ×' + (st.burning ? TS_BURN : TS_COAST), 28, top + 88, { size: 10, color: '#4a5878' });

      // 이벤트 로그
      st.events.slice(-4).forEach((e, i, arr) => {
        D.text(ctx, 'T+' + mmss(e.mt) + '  ' + e.label, 28, bot - 6 - (arr.length - 1 - i) * 16,
          { size: 10.5, color: i === arr.length - 1 ? '#e8eefc' : '#61719a' });
      });

      /* ── 질량 · Δv 게이지 ── */
      const mx = w - 214, my = top + 116, mw = 30, mh = h * .30;
      D.text(ctx, '질량', mx + mw / 2, my - 10, { size: 10.5, color: '#61719a', align: 'center' });
      D.roundRect(ctx, mx, my, mw, mh, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const dryH = mh * (mfOf(p) / M0);
      ctx.save();
      ctx.fillStyle = '#8794b5'; ctx.fillRect(mx, my + mh - dryH, mw, dryH);
      if (hl === 'lam') { ctx.shadowColor = C.lam; ctx.shadowBlur = 14; }
      ctx.fillStyle = C.lam;
      const propH = (mh - dryH) * frac;
      ctx.fillRect(mx, my + mh - dryH - propH, mw, propH);
      ctx.restore();
      D.text(ctx, fmt(st.m / 1000, 1) + ' t', mx + mw / 2, my + mh + 15, { size: 11, color: '#e8eefc', align: 'center', bold: true });

      const gx = w - 168, gyy = top + 116, gw = 146;
      const MAXDV = 14000, dv = dvIdeal(p);
      D.text(ctx, 'Δv 예산', gx, gyy - 10, { size: 11, color: hl === 'dv' ? '#fff' : '#93a2c4', bold: hl === 'dv' });
      D.bar(ctx, gx, gyy, gw, 14, dv, MAXDV, C.dv, null, hl === 'dv' || hl === 'Isp' || hl === 'lam');
      D.text(ctx, '이상적 ' + fmt(dv, 0), gx, gyy + 28, { size: 10.5, color: C.dv });
      D.bar(ctx, gx, gyy + 34, gw, 10, st.gLoss, MAXDV, C.loss, null, hl === 'loss');
      D.text(ctx, '중력 손실 −' + fmt(st.gLoss, 0), gx, gyy + 58, { size: 10.5, color: C.loss, bold: hl === 'loss' });
      D.bar(ctx, gx, gyy + 66, gw, 12, v, MAXDV, '#e8eefc', null, false);
      D.text(ctx, '현재 속도 ' + fmt(v, 0), gx, gyy + 92, { size: 11, color: '#e8eefc', bold: true });
      const lx = gx + gw * (7800 / MAXDV);
      D.line(ctx, lx, gyy - 5, lx, gyy + 80, { color: '#34d399', dash: [4, 4], width: 2 });
      D.text(ctx, '궤도 속도', lx + 4, gyy - 9, { size: 9.5, color: '#34d399' });

      if (st.verdict === 'orbit') D.tag(ctx, '✔ 궤도 진입 성공 — 근지점 ' + fmt((ob.rp - RE) / 1000, 0) + ' / 원지점 ' + fmt((ob.ra - RE) / 1000, 0) + ' km', w / 2, top + 10, '#34d399', true);
      else if (st.verdict === 'escape') D.tag(ctx, '지구 탈출 궤도 — 돌아오지 않습니다', w / 2, top + 10, '#a78bfa', true);
      else if (st.verdict === 'suborbital') D.tag(ctx, '준궤도 — 근지점이 지면 아래입니다. 다시 떨어집니다', w / 2, top + 10, '#fb7185', true);
      if (st.done) D.tag(ctx, '↺ 처음으로', w / 2, top + 34, '#fbbf24', true);
    }
  });
})();
