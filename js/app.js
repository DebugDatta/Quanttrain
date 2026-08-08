import { getIdentity } from './store.js';
import { $, show, navigate } from './utils.js';
import { render as renderLogin } from './views/login.js';
import { render as renderMap } from './views/worldMap.js';
import { render as renderLesson } from './views/lesson.js';
import { render as renderQuiz } from './views/quiz.js';
import { initSyllabus } from './syllabus.js';

const ROUTES = {
  '/login': { view: 'login-view', handler: renderLogin },
  '/map': { view: 'map-view', handler: renderMap },
  '/lesson': { view: 'lesson-view', handler: renderLesson },
  '/quiz': { view: 'quiz-view', handler: renderQuiz }
};

function resolveHash(hash) {
  const h = hash.replace(/^#/, '') || '/login';
  for (const [pattern, route] of Object.entries(ROUTES)) {
    if (pattern === '/lesson' || pattern === '/quiz') {
      const m = h.match(new RegExp('^' + pattern + '/(\\d+)$'));
      if (m) return { ...route, params: { id: parseInt(m[1]) } };
    } else if (pattern === h) {
      return route;
    }
  }
  return ROUTES['/map'];
}

function route() {
  const identity = getIdentity();
  const hash = window.location.hash;
  if (!identity && !hash.startsWith('#/login')) { navigate('#/login'); return; }
  if (identity && hash.startsWith('#/login')) { navigate('#/map'); return; }
  const r = resolveHash(hash);
  if (!r) { navigate('#/map'); return; }
  show(r.view);
  if (r.handler) r.params ? r.handler(r.params.id) : r.handler();
}

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('hashchange', route);
  route();
  initSyllabus();
});
