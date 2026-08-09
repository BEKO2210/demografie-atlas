import Script from "next/script";

/**
 * Reichweitenmessung mit einer selbst betriebenen Plausible-Instanz.
 *
 * Plausible setzt keine Cookies und legt keine Kennung an, die sich über
 * Besuche hinweg verfolgen ließe — deshalb braucht es keine Einwilligung.
 * Die Daten liegen auf einem eigenen Server, es geht nichts an Dritte.
 *
 * Ohne gesetztes `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` wird gar nichts geladen. So
 * zählt weder die lokale Entwicklung noch ein Vorschaubau in die Statistik.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  const host = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST ?? "https://stats.it-handwerk-stuttgart.de";

  return (
    <Script
      defer
      data-domain={domain}
      src={`${host}/js/script.outbound-links.js`}
      strategy="afterInteractive"
    />
  );
}
