import { describe, expect, it } from "vitest";
import { suggestPlayer } from "./quoteMatch";

const roster = [
  { id: 1, name: "Barrett Colton", nickname: "Bear", slug: "barrett-colton" },
  { id: 2, name: "Dee Valentine", nickname: "", slug: "dee-valentine" },
  { id: 3, name: "Devens Ruiz", nickname: "", slug: "devens-ruiz" },
];

describe("suggestPlayer", () => {
  it("matches exact full name case-insensitively", () => {
    expect(suggestPlayer("barrett colton", roster)?.id).toBe(1);
  });
  it("matches nickname", () => {
    expect(suggestPlayer("Bear", roster)?.id).toBe(1);
  });
  it("matches unique first name", () => {
    expect(suggestPlayer("Barrett", roster)?.id).toBe(1);
  });
  it("returns null on ambiguous first-name prefix", () => {
    // "De" prefixes both Dee and Devens
    expect(suggestPlayer("De", roster)).toBeNull();
  });
  it("returns null on empty or unknown speaker", () => {
    expect(suggestPlayer("", roster)).toBeNull();
    expect(suggestPlayer("Julie", roster)).toBeNull();
  });
});
