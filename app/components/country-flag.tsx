import { sitePath } from "../data/site";

/**
 * Länderflagge als SVG.
 *
 * Emoji-Flaggen sind keine verlässliche Lösung: Windows zeigt sie überhaupt
 * nicht als Flagge an, sondern als zwei Buchstaben, und auf den übrigen Systemen
 * unterscheiden sich Form, Randstärke und Sättigung deutlich. Die SVGs sehen
 * überall gleich aus und lassen sich gestalten.
 */
export function CountryFlag({
  code,
  name,
  className = "",
  round = false,
}: {
  code: string;
  name?: string;
  className?: string;
  /** Rund beschnitten — für das Markenzeichen in der Navigation. */
  round?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`country-flag-img${round ? " is-round" : ""} ${className}`.trim()}
      src={sitePath(`/flags/${code.toLowerCase()}.svg`)}
      alt={name ? `Flagge ${name}` : ""}
      aria-hidden={name ? undefined : true}
      width={4}
      height={3}
      loading="lazy"
      decoding="async"
    />
  );
}
