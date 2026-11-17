/* =========================================================
   원본 글자 점검 — 제어 문자와 백슬래시가 빠진 정규식
     node tools/scan-source.js [파일…]     (파일을 안 주면 js/ 전체)
   왜: 셸 heredoc·따옴표를 거쳐 파일을 쓰면 "\b" 가 백스페이스 문자(U+0008)로, "\d" 가 "d" 로 바뀐 채
   저장될 수 있다. 문법은 멀쩡해서 실행은 되는데 정규식이 다른 뜻이 된다(실제로 ?fx=off 와 isLight 가 이렇게 깨졌었다).
     제어 문자   U+0000~U+001F 중 탭(09)·개행(0A)·복귀(0D) 외
     정규식      리터럴 안에서 [d.] [s] (d+ w+ 처럼 \d \s \w \b 의 백슬래시가 빠진 흔한 모양
   걸리면 종료 코드 1.
   ========================================================= */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = process.argv.slice(2).length ? process.argv.slice(2).map(f => path.resolve(ROOT, f)) : walk(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
const bad = [];
for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    const ctl = [...l].map((c, j) => [c.charCodeAt(0), j]).filter(([c]) => c < 32 && c !== 9 && c !== 13);
    if (ctl.length) bad.push(`${rel}:${i + 1} 제어 문자 ${ctl.map(([c, j]) => 'U+' + c.toString(16).padStart(4, '0').toUpperCase() + '@' + j).join(', ')}`);
    // 정규식 리터럴 후보 — 나눗셈과 구별하려고 앞 글자가 연산자·괄호·쉼표·return 인 것만
    for (const r of l.matchAll(/(?:^|[=(,:!&|?;{}\[]|return)\s*\/((?:[^\/\\\n]|\\.)+)\/[gimsuy]*/g)) {
      const b = r[1];
      if (/\[[^\]]*(?<![\\a-zA-Z])[dswb][^a-zA-Z]/.test(b) || /(?<![\\a-zA-Z])[dsw][+*?{](?![a-zA-Z])/.test(b))
        bad.push(`${rel}:${i + 1} 백슬래시가 빠진 듯한 정규식 /${b}/`);
    }
  });
}
bad.forEach(b => console.log('✗ ' + b));
console.log(bad.length ? `\n${bad.length}건 — 고칠 때까지 배포하지 않는다` : `파일 ${files.length}개 — 제어 문자·빠진 백슬래시 없음`);
process.exit(bad.length ? 1 : 0);
