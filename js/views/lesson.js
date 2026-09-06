import { getProgress, setProgress, addXp, getAllData } from '../store.js';
import { $, $$, show, navigate, getNode, getWorldForNode, getCurriculum, escapeHtml } from '../utils.js';
import { renderText } from '../math.js';
import { track, syncProgress } from '../sync.js';
import { showXpPopup } from '../gamification/xp-popup.js';
import { checkBadgesAfterLesson } from '../gamification/badges.js';
import { checkLevelUp } from '../gamification/celebrate.js';

let currentNodeId = null;
let scrollHandler = null;

export function render(nodeId) {
  const node = getNode(nodeId);
  if (!node) { navigate('#/map'); return; }
  currentNodeId = nodeId;
  const mathOpts = node.rawMath ? { rawLatex: true } : undefined;
  show('lesson-view');
  track('node_enter', nodeId);
  const world = getWorldForNode(nodeId);
  const progress = getProgress();
  const hasXp = getAllData().xp.history.some(function(h) { return h.source === 'lesson' && h.nodeId === nodeId; });
  const alreadyDone = hasXp || progress.completedNodes.indexOf(nodeId) !== -1;

  let html = ''
    + '<div class="lesson-topbar">'
    + '<div class="lesson-topbar-top">'
    + '<span class="back-link" id="lesson-back">< Back to Map</span>'
    + '<span>Node ' + node.id + ' of ' + totalNodes() + ' - ' + (alreadyDone ? 'XP: +0 (done)' : 'XP: +10 available') + '</span>'
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
      html += '<div class="lesson-text">' + renderText(sec.content, mathOpts) + '</div>';
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
  window.scrollTo(0, 0);

  if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
  const fillEl = $('#lesson-progress-fill');
  function onScroll() {
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollH > 0 ? Math.min(100, Math.round((window.scrollY / scrollH) * 100)) : 0;
    fillEl.style.width = pct + '%';
  }
  scrollHandler = onScroll;
  window.addEventListener('scroll', onScroll);

  if (!alreadyDone) {
    const oldXp = getAllData().xp.total;
    const p = getProgress();
    p.completedNodes.push(nodeId);
    setProgress(p);
    addXp(10, 'lesson', nodeId);
    syncProgress();
    const newXp = getAllData().xp.total;
    showXpPopup(10, $('#lesson-quiz-btn'));
    checkLevelUp(oldXp, newXp);
    checkBadgesAfterLesson(nodeId);
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
      syncProgress();
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

  loadLessonLibs();
}

var HLJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
var HLJS_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
var MERMAID_SRC = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';

var hljsPromise = null;
var mermaidPromise = null;

function loadScript(src) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function ensureStyle(href, id) {
  if (document.getElementById(id)) return;
  var l = document.createElement('link');
  l.id = id;
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

function highlightBlocks() {
  document.querySelectorAll('#lesson-content pre code').forEach(function(block) {
    try { hljs.highlightElement(block); } catch (e) { /* silent */ }
  });
}

function fixMermaidViewBoxes() {
  document.querySelectorAll('#lesson-content .mermaid svg').forEach(function(svg) {
    var root = svg.querySelector('.root');
    if (!root || !root.getBBox) return;
    var bb;
    try { bb = root.getBBox(); } catch (e) { return; }
    if (!bb || !isFinite(bb.width) || bb.width === 0) return;
    var m = 24;
    var x = Math.floor(bb.x - m);
    var y = Math.floor(bb.y - m);
    var w = Math.ceil(bb.width + m * 2);
    var h = Math.ceil(bb.height + m * 2);
    svg.setAttribute('viewBox', x + ' ' + y + ' ' + w + ' ' + h);
    svg.style.maxWidth = '';
  });
}

function initMermaid() {
  try {
    mermaid.initialize({
      theme: 'dark',
      themeVariables: {
        primaryColor: '#d4a74a',
        secondaryColor: '#5a9e8c',
        tertiaryColor: '#1a1a2e',
        mainBkg: '#1c1c2e',
        lineColor: '#d4a74a',
        textColor: '#e8e0d4',
        fontSize: '14px'
      },
      flowchart: { useMaxWidth: true },
      useMaxWidth: true
    });
    var p = mermaid.run({ nodes: document.querySelectorAll('#lesson-content .mermaid') });
    if (p && p.then) p.then(fixMermaidViewBoxes);
    else fixMermaidViewBoxes();
  } catch (e) { /* silent */ }
}

function loadLessonLibs() {
  var hasCode = document.querySelectorAll('#lesson-content pre code').length > 0;
  var hasMermaid = document.querySelectorAll('#lesson-content .mermaid').length > 0;

  if (hasCode) {
    ensureStyle(HLJS_CSS, 'highlight-theme');
    if (window.hljs) {
      highlightBlocks();
    } else {
      if (!hljsPromise) hljsPromise = loadScript(HLJS_SRC);
      hljsPromise.then(highlightBlocks).catch(function() {});
    }
  }

  if (hasMermaid) {
    if (window.mermaid) {
      initMermaid();
    } else {
      if (!mermaidPromise) mermaidPromise = loadScript(MERMAID_SRC);
      mermaidPromise.then(initMermaid).catch(function() {});
    }
  }
}

function attrEsc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function totalNodes() {
  const data = getCurriculum();
  if (!data) return 42;
  return data.worlds.reduce(function(a, w) { return a + w.nodes.length; }, 0);
}

