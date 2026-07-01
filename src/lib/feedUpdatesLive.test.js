import { describe, expect, it } from "vitest";
import { mergeUpdates } from "./feedUpdatesLive";

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
});
