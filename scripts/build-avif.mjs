#!/usr/bin/env node
/**
 * Erzeugt AVIF-Varianten der Bildatlanten neben den vorhandenen WebP-Dateien.
 * Die Seite liefert AVIF per <picture> aus und fällt auf WebP zurück.
 *
 * Braucht ffmpeg mit libaom-av1. Fehlt es, bricht das Skript nicht hart ab —
 * die eingecheckten AVIF-Dateien bleiben dann einfach unverändert.
 *
 * Aufruf: node scripts/build-avif.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "public/assets");
const names = ["population", "development", "generations", "story-method"];
/** CRF 28 liegt bei rund 42 dB PSNR gegenüber der WebP-Quelle — sichtbar identisch. */
const CRF = 28;

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.warn("ffmpeg nicht gefunden — AVIF-Dateien bleiben unverändert.");
  process.exit(0);
}

for (const name of names) {
  const source = join(assets, `${name}-atlas.webp`);
  const target = join(assets, `${name}-atlas.avif`);
  if (!existsSync(source)) throw new Error(`fehlt: ${source}`);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-i", source,
    "-c:v", "libaom-av1", "-crf", String(CRF), "-still-picture", "1",
    target,
  ]);
  const webp = statSync(source).size;
  const avif = statSync(target).size;
  console.log(
    `${name}: WebP ${(webp / 1024).toFixed(1)} kB → AVIF ${(avif / 1024).toFixed(1)} kB ` +
      `(−${Math.round((1 - avif / webp) * 100)} %)`,
  );
}
