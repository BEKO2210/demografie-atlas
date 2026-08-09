#!/usr/bin/env node
/**
 * Erzeugt die Weltdaten als statische Assets, damit weder die vollständige
 * 50m-Topologie noch das komplette `world-countries`-Paket im JavaScript-Bundle landen.
 *
 * Ausgabe:
 *   public/data/world.json        Topologie (neu quantisiert) + kompakte Ländermetadaten
 *   app/data/world-constants.ts   die wenigen Werte, die schon im ersten Render gebraucht werden
 *
 * Aufruf: node scripts/build-world-data.mjs
 */
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { geoArea } from "d3-geo";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const source = require("world-atlas/countries-50m.json");
const worldCountries = require("world-countries");

/**
 * Zielauflösung des Koordinatengitters: 32768 Schritte über 360° ≈ 0,011° ≈ 1,2 km.
 * Gröber (etwa 8000) wäre kleiner, lässt aber Kleinstgebiete wie den Vatikan auf eine
 * einzige Gitterzelle zusammenfallen — sie hätten dann keine Fläche und wären nicht mehr
 * anklickbar. Der Wert ist der kleinste, bei dem alle 241 Gebiete Fläche behalten.
 */
const QUANTIZATION = 32768;

/**
 * Kleinste erhaltene Dreiecksfläche (Visvalingam) in Grad².
 * 0,02 entspricht Details von rund 0,2° — deutlich unter einem Pixel.
 */
const MIN_TRIANGLE_AREA = 0.02;

/** Punkte, die je Bogen mindestens bestehen bleiben, damit Kleinstinseln nicht verschwinden. */
const MIN_POINTS_PER_ARC = 4;

/**
 * Längste Strecke in Grad, die durch Vereinfachung entstehen darf.
 * Ohne diese Grenze würden exakt kollineare Ketten — etwa die Grundlinie der Antarktis
 * entlang −89,999° — auf wenige Punkte zusammenfallen und die Geometrie verzerren.
 */
const MAX_SEGMENT_DEGREES = 4;

/** Delta-kodierte Bogen in absolute Koordinaten (Grad) umrechnen. */
function decodeArcs(topology) {
  const [sx, sy] = topology.transform.scale;
  const [tx, ty] = topology.transform.translate;
  return topology.arcs.map((arc) => {
    let ax = 0;
    let ay = 0;
    return arc.map(([dx, dy]) => {
      ax += dx;
      ay += dy;
      return [ax * sx + tx, ay * sy + ty];
    });
  });
}

const triangleArea = (a, b, c) =>
  Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;

/**
 * Visvalingam-Whyatt je Bogen. Bögen sind in TopoJSON zwischen Nachbarländern geteilt,
 * deshalb bleiben gemeinsame Grenzen nach der Vereinfachung deckungsgleich —
 * es entstehen keine Lücken oder Überlappungen.
 */
function simplifyArc(points, minArea) {
  if (points.length <= MIN_POINTS_PER_ARC) return points;
  const keep = points.map(() => true);
  let remaining = points.length;

  for (;;) {
    let worstIndex = -1;
    let worstArea = Infinity;
    let previous = -1;
    let current = -1;
    for (let index = 0; index < points.length; index += 1) {
      if (!keep[index]) continue;
      if (previous < 0) { previous = index; continue; }
      if (current < 0) { current = index; continue; }
      const span = Math.hypot(
        points[index][0] - points[previous][0],
        points[index][1] - points[previous][1],
      );
      if (span <= MAX_SEGMENT_DEGREES) {
        const area = triangleArea(points[previous], points[current], points[index]);
        if (area < worstArea) { worstArea = area; worstIndex = current; }
      }
      previous = current;
      current = index;
    }
    if (worstIndex < 0 || worstArea >= minArea || remaining <= MIN_POINTS_PER_ARC) break;
    keep[worstIndex] = false;
    remaining -= 1;
  }

  return points.filter((_, index) => keep[index]);
}

