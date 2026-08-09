# Fallen in diesem Projekt

Jeder Eintrag hier hat echte Zeit gekostet. Sie stehen nach Häufigkeit sortiert.

## 1 Ein `npm install` zerlegt den Deploy

**Was passiert:** Du fügst eine Abhängigkeit hinzu oder verschiebst eine zwischen
`dependencies` und `devDependencies`. Lokal läuft alles. Der Actions-Lauf bricht ab:

```
npm ci can only install packages when your package.json and package-lock.json are in sync
Missing: @emnapi/core@… from lock file
```

**Warum:** `npm install` schreibt die Lockfile für *deine* Plattform neu und wirft
dabei optionale Einträge anderer Plattformen raus, die der Linux-Runner braucht.

**Was hilft:** Die Lockfile nicht fortschreiben, sondern neu aufbauen:

```bash
rm -f package-lock.json && npm install
npm ci        # muss durchlaufen, sonst wird der Deploy rot
```

Ein inkrementelles `npm install` schreibt hier zuverlässig eine Lockfile, die
`npm ci` anschließend ablehnt; ein vollständiger Neuaufbau nicht. Nach **jeder**
Änderung an den Abhängigkeiten `npm ci` lokal prüfen — das sagt dasselbe wie der
Actions-Runner, nur zwei Minuten früher.

Geht es trotzdem schief: Lockfile aus dem letzten funktionierenden Commit
zurückholen (`git show HEAD~1:package-lock.json > package-lock.json`).

**Konkret:** `flag-icons` ist bewusst **keine** Abhängigkeit des Projekts. Die
Flaggen liegen fertig in `public/flags/`. Wer sie neu erzeugen will, installiert
das Paket vorübergehend selbst — so steht es auch in `scripts/build-flags.mjs`.

## 2 CSS-Änderungen kommen nicht im Build an

**Was passiert:** Du änderst `app/globals.css`, baust, misst — nichts ändert sich.
Du änderst mehr, misst wieder, immer noch nichts. Nach einer Stunde merkst du,
dass du die ganze Zeit den alten Stand gemessen hast.

**Was hilft:** Bei CSS-Arbeit `rm -rf .next` vor dem Bauen. Und im Zweifel im
gebauten Ergebnis nachsehen, ob die Regel wirklich drin ist:

```bash
grep -o "deineRegel" $(find out -name "*.css" | head -1)
```

Zusätzlich cacht der Testbrowser die CSS-Datei, wenn ihr Name gleich bleibt.
Bei hartnäckigen Fällen eine frische Browsersitzung nehmen (`agent-browser --session neu …`).

## 3 Spätere Media Queries hebeln frühere auf

**Was passiert:** Du setzt in `@media (max-width: 760px)` einen kleineren Abstand.
Bei 412 px passiert nichts.

**Warum:** Weiter unten in der Datei steht ein `@media (max-width: 480px)`-Block,
der denselben Selektor nochmal setzt. Bei 412 px greifen beide, der spätere gewinnt.

**Was hilft:** Vor dem Ändern nach *allen* Vorkommen des Selektors suchen:

```bash
grep -n "\.section {" app/globals.css
```

## 4 Kennungen der Weltdaten sind nicht einheitlich

**Was passiert:** Ein Land lässt sich anklicken, die Karte erscheint, aber es
leuchtet auf dem Globus nicht auf.

**Warum:** Die Topologie führt Algerien als `"012"`, die Metadaten als `"12"`.
Betroffen war jedes Land mit Nummer unter 100 — 35 von 241.

**Was hilft:** Immer `featureId()` aus `app/components/world/shared.ts` benutzen.
Die Funktion normalisiert. Nie roh `feature.id` mit einer Metadaten-Kennung vergleichen.

## 5 Geometrie vereinfachen kann Länder zerstören

**Was passiert:** Nach dem Vereinfachen der Weltkarte überzog Kiribati die
gesamte Kugel — ein Klick auf Afrika wählte Kiribati aus. Ein anderes Mal fiel
die Grundlinie der Antarktis in sich zusammen.

**Warum:** Kiribati liegt beidseits der Datumsgrenze. Fällt dort ein Ring
zusammen, deutet d3 ihn als Komplement — also als „alles außer".

**Was hilft:** `scripts/build-world-data.mjs` prüft das selbst: es vergleicht
jede Fläche mit dem Original und lässt betroffene Bögen unvereinfacht. Diese
Prüfung nicht entfernen. Wer an der Vereinfachung schraubt, muss danach die
Ausgabe lesen — sie meldet, welche Gebiete geschützt wurden.

Ebenso wenig darf ein Gebiet die Fläche null bekommen: dann ist es nicht mehr
anklickbar. Deshalb steht die Quantisierung auf 32768 und nicht gröber — beim
Vatikan und bei Ashmore-und-Cartier ist das die Grenze.

## 6 Die runde Globusmaske schneidet Bedienelemente ab

**Was passiert:** Eine Leiste im Globusbereich ist an den Enden abgeschnitten.

**Warum:** `.globe-canvas` hat `border-radius: 50%` und `overflow: hidden`. Alles
darin wird kreisförmig beschnitten.

**Was hilft:** Bedienelemente gehören nicht in die Maske. Es gibt dafür einen
Behälter außerhalb (`.globe-toolbar`); die Renderer hängen ihre Leiste per
Portal dort hinein.

## 7 Ein Finger gehört der Seite, nicht dem Globus

**Was passiert:** Entweder dreht der Globus und die Seite lässt sich am Telefon
nicht mehr scrollen — oder Wischen tut gar nichts.

**Warum:** Beides sind Einstellungen in OrbitControls plus `touch-action`.
`ONE: TOUCH.PAN` bei abgeschaltetem Pan bedeutet: nichts passiert.

**Was hilft:** `ONE: TOUCH.ROTATE`, `TWO: TOUCH.DOLLY_ROTATE`, dazu
`touch-action: pan-y` auf dem Canvas. Dann dreht waagerechtes Wischen den
Globus, senkrechtes scrollt die Seite, zwei Finger zoomen.

## 8 `content-visibility: auto` bricht Sprungmarken

Beim Direktaufruf von `/deutschland/#methodik` landete der Sprung 288 px daneben,
weil die Platzhalterhöhen nicht der Wirklichkeit entsprechen. Wurde geprüft und
wieder entfernt. Nicht erneut einbauen, ohne die Sprungmarken zu messen.

## 9 Metadaten-Dateien im App-Ordner

Eine Datei `app/components/icon.tsx` bricht den Build: Next hält jede Datei
namens `icon` in einem Ordner unter `app/` für ein Favicon. Sie heißt deshalb
`ui-icon.tsx`. Gleiches gilt für `apple-icon`, `opengraph-image`, `sitemap`,
`robots` an unerwarteten Stellen.

## 10 `robots.ts` und `sitemap.ts` brauchen eine Kennzeichnung

Beim statischen Export verlangt Next in beiden Dateien
`export const dynamic = "force-static"`, sonst bricht der Build ab.
