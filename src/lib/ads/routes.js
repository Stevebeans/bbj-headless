/**
 * Route classification helpers for ad lifecycle logic (AdContext).
 *
 * Posts live at the site root (`/{slug}`, see PROD GO-LIVE 6/7) — there is no
 * `/articles` or `/posts` prefix — so an "article page" is any path whose
 * first segment isn't one of the known hub/system routes below. Keep this
 * list in sync with the top-level folders under `src/app/` (and any
 * ad-free/system route arrays in AdContext.jsx) whenever a new non-post
 * top-level route is added.
 */
const NON_ARTICLE_ROOT_SEGMENTS = new Set([
  "about",
  "admin",
  "advertise",
  "become-supporter",
  "bigbrother-players",
  "bigbrother-seasons",
  "billing",
  "category",
  "checkout",
  "compare",
  "contact",
  "directory",
  "editor",
  "email",
  "fan-favorites",
  "feed",
  "live-feed-updates",
  "login",
  "messages",
  "news-sitemap.xml",
  "notifications",
  "page",
  "preview",
  "privacy-policy",
  "register",
  "reset-password",
  "search",
  "settings",
  "shows",
  "stats",
  "tag",
  "unsubscribe",
  "users",
]);

/**
 * @param {string} pathname - e.g. usePathname() output
 * @returns {boolean} true if this looks like a single-post article page
 */
export function isArticlePath(pathname) {
  if (typeof pathname !== "string") return false;
  const clean = pathname.split("?")[0].split("#")[0];
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return false; // root "/"
  return !NON_ARTICLE_ROOT_SEGMENTS.has(segments[0]);
}
