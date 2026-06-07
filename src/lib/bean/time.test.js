import { describe, it, expect } from "vitest";
import { pacificNowLabel, partOfDay } from "./time.js";

describe("partOfDay", () => {
  it("buckets hours into morning/afternoon/evening", () => {
    expect(partOfDay(6)).toBe("morning");
    expect(partOfDay(11)).toBe("morning");
    expect(partOfDay(12)).toBe("afternoon");
    expect(partOfDay(16)).toBe("afternoon");
    expect(partOfDay(17)).toBe("evening");
    expect(partOfDay(23)).toBe("evening");
  });
});

describe("pacificNowLabel", () => {
  it("labels a known instant in Pacific time", () => {
    // 16:25 UTC on 2026-06-03 = 9:25 AM PDT
    const label = pacificNowLabel(new Date("2026-06-03T16:25:00Z"));
    expect(label).toContain("morning");
    expect(label).toMatch(/9:25/);
    expect(label).toContain("Pacific");
  });
});
