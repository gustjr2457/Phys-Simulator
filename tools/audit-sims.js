/* =========================================================
   시뮬레이션 정의 감사 (Node, 의존성 없음)
     node tools/audit-sims.js            사람이 읽는 보고
     node tools/audit-sims.js --json     JSON
   ─ 무엇을 보나 ───────────────────────────────────
   범위     기본값·프리셋 값이 슬라이더 min~max 안에 있는가, 프리셋이 없는 슬라이더 키를 쓰지 않는가
   격자     기본값·프리셋 값이 min + k·step 위에 있는가. 슬라이더(input range)는 손잡이만 격자에 맞추고
            값은 그대로 두므로, 격자 밖의 값은 사용자가 손잡이를 건드리는 순간 다른 값으로 튄다.
   과제     기본값으로 열자마자 이미 참인 도전 과제 — 사용자가 한 일이 없는데 "달성 중"으로 보인다
   극한     기본값 · 전부 최소 · 전부 최대 · 각 프리셋으로 init → 6초 step → readouts 에서 예외가 없는가
   정의 안 됨  측정값이 NaN/Infinity 인 경우 (화면에 "—"). 참고 — 이유 문구를 붙였는지 보는 용도
   격자·범위·과제·극한 중 하나라도 걸리면 종료 코드 1.
   ========================================================= */
const { loadPS, defaults } = require('./lib/load-ps');
const asJson = process.argv.includes('--json');
const { PS } = loadPS();
const DT = 1 / 480;

const out = { range: [], grid: [], challengeTrue: [], errors: [], nonFinite: [] };
const onGrid = (v, p) => {
  const step = p.step || 1, k = (v - p.min) / step;
  return Math.abs(k - Math.round(k)) < 1e-6;
};

for (const sim of PS.sims) {
  const keys = new Set(sim.params.map(p => p.key));
  const sets = [['기본', defaults(sim)]].concat((sim.presets || []).map(pr => ['프리셋 "' + pr.name + '"', Object.assign(defaults(sim), pr.set)]));

  // 범위·격자
  sim.params.forEach(p => {
    if (!onGrid(p.max, p)) out.grid.push(`${sim.id} ${p.key}: max ${p.max} 가 min ${p.min} + k·step ${p.step || 1} 위에 없다`);
  });
  (sim.presets || []).forEach(pr => Object.keys(pr.set).forEach(k => {
    if (!keys.has(k)) out.range.push(`${sim.id} 프리셋 "${pr.name}": 슬라이더에 없는 키 ${k}`);
  }));
  for (const [tag, P] of sets) sim.params.forEach(p => {
    const v = P[p.key];
    if (v < p.min || v > p.max) out.range.push(`${sim.id} ${tag}: ${p.key} = ${v} 가 범위 ${p.min}~${p.max} 밖`);
    else if (!onGrid(v, p)) out.grid.push(`${sim.id} ${tag}: ${p.key} = ${v} (min ${p.min}, step ${p.step || 1})`);
  });

  // 열자마자 참인 과제
  (sim.challenges || []).forEach(c => {
    try {
      const P = defaults(sim), st = sim.init(P); st.t = 0;
      if (c.check({ P, st, t: 0 })) out.challengeTrue.push(`${sim.id} ${c.id} (${c.title})`);
    } catch (e) { out.errors.push(`${sim.id} 과제 ${c.id}: ${e.message}`); }
  });

  // 극한 실행
  const lo = {}, hi = {};
  sim.params.forEach(p => { lo[p.key] = p.min; hi[p.key] = p.max; });
  for (const [tag, P] of sets.concat([['전부 최소', lo], ['전부 최대', hi]])) {
    try {
      const st = sim.init(P); st.t = 0;
      for (let i = 0; i < 6 * 480 && !st.done; i++) { sim.step(st, P, DT); st.t += DT; }
      sim.readouts(st, P).forEach(r => {
        if (typeof r.value === 'number' && !isFinite(r.value)) out.nonFinite.push(`${sim.id} ${tag}: "${r.label}" = ${r.value}`);
      });
      sim.sample && sim.sample(st, P);
    } catch (e) { out.errors.push(`${sim.id} ${tag}: ${e.message}`); }
  }
}

const bad = out.range.length + out.grid.length + out.challengeTrue.length + out.errors.length;
if (asJson) console.log(JSON.stringify(out, null, 1));
else {
  const sec = (t, a) => { console.log(`\n${t} — ${a.length}`); a.forEach(x => console.log('  ' + x)); };
  sec('범위 밖', out.range); sec('격자 밖', out.grid); sec('열자마자 참인 과제', out.challengeTrue);
  sec('극한 실행 예외', out.errors); sec('정의 안 되는 측정값 (참고)', out.nonFinite);
  console.log(`\n시뮬레이션 ${PS.sims.length}종 — ${bad ? '고칠 것 ' + bad + '건' : '통과'}`);
}
process.exit(bad ? 1 : 0);
