// Game/public/js/bosses.js
import { game, State, onUpdate, onDraw, addScore, setState, triggerShake, onLevelStart } from './engine.js';
import {
  drawCircle, drawHexagon, drawDiamond, drawOval, drawRect, drawGlow, drawText,
  GAME_WIDTH, GAME_HEIGHT
} from './renderer.js';
import { checkCollision } from './collision.js';
import { playerBullets, clearAllBullets, spawnEnemyBullet, spawnEnemyBulletDown, enemyBullets } from './projectiles.js';
import { player, respawnPlayer } from './player.js';
import { spawnExplosion } from './particles.js';
import { spawnBossDrops } from './powerups.js';
import { playBossWarning, playExplosion, playEnemyHit } from './audio.js';
import { enemies } from './enemies.js';
import { EnemyType } from './enemy-types.js';
import { isBossLevel } from './levels.js';

let activeBoss = null;

export function getActiveBoss() { return activeBoss; }

// --- Boss base ---
function createBossBase(hp, x, y, radius) {
  return {
    hp,
    maxHp: hp,
    x,
    y,
    radius,
    flashTimer: 0,
    phase: 1,
    time: 0,
    hitboxes: null,
    defeated: false
  };
}

function damageBoss(boss, damage, hitbox) {
  if (hitbox) {
    hitbox.hp -= damage;
    if (hitbox.hp <= 0) hitbox.destroyed = true;
  } else {
    boss.hp -= damage;
  }
  boss.flashTimer = 0.08;
  playEnemyHit();

  const hpPercent = boss.hp / boss.maxHp;
  if (boss.updatePhase) boss.updatePhase(hpPercent);

  if (boss.hp <= 0) {
    defeatBoss(boss);
  }
}

function defeatBoss(boss) {
  boss.defeated = true;
  addScore(boss.maxHp * 10);
  spawnExplosion(boss.x, boss.y, '#ffffff', 30);
  triggerShake(8, 0.5);
  playExplosion();

  spawnBossDrops(boss.x, boss.y);

  boss.defeatTimer = 1.5;
}

function checkBossBulletCollisions(boss) {
  if (boss.defeated) return;

  for (let i = playerBullets.length - 1; i >= 0; i--) {
    const bullet = playerBullets[i];

    if (boss.hitboxes) {
      for (const hb of boss.hitboxes) {
        if (hb.destroyed) continue;
        const worldHb = { x: boss.x + hb.offsetX, y: boss.y + hb.offsetY, radius: hb.radius };
        if (checkCollision(bullet, worldHb)) {
          playerBullets.splice(i, 1);
          damageBoss(boss, bullet.damage, hb.damageTarget ? hb : null);
          break;
        }
      }
    } else {
      if (checkCollision(bullet, boss)) {
        playerBullets.splice(i, 1);
        damageBoss(boss, bullet.damage);
      }
    }
  }
}

function checkBossPlayerCollision(boss) {
  if (boss.defeated || !player.alive || player.invincibleTimer > 0) return;

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    if (checkCollision(enemyBullets[i], player)) {
      enemyBullets.splice(i, 1);
      handlePlayerHit();
      return;
    }
  }

  if (checkCollision(boss, player)) {
    handlePlayerHit();
  }
}

function handlePlayerHit() {
  if (game.activePowerUp === 'shield') {
    game.activePowerUp = null;
    game.powerUpTimer = 0;
    return;
  }
  game.lives--;
  spawnExplosion(player.x, player.y, '#ffffff', 20);
  if (game.lives <= 0) {
    player.alive = false;
    setState(State.GAME_OVER);
  } else {
    respawnPlayer();
  }
}

function drawBossHealthBar(boss) {
  const barW = 400;
  const barH = 8;
  const x = (GAME_WIDTH - barW) / 2;
  const y = 70;
  const fill = Math.max(0, boss.hp / boss.maxHp);

  drawRect(x, y, barW, barH, '#333333');
  drawRect(x, y, barW * fill, barH, '#ff4444');
  drawRect(x, y, barW, 1, '#ff6666');
}

