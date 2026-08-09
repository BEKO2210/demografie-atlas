# Arbeiten an diesem Projekt

Demografie Atlas — Next.js, statischer Export auf GitHub Pages, interaktiver
WebGL-Globus, Länder-Datenstories.
Live: https://beko2210.github.io/demografie-atlas/

## Fang hier an

```bash
npm ci
npm run check
```

`npm run check` ist die Pflichtprüfung: Typen, Lint, Tests, Pages-Build — und
dann Fragen an den fertigen Export, also an das, was Besucher wirklich bekommen.
Läuft alles durch, zeigt der Befehl am Ende, **welche Länder noch offen sind**.

Erst danach anfangen zu arbeiten. Das Projekt hat mehrere Fallen, die Stunden
kosten, wenn man sie nicht kennt.

## Die ausführliche Anleitung

Sie liegt als Skill im Repository und wird von Claude Code automatisch geladen:

```
.claude/skills/demografie-atlas/
  SKILL.md                    Arbeitsweise, Regeln, Einstieg
  references/architektur.md   Wo was liegt, wie die Seite lädt
  references/fallen.md        Zehn Fallen, jede davon teuer erkauft
  references/neues-land.md    Schritt für Schritt ein Land ausbauen
  references/gestaltung.md    Der gestalterische Anspruch
  references/pruefen.md       Browserprüfung mit konkreten Befehlen
```

Arbeitest du mit einem anderen Werkzeug: lies dieselben Dateien von Hand,
beginnend mit `SKILL.md`.

## Die kurze Fassung

**Bauen** — ausgeliefert wird über

```bash
GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH=/demografie-atlas npx next build
```

`npm run build` ist etwas anderes, nämlich der Cloudflare-Pfad aus dem
Ursprungsgerüst. Bei CSS-Arbeit vorher `rm -rf .next`, sonst misst du am alten
Stand.

**Nicht verhandelbar**

1. Keine Emoji-Flaggen — es gibt `CountryFlag` und 235 SVGs unter `public/flags/`.
2. Kein Land bekommt auf der Startseite eine Sonderrolle. Der Globus startet neutral.
3. Keine erfundenen Zahlen. Amtliche Quelle oder sichtbar als Modell gekennzeichnet.
4. Keine internen Abkürzungen im sichtbaren Text.
5. Jede interne Adresse durch `sitePath()` — sonst bricht sie unter dem Unterpfad.
6. Keine Abhängigkeit hinzufügen, ohne danach `npm ci` zu prüfen. Das hat den
   Deploy schon zweimal zerlegt.
7. Vor dem Push fragen. Auch bei kleinen Änderungen.

## Ein Land ausbauen

Der Kern in zwei Sätzen: **Jedes Land zeigt dieselben Informationen wie
Deutschland — Altersstruktur, Projektionskorridor, Kinderzahl, Methodik,
amtliche Quellen. Aber jedes Land bekommt seine eigene Gestaltung.**

Keine Kopie mit ausgetauschten Zahlen und keine billige Seite: eigene Farbwelt,
eigene Bewegungssprache, eigene Bildwelt, gern ein eigener Einfall für die
Hauptdarstellung. Der Anspruch steht in `references/gestaltung.md`, die Schritte
in `references/neues-land.md`.

Welche Länder offen sind, sagt dir `npm run check`.
