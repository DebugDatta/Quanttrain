import { getIdentity, setIdentity, fullCloudSync } from '../store.js';
import { $, show, navigate } from '../utils.js';
import { validateLogin, track } from '../sync.js';
import { getWelcomeBackHtml } from '../gamification/celebrate.js';
import { checkBadgesAfterStreak } from '../gamification/badges.js';

var LOGIN_CARD_HTML = ''
  + '<div class="login-card">'
  + '<div class="login-logo">QuantTrain</div>'
  + '<p class="login-tagline">Quantitative Research Learning Path</p>'
  + '<form id="login-form" class="login-form">'
  + '<div>'
  + '<label for="login-uid">UID (Username)</label>'
  + '<input type="text" id="login-uid" placeholder="Your college UID" autocomplete="username">'
  + '</div>'
  + '<div>'
  + '<label for="login-password">Password</label>'
  + '<input type="password" id="login-password" placeholder="Your phone number" autocomplete="current-password">'
  + '</div>'
  + '<div class="login-error" id="login-error"></div>'
  + '<button type="submit" class="btn btn-primary" id="login-submit" style="width:100%">Enter the Lab &#8594;</button>'
  + '</form>'
  + '<div class="login-divider">or</div>'
  + '<button class="btn btn-secondary login-guest-btn" id="login-guest">Guest Access</button>'
  + '<p class="login-info">Login with your UID &amp; phone-number password to sync progress across devices -- not required to browse.</p>'
  + '<p style="margin-top:12px"><a href="#/admin" style="font-size:0.75rem;color:var(--text-faint)">Admin Dashboard</a></p>'
  + '</div>';

export function render() {
  if (getIdentity()) { navigate('#/map'); return; }
  show('login-view');
  var container = $('#login-view');
  if (container) container.innerHTML = LOGIN_CARD_HTML;
  resetForm();

  $('#login-form').onsubmit = (e) => {
    e.preventDefault();
    const uid = $('#login-uid').value.trim();
    const pass = $('#login-password').value.trim();
    const err = $('#login-error');
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
      fullCloudSync(profile);
      track('login', null);
      checkBadgesAfterStreak();
      var welcomeHtml = getWelcomeBackHtml(profile);
      if (welcomeHtml) {
        var loginCard = $('.login-card');
        if (loginCard) {
          loginCard.innerHTML = welcomeHtml;
          setTimeout(function() { navigate('#/map'); }, 1800);
          return;
        }
      }
      navigate('#/map');
    });
  };
  $('#login-guest').onclick = () => { setIdentity({ type: 'guest' }); navigate('#/map'); };
}

function resetForm() {
  const uid = $('#login-uid');
  const pass = $('#login-password');
  const btn = $('#login-submit');
  if (uid) uid.value = '';
  if (pass) pass.value = '';
  if (btn) { btn.disabled = false; btn.textContent = 'Enter the Lab \u2192'; }
  const err = $('#login-error');
  if (err) { err.classList.remove('show'); err.textContent = ''; }
}
