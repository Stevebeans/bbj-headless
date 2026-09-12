import { describe, it, expect } from "vitest";
import { founderState } from "./founders";

describe("founderState", () => {
  const base = { window_open: true, closes_at: "2026-10-08 16:00:00", lifetime_cap: 50, lifetime_spots_left: 37 };

  it("open window with spots", () => {
    const s = founderState(base, Date.parse("2026-09-10T00:00:00Z"));
    expect(s.open).toBe(true);
    expect(s.soldOut).toBe(false);
    expect(s.spotsLeft).toBe(37);
    expect(s.closesAtMs).toBe(Date.parse("2026-10-08T16:00:00Z"));
  });

  it("sold out but window open", () => {
    const s = founderState({ ...base, lifetime_spots_left: 0 }, Date.now());
    expect(s.open).toBe(true);
    expect(s.soldOut).toBe(true);
  });

  it("closed window", () => {
    const s = founderState({ ...base, window_open: false }, Date.now());
    expect(s.open).toBe(false);
  });

  it("missing payload fails closed", () => {
    expect(founderState(null, Date.now()).open).toBe(false);
    expect(founderState(undefined, Date.now()).open).toBe(false);
  });
});
