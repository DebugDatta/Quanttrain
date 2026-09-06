export function showXpPopup(amount, anchorEl) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var popup = document.createElement('div');
  popup.className = 'gam-xp-popup';
  popup.textContent = '+' + amount + ' XP';

  if (anchorEl) {
    var rect = anchorEl.getBoundingClientRect();
    popup.style.left = (rect.left + rect.width / 2) + 'px';
    popup.style.top = (rect.top - 10) + 'px';
    popup.style.transform = 'translateX(-50%)';
  } else {
    popup.style.left = '50%';
    popup.style.top = '40%';
    popup.style.transform = 'translateX(-50%)';
  }

  document.body.appendChild(popup);
  setTimeout(function() {
    if (popup.parentNode) popup.parentNode.removeChild(popup);
  }, 1500);
}

export function showXpPopupAt(amount, x, y) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var popup = document.createElement('div');
  popup.className = 'gam-xp-popup';
  popup.textContent = '+' + amount + ' XP';
  popup.style.left = x + 'px';
  popup.style.top = y + 'px';
  document.body.appendChild(popup);
  setTimeout(function() {
    if (popup.parentNode) popup.parentNode.removeChild(popup);
  }, 1500);
}
