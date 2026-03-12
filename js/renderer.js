const GAME_WIDTH = 1200;
const GAME_HEIGHT = 800;
const BG_COLOR = '#0a0e27';

let canvas, ctx, dpr;

let stars = [];

export function initRenderer() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  dpr = window.devicePixelRatio || 1;

  canvas.width = GAME_WIDTH * dpr;
  canvas.height = GAME_HEIGHT * dpr;
  canvas.style.width = GAME_WIDTH + 'px';
  canvas.style.height = GAME_HEIGHT + 'px';
  ctx.scale(dpr, dpr);

  stars = [];
  for (let layer = 0; layer < 3; layer++) {
    const count = 40 + layer * 30;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: 0.5 + Math.random() * (1.5 - layer * 0.3),
        speed: 0.2 + layer * 0.3,
        alpha: 0.3 + Math.random() * 0.5
      });
    }
  }
}

export function clearScreen() {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

export function updateStars(dt) {
  for (const star of stars) {
    star.y += star.speed * dt * 60;
    if (star.y > GAME_HEIGHT) {
      star.y = 0;
      star.x = Math.random() * GAME_WIDTH;
    }
  }
}

export function drawStars() {
  for (const star of stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

export function drawTriangle(x, y, width, height, color, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(-width / 2, height / 2);
  ctx.lineTo(width / 2, height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawDiamond(x, y, width, height, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(width / 2, 0);
  ctx.lineTo(0, height / 2);
  ctx.lineTo(-width / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawHexagon(x, y, radius, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawCircle(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawOval(x, y, radiusX, radiusY, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

export function drawText(text, x, y, { color = '#fff', size = 16, align = 'center', baseline = 'middle', font = 'monospace' } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

export function drawGlow(x, y, radius, color, alpha = 0.3) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function applyShake(shakeX, shakeY) {
  ctx.save();
  ctx.translate(shakeX, shakeY);
}

export function resetShake() {
  ctx.restore();
}

export function getCtx() { return ctx; }
export { GAME_WIDTH, GAME_HEIGHT };
