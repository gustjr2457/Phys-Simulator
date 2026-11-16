/* =========================================================
   자동 실행 전 도구 점검 — node tools/doctor.js [--json]
   매일 이론(.claude/skills/daily-theory) 0단계에서 먼저 돌린다. 사람이 없는 실행이라
   "도구가 없어서 못 했다"로 끝나지 않도록, 무엇을 어떤 경로로 쓰면 되는지 미리 알려 준다.

   필수 (없으면 종료 코드 1 — 그날은 보류로 기록)
     node      시뮬레이션 검사 (tools/test-sims.js)
     git       커밋·push, 원격(origin) 연결
     브라우저   Chrome/Edge headless — 화면 점검·캡처 (tools/daily-check.js). dev 서버는 쓰지 않는다
   선택 (없어도 진행, 쓰려면 아래 "쓸 명령"으로)
     python    계산 확인용. Windows 의 python.exe 는 Microsoft Store 바로가기(WindowsApps)일 수 있어
               실제 설치본 경로를 찾아 준다
   ========================================================= */
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const asJson = process.argv.includes('--json');

function run(cmd, args, opt = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: opt.timeout || 15000, cwd: ROOT, windowsHide: true });
  return { ok: !r.error && r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim(), err: r.error && r.error.code };
}
const win = process.platform === 'win32';
const checks = [];
const add = (name, need, ok, use, detail) => checks.push({ name, need, ok, use, detail });

/* node — 이 스크립트를 돌리는 그 node */
add('node', true, true, process.execPath, process.version);

/* git — 실행 파일, 저장소, 원격 연결, 작업 트리 */
const gv = run('git', ['--version']);
if (!gv.ok) add('git', true, false, null, 'git 을 찾지 못했다');
else {
  const inRepo = run('git', ['rev-parse', '--is-inside-work-tree']).out === 'true';
  const remote = inRepo ? run('git', ['ls-remote', '--exit-code', 'origin', 'HEAD'], { timeout: 30000 }) : { ok: false };
  const dirty = inRepo ? run('git', ['status', '--porcelain']).out : '';
  add('git', true, inRepo && remote.ok, 'git',
    gv.out + (inRepo ? '' : ' · 저장소가 아님') + (inRepo ? (remote.ok ? ' · origin 연결됨' : ' · origin 에 연결하지 못함 (네트워크·인증)') : '')
    + (dirty ? ` · 커밋 안 된 변경 ${dirty.split('\n').length}개` : ''));
}

/* 브라우저 — daily-check.js 와 같은 목록 */
const BROWSERS = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
const br = BROWSERS.find(p => fs.existsSync(p));
add('브라우저 (headless)', true, !!br, br || null, br ? 'tools/daily-check.js 가 자동으로 쓴다 — dev 서버·preview 불필요' : 'Chrome/Edge 를 찾지 못했다');

/* python — 실제 설치본을 찾는다 (WindowsApps 바로가기는 제외) */
function realPython() {
  const cands = [];
  if (win) {
    const la = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData/Local');
    const base = path.join(la, 'Programs/Python');
    if (fs.existsSync(base)) fs.readdirSync(base).filter(d => /^Python3\d+$/.test(d)).sort((a, b) => parseInt(b.slice(7)) - parseInt(a.slice(7)))
      .forEach(d => cands.push(path.join(base, d, 'python.exe')));
    ['C:/Program Files', 'C:/Program Files (x86)'].forEach(pf => fs.existsSync(pf) && fs.readdirSync(pf).filter(d => /^Python3\d+$/.test(d))
      .forEach(d => cands.push(path.join(pf, d, 'python.exe'))));
  }
  for (const c of cands) if (fs.existsSync(c)) { const r = run(c, ['--version']); if (r.ok) return { use: c, ver: r.out }; }
  // py 런처 (Windows) — 실제 설치본을 가리킨다
  if (win) { const r = run('py', ['-3', '-c', 'import sys;print(sys.executable)']); if (r.ok && !/WindowsApps/i.test(r.out)) return { use: 'py -3', ver: run('py', ['-3', '--version']).out, path: r.out }; }
  for (const c of ['python3', 'python']) {
    const r = run(c, ['-c', 'import sys;print(sys.executable)']);
    if (r.ok && r.out && !/WindowsApps/i.test(r.out)) return { use: c, ver: run(c, ['--version']).out, path: r.out };
  }
  return null;
}
const py = realPython();
let alias = '';
if (win) { const w = run('where', ['python']); if (w.ok && /WindowsApps/i.test(w.out.split('\n')[0])) alias = ' · 주의: 그냥 "python" 은 Microsoft Store 바로가기라 실행되지 않는다 — 위 경로를 쓸 것'; }
add('python', false, !!py, py ? py.use : null, py ? py.ver + (py.path ? ' (' + py.path + ')' : '') + alias : '실제 설치본이 없다 — 계산 확인은 node 로 한다');

/* 결과 */
const fatal = checks.filter(c => c.need && !c.ok);
if (asJson) console.log(JSON.stringify({ ok: !fatal.length, checks }, null, 1));
else {
  console.log('\n도구 점검\n');
  for (const c of checks) console.log(`${c.ok ? '✓' : c.need ? '✗' : '–'} ${c.name}${c.need ? '' : ' (선택)'}\n      ${c.detail}${c.use ? '\n      쓸 명령: ' + (/[\\/ ]/.test(c.use) && !c.use.startsWith('py ') ? '"' + c.use + '"' : c.use) : ''}`);
  console.log(fatal.length ? `\n필수 도구 ${fatal.length}개 문제 — ${fatal.map(c => c.name).join(', ')}` : '\n필수 도구 모두 준비됨');
}
process.exit(fatal.length ? 1 : 0);
