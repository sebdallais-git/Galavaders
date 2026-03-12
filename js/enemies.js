import { game, State, onUpdate, onDraw, addScore, setState, onLevelStart } from './engine.js';
import { drawCircle, drawDiamond, drawTriangle, drawHexagon, drawOval, GAME_WIDTH, GAME_HEIGHT } from './renderer.js';
import { checkCollision } from './collision.js';
import { playerBullets, spawnEnemyBulletDown, spawnEnemyBullet, enemyBullets, clearAllBullets } from './projectiles.js';
import { player, respawnPlayer } from './player.js';
import { spawnExplosion } from './particles.js';
import { getLevelConfig, isBossLevel } from './levels.js';
import { playEnemyHit, playExplosion as playExplosionSfx, playEnemyShoot, playLevelClear, playGameOver } from './audio.js';
import { EnemyType } from './enemy-types.js';
export { EnemyType };

export const enemies = [];

const FORMATION_SPACING_X = 55;
const FORMATION_SPACING_Y = 45;
const FORMATION_TOP = 60;
const MARCH_SPEED = 40;
let marchDirection = 1;
let marchOffset = 0;
const MARCH_BOUNDARY = 80;
let diveTimer = 0;

export function spawnFormation(config) {
  enemies.length = 0;
  marchDirection = 1;
  marchOffset = 0;
  diveTimer = 2;
  const { rows } = config;
  let rowIndex = 0;
  for (const row of rows) {
    for (let col = 0; col < row.count; col++) {
      const startX = (GAME_WIDTH - (row.count - 1) * FORMATION_SPACING_X) / 2;
      enemies.push(createEnemy(row.type, startX + col * FORMATION_SPACING_X, FORMATION_TOP + rowIndex * FORMATION_SPACING_Y));
    }
    rowIndex++;
  }
}

function createEnemy(type, formationX, formationY) {
  return {
    type, hp: type.hp, x: formationX, y: formationY,
    formationX, formationY, radius: type.radius,
    state: 'formation', diveTime: 0, diveStartX: 0, diveStartY: 0,
    shootTimer: 3 + Math.random() * 4, flashTimer: 0
  };
}

export function damageEnemy(enemy, damage) {
  enemy.hp -= damage;
  enemy.flashTimer = 0.08;
  playEnemyHit();
  if (enemy.hp <= 0) {
    addScore(enemy.type.points);
    spawnExplosion(enemy.x, enemy.y, enemy.type.color);
    playExplosionSfx();
    if (enemy.type === EnemyType.CARRIER) {
      for (let i = 0; i < 2; i++) {
        const drone = createEnemy(
          EnemyType.DRONE,
          enemy.x + (i === 0 ? -20 : 20),
          enemy.y
        );
        drone.state = 'diving';
        drone.diveTime = 0;
        drone.diveStartX = drone.x;
        drone.diveStartY = drone.y;
        enemies.push(drone);
      }
    }
    return true;
  }
  return false;
}

function updateFormation(dt) {
  const speed = MARCH_SPEED + game.level * 5;
  marchOffset += marchDirection * speed * dt;
  if (Math.abs(marchOffset) > MARCH_BOUNDARY) {
    marchDirection *= -1;
    marchOffset = Math.sign(marchOffset) * MARCH_BOUNDARY;
  }
}

function updateDiveAttacks(dt, diveChance) {
  diveTimer -= dt;
  if (diveTimer <= 0) {
    diveTimer = 2 - Math.min(game.level * 0.09, 1.6);
    const inFormation = enemies.filter(e => e.state === 'formation');
    if (inFormation.length > 0 && Math.random() < diveChance) {
      // Higher levels send multiple divers at once
      const maxDivers = game.level >= 16 ? 3 : game.level >= 11 ? 2 : 1;
      const count = Math.min(maxDivers, inFormation.length);
      for (let d = 0; d < count; d++) {
        const idx = Math.floor(Math.random() * inFormation.length);
        const diver = inFormation[idx];
        if (diver.state !== 'formation') continue;
        diver.state = 'diving';
        diver.diveTime = 0;
        diver.diveStartX = diver.x;
        diver.diveStartY = diver.y;
        if (diver.type === EnemyType.DIVER) {
          diver.diveEndX = diver.x + (Math.random() - 0.5) * 200;
        }
      }
    }
  }
}

