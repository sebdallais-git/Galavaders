// Enemy type definitions — extracted to its own module to avoid
// circular dependency between enemies.js and levels.js
export const EnemyType = {
  DRONE:     { name: 'drone',     hp: 1, points: 10, radius: 12, color: '#ff4444' },
  SHOOTER:   { name: 'shooter',   hp: 2, points: 25, radius: 14, color: '#ff44ff' },
  DIVER:     { name: 'diver',     hp: 2, points: 40, radius: 13, color: '#ff8800' },
  ZIGZAGGER: { name: 'zigzagger', hp: 3, points: 60, radius: 15, color: '#88ff00' },
  CARRIER:   { name: 'carrier',   hp: 6, points: 80, radius: 20, color: '#ffcc00' }
};
