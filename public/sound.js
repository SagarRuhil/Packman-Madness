// sound.js - Web Audio API Sound System
const Sound = {
  ctx: null,
  enabled: true,
  volume: 0.3,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      console.warn('Web Audio not available');
      this.enabled = false;
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  play(soundName) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    try {
      switch(soundName) {
        case 'shoot':        this.synthShoot(); break;
        case 'police_shoot': this.synthPoliceShoot(); break;
        case 'melee':        this.synthMelee(); break;
        case 'money':        this.synthMoney(); break;
        case 'pickup':       this.synthPickup(); break;
        case 'engine':       this.synthEngine(); break;
        case 'siren':        this.synthSiren(); break;
        case 'explosion':    this.synthExplosion(); break;
        case 'npc_death':    this.synthNPCDeath(); break;
        case 'death':        this.synthDeath(); break;
      }
    } catch(e) {}
  },

  makeOsc(type, freq, gainVal, duration, startTime) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(gainVal * this.volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
    return { osc, gain };
  },

  synthShoot() {
    const t = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/data.length, 2);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
  },

  synthPoliceShoot() {
    const t = this.ctx.currentTime;
    this.makeOsc('square', 300, 0.3, 0.1, t);
  },

  synthMelee() {
    const t = this.ctx.currentTime;
    this.makeOsc('sawtooth', 80, 0.5, 0.15, t);
  },

  synthMoney() {
    const t = this.ctx.currentTime;
    this.makeOsc('sine', 880, 0.3, 0.08, t);
    this.makeOsc('sine', 1100, 0.3, 0.08, t + 0.08);
    this.makeOsc('sine', 1320, 0.3, 0.08, t + 0.16);
  },

  synthPickup() {
    const t = this.ctx.currentTime;
    this.makeOsc('sine', 660, 0.3, 0.1, t);
    this.makeOsc('sine', 880, 0.2, 0.1, t + 0.08);
  },

  synthEngine() {
    const t = this.ctx.currentTime;
    this.makeOsc('sawtooth', 55, 0.4, 0.3, t);
    this.makeOsc('sawtooth', 110, 0.2, 0.3, t);
  },

  synthSiren() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.5);
    osc.frequency.linearRampToValueAtTime(800, t + 1.0);
    gain.gain.setValueAtTime(this.volume * 0.2, t);
    gain.gain.setValueAtTime(this.volume * 0.2, t + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc.start(t);
    osc.stop(t + 1.0);
  },

  synthExplosion() {
    const t = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.6, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/data.length, 1.5);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume, t);
    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
  },

  synthNPCDeath() {
    const t = this.ctx.currentTime;
    this.makeOsc('sine', 200, 0.4, 0.3, t);
    this.makeOsc('sine', 150, 0.3, 0.3, t + 0.1);
  },

  synthDeath() {
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      this.makeOsc('sawtooth', 200 - i*30, 0.4, 0.4, t + i*0.2);
    }
  }
};
