// missions.js - Mission System
const Missions = {
  current: null,
  completed: 0,
  failed: 0,
  cooldown: 0,
  markers: [],

  TYPES: ['collect_money', 'eliminate_target', 'steal_vehicle', 'escape_police', 'deliver_item'],

  init() {
    this.current = null;
    this.completed = 0;
    this.cooldown = 0;
    this.markers = [];
    setTimeout(() => this.offerMission(), 3000);
  },

  offerMission() {
    if (this.current) return;
    if (Player.dead) return;
    this.generateMission();
  },

  generateMission() {
    const types = this.TYPES;
    const type = types[Math.floor(Math.random() * types.length)];

    switch(type) {
      case 'collect_money':
        this.startCollectMoney();
        break;
      case 'eliminate_target':
        this.startEliminate();
        break;
      case 'steal_vehicle':
        this.startStealVehicle();
        break;
      case 'escape_police':
        this.startEscapePolice();
        break;
      case 'deliver_item':
        this.startDeliver();
        break;
    }
  },

  startCollectMoney() {
    const reward = 200 + Math.floor(Math.random() * 300);
    const count = 3 + Math.floor(Math.random() * 4);
    // Place money markers
    const spawns = [];
    for (let i = 0; i < count; i++) {
      const s = MAP.itemSpawns[Math.floor(Math.random() * MAP.itemSpawns.length)];
      if (s) spawns.push({ x: s.c*MAP.TILE_SIZE+16, y: s.r*MAP.TILE_SIZE+16 });
    }
    this.current = {
      type: 'collect_money',
      title: 'MONEY RUN',
      desc: `Collect ${count} cash bags`,
      reward,
      collected: 0,
      required: count,
      spawns,
      timer: 1800
    };
    this.markers = spawns.map(s => ({ ...s, collected: false, type: 'money' }));
    UI.showMission('MONEY RUN', `Collect cash bags: 0/${count}`);
    UI.notify('NEW MISSION: MONEY RUN', '#FFE000');
  },

  startEliminate() {
    const reward = 400 + Math.floor(Math.random() * 400);
    // Pick a random npc as target or spawn one
    const target = Game.npcs[Math.floor(Math.random() * Game.npcs.length)];
    if (!target) { this.startCollectMoney(); return; }
    target.isTarget = true;
    target.color = '#FF0000';
    this.current = {
      type: 'eliminate_target',
      title: 'ELIMINATE',
      desc: 'Eliminate the red target',
      reward,
      target,
      timer: 2400
    };
    this.markers = [{ x: target.x, y: target.y, type: 'target', entity: target }];
    UI.showMission('ELIMINATE', 'Kill the marked target');
    UI.notify('NEW MISSION: ELIMINATE TARGET', '#FF4422');
  },

  startStealVehicle() {
    const reward = 300 + Math.floor(Math.random() * 300);
    const vehicle = Game.vehicles.filter(v => v.type !== 'police' && !v.occupant)[0];
    if (!vehicle) { this.startCollectMoney(); return; }
    vehicle.missionTarget = true;

    // Delivery point
    const deliverSpawn = MAP.vehicleSpawns[Math.floor(Math.random() * MAP.vehicleSpawns.length)];
    const deliverX = deliverSpawn ? deliverSpawn.c*MAP.TILE_SIZE+16 : 400;
    const deliverY = deliverSpawn ? deliverSpawn.r*MAP.TILE_SIZE+16 : 400;

    this.current = {
      type: 'steal_vehicle',
      title: 'CAR THEFT',
      desc: 'Steal the marked car & deliver it',
      reward,
      vehicle,
      deliverX, deliverY,
      phase: 'steal',
      timer: 3000
    };
    this.markers = [{ x: vehicle.x, y: vehicle.y, type: 'vehicle', entity: vehicle }];
    UI.showMission('CAR THEFT', 'Steal the marked vehicle');
    UI.notify('NEW MISSION: CAR THEFT', '#FFAA00');
  },

  startEscapePolice() {
    const reward = 500;
    Player.addWanted(2);
    this.current = {
      type: 'escape_police',
      title: 'ESCAPE!',
      desc: 'Lose the police',
      reward,
      timer: 3600,
      escapedFor: 0
    };
    this.markers = [];
    UI.showMission('ESCAPE!', 'Escape the police!');
    UI.notify('MISSION: ESCAPE THE COPS!', '#FF0000');
  },

  startDeliver() {
    const reward = 350 + Math.floor(Math.random() * 250);
    const fromSpawn = MAP.npcSpawns[Math.floor(Math.random() * MAP.npcSpawns.length)];
    const toSpawn = MAP.itemSpawns[Math.floor(Math.random() * MAP.itemSpawns.length)];
    if (!fromSpawn || !toSpawn) { this.startCollectMoney(); return; }

    const fx = fromSpawn.c*MAP.TILE_SIZE+16, fy = fromSpawn.r*MAP.TILE_SIZE+16;
    const tx = toSpawn.c*MAP.TILE_SIZE+16, ty = toSpawn.r*MAP.TILE_SIZE+16;

    this.current = {
      type: 'deliver_item',
      title: 'DELIVERY',
      desc: 'Pick up and deliver the package',
      reward,
      fromX: fx, fromY: fy,
      toX: tx, toY: ty,
      phase: 'pickup',
      timer: 2400
    };
    this.markers = [{ x: fx, y: fy, type: 'pickup' }];
    UI.showMission('DELIVERY', 'Pick up the package');
    UI.notify('NEW MISSION: DELIVERY', '#00FFAA');
  },

  update() {
    if (!this.current || Player.dead) return;

    const m = this.current;
    m.timer--;

    // Timer fail
    if (m.timer <= 0) {
      this.failMission('TIME\'S UP!');
      return;
    }

    // Show timer for last 10s
    if (m.timer < 600) {
      const secs = Math.ceil(m.timer / 60);
      UI.updateMission(m.title, `${m.desc} - ${secs}s`);
    }

    switch(m.type) {
      case 'collect_money':
        this.updateCollect(m);
        break;
      case 'eliminate_target':
        this.updateEliminate(m);
        break;
      case 'steal_vehicle':
        this.updateStealVehicle(m);
        break;
      case 'escape_police':
        this.updateEscapePolice(m);
        break;
      case 'deliver_item':
        this.updateDeliver(m);
        break;
    }

    // Update marker positions for moving entities
    for (const marker of this.markers) {
      if (marker.entity) {
        marker.x = marker.entity.x;
        marker.y = marker.entity.y;
      }
    }
  },

  updateCollect(m) {
    for (const marker of this.markers) {
      if (marker.collected) continue;
      const dist = Physics.distXY(Player.x, Player.y, marker.x, marker.y);
      if (dist < 30) {
        marker.collected = true;
        m.collected++;
        Sound.play('money');
        UI.updateMission(m.title, `Collect cash bags: ${m.collected}/${m.required}`);
        if (m.collected >= m.required) this.completeMission();
      }
    }
  },

  updateEliminate(m) {
    if (!m.target || m.target.dead) {
      this.completeMission();
    }
  },

  updateStealVehicle(m) {
    if (m.phase === 'steal') {
      if (Player.inVehicle === m.vehicle) {
        m.phase = 'deliver';
        this.markers = [{ x: m.deliverX, y: m.deliverY, type: 'deliver' }];
        UI.updateMission(m.title, 'Deliver vehicle to marker');
        UI.notify('NOW DELIVER IT!', '#FFE000');
      }
    } else if (m.phase === 'deliver') {
      const dist = Physics.distXY(Player.x, Player.y, m.deliverX, m.deliverY);
      if (dist < 50) this.completeMission();
    }
  },

  updateEscapePolice(m) {
    if (Player.wantedLevel === 0) {
      m.escapedFor++;
      UI.updateMission(m.title, `Stay hidden: ${Math.ceil(m.escapedFor/60)}s/5s`);
      if (m.escapedFor >= 300) this.completeMission();
    } else {
      m.escapedFor = 0;
    }
  },

  updateDeliver(m) {
    if (m.phase === 'pickup') {
      const dist = Physics.distXY(Player.x, Player.y, m.fromX, m.fromY);
      if (dist < 35) {
        m.phase = 'deliver';
        this.markers = [{ x: m.toX, y: m.toY, type: 'deliver' }];
        UI.updateMission(m.title, 'Deliver the package');
        UI.notify('PACKAGE PICKED UP! DELIVER IT!', '#00FFAA');
      }
    } else {
      const dist = Physics.distXY(Player.x, Player.y, m.toX, m.toY);
      if (dist < 35) this.completeMission();
    }
  },

  completeMission() {
    if (!this.current) return;
    const reward = this.current.reward;
    Player.money += reward;
    this.completed++;
    UI.notify(`MISSION COMPLETE! +$${reward}`, '#00FF88');
    Sound.play('money');
    UI.hideMission();
    this.current = null;
    this.markers = [];
    setTimeout(() => this.offerMission(), 5000);
  },

  failMission(reason) {
    this.failed++;
    UI.notify(`MISSION FAILED: ${reason}`, '#FF4422');
    UI.hideMission();
    this.current = null;
    this.markers = [];
    setTimeout(() => this.offerMission(), 5000);
  },

  draw(ctx, camera) {
    const frame = Game.frame;
    for (const marker of this.markers) {
      const sx = marker.x - camera.x;
      const sy = marker.y - camera.y;

      ctx.save();
      const pulse = Math.sin(frame * 0.08) * 5;

      if (marker.type === 'money') {
        ctx.strokeStyle = '#00FF88';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, 18 + pulse, 0, Math.PI*2);
        ctx.stroke();
        if (!marker.collected) {
          ctx.fillStyle = '#00FF88';
          ctx.font = 'bold 14px Orbitron';
          ctx.textAlign = 'center';
          ctx.fillText('$', sx, sy+5);
        }
      } else if (marker.type === 'target') {
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, 20 + pulse, 0, Math.PI*2);
        ctx.stroke();
        // Crosshair
        ctx.beginPath();
        ctx.moveTo(sx-14, sy); ctx.lineTo(sx+14, sy);
        ctx.moveTo(sx, sy-14); ctx.lineTo(sx, sy+14);
        ctx.stroke();
      } else if (marker.type === 'vehicle') {
        ctx.strokeStyle = '#FFE000';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx-20, sy-14, 40, 28);
      } else if (marker.type === 'deliver' || marker.type === 'pickup') {
        ctx.strokeStyle = marker.type === 'pickup' ? '#00FFAA' : '#FFE000';
        ctx.lineWidth = 3;
        // Arrow down
        ctx.beginPath();
        ctx.moveTo(sx, sy - 25 - pulse);
        ctx.lineTo(sx, sy - 5);
        ctx.moveTo(sx - 8, sy - 13);
        ctx.lineTo(sx, sy - 5);
        ctx.lineTo(sx + 8, sy - 13);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI*2);
        ctx.stroke();
      }

      ctx.restore();
    }
    ctx.textAlign = 'left';
  }
};
