/* =========================================================
   시뮬레이션 정의 감사 (Node, 의존성 없음)
     node tools/audit-sims.js            사람이 읽는 보고
     node tools/audit-sims.js --json     JSON
   ─ 무엇을 보나 ───────────────────────────────────
   범위     기본값·프리셋 값이 슬라이더 min~max 안에 있는가, 프리셋이 없는 슬라이더 키를 쓰지 않는가
   격자     기본값·프리셋 값이 min + k·step 위에 있는가. 슬라이더(input range)는 손잡이만 격자에 맞추고
            값은 그대로 두므로, 격자 밖의 값은 사용자가 손잡이를 건드리는 순간 다른 값으로 튄다.
   과제     기본값으로 열자마자 이미 참인 도전 과제 — 사용자가 한 일이 없는데 "달성 중"으로 보인다
   달성     과제마다 슬라이더 범위 안에서 참이 되는 값 조합이 실제로 있는가 — 프리셋·격자 위 무작위 값으로 찾고,
            못 찾으면 시뮬레이션을 돌려(시간이 지나야 참이 되는 과제) 찾는다. 마지막으로 tools/challenge-witness.json 의 예시 값
   공식     공식 템플릿의 {기호}가 모두 params/vars 에 있는가
   극한     기본값 · 전부 최소 · 전부 최대 · 각 프리셋으로 init → 6초 step → readouts 에서 예외가 없는가
   정의 안 됨  측정값이 NaN/Infinity 인 경우 (화면에 "—"). 참고 — 이유 문구를 붙였는지 보는 용도
   격자·범위·과제·극한 중 하나라도 걸리면 종료 코드 1.
   ========================================================= */
const { loadPS, defaults } = require('./lib/load-ps');
const asJson = process.argv.includes('--json');
// --strict <id> — 새 시뮬레이션: 숫자 측정값의 NaN·Infinity 와 상태(st)의 NaN 을 "참고"가 아니라 실패로 친다
const strictId = process.argv.includes('--strict') ? process.argv[process.argv.indexOf('--strict') + 1] : null;
// 상태 안의 NaN — 숫자 필드, 숫자 배열, 한 단계 아래 객체까지 (자취 점 {x, y} 같은 것)
function nanIn(st) {
  const bad = [];
  const look = (v, k) => {
    if (typeof v === 'number') { if (Number.isNaN(v)) bad.push(k); }
    else if (Array.isArray(v)) v.slice(-50).forEach((x, i) => typeof x === 'number' ? look(x, k + '[' + i + ']') : (x && typeof x === 'object' && Object.entries(x).forEach(([kk, vv]) => typeof vv === 'number' && look(vv, k + '[' + i + '].' + kk))));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([kk, vv]) => typeof vv === 'number' && look(vv, k + '.' + kk));
  };
  Object.entries(st).forEach(([k, v]) => look(v, k));
  return bad;
}
const { PS } = loadPS();
const DT = 1 / 480;