function updateEnemies(dt) {
  updateFormation(dt);
  const diveChance = 0.3 + game.level * 0.04;
  updateDiveAttacks(dt, diveChance);
  for (const e of enemies) {
    e.flashTimer = Math.max(0, e.flashTimer - dt);
    if (e.state === 'formation') {
      e.x = e.formationX + marchOffset;
      e.y = e.formationY;
      if (e.type === EnemyType.SHOOTER) {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 2.5 - Math.min(game.level * 0.12, 1.8) + Math.random() * 1.5;
          spawnEnemyBulletDown(e.x, e.y + e.radius);
          playEnemyShoot();
        }
      }
    } else if (e.state === 'diving') {
      if (e.type === EnemyType.DIVER) {
        e.diveTime += dt;
        const diveDuration = Math.max(1.4, 2.5 - game.level * 0.06);
        const progress = Math.min(e.diveTime / diveDuration, 1);
        const cp = { x: player.x, y: GAME_HEIGHT + 100 };
        const inv = 1 - progress;
        e.x = inv * inv * e.diveStartX + 2 * inv * progress * cp.x + progress * progress * e.diveEndX;
        e.y = inv * inv * e.diveStartY + 2 * inv * progress * cp.y + progress * progress * (-50);

        if (progress >= 1) {
          e.state = 'formation';
        }
      } else if (e.type === EnemyType.ZIGZAGGER) {
        e.diveTime += dt;
        e.x = e.diveStartX + Math.sin(e.diveTime * 4) * 120;
        const zigSpeed = 150 + game.level * 8;
        e.y = e.diveStartY + e.diveTime * zigSpeed;

        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = Math.max(0.35, 0.8 - game.level * 0.025);
          spawnEnemyBullet(e.x, e.y, player.x, player.y);
          playEnemyShoot();
        }

        if (e.y > GAME_HEIGHT + 50) {
          e.state = 'formation';
          e.diveTime = 0;
        }
      } else {
        // Default behavior for DRONE, SHOOTER, and any other types
        e.diveTime += dt;
        const t = e.diveTime;
        e.x = e.diveStartX + Math.sin(t * 3) * (80 + game.level * 3);
        e.y = e.diveStartY + t * (250 + game.level * 10);
        if (e.y > GAME_HEIGHT + 50) {
          e.state = 'formation';
          e.y = e.formationY;
          e.x = e.formationX + marchOffset;
        }
      }
    }
  }
}

function checkBulletEnemyCollisions() {
  for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
    const bullet = playerBullets[bi];
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const enemy = enemies[ei];
      if (checkCollision(bullet, enemy)) {
        playerBullets.splice(bi, 1);
        const killed = damageEnemy(enemy, bullet.damage);
        if (killed) {
          if (onEnemyKilledCallback) onEnemyKilledCallback(enemy);
          enemies.splice(ei, 1);
        }
        break;
      }
    }
  }
}

function checkEnemyPlayerCollisions() {
  if (!player.alive || player.invincibleTimer > 0) return;
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    if (checkCollision(enemyBullets[i], player)) {
      enemyBullets.splice(i, 1);
      hitPlayer();
      return;
    }
  }
  for (const e of enemies) {
    if (checkCollision(e, player)) {
      hitPlayer();
      return;
    }
  }
}

function hitPlayer() {
  if (game.activePowerUp === 'shield') {
    game.activePowerUp = null;
    game.powerUpTimer = 0;
    return;
  }
  game.lives--;
  spawnExplosion(player.x, player.y, '#ffffff', 20);
  if (game.lives <= 0) {
    player.alive = false;
    playGameOver();
    setState(State.GAME_OVER);
  } else {
    respawnPlayer();
  }
}

let onEnemyKilledCallback = null;
export function onEnemyKilled(fn) { onEnemyKilledCallback = fn; }

function checkLevelClear() {
  if (game.bossActive) return;
  if (enemies.length === 0) {
    playLevelClear();
    game.levelClearTimer = 1.5;
    setState(State.LEVEL_CLEAR);
  }
}

function update(dt) {
  updateEnemies(dt);
  checkBulletEnemyCollisions();
  checkEnemyPlayerCollisions();
  checkLevelClear();
}

function drawEnemy(e) {
  const color = e.flashTimer > 0 ? '#ffffff' : e.type.color;
  switch (e.type) {
    case EnemyType.DRONE: drawCircle(e.x, e.y, e.radius, color); break;
    case EnemyType.SHOOTER: drawDiamond(e.x, e.y, e.radius * 2, e.radius * 2.2, color); break;
    case EnemyType.DIVER: drawTriangle(e.x, e.y, e.radius * 2, e.radius * 2, color, Math.PI); break;
    case EnemyType.ZIGZAGGER: drawHexagon(e.x, e.y, e.radius, color); break;
    case EnemyType.CARRIER: drawOval(e.x, e.y, e.radius * 1.3, e.radius, color); break;
  }
}

function draw() {
  for (const e of enemies) drawEnemy(e);
}

export function initEnemies() {
  onLevelStart((level) => {
    clearAllBullets();
    if (isBossLevel(level)) {
      // Boss levels handled by bosses.js
      return;
    }
    const config = getLevelConfig(level);
    if (config) spawnFormation(config);
  });
  onUpdate(State.PLAYING, update);
  onDraw(State.PLAYING, draw);
}
