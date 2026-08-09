import type { MetadataRoute } from "next";
import { SITE_URL } from "./data/seo";

/** Statischer Export: Next verlangt die Kennzeichnung ausdrücklich. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
