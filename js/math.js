// Shared LaTeX-to-HTML math renderer used by lesson and quiz views.

var LATEX_MAP = {
  alpha: '&#945;', beta: '&#946;', gamma: '&#947;', delta: '&#948;',
  epsilon: '&#949;', varepsilon: '&#949;', zeta: '&#950;', eta: '&#951;',
  theta: '&#952;', vartheta: '&#977;', iota: '&#953;', kappa: '&#954;',
  lambda: '&#955;', mu: '&#956;', nu: '&#957;', xi: '&#958;',
  pi: '&#960;', varpi: '&#982;', rho: '&#961;', varrho: '&#1009;',
  sigma: '&#963;', varsigma: '&#962;', tau: '&#964;', upsilon: '&#965;',
  phi: '&#966;', varphi: '&#981;', chi: '&#967;', psi: '&#968;',
  omega: '&#969;',
  Alpha: '&#913;', Beta: '&#914;', Gamma: '&#915;', Delta: '&#916;',
  Epsilon: '&#917;', Zeta: '&#918;', Eta: '&#919;', Theta: '&#920;',
  Iota: '&#921;', Kappa: '&#922;', Lambda: '&#923;', Mu: '&#924;',
  Nu: '&#925;', Xi: '&#926;', Omicron: '&#927;', Pi: '&#928;',
  Rho: '&#929;', Sigma: '&#931;', Tau: '&#932;', Upsilon: '&#933;',
  Phi: '&#934;', Chi: '&#935;', Psi: '&#936;', Omega: '&#937;',
  times: '&#215;', div: '&#247;', pm: '&#177;', mp: '&#8723;',
  cdot: '&#183;', circ: '&#176;', bullet: '&#8226;',
  le: '&#8804;', leq: '&#8804;', ge: '&#8805;', geq: '&#8805;',
  ne: '&#8800;', neq: '&#8800;', approx: '&#8776;',
  sim: '&#8764;', simeq: '&#8771;', cong: '&#8773;', equiv: '&#8801;',
  subset: '&#8834;', supset: '&#8835;', subseteq: '&#8838;', supseteq: '&#8839;',
  in: '&#8712;', notin: '&#8713;', cap: '&#8745;', cup: '&#8746;',
  emptyset: '&#8709;', nabla: '&#8711;', partial: '&#8706;',
  exists: '&#8707;', forall: '&#8704;', infinity: '&#8734;',
  propto: '&#8733;',
  to: '&#8594;', gets: '&#8592;', leftarrow: '&#8592;', rightarrow: '&#8594;',
  Leftrightarrow: '&#8660;', Leftarrow: '&#8656;', Rightarrow: '&#8658;',
  implies: '&#8658;', iff: '&#8660;',
  ldots: '&#8230;', dots: '&#8230;', cdots: '&#8943;', vdots: '&#8942;', ddots: '&#8945;',
  sum: '&#8721;', prod: '&#8719;', coprod: '&#8720;',
  int: '&#8747;', oint: '&#8750;', iint: '&#8748;', iiint: '&#8749;',
  sqrt: '&#8730;', surd: '&#8730;',
  prime: '&#8242;', infty: '&#8734;', aleph: '&#8501;',
  angle: '&#8736;', measuredangle: '&#8737;', sphericalangle: '&#8738;',
  wedge: '&#8743;', vee: '&#8744;',
  oplus: '&#8853;', otimes: '&#8855;', ominus: '&#8854;', oslash: '&#8856;',
  deg: '&#176;', percent: '&#37;',
  exp: 'exp', log: 'log', ln: 'ln', sin: 'sin', cos: 'cos', tan: 'tan',
  max: 'max', min: 'min', lim: 'lim', sup: 'sup', inf: 'inf',
  det: 'det', dim: 'dim', hom: 'hom', ker: 'ker', rank: 'rank'
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/[\u00A0-\uFFFF]/g, function (c) {
      return '&#' + c.codePointAt(0) + ';';
    });
}

function extractBraceGroup(s, start) {
  var i = start, depth = 0;
  while (i < s.length && depth >= 0) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') depth--;
    if (depth === 0) break;
    i++;
  }
  return { content: s.substring(start + 1, i), end: i + 1 };
}

function replaceBraceCommand(math, name, wrap) {
  var out = '', lastIdx = 0;
  var re = new RegExp('\\\\' + name + '\\s*\\{', 'g');
  var m;
  while ((m = re.exec(math)) !== null) {
    var grp = extractBraceGroup(math, re.lastIndex - 1);
    if (grp.end > math.length) { lastIdx = re.lastIndex; continue; }
    out += math.substring(lastIdx, m.index) + wrap(grp.content);
    lastIdx = grp.end;
    re.lastIndex = grp.end;
  }
  out += math.substring(lastIdx);
  return out;
}

function applyAccents(math) {
  math = replaceBraceCommand(math, 'hat', function (inner) {
    return '<span class="acc-hat">' + inner + '</span>';
  });
  math = replaceBraceCommand(math, 'bar', function (inner) {
    return '<span class="acc-bar">' + inner + '</span>';
  });
  math = replaceBraceCommand(math, 'overline', function (inner) {
    return '<span class="acc-bar">' + inner + '</span>';
  });
  return math;
}

function applyText(math) {
  return replaceBraceCommand(math, 'text', function (inner) {
    return inner;
  });
}

