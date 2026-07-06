/**
 * Merge freshly-arrived feed updates (30s poll or optimistic composer
 * event) into the currently-rendered, newest-first list.
 *
 * - Dedupes by `id` — the poll and the optimistic insert can overlap.
 * - New items are PREPENDED (both sources are newer than what's shown).
 * - `cap` (optional) keeps the homepage list at its SSR length so the
 *   ad-slot batching in FeedUpdatesSection (slice(0,4)/slice(4,12)) never
 *   drifts during a long session.
 * - Returns the SAME array reference when nothing new arrived so React
 *   state setters can skip the re-render entirely.
 */
// Parity with the old theme's my_post_time_ago_function(): timestamps on
// updates modified within the last 4 hours render red.
const FRESH_HOURS = 4;

/**
 * True when an update's modified time is inside the "hot" window. Slightly
 * future timestamps count as fresh (server/client clock skew); missing or
 * unparseable dates never do.
 */
export function isFreshUpdate(modifiedIso, nowMs = Date.now(), hours = FRESH_HOURS) {
  const t = Date.parse(modifiedIso || "");
  if (Number.isNaN(t)) return false;
  return nowMs - t < hours * 3_600_000;
}

export function mergeUpdates(current, incoming, cap = 0) {
  const seen = new Set(current.map((item) => item.id));
  const fresh = (incoming || []).filter((item) => item?.id && !seen.has(item.id));
  if (fresh.length === 0) return current;
  const merged = [...fresh, ...current];
  return cap > 0 ? merged.slice(0, cap) : merged;
}
