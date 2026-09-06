import { computeDerived } from './fetch.js';
import { escapeHtml, getCurriculum, getNode } from '../utils.js';
import { getLevel } from '../store.js';

var BADGE_META = {
  'first_lesson': { icon: '\uD83D\uDCD6', label: 'First Lesson' },
  'first_quiz': { icon: '\uD83C\uDFAB', label: 'First Quiz' },
  'perfect_score': { icon: '\u2B50', label: 'Perfect Score' },
  'world_traveler': { icon: '\uD83C\uDF0D', label: 'World Traveler' },
  'streak_3': { icon: '\uD83D\uDD25', label: '3-Day Streak' },
  'streak_7': { icon: '\uD83D\uDD25', label: '7-Day Streak' },
  'streak_14': { icon: '\uD83D\uDD25', label: '14-Day Streak' },
  'quiz_master': { icon: '\uD83C\uDFAF', label: 'Quiz Master' }
};

function getNodeTitle(nodeId) {
  var node = getNode(nodeId);
  return node ? node.title : 'Node ' + nodeId;
}

function levelRing(pct) {
  return '<div class="admin-card-ring">'
    + '<div class="admin-card-ring-bg" style="background:conic-gradient(var(--gold) ' + pct + '%, var(--bg-deep) ' + pct + '%)"></div>'
    + '<div class="admin-card-ring-inner"><span class="admin-card-level" id="card-level-num">0</span><span class="admin-card-level-label">Level</span></div>'
    + '</div>';
}

function relativeTime(lastActive) {
  if (!lastActive) return 'Never';
  var last = new Date(lastActive);
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  var days = Math.round((now - last) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days <= 7) return days + ' days ago';
  if (days <= 30) return Math.floor(days / 7) + ' weeks ago';
  return Math.floor(days / 30) + ' months ago';
}

function section(title, bodyHtml, defaultOpen) {
  var cls = 'admin-detail-section' + (defaultOpen ? ' open' : '');
  return '<div class="' + cls + '">'
    + '<div class="admin-detail-section-title">' + title + '</div>'
    + '<div class="admin-detail-section-body">' + bodyHtml + '</div>'
    + '</div>';
}

function renderHeatmap(student) {
  var data = getCurriculum();
  var nodeCount = 42;
  if (data) {
    nodeCount = data.worlds.reduce(function(a, w) { return a + w.nodes.length; }, 0);
  }
  var html = '<div class="admin-heatmap-grid">';
  for (var i = 1; i <= nodeCount; i++) {
    var q = (student.completedQuizzes || {})[String(i)];
    var cls = 'no-data';
    var label = 'Node ' + i + ': No attempt';
    if (q) {
      var pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
      if (pct === 100) { cls = 'perfect'; }
      else if (pct >= 70) { cls = 'high'; }
      else if (pct >= 40) { cls = 'mid'; }
      else { cls = 'low'; }
      label = 'Node ' + i + ': ' + q.score + '/' + q.total + ' (' + pct + '%)';
    }
    html += '<div class="admin-heatmap-cell ' + cls + '">' + i + '<span class="admin-heatmap-tooltip">' + label + '</span></div>';
  }
  html += '</div>';
  return section('Quiz Performance (' + nodeCount + ' Nodes)', html, true);
}

function renderBadges(badges) {
  var html = '';
  if (!badges || badges.length === 0) {
    html = '<span style="font-size:0.8rem;color:var(--text-faint)">No badges earned yet</span>';
  } else {
    html = '<div class="admin-badge-chips">';
    for (var i = 0; i < badges.length; i++) {
      var b = badges[i];
      var meta = BADGE_META[b] || { icon: '\uD83C\uDFC5', label: b.replace(/_/g, ' ') };
      html += '<span class="admin-badge-chip"><span class="badge-icon">' + meta.icon + '</span> ' + escapeHtml(meta.label) + '</span>';
    }
    html += '</div>';
  }
  return section('Badges (' + (badges ? badges.length : 0) + ')', html, false);
}

