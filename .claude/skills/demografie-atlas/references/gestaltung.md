# Gestaltung

Der Anspruch des Betreibers: die Seite soll aussehen, als hätte eine teure
Agentur sie gebaut. Kein Baukasten, kein Vorlagengefühl. Wer das nicht trifft,
hat die Aufgabe verfehlt — auch wenn technisch alles stimmt.

## Was die bestehende Sprache ausmacht

Bevor du etwas Neues erfindest, verstehe, warum das Vorhandene funktioniert:

- **Tiefe Flächen, wenige Lichtpunkte.** Der Hintergrund ist fast schwarz mit
  weiten, sehr schwachen Farbverläufen. Alles Helle ist knapp bemessen und
  dadurch wertvoll.
- **Typografie trägt die Seite.** Überschriften laufen bis über 100 px mit enger
  Laufweite und geringer Zeilenhöhe. Fließtext bleibt klein und ruhig. Der
  Kontrast zwischen beiden ist der Hauptreiz.
- **Bewegung hat einen Grund.** Nichts blinkt zur Dekoration. Bewegt wird, was
  etwas erklärt: die Pyramide über die Zeit, der Globus beim Drehen, ein
  Übergang beim Auftauchen.
- **Bilder verschwinden nach oben.** Illustrationen enden nicht an einer Kante,
  sie laufen in die Kartenfarbe aus.
- **Alles sitzt auf Achsen.** Der Betreiber reagiert empfindlich auf
  Schwebendes und Ausgefranstes. Zwei Schaltflächen nebeneinander haben
  dieselbe Breite oder eine erkennbar andere — nie 5 px Unterschied.

## Für ein neues Land

**Kopiere die Deutschland-Seite nicht.** Ein Farbwechsel ist keine Gestaltung.

Erlaubt und erwünscht ist ein eigener Einfall pro Land. Denkbare Richtungen —
als Anregung, nicht als Liste zum Abhaken:

- **Japan:** die Pyramide ist längst umgekehrt. Eine Darstellung, die diese
  Umkehrung zum Motiv macht, statt sie nur abzubilden.
- **Südkorea:** das Thema ist Tempo. Eine Zeitachse, die den Wandel im Vergleich
  zu anderen Ländern im Zeitraffer zeigt.
- **Italien:** die Spannweite zwischen Nord und Süd. Eine Landeskarte, die den
  Landesdurchschnitt als Illusion entlarvt.
- **Frankreich:** der direkte Vergleich. Zwei Länder in einem Bild.
- **USA:** Wanderung als Motor. Ströme statt Balken.

Was dabei nicht verhandelbar ist:

1. **Derselbe Informationsgehalt wie Deutschland.** Siehe `neues-land.md`.
2. **Lesbarkeit vor Effekt.** Textkontrast mindestens 4,5:1, keine Schrift unter
   11 px, Trefferflächen mindestens 44 px.
3. **Zuerst am Telefon.** Bei 360 px muss es genauso überzeugen wie bei 1440 px.
   Kein waagerechtes Scrollen, keine leere Fläche über 120 px.
4. **Reduzierte Bewegung wird respektiert.** Wer `prefers-reduced-motion` gesetzt
   hat, bekommt eine ruhige, aber vollständige Seite.
5. **Die Messwerte halten.** Was du an Effekt hinzufügst, darf die Startseite
   nicht über 250 kB Initial-JavaScript treiben und keine Dauerlast erzeugen,
   wenn nichts sichtbar ist. Renderschleifen pausieren außerhalb des Sichtfelds
   und bei verborgenem Tab — dafür gibt es im Globus und in der Pyramide
   fertige Muster zum Abschauen.

## Werkzeuge, die vorhanden sind

- **Bewegung:** GSAP ist nicht eingebunden. Für Übergänge reichen CSS und
  gezielte `requestAnimationFrame`-Schleifen, die sich selbst anhalten.
- **3D:** Three.js liegt bereits im Lazy-Chunk des Globus. Wer es für ein Land
  nutzt, lädt es genauso nach — nie im Bündel der Startseite.
- **Diagramme:** SVG von Hand, wie in `projection-chart.tsx`. Keine
  Diagrammbibliothek — sie kostet mehr, als sie hier bringt.
- **Bilder:** `AtlasArt` schneidet Quadranten aus 2×2-Bildatlanten, liefert AVIF
  mit WebP-Rückfall und lädt verzögert. Neue Bilder in dasselbe Muster bringen.

## Wenn du unsicher bist

Miss statt zu raten. Öffne die Deutschland-Seite und die neue nebeneinander bei
412 px und 1440 px und vergleiche: Abstände, Schriftgrößen, Kontraste,
Kartenradien. Was sich fremd anfühlt, ist entweder ein bewusster Akzent — oder
ein Fehler. Du solltest den Unterschied benennen können.
