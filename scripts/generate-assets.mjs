import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import {
  WORLD_W,
  FLOOR_H,
  WALK_Y,
  FLOORS,
  ROOM_X,
  ROOM_W,
  KEY_X,
  DOOR_X,
  stairX,
} from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'assets');

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const data = new Uint8ClampedArray(w * h * 4);
  const canvas = {
    w,
    h,
    data,
    set(x, y, r, g, b, a = 255) {
      x |= 0;
      y |= 0;
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4;
      if (a >= 255) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
        return;
      }
      const sa = a / 255;
      const da = data[i + 3] / 255;
      const outA = sa + da * (1 - sa);
      if (outA <= 0) return;
      data[i] = (r * sa + data[i] * da * (1 - sa)) / outA;
      data[i + 1] = (g * sa + data[i + 1] * da * (1 - sa)) / outA;
      data[i + 2] = (b * sa + data[i + 2] * da * (1 - sa)) / outA;
      data[i + 3] = outA * 255;
    },
    fastRect(x, y, rw, rh, color) {
      const [r, g, b, a = 255] = color;
      let x0 = Math.max(0, x | 0);
      let y0 = Math.max(0, y | 0);
      let x1 = Math.min(w, (x + rw) | 0);
      let y1 = Math.min(h, (y + rh) | 0);
      if (x0 >= x1 || y0 >= y1) return;
      if (a < 255) {
        for (let yy = y0; yy < y1; yy++) {
          for (let xx = x0; xx < x1; xx++) canvas.set(xx, yy, r, g, b, a);
        }
        return;
      }
      for (let yy = y0; yy < y1; yy++) {
        let i = (yy * w + x0) * 4;
        for (let xx = x0; xx < x1; xx++) {
          data[i++] = r;
          data[i++] = g;
          data[i++] = b;
          data[i++] = 255;
        }
      }
    },
  };
  return canvas;
}

function fillCircle(c, cx, cy, rad, color) {
  const r0 = rad | 0;
  for (let y = -r0; y <= r0; y++) {
    const span = Math.sqrt(r0 * r0 - y * y) | 0;
    c.fastRect(cx - span, cy + y, span * 2 + 1, 1, color);
  }
}

function writePNG(file, canvas) {
  const { w, h, data } = canvas;
  const rgba = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length, 0);
    const typeBuf = Buffer.from(type);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, body])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, body, crc]);
  };
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

const GLYPH = {
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '110', '100', '110', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '101', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  W: ['101', '101', '101', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['100', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '001'],
};

function drawText(c, x, y, text, color, scale = 2) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') {
      cx += 3 * scale;
      continue;
    }
    const g = GLYPH[ch];
    if (!g) {
      cx += 4 * scale;
      continue;
    }
    for (let gy = 0; gy < g.length; gy++) {
      for (let gx = 0; gx < g[gy].length; gx++) {
        if (g[gy][gx] === '1') c.fastRect(cx + gx * scale, y + gy * scale, scale, scale, color);
      }
    }
    cx += 4 * scale;
  }
}

function gridCanvas(width, height) {
  const rows = Array.from({ length: height }, () => '.'.repeat(width));
  return {
    rows,
    plot(x, y, ch) {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const row = rows[y];
      rows[y] = row.slice(0, x) + ch + row.slice(x + 1);
    },
    rect(x, y, w, h, ch) {
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) this.plot(x + xx, y + yy, ch);
      }
    },
  };
}

function paintGrid(grid, legend, scale) {
  const h = grid.rows.length;
  const w = grid.rows[0].length;
  const c = makeCanvas(w * scale, h * scale);
  for (let y = 0; y < h; y++) {
    const row = grid.rows[y];
    for (let x = 0; x < w; x++) {
      const col = legend[row[x]];
      if (!col) continue;
      c.fastRect(x * scale, y * scale, scale, scale, col);
    }
  }
  return c;
}

