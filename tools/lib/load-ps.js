/* index.html 의 순서대로 core.js 와 시뮬레이션을 Node vm 안에 싣는다 — 점검 도구들이 같이 쓴다.
   app.js 는 화면 전용이라 싣지 않는다. core.js 의 `const PS` 는 vm 전역으로 꺼내려고 var 로 바꾼다. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');

function simFiles() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="(js\/[^"?]+)(?:\?[^"]*)?"><\/script>/g)].map(m => m[1]).filter(f => f !== 'js/app.js');
}

function loadPS() {
  const files = simFiles();
  const ctx = vm.createContext({ console, Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite, isNaN, parseFloat, parseInt });
  for (const f of files) {
    let src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (f === 'js/core.js') src = src.replace(/^const PS = /m, 'var PS = ');
    vm.runInContext(src, ctx, { filename: f });
  }
  return { PS: ctx.PS, files };
}

/* 슬라이더 기본값 P */
function defaults(sim) { const P = {}; sim.params.forEach(p => P[p.key] = p.value); return P; }

module.exports = { ROOT, loadPS, simFiles, defaults };
