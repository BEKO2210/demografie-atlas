import type { Metadata } from "next";
import { pageMetadata } from "../data/seo";
import { LEGAL_UPDATED } from "../data/site";
import { LegalShell } from "../components/legal-shell";

export const metadata: Metadata = pageMetadata({
  title: "Datenschutzhinweise für den Demografie Atlas — transparent",
  description:
    "Datenschutzhinweise zum Demografie Atlas: keine Cookies, keine Profilbildung, Reichweitenmessung auf eigenem Server. Was übertragen wird und warum.",
  path: "/datenschutz/",
});

export default function DatenschutzPage() {
  return (
    <LegalShell
      kicker="Datenschutzhinweise"
      title="Datenschutz"
      intro="Transparent und auf das Wesentliche reduziert: keine Cookies, keine Werbung, keine Profilbildung — und eine Reichweitenmessung, die ohne personenbezogene Daten auskommt."
    >
      <section>
        <h2>1. Verantwortlicher</h2>
        <p>Belkis Aslani</p>
        <p>Vogelsangstraße 32, 71691 Freiberg am Neckar, Deutschland</p>
        <p>E-Mail: <a href="mailto:nullmesh@protonmail.com">nullmesh@protonmail.com</a></p>
      </section>

      <section>
        <h2>2. Aufruf der Website</h2>
        <p>
          Beim Abruf der Website übermittelt dein Browser technisch erforderliche Daten an
          den jeweiligen Hostinganbieter. Dazu können IP-Adresse, Datum und Uhrzeit,
          aufgerufene Datei, Referrer, Browser- und Betriebssysteminformationen gehören.
          Die Verarbeitung dient der sicheren und stabilen Bereitstellung der Website.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt in
          Funktionsfähigkeit, Missbrauchsschutz und technischer Sicherheit. Logdaten werden
          nach den Vorgaben des jeweiligen Hostinganbieters gelöscht oder anonymisiert.
        </p>
      </section>

      <section>
        <h2>3. Hosting</h2>
        <h3>GitHub Pages</h3>
        <p>
          Die öffentliche Projektversion wird über GitHub Pages bereitgestellt.
          GitHub weist darauf hin, dass beim Besuch einer GitHub-Pages-Website die
          IP-Adresse unabhängig von einer Anmeldung zu Sicherheitszwecken protokolliert wird.
          Verantwortliche GitHub-Gesellschaft für Personen im EWR kann GitHub B.V. sein.
        </p>
        <div className="legal-source-row">
          <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection" target="_blank" rel="noreferrer">GitHub Pages · Datenerhebung ↗</a>
          <a href="https://docs.github.com/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noreferrer">GitHub Datenschutzerklärung ↗</a>
        </div>
      </section>

      <section>
        <h2>4. Cookies und lokale Speicherung</h2>
        <p>
          Der Demografie Atlas setzt keine eigenen Cookies, keine Werbetechnologien
          und kein Nutzerprofiling ein. Die Schieberegler und Animationen werden lokal
          im Browser ausgeführt; ihre Werte werden nicht an den Betreiber gesendet.
        </p>
      </section>

      <section>
        <h2>5. Reichweitenmessung</h2>
        <p>
          Um zu sehen, welche Inhalte gelesen werden, kommt Plausible Analytics zum
          Einsatz. Die Software läuft auf einem eigenen Server des Betreibers unter
          stats.it-handwerk-stuttgart.de; es werden keine Daten an Dritte übermittelt.
        </p>
        <p>
          Plausible arbeitet ohne Cookies und ohne eine Kennung, die sich über mehrere
          Besuche hinweg zuordnen ließe. Erfasst werden ausschließlich zusammengefasste
          Werte: aufgerufene Seite, verweisende Seite, ungefährer Standort auf Länderebene,
          Gerätetyp, Browser und Betriebssystem. Die IP-Adresse wird nicht gespeichert;
          sie geht nur in eine tagesaktuelle, nicht umkehrbare Prüfsumme ein, mit der
          wiederholte Aufrufe innerhalb eines Tages erkannt werden.
        </p>
        <p>
          Ein Personenbezug entsteht dabei nicht, eine Einwilligung ist deshalb nicht
          erforderlich. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; das berechtigte
          Interesse liegt darin, die Inhalte auf Grundlage tatsächlicher Nutzung zu
          verbessern.
        </p>
        <div className="legal-source-row">
          <a href="https://plausible.io/data-policy" target="_blank" rel="noreferrer">Plausible · Datenrichtlinie ↗</a>
        </div>
      </section>

      <section>
        <h2>6. Externe Links</h2>
        <p>
          Verweise auf Destatis, GitHub und andere Primärquellen werden erst beim Anklicken
          aufgerufen. Ab diesem Zeitpunkt gelten die Datenschutzhinweise des jeweiligen Anbieters.
        </p>
      </section>

      <section>
        <h2>7. Deine Rechte</h2>
        <p>
          Soweit die gesetzlichen Voraussetzungen vorliegen, bestehen insbesondere Rechte auf
          Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
          und Widerspruch. Außerdem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.
          Eine erteilte Einwilligung kann mit Wirkung für die Zukunft widerrufen werden.
        </p>
      </section>

      <section>
        <h2>8. Aktualität</h2>
        <p>
          Diese Hinweise entsprechen dem technischen Stand vom {LEGAL_UPDATED}. Werden später
          Formulare, Analysen, Newsletter oder weitere Dienste ergänzt, wird die Erklärung vor
          deren Aktivierung angepasst.
        </p>
      </section>

      <p className="legal-disclaimer">
        Hinweis: Diese Datenschutzerklärung wurde für den aktuell trackingfreien Projektstand
        vorbereitet und sollte vor dem produktiven Betrieb rechtlich geprüft werden.
      </p>
    </LegalShell>
  );
}
