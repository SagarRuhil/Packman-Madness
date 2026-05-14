// vehicle.js - Vehicle System
class Vehicle {
  constructor(x, y, type = 'car') {
    this.x = x;
    this.y = y;
    this.id = 'vehicle_' + Math.random().toString(36).slice(2);
    this.type = type;
    this.radius = 18;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = type === 'police' ? 4.0 : 3.2;
    this.boostSpeed = 1.5;
    this.direction = Math.random() * Math.PI * 2;
    this.occupant = null;
    this.exploding = false;
    this.explodeTimer = 0;
    this.smokeLevel = 0;
    this.color = this.getColor();
    this.bodyColor = this.getBodyColor();
  }

  getColor() {
    if (this.type === 'police') return '#2244AA';
    const colors = ['#CC4422', '#4488CC', '#AAAAAA', '#44AA44', '#AA8822', '#882244', '#226644'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getBodyColor() {
    if (this.type === 'police') return '#FFFFFF';
    return this.color;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.smokeLevel = 1 - (this.health / this.maxHealth);
    if (this.health <= 0 && !this.exploding) {
      this.startExplode();
    }
  }

  startExplode() {
    this.exploding = true;
    this.explodeTimer = 120;
    if (this.occupant) {
      this.occupant.takeDamage(80, 'explosion');
      this.occupant.inVehicle = null;
      this.occupant = null;
    }
    Sound.play('explosion');
    UI.notify('BOOM!', '#FF4400');
    // Damage nearby
    const dist = Physics.distXY(Player.x, Player.y, this.x, this.y);
    if (dist < 80) Player.takeDamage(50, 'explosion');
    for (const n of Game.npcs) {
      if (Physics.distXY(n.x, n.y, this.x, this.y) < 80) n.takeDamage(80, 'explosion');
    }
  }

  update() {
    if (this.exploding) {
      this.explodeTimer--;
      return;
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    if (this.exploding) {
      if (this.explodeTimer <= 0) return;
      const t = this.explodeTimer / 120;
      // Explosion effect
      ctx.globalAlpha = t;
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 60 * (1-t));
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, '#FFAA00');
      grad.addColorStop(1, 'rgba(255,50,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, 60 * (1-t), 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    const cos = Math.cos(this.direction);
    const sin = Math.sin(this.direction);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx+3, sy+4, this.radius*1.2, this.radius*0.8, this.direction, 0, Math.PI*2);
    ctx.fill();

    // Car body
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.direction);

    // Main body
    ctx.fillStyle = this.bodyColor;
    ctx.fillRect(-this.radius, -this.radius*0.6, this.radius*2, this.radius*1.2);

    // Cab
    ctx.fillStyle = this.type === 'police' ? '#2244AA' : this.color;
    ctx.fillRect(-this.radius*0.5, -this.radius*0.6, this.radius, this.radius*0.7);

    // Windshield
    ctx.fillStyle = 'rgba(100,200,255,0.5)';
    ctx.fillRect(-this.radius*0.4, -this.radius*0.55, this.radius*0.8, this.radius*0.5);

    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-this.radius + 2, -this.radius*0.65, 7, 5);
    ctx.fillRect(this.radius - 9, -this.radius*0.65, 7, 5);
    ctx.fillRect(-this.radius + 2, this.radius*0.45, 7, 5);
    ctx.fillRect(this.radius - 9, this.radius*0.45, 7, 5);

    // Police lights
    if (this.type === 'police') {
      const flash = Math.floor(Game.frame / 8) % 2;
      ctx.fillStyle = flash ? '#FF0000' : '#0000FF';
      ctx.fillRect(-8, -this.radius*0.68, 7, 5);
      ctx.fillStyle = flash ? '#0000FF' : '#FF0000';
      ctx.fillRect(1, -this.radius*0.68, 7, 5);
    }

    // Headlights
    ctx.fillStyle = '#FFFFAA';
    ctx.fillRect(this.radius - 2, -8, 3, 5);
    ctx.fillRect(this.radius - 2, 3, 3, 5);

    ctx.restore();

    // Smoke when damaged
    if (this.smokeLevel > 0.4) {
      ctx.fillStyle = `rgba(100,100,100,${this.smokeLevel * 0.4})`;
      ctx.beginPath();
      ctx.arc(sx + Math.random()*10-5, sy - 10 + Math.random()*5, 8 * this.smokeLevel, 0, Math.PI*2);
      ctx.fill();
    }

    // Health bar
    if (this.health < this.maxHealth && !this.exploding) {
      const bw = 40;
      const bx = sx - bw/2;
      const by = sy - this.radius - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = this.health > 50 ? '#00FF88' : '#FF4422';
      ctx.fillRect(bx, by, bw * (this.health / this.maxHealth), 4);
    }
  }
}

const VehicleManager = {
  vehicles: [],

  init() {
    this.vehicles = [];
    const spawns = MAP.vehicleSpawns.slice();
    for (let i = 0; i < Math.min(20, spawns.length); i++) {
      const s = spawns[i];
      const wx = s.c * MAP.TILE_SIZE + 16;
      const wy = s.r * MAP.TILE_SIZE + 16;
      const type = Math.random() < 0.1 ? 'police' : 'car';
      this.vehicles.push(new Vehicle(wx, wy, type));
    }
    Game.vehicles = this.vehicles;
  },

  spawnPoliceVehicle(nearX, nearY) {
    // Find road spawn point far from player
    let attempts = 0;
    while (attempts < 20) {
      const s = MAP.vehicleSpawns[Math.floor(Math.random() * MAP.vehicleSpawns.length)];
      if (!s) break;
      const wx = s.c * MAP.TILE_SIZE + 16;
      const wy = s.r * MAP.TILE_SIZE + 16;
      const dist = Physics.distXY(wx, wy, nearX, nearY);
      if (dist > 200 && dist < 600) {
        const v = new Vehicle(wx, wy, 'police');
        this.vehicles.push(v);
        Game.vehicles.push(v);
        return v;
      }
      attempts++;
    }
    return null;
  },

  update() {
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      v.update();
      if (v.exploding && v.explodeTimer <= 0) {
        this.vehicles.splice(i, 1);
        const idx = Game.vehicles.indexOf(v);
        if (idx > -1) Game.vehicles.splice(idx, 1);
      }
    }
  },

  draw(ctx, camera) {
    for (const v of this.vehicles) {
      v.draw(ctx, camera);
    }
  }
};
