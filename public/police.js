// police.js - Police & Wanted System
class PoliceOfficer {
  constructor(x, y, vehicle) {
    this.x = x; this.y = y;
    this.id = 'police_' + Math.random().toString(36).slice(2);
    this.type = 'police';
    this.radius = 11;
    this.health = 80;
    this.maxHealth = 80;
    this.dead = false;
    this.speed = 2.0;
    this.direction = 0;
    this.state = 'chase'; // chase, shoot, patrol
    this.shootCooldown = 0;
    this.vehicle = vehicle;
    this.inVehicle = !!vehicle;
    this.weapons = [{ name: 'PISTOL', ammo: 999, maxAmmo: 999, cooldown: 0, reloading: 0 }];
    this.currentWeapon = 0;
    this.deathTimer = 0;
    this.stuckTimer = 0;
    this.lastX = x; this.lastY = y;
    this.pathTimer = 0;
  }

  takeDamage(amount, sourceType) {
    if (this.dead) return;
    this.health -= amount;
    if (this.health <= 0) this.die();
  }

  die() {
    this.dead = true;
    this.deathTimer = 120;
    Economy.spawnDrop(this.x, this.y, Economy.TYPES.MONEY, 50, '$50');
    Economy.spawnDrop(this.x, this.y+20, Economy.TYPES.AMMO, 20, 'AMMO');
    Sound.play('npc_death');
  }

  update() {
    if (this.dead) {
      this.deathTimer--;
      return;
    }

    // Update weapon cooldown
    for (const w of this.weapons) {
      if (w.cooldown > 0) w.cooldown--;
    }

    if (Player.dead) { this.state = 'patrol'; }

    const distToPlayer = Physics.distXY(this.x, this.y, Player.x, Player.y);

    if (this.inVehicle && this.vehicle) {
      this.updateInVehicle(distToPlayer);
    } else {
      this.updateOnFoot(distToPlayer);
    }
  }

  updateInVehicle(distToPlayer) {
    const v = this.vehicle;
    if (!v || v.exploding) {
      this.inVehicle = false;
      this.vehicle = null;
      return;
    }
    // Drive toward player
    const dx = Player.x - v.x;
    const dy = Player.y - v.y;
    const dist = Math.sqrt(dx*dx+dy*dy);

    if (dist < 80) {
      // Exit vehicle
      this.inVehicle = false;
      this.x = v.x + 30;
      this.y = v.y;
      v.occupant = null;
    } else {
      v.direction = Math.atan2(dy, dx);
      Physics.move(v, (dx/dist)*v.speed, (dy/dist)*v.speed, v.radius, true);
      this.x = v.x; this.y = v.y;
    }
  }

  updateOnFoot(distToPlayer) {
    this.pathTimer--;

    // Chase player
    const dx = Player.x - this.x;
    const dy = Player.y - this.y;
    const dist = Math.sqrt(dx*dx+dy*dy);

    if (distToPlayer < 300) {
      this.direction = Math.atan2(dy, dx);

      if (distToPlayer > 60) {
        // Move toward player
        Physics.move(this, (dx/dist)*this.speed, (dy/dist)*this.speed, this.radius);
      }

      // Check if stuck
      if (Math.abs(this.x - this.lastX) < 0.1 && Math.abs(this.y - this.lastY) < 0.1) {
        this.stuckTimer++;
        if (this.stuckTimer > 30) {
          // Try random direction
          const ang = Math.random() * Math.PI * 2;
          Physics.move(this, Math.cos(ang)*this.speed*3, Math.sin(ang)*this.speed*3, this.radius);
          this.stuckTimer = 0;
        }
      } else {
        this.stuckTimer = 0;
      }
      this.lastX = this.x; this.lastY = this.y;

      // Shoot at player
      if (distToPlayer < 250 && this.shootCooldown <= 0) {
        const wep = this.weapons[0];
        if (wep.cooldown <= 0) {
          const angle = Math.atan2(Player.y - this.y, Player.x - this.x);
          const spread = 0.2;
          const a = angle + (Math.random()-0.5)*spread;
          Weapons.bullets.push({
            x: this.x, y: this.y,
            vx: Math.cos(a)*7, vy: Math.sin(a)*7,
            damage: 10, range: 300, traveled: 0,
            owner: this.id, ownerType: 'police',
            color: '#66AAFF', life: 3
          });
          wep.cooldown = 25;
          this.shootCooldown = 30;
          Sound.play('police_shoot');
        }
      }
      if (this.shootCooldown > 0) this.shootCooldown--;
    }
  }

