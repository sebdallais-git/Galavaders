import { initRenderer } from './renderer.js';
import { initInput } from './input.js';
import { startEngine } from './engine.js';
import { initPlayer } from './player.js';
import { initProjectiles } from './projectiles.js';
import { initParticles } from './particles.js';
import { initEnemies } from './enemies.js';
import { initPowerUps } from './powerups.js';
import { initShop } from './shop.js';
import { initAudio } from './audio.js';
import { initBosses } from './bosses.js';

function init() {
  initRenderer();
  initInput();
  initPlayer();
  initProjectiles();
  initParticles();
  initEnemies();
  initBosses();
  initPowerUps();
  initShop();
  initAudio();
  startEngine();
}

init();
