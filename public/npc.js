// npc.js - NPC Pedestrians
class NPC {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.id = 'npc_' + Math.random().toString(36).slice(2);
    this.type = 'npc';
    this.radius = 10;
    this.health = 50;
    this.maxHealth = 50;
    this.dead = false;
    this.speed = 0.8 + Math.random() * 0.5;
    this.panicSpeed = 2.5;
    this.direction = Math.random() * Math.PI * 2;
    this.state = 'wander';  // wander, flee, dead
    this.stateTimer = 0;
    this.wanderTimer = Math.floor(Math.random() * 120);
    this.color = this.randomColor();
    this.weapons = [{ name: 'FISTS', ammo: Infinity, maxAmmo: Infinity, cooldown: 0, reloading: 0 }];
    this.currentWeapon = 0;
    this.panicTarget = null;
    this.deathTimer = 0;
    this.targetX = x;
    this.targetY = y;
  }

  randomColor() {
    const colors = ['#FF6688', '#88AAFF', '#FFAA44', '#44FFAA', '#FF88AA', '#AAFFCC'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  takeDamage(amount, sourceType) {
    if (this.dead) return;
    this.health -= amount;
    this.state = 'flee';
    this.stateTimer = 300;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    this.deathTimer = 180;
    Economy.spawnNPCDrops(this.x, this.y);
    Player.kills++;
    Player.addWanted(0.8);
    Sound.play('npc_death');
  }

  update() {
    if (this.dead) {
      this.deathTimer--;
      return;
    }

    const distToPlayer = Physics.distXY(this.x, this.y, Player.x, Player.y);

    // React to player with weapon
    if (Player.wantedLevel >= 3 && distToPlayer < 150) {
      this.state = 'flee';
      this.stateTimer = 200;
    }

    // Check if being shot at
    for (const b of Weapons.bullets) {
      if (b.ownerType === 'player') {
        const dist = Physics.distXY(b.x, b.y, this.x, this.y);
        if (dist < 80) {
          this.state = 'flee';
          this.stateTimer = 300;
          break;
        }
      }
    }

    switch (this.state) {
      case 'wander':
        this.updateWander();
        break;
      case 'flee':
        this.updateFlee();
        this.stateTimer--;
        if (this.stateTimer <= 0) this.state = 'wander';
        break;
    }
  }

  updateWander() {
    this.wanderTimer--;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 60 + Math.floor(Math.random() * 120);
      this.direction = Math.random() * Math.PI * 2;
      this.targetX = this.x + Math.cos(this.direction) * 80;
      this.targetY = this.y + Math.sin(this.direction) * 80;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 5) {
      const nx = dx/dist * this.speed;
      const ny = dy/dist * this.speed;
      const prevX = this.x, prevY = this.y;
      Physics.move(this, nx, ny, this.radius);
      if (this.x === prevX && this.y === prevY) {
        // Stuck, pick new direction
        this.direction = Math.random() * Math.PI * 2;
        this.targetX = this.x + Math.cos(this.direction) * 80;
        this.targetY = this.y + Math.sin(this.direction) * 80;
        this.wanderTimer = 40;
      }
    }
  }

  updateFlee() {
    // Run away from player
    const dx = this.x - Player.x;
    const dy = this.y - Player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0) {
      Physics.move(this, (dx/dist) * this.panicSpeed, (dy/dist) * this.panicSpeed, this.radius);
      this.direction = Math.atan2(dy, dx);
    }
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    if (this.dead) {
      if (this.deathTimer <= 0) return;
      ctx.globalAlpha = Math.min(1, this.deathTimer / 30);
      ctx.fillStyle = '#882222';
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI*2);
      ctx.fill();
      // X eyes
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
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius, this.radius * 0.7, 3, 0, 0, Math.PI*2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.state === 'flee' ? '#FF6644' : this.color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI*2);
    ctx.fill();

    // Face direction
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(sx + Math.cos(this.direction)*4, sy + Math.sin(this.direction)*4, 3, 0, Math.PI*2);
    ctx.fill();

    // Flee indicator
    if (this.state === 'flee') {
      ctx.fillStyle = '#FFE000';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', sx, sy - this.radius - 4);
      ctx.textAlign = 'left';
    }
  }
}

const NPCManager = {
  npcs: [],
  maxNPCs: 40,

  init() {
    this.npcs = [];
    const spawns = MAP.npcSpawns.slice();
    // Shuffle
    for (let i = spawns.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [spawns[i], spawns[j]] = [spawns[j], spawns[i]];
    }
    for (let i = 0; i < Math.min(this.maxNPCs, spawns.length); i++) {
      const s = spawns[i];
      const wx = s.c * MAP.TILE_SIZE + 16;
      const wy = s.r * MAP.TILE_SIZE + 16;
      this.npcs.push(new NPC(wx, wy));
    }
    Game.npcs = this.npcs;
  },

  update() {
    // Respawn if too few
    if (this.npcs.filter(n => !n.dead).length < 20) {
      const s = MAP.npcSpawns[Math.floor(Math.random() * MAP.npcSpawns.length)];
      if (s) {
        const wx = s.c * MAP.TILE_SIZE + 16;
        const wy = s.r * MAP.TILE_SIZE + 16;
        if (Physics.distXY(wx, wy, Player.x, Player.y) > 300) {
          this.npcs.push(new NPC(wx, wy));
        }
      }
    }

    // Remove fully dead
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const n = this.npcs[i];
      n.update();
      if (n.dead && n.deathTimer <= 0) {
        this.npcs.splice(i, 1);
      }
    }
  },

  draw(ctx, camera) {
    for (const n of this.npcs) {
      n.draw(ctx, camera);
    }
  }
};
