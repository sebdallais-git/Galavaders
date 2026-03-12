import { onUpdate, onDraw, State, game } from './engine.js';
import { drawCircle, getCtx } from './renderer.js';

const particles = [];

export function spawnExplosion(x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 160;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 1.5 + Math.random() * 2.5, color, life: 0.4 + Math.random() * 0.4, maxLife: 0.4 + Math.random() * 0.4 });
  }
}

export function spawnEngineTrail(x, y) {
  particles.push({ x: x + (Math.random() - 0.5) * 6, y: y + 16, vx: (Math.random() - 0.5) * 20, vy: 30 + Math.random() * 40, radius: 1 + Math.random() * 1.5, color: '#00ffff', life: 0.15 + Math.random() * 0.1, maxLife: 0.2 });
}

export function spawnPowerUpSparkle(x, y, color) {
  for (let i = 0; i < 3; i++) {
    particles.push({ x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30, radius: 1 + Math.random(), color, life: 0.3 + Math.random() * 0.2, maxLife: 0.4 });
  }
}

function update(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    p.radius *= 0.98;
    if (p.life <= 0 || p.radius < 0.2) {
      particles.splice(i, 1);
    }
  }
}

function draw() {
  const ctx = getCtx();
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    drawCircle(p.x, p.y, p.radius, p.color);
  }
  ctx.globalAlpha = 1;
}

export function initParticles() {
  onUpdate(State.PLAYING, update);
  onDraw(State.PLAYING, draw);
}
