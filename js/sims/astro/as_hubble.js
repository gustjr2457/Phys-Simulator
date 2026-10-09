/* [천문학·우주의 크기 재기] 허블 법칙 — 우주는 팽창한다
   v = H₀ d,  1 + z = λ_obs ⁄ λ_rest
   멀리 있는 은하일수록 더 빨리 멀어진다. 어느 은하에서 봐도 똑같이 그렇게 보이므로,
   이것은 "은하들이 날아가고 있다"가 아니라 "공간 자체가 늘어나고 있다"는 뜻이다.
   H₀의 역수는 곧 우주의 나이가 되는데 — 2025년 현재, 초기 우주에서 잰 값(Planck 67.4)과
   가까운 우주에서 잰 값(SH0ES 73.0)이 5σ 넘게 어긋나 있다. 이것이 '허블 텐션'이다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { H0: '#a78bfa', d: '#5eead4', v: '#fb7185', z: '#fbbf24' };
  const CLIGHT = 299792.458;             // km/s
  const MPC_KM = 3.0857e19;
  const GYR = 3.1557e16;                 // 1 Gyr [s]
  const LCDM = .955;                     // ΛCDM에서 나이 ≈ 0.955 / H₀
  // 은하 스펙트럼에서 실제로 쓰는 흡수선들 (정지 파장 nm)
  const LINES = [[393.4, 'Ca K'], [396.8, 'Ca H'], [434.0, 'Hγ'], [486.1, 'Hβ'], [589.0, 'Na D'], [656.3, 'Hα']];

  const vOf = p => p.H0 * p.d;                               // km/s
  const beta = p => clamp(vOf(p) / CLIGHT, 0, .995);
  const zOf = p => { const b = beta(p); return Math.sqrt((1 + b) / (1 - b)) - 1; };
  const hubbleTime = p => MPC_KM / p.H0 / GYR;               // 1/H₀ [Gyr]
  const ageOf = p => hubbleTime(p) * LCDM;                   // ΛCDM 우주 나이 [Gyr]
  const rnd = i => { const x = Math.sin(i * 91.37 + 17.3) * 43758.5453; return x - Math.floor(x); };

  PS.register({
    id: 'as-hubble', mode: 'astro', category: '우주의 크기 재기',
    title: '허블 법칙과 우주 팽창',
    sub: 'v = H₀d',
    tagline: '멀수록 빨리 멀어집니다 — 어느 은하에서 봐도 똑같이. 은하가 날아가는 게 아니라 공간이 늘어나고 있다는 뜻이고, 그 비율의 역수가 곧 우주의 나이입니다.',

    params: [
      { key: 'H0', symbol: 'H₀', label: '허블 상수', unit: 'km/s/Mpc', min: 50, max: 90, step: .1, value: 70, color: C.H0, dec: 1,
        where: '우주가 <b>얼마나 빨리 팽창하는가</b>입니다. 아래 허블 다이어그램에서 직선의 <b>기울기</b>이고, 역수는 우주의 나이가 됩니다. Planck 67.4 · SH0ES 73.0 — 이 둘이 어긋나는 것이 허블 텐션입니다.' },
      { key: 'd', symbol: 'd', label: '은하까지의 거리', unit: 'Mpc', min: 1, max: 2000, step: 1, value: 300, color: C.d, dec: 0,
        where: '관측하는 <b>은하까지의 거리</b>입니다(1 Mpc ≈ 326만 광년). 멀수록 후퇴 속도가 비례해서 커지고, 스펙트럼선이 더 많이 붉은 쪽으로 밀립니다.' }
    ],
    vars: {
      v: { symbol: 'v', label: '후퇴 속도', unit: 'km/s', color: C.v,
        where: '은하가 <b>멀어지는 속도</b>입니다. 위 그림의 화살표 길이이자 허블 다이어그램의 세로축입니다.' },
      z: { symbol: 'z', label: '적색편이', unit: '', color: C.z,
        where: '스펙트럼선이 <b>얼마나 붉은 쪽으로 밀렸는가</b>입니다. z = 0.1이면 모든 파장이 10% 길어집니다 — 실제로 측정하는 값은 속도가 아니라 이것입니다.' }
    },
    formulas: [
      { name: '허블 법칙', tpl: '{v} = {H0} · {d}' },
      { name: '적색편이의 정의', tpl: '1 + {z} = λ_관측 ⁄ λ_정지' },
      { name: '허블 시간 (우주 나이의 대략)', tpl: 't_H = 1 ⁄ {H0}' },
      { name: 'ΛCDM에서의 우주 나이', tpl: 't ≈ 0.955 ⁄ {H0}' }
    ],

    init(p) { return { obs: [], done: false }; },
    step(st, p, dt) {
      // 은하를 하나씩 관측해 허블 다이어그램을 쌓아 간다 (허블이 1929년에 한 일)
      const n = Math.floor(st.t / .32);
      while (st.obs.length < n && st.obs.length < 90) {
        const k = st.obs.length;
        const dd = 30 + rnd(k) * 1950;
        st.obs.push({ d: dd, s: (rnd(k + 31) + rnd(k + 71) - 1) * .13 });   // s: 고유운동에 의한 흩어짐
      }
      if (st.t > 36) st.done = true;
    },

    readouts(st, p) {
      const v = vOf(p), z = zOf(p), tH = hubbleTime(p), age = ageOf(p);
      const planck = MPC_KM / 67.4 / GYR * LCDM, shoes = MPC_KM / 73.04 / GYR * LCDM;
      return [
        { label: '후퇴 속도 v', value: v, unit: 'km/s', color: C.v, dec: 0 },
        { label: '광속의 몇 %', value: beta(p) * 100, unit: '%', color: C.v, dec: 1 },
        { label: '적색편이 z', value: z, unit: '', color: C.z, dec: 4 },
        { label: 'Hα선 관측 파장', value: 656.3 * (1 + z), unit: 'nm', color: C.z, dec: 1 },
        { label: '거리 (광년)', value: p.d * 3.2616e6 / 1e6, unit: '백만 광년', color: C.d, dec: 0 },
        { label: '빛이 날아온 시간 (대략)', value: p.d * 3.2616e6 / 1e9, unit: '십억 년', dec: 2, color: '#93a2c4' },
        { label: '허블 시간 1/H₀', value: tH, unit: '십억 년', color: C.H0, dec: 2 },
        { label: '우주 나이 (ΛCDM)', value: age, unit: '십억 년', color: C.H0, dec: 2 },
        { label: 'Planck(67.4)로 계산한 나이', value: planck, unit: '십억 년', dec: 2, color: '#60a5fa' },
        { label: 'SH0ES(73.0)로 계산한 나이', value: shoes, unit: '십억 년', dec: 2, color: '#fb7185' },
        { label: '두 값의 나이 차이', value: planck - shoes, unit: '십억 년', dec: 2, wide: true, color: '#fbbf24' },
        { label: '관측한 은하', value: st.obs.length, unit: '개', dec: 0, color: '#93a2c4' }
      ];
    },

    notes: [
      '<b>"멀수록 빨리 멀어진다"는 중심이 있다는 뜻이 아닙니다.</b> 건포도 빵이 부풀 때 어느 건포도에서 봐도 다른 건포도들이 거리에 비례해 멀어집니다 — 우주도 똑같아서, 어느 은하에 있든 자기가 중심인 것처럼 보입니다.',
      '은하가 공간 속을 날아가는 것이 아니라 <b>공간 자체가 늘어납니다.</b> 그래서 충분히 먼 은하는 <b>빛보다 빨리</b> 멀어질 수도 있습니다 — 상대성이론 위반이 아닙니다. 공간 속에서의 속도만 c를 못 넘을 뿐입니다.',
      '적색편이는 "은하가 도망가서 생긴 도플러 효과"라기보다 <b>빛이 날아오는 동안 공간이 늘어나 파장이 같이 늘어난 것</b>입니다. 가까운 은하에서는 두 해석이 같은 답을 주지만, 먼 은하에서는 후자가 맞습니다.',
      '<b>H₀의 역수가 곧 우주의 나이</b>가 되는 이유는 간단합니다 — 속도 v로 거리 d만큼 벌어지는 데 걸린 시간이 d/v = 1/H₀이기 때문입니다. 팽창 속도가 변해 왔으므로 정확한 값은 0.955/H₀ 정도입니다.',
      '<b>허블 텐션(2025년 현재 미해결).</b> 초기 우주(우주배경복사)에서 계산한 값은 67.4 ± 0.5, 가까운 우주(세페이드+Ia형 초신성)에서 직접 잰 값은 73.0 ± 1.0으로 5σ 넘게 어긋납니다. 중간값(적색거성끝 70.4, 중력렌즈 퀘이사 72.1)도 나와 결론이 안 났습니다. 측정 오류이거나, 아니면 표준우주모형에 빠진 것이 있다는 뜻입니다.',
      '허블의 1929년 원래 데이터는 H₀ ≈ 500이었습니다 — 거리 눈금이 틀렸기 때문입니다. <b>거리 사다리의 아래 칸이 흔들리면 H₀가 통째로 흔들립니다.</b>'
    ],
    presets: [
      { name: '기본 (H₀ = 70)', set: { H0: 70, d: 300 } },
      { name: 'Planck — 초기 우주 (67.4)', set: { H0: 67.4, d: 300 } },
      { name: 'SH0ES — 가까운 우주 (73.0)', set: { H0: 73, d: 300 } },
      { name: '우주 나이 138억 년에 맞추기', set: { H0: 67.7, d: 300 } },
      { name: '아주 먼 은하 (z ≈ 0.5)', set: { H0: 70, d: 1700 } },
      { name: '처녀자리 은하단 (16.5 Mpc)', set: { H0: 70, d: 17 } }
    ],
    challenges: [
      {
        id: 'z01', title: '적색편이 0.1 만들기',
        desc: '모든 파장이 10% 길어지는 z = 0.1 이상의 은하를 관측해 보세요.',
        hint: 'z ≈ v/c 이므로 후퇴 속도가 약 3만 km/s 필요합니다. 거리를 400 Mpc 넘게 올리세요.',
        check: ({ P }) => zOf(P) >= .1
      },
      {
        id: 'age', title: '우주 나이를 138억 년에 맞추기',
        desc: '우주 나이(ΛCDM)가 13.6 ~ 14.0 십억 년이 되는 H₀를 찾아 보세요 — 관측된 가장 오래된 별들과 맞아떨어지는 범위입니다.',
        hint: '나이 ≈ 0.955/H₀ 입니다. 측정값 칸의 "우주 나이"를 보며 H₀를 조절하세요. Planck 값 근처입니다.',
        check: ({ P }) => { const a = ageOf(P); return a >= 13.6 && a <= 14.0; }
      },
      {
        id: 'fast', title: '광속의 30%로 멀어지는 은하',
        desc: '후퇴 속도가 광속의 30%를 넘는 은하를 관측해 보세요. 이래도 상대성이론은 깨지지 않습니다 — 왜일까요?',
        hint: '거리를 최대 가까이, H₀도 높게. 은하가 공간 속을 달리는 것이 아니라 공간이 늘어나는 것이기 때문입니다.',
        check: ({ P }) => beta(P) >= .3
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const v = vOf(p), z = zOf(p);

      /* ── 팽창하는 우주 ── */
      const ux = 44, uy = 50, uw = Math.min(w * .44, 290), uh = Math.min(h * .30, 170);
      const ocx = ux + uw / 2, ocy = uy + uh / 2;
      D.text(ctx, '팽창하는 우주 — 어느 은하에서 봐도 똑같다', ux, uy - 9, { size: 10.5, color: '#61719a' });
      D.roundRect(ctx, ux, uy, uw, uh, 6); ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fill();
      const phase = (st.t * .1) % 1;
      const a = 1 + .5 * phase;
      const fade = clamp(Math.min(phase, 1 - phase) / .12, 0, 1);
      ctx.save();
      ctx.beginPath(); D.roundRect(ctx, ux, uy, uw, uh, 6); ctx.clip();
      ctx.globalAlpha = fade;
      for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) {
        if (!i && !j) continue;
        const jx = (rnd(i * 13 + j * 7) - .5) * 12, jy = (rnd(i * 29 + j * 3) - .5) * 12;
        const cx0 = i * 40 + jx, cy0 = j * 34 + jy;
        const X = ocx + cx0 * a, Y = ocy + cy0 * a;
        const r0 = Math.hypot(cx0, cy0);
        ctx.save();
        ctx.translate(X, Y); ctx.rotate(rnd(i * 5 + j) * 3);
        ctx.fillStyle = 'rgba(200,211,239,.5)';
        ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 2.6, 0, 0, 7); ctx.fill();
        ctx.restore();
        // 후퇴 속도 화살표 (거리에 비례)
        if (r0 > 1) {
          const ux2 = cx0 / r0, uy2 = cy0 / r0;
          D.arrow(ctx, X + ux2 * 7, Y + uy2 * 7, ux2 * r0 * .22, uy2 * r0 * .22,
            { color: 'rgba(251,113,133,.7)', width: 1.6, head: 5 });
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      // 우리 은하
      ctx.save(); ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
      D.dot(ctx, ocx, ocy, 4.5, '#fbbf24', true); ctx.restore();
      D.text(ctx, '우리', ocx, ocy + 17, { size: 9, color: '#fbbf24', align: 'center' });
      D.text(ctx, '화살표 길이 ∝ 거리', ux + 5, uy + uh - 7, { size: 9, color: '#4b5a80' });

      /* ── 스펙트럼 ── */
      const sx = ux + uw + 34, sy = uy;
      const sw = Math.max(170, w - sx - 44);
      if (sw > 150) {
        const L0 = 370, L1 = 780;
        const SX = l => sx + clamp((l - L0) / (L1 - L0), 0, 1) * sw;
        D.text(ctx, '은하의 스펙트럼 — 선 무늬 전체가 통째로 밀린다', sx, sy - 9, { size: 10.5, color: '#61719a' });
        [[0, '정지 상태 (실험실)'], [1, '관측된 이 은하']].forEach(([row, lab]) => {
          const yy = sy + row * 46;
          // 연속 스펙트럼 띠
          for (let l = L0; l <= L1; l += 4) {
            let r = 0, g = 0, b = 0;
            if (l < 440) { r = -(l - 440) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; }
            else if (l < 510) { g = 1; b = -(l - 510) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; }
            else if (l < 645) { r = 1; g = -(l - 645) / 65; } else { r = 1; }
            ctx.fillStyle = 'rgba(' + (r * 255 | 0) + ',' + (g * 255 | 0) + ',' + (b * 255 | 0) + ',.5)';
            ctx.fillRect(SX(l), yy, Math.max(1, SX(l + 4) - SX(l)) + .5, 30);
          }
          // 흡수선
          LINES.forEach(([l0, nm]) => {
            const l = row ? l0 * (1 + z) : l0;
            if (l > L1) return;
            ctx.save();
            if (row && hl === 'z') { ctx.shadowColor = C.z; ctx.shadowBlur = 8; }
            ctx.fillStyle = '#0a1120'; ctx.fillRect(SX(l) - 1.4, yy, 2.8, 30); ctx.restore();
            if (nm === 'Hα') D.text(ctx, nm, SX(l), yy + 41, { size: 8.5, color: row ? C.z : '#93a2c4', align: 'center' });
          });
          D.text(ctx, lab, sx, yy - 3, { size: 9.5, color: row ? C.z : '#93a2c4' });
        });
        // 이동량 표시
        const l0 = 656.3;
        if (l0 * (1 + z) <= L1 && SX(l0 * (1 + z)) - SX(l0) > 6) {
          D.arrow(ctx, SX(l0), sy + 96, SX(l0 * (1 + z)) - SX(l0), 0,
            { color: C.z, width: 2, head: 7, hot: hl === 'z' });
          D.text(ctx, '적색편이 z = ' + fmt(z, 4), (SX(l0) + SX(l0 * (1 + z))) / 2, sy + 112,
            { size: 10.5, color: hl === 'z' ? '#fff' : C.z, align: 'center', bold: true });
        }
      }

      /* ── 허블 다이어그램 ── */
      const gx = 60, gy = Math.max(uy + uh + 56, h - 210), gw = Math.min(w - 120, 520), gh = Math.min(h - gy - 46, 150);
      if (gh > 60) {
        D.roundRect(ctx, gx, gy, gw, gh, 6); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
        D.text(ctx, '허블 다이어그램 — 관측한 은하들', gx + 4, gy - 8, { size: 10.5, color: '#61719a' });
        const DMAX = 2000, VMAX = 90 * DMAX;
        const GX = dd => gx + clamp(dd / DMAX, 0, 1) * gw;
        const GY = vv => gy + gh - clamp(vv / VMAX, 0, 1) * gh;
        // Planck ~ SH0ES 띠
        ctx.save(); ctx.fillStyle = 'rgba(167,139,250,.10)';
        ctx.beginPath(); ctx.moveTo(GX(0), GY(0));
        ctx.lineTo(GX(DMAX), GY(67.4 * DMAX)); ctx.lineTo(GX(DMAX), GY(73.04 * DMAX)); ctx.closePath(); ctx.fill(); ctx.restore();
        [[67.4, '#60a5fa', 'Planck 67.4'], [73.04, '#fb7185', 'SH0ES 73.0']].forEach(([H, cc, lab]) => {
          D.line(ctx, GX(0), GY(0), GX(DMAX), GY(H * DMAX), { color: cc, width: 1.2, dash: [4, 4] });
          D.text(ctx, lab, GX(DMAX) - 4, GY(H * DMAX) + (H > 70 ? 13 : -5), { size: 9, color: cc, align: 'right' });
        });
        // 관측점
        st.obs.forEach(o => D.dot(ctx, GX(o.d), GY(p.H0 * o.d * (1 + o.s)), 2.6, 'rgba(232,238,252,.7)', false));
        // 현재 H₀ 직선
        ctx.save(); if (hl === 'H0') { ctx.shadowColor = C.H0; ctx.shadowBlur = 14; }
        D.line(ctx, GX(0), GY(0), GX(DMAX), GY(p.H0 * DMAX), { color: C.H0, width: 2.4 }); ctx.restore();
        // 현재 은하
        ctx.save(); ctx.shadowColor = C.v; ctx.shadowBlur = 14;
        D.dot(ctx, GX(p.d), GY(v), 5, C.v, true); ctx.restore();
        D.text(ctx, fmt(v, 0) + ' km/s', GX(p.d) + 8, GY(v) - 6,
          { size: 10.5, color: hl === 'v' ? '#fff' : C.v, bold: true });
        D.text(ctx, '거리 (Mpc) →', gx + gw, gy + gh + 15, { size: 9, color: '#61719a', align: 'right' });
        D.text(ctx, '후퇴 속도', gx + 4, gy + 13, { size: 9, color: '#61719a' });
        D.text(ctx, 'H₀ = ' + fmt(p.H0, 1) + '  →  우주 나이 ' + fmt(ageOf(p), 2) + ' 십억 년',
          gx, gy + gh + 34, { size: 12, color: hl === 'H0' ? '#fff' : C.H0, bold: true });
      }
    }
  });
})();
