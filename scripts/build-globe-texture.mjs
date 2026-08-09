#!/usr/bin/env node
/**
 * Backt die Weltkarte in eine equirektanguläre Textur.
 *
 * Grund: three-globe legt für jeden Polygonring ein eigenes Mesh an. Bei 241
 * Gebieten sind das über 8000 Zeichenaufrufe pro Bild — die Hauptursache dafür,
 * dass der Globus auf schwacher Hardware nicht flüssig läuft. Als Textur auf
 * einer einzigen Kugel kostet dieselbe Darstellung einen Zeichenaufruf.
 *
 * Die Farben entsprechen exakt dem bisherigen Ergebnis: die halbtransparenten
 * Länderflächen sind hier bereits über die Kugelfarbe gerechnet.
 *
 * Ausgabe: public/assets/globe-texture.png
 * Aufruf:  node scripts/build-globe-texture.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Ausgabegröße. 8192 ist die Grenze, die praktisch jede GPU noch kann; für
 * Geräte darunter entsteht zusätzlich eine 4096er Fassung.
 */
const WIDTH = Number(process.env.GLOBE_TEXTURE_WIDTH ?? 8192);
const HEIGHT = WIDTH / 2;
/** Überabtastung für weiche Kanten; wird danach heruntergerechnet. */
const SUPERSAMPLE = Number(process.env.GLOBE_TEXTURE_SUPERSAMPLE ?? 2);
const W = WIDTH * SUPERSAMPLE;
const H = HEIGHT * SUPERSAMPLE;

/** Grundfarbe der Kugel (bisher: MeshPhongMaterial color #07101f). */
const BASE = [7, 16, 31];

/**
 * Die Textur wird selbstleuchtend gezeichnet, die frühere Darstellung dagegen
 * beleuchtet — dieselben Mischwerte kämen dadurch deutlich dunkler heraus.
 * Die Gerade unten stammt aus dem Vergleich zweier Messpunkte am gerenderten
 * Globus (Ozean und Landfläche) vor und nach dem Umbau und hebt die Farben
 * genau auf das frühere Niveau.
 */
const GAIN = [0.684, 0.667, 0.679];
const LIFT = [24.2, 30.3, 41.0];
const asRendered = (blend) =>
  blend.map((value, index) => Math.max(0, Math.min(255, Math.round(value * GAIN[index] + LIFT[index]))));

/**
 * Lesbarkeit: die frühere Abstufung zwischen Ozean und Land war so knapp, dass
 * auf Telefonen weder Kontinente noch Grenzen zu erkennen waren. Land und
 * Grenzlinien sind deshalb angehoben — die Art Direction bleibt dunkel, aber
 * die Karte ist als Karte lesbar.
 */
const OCEAN = asRendered(BASE);
/**
 * Alle Gebiete tragen dieselbe Farbe. Vorher hoben sich Deutschland und die
 * geplanten Atlas-Länder farblich ab — auf einer Startseite, die alle Länder
 * gleich behandeln soll, ist das eine Sonderrolle, die nicht hingehört.
 * Hervorgehoben wird nur noch, was der Besucher selbst berührt oder auswählt.
 */
const FILL_DEFAULT = [60, 78, 110];
const STROKE_WIDTH = 3;

const STROKE_ALPHA = 0.5;
const STROKE_RGB = [176, 208, 255];


const world = JSON.parse(readFileSync(join(root, "public/data/world.json"), "utf8"));
const features = feature(world.topology, world.topology.objects.countries).features;

const pixels = new Uint8Array(W * H * 3);
for (let index = 0; index < W * H; index += 1) {
  pixels[index * 3] = OCEAN[0];
  pixels[index * 3 + 1] = OCEAN[1];
  pixels[index * 3 + 2] = OCEAN[2];
}

const toX = (lon) => ((lon + 180) / 360) * W;
const toY = (lat) => ((90 - lat) / 180) * H;

const setPixel = (x, y, color, alpha = 1) => {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const at = (y * W + x) * 3;
  if (alpha >= 1) {
    pixels[at] = color[0];
    pixels[at + 1] = color[1];
    pixels[at + 2] = color[2];
    return;
  }
  pixels[at] = Math.round(color[0] * alpha + pixels[at] * (1 - alpha));
  pixels[at + 1] = Math.round(color[1] * alpha + pixels[at + 1] * (1 - alpha));
  pixels[at + 2] = Math.round(color[2] * alpha + pixels[at + 2] * (1 - alpha));
};

/**
 * Längengrade entlang des Rings fortlaufend machen. Ohne das erzeugt jeder
 * Sprung über die Datumsgrenze (etwa Alaska oder Fidschi) eine Scanline quer
 * über die ganze Karte.
 */
