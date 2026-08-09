"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect } from "react";
import { AtlasFooter } from "./components/atlas-footer";
import { InteractiveWorld } from "./components/interactive-world";
import { countries, type Country } from "./data/countries";
import { sitePath } from "./data/site";

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
        <span className="country-flag" role="img" aria-label={`Flagge ${country.name}`}>{country.flag}</span>
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

  return country.status === "live" ? (
    <a className="country-card country-card-live reveal" href={sitePath(`/${country.slug}`)} style={style}>
      {content}
    </a>
  ) : (
    <article className="country-card country-card-planned reveal" style={style} aria-label={`${country.name}, ${country.horizon}`}>
      {content}
    </article>
  );
}

export default function AtlasHome() {
  useEffect(() => {
    document.documentElement.classList.add("motion-ready");
    const elements = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -36px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const moveSpotlight = (event: ReactPointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
  };

  return (
    <main className="atlas-home" onPointerMove={moveSpotlight}>
      <div className="noise" aria-hidden="true" />
      <div className="atlas-spotlight" aria-hidden="true" />

      <nav className="atlas-nav">
        <div className="wrap atlas-nav-inner">
          <a className="brand" href={sitePath()} aria-label="Demografie Atlas Startseite">
            <span className="brand-mark"><span>A</span></span>
            <span>DEMOGRAFIE <b>/ ATLAS</b></span>
          </a>
          <div className="atlas-nav-links">
            <a href="#laender">Länder</a>
            <a href="#system">System</a>
            <a href={sitePath("/datenschutz")}>Datenschutz</a>
          </div>
          <span className="atlas-live-chip"><i /> 1 Atlas live</span>
        </div>
      </nav>

      <header className="atlas-hero wrap">
        <div className="atlas-hero-copy">
          <div className="atlas-eyebrow"><span>Global Demography Interface</span><b>195 / ONE PLANET</b></div>
          <h1>Eine Welt.<br />Viele <em>Zukünfte.</em></h1>
          <p>
            Drehe die Erde, wähle ein Land und sieh, wie Generationen seine Zukunft formen.
            Ein interaktives System für Bevölkerung, Alterung, Geburten und Migration.
          </p>
          <div className="atlas-hero-actions">
            <a className="primary-action" href="#laender">Länder entdecken <ArrowIcon /></a>
            <a className="ghost-action" href={sitePath("/deutschland")}><span>🇩🇪</span> Deutschland öffnen</a>
          </div>
        </div>

        <InteractiveWorld />

        <div className="atlas-ticker" aria-label="Geplante Länder">
          <span>ROTATE / SELECT / EXPLORE</span>
          {countries.map((country) => <b key={country.code}>{country.flag} {country.code}</b>)}
          <span>GLOBAL ATLAS · 2025 — 2070</span>
        </div>
      </header>

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
                Neue Länder werden über eine zentrale Registry ergänzt. Flagge, Status,
                Navigation und Kartenlayout entstehen automatisch — ohne die bestehende
                Deutschland-Datenstory anzufassen.
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
