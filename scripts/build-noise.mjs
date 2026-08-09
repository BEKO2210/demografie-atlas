#!/usr/bin/env node
/**
 * Erzeugt public/assets/noise.png — eine kachelbare Graustufen-Rauschtextur.
 * Sie ersetzt das frühere feTurbulence-SVG, das der Browser bei jedem Repaint
 * über die volle Viewport-Fläche neu berechnen musste.
 *
 * Aufruf: node scripts/build-noise.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIZE = 64;
/** Fester Startwert: gleicher Build ⇒ gleiches Bild, keine Diff-Unruhe. */
let seed = 20260809;
const random = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

// Graustufen, 8 bit — je Zeile ein Filter-Byte (0 = None).
const raw = Buffer.alloc((SIZE + 1) * SIZE);
for (let y = 0; y < SIZE; y += 1) {
  raw[y * (SIZE + 1)] = 0;
  for (let x = 0; x < SIZE; x += 1) {
    // Mittelwert um 128 mit kräftiger Streuung entspricht der Körnung des alten Rauschens.
    const value = Math.round(128 + (random() - 0.5) * 235);
    raw[y * (SIZE + 1) + 1 + x] = Math.max(0, Math.min(255, value));
  }
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // Bittiefe
ihdr[9] = 0; // Farbtyp Graustufen
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync(join(root, "public/assets"), { recursive: true });
writeFileSync(join(root, "public/assets/noise.png"), png);
console.log(`noise.png: ${SIZE}×${SIZE}, ${(png.length / 1024).toFixed(1)} kB`);
