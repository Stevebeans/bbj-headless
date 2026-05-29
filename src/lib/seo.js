// Shared SEO constants + helpers. Centralizes values previously duplicated
// across page.jsx files (homepage, feed hub, etc.).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com").replace(/\/$/, "");
export const ORG_LOGO = "https://bigbrotherjunkies.com/wp-content/themes/BBJ/images/bbjlogo2020.png";
export const SITE_NAME = "Big Brother Junkies";

/**
 * True only on the canonical production host. Staging (staging.bigbrotherjunkies.com),
 * Vercel previews, and localhost all resolve to false so they can be noindexed —
 * a self-referential staging canonical + index,follow splits ranking signals with prod.
 */
export const IS_PROD = (() => {
  try {
    return new URL(SITE_URL).host === "bigbrotherjunkies.com";
  } catch {
    return false;
  }
})();

/**
 * Absolute frontend URL for a WP permalink or a relative path.
 * Strips any origin (incl. WP) and re-bases onto SITE_URL.
 */
export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return SITE_URL;
  try {
    return SITE_URL + new URL(pathOrUrl).pathname.replace(/\/$/, "");
  } catch {
    return SITE_URL + (pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`);
  }
}

/**
 * Normalize a date string to ISO 8601 *with* timezone for schema.org dates.
 * WP core REST `date` is site-local with NO offset (ambiguous to crawlers);
 * `date_gmt` is UTC. Prefer the GMT value (+ "Z") when available, else pass
 * through values that already carry an offset (the bbjd feed endpoint does).
 * See CLAUDE.md SEO guidelines: dates must be ISO 8601 with timezone.
 */
export function toIsoTz(local, gmt) {
  if (gmt) return /[zZ]|[+-]\d{2}:?\d{2}$/.test(gmt) ? gmt : `${gmt}Z`;
  return local || undefined;
}

/**
 * Build a schema.org BreadcrumbList node from [{ name, path }] crumbs.
 * `path` may be relative or a WP permalink — absoluteUrl re-bases onto SITE_URL.
 */
export function breadcrumbJsonLd(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