// ============================================================
// BOSS 1: The Hive (Level 5)
// ============================================================
function createHive() {
  const boss = createBossBase(40, GAME_WIDTH / 2, 120, 60);
  boss.spawnTimer = 3;
  boss.shootTimer = 2;
  boss.moveTime = 0;

  boss.updatePhase = (hpPercent) => {
    if (hpPercent <= 0.5) boss.phase = 2;
  };

  boss.update = (dt) => {
    boss.time += dt;
    boss.moveTime += dt;

    boss.x = GAME_WIDTH / 2 + Math.sin(boss.moveTime * 0.5) * 200;

    boss.spawnTimer -= dt;
    if (boss.spawnTimer <= 0) {
      boss.spawnTimer = boss.phase === 2 ? 2.5 : 4;
      const count = boss.phase === 2 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const drone = {
          type: EnemyType.DRONE,
          hp: 1,
          x: boss.x + (i - 1) * 30,
          y: boss.y + 50,
          formationX: boss.x + (i - 1) * 30,
          formationY: boss.y + 50,
          radius: EnemyType.DRONE.radius,
          state: 'diving',
          diveTime: 0,
          diveStartX: boss.x + (i - 1) * 30,
          diveStartY: boss.y + 50,
          shootTimer: 99,
          flashTimer: 0
        };
        enemies.push(drone);
      }
    }

    if (boss.phase >= 2) {
      boss.shootTimer -= dt;
      if (boss.shootTimer <= 0) {
        boss.shootTimer = 1.2;
        spawnEnemyBullet(boss.x, boss.y + boss.radius, player.x, player.y);
      }
    }
  };

  boss.draw = () => {
    const color = boss.flashTimer > 0 ? '#ffffff' : '#ff4444';
    drawHexagon(boss.x, boss.y, boss.radius, color);
    drawGlow(boss.x, boss.y, boss.radius + 20, '#ff4444', 0.1);
  };

  return boss;
}

// ============================================================
// BOSS 2: Twin Sentinels (Level 10)
// ============================================================
function createTwinSentinels() {
  const boss = createBossBase(60, GAME_WIDTH / 2, 150, 40);
  boss.sentinels = [
    { hp: 30, maxHp: 30, alive: true, x: 0, y: 0, radius: 40, flashTimer: 0, shootTimer: 1 },
    { hp: 30, maxHp: 30, alive: true, x: 0, y: 0, radius: 40, flashTimer: 0, shootTimer: 2 }
  ];
  boss.orbitAngle = 0;
  boss.orbitRadius = 100;

  boss.update = (dt) => {
    boss.time += dt;
    boss.orbitAngle += dt * 1.2;

    for (let i = 0; i < 2; i++) {
      const s = boss.sentinels[i];
      if (!s.alive) continue;
      const angle = boss.orbitAngle + i * Math.PI;
      s.x = GAME_WIDTH / 2 + Math.cos(angle) * boss.orbitRadius;
      s.y = 150 + Math.sin(angle) * 50;
      s.flashTimer = Math.max(0, s.flashTimer - dt);

      const aliveCount = boss.sentinels.filter(ss => ss.alive).length;
      const fireRate = aliveCount === 1 ? 0.4 : 1.5;

      s.shootTimer -= dt;
      if (s.shootTimer <= 0) {
        s.shootTimer = fireRate;
        if (aliveCount === 1) {
          spawnEnemyBullet(s.x, s.y, player.x, player.y);
        } else {
          for (let a = -0.3; a <= 0.3; a += 0.3) {
            const angle = Math.PI / 2 + a;
            spawnEnemyBullet(s.x, s.y, s.x + Math.cos(angle) * 100, s.y + Math.sin(angle) * 100);
          }
        }
      }
    }
  };

  boss.customCollision = (bullet) => {
    for (const s of boss.sentinels) {
      if (!s.alive) continue;
      if (checkCollision(bullet, s)) {
        s.hp -= bullet.damage;
        s.flashTimer = 0.08;
        playEnemyHit();
        if (s.hp <= 0) {
          s.alive = false;
          spawnExplosion(s.x, s.y, '#ff44ff', 20);
          playExplosion();
          boss.hp -= s.maxHp;
        }
        if (!boss.sentinels.some(ss => ss.alive)) {
          defeatBoss(boss);
        }
        return true;
      }
    }
    return false;
  };

  boss.draw = () => {
    for (const s of boss.sentinels) {
      if (!s.alive) continue;
      const color = s.flashTimer > 0 ? '#ffffff' : '#ff44ff';
      drawDiamond(s.x, s.y, s.radius * 2, s.radius * 2.2, color);
      drawGlow(s.x, s.y, s.radius + 10, '#ff44ff', 0.1);
    }
  };

  return boss;
}

