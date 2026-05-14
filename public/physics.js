// physics.js - Collision Detection & Movement
const Physics = {
  TILE: 32,

  // Check if a circle (entity) can move to position
  canMove(x, y, radius, forVehicle = false) {
    const checks = [
      { dx: -radius, dy: -radius },
      { dx:  radius, dy: -radius },
      { dx: -radius, dy:  radius },
      { dx:  radius, dy:  radius },
      { dx: 0, dy: -radius },
      { dx: 0, dy:  radius },
      { dx: -radius, dy: 0 },
      { dx:  radius, dy: 0 },
    ];
    for (const { dx, dy } of checks) {
      const tx = x + dx;
      const ty = y + dy;
      if (forVehicle) {
        if (!MAP.isDrivable(Math.floor(ty / this.TILE), Math.floor(tx / this.TILE))) {
          return false;
        }
      } else {
        if (!MAP.isWalkable(Math.floor(ty / this.TILE), Math.floor(tx / this.TILE))) {
          return false;
        }
      }
    }
    return true;
  },

  // Move entity with collision sliding
  move(entity, dx, dy, radius, forVehicle = false) {
    const nx = entity.x + dx;
    const ny = entity.y + dy;

    if (this.canMove(nx, ny, radius, forVehicle)) {
      entity.x = nx;
      entity.y = ny;
    } else if (this.canMove(nx, entity.y, radius, forVehicle)) {
      entity.x = nx;
    } else if (this.canMove(entity.x, ny, radius, forVehicle)) {
      entity.y = ny;
    }

    // World bounds
    const maxX = MAP.COLS * this.TILE - radius;
    const maxY = MAP.ROWS * this.TILE - radius;
    entity.x = Math.max(radius, Math.min(maxX, entity.x));
    entity.y = Math.max(radius, Math.min(maxY, entity.y));
  },

  // Circle vs circle collision
  circleCollide(a, b, radA, radB) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist < radA + radB;
  },

  dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy);
  },

  distXY(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx*dx + dy*dy);
  },

  normalize(dx, dy) {
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx/len, y: dy/len };
  },

  angle(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }
};