function renderQuizScores(completedQuizzes) {
  var keys = Object.keys(completedQuizzes || {});
  if (keys.length === 0) return '';

  var items = [];
  for (var i = 0; i < keys.length; i++) {
    var id = parseInt(keys[i], 10);
    var q = completedQuizzes[keys[i]];
    var pct = q.total > 0 ? Math.round((q.score / q.total) * 100) : 0;
    items.push({ id: id, score: q.score, total: q.total, pct: pct, title: getNodeTitle(id) });
  }
  items.sort(function(a, b) { return a.id - b.id; });

  var html = '<table class="admin-quiz-scores-table"><thead><tr><th style="width:50px">Node</th><th>Title</th><th style="width:200px">Score</th><th style="width:60px">%</th></tr></thead><tbody>';

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var barCls = it.pct === 100 ? 'perfect' : it.pct >= 70 ? 'high' : it.pct >= 50 ? 'mid' : 'low';
    html += '<tr>';
    html += '<td class="admin-xp-cell">' + it.id + '</td>';
    html += '<td>' + escapeHtml(it.title) + '</td>';
    html += '<td><div class="admin-quiz-score-bar"><div class="admin-quiz-score-bar-track"><div class="admin-quiz-score-bar-fill ' + barCls + '" style="width:' + it.pct + '%"></div></div><span class="admin-score-value">' + it.score + '/' + it.total + '</span></div></td>';
    html += '<td style="font-family:var(--font-mono);font-size:0.8rem;color:' + (it.pct >= 80 ? 'var(--gold)' : it.pct >= 50 ? 'var(--patina)' : 'var(--error)') + '">' + it.pct + '%</td>';
    html += '</tr>';
  }

  html += '</tbody></table>';
  return section('Quiz Scores (' + items.length + ' completed)', html, true);
}

function renderObjectives(objectives) {
  var keys = Object.keys(objectives || {});
  if (keys.length === 0) return '';

  var html = '<div class="admin-objectives-list">';
  var sorted = keys.map(Number).sort(function(a, b) { return a - b; });

  for (var i = 0; i < sorted.length; i++) {
    var nodeId = sorted[i];
    var checked = objectives[String(nodeId)] || [];
    var node = getNode(nodeId);
    var total = node && node.objectives ? node.objectives.length : 8;
    var pct = total > 0 ? Math.round((checked.length / total) * 100) : 0;

    html += '<div class="admin-objective-item">';
    html += '<span class="admin-objective-node">Node ' + nodeId + '</span>';
    html += '<span class="admin-objective-count">' + checked.length + '/' + total + '</span>';
    html += '<div class="admin-objective-bar"><div class="admin-objective-bar-fill" style="width:' + pct + '%"></div></div>';
    html += '</div>';
  }

  html += '</div>';
  return section('Objectives', html, false);
}

function renderEventTimeline(eventLog) {
  if (!eventLog || eventLog.length === 0) return '';

  var html = '<div class="admin-event-timeline">';

  for (var i = 0; i < eventLog.length; i++) {
    var ev = eventLog[i];
    var icon = '';
    var desc = '';

    switch (ev.event) {
      case 'login':
        icon = '\uD83D\uDD11';
        desc = 'Login';
        break;
      case 'node_enter':
        icon = '\uD83D\uDCD6';
        desc = 'Entered <span class="admin-event-node">Node ' + ev.node + '</span> \u2014 ' + escapeHtml(getNodeTitle(ev.node));
        break;
      case 'quiz_start':
        icon = '\u25B6\uFE0F';
        desc = 'Started Quiz for <span class="admin-event-node">Node ' + ev.node + '</span>';
        break;
      case 'quiz_attempt':
        var pct = ev.total > 0 ? Math.round((ev.score / ev.total) * 100) : 0;
        var scoreCls = pct === 100 ? 'perfect' : pct >= 70 ? 'good' : 'bad';
        icon = pct >= 70 ? '\u2705' : '\u274C';
        desc = 'Quiz <span class="admin-event-node">Node ' + ev.node + '</span> (Attempt ' + ev.attempt + '): '
          + '<span class="admin-event-score ' + scoreCls + '">' + ev.score + '/' + ev.total + ' (' + pct + '%)</span>';
        break;
      default:
        icon = '\u2022';
        desc = ev.event;
    }

    html += '<div class="admin-event-row">';
    html += '<span class="admin-event-date">' + ev.date + ' ' + ev.time + '</span>';
    html += '<span class="admin-event-icon">' + icon + '</span>';
    html += '<div class="admin-event-desc">' + desc;

    if (ev.event === 'quiz_attempt' && ev.answers && ev.answers.length > 0) {
      html += '<div class="admin-event-answers">';
      for (var ai = 0; ai < ev.answers.length; ai++) {
        var a = ev.answers[ai];
        var ansCls = a.correct ? 'correct' : 'wrong';
        var checkMark = a.correct ? '\u2713' : '\u2717';
        html += '<span class="admin-event-answer ' + ansCls + '"><span class="admin-event-q-label">Q' + a.q + ':</span> ' + escapeHtml(a.selected) + ' ' + checkMark + '</span>';
      }
      html += '</div>';
    }

    html += '</div></div>';
  }

  html += '</div>';
  return section('Activity Timeline (' + eventLog.length + ' events)', html, false);
}