/** Auf ein gröberes Ganzzahlgitter legen und wieder delta-kodieren. */
function quantizeArcs(arcs, bbox, quantization) {
  const [x0, y0, x1, y1] = bbox;
  const kx = (quantization - 1) / (x1 - x0);
  const ky = (quantization - 1) / (y1 - y0);
  const encoded = arcs.map((points) => {
    let previousX = null;
    let previousY = null;
    const out = [];
    for (const [lon, lat] of points) {
      const qx = Math.round((lon - x0) * kx);
      const qy = Math.round((lat - y0) * ky);
      if (qx === previousX && qy === previousY) continue;
      out.push([qx - (previousX ?? 0), qy - (previousY ?? 0)]);
      previousX = qx;
      previousY = qy;
    }
    // Ein Bogen braucht mindestens zwei Punkte, sonst verschwindet winzige Geometrie.
    if (out.length < 2) out.push([0, 0]);
    return out;
  });
  return { arcs: encoded, transform: { scale: [1 / kx, 1 / ky], translate: [x0, y0] } };
}

const decoded = decodeArcs(source);

/** Alle Bogenindizes einer Geometrie einsammeln (verschachtelt, negativ = umgekehrt). */
function collectArcIndices(arcs, into = new Set()) {
  for (const entry of arcs) {
    if (Array.isArray(entry)) collectArcIndices(entry, into);
    else into.add(entry < 0 ? ~entry : entry);
  }
  return into;
}

function buildTopology(protectedArcs) {
  const simplified = decoded.map((points, index) =>
    protectedArcs.has(index) ? points : simplifyArc(points, MIN_TRIANGLE_AREA));
  const { arcs, transform } = quantizeArcs(simplified, source.bbox, QUANTIZATION);
  return {
    type: "Topology",
    bbox: source.bbox,
    transform,
    objects: { countries: source.objects.countries },
    arcs,
  };
}

/**
 * Selbstprüfung: Vereinfachung darf keine Fläche nennenswert verändern.
 * Winzige Inselketten wie Kiribati liegen teils beidseits der Datumsgrenze —
 * fällt dort ein Ring zusammen, deutet d3 ihn als Komplement und das Gebiet
 * überzieht die halbe Kugel. Betroffene Bögen bleiben deshalb unvereinfacht.
 */
const originalFeatures = feature(source, source.objects.countries).features;
const originalAreas = originalFeatures.map((item) => geoArea(item));
const geometries = source.objects.countries.geometries;

const protectedArcs = new Set();
let topology = buildTopology(protectedArcs);
let repaired = [];

for (let attempt = 0; attempt < 5; attempt += 1) {
  const areas = feature(topology, topology.objects.countries).features.map((item) => geoArea(item));
  const broken = [];
  for (let index = 0; index < areas.length; index += 1) {
    const before = originalAreas[index];
    const after = areas[index];
    // Kein Gebiet darf verschwinden, und keines darf mehr als ein Drittel Fläche gewinnen oder verlieren.
    const vanished = before > 0 && after === 0;
    if (vanished || Math.abs(after - before) > before * 0.35) broken.push(index);
  }
  if (broken.length === 0) break;
  repaired = broken.map((index) => originalFeatures[index].properties?.name ?? geometries[index].id);
  for (const index of broken) collectArcIndices(geometries[index].arcs, protectedArcs);
  topology = buildTopology(protectedArcs);
}

const arcs = topology.arcs;
const pointsBefore = decoded.reduce((sum, arc) => sum + arc.length, 0);
const pointsAfter = arcs.reduce((sum, arc) => sum + arc.length, 0);

/** Die Oberfläche ist deutsch; `world-countries` liefert Regionen auf Englisch. */
const REGIONS_DE = {
  Africa: "Afrika",
  Americas: "Amerika",
  Antarctic: "Antarktis",
  Asia: "Asien",
  Europe: "Europa",
  Oceania: "Ozeanien",
};

/**
 * Deutsche Hauptstadtnamen. `world-countries` übersetzt Ländernamen, aber keine
 * Hauptstädte. Aufgeführt sind nur die Fälle, in denen sich die deutsche
 * Schreibweise unterscheidet; alles Übrige behält den Originalnamen.
 */
