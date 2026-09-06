import { getBadges, addBadge, getAllData, getLevel, getStreak } from '../store.js';
import { showToast } from './toast.js';
import { fireConfetti } from './confetti.js';
import { getCurriculum } from '../utils.js';

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

export function getBadgeMeta(id) {
  return BADGE_META[id] || { icon: '\uD83C\uDFC5', label: id.replace(/_/g, ' ') };
}

export function getAllBadgeIds() {
  return Object.keys(BADGE_META);
}

function awardBadge(id) {
  var existing = getBadges();
  if (existing.indexOf(id) !== -1) return false;
  addBadge(id);
  var meta = BADGE_META[id] || { icon: '\uD83C\uDFC5', label: id };
  showToast('badge', 'Badge Unlocked: ' + meta.label + '!');
  fireConfetti(null, null, 40);
  return true;
}

export function checkBadgesAfterLesson(nodeId) {
  var data = getAllData();
  var awarded = [];

  if (data.progress.completedNodes.length === 1) {
    if (awardBadge('first_lesson')) awarded.push('first_lesson');
  }

  var curriculum = getCurriculum();
  if (curriculum) {
    for (var wi = 0; wi < curriculum.worlds.length; wi++) {
      var w = curriculum.worlds[wi];
      var allDone = true;
      for (var ni = 0; ni < w.nodes.length; ni++) {
        if (data.progress.completedQuizzes[w.nodes[ni].id]) continue;
        allDone = false;
        break;
      }
      if (allDone && w.nodes.length > 0) {
        if (awardBadge('world_traveler')) awarded.push('world_traveler');
        break;
      }
    }
  }

  return awarded;
}

export function checkBadgesAfterQuiz(nodeId, score, total) {
  var data = getAllData();
  var awarded = [];

  var quizKeys = Object.keys(data.progress.completedQuizzes);
  if (quizKeys.length === 1) {
    if (awardBadge('first_quiz')) awarded.push('first_quiz');
  }

  if (score === total && total > 0) {
    if (awardBadge('perfect_score')) awarded.push('perfect_score');
  }

  if (quizKeys.length >= 42) {
    if (awardBadge('quiz_master')) awarded.push('quiz_master');
  }

  var curriculum = getCurriculum();
  if (curriculum) {
    for (var wi = 0; wi < curriculum.worlds.length; wi++) {
      var w = curriculum.worlds[wi];
      var allDone = true;
      for (var ni = 0; ni < w.nodes.length; ni++) {
        if (data.progress.completedQuizzes[w.nodes[ni].id]) continue;
        allDone = false;
        break;
      }
      if (allDone && w.nodes.length > 0) {
        if (awardBadge('world_traveler')) awarded.push('world_traveler');
        break;
      }
    }
  }

  return awarded;
}

export function checkBadgesAfterStreak() {
  var streak = getStreak();
  var awarded = [];
  if (streak.current >= 3) { if (awardBadge('streak_3')) awarded.push('streak_3'); }
  if (streak.current >= 7) { if (awardBadge('streak_7')) awarded.push('streak_7'); }
  if (streak.current >= 14) { if (awardBadge('streak_14')) awarded.push('streak_14'); }
  return awarded;
}

export function renderBadgeChips(badges, container, showEmpty) {
  var html = '';
  var hasBadges = badges && badges.length > 0;
  if (!hasBadges && !showEmpty) {
    container.innerHTML = '';
    return;
  }
  if (!hasBadges && showEmpty) {
    container.innerHTML = '<span style="font-size:0.75rem;color:var(--text-faint)">No badges yet</span>';
    return;
  }
  for (var i = 0; i < badges.length; i++) {
    var meta = getBadgeMeta(badges[i]);
    html += '<span class="gam-badge-chip" title="' + meta.label + '">'
      + meta.icon
      + '<span class="gam-badge-chip-tooltip">' + meta.label + '</span>'
      + '</span>';
  }
  container.innerHTML = html;
}
