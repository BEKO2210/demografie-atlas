export const siteBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function sitePath(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteBase}${normalized}`;
}

/**
 * Stand der rechtlichen Hinweise. Das Datum stand vorher zweimal fest im Code
 * (Impressumsspalte und Datenschutztext) und lief dadurch auseinander.
 */
export const LEGAL_UPDATED = "9. August 2026";
