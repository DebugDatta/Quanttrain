import { getIdentity, getAllData } from './store.js';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz1D7CU-CAplXvSzkD7Osc476nc0-wLGJQE7_eA0DCeRCeVGr2dgKJC3a3FYQC64lfZ/exec';

function snapshot() {
  const id = getIdentity();
  const s = getAllData();
  return {
    uid: id ? (id.uid || '') : '',
    xp: s.xp.total,
    streak: s.streak.current,
    longestStreak: s.streak.longest,
    lastActive: s.streak.lastActive || '',
    completedQuizzes: s.progress.completedQuizzes || {},
    lastVisitedNode: s.progress.lastVisitedNode || null
  };
}

function send(payload) {
  try {
    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload)
    }).then(function() {}).catch(function() {});
  } catch (e) {}
}

export function validateLogin(uid, pass) {
  const url = APPS_SCRIPT_URL
    + '?action=validateLogin&uid=' + encodeURIComponent(uid)
    + '&pass=' + encodeURIComponent(pass);
  return fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(d) { return d && d.ok ? d : { ok: false }; })
    .catch(function() { return { ok: false }; });
}

function isTracked() {
  const id = getIdentity();
  return !!(id && id.type === 'tracked');
}

export function track(event, nodeId) {
  if (!isTracked()) return;
  const p = snapshot();
  p.action = 'trackActivity';
  p.event = event;
  p.nodeId = nodeId || null;
  send(p);
}

export function pushQuiz(nodeId, responses, score, total) {
  if (!isTracked()) return;
  const p = snapshot();
  p.action = 'submitQuiz';
  p.nodeId = nodeId;
  p.responses = responses;
  p.score = score;
  p.total = total;
  send(p);
}

export function syncProgress() {
  if (!isTracked()) return;
  const p = snapshot();
  p.action = 'syncProgress';
  send(p);
}
