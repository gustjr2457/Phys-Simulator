/* =========================================================
   PhysLab 시뮬레이션 검사 (Node, 의존성 없음)
     node tools/test-sims.js                  전체 스모크 + 물리 검증 + 설명 점검(경고만)
     node tools/test-sims.js --strict <id>    <id> 는 설명 점검을 "실패"로 취급하고 물리 검증이 반드시 있어야 한다
     node tools/test-sims.js --list           등록된 시뮬레이션 목록
     node tools/test-sims.js --json           결과를 JSON 으로
   ─ 무엇을 보나 ───────────────────────────────────
   스모크      모든 시뮬레이션 × 모든 프리셋을 4초 진행하며 init · step · readouts · sample 가
               예외를 던지지 않는지 (그리기는 브라우저 점검이 맡는다). 측정값의 NaN/Infinity 는
               화면에 "—" 로 나오고 물리적으로 정의되지 않는 경우(초점의 상거리, 탈출 궤도의 주기)가
               있어 참고로만 기록한다.
   물리 검증   tests/physics/<id>.js 의 각 항목 — 시뮬레이션이 낸 값을 독립적으로 계산한 값과 비교
   설명 점검   중학생이 이해할 수 있게 하는 요소가 빠짐없이 있는가 (아래 lint 참고)
   ========================================================= */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const strictId = args.includes('--strict') ? args[args.indexOf('--strict') + 1] : null;
const asJson = args.includes('--json');

/* ── 1. index.html 의 순서대로 core.js 와 시뮬레이션을 vm 안에 싣는다 ── */
function loadPS() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]).filter(f => f !== 'js/app.js');   // app.js 는 화면 전용
  const ctx = vm.createContext({ console, Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite, isNaN, parseFloat, parseInt });
  for (const f of files) {
    let src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (f === 'js/core.js') src = src.replace(/^const PS = /m, 'var PS = ');   // vm 전역으로 꺼내기
    vm.runInContext(src, ctx, { filename: f });
  }
  return { PS: ctx.PS, files };
}

/* ── 2. 설명 점검 — 기준 2(중학생 이해)의 기계적으로 확인할 수 있는 부분 ──
   사람의 판단이 필요한 부분(비유가 적절한가, 말이 쉬운가)은 절차서(SKILL.md)에서 화면과 함께 본다. */
