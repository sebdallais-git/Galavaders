import { clearScreen, updateStars, drawStars, drawText, drawTriangle, drawRect, applyShake, resetShake, GAME_WIDTH, GAME_HEIGHT } from './renderer.js';
import { isKeyJustPressed, clearFrameInput } from './input.js';

export const State = {
  TITLE: 'TITLE',
  LEVEL_INTRO: 'LEVEL_INTRO',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  SHOP: 'SHOP',
  GAME_OVER: 'GAME_OVER',
  HIGH_SCORE_ENTRY: 'HIGH_SCORE_ENTRY'
};

export const game = {
  state: State.TITLE,
  level: 1,
  score: 0,
  highScore: parseInt(localStorage.getItem('spaceShooterHighScore') || '0'),
  lives: 3,
  upgrades: {
    fireRate: 0,
    bulletDmg: 0,
    moveSpeed: 0,
    extraLife: 0,
    magnet: 0
  },
  scoreMultiplier: 1,
  activePowerUp: null,
  powerUpTimer: 0,
  powerUpMaxTime: 8,
  levelIntroTimer: 0,
  levelClearTimer: 0,
  highScoreInitials: '',
  screenShake: { x: 0, y: 0, intensity: 0, duration: 0 },
  bossActive: false
};

const updateCallbacks = {};
const drawCallbacks = {};

export function onUpdate(state, fn) {
  if (!updateCallbacks[state]) updateCallbacks[state] = [];
  updateCallbacks[state].push(fn);
}

export function onDraw(state, fn) {
  if (!drawCallbacks[state]) drawCallbacks[state] = [];
  drawCallbacks[state].push(fn);
}

export function setState(newState) {
  game.state = newState;
}

const levelStartCallbacks = [];
export function onLevelStart(fn) { levelStartCallbacks.push(fn); }

export function resetGame() {
  game.level = 1;
  game.score = 0;
  game.lives = 3;
  game.upgrades = { fireRate: 0, bulletDmg: 0, moveSpeed: 0, extraLife: 0, magnet: 0 };
  game.scoreMultiplier = 1;
  game.activePowerUp = null;
  game.powerUpTimer = 0;
  game.highScoreInitials = '';
  game.bossActive = false;
}

export function addScore(points) {
  const multiplier = game.scoreMultiplier || 1;
  game.score += points * multiplier;
}

export function triggerShake(intensity, duration) {
  game.screenShake.intensity = intensity;
  game.screenShake.duration = duration;
}

function updateShake(dt) {
  const shake = game.screenShake;
  if (shake.duration > 0) {
    shake.duration -= dt;
    shake.x = (Math.random() - 0.5) * shake.intensity * 2;
    shake.y = (Math.random() - 0.5) * shake.intensity * 2;
  } else {
    shake.x = 0;
    shake.y = 0;
    shake.intensity = 0;
  }
}

function updateTitle() {
  if (isKeyJustPressed('Enter') || isKeyJustPressed('Space')) {
    resetGame();
    game.levelIntroTimer = 2;
    setState(State.LEVEL_INTRO);
  }
}

