import type { MetadataRoute } from "next";
import { SITE_URL } from "./data/seo";
import { countries } from "./data/countries";

/** Nur veröffentlichte Seiten aufnehmen — geplante Länder haben noch keine Route. */
/** Statischer Export: Next verlangt die Kennzeichnung ausdrücklich. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, "");
  const lastModified = new Date("2026-08-09");
  const liveCountries = countries.filter((country) => country.status === "live");

  return [
    { url: `${base}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    ...liveCountries.map((country) => ({
      url: `${base}/${country.slug}/`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${base}/impressum/`, lastModified, changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${base}/datenschutz/`, lastModified, changeFrequency: "yearly" as const, priority: 0.2 },
  ];
}
