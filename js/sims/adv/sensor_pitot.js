/* [공학응용·센서와 계측] 피토관과 대기속도계 — Δp = ½ρV², V_i = √(2Δp/ρ₀)
   앞을 향한 구멍(전압 p₀)과 옆 구멍(정압 p)의 압력 차가 동압 ½ρV² 이다(비압축 베르누이, M < 0.3 범위로 슬라이더를 묶음).
   계기는 해면 밀도 ρ₀ 로 눈금을 매기므로, 공기가 묽은 높은 곳에서는 실제 속도 V 보다 느리게 읽는다: V_i = V·√(ρ/ρ₀).
   공기 밀도는 국제 표준 대기(ISA): 11 km 까지 기온이 1 km 에 6.5 K 씩 내려가고, 그 위는 216.65 K 로 일정. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { V: PAL.steel, h: PAL.violet, rho: PAL.teal, dp: PAL.amber, Vi: PAL.sage, d: PAL.dusty };

  const G0 = 9.80665, RAIR = 287.053, RHO0 = 1.225, RHOW = 1000, KN = 1.943844;
  // 국제 표준 대기 — 기온 T(K), 기압 p(Pa), 밀도 ρ(kg/m³)
  function isa(h) {
    if (h <= 11000) {
      const T = 288.15 - .0065 * h, p = 101325 * Math.pow(T / 288.15, G0 / (RAIR * .0065));
      return { T, p, rho: p / (RAIR * T) };
    }
    const T = 216.65, p11 = 101325 * Math.pow(T / 288.15, G0 / (RAIR * .0065));
    const p = p11 * Math.exp(-G0 * (h - 11000) / (RAIR * T));
    return { T, p, rho: p / (RAIR * T) };
  }
  const dpOf = p => .5 * isa(p.h).rho * p.V * p.V;                 // 동압 = 피토관이 재는 압력 차 (Pa)
  const viOf = p => Math.sqrt(2 * dpOf(p) / RHO0);                  // 계기 속도 (m/s)
  const dOf = p => dpOf(p) / (RHOW * G0) * 1000;                    // 물기둥 높이 차 (mm)
  const D_MAX = .5 * RHO0 * 100 * 100 / (RHOW * G0) * 1000;         // 슬라이더 끝(해면·100 m/s)의 물기둥 ≈ 624 mm

  // 공기 알갱이 — 위치를 0~1 비율로 두고 그릴 때 화면에 맞춘다. 가운데 줄은 코끝에서 멈춘다(정체점)
  const UTIP = .42, NP = 30;
  const frac = x => x - Math.floor(x);

  PS.register({
    id: 'adv-pitot', mode: 'adv', category: '센서와 계측',
    title: '피토관과 대기속도계',
    sub: 'Δp = ½ρV²,  V_i = √(2Δp/ρ₀)',
    tagline: '비행기 코끝의 작은 관 하나로 속도를 잽니다. 바람이 미는 압력을 물기둥 높이로 읽고, 높이 올라가면 계기가 왜 실제보다 느리게 읽는지 확인합니다.',

    params: [
      { key: 'V', symbol: 'V', label: '실제 비행 속도 (진대기속도)', unit: 'm/s', min: 10, max: 100, step: 1, value: 50, color: C.V, dec: 0,
        where: '왼쪽에서 피토관으로 불어오는 <b>파란 공기 알갱이</b>의 빠르기와 위쪽 파란 화살표입니다. 비행기가 공기에 대해 실제로 움직이는 속도입니다.' },
      { key: 'h', symbol: 'h', label: '비행 고도', unit: 'm', min: 0, max: 12000, step: 100, value: 0, color: C.h, dec: 0,
        where: '높을수록 공기가 묽어집니다(<b>청록 ρ</b>가 작아짐). 오른쪽 계기 아래 보라색 글자로 고도가 표시됩니다.' }
    ],
    vars: {
      dp: { symbol: 'Δp', label: '동압 (피토관이 재는 압력 차)', unit: 'Pa', color: C.dp,
        where: '앞 구멍(전압 p₀)과 옆 구멍(정압 p)의 <b>압력 차</b>입니다. 아래 물기둥이 이 압력에 밀려 한쪽은 내려가고 한쪽은 올라갑니다.' },
      rho: { symbol: 'ρ', label: '지금 고도의 공기 밀도', unit: 'kg/m³', color: C.rho,
        where: '1 m³ 공기의 질량입니다. 해면 1.225에서 높이 올라갈수록 줄어, 같은 속도라도 <b>압력 차가 작아집니다</b>.' },
      Vi: { symbol: 'V_i', label: '계기 속도 (지시 대기속도)', unit: 'm/s', color: C.Vi,
        where: '오른쪽 <b>둥근 속도계의 초록 바늘</b>입니다. 압력 차를 해면 밀도 ρ₀ = 1.225로 나누어 계산하도록 눈금을 매겼습니다.' },
      d: { symbol: 'd', label: '물기둥 높이 차', unit: 'mm', color: C.d,
        where: '아래 U자 관(마노미터)에서 <b>두 물기둥의 높이 차</b>입니다. 압력 차가 클수록 벌어집니다.' }
    },
    formulas: [
      { name: '동압 (피토관이 재는 압력 차)', tpl: '{dp} = ½{rho}{V}²' },
      { name: '마노미터 (물기둥으로 읽기)', tpl: '{dp} = ρ_물 g {d}' },
      { name: '계기 속도 (해면 밀도로 눈금)', tpl: '{Vi} = √(2{dp} ⁄ ρ₀)' },
      { name: '실제 속도로 바꾸기', tpl: '{V} = {Vi} · √(ρ₀ ⁄ {rho})' }
    ],

    init() {
      const parts = [];
      for (let i = 0; i < NP; i++) {
        // 다섯 개에 하나는 가운데 줄(정체 흐름선), 나머지는 위아래로 고르게
        const center = i % 5 === 0;
        parts.push({ u: frac(i * .618034), s: center ? (i % 10 === 0 ? .03 : -.03) : (frac(i * .381966 + .13) * 2 - 1), c: center });
      }
      return { parts, sw: 0 };
    },
    step(st, p, dt) {
      // 알갱이 속도는 화면 기준 — 실제 속도에 비례하게 (10 m/s 도 보이게 바닥값)
      const sp = (.06 + .34 * p.V / 100) * dt;
      st.parts.forEach(q => {
        if (q.c) {
          q.u += sp * clamp((UTIP - q.u) / .1, .04, 1);           // 코끝에 다가가며 느려져 멈춘다
          if (q.u > UTIP - .006) q.u -= UTIP - .006;              // 멈춘 알갱이는 처음으로
        } else {
          q.u += sp;
          if (q.u >= 1) q.u -= 1;
        }
      });
      st.sw += dt / 6; if (st.sw >= 1) st.sw -= 1;               // 그래프: 6초마다 속도 10→100 m/s 를 훑는다
    },

    graphs: [
      { title: '속도에 따른 동압 (지금 고도와 해면)', xKey: 'vv', xUnit: 'm/s', xMin: 10, xMax: 100, y0: 0,
        series: [{ key: 'dpk', label: 'Δp 지금 고도 (kPa)', color: C.dp }, { key: 'dp0', label: '해면 (kPa)', color: PAL.ink3 }] }
    ],
    sample(st, p) {
      const vv = 10 + 90 * st.sw;
      return { vv, dpk: .5 * isa(p.h).rho * vv * vv / 1000, dp0: .5 * RHO0 * vv * vv / 1000 };
    },

    readouts(st, p) {
      const A = isa(p.h), dp = dpOf(p), vi = viOf(p), ratio = vi / p.V;
      const a = Math.sqrt(1.4 * RAIR * A.T), slow = (1 - ratio) * 100;
      return [
        { label: '실제 비행 속도 V', value: p.V, unit: 'm/s', color: C.V, dec: 0 },
        { label: '공기 밀도 ρ', value: A.rho, unit: 'kg/m³', color: C.rho, dec: 3 },
        { label: '동압 Δp = ½ρV²', value: dp, unit: 'Pa', color: C.dp, dec: 0 },
        { label: '물기둥 높이 차 d', value: dOf(p), unit: 'mm', color: C.d, dec: 0 },
        { label: '계기 속도 V_i', value: vi, unit: 'm/s', color: C.Vi, dec: 1 },
        { label: '계기 속도 (노트)', value: vi * KN, unit: 'kn', color: C.Vi, dec: 0 },
        { label: '계기 ÷ 실제 = √(ρ/ρ₀)', value: ratio, unit: '', dec: 3 },
        { label: '마하수 M (0.3 아래면 비압축 근사가 맞다)', value: p.V / a, unit: '', dec: 3 },
        { label: '읽는 법', wide: true, color: slow > 1 ? C.h : C.Vi,
          value: slow > 1 ? '공기가 묽어 계기가 실제보다 ' + fmt(slow, 0) + ' % 느리게 읽는다 (계기 ' + fmt(vi, 0) + ' m/s, 실제 ' + fmt(p.V, 0) + ' m/s)'
                          : '해면 근처라 계기 속도와 실제 속도가 거의 같다' }
      ];
    },

    notes: [
      '달리는 차 창밖으로 손바닥을 내밀면 바람이 손을 미는 압력이 느껴집니다. 빠를수록 세지요. 피토관은 그 압력으로 속도를 잽니다.',
      '앞을 향한 구멍에서는 공기가 멈추며 압력이 <b>½ρV²</b>만큼 올라갑니다(동압). 옆 구멍은 대기압만 잽니다. 두 압력의 차가 속도를 알려 줍니다.',
      '계기는 해면 공기 밀도로 눈금을 매깁니다. 높이 올라가 공기가 묽어지면 같은 속도라도 압력 차가 작아 <b>계기가 실제보다 느리게</b> 읽습니다.',
      '조종사에게는 이 계기 속도가 더 쓸모 있습니다. 날개의 양력도 같은 ½ρV²로 정해져서, <b>실속은 높이와 상관없이 같은 계기 속도</b>에서 일어납니다.',
      '구멍이 얼음이나 벌레로 막히면 속도계가 엉뚱한 값을 보여 줍니다. 그래서 여객기는 피토관을 여러 개 달고 전기로 데웁니다.'
    ],
    presets: [
      { name: '경비행기 순항 (해면, 50 m/s)', set: { V: 50, h: 0 } },
      { name: '같은 속도로 3,000 m', set: { V: 50, h: 3000 } },
      { name: '고도 9,000 m, 100 m/s', set: { V: 100, h: 9000 } },
      { name: '이륙 직전 (30 m/s)', set: { V: 30, h: 0 } }
    ],
    challenges: [
      {
        id: 'water300', title: '물기둥 300 mm',
        desc: '마노미터의 물기둥 높이 차를 300 mm(±5 mm)로 맞춰 보세요.',
        hint: 'd = Δp ⁄ (ρ_물 g) 입니다. 해면에서는 약 2,940 Pa, 즉 ½ × 1.225 × V² = 2,940 이 되는 속도를 찾아보세요.',
        check: ({ P }) => Math.abs(dOf(P) - 300) <= 5
      },
      {
        id: 'slow45', title: '계기가 45 % 느리게',
        desc: '30 m/s 이상으로 날면서, 계기 속도가 실제 속도의 55 % 이하로 읽히는 고도를 찾아보세요.',
        hint: '계기 ÷ 실제 = √(ρ ⁄ ρ₀) 입니다. ρ 가 해면의 0.3배 정도로 묽어지는 높이까지 올라가 보세요.',
        check: ({ P }) => P.V >= 30 && viOf(P) <= .55 * P.V
      },
      {
        id: 'stall25', title: '높은 곳에서도 실속은 계기 속도 25 m/s',
        desc: '실속 계기 속도가 25 m/s 인 글라이더가 고도 8,000 m 이상에서 계기 속도 25 m/s(±0.5)로 날게 해 보세요. 실제 속도는 얼마일까요?',
        hint: '양력도 ½ρV² 로 정해지므로 같은 계기 속도에서 실속합니다. 높은 곳에서는 실제 속도가 더 빨라야 합니다.',
        check: ({ P }) => P.h >= 8000 && Math.abs(viOf(P) - 25) <= .5
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600, small = h < 330;
      const A = isa(p.h), dp = dpOf(p), vi = viOf(p), dmm = dOf(p);

      /* ── 배치: 넓으면 [피토관 + 마노미터 | 속도계], 좁으면 위 피토관, 아래 [마노미터 | 속도계] ── */
      const pyR = narrow ? .2 : .26;
      const py = h * pyR;                                   // 피토관 높이
      const x0 = 10, xEnd = narrow ? w - 10 : w * .64;      // 공기 흐름 구역
      const tipX = x0 + (xEnd - x0) * UTIP, Lp = (xEnd - x0) * .44;
      const ay = Math.min(narrow ? 30 : 46, h * .11);        // 흐름 구역 반높이

      // 공기 알갱이 — 가운데 줄은 코끝에서 멈추고, 나머지는 코를 비켜 지나간다
      st.parts.forEach(q => {
        const X = x0 + q.u * (xEnd - x0);
        if (q.c && X > tipX) return;
        const bump = Math.exp(-Math.pow((q.u - UTIP) / .07, 2)) * (q.u > UTIP ? 1 : .7);
        const sDraw = q.c ? q.s : q.s + Math.sign(q.s) * .28 * bump;
        if (!q.c && q.u > UTIP && Math.abs(sDraw) < .32) return;          // 관 몸통 속으로는 그리지 않는다
        const Y = py + sDraw * ay, len = 4 + 10 * p.V / 100;
        D.line(ctx, X - len, Y, X, Y, { color: PS.rgba('steel', q.c ? .9 : .5), width: q.c ? 2 : 1.4 });
      });
      // 실제 속도 화살표
      const vlen = 18 + (narrow ? 50 : 80) * p.V / 100;
      D.arrow(ctx, x0 + 6, py - ay - 12, vlen, 0, { color: C.V, width: 3, head: 8, hot: hl === 'V' });
      D.text(ctx, 'V = ' + fmt(p.V, 0) + ' m/s', x0 + 10 + vlen, py - ay - 8, { size: 11, color: C.V, bold: hl === 'V' });

      // 피토관 — 코끝 구멍(전압), 옆 구멍(정압), 받침대
      ctx.save();
      D.roundRect(ctx, tipX, py - 5, Lp, 10, 2);
      ctx.fillStyle = PS.rgba('ink2', .28); ctx.fill();
      ctx.strokeStyle = PAL.ink2; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
      const holeX = tipX + Lp * .38;
      D.dot(ctx, tipX + 1, py, 3.2, C.dp, hl === 'dp');
      D.dot(ctx, holeX, py - 5, 2.2, PAL.ink); D.dot(ctx, holeX, py + 5, 2.2, PAL.ink);
      const strutX = tipX + Lp * .8;

      /* ── 마노미터 (U자 관) ── */
      const mx = narrow ? w * .27 : w * .3, mTop = narrow ? h * .47 : h * .5, mBot = h - (small ? 14 : 22);
      const gap = narrow ? 11 : 15, legH = mBot - mTop, rest = mTop + legH * .5;
      const k = (legH * .44) / (D_MAX / 2);                 // mm → px (슬라이더 끝에서 관 안에 들어오게)
      const half = dmm / 2 * k;
      const lx = mx - gap, rx = mx + gap;
      // 관 — 왼쪽은 코끝(전압 p₀), 오른쪽은 옆 구멍(정압 p)에 이어진다
      D.line(ctx, tipX + 3, py + 2, tipX + 3, py + ay + 8, { color: PS.rgba('ink2', .6) });
      D.line(ctx, tipX + 3, py + ay + 8, lx, py + ay + 8, { color: PS.rgba('ink2', .6) });
      D.line(ctx, lx, py + ay + 8, lx, mTop, { color: PS.rgba('ink2', .6) });
      D.line(ctx, holeX, py + 6, holeX, py + ay + 16, { color: PS.rgba('ink2', .6) });
      D.line(ctx, holeX, py + ay + 16, rx, py + ay + 16, { color: PS.rgba('ink2', .6) });
      D.line(ctx, rx, py + ay + 16, rx, mTop, { color: PS.rgba('ink2', .6) });
      // U자 관 벽
      ctx.save();
      ctx.strokeStyle = PAL.ink2; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(lx - 5, mTop); ctx.lineTo(lx - 5, mBot - gap); ctx.arc(mx, mBot - gap, gap + 5, Math.PI, 0, true); ctx.lineTo(rx + 5, mTop); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx + 5, mTop); ctx.lineTo(lx + 5, mBot - gap); ctx.arc(mx, mBot - gap, gap - 5, Math.PI, 0, true); ctx.lineTo(rx - 5, mTop); ctx.stroke();
      // 물 — 왼쪽(높은 압력)은 내려가고 오른쪽은 올라간다
      ctx.fillStyle = PS.rgba('dusty', hl === 'd' || hl === 'dp' ? .85 : .6);
      ctx.fillRect(lx - 4, rest + half, 8, mBot - gap - (rest + half));
      ctx.fillRect(rx - 4, rest - half, 8, mBot - gap - (rest - half));
      ctx.beginPath(); ctx.arc(mx, mBot - gap, gap + 4, Math.PI, 0, true); ctx.arc(mx, mBot - gap, gap - 4, 0, Math.PI, false); ctx.fill();
      ctx.restore();
      D.line(ctx, lx - 12, rest, rx + 12, rest, { color: PS.rgba('ink3', .7), dash: [3, 3] });
      // 높이 차 d 치수선
      if (half > 3) D.dim(ctx, rx + 16, rest - half, rx + 16, rest + half, null, C.d, hl === 'd');
      D.text(ctx, 'd = ' + fmt(dmm, 0) + ' mm', rx + 24, rest + 4, { size: 11, color: C.d, bold: hl === 'd' });
      D.text(ctx, 'p₀', lx - 9, mTop - 4, { size: 10.5, color: C.dp, align: 'right' });
      D.text(ctx, 'p', rx + 9, mTop - 4, { size: 10.5, color: PAL.ink2 });
      D.tag(ctx, 'Δp = ' + fmt(dp, 0) + ' Pa', mx, mTop - (small ? 16 : 22), C.dp, hl === 'dp');
      if (!small) D.text(ctx, narrow ? '물기둥' : '마노미터 (물기둥)', mx, mBot + 14, { size: 10, color: PAL.ink3, align: 'center' });

      /* ── 속도계 — 0~110 m/s 를 270° 에, 바늘은 계기 속도 ── */
      const gx = narrow ? w * .72 : w * .82, gy = narrow ? h * .69 : h * .5;
      const gr = narrow ? Math.min(w * .19, h * .2) : Math.min(w * .14, h * .3);
      const A0 = Math.PI * .75, SPAN = Math.PI * 1.5, VMAXG = 110;
      const ang = v => A0 + SPAN * clamp(v / VMAXG, 0, 1);
      ctx.save();
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 7); ctx.fillStyle = PS.rgba('ink', .04); ctx.fill();
      ctx.strokeStyle = PAL.ink3; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(gx, gy, gr, A0, A0 + SPAN); ctx.stroke();
      ctx.restore();
      const stepN = narrow || small ? 50 : 20;
      for (let v = 0; v <= 100; v += 10) {
        const a = ang(v), major = v % stepN === 0;
        D.line(ctx, gx + Math.cos(a) * gr * (major ? .82 : .88), gy + Math.sin(a) * gr * (major ? .82 : .88),
          gx + Math.cos(a) * gr, gy + Math.sin(a) * gr, { color: PAL.ink3, width: major ? 1.6 : 1 });
        if (major) D.text(ctx, v + '', gx + Math.cos(a) * gr * .64, gy + Math.sin(a) * gr * .64 + 4, { size: 9.5, color: PAL.ink3, align: 'center' });
      }
      // 실제 속도 표시(작은 파란 눈금) — 계기 바늘과 얼마나 벌어지는지
      const at = ang(p.V);
      D.line(ctx, gx + Math.cos(at) * gr * .9, gy + Math.sin(at) * gr * .9, gx + Math.cos(at) * gr * 1.08, gy + Math.sin(at) * gr * 1.08, { color: C.V, width: 2.5, hot: hl === 'V' });
      const an = ang(vi);
      D.line(ctx, gx, gy, gx + Math.cos(an) * gr * .8, gy + Math.sin(an) * gr * .8, { color: C.Vi, width: 3, hot: hl === 'Vi' });
      D.dot(ctx, gx, gy, 4, C.Vi);
      D.text(ctx, 'V_i ' + fmt(vi, 0) + ' m/s', gx, gy + gr * .45 + 4, { size: narrow ? 10.5 : 12, color: C.Vi, align: 'center', bold: true });
      D.text(ctx, '계기 속도', gx, gy - gr - 8, { size: 10.5, color: C.Vi, align: 'center', bold: hl === 'Vi' });
      D.text(ctx, '실제 ' + fmt(p.V, 0) + ' m/s · 고도 ' + fmt(p.h / 1000, 1) + ' km', gx, gy + gr + 16,
        { size: narrow ? 9.5 : 10.5, color: C.h, align: 'center', bold: hl === 'h' });
      if (!small) D.text(ctx, 'ρ = ' + fmt(A.rho, 3) + ' kg/m³', gx, gy + gr + 31, { size: narrow ? 9.5 : 10.5, color: C.rho, align: 'center', bold: hl === 'rho' });

      // 피토관 이름표 — 코끝과 옆 구멍
      if (!small) {
        D.text(ctx, '전압 p₀ (공기가 멈춤)', tipX - 4, py + ay + 2 + (narrow ? 0 : 4), { size: 10, color: C.dp, align: 'right' });
        D.text(ctx, '정압 p', holeX + 6, py - 9, { size: 10, color: PAL.ink2 });
      }
      D.line(ctx, strutX, py + 5, strutX, py + 12, { color: PAL.ink2, width: 2 });
    }
  });
})();
