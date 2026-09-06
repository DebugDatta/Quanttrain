import { getIdentity, getAllData } from '../store.js';
import { $, show, navigate, escapeHtml } from '../utils.js';
import { getLevel } from '../store.js';

var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4bVa41qIp34T0uRzgXh-sVsvfaZ9ZkoH4Q4zoUL0cDtbYR3gAPCx53ejMBu6JzZMM9w/exec';

export function render() {
  show('leaderboard-view');
  var identity = getIdentity();
  if (!identity || identity.type === 'guest') {
    navigate('#/login');
    return;
  }

  var el = $('#leaderboard-content');
  el.innerHTML = ''
    + '<div class="lb-header">'
    + '<div><div class="lb-title">Leaderboard</div><div class="lb-subtitle">Rankings by total XP</div></div>'
    + '<button class="btn btn-secondary" id="lb-back">Back to Map</button>'
    + '</div>'
    + '<div class="lb-table" id="lb-table"><div class="text-muted" style="padding:24px;text-align:center">Loading rankings...</div></div>';

  $('#lb-back').onclick = function() { navigate('#/map'); };

  loadLeaderboard(identity.uid);
}

function loadLeaderboard(uid) {
  var url = APPS_SCRIPT_URL + '?action=getLeaderboard&uid=' + encodeURIComponent(uid);
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(result) {
      if (!result.ok || !result.students) {
        $('#lb-table').innerHTML = '<div class="text-muted" style="padding:24px;text-align:center">Failed to load rankings.</div>';
        return;
      }
      renderTable(result.students, result.yourUid);
    })
    .catch(function() {
      $('#lb-table').innerHTML = '<div class="text-muted" style="padding:24px;text-align:center">Network error.</div>';
    });
}

function renderTable(students, yourUid) {
  var html = '<table><thead><tr>'
    + '<th style="width:60px">#</th>'
    + '<th>Student</th>'
    + '<th>XP</th>'
    + '<th>Level</th>'
    + '<th>Streak</th>'
    + '<th>Quizzes</th>'
    + '</tr></thead><tbody>';

  for (var i = 0; i < students.length; i++) {
    var s = students[i];
    var rank = i + 1;
    var level = getLevel(s.xp || 0);
    var isYou = s.uid === yourUid;
    var rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';

    html += '<tr' + (isYou ? ' class="lb-you"' : '') + '>';
    html += '<td><span class="lb-rank ' + rankClass + '">' + rank + '</span></td>';
    html += '<td><span class="lb-name">' + escapeHtml(s.name) + '</span>' + (isYou ? ' <span style="font-size:0.7rem;color:var(--gold)">(you)</span>' : '') + '<div class="lb-meta">' + escapeHtml(s.year) + ' &middot; ' + escapeHtml(s.course) + '</div></td>';
    html += '<td class="lb-xp">' + (s.xp || 0) + '</td>';
    html += '<td><span class="lb-level">Lv ' + level + '</span></td>';
    html += '<td><span class="lb-streak">' + (s.streak > 0 ? '\uD83D\uDD25' : '\u2014') + ' ' + (s.streak || 0) + '</span></td>';
    html += '<td class="lb-quizzes">' + (s.quizCount || 0) + ' / 42</td>';
    html += '</tr>';
  }

  html += '</tbody></table>';
  $('#lb-table').innerHTML = html;
}
