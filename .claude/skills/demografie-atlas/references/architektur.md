# Architektur

## Wo was liegt

```
app/
  page.tsx                      Startseite (Server Component)
  layout.tsx                    Metadaten, Schriften, strukturierte Daten
  sitemap.ts, robots.ts         beide brauchen export const dynamic = "force-static"
  globals.css                   Designsystem, ~800 Zeilen, alle Routen
  mobile-nav.css                mobile Navigation, Sprunglink, Regler-Feinheiten
  deutschland/                  die einzige ausgebaute Datenstory
    components/
      population-pyramid.tsx    Pyramide, schreibt Balken direkt ins DOM
      projection-model.ts       Kohortenmodell, Konstanten NBSP und MINUS
      fertility-simulator.tsx   Kinderzahl-Rechner
      projection-chart.tsx      statisches SVG-Diagramm
      scroll-progress.tsx       Fortschrittsbalken ohne React-Zustand
  frankreich/ italien/ …        Vorschauseiten, noindex
  components/
    interactive-world.tsx       Hülle des Globus: lädt nach, hält die Auswahl
    world/
      webgl-globe.tsx           Three.js, nur im Lazy-Chunk
      svg-globe.tsx             Rückfall ohne WebGL
      hit-test.ts               Kugelpunkt → Land
      load-world-data.ts        holt public/data/world.json
      shared.ts                 featureId() und Vertrag der Renderer
      selection-context.tsx     verbindet Flaggenstreifen mit Globus
    country-flag.tsx            SVG-Flagge statt Emoji
    flag-ticker.tsx             Laufstreifen über alle Gebiete
    atlas-art.tsx               Bildquadranten, AVIF mit WebP-Rückfall
  data/
    countries.ts                Länder-Registry — Quelle für Karten und Sitemap
    country-previews.ts         Texte der Vorschauseiten
    world-constants.ts          erzeugt: Anzahl Gebiete, Startauswahl
    flag-sprite.ts              erzeugt: Position jeder Flagge im Sprite
    seo.ts                      Titel, Beschreibungen, kanonische Adressen
public/
  data/world.json               Topologie + Ländermetadaten (~270 kB)
  assets/globe-texture*.png     Weltkarte als Textur, 8k und 4k
  assets/flag-sprite.webp       235 Flaggen in einer Datei
  flags/*.svg                   Einzelflaggen für Karten und Tooltips
scripts/
  check.mjs                     die Pflichtprüfung
  build-world-data.mjs          Topologie vereinfachen, Metadaten kürzen
  build-globe-texture.mjs       Weltkarte in eine Textur backen
  build-flag-sprite.mjs         Flaggen zu einem Sprite zusammenfassen
  build-flags.mjs               Flaggen aus flag-icons kopieren (auf Zuruf)
  build-noise.mjs               Rauschtextur
  build-avif.mjs                AVIF-Fassungen der Bildatlanten
```

## Wie die Startseite lädt

1. HTML und CSS kommen sofort, ebenso der gesamte statische Inhalt.
2. Etwa 188 kB gzip JavaScript für React und die wenigen Inseln.
3. Der Globus lädt **erst**, wenn er sichtbar ist und der Browser Luft hat —
   `IntersectionObserver` plus `requestIdleCallback` mit 2 s Grenze. Bei
   Bedienung sofort.
4. Erst dann kommen Three.js, die Weltdaten und die Globustextur.
5. Geräte ohne WebGL laden Three.js nie; sie bekommen den SVG-Globus.

Diese Reihenfolge ist der Grund, warum die Startseite trotz 3D-Globus schnell
ist. Wer sie durchbricht — etwa durch einen direkten Import von `three` in einer
Server Component — macht die Arbeit zunichte. `npm run check` merkt es.

## Erzeugte Dateien

`npm run build:assets` erzeugt alles unter `public/`, was nicht von Hand
geschrieben ist, plus zwei TypeScript-Dateien unter `app/data/`. Diese Dateien
sind eingecheckt: der Actions-Runner soll sie nicht erzeugen müssen.

Nötig ist der Befehl nur, wenn sich die Quelldaten ändern — also `world-atlas`,
`world-countries` oder die Bildatlanten. Danach prüfen, was die Skripte melden;
`build-world-data.mjs` sagt etwa, welche Gebiete es unvereinfacht lassen musste.

## Der Globus im Detail

Die Länder liegen als **Textur** auf einer Kugel, nicht als Geometrie. Vorher
legte three-globe je Polygonring ein eigenes Mesh an — bei 241 Gebieten über
8000 Zeichenaufrufe pro Bild und rund ein Bild pro Sekunde. Als Textur sind es
14 Zeichenaufrufe.

Echte Geometrie bekommen nur das Land unter dem Zeiger und das ausgewählte. Die
Auswahl läuft deshalb geometrisch: Bildschirmpunkt → `toGlobeCoords` →
Bounding-Box-Vorfilter → `geoContains`.

Die Textur hängt an `emissiveMap`, nicht an `map`. An `map` würde die
Szenenbeleuchtung sie abdunkeln und die Kontinente verschwänden im Ozean.

## Was ausgeliefert wird

GitHub Pages, gebaut vom Workflow in `.github/workflows/deploy-pages.yml`. Der
`basePath` kommt aus dem Repository-Namen. Zwei Dinge, die dort nicht
funktionieren: eigene Cache-Header und `_headers`-Dateien. Gehashte Dateien
bekommen `max-age=600`, mehr ist nicht einstellbar.

## Befehle

| Befehl | Was er tut |
|---|---|
| `npm run check` | die Pflichtprüfung — Typen, Lint, Tests, Pages-Build, Fragen an den Export |
| `npm run build` | der Pages-Build, mit gesetztem basePath |
| `npm run dev` | Entwicklungsserver ohne basePath |
| `npm test` | Prüfungen gegen den Export in `out/` |
| `npm run lint` | ESLint |
| `npm run build:assets` | erzeugt Weltdaten, Globustextur, Flaggen-Sprite, Rauschtextur, AVIF |

Das Projekt entstand aus einer Vorlage mit Cloudflare-Workern und
Datenbankanbindung. Dieses Gerüst ist entfernt — `worker/`, `db/`, `drizzle/`,
`examples/`, `build/`, `.openai/`, die `sites-*`-Skripte und die zugehörigen
Abhängigkeiten. Wer in älteren Commits darauf stößt: es hat nie etwas
ausgeliefert.
