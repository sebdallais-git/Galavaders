// Game/public/js/levels.js
import { EnemyType } from './enemy-types.js';

const D = EnemyType.DRONE;
const S = EnemyType.SHOOTER;
const V = EnemyType.DIVER;
const Z = EnemyType.ZIGZAGGER;
const C = EnemyType.CARRIER;

export const levelConfigs = {
  // --- Zone 1: The Frontier (Drones + Shooters) ---
  1: { rows: [{ type: D, count: 6 }, { type: D, count: 6 }] },
  2: { rows: [{ type: D, count: 8 }, { type: D, count: 6 }, { type: S, count: 4 }] },
  3: { rows: [{ type: D, count: 8 }, { type: S, count: 6 }, { type: S, count: 4 }] },
  4: { rows: [{ type: D, count: 10 }, { type: S, count: 8 }, { type: S, count: 6 }] },
  // Level 5: Boss (The Hive)

  // --- Zone 2: The Swarm (Divers introduced) ---
  6: { rows: [{ type: D, count: 8 }, { type: S, count: 6 }, { type: V, count: 4 }] },
  7: { rows: [{ type: D, count: 8 }, { type: V, count: 6 }, { type: S, count: 6 }] },
  8: { rows: [{ type: S, count: 8 }, { type: V, count: 8 }, { type: D, count: 6 }] },
  9: { rows: [{ type: V, count: 8 }, { type: S, count: 8 }, { type: V, count: 6 }, { type: D, count: 4 }] },
  // Level 10: Boss (Twin Sentinels)

  // --- Zone 3: The Storm (Zigzaggers join) ---
  11: { rows: [{ type: S, count: 8 }, { type: V, count: 6 }, { type: Z, count: 4 }] },
  12: { rows: [{ type: D, count: 10 }, { type: Z, count: 6 }, { type: S, count: 6 }, { type: V, count: 4 }] },
  13: { rows: [{ type: Z, count: 8 }, { type: V, count: 8 }, { type: S, count: 8 }] },
  14: { rows: [{ type: Z, count: 8 }, { type: Z, count: 6 }, { type: V, count: 8 }, { type: S, count: 6 }] },
  // Level 15: Boss (Swarm Mother)

  // --- Zone 4: The Abyss (Carriers appear) ---
  16: { rows: [{ type: S, count: 8 }, { type: V, count: 6 }, { type: Z, count: 6 }, { type: C, count: 2 }] },
  17: { rows: [{ type: Z, count: 8 }, { type: V, count: 8 }, { type: C, count: 3 }, { type: S, count: 6 }] },
  18: { rows: [{ type: C, count: 4 }, { type: Z, count: 8 }, { type: V, count: 8 }, { type: S, count: 6 }] },
  19: { rows: [{ type: C, count: 4 }, { type: Z, count: 8 }, { type: V, count: 8 }, { type: Z, count: 6 }, { type: S, count: 8 }] },
  // Level 20: Boss (The Mothership)
};

export function isBossLevel(level) {
  return level % 5 === 0;
}

export function getLevelConfig(level) {
  return levelConfigs[level] || null;
}
