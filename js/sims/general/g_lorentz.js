/* [일반물리·전자기학] 자기장 속 전하의 운동 — F = qv×B
   자기력은 속도에 항상 수직이라 일을 하지 않는다. 속력은 그대로 두고 방향만
   계속 꺾으므로 궤적이 원이 되고, 자기장 방향 속도 성분은 건드리지 않으므로
   전체로 보면 나선이 된다. 놀라운 것은 회전 주기 T = 2πm/qB가 속도와 전혀
   무관하다는 점이다 — 사이클로트론 가속기가 가능한 이유이고, 오로라와
   질량분석기, 토카막 핵융합로가 모두 이 한 식 위에 서 있다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { v: '#fb7185', B: '#5eead4', ang: '#a78bfa', pt: '#fbbf24',
              r: '#60a5fa', T: '#f472b6', F: '#fb923c' };
  const E = 1.602176634e-19;
  const PARTS = [
    { n: '전자', q: -E, m: 9.1093837e-31, c: '#60a5fa' },
    { n: '양성자', q: E, m: 1.67262192e-27, c: '#fb7185' },
    { n: '알파 입자', q: 2 * E, m: 6.6446573e-27, c: '#fbbf24' }
  ];
  const partOf = p => PARTS[clamp(Math.round(p.pt), 0, 2)];
  const vOf = p => p.v * 1e6;                                  // m/s
  const Bof = p => p.B * 1e-3;                                 // T
  const vperp = p => vOf(p) * Math.sin(p.ang * Math.PI / 180);
  const vpar = p => vOf(p) * Math.cos(p.ang * Math.PI / 180);
  const radOf = p => { const q = partOf(p); return q.m * vperp(p) / (Math.abs(q.q) * Bof(p)); };   // m
  const perOf = p => { const q = partOf(p); return 2 * Math.PI * q.m / (Math.abs(q.q) * Bof(p)); }; // s
  const fcOf = p => 1 / perOf(p);
  const pitchOf = p => vpar(p) * perOf(p);
  const forceOf = p => Math.abs(partOf(p).q) * vperp(p) * Bof(p);
  const keOf = p => .5 * partOf(p).m * vOf(p) * vOf(p) / E;    // eV

  PS.register({
    id: 'g-lorentz', mode: 'general', category: '전자기학',
    title: '자기장 속 전하의 운동',
    sub: 'F = qv×B,  T = 2πm/qB',
    tagline: '자기력은 속도에 항상 수직이라 일을 하지 않습니다 — 속력은 그대로 두고 방향만 꺾죠. 그래서 궤적이 원이 되고, 놀랍게도 그 주기는 속도와 아무 상관이 없습니다.',

    params: [
      { key: 'pt', symbol: 'q/m', label: '입자 (0전자 1양성자 2알파)', unit: '', min: 0, max: 2, step: 1, value: 0, color: C.pt, dec: 0, reset: true,
        where: '날아가는 <b>입자의 종류</b>입니다. 반지름도 주기도 질량/전하 비(m/q)로만 정해지므로, 이 비가 다르면 궤적이 갈라집니다 — <b>질량분석기</b>가 바로 이 원리입니다.' },
      { key: 'v', symbol: 'v', label: '속력', unit: '×10⁶ m/s', min: .2, max: 20, step: .2, value: 2, color: C.v, dec: 1, reset: true,
        where: '입자의 <b>속력</b>입니다. 반지름은 속력에 비례해 커지지만, <b>주기는 전혀 변하지 않습니다</b> — 빨라진 만큼 더 큰 원을 돌기 때문입니다.' },
      { key: 'B', symbol: 'B', label: '자기장 세기', unit: 'mT', min: 1, max: 200, step: 1, value: 20, color: C.B, dec: 0, reset: true,
        where: '화면 <b>가로 방향으로 걸린 자기장</b>(청록 선)입니다. 셀수록 더 세게 꺾여 반지름이 작아지고 회전이 빨라집니다.' },
      { key: 'ang', symbol: 'θ', label: 'v와 B가 이루는 각', unit: '°', min: 0, max: 90, step: 1, value: 70, color: C.ang, dec: 0, reset: true,
        where: '속도와 자기장이 이루는 각입니다. 90°면 <b>완전한 원</b>, 0°면 자기력이 아예 없어 <b>직진</b>하고, 그 사이면 <b>나선</b>이 됩니다 — 오로라가 자기력선을 타고 극지방으로 쏟아지는 모습입니다.' }
    ],
    vars: {
      r: { symbol: 'r', label: '회전 반지름', unit: 'mm', color: C.r,
        where: '나선의 <b>굵기</b>(오른쪽 단면도의 원 반지름)입니다. r = mv⊥/qB 로, 운동량이 크고 자기장이 약할수록 큽니다.' },
      T: { symbol: 'T', label: '회전 주기', unit: 's', color: C.T,
        where: '한 바퀴 도는 데 걸리는 시간입니다. <b>속도와 무관</b>하다는 것이 핵심 — 그래서 가속기에서 전압을 일정한 주파수로 걸어 줄 수 있습니다.' },
      F: { symbol: 'F', label: '자기력', unit: 'N', color: C.F,
        where: '입자가 받는 <b>로런츠 힘</b>(주황 화살표)입니다. 항상 속도와 자기장 둘 다에 수직이고, 속도에 수직이라 <b>일을 하지 않습니다</b>(속력 불변).' }
    },
    formulas: [
      { name: '로런츠 힘', tpl: '{F} = |q|{v}{B} sin{ang}' },
      { name: '회전 반지름', tpl: '{r} = m{v}⊥ ⁄ (|q|{B})' },
      { name: '회전 주기 — 속도와 무관!', tpl: '{T} = 2πm ⁄ (|q|{B})' },
      { name: '나선의 피치', tpl: 'p = {v}∥ · {T}' }
    ],

    init(p) { return { ph: 0, z: 0, trail: [], done: false }; },
    step(st, p, dt) {
      // 실제 주기는 ns~µs라 화면에서는 일정한 시각 속도로 돌린다(수치는 측정값 참조)
      const rev = 1.1;                       // 초당 회전 수
      st.ph += rev * 2 * Math.PI * dt;
      st.z += (pitchOf(p) / Math.max(radOf(p), 1e-12)) * rev * dt;   // 반지름 단위의 전진량
      st.trail.push([st.z, st.ph]);
      if (st.trail.length > 900) st.trail.shift();
      if (st.t > 14) st.done = true;
    },

    graphs: [{
      title: '수직면 위치 — 원운동 (y, z 성분)', xmin: 4, window: 7,
      series: [
        { key: 'py', label: 'y (mm)', color: C.r },
        { key: 'pz', label: 'z (mm)', color: '#a78bfa' }
      ]
    }],
    sample(st, p) {
      const r = radOf(p) * 1000;
      return { py: r * Math.cos(st.ph), pz: r * Math.sin(st.ph) };
    },

    readouts(st, p) {
      const q = partOf(p), r = radOf(p), T = perOf(p), f = fcOf(p);
      return [
        { label: '입자', value: q.n, color: q.c },
        { label: '질량/전하 비 m/q', value: q.m / Math.abs(q.q) * 1e8, unit: '×10⁻⁸ kg/C', dec: 3, color: C.pt },
        { label: '회전 반지름 r', value: r * 1000, unit: 'mm', color: C.r, dec: r * 1000 < 1 ? 4 : 3 },
        { label: '회전 주기 T', value: T * 1e9, unit: 'ns', color: C.T, dec: T * 1e9 < 10 ? 3 : 1 },
        { label: '사이클로트론 진동수', value: f / 1e6, unit: 'MHz', color: C.T, dec: 2 },
        { label: '수직 속도 v⊥', value: vperp(p) / 1e6, unit: '×10⁶ m/s', dec: 2, color: C.v },
        { label: '평행 속도 v∥', value: vpar(p) / 1e6, unit: '×10⁶ m/s', dec: 2, color: C.ang },
        { label: '나선의 피치', value: pitchOf(p) * 1000, unit: 'mm', dec: 3, color: C.ang },
        { label: '자기력 F', value: forceOf(p), unit: 'N', color: C.F, dec: 20 },
        { label: '운동에너지', value: keOf(p), unit: 'eV', dec: 0, color: '#fb923c' },
        { label: '속력이 변하는가', wide: true, color: '#34d399',
          value: '변하지 않는다 — 힘이 속도에 수직이라 일을 하지 않는다' },
        { label: '궤적의 모양', wide: true, color: C.ang,
          value: p.ang >= 89 ? '완전한 원 (v가 B에 수직)' : (p.ang <= 1 ? '직진 (자기력이 0)' : '나선 — 돌면서 B 방향으로 전진') }
      ];
    },

    notes: [
      '<b>자기력은 절대 일을 하지 않습니다.</b> 항상 속도에 수직이기 때문입니다 — 그래서 자기장만으로는 입자를 "가속"시킬 수 없고, 방향만 바꿀 수 있습니다. 사이클로트론도 가속은 전기장이 하고 자기장은 되돌려 보내는 역할만 합니다.',
      '<b>주기가 속도와 무관한 것</b>이 이 현상의 가장 신기한 점입니다. 빨라지면 더 큰 원을 돌아 거리가 늘어나는데, 그 늘어나는 비율이 정확히 속력이 늘어나는 비율과 같습니다. 덕분에 가속기에 일정한 주파수의 전압만 걸어 주면 됩니다.',
      '<b>m/q 비가 다르면 반지름이 달라집니다.</b> 같은 속도로 쏘아 넣어도 입자마다 다른 원을 그리므로, 어디에 도달하는지를 보고 성분을 알아낼 수 있습니다 — <b>질량분석기</b>의 원리이고, 탄소 연대측정부터 도핑 검사까지 쓰입니다.',
      '<b>오로라</b>는 태양풍 입자가 지구 자기력선을 나선으로 타고 내려와 극지방 대기와 부딪혀 빛나는 것입니다. θ를 70° 근처로 두고 보면 그 나선이 보입니다 — 입자는 자기력선에 "묶여" 그 선을 따라갈 수밖에 없습니다.',
      '같은 원리로 <b>토카막 핵융합로</b>는 1억 도의 플라즈마를 자기장으로 가둡니다. 어떤 물질도 그 온도를 견딜 수 없으니, 벽에 닿지 않게 자기력선으로 묶어 두는 것 말고는 방법이 없습니다.'
    ],
    presets: [
      { name: '전자의 나선 (오로라)', set: { pt: 0, v: 2, B: 20, ang: 70 } },
      { name: '완전한 원 (θ = 90°)', set: { pt: 0, v: 2, B: 20, ang: 90 } },
      { name: '자기력 없음 (θ = 0°)', set: { pt: 0, v: 2, B: 20, ang: 0 } },
      { name: '양성자로 바꾸면 (반지름 1800배)', set: { pt: 1, v: 2, B: 20, ang: 90 } },
      { name: '속도만 2배 (주기는 그대로)', set: { pt: 0, v: 4, B: 20, ang: 90 } },
      { name: '강한 자기장 (200 mT)', set: { pt: 0, v: 2, B: 200, ang: 90 } }
    ],
    challenges: [
      {
        id: 'tiny', title: '반지름 0.1 mm 이하로 가두기',
        desc: '회전 반지름을 0.1 mm 아래로 줄여 보세요 — 플라즈마를 좁은 공간에 가두는 원리입니다.',
        hint: 'r = mv⊥/qB 입니다. 가벼운 입자(전자), 느린 속도, 강한 자기장.',
        check: ({ P }) => radOf(P) <= 1e-4
      },
      {
        id: 'freq', title: '사이클로트론 진동수 1 GHz',
        desc: '사이클로트론 진동수를 1,000 MHz 이상으로 올려 보세요 — 가속기의 전압 주파수를 여기에 맞춰야 합니다.',
        hint: 'f = qB/2πm 이므로 속도와 무관합니다. 가벼운 입자와 강한 자기장만이 답입니다.',
        check: ({ P }) => fcOf(P) >= 1e9
      },
      {
        id: 'helix', title: '길게 늘어난 나선 만들기',
        desc: '나선의 피치(한 바퀴에 전진하는 거리)가 반지름의 5배를 넘게 만들어 보세요 — 자기력선을 따라 멀리 가는 입자입니다.',
        hint: '피치 = v∥·T, 반지름 ∝ v⊥ 이므로 둘의 비는 2π/tanθ 입니다. 각도를 작게 하세요.',
        check: ({ P }) => P.ang > 0 && pitchOf(P) >= 5 * radOf(P)
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const q = partOf(p), r = radOf(p), pitch = pitchOf(p);
      const cy = h * .34;
      const R = clamp(h * .14, 26, 74);                    // 화면상의 회전 반지름
      const zScale = R;                                     // 반지름 1 → R px

      /* ── 자기장 ── */
      ctx.save();
      ctx.strokeStyle = hl === 'B' ? 'rgba(94,234,212,.75)' : 'rgba(94,234,212,.3)';
      ctx.lineWidth = hl === 'B' ? 1.8 : 1.2;
      for (let k = -2; k <= 2; k++) {
        const yy = cy + k * R * .55;
        ctx.beginPath(); ctx.moveTo(30, yy); ctx.lineTo(w * .70, yy); ctx.stroke();
      }
      ctx.restore();
      for (let k = -2; k <= 2; k++)
        D.arrow(ctx, w * .70 - 22, cy + k * R * .55, 22, 0, { color: C.B, width: 1.6, head: 6, hot: hl === 'B' });
      D.text(ctx, 'B = ' + fmt(p.B, 0) + ' mT →', 30, cy - R * 1.25,
        { size: 11.5, color: hl === 'B' ? '#fff' : C.B, bold: hl === 'B' });

      /* ── 나선 궤적 (비스듬히 본 투영) ── */
      const x0 = 52;
      const proj = (z, ph) => [x0 + z * zScale * .34, cy - R * Math.cos(ph) + z * zScale * .05];
      const depth = ph => (Math.sin(ph) + 1) / 2;             // 앞/뒤
      ctx.save();
      ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      const z0 = Math.max(0, st.z - 7.5);
      let prev = null;
      st.trail.forEach(([z, ph]) => {
        if (z < z0) { prev = null; return; }
        const pt = proj(z - z0, ph);
        if (prev) {
          ctx.strokeStyle = 'rgba(' + (q.c === '#60a5fa' ? '96,165,250' : q.c === '#fb7185' ? '251,113,133' : '251,191,36') +
            ',' + (.2 + .55 * depth(ph)) + ')';
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(pt[0], pt[1]); ctx.stroke();
        }
        prev = pt;
      });
      ctx.restore();
      // 현재 입자
      const cur = proj(st.z - z0, st.ph);
      ctx.save(); ctx.shadowColor = q.c; ctx.shadowBlur = 16;
      D.dot(ctx, cur[0], cur[1], 6, q.c, true); ctx.restore();
      // 속도 · 힘 벡터
      const vdir = [pitch > 0 ? .55 : 0, Math.sin(st.ph)];
      const vl = Math.hypot(vdir[0], vdir[1]) || 1;
      D.arrow(ctx, cur[0], cur[1], vdir[0] / vl * 34, vdir[1] / vl * 34,
        { color: C.v, width: 2.4, head: 7, hot: hl === 'v', label: 'v', ly: -10 });
      D.arrow(ctx, cur[0], cur[1], 0, Math.cos(st.ph) * 30,
        { color: C.F, width: 2.4, head: 7, hot: hl === 'F', label: 'F', lx: 14 });
      D.text(ctx, q.n, x0, cy + R * 1.5, { size: 11.5, color: q.c, bold: true });
      D.text(ctx, p.ang >= 89 ? '완전한 원' : (p.ang <= 1 ? '직진 — 자기력 0' : '나선 운동'),
        x0, cy + R * 1.5 + 17, { size: 10.5, color: C.ang });

      /* ── 단면도 (B 방향으로 본 모습) ── */
      const ox = w * .80, oy = cy;
      const cr = clamp(Math.min(w * .14, h * .17), 28, 66);
      if (ox + cr + 20 < w) {
        ctx.save();
        ctx.strokeStyle = 'rgba(147,162,196,.35)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(ox, oy, cr + 16, 0, 7); ctx.stroke(); ctx.restore();
        D.text(ctx, 'B 방향에서 본 모습', ox, oy - cr - 28, { size: 10.5, color: '#61719a', align: 'center' });
        // B는 화면 밖으로 나오는 방향 (⊙)
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
          const bx = ox + i * (cr + 2), by = oy + j * (cr + 2);
          if (Math.hypot(i, j) < .5) continue;
          ctx.save(); ctx.strokeStyle = 'rgba(94,234,212,.4)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.stroke(); ctx.restore();
          D.dot(ctx, bx, by, 1.4, 'rgba(94,234,212,.6)', false);
        }
        ctx.save();
        ctx.strokeStyle = q.c; ctx.lineWidth = 2; ctx.globalAlpha = .55;
        if (hl === 'r') { ctx.shadowColor = C.r; ctx.shadowBlur = 14; }
        ctx.beginPath(); ctx.arc(ox, oy, cr, 0, 7); ctx.stroke(); ctx.restore();
        D.dot(ctx, ox + cr * Math.sin(st.ph), oy - cr * Math.cos(st.ph), 5, q.c, true);
        D.dim(ctx, ox, oy, ox + cr, oy, 'r', C.r, hl === 'r');
        D.text(ctx, (r * 1000 < 1 ? fmt(r * 1e6, 1) + ' µm' : fmt(r * 1000, 3) + ' mm'),
          ox, oy + cr + 30, { size: 11, color: hl === 'r' ? '#fff' : C.r, align: 'center', bold: true });
      }

      /* ── 요약 ── */
      const T = perOf(p);
      D.text(ctx, 'T = ' + (T * 1e9 < 1000 ? fmt(T * 1e9, 2) + ' ns' : fmt(T * 1e6, 2) + ' µs') +
        '   (속도와 무관!)', 36, h - 40, { size: 12.5, color: hl === 'T' ? '#fff' : C.T, bold: true });
      D.text(ctx, '사이클로트론 진동수 ' + fmt(fcOf(p) / 1e6, 1) + ' MHz   ·   피치 ' + fmt(pitch * 1000, 3) + ' mm',
        36, h - 20, { size: 11, color: '#93a2c4' });
      D.text(ctx, '※ 화면 회전 속도는 보기 좋게 느리게 했습니다 (실제 주기는 위 값)',
        36, h - 4, { size: 9, color: '#4b5a80' });
    }
  });
})();
