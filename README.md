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
npm run lint
npx tsc --noEmit
npm run build
GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/demografie-atlas npx next build
```

Der letzte Befehl erzeugt den statischen GitHub-Pages-Export in `out/`.

## GitHub Pages

Der Workflow baut bei jedem Push auf `main`. Im Repository muss unter **Settings → Pages → Build and deployment** die Quelle **GitHub Actions** gewählt sein. Der erwartete Projektname ist `demografie-atlas`; ein anderer Repository-Name funktioniert ebenfalls, weil der Workflow den `basePath` aus dem Repository-Namen ableitet.

## Rechtliches

Impressum und Datenschutzerklärung sind mit den echten Betreiberangaben ausgefüllt (privates, nicht-kommerzielles Projekt, kein Tracking).

Live: https://beko2210.github.io/demografie-atlas/

Die technische Übergabe mit exakten GitHub-Schritten und Architekturhinweisen steht in [`CLAUDE_HANDOFF.md`](./CLAUDE_HANDOFF.md).

## Weltdaten und Rauschtextur neu erzeugen

```bash
npm run build:assets
```

Erzeugt `public/data/world.json` (vereinfachte 50m-Topologie plus kompakte Ländermetadaten)
und `public/assets/noise.png`. Beide Dateien sind eingecheckt; der Befehl ist nur nötig,
wenn `world-atlas` oder `world-countries` aktualisiert werden. Der Generator prüft selbst,
dass alle 241 Gebiete Fläche behalten, und lässt betroffene Bögen sonst unvereinfacht.
