// ai.js - AI utility (pathfinding helpers, shared behaviors)
const AI = {
  // Simple line-of-sight check
  hasLOS(x1, y1, x2, y2) {
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      if (MAP.tileAt(cx, cy) === MAP.T.BUILDING) return false;
    }
    return true;
  },

  // Find nearest road tile to position
  nearestRoadTile(worldX, worldY) {
    const tr = Math.floor(worldY / MAP.TILE_SIZE);
    const tc = Math.floor(worldX / MAP.TILE_SIZE);
    const searchRadius = 5;
    let best = null, bestDist = Infinity;
    for (let r = tr - searchRadius; r <= tr + searchRadius; r++) {
      for (let c = tc - searchRadius; c <= tc + searchRadius; c++) {
        if (MAP.isDrivable(r, c)) {
          const wx = c * MAP.TILE_SIZE + 16;
          const wy = r * MAP.TILE_SIZE + 16;
          const d = Physics.distXY(worldX, worldY, wx, wy);
          if (d < bestDist) { bestDist = d; best = { r, c, wx, wy }; }
        }
      }
    }
    return best;
  },

  // Pick random walkable point near a position
  randomNearbyWalkable(worldX, worldY, radius) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const nx = worldX + Math.cos(angle) * dist;
      const ny = worldY + Math.sin(angle) * dist;
      const r = Math.floor(ny / MAP.TILE_SIZE);
      const c = Math.floor(nx / MAP.TILE_SIZE);
      if (MAP.isWalkable(r, c)) return { x: nx, y: ny };
    }
    return { x: worldX, y: worldY };
  },

  // Steer toward target, returns {dx, dy} normalized
  steerToward(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 1) return { dx: 0, dy: 0 };
    return { dx: dx/dist, dy: dy/dist };
  },

  // Steer away from target
  steerAway(fromX, fromY, fromTarget) {
    const dx = fromX - fromTarget.x;
    const dy = fromY - fromTarget.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 1) return { dx: 0, dy: 0 };
    return { dx: dx/dist, dy: dy/dist };
  }
};