function applyBigOpLimits(math) {
  var out = '', lastIdx = 0;
  var re = /\\(sum|prod)(?![a-zA-Z])/g, m;
  while ((m = re.exec(math)) !== null) {
    out += math.substring(lastIdx, m.index);
    var i = m.index + m[0].length;
    while (i < math.length && math[i] === ' ') i++;
    if (math.substr(i, 7) === '\\limits') {
      i += 7;
      while (i < math.length && math[i] === ' ') i++;
    }
    var sub = null, sup = null, matched = false;
    for (var g = 0; g < 2; g++) {
      while (i < math.length && math[i] === ' ') i++;
      if (math[i] === '_' && math[i + 1] === '{') {
        var sr = extractBraceGroup(math, i + 1);
        sub = sr.content; i = sr.end; matched = true; continue;
      }
      if (math[i] === '^' && math[i + 1] === '{') {
        var pr = extractBraceGroup(math, i + 1);
        sup = pr.content; i = pr.end; matched = true; continue;
      }
      break;
    }
    if (matched) {
      var parts = [];
      if (sub !== null) parts.push(sub);
      if (sup !== null) parts.push(sup);
      out += '\\' + m[1] + '(' + parts.join(' to ') + ')';
      lastIdx = i;
      re.lastIndex = i;
      continue;
    }
    out += '\\' + m[1];
    lastIdx = m.index + m[0].length;
  }
  out += math.substring(lastIdx);
  return out;
}

function applyFracs(math) {
  var result = '', lastIdx = 0, fracRe = /\\frac/g, m;
  while ((m = fracRe.exec(math)) !== null) {
    result += math.substring(lastIdx, m.index);
    var after = math.substring(m.index + 5);
    var i = 0;
    while (i < after.length && after[i] === ' ') i++;
    if (i < after.length && after[i] === '{') {
      var numResult = extractBraceGroup(after, i);
      i = numResult.end;
      while (i < after.length && after[i] === ' ') i++;
      if (i < after.length && after[i] === '{') {
        var denResult = extractBraceGroup(after, i);
        result += '<span class="frac"><span class="frac-num">' + latexToHtml(numResult.content) + '</span><span class="frac-line">&#x2500;</span><span class="frac-den">' + latexToHtml(denResult.content) + '</span></span>';
        lastIdx = m.index + 5 + denResult.end;
        fracRe.lastIndex = lastIdx;
        continue;
      }
    }
    result += '\\frac';
    lastIdx = m.index + 5;
  }
  result += math.substring(lastIdx);
  return result;
}

function applySqrts(math) {
  var out = '', lastIdx = 0;
  var re = /\\sqrt(?:\[([^\]]*)\])?\s*\{/g, m;
  while ((m = re.exec(math)) !== null) {
    var grp = extractBraceGroup(math, re.lastIndex - 1);
    if (grp.end > math.length) { lastIdx = re.lastIndex; continue; }
    out += math.substring(lastIdx, m.index) + '&#8730;<span class="sqrt">' + latexToHtml(grp.content) + '</span>';
    lastIdx = grp.end;
    re.lastIndex = grp.end;
  }
  out += math.substring(lastIdx);
  return out;
}

export function latexToHtml(math, opts) {
  math = String(math || '');
  math = math.replace(/\\([%{}_#$&])/g, '$1');
  math = applyText(math);
  if (opts && opts.pdf) math = applyBigOpLimits(math);

  math = math.replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>');
  math = math.replace(/_\{([^}]*)\}/g, '<sub>$1</sub>');
  math = math.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');
  math = math.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');

  math = applyFracs(math);
  math = applySqrts(math);
  math = applyAccents(math);

  math = math.replace(/\\left\s*\.?/g, '');
  math = math.replace(/\\right\s*\.?/g, '');
  math = math.replace(/\\[bB]ig{1,2}(?:[lrm])?\s*/g, '');
  math = math.replace(/\\qquad/g, '  ');
  math = math.replace(/\\quad/g, '  ');
  math = math.replace(/\\,/g, ' ');
  math = math.replace(/\\;/g, '  ');
  math = math.replace(/\\!/g, '');
  math = math.replace(/\\:/g, ' ');
  math = math.replace(/\\ /g, ' ');

  math = math.replace(/\\([a-zA-Z]+)/g, function (m, cmd) {
    return LATEX_MAP[cmd] || m;
  });
  return math;
}

export function renderMathText(content, opts) {
  if (!content) return '';
  var h = escapeHtml(content);
  var codeBlocks = [];
  h = h.replace(/`([^`]+)`/g, function (m, c) {
    codeBlocks.push('<code>' + c + '</code>');
    return '%%CODE' + (codeBlocks.length - 1) + '%%';
  });
  h = h.replace(/\$\$([\s\S]+?)\$\$/g, function (m, inner) {
    if (opts && opts.rawLatex) return m;
    inner = inner.trim();
    if (opts && opts.pdf && /\^[^}]*\^/.test(inner)) return '<div class="math-block">' + inner + '</div>';
    return '<div class="math-block">' + latexToHtml(inner, opts) + '</div>';
  });
  h = h.replace(/\$([^$]+)\$/g, function (m, inner) {
    if (opts && opts.rawLatex) return m;
    if (opts && opts.pdf && /\^[^}]*\^/.test(inner)) return '<span class="math-inline">' + inner + '</span>';
    return '<span class="math-inline">' + latexToHtml(inner, opts) + '</span>';
  });
  for (var ci = 0; ci < codeBlocks.length; ci++) {
    h = h.replace('%%CODE' + ci + '%%', codeBlocks[ci]);
  }
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return h;
}

export function renderText(content, opts) {
  var h = renderMathText(content, opts);
  h = h.replace(/\n\n/g, '</p><p>');
  h = '<p>' + h + '</p>';
  h = h.replace(/<p><\/p>/g, '');
  h = h.replace(/\n/g, '<br>');
  return h;
}
