/* [항공우주공학·비행역학] 표준 대기 — T = T₀ − Lh,  p = p₀(T/T₀)^(g/(LR)),  ρ = p/(RT)
   땅에서 위로 올라가면 머리 위에 쌓인 공기가 줄어든다. 기압은 그 공기 기둥의 무게이므로
   줄어들고, 공기는 눌리지 않으니 묽어진다(밀도 감소). 대류권(0~11 km)에서는 1 km마다 약 6.5 K씩
   추워지고, 그 위 성층권 아래쪽(11~20 km)은 기온이 그대로다 — 국제 표준 대기(ISA)의 두 층.
   왼쪽 하늘의 점(공기 알갱이)과 부푸는 풍선, 오른쪽의 세 곡선이 같은 높이 눈금을 쓴다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp, PAL = PS.PAL;
  const C = { h: PAL.teal, T0: PAL.amber, L: PAL.rust, T: PAL.burnt, p: PAL.steel, rho: PAL.sage, V: PAL.violet };
  const G = 9.80665, R = 287.05287, P0 = 101325, HT = 11, ZMAX = 20;   // 대류권계면 11 km, 화면 꼭대기 20 km

  // 높이 z(km)에서의 기온(K)·기압(Pa)·밀도(kg/m³)
  const T0K = p => p.T0 + 273.15;
  function air(p, z) {
    const T0 = T0K(p), Lm = p.L / 1000, zt = Math.min(z, HT) * 1000;
    const Tt = T0 - Lm * zt;
    const pt = Lm > 1e-9 ? P0 * Math.pow(Tt / T0, G / (Lm * R)) : P0 * Math.exp(-G * zt / (R * T0));
    if (z <= HT) return { T: Tt, p: pt, rho: pt / (R * Tt) };
    const pp = pt * Math.exp(-G * (z - HT) * 1000 / (R * Tt));        // 성층권 — 기온이 그대로
    return { T: Tt, p: pp, rho: pp / (R * Tt) };
  }
  // 처음(해면)에 묶은 풍선의 부피 배율 — 같은 공기 pV/T = 일정
  const vol = (p, z) => { const a = air(p, z); return (P0 / a.p) * (a.T / T0K(p)); };

  // 하늘의 공기 알갱이 — 늘 같은 자리에 놓고, 그 높이의 밀도 비율만큼만 보인다
  const DOTS = [];
  (function () { let s = 12345; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 520; i++) DOTS.push({ u: r(), z: r() * ZMAX, k: r(), ph: r() * 6.28 }); })();

  PS.register({
    id: 'aero-atmosphere', mode: 'aero', category: '비행역학',
    title: '표준 대기 — 높이 올라가면 공기는?',
    sub: 'p = p₀(T/T₀)^(g/LR),  ρ = p/RT',
    tagline: '높이 올라갈수록 기온·기압·공기 밀도가 어떻게 줄어드는지, 풍선이 왜 부풀어 오르는지 같은 높이 눈금 위에서 봅니다.',

    params: [
      { key: 'h', symbol: 'h', label: '높이 (고도)', unit: 'km', min: 0, max: 20, step: .1, value: 3, color: C.h, dec: 1,
        where: '하늘을 가로지르는 <b>청록색 점선</b>의 높이입니다. 풍선이 이 높이로 올라가고, 오른쪽 세 곡선에서 이 높이의 값을 읽습니다.' },
      { key: 'T0', symbol: 'T₀', label: '땅(해면) 기온', unit: '°C', min: -20, max: 45, step: 1, value: 15, color: C.T0, dec: 0,
        where: '오른쪽 기온 곡선이 시작하는 <b>맨 아래 주황 점</b>입니다. 표준은 15 °C이고, 공식에서는 켈빈(+273.15)으로 씁니다.' },
      { key: 'L', symbol: 'L', label: '기온 감소율', unit: 'K/km', min: 0, max: 10, step: .1, value: 6.5, color: C.L, dec: 1,
        where: '대류권(0~11 km)에서 <b>1 km 오를 때 기온이 떨어지는 양</b>입니다. 기온 곡선 옆 붉은 글자로 보이며 표준은 6.5입니다.' }
    ],
    vars: {
      T: { symbol: 'T', label: '기온', unit: 'K', color: C.T,
        where: '오른쪽 <b>주황 갈색 곡선</b>입니다. 11 km까지는 비스듬히 줄고, 그 위(성층권)에서는 세로로 곧게 섭니다.' },
      p: { symbol: 'p', label: '기압', unit: 'hPa', color: C.p,
        where: '오른쪽 <b>파란 곡선</b>입니다. 머리 위 공기의 무게라서, 위로 갈수록 빠르게 0 쪽으로 다가갑니다.' },
      rho: { symbol: 'ρ', label: '공기 밀도', unit: 'kg/m³', color: C.rho,
        where: '오른쪽 <b>초록 곡선</b>이자 왼쪽 하늘의 <b>초록 점</b>입니다. 점이 듬성듬성할수록 공기가 묽습니다.' },
      V: { symbol: 'V/V₀', label: '풍선 부피 배율', unit: '배', color: C.V,
        where: '땅에서 묶은 <b>보라색 풍선</b>이 처음보다 몇 배로 부풀었는지입니다. 바깥 기압이 낮을수록 커집니다.' }
    },
    formulas: [
      { name: '기온 — 1 km마다 L만큼 (대류권)', tpl: '{T} = {T0} − {L}·{h}' },
      { name: '기압 — 머리 위 공기의 무게', tpl: '{p} = p₀ ({T} ⁄ {T0})^(g ⁄ {L}R)' },
      { name: '밀도 — 기체의 상태 방정식', tpl: '{rho} = {p} ⁄ (R{T})' },
      { name: '풍선 부피 (같은 공기)', tpl: '{V} = (p₀ ⁄ {p}) · ({T} ⁄ {T0})' }
    ],

    init(p) { return { z: p.h }; },
    step(st, p, dt) {
      // 높이를 바꾸면 풍선이 새 높이까지 부드럽게 올라가거나 내려온다
      st.z += (p.h - st.z) * Math.min(1, dt * 2.5);
      if (Math.abs(p.h - st.z) < 1e-4) st.z = p.h;
    },

    graphs: [{
      title: '해면 대비 % – 높이 (0 → 20 km를 되풀이해 훑는다)', xKey: 'hk', xUnit: 'km', xMin: 0, xMax: ZMAX, y0: 0,
      series: [
        { key: 'Tp', label: '기온 T (켈빈 기준 %)', color: C.T },
        { key: 'pp', label: '기압 p (%)', color: C.p },
        { key: 'rp', label: '밀도 ρ (%)', color: C.rho }
      ]
    }],
    sample(st, p) {
      const z = (st.t * 2) % ZMAX, a = air(p, z), s = air(p, 0);
      return { hk: z, Tp: a.T / s.T * 100, pp: a.p / P0 * 100, rp: a.rho / s.rho * 100 };
    },

    readouts(st, p) {
      const a = air(p, st.z), s = air(p, 0), V = vol(p, st.z);
      return [
        { label: '높이 h', value: st.z, unit: 'km', color: C.h, dec: 2 },
        { label: '기온 T (°C)', value: a.T - 273.15, unit: '°C', color: C.T, dec: 2 },
        { label: '기온 T (K)', value: a.T, unit: 'K', color: C.T, dec: 2 },
        { label: '기압 p', value: a.p / 100, unit: 'hPa', color: C.p, dec: 1 },
        { label: '해면 대비 기압', value: a.p / P0 * 100, unit: '%', color: C.p, dec: 1 },
        { label: '공기 밀도 ρ', value: a.rho, unit: 'kg/m³', color: C.rho, dec: 4 },
        { label: '해면 대비 밀도', value: a.rho / s.rho * 100, unit: '%', color: C.rho, dec: 1 },
        { label: '풍선 부피 배율 V/V₀', value: V, unit: '배', color: C.V, dec: 2 },
        { label: '발아래에 있는 공기', value: 100 - a.p / P0 * 100, unit: '%', color: PAL.ink2, dec: 1 },
        { label: '지금 있는 층', wide: true, color: st.z <= HT ? C.T : C.p,
          value: st.z <= HT ? '대류권 — 오를수록 추워지고, 구름·비가 생기는 층'
                            : '성층권 — 기온이 그대로, 여객기 순항 고도 바로 위' },
        { label: '한 번 숨 쉴 때 들이마시는 공기', wide: true, color: C.rho,
          value: '땅의 ' + fmt(a.rho / s.rho * 100, 0) + ' %' + (a.rho / s.rho < .5 ? ' — 산소마스크가 필요한 높이' : '') }
      ];
    },

    notes: [
      '산에 오르면 귀가 먹먹하고 과자 봉지가 빵빵해집니다. <b>위로 갈수록 머리 위에 쌓인 공기가 적어져</b> 누르는 힘(기압)이 줄기 때문입니다.',
      '기압은 <b>머리 위 공기 기둥의 무게</b>입니다. 5.5 km만 올라가도 공기의 절반이 발아래에 있으므로 기압도 절반이 됩니다.',
      '<b>대류권(0~11 km)</b>에서는 1 km 오를 때마다 약 6.5 °C씩 추워집니다. 여객기가 나는 11 km의 바깥 기온은 약 −56 °C입니다.',
      '<b>11~20 km</b>에서는 기온이 거의 그대로입니다. 그 위로는 오존이 햇빛을 흡수해 오히려 따뜻해집니다. 구름과 비는 거의 대류권에서만 생깁니다.',
      '공기가 묽으면 날개의 양력도, 엔진이 빨아들이는 산소도 줄어듭니다. 그래서 비행기 성능표와 고도계는 모두 이 <b>표준 대기</b>를 기준으로 맞춥니다.'
    ],
    presets: [
      { name: '표준 대기 — 땅(해면)', set: { h: 0, T0: 15, L: 6.5 } },
      { name: '에베레스트 꼭대기 (8.8 km)', set: { h: 8.8, T0: 15, L: 6.5 } },
      { name: '여객기 순항 (11 km)', set: { h: 11, T0: 15, L: 6.5 } },
      { name: '기상 관측 풍선 (20 km)', set: { h: 20, T0: 15, L: 6.5 } },
      { name: '더운 여름날 (땅 35 °C)', set: { h: 5, T0: 35, L: 6.5 } },
      { name: '기온이 늘 같다면 (L = 0)', set: { h: 11, T0: 15, L: 0 } }
    ],
    challenges: [
      {
        id: 'half-air', title: '숨 쉬는 공기가 절반이 되는 높이',
        desc: '표준 기온(땅 15 °C, L = 6.5)에서, 한 번 숨 쉴 때 들이마시는 공기(밀도)가 땅의 50 % 이하가 되는 높이까지 올라가 보세요.',
        hint: '밀도는 기압보다 조금 천천히 줄어듭니다(위가 더 차가워서). 6 km 위쪽을 찾아보세요 — 측정값의 "해면 대비 밀도"를 보세요.',
        check: ({ P }) => Math.abs(P.T0 - 15) < .5 && Math.abs(P.L - 6.5) < .05 && air(P, P.h).rho / air(P, 0).rho <= .5
      },
      {
        id: 'balloon5', title: '풍선을 5배로 부풀리기',
        desc: '땅에서 묶은 풍선의 부피가 처음의 5배 이상이 되게 해 보세요.',
        hint: '부피는 바깥 기압에 반비례합니다. 11 km를 넘어도 기압은 계속 줄어드니 더 올라가 보세요.',
        check: ({ P }) => vol(P, P.h) >= 5
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl, narrow = w < 600;
      const s = air(p, 0), a = air(p, st.z), V = vol(p, st.z);
      const fT = z => air(p, z).T / s.T, fp = z => air(p, z).p / P0, fr = z => air(p, z).rho / s.rho;

      /* ── 배치: 왼쪽 하늘 기둥, 오른쪽 곡선판 — 같은 높이 눈금 ── */
      const top = 36, GY = h - 40;
      const Y = z => GY - z / ZMAX * (GY - top);
      const axX = narrow ? 36 : 54;
      const cx0 = axX, colW = narrow ? w * .36 : Math.min(w * .36, 460), cx1 = cx0 + colW;
      const px0 = cx1 + (narrow ? 24 : 54), px1 = w - (narrow ? 44 : 110);
      const PX = f => px0 + clamp(f, 0, 1.05) * (px1 - px0);

      // 하늘 바탕 — 아래가 짙고 위가 옅다
      const gr = ctx.createLinearGradient(0, GY, 0, top);
      gr.addColorStop(0, 'rgba(111,159,196,.16)'); gr.addColorStop(1, 'rgba(111,159,196,.02)');
      ctx.save(); ctx.fillStyle = gr; ctx.fillRect(cx0, top, colW, GY - top); ctx.restore();

      // 공기 알갱이 — 그 높이의 밀도 비율만큼만 보인다
      const hotR = hl === 'rho';
      ctx.save(); ctx.fillStyle = C.rho; ctx.globalAlpha = hotR ? .95 : .55;
      DOTS.forEach(d => {
        if (d.k > fr(d.z)) return;
        const x = cx0 + 4 + d.u * (colW - 8) + Math.sin(st.t * 2.2 + d.ph) * 1.6;
        const y = Y(d.z) + Math.cos(st.t * 1.9 + d.ph) * 1.6;
        ctx.beginPath(); ctx.arc(x, y, hotR ? 2 : 1.6, 0, 7); ctx.fill();
      });
      ctx.restore();

      // 에베레스트 (8.8 km) — 기둥 오른쪽
      const mx0 = cx0 + colW * .52, mpk = cx0 + colW * .80;
      D.poly(ctx, [[mx0, GY], [mx0 + colW * .14, Y(5.2)], [mpk - colW * .05, Y(7.6)], [mpk, Y(8.8)], [cx1, Y(6.4)], [cx1, GY]],
        { fill: '#1d1f23', stroke: 'rgba(167,170,176,.45)', width: 1.4 });
      D.poly(ctx, [[mpk - colW * .06, Y(7.9)], [mpk, Y(8.8)], [mpk + colW * .07, Y(8.0)], [mpk + colW * .02, Y(8.15)]],
        { fill: 'rgba(230,231,234,.55)' });
      D.text(ctx, '에베레스트 8.8 km', mpk, Y(8.8) - 8, { size: 9.5, color: PAL.ink2, align: 'center' });

      D.ground(ctx, 14, w - 14, GY, 0);

      // 높이 눈금
      [0, 5, 10, 15, 20].forEach(z => {
        D.line(ctx, axX - 4, Y(z), axX, Y(z), { color: PAL.ink3 });
        D.text(ctx, z + (z === ZMAX ? ' km' : ''), axX - 7, Y(z) + 4, { size: 10, color: PAL.ink3, align: 'right' });
      });
      D.line(ctx, axX, GY, axX, top, { color: 'rgba(167,170,176,.35)' });

      // 대류권계면 11 km
      D.line(ctx, cx0, Y(HT), px1, Y(HT), { color: 'rgba(167,170,176,.35)', dash: [5, 5] });
      // (처음엔 회색 3단계였는데 폰 캡처에서 층 이름이 잘 안 보여 한 단계 밝혔다)
      D.text(ctx, '대류권', cx0 + 6, Y(HT * .5) + 4, { size: 11, color: PAL.ink2 });
      D.text(ctx, '성층권', cx0 + 6, Y((HT + ZMAX) / 2) + 4, { size: 11, color: PAL.ink2 });
      D.text(ctx, narrow ? '11 km' : '대류권계면 11 km', px1, Y(HT) - 5, { size: 10, color: PAL.ink2, align: 'right' });

      // 기둥 설명은 땅 아래에 — 위쪽은 20 km까지 올라간 큰 풍선 자리
      D.text(ctx, narrow ? '점 = 공기 알갱이' : '점 하나 = 공기 알갱이', cx0 + 2, GY + 17,
        { size: 10.5, color: hotR ? C.rho : PAL.ink2, bold: hotR });

      /* ── 곡선판 ── */
      D.text(ctx, narrow ? '땅 = 100 %' : '높이에 따른 변화 — 땅(해면) = 100 %', px0, top - 14, { size: 10.5, color: PAL.ink2 });
      [0, .5, 1].forEach(f => {
        D.line(ctx, PX(f), top, PX(f), GY, { color: 'rgba(167,170,176,' + (f === 1 ? .28 : .12) + ')', dash: f === 1 ? null : [2, 4] });
        D.text(ctx, f === 1 ? '100 %' : fmt(f * 100, 0), PX(f), GY + 16, { size: 9.5, color: PAL.ink3, align: 'center' });
      });
      const curve = (fn, col, hot) => {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = hot ? 3.4 : 2.2;
        if (hot) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
        ctx.beginPath();
        for (let z = 0; z <= ZMAX + 1e-9; z += .1) { const x = PX(fn(z)), y = Y(z); z ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.restore();
      };
      const hotT = hl === 'T' || hl === 'T0' || hl === 'L';
      curve(fr, C.rho, hotR);
      curve(fp, C.p, hl === 'p');
      curve(fT, C.T, hotT);
      // 곡선 이름 — 서로 다른 높이에
      D.text(ctx, 'T 기온', PX(fT(16.5)) + 6, Y(16.5), { size: 10.5, color: C.T, bold: hotT });
      D.text(ctx, 'p 기압', PX(fp(8)) - 6, Y(8) + 4, { size: 10.5, color: C.p, align: 'right', bold: hl === 'p' });
      D.text(ctx, 'ρ 밀도', PX(fr(8)) + 6, Y(8) + 4, { size: 10.5, color: C.rho, bold: hotR });
      // 기온 감소율 L — 대류권 기온 곡선 옆
      D.text(ctx, '−' + fmt(p.L, 1) + ' K/km', PX(fT(4)) + 8, Y(4) + 4,
        { size: 10, color: C.L, bold: hl === 'L' });
      // 땅 기온 T₀
      D.dot(ctx, PX(1), GY, hl === 'T0' ? 6 : 4.5, C.T0, hl === 'T0');
      D.text(ctx, 'T₀ ' + fmt(p.T0, 0) + ' °C', PX(1) + 8, GY - 6, { size: 10, color: C.T0, bold: hl === 'T0' });

      // 지금 높이의 세 값 — 곡선판 왼쪽 아래(곡선이 지나가지 않는 자리)
      const lx = px0 + 6, ly = GY - (narrow ? 46 : 54), lh = narrow ? 14 : 16, ls = narrow ? 10.5 : 11.5;
      D.text(ctx, 'T = ' + fmt(a.T - 273.15, 1) + ' °C', lx, ly, { size: ls, color: C.T, bold: true });
      D.text(ctx, 'p = ' + fmt(a.p / 100, a.p < 1e4 ? 1 : 0) + ' hPa', lx, ly + lh, { size: ls, color: C.p, bold: true });
      D.text(ctx, 'ρ = ' + fmt(a.rho, 3) + ' kg/m³', lx, ly + lh * 2, { size: ls, color: C.rho, bold: true });

      /* ── 지금 높이 — 하늘과 곡선판을 잇는 선 ── */
      const zy = Y(st.z), hotH = hl === 'h';
      D.line(ctx, cx0, zy, px1, zy, { color: C.h, dash: [6, 4], width: hotH ? 2.4 : 1.6, hot: hotH });
      D.dot(ctx, PX(fT(st.z)), zy, hotT ? 6 : 5, C.T, hotT);
      D.dot(ctx, PX(fp(st.z)), zy, hl === 'p' ? 6 : 5, C.p, hl === 'p');
      D.dot(ctx, PX(fr(st.z)), zy, hotR ? 6 : 5, C.rho, hotR);

      /* ── 풍선 — 땅에서 묶은 공기가 바깥 기압이 낮아지며 부푼다 ── */
      const r0 = narrow ? 8 : 10, rad = r0 * Math.cbrt(V);
      const bx = cx0 + colW * .31, by = Math.min(zy, GY - rad - 14);
      D.line(ctx, bx, by + rad, bx, by + rad + 10, { color: PAL.ink2 });
      ctx.save(); ctx.fillStyle = PAL.ink2; ctx.fillRect(bx - 3, by + rad + 10, 6, 4); ctx.restore();
      ctx.save();
      if (hl === 'V') { ctx.shadowColor = C.V; ctx.shadowBlur = 16; }
      ctx.fillStyle = 'rgba(169,140,196,.35)'; ctx.strokeStyle = C.V; ctx.lineWidth = hl === 'V' ? 2.6 : 1.8;
      ctx.beginPath(); ctx.ellipse(bx, by, rad * .92, rad, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      D.tag(ctx, '풍선 ×' + fmt(V, V < 10 ? 2 : 1), bx + rad + 8, by - rad * .4, C.V, hl === 'V', 'left');
      D.tag(ctx, 'h = ' + fmt(st.z, 1) + ' km', axX + 4, zy - 13, C.h, hotH, 'left');
    }
  });
})();
