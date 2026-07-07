import { describe, it, expect } from "vitest";
import { buildListQuery } from "./adminContent.js";

describe("buildListQuery", () => {
  it("returns empty string when no meaningful params", () => {
    expect(buildListQuery({})).toBe("");
    expect(buildListQuery({ search: "", season: 0, page: 0 })).toBe("");
  });

  it("includes only non-empty params", () => {
    expect(buildListQuery({ status: "trash" })).toBe("?status=trash");
  });

  it("url-encodes search and keeps numeric params", () => {
    const q = buildListQuery({ search: "Jane Doe", season: 67000, page: 2, perPage: 25 });
    expect(q.startsWith("?")).toBe(true);
    expect(q).toContain("search=Jane%20Doe");
    expect(q).toContain("season=67000");
    expect(q).toContain("page=2");
    expect(q).toContain("per_page=25");
  });

  it("drops zero season and zero page", () => {
    const q = buildListQuery({ season: 0, page: 0, status: "publish" });
    expect(q).toBe("?status=publish");
    expect(q).not.toContain("season");
    expect(q).not.toContain("page");
  });
});
