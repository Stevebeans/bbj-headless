import { describe, it, expect } from "vitest";
import { buildSeasonFactSheet } from "./factSheets.js";

const SEASON = {
  id: 72769,
  name: "Big Brother 14",
  abbreviation: "BB14",
  slug: "bb14",
  season_number: "14",
  start_date: "2012-07-12",
  end_date: "2012-09-19",
  permalink: "https://bigbrotherjunkies.com/bigbrother-seasons/bb14/",
  winner: { name: "Ian Terry" },
  runner_up: { name: "Dan Gheesling" },
  afp: { name: "Frank Eudy" },
};

const DETAIL = {
  players: [{ name: "Ian Terry" }, { name: "Dan Gheesling" }, { name: "Frank Eudy" }],
  weeks: [
    { week_num: 1, hoh: ["Willie Hantz"], pov: [], noms: ["Frank Eudy", "Kara Monaco"], evicted: ["Kara Monaco"] },
    { week_num: 2, hoh: [], pov: [], noms: [], evicted: [] },
  ],
};

describe("buildSeasonFactSheet", () => {
  it("states winner, runner-up, and AFP plainly", () => {
    const { text } = buildSeasonFactSheet(SEASON, DETAIL);
    expect(text).toContain("Winner: Ian Terry.");
    expect(text).toContain("Runner-up: Dan Gheesling.");
    expect(text).toContain("America's Favorite Player: Frank Eudy.");
  });

  it("includes the cast and week-by-week results, skipping empty weeks", () => {
    const { text } = buildSeasonFactSheet(SEASON, DETAIL);
    expect(text).toContain("Cast (3): Ian Terry, Dan Gheesling, Frank Eudy.");
    expect(text).toContain("Week 1: HoH Willie Hantz; Nominees Frank Eudy, Kara Monaco; Evicted Kara Monaco.");
    expect(text).not.toContain("Week 2"); // all-empty week omitted
  });

  it("maps to the chunker item shape with a relative url", () => {
    const item = buildSeasonFactSheet(SEASON, DETAIL);
    expect(item).toMatchObject({ id: 72769, type: "season", title: "Big Brother 14 (BB14)", url: "/bigbrother-seasons/bb14/" });
  });

  it("tolerates a season with no detail (no weeks/cast)", () => {
    const { text } = buildSeasonFactSheet(SEASON);
    expect(text).toContain("Winner: Ian Terry.");
    expect(text).not.toContain("Cast");
    expect(text).not.toContain("Week");
  });
});
