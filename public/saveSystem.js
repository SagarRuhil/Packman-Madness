// saveSystem.js - Save/Load using localStorage
const SaveSystem = {
  KEY: 'pacman_gta_save',

  save() {
    try {
      const data = {
        money: Player.money,
        health: Player.health,
        armor: Player.armor,
        weapons: Player.weapons.map(w => ({ name: w.name, ammo: w.ammo === Infinity ? -1 : w.ammo })),
        kills: Player.kills,
        completed: Missions.completed,
        x: Player.x,
        y: Player.y,
        ts: Date.now()
      };
      localStorage.setItem(this.KEY, JSON.stringify(data));
      UI.notify('GAME SAVED', '#00FF88');
    } catch(e) {
      console.warn('Save failed:', e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return false;
      return JSON.parse(raw);
    } catch(e) {
      return false;
    }
  },

  hasSave() {
    return !!localStorage.getItem(this.KEY);
  },

  applySave(data) {
    if (!data) return;
    Player.money = data.money || 500;
    Player.health = data.health || 100;
    Player.armor = data.armor || 0;
    Player.kills = data.kills || 0;
    Missions.completed = data.completed || 0;
    if (data.x && data.y) { Player.x = data.x; Player.y = data.y; }
    if (data.weapons) {
      Player.weapons = [];
      for (const w of data.weapons) {
        const def = Weapons.DEFS[w.name];
        if (def) {
          Player.weapons.push({
            name: w.name,
            ammo: w.ammo === -1 ? Infinity : w.ammo,
            maxAmmo: def.maxAmmo,
            cooldown: 0, reloading: 0
          });
        }
      }
      if (Player.weapons.length === 0) {
        Player.weapons = [{ name: 'FISTS', ammo: Infinity, maxAmmo: Infinity, cooldown: 0, reloading: 0 }];
      }
    }
  },

  clear() {
    localStorage.removeItem(this.KEY);
  }
};
