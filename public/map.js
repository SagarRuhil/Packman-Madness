// map.js - City Grid Map System
const MAP = {
  TILE_SIZE: 32,
  COLS: 80,
  ROWS: 60,

  // Tile types
  T: {
    ROAD: 0,
    BUILDING: 1,
    SIDEWALK: 2,
    PARK: 3,
    PARKING: 4,
    ALLEY: 5,
    SHOP: 6,
  },

  grid: [],
  itemSpawns: [],
  vehicleSpawns: [],
  npcSpawns: [],

  init() {
    this.generateCity();
    this.placeSpawns();
  },

  generateCity() {
    const { COLS, ROWS, T } = this;
    // Fill with buildings
    this.grid = [];
    for (let r = 0; r < ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        this.grid[r][c] = T.BUILDING;
      }
    }

    // Main roads (horizontal)
    const hRoads = [0, 1, 8, 9, 18, 19, 28, 29, 38, 39, 48, 49, 58, 59];
    // Main roads (vertical)
    const vRoads = [0, 1, 10, 11, 22, 23, 34, 35, 46, 47, 58, 59, 70, 71, 78, 79];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (hRoads.includes(r) || vRoads.includes(c)) {
          this.grid[r][c] = T.ROAD;
        }
      }
    }

    // Sidewalks adjacent to roads
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c] === T.BUILDING) {
          // Check adjacency to road
          const adjacent = [
            [r-1,c],[r+1,c],[r,c-1],[r,c+1]
          ];
          for (const [nr, nc] of adjacent) {
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              if (this.grid[nr][nc] === T.ROAD) {
                this.grid[r][c] = T.SIDEWALK;
                break;
              }
            }
          }
        }
      }
    }

    // Parks (green areas in some blocks)
    const parkBlocks = [
      [3, 3, 5, 7], [3, 25, 5, 8], [3, 50, 5, 6],
      [12, 13, 5, 8], [12, 36, 5, 7],
      [22, 3, 5, 6], [22, 25, 4, 9], [22, 50, 5, 7],
      [32, 13, 4, 7], [32, 36, 5, 8],
      [42, 3, 5, 7], [42, 25, 5, 6], [42, 50, 4, 7],
      [52, 13, 5, 8], [52, 36, 4, 6],
    ];
    for (const [row, col, h, w] of parkBlocks) {
      for (let r = row; r < row + h && r < ROWS; r++) {
        for (let c = col; c < col + w && c < COLS; c++) {
          if (this.grid[r][c] === T.BUILDING || this.grid[r][c] === T.SIDEWALK) {
            this.grid[r][c] = T.PARK;
          }
        }
      }
    }

    // Alleys (narrow passages through building blocks)
    const alleys = [
      { r: 5, c1: 2, c2: 9 },
      { r: 14, c1: 12, c2: 21 },
      { r: 25, c1: 24, c2: 33 },
      { r: 35, c1: 35, c2: 45 },
      { r: 44, c1: 48, c2: 57 },
      { r: 55, c1: 2, c2: 9 },
    ];
    for (const a of alleys) {
      for (let c = a.c1; c <= a.c2 && c < COLS; c++) {
        if (this.grid[a.r] && this.grid[a.r][c] !== T.ROAD) {
          this.grid[a.r][c] = T.ALLEY;
        }
      }
    }
    // Vertical alleys
    const valleys = [
      { c: 7, r1: 2, r2: 7 },
      { c: 19, r1: 10, r2: 17 },
      { c: 31, r1: 20, r2: 27 },
      { c: 43, r1: 30, r2: 37 },
      { c: 55, r1: 40, r2: 47 },
      { c: 67, r1: 50, r2: 57 },
    ];
    for (const a of valleys) {
      for (let r = a.r1; r <= a.r2 && r < ROWS; r++) {
        if (this.grid[r][a.c] !== T.ROAD) {
          this.grid[r][a.c] = T.ALLEY;
        }
      }
    }

    // Parking lots
    const parkingBlocks = [
      [3, 13, 3, 8], [20, 3, 3, 6],
      [30, 25, 3, 8], [40, 50, 3, 6],
      [50, 13, 3, 7], [12, 50, 3, 7],
    ];
    for (const [row, col, h, w] of parkingBlocks) {
      for (let r = row; r < row + h && r < ROWS; r++) {
        for (let c = col; c < col + w && c < COLS; c++) {
          if (this.grid[r][c] === T.BUILDING || this.grid[r][c] === T.SIDEWALK) {
            this.grid[r][c] = T.PARKING;
          }
        }
      }
    }

    // Shops (special buildings on road corners)
    const shopPos = [
      [2, 12], [2, 24], [2, 36], [2, 48], [2, 60],
      [10, 12], [10, 36], [10, 60],
      [20, 12], [20, 24], [20, 48],
      [30, 24], [30, 36], [30, 60],
      [40, 12], [40, 36], [40, 48],
      [50, 24], [50, 48], [50, 60],
    ];
    for (const [r, c] of shopPos) {
      if (this.grid[r] && this.grid[r][c] !== T.ROAD) {
        this.grid[r][c] = T.SHOP;
      }
    }
  },

  placeSpawns() {
    const { COLS, ROWS, T } = this;
    this.itemSpawns = [];
    this.vehicleSpawns = [];
    this.npcSpawns = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = this.grid[r][c];
        if (t === T.ROAD || t === T.ALLEY || t === T.PARKING) {
          if (Math.random() < 0.015) this.itemSpawns.push({ r, c });
          if (t === T.PARKING && Math.random() < 0.3) this.vehicleSpawns.push({ r, c });
          if ((t === T.ROAD) && Math.random() < 0.012) this.npcSpawns.push({ r, c });
        }
        if (t === T.SIDEWALK && Math.random() < 0.008) {
          this.npcSpawns.push({ r, c });
        }
      }
    }
  },

  isWalkable(r, c) {
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return false;
    const t = this.grid[r][c];
    return t !== this.T.BUILDING;
  },

  isDrivable(r, c) {
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return false;
    const t = this.grid[r][c];
    return t === this.T.ROAD || t === this.T.ALLEY || t === this.T.PARKING;
  },

  tileAt(worldX, worldY) {
    const c = Math.floor(worldX / this.TILE_SIZE);
    const r = Math.floor(worldY / this.TILE_SIZE);
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return this.T.BUILDING;
    return this.grid[r][c];
  },

  tileRC(r, c) {
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return this.T.BUILDING;
    return this.grid[r][c];
  },

  worldToTile(worldX, worldY) {
    return {
      c: Math.floor(worldX / this.TILE_SIZE),
      r: Math.floor(worldY / this.TILE_SIZE)
    };
  },

  tileToWorld(r, c) {
    return {
      x: c * this.TILE_SIZE + this.TILE_SIZE / 2,
      y: r * this.TILE_SIZE + this.TILE_SIZE / 2
    };
  },

  getColor(tileType) {
    switch (tileType) {
      case this.T.ROAD:     return '#2a2a2a';
      case this.T.BUILDING: return '#1a1a2e';
      case this.T.SIDEWALK: return '#3a3a4a';
      case this.T.PARK:     return '#1a3a1a';
      case this.T.PARKING:  return '#2a2a1a';
      case this.T.ALLEY:    return '#222230';
      case this.T.SHOP:     return '#1a2a3a';
      default:              return '#111';
    }
  },

  draw(ctx, camera) {
    const { TILE_SIZE, COLS, ROWS } = this;
    const startC = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const startR = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endC = Math.min(COLS, startC + Math.ceil(camera.w / TILE_SIZE) + 2);
    const endR = Math.min(ROWS, startR + Math.ceil(camera.h / TILE_SIZE) + 2);

    for (let r = startR; r < endR; r++) {
      for (let c = startC; c < endC; c++) {
        const t = this.grid[r][c];
        const sx = c * TILE_SIZE - camera.x;
        const sy = r * TILE_SIZE - camera.y;

        ctx.fillStyle = this.getColor(t);
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        // Details
        if (t === this.T.ROAD) {
          // Road markings
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          if (r % 4 === 0) ctx.fillRect(sx + 14, sy, 4, TILE_SIZE);
          if (c % 4 === 0) ctx.fillRect(sx, sy + 14, TILE_SIZE, 4);
        } else if (t === this.T.BUILDING) {
          // Building windows
          ctx.fillStyle = 'rgba(255,220,100,0.12)';
          ctx.fillRect(sx + 5, sy + 5, 8, 7);
          ctx.fillRect(sx + 19, sy + 5, 8, 7);
          ctx.fillRect(sx + 5, sy + 18, 8, 7);
          ctx.fillRect(sx + 19, sy + 18, 8, 7);
        } else if (t === this.T.PARK) {
          // Park details
          ctx.fillStyle = 'rgba(0,200,80,0.15)';
          ctx.fillRect(sx+2, sy+2, TILE_SIZE-4, TILE_SIZE-4);
          if ((r+c) % 5 === 0) {
            ctx.fillStyle = 'rgba(0,150,50,0.4)';
            ctx.beginPath();
            ctx.arc(sx+16, sy+16, 6, 0, Math.PI*2);
            ctx.fill();
          }
        } else if (t === this.T.SHOP) {
          // Shop sign
          ctx.fillStyle = 'rgba(255,200,0,0.3)';
          ctx.fillRect(sx+4, sy+4, TILE_SIZE-8, 8);
          ctx.fillStyle = 'rgba(255,200,0,0.6)';
          ctx.fillRect(sx+8, sy+6, TILE_SIZE-16, 4);
        } else if (t === this.T.PARKING) {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(sx+2, sy+2, TILE_SIZE-4, TILE_SIZE-4);
          ctx.fillStyle = 'rgba(255,255,150,0.15)';
          ctx.fillRect(sx+14, sy+2, 4, TILE_SIZE-4);
        }

        // Grid lines subtle
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
      }
    }
  },

  drawMinimap(ctx, w, h, entities) {
    const scaleX = w / (this.COLS * this.TILE_SIZE);
    const scaleY = h / (this.ROWS * this.TILE_SIZE);

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const t = this.grid[r][c];
        if (t === this.T.ROAD || t === this.T.ALLEY || t === this.T.PARKING) {
          ctx.fillStyle = '#333';
        } else if (t === this.T.PARK) {
          ctx.fillStyle = '#1a3a1a';
        } else {
          continue;
        }
        ctx.fillRect(c * scaleX * this.TILE_SIZE, r * scaleY * this.TILE_SIZE,
          this.TILE_SIZE * scaleX + 0.5, this.TILE_SIZE * scaleY + 0.5);
      }
    }
  }
};
