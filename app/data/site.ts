export const siteBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function sitePath(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteBase}${normalized}`;
}
