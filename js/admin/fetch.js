import { getAllStudents } from '../sync.js';
import { getAdminKey } from './auth.js';

var cachedData = null;

export function fetchStudents() {
  return getAllStudents(getAdminKey()).then(function(result) {
    if (result.ok && result.students) {
      cachedData = result.students;
      return { ok: true, students: result.students };
    }
    return { ok: false };
  });
}

export function getCachedStudents() {
  return cachedData;
}

export function computeDerived(student) {
  var quizKeys = Object.keys(student.completedQuizzes || {});
  var quizCount = quizKeys.length;
  var totalScore = 0;
  var totalMax = 0;
  for (var i = 0; i < quizKeys.length; i++) {
    var q = student.completedQuizzes[quizKeys[i]];
    totalScore += q.score;
    totalMax += q.total;
  }
  var avgScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  var level = 1;
  var thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  for (var i = thresholds.length - 1; i >= 0; i--) {
    if (student.xp >= thresholds[i]) { level = i + 1; break; }
  }
  var xpInLevel = 0;
  var xpForLevel = 0;
  if (level < thresholds.length) {
    xpInLevel = student.xp - thresholds[level - 1];
    xpForLevel = thresholds[level] - thresholds[level - 1];
  } else {
    xpInLevel = student.xp - thresholds[thresholds.length - 1];
    xpForLevel = 5000;
  }
  var xpPct = xpForLevel > 0 ? Math.min(100, Math.round((xpInLevel / xpForLevel) * 100)) : 100;

  var daysSinceActive = -1;
  if (student.lastActive) {
    var last = new Date(student.lastActive);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    last.setHours(0, 0, 0, 0);
    daysSinceActive = Math.round((now - last) / 86400000);
  }

  return {
    quizCount: quizCount,
    avgScore: avgScore,
    level: level,
    xpPct: xpPct,
    xpInLevel: xpInLevel,
    xpForLevel: xpForLevel,
    daysSinceActive: daysSinceActive
  };
}

export function aggregateStats(students) {
  var totalXp = 0;
  var totalStreak = 0;
  var activeToday = 0;
  var totalAvgScore = 0;
  var count = students.length;

  for (var i = 0; i < count; i++) {
    var s = students[i];
    totalXp += s.xp || 0;
    totalStreak += s.streak || 0;
    var d = computeDerived(s);
    if (d.daysSinceActive === 0) activeToday++;
    totalAvgScore += d.avgScore;
  }

  return {
    totalStudents: count,
    avgXp: count > 0 ? Math.round(totalXp / count) : 0,
    activeToday: activeToday,
    avgStreak: count > 0 ? (totalStreak / count).toFixed(1) : '0',
    avgQuizScore: count > 0 ? Math.round(totalAvgScore / count) : 0
  };
}
