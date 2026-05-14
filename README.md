# 🎮 PACMAN GTA

Here is the Live Link https://packman-madness.vercel.app/
A Pac-Man style top-down open-world crime game built with vanilla HTML5/CSS/JS + Node.js.

## 🚀 Quick Start

```bash
npm install
npm start
```

Then open: **http://localhost:3000**

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `WASD` / Arrow Keys | Move |
| `SHIFT` | Sprint |
| `E` | Enter/Exit vehicle · Open shop (near yellow shop tiles) |
| `SPACE` / Left Click | Shoot (aim with mouse) |
| `F` | Melee attack |
| `R` | Reload |
| `1` / `2` / `3` | Switch weapons |
| `M` | Toggle minimap |
| `P` | Quick save |
| `ESC` | Close shop |

---

## 🗺️ Game Features

### City Map
- Large 80×60 tile grid city with roads, buildings, alleys, parks, and parking lots
- Yellow-highlighted **shop tiles** (Ammu-Nation) where you can buy weapons, ammo, health, and armor
- Random item pickups scattered around the city

### Player
- Health & Armor system
- Sprint stamina
- 3 weapons: Fists, Pistol, Shotgun, SMG
- Vehicle entry/exit

### NPCs
- 40+ pedestrians wandering the city
- They run away when threatened or when wanted level is high
- Drop cash ($5–$100), ammo, or health packs when killed

### Police (Wanted System ⭐)
| Stars | Behavior |
|-------|----------|
| ⭐ | Police officers on foot |
| ⭐⭐ | Police cars deployed |
| ⭐⭐⭐+ | Backup called, more units |
| ⭐⭐⭐⭐⭐ | Maximum heat |

Crimes: shooting, killing NPCs, stealing vehicles

Wanted level decays if you stay out of sight.

### Vehicles
- 20 vehicles spawn in parking lots
- Enter with `E`, drive with WASD
- Vehicles take damage, smoke, and explode
- Police cars have flashing lights and sirens

### Missions (auto-generated)
- **Money Run** — collect cash bags
- **Eliminate** — kill the marked red target
- **Car Theft** — steal and deliver a vehicle
- **Escape!** — lose the cops
- **Delivery** — pick up and deliver a package

### Economy
- Earn money from NPC drops, pickups, and missions
- Spend at shops: weapons ($150–$500), ammo, health packs, armor

### Save System
- Auto-saves every 30 seconds
- Manual save with `P`
- Continue from the main menu

---

## 📁 Project Structure

```
pacman-gta/
├── server.js          # Express server
├── package.json
├── README.md
└── public/
    ├── index.html     # Game shell + HUD
    ├── style.css      # UI styling
    ├── main.js        # Entry point
    ├── game.js        # Game loop & state
    ├── map.js         # City grid generation
    ├── physics.js     # Collision detection
    ├── player.js      # Player entity
    ├── npc.js         # NPC pedestrians
    ├── vehicle.js     # Vehicle system
    ├── police.js      # Police & wanted system
    ├── ai.js          # AI utilities
    ├── missions.js    # Mission system
    ├── weapons.js     # Weapons & bullets
    ├── economy.js     # Money, drops, pickups
    ├── sound.js       # Web Audio API sounds
    ├── ui.js          # HUD, minimap, shop, notifications
    └── saveSystem.js  # localStorage save/load
```

---

## 🎨 Style

- Pac-Man inspired top-down Pac-Man character (yellow circle with mouth)
- GTA-style gameplay: crime, police, missions, vehicles
- Dark neon aesthetic with Orbitron font
- Fully procedurally generated city — different every playthrough (seeded by layout)

---

## ⚙️ Tech Stack

- **Frontend**: HTML5 Canvas, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js + Express (static file server)
- **Audio**: Web Audio API (synthesized sounds, no external files needed)
- **Storage**: localStorage for save data
