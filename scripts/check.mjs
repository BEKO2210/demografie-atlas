#!/usr/bin/env node
/**
 * Pflichtprüfung des Demografie Atlas.
 *
 * Ein Durchlauf beantwortet die Frage, die vor jeder Veröffentlichung zählt:
 * Würde ein Besucher gerade auf einen Fehler stoßen? Geprüft wird deshalb nicht
 * der Quelltext, sondern das, was tatsächlich ausgeliefert wird — der Ordner
 * `out/` nach einem Pages-Build.
 *
 * Aufruf:  npm run check
 * Schnell: npm run check -- --skip-build   (nutzt einen vorhandenen out/-Stand)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
const skipBuild = process.argv.includes("--skip-build");

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ok  " : " FEHL "} ${name}${detail ? ` — ${detail}` : ""}`);
};

const run = (label, command, args) => {
  process.stdout.write(`… ${label}\r`);
  try {
    execFileSync(command, args, { cwd: root, stdio: "pipe", env: { ...process.env } });
    record(label, true);
    return true;
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim().split("\n").slice(-6).join(" | ");
    record(label, false, output.slice(0, 400));
    return false;
  }
};

console.log("\nDemografie Atlas — Pflichtprüfung\n");

// 1 Werkzeugkette
run("TypeScript", "npx", ["tsc", "--noEmit"]);
run("ESLint", "npx", ["eslint", "."]);
run("Tests", "node", ["--test", "tests/**/*.test.mjs"]);

// 2 Der Stand, der wirklich ausgeliefert wird
if (!skipBuild) {
  process.stdout.write("… Pages-Build\r");
  try {
    execFileSync("npx", ["next", "build"], {
      cwd: root,
      stdio: "pipe",
      env: { ...process.env, GITHUB_PAGES: "true", NEXT_PUBLIC_BASE_PATH: "/demografie-atlas" },
    });
    record("Pages-Build", true);
  } catch (error) {
    record("Pages-Build", false, `${error.stderr ?? error.stdout ?? ""}`.slice(-300));
  }
}

if (!existsSync(out)) {
  record("Export vorhanden", false, "out/ fehlt — ohne --skip-build laufen lassen");
} else {
  record("Export vorhanden", true);

  /** Jede Route, die es geben muss. Fehlt eine, ist ein Link ins Leere gelaufen. */
  const routes = ["", "deutschland", "impressum", "datenschutz",
    ...readdirSync(join(root, "app"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(root, "app", entry.name, "page.tsx")))
      .map((entry) => entry.name)];
  const missing = [...new Set(routes)].filter(
    (route) => !existsSync(join(out, route, "index.html")),
  );
  record("Alle Routen exportiert", missing.length === 0, missing.join(", "));

  record("robots.txt", existsSync(join(out, "robots.txt")));
  record("sitemap.xml", existsSync(join(out, "sitemap.xml")));

  const htmlFiles = [];
  const collect = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) collect(path);
      else if (entry.name.endsWith(".html")) htmlFiles.push(path);
    }
  };
  collect(out);

  // Emoji-Flaggen: sehen auf jedem System anders aus, unter Windows gar nicht.
  const emojiFlag = /[\u{1F1E6}-\u{1F1FF}]{2}/u;
  const withEmoji = htmlFiles.filter((file) => emojiFlag.test(readFileSync(file, "utf8")));
  record("Keine Emoji-Flaggen", withEmoji.length === 0,
    withEmoji.map((file) => file.replace(out, "")).join(", "));

  // Jede referenzierte Datei muss auch existieren — sonst 404 beim Besucher.
  const basePath = "/demografie-atlas";
  const broken = new Set();
  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    for (const match of html.matchAll(new RegExp(`${basePath}/[A-Za-z0-9._/-]+\\.(?:js|css|png|webp|avif|svg|json|jpg)`, "g"))) {
      const asset = join(out, match[0].slice(basePath.length));
      if (!existsSync(asset)) broken.add(match[0]);
    }
  }
  record("Alle Dateien vorhanden", broken.size === 0, [...broken].slice(0, 5).join(", "));

  // Genau eine H1 je Seite, sonst stimmt die Gliederung nicht.
  const badHeadings = htmlFiles.filter((file) => {
    const count = (readFileSync(file, "utf8").match(/<h1[\s>]/g) ?? []).length;
    return count !== 1 && !file.endsWith("404.html");
  });
  record("Genau eine H1 je Seite", badHeadings.length === 0,
    badHeadings.map((file) => file.replace(out, "")).join(", "));

  // Startseite: das Erlebnis hängt daran, dass der Globus nicht alles vorlädt.
  const index = readFileSync(join(out, "index.html"), "utf8");
  const scripts = [...new Set([...index.matchAll(new RegExp(`${basePath}(/_next/static/[^"]+\\.js)`, "g"))].map((m) => m[1]))];
  const initialBytes = scripts.reduce((sum, path) => {
    const file = join(out, path);
    return sum + (existsSync(file) ? statSync(file).size : 0);
  }, 0);
  const gzipped = Math.round(initialBytes / 3.4 / 1024);
  record("Startseite unter 250 kB Initial-JS", gzipped < 250, `${gzipped} kB (geschätzt)`);
}

// 3 Welche Länder noch offen sind
const registry = readFileSync(join(root, "app/data/countries.ts"), "utf8");
const entries = [...registry.matchAll(/slug:\s*"([^"]+)"[\s\S]{0,400}?name:\s*"([^"]+)"[\s\S]{0,400}?status:\s*"(live|next|planned)"/g)];
const open = entries.filter(([, , , status]) => status !== "live");

const failed = results.filter((result) => !result.ok);
console.log(`\n${failed.length === 0 ? "Alles grün." : `${failed.length} Prüfung(en) fehlgeschlagen.`}\n`);

if (failed.length === 0 && open.length > 0) {
  console.log("Noch offene Länder — jedes hat bisher nur eine Vorschauseite:\n");
  for (const [, slug, name, status] of open) {
    console.log(`  ${name.padEnd(14)} /${slug}/  (${status === "next" ? "als Nächstes" : "geplant"})`);
  }
  console.log("\nBevor du eines ausbaust: .claude/skills/demografie-atlas/references/neues-land.md lesen.");
  console.log("Kurz gesagt — dieselben Informationen wie Deutschland, aber eine eigene Gestaltung.\n");
}

process.exit(failed.length === 0 ? 0 : 1);
