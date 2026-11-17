/* =========================================================
   수식 조판 — 공식 템플릿 문자열을 HTML 로 (의존성 없음, app.js 가 쓴다)
   규칙: 변수만 이탤릭. 숫자·연산자·괄호·함수명(sin·cos·tan·ln…)·Δ·Σ·대문자 약어·단위·한글은 정체.
   템플릿 문법(기존 그대로):
     {기호}      시뮬레이션의 변수 — 색·가리키기·고정이 붙는 항 (renderVar 가 만든다)
     a ⁄ b       위아래로 쌓인 분수. 분자는 앞쪽의 띄어 쓴 곱(연산자에서 멈춤), 분모는 뒤에 붙어 있는 항.
                 괄호 한 묶음이 통째로 분자·분모면 괄호를 벗긴다.  예: {V}² ⁄ (g · tan{phi})
     √x, √(…)    근호 — 바로 뒤의 항 또는 괄호 묶음 위에 줄을 긋는다
     x^y, x^(…)  위첨자,  x_abc  아래첨자 (한 글자 i·j·k·m·n·x·y 만 이탤릭, 나머지는 설명 첨자라 정체)
     |…|         절댓값 묶음
     […]         단위 — 정체 그대로
   왜 KaTeX 가 아닌가: 기존 템플릿과 {기호}의 색·가리키기·고정을 그대로 쓰고, 수식 글꼴(STIX Two)을 지키려고.
   ========================================================= */