  draw(ctx, camera) {
    if (this.inVehicle) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    if (this.dead) {
      if (this.deathTimer <= 0) return;
      ctx.globalAlpha = Math.min(1, this.deathTimer/30);
      ctx.fillStyle = '#2244AA';
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx-4, sy-4); ctx.lineTo(sx+4, sy+4);
      ctx.moveTo(sx+4, sy-4); ctx.lineTo(sx-4, sy+4);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx, sy+this.radius, this.radius*0.7, 3, 0, 0, Math.PI*2);
    ctx.fill();

    // Body - blue uniform
    ctx.fillStyle = '#2244AA';
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI*2);
    ctx.fill();

    // Badge
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI*2);
    ctx.fill();

    // Direction dot
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(sx + Math.cos(this.direction)*6, sy + Math.sin(this.direction)*6, 2.5, 0, Math.PI*2);
    ctx.fill();

    // Health bar
    if (this.health < this.maxHealth) {
      const bw = 24;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(sx-bw/2, sy-this.radius-8, bw, 3);
      ctx.fillStyle = '#2288FF';
      ctx.fillRect(sx-bw/2, sy-this.radius-8, bw*(this.health/this.maxHealth), 3);
    }
  }
}

const Police = {
  officers: [],
  spawnCooldown: 0,
  maxOfficers: 10,
  sirenTimer: 0,

  init() {
    this.officers = [];
    Game.police = this.officers;
  },

  update() {
    const wl = Player.wantedLevel;

    if (this.spawnCooldown > 0) this.spawnCooldown--;

    // Spawn police based on wanted level
    if (wl >= 1 && this.spawnCooldown <= 0) {
      const maxCops = Math.floor(wl * 2);
      const alive = this.officers.filter(o => !o.dead).length;
      if (alive < maxCops) {
        this.spawnOfficer();
        this.spawnCooldown = Math.max(60, 300 - wl * 50);
      }
    }

    // Siren sound
    if (wl >= 1) {
      this.sirenTimer++;
      if (this.sirenTimer % 120 === 0) Sound.play('siren');
    } else {
      this.sirenTimer = 0;
    }

    // Update officers
    for (let i = this.officers.length - 1; i >= 0; i--) {
      const o = this.officers[i];
      o.update();
      if (o.dead && o.deathTimer <= 0) {
        this.officers.splice(i, 1);
      }
    }
  },

  spawnOfficer() {
    // Spawn near player but not too close
    const angles = [0, Math.PI/2, Math.PI, Math.PI*1.5];
    for (const angle of angles) {
      const dist = 300 + Math.random()*200;
      const spawnX = Player.x + Math.cos(angle)*dist;
      const spawnY = Player.y + Math.sin(angle)*dist;
      if (MAP.isWalkable(Math.floor(spawnY/MAP.TILE_SIZE), Math.floor(spawnX/MAP.TILE_SIZE))) {
        let vehicle = null;
        if (Player.wantedLevel >= 2 && Math.random() < 0.6) {
          vehicle = VehicleManager.spawnPoliceVehicle(Player.x, Player.y);
        }
        const officer = new PoliceOfficer(spawnX, spawnY, vehicle);
        if (vehicle) {
          vehicle.occupant = officer;
          officer.x = vehicle.x; officer.y = vehicle.y;
        }
        this.officers.push(officer);
        if (Player.wantedLevel >= 3) UI.notify('POLICE BACKUP CALLED!', '#FF4422');
        return;
      }
    }
  },

  draw(ctx, camera) {
    for (const o of this.officers) {
      o.draw(ctx, camera);
    }
  }
};
