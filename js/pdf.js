import { renderMathText } from './math.js';

var PDFMAKE_SRC = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js';
var PDFMAKE_VFS = 'https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.js';

var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

var GOLD = '#b8860b';
var INK = '#1a1a1a';
var MUTED = '#8a8a8a';
var PATINA = '#1a6b57';
var VERMILION = '#8a2f1f';
var HAIRLINE = '#e0e0e0';

// --- Script loader (mirrors the lazy CDN pattern used by lesson.js) ---

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

var pdfmakePromise = null;

function loadPdfMake() {
  if (window.pdfMake && window.pdfMake.vfs) return Promise.resolve();
  if (!pdfmakePromise) {
    pdfmakePromise = loadScript(PDFMAKE_SRC)
      .then(function () { return loadScript(PDFMAKE_VFS); })
      .catch(function (err) {
        pdfmakePromise = null;
        throw err;
      });
  }
  return pdfmakePromise;
}

// --- HTML (from renderMathText) -> pdfmake inline text stack ---

var NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0',
  times: '\u00D7', divide: '\u00F7', minus: '\u2212', le: '\u2264', leq: '\u2264',
  ge: '\u2265', geq: '\u2265', ne: '\u2260', neq: '\u2260', plusmn: '\u00B1',
  mdash: '\u2014', ndash: '\u2013', rarr: '\u2192', larr: '\u2190',
  sup2: '\u00B2', sup3: '\u00B3', deg: '\u00B0', sdot: '\u00B7', cdot: '\u00B7',
  radic: '\u221A', infin: '\u221E', infty: '\u221E', cap: '\u2229', cup: '\u222A',
  int: '\u222B', sum: '\u2211', prod: '\u220F', partial: '\u2202', nabla: '\u2207',
  approx: '\u2248', sim: '\u223C', cong: '\u2245', equiv: '\u2261',
  subset: '\u2282', supset: '\u2283', subseteq: '\u2286', supseteq: '\u2287',
  notin: '\u2209', in: '\u2208', forall: '\u2200', exists: '\u2203',
  alpha: '\u03B1', beta: '\u03B2', gamma: '\u03B3', delta: '\u03B4',
  sigma: '\u03C3', Sigma: '\u03A3', pi: '\u03C0', Pi: '\u03A0',
  mu: '\u03BC', nu: '\u03BD', lambda: '\u03BB', Lambda: '\u039B',
  theta: '\u03B8', phi: '\u03C6', omega: '\u03C9', rho: '\u03C1',
  tau: '\u03C4', epsilon: '\u03B5', eta: '\u03B7', chi: '\u03C7', psi: '\u03C8'
};

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, function (m, code) {
      var n = parseInt(code, 10);
      return n ? String.fromCharCode(n) : m;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, function (m, code) {
      var n = parseInt(code, 16);
      return n ? String.fromCharCode(n) : m;
    })
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, function (m, name) {
      return NAMED_ENTITIES[name] || m;
    });
}

// Find the index of the closing tag that matches the opening tag starting at `start`.
function findClose(str, start, tagName) {
  var re = new RegExp('<' + tagName + '(?=[\\s/>])|</' + tagName + '\\s*>', 'gi');
  re.lastIndex = start;
  var depth = 1;
  for (;;) {
    var m = re.exec(str);
    if (!m) return -1;
    if (m[0][1] === '/') {
      depth--;
      if (depth === 0) return m.index;
    } else {
      depth++;
    }
  }
}

function extractClassInner(html, cls) {
  var re = new RegExp('<span[^>]*class="[^"]*\\b' + cls + '\\b[^"]*"[^>]*>');
  var m = re.exec(html);
  if (!m) return null;
  var openEnd = m.index + m[0].length;
  var closeIdx = findClose(html, openEnd, 'span');
  return closeIdx === -1 ? null : html.slice(openEnd, closeIdx);
}

