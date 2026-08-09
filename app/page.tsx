import type { CSSProperties } from "react";
import { AtlasFooter } from "./components/atlas-footer";
import { Noise } from "./components/noise";
import { FlagTicker } from "./components/flag-ticker";
import { InteractiveWorld } from "./components/interactive-world";
import { WorldSelectionProvider } from "./components/world/selection-context";
import { PointerSpotlight } from "./components/pointer-spotlight";
import { RevealObserver } from "./components/reveal-observer";
import { countries, type Country } from "./data/countries";
import { sitePath } from "./data/site";
import { AtlasMark } from "./components/atlas-mark";
import { CountryFlag } from "./components/country-flag";
import { MobileNav } from "./components/mobile-nav";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function CountryCard({ country, index }: { country: Country; index: number }) {
  const style = {
    "--country-accent": country.accent,
    "--country-soft": country.accentSoft,
    "--country-delay": `${Math.min(index * 70, 350)}ms`,
  } as CSSProperties;

  const content = (
    <>
      <div className="country-card-glow" />
      <div className="country-card-top">
        <span className="country-flag"><CountryFlag code={country.code} name={country.name} /></span>
        <span className={`country-status status-${country.status}`}>
          <i /> {country.status === "live" ? "Live" : country.status === "next" ? "Als Nächstes" : "Geplant"}
        </span>
      </div>
      <div className="country-card-visual" aria-hidden="true">
        <span /><span /><span /><span /><span /><span /><span /><span /><span />
      </div>
      <div className="country-card-copy">
        <div className="country-code">{String(index + 1).padStart(2, "0")} / {country.code}</div>
        <h3>{country.name}</h3>
        <span className="country-native">{country.nativeName}</span>
        <p>{country.description}</p>
      </div>
      <div className="country-card-meta">
        <span>{country.horizon}</span>
        <strong>{country.signal}</strong>
        <span className="country-arrow">{country.status === "live" ? <ArrowIcon /> : "—"}</span>
      </div>
    </>
  );

  // Auch die noch nicht veröffentlichten Länder haben inzwischen eine Seite.
  return (
    <a
      className={`country-card reveal ${country.status === "live" ? "country-card-live" : "country-card-planned"}`}
      href={sitePath(`/${country.slug}`)}
      style={style}
    >
      {content}
    </a>
  );
}

export default function AtlasHome() {
  return (
    <main className="atlas-home" id="inhalt">
      <Noise />
      <PointerSpotlight />
      <RevealObserver />

      <nav className="atlas-nav">
        <div className="wrap atlas-nav-inner">
          <a className="brand" href={sitePath()} aria-label="Demografie Atlas Startseite">
            <AtlasMark />
            <span>DEMOGRAFIE <b>/ ATLAS</b></span>
          </a>
          <div className="atlas-nav-links">
            <a href="#laender">Länder</a>
            <a href="#system">System</a>
            <a href={sitePath("/datenschutz")}>Datenschutz</a>
          </div>
          <span className="atlas-live-chip"><i /> 1 Atlas live</span>
          <MobileNav
            links={[
              { href: "#laender", label: "Länder" },
              { href: "#system", label: "System" },
              { href: sitePath("/datenschutz"), label: "Datenschutz" },
              { href: sitePath("/impressum"), label: "Impressum" },
            ]}
          />
        </div>
      </nav>

      <WorldSelectionProvider>
        <header className="atlas-hero wrap">
          <div className="atlas-hero-copy">
            <div className="atlas-eyebrow"><span>Weltweite Demografie</span><b>236 Gebiete</b></div>
            <h1>Die Welt von morgen.<br /><em>Land für Land.</em></h1>
            <p>
              Drehe den Globus und entdecke, wie Bevölkerung, Alterung, Geburten und
              Migration jedes Land verändern.
            </p>
            <div className="atlas-hero-actions">
              <a className="primary-action" href="#laender">Alle Länder entdecken <ArrowIcon /></a>
            </div>
          </div>

          <InteractiveWorld />

          <FlagTicker />
        </header>
      </WorldSelectionProvider>

      <section className="atlas-section wrap" id="laender">
        <div className="atlas-section-head reveal">
          <div>
            <span>01 / Länder</span>
            <h2>Wähle eine<br />Perspektive.</h2>
          </div>
          <p>
            Jedes Land erhält dieselbe klare Bühne: amtliche Quellen, interaktive
            Altersstruktur, Projektionen und transparente Methodik.
          </p>
        </div>

        <div className="country-grid">
          {countries.map((country, index) => <CountryCard country={country} index={index} key={country.slug} />)}
        </div>
      </section>

      <section className="atlas-section atlas-system-section" id="system">
        <div className="wrap">
          <div className="atlas-system-card reveal">
            <div className="system-orbit" aria-hidden="true"><i /><i /><i /></div>
            <div className="system-copy">
              <span>02 / Ein System, viele Länder</span>
              <h2>Skalierbar<br />von Anfang an.</h2>
              <p>
                Neue Länder werden über ein zentrales Länderverzeichnis ergänzt. Flagge, Status,
                Navigation und Kartenlayout entstehen automatisch — ohne die bestehende
                Deutschland-Datenstory anzufassen.
              </p>
              <p>
                Ein Land kommt in den Atlas, sobald für dieses Land eine amtliche
                Bevölkerungsstatistik und eine offizielle Vorausberechnung vorliegen, die
                sich nach Einzeljahrgang und Geschlecht auswerten lassen. Geprüft werden
                Herausgeber, Stichtag, Gebietsstand und die Frage, welche Annahmen hinter
                der Vorausberechnung stehen.
              </p>
              <p>
                Erst danach wird das Kohortenmodell auf die amtlichen Summen des Landes
                kalibriert. Jede Kennzahl auf einer Länderseite trägt ihre Quelle, und
                modellierte Werte sind als solche gekennzeichnet.
              </p>
            </div>
            <div className="system-steps">
              <div><b>01</b><span>Amtliche Daten</span><small>Quellen prüfen</small></div>
              <div><b>02</b><span>Ländermodell</span><small>Kohorten kalibrieren</small></div>
              <div><b>03</b><span>Live Atlas</span><small>Interaktiv veröffentlichen</small></div>
            </div>
          </div>
        </div>
      </section>

      <AtlasFooter />
    </main>
  );
}