const CAPITALS_DE = {
  Algiers: "Algier",
  "Addis Ababa": "Addis Abeba",
  Amman: "Amman",
  Ashgabat: "Aschgabat",
  Athens: "Athen",
  Baghdad: "Bagdad",
  Bangui: "Bangui",
  Beijing: "Peking",
  Belgrade: "Belgrad",
  Bishkek: "Bischkek",
  Bogotá: "Bogotá",
  Brussels: "Brüssel",
  Bucharest: "Bukarest",
  Cairo: "Kairo",
  Copenhagen: "Kopenhagen",
  Damascus: "Damaskus",
  Djibouti: "Dschibuti",
  Dushanbe: "Duschanbe",
  "Guatemala City": "Guatemala-Stadt",
  Havana: "Havanna",
  "Hong Kong": "Hongkong",
  Jerusalem: "Jerusalem",
  Khartoum: "Khartum",
  Kyiv: "Kiew",
  "Kuwait City": "Kuwait-Stadt",
  Lisbon: "Lissabon",
  Luxembourg: "Luxemburg",
  "Mexico City": "Mexiko-Stadt",
  Mogadishu: "Mogadischu",
  Moscow: "Moskau",
  Muscat: "Maskat",
  "New Delhi": "Neu-Delhi",
  Nicosia: "Nikosia",
  "Nuku'alofa": "Nukuʻalofa",
  "Panama City": "Panama-Stadt",
  Prague: "Prag",
  Pyongyang: "Pjöngjang",
  Riyadh: "Riad",
  Rome: "Rom",
  "Sana'a": "Sanaa",
  Singapore: "Singapur",
  "Sri Jayawardenepura Kotte": "Sri Jayewardenepura Kotte",
  Taipei: "Taipeh",
  Tashkent: "Taschkent",
  Tbilisi: "Tiflis",
  Tehran: "Teheran",
  Tokyo: "Tokio",
  Tripoli: "Tripolis",
  "Vatican City": "Vatikanstadt",
  Vienna: "Wien",
  Vientiane: "Vientiane",
  Warsaw: "Warschau",
  "Washington, D.C.": "Washington, D. C.",
  Yerevan: "Erewan",
  Zagreb: "Zagreb",
};

/** Nur die Felder, die die Oberfläche tatsächlich anzeigt. */
const byNumericCode = new Map();
for (const country of worldCountries) {
  if (!country.ccn3) continue;
  byNumericCode.set(String(Number(country.ccn3)), {
    id: String(Number(country.ccn3)),
    cca2: country.cca2,
    name: country.translations.deu?.common ?? country.name.common,
    flag: country.flag,
    capital: country.capital?.[0] ? (CAPITALS_DE[country.capital[0]] ?? country.capital[0]) : "",
    region: REGIONS_DE[country.region] ?? country.region,
    latlng: country.latlng.map((value) => Math.round(value * 100) / 100),
    area: country.area,
  });
}

// Nur Metadaten zu Gebieten mitliefern, die auch in der Topologie vorkommen.
const meta = topology.objects.countries.geometries
  .map((geometry) => byNumericCode.get(String(Number(geometry.id))))
  .filter(Boolean);

/**
 * Gezählt wird, was sich tatsächlich auswählen lässt. Die Topologie enthält
 * mehr Geometrien als es Metadatensätze gibt (Somaliland, Kosovo, Nordzypern,
 * Indian Ocean Ter., Siachen Glacier) — diese Flächen reagieren auf einen Klick
 * nicht und dürfen deshalb nicht mitgezählt werden.
 */
const territoryCount = meta.length;
const geometryCount = topology.objects.countries.geometries.length;
const germany = byNumericCode.get("276");
if (!germany) throw new Error("Deutschland (ccn3 276) fehlt in world-countries");

mkdirSync(join(root, "public/data"), { recursive: true });
writeFileSync(join(root, "public/data/world.json"), JSON.stringify({ topology, meta }));

writeFileSync(
  join(root, "app/data/world-constants.ts"),
  `// Automatisch erzeugt von scripts/build-world-data.mjs — nicht von Hand ändern.
import type { WorldCountryMeta } from "./world-types";

/** Anzahl der auswählbaren Gebiete in public/data/world.json (mit Metadaten). */
export const WORLD_TERRITORY_COUNT = ${territoryCount};

/** Startauswahl des Globus; wird gebraucht, bevor die Weltdaten geladen sind. */
export const DEFAULT_COUNTRY: WorldCountryMeta = ${JSON.stringify(germany, null, 2)};
`,
);

const bytes = JSON.stringify({ topology, meta }).length;
console.log(
  `world.json: ${(bytes / 1024).toFixed(1)} kB · ${geometryCount} Geometrien · ${territoryCount} auswählbare Gebiete · ` +
    `Punkte ${pointsBefore} → ${pointsAfter} · geschützte Bögen ${protectedArcs.size}`,
);
if (repaired.length > 0) console.log(`unvereinfacht belassen: ${repaired.join(", ")}`);
