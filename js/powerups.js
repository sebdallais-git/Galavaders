// Game/public/js/powerups.js
import { game, State, onUpdate, onDraw } from './engine.js';
import { drawCircle, drawGlow, drawText, GAME_HEIGHT } from './renderer.js';
import { checkCollision } from './collision.js';
import { player } from './player.js';
import { onEnemyKilled } from './enemies.js';
import { spawnPowerUpSparkle } from './particles.js';
import { playPowerUp } from './audio.js';

const DROP_CHANCE = 0.10;
const FALL_SPEED = 120;
const POWERUP_RADIUS = 10;
const DURATION = 8;

const TYPES = ['spread', 'rapid', 'shield', 'speed', 'score'];
const COLORS = {
  spread: '#4488ff',
  rapid: '#ffcc00',
  shield: '#44ff44',
  speed: '#ff8800',
  score: '#aa44ff'
};
const LABELS = {
  spread: 'SPREAD',
  rapid: 'RAPID',
  shield: 'SHIELD',
  speed: 'SPEED',
  score: '2x'
};

const activePowerUps = []; // falling pickups

function spawnDrop(x, y) {
  if (Math.random() > DROP_CHANCE) return;
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  activePowerUps.push({
    x,
    y,
    type,
    radius: POWERUP_RADIUS
  });
}

function applyPowerUp(type) {
  deactivatePowerUp();
  game.activePowerUp = type;
  game.powerUpTimer = DURATION;
  game.powerUpMaxTime = DURATION;
  if (type === 'score') game.scoreMultiplier = 2;
}

function deactivatePowerUp() {
  if (game.activePowerUp === 'score') game.scoreMultiplier = 1;
  game.activePowerUp = null;
  game.powerUpTimer = 0;
}

function getMagnetRadius() {
  const lvl = game.upgrades.magnet;
  if (lvl === 0) return 0;
  return [100, 200, 350][lvl - 1];
}

function update(dt) {
  if (game.activePowerUp) {
    game.powerUpTimer -= dt;
    if (game.powerUpTimer <= 0) {
      deactivatePowerUp();
    }
  }

  const magnetRadius = getMagnetRadius();

  for (let i = activePowerUps.length - 1; i >= 0; i--) {
    const p = activePowerUps[i];

    if (magnetRadius > 0 && player.alive) {
      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < magnetRadius && dist > 0) {
        const pullStrength = 200 * (1 - dist / magnetRadius);
        p.x += (dx / dist) * pullStrength * dt;
        p.y += (dy / dist) * pullStrength * dt;
      }
    }

    p.y += FALL_SPEED * dt;

    if (player.alive && checkCollision(p, player)) {
      applyPowerUp(p.type);
      playPowerUp();
      spawnPowerUpSparkle(p.x, p.y, COLORS[p.type]);
      activePowerUps.splice(i, 1);
      continue;
    }

    if (p.y > GAME_HEIGHT + 20) {
      activePowerUps.splice(i, 1);
    }
  }
}

function draw() {
  for (const p of activePowerUps) {
    const color = COLORS[p.type];
    drawGlow(p.x, p.y, 20, color, 0.15);
    drawCircle(p.x, p.y, p.radius, color);
    drawText(LABELS[p.type], p.x, p.y, { size: 8, color: '#ffffff' });
  }
}

export function clearPowerUps() {
  activePowerUps.length = 0;
}

export function spawnBossDrops(x, y) {
  const offsets = [-40, 0, 40];
  for (const ox of offsets) {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    activePowerUps.push({ x: x + ox, y, type, radius: POWERUP_RADIUS });
  }
}

export function initPowerUps() {
  onEnemyKilled((enemy) => {
    spawnDrop(enemy.x, enemy.y);
  });
  onUpdate(State.PLAYING, update);
  onDraw(State.PLAYING, draw);
}
