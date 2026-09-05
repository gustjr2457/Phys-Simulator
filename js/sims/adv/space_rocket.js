/* [항공우주공학] 치올콥스키 로켓 방정식 — Δv = Isp·g₀·ln(m₀/m_f) */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { Isp: '#fbbf24', lam: '#f472b6', TW: '#34d399', dv: '#5eead4', v: '#60a5fa', loss: '#fb7185' };
  const G0 = 9.80665, M0 = 50000;      // 초기 질량 50 t
  const TS = 12;                        // 시간 배속
  const LEO = 9400;                     // 저궤도 진입 기준 Δv
  const KARMAN = 100000;                // 우주 경계

  const mfOf = p => M0 * (1 - p.lam);
  const dvIdeal = p => p.Isp * G0 * Math.log(M0 / mfOf(p));
  const thrust = p => p.TW * M0 * G0;
  const mdot = p => thrust(p) / (p.Isp * G0);
  const tBurn = p => (M0 - mfOf(p)) / mdot(p);
  const mmss = s => Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2);

  PS.register({
    id: 'space-rocket', mode: 'adv', category: '항공우주공학',
    title: '로켓 방정식',
    sub: 'Δv = Isp·g₀·ln(m₀/m_f)',
    tagline: '로켓이 어려운 이유는 ln 때문입니다. 속도를 조금 더 얻으려면 연료는 기하급수적으로 늘어납니다.',

    params: [
      { key: 'Isp', symbol: 'Isp', label: '비추력', unit: 's', min: 200, max: 460, step: 10, value: 300, color: C.Isp, reset: true, dec: 0,
        where: '<b>엔진의 연비</b>입니다. 배기 가스를 얼마나 빠르게 내뿜는지(v_e = Isp·g₀)를 뜻하며, <b>화염의 길이와 밝기</b>로 나타납니다. 고체 260, 케로신 300, 수소 450초 수준입니다.' },
      { key: 'lam', symbol: 'λ', label: '추진제 질량비', unit: '', min: .5, max: .95, step: .01, value: .85, color: C.lam, reset: true, dec: 2,
        where: '전체 질량 중 <b>연료가 차지하는 비율</b>입니다. 왼쪽 탱크 게이지가 이만큼 채워지고 연소하면서 줄어듭니다. 0.9면 로켓의 90%가 연료라는 뜻입니다.' },
      { key: 'TW', symbol: 'T/W', label: '추력 대 중량비', unit: '', min: 1.1, max: 4, step: .1, value: 1.5, color: C.TW, reset: true, dec: 1,
        where: '<b>엔진의 힘</b>입니다. 1보다 커야 이륙합니다. 크면 빨리 태워 <b>중력 손실</b>이 줄지만 연소 시간이 짧아지고 기체에 걸리는 G도 커집니다.' }
    ],
    vars: {
      dv: { symbol: 'Δv', label: '이상적 속도 증가량', unit: 'm/s', color: C.dv,
        where: '오른쪽 <b>Δv 게이지</b>입니다. 로켓이 낼 수 있는 속도의 총량이며, 목표선(저궤도 9,400 m/s)을 넘어야 궤도에 오릅니다.' },
      m0: { symbol: 'm₀', label: '이륙 질량', unit: 'kg', color: C.lam,
        where: '연료를 가득 채운 <b>출발 질량</b>(50 t 고정)입니다.' },
      mf: { symbol: 'm_f', label: '연소 종료 질량', unit: 'kg', color: C.lam,
        where: '연료를 다 쓴 뒤 남는 <b>빈 로켓 + 화물</b>의 질량입니다. 작을수록 ln 안의 비가 커져 Δv가 늘어납니다.' },
      loss: { symbol: 'g₀t_b', label: '중력 손실', unit: 'm/s', color: C.loss,
        where: '수직으로 올라가는 동안 <b>중력이 깎아 먹는 속도</b>입니다. 연소 시간이 길수록 손해라, 실제 로켓은 일찍 기울여 날아갑니다.' },
      v: { symbol: 'v', label: '현재 속도', unit: 'm/s', color: C.v,
        where: '실제로 얻은 속도입니다. 이상적 Δv에서 중력 손실을 뺀 값에 가깝습니다.' }
    },
    formulas: [
      { name: '치올콥스키 로켓 방정식', tpl: '{dv} = {Isp} · g₀ · ln( {m0} ⁄ {mf} )' },
      { name: '연소 종료 질량', tpl: '{mf} = {m0} · ( 1 − {lam} )' },
      { name: '연소 시간', tpl: 't_b = {Isp} · {lam} ⁄ (T/W)' },
      { name: '중력 손실', tpl: '{loss} = g₀ · t_b' },
      { name: '실제 속도', tpl: '{v} ≈ {dv} − {loss}' }
    ],

    init(p) {
      return {
        m: M0, v: 0, alt: 0, burning: true, done: false,
        smoke: [], smokeT: 0, events: [{ mt: 0, label: '이륙' }],
        apogee: 0, apoLogged: false, shake: 0
      };
    },

    step(st, p, dt) {
      const dtp = dt * TS;
      if (st.burning) {
        const md = mdot(p);
        st.m = Math.max(mfOf(p), st.m - md * dtp);
        st.v += (thrust(p) / st.m - G0) * dtp;
        if (st.m <= mfOf(p) + 1e-6) {
          st.burning = false;
          st.events.push({ mt: st.t * TS, label: '연소 종료 (MECO)' });
        }
      } else {
        st.v -= G0 * dtp;
      }
      st.alt = Math.max(0, st.alt + st.v * dtp);
      if (st.alt > st.apogee) st.apogee = st.alt;

      // 배기 연기 — 고도와 함께 남는다
      // 연기는 화면 픽셀이 아니라 실제 크기(m)로 다룬다 — 카메라가 멀어지면 알아서 작아진다
      st.smokeT += dt;
      if (st.burning && st.smokeT > .035) {
        st.smokeT = 0;
        st.smoke.push({ a: Math.max(0, st.alt - 30), xm: (Math.random() - .5) * 26, rm: 22 + Math.random() * 14, age: 0 });
        if (st.smoke.length > 90) st.smoke.shift();
      }
      st.smoke.forEach(s => { s.age += dt; s.rm = Math.min(s.rm + dtp * 26, 620); });
      if (st.smoke.length && st.smoke[0].age > 5) st.smoke = st.smoke.filter(s => s.age <= 5);
      st.shake = st.burning ? clamp(p.TW * .9, 0, 4) : 0;

      if (!st.burning && st.v < 0 && !st.apoLogged) {
        st.apoLogged = true;
        st.events.push({ mt: st.t * TS, label: '정점 ' + fmt(st.apogee / 1000, 1) + ' km' });
      }
      if (st.alt > KARMAN && !st.karman) {
        st.karman = true;
        st.events.push({ mt: st.t * TS, label: '카르만 선 통과 — 우주 진입' });
      }
      if (!st.burning && st.v < 0 && st.alt <= 0) st.done = true;
    },

    graphs: [
      { title: '속도 – 시간', xmin: 10, window: 30, y0: 0,
        series: [{ key: 'v', label: '실제 v (m/s)', color: C.v }, { key: 'dvi', label: '이상적 Δv', color: C.dv }] },
      { title: '고도 – 시간', xmin: 10, window: 30, y0: 0, series: [{ key: 'alt', label: '고도 (km)', color: C.TW }] }
    ],
    sample(st, p) { return { v: st.v, dvi: dvIdeal(p), alt: st.alt / 1000 }; },

    readouts(st, p) {
      const dv = dvIdeal(p), tb = tBurn(p), loss = G0 * tb;
      const gForce = st.burning ? thrust(p) / (st.m * G0) : 0;
      return [
        { label: '이상적 Δv', value: dv, unit: 'm/s', color: C.dv, dec: 0 },
        { label: '중력 손실', value: loss, unit: 'm/s', color: C.loss, dec: 0 },
        { label: '실제 도달 Δv', value: dv - loss, unit: 'm/s', dec: 0 },
        { label: '질량비 m₀/m_f', value: M0 / mfOf(p), unit: '배', color: C.lam },
        { label: '연소 시간 t_b', value: tb, unit: 's', dec: 0 },
        { label: '배기 속도 Isp·g₀', value: p.Isp * G0, unit: 'm/s', color: C.Isp, dec: 0 },
        { label: '현재 속도', value: st.v, unit: 'm/s', color: C.v, dec: 0 },
        { label: '현재 고도', value: st.alt / 1000, unit: 'km' },
        { label: '체감 중력', value: gForce, unit: 'G', color: gForce > 4 ? '#fb7185' : C.TW },
        { label: '최고 고도', value: st.apogee / 1000, unit: 'km' },
        { label: '저궤도(9,400 m/s) 달성', wide: true, color: dv - loss >= LEO ? '#34d399' : '#fb7185',
          value: dv - loss >= LEO ? '✔ 궤도 진입 가능' : '✘ 부족 — ' + fmt(LEO - (dv - loss), 0) + ' m/s 모자람' }
      ];
    },

    notes: [
      'Δv는 <b>ln(질량비)</b>에 비례합니다. Δv를 2배로 하려면 질량비를 <b>제곱</b>해야 합니다 — 로켓이 거대해지는 이유입니다.',
      '질량비 0.9(연료 90%)로도 Δv는 Isp·g₀의 <b>2.3배</b>뿐입니다. 그래서 <b>다단 로켓</b>이 필요합니다.',
      'Isp를 올리는 것이 가장 효율적입니다. 액체수소 엔진(450 s)이 고체(260 s)보다 훨씬 유리합니다.',
      '연료가 줄면 같은 추력에도 <b>체감 중력(G)이 계속 커집니다</b>. 실제 로켓은 이 때문에 후반에 추력을 줄입니다.',
      '고도가 높아지면 <b>화염이 넓게 퍼집니다</b>. 바깥 공기 압력이 낮아 배기가 눌리지 않기 때문입니다.'
    ],
    presets: [
      { name: '케로신 1단 (Isp 300)', set: { Isp: 300, lam: .85, TW: 1.5 } },
      { name: '액체수소 (Isp 450)', set: { Isp: 450, lam: .85, TW: 1.4 } },
      { name: '고체 부스터 (Isp 260)', set: { Isp: 260, lam: .85, TW: 2.5 } },
      { name: '연료를 극한까지 (λ=0.95)', set: { lam: .95, Isp: 450 } },
      { name: '추력 부족 (T/W 1.1)', set: { TW: 1.1 } }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const dv = dvIdeal(p), tb = tBurn(p), loss = G0 * tb;
      const frac = (st.m - mfOf(p)) / (M0 - mfOf(p));
      const mt = st.t * TS;

      /* ── 카메라: 로켓이 항상 화면 아래쪽 1/3 지점에 오도록 따라간다 ── */
      const top = 34, bot = h * .9;
      const span = clamp(st.alt * 2.6, 700, 300000);
      const camLo = clamp(st.alt - span * .32, 0, 1e12);
      const Y = a => top + (1 - (a - camLo) / span) * (bot - top);

      /* ── 하늘 ─────────────────────────────── */
      const dark = clamp((camLo + span * .32) / 90000, 0, 1);
      ctx.save();
      const sky = ctx.createLinearGradient(0, top - 34, 0, bot + 40);
      sky.addColorStop(0, 'rgba(4,7,16,1)');
      sky.addColorStop(1, 'rgba(' + Math.round(14 + 32 * (1 - dark)) + ',' +
        Math.round(30 + 74 * (1 - dark)) + ',' + Math.round(58 + 84 * (1 - dark)) + ',1)');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      ctx.restore();
      for (let i = 0; i < 90; i++) {
        ctx.save();
        ctx.globalAlpha = dark * (.15 + (i % 6) * .12);
        ctx.fillStyle = '#fff';
        ctx.fillRect((i * 163.7) % w, ((i * 91.3) % (h * .9)), 1.5, 1.5);
        ctx.restore();
      }

      /* ── 고도 눈금 (아래로 흘러내리며 상승감을 만든다) ── */
      const raw = span / 6, mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const stepA = [1, 2, 5, 10].map(m => m * mag).find(v => v >= raw) || 10 * mag;
      ctx.save();
      for (let a = Math.ceil(camLo / stepA) * stepA; a < camLo + span; a += stepA) {
        const yy = Y(a);
        if (yy < top || yy > bot) continue;
        D.line(ctx, 40, yy, w - 250, yy, { color: 'rgba(147,162,196,.10)' });
        D.text(ctx, a >= 1000 ? fmt(a / 1000, a >= 10000 ? 0 : 1) + ' km' : fmt(a, 0) + ' m',
          36, yy + 4, { size: 9.5, color: 'rgba(147,162,196,.45)', align: 'right' });
      }
      ctx.restore();

      // 카르만 선
      const ky = Y(KARMAN);
      if (ky > top && ky < bot) {
        D.line(ctx, 40, ky, w - 250, ky, { color: 'rgba(94,234,212,.55)', dash: [7, 6], width: 1.6 });
        D.text(ctx, '카르만 선 100 km — 우주의 경계', 46, ky - 7, { size: 10.5, color: '#5eead4' });
      }

      /* ── 지면과 발사대 ────────────────────── */
      const cx = w * .30;
      const gy = Y(0);
      if (gy < bot + 2) {
        ctx.save();
        const gg = ctx.createLinearGradient(0, gy, 0, gy + 90);
        gg.addColorStop(0, '#2a3b2f'); gg.addColorStop(1, '#141d22');
        ctx.fillStyle = gg; ctx.fillRect(0, gy, w, h - gy + 60);
        ctx.restore();
        D.line(ctx, 0, gy, w, gy, { color: 'rgba(147,162,196,.4)', width: 2 });
        // 발사대 + 타워
        ctx.fillStyle = '#3a4a63';
        ctx.fillRect(cx - 46, gy - 12, 92, 12);
        ctx.fillStyle = '#4d5f7d';
        ctx.fillRect(cx + 40, gy - 150, 12, 150);
        for (let i = 0; i < 6; i++) D.line(ctx, cx + 40, gy - 24 - i * 24, cx + 52, gy - 40 - i * 24, { color: 'rgba(147,162,196,.35)' });
      }

      /* ── 로켓 ─────────────────────────────── */
      const shake = st.shake ? (Math.random() - .5) * st.shake : 0;
      const rx = cx + shake, ry = Y(st.alt) - 44;
      const RH = 108, RW = 24;

      // 배기 연기
      const mToPx = (bot - top) / span;
      st.smoke.forEach(s => {
        const al = clamp(.32 - s.age * .062, 0, .32);
        if (al < .015) return;
        const sy = Y(s.a), rp = s.rm * mToPx;
        if (rp < .8 || sy < -60 || sy > h + 60) return;
        ctx.save();
        ctx.globalAlpha = al;
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(rx + s.xm * mToPx, sy, rp, 0, 7); ctx.fill();
        ctx.restore();
      });

      // 화염 — 고도가 높을수록(바깥 압력이 낮을수록) 넓게 퍼진다
      if (st.burning) {
        const expand = 1 + 2.1 * (1 - Math.exp(-st.alt / 26000));
        const fl = (26 + p.Isp * .17) * p.TW * .68 * (.86 + .28 * Math.random());
        ctx.save();
        const fg = ctx.createLinearGradient(0, ry + RH / 2, 0, ry + RH / 2 + fl);
        fg.addColorStop(0, 'rgba(255,255,235,.95)');
        fg.addColorStop(.3, 'rgba(255,190,70,.85)');
        fg.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = fg;
        if (hl === 'Isp') { ctx.shadowColor = C.Isp; ctx.shadowBlur = 26; }
        ctx.beginPath();
        ctx.moveTo(rx - RW * .40, ry + RH / 2);
        ctx.quadraticCurveTo(rx - RW * .40 * expand * 2.4, ry + RH / 2 + fl * .75, rx, ry + RH / 2 + fl * 1.12);
        ctx.quadraticCurveTo(rx + RW * .40 * expand * 2.4, ry + RH / 2 + fl * .75, rx + RW * .40, ry + RH / 2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        D.text(ctx, 'v_e = ' + fmt(p.Isp * G0, 0) + ' m/s', rx + 46, ry + RH / 2 + 44,
          { size: 10.5, color: C.Isp, bold: hl === 'Isp' });
      }

      // 동체
      ctx.save();
      if (hl === 'lam') { ctx.shadowColor = C.lam; ctx.shadowBlur = 18; }
      ctx.beginPath();
      ctx.moveTo(rx, ry - RH / 2 - 26);
      ctx.lineTo(rx + RW / 2, ry - RH / 2 + 10);
      ctx.lineTo(rx + RW / 2, ry + RH / 2);
      ctx.lineTo(rx - RW / 2, ry + RH / 2);
      ctx.lineTo(rx - RW / 2, ry - RH / 2 + 10);
      ctx.closePath();
      const bg = ctx.createLinearGradient(rx - RW / 2, 0, rx + RW / 2, 0);
      bg.addColorStop(0, '#9aa8c4'); bg.addColorStop(.4, '#f1f5fb'); bg.addColorStop(1, '#8794b5');
      ctx.fillStyle = bg; ctx.fill();
      ctx.restore();
      // 탱크 안 추진제
      ctx.save();
      ctx.fillStyle = C.lam; ctx.globalAlpha = .9;
      const th = (RH - 24) * frac;
      ctx.fillRect(rx - RW / 2 + 3, ry + RH / 2 - 6 - th, RW - 6, th);
      ctx.restore();
      // 핀
      ctx.fillStyle = '#8794b5';
      ctx.beginPath(); ctx.moveTo(rx - RW / 2, ry + RH / 2 - 22); ctx.lineTo(rx - RW / 2 - 13, ry + RH / 2 + 6); ctx.lineTo(rx - RW / 2, ry + RH / 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(rx + RW / 2, ry + RH / 2 - 22); ctx.lineTo(rx + RW / 2 + 13, ry + RH / 2 + 6); ctx.lineTo(rx + RW / 2, ry + RH / 2); ctx.fill();

      /* ── 비행 HUD ─────────────────────────── */
      const gForce = st.burning ? thrust(p) / (st.m * G0) : 0;
      D.text(ctx, 'T + ' + mmss(mt), 40, top + 4, { size: 15, color: '#e8eefc', bold: true, mono: true });
      D.text(ctx, (st.burning ? '연소 중' : (st.v > 0 ? '관성 상승' : '하강')) +
        '  ·  ' + fmt(gForce, 1) + ' G', 40, top + 22, { size: 11, color: st.burning ? C.TW : '#61719a' });
      D.text(ctx, fmt(st.alt / 1000, 1) + ' km', 40, top + 46, { size: 20, color: C.TW, bold: true });
      D.text(ctx, fmt(st.v, 0) + ' m/s', 40, top + 66, { size: 15, color: hl === 'v' ? '#fff' : C.v, bold: hl === 'v' });

      // 이벤트 로그
      const ex = 40, ey = bot - 8;
      st.events.slice(-4).forEach((e, i, arr) => {
        D.text(ctx, 'T+' + mmss(e.mt) + '  ' + e.label, ex, ey - (arr.length - 1 - i) * 16,
          { size: 10.5, color: i === arr.length - 1 ? '#e8eefc' : '#61719a' });
      });

      /* ── 질량 게이지 ──────────────────────── */
      const mx = w - 224, my = top + 118, mw = 34, mh = h * .34;
      D.text(ctx, '질량', mx + mw / 2, my - 10, { size: 10.5, color: '#61719a', align: 'center' });
      D.roundRect(ctx, mx, my, mw, mh, 6); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const dryH = mh * (mfOf(p) / M0);
      ctx.save();
      ctx.fillStyle = '#8794b5'; ctx.fillRect(mx, my + mh - dryH, mw, dryH);
      if (hl === 'lam') { ctx.shadowColor = C.lam; ctx.shadowBlur = 16; }
      ctx.fillStyle = C.lam;
      const propH = (mh - dryH) * frac;
      ctx.fillRect(mx, my + mh - dryH - propH, mw, propH);
      ctx.restore();
      D.text(ctx, fmt(st.m / 1000, 1) + ' t', mx + mw / 2, my + mh + 16, { size: 11.5, color: '#e8eefc', align: 'center', bold: true });
      D.text(ctx, 'm₀/m_f = ' + fmt(M0 / mfOf(p), 2), mx + mw / 2, my + mh + 32, { size: 10, color: C.lam, align: 'center' });

      /* ── Δv 게이지 ────────────────────────── */
      const gx = w - 172, gyy = top + 118, gw = 150, gh = 15;
      const MAXDV = 13000;
      D.text(ctx, 'Δv 예산', gx, gyy - 10, { size: 11, color: hl === 'dv' ? '#fff' : '#93a2c4', bold: hl === 'dv' });
      D.bar(ctx, gx, gyy, gw, gh, dv, MAXDV, C.dv, null, hl === 'dv' || hl === 'Isp' || hl === 'lam');
      D.text(ctx, '이상적 ' + fmt(dv, 0), gx, gyy + gh + 14, { size: 10.5, color: C.dv });
      D.bar(ctx, gx, gyy + 26, gw, 10, loss, MAXDV, C.loss, null, hl === 'loss');
      D.text(ctx, '중력 손실 −' + fmt(loss, 0), gx, gyy + 50, { size: 10.5, color: C.loss, bold: hl === 'loss' });
      D.bar(ctx, gx, gyy + 62, gw, 13, Math.max(0, dv - loss), MAXDV, '#e8eefc', null, false);
      D.text(ctx, '실제 ' + fmt(dv - loss, 0) + ' m/s', gx, gyy + 90, { size: 11.5, color: '#e8eefc', bold: true });
      const lx = gx + gw * (LEO / MAXDV);
      D.line(ctx, lx, gyy - 5, lx, gyy + 78, { color: '#34d399', dash: [4, 4], width: 2 });
      D.text(ctx, '저궤도', lx + 4, gyy - 9, { size: 9.5, color: '#34d399' });
      D.text(ctx, '시간 배속 ×' + TS + ' · 연소 ' + fmt(tb, 0) + ' s', gx, gyy + 110, { size: 10, color: '#4a5878' });

      if (st.done) D.tag(ctx, '추락 — Δv가 부족했습니다. ↺ 처음으로', w / 2, top + 10, '#fb7185', true);
    }
  });
})();
