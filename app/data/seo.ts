import type { Metadata } from "next";

/**
 * Öffentliche Adresse der Seite. Wird für kanonische Links, Vorschaubilder und
 * die Sitemap gebraucht — alles Angaben, die eine absolute URL verlangen.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://beko2210.github.io/demografie-atlas";

export const SITE_NAME = "Demografie Atlas";

/** Gemeinsame Angaben für Suchmaschinen und geteilte Links. */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE_URL.replace(/\/$/, "")}${path === "/" ? "/" : path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "de_DE",
      siteName: SITE_NAME,
      title,
      description,
      url,
      images: [{
        url: `${SITE_URL.replace(/\/$/, "")}/assets/og-image.jpg`,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL.replace(/\/$/, "")}/assets/og-image.jpg`],
    },
  };
}
