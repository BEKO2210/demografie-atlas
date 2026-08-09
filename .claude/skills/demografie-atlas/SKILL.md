---
name: demografie-atlas
description: Arbeitsweise für das Repository Demografie Atlas (Next.js, statischer Export auf GitHub Pages, interaktiver WebGL-Globus, Länder-Datenstories). Nutze diesen Skill bei jeder Aufgabe in diesem Projekt — auch bei scheinbaren Kleinigkeiten wie einer Textänderung, einem Abstand oder einem neuen Bild. Besonders wichtig bei: neues Land hinzufügen, Globus oder Weltdaten anfassen, Flaggen, Bildatlanten, Abstände und Responsive-Arbeit, Deployment, Prüfung vor der Veröffentlichung. Das Projekt hat mehrere Fallen, die Stunden kosten, wenn man sie nicht kennt.
---

# Demografie Atlas

Ein interaktiver Atlas über Altersstrukturen und demografische Projektionen.
Deutschland ist als vollständige Datenstory ausgebaut, die übrigen Länder haben
bisher nur Vorschauseiten.

Live: https://beko2210.github.io/demografie-atlas/

## Zuerst: prüfen, nicht raten

```bash
npm run check
```

Das ist keine Formalie. Der Befehl prüft Typen, Lint, Tests und baut den
Pages-Export — und stellt dann Fragen an den Ordner `out/`, also an das, was
Besucher wirklich bekommen: Sind alle Routen da? Fehlt eine referenzierte Datei?
Steht irgendwo noch eine Emoji-Flagge? Hat jede Seite genau eine H1? Bleibt die
Startseite unter 250 kB Initial-JavaScript?

Läuft alles durch, zeigt der Befehl am Ende, **welche Länder noch offen sind**.

Nach jeder eigenen Änderung erneut laufen lassen. Mit `--skip-build` nutzt er
einen vorhandenen Export und ist in Sekunden durch.

Was der Befehl nicht sehen kann, prüfst du im Browser: Bedienbarkeit, Umbrüche,
Bewegung. Dafür gibt es `references/pruefen.md`.

## Wie das Projekt gebaut ist

`references/architektur.md` beschreibt den Datenfluss im Detail. Das Wichtigste:

- **Zwei Bauwege.** Ausgeliefert wird über `GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/demografie-atlas npx next build`. Der Befehl `npm run build` ist etwas anderes — der Cloudflare-Pfad aus dem Ursprungsgerüst. Wenn du „bauen" sagst, meinst du fast immer den Pages-Build.
- **Alles läuft unter einem Unterpfad.** Jede interne Adresse muss durch `sitePath()`. Ein hartes `/assets/...` funktioniert lokal und bricht live.
- **Server Components mit kleinen Inseln.** Interaktiv sind nur Globus, Bevölkerungspyramide, Kinderrechner, Scrollfortschritt, Reveal-Beobachter, Zeiger-Lichtfleck und der Flaggenstreifen. Alles andere ist statisch — und soll es bleiben. Eine Zeile `"use client"` an der falschen Stelle zieht eine ganze Seite ins Bündel.
- **Schwere Daten sind Assets, kein Quelltext.** Weltgeometrie, Ländermetadaten, Globustextur, Flaggen-Sprite und Bildatlanten liegen in `public/` und werden geladen, nicht importiert. Erzeugt werden sie von `npm run build:assets`.

## Die Regeln, die nicht verhandelbar sind

Diese Punkte sind mehrfach teuer erkauft worden:

1. **Keine Emoji-Flaggen.** Windows zeigt sie als zwei Buchstaben. Es gibt `CountryFlag` und 235 SVGs unter `public/flags/`.
2. **Kein Land bekommt auf der Startseite eine Sonderrolle.** Der Globus startet neutral, alle Gebiete tragen dieselbe Farbe, nichts ist vorausgewählt. Hervorgehoben wird nur, was der Besucher berührt oder anklickt.
3. **Keine erfundenen Zahlen.** Jede Zahl stammt aus einer amtlichen Quelle oder wird sichtbar als Modell gekennzeichnet. Fehlt eine Angabe, bleibt sie weg.
4. **Keine internen Abkürzungen im Text.** „Variante 2 · G2L2W2" stand monatelang unerklärt auf der Seite. Wer zum ersten Mal kommt, versteht kein Fachvokabular.
5. **Die Statuskarte des Globus darf nicht abgeschnitten werden.** `overflow: hidden` gehört ausschließlich auf `.globe-canvas`.
6. **Keine Abhängigkeit hinzufügen, ohne danach `npm ci` zu prüfen.** Warum, steht in `references/fallen.md` — und es hat zweimal den Deploy zerlegt.

## Ein neues Land ausbauen

Der häufigste größere Auftrag. Vollständige Anleitung: `references/neues-land.md`.

Der Kern in zwei Sätzen: **Jedes Land zeigt dieselben Informationen wie
Deutschland — Altersstruktur, Projektionskorridor, Kinderzahl, Methodik,
amtliche Quellen. Aber jedes Land bekommt seine eigene Gestaltung.**

Keine Kopie der Deutschland-Seite mit ausgetauschten Zahlen. Japan darf sich
anders anfühlen als Frankreich: eigene Farbwelt, eigene Bewegungssprache, eigene
Bildwelt, gern ein eigener Einfall für die Hauptdarstellung. Was gleich bleibt,
ist der Informationsgehalt und die Qualität — nicht die Form.

Der gestalterische Anspruch steht in `references/gestaltung.md`. Kurz: die Seite
soll aussehen, als hätte eine teure Agentur sie gebaut. Wer nur ein Farbschema
tauscht, hat die Aufgabe nicht verstanden.

## Die Fallen

`references/fallen.md` — vor jeder längeren Sitzung überfliegen. Darin unter
anderem: warum CSS-Änderungen manchmal nicht im Build ankommen, warum ein
`npm install` den Deploy zerstört, warum 35 Länder sich nicht hervorheben
ließen, und warum ein einzelnes Gebiet einmal den halben Globus überzog.

## Prüfen im Browser

`references/pruefen.md` — die Abläufe, die kein Skript abdecken kann, mit den
konkreten Befehlen: fünf Auflösungen, Klickpfade, Tastaturbedienung,
Barrierefreiheit, reduzierte Bewegung, Konsole und Netzwerk.

## Veröffentlichen

Erst wenn `npm run check` grün ist und die Browserprüfung sitzt:

```bash
git add -A && git commit && git push origin main
gh run watch --repo BEKO2210/demografie-atlas --exit-status
```

Der Betreiber will vor jedem Push gefragt werden. Halte dich daran, auch wenn
die Änderung klein wirkt.
