var TOAST_DURATION = 3000;
var container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.className = 'gam-toast-container';
  document.body.appendChild(container);
  return container;
}

var ICONS = {
  xp: '\u26A1',
  badge: '\uD83C\uDFC5',
  streak: '\uD83D\uDD25',
  level: '\u2B50',
  perfect: '\uD83C\uDF1F'
};

export function showToast(type, message) {
  var c = ensureContainer();
  var toast = document.createElement('div');
  toast.className = 'gam-toast ' + type;
  toast.innerHTML = '<span class="gam-toast-icon">' + (ICONS[type] || '') + '</span>'
    + '<span class="gam-toast-text">' + message + '</span>';
  c.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('removing');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, TOAST_DURATION);
}

export function clearToasts() {
  if (container) {
    while (container.firstChild) container.removeChild(container.firstChild);
  }
}
