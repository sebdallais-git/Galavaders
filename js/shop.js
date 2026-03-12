// Game/public/js/shop.js
import { game, State, onUpdate, onDraw, setState } from './engine.js';
import { isKeyJustPressed } from './input.js';
import { drawRect, drawText, GAME_WIDTH, GAME_HEIGHT } from './renderer.js';

const UPGRADES = [
  { key: 'fireRate',  label: 'Fire Rate',  maxLevel: 5, costs: [200, 500, 1000, 2000, 4000], desc: '+1 shot/sec' },
  { key: 'bulletDmg', label: 'Bullet Dmg',  maxLevel: 5, costs: [300, 600, 1200, 2400, 5000], desc: '+1 damage' },
  { key: 'moveSpeed', label: 'Move Speed',  maxLevel: 3, costs: [250, 750, 1500], desc: '+10% speed' },
  { key: 'extraLife', label: 'Extra Life',  maxLevel: 3, costs: [500, 1500, 3000], desc: '+1 life' },
  { key: 'magnet',    label: 'Magnet',      maxLevel: 3, costs: [400, 800, 1600], desc: 'Pull power-ups' }
];

let selectedIndex = 0;

function getCurrentCost(upgrade) {
  const level = game.upgrades[upgrade.key];
  if (level >= upgrade.maxLevel) return null;
  return upgrade.costs[level];
}

function purchase() {
  const upgrade = UPGRADES[selectedIndex];
  const cost = getCurrentCost(upgrade);
  if (cost === null) return;
  if (game.score < cost) return;

  game.score -= cost;

  if (upgrade.key === 'extraLife') {
    game.lives++;
  }
  game.upgrades[upgrade.key]++;
}

function advanceToNextLevel() {
  game.level++;
  if (game.level > 20) {
    setState(State.GAME_OVER);
    return;
  }
  game.levelIntroTimer = 2;
  setState(State.LEVEL_INTRO);
}

function update(dt) {
  if (isKeyJustPressed('ArrowUp')) {
    selectedIndex = (selectedIndex - 1 + UPGRADES.length) % UPGRADES.length;
  }
  if (isKeyJustPressed('ArrowDown')) {
    selectedIndex = (selectedIndex + 1) % UPGRADES.length;
  }
  if (isKeyJustPressed('Enter') || isKeyJustPressed('Space')) {
    purchase();
  }
  if (isKeyJustPressed('Escape')) {
    advanceToNextLevel();
  }
}

function draw() {
  const panelW = 500;
  const panelH = 360;
  const panelX = (GAME_WIDTH - panelW) / 2;
  const panelY = (GAME_HEIGHT - panelH) / 2;

  drawRect(panelX, panelY, panelW, panelH, 'rgba(10, 14, 39, 0.92)');
  drawRect(panelX, panelY, panelW, 2, '#00ffff');
  drawRect(panelX, panelY + panelH - 2, panelW, 2, '#00ffff');

  drawText('UPGRADE SHOP', GAME_WIDTH / 2, panelY + 30, { size: 24, color: '#00ffff' });
  drawText(`Score: ${game.score}`, GAME_WIDTH / 2, panelY + 55, { size: 16, color: '#ffaa00' });

  const startY = panelY + 90;
  const rowH = 48;

  for (let i = 0; i < UPGRADES.length; i++) {
    const u = UPGRADES[i];
    const y = startY + i * rowH;
    const level = game.upgrades[u.key];
    const cost = getCurrentCost(u);
    const isSelected = i === selectedIndex;
    const isMaxed = cost === null;
    const canAfford = !isMaxed && game.score >= cost;

    if (isSelected) {
      drawRect(panelX + 10, y - 8, panelW - 20, rowH - 8, 'rgba(0, 255, 255, 0.08)');
      drawText('>', panelX + 25, y + 10, { size: 18, color: '#00ffff', align: 'left' });
    }

    const labelColor = isSelected ? '#ffffff' : '#aaaaaa';
    drawText(u.label, panelX + 45, y + 10, { size: 16, color: labelColor, align: 'left' });

    for (let p = 0; p < u.maxLevel; p++) {
      const pipX = panelX + 200 + p * 18;
      const pipColor = p < level ? '#00ffff' : '#333333';
      drawRect(pipX, y + 4, 12, 12, pipColor);
    }

    if (isMaxed) {
      drawText('MAX', panelX + panelW - 30, y + 10, { size: 14, color: '#44ff44', align: 'right' });
    } else {
      const costColor = canAfford ? '#ffcc00' : '#664400';
      drawText(`${cost}`, panelX + panelW - 30, y + 10, { size: 14, color: costColor, align: 'right' });
    }

    drawText(u.desc, panelX + 200, y + 26, { size: 10, color: '#666666', align: 'left' });
  }

  drawText('Up/Down: Navigate  |  Enter: Buy  |  Esc: Next Level', GAME_WIDTH / 2, panelY + panelH - 20, { size: 12, color: '#555555' });
}

export function initShop() {
  onUpdate(State.SHOP, update);
  onDraw(State.SHOP, draw);
}
