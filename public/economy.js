// economy.js - Money, Drops, Pickups
const Economy = {
  drops: [],     // { x, y, type, value, label, color, life }
  pickupRadius: 20,

  TYPES: {
    MONEY: 'money',
    AMMO: 'ammo',
    HEALTH: 'health',
    WEAPON: 'weapon',
    ARMOR: 'armor',
  },

  spawnDrop(x, y, type, value, label) {
    const colors = {
      money: '#00FF88',
      ammo: '#FFAA00',
      health: '#FF4466',
      weapon: '#FF8800',
      armor: '#4488FF',
    };
    this.drops.push({
      x, y, type, value, label: label || type.toUpperCase(),
      color: colors[type] || '#fff',
      life: 600, // frames before disappear
      bobOffset: Math.random() * Math.PI * 2,
      id: Math.random()
    });
  },

  spawnNPCDrops(x, y) {
    // Random money
    const money = Math.floor(Math.random() * 96) + 5;
    this.spawnDrop(x, y, this.TYPES.MONEY, money, '$' + money);

    // Random chance for extras
    const r = Math.random();
    if (r < 0.25) {
      this.spawnDrop(x + 20, y, this.TYPES.AMMO, 12, 'AMMO');
    } else if (r < 0.40) {
      this.spawnDrop(x + 20, y, this.TYPES.HEALTH, 25, '+HP');
    } else if (r < 0.45) {
      const weapons = ['PISTOL', 'SHOTGUN', 'SMG'];
      const w = weapons[Math.floor(Math.random() * weapons.length)];
      this.spawnDrop(x + 20, y, this.TYPES.WEAPON, w, w);
    }
  },

  spawnRandomPickups(count) {
    for (let i = 0; i < count; i++) {
      const spawn = MAP.itemSpawns[Math.floor(Math.random() * MAP.itemSpawns.length)];
      if (!spawn) continue;
      const wx = spawn.c * MAP.TILE_SIZE + 16;
      const wy = spawn.r * MAP.TILE_SIZE + 16;
      const r = Math.random();
      if (r < 0.5) {
        const money = Math.floor(Math.random() * 50) + 10;
        this.spawnDrop(wx, wy, this.TYPES.MONEY, money, '$' + money);
      } else if (r < 0.7) {
        this.spawnDrop(wx, wy, this.TYPES.AMMO, 15, 'AMMO');
      } else if (r < 0.85) {
        this.spawnDrop(wx, wy, this.TYPES.HEALTH, 30, '+HP');
      } else if (r < 0.93) {
        this.spawnDrop(wx, wy, this.TYPES.ARMOR, 25, '+AR');
      } else {
        const weapons = ['PISTOL', 'SHOTGUN', 'SMG'];
        const w = weapons[Math.floor(Math.random() * weapons.length)];
        this.spawnDrop(wx, wy, this.TYPES.WEAPON, w, w);
      }
    }
  },

  update(player) {
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      d.life--;
      if (d.life <= 0) { this.drops.splice(i, 1); continue; }

      // Check pickup
      if (Physics.distXY(player.x, player.y, d.x, d.y) < this.pickupRadius) {
        this.collect(player, d);
        this.drops.splice(i, 1);
      }
    }
  },

  collect(player, drop) {
    switch (drop.type) {
      case this.TYPES.MONEY:
        player.money += drop.value;
        UI.notify(`+$${drop.value}`, '#00FF88');
        Sound.play('money');
        break;
      case this.TYPES.AMMO:
        const wep = player.weapons[player.currentWeapon];
        if (wep) {
          wep.ammo += drop.value;
          UI.notify(`+${drop.value} AMMO`, '#FFAA00');
        }
        break;
      case this.TYPES.HEALTH:
        player.health = Math.min(100, player.health + drop.value);
        UI.notify(`+${drop.value} HP`, '#FF4466');
        Sound.play('pickup');
        break;
      case this.TYPES.ARMOR:
        player.armor = Math.min(100, player.armor + drop.value);
        UI.notify(`+${drop.value} ARMOR`, '#4488FF');
        Sound.play('pickup');
        break;
      case this.TYPES.WEAPON:
        Weapons.give(player, drop.value);
        UI.notify(`GOT ${drop.value}`, '#FF8800');
        Sound.play('pickup');
        break;
    }
  },

  draw(ctx, camera) {
    const frame = Game.frame;
    for (const d of this.drops) {
      const sx = d.x - camera.x;
      const sy = d.y - camera.y + Math.sin(frame * 0.05 + d.bobOffset) * 3;

      // Glow
      const alpha = d.life < 60 ? d.life / 60 : 1;
      ctx.globalAlpha = alpha;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(sx, d.y - camera.y + 10, 10, 4, 0, 0, Math.PI*2);
      ctx.fill();

      // Icon circle
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(sx, sy, 9, 0, Math.PI*2);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.label.slice(0,3), sx, sy + 3);

      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }
};
