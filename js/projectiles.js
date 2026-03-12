import { game, State, onUpdate, onDraw } from './engine.js';
import { drawRect, drawGlow, GAME_WIDTH, GAME_HEIGHT } from './renderer.js';
import { player, onPlayerFire, getBulletDamage } from './player.js';

const BULLET_SPEED = 600;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 12;
const BASE_ENEMY_BULLET_SPEED = 300;

function getEnemyBulletSpeed() {
  return BASE_ENEMY_BULLET_SPEED + game.level * 9;
}

export const playerBullets = [];
export const enemyBullets = [];

function spawnPlayerBullet(x, y) {
  if (game.activePowerUp === 'spread') {
    const angles = [-0.15, 0, 0.15];
    for (const angle of angles) {
      playerBullets.push({
        x, y: y - 20,
        vx: Math.sin(angle) * BULLET_SPEED,
        vy: -Math.cos(angle) * BULLET_SPEED,
        radius: 3, damage: getBulletDamage()
      });
    }
  } else {
    playerBullets.push({
      x, y: y - 20, vx: 0, vy: -BULLET_SPEED,
      radius: 3, damage: getBulletDamage()
    });
  }
}

export function spawnEnemyBullet(x, y, targetX, targetY) {
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  enemyBullets.push({ x, y, vx: (dx / dist) * getEnemyBulletSpeed(), vy: (dy / dist) * getEnemyBulletSpeed(), radius: 4 });
}

export function spawnEnemyBulletDown(x, y) {
  enemyBullets.push({ x, y, vx: 0, vy: getEnemyBulletSpeed(), radius: 4 });
}

export function clearAllBullets() {
  playerBullets.length = 0;
  enemyBullets.length = 0;
}

function update(dt) {
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const b = playerBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < -20 || b.x < -20 || b.x > GAME_WIDTH + 20) {
      playerBullets.splice(i, 1);
    }
  }
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y > GAME_HEIGHT + 20 || b.y < -20 || b.x < -20 || b.x > GAME_WIDTH + 20) {
      enemyBullets.splice(i, 1);
    }
  }
}

function draw() {
  for (const b of playerBullets) {
    drawGlow(b.x, b.y, 6, '#00ffff', 0.2);
    drawRect(b.x - BULLET_WIDTH / 2, b.y - BULLET_HEIGHT / 2, BULLET_WIDTH, BULLET_HEIGHT, '#00ffff');
  }
  for (const b of enemyBullets) {
    drawGlow(b.x, b.y, 6, '#ff4466', 0.2);
    drawRect(b.x - 3, b.y - 3, 6, 6, '#ff4466');
  }
}

export function initProjectiles() {
  onPlayerFire(spawnPlayerBullet);
  onUpdate(State.PLAYING, update);
  onDraw(State.PLAYING, draw);
}
