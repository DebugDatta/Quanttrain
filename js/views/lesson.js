import { getProgress, setProgress, addXp, getAllData } from '../store.js';
import { $, $$, show, navigate, getNode, getWorldForNode, escapeHtml } from '../utils.js';

let currentNodeId = null;

export function render(nodeId) {
  const node = getNode(nodeId);
  if (!node) { navigate('#/map'); return; }
  currentNodeId = nodeId;
  show('lesson-view');
  const world = getWorldForNode(nodeId);
  const progress = getProgress();
  const hasXp = getAllData().xp.history.some(function(h) { return h.source === 'lesson' && h.nodeId === nodeId; });

  let html = ''
    + '<div class="lesson-topbar">'
    + '<div class="lesson-topbar-top">'
    + '<span class="back-link" id="lesson-back">< Back to Map</span>'
    + '<span>Node ' + node.id + ' of 41 - ' + (hasXp ? 'XP: +0 (done)' : 'XP: +10 available') + '</span>'
    + '</div>'
    + '<div class="lesson-progress-bar"><div class="lesson-progress-fill" id="lesson-progress-fill" style="width:0%"></div></div>'
    + '</div>'
    + '<div class="lesson-world-label">World ' + world.id + ' -- ' + world.title + '</div>'
    + '<div class="lesson-title"><h2>' + escapeHtml(node.title) + '</h2></div>';

  if (node.hook) {
    html += '<div class="lesson-hook">' + escapeHtml(node.hook) + '</div>';
  }

  if (node.objectives && node.objectives.length) {
    html += '<div class="lesson-objectives"><h3>Learning Objectives</h3>';
    for (let i = 0; i < node.objectives.length; i++) {
      const checked = progress.objectivesChecked[nodeId] && progress.objectivesChecked[nodeId].indexOf(i) !== -1;
      html += '<div class="obj-row" data-obj="' + i + '">'
        + '<div class="obj-checkbox' + (checked ? ' checked' : '') + '"></div>'
        + '<span class="obj-text' + (checked ? ' done' : '') + '">' + escapeHtml(node.objectives[i]) + '</span>'
        + '</div>';
    }
    html += '</div>';
  }

  for (let si = 0; si < node.sections.length; si++) {
    const sec = node.sections[si];
    html += '<div class="lesson-section">';
    if (sec.heading) html += '<h3 class="section-heading">' + escapeHtml(sec.heading) + '</h3>';

    if (sec.type === 'text') {
      html += '<div class="lesson-text">' + renderText(sec.content) + '</div>';
    } else if (sec.type === 'code') {
      html += '<div class="lesson-code">'
        + '<button class="lesson-code-copy" data-code="' + attrEsc(sec.code) + '">Copy</button>'
        + '<pre><code class="language-' + (sec.language || 'plaintext') + '">' + escapeHtml(sec.code) + '</code></pre>'
        + '</div>';
    } else if (sec.type === 'mermaid') {
      html += '<div class="lesson-mermaid"><pre class="mermaid">' + escapeHtml(sec.code) + '</pre></div>';
    } else if (sec.type === 'table') {
      html += '<div class="lesson-table-wrap"><table class="lesson-table">';
      if (sec.headers && sec.headers.length) {
        html += '<thead><tr>';
        for (let hi = 0; hi < sec.headers.length; hi++) {
          html += '<th>' + escapeHtml(sec.headers[hi]) + '</th>';
        }
        html += '</tr></thead>';
      }
      if (sec.rows && sec.rows.length) {
        html += '<tbody>';
        for (let ri = 0; ri < sec.rows.length; ri++) {
          html += '<tr>';
          for (let ci = 0; ci < sec.rows[ri].length; ci++) {
            html += '<td>' + escapeHtml(sec.rows[ri][ci]) + '</td>';
          }
          html += '</tr>';
        }
        html += '</tbody>';
      }
      html += '</table></div>';
    }
    html += '</div>';
  }

  if (node.resources && node.resources.length) {
    html += '<div class="lesson-resources"><h3>Free Resources</h3><ul>';
    for (let ri = 0; ri < node.resources.length; ri++) {
      const r = node.resources[ri];
      html += '<li><a href="' + attrEsc(r.url) + '" target="_blank" rel="noopener">' + escapeHtml(r.label) + '</a></li>';
    }
    html += '</ul></div>';
  }

  const qs = progress.completedQuizzes[nodeId];
  const quizLabel = qs ? 'Retake Quiz (was ' + qs.score + '/' + qs.total + ')' : 'Take Quiz';
  html += '<div class="lesson-cta"><button class="btn btn-primary" id="lesson-quiz-btn">' + quizLabel + '</button></div>';

  $('#lesson-content').innerHTML = html;

  const fillEl = $('#lesson-progress-fill');
  function onScroll() {
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollH > 0 ? Math.min(100, Math.round((window.scrollY / scrollH) * 100)) : 0;
    fillEl.style.width = pct + '%';
  }
  window.addEventListener('scroll', onScroll);

  if (!hasXp) {
    const p = getProgress();
    if (p.completedNodes.indexOf(nodeId) === -1) {
      p.completedNodes.push(nodeId);
      setProgress(p);
    }
    addXp(10, 'lesson', nodeId);
  }

  $('#lesson-back').onclick = function() { navigate('#/map'); };
  $('#lesson-quiz-btn').onclick = function() { navigate('#/quiz/' + nodeId); };

  $$('.obj-row').forEach(function(row) {
    row.addEventListener('click', function() {
      const idx = parseInt(this.dataset.obj);
      const p = getProgress();
      if (!p.objectivesChecked[nodeId]) p.objectivesChecked[nodeId] = [];
      const arr = p.objectivesChecked[nodeId];
      const pos = arr.indexOf(idx);
      if (pos !== -1) arr.splice(pos, 1); else arr.push(idx);
      setProgress(p);
      var cb = this.querySelector('.obj-checkbox');
      var txt = this.querySelector('.obj-text');
      cb.classList.toggle('checked');
      txt.classList.toggle('done');
    });
  });

  $$('.lesson-code-copy').forEach(function(btn) {
    btn.addEventListener('click', function() {
      navigator.clipboard.writeText(this.dataset.code).then(function() {
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 1500);
      });
    });
  });

  if (window.mermaid) {
    try { mermaid.run({ nodes: document.querySelectorAll('.mermaid') }); } catch (e) { /* silent */ }
  }
}