const HANGUL = /[가-힣]/;
function lint(sim) {
  const E = [];
  const need = (c, m) => { if (!c) E.push(m); };
  need(sim.id && /^[a-z0-9-]+$/.test(sim.id), 'id 는 영소문자·숫자·하이픈');
  need(sim.title && HANGUL.test(sim.title), '제목은 한국어');
  need(sim.sub && sim.sub.length <= 40, '부제(sub)는 40자 이하');
  need(sim.tagline && HANGUL.test(sim.tagline) && sim.tagline.length >= 20 && sim.tagline.length <= 120,
    '한 줄 설명(tagline)은 20~120자 한국어 — 무엇을 보게 되는지 한 문장으로');
  need((sim.params || []).length >= 1 && sim.params.length <= 5, '슬라이더는 1~5개 (많으면 중학생이 길을 잃는다)');
  (sim.params || []).forEach(p => {
    need(p.label && HANGUL.test(p.label), `슬라이더 ${p.key}: 한국어 이름`);
    need(p.where && p.where.length >= 15, `슬라이더 ${p.key}: where(화면 어디에서 작용하는지) 15자 이상`);
    need(p.min < p.max && p.value >= p.min && p.value <= p.max, `슬라이더 ${p.key}: min ≤ value ≤ max`);
  });
  const vars = sim.vars || {};
  (sim.formulas || []).forEach(f => {
    for (const m of f.tpl.matchAll(/\{(\w+)\}/g)) {
      const v = vars[m[1]];
      need(v, `공식 "${f.name}": {${m[1]}} 가 vars/params 에 없다`);
      if (v) need(v.where && v.where.length >= 15, `공식 기호 ${m[1]}: where 설명 15자 이상`);
    }
  });
  need((sim.formulas || []).length >= 1, '공식 1개 이상');
  need((sim.notes || []).length >= 3 && sim.notes.length <= 6, '"이것만은 알아두기" 3~6개');
  (sim.notes || []).forEach((n, i) => need(n.replace(/<[^>]+>/g, '').length <= 140, `알아두기 ${i + 1}: 140자 이하`));
  need((sim.presets || []).length >= 2, '프리셋 2개 이상 (눌러 보며 비교할 수 있게)');
  need((sim.challenges || []).length >= 2, '도전 과제 2개 이상');
  (sim.challenges || []).forEach(c => need(c.hint && c.desc, `과제 ${c.id}: 설명과 힌트`));
  need(typeof sim.readouts === 'function', '측정값(readouts)');
  // 글자는 D.text · D.tag 로 — 그래야 가장자리 밀어 넣기·충돌 회피·글자 층·헤일로를 받는다
  need(!/ctx\.fillText\s*\(/.test(String(sim.draw)), '그리기에서 ctx.fillText 직접 사용 금지 — D.text 를 쓴다');
  return E;
}

/* ── 3. 스모크 ── */
const DT = 1 / 480;
function smoke(PS, sim) {
  const errs = [], info = [];
  for (const pre of [null].concat(sim.presets || [])) {
    const tag = pre ? pre.name : '기본';
    try {
      const P = {}; sim.params.forEach(p => P[p.key] = p.value);
      if (pre) Object.assign(P, pre.set);
      const st = sim.init(P); st.t = 0;
      for (let i = 1; i <= 1920 && !st.done; i++) {
        sim.step(st, P, DT); st.t += DT;
        if (i % 480 === 0) {
          const rows = sim.readouts(st, P);
          rows.forEach(r => { if (typeof r.value === 'number' && !isFinite(r.value))
            info.push(`${tag}: "${r.label}" = ${r.value}`); });
          sim.sample && sim.sample(st, P);
        }
      }
    } catch (e) { errs.push(`${tag}: ${e.message}`); }
  }
  return { errs: [...new Set(errs)], info: [...new Set(info)] };
}

/* ── 4. 물리 검증 ── tests/physics/<id>.js
   module.exports = [{ name, set: {...}, run: 초, check({ sim, st, P, ro, near }) → null(통과) | '실패 이유' }]
   ro('측정값 이름') 은 readouts 의 값. near(실제, 기대, 상대오차) 는 벗어나면 이유 문자열. */
function near(a, b, rel = .01, abs = 1e-9) {
  return Math.abs(a - b) <= Math.max(abs, Math.abs(b) * rel) ? null : `${+a.toPrecision(6)} ≠ 기대 ${+b.toPrecision(6)} (허용 ${rel * 100}%)`;
}
function physics(PS, id) {
  const f = path.join(ROOT, 'tests', 'physics', id + '.js');
  if (!fs.existsSync(f)) return null;
  delete require.cache[f];
  const cases = require(f), sim = PS.byId[id], out = [];
  for (const c of cases) {
    try {
      const P = {}; sim.params.forEach(p => P[p.key] = p.value); Object.assign(P, c.set || {});
      const st = sim.init(P); st.t = 0;
      const n = Math.round((c.run || 0) / DT);
      for (let i = 0; i < n && !st.done; i++) { sim.step(st, P, DT); st.t += DT; }
      const rows = sim.readouts(st, P);
      const ro = label => { const r = rows.find(r => r.label === label); if (!r) throw new Error(`측정값 "${label}" 없음`); return r.value; };
      const why = c.check({ sim, st, P, ro, near });
      out.push({ name: c.name, ok: !why, why });
    } catch (e) { out.push({ name: c.name, ok: false, why: e.message }); }
  }
  return out;
}

/* ── 실행 ── */
const { PS } = loadPS();
if (args.includes('--list')) {
  PS.sims.forEach(s => console.log([s.mode || 'basic', s.category, s.id, s.title].join(' | ')));
  process.exit(0);
}
const report = { sims: PS.sims.length, smoke: {}, nonFinite: {}, lintWarn: {}, physics: {}, strict: strictId, fail: [], presetNames: {} };
if (strictId && PS.byId[strictId]) report.presetNames[strictId] = (PS.byId[strictId].presets || []).map(p => p.name);
for (const sim of PS.sims) {
  const sm = smoke(PS, sim);
  if (sm.errs.length) { report.smoke[sim.id] = sm.errs; report.fail.push(`스모크 ${sim.id}: ${sm.errs[0]}`); }
  if (sm.info.length) report.nonFinite[sim.id] = sm.info;
  const l = lint(sim); if (l.length) report.lintWarn[sim.id] = l;
  const ph = physics(PS, sim.id);
  if (ph) { report.physics[sim.id] = ph; ph.filter(c => !c.ok).forEach(c => report.fail.push(`물리 ${sim.id} — ${c.name}: ${c.why}`)); }
}
if (strictId) {
  if (!PS.byId[strictId]) report.fail.push(`--strict: "${strictId}" 가 index.html 에 등록되어 있지 않다`);
  else {
    (report.lintWarn[strictId] || []).forEach(m => report.fail.push(`설명 ${strictId}: ${m}`));
    const ph = report.physics[strictId];
    if (!ph || ph.length < 3) report.fail.push(`물리 ${strictId}: tests/physics/${strictId}.js 에 독립 계산 비교가 3개 이상 있어야 한다`);
  }
}
if (asJson) { console.log(JSON.stringify(report, null, 1)); }
else {
  const nPh = Object.values(report.physics).reduce((a, c) => a + c.length, 0);
  console.log(`시뮬레이션 ${report.sims}종 · 스모크 실패 ${Object.keys(report.smoke).length}종 · 물리 검증 ${nPh}항목 · 설명 점검 경고 ${Object.keys(report.lintWarn).length}종 · 정의 안 되는 측정값(—) ${Object.keys(report.nonFinite).length}종`);
  if (strictId && report.nonFinite[strictId]) console.log('  참고 — 새 시뮬레이션의 정의 안 되는 측정값: ' + report.nonFinite[strictId].join(' · '));
  if (strictId) console.log(`엄격 검사 대상: ${strictId}`);
  report.fail.forEach(f => console.log('  ✗ ' + f));
  console.log(report.fail.length ? '\n실패' : '\n통과');
}
process.exit(report.fail.length ? 1 : 0);
