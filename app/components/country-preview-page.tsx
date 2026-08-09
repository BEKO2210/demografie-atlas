import type { Metadata } from "next";
import { AtlasFooter } from "./atlas-footer";
import { AtlasMark } from "./atlas-mark";
import { CountryFlag } from "./country-flag";
import { Noise } from "./noise";
import { MobileNav } from "./mobile-nav";
import { RevealObserver } from "./reveal-observer";
import { countries } from "../data/countries";
import { previewBySlug } from "../data/country-previews";
import { pageMetadata } from "../data/seo";
import { sitePath } from "../data/site";

const countryBySlug = new Map(countries.map((country) => [country.slug, country]));

/** Solange die Datenstory fehlt, gehört die Seite nicht in den Suchindex. */
export function previewMetadata(slug: string): Metadata {
  const country = countryBySlug.get(slug)!;
  const preview = previewBySlug.get(slug)!;
  return {
    ...pageMetadata({
      title: `${country.name} im Demografie Atlas: Datenstory in Vorbereitung`,
      description: preview.summary,
      path: `/${slug}/`,
    }),
    robots: { index: false, follow: true },
  };
}

/**
 * Länderseite vor der Veröffentlichung der Datenstory.
 *
 * Bewusst keine leere „Demnächst"-Seite: die wäre für Besucher eine Sackgasse
 * und für Suchmaschinen dünner Inhalt. Stattdessen steht hier, worum es in dem
 * Land demografisch geht, was der Atlas zeigen wird und woher die Daten kommen.
 */
export function CountryPreviewPage({ slug }: { slug: string }) {
  const country = countryBySlug.get(slug)!;
  const preview = previewBySlug.get(slug)!;
  const statusLabel = country.status === "next" ? "Als Nächstes" : "Geplant";

  return (
    <main className="atlas-home preview-page" id="inhalt">
      <Noise />
      <RevealObserver />

      <nav className="atlas-nav">
        <div className="wrap atlas-nav-inner">
          <a className="brand" href={sitePath()} aria-label="Demografie Atlas Startseite">
            <AtlasMark />
            <span>DEMOGRAFIE <b>/ {country.code}</b></span>
          </a>
          <div className="atlas-nav-links">
            <a href={sitePath("/#laender")}>Länder</a>
            <a href={sitePath("/deutschland")}>Deutschland</a>
            <a href={sitePath("/datenschutz")}>Datenschutz</a>
          </div>
          <span className={`country-status status-${country.status}`}><i /> {statusLabel}</span>
          <MobileNav
            links={[
              { href: sitePath("/#laender"), label: "Länder" },
              { href: sitePath("/deutschland"), label: "Deutschland" },
              { href: sitePath("/datenschutz"), label: "Datenschutz" },
              { href: sitePath("/impressum"), label: "Impressum" },
            ]}
          />
        </div>
      </nav>

      <header className="preview-hero wrap">
        <div className="preview-flag"><CountryFlag code={country.code} name={country.name} /></div>
        <span className="preview-kicker">Atlas in Vorbereitung</span>
        <h1>{country.name}</h1>
        <p className="preview-native">{country.nativeName} · {country.signal}</p>
        {preview.intro.map((paragraph) => <p className="preview-lead" key={paragraph.slice(0, 24)}>{paragraph}</p>)}
        <div className="preview-actions">
          <a className="primary-action" href={sitePath("/deutschland")}>
            Deutschland-Atlas ansehen
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>
          </a>
          <a className="ghost-action" href={sitePath("/#laender")}>Alle Länder</a>
        </div>
      </header>

      <section className="atlas-section wrap">
        <div className="atlas-section-head reveal">
          <div>
            <span>Was hier entstehen wird</span>
            <h2>Dieselbe Bühne.<br />Andere Zahlen.</h2>
          </div>
          <p>
            Jedes Land bekommt den gleichen Aufbau wie die Deutschland-Story: amtliche Werte,
            eine interaktive Altersstruktur, den Projektionskorridor und eine offen gelegte Methodik.
          </p>
        </div>

        <div className="story-grid">
          {preview.chapters.map((chapter, index) => (
            <article className="story-card data-card preview-card reveal" key={chapter.title}>
              <div className="story-index">0{index + 1}</div>
              <h3>{chapter.title}</h3>
              <p>{chapter.text}</p>
            </article>
          ))}
        </div>

        <div className="preview-sources reveal">
          <span className="card-label">Datengrundlage</span>
          <p>
            Die Zahlen werden ausschließlich aus amtlichen Quellen übernommen. Modellierte
            Darstellungen werden — wie in der Deutschland-Story — ausdrücklich als solche gekennzeichnet.
          </p>
          <div className="legal-source-row">
            {preview.sources.map((source) => (
              <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label} ↗</a>
            ))}
          </div>
        </div>
      </section>

      <AtlasFooter compact countryCode={country.code} />
    </main>
  );
}