function addOutline(canvas) {
  const w = canvas.w + 2;
  const h = canvas.h + 2;
  const out = makeCanvas(w, h);
  for (let y = 0; y < canvas.h; y++) {
    for (let x = 0; x < canvas.w; x++) {
      const s = (y * canvas.w + x) * 4;
      const a = canvas.data[s + 3];
      if (a < 20) continue;
      out.set(x + 1, y + 1, canvas.data[s], canvas.data[s + 1], canvas.data[s + 2], a);
    }
  }
  const solid = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return out.data[(y * w + x) * 4 + 3] > 30;
  };
  const marks = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
        marks.push([x, y]);
      }
    }
  }
  for (const [x, y] of marks) out.set(x, y, 8, 6, 10, 255);
  return out;
}

const PLAYER = {
  h: [36, 24, 20],
  s: [214, 176, 142],
  e: [24, 18, 16],
  c: [28, 40, 72],
  d: [16, 24, 46],
  p: [32, 34, 44],
  b: [14, 12, 14],
  k: [186, 146, 114],
};

function drawPlayer(step) {
  const g = gridCanvas(20, 32);
  const bob = step % 2 === 1 ? 1 : 0;
  g.rect(6, 2 + bob, 7, 3, 'h');
  g.rect(6, 4 + bob, 7, 6, 's');
  g.rect(5, 3 + bob, 8, 3, 'h');
  g.plot(11, 6 + bob, 'e');
  g.plot(12, 6 + bob, 'e');
  g.rect(7, 9 + bob, 4, 1, 's');
  g.rect(5, 10 + bob, 9, 9, 'c');
  g.rect(4, 11 + bob, 2, 6, 'd');
  g.rect(7, 13 + bob, 4, 4, 'd');
  const swing = [0, 1, 0, -1][step];
  g.rect(13, 12 + bob, 4, 2, 'c');
  g.rect(16, 13 + bob + swing, 2, 2, 'k');
  g.rect(6, 19 + bob, 7, 3, 'p');

  if (step === 0) {
    g.rect(6, 22, 3, 7, 'p');
    g.rect(10, 22, 3, 7, 'p');
    g.rect(6, 28, 3, 2, 'b');
    g.rect(10, 28, 3, 2, 'b');
  } else if (step === 1) {
    g.rect(7, 22, 3, 6, 'p');
    g.rect(12, 23, 3, 5, 'p');
    g.rect(7, 27, 3, 2, 'b');
    g.rect(13, 27, 3, 2, 'b');
  } else if (step === 2) {
    g.rect(6, 22, 3, 7, 'p');
    g.rect(10, 22, 3, 7, 'p');
    g.rect(5, 28, 3, 2, 'b');
    g.rect(11, 28, 3, 2, 'b');
  } else {
    g.rect(3, 23, 3, 5, 'p');
    g.rect(9, 22, 3, 6, 'p');
    g.rect(2, 27, 3, 2, 'b');
    g.rect(9, 27, 3, 2, 'b');
  }
  return addOutline(paintGrid(g, PLAYER, 3));
}

const CREATURE = {
  b: [14, 12, 16],
  d: [26, 20, 24],
  h: [22, 18, 22],
  e: [232, 36, 44],
  c: [92, 78, 72],
  m: [40, 8, 12],
};

function drawCreature(step) {
  const g = gridCanvas(22, 36);
  const bob = step % 2 === 1 ? 1 : 0;
  g.rect(7, 1 + bob, 6, 3, 'h');
  g.rect(8, 3 + bob, 6, 5, 'h');
  g.plot(12, 5 + bob, 'e');
  g.plot(13, 5 + bob, 'e');
  g.rect(11, 7 + bob, 3, 1, 'm');
  g.rect(6, 8 + bob, 8, 3, 'd');
  g.rect(5, 11 + bob, 8, 12, 'b');
  g.rect(4, 12 + bob, 3, 7, 'd');
  const reach = step % 2 === 0 ? 0 : 2;
  g.rect(12, 13 + bob, 6 + reach, 2, 'b');
  g.rect(17 + reach, 14 + bob, 2, 3, 'c');
  g.rect(16 + reach, 17 + bob, 2, 2, 'c');
  g.rect(7, 23 + bob, 5, 2, 'b');
  if (step % 2 === 0) {
    g.rect(6, 25, 2, 8, 'b');
    g.rect(10, 25, 2, 7, 'b');
    g.rect(5, 32, 3, 2, 'd');
    g.rect(10, 31, 3, 2, 'd');
  } else {
    g.rect(5, 25, 2, 7, 'b');
    g.rect(11, 24, 2, 9, 'b');
    g.rect(4, 31, 3, 2, 'd');
    g.rect(11, 32, 3, 2, 'd');
  }
  g.rect(8, 33, 2, 2, 'b');
  return addOutline(paintGrid(g, CREATURE, 3));
}

