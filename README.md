# Demografie Atlas

Ein interaktiver, erweiterbarer Demografie-Atlas mit moderner Länder-Startseite, anklickbarer 3D-Weltkarte und einer vollständigen Deutschland-Story bis 2070.

## Enthalten

- globale Startseite unter `/`
- WebGL-Globus mit anklickbaren Ländern und automatischem SVG-Fallback
- zentrale Länder-Registry in `app/data/countries.ts`
- Deutschland-Atlas unter `/deutschland`
- interaktive Bevölkerungspyramide 2025–2070
- Kinderzahl-Simulator mit responsiver Generationen-Grafik
- gemeinsame Seiten `/impressum` und `/datenschutz`
- GitHub-Pages-Workflow unter `.github/workflows/deploy-pages.yml`
- alternative OpenAI-Sites-Konfiguration in `.openai/hosting.json`

## Lokal starten

Voraussetzung: Node.js 22.13 oder neuer.

```bash
npm ci
npm run dev
```

## Prüfen

```bash
npm run check
```

Die Pflichtprüfung: Typen, Lint, Tests, Pages-Build — und danach Fragen an den
fertigen Export in `out/`, also an das, was Besucher wirklich bekommen. Läuft
alles durch, zeigt sie am Ende, welche Länder noch offen sind.

Einzeln geht auch: `npm run build` (Pages-Export), `npm test`, `npm run lint`.

## GitHub Pages

Der Workflow baut bei jedem Push auf `main`. Im Repository muss unter **Settings → Pages → Build and deployment** die Quelle **GitHub Actions** gewählt sein. Der erwartete Projektname ist `demografie-atlas`; ein anderer Repository-Name funktioniert ebenfalls, weil der Workflow den `basePath` aus dem Repository-Namen ableitet.

## Rechtliches

Impressum und Datenschutzerklärung sind mit den echten Betreiberangaben ausgefüllt (privates, nicht-kommerzielles Projekt, kein Tracking).

Live: https://beko2210.github.io/demografie-atlas/

## Mitarbeiten

Die Arbeitsweise, die Fallen des Projekts und die Anleitung für ein neues Land
stehen in [`AGENTS.md`](./AGENTS.md) und ausführlich unter
`.claude/skills/demografie-atlas/`. Claude Code lädt das automatisch; mit
anderen Werkzeugen liest man dieselben Dateien von Hand.

Kurz gesagt: **Jedes Land zeigt dieselben Informationen wie Deutschland, bekommt
aber seine eigene Gestaltung.**

## Weltdaten und Rauschtextur neu erzeugen

```bash
npm run build:assets
```

Erzeugt `public/data/world.json` (vereinfachte 50m-Topologie plus kompakte Ländermetadaten)
und `public/assets/noise.png`. Beide Dateien sind eingecheckt; der Befehl ist nur nötig,
wenn `world-atlas` oder `world-countries` aktualisiert werden. Der Generator prüft selbst,
dass alle 241 Gebiete Fläche behalten, und lässt betroffene Bögen sonst unvereinfacht.
