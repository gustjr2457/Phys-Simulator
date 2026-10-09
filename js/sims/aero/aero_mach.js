/* [항공우주공학·비행역학] 마하수와 충격파 — M = V/a,  a = √(γRT)
   공기를 '밀어낼 수 있는' 속도에는 한계가 있다. 비행기가 다가온다는 정보는
   음속으로 앞으로 전해지는데, 비행기가 그보다 빨라지면 공기는 미리 비켜설 수가 없다.
   그래서 압력이 한 면에 쌓여 충격파가 되고, 그 면을 지나는 순간 압력·온도·밀도가
   불연속적으로 뛴다. 음속은 온도에만 의존하므로 — 고도를 올리면 같은 속도로도
   마하수가 올라간다. 초음속기 설계의 출발점. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { V: '#fb7185', alt: '#5eead4', Tdel: '#fbbf24',
              a: '#60a5fa', M: '#a78bfa', T0: '#fb923c' };
  const GAMMA = 1.4;

  // 국제표준대기
  const tempOf = p => (p.alt < 11 ? 288.15 - 6.5 * p.alt : 216.65) + p.Tdel;
  const sonic = p => 20.0468 * Math.sqrt(Math.max(tempOf(p), 1));          // m/s
  const machOf = p => p.V / sonic(p);
  const coneDeg = p => machOf(p) > 1 ? Math.asin(1 / machOf(p)) * 180 / Math.PI : 0;
  const stagT = p => tempOf(p) * (1 + (GAMMA - 1) / 2 * machOf(p) * machOf(p));
  const pgFactor = p => { const M = machOf(p); return M < .95 ? 1 / Math.sqrt(1 - M * M) : Infinity; };

  const REG = [[0, .3, '저속 비압축성', '#34d399', '공기를 비압축성으로 봐도 된다 — 베르누이 식이 그대로 통한다'],
               [.3, .8, '아음속 (압축성)', '#60a5fa', '밀도 변화가 무시 못 할 정도 — 여객기 순항 영역'],
               [.8, 1.2, '천음속', '#fbbf24', '날개 윗면 일부가 먼저 초음속이 된다 — 항력이 급증하는 가장 까다로운 구간'],
               [1.2, 5, '초음속', '#fb7185', '기수에서 충격파가 선다 — 뾰족한 코, 얇은 날개가 필요'],
               [5, 99, '극초음속', '#f472b6', '공기가 해리·이온화된다 — 열이 가장 큰 문제']];
  const regOf = M => REG.find(r => M >= r[0] && M < r[1]) || REG[REG.length - 1];

  PS.register({
    id: 'aero-mach', mode: 'aero', category: '비행역학',
    title: '마하수와 충격파',
    sub: 'M = V/a,  a = √(γRT)',
    tagline: '비행기가 온다는 정보는 음속으로 앞서 갑니다. 비행기가 그보다 빨라지면 공기는 미리 비켜설 수 없고 — 압력이 한 면에 쌓여 충격파가 됩니다.',

    params: [
      { key: 'V', symbol: 'V', label: '비행 속도', unit: 'm/s', min: 50, max: 2200, step: 10, value: 250, color: C.V, dec: 0,
        where: '<b>대기에 대한 속도</b>입니다. 마하수는 이 값을 그 고도의 음속으로 나눈 것이라, 같은 속도라도 고도에 따라 마하수가 달라집니다.' },
      { key: 'alt', symbol: 'h', label: '고도', unit: 'km', min: 0, max: 20, step: .5, value: 11, color: C.alt, dec: 1,
        where: '<b>비행 고도</b>입니다. 올라갈수록 기온이 떨어져 음속이 낮아지므로 — <b>같은 속도로도 마하수가 올라갑니다</b>. 11 km(대류권계면) 위로는 −56.5 °C로 일정합니다.' },
      { key: 'Tdel', symbol: 'ΔT', label: '표준대기 대비 기온차', unit: 'K', min: -30, max: 30, step: 1, value: 0, color: C.Tdel, dec: 0,
        where: '그날의 기온이 <b>표준대기보다 얼마나 높거나 낮은가</b>입니다. 음속은 오직 온도로만 정해지므로(압력·밀도와 무관!), 이것만으로 마하수가 바뀝니다.' }
    ],
    vars: {
      a: { symbol: 'a', label: '음속', unit: 'm/s', color: C.a,
        where: '그 고도의 <b>음속</b>입니다. a = √(γRT) 로 <b>온도에만</b> 의존합니다 — 압력이나 밀도와는 무관하다는 것이 자주 오해되는 부분입니다.' },
      M: { symbol: 'M', label: '마하수', unit: '', color: C.M,
        where: '속도를 음속으로 나눈 값입니다. 공기가 <b>압축성인지 아닌지</b>, 충격파가 생기는지를 결정하는 유일한 수입니다.' },
      T0: { symbol: 'T₀', label: '정체점 온도', unit: 'K', color: C.T0,
        where: '기수 끝에서 공기가 <b>완전히 멈추며 데워지는 온도</b>입니다. 마하수의 제곱으로 올라가 — 초음속기의 가장 큰 설계 제약(열 장벽)이 됩니다.' }
    },
    formulas: [
      { name: '음속 — 온도에만 의존한다', tpl: '{a} = √(γRT) ≈ 20.05√T' },
      { name: '마하수', tpl: '{M} = {V} ⁄ {a}' },
      { name: '마하콘 반각', tpl: 'sin μ = 1 ⁄ {M}' },
      { name: '정체점 온도 (단열 압축)', tpl: '{T0} = T(1 + 0.2{M}²)' },
      { name: '압축성 보정 (프란틀-글라우어트)', tpl: 'C_L = C_L0 ⁄ √(1 − {M}²)' }
    ],

    init(p) { return { x: .1, done: false }; },
    step(st, p, dt) { st.x += dt * .22; if (st.x > 1.25) st.x = -.25; },

    graphs: [{
      title: '고도에 따른 음속과 마하수', xKey: 'hh', xUnit: 'km', xMin: 0, xMax: 20, y0: 0,
      series: [
        { key: 'aa', label: '음속 (m/s)', color: C.a },
        { key: 'mm', label: '마하수 ×100', color: C.M }
      ]
    }],
    sample(st, p) {
      const hh = (st.t * 2.2) % 20;
      const T = (hh < 11 ? 288.15 - 6.5 * hh : 216.65) + p.Tdel;
      const a = 20.0468 * Math.sqrt(Math.max(T, 1));
      return { hh: hh, aa: a, mm: p.V / a * 100 };
    },

    readouts(st, p) {
      const T = tempOf(p), a = sonic(p), M = machOf(p), r = regOf(M);
      const pg = pgFactor(p);
      return [
        { label: '기온', value: T - 273.15, unit: '°C', color: C.alt, dec: 1 },
        { label: '음속 a', value: a, unit: 'm/s', color: C.a, dec: 1 },
        { label: '음속 (km/h)', value: a * 3.6, unit: 'km/h', color: C.a, dec: 0 },
        { label: '마하수 M', value: M, unit: '', color: C.M, dec: 3 },
        { label: '속도 (km/h)', value: p.V * 3.6, unit: 'km/h', color: C.V, dec: 0 },
        { label: '영역', value: r[2], wide: true, color: r[3] },
        { label: '그 영역의 특징', value: r[4], wide: true, color: r[3] },
        { label: '마하콘 반각', value: M > 1 ? coneDeg(p) : 0, unit: '°', dec: 1, color: C.M },
        { label: '정체점 온도 T₀', value: stagT(p) - 273.15, unit: '°C', color: C.T0, dec: 0 },
        { label: '기수 가열', wide: true, color: stagT(p) > 500 ? '#fb7185' : (stagT(p) > 400 ? '#fbbf24' : '#34d399'),
          value: stagT(p) > 1200 ? '알루미늄은 녹는다 — 티타늄·니켈합금이 필요' :
                 (stagT(p) > 500 ? '알루미늄 한계 근처 — 콩코드가 이 영역' :
                  (stagT(p) > 350 ? '주의할 수준의 가열' : '열은 문제가 되지 않는다')) },
        { label: '압축성 보정 (1/√(1−M²))', value: isFinite(pg) ? pg : Infinity, dec: 3, color: '#fbbf24' },
        { label: '해수면이었다면 마하수', value: p.V / (20.0468 * Math.sqrt(288.15 + p.Tdel)), dec: 3, color: '#93a2c4' }
      ];
    },

    notes: [
      '<b>음속은 온도에만 의존합니다</b>(a = √(γRT)). 압력이나 밀도가 아닙니다 — 흔히 "높이 올라가면 공기가 희박해서 음속이 느려진다"고 하는데, 정확한 이유는 <b>추워서</b>입니다. 11 km에서 음속은 295 m/s로 해수면(340)보다 13% 느립니다.',
      '그래서 <b>같은 속도로도 고도를 올리면 마하수가 올라갑니다.</b> 여객기가 11 km에서 순항하는 이유 중 하나가 이것입니다 — 공기 저항은 작으면서 마하 0.85 근처의 효율 좋은 구간을 쓸 수 있습니다.',
      '<b>천음속(M 0.8~1.2)이 가장 까다롭습니다.</b> 기체 전체는 아음속인데 날개 윗면의 빨라진 흐름만 먼저 초음속이 되어 거기에 충격파가 섭니다. 그 충격파가 경계층을 떼어 내면서 항력이 폭증하는데 — 1940년대에는 이것을 "음속 장벽"이라 불렀습니다.',
      '<b>충격파는 정보가 앞서 갈 수 없어서 생깁니다.</b> "비행기가 온다"는 압력 신호는 음속으로 퍼지는데, 비행기가 그보다 빠르면 공기는 미리 비켜설 수 없습니다. 그래서 압력이 한 면에 쌓이고, 그 면을 지나면 압력·온도·밀도가 <b>불연속적으로</b> 뜁니다.',
      '<b>열 장벽이 속도의 진짜 한계입니다.</b> 정체점 온도는 M²로 오릅니다 — 마하 2에서 약 120 °C(콩코드는 비행 중 동체가 25 cm 늘어났습니다), 마하 3에서 330 °C(SR-71은 티타늄으로 만들었습니다), 재진입 속도인 마하 25에서는 수천 도가 됩니다.',
      '소닉붐은 "음속을 넘는 순간" 한 번 나는 것이 아니라, 초음속으로 나는 <b>내내 끌려다니는 원뿔</b>이 지상을 쓸고 지나가는 것입니다 — 그래서 육상 초음속 비행이 금지돼 있습니다.'
    ],
    presets: [
      { name: '여객기 순항 (M 0.85)', set: { V: 250, alt: 11, Tdel: 0 } },
      { name: '이륙 직후', set: { V: 90, alt: 0, Tdel: 0 } },
      { name: '음속 돌파 직전 (천음속)', set: { V: 290, alt: 11, Tdel: 0 } },
      { name: '콩코드 (M 2.0)', set: { V: 590, alt: 18, Tdel: 0 } },
      { name: 'SR-71 (M 3.2)', set: { V: 950, alt: 20, Tdel: 0 } },
      { name: '극초음속 (M 7)', set: { V: 2080, alt: 20, Tdel: 0 } },
      { name: '같은 속도, 해수면이면', set: { V: 250, alt: 0, Tdel: 0 } }
    ],
    challenges: [
      {
        id: 'break', title: '음속 돌파하기',
        desc: '마하 1을 넘겨 기수에 충격파가 서는 것을 확인하세요.',
        hint: '속도를 올리거나, 속도는 그대로 두고 고도를 올려 음속을 낮추는 방법도 있습니다.',
        check: ({ P }) => machOf(P) > 1
      },
      {
        id: 'alt', title: '고도만으로 마하수 올리기',
        desc: '속도를 300 m/s 이하로 유지하면서 고도만 올려 마하수를 1.0 이상으로 만들어 보세요.',
        hint: '11 km 위에서는 −56.5 °C라 음속이 295 m/s까지 내려갑니다. 기온차 슬라이더를 더 내리면 더 쉬워집니다.',
        check: ({ P }) => P.V <= 300 && machOf(P) >= 1
      },
      {
        id: 'heat', title: '열 장벽 체험하기',
        desc: '정체점 온도를 300 °C 이상으로 올려 보세요 — 알루미늄으로는 만들 수 없는 영역입니다(SR-71이 티타늄인 이유).',
        hint: 'T₀ = T(1 + 0.2M²). 마하 3 근처면 됩니다.',
        check: ({ P }) => stagT(P) - 273.15 >= 300
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const T = tempOf(p), a = sonic(p), M = machOf(p), r = regOf(M);

      /* ── 비행기와 충격파 ── */
      const cy = h * .28, x0 = 40, pw = w - 80;
      const px = x0 + st.x * pw;
      // 음속으로 퍼지는 압력 신호(파면)
      ctx.save();
      ctx.beginPath(); ctx.rect(x0 - 10, 26, pw + 20, h * .44); ctx.clip();
      for (let k = 0; k < 7; k++) {
        const age = ((st.t * .5 + k * .18) % 1.26);
        const emitX = px - p.V * age * (pw / 2200) * 2.2;
        const rr = a * age * (pw / 2200) * 2.2;
        if (rr < 2) continue;
        ctx.strokeStyle = 'rgba(200,211,239,' + clamp(.35 - age * .22, 0, .35) + ')';
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(emitX, cy, rr, 0, 7); ctx.stroke();
      }
      ctx.restore();
      // 마하콘
      if (M > 1) {
        const mu = Math.asin(1 / M);
        ctx.save();
        ctx.strokeStyle = hl === 'M' ? 'rgba(251,113,133,1)' : 'rgba(251,113,133,.7)';
        ctx.lineWidth = 2.6;
        [-1, 1].forEach(s => {
          ctx.beginPath(); ctx.moveTo(px, cy);
          ctx.lineTo(px - pw * .8 * Math.cos(mu), cy + s * pw * .8 * Math.sin(mu));
          ctx.stroke();
        });
        ctx.restore();
        ctx.save(); ctx.strokeStyle = C.M; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(px, cy, 44, Math.PI - mu, Math.PI); ctx.stroke(); ctx.restore();
        D.text(ctx, 'μ = ' + fmt(coneDeg(p), 1) + '°', px - 60, cy - 10,
          { size: 11, color: hl === 'M' ? '#fff' : C.M, align: 'right', bold: true });
      }
      // 기체
      ctx.save();
      ctx.translate(px, cy);
      const nose = M > 1 ? 30 : 20;
      D.poly(ctx, [[nose, 0], [-26, -5], [-30, 0], [-26, 5]],
        { fill: 'rgba(200,211,239,.45)', stroke: '#c8d3ef', width: 1.6 });
      const sw = M > 1.2 ? 16 : 26;
      D.poly(ctx, [[-4, 0], [-20, -sw], [-26, -sw], [-10, 0]], { fill: 'rgba(200,211,239,.35)', stroke: '#c8d3ef', width: 1.2 });
      D.poly(ctx, [[-4, 0], [-20, sw], [-26, sw], [-10, 0]], { fill: 'rgba(200,211,239,.35)', stroke: '#c8d3ef', width: 1.2 });
      ctx.restore();
      // 기수 가열
      const T0C = stagT(p) - 273.15;
      if (T0C > 100) {
        const hot = clamp((T0C - 100) / 900, 0, 1);
        ctx.save();
        const g = ctx.createRadialGradient(px + nose, cy, 0, px + nose, cy, 16 + hot * 22);
        g.addColorStop(0, 'rgba(255,' + Math.round(220 - 170 * hot) + ',120,' + (.4 + .5 * hot) + ')');
        g.addColorStop(1, 'rgba(251,113,133,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px + nose, cy, 16 + hot * 22, 0, 7); ctx.fill();
        ctx.restore();
        D.tag(ctx, 'T₀ = ' + fmt(T0C, 0) + ' °C', px + nose + 36, cy - 26, C.T0, hl === 'T0');
      }
      D.arrow(ctx, px + nose + 6, cy + 26, clamp(14 + p.V * .022, 14, 54), 0,
        { color: C.V, width: 2.6, head: 7, hot: hl === 'V' });
      D.text(ctx, fmt(p.V, 0) + ' m/s (' + fmt(p.V * 3.6, 0) + ' km/h)', px + nose + 6, cy + 46,
        { size: 10, color: hl === 'V' ? '#fff' : C.V });
      D.tag(ctx, 'M = ' + fmt(M, 3) + '  ·  ' + r[2], w * .5, 36, r[3], true);

      /* ── 고도-온도-음속 그림 ── */
      const ax = 56, ay = h * .50, aw = 150, ah = Math.min(h * .36, 170);
      D.text(ctx, '표준대기', ax, ay - 10, { size: 10.5, color: '#61719a' });
      D.roundRect(ctx, ax, ay, aw, ah, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      const AY = hh => ay + ah - hh / 20 * ah;
      // 기온 곡선
      ctx.save(); ctx.strokeStyle = C.alt; ctx.lineWidth = 2; ctx.beginPath();
      for (let hh = 0; hh <= 20; hh += .5) {
        const TT = (hh < 11 ? 288.15 - 6.5 * hh : 216.65) + p.Tdel;
        const X = ax + (TT - 200) / 110 * aw;
        hh === 0 ? ctx.moveTo(X, AY(hh)) : ctx.lineTo(X, AY(hh));
      }
      ctx.stroke(); ctx.restore();
      D.line(ctx, ax, AY(11), ax + aw, AY(11), { color: 'rgba(147,162,196,.3)', dash: [3, 4] });
      D.text(ctx, '대류권계면 11 km', ax + 4, AY(11) - 5, { size: 8.5, color: '#93a2c4' });
      ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      D.dot(ctx, ax + (T - 200) / 110 * aw, AY(p.alt), 5, '#fff', true); ctx.restore();
      D.text(ctx, '0 km', ax - 4, AY(0) + 4, { size: 8.5, color: '#4b5a80', align: 'right' });
      D.text(ctx, '20 km', ax - 4, AY(20) + 4, { size: 8.5, color: '#4b5a80', align: 'right' });
      D.text(ctx, '기온 →', ax + aw, ay + ah + 14, { size: 8.5, color: '#4b5a80', align: 'right' });
      D.text(ctx, fmt(T - 273.15, 1) + ' °C  →  a = ' + fmt(a, 1) + ' m/s',
        ax, ay + ah + 32, { size: 11, color: hl === 'a' ? '#fff' : C.a, bold: true });

      /* ── 마하 영역 띠 ── */
      const mx = ax + aw + 50, my = ay + 10, mw = Math.min(w - mx - 44, 330);
      if (mw > 180) {
        D.text(ctx, '비행 영역', mx, my - 12, { size: 10.5, color: '#61719a' });
        const MLO = 0, MHI = 8;
        const MX = m => mx + mw * clamp((m - MLO) / (MHI - MLO), 0, 1);
        REG.forEach((rr, i) => {
          const A = MX(rr[0]), B = MX(Math.min(rr[1], MHI));
          ctx.save();
          if (rr === r) { ctx.shadowColor = rr[3]; ctx.shadowBlur = 14; }
          ctx.fillStyle = rr[3]; ctx.globalAlpha = rr === r ? .55 : .2;
          ctx.fillRect(A, my, Math.max(2, B - A), 20); ctx.restore();
          if (B - A > 28) D.text(ctx, rr[2].split(' ')[0], (A + B) / 2, my + (i % 2 ? 34 : -4),
            { size: 8.5, color: rr === r ? rr[3] : '#4b5a80', align: 'center', bold: rr === r });
        });
        D.line(ctx, MX(1), my - 6, MX(1), my + 26, { color: '#fff', width: 2 });
        D.text(ctx, 'M = 1', MX(1), my + 48, { size: 9.5, color: '#e8eefc', align: 'center' });
        ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
        D.dot(ctx, MX(M), my + 10, 6, '#fff', true); ctx.restore();
        [0, 2, 4, 6, 8].forEach(m => D.text(ctx, m + '', MX(m), my + 62, { size: 8.5, color: '#4b5a80', align: 'center' }));
        // 정체점 온도 곡선
        const ty = my + 86, th = Math.min(h - ty - 30, 70);
        if (th > 36) {
          D.text(ctx, '정체점 온도 — 마하수의 제곱으로 오른다', mx, ty - 8, { size: 10, color: '#61719a' });
          ctx.save(); ctx.strokeStyle = C.T0; ctx.lineWidth = 2; ctx.beginPath();
          for (let m = 0; m <= MHI; m += .1) {
            const t0 = T * (1 + .2 * m * m) - 273.15;
            const X = MX(m), Y = ty + th - clamp(t0 / 3000, 0, 1) * th;
            m === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
          }
          ctx.stroke(); ctx.restore();
          [[660, '알루미늄 녹음'], [1668, '티타늄 녹음']].forEach(([tt, lab]) => {
            const Y = ty + th - clamp(tt / 3000, 0, 1) * th;
            D.line(ctx, mx, Y, mx + mw, Y, { color: 'rgba(251,113,133,.35)', dash: [3, 3] });
            D.text(ctx, lab, mx + 4, Y - 4, { size: 8.5, color: 'rgba(251,113,133,.8)' });
          });
          D.dot(ctx, MX(M), ty + th - clamp(T0C / 3000, 0, 1) * th, 4.5, C.T0, true);
        }
      }
    }
  });
})();