function drawKey() {
  const g = gridCanvas(16, 8);
  const legend = {
    g: [232, 196, 86],
    s: [168, 126, 48],
    w: [255, 236, 170],
  };
  g.rect(2, 1, 5, 5, 'g');
  g.rect(3, 2, 3, 3, '.');
  g.plot(3, 2, 'w');
  g.rect(7, 3, 7, 2, 's');
  g.rect(12, 5, 1, 2, 's');
  g.rect(14, 5, 1, 2, 's');
  return addOutline(paintGrid(g, legend, 4));
}

function drawDoor(open) {
  const c = makeCanvas(56, 116);
  if (!open) {
    c.fastRect(0, 0, 56, 116, [10, 8, 10]);
    c.fastRect(4, 4, 48, 108, [16, 12, 14]);
    c.fastRect(10, 12, 36, 40, [22, 14, 16]);
    c.fastRect(10, 58, 36, 44, [22, 14, 16]);
    c.fastRect(40, 62, 6, 6, [70, 52, 32]);
    drawText(c, 12, 24, 'EXIT', [64, 16, 20], 2);
  } else {
    c.fastRect(14, 0, 40, 116, [6, 8, 14]);
    c.fastRect(18, 0, 32, 28, [18, 24, 40]);
    c.fastRect(0, 0, 14, 116, [32, 22, 24]);
    c.fastRect(4, 10, 6, 40, [48, 30, 32]);
    c.fastRect(4, 56, 6, 46, [48, 30, 32]);
  }
  return c;
}

function drawShadow() {
  const c = makeCanvas(70, 18);
  for (let y = 0; y < 18; y++) {
    for (let x = 0; x < 70; x++) {
      const nx = (x - 35) / 34;
      const ny = (y - 9) / 8;
      const d = nx * nx + ny * ny;
      if (d < 1) c.set(x, y, 0, 0, 0, Math.floor((1 - d) * 110));
    }
  }
  return c;
}

function drawFlashlight() {
  const w = 560;
  const h = 460;
  const c = makeCanvas(w, h);
  const ox = 28;
  const oy = h / 2;
  const maxDist = 530;
  const half = 0.78;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - ox;
      const dy = y - oy;
      const dist = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      let bulb = 0;
      if (dist < 86) bulb = (1 - dist / 86) ** 1.15;
      let beam = 0;
      if (dx > -8 && Math.abs(ang) < half && dist < maxDist) {
        const af = 1 - Math.abs(ang) / half;
        const df = 1 - dist / maxDist;
        beam = af ** 0.42 * df ** 0.62;
      }
      const a = Math.min(1, bulb * 0.98 + beam);
      if (a < 0.012) continue;
      c.set(x, y, 255, 244, 220, Math.floor(a * 255));
    }
  }
  return c;
}

