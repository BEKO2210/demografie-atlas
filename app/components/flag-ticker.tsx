"use client";

import { sitePath } from "../data/site";
import { SPRITE_COLUMNS, SPRITE_ROWS, spriteCountries, spritePositions } from "../data/flag-sprite";
import { useWorldSelection } from "./world/selection-context";

/**
 * Position einer Flagge im Sprite.
 *
 * Bei einem Raster aus N Spalten liegt Spalte i bei i/(N−1) der Hintergrundbreite —
 * background-position rechnet in „verbleibendem Platz", nicht in Kachelbreiten.
 */
function tileStyle(code: string) {
  const at = spritePositions[code];
  if (!at) return undefined;
  const [column, row] = at;
  return {
    backgroundPosition: `${(column / (SPRITE_COLUMNS - 1)) * 100}% ${(row / (SPRITE_ROWS - 1)) * 100}%`,
  };
}

function TickerItems({ hidden = false }: { hidden?: boolean }) {
  const { requestCountry } = useWorldSelection();
  return (
    <ul className="flag-ticker-list" aria-hidden={hidden || undefined}>
      {spriteCountries.map((country) => (
        <li key={country.code}>
          <button
            type="button"
            className="flag-ticker-item"
            onClick={() => requestCountry(country.code)}
            tabIndex={hidden ? -1 : undefined}
            title={country.name}
          >
            <span className="flag-ticker-flag" style={tileStyle(country.code)} aria-hidden="true" />
            <span className="flag-ticker-code">{country.code.toUpperCase()}</span>
            <span className="visually-hidden">{country.name} auf dem Globus zeigen</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Endlos laufender Streifen mit allen Gebieten des Globus.
 *
 * Die Bewegung läuft ausschließlich über eine CSS-Transformation — kein
 * React-Zustand je Bild. Für die nahtlose Schleife steht die Liste zweimal da;
 * die Kopie ist für Screenreader und Tastatur ausgeblendet. Ein Klick wählt das
 * Land auf dem Globus aus, statt auf eine Seite zu führen, die es noch nicht gibt.
 */
export function FlagTicker() {
  return (
    <div
      className="flag-ticker"
      style={{
        ["--flag-sprite" as string]: `url('${sitePath("/assets/flag-sprite.webp")}')`,
        ["--sprite-columns" as string]: SPRITE_COLUMNS,
        ["--sprite-rows" as string]: SPRITE_ROWS,
      }}
    >
      <span className="flag-ticker-label">Alle Gebiete · antippen zeigt sie auf dem Globus</span>
      <div className="flag-ticker-viewport">
        <div className="flag-ticker-track">
          <TickerItems />
          <TickerItems hidden />
        </div>
      </div>
    </div>
  );
}
