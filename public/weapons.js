// weapons.js - Weapons & Bullets System
const Weapons = {
  bullets: [],

  DEFS: {
    FISTS: { name: 'FISTS', ammo: Infinity, maxAmmo: Infinity, damage: 20, range: 45, fireRate: 40, spread: 0, pellets: 1, type: 'melee', color: '#FFE000' },
    PISTOL: { name: 'PISTOL', ammo: 30, maxAmmo: 90, damage: 25, range: 400, fireRate: 20, spread: 0.05, pellets: 1, type: 'ranged', color: '#AAAAAA', bulletSpeed: 8, reload: 60 },
    SHOTGUN: { name: 'SHOTGUN', ammo: 8, maxAmmo: 32, damage: 18, range: 200, fireRate: 50, spread: 0.25, pellets: 6, type: 'ranged', color: '#884400', bulletSpeed: 7, reload: 90 },
    SMG: { name: 'SMG', ammo: 45, maxAmmo: 180, damage: 15, range: 350, fireRate: 8, spread: 0.1, pellets: 1, type: 'ranged', color: '#444488', bulletSpeed: 10, reload: 50 },
  },

  give(player, weaponName) {
    const def = this.DEFS[weaponName];
    if (!def) return;
    const existing = player.weapons.find(w => w.name === weaponName);
    if (existing) {
      existing.ammo = Math.min(existing.maxAmmo, existing.ammo + def.ammo);
    } else {
      player.weapons.push({
        name: def.name, ammo: def.ammo, maxAmmo: def.maxAmmo,
        cooldown: 0, reloading: 0
      });
    }
  },

  fire(shooter, targetX, targetY) {
    const wepData = shooter.weapons[shooter.currentWeapon];
    if (!wepData) return false;
    const def = this.DEFS[wepData.name];
    if (!def) return false;

    if (wepData.cooldown > 0 || wepData.reloading > 0) return false;

    if (def.type === 'melee') {
      // Melee hit
      wepData.cooldown = def.fireRate;
      return 'melee';
    }

    if (wepData.ammo <= 0) {
      wepData.reloading = def.reload;
      UI.notify('RELOADING...', '#FFAA00');
      return false;
    }

    wepData.ammo--;
    wepData.cooldown = def.fireRate;

    const angle = Math.atan2(targetY - shooter.y, targetX - shooter.x);

    for (let p = 0; p < def.pellets; p++) {
      const a = angle + (Math.random() - 0.5) * def.spread;
      this.bullets.push({
        x: shooter.x,
        y: shooter.y,
        vx: Math.cos(a) * def.bulletSpeed,
        vy: Math.sin(a) * def.bulletSpeed,
        damage: def.damage,
        range: def.range,
        traveled: 0,
        owner: shooter.id,
        ownerType: shooter.type,
        color: def.type === 'ranged' ? '#FFE066' : '#fff',
        life: 3,
      });
    }

    Sound.play('shoot');
    return 'ranged';
  },

  reload(player) {
    const wep = player.weapons[player.currentWeapon];
    if (!wep) return;
    const def = this.DEFS[wep.name];
    if (!def || def.type === 'melee') return;
    if (wep.reloading > 0) return;
    wep.reloading = def.reload;
    UI.notify('RELOADING...', '#FFAA00');
  },

  update(entities) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.traveled += Math.sqrt(b.vx*b.vx + b.vy*b.vy);

      // Hit wall
      const t = MAP.tileAt(b.x, b.y);
      if (t === MAP.T.BUILDING || b.traveled > b.range || b.x < 0 || b.y < 0 ||
          b.x > MAP.COLS * MAP.TILE_SIZE || b.y > MAP.ROWS * MAP.TILE_SIZE) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit entities
      let hit = false;
      for (const e of entities) {
        if (e.dead || e.id === b.owner) continue;
        // Don't hit same team
        if (b.ownerType === 'police' && e.type === 'police') continue;
        if (b.ownerType === 'npc' && e.type === 'npc') continue;

        const dist = Physics.distXY(b.x, b.y, e.x, e.y);
        if (dist < (e.radius || 14)) {
          e.takeDamage(b.damage, b.ownerType);
          b.life--;
          if (b.life <= 0) hit = true;
          break;
        }
      }
      if (hit) this.bullets.splice(i, 1);
    }

    // Update weapon cooldowns
    for (const e of entities) {
      if (e.weapons) {
        for (const w of e.weapons) {
          if (w.cooldown > 0) w.cooldown--;
          if (w.reloading > 0) {
            w.reloading--;
            if (w.reloading === 0) UI.notify('LOADED!', '#00FF88');
          }
        }
      }
    }
  },

  draw(ctx, camera) {
    for (const b of this.bullets) {
      const sx = b.x - camera.x;
      const sy = b.y - camera.y;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI*2);
      ctx.fill();
      // Trail
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - b.vx*3, sy - b.vy*3);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
};
