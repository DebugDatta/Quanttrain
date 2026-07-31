import { getIdentity, setIdentity, applyCloudProfile } from '../store.js';
import { $, show, navigate } from '../utils.js';
import { validateLogin, track } from '../sync.js';

export function render() {
  if (getIdentity()) { navigate('#/map'); return; }
  show('login-view');
  const err = $('#login-error');
  err.classList.remove('show');
  $('#login-form').onsubmit = (e) => {
    e.preventDefault();
    const uid = $('#login-uid').value.trim();
    const pass = $('#login-password').value.trim();
    if (!uid || !pass) { err.textContent = 'Please enter your UID and password'; err.classList.add('show'); return; }
    err.classList.remove('show');
    const btn = $('#login-submit');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    validateLogin(uid, pass).then((profile) => {
      if (!profile.ok) {
        err.textContent = 'Wrong credentials';
        err.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Enter the Lab \u2192';
        return;
      }
      applyCloudProfile(profile);
      track('login', null);
      navigate('#/map');
    });
  };
  $('#login-guest').onclick = () => { setIdentity({ type: 'guest' }); navigate('#/map'); };
}