function parseInline(str) {
  var segs = [];
  var i = 0;

  function pushText(t) {
    var d = decodeEntities(t);
    if (d) segs.push({ text: d });
  }

  while (i < str.length) {
    var lt = str.indexOf('<', i);
    if (lt === -1) { pushText(str.slice(i)); break; }
    if (lt > i) pushText(str.slice(i, lt));

    var gt = str.indexOf('>', lt);
    if (gt === -1) { pushText(str.slice(lt)); break; }

    var rawTag = str.slice(lt + 1, gt).trim();
    var isClose = rawTag[0] === '/';
    var tagName = (isClose ? rawTag.slice(1) : rawTag).split(/\s/)[0].toLowerCase();
    var selfClose = /\/\s*$/.test(rawTag) || tagName === 'br';

    if (selfClose) {
      if (tagName === 'br') pushText('\n');
      i = gt + 1;
      continue;
    }
    if (isClose) { i = gt + 1; continue; }

    var closeIdx = findClose(str, gt + 1, tagName);
    var innerHTML = closeIdx === -1 ? '' : str.slice(gt + 1, closeIdx);
    var after = closeIdx === -1 ? str.length : closeIdx + tagName.length + 3;

    if (tagName === 'span' && /class="[^"]*\bfrac\b/.test(rawTag)) {
      var numHtml = extractClassInner(innerHTML, 'frac-num');
      var denHtml = extractClassInner(innerHTML, 'frac-den');
      segs.push({ text: '(' });
      if (numHtml !== null) segs.push.apply(segs, parseInline(numHtml));
      segs.push({ text: ') / (' });
      if (denHtml !== null) segs.push.apply(segs, parseInline(denHtml));
      segs.push({ text: ')' });
      i = after;
      continue;
    }

    var innerSegs = parseInline(innerHTML);

    if (tagName === 'sub') innerSegs.forEach(function (s) { s.subscript = true; });
    else if (tagName === 'sup') innerSegs.forEach(function (s) { s.superscript = true; });
    else if (tagName === 'strong') innerSegs.forEach(function (s) { s.bold = true; });
    else if (tagName === 'em') innerSegs.forEach(function (s) { s.italics = true; });
    else if (tagName === 'span') {
      var cls = (rawTag.match(/class="([^"]*)"/) || [])[1] || '';
      if (cls.indexOf('acc-hat') !== -1) innerSegs.push({ text: '\u0302' });
      else if (cls.indexOf('acc-bar') !== -1) innerSegs.push({ text: '\u0304' });
    }

    segs.push.apply(segs, innerSegs);
    i = after;
  }
  return segs;
}

// Convert a plain-text/HTML string (from renderMathText) into a pdfmake inline node.
export function htmlToPdfStack(html) {
  var segs = parseInline(String(html || ''));
  if (!segs.length) return { text: '' };
  return { text: segs };
}

// Shortcut: render markdown+math text to a pdfmake inline node (PDF flavor).
function mathToPdfStack(src, opts) {
  return htmlToPdfStack(renderMathText(src, { pdf: true, rawLatex: !!(opts && opts.rawLatex) }));
}

