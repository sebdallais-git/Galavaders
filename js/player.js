import { game, State, onUpdate, onDraw, setState } from './engine.js';
import { isKeyHeld, isKeyJustPressed } from './input.js';
import { drawTriangle, drawGlow, GAME_WIDTH, GAME_HEIGHT } from './renderer.js';
import { spawnEngineTrail } from './particles.js';
import { playShoot } from './audio.js';

const BASE_SPEED = 400;
const BASE_FIRE_RATE = 4;
const PLAYER_Y = GAME_HEIGHT - 60;
const SHIP_WIDTH = 28;
const SHIP_HEIGHT = 32;

export const player = {
  x: GAME_WIDTH / 2,
  y: PLAYER_Y,
  radius: 14,
  fireTimer: 0,
  invincibleTimer: 0,
  alive: true
};

export function resetPlayer() {
  player.x = GAME_WIDTH / 2;
  player.y = PLAYER_Y;
  player.fireTimer = 1 / BASE_FIRE_RATE;
  player.invincibleTimer = 0;
  player.alive = true;
}

export function respawnPlayer() {
  player.x = GAME_WIDTH / 2;
  player.alive = true;
  player.invincibleTimer = 2;
}

export function getFireRate() {
  let rate = BASE_FIRE_RATE + game.upgrades.fireRate;
  if (game.activePowerUp === 'rapid') rate *= 2;
  return rate;
}

export function getBulletDamage() {
  return 1 + game.upgrades.bulletDmg;
}

export function getMoveSpeed() {
  let speed = BASE_SPEED * (1 + game.upgrades.moveSpeed * 0.1);
  if (game.activePowerUp === 'speed') speed *= 1.5;
  return speed;
}

let onFireCallback = null;
export function onPlayerFire(fn) {
  onFireCallback = fn;
}

function update(dt) {
  if (!player.alive) return;

  if (isKeyJustPressed('Escape')) {
    setState(State.PAUSED);
    return;
  }

  const speed = getMoveSpeed();
  if (isKeyHeld('ArrowLeft')) {
    player.x -= speed * dt;
  }
  if (isKeyHeld('ArrowRight')) {
    player.x += speed * dt;
  }
  player.x = Math.max(SHIP_WIDTH / 2, Math.min(GAME_WIDTH - SHIP_WIDTH / 2, player.x));

  spawnEngineTrail(player.x, player.y);

  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= dt;
  }

  player.fireTimer -= dt;
  if (player.fireTimer <= 0) {
    player.fireTimer = 1 / getFireRate();
    playShoot();
    if (onFireCallback) onFireCallback(player.x, player.y);
  }
}

function draw() {
  if (!player.alive) return;

  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
    return;
  }

  drawGlow(player.x, player.y + SHIP_HEIGHT / 2 + 4, 18, '#00ffff', 0.25);
  drawTriangle(player.x, player.y, SHIP_WIDTH, SHIP_HEIGHT, '#ffffff');
}

export function initPlayer() {
  onUpdate(State.PLAYING, update);
  onDraw(State.PLAYING, draw);
}
