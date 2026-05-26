// Small shared helpers for the Feed Hub. No deps.

/** Extract the BB season number from a name like "Big Brother 27" → 27 (0 if none). */
export function seasonNumber(name) {
  const n = parseInt(String(name || "").match(/\d+/)?.[0] || "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** YYYY-MM-DD key in America/Los_Angeles (BB Time) for grouping. */
export function dateKey(iso) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

/** Human day label: Today / Yesterday / "Monday · Sep 8". */
export function dayLabel(iso) {
  const tz = "America/Los_Angeles";
  const key = dateKey(iso);
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const yKey = new Date(Date.now() - 864e5).toLocaleDateString("en-CA", { timeZone: tz });
  if (key === todayKey) return "Today";
  if (key === yKey) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { timeZone: tz, weekday: "long", month: "short", day: "numeric" }).replace(",", " ·");
}

/** Short date label "Sep 8". */
export function shortDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" });
}
