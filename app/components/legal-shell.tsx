import type { ReactNode } from "react";
import { AtlasFooter } from "./atlas-footer";
import { sitePath } from "../data/site";
import { AtlasMark } from "./atlas-mark";

export function LegalShell({
  kicker,
  title,
  intro,
  children,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page">
      <div className="noise" aria-hidden="true" />
      <nav className="atlas-nav legal-nav">
        <div className="wrap atlas-nav-inner">
          <a className="brand" href={sitePath()}>
            <AtlasMark />
            <span>DEMOGRAFIE <b>/ ATLAS</b></span>
          </a>
          <a className="legal-back" href={sitePath()}>← Zur Länderübersicht</a>
        </div>
      </nav>

      <header className="legal-hero wrap">
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>

      <div className="legal-layout wrap">
        <aside className="legal-aside">
          <span>Rechtliches</span>
          <a href={sitePath("/impressum")}>Impressum</a>
          <a href={sitePath("/datenschutz")}>Datenschutz</a>
          <small>Stand: 9. August 2026</small>
        </aside>
        <article className="legal-document">{children}</article>
      </div>

      <AtlasFooter compact />
    </main>
  );
}