// --- Report document ---

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function formatDateTime(d) {
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
    ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function timestampForFile(d) {
  return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear() +
    '_' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

function tableLayout() {
  return {
    hLineWidth: function () { return 0.5; },
    vLineWidth: function () { return 0; },
    hLineColor: function () { return HAIRLINE; },
    paddingLeft: function () { return 2; },
    paddingRight: function () { return 2; },
    paddingTop: function () { return 3; },
    paddingBottom: function () { return 3; }
  };
}

export function buildQuizDoc(args) {
  var node = args.node, world = args.world, responses = args.responses || [];
  var correctCount = args.correctCount, total = args.total;
  var xp = args.xp || 0;
  var identity = args.identity || null;
  var pct = total ? Math.round((correctCount / total) * 100) : 0;

  var tracked = identity && identity.type === 'tracked';
  var studentName = tracked ? (identity.name || '') : 'Guest';
  var uid = tracked ? String(identity.uid || '') : '—';
  var dateStr = formatDateTime(new Date());

  var content = [];

  content.push({ text: 'QuantTrain \u2014 Quiz Report', style: 'title' });
  content.push({ text: 'Node ' + node.id + ': ' + node.title, style: 'subtitle' });
  content.push({ text: 'World ' + world.id + ' \u2014 ' + world.title, style: 'meta' });

  content.push({
    table: {
      widths: ['14%', '86%'],
      body: [
        [{ text: 'Student', style: 'metaKey' }, { text: studentName, style: 'metaVal' }],
        [{ text: 'UID', style: 'metaKey' }, { text: uid, style: 'metaVal' }],
        [{ text: 'Date & Time', style: 'metaKey' }, { text: dateStr, style: 'metaVal' }],
        [{ text: 'Node', style: 'metaKey' }, { text: String(node.id), style: 'metaVal' }]
      ]
    },
    layout: tableLayout(),
    margin: [0, 4, 0, 14]
  });

  content.push({ text: 'Score: ' + correctCount + ' / ' + total + '  (' + pct + '%)', style: 'score' });
  content.push({ text: 'XP earned: +' + xp, style: 'scoreXp' });

  content.push({ text: ' ', style: 'spacer' });

  for (var qi = 0; qi < node.quiz.length; qi++) {
    var q = node.quiz[qi];
    var resp = responses[qi] || { selected: '', correct: false };
    var attemptedLetters = (resp.selected || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var correctLetters = [];
    for (var oi = 0; oi < q.options.length; oi++) {
      if (q.options[oi].correct) correctLetters.push(LETTERS[oi]);
    }
    var isCorrect = resp.correct === true;

    content.push({
      columns: [
        { text: 'Q' + (qi + 1), style: 'qNum', width: 'auto' },
        { text: q.type === 'multi' ? 'Multi-select' : 'Single', style: 'qType', width: '*' }
      ],
      margin: [0, 12, 0, 4]
    });
    content.push(Object.assign({}, mathToPdfStack(q.question, { rawLatex: node.rawMath }), { style: 'qText' }));

    for (var oi2 = 0; oi2 < q.options.length; oi2++) {
      var opt = q.options[oi2];
      var letter = LETTERS[oi2];
      var isCorrectOpt = !!opt.correct;
      var wasAttempted = attemptedLetters.indexOf(letter) !== -1;
      var marks = [];
      if (isCorrectOpt) marks.push('Correct answer');
      if (wasAttempted) marks.push('Your answer');

      var optBody = { text: [{ text: letter + ') ', bold: true }].concat(mathToPdfStack(opt.text, { rawLatex: node.rawMath }).text || []) };
      if (isCorrectOpt) optBody.color = PATINA;
      else if (wasAttempted) optBody.color = VERMILION;

      content.push({
        columns: [
          { text: '', width: 14 },
          optBody,
          { text: marks.join(' \u00B7 '), alignment: 'right', style: 'optMark' }
        ],
        margin: [0, 2, 0, 2]
      });
    }

    content.push({
      text: isCorrect ? 'Correct' : 'Incorrect \u2014 correct answer: ' + correctLetters.join(', '),
      style: isCorrect ? 'resCorrect' : 'resWrong',
      margin: [0, 6, 0, 4]
    });
  }

  return {
    pageSize: 'A4',
    pageMargins: [44, 60, 44, 56],
    defaultStyle: { fontSize: 10, color: INK, lineHeight: 1.35 },
    header: {
      text: 'QuantTrain \u2014 Quiz Report',
      style: 'header',
      margin: [44, 26, 44, 0]
    },
    footer: function (currentPage, pageCount) {
      return {
        text: 'QuantTrain \u00B7 Page ' + currentPage + ' of ' + pageCount,
        alignment: 'center',
        color: MUTED,
        fontSize: 8,
        margin: [0, 14, 0, 0]
      };
    },
    content: content,
    styles: {
      header: { fontSize: 9, color: GOLD },
      title: { fontSize: 22, bold: true, color: INK, margin: [0, 0, 0, 6] },
      subtitle: { fontSize: 14, color: '#4a4a4a', margin: [0, 0, 0, 2] },
      meta: { fontSize: 10, color: MUTED, margin: [0, 0, 0, 6] },
      metaKey: { bold: true, color: MUTED, fontSize: 9 },
      metaVal: { fontSize: 10, color: INK },
      score: { fontSize: 16, bold: true, color: INK, margin: [0, 2, 0, 2] },
      scoreXp: { fontSize: 11, color: GOLD, margin: [0, 0, 0, 6] },
      spacer: { fontSize: 1, margin: [0, 0, 0, 8] },
      qNum: { fontSize: 12, bold: true, color: GOLD },
      qType: { fontSize: 9, color: MUTED, alignment: 'right' },
      qText: { fontSize: 11, color: INK, bold: true, margin: [0, 0, 0, 6] },
      optMark: { fontSize: 8, color: MUTED },
      resCorrect: { fontSize: 10, bold: true, color: PATINA },
      resWrong: { fontSize: 10, bold: true, color: VERMILION }
    }
  };
}

function toSlug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function fileNameFor(args) {
  var node = args.node;
  var identity = args.identity || null;
  var tracked = identity && identity.type === 'tracked';
  var nameSlug = toSlug(tracked ? (identity.name || identity.uid || '') : '') || 'guest';
  var slug = toSlug(node.title);
  return 'QuantTrain-Quiz-Node' + node.id + (slug ? '-' + slug : '') +
    '-' + nameSlug + '-' + timestampForFile(new Date()) + '.pdf';
}

export function downloadQuizReport(args) {
  return loadPdfMake().then(function () {
    var doc = buildQuizDoc(args);
    window.pdfMake.createPdf(doc).download(fileNameFor(args));
  });
}
