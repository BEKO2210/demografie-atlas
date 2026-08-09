# Ein neues Land ausbauen

Bevor du anfängst: `npm run check`. Der Befehl zeigt dir am Ende, welche Länder
offen sind. Sprich mit dem Betreiber ab, welches drankommt — die Reihenfolge in
der Registry ist eine Absicht, keine Warteschlange.

## Der Grundsatz

**Gleiche Information. Eigene Form.**

Ein Besucher, der von Deutschland nach Japan wechselt, muss dieselben Fragen
beantwortet bekommen. Er darf dabei ruhig das Gefühl haben, eine andere Seite zu
betreten — aber nicht das Gefühl, weniger zu erfahren.

Was jedes Land zeigen muss:

| Baustein | Was er leistet |
|---|---|
| Kennzahlen zum Stichtag | Bevölkerung, Verteilung nach Geschlecht, Geburtenziffer, ein landestypischer Wert |
| Altersstruktur über die Zeit | interaktiv, mit Wiedergabe und Jahresregler |
| Projektionskorridor | nicht eine Linie, sondern die Spannweite der Annahmen |
| Kinderzahl im Verhältnis zum Bestandserhalt | mit Regler und verständlicher Einordnung |
| Drei Kräfte | was Geburten, Sterblichkeit und Wanderung jeweils bewirken |
| Methodik | was amtlich ist und was modelliert, offen ausgesprochen |
| Quellen | die amtliche Statistikbehörde des Landes, verlinkt |

Was frei ist: Bildsprache, Farbwelt, Bewegung, Anordnung, die Art der
Hauptdarstellung, Übergänge, Typografie-Akzente. Siehe `gestaltung.md`.

## Schritte

### 1 Daten beschaffen und belegen

Nur amtliche Quellen. Für jedes Land die nationale Statistikbehörde, ergänzend
die Vereinten Nationen für Vergleiche. Notiere zu jeder Zahl, woher sie stammt
und auf welchen Stichtag sie sich bezieht — das kommt später in den
Methodikblock.

Wenn du eine Zahl nicht belegen kannst, kommt sie nicht auf die Seite. Lieber
ein Baustein weniger als eine Behauptung.

### 2 Rechenmodell anlegen

Vorbild: `app/deutschland/components/projection-model.ts`. Es normiert eine
kalibrierte Kohortenform auf die amtlichen Summen und altert sie mit
geschlechtsabhängigen Überlebensraten auf eine amtliche Zielgröße zu.

Zwei Bedingungen, die das Modell erfüllen muss und die du nachrechnen solltest:

- Die Summe im Startjahr trifft die amtliche Bevölkerungszahl exakt.
- Der Endwert trifft die amtliche Zielgröße der mittleren Variante exakt.

Der jüngste Jahrgang wird auf die amtliche Geburtenzahl verankert. Sonst
entsteht am Übergang zwischen gemessenen und gerechneten Jahrgängen ein
sichtbarer Knick — genau das war in der Deutschland-Fassung lange der Fall.

### 3 Registry und Route

- Eintrag in `app/data/countries.ts` auf `status: "live"` setzen, `href` ergänzen.
- Die Vorschauseite ersetzen: aus `app/<slug>/page.tsx` wird die volle Story.
- Der Eintrag in `app/data/country-previews.ts` kann dann entfallen.
- `app/sitemap.ts` nimmt Länder mit `status: "live"` automatisch auf.
- Das `noindex` fällt weg, sobald echte Inhalte da sind.

### 4 Gestaltung

Lies `gestaltung.md`, bevor du die erste Zeile CSS schreibst.

### 5 Prüfen

`npm run check`, dann die Browserprüfung aus `pruefen.md` — beides muss sitzen.
Zusätzlich für ein neues Land:

- Die Kennzahlen auf der Seite stimmen mit den Quellen überein. Nachrechnen, nicht abschreiben.
- Prozentangaben ergeben zusammen 100.
- Das Modell trifft Start- und Zielwert exakt.
- Die Seite ist auch dann bedienbar, wenn WebGL fehlt.
- Die Ländertexte enthalten kein Fachvokabular ohne Erklärung.

## Ein neues Land, das noch nicht in der Registry steht

Der Globus kennt 236 auswählbare Gebiete. Jedes davon kann eine Story bekommen.
Dafür in `app/data/countries.ts` einen Eintrag ergänzen — Kürzel, Name,
einheimischer Name, Kurzbeschreibung, Akzentfarben. Das Kürzel muss dem
`cca2`-Feld in `public/data/world.json` entsprechen, sonst findet der Globus das
Land nicht.
