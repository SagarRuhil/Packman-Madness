// game.js - Core Game Loop & State
const Game = {
  canvas: null,
  ctx: null,
  miniCtx: null,
  running: false,
  paused: false,
  frame: 0,
  state: 'loading', // loading, menu, playing, gameover

  // Entity collections
  npcs: [],
  police: [],
  vehicles: [],

  // Camera
  camera: { x: 0, y: 0, w: 0, h: 0 },

  // Input
  input: {
    keys: {},
    justPressed: {},
    mouse: { x: 0, y: 0, worldX: 0, worldY: 0, down: false }
  },

  // Auto-save timer
  saveTimer: 0,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupInput();
    this.startLoading();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.w = this.canvas.width;
    this.camera.h = this.canvas.height;
  },

  setupInput() {
    window.addEventListener('keydown', (e) => {
      if (!this.input.keys[e.code]) {
        this.input.justPressed[e.code] = true;
      }
      this.input.keys[e.code] = true;
      // Minimap toggle
      if (e.code === 'KeyM' && this.state === 'playing') {
        UI.toggleMinimap();
      }
      // Quick save
      if (e.code === 'KeyP' && this.state === 'playing') {
        SaveSystem.save();
      }
      e.preventDefault();
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.input.mouse.x = e.clientX;
      this.input.mouse.y = e.clientY;
      this.input.mouse.worldX = e.clientX + this.camera.x;
      this.input.mouse.worldY = e.clientY + this.camera.y;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.input.mouse.down = true;
      Sound.resume();
    });

    this.canvas.addEventListener('mouseup', () => {
      this.input.mouse.down = false;
    });
  },

  startLoading() {
    this.state = 'loading';
    const bar = document.getElementById('loading-bar');
    const tip = document.getElementById('loading-tip');
    const tips = [
      'Generating city grid...',
      'Spawning vehicles...',
      'Recruiting officers...',
      'Placing NPCs...',
      'Arming criminals...',
      'City is ready.'
    ];
    let progress = 0;
    let step = 0;

    const doLoad = () => {
      progress += Math.random() * 20 + 5;
      if (progress > 100) progress = 100;
      bar.style.width = progress + '%';
      if (step < tips.length) { tip.textContent = tips[step++]; }

      if (progress < 100) {
        setTimeout(doLoad, 150 + Math.random() * 100);
      } else {
        setTimeout(() => this.showMenu(), 400);
      }
    };
    doLoad();
  },

  showMenu() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
    this.state = 'menu';

    // Update continue button
    const loadBtn = document.getElementById('btn-load-game');
    if (SaveSystem.hasSave()) {
      loadBtn.style.borderColor = 'rgba(255,255,255,0.5)';
      loadBtn.style.color = 'rgba(255,255,255,0.7)';
    }
  },

  startNewGame() {
    document.getElementById('start-screen').style.display = 'none';
    this.initWorld();
    Player.init(MAP.COLS * MAP.TILE_SIZE / 2, MAP.ROWS * MAP.TILE_SIZE / 2);
    this.state = 'playing';
    UI.init();
    Missions.init();
    Sound.init();
    this.running = true;
    requestAnimationFrame(() => this.loop());
    UI.notify('WELCOME TO THE CITY', '#FFE000');
  },

  continueGame() {
    const save = SaveSystem.load();
    if (!save) { this.startNewGame(); return; }
    document.getElementById('start-screen').style.display = 'none';
    this.initWorld();
    Player.init(save.x || MAP.COLS * MAP.TILE_SIZE / 2, save.y || MAP.ROWS * MAP.TILE_SIZE / 2);
    SaveSystem.applySave(save);
    this.state = 'playing';
    UI.init();
    Missions.init();
    Sound.init();
    this.running = true;
    requestAnimationFrame(() => this.loop());
    UI.notify('WELCOME BACK', '#00FF88');
  },

  initWorld() {
    MAP.init();
    VehicleManager.init();
    NPCManager.init();
    Police.init();
    Economy.spawnRandomPickups(50);
    Weapons.bullets = [];
    Economy.drops = [];
  },

  loop() {
    if (!this.running) return;
    if (!this.paused) {
      this.update();
      this.render();
    }
    requestAnimationFrame(() => this.loop());
  },

  update() {
    if (this.state !== 'playing' || Player.dead) return;
    this.frame++;

    // Update player
    Player.update(this.input);

    // Camera follow
    this.camera.x = Player.x - this.camera.w / 2;
    this.camera.y = Player.y - this.camera.h / 2;
    this.camera.x = Math.max(0, Math.min(MAP.COLS * MAP.TILE_SIZE - this.camera.w, this.camera.x));
    this.camera.y = Math.max(0, Math.min(MAP.ROWS * MAP.TILE_SIZE - this.camera.h, this.camera.y));

    // Update systems
    NPCManager.update();
    VehicleManager.update();
    Police.update();
    Missions.update();

    // Weapons (pass all entities that can be hit)
    const allEntities = [Player, ...this.npcs, ...this.police];
    Weapons.update(allEntities);

    Economy.update(Player);

    // UI
    UI.update(Player);

    // Auto-save every 30 seconds
    this.saveTimer++;
    if (this.saveTimer > 1800) {
      this.saveTimer = 0;
      SaveSystem.save();
    }

    // Clear justPressed
    this.input.justPressed = {};
  },

  render() {
    const { ctx, camera } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Map
    MAP.draw(ctx, camera);

    // Economy drops
    Economy.draw(ctx, camera);

    // Vehicles
    VehicleManager.draw(ctx, camera);

    // NPCs
    NPCManager.draw(ctx, camera);

    // Police
    Police.draw(ctx, camera);

    // Player
    Player.draw(ctx, camera);

    // Bullets
    Weapons.draw(ctx, camera);

    // Mission markers
    Missions.draw(ctx, camera);

    // Shop zone indicators
    this.drawShopZones(ctx, camera);

    // Debug: frame counter (optional)
    // ctx.fillStyle = 'rgba(255,255,255,0.2)';
    // ctx.font = '10px monospace';
    // ctx.fillText(`FPS: ${Math.round(1000/16)}`, 10, this.canvas.height - 10);
  },

  drawShopZones(ctx, camera) {
    // Highlight nearby shop tiles
    const pr = Math.floor(Player.y / MAP.TILE_SIZE);
    const pc = Math.floor(Player.x / MAP.TILE_SIZE);
    for (let r = pr-2; r <= pr+2; r++) {
      for (let c = pc-2; c <= pc+2; c++) {
        if (MAP.tileRC(r, c) === MAP.T.SHOP) {
          const sx = c * MAP.TILE_SIZE - camera.x;
          const sy = r * MAP.TILE_SIZE - camera.y;
          const dist = Physics.distXY(Player.x, Player.y, c*MAP.TILE_SIZE+16, r*MAP.TILE_SIZE+16);
          if (dist < 60) {
            ctx.strokeStyle = 'rgba(255,200,0,0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, MAP.TILE_SIZE, MAP.TILE_SIZE);
            ctx.fillStyle = 'rgba(255,200,0,0.1)';
            ctx.fillRect(sx, sy, MAP.TILE_SIZE, MAP.TILE_SIZE);
            // Label
            ctx.fillStyle = '#FFE000';
            ctx.font = '9px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('[E] SHOP', sx + MAP.TILE_SIZE/2, sy + MAP.TILE_SIZE/2 + 3);
            ctx.textAlign = 'left';
          }
        }
      }
    }
  },

  showGameOver() {
    this.state = 'gameover';
    const screen = document.getElementById('gameover-screen');
    screen.style.display = 'flex';
    document.getElementById('gameover-stats').innerHTML = `
      Money: $${Player.money.toLocaleString()}<br>
      Kills: ${Player.kills}<br>
      Missions completed: ${Missions.completed}<br>
      Wanted Level: ${Math.ceil(Player.wantedLevel)}★
    `;
  },

  respawn() {
    document.getElementById('gameover-screen').style.display = 'none';
    const fine = 100;
    Player.money = Math.max(0, Player.money - fine);
    Player.health = 100;
    Player.armor = 0;
    Player.dead = false;
    Player.wantedLevel = 0;
    Player.wantedCooldown = 0;
    // Place back at spawn
    const start = MAP.tileToWorld(Math.floor(MAP.ROWS/2), Math.floor(MAP.COLS/2));
    Player.x = start.x;
    Player.y = start.y;
    // Clear police
    Police.officers = [];
    Game.police = [];
    this.state = 'playing';
    UI.notify(`RESPAWNED — $${fine} FINE`, '#FF4422');
  }
};
