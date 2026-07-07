import { describe, expect, it } from "vitest";
import { isFreshUpdate, mergeUpdates } from "./feedUpdatesLive";

const u = (id) => ({ id, title: `Update ${id}` });

describe("mergeUpdates", () => {
  it("prepends only genuinely-new items, newest first", () => {
    const current = [u(3), u(2), u(1)];
    const incoming = [u(5), u(4), u(3), u(2)]; // poll returns newest-first w/ overlap
    expect(mergeUpdates(current, incoming).map((x) => x.id)).toEqual([5, 4, 3, 2, 1]);
  });

  it("returns the SAME reference when nothing new (no re-render)", () => {
    const current = [u(2), u(1)];
    expect(mergeUpdates(current, [u(2), u(1)])).toBe(current);
    expect(mergeUpdates(current, [])).toBe(current);
    expect(mergeUpdates(current, null)).toBe(current);
  });

  it("dedupes an optimistic insert against a later poll", () => {
    const afterOptimistic = mergeUpdates([u(2), u(1)], [u(9)]); // composer event
    const afterPoll = mergeUpdates(afterOptimistic, [u(9), u(2), u(1)]); // poll includes it
    expect(afterPoll).toBe(afterOptimistic); // no double-card
  });

  it("caps the list length (homepage ad-batching stays stable)", () => {
    const current = [u(4), u(3), u(2), u(1)];
    const merged = mergeUpdates(current, [u(6), u(5)], 4);
    expect(merged.map((x) => x.id)).toEqual([6, 5, 4, 3]);
  });

  it("ignores malformed incoming entries", () => {
    const current = [u(1)];
    expect(mergeUpdates(current, [null, {}, u(1)])).toBe(current);
  });

  // Prod regression 2026-07-07: the poll returns ~20 items while the SSR list
  // shows ~12, so the poll's TAIL contains items OLDER than anything rendered.
  // Blind prepending stacked last-season updates on top of (and, with the cap,
  // evicted) same-day updates 30s after every page load.
  it("keeps today's updates on top when the poll returns an older tail", () => {
    const d = (id, date) => ({ id, date });
    const current = [
      d(73740, "2026-07-07T08:44:32-07:00"),
      d(73739, "2026-07-06T16:45:30-07:00"),
      d(73738, "2026-07-01T09:07:00-07:00"),
      d(900, "2025-09-28T18:46:00-07:00"),
      d(899, "2025-09-28T18:44:00-07:00"),
    ];
    const incoming = [
      ...current.map((x) => ({ ...x })),
      d(898, "2025-09-28T18:43:00-07:00"),
      d(897, "2025-09-28T18:42:00-07:00"),
    ];
    const merged = mergeUpdates(current, incoming, 5);
    expect(merged.map((x) => x.id)).toEqual([73740, 73739, 73738, 900, 899]);
  });

  it("sorts undated optimistic inserts to the top of dated lists", () => {
    const current = [
      { id: 2, date: "2026-07-07T08:00:00-07:00" },
      { id: 1, date: "2026-07-01T08:00:00-07:00" },
    ];
    const merged = mergeUpdates(current, [{ id: 9 }]); // composer event detail may lack a date
    expect(merged.map((x) => x.id)).toEqual([9, 2, 1]);
  });
});

describe("isFreshUpdate", () => {
  const now = Date.parse("2026-07-06T12:00:00Z");

  it("is fresh within the 4-hour window (old theme parity)", () => {
    expect(isFreshUpdate("2026-07-06T09:00:00Z", now)).toBe(true); // 3h ago
    expect(isFreshUpdate("2026-07-06T11:59:00Z", now)).toBe(true); // 1min ago
  });

  it("is stale at or past 4 hours", () => {
    expect(isFreshUpdate("2026-07-06T08:00:00Z", now)).toBe(false); // exactly 4h
    expect(isFreshUpdate("2026-07-05T12:00:00Z", now)).toBe(false); // a day ago
  });

  it("treats slightly-future timestamps as fresh (clock skew)", () => {
    expect(isFreshUpdate("2026-07-06T12:00:30Z", now)).toBe(true);
  });

  it("is never fresh for missing or unparseable dates", () => {
    expect(isFreshUpdate(null, now)).toBe(false);
    expect(isFreshUpdate("", now)).toBe(false);
    expect(isFreshUpdate("not-a-date", now)).toBe(false);
  });
});
