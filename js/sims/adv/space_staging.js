/* [항공우주공학] 다단 로켓과 단 분리 — Δv = Σ Isp·g₀·ln(m_start/m_end) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { n: '#5eead4', Isp1: '#fbbf24', Isp2: '#a78bfa', lam: '#f472b6', pay: '#34d399', pitch: '#60a5fa', dv: '#5eead4' };
  const G0 = 9.80665, MU = 3.986e14, RE = 6.371e6;
  const M_TOT = 300000;          // 이륙 총질량 300 t 고정
  const RATIO = .25;             // 상단은 바로 아래 단의 25 %
  const H_KICK = 1500, TS_BURN = 20, TS_COAST = 320;
  const mmss = s => Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2);

  /* 단 구성: 아래에서 위로 stages[0] = 1단 */
  function build(p) {
    const n = Math.round(p.stages), pay = p.payload * 1000;
    const rest = Math.max(1000, M_TOT - pay);
    const share = []; let s = 1;
    for (let i = 0; i < n; i++) { share.push(s); s *= RATIO; }
    const sum = share.reduce((a, b) => a + b, 0);
    const st = share.map((sh, i) => {
      const m = rest * sh / sum;
      return { m, prop: m * p.lam, dry: m * (1 - p.lam), Isp: i === 0 ? p.Isp1 : p.Isp2 };
    });
    let above = pay;                                  // 위쪽에 실린 질량
    for (let i = n - 1; i >= 0; i--) { st[i].mStart = above + st[i].m; above = st[i].mStart; }
    st.forEach((q, i) => {
      q.thrust = (i === 0 ? 1.4 : .85) * q.mStart * G0;
      q.mdot = q.thrust / (q.Isp * G0);
      q.tb = q.prop / q.mdot;
      q.dv = q.Isp * G0 * Math.log(q.mStart / (q.mStart - q.prop));
    });
    return st;
  }
  const totalDv = p => build(p).reduce((a, q) => a + q.dv, 0);
  const totalBurn = p => build(p).reduce((a, q) => a + q.tb, 0);
  // 같은 질량·같은 연료를 1단으로 만들었다면
  function singleDv(p) {
    const pay = p.payload * 1000, rest = M_TOT - pay;
    return p.Isp1 * G0 * Math.log(M_TOT / (pay + rest * (1 - p.lam)));
  }
  function orbit(st) {
    const r = Math.hypot(st.x, st.y), v = Math.hypot(st.vx, st.vy);
    const invA = 2 / r - v * v / MU;
    const a = invA > 1e-14 ? 1 / invA : Infinity;
    const hA = st.x * st.vy - st.y * st.vx;
    const e = isFinite(a) ? Math.sqrt(Math.max(0, 1 - hA * hA / (MU * a))) : 1;
    return { r, v, a, e, rp: isFinite(a) ? a * (1 - e) : NaN, ra: isFinite(a) ? a * (1 + e) : Infinity };
  }

  PS.register({
    id: 'space-staging', mode: 'adv', category: '항공우주공학',
    title: '다단 로켓과 단 분리',
    sub: 'Δv = Σ Isp·g₀·ln(m₀/m_f)',
    tagline: '똑같은 질량, 똑같은 연료인데 단을 나누기만 하면 Δv가 훌쩍 뜁니다. 다 쓴 껍데기를 계속 지고 갈 이유가 없기 때문입니다.',

    params: [
      { key: 'stages', symbol: 'N', label: '단 수', unit: '단', min: 1, max: 3, step: 1, value: 2, color: C.n, reset: true, dec: 0,
        where: '로켓을 <b>몇 토막으로 나눌 것인가</b>입니다. 화면의 로켓이 그만큼 나뉘어 그려지고, 연료를 다 쓴 단은 <b>떨어져 나갑니다</b>. 1단으로 두면 앞의 시뮬레이션과 같은 로켓이 됩니다.' },
      { key: 'Isp1', symbol: 'Isp₁', label: '1단 비추력', unit: 's', min: 240, max: 340, step: 10, value: 300, color: C.Isp1, reset: true, dec: 0,
        where: '<b>1단 엔진의 연비</b>입니다. 1단은 큰 추력이 필요해 보통 케로신·고체(260~330초)를 씁니다. 밀도가 높아 탱크가 작아지는 장점도 있습니다.' },
      { key: 'Isp2', symbol: 'Isp₂', label: '상단 비추력', unit: 's', min: 300, max: 465, step: 5, value: 450, color: C.Isp2, reset: true, dec: 0,
        where: '<b>2단 이상 엔진의 연비</b>입니다. 상단은 공기가 없는 곳에서 일하므로 효율이 가장 좋은 <b>액체수소(450초)</b>를 씁니다. 이 값이 총 Δv에 가장 크게 기여합니다.' },
      { key: 'lam', symbol: 'λ', label: '구조 효율 (추진제 비율)', unit: '', min: .80, max: .94, step: .01, value: .90, color: C.lam, reset: true, dec: 2,
        where: '각 단에서 <b>연료가 차지하는 비율</b>입니다. 나머지가 탱크·엔진 같은 <b>껍데기</b>이며, 이 껍데기를 버리는 것이 단 분리의 목적입니다. 0.90이면 껍데기가 10 %.' },
      { key: 'payload', symbol: 'm_p', label: '탑재체 질량', unit: 't', min: 2, max: 30, step: 1, value: 10, color: C.pay, reset: true, dec: 0,
        where: '<b>실제로 궤도에 올리려는 화물</b>(위성·우주선)입니다. 로켓 맨 위 초록색 부분입니다. 무거울수록 Δv가 줄어 — 발사체 성능표의 "궤도 투입 능력"이 바로 이 값입니다.' },
      { key: 'pitch', symbol: 'θ', label: '최종 기울기', unit: '°', min: 0, max: 110, step: 1, value: 90, color: C.pitch, reset: true, dec: 0,
        where: '연소 내내 로켓을 연직에서 옆으로 눕히는 <b>최종 각도</b>입니다. 앞 시뮬레이션과 같은 피치 프로그램이며, 궤도 진입의 열쇠입니다.' }
    ],
    vars: {
      dv: { symbol: 'Δv', label: '총 속도 증가량', unit: 'm/s', color: C.dv,
        where: '각 단의 Δv를 <b>모두 더한 값</b>입니다. 화면 오른쪽 단별 막대의 합이며, 약 9,400 m/s를 넘겨야 궤도에 오릅니다.' },
      ms: { symbol: 'm_start', label: '단 점화 시 질량', unit: 'kg', color: C.n,
        where: '그 단에 불을 붙이는 순간의 <b>전체 질량</b>(그 단 + 위에 실린 모든 것)입니다. 아래 단들의 껍데기는 이미 버려져 포함되지 않습니다 — 이것이 다단의 이득입니다.' },
      mf: { symbol: 'm_end', label: '단 연소 종료 질량', unit: 'kg', color: C.n,
        where: '그 단의 연료를 다 태운 순간의 질량입니다. 여기서 <b>빈 껍데기를 떼어내고</b> 다음 단에 점화합니다.' }
    },
    formulas: [
      { name: '다단 로켓의 Δv', tpl: '{dv} = Σᵢ Ispᵢ · g₀ · ln( {ms}ᵢ ⁄ {mf}ᵢ )' },
      { name: '단 분리의 이득', tpl: '분리 후 {ms} = (남은 단 + 탑재체)  ← 빈 껍데기 제외' },
      { name: '각 단의 구성', tpl: '연료 = {lam}·m ,  껍데기 = (1−{lam})·m' },
      { name: '궤도 진입 조건', tpl: '{dv} − 중력 손실 > 7,800 m/s' }
    ],

    init(p) {
      const S = build(p);
      return {
        x: 0, y: RE, vx: 0, vy: 0,
        stages: S, idx: 0, m: S[0].mStart, propLeft: S[0].prop,
        burning: true, phase: 0, tKick: 0, gLoss: 0, mt: 0,
        trail: [], smoke: [], smokeT: 0, debris: [],
        events: [{ mt: 0, label: '이륙 — 1단 점화' }],
        apogee: 0, done: false, verdict: '', karman: false
      };
    },

    step(st, p, dt) {
      if (st.done) return;
      const ts = st.burning ? TS_BURN : TS_COAST;
      const dtp = dt * ts;
      st.mt += dtp;

      const r = Math.hypot(st.x, st.y), h = r - RE;
      const ur = [st.x / r, st.y / r];
      const v = Math.hypot(st.vx, st.vy);

      // 피치 프로그램
      let dir = ur;
      if (st.burning) {
        if (st.phase === 0 && h > H_KICK) { st.phase = 1; st.tKick = st.mt; st.events.push({ mt: st.mt, label: '피치 프로그램 시작' }); }
        if (st.phase >= 1) {
          const prog = clamp((st.mt - st.tKick) / Math.max(1, totalBurn(p) * .9 - st.tKick), 0, 1);
          const a = p.pitch * Math.PI / 180 * Math.pow(prog, .42);
          dir = [ur[0] * Math.cos(a) + ur[1] * Math.sin(a), -ur[0] * Math.sin(a) + ur[1] * Math.cos(a)];
        }
      }

      const g = MU / (r * r);
      let ax = -g * ur[0], ay = -g * ur[1];
      if (st.burning) {
        const S = st.stages[st.idx];
        ax += (S.thrust / st.m) * dir[0]; ay += (S.thrust / st.m) * dir[1];
        const dm = S.mdot * dtp;
        st.propLeft -= dm; st.m -= dm;
        if (st.propLeft <= 0) {
          // ── 단 분리 ──
          if (st.idx < st.stages.length - 1) {
            st.debris.push({ x: st.x, y: st.y, vx: st.vx, vy: st.vy, ang: 0, spin: (Math.random() - .5) * 3, age: 0, size: .8 + .5 * (st.stages.length - st.idx) });
            if (st.debris.length > 3) st.debris.shift();
            st.m -= S.dry;
            st.idx++;
            st.propLeft = st.stages[st.idx].prop;
            st.events.push({ mt: st.mt, label: (st.idx) + '단 분리 → ' + (st.idx + 1) + '단 점화' });
          } else {
            st.burning = false;
            st.events.push({ mt: st.mt, label: '최종단 연소 종료 (MECO)' });
          }
        }
      }
      const sinG = v > 1 ? (st.vx * ur[0] + st.vy * ur[1]) / v : 1;
      if (st.burning) st.gLoss += g * Math.max(0, sinG) * dtp;

      st.vx += ax * dtp; st.vy += ay * dtp;
      st.x += st.vx * dtp; st.y += st.vy * dtp;

      // 분리된 단은 중력만 받고 떨어진다
      st.debris.forEach(d => {
        const dr = Math.hypot(d.x, d.y), dg = MU / (dr * dr);
        d.vx += -dg * d.x / dr * dtp; d.vy += -dg * d.y / dr * dtp;
        d.x += d.vx * dtp; d.y += d.vy * dtp;
        d.ang += d.spin * dt; d.age += dt;
      });

      const r2 = Math.hypot(st.x, st.y), h2 = r2 - RE;
      st.apogee = Math.max(st.apogee, h2);
      if (h2 > 100000 && !st.karman) { st.karman = true; st.events.push({ mt: st.mt, label: '카르만 선 통과 — 우주' }); }

      st.trailT = (st.trailT || 0) + dt;
      if (st.trailT > .02) { st.trailT = 0; st.trail.push([st.x, st.y]); if (st.trail.length > 1800) st.trail.shift(); }

      st.smokeT += dt;
      if (st.burning && st.smokeT > .04) {
        st.smokeT = 0;
        st.smoke.push({ x: st.x, y: st.y, rm: 24 + Math.random() * 16, age: 0 });
        if (st.smoke.length > 80) st.smoke.shift();
      }
      st.smoke.forEach(s => { s.age += dt; s.rm = Math.min(s.rm + dtp * 22, 700); });
      if (st.smoke.length && st.smoke[0].age > 5) st.smoke = st.smoke.filter(s => s.age <= 5);

      const ob = orbit(st);
      if (!st.burning && !st.verdict) {
        if (!isFinite(ob.a)) { st.verdict = 'escape'; st.events.push({ mt: st.mt, label: '지구 탈출 궤도' }); }
        else if (ob.rp - RE > 0) { st.verdict = 'orbit'; st.events.push({ mt: st.mt, label: '궤도 진입 성공 — 근지점 ' + fmt((ob.rp - RE) / 1000, 0) + ' km' }); }
        else st.verdict = 'suborbital';
      }
      if (h2 <= 0 && st.mt > 5) {
        st.done = true;
        if (!st.verdict) st.verdict = 'crash';
        st.events.push({ mt: st.mt, label: st.verdict === 'orbit' ? '재진입' : '추락 — 궤도 진입 실패' });
      }
      if ((st.verdict === 'orbit' || st.verdict === 'escape') && st.mt > st.events[st.events.length - 1].mt + 6000) st.done = true;
    },

    graphs: [
      { title: '질량 – 시간 (단 분리에서 뚝 떨어짐)', xmin: 10, window: 40, y0: 0,
        series: [{ key: 'm', label: '질량 (t)', color: C.lam }] },
      { title: '속도 – 시간', xmin: 10, window: 40, y0: 0,
        series: [{ key: 'v', label: '속도 (m/s)', color: C.pitch }] }
    ],
    sample(st) { return { m: st.m / 1000, v: Math.hypot(st.vx, st.vy) }; },

    readouts(st, p) {
      const S = st.stages, ob = orbit(st);
      const dv = totalDv(p), one = singleDv(p);
      const rows = [
        { label: '총 Δv (모든 단 합계)', value: dv, unit: 'm/s', color: C.dv, dec: 0 },
        { label: '중력 손실 (누적)', value: st.gLoss, unit: 'm/s', color: '#fb7185', dec: 0 },
        { label: '고도', value: (ob.r - RE) / 1000, unit: 'km', color: C.n },
        { label: '속도', value: ob.v, unit: 'm/s', color: C.pitch, dec: 0 },
        { label: '현재 질량', value: st.m / 1000, unit: 't', color: C.lam },
        { label: '연소 중인 단', value: st.burning ? (st.idx + 1) + '단' : '연소 종료' }
      ];
      S.forEach((q, i) => rows.push({
        label: (i + 1) + '단 Δv (' + fmt(q.m / 1000, 0) + ' t · Isp ' + q.Isp + ')',
        value: q.dv, unit: 'm/s', dec: 0, color: i === 0 ? C.Isp1 : C.Isp2
      }));
      rows.push({
        label: '같은 질량·연료를 1단으로 만들면', wide: true, color: '#fb7185',
        value: fmt(one, 0) + ' m/s   (다단이 ' + fmt(dv - one, 0) + ' m/s 이득)'
      });
      rows.push({
        label: '궤도 판정', wide: true,
        color: st.verdict === 'orbit' ? '#34d399' : (st.verdict === 'escape' ? '#a78bfa' : (st.verdict ? '#fb7185' : '#fbbf24')),
        value: st.verdict === 'orbit' ? '✔ 궤도 진입 성공 (근지점 ' + fmt((ob.rp - RE) / 1000, 0) + ' km)'
          : st.verdict === 'escape' ? '지구 탈출 궤도 — Δv 과잉'
            : st.verdict === 'crash' ? '✘ 추락'
              : st.verdict ? '✘ 준궤도 — 다시 떨어집니다'
                : (st.burning ? (st.idx + 1) + '단 연소 중' : '관성 비행')
      });
      return rows;
    },

    notes: [
      '<b>왜 단을 나누는가:</b> 연료를 다 쓴 탱크와 엔진은 그때부터 <b>짐덩어리</b>입니다. 버리고 가면 남은 연료가 더 가벼운 로켓을 밀게 되어 같은 연료로 더 큰 Δv를 얻습니다.',
      '단 수를 1 → 2 → 3으로 바꿔 보세요. <b>총질량 300 t, 구조 효율, 연료량이 모두 같은데</b> Δv가 크게 늘어납니다.',
      '단을 무한히 늘려도 좋아지지는 않습니다. 단마다 엔진·구조가 추가로 필요해 실제로는 <b>2~3단</b>이 최적입니다.',
      '상단에 효율 좋은 <b>수소 엔진(Isp 450)</b>을 쓰는 이유: 상단의 Δv는 이미 가벼워진 로켓에 적용되어 전체 성능에 가장 크게 기여합니다.',
      '탑재체를 무겁게 하면 Δv가 줄어듭니다. 발사체 카탈로그의 "LEO 투입 능력 ○○ t"이 바로 이 한계입니다.',
      '구조 효율 λ은 재료·설계의 한계입니다. 0.94를 넘기기가 매우 어렵고, 그래서 <b>단일단 궤도 진입(SSTO)</b>이 현실적으로 불가능합니다.'
    ],
    presets: [
      { name: '2단 (표준)', set: { stages: 2, Isp1: 300, Isp2: 450, lam: .90, payload: 10, pitch: 90 } },
      { name: '1단으로 시도 (실패)', set: { stages: 1, Isp1: 300, Isp2: 450, lam: .90, payload: 10, pitch: 90 } },
      { name: '3단', set: { stages: 3, Isp1: 300, Isp2: 450, lam: .90, payload: 10, pitch: 90 } },
      { name: '무거운 탑재체 (30 t)', set: { stages: 2, payload: 30 } },
      { name: '상단도 케로신 (Isp 320)', set: { stages: 2, Isp2: 320 } },
      { name: '구조가 무거우면 (λ 0.82)', set: { stages: 2, lam: .82 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const top = 30, bot = h * .92;
      const ob = orbit(st), alt = ob.r - RE;
      const S = st.stages;

      /* 카메라 */
      let span = clamp(Math.max(alt, st.apogee) * 3.4 + 3000, 3000, 8e7);
      if (st.verdict === 'orbit') span = Math.max(span, (ob.ra + RE) * 2.5);
      const k = (bot - top) / span;
      const blend = clamp((span - RE * .7) / (RE * 2.2), 0, 1);
      const camX = st.x * (1 - blend), camY = st.y * (1 - blend);
      const scx = w * .40, scy = top + (bot - top) * (blend ? .5 : .68);
      const X = wx => scx + (wx - camX) * k, Y = wy => scy - (wy - camY) * k;

      /* 하늘 */
      const dark = clamp(alt / 90000, 0, 1);
      ctx.save();
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, 'rgba(4,7,16,1)');
      sky.addColorStop(1, 'rgba(' + Math.round(10 + 30 * (1 - dark)) + ',' + Math.round(24 + 70 * (1 - dark)) + ',' + Math.round(48 + 82 * (1 - dark)) + ',1)');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h); ctx.restore();
      for (let i = 0; i < 80; i++) {
        ctx.save(); ctx.globalAlpha = dark * (.14 + (i % 6) * .11); ctx.fillStyle = '#fff';
        ctx.fillRect((i * 157.3) % w, (i * 89.7) % (h * .92), 1.5, 1.5); ctx.restore();
      }

      /* 지구 */
      const ecx = X(0), ecy = Y(0), Rpx = RE * k;
      const rsx = X(st.x), rsy = Y(st.y);
      const angC = Math.atan2(rsy - ecy, rsx - ecx);
      const dAng = clamp(w * .9 / Math.max(1, Rpx), .002, Math.PI);
      const lowAlt = clamp(1 - alt / 250000, 0, 1);
      ctx.save();
      ctx.beginPath(); ctx.arc(ecx, ecy, Rpx, 0, 7);
      const gg = ctx.createLinearGradient(0, ecy - Rpx, 0, ecy - Rpx + Math.min(420, Rpx));
      const mix = (a, b) => Math.round(a + (b - a) * lowAlt);
      gg.addColorStop(0, 'rgb(' + mix(74, 68) + ',' + mix(157, 86) + ',' + mix(224, 72) + ')');
      gg.addColorStop(1, 'rgb(' + mix(12, 20) + ',' + mix(42, 29) + ',' + mix(74, 34) + ')');
      ctx.fillStyle = gg; ctx.fill(); ctx.restore();
      ctx.save();
      ctx.strokeStyle = 'rgba(120,200,255,.16)'; ctx.lineWidth = clamp(100000 * k, 1.2, 44);
      ctx.beginPath(); ctx.arc(ecx, ecy, Rpx + ctx.lineWidth * .5, angC - dAng * 1.4, angC + dAng * 1.4); ctx.stroke();
      ctx.restore();

      if (span < 1.6e6) {
        const raw = span / 6, mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const stepA = [1, 2, 5, 10].map(m => m * mag).find(v => v >= raw) || 10 * mag;
        const LBL = 38;
        const yAtLeft = rr => { const dx = LBL - ecx; return rr * rr > dx * dx ? ecy - Math.sqrt(rr * rr - dx * dx) : NaN; };
        ctx.save();
        for (let a = stepA; a < span * 1.3; a += stepA) {
          const rr = (RE + a) * k;
          ctx.strokeStyle = 'rgba(147,162,196,.16)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(ecx, ecy, rr, angC - dAng, angC + dAng); ctx.stroke();
          const ly = yAtLeft(rr);
          if (isFinite(ly) && ly > top + 6 && ly < bot)
            D.text(ctx, a >= 1000 ? fmt(a / 1000, a >= 10000 ? 0 : 1) + ' km' : fmt(a, 0) + ' m', LBL + 4, ly - 4,
              { size: 9.5, color: 'rgba(147,162,196,.55)' });
        }
        ctx.restore();
        const kr = (RE + 100000) * k;
        ctx.save(); ctx.strokeStyle = 'rgba(94,234,212,.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([7, 6]);
        ctx.beginPath(); ctx.arc(ecx, ecy, kr, angC - dAng, angC + dAng); ctx.stroke(); ctx.restore();
        const ky = yAtLeft(kr);
        if (isFinite(ky) && ky > top + 6 && ky < bot)
          D.text(ctx, '카르만 선 100 km', LBL + 4, ky - 6, { size: 10.5, color: '#5eead4' });
      }

      /* 자취 */
      ctx.save();
      ctx.strokeStyle = 'rgba(94,234,212,.7)'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      st.trail.forEach((q, i) => i ? ctx.lineTo(X(q[0]), Y(q[1])) : ctx.moveTo(X(q[0]), Y(q[1])));
      ctx.stroke(); ctx.restore();

      /* 연기 */
      st.smoke.forEach(s => {
        const al = clamp(.30 - s.age * .06, 0, .30);
        if (al < .015) return;
        const rp = s.rm * k; if (rp < .7) return;
        const sx = X(s.x), sy = Y(s.y);
        if (sx < -80 || sx > w + 80 || sy < -80 || sy > h + 80) return;
        ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(sx, sy, rp, 0, 7); ctx.fill(); ctx.restore();
      });

      /* 분리된 단 (텀블링하며 떨어짐) */
      st.debris.forEach(d => {
        const dx = X(d.x), dy = Y(d.y);
        if (dx < -60 || dx > w + 60 || dy < -60 || dy > h + 60) return;
        ctx.save();
        ctx.globalAlpha = clamp(1 - d.age / 14, .15, 1);
        ctx.translate(dx, dy); ctx.rotate(d.ang);
        ctx.fillStyle = '#7c8aa8';
        D.roundRect(ctx, -6 * d.size, -16 * d.size, 12 * d.size, 32 * d.size, 3); ctx.fill();
        ctx.restore();
      });

      /* 로켓 (남은 단을 쌓아서 그린다) */
      const ur = [st.x / ob.r, st.y / ob.r];
      const v = ob.v, uv = v > 1 ? [st.vx / v, st.vy / v] : ur;
      const nose = st.burning && st.phase === 0 ? ur : uv;
      const ang = Math.atan2(-nose[1], nose[0]) + Math.PI / 2;
      const RS = clamp(110 * Math.pow(3000 / span, .16), 24, 110) * clamp(Math.pow(st.m / M_TOT, .3), .42, 1);
      const RW = RS * .17;
      const shake = st.burning ? (Math.random() - .5) * 2.4 : 0;

      ctx.save();
      ctx.translate(rsx + shake, rsy); ctx.rotate(ang);
      // 화염
      if (st.burning) {
        const expand = 1 + 2.0 * (1 - Math.exp(-alt / 26000));
        const cur = S[st.idx];
        const fl = (RS * .3 + cur.Isp * .1 * (RS / 110)) * (.85 + .3 * Math.random());
        const fg = ctx.createLinearGradient(0, RS / 2, 0, RS / 2 + fl);
        fg.addColorStop(0, 'rgba(255,255,235,.95)');
        fg.addColorStop(.3, st.idx === 0 ? 'rgba(255,190,70,.85)' : 'rgba(160,200,255,.8)');
        fg.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(-RW * .8, RS / 2);
        ctx.quadraticCurveTo(-RW * .8 * expand * 2.2, RS / 2 + fl * .72, 0, RS / 2 + fl * 1.1);
        ctx.quadraticCurveTo(RW * .8 * expand * 2.2, RS / 2 + fl * .72, RW * .8, RS / 2);
        ctx.closePath(); ctx.fill();
      }
      // 남은 단들: 아래(현재 단)부터 위로 쌓는다
      const live = S.slice(st.idx);
      const massSum = live.reduce((a, q) => a + q.m, 0) + p.payload * 1000;
      let yCur = RS / 2;
      live.forEach((q, i) => {
        const frac = q.m / massSum;
        const hh = RS * frac * .92;
        const isCur = i === 0;
        ctx.fillStyle = isCur ? '#f1f5fb' : '#b9c6de';
        D.roundRect(ctx, -RW, yCur - hh, RW * 2, hh, 2); ctx.fill();
        // 남은 추진제
        if (isCur) {
          const pf = clamp(st.propLeft / q.prop, 0, 1);
          ctx.fillStyle = C.lam; ctx.globalAlpha = .85;
          ctx.fillRect(-RW + 1.5, yCur - hh * pf, RW * 2 - 3, hh * pf);
          ctx.globalAlpha = 1;
        }
        // 단 구분선
        ctx.strokeStyle = '#5b6a8d'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-RW, yCur - hh); ctx.lineTo(RW, yCur - hh); ctx.stroke();
        yCur -= hh;
      });
      // 탑재체 + 페어링
      const ph = RS * (p.payload * 1000 / massSum) * .92;
      ctx.fillStyle = C.pay;
      D.roundRect(ctx, -RW * .9, yCur - ph, RW * 1.8, ph, 2); ctx.fill();
      ctx.fillStyle = '#dbe4f6';
      ctx.beginPath();
      ctx.moveTo(0, yCur - ph - RS * .16);
      ctx.lineTo(RW * .9, yCur - ph); ctx.lineTo(-RW * .9, yCur - ph);
      ctx.closePath(); ctx.fill();
      // 핀 (1단이 남아 있을 때만)
      if (st.idx === 0) {
        ctx.fillStyle = '#8794b5';
        ctx.beginPath(); ctx.moveTo(-RW, RS / 2 - RS * .16); ctx.lineTo(-RW - RS * .1, RS / 2 + RS * .04); ctx.lineTo(-RW, RS / 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(RW, RS / 2 - RS * .16); ctx.lineTo(RW + RS * .1, RS / 2 + RS * .04); ctx.lineTo(RW, RS / 2); ctx.fill();
      }
      ctx.restore();

      /* HUD */
      const vr = st.vx * ur[0] + st.vy * ur[1];
      const vh = Math.sqrt(Math.max(0, v * v - vr * vr));
      D.text(ctx, 'T + ' + mmss(st.mt), 28, top + 8, { size: 15, color: '#e8eefc', bold: true, mono: true });
      D.text(ctx, (st.burning ? (st.idx + 1) + '단 연소 중' : '관성 비행') + '  ·  ' + Math.round(p.stages) + '단 로켓',
        28, top + 26, { size: 11, color: st.burning ? C.n : '#61719a' });
      D.text(ctx, fmt(alt / 1000, 1) + ' km', 28, top + 50, { size: 20, color: C.n, bold: true });
      D.text(ctx, '수평 ' + fmt(vh, 0) + ' / 필요 ' + fmt(Math.sqrt(MU / ob.r), 0) + ' m/s', 28, top + 70, { size: 12, color: C.pitch });
      D.text(ctx, '질량 ' + fmt(st.m / 1000, 1) + ' t · 시간 배속 ×' + (st.burning ? TS_BURN : TS_COAST), 28, top + 88, { size: 10, color: '#4a5878' });

      st.events.slice(-5).forEach((e, i, arr) => {
        D.text(ctx, 'T+' + mmss(e.mt) + '  ' + e.label, 28, bot - 6 - (arr.length - 1 - i) * 15,
          { size: 10.5, color: i === arr.length - 1 ? '#e8eefc' : '#61719a' });
      });

      /* 단별 Δv 막대 */
      const gx = w - 196, gy = top + 110, gw = 172;
      const MAXDV = 13000, dv = totalDv(p), one = singleDv(p);
      D.text(ctx, '단별 Δv', gx, gy - 10, { size: 11, color: hl === 'dv' ? '#fff' : '#93a2c4', bold: hl === 'dv' });
      let yb = gy;
      S.forEach((q, i) => {
        const on = st.burning && i === st.idx;
        D.bar(ctx, gx, yb, gw, 12, q.dv, MAXDV, i === 0 ? C.Isp1 : C.Isp2, null, on || hl === (i === 0 ? 'Isp1' : 'Isp2'));
        D.text(ctx, (i + 1) + '단  ' + fmt(q.dv, 0) + ' m/s' + (on ? '  ◀' : ''), gx, yb + 25,
          { size: 10.5, color: i === 0 ? C.Isp1 : C.Isp2, bold: on });
        yb += 32;
      });
      D.bar(ctx, gx, yb + 4, gw, 14, dv, MAXDV, C.dv, null, hl === 'dv');
      D.text(ctx, '합계 ' + fmt(dv, 0) + ' m/s', gx, yb + 32, { size: 12, color: C.dv, bold: true });
      // 1단 환산 비교
      D.bar(ctx, gx, yb + 42, gw, 9, one, MAXDV, '#fb7185', null, false);
      D.text(ctx, '1단으로 만들면 ' + fmt(one, 0), gx, yb + 64, { size: 10, color: '#fb7185' });
      const lx = gx + gw * (7800 / MAXDV);
      D.line(ctx, lx, gy - 6, lx, yb + 52, { color: '#34d399', dash: [4, 4], width: 2 });
      D.text(ctx, '궤도 속도', lx + 4, gy - 10, { size: 9.5, color: '#34d399' });

      if (st.verdict === 'orbit') D.tag(ctx, '✔ 궤도 진입 성공 — 근지점 ' + fmt((ob.rp - RE) / 1000, 0) + ' / 원지점 ' + fmt((ob.ra - RE) / 1000, 0) + ' km', w / 2, top + 10, '#34d399', true);
      else if (st.verdict === 'escape') D.tag(ctx, '지구 탈출 궤도', w / 2, top + 10, '#a78bfa', true);
      else if (st.verdict === 'suborbital') D.tag(ctx, '준궤도 — Δv가 부족해 다시 떨어집니다', w / 2, top + 10, '#fb7185', true);
      if (st.done) D.tag(ctx, '↺ 처음으로', w / 2, top + 34, '#fbbf24', true);
    }
  });
})();
