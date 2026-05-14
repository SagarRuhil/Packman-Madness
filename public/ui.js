// ui.js - HUD, Notifications, Shop
const UI = {
  minimapVisible: true,
  notifQueue: [],

  init() {
    document.getElementById('hud').style.display = 'block';
    this.minimapVisible = true;
    document.getElementById('minimap-container').style.display = 'block';
    this.setupShop();
  },

  update(player) {
    // Health
    const hp = document.getElementById('bar-health');
    const ar = document.getElementById('bar-armor');
    if (hp) hp.style.width = player.health + '%';
    if (ar) ar.style.width = player.armor + '%';

    // Change color at low hp
    if (hp) {
      hp.style.background = player.health > 50
        ? 'linear-gradient(90deg, #FF2244, #ff6644)'
        : 'linear-gradient(90deg, #FF0000, #FF4400)';
    }

    // Money
    const moneyEl = document.getElementById('hud-money');
    if (moneyEl) moneyEl.textContent = player.money.toLocaleString();

    // Wanted stars
    const level = Math.ceil(player.wantedLevel);
    for (let i = 1; i <= 5; i++) {
      const star = document.getElementById('star' + i);
      if (star) {
        star.classList.toggle('active', i <= level);
        star.classList.toggle('flashing', i === level && level > 0 && player.wantedLevel > 0);
      }
    }

    // Weapon
    const wep = player.weapons[player.currentWeapon];
    const weapName = document.getElementById('weapon-name');
    const ammoEl = document.getElementById('ammo-display');
    if (wep && weapName) {
      weapName.textContent = wep.name;
      if (wep.ammo === Infinity) {
        ammoEl.textContent = '';
      } else if (wep.reloading > 0) {
        ammoEl.textContent = 'RELOADING...';
      } else {
        const def = Weapons.DEFS[wep.name];
        ammoEl.textContent = `${wep.ammo} / ${def ? Math.floor((wep.maxAmmo - wep.ammo)/10)*10 : '?'}`;
      }
    }

    // Minimap toggle
    if (this.minimapVisible) this.drawMinimap(player);
  },

  drawMinimap(player) {
    const canvas = document.getElementById('minimapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Draw map
    MAP.drawMinimap(ctx, w, h);

    const scaleX = w / (MAP.COLS * MAP.TILE_SIZE);
    const scaleY = h / (MAP.ROWS * MAP.TILE_SIZE);

    // Draw NPCs
    ctx.fillStyle = '#FF8888';
    for (const n of Game.npcs) {
      if (n.dead) continue;
      ctx.beginPath();
      ctx.arc(n.x * scaleX, n.y * scaleY, 1.5, 0, Math.PI*2);
      ctx.fill();
    }

    // Draw police
    ctx.fillStyle = '#4488FF';
    for (const p of Game.police) {
      if (p.dead) continue;
      ctx.beginPath();
      ctx.arc(p.x * scaleX, p.y * scaleY, 2, 0, Math.PI*2);
      ctx.fill();
    }

    // Draw vehicles
    ctx.fillStyle = '#AAAAAA';
    for (const v of Game.vehicles) {
      if (v.exploding) continue;
      ctx.fillRect(v.x*scaleX - 2, v.y*scaleY - 1.5, 4, 3);
    }

    // Mission markers
    ctx.fillStyle = '#FFE000';
    for (const m of Missions.markers) {
      ctx.beginPath();
      ctx.arc(m.x * scaleX, m.y * scaleY, 2.5, 0, Math.PI*2);
      ctx.fill();
    }

    // Player
    ctx.fillStyle = '#FFE000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(player.x * scaleX, player.y * scaleY, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    // Camera view rectangle
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Game.camera.x * scaleX, Game.camera.y * scaleY,
      Game.camera.w * scaleX, Game.camera.h * scaleY
    );
  },

  toggleMinimap() {
    this.minimapVisible = !this.minimapVisible;
    document.getElementById('minimap-container').style.display =
      this.minimapVisible ? 'block' : 'none';
  },

  notify(text, color = '#FFE000') {
    const area = document.getElementById('notification-area');
    if (!area) return;
    const el = document.createElement('div');
    el.className = 'notification';
    el.style.color = color;
    el.textContent = text;
    area.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  },

  showMission(title, obj) {
    const md = document.getElementById('mission-display');
    const mt = document.getElementById('mission-title');
    const mo = document.getElementById('mission-obj');
    if (md) md.style.display = 'block';
    if (mt) mt.textContent = title;
    if (mo) mo.textContent = obj;
  },

  updateMission(title, obj) {
    const mt = document.getElementById('mission-title');
    const mo = document.getElementById('mission-obj');
    if (mt) mt.textContent = title;
    if (mo) mo.textContent = obj;
  },

  hideMission() {
    const md = document.getElementById('mission-display');
    if (md) md.style.display = 'none';
  },

  setupShop() {
    const closeBtn = document.getElementById('shop-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => Shop.close());
    }
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && document.getElementById('shop-modal').style.display !== 'none') {
        Shop.close();
      }
    });
  }
};

const Shop = {
  isOpen: false,
  items: [
    { name: 'PISTOL', price: 150, type: 'weapon', value: 'PISTOL' },
    { name: 'SHOTGUN', price: 350, type: 'weapon', value: 'SHOTGUN' },
    { name: 'SMG', price: 500, type: 'weapon', value: 'SMG' },
    { name: 'PISTOL AMMO x30', price: 60, type: 'ammo', weapon: 'PISTOL', value: 30 },
    { name: 'SHOTGUN AMMO x8', price: 80, type: 'ammo', weapon: 'SHOTGUN', value: 8 },
    { name: 'SMG AMMO x45', price: 90, type: 'ammo', weapon: 'SMG', value: 45 },
    { name: 'HEALTH PACK', price: 100, type: 'health', value: 50 },
    { name: 'ARMOR VEST', price: 200, type: 'armor', value: 50 },
  ],

  open() {
    this.isOpen = true;
    Game.paused = true;
    const modal = document.getElementById('shop-modal');
    modal.style.display = 'flex';
    this.renderItems();
  },

  close() {
    this.isOpen = false;
    Game.paused = false;
    document.getElementById('shop-modal').style.display = 'none';
  },

  renderItems() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    for (const item of this.items) {
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <span class="shop-item-name">${item.name}</span>
        <span class="shop-item-price">$${item.price}</span>
        <button onclick="Shop.buy('${item.name}')">BUY</button>
      `;
      container.appendChild(div);
    }
  },

  buy(itemName) {
    const item = this.items.find(i => i.name === itemName);
    if (!item) return;
    if (Player.money < item.price) {
      UI.notify('NOT ENOUGH MONEY!', '#FF4422');
      return;
    }
    Player.money -= item.price;
    Sound.play('money');
    switch(item.type) {
      case 'weapon':
        Weapons.give(Player, item.value);
        UI.notify(`BOUGHT ${item.name}`, '#FFE000');
        break;
      case 'ammo':
        const wep = Player.weapons.find(w => w.name === item.weapon);
        if (wep) wep.ammo = Math.min(wep.maxAmmo, wep.ammo + item.value);
        UI.notify(`BOUGHT ${item.name}`, '#FFAA00');
        break;
      case 'health':
        Player.health = Math.min(100, Player.health + item.value);
        UI.notify(`+${item.value} HP`, '#FF4466');
        break;
      case 'armor':
        Player.armor = Math.min(100, Player.armor + item.value);
        UI.notify(`+${item.value} ARMOR`, '#4488FF');
        break;
    }
    this.renderItems();
  }
};
