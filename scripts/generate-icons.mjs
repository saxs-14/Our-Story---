/**
 * Generates the PWA icon set with zero external dependencies.
 * Draws a glowing rose-gold crystal heart on a plum→night gradient and encodes
 * real PNGs via Node's built-in zlib. Run with: npm run icons
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

// ---- PNG encoder ---------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- Drawing helpers -----------------------------------------------------
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const PLUM = [58, 37, 71];
const NIGHT = [13, 6, 13];
const PEACH = [246, 201, 168];
const ROSE = [227, 112, 106];
const ROSEGOLD = [183, 110, 121];

/** Signed heart field; <0 inside. (x,y) normalised, y up. */
function heartField(x, y) {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y;
}

function drawIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const r = maskable ? 0 : size * 0.22; // corner radius (0 = full bleed)
  const cornerCx = [r, size - r];
  const cornerCy = [r, size - r];
  const heartScale = maskable ? 0.46 : 0.62; // smaller in safe zone for maskable
  const cx = size / 2;
  const cy = size * 0.52;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // Rounded-rect mask (alpha)
      let bgAlpha = 1;
      if (!maskable) {
        let inside = true;
        let dx = 0;
        let dy = 0;
        if (x < cornerCx[0] && y < cornerCy[0]) { dx = cornerCx[0] - x; dy = cornerCy[0] - y; inside = false; }
        else if (x > cornerCx[1] && y < cornerCy[0]) { dx = x - cornerCx[1]; dy = cornerCy[0] - y; inside = false; }
        else if (x < cornerCx[0] && y > cornerCy[1]) { dx = cornerCx[0] - x; dy = y - cornerCy[1]; inside = false; }
        else if (x > cornerCx[1] && y > cornerCy[1]) { dx = x - cornerCx[1]; dy = y - cornerCy[1]; inside = false; }
        if (!inside) {
          const d = Math.sqrt(dx * dx + dy * dy);
          bgAlpha = clamp01(r - d + 0.5);
        }
      }

      // Background radial gradient (plum -> night)
      const gx = (x - size * 0.4) / size;
      const gy = (y - size * 0.3) / size;
      const gd = clamp01(Math.sqrt(gx * gx + gy * gy) * 1.5);
      let col = mix(PLUM, NIGHT, gd);

      // Heart
      const hx = (x - cx) / (size * heartScale);
      const hy = (cy - y) / (size * heartScale) + 0.35;
      const f = heartField(hx, hy);
      if (f < 0) {
        const t = clamp01((hy + 0.4) / 1.6);
        let heartCol = mix(PEACH, ROSE, clamp01((hx + 1) / 2));
        heartCol = mix(heartCol, ROSEGOLD, t);
        col = heartCol;
      } else {
        // Soft outer glow around the heart
        const glow = clamp01(1 - f * 2.4);
        if (glow > 0) col = mix(col, ROSE, glow * 0.5);
      }

      rgba[i] = Math.round(col[0]);
      rgba[i + 1] = Math.round(col[1]);
      rgba[i + 2] = Math.round(col[2]);
      rgba[i + 3] = Math.round(bgAlpha * 255);
    }
  }
  return encodePNG(size, size, rgba);
}

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

for (const t of targets) {
  writeFileSync(resolve(OUT, t.name), drawIcon(t.size, t.maskable));
  console.log('wrote', t.name);
}
// apple-touch-icon (full-bleed, 180px) at /public
writeFileSync(resolve(__dirname, '..', 'public', 'apple-touch-icon.png'), drawIcon(180, true));
console.log('wrote apple-touch-icon.png');
