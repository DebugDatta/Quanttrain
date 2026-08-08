import { getProgress } from './store.js';
import { $, $$, getCurriculum, escapeHtml } from './utils.js';

let bound = false;

export function initSyllabus() {
  injectFab();
  updateFabVisibility();
  bindGlobals();
}

function injectFab() {
  if ($('#syllabus-fab')) return;
  const fab = document.createElement('button');
  fab.className = 'syllabus-fab';
  fab.id = 'syllabus-fab';
  fab.setAttribute('aria-haspopup', 'dialog');
  fab.setAttribute('aria-expanded', 'false');
  fab.textContent = 'Syllabus';
  document.body.appendChild(fab);
}

export function updateFabVisibility() {
  const fab = $('#syllabus-fab');
  if (!fab) return;
  const active = $('.view.active');
  const hidden = active && active.id === 'login-view';
  fab.style.display = hidden ? 'none' : '';
}

function outlineState(progress, n) {
  const isDone = progress.completedNodes.indexOf(n.id) !== -1;
  const qDone = progress.completedQuizzes[n.id];
  if (isDone && qDone) return 'completed';
  if (isDone) return 'inprogress';
  return 'unvisited';
}

export function buildSyllabus() {
  removeSyllabus();
  const data = getCurriculum();
  if (!data) return;
  const progress = getProgress();
  const totalNodes = data.worlds.reduce((a, w) => a + w.nodes.length, 0);
  const completedCount = progress.completedNodes.length;
  const chevron = '<svg class="outline-chevron" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let body = '';
  for (const w of data.worlds) {
    const wCompleted = w.nodes.filter(n => progress.completedNodes.indexOf(n.id) !== -1).length;
    const wTotal = w.nodes.length;
    const wPct = Math.round((wCompleted / wTotal) * 100);
    let rows = '';
    for (const n of w.nodes) {
      rows += '<a class="outline-node" href="#/lesson/' + n.id + '" data-node="' + n.id + '">'
        + '<span class="outline-node-dot ' + outlineState(progress, n) + '"></span>'
        + '<span class="outline-node-label">' + escapeHtml(n.title) + '</span>'
        + '<span class="outline-node-id">' + n.id + '</span>'
        + '</a>';
    }
    body += '<div class="outline-world open">'
      + '<button class="outline-world-head" aria-expanded="true">'
      + '<span class="outline-world-title">World ' + w.id + ' -- ' + escapeHtml(w.title) + '</span>'
      + '<span class="outline-world-meta">' + wCompleted + '/' + wTotal + ' ' + wPct + '%</span>'
      + chevron
      + '</button>'
      + '<div class="outline-nodes">' + rows + '</div>'
      + '</div>';
  }

  const html = '<div class="outline-backdrop" id="outline-backdrop"></div>'
    + '<aside class="outline-drawer" id="outline-drawer" role="dialog" aria-modal="true" aria-label="Course outline" aria-hidden="true">'
    + '<div class="outline-head">'
    + '<div><div class="outline-title">Course Outline</div>'
    + '<div class="outline-sub">' + completedCount + ' / ' + totalNodes + ' nodes complete</div></div>'
    + '<button class="outline-close" id="outline-close" aria-label="Close outline">&#10005;</button>'
    + '</div>'
    + '<div class="outline-body">' + body + '</div>'
    + '</aside>';

  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  const drawer = $('#outline-drawer');
  if (!drawer) return;

  $('#outline-close').addEventListener('click', closeSyllabus);
  $('#outline-backdrop').addEventListener('click', closeSyllabus);

  $$('.outline-world-head').forEach(function(head) {
    head.addEventListener('click', function() {
      const world = this.closest('.outline-world');
      const isOpen = world.classList.contains('open');
      if (isOpen) world.classList.remove('open');
      else world.classList.add('open');
      this.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    });
  });
}

export function openSyllabus() {
  buildSyllabus();
  const drawer = $('#outline-drawer');
  const backdrop = $('#outline-backdrop');
  const fab = $('#syllabus-fab');
  if (drawer) void drawer.offsetWidth;
  if (drawer) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  if (backdrop) backdrop.classList.add('open');
  if (fab) {
    fab.classList.add('open');
    fab.setAttribute('aria-expanded', 'true');
  }
}

export function closeSyllabus() {
  const drawer = $('#outline-drawer');
  const backdrop = $('#outline-backdrop');
  const fab = $('#syllabus-fab');
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (backdrop) backdrop.classList.remove('open');
  if (fab) {
    fab.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
  }
}

export function toggleSyllabus() {
  const drawer = $('#outline-drawer');
  const isOpen = drawer && drawer.classList.contains('open');
  if (isOpen) closeSyllabus();
  else openSyllabus();
}

export function removeSyllabus() {
  const drawer = $('#outline-drawer');
  if (drawer) drawer.remove();
  const backdrop = $('#outline-backdrop');
  if (backdrop) backdrop.remove();
}

function bindGlobals() {
  if (bound) return;
  bound = true;

  document.addEventListener('click', function(e) {
    const fab = $('#syllabus-fab');
    if (fab && (e.target === fab || fab.contains(e.target))) {
      toggleSyllabus();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const drawer = $('#outline-drawer');
    if (!drawer || !drawer.classList.contains('open')) return;
    closeSyllabus();
    const fab = $('#syllabus-fab');
    if (fab) fab.focus();
  });

  window.addEventListener('hashchange', function() {
    closeSyllabus();
    removeSyllabus();
    updateFabVisibility();
  });
}
