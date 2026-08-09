import { sitePath } from "../data/site";

/**
 * Feine Rauschebene über der Seite. Die Bildquelle steht im Inline-Style, weil
 * `url()` in einer Next-CSS-Datei den GitHub-Pages-basePath nicht mitbekommt.
 */
export function Noise() {
  return (
    <div
      className="noise"
      aria-hidden="true"
      style={{ backgroundImage: `url('${sitePath("/assets/noise.png")}')` }}
    />
  );
}
