import { computeDerived } from './fetch.js';
import { escapeHtml } from '../utils.js';

var sortKey = 'xp';
var sortAsc = false;

var BADGE_ICONS = {
  'first_lesson': '\uD83D\uDCD6',
  'first_quiz': '\uD83C\uDFAB',
  'perfect_score': '\u2B50',
  'world_traveler': '\uD83C\uDF0D',
  'streak_3': '\uD83D\uDD25',
  'streak_7': '\uD83D\uDD25',
  'streak_14': '\uD83D\uDD25',
  'quiz_master': '\uD83C\uDFAF',
  'all_badges': '\uD83C\uDFC6'
};

export function setSort(key) {
  if (sortKey === key) { sortAsc = !sortAsc; }
  else { sortKey = key; sortAsc = false; }
}

export function getSort() { return { key: sortKey, asc: sortAsc }; }

function sortStudents(students) {
  return students.slice().sort(function(a, b) {
    var da = computeDerived(a);
    var db = computeDerived(b);
    var va, vb;
    switch (sortKey) {
      case 'name': va = a.name || ''; vb = b.name || ''; return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      case 'year': va = a.year || ''; vb = b.year || ''; return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      case 'xp': va = a.xp || 0; vb = b.xp || 0; break;
      case 'level': va = da.level; vb = db.level; break;
      case 'streak': va = a.streak || 0; vb = b.streak || 0; break;
      case 'quizzes': va = da.quizCount; vb = db.quizCount; break;
      case 'avgScore': va = da.avgScore; vb = db.avgScore; break;
      case 'lastActive': va = a.lastActive || '0000'; vb = b.lastActive || '0000'; return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      default: va = a.xp || 0; vb = b.xp || 0;
    }
    return sortAsc ? va - vb : vb - va;
  });
}

function getRankClass(rank) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-other';
}

function formatLastActive(daysSince) {
  if (daysSince < 0) return '<span class="admin-last-active">Never</span>';
  if (daysSince === 0) return '<span class="admin-last-active">Today</span>';
  if (daysSince === 1) return '<span class="admin-last-active">Yesterday</span>';
  if (daysSince > 14) return '<span class="admin-last-active stale">' + daysSince + 'd ago</span>';
  return '<span class="admin-last-active">' + daysSince + 'd ago</span>';
}

function scoreBar(pct) {
  var cls = pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low';
  return '<div class="admin-score-bar">'
    + '<div class="admin-score-bar-track"><div class="admin-score-bar-fill ' + cls + '" style="width:' + pct + '%"></div></div>'
    + '<span class="admin-score-value">' + pct + '%</span>'
    + '</div>';
}

export function renderLeaderboard(students, container) {
  var sorted = sortStudents(students);
  var headers = [
    { key: 'rank', label: '#' },
    { key: 'name', label: 'Student' },
    { key: 'xp', label: 'XP' },
    { key: 'level', label: 'Level' },
    { key: 'streak', label: 'Streak' },
    { key: 'quizzes', label: 'Quizzes' },
    { key: 'avgScore', label: 'Avg Score' },
    { key: 'lastActive', label: 'Last Active' }
  ];

  var html = '<table><thead><tr>';
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    if (h.key === 'rank') { html += '<th>' + h.label + '</th>'; continue; }
    var cls = sortKey === h.key ? 'sorted' + (sortAsc ? '' : ' desc') : '';
    html += '<th class="' + cls + '" data-sort="' + h.key + '">' + h.label + '</th>';
  }
  html += '</tr></thead><tbody>';

  for (var i = 0; i < sorted.length; i++) {
    var s = sorted[i];
    var d = computeDerived(s);
    var rank = i + 1;
    var rankCls = getRankClass(rank);
    var rowCls = rank <= 3 ? 'rank-' + rank : '';

    html += '<tr class="' + rowCls + '">';
    html += '<td><span class="admin-rank-badge ' + rankCls + '">' + rank + '</span></td>';
    html += '<td><div class="admin-student-name">' + escapeHtml(s.name) + '</div><div class="admin-student-meta">' + escapeHtml(s.year) + ' &middot; ' + escapeHtml(s.course) + '</div></td>';
    html += '<td class="admin-xp-cell">' + (s.xp || 0) + '</td>';
    html += '<td><span class="admin-level-badge">Lv ' + d.level + '</span></td>';
    html += '<td><div class="admin-streak-cell"><span class="admin-streak-flame">' + (d.daysSinceActive <= 1 ? '\uD83D\uDD25' : '\u2014') + '</span>' + (s.streak || 0) + ' <span class="text-faint">/ ' + (s.longestStreak || 0) + '</span></div></td>';
    html += '<td>' + d.quizCount + ' / 42</td>';
    html += '<td>' + scoreBar(d.avgScore) + '</td>';
    html += '<td>' + formatLastActive(d.daysSinceActive) + '</td>';
    html += '</tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;

  container.querySelectorAll('th[data-sort]').forEach(function(th) {
    th.addEventListener('click', function() {
      setSort(this.dataset.sort);
      renderLeaderboard(students, container);
    });
  });
}
