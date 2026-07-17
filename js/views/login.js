import { getIdentity, setIdentity } from '../store.js';
import { $, show, navigate } from '../utils.js';

export function render() {
  if (getIdentity()) { navigate('#/map'); return; }
  show('login-view');
  const err = $('#login-error');
  err.classList.remove('show');
  $('#login-form').onsubmit = (e) => {
    e.preventDefault();
    const name = $('#login-name').value.trim();
    const email = $('#login-email').value.trim();
    if (!name) { err.textContent = 'Please enter your name'; err.classList.add('show'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please enter a valid email address'; err.classList.add('show'); return; }
    err.classList.remove('show');
    setIdentity({ type: 'tracked', name, email });
    navigate('#/map');
  };
  $('#login-guest').onclick = () => { setIdentity({ type: 'guest' }); navigate('#/map'); };
}
