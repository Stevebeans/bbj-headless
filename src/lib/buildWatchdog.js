// Long-lived-tab build watchdog. A tab that stays open across a deploy keeps
// working until Vercel's skew-protection window (12h) closes; after that its
// first client-side navigation fetches the CURRENT build's RSC payload, which
// references chunks the old runtime cannot load. When the missing chunk is the
// root layout's, the throw lands above app/error.jsx, so the nav-time heal
// there never runs and Next shows its bare "Application error" page (Ruth,
// 2026-09-05: homepage tab open for days — the feed poller keeps it fresh, so
// nothing ever prompted a reload).
//
// Skew protection cannot save such a tab: Cloudflare caches the RSC
// navigation payloads by URL and ignores the deployment id, so an old tab can
// be handed a newer build's payload from the edge. Instead of waiting for the
// crash, re-read the (Cloudflare-cached) homepage every few minutes and
// compare its deployment id with ours. Once a newer build is live, same-origin
// link clicks become full navigations (fresh HTML + JS) and the tab reloads
// itself the next time it is hidden.

const DPL_RE = /[?&]dpl=([^&#"'\s]+)/;

/** The page's own webpack runtime URL + deployment id, or null (no dpl = not on Vercel). */
export function findOwnBuildAsset(doc) {
  const script = doc?.querySelector?.('script[src*="/_next/static/chunks/webpack-"]');
  const src = script?.src;
  if (!src) return null;
  const dpl = DPL_RE.exec(src)?.[1];
  return dpl ? { src, dpl } : null;
}

/**
 * True only when the homepage HTML now carries a DIFFERENT deployment id than
 * ours. The homepage is served from Cloudflare's 10-minute cache, so this
 * costs Vercel nothing (an earlier version probed a cache-busted static asset,
 * which missed Cloudflare every time and could never 404 under 30-day skew).
 * Any failure, or a page without a deployment id, counts as not-stale.
 */
export async function isNewerBuildLive(fetchFn, ownDpl) {
  try {
    const res = await fetchFn("/", { credentials: "omit" });
    if (!res?.ok) return false;
    const live = DPL_RE.exec(await res.text())?.[1];
    return Boolean(live) && live !== ownDpl;
  } catch {
    return false;
  }
}

/** The href a plain same-origin click is headed to, or null to leave the click alone. */
function fullNavigationHref(event, location) {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const anchor = event.target?.closest?.("a[href]");
  if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute?.("download")) {
    return null;
  }
  const href = anchor.href || "";
  if (href === location.origin || href.startsWith(location.origin + "/")) return href;
  return null;
}

/**
 * Once stale: same-origin clicks do a full navigation instead of a client
 * route change, and a backgrounded tab reloads itself. Returns an uninstaller.
 */
export function installStaleHandlers({ doc, location }) {
  const onClick = (event) => {
    const href = fullNavigationHref(event, location);
    if (!href) return;
    event.preventDefault();
    location.assign(href);
  };
  const onVisibility = () => {
    if (doc.visibilityState === "hidden") location.reload();
  };
  doc.addEventListener("click", onClick, true);
  doc.addEventListener("visibilitychange", onVisibility);
  return () => {
    doc.removeEventListener("click", onClick, true);
    doc.removeEventListener("visibilitychange", onVisibility);
  };
}
