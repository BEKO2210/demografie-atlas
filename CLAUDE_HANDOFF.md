# Übergabe an Claude: Demografie Atlas

## Auftrag

Dieses ZIP enthält den vollständigen aktuellen Quellstand. Ziel ist ein öffentliches GitHub-Repository und eine funktionierende GitHub-Pages-Seite für einen erweiterbaren weltweiten Demografie-Atlas.

Bevor du Änderungen machst, lies diese Datei vollständig. Bewahre Design, Animationen, Fallbacks und die bestehende Länderstruktur. Keine persönlichen Daten erfinden und keine rechtlichen Platzhalter stillschweigend veröffentlichen.

## Ziel-Repository

- GitHub-Konto: `BEKO2210`
- vorgeschlagener Repository-Name: `demografie-atlas`
- vorgeschlagene URL: `https://github.com/BEKO2210/demografie-atlas`
- erwartete Pages-URL: `https://beko2210.github.io/demografie-atlas/`

Das Repository existierte bei Erstellung dieses Pakets noch nicht. Lege es als **öffentliches, leeres Repository** an, ohne automatisch erzeugte README, Lizenz oder `.gitignore`.

## Exakter GitHub-Ablauf

Nach dem Entpacken im Projektordner:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run build
GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/demografie-atlas npx next build

