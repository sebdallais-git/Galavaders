export function checkCollision(a, b) {
  const aHitboxes = getHitboxes(a);
  const bHitboxes = getHitboxes(b);

  for (const ah of aHitboxes) {
    for (const bh of bHitboxes) {
      const dx = bh.x - ah.x;
      const dy = bh.y - ah.y;
      const distSq = dx * dx + dy * dy;
      const radiiSum = ah.radius + bh.radius;
      if (distSq < radiiSum * radiiSum) {
        return true;
      }
    }
  }
  return false;
}

function getHitboxes(entity) {
  if (entity.hitboxes) {
    return entity.hitboxes.map(h => ({
      x: entity.x + (h.offsetX || 0),
      y: entity.y + (h.offsetY || 0),
      radius: h.radius
    }));
  }
  return [{ x: entity.x, y: entity.y, radius: entity.radius }];
}

export function pointInEntity(px, py, entity) {
  const hitboxes = getHitboxes(entity);
  for (const h of hitboxes) {
    const dx = px - h.x;
    const dy = py - h.y;
    if (dx * dx + dy * dy < h.radius * h.radius) return true;
  }
  return false;
}
