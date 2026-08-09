#!/usr/bin/env node
/**
 * Kopiert die benötigten Länderflaggen als SVG nach public/flags/.
 *
 * Emoji-Flaggen sehen auf jedem System anders aus und fehlen unter Windows
 * vollständig — dort erscheinen stattdessen nur zwei Buchstaben. Echte SVGs
 * sehen überall gleich aus und lassen sich sauber gestalten.
 *
 * Kopiert wird nur, was die Seite auch anzeigen kann: die Kürzel aus
 * public/data/world.json.
 *
 * Braucht `flag-icons` und läuft nur auf Zuruf: die Flaggen liegen fertig im
 * Repository, das Paket ist deshalb keine Abhängigkeit des Projekts.
 *
 * Aufruf: npm i -D flag-icons && node scripts/build-flags.mjs
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules/flag-icons/flags/4x3");
const target = join(root, "public/flags");

const world = JSON.parse(readFileSync(join(root, "public/data/world.json"), "utf8"));
const codes = [...new Set(world.meta.map((entry) => entry.cca2.toLowerCase()))].sort();

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

let copied = 0;
let missing = [];
let bytes = 0;
let largest = { code: "", size: 0 };

for (const code of codes) {
  const file = join(source, `${code}.svg`);
  let svg;
  try {
    svg = readFileSync(file, "utf8");
  } catch {
    missing.push(code);
    continue;
  }
  // Kommentare und überflüssige Leerzeichen raus — spart im Schnitt ein Fünftel.
  const slim = svg.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").trim();
  writeFileSync(join(target, `${code}.svg`), slim);
  bytes += Buffer.byteLength(slim);
  copied += 1;
  const size = statSync(join(target, `${code}.svg`)).size;
  if (size > largest.size) largest = { code, size };
}

console.log(
  `flags: ${copied} Dateien, ${(bytes / 1024).toFixed(0)} kB gesamt, ` +
    `größte ${largest.code} mit ${(largest.size / 1024).toFixed(0)} kB`,
);
if (missing.length > 0) console.log(`ohne SVG: ${missing.join(", ")}`);
console.log(`vorhanden im Paket: ${readdirSync(source).length}`);
