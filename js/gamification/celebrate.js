import { getLevel, getXpForNextLevel, getStreak } from '../store.js';
import { showToast } from './toast.js';
import { fireConfettiBurst } from './confetti.js';

export function checkLevelUp(oldXp, newXp) {
  var oldLevel = getLevel(oldXp);
  var newLevel = getLevel(newXp);
  if (newLevel > oldLevel) {
    showLevelUp(newLevel);
    return true;
  }
  return false;
}

function showLevelUp(level) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showToast('level', 'Level Up! Level ' + level);
    return;
  }

  var overlay = document.createElement('div');
  overlay.className = 'gam-levelup-overlay';
  overlay.innerHTML = ''
    + '<div class="gam-levelup-card">'
    + '<div class="gam-levelup-label">Level Up</div>'
    + '<div class="gam-levelup-number">' + level + '</div>'
    + '<div class="gam-levelup-subtitle">Keep going!</div>'
    + '</div>';
  document.body.appendChild(overlay);

  fireConfettiBurst();

  overlay.addEventListener('click', function() {
    closeLevelUp(overlay);
  });

  setTimeout(function() {
    closeLevelUp(overlay);
  }, 2500);
}

function closeLevelUp(overlay) {
  if (!overlay || !overlay.parentNode) return;
  overlay.style.animation = 'gamFadeOut 300ms ease forwards';
  setTimeout(function() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 300);
}

export function showStreakMilestone(streakCount) {
  showToast('streak', streakCount + '-Day Streak! Keep the fire burning!');
}

export function showPerfectScore() {
  showToast('perfect', 'Perfect Score!');
  fireConfettiBurst();
}

export function getWelcomeBackHtml(identity) {
  if (!identity || !identity.name) return '';
  var data = null;
  try {
    var raw = localStorage.getItem('quanttrain');
    data = raw ? JSON.parse(raw) : null;
  } catch (e) { data = null; }
  if (!data) return '';

  var level = getLevel(data.xp.total);
  var streak = data.streak.current;
  var xp = data.xp.total;

  return '<div class="gam-welcome-back">'
    + '<div class="gam-welcome-name">Welcome back, ' + identity.name.split(' ')[0] + '!</div>'
    + '<div class="gam-welcome-stats">'
    + (streak > 0 ? '<span class="gam-welcome-stat fire">\uD83D\uDD25 ' + streak + '-day streak</span>' : '')
    + '<span class="gam-welcome-stat gold">Level ' + level + '</span>'
    + '<span class="gam-welcome-stat patina">' + xp + ' XP</span>'
    + '</div></div>';
}
