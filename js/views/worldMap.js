import { getProgress, setProgress, getXp, getLevel, getXpForNextLevel, getStreak, getBadges, getIdentity, resetAll, getAllData } from '../store.js';
import { $, $$, show, navigate, getCurriculum, getNode, escapeHtml } from '../utils.js';
import { renderBadgeChips, getBadgeMeta } from '../gamification/badges.js';

let popoverBound = false;

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

  const identity = getIdentity();
  const isTracked = !!(identity && identity.type !== 'guest');
  const badges = getBadges();
  const allData = getAllData();
  const quizCount = Object.keys(allData.progress.completedQuizzes).length;

  let headerRight = '<div class="map-header-right">';
  if (isTracked) {
    headerRight += '<div class="account-wrap">'
      + '<button class="account-btn" id="account-btn" aria-haspopup="true" aria-expanded="false">'
      + '<span class="account-name">' + escapeHtml(identity.name || identity.uid || '') + '</span>'
      + '</button>'
      + '<div class="account-popover" id="account-popover" role="dialog" aria-label="Account details">'
      + '<div class="popover-name">' + escapeHtml(identity.name || '') + '</div>'
      + '<dl class="popover-grid">'
      + '<dt>UID</dt><dd>' + escapeHtml(identity.uid || '') + '</dd>'
      + '<dt>Year</dt><dd>' + escapeHtml(identity.year || '') + '</dd>'
      + '<dt>Course</dt><dd>' + escapeHtml(identity.course || '') + '</dd>'
      + '<dt>Longest Streak</dt><dd>\uD83D\uDD25 ' + streak.longest + ' days</dd>'
      + '<dt>Quizzes</dt><dd>' + quizCount + ' / 42</dd>'
      + '</dl>'
      + '<div style="margin-top:12px"><div style="font-family:var(--font-mono);font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-faint);margin-bottom:6px">Badges (' + badges.length + ')</div>'
      + '<div class="gam-badge-chips" id="popover-badges"></div></div>'
      + '<div style="margin-top:12px"><a href="#/leaderboard" style="font-size:0.75rem;color:var(--patina)">View Leaderboard</a></div>'
      + '</div>'
      + '</div>';
  }
  headerRight += '<button class="map-logout-btn" id="map-logout">Logout</button></div>';

  let html = '<div class="map-header">'
    + '<div class="map-brand">QuantTrain</div>'
    + headerRight
    + '</div>'
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

  const xpProgress = getXpForNextLevel(xp.total);
  const xpPct = xpProgress.needed > 0 ? Math.min(100, Math.round((xpProgress.current / xpProgress.needed) * 100)) : 100;
  const streakActive = streak.current > 0 && streak.lastActive && (function() {
    var last = new Date(streak.lastActive);
    var today = new Date(); today.setHours(0,0,0,0); last.setHours(0,0,0,0);
    return Math.round((today - last) / 86400000) <= 1;
  })();

  html += '<div class="map-stats">'
    + '<span class="map-stat"><span class="map-stat-icon gold">XP</span><span>' + xp.total + ' XP</span></span>'
    + '<span class="map-stat"><span class="gam-xp-progress"><span class="gam-xp-progress-track"><span class="gam-xp-progress-fill" style="width:' + xpPct + '%"></span></span><span class="gam-xp-progress-label">Lv' + level + '</span></span></span>'
    + '<span class="map-stat"><span class="map-stat-icon ' + (streakActive ? 'patina' : '') + '"><span class="gam-streak-fire' + (streakActive ? ' active' : '') + '">\uD83D\uDD25</span></span><span>' + streak.current + '</span></span>'
    + '<span class="map-stat"><span class="map-stat-icon gold">\uD83C\uDFC6</span><span>' + badges.length + '</span></span>'
    + '<span class="map-stat"><a href="#/leaderboard" style="color:var(--patina);font-size:0.8rem">Leaderboard</a></span>'
    + '</div>';

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

  $('#map-logout').onclick = function() { resetAll(); navigate('#/login'); };

  if (isTracked) {
    setupAccountPopover();
    bindPopoverGlobals();
    var badgeContainer = $('#popover-badges');
    if (badgeContainer) renderBadgeChips(badges, badgeContainer, true);
  }
}

function setupAccountPopover() {
  const btn = $('#account-btn');
  const popover = $('#account-popover');
  if (!btn || !popover) return;
  btn.addEventListener('click', function() {
    const isOpen = popover.classList.contains('open');
    if (isOpen) closePopover(btn, popover);
    else openPopover(btn, popover);
  });
}

function bindPopoverGlobals() {
  if (popoverBound) return;
  popoverBound = true;

  document.addEventListener('click', function(e) {
    const popover = $('#account-popover');
    if (!popover || !popover.classList.contains('open')) return;
    const wrap = $('.account-wrap');
    if (wrap && wrap.contains(e.target)) return;
    closePopover($('#account-btn'), popover);
  });

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    const popover = $('#account-popover');
    if (!popover || !popover.classList.contains('open')) return;
    closePopover($('#account-btn'), popover);
    const btn = $('#account-btn');
    if (btn) btn.focus();
  });
}

function openPopover(btn, popover) {
  popover.classList.add('open');
  btn.classList.add('open');
  btn.setAttribute('aria-expanded', 'true');
}

function closePopover(btn, popover) {
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  if (popover) popover.classList.remove('open');
}