function drawHelicopter() {
  const c = makeCanvas(230, 120);
  const dark = [28, 30, 34];
  const body = [54, 58, 64];
  const glass = [150, 186, 196];
  const red = [150, 42, 38];
  c.fastRect(108, 18, 6, 22, dark);
  c.fastRect(128, 46, 78, 8, dark);
  c.fastRect(190, 24, 8, 36, dark);
  c.fastRect(184, 24, 22, 8, dark);
  c.fastRect(198, 30, 5, 14, [20, 20, 22]);
  c.fastRect(36, 36, 110, 36, body);
  c.fastRect(24, 46, 22, 20, body);
  c.fastRect(30, 42, 26, 16, glass);
  c.fastRect(34, 46, 8, 8, [210, 230, 236]);
  c.fastRect(36, 58, 100, 5, red);
  c.fastRect(78, 40, 3, 28, dark);
  c.fastRect(48, 84, 4, 16, dark);
  c.fastRect(112, 84, 4, 16, dark);
  c.fastRect(36, 98, 92, 4, dark);
  c.fastRect(40, 72, 10, 6, [70, 74, 80]);
  return c;
}

function drawRotor() {
  const c = makeCanvas(250, 36);
  for (let y = 0; y < 36; y++) {
    for (let x = 0; x < 250; x++) {
      const nx = (x - 125) / 120;
      const ny = (y - 18) / 12;
      const d = nx * nx + ny * ny;
      if (d < 1) c.set(x, y, 220, 224, 230, Math.floor((1 - d) * 80));
    }
  }
  c.fastRect(6, 15, 238, 5, [236, 238, 242, 200]);
  return c;
}

function drawEyes() {
  const c = makeCanvas(360, 120);
  const eye = (cx, cy) => {
    for (let r = 46; r >= 8; r--) {
      const a = Math.floor((1 - r / 46) * 80);
      fillCircle(c, cx, cy, r, [90, 0, 0, a]);
    }
    fillCircle(c, cx, cy, 18, [210, 28, 32, 255]);
    fillCircle(c, cx, cy, 8, [255, 80, 70, 255]);
    c.fastRect(cx - 3, cy - 16, 5, 32, [8, 0, 0, 255]);
  };
  eye(110, 60);
  eye(250, 60);
  return c;
}

function drawSky() {
  const w = 960;
  const h = 540;
  const c = makeCanvas(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / h;
    c.fastRect(0, y, w, 1, [
      6 + t * 12,
      8 + t * 16,
      18 + t * 28,
    ]);
  }
  fillCircle(c, 760, 90, 28, [232, 228, 210, 255]);
  fillCircle(c, 770, 84, 24, [10, 16, 32, 255]);
  const rng = mulberry32(11);
  for (let i = 0; i < 70; i++) {
    const x = (rng() * w) | 0;
    const y = (rng() * 320) | 0;
    const a = 120 + ((rng() * 120) | 0);
    c.fastRect(x, y, rng() > 0.8 ? 2 : 1, rng() > 0.8 ? 2 : 1, [230, 230, 240, a]);
  }
  c.fastRect(0, 430, w, 110, [8, 8, 12]);
  c.fastRect(0, 400, 150, 140, [12, 12, 16]);
  c.fastRect(760, 360, 200, 180, [14, 12, 16]);
  c.fastRect(180, 408, 520, 132, [18, 16, 18]);
  c.fastRect(300, 392, 280, 16, [28, 26, 28]);
  const wins = [
    [20, 420], [48, 450], [30, 480], [80, 430], [100, 470],
    [790, 390], [820, 430], [850, 400], [880, 460], [910, 410],
  ];
  for (const [x, y] of wins) {
    if (rng() > 0.35) c.fastRect(x, y, 8, 12, [196, 160, 70, 180]);
  }
  return c;
}

const WALL = {
  3: [48, 38, 36],
  4: [40, 46, 40],
  5: [36, 40, 52],
  6: [32, 30, 36],
  7: [44, 38, 40],
};

function drawWindow(c, x, y, rng) {
  c.fastRect(x, y, 54, 62, [62, 56, 52]);
  c.fastRect(x + 4, y + 4, 46, 54, [16, 20, 32]);
  c.fastRect(x + 25, y + 4, 3, 54, [62, 56, 52]);
  c.fastRect(x + 4, y + 30, 46, 3, [62, 56, 52]);
  if (rng() > 0.45) c.fastRect(x + 6, y + 6, 16, 20, [28, 32, 44, 200]);
}

