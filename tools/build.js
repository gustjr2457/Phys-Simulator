/* =========================================================
   색인·버전 만들기 (Node, 의존성 없음)
     node tools/build.js           js/catalog.js 를 다시 만들고 index.html 의 ?v= 를 갱신한다
     node tools/build.js --check   바뀔 것이 있으면 종료 코드 1 (test-sims 가 부른다 — 갱신을 잊으면 실패)

   왜: 첫 화면에서 시뮬레이션 78개를 모두 받지 않으려고, 목록·공식 모음에 필요한 것
   (id·제목·부제·과정·소분류·공식·기호 색)만 js/catalog.js 하나로 모으고, 본체는 열 때 불러온다(core.js PS.load).
   배포본은 js·css 를 1년 동안 캐시하므로(vercel.json) 내용이 바뀌면 주소가 바뀌어야 한다 —
   파일 내용의 해시를 ?v= 로 붙인다. index.html 자체는 캐시하지 않아서 늘 새 주소를 가리킨다.
   ========================================================= */
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const CHECK = process.argv.includes('--check');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);

const { files } = JSON.parse(rd('tools/sims.json'));

/* 1. 시뮬레이션을 vm 에 싣고 목록용 정보만 뽑는다 */
const ctx = vm.createContext({ console, Math, Date, JSON, Object, Array, Number, String, Set, Map, isFinite, isNaN, parseFloat, parseInt });
vm.runInContext(rd('js/core.js').replace(/^const PS = /m, 'var PS = '), ctx, { filename: 'js/core.js' });
const entries = [];
for (const f of files) {
  const src = rd(f), before = ctx.PS.sims.length;
  vm.runInContext(src, ctx, { filename: f });
  const added = ctx.PS.sims.slice(before);
  if (added.length !== 1) throw new Error(`${f}: 시뮬레이션이 ${added.length}개 등록됨 (파일마다 하나여야 한다)`);
  const s = added[0];
  const vars = {};
  Object.entries(s.vars).forEach(([k, v]) => { vars[k] = { symbol: v.symbol, color: v.color, label: v.label }; });
  entries.push({
    id: s.id, file: f, v: hash(src), mode: s.mode || 'basic', category: s.category,
    title: s.title, sub: s.sub, formulas: (s.formulas || []).map(x => ({ name: x.name, tpl: x.tpl })), vars
  });
}
const ids = new Set();
entries.forEach(e => { if (ids.has(e.id)) throw new Error('같은 id 가 둘: ' + e.id); ids.add(e.id); });

const catalog =
  '/* 자동 생성 — 직접 고치지 말 것. 원본은 각 시뮬레이션 파일과 tools/sims.json, 다시 만들려면 node tools/build.js\n' +
  '   목록·전체 공식 모음에 필요한 정보만 담는다. 시뮬레이션 본체는 열 때 PS.load(id) 가 file?v= 로 불러온다. */\n' +
  'PS.setCatalog(' + JSON.stringify(entries, null, 0).replace(/\},\{"id"/g, '},\n{"id"') + ');\n';

/* 2. index.html 의 ?v= — 내용 해시 */
let html = rd('index.html');
const html0 = html;
const stamp = (file, content) => {
  const re = new RegExp('(["\'])(' + file.replace(/[.\/]/g, m => '\\' + m) + ')(\\?v=[0-9a-f]*)?\\1');
  if (!re.test(html)) throw new Error('index.html 에서 ' + file + ' 를 찾지 못했다');
  html = html.replace(re, `$1${file}?v=${hash(content)}$1`);
};
stamp('css/style.css', rd('css/style.css'));
stamp('css/motion.css', rd('css/motion.css'));
stamp('js/core.js', rd('js/core.js'));
stamp('js/catalog.js', catalog);
stamp('js/typeset.js', rd('js/typeset.js'));
stamp('js/app.js', rd('js/app.js'));

const old = fs.existsSync(path.join(ROOT, 'js/catalog.js')) ? rd('js/catalog.js') : '';
const changed = [old !== catalog && 'js/catalog.js', html0 !== html && 'index.html'].filter(Boolean);
if (CHECK) {
  if (changed.length) { console.log('갱신 필요: ' + changed.join(', ') + ' — node tools/build.js'); process.exit(1); }
  console.log('색인·버전 최신 (' + entries.length + '종)'); process.exit(0);
}
fs.writeFileSync(path.join(ROOT, 'js/catalog.js'), catalog);
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log(`시뮬레이션 ${entries.length}종 · js/catalog.js ${(catalog.length / 1024).toFixed(1)} KB` + (changed.length ? ' · 갱신: ' + changed.join(', ') : ' · 바뀐 것 없음'));
