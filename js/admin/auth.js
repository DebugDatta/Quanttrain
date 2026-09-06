var ADMIN_USER = 'admin.quants';
var ADMIN_PASS = 'aarjavbhadwahai';
var ADMIN_KEY = 'admin.quants:aarjavbhadwahai';
var SESSION_KEY = 'admin_auth';

export function isAdmin() {
  try { return sessionStorage.getItem(SESSION_KEY) === 'true'; } catch (e) { return false; }
}

export function adminLogin(user, pass) {
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch (e) {}
    return true;
  }
  return false;
}

export function adminLogout() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
}

export function getAdminKey() {
  return ADMIN_KEY;
}