function drawTitle() {
  drawText('SPACE SHOOTER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, { size: 48, color: '#00ffff' });
  drawText('Press Enter or Space to start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, { size: 20, color: '#aaaaaa' });
  if (game.highScore > 0) {
    drawText(`High Score: ${game.highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, { size: 18, color: '#ffaa00' });
  }
}

function updateLevelIntro(dt) {
  game.levelIntroTimer -= dt;
  if (game.levelIntroTimer <= 0) {
    for (const fn of levelStartCallbacks) fn(game.level);
    setState(State.PLAYING);
  }
}

function drawLevelIntro() {
  const zone = Math.ceil(game.level / 5);
  const zoneNames = ['The Frontier', 'The Swarm', 'The Storm', 'The Abyss'];
  drawText(`LEVEL ${game.level}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, { size: 40, color: '#ffffff' });
  drawText(zoneNames[zone - 1] || '', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, { size: 22, color: '#00ffff' });
}

function updatePause() {
  if (isKeyJustPressed('Escape')) {
    setState(State.PLAYING);
  }
}

function drawPause() {
  drawText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2, { size: 40, color: '#ffffff' });
  drawText('Press Escape to resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, { size: 18, color: '#aaaaaa' });
}

function updateGameOver() {
  if (isKeyJustPressed('Enter') || isKeyJustPressed('Space')) {
    if (game.score > game.highScore) {
      game.highScore = game.score;
      setState(State.HIGH_SCORE_ENTRY);
    } else {
      setState(State.TITLE);
    }
  }
}

function drawGameOver() {
  if (game.level >= 20) {
    drawText('VICTORY!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, { size: 48, color: '#44ff44' });
    drawText('You defeated the Mothership!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, { size: 20, color: '#ffffff' });
  } else {
    drawText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, { size: 48, color: '#ff4444' });
  }
  drawText(`Score: ${game.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, { size: 24, color: '#ffffff' });
  drawText('Press Enter or Space', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, { size: 18, color: '#aaaaaa' });
}

function updateHighScoreEntry() {
  for (let i = 65; i <= 90; i++) {
    const code = 'Key' + String.fromCharCode(i);
    if (isKeyJustPressed(code) && game.highScoreInitials.length < 3) {
      game.highScoreInitials += String.fromCharCode(i);
    }
  }
  if (isKeyJustPressed('Backspace') && game.highScoreInitials.length > 0) {
    game.highScoreInitials = game.highScoreInitials.slice(0, -1);
  }
  if (isKeyJustPressed('Enter') && game.highScoreInitials.length > 0) {
    localStorage.setItem('spaceShooterHighScore', String(game.highScore));
    localStorage.setItem('spaceShooterHighScoreName', game.highScoreInitials);
    setState(State.TITLE);
  }
}

function drawHighScoreEntry() {
  drawText('NEW HIGH SCORE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, { size: 36, color: '#ffaa00' });
  drawText(`${game.highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, { size: 28, color: '#ffffff' });
  const display = game.highScoreInitials.padEnd(3, '_');
  drawText(display, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, { size: 48, color: '#00ffff' });
  drawText('Type your initials, press Enter', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, { size: 16, color: '#aaaaaa' });
}

function drawHUD() {
  for (let i = 0; i < game.lives; i++) {
    drawTriangle(30 + i * 28, 25, 14, 16, '#ffffff');
  }
  drawText(`SCORE: ${game.score}`, GAME_WIDTH / 2, 20, { size: 18, color: '#ffffff' });
  drawText(`LEVEL ${game.level}`, GAME_WIDTH / 2, 42, { size: 12, color: '#666666' });
  drawText(`HI: ${game.highScore}`, GAME_WIDTH - 80, 20, { size: 14, color: '#ffaa00', align: 'right' });
  if (game.activePowerUp && game.powerUpTimer > 0) {
    const barWidth = 200;
    const barHeight = 6;
    const barX = (GAME_WIDTH - barWidth) / 2;
    const barY = 55;
    const fill = game.powerUpTimer / game.powerUpMaxTime;
    const colors = { spread: '#4488ff', rapid: '#ffcc00', shield: '#44ff44', speed: '#ff8800', score: '#aa44ff' };
    const color = colors[game.activePowerUp] || '#ffffff';
    drawRect(barX, barY, barWidth, barHeight, '#333333');
    drawRect(barX, barY, barWidth * fill, barHeight, color);
  }
}

let lastTime = 0;

export function tick(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  updateShake(dt);
  updateStars(dt);

  switch (game.state) {
    case State.TITLE: updateTitle(); break;
    case State.LEVEL_INTRO: updateLevelIntro(dt); break;
    case State.PAUSED: updatePause(); break;
    case State.GAME_OVER: updateGameOver(); break;
    case State.HIGH_SCORE_ENTRY: updateHighScoreEntry(); break;
    default:
      if (updateCallbacks[game.state]) {
        for (const fn of updateCallbacks[game.state]) fn(dt);
      }
  }

  clearScreen();
  applyShake(game.screenShake.x, game.screenShake.y);
  drawStars();

  switch (game.state) {
    case State.TITLE: drawTitle(); break;
    case State.LEVEL_INTRO: drawLevelIntro(); break;
    case State.PAUSED:
      if (drawCallbacks[State.PLAYING]) {
        for (const fn of drawCallbacks[State.PLAYING]) fn();
      }
      drawPause();
      break;
    case State.GAME_OVER: drawGameOver(); break;
    case State.HIGH_SCORE_ENTRY: drawHighScoreEntry(); break;
    default:
      if (drawCallbacks[game.state]) {
        for (const fn of drawCallbacks[game.state]) fn();
      }
  }

  resetShake();
  clearFrameInput();
  requestAnimationFrame(tick);
}

// Register HUD — drawn last so it overlays everything
onDraw(State.PLAYING, drawHUD);

function updateLevelClear(dt) {
  game.levelClearTimer -= dt;
  if (game.levelClearTimer <= 0) {
    if (game.level >= 20) {
      setState(State.GAME_OVER);
    } else {
      setState(State.SHOP);
    }
  }
}

function drawLevelClear() {
  drawText('LEVEL CLEAR!', GAME_WIDTH / 2, GAME_HEIGHT / 2, { size: 36, color: '#44ff44' });
}

onUpdate(State.LEVEL_CLEAR, updateLevelClear);
onDraw(State.LEVEL_CLEAR, drawLevelClear);

export function startEngine() {
  lastTime = performance.now();
  requestAnimationFrame(tick);
}
