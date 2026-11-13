/* =========================================================
   새 시뮬레이션 관문 — 네 가지 기준을 한 번에 검사한다 (의존성 없음, Chrome/Edge headless)
     node tools/daily-check.js <id>
   통과하면 종료 코드 0. 화면 캡처는 tools/daily/shots/<id>/ 에 남는다 — 사람(또는 Claude)이 눈으로 본다.

   기준 ↔ 관문
     1. 중요한 이론인가        tools/daily/backlog.md 에 이 id 의 "중요도" 근거가 적혀 있는가 (내용 판단은 절차서)
     2. 중학생이 이해하는가    test-sims --strict : 한국어 설명·기호마다 "어디에서 작용하는지"·알아두기·프리셋·과제
     3. 애니메이션이 맞는가    test-sims : 스모크(전 프리셋) + tests/physics/<id>.js 독립 계산 비교 3개 이상
                              check.html : 9가지 화면 크기 × 전 프리셋 × 강조 상태에서 그리기 예외 0
     4. 가독성                 check.html : 글자 겹침 0 · 캔버스 밖 잘림 0 · 안 읽히는 글자 0 (새 시뮬레이션)
                              + 기존 73종에 겹침·예외가 새로 생기지 않았는가
   ========================================================= */
const http = require('http'), fs = require('fs'), path = require('path'), { execFile, execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const id = process.argv[2];
if (!id) { console.error('사용법: node tools/daily-check.js <시뮬레이션 id>'); process.exit(2); }

const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const BROWSER = BROWSERS.find(p => fs.existsSync(p));

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT)) { r.writeHead(403).end(); return; }
      fs.readFile(f, (e, b) => { if (e) { r.writeHead(404).end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(b); });
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
function chrome(args, timeout = 300000) {
  return new Promise((res, rej) => execFile(BROWSER, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    '--force-device-scale-factor=1', ...args], { maxBuffer: 128 << 20, timeout }, (e, out) => e ? rej(e) : res(out)));
}

(async () => {
  const verdict = [], fails = [];
  const gate = (crit, name, ok, detail) => { verdict.push({ crit, name, ok, detail }); if (!ok) fails.push(`[기준 ${crit}] ${name}: ${detail}`); };

  /* 기준 1 — 후보 목록에 중요도 근거가 있는가 */
  const backlog = fs.readFileSync(path.join(ROOT, 'tools/daily/backlog.md'), 'utf8');
  const entry = backlog.split(/\n(?=### )/).find(b => b.includes('`' + id + '`'));
  gate(1, '후보 목록의 중요도 근거', !!entry && /중요도:/.test(entry) && /근거:/.test(entry),
    entry ? '있음' : `tools/daily/backlog.md 에 \`${id}\` 항목(중요도·근거)이 없다`);

  /* 기준 2·3 — Node 검사 (설명 점검 엄격 + 스모크 + 물리 검증) */
  let t;
  try { t = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'test-sims.js'), '--strict', id, '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); }
  catch (e) { t = JSON.parse(e.stdout); }
  const lintFails = t.fail.filter(f => f.startsWith('설명 '));
  const physFails = t.fail.filter(f => f.startsWith('물리 '));
  const smokeFails = t.fail.filter(f => f.startsWith('스모크 ') || f.startsWith('--strict'));
  gate(2, '중학생 설명 요소 (test-sims --strict)', !lintFails.length, lintFails.length ? lintFails.join(' / ') : '빠진 것 없음');
  gate(3, '실행 스모크 (전 시뮬레이션 × 전 프리셋)', !smokeFails.length, smokeFails.length ? smokeFails.join(' / ') : `${t.sims}종 예외 0`);
  const ph = t.physics[id] || [];
  gate(3, '물리 독립 계산 비교 (tests/physics)', !physFails.length && ph.length >= 3,
    physFails.length ? physFails.join(' / ') : `${ph.filter(c => c.ok).length}/${ph.length} 통과`);

  if (!BROWSER) { gate(4, '브라우저 점검', false, 'Chrome/Edge 를 찾지 못했다'); return finish(); }
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}`;
  try {
    /* 기준 3·4 — 브라우저: 전체 회귀 + 새 시뮬레이션 */
    const dom = await chrome(['--virtual-time-budget=900000', '--window-size=1400,900', '--dump-dom', `${base}/tools/check.html`], 600000);
    const m = dom.match(/<script type="application\/json" id="result">([\s\S]*?)<\/script>/);
    if (!m) { gate(4, '브라우저 점검', false, '결과를 읽지 못했다'); }
    else {
      const R = JSON.parse(m[1]);
      if (R.failed) gate(4, '브라우저 점검', false, R.failed);
      else {
        const mine = R.errors.filter(e => e.includes(' ' + id + ' ') || e.includes(' ' + id + ' /'));
        gate(3, '그리기 예외 (9가지 크기 × 프리셋 × 강조)', R.errors.length === 0, R.errors.length ? R.errors.slice(0, 3).join(' / ') : `그리기 ${R.total.draws}회 예외 0`);
        const ov = Object.values(R.sizes).flatMap(S => Object.entries(S.overlaps).map(([k, v]) => k + ': ' + v[0]));
        gate(4, '글자 겹침 (전 시뮬레이션)', ov.length === 0, ov.length ? ov.slice(0, 4).join(' / ') : '0');
        const myClip = Object.entries(R.sizes).flatMap(([k, S]) => (S.clipped[id] || []).map(x => k + ' ' + x));
        gate(4, '캔버스 밖 잘림 (새 시뮬레이션)', myClip.length === 0, myClip.length ? myClip.slice(0, 4).join(' / ') : '0');
        const myIll = R.illegible[id] || [];
        gate(4, '안 읽히는 글자 (새 시뮬레이션)', myIll.length === 0, myIll.length ? myIll.slice(0, 4).join(' / ') : '0');
        if (mine.length) gate(3, '새 시뮬레이션 그리기 예외', false, mine[0]);
      }
    }

    /* 화면 캡처 — 데스크톱·폰 × 시작 직후·몇 초 뒤. 사람이 보는 실제 화면(빛 효과 포함) */
    const dir = path.join(ROOT, 'tools/daily/shots', id);
    fs.mkdirSync(dir, { recursive: true });
    const shots = [];
    for (const [nm, w, h] of [['desktop', 1440, 900], ['phone', 390, 844]])
      for (const sec of [1, 6]) {
        const f = path.join(dir, `${nm}-${sec}s.png`);
        await chrome(['--virtual-time-budget=3000', `--window-size=${w},${h}`, '--screenshot=' + f, `${base}/index.html?motion=off&advance=${sec}#/${id}`], 120000);
        shots.push(path.relative(ROOT, f));
      }
    gate(4, '화면 캡처 (눈으로 확인할 것)', shots.length === 4, shots.join(', '));
  } finally { srv.close(); }
  finish();

  function finish() {
    console.log(`\n관문 — ${id}\n`);
    for (const v of verdict) console.log(`${v.ok ? '✓' : '✗'} 기준 ${v.crit}  ${v.name}\n      ${v.detail}`);
    console.log(fails.length ? `\n실패 ${fails.length}건 — 고칠 때까지 추가하지 않는다` : '\n모든 자동 관문 통과 — 화면 캡처를 눈으로 확인한 뒤 추가한다');
    process.exit(fails.length ? 1 : 0);
  }
})().catch(e => { console.error('관문 실행 자체가 실패했다:', e.message); process.exit(2); });
