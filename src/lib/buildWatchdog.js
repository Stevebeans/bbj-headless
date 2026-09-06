// Long-lived-tab build watchdog. A tab that stays open across a deploy keeps
// working until Vercel's skew-protection window (12h) closes; after that its
// first client-side navigation fetches the CURRENT build's RSC payload, which
// references chunks the old runtime cannot load. When the missing chunk is the
// root layout's, the throw lands above app/error.jsx, so the nav-time heal
// there never runs and Next shows its bare "Application error" page (Ruth,
// 2026-09-05: homepage tab open for days — the feed poller keeps it fresh, so
// nothing ever prompted a reload).
//
// Instead of waiting for the crash, probe our own webpack runtime with a
// cache-busting param every few minutes. Vercel keeps serving it while our
// deployment is inside the skew window and answers 404 once it is not. From
// then on, same-origin link clicks become full navigations (fresh HTML + JS)
// and the tab reloads itself the next time it is hidden. Zero function
// invocations: the probe is a static asset.

const PROBE_PARAM = "bbjprobe";

/** The page's own webpack runtime URL + deployment id, or null (no dpl = not on Vercel). */
export function findOwnBuildAsset(doc) {
  const script = doc?.querySelector?.('script[src*="/_next/static/chunks/webpack-"]');
  const src = script?.src;
  if (!src) return null;
  const dpl = /[?&]dpl=([^&#]+)/.exec(src)?.[1];
  return dpl ? { src, dpl } : null;
}

export function probeUrl(src, now) {
  return `${src}${src.includes("?") ? "&" : "?"}${PROBE_PARAM}=${now.toString(36)}`;
}

/** True only on a definitive 404 — blips and other statuses never count. */
export async function isBuildGone(fetchFn, src, now = Date.now()) {
  try {
    const res = await fetchFn(probeUrl(src, now), {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
    });
    return res?.status === 404;
  } catch {
    return false;
  }
}

function isPlainSameOriginClick(event, location) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = event.target?.closest?.("a[href]");
  if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute?.("download")) {
    return false;
  }
  const href = anchor.href || "";
  return href.startsWith(location.origin + "/") || href === location.origin;
}

/**
 * Once stale: same-origin clicks do a full navigation instead of a client
 * route change, and a backgrounded tab reloads itself. Returns an uninstaller.
 */
export function installStaleHandlers({ doc, location }) {
  const onClick = (event) => {
    if (!isPlainSameOriginClick(event, location)) return;
    event.preventDefault();
    location.assign(event.target.closest("a[href]").href);
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