function drawAptDoor(c, x, floor, n) {
  const y = WALK_Y - 100;
  c.fastRect(x - 4, y - 4, 52, 104, [36, 28, 26]);
  c.fastRect(x, y, 44, 100, [58, 36, 32]);
  c.fastRect(x + 6, y + 8, 32, 36, [48, 30, 28]);
  c.fastRect(x + 6, y + 50, 32, 40, [48, 30, 28]);
  c.fastRect(x + 32, y + 52, 5, 5, [176, 148, 72]);
  drawText(c, x + 6, y - 16, `${floor}0${n}`, [150, 132, 120], 2);
}

function drawCrack(c, x, y, rng) {
  let px = x;
  let py = y;
  for (let i = 0; i < 10; i++) {
    px += (rng() * 7 - 2) | 0;
    py += 5;
    c.fastRect(px, py, 2, 6, [16, 12, 14]);
  }
}

function drawStairwell(c, sx, label) {
  const x = sx - 78;
  c.fastRect(x, 8, 156, WALK_Y - 8, [24, 20, 22]);
  c.fastRect(x, 0, 156, 18, [12, 10, 12]);
  for (let i = 0; i < 6; i++) {
    const sy = WALK_Y - 16 - i * 20;
    c.fastRect(x + 18 + i * 12, sy, 78, 10, [78, 70, 66]);
    c.fastRect(x + 18 + i * 12, sy, 78, 3, [110, 100, 94]);
  }
  c.fastRect(x + 24, 20, 5, WALK_Y - 28, [132, 132, 138]);
  c.fastRect(x + 120, 20, 5, WALK_Y - 28, [132, 132, 138]);
  if (label) drawText(c, x + 46, 24, label, [186, 170, 150], 2);
}