export function renderStudentCard(student, container) {
  var d = computeDerived(student);
  var xpBarWidth = d.xpPct;
  var quizzesDone = Object.keys(student.completedQuizzes || {}).length;
  var eventCount = student.eventLog ? student.eventLog.length : 0;

  var html = '<div class="admin-card-header">'
    + levelRing(d.xpPct)
    + '<div class="admin-card-info">'
    + '<div class="admin-card-name">' + escapeHtml(student.name) + '</div>'
    + '<div class="admin-card-details">'
    + '<span class="admin-card-detail-item">UID: ' + escapeHtml(student.uid) + '</span>'
    + '<span class="admin-card-detail-item">' + escapeHtml(student.year) + '</span>'
    + '<span class="admin-card-detail-item">' + escapeHtml(student.course) + '</span>'
    + '</div></div></div>';

  html += '<div class="admin-card-stats-grid">'
    + '<div class="admin-card-stat"><div class="admin-card-stat-value gold">' + (student.xp || 0) + '</div><div class="admin-card-stat-label">Total XP</div></div>'
    + '<div class="admin-card-stat"><div class="admin-card-stat-value patina">' + (student.streak || 0) + ' / ' + (student.longestStreak || 0) + '</div><div class="admin-card-stat-label">Streak / Longest</div></div>'
    + '<div class="admin-card-stat"><div class="admin-card-stat-value gold">' + quizzesDone + ' / 42</div><div class="admin-card-stat-label">Quizzes Done</div></div>'
    + '</div>';

  html += '<div class="admin-card-stats-grid">'
    + '<div class="admin-card-stat"><div class="admin-card-stat-value patina">' + relativeTime(student.lastActive) + '</div><div class="admin-card-stat-label">Last Active</div></div>'
    + '<div class="admin-card-stat"><div class="admin-card-stat-value gold">' + (student.lastVisitedNode || '\u2014') + '</div><div class="admin-card-stat-label">Last Visited Node</div></div>'
    + '<div class="admin-card-stat"><div class="admin-card-stat-value patina">' + eventCount + '</div><div class="admin-card-stat-label">Total Events</div></div>'
    + '</div>';

  html += '<div class="admin-xp-bar">'
    + '<div class="admin-xp-bar-header"><span class="admin-xp-bar-label">Level ' + d.level + ' Progress</span><span class="admin-xp-bar-value">' + d.xpInLevel + ' / ' + d.xpForLevel + ' XP</span></div>'
    + '<div class="admin-xp-bar-track"><div class="admin-xp-bar-fill" style="width:' + xpBarWidth + '%"></div></div>'
    + '</div>';

  html += renderBadges(student.badges);
  html += renderHeatmap(student);
  html += renderQuizScores(student.completedQuizzes);
  html += renderObjectives(student.objectives);
  html += renderEventTimeline(student.eventLog);

  container.innerHTML = html;

  container.querySelectorAll('.admin-detail-section-title').forEach(function(title) {
    title.addEventListener('click', function() {
      this.parentElement.classList.toggle('open');
    });
  });

  requestAnimationFrame(function() {
    var levelEl = container.querySelector('#card-level-num');
    if (levelEl) animateCount(levelEl, d.level, 400);
  });
}

function animateCount(el, to, duration) {
  var start = null;
  function frame(ts) {
    if (start === null) start = ts;
    var t = Math.min(1, (ts - start) / duration);
    var eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(eased * to);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
