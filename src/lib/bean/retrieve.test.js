import { describe, it, expect, vi } from "vitest";

// Mock the network layer so the withText tests exercise only mapping/dedupe logic.
vi.mock("./vectorStore.js", () => ({
  queryText: vi.fn(async () => [
    { id: "post:1#0", score: 0.9, sourceId: 1, type: "post", title: "A", url: "/a", date: "", text: "alpha body" },
    { id: "post:1#1", score: 0.8, sourceId: 1, type: "post", title: "A", url: "/a", date: "", text: "alpha part two" },
    { id: "post:2#0", score: 0.7, sourceId: 2, type: "post", title: "B", url: "/b", date: "", text: "beta body" },
  ]),
}));

import { dedupeBySource, retrieve } from "./retrieve.js";
import { queryText } from "./vectorStore.js";

describe("retrieve withText", () => {
  it("returns one match per source, each carrying its chunk text", async () => {
    const out = await retrieve("q", { withText: true, max: 6 });
    expect(out).toHaveLength(2); // post:1 deduped, post:2 kept
    expect(out[0]).toMatchObject({ sourceId: 1, title: "A", text: "alpha body" });
    expect(out[1]).toMatchObject({ sourceId: 2, text: "beta body" });
  });

  it("requests includeData from the store when withText is set", async () => {
    await retrieve("q", { withText: true });
    expect(queryText).toHaveBeenCalledWith("q", 12, { includeData: true });
  });
});

describe("dedupeBySource", () => {
  it("keeps only the top-scoring chunk per source, preserving order", () => {
    const matches = [
      { id: "post:1#0", sourceId: 1, type: "post", score: 0.9 },
      { id: "post:1#3", sourceId: 1, type: "post", score: 0.8 },
      { id: "season:5#0", sourceId: 5, type: "season", score: 0.7 },
    ];
    const out = dedupeBySource(matches);
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe("post:1#0");
    expect(out[1].id).toBe("season:5#0");
  });
});