function unwrapRing(ring) {
  let offset = 0;
  const out = [];
  for (let index = 0; index < ring.length; index += 1) {
    const [lon, lat] = ring[index];
    if (index > 0) {
      const previous = ring[index - 1][0] + offset;
      if (lon + offset - previous > 180) offset -= 360;
      else if (lon + offset - previous < -180) offset += 360;
    }
    out.push([lon + offset, lat]);
  }
  return out;
}

/** Even-odd-Scanline über alle Ringe eines Polygons — Löcher bleiben Löcher. */
function fillPolygon(rings, color) {
  let minY = Infinity;
  let maxY = -Infinity;
  const edges = [];
  for (const ring of rings) {
    for (let index = 0; index < ring.length - 1; index += 1) {
      const [lon1, lat1] = ring[index];
      const [lon2, lat2] = ring[index + 1];
      const x1 = toX(lon1);
      const y1 = toY(lat1);
      const x2 = toX(lon2);
      const y2 = toY(lat2);
      if (y1 === y2) continue;
      edges.push([x1, y1, x2, y2]);
      minY = Math.min(minY, y1, y2);
      maxY = Math.max(maxY, y1, y2);
    }
  }
  if (edges.length === 0) return;

  const from = Math.max(0, Math.floor(minY));
  const to = Math.min(H - 1, Math.ceil(maxY));
  const crossings = [];
  for (let y = from; y <= to; y += 1) {
    const scan = y + 0.5;
    crossings.length = 0;
    for (const [x1, y1, x2, y2] of edges) {
      if ((scan >= y1 && scan < y2) || (scan >= y2 && scan < y1)) {
        crossings.push(x1 + ((scan - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    if (crossings.length < 2) continue;
    crossings.sort((a, b) => a - b);
    for (let index = 0; index + 1 < crossings.length; index += 2) {
      const left = Math.max(0, Math.round(crossings[index]));
      const right = Math.min(W - 1, Math.round(crossings[index + 1]));
      for (let x = left; x <= right; x += 1) setPixel(x, y, color);
    }
  }
}

/** Dünne Umrisslinie, wie bisher polygonStrokeColor. */
function strokeRings(rings) {
  for (const ring of rings) {
    for (let index = 0; index < ring.length - 1; index += 1) {
      const x1 = toX(ring[index][0]);
      const y1 = toY(ring[index][1]);
      const x2 = toX(ring[index + 1][0]);
      const y2 = toY(ring[index + 1][1]);
      if (Math.max(x1, x2) < 0 || Math.min(x1, x2) >= W) continue;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))));
      const reach = Math.floor(STROKE_WIDTH / 2);
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const px = Math.round(x1 + (x2 - x1) * t);
        const py = Math.round(y1 + (y2 - y1) * t);
        for (let dy = -reach; dy <= reach; dy += 1) {
          for (let dx = -reach; dx <= reach; dx += 1) {
            setPixel(px + dx, py + dy, STROKE_RGB, STROKE_ALPHA);
          }
        }
      }
    }
  }
}

const polygonsOf = (geometry) =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

/** Verschobene Kopien, damit ein aufgefalteter Ring beidseits der Karte sichtbar bleibt. */
const WRAPS = [-360, 0, 360];
const shiftRing = (ring, delta) => ring.map(([lon, lat]) => [lon + delta, lat]);

for (const item of features) {
  for (const rings of polygonsOf(item.geometry)) {
    const unwrapped = rings.map(unwrapRing);
    for (const delta of WRAPS) {
      const shifted = unwrapped.map((ring) => shiftRing(ring, delta));
      fillPolygon(shifted, FILL_DEFAULT);
      strokeRings(shifted);
    }
  }
}

// Herunterrechnen (Box-Filter) — das glättet die Kanten.
const out = Buffer.alloc((WIDTH * 3 + 1) * HEIGHT);
for (let y = 0; y < HEIGHT; y += 1) {
  const rowStart = y * (WIDTH * 3 + 1);
  out[rowStart] = 0;
  for (let x = 0; x < WIDTH; x += 1) {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let dy = 0; dy < SUPERSAMPLE; dy += 1) {
      for (let dx = 0; dx < SUPERSAMPLE; dx += 1) {
        const at = ((y * SUPERSAMPLE + dy) * W + (x * SUPERSAMPLE + dx)) * 3;
        r += pixels[at];
        g += pixels[at + 1];
        b += pixels[at + 2];
      }
    }
    const n = SUPERSAMPLE * SUPERSAMPLE;
    const at = rowStart + 1 + x * 3;
    out[at] = Math.round(r / n);
    out[at + 1] = Math.round(g / n);
    out[at + 2] = Math.round(b / n);
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
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8;
ihdr[9] = 2; // Farbtyp RGB

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(out, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync(join(root, "public/assets"), { recursive: true });
const name = WIDTH >= 8192 ? "globe-texture-8k.png" : "globe-texture.png";
writeFileSync(join(root, `public/assets/${name}`), png);
console.log(`${name}: ${WIDTH}×${HEIGHT}, ${(png.length / 1024).toFixed(1)} kB`);