function drawFloor(floor) {
  const c = makeCanvas(WORLD_W, FLOOR_H);
  const rng = mulberry32(floor * 9176 + 3);
  const wall = WALL[floor];
  c.fastRect(0, 0, WORLD_W, FLOOR_H, wall);
  for (let i = 0; i < 900; i++) {
    const x = (rng() * WORLD_W) | 0;
    const y = (rng() * (WALK_Y - 10)) | 0;
    const shade = rng() > 0.5 ? 18 : -16;
    c.fastRect(x, y, 2, 2, [
      Math.max(0, wall[0] + shade),
      Math.max(0, wall[1] + shade),
      Math.max(0, wall[2] + shade),
    ]);
  }
  c.fastRect(0, 0, WORLD_W, 12, [18, 16, 18]);
  c.fastRect(0, 12, WORLD_W, 4, [70, 60, 54]);
  for (let x = 0; x < WORLD_W; x += 20) {
    const plank = (x / 20) % 2 === 0 ? [86, 58, 40] : [68, 44, 32];
    c.fastRect(x, WALK_Y, 20, FLOOR_H - WALK_Y, plank);
    c.fastRect(x, WALK_Y, 2, FLOOR_H - WALK_Y, [40, 26, 20]);
  }
  c.fastRect(0, WALK_Y, WORLD_W, 4, [36, 24, 18]);
  c.fastRect(0, WALK_Y - 8, WORLD_W, 8, [64, 52, 46]);

  for (let x = 120; x < WORLD_W - 40; x += 460) {
    c.fastRect(x, 16, 44, 8, [48, 48, 52]);
    c.fastRect(x + 4, 19, 36, 3, [16, 16, 18]);
  }

  if (floor === 7) {
    for (let x = 260; x < ROOM_X - 80; x += 360) {
      drawWindow(c, x, 46, rng);
      drawAptDoor(c, x + 80, floor, 1 + ((x / 360) | 0));
    }
    c.fastRect(ROOM_X, 20, ROOM_W, WALK_Y - 20, [62, 52, 48]);
    c.fastRect(ROOM_X, 20, 8, WALK_Y - 20, [90, 74, 64]);
    c.fastRect(ROOM_X + ROOM_W - 8, 20, 8, WALK_Y - 20, [90, 74, 64]);
    c.fastRect(ROOM_X + 16, WALK_Y - 10, ROOM_W - 32, 10, [96, 70, 52]);
    const tableX = KEY_X - 34;
    c.fastRect(tableX, WALK_Y - 40, 68, 8, [92, 64, 42]);
    c.fastRect(tableX + 6, WALK_Y - 32, 6, 32, [62, 42, 30]);
    c.fastRect(tableX + 56, WALK_Y - 32, 6, 32, [62, 42, 30]);
    drawText(c, ROOM_X + 18, 34, 'OPEN', [120, 96, 84], 3);
    const frameX = DOOR_X - 34;
    c.fastRect(frameX, WALK_Y - 124, 68, 124, [28, 20, 20]);
    c.fastRect(frameX + 6, WALK_Y - 116, 56, 116, [6, 6, 8]);
  } else {
    let n = 1;
    for (let x = 80; x < WORLD_W - 220; x += 380) {
      const center = x + 90;
      const stair = stairX(floor);
      if (stair != null && Math.abs(center - stair) < 170) continue;
      drawWindow(c, x, 44 + ((rng() * 8) | 0), rng);
      drawAptDoor(c, x + 78, floor, n);
      if (rng() > 0.55) drawCrack(c, x + 30, 36, rng);
      n++;
    }
  }

  const up = stairX(floor);
  if (up != null) drawStairwell(c, up, 'UP');
  if (floor > 3) {
    const arrived = stairX(floor - 1);
    if (arrived !== up) drawStairwell(c, arrived, '');
  }
  if (floor === 3) {
    c.fastRect(0, 16, 90, WALK_Y - 16, [10, 8, 10]);
    drawText(c, 8, 30, 'DN', [120, 90, 90], 2);
  }

  let labelX = 120;
  if (floor === 7) labelX = 500;
  else if (up != null && up < 500) labelX = 700;
  drawText(c, labelX, 28, `FLOOR ${floor}`, [166, 146, 132], 3);
  if (rng() > 0.3) {
    c.fastRect(400 + ((rng() * 600) | 0), WALK_Y + 8, 30, 8, [40, 16, 16, 90]);
  }
  return c;
}

function writeWav(file, samples, sampleRate = 22050) {
  const n = samples.length;
  const buffer = Buffer.alloc(44 + n * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + n * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    let s = samples[i];
    if (Number.isNaN(s)) s = 0;
    if (s > 1) s = 1;
    if (s < -1) s = -1;
    buffer.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  fs.writeFileSync(file, buffer);
}

function normalize(samples, peak = 0.9) {
  let max = 0;
  for (const s of samples) max = Math.max(max, Math.abs(s));
  if (max < 0.0001) return samples;
  const gain = peak / max;
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  return samples;
}

function seamless(samples, fade) {
  const n = samples.length;
  const f = Math.min(fade, (n / 3) | 0);
  for (let i = 0; i < f; i++) {
    const t = i / f;
    const fromEnd = samples[n - f + i];
    samples[i] = samples[i] * t + fromEnd * (1 - t);
  }
  samples[n - 1] = samples[0];
  return samples;
}

function render(seconds, fn, sampleRate = 22050) {
  const n = Math.floor(seconds * sampleRate);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / sampleRate, i, sampleRate);
  return out;
}

function lowpass(samples, cutoff, sampleRate) {
  const dt = 1 / sampleRate;
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = dt / (rc + dt);
  let acc = 0;
  for (let i = 0; i < samples.length; i++) {
    acc += alpha * (samples[i] - acc);
    samples[i] = acc;
  }
  return samples;
}

function noiseAt(i) {
  let x = i | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  x = (x ^ (x >>> 16)) >>> 0;
  return x / 4294967296 * 2 - 1;
}

