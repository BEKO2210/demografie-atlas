import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./mobile-nav.css";
import { pageMetadata, SITE_NAME, SITE_URL } from "./data/seo";

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Demografie Atlas — Bevölkerung im Ländervergleich entdecken",
    description:
      "Interaktiver Atlas über Altersstrukturen, Geburten und Wanderung: Deutschland live, weitere Länder wie Frankreich, Italien und Japan folgen in Kürze.",
    path: "/",
  }),
  applicationName: SITE_NAME,
  authors: [{ name: "Belkis Aslani" }],
  creator: "Belkis Aslani",
  // Vorschau-Kennzeichnung der Entwicklungsumgebung. Im veröffentlichten
  // Export (GitHub Pages) hat sie nichts verloren.
  ...(process.env.GITHUB_PAGES === "true"
    ? {}
    : { other: { "codex-preview": "development" } }),
  icons: {
    icon: `${assetBase}/favicon.svg`,
    shortcut: `${assetBase}/favicon.svg`,
  },
};

/**
 * Strukturierte Daten: ohne sie erkennen Suchmaschinen und KI-Antwortdienste
 * weder den Namen des Angebots noch dessen Datengrundlage.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      inLanguage: "de-DE",
      description:
        "Interaktiver Atlas über Altersstrukturen, Generationen und demografische Projektionen.",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Belkis Aslani",
      url: `${SITE_URL}/impressum/`,
    },
    {
      "@type": "Dataset",
      "@id": `${SITE_URL}/deutschland/#dataset`,
      name: "Altersstruktur Deutschlands 2025 bis 2070",
      description:
        "Bevölkerungsstand Ende 2025 und Projektion bis 2070 nach der moderaten Variante der 16. koordinierten Bevölkerungsvorausberechnung.",
      url: `${SITE_URL}/deutschland/`,
      inLanguage: "de-DE",
      license: "https://www.destatis.de/DE/Service/Impressum/copyright.html",
      temporalCoverage: "2025/2070",
      spatialCoverage: { "@type": "Country", name: "Deutschland" },
      creator: { "@id": `${SITE_URL}/#person` },
      isBasedOn: "https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Bevoelkerungsvorausberechnung/annahmen_ergebnisse_16te_kBv.html",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Erstes fokussierbares Element der Seite; nur bei Tastaturfokus sichtbar. */}
        <a className="skip-link" href="#inhalt">Zum Inhalt springen</a>
        {children}
        <script
          type="application/ld+json"
          // Eigener, statisch erzeugter Inhalt — keine Fremddaten.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
