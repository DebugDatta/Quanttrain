import { getProgress, setProgress, getXp, getLevel, getStreak, clearIdentity } from '../store.js';
import { $, $$, show, navigate, getCurriculum, getNode } from '../utils.js';

export function render() {
  show('map-view');
  const data = getCurriculum();
  if (!data) { $('#map-content').innerHTML = '<p class="text-muted">Failed to load curriculum data.</p>'; return; }
  const progress = getProgress();
  const xp = getXp();
  const streak = getStreak();
  const level = getLevel(xp.total);
  const totalNodes = data.worlds.reduce((a, w) => a + w.nodes.length, 0);
  const completedCount = progress.completedNodes.length;
  const pct = totalNodes ? Math.round((completedCount / totalNodes) * 100) : 0;

  let html = '<div class="map-header">'
    + '<div class="map-brand">QuantTrain</div>'
    + '<div class="map-stats">'
    + '<span class="map-stat"><span class="map-stat-icon gold">XP</span><span>' + xp.total + ' XP</span></span>'
    + '<span class="map-stat"><span class="map-stat-icon gold">LV</span><span>Lv' + level + '</span></span>'
    + '<span class="map-stat"><span class="map-stat-icon patina">ST</span><span>' + streak.current + '</span></span>'
    + '<button class="map-logout-btn" id="map-logout">Logout</button>'
    + '</div></div>'
    + '<div class="progress-overall">'
    + '<div class="progress-overall-label"><span>Overall Progress</span><span>' + completedCount + ' / ' + totalNodes + ' nodes</span></div>'
    + '<div class="progress-overall-bar"><div class="progress-overall-fill" style="width:' + pct + '%"></div></div>'
    + '</div>';

  if (progress.lastVisitedNode) {
    const node = getNode(progress.lastVisitedNode);
    if (node) {
      html += '<button class="continue-btn" data-node="' + node.id + '" data-view="' + (progress.lastVisitedView || 'lesson') + '">'
        + '>> Continue: ' + node.title + '</button>';
    }
  }

  for (const w of data.worlds) {
    const wCompleted = w.nodes.filter(n => progress.completedNodes.includes(n.id)).length;
    const wTotal = w.nodes.length;
    const wPct = Math.round((wCompleted / wTotal) * 100);
    html += '<div class="world-row">'
      + '<div class="world-row-header">'
      + '<div><div class="world-row-title">World ' + w.id + ' -- ' + w.title + '</div>'
      + (w.subtitle ? '<div class="world-row-subtitle">' + w.subtitle + '</div>' : '') + '</div>'
      + '<div class="world-row-progress">' + wCompleted + '/' + wTotal + ' ' + wPct + '%</div>'
      + '</div>'
      + '<div class="world-progress-bar"><div class="world-progress-fill" style="width:' + wPct + '%"></div></div>'
      + '<div class="node-row">';
    for (let i = 0; i < w.nodes.length; i++) {
      const n = w.nodes[i];
      const isDone = progress.completedNodes.includes(n.id);
      const qDone = progress.completedQuizzes[n.id];
      let cls = 'node-circle-unvisited';
      if (isDone && qDone) cls = 'node-circle-completed';
      else if (isDone) cls = 'node-circle-inprogress';
      html += '<div class="node-circle ' + cls + '" data-node="' + n.id + '" title="' + n.title + '">' + n.id + '</div>';
      if (i < w.nodes.length - 1) html += '<span class="node-separator">--</span>';
    }
    html += '</div></div>';
  }

  $('#map-content').innerHTML = html;

  $$('.node-circle').forEach(c => c.addEventListener('click', function() {
    const nid = parseInt(this.dataset.node);
    const p = getProgress(); p.lastVisitedNode = nid; p.lastVisitedView = 'lesson'; setProgress(p);
    navigate('#/lesson/' + nid);
  }));

  const cb = $('.continue-btn');
  if (cb) cb.addEventListener('click', function() {
    navigate('#/' + this.dataset.view + '/' + this.dataset.node);
  });

  $('#map-logout').onclick = function() { clearIdentity(); navigate('#/login'); };
}
