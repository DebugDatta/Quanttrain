const STORE_KEY = 'quanttrain';

const DEFAULT_STORE = {
  identity: null,
  progress: {
    completedNodes: [],
    completedQuizzes: {},
    objectivesChecked: {},
    lastVisitedNode: null,
    lastVisitedView: null
  },
  xp: { total: 0, history: [] },
  streak: { current: 0, longest: 0, lastActive: null },
  badges: [],
  darkMode: true
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_STORE));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STORE));
  }
}

function save(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { console.warn('Save failed:', e.message); }
}

export function getIdentity() { return load().identity; }
export function setIdentity(id) { const s = load(); s.identity = id; save(s); }
export function clearIdentity() { const s = load(); s.identity = null; save(s); }
export function applyCloudProfile(profile) {
  const s = load();
  s.identity = { type: 'tracked', uid: profile.uid, name: profile.name, year: profile.year, course: profile.course };
  if (typeof profile.xp === 'number' && profile.xp > s.xp.total) s.xp.total = profile.xp;
  if (typeof profile.streak === 'number' && profile.streak > s.streak.current) s.streak.current = profile.streak;
  if (typeof profile.longestStreak === 'number' && profile.longestStreak > s.streak.longest) s.streak.longest = profile.longestStreak;
  if (profile.lastActive) s.streak.lastActive = profile.lastActive;
  if (profile.completedQuizzes) {
    for (const key of Object.keys(profile.completedQuizzes)) {
      if (!s.progress.completedQuizzes[key]) s.progress.completedQuizzes[key] = profile.completedQuizzes[key];
    }
  }
  if (profile.visitedNodes || profile.completedQuizzes) {
    const merged = s.progress.completedNodes.slice();
    const seen = {};
    merged.forEach(id => { seen[id] = true; });
    if (profile.visitedNodes) profile.visitedNodes.forEach(function(id) {
      const n = parseInt(id, 10);
      if (!isNaN(n) && !seen[n]) { seen[n] = true; merged.push(n); }
    });
    if (profile.completedQuizzes) Object.keys(profile.completedQuizzes).forEach(function(key) {
      const n = parseInt(key, 10);
      if (!isNaN(n) && !seen[n]) { seen[n] = true; merged.push(n); }
    });
    s.progress.completedNodes = merged;
  }
  if (profile.objectives) {
    for (const key of Object.keys(profile.objectives)) {
      const cloud = profile.objectives[key] || [];
      const local = s.progress.objectivesChecked[key] || [];
      s.progress.objectivesChecked[key] = Array.from(new Set(local.concat(cloud)));
    }
  }
  if (profile.badges) {
    for (const b of profile.badges) {
      if (s.badges.indexOf(b) === -1) s.badges.push(b);
    }
  }
  if (typeof profile.lastVisitedNode === 'number' && s.progress.lastVisitedNode === null) s.progress.lastVisitedNode = profile.lastVisitedNode;
  save(s);
}
export function getProgress() { return load().progress; }
export function setProgress(p) { const s = load(); s.progress = p; checkStreak(s); save(s); }
export function getXp() { return load().xp; }
export function addXp(amount, source, nodeId) {
  const s = load();
  s.xp.total += amount;
  s.xp.history.push({ date: new Date().toISOString().split('T')[0], amount, source, nodeId });
  save(s);
}
export function getStreak() { return load().streak; }

function checkStreak(s) {
  const today = new Date().toISOString().split('T')[0];
  if (!s.streak.lastActive) { s.streak.current = 1; s.streak.lastActive = today; if (s.streak.current > s.streak.longest) s.streak.longest = s.streak.current; return; }
  const diff = Math.round((new Date(today) - new Date(s.streak.lastActive)) / 86400000);
  if (diff === 0) return;
  s.streak.current = diff === 1 ? s.streak.current + 1 : 1;
  s.streak.lastActive = today;
  if (s.streak.current > s.streak.longest) s.streak.longest = s.streak.current;
}

export function getBadges() { return load().badges; }
export function addBadge(b) { const s = load(); if (!s.badges.includes(b)) { s.badges.push(b); save(s); } }

export function getLevel(xp) {
  const t = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  for (let i = t.length - 1; i >= 0; i--) { if (xp >= t[i]) return i + 1; }
  return 1;
}

export function getXpForNextLevel(xp) {
  const t = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];
  for (let i = 1; i < t.length; i++) { if (xp < t[i]) return { current: xp - t[i - 1], needed: t[i] - t[i - 1] }; }
  return { current: xp, needed: xp };
}

export function getAllData() { return load(); }
export function resetAll() { save(JSON.parse(JSON.stringify(DEFAULT_STORE))); }