git init
git add .
git commit -m "Launch global demographics atlas"
git branch -M main
git remote add origin https://github.com/BEKO2210/demografie-atlas.git
git push -u origin main
```

Danach auf GitHub:

1. **Settings → Pages** öffnen.
2. Unter **Build and deployment** die Quelle **GitHub Actions** wählen.
3. Den Workflow **Deploy Demografie Atlas to GitHub Pages** abwarten.
4. Die Pages-URL öffnen und `/`, `/deutschland/`, `/impressum/` und `/datenschutz/` prüfen.

Der vorhandene Workflow `.github/workflows/deploy-pages.yml` setzt `GITHUB_PAGES=true` und leitet `NEXT_PUBLIC_BASE_PATH` automatisch aus dem Repository-Namen ab. `next.config.ts` aktiviert nur in diesem Modus den statischen Export, `basePath`, `assetPrefix`, `trailingSlash` und unoptimierte Bilder.

## Produktstruktur

| Route | Zweck |
|---|---|
| `/` | eigenständige globale Atlas-Startseite |
| `/deutschland` | vollständige Deutschland-Demografie-Story |
| `/impressum` | gemeinsames Impressum für alle Länder |
| `/datenschutz` | gemeinsame Datenschutzerklärung |

Wichtige Dateien:

- `app/page.tsx`: globale Startseite
- `app/components/interactive-world.tsx`: WebGL-Globus und D3/SVG-Fallback
- `app/data/countries.ts`: zentrale Länder-Registry
- `app/data/site.ts`: `sitePath()` für basePath-sichere interne URLs
- `app/deutschland/page.tsx`: Deutschland-Seite
- `app/deutschland/components/demography-experience.tsx`: Pyramide und Rechner
- `app/components/atlas-footer.tsx`: gemeinsamer Footer
- `app/components/legal-shell.tsx`: gemeinsames Layout der Rechtstexte
- `app/globals.css`: Designsystem und responsive Zustände

## Weltkarte

Die Startseite enthält eine echte interaktive Weltkarte:

- WebGL über `react-globe.gl` und `three`
- 204 anklickbare Länderpolygone aus `world-atlas`
- Länder-Metadaten aus `world-countries`
- automatische Feature-Erkennung für WebGL
- interaktiver orthografischer D3/SVG-Fallback bei deaktiviertem WebGL
- Ziehen zum Drehen, Hover, Auswahl, Fokusmarker und Statuskarte

Die Länder-Statuskarte liegt absichtlich **oberhalb** der runden Globus-Maske. `overflow: hidden` darf ausschließlich auf `.globe-canvas` liegen; `.interactive-world` muss `overflow: visible` behalten und `.globe-interface` einen höheren `z-index` haben. Das behebt das zuvor gemeldete Abschneiden der Karten im Globus.

Alle Länderpolygone sind auswählbar. Vollständige Inhaltsseiten werden über `app/data/countries.ts` freigeschaltet. Deutschland ist `live`; Frankreich, Italien, Japan, Südkorea und USA sind als nächste Atlas-Karten vorbereitet. Für ein neues Land:

1. neuen Registry-Eintrag in `app/data/countries.ts` ergänzen,
2. Route wie `app/<slug>/page.tsx` erstellen,
3. bei Veröffentlichung `status: "live"` und `href` setzen,
4. Texte, Datenquellen und rechtliche Hinweise des Landes prüfen.

## Deutschland-Seite und Kinder-Rechner

Die Rechner-Grafik verwendet den Eltern-/Kinder-Ausschnitt aus `public/assets/generations-atlas.webp`. Sie hat feste Seitenverhältnisse und darf auf Mobilgeräten nicht gestreckt werden:

- Desktop: Visual und Bedienelemente zweispaltig
- Tablet: verkleinerte, weiterhin proportionale Visual-Spalte
- Mobil: einspaltig, Visual in festem 4:3-Container

Die interaktive Bevölkerungspyramide animiert 2025–2070. Das Einzelaltersprofil ist ein normiertes Visualisierungsmodell; die Methodikseite erklärt die Trennung zwischen amtlichen Werten und Modellierung.

## Rechtliche Blocker

Die Dateien `app/impressum/page.tsx` und `app/datenschutz/page.tsx` sind gestaltet und technisch fertig, enthalten aber bewusst diese Platzhalter:

- `[VOLLSTÄNDIGER NAME ODER FIRMA]`
- `[STRASSE UND HAUSNUMMER]`
- `[PLZ UND ORT]`
- `[ÖFFENTLICHE KONTAKT-E-MAIL]`
- gegebenenfalls verantwortliche Person nach § 18 Abs. 2 MStV

Frage den Betreiber nach den echten Angaben und ersetze nur bestätigte Werte. Keine Profilinformationen erraten. Prüfe danach, ob zusätzliche Angaben wegen Geschäftsform, journalistisch-redaktioneller Inhalte, Tracking, Analyse, Drittanbieter-Diensten oder eigener Domain nötig sind.

## Responsive QA

Mindestens diese Viewports prüfen:

| Gerät | Viewport |
|---|---:|
| Mobil klein | 375 × 812 |
| Mobil groß | 430 × 932 |
| Tablet | 768 × 1024 |
| Desktop | 1440 × 900 |

Prüfpunkte:

- keine horizontale Scrollbar
- Globus bzw. SVG-Fallback vollständig sichtbar
- Statuskarte nicht im runden Globus abgeschnitten
- Länder-Auswahl aktualisiert Flagge, Name und Status
- Deutschland-Link öffnet `/deutschland/`
- Pyramide: Play/Pause, Slider und Tooltips
- Kinder-Rechner: Slider und Presets, unverzerrte Grafik
- Footer-Links und alle vier Routen
- `prefers-reduced-motion` respektiert

## Abnahmekommandos

Alle Befehle müssen erfolgreich sein:

```bash
npm run lint
npx tsc --noEmit
npm run build
GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/demografie-atlas npx next build
git diff --check
```

Zusätzlich die GitHub-Actions-Ausführung und die veröffentlichte Pages-URL prüfen. Keine Zugangsdaten, Build-Ordner, `node_modules`, `.next`, `out`, `dist`, `.wrangler`, `.sites-runtime` oder `*.tsbuildinfo` committen.

## Design-Leitplanken

Die globale Homepage hat bewusst eine eigene, schwarze/spektrale Art Direction und übernimmt nicht das goldene Deutschland-Design. Sie soll präzise, ruhig und hochwertig wirken: starke Typografie, tiefe Flächen, wenige kontrollierte Lichtakzente, flüssige Mikrointeraktionen. Keine generischen Dashboard-Kacheln, keine lauten Neonverläufe und keine Animation ohne funktionalen Zweck.