const out = { range: [], grid: [], challengeTrue: [], unreachable: [], formula: [], errors: [], nonFinite: [], strict: [], reached: 0 };
const WITNESS = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'challenge-witness.json'), 'utf8'));
// 결과가 실행마다 같도록 시드 고정 난수
let seed = 20261117;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const onGridRandom = p => { const step = p.step || 1, n = Math.floor((p.max - p.min) / step + 1e-9); return +(p.min + step * Math.floor(rnd() * (n + 1))).toFixed(10); };
const safe = (c, P, st) => { try { return !!c.check({ P, st, t: st.t }); } catch (e) { return false; } };
// 과제가 참이 되는 값 조합 찾기: ① 값만으로(초기 상태) ② 시뮬레이션을 돌려서
function reachable(sim, c) {
  const sets = (sim.presets || []).map(pr => Object.assign(defaults(sim), pr.set));
  for (let i = 0; i < 4000; i++) { const P = {}; sim.params.forEach(p => P[p.key] = onGridRandom(p)); sets.push(P); }
  for (const P of sets) { const st = sim.init(P); st.t = 0; if (safe(c, P, st)) return { how: '값', P }; }
  const w = WITNESS[sim.id + '/' + c.id];
  const runs = (w ? [Object.assign(defaults(sim), w)] : []).concat(sets.slice(0, (sim.presets || []).length + 30));
  for (const P of runs) {
    const st = sim.init(P); st.t = 0;
    for (let i = 1; i <= 150 * 480 && !st.done; i++) {
      sim.step(st, P, DT); st.t += DT;
      if (i % 240 === 0 && safe(c, P, st)) return { how: '실행 ' + st.t.toFixed(0) + '초', P };
    }
    if (safe(c, P, st)) return { how: '실행 끝', P };
  }
  return null;
}
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
    const r = reachable(sim, c);
    if (r) out.reached++; else out.unreachable.push(`${sim.id} ${c.id} (${c.title})`);
  });

  // 공식 템플릿의 기호
  (sim.formulas || []).forEach(f => {
    for (const m of f.tpl.matchAll(/\{(\w+)\}/g)) if (!(sim.vars || {})[m[1]]) out.formula.push(`${sim.id} "${f.name}": {${m[1]}} 가 params/vars 에 없다`);
  });

  // 극한 실행
  const lo = {}, hi = {};
  sim.params.forEach(p => { lo[p.key] = p.min; hi[p.key] = p.max; });
  for (const [tag, P] of sets.concat([['전부 최소', lo], ['전부 최대', hi]])) {
    try {
      const st = sim.init(P); st.t = 0;
      for (let i = 0; i < 6 * 480 && !st.done; i++) { sim.step(st, P, DT); st.t += DT; }
      sim.readouts(st, P).forEach(r => {
        if (typeof r.value === 'number' && !isFinite(r.value)) {
          out.nonFinite.push(`${sim.id} ${tag}: "${r.label}" = ${r.value}`);
          if (sim.id === strictId) out.strict.push(`${tag}: 측정값 "${r.label}" = ${r.value} — 정의되지 않으면 이유를 문자열로`);
        }
      });
      const smp = sim.sample && sim.sample(st, P);
      if (sim.id === strictId) {
        nanIn(st).slice(0, 3).forEach(k => out.strict.push(`${tag}: 상태 st.${k} = NaN`));
        if (smp) Object.entries(smp).forEach(([k, v]) => typeof v === 'number' && Number.isNaN(v) && out.strict.push(`${tag}: 그래프 표본 ${k} = NaN`));
      }
    } catch (e) { out.errors.push(`${sim.id} ${tag}: ${e.message}`); }
  }
}

if (strictId && !PS.byId[strictId]) out.strict.push(`--strict: "${strictId}" 가 없다`);
const bad = out.range.length + out.grid.length + out.challengeTrue.length + out.unreachable.length + out.formula.length + out.errors.length + out.strict.length;
if (asJson) console.log(JSON.stringify(out, null, 1));
else {
  const sec = (t, a) => { console.log(`\n${t} — ${a.length}`); a.forEach(x => console.log('  ' + x)); };
  sec('범위 밖', out.range); sec('격자 밖', out.grid); sec('열자마자 참인 과제', out.challengeTrue);
  sec(`달성할 수 없는 과제 (달성 가능 ${out.reached}개)`, out.unreachable); sec('공식의 없는 기호', out.formula);
  sec('극한 실행 예외', out.errors); sec('정의 안 되는 측정값 (참고)', out.nonFinite);
  if (strictId) sec(`새 시뮬레이션 ${strictId}: NaN·Infinity`, out.strict);
  console.log(`\n시뮬레이션 ${PS.sims.length}종 — ${bad ? '고칠 것 ' + bad + '건' : '통과'}`);
}
process.exit(bad ? 1 : 0);
