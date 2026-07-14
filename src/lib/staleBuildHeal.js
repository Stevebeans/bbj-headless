// Nav-time companion to SelfHealScript: that inline watchdog only rescues
// pages that arrive broken (it disarms after hydration), while this handles
// the client-side-navigation variant of build skew. A browser running a build
// older than Vercel's skew-protection window (long-lived tab, or a visitor
// booted from a Cloudflare-cached zombie page) gets the CURRENT build's RSC
// payload on navigation; its old webpack runtime can't resolve the new module
// refs and the render throws into error.jsx. A hard reload with a
// cache-busting param (so Cloudflare misses) fetches current HTML + JS — the
// manual refresh users discovered on their own. SelfHealBeacon already strips
// the bbjheal param after a healthy mount.

const GUARD_KEY = "bbj_heal_nav";
const GUARD_WINDOW_MS = 60_000;

// Signatures of cross-build failures: dead chunk fetches, and the webpack
// "reading 'call'" TypeError from resolving another build's module ids.
// "Connection closed." is the flight parser dying on a truncated/mismatched
// RSC stream. Ordinary render bugs must NOT match — reloading won't fix them.
const STALE_BUILD_PATTERNS = [
  /loading chunk .* failed/i,
  /failed to fetch dynamically imported module/i,
  /cannot read properties of undefined \(reading 'call'\)/i,
  /connection closed/i,
];

export function isStaleBuildError(error) {
  if (!error) return false;
  if (error.name === "ChunkLoadError") return true;
  const message = String(error.message || "");
  return STALE_BUILD_PATTERNS.some((p) => p.test(message));
}

/**
 * If the error looks like build skew, reload once with a cache-busting query.
 * Returns true when a reload was initiated (caller should render a quiet
 * "refreshing" state instead of the error page). Repeated failures inside the
 * guard window fall through to the normal error page rather than looping.
 */
export function attemptStaleBuildHeal(
  error,
  {
    storage = typeof window !== "undefined" ? window.sessionStorage : null,
    location = typeof window !== "undefined" ? window.location : null,
    now = Date.now(),
  } = {}
) {
  if (!isStaleBuildError(error) || !storage || !location) return false;
  try {
    const last = parseInt(storage.getItem(GUARD_KEY), 10);
    if (Number.isFinite(last) && now - last < GUARD_WINDOW_MS) return false;
    storage.setItem(GUARD_KEY, String(now));
  } catch {
    return false; // no loop protection available → show the error page
  }
  const url = new URL(location.href);
  url.searchParams.set("bbjheal", now.toString(36));
  location.replace(url.toString());
  return true;
}
