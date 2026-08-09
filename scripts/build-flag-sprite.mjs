#!/usr/bin/env node
/**
 * Baut aus den einzelnen Flaggen-SVGs eine einzige Bilddatei (Sprite) für den
 * Flaggen-Laufstreifen.
 *
 * Grund: der Streifen zeigt alle Länder der Welt. Als Einzeldateien wären das
 * 236 Anfragen und rund 1,5 MB — für ein Zierelement nicht vertretbar. Als
 * Sprite ist es eine Anfrage und ein Bruchteil davon.
 *
 * Der Zwischenschritt läuft über den Browser, weil das Projekt bewusst keinen
 * SVG-Rasterer als Abhängigkeit mitschleppt: das Skript schreibt eine HTML-Seite
 * mit dem Raster, `agent-browser` fotografiert sie, ffmpeg wandelt nach WebP.
 *
 * Aufruf: node scripts/build-flag-sprite.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const flagsDir = join(root, "public/flags");
const work = join(root, ".sprite-tmp");

/** Kachelgröße in Bildpunkten. Der Streifen zeigt Flaggen mit rund 20 px Breite. */
const TILE_WIDTH = 96;
const TILE_HEIGHT = 72;
const COLUMNS = 16;

const world = JSON.parse(readFileSync(join(root, "public/data/world.json"), "utf8"));
const available = new Set(readdirSync(flagsDir).map((file) => file.replace(/\.svg$/, "")));

/** Kürzel und deutscher Name je Gebiet — Grundlage für Sprite und Laufstreifen. */
const entries = [...new Map(
  world.meta
    .filter((entry) => available.has(entry.cca2.toLowerCase()))
    .map((entry) => [entry.cca2.toLowerCase(), entry.name]),
)].sort(([a], [b]) => a.localeCompare(b));
const codes = entries.map(([code]) => code);

const rows = Math.ceil(codes.length / COLUMNS);
const width = COLUMNS * TILE_WIDTH;
const height = rows * TILE_HEIGHT;

rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const tiles = codes
  .map((code) => {
    const svg = readFileSync(join(flagsDir, `${code}.svg`), "utf8");
    return `<i>${svg}</i>`;
  })
  .join("");

writeFileSync(join(work, "sheet.html"), `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:transparent}
  body{display:grid;grid-template-columns:repeat(${COLUMNS},${TILE_WIDTH}px);width:${width}px}
  i{display:block;width:${TILE_WIDTH}px;height:${TILE_HEIGHT}px;overflow:hidden}
  i svg{width:100%;height:100%;display:block}
</style>${tiles}`);

console.log(`Raster: ${codes.length} Flaggen, ${COLUMNS}×${rows}, ${width}×${height} px`);

const browser = (...args) =>
  execFileSync("agent-browser", ["--session", "flagsprite", ...args], { encoding: "utf8" });

browser("set", "viewport", String(width), String(height));
browser("open", `file://${join(work, "sheet.html")}`);
browser("wait", "--load", "networkidle");
browser("screenshot", join(work, "sheet.png"));

execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-i", join(work, "sheet.png"),
  "-frames:v", "1", "-quality", "82",
  join(root, "public/assets/flag-sprite.webp"),
]);
browser("close", "--all");

const positions = Object.fromEntries(
  codes.map((code, index) => [code, [index % COLUMNS, Math.floor(index / COLUMNS)]]),
);

writeFileSync(
  join(root, "app/data/flag-sprite.ts"),
  `// Automatisch erzeugt von scripts/build-flag-sprite.mjs — nicht von Hand ändern.

/** Spalten und Zeilen des Sprites; die Werte steuern background-position. */
export const SPRITE_COLUMNS = ${COLUMNS};
export const SPRITE_ROWS = ${rows};

/** Position jeder Flagge im Sprite als [Spalte, Zeile]. */
export const spritePositions: Record<string, [number, number]> = ${JSON.stringify(positions, null, 0)};

/** Alle Gebiete in der Reihenfolge des Sprites: Kürzel und deutscher Name. */
export const spriteCountries: { code: string; name: string }[] = ${JSON.stringify(
    entries.map(([code, name]) => ({ code, name })),
    null,
    0,
  )};
`,
);

rmSync(work, { recursive: true, force: true });
const { size } = await import("node:fs").then((fs) =>
  ({ size: fs.statSync(join(root, "public/assets/flag-sprite.webp")).size }));
console.log(`flag-sprite.webp: ${(size / 1024).toFixed(0)} kB für ${codes.length} Flaggen`);
