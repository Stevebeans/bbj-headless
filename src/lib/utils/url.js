/**
 * Convert an absolute URL (especially a WordPress permalink like
 * https://bigbrotherjunkies.com/bigbrother-players/janelle/) to a relative
 * frontend path. The Next frontend mirrors WP's path structure, so stripping
 * the origin yields the correct internal href. Null/relative-safe; never throws.
 */
export function toRelativeHref(url) {
  if (!url || typeof url !== "string") return "#";
  try {
    const u = new URL(url);
    let path = u.pathname + u.search + u.hash;
    if (path.length > 1 && path.endsWith("/") && !u.hash) path = path.slice(0, -1);
    return path || "/";
  } catch {
    return url; // already relative (or not a URL) — leave as-is
  }
}
