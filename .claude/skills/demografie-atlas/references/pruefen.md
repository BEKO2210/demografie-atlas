# Prüfen im Browser

`npm run check` deckt alles ab, was sich an Dateien ablesen lässt. Was ein
Besucher erlebt, muss man ansehen. Diese Prüfung gehört vor jede Veröffentlichung.

## Vorbereitung

Der Export liegt unter `out/`, ausgeliefert wird aber unter einem Unterpfad.
Deshalb einen Symlink bauen, sonst laufen alle Adressen ins Leere:

```bash
mkdir -p /tmp/atlas && ln -sfn "$PWD/out" /tmp/atlas/demografie-atlas
(cd /tmp/atlas && python3 -m http.server 8480 &)
```

Aufruf dann über `http://localhost:8480/demografie-atlas/`.

Werkzeug ist `agent-browser` (vorher `agent-browser skills get core` lesen).
Immer eine eigene Sitzung nehmen, sonst kommen sich parallele Läufe in die Quere:

```bash
agent-browser --session pruefung set viewport 412 915
agent-browser --session pruefung open "http://localhost:8480/demografie-atlas/"
```

Zwischen Durchläufen mit geänderter CSS eine **frische Sitzung** starten — der
Browser cacht die Stylesheet-Datei, wenn ihr Name gleich bleibt.

## Auflösungen

360×800 · 390×844 · 412×915 · 768×1024 · 1440×900

Je Auflösung und Route prüfen:

- kein waagerechtes Scrollen (`scrollWidth === clientWidth`)
- keine abgeschnittenen oder überlappenden Texte
- keine leere Fläche über 120 px zwischen Abschnitten
- Globus vollständig sichtbar, Statuskarte nicht angeschnitten
- Schaltflächen nebeneinander gleich breit

Für die Leerflächen gibt es ein Muster: alle Elemente mit Text oder Bild
einsammeln, nach oberer Kante sortieren, und die Lücken zwischen dem bisher
erreichten unteren Rand und dem nächsten Element messen. Wichtig dabei: erst
einmal durch die ganze Seite scrollen, sonst stehen die Reveal-Elemente noch
auf Deckkraft null und werden übersehen.

## Abläufe

- **Globus:** drehen mit der Maus, waagerecht wischen am Telefon, zwei Finger
  zoomen, Land anklicken → Karte erscheint mit Name, Region, Hauptstadt.
  Pfeil- und Zoomtasten der Bedienleiste.
- **Flaggenstreifen:** läuft von selbst, hält beim Drücken an, lässt sich von
  Hand schieben, ein Klick wählt das Land auf dem Globus.
- **Pyramide:** Wiedergabe, Pause, Jahresregler, Geschwindigkeit, Tooltip.
  Nach dem Pausieren darf keine Bildschleife weiterlaufen.
- **Kinderrechner:** Regler, vier Vorgaben, Balken, Statuswort.
- **Sprungmarken:** jeder Menüpunkt landet mit der Überschrift unter der
  Navigationsleiste, nicht darunter oder darüber. Auch beim Direktaufruf mit
  Anker in der Adresse.
- **Ohne WebGL:** mit einem Startskript `HTMLCanvasElement.prototype.getContext`
  für WebGL auf `null` setzen und prüfen, dass der SVG-Globus erscheint und
  bedienbar ist.

## Barrierefreiheit

axe-core ist global installiert. Einspielen und laufen lassen:

```bash
agent-browser --session pruefung eval "$(cat /home/belkis/.nvm/versions/node/*/lib/node_modules/axe-core/axe.min.js)"
agent-browser --session pruefung eval "axe.run().then(r => JSON.stringify(r.violations.map(v => v.id)))"
```

Zusätzlich von Hand: mit Tab durch die Seite, Fokusring immer sichtbar,
Sprunglink als erstes Ziel, Globus über seine Schaltflächen bedienbar.

## Reduzierte Bewegung

```bash
agent-browser --session pruefung set media dark reduced-motion
```

Dann muss gelten: der Globus rendert nicht von selbst, der Flaggenstreifen läuft
nicht, die Pyramide springt ohne Nachlauf auf den Zielwert — und alles bleibt
vollständig bedienbar.

## Konsole und Netz

```bash
agent-browser --session pruefung console
agent-browser --session pruefung errors
```

Beides muss leer sein. Kein 404 im Netzwerkmitschnitt, kein Aufruf an einen
fremden Host — die Seite kommt ohne externe Schriften, Zähler oder Einbettungen aus.

## Was vor jedem Push zusätzlich stimmen muss

- `npm run check` grün
- Änderungen an Abhängigkeiten mit `npm ci` gegengeprüft
- keine Testbilder oder Zwischendateien im Arbeitsverzeichnis
  (schon zweimal sind Screenshots ins Repository gerutscht)
