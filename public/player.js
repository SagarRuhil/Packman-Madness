// player.js - Player Entity
const Player = {
  x: 0, y: 0,
  radius: 12,
  speed: 2.5,
  sprintSpeed: 4.5,
  health: 100,
  maxHealth: 100,
  armor: 0,
  maxArmor: 100,
  money: 500,
  stamina: 100,
  maxStamina: 100,
  staminaRegen: 0.3,
  wantedLevel: 0,
  wantedTimer: 0,
  wantedCooldown: 0,
  weapons: [],
  currentWeapon: 0,
  inVehicle: null,
  id: 'player',
  type: 'player',
  dead: false,
  kills: 0,
  direction: 0,
  invincible: 0,
  flashTimer: 0,
  shootCooldown: 0,

  init(x, y) {
    this.x = x; this.y = y;
    this.health = 100;
    this.armor = 0;
    this.money = 500;
    this.stamina = 100;
    this.wantedLevel = 0;
    this.weapons = [{ name: 'FISTS', ammo: Infinity, maxAmmo: Infinity, cooldown: 0, reloading: 0 }];
    this.currentWeapon = 0;
    this.inVehicle = null;
    this.dead = false;
    this.kills = 0;
    this.invincible = 0;
    Weapons.give(this, 'PISTOL');
  },

  update(input) {
    if (this.dead) return;

    this.flashTimer = Math.max(0, this.flashTimer - 1);
    this.invincible = Math.max(0, this.invincible - 1);

    if (this.inVehicle) {
      this.updateInVehicle(input);
      return;
    }

    // Movement
    let dx = 0, dy = 0;
    if (input.keys['KeyW'] || input.keys['ArrowUp'])    dy -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown'])  dy += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft'])  dx -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const sprint = input.keys['ShiftLeft'] || input.keys['ShiftRight'];
    let speed = this.speed;
    if (sprint && this.stamina > 0 && (dx !== 0 || dy !== 0)) {
      speed = this.sprintSpeed;
      this.stamina = Math.max(0, this.stamina - 0.6);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
    }

    if (dx !== 0 || dy !== 0) {
      this.direction = Math.atan2(dy, dx);
      Physics.move(this, dx * speed, dy * speed, this.radius);
    }

    // Weapon switching
    if (input.keys['Digit1']) { this.currentWeapon = 0; input.keys['Digit1'] = false; }
    if (input.keys['Digit2'] && this.weapons[1]) { this.currentWeapon = 1; input.keys['Digit2'] = false; }
    if (input.keys['Digit3'] && this.weapons[2]) { this.currentWeapon = 2; input.keys['Digit3'] = false; }

    // Attack
    if (input.mouse.down || input.keys['Space']) {
      const angle = Math.atan2(input.mouse.worldY - this.y, input.mouse.worldX - this.x);
      const tx = this.x + Math.cos(angle) * 200;
      const ty = this.y + Math.sin(angle) * 200;
      const result = Weapons.fire(this, tx, ty);
      if (result === 'ranged') {
        this.wantedLevel = Math.min(5, this.wantedLevel + 0.1);
        this.wantedCooldown = 600;
      }
    }

    // Melee
    if (input.keys['KeyF']) {
      input.keys['KeyF'] = false;
      this.meleeSweep();
    }

    // Reload
    if (input.keys['KeyR']) {
      input.keys['KeyR'] = false;
      Weapons.reload(this);
    }

    // Enter vehicle
    if (input.justPressed['KeyE']) {
      input.justPressed['KeyE'] = false;
      this.tryEnterVehicle();
    }

    // Wanted level decay
    if (this.wantedLevel > 0) {
      this.wantedCooldown--;
      if (this.wantedCooldown <= 0) {
        this.wantedLevel = Math.max(0, this.wantedLevel - 0.005);
        if (this.wantedLevel < 0.1) { this.wantedLevel = 0; }
      }
    }

    // Check for shop
    const tile = MAP.tileAt(this.x, this.y);
    if (tile === MAP.T.SHOP && input.justPressed['KeyE']) {
      Shop.open();
    }
  },

  updateInVehicle(input) {
    const v = this.inVehicle;
    if (!v || v.health <= 0) {
      this.exitVehicle();
      return;
    }

    // Exit vehicle
    if (input.justPressed['KeyE']) {
      input.justPressed['KeyE'] = false;
      this.exitVehicle();
      return;
    }

    // Drive
    let dx = 0, dy = 0;
    if (input.keys['KeyW'] || input.keys['ArrowUp'])    dy -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown'])  dy += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft'])  dx -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      v.direction = Math.atan2(dy, dx);
    }

    const speed = v.speed + (input.keys['ShiftLeft'] ? v.boostSpeed : 0);
    Physics.move(v, dx * speed, dy * speed, v.radius, true);

    this.x = v.x;
    this.y = v.y;
  },

  meleeSweep() {
    const range = 45;
    const allTargets = [...Game.npcs, ...Game.police];
    for (const t of allTargets) {
      if (t.dead) continue;
      const dist = Physics.distXY(this.x, this.y, t.x, t.y);
      if (dist < range) {
        t.takeDamage(20, 'player');
        this.wantedLevel = Math.min(5, this.wantedLevel + 0.5);
        this.wantedCooldown = 600;
        Sound.play('melee');
      }
    }
  },

  tryEnterVehicle() {
    const range = 50;
    for (const v of Game.vehicles) {
      if (v.occupant) continue;
      const dist = Physics.distXY(this.x, this.y, v.x, v.y);
      if (dist < range) {
        this.inVehicle = v;
        v.occupant = this;
        this.wantedLevel = Math.min(5, this.wantedLevel + 1);
        this.wantedCooldown = 600;
        UI.notify('VEHICLE STOLEN!', '#FFE000');
        Sound.play('engine');
        return;
      }
    }
  },

  exitVehicle() {
    if (this.inVehicle) {
      this.inVehicle.occupant = null;
      // Place player near vehicle
      this.x = this.inVehicle.x + 30;
      this.y = this.inVehicle.y;
      this.inVehicle = null;
    }
  },

  takeDamage(amount, sourceType) {
    if (this.invincible > 0 || this.dead) return;

    let dmg = amount;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, dmg * 0.5);
      this.armor -= absorbed;
      dmg -= absorbed;
    }

    this.health -= dmg;
    this.flashTimer = 10;
    this.invincible = 20;

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  },

  die() {
    this.dead = true;
    this.inVehicle = null;
    Sound.play('death');
    setTimeout(() => Game.showGameOver(), 1500);
  },

  addWanted(amount) {
    this.wantedLevel = Math.min(5, this.wantedLevel + amount);
    this.wantedCooldown = 600;
  },

  draw(ctx, camera) {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(Game.frame / 3) % 2 === 0) return;

    if (this.inVehicle) return; // drawn by vehicle

    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius, this.radius * 0.8, 4, 0, 0, Math.PI*2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.flashTimer > 0 ? '#FF4444' : '#FFE000';
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI*2);
    ctx.fill();

    // Direction indicator (like pacman mouth)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.arc(sx, sy, this.radius, this.direction - 0.5, this.direction + 0.5);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    const ex = sx + Math.cos(this.direction - 0.3) * 5;
    const ey = sy + Math.sin(this.direction - 0.3) * 5;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.5, 0, Math.PI*2);
    ctx.fill();

    // Weapon indicator
    const wep = this.weapons[this.currentWeapon];
    if (wep && wep.name !== 'FISTS') {
      const def = Weapons.DEFS[wep.name];
      ctx.fillStyle = def.color;
      ctx.fillRect(
        sx + Math.cos(this.direction) * this.radius - 3,
        sy + Math.sin(this.direction) * this.radius - 2,
        12, 4
      );
    }
  }
};
