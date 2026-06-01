import { describe, it, expect } from "vitest";
import { dedupeBySource } from "./retrieve.js";

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
