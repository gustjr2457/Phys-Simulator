/* =========================================================
   PhysLab core — 시뮬레이션 등록기 + 캔버스 드로잉 헬퍼
   ========================================================= */
const PS = (function () {
  const sims = [];
  const byId = Object.create(null);

  /* 계측기 팔레트 — 기호 색은 여기서만 정의한다.
     시뮬레이션의 const C = {...} 는 이 이름들을 가리키고,
     테마를 바꿀 때는 이 표 하나만 갈아끼우면 된다.
     원색을 쓰지 않는 것이 이 테마의 규칙이다. */
  const PAL = {
    amber:  '#ffb020',   // 강조 — 결과값, 주목시킬 양
    steel:  '#6f9fc4',   // 입력 — 속도·거리처럼 사용자가 미는 양
    sage:   '#7fb894',   // 누적 — 적분된 양, 에너지
    rust:   '#c4705f',   // 손실 — 저항·감쇠·마찰
    violet: '#a98cc4',   // 초기조건 — 처음에 주어지는 양
    teal:   '#68b8b0',   // 파동·장
    dusty:  '#c08098',   // 보조 비교값
    burnt:  '#d1824a',   // 열·온도
    ink:    '#e6e7ea',   // 글자 1단계
    ink2:   '#9a9da6',   // 글자 2단계
    ink3:   '#6a6e78',   // 글자 3단계 — 눈금, 캡션
    line:   '#4a4d55',   // 보조선
    stage:  '#0a0b0c'    // 무대 바탕
  };

  function register(def) {
    def.params = def.params || [];
    def.vars = def.vars || {};
    // 파라미터도 공식의 '항'이므로 vars 사전에 합쳐 둔다
    def.params.forEach(p => {
      def.vars[p.key] = Object.assign({
        key: p.key, symbol: p.symbol || p.key, label: p.label,
        unit: p.unit, color: p.color, where: p.where, isParam: true
      }, def.vars[p.key] || {});
    });
    Object.keys(def.vars).forEach(k => {
      const v = def.vars[k];
      v.key = k;
      v.symbol = v.symbol || k;
      v.color = v.color || '#9a9da6';
    });
    sims.push(def);
    byId[def.id] = def;
  }

  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;

  function fmt(v, d) {
    if (!isFinite(v)) return '—';
    if (d === undefined) d = Math.abs(v) >= 100 ? 0 : (Math.abs(v) >= 10 ? 1 : 2);
    const s = v.toFixed(d);
    return (s === '-0' || s === '-0.0' || s === '-0.00') ? s.slice(1) : s;
  }

  /* ── 좌표계: 미터 → 픽셀 (y축은 위가 +) ─────────────── */
  function view(w, h, box) {
    const pad = box.pad === undefined ? 24 : box.pad;
    const sx = (w - pad * 2) / (box.x1 - box.x0);
    const sy = (h - pad * 2) / (box.y1 - box.y0);
    const s = box.uniform === false ? null : Math.min(sx, sy);
    const kx = s || sx, ky = s || sy;
    const ox = pad + ((w - pad * 2) - (box.x1 - box.x0) * kx) / 2;
    const oy = pad + ((h - pad * 2) - (box.y1 - box.y0) * ky) / 2;
    return {
      k: kx,
      X: x => ox + (x - box.x0) * kx,
      Y: y => h - oy - (y - box.y0) * ky,
      S: L => L * kx,
      SY: L => L * ky
    };
  }

  /* ── 드로잉 헬퍼 ─────────────────────────────────── */
  /* 라벨이 캔버스 가장자리에서 잘리지 않게 안쪽으로 밀어 넣는다.
     단, 기준점(x, y)이 화면에서 멀리(24px 넘게) 벗어나 있으면 그 라벨은 화면 밖 물체에 붙어 있는
     것이므로 그대로 둔다 — 가장자리에 남겨 두면 "보이지 않는 것"을 가리키는 엉뚱한 라벨이 된다.
     경계 바로 바깥은 낮은 캔버스에서 레이아웃이 살짝 밀린 경우라 안으로 끌어들인다.
     계산은 기기 픽셀(변환 적용 후)에서 하고, 결과는 지역 좌표의 이동량으로 돌려준다. */
  function keepIn(ctx, x, y, x0, x1, y0, y1) {
    const tr = ctx.getTransform();
    if (Math.abs(tr.b) > 1e-6 || Math.abs(tr.c) > 1e-6 || !tr.a || !tr.d) return [0, 0];   // 회전된 글자
    const W = ctx.canvas.width, H = ctx.canvas.height, M = 3 * Math.abs(tr.a), T = 24 * Math.abs(tr.a);
    const ax = tr.a * x + tr.e, ay = tr.d * y + tr.f;
    if (ax < -T || ax > W + T || ay < -T || ay > H + T) return [0, 0];
    const X0 = tr.a * x0 + tr.e, X1 = tr.a * x1 + tr.e, Y0 = tr.d * y0 + tr.f, Y1 = tr.d * y1 + tr.f;
    let dx = 0, dy = 0;
    if (X1 > W - M) dx = W - M - X1;
    if (X0 + dx < M) dx = M - X0;
    if (Y1 > H - M) dy = H - M - Y1;
    if (Y0 + dy < M) dy = M - Y0;
    return [dx / tr.a, dy / tr.d];
  }

  /* 좁은 캔버스(폰)용 라벨 충돌 회피.
     데스크톱 배치로 짠 라벨들이 폭 430px 남짓에서 서로 부딪히는 것을 막는다.
     앱이 무대 캔버스에서만, 논리 폭이 600 미만일 때만 ctx.__labels 를 켠다 — 데스크톱 그림은 그대로다.
     새 라벨이 앞서 그린 라벨과 겹치면 위아래로 한 줄씩(최대 두 줄) 비켜 보고, 빈자리가 없으면 그대로 둔다. */
  function avoidLabels(ctx, x0, x1, y0, y1, t) {
    const L = ctx.__labels;
    if (!L) return 0;
    const tr = ctx.getTransform();
    if (Math.abs(tr.b) > 1e-6 || Math.abs(tr.c) > 1e-6 || !tr.d) return 0;
    const box = dy => ({ x0: tr.a * x0 + tr.e, x1: tr.a * x1 + tr.e, y0: tr.d * (y0 + dy) + tr.f, y1: tr.d * (y1 + dy) + tr.f });
    const hits = b => L.some(o => !(o.t === t && Math.abs(o.x0 - b.x0) < 2 && Math.abs(o.y0 - b.y0) < 2) &&
      Math.min(o.x1, b.x1) - Math.max(o.x0, b.x0) > 1 && Math.min(o.y1, b.y1) - Math.max(o.y0, b.y0) > 1);
    const H = ctx.canvas.height, line = (y1 - y0) + 3;
    let dy = 0;
    if (hits(box(0))) {
      for (const k of [1, -1, 2, -2]) {
        const b = box(k * line);
        if (b.y0 >= 0 && b.y1 <= H && !hits(b)) { dy = k * line; break; }
      }
    }
    const f = box(dy); f.t = t; L.push(f);
    return dy;
  }

  const D = {
    bg(ctx, w, h) { ctx.clearRect(0, 0, w, h); },

    grid(ctx, w, h, step, color) {
      ctx.save();
      ctx.strokeStyle = color || 'rgba(255,255,255,.035)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
      for (let y = 0; y < h; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); }
      ctx.stroke();
      ctx.restore();
    },

    /* 화살표 (x,y)에서 (x+dx,y+dy)로 */
    arrow(ctx, x, y, dx, dy, o) {
      o = o || {};
      const len = Math.hypot(dx, dy);
      if (len < .8) return;
      const col = o.color || '#fff';
      const wdt = (o.width || 3) * (o.hot ? 1.5 : 1);
      const head = Math.min(o.head || 11, len * .5) * (o.hot ? 1.25 : 1);
      const ux = dx / len, uy = dy / len;
      ctx.save();
      if (o.hot) { ctx.shadowColor = col; ctx.shadowBlur = 14; }
      ctx.strokeStyle = col; ctx.fillStyle = col;
      ctx.lineWidth = wdt; ctx.lineCap = 'round';
      if (o.dash) ctx.setLineDash(o.dash);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ux * (len - head * .85), y + uy * (len - head * .85));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x + dx, y + dy);
      ctx.lineTo(x + dx - ux * head - uy * head * .45, y + dy - uy * head + ux * head * .45);
      ctx.lineTo(x + dx - ux * head + uy * head * .45, y + dy - uy * head - ux * head * .45);
      ctx.closePath(); ctx.fill();
      if (o.label) {
        const lx = x + dx / 2 + (o.lx || 0), ly = y + dy / 2 + (o.ly || -12);
        D.tag(ctx, o.label, lx, ly, col, o.hot);
      }
      ctx.restore();
    },

    /* 배경이 있는 작은 라벨 */
    tag(ctx, text, x, y, color, hot, align) {
      ctx.save();
      ctx.font = (hot ? 'bold ' : '') + '12px "Malgun Gothic",sans-serif';
      const w = ctx.measureText(text).width + 12;
      const h = 19;
      let tx = x - w / 2;
      if (align === 'left') tx = x;
      if (align === 'right') tx = x - w;
      const k = keepIn(ctx, x, y, tx, tx + w, y - h / 2, y + h / 2);
      tx += k[0]; y += k[1];
      y += avoidLabels(ctx, tx, tx + w, y - h / 2, y + h / 2, text);
      D.roundRect(ctx, tx, y - h / 2, w, h, 6);
      ctx.fillStyle = 'rgba(13,14,16,.88)'; ctx.fill();
      ctx.strokeStyle = color; ctx.globalAlpha = hot ? 1 : .5; ctx.lineWidth = 1; ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, tx + w / 2, y + .5);
      ctx.restore();
    },

    text(ctx, t, x, y, o) {
      o = o || {};
      ctx.save();
      ctx.font = (o.bold ? 'bold ' : '') + (o.size || 12) + 'px ' + (o.mono ? 'Consolas,monospace' : '"Malgun Gothic",sans-serif');
      ctx.fillStyle = o.color || '#9a9da6';
      ctx.textAlign = o.align || 'left';
      ctx.textBaseline = o.base || 'alphabetic';
      if (o.glow) { ctx.shadowColor = o.color; ctx.shadowBlur = 10; }
      if (o.keep !== false) {
        const m = ctx.measureText(t), al = ctx.textAlign;
        const lx = al === 'center' ? x - m.width / 2 : (al === 'right' || al === 'end') ? x - m.width : x;
        const k = keepIn(ctx, x, y, lx, lx + m.width, y - m.actualBoundingBoxAscent, y + m.actualBoundingBoxDescent);
        x += k[0]; y += k[1];
        y += avoidLabels(ctx, lx + k[0], lx + k[0] + m.width, y - m.actualBoundingBoxAscent, y + m.actualBoundingBoxDescent, t);
      }
      ctx.fillText(t, x, y);
      ctx.restore();
    },

    roundRect(ctx, x, y, w, h, r) {
      r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },

    line(ctx, x1, y1, x2, y2, o) {
      o = o || {};
      ctx.save();
      ctx.strokeStyle = o.color || 'rgba(255,255,255,.25)';
      ctx.lineWidth = o.width || 1;
      if (o.dash) ctx.setLineDash(o.dash);
      if (o.hot) { ctx.shadowColor = o.color; ctx.shadowBlur = 10; }
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
    },

    dot(ctx, x, y, r, color, hot) {
      ctx.save();
      if (hot) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      ctx.restore();
    },

    /* 양쪽 화살표 치수선 */
    dim(ctx, x1, y1, x2, y2, label, color, hot) {
      const dx = x2 - x1, dy = y2 - y1;
      D.arrow(ctx, x1, y1, dx, dy, { color, width: 1.5, head: 8, hot });
      D.arrow(ctx, x2, y2, -dx, -dy, { color, width: 1.5, head: 8, hot });
      if (label) D.tag(ctx, label, (x1 + x2) / 2, (y1 + y2) / 2, color, hot);
    },

    /* 가로 막대그래프 (에너지·운동량 비교용) */
    bar(ctx, x, y, w, h, v, max, color, label, hot) {
      D.roundRect(ctx, x, y, w, h, 4);
      ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
      const f = max > 0 ? clamp(Math.abs(v) / max, 0, 1) : 0;
      if (f > 0.002) {
        ctx.save();
        if (hot) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
        D.roundRect(ctx, x, y, w * f, h, 4);
        ctx.fillStyle = color; ctx.globalAlpha = hot ? 1 : .85; ctx.fill();
        ctx.restore();
      }
      if (label) D.text(ctx, label, x, y - 5, { size: 11, color: hot ? '#fff' : color, bold: hot });
    },

    /* 코일 스프링 */
    spring(ctx, x1, y1, x2, y2, o) {
      o = o || {};
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L, px = -uy, py = ux;
      const n = o.coils || 8, amp = o.amp || 11, lead = Math.min(14, L * .18);
      ctx.save();
      ctx.strokeStyle = o.color || '#9a9da6';
      ctx.lineWidth = o.hot ? 3.4 : 2.2;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (o.hot) { ctx.shadowColor = o.color; ctx.shadowBlur = 12; }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
      const seg = (L - lead * 2) / n;
      for (let i = 0; i < n; i++) {
        const s = lead + seg * (i + .5), e = lead + seg * (i + 1);
        const side = i % 2 ? -1 : 1;
        ctx.lineTo(x1 + ux * s + px * amp * side, y1 + uy * s + py * amp * side);
        ctx.lineTo(x1 + ux * e, y1 + uy * e);
      }
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    },

    /* 점성 감쇠기(대시포트) */
    dashpot(ctx, x1, y1, x2, y2, o) {
      o = o || {};
      const col = o.color || '#9a9da6';
      const L = y2 - y1, w = o.width || 16;
      ctx.save();
      ctx.strokeStyle = col; ctx.lineWidth = o.hot ? 3 : 2; ctx.lineCap = 'round';
      if (o.hot) { ctx.shadowColor = col; ctx.shadowBlur = 12; }
      const top = y1 + L * .3, bot = y2 - L * .12;
      ctx.beginPath();                       // 실린더 (ㄷ 모양)
      ctx.moveTo(x1 - w, top - 6); ctx.lineTo(x1 - w, bot); ctx.lineTo(x1 + w, bot); ctx.lineTo(x1 + w, top - 6);
      ctx.stroke();
      ctx.beginPath();                       // 위 연결봉 + 피스톤
      ctx.moveTo(x1, y1); ctx.lineTo(x1, top + L * .12);
      ctx.moveTo(x1 - w * .8, top + L * .12); ctx.lineTo(x1 + w * .8, top + L * .12);
      ctx.moveTo(x1, y2); ctx.lineTo(x1, bot);
      ctx.stroke();
      ctx.globalAlpha = .18; ctx.fillStyle = col;
      ctx.fillRect(x1 - w, top - 6, w * 2, bot - top + 6);
      ctx.restore();
    },

    /* 다각형 */
    poly(ctx, pts, o) {
      o = o || {};
      if (!pts.length) return;
      ctx.save();
      if (o.hot && o.stroke) { ctx.shadowColor = o.stroke; ctx.shadowBlur = 14; }
      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 2; ctx.stroke(); }
      ctx.restore();
    },

    /* 지면 해칭 */
    ground(ctx, x0, x1, y, offset) {
      ctx.save();
      ctx.strokeStyle = 'rgba(167,170,176,.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.strokeStyle = 'rgba(167,170,176,.2)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      const step = 16;
      let s = -((offset || 0) % step);
      for (let x = x0 + s - step; x < x1 + step; x += step) {
        ctx.moveTo(x, y); ctx.lineTo(x - 9, y + 11);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  /* ── 미니 그래프 ─────────────────────────────────── */
  function drawGraph(ctx, w, h, g, hist, hlKey) {
    ctx.clearRect(0, 0, w, h);
    const L = 34, R = 8, T = 8, B = 18;
    const pw = w - L - R, ph = h - T - B;
    // x축: 기본은 시간, xKey를 주면 그 값(예: 하중)을 x축으로 쓴다
    const xOf = g.xKey ? (p => p[g.xKey]) : (p => p.t);
    const keep = g.xKey ? (() => true) : (p => p.t >= x0);
    let x0 = 0, xmax;
    if (g.xKey) {
      x0 = Infinity; xmax = -Infinity;
      hist.forEach(p => { const v = xOf(p); if (isFinite(v)) { x0 = Math.min(x0, v); xmax = Math.max(xmax, v); } });
      if (!isFinite(x0)) { x0 = 0; xmax = 1; }
      if (g.xMin !== undefined) x0 = Math.min(x0, g.xMin);
      if (g.xMax !== undefined) xmax = Math.max(xmax, g.xMax);
      if (xmax - x0 < 1e-9) xmax = x0 + 1;
    } else {
      const tLast = hist.length ? hist[hist.length - 1].t : 0;
      xmax = Math.max(tLast, g.xmin || 4);
      if (g.window) { x0 = Math.max(0, tLast - g.window); xmax = x0 + g.window; }
    }

    let ymin = Infinity, ymax = -Infinity;
    hist.forEach(p => {
      if (!keep(p)) return;
      g.series.forEach(s => {
        const v = p[s.key];
        if (typeof v === 'number' && isFinite(v)) { ymin = Math.min(ymin, v); ymax = Math.max(ymax, v); }
      });
    });
    if (!isFinite(ymin)) { ymin = 0; ymax = 1; }
    if (g.y0 !== undefined) ymin = Math.min(ymin, g.y0);
    if (Math.abs(ymax - ymin) < 1e-6) { ymax = ymin + 1; }
    const m = (ymax - ymin) * .12; ymin -= m; ymax += m;

    const X = t => L + ((t - x0) / (xmax - x0)) * pw;
    const Y = v => T + ph - ((v - ymin) / (ymax - ymin)) * ph;

    // 격자 + 축
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) { const y = T + ph * i / 4; ctx.moveTo(L, y); ctx.lineTo(L + pw, y); }
    ctx.stroke();
    if (ymin < 0 && ymax > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.22)';
      ctx.beginPath(); ctx.moveTo(L, Y(0)); ctx.lineTo(L + pw, Y(0)); ctx.stroke();
    }
    ctx.restore();
    D.text(ctx, fmt(ymax, 1), L - 5, T + 8, { size: 9.5, color: '#6a6e78', align: 'right' });
    D.text(ctx, fmt(ymin, 1), L - 5, T + ph, { size: 9.5, color: '#6a6e78', align: 'right' });
    D.text(ctx, fmt(x0, 1), L, h - 5, { size: 9.5, color: '#6a6e78' });
    const xUnit = g.xUnit === undefined ? 's' : g.xUnit;   // 빈 문자열이면 단위 없이
    D.text(ctx, fmt(xmax, 1) + (xUnit ? ' ' + xUnit : ''), L + pw, h - 5, { size: 9.5, color: '#6a6e78', align: 'right' });

    g.series.forEach(s => {
      const hot = hlKey === s.key;
      ctx.save();
      ctx.strokeStyle = s.color; ctx.lineWidth = hot ? 2.6 : 1.8;
      ctx.lineJoin = 'round';
      if (hot) { ctx.shadowColor = s.color; ctx.shadowBlur = 10; }
      ctx.beginPath();
      let started = false;
      hist.forEach(p => {
        const v = p[s.key];
        if (!keep(p) || typeof v !== 'number' || !isFinite(v)) return;
        const x = X(xOf(p)), y = Y(v);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
      const last = hist[hist.length - 1];
      if (last && typeof last[s.key] === 'number') D.dot(ctx, X(xOf(last)), Y(last[s.key]), 3, s.color, hot);
    });
  }

  return { register, sims, byId, view, D, drawGraph, fmt, clamp, lerp, PAL };
})();