function makeSounds() {
  const sr = 22050;
  writeWav(
    path.join(OUT, 'wakeup.wav'),
    normalize(
      render(3.1, (t, i) => {
        const inhale = t < 0.7 ? Math.sin((t / 0.7) * Math.PI) : 0;
        const exhale = t > 0.75 && t < 1.45 ? Math.sin(((t - 0.75) / 0.7) * Math.PI) : 0;
        const breath = noiseAt(i) * (inhale * 0.55 + exhale * 0.4);
        const groanEnv = t > 1.5 && t < 2.7 ? Math.sin(((t - 1.5) / 1.2) * Math.PI) : 0;
        const vib = Math.sin(t * 28) * 6;
        const groan = Math.sin(2 * Math.PI * (98 + vib) * t) * groanEnv * 0.7
          + Math.sin(2 * Math.PI * 196 * t) * groanEnv * 0.15;
        const ringEnv = t > 2.35 ? Math.exp(-(t - 2.35) * 2.2) : 0;
        const ring = Math.sin(2 * Math.PI * 1480 * t) * ringEnv * 0.18;
        return breath + groan + ring;
      }, sr),
    ),
  );

  writeWav(
    path.join(OUT, 'ambient.wav'),
    normalize(
      seamless(
        lowpass(
          render(6, (t, i) => {
            return Math.sin(2 * Math.PI * 55 * t) * 0.4
              + Math.sin(2 * Math.PI * 82.5 * t) * 0.22
              + Math.sin(2 * Math.PI * 110 * t) * 0.08
              + noiseAt(i) * 0.18
              + Math.sin(2 * Math.PI * 0.2 * t) * 0.05;
          }, sr),
          240,
          sr,
        ),
        sr,
      ),
      0.8,
    ),
  );

  writeWav(
    path.join(OUT, 'heartbeat.wav'),
    normalize(
      seamless(
        render(1.15, (t) => {
          const lub = Math.exp(-t * 28) * Math.sin(2 * Math.PI * 58 * t);
          const dubT = t - 0.16;
          const dub = dubT > 0 ? Math.exp(-dubT * 34) * Math.sin(2 * Math.PI * 46 * dubT) : 0;
          return lub * 0.9 + dub * 0.55;
        }, sr),
        Math.floor(sr * 0.08),
      ),
    ),
  );

  writeWav(
    path.join(OUT, 'creature.wav'),
    normalize(
      seamless(
        lowpass(
          render(2.4, (t, i) => {
            const lfo = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.6 * t));
            const growl = Math.sin(2 * Math.PI * (70 + Math.sin(t * 9) * 18) * t);
            return (noiseAt(i) * 0.85 + growl * 0.5) * lfo;
          }, sr),
          320,
          sr,
        ),
        Math.floor(sr * 0.12),
      ),
    ),
  );

  writeWav(
    path.join(OUT, 'step.wav'),
    normalize(
      lowpass(
        render(0.16, (t, i) => noiseAt(i + 20) * Math.exp(-t * 28), sr),
        900,
        sr,
      ),
      0.7,
    ),
  );

  writeWav(
    path.join(OUT, 'stairs.wav'),
    normalize(
      render(0.55, (t, i) => {
        const env = Math.sin(Math.min(1, t / 0.55) * Math.PI);
        const creak = noiseAt(i + 80) * env;
        const tone = Math.sin(2 * Math.PI * (180 - t * 140) * t) * env * 0.35;
        return creak * 0.6 + tone;
      }, sr),
    ),
  );

  writeWav(
    path.join(OUT, 'key.wav'),
    normalize(
      render(0.42, (t) => {
        const env = Math.exp(-t * 7);
        return Math.sin(2 * Math.PI * 1480 * t) * env * 0.4
          + Math.sin(2 * Math.PI * 1860 * t) * env * 0.35
          + Math.sin(2 * Math.PI * 2460 * t) * Math.exp(-t * 10) * 0.25;
      }, sr),
    ),
  );

  writeWav(
    path.join(OUT, 'door.wav'),
    normalize(
      render(0.8, (t, i) => {
        const creakEnv = t < 0.55 ? Math.sin((t / 0.55) * Math.PI) : 0;
        const click = t > 0.58 ? Math.exp(-(t - 0.58) * 40) * Math.sin(2 * Math.PI * 180 * t) : 0;
        return noiseAt(i + 200) * creakEnv * 0.5 + click;
      }, sr),
    ),
  );

  writeWav(
    path.join(OUT, 'lock.wav'),
    normalize(
      render(0.28, (t, i) => {
        const env = Math.exp(-t * 14) * (0.6 + 0.4 * Math.sin(t * 90));
        return noiseAt(i + 400) * env;
      }, sr),
    ),
  );

  writeWav(
    path.join(OUT, 'thud.wav'),
    normalize(
      render(0.45, (t, i) => {
        const env = Math.exp(-t * 8);
        return Math.sin(2 * Math.PI * 52 * t) * env
          + noiseAt(i) * Math.exp(-t * 18) * 0.45;
      }, sr),
    ),
  );

  writeWav(
    path.join(OUT, 'helicopter.wav'),
    normalize(
      seamless(
        render(1, (t, i) => {
          const chop = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 12 * t));
          const body = Math.sin(2 * Math.PI * 78 * t) * 0.35 + noiseAt(i + 9) * 0.4;
          return body * chop;
        }, sr),
        Math.floor(sr * 0.04),
      ),
    ),
  );

  writeWav(
    path.join(OUT, 'gameover.wav'),
    normalize(
      render(1.5, (t) => {
        const env = t < 0.2 ? t / 0.2 : Math.exp(-(t - 0.2) * 1.6);
        return Math.sin(2 * Math.PI * 196 * t) * env * 0.45
          + Math.sin(2 * Math.PI * 185 * t) * env * 0.45
          + Math.sin(2 * Math.PI * (90 - t * 40) * t) * env * 0.3;
      }, sr),
    ),
  );

  writeWav(
    path.join(OUT, 'win.wav'),
    normalize(
      render(1.8, (t) => {
        const env = Math.min(1, t / 0.08) * Math.exp(-Math.max(0, t - 0.4) * 1.3);
        return Math.sin(2 * Math.PI * 392 * t) * env * 0.3
          + Math.sin(2 * Math.PI * 494 * t) * env * 0.28
          + Math.sin(2 * Math.PI * 587 * t) * env * 0.26
          + Math.sin(2 * Math.PI * 784 * t) * env * 0.12;
      }, sr),
    ),
  );

  writeWav(
    path.join(OUT, 'ui.wav'),
    normalize(render(0.07, (t, i) => noiseAt(i) * Math.exp(-t * 46), sr), 0.45),
  );

  writeWav(
    path.join(OUT, 'tick.wav'),
    normalize(
      render(0.05, (t) => Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 70), sr),
      0.4,
    ),
  );
}

fs.mkdirSync(OUT, { recursive: true });

for (let i = 0; i < 4; i++) {
  writePNG(path.join(OUT, `player-${i}.png`), drawPlayer(i));
  writePNG(path.join(OUT, `creature-${i}.png`), drawCreature(i));
}
writePNG(path.join(OUT, 'key.png'), drawKey());
writePNG(path.join(OUT, 'door.png'), drawDoor(false));
writePNG(path.join(OUT, 'door-open.png'), drawDoor(true));
writePNG(path.join(OUT, 'shadow.png'), drawShadow());
writePNG(path.join(OUT, 'flashlight.png'), drawFlashlight());
writePNG(path.join(OUT, 'helicopter.png'), drawHelicopter());
writePNG(path.join(OUT, 'rotor.png'), drawRotor());
writePNG(path.join(OUT, 'eyes.png'), drawEyes());
writePNG(path.join(OUT, 'sky.png'), drawSky());
for (const floor of FLOORS) {
  writePNG(path.join(OUT, `floor-${floor}.png`), drawFloor(floor));
}
makeSounds();
console.log('Assets written to', OUT);
