/**
 * Draws the Android launcher icon: a red love-heart on white.
 * Overwrites the Capacitor default mipmaps at every density. Zero deps
 * (PNG encoded via Node zlib, same technique as scripts/generate-icons.mjs).
 *
 * Run after `npx cap add android`:  node scripts/generate-android-icon.mjs
 *
 * Produces, per density:
 *   ic_launcher.png            legacy square  (white rounded bg + red heart)
 *   ic_launcher_round.png      legacy round   (white circle bg + red heart)
 *   ic_launcher_foreground.png adaptive layer (transparent + red heart, safe-zoned)
 * The adaptive background stays white (res/values/ic_launcher_background.xml).
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RES = resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// ── PNG encoder (RGBA) ──────────────────────────────────────────────────────
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const stride = w * 4, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── Drawing ─────────────────────────────────────────────────────────────────
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

const RED_TOP = [0xF6, 0x3A, 0x4D]; // bright red
const RED_BOT = [0xC8, 0x12, 0x28]; // deep red
const HILITE  = [0xFF, 0x9B, 0xA8]; // soft sheen
const WHITE   = [255, 255, 255];

/** Signed heart field; <0 inside. (x,y) normalised, y up. */
function heartField(x, y) { const a = x * x + y * y - 1; return a * a * a - x * x * y * y * y; }

// Heart curve bounds: x ∈ [-1.13, 1.13], y ∈ [-1.29, 1.0]; bbox centre y ≈ -0.145.
const HEART_HALF_W = 1.13;
const HEART_CY = -0.145;

function draw(size, mode) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cyPix = size * 0.50;
  // Heart width as a fraction of the canvas (smaller for the adaptive safe zone).
  const halfWidth = (mode === 'foreground' ? 0.26 : 0.36) * size;
  const ppu = halfWidth / HEART_HALF_W; // pixels per normalised unit
  const corner = size * 0.20;
  const radius = size * 0.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let col = WHITE;
      let alpha = 0;

      // Background layer
      if (mode === 'square') {
        let inside = true, dx = 0, dy = 0;
        const lo = corner, hiX = size - corner, hiY = size - corner;
        if (x < lo && y < lo) { dx = lo - x; dy = lo - y; inside = false; }
        else if (x > hiX && y < lo) { dx = x - hiX; dy = lo - y; inside = false; }
        else if (x < lo && y > hiY) { dx = lo - x; dy = y - hiY; inside = false; }
        else if (x > hiX && y > hiY) { dx = x - hiX; dy = y - hiY; inside = false; }
        alpha = inside ? 1 : clamp01(corner - Math.sqrt(dx * dx + dy * dy) + 0.5);
      } else if (mode === 'round') {
        const d = Math.sqrt((x + 0.5 - cx) ** 2 + (y + 0.5 - cyPix) ** 2);
        alpha = clamp01(radius - d + 0.5);
      } // foreground: transparent (alpha stays 0)

      // Heart layer (overrides background), full curve fitted + centred
      const hx = (x + 0.5 - cx) / ppu;
      const hy = HEART_CY + (cyPix - (y + 0.5)) / ppu;
      if (heartField(hx, hy) < 0) {
        let hc = mix(RED_TOP, RED_BOT, clamp01((y + 0.5) / size));
        const hl = clamp01(1 - (((hx + 0.35) ** 2 + (hy - 0.35) ** 2) * 1.8));
        hc = mix(hc, HILITE, hl * 0.4);
        col = hc;
        alpha = 1;
      }

      rgba[i] = Math.round(col[0]);
      rgba[i + 1] = Math.round(col[1]);
      rgba[i + 2] = Math.round(col[2]);
      rgba[i + 3] = Math.round(alpha * 255);
    }
  }
  return encodePNG(size, size, rgba);
}

const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

for (const [d, size] of Object.entries(LEGACY)) {
  writeFileSync(resolve(RES, `mipmap-${d}`, 'ic_launcher.png'), draw(size, 'square'));
  writeFileSync(resolve(RES, `mipmap-${d}`, 'ic_launcher_round.png'), draw(size, 'round'));
}
for (const [d, size] of Object.entries(FOREGROUND)) {
  writeFileSync(resolve(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), draw(size, 'foreground'));
}
// Also refresh the Play-store/preview 512 in project root for convenience.
writeFileSync(resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'ic_launcher-web.png'), draw(512, 'square'));

console.log('✓ Red-heart launcher icons written for all densities.');
