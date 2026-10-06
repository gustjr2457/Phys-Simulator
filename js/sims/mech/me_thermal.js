/* [기계공학·열공학] 열전도와 열저항 — Q = ΔT / ΣR, R = L/kA, R = 1/hA
   열은 전류처럼 흐른다. 전압차가 온도차, 전류가 열流, 저항이 열저항이고 — 층이
   여러 개면 저항이 직렬로 더해진다. 단열재를 두껍게 해도 효과가 금방 둔해지는
   이유(외부 대류 저항이 남아 있다), 그리고 바람이 불면 왜 급격히 식는지를
   뜨거운 커피 한 잔으로 확인한다. 열교환기·보온재·엔진 냉각 설계의 출발점. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { ins: '#5eead4', k: '#60a5fa', hout: '#a78bfa', Tout: '#93a2c4',
              T: '#fb7185', R: '#fbbf24', Q: '#fb923c', tau: '#f472b6' };

  const AREA = .035;        // 컵의 방열 면적 m²
  const CAP = 836;          // 물 200 mL의 열용량 J/K
  const T0 = 85;            // 처음 온도 °C
  const DRINK = 60;         // 마시기 좋은 온도 °C

  const Rins = p => (p.ins / 1000) / (p.k * AREA);     // 단열층 전도 저항 K/W
  const Rconv = p => 1 / (p.hout * AREA);              // 외부 대류 저항 K/W
  const Rtot = p => Rins(p) + Rconv(p);
  const tauOf = p => Rtot(p) * CAP;                    // 시간상수 (초)
  const Tof = (p, tmin) => p.Tout + (T0 - p.Tout) * Math.exp(-tmin * 60 / tauOf(p));

  PS.register({
    id: 'me-thermal', mode: 'mech', category: '열공학',
    title: '열전도와 열저항',
    sub: 'Q = ΔT / ΣR',
    tagline: '열은 전류처럼 흐르고, 층이 여러 개면 저항이 직렬로 더해집니다. 뜨거운 커피를 식지 않게 하려면 — 단열재를 더 두껍게? 아니면 바람을 막는 쪽?  화면의 1초 = 실제 1분입니다.',

    params: [
      { key: 'ins', symbol: 'L', label: '단열재 두께', unit: 'mm', min: 0, max: 30, step: 1, value: 5, color: C.ins, dec: 0,
        where: '컵을 감싼 <b>청록색 단열층</b>의 두께입니다. 두꺼울수록 전도 저항 R = L/kA가 비례해서 커지지만, 외부 대류 저항은 그대로라 효과가 점점 둔해집니다.' },
      { key: 'k', symbol: 'k', label: '단열재 열전도율', unit: 'W/m·K', min: .02, max: .6, step: .01, value: .05, color: C.k, dec: 2,
        where: '단열재가 <b>열을 얼마나 잘 통과시키는가</b>입니다. 작을수록 좋은 단열재입니다 — 에어로젤 0.02 · 스티로폼 0.035 · 종이 0.05 · 나무 0.15 · 유리 1.0 W/m·K.' },
      { key: 'hout', symbol: 'h', label: '외부 대류계수', unit: 'W/m²K', min: 3, max: 50, step: 1, value: 10, color: C.hout, dec: 0,
        where: '컵 표면과 <b>공기 사이의 열 전달</b> 정도입니다. 무풍 5 · 실내 10 · 선풍기 25 · 강풍 50. 바람이 불면 이 값이 커져 대류 저항 1/hA가 작아집니다 — 그래서 호호 불면 빨리 식습니다.' },
      { key: 'Tout', symbol: 'T_∞', label: '주변 온도', unit: '°C', min: -10, max: 30, step: 1, value: 20, color: C.Tout, dec: 0, reset: true,
        where: '<b>바깥 공기 온도</b>(화면 오른쪽 끝 기준선)입니다. 온도차 ΔT가 열流를 직접 결정하므로, 추운 곳에서는 모든 것이 빨리 식습니다.' }
    ],
    vars: {
      T: { symbol: 'T', label: '커피 온도', unit: '°C', color: C.T,
        where: '컵 안의 <b>현재 온도</b>입니다(온도계와 온도 분포선의 왼쪽 높이). 지수적으로 주변 온도에 가까워집니다.' },
      R: { symbol: 'R', label: '총 열저항', unit: 'K/W', color: C.R,
        where: '단열층 저항과 외부 대류 저항의 <b>직렬 합</b>입니다. 화면 아래 저항 회로도에서 두 토막의 길이 비가 그 비중입니다.' },
      Q: { symbol: 'Q', label: '열流', unit: 'W', color: C.Q,
        where: '지금 <b>밖으로 빠져나가는 열의 양</b>(주황 화살표의 굵기)입니다. 모든 층을 같은 양이 통과합니다 — 직렬이니까요.' },
      tau: { symbol: 'τ', label: '시간상수', unit: '분', color: C.tau,
        where: '처음 온도차의 63%가 사라지는 데 걸리는 시간입니다. τ = R·C로, <b>열저항과 열용량의 곱</b>입니다. 보온병의 성능이 바로 이 값입니다.' }
    },
    formulas: [
      { name: '열流 (푸리에 + 뉴턴 냉각)', tpl: '{Q} = ({T} − {Tout}) ⁄ {R}' },
      { name: '열저항은 직렬로 더해진다', tpl: '{R} = {ins}⁄({k}A) + 1⁄({hout}A)' },
      { name: '식는 속도 (시간상수)', tpl: '{tau} = {R} · C' },
      { name: '온도 변화', tpl: '{T} = {Tout} + ({T}₀ − {Tout})·e^(−t⁄{tau})' }
    ],

    init(p) { return { T: T0, done: false }; },
    step(st, p, dt) {               // 해석해를 그대로 쓴다(수치오차 0). dt는 '분' 단위로 해석
      st.T = Tof(p, st.t + dt);
      if (st.t > 240) st.done = true;
    },

    graphs: [{
      title: '커피 온도 – 시간', xmin: 60, xUnit: '분', y0: 0,
      series: [
        { key: 'T', label: 'T (°C)', color: C.T },
        { key: 'dk', label: '마시기 좋은 60°C', color: '#fbbf24' },
        { key: 'ta', label: '주변 온도', color: C.Tout }
      ]
    }],
    sample(st, p) { return { T: st.T, dk: DRINK, ta: p.Tout }; },

    readouts(st, p) {
      const ri = Rins(p), rc = Rconv(p), rt = ri + rc;
      const tau = tauOf(p) / 60;
      const Q = (st.T - p.Tout) / rt;
      // 60 °C까지 걸리는 시간
      const frac = (DRINK - p.Tout) / (T0 - p.Tout);
      const tDrink = frac > 0 && frac < 1 ? -tau * Math.log(frac) : (frac >= 1 ? Infinity : 0);
      const insFrac = rt > 0 ? ri / rt * 100 : 0;
      return [
        { label: '단열층 저항 L/kA', value: ri, unit: 'K/W', color: C.ins, dec: 2 },
        { label: '외부 대류 저항 1/hA', value: rc, unit: 'K/W', color: C.hout, dec: 2 },
        { label: '총 열저항 R', value: rt, unit: 'K/W', color: C.R, dec: 2 },
        { label: '단열층이 차지하는 비중', value: insFrac, unit: '%', color: C.ins, dec: 0 },
        { label: '시간상수 τ = RC', value: tau, unit: '분', color: C.tau, dec: 1 },
        { label: '현재 온도 T', value: st.T, unit: '°C', color: C.T, dec: 1 },
        { label: '지금 빠져나가는 열 Q', value: Q, unit: 'W', color: C.Q, dec: 2 },
        { label: '경과 시간', value: st.t, unit: '분', dec: 0, color: '#93a2c4' },
        { label: '60 °C까지', value: isFinite(tDrink) ? fmt(tDrink, 0) + ' 분' : '이미 60 °C 이하', wide: true, color: '#fbbf24' },
        { label: '약점은 어디인가', wide: true, color: insFrac >= 50 ? '#5eead4' : '#a78bfa',
          value: insFrac >= 50 ? '단열층이 지배 — 더 두껍게 하면 효과가 있다' : '외부 대류가 지배 — 바람을 막는 쪽이 효과적' }
      ];
    },

    notes: [
      '<b>열저항은 전기저항과 똑같이 직렬로 더해집니다</b>(ΔT ↔ 전압, Q ↔ 전류, R ↔ 저항). 그래서 가장 큰 저항 하나가 전체를 지배하고, 작은 저항을 더 줄여도 거의 효과가 없습니다.',
      '단열재를 두껍게 하는 효과는 <b>금방 둔해집니다.</b> 외부 대류 저항 1/hA가 직렬로 남아 있어서, 전도 저항이 그보다 훨씬 커진 뒤에는 추가 두께가 전체 저항에 기여하는 비율이 작아집니다.',
      '반대로 <b>바람은 치명적입니다.</b> h가 10 → 40이 되면 대류 저항이 1/4로 줄어듭니다. 단열이 약한 상태에서는 체감 냉각(wind chill)이 이렇게 설명됩니다.',
      '같은 두께라도 <b>k가 작은 재료</b>가 압도적으로 유리합니다. 스티로폼이 유리보다 30배 좋은 단열재인 이유는 고체가 아니라 그 속에 갇힌 <b>공기</b>가 일하기 때문입니다(그래서 눌러서 공기를 빼면 단열이 망가집니다).',
      '시간상수 τ = RC에는 <b>열용량 C</b>도 들어갑니다 — 같은 보온병이라도 가득 채우면 더 오래 뜨겁습니다. 커피 양을 늘리는 것도 "단열"의 일종입니다.'
    ],
    presets: [
      { name: '종이컵 (얇은 슬리브)', set: { ins: 5, k: .05, hout: 10, Tout: 20 } },
      { name: '맨 유리컵', set: { ins: 3, k: .6, hout: 10, Tout: 20 } },
      { name: '보온병 (두꺼운 단열)', set: { ins: 25, k: .03, hout: 10, Tout: 20 } },
      { name: '겨울 야외 + 강풍', set: { ins: 5, k: .05, hout: 45, Tout: -5 } },
      { name: '아무리 두꺼워도 (대류 지배)', set: { ins: 30, k: .6, hout: 45, Tout: 20 } }
    ],
    challenges: [
      {
        id: 'hot60', title: '한 시간 뒤에도 70 °C',
        desc: '60분이 지난 시점에 커피 온도가 70 °C 이상으로 남아 있게 만들어 보세요.',
        hint: '필요한 시간상수를 거꾸로 계산해 보세요. 단열재를 두껍게 하고 k가 작은 재료를 고르면 됩니다.',
        check: ({ P, st }) => st.t >= 60 && st.T >= 70
      },
      {
        id: 'wind', title: '강풍 속에서 버티기',
        desc: '외부 대류계수를 30 W/m²K 이상(바람 부는 상황)으로 두고도 시간상수 τ를 90분 이상으로 만들어 보세요.',
        hint: '바람은 대류 저항을 줄이지만, 단열층 저항을 그보다 훨씬 크게 만들면 전체 저항을 지킬 수 있습니다.',
        check: ({ P }) => P.hout >= 30 && tauOf(P) / 60 >= 90
      },
      {
        id: 'bottleneck', title: '병목을 바꿔 보기',
        desc: '총 열저항 중 외부 대류가 차지하는 비중을 10% 이하로 떨어뜨려, 단열층이 완전히 지배하는 상태를 만들어 보세요.',
        hint: '단열층 저항이 대류 저항의 9배 이상이면 됩니다. 두께는 최대, k는 최소로.',
        check: ({ P }) => Rconv(P) / Rtot(P) <= .1
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const ri = Rins(p), rc = Rconv(p), rt = ri + rc;
      const Q = (st.T - p.Tout) / rt;
      const hotF = clamp((st.T - p.Tout) / Math.max(1, T0 - p.Tout), 0, 1);

      /* ── 컵 단면 ── */
      const cupX = 70, cupTop = 74, cupH = Math.min(168, h * .34), cupW = 128;
      const insPx = clamp(p.ins * 1.5, 0, 46);
      const wallPx = 5;

      // 커피
      const liqTop = cupTop + 22;
      const cg = ctx.createLinearGradient(0, liqTop, 0, cupTop + cupH);
      cg.addColorStop(0, 'rgba(' + Math.round(120 + 135 * hotF) + ',' + Math.round(90 - 20 * hotF) + ',60,.75)');
      cg.addColorStop(1, 'rgba(70,40,30,.8)');
      ctx.save();
      if (hl === 'T') { ctx.shadowColor = C.T; ctx.shadowBlur = 20; }
      ctx.fillStyle = cg;
      ctx.fillRect(cupX, liqTop, cupW, cupTop + cupH - liqTop);
      ctx.restore();
      D.text(ctx, fmt(st.T, 1) + ' °C', cupX + cupW / 2, liqTop + 34,
        { size: 15, color: hl === 'T' ? '#fff' : '#ffe8d8', align: 'center', bold: true });
      D.text(ctx, '커피 200 mL', cupX + cupW / 2, liqTop + 52, { size: 9.5, color: 'rgba(255,255,255,.55)', align: 'center' });

      // 컵 벽
      ctx.fillStyle = 'rgba(200,211,239,.55)';
      ctx.fillRect(cupX + cupW, cupTop, wallPx, cupH);
      ctx.fillRect(cupX - wallPx, cupTop, wallPx, cupH);
      ctx.fillRect(cupX - wallPx, cupTop + cupH, cupW + wallPx * 2, wallPx);

      // 단열층
      if (insPx > 0) {
        ctx.save();
        if (hl === 'ins' || hl === 'k') { ctx.shadowColor = C.ins; ctx.shadowBlur = 16; }
        ctx.fillStyle = 'rgba(94,234,212,' + clamp(.14 + .5 * (.6 - p.k), .14, .45) + ')';
        ctx.fillRect(cupX + cupW + wallPx, cupTop, insPx, cupH);
        ctx.strokeStyle = C.ins; ctx.lineWidth = 1.4;
        ctx.strokeRect(cupX + cupW + wallPx, cupTop, insPx, cupH);
        ctx.restore();
        D.dim(ctx, cupX + cupW + wallPx, cupTop - 14, cupX + cupW + wallPx + insPx, cupTop - 14,
          fmt(p.ins, 0) + 'mm', C.ins, hl === 'ins');
      } else {
        D.text(ctx, '단열 없음', cupX + cupW + 12, cupTop - 10, { size: 10, color: '#fb7185' });
      }

      // 김 (뜨거울 때)
      if (st.T > p.Tout + 12) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,' + (.10 + .18 * hotF) + ')'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const bx = cupX + cupW * (.25 + i * .25);
          for (let j = 0; j <= 14; j++) {
            const t = j / 14, yy = liqTop - 6 - t * 44;
            const xx = bx + Math.sin(t * 5 + st.t * 1.6 + i * 2) * 8 * t;
            j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      /* ── 온도 분포선 ── */
      const px0 = cupX + cupW;                                     // 커피/벽 경계
      const px1 = px0 + wallPx + insPx;                            // 단열층 바깥면
      const px2 = px1 + 86;                                        // 주변 공기
      const tTop = cupTop + cupH + 46, tH = 92;
      const TY = T => tTop + tH - clamp((T - Math.min(p.Tout, 0)) / (T0 + 6 - Math.min(p.Tout, 0)), 0, 1) * tH;
      D.roundRect(ctx, cupX - 10, tTop, px2 - cupX + 20, tH, 5);
      ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      // 각 층의 온도 강하는 그 층의 저항 비중에 정비례한다
      const dT = st.T - p.Tout;
      const Tsurf = st.T - dT * (rt > 0 ? ri / rt : 0);
      ctx.save();
      ctx.strokeStyle = C.T; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cupX - 10, TY(st.T));
      ctx.lineTo(px0, TY(st.T));
      ctx.lineTo(px1, TY(Tsurf));
      // 대류 경계층은 곡선으로
      for (let i = 1; i <= 16; i++) {
        const u = i / 16;
        ctx.lineTo(px1 + (px2 - px1) * u, TY(p.Tout + (Tsurf - p.Tout) * Math.exp(-u * 3.2)));
      }
      ctx.lineTo(px2 + 10, TY(p.Tout));
      ctx.stroke(); ctx.restore();
      D.line(ctx, px0, tTop, px0, tTop + tH, { color: 'rgba(200,211,239,.3)', dash: [3, 4] });
      D.line(ctx, px1, tTop, px1, tTop + tH, { color: 'rgba(94,234,212,.4)', dash: [3, 4] });
      D.line(ctx, cupX - 10, TY(p.Tout), px2 + 10, TY(p.Tout), { color: C.Tout, dash: [4, 5], hot: hl === 'Tout' });
      D.text(ctx, 'T_∞ = ' + fmt(p.Tout, 0) + '°C', px2 + 12, TY(p.Tout) + 4,
        { size: 10, color: hl === 'Tout' ? '#fff' : C.Tout, bold: hl === 'Tout' });
      D.text(ctx, '온도 분포 — 저항이 큰 층에서 많이 떨어진다', cupX - 10, tTop - 7, { size: 10, color: '#61719a' });
      D.text(ctx, '단열층', (px0 + px1) / 2, tTop + tH + 14, { size: 9, color: C.ins, align: 'center' });
      D.text(ctx, '대류 경계층', (px1 + px2) / 2, tTop + tH + 14, { size: 9, color: C.hout, align: 'center' });

      /* ── 열流 화살표 ── */
      const aw = clamp(1.6 + Q * .9, 1.6, 8);
      for (let i = 0; i < 3; i++) {
        const ay = cupTop + cupH * (.25 + i * .25);
        D.arrow(ctx, px1 + 4, ay, 56, 0, { color: C.Q, width: aw, head: 9, hot: hl === 'Q' });
      }
      D.tag(ctx, 'Q = ' + fmt(Q, 2) + ' W', px1 + 34, cupTop + 6, C.Q, hl === 'Q');

      /* ── 열저항 직렬 회로 ── */
      const rx = Math.min(w - 300, w * .52), ry = 80, rw = 250;
      D.text(ctx, '열저항 회로 (전기회로와 똑같다)', rx, ry - 12, { size: 11, color: '#61719a' });
      const total = Math.max(rt, 1e-6);
      const w1 = rw * (ri / total), w2 = rw * (rc / total);
      D.line(ctx, rx - 16, ry + 16, rx, ry + 16, { color: C.T, width: 2.4 });
      D.dot(ctx, rx - 16, ry + 16, 4, C.T, hl === 'T');
      D.text(ctx, 'T = ' + fmt(st.T, 1) + '°C', rx - 18, ry + 6, { size: 10, color: C.T, align: 'right' });
      // 저항 토막(지그재그) — 폭이 저항 비중
      const zig = (x, wd, col, hot) => {
        if (wd < 3) return;
        ctx.save();
        ctx.strokeStyle = col; ctx.lineWidth = hot ? 3 : 2; ctx.lineJoin = 'round';
        if (hot) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.moveTo(x, ry + 16);
        const n = Math.max(3, Math.round(wd / 11));
        for (let i = 0; i < n; i++) ctx.lineTo(x + wd * (i + .5) / n, ry + 16 + (i % 2 ? 9 : -9));
        ctx.lineTo(x + wd, ry + 16); ctx.stroke(); ctx.restore();
      };
      zig(rx, w1, C.ins, hl === 'ins' || hl === 'k');
      zig(rx + w1, w2, C.hout, hl === 'hout');
      D.line(ctx, rx + rw, ry + 16, rx + rw + 16, ry + 16, { color: C.Tout, width: 2.4 });
      D.dot(ctx, rx + rw + 16, ry + 16, 4, C.Tout, hl === 'Tout');
      D.text(ctx, 'T_∞', rx + rw + 22, ry + 20, { size: 10, color: C.Tout });
      D.text(ctx, '전도 ' + fmt(ri, 2), rx + w1 / 2, ry + 42, { size: 9.5, color: C.ins, align: 'center' });
      D.text(ctx, '대류 ' + fmt(rc, 2), rx + w1 + w2 / 2, ry + 42, { size: 9.5, color: C.hout, align: 'center' });
      D.text(ctx, 'R 총합 = ' + fmt(rt, 2) + ' K/W', rx, ry + 66,
        { size: 11.5, color: hl === 'R' ? '#fff' : C.R, bold: true });
      D.text(ctx, 'τ = R·C = ' + fmt(tauOf(p) / 60, 1) + ' 분', rx, ry + 88,
        { size: 11.5, color: hl === 'tau' ? '#fff' : C.tau, bold: hl === 'tau' });
      D.text(ctx, '(화면 1초 = 실제 1분)', rx + 134, ry + 88, { size: 9.5, color: '#61719a' });
    }
  });
})();
