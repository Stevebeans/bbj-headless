// Shared SEO constants + helpers. Centralizes values previously duplicated
// across page.jsx files (homepage, feed hub, etc.).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com").replace(/\/$/, "");
export const ORG_LOGO = "https://bigbrotherjunkies.com/wp-content/themes/BBJ/images/bbjlogo2020.png";
export const SITE_NAME = "Big Brother Junkies";

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