(function (root) {
  const FUNCS = ['arcsin', 'atan', 'sin', 'cos', 'tan', 'exp', 'log', 'ln', 'max', 'min'];
  const UNITS = ['nm', 'km', 'eV', 'pc', 'AU', 'kg', 'mm', 'cm', 'Hz', 'MeV', 'fm'];
  const isLetter = c => /[A-Za-zͰ-Ͽħ∞]/.test(c) && c !== 'Δ' && c !== 'Σ';
  const isPost = c => /[⁰-₟²³¹ᵢ-ᵪ′″!⊥★̇ₖⱼ]/.test(c);
  const isKo = c => /[가-힣]/.test(c);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* 낱말 하나 — 함수명·약어·단위는 정체, 나머지 변수 글자는 이탤릭 */
  function word(w, subMode) {
    for (const f of FUNCS) if (w.length > f.length && w.startsWith(f)) return '<span class="up">' + f + '</span>' + word(w.slice(f.length), subMode);
    if (FUNCS.includes(w) || UNITS.includes(w)) return '<span class="up">' + w + '</span>';
    if (w.length > 1 && /^[A-Z]+$/.test(w) && !subMode) return '<span class="up">' + w + '</span>';     // TCPA·KE 같은 약어
    if (subMode && !(w.length === 1 && /[ijkmnxy]/.test(w))) return '<span class="up">' + esc(w) + '</span>';
    return '<i>' + esc(w) + '</i>';
  }

  function typeset(src, renderVar) {
    let i = 0;
    const peek = () => src[i];

    // 한 줄(또는 괄호 안)을 노드 목록으로: {t:'atom',h,g?} | {t:'op',h} | {t:'sp'} | {t:'frac'}
    function seq(close) {
      const out = [];
      while (i < src.length) {
        const c = peek();
        if (close && c === close) { i++; return out; }
        if (c === ' ' || c === ' ') { while (src[i] === ' ' || src[i] === ' ') i++; out.push({ t: 'sp' }); continue; }
        if (c === '⁄') { i++; out.push({ t: 'frac' }); continue; }
        const a = atom();
        if (a) { out.push(post(a)); continue; }
        // 연산자·그 밖의 기호
        i++;
        out.push({ t: 'op', h: c === '-' ? '−' : esc(c) });
      }
      return out;
    }
    // 항 하나 (없으면 null)
    function atom() {
      const c = peek();
      if (c === undefined) return null;
      if (c === '{') {
        const j = src.indexOf('}', i), k = src.slice(i + 1, j);
        i = j + 1;
        return { t: 'atom', h: renderVar ? renderVar(k) : esc(k) };
      }
      if (c === '(') { i++; const g = seq(')'); return { t: 'atom', g, h: '(' + render(g) + ')' }; }
      if (c === '|') {
        i++; const j = src.indexOf('|', i);
        if (j < 0) return { t: 'atom', h: '|' };
        const inner = src.slice(i, j); i = j + 1;
        return { t: 'atom', h: '|' + typeset(inner, renderVar) + '|' };
      }
      if (c === '[') { const j = src.indexOf(']', i); const s = src.slice(i, j + 1); i = j + 1; return { t: 'atom', h: '<span class="up mu">' + esc(s) + '</span>' }; }
      if (c === '√') {
        i++;
        while (peek() === ' ') i++;
        const a = atom();
        if (!a) return { t: 'atom', h: '√' };
        const p = post(a);
        return { t: 'atom', h: '<span class="msqrt"><span class="mr">√</span><span class="mc">' + (p.g && !p.tail ? render(p.g) : p.h) + '</span></span>' };
      }
      if (c === 'Δ' || c === 'Σ') { i++; return { t: 'atom', h: '<span class="up">' + c + '</span>' }; }
      const num = src.slice(i).match(/^(\d+(?:\.\d+)?(?:×10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)?|½)/);
      if (num) { i += num[0].length; return { t: 'atom', h: '<span class="up">' + num[0] + '</span>' }; }
      if (isLetter(c)) { let j = i; while (j < src.length && isLetter(src[j])) j++; const w = src.slice(i, j); i = j; return { t: 'atom', h: word(w) }; }
      if (isKo(c)) { let j = i; while (j < src.length && isKo(src[j])) j++; const w = src.slice(i, j); i = j; return { t: 'atom', h: '<span class="up mko">' + w + '</span>' }; }
      return null;
    }
    // 항 뒤에 붙는 것: 유니코드 첨자·프라임·!, ^위첨자, _아래첨자
    function post(a) {
      for (;;) {
        const c = peek();
        if (c !== undefined && isPost(c)) { a.h += c; a.tail = true; i++; continue; }
        if (c === '^') {
          i++; const b = atom(); if (!b) { a.h += '^'; continue; }
          a.h += '<sup class="ms">' + (b.g ? render(b.g) : b.h) + '</sup>'; a.tail = true; continue;
        }
        if (c === '_' && src[i + 1] && src[i + 1] !== ' ') {
          i++;
          let b;
          if (isLetter(peek()) || isKo(peek())) { let j = i; while (j < src.length && (isLetter(src[j]) || isKo(src[j]))) j++; b = word(src.slice(i, j), true); i = j; }
          else { const x = atom(); b = x ? (x.g ? render(x.g) : x.h) : ''; }
          a.h += '<sub class="ms">' + b + '</sub>'; a.tail = true; continue;
        }
        return a;
      }
    }
    // 분수 묶기 — 분자는 앞쪽 곱(띄어쓰기 허용, 연산자에서 멈춤), 분모는 뒤에 붙은 항들
    function fracs(nodes) {
      for (let k = 0; k < nodes.length; k++) {
        if (nodes[k].t !== 'frac') continue;
        let a = k - 1;
        while (a >= 0 && nodes[a].t === 'sp') a--;
        let s = a;
        while (s - 1 >= 0 && (nodes[s - 1].t === 'atom' || (nodes[s - 1].t === 'sp' && s - 2 >= 0 && nodes[s - 2].t === 'atom'))) s--;
        let b = k + 1;
        while (b < nodes.length && nodes[b].t === 'sp') b++;
        let e = b;
        while (e < nodes.length && nodes[e].t === 'atom') e++;
        if (a < 0 || nodes[a].t !== 'atom' || e === b) { nodes[k] = { t: 'op', h: '⁄' }; continue; }
        const num = nodes.slice(s, a + 1), den = nodes.slice(b, e);
        const part = list => list.length === 1 && list[0].g && !list[0].tail ? render(list[0].g) : render(list);
        const f = { t: 'atom', h: '<span class="mfrac"><span class="mn">' + part(num) + '</span><span class="md">' + part(den) + '</span></span>' };
        nodes.splice(s, e - s, f);
        k = s;
      }
      return nodes;
    }
    function render(nodes) {
      return fracs(nodes).map(n => n.t === 'sp' ? ' ' : n.h).join('');
    }
    return render(seq(null));
  }

  // 기호 하나(슬라이더·설명 줄의 기호): 'C_L', 'ΣF', 'v₀', 'log R'
  function symbol(s) { return typeset(String(s), null); }
  // 네비 부제 같은 평문 — 아래첨자만 살린다 ('m_f' → m<sub>f</sub>)
  function plainSubs(s) { return esc(String(s)).replace(/_([A-Za-z0-9Ͱ-Ͽ가-힣]+)/g, '<sub>$1</sub>'); }

  root.TS = { typeset, symbol, plainSubs };
})(typeof window !== 'undefined' ? window : globalThis);
