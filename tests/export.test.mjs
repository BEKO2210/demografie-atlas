/**
 * Prüft den ausgelieferten Export, nicht den Quelltext.
 *
 * Der frühere Test hing am Cloudflare-Build und prüfte ein Vorschau-Metatag,
 * das auf GitHub Pages gar nicht ausgeliefert wird. Diese Fassung stellt die
 * Fragen, die für Besucher zählen: Sind die Seiten da, stimmen die Metadaten,
 * fehlt keine referenzierte Datei?
 *
 * Voraussetzung: ein Pages-Build liegt in out/.
 *   GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/demografie-atlas npx next build
 */
import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
const BASE = "/demografie-atlas";

const hasExport = existsSync(join(out, "index.html"));
const skip = hasExport ? false : "kein Export in out/ — zuerst den Pages-Build laufen lassen";

const html = (route = "") => readFileSync(join(out, route, "index.html"), "utf8");

test("jede Route ist exportiert", { skip }, () => {
  const routes = readdirSync(join(root, "app"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, "app", entry.name, "page.tsx")))
    .map((entry) => entry.name);
  for (const route of ["", ...routes]) {
    assert.ok(existsSync(join(out, route, "index.html")), `fehlt: /${route}`);
  }
});

test("Startseite trägt Titel, Beschreibung und kanonische Adresse", { skip }, () => {
  const page = html();
  assert.match(page, /<title>[^<]{20,70}<\/title>/);
  assert.match(page, /<meta name="description" content="[^"]{80,200}"/);
  assert.match(page, /<link rel="canonical" href="https:\/\/[^"]+"/);
  assert.match(page, /application\/ld\+json/);
});

test("keine Emoji-Flaggen im Auslieferungsstand", { skip }, () => {
  const emojiFlag = /[\u{1F1E6}-\u{1F1FF}]{2}/u;
  const files = [];
  const collect = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) collect(path);
      else if (entry.name.endsWith(".html")) files.push(path);
    }
  };
  collect(out);
  const offenders = files.filter((file) => emojiFlag.test(readFileSync(file, "utf8")));
  assert.deepEqual(offenders.map((file) => file.replace(out, "")), []);
});

test("jede referenzierte Datei existiert", { skip }, () => {
  const page = html();
  const missing = [...page.matchAll(new RegExp(`${BASE}/[A-Za-z0-9._/-]+\\.(?:js|css|png|webp|avif|svg|json)`, "g"))]
    .map((match) => match[0])
    .filter((asset) => !existsSync(join(out, asset.slice(BASE.length))));
  assert.deepEqual([...new Set(missing)], []);
});

test("Sitemap und robots.txt liegen bereit", { skip }, () => {
  assert.ok(existsSync(join(out, "sitemap.xml")));
  assert.ok(existsSync(join(out, "robots.txt")));
  assert.match(readFileSync(join(out, "sitemap.xml"), "utf8"), /demografie-atlas\/deutschland\//);
});

test("Vorschauseiten bleiben aus dem Suchindex", { skip }, () => {
  for (const route of ["frankreich", "italien", "japan", "suedkorea", "usa"]) {
    if (!existsSync(join(out, route, "index.html"))) continue;
    assert.match(html(route), /<meta name="robots" content="[^"]*noindex/);
  }
});