// ============================================================
// BOSS 3: Swarm Mother (Level 15)
// ============================================================
function createSwarmMother() {
  const boss = createBossBase(80, GAME_WIDTH / 2, 100, 70);
  boss.moveDir = 1;
  boss.spawnTimer = 3;
  boss.laserAngle = -0.5;
  boss.laserDir = 1;
  boss.shootTimer = 2;

  boss.updatePhase = (hpPercent) => {
    if (hpPercent <= 0.33) boss.phase = 3;
    else if (hpPercent <= 0.66) boss.phase = 2;
  };

  boss.update = (dt) => {
    boss.time += dt;

    boss.x += boss.moveDir * 100 * dt;
    if (boss.x > GAME_WIDTH - 100) boss.moveDir = -1;
    if (boss.x < 100) boss.moveDir = 1;

    if (boss.phase === 1 || boss.phase === 3) {
      boss.spawnTimer -= dt;
      if (boss.spawnTimer <= 0) {
        boss.spawnTimer = boss.phase === 3 ? 1.5 : 2.5;
        const diver = {
          type: EnemyType.DIVER,
          hp: 2,
          x: boss.x,
          y: boss.y + 60,
          formationX: boss.x,
          formationY: boss.y + 60,
          radius: EnemyType.DIVER.radius,
          state: 'diving',
          diveTime: 0,
          diveStartX: boss.x,
          diveStartY: boss.y + 60,
          shootTimer: 99,
          flashTimer: 0
        };
        enemies.push(diver);
      }
    }

    if (boss.phase >= 2) {
      boss.laserAngle += boss.laserDir * 1.5 * dt;
      if (boss.laserAngle > 0.5) boss.laserDir = -1;
      if (boss.laserAngle < -0.5) boss.laserDir = 1;

      boss.shootTimer -= dt;
      if (boss.shootTimer <= 0) {
        boss.shootTimer = 0.15;
        const angle = Math.PI / 2 + boss.laserAngle;
        const tx = boss.x + Math.cos(angle) * 400;
        const ty = boss.y + Math.sin(angle) * 400;
        spawnEnemyBullet(boss.x, boss.y + boss.radius, tx, ty);
      }
    }
  };

  boss.draw = () => {
    const color = boss.flashTimer > 0 ? '#ffffff' : '#ff8800';
    drawOval(boss.x, boss.y, boss.radius * 1.3, boss.radius, color);
    drawGlow(boss.x, boss.y, boss.radius + 20, '#ff8800', 0.1);
  };

  return boss;
}

