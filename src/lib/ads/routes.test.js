import { describe, it, expect } from "vitest";
import { isArticlePath } from "./routes";

describe("isArticlePath", () => {
  it("returns false for the homepage", () => {
    expect(isArticlePath("/")).toBe(false);
  });

  it("returns true for a root-level post slug", () => {
    expect(isArticlePath("/some-post-slug")).toBe(true);
  });

  it("returns true for a root-level post slug with a trailing slash", () => {
    expect(isArticlePath("/some-post-slug/")).toBe(true);
  });

  it("returns false for the live feed updates hub and its sub-pages", () => {
    expect(isArticlePath("/live-feed-updates")).toBe(false);
    expect(isArticlePath("/live-feed-updates/x")).toBe(false);
  });

  it("returns false for the shows hub and its sub-pages", () => {
    expect(isArticlePath("/shows")).toBe(false);
    expect(isArticlePath("/shows/survivor")).toBe(false);
  });

  it("returns false for system/hub routes", () => {
    expect(isArticlePath("/admin/settings")).toBe(false);
    expect(isArticlePath("/users/x")).toBe(false);
    expect(isArticlePath("/category/x")).toBe(false);
    expect(isArticlePath("/page/2")).toBe(false);
    expect(isArticlePath("/become-supporter")).toBe(false);
    expect(isArticlePath("/settings")).toBe(false);
  });

  it("handles non-string input safely", () => {
    expect(isArticlePath(undefined)).toBe(false);
    expect(isArticlePath(null)).toBe(false);
  });
});
