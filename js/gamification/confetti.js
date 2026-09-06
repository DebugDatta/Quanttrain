var canvas = null;
var ctx = null;
var particles = [];
var animating = false;
var DURATION = 2500;

var COLORS = [
  'oklch(84% 0.19 80.46)',
  'oklch(77% 0.13 82)',
  'oklch(70% 0.12 188)',
  'oklch(82% 0.07 188)',
  'oklch(86% 0.07 84)',
  'oklch(61% 0.085 78)'
];

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'gam-confetti-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:999;pointer-events:none;';
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function Particle(x, y) {
  this.x = x;
  this.y = y;
  this.vx = (Math.random() - 0.5) * 12;
  this.vy = -(Math.random() * 8 + 4);
  this.gravity = 0.15;
  this.rotation = Math.random() * 360;
  this.rotSpeed = (Math.random() - 0.5) * 10;
  this.size = Math.random() * 6 + 4;
  this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  this.opacity = 1;
  this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
}

Particle.prototype.update = function() {
  this.vy += this.gravity;
  this.x += this.vx;
  this.y += this.vy;
  this.rotation += this.rotSpeed;
  this.opacity -= 0.008;
};

Particle.prototype.draw = function(ctx) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, this.opacity);
  ctx.translate(this.x, this.y);
  ctx.rotate(this.rotation * Math.PI / 180);
  ctx.fillStyle = this.color;
  if (this.shape === 'rect') {
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 0.6);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

function loop() {
  if (!animating) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw(ctx);
    if (particles[i].opacity <= 0 || particles[i].y > canvas.height + 20) {
      particles.splice(i, 1);
    }
  }
  if (particles.length > 0) {
    requestAnimationFrame(loop);
  } else {
    animating = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function fireConfetti(x, y, count) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ensureCanvas();
  var originX = x || window.innerWidth / 2;
  var originY = y || window.innerHeight / 3;
  count = count || 80;
  for (var i = 0; i < count; i++) {
    particles.push(new Particle(originX, originY));
  }
  if (!animating) {
    animating = true;
    loop();
  }
}

export function fireConfettiBurst() {
  fireConfetti(window.innerWidth * 0.3, window.innerHeight * 0.4, 50);
  setTimeout(function() { fireConfetti(window.innerWidth * 0.7, window.innerHeight * 0.4, 50); }, 200);
  setTimeout(function() { fireConfetti(window.innerWidth * 0.5, window.innerHeight * 0.3, 60); }, 400);
}