// ============================================================
// BOSS 4: The Mothership (Level 20)
// ============================================================
function createMothership() {
  const boss = createBossBase(110, GAME_WIDTH / 2, 100, 60);
  boss.generators = [
    { offsetX: -180, offsetY: 0, radius: 35, hp: 30, maxHp: 30, destroyed: false, flashTimer: 0 },
    { offsetX: 180, offsetY: 0, radius: 35, hp: 30, maxHp: 30, destroyed: false, flashTimer: 0 }
  ];
  boss.coreHp = 50;
  boss.coreMaxHp = 50;
  boss.coreVulnerable = false;
  boss.spawnTimer = 4;
  boss.shootTimer = 1;
  boss.bulletPattern = 0;

  boss.updatePhase = () => {
    const corePercent = boss.coreHp / boss.coreMaxHp;
    if (corePercent <= 0.33) boss.phase = 3;
    else if (corePercent <= 0.66) boss.phase = 2;
  };

  boss.update = (dt) => {
    boss.time += dt;

    boss.x = GAME_WIDTH / 2 + Math.sin(boss.time * 0.3) * 150;

    boss.coreVulnerable = boss.generators.every(g => g.destroyed);

    for (const g of boss.generators) {
      g.flashTimer = Math.max(0, g.flashTimer - dt);
    }

    boss.spawnTimer -= dt;
    if (boss.spawnTimer <= 0) {
      boss.spawnTimer = 3 - boss.phase * 0.5;
      const types = [EnemyType.DRONE, EnemyType.SHOOTER, EnemyType.DIVER, EnemyType.ZIGZAGGER];
      const type = types[Math.floor(Math.random() * Math.min(boss.phase + 1, types.length))];
      const enemy = {
        type,
        hp: type.hp,
        x: boss.x + (Math.random() - 0.5) * 200,
        y: boss.y + 60,
        formationX: boss.x,
        formationY: boss.y + 60,
        radius: type.radius,
        state: 'diving',
        diveTime: 0,
        diveStartX: boss.x,
        diveStartY: boss.y + 60,
        shootTimer: 2 + Math.random() * 3,
        flashTimer: 0
      };
      enemies.push(enemy);
    }

    boss.shootTimer -= dt;
    if (boss.shootTimer <= 0) {
      boss.shootTimer = 0.8 - boss.phase * 0.15;
      boss.bulletPattern = (boss.bulletPattern + 1) % 3;

      if (boss.bulletPattern === 0) {
        spawnEnemyBullet(boss.x, boss.y + boss.radius, player.x, player.y);
      } else if (boss.bulletPattern === 1) {
        for (let a = -0.4; a <= 0.4; a += 0.2) {
          const angle = Math.PI / 2 + a;
          spawnEnemyBullet(boss.x, boss.y + boss.radius, boss.x + Math.cos(angle) * 300, boss.y + Math.sin(angle) * 300);
        }
      } else {
        for (const g of boss.generators) {
          if (!g.destroyed) {
            spawnEnemyBulletDown(boss.x + g.offsetX, boss.y + g.offsetY + g.radius);
          }
        }
      }
    }
  };

  boss.customCollision = (bullet) => {
    for (const g of boss.generators) {
      if (g.destroyed) continue;
      const worldG = { x: boss.x + g.offsetX, y: boss.y + g.offsetY, radius: g.radius };
      if (checkCollision(bullet, worldG)) {
        g.hp -= bullet.damage;
        g.flashTimer = 0.08;
        playEnemyHit();
        if (g.hp <= 0) {
          g.destroyed = true;
          spawnExplosion(worldG.x, worldG.y, '#ffcc00', 20);
          playExplosion();
        }
        return true;
      }
    }

    if (boss.coreVulnerable) {
      if (checkCollision(bullet, boss)) {
        boss.coreHp -= bullet.damage;
        boss.hp = boss.coreHp + boss.generators.reduce((sum, g) => sum + (g.destroyed ? 0 : g.hp), 0);
        boss.flashTimer = 0.08;
        playEnemyHit();
        boss.updatePhase();
        if (boss.coreHp <= 0) {
          defeatBoss(boss);
        }
        return true;
      }
    }
    return false;
  };

  boss.draw = () => {
    for (const g of boss.generators) {
      if (g.destroyed) continue;
      const gx = boss.x + g.offsetX;
      const gy = boss.y + g.offsetY;
      const color = g.flashTimer > 0 ? '#ffffff' : '#ffcc00';
      drawCircle(gx, gy, g.radius, color);
      drawGlow(gx, gy, g.radius + 10, '#ffcc00', 0.1);
    }

    const coreColor = boss.flashTimer > 0 ? '#ffffff' : (boss.coreVulnerable ? '#ff4444' : '#666666');
    drawCircle(boss.x, boss.y, boss.radius, coreColor);
    if (boss.coreVulnerable) {
      drawGlow(boss.x, boss.y, boss.radius + 20, '#ff4444', 0.15);
    }
  };

  return boss;
}

// --- Boss lifecycle ---
function spawnBoss(level) {
  clearAllBullets();
  playBossWarning();

  game.bossActive = true;
  switch (level) {
    case 5: activeBoss = createHive(); break;
    case 10: activeBoss = createTwinSentinels(); break;
    case 15: activeBoss = createSwarmMother(); break;
    case 20: activeBoss = createMothership(); break;
  }
}

function update(dt) {
  if (!activeBoss) return;

  if (activeBoss.defeated) {
    activeBoss.defeatTimer -= dt;
    if (activeBoss.defeatTimer <= 0) {
      activeBoss = null;
      game.bossActive = false;
      game.levelClearTimer = 1.5;
      setState(State.LEVEL_CLEAR);
    }
    return;
  }

  activeBoss.flashTimer = Math.max(0, activeBoss.flashTimer - dt);
  activeBoss.update(dt);

  if (activeBoss.customCollision) {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      if (activeBoss.customCollision(playerBullets[i])) {
        playerBullets.splice(i, 1);
      }
    }
  } else {
    checkBossBulletCollisions(activeBoss);
  }

  checkBossPlayerCollision(activeBoss);
}

function draw() {
  if (!activeBoss) return;
  activeBoss.draw();
  if (!activeBoss.defeated) {
    drawBossHealthBar(activeBoss);
  }
}

export function initBosses() {
  onLevelStart((level) => {
    if (isBossLevel(level)) {
      spawnBoss(level);
    }
  });
  onUpdate(State.PLAYING, update);
  onDraw(State.PLAYING, draw);
}
