import { computeDerived } from './fetch.js';

export function renderBadgeWall(students, container) {
  var allBadges = {};
  var badgeList = [
    'first_lesson', 'first_quiz', 'perfect_score', 'world_traveler',
    'streak_3', 'streak_7', 'streak_14', 'quiz_master'
  ];
  var badgeIcons = {
    'first_lesson': '\uD83D\uDCD6',
    'first_quiz': '\uD83C\uDFAB',
    'perfect_score': '\u2B50',
    'world_traveler': '\uD83C\uDF0D',
    'streak_3': '\uD83D\uDD25',
    'streak_7': '\uD83D\uDD25',
    'streak_14': '\uD83D\uDD25',
    'quiz_master': '\uD83C\uDFAF'
  };
  var badgeLabels = {
    'first_lesson': 'First Lesson',
    'first_quiz': 'First Quiz',
    'perfect_score': 'Perfect Score',
    'world_traveler': 'World Traveler',
    'streak_3': '3-Day Streak',
    'streak_7': '7-Day Streak',
    'streak_14': '14-Day Streak',
    'quiz_master': 'Quiz Master'
  };

  for (var i = 0; i < badgeList.length; i++) {
    allBadges[badgeList[i]] = 0;
  }
  for (var si = 0; si < students.length; si++) {
    var b = students[si].badges || [];
    for (var bi = 0; bi < b.length; bi++) {
      if (allBadges[b[bi]] !== undefined) allBadges[b[bi]]++;
    }
  }

  var total = students.length || 1;
  var html = '';
  for (var i = 0; i < badgeList.length; i++) {
    var key = badgeList[i];
    var count = allBadges[key];
    var pct = Math.round((count / total) * 100);
    html += '<div class="admin-badge-wall-item">'
      + '<span class="admin-badge-wall-icon">' + badgeIcons[key] + '</span>'
      + '<div class="admin-badge-wall-info">'
      + '<div class="admin-badge-wall-name">' + badgeLabels[key] + '</div>'
      + '<div class="admin-badge-wall-count">' + count + ' / ' + students.length + ' students</div>'
      + '<div class="admin-badge-wall-bar"><div class="admin-badge-wall-bar-fill" style="width:' + pct + '%"></div></div>'
      + '</div></div>';
  }

  container.innerHTML = html;
}
