import { sitePath } from "../data/site";

type AtlasFooterProps = {
  compact?: boolean;
  countryCode?: string;
};

export function AtlasFooter({ compact = false, countryCode }: AtlasFooterProps) {
  return (
    <footer className={`atlas-footer${compact ? " atlas-footer-compact" : ""}`}>
      <div className="wrap atlas-footer-inner">
        <div className="atlas-footer-brand">
          <a className="brand" href={sitePath()} aria-label="Zur Länderübersicht">
            <span className="brand-mark"><span>A</span></span>
            <span>DEMOGRAFIE <b>/ ATLAS</b></span>
          </a>
          {!compact && (
            <p>
              Altersstrukturen werden verständlich, wenn Daten sich bewegen.
              {countryCode ? ` Aktueller Atlas: ${countryCode}.` : ""}
            </p>
          )}
        </div>

        <nav className="legal-links" aria-label="Rechtliche Hinweise">
          <a href={sitePath("/impressum")}>Impressum</a>
          <a href={sitePath("/datenschutz")}>Datenschutz</a>
          <a href="https://github.com/BEKO2210" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>

        <span className="atlas-footer-year">© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