function attrEsc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var TEXT_ENTITY_MAP = {
  '\u2014': '&mdash;',
  '\u2013': '&ndash;',
  '\u2192': '&rarr;',
  '\u2190': '&larr;',
  '\u20B9': '&#8377;',
  '\u00B2': '&sup2;',
  '\u00B3': '&sup3;',
  '\u00D7': '&times;',
  '\u00F7': '&divide;',
  '\u2212': '&minus;',
  '\u2264': '&le;',
  '\u2265': '&ge;',
  '\u00B1': '&plusmn;',
  '\u03A0': '&Pi;',
  '\u03A3': '&Sigma;',
  '\u03BB': '&lambda;',
  '\u2713': '&#10003;',
  '\u25B6': '&#9654;',
  '\u2714': '&#10004;',
  '\u00B0': '&deg;'
};

function nonAsciiToEntities(str) {
  return str.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])|[^\x00-\x7F]/g, function(match, pair) {
    if (pair) {
      var hi = pair.charCodeAt(0);
      var lo = pair.charCodeAt(1);
      var code = (hi - 0xD800) * 0x400 + (lo - 0xDC00) + 0x10000;
      return '&#x' + code.toString(16) + ';';
    }
    return TEXT_ENTITY_MAP[match] || '&#' + match.charCodeAt(0) + ';';
  });
}

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
  le: '&#8804;', ge: '&#8805;', ne: '&#8800;', approx: '&#8776;',
  sim: '&#8764;', simeq: '&#8771;', cong: '&#8773;', equiv: '&#8801;',
  subset: '&#8834;', supset: '&#8835;', subseteq: '&#8838;', supseteq: '&#8839;',
  in: '&#8712;', notin: '&#8713;', cap: '&#8745;', cup: '&#8746;',
  emptyset: '&#8709;', nabla: '&#8711;', partial: '&#8706;',
  exists: '&#8707;', forall: '&#8704;', infinity: '&#8734;',
  to: '&#8594;', gets: '&#8592;', leftarrow: '&#8592;', rightarrow: '&#8594;',
  Leftrightarrow: '&#8660;', Leftarrow: '&#8656;', Rightarrow: '&#8658;',
  implies: '&#8658;', iff: '&#8660;',
  ldots: '&#8230;', cdots: '&#8943;', vdots: '&#8942;', ddots: '&#8945;',
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

function latexToHtml(math) {
  math = math.replace(/\\text\{([^}]*)\}/g, '$1');
  math = math.replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>');
  math = math.replace(/_\{([^}]*)\}/g, '<sub>$1</sub>');
  math = math.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');
  math = math.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');

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
  math = result;

  math = math.replace(/\\sqrt(?:\[([^\]]*)\])?\{([^}]*)\}/g, function(m, n, rad) {
    return '&#8730;<span class="sqrt">' + latexToHtml(rad) + '</span>';
  });
  math = math.replace(/\\left\s*[([{|\]]?/g, '');
  math = math.replace(/\\right\s*[)\]}|]?/g, '');
  math = math.replace(/\\qquad/g, '  ');
  math = math.replace(/\\quad/g, '  ');
  math = math.replace(/\\,/g, ' ');
  math = math.replace(/\\;/g, '  ');
  math = math.replace(/\\!/g, '');
  math = math.replace(/\\:/g, ' ');
  math = math.replace(/\\([a-zA-Z]+)/g, function(m, cmd) {
    return LATEX_MAP[cmd] || m;
  });
  return math;
}

function renderText(content) {
  if (!content) return '';
  var h = content;
  // Protect code blocks first
  var codeBlocks = [];
  h = h.replace(/`([^`]+)`/g, function(m, c) {
    codeBlocks.push('<code>' + c + '</code>');
    return '%%CODE' + (codeBlocks.length - 1) + '%%';
  });
  // Handle display math $$...$$
  h = h.replace(/\$\$([\s\S]+?)\$\$/g, function(m, inner) {
    return '<div class="math-block">' + latexToHtml(inner.trim()) + '</div>';
  });
  // Handle inline math $...$
  h = h.replace(/\$([^$]+)\$/g, function(m, inner) {
    return '<span class="math-inline">' + latexToHtml(inner) + '</span>';
  });
  // Restore code blocks
  for (var ci = 0; ci < codeBlocks.length; ci++) {
    h = h.replace('%%CODE' + ci + '%%', codeBlocks[ci]);
  }
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/\n\n/g, '</p><p>');
  h = '<p>' + h + '</p>';
  h = h.replace(/<p><\/p>/g, '');
  h = h.replace(/\n/g, '<br>');
  h = nonAsciiToEntities(h);
  return h;
}
