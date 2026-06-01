import { describe, it, expect } from "vitest";
import { detectSeasonRef, shapeSeasonCard } from "./cards.js";

describe("detectSeasonRef", () => {
  it("matches BB14, spaced and unspaced", () => {
    expect(detectSeasonRef("who won bb14?")).toEqual({ number: 14, week: null });
    expect(detectSeasonRef("bb 27 cast")).toEqual({ number: 27, week: null });
  });
  it("matches 'Big Brother 14' and 'season 9'", () => {
    expect(detectSeasonRef("tell me about Big Brother 14")).toEqual({ number: 14, week: null });
    expect(detectSeasonRef("season 9 winner")).toEqual({ number: 9, week: null });
  });
  it("captures a week when present", () => {
    expect(detectSeasonRef("who was HoH week 8 of bb14")).toEqual({ number: 14, week: 8 });
    expect(detectSeasonRef("bb27 wk 3 noms")).toEqual({ number: 27, week: 3 });
  });
  it("returns null when no season is referenced (years don't count)", () => {
    expect(detectSeasonRef("best player ever?")).toBeNull();
    expect(detectSeasonRef("the 2012 finale")).toBeNull();
  });
});

const SEASON = {
  id: 1, name: "Big Brother 14", abbreviation: "BB14", slug: "bb14",
  season_number: "14", start_date: "2012-07-12", end_date: "2012-09-19",
  permalink: "https://bigbrotherjunkies.com/bigbrother-seasons/bb14/",
  winner: { name: "Ian Terry" }, runner_up: { name: "Dan Gheesling" }, afp: { name: "Frank Eudy" },
};

describe("shapeSeasonCard", () => {
  it("builds a season card with winner/runner-up/AFP", () => {
    const c = shapeSeasonCard(SEASON, { number: 14, week: null });
    expect(c.kind).toBe("season");
    expect(c.sub).toBe("2012");
    expect(c.rows[0]).toEqual({ lab: "Winner", cls: "hoh", names: ["Ian Terry"] });
    expect(c.rows[1].names).toEqual(["Dan Gheesling"]);
    expect(c.url).toBe("/bigbrother-seasons/bb14/");
  });

  it("builds a week card when the week exists in the detail", () => {
    const detail = { weeks: [{ week_num: 8, hoh: ["Ian Terry"], pov: ["Frank Eudy"], noms: ["Ashley", "Frank"], evicted: ["Ashley"] }] };
    const c = shapeSeasonCard(SEASON, { number: 14, week: 8 }, detail);
    expect(c.kind).toBe("week");
    expect(c.sub).toBe("Week 8");
    expect(c.rows[0]).toEqual({ lab: "HoH", cls: "hoh", names: ["Ian Terry"] });
    expect(c.evicted).toEqual(["Ashley"]);
  });

  it("falls back to a season card when the requested week is missing", () => {
    const c = shapeSeasonCard(SEASON, { number: 14, week: 99 }, { weeks: [] });
    expect(c.kind).toBe("season");
  });
});
