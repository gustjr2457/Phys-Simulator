/* [일반물리·역학과 진동] 회전 좌표계와 코리올리 힘 — a = −2ω×v
   회전하는 원판 위에서 공을 똑바로 던지면, 던진 사람 눈에는 공이 휘어 보인다.
   공에는 아무 힘도 걸리지 않았고(관성계에서는 완벽한 직선), 보는 사람이 돌고
   있을 뿐이다. 이렇게 '회전하는 좌표계에서만 나타나는 가짜 힘'이 코리올리 힘이고 —
   지구가 하루에 한 바퀴 도는 덕분에 태풍이 돌고, 해류가 휘고, 장거리 포탄과
   항로가 보정을 필요로 한다. */
(function () {
  const D = PS.D, fmt = PS.fmt, clamp = PS.clamp;
  const C = { om: '#fbbf24', v0: '#fb7185', R: '#5eead4', lat: '#60a5fa',
              acc: '#a78bfa', dev: '#f472b6' };
  const OMEGA_E = 7.292115e-5;        // 지구 자전 각속도 [rad/s]

  const tFlight = p => p.R / p.v0;                       // 가장자리까지 걸리는 시간
  const turnDeg = p => p.om * tFlight(p) * 180 / Math.PI; // 그동안 원판이 돈 각도
  const corAcc = p => 2 * p.om * p.v0;                   // 코리올리 가속도
  const fEarth = p => 2 * OMEGA_E * Math.sin(p.lat * Math.PI / 180);   // 코리올리 매개변수
  const inertialR = p => p.lat > .5 ? p.v0 / fEarth(p) : Infinity;     // 관성원 반지름 [m]

  PS.register({
    id: 'g-coriolis', mode: 'general', category: '역학과 진동',
    title: '회전 좌표계와 코리올리 힘',
    sub: 'a = −2ω×v',
    tagline: '회전판 위에서 똑바로 던진 공이 휘어 보입니다. 공에는 아무 힘도 안 걸렸고, 보는 사람이 돌고 있을 뿐입니다 — 태풍이 도는 이유가 정확히 이것입니다.',

    params: [
      { key: 'om', symbol: 'ω', label: '원판 각속도', unit: 'rad/s', min: 0, max: 3, step: .05, value: 1, color: C.om, dec: 2, reset: true,
        where: '<b>원판이 도는 빠르기</b>입니다(반시계 방향). 0이면 두 그림이 똑같아지고, 클수록 오른쪽(회전계) 궤적이 심하게 휩니다. 공에 걸리는 가짜 힘의 크기를 정합니다.' },
      { key: 'v0', symbol: 'v', label: '던지는 속도', unit: 'm/s', min: 1, max: 20, step: .5, value: 5, color: C.v0, dec: 1, reset: true,
        where: '중심에서 <b>바깥으로 던지는 속도</b>입니다. 빠를수록 금방 가장자리에 닿아 원판이 덜 돌므로 — 오히려 <b>덜 휘어 보입니다</b>.' },
      { key: 'R', symbol: 'R', label: '원판 반지름', unit: 'm', min: 2, max: 20, step: .5, value: 8, color: C.R, dec: 1, reset: true,
        where: '원판의 <b>크기</b>입니다. 크면 공이 더 오래 날아가고 그동안 원판이 더 많이 돌아, 휘는 정도가 커집니다.' },
      { key: 'lat', symbol: 'φ', label: '지구 위도 (비유용)', unit: '°', min: 0, max: 90, step: 1, value: 37, color: C.lat, dec: 0,
        where: '원판 대신 <b>지구에서라면</b> 어떨지 계산해 주는 값입니다. 코리올리 매개변수 f = 2Ω sin φ 는 적도에서 0, 극에서 최대 — 적도에서 태풍이 생기지 않는 이유입니다.' }
    ],
    vars: {
      acc: { symbol: 'a_c', label: '코리올리 가속도', unit: 'm/s²', color: C.acc,
        where: '회전계에서 공이 <b>옆으로 밀리는 가속도</b>(보라 화살표)입니다. 속도에 항상 수직이라 속력은 안 바꾸고 방향만 꺾습니다.' },
      dev: { symbol: 'Δθ', label: '편향 각도', unit: '°', color: C.dev,
        where: '공이 가장자리에 닿을 때까지 <b>원판이 돈 각도</b>입니다. 회전계에서 보면 공이 그만큼 뒤로 밀려난 것처럼 보입니다.' }
    },
    formulas: [
      { name: '코리올리 가속도 (회전계에서만)', tpl: '{acc} = 2{om}{v0}' },
      { name: '비행 시간', tpl: 't = {R} ⁄ {v0}' },
      { name: '그동안 원판이 돈 각도', tpl: '{dev} = {om} · t' },
      { name: '지구에서의 코리올리 매개변수', tpl: 'f = 2Ω sin {lat}' }
    ],

    init(p) { return { tf: 0, done: false }; },
    step(st, p, dt) {
      st.tf += dt;
      if (st.tf > tFlight(p) + .9) st.tf = 0;        // 반복 재생
    },

    graphs: [{
      title: '중심에서의 거리와 옆으로 밀린 거리', xmin: 3, window: 5, y0: 0,
      series: [
        { key: 'r', label: '중심거리 (m)', color: C.R },
        { key: 'side', label: '회전계에서 옆으로 (m)', color: C.dev }
      ]
    }],
    sample(st, p) {
      const t = Math.min(st.tf, tFlight(p));
      const r = p.v0 * t;
      // 회전계에서의 횡방향 변위 ≈ r·sin(ωt)
      return { r: r, side: r * Math.sin(p.om * t) };
    },

    readouts(st, p) {
      const tf = tFlight(p), td = turnDeg(p);
      const ir = inertialR(p), f = fEarth(p);
      return [
        { label: '비행 시간', value: tf, unit: 's', color: C.R, dec: 2 },
        { label: '원판이 돈 각도', value: td, unit: '°', color: C.dev, dec: 1 },
        { label: '원판이 돈 바퀴 수', value: td / 360, unit: '바퀴', dec: 2, color: C.om },
        { label: '코리올리 가속도 2ωv', value: corAcc(p), unit: 'm/s²', color: C.acc, dec: 2 },
        { label: '중력가속도 대비', value: corAcc(p) / 9.81 * 100, unit: '%', dec: 1, color: C.acc },
        { label: '관성계에서의 궤적', value: '완벽한 직선 (아무 힘도 안 걸린다)', wide: true, color: '#34d399' },
        { label: '회전계에서의 궤적', wide: true, color: C.dev,
          value: p.om === 0 ? '직선 (회전이 없으니 같다)' : '오른쪽으로 휜다 — 가짜 힘이 있는 것처럼 보인다' },
        { label: '── 지구에서라면 (위도 ' + fmt(p.lat, 0) + '°) ──', value: '', wide: true, color: '#4b5a80' },
        { label: '코리올리 매개변수 f', value: f * 1e5, unit: '×10⁻⁵ /s', color: C.lat, dec: 3 },
        { label: '관성원 반지름 (v/f)', value: isFinite(ir) ? ir / 1000 : Infinity, unit: 'km', dec: 1, color: C.lat },
        { label: '1시간 날아간 포탄의 편향', value: .5 * f * p.v0 * 3600 * 3600 / 1000, unit: 'km', dec: 1, color: C.dev },
        { label: '이 위도에서 태풍이', wide: true, color: p.lat < 5 ? '#fb7185' : '#34d399',
          value: p.lat < 5 ? '생기지 않는다 — 코리올리 힘이 거의 0이라 회전이 시작되지 않는다' :
                 '북반구라면 반시계 방향으로 돈다' }
      ];
    },

    notes: [
      '<b>코리올리 힘은 "진짜 힘"이 아닙니다.</b> 관성계(왼쪽 그림)에서 공은 완벽한 직선으로 날아갑니다 — 아무도 밀지 않았습니다. 휘어 보이는 것은 <b>보는 사람이 돌고 있기</b> 때문이고, 그래서 관성력·겉보기 힘이라고 부릅니다.',
      '<b>그래도 "가짜"라고 무시할 수 없습니다.</b> 우리는 돌고 있는 지구 위에 살기 때문에 날씨·해류·장거리 포격·항로를 전부 이 가짜 힘을 넣어 계산해야 합니다. 회전계에서는 이것이 실제 효과입니다.',
      '<b>속도에 항상 수직</b>이라 일을 하지 않습니다(자기력과 똑같은 구조). 속력은 그대로 두고 방향만 꺾으므로, 마찰이 없으면 <b>관성원</b>이라는 원을 그리며 돕니다 — 반지름이 v/f입니다.',
      '<b>적도에서는 코리올리 힘이 0입니다</b>(f = 2Ω sin φ). 그래서 적도 ±5° 안에서는 태풍이 만들어지지 않습니다 — 저기압이 생겨도 돌기 시작할 수가 없기 때문입니다. 위도를 0으로 내려 보세요.',
      '북반구에서는 <b>진행 방향의 오른쪽</b>으로, 남반구에서는 왼쪽으로 휩니다. 그래서 북반구 태풍은 반시계, 남반구 사이클론은 시계 방향으로 돕니다.',
      '<b>욕조 물이 코리올리 때문에 돈다는 말은 사실이 아닙니다.</b> 욕조 규모에서는 코리올리 가속도가 중력의 1000만분의 1 수준이라, 배수구 모양·물을 받은 방식 같은 것이 압도적으로 큽니다. 코리올리는 수백 km 규모에서야 지배적이 됩니다.',
      '선박 항법에서도 장거리 항해에서는 이 효과가 누적됩니다 — 자이로컴퍼스는 지구 자전을 직접 이용해 진북을 찾습니다.'
    ],
    presets: [
      { name: '기본 (ω = 1)', set: { om: 1, v0: 5, R: 8, lat: 37 } },
      { name: '회전 없음 (직선)', set: { om: 0, v0: 5, R: 8, lat: 37 } },
      { name: '빠르게 던지면 덜 휜다', set: { om: 1, v0: 20, R: 8, lat: 37 } },
      { name: '천천히 던지면 크게 휜다', set: { om: 1.5, v0: 1.5, R: 8, lat: 37 } },
      { name: '적도 (코리올리 0)', set: { om: 1, v0: 5, R: 8, lat: 0 } },
      { name: '북극 (최대)', set: { om: 1, v0: 5, R: 8, lat: 90 } }
    ],
    challenges: [
      {
        id: 'quarter', title: '4분의 1바퀴 돌리기',
        desc: '공이 날아가는 동안 원판이 90° 이상 돌게 만들어 보세요 — 회전계에서는 공이 거의 옆으로 날아간 것처럼 보입니다.',
        hint: '편향 각도 = ω·R/v 입니다. 천천히 던지거나, 빨리 돌리거나, 원판을 크게 하세요.',
        check: ({ P }) => turnDeg(P) >= 90
      },
      {
        id: 'equator', title: '적도에서는 왜 태풍이 없는가',
        desc: '위도를 3° 이하로 내려, 코리올리 매개변수가 거의 0이 되는 것을 확인하세요.',
        hint: 'f = 2Ω sin φ 이므로 φ → 0이면 f → 0입니다. 회전을 시작시킬 힘 자체가 없습니다.',
        check: ({ P }) => P.lat <= 3
      },
      {
        id: 'straight', title: '회전을 멈추면',
        desc: '각속도를 0으로 하고, 두 그림(관성계와 회전계)의 궤적이 똑같은 직선이 되는 것을 확인하세요.',
        hint: 'ω = 0이면 회전계가 곧 관성계입니다 — 코리올리 힘도 사라집니다.',
        check: ({ P }) => P.om < 1e-9
      }
    ],

    draw(ctx, st, p, ui) {
      const w = ui.w, h = ui.h, hl = ui.hl;
      const tf = Math.min(st.tf, tFlight(p));
      const cy = h * .40;
      const rad = Math.min(w * .21, h * .30);
      const PX = rad / p.R;
      const r = p.v0 * tf;                        // 중심에서의 거리
      const theta = p.om * tf;                    // 원판이 돈 각도

      const drawDisk = (cx, rot, label, sub) => {
        // 원판
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7);
        ctx.fillStyle = 'rgba(94,234,212,.05)'; ctx.fill();
        ctx.strokeStyle = 'rgba(94,234,212,.4)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        // 원판 위의 무늬(돌고 있다는 표시)
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.strokeStyle = 'rgba(147,162,196,.28)'; ctx.lineWidth = 1.2;
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); ctx.stroke();
        }
        [.35, .7].forEach(f2 => { ctx.beginPath(); ctx.arc(0, 0, rad * f2, 0, 7); ctx.stroke(); });
        // 기준 표시 (빨간 쐐기)
        ctx.fillStyle = 'rgba(251,191,36,.55)';
        ctx.beginPath(); ctx.moveTo(rad - 14, -7); ctx.lineTo(rad, 0); ctx.lineTo(rad - 14, 7); ctx.closePath(); ctx.fill();
        ctx.restore();
        D.text(ctx, label, cx, cy - rad - 26, { size: 12, color: '#e8eefc', align: 'center', bold: true });
        D.text(ctx, sub, cx, cy - rad - 10, { size: 10, color: '#61719a', align: 'center' });
        D.dot(ctx, cx, cy, 3.5, '#93a2c4', false);
      };

      const lx = w * .27, rx = w * .72;
      /* ── 왼쪽: 관성계 (하늘에서 본 모습) ── */
      drawDisk(lx, theta, '관성계 (하늘에서 본 모습)', '공은 완벽한 직선 — 원판이 돈다');
      // 직선 궤적
      ctx.save();
      ctx.strokeStyle = 'rgba(251,113,133,.75)'; ctx.lineWidth = 2.4; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(lx, cy); ctx.lineTo(lx + r * PX, cy); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.shadowColor = C.v0; ctx.shadowBlur = 14;
      D.dot(ctx, lx + r * PX, cy, 5.5, C.v0, true); ctx.restore();
      D.arrow(ctx, lx + r * PX, cy, clamp(p.v0 * 2.4, 12, 40), 0,
        { color: C.v0, width: 2.2, head: 6, hot: hl === 'v0' });
      // 회전 방향
      ctx.save(); ctx.strokeStyle = C.om; ctx.lineWidth = 2;
      if (hl === 'om') { ctx.shadowColor = C.om; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(lx, cy, rad + 14, -1.9, -.6); ctx.stroke(); ctx.restore();
      D.arrow(ctx, lx + Math.cos(-.65) * (rad + 14), cy + Math.sin(-.65) * (rad + 14), 9, 11,
        { color: C.om, width: 2, head: 6 });
      D.text(ctx, 'ω = ' + fmt(p.om, 2), lx, cy + rad + 26,
        { size: 11, color: hl === 'om' ? '#fff' : C.om, align: 'center', bold: true });

      /* ── 오른쪽: 회전계 (원판 위에서 본 모습) ── */
      drawDisk(rx, 0, '회전계 (원판 위에서 본 모습)', '공이 휜다 — 코리올리 힘이 있는 것처럼');
      // 휜 궤적: 관성계의 직선을 −θ만큼 되돌린다
      ctx.save();
      ctx.strokeStyle = hl === 'dev' ? '#f472b6' : 'rgba(244,114,182,.75)'; ctx.lineWidth = 2.4;
      if (hl === 'dev') { ctx.shadowColor = C.dev; ctx.shadowBlur = 12; }
      ctx.beginPath();
      const N = 80;
      for (let i = 0; i <= N; i++) {
        const t = tf * i / N, rr = p.v0 * t * PX, a = -p.om * t;
        const X = rx + rr * Math.cos(a), Y = cy + rr * Math.sin(a);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke(); ctx.restore();
      const bx = rx + r * PX * Math.cos(-theta), by = cy + r * PX * Math.sin(-theta);
      ctx.save(); ctx.shadowColor = C.v0; ctx.shadowBlur = 14;
      D.dot(ctx, bx, by, 5.5, C.v0, true); ctx.restore();
      // 참고: 던진 방향 직선
      D.line(ctx, rx, cy, rx + rad, cy, { color: 'rgba(147,162,196,.3)', dash: [4, 5] });
      D.text(ctx, '던진 방향', rx + rad * .55, cy - 8, { size: 9, color: '#61719a' });
      // 코리올리 가속도 화살표
      if (p.om > 0 && r > .3) {
        const vdir = -theta, nx = Math.sin(vdir), ny = -Math.cos(vdir);
        D.arrow(ctx, bx, by, nx * 28, ny * 28,
          { color: C.acc, width: 2.4, head: 7, hot: hl === 'acc', label: '2ωv', ly: -12 });
      }
      // 편향 각도 호
      if (theta > .05) {
        ctx.save(); ctx.strokeStyle = C.dev; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(rx, cy, rad * .62, -theta, 0); ctx.stroke(); ctx.restore();
        D.text(ctx, 'Δθ = ' + fmt(theta * 180 / Math.PI, 0) + '°', rx + rad * .72, cy - rad * .30,
          { size: 10.5, color: hl === 'dev' ? '#fff' : C.dev, bold: true });
      }

      /* ── 지구 비유 ── */
      const ex = 48, ey = h - 72;
      D.text(ctx, '지구에서라면 — 코리올리 매개변수 f = 2Ω sin φ', ex, ey - 10, { size: 10.5, color: '#61719a' });
      const ew = Math.min(w - 300, 300);
      D.roundRect(ctx, ex, ey, ew, 12, 5); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      ctx.save();
      for (let i = 0; i < ew; i += 3) {
        const la = i / ew * 90;
        ctx.fillStyle = 'rgba(96,165,250,' + (.12 + .55 * Math.sin(la * Math.PI / 180)) + ')';
        ctx.fillRect(ex + i, ey, 3.5, 12);
      }
      ctx.restore();
      ctx.save(); ctx.shadowColor = C.lat; ctx.shadowBlur = 10;
      D.line(ctx, ex + ew * p.lat / 90, ey - 5, ex + ew * p.lat / 90, ey + 17, { color: '#fff', width: 2.2 }); ctx.restore();
      D.text(ctx, '적도 0°', ex, ey + 28, { size: 9, color: '#4b5a80' });
      D.text(ctx, '극 90°', ex + ew, ey + 28, { size: 9, color: '#4b5a80', align: 'right' });
      D.text(ctx, '위도 ' + fmt(p.lat, 0) + '°  ·  f = ' + fmt(fEarth(p) * 1e5, 2) + '×10⁻⁵ /s  ·  관성원 ' +
        (isFinite(inertialR(p)) ? fmt(inertialR(p) / 1000, 1) + ' km' : '무한대'),
        ex + ew + 20, ey + 10, { size: 11, color: hl === 'lat' ? '#fff' : C.lat });
    }
  });
})();
