import type { Metadata } from "next";
import { LegalShell } from "../components/legal-shell";

export const metadata: Metadata = {
  title: "Impressum — Demografie Atlas",
  description: "Anbieterkennzeichnung des Demografie Atlas.",
};

export default function ImpressumPage() {
  return (
    <LegalShell
      kicker="Anbieterkennzeichnung"
      title="Impressum"
      intro="Gemeinsame Anbieterinformationen für den Demografie Atlas und alle künftig ergänzten Länder-Datenstories."
    >
      <section>
        <h2>Angaben zum Anbieter</h2>
        <p>Belkis Aslani</p>
        <p>Vogelsangstraße 32</p>
        <p>71691 Freiberg am Neckar, Deutschland</p>
        <p>Privates, nicht-kommerzielles Projekt.</p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>E-Mail: <a href="mailto:nullmesh@protonmail.com">nullmesh@protonmail.com</a></p>
      </section>

      <section>
        <h2>Inhaltlich verantwortlich</h2>
        <p>Verantwortlich im Sinne von § 18 Abs. 2 MStV:</p>
        <p>Belkis Aslani, Vogelsangstraße 32, 71691 Freiberg am Neckar</p>
      </section>

      <section>
        <h2>Projekt und Inhalte</h2>
        <p>
          Der Demografie Atlas ist eine interaktive, datenbasierte Visualisierung.
          Amtliche Werte werden von modellierten Darstellungen klar abgegrenzt. Die Inhalte
          stellen keine individuelle Rechts-, Finanz- oder Politikberatung dar.
        </p>
      </section>

      <section>
        <h2>Rechtsgrundlagen</h2>
        <p>
          Die Anbieterkennzeichnung orientiert sich an den Informationspflichten nach
          § 5 DDG sowie § 18 MStV. Ob einzelne Angaben im konkreten Betrieb erforderlich
          sind, hängt von Betreiberform und Ausgestaltung des Angebots ab.
        </p>
        <div className="legal-source-row">
          <a href="https://www.gesetze-im-internet.de/ddg/__5.html" target="_blank" rel="noreferrer">§ 5 DDG ↗</a>
          <a href="https://www.gesetze-bayern.de/Content/Document/MStV-18" target="_blank" rel="noreferrer">§ 18 MStV ↗</a>
        </div>
      </section>

      <p className="legal-disclaimer">
        Hinweis: Diese Seite ist eine sorgfältig vorbereitete Vorlage und ersetzt keine
        rechtliche Prüfung des konkreten Angebots.
      </p>
    </LegalShell>
  );
}
